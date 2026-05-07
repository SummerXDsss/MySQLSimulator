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

部署前建议修改 `docker-compose.yml` 里的 `SQLM_SECRET`，它用于 `.sqlm` 文件加密和解密。网页底部支持检测 GitHub 最新版本，发现更新后可点击“立即更新”。

## GitHub 自动打包

推送到 `main` / `master` 或发布 `v*.*.*` tag 后，GitHub Actions 会自动构建 Docker 镜像并推送到 GHCR：

```text
ghcr.io/summerxdsss/mysqlsimulator:latest
ghcr.io/summerxdsss/mysqlsimulator:sha-xxxxxxx
```

## 单独 Docker 命令

```bash
docker build -t mysql-simulator .
docker run -d --name mysql-simulator -p 3000:3000 -e SQLM_SECRET=change-this-secret mysql-simulator
```
