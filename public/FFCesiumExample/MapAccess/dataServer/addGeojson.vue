<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="readGeojsonFun">
      GeoJson数据加载
    </button>

    <button style="position: absolute; left: 100px; top: 150px; z-index: 999" @click="removeGeojsonFun">
      移除GeoJson数据
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";
let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  ffCesium.mapActionClass.setView({
    lng: 118.28164379,
    lat: 37.1808099,
    height: 85000,
    pitchRadiu: -50,
  });
});

let dataSource = null;
const readGeojsonFun = () => {
  let promise = ffCesium.dataServerClass.readGeojson("./data/geojson/zhanhua.geojson");
  promise.then(function (data) {
    let option = {
      stroke: "#0194FF",
      strokeWidth: 2,
      fill: "#000000",
      fillAlpha: 0.5,
    };
    dataSource = ffCesium.dataServerClass.addGeojson(data, option);
  });
};

const removeGeojsonFun = () => {
  ffCesium.dataServerClass.removeDataSource(dataSource);
  dataSource = null;
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
