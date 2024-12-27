<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="getCameraEvent">开启getCameraEvent</button>
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
  const getCameraEvent = () => {
    ffCesium.getCameraEvent();
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
