import { defineStore } from 'pinia';
import { ref, computed, watch, onScopeDispose } from 'vue';
import { restoreWorldSections, exportWorldSections } from '../utils/world-sections.js';

// Default empty card structure (V2 spec)
function createEmptyCard() {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: '',
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      tags: [],
      creator: '',
      character_version: '1.0',
      alternate_greetings: [],
      extensions: {
        talkativeness: '0.5',
        fav: false,
        world: '',
        depth_prompt: { prompt: '', depth: 4, role: 'system' },
        regex_scripts: [],
        tavern_helper: { scripts: [], variables: {} }
      },
      group_only_greetings: [],
      character_book: {
        name: '',
        entries: []
      }
    }
  };
}

function createEmptyWorldEntry(id = 0) {
  return {
    id,
    keys: [],
    secondary_keys: [],
    comment: '',
    content: '',
    constant: false,
    selective: false,
    insertion_order: 100,
    enabled: true,
    position: 'before_char',
    use_regex: false,
    extensions: {
      position: 0,
      exclude_recursion: false,
      display_index: id,
      probability: 100,
      useProbability: true,
      depth: 4,
      selectiveLogic: 0,
      group: '',
      group_override: false,
      group_weight: 100,
      prevent_recursion: false,
      delay_until_recursion: false,
      scan_depth: null,
      match_whole_words: null,
      use_group_scoring: false,
      case_sensitive: null,
      automation_id: '',
      role: 0,
      vectorized: false,
      sticky: null,
      cooldown: null,
      delay: null,
      match_persona_description: false,
      match_character_description: false,
      match_character_personality: false,
      match_character_depth_prompt: false,
      match_scenario: false,
      match_creator_notes: false,
      triggers: [],
      ignore_budget: false
    }
  };
}

function createEmptyRegexScript() {
  return {
    id: crypto.randomUUID(),
    scriptName: '新正则脚本',
    findRegex: '',
    replaceString: '',
    trimStrings: [],
    placement: [2],
    disabled: false,
    markdownOnly: false,
    promptOnly: false,
    runOnEdit: true,
    substituteRegex: 0,
    minDepth: null,
    maxDepth: null
  };
}

function createEmptyTavernScript() {
  return {
    type: 'script',
    enabled: true,
    name: '新脚本',
    id: crypto.randomUUID(),
    content: '',
    info: '',
    button: { enabled: false, buttons: [] },
    data: {}
  };
}

export const useCardStore = defineStore('card', () => {
  // State
  const card = ref(createEmptyCard());
  const filePath = ref(null);
  const coverImagePath = ref(null);
  const coverImageBase64 = ref(null);
  const isDirty = ref(false);
  const lastSaved = ref(null);
  const autosaveState = ref('loading');
  const autosaveError = ref('');
  const autosaveWarning = ref('');
  const autosaveSeconds = ref(0);
  const lastAutosaved = ref(null);
  const autosaveInterval = ref(10);
  try {
    const interval = Number(localStorage.getItem('cf_autosave_interval'));
    if (Number.isInteger(interval) && interval >= 5 && interval <= 600) autosaveInterval.value = interval;
  } catch {}
  const draftSession = crypto.randomUUID();
  let draftId = crypto.randomUUID();
  let draftRevision = 0;
  let savedRevision = 0;
  let autosaveReady = false;
  let restoringDraft = false;
  let autosaveTimer = null;
  let saving = null;
  let initialization = null;

  function stopCountdown() {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
    autosaveSeconds.value = 0;
  }

  function scheduleAutosave() {
    if (!autosaveReady || autosaveTimer || saving) return;
    const deadline = Date.now() + autosaveInterval.value * 1000;
    autosaveSeconds.value = autosaveInterval.value;
    if (!autosaveError.value) autosaveState.value = 'pending';
    autosaveTimer = setInterval(() => {
      autosaveSeconds.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (!autosaveSeconds.value) {
        stopCountdown();
        saveDraftNow();
      }
    }, 250);
  }

  function makeSnapshot() {
    return JSON.parse(JSON.stringify({ version: 1, id: draftId, session: draftSession,
      revision: draftRevision, card: card.value, filePath: filePath.value,
      coverImagePath: coverImagePath.value, coverImageBase64: coverImageBase64.value,
      isDirty: isDirty.value }));
  }

  function setAutosaveInterval(seconds) {
    if (!Number.isInteger(seconds) || seconds < 5 || seconds > 600) throw new Error('请输入 5～600 之间的整数秒数');
    localStorage.setItem('cf_autosave_interval', String(seconds));
    autosaveInterval.value = seconds;
    stopCountdown();
    if (draftRevision !== savedRevision || autosaveError.value) scheduleAutosave();
  }

  function saved(result, revision, id) {
    if (id !== draftId || revision < savedRevision) return;
    if (!result?.success) throw new Error(result?.error || '自动保存未成功');
    savedRevision = revision;
    lastAutosaved.value = result.savedAt;
    autosaveError.value = '';
    autosaveWarning.value = '';
    autosaveState.value = draftRevision === savedRevision ? 'saved' : 'pending';
  }

  function failed(error) {
    autosaveState.value = 'error';
    autosaveError.value = error.message || String(error);
  }

  async function saveDraftNow() {
    if (!autosaveReady) return;
    if (saving) return saving;
    stopCountdown();
    autosaveState.value = 'saving';
    const revision = draftRevision;
    const id = draftId;
    saving = (async () => {
      try {
        const result = await window.cardForgeAPI.saveCardDraft(makeSnapshot());
        saved(result, revision, id);
      } catch (error) { if (id === draftId && revision >= savedRevision) failed(error); }
    })();
    await saving;
    saving = null;
    if (draftRevision !== savedRevision || autosaveError.value) scheduleAutosave();
  }

  function flushDraft() {
    if (!autosaveReady || (draftRevision === savedRevision && !autosaveError.value)) return true;
    stopCountdown();
    try {
      saved(window.cardForgeAPI.saveCardDraftSync(makeSnapshot()), draftRevision, draftId);
      return true;
    } catch (error) {
      failed(error);
      scheduleAutosave();
      return false;
    }
  }

  function preserveCurrentDraft() {
    if (!restoringDraft && !flushDraft()) throw new Error('当前草稿保存失败，请点击标题栏重试后再切换角色卡');
  }

  function initializeAutosave() {
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        const result = await window.cardForgeAPI.loadCardDraft();
        if (!result?.success) throw new Error(result?.error || '草稿读取失败');
        if (result.draft) {
          const draft = result.draft;
          restoringDraft = true;
          loadFromJson(draft.card);
          draftId = draft.id;
          filePath.value = draft.filePath || null;
          coverImagePath.value = draft.coverImagePath || null;
          coverImageBase64.value = draft.coverImageBase64 || null;
          isDirty.value = draft.isDirty !== false;
          lastAutosaved.value = draft.savedAt || null;
          autosaveWarning.value = result.warning || '';
          autosaveState.value = 'saved';
        } else autosaveState.value = 'idle';
      } catch (error) { failed(error); }
      finally { restoringDraft = false; autosaveReady = true; }
    })();
    return initialization;
  }

  watch([card, filePath, coverImagePath, coverImageBase64, isDirty], () => {
    if (!autosaveReady || restoringDraft) return;
    draftRevision++;
    scheduleAutosave();
  }, { deep: true, flush: 'sync' });

  function onBeforeUnload(event) {
    if (!flushDraft()) {
      event.preventDefault();
      event.returnValue = false;
    }
  }
  window.addEventListener('beforeunload', onBeforeUnload);
  onScopeDispose(() => {
    stopCountdown();
    window.removeEventListener('beforeunload', onBeforeUnload);
  });

  // Getters
  const cardData = computed(() => card.value.data);
  const worldEntries = computed(() => card.value.data.character_book?.entries || []);
  const regexScripts = computed(() => card.value.data.extensions?.regex_scripts || []);

  const tavernScripts = computed(() => {
    const th = card.value.data.extensions?.tavern_helper;
    if (!th) return [];
    let scripts;
    // Handle both dict and list-of-pairs formats
    if (Array.isArray(th)) {
      const scriptsEntry = th.find(e => e[0] === 'scripts');
      scripts = scriptsEntry ? scriptsEntry[1] : [];
    } else {
      scripts = th.scripts || [];
    }
    // Ensure every script has a valid button object
    for (const s of scripts) {
      if (!s.button) s.button = { enabled: false, buttons: [] };
      if (!Array.isArray(s.button.buttons)) s.button.buttons = [];
    }
    return scripts;
  });

  const cardName = computed(() => card.value.data.name || '未命名角色');

  const stats = computed(() => {
    const entries = worldEntries.value;
    const enabledEntries = entries.filter(e => e.enabled);
    const constantEntries = entries.filter(e => e.constant && e.enabled);
    const totalContentLength = entries.reduce((sum, e) => sum + (e.content?.length || 0), 0);
    const estimatedTokens = Math.round(totalContentLength * 1.3); // rough Chinese token estimate

    return {
      totalEntries: entries.length,
      enabledEntries: enabledEntries.length,
      constantEntries: constantEntries.length,
      disabledEntries: entries.length - enabledEntries.length,
      regexCount: regexScripts.value.length,
      scriptCount: tavernScripts.value.length,
      alternateGreetings: card.value.data.alternate_greetings?.length || 0,
      estimatedTokens,
      totalContentChars: totalContentLength
    };
  });

  // Actions
  function newCard() {
    preserveCurrentDraft();
    draftId = crypto.randomUUID();
    lastAutosaved.value = null;
    card.value = createEmptyCard();
    filePath.value = null;
    coverImagePath.value = null;
    coverImageBase64.value = null;
    isDirty.value = false;
  }

  function loadFromJson(json) {
    preserveCurrentDraft();
    if (!restoringDraft) {
      draftId = crypto.randomUUID();
      lastAutosaved.value = null;
    }
    // Handle both top-level and data-nested formats
    if (json.data) {
      card.value = json;
    } else if (json.name && json.first_mes) {
      // Legacy V1 or flat format
      card.value = { spec: 'chara_card_v2', spec_version: '2.0', data: json };
    }

    // Ensure extensions exist
    if (!card.value.data.extensions) {
      card.value.data.extensions = {};
    }
    if (!card.value.data.extensions.regex_scripts) {
      card.value.data.extensions.regex_scripts = [];
    }
    if (!card.value.data.extensions.tavern_helper) {
      card.value.data.extensions.tavern_helper = { scripts: [], variables: {} };
    }
    if (!card.value.data.character_book) {
      card.value.data.character_book = { name: '', entries: [] };
    }

    restoreWorldSections(card.value.data.character_book);

    // 给所有条目补充 cfSortKey（CardForge 内部显示排序，独立于 insertion_order 和 ST 的 display_index）
    const entries = card.value.data.character_book.entries || [];
    let nextKey = 1;
    // 先收集已有的 cfSortKey
    const usedKeys = new Set();
    for (const e of entries) {
      if (!e.extensions) e.extensions = {};
      if (typeof e.extensions.cfSortKey === 'number') {
        usedKeys.add(e.extensions.cfSortKey);
      }
    }
    // 给没有的条目按数组顺序分配
    for (const e of entries) {
      if (typeof e.extensions.cfSortKey !== 'number') {
        while (usedKeys.has(nextKey)) nextKey++;
        e.extensions.cfSortKey = nextKey;
        usedKeys.add(nextKey);
        nextKey++;
      }
    }
    if (!card.value.data.alternate_greetings) {
      card.value.data.alternate_greetings = [];
    }
    if (!card.value.data.extensions.depth_prompt) {
      card.value.data.extensions.depth_prompt = { prompt: '', depth: 4, role: 'system' };
    }

    // Normalize tavern_helper from list-of-pairs to dict
    const th = card.value.data.extensions.tavern_helper;
    if (Array.isArray(th)) {
      const obj = {};
      for (const [key, val] of th) {
        obj[key] = val;
      }
      card.value.data.extensions.tavern_helper = obj;
    }

    isDirty.value = false;
  }

  function exportJson() {
    // Build export with both top-level legacy fields and data block
    const d = card.value.data;
    const obj = {
      name: d.name,
      description: d.description,
      personality: d.personality,
      scenario: d.scenario,
      first_mes: d.first_mes,
      mes_example: d.mes_example,
      creatorcomment: d.creator_notes,
      avatar: 'none',
      talkativeness: d.extensions?.talkativeness || '0.5',
      fav: d.extensions?.fav || false,
      tags: d.tags || [],
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: d,
      create_date: new Date().toISOString()
    };
    // 深度克隆为纯对象，去掉 Vue reactive proxy（避免 IPC structured clone 失败）
    const exported = JSON.parse(JSON.stringify(obj));
    exportWorldSections(exported.data.character_book, createEmptyWorldEntry);
    return exported;
  }

  function markDirty() {
    isDirty.value = true;
  }

  // World book operations
  let _nextEntryId = 0;

  function addWorldEntry(entry = null) {
    const entries = card.value.data.character_book.entries;
    const maxId = entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 0;
    if (maxId > _nextEntryId) _nextEntryId = maxId;
    else _nextEntryId++;
    const newEntry = entry || createEmptyWorldEntry(_nextEntryId);
    newEntry.id = _nextEntryId;
    if (!newEntry.extensions) newEntry.extensions = {};
    // cfSortKey 取当前最大值 + 1，新建的排在最后
    const maxKey = entries.length > 0
      ? Math.max(0, ...entries.map(e => e.extensions?.cfSortKey ?? 0))
      : 0;
    newEntry.extensions.cfSortKey = maxKey + 1;
    entries.push(newEntry);
    isDirty.value = true;
    return newEntry;
  }

  function removeWorldEntry(id) {
    const entries = card.value.data.character_book.entries;
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) {
      entries.splice(idx, 1);
      isDirty.value = true;
    }
  }

  function duplicateWorldEntry(id) {
    const entries = card.value.data.character_book.entries;
    const source = entries.find(e => e.id === id);
    if (source) {
      const clone = JSON.parse(JSON.stringify(source));
      clone.comment = (clone.comment || '') + ' (副本)';
      addWorldEntry(clone);
    }
  }

  // Regex operations
  function addRegexScript(script = null) {
    const scripts = card.value.data.extensions.regex_scripts;
    scripts.push(script || createEmptyRegexScript());
    isDirty.value = true;
  }

  function removeRegexScript(id) {
    const scripts = card.value.data.extensions.regex_scripts;
    const idx = scripts.findIndex(s => s.id === id);
    if (idx !== -1) {
      scripts.splice(idx, 1);
      isDirty.value = true;
    }
  }

  function reorderRegexScript(fromId, toId) {
    const scripts = card.value.data.extensions.regex_scripts;
    const fromIdx = scripts.findIndex(s => s.id === fromId);
    const toIdx = scripts.findIndex(s => s.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const [item] = scripts.splice(fromIdx, 1);
    scripts.splice(toIdx, 0, item);
    isDirty.value = true;
  }

  // Tavern script operations
  function addTavernScript(script = null) {
    const th = card.value.data.extensions.tavern_helper;
    if (!th.scripts) th.scripts = [];
    th.scripts.push(script || createEmptyTavernScript());
    isDirty.value = true;
  }

  function removeTavernScript(id) {
    const th = card.value.data.extensions.tavern_helper;
    if (!th.scripts) return;
    const idx = th.scripts.findIndex(s => s.id === id);
    if (idx !== -1) {
      th.scripts.splice(idx, 1);
      isDirty.value = true;
    }
  }

  // Alternate greetings
  function addGreeting(text = '') {
    card.value.data.alternate_greetings.push(text);
    isDirty.value = true;
  }

  function removeGreeting(index) {
    card.value.data.alternate_greetings.splice(index, 1);
    isDirty.value = true;
  }

  return {
    card, filePath, coverImagePath, coverImageBase64, isDirty, lastSaved,
    autosaveState, autosaveError, autosaveWarning, autosaveSeconds, lastAutosaved,
    initializeAutosave, saveDraftNow,
    autosaveInterval, setAutosaveInterval,
    cardData, worldEntries, regexScripts, tavernScripts, cardName, stats,
    newCard, loadFromJson, exportJson, markDirty,
    addWorldEntry, removeWorldEntry, duplicateWorldEntry,
    addRegexScript, removeRegexScript, reorderRegexScript,
    addTavernScript, removeTavernScript,
    addGreeting, removeGreeting,
    createEmptyWorldEntry, createEmptyRegexScript, createEmptyTavernScript
  };
});
