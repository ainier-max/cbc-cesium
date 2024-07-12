<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="setViewFun"
    >
      定位
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";
let ffCesium = null;
onMounted(() => {
  //初始化
  ffCesium = new FFCesium("cesiumContainer");
});
const setViewFun = () => {
  let option = {
    lng: 118,
    lat: 36,
    height: 2000,
    pitchRadiu: -50,
  };
  ffCesium.setView(option);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
