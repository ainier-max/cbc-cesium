<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="rectangleEditFun"
    >
      矩形进入修改
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let rectangleObj = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
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
});

const rectangleEditFun = () => {
  ffCesium.rectangleEdit(rectangleObj, rectangleEditFunCallback);
};

const rectangleEditFunCallback = (rectangle) => {
  console.log("坐标修改成功,其对象为：", rectangle);
  console.log("坐标修改成功,其坐标为：", rectangle.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
