<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="polygonEditFun"
    >
      面进入修改
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let polygonObj = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  let lnglatArr = [
    [118.1022, 24.4959],
    [118.1048, 24.4639],
    [118.1371, 24.4491],
    [118.1358, 24.4878],
  ];
  let option = {
    color: "#FFFF00",
    alpha: 0.5,
  };
  polygonObj = ffCesium.addPolygonEntity(lnglatArr, option);
  console.log("polygonObj", polygonObj);
});

const polygonEditFun = () => {
  ffCesium.polygonEdit(polygonObj, polygonEditFunCallback);
};

const polygonEditFunCallback = (polygon) => {
  console.log("坐标采集成功,其对象为：", polygon);
  console.log("坐标采集成功,其坐标为：", polygon.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
