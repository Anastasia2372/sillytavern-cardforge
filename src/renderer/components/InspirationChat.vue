<template>
  <section class="inspiration-chat" aria-label="AI 灵感聊天">
    <div class="inspiration-chat__header">
      <span>{{ niangStore.youxi.name }} · 聊聊灵感</span>
      <button class="btn btn--ghost btn--sm" @click="router.push('/assistant')">打开 AI 助手</button>
    </div>
    <div ref="messagesRef" class="inspiration-chat__messages" role="log" aria-live="polite">
      <p v-if="!messages.length" class="inspiration-chat__welcome">
        {{ niangStore.youxi.greeting }} 可以聊人物、剧情或世界观，也可以粘贴片段一起琢磨。
      </p>
      <article v-for="msg in messages" :key="msg.id" class="inspiration-chat__message"
        :class="{ 'inspiration-chat__message--user': msg.role === 'user' }">
        <div class="inspiration-chat__meta">
          <span>{{ msg.name }}</span>
          <button class="btn btn--ghost btn--sm" @click="copyMessage(msg.content)">复制</button>
          <button class="btn btn--ghost btn--sm" @click="useAsTask(msg.content)">用作创作任务</button>
        </div>
        <div class="inspiration-chat__text">{{ msg.content }}</div>
      </article>
      <p v-if="loading" class="inspiration-chat__status">思考中…</p>
    </div>
    <div class="inspiration-chat__input">
      <textarea v-model="inputText" class="textarea" rows="3" aria-label="灵感聊天消息"
        placeholder="聊点什么？Ctrl+Enter 发送"
        @keydown.ctrl.enter="onSendKey"></textarea>
      <div class="inspiration-chat__footer">
        <span>与 AI 助手共享当前对话</span>
        <button class="btn btn--primary btn--sm" :disabled="loading || !inputText.trim()" @click="chatStore.send">
          {{ loading ? '思考中…' : '发送' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAssistantChatStore } from '../stores/assistant-chat.js';
import { useAiNiangStore } from '../stores/ainiang.js';
import { useAppStore } from '../stores/app.js';
import { copyText } from '../utils/clipboard.js';
import { useAuthoringAgentStore } from '../stores/authoring-agent.js';

const chatStore = useAssistantChatStore();
const { messages, inputText, loading } = storeToRefs(chatStore);
const niangStore = useAiNiangStore();
const appStore = useAppStore();
const router = useRouter();
const messagesRef = ref(null);

function useAsTask(content) {
  useAuthoringAgentStore().task = content;
  router.push('/agent');
}

async function scrollBottom() {
  await nextTick();
  if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
}
watch(() => [messages.value.length, loading.value], scrollBottom);
onMounted(() => { chatStore.initialize(); scrollBottom(); });

function onSendKey(event) {
  if (event.isComposing) return;
  event.preventDefault();
  chatStore.send();
}

async function copyMessage(content) {
  try { await copyText(content); appStore.toastSuccess('已复制'); }
  catch { appStore.toastError('复制失败，请选中文字后重试'); }
}
</script>

<style scoped>
.inspiration-chat { height: 100%; min-height: 0; display: flex; flex-direction: column; }
.inspiration-chat__header, .inspiration-chat__meta, .inspiration-chat__footer {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.inspiration-chat__header { padding-bottom: 8px; font-size: 12px; flex-shrink: 0; }
.inspiration-chat__messages { flex: 1; min-height: 0; overflow-y: auto; padding-right: 4px; }
.inspiration-chat__welcome, .inspiration-chat__text {
  user-select: text; -webkit-user-select: text; cursor: text;
  white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.7;
}
.inspiration-chat__welcome { color: var(--cf-text-secondary); padding: 12px 0; }
.inspiration-chat__message { margin-bottom: 12px; padding: 8px 10px; border-radius: 8px; background: rgba(0, 0, 0, 0.18); }
.inspiration-chat__message--user { background: rgba(245, 158, 66, 0.12); }
.inspiration-chat__meta, .inspiration-chat__status, .inspiration-chat__footer { font-size: 11px; color: var(--cf-text-secondary); }
.inspiration-chat__meta { margin-bottom: 4px; }
.inspiration-chat__input { flex-shrink: 0; padding-top: 8px; border-top: 1px solid var(--cf-border); }
.inspiration-chat__input textarea { width: 100%; min-height: 64px; max-height: 110px; resize: vertical; user-select: text; -webkit-user-select: text; }
.inspiration-chat__footer { margin-top: 6px; }
</style>
