import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useApiStore = defineStore('api', () => {
  // State
  const providers = ref([]);
  const activeProviderId = ref(null);
  let _autoSaveLoaded = false;
  let _saveTimer = null;

  // Create default providers
  function initDefaults() {
    if (providers.value.length === 0) {
      providers.value = [
        {
          id: 'openai',
          name: 'OpenAI 兼容',
          type: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: '',
          model: 'gpt-4o',
          temperature: 0.8,
          enabled: true
        },
        {
          id: 'claude',
          name: 'Claude (Anthropic)',
          type: 'claude',
          baseUrl: 'https://api.anthropic.com',
          apiKey: '',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.8,
          enabled: false
        },
        {
          id: 'gemini',
          name: 'Gemini (Google)',
          type: 'gemini',
          baseUrl: 'https://generativelanguage.googleapis.com',
          apiKey: '',
          model: 'gemini-2.0-flash',
          temperature: 0.8,
          enabled: false
        }
      ];
    }
  }

  const activeProvider = computed(() => {
    if (activeProviderId.value) {
      const p = providers.value.find(p => p.id === activeProviderId.value);
      // 主动选的就用，即使没启用也用（用户意图优先）
      if (p && p.apiKey) return p;
    }
    // fallback：第一个启用且有 key 的
    return providers.value.find(p => p.enabled && p.apiKey);
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
    // Gemini
    if (m.includes('gemini-2') || m.includes('gemini-1.5-pro')) return 8192;
    if (m.includes('gemini')) return 8192;
    // DeepSeek / Qwen 等中转常见模型
    if (m.includes('deepseek')) return 8192;
    if (m.includes('qwen')) return 8192;
    return 4096;
  }

  async function _callProvider(provider, messages, options) {
    const temperature = options.temperature ?? provider.temperature ?? 0.8;
    const modelMax = getModelMaxTokens(provider.model);
    const maxTokens = Math.min(options.maxTokens ?? 4096, modelMax);
    const onChunk = options.onChunk || null;

    if (provider.type === 'openai') {
      return onChunk
        ? streamOpenAI(provider, messages, temperature, maxTokens, onChunk)
        : callOpenAI(provider, messages, temperature, maxTokens);
    } else if (provider.type === 'claude') {
      return onChunk
        ? streamClaude(provider, messages, temperature, maxTokens, onChunk)
        : callClaude(provider, messages, temperature, maxTokens);
    } else if (provider.type === 'gemini') {
      return onChunk
        ? streamGemini(provider, messages, temperature, maxTokens, onChunk)
        : callGemini(provider, messages, temperature, maxTokens);
    }
    throw new Error(`不支持的 API 类型: ${provider.type}`);
  }

  async function callOpenAI(provider, messages, temperature, maxTokens) {
    const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '');
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
        max_tokens: maxTokens
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
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    // Merge consecutive same-role messages for Claude API
    const merged = [];
    for (const m of userMessages) {
      const last = merged[merged.length - 1];
      if (last && last.role === m.role) {
        last.content += '\n' + m.content;
      } else {
        merged.push({ role: m.role, content: m.content });
      }
    }

    const body = {
      model: provider.model,
      max_tokens: maxTokens,
      temperature,
      messages: merged
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

    // Merge consecutive same-role messages for Gemini
    const merged = [];
    for (const c of contents) {
      const last = merged[merged.length - 1];
      if (last && last.role === c.role) {
        last.parts[0].text += '\n' + c.parts[0].text;
      } else {
        merged.push({ role: c.role, parts: [{ text: c.parts[0].text }] });
      }
    }

    const body = {
      contents: merged,
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

  function warnStreamParseIssues(providerName, warningCount) {
    if (warningCount > 0) {
      console.warn(`[API Stream] ${providerName} stream ignored ${warningCount} malformed fragment(s).`);
    }
  }

  async function streamOpenAI(provider, messages, temperature, maxTokens, onChunk) {
    const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({ model: provider.model, messages, temperature, max_tokens: maxTokens, stream: true })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API 错误 (${response.status}): ${err}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let parseWarningCount = 0;
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
        } catch (e) {
          parseWarningCount++;
        }
      }
    }
    warnStreamParseIssues('OpenAI', parseWarningCount);
    return fullText;
  }

  async function streamClaude(provider, messages, temperature, maxTokens, onChunk) {
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    const merged = [];
    for (const m of userMessages) {
      const last = merged[merged.length - 1];
      if (last && last.role === m.role) {
        last.content += '\n' + m.content;
      } else {
        merged.push({ role: m.role, content: m.content });
      }
    }
    const body = {
      model: provider.model, max_tokens: maxTokens, temperature, stream: true,
      messages: merged
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
    let parseWarningCount = 0;
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
        } catch (e) {
          parseWarningCount++;
        }
      }
    }
    warnStreamParseIssues('Claude', parseWarningCount);
    return fullText;
  }

  async function streamGemini(provider, messages, temperature, maxTokens, onChunk) {
    const contents = [];
    let systemInstruction = null;
    for (const msg of messages) {
      if (msg.role === 'system') { systemInstruction = msg.content; }
      else { contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }); }
    }
    const merged = [];
    for (const c of contents) {
      const last = merged[merged.length - 1];
      if (last && last.role === c.role) {
        last.parts[0].text += '\n' + c.parts[0].text;
      } else {
        merged.push({ role: c.role, parts: [{ text: c.parts[0].text }] });
      }
    }
    const body = { contents: merged, generationConfig: { temperature, maxOutputTokens: maxTokens } };
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
    let parseWarningCount = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Gemini 流式返回 JSON 数组片段，逐块提取 text
      const matches = [...buffer.matchAll(/"text":\s*"((?:[^"\\]|\\.)*)"/g)];
      for (const m of matches) {
        const chunk = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        fullText += chunk;
        onChunk(chunk);
      }
      // 已处理的部分不需要保留，只保留可能不完整的最后几个字符
      const lastBrace = buffer.lastIndexOf('}');
      if (lastBrace !== -1) {
        const completed = buffer.slice(0, lastBrace + 1);
        if (matches.length === 0 && completed.includes('"text"')) {
          parseWarningCount++;
        }
        buffer = buffer.slice(lastBrace + 1);
      }
    }
    warnStreamParseIssues('Gemini', parseWarningCount);
    return fullText;
  }

  // Persistence
  async function loadFromDisk() {
    try {
      const settings = await window.cardForgeAPI.loadSettings();
      if (settings.apiProviders) providers.value = settings.apiProviders;
      if (settings.activeProviderId) activeProviderId.value = settings.activeProviderId;
    } catch (e) {}
    initDefaults();
    // 加载完成后才启动自动保存监听，避免初始化时触发写盘
    _autoSaveLoaded = true;
  }

  // 先读后写，不会覆盖其他 store 的字段
  // 必须深度克隆，避免 Vue reactive proxy 通过 IPC structured clone 失败
  async function saveToDisk() {
    let settings = {};
    try {
      settings = await window.cardForgeAPI.loadSettings() || {};
    } catch (e) {}
    settings.apiProviders = JSON.parse(JSON.stringify(providers.value));
    settings.activeProviderId = activeProviderId.value;
    const result = await window.cardForgeAPI.saveSettings(settings);
    if (result && result.success === false) {
      throw new Error(result.error || '保存失败');
    }
  }

  // debounce 自动保存（300ms）
  function scheduleSave() {
    if (!_autoSaveLoaded) return;
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
  watch(providers, scheduleSave, { deep: true });
  watch(activeProviderId, scheduleSave);

  // 设置当前激活服务商
  function setActiveProvider(id) {
    activeProviderId.value = id;
  }

  function addProvider() {
    const id = 'custom_' + Date.now();
    providers.value.push({
      id,
      name: '自定义服务',
      type: 'openai',
      baseUrl: '',
      apiKey: '',
      model: '',
      temperature: 0.8,
      enabled: true
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
    const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '');
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
        const resp = await fetch(`${baseUrl}/v1beta/models`, {
          headers: { 'x-goog-api-key': provider.apiKey }
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.models || []).map(m => m.name.replace('models/', '')).sort();
      }
    } catch (e) {}
    return [];
  }

  return {
    providers, activeProviderId, activeProvider, isConfigured,
    chat, chatWithProvider, getModelMaxTokens, fetchModels, loadFromDisk, saveToDisk, addProvider, removeProvider, initDefaults,
    setActiveProvider
  };
});
