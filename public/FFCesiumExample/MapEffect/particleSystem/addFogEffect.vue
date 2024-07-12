<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addFogEffectFun"
    >
      叠加雾效果
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeFogEffectFun"
    >
      移除雾效果
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
let fogEffect = null;
const addFogEffectFun = () => {
  let option = {
    alpha: 0.5,
  };
  fogEffect = ffCesium.addFogEffect(option);
};

const removeFogEffectFun = () => {
  ffCesium.removeFogEffect(fogEffect);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
