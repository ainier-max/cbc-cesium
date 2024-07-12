<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addPolylineEntityFun"
    >
      叠加线实体
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removePolylineEntityFun"
    >
      移除线实体
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
let polylineEntity = null;
const addPolylineEntityFun = () => {
  let lnglatArr = [
    [118.1022, 24.4959, 0],
    [118.1048, 24.4639, 500],
    [118.1371, 24.4491, 2000],
  ];
  let option = {
    width: 5,
    color: "#FFFF00",
    alpha: 1,
  };
  polylineEntity = ffCesium.addPolylineEntity(lnglatArr, option);
};
const removePolylineEntityFun = () => {
  ffCesium.removeFFEntity(polylineEntity);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
