import{A as e,C as t,F as n,M as r,T as i,a,c as o,d as s,f as c,h as l,l as u,m as d,t as f,tt as p}from"./app-Cd1I7MXh.js";import{n as m,o as h}from"./runtime-dom.esm-bundler-C5vljRIB.js";import{t as ee}from"./card-O4uKpNGl.js";import{t as te}from"./plugin-vue_export-helper-DKl4mWgK.js";import{t as ne}from"./api-BzPMTnBs.js";import{t as re}from"./card-context-CxT3-AAd.js";import{t as ie}from"./json-repair-dNPF_vYh.js";var ae={class:`page`},oe={class:`page__header flex-between`},g={class:`flex-row`},_=[`disabled`],v={key:0,class:`card`},y={class:`card__header`},b={class:`flex-row`},x={class:`badge badge--accent`},S=[`onUpdate:modelValue`],C={class:`toggle-label`},w=[`onUpdate:modelValue`],T=[`onClick`],E={class:`card__body`},D={class:`form-group`},O=[`onUpdate:modelValue`],k={class:`form-group`},A=[`onUpdate:modelValue`],j={class:`hint`},M={class:`flex-row mb-md`},N=[`onClick`],P=[`onClick`],F=[`onClick`],se=[`onClick`],I=[`onClick`],L={class:`form-group`},R={class:`flex-between`},z={class:`toggle-label`},B=[`onUpdate:modelValue`],V={key:0},H=[`onUpdate:modelValue`],U={class:`toggle-label`},W=[`onUpdate:modelValue`],G=[`onClick`],K=[`onClick`],q=te({__name:`ScriptEditor`,setup(te){let q=ee(),J=ne(),Y=f(),X=r(!1);async function ce(){if(!J.isConfigured){Y.toastError(`请先配置 API Key`);return}X.value=!0;try{let e=re(q),t=q.worldEntries.length>0,n=q.tavernScripts.some(e=>e.content&&e.content.includes(`MagVarUpdate`)),r=await ie(J,[{role:`system`,content:`你是酒馆助手脚本专家。只输出合法JSON数组。`},{role:`user`,content:`你是 SillyTavern 酒馆助手脚本专家。根据以下角色卡信息，自动判断需要什么脚本并生成。

【角色卡信息】
${e}

【当前状态】
- 已有世界书条目：${t?`是`:`否`}
- 已有MVU变量系统：${n?`是`:`否`}
- 已有脚本数：${q.tavernScripts.length}

请自动判断这张卡需要什么脚本。常见判断逻辑：
- 有MVU → 需要 MVU 加载脚本 + Zod Schema
- 有复杂数值系统 → 需要自动化脚本（如每日体力恢复）
- 有NPC好感度 → 可能需要注入提示词脚本

对每个脚本，输出 JSON 数组：
[{ "name": "脚本名称", "content": "完整JS代码", "info": "说明" }]

只生成真正需要的脚本。只输出JSON。`}],{temperature:.7,maxTokens:J.getModelMaxTokens(J.activeProvider?.model)});for(let e of r)q.addTavernScript({...q.createEmptyTavernScript(),name:e.name||`AI 生成脚本`,content:(e.content||``).trim(),info:e.info||``});Y.toastSuccess(`AI 全自动生成了 ${r.length} 个脚本`)}catch(e){Y.toastError(`全自动生成失败: `+e.message)}finally{X.value=!1}}let Z=o(()=>q.tavernScripts),Q={mvu:`import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';`,zod:`import { registerMvuSchema } from
  'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// z 和 _ (lodash) 已全局可用

export const Schema = z.object({
  世界: z.object({
    日期: z.string().prefault('第1天'),
    时间: z.string().prefault('08:00'),
    位置: z.string().prefault('未知'),
  }).prefault({}),

  主角: z.object({
    HP: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(100),
    金钱: z.coerce.number().transform(v => Math.max(0, v)).prefault(1000),
  }).prefault({}),

  NPC: z.record(z.string(), z.object({
    好感度: z.coerce.number().transform(v => _.clamp(v, -100, 100)).prefault(0),
  })).prefault({}),
});

$(() => { registerMvuSchema(Schema); });`,auto:`// 自动化脚本模板 — 监听变量更新
$(() => {
  waitGlobalInitialized('Mvu').then(() => {
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, errorCatched(async () => {
      const data = Mvu.getMvuData({ type: 'message' });
      if (!data) return;

      // 在这里编写自动化逻辑
      // 例: 自动恢复体力
      // const hp = _.get(data, '主角.HP', 100);
      // if (hp < 100) {
      //   _.set(data, '主角.HP', Math.min(100, hp + 5));
      //   Mvu.replaceMvuData(data, { type: 'message' });
      // }
    }));
  });
});`,command:`// 命令解析修正模板 — 修复AI输出的变量更新命令
$(() => {
  waitGlobalInitialized('Mvu').then(() => {
    eventOn(Mvu.events.COMMAND_PARSED, errorCatched(commands => {
      commands.forEach(command => {
        // 修正路径中的错误字符
        command.args[0] = command.args[0].replaceAll('-', '');
        // 可以在这里添加更多修正逻辑
      });
    }));
  });
});`,inject:`// 注入提示词模板 — 动态注入变量值用于绿灯激活
$(() => {
  waitGlobalInitialized('Mvu').then(() => {
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, errorCatched(async (newVars) => {
      const value = _.get(newVars, 'stat_data.主角.好感度', 0);
      injectPrompts([{
        id: '激活-好感度',
        content: '好感度=' + value,
        position: 'none',
        should_scan: true,
      }]);
    }));
  });
});`};function $(e,t){if(e.content){Y.confirmAction(`当前已有代码，是否替换？`,()=>{e.content=Q[t],q.markDirty()});return}e.content=Q[t],q.markDirty()}return(r,o)=>(t(),c(`div`,ae,[u(`div`,oe,[o[8]||=u(`div`,null,[u(`h1`,null,`酒馆助手脚本`),u(`p`,null,`编辑 Tavern Helper 脚本 — MVU加载、Zod Schema、自动化逻辑`)],-1),u(`div`,g,[u(`button`,{class:`btn btn--accent`,onClick:ce,disabled:X.value},p(X.value?`全自动生成中...`:`AI 全自动生成`),9,_),u(`button`,{class:`btn btn--primary`,onClick:o[0]||=e=>n(q).addTavernScript()},`+ 新建脚本`)])]),o[17]||=d(`<div class="card mb-md" data-v-e58e966c><div class="card__body hint" style="line-height:1.8;" data-v-e58e966c> 酒馆助手脚本是用 JavaScript 编写的程序，运行在 SillyTavern 里。常见用途：<br data-v-e58e966c> · <strong data-v-e58e966c>加载 MVU</strong> — 一行 import 语句加载变量系统（用 MVU 页面自动生成更方便）<br data-v-e58e966c> · <strong data-v-e58e966c>Zod Schema</strong> — 定义变量的结构和范围约束<br data-v-e58e966c> · <strong data-v-e58e966c>自动化</strong> — 监听变量更新，自动计算（如每日体力恢复）<br data-v-e58e966c> · <strong data-v-e58e966c>按钮</strong> — 在界面添加自定义操作按钮<br data-v-e58e966c> · <strong data-v-e58e966c>不需要脚本？</strong> 简单的角色卡不需要这个，只有做游戏系统/变量追踪时才用 </div></div>`,1),Z.value.length===0?(t(),c(`div`,v,[...o[9]||=[u(`div`,{class:`empty-state`},[u(`div`,{class:`empty-state__icon`}),u(`div`,{class:`empty-state__title`},`暂无酒馆助手脚本`),u(`div`,{class:`empty-state__desc`},`脚本可用于加载MVU变量系统、定义Zod Schema、添加按钮等`)],-1)]])):s(``,!0),(t(!0),c(a,null,i(Z.value,(r,d)=>(t(),c(`div`,{key:r.id,class:`card mb-md`},[u(`div`,y,[u(`div`,b,[u(`span`,x,`#`+p(d+1),1),e(u(`input`,{class:`input`,style:{width:`300px`,"font-weight":`600`},"onUpdate:modelValue":e=>r.name=e,onInput:o[1]||=e=>n(q).markDirty()},null,40,S),[[h,r.name]]),u(`label`,C,[e(u(`input`,{type:`checkbox`,"onUpdate:modelValue":e=>r.enabled=e,onChange:o[2]||=e=>n(q).markDirty()},null,40,w),[[m,r.enabled]]),o[10]||=l(` 启用 `,-1)])]),u(`button`,{class:`btn btn--danger btn--sm`,onClick:e=>n(Y).confirmAction(`删除这个脚本？`,()=>n(q).removeTavernScript(r.id))},`删除`,8,T)]),u(`div`,E,[u(`div`,D,[o[11]||=u(`label`,null,`脚本说明 (info)`,-1),e(u(`input`,{class:`input`,"onUpdate:modelValue":e=>r.info=e,placeholder:`可选的说明文字`,onInput:o[3]||=e=>n(q).markDirty()},null,40,O),[[h,r.info]])]),u(`div`,k,[o[12]||=u(`label`,null,`脚本代码 (content)`,-1),e(u(`textarea`,{class:`textarea selectable`,"onUpdate:modelValue":e=>r.content=e,rows:`16`,style:{"font-family":`var(--cf-font-mono)`,"font-size":`12px`,"line-height":`1.6`},placeholder:`JavaScript 代码，如:
import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';`,onInput:o[4]||=e=>n(q).markDirty()},null,40,A),[[h,r.content]]),u(`div`,j,p((r.content||``).length)+` 字符`,1)]),u(`div`,M,[o[13]||=u(`span`,{style:{"font-size":`12px`,color:`var(--cf-text-muted)`}},`快捷插入：`,-1),u(`button`,{class:`btn btn--ghost btn--sm`,onClick:e=>$(r,`mvu`)},`MVU 加载`,8,N),u(`button`,{class:`btn btn--ghost btn--sm`,onClick:e=>$(r,`zod`)},`Zod Schema`,8,P),u(`button`,{class:`btn btn--ghost btn--sm`,onClick:e=>$(r,`auto`)},`自动化模板`,8,F),u(`button`,{class:`btn btn--ghost btn--sm`,onClick:e=>$(r,`command`)},`命令修正`,8,se),u(`button`,{class:`btn btn--ghost btn--sm`,onClick:e=>$(r,`inject`)},`注入提示词`,8,I)]),u(`div`,L,[u(`div`,R,[o[15]||=u(`label`,null,`按钮配置`,-1),u(`label`,z,[e(u(`input`,{type:`checkbox`,"onUpdate:modelValue":e=>r.button.enabled=e,onChange:o[5]||=e=>n(q).markDirty()},null,40,B),[[m,r.button.enabled]]),o[14]||=l(` 启用按钮 `,-1)])]),r.button.enabled?(t(),c(`div`,V,[(t(!0),c(a,null,i(r.button.buttons,(i,a)=>(t(),c(`div`,{key:a,class:`flex-row mb-md`},[e(u(`input`,{class:`input flex-1`,"onUpdate:modelValue":e=>i.name=e,placeholder:`按钮名称`,onInput:o[6]||=e=>n(q).markDirty()},null,40,H),[[h,i.name]]),u(`label`,U,[e(u(`input`,{type:`checkbox`,"onUpdate:modelValue":e=>i.visible=e,onChange:o[7]||=e=>n(q).markDirty()},null,40,W),[[m,i.visible]]),o[16]||=l(` 默认显示 `,-1)]),u(`button`,{class:`btn btn--danger btn--sm`,onClick:e=>{r.button.buttons.splice(a,1),n(q).markDirty()}},`×`,8,G)]))),128)),u(`button`,{class:`btn btn--secondary btn--sm`,onClick:e=>{r.button.buttons.push({name:`新按钮`,visible:!0}),n(q).markDirty()}},` + 添加按钮 `,8,K)])):s(``,!0)])])]))),128))]))}},[[`__scopeId`,`data-v-e58e966c`]]);export{q as default};