<template>
  <div class="page api-settings">
    <div class="page__header">
      <h1>API 设置</h1>
      <p>按用途保存你的 API 预设，自由命名、折叠和切换。</p>
    </div>

    <div class="card mb-md current-bar">
      <div class="card__body current-content">
        <div class="current-summary">
          <span class="hint">当前使用</span>
          <strong v-if="currentProvider">{{ presetName(currentProvider) }}</strong>
          <strong v-else>暂无可用预设</strong>
          <span v-if="currentProvider" class="hint">{{ currentProvider.model }}</span>
        </div>
        <span class="save-state" :class="{ 'save-state--error': apiStore.saveState === 'error' }" role="status">{{ saveLabel }}</span>
      </div>
    </div>
    <div v-if="apiStore.saveState === 'error'" class="save-error mb-md" role="alert">
      <span>{{ apiStore.saveError }}</span>
      <button class="btn btn--secondary btn--sm" @click="retrySave">{{ apiStore.settingsLoaded ? '重试保存' : '重新读取' }}</button>
    </div>

    <div class="preset-toolbar mb-md">
      <div><h3>我的预设 <span class="badge badge--info">{{ apiStore.providers.length }}</span></h3>
        <p class="hint">每个预设独立配置；同一种接口协议可以添加多个。修改自动保存到本机。</p>
      </div>
      <div class="header-actions">
        <button class="btn btn--ghost btn--sm" :disabled="!apiStore.providers.length || !apiStore.settingsLoaded" @click="setAllCollapsed(false)">全部展开</button>
        <button class="btn btn--ghost btn--sm" :disabled="!apiStore.providers.length || !apiStore.settingsLoaded" @click="setAllCollapsed(true)">全部折叠</button>
        <button class="btn btn--primary" :disabled="!apiStore.settingsLoaded" @click="addPreset">＋ 新建 API 预设</button>
      </div>
    </div>

    <div v-if="!apiStore.settingsLoaded" class="card empty-state">{{ apiStore.saveState === 'loading' ? '正在读取 API 预设…' : '请先重新读取配置。' }}</div>
    <div v-else-if="!apiStore.providers.length" class="card empty-state">
      <h3>还没有 API 预设</h3>
      <p class="hint">创建一个预设，填写名称、服务地址、Key 和模型，就可以开始使用 AI 功能。</p>
      <button class="btn btn--primary" @click="addPreset">＋ 创建第一个预设</button>
    </div>

    <template v-if="apiStore.settingsLoaded">
      <section v-for="provider in apiStore.providers" :key="provider.id" class="card preset-card mb-md"
        :class="{ 'provider-active': currentProvider?.id === provider.id }">
        <div class="card__header preset-header">
          <button class="preset-toggle" type="button" :aria-expanded="!isCollapsed(provider)" :aria-controls="'preset-body-' + provider.id"
            :aria-label="(isCollapsed(provider) ? '展开 ' : '折叠 ') + presetName(provider)" @click="togglePreset(provider)">
            <span class="chevron" :class="{ expanded: !isCollapsed(provider) }" aria-hidden="true">›</span>
            <span class="preset-heading">
              <span class="preset-title">{{ presetName(provider) }}</span>
              <span class="preset-meta">{{ protocolName(provider.type) }} · {{ provider.model || '尚未选择模型' }}</span>
            </span>
          </button>
          <div class="header-actions">
            <span v-if="!provider.enabled" class="badge badge--warning">已停用</span>
            <span v-else-if="!apiStore.isProviderReady(provider)" class="badge badge--warning">待配置</span>
            <button class="btn btn--secondary btn--sm" :class="{ 'current-button': currentProvider?.id === provider.id }"
              :disabled="!provider.enabled || !apiStore.isProviderReady(provider) || currentProvider?.id === provider.id"
              @click="apiStore.setActiveProvider(provider.id)">
              {{ currentProvider?.id === provider.id ? '当前使用' : '设为当前' }}
            </button>
            <button class="btn btn--danger btn--sm" :aria-label="'删除 ' + presetName(provider)" @click="deletePreset(provider)">删除</button>
          </div>
        </div>

        <div v-if="!isCollapsed(provider)" :id="'preset-body-' + provider.id" class="card__body">
          <div class="preset-grid">
            <div class="form-group">
              <label :for="'preset-name-' + provider.id">预设名称</label>
              <input :id="'preset-name-' + provider.id" :ref="element => rememberNameInput(provider.id, element)" class="input"
                v-model="provider.name" placeholder="例如：日常写卡、长文润色、本地模型" @blur="normalizeName(provider)">
            </div>
            <div class="form-group">
              <label :for="'preset-type-' + provider.id">接口协议</label>
              <select :id="'preset-type-' + provider.id" class="select" v-model="provider.type" @change="resetModels(provider)">
                <option value="openai">OpenAI 兼容</option>
                <option value="claude">Anthropic / Claude</option>
                <option value="gemini">Google / Gemini</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label :for="'preset-url-' + provider.id">服务地址（Base URL）</label>
              <input :id="'preset-url-' + provider.id" class="input" v-model.trim="provider.baseUrl" :placeholder="baseUrlHint(provider.type)" @input="resetModels(provider)">
              <p class="hint">{{ protocolHint(provider.type) }}</p>
            </div>
            <div class="form-group">
              <label :for="'preset-key-' + provider.id">API Key</label>
              <div class="field-row">
                <input :id="'preset-key-' + provider.id" :type="showKeys[provider.id] ? 'text' : 'password'" class="input"
                  v-model.trim="provider.apiKey" placeholder="输入 API Key" autocomplete="off" spellcheck="false" @input="resetModels(provider)">
                <button class="btn btn--ghost btn--sm" :aria-controls="'preset-key-' + provider.id" :aria-pressed="!!showKeys[provider.id]"
                  @click="showKeys[provider.id] = !showKeys[provider.id]">{{ showKeys[provider.id] ? '隐藏' : '显示' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label :for="'preset-model-' + provider.id">模型</label>
              <div class="field-row">
                <select v-if="modelLists[provider.id]?.length" :id="'preset-model-' + provider.id" class="select flex-1" v-model="provider.model" @change="resetReasoning(provider)">
                  <option v-if="provider.model && !modelLists[provider.id].includes(provider.model)" :value="provider.model">
                    {{ provider.model }}（当前）
                  </option>
                  <option v-for="model in modelLists[provider.id]" :key="model" :value="model">{{ model }}</option>
                </select>
                <input v-else :id="'preset-model-' + provider.id" class="input flex-1" v-model.trim="provider.model" placeholder="输入模型名，或点击获取模型" @input="resetReasoning(provider)">
                <button class="btn btn--secondary btn--sm" :disabled="modelLoading[provider.id] || !provider.apiKey || !provider.baseUrl" @click="loadModels(provider)">
                  {{ modelLoading[provider.id] ? '获取中…' : '获取模型' }}
                </button>
                <button class="btn btn--ghost btn--sm" :disabled="reasoningLoading[provider.id] || !apiStore.isProviderReady(provider)" @click="probeReasoning(provider)">
                  {{ reasoningLoading[provider.id] ? '探测中…' : '探测思考能力' }}
                </button>
              </div>
              <p class="hint">{{ modelLists[provider.id]?.length ? '已获取 ' + modelLists[provider.id].length + ' 个模型，请从列表选择；也可以重新获取。' : '模型名可以手动填写。' }}</p>
              <p class="hint">探测思考能力会发送一条很短的请求，可能产生少量费用；成功只代表参数被接受，不保证服务商实际执行。</p>
              <p v-if="reasoningResults[provider.id]" class="reasoning-result" :class="'reasoning-result--' + reasoningResults[provider.id].status">
                <strong>{{ reasoningResults[provider.id].label }}</strong>
                <span>（{{ reasoningResults[provider.id].parameter }}={{ reasoningResults[provider.id].value }}）</span>：{{ reasoningResults[provider.id].detail }}
              </p>
            </div>
            <div class="form-group full-width">
              <label :for="'preset-temperature-' + provider.id">温度（Temperature）</label>
              <div class="temperature-row">
                <input :id="'preset-temperature-' + provider.id" type="range" class="temperature-slider" :value="provider.temperature ?? 0.8" min="0" max="2" step="0.01"
                  @input="provider.temperature = Number($event.target.value)">
                <input type="number" class="input temperature-input" aria-label="温度数值" :value="provider.temperature ?? 0.8" min="0" max="2" step="0.01"
                  @input="provider.temperature = Math.min(2, Math.max(0, parseFloat($event.target.value) || 0))">
              </div>
              <p class="hint">0 更稳定，2 更随机。默认 0.8；生成 JSON 建议 0.6～0.8。</p>
            </div>
            <div class="form-group full-width reasoning-settings">
              <label>思考强度</label>
              <div class="field-row">
                <select class="select" v-model="provider.reasoningModelType" aria-label="模型系列">
                  <option v-for="family in modelFamilyOptions" :key="family.value" :value="family.value">{{ family.label }}</option>
                </select>
                <select class="select" v-model="provider.reasoningEffort"
                  :disabled="provider.reasoningEnabled !== true || provider.type !== 'openai'" aria-label="推理强度">
                  <option v-for="effort in getReasoningEffortOptions(provider.reasoningModelType)" :key="effort" :value="effort">
                    {{ effort }}
                  </option>
                </select>
                <label class="toggle-label">
                  <input type="checkbox" v-model="provider.reasoningEnabled" :disabled="provider.type !== 'openai'">
                  启用思考强度
                </label>
              </div>
              <p class="hint">仅在启用后向 OpenAI 兼容接口发送 <code>reasoning_effort</code>；关闭时使用服务商默认行为。中转站是否支持由服务商决定，建议先点击“探测思考能力”。</p>
            </div>
            <div class="form-group full-width streaming-settings">
              <label>输出方式</label>
              <label class="toggle-label">
                <input type="checkbox" v-model="provider.streamingEnabled">
                启用流式输出
              </label>
              <p class="hint">开启后，支持流式协议的接口会边生成边返回内容；关闭时等待完整回复后再显示。部分中转站可能不支持流式请求。</p>
            </div>
          </div>
          <div class="preset-footer">
            <label class="toggle-label"><input type="checkbox" v-model="provider.enabled"> 启用此预设</label>
            <button class="btn btn--secondary btn--sm" :disabled="testing[provider.id] || !apiStore.isProviderReady(provider)" @click="testConnection(provider)">
              {{ testing[provider.id] ? '连接中…' : '测试连接' }}
            </button>
          </div>
        </div>
      </section>
    </template>
    <p v-if="apiStore.providers.length" class="hint">当前预设被删除、停用或配置不完整时，会切换到列表中第一个可用预设；没有可用项时暂停 AI 调用。</p>
  </div>
</template>

<script setup>
import { reactive, computed, nextTick } from 'vue';
import { useApiStore } from '../stores/api.js';
import { useAppStore } from '../stores/app.js';
import { modelFamilyOptions, getReasoningEffortOptions } from '../utils/reasoning-probe.js';

const apiStore = useApiStore();
const appStore = useAppStore();
const showKeys = reactive({});
const modelLists = reactive({});
const modelLoading = reactive({});
const reasoningLoading = reactive({});
const reasoningResults = reactive({});
const testing = reactive({});
const nameInputs = new Map();
const currentProvider = computed(() => apiStore.activeProvider);
const saveLabel = computed(() => {
  if (apiStore.saveState === 'loading') return '正在读取…';
  if (apiStore.saveState === 'pending') return '等待保存…';
  if (apiStore.saveState === 'saving') return '正在保存…';
  if (apiStore.saveState === 'error') return '配置未保存';
  if (apiStore.lastSavedAt) return '已自动保存 · ' + new Date(apiStore.lastSavedAt).toLocaleTimeString();
  return '修改后自动保存';
});
const presetName = provider => provider.name?.trim() || '未命名预设';
const isCollapsed = provider => provider.collapsed !== false;
const protocolName = type => ({ openai: 'OpenAI 兼容', claude: 'Anthropic / Claude', gemini: 'Google / Gemini' }[type] || type);
const baseUrlHint = type => ({ openai: 'https://api.openai.com/v1', claude: 'https://api.anthropic.com', gemini: 'https://generativelanguage.googleapis.com' }[type] || '填写服务商提供的基础地址');
const protocolHint = type => type === 'openai'
  ? '适用于兼容 OpenAI 格式的服务。按服务商说明填写基础地址，通常包含 /v1。'
  : '使用该协议的基础地址，无需附加模型名或生成接口路径。';

function rememberNameInput(id, element) {
  if (element) nameInputs.set(id, element);
  else nameInputs.delete(id);
}
function normalizeName(provider) { provider.name = provider.name?.trim() || '未命名预设'; }
function togglePreset(provider) {
  provider.collapsed = !isCollapsed(provider);
  showKeys[provider.id] = false;
}
function setAllCollapsed(collapsed) {
  for (const provider of apiStore.providers) { provider.collapsed = collapsed; showKeys[provider.id] = false; }
}
async function addPreset() {
  const id = apiStore.addProvider();
  await nextTick();
  const input = nameInputs.get(id);
  input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  input?.focus({ preventScroll: true });
  input?.select();
}
function deletePreset(provider) {
  appStore.confirmAction('删除 API 预设“' + presetName(provider) + '”及其本地 Key 和配置？', () => {
    apiStore.removeProvider(provider.id);
    for (const state of [showKeys, modelLists, modelLoading, reasoningLoading, reasoningResults, testing]) delete state[provider.id];
    nameInputs.delete(provider.id);
  });
}
function resetModels(provider) {
  delete modelLists[provider.id];
  delete reasoningResults[provider.id];
}
function resetReasoning(provider) { delete reasoningResults[provider.id]; }
function snapshotOf(provider) { return JSON.parse(JSON.stringify(provider)); }
function stillMatches(snapshot, includeModel = false) {
  const provider = apiStore.providers.find(item => item.id === snapshot.id);
  return provider && ['type', 'baseUrl', 'apiKey', ...(includeModel ? ['model'] : [])].every(key => provider[key] === snapshot[key]);
}
async function loadModels(provider) {
  if (modelLoading[provider.id]) return;
  const snapshot = snapshotOf(provider);
  modelLoading[provider.id] = true;
  try {
    const models = await apiStore.fetchModels(snapshot);
    if (!stillMatches(snapshot)) return;
    modelLists[provider.id] = [...new Set(models.filter(model => typeof model === 'string' && model))];
    if (modelLists[provider.id].length) appStore.toastSuccess('已获取 ' + modelLists[provider.id].length + ' 个模型');
    else appStore.toastWarning('未获取到模型，请检查地址和 Key，或手动填写模型名');
  } catch (e) {
    if (stillMatches(snapshot)) appStore.toastError('获取模型失败：' + e.message);
  } finally { delete modelLoading[provider.id]; }
}
async function probeReasoning(provider) {
  if (reasoningLoading[provider.id]) return;
  const snapshot = snapshotOf(provider);
  reasoningLoading[provider.id] = true;
  delete reasoningResults[provider.id];
  try {
    const result = await apiStore.probeReasoning(snapshot);
    if (!stillMatches(snapshot, true)) return;
    reasoningResults[provider.id] = result;
  } catch (e) {
    if (stillMatches(snapshot, true)) {
      reasoningResults[provider.id] = { status: 'unknown', label: '无法确认', detail: e.message || '探测请求失败' };
    }
  } finally { delete reasoningLoading[provider.id]; }
}
async function testConnection(provider) {
  if (testing[provider.id]) return;
  const snapshot = snapshotOf(provider);
  testing[provider.id] = true;
  try {
    // Test this preset directly; never temporarily switch the application's active provider.
    const result = await apiStore.chatWithProvider(snapshot, [{ role: 'user', content: '请回复“连接成功”四个字' }], { maxTokens: 20 });
    if (stillMatches(snapshot, true)) appStore.toastSuccess(presetName(provider) + ' 连接成功：' + result.slice(0, 30));
  } catch (e) {
    if (stillMatches(snapshot, true)) appStore.toastError('连接失败：' + e.message);
  } finally { delete testing[provider.id]; }
}
async function retrySave() {
  if (!apiStore.settingsLoaded) { await apiStore.loadFromDisk(); return; }
  try { await apiStore.saveToDisk(); } catch (e) { appStore.toastError('API 设置保存失败：' + e.message); }
}
</script>

<style scoped>
.current-content, .preset-toolbar, .preset-header, .preset-footer, .save-error {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.current-summary, .header-actions, .field-row, .temperature-row { display: flex; align-items: center; gap: 10px; }
.field-row { flex-wrap: wrap; }
.current-summary, .header-actions { flex-wrap: wrap; }
.current-summary { min-width: 0; overflow-wrap: anywhere; }
.current-summary strong { color: var(--cf-accent); }
.save-state { color: var(--cf-text-secondary); font-size: 12px; }
.save-state--error, .save-error { color: var(--cf-danger); }
.current-bar { border: 1px solid var(--cf-border-focus); background: rgba(245, 158, 66, 0.04); }
.preset-toolbar h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.hint { color: var(--cf-text-secondary); line-height: 1.7; }
.empty-state { padding: 36px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
.provider-active { border-color: var(--cf-border-focus); }
.preset-header { gap: 12px; }
.preset-toggle {
  display: flex; align-items: center; flex: 1; gap: 12px; min-width: 160px; padding: 4px 0;
  color: var(--cf-text-primary); background: transparent; border: 0; text-align: left;
  font: inherit; cursor: pointer; border-radius: var(--cf-radius-sm);
}
.preset-toggle:focus-visible { outline: 2px solid var(--cf-accent); outline-offset: 4px; }
.chevron { font-size: 26px; transition: transform .2s; flex-shrink: 0; color: var(--cf-accent); }
.chevron.expanded { transform: rotate(90deg); }
.preset-heading { display: flex; flex-direction: column; min-width: 0; gap: 6px; }
.preset-title { font-size: 15px; font-weight: 600; overflow-wrap: anywhere; }
.preset-meta { color: var(--cf-text-secondary); font-size: 12px; overflow-wrap: anywhere; }
.current-button:disabled { opacity: 1; color: var(--cf-accent); border-color: var(--cf-border-focus); }
.preset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
.full-width { grid-column: 1 / -1; }
.form-group, .field-row { min-width: 0; }
.field-row .input { flex: 1; min-width: 0; }
.field-row .select { flex: 1; min-width: 160px; }
.field-row .btn { flex-shrink: 0; }
.input, .select { color-scheme: dark; }
.temperature-slider { flex: 1; min-width: 0; accent-color: var(--cf-accent); cursor: pointer; }
.temperature-input { width: 80px; flex-shrink: 0; text-align: center; }
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--cf-text-secondary); }
.toggle-label input { accent-color: var(--cf-accent); }
.reasoning-result { margin: 6px 0 0; line-height: 1.6; }
.reasoning-result--accepted { color: var(--cf-success, #86efac); }
.reasoning-result--rejected { color: var(--cf-warning, #fbbf24); }
.reasoning-result--unknown { color: var(--cf-text-secondary); }
.preset-footer { border-top: 1px solid var(--cf-border); padding-top: 16px; }
@media (max-width: 1000px) { .preset-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
