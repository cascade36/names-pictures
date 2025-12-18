# 儿童识字小报API服务

基于Kie.ai的儿童识字小报生成API服务，为教育系统提供AI驱动的识字内容生成能力。

## 🚀 功能特点

- 支持多种主题场景（超市、医院、公园等）
- 自动生成带拼音标注的识字小报
- 异步任务处理，支持批量生成
- RESTful API设计，易于集成
- 支持自定义词汇扩展
- 完整的错误处理和日志记录

## 📋 快速开始

### 1. 环境要求

- Node.js 16+
- Redis (可选，用于缓存)
- MongoDB (可选，用于持久化存储)

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必需的配置：
```env
KIE_API_KEY=your_kie_ai_api_key_here
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/newspaper
```

可选（本地演示/测试）：未配置 `KIE_API_KEY` 时，`NODE_ENV!=production` 将自动启用 Mock 图片生成；也可显式配置：
```env
MOCK_IMAGE_GENERATION=true
```

如前端在 `http://localhost:8000` 等端口运行，请将其加入跨域白名单：
```env
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000,http://127.0.0.1:3000
```

### 4. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## 🐳 Docker部署

使用Docker Compose快速部署：

```bash
# 复制环境文件
cp .env.example .env
# 编辑.env文件，填入KIE_AI_API_KEY等配置

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 📖 API文档

### 1. 生成识字小报

**POST** `/api/v1/newspaper/generate`

请求体：
```json
{
    "theme": "超市",
    "title": "快乐购物",
    "style": "cartoon",
    "custom_words": [],
    "callback_url": "https://your-domain.com/callback"
}
```

响应：
```json
{
    "task_id": "uuid",
    "status": "processing",
    "estimated_time": 30,
    "message": "任务已创建，正在处理中"
}
```

### 2. 查询任务状态

**GET** `/api/v1/newspaper/task/{task_id}`

响应：
```json
{
    "task_id": "uuid",
    "status": "completed",
    "result": {
        "image_url": "https://...",
        "word_list": {
            "core": ["收银台", "货架"],
            "items": ["苹果", "牛奶"],
            "environment": ["入口", "出口"]
        },
        "prompt_used": "生成的提示词"
    },
    "completed_at": "2024-01-01T12:00:00Z"
}
```

### 3. 获取支持的主题

**GET** `/api/v1/newspaper/themes`

响应：
```json
{
    "themes": [
        {
            "name": "超市",
            "word_count": 20,
            "sample_words": ["收银台", "货架", "苹果", "牛奶"]
        }
    ],
    "total": 1
}
```

## 🔧 使用示例

### JavaScript/Node.js

```javascript
const axios = require('axios');

// 生成识字小报
async function generateNewspaper() {
    try {
        const response = await axios.post('http://localhost:3000/api/v1/newspaper/generate', {
            theme: '超市',
            title: '快乐购物'
        });

        const taskId = response.data.task_id;

        // 轮询任务状态
        const checkStatus = async () => {
            const status = await axios.get(`http://localhost:3000/api/v1/newspaper/task/${taskId}`);
            if (status.data.status === 'completed') {
                console.log('生成完成:', status.data.result.image_url);
            } else {
                setTimeout(checkStatus, 2000);
            }
        };

        checkStatus();
    } catch (error) {
        console.error('生成失败:', error.message);
    }
}
```

### Python

```python
import requests
import time

def generate_newspaper():
    # 创建任务
    response = requests.post('http://localhost:3000/api/v1/newspaper/generate', {
        'theme': '医院',
        'title': '健康卫士'
    })

    task_id = response.json()['task_id']

    # 查询结果
    while True:
        status = requests.get(f'http://localhost:3000/api/v1/newspaper/task/{task_id}')
        data = status.json()

        if data['status'] == 'completed':
            print('生成完成:', data['result']['image_url'])
            break
        elif data['status'] == 'failed':
            print('生成失败:', data['error'])
            break
        else:
            time.sleep(2)

generate_newspaper()
```

## 🎯 支持的主题

目前支持的主题：
- 超市
- 医院
- 公园

每个主题包含：
- 核心角色与设施（3-5个）
- 常见物品/工具（5-8个）
- 环境与装饰（3-5个）

## 📝 自定义扩展

### 添加新主题

```javascript
// 通过API批量添加
POST /api/v1/newspaper/words/batch
{
    "theme": "动物园",
    "words": {
        "core": ["狮子", "老虎", "猴子"],
        "items": ["香蕉", "竹子", "肉块"],
        "environment": ["笼子", "水池", "草地"]
    }
}
```

### 修改提示词模板

编辑 `ai-docs/pro.md` 文件来自定义提示词模板。

## 🔍 监控和日志

- 健康检查：`GET /health`
- 健康检查（管理后台兼容）：`GET /api/v1/health`
- 访问日志：`logs/access.log`
- 错误日志：`logs/error.log`

## 🛡️ 安全特性

- API密钥认证
- 请求速率限制
- 输入验证和过滤
- CORS保护
- 头部安全设置

## 📊 性能优化

- 异步任务队列
- Redis缓存
- 批量处理
- 超时控制
- 连接池管理

## 🤝 贡献指南

1. Fork仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

## 🆘 支持

如有问题，请提交Issue或联系：
- 邮箱：support@example.com
- 文档：[API文档](http://localhost:3000/api/docs)
