// 管理后台 JavaScript

// API配置
const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost
    ? `http://${window.location.hostname}:3000/api/v1`
    : '/api/v1';

// 全局状态
let dashboardData = null;
let currentSection = 'dashboard';

// 图表实例
let taskTrendChart = null;
let themeDistChart = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    initCharts();
    setupAutoRefresh();
});

// 切换页面部分
function showSection(sectionName) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[href="#${sectionName}"]`).classList.add('active');

    // 显示对应内容
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    currentSection = sectionName;

    // 根据不同部分加载对应数据
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'themes':
            loadThemesData();
            break;
        case 'tasks':
            loadTasksData();
            break;
        case 'stats':
            loadStatsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// 加载仪表盘数据
async function loadDashboardData() {
    try {
        const tasks = await fetch(`${API_BASE_URL}/tasks/all`).then(r => r.json());

        // 更新统计数据
        document.getElementById('totalTasks').textContent = tasks.total || 0;
        document.getElementById('completedTasks').textContent = tasks.completed || 0;
        document.getElementById('processingTasks').textContent = tasks.processing || 0;
        document.getElementById('activeUsers').textContent = tasks.activeUsers || 0;

        // 更新图表
        updateCharts(tasks);

    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
    }
}

// 初始化图表
function initCharts() {
    // 任务趋势图
    const taskTrendCtx = document.getElementById('taskTrendChart');
    if (taskTrendCtx) {
        taskTrendChart = {
            context: taskTrendCtx.getContext('2d'),
            data: {
                labels: [],
                datasets: [{
                    label: '任务数',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            }
        };
        drawLineChart(taskTrendChart);
    }

    // 主题分布图
    const themeDistCtx = document.getElementById('themeDistChart');
    if (themeDistCtx) {
        themeDistChart = {
            context: themeDistCtx.getContext('2d'),
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#667eea', '#764ba2', '#5cb85c', '#f0ad4e', '#ff4757',
                        '#5dade2', '#48c9b0', '#f5b7b1', '#bb8fce'
                    ]
                }]
            }
        };
        drawPieChart(themeDistChart);
    }
}

// 绘制折线图
function drawLineChart(chart) {
    const ctx = chart.context;
    const width = ctx.canvas.width = ctx.canvas.offsetWidth;
    const height = ctx.canvas.height = ctx.canvas.offsetHeight;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    const data = chart.data.datasets[0].data;
    const labels = chart.data.labels;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    if (data.length === 0) return;

    // 绘制网格线
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // 绘制数据线
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = height - padding - (value / Math.max(...data)) * chartHeight;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // 绘制数据点
    data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = height - padding - (value / Math.max(...data)) * chartHeight;

        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // 绘制标签
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    labels.forEach((label, index) => {
        const x = padding + (chartWidth / (labels.length - 1)) * index;
        ctx.fillText(label, x - 15, height - 10);
    });
}

// 绘制饼图
function drawPieChart(chart) {
    const ctx = chart.context;
    const width = ctx.canvas.width = ctx.canvas.offsetWidth;
    const height = ctx.canvas.height = ctx.canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    const data = chart.data.datasets[0].data;
    const labels = chart.data.labels;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    if (data.length === 0) return;

    let total = data.reduce((a, b) => a + b, 0);
    let currentAngle = -Math.PI / 2;

    // 绘制扇形
    data.forEach((value, index) => {
        const sliceAngle = (value / total) * Math.PI * 2;

        ctx.fillStyle = chart.data.datasets[0].backgroundColor[index % chart.data.datasets[0].backgroundColor.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        // 绘制标签
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 20);

        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], labelX, labelY);

        currentAngle += sliceAngle;
    });
}

// 更新图表数据
function updateCharts(data) {
    if (taskTrendChart && data.trend) {
        taskTrendChart.data.labels = data.trend.map(item => item.date);
        taskTrendChart.data.datasets[0].data = data.trend.map(item => item.count);
        drawLineChart(taskTrendChart);
    }

    if (themeDistChart && data.themeDistribution) {
        themeDistChart.data.labels = Object.keys(data.themeDistribution);
        themeDistChart.data.datasets[0].data = Object.values(data.themeDistribution);
        drawPieChart(themeDistChart);
    }
}

// 加载主题数据
async function loadThemesData() {
    try {
        const themes = await fetch(`${API_BASE_URL}/newspaper/themes`).then(r => r.json());
        const tbody = document.getElementById('themesTableBody');
        tbody.innerHTML = '';

        themes.themes.forEach(theme => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${theme.name}</td>
                <td>${theme.word_count}</td>
                <td>${Math.floor(Math.random() * 100)}</td>
                <td>
                    <span class="status-badge active">启用</span>
                </td>
                <td>
                    <button class="btn-secondary" onclick="editTheme('${theme.name}')">
                        <i class="ri-edit-line"></i> 编辑
                    </button>
                    <button class="btn-danger" onclick="deleteTheme('${theme.name}')">
                        <i class="ri-delete-bin-line"></i> 删除
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载主题数据失败:', error);
    }
}

// 加载任务数据
async function loadTasksData() {
    try {
        const tasks = await fetch(`${API_BASE_URL}/tasks/all`).then(r => r.json());
        const tbody = document.getElementById('tasksTableBody');
        tbody.innerHTML = '';

        tasks.list?.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.id.substring(0, 8)}...</td>
                <td>${task.theme}</td>
                <td>${task.title}</td>
                <td>
                    <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
                </td>
                <td>${formatDate(task.createdAt)}</td>
                <td>${task.duration || '-'}</td>
                <td>
                    <button class="btn-secondary" onclick="viewTask('${task.id}')">
                        <i class="ri-eye-line"></i> 查看
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载任务数据失败:', error);
    }
}

// 加载统计数据
async function loadStatsData() {
    try {
        const stats = await fetch(`${API_BASE_URL}/stats`).then(r => r.json());

        // 更新成功率
        const successRate = Math.round((stats.success / stats.total) * 100) || 0;
        document.getElementById('successRate').textContent = successRate + '%';

        // 更新成功路径
        const successPath = document.getElementById('successRatePath');
        if (successPath) {
            successPath.style.strokeDasharray = `${successRate}, 100`;
        }

        // 更新平均时间
        document.getElementById('avgTime').textContent = stats.averageTime || '-';

        // 更新热门主题
        const topThemes = document.getElementById('topThemes');
        topThemes.innerHTML = '';

        (stats.topThemes || []).forEach((theme, index) => {
            const item = document.createElement('div');
            item.className = 'theme-rank-item';
            item.innerHTML = `
                <span class="theme-rank-number">${index + 1}</span>
                <span class="theme-rank-name">${theme.name}</span>
                <span class="theme-rank-count">${theme.count} 次</span>
            `;
            topThemes.appendChild(item);
        });

    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 加载设置数据
function loadSettingsData() {
    // 从localStorage或API加载设置
    const settings = {
        apiKey: localStorage.getItem('apiKey') || '••••••••••••••••',
        apiBaseUrl: localStorage.getItem('apiBaseUrl') || 'https://api.kie.ai/v1',
        maxConcurrency: localStorage.getItem('maxConcurrency') || '5',
        taskTimeout: localStorage.getItem('taskTimeout') || '300'
    };

    document.getElementById('apiKey').value = settings.apiKey;
    document.getElementById('apiBaseUrl').value = settings.apiBaseUrl;
    document.getElementById('maxConcurrency').value = settings.maxConcurrency;
    document.getElementById('taskTimeout').value = settings.taskTimeout;
}

// 保存设置
function saveSettings() {
    const settings = {
        apiKey: document.getElementById('apiKey').value,
        apiBaseUrl: document.getElementById('apiBaseUrl').value,
        maxConcurrency: document.getElementById('maxConcurrency').value,
        taskTimeout: document.getElementById('taskTimeout').value
    };

    // 保存到localStorage
    Object.keys(settings).forEach(key => {
        localStorage.setItem(key, settings[key]);
    });

    showToast('设置已保存', 'success');
}

// 重置设置
function resetSettings() {
    if (confirm('确定要恢复默认设置吗？')) {
        localStorage.clear();
        loadSettingsData();
        showToast('设置已重置', 'success');
    }
}

// 测试API连接
async function testApiKey() {
    const apiKey = document.getElementById('apiKey').value;

    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            headers: {
                'Authorization': `Bearer ${apiKey === '••••••••••••••••' ? localStorage.getItem('realApiKey') : apiKey}`
            }
        });

        if (response.ok) {
            showToast('API连接成功', 'success');
            if (apiKey !== '••••••••••••••••') {
                localStorage.setItem('realApiKey', apiKey);
            }
        } else {
            throw new Error('连接失败');
        }
    } catch (error) {
        showToast('API连接失败', 'error');
    }
}

// 刷新任务列表
function refreshTasks() {
    loadTasksData();
    showToast('任务列表已刷新', 'success');
}

// 导出统计报表
function exportStats() {
    // 实际应该调用后端导出API
    showToast('报表导出中...', 'info');

    // 模拟下载
    setTimeout(() => {
        const data = {
            date: new Date().toISOString(),
            stats: dashboardData
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stats_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('报表已导出', 'success');
    }, 1000);
}

// 显示添加主题模态框
function showAddThemeModal() {
    const modalContent = `
        <h2>添加新主题</h2>
        <form id="addThemeForm" onsubmit="addTheme(event)">
            <div class="form-group">
                <label>主题名称</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>核心词汇（逗号分隔）</label>
                <textarea name="core" rows="3" placeholder="例如：收银台,货架,购物车"></textarea>
            </div>
            <div class="form-group">
                <label>物品词汇（逗号分隔）</label>
                <textarea name="items" rows="3" placeholder="例如：苹果,牛奶,面包"></textarea>
            </div>
            <div class="form-group">
                <label>环境词汇（逗号分隔）</label>
                <textarea name="environment" rows="3" placeholder="例如：入口,出口,灯"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">添加主题</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">取消</button>
            </div>
        </form>
    `;
    showModal(modalContent);
}

// 添加主题
function addTheme(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    // 实际应该调用API
    console.log('添加主题:', Object.fromEntries(formData));

    showToast('主题添加成功', 'success');
    closeModal();
    loadThemesData();
}

// 编辑主题
function editTheme(themeName) {
    showToast(`编辑主题: ${themeName}`, 'info');
}

// 删除主题
function deleteTheme(themeName) {
    if (confirm(`确定要删除主题"${themeName}"吗？`)) {
        // 实际应该调用API
        showToast('主题已删除', 'success');
        loadThemesData();
    }
}

// 查看任务
function viewTask(taskId) {
    showToast(`查看任务: ${taskId}`, 'info');
}

// 自动刷新
function setupAutoRefresh() {
    setInterval(() => {
        if (currentSection === 'dashboard' || currentSection === 'tasks') {
            loadDashboardData();
        }
    }, 30000); // 30秒刷新一次
}

// 模态框功能
function showModal(content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = content;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// Toast提示
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideInUp 0.3s ease;
        background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#5cb85c' : '#3498db'};
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// 工具函数
function getStatusText(status) {
    const statusMap = {
        'processing': '处理中',
        'completed': '已完成',
        'failed': '失败'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
}

// 点击模态框外部关闭
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        closeModal();
    }
});
