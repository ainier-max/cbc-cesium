<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="polygonGatherFun"
    >
      面采集
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

const polygonGatherFun = () => {
  ffCesium.polygonGather(polygonGatherFunCallback, {
    color: "#FBFF65",
    alpha: 0.5,
  });
};

const polygonGatherFunCallback = (gatherPolygon) => {
  console.log("坐标采集成功,其对象为：", gatherPolygon);
  console.log("坐标采集成功,其坐标为：", gatherPolygon.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
