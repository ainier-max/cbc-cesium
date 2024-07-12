<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="pointGatherFun"
    >
      点采集
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

const pointGatherFun = () => {
  ffCesium.pointGather(pointGatherFunCallback, {
    color: "#FBFF65",
    alpha: 1,
    pixelSize: 10,
  });
};

const pointGatherFunCallback = (gatherPoint) => {
  console.log("采集成功,其对象为：", gatherPoint);
  console.log("采集成功,其坐标为：", gatherPoint.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
