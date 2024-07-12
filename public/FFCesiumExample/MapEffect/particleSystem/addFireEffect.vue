<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addFireEffectFun"
    >
      叠加火焰效果
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeFireEffectFun"
    >
      移除火焰效果
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
  let option = {
    lng: 118.1022,
    lat: 24.4959,
    eyeHeight: 1000,
    pitchRadiu: -50,
    time: 1,
  };
  ffCesium.flyTo(option);
});
let fireEffectObj = null;
const addFireEffectFun = () => {
  let lngLatHeight = [118.1022, 24.4959, 0];
  let option = {
    url: "../images/FFCesium/MapEffect/particleSystem/fire.png",
    endScale: 4.0,
  };
  fireEffectObj = ffCesium.addFireEffect(lngLatHeight, option);
};

const removeFireEffectFun = () => {
  ffCesium.removeFireEffect(fireEffectObj);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
