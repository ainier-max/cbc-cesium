<template>
  <div id="cesiumContainer"></div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "../../../public/lastVersion/FFCesium.confuse.min.js";
onMounted(() => {
  const ffCesium = new FFCesium("cesiumContainer");
  console.log("ffCesium123", ffCesium);
});
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
}
</style>
