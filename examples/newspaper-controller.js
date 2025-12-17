// 识字小报API控制器
const express = require('express');
const PromptGenerator = require('./prompt-generator');
const ImageGeneratorService = require('./image-generator');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class NewspaperController {
    constructor(kieApiKey) {
        this.promptGenerator = new PromptGenerator();
        this.imageService = kieApiKey ? new ImageGeneratorService(kieApiKey) : null;
        const mockEnv = process.env.MOCK_IMAGE_GENERATION;
        this.mockImageGeneration =
            mockEnv === 'true'
                ? true
                : mockEnv === 'false'
                  ? false
                  : process.env.NODE_ENV !== 'production' && !kieApiKey;
        // 这里应该连接实际的数据库
        this.taskStore = new Map(); // 临时使用内存存储
    }

    // 生成识字小报
    async generateNewspaper(req, res) {
        try {
            if (!this.imageService && !this.mockImageGeneration) {
                return res.status(503).json({
                    error: '服务未配置',
                    message: '未设置 KIE_API_KEY，无法生成图片；请配置后重试'
                });
            }

            const { theme, title, style = 'cartoon', custom_words = [], callback_url } = req.body;

            // 参数验证
            if (!theme || !title) {
                return res.status(400).json({
                    error: '缺少必要参数: theme 和 title 是必需的'
                });
            }

            // 检查主题是否支持
            const supportedThemes = this.promptGenerator.getSupportedThemes();
            if (!supportedThemes.includes(theme) && custom_words.length === 0) {
                return res.status(400).json({
                    error: `不支持的主题。支持的主题有: ${supportedThemes.join(', ')}`
                });
            }

            // 生成任务ID
            const taskId = uuidv4();

            // 添加自定义词汇
            if (custom_words.length > 0) {
                this.promptGenerator.addCustomWords(theme, custom_words);
            }

            // 生成提示词
            console.log('开始生成提示词...');
            const prompt = this.promptGenerator.generatePrompt(theme, title);

            // 创建任务记录
            const task = {
                id: taskId,
                theme,
                title,
                status: 'processing',
                createdAt: new Date(),
                estimatedTime: this.imageService ? this.imageService.estimateProcessingTime(prompt) : 5,
                callbackUrl: callback_url
            };
            this.taskStore.set(taskId, task);

            // 异步生成图片
            this.generateImageAsync(taskId, prompt, theme, title);

            // 返回任务ID
            res.json({
                task_id: taskId,
                status: 'processing',
                estimated_time: task.estimatedTime,
                message: '任务已创建，正在处理中'
            });

        } catch (error) {
            console.error('生成识字小报失败:', error);
            res.status(500).json({
                error: '生成失败',
                message: error.message
            });
        }
    }

    // 异步生成图片
    async generateImageAsync(taskId, prompt, theme, title) {
        try {
            // 更新任务状态
            const task = this.taskStore.get(taskId);
            if (task) {
                task.status = 'generating';
                this.taskStore.set(taskId, task);
            }

            if (this.mockImageGeneration) {
                const wordList = this.promptGenerator.getThemeWords(theme);
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024"><rect width="100%" height="100%" fill="#f7f7ff"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="28" fill="#333">MOCK IMAGE</text><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="#666">Set KIE_API_KEY for real generation</text></svg>`;
                const imageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                const completedTask = {
                    id: taskId,
                    status: 'completed',
                    imageUrl,
                    prompt,
                    theme,
                    title,
                    wordList: wordList
                        ? {
                              core: wordList.core,
                              items: wordList.items,
                              environment: wordList.environment
                          }
                        : null,
                    createdAt: task?.createdAt || new Date(),
                    completedAt: new Date()
                };
                this.taskStore.set(taskId, completedTask);

                if (task?.callbackUrl) {
                    this.sendCallback(task.callbackUrl, completedTask);
                }
                return;
            }

            // 调用图片生成服务
            const result = await this.imageService.generateImageAsync(prompt, taskId, {
                isNewspaper: true,
                size: '768x1024',
                quality: 'hd'
            });

            // 获取词汇列表
            const wordList = this.promptGenerator.getThemeWords(theme);

            // 更新任务结果
            if (result.status === 'completed') {
                const completedTask = {
                    ...result,
                    theme,
                    title,
                    wordList: {
                        core: wordList.core,
                        items: wordList.items,
                        environment: wordList.environment
                    },
                    prompt: prompt
                };
                this.taskStore.set(taskId, completedTask);

                // 如果有回调URL，发送通知
                if (task.callbackUrl) {
                    this.sendCallback(task.callbackUrl, completedTask);
                }
            } else {
                this.taskStore.set(taskId, result);
            }

        } catch (error) {
            console.error(`任务 ${taskId} 失败:`, error);
            const failedTask = {
                id: taskId,
                status: 'failed',
                error: error.message,
                completedAt: new Date()
            };
            this.taskStore.set(taskId, failedTask);
        }
    }

    // 查询任务状态
    async getTaskStatus(req, res) {
        try {
            const { task_id } = req.params;
            const task = this.taskStore.get(task_id);

            if (!task) {
                return res.status(404).json({
                    error: '任务不存在'
                });
            }

            // 返回任务信息
            const response = {
                task_id: task_id,
                status: task.status,
                created_at: task.createdAt
            };

            if (task.status === 'completed') {
                response.result = {
                    image_url: task.imageUrl,
                    word_list: task.wordList,
                    prompt_used: task.prompt
                };
                response.completed_at = task.completedAt;
            } else if (task.status === 'failed') {
                response.error = task.error;
                response.completed_at = task.completedAt;
            } else {
                response.estimated_time = task.estimatedTime;
            }

            res.json(response);

        } catch (error) {
            console.error('查询任务状态失败:', error);
            res.status(500).json({
                error: '查询失败',
                message: error.message
            });
        }
    }

    // 获取支持的主题列表
    async getThemes(req, res) {
        try {
            const themes = this.promptGenerator.getSupportedThemes();
            const themesWithDetails = themes.map(theme => {
                const words = this.promptGenerator.getThemeWords(theme);
                return {
                    name: theme,
                    word_count: words.core.length + words.items.length + words.environment.length,
                    sample_words: [...words.core.slice(0, 2), ...words.items.slice(0, 2)]
                };
            });

            res.json({
                themes: themesWithDetails,
                total: themes.length
            });
        } catch (error) {
            console.error('获取主题列表失败:', error);
            res.status(500).json({
                error: '获取失败',
                message: error.message
            });
        }
    }

    // 发送回调通知
    async sendCallback(callbackUrl, data) {
        try {
            const axios = require('axios');
            await axios.post(callbackUrl, {
                task_id: data.id,
                status: data.status,
                result: data.status === 'completed' ? {
                    image_url: data.imageUrl,
                    word_list: data.wordList
                } : null,
                error: data.status === 'failed' ? data.error : null
            });
        } catch (error) {
            console.error('回调通知失败:', error);
        }
    }

    // 健康检查
    async healthCheck(req, res) {
        try {
            // 检查API配额
            const quota = this.imageService ? await this.imageService.checkQuota() : null;
            res.json({
                status: this.imageService || this.mockImageGeneration ? 'healthy' : 'degraded',
                timestamp: new Date(),
                quota: quota,
                active_tasks: Array.from(this.taskStore.values()).filter(t => t.status === 'processing' || t.status === 'generating').length,
                kie_api_configured: Boolean(this.imageService),
                mock_image_generation: Boolean(this.mockImageGeneration)
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    }

    // 获取所有任务（管理后台使用）
    async getAllTasks(req, res) {
        try {
            const tasks = Array.from(this.taskStore.values())
                .map(task => {
                    const createdAt = task.createdAt ? new Date(task.createdAt) : null;
                    const completedAt = task.completedAt ? new Date(task.completedAt) : null;
                    const durationSeconds =
                        createdAt && completedAt ? Math.max(0, Math.round((completedAt - createdAt) / 1000)) : null;

                    return {
                        id: task.id,
                        theme: task.theme,
                        title: task.title,
                        status: task.status,
                        createdAt: task.createdAt,
                        completedAt: task.completedAt,
                        duration: durationSeconds != null ? `${durationSeconds}s` : null
                    };
                })
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            const total = tasks.length;
            const completed = tasks.filter(t => t.status === 'completed').length;
            const failed = tasks.filter(t => t.status === 'failed').length;
            const processing = tasks.filter(t => t.status === 'processing' || t.status === 'generating').length;

            res.json({
                total,
                completed,
                failed,
                processing,
                activeUsers: 0,
                list: tasks
            });
        } catch (error) {
            res.status(500).json({
                error: '获取任务列表失败',
                message: error.message
            });
        }
    }

    // 获取统计信息（管理后台使用）
    async getStats(req, res) {
        try {
            const tasks = Array.from(this.taskStore.values());
            const total = tasks.length;
            const success = tasks.filter(t => t.status === 'completed').length;

            const completedTasks = tasks.filter(t => t.status === 'completed' && t.createdAt && t.completedAt);
            const durations = completedTasks.map(t => {
                const createdAt = new Date(t.createdAt);
                const completedAt = new Date(t.completedAt);
                return Math.max(0, Math.round((completedAt - createdAt) / 1000));
            });
            const averageTime = durations.length
                ? Math.round(durations.reduce((sum, v) => sum + v, 0) / durations.length)
                : 0;

            const themeCounts = new Map();
            tasks.forEach(t => {
                if (!t.theme) return;
                themeCounts.set(t.theme, (themeCounts.get(t.theme) || 0) + 1);
            });
            const topThemes = Array.from(themeCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));

            res.json({
                total,
                success,
                failed: tasks.filter(t => t.status === 'failed').length,
                averageTime,
                topThemes
            });
        } catch (error) {
            res.status(500).json({
                error: '获取统计信息失败',
                message: error.message
            });
        }
    }
}

module.exports = NewspaperController;
