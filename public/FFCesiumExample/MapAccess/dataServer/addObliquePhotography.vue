<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 50px; z-index: 999" @click="addObliquePhotographyFun">
      添加倾斜摄影
    </button>
    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="removeObliquePhotographyFun">
      移除倾斜摄影
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";
let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  console.log("ffCesium", ffCesium);
  ffCesium.dataServerClass.addTerrain("http://data.marsgis.cn/terrain");
  ffCesium.mapActionClass.setView({
    lng: 119.09490233012195,
    lat: 26.03963003753146,
    height: 3000,
    pitchRadiu: -50,
  });
});

let tileset = null;
const addObliquePhotographyFun = () => {
  let url = "http://192.168.15.228:8078/mapdata/baoli3dtile/tileset.json";
  //let url = "http://192.168.9.212/3dtiles/xysk/tileset.json";
  let option = {
    maximumMemoryUsage: 100, //不可设置太高，目标机子空闲内存值以内，防止浏览器过于卡
    maximumScreenSpaceError: 20, //用于驱动细节细化级别的最大屏幕空间错误;较高的值可提供更好的性能，但视觉质量较低。
    maximumNumberOfLoadedTiles: 1000, //最大加载瓦片个数
    shadows: false, //是否显示阴影
    skipLevelOfDetail: true,
    baseScreenSpaceError: 1024,
    skipScreenSpaceErrorFactor: 16,
    skipLevels: 1,
    immediatelyLoadDesiredLevelOfDetail: false,
    loadSiblings: false,
    cullWithChildrenBounds: true,
    dynamicScreenSpaceError: true,
    dynamicScreenSpaceErrorDensity: 0.00278,
    dynamicScreenSpaceErrorFactor: 4.0,
    dynamicScreenSpaceErrorHeightFalloff: 0.25,
  };
  let promise = ffCesium.dataServerClass.addObliquePhotography(url, option);
  promise.then((result) => {
    tileset = result;
    ffCesium.viewer.flyTo(tileset);
  });
};
const removeObliquePhotographyFun = () => {
  ffCesium.dataServerClass.removeObliquePhotography(tileset);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
