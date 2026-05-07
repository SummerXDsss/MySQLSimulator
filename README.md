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
