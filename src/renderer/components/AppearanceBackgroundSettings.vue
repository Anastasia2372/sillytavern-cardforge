<template>
  <div class="card__body appearance-settings">
    <div class="appearance-settings__row">
      <div><strong>星空粒子效果</strong><p class="hint">关闭后移除界面上漂浮的光点。</p></div>
      <label class="appearance-switch">
        <input type="checkbox" role="switch" aria-label="星空粒子效果" :checked="options.particles"
          @change="appearance.update('particles', $event.target.checked)">
        <span class="appearance-switch__track" aria-hidden="true"></span>
        <span>{{ options.particles ? '开启' : '关闭' }}</span>
      </label>
    </div>

    <div class="appearance-settings__row appearance-settings__divider">
      <div><strong>背景图片</strong><p class="hint">关闭后只显示主体纯色；重新开启会恢复当前图片。</p></div>
      <label class="appearance-switch">
        <input type="checkbox" role="switch" aria-label="显示背景图片" :checked="options.backgroundEnabled"
          @change="appearance.update('backgroundEnabled', $event.target.checked)">
        <span class="appearance-switch__track" aria-hidden="true"></span>
        <span>{{ options.backgroundEnabled ? '开启' : '纯色' }}</span>
      </label>
    </div>
    <div class="appearance-settings__buttons">
      <button class="btn btn--secondary" :disabled="appearance.busy" @click="appearance.chooseBackground">
        {{ appearance.busy ? '正在载入图片…' : '选择本地图片' }}
      </button>
      <button class="btn btn--ghost" :disabled="appearance.busy" @click="appearance.resetBackground">恢复默认图片</button>
      <span class="hint appearance-settings__filename">{{ options.customBackground ? options.backgroundName : '默认背景图片' }}</span>
    </div>
    <p class="hint">支持 PNG、JPG、WebP，图片自动铺满并居中裁切。选择图片后会自动开启图片背景。</p>

    <div class="appearance-settings__grid">
      <div class="appearance-settings__controls">
        <div class="form-group">
          <label for="appearance-color">主体颜色</label>
          <div class="appearance-settings__color">
            <input id="appearance-color" type="color" :value="options.color"
              @input="appearance.update('color', $event.target.value)">
            <input class="input" aria-label="主体颜色十六进制值" :value="options.color" maxlength="7"
              placeholder="#0a1432" @change="changeColor">
          </div>
        </div>
        <fieldset :disabled="!options.backgroundEnabled">
          <div class="form-group">
            <label for="appearance-order">图层关系（上层覆盖下层）</label>
            <select id="appearance-order" class="select" :value="options.colorOnTop ? 'color' : 'image'"
              @change="appearance.update('colorOnTop', $event.target.value === 'color')">
              <option value="color">纯色层在上 · 图片层在下</option>
              <option value="image">图片层在上 · 纯色层在下</option>
            </select>
          </div>
          <div class="form-group">
            <label for="appearance-blend">上层混合模式</label>
            <select id="appearance-blend" class="select" :value="options.blendMode"
              @change="appearance.update('blendMode', $event.target.value)">
              <option v-for="mode in BLEND_MODES" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="appearance-color-opacity">纯色层不透明度 <strong>{{ options.colorOpacity }}%</strong></label>
            <input id="appearance-color-opacity" type="range" min="0" max="100" step="1" :value="options.colorOpacity"
              @input="appearance.update('colorOpacity', $event.target.value)">
          </div>
          <div class="form-group">
            <label for="appearance-image-opacity">图片层不透明度 <strong>{{ options.imageOpacity }}%</strong></label>
            <input id="appearance-image-opacity" type="range" min="0" max="100" step="1" :value="options.imageOpacity"
              @input="appearance.update('imageOpacity', $event.target.value)">
          </div>
        </fieldset>
        <p v-if="!options.backgroundEnabled" class="hint">纯色模式使用 100% 不透明的主体颜色，暂不应用图层混合设置。</p>
        <button class="btn btn--ghost btn--sm" @click="appearance.resetLayers">重置图层参数</button>
      </div>

      <div class="appearance-settings__preview-column">
        <div class="appearance-settings__preview" role="img" aria-label="当前背景图层合成预览">
          <BackgroundLayers />
          <span>实时预览</span>
        </div>
        <ol v-if="options.backgroundEnabled" class="appearance-settings__layers" aria-label="图层从上到下">
          <li><span>上层</span>{{ options.colorOnTop ? '主体纯色' : '背景图片' }}<b>{{ options.colorOnTop ? options.colorOpacity : options.imageOpacity }}%</b></li>
          <li><span>下层</span>{{ options.colorOnTop ? '背景图片' : '主体纯色' }}<b>{{ options.colorOnTop ? options.imageOpacity : options.colorOpacity }}%</b></li>
        </ol>
        <p v-else class="hint">当前仅显示主体纯色。</p>
        <p class="hint">修改即时生效并自动保存。正常模式下，上层不透明度越高，对下层的遮盖越强。</p>
      </div>
    </div>
    <p v-if="appearance.error" class="appearance-settings__error" role="alert">{{ appearance.error }}</p>
  </div>
</template>

<script setup>
import { useAppearanceStore, BLEND_MODES } from '../stores/appearance.js';
import { useAppStore } from '../stores/app.js';
import BackgroundLayers from './BackgroundLayers.vue';
const appearance = useAppearanceStore();
const options = appearance.options;
const appStore = useAppStore();
function changeColor(event) {
  const color = event.target.value.trim();
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    event.target.value = options.color;
    appStore.toastWarning('请输入六位十六进制颜色，例如 #0a1432');
    return;
  }
  appearance.update('color', color);
}
</script>

<style scoped>
.appearance-settings { border-top: 1px solid var(--cf-border); }
.appearance-settings__row { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.appearance-settings__divider { border-top: 1px solid var(--cf-border); margin-top: 20px; padding-top: 20px; }
.hint { margin-top: 8px; font-size: 12px; line-height: 1.7; color: var(--cf-text-secondary); }
.appearance-settings__buttons { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.appearance-settings__filename { overflow-wrap: anywhere; }
.appearance-settings__grid { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr); gap: 24px; margin-top: 24px; padding: 18px; background: var(--cf-bg-secondary); border-radius: var(--cf-radius-md); }
.appearance-settings__controls fieldset { border: 0; padding: 0; min-width: 0; }
.appearance-settings__controls fieldset:disabled { opacity: .45; }
.appearance-settings__color { display: flex; gap: 10px; align-items: center; }
.appearance-settings__color input[type=color] { width: 48px; height: 36px; padding: 2px; border: 1px solid var(--cf-border-light); border-radius: 5px; background: transparent; cursor: pointer; flex-shrink: 0; }
.appearance-settings__color .input { max-width: 150px; user-select: text; }
.appearance-settings__controls input[type=range] { width: 100%; accent-color: var(--cf-accent); cursor: pointer; }
.appearance-settings__controls label { display: flex; justify-content: space-between; gap: 8px; }
.appearance-settings__controls .select { width: 100%; }
.appearance-settings__preview { position: relative; height: 180px; overflow: hidden; border: 1px solid var(--cf-border-light); border-radius: 8px; }
.appearance-settings__preview > span { position: absolute; left: 10px; bottom: 10px; z-index: 3; padding: 3px 8px; border-radius: 4px; color: #fff; background: rgba(0, 0, 0, .65); font-size: 12px; }
.appearance-settings__layers { list-style: none; margin: 12px 0; padding: 0; }
.appearance-settings__layers li { display: flex; align-items: center; gap: 12px; padding: 10px; margin-top: 6px; border: 1px solid var(--cf-border-light); border-radius: 5px; font-size: 12px; }
.appearance-settings__layers span { color: var(--cf-text-secondary); }
.appearance-settings__layers b { margin-left: auto; font-variant-numeric: tabular-nums; }
.appearance-settings__error { color: #fca5a5; margin-top: 12px; user-select: text; overflow-wrap: anywhere; }
.appearance-switch { display: inline-flex; align-items: center; gap: 10px; position: relative; cursor: pointer; flex-shrink: 0; }
.appearance-switch input { position: absolute; width: 44px; height: 24px; opacity: 0; margin: 0; cursor: pointer; }
.appearance-switch__track { display: block; width: 44px; height: 24px; border-radius: 12px; background: #4b5563; transition: background .15s; pointer-events: none; }
.appearance-switch__track::after { content: ''; display: block; width: 18px; height: 18px; margin: 3px; border-radius: 50%; background: #fff; transition: transform .15s; }
.appearance-switch input:checked + .appearance-switch__track { background: #d99532; }
.appearance-switch input:checked + .appearance-switch__track::after { transform: translateX(20px); }
.appearance-switch input:focus-visible + .appearance-switch__track { outline: 2px solid #67e8f9; outline-offset: 3px; }
@media (max-width: 1050px) { .appearance-settings__grid { grid-template-columns: 1fr; } }
</style>
