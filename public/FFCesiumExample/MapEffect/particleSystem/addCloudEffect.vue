<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addCloudEffectFun"
    >
      叠加单朵云效果(东北方向运动)
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeCloudEffectFun"
    >
      移除所有云效果
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
let cloudEffect = null;
let timer = null;
const addCloudEffectFun = () => {
  let option = {
    lng: 118.1265,
    lat: 24.4695,
    height: 3000,
    color: "#FFFFFF",
    scaleX: 15000,
    scaleY: 5000,
    slice: 0.64,
    maximumSizeX: 50,
    maximumSizeY: 22,
    maximumSizeZ: 21,
  };
  cloudEffect = ffCesium.addCloudEffect(option);
  console.log("cloudEffect", cloudEffect);
  let xTemp = 0;
  let yTemp = 0;
  timer = setInterval(function () {
    xTemp = xTemp + 0.0001;
    yTemp = yTemp + 0.0001;
    cloudEffect.position = ffCesium.Cesium.Cartesian3.fromDegrees(
      option.lng + xTemp,
      option.lat + yTemp,
      option.height
    );
  }, 10);
};

const removeCloudEffectFun = () => {
  ffCesium.ffCesiumCloudCollection.removeAll();
  window.clearInterval(timer);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
