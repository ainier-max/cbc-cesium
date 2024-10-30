<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="polylineGatherFun">线采集</button>

    <button style="position: absolute; left: 100px; top: 150px; z-index: 999" @click="endGatherFun">进入采集后结束采集</button>
  </div>
</template>
<script lang="ts" setup>
  import { onMounted } from "vue";
  import FFCesium from "FFCesium";

  let ffCesium = null;
  onMounted(() => {
    ffCesium = new FFCesium("cesiumContainer");
  });

  const polylineGatherFun = () => {
    ffCesium.polylineGather(polylineGatherFunCallback, {
      color: "#FBFF65",
      alpha: 1,
      width: 5,
      clampToGround: true
    });
  };

  const polylineGatherFunCallback = (gatherPolyline) => {
    console.log("坐标采集成功,其对象为：", gatherPolyline);
    console.log("坐标采集成功,其坐标为：", gatherPolyline.FFCoordinates);
  };

  const endGatherFun = () => {
    ffCesium.forceGatherEnd();
    //ffCesium.gatherHandlerDestroy();
  };
</script>
<style scoped>
  #cesiumContainer {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
