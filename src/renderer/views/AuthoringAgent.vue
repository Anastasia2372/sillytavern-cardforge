<template>
  <div class="page authoring-page">
    <header class="page__header agent-page-header">
      <div><h1>创作 Agent <span class="badge badge--info">试用版</span></h1><p>选好参考，提出任务，审阅每一处改动。</p></div>
      <div class="agent-actions">
        <label class="agent-api-picker">
          <span>API 预设</span>
          <select class="select" v-model="agent.selectedProviderId" :disabled="agent.busy || !api.settingsLoaded" aria-label="创作 Agent 使用的 API 预设">
            <option value="">跟随全局{{ api.activeProvider ? ' · ' + (api.activeProvider.name || '未命名预设') : '（暂无可用 API）' }}</option>
            <option v-if="missingProvider" :value="agent.selectedProviderId" disabled>原预设已删除，请重新选择</option>
            <option v-for="provider in api.providers" :key="provider.id" :value="provider.id"
              :disabled="!provider.enabled || !api.isProviderReady(provider)">{{ providerLabel(provider) }}</option>
          </select>
        </label>
        <router-link class="btn btn--secondary btn--sm" to="/worldbook">世界书</router-link>
        <router-link class="btn btn--ghost btn--sm" to="/assistant">AI 助手</router-link>
        <router-link class="btn btn--ghost btn--sm" :to="{ path: '/settings', query: { section: 'world-context' } }">参考长度设置</router-link>
      </div>
    </header>

    <div class="agent-layout">
      <aside class="agent-sidebar">
        <section class="agent-panel">
          <header><h3>整张卡的创作约定</h3><span class="badge badge--success">随卡保存</span></header>
          <p class="agent-hint">题材、文风、核心冲突、必须保留的设定，以及不希望出现的内容。AI 创作时会参考这些约定。</p>
          <textarea class="textarea" rows="9" v-model="agent.brief" aria-label="整张卡的创作约定"
            placeholder="题材与文风：仙侠，克制、具体，少用套话。&#10;核心冲突：信任与隐瞒。&#10;必须保留：青源不知道自己的身世。&#10;避免：让所有人物无条件喜欢玩家。"></textarea>
        </section>

        <section class="agent-panel">
          <header><h3>严格用词设定</h3><span class="badge badge--warning">优先遵守</span></header>
          <p class="agent-hint">用于约束正文的词汇、句式和叙述习惯。这里的规则会优先于普通文风描述，也会用于悬浮窗的世界书 AI 改写。</p>
          <textarea class="textarea" rows="8" v-model="agent.strictWording" aria-label="严格用词设定"
            placeholder="必须使用：短句、具体动作、克制的情绪表达。&#10;避免使用：万能美人、嘴角勾起、意味深长等套话。&#10;叙述要求：第三人称限知，避免现代网络用语。"></textarea>
        </section>

        <section class="agent-panel">
          <header><h3>发送前的参考条目</h3><button class="btn btn--ghost btn--sm" @click="agent.modes = {}">恢复自动</button></header>
          <p class="agent-hint">手动引用优先，其次是常驻和关键词命中。手动选中条目的正文也会用于寻找关联。禁用条目只有手动选中才会引用。</p>
          <div class="agent-budget">{{ agent.context.usedChars.toLocaleString() }} / {{ agent.context.totalChars.toLocaleString() }} 字符 · {{ includedCount }} 条</div>
          <input class="input" v-model="referenceSearch" aria-label="筛选参考条目" placeholder="搜索条目名称或序号">
          <div class="agent-references">
            <article v-for="reference in visibleReferences" :key="reference.token" class="agent-reference">
              <div class="agent-reference__title"><strong>{{ reference.sequence }} · {{ reference.title }}</strong><small>{{ reference.reason }}</small></div>
              <select class="select" :value="reference.mode" :aria-label="reference.title + '的引用方式'"
                @change="agent.setReferenceMode(reference.id, $event.target.value)">
                <option value="auto">自动选择</option><option value="include">手动引用</option><option value="exclude">排除</option>
              </select>
              <div class="agent-reference__state" :class="{ 'agent-warning': reference.status === 'truncated' || reference.status === 'budget' }">
                {{ referenceStatus(reference) }}<span v-if="reference.status === 'full' || reference.status === 'truncated'"> · 正文 {{ reference.chars }} / {{ reference.totalChars }} 字符</span>
              </div>
              <details v-if="reference.status === 'full' || reference.status === 'truncated'"><summary>查看将发送的正文</summary><pre>{{ reference.sentContent || '（正文为空）' }}</pre></details>
            </article>
            <p v-if="!visibleReferences.length" class="agent-hint">{{ card.worldEntries.length ? '没有匹配的条目。' : '还没有世界书条目，可以让 Agent 提出新增方案。' }}</p>
          </div>
          <p class="agent-hint">被截断的条目只能供参考。需要改写时，请在参考长度设置中提高单条上限及总预算，直到显示“完整读取”。</p>
        </section>
      </aside>

      <main class="agent-main">
        <section class="agent-panel">
          <header><h3>这一轮想完成什么</h3><router-link to="/api" class="agent-model">{{ (agent.requestProvider || agent.selectedProvider)?.model || '配置 API' }}</router-link></header>
          <p v-if="agent.providerError" class="agent-warning" role="status">{{ agent.providerError }} <router-link to="/api">管理 API 预设</router-link></p>
          <textarea class="textarea" v-model="agent.task" rows="5" aria-label="创作任务" @keydown.ctrl.enter="generateFromKeyboard"
            placeholder="例如：把青源改成表面温和、实际戒备心很重的人。同步调整相关人物关系和开场白，保留原来的世界观。"></textarea>
          <div class="agent-examples">
            <button v-for="example in examples" :key="example.label" class="btn btn--ghost btn--sm" @click="agent.task = example.task">{{ example.label }}</button>
          </div>
          <div class="agent-task-footer">
            <span class="agent-hint">可同轮新增条目、创建分隔栏并整理归类，也可修改人物设定和开场白。{{ agent.round ? '重新生成会替换当前待审阅方案。' : '生成不会直接修改角色卡。' }}</span>
            <button class="btn btn--primary" :disabled="agent.busy || !agent.task.trim() || !!agent.providerError" @click="agent.generate()">{{ agent.busy ? '正在整理修改方案…' : agent.round ? '重新生成方案' : '生成修改方案' }}</button>
          </div>
          <p v-if="agent.busy" class="agent-hint" role="status">可以切换页面，请求会继续。期间编辑了原文，采纳时会检查冲突。</p>
        </section>

        <p v-if="agent.error" class="agent-error" role="alert">{{ agent.error }}</p>
        <section v-if="agent.round" class="agent-panel">
          <header><h3>本轮方案</h3><small>{{ formatTime(agent.round.createdAt) }}</small></header>
          <p v-if="agent.round.provider" class="agent-hint">本轮使用：{{ agent.round.provider.name }} · {{ agent.round.provider.model }}</p>
          <p class="agent-prose">{{ agent.round.summary }}</p>
          <p v-if="agent.round.brief !== agent.brief || agent.round.strictWording !== agent.strictWording" class="agent-warning">创作约定或严格用词设定已在本轮生成后修改。当前建议基于旧设定，建议重新生成。</p>
          <ul v-if="agent.round.notes.length" class="agent-notes"><li v-for="(note, index) in agent.round.notes" :key="index">{{ note }}</li></ul>
          <div v-if="agent.round.questions.length" class="agent-questions"><strong>需要你补充的创作决定</strong><ul><li v-for="(question, index) in agent.round.questions" :key="index">{{ question }}</li></ul><p class="agent-hint">把答案补充到任务或创作约定，再生成下一轮方案。</p></div>
          <details class="agent-audit">
            <summary>本轮实际参考 · {{ agent.round.usedChars.toLocaleString() }} 字符</summary>
            <p class="agent-hint">这里保留请求发出时的参考快照，不会随左侧的新选择改变。</p>
            <details v-for="reference in agent.round.references" :key="reference.token" class="agent-audit-entry">
              <summary>{{ reference.title }} · {{ referenceStatus(reference) }} · {{ reference.chars }} 字符</summary>
              <pre>{{ reference.sentContent || '未发送正文' }}</pre>
            </details>
            <details><summary>本轮创作约定</summary><pre>{{ agent.round.brief || '（未设置）' }}</pre></details>
            <details><summary>本轮严格用词设定</summary><pre>{{ agent.round.strictWording || '（未设置）' }}</pre></details>
          </details>
          <div class="agent-review-toolbar">
            <label><input type="checkbox" :checked="allSelected" :disabled="agent.busy" @change="selectAll($event.target.checked)"> 全选待审阅</label>
            <button class="btn btn--primary btn--sm" :disabled="agent.busy || !agent.selectedCount" @click="agent.applySelected()">采纳选中 {{ agent.selectedCount }} 项</button>
          </div>
          <p v-if="!agent.round.changes.length" class="agent-hint">本轮没有提出改动，可根据上面的建议继续完善任务。</p>
        </section>

        <article v-for="change in agent.round?.changes || []" :key="change.id" class="agent-panel agent-change">
          <header>
            <label class="agent-change__title"><input type="checkbox" v-model="change.selected" :disabled="change.status !== 'pending' || agent.busy"><strong>{{ change.kind === 'create' ? '新增世界书 · ' : '' }}{{ change.title }}</strong></label>
            <span class="badge" :class="change.status === 'applied' ? 'badge--success' : 'badge--info'">{{ changeStatus[change.status] }}</span>
          </header>
          <p class="agent-prose">{{ change.reason }}</p>
          <p v-if="change.sources.length" class="agent-hint">AI 标注的参考：{{ change.sources.join('、') }}</p>
          <p v-if="change.kind === 'create'" class="agent-hint">关键词：{{ change.keys.join('、') || '未设置' }} · 建议酒馆顺序 {{ change.order }}（采纳分组后按分组调整） · {{ change.constant ? '常驻条目' : '关键词触发条目' }}</p>
          <div v-if="change.kind === 'organize'" class="agent-organization-plan">
            <p class="agent-hint">将按以下工具内顺序整理；所有分隔栏的酒馆范围及栏内条目的酒馆顺序都会同步重排，每栏至少预留 1000 个顺序：</p>
            <ul>
              <li v-for="section in change.organization.sections" :key="section.sortOrder">
                <strong>{{ section.name }}</strong>：{{ organizationEntryNames(change, section.entryTargets) || '（空）' }}
              </li>
              <li><strong>未分组</strong>：{{ organizationEntryNames(change, change.organization.ungroupedTargets) || '（无）' }}</li>
            </ul>
            <p v-if="pendingCreations(change).length" class="agent-hint">采纳此分组方案会一并新增：{{ pendingCreations(change).map(item => item.title).join('、') }}。请同时审阅下方对应正文，整批改动可一起撤销。</p>
          </div>
          <AgentTextDiff v-if="change.kind !== 'organize'" :before="change.before" :after="change.after" />
          <details v-if="change.status === 'pending' && change.kind !== 'organize'" class="agent-refine"><summary>采纳前手动调整正文</summary><textarea class="textarea" rows="8" v-model="change.after" :disabled="agent.busy" :aria-label="'调整' + change.title + '的建议正文'"></textarea></details>
          <p v-if="change.status === 'pending' && agent.conflict(change)" class="agent-warning">{{ agent.conflict(change) }}</p>
          <div class="agent-actions agent-change__actions">
            <button v-if="change.status === 'pending'" class="btn btn--ghost btn--sm" :disabled="agent.busy" @click="change.status = 'dismissed'; change.selected = false">忽略</button>
            <button v-if="change.status === 'dismissed'" class="btn btn--ghost btn--sm" :disabled="agent.busy" @click="change.status = 'pending'">恢复待审阅</button>
            <button v-if="change.status === 'pending'" class="btn btn--primary btn--sm" :disabled="agent.busy || !!agent.conflict(change)" @click="agent.applyChanges([change.id])">{{ pendingCreations(change).length ? `采纳分组及 ${pendingCreations(change).length} 项新增` : '采纳这一项' }}</button>
          </div>
        </article>

        <section v-if="agent.history.length" class="agent-panel">
          <header><h3>已采纳的改动</h3><small>本次会话</small></header>
          <p class="agent-hint">撤销记录保留到关闭应用或切换角色卡。采纳的正文和创作约定会随草稿保存。撤销时若发现后续编辑，会提示冲突。</p>
          <article v-for="batch in agent.history" :key="batch.id" class="agent-history-row">
            <div><strong>{{ batch.patches.map(patch => patch.title).join('、') }}</strong><p>{{ formatTime(batch.at) }} · {{ batch.patches.length }} 项</p></div>
            <button class="btn btn--secondary btn--sm" :disabled="batch.undone || agent.busy" @click="agent.undo(batch)">{{ batch.undone ? '已撤销' : '撤销这批改动' }}</button>
          </article>
        </section>
        <details v-if="agent.rawReply" class="agent-panel"><summary>查看 AI 原始回复</summary><pre class="agent-raw">{{ agent.rawReply }}</pre></details>
        <section v-if="!agent.round && !agent.busy" class="agent-panel agent-empty"><h3>从一个具体的创作问题开始</h3><p>左侧选择参考条目，写清想保留和想改变的内容。生成后，你会看到每一项修改的理由与原文对比。</p></section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthoringAgentStore } from '../stores/authoring-agent.js';
import { useCardStore } from '../stores/card.js';
import { useApiStore } from '../stores/api.js';
import AgentTextDiff from '../components/AgentTextDiff.vue';
const agent = useAuthoringAgentStore();
const card = useCardStore();
const api = useApiStore();
const route = useRoute();
const referenceSearch = ref('');
const missingProvider = computed(() => api.settingsLoaded && agent.selectedProviderId
  && !api.providers.some(provider => provider.id === agent.selectedProviderId));
function providerLabel(provider) {
  const state = !provider.enabled ? '（已停用）' : !api.isProviderReady(provider) ? '（待配置）' : '';
  return (provider.name || '未命名预设') + ' · ' + (provider.model || '未选模型') + state;
}
const examples = [
  { label: '检查设定冲突', task: '检查提供的人物设定和世界书是否存在矛盾、提前泄露的秘密或人物动机缺口。说明依据，只对有明确依据的问题提出修改。' },
  { label: '联动完善人物', task: '完善当前人物的核心动机与矛盾，结合已引用的世界书补充人物关系，并提出对应的开场白调整。保留既定事实。' },
  { label: '补充世界书', task: '根据人物设定和创作约定，提出缺少的组织、地点或人物关系条目，说明每条的用途，避免重复已有设定。' },
  { label: '新建世界书条目', task: '新建一个世界书条目。请先判断最适合补充的设定类型，再给出明确的条目名称、至少一个触发关键词、是否设为常驻、建议的酒馆顺序，以及可以直接放入世界书的完整正文。不要修改已有条目。' },
  { label: '搭建世界书框架', task: '根据创作约定搭建世界书框架，新增不超过 20 个能支撑世界观的条目，提供完整正文和触发设置，并在同一轮创建合适的分隔栏，把新增条目及现有条目整理归类、排序。避免重复已有设定，不改写已有条目正文。' },
  { label: '整理世界书', task: '整理当前世界书：按人物、组织、地点、规则或事件等主题提出分隔栏；把每个现有条目都放入合适的分隔栏或列为未分组，并给出清晰的排列顺序。允许新建分隔栏，不修改任何条目正文。请只返回一个 organize 改动方案。' }
];
const changeStatus = { pending: '待审阅', applied: '已采纳', dismissed: '已忽略', undone: '已撤销' };
const includedCount = computed(() => agent.context.references.filter(r => ['full', 'truncated'].includes(r.status)).length);
const visibleReferences = computed(() => {
  const query = referenceSearch.value.trim().toLowerCase();
  return agent.context.references.filter(reference => !query || reference.title.toLowerCase().includes(query)
    || String(reference.sequence) === query.replace(/^#/, ''));
});
const pending = computed(() => agent.round?.changes.filter(change => change.status === 'pending') || []);
const allSelected = computed(() => pending.value.length > 0 && pending.value.every(change => change.selected));
function selectAll(value) { pending.value.forEach(change => { change.selected = value; }); }
function pendingCreations(change) {
  return agent.organizationCreations(change).filter(item => item.status === 'pending');
}
function organizationEntryNames(change, tokens) {
  return tokens.map(token => (change.organization.entryTitles?.[token] || token)
    + (Object.hasOwn(change.organization.newEntries || {}, token) ? '（新增）' : '')).join('、');
}
function referenceStatus(reference) {
  return { full: '完整读取', truncated: '已截断', budget: '预算不足，未发送', excluded: '未发送' }[reference.status];
}
function formatTime(value) { return new Date(value).toLocaleString('zh-CN', { hour12: false }); }
function generateFromKeyboard(event) { if (!event.isComposing) { event.preventDefault(); agent.generate(); } }
watch(() => [route.query.entry, route.query.direction], ([entry, direction]) => {
  if (typeof entry === 'string') agent.focusEntry(entry, typeof direction === 'string' ? direction : '');
}, { immediate: true });
</script>

<style scoped>
.authoring-page { width: 100%; max-width: none; }
.agent-page-header, .agent-actions, .agent-task-footer, .agent-review-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.agent-actions { justify-content: flex-end; }
.agent-api-picker { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; font-size: 12px; color: var(--cf-text-secondary); }
.agent-api-picker > span { flex-shrink: 0; }
.agent-api-picker .select { width: 230px; min-width: 0; max-width: 100%; color-scheme: dark; text-overflow: ellipsis; }
.agent-api-picker option { background: #1a1a2e; color: #e8e6f0; }
.agent-layout { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 20px; align-items: start; }
.agent-sidebar, .agent-main { min-width: 0; }
.agent-panel { padding: 18px; margin-bottom: 16px; background: var(--cf-bg-secondary); border: 1px solid var(--cf-border); border-radius: var(--cf-radius-md); }
.agent-panel > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.agent-panel h3 { font-size: 14px; }
.agent-panel small, .agent-hint { color: var(--cf-text-secondary); font-size: 12px; line-height: 1.7; }
.agent-hint { margin: 8px 0; }
.agent-panel .textarea { resize: vertical; user-select: text; min-width: 0; }
.agent-budget { color: #93c5fd; padding: 9px 0; font-size: 12px; font-variant-numeric: tabular-nums; }
.agent-references { max-height: 560px; overflow: auto; margin-top: 10px; }
.agent-reference { padding: 12px 0; border-bottom: 1px solid var(--cf-border); }
.agent-reference__title { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 12px; }
.agent-reference__title strong { overflow-wrap: anywhere; }
.agent-reference__title small { flex-shrink: 0; }
.agent-reference .select { width: 100%; }
.agent-reference__state { margin-top: 6px; color: #86cba0; font-size: 11px; }
.agent-panel summary { font-size: 12px; cursor: pointer; color: #b5c9e2; line-height: 1.8; }
.agent-panel pre { white-space: pre-wrap; overflow-wrap: anywhere; user-select: text; max-height: 260px; overflow: auto; padding: 10px; margin-top: 8px; background: var(--cf-bg-tertiary); font-size: 12px; line-height: 1.8; }
.agent-model { color: #93c5fd; font-size: 12px; overflow-wrap: anywhere; }
.agent-examples { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.agent-task-footer { margin-top: 12px; }
.agent-task-footer > span { flex: 1; min-width: 180px; }
.agent-task-footer > button { flex-shrink: 0; }
.agent-prose { white-space: pre-wrap; overflow-wrap: anywhere; user-select: text; font-size: 13px; line-height: 1.9; margin-bottom: 12px; }
.agent-organization-plan { margin: 10px 0; padding: 10px 12px; border: 1px solid var(--cf-border); border-radius: 6px; background: var(--cf-bg-tertiary); }
.agent-organization-plan ul { margin: 4px 0 0; padding-left: 22px; font-size: 12px; line-height: 1.8; }
.agent-notes, .agent-questions ul { padding-left: 22px; font-size: 13px; line-height: 1.9; }
.agent-questions { padding: 12px; border-radius: 6px; background: #60a5fa12; margin-top: 12px; }
.agent-warning { color: #fbbf24; font-size: 12px; line-height: 1.7; margin-top: 8px; }
.agent-error { padding: 14px; background: #321c25; border: 1px solid #f8717170; color: #fca5a5; border-radius: 8px; margin-bottom: 16px; user-select: text; overflow-wrap: anywhere; }
.agent-audit { margin-top: 16px; }
.agent-audit-entry { margin: 8px 0; }
.agent-review-toolbar { margin-top: 18px; padding-top: 12px; border-top: 1px solid var(--cf-border); font-size: 12px; }
.agent-review-toolbar label, .agent-change__title { display: flex; align-items: center; gap: 8px; }
.agent-change__title { overflow-wrap: anywhere; }
.agent-refine { margin-top: 12px; }
.agent-refine textarea { margin-top: 8px; }
.agent-change__actions { margin-top: 12px; }
.agent-history-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--cf-border); font-size: 12px; }
.agent-history-row > div { min-width: 0; overflow-wrap: anywhere; }
.agent-history-row p { color: var(--cf-text-secondary); margin-top: 6px; }
.agent-history-row button { flex-shrink: 0; }
.agent-empty { text-align: center; padding: 50px 24px; color: var(--cf-text-secondary); }
.agent-empty p { margin-top: 12px; font-size: 13px; line-height: 1.8; }
@media (max-width: 1150px) { .agent-layout { grid-template-columns: minmax(0, 1fr); } .agent-sidebar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; } .agent-references { max-height: 320px; } }
@media (max-width: 800px) { .agent-sidebar { display: block; } }
</style>
