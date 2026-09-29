import { restoreWorldSections } from './world-sections.js';

export const clone = value => JSON.parse(JSON.stringify(value));

// Native SillyTavern field, character-book extension, default. Mirrors convertCharacterBook.
const fields = [
  ['position', 'position', 0], ['displayIndex', 'display_index', 0],
  ['excludeRecursion', 'exclude_recursion', false], ['preventRecursion', 'prevent_recursion', false],
  ['delayUntilRecursion', 'delay_until_recursion', false], ['probability', 'probability', 100],
  ['useProbability', 'useProbability', true], ['depth', 'depth', 4], ['selectiveLogic', 'selectiveLogic', 0],
  ['outletName', 'outlet_name', ''], ['group', 'group', ''], ['groupOverride', 'group_override', false],
  ['groupWeight', 'group_weight', 100], ['scanDepth', 'scan_depth', null],
  ['caseSensitive', 'case_sensitive', null], ['matchWholeWords', 'match_whole_words', null],
  ['useGroupScoring', 'use_group_scoring', null], ['automationId', 'automation_id', ''],
  ['role', 'role', 0], ['vectorized', 'vectorized', false], ['sticky', 'sticky', null],
  ['cooldown', 'cooldown', null], ['delay', 'delay', null],
  ['matchPersonaDescription', 'match_persona_description', false],
  ['matchCharacterDescription', 'match_character_description', false],
  ['matchCharacterPersonality', 'match_character_personality', false],
  ['matchCharacterDepthPrompt', 'match_character_depth_prompt', false],
  ['matchScenario', 'match_scenario', false], ['matchCreatorNotes', 'match_creator_notes', false],
  ['triggers', 'triggers', []], ['ignoreBudget', 'ignore_budget', false]
];
const entryKeys = new Set(['uid', 'key', 'keysecondary', 'comment', 'content', 'constant', 'selective',
  'order', 'disable', 'addMemo', 'use_regex', 'extensions', ...fields.map(([key]) => key)]);

function assignIds(entries, key) {
  const used = new Set();
  const reserved = new Set(entries.map(entry => entry[key]).filter(id => Number.isSafeInteger(id) && id >= 0));
  let next = 0;
  return entries.map(entry => {
    let id = entry[key];
    if (!Number.isSafeInteger(id) || id < 0 || used.has(id)) {
      while (reserved.has(next) || used.has(next)) next++;
      id = next++;
    }
    used.add(id);
    return id;
  });
}

export function fromTavernWorld(raw, name) {
  if (!raw?.entries || typeof raw.entries !== 'object') throw new Error('酒馆世界书缺少有效的 entries');
  const source = Object.values(raw.entries);
  if (source.some(entry => !entry || typeof entry !== 'object')) throw new Error('世界书存在无效条目，已停止载入');
  source.sort((a, b) => (a.displayIndex ?? a.uid ?? 0) - (b.displayIndex ?? b.uid ?? 0));
  const ids = assignIds(source, 'uid');
  const original = raw.originalData || {};
  const book = { ...clone(original), name, entries: source.map((entry, index) => {
    const extensions = { ...clone(entry.extensions || {}) };
    for (const [native, key, fallback] of fields) {
      extensions[key] = clone(Object.hasOwn(entry, native) ? entry[native] : (extensions[key] ?? fallback));
    }
    extensions.display_index = entry.displayIndex ?? index;
    extensions.cfSortKey = index + 1;
    // Preserve native plugin fields without letting stale values override edited fields on export.
    extensions.cfTavernOriginal = Object.fromEntries(Object.entries(entry).filter(([key]) => !entryKeys.has(key)));
    return {
      id: ids[index], keys: clone(entry.key || []), secondary_keys: clone(entry.keysecondary || []),
      comment: entry.comment || '', content: entry.content || '', constant: !!entry.constant,
      selective: !!entry.selective, insertion_order: entry.order ?? 100, enabled: !entry.disable,
      position: extensions.position === 0 ? 'before_char' : 'after_char', use_regex: !!entry.use_regex, extensions
    };
  }) };
  restoreWorldSections(book);
  return book;
}

// Call with store.exportJson().data.character_book so section markers are included.
export function toTavernWorld(book, target) {
  const originalData = clone(book);
  const ids = assignIds(originalData.entries || [], 'id');
  const entries = {};
  (originalData.entries || []).forEach((entry, index) => {
    entry.id = ids[index];
    const ext = entry.extensions || {};
    const extensions = clone(ext);
    delete extensions.cfTavernOriginal;
    const native = {
      ...clone(ext.cfTavernOriginal || {}), uid: entry.id,
      key: entry.keys || [], keysecondary: entry.secondary_keys || [], comment: entry.comment || '',
      content: entry.content || '', constant: !!entry.constant, selective: !!entry.selective,
      order: entry.insertion_order ?? 100, disable: entry.enabled === false, addMemo: !!entry.comment,
      use_regex: !!entry.use_regex, extensions
    };
    for (const [key, extension, fallback] of fields) native[key] = clone(ext[extension] ?? fallback);
    native.position = ext.position ?? (entry.position === 'after_char' ? 1 : 0);
    native.displayIndex = ext.display_index ?? index;
    entries[entry.id] = native;
  });
  return { ...clone(target), entries, originalData };
}

export function characterPatch(exported, avatar, { embedded, scripts }) {
  const source = exported.data;
  const data = {};
  for (const key of ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example',
    'creator_notes', 'system_prompt', 'post_history_instructions', 'tags', 'creator',
    'character_version', 'alternate_greetings', 'group_only_greetings']) {
    if (source[key] !== undefined) data[key] = clone(source[key]);
  }
  data.extensions = { depth_prompt: clone(source.extensions?.depth_prompt || { prompt: '', depth: 4, role: 'system' }) };
  if (embedded) {
    data.character_book = clone(source.character_book || { entries: [] });
    data.character_book.extensions ||= {};
    data.character_book.extensions.cfSections ||= [];
  }
  if (scripts) {
    data.extensions.regex_scripts = clone(source.extensions?.regex_scripts || []);
    data.extensions.tavern_helper = clone(source.extensions?.tavern_helper || { scripts: [], variables: {} });
  }
  // Preserve the target avatar, chat filename, favourite and linked standalone world.
  return { avatar, data, name: data.name, description: data.description, personality: data.personality,
    scenario: data.scenario, first_mes: data.first_mes, mes_example: data.mes_example,
    creatorcomment: data.creator_notes, tags: data.tags };
}

export function sameData(a, b) {
  const stable = value => Array.isArray(value) ? value.map(stable)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

// Merge-attributes retains target-only object keys; arrays must be replaced exactly.
export function containsData(actual, expected) {
  if (!expected || typeof expected !== 'object' || Array.isArray(expected)) return sameData(actual, expected);
  return !!actual && typeof actual === 'object'
    && Object.keys(expected).every(key => containsData(actual[key], expected[key]));
}
