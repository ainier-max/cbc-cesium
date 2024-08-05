<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addGroundLabelFun"
    >
      叠加贴地文字
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeGroundLabelFun"
    >
      移除贴地文字
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
});
let lableObj = null;
const addGroundLabelFun = () => {
  let lngLatHeight = [118.1022, 24.4959, 1];
  let option = {};
  option.offset = { top: 0, left: 0 };
  option.zIndex = 10;
  option.text = "河流名称";
  option.color = "#FFFF00";
  lableObj = ffCesium.addGroundLabel(lngLatHeight, option);
};

const removeGroundLabelFun = () => {
  ffCesium.removeGroundLabel(lableObj);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
