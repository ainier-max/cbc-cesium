<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="tailedAttackArrowEditFun"
    >
      攻击箭头进入修改
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
    [118.10578484076582, 24.54024138421846],
    [118.10024618198919, 24.52704375796104],
    [118.16813974873298, 24.505969722596483],
    [118.14386679213052, 24.452328619205502],
  ];
  let option = {
    color: "#FFFF00",
    alpha: 0.5,
  };
  entityObj = ffCesium.addTailedAttackArrow(lnglatArr, option);
  console.log("entityObj", entityObj);
});

const tailedAttackArrowEditFun = () => {
  ffCesium.tailedAttackArrowEdit(entityObj, tailedAttackArrowEditFunCallback);
};

const tailedAttackArrowEditFunCallback = (entity) => {
  console.log("坐标采集成功,其对象为：", entity);
  console.log("采集成功,其关键坐标为：", entity.FFPlotKeyPoints);
  console.log("坐标采集成功,其坐标为：", entity.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
