import{$ as e,A as t,C as n,M as r,T as i,a,c as o,d as s,f as c,h as l,l as u,t as ee,tt as d}from"./app-Cd1I7MXh.js";import{a as f,i as te,o as ne}from"./runtime-dom.esm-bundler-C5vljRIB.js";import{t as re}from"./card-O4uKpNGl.js";import{t as ie}from"./plugin-vue_export-helper-DKl4mWgK.js";import{t as ae}from"./api-BzPMTnBs.js";import{t as p}from"./card-context-CxT3-AAd.js";function m(e){return e===`{}`?{type:`record`,default:``}:e===`[]`?{type:`array`,default:``}:/^-?\d+(\.\d+)?$/.test(e)?{type:`number`,default:e}:e===`true`||e===`false`?{type:`boolean`,default:e}:/^[|>][+-]?$/.test(e)?{type:`string`,default:``}:{type:`string`,default:e.replace(/^(['"])(.*)\1$/,`$2`)}}function oe(e){let t=[];if(!e||typeof e!=`string`)return t;let n=[];for(let t of e.split(`
`)){let e=t.trim();if(!e||e===`---`||/^[#<\-{\[]/.test(e))continue;let r=e.match(/^("[^"]+"|'[^']+'|[^:：\s][^:：]*?)\s*[:：]\s*(.*)$/);r&&n.push({indent:t.replace(/\t/g,`  `).search(/\S/),key:r[1].replace(/^(['"])(.*)\1$/,`$2`).trim(),val:r[2].trim()})}let r=[];return n.forEach((e,i)=>{for(;r.length&&r[r.length-1].indent>=e.indent;)r.pop();let a=n[i+1];if(e.val===``&&a&&a.indent>e.indent){r.push(e);return}let o=[...r.map(e=>e.key),e.key];t.push({group:o[0],field:o.slice(1).join(`.`),...m(e.val)})}),t}var se={class:`page`},ce={class:`page__header flex-between`},le={class:`flex-row`},ue={class:`step-nav`},de=[`onClick`],fe={class:`step-num`},pe={class:`step-label`},me={class:`card mb-md`},he={class:`card__body`},ge={key:0,class:`hint`,style:{"text-align":`center`,padding:`16px`,color:`var(--cf-accent)`}},_e={key:1,class:`code-preview selectable`},ve={class:`card mb-md`},ye={class:`card__body`},be={class:`form-group`},xe={class:`form-group`},Se={class:`grid-3`},Ce=[`onClick`],we=[`value`],Te={class:`form-group`},h={class:`form-group`},g={class:`step-actions`},_=[`disabled`],v={class:`card mb-md`},y={class:`card__header flex-between`},b=[`disabled`],x={class:`card__body`},S={class:`code-preview selectable`},C={class:`step-actions`},w=[`disabled`],T={class:`card mb-md`},E={class:`card__header flex-between`},D=[`disabled`],O={class:`card__body`},Ee=[`srcdoc`],De={class:`card mb-md`},Oe={class:`card__body`},ke={class:`code-preview selectable`},Ae={class:`step-actions`},je={class:`card mb-md`},Me={class:`card__body`,style:{"text-align":`center`,padding:`32px`}},Ne={style:{color:`var(--cf-text-secondary)`,"line-height":`1.8`}},Pe={class:`step-actions`},Fe=`---
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
    </UpdateVariable>`,Ie=`---
变量输出格式强调:
  rule: The following must be inserted to the end of reply, and cannot be omitted
  format: |-
    <UpdateVariable>
    ...
    </UpdateVariable>`,k=ie({__name:`StatusBarEditor`,setup(ie){let m=re(),k=ae(),A=ee(),Le=[`描述需求`,`变量路径`,`状态栏预览`,`应用完成`],j=r(0);function M(e){j.value=e}let N=r(`mvu`),P=r(`modern`),F=r(`grouped`),I=r(``),L=r(!1),R=r([]),z=r(``),B=r(``),Re=[{value:`modern`,label:`现代极简`,desc:`蓝色调，圆角卡片，半透明`},{value:`xiuxian`,label:`仙侠古风`,desc:`金色调，毛笔风格，玉简感`},{value:`cyber`,label:`赛博朋克`,desc:`霓虹青绿，monospace，HUD感`},{value:`dark`,label:`暗黑奇幻`,desc:`红黑配色，羊皮纸，哥特风`},{value:`school`,label:`校园清新`,desc:`粉蓝柔和，圆润字体`},{value:`custom`,label:`自定义`,desc:`用额外要求详细描述`}],V={modern:`现代极简风：蓝色调(#60a5fa)，圆角卡片(border-radius:10px)，半透明背景(rgba(10,10,25,0.65))，blur毛玻璃，无衬线字体`,xiuxian:`仙侠古风：金色主调(#ffd700)，衬线字体(serif)，暗紫黑背景，标题加letter-spacing和金色发光阴影`,cyber:`赛博朋克：青绿霓虹(#00e5ff)，monospace字体，HUD风格，方形边框，扫描线效果`,dark:`暗黑奇幻：红黑配色(#e94560+#1a0a0a)，哥特衬线字体，羊皮纸纹理感，深红边框`,school:`校园清新：粉蓝柔和(#a5b4fc+#fbcfe8)，圆润字体，柔和阴影`,custom:`按用户额外要求中描述的风格设计`},H={grouped:`分组面板：按变量组分块显示，每组有标题和子项`,vertical:`竖向列表：每个变量独占一行，左侧标签右侧数值`,grid:`网格布局：2-3列卡片，每个卡片显示一个变量`,dashboard:`仪表盘：重要数值大字体居中，次要数值小字列表`},U=o(()=>m.tavernScripts.some(e=>e.content&&e.content.includes(`MagVarUpdate`))||m.worldEntries.some(e=>{let t=(e.comment||``).toLowerCase();return t.includes(`initvar`)||t.includes(`变量初始化`)})),ze=o(()=>{let e=m.worldEntries.find(e=>{let t=(e.comment||``).toLowerCase();return t.includes(`initvar`)||t.includes(`变量初始化`)});return e?e.content||`(空)`:`(未找到)`});function Be(){let e=m.cardData.extensions?.cfMvuVarGroups;if(Array.isArray(e)){let t=[];for(let n of e)if(n.name)for(let e of n.fields||[])e.name&&t.push({group:n.name,field:e.name,type:e.type||`string`,default:String(e.defaultValue??``)});if(t.length>0)return t}let t=m.worldEntries.find(e=>{let t=(e.comment||``).toLowerCase();return t.includes(`initvar`)||t.includes(`变量初始化`)});return t?oe(t.content):[]}async function W(){if(N.value===`text`){R.value=[],j.value=1,await G();return}let e=Be();if(e.length>0){R.value=e,j.value=1,A.toastSuccess(`已加载 ${e.length} 个已有变量路径`);return}if(!k.isConfigured){A.toastError(`请先配置 API Key`);return}L.value=!0;try{let e=p(m),t=await k.chat([{role:`system`,content:`你是角色卡变量系统设计师。根据角色卡和用户需求设计状态栏需要的变量路径。只输出JSON，不要说明文字。`},{role:`user`,content:Ze(e)}],{temperature:.7,maxTokens:k.getModelMaxTokens(k.activeProvider?.model)}),n=t.match(/```json\s*\n([\s\S]*?)```/),r=n?n[1].trim():t.replace(/```[\w]*\s*\n?/g,``).replace(/```/g,``).trim();R.value=JSON.parse(r),j.value=1,A.toastSuccess(`变量清单已生成（${R.value.length} 个）`)}catch(e){A.toastError(`生成失败: `+e.message)}finally{L.value=!1}}async function G(){if(!k.isConfigured){A.toastError(`请先配置 API Key`);return}L.value=!0;try{let e=p(m),t=N.value===`text`?$e(e):Qe(e,R.value),n=k.getModelMaxTokens(k.activeProvider?.model),r=K(await k.chat([{role:`system`,content:`你是前端状态栏开发专家。严格按要求输出完整HTML代码，不要说明文字。`},{role:`user`,content:t}],{temperature:.8,maxTokens:n}));for(let e=0;e<3&&!q(r);e++){let i=He(r),a=i.length>0?`缺少以下tab的内容div：${i.join(`、`)}。`:`HTML缺少</body></html>结尾。`;A.toastWarning(`${a}自动续写中（${e+1}/3）...`);let o=r;r.includes(`</html>`)&&i.length>0&&(o=r.replace(/<\/body>\s*<\/html>\s*$/,``).replace(/<\/html>\s*$/,``));let s=i.length>0?`你上面输出的状态栏代码缺少了这些tab页面的内容div：${i.join(`、`)}。\n请只输出缺失的tab content div，接在已有代码末尾。变量路径、元素id和样式沿用最初的要求和已有代码，不要重复已有内容，不要输出<head>和<style>，最后以</div></body></html>结尾。`:`你上面输出的HTML代码被截断了，请从断点处继续输出剩余代码。变量路径、元素id和样式沿用最初的要求和已有代码，不要重复已有内容。`,c=K(await k.chat([{role:`system`,content:`你是前端状态栏开发专家。继续输出缺失的HTML代码，不要说明文字。注释只用/* */。`},{role:`user`,content:t},{role:`assistant`,content:o},{role:`user`,content:s}],{temperature:.3,maxTokens:n}));if(!c)break;r.includes(`</html>`)&&i.length>0?r=o+`
`+c:r+=`
`+c}z.value=Ve(r),q(z.value)||A.toastWarning(`HTML 仍未完整，建议简化需求后重试`),j.value=2,A.toastSuccess(`状态栏已生成，请预览`)}catch(e){A.toastError(`生成失败: `+e.message)}finally{L.value=!1}}function K(e){let t=e.trim(),n=t.match(/```html\s*\n([\s\S]*?)```/);return n?n[1].trim():t.replace(/```[\w]*\s*\n?/g,``).replace(/```/g,``).trim()}function Ve(e){let t=e.match(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i);if(!t)return e;let n=e.substring(0,e.indexOf(t[0])),r=t[1],i=t[2],a=t[3],o=e.substring(e.indexOf(t[0])+t[0].length);return i=i.replace(/\/\*[\s\S]*?\*\//g,``),i=i.replace(/\n{3,}/g,`

`),n+r+i+a+o}function He(e){let t=[],n=/data-target=["']([^"']+)["']/g,r;for(;(r=n.exec(e))!==null;)t.push(r[1]);return t.filter(t=>!e.includes(`id="`+t+`"`)&&!e.includes(`id='`+t+`'`))}function q(e){if(!e.includes(`</html>`)&&!e.includes(`</body>`))return!1;let t=[],n=/data-target=["']([^"']+)["']/g,r;for(;(r=n.exec(e))!==null;)t.push(r[1]);if(t.length>0){for(let n of t)if(!e.includes(`id="`+n+`"`)&&!e.includes(`id='`+n+`'`))return!1}return!0}function Ue(){if(!z.value)return;let e=[`状态栏美化`,`状态栏`,`前端状态栏渲染`,`[隐藏]状态栏占位符`,`[清理]旧楼层状态栏`,`对AI隐藏状态数据`];m.regexScripts.some(t=>e.includes(t.scriptName))?A.confirmAction(`已存在状态栏正则，是否替换？`,()=>J()):J()}function J(){let e=[`状态栏美化`,`状态栏`,`前端状态栏渲染`,`[隐藏]状态栏占位符`,`[清理]旧楼层状态栏`,`对AI隐藏状态数据`];for(let t=m.regexScripts.length-1;t>=0;t--)e.includes(m.regexScripts[t].scriptName)&&m.removeRegexScript(m.regexScripts[t].id);for(let e=m.worldEntries.length-1;e>=0;e--)(m.worldEntries[e].comment||``).includes(`状态数据输出指令`)&&m.removeWorldEntry(m.worldEntries[e].id);N.value===`text`?Ge():We(),m.markDirty(),j.value=3}function We(){m.addRegexScript({...m.createEmptyRegexScript(),scriptName:`状态栏美化`,findRegex:`/<StatusPlaceHolderImpl\\s*\\/>/g`,replaceString:"```html\n"+z.value+"\n```",markdownOnly:!0,promptOnly:!1}),m.regexScripts.some(e=>e.scriptName===`[不发送]界面占位符`)||m.addRegexScript({...m.createEmptyRegexScript(),scriptName:`[不发送]界面占位符`,findRegex:`/<StatusPlaceHolderImpl\\s*\\/>/g`,replaceString:``,markdownOnly:!1,promptOnly:!0}),Ke();let e=``;R.value.length>0&&(e=Y(R.value)),B.value=`状态栏美化正则已创建`+(e?`，`+e:``),A.toastSuccess(`状态栏已应用`)}function Ge(){let e=z.value;e=e.replace(/<\/body>/,'<script type="module">window.__statusRawText=`$1`;<\/script>\n</body>'),m.addRegexScript({...m.createEmptyRegexScript(),scriptName:`状态栏`,findRegex:`/<StatusData>([\\s\\S]*?)<\\/StatusData>/gm`,replaceString:"```html\n"+e+"\n```",markdownOnly:!0,promptOnly:!1}),m.addRegexScript({...m.createEmptyRegexScript(),scriptName:`对AI隐藏状态数据`,findRegex:`/<StatusData>[\\s\\S]*?<\\/StatusData>/gm`,replaceString:``,markdownOnly:!1,promptOnly:!0,minDepth:6});let t=m.addWorldEntry();t.comment=`状态数据输出指令`,t.content=`状态数据输出规则:
  - 每次回复结束后，必须在末尾追加 <StatusData> 块
  - 格式为每行一个 "字段名:值"，冒号后紧跟值
  - <StatusData> 块不出现在正文中

输出格式示例:
  <StatusData>
  位置:某个地方
  状态:正常
  </StatusData>`,t.constant=!0,t.enabled=!0,t.position=4,t.insertion_order=200,t.extensions||={},t.extensions.depth=0,t.extensions.prevent_recursion=!0,t.extensions.exclude_recursion=!0,B.value=`纯文本状态栏已应用（2 正则 + 1 世界书指令条目）`,A.toastSuccess(`纯文本状态栏已应用`)}function Y(e){let t={};for(let n of e){let e=n.group||`其他`;t[e]||(t[e]=[]),t[e].push({name:n.field||``,type:n.type||`string`,defaultValue:String(n.default??``),min:null,max:null,clamp:!1,enumValues:``,recordFields:``,description:``,showAdvanced:!1})}let n=Object.entries(t).map(([e,t])=>({name:e,fields:t}));m.cardData.extensions||(m.cardData.extensions={});let r=m.cardData.extensions.cfMvuVarGroups;if(r&&r.length>0)for(let e of n){let t=r.find(t=>t.name===e.name);if(t)for(let n of e.fields)t.fields.find(e=>e.name===n.name)||t.fields.push(JSON.parse(JSON.stringify(n)));else r.push(JSON.parse(JSON.stringify(e)))}else m.cardData.extensions.cfMvuVarGroups=JSON.parse(JSON.stringify(n));let i=m.tavernScripts.some(e=>e.content&&e.content.includes(`MagVarUpdate`)),a=m.worldEntries.some(e=>(e.comment||``).includes(`变量更新规则`)),o=m.cardData.extensions.cfMvuVarGroups;if(i&&a)return qe(o),`已补充变量到 MVU`;if(!i){let e=m.createEmptyTavernScript();e.name=`MVU 变量系统`,e.content=`import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';`,e.button={enabled:!0,buttons:[{name:`重新处理变量`,visible:!0},{name:`重新读取初始变量`,visible:!0},{name:`清除旧楼层变量`,visible:!1},{name:`快照楼层`,visible:!1},{name:`重演楼层`,visible:!1},{name:`重试额外模型解析`,visible:!1}]},m.addTavernScript(e)}if(!m.tavernScripts.some(e=>(e.name||``).includes(`Zod`))){let e=m.createEmptyTavernScript();e.name=`Zod Schema`,e.content=Je(o),m.addTavernScript(e)}let s=(e,t={})=>{e.constant=t.constant===void 0?!0:t.constant,e.enabled=t.enabled===void 0?!0:t.enabled,e.extensions.position=4,e.insertion_order=t.order||200,e.extensions||={},e.extensions.depth=0,e.extensions.prevent_recursion=!0,e.extensions.exclude_recursion=!0};if(!m.worldEntries.some(e=>(e.comment||``).toLowerCase().includes(`initvar`))){let e=m.addWorldEntry();e.comment=`[initvar]变量初始化勿开`,e.content=Ye(o),s(e,{constant:!1,enabled:!1})}if(!m.worldEntries.some(e=>(e.comment||``).includes(`变量列表`))){let e=m.addWorldEntry();e.comment=`变量列表`,e.content=`---
<status_current_variables>
{{format_message_variable::stat_data}}
</status_current_variables>`,s(e)}if(!m.worldEntries.some(e=>(e.comment||``).includes(`变量更新规则`))){let e=m.addWorldEntry();e.comment=`[mvu_update]变量更新规则`,e.content=Xe(o),s(e)}if(!m.worldEntries.some(e=>(e.comment||``).includes(`变量输出格式`)&&!(e.comment||``).includes(`强调`))){let e=m.addWorldEntry();e.comment=`[mvu_update]变量输出格式`,e.content=Fe,s(e)}if(!m.worldEntries.some(e=>(e.comment||``).includes(`变量输出格式强调`))){let e=m.addWorldEntry();e.comment=`[mvu_update]变量输出格式强调`,e.content=Ie,s(e)}let c=m.regexScripts.map(e=>e.scriptName);for(let e of[{scriptName:`[美化]变量更新中`,findRegex:`/<UpdateVariable>(?![\\s\\S]*<\\/UpdateVariable>)([\\s\\S]*)/gs`,replaceString:`<details open style="background:rgba(0,0,0,0.15);border:1px solid rgba(100,200,255,0.15);border-radius:6px;padding:8px;margin:4px 0;font-size:12px"><summary style="cursor:pointer;color:#60a5fa">变量更新中...</summary><pre style="white-space:pre-wrap;color:#aaa;margin:4px 0">$1</pre></details>`,markdownOnly:!0,promptOnly:!1},{scriptName:`[美化]完整变量完成`,findRegex:`/<UpdateVariable>([\\s\\S]*?)<\\/UpdateVariable>/gs`,replaceString:`<details style="background:rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px;margin:4px 0;font-size:12px"><summary style="cursor:pointer;color:#888">变量更新</summary><pre style="white-space:pre-wrap;color:#aaa;margin:4px 0">$1</pre></details>`,markdownOnly:!0,promptOnly:!1},{scriptName:`只发送最新3楼的变量更新`,findRegex:`/<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>/gm`,replaceString:``,markdownOnly:!1,promptOnly:!0,minDepth:6}])c.includes(e.scriptName)||m.addRegexScript({...m.createEmptyRegexScript(),...e});return`自动创建了完整 MVU 系统（${e.length} 个变量）`}function Ke(){let e=m.cardData.first_mes||``;e.includes(`StatusPlaceHolderImpl`)||(m.cardData.first_mes=e+`
<StatusPlaceHolderImpl/>`);for(let e=0;e<(m.cardData.alternate_greetings||[]).length;e++)m.cardData.alternate_greetings[e].includes(`StatusPlaceHolderImpl`)||(m.cardData.alternate_greetings[e]+=`
<StatusPlaceHolderImpl/>`)}function qe(e){let t=m.worldEntries.find(e=>{let t=(e.comment||``).toLowerCase();return t.includes(`initvar`)||t.includes(`变量初始化`)});if(!t)return;let n=t.content||``;for(let t of e)if(t.name)if(n.includes(t.name+`:`))for(let e of t.fields){if(!e.name)continue;let r=e.name.includes(`.`)?e.name.split(`.`).pop():e.name;if(!n.includes(r)){let r=n.indexOf(t.name+`:`)+(t.name+`:`).length;n=n.slice(0,r)+`
`+X(e,1)+n.slice(r)}}else{n+=`
`+t.name+`:
`;for(let e of t.fields)e.name&&(n+=X(e,1))}t.content=n}function X(e,t){let n=e.name.split(`.`),r=``;for(let e=0;e<n.length-1;e++)r+=`  `.repeat(t+e)+n[e]+`:
`;let i=n[n.length-1],a=`  `.repeat(t+n.length-1),o=e.type===`record`?`{}`:e.type===`number`?e.defaultValue||`0`:`"`+(e.defaultValue||``)+`"`;return r+=a+i+`: `+o+`
`,r}function Je(e){let t=`import { registerMvuSchema } from
  'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

export const Schema = z.object({
`;for(let n of e){if(!n.name)continue;t+=`  `+n.name+`: z.object({
`;let e={};for(let t of n.fields){if(!t.name)continue;let n=t.name.split(`.`),r=e;for(let e=0;e<n.length-1;e++)r[n[e]]||(r[n[e]]={__children:{}}),r=r[n[e]].__children;let i=t.type===`number`?`z.coerce.number().prefault(`+(t.defaultValue||0)+`)`:t.type===`record`?`z.record(z.string(), z.string().prefault('')).prefault({})`:`z.string().prefault('`+(t.defaultValue||``)+`')`;r[n[n.length-1]]={__zod:i}}t+=Z(e,2),t+=`  }).prefault({}),
`}return t+=`});

$(() => {
  registerMvuSchema(Schema);
});
`,t}function Z(e,t){let n=``,r=`  `.repeat(t);for(let[i,a]of Object.entries(e))a.__zod?n+=r+i+`: `+a.__zod+`,
`:a.__children&&(n+=r+i+`: z.object({
`,n+=Z(a.__children,t+1),n+=r+`}).prefault({}),
`);return n}function Ye(e){let t=``;for(let n of e){if(!n.name)continue;t+=n.name+`:
`;let e={};for(let t of n.fields){if(!t.name)continue;let n=t.name.split(`.`),r=e;for(let e=0;e<n.length-1;e++)(!r[n[e]]||typeof r[n[e]]!=`object`||r[n[e]].__leaf)&&(r[n[e]]={}),r=r[n[e]];let i=t.type===`record`?`{}`:t.type===`number`?t.defaultValue||`0`:`"`+(t.defaultValue||``)+`"`;r[n[n.length-1]]={__leaf:!0,val:i}}t+=Q(e,1)}return t}function Q(e,t){let n=``,r=`  `.repeat(t);for(let[i,a]of Object.entries(e))a&&a.__leaf?n+=r+i+`: `+a.val+`
`:n+=r+i+`:
`+Q(a,t+1);return n}function Xe(e){let t=`---
变量更新规则:
`;for(let n of e){if(!n.name)continue;let e=n.fields.filter(e=>e.name&&!e.name.startsWith(`_`));if(e.length===0)continue;t+=`  `+n.name+`:
`;let r={},i=[];for(let t of e){let e=t.name.indexOf(`.`);if(e>0){let n=t.name.substring(0,e),i=t.name.substring(e+1);r[n]||(r[n]=[]),r[n].push({leaf:i,type:t.type})}else i.push(t)}for(let e of i)t+=`    `+e.name+`:
`,e.type!==`string`&&(t+=`      type: `+e.type+`
`),t+=`      check:
        - update when this value changes in the narrative
`;for(let[e,n]of Object.entries(r))t+=`    `+e+`:
`,t+=`      `+n.map(e=>e.leaf).join(`, `)+`:
`,t+=`        check:
          - update when this value changes in the narrative
`}return t}function Ze(e){return`你是角色卡变量系统设计师。请为这张角色卡设计状态栏需要显示的变量路径。

【角色卡信息】
${e}

${I.value?`【用户需求】
`+I.value+`

`:``}【设计流程 — 按此顺序思考】

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

只输出JSON，不要任何说明文字。`}function Qe(e,t){let n=t.map(e=>{let t=`stat_data.`+e.group+(e.field?`.`+e.field:``),n=e.type===`number`?e.default||`0`:`'`+(e.default||`--`)+`'`,r=(e.field?e.group+`-`+e.field:e.group).replace(/\./g,`-`).toLowerCase();return e.type===`record`||e.type===`array`?`      /* `+t+` 是`+(e.type===`record`?`键值对象`:`数组`)+`，遍历后把每一项渲染进 #`+r+` */`:`      $("#`+r+`").text(_.get(all_variables, '`+t+`', `+n+`));`}).join(`
`);return`根据以下变量路径，生成前端状态栏HTML代码。

【角色卡信息】
${e}

【变量路径清单 — 必须使用且仅使用这些路径】
${JSON.stringify(t,null,2)}

【设计要求】
- 视觉风格：${V[P.value]}
- 布局：${H[F.value]}
${I.value?`- 用户需求：`+I.value:``}

【完整参考模板 — 严格按此结构编写，不可省略任何部分】
\`\`\`html
<!doctype html>
<html lang="zh-CN">
<head>
  <style>
  body {
    margin: 0;
    padding: 0;
  }

  /* 在这里根据用户要求的视觉风格自由设计样式 */
  </style>
  <script type="module">
    function populateCharacterData() {
      const all_variables = getAllVariables();

      /* 用 _.get(all_variables, 'stat_data.路径', 默认值) 读取每个变量 */
      /* 用 \$('#id').text(value) 更新每个元素 */
`+n+`
    }

    async function init() {
      await waitGlobalInitialized('Mvu');
      populateCharacterData();

      /* 监听变量更新事件，实现自动刷新 */
      eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
        populateCharacterData();
      });

      $("[data-target]").on("click", function () {
        const target = $(this).data("target");
        $("[data-target]").removeClass("active");
        $(this).addClass("active");
        $(".tab-content, [data-tab-content]").removeClass("active");
        $("#" + target).addClass("active");
      });
    }

    $(errorCatched(init));
  <\/script>
</head>
<body>
  <!-- 在这里根据用户要求的布局设计HTML结构 -->
  <!-- 每个需要显示的变量必须有唯一的 id，在 populateCharacterData 中用 $('#id').text(value) 填充 -->
  <!-- 预填值为 0 或 "--" -->
</body>
</html>
\`\`\`


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

用 \`\`\`html 代码块包裹，只输出代码，不要说明文字。`}function $e(e){return`生成纯文本模式的状态栏。数据来源是 AI 每次回复末尾输出的 <StatusData> 标签。

【角色卡信息】
${e}

【设计要求】
- 视觉风格：${V[P.value]}
- 布局：${H[F.value]}
${I.value?`- 用户需求：`+I.value:``}

【完整参考模板 — 严格按此结构编写】
\`\`\`html
<!doctype html>
<html lang="zh-CN">
<head>
  <style>
  body { margin: 0; padding: 0; }
  /* 根据用户要求设计样式 */
  </style>
  <script type="module">
    function parseAndDisplay() {
      const raw = window.__statusRawText || "";
      const lines = raw.trim().split("\\n").filter(Boolean);
      const data = {};
      lines.forEach(l => {
        const i = l.indexOf(":");
        if (i > 0) data[l.slice(0, i).trim()] = l.slice(i + 1).trim();
      });
      if (Object.keys(data).length > 0) {
        for (const [k, v] of Object.entries(data)) {
          const el = document.getElementById("st-" + k);
          if (el) el.textContent = v;
        }
      }
    }
    parseAndDisplay();
  <\/script>
</head>
<body>
  <div id="st-panel">
    <!-- 每个字段一行，预填值为 "--" -->
  </div>
</body>
</html>
\`\`\`


【重要提示】
- 仅能使用 /* 注释 */，禁止 //
- body必须 margin:0; padding:0
- 必须输出完整的 </body></html> 结尾

用 \`\`\`html 代码块包裹，只输出代码。`}let $=r(null),et=o(()=>z.value||``);function tt(){setTimeout(()=>{try{let e=$.value;if(!e?.contentDocument?.body)return;e.style.height=Math.max(150,Math.min(e.contentDocument.body.scrollHeight+24,800))+`px`}catch{}},100)}return(r,o)=>(n(),c(`div`,se,[u(`div`,ce,[o[7]||=u(`div`,null,[u(`h1`,null,`前端状态栏`),u(`p`,null,`引导式状态栏设计 — 从需求到渲染`)],-1),u(`div`,le,[u(`div`,ue,[(n(),c(a,null,i(Le,(t,n)=>u(`button`,{key:n,class:e([`step-btn`,{active:j.value===n,done:n<j.value}]),onClick:e=>M(n)},[u(`span`,fe,d(n+1),1),u(`span`,pe,d(t),1)],10,de)),64))])])]),j.value===0?(n(),c(a,{key:0},[o[17]||=u(`div`,{class:`card mb-md`},[u(`div`,{class:`card__body hint`,style:{"line-height":`1.8`}},[l(` 状态栏是一段 HTML 代码，读取 MVU 变量并以面板形式显示在 AI 回复下方。`),u(`br`),l(` · `),u(`strong`,null,`MVU 模式`),l(`：通过 `),u(`code`,null,`getAllVariables().stat_data`),l(` 读取变量数据`),u(`br`),l(` · `),u(`strong`,null,`纯文本模式`),l(`：AI 每次回复末尾输出 <StatusData> 标签，状态栏从中解析`),u(`br`),l(` · 生成后自动创建正则 + 自动创建/补全 MVU 变量系统 `)])],-1),u(`div`,me,[o[8]||=u(`div`,{class:`card__header`},[u(`h3`,null,`检测到的 MVU 变量`)],-1),u(`div`,he,[U.value?(n(),c(`pre`,_e,d(ze.value),1)):(n(),c(`div`,ge,` 未检测到 MVU 变量系统。生成状态栏后会自动创建。 `))])]),u(`div`,ve,[o[15]||=u(`div`,{class:`card__header`},[u(`h3`,null,`状态栏配置`)],-1),u(`div`,ye,[u(`div`,be,[o[10]||=u(`label`,null,`模式`,-1),t(u(`select`,{class:`select`,"onUpdate:modelValue":o[0]||=e=>N.value=e},[...o[9]||=[u(`option`,{value:`mvu`},`MVU 变量模式 — 从变量系统读取实时数据`,-1),u(`option`,{value:`text`},`纯文本模式 — AI 每次回复输出状态文本，无需 MVU`,-1)]],512),[[f,N.value]])]),u(`div`,xe,[o[11]||=u(`label`,null,`视觉风格`,-1),u(`div`,Se,[(n(),c(a,null,i(Re,n=>u(`label`,{key:n.value,class:e([`style-card`,{active:P.value===n.value}]),onClick:e=>P.value=n.value},[t(u(`input`,{type:`radio`,"onUpdate:modelValue":o[1]||=e=>P.value=e,value:n.value,hidden:``},null,8,we),[[te,P.value]]),u(`strong`,null,d(n.label),1),u(`span`,null,d(n.desc),1)],10,Ce)),64))])]),u(`div`,Te,[o[13]||=u(`label`,null,`布局方式`,-1),t(u(`select`,{class:`select`,"onUpdate:modelValue":o[2]||=e=>F.value=e},[...o[12]||=[u(`option`,{value:`grouped`},`分组面板（按变量组分块显示）`,-1),u(`option`,{value:`vertical`},`竖向列表（每个变量一行）`,-1),u(`option`,{value:`grid`},`网格布局（2-3列卡片）`,-1),u(`option`,{value:`dashboard`},`仪表盘（重要数值大显示）`,-1)]],512),[[f,F.value]])]),u(`div`,h,[o[14]||=u(`label`,null,`额外要求`,-1),t(u(`textarea`,{class:`textarea`,"onUpdate:modelValue":o[3]||=e=>I.value=e,rows:`5`,placeholder:`详细描述你想要的状态栏内容和效果，越详细越好。

例如：
- 主角单独一页，显示各种货币数量和装备
- 装备分头部/胸部/腿部/脚部/武器
- 伙伴单独一页，带好感度和装备
- NPC单独一页，带心里话
- 做成可翻页的多页界面`},null,512),[[ne,I.value]])])])]),u(`div`,g,[o[16]||=u(`span`,null,null,-1),u(`button`,{class:`btn btn--primary`,onClick:W,disabled:L.value},d(L.value?`生成中...`:U.value&&N.value===`mvu`?`下一步：使用已有变量`:N.value===`text`?`下一步：生成状态栏`:`下一步：生成变量路径`),9,_)])],64)):s(``,!0),j.value===1?(n(),c(a,{key:1},[o[18]||=u(`div`,{class:`card mb-md`},[u(`div`,{class:`card__body hint`,style:{"line-height":`1.8`}},` 以下是状态栏将使用的变量路径。确认无误后点击下一步生成状态栏界面。 `)],-1),u(`div`,v,[u(`div`,y,[u(`h3`,null,`变量清单（`+d(R.value.length)+` 个）`,1),u(`button`,{class:`btn btn--accent`,onClick:W,disabled:L.value},d(L.value?`生成中...`:`重新生成路径`),9,b)]),u(`div`,x,[u(`pre`,S,d(JSON.stringify(R.value,null,2)),1)])]),u(`div`,C,[u(`button`,{class:`btn btn--secondary`,onClick:o[4]||=e=>M(0)},`上一步：修改需求`),u(`button`,{class:`btn btn--primary`,onClick:G,disabled:L.value||R.value.length===0},d(L.value?`生成中...`:`下一步：生成状态栏`),9,w)])],64)):s(``,!0),j.value===2?(n(),c(a,{key:2},[o[21]||=u(`div`,{class:`card mb-md`},[u(`div`,{class:`card__body hint`},` 预览中显示的是预填示例数据，实际运行时会用真实变量覆盖。 `)],-1),u(`div`,T,[u(`div`,E,[o[19]||=u(`h3`,null,`状态栏预览`,-1),u(`button`,{class:`btn btn--accent`,onClick:G,disabled:L.value},d(L.value?`生成中...`:`重新生成状态栏`),9,D)]),u(`div`,O,[u(`iframe`,{class:`status-bar-iframe`,srcdoc:et.value,ref_key:`previewIframe`,ref:$,onLoad:tt,sandbox:`allow-scripts allow-same-origin`},null,40,Ee)])]),u(`details`,De,[o[20]||=u(`summary`,{class:`card__header`,style:{cursor:`pointer`}},[u(`h3`,null,`查看源码`)],-1),u(`div`,Oe,[u(`pre`,ke,d(z.value),1)])]),u(`div`,Ae,[u(`button`,{class:`btn btn--secondary`,onClick:o[5]||=e=>M(N.value===`text`?0:1)},` 上一步：`+d(N.value===`text`?`修改需求`:`修改路径`),1),u(`button`,{class:`btn btn--primary`,onClick:Ue},`确认并应用`)])],64)):s(``,!0),j.value===3?(n(),c(a,{key:3},[u(`div`,je,[u(`div`,Me,[o[22]||=u(`h2`,{style:{color:`var(--cf-accent)`,"margin-bottom":`12px`}},`状态栏应用完成`,-1),u(`p`,Ne,d(B.value),1)])]),o[24]||=u(`div`,{class:`card mb-md`},[u(`div`,{class:`card__body hint`,style:{"line-height":`1.8`}},[u(`strong`,null,`确认事项：`),u(`br`),l(` · 酒馆助手渲染页面「启用渲染器」已打开，「启用代码折叠」设为「仅前端」`),u(`br`),l(` · 正则脚本中「状态栏美化」已启用`),u(`br`),l(` · 新开聊天后状态栏应出现在 AI 回复下方 `)])],-1),u(`div`,Pe,[u(`button`,{class:`btn btn--secondary`,onClick:o[6]||=e=>M(0)},`重新设计`),o[23]||=u(`span`,null,null,-1)])],64)):s(``,!0)]))}},[[`__scopeId`,`data-v-c61ddd30`]]);export{k as default};