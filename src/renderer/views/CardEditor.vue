<template>
  <div class="page">
    <div class="page__header flex-between">
      <div>
        <h1>角色卡编辑</h1>
        <p>编辑角色的基础信息、人设、开场白等所有 V2 字段</p>
      </div>
      <div class="flex-row">
        <button class="btn btn--secondary" @click="handleImportCover">
          {{ coverImagePath ? '更换封面' : '上传封面' }}
        </button>
        <button class="btn btn--primary" @click="handleExport">导出</button>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="tabs">
      <div :class="['tabs__item', { active: tab === 'basic' }]" @click="tab = 'basic'">基本信息</div>
      <div :class="['tabs__item', { active: tab === 'desc' }]" @click="tab = 'desc'">角色描述</div>
      <div :class="['tabs__item', { active: tab === 'greetings' }]" @click="tab = 'greetings'">开场白</div>
      <div :class="['tabs__item', { active: tab === 'prompts' }]" @click="tab = 'prompts'">提示词</div>
      <div :class="['tabs__item', { active: tab === 'meta' }]" @click="tab = 'meta'">元信息</div>
    </div>

    <!-- 基本信息 -->
    <div v-show="tab === 'basic'" class="card">
      <div class="card__body">
        <div class="grid-2">
          <div class="form-group">
            <label>角色名称 (name) <span class="badge badge--danger">必填</span></label>
            <input class="input" v-model="d.name" placeholder="输入角色名称" @input="markDirty">
          </div>
          <div class="form-group">
            <label>性格摘要 (personality)</label>
            <input class="input" v-model="d.personality" placeholder="几个关键词描述性格" @input="markDirty">
            <div class="hint">例：温柔、内敛、轻微社恐、爱书如命</div>
          </div>
        </div>
        <div class="form-group">
          <label>场景设定 (scenario)</label>
          <textarea class="textarea" v-model="d.scenario" rows="3"
            placeholder="对话发生的背景情境" @input="markDirty"></textarea>
        </div>
        <div class="form-group">
          <label>对话示例 (mes_example)</label>
          <textarea class="textarea" v-model="d.mes_example" rows="8"
            placeholder="用 <START> 分隔不同场景的对话示例&#10;{{user}}: 你好&#10;{{char}}: *微微一笑* 你来了。" @input="markDirty"></textarea>
          <div class="hint">用 &lt;START&gt; 分隔场景，{{char}} 代表角色，{{user}} 代表用户</div>
        </div>
      </div>
    </div>

    <!-- 角色描述 -->
    <div v-show="tab === 'desc'" class="card">
      <div class="card__body">
        <div class="form-group">
          <label>角色描述 (description)</label>
          <textarea class="textarea" v-model="d.description" rows="20"
            placeholder="角色的核心设定：外貌、性格、背景、说话方式等&#10;&#10;提示：如果你使用世界书来存放详细设定，这里可以留空或只写最核心的信息。" @input="markDirty"></textarea>
          <div class="hint">
            字数：{{ (d.description || '').length }} 字 | 预估 Token：~{{ Math.round((d.description || '').length * 1.3) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 开场白 -->
    <div v-show="tab === 'greetings'" class="card">
      <div class="card__body">
        <div class="form-group">
          <label>主开场白 (first_mes) <span class="badge badge--danger">必填</span></label>
          <textarea class="textarea" v-model="d.first_mes" rows="12"
            placeholder="角色的第一条消息。描述场景、角色状态，给用户一个接话的点。" @input="markDirty"></textarea>
          <div class="hint">字数：{{ (d.first_mes || '').length }}</div>
        </div>

        <div class="divider"></div>

        <div class="flex-between mb-md">
          <label style="font-weight:600">备选开场白 (alternate_greetings)</label>
          <button class="btn btn--secondary btn--sm" @click="store.addGreeting()">+ 添加开场白</button>
        </div>

        <div v-for="(g, i) in d.alternate_greetings" :key="i" class="alt-greeting">
          <div class="flex-between mb-md">
            <span class="badge badge--info">开场白 {{ i + 2 }}</span>
            <button class="btn btn--danger btn--sm" @click="appStore.confirmAction('删除这个开场白？', () => store.removeGreeting(i))">删除</button>
          </div>
          <textarea class="textarea" v-model="d.alternate_greetings[i]" rows="8"
            placeholder="备选开场白内容" @input="markDirty"></textarea>
        </div>
      </div>
    </div>

    <!-- 提示词 -->
    <div v-show="tab === 'prompts'" class="card">
      <div class="card__body">
        <div class="form-group">
          <label>系统提示词 (system_prompt)</label>
          <textarea class="textarea" v-model="d.system_prompt" rows="8"
            placeholder="给 AI 的额外指令，如回复格式、长度、视角等" @input="markDirty"></textarea>
          <div class="hint">可选。用于控制 AI 的行为规则，如"每次回复800-1500字"、"不要扮演{{user}}"等</div>
        </div>
        <div class="form-group">
          <label>历史后指令 (post_history_instructions)</label>
          <textarea class="textarea" v-model="d.post_history_instructions" rows="5"
            placeholder="插入在聊天历史之后、AI 回复之前的指令" @input="markDirty"></textarea>
        </div>
        <div class="form-group">
          <label>深度提示词 (depth_prompt)</label>
          <div class="grid-2">
            <div>
              <textarea class="textarea" v-model="d.extensions.depth_prompt.prompt" rows="4"
                placeholder="在指定深度注入的提示词" @input="markDirty"></textarea>
            </div>
            <div>
              <div class="form-group">
                <label>注入深度</label>
                <input class="input" type="number" v-model.number="d.extensions.depth_prompt.depth"
                  min="0" max="999" @input="markDirty">
              </div>
              <div class="form-group">
                <label>角色</label>
                <select class="select" v-model="d.extensions.depth_prompt.role" @change="markDirty">
                  <option value="system">System</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 元信息 -->
    <div v-show="tab === 'meta'" class="card">
      <div class="card__body">
        <div class="grid-2">
          <div class="form-group">
            <label>创作者 (creator)</label>
            <input class="input" v-model="d.creator" @input="markDirty">
          </div>
          <div class="form-group">
            <label>版本号 (character_version)</label>
            <input class="input" v-model="d.character_version" @input="markDirty">
          </div>
        </div>
        <div class="form-group">
          <label>创作者备注 (creator_notes)</label>
          <textarea class="textarea" v-model="d.creator_notes" rows="4"
            placeholder="给用户的说明文字（不发送给 AI）" @input="markDirty"></textarea>
        </div>
        <div class="form-group">
          <label>标签 (tags)</label>
          <input class="input" :value="(d.tags || []).join(', ')"
            @input="d.tags = $event.target.value.split(',').map(t => t.trim()).filter(Boolean); markDirty()"
            placeholder="用逗号分隔标签">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCardStore } from '../stores/card.js';
import { useAppStore } from '../stores/app.js';

const store = useCardStore();
const appStore = useAppStore();
const api = window.cardForgeAPI;

const tab = ref('basic');
const d = computed(() => store.cardData);
const coverImagePath = computed(() => store.coverImagePath);

function markDirty() { store.markDirty(); }

async function handleImportCover() {
  const path = await api.openImage();
  if (path) {
    store.coverImagePath = path;
    appStore.toastSuccess('封面图片已设置');
  }
}

async function handleExport() {
  try {
    const json = store.exportJson();
    const defaultName = (d.value.name || 'character');

    const savePath = await api.saveFile({
      defaultPath: defaultName + '.png',
      filters: [
        { name: 'PNG 角色卡', extensions: ['png'] },
        { name: 'JSON 文件', extensions: ['json'] }
      ]
    });
    if (!savePath) return;

    if (savePath.toLowerCase().endsWith('.json')) {
      const result = await api.writeFile(savePath, JSON.stringify(json, null, 2));
      if (!result?.success) throw new Error(result?.error || '文件写入失败');
      appStore.toastSuccess('JSON 导出成功');
    } else if (savePath.toLowerCase().endsWith('.png')) {
      if (!store.coverImagePath) {
        const imgPath = await api.openImage();
        if (!imgPath) { appStore.toastWarning('需要封面图片'); return; }
        store.coverImagePath = imgPath;
      }
      const result = await api.embedCharaData(store.coverImagePath, json, savePath);
      if (!result.success) throw new Error(result.error);
      appStore.toastSuccess('PNG 角色卡导出成功');
    } else throw new Error('请选择 .png 或 .json 扩展名保存角色卡');
    store.isDirty = false;
  } catch (e) {
    appStore.toastError(`导出失败: ${e.message}`);
  }
}
</script>

<style scoped>
.alt-greeting {
  background: var(--cf-bg-tertiary);
  border: 1px solid var(--cf-border);
  border-radius: var(--cf-radius-sm);
  padding: var(--cf-gap-md);
  margin-bottom: var(--cf-gap-md);
}
</style>
