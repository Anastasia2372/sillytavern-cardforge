<template>
  <div class="page">
    <div class="page__header flex-between">
      <div>
        <h1>前端状态栏</h1>
        <p>引导式状态栏设计 — 从需求到渲染</p>
      </div>
      <div class="flex-row">
        <div class="step-nav">
          <button v-for="(s, i) in steps" :key="i"
            class="step-btn" :class="{ active: step === i, done: i < step }"
            @click="goStep(i)">
            <span class="step-num">{{ i + 1 }}</span>
            <span class="step-label">{{ s }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 第一步：描述需求 ==================== -->
    <template v-if="step === 0">
      <div class="card mb-md">
        <div class="card__body hint" style="line-height:1.8">
          状态栏是一段 HTML 代码，读取 MVU 变量并以面板形式显示在 AI 回复下方。<br>
          · <strong>MVU 模式</strong>：通过 <code>getAllVariables().stat_data</code> 读取变量数据<br>
          · <strong>纯文本模式</strong>：AI 每次回复末尾输出 &lt;StatusData&gt; 标签，状态栏从中解析<br>
          · 生成后自动创建正则 + 自动创建/补全 MVU 变量系统
        </div>
      </div>

      <div class="card mb-md">
        <div class="card__header"><h3>检测到的 MVU 变量</h3></div>
        <div class="card__body">
          <div v-if="!hasMvu" class="hint" style="text-align:center;padding:16px;color:var(--cf-accent)">
            未检测到 MVU 变量系统。生成状态栏后会自动创建。
          </div>
          <pre v-else class="code-preview selectable">{{ mvuPreview }}</pre>
        </div>
      </div>

      <div class="card mb-md">
        <div class="card__header"><h3>状态栏配置</h3></div>
        <div class="card__body">
          <div class="form-group">
            <label>模式</label>
            <select class="select" v-model="statusMode">
              <option value="mvu">MVU 变量模式 — 从变量系统读取实时数据</option>
              <option value="text">纯文本模式 — AI 每次回复输出状态文本，无需 MVU</option>
            </select>
          </div>

          <div class="form-group">
            <label>视觉风格</label>
            <div class="grid-3">
              <label v-for="s in styleOptions" :key="s.value" class="style-card"
                :class="{ active: style === s.value }" @click="style = s.value">
                <input type="radio" v-model="style" :value="s.value" hidden>
                <strong>{{ s.label }}</strong>
                <span>{{ s.desc }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>布局方式</label>
            <select class="select" v-model="layout">
              <option value="grouped">分组面板（按变量组分块显示）</option>
              <option value="vertical">竖向列表（每个变量一行）</option>
              <option value="grid">网格布局（2-3列卡片）</option>
              <option value="dashboard">仪表盘（重要数值大显示）</option>
            </select>
          </div>

          <div class="form-group">
            <label>额外要求</label>
            <textarea class="textarea" v-model="extraReq" rows="5"
              placeholder="详细描述你想要的状态栏内容和效果，越详细越好。&#10;&#10;例如：&#10;- 主角单独一页，显示各种货币数量和装备&#10;- 装备分头部/胸部/腿部/脚部/武器&#10;- 伙伴单独一页，带好感度和装备&#10;- NPC单独一页，带心里话&#10;- 做成可翻页的多页界面"></textarea>
          </div>
        </div>
      </div>

      <div class="step-actions">
        <span></span>
        <button class="btn btn--primary" @click="onStep1Next" :disabled="generating">
          {{ generating ? '生成中...' : hasMvu && statusMode === 'mvu' ? '下一步：使用已有变量' : statusMode === 'text' ? '下一步：生成状态栏' : '下一步：生成变量路径' }}
        </button>
      </div>
    </template>

    <!-- ==================== 第二步：变量路径 ==================== -->
    <template v-if="step === 1">
      <div class="card mb-md">
        <div class="card__body hint" style="line-height:1.8">
          以下是状态栏将使用的变量路径。确认无误后点击下一步生成状态栏界面。
        </div>
      </div>

      <div class="card mb-md">
        <div class="card__header flex-between">
          <h3>变量清单（{{ varList.length }} 个）</h3>
          <button class="btn btn--accent" @click="onStep1Next" :disabled="generating">
            {{ generating ? '生成中...' : '重新生成路径' }}
          </button>
        </div>
        <div class="card__body">
          <pre class="code-preview selectable">{{ JSON.stringify(varList, null, 2) }}</pre>
        </div>
      </div>

      <div class="step-actions">
        <button class="btn btn--secondary" @click="goStep(0)">上一步：修改需求</button>
        <button class="btn btn--primary" @click="onStep2GenHtml" :disabled="generating || varList.length === 0">
          {{ generating ? '生成中...' : '下一步：生成状态栏' }}
        </button>
      </div>
    </template>

    <!-- ==================== 第三步：状态栏预览 ==================== -->
    <template v-if="step === 2">
      <div class="card mb-md">
        <div class="card__body hint">
          预览中显示的是预填示例数据，实际运行时会用真实变量覆盖。
        </div>
      </div>

      <div class="card mb-md">
        <div class="card__header flex-between">
          <h3>状态栏预览</h3>
          <button class="btn btn--accent" @click="onStep2GenHtml" :disabled="generating">
            {{ generating ? '生成中...' : '重新生成状态栏' }}
          </button>
        </div>
        <div class="card__body">
          <iframe class="status-bar-iframe"
            :srcdoc="iframeSrcdoc"
            ref="previewIframe"
            @load="onIframeLoad"
            sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
      </div>

      <details class="card mb-md">
        <summary class="card__header" style="cursor:pointer"><h3>查看源码</h3></summary>
        <div class="card__body">
          <pre class="code-preview selectable">{{ htmlCode }}</pre>
        </div>
      </details>

      <div class="step-actions">
        <button class="btn btn--secondary" @click="goStep(statusMode === 'text' ? 0 : 1)">
          上一步：{{ statusMode === 'text' ? '修改需求' : '修改路径' }}
        </button>
        <button class="btn btn--primary" @click="onStep3Apply">确认并应用</button>
      </div>
    </template>

    <!-- ==================== 第四步：应用完成 ==================== -->
    <template v-if="step === 3">
      <div class="card mb-md">
        <div class="card__body" style="text-align:center;padding:32px">
          <h2 style="color:var(--cf-accent);margin-bottom:12px">状态栏应用完成</h2>
          <p style="color:var(--cf-text-secondary);line-height:1.8">{{ resultMsg }}</p>
        </div>
      </div>

      <div class="card mb-md">
        <div class="card__body hint" style="line-height:1.8">
          <strong>确认事项：</strong><br>
          · 酒馆助手渲染页面「启用渲染器」已打开，「启用代码折叠」设为「仅前端」<br>
          · 正则脚本中「状态栏美化」已启用<br>
          · 新开聊天后状态栏应出现在 AI 回复下方
        </div>
      </div>

      <div class="step-actions">
        <button class="btn btn--secondary" @click="goStep(0)">重新设计</button>
        <span></span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCardStore } from '../stores/card.js';
import { useApiStore } from '../stores/api.js';
import { useAppStore } from '../stores/app.js';
import { buildCardContext } from '../utils/card-context.js';
import { parseInitVarPaths } from '../utils/initvar-parse.js';

const cardStore = useCardStore();
const apiStore = useApiStore();
const appStore = useAppStore();

/* ========================================================================
   步骤导航
   ======================================================================== */

const steps = ['描述需求', '变量路径', '状态栏预览', '应用完成'];
const step = ref(0);
function goStep(n) { step.value = n; }

/* ========================================================================
   独立状态 — 每个步骤的产物各存各的，互不干扰
   ======================================================================== */

const statusMode = ref('mvu');
const style = ref('modern');
const layout = ref('grouped');
const extraReq = ref('');
const generating = ref(false);
const varList = ref([]);
const htmlCode = ref('');
const resultMsg = ref('');

const styleOptions = [
  { value: 'modern', label: '现代极简', desc: '蓝色调，圆角卡片，半透明' },
  { value: 'xiuxian', label: '仙侠古风', desc: '金色调，毛笔风格，玉简感' },
  { value: 'cyber', label: '赛博朋克', desc: '霓虹青绿，monospace，HUD感' },
  { value: 'dark', label: '暗黑奇幻', desc: '红黑配色，羊皮纸，哥特风' },
  { value: 'school', label: '校园清新', desc: '粉蓝柔和，圆润字体' },
  { value: 'custom', label: '自定义', desc: '用额外要求详细描述' }
];

const styleDesc = {
  modern: '现代极简风：蓝色调(#60a5fa)，圆角卡片(border-radius:10px)，半透明背景(rgba(10,10,25,0.65))，blur毛玻璃，无衬线字体',
  xiuxian: '仙侠古风：金色主调(#ffd700)，衬线字体(serif)，暗紫黑背景，标题加letter-spacing和金色发光阴影',
  cyber: '赛博朋克：青绿霓虹(#00e5ff)，monospace字体，HUD风格，方形边框，扫描线效果',
  dark: '暗黑奇幻：红黑配色(#e94560+#1a0a0a)，哥特衬线字体，羊皮纸纹理感，深红边框',
  school: '校园清新：粉蓝柔和(#a5b4fc+#fbcfe8)，圆润字体，柔和阴影',
  custom: '按用户额外要求中描述的风格设计'
};

const layoutDesc = {
  grouped: '分组面板：按变量组分块显示，每组有标题和子项',
  vertical: '竖向列表：每个变量独占一行，左侧标签右侧数值',
  grid: '网格布局：2-3列卡片，每个卡片显示一个变量',
  dashboard: '仪表盘：重要数值大字体居中，次要数值小字列表'
};

/* ========================================================================
   MVU 检测与路径收集
   ======================================================================== */

const hasMvu = computed(() =>
  cardStore.tavernScripts.some(s => s.content && s.content.includes('MagVarUpdate'))
  || cardStore.worldEntries.some(e => {
    const c = (e.comment || '').toLowerCase();
    return c.includes('initvar') || c.includes('变量初始化');
  })
);

const mvuPreview = computed(() => {
  const e = cardStore.worldEntries.find(e => {
    const c = (e.comment || '').toLowerCase();
    return c.includes('initvar') || c.includes('变量初始化');
  });
  return e ? (e.content || '(空)') : '(未找到)';
});

function collectExistingVars() {
  const saved = cardStore.cardData.extensions?.cfMvuVarGroups;
  if (Array.isArray(saved)) {
    const list = [];
    for (const g of saved) {
      if (!g.name) continue;
      for (const f of g.fields || []) {
        if (!f.name) continue;
        list.push({ group: g.name, field: f.name, type: f.type || 'string', default: String(f.defaultValue ?? '') });
      }
    }
    if (list.length > 0) return list;
  }
  const e = cardStore.worldEntries.find(e => {
    const c = (e.comment || '').toLowerCase();
    return c.includes('initvar') || c.includes('变量初始化');
  });
  return e ? parseInitVarPaths(e.content) : [];
}

/* ========================================================================
   第一步按钮：生成变量路径 / 加载已有路径 / 纯文本跳过
   ======================================================================== */

async function onStep1Next() {
  /* 纯文本模式不需要变量路径，直接跳到生成HTML */
  if (statusMode.value === 'text') {
    varList.value = [];
    step.value = 1; /* 跳到第二步但立刻触发生成HTML */
    await onStep2GenHtml();
    return;
  }

  /* 有已有MVU变量 → 直接加载 */
  const existingVars = collectExistingVars();
  if (existingVars.length > 0) {
    varList.value = existingVars;
    step.value = 1;
    appStore.toastSuccess(`已加载 ${existingVars.length} 个已有变量路径`);
    return;
  }

  /* 无MVU → AI生成变量清单 */
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  generating.value = true;
  try {
    const cardContext = buildCardContext(cardStore);
    const result = await apiStore.chat([
      { role: 'system', content: '你是角色卡变量系统设计师。根据角色卡和用户需求设计状态栏需要的变量路径。只输出JSON，不要说明文字。' },
      { role: 'user', content: buildVarListPrompt(cardContext) }
    ], { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

    const jsonMatch = result.match(/```json\s*\n([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : result.replace(/```[\w]*\s*\n?/g, '').replace(/```/g, '').trim();
    varList.value = JSON.parse(jsonText);
    step.value = 1;
    appStore.toastSuccess(`变量清单已生成（${varList.value.length} 个）`);
  } catch (e) {
    appStore.toastError('生成失败: ' + e.message);
  } finally { generating.value = false; }
}

/* ========================================================================
   第二步按钮：根据变量路径生成状态栏HTML
   ======================================================================== */

async function onStep2GenHtml() {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  generating.value = true;
  try {
    const cardContext = buildCardContext(cardStore);
    const prompt = statusMode.value === 'text'
      ? buildTextPrompt(cardContext)
      : buildHtmlPrompt(cardContext, varList.value);
    const maxTokens = apiStore.getModelMaxTokens(apiStore.activeProvider?.model);

    /* 第一次生成 */
    const result = await apiStore.chat([
      { role: 'system', content: '你是前端状态栏开发专家。严格按要求输出完整HTML代码，不要说明文字。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens });

    let html = extractHtml(result);

    /* 自动续写：如果HTML不完整（截断或缺少tab内容），最多重试3次 */
    const MAX_CONTINUE = 3;
    for (let i = 0; i < MAX_CONTINUE; i++) {
      if (isHtmlComplete(html)) break;

      /* 找出缺失的tab */
      const missingTabs = findMissingTabs(html);
      const issue = missingTabs.length > 0
        ? `缺少以下tab的内容div：${missingTabs.join('、')}。`
        : 'HTML缺少</body></html>结尾。';

      appStore.toastWarning(`${issue}自动续写中（${i + 1}/${MAX_CONTINUE}）...`);

      /* 如果有</html>但缺tab内容，需要去掉</body></html>再续写 */
      let htmlForContinue = html;
      if (html.includes('</html>') && missingTabs.length > 0) {
        htmlForContinue = html.replace(/<\/body>\s*<\/html>\s*$/, '').replace(/<\/html>\s*$/, '');
      }

      const contPrompt = missingTabs.length > 0
        ? `你上面输出的状态栏代码缺少了这些tab页面的内容div：${missingTabs.join('、')}。\n请只输出缺失的tab content div，接在已有代码末尾。变量路径、元素id和样式沿用最初的要求和已有代码，不要重复已有内容，不要输出<head>和<style>，最后以</div></body></html>结尾。`
        : '你上面输出的HTML代码被截断了，请从断点处继续输出剩余代码。变量路径、元素id和样式沿用最初的要求和已有代码，不要重复已有内容。';

      const contResult = await apiStore.chat([
        { role: 'system', content: '你是前端状态栏开发专家。继续输出缺失的HTML代码，不要说明文字。注释只用/* */。' },
        { role: 'user', content: prompt },
        { role: 'assistant', content: htmlForContinue },
        { role: 'user', content: contPrompt }
      ], { temperature: 0.3, maxTokens });
      const continued = extractHtml(contResult);
      if (!continued) break;

      if (html.includes('</html>') && missingTabs.length > 0) {
        /* 去掉旧的结尾，拼接新内容 */
        html = htmlForContinue + '\n' + continued;
      } else {
        html += '\n' + continued;
      }
    }

    htmlCode.value = cleanHtmlComments(html);

    if (!isHtmlComplete(htmlCode.value)) {
      appStore.toastWarning('HTML 仍未完整，建议简化需求后重试');
    }

    step.value = 2;
    appStore.toastSuccess('状态栏已生成，请预览');
  } catch (e) {
    appStore.toastError('生成失败: ' + e.message);
  } finally { generating.value = false; }
}

function extractHtml(result) {
  const text = result.trim();
  const htmlMatch = text.match(/```html\s*\n([\s\S]*?)```/);
  if (htmlMatch) return htmlMatch[1].trim();
  return text.replace(/```[\w]*\s*\n?/g, '').replace(/```/g, '').trim();
}

function cleanHtmlComments(html) {
  /* 清理body里的CSS风格注释，只清body内的，不动style和script内的 */
  const bodyMatch = html.match(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i);
  if (!bodyMatch) return html;
  const before = html.substring(0, html.indexOf(bodyMatch[0]));
  const bodyTag = bodyMatch[1];
  let bodyContent = bodyMatch[2];
  const bodyClose = bodyMatch[3];
  const after = html.substring(html.indexOf(bodyMatch[0]) + bodyMatch[0].length);
  /* 删除body内的CSS风格注释 */
  bodyContent = bodyContent.replace(/\/\*[\s\S]*?\*\//g, '');
  /* 清理多余空行 */
  bodyContent = bodyContent.replace(/\n{3,}/g, '\n\n');
  return before + bodyTag + bodyContent + bodyClose + after;
}

function findMissingTabs(html) {
  const targets = [];
  const re = /data-target=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) targets.push(m[1]);
  return targets.filter(t => !html.includes('id="' + t + '"') && !html.includes("id='" + t + "'"));
}

function isHtmlComplete(html) {
  if (!html.includes('</html>') && !html.includes('</body>')) return false;
  /* 检查tab完整性：每个data-target对应的content div是否存在 */
  const targets = [];
  const re = /data-target=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) targets.push(m[1]);
  if (targets.length > 0) {
    for (const t of targets) {
      if (!html.includes('id="' + t + '"') && !html.includes("id='" + t + "'")) return false;
    }
  }
  return true;
}

/* ========================================================================
   第三步按钮：应用到角色卡
   ======================================================================== */

function onStep3Apply() {
  if (!htmlCode.value) return;

  /* 检查是否有旧的状态栏正则 */
  const oldNames = ['状态栏美化', '状态栏', '前端状态栏渲染', '[隐藏]状态栏占位符',
    '[清理]旧楼层状态栏', '对AI隐藏状态数据'];
  const hasOld = cardStore.regexScripts.some(s => oldNames.includes(s.scriptName));

  if (hasOld) {
    appStore.confirmAction('已存在状态栏正则，是否替换？', () => doApply());
  } else {
    doApply();
  }
}

function doApply() {
  /* 清理旧正则 */
  const oldNames = ['状态栏美化', '状态栏', '前端状态栏渲染', '[隐藏]状态栏占位符',
    '[清理]旧楼层状态栏', '对AI隐藏状态数据'];
  for (let i = cardStore.regexScripts.length - 1; i >= 0; i--) {
    if (oldNames.includes(cardStore.regexScripts[i].scriptName))
      cardStore.removeRegexScript(cardStore.regexScripts[i].id);
  }
  /* 清理旧世界书 */
  for (let i = cardStore.worldEntries.length - 1; i >= 0; i--) {
    if ((cardStore.worldEntries[i].comment || '').includes('状态数据输出指令'))
      cardStore.removeWorldEntry(cardStore.worldEntries[i].id);
  }

  if (statusMode.value === 'text') {
    doApplyText();
  } else {
    doApplyMvu();
  }

  cardStore.markDirty();
  step.value = 3;
}

function doApplyMvu() {
  /* 1. 状态栏美化正则：markdownOnly(仅格式显示), runOnEdit=true, HTML用```包裹 */
  cardStore.addRegexScript({
    ...cardStore.createEmptyRegexScript(),
    scriptName: '状态栏美化',
    findRegex: '/<StatusPlaceHolderImpl\\s*\\/>/g',
    replaceString: '```html\n' + htmlCode.value + '\n```',
    markdownOnly: true,
    promptOnly: false
  });

  /* 2. 确保有[不发送]界面占位符正则 */
  if (!cardStore.regexScripts.some(s => s.scriptName === '[不发送]界面占位符')) {
    cardStore.addRegexScript({
      ...cardStore.createEmptyRegexScript(),
      scriptName: '[不发送]界面占位符',
      findRegex: '/<StatusPlaceHolderImpl\\s*\\/>/g',
      replaceString: '',
      markdownOnly: false,
      promptOnly: true
    });
  }

  /* 3. 确保开场白有占位符 */
  ensurePlaceholder();

  /* 4. 从变量清单同步创建MVU系统 */
  let mvuMsg = '';
  if (varList.value.length > 0) {
    mvuMsg = createMvuFromVarList(varList.value);
  }

  resultMsg.value = '状态栏美化正则已创建' + (mvuMsg ? '，' + mvuMsg : '');
  appStore.toastSuccess('状态栏已应用');
}

function doApplyText() {
  let html = htmlCode.value;
  html = html.replace(/<\/body>/, '<script type="module">window.__statusRawText=`$1`;<\/script>\n</body>');

  cardStore.addRegexScript({
    ...cardStore.createEmptyRegexScript(),
    scriptName: '状态栏',
    findRegex: '/<StatusData>([\\s\\S]*?)<\\/StatusData>/gm',
    replaceString: '```html\n' + html + '\n```',
    markdownOnly: true,
    promptOnly: false
  });

  cardStore.addRegexScript({
    ...cardStore.createEmptyRegexScript(),
    scriptName: '对AI隐藏状态数据',
    findRegex: '/<StatusData>[\\s\\S]*?<\\/StatusData>/gm',
    replaceString: '',
    markdownOnly: false,
    promptOnly: true,
    minDepth: 6
  });

  const entry = cardStore.addWorldEntry();
  entry.comment = '状态数据输出指令';
  entry.content = '状态数据输出规则:\n  - 每次回复结束后，必须在末尾追加 <StatusData> 块\n  - 格式为每行一个 "字段名:值"，冒号后紧跟值\n  - <StatusData> 块不出现在正文中\n\n输出格式示例:\n  <StatusData>\n  位置:某个地方\n  状态:正常\n  </StatusData>';
  entry.constant = true;
  entry.enabled = true;
  entry.position = 4;
  entry.insertion_order = 200;
  if (!entry.extensions) entry.extensions = {};
  entry.extensions.depth = 0;
  entry.extensions.prevent_recursion = true;
  entry.extensions.exclude_recursion = true;

  resultMsg.value = '纯文本状态栏已应用（2 正则 + 1 世界书指令条目）';
  appStore.toastSuccess('纯文本状态栏已应用');
}

/* ========================================================================
   从变量清单创建完整MVU系统
   ======================================================================== */

function createMvuFromVarList(list) {
  /* 转成varGroups格式 */
  const groupMap = {};
  for (const v of list) {
    const g = v.group || '其他';
    if (!groupMap[g]) groupMap[g] = [];
    groupMap[g].push({
      name: v.field || '', type: v.type || 'string',
      defaultValue: String(v.default ?? ''),
      min: null, max: null, clamp: false,
      enumValues: '', recordFields: '', description: '', showAdvanced: false
    });
  }
  const groups = Object.entries(groupMap).map(([name, fields]) => ({ name, fields }));

  /* 保存到cardData */
  if (!cardStore.cardData.extensions) cardStore.cardData.extensions = {};
  const saved = cardStore.cardData.extensions.cfMvuVarGroups;
  if (saved && saved.length > 0) {
    /* 合并：已有的保留，新的补充 */
    for (const ng of groups) {
      const existing = saved.find(g => g.name === ng.name);
      if (existing) {
        for (const nf of ng.fields) {
          if (!existing.fields.find(ef => ef.name === nf.name))
            existing.fields.push(JSON.parse(JSON.stringify(nf)));
        }
      } else {
        saved.push(JSON.parse(JSON.stringify(ng)));
      }
    }
  } else {
    cardStore.cardData.extensions.cfMvuVarGroups = JSON.parse(JSON.stringify(groups));
  }

  /* 检查是否已有MVU */
  const hasScripts = cardStore.tavernScripts.some(s => s.content && s.content.includes('MagVarUpdate'));
  const hasEntries = cardStore.worldEntries.some(e => (e.comment || '').includes('变量更新规则'));
  const finalGroups = cardStore.cardData.extensions.cfMvuVarGroups;

  if (hasScripts && hasEntries) {
    /* 已有MVU → 只补initvar */
    patchInitVar(finalGroups);
    return '已补充变量到 MVU';
  }

  /* 没有MVU → 创建完整套装 */

  /* 脚本1: MVU加载 */
  if (!hasScripts) {
    const s = cardStore.createEmptyTavernScript();
    s.name = 'MVU 变量系统';
    s.content = "import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';";
    s.button = { enabled: true, buttons: [
      { name: '重新处理变量', visible: true }, { name: '重新读取初始变量', visible: true },
      { name: '清除旧楼层变量', visible: false }, { name: '快照楼层', visible: false },
      { name: '重演楼层', visible: false }, { name: '重试额外模型解析', visible: false }
    ]};
    cardStore.addTavernScript(s);
  }

  /* 脚本2: Zod Schema */
  if (!cardStore.tavernScripts.some(s => (s.name || '').includes('Zod'))) {
    const s = cardStore.createEmptyTavernScript();
    s.name = 'Zod Schema';
    s.content = buildZodFromGroups(finalGroups);
    cardStore.addTavernScript(s);
  }

  /* 世界书条目通用配置 */
  const cfg = (entry, opts = {}) => {
    entry.constant = opts.constant !== undefined ? opts.constant : true;
    entry.enabled = opts.enabled !== undefined ? opts.enabled : true;
    entry.extensions.position = 4;
    entry.insertion_order = opts.order || 200;
    if (!entry.extensions) entry.extensions = {};
    entry.extensions.depth = 0;
    entry.extensions.prevent_recursion = true;
    entry.extensions.exclude_recursion = true;
  };

  /* initvar */
  if (!cardStore.worldEntries.some(e => (e.comment || '').toLowerCase().includes('initvar'))) {
    const e = cardStore.addWorldEntry();
    e.comment = '[initvar]变量初始化勿开';
    e.content = buildInitVarFromGroups(finalGroups);
    cfg(e, { constant: false, enabled: false });
  }

  /* 变量列表（不加[mvu_update]） */
  if (!cardStore.worldEntries.some(e => (e.comment || '').includes('变量列表'))) {
    const e = cardStore.addWorldEntry();
    e.comment = '变量列表';
    e.content = '---\n<status_current_variables>\n{{format_message_variable::stat_data}}\n</status_current_variables>';
    cfg(e);
  }

  /* [mvu_update]变量更新规则 */
  if (!cardStore.worldEntries.some(e => (e.comment || '').includes('变量更新规则'))) {
    const e = cardStore.addWorldEntry();
    e.comment = '[mvu_update]变量更新规则';
    e.content = buildRulesFromGroups(finalGroups);
    cfg(e);
  }

  /* [mvu_update]变量输出格式 — 固定模板 */
  if (!cardStore.worldEntries.some(e => (e.comment || '').includes('变量输出格式') && !(e.comment || '').includes('强调'))) {
    const e = cardStore.addWorldEntry();
    e.comment = '[mvu_update]变量输出格式';
    e.content = OUTPUT_FORMAT;
    cfg(e);
  }

  /* [mvu_update]变量输出格式强调 */
  if (!cardStore.worldEntries.some(e => (e.comment || '').includes('变量输出格式强调'))) {
    const e = cardStore.addWorldEntry();
    e.comment = '[mvu_update]变量输出格式强调';
    e.content = OUTPUT_EMPHASIS;
    cfg(e);
  }

  /* MVU正则 — 顺序：更新中 → 完整 → 只发送N楼 */
  const existingRegex = cardStore.regexScripts.map(r => r.scriptName);
  const mvuRegex = [
    { scriptName: '[美化]变量更新中', findRegex: '/<UpdateVariable>(?![\\s\\S]*<\\/UpdateVariable>)([\\s\\S]*)/gs',
      replaceString: '<details open style="background:rgba(0,0,0,0.15);border:1px solid rgba(100,200,255,0.15);border-radius:6px;padding:8px;margin:4px 0;font-size:12px"><summary style="cursor:pointer;color:#60a5fa">变量更新中...</summary><pre style="white-space:pre-wrap;color:#aaa;margin:4px 0">$1</pre></details>',
      markdownOnly: true, promptOnly: false },
    { scriptName: '[美化]完整变量完成', findRegex: '/<UpdateVariable>([\\s\\S]*?)<\\/UpdateVariable>/gs',
      replaceString: '<details style="background:rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px;margin:4px 0;font-size:12px"><summary style="cursor:pointer;color:#888">变量更新</summary><pre style="white-space:pre-wrap;color:#aaa;margin:4px 0">$1</pre></details>',
      markdownOnly: true, promptOnly: false },
    { scriptName: '只发送最新3楼的变量更新', findRegex: '/<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>/gm',
      replaceString: '', markdownOnly: false, promptOnly: true, minDepth: 6 }
  ];
  for (const r of mvuRegex) {
    if (!existingRegex.includes(r.scriptName))
      cardStore.addRegexScript({ ...cardStore.createEmptyRegexScript(), ...r });
  }

  return `自动创建了完整 MVU 系统（${list.length} 个变量）`;
}

/* ========================================================================
   辅助函数
   ======================================================================== */

function ensurePlaceholder() {
  const fm = cardStore.cardData.first_mes || '';
  if (!fm.includes('StatusPlaceHolderImpl'))
    cardStore.cardData.first_mes = fm + '\n<StatusPlaceHolderImpl/>';
  for (let i = 0; i < (cardStore.cardData.alternate_greetings || []).length; i++) {
    if (!cardStore.cardData.alternate_greetings[i].includes('StatusPlaceHolderImpl'))
      cardStore.cardData.alternate_greetings[i] += '\n<StatusPlaceHolderImpl/>';
  }
}

function patchInitVar(groups) {
  const initEntry = cardStore.worldEntries.find(e => {
    const c = (e.comment || '').toLowerCase();
    return c.includes('initvar') || c.includes('变量初始化');
  });
  if (!initEntry) return;
  let content = initEntry.content || '';
  for (const g of groups) {
    if (!g.name) continue;
    if (!content.includes(g.name + ':')) {
      content += '\n' + g.name + ':\n';
      for (const f of g.fields) {
        if (!f.name) continue;
        content += buildNestedYamlField(f, 1);
      }
    } else {
      for (const f of g.fields) {
        if (!f.name) continue;
        const leafName = f.name.includes('.') ? f.name.split('.').pop() : f.name;
        if (!content.includes(leafName)) {
          const idx = content.indexOf(g.name + ':') + (g.name + ':').length;
          content = content.slice(0, idx) + '\n' + buildNestedYamlField(f, 1) + content.slice(idx);
        }
      }
    }
  }
  initEntry.content = content;
}

function buildNestedYamlField(f, baseIndent) {
  const parts = f.name.split('.');
  let yaml = '';
  for (let i = 0; i < parts.length - 1; i++) {
    yaml += '  '.repeat(baseIndent + i) + parts[i] + ':\n';
  }
  const leaf = parts[parts.length - 1];
  const pad = '  '.repeat(baseIndent + parts.length - 1);
  const val = f.type === 'record' ? '{}' : f.type === 'number' ? (f.defaultValue || '0') : '"' + (f.defaultValue || '') + '"';
  yaml += pad + leaf + ': ' + val + '\n';
  return yaml;
}

function buildZodFromGroups(groups) {
  let code = "import { registerMvuSchema } from\n  'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';\n\nexport const Schema = z.object({\n";
  for (const g of groups) {
    if (!g.name) continue;
    code += '  ' + g.name + ': z.object({\n';
    const tree = {};
    for (const f of g.fields) {
      if (!f.name) continue;
      const parts = f.name.split('.');
      let node = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]]) node[parts[i]] = { __children: {} };
        node = node[parts[i]].__children;
      }
      const zt = f.type === 'number'
        ? 'z.coerce.number().prefault(' + (f.defaultValue || 0) + ')'
        : f.type === 'record'
          ? "z.record(z.string(), z.string().prefault('')).prefault({})"
          : "z.string().prefault('" + (f.defaultValue || '') + "')";
      node[parts[parts.length - 1]] = { __zod: zt };
    }
    code += zodTreeToCode(tree, 2);
    code += '  }).prefault({}),\n';
  }
  code += '});\n\n$(() => {\n  registerMvuSchema(Schema);\n});\n';
  return code;
}

function zodTreeToCode(tree, indent) {
  let code = '';
  const pad = '  '.repeat(indent);
  for (const [k, v] of Object.entries(tree)) {
    if (v.__zod) {
      code += pad + k + ': ' + v.__zod + ',\n';
    } else if (v.__children) {
      code += pad + k + ': z.object({\n';
      code += zodTreeToCode(v.__children, indent + 1);
      code += pad + '}).prefault({}),\n';
    }
  }
  return code;
}

function buildInitVarFromGroups(groups) {
  let yaml = '';
  for (const g of groups) {
    if (!g.name) continue;
    yaml += g.name + ':\n';
    const tree = {};
    for (const f of g.fields) {
      if (!f.name) continue;
      const parts = f.name.split('.');
      let node = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]] || typeof node[parts[i]] !== 'object' || node[parts[i]].__leaf) node[parts[i]] = {};
        node = node[parts[i]];
      }
      const val = f.type === 'record' ? '{}' : f.type === 'number' ? (f.defaultValue || '0') : '"' + (f.defaultValue || '') + '"';
      node[parts[parts.length - 1]] = { __leaf: true, val };
    }
    yaml += initVarTreeToYaml(tree, 1);
  }
  return yaml;
}

function initVarTreeToYaml(obj, indent) {
  let yaml = '';
  const pad = '  '.repeat(indent);
  for (const [k, v] of Object.entries(obj)) {
    if (v && v.__leaf) yaml += pad + k + ': ' + v.val + '\n';
    else yaml += pad + k + ':\n' + initVarTreeToYaml(v, indent + 1);
  }
  return yaml;
}

function buildRulesFromGroups(groups) {
  let text = '---\n变量更新规则:\n';
  for (const g of groups) {
    if (!g.name) continue;
    const fields = g.fields.filter(f => f.name && !f.name.startsWith('_'));
    if (fields.length === 0) continue;
    text += '  ' + g.name + ':\n';
    const subGroups = {};
    const topLevel = [];
    for (const f of fields) {
      const dotIdx = f.name.indexOf('.');
      if (dotIdx > 0) {
        const sub = f.name.substring(0, dotIdx);
        const leaf = f.name.substring(dotIdx + 1);
        if (!subGroups[sub]) subGroups[sub] = [];
        subGroups[sub].push({ leaf, type: f.type });
      } else {
        topLevel.push(f);
      }
    }
    for (const f of topLevel) {
      text += '    ' + f.name + ':\n';
      if (f.type !== 'string') text += '      type: ' + f.type + '\n';
      text += '      check:\n        - update when this value changes in the narrative\n';
    }
    for (const [sub, sFields] of Object.entries(subGroups)) {
      text += '    ' + sub + ':\n';
      text += '      ' + sFields.map(f => f.leaf).join(', ') + ':\n';
      text += '        check:\n          - update when this value changes in the narrative\n';
    }
  }
  return text;
}

/* ========================================================================
   AI Prompt 构建
   ======================================================================== */

function buildVarListPrompt(cardContext) {
  return `你是角色卡变量系统设计师。请为这张角色卡设计状态栏需要显示的变量路径。

【角色卡信息】
${cardContext}

${extraReq.value ? '【用户需求】\n' + extraReq.value + '\n\n' : ''}【设计流程 — 按此顺序思考】

第一步 数据盘点：通读角色卡全部内容，识别其中有哪些"会随剧情变化的动态数据"。
- 这张卡强调了什么独特系统？（修炼体系？经济系统？好感度机制？任务系统？装备系统？）
- 有哪些角色需要追踪状态？（主角、固定NPC、动态生成的NPC？）
- 世界状态中有什么需要记录？（时间、地点、天气、事件？）
- 用户要求显示哪些具体内容？
- 不要套模板。一张校园卡不需要HP/MP，一张修仙卡的境界和灵根比HP重要。

第二步 结构规划：将盘点出的数据组织成分组，考虑哪些适合分页/分tab显示。

第三步 路径设计：为每个变量确定 group（分组名）和 field（字段名）。
- group 是顶层分组（如：主角、伙伴1、NPC1、空岛、世界）
- field 是组内字段，嵌套用点分隔（如：货币.石质天元、装备.头部）
- group + field 组合后就是 stat_data. 之后的完整路径

【输出格式】
只输出 JSON 数组，用 \`\`\`json 代码块包裹：
[
  { "group": "主角", "field": "名称", "type": "string", "default": "" },
  { "group": "主角", "field": "货币.石质天元", "type": "number", "default": "0" },
  { "group": "主角", "field": "装备.头部", "type": "string", "default": "" },
  { "group": "伙伴1", "field": "名字", "type": "string", "default": "未结识" },
  { "group": "伙伴1", "field": "好感度", "type": "number", "default": "0" },
  ...
]

只输出JSON，不要任何说明文字。`;
}

function buildHtmlPrompt(cardContext, list) {
  /* 根据变量清单生成populateCharacterData里的读取代码示例 */
  const getLines = list.map(v => {
    const path = 'stat_data.' + v.group + (v.field ? '.' + v.field : '');
    const def = v.type === 'number' ? (v.default || '0') : "'" + (v.default || '--') + "'";
    const id = (v.field ? v.group + '-' + v.field : v.group).replace(/\./g, '-').toLowerCase();
    if (v.type === 'record' || v.type === 'array') {
      return '      /* ' + path + ' 是' + (v.type === 'record' ? '键值对象' : '数组') + '，遍历后把每一项渲染进 #' + id + ' */';
    }
    return '      $("#' + id + '").text(_.get(all_variables, \'' + path + '\', ' + def + '));';
  }).join('\n');

  return `根据以下变量路径，生成前端状态栏HTML代码。

【角色卡信息】
${cardContext}

【变量路径清单 — 必须使用且仅使用这些路径】
${JSON.stringify(list, null, 2)}

【设计要求】
- 视觉风格：${styleDesc[style.value]}
- 布局：${layoutDesc[layout.value]}
${extraReq.value ? '- 用户需求：' + extraReq.value : ''}

【完整参考模板 — 严格按此结构编写，不可省略任何部分】
` + '```html\n<!doctype html>\n<html lang="zh-CN">\n<head>\n  <style>\n  body {\n    margin: 0;\n    padding: 0;\n  }\n\n  /* 在这里根据用户要求的视觉风格自由设计样式 */\n  </style>\n  <script type="module">\n    function populateCharacterData() {\n      const all_variables = getAllVariables();\n\n      /* 用 _.get(all_variables, \'stat_data.路径\', 默认值) 读取每个变量 */\n      /* 用 $(\'#id\').text(value) 更新每个元素 */\n' + getLines + '\n    }\n\n    async function init() {\n      await waitGlobalInitialized(\'Mvu\');\n      populateCharacterData();\n\n      /* 监听变量更新事件，实现自动刷新 */\n      eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {\n        populateCharacterData();\n      });\n\n      $("[data-target]").on("click", function () {\n        const target = $(this).data("target");\n        $("[data-target]").removeClass("active");\n        $(this).addClass("active");\n        $(".tab-content, [data-tab-content]").removeClass("active");\n        $("#" + target).addClass("active");\n      });\n    }\n\n    $(errorCatched(init));\n  </' + 'script>\n</' + 'head>\n<body>\n  <!-- 在这里根据用户要求的布局设计HTML结构 -->\n  <!-- 每个需要显示的变量必须有唯一的 id，在 populateCharacterData 中用 $(\'#id\').text(value) 填充 -->\n  <!-- 预填值为 0 或 "--" -->\n</' + 'body>\n</' + 'html>\n```\n' + `

【重要提示】
- 必须根据用户要求的风格自由设计CSS样式
- 可以直接使用 jquery/$、lodash/_、toastr，无需额外导入
- 禁止使用 Mvu.watch 等不存在的接口
- <style>和<script>内只用 /* 注释 */，禁止 // 注释。HTML body内用 <!-- 注释 --> 或不写注释，禁止在body内写 /* */（会显示成可见文字）
- 禁止使用 vh 单位，用 width 和 aspect-ratio 让高度根据宽度动态调整
- 避免使用 min-height、overflow: auto
- 页面不要用 position: absolute 脱离文档流
- 页面整体应适配容器宽度，不产生横向滚动条
- 如果样式更适合卡片形状，则不要有背景颜色，除非用户有明确要求
- 必须输出完整的 </body></html> 结尾
- 如果使用 tab 切换：按钮必须用 class="tab-btn"，内容区必须用 class="tab-content"，按钮的 data-target="X" 必须等于对应内容 div 的 id="X"，禁止用其他命名（否则模板里的 JS 切换逻辑会失效）。每个 tab 按钮都必须有对应内容 div，禁止只写按钮不写内容
- CSS尽量简洁复用class，不要为每个tab单独写大段重复样式

用 \`\`\`html 代码块包裹，只输出代码，不要说明文字。`;
}

function buildTextPrompt(cardContext) {
  return `生成纯文本模式的状态栏。数据来源是 AI 每次回复末尾输出的 <StatusData> 标签。

【角色卡信息】
${cardContext}

【设计要求】
- 视觉风格：${styleDesc[style.value]}
- 布局：${layoutDesc[layout.value]}
${extraReq.value ? '- 用户需求：' + extraReq.value : ''}

【完整参考模板 — 严格按此结构编写】
` + '```html\n<!doctype html>\n<html lang="zh-CN">\n<head>\n  <style>\n  body { margin: 0; padding: 0; }\n  /* 根据用户要求设计样式 */\n  </style>\n  <script type="module">\n    function parseAndDisplay() {\n      const raw = window.__statusRawText || "";\n      const lines = raw.trim().split("\\n").filter(Boolean);\n      const data = {};\n      lines.forEach(l => {\n        const i = l.indexOf(":");\n        if (i > 0) data[l.slice(0, i).trim()] = l.slice(i + 1).trim();\n      });\n      if (Object.keys(data).length > 0) {\n        for (const [k, v] of Object.entries(data)) {\n          const el = document.getElementById("st-" + k);\n          if (el) el.textContent = v;\n        }\n      }\n    }\n    parseAndDisplay();\n  </' + 'script>\n</' + 'head>\n<body>\n  <div id="st-panel">\n    <!-- 每个字段一行，预填值为 "--" -->\n  </div>\n</' + 'body>\n</' + 'html>\n```\n' + `

【重要提示】
- 仅能使用 /* 注释 */，禁止 //
- body必须 margin:0; padding:0
- 必须输出完整的 </body></html> 结尾

用 \`\`\`html 代码块包裹，只输出代码。`;
}

/* ========================================================================
   固定模板
   ======================================================================== */

const OUTPUT_FORMAT = `---
变量输出格式:
  rule:
    - you must output the update analysis and the actual update commands at once in the end of the next reply
    - the update commands works like the **JSON Patch (RFC 6902)** standard, must be a valid JSON array containing operation objects, but supports the following operations instead:
      - replace: replace the value of existing paths
      - delta: update the value of existing number paths by a delta value
      - insert: insert new items into an object or array (using \`-\` as array index intends appending to the end)
      - remove
      - move
    - don't update field names starts with \`_\` as they are readonly, such as \`_变量\`
  format: |-
    <UpdateVariable>
    <Analysis>$(IN CHINESE, no more than 400 words)
    - \${calculate time passed: ...}
    - \${decide whether dramatic updates are allowed as it's in a special case or the time passed is more than usual: yes/no}
    - \${analyze every variable based on its corresponding \`check\`, according only to current reply instead of previous plots: ...}
    </Analysis>
    <JSONPatch>
    [
      { "op": "replace", "path": "\${/path/to/variable}", "value": "\${new_value}" },
      { "op": "delta", "path": "\${/path/to/number/variable}", "value": "\${positive_or_negative_delta}" },
      { "op": "insert", "path": "\${/path/to/object/new_key}", "value": "\${new_value}" },
      { "op": "insert", "path": "\${/path/to/array/-}", "value": "\${new_value}" },
      { "op": "remove", "path": "\${/path/to/object/key}" },
      { "op": "remove", "path": "\${/path/to/array/0}" },
      { "op": "move", "from": "\${/path/to/variable}", "to": "\${/path/to/another/path}" },
      ...
    ]
    </JSONPatch>
    </UpdateVariable>`;

const OUTPUT_EMPHASIS = `---
变量输出格式强调:
  rule: The following must be inserted to the end of reply, and cannot be omitted
  format: |-
    <UpdateVariable>
    ...
    </UpdateVariable>`;

/* ========================================================================
   iframe 预览
   ======================================================================== */

const previewIframe = ref(null);
const iframeSrcdoc = computed(() => htmlCode.value || '');

function onIframeLoad() {
  setTimeout(() => {
    try {
      const iframe = previewIframe.value;
      if (!iframe?.contentDocument?.body) return;
      iframe.style.height = Math.max(150, Math.min(iframe.contentDocument.body.scrollHeight + 24, 800)) + 'px';
    } catch { /* 跨域忽略 */ }
  }, 100);
}
</script>

<style scoped>
.step-nav { display: flex; gap: 4px; }
.step-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 20px;
  background: rgba(0,0,0,0.15); border: 1px solid var(--cf-border);
  color: var(--cf-text-muted); font-size: 12px; cursor: pointer; transition: all 0.2s;
}
.step-btn:hover { border-color: rgba(255,215,0,0.3); }
.step-btn.active { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.5); color: #ffd700; }
.step-btn.done { background: rgba(100,200,100,0.1); border-color: rgba(100,200,100,0.4); color: #8fc; }
.step-num {
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.08); font-weight: 600; font-size: 11px;
}
.step-btn.active .step-num { background: rgba(255,215,0,0.25); }
.step-btn.done .step-num { background: rgba(100,200,100,0.25); }
.step-actions {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0; margin-top: 8px;
}
.style-card {
  display: flex; flex-direction: column; gap: 4px;
  padding: 12px 14px; border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm); cursor: pointer;
  background: rgba(0,0,0,0.08); transition: all 0.2s;
  strong { font-size: 13px; color: var(--cf-text-primary); }
  span { font-size: 11px; color: var(--cf-text-muted); }
  &:hover { border-color: rgba(255,215,0,0.4); background: rgba(255,215,0,0.04); }
  &.active {
    border-color: rgba(255,215,0,0.6); background: rgba(255,215,0,0.08);
    box-shadow: 0 0 12px rgba(255,215,0,0.15);
    strong { color: #ffd700; }
  }
}
.status-bar-iframe {
  width: 100%; min-height: 150px; height: 350px;
  background: rgba(0,0,0,0.2); border: 1px solid rgba(255,215,0,0.2);
  border-radius: var(--cf-radius-sm); display: block;
}
.code-preview {
  font-family: var(--cf-font-mono); font-size: 12px; line-height: 1.6;
  color: var(--cf-text-primary); white-space: pre-wrap; word-wrap: break-word;
  background: rgba(0,0,0,0.15); border-radius: var(--cf-radius-sm);
  padding: 12px; margin: 0; max-height: 400px; overflow-y: auto;
}
</style>
