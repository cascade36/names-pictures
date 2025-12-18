// 图片生成服务 - 封装Nano Banana Pro API调用
const axios = require('axios');

class ImageGeneratorService {
    constructor(apiKey, baseURL = 'https://api.kie.ai') {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.axios = axios.create({
            baseURL: baseURL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    // 生成图片（使用Nano Banana Pro的两步流程）
    async generateImage(prompt, options = {}) {
        try {
            // 步骤1：创建任务
            const taskPayload = {
                model: 'nano-banana-pro',
                input: {
                    prompt: prompt,
                    image_input: options.image_input || [],
                    aspect_ratio: options.aspect_ratio || (options.isNewspaper ? '3:4' : '1:1'),  // 小报用3:4接近A4比例
                    resolution: options.resolution || '2K',
                    output_format: 'png'
                },
                callBackUrl: options.callback_url || undefined
            };

            console.log('创建Nano Banana Pro任务...');
            const response = await this.axios.post('/api/v1/jobs/createTask', taskPayload);

            if (response.data.code !== 200) {
                throw new Error(`创建任务失败: ${response.data.msg}`);
            }

            const taskId = response.data.data.taskId;

            // 步骤2：轮询任务状态
            const result = await this.pollTaskStatus(taskId);

            return {
                success: true,
                taskId: taskId,
                data: result,
                imageUrl: result.resultUrls ? result.resultUrls[0] : null,
                status: result.state
            };

        } catch (error) {
            console.error('图片生成失败:', error.response?.data || error.message);
            throw new Error(`图片生成失败: ${error.response?.data?.msg || error.message}`);
        }
    }

    // 轮询任务状态
    async pollTaskStatus(taskId, maxAttempts = 60, interval = 3000) {
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await this.axios.get(`/api/v1/jobs/recordInfo?taskId=${taskId}`);

                if (response.data.code !== 200) {
                    throw new Error(`查询任务失败: ${response.data.msg}`);
                }

                const data = response.data.data;

                // 解析结果
                let result = null;
                if (data.resultJson) {
                    try {
                        result = JSON.parse(data.resultJson);
                    } catch (e) {
                        console.error('解析结果JSON失败:', e);
                    }
                }

                // 检查任务状态
                if (data.state === 'success') {
                    console.log('任务完成，耗时:', data.costTime + 'ms');
                    return {
                        state: data.state,
                        resultUrls: result ? result.resultUrls : [],
                        costTime: data.costTime,
                        completeTime: data.completeTime,
                        param: data.param
                    };
                } else if (data.state === 'fail') {
                    throw new Error(`任务失败: ${data.failMsg}`);
                }

                // 继续等待
                attempts++;
                await new Promise(resolve => setTimeout(resolve, interval));

            } catch (error) {
                console.error(`查询任务状态失败 (尝试 ${attempts + 1}):`, error.message);
                if (attempts >= maxAttempts - 1) {
                    throw error;
                }
                attempts++;
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }

        throw new Error('任务超时，请重试');
    }

    // 异步生成图片（兼容接口）
    async generateImageAsync(prompt, taskId, options = {}) {
        try {
            // 调用新的生成方法
            const result = await this.generateImage(prompt, options);

            // 转换为旧格式的任务数据
            const taskData = {
                id: taskId || result.taskId,
                status: result.status === 'success' ? 'completed' :
                        result.status === 'fail' ? 'failed' : 'processing',
                imageUrl: result.imageUrl,
                prompt: prompt,
                createdAt: new Date(),
                completedAt: result.status === 'success' ? new Date() : null
            };

            return taskData;

        } catch (error) {
            return {
                id: taskId,
                status: 'failed',
                error: error.message,
                createdAt: new Date()
            };
        }
    }

    // 批量生成图片
    async generateBatch(prompts, options = {}) {
        const results = [];
        const batchSize = options.batchSize || 3; // 并发限制

        for (let i = 0; i < prompts.length; i += batchSize) {
            const batch = prompts.slice(i, i + batchSize);
            const batchPromises = batch.map(prompt =>
                this.generateImage(prompt, options).catch(error => ({
                    success: false,
                    error: error.message
                }))
            );

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // 避免API限流
            if (i + batchSize < prompts.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    // 估算处理时间（基于提示词长度）
    estimateProcessingTime(prompt) {
        const baseTime = 10; // 基础时间10秒
        const extraTime = Math.floor(prompt.length / 100) * 5; // 每100字符增加5秒
        return baseTime + extraTime;
    }

    // 获取生成历史
    async getGenerationHistory(taskId) {
        // 这里应该查询数据库或缓存
        // 示例实现
        return {
            id: taskId,
            status: 'found',
            // ... 其他属性
        };
    }

    // 检查API配额
    async checkQuota() {
        try {
            const response = await this.axios.get('/usage');
            return {
                remaining: response.data.remaining,
                used: response.data.used,
                limit: response.data.limit
            };
        } catch (error) {
            // Kie.ai 的 Nano Banana Pro 文档未包含配额接口；遇到 404 时静默忽略，避免干扰健康检查日志
            if (error.response?.status !== 404) {
                console.error('获取配额信息失败:', error.message);
            }
            return null;
        }
    }
}

module.exports = ImageGeneratorService;
