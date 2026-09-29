<template>
  <div v-if="settings.settingsOpen" class="ft-settings-overlay" @click.self="settings.settingsOpen = false"
    @keydown.esc.stop="settings.settingsOpen = false">
    <section class="ft-settings" role="dialog" aria-modal="true" aria-labelledby="ft-settings-title">
      <header class="ft-settings__header">
        <h3 id="ft-settings-title">悬浮窗设置</h3>
        <button ref="closeButton" class="btn btn--ghost btn--sm" aria-label="关闭悬浮窗设置"
          @click="settings.settingsOpen = false">×</button>
      </header>
      <div class="ft-settings__body">
        <label class="ft-settings__toggle">
          <input type="checkbox" :checked="settings.visible" @change="settings.setVisible($event.target.checked)">
          显示悬浮工具
        </label>
        <p class="ft-settings__hint">关闭后隐藏悬浮球和窗口。可在「总设置 → 悬浮工具 → 打开悬浮窗设置」重新开启。</p>

        <div class="ft-settings__section">
          <strong>栏目显示与顺序</strong>
          <button class="btn btn--ghost btn--sm" @click="settings.resetTools">恢复默认</button>
        </div>
        <p class="ft-settings__hint">勾选要显示的栏目，用上下箭头调整顺序。至少保留一个通用栏目。</p>
        <ol class="ft-settings__list">
          <li v-for="(tool, index) in settings.orderedTools" :key="tool.key" class="ft-settings__row">
            <label class="ft-settings__toggle">
              <input type="checkbox" :checked="!settings.hidden.includes(tool.key)"
                :disabled="!settings.hidden.includes(tool.key) && !settings.canHide(tool.key)"
                @change="settings.setToolVisible(tool.key, $event.target.checked)">
              <span>{{ tool.short }}<small v-if="tool.onlyRoute">仅世界书页面</small></span>
            </label>
            <div class="ft-settings__arrows">
              <button class="btn btn--secondary btn--sm" :disabled="index === 0"
                :aria-label="'上移' + tool.short" title="上移" @click="settings.moveTool(tool.key, -1)">↑</button>
              <button class="btn btn--secondary btn--sm" :disabled="index === settings.orderedTools.length - 1"
                :aria-label="'下移' + tool.short" title="下移" @click="settings.moveTool(tool.key, 1)">↓</button>
            </div>
          </li>
        </ol>
        <p class="ft-settings__hint">修改立即生效，并自动保存在本机。</p>

      </div>
      <footer class="ft-settings__footer">
        <button class="btn btn--primary btn--sm" @click="settings.settingsOpen = false">完成</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useFloatingToolsStore } from '../stores/floating-tools.js';

const settings = useFloatingToolsStore();
const closeButton = ref(null);
let returnFocus;
watch(() => settings.settingsOpen, async open => {
  if (open) {
    returnFocus = document.activeElement;
    await nextTick();
    closeButton.value?.focus();
  } else if (returnFocus?.isConnected) {
    returnFocus.focus();
  }
});
</script>

<style scoped>
.ft-settings-overlay { position: fixed; inset: 0; z-index: 100001; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; padding: 48px 20px 20px; }
.ft-settings { width: 420px; max-width: 100%; max-height: 100%; display: flex; flex-direction: column; background: #151824; color: var(--cf-text-primary); border: 1px solid var(--cf-border-light); border-radius: 12px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5); }
.ft-settings__header, .ft-settings__section, .ft-settings__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ft-settings__header { padding: 12px 16px; border-bottom: 1px solid var(--cf-border); }
.ft-settings__header h3 { font-size: 15px; }
.ft-settings__body { padding: 16px; overflow-y: auto; min-height: 0; }
.ft-settings__toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
.ft-settings__toggle input { accent-color: var(--cf-accent); }
.ft-settings__toggle small { display: block; font-size: 11px; color: var(--cf-text-muted); margin-top: 2px; }
.ft-settings__hint { font-size: 12px; line-height: 1.6; color: var(--cf-text-secondary); margin: 8px 0; }
.ft-settings__section { margin-top: 20px; font-size: 13px; }
.ft-settings__list { list-style: none; margin: 12px 0; padding: 0; }
.ft-settings__row { padding: 8px 0; border-bottom: 1px solid var(--cf-border); }
.ft-settings__arrows { display: flex; gap: 6px; }
.ft-settings__footer { padding: 12px 16px; text-align: right; border-top: 1px solid var(--cf-border); }
</style>
