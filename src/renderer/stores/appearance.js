import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import wallpaperDataUrl from '../wallpaper-data.js';

export const BLEND_MODES = [
  { value: 'normal', label: '正常' },
  { value: 'multiply', label: '正片叠底' },
  { value: 'screen', label: '滤色' },
  { value: 'overlay', label: '叠加' },
  { value: 'soft-light', label: '柔光' },
  { value: 'darken', label: '变暗' },
  { value: 'lighten', label: '变亮' }
];
const defaults = () => ({ particles: true, backgroundEnabled: true, customBackground: false,
  backgroundName: '', color: '#0a1432', colorOpacity: 45, imageOpacity: 100,
  colorOnTop: true, blendMode: 'normal' });
const STORAGE_KEY = 'cf_appearance';

export const useAppearanceStore = defineStore('appearance', () => {
  const options = reactive(defaults());
  const customImage = ref('');
  const busy = ref(false);
  const error = ref('');
  let initialized;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      for (const key of ['particles', 'backgroundEnabled', 'customBackground', 'colorOnTop']) {
        if (typeof saved[key] === 'boolean') options[key] = saved[key];
      }
      if (/^#[0-9a-f]{6}$/i.test(saved.color)) options.color = saved.color;
      for (const key of ['colorOpacity', 'imageOpacity']) {
        if (Number.isFinite(saved[key])) options[key] = Math.max(0, Math.min(100, saved[key]));
      }
      if (BLEND_MODES.some(mode => mode.value === saved.blendMode)) options.blendMode = saved.blendMode;
      if (typeof saved.backgroundName === 'string') options.backgroundName = saved.backgroundName;
    }
  } catch { error.value = '外观设置读取失败，已使用默认外观。'; }

  const imageUrl = computed(() => options.customBackground && customImage.value ? customImage.value : wallpaperDataUrl);
  const backgroundStyle = computed(() => ({ backgroundColor: options.backgroundEnabled ? '#0c0c14' : options.color }));
  const imageStyle = computed(() => ({
    backgroundImage: `url("${imageUrl.value}")`, opacity: options.imageOpacity / 100,
    zIndex: options.colorOnTop ? 1 : 2,
    mixBlendMode: options.colorOnTop ? 'normal' : options.blendMode
  }));
  const colorStyle = computed(() => ({
    backgroundColor: options.color, opacity: options.colorOpacity / 100,
    zIndex: options.colorOnTop ? 2 : 1,
    mixBlendMode: options.colorOnTop ? options.blendMode : 'normal'
  }));

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(options)); error.value = ''; }
    catch { error.value = '外观设置保存失败，当前预览仍然生效，但重启后可能丢失。'; }
  }
  function update(key, value) {
    if (['particles', 'backgroundEnabled', 'colorOnTop'].includes(key) && typeof value === 'boolean') options[key] = value;
    else if (key === 'color' && /^#[0-9a-f]{6}$/i.test(value)) options.color = value;
    else if (['colorOpacity', 'imageOpacity'].includes(key) && Number.isFinite(Number(value))) options[key] = Math.max(0, Math.min(100, Number(value)));
    else if (key === 'blendMode' && BLEND_MODES.some(mode => mode.value === value)) options.blendMode = value;
    else return;
    save();
  }
  function initialize() {
    if (initialized) return initialized;
    initialized = (async () => {
      if (!options.customBackground) return;
      try {
        const result = await window.cardForgeAPI.loadBackgroundImage();
        if (!result?.success) throw new Error(result?.error || '图片读取失败');
        customImage.value = result.dataUrl;
      } catch (e) { error.value = '自定义背景加载失败，暂用默认图片：' + e.message; }
    })();
    return initialized;
  }
  async function chooseBackground() {
    if (busy.value) return;
    busy.value = true;
    try {
      await initialize();
      const result = await window.cardForgeAPI.selectBackgroundImage();
      if (result?.canceled) return;
      if (!result?.success) throw new Error(result?.error || '图片导入失败');
      customImage.value = result.dataUrl;
      options.customBackground = true;
      options.backgroundEnabled = true;
      options.backgroundName = result.name;
      save();
    } catch (e) { error.value = '更换背景失败：' + e.message; }
    finally { busy.value = false; }
  }
  function resetBackground() {
    options.customBackground = false;
    options.backgroundName = '';
    options.backgroundEnabled = true;
    save();
  }
  function resetLayers() {
    const initial = defaults();
    for (const key of ['color', 'colorOpacity', 'imageOpacity', 'colorOnTop', 'blendMode']) options[key] = initial[key];
    save();
  }
  return { options, busy, error, imageUrl, backgroundStyle, imageStyle, colorStyle,
    initialize, update, chooseBackground, resetBackground, resetLayers };
});
