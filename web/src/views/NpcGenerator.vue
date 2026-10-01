<template>
  <div class="page">
    <div class="page__header">
      <h1>NPC 生成器</h1>
      <p>三种模式生成结构化 NPC：全自动 / 关键词扩写 / IDE 引导式</p>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs mb-md">
      <div :class="['tabs__item', { active: tab === 'auto' }]" @click="tab = 'auto'">全自动生成</div>
      <div :class="['tabs__item', { active: tab === 'expand' }]" @click="tab = 'expand'">关键词扩写</div>
      <div :class="['tabs__item', { active: tab === 'ide' }]" @click="tab = 'ide'">IDE 引导式</div>
    </div>

    <div class="grid-2">
      <!-- ============ 左侧输入区 ============ -->
      <div>
        <!-- ===== Tab 1: 全自动 ===== -->
        <div v-if="tab === 'auto'" class="card">
          <div class="card__header"><h3>全自动生成</h3></div>
          <div class="card__body">
            <div class="hint mb-md" style="line-height:1.6">
              世界观自动从当前角色卡的世界书读取（含常驻条目内容 + 触发条目摘要），不用手填。AI 会按 6 块结构（基础/外貌/性格/关系/语言/语料）输出，强制遵守"绝对零度+八股禁令+特征差异化"。
            </div>
            <div class="form-group">
              <label>生成数量</label>
              <select class="select" v-model.number="autoCount">
                <option :value="1">1 个</option>
                <option :value="3">3 个</option>
                <option :value="5">5 个</option>
              </select>
            </div>
            <div class="form-group">
              <label>角色类型偏好（可空）</label>
              <input class="input" v-model="autoTypePreference"
                placeholder="如：女性反派、商人、师傅、路人 NPC...">
            </div>
            <label class="toggle-label" style="margin-bottom:8px">
              <input type="checkbox" v-model="autoStreamMode"> 流式生成
            </label>
            <label class="toggle-label" style="margin-bottom:8px">
              <input type="checkbox" v-model="autoSelfCheck"> 生成完后 AI 自查（多耗 1-2 分钟，质量更高）
            </label>
            <button class="btn btn--primary btn--lg" style="width:100%"
              :disabled="generating" @click="handleAutoGenerate">
              {{ generating ? '生成中...' : '开始生成' }}
            </button>
          </div>
        </div>

        <!-- ===== Tab 2: 关键词扩写 ===== -->
        <div v-if="tab === 'expand'" class="card">
          <div class="card__header"><h3>关键词扩写</h3></div>
          <div class="card__body">
            <div class="hint mb-md" style="line-height:1.6">
              你给关键词，AI 按 6 块结构扩写完整 NPC。最少填姓名，其他 6 块关键词都可空（AI 会按世界观自动补全）。
            </div>
            <div class="form-group">
              <label>姓名 <span class="badge badge--danger">必填</span></label>
              <input class="input" v-model="expandInput.name" placeholder="角色姓名">
            </div>
            <div class="form-group">
              <label>基础信息关键词（年龄/性别/身份）</label>
              <input class="input" v-model="expandInput.basic"
                placeholder="如：35岁女性，高中班主任">
            </div>
            <div class="form-group">
              <label>外貌关键词（独特特征）</label>
              <input class="input" v-model="expandInput.appearance"
                placeholder='如：戴黑框眼镜，矮胖（避免"精致脸蛋"等万能词）'>
            </div>
            <div class="form-group">
              <label>性格关键词</label>
              <input class="input" v-model="expandInput.personality"
                placeholder="如：严厉、刀子嘴豆腐心">
            </div>
            <div class="form-group">
              <label>与玩家的关系</label>
              <input class="input" v-model="expandInput.relationship"
                placeholder="如：班主任，对成绩不满经常找谈话">
            </div>
            <div class="form-group">
              <label>说话特征 / 口头禅</label>
              <input class="input" v-model="expandInput.language"
                placeholder='如：直接，口头禅"你看看你"'>
            </div>
            <div class="form-group">
              <label>额外说明（可空）</label>
              <textarea class="textarea" v-model="expandInput.extra" rows="2"
                placeholder="任何想补充的背景/特殊设定..."></textarea>
            </div>
            <label class="toggle-label" style="margin-bottom:8px">
              <input type="checkbox" v-model="expandStreamMode"> 流式生成
            </label>
            <label class="toggle-label" style="margin-bottom:8px">
              <input type="checkbox" v-model="expandSelfCheck"> 生成完后 AI 自查
            </label>
            <button class="btn btn--primary btn--lg" style="width:100%"
              :disabled="generating || !expandInput.name" @click="handleExpand">
              {{ generating ? '扩写中...' : '扩写完整 NPC' }}
            </button>
          </div>
        </div>

        <!-- ===== Tab 3: IDE 引导式 ===== -->
        <div v-if="tab === 'ide'" class="card">
          <div class="card__header flex-between">
            <h3>IDE 引导式 — 步骤 {{ ideStep + 1 }}/{{ ideSteps.length }}</h3>
            <div class="flex-row">
              <button class="btn btn--ghost btn--sm" @click="ideReset">清空重来</button>
            </div>
          </div>
          <div class="card__body">
            <div class="hint mb-md" style="line-height:1.6">
              一步步填 6 块，每个字段都有八股化实时检查（红字提示）。可以按"AI 检查这块"做语义级审查。完成后点"加入列表"。
            </div>

            <!-- 步骤条 -->
            <div class="step-nav mb-md">
              <button v-for="(s, i) in ideSteps" :key="i"
                class="step-btn" :class="{ active: ideStep === i, done: isStepComplete(i) }"
                @click="ideStep = i">
                <span class="step-num">{{ i + 1 }}</span>
                <span class="step-label">{{ s.label }}</span>
              </button>
            </div>

            <!-- ==== 步骤 0：基础信息 ==== -->
            <template v-if="ideStep === 0">
              <div class="form-group">
                <label>姓名 <span class="badge badge--danger">必填</span></label>
                <input class="input" v-model="ideNpc.name" placeholder="角色姓名"
                  @input="onIdeFieldInput('name', ideNpc.name)">
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>年龄</label>
                  <input class="input" v-model="ideNpc.basic.年龄" placeholder="如：35岁">
                </div>
                <div class="form-group">
                  <label>性别</label>
                  <input class="input" v-model="ideNpc.basic.性别" placeholder="如：女">
                </div>
              </div>
              <div class="form-group">
                <label>身份 / 职业</label>
                <input class="input" v-model="ideNpc.basic.身份"
                  placeholder="如：高中班主任、宗门长老...">
              </div>
              <div class="form-group">
                <label>额外关键词（用于世界书触发）</label>
                <CommaListInput class="input" :model-value="ideNpc.keys || []"
                  @update:model-value="ideNpc.keys = $event"
                  placeholder="如：王老师, 王静, 班主任（用逗号分隔）" />
              </div>
            </template>

            <!-- ==== 步骤 1：外貌 ==== -->
            <template v-if="ideStep === 1">
              <div class="card mb-md" style="background:rgba(248,113,113,0.08);border-color:rgba(248,113,113,0.3)">
                <div class="card__body" style="padding:12px;font-size:12px;line-height:1.7">
                  <strong style="color:var(--cf-danger)">重要：只写"偏离 AI 默认认知"的特征</strong><br>
                  - 中国角色不要写"黑发黑瞳"（默认就是）<br>
                  - 18 岁不要写"年轻"（默认就是）<br>
                  <strong style="color:var(--cf-danger)">禁止万能美人描写：</strong>精致的脸蛋、白皙的皮肤、桃花眼、柳叶眉、樱桃小口<br>
                  <strong>测试标准：</strong>遮住名字看你写的特征，能不能认出这个角色 — 能就对了
                </div>
              </div>
              <div class="form-group">
                <label>整体印象（一句话）</label>
                <input class="input" v-model="ideNpc.appearance.整体印象"
                  placeholder="如：一米六五，身材微胖" @blur="onIdeBlur('外貌-整体印象', ideNpc.appearance.整体印象)">
              </div>
              <div class="form-group">
                <label>关键特征（最显眼的 1-2 个）</label>
                <input class="input" v-model="ideNpc.appearance.关键特征"
                  placeholder="如：戴黑框眼镜，总是皱眉" @blur="onIdeBlur('外貌-关键特征', ideNpc.appearance.关键特征)">
                <BaguaWarning :issues="scanField(ideNpc.appearance.关键特征)" />
              </div>
              <div class="form-group">
                <label>穿着风格</label>
                <input class="input" v-model="ideNpc.appearance.穿着风格"
                  placeholder="如：深色职业装，平底鞋" @blur="onIdeBlur('外貌-穿着风格', ideNpc.appearance.穿着风格)">
                <BaguaWarning :issues="scanField(ideNpc.appearance.穿着风格)" />
              </div>
              <FieldAiResult :result="ideAiCheck['外貌-关键特征']" label="关键特征" />
            </template>

            <!-- ==== 步骤 2：性格 ==== -->
            <template v-if="ideStep === 2">
              <div class="card mb-md" style="background:rgba(245,158,66,0.08);border-color:rgba(245,158,66,0.3)">
                <div class="card__body" style="padding:12px;font-size:12px;line-height:1.7">
                  <strong style="color:var(--cf-accent)">禁止性格标签化：</strong>
                  不要直接写"她很温柔""他很善良""她很可爱"<br>
                  <strong>改成具体行为：</strong>"会带受伤小动物回家"、"看到老人会主动让座"、"被夸奖时假装无所谓"
                </div>
              </div>
              <div class="form-group">
                <label>核心特质（2-3 个关键词）</label>
                <input class="input" v-model="ideNpc.personality.核心特质"
                  placeholder="如：严厉、认真、不苟言笑" @blur="onIdeBlur('性格-核心特质', ideNpc.personality.核心特质)">
                <BaguaWarning :issues="scanField(ideNpc.personality.核心特质)" />
              </div>
              <div class="form-group">
                <label>行为模式（具体场景下做什么）</label>
                <textarea class="textarea" v-model="ideNpc.personality.行为模式" rows="4"
                  placeholder="如：上课时来回走动；发现问题立刻指出；经常叫学生到办公室谈话"
                  @blur="onIdeBlur('性格-行为模式', ideNpc.personality.行为模式)"></textarea>
                <BaguaWarning :issues="scanField(ideNpc.personality.行为模式)" />
              </div>
              <FieldAiResult :result="ideAiCheck['性格-核心特质']" label="核心特质" />
              <FieldAiResult :result="ideAiCheck['性格-行为模式']" label="行为模式" />
            </template>

            <!-- ==== 步骤 3：关系定位 ==== -->
            <template v-if="ideStep === 3">
              <div class="card mb-md" style="background:rgba(96,165,250,0.08);border-color:rgba(96,165,250,0.3)">
                <div class="card__body" style="padding:12px;font-size:12px;line-height:1.7">
                  <strong style="color:var(--cf-info)">关系定位是 NPC 最重要的部分</strong> — 围绕"NPC 跟主角的关系/互动方式/作用"写。
                </div>
              </div>
              <div class="form-group">
                <label>与玩家的关系</label>
                <input class="input" v-model="ideNpc.relationship['与user关系']"
                  placeholder="如：玩家的班主任">
              </div>
              <div class="form-group">
                <label>对玩家的态度</label>
                <input class="input" v-model="ideNpc.relationship.态度"
                  placeholder="如：对成绩不满意，经常找谈话"
                  @blur="onIdeBlur('关系-态度', ideNpc.relationship.态度)">
                <BaguaWarning :issues="scanField(ideNpc.relationship.态度)" />
              </div>
              <div class="form-group">
                <label>互动方式</label>
                <input class="input" v-model="ideNpc.relationship.互动方式"
                  placeholder="如：说教、批评、要求进步"
                  @blur="onIdeBlur('关系-互动方式', ideNpc.relationship.互动方式)">
                <BaguaWarning :issues="scanField(ideNpc.relationship.互动方式)" />
              </div>
              <FieldAiResult :result="ideAiCheck['关系-态度']" label="态度" />
              <FieldAiResult :result="ideAiCheck['关系-互动方式']" label="互动方式" />
            </template>

            <!-- ==== 步骤 4：语言特征 ==== -->
            <template v-if="ideStep === 4">
              <div class="form-group">
                <label>说话风格</label>
                <input class="input" v-model="ideNpc.language.说话风格"
                  placeholder="如：语气严肃，说话直接，不客气"
                  @blur="onIdeBlur('语言-说话风格', ideNpc.language.说话风格)">
                <BaguaWarning :issues="scanField(ideNpc.language.说话风格)" />
              </div>
              <div class="form-group">
                <label>口头禅（可空）</label>
                <input class="input" v-model="ideNpc.language.口头禅"
                  placeholder='如："你看看你"、"我跟你说多少次了"'>
              </div>
              <FieldAiResult :result="ideAiCheck['语言-说话风格']" label="说话风格" />
            </template>

            <!-- ==== 步骤 5：参考语料 ==== -->
            <template v-if="ideStep === 5">
              <div class="card mb-md" style="background:rgba(74,222,128,0.08);border-color:rgba(74,222,128,0.3)">
                <div class="card__body" style="padding:12px;font-size:12px;line-height:1.7">
                  <strong style="color:var(--cf-success)">5-10 句典型对话</strong> — <strong style="color:var(--cf-danger)">纯对话</strong>，不加动作神态描写。让对话本身展现性格。
                </div>
              </div>
              <div v-for="(d, i) in ideNpc.sample_dialogues" :key="i" class="form-group">
                <div class="flex-row">
                  <input class="input" v-model="ideNpc.sample_dialogues[i]" :placeholder="`对话 ${i + 1}`">
                  <button class="btn btn--danger btn--sm" @click="ideNpc.sample_dialogues.splice(i, 1)">x</button>
                </div>
                <BaguaWarning :issues="scanField(ideNpc.sample_dialogues[i])" />
              </div>
              <button class="btn btn--secondary btn--sm" @click="ideNpc.sample_dialogues.push('')">
                + 添加对话
              </button>
            </template>

            <!-- 上一步/下一步/完成 -->
            <div class="step-actions">
              <button class="btn btn--ghost" @click="ideStep--" :disabled="ideStep === 0">上一步</button>
              <button v-if="ideStep < ideSteps.length - 1" class="btn btn--primary" @click="ideStep++">下一步</button>
              <button v-else class="btn btn--accent" @click="ideAddToList" :disabled="!ideNpc.name">
                完成（加入列表）
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 右侧：结果区 ============ -->
      <div>
        <div class="card" style="height:100%;min-height:500px">
          <div class="card__header flex-between">
            <h3>生成结果（{{ generatedNpcs.length }}）</h3>
            <div class="flex-row" v-if="generatedNpcs.length">
              <button class="btn btn--primary btn--sm" @click="injectToWorldBook">注入世界书</button>
              <button class="btn btn--ghost btn--sm"
                @click="appStore.confirmAction('清空所有生成结果？', () => generatedNpcs = [])">清空</button>
            </div>
          </div>
          <div class="card__body" style="overflow-y:auto;max-height:calc(100vh - 280px)">
            <!-- 空状态 -->
            <div v-if="generatedNpcs.length === 0 && !generating" class="empty-state">
              <div class="empty-state__icon"></div>
              <div class="empty-state__title">等待生成</div>
              <div class="empty-state__desc">在左侧选择模式并填写信息</div>
            </div>

            <!-- 加载中（非流式） -->
            <div v-if="generating && !streamText" class="empty-state">
              <div class="empty-state__icon" style="animation: pulse 1.5s infinite"></div>
              <div class="empty-state__title">{{ generatingLabel }}</div>
            </div>

            <!-- 流式预览 -->
            <div v-if="generating && streamText" class="npc-stream-preview">
              <div class="npc-stream-preview__label">流式输出中...</div>
              <pre class="npc-stream-preview__text">{{ streamText }}</pre>
            </div>

            <!-- NPC 卡片列表 -->
            <div v-for="(npc, i) in generatedNpcs" :key="i" class="npc-result">
              <div class="flex-between mb-md">
                <h4>{{ npc.name || `NPC ${i + 1}` }}</h4>
                <div class="flex-row">
                  <label v-if="!npc._editing" class="toggle-label">
                    <input type="checkbox" v-model="npc.selected"> 选中
                  </label>
                  <button v-if="!npc._editing" class="btn btn--ghost btn--sm" @click="selfCheckOne(i)"
                    :disabled="checkingIdx === i">
                    {{ checkingIdx === i ? '自查中' : 'AI 自查' }}
                  </button>
                  <button class="btn btn--secondary btn--sm" @click="toggleEdit(i)">
                    {{ npc._editing ? '取消' : '编辑' }}
                  </button>
                  <button v-if="npc._editing" class="btn btn--primary btn--sm" @click="saveEdit(i)">保存</button>
                  <button v-if="npc._editing && npc._originalNpc" class="btn btn--ghost btn--sm"
                    @click="restoreOriginal(i)" title="把 AI 原版填回编辑器（点保存才生效）">恢复 AI 原版</button>
                  <button v-if="!npc._editing" class="btn btn--danger btn--sm" @click="generatedNpcs.splice(i, 1)">删</button>
                </div>
              </div>

              <!-- 八股扫描总结（非编辑模式才显示）-->
              <BaguaSummary v-if="!npc._editing" :npc="npc" />

              <!-- 编辑模式：YAML textarea -->
              <div v-if="npc._editing">
                <div class="hint mb-sm">
                  YAML 编辑模式 — 改完点保存。改坏 YAML 语法会 toast 报错（不会自动恢复，请手动改）。
                </div>
                <textarea class="textarea selectable" v-model="npc._editText" rows="20"
                  style="font-family: var(--cf-font-mono); font-size: 12px;"></textarea>
              </div>

              <!-- 非编辑模式：只读 YAML 预览 -->
              <pre v-else class="npc-result__yaml selectable">{{ npcToYamlPreview(npc) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CommaListInput from '../components/CommaListInput.vue';
import { ref, reactive, watch, defineComponent, h } from 'vue';
import { useCardStore } from '../stores/card.js';
import { useApiStore } from '../stores/api.js';
import { useAppStore } from '../stores/app.js';
import { buildCardContext } from '../utils/card-context.js';
import { chatForJsonArray, parseAiJsonArray } from '../utils/json-repair.js';
import { NPC_RULES_PROMPT, NPC_SCHEMA_PROMPT, JSON_QUOTE_RULE } from '../utils/npc-rules.js';
import { emptyNpc, npcToYaml, yamlToNpc, isValidNpc, normalizeNpc } from '../utils/npc-format.js';
import { scanBagua, aiCheckField, aiCheckFullNpc, summarizeBagua } from '../utils/npc-checker.js';

// ==================== 子组件（八股警告 / AI 检查结果 / 八股总结）====================
const BaguaWarning = defineComponent({
  props: ['issues'],
  render() {
    if (!this.issues || this.issues.length === 0) return null;
    return h('div', { class: 'bagua-warning' }, [
      h('strong', `⚠ 检测到 ${this.issues.length} 处八股化：`),
      ...this.issues.slice(0, 5).map(i =>
        h('div', { class: 'bagua-warning__item' }, [
          h('span', { class: 'bagua-warning__word' }, `"${i.word}"`),
          h('span', { class: 'bagua-warning__type' }, `（${i.type}）`),
          h('span', { class: 'bagua-warning__suggest' }, i.suggest)
        ])
      ),
      this.issues.length > 5 ? h('div', { class: 'bagua-warning__more' }, `还有 ${this.issues.length - 5} 处...`) : null
    ]);
  }
});

const FieldAiResult = defineComponent({
  props: ['result', 'label'],
  render() {
    const r = this.result;
    if (!r) return null;
    if (r.loading) return h('div', { class: 'ai-check-result ai-check-result--loading' }, `AI 正在检查「${this.label}」...`);
    if (!r.hasIssue) return h('div', { class: 'ai-check-result ai-check-result--ok' }, `✓ AI 检查「${this.label}」无问题`);
    return h('div', { class: 'ai-check-result ai-check-result--issue' }, [
      h('strong', `AI 检查「${this.label}」发现问题：`),
      ...(r.issues || []).map(i => h('div', { class: 'ai-check-result__item' }, `- ${i}`)),
      r.suggest ? h('div', { class: 'ai-check-result__suggest' }, [h('strong', '建议：'), r.suggest]) : null
    ]);
  }
});

const BaguaSummary = defineComponent({
  props: ['npc'],
  render() {
    const s = summarizeBagua(this.npc);
    if (s.total === 0) {
      return h('div', { class: 'bagua-summary bagua-summary--ok' }, '✓ 无八股化表达');
    }
    const types = Object.entries(s.byType).map(([k, v]) => `${k}×${v}`).join('、');
    return h('div', { class: 'bagua-summary bagua-summary--warn' }, `⚠ 共 ${s.total} 处八股化：${types}`);
  }
});

const cardStore = useCardStore();
const apiStore = useApiStore();
const appStore = useAppStore();

// ==================== 共用状态 ====================
const tab = ref('auto');
const generating = ref(false);
const streamText = ref('');
const generatingLabel = ref('AI 正在生成...');
const generatedNpcs = ref([]);
const checkingIdx = ref(-1);

// ==================== Tab 1: 全自动 ====================
const autoCount = ref(1);
const autoTypePreference = ref('');
const autoStreamMode = ref(localStorage.getItem('cf_npc_auto_stream') === 'true');
const autoSelfCheck = ref(localStorage.getItem('cf_npc_auto_selfcheck') === 'true');
watch(autoStreamMode, v => localStorage.setItem('cf_npc_auto_stream', v));
watch(autoSelfCheck, v => localStorage.setItem('cf_npc_auto_selfcheck', v));

async function handleAutoGenerate() {
  if (!apiStore.isConfigured) {
    appStore.toastError('请先在 API 设置中配置 API Key');
    return;
  }
  generating.value = true;
  streamText.value = '';
  generatingLabel.value = `AI 正在生成 ${autoCount.value} 个 NPC...`;

  try {
    const cardContext = buildCardContext(cardStore);
    const sysMsg = '你是 SillyTavern NPC 创作专家，按"6 块 JSON 结构"输出，严格遵守写作铁律。' + NPC_RULES_PROMPT + JSON_QUOTE_RULE;
    const userPrompt = `请生成 ${autoCount.value} 个原创 NPC。

【已有角色卡信息】
${cardContext}

${autoTypePreference.value ? `【角色类型偏好】\n${autoTypePreference.value}\n` : ''}
${NPC_SCHEMA_PROMPT}

输出严格按 JSON 数组（数组里每个元素是一个完整 6 块 NPC）：
\`\`\`json
[
  { "name": "...", "keys": [...], "basic": {...}, "appearance": {...}, "personality": {...}, "relationship": {...}, "language": {...}, "sample_dialogues": [...] }
]
\`\`\`

只输出 JSON 数组，不要其他文字。`;

    const msgs = [{ role: 'system', content: sysMsg }, { role: 'user', content: userPrompt }];
    const maxTokens = apiStore.getModelMaxTokens(apiStore.activeProvider?.model);

    let parsed;
    if (autoStreamMode.value) {
      const fullText = await apiStore.chat(msgs, {
        temperature: 0.9, maxTokens,
        onChunk: chunk => { streamText.value += chunk; }
      });
      streamText.value = '';
      parsed = parseAiJsonArray(fullText);
    } else {
      parsed = await chatForJsonArray(apiStore, msgs, { temperature: 0.9, maxTokens });
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      appStore.toastWarning('AI 未生成有效 NPC');
      return;
    }

    let npcs = parsed.map(n => normalizeNpc(n)).filter(n => isValidNpc(n));
    if (npcs.length === 0) {
      appStore.toastWarning('AI 输出格式不对，请重试');
      return;
    }

    if (autoSelfCheck.value) {
      generatingLabel.value = `AI 自查中（${npcs.length} 个）...`;
      const checked = [];
      for (const npc of npcs) {
        checked.push(await aiCheckFullNpc(apiStore, npc));
      }
      npcs = checked;
    }

    for (const npc of npcs) {
      generatedNpcs.value.push({ ...npc, selected: true });
    }
    appStore.toastSuccess(`成功生成 ${npcs.length} 个 NPC${autoSelfCheck.value ? '（已自查）' : ''}`);
  } catch (e) {
    appStore.toastError(`生成失败: ${e.message}`);
  } finally {
    generating.value = false;
    streamText.value = '';
  }
}

// ==================== Tab 2: 关键词扩写 ====================
const expandInput = reactive({
  name: '', basic: '', appearance: '', personality: '',
  relationship: '', language: '', extra: ''
});
const expandStreamMode = ref(localStorage.getItem('cf_npc_expand_stream') === 'true');
const expandSelfCheck = ref(localStorage.getItem('cf_npc_expand_selfcheck') === 'true');
watch(expandStreamMode, v => localStorage.setItem('cf_npc_expand_stream', v));
watch(expandSelfCheck, v => localStorage.setItem('cf_npc_expand_selfcheck', v));

async function handleExpand() {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  if (!expandInput.name.trim()) { appStore.toastError('姓名必填'); return; }

  generating.value = true;
  streamText.value = '';
  generatingLabel.value = '扩写中...';

  try {
    const cardContext = buildCardContext(cardStore);
    const labels = {
      basic: '基础信息', appearance: '外貌', personality: '性格',
      relationship: '与{{user}}关系', language: '说话特征', extra: '额外说明'
    };
    const fragments = Object.entries(labels)
      .filter(([k]) => expandInput[k] && expandInput[k].trim())
      .map(([k, v]) => `${v}：${expandInput[k]}`)
      .join('\n');

    const sysMsg = '你是 SillyTavern NPC 创作专家，根据用户给的关键词扩写完整 NPC。严格遵守写作铁律。' + NPC_RULES_PROMPT + JSON_QUOTE_RULE;
    const userPrompt = `根据以下关键词扩写一个完整的 NPC（按 6 块 JSON 结构）。

【关键信息】
姓名：${expandInput.name}
${fragments}

【已有角色卡信息】
${cardContext}

${NPC_SCHEMA_PROMPT}

输出严格按 JSON 数组（一个元素）：
\`\`\`json
[ { "name": "${expandInput.name}", "keys": [...], "basic": {...}, "appearance": {...}, "personality": {...}, "relationship": {...}, "language": {...}, "sample_dialogues": [...] } ]
\`\`\`

只输出 JSON 数组。`;

    const msgs = [{ role: 'system', content: sysMsg }, { role: 'user', content: userPrompt }];
    const maxTokens = apiStore.getModelMaxTokens(apiStore.activeProvider?.model);

    let parsed;
    if (expandStreamMode.value) {
      const fullText = await apiStore.chat(msgs, {
        temperature: 0.8, maxTokens,
        onChunk: chunk => { streamText.value += chunk; }
      });
      streamText.value = '';
      parsed = parseAiJsonArray(fullText);
    } else {
      parsed = await chatForJsonArray(apiStore, msgs, { temperature: 0.8, maxTokens });
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      appStore.toastWarning('AI 未生成有效 NPC');
      return;
    }

    let npc = normalizeNpc(parsed[0]);
    if (!isValidNpc(npc)) {
      appStore.toastWarning('AI 输出格式不对');
      return;
    }

    if (expandSelfCheck.value) {
      generatingLabel.value = 'AI 自查中...';
      npc = await aiCheckFullNpc(apiStore, npc);
    }

    generatedNpcs.value.push({ ...npc, selected: true });
    appStore.toastSuccess(`扩写完成${expandSelfCheck.value ? '（已自查）' : ''}`);
  } catch (e) {
    appStore.toastError(`扩写失败: ${e.message}`);
  } finally {
    generating.value = false;
    streamText.value = '';
  }
}

// ==================== Tab 3: IDE 引导式 ====================
const ideStep = ref(0);
const ideSteps = [
  { label: '基础信息' },
  { label: '外貌' },
  { label: '性格' },
  { label: '关系' },
  { label: '语言' },
  { label: '语料' }
];
const ideNpc = reactive(emptyNpc());
const ideAiCheck = reactive({}); // { '字段名': { hasIssue, issues, suggest } }

function isStepComplete(stepIdx) {
  if (stepIdx === 0) return !!ideNpc.name;
  if (stepIdx === 1) return !!(ideNpc.appearance.整体印象 || ideNpc.appearance.关键特征);
  if (stepIdx === 2) return !!(ideNpc.personality.核心特质 || ideNpc.personality.行为模式);
  if (stepIdx === 3) return !!(ideNpc.relationship['与user关系'] || ideNpc.relationship.态度);
  if (stepIdx === 4) return !!ideNpc.language.说话风格;
  if (stepIdx === 5) return ideNpc.sample_dialogues.length > 0;
  return false;
}

function scanField(text) {
  return scanBagua(text || '');
}

function onIdeFieldInput(label, value) {
  // 实时输入只跑前端正则（已通过 BaguaWarning 组件展示），不调 AI
}

async function onIdeBlur(label, value) {
  if (!value || value.length < 5) return;
  if (!apiStore.isConfigured) return;
  ideAiCheck[label] = { loading: true };
  const result = await aiCheckField(apiStore, label, value);
  ideAiCheck[label] = result || { hasIssue: false, issues: [], suggest: '' };
}

function ideAddToList() {
  if (!ideNpc.name) {
    appStore.toastError('姓名必填');
    return;
  }
  const npc = normalizeNpc(JSON.parse(JSON.stringify(ideNpc)));
  if (!npc.keys || npc.keys.length === 0) npc.keys = [npc.name];
  generatedNpcs.value.push({ ...npc, selected: true });
  appStore.toastSuccess(`已加入列表，可继续做下一个`);
  ideReset();
}

function ideReset() {
  Object.assign(ideNpc, emptyNpc());
  Object.keys(ideAiCheck).forEach(k => delete ideAiCheck[k]);
  ideStep.value = 0;
}

// ==================== 共用：单 NPC 操作 ====================
async function selfCheckOne(idx) {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  checkingIdx.value = idx;
  try {
    const original = generatedNpcs.value[idx];
    const fixed = await aiCheckFullNpc(apiStore, original);
    if (fixed && isValidNpc(fixed)) {
      generatedNpcs.value[idx] = { ...fixed, selected: original.selected };
      appStore.toastSuccess('自查完成');
    } else {
      appStore.toastWarning('自查失败，保留原版');
    }
  } catch (e) {
    appStore.toastError(`自查失败: ${e.message}`);
  } finally {
    checkingIdx.value = -1;
  }
}

function npcToYamlPreview(npc) {
  return npcToYaml(npc);
}

// ==================== 编辑模式 ====================
function toggleEdit(idx) {
  const npc = generatedNpcs.value[idx];
  if (npc._editing) {
    // 取消编辑
    npc._editing = false;
    npc._editText = '';
  } else {
    // 进入编辑：首次进入时存 AI 原版
    if (!npc._originalNpc) {
      npc._originalNpc = JSON.parse(JSON.stringify({
        name: npc.name, keys: npc.keys || [],
        basic: npc.basic || {}, appearance: npc.appearance || {},
        personality: npc.personality || {}, relationship: npc.relationship || {},
        language: npc.language || {}, sample_dialogues: npc.sample_dialogues || []
      }));
    }
    npc._editText = npcToYaml(npc);
    npc._editing = true;
  }
}

function saveEdit(idx) {
  const npc = generatedNpcs.value[idx];
  try {
    const parsed = yamlToNpc(npc._editText || '');
    if (!parsed.name || !parsed.name.trim()) {
      appStore.toastError('YAML 解析失败：name 字段不能空（首行必须是 NPC: 名字）');
      return;
    }
    const fixed = normalizeNpc(parsed);
    // 替换 6 块字段，保留 _selected / _originalNpc 等内部状态
    npc.name = fixed.name;
    npc.keys = fixed.keys;
    npc.basic = fixed.basic;
    npc.appearance = fixed.appearance;
    npc.personality = fixed.personality;
    npc.relationship = fixed.relationship;
    npc.language = fixed.language;
    npc.sample_dialogues = fixed.sample_dialogues;
    npc._editing = false;
    npc._editText = '';
    appStore.toastSuccess('已保存');
  } catch (e) {
    appStore.toastError('YAML 解析失败：' + e.message);
  }
}

function restoreOriginal(idx) {
  const npc = generatedNpcs.value[idx];
  if (!npc._originalNpc) return;
  npc._editText = npcToYaml(npc._originalNpc);
  appStore.toastInfo('已把 AI 原版填回编辑器，点「保存」才生效');
}

// ==================== 注入世界书 ====================
function injectToWorldBook() {
  const selected = generatedNpcs.value.filter(n => n.selected);
  if (selected.length === 0) {
    appStore.toastWarning('请至少选中一个 NPC');
    return;
  }

  let count = 0;
  for (const npc of selected) {
    const entry = cardStore.addWorldEntry();
    entry.comment = npc.name || '(未命名 NPC)';
    entry.keys = npc.keys && npc.keys.length ? npc.keys : [npc.name].filter(Boolean);
    entry.content = npcToYaml(npc);
    entry.constant = false;
    entry.enabled = true;
    entry.selective = false;
    entry.position = 'after_char';
    entry.insertion_order = 100;
    entry.extensions.exclude_recursion = true;
    entry.extensions.prevent_recursion = true;
    count++;
  }

  appStore.toastSuccess(`已注入 ${count} 个 NPC 到世界书`);
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--cf-border);
  margin-bottom: 16px;
}
.tabs__item {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  color: var(--cf-text-secondary);
  border-bottom: 2px solid transparent;
  transition: all var(--cf-transition);
}
.tabs__item:hover {
  color: var(--cf-text-primary);
}
.tabs__item.active {
  color: var(--cf-accent);
  border-bottom-color: var(--cf-accent);
}

.npc-result {
  background: var(--cf-bg-tertiary);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm);
  padding: 16px;
  margin-bottom: 12px;
}
.npc-result h4 {
  font-size: 15px;
  color: var(--cf-accent);
}
.npc-result__yaml {
  font-size: 12px;
  line-height: 1.6;
  color: var(--cf-text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--cf-font-mono);
  background: rgba(0,0,0,0.15);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm);
  padding: 10px;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.toggle-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; cursor: pointer; color: var(--cf-text-secondary);
}
.toggle-label input { accent-color: var(--cf-accent); }

.npc-stream-preview {
  padding: 10px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(96,165,250,0.2);
  border-radius: var(--cf-radius-sm);
}
.npc-stream-preview__label {
  font-size: 11px; color: var(--cf-info); margin-bottom: 6px;
}
.npc-stream-preview__text {
  font-size: 12px; color: var(--cf-text-secondary);
  white-space: pre-wrap; word-break: break-all;
  max-height: 300px; overflow-y: auto; margin: 0;
  font-family: var(--cf-font-mono);
}

.bagua-warning {
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.3);
  border-radius: var(--cf-radius-sm);
  padding: 8px 10px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--cf-danger);
}
.bagua-warning__item {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--cf-text-secondary);
}
.bagua-warning__word {
  font-family: var(--cf-font-mono);
  background: rgba(248,113,113,0.2);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--cf-danger);
}
.bagua-warning__type {
  color: var(--cf-text-muted);
  margin: 0 6px;
}
.bagua-warning__suggest {
  color: var(--cf-text-secondary);
  font-style: italic;
}
.bagua-warning__more {
  margin-top: 4px;
  font-size: 11px;
  color: var(--cf-text-muted);
}

.bagua-summary {
  font-size: 12px;
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: var(--cf-radius-sm);
}
.bagua-summary--ok {
  color: var(--cf-success);
  background: rgba(74,222,128,0.08);
}
.bagua-summary--warn {
  color: var(--cf-warning);
  background: rgba(251,191,36,0.08);
}

.ai-check-result {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: var(--cf-radius-sm);
  font-size: 12px;
  line-height: 1.6;
}
.ai-check-result--loading {
  background: rgba(96,165,250,0.08);
  color: var(--cf-info);
  font-style: italic;
}
.ai-check-result--ok {
  background: rgba(74,222,128,0.08);
  color: var(--cf-success);
}
.ai-check-result--issue {
  background: rgba(251,191,36,0.08);
  color: var(--cf-warning);
  border: 1px solid rgba(251,191,36,0.2);
}
.ai-check-result__item {
  margin-top: 2px;
  color: var(--cf-text-secondary);
}
.ai-check-result__suggest {
  margin-top: 4px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
  color: var(--cf-text-primary);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
