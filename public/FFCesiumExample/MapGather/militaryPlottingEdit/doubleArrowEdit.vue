<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="doubleArrowEditFun"
    >
      钳击箭头进入修改
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="closeDoubleArrowEditFun"
    >
      钳击箭头结束修改
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let entityObj = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  let lnglatArr = [
    [118.07988944864749, 24.44457904467563],
    [118.12025512640827, 24.446000367985732],
    [118.10698942872433, 24.478852060627798],
    [118.09183246849693, 24.509047253585642],
    [118.09735165387987, 24.434729565646364],
  ];
  let option = {
    color: "#FFFF00",
    alpha: 0.5,
  };
  entityObj = ffCesium.addDoubleArrowEntity(lnglatArr, option);
  console.log("entityObj", entityObj);
});

const doubleArrowEditFun = () => {
  ffCesium.doubleArrowEdit(entityObj, doubleArrowEditFunCallback);
};

const doubleArrowEditFunCallback = (entity) => {
  console.log("坐标修改成功,其对象为：", entity);
  console.log("修改成功,其关键坐标为：", entity.FFPlotKeyPoints);
  console.log("坐标修改成功,其坐标为：", entity.FFCoordinates);
};

const closeDoubleArrowEditFun = () => {
  ffCesium.closeDoubleArrowEdit(entityObj);
  console.log("修改成功,其关键坐标为：", entityObj.FFPlotKeyPoints);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
