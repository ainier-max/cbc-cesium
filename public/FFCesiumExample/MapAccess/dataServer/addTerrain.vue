<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addTerrainFun"
    >
      叠加地形服务
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeTerrainFun"
    >
      移除地形服务
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
const addTerrainFun = () => {
  let terrainLayer = ffCesium.addTerrain("http://data.marsgis.cn/terrain");
  console.log("terrainLayer", terrainLayer);
};
const removeTerrainFun = () => {
  ffCesium.removeTerrain();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
