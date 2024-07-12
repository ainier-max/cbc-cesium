<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="flyToFun"
    >
      开始飞行
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
const flyToFun = () => {
  let option = {
    lng: 118,
    lat: 36.01,
    eyeHeight: 2000,
    pitchRadiu: -50,
    time: 5,
  };
  ffCesium.flyTo(option, callback);
};
const callback = () => {
  console.log("完成飞跃");
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
