<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="openCompass"
    >
      打开比例尺
    </button>
    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="closeCompass"
    >
      关闭比例尺
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
});
const openCompass = () => {
  ffCesium.openScaleTool({ left: "50px", bottom: "15%" });
};
const closeCompass = () => {
  ffCesium.closeScaleTool();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
