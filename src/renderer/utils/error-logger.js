// 渲染进程错误捕获 — 桌面版
// 捕获后通过 IPC 发到主进程写文件，同时本地保留环形缓冲区供 UI 即时查看（不必等 IPC）

const MAX_BUFFER = 200;
const buffer = []; // { time, source, type, message, stack, extra }

function pushBuffer(entry) {
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();
}

function buildEntry(type, message, stack, extra) {
  return {
    time: new Date().toISOString(),
    source: 'renderer',
    type,
    message: String(message || ''),
    stack: stack ? String(stack) : '',
    extra: extra || null
  };
}

async function sendToMain(entry) {
  try {
    if (window.cardForgeAPI && window.cardForgeAPI.appendErrorLog) {
      await window.cardForgeAPI.appendErrorLog(entry);
    }
  } catch (e) {
    // 忽略，避免死循环
  }
}

function record(type, message, stack, extra) {
  const entry = buildEntry(type, message, stack, extra);
  pushBuffer(entry);
  sendToMain(entry);
}

// 公共 API：手动记录一条
function logManual(message, extra) {
  record('manual', message, '', extra);
}

// 包装 console.error — 保留原行为同时记录
function patchConsoleError() {
  const original = console.error.bind(console);
  console.error = function (...args) {
    try {
      const msg = args.map(a => {
        if (a instanceof Error) return a.message;
        if (typeof a === 'object') {
          try { return JSON.stringify(a); } catch (e) { return String(a); }
        }
        return String(a);
      }).join(' ');
      const stack = args.find(a => a instanceof Error)?.stack || '';
      record('console.error', msg, stack);
    } catch (e) {}
    original(...args);
  };
}

function install() {
  // 同步异常
  window.addEventListener('error', (event) => {
    const err = event.error;
    record('window.error', event.message || (err && err.message), err && err.stack, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // 未捕获的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason && reason.message ? reason.message : String(reason);
    const stack = reason && reason.stack ? reason.stack : '';
    record('unhandledRejection', msg, stack);
  });

  // Vue 错误处理 — 由调用方在 main.js 设置 app.config.errorHandler 调用 logVueError
  patchConsoleError();
}

function logVueError(err, instance, info) {
  const msg = err && err.message ? err.message : String(err);
  const stack = err && err.stack ? err.stack : '';
  // 只记录组件身份和路由路径，不记录 props、表单内容或路由查询参数。
  record('vue', msg, stack, {
    hookInfo: info,
    component: instance?.$options?.name || instance?.$options?.__name || 'unknown',
    componentFile: instance?.$options?.__file || '',
    route: instance?.$route?.path || ''
  });
}

function getBuffer() {
  return buffer.slice();
}

function clearBuffer() {
  buffer.length = 0;
}

export default {
  install,
  logManual,
  logVueError,
  getBuffer,
  clearBuffer
};
