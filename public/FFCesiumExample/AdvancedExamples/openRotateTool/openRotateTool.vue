<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="openRotateTool"
    >
      打开旋转工具
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
// 123
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  console.log("ffCesium", ffCesium);
});

const openRotateTool = () => {
  let lngLatHeightArr = [
    [118.1022, 24.4959, 900],
    [118.2022, 24.4959, 900],
    [118.2022, 24.4259, 900],
  ];
  ffCesium.rotateTool.openRotateTool(lngLatHeightArr);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
