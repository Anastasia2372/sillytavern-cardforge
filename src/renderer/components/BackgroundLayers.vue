<template>
  <div class="appearance-layers" :style="appearance.backgroundStyle" aria-hidden="true">
    <template v-if="appearance.options.backgroundEnabled">
      <div class="appearance-layers__image" :style="appearance.imageStyle"></div>
      <div class="appearance-layers__color" :style="appearance.colorStyle"></div>
    </template>
  </div>
</template>

<script setup>
import { useAppearanceStore } from '../stores/appearance.js';
const appearance = useAppearanceStore();
</script>

<style scoped>
.appearance-layers { position: absolute; inset: 0; isolation: isolate; pointer-events: none; overflow: hidden; }
.appearance-layers__image, .appearance-layers__color { position: absolute; inset: 0; }
.appearance-layers__image { background-size: cover; background-position: center; background-repeat: no-repeat; }
</style>
