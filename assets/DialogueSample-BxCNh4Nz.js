import{$ as e,A as t,C as n,F as r,M as i,T as a,a as o,d as s,f as c,h as l,l as u,t as d,tt as f}from"./app-Cd1I7MXh.js";import{a as p,n as m,o as ee}from"./runtime-dom.esm-bundler-C5vljRIB.js";import{t as h}from"./card-O4uKpNGl.js";import{t as g}from"./plugin-vue_export-helper-DKl4mWgK.js";import{t as _}from"./api-BzPMTnBs.js";var v={class:`page`},y={class:`tabs`},b={key:0},x={class:`card mb-md`},S={class:`card__body`},te={class:`form-row`},ne={class:`form-group`},re={class:`form-group`},ie={style:{display:`flex`,"flex-wrap":`wrap`,gap:`8px`}},ae=[`value`],oe={class:`form-group`},C=[`disabled`],w={key:0,class:`card`},T={class:`card__body`},E={class:`result-text selectable`},D={key:1},O={class:`card mb-md`},k={class:`card__body`},A={class:`form-row`},j={class:`form-group`},M={class:`form-group`},N={style:{display:`flex`,"flex-wrap":`wrap`,gap:`8px`}},P=[`value`],F=[`disabled`],I={key:0,class:`card`},L={class:`card__body`},R={class:`result-text selectable`},z=g({__name:`DialogueSample`,setup(g){let z=h(),B=_(),V=d(),H=i(`sample`),U=i(!1),W=i(5),G=i(``),K=i(``),q=i([`daily`,`emotion`,`conflict`]),J=[{value:`daily`,label:`日常闲聊`},{value:`emotion`,label:`情感互动`},{value:`conflict`,label:`矛盾冲突`},{value:`humor`,label:`幽默搞笑`},{value:`serious`,label:`严肃正经`},{value:`secret`,label:`秘密/隐私`},{value:`action`,label:`动作/战斗`},{value:`romance`,label:`浪漫暧昧`}],Y=i(`medium`),X=i(``),Z=i([`personality`,`daily`,`relationship`]),Q=[{value:`personality`,label:`性格内心`},{value:`daily`,label:`日常习惯`},{value:`relationship`,label:`人际关系`},{value:`past`,label:`过去经历`},{value:`dream`,label:`梦想恐惧`},{value:`philosophy`,label:`价值观`},{value:`secret`,label:`秘密矛盾`},{value:`combat`,label:`战斗能力`}];async function se(){if(!B.isConfigured){V.toastError(`请先配置 API Key`);return}let e=z.cardData;if(!e.name){V.toastError(`请先填写角色名称`);return}U.value=!0;try{let t=q.value.map(e=>J.find(t=>t.value===e)?.label).filter(Boolean),n=`你是 SillyTavern 对话样本专家。请为以下角色生成 ${W.value} 组对话示例。

角色名：${e.name}
性格：${e.personality||`(未填)`}
描述：${(e.description||``).slice(0,500)||`(未填)`}
场景设定：${e.scenario||`(未填)`}

要求：
1. 生成 ${W.value} 组不同场景的对话
2. 场景类型包含：${t.join(`、`)}
3. 每组用 <START> 分隔
4. 用 {{user}} 代表用户，{{char}} 代表角色
5. {{char}} 的回复要包含动作描写（用 *星号* 包裹）和对话
6. 每组 {{user}} 说 1 句，{{char}} 回复 3-5 句（含动作和对话交替）
7. 要充分体现角色的说话风格、性格特点和小动作
${G.value?`8. 额外要求：`+G.value:``}

直接输出对话内容，不要加任何说明文字。`;K.value=await B.chat([{role:`system`,content:`你是专业的角色卡对话样本撰写专家，擅长写出有角色特色的对话示例。`},{role:`user`,content:n}],{temperature:.85,maxTokens:B.getModelMaxTokens(B.activeProvider?.model)}),V.toastSuccess(`对话样本生成完成`)}catch(e){V.toastError(`生成失败: `+e.message)}finally{U.value=!1}}async function ce(){if(!B.isConfigured){V.toastError(`请先配置 API Key`);return}let e=z.cardData;if(!e.name){V.toastError(`请先填写角色名称`);return}U.value=!0;try{let t=Z.value.map(e=>Q.find(t=>t.value===e)?.label).filter(Boolean),n=Y.value===`light`?5:Y.value===`medium`?10:15,r=`你是一位角色采访记者。现在要采访一个虚构角色来深入了解 TA 的内心世界。

角色名：${e.name}
已知性格：${e.personality||`(未填)`}
已知描述：${(e.description||``).slice(0,500)||`(未填)`}
场景设定：${e.scenario||`(未填)`}

请进行 ${n} 个问题的采访，主题涵盖：${t.join(`、`)}

格式要求：
- 每个问答用"Q:"开头提问，"A:"开头回答
- 角色回答时要完全保持 TA 的性格和说话方式
- 回答要包含动作描写（用 *星号* 包裹）
- 回答要自然真实，像真正的采访，不要太正式
- 通过回答挖掘出角色description中没有的新信息（新的小习惯、隐藏的想法、不为人知的一面）
- Q 的问题要逐渐深入，从轻松到私密

直接输出采访内容。`;X.value=await B.chat([{role:`system`,content:`你是专业的角色采访记者，擅长通过对话挖掘虚构角色的深层性格。`},{role:`user`,content:r}],{temperature:.9,maxTokens:B.getModelMaxTokens(B.activeProvider?.model)}),V.toastSuccess(`角色采访完成`)}catch(e){V.toastError(`采访失败: `+e.message)}finally{U.value=!1}}function le(){if(!K.value)return;let e=z.cardData.mes_example||``;z.cardData.mes_example=e+(e?`

`:``)+K.value,z.markDirty(),V.toastSuccess(`已写入 mes_example`)}function $(){if(!X.value)return;let e=z.cardData.description||``;z.cardData.description=e+(e?`

`:``)+`【角色采访补充】
`+X.value,z.markDirty(),V.toastSuccess(`已补充到 description`)}function ue(){if(!X.value)return;let e=X.value.split(`
`),t=``;for(let n of e){let e=n.trim();e.startsWith(`Q:`)||e.startsWith(`Q：`)?t+=`
<START>
{{user}}: `+e.replace(/^Q[：:]\s*/,``)+`
`:e.startsWith(`A:`)||e.startsWith(`A：`)?t+=`{{char}}: `+e.replace(/^A[：:]\s*/,``)+`
`:e&&t&&(t+=e+`
`)}let n=z.cardData.mes_example||``;z.cardData.mes_example=n+(n?`
`:``)+t.trim(),z.markDirty(),V.toastSuccess(`已转换并写入 mes_example`)}return(i,d)=>(n(),c(`div`,v,[d[20]||=u(`div`,{class:`page__header flex-between`},[u(`div`,null,[u(`h1`,null,`对话样本 & 角色采访`),u(`p`,null,`AI 帮你生成对话示例和深度角色设定`)])],-1),d[21]||=u(`div`,{class:`card mb-md`},[u(`div`,{class:`card__body hint`,style:{"line-height":`1.8`}},[l(` · `),u(`strong`,null,`对话样本`),l(` — AI 帮你写 mes_example（对话示例），教 AI 学会角色的说话风格和小动作`),u(`br`),l(` · `),u(`strong`,null,`角色采访`),l(` — AI 以采访者身份向角色提问，挖掘角色深层性格，结果可补充到 description 或 mes_example`),u(`br`),l(` · 生成前请先在「基本信息」和「角色设定」里填好角色名和基本性格 `)])],-1),u(`div`,y,[u(`div`,{class:e([`tabs__item`,{active:H.value===`sample`}]),onClick:d[0]||=e=>H.value=`sample`},`对话样本生成`,2),u(`div`,{class:e([`tabs__item`,{active:H.value===`interview`}]),onClick:d[1]||=e=>H.value=`interview`},`角色采访`,2)]),H.value===`sample`?(n(),c(`div`,b,[u(`div`,x,[d[12]||=u(`div`,{class:`card__header`},[u(`h3`,null,`生成对话样本`)],-1),u(`div`,S,[d[11]||=u(`p`,{class:`hint mb-md`},`AI 会根据角色的性格和说话方式，自动生成对话示例（mes_example），让 AI 学会角色的语感`,-1),u(`div`,te,[u(`div`,ne,[d[8]||=u(`label`,null,`生成场景数量`,-1),t(u(`select`,{class:`select`,"onUpdate:modelValue":d[2]||=e=>W.value=e},[...d[7]||=[u(`option`,{value:3},`3 组场景`,-1),u(`option`,{value:5},`5 组场景`,-1),u(`option`,{value:8},`8 组场景`,-1)]],512),[[p,W.value]])]),u(`div`,re,[d[9]||=u(`label`,null,`场景类型`,-1),u(`div`,ie,[(n(),c(o,null,a(J,e=>u(`label`,{class:`toggle-label`,key:e.value},[t(u(`input`,{type:`checkbox`,"onUpdate:modelValue":d[3]||=e=>q.value=e,value:e.value},null,8,ae),[[m,q.value]]),l(` `+f(e.label),1)])),64))])])]),u(`div`,oe,[d[10]||=u(`label`,null,`额外要求`,-1),t(u(`input`,{class:`input`,"onUpdate:modelValue":d[4]||=e=>G.value=e,placeholder:`如：要体现角色的傲娇属性、要有打斗场景的对话`},null,512),[[ee,G.value]])]),u(`button`,{class:`btn btn--primary`,style:{width:`100%`},disabled:U.value||!r(z).cardData.name,onClick:se},f(U.value?`生成中...`:`生成对话样本`),9,C)])]),K.value?(n(),c(`div`,w,[u(`div`,{class:`card__header flex-between`},[d[13]||=u(`h3`,null,`生成结果`,-1),u(`button`,{class:`btn btn--primary btn--sm`,onClick:le},`写入 mes_example`)]),u(`div`,T,[u(`pre`,E,f(K.value),1)])])):s(``,!0)])):s(``,!0),H.value===`interview`?(n(),c(`div`,D,[u(`div`,O,[d[18]||=u(`div`,{class:`card__header`},[u(`h3`,null,`角色深度采访`)],-1),u(`div`,k,[d[17]||=u(`p`,{class:`hint mb-md`},`AI 会以采访者的身份向角色提问，角色以自己的性格回答。用于挖掘角色深层性格，生成的内容可以补充到 description 或 mes_example`,-1),u(`div`,A,[u(`div`,j,[d[15]||=u(`label`,null,`采访深度`,-1),t(u(`select`,{class:`select`,"onUpdate:modelValue":d[5]||=e=>Y.value=e},[...d[14]||=[u(`option`,{value:`light`},`轻度（5个问题）— 日常喜好、基本态度`,-1),u(`option`,{value:`medium`},`中度（10个问题）— 含内心世界、过去经历`,-1),u(`option`,{value:`deep`},`深度（15个问题）— 含哲学思考、秘密、矛盾`,-1)]],512),[[p,Y.value]])]),u(`div`,M,[d[16]||=u(`label`,null,`采访主题`,-1),u(`div`,N,[(n(),c(o,null,a(Q,e=>u(`label`,{class:`toggle-label`,key:e.value},[t(u(`input`,{type:`checkbox`,"onUpdate:modelValue":d[6]||=e=>Z.value=e,value:e.value},null,8,P),[[m,Z.value]]),l(` `+f(e.label),1)])),64))])])]),u(`button`,{class:`btn btn--primary`,style:{width:`100%`},disabled:U.value||!r(z).cardData.name,onClick:ce},f(U.value?`采访中...`:`开始角色采访`),9,F)])]),X.value?(n(),c(`div`,I,[u(`div`,{class:`card__header flex-between`},[d[19]||=u(`h3`,null,`采访记录`,-1),u(`div`,{class:`flex-row`},[u(`button`,{class:`btn btn--secondary btn--sm`,onClick:$},`补充到 description`),u(`button`,{class:`btn btn--primary btn--sm`,onClick:ue},`补充到 mes_example`)])]),u(`div`,L,[u(`pre`,R,f(X.value),1)])])):s(``,!0)])):s(``,!0)]))}},[[`__scopeId`,`data-v-ee4d73d2`]]);export{z as default};