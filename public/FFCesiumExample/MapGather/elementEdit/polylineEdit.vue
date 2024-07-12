<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="polylineEditFun"
    >
      线进入修改
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let polylineObj = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  let lnglatArr = [
    [118.1022, 24.4959, 0],
    [118.1048, 24.4639, 0],
    [118.1371, 24.4491, 0],
  ];
  let option = {
    width: 5,
    color: "#FFFF00",
    alpha: 1,
    clampToGround: true,
  };
  polylineObj = ffCesium.addPolylineEntity(lnglatArr, option);
  console.log("polylineObj", polylineObj);
});

const polylineEditFun = () => {
  ffCesium.polylineEdit(polylineObj, polylineEditFunCallback);
};

const polylineEditFunCallback = (polyline) => {
  console.log("修改成功,其对象为：", polyline);
  console.log("修改成功,其坐标为：", polyline.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
