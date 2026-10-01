function describeValue(raw) {
  if (raw === '{}') return { type: 'record', default: '' };
  if (raw === '[]') return { type: 'array', default: '' };
  if (/^-?\d+(\.\d+)?$/.test(raw)) return { type: 'number', default: raw };
  if (raw === 'true' || raw === 'false') return { type: 'boolean', default: raw };
  if (/^[|>][+-]?$/.test(raw)) return { type: 'string', default: '' };
  return { type: 'string', default: raw.replace(/^(['"])(.*)\1$/, '$2') };
}

export function parseInitVarPaths(text) {
  const result = [];
  if (!text || typeof text !== 'string') return result;

  const rows = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---' || /^[#<\-{\[]/.test(trimmed)) continue;
    const m = trimmed.match(/^("[^"]+"|'[^']+'|[^:：\s][^:：]*?)\s*[:：]\s*(.*)$/);
    if (!m) continue;
    rows.push({
      indent: line.replace(/\t/g, '  ').search(/\S/),
      key: m[1].replace(/^(['"])(.*)\1$/, '$2').trim(),
      val: m[2].trim()
    });
  }

  const parents = [];
  rows.forEach((row, i) => {
    while (parents.length && parents[parents.length - 1].indent >= row.indent) parents.pop();
    const next = rows[i + 1];
    if (row.val === '' && next && next.indent > row.indent) {
      parents.push(row);
      return;
    }
    const keys = [...parents.map(p => p.key), row.key];
    result.push({
      group: keys[0],
      field: keys.slice(1).join('.'),
      ...describeValue(row.val)
    });
  });

  return result;
}
