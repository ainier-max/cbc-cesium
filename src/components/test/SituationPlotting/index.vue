<template>
  <div id="cesiumContainer" style="overflow-y: hidden"></div>

  <SituationPlotting
    v-if="showFlag"
    :ffCesium="ffCesium"
    :plotDataArray="plotDataArray"
    style="
      position: absolute;
      top: 80px;
      right: 40px;
      width: 250px;
      background-color: white;
      z-index: 999;
    "
  ></SituationPlotting>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
// import FFCesium from "../../../../public/lastVersion/FFCesium.confuse.min.js";
import FFCesium from "@/FFCesium/core/index.js";
import SituationPlotting from "@/FFCesiumPlug/SituationPlotting/index.vue";
let ffCesium = null;
const showFlag = ref(false);
const plotDataArray = ref([
  {
    id: "1", //唯一ID,后端处理
    jqid: "xxxxx",
    username: "xxx",
    createTime: "",
    plotObj: {
      FFType: "FFPolygonEntity",
      alpha: 0.5,
      color: "#FBFF65",
      id: "bf4e1432-a604-4201-a453-c190b795d361",
      text: "测试面",
      area: 350,
      length: 35,
      FFCoordinates: [
        [118.1022, 24.4959],
        [118.1048, 24.4639],
        [118.1371, 24.4491],
        [118.1358, 24.4878],
      ],
    },
  },
]);

onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  //取消双击选中跟踪对象
  var handler = new ffCesium.Cesium.ScreenSpaceEventHandler(
    ffCesium.viewer.scene.canvas
  );
  handler.setInputAction(function (event) {
    ffCesium.viewer.trackedEntity = undefined;
  }, ffCesium.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  showFlag.value = true;
});
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}
</style>
