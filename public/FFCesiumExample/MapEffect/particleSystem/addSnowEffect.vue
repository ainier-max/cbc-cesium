<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addSnowEffectFun"
    >
      叠加雪效果
    </button>
    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeSnowEffectFun"
    >
      移除雪效果
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

let snowEffect = null;
const addSnowEffectFun = () => {
  let option = {
    snowSpeed: 90, //值越小，速度越大
  };
  snowEffect = ffCesium.addSnowEffect(option);
};

const removeSnowEffectFun = () => {
  ffCesium.removeSnowEffect(snowEffect);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
