<template>
  <div class="app-root">
    <BackgroundLayers />
    <!-- 星空粒子 -->
    <div v-if="appearance.options.particles" class="starfield">
      <div v-for="star in stars" :key="star.id" class="starfield__star" :style="star.style"></div>
    </div>

    <!-- 自定义标题栏 -->
    <div class="titlebar">
      <div class="titlebar__title">角色卡锻造炉</div>
      <AutosaveStatus />
      <div class="titlebar__controls">
        <button class="titlebar__btn" @click="api.minimize()">─</button>
        <button class="titlebar__btn" @click="api.maximize()">☐</button>
        <button class="titlebar__btn titlebar__btn--close" @click="api.close()">✕</button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="app-layout">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar__logo">
          <div class="sidebar__logo-text" style="font-size:15px">
            角色卡锻造炉
            <span class="sub">{{ appVersion }}</span>
          </div>
        </div>

        <nav class="sidebar__nav">
          <div class="sidebar__section">
            <div class="sidebar__section-title">总览</div>
            <router-link to="/" class="sidebar__item" active-class="active" exact>
              <span class="sidebar__item-icon">·</span> 工作台
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">必填 · 做卡必须</div>
            <router-link to="/basic" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 基本信息
            </router-link>
            <router-link to="/charsetting" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 角色设定
            </router-link>
            <router-link to="/worldbook" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 世界书
              <span class="badge badge--accent" v-if="cardStore.stats.totalEntries">
                {{ cardStore.stats.totalEntries }}
              </span>
            </router-link>
            <router-link to="/greeting" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 开场白
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">可选 · 锦上添花</div>
            <router-link to="/npc" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> NPC 生成器
            </router-link>
            <router-link to="/novel-extract" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 小说转世界书
            </router-link>
            <router-link to="/player" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 玩家角色
            </router-link>
            <router-link to="/dialogue" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 对话样本
            </router-link>
            <router-link to="/extra" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 额外需求
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">高级 · 进阶功能</div>
            <router-link to="/mvu" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> MVU 变量系统
            </router-link>
            <router-link to="/regex" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 正则脚本
              <span class="badge badge--info" v-if="cardStore.stats.regexCount">
                {{ cardStore.stats.regexCount }}
              </span>
            </router-link>
            <router-link to="/scripts" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 酒馆助手脚本
            </router-link>
            <router-link to="/ejs" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> EJS 模板
            </router-link>
            <router-link to="/statusbar" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 前端状态栏
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">导出</div>
            <router-link to="/package" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 打包角色卡
            </router-link>
            <router-link to="/tavern-link" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 酒馆 Link
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">工具</div>
            <router-link to="/diagnostic" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 角色卡诊断
            </router-link>
            <router-link to="/sandbox" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 状态栏沙盒
            </router-link>
            <router-link to="/assistant" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> AI 助手
            </router-link>
            <router-link to="/agent" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 创作 Agent
            </router-link>
            <router-link to="/statistics" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 卡片统计
            </router-link>
          </div>

          <div class="sidebar__section">
            <div class="sidebar__section-title">设置</div>
            <router-link to="/settings" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> 总设置
            </router-link>
            <router-link to="/api" class="sidebar__item" active-class="active">
              <span class="sidebar__item-icon">·</span> API 设置
              <span class="badge badge--success" v-if="apiStore.isConfigured">OK</span>
            </router-link>
            <div class="sidebar__item" style="cursor:pointer" @click="showErrorLog = true">
              <span class="sidebar__item-icon">·</span> 错误日志
            </div>
            <div class="sidebar__item" style="cursor:pointer" @click="checkUpdate" :class="{ disabled: checkingUpdate }">
              <span class="sidebar__item-icon">·</span> {{ checkingUpdate ? '检查中...' : '检查更新' }}
            </div>
          </div>
        </nav>

      </aside>

      <!-- 内容区 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>

    <!-- 错误日志弹窗 -->
    <ErrorLogModal :visible="showErrorLog" @close="showErrorLog = false" />

    <!-- 自定义确认弹窗 -->
    <div v-if="appStore.confirmVisible" class="cf-confirm-overlay" @click.self="appStore.confirmNo()">
      <div class="cf-confirm-dialog">
        <div class="cf-confirm-msg">{{ appStore.confirmMessage }}</div>
        <div class="cf-confirm-btns">
          <button class="btn btn--danger" @click="appStore.confirmYes()">确认</button>
          <button class="btn btn--secondary" @click="appStore.confirmNo()">取消</button>
        </div>
      </div>
    </div>

    <!-- 多选项弹窗（三按钮及以上） -->
    <div v-if="appStore.chooseVisible" class="cf-confirm-overlay" @click.self="appStore.chooseResolve(null)">
      <div class="cf-confirm-dialog">
        <div class="cf-confirm-msg">{{ appStore.chooseMessage }}</div>
        <div class="cf-confirm-btns">
          <button v-for="opt in appStore.chooseOptions" :key="opt.value"
            class="btn" :class="opt.cls || 'btn--secondary'"
            @click="appStore.chooseResolve(opt.value)">
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 创作 Agent 页面保留悬浮工具；AI 助手和诊断页面隐藏。 -->
    <FloatingTools v-if="!['/assistant', '/diagnostic'].includes($route.path)" v-show="floatingTools.visible" />
    <FloatingToolsSettings />

    <!-- Toast 通知 -->
    <div class="toast-container">
      <div
        v-for="t in appStore.toasts"
        :key="t.id"
        :class="['toast', `toast--${t.type}`]"
      >
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useCardStore } from './stores/card.js';
import { useApiStore } from './stores/api.js';
import { useAppStore } from './stores/app.js';
import BackgroundLayers from './components/BackgroundLayers.vue';
import { useAppearanceStore } from './stores/appearance.js';
import ErrorLogModal from './components/ErrorLogModal.vue';
import FloatingTools from './components/FloatingTools.vue';
import AutosaveStatus from './components/AutosaveStatus.vue';
import FloatingToolsSettings from './components/FloatingToolsSettings.vue';
import { useFloatingToolsStore } from './stores/floating-tools.js';

const api = window.cardForgeAPI;
const cardStore = useCardStore();
const apiStore = useApiStore();
const appStore = useAppStore();
const appearance = useAppearanceStore();
const floatingTools = useFloatingToolsStore();

// 错误日志弹窗
const appVersion = ref('');
const showErrorLog = ref(false);

// 检查更新
const checkingUpdate = ref(false);
async function checkUpdate() {
  if (checkingUpdate.value) return;
  checkingUpdate.value = true;
  try {
    const res = await window.cardForgeAPI.checkForUpdates();
    if (!res.success) {
      appStore.toastError('检查失败：' + (res.error || '未知错误'));
    } else if (res.skipped === 'dev') {
      appStore.toastInfo(res.message);
    } else if (res.version && res.version !== res.current) {
      // 主进程已经会弹原生 dialog，这里不重复
      appStore.toastInfo(`发现新版本 ${res.version}`);
    } else {
      appStore.toastSuccess(`已是最新版本（${res.current || ''}）`);
    }
  } catch (e) {
    appStore.toastError('检查失败：' + e.message);
  } finally {
    checkingUpdate.value = false;
  }
}

// 星空粒子 — 下落式
function makeStars(count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const size = 1 + Math.random() * 2;
    const duration = 6 + Math.random() * 10; // 6-16秒落下
    const delay = Math.random() * duration;  // 错开起始时间
    arr.push({
      id: i,
      style: {
        left: Math.random() * 100 + '%',
        top: '-10px',
        width: size + 'px',
        height: size + 'px',
        animationDelay: delay + 's',
        animationDuration: duration + 's'
      }
    });
  }
  return arr;
}
const stars = ref(makeStars(60));

onMounted(async () => {
  appearance.initialize();
  await appStore.loadTheme();
  await apiStore.loadFromDisk();
  try { appVersion.value = 'v' + await api.getAppVersion(); } catch {}
});
</script>
