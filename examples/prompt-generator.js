// 提示词生成器 - 基于pro.md模板生成AI绘图提示词
const fs = require('fs');
const path = require('path');

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

        // 读取模板
        const templatePath = path.join(__dirname, '../ai-docs/pro.md');
        let template = fs.readFileSync(templatePath, 'utf8');

        // 提取模板中需要替换的部分
        const promptSection = this.extractPromptTemplate(template);

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
        const regex = /```markdown\r?\n([\s\S]*?)\r?\n```/m;
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
