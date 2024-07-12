<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="openMeasureLineLength"
    >
      开启测量距离（右击关闭）
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="clearMeasureLineLength"
    >
      移除测量距离的所有实体
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
const openMeasureLineLength = () => {
  ffCesium.measureLineLength(callback);
};
const callback = (value) => {
  console.log("采集到的长度数据--value(m)", value);
};
const clearMeasureLineLength = () => {
  ffCesium.clearMeasureLineLengthEntitys();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
