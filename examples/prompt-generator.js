// 提示词生成器 - 基于pro.md模板生成AI绘图提示词
const fs = require('fs');
const path = require('path');

const DEFAULT_PROMPT_TEMPLATE = `请生成一张儿童识字小报《{{主题/场景}}》，竖版 A4，学习小报版式，适合 5–9 岁孩子 认字与看图识物。

# 一、小报标题区（顶部）

**顶部居中大标题**：《{{标题}}》
* **风格**：十字小报 / 儿童学习报感
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 {{主题/场景}} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「{{主题/场景}}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤。

**场景分区与核心内容**
1.  **核心区域 A（主要对象）**：表现 {{主题/场景}} 的核心活动。
2.  **核心区域 B（配套设施）**：展示相关的工具或物品。
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）。

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 {{主题/场景}} 匹配）。
* **动作**：正在进行与场景相关的自然互动。

# 三、必画物体与识字清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
{{这里请列出你联想到的3-5个核心大词，如：shōu yín yuán 收银员, huò jià 货架...}}

**2. 常见物品/工具：**
{{这里请列出你联想到的5-8个常用物品词，如：píng guǒ 苹果, niú nǎi 牛奶, tuī chē 推车...}}

**3. 环境与装饰：**
{{这里请列出你联想到的3-5个环境词，如：chū kǒu 出口, dēng 灯, qiáng 墙...}}

*(注意：画面中的物体数量不限于此，但以上列表必须作为重点描绘对象)*

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：两行制（第一行拼音带声调，第二行简体汉字）。
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读。
* **排版**：标签靠近对应的物体，不遮挡主体。

# 五、画风参数
* **风格**：儿童绘本风 + 识字小报风
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines.`;

class PromptGenerator {
    constructor() {
        // 场景词汇库 - 每个场景包含15-20个词汇
        this.themeWords = {
            "超市": {
                core: ["shōu yín yuán 收银员", "huò jià 货架", "tuī chē 推车", "shōu yín tái 收银台", "jià qiān 价签"],
                items: ["píng guǒ 苹果", "niú nǎi 牛奶", "miàn bāo 面包", "jī dàn 鸡蛋", "bǐng gān 饼干",
                        "guǒ zhī 果汁", "qiǎo kè lì 巧克力", "shǔ piàn 薯片", "xǐ fà shuǐ 洗发水"],
                environment: ["rù kǒu 入口", "chū kǒu 出口", "dēng 灯", "qiáng 墙", "dì bǎn 地板", "gòu wù dài 购物袋"]
            },
            "医院": {
                core: ["yī shēng 医生", "hù shi 护士", "bìng chuáng 病床", "yào pǐn 药品", "tīng zhěn qì 听诊器"],
                items: ["tǐ wēn jì 体温计", "zhēn tǒng 针筒", "bēng dài 绷带", "yào piàn 药片", "kǒu zhào 口罩",
                        "guà hào dān 挂号单", "bìng lì kǎ 病历卡", "shǒu shù dāo 手术刀", "yào shuǐ 药水"],
                environment: ["děng hòu qū 等候区", "zhěn shì 诊室", "yào fāng 药房", "zǒu láng 走廊",
                            "chuāng hù 窗户", "mén 门", "yǐ zi 椅子", "diàn tí 电梯"]
            },
            "公园": {
                core: ["huā lián huā 滑滑梯", "qiū qiān 秋千", "yuán díng 圆顶", "cháng yǐ 长椅", "lù dèng 路灯"],
                items: ["huā duǒ 花朵", "xiǎo niǎo 小鸟", "hú dié 蝴蝶", "xiǎo māo 小猫", "xiǎo gǒu 小狗",
                        "qi qiú 气球", "fēng zhēng 风筝", "táo qí 跳棋", "pán pán 碰碰车"],
                environment: ["xiǎo lù 小路", "shù mù 树木", "cǎo píng 草坪", "hú chí 湖池",
                            "qiáo liáng 桥梁", "wū dīng 屋顶", "wèi shēng jiān 卫生间"]
            }
        };
    }

    // 生成提示词
    generatePrompt(theme, title) {
        // 获取主题词汇
        const words = this.getThemeWords(theme);
        if (!words) {
            throw new Error(`不支持的主题: ${theme}。支持的主题有: ${Object.keys(this.themeWords).join(', ')}`);
        }

        // 读取模板；如果模板文件缺失/格式异常，则使用内置默认模板避免“提取失败”
        const templatePath = path.join(__dirname, '../ai-docs/pro.md');
        let promptSection = DEFAULT_PROMPT_TEMPLATE;
        try {
            const template = fs.readFileSync(templatePath, 'utf8');
            promptSection = this.extractPromptTemplate(template);
        } catch (_) {
            // ignore and fallback to DEFAULT_PROMPT_TEMPLATE
        }

        // 替换占位符
        let finalPrompt = promptSection
            .replace(/\{\{主题\/场景\}\}/g, theme)
            .replace(/\{\{标题\}\}/g, title);

        // 填充词汇列表
        finalPrompt = finalPrompt
            .replace(/\{\{这里请列出你联想到的3-5个核心大词，如：shōu yín yuán 收银员, huò jià 货架\.\.\.\}\}/g,
                    words.core.join(', '))
            .replace(/\{\{这里请列出你联想到的5-8个常用物品词，如：píng guǒ 苹果, niú nǎi 牛奶, tuī chē 推车\.\.\.\}\}/g,
                    words.items.join(', '))
            .replace(/\{\{这里请列出你联想到的3-5个环境词，如：chū kǒu 出口, dēng 灯, qiáng 墙\.\.\.\}\}/g,
                    words.environment.join(', '));

        return finalPrompt;
    }

    // 获取主题对应的词汇
    getThemeWords(theme) {
        return this.themeWords[theme] || null;
    }

    // 提取提示词模板部分
    extractPromptTemplate(content) {
        // 查找```markdown...```部分
        const regex = /```\s*markdown\r?\n([\s\S]*?)\r?\n```/m;
        const match = content.match(regex);
        if (match) {
            return match[1];
        }
        throw new Error('无法从模板文件中提取提示词模板');
    }

    // 获取所有支持的主题
    getSupportedThemes() {
        return Object.keys(this.themeWords);
    }

    // 添加自定义词汇
    addCustomWords(theme, words) {
        if (!this.themeWords[theme]) {
            this.themeWords[theme] = {
                core: [],
                items: [],
                environment: []
            };
        }

        if (words.core) this.themeWords[theme].core.push(...words.core);
        if (words.items) this.themeWords[theme].items.push(...words.items);
        if (words.environment) this.themeWords[theme].environment.push(...words.environment);
    }
}

module.exports = PromptGenerator;
