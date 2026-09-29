<template>
  <div v-if="visible" class="cf-confirm-overlay" @click.self="close">
    <div class="cf-asset-dialog">
      <div class="cf-asset-header">
        <div class="cf-asset-title">从其他卡导入资产</div>
        <button class="cf-asset-close" @click="close">x</button>
      </div>

      <!-- 步骤 1：选文件 -->
      <div v-if="step === 'pick'" class="cf-asset-step">
        <p class="cf-asset-tip">选一张 PNG 或 JSON 角色卡，从中挑选要并入当前卡的资产。</p>
        <div class="cf-asset-pickbox">
          <button class="btn btn--primary" @click="pickFile" :disabled="loading">
            {{ loading ? '解析中...' : '选择 PNG / JSON 文件' }}
          </button>
          <div v-if="error" class="cf-asset-error">{{ error }}</div>
        </div>
        <div class="cf-asset-hint">
          说明：EJS 模板包含在「世界书条目」中，前端状态栏包含在「正则脚本」中——按 comment / 名称识别即可。
        </div>
      </div>

      <!-- 步骤 2：勾选资产 -->
      <div v-if="step === 'pick-assets'" class="cf-asset-step">
        <div class="cf-asset-source">
          来源：<strong>{{ sourceCardName }}</strong>
          <button class="btn btn--ghost btn--sm" @click="reset">重选文件</button>
        </div>

        <!-- 世界书条目 -->
        <div v-if="src.worldEntries.length" class="cf-asset-section">
          <div class="cf-asset-section-head">
            <label class="cf-asset-section-label">
              <input type="checkbox" :checked="allWorldChecked" @change="toggleAllWorld($event.target.checked)" />
              <strong>世界书条目</strong> ({{ pickedWorld.size }}/{{ src.worldEntries.length }})
            </label>
            <input class="input cf-asset-search" v-model="filterWorld" placeholder="搜索 comment/key/内容" />
          </div>
          <div class="cf-asset-list">
            <label v-for="(e, i) in filteredWorld" :key="'w'+i" class="cf-asset-item">
              <input type="checkbox" :checked="pickedWorld.has(e.__idx)" @change="togglePicked(pickedWorld, e.__idx)" />
              <div class="cf-asset-item-body">
                <div class="cf-asset-item-title">{{ e.comment || '(无 comment)' }}</div>
                <div class="cf-asset-item-meta">
                  keys: {{ (e.keys || []).slice(0,3).join(', ') || '-' }}
                  · {{ e.constant ? '常驻' : (e.selective ? '选择性' : '关键词') }}
                </div>
                <div class="cf-asset-item-preview">{{ (e.content || '').slice(0, 100) }}{{ (e.content || '').length > 100 ? '...' : '' }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- 正则脚本 -->
        <div v-if="src.regexScripts.length" class="cf-asset-section">
          <div class="cf-asset-section-head">
            <label class="cf-asset-section-label">
              <input type="checkbox" :checked="allRegexChecked" @change="toggleAllRegex($event.target.checked)" />
              <strong>正则脚本</strong> ({{ pickedRegex.size }}/{{ src.regexScripts.length }})
            </label>
          </div>
          <div class="cf-asset-list">
            <label v-for="(s, i) in src.regexScripts" :key="'r'+i" class="cf-asset-item">
              <input type="checkbox" :checked="pickedRegex.has(i)" @change="togglePicked(pickedRegex, i)" />
              <div class="cf-asset-item-body">
                <div class="cf-asset-item-title">{{ s.scriptName || '(无名)' }}</div>
                <div class="cf-asset-item-meta">find: {{ (s.findRegex || '').slice(0, 60) }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- 酒馆助手脚本 -->
        <div v-if="src.tavernScripts.length" class="cf-asset-section">
          <div class="cf-asset-section-head">
            <label class="cf-asset-section-label">
              <input type="checkbox" :checked="allTavernChecked" @change="toggleAllTavern($event.target.checked)" />
              <strong>酒馆助手脚本</strong> ({{ pickedTavern.size }}/{{ src.tavernScripts.length }})
            </label>
          </div>
          <div class="cf-asset-list">
            <label v-for="(s, i) in src.tavernScripts" :key="'t'+i" class="cf-asset-item">
              <input type="checkbox" :checked="pickedTavern.has(i)" @change="togglePicked(pickedTavern, i)" />
              <div class="cf-asset-item-body">
                <div class="cf-asset-item-title">{{ s.name || '(无名)' }}</div>
                <div class="cf-asset-item-meta">{{ (s.info || '').slice(0, 80) || '(无说明)' }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- MVU 变量定义 -->
        <div v-if="src.mvuVarGroups" class="cf-asset-section">
          <label class="cf-asset-section-label">
            <input type="checkbox" v-model="pickedMvu" />
            <strong>MVU 变量定义</strong>
            ({{ mvuGroupsCount }} 组 / {{ mvuVarsCount }} 个变量)
          </label>
          <div class="cf-asset-hint" style="margin-left:24px">导入后会替换当前卡的整套 MVU 变量定义</div>
        </div>

        <div v-if="!hasAnyAssets" class="cf-asset-empty">这张卡没有任何可导入的资产</div>

        <div class="cf-asset-actions">
          <span class="cf-asset-summary">已选 {{ totalPicked }} 项</span>
          <button class="btn btn--secondary" @click="close">取消</button>
          <button class="btn btn--primary" @click="startImport" :disabled="totalPicked === 0">开始导入</button>
        </div>
      </div>

      <!-- 步骤 3：导入完成 -->
      <div v-if="step === 'done'" class="cf-asset-step">
        <div class="cf-asset-result">
          <h3>导入完成</h3>
          <ul>
            <li v-for="(line, i) in resultLines" :key="i">{{ line }}</li>
          </ul>
          <button class="btn btn--primary" @click="close">关闭</button>
        </div>
      </div>
    </div>

    <!-- 冲突弹窗（覆盖在主对话框上） -->
    <div v-if="conflict.visible" class="cf-confirm-overlay" style="z-index:10001">
      <div class="cf-confirm-dialog" style="max-width:500px">
        <div class="cf-confirm-msg">
          <div style="font-weight:600;margin-bottom:8px">{{ conflict.typeLabel }}重名冲突</div>
          <div>「<strong>{{ conflict.name }}</strong>」已存在，怎么处理？</div>
          <label style="display:flex;align-items:center;gap:6px;margin-top:14px;font-size:13px;color:var(--cf-text-muted)">
            <input type="checkbox" v-model="conflict.applyToAll" />
            本次后续同类冲突都这样处理
          </label>
        </div>
        <div class="cf-confirm-btns" style="flex-wrap:wrap">
          <button class="btn btn--secondary" @click="resolveConflict('skip')">跳过</button>
          <button class="btn btn--secondary" @click="resolveConflict('rename')">重命名后添加</button>
          <button class="btn btn--primary" @click="resolveConflict('append')">追加为新条目</button>
          <button class="btn btn--ghost" @click="resolveConflict('cancel')">取消整次导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useCardStore } from '../stores/card.js';
import { useAppStore } from '../stores/app.js';

const props = defineProps({
  visible: { type: Boolean, default: false }
});
const emit = defineEmits(['close']);

const cardStore = useCardStore();
const appStore = useAppStore();

const step = ref('pick');           // 'pick' | 'pick-assets' | 'done'
const loading = ref(false);
const error = ref('');

const sourceCardName = ref('');
const src = reactive({
  worldEntries: [],
  regexScripts: [],
  tavernScripts: [],
  mvuVarGroups: null
});

const pickedWorld = ref(new Set());
const pickedRegex = ref(new Set());
const pickedTavern = ref(new Set());
const pickedMvu = ref(false);

const filterWorld = ref('');

const resultLines = ref([]);

const conflict = reactive({
  visible: false,
  type: '',          // 'world' | 'regex' | 'tavern'
  typeLabel: '',
  name: '',
  applyToAll: false,
  resolve: null      // 当前 promise 的 resolve
});
// 跨条目记住的"全部应用"决策
const rememberedChoice = reactive({ world: null, regex: null, tavern: null });

function close() {
  emit('close');
  // 给关闭动画留点时间，再重置（非必须）
  setTimeout(reset, 200);
}

function reset() {
  step.value = 'pick';
  loading.value = false;
  error.value = '';
  sourceCardName.value = '';
  src.worldEntries = [];
  src.regexScripts = [];
  src.tavernScripts = [];
  src.mvuVarGroups = null;
  pickedWorld.value = new Set();
  pickedRegex.value = new Set();
  pickedTavern.value = new Set();
  pickedMvu.value = false;
  filterWorld.value = '';
  resultLines.value = [];
  rememberedChoice.world = null;
  rememberedChoice.regex = null;
  rememberedChoice.tavern = null;
}

async function pickFile() {
  loading.value = true;
  error.value = '';
  try {
    const filePath = await window.cardForgeAPI.openFile();
    if (!filePath) { loading.value = false; return; }

    let json;
    if (filePath.toLowerCase().endsWith('.json')) {
      const r = await window.cardForgeAPI.readTextFile(filePath);
      if (!r.success) throw new Error(r.error);
      json = JSON.parse(r.data);
    } else if (filePath.toLowerCase().endsWith('.png')) {
      const r = await window.cardForgeAPI.extractCharaData(filePath);
      if (!r.success) throw new Error(r.error);
      json = r.data;
    } else {
      throw new Error('只支持 PNG / JSON');
    }

    const data = json.data || json;
    sourceCardName.value = data.name || '(未命名)';
    src.worldEntries = ((data.character_book && data.character_book.entries) || []).map((e, i) => ({ ...e, __idx: i }));
    src.regexScripts = (data.extensions && data.extensions.regex_scripts) || [];
    const th = data.extensions && data.extensions.tavern_helper;
    if (Array.isArray(th)) {
      const pair = th.find(x => x[0] === 'scripts');
      src.tavernScripts = pair ? pair[1] : [];
    } else {
      src.tavernScripts = (th && th.scripts) || [];
    }
    src.mvuVarGroups = (data.extensions && data.extensions.cfMvuVarGroups) || null;

    step.value = 'pick-assets';
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

const filteredWorld = computed(() => {
  const q = filterWorld.value.trim().toLowerCase();
  if (!q) return src.worldEntries;
  return src.worldEntries.filter(e =>
    (e.comment || '').toLowerCase().includes(q) ||
    (e.content || '').toLowerCase().includes(q) ||
    (e.keys || []).some(k => String(k).toLowerCase().includes(q))
  );
});

const allWorldChecked = computed(() => src.worldEntries.length > 0 && pickedWorld.value.size === src.worldEntries.length);
const allRegexChecked = computed(() => src.regexScripts.length > 0 && pickedRegex.value.size === src.regexScripts.length);
const allTavernChecked = computed(() => src.tavernScripts.length > 0 && pickedTavern.value.size === src.tavernScripts.length);

function toggleAllWorld(checked) {
  pickedWorld.value = checked ? new Set(src.worldEntries.map(e => e.__idx)) : new Set();
}
function toggleAllRegex(checked) {
  pickedRegex.value = checked ? new Set(src.regexScripts.map((_, i) => i)) : new Set();
}
function toggleAllTavern(checked) {
  pickedTavern.value = checked ? new Set(src.tavernScripts.map((_, i) => i)) : new Set();
}
function togglePicked(set, key) {
  const newSet = new Set(set.value || set);
  if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
  // 找到引用并更新（pickedXxx 是 ref<Set>）
  if (set === pickedWorld.value) pickedWorld.value = newSet;
  else if (set === pickedRegex.value) pickedRegex.value = newSet;
  else if (set === pickedTavern.value) pickedTavern.value = newSet;
}

const mvuGroupsCount = computed(() => {
  if (!src.mvuVarGroups || !Array.isArray(src.mvuVarGroups)) return 0;
  return src.mvuVarGroups.length;
});
const mvuVarsCount = computed(() => {
  if (!src.mvuVarGroups || !Array.isArray(src.mvuVarGroups)) return 0;
  return src.mvuVarGroups.reduce((s, g) => s + (g.variables ? g.variables.length : 0), 0);
});

const totalPicked = computed(() =>
  pickedWorld.value.size + pickedRegex.value.size + pickedTavern.value.size + (pickedMvu.value ? 1 : 0)
);
const hasAnyAssets = computed(() =>
  src.worldEntries.length || src.regexScripts.length || src.tavernScripts.length || src.mvuVarGroups
);

// 弹冲突弹窗，返回 'append' | 'skip' | 'rename' | 'cancel'
function askConflict(type, name) {
  return new Promise(resolve => {
    conflict.type = type;
    conflict.typeLabel = type === 'world' ? '世界书条目' : type === 'regex' ? '正则脚本' : '酒馆助手脚本';
    conflict.name = name;
    conflict.applyToAll = false;
    conflict.resolve = resolve;
    conflict.visible = true;
  });
}
function resolveConflict(action) {
  if (conflict.applyToAll && action !== 'cancel') {
    rememberedChoice[conflict.type] = action;
  }
  conflict.visible = false;
  if (conflict.resolve) {
    const r = conflict.resolve;
    conflict.resolve = null;
    r(action);
  }
}

function uniqueName(baseName, existsFn) {
  let i = 2;
  while (existsFn(`${baseName} (${i})`)) i++;
  return `${baseName} (${i})`;
}

async function startImport() {
  const result = { world: 0, regex: 0, tavern: 0, mvu: 0, skipped: 0, renamed: 0 };
  let cancelled = false;

  // ---- 世界书条目 ----
  if (pickedWorld.value.size) {
    const existingComments = new Set(cardStore.worldEntries.map(e => e.comment || ''));
    for (const idx of pickedWorld.value) {
      const entry = JSON.parse(JSON.stringify(src.worldEntries[idx]));
      delete entry.__idx;
      const name = entry.comment || '';
      let action = 'append';
      if (name && existingComments.has(name)) {
        action = rememberedChoice.world || await askConflict('world', name);
        if (action === 'cancel') { cancelled = true; break; }
      }
      if (action === 'skip') { result.skipped++; continue; }
      if (action === 'rename' && name) {
        entry.comment = uniqueName(name, n => existingComments.has(n));
        result.renamed++;
      }
      // 用 store 提供的方法添加（会自动分配 id 和 cfSortKey）
      cardStore.addWorldEntry(entry);
      existingComments.add(entry.comment || '');
      result.world++;
    }
  }

  // ---- 正则脚本 ----
  if (!cancelled && pickedRegex.value.size) {
    const existingNames = new Set(cardStore.regexScripts.map(s => s.scriptName || ''));
    for (const idx of pickedRegex.value) {
      const script = JSON.parse(JSON.stringify(src.regexScripts[idx]));
      const name = script.scriptName || '';
      let action = 'append';
      if (name && existingNames.has(name)) {
        action = rememberedChoice.regex || await askConflict('regex', name);
        if (action === 'cancel') { cancelled = true; break; }
      }
      if (action === 'skip') { result.skipped++; continue; }
      if (action === 'rename' && name) {
        script.scriptName = uniqueName(name, n => existingNames.has(n));
        result.renamed++;
      }
      // 重新生成 id 避免冲突
      script.id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random());
      cardStore.addRegexScript(script);
      existingNames.add(script.scriptName || '');
      result.regex++;
    }
  }

  // ---- 酒馆助手脚本 ----
  if (!cancelled && pickedTavern.value.size) {
    const existingNames = new Set(cardStore.tavernScripts.map(s => s.name || ''));
    for (const idx of pickedTavern.value) {
      const script = JSON.parse(JSON.stringify(src.tavernScripts[idx]));
      const name = script.name || '';
      let action = 'append';
      if (name && existingNames.has(name)) {
        action = rememberedChoice.tavern || await askConflict('tavern', name);
        if (action === 'cancel') { cancelled = true; break; }
      }
      if (action === 'skip') { result.skipped++; continue; }
      if (action === 'rename' && name) {
        script.name = uniqueName(name, n => existingNames.has(n));
        result.renamed++;
      }
      script.id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random());
      cardStore.addTavernScript(script);
      existingNames.add(script.name || '');
      result.tavern++;
    }
  }

  // ---- MVU 变量定义 ----
  if (!cancelled && pickedMvu.value && src.mvuVarGroups) {
    if (!cardStore.cardData.extensions) cardStore.cardData.extensions = {};
    cardStore.cardData.extensions.cfMvuVarGroups = JSON.parse(JSON.stringify(src.mvuVarGroups));
    cardStore.markDirty();
    result.mvu = 1;
  }

  // ---- 显示结果 ----
  resultLines.value = [];
  if (cancelled) {
    resultLines.value.push('已取消（前面已应用的不会回滚）');
  }
  if (result.world) resultLines.value.push(`世界书条目：导入 ${result.world} 条`);
  if (result.regex) resultLines.value.push(`正则脚本：导入 ${result.regex} 个`);
  if (result.tavern) resultLines.value.push(`酒馆助手脚本：导入 ${result.tavern} 个`);
  if (result.mvu) resultLines.value.push(`MVU 变量定义：已替换`);
  if (result.skipped) resultLines.value.push(`跳过：${result.skipped} 个`);
  if (result.renamed) resultLines.value.push(`重命名：${result.renamed} 个`);
  if (resultLines.value.length === 0) resultLines.value.push('没有任何资产被导入');

  step.value = 'done';
  if (result.world + result.regex + result.tavern + result.mvu > 0) {
    appStore.toastSuccess('导入完成');
  }
}
</script>

<style lang="scss" scoped>
.cf-asset-dialog {
  background: var(--cf-bg-card, #1a1f2e);
  border: 1px solid var(--cf-border, rgba(255,255,255,0.1));
  border-radius: 12px;
  padding: 16px;
  width: 92vw;
  max-width: 900px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
.cf-asset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.cf-asset-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--cf-text-primary, #e6edf3);
}
.cf-asset-close {
  background: transparent;
  border: 1px solid var(--cf-border);
  color: var(--cf-text-primary);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.08); }
}
.cf-asset-step {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cf-asset-tip {
  color: var(--cf-text-secondary, #a7b1c2);
  font-size: 14px;
}
.cf-asset-pickbox {
  padding: 32px;
  text-align: center;
  border: 1px dashed var(--cf-border);
  border-radius: 8px;
}
.cf-asset-error {
  color: #f87171;
  margin-top: 12px;
  font-size: 13px;
}
.cf-asset-hint {
  font-size: 12px;
  color: var(--cf-text-muted, #8b95a7);
  font-style: italic;
}
.cf-asset-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  font-size: 13px;
  color: var(--cf-text-secondary);
}
.cf-asset-section {
  border: 1px solid var(--cf-border, rgba(255,255,255,0.08));
  border-radius: 8px;
  padding: 10px;
  background: rgba(0,0,0,0.15);
}
.cf-asset-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.cf-asset-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--cf-text-primary);
  font-size: 14px;
}
.cf-asset-search {
  width: 240px;
  font-size: 12px;
}
.cf-asset-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cf-asset-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.04); }
}
.cf-asset-item-body { flex: 1; min-width: 0; }
.cf-asset-item-title {
  font-size: 13px;
  color: var(--cf-text-primary);
  font-weight: 500;
  word-break: break-word;
}
.cf-asset-item-meta {
  font-size: 11px;
  color: var(--cf-text-muted);
  margin-top: 2px;
}
.cf-asset-item-preview {
  font-size: 11px;
  color: var(--cf-text-muted);
  margin-top: 4px;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
}
.cf-asset-empty {
  text-align: center;
  padding: 32px;
  color: var(--cf-text-muted);
  font-size: 13px;
}
.cf-asset-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--cf-border);
  margin-top: 8px;
}
.cf-asset-summary {
  margin-right: auto;
  color: var(--cf-text-muted);
  font-size: 13px;
}
.cf-asset-result {
  text-align: left;
  padding: 16px;
  h3 { color: var(--cf-text-primary); margin-bottom: 12px; }
  ul { padding-left: 20px; line-height: 1.8; color: var(--cf-text-secondary); }
  li { font-size: 13px; }
  button { margin-top: 16px; }
}
</style>
