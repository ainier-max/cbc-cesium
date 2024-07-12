<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="rendezvousEditFun"
    >
      集结地进入修改
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="closeRendezvousEditFun"
    >
      集结地结束修改
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
    [118.07430925688072, 24.460468740336026],
    [118.08591236996156, 24.449556292373643],
    [118.07346650813432, 24.438131700916976],
  ];
  let option = {
    color: "#FFFF00",
    alpha: 0.5,
  };
  entityObj = ffCesium.addRendezvousEntity(lnglatArr, option);
  console.log("entityObj", entityObj);
});

const rendezvousEditFun = () => {
  ffCesium.rendezvousEdit(entityObj, rendezvousEditFunCallback);
};

const rendezvousEditFunCallback = (entity) => {
  console.log("坐标修改成功,其对象为：", entity);
  console.log("修改成功,其关键坐标为：", entity.FFPlotKeyPoints);
  console.log("坐标修改成功,其坐标为：", entity.FFCoordinates);
};

const closeRendezvousEditFun = () => {
  ffCesium.closeRendezvousEdit(entityObj);
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
