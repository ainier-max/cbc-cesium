<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addCircleEntityFun"
    >
      叠加圆实体
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeCircleEntityFun"
    >
      移除圆实体
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
let CircleEntity = null;
const addCircleEntityFun = () => {
  let centerPoint = [118.1022, 24.4959, 0];
  let radius = 1000;
  let option = {
    color: "#FFFF00",
    alpha: 0.5,
  };
  CircleEntity = ffCesium.addCircleEntity(centerPoint, radius, option);
};
const removeCircleEntityFun = () => {
  ffCesium.removeFFEntity(CircleEntity);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
