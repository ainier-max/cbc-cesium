<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="tailedAttackArrowGatherFun">攻击箭头采集</button>

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

  const tailedAttackArrowGatherFun = () => {
    ffCesium.tailedAttackArrowGather(stailedAttackArrowGatherFunCallback, {
      color: "#FBFF65",
      alpha: 0.5
    });
  };

  const stailedAttackArrowGatherFunCallback = (gatherObj) => {
    console.log("采集成功,其对象为：", gatherObj);
    console.log("采集成功,其关键坐标为：", gatherObj.FFPlotKeyPoints);
    console.log("采集成功,其坐标为：", gatherObj.FFCoordinates);
  };

  const endGatherFun = () => {
    ffCesium.forceMilitaryGatherEnd();
  };
</script>
<style scoped>
  #cesiumContainer {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
