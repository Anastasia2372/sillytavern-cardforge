<template>
  <div class="page">
    <div class="page__header">
      <h1>角色设定</h1>
      <p>设定 {{char}}（AI 扮演的角色）的详细信息 — 这些字段都是可选的</p>
    </div>

    <!-- 说明卡片 -->
    <div class="card mb-md">
      <div class="card__body" style="font-size:12px;color:var(--cf-text-secondary);line-height:1.8">
        <strong>{{char}} 是谁？</strong> 就是 AI 要扮演的角色。有三种常见用法：<br>
        · <strong>单角色卡</strong> — {{char}} 是一个具体的人（角色名 + 设定），AI 只演她<br>
        · <strong>多角色卡</strong> — {{char}} 是故事标题/叙述者，AI 演里面所有角色<br>
        · <strong>系统卡</strong> — {{char}} 是游戏系统，AI 演整个世界<br><br>
        <strong>提示：</strong> 如果你把所有设定都放在世界书里（空 description 流派），这些字段可以留空。
      </div>
    </div>

    <!-- 角色描述 -->
    <div class="card mb-md">
      <div class="card__header flex-between">
        <h3>角色描述 (description)</h3>
        <span class="badge badge--info">{{ (d.description || '').length }} 字</span>
      </div>
      <div class="card__body">
        <p class="hint mb-md">
          角色的核心设定：外貌、性格、背景、说话方式等。这段文字每次对话都会发送给 AI。<br>
          如果你用世界书存放详细设定，这里可以留空或只写最核心的摘要。
        </p>
        <textarea class="textarea" v-model="d.description" rows="12"
          placeholder="写给 AI 的角色说明书。&#10;&#10;单角色卡示例：&#10;（角色名），28岁，书店老板娘。温柔内敛，说话轻声细语...&#10;&#10;多角色卡示例：&#10;故事围绕多位主要角色展开。角色 A 性格X、角色 B 性格Y...&#10;&#10;系统卡示例：&#10;这是一个互动剧情游戏。AI 负责扮演所有 NPC 并管理游戏系统..." @input="markDirty"></textarea>
        <div class="hint">预估 Token：~{{ Math.round((d.description || '').length * 1.3) }}</div>
      </div>
    </div>

    <!-- 性格 + 场景 -->
    <div class="card mb-md">
      <div class="card__header"><h3>性格与场景</h3></div>
      <div class="card__body">
        <div class="form-group">
          <label>性格摘要 (personality)</label>
          <input class="input" v-model="d.personality" placeholder="几个关键词，如：温柔、傲娇、腹黑、天然呆" @input="markDirty">
          <div class="hint">简短的性格标签，相当于给 AI 的"便利贴"提醒。留空也行，description 里写了就够了。</div>
        </div>
        <div class="form-group">
          <label>场景设定 (scenario)</label>
          <textarea class="textarea" v-model="d.scenario" rows="3"
            placeholder="对话发生的背景情境。如：深夜，一家旧书店。{{user}} 是常客。" @input="markDirty"></textarea>
          <div class="hint">告诉 AI "故事发生在什么地方、什么时候、什么情况下"。</div>
        </div>
      </div>
    </div>

    <!-- 对话示例 -->
    <div class="card mb-md">
      <div class="card__header flex-between">
        <h3>对话示例 (mes_example)</h3>
        <span class="badge badge--info">{{ (d.mes_example || '').length }} 字</span>
      </div>
      <div class="card__body">
        <p class="hint mb-md">
          教 AI "怎么说话"最有效的方式。用 &lt;START&gt; 分隔不同场景，{{char}} 代表角色，{{user}} 代表用户。<br>
          也可以用「对话样本」页面让 AI 自动生成。
        </p>
        <textarea class="textarea" v-model="d.mes_example" rows="10"
          placeholder="<START>&#10;{{user}}: 今天你看起来很开心啊。&#10;{{char}}: *推了推眼镜* 开心？才没有。只是今天到了一批旧书。&#10;*小心翼翼地捧出一本泛黄的书*&#10;你看，1932年的初版……&#10;&#10;<START>&#10;{{user}}: 要不要一起吃饭？&#10;{{char}}: 吃饭？*犹豫着，手指卷着一缕头发*&#10;……你等我十分钟，我把猫粮放好。" @input="markDirty"></textarea>
      </div>
    </div>

    <!-- 提示词 -->
    <div class="card mb-md">
      <div class="card__header"><h3>系统提示词</h3></div>
      <div class="card__body">
        <div class="form-group">
          <label>系统提示词 (system_prompt)</label>
          <textarea class="textarea" v-model="d.system_prompt" rows="5"
            placeholder="给 AI 的行为指令。如：&#10;每次回复800-1500字。不要扮演{{user}}。动作用*星号*包裹。" @input="markDirty"></textarea>
          <div class="hint">控制 AI 的回复格式、长度、视角等规则。也可以用「额外需求」页面勾选生成。</div>
        </div>
        <div class="form-group">
          <label>历史后指令 (post_history_instructions)</label>
          <textarea class="textarea" v-model="d.post_history_instructions" rows="3"
            placeholder="插入在聊天历史之后、AI 回复之前的强化指令" @input="markDirty"></textarea>
          <div class="hint">比 system_prompt 更"靠近" AI 回复的位置，AI 更容易遵守这里的指令。</div>
        </div>
        <div class="form-group">
          <label>深度提示词 (depth_prompt)</label>
          <div class="grid-2">
            <textarea class="textarea" v-model="d.extensions.depth_prompt.prompt" rows="3"
              placeholder="在指定深度注入的提示词" @input="markDirty"></textarea>
            <div>
              <div class="form-group">
                <label>注入深度</label>
                <input class="input" type="number" v-model.number="d.extensions.depth_prompt.depth" min="0" @input="markDirty">
                <div class="hint">0=最新消息旁边，4=第4条消息处</div>
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
    <div class="card">
      <div class="card__header"><h3>元信息</h3></div>
      <div class="card__body">
        <div class="grid-2">
          <div class="form-group">
            <label>创作者 (creator)</label>
            <input class="input" v-model="d.creator" @input="markDirty">
            <div class="hint">你的名字或笔名</div>
          </div>
          <div class="form-group">
            <label>版本号 (character_version)</label>
            <input class="input" v-model="d.character_version" @input="markDirty">
            <div class="hint">如：1.0、2.1</div>
          </div>
        </div>
        <div class="form-group">
          <label>创作者备注 (creator_notes)</label>
          <textarea class="textarea" v-model="d.creator_notes" rows="3"
            placeholder="给使用者看的说明（不会发送给 AI）。如：推荐使用 Claude 模型，需要安装酒馆助手扩展。" @input="markDirty"></textarea>
        </div>
        <div class="form-group">
          <label>标签 (tags)</label>
          <CommaListInput class="input" :model-value="d.tags || []"
            @update:model-value="d.tags = $event; markDirty()"
            placeholder="用逗号分隔，如：校园, 日常, 恋爱" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CommaListInput from '../components/CommaListInput.vue';
import { computed } from 'vue';
import { useCardStore } from '../stores/card.js';

const store = useCardStore();
const d = computed(() => store.cardData);

function markDirty() { store.markDirty(); }
</script>
