const { app, ipcMain, dialog, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

function registerBackground(getWindow) {
  const imagePath = () => path.join(app.getPath('userData'), 'appearance', 'background.png');
  ipcMain.handle('appearance:loadBackground', async () => {
    try {
      const data = await fs.promises.readFile(imagePath());
      return { success: true, dataUrl: 'data:image/png;base64,' + data.toString('base64') };
    } catch (e) { return { success: false, error: e.message }; }
  });
  let selecting = false;
  ipcMain.handle('appearance:selectBackground', async () => {
    if (selecting) return { canceled: true };
    selecting = true;
    try {
      const result = await dialog.showOpenDialog(getWindow(), { properties: ['openFile'],
        filters: [{ name: '背景图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] });
      if (result.canceled || !result.filePaths.length) return { canceled: true };
      const selected = result.filePaths[0];
      const stat = await fs.promises.stat(selected);
      if (stat.size > 40 * 1024 * 1024) throw new Error('请选择小于 40 MB 的图片');
      const image = nativeImage.createFromBuffer(await fs.promises.readFile(selected));
      if (image.isEmpty()) throw new Error('图片无法解码，请使用 PNG、JPG 或 WebP 图片');
      const data = image.toPNG();
      const target = imagePath();
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await fs.promises.writeFile(target + '.tmp', data);
      await fs.promises.rename(target + '.tmp', target);
      return { success: true, name: path.basename(selected), dataUrl: 'data:image/png;base64,' + data.toString('base64') };
    } catch (e) { return { success: false, error: e.message }; }
    finally { selecting = false; }
  });
}

module.exports = { registerBackground };
