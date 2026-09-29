<template>
  <div class="autosave-status" :class="'autosave-status--' + store.autosaveState">
    <button class="autosave-status__button" :title="details" :disabled="store.autosaveState === 'saving'"
      @click="store.autosaveState === 'error' || store.autosaveWarning ? showDetails = true : store.saveDraftNow()">
      <span class="autosave-status__dot" aria-hidden="true"></span>
      <template v-if="store.autosaveState === 'error'">
        自动保存失败 <strong v-if="store.autosaveSeconds">{{ store.autosaveSeconds }}秒后重试</strong>
        <span v-else>· 点击查看</span>
      </template>
      <template v-else-if="store.autosaveState === 'saving'">正在保存草稿…</template>
      <template v-else-if="store.autosaveSeconds">
        自动保存 <strong>{{ store.autosaveSeconds }}</strong><span>秒</span>
      </template>
      <template v-else-if="store.autosaveWarning">⚠ 草稿恢复提醒</template>
      <template v-else-if="store.lastAutosaved">草稿已保存 <span>{{ savedTime }}</span></template>
      <template v-else>自动保存已开启 · {{ store.autosaveInterval }}秒</template>
    </button>
    <Teleport to="body">
      <div v-if="showDetails" class="autosave-details" @click.self="showDetails = false">
        <section class="autosave-details__card" role="dialog" aria-modal="true" aria-label="自动保存状态">
          <h3>自动保存状态</h3>
          <p>{{ store.autosaveError || store.autosaveWarning || '草稿已保存。' }}</p>
          <p>自动保存记录本机草稿，可在下次启动时恢复；需要分享角色卡时，请另行导出 PNG 或 JSON。</p>
          <div class="flex-row">
            <button class="btn btn--primary" :disabled="store.autosaveState === 'saving'" @click="store.saveDraftNow()">立即重试</button>
            <button class="btn btn--secondary" @click="showDetails = false">关闭</button>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCardStore } from '../stores/card.js';
const store = useCardStore();
const showDetails = ref(false);
const savedTime = computed(() => store.lastAutosaved
  ? new Date(store.lastAutosaved).toLocaleTimeString('zh-CN', { hour12: false }) : '');
const details = computed(() => store.autosaveError || store.autosaveWarning
  || '保存到本机草稿，下次启动自动恢复。点击可立即保存；保存间隔可在「总设置」中调整。');
</script>

<style scoped>
.autosave-status { -webkit-app-region: no-drag; min-width: 0; margin-left: 14px; margin-right: auto; }
.autosave-status__button { display: flex; align-items: center; gap: 7px; min-height: 26px; max-width: 100%; padding: 2px 10px; border: 1px solid rgba(134, 239, 172, .45); border-radius: 6px; background: rgba(18, 60, 42, .9); color: #bbf7d0; font: inherit; font-size: 12px; white-space: nowrap; cursor: pointer; }
.autosave-status__dot { width: 6px; height: 6px; flex-shrink: 0; border-radius: 50%; background: currentColor; }
.autosave-status__button strong { font-size: 16px; line-height: 18px; font-variant-numeric: tabular-nums; min-width: 20px; text-align: center; }
.autosave-status--pending .autosave-status__button { color: #fff2be; background: #614000; border-color: #ffc654; box-shadow: 0 0 9px rgba(255, 198, 84, .28); }
.autosave-status--saving .autosave-status__button { color: #c7f9ff; background: #164354; border-color: #67e8f9; cursor: wait; }
.autosave-status--error .autosave-status__button { color: #fff; background: #8b232b; border-color: #ff8a91; }
.autosave-status--error strong { font-size: 12px; }
.autosave-details { position: fixed; inset: 0; z-index: 10020; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.65); -webkit-app-region: no-drag; }
.autosave-details__card { width: 460px; max-width: 90vw; background: var(--cf-bg-secondary, #181c29); color: var(--cf-text-primary); border: 1px solid var(--cf-border-light); border-radius: 12px; padding: 24px; }
.autosave-details__card p { margin: 14px 0; font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; user-select: text; }
</style>
