<template>
  <Teleport to="body">
    <div class="section-editor-overlay" @click.self="$emit('close')" @keydown.esc.stop="$emit('close')">
      <form class="section-editor" role="dialog" aria-modal="true" aria-labelledby="section-editor-title" @submit.prevent="save">
        <div class="section-editor__header">
          <h3 id="section-editor-title">{{ section.id ? '编辑分隔栏' : '添加分隔栏' }}</h3>
          <button type="button" class="btn btn--ghost" aria-label="关闭" @click="$emit('close')">✕</button>
        </div>
        <div class="form-group">
          <label for="section-name">分隔栏名称</label>
          <input id="section-name" ref="nameInput" class="input" v-model="draft.name" maxlength="100" required>
        </div>
        <div class="section-editor__range">
          <div class="form-group">
            <label for="section-start">开始顺序（酒馆）</label>
            <input id="section-start" class="input" type="number" step="1" v-model.number="draft.startOrder" required>
          </div>
          <div class="form-group">
            <label for="section-end">结束顺序（酒馆）</label>
            <input id="section-end" class="input" type="number" step="1" v-model.number="draft.endOrder" required>
          </div>
        </div>
        <p class="section-editor__hint">酒馆顺序在这个范围内（含边界）的条目会自动归入本栏，修改条目顺序后自动重新归类。顺序允许重复。</p>
        <div class="form-group">
          <label for="section-sort">分隔栏在工具里的顺序</label>
          <input id="section-sort" class="input" type="number" step="1" min="1" v-model.number="draft.sortOrder" required>
          <p class="section-editor__hint">数字越小越靠前，不改变条目的酒馆顺序。</p>
        </div>
        <p v-if="overlapping.length" class="section-editor__notice">范围与「{{ overlapping.map(s => s.name).join('、') }}」重叠。重叠条目归入工具内排在前面的分隔栏；工具顺序相同时沿用现有排列。</p>
        <div class="section-editor__example">
          <div>↓↓ 开始 {{ draft.name || '分隔栏名称' }} ↓↓ <span>{{ draft.startOrder }}</span></div>
          <p>范围内的世界书条目</p>
          <div>↑↑ 结束 {{ draft.name || '分隔栏名称' }} ↑↑ <span>{{ draft.endOrder }}</span></div>
        </div>
        <p class="section-editor__hint">导出 PNG / JSON 时生成以上两个标记，各自使用开始／结束顺序。标记内容为空且默认禁用，仅作分类，不加入 AI 提示词。</p>
        <p v-if="error" class="section-editor__error" role="alert">{{ error }}</p>
        <div class="section-editor__footer">
          <button type="button" class="btn btn--ghost" @click="$emit('close')">取消</button>
          <button type="submit" class="btn section-editor__save">保存分隔栏</button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
const props = defineProps({ section: { type: Object, required: true }, sections: { type: Array, default: () => [] } });
const emit = defineEmits(['save', 'close']);
const draft = reactive({ ...props.section });
const error = ref('');
const nameInput = ref(null);
let previousFocus;
onMounted(() => { previousFocus = document.activeElement; nameInput.value?.focus(); });
onBeforeUnmount(() => previousFocus?.focus());
const overlapping = computed(() => props.sections.filter(s => s.id !== draft.id
  && draft.startOrder <= s.endOrder && draft.endOrder >= s.startOrder));
function save() {
  if (!draft.name.trim()) { error.value = '请输入分隔栏名称'; return; }
  if (![draft.startOrder, draft.endOrder, draft.sortOrder].every(Number.isSafeInteger)) {
    error.value = '顺序必须是有效整数'; return;
  }
  if (draft.startOrder > draft.endOrder) { error.value = '开始顺序不能大于结束顺序'; return; }
  if (draft.sortOrder < 1) { error.value = '工具内顺序不能小于 1'; return; }
  emit('save', { ...draft, name: draft.name.trim() });
}
</script>

<style scoped>
.section-editor-overlay { position: fixed; inset: 0; z-index: 100002; background: #0009; display: flex; align-items: center; justify-content: center; padding: 20px; }
.section-editor { width: min(560px, 100%); max-height: calc(100vh - 40px); overflow: auto; padding: 24px; border: 1px solid #60a5fa70; border-radius: 12px; background: #151824; color: #e8e6f0; box-shadow: 0 18px 60px #0008; }
.section-editor__header, .section-editor__footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.section-editor__header { color: #93c5fd; margin-bottom: 20px; }
.section-editor__footer { justify-content: flex-end; margin-top: 20px; }
.section-editor__range { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.section-editor__hint { font-size: 12px; color: #aaa9bb; line-height: 1.7; margin: 6px 0 16px; }
.section-editor__notice { padding: 10px; background: #60a5fa16; color: #93c5fd; font-size: 12px; line-height: 1.7; margin-bottom: 16px; }
.section-editor__example { padding: 12px; background: #60a5fa12; border: 1px solid #60a5fa40; border-radius: 6px; color: #93c5fd; overflow-wrap: anywhere; }
.section-editor__example div { display: flex; justify-content: space-between; gap: 12px; }
.section-editor__example p { font-size: 12px; padding: 12px; color: #aaa9bb; }
.section-editor__error { color: #fca5a5; }
.section-editor__save { background: #2563eb30; color: #93c5fd; border: 1px solid #60a5fa80; }
</style>
