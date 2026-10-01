import{$ as e,A as t,C as n,F as r,M as i,O as a,T as o,a as s,c,d as l,et as ee,f as u,h as d,j as f,l as p,t as te,tt as m,u as ne,x as re}from"./app-Cd1I7MXh.js";import{a as h,n as g,o as _}from"./runtime-dom.esm-bundler-C5vljRIB.js";import{t as ie}from"./card-O4uKpNGl.js";import{t as ae}from"./plugin-vue_export-helper-DKl4mWgK.js";import{t as oe}from"./api-BzPMTnBs.js";import{r as v,u as y}from"./npc-checker-BhhnmB1N.js";import{n as b,t as se}from"./json-repair-dNPF_vYh.js";import{t as ce}from"./WorldEntryCard-Bx43A2IY.js";var x=[{key:`character`,label:`角色`,desc:`5 种轨迹（境界/位置/物品/关系/行为模式）`},{key:`eventline`,label:`事件线`,desc:`主线/支线/暗线/伏笔，含起因/经过/结果`},{key:`timeline`,label:`时间线`,desc:`阶段+时间标记+境界状态`},{key:`setting`,label:`设定`,desc:`功法/丹药/地理/势力/世界观常识`},{key:`item_trajectory`,label:`物品轨迹`,desc:`获得章节+消耗章节，不存当前持有`}],S={major_characters:0,minor_characters:15,main_storylines:0,side_storylines_total:10,techniques:10,pills:10,geo_factions:10,worldview_per_subsystem:1},le=[{value:`replace`,label:`替代主角（{{user}} 就是小说主角）`,desc:`适合穿越同人——玩家代入主角`},{value:`npc`,label:`独立角色（主角作为 NPC，{{user}} 是另一个人）`,desc:`适合剧情体验——玩家跟主角互动`}],ue=`## 写作铁律（必须严格遵守）

### 一、绝对零度 + 白描手法
- 客观叙述，不带主观判断
- 用具体行为代替抽象描述："她很温柔" ✗ → "遇到受伤的小动物会带回家照顾" ✓
- 用语料展现性格，禁止"温柔地说""带着不耐烦的口吻"
- 不堆砌无意义形容词

### 二、八股化禁令
禁止使用：
- 模糊词：似乎、几乎、仿佛、宛如、好像
- 八股微表情：嘴角微微上扬、眼里闪过一丝XX、指尖微微泛白
- 语气描写：带着xx的口吻、用xx的语气
- 极端情绪词：陷入极大的恐惧、极度羞耻、万念俱灰
- 否定转折句：不是...而是...
- 性格标签化："她很温柔""他很善良"
- 万能美人描写：精致的脸蛋、白皙的皮肤、桃花眼、柳叶眉

### 三、章节号锚定（必须）
**所有事实必须标注章节号**：
- 原文有"第X章"/"第X话"/"Chapter X" → 用对应章节号（统一格式 "第X章"）
- 无明确章节标题 → 写 "未明确章节"
- 禁止凭空虚构章节号

### 四、关系/行为禁标签
描述关系/行为时**禁止抽象标签**，必须用"该角色在哪一章做了什么"：
- ✗ "深爱、忠诚、百依百顺"
- ✓ "第10章主动借钱不要求归还、第52章趁对方睡着输送灵力"
- ✗ "性格温和"
- ✓ "面对挑衅以年龄差距化解而非正面冲突（第13章）"

### 五、事件线类型限定
事件线类型仅四值：**主线 / 支线 / 暗线 / 伏笔**。禁止自定义类型（如"人物关系变化线"）。
`;function de(e,t){let n=t||`(主角名未指定)`;return e===`replace`?`## 主角处理（用户已选：{{user}} 替代主角）
- 小说原文里的"${n}" = {{user}}（玩家代入主角）
- 所有"角色对主角的关系" → 写成"对 {{user}} 的关系"
- 主角本身不需要单独成条目（玩家就是主角）
- 角色条目里写"与 {{user}} 的关系：[具体行为+章节号]"`:`## 主角处理（用户已选：主角作为 NPC）
- 小说原文里的"${n}" 作为 NPC 写完整条目（含 5 种轨迹）
- {{user}} 不出现在提取结果里（玩家在 SillyTavern 自己定身份）
- 所有角色关系按原文写（如"对${n}的态度"），不要主动改成"对 {{user}}"`}var fe=`## 任务：提取小说中的角色

按"5 种轨迹"逐角色输出。区分：
- **重要角色**（major）：出场 ≥ 5 章 + 跟主角有具体互动 + 在事件线经过节点中出现
- **次要角色**（minor）：出场 ≥ 3 章 OR 在事件线经过节点出现 OR 跟主角有过具体互动 —— 上限 ${S.minor_characters} 条（按重要性取 TOP）
- **路人角色**：不收录

## 输出格式（JSON 数组，每个元素是一个角色）

\`\`\`json
[
  {
    "name": "角色名",
    "role": "major" 或 "minor",
    "first_chapter": "第X章",
    "last_chapter": "第Y章",
    "basic": {
      "身份": "如：某宗派外门弟子",
      "年龄": "如：16岁",
      "性别": "男/女/其他"
    },
    "appearance": "外貌特征（只写偏离 AI 默认认知的，禁万能美人描写）",
    "tracks": {
      "境界": [
        { "chapter": "第X章", "state": "等级一阶（按原作的等级体系填）", "evidence": "原文摘录关键句" }
      ],
      "位置": [
        { "chapter": "第X章", "location": "宗门藏经阁" }
      ],
      "物品": [
        { "chapter": "第X章", "action": "获得", "item": "祖传宝剑（示例）", "source": "宗门赏赐" }
      ],
      "关系": [
        { "target": "对方角色名",
          "behaviors": [
            { "chapter": "第X章", "behavior": "具体行为（原文摘录）", "context": "[语境短句]" }
          ],
          "summary": "互动特征（基于行为总结，不用抽象标签）",
          "boundary": "原著中明确没发展到的程度"
        }
      ],
      "行为模式": [
        { "stage": "阶段名（如：入门初期）",
          "range": "第1-10章",
          "dialogues": ["原文台词1（含章节号）", "原文台词2"],
          "decisions": "面对选择时的具体行为模式（用具体事件，禁抽象概括）"
        }
      ]
    }
  }
]
\`\`\`

${y}

只输出 JSON 数组，不要其他文字。
`,pe=`## 任务：提取小说中的事件线

按事件线整理剧情。**事件线类型仅四值**：主线 / 支线 / 暗线 / 伏笔。

筛选数字：
- **主线**：不限（全部保留）
- **支线 + 暗线 + 伏笔**：合计 ${S.side_storylines_total} 条（按重要性取 TOP）
- 「重要」标准：经过节点 ≥ 2 个 + 涉及至少一个重要角色 + 有"后续影响"

## 输出格式

\`\`\`json
[
  {
    "name": "事件线名（如：主角初次见配角）",
    "type": "主线" 或 "支线" 或 "暗线" 或 "伏笔",
    "cause": {
      "chapter": "第X章",
      "summary": "起因一句话",
      "dialogue": "代表性台词（原文）——[语境短句]"
    },
    "passages": [
      {
        "chapter": "第X章",
        "node": "节点描述（如：配角主动伸援）",
        "location": "地点",
        "key_characters": ["角色1", "角色2"],
        "dialogue": "代表性台词（原文）——[语境短句]"
      }
    ],
    "result": {
      "chapter": "第X章",
      "summary": "结果一句话",
      "dialogue": "代表性台词（原文）——[语境短句]"
    },
    "follow_up": "对后续的伏笔/影响（无则空字符串）"
  }
]
\`\`\`

${y}

只输出 JSON 数组，不要其他文字。
`,me=`## 任务：提取小说时间线主干

按"阶段"切分，每阶段包含时间标记 + 章节范围 + 主角境界状态。

## 输出格式

\`\`\`json
[
  {
    "stage_name": "阶段名（如：拜师初期）",
    "chapter_range": "第1-15章",
    "time_markers": [
      { "chapter": "第X章", "raw": "原文时间表述（如：闭关三个月后）", "annotation": "推算说明（如：约3个月后）" }
    ],
    "summary": "100 字以内本阶段概括",
    "protagonist_status": "本阶段结束时主角等级状态（按原作的等级体系填）"
  }
]
\`\`\`

时间标记规则：
- 含具体数字（X年/X月/X天/X岁）+ 描述"已发生事实距离"或"主角当前年龄"才收
- **不收**：未来预测、约定、纯世界观历史、人物履历回顾、他人年龄推测

${y}

只输出 JSON 数组，不要其他文字。
`,he=`## 任务：提取小说世界观设定

分子类输出。**严格筛选，不要全提取**：
- **功法/斗技**：上限 ${S.techniques} 条（必须主角使用 ≥ 2 次 OR 主线/支线关键道具）
- **丹药**：上限 ${S.pills} 条（同上标准）
- **地理/势力**：上限 ${S.geo_factions} 条（合计，原文反复提及 ≥ 3 次的）
- **世界观常识**：每子系统 1 条说清楚（境界体系/货币体系/职业体系等）

## 输出格式

\`\`\`json
[
  {
    "subtype": "功法",
    "name": "破云剑（示例）",
    "level": "玄阶低品",
    "user": "主角",
    "first_chapter": "第X章",
    "effect": "效果描述（原文摘录关键句）"
  },
  {
    "subtype": "丹药",
    "name": "凝元丹（示例）",
    "grade": "三品",
    "refiner": "炼药师",
    "first_chapter": "第X章",
    "effect": "..."
  },
  {
    "subtype": "地理",
    "name": "青风城（示例）",
    "first_chapter": "第X章",
    "description": "城池描述"
  },
  {
    "subtype": "势力",
    "name": "玄阳宗（示例）",
    "first_chapter": "第X章",
    "description": "势力描述 + 跟主角的关系"
  },
  {
    "subtype": "世界观常识",
    "name": "等级体系",
    "description": "按原作的等级体系填写完整说明（修仙类如练气→筑基；都市类如 D级→C级；游戏类如 1阶→2阶 等）"
  }
]
\`\`\`

subtype 严格五值：功法 / 丹药 / 地理 / 势力 / 世界观常识

${y}

只输出 JSON 数组，不要其他文字。
`,ge=`## 任务：提取小说中的物品流转轨迹

只追踪**对主角或核心剧情有意义的物品**——主角持有的关键道具、传家宝、剧情触发器物品。
**不追踪**：消耗品（基础丹药）、低价值物品（金币）、纯设定物品（功法本身）。

## 关键规则
**只存"获得章节"和"消耗章节"，不存"当前持有"快照** ——
RP 时根据当前章节 N 动态判定：获得章节 ≤ N 且无消耗记录 → 持有。

## 输出格式

\`\`\`json
[
  {
    "item_name": "玄铁剑（示例）",
    "owner": "主角",
    "events": [
      { "chapter": "第X章", "action": "获得", "source": "拍卖会购得", "evidence": "原文摘录" },
      { "chapter": "第Y章", "action": "消耗", "destination": "炼制成丹", "evidence": "原文摘录" }
    ]
  }
]
\`\`\`

action 严格三值：**获得 / 消耗 / 转赠**

${y}

只输出 JSON 数组，不要其他文字。
`,C=`## 任务：自检上一步提取结果

逐条检查并修正：

1. **章节号锚定**：每个事实是否标了章节号？无章节标题原文应该写"未明确章节"，禁止编造章节号
2. **关系/行为标签化**：是否含"温顺乖巧""真诚信赖""嫉妒驱动"等抽象标签？有 → 改成具体行为+章节号
3. **八股化**：是否含"似乎/仿佛/嘴角微微上扬/她很温柔"？有 → 改成白描
4. **万能美人描写**：外貌是否含"精致脸蛋/白皙皮肤"？有 → 改成具体特征或删掉
5. **事件线类型**：是否含非四值的类型（如"人物关系变化线"）？有 → 强制归到四值之一
6. **代表性台词归属**：每条台词的说话人是否确实是该角色本人？

输出修正后的完整 JSON 数组（同样的字段结构），不输出修订过程。

${y}
`,_e=`## R2 视角偏移指令（补充主任务）

本次提取为"R2 双跑"——补充 R1 可能遗漏的内容：
1. **行为模式台词偏向后 50% 章节**（前 50% 仅在缺乏代表性样本时选）
2. **额外关注次要角色与主角的渐进式互动模式**（如某角色对主角态度从冷淡到热情）
3. **补充商业竞争 / 势力博弈 / 跨章渐进互动 等容易遗漏的事件线**

主任务的字段格式不变，只是选取角度偏移。
`;`${y}`;function ve(){return{characters:[],eventlines:[],timeline:[],settings:[],item_trajectories:[]}}function ye(){return{novelName:``,chapterName:``,protagonistName:``,userMode:`replace`,enableR2DoubleCheck:!1,enableContinuationSummary:!1,chunkStrategy:`auto`,chaptersPerChunk:5,wordsPerChunk:1e4,chapterRangeStart:1,chapterRangeEnd:0,selectedTypes:[`character`,`eventline`,`timeline`,`setting`,`item_trajectory`]}}var w=/(?=^[\s]*(?:第[一二三四五六七八九十百千零\d]+[章话节卷話章節]|Chapter\s+\d+|Episode\s+\d+|Part\s+\d+|Scene\s+\d+|序章|プロローグ|Prologue|Epilogue|尾声))/m;function be(e,t={}){let n=t.strategy||`auto`,r=t.chaptersPerChunk||5,i=t.wordsPerChunk||1e4;if(!e||!e.trim())return{strategy:`words`,chunks:[],totalChapters:0,fallback:!1};if(n===`auto`||n===`chapter`){let t=T(e);if(t.length>=3||n===`chapter`)return{strategy:`chapter`,chunks:E(t,r),totalChapters:t.length,fallback:!1}}return{strategy:`words`,chunks:D(e,i),totalChapters:0,fallback:n===`auto`}}function T(e){return e.split(new RegExp(w.source,`gm`)).filter(e=>e&&e.trim().length>50)}function E(e,t){let n=[];for(let r=0;r<e.length;r+=t){let i=e.slice(r,r+t);n.push(i.join(`

`))}return n.length>0?n:[e.join(`

`)]}function D(e,t){let n=[],r=e.length;for(let i=0;i<r;i+=t){let a=Math.min(i+t,r);if(a<r){let t=e.slice(a-200,a).match(/.*[。！？\n]/);t&&(a=a-200+t.index+t[0].length)}if(n.push(e.slice(i,a)),a>=r)break}return n.length>0?n:[e]}function xe(e,t){let n=[],r=e.characters||[],i=r.filter(e=>e.role===`major`).length>1,a=t.chapterName||``,o=a?`[${a}] `:``;for(let e of r.filter(e=>e.role===`major`))n.push(O({comment:`${o}角色·${e.name}`,keys:[e.name],content:A(e),constant:!i,selective:i,position:i?`after_char`:`before_char`}));for(let e of r.filter(e=>e.role===`minor`))n.push(O({comment:`${o}次要角色·${e.name}`,keys:[e.name],content:A(e),constant:!1,selective:!0,position:`after_char`}));for(let t of e.eventlines||[]){let e=t.type===`主线`;n.push(O({comment:`${o}事件线·${t.type}·${t.name}`,keys:k(t),content:j(t),constant:e,selective:!e,position:e?`before_char`:`after_char`}))}for(let t of e.timeline||[])n.push(O({comment:`${o}时间线·${t.stage_name}`,keys:[],content:Se(t),constant:!0,selective:!1,position:`before_char`}));for(let t of e.settings||[])n.push(O({comment:`${o}设定·${t.subtype}·${t.name}`,keys:[t.name],content:M(t),constant:!1,selective:!0,position:`after_char`}));for(let t of e.item_trajectories||[])n.push(O({comment:`${o}物品·${t.item_name}`,keys:[t.item_name],content:N(t),constant:!1,selective:!0,position:`after_char`}));return n}function O({comment:e,keys:t,content:n,constant:r,selective:i,position:a}){return{comment:e,keys:t.filter(Boolean),secondary_keys:[],content:n,constant:r,selective:i,enabled:!0,position:a,insertion_order:100,extensions:{position:a===`before_char`?0:1,depth:4,exclude_recursion:!0,prevent_recursion:!r,probability:100,useProbability:!0,selectiveLogic:0,group:``,group_weight:100}}}function k(e){let t=[e.name];for(let n of e.passages||[])Array.isArray(n.key_characters)&&t.push(...n.key_characters.slice(0,3));return[...new Set(t.filter(Boolean))]}function A(e){let t=[];if(t.push(`角色: ${e.name||`(未命名)`}`),e.role&&t.push(`类型: ${e.role===`major`?`重要角色`:`次要角色`}`),e.first_chapter&&t.push(`首次出场: ${e.first_chapter}`),e.last_chapter&&t.push(`最后出场: ${e.last_chapter}`),e.basic&&typeof e.basic==`object`){t.push(`基础信息:`);for(let[n,r]of Object.entries(e.basic))r&&t.push(`  ${n}: ${P(r)}`)}e.appearance&&t.push(`外貌特征: ${P(e.appearance)}`);let n=e.tracks||{};if(Array.isArray(n.境界)&&n.境界.length){t.push(`境界轨迹:`);for(let e of n.境界)t.push(`  - [${e.chapter||`未明确章节`}] ${P(e.state||``)}${e.evidence?`（`+P(e.evidence)+`）`:``}`)}if(Array.isArray(n.位置)&&n.位置.length){t.push(`位置轨迹:`);for(let e of n.位置)t.push(`  - [${e.chapter||`未明确章节`}] ${P(e.location||``)}`)}if(Array.isArray(n.物品)&&n.物品.length){t.push(`物品轨迹:`);for(let e of n.物品)t.push(`  - [${e.chapter||`未明确章节`}] ${P(e.action||``)} ${P(e.item||``)}${e.source?`（来源: `+P(e.source)+`）`:``}${e.destination?`（去向: `+P(e.destination)+`）`:``}`)}if(Array.isArray(n.关系)&&n.关系.length){t.push(`关系:`);for(let e of n.关系){if(t.push(`  与 ${P(e.target||`(未指定)`)}:`),Array.isArray(e.behaviors)&&e.behaviors.length)for(let n of e.behaviors)t.push(`    - [${n.chapter||`未明确章节`}] ${P(n.behavior||``)}${n.context?` `+P(n.context):``}`);e.summary&&t.push(`    互动特征: ${P(e.summary)}`),e.boundary&&t.push(`    原著边界: ${P(e.boundary)}`)}}if(Array.isArray(n.行为模式)&&n.行为模式.length){t.push(`行为模式:`);for(let e of n.行为模式){if(t.push(`  ${P(e.stage||`阶段`)}（${P(e.range||`未明确`)}）:`),Array.isArray(e.dialogues)&&e.dialogues.length){t.push(`    台词:`);for(let n of e.dialogues)t.push(`      - ${P(n)}`)}e.decisions&&t.push(`    决策倾向: ${P(e.decisions)}`)}}return t.join(`
`)}function j(e){let t=[];if(t.push(`事件线: ${e.name||`(未命名)`}`),t.push(`类型: ${e.type||`支线`}`),e.cause&&(t.push(`起因:`),t.push(`  章节: ${e.cause.chapter||`未明确章节`}`),e.cause.summary&&t.push(`  概括: ${P(e.cause.summary)}`),e.cause.dialogue&&t.push(`  代表性台词: ${P(e.cause.dialogue)}`)),Array.isArray(e.passages)&&e.passages.length){t.push(`经过:`);for(let n=0;n<e.passages.length;n++){let r=e.passages[n];t.push(`  ${n+1}. [${r.chapter||`未明确章节`}] ${P(r.node||``)}`),r.location&&t.push(`     地点: ${P(r.location)}`),Array.isArray(r.key_characters)&&r.key_characters.length&&t.push(`     关键人物: ${r.key_characters.map(P).join(`、`)}`),r.dialogue&&t.push(`     代表性台词: ${P(r.dialogue)}`)}}return e.result&&(t.push(`结果:`),t.push(`  章节: ${e.result.chapter||`未明确章节`}`),e.result.summary&&t.push(`  概括: ${P(e.result.summary)}`),e.result.dialogue&&t.push(`  代表性台词: ${P(e.result.dialogue)}`)),e.follow_up&&t.push(`后续影响: ${P(e.follow_up)}`),t.join(`
`)}function Se(e){let t=[];if(t.push(`时间线阶段: ${e.stage_name||`(未命名)`}`),e.chapter_range&&t.push(`章节范围: ${e.chapter_range}`),Array.isArray(e.time_markers)&&e.time_markers.length){t.push(`时间标记:`);for(let n of e.time_markers)t.push(`  - [${n.chapter||`未明确章节`}] ${P(n.raw||``)}${n.annotation?`（`+P(n.annotation)+`）`:``}`)}return e.summary&&t.push(`概括: ${P(e.summary)}`),e.protagonist_status&&t.push(`主角状态: ${P(e.protagonist_status)}`),t.join(`
`)}function M(e){let t=[];return t.push(`${e.subtype||`设定`}: ${e.name||`(未命名)`}`),e.level&&t.push(`等级: ${P(e.level)}`),e.grade&&t.push(`品级: ${P(e.grade)}`),e.user&&t.push(`使用者: ${P(e.user)}`),e.refiner&&t.push(`炼制者: ${P(e.refiner)}`),e.first_chapter&&t.push(`首次出现: ${e.first_chapter}`),e.effect&&t.push(`效果: ${P(e.effect)}`),e.description&&t.push(`描述: ${P(e.description)}`),t.join(`
`)}function N(e){let t=[];if(t.push(`物品: ${e.item_name||`(未命名)`}`),e.owner&&t.push(`持有者: ${P(e.owner)}`),Array.isArray(e.events)&&e.events.length){t.push(`流转记录:`);for(let n of e.events){let e=n.action||`获得`,r=n.source?`来源: ${P(n.source)}`:n.destination?`去向: ${P(n.destination)}`:``;t.push(`  - [${n.chapter||`未明确章节`}] ${e}${r?`（`+r+`）`:``}${n.evidence?` / 证据: `+P(n.evidence):``}`)}}return t.join(`
`)}function P(e){if(e==null)return``;let t=String(e);return/[:#\n"]/.test(t)?`"${t.replace(/"/g,`\\"`)}"`:t}function F(e,t){return Array.isArray(e)?e.filter(e=>Ce(e,t)).map(e=>I(e,t)):[]}function Ce(e,t){return!e||typeof e!=`object`?!1:t===`character`||t===`eventline`?!!e.name:t===`timeline`?!!e.stage_name:t===`setting`?!!e.name&&!!e.subtype:t===`item_trajectory`?!!e.item_name:!1}function I(e,t){if(t===`character`)return{name:e.name,role:e.role===`major`?`major`:`minor`,first_chapter:e.first_chapter||``,last_chapter:e.last_chapter||``,basic:e.basic||{},appearance:e.appearance||``,tracks:{境界:Array.isArray(e.tracks?.境界)?e.tracks.境界:[],位置:Array.isArray(e.tracks?.位置)?e.tracks.位置:[],物品:Array.isArray(e.tracks?.物品)?e.tracks.物品:[],关系:Array.isArray(e.tracks?.关系)?e.tracks.关系:[],行为模式:Array.isArray(e.tracks?.行为模式)?e.tracks.行为模式:[]}};if(t===`eventline`)return{name:e.name,type:[`主线`,`支线`,`暗线`,`伏笔`].includes(e.type)?e.type:`支线`,cause:e.cause||null,passages:Array.isArray(e.passages)?e.passages:[],result:e.result||null,follow_up:e.follow_up||``};if(t===`timeline`)return{stage_name:e.stage_name,chapter_range:e.chapter_range||``,time_markers:Array.isArray(e.time_markers)?e.time_markers:[],summary:e.summary||``,protagonist_status:e.protagonist_status||``};if(t===`setting`){let t=[`功法`,`丹药`,`地理`,`势力`,`世界观常识`];return{...e,subtype:t.includes(e.subtype)?e.subtype:`世界观常识`,name:e.name,first_chapter:e.first_chapter||``}}return t===`item_trajectory`?{item_name:e.item_name,owner:e.owner||``,events:Array.isArray(e.events)?e.events.map(e=>({chapter:e.chapter||`未明确章节`,action:[`获得`,`消耗`,`转赠`].includes(e.action)?e.action:`获得`,source:e.source||``,destination:e.destination||``,evidence:e.evidence||``})):[]}:e}function we(e,t,n=!1){let r=e*(t?.length||5);return n?r*2+e:r}function Te(e,t=13e3){return Math.ceil(e*t/1e3)}function Ee(e){return Math.round((e||``).length*1.3)}function L(e,t){if(!Array.isArray(e))return[];let n=[];for(let r of e)if(!(!r||typeof r!=`object`)){if(t===`character`){r.appearance&&n.push(r.appearance);let e=r.tracks||{};for(let t of Object.values(e))if(Array.isArray(t))for(let e of t){if(e.evidence&&n.push(e.evidence),e.summary&&n.push(e.summary),e.boundary&&n.push(e.boundary),e.decisions&&n.push(e.decisions),Array.isArray(e.behaviors))for(let t of e.behaviors)t.behavior&&n.push(t.behavior),t.context&&n.push(t.context);Array.isArray(e.dialogues)&&n.push(...e.dialogues.filter(e=>typeof e==`string`))}}else if(t===`eventline`){r.cause?.summary&&n.push(r.cause.summary),r.cause?.dialogue&&n.push(r.cause.dialogue);for(let e of r.passages||[])e.node&&n.push(e.node),e.dialogue&&n.push(e.dialogue);r.result?.summary&&n.push(r.result.summary),r.result?.dialogue&&n.push(r.result.dialogue),r.follow_up&&n.push(r.follow_up)}else if(t===`timeline`)r.summary&&n.push(r.summary),r.protagonist_status&&n.push(r.protagonist_status);else if(t===`setting`)r.effect&&n.push(r.effect),r.description&&n.push(r.description);else if(t===`item_trajectory`)for(let e of r.events||[])e.source&&n.push(e.source),e.destination&&n.push(e.destination),e.evidence&&n.push(e.evidence)}return n}function R(e,t){let n=L(e,t),r=[];for(let e of n){let t=v(e);r.push(...t)}let i={};for(let e of r)i[e.type]=(i[e.type]||0)+1;return{total:r.length,byType:i,items:r.slice(0,30)}}function De(e,t){if(!Array.isArray(e))return[];let n=[];for(let r=0;r<e.length;r++){let i=e[r],a=i?.name||i?.stage_name||i?.item_name||`#${r}`;if(t===`character`){let e=i?.tracks||{};for(let[t,r]of Object.entries(e))if(Array.isArray(r))for(let e=0;e<r.length;e++){let i=r[e];if((!i.chapter||i.chapter===``)&&n.push({path:`${a} / 轨迹·${t}[${e}]`,expected:`章节号`,current:`空`}),Array.isArray(i.behaviors))for(let e=0;e<i.behaviors.length;e++)i.behaviors[e].chapter||n.push({path:`${a} / 关系·行为[${e}]`,expected:`章节号`,current:`空`})}}else if(t===`eventline`){i?.cause&&!i.cause.chapter&&n.push({path:`${a} / 起因`,expected:`章节号`,current:`空`});for(let e=0;e<(i?.passages||[]).length;e++)i.passages[e].chapter||n.push({path:`${a} / 经过[${e}]`,expected:`章节号`,current:`空`});i?.result&&!i.result.chapter&&n.push({path:`${a} / 结果`,expected:`章节号`,current:`空`})}else if(t===`item_trajectory`)for(let e=0;e<(i?.events||[]).length;e++)i.events[e].chapter||n.push({path:`${a} / 流转[${e}]`,expected:`章节号`,current:`空`})}return n}var z=[/温顺乖巧|俏皮撒娇|真诚信赖|嫉妒驱动|被征服的女性|慈爱却略显笨拙/g,/^(温柔|善良|坚强|聪明|开朗|内向|傲娇|腹黑|温暖|冷漠|可爱|漂亮|帅气)[、，,]/gm,/^(成熟|成长|蜕变|升华|觉醒)$/gm];function B(e){if(!Array.isArray(e))return[];let t=[];for(let n of e){let e=n?.tracks||{};for(let r of e.关系||[])if(typeof r.summary==`string`)for(let e of z){e.lastIndex=0;let i;for(;(i=e.exec(r.summary))!==null;)t.push({char:n.name,target:r.target,label:i[0],field:`互动特征`}),i.index===e.lastIndex&&e.lastIndex++}for(let r of e.行为模式||[])if(typeof r.decisions==`string`)for(let e of z){e.lastIndex=0;let i;for(;(i=e.exec(r.decisions))!==null;)t.push({char:n.name,stage:r.stage,label:i[0],field:`决策倾向`}),i.index===e.lastIndex&&e.lastIndex++}}return t}async function V(e,t,n){if(!e.isConfigured||!Array.isArray(t)||t.length===0)return t;let r=`你是 SillyTavern 写卡审查专家。按写卡铁律检查并修正提取结果，必须输出完整 JSON 数组结构。`+y,i=C+`\n\n## 当前提取结果（type: ${n}）\n\n`+JSON.stringify(t,null,2);try{let a=F(b(await e.chat([{role:`system`,content:r},{role:`user`,content:i}],{temperature:.3,maxTokens:e.getModelMaxTokens(e.activeProvider?.model)})),n);return a.length>0?a:t}catch{return t}}async function Oe(e,t,n,r){if(!e.isConfigured)return H(t,n,r);if(!Array.isArray(t)||!Array.isArray(n))return t||n||[];let i=`你是合并引擎。比对两份独立提取结果，输出去重合并后的完整 JSON 数组。`+y,a=`## 任务：合并 R1 和 R2 的提取结果（type: ${r}）

合并规则：
- 同名/同义条目取并集，章节号取信息更完整的版本
- 一方独有的条目保留
- 关系/行为模式轨迹的台词/节点取并集去重
- 输出完整 JSON 数组（同 R1/R2 字段结构）

===R1===
${JSON.stringify(t,null,2)}

===R2===
${JSON.stringify(n,null,2)}

只输出合并后的 JSON 数组，不要其他文字。`;try{let o=F(b(await e.chat([{role:`system`,content:i},{role:`user`,content:a}],{temperature:.3,maxTokens:e.getModelMaxTokens(e.activeProvider?.model)})),r);return o.length>0?o:H(t,n,r)}catch{return H(t,n,r)}}function H(e,t,n){let r=[...e||[],...t||[]],i=new Set,a=[];for(let e of r){let t=e?.name||e?.stage_name||e?.item_name||JSON.stringify(e);i.has(t)||(i.add(t),a.push(e))}return a}var U={character:`角色`,eventline:`事件线`,timeline:`时间线阶段`,setting:`设定`,item_trajectory:`物品`};function W(e){return new Promise(t=>setTimeout(t,e))}async function G(e,t,n){if(!Array.isArray(t)||t.length===0)return t||[];let r=e=>e?.name||e?.stage_name||e?.item_name||JSON.stringify(e),i=new Map,a=[];for(let e of t){let t=r(e);i.has(t)||(i.set(t,[]),a.push(t)),i.get(t).push(e)}let o=[];for(let t of a){let r=i.get(t);if(r.length===1){o.push(r[0]);continue}let a=null;if(e.isConfigured){try{a=await K(e,r,n,t)}catch{a=null}await W(13e3)}a||=q(r),o.push(a)}return o}async function K(e,t,n,r){let i=U[n]||n,a=`你是合并引擎。把同一主体在小说不同片段独立提取出的多份信息合并成一条完整的，信息取并集别丢，输出含 1 个对象的 JSON 数组。`+y,o=`## 任务：跨片合并同名条目（type: ${n}）

这是同一个${i}「${r}」在小说不同片段独立提取的 ${t.length} 份信息。

合并规则：
- 信息**取并集**，不丢任何独有事实
- 数组字段（tracks / passages / events 等）去重合并
- 章节号取信息更完整的版本
- 矛盾时保留多份并用 " / " 分隔
- 字段结构跟原条目一致

===分片提取结果===
${JSON.stringify(t,null,2)}

只输出 JSON 数组（含 1 个合并后的对象），不要其他文字。`,s=F(b(await e.chat([{role:`system`,content:a},{role:`user`,content:o}],{temperature:.3,maxTokens:e.getModelMaxTokens(e.activeProvider?.model)})),n);return s.length>0?s[0]:null}function q(e){if(!e||e.length===0)return null;if(e.length===1)return e[0];let t=JSON.parse(JSON.stringify(e[0]));for(let n=1;n<e.length;n++)t=J(t,e[n]);return t}function J(e,t){if(e==null||e===``)return t;if(t==null||t===``||Array.isArray(e)!==Array.isArray(t)||typeof e!=typeof t)return e;if(Array.isArray(e)){let n=new Set(e.map(e=>JSON.stringify(e))),r=[...e];for(let e of t){let t=JSON.stringify(e);n.has(t)||(n.add(t),r.push(e))}return r}if(typeof e==`object`){let n={...e};for(let[e,r]of Object.entries(t)){if(r==null||r===``)continue;let t=n[e];t==null||t===``?n[e]=r:n[e]=J(t,r)}return n}return typeof e==`string`?e===t||e.includes(t)||t.includes(e)?e:e+` / `+t:e}function ke(e){let t=0,n=0;for(let r of[`character`,`eventline`,`timeline`,`setting`,`item_trajectory`]){let i=e[r===`character`?`characters`:r===`eventline`?`eventlines`:r===`timeline`?`timeline`:r===`setting`?`settings`:`item_trajectories`],a=R(i,r);t+=a.total,n+=De(i,r).length}let r=B(e.characters).length,i=t+n+r,a=Math.max(0,100-t*2-n*1-r*3),o=[];return t>0&&o.push(`${t} 处八股化表达，建议 AI 自检修正`),n>0&&o.push(`${n} 个事实缺章节号`),r>0&&o.push(`${r} 处关系抽象标签`),{score:a,baguaCount:t,missingChapterCount:n,abstractLabelCount:r,totalIssues:i,suggestions:o}}var Ae={class:`page`},je={class:`page__header flex-between`},Me={class:`tabs`},Ne={class:`grid-2`},Pe={class:`card mb-md`},Fe={class:`card__body`},Ie={class:`grid-2`},Le={class:`form-group`},Re={class:`form-group`},ze={class:`grid-2`},Be={class:`form-group`},Ve={class:`form-group`},He=[`value`],Ue={class:`hint`},We={class:`card mb-md`},Ge={class:`card__header flex-between`},Ke={class:`flex-row`},qe=[`disabled`],Je={class:`card__body`},Ye={class:`hint`},Xe={key:0,class:`card mb-md`},Ze={class:`card__body`},Qe={class:`grid-3`},$e={class:`form-group`},et={key:0,class:`form-group`},tt={key:1,class:`form-group`},nt={class:`chunk-preview`},rt={class:`flex-between`},it={key:0,class:`hint`,style:{color:`var(--cf-warning)`}},at={class:`hint mt-sm`},ot={key:0,class:`warning-box mt-sm`},st={key:0,class:`form-group mt-md`},ct=[`max`],lt={class:`card mb-md`},ut={class:`card__body`},dt={class:`toggle-label mb-md`},ft={class:`toggle-label mb-md`},pt={class:`toggle-label mb-md`},mt={class:`card`},ht={class:`card__body`},gt={key:0},_t=[`disabled`],vt={key:1},yt={class:`form-group`},bt={style:{display:`flex`,"flex-direction":`column`,gap:`8px`,"margin-top":`8px`}},xt=[`value`],St={class:`hint`,style:{"margin-left":`auto`}},Ct=[`disabled`],wt={key:2},Tt={class:`flex-between`},Et={class:`hint`,style:{"margin-left":`8px`}},Dt={class:`flex-row`},Ot=[`disabled`,`onClick`],kt={key:0,class:`ide-step__progress`},At={key:0,class:`card mb-md`},jt={class:`card__body`},Mt={class:`progress-tree`},Nt={class:`hint`,style:{"margin-left":`auto`}},Pt={class:`progress-tree__row`},Ft={class:`hint`,style:{"margin-left":`auto`}},It={style:{"margin-right":`8px`}},Lt={class:`hint`,style:{"margin-left":`auto`}},Rt={key:0},zt={class:`hint`,style:{"margin-left":`auto`}},Bt={key:1,class:`card mb-md`},Vt={class:`card__header flex-between`},Ht={class:`card__body`},Ut={key:0,class:`hint`,style:{color:`var(--cf-success)`}},Wt={key:1,style:{margin:`0`,"padding-left":`20px`}},Gt={class:`card`,style:{"min-height":`300px`}},Kt={class:`card__header flex-between`},qt={key:0,class:`flex-row`},Jt=[`disabled`],Yt={class:`card__body`,style:{"overflow-y":`auto`,"max-height":`calc(100vh - 200px)`}},Xt={key:0,class:`empty-state`},Y=`cf_novel_extract_state`,X=ae({__name:`NovelExtractor`,setup(ae){let v=ie(),y=oe(),b=te(),S=i(`auto`),C=i(``),w=f({...ye(),enableSelfCheck:!1}),T=i(!1),E=i(!1),D=i(!1),O=f(ve()),k=i([]),A=i(new Set),j=f({character:{done:0,total:0,running:!1},eventline:{done:0,total:0,running:!1},timeline:{done:0,total:0,running:!1},setting:{done:0,total:0,running:!1},item_trajectory:{done:0,total:0,running:!1}}),Se=c(()=>le.find(e=>e.value===w.userMode)?.desc||``),M=c(()=>C.value.trim()?be(C.value,{strategy:w.chunkStrategy,chaptersPerChunk:w.chaptersPerChunk,wordsPerChunk:w.wordsPerChunk}):{strategy:`words`,chunks:[],totalChapters:0,fallback:!1}),N=c(()=>{let e=M.value.chunks,t=w.chapterRangeEnd>0?Math.min(w.chapterRangeEnd,e.length):e.length;return e.slice(0,t)}),P=c(()=>we(N.value.length,w.selectedTypes,w.enableR2DoubleCheck)+(w.enableSelfCheck?w.selectedTypes.length:0)),Ce=c(()=>Te(P.value)),I=c(()=>Ee(C.value)),L=c(()=>!T.value&&C.value.trim().length>0&&w.protagonistName.trim().length>0&&N.value.length>0&&y.isConfigured),R=c(()=>O.characters.length>0||O.eventlines.length>0||O.timeline.length>0||O.settings.length>0||O.item_trajectories.length>0),De=c(()=>{let e=0,t=0;for(let n of x)e+=j[n.key].done,t+=j[n.key].total;return t>0?`${e} / ${t} 片`:`待开始`}),z=c(()=>ke(O)),B=c(()=>k.value.filter(e=>e._selected!==!1).length);function H(){try{let e={config:JSON.parse(JSON.stringify(w)),extraction:JSON.parse(JSON.stringify(O)),novelText:C.value};localStorage.setItem(Y,JSON.stringify(e))}catch{}}function U(){try{let e=localStorage.getItem(Y);if(!e)return;let t=JSON.parse(e);t.config&&Object.assign(w,t.config),t.extraction&&Object.assign(O,t.extraction),t.novelText&&(C.value=t.novelText),$()}catch{}}a([O,()=>w.chapterName,()=>w.userMode],()=>{H()},{deep:!0}),re(()=>{U()});function W(){let e=document.createElement(`input`);e.type=`file`,e.accept=`.txt,.text,.md`,e.onchange=async e=>{let t=e.target.files[0];if(t)try{C.value=await t.text(),b.toastSuccess(`已导入「${t.name}」(${C.value.length} 字)`)}catch(e){b.toastError(`导入失败: `+e.message)}},e.click()}function K(e){return e<60?`${e} 秒`:e<3600?`${Math.round(e/60)} 分钟`:`${(e/3600).toFixed(1)} 小时`}function q(e){let t=j[e];return t.running?`进行中 ${t.done}/${t.total}`:t.done>0&&t.done>=t.total?`已完成 (${J(e)} 项)`:t.done>0?`已部分完成 ${t.done}/${t.total}`:`未开始`}function J(e){return O[{character:`characters`,eventline:`eventlines`,timeline:`timeline`,setting:`settings`,item_trajectory:`item_trajectories`}[e]]?.length||0}function X(e){let t=j[e];return t.running||t.done>0&&(t.done,t.total),`·`}function Zt(e){let t=j[e];return t.total>0?Math.round(t.done/t.total*100):0}function Qt(){let e=z.value.score;return e>=80?`quality-score--good`:e>=60?`quality-score--mid`:`quality-score--bad`}let $t={character:fe,eventline:pe,timeline:me,setting:he,item_trajectory:ge},en={character:`characters`,eventline:`eventlines`,timeline:`timeline`,setting:`settings`,item_trajectory:`item_trajectories`};async function tn(e,t,n=!1){let r=`你是 SillyTavern 写卡专家。`+ue+`

`+de(w.userMode,w.protagonistName),i=$t[t]+(n?`

`+_e:``)+`\n\n## 小说原文片段\n\n${e}`;return F(await se(y,[{role:`system`,content:r},{role:`user`,content:i}],{temperature:.7,maxTokens:y.getModelMaxTokens(y.activeProvider?.model)}),t)}async function nn(e){let t=N.value;j[e].running=!0,j[e].total=t.length,j[e].done=0;let n=[];for(let r=0;r<t.length&&!E.value;r++){try{let i=await tn(t[r],e,!1);n.push(...i)}catch(t){b.toastWarning(`第 ${r+1} 片 [${e}] 出错: ${t.message}`)}j[e].done=r+1,r<t.length-1&&await Q(13e3)}let r=n;if(!E.value&&r.length>1&&(b.toastInfo(`[${e}] 跨片合并同名条目中...`),r=await G(y,r,e)),w.enableR2DoubleCheck&&!E.value){let n=[];j[e].done=0,b.toastInfo(`[${e}] R2 双跑开始...`);for(let r=0;r<t.length&&!E.value;r++){try{let i=await tn(t[r],e,!0);n.push(...i)}catch{}j[e].done=r+1,r<t.length-1&&await Q(13e3)}!E.value&&n.length>1&&(b.toastInfo(`[${e}] R2 跨片合并同名条目中...`),n=await G(y,n,e)),E.value||(r=await Oe(y,r,n,e))}w.enableSelfCheck&&!E.value&&(b.toastInfo(`[${e}] AI 自检中...`),r=await V(y,r,e)),O[en[e]]=r,j[e].running=!1,$()}async function rn(){w.selectedTypes=[`character`,`eventline`,`timeline`,`setting`,`item_trajectory`],await Z(w.selectedTypes)}async function an(){if(w.selectedTypes.length===0){b.toastError(`请至少选一类`);return}await Z(w.selectedTypes)}async function on(e){await Z([e])}async function Z(e){if(L.value){T.value=!0,E.value=!1;try{for(let t of e){if(E.value)break;await nn(t)}E.value?b.toastInfo(`已停止提取`):b.toastSuccess(`提取完成 (${e.length} 类)`)}catch(e){b.toastError(`提取失败: ${e.message}`)}finally{T.value=!1,E.value=!1}}}function sn(){E.value=!0,b.toastInfo(`收到停止信号，等当前片完成后停下`)}function Q(e){return new Promise(t=>setTimeout(t,e))}async function cn(){if(y.isConfigured){D.value=!0;try{for(let e of x){let t=en[e.key];O[t].length!==0&&(O[t]=await V(y,O[t],e.key),await Q(13e3))}$(),b.toastSuccess(`全部自检完成`)}catch(e){b.toastError(`自检失败: `+e.message)}finally{D.value=!1}}}function $(){let e=xe(O,w);for(let t of e)t._selected=!0;k.value=e}function ln(e){A.value.has(e)?A.value.delete(e):A.value.add(e),A.value=new Set(A.value)}function un(e){for(let t of k.value)t._selected=e}function dn(){let e=k.value.filter(e=>e._selected!==!1);if(e.length===0){b.toastWarning(`请至少选中一条`);return}let t=0;for(let n of e){let e=v.addWorldEntry();e.comment=n.comment,e.keys=n.keys,e.secondary_keys=n.secondary_keys||[],e.content=n.content,e.constant=n.constant,e.selective=n.selective,e.enabled=n.enabled!==!1,e.position=n.position,e.insertion_order=n.insertion_order||100,Object.assign(e.extensions,n.extensions||{}),t++}b.toastSuccess(`已注入 ${t} 条到世界书`),k.value=[]}return(i,a)=>(n(),u(`div`,Ae,[p(`div`,je,[a[19]||=p(`div`,null,[p(`h1`,null,`小说转世界书`),p(`p`,null,`把整本小说提取成结构化世界书条目（5 类分步：角色 / 事件线 / 时间线 / 设定 / 物品轨迹）`)],-1),p(`div`,Me,[p(`div`,{class:e([`tabs__item`,{active:S.value===`auto`}]),onClick:a[0]||=e=>S.value=`auto`},`全自动`,2),p(`div`,{class:e([`tabs__item`,{active:S.value===`focused`}]),onClick:a[1]||=e=>S.value=`focused`},`重点扩写`,2),p(`div`,{class:e([`tabs__item`,{active:S.value===`ide`}]),onClick:a[2]||=e=>S.value=`ide`},`IDE 引导式`,2)])]),p(`div`,Ne,[p(`div`,null,[p(`div`,Pe,[a[24]||=p(`div`,{class:`card__header`},[p(`h3`,null,`篇章配置`)],-1),p(`div`,Fe,[p(`div`,Ie,[p(`div`,Le,[a[20]||=p(`label`,null,`小说名`,-1),t(p(`input`,{class:`input`,"onUpdate:modelValue":a[3]||=e=>w.novelName=e,placeholder:`如：你的小说名`},null,512),[[_,w.novelName]])]),p(`div`,Re,[a[21]||=p(`label`,null,`篇章名（用于条目前缀）`,-1),t(p(`input`,{class:`input`,"onUpdate:modelValue":a[4]||=e=>w.chapterName=e,placeholder:`如：第一篇 / 序章篇 / 修炼篇`},null,512),[[_,w.chapterName]])])]),p(`div`,ze,[p(`div`,Be,[a[22]||=p(`label`,null,[d(`主角姓名 `),p(`span`,{class:`badge badge--danger`},`必填`)],-1),t(p(`input`,{class:`input`,"onUpdate:modelValue":a[5]||=e=>w.protagonistName=e,placeholder:`如：陈逸 / 主角姓名`},null,512),[[_,w.protagonistName]])]),p(`div`,Ve,[a[23]||=p(`label`,null,`玩家身份`,-1),t(p(`select`,{class:`select`,"onUpdate:modelValue":a[6]||=e=>w.userMode=e},[(n(!0),u(s,null,o(r(le),e=>(n(),u(`option`,{key:e.value,value:e.value},m(e.label),9,He))),128))],512),[[h,w.userMode]]),p(`div`,Ue,m(Se.value),1)])])])]),p(`div`,We,[p(`div`,Ge,[a[25]||=p(`h3`,null,`小说原文`,-1),p(`div`,Ke,[p(`button`,{class:`btn btn--secondary btn--sm`,onClick:W},`导入 txt 文件`),p(`button`,{class:`btn btn--ghost btn--sm`,onClick:a[7]||=e=>C.value=``,disabled:!C.value},`清空`,8,qe)])]),p(`div`,Je,[t(p(`textarea`,{class:`textarea`,"onUpdate:modelValue":a[8]||=e=>C.value=e,rows:`10`,placeholder:`粘贴小说原文，或点上方「导入 txt 文件」`},null,512),[[_,C.value]]),p(`div`,Ye,m(C.value.length)+` 字 · 估算 `+m(I.value)+` token`,1)])]),C.value.trim().length>0?(n(),u(`div`,Xe,[a[35]||=p(`div`,{class:`card__header`},[p(`h3`,null,`切片预览`)],-1),p(`div`,Ze,[p(`div`,Qe,[p(`div`,$e,[a[27]||=p(`label`,null,`切片策略`,-1),t(p(`select`,{class:`select`,"onUpdate:modelValue":a[9]||=e=>w.chunkStrategy=e},[...a[26]||=[p(`option`,{value:`auto`},`智能（按章节优先 + 字数 fallback）`,-1),p(`option`,{value:`chapter`},`强制按章节`,-1),p(`option`,{value:`words`},`强制按字数`,-1)]],512),[[h,w.chunkStrategy]])]),w.chunkStrategy===`words`?l(``,!0):(n(),u(`div`,et,[a[28]||=p(`label`,null,`每片章节数`,-1),t(p(`input`,{class:`input`,type:`number`,"onUpdate:modelValue":a[10]||=e=>w.chaptersPerChunk=e,min:`1`,max:`20`},null,512),[[_,w.chaptersPerChunk,void 0,{number:!0}]])])),w.chunkStrategy===`chapter`?l(``,!0):(n(),u(`div`,tt,[a[29]||=p(`label`,null,`每片字数`,-1),t(p(`input`,{class:`input`,type:`number`,"onUpdate:modelValue":a[11]||=e=>w.wordsPerChunk=e,min:`1000`,step:`1000`},null,512),[[_,w.wordsPerChunk,void 0,{number:!0}]])]))]),p(`div`,nt,[p(`div`,rt,[p(`span`,{class:e([`badge`,M.value.strategy===`chapter`?`badge--success`:`badge--warning`])},m(M.value.strategy===`chapter`?`按章节切`:`按字数切`),3),M.value.fallback?(n(),u(`span`,it,` 原文未识别到 ≥3 个章节标题，已 fallback 到字数切 `)):l(``,!0)]),p(`div`,at,[p(`strong`,null,m(M.value.totalChapters>0?`检测到 ${M.value.totalChapters} 章`:`未识别章节`),1),a[30]||=d(` · 切成 `,-1),p(`strong`,null,m(M.value.chunks.length)+` 片`,1),a[31]||=d(` · 5 类分步 = `,-1),p(`strong`,null,m(P.value)+` 次 AI 调用`,1),a[32]||=d(` · 预估 `,-1),p(`strong`,null,m(K(Ce.value)),1)]),C.value.length>3e5?(n(),u(`div`,ot,` 注意：原文 `+m(Math.round(C.value.length/1e4))+` 万字，超过 30 万阈值。建议分篇章操作（每次 50-100 章）。 `,1)):l(``,!0)]),M.value.chunks.length>1?(n(),u(`div`,st,[a[33]||=p(`label`,null,`只跑前 N 片（0 = 全部）`,-1),t(p(`input`,{class:`input`,type:`number`,"onUpdate:modelValue":a[12]||=e=>w.chapterRangeEnd=e,min:`0`,max:M.value.chunks.length,placeholder:`0 = 全部`},null,8,ct),[[_,w.chapterRangeEnd,void 0,{number:!0}]]),a[34]||=p(`div`,{class:`hint`},`先跑前几片试试效果，再决定要不要全跑（节省 token）`,-1)])):l(``,!0)])])):l(``,!0),p(`div`,lt,[p(`details`,null,[a[42]||=p(`summary`,{class:`card__header`,style:{cursor:`pointer`,"list-style":`none`}},[p(`h3`,null,`▶ 高级设置`)],-1),p(`div`,ut,[p(`label`,dt,[t(p(`input`,{type:`checkbox`,"onUpdate:modelValue":a[13]||=e=>w.enableR2DoubleCheck=e},null,512),[[g,w.enableR2DoubleCheck]]),a[36]||=p(`strong`,null,`R1+R2 双跑`,-1),a[37]||=d(`（每类提取两次独立跑+合并，覆盖率↑，但 token+50% 时长+50%） `,-1)]),p(`label`,ft,[t(p(`input`,{type:`checkbox`,"onUpdate:modelValue":a[14]||=e=>w.enableContinuationSummary=e},null,512),[[g,w.enableContinuationSummary]]),a[38]||=p(`strong`,null,`跨篇章衔接摘要`,-1),a[39]||=d(`（完成后自动生成衔接摘要供下一篇章使用） `,-1)]),p(`label`,pt,[t(p(`input`,{type:`checkbox`,"onUpdate:modelValue":a[15]||=e=>w.enableSelfCheck=e},null,512),[[g,w.enableSelfCheck]]),a[40]||=p(`strong`,null,`每类提取后 AI 自检`,-1),a[41]||=d(`（额外 5 次调用，质量↑） `,-1)])])])]),p(`div`,mt,[p(`div`,ht,[S.value===`auto`?(n(),u(`div`,gt,[a[43]||=p(`p`,{class:`hint mb-md`},`一键串跑 5 类提取，全自动无需干预。中途可暂停/继续。`,-1),p(`button`,{class:`btn btn--primary btn--lg`,style:{width:`100%`},disabled:!L.value,onClick:rn},m(T.value?`提取中...`:`开始全自动提取`),9,_t)])):l(``,!0),S.value===`focused`?(n(),u(`div`,vt,[a[45]||=p(`p`,{class:`hint mb-md`},`只跑你选中的类型，不要的不浪费 token。`,-1),p(`div`,yt,[a[44]||=p(`label`,null,`提取这几类：`,-1),p(`div`,bt,[(n(!0),u(s,null,o(r(x),e=>(n(),u(`label`,{key:e.key,class:`toggle-label`},[t(p(`input`,{type:`checkbox`,value:e.key,"onUpdate:modelValue":a[16]||=e=>w.selectedTypes=e},null,8,xt),[[g,w.selectedTypes]]),p(`strong`,null,m(e.label),1),p(`span`,St,m(e.desc),1)]))),128))])]),p(`button`,{class:`btn btn--primary btn--lg`,style:{width:`100%`,"margin-top":`12px`},disabled:!L.value||w.selectedTypes.length===0,onClick:an},m(T.value?`提取中...`:`提取选中 ${w.selectedTypes.length} 类`),9,Ct)])):l(``,!0),S.value===`ide`?(n(),u(`div`,wt,[a[46]||=p(`p`,{class:`hint mb-md`},` 逐类手动跑，每类完成后查看结果可单独重试。最详细的控制模式。 `,-1),(n(!0),u(s,null,o(r(x),e=>(n(),u(`div`,{key:e.key,class:`ide-step`},[p(`div`,Tt,[p(`div`,null,[p(`strong`,null,m(e.label),1),p(`span`,Et,m(q(e.key)),1)]),p(`div`,Dt,[p(`button`,{class:`btn btn--primary btn--sm`,disabled:!L.value||j[e.key]?.running,onClick:t=>on(e.key)},m(j[e.key]?.done>0?`重新提取`:`开始提取`),9,Ot)])]),j[e.key]?.total>0?(n(),u(`div`,kt,[p(`div`,{class:`ide-step__bar`,style:ee({width:Zt(e.key)+`%`})},null,4)])):l(``,!0)]))),128))])):l(``,!0),T.value?(n(),u(`button`,{key:3,class:`btn btn--danger btn--sm mt-md`,style:{width:`100%`},onClick:sn},` 停止当前提取 `)):l(``,!0)])])]),p(`div`,null,[T.value||R.value?(n(),u(`div`,At,[a[50]||=p(`div`,{class:`card__header`},[p(`h3`,null,`提取进度`)],-1),p(`div`,jt,[p(`div`,Mt,[p(`div`,{class:e([`progress-tree__row`,{done:M.value.chunks.length>0}])},[a[47]||=d(` 切片预处理 `,-1),p(`span`,Nt,m(M.value.chunks.length>0?`已切 ${M.value.chunks.length} 片`:`等待原文`),1)],2),p(`div`,Pt,[a[48]||=d(` 5 类提取 `,-1),p(`span`,Ft,m(De.value),1)]),(n(!0),u(s,null,o(r(x),t=>(n(),u(`div`,{key:t.key,class:e([`progress-tree__sub`,{active:j[t.key]?.running,done:j[t.key]?.done>=(j[t.key]?.total||0)&&j[t.key]?.done>0}])},[p(`span`,It,m(X(t.key)),1),d(` `+m(t.label)+` `,1),p(`span`,Lt,[d(m(j[t.key]?.done||0)+` / `+m(j[t.key]?.total||0)+` 片 `,1),J(t.key)>0?(n(),u(`span`,Rt,`· 提取 `+m(J(t.key))+` 项`,1)):l(``,!0)])],2))),128)),p(`div`,{class:e([`progress-tree__row`,{done:k.value.length>0}])},[a[49]||=d(` 注入预览 `,-1),p(`span`,zt,m(k.value.length>0?`${k.value.length} 条待注入`:`等提取完成`),1)],2)])])])):l(``,!0),R.value?(n(),u(`div`,Bt,[p(`div`,Vt,[a[51]||=p(`h3`,null,`质量评分`,-1),p(`span`,{class:e([`quality-score`,Qt()])},m(z.value.score)+` / 100`,3)]),p(`div`,Ht,[z.value.suggestions.length===0?(n(),u(`div`,Ut,` ✓ 未发现明显质量问题 `)):(n(),u(`ul`,Wt,[(n(!0),u(s,null,o(z.value.suggestions,(e,t)=>(n(),u(`li`,{key:t,class:`hint`},m(e),1))),128))])),R.value&&!T.value?(n(),u(`button`,{key:2,class:`btn btn--secondary btn--sm mt-md`,onClick:cn},m(D.value?`自检中...`:`一键 AI 自检全部类型`),1)):l(``,!0)])])):l(``,!0),p(`div`,Gt,[p(`div`,Kt,[p(`h3`,null,`注入预览（`+m(k.value.length)+`）`,1),k.value.length>0?(n(),u(`div`,qt,[p(`button`,{class:`btn btn--ghost btn--sm`,onClick:a[17]||=e=>un(!0)},`全选`),p(`button`,{class:`btn btn--ghost btn--sm`,onClick:a[18]||=e=>un(!1)},`全不选`),p(`button`,{class:`btn btn--primary btn--sm`,onClick:dn,disabled:B.value===0},` 注入选中 `+m(B.value)+` 条到世界书 `,9,Jt)])):l(``,!0)]),p(`div`,Yt,[k.value.length===0?(n(),u(`div`,Xt,[...a[52]||=[p(`div`,{class:`empty-state__title`},`等待提取`,-1),p(`div`,{class:`empty-state__desc`},`填好配置 + 粘贴小说后点开始`,-1)]])):l(``,!0),(n(!0),u(s,null,o(k.value,(e,t)=>(n(),ne(ce,{key:t,entry:e,mode:`preview`,expanded:A.value.has(t),selected:e._selected!==!1,onToggleExpand:e=>ln(t),onToggleSelect:t=>e._selected=e._selected===!1,onDelete:e=>k.value.splice(t,1)},null,8,[`entry`,`expanded`,`selected`,`onToggleExpand`,`onToggleSelect`,`onDelete`]))),128))])])])])]))}},[[`__scopeId`,`data-v-b6039f52`]]);export{X as default};