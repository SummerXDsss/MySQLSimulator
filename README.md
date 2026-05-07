# SQL Database Simulator

## Docker 运行

```bash
docker compose up -d --build
```

访问：

```text
http://服务器IP:3000
http://服务器IP:3000/console.html
```

首次打开会创建默认 `demo` 数据库，内置客户、商品、订单等示例表。每个浏览器会把自己的模拟状态保存在本地，不会和其他用户共享。

操作台支持 `NaviCat UI 模拟模式`、`普通 SQL 语句模式` 和 `Terminal 模式`。NaviCat 模式会显示连接窗口、查询标签、对象工具栏和数据网格；Terminal 模式偏命令行输入。首次进入 `/console.html` 会显示使用提示，并在当前浏览器记录已读状态。右上角设置可以切换模式、数据库应用、显示可视化数据，以及打开可视化转 SQL 侧栏。

部署前建议修改 `docker-compose.yml` 里的 `SQLM_SECRET`，它用于 `.sqlm` 文件加密和解密。

网页底部会检测 GitHub 最新版本。发现更新后可点击“立即更新”，默认开启网页更新：

```yaml
WEB_UPDATE_ENABLED: "true"
WEB_UPDATE_RESTART: "true"
```

如果旧版本按钮是灰色，通常是服务端没有设置 `WEB_UPDATE_ENABLED=true`。从 `1.1.1` 开始默认允许网页更新；只有显式设置 `WEB_UPDATE_ENABLED=false` 时才会禁用按钮。

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
  mysql-simulator
```
