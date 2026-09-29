<template>
  <div class="page">
    <div class="page__header"><h1>总设置</h1><p>调整应用的保存与使用偏好</p></div>
    <details class="card mb-md settings-section" :open="sections.autosave" @toggle="rememberSection('autosave', $event)">
      <summary class="settings-heading"><span>角色卡自动保存</span><small>每 {{ store.autosaveInterval }} 秒</small></summary>
      <div class="card__body">
        <div class="form-group">
          <label for="autosave-interval">自动保存间隔（秒）</label>
          <div class="flex-row">
            <input id="autosave-interval" class="input" style="max-width:150px" type="number" min="5" max="600"
              step="1" v-model="interval" @keydown.enter="saveInterval">
            <button class="btn btn--primary" @click="saveInterval">保存设置</button>
            <button class="btn btn--secondary" @click="interval = 10; saveInterval()">恢复默认</button>
          </div>
          <p class="hint">可设置 5～600 秒，默认 10 秒。当前间隔：{{ store.autosaveInterval }} 秒。</p>
        </div>
        <p class="hint">角色卡发生修改后开始倒计时；持续输入不会反复重置倒计时。没有修改时不重复保存。</p>
        <p class="hint">自动保存包含角色卡内容、封面和原文件路径，保存在本机草稿目录，下次启动自动恢复最近草稿。关闭应用前会补存尚未保存的修改。</p>
        <p class="hint">草稿保存不会覆盖导入的 PNG / JSON 文件。需要更新原文件或分享角色卡时，请使用「打包角色卡」。</p>
        <p v-if="store.autosaveError" class="settings-error">自动保存异常：{{ store.autosaveError }}</p>
        <button class="btn btn--secondary mt-md" :disabled="store.autosaveState === 'saving'" @click="store.saveDraftNow()">立即保存草稿</button>
      </div>
    </details>
    <details class="card mb-md settings-section" :open="sections.appearance" @toggle="rememberSection('appearance', $event)">
      <summary class="settings-heading"><span>外观</span><small>边框、粒子、背景与颜色</small></summary>
      <div class="card__body settings-appearance">
        <div>
          <strong>炫彩流光边框</strong>
          <p class="hint">控制窗口外圈的流光边框和按钮流光效果。</p>
        </div>
        <label class="settings-switch">
          <input type="checkbox" role="switch" aria-label="炫彩流光边框" :checked="appStore.glowEnabled"
            @change="appStore.toggleGlow()">
          <span class="settings-switch__track" aria-hidden="true"></span>
          <span>{{ appStore.glowEnabled ? '开启' : '关闭' }}</span>
        </label>
      </div>
      <AppearanceBackgroundSettings />
    </details>
    <details ref="contextSection" class="card mb-md settings-section" :open="sections.context" @toggle="rememberSection('context', $event)">
      <summary class="settings-heading"><span>AI 世界书参考长度</span><small>总预算 {{ floatingTools.contextLimits.totalChars.toLocaleString() }} 字符</small></summary>
      <div class="card__body">
        <div class="context-intro">
          <p class="hint">用于悬浮工具、AI 助手和创作 Agent。自动引用优先读取常驻条目；Agent 中手动选择的条目优先。</p>
          <button class="btn btn--secondary btn--sm" @click="floatingTools.resetContextLimits(); contextError = ''">恢复默认</button>
        </div>
        <div class="context-fields">
          <div v-for="field in mainContextFields" :key="field.key" class="form-group context-number">
            <label :for="'settings-context-' + field.key">{{ field.label }}</label>
            <input :id="'settings-context-' + field.key" class="input" type="number" min="1" :max="MAX_CONTEXT_CHARS" step="1"
              :value="floatingTools.contextLimits[field.key]" @change="changeContextLimit(field.key, $event)" @keydown.enter.prevent="$event.target.blur()">
            <small>默认 {{ field.defaultValue.toLocaleString() }} 字符</small>
          </div>
        </div>
        <details class="context-advanced">
          <summary>高级：没有关键词匹配文本时</summary>
          <p class="hint">未提供关键词或生成要求时，使用以下正文上限；触发条目最多参考前 20 条，仍受总预算限制。</p>
          <div class="context-fields">
            <div v-for="field in advancedContextFields" :key="field.key" class="form-group context-number">
              <label :for="'settings-context-' + field.key">{{ field.label }}</label>
              <input :id="'settings-context-' + field.key" class="input" type="number" min="1" :max="MAX_CONTEXT_CHARS" step="1"
                :value="floatingTools.contextLimits[field.key]" @change="changeContextLimit(field.key, $event)" @keydown.enter.prevent="$event.target.blur()">
              <small>默认 {{ field.defaultValue.toLocaleString() }} 字符</small>
            </div>
          </div>
        </details>
        <p v-if="contextError" class="settings-error" role="alert">{{ contextError }}</p>
        <p class="hint">输入后按回车或移出输入框自动保存，下次请求生效。按字符计数；总预算包含参考条目的名称、关键词与正文，不含当前改写原文、人物设定或聊天记录。单条上限大于剩余预算时按剩余预算截取。</p>
      </div>
    </details>
    <details class="card settings-section" :open="sections.floating" @toggle="rememberSection('floating', $event)">
      <summary class="settings-heading"><span>悬浮工具</span><small>显示开关与栏目顺序</small></summary>
      <div class="card__body">
        <button class="btn btn--secondary" @click="floatingTools.settingsOpen = true">打开悬浮窗设置</button>
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useCardStore } from '../stores/card.js';
import { useAppStore } from '../stores/app.js';
import { useFloatingToolsStore } from '../stores/floating-tools.js';
import AppearanceBackgroundSettings from '../components/AppearanceBackgroundSettings.vue';
import { WORLD_CONTEXT_FIELDS, MAX_CONTEXT_CHARS } from '../utils/world-context-settings.js';
const store = useCardStore();
const appStore = useAppStore();
const floatingTools = useFloatingToolsStore();
const interval = ref(store.autosaveInterval);
const sections = reactive({ autosave: false, appearance: false, context: false, floating: false });
const sectionStorageKey = 'cf_general_settings_sections';
try {
  const saved = JSON.parse(localStorage.getItem(sectionStorageKey) || '{}');
  for (const key of Object.keys(sections)) if (typeof saved?.[key] === 'boolean') sections[key] = saved[key];
} catch {}
function rememberSection(key, event) {
  // Nested advanced settings do not affect the parent section's saved state.
  if (event.target !== event.currentTarget) return;
  sections[key] = event.currentTarget.open;
  try { localStorage.setItem(sectionStorageKey, JSON.stringify(sections)); } catch {}
}
const mainContextFields = WORLD_CONTEXT_FIELDS.filter(field => !field.advanced);
const advancedContextFields = WORLD_CONTEXT_FIELDS.filter(field => field.advanced);
const contextError = ref('');
function changeContextLimit(key, event) {
  try {
    floatingTools.setContextLimit(key, Number(event.target.value));
    contextError.value = '';
  } catch (error) {
    contextError.value = error.message;
    event.target.value = floatingTools.contextLimits[key];
  }
}
const route = useRoute();
const contextSection = ref(null);
watch(() => [route.path, route.query.section], async ([path, section]) => {
  if (path !== '/settings' || section !== 'world-context') return;
  sections.context = true;
  await nextTick();
  if (route.path !== '/settings') return;
  contextSection.value?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  contextSection.value?.querySelector('summary')?.focus({ preventScroll: true });
}, { immediate: true, flush: 'post' });

function saveInterval() {
  try {
    store.setAutosaveInterval(Number(interval.value));
    appStore.toastSuccess('自动保存间隔已更新');
  } catch (error) { appStore.toastError(error.message); }
}
</script>

<style scoped>
.settings-heading { display: flex; align-items: center; gap: 12px; padding: var(--cf-gap-md); cursor: pointer; list-style: none; font-size: 14px; font-weight: 600; }
.settings-heading::-webkit-details-marker { display: none; }
.settings-heading::before { content: '›'; color: var(--cf-accent); font-size: 24px; line-height: 1; transition: transform .15s; }
.settings-section[open] > .settings-heading::before { transform: rotate(90deg); }
.settings-section[open] > .settings-heading { border-bottom: 1px solid var(--cf-border); }
.settings-heading small { margin-left: auto; color: var(--cf-text-secondary); font-size: 12px; font-weight: 400; text-align: right; }
.settings-heading:focus-visible { outline: 2px solid var(--cf-accent); outline-offset: -3px; }
.context-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.context-intro .hint { flex: 1; min-width: 220px; margin: 0; }
.context-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.context-number { min-width: 0; }
.context-number small { display: block; color: var(--cf-text-secondary); font-size: 11px; margin-top: 6px; }
.context-advanced { margin-top: 8px; font-size: 12px; }
.context-advanced > summary { cursor: pointer; color: var(--cf-text-secondary); }
@media (max-width: 850px) { .context-fields { grid-template-columns: minmax(0, 1fr); } }
.hint { margin-top: 10px; line-height: 1.7; }
.settings-error { margin-top: 12px; color: #fca5a5; overflow-wrap: anywhere; user-select: text; }
.settings-appearance { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.settings-switch { display: inline-flex; align-items: center; gap: 10px; position: relative; cursor: pointer; flex-shrink: 0; }
.settings-switch input { position: absolute; width: 44px; height: 24px; opacity: 0; margin: 0; cursor: pointer; }
.settings-switch__track { display: block; width: 44px; height: 24px; border-radius: 12px; background: #4b5563; transition: background .15s; pointer-events: none; }
.settings-switch__track::after { content: ''; display: block; width: 18px; height: 18px; margin: 3px; border-radius: 50%; background: #fff; transition: transform .15s; }
.settings-switch input:checked + .settings-switch__track { background: #d99532; }
.settings-switch input:checked + .settings-switch__track::after { transform: translateX(20px); }
.settings-switch input:focus-visible + .settings-switch__track { outline: 2px solid #67e8f9; outline-offset: 3px; }
</style>
