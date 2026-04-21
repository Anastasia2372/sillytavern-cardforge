<template>
  <div class="page">
    <div class="page__header flex-between">
      <div>
        <h1>世界书编辑器</h1>
        <p>管理角色卡的世界书条目 — 当前 {{ entries.length }} 条</p>
      </div>
      <div class="flex-row">
        <button class="btn btn--secondary btn--sm" @click="showAiPanel = !showAiPanel; showNovelPanel = false; showRefNovelPanel = false">
          {{ showAiPanel ? '关闭AI生成' : 'AI 生成条目' }}
        </button>
        <button class="btn btn--accent btn--sm" @click="showNovelPanel = !showNovelPanel; showAiPanel = false; showRefNovelPanel = false">
          {{ showNovelPanel ? '关闭' : '小说转世界书' }}
        </button>
        <button class="btn btn--secondary btn--sm" @click="showRefNovelPanel = !showRefNovelPanel; showAiPanel = false; showNovelPanel = false"
          :class="{ 'btn--accent': refNovel.length > 0 }">
          参考小说{{ refNovel.length > 0 ? ' ✓' : '' }}
        </button>
        <button class="btn btn--secondary btn--sm" @click="handleFilter">
          {{ filterText ? '清除筛选' : '筛选' }}
        </button>
        <button class="btn btn--ghost" @click="toggleBatchMode" v-if="entries.length > 0">
          {{ batchMode ? '退出批量' : '批量操作' }}
        </button>
        <button class="btn btn--primary" @click="handleAdd">+ 新建条目</button>
      </div>
    </div>

    <!-- AI 世界书生成面板 -->
    <div v-if="showAiPanel" class="card mb-md ai-panel">
      <div class="card__header">
        <h3>AI 世界书生成</h3>
        <span class="badge badge--info">描述你的世界观，AI 自动生成世界书条目</span>
      </div>
      <div class="card__body">
        <div class="form-group">
          <label>世界观描述 <span class="badge badge--danger">必填</span></label>
          <textarea class="textarea" v-model="aiWorldDesc" rows="6"
            placeholder="详细描述你的世界观设定，越具体越好。例如：&#10;&#10;这是一个修仙世界，以灵气为修炼基础。修为境界分为：凡人→炼气→筑基→金丹→元婴→化神。世界中有多个宗门势力，以青云宗为主。货币系统使用灵石（下品/中品/上品）。主角是青云宗的外门弟子，刚入门不久..."></textarea>
        </div>

        <div class="grid-3">
          <div class="form-group">
            <label>生成类型</label>
            <div class="ai-checks">
              <label class="toggle-label" v-for="opt in entryTypeOpts" :key="opt.value">
                <input type="checkbox" v-model="aiEntryTypes" :value="opt.value"> {{ opt.label }}
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>条目数量目标</label>
            <select class="select" v-model="aiTargetCount">
              <option value="minimal">极简（5-15条）适合纯角色扮演卡</option>
              <option value="small">小型（20-35条）适合日常/校园卡</option>
              <option value="medium">中型（40-70条）适合有世界观的卡</option>
              <option value="large">大型（80-150条）适合开放世界/游戏卡</option>
              <option value="massive">超大型（150-300条）适合史诗级世界观</option>
              <option value="extreme">极限（300-500条）史诗级开放世界</option>
            </select>
          </div>
          <div class="form-group">
            <label>描述风格</label>
            <select class="select" v-model="aiDescStyle">
              <option value="auto">自动选择（AI 根据条目类型自动匹配最佳风格）</option>
              <option value="concise">简洁命令式（节省Token）</option>
              <option value="narrative">叙述体（自然语言）</option>
              <option value="yaml">YAML 结构化</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>额外要求（可选）</label>
          <input class="input" v-model="aiExtraReq"
            placeholder="如：NPC要包含核心矛盾、地点要有互动提示、需要包含战斗规则...">
        </div>

        <button class="btn btn--primary btn--lg" style="width:100%" :disabled="aiGenerating || !aiWorldDesc.trim()"
          @click="handleAiGenerate">
          {{ aiGenerating ? `AI 正在生成... (${aiResults.length} 条)` : '开始生成世界书' }}
        </button>

        <!-- 生成进度条 -->
        <div v-if="aiGenerating" class="ai-progress mt-md">
          <div class="ai-progress__bar">
            <div class="ai-progress__fill" :style="{ width: aiBatchProgress + '%' }"></div>
          </div>
          <div class="ai-progress__text">第 {{ aiBatchCurrent }} / {{ aiBatchTotal }} 批 · 已生成 {{ aiResults.length }} 条</div>
        </div>

        <!-- 生成结果预览 -->
        <div v-if="aiResults.length > 0" class="ai-results mt-md">
          <div class="flex-between mb-md">
            <h4>生成了 {{ aiResults.length }} 条世界书条目</h4>
            <div class="flex-row">
              <button class="btn btn--secondary btn--sm" @click="selectAllResults(!allSelected)">
                {{ allSelected ? '取消全选' : '全选' }}
              </button>
              <button class="btn btn--primary btn--sm" @click="injectSelectedResults">
                注入选中条目 ({{ aiResults.filter(r => r.selected).length }})
              </button>
              <button class="btn btn--secondary btn--sm" @click="continueGenerate" :disabled="aiGenerating">
                {{ aiGenerating ? '生成中...' : '+ 继续生成更多' }}
              </button>
            </div>
          </div>

          <div v-for="(result, i) in aiResults" :key="i" class="ai-result-item"
            :class="{ 'ai-result-item--selected': result.selected }">
            <div class="flex-between">
              <div class="flex-row">
                <input type="checkbox" v-model="result.selected" style="accent-color:var(--cf-accent)">
                <span class="ai-result-item__name">{{ result.comment }}</span>
                <span class="badge" :class="typeBadgeClass(result.type)">{{ result.type }}</span>
                <span v-if="result.constant" class="badge badge--warning">常驻</span>
              </div>
              <div class="flex-row">
                <button class="btn btn--ghost btn--sm" @click.stop="result._editing = !result._editing">{{ result._editing ? '收起' : '编辑' }}</button>
                <button class="btn btn--secondary btn--sm" @click.stop="regenSingleResult(i)" :disabled="aiGenerating">重新生成</button>
                <button class="btn btn--danger btn--sm" @click.stop="aiResults.splice(i, 1)">删除</button>
              </div>
            </div>
            <!-- 编辑模式 -->
            <div v-if="result._editing" class="ai-result-edit">
              <div class="form-group">
                <label>名称</label>
                <input class="input" v-model="result.comment">
              </div>
              <div class="form-group">
                <label>关键词（逗号分隔）</label>
                <input class="input" :value="(result.keys||[]).join(', ')" @input="result.keys = $event.target.value.split(/[,，]\s*/).filter(Boolean)">
              </div>
              <div class="form-group">
                <label>内容</label>
                <textarea class="textarea" v-model="result.content" rows="8" style="font-size:12px;line-height:1.6"></textarea>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>位置</label>
                  <select class="select" v-model="result.position">
                    <option value="before_char">before_char</option>
                    <option value="after_char">after_char</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>插入顺序</label>
                  <input class="input" type="number" v-model.number="result.insertion_order">
                </div>
              </div>
              <label class="toggle-label"><input type="checkbox" v-model="result.constant"> 常驻</label>
            </div>
            <!-- 预览模式 -->
            <pre v-else class="ai-result-item__content selectable">{{ result.content }}</pre>
            <div class="ai-result-item__meta">
              {{ result.position }} | order {{ result.insertion_order }} | {{ (result.content || '').length }} 字符
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 小说转世界书面板 -->
    <div v-if="showNovelPanel" class="card mb-md">
      <div class="card__header"><h3>小说转世界书</h3></div>
      <div class="card__body">
        <p class="hint mb-md">粘贴小说文本或导入 txt 文件，AI 会自动提取世界观、角色、地点、规则等信息，生成世界书条目。</p>
        <div class="form-group">
          <div class="flex-between" style="margin-bottom:4px">
            <label>小说文本</label>
            <button class="btn btn--secondary btn--sm" @click="importNovelFile">导入 txt 文件</button>
          </div>
          <textarea class="textarea" v-model="novelText" rows="12"
            placeholder="粘贴你的小说内容，或点击上方「导入 txt 文件」"></textarea>
          <div class="hint">{{ (novelText || '').length }} 字</div>
        </div>
        <div class="form-group">
          <label>额外要求（可选）</label>
          <input class="input" v-model="novelExtra"
            placeholder="如：重点提取NPC信息 / 只要世界观不要角色 / 用json格式...">
        </div>
        <button class="btn btn--accent" style="width:100%;padding:10px"
          @click="generateFromNovel" :disabled="novelGenerating || !novelText.trim()">
          {{ novelGenerating ? `AI 正在分析... (${novelResults.length} 条)` : '开始提取世界书' }}
        </button>

        <!-- 小说分块进度条 -->
        <div v-if="novelGenerating" class="ai-progress mt-md">
          <div class="ai-progress__bar">
            <div class="ai-progress__fill" :style="{ width: novelChunkProgress + '%' }"></div>
          </div>
          <div class="ai-progress__text">第 {{ novelChunkCurrent }} / {{ novelChunkTotal }} 块 · 已提取 {{ novelResults.length }} 条</div>
        </div>

        <!-- 提取结果预览 -->
        <div v-if="novelResults.length > 0" class="mt-md">
          <div class="flex-between mb-md">
            <span class="badge badge--accent">提取到 {{ novelResults.length }} 条</span>
            <div class="flex-row">
              <button class="btn btn--accent btn--sm" @click="continueNovelGenerate" :disabled="novelGenerating">
                {{ novelGenerating ? '生成中...' : '继续生成' }}
              </button>
              <button class="btn btn--primary btn--sm" @click="injectNovelResults">注入选中条目</button>
              <button class="btn btn--ghost btn--sm" @click="novelResults.forEach(r => r.selected = true)">全选</button>
              <button class="btn btn--ghost btn--sm" @click="novelResults.forEach(r => r.selected = false)">全不选</button>
            </div>
          </div>
          <div v-for="(r, i) in novelResults" :key="i" class="ai-result-item" :class="{ 'ai-result-item--selected': r.selected }">
            <div class="flex-between">
              <div class="flex-row" @click="r.selected = !r.selected" style="cursor:pointer">
                <input type="checkbox" v-model="r.selected" @click.stop style="accent-color:var(--cf-accent)">
                <span class="ai-result-item__name">{{ r.comment }}</span>
                <span v-if="r.constant" class="badge badge--warning">常驻</span>
              </div>
              <div class="flex-row">
                <button class="btn btn--secondary btn--sm" @click.stop="regenNovelResult(i)" :disabled="novelGenerating">重新生成</button>
                <button class="btn btn--danger btn--sm" @click.stop="novelResults.splice(i, 1)">删除</button>
              </div>
            </div>
            <pre class="ai-result-item__content selectable">{{ r.content }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 参考小说面板 -->
    <div v-if="showRefNovelPanel" class="card mb-md">
      <div class="card__header">
        <h3>参考小说</h3>
        <span class="badge badge--info">这段小说会自动加入「AI 生成条目」「AI 改写选中」等所有 AI 操作的上下文</span>
      </div>
      <div class="card__body">
        <p class="hint mb-md">把一段小说作为这张卡的"参考素材"。它会跟着卡片一起保存（导入/导出 PNG 时一起带），AI 生成或改写世界书条目时，会在 prompt 里附上这段小说，让 AI 参考它的风格、世界观、人物关系。</p>
        <div class="form-group">
          <div class="flex-between" style="margin-bottom:4px">
            <label>小说文本</label>
            <div class="flex-row">
              <button class="btn btn--secondary btn--sm" @click="importRefNovelFile">导入 txt 文件</button>
              <button class="btn btn--ghost btn--sm" @click="refNovel = ''" :disabled="!refNovel">清空</button>
            </div>
          </div>
          <textarea class="textarea" v-model="refNovel" rows="14"
            placeholder="粘贴一段小说作为参考素材，AI 在生成或改写条目时会参考它"></textarea>
          <div class="hint">{{ (refNovel || '').length }} 字{{ refNovel.length > 30000 ? '（过长可能让 AI 反应变慢或被截断，建议 ≤ 30000 字）' : '' }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div v-if="showFilter" class="card mb-md">
      <div class="card__body flex-row">
        <input class="input flex-1" v-model="filterText" placeholder="搜索条目名称、关键词、内容...">
        <select class="select" style="width:160px" v-model="filterType">
          <option value="">全部类型</option>
          <option value="constant">常驻条目</option>
          <option value="triggered">触发条目</option>
          <option value="disabled">禁用条目</option>
        </select>
        <select class="select" style="width:140px" v-model="filterPosition">
          <option value="">全部位置</option>
          <option value="before_char">before_char</option>
          <option value="after_char">after_char</option>
        </select>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="batchMode && entries.length > 0" class="card mb-md batch-bar">
      <div class="card__body">
        <div class="flex-between mb-md">
          <div class="flex-row">
            <label class="toggle-label">
              <input type="checkbox" :checked="wbSelectedAll" @change="wbToggleSelectAll"> 全选
            </label>
            <span style="font-size:12px;color:var(--cf-text-muted)">已选 {{ wbSelectedIds.size }} / {{ filteredEntries.length }}</span>
          </div>
          <div class="flex-row" style="flex-wrap:wrap;gap:6px">
            <button class="btn btn--secondary btn--sm" @click="wbBatchEnable(true)" :disabled="wbSelectedIds.size === 0">启用</button>
            <button class="btn btn--secondary btn--sm" @click="wbBatchEnable(false)" :disabled="wbSelectedIds.size === 0">禁用</button>
            <button class="btn btn--secondary btn--sm" @click="wbBatchConstant(true)" :disabled="wbSelectedIds.size === 0">设为常驻</button>
            <button class="btn btn--secondary btn--sm" @click="wbBatchConstant(false)" :disabled="wbSelectedIds.size === 0">取消常驻</button>
            <button class="btn btn--secondary btn--sm" @click="wbBatchPosition('before_char')" :disabled="wbSelectedIds.size === 0">改 before_char</button>
            <button class="btn btn--secondary btn--sm" @click="wbBatchPosition('after_char')" :disabled="wbSelectedIds.size === 0">改 after_char</button>
            <button class="btn btn--danger btn--sm" @click="wbBatchDelete" :disabled="wbSelectedIds.size === 0">删除选中</button>
            <button class="btn btn--accent btn--sm" @click="showAiRewrite = true" :disabled="wbSelectedIds.size === 0">AI 改写选中</button>
          </div>

          <!-- AI 改写面板 -->
          <div v-if="showAiRewrite && wbSelectedIds.size > 0" class="mt-md">
            <div class="form-group">
              <label>改写要求</label>
              <input class="input" v-model="aiRewriteReq" placeholder="如：更详细、改成YAML格式、补充NPC细节、精简到200字以内...">
            </div>
            <div class="flex-row">
              <button class="btn btn--accent btn--sm" @click="aiRewriteSelected" :disabled="aiRewriting">
                {{ aiRewriting ? 'AI 改写中...' : '开始改写 (' + wbSelectedIds.size + ' 条)' }}
              </button>
              <button class="btn btn--ghost btn--sm" @click="showAiRewrite = false">取消</button>
            </div>

            <!-- 改写结果预览 -->
            <div v-if="aiRewriteResults.length > 0" class="mt-md">
              <div class="flex-between mb-md">
                <span class="badge badge--accent">改写了 {{ aiRewriteResults.length }} 条</span>
                <div class="flex-row">
                  <button class="btn btn--primary btn--sm" @click="applyRewriteResults">应用替换</button>
                  <button class="btn btn--ghost btn--sm" @click="aiRewriteResults = []">丢弃</button>
                </div>
              </div>
              <div v-for="(r, i) in aiRewriteResults" :key="i" class="ai-result-item mb-md">
                <div class="flex-between">
                  <span class="ai-result-item__name">{{ r.comment }}</span>
                  <div class="flex-row">
                    <button class="btn btn--secondary btn--sm" @click="regenRewriteResult(i)" :disabled="aiRewriting">重新生成</button>
                    <button class="btn btn--danger btn--sm" @click="aiRewriteResults.splice(i, 1)">删除</button>
                  </div>
                </div>
                <pre class="ai-result-item__content selectable">{{ r.newContent }}</pre>
                <details>
                  <summary style="font-size:11px;color:var(--cf-text-muted);cursor:pointer">查看原文</summary>
                  <pre class="ai-result-item__content" style="opacity:0.5">{{ r.oldContent }}</pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计栏 -->
    <div class="wb-stats mb-md">
      <span class="badge badge--accent">{{ entries.length }} 总计</span>
      <span class="badge badge--success">{{ entries.filter(e => e.enabled).length }} 启用</span>
      <span class="badge badge--warning">{{ entries.filter(e => e.constant && e.enabled).length }} 常驻</span>
      <span class="badge badge--info">{{ entries.filter(e => !e.constant && e.enabled).length }} 触发</span>
      <span class="badge badge--danger">{{ entries.filter(e => !e.enabled).length }} 禁用</span>
    </div>

    <!-- 条目列表 -->
    <div v-if="filteredEntries.length === 0 && !showAiPanel" class="card">
      <div class="empty-state">
        <div class="empty-state__icon"></div>
        <div class="empty-state__title">暂无世界书条目</div>
        <div class="empty-state__desc">点击「AI 生成条目」让 AI 帮你自动生成，或点击「新建条目」手动添加</div>
      </div>
    </div>

    <div v-else>
      <div v-for="(entry, idx) in filteredEntries" :key="entry.id + '_' + listVersion" class="wb-entry"
        :class="{ 'wb-entry--disabled': !entry.enabled, 'wb-entry--constant': entry.constant && entry.enabled, 'wb-entry--dragging': dragSourceId === entry.id, 'wb-entry--dragover': dragOverId === entry.id }"
        :draggable="dragEnabledId === entry.id"
        @dragstart="onDragStart($event, entry.id)"
        @dragover.prevent="onDragOver($event, entry.id)"
        @dragleave="onDragLeave(entry.id)"
        @drop.prevent="onDrop($event, entry.id)"
        @dragend="onDragEnd">

        <!-- 条目头部 -->
        <div class="wb-entry__header" @click="toggleExpand(entry.id)">
          <div class="flex-row">
            <span class="wb-drag-handle"
              @click.stop
              @mousedown="dragEnabledId = entry.id"
              @mouseup="dragEnabledId = null"
              @mouseleave="dragEnabledId = null"
              title="按住拖动排序">⋮⋮</span>
            <label v-if="batchMode" class="toggle-label" style="margin-right:4px" @click.stop>
              <input type="checkbox" :checked="wbSelectedIds.has(entry.id)"
                @change="wbToggleSelect(entry.id)">
            </label>
            <input type="number" class="wb-order-input"
              :value="entry.extensions.cfSortKey"
              @click.stop
              @mousedown.stop
              @change="updateOrder(entry, $event.target.value)"
              title="显示序号 — 仅 CardForge 内部排序，不影响 insertion_order">
            <span class="wb-entry__expand">{{ expandedIds.has(entry.id) ? '▼' : '▶' }}</span>
            <span class="wb-entry__name">{{ entry.comment || '(未命名)' }}</span>
            <span v-if="entry.constant && entry.enabled" class="badge badge--warning">常驻</span>
            <span v-if="!entry.enabled" class="badge badge--danger">禁用</span>
            <span v-if="entry.keys.length" class="wb-entry__keys">
              {{ entry.keys.slice(0, 3).join(', ') }}{{ entry.keys.length > 3 ? '...' : '' }}
            </span>
          </div>
          <div class="flex-row" @click.stop>
            <span class="wb-entry__meta">{{ entry.position }}</span>
            <button class="btn btn--ghost btn--sm" @click="store.duplicateWorldEntry(entry.id)">复制</button>
            <button class="btn btn--danger btn--sm" @click="appStore.confirmAction('删除这条世界书条目？', () => deleteEntry(entry.id))">删除</button>
          </div>
        </div>

        <!-- 条目详情 -->
        <div v-if="expandedIds.has(entry.id)" class="wb-entry__body">
          <div class="grid-2">
            <div class="form-group">
              <label>条目名称 (comment)</label>
              <input class="input" v-model="entry.comment" @input="store.markDirty()">
            </div>
            <div class="form-group">
              <label>关键词 (keys)</label>
              <input class="input" :value="entry.keys.join(', ')"
                @input="entry.keys = $event.target.value.split(',').map(k => k.trim()).filter(Boolean); store.markDirty()">
              <div class="hint">用逗号分隔多个关键词</div>
            </div>
          </div>

          <div class="form-group">
            <label>内容 (content)</label>
            <textarea class="textarea selectable" v-model="entry.content" rows="8"
              style="font-family: var(--cf-font-mono); font-size: 12px;"
              @input="store.markDirty()"></textarea>
            <div class="hint">{{ (entry.content || '').length }} 字符 | ~{{ Math.round((entry.content || '').length * 1.3) }} Token</div>
          </div>

          <div class="grid-3">
            <div class="form-group">
              <label>插入位置 (position)</label>
              <select class="select" v-model="entry.position" @change="syncPosition(entry); store.markDirty()">
                <option value="before_char">角色定义之前</option>
                <option value="after_char">角色定义之后</option>
                <option value="before_example">示例消息前</option>
                <option value="after_example">示例消息后</option>
                <option value="before_author">作者注释之前</option>
                <option value="after_author">作者注释之后</option>
                <option value="atDepth_system">@D [系统] 在深度</option>
                <option value="atDepth_user">@D [用户] 在深度</option>
                <option value="atDepth_ai">@D [AI] 在深度</option>
              </select>
              <div v-if="String(entry.position || '').startsWith('atDepth')" class="form-group" style="margin-top:6px">
                <label>深度值</label>
                <input class="input" type="number" v-model.number="entry.extensions.depth" min="0" placeholder="0=最底部" @input="store.markDirty()">
                <div class="hint">D0=最新内容旁（效力最强），D1=最后一条消息，D4=较远位置</div>
              </div>
              <div class="hint" v-else>角色定义前/后是最常用的。深度插入（@D）越靠近底部效力越强。</div>
            </div>
            <div class="form-group">
              <label>插入顺序 (insertion_order)</label>
              <input class="input" type="number" v-model.number="entry.insertion_order" @input="store.markDirty()">
              <div class="hint">数值越大越靠下。推荐：系统规则1-10，NPC 50-80，输出格式9990+</div>
            </div>
            <div class="form-group">
              <label>扫描深度 (depth)</label>
              <input class="input" type="number" v-model.number="entry.extensions.depth" min="0" @input="store.markDirty()">
              <div class="hint">扫描最近几条消息匹配关键词。0=始终匹配，4=默认</div>
            </div>
          </div>

          <div class="flex-row gap-md" style="flex-wrap:wrap">
            <label class="toggle-label">
              <input type="checkbox" v-model="entry.enabled" @change="store.markDirty()"> 启用
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="entry.constant" @change="store.markDirty()"> 常驻（蓝灯）
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="entry.selective" @change="store.markDirty()"> 启用二级关键词
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="entry.extensions.exclude_recursion" @change="store.markDirty()"> 不可递归
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="entry.extensions.prevent_recursion" @change="store.markDirty()"> 防止进一步递归
            </label>
          </div>

          <div v-if="entry.selective" class="form-group mt-md">
            <label>二级关键词逻辑 (selectiveLogic)</label>
            <select class="select" v-model.number="entry.extensions.selectiveLogic" @change="store.markDirty()">
              <option :value="0">与任意 (AND ANY) — 右侧任一匹配即触发</option>
              <option :value="1">与所有 (AND ALL) — 右侧全部匹配才触发</option>
              <option :value="2">非所有 (NOT ALL) — 右侧至少一个不匹配时触发</option>
              <option :value="3">非任何 (NOT ANY) — 右侧全部不匹配时触发</option>
            </select>
          </div>

          <div v-if="entry.selective" class="form-group mt-md">
            <label>二级关键词 (secondary_keys)</label>
            <input class="input" :value="entry.secondary_keys.join(', ')"
              @input="entry.secondary_keys = $event.target.value.split(',').map(k => k.trim()).filter(Boolean); store.markDirty()">
            <div class="hint">需要同时满足主关键词和二级关键词才触发</div>
          </div>

          <!-- 高级设置（折叠） -->
          <details class="mt-md">
            <summary style="font-size:12px;color:var(--cf-text-muted);cursor:pointer">高级设置</summary>
            <div style="margin-top:12px">
              <div class="grid-3">
                <div class="form-group">
                  <label>角色 (role)</label>
                  <select class="select" v-model.number="entry.extensions.role" @change="store.markDirty()">
                    <option :value="0">System</option>
                    <option :value="1">User</option>
                    <option :value="2">Assistant</option>
                  </select>
                  <div class="hint">条目以什么身份插入提示词</div>
                </div>
                <div class="form-group">
                  <label>触发概率 (%)</label>
                  <input class="input" type="number" v-model.number="entry.extensions.probability" min="0" max="100" @input="store.markDirty()">
                  <div class="hint">关键词匹配后实际触发的概率</div>
                </div>
                <div class="form-group">
                  <label>独立扫描深度</label>
                  <input class="input" type="number" v-model.number="entry.extensions.scan_depth" placeholder="跟随全局" @input="store.markDirty()">
                  <div class="hint">留空则用全局深度</div>
                </div>
              </div>
              <div class="grid-3">
                <div class="form-group">
                  <label>分组 (group)</label>
                  <input class="input" v-model="entry.extensions.group" @input="store.markDirty()">
                  <div class="hint">同组条目互斥，只触发权重最高的</div>
                </div>
                <div class="form-group">
                  <label>分组权重</label>
                  <input class="input" type="number" v-model.number="entry.extensions.group_weight" @input="store.markDirty()">
                </div>
                <div class="form-group">
                  <label>粘性 (sticky)</label>
                  <input class="input" type="number" v-model.number="entry.extensions.sticky" placeholder="0" @input="store.markDirty()">
                  <div class="hint">触发后持续激活的轮数</div>
                </div>
              </div>
              <div class="grid-3">
                <div class="form-group">
                  <label>冷却 (cooldown)</label>
                  <input class="input" type="number" v-model.number="entry.extensions.cooldown" placeholder="0" @input="store.markDirty()">
                  <div class="hint">触发后冷却的轮数</div>
                </div>
                <div class="form-group">
                  <label>延迟 (delay)</label>
                  <input class="input" type="number" v-model.number="entry.extensions.delay" placeholder="0" @input="store.markDirty()">
                  <div class="hint">关键词匹配后延迟几轮才触发</div>
                </div>
                <div class="form-group">
                  <label>选项</label>
                  <div style="display:flex;flex-direction:column;gap:6px">
                    <label class="toggle-label">
                      <input type="checkbox" v-model="entry.use_regex" @change="store.markDirty()"> 关键词使用正则匹配
                    </label>
                    <label class="toggle-label">
                      <input type="checkbox" v-model="entry.extensions.match_whole_words" @change="store.markDirty()"> 整词匹配
                    </label>
                    <label class="toggle-label">
                      <input type="checkbox" v-model="entry.extensions.case_sensitive" @change="store.markDirty()"> 大小写敏感
                    </label>
                    <label class="toggle-label">
                      <input type="checkbox" v-model="entry.extensions.ignore_budget" @change="store.markDirty()"> 忽略 Token 预算
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useCardStore } from '../stores/card.js';
import { useApiStore } from '../stores/api.js';
import { useAppStore } from '../stores/app.js';
import { buildCardContext } from '../utils/card-context.js';
import { chatForJsonArray } from '../utils/json-repair.js';

const store = useCardStore();
const apiStore = useApiStore();
const appStore = useAppStore();
const entries = computed(() => store.worldEntries);

const showFilter = ref(false);
const filterText = ref('');
const filterType = ref('');
const filterPosition = ref('');
const expandedIds = ref(new Set());
const listVersion = ref(0);

// 小说转世界书
const showNovelPanel = ref(false);
const novelText = ref('');
const novelExtra = ref('');
const novelGenerating = ref(false);
const novelResults = ref([]);
const novelChunkCurrent = ref(0);
const novelChunkTotal = ref(1);
const novelChunkProgress = computed(() => novelChunkTotal.value > 0 ? Math.round((novelChunkCurrent.value / novelChunkTotal.value) * 100) : 0);

// 参考小说（持久化到 cardData.extensions.cfReferenceNovel，跟着卡走）
const showRefNovelPanel = ref(false);
const refNovel = computed({
  get() { return store.cardData.extensions?.cfReferenceNovel || ''; },
  set(v) {
    if (!store.cardData.extensions) store.cardData.extensions = {};
    store.cardData.extensions.cfReferenceNovel = v;
    store.markDirty();
  }
});

function importRefNovelFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.text,.md';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      refNovel.value = text;
      appStore.toastSuccess(`已导入「${file.name}」(${text.length} 字)`);
    } catch (err) {
      appStore.toastError('导入失败: ' + err.message);
    }
  };
  input.click();
}

// 构建参考小说的 prompt 片段（无内容则返回空字符串）
function buildRefNovelSegment() {
  const novel = (store.cardData.extensions?.cfReferenceNovel || '').trim();
  if (!novel) return '';
  return `\n\n## 参考小说素材（按它的世界观、人物风格、笔法来生成 / 改写）\n\n${novel}`;
}

function importNovelFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.text,.md';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      novelText.value = text;
      appStore.toastSuccess(`已导入「${file.name}」(${text.length} 字)`);
    } catch (err) {
      appStore.toastError('导入失败: ' + err.message);
    }
  };
  input.click();
}

function splitTextToChunks(text, chunkSize = 8000) {
  const MAX_CHUNKS = 12;
  const chunks = [];
  const totalLen = text.length;

  // Short text: process all
  if (totalLen <= chunkSize * MAX_CHUNKS) {
    const chapterPattern = /(?=第[一二三四五六七八九十百千\d]+[章回节卷]|Chapter\s+\d+)/gi;
    const chapters = text.split(chapterPattern).filter(s => s.trim().length > 50);

    if (chapters.length >= 3) {
      let current = '';
      for (const ch of chapters) {
        if ((current + ch).length > chunkSize && current.length > 500) {
          chunks.push(current);
          current = ch;
        } else {
          current += ch;
        }
      }
      if (current.trim()) chunks.push(current);
    } else {
      for (let i = 0; i < totalLen; i += chunkSize) {
        let end = Math.min(i + chunkSize, totalLen);
        if (end < totalLen) {
          const breakMatch = text.slice(end - 200, end).match(/.*[。！？\n]/);
          if (breakMatch) end = (end - 200) + breakMatch.index + breakMatch[0].length;
        }
        chunks.push(text.slice(i, end));
        if (end >= totalLen) break;
      }
    }
    return chunks.length > 0 ? chunks : [text];
  }

  // Long text (100k+): strategic sampling
  // 1. Beginning (30k) - world setup, character introductions
  const headSize = Math.min(30000, Math.floor(totalLen * 0.1));
  chunks.push(text.slice(0, headSize));

  // 2. Sample evenly from middle
  const middleChunks = MAX_CHUNKS - 2; // reserve 1 for head, 1 for tail
  const middleStart = headSize;
  const middleEnd = totalLen - 15000;
  const step = Math.floor((middleEnd - middleStart) / middleChunks);
  for (let i = 0; i < middleChunks && middleStart + i * step < middleEnd; i++) {
    const start = middleStart + i * step;
    let end = Math.min(start + chunkSize, totalLen);
    if (end < totalLen) {
      const breakMatch = text.slice(end - 200, end).match(/.*[。！？\n]/);
      if (breakMatch) end = (end - 200) + breakMatch.index + breakMatch[0].length;
    }
    chunks.push(text.slice(start, end));
  }

  // 3. Ending (15k) - final state
  chunks.push(text.slice(totalLen - 15000));

  return chunks.length > 0 ? chunks : [text];
}

async function generateFromNovel() {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  if (!novelText.value.trim()) return;
  novelGenerating.value = true;
  novelResults.value = [];

  try {
    const chunks = splitTextToChunks(novelText.value);
    novelChunkTotal.value = chunks.length;
    novelChunkCurrent.value = 0;

    const baseInstruction = `请从小说文本中提取以下信息并生成世界书条目：
- 世界观/背景设定（constant=true）
- 重要角色（每个角色一条，含外貌、性格、背景）
- 重要地点/场景
- 特殊规则/力量体系
- 重要物品/组织

输出 JSON 数组格式：
[{"comment":"条目名称","keys":["关键词"],"content":"条目内容","constant":bool,"position":"before_char","insertion_order":100}]

角色条目用关键词触发（constant=false），世界观规则用常驻（constant=true）。
只输出 JSON 数组，不要其他文字。`;

    for (let i = 0; i < chunks.length; i++) {
      novelChunkCurrent.value = i + 1;

      const existingNames = novelResults.value.map(r => r.comment).join('、');
      const chunkPrompt = `你是 SillyTavern 世界书架构专家。请从以下小说文本片段中提取世界观设定。

${existingNames ? `【已提取的条目（不要重复）】\n${existingNames}\n` : ''}
${novelExtra.value ? '【额外要求】\n' + novelExtra.value + '\n' : ''}
【小说文本 第${i + 1}/${chunks.length}块】
${chunks[i]}

${baseInstruction}`;

      try {
        const parsed = await chatForJsonArray(apiStore, [
          { role: 'system', content: '你是世界书架构专家，擅长从小说文本中提取世界观设定。只输出合法JSON数组。所有内容必须用中文，禁止英文。' },
          { role: 'user', content: chunkPrompt }
        ], { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

        const newItems = parsed.map(item => ({
          ...item,
          selected: true,
          comment: item.comment || '未命名条目',
          content: item.content || '',
          keys: item.keys || [],
          constant: item.constant ?? false,
          position: item.position || 'before_char',
          insertion_order: item.insertion_order || 100
        }));
        novelResults.value.push(...newItems);
      } catch (e) {
        appStore.toastWarning(`第 ${i + 1} 块提取出错: ${e.message}，继续下一块...`);
      }
    }

    appStore.toastSuccess(`小说分析完成，共提取 ${novelResults.value.length} 条世界书条目`);
  } catch (e) {
    appStore.toastError('提取失败: ' + e.message);
  } finally { novelGenerating.value = false; }
}

async function regenNovelResult(index) {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  const old = novelResults.value[index];
  if (!old) return;
  novelGenerating.value = true;
  try {
    const prompt = `请重新生成以下世界书条目，保持相同的类型，但内容全新编写，更丰富详细。

条目名称：${old.comment}
关键词：${(old.keys || []).join(', ')}
类型：${old.constant ? '常驻' : '触发'}

只输出一个JSON对象：
{ "comment": "条目名称", "keys": ["关键词"], "content": "条目内容", "constant": ${old.constant}, "position": "${old.position || 'before_char'}", "insertion_order": ${old.insertion_order || 100} }

只输出JSON。`;

    const result = await apiStore.chat([
      { role: 'system', content: '你是世界书架构专家。只输出合法JSON对象。所有内容必须用中文，禁止英文。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

    let cleaned = result.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 返回格式异常');
    const parsed = JSON.parse(match[0]);
    novelResults.value[index] = { ...parsed, selected: true, comment: parsed.comment || old.comment || '未命名条目', content: parsed.content ?? old.content ?? '', keys: parsed.keys || old.keys, constant: parsed.constant ?? old.constant, position: parsed.position || 'before_char', insertion_order: parsed.insertion_order || 100 };
    appStore.toastSuccess(`「${parsed.comment || old.comment}」已重新生成`);
  } catch (e) {
    appStore.toastError('重新生成失败: ' + e.message);
  } finally { novelGenerating.value = false; }
}

async function continueNovelGenerate() {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  if (!novelText.value.trim()) return;
  novelGenerating.value = true;

  try {
    const existing = novelResults.value.map(r => r.comment).join('、');
    const textPreview = novelText.value.slice(0, 8000);
    const prompt = `继续从以下小说文本中提取世界观设定，生成世界书条目。

已经提取的条目：${existing}

请生成更多未覆盖的条目（角色、地点、规则、组织等），不要重复已有的。

【小说文本】
${textPreview}

${novelExtra.value ? '【额外要求】\n' + novelExtra.value + '\n' : ''}

输出 JSON 数组格式，同之前。只输出JSON。`;

    const parsed = await chatForJsonArray(apiStore, [
      { role: 'system', content: '你是世界书架构专家。继续提取条目，不要重复。只输出合法JSON数组。所有内容必须用中文，禁止英文。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

    const newItems = parsed.map(item => ({
      ...item, selected: true,
      comment: item.comment || '未命名条目',
      content: item.content || '',
      keys: item.keys || [], constant: item.constant ?? false,
      position: item.position || 'before_char', insertion_order: item.insertion_order || 100
    }));
    novelResults.value.push(...newItems);
    appStore.toastSuccess(`又提取了 ${newItems.length} 条，共 ${novelResults.value.length} 条`);
  } catch (e) {
    appStore.toastError('继续生成失败: ' + e.message);
  } finally { novelGenerating.value = false; }
}

function injectNovelResults() {
  const selected = novelResults.value.filter(r => r.selected);
  if (selected.length === 0) { appStore.toastWarning('请至少选中一条'); return; }

  for (const item of selected) {
    const entry = store.addWorldEntry();
    entry.comment = item.comment || '';
    entry.keys = item.keys || [];
    entry.content = item.content || '';
    entry.constant = item.constant ?? false;
    entry.position = item.position || 'before_char';
    entry.insertion_order = item.insertion_order || 100;
    entry.extensions.position = entry.position === 'before_char' ? 0 : 1;
  }

  appStore.toastSuccess(`已注入 ${selected.length} 条世界书条目`);
  novelResults.value = [];
  showNovelPanel.value = false;
}

// AI 生成相关
const showAiPanel = ref(false);
const aiWorldDesc = ref('');
const aiEntryTypes = ref(['system', 'world', 'location', 'event']);
const aiTargetCount = ref('small');
const aiDescStyle = ref('auto');
const aiExtraReq = ref('');
const aiGenerating = ref(false);
const aiResults = ref([]);
const aiBatchCurrent = ref(0);
const aiBatchTotal = ref(1);
const aiBatchProgress = computed(() => aiBatchTotal.value > 0 ? Math.round((aiBatchCurrent.value / aiBatchTotal.value) * 100) : 0);

const entryTypeOpts = [
  { value: 'system', label: '系统规则' },
  { value: 'world', label: '世界设定' },
  { value: 'location', label: '地点场景' },
  { value: 'event', label: '事件规则' }
];

const allSelected = computed(() => aiResults.value.length > 0 && aiResults.value.every(r => r.selected));

function selectAllResults(val) {
  aiResults.value.forEach(r => r.selected = val);
}

function typeBadgeClass(type) {
  const map = {
    '系统规则': 'badge--danger', '世界设定': 'badge--info', 'NPC角色': 'badge--accent',
    '地点场景': 'badge--success', '事件规则': 'badge--warning', '输出格式': 'badge--info'
  };
  return map[type] || 'badge--info';
}

const countMap = { minimal: '5-15', small: '20-35', medium: '40-70', large: '80-150', massive: '150-300', extreme: '300-500' };
const styleMap = {
  auto: '自动选择最佳风格——系统规则用简洁命令式，NPC用叙述体，数值系统用YAML结构化',
  concise: '简洁命令式，用短句和列表，节省Token。例如用"- 禁止飞行\\n- 城内不得斗法"这样的格式',
  narrative: '自然语言叙述体，像在讲故事一样描写',
  yaml: 'YAML键值对结构化格式'
};

async function handleAiGenerate() {
  if (!apiStore.isConfigured) {
    appStore.toastError('请先在 API 设置中配置 API Key');
    return;
  }

  aiGenerating.value = true;
  aiResults.value = [];

  try {
    const typeLabels = aiEntryTypes.value.map(v => entryTypeOpts.find(o => o.value === v)?.label).filter(Boolean);
    const cardContext = buildCardContext(store);
    const targetRange = countMap[aiTargetCount.value];

    // Parse target count range to determine batch count
    const targetMatch = targetRange.match(/(\d+)\s*[-~]\s*(\d+)/);
    const targetMin = targetMatch ? parseInt(targetMatch[1]) : 5;
    const targetMax = targetMatch ? parseInt(targetMatch[2]) : 15;
    const perBatch = 8;
    const totalBatches = Math.max(1, Math.ceil(targetMax / perBatch));

    aiBatchTotal.value = totalBatches;
    aiBatchCurrent.value = 0;

    const basePrompt = `你是一个专业的 SillyTavern 世界书（Character Book）架构师。

## 已有角色卡信息
${cardContext}

## 世界观描述
${aiWorldDesc.value}

## 条目类型说明
- 系统规则（constant=true）：AI必须始终遵守的核心规则。insertion_order=1-10，position=before_char
- 世界设定（constant=true或关键词触发）：经济系统、文化、法律等。insertion_order=5-20，position=before_char
- NPC角色（关键词触发）：每个NPC含外貌、性格、背景、说话方式。insertion_order=50-80，position=before_char
- 地点场景（关键词触发）：地点描述、氛围、可交互内容。insertion_order=30-50，position=before_char
- 事件规则（关键词触发）：特定事件的规则和流程。insertion_order=70-90，position=before_char
- 输出格式（constant=true）：告诉AI按什么格式回复。insertion_order=9990-9999，position=after_char

## 输出格式
严格输出 JSON 数组，每次只生成 ${perBatch} 条，确保 JSON 完整不截断：
[{"comment":"条目名称","type":"类型","keys":["关键词"],"content":"内容（控制在200字以内）","constant":bool,"position":"before_char或after_char","insertion_order":数字}]
只输出JSON数组，不要其他文字。${buildRefNovelSegment()}`;

    for (let batch = 0; batch < totalBatches; batch++) {
      // Delay between batches to avoid rate limiting
      if (batch > 0) await new Promise(r => setTimeout(r, 5000));
      aiBatchCurrent.value = batch + 1;

      // Early stop: reached 80% of target
      if (aiResults.value.length >= targetMin && aiResults.value.length >= targetMax * 0.8) {
        appStore.toastSuccess(`已达到目标数量，提前完成`);
        break;
      }

      const existingNames = aiResults.value.map(r => r.comment).join('、');
      const batchPrompt = batch === 0
        ? `${basePrompt}\n\n## 生成要求\n- 条目类型：${typeLabels.join('、')}\n- 内容风格：${styleMap[aiDescStyle.value]}\n${aiExtraReq.value ? `- 额外要求：${aiExtraReq.value}\n` : ''}- 本批生成 ${perBatch} 条，覆盖最重要的设定`
        : `${basePrompt}\n\n## 生成要求\n- 条目类型：${typeLabels.join('、')}\n- 内容风格：${styleMap[aiDescStyle.value]}\n${aiExtraReq.value ? `- 额外要求：${aiExtraReq.value}\n` : ''}- 已生成的条目：${existingNames}\n- 请生成更多未覆盖的条目，不要重复已有的\n- 本批生成 ${perBatch} 条`;

      try {
        const parsed = await chatForJsonArray(apiStore, [
          { role: 'system', content: '你是SillyTavern世界书架构专家。始终输出合法JSON。所有内容必须用中文，禁止英文。每次严格只生成' + perBatch + '条，确保JSON完整。' },
          { role: 'user', content: batchPrompt }
        ], { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

        if (parsed.length === 0) {
          appStore.toastWarning(`第 ${batch + 1} 批未生成有效条目，停止生成`);
          break;
        } else {
          const newItems = parsed.map(item => ({
            ...item,
            selected: true,
            comment: item.comment || '未命名条目',
            content: item.content || '',
            keys: item.keys || [],
            constant: item.constant ?? false,
            position: item.position || 'before_char',
            insertion_order: item.insertion_order || 100
          }));
          aiResults.value.push(...newItems);
        }
      } catch (e) {
        appStore.toastWarning(`第 ${batch + 1} 批生成出错: ${e.message}`);
        break;
      }
    }

    appStore.toastSuccess(`生成完成，共 ${aiResults.value.length} 条世界书条目`);
  } catch (e) {
    appStore.toastError(`生成失败: ${e.message}`);
  } finally {
    aiGenerating.value = false;
  }
}

async function regenSingleResult(index) {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  const old = aiResults.value[index];
  if (!old) return;
  aiGenerating.value = true;
  try {
    const cardContext = buildCardContext(store);
    const prompt = `请重新生成以下世界书条目，保持相同的类型和定位，但内容要全新编写，更加丰富详细。

条目名称：${old.comment}
关键词：${(old.keys || []).join(', ')}
类型：${old.constant ? '常驻' : '触发'}
插入位置：${old.position}

【角色卡信息】
${cardContext}

只输出一个JSON对象（不是数组）：
{ "comment": "条目名称", "keys": ["关键词"], "content": "条目内容", "constant": ${old.constant}, "position": "${old.position}", "insertion_order": ${old.insertion_order} }

只输出JSON，不要其他文字。${buildRefNovelSegment()}`;

    const result = await apiStore.chat([
      { role: 'system', content: '你是世界书架构专家。只输出合法JSON对象。所有内容必须用中文，禁止英文。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

    // 解析返回的 JSON
    let cleaned = result.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 返回格式异常');
    const parsed = JSON.parse(match[0]);
    aiResults.value[index] = {
      ...parsed,
      selected: true,
      comment: parsed.comment || old.comment || '未命名条目',
      content: parsed.content ?? old.content ?? '',
      keys: parsed.keys || old.keys,
      constant: parsed.constant ?? old.constant,
      position: parsed.position || old.position,
      insertion_order: parsed.insertion_order || old.insertion_order
    };
    appStore.toastSuccess(`「${parsed.comment || old.comment}」已重新生成`);
  } catch (e) {
    appStore.toastError('重新生成失败: ' + e.message);
  } finally { aiGenerating.value = false; }
}

async function continueGenerate() {
  if (!apiStore.isConfigured) return;
  aiGenerating.value = true;
  try {
    const existing = aiResults.value.map(r => r.comment).join('、');
    const cardContext = buildCardContext(store);
    const prompt = `继续生成世界书条目。

已生成的条目：${existing}

【角色卡信息】
${cardContext}

【世界观】
${aiWorldDesc.value}

请生成更多未覆盖的条目（NPC、地点、事件等），不要重复已有的。
输出JSON数组格式，同之前。只输出JSON。${buildRefNovelSegment()}`;

    const newItems = (await chatForJsonArray(apiStore, [
      { role: 'system', content: '你是世界书架构专家。继续补充条目，不要重复。只输出JSON。所有内容必须用中文，禁止英文。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) })).map(item => ({
      ...item, selected: true,
      comment: item.comment || '未命名条目',
      content: item.content || '',
      keys: item.keys || [], constant: item.constant ?? false,
      position: item.position || 'before_char', insertion_order: item.insertion_order || 100
    }));
    aiResults.value.push(...newItems);
    appStore.toastSuccess(`又生成了 ${newItems.length} 条，共 ${aiResults.value.length} 条`);
  } catch (e) {
    appStore.toastError('继续生成失败: ' + e.message);
  } finally { aiGenerating.value = false; }
}

function injectSelectedResults() {
  const selected = aiResults.value.filter(r => r.selected);
  if (selected.length === 0) {
    appStore.toastWarning('请至少选中一条');
    return;
  }

  for (const item of selected) {
    const entry = store.addWorldEntry();
    entry.comment = item.comment || '';
    entry.keys = item.keys || [];
    entry.content = item.content || '';
    entry.constant = item.constant ?? false;
    entry.position = item.position || 'before_char';
    entry.insertion_order = item.insertion_order || 100;
    entry.extensions.position = entry.position === 'before_char' ? 0 : 1;
  }

  appStore.toastSuccess(`已注入 ${selected.length} 条世界书条目`);
  aiResults.value = [];
  showAiPanel.value = false;
}

// 原有功能
const filteredEntries = computed(() => {
  let result = entries.value;

  if (filterType.value === 'constant') result = result.filter(e => e.constant && e.enabled);
  else if (filterType.value === 'triggered') result = result.filter(e => !e.constant && e.enabled);
  else if (filterType.value === 'disabled') result = result.filter(e => !e.enabled);

  if (filterPosition.value) result = result.filter(e => e.position === filterPosition.value);

  if (filterText.value) {
    const q = filterText.value.toLowerCase();
    result = result.filter(e =>
      (e.comment || '').toLowerCase().includes(q) ||
      (e.content || '').toLowerCase().includes(q) ||
      e.keys.some(k => k.toLowerCase().includes(q))
    );
  }

  // 按 cfSortKey 升序排列（CardForge 内部排序，不影响 insertion_order）
  return [...result].sort((a, b) => {
    const ai = a.extensions?.cfSortKey ?? 9999999;
    const bi = b.extensions?.cfSortKey ?? 9999999;
    return ai - bi;
  });
});

function handleFilter() {
  if (filterText.value || filterType.value || filterPosition.value) {
    filterText.value = '';
    filterType.value = '';
    filterPosition.value = '';
  }
  showFilter.value = !showFilter.value;
}

function handleAdd() {
  const entry = store.addWorldEntry();
  expandedIds.value.add(entry.id);
  nextTick(() => {
    const el = document.querySelector(`.wb-entry:last-child .input, .wb-entry:last-child .textarea`);
    if (el) el.focus();
  });
}

function toggleExpand(id) {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id);
  else expandedIds.value.add(id);
}

function deleteEntry(id) {
  expandedIds.value.delete(id);
  store.removeWorldEntry(id);
  renumberEntries();
  listVersion.value++;
}

function renumberEntries() {
  const sorted = filteredEntries.value;
  for (let i = 0; i < sorted.length; i++) {
    if (!sorted[i].extensions) sorted[i].extensions = {};
    sorted[i].extensions.cfSortKey = i + 1;
  }
}

// 排序：数字框 — 插入到目标位置，其他条目自动重新编号
function updateOrder(entry, val) {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 1) return;

  // 取当前可见列表（已排序）
  const sorted = filteredEntries.value.slice();
  // 从列表中移除当前条目
  const idx = sorted.findIndex(e => e.id === entry.id);
  if (idx !== -1) sorted.splice(idx, 1);
  // 插入到目标位置（num-1 因为用户输入从 1 开始）
  const insertAt = Math.min(num - 1, sorted.length);
  sorted.splice(insertAt, 0, entry);
  // 重新分配 cfSortKey
  for (let i = 0; i < sorted.length; i++) {
    if (!sorted[i].extensions) sorted[i].extensions = {};
    sorted[i].extensions.cfSortKey = i + 1;
  }
  store.markDirty();
}

// 排序：拖拽
const dragSourceId = ref(null);
const dragOverId = ref(null);
const dragEnabledId = ref(null);  // 只有按下手柄的那条才允许拖

function onDragStart(e, id) {
  dragSourceId.value = id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(id));
}

function onDragOver(e, id) {
  if (id === dragSourceId.value) return;
  dragOverId.value = id;
  e.dataTransfer.dropEffect = 'move';
}

function onDragLeave(id) {
  if (dragOverId.value === id) dragOverId.value = null;
}

function onDrop(e, targetId) {
  const sourceId = dragSourceId.value;
  if (!sourceId || sourceId === targetId) {
    dragSourceId.value = null;
    dragOverId.value = null;
    return;
  }

  // 在筛选后的列表里调整顺序（用户看到的列表）
  const visible = [...filteredEntries.value];
  const sourceIdx = visible.findIndex(e => e.id === sourceId);
  const targetIdx = visible.findIndex(e => e.id === targetId);
  if (sourceIdx === -1 || targetIdx === -1) {
    dragSourceId.value = null;
    dragOverId.value = null;
    return;
  }

  // 把源条目从原位置移到目标位置
  const [moved] = visible.splice(sourceIdx, 1);
  visible.splice(targetIdx, 0, moved);

  // 重新分配 cfSortKey，按新顺序从 1 开始（不动 insertion_order）
  for (let i = 0; i < visible.length; i++) {
    if (!visible[i].extensions) visible[i].extensions = {};
    visible[i].extensions.cfSortKey = i + 1;
  }

  store.markDirty();
  dragSourceId.value = null;
  dragOverId.value = null;
  appStore.toastSuccess('已重新排序');
}

function onDragEnd() {
  dragSourceId.value = null;
  dragOverId.value = null;
  dragEnabledId.value = null;
}

// 批量操作
const batchMode = ref(false);
const wbSelectedIds = ref(new Set());

const wbSelectedAll = computed(() =>
  filteredEntries.value.length > 0 && wbSelectedIds.value.size === filteredEntries.value.length
);

function toggleBatchMode() {
  batchMode.value = !batchMode.value;
  wbSelectedIds.value = new Set();
}

function wbToggleSelect(id) {
  const s = new Set(wbSelectedIds.value);
  if (s.has(id)) s.delete(id); else s.add(id);
  wbSelectedIds.value = s;
}

function wbToggleSelectAll() {
  if (wbSelectedAll.value) {
    wbSelectedIds.value = new Set();
  } else {
    wbSelectedIds.value = new Set(filteredEntries.value.map(e => e.id));
  }
}

function getSelected() {
  return entries.value.filter(e => wbSelectedIds.value.has(e.id));
}

function wbBatchEnable(val) {
  getSelected().forEach(e => { e.enabled = val; });
  store.markDirty();
  appStore.toastSuccess(`已${val ? '启用' : '禁用'} ${wbSelectedIds.value.size} 条`);
}

function wbBatchConstant(val) {
  getSelected().forEach(e => { e.constant = val; });
  store.markDirty();
  appStore.toastSuccess(`已${val ? '设为常驻' : '取消常驻'} ${wbSelectedIds.value.size} 条`);
}

function wbBatchPosition(pos) {
  getSelected().forEach(e => {
    e.position = pos;
    e.extensions.position = pos === 'before_char' ? 0 : 1;
  });
  store.markDirty();
  appStore.toastSuccess(`已批量修改 ${wbSelectedIds.value.size} 条位置`);
}

function wbBatchDelete() {
  const count = wbSelectedIds.value.size;
  appStore.confirmAction(`确定删除选中的 ${count} 条世界书条目？`, () => {
    for (const id of wbSelectedIds.value) {
      expandedIds.value.delete(id);
      store.removeWorldEntry(id);
    }
    wbSelectedIds.value = new Set();
    renumberEntries();
    listVersion.value++;
    appStore.toastSuccess(`已删除 ${count} 条世界书条目`);
  });
}

// AI 改写功能
const showAiRewrite = ref(false);
const aiRewriteReq = ref('');
const aiRewriting = ref(false);
const aiRewriteResults = ref([]);

async function aiRewriteSelected() {
  if (!apiStore.isConfigured) { appStore.toastError('请先配置 API Key'); return; }
  if (wbSelectedIds.value.size === 0) return;
  aiRewriting.value = true;
  aiRewriteResults.value = [];

  try {
    const selected = entries.value.filter(e => wbSelectedIds.value.has(e.id));
    const entriesData = selected.map(e => ({
      id: e.id,
      comment: e.comment,
      content: e.content,
      keys: e.keys
    }));

    const prompt = `请根据以下要求改写这些世界书条目。保持每个条目的名称和关键词不变，只改写content内容。

【改写要求】
${aiRewriteReq.value || '优化内容，使其更加详细和生动'}

【需要改写的条目】
${entriesData.map(e => `条目名：${e.comment}\n关键词：${(e.keys || []).join(', ')}\n原内容：\n${e.content}\n---`).join('\n')}

输出JSON数组，每个对象包含 comment（条目名）和 content（改写后的内容）：
[{ "comment": "条目名", "content": "改写后的内容" }]

每条content控制在500字以内。只输出JSON。${buildRefNovelSegment()}`;

    const parsed = await chatForJsonArray(apiStore, [
      { role: 'system', content: '你是世界书改写专家。按照用户要求改写条目内容，保持条目名不变。只输出合法JSON数组。所有内容必须用中文，禁止英文。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

    aiRewriteResults.value = parsed.map((p, i) => ({
      id: selected[i]?.id,
      comment: p.comment || selected[i]?.comment || '',
      oldContent: selected[i]?.content || '',
      newContent: p.content || ''
    }));

    appStore.toastSuccess(`已改写 ${aiRewriteResults.value.length} 条，请预览后点「应用替换」`);
  } catch (e) {
    appStore.toastError('AI 改写失败: ' + e.message);
  } finally { aiRewriting.value = false; }
}

function applyRewriteResults() {
  let count = 0;
  for (const r of aiRewriteResults.value) {
    const entry = entries.value.find(e => e.id === r.id);
    if (entry) {
      entry.content = r.newContent;
      count++;
    }
  }
  store.markDirty();
  aiRewriteResults.value = [];
  showAiRewrite.value = false;
  appStore.toastSuccess(`已替换 ${count} 条世界书条目`);
}

async function regenRewriteResult(index) {
  if (!apiStore.isConfigured) return;
  const r = aiRewriteResults.value[index];
  if (!r) return;
  aiRewriting.value = true;
  try {
    const prompt = `请重新改写以下世界书条目。

【改写要求】
${aiRewriteReq.value || '优化内容，使其更加详细和生动'}

条目名：${r.comment}
原内容：
${r.oldContent}

只输出一个JSON对象：{ "comment": "${r.comment}", "content": "改写后的内容" }
只输出JSON。${buildRefNovelSegment()}`;

    const result = await apiStore.chat([
      { role: 'system', content: '你是世界书改写专家。只输出合法JSON对象。所有内容必须用中文，禁止英文。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: apiStore.getModelMaxTokens(apiStore.activeProvider?.model) });

    let cleaned = result.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 返回格式异常');
    const parsed = JSON.parse(match[0]);
    aiRewriteResults.value[index] = { ...r, newContent: parsed.content || r.newContent };
    appStore.toastSuccess(`「${r.comment}」已重新生成`);
  } catch (e) {
    appStore.toastError('重新生成失败: ' + e.message);
  } finally { aiRewriting.value = false; }
}

function syncPosition(entry) {
  const posMap = {
    'before_char': 0,
    'after_char': 1,
    'before_example': 2,
    'after_example': 3,
    'before_author': 4,
    'after_author': 5,
    'atDepth_system': 6,
    'atDepth_user': 7,
    'atDepth_ai': 8
  };
  entry.extensions.position = posMap[entry.position] ?? 0;
  // 深度插入时 role 自动设置
  if (entry.position === 'atDepth_system') entry.extensions.role = 0;
  else if (entry.position === 'atDepth_user') entry.extensions.role = 1;
  else if (entry.position === 'atDepth_ai') entry.extensions.role = 2;
}
</script>

<style scoped>
.wb-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ai-panel {
  border-color: var(--cf-accent);
  border-width: 1px;
  box-shadow: 0 0 24px var(--cf-accent-dim);
}

.ai-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.ai-results h4 {
  font-size: 14px;
  color: var(--cf-accent);
}

.ai-result-item {
  background: var(--cf-bg-tertiary);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm);
  padding: 12px;
  margin-bottom: 8px;
  transition: var(--cf-transition);
}
.ai-result-item--selected {
  border-color: var(--cf-accent);
  background: var(--cf-accent-dim);
}
.ai-result-item__name {
  font-weight: 600;
  font-size: 13px;
}
.ai-result-item__keys {
  font-size: 11px;
  color: var(--cf-text-muted);
}
.ai-result-item__content {
  font-size: 12px;
  line-height: 1.7;
  color: var(--cf-text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--cf-font);
  background: none;
  border: none;
  margin: 8px 0;
  max-height: 200px;
  overflow-y: auto;
}
.ai-result-item__meta {
  font-size: 11px;
  color: var(--cf-text-muted);
}
.ai-result-edit {
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}
.ai-result-edit .form-group {
  margin-bottom: 8px;
}
.ai-result-edit label {
  font-size: 11px;
  color: var(--cf-text-muted);
}

.ai-progress {
  margin: 12px 0;
}
.ai-progress__bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
}
.ai-progress__fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--cf-accent), #06b6d4);
  transition: width 0.5s ease;
  position: relative;
}
.ai-progress__fill::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: aiProgressShine 1.5s infinite;
}
@keyframes aiProgressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.ai-progress__text {
  margin-top: 6px;
  font-size: 12px;
  color: var(--cf-text-muted);
  text-align: center;
}

.wb-entry {
  background: var(--cf-bg-secondary);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm);
  margin-bottom: 8px;
  overflow: hidden;
  transition: var(--cf-transition);
}
.wb-entry--disabled { opacity: 0.5; }
.wb-entry--constant { border-left: 3px solid var(--cf-warning); }

.wb-entry__header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: var(--cf-transition);
}
.wb-entry__header:hover { background: var(--cf-bg-hover); }

.wb-entry__expand { font-size: 10px; color: var(--cf-text-muted); width: 16px; }
.wb-entry__id { font-size: 11px; color: var(--cf-text-muted); font-family: var(--cf-font-mono); }
.wb-entry__name { font-weight: 500; font-size: 13px; margin-left: 4px; }
.wb-entry__keys {
  font-size: 11px;
  color: var(--cf-accent);
  background: var(--cf-accent-dim);
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
}
.wb-entry__meta { font-size: 11px; color: var(--cf-text-muted); }

.wb-entry__body {
  padding: 16px;
  border-top: 1px solid var(--cf-border);
  background: var(--cf-bg-tertiary);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--cf-text-secondary);
  input { accent-color: var(--cf-accent); }
}
.batch-bar {
  border: 1px solid rgba(96, 165, 250, 0.2);
  background: rgba(96, 165, 250, 0.04);
}
.wb-drag-handle {
  display: inline-block;
  width: 14px;
  text-align: center;
  color: var(--cf-text-muted);
  cursor: grab;
  font-weight: bold;
  font-size: 14px;
  user-select: none;
  margin-right: 4px;
  &:hover { color: var(--cf-accent); }
  &:active { cursor: grabbing; }
}
.wb-order-input {
  width: 56px;
  padding: 3px 6px;
  font-size: 12px;
  font-family: var(--cf-font-mono);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--cf-border);
  border-radius: 3px;
  color: var(--cf-text-primary);
  margin-right: 6px;
  text-align: center;
  &:hover { border-color: var(--cf-border-light); }
  &:focus { border-color: rgba(255, 215, 0, 0.5); outline: none; }
  /* 隐藏 number input 的上下箭头 */
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
}
.wb-entry--dragging {
  opacity: 0.4;
}
.wb-entry--dragover {
  border-top: 2px solid rgba(255, 215, 0, 0.6);
  box-shadow: 0 -4px 12px rgba(255, 215, 0, 0.15);
}
</style>
