<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="openMapInfoFun"
    >
      打开地图信息
    </button>
    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="closeMapInfoFun"
    >
      关闭地图信息
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
const openMapInfoFun = () => {
  ffCesium.openMapInfo({ left: "50px", bottom: "5%" });
};
const closeMapInfoFun = () => {
  ffCesium.closeMapInfo();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
