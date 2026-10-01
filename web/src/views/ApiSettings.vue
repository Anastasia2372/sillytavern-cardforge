<template>
  <div class="page">
    <div class="page__header">
      <h1>API 设置</h1>
      <p>配置 AI 服务商 — 填好并设为当前后可在 NPC 生成器、AI 助手中使用</p>
    </div>

    <!-- 当前激活服务商状态条 -->
    <div class="card mb-md current-bar">
      <div class="card__body flex-between">
        <div>
          <span style="font-size:12px;color:var(--cf-text-muted)">当前使用：</span>
          <strong v-if="currentProvider" style="color:#ffd700">
            {{ currentProvider.name }}
            <span style="font-weight:normal;color:var(--cf-text-secondary);font-size:12px">
              · {{ currentProvider.model }}
            </span>
          </strong>
          <strong v-else style="color:var(--cf-warning)">未选择 — 请下方点击「设为当前」</strong>
        </div>
        <div v-if="lastSavedAt" style="font-size:11px;color:var(--cf-text-muted)">
          已自动保存 · {{ lastSavedAt }}
        </div>
      </div>
    </div>

    <div class="card mb-md">
      <div class="card__body hint" style="line-height:1.8">
        本软件所有 AI 功能（NPC 生成、世界书生成、开场白生成、AI 助手等）都需要先在这里配置服务商才能使用。<br>
        · <strong>OpenAI 兼容</strong> — 支持 OpenAI 官方、各类中转站、DeepSeek、本地 Ollama 等所有兼容 OpenAI 格式的服务<br>
        · <strong>Claude</strong> — Anthropic 官方 API<br>
        · <strong>Gemini</strong> — Google 官方 API<br>
        · 配置好多个服务商后，点每个卡片头部的「设为当前」选择实际使用哪个<br>
        · 本地模型不需要 Key：填好 Base URL 和模型后直接点「设为当前」<br>
        · 你的 Key 只保存在本地（自动保存，无需手动操作）<br>
        · 点「+ 添加自定义服务商」可以添加更多 API 源
      </div>
    </div>

    <div v-for="provider in apiStore.providers" :key="provider.id" class="card mb-md"
      :class="{ 'provider-active': apiStore.activeProviderId === provider.id }">
      <div class="card__header">
        <div class="flex-row">
          <label class="active-radio" :class="{ checked: apiStore.activeProviderId === provider.id }">
            <input type="radio" name="active-provider"
              :checked="apiStore.activeProviderId === provider.id"
              :disabled="!apiStore.canUse(provider)"
              @change="apiStore.setActiveProvider(provider.id)">
            <span>{{ apiStore.activeProviderId === provider.id ? '当前使用' : '设为当前' }}</span>
          </label>
          <h3>{{ provider.name }}</h3>
          <span v-if="provider.apiKey" class="badge badge--success">已配置</span>
          <span v-else class="badge badge--warning">未填 Key</span>
        </div>
        <div class="flex-row">
          <button v-if="provider.id.startsWith('custom_')"
            class="btn btn--danger btn--sm" @click="appStore.confirmAction('删除这个服务商？', () => apiStore.removeProvider(provider.id))">删除</button>
        </div>
      </div>
      <div class="card__body">
        <div class="grid-2">
          <div class="form-group">
            <label>API 类型</label>
            <select class="select" v-model="provider.type">
              <option value="openai">OpenAI 兼容</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="gemini">Gemini (Google)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Base URL</label>
            <input class="input" v-model="provider.baseUrl"
              placeholder="API 基础地址">
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>API Key</label>
            <div class="flex-row">
              <input :type="showKeys[provider.id] ? 'text' : 'password'" class="input flex-1"
                v-model="provider.apiKey" placeholder="输入 API Key（本地模型可留空）">
              <button class="btn btn--ghost btn--sm"
                @click="showKeys[provider.id] = !showKeys[provider.id]">
                {{ showKeys[provider.id] ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>模型</label>
            <div class="flex-row">
              <select v-if="modelLists[provider.id]?.length" class="select flex-1" v-model="provider.model">
                <option value="">-- 选择模型 --</option>
                <option v-for="m in modelLists[provider.id]" :key="m" :value="m">{{ m }}</option>
              </select>
              <input v-else class="input flex-1" v-model="provider.model"
                placeholder="填好 Base URL 后点右侧获取，或手动输入">
              <button class="btn btn--secondary btn--sm" @click="loadModels(provider)"
                :disabled="modelLoading[provider.id]">
                {{ modelLoading[provider.id] ? '获取中...' : '获取模型' }}
              </button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>温度 (Temperature)</label>
          <div class="temperature-row">
            <input type="range" class="temperature-slider"
              :value="provider.temperature ?? 0.8"
              min="0" max="2" step="0.01"
              @input="provider.temperature = parseFloat($event.target.value)">
            <input type="number" class="input temperature-input"
              :value="provider.temperature ?? 0.8"
              min="0" max="2" step="0.01"
              @input="provider.temperature = Math.min(2, Math.max(0, parseFloat($event.target.value) || 0))">
          </div>
          <div class="hint" style="margin-top:4px">0 = 确定性最高 · 1 = 均衡 · 2 = 最随机。默认 0.8，创意内容可调高，JSON 生成建议 0.6~0.8</div>
        </div>
        <div class="form-group">
          <label>最大输出长度 (Max Tokens)</label>
          <input type="number" class="input max-tokens-input" min="1" step="1"
            :value="provider.maxTokens || ''"
            :placeholder="`自动：${apiStore.lookupModelMaxTokens(provider.model)}`"
            @input="setMaxTokens(provider, $event.target.value)">
          <div class="hint" style="margin-top:4px">留空按模型名自动判断。生成的状态栏、世界书经常被截断时，按服务商文档里该模型的最大输出填大一些；填得超过模型上限接口会报错</div>
        </div>
        <div class="form-group">
          <label class="toggle-label">
            <input type="checkbox" v-model="provider.enabled"> 启用此服务商（禁用后无法设为当前）
          </label>
        </div>
        <button class="btn btn--secondary btn--sm" @click="testConnection(provider)">
          测试连接
        </button>
      </div>
    </div>

    <button class="btn btn--secondary" @click="apiStore.addProvider()">+ 添加自定义服务商</button>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import { useApiStore } from '../stores/api.js';
import { useAppStore } from '../stores/app.js';

const apiStore = useApiStore();
const appStore = useAppStore();
const showKeys = reactive({});
const lastSavedAt = ref('');
const modelLists = reactive({});
const modelLoading = reactive({});

function setMaxTokens(provider, raw) {
  const n = Math.floor(Number(raw));
  provider.maxTokens = n > 0 ? n : null;
}

async function loadModels(provider) {
  if (!provider.baseUrl) { appStore.toastWarning('请先填写 Base URL'); return; }
  modelLoading[provider.id] = true;
  try {
    const models = await apiStore.fetchModels(provider);
    if (models.length > 0) {
      modelLists[provider.id] = models;
      if (!provider.model || !models.includes(provider.model)) {
        provider.model = models[0];
      }
      appStore.toastSuccess(`获取到 ${models.length} 个模型`);
    } else {
      appStore.toastWarning('未获取到模型列表，请检查 Key 和 Base URL，或直接手动输入模型名');
    }
  } catch (e) {
    appStore.toastError('获取模型失败: ' + e.message);
  } finally { modelLoading[provider.id] = false; }
}

const currentProvider = computed(() => {
  const id = apiStore.activeProviderId;
  if (id) return apiStore.providers.find(p => p.id === id);
  return null;
});

// 监听 providers/activeProviderId 变化，更新"已自动保存"提示
watch(
  [() => apiStore.providers, () => apiStore.activeProviderId],
  () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    lastSavedAt.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  },
  { deep: true }
);

async function testConnection(provider) {
  if (!apiStore.canUse(provider)) {
    appStore.toastWarning('请先填写 Base URL 和模型');
    return;
  }
  const origActive = apiStore.activeProviderId;
  try {
    apiStore.setActiveProvider(provider.id);
    const result = await apiStore.chat([
      { role: 'user', content: '请回复"连接成功"四个字' }
    ]);
    appStore.toastSuccess(`${provider.name} 连接成功: ${result.slice(0, 30)}`);
  } catch (e) {
    appStore.toastError(`连接失败: ${e.message}`);
  } finally {
    apiStore.setActiveProvider(origActive);
  }
}
</script>

<style scoped>
.temperature-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.temperature-slider {
  flex: 1;
  accent-color: var(--cf-accent);
  cursor: pointer;
}
.max-tokens-input {
  width: 180px;
}
.temperature-input {
  width: 70px;
  flex-shrink: 0;
  text-align: center;
}
.toggle-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; cursor: pointer; color: var(--cf-text-secondary);
  input { accent-color: var(--cf-accent); }
}
.current-bar {
  border: 1px solid rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.04);
}
.provider-active {
  border: 1px solid rgba(255, 215, 0, 0.45) !important;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.12);
}
.active-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--cf-radius-sm);
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--cf-border);
  color: var(--cf-text-secondary);
  background: rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  input[type="radio"] {
    accent-color: #ffd700;
    cursor: pointer;
    &:disabled { cursor: not-allowed; }
  }

  &:hover {
    border-color: rgba(255, 215, 0, 0.4);
    color: var(--cf-text-primary);
  }
  &.checked {
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
    font-weight: 600;
  }
}
</style>
