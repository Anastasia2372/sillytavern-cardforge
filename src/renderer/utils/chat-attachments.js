const TEXT_CHAR_LIMIT = 60000;
const IMAGE_BYTE_LIMIT = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const TEXT_EXTENSIONS = ['txt', 'md', 'json', 'yaml', 'yml', 'csv', 'html', 'htm', 'js', 'css', 'xml', 'log', 'ini'];

export const ATTACHMENT_ACCEPT = [...TEXT_EXTENSIONS.map(ext => '.' + ext), ...IMAGE_TYPES].join(',');

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('读取失败'));
    reader.readAsDataURL(file);
  });
}

export async function readAttachment(file) {
  if (IMAGE_TYPES.includes(file.type)) {
    if (file.size > IMAGE_BYTE_LIMIT) throw new Error(`${file.name} 超过 5 MB，请压缩后再传`);
    const dataUrl = await readAsDataUrl(file);
    return { name: file.name, kind: 'image', mime: file.type, data: dataUrl.slice(dataUrl.indexOf(',') + 1) };
  }
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  if (file.type.startsWith('text/') || TEXT_EXTENSIONS.includes(ext)) {
    const full = await file.text();
    return {
      name: file.name,
      kind: 'text',
      text: full.slice(0, TEXT_CHAR_LIMIT),
      truncated: full.length > TEXT_CHAR_LIMIT
    };
  }
  throw new Error(`${file.name} 不是支持的类型（支持文本文件和 PNG / JPG / WebP / GIF 图片）`);
}

export function toApiMessage(message) {
  const role = message.role === 'user' ? 'user' : 'assistant';
  const attachments = message.attachments || [];
  if (attachments.length === 0) return { role, content: message.content };

  let content = message.content;
  const images = [];
  for (const a of attachments) {
    if (a.kind === 'image' && a.data) {
      images.push({ mime: a.mime, data: a.data });
    } else if (a.kind === 'text' && typeof a.text === 'string') {
      content += `\n\n【附件：${a.name}${a.truncated ? '（过长，只截取了开头部分）' : ''}】\n${a.text}`;
    } else {
      content += `\n\n【附件：${a.name}（内容没有随历史对话保存）】`;
    }
  }
  return images.length ? { role, content, images } : { role, content };
}

export function stripAttachmentData(messages) {
  return messages.map(m => {
    const copy = JSON.parse(JSON.stringify({ ...m, attachments: undefined }));
    if (m.attachments?.length) {
      copy.attachments = m.attachments.map(a => ({ name: a.name, kind: a.kind }));
    }
    return copy;
  });
}
