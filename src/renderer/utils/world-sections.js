// 分隔栏保存在世界书扩展中，编辑器内不把开始/结束标记当作正文条目。
export function isWorldSection(section) {
  return section && typeof section.id === 'string' && section.id.length > 0
    && typeof section.name === 'string' && section.name.trim().length > 0
    && Number.isSafeInteger(section.startOrder) && Number.isSafeInteger(section.endOrder)
    && section.startOrder <= section.endOrder && Number.isSafeInteger(section.sortOrder);
}

export function sortedWorldSections(book) {
  const sections = book?.extensions?.cfSections;
  return Array.isArray(sections)
    ? sections.filter(isWorldSection).slice().sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
}

// 每个分隔栏默认预留 1000 个酒馆顺序，既能直观看出栏位区间，也允许大多数世界书在栏内逐条排序。
export const WORLD_SECTION_RANGE_SIZE = 1000;

export function reflowWorldSectionRanges(sections, entryCounts = []) {
  let nextStart = 1;
  return sections.map((section, index) => {
    const count = Math.max(0, Number(entryCounts[index]) || 0);
    const size = Math.max(WORLD_SECTION_RANGE_SIZE, count);
    const startOrder = nextStart;
    const endOrder = startOrder + size - 1;
    nextStart = endOrder + 1;
    return { ...section, startOrder, endOrder, sortOrder: index + 1 };
  });
}

export function sectionForEntry(entry, sections) {
  const order = entry.insertion_order;
  if (order === '' || order == null || !Number.isFinite(Number(order))) return null;
  return sections.find(section => Number(order) >= section.startOrder && Number(order) <= section.endOrder) || null;
}

export function groupWorldEntries(entries, sections) {
  const groups = sections.map(section => ({ section, entries: [] }));
  const byId = new Map(groups.map(group => [group.section.id, group]));
  const ungrouped = { section: null, entries: [] };
  for (const entry of entries) {
    const section = sectionForEntry(entry, sections);
    (section ? byId.get(section.id) : ungrouped).entries.push(entry);
  }
  return [...groups, ungrouped];
}

// 以 CardForge 的分隔栏顺序为准，重新划分每栏的酒馆顺序区间。
// 分隔栏内条目保留相对顺序；未分组条目统一移动到所有分隔栏之后，避免落入新的范围。
export function reflowWorldBookSections(book, sectionOrderIds = []) {
  if (!book || !Array.isArray(book.entries)) return [];
  const currentSections = sortedWorldSections(book);
  const byId = new Map(currentSections.map(section => [section.id, section]));
  const requestedIds = Array.isArray(sectionOrderIds) ? [...new Set(sectionOrderIds.map(String))] : [];
  const orderedSections = [
    ...requestedIds.map(id => byId.get(id)).filter(Boolean),
    ...currentSections.filter(section => !requestedIds.includes(section.id))
  ];
  const entries = book.entries.slice().sort((a, b) =>
    (a.extensions?.cfSortKey ?? 0) - (b.extensions?.cfSortKey ?? 0));
  const grouped = groupWorldEntries(entries, currentSections);
  const entriesBySectionId = new Map(grouped.filter(group => group.section)
    .map(group => [group.section.id, group.entries]));
  const ungrouped = grouped.find(group => !group.section)?.entries || [];
  const sections = reflowWorldSectionRanges(orderedSections,
    orderedSections.map(section => entriesBySectionId.get(section.id)?.length || 0));

  const orderedEntries = [];
  sections.forEach(section => {
    const sectionEntries = entriesBySectionId.get(section.id) || [];
    sectionEntries.forEach((entry, index) => {
      entry.insertion_order = section.startOrder + index;
      orderedEntries.push(entry);
    });
  });
  const ungroupedStart = sections.length ? sections[sections.length - 1].endOrder + 1 : 1;
  ungrouped.forEach((entry, index) => {
    entry.insertion_order = ungroupedStart + index;
    orderedEntries.push(entry);
  });
  orderedEntries.forEach((entry, index) => {
    entry.extensions ||= {};
    entry.extensions.cfSortKey = index + 1;
  });

  book.extensions ||= {};
  book.extensions.cfSections = sections;
  book.entries.splice(0, book.entries.length, ...orderedEntries);
  return sections;
}

// 仅处理 CardForge 自己生成的标记，不根据“开始/结束”名称猜测或删除用户条目。
export function restoreWorldSections(book) {
  if (!book || !Array.isArray(book.entries)) return;
  const sections = sortedWorldSections(book);
  const byId = new Map(sections.map(section => [section.id, section]));
  book.entries = book.entries.filter(entry => {
    const marker = entry.extensions?.cfSectionMarker;
    if (marker?.version !== 1 || !['start', 'end'].includes(marker.edge) || !isWorldSection(marker.section)) return true;
    if (!byId.has(marker.section.id)) byId.set(marker.section.id, marker.section);
    // 若在酒馆给标记写了正文，保留为普通条目，避免丢失用户内容。
    if (String(entry.content || '').trim()) {
      delete entry.extensions.cfSectionMarker;
      return true;
    }
    return false;
  });
  if (byId.size) {
    book.extensions ||= {};
    book.extensions.cfSections = [...byId.values()];
  }
}

// 调用方传入导出副本；不要把标记写回正在编辑的角色卡。
export function exportWorldSections(book, createEntry) {
  const sections = sortedWorldSections(book);
  if (!sections.length) return;
  const entries = book.entries || [];
  const usedIds = new Set(entries.map(entry => String(entry.id)));
  let nextId = 0;
  function marker(section, edge) {
    while (usedIds.has(String(nextId))) nextId++;
    const entry = createEntry(nextId++);
    entry.comment = edge === 'start' ? `↓↓ 开始 ${section.name} ↓↓` : `↑↑ 结束 ${section.name} ↑↑`;
    entry.insertion_order = edge === 'start' ? section.startOrder : section.endOrder;
    entry.enabled = false;
    entry.extensions.cfSectionMarker = { version: 1, edge, section: { ...section } };
    return entry;
  }
  const ordered = entries.slice().sort((a, b) => (a.extensions?.cfSortKey ?? 0) - (b.extensions?.cfSortKey ?? 0));
  book.entries = groupWorldEntries(ordered, sections).flatMap(group => group.section
    ? [marker(group.section, 'start'), ...group.entries, marker(group.section, 'end')]
    : group.entries);
  // display_index 控制酒馆的自定义列表顺序；insertion_order 保留用户设定，允许重复。
  book.entries.forEach((entry, index) => {
    entry.extensions ||= {};
    entry.extensions.display_index = index;
  });
}
