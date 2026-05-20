# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

前后端全栈开发模拟器：纯 Node.js（无任何 npm 依赖）实现的零持久化 SQL 模拟器 + 浏览器内 JavaScript 沙箱学习工具。所有"数据库"都是内存里的 JS 对象，会话状态保存在浏览器 `localStorage`，不写真实磁盘数据。

## 常用命令

```bash
# 本地启动（需要 Node 18+）
node server.js          # 等价 npm start

# Docker 启动（首选部署方式）
docker compose up -d --build

# 单独 Docker 命令
docker build -t mysql-simulator .
docker run -d -p 3000:3000 -e SQLM_SECRET=... -e WEB_UPDATE_TOKEN=... mysql-simulator
```

仓库**没有测试套件、lint 或构建步骤**——`server.js` 是直接 `require` 的源文件，前端是静态文件。修改后用 `node server.js` 启动并打开 `http://localhost:3000` 验证。

## 架构

### 单体后端（[server.js](server.js)，~3200 行）

整体是一个文件、一个 `http.createServer`，没有 Express、没有路由库。关键设计：

- **入口与分发**：[createServer()](server.js) 把 `/api/*` 路由到 [handleApi()](server.js)，其余走 [serveStatic()](server.js)。所有 API 在 `handleApi` 内用一长串 `if (method === ... && pathname === ...)` 串行匹配。新增接口要加在这个函数里。
- **状态模型**：[createInitialState()](server.js) 返回 demo 数据库 + 空的 `userVariables`/`procedures`/`functions`。模块顶层有一个全局 `let state`。**重要**：`/api/state` 与 `/api/query` 等接口在每次请求开始都会用客户端 payload 调用 `loadRequestState()` 重置 state，再用 `stateResponse()` 回写 `clientState`——服务端无状态，真正的"会话"在浏览器 `localStorage`。新增任何持久字段都要同步改 [createInitialState()](server.js)、[validateImportedState()](server.js) 和 [executeBegin/Rollback](server.js) 的快照字段，否则导入和事务回滚会丢东西。
- **SQL 执行管线**：`executeSql → splitStatements → executeStatement` 正则分发到约 25 个 `execute*` 处理器。`splitStatements` 支持 `DELIMITER //`，遇到自定义分隔符时按它切，仅识别行首位置的指令。
- **表达式 / 函数**：手写词法-语法-求值三段式（`tokenizeExpression → parseExpression → evaluateExpression`），支持算术、比较、逻辑、`BETWEEN/IN/LIKE/IS NULL`、`CASE WHEN`、嵌套函数调用、`@user_var`、`@@system_var`。标量函数表 `SCALAR_FUNCTIONS`（约 40 个：CONCAT/LENGTH/UPPER/SUBSTRING/IFNULL/COALESCE/IF/ROUND/NOW/DATE_FORMAT…），聚合通过 `AGGREGATE_FUNCTIONS` 集合 + `evaluateExpression` 在 `executeSelect` 的分组上下文里计算。新增函数加到 `SCALAR_FUNCTIONS` 即可，无需改 parser。
- **存储过程/函数**：`CREATE PROCEDURE/FUNCTION` 仅登记元数据（`state.procedures`/`state.functions`），保存原始 body 文本。`CALL` 把入参写入 `@user_var` 然后返回 mock 消息——**不真正执行过程体**，这是有意为之：执行 BEGIN…END/IF/WHILE 需要写一个 PL/SQL 解释器，目前不在范围内。`SHOW PROCEDURE/FUNCTION STATUS` 与 `SHOW CREATE PROCEDURE/FUNCTION` 都基于这份元数据。
- **WHERE/JOIN**：WHERE 走 `evaluateExpression`（不是老的 `matchesWhere/evaluateClause` 字符串拼接），UPDATE/DELETE 同理。**没有** JOIN/子查询/视图/触发器，文档里别承诺。
- **`.sqlm` 加密**：AES-256-GCM，密钥由 `SQLM_SECRET` 经 SHA-256 派生。导入/导出走 `encryptSqlm/decryptSqlm`。
- **Web 更新**：`POST /api/update` → `runWebUpdate()` 通过 `wget` 拉 GitHub tarball 并替换 `server.js`/`public/`，由 `WEB_UPDATE_TOKEN` 鉴权。**修改部署文件结构时同步改这里**——它硬编码了拷贝哪些文件。
- **分享链接**：60 分钟 TTL，存内存 `Map`，重启即失效。`analyzeSharedSql/analyzeSharedJs` 做内容安全检查，分享审计写 `share-audit.log`。`analyzeSharedJs` 现在按 `interpreter` 分流（`html-js` / `nodejs` / `html-preview`），新增 interpreter 模式时记得加一支。
- **客户端 IP**：`getClientIp()` 仅当 `TRUST_PROXY=true` 才信任 `X-Forwarded-For`；`maskIpAddress()` 用于水印展示。`GET /api/whoami` 返回 `{ ip, maskedIp, trustProxy, forwardedFor, realIp }`，前端 JS 网页预览模式拿它注入完整 IP 水印。

### 静态前端（[public/](public/)）

三个独立页面共享一套 CSS：

- [index.html](public/index.html) — 落地页/介绍页
- [console.html](public/console.html) + [app.js](public/app.js) — SQL 操作台。三种 UI 模式（NaviCat 模拟 / 普通 SQL / Terminal）和深色主题切换都在 `applyConsolePrefs()` 里。SQL 高亮、补全、行号编辑器全部手写，没有 Monaco/CodeMirror。
- [js.hsml](public/js.hsml) + [js-tool.js](public/js-tool.js) — 三种解释器模式：
  - **HTML JS 解释器**：从 `<script>` 提取 JS，丢进 Web Worker 执行，拦截 `fetch`/`XMLHttpRequest`/`localStorage`/`eval` 等。
  - **NodeJS 解释器**：只接受纯 JS 文本，同样进 Worker。
  - **网页预览模式**：把整段 HTML/CSS/JS 渲染到 `<iframe sandbox="allow-scripts">`。注入脚本会在 iframe 内禁用 `fetch`/`XHR`/`WebSocket`/`localStorage`/`document.cookie`/`eval`/`Function`，并叠加由 `/api/whoami` 拿来的**完整 IP** 平铺水印。`<iframe>`/`<object>`/跳转 meta 在分析阶段直接拒绝。新增解释器要同时改前端的 `applyInterpreterMode/extractJavaScript/analyzeJavaScript` 和服务端的 `extractSharedJavaScript` 白名单。
- [version.js](public/version.js) — 全站底部版本检测/更新历史浮窗
- `.hsml` 是自定义后缀但 MIME 当 `text/html` 处理，见 [MIME_TYPES](server.js)

**路由小细节**：`/share/<token>` 和 `/js-share/<token>` 都由 `serveStatic()` 重写到 `console.html`/`js.hsml`，前端再用 `getShareTokenFromLocation()` 从 URL 取 token 拉数据。

### 部署

- [Dockerfile](Dockerfile) 基于 `node:22-alpine`，build args `APP_VERSION`/`APP_REVISION` 会写入 `.current-revision` 供 web 更新比对用。
- [.github/workflows/docker.yml](.github/workflows/docker.yml) 推送 `main`/`master` 或 `v*.*.*` tag 时自动构建并推到 `ghcr.io/summerxdsss/mysqlsimulator`。
- 部署前必须改 [docker-compose.yml](docker-compose.yml) 里的 `SQLM_SECRET` 和 `WEB_UPDATE_TOKEN`。

## 开发要点

- **零依赖原则**：`package.json` 没有 `dependencies`，引入第三方包前先确认是否真的必要——这是项目刻意维持的属性。
- **没有 ORM**：所有 SQL 解析走正则。改 SQL 行为前阅读 [executeStatement()](server.js#L1262) 的分发表理解全貌。
- **改了 `server.js`/`public/` 结构**：检查 [runWebUpdate()](server.js#L1003) 的拷贝清单是否还对得上，否则线上 web 更新会装错文件。
- **版本号**：`package.json` 的 `version` 同时是 Docker `APP_VERSION` 和前端版本检测显示值，发版要一并更新。
