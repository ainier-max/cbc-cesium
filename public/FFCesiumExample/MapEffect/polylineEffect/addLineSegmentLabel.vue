<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addLineSegmentLabelFun"
    >
      叠加线段文字
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeLineSegmentLabelFun"
    >
      移除线段文字
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let lnglatArr1 = [
  [118.10755933952464, 24.499075709713203, 10],
  [118.1359583350454, 24.43919395273641, 10],
  [118.1615, 24.4059, 10],
];
let lnglatArr2 = [
  [118.11313074521414, 24.471597067886925, 12],
  [118.11457697629798, 24.46924400732972, 12],
];
onMounted(() => {
  //初始化
  ffCesium = new FFCesium("cesiumContainer");
  // 关闭抗锯齿
  ffCesium.viewer.scene.fxaa = true;
  ffCesium.viewer.scene.postProcessStages.fxaa.enabled = true;
  let option = {
    width: 5,
    color: "#58D4DE",
    alpha: 1,
  };
  ffCesium.addPolylinePrimitive(lnglatArr1, option);
  ffCesium.addPolylinePrimitive(lnglatArr2, option);
});
let labelArr1 = [];
let labelArr2 = [];
const addLineSegmentLabelFun = () => {
  let option1 = {
    label: "胡莹河",
    styleStr:
      "cursor:pointer;color: white;padding: 2px;border-radius: 5px;font-weight: bold;",
    offset: { top: 0, left: -15 },
  };
  labelArr1 = ffCesium.addLineSegmentLabel(lnglatArr1, option1);

  let option2 = {
    label: "胡莹河",
    styleStr:
      "cursor:pointer;color: white;background-color: #4CAF50;padding: 2px;border-radius: 5px;",
    offset: { top: 0, left: 0 },
  };
  labelArr2 = ffCesium.addLineSegmentLabel(lnglatArr2, option2);
};
const removeLineSegmentLabelFun = () => {
  labelArr1.forEach((item) => {
    ffCesium.removeHtml(item);
  });
  labelArr2.forEach((item) => {
    ffCesium.removeHtml(item);
  });
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
