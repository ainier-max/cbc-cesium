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
import turf from "turf";

let ffCesium = null;
onMounted(() => {
  //初始化
  ffCesium = new FFCesium("cesiumContainer");
  // 关闭抗锯齿
  ffCesium.viewer.scene.fxaa = true;
  ffCesium.viewer.scene.postProcessStages.fxaa.enabled = true;
  addPolylinePrimitiveFun();
});

let polylinePrimitive = null;
const addPolylinePrimitiveFun = () => {
  let lnglatArr = [
    [118.10755933952464, 24.499075709713203, 10],
    [118.1359583350454, 24.43919395273641, 10],
    [118.1615, 24.4459, 10],
    [118.1615, 24.4959, 10],
  ];
  let option = {
    width: 5,
    color: "#58D4DE",
    alpha: 1,
  };
  polylinePrimitive = ffCesium.addPolylinePrimitive(lnglatArr, option);

  //叠加线(短)
  let lnglatArr2 = [
    [118.11313074521414, 24.471597067886925, 10],
    [118.11457697629798, 24.46924400732972, 10],
  ];

  ffCesium.addPolylinePrimitive(lnglatArr2, option);

  //叠加线(短)
  let lnglatArr3 = [
    [118.034, 24.5794, 10],
    [118.0274, 24.5132, 10],
    [118.0623, 24.4833, 10],
  ];

  ffCesium.addPolylinePrimitive(lnglatArr3, option);
};

let polygonArr = [];

const addPolylineFlowFun = () => {
  //叠加线(长)
  let lnglatArr1 = [
    [118.10755933952464, 24.499075709713203, 20],
    [118.1359583350454, 24.43919395273641, 20],
    [118.1615, 24.4459, 20],
    [118.1615, 24.4959, 20],
  ];

  let option = {
    width: 5,
    //color: "#FFFF00",
    //color: "#000000",
    color: "#0000FF",
    //color: "#FFA500",
    url: "./images/FFCesium/MapEffect/polylineEffect/polylineEffect8.png",
    time: getTime(lnglatArr1, 5000),
  };
  let polylineObj1 = ffCesium.addPolylineFlow(lnglatArr1, option);
  polygonArr.push(polylineObj1);

  //叠加线(短)
  let lnglatArr2 = [
    [118.11313074521414, 24.471597067886925, 12],
    [118.11457697629798, 24.46924400732972, 12],
  ];

  let option2 = {
    width: 5,
    color: "#FF0000",
    url: "./images/FFCesium/MapEffect/polylineEffect/polylineEffect6.png",
    time: getTime(lnglatArr2, 500),
  };
  let polylineObj2 = ffCesium.addPolylineFlow(lnglatArr2, option2);
  polygonArr.push(polylineObj2);

  let lnglatArr3 = [
    [118.034, 24.5794, 20],
    [118.0274, 24.5132, 20],
    [118.0623, 24.4833, 20],
  ];
  let option3 = {
    width: 5,
    color: "#FFFF00",
    url: "./images/FFCesium/MapEffect/polylineEffect/polylineEffect8.png",
    time: getTime(lnglatArr3, 5000),
  };
  let polylineObj3 = ffCesium.addPolylineFlow(lnglatArr3, option3);
  polygonArr.push(polylineObj3);
};

//speed  m/s
const getTime = (lnglatArr1, speed) => {
  let lengthLngLatArr1 = [];
  lnglatArr1.forEach((item) => {
    lengthLngLatArr1.push([item[0], item[1]]);
  });
  var line1 = turf.lineString(lengthLngLatArr1);
  var length1 = turf.length(line1, { units: "meters" });
  let time1 = (length1 / speed) * 1000;
  console.log("time1", time1);
  //time1 = 3000;
  return time1;
};

const removePolylineFlowFun = () => {
  polygonArr.forEach((item) => {
    ffCesium.removePolylineFlow(item);
  });
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
