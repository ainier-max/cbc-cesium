<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="polygonGatherFun"
    >
      面采集
    </button>

    <div
      style="
        position: absolute;
        left: 100px;
        top: 150px;
        z-index: 999;
        background-color: white;
        color: black;
        width: 200px;
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
    color: "#FFFF00",
    alpha: 0.5,
  };
  polygonPrimitive = ffCesium.addPolygonPrimitive(polygonArr, option);
};

const polygonGatherFun = () => {
  ffCesium.polygonGather(polygonGatherFunCallback, {
    color: "#FBFF65",
    alpha: 0.5,
  });
  document.getElementById("infoDiv").innerHTML = "";
};

const polygonGatherFunCallback = (gatherPolygon) => {
  console.log("坐标采集成功,其对象为：", gatherPolygon);
  console.log("坐标采集成功,其坐标为：", gatherPolygon.FFCoordinates);
  let gatherPolygonArr = [];
  gatherPolygon.FFCoordinates.forEach((element) => {
    gatherPolygonArr.push([element[0], element[1]]);
  });
  //注意polygonArr多了个[]
  let flag = ffCesium.judgePolygonAndPolygon([gatherPolygonArr], [polygonArr]);
  if (flag == true) {
    document.getElementById("infoDiv").innerHTML = "采集面在面里面或者交叉";
  } else {
    document.getElementById("infoDiv").innerHTML = "采集面完全在面外面";
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
