// 主服务器文件 - Express API服务器
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const NewspaperController = require('./newspaper-controller');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

function parseAllowedOrigins(value) {
    if (!value) return null;
    const origins = value
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
    return origins.length ? origins : null;
}

function normalizeUrlPort(url) {
    if (url.port) return url.port;
    return url.protocol === 'https:' ? '443' : '80';
}

function hostsEquivalent(hostA, hostB) {
    const a = (hostA || '').toLowerCase();
    const b = (hostB || '').toLowerCase();
    const loopbacks = new Set(['localhost', '127.0.0.1', '::1']);
    if (loopbacks.has(a) && loopbacks.has(b)) return true;
    return a === b;
}

function originsMatch(allowedOrigin, requestOrigin) {
    if (!allowedOrigin || !requestOrigin) return false;
    if (allowedOrigin === '*' || requestOrigin === '*') return true;

    try {
        const allowedUrl = new URL(allowedOrigin);
        const requestUrl = new URL(requestOrigin);

        return (
            allowedUrl.protocol === requestUrl.protocol &&
            normalizeUrlPort(allowedUrl) === normalizeUrlPort(requestUrl) &&
            hostsEquivalent(allowedUrl.hostname, requestUrl.hostname)
        );
    } catch (_) {
        // Fallback to literal match if URL parsing fails
        return allowedOrigin === requestOrigin;
    }
}

// 安全中间件
app.use(helmet());
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(cors({
    origin: (origin, callback) => {
        // 允许非浏览器请求（如 curl / server-to-server）
        if (!origin) return callback(null, true);

        // file:// 场景（Origin: null）仅在非生产环境允许
        if (origin === 'null' && process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // 未配置 ALLOWED_ORIGINS 时，默认放行（方便本地开发）
        if (!allowedOrigins) return callback(null, true);

        if (
            allowedOrigins.includes('*') ||
            allowedOrigins.includes(origin) ||
            allowedOrigins.some(allowed => originsMatch(allowed, origin))
        ) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: false
}));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    message: {
        error: '请求过于频繁，请稍后再试'
    }
});
app.use('/api/', limiter);

// 日志中间件
app.use(morgan('combined'));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 初始化控制器
const kieApiKey = process.env.KIE_API_KEY;
if (!kieApiKey) {
    const mockEnv = process.env.MOCK_IMAGE_GENERATION;
    const mockImageGeneration =
        mockEnv === 'true'
            ? true
            : mockEnv === 'false'
              ? false
              : process.env.NODE_ENV !== 'production';

    console.warn(
        mockImageGeneration
            ? '警告: 未设置 KIE_API_KEY，将启用 MOCK 图片生成（仅用于本地开发演示）'
            : '警告: 未设置 KIE_API_KEY，生成图片相关接口将返回 503（其余接口可正常使用）'
    );
}

const newspaperController = new NewspaperController(kieApiKey);

// API路由文档
app.get('/', (req, res) => {
    res.json({
        name: '儿童识字小报API服务',
        version: '1.0.0',
        description: '基于Kie.ai的儿童识字小报生成API',
        endpoints: {
            'POST /api/v1/newspaper/generate': '生成识字小报',
            'GET /api/v1/newspaper/task/:task_id': '查询任务状态',
            'GET /api/v1/newspaper/themes': '获取支持的主题列表',
            'POST /api/v1/newspaper/words/batch': '批量添加自定义词汇',
            'GET /health': '健康检查'
        },
        documentation: '/api/docs'
    });
});

// API文档页面
app.get('/api/docs', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>识字小报API文档</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
            .method { padding: 5px 10px; color: white; font-weight: bold; }
            .get { background: #61affe; }
            .post { background: #49cc90; }
            pre { background: #f4f4f4; padding: 10px; }
        </style>
    </head>
    <body>
        <h1>儿童识字小报API文档</h1>
        <h2>生成识字小报</h2>
        <div class="endpoint">
            <span class="method post">POST</span> /api/v1/newspaper/generate
            <h3>请求体</h3>
            <pre>{
    "theme": "超市",
    "title": "快乐购物",
    "style": "cartoon",
    "custom_words": [],
    "callback_url": "https://your-domain.com/callback"
}</pre>
            <h3>响应</h3>
            <pre>{
    "task_id": "uuid",
    "status": "processing",
    "estimated_time": 30,
    "message": "任务已创建"
}</pre>
        </div>
        <h2>更多文档...</h2>
    </body>
    </html>
    `);
});

// 核心API路由
// 1. 生成识字小报
app.post('/api/v1/newspaper/generate', (req, res) => {
    newspaperController.generateNewspaper(req, res);
});

// 2. 查询任务状态
app.get('/api/v1/newspaper/task/:task_id', (req, res) => {
    newspaperController.getTaskStatus(req, res);
});

// 3. 获取支持的主题列表
app.get('/api/v1/newspaper/themes', (req, res) => {
    newspaperController.getThemes(req, res);
});

// 4. 健康检查
app.get('/health', (req, res) => {
    newspaperController.healthCheck(req, res);
});

// 4.1 健康检查（兼容管理后台：/api/v1/health）
app.get('/api/v1/health', (req, res) => {
    newspaperController.healthCheck(req, res);
});

// 6. 任务列表与统计（管理后台使用）
app.get('/api/v1/tasks/all', (req, res) => {
    newspaperController.getAllTasks(req, res);
});

app.get('/api/v1/stats', (req, res) => {
    newspaperController.getStats(req, res);
});

// 5. 批量添加自定义词汇（可选功能）
app.post('/api/v1/newspaper/words/batch', (req, res) => {
    try {
        const { theme, words } = req.body;
        if (!theme || !words) {
            return res.status(400).json({
                error: '缺少必要参数: theme 和 words'
            });
        }

        newspaperController.promptGenerator.addCustomWords(theme, words);
        res.json({
            message: '自定义词汇添加成功',
            theme: theme,
            added_words: words
        });
    } catch (error) {
        res.status(500).json({
            error: '添加失败',
            message: error.message
        });
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: '接口不存在',
        message: `路径 ${req.originalUrl} 不存在`
    });
});

if (require.main === module) {
    // 启动服务器
    app.listen(PORT, () => {
        console.log(`
        ╔════════════════════════════╗
        ║  儿童识字小报API服务已启动    ║
        ╠════════════════════════════╣
        ║  端口: ${PORT}                   ║
        ║  环境: ${process.env.NODE_ENV || 'development'}              ║
        ║  API文档: http://localhost:${PORT}/api/docs   ║
        ╚════════════════════════════╝
        `);
    });

    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n正在关闭服务器...');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n正在关闭服务器...');
        process.exit(0);
    });
}

module.exports = app;
