# 前后端全栈开发模拟器

## Docker 运行

```bash
docker compose up -d --build
```

访问：

```text
http://服务器IP:3000
http://服务器IP:3000/console.html
http://服务器IP:3000/js.hsml
```

首次打开会创建默认 `demo` 数据库，内置客户、商品、订单等示例表。每个浏览器会把自己的模拟状态保存在本地，不会和其他用户共享。

操作台支持 `NaviCat UI 模拟模式`、`普通 SQL 语句模式` 和 `Terminal 模式`。NaviCat 模式会显示连接窗口、查询标签、对象工具栏和数据网格；Terminal 模式偏命令行输入。首次进入 `/console.html` 会显示使用提示，并在当前浏览器记录已读状态。右上角设置可以切换模式、数据库应用、IDE 主题、显示可视化数据，以及打开可视化转 SQL 侧栏。介绍页和操作台都支持深色模式。

`/js.hsml` 是同套界面风格的 HTMLJavaScript 学习工具，可粘贴 HTML，但只提取和执行 JavaScript 内容。页面提供 VSCode 风格行号编辑器、语法高亮、代码补全、括号 / script 自动补全、格式化、导入、导出和 60 分钟短效分享链接。代码会在 Worker 沙箱中运行，并拦截网络请求、文件读写、本地存储、动态执行、父窗口访问和 DOM 写入等高风险 API。

操作台的“导入/导出”菜单支持导入 `.sql`、导出当前编辑器 SQL、导入/导出加密 `.sqlm`，也可以创建 60 分钟短效分享链接。分享会检查非法控制字符、零宽/方向控制字符、疑似脚本片段、SQL 注释符和高风险管理指令。分享发起 IP 会写入后台日志和 `share-audit.log`，页面水印只显示打码后的 IP。

部署前建议修改 `docker-compose.yml` 里的 `SQLM_SECRET` 和 `WEB_UPDATE_TOKEN`。前者用于 `.sqlm` 文件加密和解密，后者用于保护网页更新接口。如站点在 Nginx / CDN 后面运行，再把 `TRUST_PROXY` 改成 `true`，这样后台日志会记录代理转发的真实访问 IP。

网页底部会检测 GitHub 最新版本。发现更新后可点击“立即更新”，并输入服务器更新令牌：

网页底部的“更新历史”可以分页查看软件迭代记录，包括更新时间、版本号、短 Hash 和 Commit 内容。

```yaml
WEB_UPDATE_ENABLED: "true"
WEB_UPDATE_RESTART: "true"
WEB_UPDATE_TOKEN: "change-this-update-token-before-deploy"
TRUST_PROXY: "false"
```

如果需要完全公开更新接口，可以显式设置 `WEB_UPDATE_PUBLIC=true`，但不建议在公网服务器使用。

## GitHub 自动打包

推送到 `main` / `master` 或发布 `v*.*.*` tag 后，GitHub Actions 会自动构建 Docker 镜像并推送到 GHCR：

```text
ghcr.io/summerxdsss/mysqlsimulator:latest
ghcr.io/summerxdsss/mysqlsimulator:sha-xxxxxxx
```

## 单独 Docker 命令

```bash
docker build -t mysql-simulator .
docker run -d --name mysql-simulator \
  -p 3000:3000 \
  -e SQLM_SECRET=change-this-secret \
  -e WEB_UPDATE_ENABLED=true \
  -e WEB_UPDATE_RESTART=true \
  -e WEB_UPDATE_TOKEN=change-this-update-token \
  -e TRUST_PROXY=false \
  mysql-simulator
```
