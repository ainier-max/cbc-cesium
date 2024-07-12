<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addPolygonPrimitiveFun"
    >
      叠加面图元
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removePolygonPrimitiveFun"
    >
      移除面图元
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
let polygonPrimitive = null;
const addPolygonPrimitiveFun = () => {
  let lnglatArr = [
    [118.1022, 24.4959],
    [118.1048, 24.4639],
    [118.1371, 24.4491],
    [118.1358, 24.4878],
  ];
  let option = {
    color: "#FFFF00",
    alpha: 1,
  };
  polygonPrimitive = ffCesium.addPolygonPrimitive(lnglatArr, option);
};
const removePolygonPrimitiveFun = () => {
  ffCesium.removeFFPrimitive(polygonPrimitive);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
