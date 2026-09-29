<template>
  <div class="page tavern-link-page">
    <div class="page__header"><h1>酒馆 Link</h1><p>直接连接 SillyTavern，将当前卡的修改保存到酒馆。</p></div>
    <div class="card mb-md">
      <div class="card__header flex-between"><h3>连接设置</h3><span class="badge" :class="connected ? 'badge--success' : 'badge--info'">{{ connected ? '已连接' : '未连接' }}</span></div>
      <div class="card__body">
        <div class="connection-row">
          <label for="tavern-url">酒馆地址</label>
          <input id="tavern-url" v-model.trim="baseUrl" class="input" :disabled="locked" placeholder="http://127.0.0.1:8000" @keyup.enter="connect" />
          <button class="btn btn--primary" :disabled="locked || !supported" @click="connect">{{ busy ? '处理中…' : '连接 / 刷新' }}</button>
        </div>
        <p class="hint mt-md">先启动 E:\SillyTavern 中的酒馆。本功能使用运行中的酒馆服务；当前支持免登录连接。</p>
        <p v-if="!supported" class="error">酒馆 Link 需要桌面版，请用 BAT 重启桌面应用后使用。</p>
        <p v-else-if="installExists" class="hint">已找到 E:\SillyTavern</p>
        <p v-else class="hint">未找到默认目录，可填写其他酒馆服务地址</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="status" class="status" role="status">{{ status }}</p>
      </div>
    </div>

    <div v-if="connected" class="link-grid">
      <section class="card">
        <div class="card__header"><h3>角色设定</h3></div>
        <div class="card__body">
          <label for="tavern-character">目标角色（{{ characters.length }} 张）</label>
          <select id="tavern-character" v-model="selectedAvatar" class="input select" :disabled="locked" @change="selectCharacter">
            <option value="">选择酒馆已有角色卡</option>
            <option v-for="item in characters" :key="item.avatar" :value="item.avatar">{{ item.name }} · {{ item.avatar }}</option>
          </select>
          <div v-if="selectedCharacter" class="preview">
            <strong>{{ selectedCharacter.data.name }}</strong><small>{{ selectedAvatar }}</small>
            <p>{{ selectedCharacter.data.description || '没有角色描述' }}</p>
            <small>关联独立世界书：{{ selectedCharacter.data.extensions?.world || '无' }}</small>
            <button class="btn btn--secondary btn--sm" :disabled="locked || !selectedCharacter.data.extensions?.world" @click="selectLinkedWorld">读取关联世界书</button>
          </div>
          <p class="hint">同步名称、描述、性格、场景、开场白、提示词、标签、作者信息及深度提示。</p>
          <label class="option"><input v-model="embedded" type="checkbox" :disabled="locked" /> 同步角色卡内嵌世界书</label>
          <label class="option"><input v-model="scripts" type="checkbox" :disabled="locked" /> 同步正则与酒馆助手脚本</label>
          <p class="hint">头像、聊天记录和独立世界书绑定保持不变。关联世界书需在右侧单独更新。</p>
          <div class="actions">
            <button class="btn btn--secondary" :disabled="locked || !selectedCharacter" @click="prepare('import-character')">载入到当前卡</button>
            <button class="btn btn--primary" :disabled="locked || !selectedCharacter" @click="prepare('character')">更新酒馆角色</button>
          </div>
          <label class="option"><input v-model="autoCharacter" type="checkbox" :disabled="locked || !characterSynced" /> 编辑后自动同步此角色</label>
          <small class="hint">先手动更新一次再开启；包含上面勾选的内容。</small>
        </div>
      </section>
      <section class="card">
        <div class="card__header"><h3>独立世界书</h3></div>
        <div class="card__body">
          <label for="tavern-world">目标世界书（{{ worldbooks.length }} 本）</label>
          <select id="tavern-world" v-model="selectedWorldName" class="input select" :disabled="locked" @change="selectWorld">
            <option value="">选择酒馆已有世界书</option>
            <option v-for="item in worldbooks" :key="item.file_id" :value="item.file_id">{{ item.name }} · {{ item.file_id }}</option>
          </select>
          <div v-if="selectedWorldbook" class="preview">
            <strong>{{ selectedWorldName }}</strong><small>{{ Object.keys(selectedWorldbook.entries).length }} 条</small>
            <p>{{ Object.values(selectedWorldbook.entries).slice(0, 8).map(entry => entry.comment || '未命名条目').join(' · ') }}</p>
          </div>
          <p class="hint">用当前卡世界书替换目标的全部条目，包含分隔栏开始/结束标记、顺序、常驻及递归设置。未包含的原条目会移除。</p>
          <div class="actions">
            <button class="btn btn--secondary" :disabled="locked || !selectedWorldbook" @click="prepare('import-world')">载入到当前卡</button>
            <button class="btn btn--primary" :disabled="locked || !selectedWorldbook" @click="prepare('world')">更新酒馆世界书</button>
          </div>
          <label class="option"><input v-model="autoWorld" type="checkbox" :disabled="locked || !worldSynced" /> 编辑后自动同步此世界书</label>
          <small class="hint">先手动更新一次再开启；不会自动修改酒馆的全局启用设置。</small>
        </div>
      </section>
    </div>

    <div v-if="pending" class="card mt-md confirmation">
      <div class="card__header"><h3>确认{{ pending.kind.startsWith('import') ? '载入' : '写入' }}</h3></div>
      <div class="card__body">
        <p>{{ pending.message }}</p>
        <p class="hint">目标服务：{{ baseUrl }}</p>
        <div class="actions"><button class="btn btn--primary" :disabled="busy" @click="executePending">确认执行</button><button class="btn btn--secondary" :disabled="busy" @click="pending = null">取消</button></div>
      </div>
    </div>
    <div class="card mt-md">
      <div class="card__header"><h3>当前卡：{{ store.cardName }}</h3></div>
      <div class="card__body">
        <div class="summary"><span>世界书 {{ store.stats.totalEntries }} 条</span><span>正则 {{ store.stats.regexCount }} 个</span><span>脚本 {{ store.stats.scriptCount }} 个</span></div>
        <p class="hint mt-md">自动同步在停止编辑 2 秒后执行，切换当前卡、连接地址或目标时会关闭。酒馆端内容发生变化时会暂停同步。</p>
        <p class="hint">保存成功后，已打开的酒馆页面可能需要刷新或重新载入角色/世界书，才能清除页面缓存。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue';
import { useCardStore } from '../stores/card.js';
import { useAppStore } from '../stores/app.js';
import { clone, fromTavernWorld, toTavernWorld, characterPatch, sameData, containsData } from '../utils/tavern-link.js';

const store = useCardStore();
const appStore = useAppStore();
const api = window.cardForgeAPI;
const supported = !!api?.tavernRequest;
const baseUrl = ref('http://127.0.0.1:8000');
try { baseUrl.value = localStorage.getItem('cf_tavern_url') || baseUrl.value; } catch {}
const installExists = ref(false);
const connected = ref(false);
const busy = ref(false);
const error = ref('');
const status = ref('');
const characters = ref([]);
const worldbooks = ref([]);
const selectedAvatar = ref('');
const selectedCharacter = ref(null);
const selectedWorldName = ref('');
const selectedWorldbook = ref(null);
const embedded = ref(false);
const scripts = ref(false);
const autoCharacter = ref(false);
const autoWorld = ref(false);
const characterSynced = ref(false);
const worldSynced = ref(false);
const pending = ref(null);
const locked = computed(() => busy.value || !!pending.value);
let timer;
let sentCharacter = null;
let sentWorld = null;

function stopAuto() { autoCharacter.value = false; autoWorld.value = false; clearTimeout(timer); }
function resetSync() { stopAuto(); characterSynced.value = false; worldSynced.value = false; }
function fail(e) {
  stopAuto(); error.value = e.message || String(e); status.value = '';
  appStore.toastError(error.value);
}
async function run(action) {
  if (busy.value) return;
  busy.value = true; error.value = '';
  try { await action(); } catch (e) { fail(e); }
  finally { busy.value = false; scheduleAuto(); }
}
async function request(endpoint, body = {}) {
  if (!supported) throw new Error('请重启桌面应用后使用酒馆 Link');
  const result = await api.tavernRequest({ baseUrl: baseUrl.value, endpoint, body: clone(body) });
  if (!result?.success) throw new Error(result?.error || '酒馆请求失败');
  return result.data;
}
async function readCharacter() {
  const item = await request('/api/characters/get', { avatar_url: selectedAvatar.value });
  if (!item?.data || typeof item.data.name !== 'string') throw new Error('酒馆返回的角色卡格式无效');
  return item;
}
async function readWorld() {
  // /get returns an empty dummy book for missing names, so check existence first.
  const list = await request('/api/worldinfo/list');
  if (!Array.isArray(list) || !list.some(item => item.file_id === selectedWorldName.value)) throw new Error('目标世界书已被删除或重命名，请刷新列表');
  const book = await request('/api/worldinfo/get', { name: selectedWorldName.value });
  if (!book?.entries || typeof book.entries !== 'object') throw new Error('酒馆返回的世界书格式无效');
  return book;
}
function connect() {
  resetSync(); pending.value = null;
  return run(async () => {
    connected.value = false;
    selectedAvatar.value = ''; selectedCharacter.value = null;
    selectedWorldName.value = ''; selectedWorldbook.value = null;
    const chars = await request('/api/characters/all');
    const worlds = await request('/api/worldinfo/list');
    if (!Array.isArray(chars) || !Array.isArray(worlds)) throw new Error('地址没有返回酒馆角色和世界书列表');
    characters.value = chars; worldbooks.value = worlds; connected.value = true;
    try { localStorage.setItem('cf_tavern_url', baseUrl.value); } catch {}
    status.value = '已连接，请选择目标角色或世界书。';
  });
}
function selectCharacter() {
  autoCharacter.value = false; characterSynced.value = false; selectedCharacter.value = null;
  if (selectedAvatar.value) return run(async () => { selectedCharacter.value = await readCharacter(); });
}
function selectWorld() {
  autoWorld.value = false; worldSynced.value = false; selectedWorldbook.value = null;
  if (selectedWorldName.value) return run(async () => { selectedWorldbook.value = await readWorld(); });
}
function selectLinkedWorld() {
  const name = selectedCharacter.value?.data.extensions?.world;
  if (!worldbooks.value.some(item => item.file_id === name)) { fail(new Error('关联世界书不在列表中，请连接 / 刷新后重试')); return; }
  selectedWorldName.value = name; selectWorld();
}
function patchFor(exported = store.exportJson()) {
  return characterPatch(exported, selectedAvatar.value, { embedded: embedded.value, scripts: scripts.value });
}
function prepare(kind) {
  stopAuto();
  return run(async () => {
    const localCard = store.card;
    const exported = store.exportJson();
    if (kind.endsWith('character') || kind === 'character') {
      selectedCharacter.value = await readCharacter();
      if (localCard !== store.card) throw new Error('当前卡已切换，请重新选择同步内容');
      if (kind === 'character' && !exported.data.name.trim()) throw new Error('请先填写当前卡的角色名称');
      pending.value = {
        kind, localCard, payload: kind === 'character' ? patchFor(exported) : clone(selectedCharacter.value),
        message: kind === 'character'
          ? '将“' + store.cardName + '”的设定覆盖到“' + selectedAvatar.value + '”。' + (embedded.value ? '包含内嵌世界书。' : '') + (scripts.value ? '包含正则及酒馆助手脚本。' : '')
          : '用酒馆角色“' + selectedAvatar.value + '”替换当前整张编辑卡，当前封面和原文件路径将清空。'
      };
    } else {
      selectedWorldbook.value = await readWorld();
      if (localCard !== store.card) throw new Error('当前卡已切换，请重新选择同步内容');
      pending.value = {
        kind, localCard, payload: kind === 'world' ? exported.data.character_book : fromTavernWorld(selectedWorldbook.value, selectedWorldName.value),
        message: kind === 'world'
          ? '用当前卡的世界书（含分隔标记共 ' + exported.data.character_book.entries.length + ' 条）替换“' + selectedWorldName.value + '”的全部 ' + Object.keys(selectedWorldbook.value.entries).length + ' 条。'
          : '用“' + selectedWorldName.value + '”替换当前卡的整个世界书。角色设定保持不变。'
      };
    }
  });
}
async function pushCharacter(payload) {
  const localCard = store.card;
  const fresh = await readCharacter();
  if (localCard !== store.card) throw new Error('当前卡已切换，已取消本次角色同步');
  if (!sameData(fresh.data, selectedCharacter.value.data)) throw new Error('酒馆角色已被其他窗口修改，已暂停。请重新点击更新，读取新版本后确认。');
  await request('/api/characters/merge-attributes', payload);
  // Require read-back before allowing subsequent automatic writes.
  characterSynced.value = false;
  selectedCharacter.value = await readCharacter();
  if (localCard !== store.card) throw new Error('上一张卡的角色请求已发送；当前卡已切换，后续同步已关闭');
  if (!containsData(selectedCharacter.value.data, payload.data)) throw new Error('酒馆返回成功，但读回的角色内容与提交内容不一致；自动同步已暂停，请检查目标');
  sentCharacter = clone(payload); characterSynced.value = true;
  status.value = '角色已保存到酒馆 · ' + new Date().toLocaleTimeString();
}
async function pushWorld(book) {
  const localCard = store.card;
  const fresh = await readWorld();
  if (localCard !== store.card) throw new Error('当前卡已切换，已取消本次世界书同步');
  if (!sameData(fresh, selectedWorldbook.value)) throw new Error('酒馆世界书已被其他窗口修改，已暂停。请重新点击更新，读取新版本后确认。');
  const data = toTavernWorld(book, fresh);
  await request('/api/worldinfo/edit', { name: selectedWorldName.value, data });
  worldSynced.value = false;
  selectedWorldbook.value = await readWorld();
  if (localCard !== store.card) throw new Error('上一张卡的世界书请求已发送；当前卡已切换，后续同步已关闭');
  if (!sameData(selectedWorldbook.value, data)) throw new Error('酒馆返回成功，但读回的世界书与提交内容不一致；自动同步已暂停，请检查目标');
  sentWorld = clone(book); worldSynced.value = true;
  status.value = '世界书已保存到酒馆 · ' + new Date().toLocaleTimeString();
}
function executePending() {
  const operation = pending.value;
  if (!operation) return;
  return run(async () => {
    try {
      if (operation.localCard !== store.card) throw new Error('当前卡已切换，请重新选择同步内容');
      if (operation.kind === 'character') await pushCharacter(clone(operation.payload));
      else if (operation.kind === 'world') await pushWorld(clone(operation.payload));
      else if (operation.kind === 'import-character') {
        const source = operation.payload;
        store.loadFromJson({ spec: 'chara_card_v2', spec_version: '2.0', data: clone(source.data) });
        store.filePath = null; store.coverImagePath = null; store.coverImageBase64 = null; store.markDirty();
        status.value = '角色已载入当前编辑卡。';
      } else {
        store.card.data.character_book = clone(operation.payload); store.markDirty(); resetSync();
        status.value = '世界书已载入当前编辑卡。';
      }
    } finally { pending.value = null; }
  });
}
function scheduleAuto() {
  clearTimeout(timer);
  if (locked.value || (!autoCharacter.value && !autoWorld.value)) return;
  const current = store.exportJson();
  if ((!autoCharacter.value || sameData(patchFor(current), sentCharacter))
    && (!autoWorld.value || sameData(current.data.character_book, sentWorld))) return;
  timer = setTimeout(() => run(async () => {
    const exported = store.exportJson();
    if (autoCharacter.value) {
      const payload = patchFor(exported);
      if (!sameData(payload, sentCharacter)) {
        if (!payload.data.name.trim()) throw new Error('角色名称为空，自动同步已暂停');
        await pushCharacter(payload);
      }
    }
    if (autoWorld.value && !sameData(exported.data.character_book, sentWorld)) await pushWorld(exported.data.character_book);
  }), 2000);
}
watch(baseUrl, () => { connected.value = false; resetSync(); pending.value = null; });
watch([embedded, scripts], () => { autoCharacter.value = false; characterSynced.value = false; });
watch(() => store.card, () => { resetSync(); pending.value = null; });
watch(() => store.card, scheduleAuto, { deep: true });
watch([autoCharacter, autoWorld], scheduleAuto);
onScopeDispose(() => clearTimeout(timer));
onMounted(async () => {
  try { installExists.value = !!(await api?.tavernStatus?.())?.installExists; } catch {}
});
</script>

<style scoped>
.link-grid select { color-scheme: dark; }
.link-grid select option {
  background-color: #1a1a2e;
  color: #e8e6f0;
}
.connection-row, .actions, .summary { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.connection-row .input { flex: 1; min-width: 220px; }
.link-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.link-grid > *, .card__body { min-width: 0; }
.link-grid select { width: 100%; margin-top: 8px; }
.preview { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; padding: 12px; border: 1px solid var(--cf-border); border-radius: 8px; overflow-wrap: anywhere; }
.preview p { margin: 0; max-height: 120px; overflow: auto; white-space: pre-wrap; }
.hint, .preview small { color: var(--cf-text-secondary); line-height: 1.7; }
.option { display: flex; align-items: center; gap: 8px; margin: 14px 0 8px; }
.error { color: #ef7777; white-space: pre-wrap; overflow-wrap: anywhere; }
.status { color: var(--cf-text-primary); }
.confirmation { border: 1px solid #579bdd; }
@media (max-width: 1050px) { .link-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
