# 儿童识字小报生成器 - 使用指南

## 📋 系统架构

本项目采用前后端分离架构：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (HTML/CSS/JS)   │    │   后端 (Node.js)   │    │   Kie.ai API    │
│                      │────│                      │────│                  │
│  - 用户界面          │    │  - API服务        │    │  - Nano Banana Pro │
│  - 管理后台          │    │  - 任务管理        │    │  - 图像生成       │
│  - 历史记录          │    │  - 提示词生成      │    │                  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 1. 获取 Kie.ai API Key

1. 访问 [Kie.ai](https://kie.ai/)
2. 注册并登录
3. 前往 [API Key管理页面](https://kie.ai/api-key)
4. 创建新的API Key
5. 复制API Key备用

### 2. 配置后端

```bash
# 进入后端目录
cd examples

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量文件（Windows）
notepad .env

# 编辑环境变量文件（Mac/Linux）
nano .env
```

在 `.env` 文件中填入：

```env
KIE_API_KEY=your_kie_ai_api_key_here
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/newspaper
```

### 3. 启动后端服务

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

后端服务将在 `http://localhost:3000` 启动

### 4. 启动前端

```bash
# 进入前端目录
cd ../frontend

# 使用任意Web服务器启动，例如：
# Python 3
python -m http.server 8000

# 或使用 Node.js 的 http-server
npx http-server -p 8000

# 或使用 PHP
php -S localhost:8000
```

前端将在 `http://localhost:8000` 启动

### 5. 访问应用

- **用户界面**: http://localhost:8000
- **管理后台**: http://localhost:8000/admin.html
- **API文档**: http://localhost:3000/api/docs

## 🔧 Docker 部署

### 使用 Docker Compose（推荐）

```bash
# 在项目根目录
docker-compose up -d
```

### 使用 Docker

```bash
# 构建镜像
docker build -t children-newspaper-api .

# 运行容器
docker run -d \
  --name newspaper-api \
  -p 3000:3000 \
  -e KIE_API_KEY=your_api_key \
  children-newspaper-api
```

## 📝 使用说明

### 生成识字小报

1. **选择主题**：从下拉菜单选择场景（超市、医院、公园等）
2. **输入标题**：给小报起一个有趣的名字
3. **选择风格**：卡通、水彩或简约风格
4. **添加词汇**（可选）：输入额外的词汇，用逗号分隔
5. **点击生成**：AI将自动生成带拼音标注的识字小报

### 管理后台功能

1. **仪表盘**：查看任务统计和趋势图
2. **主题管理**：添加、编辑、删除主题
3. **任务管理**：查看所有生成任务的状态
4. **统计分析**：查看成功率和平均生成时间
5. **系统设置**：配置API参数和性能选项

## 🛠️ 故障排除

### API连接失败

1. 检查API Key是否正确
2. 确认账户余额充足
3. 验证网络连接正常
4. 查看后端日志错误信息

### 图片生成失败

1. 检查提示词是否符合规范
2. 确认主题词汇已正确配置
3. 查看任务队列状态
4. 重新提交任务

### 前端无法访问后端

1. 确认后端服务正在运行（端口3000）
2. 检查CORS配置
3. 验证API_BASE_URL配置

## 📊 API调用流程

```
用户请求 → 生成提示词 → 创建Nano Banana Pro任务 → 轮询任务状态 → 获取图片URL → 返回结果
    │              │                    │                      │               │
    │              │                    │                      │               │
    ▼              ▼                    ▼                      ▼               ▼
  前端表单    →   prompt-generator    →   image-generator      →   返回图片     →   展示结果
                           .js                .js
```

## 🔑 API调用示例

```javascript
// 1. 创建生成任务
POST /api/v1/newspaper/generate
{
    "theme": "超市",
    "title": "快乐购物",
    "style": "cartoon"
}

// 2. 查询任务状态
GET /api/v1/newspaper/task/{taskId}

// 3. 获取支持的主题
GET /api/v1/newspaper/themes
```

## 📈 性能优化建议

1. **后端优化**：
   - 使用Redis缓存频繁查询的数据
   - 实现任务队列处理
   - 配置适当的并发限制

2. **前端优化**：
   - 启用CDN加速
   - 压缩静态资源
   - 实现懒加载图片

3. **API调用优化**：
   - 合理设置轮询间隔
   - 使用Webhook回调减少轮询
   - 批量处理相似请求

## 🔒 安全注意事项

1. **API密钥安全**：
   - 不要在前端暴露API密钥
   - 使用环境变量存储敏感信息
   - 定期轮换API密钥

2. **输入验证**：
   - 验证所有用户输入
   - 限制提示词长度
   - 过滤恶意内容

3. **访问控制**：
   - 实现用户认证
   - 设置请求频率限制
   - 记录访问日志

## 📞 技术支持

如果遇到问题，请：

1. 查看控制台错误日志
2. 检查Kie.ai账户状态
3. 确认系统要求已满足
4. 联系技术支持

**联系方式**：
- Kie.ai支持：support@kie.ai
- 项目Issues：在GitHub提交问题

---

🎉 祝您使用愉快！让孩子们在趣味中学习汉字！