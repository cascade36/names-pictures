// 儿童识字小报生成器 JavaScript

// API配置
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/v1'
    : '/api/v1';

// 全局状态
let currentTaskId = null;
let progressInterval = null;
let historyData = JSON.parse(localStorage.getItem('newspaperHistory') || '[]');

// DOM元素
const elements = {
    form: document.getElementById('newspaperForm'),
    formSection: document.querySelector('.form-section'),
    progressSection: document.getElementById('progressSection'),
    resultSection: document.getElementById('resultSection'),
    resultImage: document.getElementById('resultImage'),
    wordGrid: document.getElementById('wordGrid'),
    historyGrid: document.getElementById('historyGrid'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),
    estimatedTime: document.getElementById('estimatedTime'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modalBody')
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    setupFormSubmit();
    startAutoSave();
});

// 设置表单提交事件
function setupFormSubmit() {
    elements.form.addEventListener('submit', handleFormSubmit);
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(elements.form);
    const data = {
        theme: formData.get('theme'),
        title: formData.get('title'),
        style: formData.get('style'),
        custom_words: formData.get('customWords')
            ? formData.get('customWords').split(',').map(w => w.trim()).filter(w => w)
            : []
    };

    // 验证输入
    if (!validateInput(data)) {
        return;
    }

    try {
        showProgress();
        const response = await fetch(`${API_BASE_URL}/newspaper/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('创建任务失败');
        }

        const result = await response.json();
        currentTaskId = result.task_id;

        // 开始轮询任务状态
        startPolling(result.task_id, result.estimated_time || 30);

    } catch (error) {
        showError('提交失败：' + error.message);
        hideProgress();
    }
}

// 输入验证
function validateInput(data) {
    if (!data.theme) {
        showError('请选择一个主题');
        return false;
    }
    if (!data.title || data.title.length < 2) {
        showError('请输入至少2个字的标题');
        return false;
    }
    if (data.title.length > 20) {
        showError('标题不能超过20个字');
        return false;
    }
    return true;
}

// 显示进度
function showProgress() {
    elements.formSection.classList.add('hidden');
    elements.progressSection.classList.remove('hidden');
    elements.resultSection.classList.add('hidden');

    // 重置进度条
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = 'AI正在为您的孩子创作独特的识字内容...';
}

// 隐藏进度
function hideProgress() {
    elements.progressSection.classList.add('hidden');
    elements.formSection.classList.remove('hidden');
}

// 开始轮询任务状态 - 更新为适配Nano Banana Pro API
function startPolling(taskId, estimatedTime) {
    elements.estimatedTime.textContent = estimatedTime;

    progressInterval = setInterval(async () => {
        try {
            // 调用我们的后端API，后端会处理Nano Banana Pro的轮询
            const response = await fetch(`${API_BASE_URL}/newspaper/task/${taskId}`);

            if (!response.ok) {
                throw new Error('查询状态失败');
            }

            const data = await response.json();

            if (data.status === 'completed') {
                clearInterval(progressInterval);
                showResult(data);
            } else if (data.status === 'failed') {
                clearInterval(progressInterval);
                showError('生成失败：' + (data.error || '未知错误'));
                hideProgress();
            } else {
                // 更新进度文本
                const progressTexts = [
                    '正在创建Nano Banana Pro任务...',
                    'AI正在理解您的需求...',
                    '正在生成提示词...',
                    '正在调用图像生成服务...',
                    '等待任务队列处理...',
                    '正在生成高质量图片...',
                    '即将完成...'
                ];

                const randomIndex = Math.floor(Math.random() * progressTexts.length);
                elements.progressText.textContent = progressTexts[randomIndex];

                // 更新进度条（模拟）
                const currentWidth = parseInt(elements.progressFill.style.width) || 0;
                if (currentWidth < 90) {
                    elements.progressFill.style.width = (currentWidth + 10) + '%';
                }
            }
        } catch (error) {
            console.error('轮询失败:', error);
            showError('查询任务状态失败');
            clearInterval(progressInterval);
            hideProgress();
        }
    }, 5000); // Nano Banana Pro处理时间较长，改为5秒轮询一次
}

// 更新进度
function updateProgress() {
    const progressTexts = [
        'AI正在理解您的需求...',
        '正在生成词汇列表...',
        '正在创建卡通场景...',
        '正在添加拼音标注...',
        '正在优化画面细节...',
        '即将完成...'
    ];

    const currentIndex = Math.floor(Math.random() * progressTexts.length);
    elements.progressText.textContent = progressTexts[currentIndex];

    // 模拟进度条（实际应该从后端获取）
    const currentWidth = parseInt(elements.progressFill.style.width) || 0;
    if (currentWidth < 90) {
        elements.progressFill.style.width = (currentWidth + 5) + '%';
    }
}

// 显示结果
function showResult(data) {
    hideProgress();
    elements.resultSection.classList.remove('hidden');

    // 显示图片
    elements.resultImage.src = data.result.image_url;
    elements.resultImage.onload = () => {
        // 图片加载完成后显示动画
        elements.resultImage.style.animation = 'slideUp 0.5s ease';
    };

    // 显示词汇列表
    displayWords(data.result.word_list);

    // 保存到历史记录
    saveToHistory({
        id: data.task_id,
        theme: data.theme,
        title: data.title,
        imageUrl: data.result.image_url,
        createdAt: new Date().toISOString(),
        words: data.result.word_list
    });
}

// 显示词汇列表
function displayWords(wordList) {
    elements.wordGrid.innerHTML = '';

    const allWords = [
        ...wordList.core || [],
        ...wordList.items || [],
        ...wordList.environment || []
    ];

    allWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';

        // 解析拼音和汉字
        const parts = word.match(/^([a-z\s]+)\s([\u4e00-\u9fa5]+)$/);
        if (parts) {
            wordItem.innerHTML = `
                <span class="word-chinese">${parts[2]}</span>
                <span class="word-pinyin">${parts[1]}</span>
            `;
        } else {
            wordItem.innerHTML = `<span class="word-chinese">${word}</span>`;
        }

        elements.wordGrid.appendChild(wordItem);
    });
}

// 保存到历史记录
function saveToHistory(item) {
    historyData.unshift(item);
    // 保留最近20条记录
    if (historyData.length > 20) {
        historyData = historyData.slice(0, 20);
    }
    localStorage.setItem('newspaperHistory', JSON.stringify(historyData));
    loadHistory();
}

// 加载历史记录
function loadHistory() {
    elements.historyGrid.innerHTML = '';

    if (historyData.length === 0) {
        elements.historyGrid.innerHTML = '<p style="text-align: center; color: #999;">暂无历史记录</p>';
        return;
    }

    historyData.slice(0, 6).forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.onclick = () => viewHistoryItem(item);

        historyItem.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
            <div class="history-item-title">${item.title}</div>
        `;

        elements.historyGrid.appendChild(historyItem);
    });
}

// 查看历史记录
function viewHistoryItem(item) {
    elements.resultImage.src = item.imageUrl;
    displayWords(item.words);
    elements.formSection.classList.add('hidden');
    elements.resultSection.classList.remove('hidden');

    // 滚动到结果区域
    elements.resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 下载图片
async function downloadImage() {
    try {
        const response = await fetch(elements.resultImage.src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `识字小报_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('图片已下载！');
    } catch (error) {
        showError('下载失败：' + error.message);
    }
}

// 分享图片
async function shareImage() {
    if (navigator.share) {
        try {
            const response = await fetch(elements.resultImage.src);
            const blob = await response.blob();
            const file = new File([blob], '识字小报.png', { type: 'image/png' });

            await navigator.share({
                title: '儿童识字小报',
                text: '来看看我生成的识字小报！',
                files: [file]
            });
        } catch (error) {
            console.log('分享取消或失败');
        }
    } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(elements.resultImage.src).then(() => {
            showSuccess('图片链接已复制到剪贴板！');
        });
    }
}

// 创建新的
function createNew() {
    elements.form.reset();
    elements.resultSection.classList.add('hidden');
    elements.formSection.classList.remove('hidden');
    elements.formSection.scrollIntoView({ behavior: 'smooth' });
}

// 显示错误信息
function showError(message) {
    showToast(message, 'error');
}

// 显示成功信息
function showSuccess(message) {
    showToast(message, 'success');
}

// 显示提示信息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#5cb85c' : '#3498db'};
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// 显示模态框
function showModal(content) {
    elements.modalBody.innerHTML = content;
    elements.modal.classList.remove('hidden');
}

// 关闭模态框
function closeModal() {
    elements.modal.classList.add('hidden');
}

// 显示帮助
function showHelp() {
    const helpContent = `
        <h2>使用帮助</h2>
        <h3>如何生成识字小报？</h3>
        <ol>
            <li>选择一个孩子熟悉的场景主题</li>
            <li>输入一个有趣的标题</li>
            <li>选择喜欢的画面风格</li>
            <li>（可选）添加额外的词汇</li>
            <li>点击"开始生成"等待AI创作</li>
        </ol>
        <h3>小贴士</h3>
        <ul>
            <li>标题建议8-15个字，朗朗上口</li>
            <li>可以选择孩子感兴趣的场景</li>
            <li>生成的图片可以直接下载或分享</li>
            <li>历史记录会自动保存，方便查看</li>
        </ul>
    `;
    showModal(helpContent);
}

// 显示关于
function showAbout() {
    const aboutContent = `
        <h2>关于我们</h2>
        <p>儿童识字小报生成器是一款专为5-9岁儿童设计的识字教育工具。</p>
        <h3>特色功能</h3>
        <ul>
            <li>AI智能生成识字内容</li>
            <li>场景化学习体验</li>
            <li>拼音标注辅助</li>
            <li>多种画风可选</li>
        </ul>
        <h3>技术支持</h3>
        <p>本应用基于 Kie.ai 提供的先进AI技术驱动，确保为孩子们提供高质量的学习内容。</p>
        <p style="margin-top: 20px; text-align: center; color: #666;">
            版本：1.0.0<br>
            © 2024 儿童识字小报生成器
        </p>
    `;
    showModal(aboutContent);
}

// 自动保存草稿
function startAutoSave() {
    const autoSave = () => {
        const formData = {
            theme: document.getElementById('theme').value,
            title: document.getElementById('title').value,
            style: document.querySelector('input[name="style"]:checked')?.value,
            customWords: document.getElementById('customWords').value
        };

        sessionStorage.setItem('newspaperDraft', JSON.stringify(formData));
    };

    // 每30秒自动保存
    setInterval(autoSave, 30000);

    // 表单变化时保存
    elements.form.addEventListener('input', autoSave);

    // 恢复草稿
    const draft = sessionStorage.getItem('newspaperDraft');
    if (draft) {
        const formData = JSON.parse(draft);
        document.getElementById('theme').value = formData.theme || '';
        document.getElementById('title').value = formData.title || '';
        document.getElementById('customWords').value = formData.customWords || '';
        if (formData.style) {
            document.querySelector(`input[name="style"][value="${formData.style}"]`).checked = true;
        }
    }
}

// 点击模态框外部关闭
elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
        closeModal();
    }
});

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    // Esc 关闭模态框
    if (e.key === 'Escape') {
        closeModal();
    }
    // Ctrl/Cmd + Enter 提交表单
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!elements.formSection.classList.contains('hidden')) {
            elements.form.dispatchEvent(new Event('submit'));
        }
    }
});
