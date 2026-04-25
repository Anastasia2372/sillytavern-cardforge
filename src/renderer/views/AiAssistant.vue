<template>
  <div class="page ai-page">
    <div class="page__header flex-between">
      <div>
        <h1>AI 助手</h1>
      </div>
      <div class="flex-row">
        <button v-for="n in niangStore.getAllNiangs()" :key="n.id"
          :class="['btn btn--sm', mode === n.id ? 'btn--primary' : 'btn--secondary']"
          @click="mode = n.id; switchModel(n.id)">{{ n.name }}</button>
        <button class="btn btn--secondary btn--sm" @click="analyzeCard">诊断角色卡</button>
        <button class="btn btn--accent btn--sm" @click="startNewChat">开始新对话</button>
        <button class="btn btn--secondary btn--sm" @click="showHistory = !showHistory; showConfig = false; showModelConfig = false">
          对话记录 ({{ chatHistory.length }})
        </button>
        <button class="btn btn--ghost btn--sm" @click="showConfig = !showConfig; showModelConfig = false; showHistory = false">设置</button>
        <button class="btn btn--ghost btn--sm" @click="showModelConfig = !showModelConfig; showConfig = false; showHistory = false">密钥</button>
      </div>
    </div>

    <!-- 配置面板 -->
    <div v-if="showConfig" class="card mb-md">
      <div class="card__header flex-between">
        <h3>AI 娘配置</h3>
        <div class="flex-row">
          <button class="btn btn--secondary btn--sm" @click="niangStore.resetToDefault(); appStore.toastSuccess('已重置')">恢复默认</button>
          <button class="btn btn--primary btn--sm" @click="niangStore.saveConfig(); showConfig = false; appStore.toastSuccess('已保存')">保存</button>
        </div>
      </div>
      <div class="card__body">
        <div class="grid-3">
          <div v-for="n in niangStore.getAllNiangs()" :key="n.id">
            <h4 :style="{ color: n.color }">{{ n.name }}</h4>
            <div class="form-group"><label>名字</label><input class="input" v-model="n.name"></div>
            <div class="form-group"><label>头衔</label><input class="input" v-model="n.title"></div>
            <div class="form-group"><label>性格</label><textarea class="textarea" v-model="n.personality" rows="3"></textarea></div>
            <div class="form-group"><label>说话方式</label><textarea class="textarea" v-model="n.speakStyle" rows="2"></textarea></div>
            <div class="form-group"><label>打招呼</label><input class="input" v-model="n.greeting"></div>
            <div class="form-group">
              <label>Live2D 模型文件</label>
              <div class="flex-row">
                <input class="input flex-1" :value="niangStore.customModelFile[n.id]" readonly placeholder="未配置 — 点右侧选择 .model3.json">
                <button class="btn btn--secondary btn--sm" @click="selectCustomModel(n.id)">选择</button>
                <button class="btn btn--ghost btn--sm" v-if="niangStore.customModelFile[n.id]" @click="niangStore.customModelFile[n.id] = ''">清除</button>
              </div>
              <div class="hint">选择 .model3.json 文件（同目录下需有对应的 .moc3 和贴图）</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模型 API 设置面板 -->
    <div v-if="showModelConfig" class="card mb-md">
      <div class="card__header flex-between">
        <h3>AI 模型设置</h3>
        <div class="flex-row">
          <button class="btn btn--primary btn--sm" @click="niangStore.saveConfig(); showModelConfig = false; appStore.toastSuccess('已保存')">保存</button>
        </div>
      </div>
      <div class="card__body">
        <p class="hint mb-md">为每个角色配置独立的 AI 模型，留空则使用全局 API 设置</p>
        <div v-for="n in niangStore.getAllNiangs()" :key="n.id" class="model-config-item mb-md">
          <h4 :style="{ color: n.color, cursor: 'pointer' }" @click="modelConfigExpand[n.id] = !modelConfigExpand[n.id]">
            {{ modelConfigExpand[n.id] ? '▼' : '▶' }} {{ n.name }}
          </h4>
          <div v-if="modelConfigExpand[n.id]">
            <div class="grid-2">
              <div class="form-group">
                <label>API 类型</label>
                <select class="select" v-model="n.apiType">
                  <option value="openai">OpenAI 兼容</option>
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="gemini">Gemini (Google)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Base URL</label>
                <input class="input" v-model="n.apiBaseUrl" placeholder="留空跟随全局">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>API Key</label>
                <div class="flex-row">
                  <input :type="showKeys[n.id] ? 'text' : 'password'" class="input flex-1" v-model="n.apiKey" placeholder="留空跟随全局">
                  <button class="btn btn--ghost btn--sm" @click="showKeys[n.id] = !showKeys[n.id]">
                    {{ showKeys[n.id] ? '隐藏' : '显示' }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>模型名称</label>
                <input class="input" v-model="n.apiModel" placeholder="如 gpt-4o, claude-sonnet-4-20250514">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话记录面板 -->
    <div v-if="showHistory" class="card mb-md">
      <div class="card__header flex-between">
        <h3>对话记录</h3>
        <span class="hint">最多保留 100 条</span>
      </div>
      <div class="card__body" style="max-height:400px;overflow-y:auto">
        <div v-if="chatHistory.length === 0" class="hint" style="text-align:center;padding:20px">
          暂无历史对话
        </div>
        <div v-for="(h, i) in chatHistory" :key="i" class="history-item" @click="loadHistory(i)">
          <div class="flex-between">
            <span class="history-item__title">{{ h.title || '无标题对话' }}</span>
            <div class="flex-row">
              <span class="history-item__time">{{ h.time }}</span>
              <button class="btn btn--danger btn--sm" @click.stop="appStore.confirmAction('删除这条对话记录？', () => deleteHistory(i))">x</button>
            </div>
          </div>
          <div class="history-item__preview">{{ h.preview }}</div>
        </div>
      </div>
    </div>

    <!-- 聊天区域 -->
    <div class="card ai-chat-card">
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="chat-welcome">
          <div class="chat-msg chat-msg--ai">
            <div class="chat-msg__content">
              <div class="chat-msg__name" :style="{ color: activeNiang.color }">{{ activeNiang.name }}</div>
              <div class="chat-msg__text">{{ activeNiang.greeting }}</div>
            </div>
          </div>
        </div>

        <div v-for="msg in messages" :key="msg.id"
          :class="['chat-msg', msg.role === 'user' ? 'chat-msg--user' : 'chat-msg--ai']">
          <div class="chat-msg__content">
            <div class="chat-msg__name" :style="{ color: msg.color || '#9896a8' }">{{ msg.name }}</div>
            <div class="chat-msg__text selectable" v-html="formatMsg(msg.content)"></div>
          </div>
        </div>

        <div v-if="loading" class="chat-msg chat-msg--ai">
          <div class="chat-msg__content">
            <div class="chat-msg__text typing">思考中...</div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <textarea class="textarea" v-model="inputText" rows="2"
          placeholder="输入消息... (Enter 发送)"
          @keydown.enter.exact.prevent="send" :disabled="loading"></textarea>
        <button class="btn btn--primary" @click="send" :disabled="loading || !inputText.trim()">发送</button>
      </div>
    </div>

    <!-- Live2D 模型（可拖动，设置面板打开时隐藏） -->
    <div class="model-container"
      v-show="!showConfig && !showModelConfig"
      :class="{ 'is-dragging': dragging === 'model' }"
      :style="{ left: modelPos.x + 'px', top: modelPos.y + 'px' }"
      @mousedown.prevent="startDrag($event, 'model')">
      <canvas ref="sharedCanvas" width="300" height="450"></canvas>
      <div class="model-name" :style="{ color: activeNiang.color }">{{ activeNiang.name }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useCardStore } from '../stores/card.js';
import { useApiStore } from '../stores/api.js';
import { useAppStore } from '../stores/app.js';
import { useAiNiangStore } from '../stores/ainiang.js';

const cardStore = useCardStore();
const apiStore = useApiStore();
const appStore = useAppStore();
const niangStore = useAiNiangStore();

const messages = ref([]);
const inputText = ref('');
const loading = ref(false);
const messagesRef = ref(null);
const mode = ref('youxi');
const showConfig = ref(false);
const showModelConfig = ref(false);
const showHistory = ref(false);
const showKeys = reactive({});
const modelConfigExpand = reactive({});
let msgId = 0;

// 对话历史
const chatHistory = ref([]);
const HISTORY_MAX = 100;

async function loadChatHistory() {
  try {
    const settings = await window.cardForgeAPI.loadSettings();
    chatHistory.value = settings.chatHistory || [];
  } catch (e) {}
}

async function saveChatHistory() {
  try {
    const settings = await window.cardForgeAPI.loadSettings() || {};
    settings.chatHistory = JSON.parse(JSON.stringify(chatHistory.value));
    await window.cardForgeAPI.saveSettings(settings);
  } catch (e) {}
}

function saveCurrentToHistory() {
  if (messages.value.length === 0) return;
  const firstUserMsg = messages.value.find(m => m.role === 'user');
  const title = firstUserMsg ? firstUserMsg.content.slice(0, 30) : '无标题对话';
  const lastMsg = messages.value[messages.value.length - 1];
  const preview = (lastMsg.content || '').slice(0, 50);
  const now = new Date();
  const time = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

  chatHistory.value.unshift({
    title,
    preview,
    time,
    messages: JSON.parse(JSON.stringify(messages.value))
  });

  if (chatHistory.value.length > HISTORY_MAX) {
    chatHistory.value = chatHistory.value.slice(0, HISTORY_MAX);
  }

  saveChatHistory();
}

function handleBeforeUnload() {
  saveCurrentToHistory();
}

function startNewChat() {
  saveCurrentToHistory();
  messages.value = [];
  appStore.toastSuccess('已开始新对话');
}

function loadHistory(index) {
  const h = chatHistory.value[index];
  if (!h) return;
  // 先保存当前对话
  saveCurrentToHistory();
  messages.value = h.messages.map(m => ({ ...m }));
  msgId = Math.max(0, ...messages.value.map(m => m.id || 0)) + 1;
  showHistory.value = false;
  appStore.toastSuccess('已加载历史对话');
  nextTick(() => { if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight; });
}

function deleteHistory(index) {
  chatHistory.value.splice(index, 1);
  saveChatHistory();
}

// Canvas ref (shared)
const sharedCanvas = ref(null);

// 可拖动位置
const modelPos = reactive({ x: 20, y: 300 });

// 当前显示的角色
const activeNiang = computed(() => niangStore.getNiangById(mode.value) || { name: 'AI', color: '#9896a8', greeting: '你好！' });

let dragging = ref(null);
let dragOffset = { x: 0, y: 0 };

function startDrag(e, which) {
  dragging.value = which;
  dragOffset.x = e.clientX - modelPos.x;
  dragOffset.y = e.clientY - modelPos.y;
}
function onMouseMove(e) {
  if (!dragging.value) return;
  modelPos.x = e.clientX - dragOffset.x;
  modelPos.y = e.clientY - dragOffset.y;
}
function onMouseUp() { dragging.value = null; }

async function selectCustomModel(which) {
  const file = await window.cardForgeAPI.openFile({
    filters: [
      { name: 'Live2D 模型', extensions: ['model3.json', 'json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (file) {
    if (!file.toLowerCase().endsWith('.model3.json')) {
      appStore.toastError('请选择 .model3.json 文件');
      return;
    }
    niangStore.customModelFile[which] = file;
    appStore.toastSuccess('模型已设置，保存配置后切换角色生效');
  }
}

onMounted(async () => {
  await niangStore.loadConfig();
  await loadChatHistory();
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  // 右下角（canvas 300x450，留 20px 边距）
  modelPos.x = window.innerWidth - 320;
  modelPos.y = window.innerHeight - 470;

  // 用同一个 PIXI.Application 加载两个模型
  await initBothModels();

  // 关闭窗口时自动保存当前对话
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  // Destroy Live2D model and PIXI app
  if (currentModel) {
    try { live2dApp?.stage.removeChild(currentModel); currentModel.destroy(); } catch {}
    currentModel = null;
  }
  if (live2dApp) {
    try { live2dApp.destroy(true); } catch {}
    live2dApp = null;
  }
});

// ======== 模型加载 ========

async function loadCubismCore() {
  if (window.Live2DCubismCore) return true;
  try {
    const resPath = await window.cardForgeAPI.getResourcePath();
    const corePath = resPath.replace(/\\/g, '/') + '/live2d/live2dcubismcore.min.js';
    const result = await window.cardForgeAPI.readTextFile(corePath);
    if (!result.success) return false;
    const script = document.createElement('script');
    script.textContent = result.data;
    document.head.appendChild(script);
    await new Promise(r => setTimeout(r, 300));
    return !!window.Live2DCubismCore;
  } catch (e) { return false; }
}

let live2dApp = null;
let currentModel = null;
let Live2DModelClass = null;
let resourcePath = '';

async function initBothModels() {
  try {
    if (!sharedCanvas.value) return;

    const PIXI = await import('pixi.js');
    window.PIXI = PIXI;

    const canvasW = 300;
    const canvasH = 450;
    sharedCanvas.value.width = canvasW;
    sharedCanvas.value.height = canvasH;

    live2dApp = new PIXI.Application({
      view: sharedCanvas.value,
      width: canvasW,
      height: canvasH,
      transparent: true,
      resolution: 1,
      antialias: true
    });

    await loadCubismCore();
    const { Live2DModel } = await import('pixi-live2d-display/cubism4');
    Live2DModelClass = Live2DModel;

    const resPath = await window.cardForgeAPI.getResourcePath();
    resourcePath = resPath.replace(/\\/g, '/');

    // 根据当前模式加载对应模型
    await switchModel(mode.value);

  } catch (e) {
    appStore.toastError('Live2D 初始化失败');
  }
}

async function switchModel(which) {
  if (!live2dApp) return;

  // 清除当前模型
  if (currentModel) {
    live2dApp.stage.removeChild(currentModel);
    currentModel.destroy();
    currentModel = null;
  }

  const niang = niangStore.getNiangById(which);
  const modelFilePath = niangStore.customModelFile[niang.id];

  // 没有配置模型 — 不加载，让画布空白
  if (!modelFilePath) return;

  try {
    await loadLive2DModel(modelFilePath, niang);
  } catch (e) {
    appStore.toastError(niang.name + ' 模型加载失败');
  }
}

async function loadLive2DModel(modelFilePath, niang) {
  if (!Live2DModelClass) {
    await loadCubismCore();
    const { Live2DModel } = await import('pixi-live2d-display/cubism4');
    Live2DModelClass = Live2DModel;
  }

  // 直接用绝对路径加载
  const normalizedPath = modelFilePath.replace(/\\/g, '/');
  const modelUrl = 'file:///' + normalizedPath;

  const model = await Live2DModelClass.from(modelUrl);
  const canvasW = 300;
  const canvasH = 450;
  const s = Math.min(canvasW / model.width, canvasH / model.height) * 0.8;
  model.scale.set(s);
  model.anchor.set(0.5, 0.5);
  model.x = canvasW / 2;
  model.y = canvasH / 2 + 20;
  live2dApp.stage.addChild(model);
  currentModel = model;
}

// ======== 聊天逻辑 ========

function formatMsg(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

async function scrollBottom() {
  await nextTick();
  if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
}

async function analyzeCard() {
  if (!apiStore.isConfigured && !activeNiang.value.apiKey) {
    appStore.toastError('请先配置 API Key');
    return;
  }

  // 让用户选择角色卡文件
  const filePath = await window.cardForgeAPI.openFile();
  if (!filePath) return;

  try {
    let cardJson;
    if (filePath.endsWith('.json')) {
      const result = await window.cardForgeAPI.readTextFile(filePath);
      if (!result.success) throw new Error(result.error);
      cardJson = JSON.parse(result.data);
    } else if (filePath.endsWith('.png')) {
      const result = await window.cardForgeAPI.extractCharaData(filePath);
      if (!result.success) throw new Error(result.error);
      cardJson = result.data;
    } else {
      throw new Error('只支持 PNG 和 JSON 格式');
    }

    const d = cardJson.data || cardJson;
    const entries = d.character_book?.entries || [];
    const regexScripts = d.extensions?.regex_scripts || [];
    const th = d.extensions?.tavern_helper;
    let scripts = [];
    if (th) {
      scripts = Array.isArray(th) ? (th.find(e => e[0] === 'scripts')?.[1] || []) : (th.scripts || []);
    }

    // 构建角色卡摘要
    const enabledEntries = entries.filter(e => e.enabled);
    const constantEntries = entries.filter(e => e.constant && e.enabled);
    const disabledEntries = entries.filter(e => !e.enabled);
    const entryNames = entries.slice(0, 20).map(e =>
      `[${e.constant ? '常驻' : e.enabled ? '触发' : '禁用'}] ${e.comment || '(未命名)'} keys:[${(e.keys || []).join(',')}] order:${e.insertion_order}`
    ).join('\n');

    const summary = `角色卡诊断请求：

【基本信息】
角色名：${d.name || '(空)'}
description：${(d.description || '').length} 字${d.description ? '' : '（空）'}
personality：${d.personality || '(空)'}
scenario：${(d.scenario || '').length} 字${d.scenario ? '' : '（空）'}
first_mes：${(d.first_mes || '').length} 字${d.first_mes ? '' : '（空）'}
mes_example：${(d.mes_example || '').length} 字${d.mes_example ? '' : '（空）'}
system_prompt：${(d.system_prompt || '').length} 字
alternate_greetings：${(d.alternate_greetings || []).length} 个

【世界书】
总条目：${entries.length} 条
启用：${enabledEntries.length} / 常驻：${constantEntries.length} / 禁用：${disabledEntries.length}
条目列表（前20条）：
${entryNames || '(无条目)'}

【正则脚本】${regexScripts.length} 个
${regexScripts.slice(0, 5).map(r => `- ${r.scriptName} [${r.markdownOnly ? 'markdownOnly' : r.promptOnly ? 'promptOnly' : '双层'}]`).join('\n') || '(无)'}

【酒馆助手脚本】${scripts.length} 个
${scripts.slice(0, 5).map(s => `- ${s.name} [${s.enabled ? '启用' : '禁用'}]`).join('\n') || '(无)'}

${d.description ? '\n【description 内容（前500字）】\n' + d.description.slice(0, 500) : ''}
${d.first_mes ? '\n【first_mes 内容（前500字）】\n' + d.first_mes.slice(0, 500) : ''}`;

    messages.value.push({
      id: ++msgId, role: 'user', name: '你',
      content: '请诊断这张角色卡：' + (d.name || '未命名'),
      color: '#f59e42'
    });

    loading.value = true;
    await scrollBottom();

    const niang = activeNiang.value;
    const sysPrompt = `${niangStore.buildSystemPrompt(niang)}

你现在要诊断一张 SillyTavern 角色卡。请从以下几个方面分析：

1.【问题诊断】找出角色卡中存在的问题（如字段缺失、世界书设计不合理、正则配置错误、Token浪费等）
2.【解决方案】针对每个问题给出具体的解决方法
3.【优化建议】给出提升角色卡质量的建议（如角色描写、世界书组织、关键词设计、开场白改进等）
4.【评分】给出1-10分的评分和理由

用你的角色性格来回答，保持角色扮演。`;

    const chatMsgs = [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: summary }
    ];

    let result;
    if (niang.apiKey && niang.apiBaseUrl && niang.apiModel) {
      const tempProvider = { id: 'diag_temp', type: niang.apiType || 'openai', baseUrl: niang.apiBaseUrl, apiKey: niang.apiKey, model: niang.apiModel, enabled: true };
      result = await apiStore.chatWithProvider(tempProvider, chatMsgs, { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(tempProvider.model) });
    } else {
      result = await apiStore.chat(chatMsgs, { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });
    }

    messages.value.push({ id: ++msgId, role: 'assistant', niangId: niang.id, name: niang.name, content: result, color: niang.color });

    loading.value = false;
    await scrollBottom();
    appStore.toastSuccess('角色卡诊断完成');
  } catch (e) {
    loading.value = false;
    appStore.toastError('诊断失败: ' + e.message);
  }
}

async function send() {
  const text = inputText.value.trim();
  if (!text || loading.value) return;
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }

  messages.value.push({ id: ++msgId, role: 'user', name: '你', content: text, color: '#f59e42' });
  inputText.value = '';
  loading.value = true;
  await scrollBottom();

  try {
    if (mode.value === 'duo') {
      await sendDuo(text);
    } else {
      await sendSingle(text, activeNiang.value);
    }
  } catch (e) {
    messages.value.push({ id: ++msgId, role: 'assistant', name: '系统', content: `出错了：${e.message}`, color: '#f87171' });
  } finally {
    loading.value = false;
    await scrollBottom();
  }
}

async function sendSingle(text, niang) {
  const sysPrompt = niangStore.buildSystemPrompt(niang);
  const history = messages.value.filter(m => m.role === 'user' || m.niangId === niang.id).slice(-10);
  const chatMsgs = [
    { role: 'system', content: sysPrompt },
    ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
  ];
  // 如果角色有自己的 API 设置就用自己的，否则走全局
  let result;
  if (niang.apiKey && niang.apiBaseUrl && niang.apiModel) {
    const tempProvider = {
      id: niang.id + '_custom',
      type: niang.apiType || 'openai',
      baseUrl: niang.apiBaseUrl,
      apiKey: niang.apiKey,
      model: niang.apiModel,
      enabled: true
    };
    result = await apiStore.chatWithProvider(tempProvider, chatMsgs, { temperature: 0.85, maxTokens: apiStore.getModelMaxTokens(tempProvider.model) });
  } else {
    result = await apiStore.chat(chatMsgs, { temperature: 0.85, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });
  }
  messages.value.push({ id: ++msgId, role: 'assistant', niangId: niang.id, name: niang.name, content: result, color: niang.color });
}

async function sendDuo(text) {
  const white = niangStore.getNiangById('white') || { name: '白', color: '#9896a8' };
  const black = niangStore.getNiangById('black') || { name: '黑', color: '#666' };
  const sysPrompt = niangStore.buildChatPrompt(white, black);
  const history = messages.value.slice(-10);
  const chatMsgs = [
    { role: 'system', content: sysPrompt },
    ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
  ];
  const result = await apiStore.chat(chatMsgs, { temperature: 0.9, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

  const lines = result.split('\n').filter(l => l.trim());
  const wName = white.name;
  const bName = black.name;
  let hasNamed = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(wName + '：') || trimmed.startsWith(wName + ':')) {
      messages.value.push({ id: ++msgId, role: 'assistant', niangId: 'white', name: wName, content: trimmed.replace(new RegExp(`^${wName}[：:]\\s*`), ''), color: white.color });
      hasNamed = true;
    } else if (trimmed.startsWith(bName + '：') || trimmed.startsWith(bName + ':')) {
      messages.value.push({ id: ++msgId, role: 'assistant', niangId: 'black', name: bName, content: trimmed.replace(new RegExp(`^${bName}[：:]\\s*`), ''), color: black.color });
      hasNamed = true;
    }
  }
  if (!hasNamed) {
    messages.value.push({ id: ++msgId, role: 'assistant', niangId: 'white', name: wName + ' & ' + bName, content: result, color: white.color });
  }
}
</script>

<style scoped>
.ai-page {
  height: calc(100vh - var(--cf-titlebar-height));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.ai-chat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-messages { flex: 1; overflow-y: auto; padding: var(--cf-gap-md); }
.chat-msg { margin-bottom: 12px; }
.chat-msg--user .chat-msg__content { text-align: right; }
.chat-msg--user .chat-msg__text { display: inline-block; text-align: left; }
.chat-msg__name { font-size: 11px; margin-bottom: 3px; font-weight: 500; }
.chat-msg__text {
  font-size: 13px; line-height: 1.7;
  background: rgba(0, 0, 0, 0.15);
  padding: 8px 14px; border-radius: 10px;
  display: inline-block; max-width: 80%; word-wrap: break-word;
}
.chat-msg--user .chat-msg__text { background: rgba(245, 158, 66, 0.12); }
.chat-msg__text code {
  background: rgba(0, 229, 255, 0.1); color: #00e5ff;
  padding: 1px 5px; border-radius: 3px;
  font-family: var(--cf-font-mono); font-size: 12px;
}
.typing { animation: blink 1s infinite; }
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

.chat-input {
  padding: var(--cf-gap-md);
  border-top: 1px solid var(--cf-border);
  display: flex; gap: 8px; align-items: flex-end;
}
.chat-input .textarea { flex: 1; min-height: unset; resize: none; }

/* ── 对话记录 ── */
.history-item {
  padding: 10px 12px;
  border: 1px solid var(--cf-border);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.history-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 215, 0, 0.3);
}
.history-item__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-text-primary);
}
.history-item__time {
  font-size: 11px;
  color: var(--cf-text-muted);
}
.history-item__preview {
  font-size: 12px;
  color: var(--cf-text-muted);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 模型容器 ── */
.model-container {
  position: fixed;
  z-index: 9000;
  cursor: grab;
  user-select: none;
}
.model-container:active,
.model-container.is-dragging { cursor: grabbing; }
.model-container:hover { filter: brightness(1.05); }
.model-container canvas { pointer-events: none; }

.model-name {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  margin-top: -60px;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}
</style>
