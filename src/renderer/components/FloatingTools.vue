<template>
  <div class="ft-root" :style="ballStyle">
    <!-- 收起态：圆球 -->
    <button v-if="!expanded" class="ft-ball" @mousedown.prevent="onBallMouseDown"
      :class="{ 'ft-ball--dragging': dragging }"
      title="工具集（拖动可移动）">
      <span class="ft-ball__icon">⚒</span>
    </button>

    <!-- 展开态：面板 -->
    <div v-else class="ft-panel" :style="panelStyle">
      <div class="ft-panel__header" @mousedown.prevent="onBallMouseDown">
        <span class="ft-panel__title">工具集</span>
        <div class="ft-panel__actions" @mousedown.stop>
          <button class="ft-panel__close" @click.stop="toolSettings.settingsOpen = true"
            title="悬浮窗设置" aria-label="悬浮窗设置">⚙</button>
          <button class="ft-panel__close" @click.stop="expanded = false" aria-label="收起工具集">×</button>
        </div>
      </div>

      <div class="ft-panel__tabs">
        <button v-for="t in availableTools" :key="t.key"
          :class="['ft-tab', activeTool === t.key ? 'ft-tab--active' : '']"
          @click="switchTool(t.key)">{{ t.short }}</button>
      </div>

      <div class="ft-panel__body" :class="{ 'ft-panel__body--chat': activeTool === 'chat' }">
        <InspirationChat v-if="activeTool === 'chat'" />
        <!-- 写开场白 -->
        <div v-if="activeTool === 'greeting'">
          <div class="hint mb-sm">基于当前卡的 description / personality / scenario，让 AI 写个新开场白</div>
          <div class="form-group">
            <label>风格倾向</label>
            <input class="input" v-model="greetingStyle" placeholder="如：克制冷淡 / 热情主动 / 神秘留白（可空）">
          </div>
          <div class="form-group">
            <label>字数大约</label>
            <select class="select" v-model="greetingLen">
              <option value="200">短（200 字）</option>
              <option value="400">中（400 字）</option>
              <option value="800">长（800 字）</option>
            </select>
          </div>
          <button class="btn btn--primary btn--sm" :disabled="loading" @click="runGreeting">
            {{ loading ? '生成中...' : '生成开场白' }}
          </button>
          <div v-if="aiResult" class="ft-result">
            <div class="ft-result__head">
              <span>结果（{{ aiResult.length }} 字）</span>
              <div class="flex-row">
                <button class="btn btn--ghost btn--sm" @click="copyResult">复制</button>
                <button class="btn btn--accent btn--sm" @click="applyGreeting">应用到 first_mes</button>
              </div>
            </div>
            <textarea class="ft-result__text" v-model="aiResult" rows="10"></textarea>
          </div>
        </div>

        <!-- 优化选中条目（只 /worldbook） -->
        <div v-if="activeTool === 'optimize_entry'">
          <div class="hint mb-sm">从下拉选一条世界书条目，AI 按方向重写</div>
          <div class="form-group">
            <label>条目</label>
            <input class="input mb-sm" v-model="entrySearch" placeholder="搜 标题 / 关键词 / 正文 / #序号">
            <select class="select" v-model="entrySelectedId">
              <option value="">— 选择条目（{{ filteredEntries.length }} / {{ worldEntries.length }}）—</option>
              <option v-for="e in filteredEntries" :key="e.id" :value="e.id">
                序号 {{ e.extensions?.cfSortKey ?? '—' }} · {{ e.comment || '(未命名)' }}
              </option>
            </select>
            <div class="hint">序号和排列与世界书列表一致；输入 #2 可查找序号 2。</div>
          </div>
          <div class="form-group">
            <label>优化方向</label>
            <input class="input" v-model="entryDirection" placeholder="如：去除万能美人描写 / 加感官细节 / 缩短 30%">
          </div>
          <button class="btn btn--primary btn--sm" :disabled="loading || entrySelectedId === ''" @click="runOptimizeEntry">
            {{ loading ? '改写中...' : '改写' }}
          </button>
          <button class="btn btn--secondary btn--sm" :disabled="entrySelectedId === ''"
            @click="router.push({ path: '/agent', query: { entry: String(entrySelectedId), direction: entryDirection } }); expanded = false">审阅式改写</button>
          <div v-if="aiResult" class="ft-result">
            <div class="ft-result__head">
              <span>改写结果</span>
              <div class="flex-row">
                <button class="btn btn--ghost btn--sm" @click="copyResult">复制</button>
                <button class="btn btn--accent btn--sm" @click="applyEntryRewrite">应用到该条目</button>
              </div>
            </div>
            <textarea class="ft-result__text" v-model="aiResult" rows="10"></textarea>
          </div>
        </div>

        <!-- 起 NPC 名 -->
        <div v-if="activeTool === 'npc_name'">
          <div class="hint mb-sm">告诉 AI 风格和性别，给几个候选名（仅展示，不动卡）</div>
          <div class="form-group">
            <label>数量</label>
            <input class="input" type="number" min="1" max="10" v-model.number="npcCount">
          </div>
          <div class="form-group">
            <label>性别</label>
            <select class="select" v-model="npcGender">
              <option value="女">女</option>
              <option value="男">男</option>
              <option value="不限">不限</option>
            </select>
          </div>
          <div class="form-group">
            <label>风格</label>
            <input class="input" v-model="npcStyle" placeholder="如：仙侠 / 现代日系 / 西幻贵族 / 赛博朋克">
          </div>
          <button class="btn btn--primary btn--sm" :disabled="loading" @click="runNpcName">
            {{ loading ? '取名中...' : '取名' }}
          </button>
          <div v-if="aiResult" class="ft-result">
            <div class="ft-result__head">
              <span>结果</span>
              <button class="btn btn--ghost btn--sm" @click="copyResult">复制</button>
            </div>
            <textarea class="ft-result__text" v-model="aiResult" rows="8"></textarea>
          </div>
        </div>

        <!-- 解释代码 -->
        <div v-if="activeTool === 'explain_code'">
          <div class="hint mb-sm">粘贴正则 / EJS / JS / Zod schema，AI 用人话解释（不修改原代码）</div>
          <div class="form-group">
            <label>代码</label>
            <textarea class="textarea" v-model="codeInput" rows="6" placeholder="把代码粘进来"></textarea>
          </div>
          <button class="btn btn--primary btn--sm" :disabled="loading || !codeInput.trim()" @click="runExplainCode">
            {{ loading ? '分析中...' : '解释' }}
          </button>
          <div v-if="aiResult" class="ft-result">
            <div class="ft-result__head">
              <span>解释</span>
              <button class="btn btn--ghost btn--sm" @click="copyResult">复制</button>
            </div>
            <textarea class="ft-result__text" v-model="aiResult" rows="10"></textarea>
          </div>
        </div>

        <!-- 补充 description -->
        <div v-if="activeTool === 'enrich_desc'">
          <div class="hint mb-sm">基于现有 description，AI 找空缺补全（如缺外貌 / 缺习惯 / 缺背景），不破坏原有内容</div>
          <div class="form-group">
            <label>当前 description（{{ (cardStore.cardData.description || '').length }} 字）</label>
            <textarea class="textarea" rows="4" :value="(cardStore.cardData.description || '').slice(0, 400) + ((cardStore.cardData.description || '').length > 400 ? '...' : '')" readonly></textarea>
          </div>
          <div class="form-group">
            <label>侧重补什么（可空，留空让 AI 自己判断）</label>
            <input class="input" v-model="enrichFocus" placeholder="如：感官细节 / 日常习惯 / 童年伏笔">
          </div>
          <button class="btn btn--primary btn--sm" :disabled="loading || !cardStore.cardData.description" @click="runEnrichDesc">
            {{ loading ? '扩写中...' : '扩写' }}
          </button>
          <div v-if="aiResult" class="ft-result">
            <div class="ft-result__head">
              <span>扩写后（{{ aiResult.length }} 字）</span>
              <div class="flex-row">
                <button class="btn btn--ghost btn--sm" @click="copyResult">复制</button>
                <button class="btn btn--accent btn--sm" @click="applyEnrichedDesc">应用到 description</button>
              </div>
            </div>
            <textarea class="ft-result__text" v-model="aiResult" rows="12"></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCardStore } from '../stores/card.js';
import { useApiStore } from '../stores/api.js';
import { useAppStore } from '../stores/app.js';
import { buildCardContext } from '../utils/card-context.js';
import { sortedWorldSections, groupWorldEntries } from '../utils/world-sections.js';
import InspirationChat from './InspirationChat.vue';
import { useFloatingToolsStore, FLOATING_TOOLS } from '../stores/floating-tools.js';

const cardStore = useCardStore();
const apiStore = useApiStore();
const appStore = useAppStore();
const toolSettings = useFloatingToolsStore();
const route = useRoute();
const router = useRouter();

// 位置 + 拖动
const POS_KEY = 'cf_floating_tools_pos';
const pos = reactive({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
try {
  const saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
  if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
    pos.x = Math.max(0, Math.min(window.innerWidth - 60, saved.x));
    pos.y = Math.max(40, Math.min(window.innerHeight - 60, saved.y));
  }
} catch {}

const expanded = ref(false);
const dragging = ref(false);
let dragOffset = { x: 0, y: 0 };
let dragMoved = false;

function onBallMouseDown(e) {
  dragging.value = true;
  dragMoved = false;
  dragOffset.x = e.clientX - pos.x;
  dragOffset.y = e.clientY - pos.y;
}
function onMouseMove(e) {
  if (!dragging.value) return;
  const nx = e.clientX - dragOffset.x;
  const ny = e.clientY - dragOffset.y;
  if (Math.abs(nx - pos.x) > 3 || Math.abs(ny - pos.y) > 3) dragMoved = true;
  pos.x = Math.max(0, Math.min(window.innerWidth - 60, nx));
  pos.y = Math.max(40, Math.min(window.innerHeight - 60, ny));
}
function onMouseUp() {
  if (!dragging.value) return;
  dragging.value = false;
  if (!dragMoved && !expanded.value) {
    expanded.value = true;
  }
  localStorage.setItem(POS_KEY, JSON.stringify({ x: pos.x, y: pos.y }));
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});
onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});

const ballStyle = computed(() => ({
  left: pos.x + 'px',
  top: pos.y + 'px'
}));

// 面板从球的位置展开，超出右/下边界时自动反向
const PANEL_W = 360;
const PANEL_H = 500;
const panelStyle = computed(() => {
  let left = pos.x;
  let top = pos.y;
  if (left + PANEL_W > window.innerWidth - 10) left = Math.max(10, window.innerWidth - PANEL_W - 10);
  if (top + PANEL_H > window.innerHeight - 10) top = Math.max(40, window.innerHeight - PANEL_H - 10);
  return { left: left - pos.x + 'px', top: top - pos.y + 'px' };
});

const availableTools = computed(() => toolSettings.enabledTools.filter(t => {
  if (t.onlyRoute && route.path !== t.onlyRoute) return false;
  return true;
}));

function defaultTool(tools) {
  if (route.path === '/agent' && tools.some(tool => tool.key === 'optimize_entry')) return 'optimize_entry';
  return tools.find(tool => !tool.isJump)?.key || 'chat';
}
const activeTool = ref(defaultTool(availableTools.value));
watch([availableTools, () => route.path], ([tools, path], [, previousPath]) => {
  if (path === '/agent' && previousPath !== '/agent' && tools.some(tool => tool.key === 'optimize_entry')) {
    activeTool.value = 'optimize_entry';
  } else if (!tools.find(t => t.key === activeTool.value)) {
    activeTool.value = defaultTool(tools);
  }
});

function switchTool(key) {
  const tool = FLOATING_TOOLS.find(t => t.key === key);
  if (tool?.isJump) {
    router.push('/diagnostic');
    expanded.value = false;
    return;
  }
  activeTool.value = key;
  aiResult.value = '';
}

// ========== 通用 AI 调用 ==========
const loading = ref(false);
const aiResult = ref('');

async function callAi(systemPrompt, userPrompt, opts = {}) {
  if (!apiStore.isConfigured) {
    appStore.toastError('请先在 API 设置中配置 API');
    throw new Error('API 未配置');
  }
  return await apiStore.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], {
    temperature: opts.temperature ?? 0.7,
    maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model)
  });
}

function copyResult() {
  if (!aiResult.value) return;
  navigator.clipboard.writeText(aiResult.value).then(() => {
    appStore.toastSuccess('已复制');
  }).catch(() => appStore.toastError('复制失败'));
}

// 拼角色卡上下文，传 matchText 启用绿灯关键词匹配
function cardCtx(matchText = '') {
  return buildCardContext(cardStore, matchText, toolSettings.contextLimits);
}

// ========== 工具1：写开场白 ==========
const greetingStyle = ref('');
const greetingLen = ref('400');

async function runGreeting() {
  loading.value = true;
  aiResult.value = '';
  try {
    const sys = '你是 SillyTavern 角色卡 first_mes 写作专家。按"绝对零度+特征差异化+关系禁标签"原则写。禁止八股化语言（似乎/仿佛/嘴角微微上扬）。直接写场景，不要写心理旁白。';
    const matchText = `${greetingStyle.value || ''} ${cardStore.cardData.first_mes || ''}`;
    const usr = `请基于以下角色卡信息，写一个 first_mes（开场白）：

${cardCtx(matchText)}

${greetingStyle.value ? `风格倾向：${greetingStyle.value}` : ''}
字数控制：约 ${greetingLen.value} 字

直接输出开场白正文，不要前缀、不要 Markdown 包裹、不要解释。`;
    aiResult.value = await callAi(sys, usr, { temperature: 0.85 });
  } catch (e) {
    appStore.toastError('生成失败：' + e.message);
  } finally {
    loading.value = false;
  }
}

function applyGreeting() {
  if (!aiResult.value) return;
  cardStore.cardData.first_mes = aiResult.value;
  cardStore.markDirty?.();
  appStore.toastSuccess('已写入 first_mes');
}

// ========== 工具2：优化选中条目 ==========
const entrySelectedId = ref('');
const entryDirection = ref('');
const entrySearch = ref('');
// watch 注册时会立即读取筛选结果，先初始化其依赖。
const worldEntries = computed(() => {
  const entries = (cardStore.worldEntries || []).slice().sort((a, b) =>
    (a.extensions?.cfSortKey ?? 0) - (b.extensions?.cfSortKey ?? 0));
  const sections = sortedWorldSections(cardStore.cardData.character_book);
  return groupWorldEntries(entries, sections).flatMap(group => group.entries);
});
const filteredEntries = computed(() => {
  const q = entrySearch.value.trim().toLowerCase();
  if (!q) return worldEntries.value;
  const sequence = q.match(/^#(\d+)$/);
  if (sequence) return worldEntries.value.filter(e => e.extensions?.cfSortKey === Number(sequence[1]));
  return worldEntries.value.filter(e => {
    if (String(e.extensions?.cfSortKey ?? '').includes(q)) return true;
    if ((e.comment || '').toLowerCase().includes(q)) return true;
    if ((e.content || '').toLowerCase().includes(q)) return true;
    const keys = Array.isArray(e.keys) ? e.keys : [];
    if (keys.some(k => String(k).toLowerCase().includes(q))) return true;
    return false;
  });
});
// 搜索过滤后，如果当前选中的 id 不在结果里，自动清掉避免下拉显示空白却 id 还在
watch(filteredEntries, (list) => {
  if (entrySelectedId.value !== '' && !list.some(e => e.id === entrySelectedId.value)) {
    entrySelectedId.value = '';
  }
});

async function runOptimizeEntry() {
  loading.value = true;
  aiResult.value = '';
  try {
    const entry = worldEntries.value.find(e => e.id === entrySelectedId.value);
    if (!entry) throw new Error('未找到该条目');
    const strictWording = cardStore.cardData.extensions?.cfStrictWording || '';
    const sys = `你是 SillyTavern 世界书条目改写专家。按"绝对零度+白描+特征差异化"原则改写，禁八股语言。保持原条目的核心信息和长度框架。${strictWording ? '严格遵守用户提供的严格用词设定。' : ''}`;
    const matchText = `${(entry.keys || []).join(' ')} ${entryDirection.value || ''}`;
    const usr = `请改写以下世界书条目：

【条目名】${entry.comment || '(未命名)'}
【关键词】${(entry.keys || []).join(', ')}
【原内容】
${entry.content || ''}

【改写方向】
${entryDirection.value || '提升写作质量，去除套路化描写'}

——以下是角色卡其他背景设定（其中包含创作约定和严格用词设定），改写时保持风格和世界观自洽——
${cardCtx(matchText)}

直接输出改写后的完整内容，不要前缀、不要解释。`;
    aiResult.value = await callAi(sys, usr, { temperature: 0.7 });
  } catch (e) {
    appStore.toastError('改写失败：' + e.message);
  } finally {
    loading.value = false;
  }
}

function applyEntryRewrite() {
  if (!aiResult.value || entrySelectedId.value === '') return;
  const entry = worldEntries.value.find(e => e.id === entrySelectedId.value);
  if (!entry) {
    appStore.toastError('条目不存在了');
    return;
  }
  entry.content = aiResult.value;
  cardStore.markDirty?.();
  appStore.toastSuccess(`已写入条目：${entry.comment || entry.id}`);
}

// ========== 工具3：起 NPC 名 ==========
const npcCount = ref(5);
const npcGender = ref('女');
const npcStyle = ref('');

async function runNpcName() {
  loading.value = true;
  aiResult.value = '';
  try {
    const sys = '你是命名专家，按用户要求的风格和性别给出候选名字。每个名字单独一行，附带一行简短性格暗示。';
    const usr = `请生成 ${npcCount.value} 个 NPC 名字。
性别：${npcGender.value}
风格：${npcStyle.value || '请按当前角色卡的整体调性自由发挥'}
当前角色卡参考：
${cardCtx(npcStyle.value) || '(空)'}

格式：每个名字一行，下面缩进一行写一句话性格暗示。
不要编号，不要前缀。`;
    aiResult.value = await callAi(sys, usr, { temperature: 0.9 });
  } catch (e) {
    appStore.toastError('取名失败：' + e.message);
  } finally {
    loading.value = false;
  }
}

// ========== 工具4：解释代码 ==========
const codeInput = ref('');

async function runExplainCode() {
  loading.value = true;
  aiResult.value = '';
  try {
    const sys = '你是 SillyTavern 角色卡技术专家，懂正则 / EJS / JS / Zod schema / 酒馆助手脚本。请用人话讲清代码做什么、可能的副作用、容易踩的坑。语言简洁。';
    const usr = `请解释以下代码：

\`\`\`
${codeInput.value}
\`\`\`

输出包含：
1. 这段代码做什么（一句话）
2. 关键逻辑分解
3. 注意事项 / 可能的坑（如果有）`;
    aiResult.value = await callAi(sys, usr, { temperature: 0.4 });
  } catch (e) {
    appStore.toastError('解释失败：' + e.message);
  } finally {
    loading.value = false;
  }
}

// ========== 工具5：补充 description ==========
const enrichFocus = ref('');

async function runEnrichDesc() {
  loading.value = true;
  aiResult.value = '';
  try {
    const desc = cardStore.cardData.description || '';
    if (!desc.trim()) throw new Error('当前 description 为空');
    const sys = '你是 SillyTavern 角色卡 description 写作专家。按"绝对零度+特征差异化+关系禁标签"原则补全。禁八股化语言。原有内容尽量保留，只补空缺。';
    const matchText = `${enrichFocus.value || ''} ${desc.slice(0, 500)}`;
    const usr = `请基于现有 description 补全空缺，输出完整新版（包含原有内容 + 补充部分）：

【现有 description】
${desc}

${enrichFocus.value ? `【侧重补充】\n${enrichFocus.value}` : '请自行判断哪些常见维度缺失（外貌特征 / 日常习惯 / 关系 / 背景伏笔等）'}

——以下是角色卡其他背景设定，补全时保持风格和世界观自洽——
${cardCtx(matchText)}

输出完整 description，不要前缀、不要解释、不要 Markdown 包裹。`;
    aiResult.value = await callAi(sys, usr, { temperature: 0.75 });
  } catch (e) {
    appStore.toastError('扩写失败：' + e.message);
  } finally {
    loading.value = false;
  }
}

function applyEnrichedDesc() {
  if (!aiResult.value) return;
  cardStore.cardData.description = aiResult.value;
  cardStore.markDirty?.();
  appStore.toastSuccess('已写入 description');
}
</script>

<style scoped>
.ft-root {
  position: fixed;
  z-index: 8500;
  user-select: none;
}

/* ── 球 ── */
.ft-ball {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f7b267, #d97706);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.25);
  cursor: grab;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.ft-ball:hover {
  transform: scale(1.06);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
}
.ft-ball--dragging { cursor: grabbing; transform: scale(1.1); }
.ft-ball__icon { line-height: 1; }

/* ── 面板 ── */
.ft-panel {
  position: absolute;
  width: 360px;
  height: 500px;
  background: rgba(20, 22, 35, 0.92);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border: 1px solid var(--cf-border-light);
  border-radius: var(--cf-radius-lg);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ft-panel__header {
  padding: 8px 12px;
  background: var(--cf-bg-tertiary);
  border-bottom: 1px solid var(--cf-border);
  display: flex; justify-content: space-between; align-items: center;
  cursor: grab;
}
.ft-panel__header:active { cursor: grabbing; }
.ft-panel__title { font-size: 13px; font-weight: 600; }
.ft-panel__actions { display: flex; align-items: center; gap: 6px; }
.ft-panel__close {
  background: transparent; border: none;
  color: var(--cf-text-muted); cursor: pointer;
  font-size: 18px; line-height: 1; padding: 0 6px;
}
.ft-panel__close:hover { color: var(--cf-text-primary); }

.ft-panel__tabs {
  display: flex;
  gap: 2px;
  padding: 6px 8px;
  background: var(--cf-bg-tertiary);
  border-bottom: 1px solid var(--cf-border);
  overflow-x: auto;
  flex-wrap: nowrap;
}
.ft-tab {
  background: transparent;
  border: 1px solid transparent;
  color: var(--cf-text-secondary);
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}
.ft-tab:hover { background: var(--cf-bg-hover); color: var(--cf-text-primary); }
.ft-tab--active {
  background: var(--cf-accent);
  color: #fff;
  border-color: var(--cf-accent);
}

.ft-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
}
.ft-panel__body--chat { overflow: hidden; }
.ft-panel__body input, .ft-panel__body textarea { user-select: text; -webkit-user-select: text; }
.ft-panel__body .form-group { margin-bottom: 8px; }
.ft-panel__body label { font-size: 11px; color: var(--cf-text-muted); display: block; margin-bottom: 3px; }
.ft-panel__body .input,
.ft-panel__body .select,
.ft-panel__body .textarea {
  font-size: 12px;
  padding: 4px 8px;
  width: 100%;
}

.ft-result {
  margin-top: 10px;
  border-top: 1px dashed var(--cf-border);
  padding-top: 8px;
}
.ft-result__head {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: var(--cf-text-muted);
  margin-bottom: 4px;
}
.ft-result__text {
  width: 100%;
  padding: 6px 8px;
  background: var(--cf-bg-tertiary);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm);
  color: var(--cf-text-primary);
  font-family: var(--cf-font-mono);
  font-size: 11px;
  line-height: 1.6;
  resize: vertical;
}

.hint { color: var(--cf-text-muted); font-size: 11px; line-height: 1.5; }
.mb-sm { margin-bottom: 8px; }
.flex-row { display: flex; align-items: center; gap: 6px; }
</style>
