import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import { createPinia, setActivePinia } from 'pinia';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createRouter, createMemoryHistory } from 'vue-router';

let server, useChat, useApi, useCard, useNiang, useApp;

before(async () => {
  globalThis.window = { innerWidth: 1200, innerHeight: 750,
    cardForgeAPI: { loadSettings: async () => ({}) } };
  globalThis.localStorage = { getItem: () => null };
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  ({ useAssistantChatStore: useChat } = await server.ssrLoadModule('/stores/assistant-chat.js'));
  ({ useApiStore: useApi } = await server.ssrLoadModule('/stores/api.js'));
  ({ useCardStore: useCard } = await server.ssrLoadModule('/stores/card.js'));
  ({ useAiNiangStore: useNiang } = await server.ssrLoadModule('/stores/ainiang.js'));
  ({ useAppStore: useApp } = await server.ssrLoadModule('/stores/app.js'));
});

beforeEach(() => {
  setActivePinia(createPinia());
  useApp().toastError = () => {};
  useApi().providers = [{ id: 'test', type: 'openai', apiKey: 'test-only', model: 'test', enabled: true }];
  useApi().chat = async () => '测试回复';
});

after(async () => { await server?.close(); delete globalThis.window; delete globalThis.localStorage; });

test('小窗口与完整助手共享会话和草稿，后续请求包含上下文', async () => {
  const compact = useChat();
  const full = useChat();
  assert.equal(compact, full);
  compact.inputText = '帮我想一个人物';
  await compact.send();
  assert.deepEqual(full.messages.map(m => m.role), ['user', 'assistant']);
  let request;
  useApi().chat = async messages => { request = messages; return '后续回复'; };
  full.inputText = '再加一个弱点';
  assert.equal(compact.inputText, '再加一个弱点');
  await full.send();
  assert.ok(request.some(m => m.content === '测试回复'));
  assert.equal(compact.messages.length, 4);
});

test('引用人物设定、常驻条目及命中主关键词的条目，排除未命中和禁用条目', async () => {
  const card = useCard();
  card.cardData.name = '测试角色';
  card.cardData.description = '角色独有的背景设定';
  const entry = (id, content, keys, constant = false, enabled = true) =>
    ({ id, comment: String(id), content, keys, constant, enabled });
  card.cardData.character_book.entries = [
    entry(1, '常驻世界规则', [], true),
    entry(2, '林岚是失忆的航海师', ['林岚']),
    entry(3, '未命中的秘密', ['其他角色']),
    entry(4, '禁用的秘密', ['林岚'], false, false)
  ];
  let request;
  useApi().chat = async messages => { request = messages; return '灵感'; };
  useChat().inputText = '聊聊林岚的剧情';
  await useChat().send();
  const prompt = request[0].content;
  for (const text of ['角色独有的背景设定', '常驻世界规则', '林岚是失忆的航海师']) assert.ok(prompt.includes(text));
  for (const text of ['未命中的秘密', '禁用的秘密']) assert.ok(!prompt.includes(text));
});

test('只有助手独立 API 配置时仍可发送', async () => {
  useApi().providers = [];
  Object.assign(useNiang().youxi, { apiKey: 'test-only', apiBaseUrl: 'https://example.invalid', apiModel: 'custom' });
  let selected;
  useApi().chat = async () => { throw new Error('不应调用全局配置'); };
  useApi().chatWithProvider = async provider => { selected = provider; return '独立模型回复'; };
  useChat().inputText = '你好';
  await useChat().send();
  assert.equal(selected.model, 'custom');
  assert.equal(useChat().messages.at(-1).content, '独立模型回复');
});

test('发送期间阻止重复请求，保留下一条草稿', async () => {
  let resolveReply;
  let calls = 0;
  useApi().chat = () => { calls++; return new Promise(resolve => { resolveReply = resolve; }); };
  const chat = useChat();
  await chat.initialize();
  chat.inputText = '第一条';
  const pending = chat.send();
  await Promise.resolve();
  chat.inputText = '下一条草稿';
  await chat.send();
  assert.equal(calls, 1);
  resolveReply('收到');
  await pending;
  assert.equal(chat.inputText, '下一条草稿');
  assert.equal(chat.loading, false);
});

test('失败后恢复草稿，不把错误加入对话，可重试', async () => {
  useApi().chat = async () => { throw new Error('测试断线'); };
  const chat = useChat();
  chat.inputText = '保留这句话';
  await chat.send();
  assert.equal(chat.inputText, '保留这句话');
  assert.equal(chat.messages.length, 0);
  assert.equal(chat.loading, false);
  useApi().chat = async () => '恢复成功';
  await chat.send();
  assert.equal(chat.messages.length, 2);
});

test('小窗口和完整助手渲染同一段对话，文本被转义且有复制入口', async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useChat().messages.push({ id: 'render-check', role: 'assistant', name: '柚溪',
    content: '<script>这是普通文字</script>\n灵感测试' });
  for (const path of ['/components/InspirationChat.vue', '/views/AiAssistant.vue']) {
    const { default: component } = await server.ssrLoadModule(path);
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: {} }] });
    const app = createSSRApp({ render: () => h(component) });
    app.use(pinia);
    app.use(router);
    await router.push('/');
    const html = await renderToString(app);
    assert.ok(html.includes('灵感测试'));
    assert.ok(html.includes('复制'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>这是普通文字'));
  }
});

test('复制完整消息通过桌面剪贴板接口保留换行与代码', async () => {
  let copied;
  window.cardForgeAPI.copyText = async text => { copied = text; };
  const { copyText } = await server.ssrLoadModule('/utils/clipboard.js');
  await copyText('第一行\n```js\nconst value = 1;\n```');
  assert.equal(copied, '第一行\n```js\nconst value = 1;\n```');
});
