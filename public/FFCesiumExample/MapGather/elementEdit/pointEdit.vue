<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="pointEditFun"
    >
      点进入修改
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let pointObj = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  let lnglat = [118.1022, 24.4959, 100];
  let option = {
    pixelSize: 10,
    color: "#FFFF00",
    alpha: 1,
    outlineWidth: 2,
    outlineColor: "#0000FF",
  };
  pointObj = ffCesium.addPointEntity(lnglat, option);
  console.log("pointObj", pointObj);
});

const pointEditFun = () => {
  ffCesium.pointEdit(pointObj, pointEditFunCallback);
};

const pointEditFunCallback = (point) => {
  console.log("修改成功,其坐标为：", point);
  console.log("修改成功,其坐标为：", point.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
