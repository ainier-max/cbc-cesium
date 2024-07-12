<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="pointGatherFun"
    >
      采集点
    </button>

    <div
      style="
        position: absolute;
        left: 100px;
        top: 150px;
        z-index: 999;
        background-color: white;
        color: black;
        width: 100px;
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

//采集点
const pointGatherFun = () => {
  ffCesium.pointGather(pointGatherFunCallback, {
    color: "#FBFF65",
    alpha: 1,
    pixelSize: 10,
  });
  document.getElementById("infoDiv").innerHTML = "";
};
const pointGatherFunCallback = (gatherPoint) => {
  console.log("采集成功,其对象为：", gatherPoint);
  console.log("采集成功,其坐标为：", gatherPoint.FFCoordinates);
  let pointArr = [gatherPoint.FFCoordinates[0], gatherPoint.FFCoordinates[1]];
  //注意polygonArr多了个[]
  let flag = ffCesium.judgePointAndPolygon(pointArr, [polygonArr]);
  if (flag == true) {
    document.getElementById("infoDiv").innerHTML = "点在面里面";
  } else {
    document.getElementById("infoDiv").innerHTML = "点在面外面";
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
