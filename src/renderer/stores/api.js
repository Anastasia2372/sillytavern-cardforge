import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { probeReasoningRequest, buildOpenAIReasoningParams } from '../utils/reasoning-probe.js';

export const useApiStore = defineStore('api', () => {
  // State
  const providers = ref([]);
  const activeProviderId = ref(null);
  const settingsLoaded = ref(false);
  const saveState = ref('loading');
  const saveError = ref('');
  const lastSavedAt = ref(null);
  let _autoSaveLoaded = false;
  let _saveTimer = null;
  let _saveRevision = 0;
  let _saveQueue = Promise.resolve();

  function isProviderReady(provider) {
    return !!(provider?.apiKey?.trim() && provider?.baseUrl?.trim() && provider?.model?.trim());
  }

  const activeProvider = computed(() => {
    if (activeProviderId.value) {
      const p = providers.value.find(p => p.id === activeProviderId.value);
      if (p?.enabled && isProviderReady(p)) return p;
    }
    // 选中项被删除、禁用或配置不完整时，使用第一个可用预设。
    return providers.value.find(p => p.enabled && isProviderReady(p));
  });

  const isConfigured = computed(() => {
    return !!activeProvider.value;
  });

  // AI API call
  async function chat(messages, options = {}) {
    const provider = activeProvider.value;
    if (!provider || !provider.apiKey) {
      throw new Error('请先在 API 设置中配置至少一个 AI 服务商的 API Key');
    }
    return _callProvider(provider, messages, options);
  }

  // 用指定 provider 直接调用，不污染 store（用于 AI 娘自带 API 配置等场景）
  async function chatWithProvider(provider, messages, options = {}) {
    if (!provider || !provider.apiKey) {
      throw new Error('provider 缺少 apiKey');
    }
    return _callProvider(provider, messages, options);
  }

  function getModelMaxTokens(model) {
    const m = (model || '').toLowerCase();
    // Claude
    if (m.includes('opus') || m.includes('sonnet-4') || m.includes('claude-4')) return 16384;
    if (m.includes('claude-3-5') || m.includes('claude-3.5')) return 8192;
    if (m.includes('claude')) return 4096;
    // OpenAI
    if (m.includes('gpt-4o') || m.includes('gpt-4-turbo') || m.includes('o1') || m.includes('o3') || m.includes('o4')) return 16384;
    if (m.includes('gpt-4')) return 8192;
    if (m.includes('gpt-3.5')) return 4096;
    // Gemini（新到旧）
    if (m.includes('gemini-3') || m.includes('gemini-4')) return 65536;
    if (m.includes('gemini-2.5') || m.includes('gemini-2-5')) return 65536;
    if (m.includes('gemini-2')) return 32768;
    if (m.includes('gemini-1.5-pro')) return 8192;
    if (m.includes('gemini')) return 8192;
    // DeepSeek / Qwen 等中转常见模型
    if (m.includes('deepseek')) return 8192;
    if (m.includes('qwen')) return 8192;
    return 4096;
  }

  // OpenAI 兼容服务通常把接口放在 /v1 下。有些服务商给出的 Base URL
  // 只有域名，直接拼 /chat/completions 会命中前端页面并返回 HTML。
  // 仅对没有路径的地址自动补 /v1，已经填写路径的自定义网关保持原样。
  function normalizeOpenAIBaseUrl(baseUrl) {
    const normalized = (baseUrl || '').trim().replace(/\/+$/, '');
    if (!normalized) return normalized;
    try {
      const url = new URL(normalized);
      if (!url.pathname || url.pathname === '/') url.pathname = '/v1';
      return url.toString().replace(/\/+$/, '');
    } catch {
      return normalized;
    }
  }

  async function _callProvider(provider, messages, options) {
    const temperature = options.temperature ?? provider.temperature ?? 0.8;
    const modelMax = getModelMaxTokens(provider.model);
    const maxTokens = Math.min(options.maxTokens ?? modelMax, modelMax);
    // `stream` 可用于单次请求覆盖预设设置；默认由 API 预设里的开关决定。
    // 即使没有页面回调，也要消费流并拼出完整文本，保证旧调用方兼容。
    const shouldStream = options.stream === true
      || (options.stream !== false && provider.streamingEnabled === true);
    const onChunk = options.onChunk || (() => {});

    if (provider.type === 'openai') {
      return shouldStream
        ? streamOpenAI(provider, messages, temperature, maxTokens, onChunk)
        : callOpenAI(provider, messages, temperature, maxTokens);
    } else if (provider.type === 'claude') {
      return shouldStream
        ? streamClaude(provider, messages, temperature, maxTokens, onChunk)
        : callClaude(provider, messages, temperature, maxTokens);
    } else if (provider.type === 'gemini') {
      return shouldStream
        ? streamGemini(provider, messages, temperature, maxTokens, onChunk)
        : callGemini(provider, messages, temperature, maxTokens);
    }
    throw new Error(`不支持的 API 类型: ${provider.type}`);
  }

  async function callOpenAI(provider, messages, temperature, maxTokens) {
    const baseUrl = normalizeOpenAIBaseUrl(provider.baseUrl);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...buildOpenAIReasoningParams(provider)
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API 错误 (${response.status}): ${err}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('OpenAI 返回数据异常：' + JSON.stringify(data).slice(0, 200));
    }
    return content;
  }

  async function callClaude(provider, messages, temperature, maxTokens) {
    // Extract system message
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const body = {
      model: provider.model,
      max_tokens: maxTokens,
      temperature,
      messages: userMessages.map(m => ({ role: m.role, content: m.content }))
    };
    if (systemMsg) body.system = systemMsg.content;

    const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API 错误 (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (typeof text !== 'string') {
      throw new Error('Claude 返回数据异常：' + JSON.stringify(data).slice(0, 200));
    }
    return text;
  }

  async function callGemini(provider, messages, temperature, maxTokens) {
    // Convert messages to Gemini format
    const contents = [];
    let systemInstruction = null;

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    const body = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '');
    // 用 header 传 API Key（避免出现在 URL 里被日志/历史记录捕获）
    const url = `${baseUrl}/v1beta/models/${provider.model}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': provider.apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API 错误 (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      throw new Error('Gemini 返回数据异常：' + JSON.stringify(data).slice(0, 200));
    }
    return text;
  }

  async function streamOpenAI(provider, messages, temperature, maxTokens, onChunk) {
    const baseUrl = normalizeOpenAIBaseUrl(provider.baseUrl);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({ model: provider.model, messages, temperature, max_tokens: maxTokens,
        ...buildOpenAIReasoningParams(provider), stream: true })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API 错误 (${response.status}): ${err}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const chunk = json.choices?.[0]?.delta?.content;
          if (chunk) { fullText += chunk; onChunk(chunk); }
        } catch {}
      }
    }
    return fullText;
  }

  async function streamClaude(provider, messages, temperature, maxTokens, onChunk) {
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    const body = {
      model: provider.model, max_tokens: maxTokens, temperature, stream: true,
      messages: userMessages.map(m => ({ role: m.role, content: m.content }))
    };
    if (systemMsg) body.system = systemMsg.content;
    const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API 错误 (${response.status}): ${err}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(line.slice(6));
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            const chunk = json.delta.text;
            if (chunk) { fullText += chunk; onChunk(chunk); }
          }
        } catch {}
      }
    }
    return fullText;
  }

  async function streamGemini(provider, messages, temperature, maxTokens, onChunk) {
    const contents = [];
    let systemInstruction = null;
    for (const msg of messages) {
      if (msg.role === 'system') { systemInstruction = msg.content; }
      else { contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }); }
    }
    const body = { contents, generationConfig: { temperature, maxOutputTokens: maxTokens } };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
    const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '');
    const url = `${baseUrl}/v1beta/models/${provider.model}:streamGenerateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API 错误 (${response.status}): ${err}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Gemini 流式返回 JSON 数组片段，逐块提取 text
      const matches = buffer.matchAll(/"text":\s*"((?:[^"\\]|\\.)*)"/g);
      for (const m of matches) {
        const chunk = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        fullText += chunk;
        onChunk(chunk);
      }
      // 已处理的部分不需要保留，只保留可能不完整的最后几个字符
      const lastBrace = buffer.lastIndexOf('}');
      if (lastBrace !== -1) buffer = buffer.slice(lastBrace + 1);
    }
    return fullText;
  }

  function probeReasoning(provider, optionId, signal) {
    const defaultOption = { openai: 'effort', claude: 'budget', gemini: 'budget' }[provider?.type];
    return probeReasoningRequest(provider, optionId || defaultOption, normalizeOpenAIBaseUrl(provider?.baseUrl), signal);
  }

  // Persistence
  async function loadFromDisk() {
    _autoSaveLoaded = false;
    settingsLoaded.value = false;
    saveState.value = 'loading';
    try {
      const settings = await window.cardForgeAPI.loadSettings();
      // 已有固定 ID 的配置也按普通预设保留；空数组是有效状态，不补回默认项。
      providers.value = Array.isArray(settings?.apiProviders) ? settings.apiProviders : [];
      for (const provider of providers.value) {
        if (!provider.reasoningModelType) provider.reasoningModelType = 'other';
        if (typeof provider.reasoningEnabled !== 'boolean') provider.reasoningEnabled = false;
        if (!provider.reasoningEffort) provider.reasoningEffort = 'medium';
        if (typeof provider.streamingEnabled !== 'boolean') provider.streamingEnabled = false;
      }
      activeProviderId.value = settings?.activeProviderId || null;
      saveError.value = '';
      saveState.value = 'idle';
      settingsLoaded.value = true;
      _autoSaveLoaded = true;
    } catch (e) {
      saveError.value = '读取 API 预设失败：' + e.message;
      saveState.value = 'error';
    }
  }

  // 先读后写，不会覆盖其他 store 的字段
  // 必须深度克隆，避免 Vue reactive proxy 通过 IPC structured clone 失败
  async function saveToDisk() {
    if (!_autoSaveLoaded) return;
    clearTimeout(_saveTimer);
    const revision = _saveRevision;
    const snapshot = JSON.parse(JSON.stringify(providers.value));
    const selectedId = activeProviderId.value;
    const operation = _saveQueue.catch(() => {}).then(async () => {
      if (revision === _saveRevision) saveState.value = 'saving';
      try {
        const settings = await window.cardForgeAPI.loadSettings() || {};
        settings.apiProviders = snapshot;
        settings.activeProviderId = selectedId;
        const result = await window.cardForgeAPI.saveSettings(settings);
        if (!result?.success) throw new Error(result?.error || '保存失败');
        lastSavedAt.value = new Date().toISOString();
        if (revision === _saveRevision) { saveState.value = 'saved'; saveError.value = ''; }
      } catch (e) {
        if (revision === _saveRevision) { saveState.value = 'error'; saveError.value = e.message; }
        throw e;
      }
    });
    _saveQueue = operation;
    return operation;
  }

  // debounce 自动保存（300ms）
  function scheduleSave() {
    if (!_autoSaveLoaded) return;
    _saveRevision++;
    saveState.value = 'pending';
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      saveToDisk().catch(e => {
        // 用 lazy import 避免循环依赖
        import('./app.js').then(({ useAppStore }) => {
          try { useAppStore().toastError('API 设置保存失败：' + e.message); } catch {}
        });
      });
      _saveTimer = null;
    }, 300);
  }

  // 监听整个 providers 数组的深度变化（包括 apiKey/baseUrl/model/enabled 等）
  watch([providers, activeProviderId], scheduleSave, { deep: true, flush: 'sync' });

  // 设置当前激活服务商
  function setActiveProvider(id) {
    const provider = providers.value.find(p => p.id === id);
    if (id !== null && (!provider?.enabled || !isProviderReady(provider))) return;
    activeProviderId.value = id;
  }

  function addProvider() {
    const id = 'custom_' + crypto.randomUUID();
    providers.value.push({
      id,
      name: '新 API 预设',
      type: 'openai',
      baseUrl: '',
      apiKey: '',
      model: '',
      temperature: 0.8,
      enabled: true,
      collapsed: false,
      reasoningModelType: 'other',
      reasoningEnabled: false,
      reasoningEffort: 'medium',
      streamingEnabled: false
    });
    return id;
  }

  function removeProvider(id) {
    const idx = providers.value.findIndex(p => p.id === id);
    if (idx !== -1) providers.value.splice(idx, 1);
    // 如果删的是当前激活的，清空 activeProviderId
    if (activeProviderId.value === id) activeProviderId.value = null;
  }

  async function fetchModels(provider) {
    if (!provider || !provider.apiKey) return [];
    const baseUrl = provider.type === 'openai'
      ? normalizeOpenAIBaseUrl(provider.baseUrl)
      : (provider.baseUrl || '').replace(/\/+$/, '');
    try {
      if (provider.type === 'openai') {
        const resp = await fetch(`${baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${provider.apiKey}` }
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.data || []).map(m => m.id).sort();
      } else if (provider.type === 'claude') {
        const resp = await fetch(`${baseUrl}/v1/models`, {
          headers: { 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.data || []).map(m => m.id).sort();
      } else if (provider.type === 'gemini') {
        const resp = await fetch(`${baseUrl}/v1beta/models?key=${provider.apiKey}`);
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.models || []).map(m => m.name.replace('models/', '')).sort();
      }
    } catch (e) {}
    return [];
  }

  return {
    providers, activeProviderId, activeProvider, isConfigured, isProviderReady,
    settingsLoaded, saveState, saveError, lastSavedAt,
    chat, chatWithProvider, getModelMaxTokens, fetchModels, loadFromDisk, saveToDisk, addProvider, removeProvider,
    setActiveProvider, probeReasoning
  };
});
