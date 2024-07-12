<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addGltfPrimitiveFun"
    >
      叠加gltf模型
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeGltfPrimitiveFun"
    >
      移除gltf模型
    </button>

    <button
      style="position: absolute; left: 100px; top: 200px; z-index: 999"
      @click="addGlbPrimitiveFun"
    >
      叠加glb模型
    </button>

    <button
      style="position: absolute; left: 100px; top: 250px; z-index: 999"
      @click="removeGlbPrimitiveFun"
    >
      移除glb模型
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
let gltfPrimitive = null;
const addGltfPrimitiveFun = () => {
  let lngLatHeight = [118.1022, 24.4959, 0];
  let option = {
    url: "./model/DracoCompressed/CesiumMilkTruck.gltf",
    headingAngle: 90, //航向
    pitchAngle: 0, //倾斜角度
    rollAngle: 0, //旋转
    minimumPixelSize: 128,
    maximumScale: 100,
  };
  let promise = ffCesium.addGltfPrimitive(lngLatHeight, option);
  promise.then((result) => {
    gltfPrimitive = result;
  });
};
const removeGltfPrimitiveFun = () => {
  ffCesium.removeFFPrimitive(gltfPrimitive);
};

let glbPrimitive = null;
const addGlbPrimitiveFun = () => {
  let lngLatHeight = [118.1522, 24.4959, 2000];
  let option = {
    url: "./model/CesiumAir/Cesium_Air.glb",
    headingAngle: 90,
    pitchAngle: 90,
    rollAngle: 90,
    minimumPixelSize: 128,
    maximumScale: 128,
  };
  let promise = ffCesium.addGltfPrimitive(lngLatHeight, option);
  promise.then((result) => {
    glbPrimitive = result;
  });
};
const removeGlbPrimitiveFun = () => {
  ffCesium.removeFFPrimitive(glbPrimitive);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
