<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addHtmlFun"
    >
      叠加HTML
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeHtmlFun"
    >
      移除HTML
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
});
let htmlOverlay = null;
const addHtmlFun = () => {
  let param = { a: "测试" };

  let lngLatHeight = [118.1022, 24.4959, 100];
  let html = "";
  html +=
    "<div style='cursor:pointer'><img width='32px' height='32px' src='./images/FFCesium/MapOperate/addOtherElement/favicon.ico' onclick='showInfo(" +
    JSON.stringify(param) +
    ")'></img></div>";
  let option = {};
  option.offset = { top: 0, left: 0 };
  option.zIndex = 10;
  let htmlOverlay = ffCesium.addHtml(lngLatHeight, html, option);

  window["showInfo"] = (valueParam) => {
    console.log("showInfo--valueParam", valueParam);
    showInfo(valueParam);
  };
};

const showInfo = (valueParam) => {
  console.log("调用了vue的方法,传值为:", valueParam);
};

const removeHtmlFun = () => {
  ffCesium.removeHtml(htmlOverlay);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
