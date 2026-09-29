<template>
  <div class="page">
    <div class="page__header">
      <h1>欢迎来到角色卡锻造炉，在这里开始你的传奇之路</h1>
      <p>全功能 SillyTavern 角色卡制作工具 — 从简单角色到复杂世界，一站锻造</p>
    </div>

    <!-- 快捷操作 -->
    <div class="grid-2 mb-md">
      <div class="dash-action" @click="handleNew" style="position:relative">
          <div class="dash-action__icon"></div>
        <div class="dash-action__title">新建角色卡</div>
        <div class="dash-action__desc">从空白模板开始创建</div>
      </div>
      <div class="dash-action" @click="handleImport" style="position:relative">
          <div class="dash-action__icon"></div>
        <div class="dash-action__title">导入角色卡</div>
        <div class="dash-action__desc">打开 PNG 或 JSON 文件</div>
      </div>
    </div>

    <div class="grid-2 mb-md">
      <div class="dash-action" @click="$router.push('/npc')" style="position:relative">
          <div class="dash-action__icon"></div>
        <div class="dash-action__title">NPC 生成器</div>
        <div class="dash-action__desc">用 AI 快速生成角色</div>
      </div>
      <div class="dash-action" @click="handleImportFromWorldbook" style="position:relative">
          <div class="dash-action__icon"></div>
        <div class="dash-action__title">以世界书生成卡</div>
        <div class="dash-action__desc">从 ST 世界书 JSON 起一张空白卡（自动灌入条目）</div>
      </div>
    </div>

    <div class="grid-2 mb-md">
      <div class="dash-action" @click="showAssetImport = true" style="position:relative">
          <div class="dash-action__icon"></div>
        <div class="dash-action__title">从其他卡导入资产</div>
        <div class="dash-action__desc">挑选其他卡的世界书 / MVU / 正则 / 脚本融合到当前卡</div>
      </div>
    </div>

    <AssetImportModal :visible="showAssetImport" @close="showAssetImport = false" />

    <!-- 当前卡片信息 -->
    <div class="card" v-if="cardStore.cardData.name" style="position:relative">
      <div class="card__header">
        <h3>当前角色卡</h3>
        <span class="badge badge--accent">{{ cardStore.isDirty ? '未保存' : '已保存' }}</span>
      </div>
      <div class="card__body">
        <div class="grid-2">
          <div class="dash-stat">
            <span class="dash-stat__label">角色名</span>
            <span class="dash-stat__value">{{ cardStore.cardName }}</span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat__label">世界书条目</span>
            <span class="dash-stat__value">{{ cardStore.stats.totalEntries }} 条
              <small>（{{ cardStore.stats.enabledEntries }} 启用 / {{ cardStore.stats.constantEntries }} 常驻）</small>
            </span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat__label">正则脚本</span>
            <span class="dash-stat__value">{{ cardStore.stats.regexCount }} 个</span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat__label">酒馆助手脚本</span>
            <span class="dash-stat__value">{{ cardStore.stats.scriptCount }} 个</span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat__label">备选开场白</span>
            <span class="dash-stat__value">{{ cardStore.stats.alternateGreetings }} 个</span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat__label">预估 Token</span>
            <span class="dash-stat__value">~{{ cardStore.stats.estimatedTokens.toLocaleString() }}</span>
          </div>
        </div>

        <div class="flex-row mt-md">
          <button class="btn btn--primary" @click="$router.push('/basic')">编辑角色卡</button>
          <button class="btn btn--secondary" @click="handleExport">导出</button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="card" v-else style="position:relative">
      <div class="empty-state">
        <div class="empty-state__icon"></div>
        <div class="empty-state__title">还没有打开任何角色卡</div>
        <div class="empty-state__desc">
          点击上方「新建角色卡」从零开始，或「导入角色卡」打开已有的 PNG/JSON 文件
        </div>
      </div>
    </div>

    <!-- 功能概览 -->
    <div class="card mt-md" style="position:relative">
      <div class="card__header"><h3>功能一览</h3></div>
      <div class="card__body">
        <div class="grid-3">
          <div class="feature-item">
            <strong>全字段编辑</strong>
            <p>V2 规范所有字段，description、personality、scenario 等</p>
          </div>
          <div class="feature-item">
            <strong>世界书编辑器</strong>
            <p>条目增删改查、关键词管理、位置/排序/优先级配置</p>
          </div>
          <div class="feature-item">
            <strong>正则脚本</strong>
            <p>markdownOnly/promptOnly、楼层深度控制、实时预览</p>
          </div>
          <div class="feature-item">
            <strong>酒馆助手脚本</strong>
            <p>MVU/Zod Schema 代码编辑、按钮配置</p>
          </div>
          <div class="feature-item">
            <strong>NPC 生成器</strong>
            <p>AI 全自动生成 / 关键信息扩写，一键注入世界书</p>
          </div>
          <div class="feature-item">
            <strong>卡片统计</strong>
            <p>条目统计、Token 估算、结构分析</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCardStore } from '../stores/card.js';
import { useAppStore } from '../stores/app.js';
import AssetImportModal from '../components/AssetImportModal.vue';
import { parseStWorldbookEntries } from '../utils/st-worldbook-import.js';

const router = useRouter();
const cardStore = useCardStore();
const appStore = useAppStore();
const api = window.cardForgeAPI;
const showAssetImport = ref(false);

function handleNew() {
  cardStore.newCard();
  router.push('/basic');
  appStore.toastSuccess('已创建新角色卡');
}

async function handleImport() {
  const filePath = await api.openFile();
  if (!filePath) return;

  try {
    if (filePath.toLowerCase().endsWith('.json')) {
      const result = await api.readTextFile(filePath);
      if (!result.success) throw new Error(result.error);
      const json = JSON.parse(result.data);
      cardStore.loadFromJson(json);
      cardStore.filePath = filePath;
      appStore.toastSuccess(`已导入: ${cardStore.cardName}`);
      router.push('/basic');
      return;
    }

    if (filePath.toLowerCase().endsWith('.png')) {
      // 同时读 PNG base64（用作封面 fallback）
      const fileResult = await api.readFile(filePath);
      const base64 = fileResult.success ? `data:image/png;base64,${fileResult.data}` : null;

      // 尝试提取角色卡数据
      const charaResult = await api.extractCharaData(filePath);

      if (!charaResult.success) {
        // 纯封面 PNG（不含角色卡数据）→ 不动 cardData，只设封面
        cardStore.coverImagePath = filePath;
        if (base64) cardStore.coverImageBase64 = base64;
        cardStore.markDirty();
        appStore.toastSuccess('已设置封面图（PNG 不含角色卡数据）');
        router.push('/basic');
        return;
      }

      // PNG 含完整角色卡数据
      const applyOverwrite = () => {
        cardStore.loadFromJson(charaResult.data);
        cardStore.filePath = filePath;
        cardStore.coverImagePath = filePath;
        if (base64) cardStore.coverImageBase64 = base64;
        appStore.toastSuccess(`已导入: ${cardStore.cardName}`);
        router.push('/basic');
      };
      const applyCoverOnly = () => {
        cardStore.coverImagePath = filePath;
        if (base64) cardStore.coverImageBase64 = base64;
        cardStore.markDirty();
        appStore.toastSuccess('已设置封面图（角色卡数据已忽略）');
        router.push('/basic');
      };

      if (cardStore.isDirty) {
        // 有未保存改动 → 三选项弹窗
        appStore.chooseAction(
          '这张 PNG 含完整角色卡数据。当前编辑的卡有未保存改动，要怎么处理？',
          [
            { value: 'cover', label: '只用它当封面', cls: 'btn--primary' },
            { value: 'overwrite', label: '用 PNG 覆盖当前卡', cls: 'btn--secondary' },
            { value: 'cancel', label: '取消', cls: 'btn--ghost' },
          ],
          (choice) => {
            if (choice === 'overwrite') applyOverwrite();
            else if (choice === 'cover') applyCoverOnly();
          }
        );
        return;
      }

      // 空白卡或未改动 → 直接覆盖
      applyOverwrite();
      return;
    }

    const extension = filePath.split(/[/\\]/).pop().match(/\.[^.]+$/)?.[0] || '无扩展名';
    throw new Error(`不支持的文件格式（${extension}），请选择 PNG 角色卡或 JSON 文件；普通 JPG / WEBP 图片请在「打包角色卡」中设置封面`);
  } catch (e) {
    appStore.toastError(`导入失败: ${e.message}`);
  }
}

async function handleImportFromWorldbook() {
  const filePath = await api.openFile();
  if (!filePath) return;
  if (!filePath.toLowerCase().endsWith('.json')) {
    appStore.toastError('请选择 .json 格式的世界书文件');
    return;
  }
  try {
    const result = await api.readTextFile(filePath);
    if (!result.success) throw new Error(result.error);
    const rawJson = JSON.parse(result.data);
    const { entries, unsupportedPosition } = parseStWorldbookEntries(rawJson);
    if (entries.length === 0) {
      appStore.toastWarning('未在 JSON 中找到有效世界书条目');
      return;
    }
    // 新建空白卡 → 把世界书塞进 character_book
    cardStore.newCard();
    const fileName = filePath.split(/[/\\]/).pop().replace(/\.json$/i, '');
    cardStore.cardData.character_book.name = fileName;
    cardStore.cardData.character_book.entries = entries;
    cardStore.markDirty();

    let msg = `已用世界书生成空白卡：${entries.length} 条条目`;
    if (unsupportedPosition > 0) {
      msg += `（${unsupportedPosition} 条 position 类型不支持，已转为 after_char）`;
    }
    appStore.toastSuccess(msg);
    setTimeout(() => {
      appStore.toastInfo('请在编辑器里填写角色名 / 描述 / 开场白');
    }, 1500);
    router.push('/basic');
  } catch (e) {
    appStore.toastError(`导入失败: ${e.message}`);
  }
}

async function handleExport() {
  try {
    const json = cardStore.exportJson();
    const defaultName = (cardStore.cardData.name || 'character') + '.json';
    const savePath = await api.saveFile({ defaultPath: defaultName });
    if (!savePath) return;

    if (savePath.toLowerCase().endsWith('.json')) {
      const result = await api.writeFile(savePath, JSON.stringify(json, null, 2));
      if (!result?.success) throw new Error(result?.error || '文件写入失败');
      appStore.toastSuccess('JSON 导出成功');
    } else if (savePath.toLowerCase().endsWith('.png')) {
      if (!cardStore.coverImagePath) {
        // Ask user to select a cover image
        const imgPath = await api.openImage();
        if (!imgPath) {
          appStore.toastWarning('需要选择一张封面图片才能导出 PNG');
          return;
        }
        cardStore.coverImagePath = imgPath;
      }
      const result = await api.embedCharaData(cardStore.coverImagePath, json, savePath);
      if (!result.success) throw new Error(result.error);
      appStore.toastSuccess('PNG 角色卡导出成功');
    } else throw new Error('请选择 .png 或 .json 扩展名保存角色卡');
  } catch (e) {
    appStore.toastError(`导出失败: ${e.message}`);
  }
}
</script>

<style scoped>
.dash-action {
  background: var(--cf-bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--cf-radius-md);
  padding: 24px;
  cursor: pointer;
  transition: var(--cf-transition);
  text-align: center;
}
.dash-action:hover {
  transform: translateY(-2px);
  border-color: rgba(245, 158, 66, 0.3);
}
.dash-action__icon { font-size: 32px; margin-bottom: 12px; }
.dash-action__title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.dash-action__desc { font-size: 12px; color: var(--cf-text-muted); }

.dash-stat {
  padding: 12px 0;
}
.dash-stat__label {
  display: block;
  font-size: 11px;
  color: var(--cf-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.dash-stat__value {
  font-size: 15px;
  font-weight: 600;
}
.dash-stat__value small {
  font-weight: 400;
  color: var(--cf-text-secondary);
  font-size: 12px;
}

.feature-item {
  padding: 12px;
  strong { font-size: 13px; display: block; margin-bottom: 4px; }
  p { font-size: 12px; color: var(--cf-text-muted); line-height: 1.5; }
}
</style>
