// A successful generation only proves request acceptance, not that a gateway
// honored the setting. Never infer adjustable reasoning from model names alone.
export const reasoningProbeOptions = {
  openai: [
    { id: 'effort', label: '思考强度：medium', parameter: 'reasoning_effort', value: 'medium' }
  ],
  claude: [
    { id: 'budget', label: '思考预算：1024 tokens', parameter: 'thinking.budget_tokens', value: 1024 },
    { id: 'adaptive', label: '自适应思考 + 强度：medium', parameter: 'thinking.type + output_config.effort', value: 'adaptive / medium' }
  ],
  gemini: [
    { id: 'budget', label: '思考预算：1024 tokens', parameter: 'generationConfig.thinkingConfig.thinkingBudget', value: 1024 },
    { id: 'level', label: '思考等级：medium', parameter: 'generationConfig.thinkingConfig.thinkingLevel', value: 'medium' }
  ]
};

// Model family metadata is intentionally user-selectable. A relay may expose
// a model under a different name, so automatic name matching would be unsafe.
export const modelFamilyOptions = [
  { value: 'gpt', label: 'GPT' },
  { value: 'glm', label: 'GLM' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'claude', label: 'Claude' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'other', label: '其他模型' }
];

export const reasoningEffortOptions = {
  gpt: ['low', 'medium', 'high'],
  glm: ['low', 'medium', 'high'],
  gemini: ['low', 'medium', 'high'],
  claude: ['low', 'medium', 'high'],
  deepseek: ['low', 'medium', 'high'],
  other: ['low', 'medium', 'high']
};

export function getReasoningEffortOptions(family) {
  return reasoningEffortOptions[family] || reasoningEffortOptions.other;
}

// OpenAI-compatible gateways commonly accept this field even when their
// upstream model is GLM, Gemini, Claude, or DeepSeek. Keep it opt-in because
// unsupported gateways may reject unknown request fields.
export function buildOpenAIReasoningParams(provider) {
  if (provider?.type !== 'openai' || provider.reasoningEnabled !== true) return {};
  const family = provider.reasoningModelType || 'other';
  const effort = getReasoningEffortOptions(family).includes(provider.reasoningEffort)
    ? provider.reasoningEffort : 'medium';
  return { reasoning_effort: effort };
}

export function getReasoningProbeOptions(type) {
  return reasoningProbeOptions[type] || [];
}

function buildProbe(provider, option, openAIBaseUrl) {
  const prompt = '计算 17 × 23，只回复结果数字。';
  const base = provider.baseUrl.trim().replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (provider.type === 'openai') {
    headers.Authorization = `Bearer ${provider.apiKey}`;
    const tokenLimit = /^(?:o\d|gpt-(?:5|6))/i.test(provider.model)
      ? { max_completion_tokens: 512 }
      : { max_tokens: 64 };
    return {
      url: `${openAIBaseUrl}/chat/completions`, headers,
      body: { model: provider.model, messages: [{ role: 'user', content: prompt }],
        reasoning_effort: option.value, ...tokenLimit, stream: false }
    };
  }
  if (provider.type === 'claude') {
    headers['x-api-key'] = provider.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
    return {
      url: `${base.replace(/\/v1$/, '')}/v1/messages`, headers,
      body: { model: provider.model, messages: [{ role: 'user', content: prompt }], max_tokens: 1280,
        ...(option.id === 'adaptive'
          ? { thinking: { type: 'adaptive' }, output_config: { effort: 'medium' } }
          : { thinking: { type: 'enabled', budget_tokens: 1024 } }) }
    };
  }
  return {
    url: `${base.replace(/\/v1beta$/, '')}/v1beta/models/${encodeURIComponent(provider.model.replace(/^models\//, ''))}:generateContent`,
    headers: { ...headers, 'x-goog-api-key': provider.apiKey },
    body: { contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1280, thinkingConfig: option.id === 'level'
        ? { thinkingLevel: 'medium' } : { thinkingBudget: 1024 } } }
  };
}

function safeError(data, key) {
  const error = data?.error;
  const message = typeof error === 'string' ? error : error?.message || data?.message || '';
  if (typeof message !== 'string') return '';
  return (key ? message.split(key).join('[已隐藏 Key]') : message)
    .replace(/https?:\/\/\S+/gi, '[服务地址]')
    .replace(/\s+/g, ' ').slice(0, 240);
}

export async function probeReasoningRequest(provider, optionId, openAIBaseUrl, signal) {
  const option = getReasoningProbeOptions(provider.type).find(item => item.id === optionId);
  if (!option) throw new Error('请选择当前接口协议的探测方式');
  if (!provider.baseUrl?.trim() || !provider.apiKey?.trim() || !provider.model?.trim()) {
    throw new Error('请先填写服务地址、API Key 和模型');
  }
  const request = buildProbe(provider, option, openAIBaseUrl);
  const parsedUrl = new URL(request.url);
  if (!['https:', 'http:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
    throw new Error('服务地址必须是有效的 HTTP 或 HTTPS 地址');
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timedOut = false;
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 60000);
  const result = (status, label, detail, extra = {}) => ({
    status, label, detail, parameter: option.parameter, value: option.value,
    checkedAt: new Date().toISOString(), ...extra
  });
  try {
    const fetchProbe = body => fetch(request.url, {
      method: 'POST', headers: request.headers, body: JSON.stringify(body), signal: controller.signal
    });
    let response = await fetchProbe(request.body);
    let text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch {
      return result('unknown', '无法确认', /<\s*(?:!doctype|html|head|body)\b/i.test(text)
        ? `服务返回了网页（HTTP ${response.status}），请检查 API 地址或网关。`
        : `服务未返回有效 JSON（HTTP ${response.status}），无法判断思考能力。`);
    }
    // OpenAI 兼容网关对 token 字段的兼容性不一致。若第一次只因字段名失败，
    // 用另一种标准字段重试一次，避免把网关差异误判成不支持思考参数。
    if (provider.type === 'openai' && !response.ok && request.body.max_completion_tokens
      && /max[_ -](?:completion[_ -])?tokens|token limit/i.test(safeError(data, provider.apiKey) || text)) {
      const retryBody = { ...request.body, max_tokens: 64 };
      delete retryBody.max_completion_tokens;
      response = await fetch(request.url, {
        method: 'POST', headers: request.headers, body: JSON.stringify(retryBody), signal: controller.signal
      });
      text = await response.text();
      try { data = JSON.parse(text); } catch { data = null; }
      if (!data) {
        return result('unknown', '无法确认', /<\s*(?:!doctype|html|head|body)\b/i.test(text)
          ? `服务返回了网页（HTTP ${response.status}），请检查 API 地址或网关。`
          : `服务未返回有效 JSON（HTTP ${response.status}），无法判断思考能力。`);
      }
    }
    if (!response.ok || data?.error) {
      const message = safeError(data, provider.apiKey);
      // Authentication, quota, missing models, and token-limit errors are not
      // evidence against reasoning support. Only classify explicit field errors.
      const mentionsThinking = /reasoning[_ .-]?effort|thinking|budget_tokens|output_config|思考|推理强度/i.test(message);
      const rejectsField = /unsupported|not supported|does not support|unknown (?:field|parameter)|unrecognized|not (?:allowed|permitted)|invalid|must be|only (?:supports?|allowed)|不支持|无效|不允许/i.test(message);
      if ([400, 422].includes(response.status) && mentionsThinking && rejectsField) {
        return result('rejected', '本次参数被拒绝', `${message}。仅表示此参数组合不可用，不代表模型没有推理能力。`);
      }
      return result('unknown', '探测未完成', `HTTP ${response.status}：${message || '服务返回错误'}。无法据此判断是否支持思考设置。`);
    }
    const valid = provider.type === 'openai' ? Array.isArray(data?.choices) && data.choices.length > 0
      : provider.type === 'claude' ? data?.type === 'message' && Array.isArray(data.content)
      : Array.isArray(data?.candidates) && data.candidates.length > 0;
    if (!valid) return result('unknown', '无法确认', '响应不符合当前接口的生成格式，请检查接口协议与模型。');
    const tokens = provider.type === 'openai' ? data?.usage?.completion_tokens_details?.reasoning_tokens
      : provider.type === 'gemini' ? data?.usageMetadata?.thoughtsTokenCount : undefined;
    const hasThinkingBlock = provider.type === 'claude'
      && data.content.some(block => ['thinking', 'redacted_thinking'].includes(block.type));
    const evidence = typeof tokens === 'number' && tokens > 0 ? `服务报告了 ${tokens} 个思考 token。`
      : hasThinkingBlock ? '响应包含思考内容块。' : '响应没有提供可确认的思考用量。';
    return result('accepted', '参数已接受，生效未确认',
      `${evidence} 成功响应不能证明服务商执行了指定强度或预算，也不能推断其他档位可用。`);
  } catch (error) {
    if (signal?.aborted) throw error;
    return result('unknown', '探测未完成', timedOut
      ? '探测超过 60 秒，已停止等待。超时不能说明模型不支持思考设置。'
      : '请求失败，请检查网络、跨域限制或服务地址后重试。');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
