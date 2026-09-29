const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');
const logger = require('./logger');

function registerAutosave() {
  const revisions = new Map();
  const directory = () => path.join(app.getPath('userData'), 'card-drafts');
  function validate(snapshot) {
    if (!snapshot || snapshot.version !== 1 || !/^[a-zA-Z0-9-]{1,80}$/.test(snapshot.id)
      || !snapshot.card?.data || typeof snapshot.card.data !== 'object'
      || !Number.isSafeInteger(snapshot.revision) || typeof snapshot.session !== 'string') {
      throw new Error('角色卡草稿格式无效');
    }
    return snapshot;
  }

  function save(snapshot) {
    try {
      validate(snapshot);
      const key = snapshot.session + ':' + snapshot.id;
      const previous = revisions.get(key);
      if (previous && snapshot.revision < previous.revision) return previous;
      fs.mkdirSync(directory(), { recursive: true });
      const target = path.join(directory(), snapshot.id + '.json');
      const temporary = target + '.tmp';
      const savedAt = new Date().toISOString();
      // 完整写入临时文件后替换，保留上一份有效草稿。
      fs.writeFileSync(temporary, JSON.stringify({ ...snapshot, savedAt }), { encoding: 'utf8', flush: true });
      if (fs.existsSync(target)) {
        try {
          validate(JSON.parse(fs.readFileSync(target, 'utf8')));
          fs.copyFileSync(target, target + '.bak');
        } catch (error) {
          if (!(error instanceof SyntaxError) && error.message !== '角色卡草稿格式无效') throw error;
        }
      }
      fs.renameSync(temporary, target);
      const result = { success: true, savedAt, revision: snapshot.revision };
      revisions.set(key, result);
      return result;
    } catch (error) {
      logger.logError('main', 'card-autosave', error.message, error.stack);
      return { success: false, error: error.message };
    }
  }

  ipcMain.handle('draft:save', (_event, snapshot) => save(snapshot));
  // beforeunload 不能等待 Promise；关闭和切卡前同步补存。
  ipcMain.on('draft:saveSync', (event, snapshot) => { event.returnValue = save(snapshot); });
  ipcMain.handle('draft:load', () => {
    try {
      if (!fs.existsSync(directory())) return { success: true, draft: null };
      const candidates = fs.readdirSync(directory()).filter(name => /^[a-zA-Z0-9-]+\.json$/.test(name))
        .map(name => ({ file: path.join(directory(), name), time: fs.statSync(path.join(directory(), name)).mtimeMs }))
        .sort((a, b) => b.time - a.time);
      const errors = [];
      for (const candidate of candidates) {
        for (const file of [candidate.file, candidate.file + '.bak']) {
          try {
            const draft = validate(JSON.parse(fs.readFileSync(file, 'utf8')));
            return { success: true, draft, warning: errors.length ? '最近的草稿读取失败，已恢复上一份有效草稿。' : '' };
          } catch (error) { errors.push(error.message); }
        }
      }
      if (errors.length) throw new Error('无法读取自动保存的草稿：' + errors[0]);
      return { success: true, draft: null };
    } catch (error) {
      logger.logError('main', 'card-autosave-load', error.message, error.stack);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAutosave };
