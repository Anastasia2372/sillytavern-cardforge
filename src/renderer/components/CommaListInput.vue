<template>
  <input :value="text" @input="onInput" @blur="resetText">
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue']);

const text = ref(props.modelValue.join(', '));

function parse(str) {
  return str.split(/[,，]/).map(s => s.trim()).filter(Boolean);
}

function sameList(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function onInput(e) {
  text.value = e.target.value;
  emit('update:modelValue', parse(text.value));
}

function resetText() {
  text.value = props.modelValue.join(', ');
}

watch(() => props.modelValue, list => {
  if (!sameList(parse(text.value), list)) resetText();
}, { deep: true });
</script>
