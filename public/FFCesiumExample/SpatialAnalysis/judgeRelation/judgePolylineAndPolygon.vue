<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="polylineGatherFun"
    >
      线采集
    </button>

    <div
      style="
        position: absolute;
        left: 100px;
        top: 150px;
        z-index: 999;
        background-color: white;
        color: black;
        width: 150px;
        height: 30px;
        padding: 10px;
      "
      id="infoDiv"
    ></div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  addPolygonPrimitiveFun();
});

//叠加面
let polygonPrimitive = null;
let polygonArr = [
  [118.1022, 24.4959],
  [118.1048, 24.4639],
  [118.1371, 24.4491],
  [118.1358, 24.4878],
];
const addPolygonPrimitiveFun = () => {
  let option = {
    width: 5,
    color: "#FFFF00",
    alpha: 0.5,
  };
  polygonPrimitive = ffCesium.addPolygonPrimitive(polygonArr, option);
};

//采集线
const polylineGatherFun = () => {
  ffCesium.polylineGather(polylineGatherFunCallback, {
    color: "#FBFF65",
    alpha: 1,
    width: 5,
  });
  document.getElementById("infoDiv").innerHTML = "";
};

const polylineGatherFunCallback = (gatherPolyline) => {
  console.log("坐标采集成功,其坐标为：", gatherPolyline.FFCoordinates);
  let polylineArr = [];
  gatherPolyline.FFCoordinates.forEach((element) => {
    polylineArr.push([element[0], element[1]]);
  });
  //注意polygonArr多了个[]
  let flag = ffCesium.judgePolylineAndPolygon(polylineArr, [polygonArr]);
  if (flag == true) {
    document.getElementById("infoDiv").innerHTML = "线在面里面或者交叉";
  } else {
    document.getElementById("infoDiv").innerHTML = "线完全在面外面";
  }
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
