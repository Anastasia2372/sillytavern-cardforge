<template>
  <div class="page ai-page">
    <div class="page__header flex-between">
      <div>
        <h1>AI 助手</h1>
      </div>
      <div class="flex-row">
        <button class="btn btn--accent btn--sm" @click="startNewChat" :disabled="loading">开始新对话</button>
        <button class="btn btn--secondary btn--sm" @click="showHistory = !showHistory; showConfig = false; showModelConfig = false; settingsOpen = false">
          对话记录 ({{ chatHistory.length }})
        </button>
        <div class="settings-pop">
          <button class="btn btn--ghost btn--sm" @click="settingsOpen = !settingsOpen; showHistory = false; showConfig = false; showModelConfig = false">⚙</button>
          <div v-if="settingsOpen" class="settings-pop__menu">
            <label class="settings-pop__item">
              <input type="checkbox" v-model="live2dVisible" @change="onToggleLive2D">
              显示 Live2D 模型
            </label>
            <button class="settings-pop__btn" @click="showConfig = true; showModelConfig = false; showHistory = false; settingsOpen = false">人设配置</button>
            <button class="settings-pop__btn" @click="showModelConfig = true; showConfig = false; showHistory = false; settingsOpen = false">API 密钥</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 人设配置面板 -->
    <div v-if="showConfig" class="card mb-md">
      <div class="card__header flex-between">
        <h3>柚溪人设</h3>
        <div class="flex-row">
          <button class="btn btn--secondary btn--sm" @click="niangStore.resetToDefault(); appStore.toastSuccess('已重置')">恢复默认</button>
          <button class="btn btn--primary btn--sm" @click="niangStore.saveConfig(); showConfig = false; appStore.toastSuccess('已保存')">保存</button>
        </div>
      </div>
      <div class="card__body">
        <div class="form-group"><label>名字</label><input class="input" v-model="niangStore.youxi.name"></div>
        <div class="form-group"><label>头衔</label><input class="input" v-model="niangStore.youxi.title"></div>
        <div class="form-group"><label>性格</label><textarea class="textarea" v-model="niangStore.youxi.personality" rows="3"></textarea></div>
        <div class="form-group"><label>说话方式</label><textarea class="textarea" v-model="niangStore.youxi.speakStyle" rows="2"></textarea></div>
        <div class="form-group"><label>打招呼</label><input class="input" v-model="niangStore.youxi.greeting"></div>
        <div class="form-group">
          <label>Live2D 模型文件</label>
          <div class="flex-row">
            <input class="input flex-1" :value="niangStore.customModelFile" readonly placeholder="未配置 — 点右侧选择 .model3.json">
            <button class="btn btn--secondary btn--sm" @click="selectCustomModel">选择</button>
            <button class="btn btn--ghost btn--sm" v-if="niangStore.customModelFile" @click="niangStore.customModelFile = ''">清除</button>
          </div>
          <div class="hint">选择 .model3.json 文件（同目录下需有对应的 .moc3 和贴图）</div>
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
        <p class="hint mb-md">为柚溪配置独立的 AI 模型，留空则使用全局 API 设置</p>
        <div class="grid-2">
          <div class="form-group">
            <label>API 类型</label>
            <select class="select" v-model="niangStore.youxi.apiType">
              <option value="openai">OpenAI 兼容</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="gemini">Gemini (Google)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Base URL</label>
            <input class="input" v-model="niangStore.youxi.apiBaseUrl" placeholder="留空跟随全局">
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>API Key</label>
            <div class="flex-row">
              <input :type="showKey ? 'text' : 'password'" class="input flex-1" v-model="niangStore.youxi.apiKey" placeholder="留空跟随全局">
              <button class="btn btn--ghost btn--sm" @click="showKey = !showKey">
                {{ showKey ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>模型名称</label>
            <input class="input" v-model="niangStore.youxi.apiModel" placeholder="如 gpt-4o, claude-sonnet-4-20250514">
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
              <button class="btn btn--ghost btn--sm" @click="copyMessage(activeNiang.greeting)">复制</button>
            </div>
          </div>
        </div>

        <div v-for="msg in messages" :key="msg.id"
          :class="['chat-msg', msg.role === 'user' ? 'chat-msg--user' : 'chat-msg--ai']">
          <div class="chat-msg__content">
            <div class="chat-msg__name" :style="{ color: msg.color || '#9896a8' }">{{ msg.name }}</div>
            <div class="chat-msg__text selectable" v-html="formatMsg(msg.content)"></div>
            <button class="btn btn--ghost btn--sm" @click="copyMessage(msg.content)">复制</button>
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
          placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
          @keydown.enter.exact="onSendKey"></textarea>
        <button class="btn btn--primary" @click="send" :disabled="loading || !inputText.trim()">发送</button>
      </div>
    </div>

    <!-- Live2D 模型（可拖动，默认隐藏，齿轮里可开） -->
    <div class="model-container"
      v-show="live2dVisible && !showConfig && !showModelConfig"
      :class="{ 'is-dragging': dragging === 'model' }"
      :style="{ left: modelPos.x + 'px', top: modelPos.y + 'px' }"
      @mousedown.prevent="startDrag($event, 'model')">
      <canvas ref="sharedCanvas" width="300" height="450"></canvas>
      <div class="model-name" :style="{ color: activeNiang.color }">{{ activeNiang.name }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '../stores/app.js';
import { useAiNiangStore } from '../stores/ainiang.js';
import { useAssistantChatStore } from '../stores/assistant-chat.js';
import { copyText } from '../utils/clipboard.js';

const appStore = useAppStore();
const niangStore = useAiNiangStore();
const chatStore = useAssistantChatStore();

const { messages, inputText, loading } = storeToRefs(chatStore);
const messagesRef = ref(null);
const showConfig = ref(false);
const showModelConfig = ref(false);
const showHistory = ref(false);
const settingsOpen = ref(false);
const showKey = ref(false);
const live2dVisible = ref(localStorage.getItem('cf_live2d_visible') === '1');
let live2dInited = false;

const activeNiang = computed(() => niangStore.youxi);

async function onToggleLive2D() {
  localStorage.setItem('cf_live2d_visible', live2dVisible.value ? '1' : '0');
  if (live2dVisible.value && !live2dInited) {
    await initLive2D();
    live2dInited = true;
  }
}

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

function startNewChat() {
  if (loading.value) return;
  saveCurrentToHistory();
  messages.value = [];
  appStore.toastSuccess('已开始新对话');
}

function loadHistory(index) {
  if (loading.value) return;
  const h = chatHistory.value[index];
  if (!h) return;
  // 先保存当前对话
  saveCurrentToHistory();
  messages.value = h.messages.map(m => ({ ...m }));
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

let dragging = null;
let dragOffset = { x: 0, y: 0 };

function startDrag(e, which) {
  dragging = which;
  dragOffset.x = e.clientX - modelPos.x;
  dragOffset.y = e.clientY - modelPos.y;
}
function onMouseMove(e) {
  if (!dragging) return;
  modelPos.x = e.clientX - dragOffset.x;
  modelPos.y = e.clientY - dragOffset.y;
}
function onMouseUp() { dragging = null; }

async function selectCustomModel() {
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
    niangStore.customModelFile = file;
    appStore.toastSuccess('模型已设置，保存配置后生效');
  }
}

onMounted(async () => {
  await chatStore.initialize();
  await loadChatHistory();
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  // 右下角（canvas 300x450，留 20px 边距）
  modelPos.x = window.innerWidth - 320;
  modelPos.y = window.innerHeight - 470;

  // Live2D 默认隐藏，只有用户开过才 init
  if (live2dVisible.value) {
    await initLive2D();
    live2dInited = true;
  }

  // 关闭窗口时自动保存当前对话
  window.addEventListener('beforeunload', saveCurrentToHistory);
  scrollBottom();
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', saveCurrentToHistory);
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
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

async function initLive2D() {
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

    const modelFilePath = niangStore.customModelFile;
    if (!modelFilePath) return;

    try {
      await loadLive2DModel(modelFilePath, niangStore.youxi);
    } catch (e) {
      appStore.toastError('柚溪 模型加载失败');
    }
  } catch (e) {
    appStore.toastError('Live2D 初始化失败');
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

watch(() => [messages.value.length, loading.value], scrollBottom);

function send() { return chatStore.send(); }

function onSendKey(event) {
  if (event.isComposing) return;
  event.preventDefault();
  send();
}

async function copyMessage(content) {
  try { await copyText(content); appStore.toastSuccess('已复制'); }
  catch { appStore.toastError('复制失败，请选中文字后重试'); }
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
  user-select: text; -webkit-user-select: text; cursor: text;
  font-size: 13px; line-height: 1.7;
  background: rgba(0, 0, 0, 0.15);
  padding: 8px 14px; border-radius: 10px;
  display: inline-block; max-width: 80%; word-wrap: break-word;
}
.chat-msg__text :deep(*) { user-select: text; -webkit-user-select: text; }
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
.chat-input .textarea { flex: 1; min-height: unset; resize: none; user-select: text; -webkit-user-select: text; }

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

/* ── 齿轮 popover ── */
.settings-pop { position: relative; }
.settings-pop__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 160px;
  background: var(--cf-bg-secondary);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 6px;
  z-index: 8000;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.settings-pop__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--cf-text-primary);
  cursor: pointer;
  border-radius: 4px;
}
.settings-pop__item:hover { background: var(--cf-bg-hover); }
.settings-pop__item input { margin: 0; cursor: pointer; }
.settings-pop__btn {
  background: transparent;
  border: none;
  text-align: left;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--cf-text-primary);
  cursor: pointer;
  border-radius: 4px;
}
.settings-pop__btn:hover { background: var(--cf-bg-hover); }
</style>
