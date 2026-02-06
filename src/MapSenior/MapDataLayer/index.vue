<template>
  <div id="fatherDivID" class="fatherDivClass" style="
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      background-image: url('./images/背景3.png');
      background-size: cover;
      background-position: center;
    "></div>

  <div id="cesiumContainer">
    <CommonLayer v-if="isffCesium"></CommonLayer>
    <div style="position: absolute; top: 100px; left: 100px; z-index: 999">
      <el-button @click="addLayer1Test" type="primary">叠加水情监测图层</el-button><br />
      <el-button @click="addLayer2Test" style="margin-top: 10px" type="primary">叠加突然墒情图层</el-button><br />
      <el-button @click="toLocation" style="margin-top: 20px" type="primary">测试定位</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
//地图初始化
import { initMap, destroyMap } from "./js/initMap.js";
import { OverviewStore } from "./store/overview.ts";
const OverviewObj = OverviewStore();
const { overviewData } = storeToRefs(OverviewObj);

import CommonLayer from "./components/CommonLayer/index.vue";

const isffCesium = ref(false);
let ffCesium = null;

onMounted(() => {
  nextTick(async () => {
    ffCesium = await initMap();
    ffCesium.mapActionClass.setView({
      lng: 130.15461155821515,
      lat: 46.03925403799818,
      height: 125000,
      pitchRadiu: -52
    });
    OverviewObj.init(ffCesium);
    isffCesium.value = true;

    ffCesium.getXyEvent();
  });
});

const addLayer1Test = () => {
  OverviewObj.removeAllLayer();
  OverviewObj.addOverviewDataLayer("regimenLayer");
};

const toLocation = () => {
  console.log("toLocation--overviewData", overviewData);
  let lnglat = overviewData.value["regimenLayer"].data[0].lnglat;
  console.log("toLocation--lnglat", lnglat);
  OverviewObj.toLocation(lnglat);
};
const addLayer2Test = () => {
  OverviewObj.removeAllLayer();
  OverviewObj.addOverviewDataLayer("soilContentLayer");
};
</script>
<style scoped>
#cesiumContainer {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.fatherDivClass {
  position: absolute;
  left: 0px;
  top: 0px;
  z-index: 1;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
