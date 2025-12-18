# VPS 部署（Docker + Caddy）

此方案将前端静态站点 + 后端 API 部署到 VPS，通过 Caddy 自动签发 HTTPS（Let's Encrypt）。

## 0) 前置条件

- 一台 Linux VPS（Ubuntu 22.04/24.04 推荐）
- 你拥有域名解析权限（建议用子域名：`names.nuxnow.com`）
- VPS 防火墙放通 `80/443`

## 1) DNS

给 `names.nuxnow.com` 添加一条 `A` 记录指向 VPS 公网 IP。

## 2) 安装 Docker

按你的发行版安装 Docker / Docker Compose（Ubuntu 推荐用官方仓库或 `get.docker.com`）。

## 3) 拉取代码

```bash
git clone https://github.com/cascade36/names-pictures.git
cd names-pictures
```

## 4) 配置环境变量（生产）

在 `deploy` 目录创建 `.env`（注意：文件名就是 `.env`，无扩展名）：

```bash
cd deploy
cat > .env <<'EOF'
KIE_API_KEY=你的真实KieKey
ALLOWED_ORIGINS=https://names.nuxnow.com
EOF
```

> 如同时支持 `www` 或多个域名，用英文逗号分隔：
> `ALLOWED_ORIGINS=https://names.nuxnow.com,https://www.names.nuxnow.com`

## 5) 配置域名

编辑 `deploy/Caddyfile`，把 `names.nuxnow.com` 改成你的真实域名。

## 6) 启动

```bash
cd deploy
docker compose up -d --build
```

## 7) 验证

- 打开 `https://names.nuxnow.com`
- 健康检查：`https://names.nuxnow.com/health`

查看日志：

```bash
docker compose logs -f api
docker compose logs -f caddy
```

## 8) 付费/会员（需要开发）

当前项目没有“登录/订阅/额度”控制，直接上线会被任何人免费使用。
要做“粉丝收费”，常见做法：

- **订阅支付**：Stripe / Paddle / Lemon Squeezy（国际）或对接国内支付
- **鉴权**：账号体系 + JWT/Session
- **额度**：按月次数/点数扣减，结合 rate limit
- **Webhook**：支付成功回调 → 开通/续费 → 过期降级

如果你确定要走哪家支付（以及是“按次”还是“订阅”），我可以在后端把这套鉴权/计费链路补齐。
