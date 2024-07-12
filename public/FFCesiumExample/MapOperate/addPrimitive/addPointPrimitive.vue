<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addPointPrimitiveFun"
    >
      叠加点图元
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removePointPrimitiveFun"
    >
      移除点图元
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
let pointPrimitive = null;
const addPointPrimitiveFun = () => {
  let lngLatHeight = [118.1022, 24.4959, 100];
  let option = {
    pixelSize: 10,
    color: "#FFFF00",
    alpha: 1,
    outlineWidth: 2,
    outlineColor: "#0000FF",
  };
  pointPrimitive = ffCesium.addPointPrimitive(lngLatHeight, option);
};
const removePointPrimitiveFun = () => {
  ffCesium.removeFFPrimitive(pointPrimitive);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
