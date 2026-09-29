import { defineStore } from 'pinia';
import { ref } from 'vue';
import { buildCardContext } from '../utils/card-context.js';

function defaultYouxi() {
  return {
    id: 'youxi',
    name: '柚溪',
    title: '写作搭子',
    personality: '温和靠谱的写作伙伴，懂角色卡技术也懂创作。能聊灵感能帮改片段，但不会端着也不撒娇，像群里熟人那种。听到具体需求会给具体建议，没需求就轻松聊。',
    speakStyle: '自称"柚溪"或省略；称对方"你"。语气平实带温度，不堆"呢""啦"等语气词。回应短，3 句以内为主，话题真有料再展开。',
    greeting: '嗨，今天写啥？',
    color: '#86efac',
    apiType: 'openai',
    apiBaseUrl: '',
    apiKey: '',
    apiModel: ''
  };
}

export const useAiNiangStore = defineStore('ainiang', () => {
  const youxi = ref(defaultYouxi());
  // 用户自己选择的 .model3.json 文件绝对路径
  const customModelFile = ref('');

  async function loadConfig() {
    try {
      const settings = await window.cardForgeAPI.loadSettings();
      if (settings.aiNiangYouxi) Object.assign(youxi.value, settings.aiNiangYouxi);

      // 旧版字段迁移（仅迁移 API 配置，人设强制使用新版默认）
      const legacyApi = settings.aiNiangYeli || settings.aiNiangLiangxiao
        || settings.aiNiangWhite || settings.aiNiangBlack || settings.aiNiangAbi;
      if (legacyApi && !settings.aiNiangYouxi?.apiKey) {
        if (legacyApi.apiType) youxi.value.apiType = legacyApi.apiType;
        if (legacyApi.apiBaseUrl) youxi.value.apiBaseUrl = legacyApi.apiBaseUrl;
        if (legacyApi.apiKey) youxi.value.apiKey = legacyApi.apiKey;
        if (legacyApi.apiModel) youxi.value.apiModel = legacyApi.apiModel;
      }

      // Live2D 模型路径迁移
      if (typeof settings.customModelFile === 'string') {
        customModelFile.value = settings.customModelFile;
      } else if (settings.customModelFile?.youxi) {
        customModelFile.value = settings.customModelFile.youxi;
      }

      // 检测旧版残留字段，触发一次保存清理磁盘
      const hasLegacy = settings.aiNiangYeli || settings.aiNiangLiangxiao
        || settings.aiNiangWhite || settings.aiNiangBlack || settings.aiNiangAbi
        || settings.aiNiangSuzuran || settings.customModelPath
        || (settings.customModelFile && typeof settings.customModelFile === 'object');
      if (hasLegacy) saveConfig();
    } catch (e) {}
  }

  async function saveConfig() {
    try {
      const settings = await window.cardForgeAPI.loadSettings();
      settings.aiNiangYouxi = JSON.parse(JSON.stringify(youxi.value));
      settings.customModelFile = customModelFile.value;
      // 清理所有旧版残留字段
      delete settings.aiNiangYeli;
      delete settings.aiNiangLiangxiao;
      delete settings.aiNiangWhite;
      delete settings.aiNiangBlack;
      delete settings.aiNiangAbi;
      delete settings.aiNiangSuzuran;
      delete settings.customModelPath;
      await window.cardForgeAPI.saveSettings(settings);
    } catch (e) {}
  }

  function resetToDefault() {
    youxi.value = defaultYouxi();
    customModelFile.value = '';
  }

  // 用 utils/card-context.js 的统一 helper 拼上下文
  // currentMessage 传当前用户消息，绿灯条目按主 keys 命中才塞
  function buildSystemPrompt(niang, cardStore, currentMessage = '', contextLimits) {
    const n = niang || youxi.value;
    const hasCard = cardStore && cardStore.cardData
      && (cardStore.cardData.name || cardStore.cardData.description
        || cardStore.cardData.personality || cardStore.cardData.first_mes
        || (cardStore.worldEntries && cardStore.worldEntries.length > 0));
    const cardBlock = hasCard
      ? `\n\n——以下是用户正在编辑的角色卡，聊天时可以参考；不要主动复述，用户问到再展开——\n${buildCardContext(cardStore, currentMessage, contextLimits)}`
      : '\n\n（用户当前还没填角色卡内容。）';
    return `你叫"${n.name}"，是用户的写作搭子。
个性：${n.personality}
说话方式：${n.speakStyle}

你的工作不是当客服，而是陪用户写角色卡：可以聊创作、给灵感、改写片段、分析人物、闲聊也行。
你懂 SillyTavern 的所有制作机制（世界书 / 正则 / MVU / EJS / 酒馆助手脚本），但只在用户问到时再展开技术，平时像朋友一样聊。

聊天原则：
- 别套路，别生硬，别动不动列 1234 条
- 回应短一点（一般 1~3 句），话题真有料再展开
- 灵感和闲扯都可以，但别把每句话都拐去推销技术建议
- 用户没问别端建议，但他抛出片段时可以自然给点想法
- 中文，能用日常口语就别端着${cardBlock}`;
  }

  return {
    youxi, customModelFile,
    loadConfig, saveConfig, resetToDefault,
    buildSystemPrompt
  };
});
