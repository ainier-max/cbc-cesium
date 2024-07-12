<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="openCompass"
    >
      打开指南针
    </button>
    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="closeCompass"
    >
      关闭指南针
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
  ffCesium.openCompassTool({ right: "50px", top: "15%" });
};
const closeCompass = () => {
  ffCesium.closeCompassTool();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
