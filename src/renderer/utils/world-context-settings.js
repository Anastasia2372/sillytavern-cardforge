export const WORLD_CONTEXT_FIELDS = [
  { key: 'totalChars', label: '参考条目总预算（字符）', defaultValue: 12000 },
  { key: 'matchedEntryChars', label: '关键词匹配时，单条正文上限（字符）', defaultValue: 1000 },
  { key: 'summaryConstantChars', label: '常驻条目正文上限（字符）', defaultValue: 400, advanced: true },
  { key: 'summaryTriggeredChars', label: '触发条目正文上限（字符）', defaultValue: 150, advanced: true }
];

export const MAX_CONTEXT_CHARS = 1000000;

export function validContextLimit(value) {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_CONTEXT_CHARS;
}

export function normalizeContextLimits(saved = {}) {
  return Object.fromEntries(WORLD_CONTEXT_FIELDS.map(field => [field.key,
    validContextLimit(saved?.[field.key]) ? saved[field.key] : field.defaultValue]));
}
