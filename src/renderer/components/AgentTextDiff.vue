<template>
  <div class="agent-diff">
    <section v-for="side in sides" :key="side.label">
      <header>{{ side.label }} <small>{{ side.text.length }} 字符</small></header>
      <div class="agent-diff__text">
        <p v-if="!side.lines.length" class="agent-diff__empty">（空）</p>
        <div v-for="(line, i) in side.lines" :key="i"
          :class="{ 'agent-diff__changed': i >= prefix && i < side.lines.length - suffix, 'agent-diff__new': side.isNew }">{{ line || '\u00a0' }}</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({ before: { type: String, default: '' }, after: { type: String, default: '' } });
const lines = value => value ? value.split('\n') : [];
const sides = computed(() => [{ label: '修改前', text: props.before, lines: lines(props.before), isNew: false },
  { label: '建议修改后', text: props.after, lines: lines(props.after), isNew: true }]);
const prefix = computed(() => {
  const [a, b] = sides.value.map(side => side.lines);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
});
const suffix = computed(() => {
  const [a, b] = sides.value.map(side => side.lines);
  let i = 0;
  while (i < a.length - prefix.value && i < b.length - prefix.value && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
});
</script>

<style scoped>
.agent-diff { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.agent-diff section { min-width: 0; border: 1px solid var(--cf-border); border-radius: 6px; overflow: hidden; }
.agent-diff header { padding: 8px 12px; background: var(--cf-bg-elevated); font-size: 12px; display: flex; justify-content: space-between; gap: 8px; }
.agent-diff small { color: var(--cf-text-secondary); }
.agent-diff__text { max-height: 380px; overflow: auto; font-size: 12px; line-height: 1.8; user-select: text; white-space: pre-wrap; overflow-wrap: anywhere; }
.agent-diff__text > div { padding: 0 12px; min-height: 1.8em; }
.agent-diff__changed { background: #f8717120; border-left: 2px solid #f87171; }
.agent-diff__changed.agent-diff__new { background: #4ade8018; border-left-color: #4ade80; }
.agent-diff__empty { padding: 12px; color: var(--cf-text-secondary); }
@media (max-width: 1100px) { .agent-diff { grid-template-columns: minmax(0, 1fr); } }
</style>
