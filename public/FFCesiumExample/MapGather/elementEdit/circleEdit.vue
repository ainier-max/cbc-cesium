<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="circleEditFun"
    >
      圆进入修改
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let CircleEntity = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  let centerPoint = [118.1022, 24.4959, 0];
  let radius = 1000;
  let option = {
    color: "#FFFF00",
    alpha: 0.5,
  };
  CircleEntity = ffCesium.addCircleEntity(centerPoint, radius, option);
  console.log("CircleEntity", CircleEntity);
});

const circleEditFun = () => {
  ffCesium.circleEdit(CircleEntity, circleEditFunCallback);
};

const circleEditFunCallback = (circle) => {
  console.log("修改成功,其对象为：", circle);
  console.log("修改成功,其中心坐标为：", circle.FFCenterPoint);
  console.log("修改成功,其半径为：", circle.FFRadius);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
