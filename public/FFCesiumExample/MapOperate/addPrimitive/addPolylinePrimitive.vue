<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addPolylinePrimitiveFun"
    >
      叠加线图元
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removePolylinePrimitiveFun"
    >
      移除线图元
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
let polylinePrimitive = null;
const addPolylinePrimitiveFun = () => {
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
  polylinePrimitive = ffCesium.addPolylinePrimitive(lnglatArr, option);
};
const removePolylinePrimitiveFun = () => {
  ffCesium.removeFFPrimitive(polylinePrimitive);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
