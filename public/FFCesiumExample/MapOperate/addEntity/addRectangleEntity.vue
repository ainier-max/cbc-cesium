<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addRectangleEntityFun"
    >
      叠加矩形实体
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeRectangleEntityFun"
    >
      移除矩形实体
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
let rectangleObj = null;
const addRectangleEntityFun = () => {
  let coordinates = {};
  coordinates.west = 118.0850887298584;
  coordinates.south = 24.439001083374023;
  coordinates.east = 118.1044813816513;
  coordinates.north = 24.451483144361173;
  let option = {
    color: "#FFFF00",
    alpha: 0.5,
  };
  rectangleObj = ffCesium.addRectangleEntity(coordinates, option);
  console.log("rectangleObj", rectangleObj);
};
const removeRectangleEntityFun = () => {
  ffCesium.removeFFEntity(rectangleObj);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
