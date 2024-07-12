<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="readKmlFun"
    >
      KML数据加载
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeKmlFun"
    >
      移除KML数据
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";
let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  ffCesium.setView({
    lng: 118.28164379,
    lat: 37.1808099,
    height: 10000000,
    pitchRadiu: -90,
  });
});

let dataSource = null;
const readKmlFun = () => {
  let promise = ffCesium.readKml("./data/kml/facilities.kml");
  promise.then(function (data) {
    dataSource = ffCesium.addKml(data);
  });
};

const removeKmlFun = () => {
  ffCesium.removeDataSource(dataSource);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
