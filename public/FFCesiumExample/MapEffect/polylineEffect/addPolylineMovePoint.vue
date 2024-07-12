<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addPolylineMovePointFun"
    >
      叠加线移动点
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removePolylineMovePointFun"
    >
      移除线移动点
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";
let ffCesium = null;

onMounted(() => {
  //初始化
  ffCesium = new FFCesium("cesiumContainer");
  //叠加线
  let lnglatArr = [
    [118.10755933952464, 24.499075709713203, 100],
    [118.09021022013071, 24.46599111683894, 100],
    [118.1359583350454, 24.43919395273641, 100],
  ];
  let option = {
    width: 5,
    color: "#58D4DE",
    alpha: 1,
  };
  ffCesium.addPolylinePrimitive(lnglatArr, option);
});
let pointEntityArray = null;
const addPolylineMovePointFun = () => {
  let movePointArr = [
    [118.10755933952464, 24.499075709713203],
    [118.09021022013071, 24.46599111683894],
    [118.1359583350454, 24.43919395273641],
  ];
  pointEntityArray = ffCesium.addPolylineMovePoint(movePointArr, {
    height: 150,
    color: "#FBFF65",
    alpha: 1,
    pixelSize: 6,
    addType: "primitive", //可选值：entity,primitive
  });
};

const removePolylineMovePointFun = () => {
  ffCesium.removePolylineMovePoint(pointEntityArray);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
