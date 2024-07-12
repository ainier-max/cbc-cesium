<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="openMeasureAreaSpace"
    >
      开启测量面（右击关闭）
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="clearMeasureAreaSpace"
    >
      移除测量面的所有实体
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
const openMeasureAreaSpace = () => {
  ffCesium.measureAreaSpace(callback);
};
const callback = (value) => {
  console.log("采集到的面积数据--value(㎡)", value);
};

const clearMeasureAreaSpace = () => {
  ffCesium.clearMeasureAreaSpaceEntitys();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
