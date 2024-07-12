<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="openMouseTipFun"
    >
      打开鼠标提示
    </button>
    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="updateMouseTipFun"
    >
      更新鼠标提示（你好，小明）
    </button>
    <button
      style="position: absolute; left: 100px; top: 200px; z-index: 999"
      @click="closeMouseTipFun"
    >
      关闭鼠标提示
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
const openMouseTipFun = () => {
  let option = {
    backgroundColor: "#001129",
    color: "#FFFFFF",
  };
  ffCesium.setOpenMouseTipOption(option);
  ffCesium.openMouseTip("鼠标提示内容");
};
const closeMouseTipFun = () => {
  ffCesium.closeMouseTip();
};
const updateMouseTipFun = () => {
  ffCesium.updateMouseTip("你好，小明");
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
