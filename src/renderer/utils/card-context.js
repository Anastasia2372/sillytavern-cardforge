import { normalizeContextLimits } from './world-context-settings.js';

/**
 * 构建当前角色卡的上下文摘要，供 AI 生成功能使用
 * 所有 AI 功能调用前都应该附带这个上下文
 *
 * @param {*} cardStore - 角色卡 store
 * @param {string} [matchText] - 可选。传入文本后，绿灯条目按主 keys 关键词匹配
 *   (命中的才塞)；不传则按前 20 条无脑塞（旧逻辑，保持向后兼容）
 * @param {object} [contextLimits] - 世界书总预算与不同模式的单条正文上限
 */
export function buildCardContext(cardStore, matchText = '', contextLimits) {
  const d = cardStore.cardData;
  const entries = cardStore.worldEntries;
  const regexScripts = cardStore.regexScripts;
  const scripts = cardStore.tavernScripts;

  const useMatch = typeof matchText === 'string' && matchText.trim().length > 0;
  const limits = normalizeContextLimits(contextLimits);
  const MAX_TOTAL_CHARS = limits.totalChars;
  const PER_ENTRY_CHARS = useMatch ? limits.matchedEntryChars : limits.summaryConstantChars;

  const lines = [];

  if (d.extensions?.cfCreativeBrief) lines.push(`创作约定（保持一致）：\n${d.extensions.cfCreativeBrief}`);
  if (d.extensions?.cfStrictWording) lines.push(`严格用词设定（优先遵守）：\n${d.extensions.cfStrictWording}`);

  if (d.name) lines.push(`角色名：${d.name}`);
  if (d.personality) lines.push(`性格：${d.personality}`);
  if (d.scenario) lines.push(`场景设定：${d.scenario}`);
  if (d.description) lines.push(`角色描述（前500字）：${d.description.slice(0, 500)}`);
  if (d.first_mes) lines.push(`开场白（前1000字）：${d.first_mes.slice(0, 1000)}`);

  if (entries.length > 0) {
    const enabled = entries.filter(e => e.enabled);
    const constant = enabled.filter(e => e.constant);
    const triggered = enabled.filter(e => !e.constant);

    lines.push(`\n========== 世界书内容（${entries.length} 条，启用 ${enabled.length}）==========`);

    let worldBudget = MAX_TOTAL_CHARS;

    function appendEntries(items, perEntryChars) {
      let written = 0;
      for (const entry of items) {
        if (worldBudget <= 1) break;
        const content = entry.content || '';
        const block = `【${entry.comment || '(未命名)'}】 keys:[${(entry.keys || []).join(',')}]\n${content.slice(0, perEntryChars)}${content.length > perEntryChars ? '...' : ''}`;
        // 名称、关键词和换行也占用参考预算，最后一条只能使用剩余额度。
        const available = worldBudget - 1;
        const clipped = block.length <= available ? block
          : available >= 3 ? block.slice(0, available - 3) + '...' : block.slice(0, available);
        lines.push(clipped);
        worldBudget -= clipped.length + 1;
        written++;
        if (block.length > available) {
          lines.push('...本条参考内容已按剩余总预算截取');
          break;
        }
      }
      if (written < items.length) {
        lines.push(`...参考条目总预算 ${MAX_TOTAL_CHARS} 字符已用完，剩余 ${items.length - written} 条未展示`);
      }
    }

    if (constant.length > 0) {
      lines.push(`\n--- 常驻设定（${constant.length} 条，蓝灯）---`);
      appendEntries(constant, PER_ENTRY_CHARS);
    }

    if (triggered.length > 0) {
      if (useMatch) {
        const matchLower = matchText.toLowerCase();
        const matched = triggered.filter(e => {
          const keys = e.keys || [];
          return keys.some(k => k && matchLower.includes(String(k).toLowerCase()));
        });
        if (matched.length > 0) {
          lines.push(`\n--- 关键词触发（${matched.length} 条命中 / ${triggered.length} 条绿灯）---`);
          appendEntries(matched, PER_ENTRY_CHARS);
        } else {
          lines.push(`\n--- 关键词触发：${triggered.length} 条绿灯均未命中当前输入的关键词 ---`);
        }
      } else {
        const showCount = Math.min(20, triggered.length);
        lines.push(`\n--- 关键词触发（${triggered.length} 条，展示前 ${showCount}）---`);
        appendEntries(triggered.slice(0, showCount), limits.summaryTriggeredChars);
        if (triggered.length > showCount) {
          lines.push(`...还有 ${triggered.length - showCount} 条触发条目未展示`);
        }
      }
    }
  }

  if (regexScripts.length > 0) {
    lines.push(`\n已有正则脚本：${regexScripts.length} 个`);
    regexScripts.slice(0, 5).forEach(r => {
      lines.push(`- ${r.scriptName} [${r.markdownOnly ? 'markdownOnly' : r.promptOnly ? 'promptOnly' : '双层'}]`);
    });
  }

  if (scripts.length > 0) {
    lines.push(`\n已有酒馆助手脚本：${scripts.length} 个`);
    scripts.slice(0, 5).forEach(s => {
      lines.push(`- ${s.name} [${s.enabled ? '启用' : '禁用'}]`);
    });
  }

  return lines.join('\n');
}
