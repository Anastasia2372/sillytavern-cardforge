<template>
  <div class="attachment-bar">
    <button class="btn btn--secondary btn--sm" :disabled="disabled" @click="fileInput.click()">添加附件</button>
    <input ref="fileInput" type="file" multiple hidden :accept="ATTACHMENT_ACCEPT" @change="onPick">
    <span v-for="(a, i) in modelValue" :key="i" class="attachment-chip">
      {{ a.kind === 'image' ? '图片' : '文件' }} · {{ a.name }}
      <button class="attachment-chip__remove" title="移除" @click="remove(i)">x</button>
    </span>
    <span v-if="modelValue.length === 0" class="attachment-bar__hint">可附文本文件或图片，图片需要模型支持识图</span>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAppStore } from '../stores/app.js';
import { ATTACHMENT_ACCEPT, readAttachment } from '../utils/chat-attachments.js';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue']);

const appStore = useAppStore();
const fileInput = ref(null);

async function onPick(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  const added = [];
  for (const file of files) {
    try {
      const attachment = await readAttachment(file);
      if (attachment.truncated) appStore.toastWarning(`${file.name} 太长，只取了开头 6 万字`);
      added.push(attachment);
    } catch (err) {
      appStore.toastError(err.message);
    }
  }
  if (added.length) emit('update:modelValue', [...props.modelValue, ...added]);
}

function remove(index) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index));
}
</script>

<style scoped>
.attachment-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 0;
}
.attachment-bar__hint {
  font-size: 11px;
  color: var(--cf-text-muted);
}
.attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--cf-border);
  border-radius: 99px;
  font-size: 12px;
  color: var(--cf-text-secondary);
}
.attachment-chip__remove {
  border: none;
  background: none;
  color: var(--cf-text-muted);
  cursor: pointer;
  padding: 0 2px;
}
.attachment-chip__remove:hover {
  color: var(--cf-danger, #f87171);
}
</style>
