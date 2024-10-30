<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="rectangleGatherFun">矩形采集</button>

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

  const rectangleGatherFun = () => {
    ffCesium.rectangleGather(rectangleGatherFunCallback, {
      color: "#FBFF65",
      alpha: 0.5
    });
  };

  const rectangleGatherFunCallback = (gatherRectangle) => {
    console.log("坐标采集成功,其对象为：", gatherRectangle);
    console.log("坐标采集成功,其坐标为：", gatherRectangle.FFCoordinates);
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
