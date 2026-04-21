<template>
  <div class="app-root">
    <!-- 壁纸层 -->
    <div class="wallpaper-layer" :style="wallpaperStyle"></div>
    <!-- 蓝色星空滤镜层 -->
    <div class="starfilter-layer"></div>
    <!-- 星空粒子 -->
    <div class="starfield">
      <div v-for="star in stars" :key="star.id" class="starfield__star" :style="star.style"></div>
    </div>

    <!-- 自定义标题栏 -->
    <div class="titlebar">
      <div class="titlebar__title">角色卡锻造炉</div>
      <div class="titlebar__controls">
        <button class="titlebar__btn" @click="api.minimize()">─</button>
        <button class="titlebar__btn" @click="api.maximize()">☐</button>
        <button class="titlebar__btn titlebar__btn--close" @click="api.close()">✕</button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="app-layout">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar__logo">
          <div class="sidebar__logo-text" style="font-size:15px">
            角色卡锻造炉
            <span class="sub">{{ appVersion }}</span>
          </div>
        </div>

        <nav class="sidebar__nav">
          <div class="sidebar__section">
            <div class="sidebar__section-title">总览</div>
            <router-link to="/" class="sidebar__item" active-class="active" exact>
              <span class="sidebar__item-icon">·</span> 工作台
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">必填 · 做卡必须</div>
            <router-link to="/basic" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 基本信息
            </router-link>
            <router-link to="/charsetting" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 角色设定
            </router-link>
            <router-link to="/worldbook" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 世界书
              <span class="badge badge--accent" v-if="cardStore.stats.totalEntries">
                {{ cardStore.stats.totalEntries }}
              </span>
            </router-link>
            <router-link to="/greeting" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 开场白
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">可选 · 锦上添花</div>
            <router-link to="/npc" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> NPC 生成器
            </router-link>
            <router-link to="/player" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 玩家角色
            </router-link>
            <router-link to="/dialogue" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 对话样本
            </router-link>
            <router-link to="/extra" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 额外需求
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">高级 · 进阶功能</div>
            <router-link to="/mvu" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> MVU 变量系统
            </router-link>
            <router-link to="/regex" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 正则脚本
              <span class="badge badge--info" v-if="cardStore.stats.regexCount">
                {{ cardStore.stats.regexCount }}
              </span>
            </router-link>
            <router-link to="/scripts" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 酒馆助手脚本
            </router-link>
            <router-link to="/ejs" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> EJS 模板
            </router-link>
            <router-link to="/statusbar" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 前端状态栏
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">导出</div>
            <router-link to="/package" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 打包角色卡
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">工具</div>
            <router-link to="/assistant" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> AI 助手
            </router-link>
            <router-link to="/statistics" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 卡片统计
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">设置</div>
            <router-link to="/api" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> API 设置
              <span class="badge badge--success" v-if="apiStore.isConfigured">OK</span>
            </router-link>
            <div class="sidebar__item" style="cursor:pointer" @click="appStore.toggleGlow()">
              <span class="sidebar__item-icon">·</span> 流光边框
              <span class="badge" :class="appStore.glowEnabled ? 'badge--success' : 'badge--warning'">
                {{ appStore.glowEnabled ? '开' : '关' }}
              </span>
            </div>
            <div class="sidebar__item" style="cursor:pointer" @click="showErrorLog = true">
              <span class="sidebar__item-icon">·</span> 错误日志
            </div>
            <div class="sidebar__item" style="cursor:pointer" @click="checkUpdate" :class="{ disabled: checkingUpdate }">
              <span class="sidebar__item-icon">·</span> {{ checkingUpdate ? '检查中...' : '检查更新' }}
            </div>
          </div>
        </nav>

      </aside>

      <!-- 内容区 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>

    <!-- 错误日志弹窗 -->
    <ErrorLogModal :visible="showErrorLog" @close="showErrorLog = false" />

    <!-- 自定义确认弹窗 -->
    <div v-if="appStore.confirmVisible" class="cf-confirm-overlay" @click.self="appStore.confirmNo()">
      <div class="cf-confirm-dialog">
        <div class="cf-confirm-msg">{{ appStore.confirmMessage }}</div>
        <div class="cf-confirm-btns">
          <button class="btn btn--danger" @click="appStore.confirmYes()">确认</button>
          <button class="btn btn--secondary" @click="appStore.confirmNo()">取消</button>
        </div>
      </div>
    </div>

    <!-- 右侧 AI 助手抽屉 -->
    <div class="ai-drawer" :class="{ open: showFloatChat }">
      <!-- 角色切换 -->
      <div class="ai-drawer__niangs">
        <button v-for="n in niangStore.getAllNiangs()" :key="n.id"
          :class="['ai-drawer__niang-btn', drawerMode === n.id ? 'active' : '']"
          :style="drawerMode === n.id ? { borderColor: n.color, color: n.color } : {}"
          @click="drawerMode = n.id">{{ n.name }}</button>
      </div>
      <!-- 功能按钮 -->
      <div class="ai-drawer__header">
        <div class="flex-row">
          <button class="btn btn--secondary btn--sm" @click="drawerAnalyze" :disabled="floatLoading">诊断</button>
          <button class="btn btn--accent btn--sm" @click="drawerNewChat">新对话</button>
          <button class="btn btn--ghost btn--sm" @click="showDrawerHistory = !showDrawerHistory">
            记录({{ drawerHistory.length }})
          </button>
          <button class="ai-drawer__close" @click="showFloatChat = false">x</button>
        </div>
      </div>

      <!-- 对话记录列表 -->
      <div v-if="showDrawerHistory" class="ai-drawer__history">
        <div v-if="drawerHistory.length === 0" style="text-align:center;color:var(--cf-text-muted);padding:16px;font-size:13px">暂无历史</div>
        <div v-for="(h, i) in drawerHistory" :key="i" class="history-item" @click="loadDrawerHistoryItem(i)">
          <div class="flex-between">
            <span class="history-item__title">{{ h.title }}</span>
            <div class="flex-row">
              <span class="history-item__time">{{ h.time }}</span>
              <button class="btn btn--danger btn--sm" style="padding:1px 6px;font-size:11px" @click.stop="appStore.confirmAction('删除？', () => { drawerHistory.splice(i, 1); saveDrawerHistory(); })">x</button>
            </div>
          </div>
          <div class="history-item__preview">{{ h.preview }}</div>
        </div>
      </div>

      <!-- 聊天消息 -->
      <div v-show="!showDrawerHistory" class="ai-drawer__messages" ref="floatMsgBox">
        <div v-if="floatMessages.length === 0" style="text-align:center;color:var(--cf-text-muted);padding:40px 20px;font-size:13px">
          <div :style="{ color: activeDrawerNiang?.color }">{{ activeDrawerNiang?.name }}</div>
          <div style="margin-top:8px">{{ activeDrawerNiang?.greeting }}</div>
        </div>
        <div v-for="(msg, i) in floatMessages" :key="i"
          :class="['float-msg', msg.role === 'user' ? 'float-msg--user' : 'float-msg--ai']">
          <div class="float-msg__name" :style="{ color: msg.color }">{{ msg.name }}</div>
          <div class="float-msg__text" v-html="formatDrawerMsg(msg.content)"></div>
        </div>
        <div v-if="floatLoading" class="float-msg float-msg--ai">
          <div class="float-msg__text" style="color:var(--cf-text-muted);font-style:italic">思考中...</div>
        </div>
      </div>

      <div class="ai-drawer__input">
        <textarea class="textarea" v-model="floatInput" rows="2" placeholder="输入消息... (Ctrl+Enter 发送)"
          @keydown.ctrl.enter="sendFloatMsg" :disabled="floatLoading"></textarea>
        <button class="btn btn--primary" @click="sendFloatMsg" :disabled="floatLoading || !floatInput.trim()">
          {{ floatLoading ? '...' : '发送' }}
        </button>
      </div>
    </div>
    <button class="ai-drawer-toggle" :class="{ open: showFloatChat }" @click="showFloatChat = !showFloatChat" title="AI 助手">
      {{ showFloatChat ? '>' : 'AI' }}
    </button>

    <!-- Toast 通知 -->
    <div class="toast-container">
      <div
        v-for="t in appStore.toasts"
        :key="t.id"
        :class="['toast', `toast--${t.type}`]"
      >
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, nextTick } from 'vue';
import { useCardStore } from './stores/card.js';
import { useApiStore } from './stores/api.js';
import { useAppStore } from './stores/app.js';
import { useAiNiangStore } from './stores/ainiang.js';
import { buildCardContext } from './utils/card-context.js';
import wallpaperDataUrl from './wallpaper-data.js';
import ErrorLogModal from './components/ErrorLogModal.vue';

const api = window.cardForgeAPI;
const cardStore = useCardStore();
const apiStore = useApiStore();
const appStore = useAppStore();
const niangStore = useAiNiangStore();

// 错误日志弹窗
const showErrorLog = ref(false);

// 应用版本号（从 package.json 动态读取，避免硬编码）
const appVersion = ref('');

// 检查更新
const checkingUpdate = ref(false);
async function checkUpdate() {
  if (checkingUpdate.value) return;
  checkingUpdate.value = true;
  try {
    const res = await window.cardForgeAPI.checkForUpdates();
    if (!res.success) {
      appStore.toastError('检查失败：' + (res.error || '未知错误'));
    } else if (res.skipped === 'dev') {
      appStore.toastInfo(res.message);
    } else if (res.version && res.version !== res.current) {
      // 主进程已经会弹原生 dialog，这里不重复
      appStore.toastInfo(`发现新版本 ${res.version}`);
    } else {
      appStore.toastSuccess(`已是最新版本（${res.current || ''}）`);
    }
  } catch (e) {
    appStore.toastError('检查失败：' + e.message);
  } finally {
    checkingUpdate.value = false;
  }
}

// AI 助手抽屉
const showFloatChat = ref(false);
const floatMessages = ref([]);
const floatInput = ref('');
const floatLoading = ref(false);
const floatMsgBox = ref(null);
const drawerMode = ref('youxi');
const showDrawerHistory = ref(false);
const drawerHistory = ref([]);
let drawerMsgId = 0;

const activeDrawerNiang = computed(() => niangStore.getNiangById(drawerMode.value));

function formatDrawerMsg(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

async function loadDrawerHistoryFromDisk() {
  try {
    const settings = await window.cardForgeAPI.loadSettings();
    drawerHistory.value = settings.drawerHistory || [];
  } catch (e) {}
}

async function saveDrawerHistory() {
  try {
    const settings = await window.cardForgeAPI.loadSettings() || {};
    settings.drawerHistory = JSON.parse(JSON.stringify(drawerHistory.value));
    await window.cardForgeAPI.saveSettings(settings);
  } catch (e) {}
}

function isSameDrawerMessages(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if ((a[i].role || '') !== (b[i].role || '')) return false;
    if ((a[i].content || '') !== (b[i].content || '')) return false;
  }
  return true;
}

function saveDrawerToHistory() {
  if (floatMessages.value.length === 0) return;
  // 防重复：当前 messages 和历史里某条完全一致就不再保存（修复载入历史后再载入会复制的 bug）
  if (drawerHistory.value.some(h => isSameDrawerMessages(h.messages, floatMessages.value))) return;
  const firstUser = floatMessages.value.find(m => m.role === 'user');
  const title = firstUser ? firstUser.content.slice(0, 30) : '无标题';
  const last = floatMessages.value[floatMessages.value.length - 1];
  const now = new Date();
  const time = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  drawerHistory.value.unshift({ title, preview: (last.content || '').slice(0, 50), time, messages: JSON.parse(JSON.stringify(floatMessages.value)) });
  if (drawerHistory.value.length > 100) drawerHistory.value = drawerHistory.value.slice(0, 100);
  saveDrawerHistory();
}

function drawerNewChat() {
  saveDrawerToHistory();
  floatMessages.value = [];
  showDrawerHistory.value = false;
  appStore.toastSuccess('已开始新对话');
}

function loadDrawerHistoryItem(index) {
  const h = drawerHistory.value[index];
  if (!h) return;
  saveDrawerToHistory();
  floatMessages.value = h.messages.map(m => ({ ...m }));
  drawerMsgId = Math.max(0, ...floatMessages.value.map(m => m.id || 0)) + 1;
  showDrawerHistory.value = false;
  scrollFloatChat();
}

async function sendFloatMsg() {
  if (!floatInput.value.trim() || floatLoading.value) return;
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }

  const text = floatInput.value.trim();
  const niang = activeDrawerNiang.value;
  floatMessages.value.push({ id: ++drawerMsgId, role: 'user', name: '你', content: text, color: '#f59e42' });
  floatInput.value = '';
  floatLoading.value = true;
  scrollFloatChat();

  try {
    const sysPrompt = niangStore.buildSystemPrompt(niang);
    const history = floatMessages.value.filter(m => m.role === 'user' || m.niangId === niang.id).slice(-10);
    const chatMsgs = [
      { role: 'system', content: sysPrompt },
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
    ];

    let result;
    if (niang.apiKey && niang.apiBaseUrl && niang.apiModel) {
      const p = { id: niang.id + '_d', type: niang.apiType || 'openai', baseUrl: niang.apiBaseUrl, apiKey: niang.apiKey, model: niang.apiModel, enabled: true };
      result = await apiStore.chatWithProvider(p, chatMsgs, { temperature: 0.85, maxTokens: apiStore.getModelMaxTokens(p.model) });
    } else {
      result = await apiStore.chat(chatMsgs, { temperature: 0.85, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });
    }
    floatMessages.value.push({ id: ++drawerMsgId, role: 'assistant', niangId: niang.id, name: niang.name, content: result, color: niang.color });
  } catch (e) {
    floatMessages.value.push({ id: ++drawerMsgId, role: 'assistant', name: '系统', content: '出错了: ' + e.message, color: '#f87171' });
  } finally {
    floatLoading.value = false;
    scrollFloatChat();
  }
}

async function drawerAnalyze() {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  const context = buildCardContext(cardStore);
  if (!context || context.length < 10) { appStore.toastWarning('请先导入一张角色卡'); return; }

  const niang = activeDrawerNiang.value;
  floatMessages.value.push({ id: ++drawerMsgId, role: 'user', name: '你', content: '请诊断当前角色卡', color: '#f59e42' });
  floatLoading.value = true;
  scrollFloatChat();

  try {
    const sysPrompt = niangStore.buildSystemPrompt(niang) + '\n\n你现在要诊断一张角色卡，从问题诊断、解决方案、优化建议、评分四个方面分析。用你的角色性格来回答。';
    const result = await apiStore.chat([
      { role: 'system', content: sysPrompt },
      { role: 'user', content: `请诊断：\n${context}` }
    ], { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });
    floatMessages.value.push({ id: ++drawerMsgId, role: 'assistant', niangId: niang.id, name: niang.name, content: result, color: niang.color });
  } catch (e) {
    floatMessages.value.push({ id: ++drawerMsgId, role: 'assistant', name: '系统', content: '诊断失败: ' + e.message, color: '#f87171' });
  } finally { floatLoading.value = false; scrollFloatChat(); }
}

function scrollFloatChat() {
  nextTick(() => { if (floatMsgBox.value) floatMsgBox.value.scrollTop = floatMsgBox.value.scrollHeight; });
}

// 壁纸 - 内嵌 base64
const wallpaperStyle = ref({ backgroundImage: `url(${wallpaperDataUrl})` });

// 星空粒子 — 下落式
function makeStars(count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const size = 1 + Math.random() * 2;
    const duration = 6 + Math.random() * 10; // 6-16秒落下
    const delay = Math.random() * duration;  // 错开起始时间
    arr.push({
      id: i,
      style: {
        left: Math.random() * 100 + '%',
        top: '-10px',
        width: size + 'px',
        height: size + 'px',
        animationDelay: delay + 's',
        animationDuration: duration + 's'
      }
    });
  }
  return arr;
}
const stars = ref(makeStars(60));

onMounted(async () => {
  await appStore.loadTheme();
  await apiStore.loadFromDisk();
  await loadDrawerHistoryFromDisk();
  window.addEventListener('beforeunload', () => { saveDrawerToHistory(); });
  try {
    const v = await window.cardForgeAPI?.getAppVersion?.();
    if (v) appVersion.value = 'v' + v;
  } catch (e) { /* 网页版或 preload 异常时静默 */ }
});
</script>
