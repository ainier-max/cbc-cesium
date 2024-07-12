<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="doubleArrowGatherFun"
    >
      钳击箭头采集
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

const doubleArrowGatherFun = () => {
  ffCesium.doubleArrowGather(doubleArrowGatherFunCallback, {
    color: "#FBFF65",
    alpha: 0.5,
  });
};

const doubleArrowGatherFunCallback = (gatherObj) => {
  console.log("采集成功,其对象为：", gatherObj);
  console.log("采集成功,其关键坐标为：", gatherObj.FFPlotKeyPoints);
  console.log("采集成功,其坐标为：", gatherObj.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
