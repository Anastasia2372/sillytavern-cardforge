const { app, BrowserWindow, ipcMain, dialog, shell, Menu, clipboard } = require('electron');

// 在初始化会话和自动保存前抢占单实例锁，避免多个进程共用缓存和草稿。
if (!app.requestSingleInstanceLock()) {
  app.quit();
  return;
}

const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { autoUpdater } = require('electron-updater');
const { registerAutosave } = require('./autosave');
const { registerBackground } = require('./background');

const isDev = process.env.NODE_ENV === 'development';

// 主进程全局错误捕获 — 必须在 app.whenReady 之前注册
logger.installGlobalHandlers();
registerAutosave();

let mainWindow;
registerBackground(() => mainWindow);

app.on('second-instance', () => {
  // 首个窗口尚未创建时，继续由正常启动流程打开。
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

// ============ 自动更新 ============
autoUpdater.autoDownload = false;          // 让用户先确认再下载
autoUpdater.autoInstallOnAppQuit = true;   // 下载后退出时自动安装
autoUpdater.logger = {
  info: () => {},
  warn: () => {},
  error: (msg) => logger.logError('main', 'updater', String(msg)),
  debug: () => {}
};

autoUpdater.on('update-available', (info) => {
  if (!mainWindow) return;
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'CardForge 有新版本',
    message: `发现新版本 ${info.version}（当前 ${app.getVersion()}）`,
    detail: '是否立即下载？下载会在后台进行，完成后再询问是否重启安装。',
    buttons: ['立即下载', '稍后再说'],
    defaultId: 0,
    cancelId: 1
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate().catch(err => {
        logger.logError('main', 'updater-download', err && err.message, err && err.stack);
      });
    }
  });
});

autoUpdater.on('update-downloaded', (info) => {
  if (!mainWindow) return;
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: '下载完成',
    message: `新版本 ${info.version} 已下载完成`,
    detail: '是否立即重启安装？也可以选稍后，退出软件时会自动安装。',
    buttons: ['立即重启安装', '稍后'],
    defaultId: 0,
    cancelId: 1
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  logger.logError('main', 'updater-error', err && err.message, err && err.stack);
});

function checkForUpdates(silent) {
  if (isDev) return Promise.resolve({ skipped: 'dev' });
  return autoUpdater.checkForUpdates().catch(err => {
    logger.logError('main', 'updater-check', err && err.message, err && err.stack);
    if (!silent && mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: '检查更新失败',
        message: '无法连接到更新服务器',
        detail: err && err.message ? err.message : '请检查网络后重试。'
      });
    }
    return { error: err };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: 'SillyTavern CardForge - 角色卡锻造炉',
    icon: path.join(__dirname, '../../public/icon.png'),
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // webSecurity 必须为 false：Live2D 模型通过 file:// 协议加载本地资源
      // 此应用不加载任何远程页面，仅加载打包后的本地 HTML，不存在跨域 XSS 风险
      webSecurity: false
    },
    backgroundColor: '#0a0a0f',
    show: false
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 无边框窗口也提供原生文本编辑菜单，支持聊天文字复制及输入框粘贴。
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const items = [];
    if (params.isEditable) {
      items.push({ role: 'undo', label: '撤销', enabled: params.editFlags.canUndo },
        { role: 'redo', label: '重做', enabled: params.editFlags.canRedo }, { type: 'separator' },
        { role: 'cut', label: '剪切', enabled: params.editFlags.canCut });
    }
    if (params.isEditable || params.selectionText) {
      items.push({ role: 'copy', label: '复制', enabled: params.editFlags.canCopy });
    }
    if (params.isEditable) {
      items.push({ role: 'paste', label: '粘贴', enabled: params.editFlags.canPaste },
        { type: 'separator' }, { role: 'selectAll', label: '全选' });
    }
    if (items.length) Menu.buildFromTemplate(items).popup({ window: mainWindow });
  });

  // F12 打开 DevTools — 仅开发环境
  if (isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        mainWindow.webContents.toggleDevTools();
      }
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  // 启动 5 秒后静默检查更新（不打扰启动流程）
  setTimeout(() => checkForUpdates(true), 5000);
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ============ IPC Handlers ============

// SillyTavern Link：通过酒馆自己的 HTTP API 读写数据。
const { requestTavernApi } = require('./tavern-link');

ipcMain.handle('tavern:status', async () => ({
  installPath: 'E:\\SillyTavern',
  installExists: fs.existsSync('E:\\SillyTavern'),
  defaultUrl: 'http://127.0.0.1:8000'
}));

ipcMain.handle('tavern:request', async (_event, options = {}) => {
  try {
    return await requestTavernApi(options.baseUrl, options.endpoint, options.body);
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle('clipboard:writeText', (_event, text) => {
  if (typeof text !== 'string') throw new TypeError('只能复制文本');
  clipboard.writeText(text);
});

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

// File dialogs
ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options?.filters || [
      { name: '角色卡文件', extensions: ['png', 'json'] },
      { name: 'PNG 图片', extensions: ['png'] },
      { name: 'JSON 文件', extensions: ['json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:openImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
    ]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options?.defaultPath || 'character.png',
    filters: options?.filters || [
      { name: 'PNG 角色卡', extensions: ['png'] },
      { name: 'JSON 文件', extensions: ['json'] }
    ]
  });
  if (result.canceled) return null;
  return result.filePath;
});

ipcMain.handle('dialog:selectDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// File operations
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return { success: true, data: buffer.toString('base64'), isBuffer: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fs:readTextFile', async (event, filePath) => {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: text };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, data, encoding) => {
  try {
    if (encoding === 'base64') {
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    } else {
      fs.writeFileSync(filePath, data, encoding || 'utf-8');
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fs:exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

// PNG character card operations
ipcMain.handle('png:extractCharaData', async (event, filePath) => {
  try {
    const extract = require('png-chunks-extract');
    const text = require('png-chunk-text');
    const buffer = fs.readFileSync(filePath);
    const chunks = extract(new Uint8Array(buffer));

    // Try ccv3 first, then chara
    for (const key of ['ccv3', 'chara']) {
      const tEXtChunk = chunks.find(c =>
        c.name === 'tEXt' && text.decode(c.data)?.keyword === key
      );
      if (tEXtChunk) {
        const decoded = text.decode(tEXtChunk.data);
        const jsonStr = Buffer.from(decoded.text, 'base64').toString('utf-8');
        const data = JSON.parse(jsonStr);
        return { success: true, data, format: key };
      }
    }
    return { success: false, error: '这张PNG中没有找到角色卡数据' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('png:embedCharaData', async (event, pngPath, cardJson, outputPath) => {
  try {
    // 文件存在性检查
    if (!fs.existsSync(pngPath)) {
      return { success: false, error: `源封面文件不存在：${pngPath}` };
    }

    const extract = require('png-chunks-extract');
    const encode = require('png-chunks-encode');
    const text = require('png-chunk-text');

    let buffer;
    try {
      buffer = fs.readFileSync(pngPath);
    } catch (readErr) {
      return { success: false, error: `读取源文件失败：${readErr.message}` };
    }

    // 检查是否真的是 PNG（前 8 字节签名）
    const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    for (let i = 0; i < 8; i++) {
      if (buffer[i] !== PNG_SIGNATURE[i]) {
        return { success: false, error: `源文件不是有效的 PNG 格式（请上传 PNG，不要用 JPG/WEBP）` };
      }
    }

    let chunks;
    try {
      chunks = extract(new Uint8Array(buffer));
    } catch (parseErr) {
      return { success: false, error: `解析 PNG 失败：${parseErr.message}` };
    }

    // Remove existing chara/ccv3 chunks
    chunks = chunks.filter(c => {
      if (c.name !== 'tEXt') return true;
      try {
        const decoded = text.decode(c.data);
        return decoded.keyword !== 'chara' && decoded.keyword !== 'ccv3';
      } catch { return true; }
    });

    // Add new chara chunk (V2 format)
    const base64Data = Buffer.from(JSON.stringify(cardJson)).toString('base64');
    const charaChunk = text.encode('chara', base64Data);

    // Insert before IEND
    const iendIndex = chunks.findIndex(c => c.name === 'IEND');
    if (iendIndex === -1) {
      return { success: false, error: 'PNG 文件结构异常（找不到 IEND chunk）' };
    }
    chunks.splice(iendIndex, 0, charaChunk);

    const outputBuffer = Buffer.from(encode(chunks));

    try {
      fs.writeFileSync(outputPath, outputBuffer);
    } catch (writeErr) {
      return { success: false, error: `写入文件失败：${writeErr.message}（可能权限不足或文件被占用）` };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// App settings persistence
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

ipcMain.handle('settings:load', async () => {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (e) {}
  return {};
});

ipcMain.handle('settings:save', async (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Open external link — 只允许 http/https，防止恶意 file:// 等协议
ipcMain.on('shell:openExternal', (event, url) => {
  if (typeof url !== 'string') return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      shell.openExternal(url);
    }
  } catch (e) {
    // 非法 URL 静默忽略
  }
});

// Get resource path (for live2d etc)
ipcMain.handle('app:getResourcePath', () => {
  if (isDev) {
    return path.join(__dirname, '../../public');
  }
  return process.resourcesPath;
});

// ============ Auto Update IPC ============
ipcMain.handle('update:check', async () => {
  try {
    const result = await checkForUpdates(false);
    if (result && result.skipped === 'dev') {
      return { success: true, skipped: 'dev', message: '开发环境跳过更新检查' };
    }
    if (result && result.error) {
      return { success: false, error: result.error.message };
    }
    if (result && result.updateInfo) {
      return { success: true, version: result.updateInfo.version, current: app.getVersion() };
    }
    return { success: true, current: app.getVersion() };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('update:getVersion', () => app.getVersion());

// ============ Error Log IPC ============
ipcMain.handle('log:read', async () => {
  try {
    return { success: true, entries: logger.readAll(), dir: logger.getLogDir() };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('log:append', async (event, entry) => {
  try {
    const e = entry || {};
    logger.logError(e.source || 'renderer', e.type || 'manual', e.message || '', e.stack || '', e.extra || null);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('log:clear', async () => {
  try {
    logger.clear();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('log:openFolder', async () => {
  return logger.openLogFolder();
});
