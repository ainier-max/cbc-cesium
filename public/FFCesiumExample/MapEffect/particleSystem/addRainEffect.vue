<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addRainEffectFun"
    >
      叠加雨效果
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeRainEffectFun"
    >
      移除雨效果
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
let rainEffect = null;
const addRainEffectFun = () => {
  let option = {
    tiltAngle: 0.2,
    rainSize: 0.5, //值越小，雨点越大
    rainWidth: 20, //值越小，雨点间隔越大
    rainSpeed: 90, //值越小，速度越大
  };
  rainEffect = ffCesium.addRainEffect(option);
};

const removeRainEffectFun = () => {
  ffCesium.removeRainEffect(rainEffect);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
