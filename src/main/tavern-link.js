// Keep the CSRF token and its signed session cookies together. Node fetch has no cookie jar.
const endpoints = new Set([
  '/api/characters/all', '/api/characters/get', '/api/characters/merge-attributes',
  '/api/worldinfo/list', '/api/worldinfo/get', '/api/worldinfo/edit'
]);

async function readResponse(response) {
  if (response.status === 401 || response.status === 302) {
    throw new Error('酒馆要求登录。当前 Link 支持本机免登录酒馆，暂不支持多用户或 Basic Auth 登录。');
  }
  if (response.status === 403) throw new Error('酒馆拒绝访问（403），请检查白名单、登录要求和 CSRF 配置；不需要关闭 CSRF。');
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!response.ok) {
    throw new Error('酒馆接口返回 ' + response.status + '：' + String(data?.message || data?.error || text).slice(0, 300));
  }
  if (/^\s*</.test(text)) throw new Error('地址返回了网页，请填写酒馆服务地址，并确认没有登录拦截。');
  return data;
}

async function requestTavernApi(baseUrl, endpoint, body = {}) {
  if (!endpoints.has(endpoint)) throw new Error('不支持的酒馆接口');
  const url = new URL(String(baseUrl).trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('请填写不含账号、查询参数或 # 的 HTTP/HTTPS 酒馆地址');
  }
  const base = url.href.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    // A fresh session per request also handles a restarted Tavern without stale cookies.
    const csrfResponse = await fetch(base + '/csrf-token', { signal: controller.signal, redirect: 'manual' });
    const csrf = await readResponse(csrfResponse);
    if (typeof csrf?.token !== 'string' || !csrf.token) throw new Error('酒馆没有返回有效的 CSRF 令牌');
    const cookie = csrfResponse.headers.getSetCookie().map(value => value.split(';', 1)[0]).join('; ');
    const response = await fetch(base + endpoint, {
      method: 'POST', redirect: 'manual', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.token, ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(body)
    });
    return { success: true, data: await readResponse(response) };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('连接酒馆超时；写入请求超时后请重新读取目标，确认实际保存结果。');
    if (error.message === 'fetch failed') throw new Error('无法连接酒馆，请先启动 SillyTavern 并检查地址和端口。');
    throw error;
  } finally { clearTimeout(timeout); }
}

module.exports = { requestTavernApi };
