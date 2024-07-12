<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="straightArrowEditFun"
    >
      直线箭头进入修改
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="closeStraightArrowEditFun"
    >
      直线箭头结束修改
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
    [118.04859386258862, 24.544353909153415],
    [118.11092131451086, 24.507674765137608],
  ];
  let option = {
    color: "#FFFF00",
    alpha: 0.5,
  };
  entityObj = ffCesium.addStraightArrowEntity(lnglatArr, option);
  console.log("entityObj", entityObj);
});

const straightArrowEditFun = () => {
  ffCesium.straightArrowEdit(entityObj, straightArrowEditFunCallback);
};

const straightArrowEditFunCallback = (entity) => {
  console.log("坐标修改成功,其对象为：", entity);
  console.log("修改成功,其关键坐标为：", entity.FFPlotKeyPoints);
  console.log("坐标修改成功,其坐标为：", entity.FFCoordinates);
};

const closeStraightArrowEditFun = () => {
  ffCesium.closeStraightArrowEdit(entityObj);
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
