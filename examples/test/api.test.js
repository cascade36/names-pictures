// 测试用例 - API接口测试
const request = require('supertest');

// 强制启用 mock 图片生成，避免测试触发外部 API 调用和异步轮询导致 Jest 不退出
process.env.MOCK_IMAGE_GENERATION = 'true';

const app = require('../server');

describe('儿童识字小报API测试', () => {
    // 测试数据
    const testTheme = '超市';
    const testTitle = '快乐购物';

    describe('POST /api/v1/newspaper/generate', () => {
        it('应该成功创建生成任务', async () => {
            const response = await request(app)
                .post('/api/v1/newspaper/generate')
                .send({
                    theme: testTheme,
                    title: testTitle
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('task_id');
            expect(response.body.status).toBe('processing');
        });

        it('应该拒绝缺少参数的请求', async () => {
            const response = await request(app)
                .post('/api/v1/newspaper/generate')
                .send({
                    theme: testTheme
                    // 缺少 title
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('缺少必要参数');
        });
    });

    describe('GET /api/v1/newspaper/themes', () => {
        it('应该返回支持的主题列表', async () => {
            const response = await request(app)
                .get('/api/v1/newspaper/themes');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('themes');
            expect(Array.isArray(response.body.themes)).toBe(true);
            expect(response.body.themes.length).toBeGreaterThan(0);
        });
    });

    describe('GET /health', () => {
        it('应该返回健康状态', async () => {
            const response = await request(app)
                .get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
        });
    });

    describe('GET /api/v1/health', () => {
        it('应该兼容管理后台健康检查路径', async () => {
            const response = await request(app)
                .get('/api/v1/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
        });
    });

    describe('GET /api/v1/tasks/all', () => {
        it('应该返回任务概览与列表', async () => {
            const response = await request(app)
                .get('/api/v1/tasks/all');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('list');
            expect(Array.isArray(response.body.list)).toBe(true);
        });
    });

    describe('GET /api/v1/stats', () => {
        it('应该返回统计信息', async () => {
            const response = await request(app)
                .get('/api/v1/stats');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('success');
        });
    });
});
