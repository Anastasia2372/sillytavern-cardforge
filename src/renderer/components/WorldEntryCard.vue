<template>
  <div class="wb-entry"
    :class="{
      'wb-entry--disabled': !entry.enabled,
      'wb-entry--constant': entry.constant && entry.enabled,
      'wb-entry--dragging': isDraggingMe,
      'wb-entry--dragover': isDragOverMe
    }"
    :draggable="draggable && draggingEnabled"
    @dragstart="$emit('drag-start', $event)"
    @dragover.prevent="$emit('drag-over', $event)"
    @dragleave="$emit('drag-leave')"
    @drop.prevent="$emit('drop', $event)"
    @dragend="$emit('drag-end')">

    <!-- 头部 -->
    <div class="wb-entry__header" @click="$emit('toggle-expand')">
      <div class="flex-row">
        <span v-if="mode === 'persisted' && draggable" class="wb-drag-handle"
          @click.stop
          @mousedown="draggingEnabled = true"
          @mouseup="draggingEnabled = false"
          @mouseleave="draggingEnabled = false"
          title="按住拖动排序">⋮⋮</span>

        <label v-if="batchMode || mode === 'preview'" class="toggle-label" style="margin-right:4px" @click.stop>
          <input type="checkbox" :checked="selected" @change="$emit('toggle-select')">
        </label>

        <input v-if="mode === 'persisted'" type="number" class="wb-order-input"
          :value="entry.extensions?.cfSortKey"
          @click.stop
          @mousedown.stop
          @change="$emit('update-order', $event.target.value)"
          title="显示序号 — 仅 CardForge 内部排序，不影响 insertion_order">

        <span class="wb-entry__expand">{{ expanded ? '▼' : '▶' }}</span>
        <span class="wb-entry__name">{{ entry.comment || '(未命名)' }}</span>
        <span v-if="entry.constant && entry.enabled" class="badge badge--warning">常驻</span>
        <span v-if="!entry.enabled" class="badge badge--danger">禁用</span>
        <span v-if="entry.keys?.length" class="wb-entry__keys">
          {{ (entry.keys || []).slice(0, 3).join(', ') }}{{ (entry.keys || []).length > 3 ? '...' : '' }}
        </span>
      </div>
      <div class="flex-row" @click.stop>
        <span class="wb-entry__meta">酒馆顺序 {{ entry.insertion_order }}</span>
        <span class="wb-entry__meta">{{ entry.position }}</span>
        <button v-if="mode === 'persisted'" class="btn btn--ghost btn--sm" @click="$emit('duplicate')">复制</button>
        <button class="btn btn--danger btn--sm" @click="handleDelete">{{ mode === 'preview' ? '移除' : '删除' }}</button>
      </div>
    </div>

    <!-- 详情 -->
    <div v-if="expanded" class="wb-entry__body">
      <div class="grid-2">
        <div class="form-group">
          <label>条目名称 (comment)</label>
          <input class="input" v-model="entry.comment" @input="markDirty">
        </div>
        <div class="form-group">
          <label>关键词 (keys)</label>
          <input class="input" :value="(entry.keys || []).join(', ')"
            @input="entry.keys = $event.target.value.split(',').map(k => k.trim()).filter(Boolean); markDirty()">
          <div class="hint">用逗号分隔多个关键词</div>
        </div>
      </div>

      <div class="form-group">
        <label>内容 (content)</label>
        <textarea class="textarea selectable" v-model="entry.content" rows="8"
          style="font-family: var(--cf-font-mono); font-size: 12px;"
          @input="markDirty"></textarea>
        <div class="hint">{{ (entry.content || '').length }} 字符 | ~{{ Math.round((entry.content || '').length * 1.3) }} Token</div>
      </div>

      <div class="grid-3">
        <div class="form-group">
          <label>插入位置 (position)</label>
          <select class="select" v-model="entry.position" @change="syncPosition(); markDirty()">
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
            <input class="input" type="number" v-model.number="entry.extensions.depth" min="0" placeholder="0=最底部" @input="markDirty">
            <div class="hint">D0=最新内容旁（效力最强），D1=最后一条消息，D4=较远位置</div>
          </div>
          <div class="hint" v-else>角色定义前/后是最常用的。深度插入（@D）越靠近底部效力越强。</div>
        </div>
        <div class="form-group">
          <label>酒馆顺序 (insertion_order)</label>
          <input class="input" type="number" :value="entry.insertion_order" @change="changeInsertionOrder">
          <div class="hint">允许重复。修改后自动归入顺序范围匹配的分隔栏；与头部的工具显示序号相互独立。</div>
        </div>
        <div class="form-group">
          <label>扫描深度 (depth)</label>
          <input class="input" type="number" v-model.number="entry.extensions.depth" min="0" @input="markDirty">
          <div class="hint">扫描最近几条消息匹配关键词。0=始终匹配，4=默认</div>
        </div>
      </div>

      <div class="flex-row gap-md" style="flex-wrap:wrap">
        <label class="toggle-label">
          <input type="checkbox" v-model="entry.enabled" @change="markDirty"> 启用
        </label>
        <label class="toggle-label">
          <input type="checkbox" v-model="entry.constant" @change="markDirty"> 常驻（蓝灯）
        </label>
        <label class="toggle-label">
          <input type="checkbox" v-model="entry.selective" @change="markDirty"> 启用二级关键词
        </label>
        <label class="toggle-label">
          <input type="checkbox" v-model="entry.extensions.exclude_recursion" @change="markDirty"> 不可递归
        </label>
        <label class="toggle-label">
          <input type="checkbox" v-model="entry.extensions.prevent_recursion" @change="markDirty"> 防止进一步递归
        </label>
      </div>

      <div v-if="entry.selective" class="form-group mt-md">
        <label>二级关键词逻辑 (selectiveLogic)</label>
        <select class="select" v-model.number="entry.extensions.selectiveLogic" @change="markDirty">
          <option :value="0">与任意 (AND ANY) — 右侧任一匹配即触发</option>
          <option :value="1">与所有 (AND ALL) — 右侧全部匹配才触发</option>
          <option :value="2">非所有 (NOT ALL) — 右侧至少一个不匹配时触发</option>
          <option :value="3">非任何 (NOT ANY) — 右侧全部不匹配时触发</option>
        </select>
      </div>

      <div v-if="entry.selective" class="form-group mt-md">
        <label>二级关键词 (secondary_keys)</label>
        <input class="input" :value="(entry.secondary_keys || []).join(', ')"
          @input="entry.secondary_keys = $event.target.value.split(',').map(k => k.trim()).filter(Boolean); markDirty()">
        <div class="hint">需要同时满足主关键词和二级关键词才触发</div>
      </div>

      <!-- 高级设置（折叠） -->
      <details class="mt-md">
        <summary style="font-size:12px;color:var(--cf-text-muted);cursor:pointer">高级设置</summary>
        <div style="margin-top:12px">
          <div class="grid-3">
            <div class="form-group">
              <label>角色 (role)</label>
              <select class="select" v-model.number="entry.extensions.role" @change="markDirty">
                <option :value="0">System</option>
                <option :value="1">User</option>
                <option :value="2">Assistant</option>
              </select>
              <div class="hint">条目以什么身份插入提示词</div>
            </div>
            <div class="form-group">
              <label>触发概率 (%)</label>
              <input class="input" type="number" v-model.number="entry.extensions.probability" min="0" max="100" @input="markDirty">
              <div class="hint">关键词匹配后实际触发的概率</div>
            </div>
            <div class="form-group">
              <label>独立扫描深度</label>
              <input class="input" type="number" v-model.number="entry.extensions.scan_depth" placeholder="跟随全局" @input="markDirty">
              <div class="hint">留空则用全局深度</div>
            </div>
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label>分组 (group)</label>
              <input class="input" v-model="entry.extensions.group" @input="markDirty">
              <div class="hint">同组条目互斥，只触发权重最高的</div>
            </div>
            <div class="form-group">
              <label>分组权重</label>
              <input class="input" type="number" v-model.number="entry.extensions.group_weight" @input="markDirty">
            </div>
            <div class="form-group">
              <label>粘性 (sticky)</label>
              <input class="input" type="number" v-model.number="entry.extensions.sticky" placeholder="0" @input="markDirty">
              <div class="hint">触发后持续激活的轮数</div>
            </div>
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label>冷却 (cooldown)</label>
              <input class="input" type="number" v-model.number="entry.extensions.cooldown" placeholder="0" @input="markDirty">
              <div class="hint">触发后冷却的轮数</div>
            </div>
            <div class="form-group">
              <label>延迟 (delay)</label>
              <input class="input" type="number" v-model.number="entry.extensions.delay" placeholder="0" @input="markDirty">
              <div class="hint">关键词匹配后延迟几轮才触发</div>
            </div>
            <div class="form-group">
              <label>选项</label>
              <div style="display:flex;flex-direction:column;gap:6px">
                <label class="toggle-label">
                  <input type="checkbox" v-model="entry.use_regex" @change="markDirty"> 关键词使用正则匹配
                </label>
                <label class="toggle-label">
                  <input type="checkbox" v-model="entry.extensions.match_whole_words" @change="markDirty"> 整词匹配
                </label>
                <label class="toggle-label">
                  <input type="checkbox" v-model="entry.extensions.case_sensitive" @change="markDirty"> 大小写敏感
                </label>
                <label class="toggle-label">
                  <input type="checkbox" v-model="entry.extensions.ignore_budget" @change="markDirty"> 忽略 Token 预算
                </label>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCardStore } from '../stores/card.js';
import { useAppStore } from '../stores/app.js';

const props = defineProps({
  entry: { type: Object, required: true },
  mode: { type: String, default: 'persisted' },  // 'persisted' | 'preview'
  expanded: { type: Boolean, default: false },
  batchMode: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  draggable: { type: Boolean, default: true },
  isDraggingMe: { type: Boolean, default: false },
  isDragOverMe: { type: Boolean, default: false }
});

const emit = defineEmits([
  'toggle-expand', 'toggle-select', 'delete', 'duplicate', 'update-order', 'update-insertion-order',
  'drag-start', 'drag-over', 'drag-leave', 'drop', 'drag-end'
]);

const store = useCardStore();
const appStore = useAppStore();
const draggingEnabled = ref(false);

function markDirty() {
  if (props.mode === 'persisted') {
    store.markDirty();
  }
}

function changeInsertionOrder(event) {
  const raw = event.target.value;
  const value = Number(raw);
  if (raw === '' || !Number.isSafeInteger(value)) {
    event.target.value = props.entry.insertion_order;
    appStore.toastWarning('酒馆顺序必须是有效整数');
    return;
  }
  props.entry.insertion_order = value;
  markDirty();
  emit('update-insertion-order', value);
}

function syncPosition() {
  const posMap = {
    'before_char': 0, 'after_char': 1,
    'before_example': 2, 'after_example': 3,
    'before_author': 4, 'after_author': 5,
    'atDepth_system': 6, 'atDepth_user': 7, 'atDepth_ai': 8
  };
  if (!props.entry.extensions) props.entry.extensions = {};
  props.entry.extensions.position = posMap[props.entry.position] ?? 0;
  if (props.entry.position === 'atDepth_system') props.entry.extensions.role = 0;
  else if (props.entry.position === 'atDepth_user') props.entry.extensions.role = 1;
  else if (props.entry.position === 'atDepth_ai') props.entry.extensions.role = 2;
}

function handleDelete() {
  if (props.mode === 'preview') {
    emit('delete');
  } else {
    appStore.confirmAction('删除这条世界书条目？', () => emit('delete'));
  }
}
</script>

<style scoped>
.wb-entry {
  background: var(--cf-bg-secondary);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm);
  margin-bottom: 8px;
  transition: all var(--cf-transition);
}
.wb-entry--disabled { opacity: 0.5; }
.wb-entry--constant { border-left: 3px solid var(--cf-warning); }
.wb-entry--dragging { opacity: 0.4; }
.wb-entry--dragover { border-color: var(--cf-accent); border-style: dashed; }

.wb-entry__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  gap: 8px;
}
.wb-entry__header:hover { background: var(--cf-bg-hover); }
.wb-entry__header > .flex-row { min-width: 0; flex-wrap: wrap; }
.wb-entry__name, .wb-entry__keys { overflow-wrap: anywhere; }

.wb-drag-handle {
  cursor: grab;
  color: var(--cf-text-muted);
  font-size: 14px;
  user-select: none;
  padding: 0 4px;
}
.wb-drag-handle:active { cursor: grabbing; }

.wb-order-input {
  width: 50px;
  padding: 2px 6px;
  font-size: 12px;
  background: var(--cf-bg-tertiary);
  border: 1px solid var(--cf-border);
  border-radius: 3px;
  color: var(--cf-text-primary);
  text-align: center;
}

.wb-entry__expand { color: var(--cf-text-muted); font-size: 11px; }
.wb-entry__name { font-weight: 500; color: var(--cf-text-primary); }
.wb-entry__keys {
  font-size: 11px;
  color: var(--cf-text-muted);
  font-family: var(--cf-font-mono);
}
.wb-entry__meta {
  font-size: 11px;
  color: var(--cf-text-muted);
  font-family: var(--cf-font-mono);
}

.wb-entry__body {
  border-top: 1px solid var(--cf-border);
  padding: 16px;
}

.toggle-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; cursor: pointer; color: var(--cf-text-secondary);
}
.toggle-label input { accent-color: var(--cf-accent); }

.flex-row { display: flex; align-items: center; gap: 8px; }
.gap-md { gap: var(--cf-gap-md); }
.mt-md { margin-top: var(--cf-gap-md); }
</style>
