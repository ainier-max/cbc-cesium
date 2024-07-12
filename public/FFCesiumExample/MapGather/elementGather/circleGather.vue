<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="circleGatherFun"
    >
      圆采集
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

const circleGatherFun = () => {
  ffCesium.circleGather(circleGatherFunCallback, {
    color: "#FBFF65",
    alpha: 0.5,
  });
};

const circleGatherFunCallback = (gatherCircle) => {
  console.log("采集成功,其对象为：", gatherCircle);
  console.log("采集成功,其坐标为：", gatherCircle.FFCenterPoint);
  console.log("采集成功,其半径为：", gatherCircle.FFRadius);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
