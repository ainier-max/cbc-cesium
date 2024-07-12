<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addPolylineFlowFun"
    >
      叠加流动线
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removePolylineFlowFun"
    >
      移除流动线
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
});
let polylineObj = null;
const addPolylineFlowFun = () => {
  //叠加线(长)
  let lnglatArr = [
    [118.10755933952464, 24.499075709713203, 100],
    [118.1359583350454, 24.43919395273641, 100],
  ];
  //叠加线(短)
  // let lnglatArr = [
  //   [118.11313074521414, 24.471597067886925, 1],
  //   [118.11457697629798, 24.46924400732972, 1],
  // ];

  let option = {
    width: 8,
    color: "#00FF00",
    url: "./images/FFCesium/MapEffect/polylineEffect/polylineEffect2.png",
    time: 20000,
  };
  polylineObj = ffCesium.addPolylineFlow(lnglatArr, option);
};

const removePolylineFlowFun = () => {
  ffCesium.removePolylineFlow(polylineObj);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
