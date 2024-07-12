<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="cartesian3ToLngLatFun"
    >
      世界坐标转经纬度坐标(F12->Console查看输出结果)
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="lngLatToCartesian3Fun"
    >
      经纬度坐标转世界坐标(F12->Console查看输出结果)
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
const cartesian3ToLngLatFun = () => {
  let cartesian3 = {
    x: -2739531.1065610424,
    y: 5133901.101058983,
    z: 2626765.040376103,
  };
  let lngLatHeight = ffCesium.cartesian3ToLngLat(cartesian3);
  console.log(
    "世界坐标：" + cartesian3.x + "," + cartesian3.y + "," + cartesian3.z
  );
  console.log("世界坐标-->经纬度");
  console.log(
    "经纬度：:" +
      lngLatHeight.lng +
      "," +
      lngLatHeight.lat +
      "," +
      lngLatHeight.height
  );
};
const lngLatToCartesian3Fun = () => {
  let lngLatHeight = {};
  lngLatHeight.lng = 118.0850887298584;
  lngLatHeight.lat = 24.439001083374023;
  lngLatHeight.height = 10000;
  let cartesian3 = ffCesium.lngLatToCartesian3(lngLatHeight);
  console.log(
    "经纬度：:" +
      lngLatHeight.lng +
      "," +
      lngLatHeight.lat +
      "," +
      lngLatHeight.height
  );
  console.log("经纬度-->世界坐标");
  console.log(
    "世界坐标：" + cartesian3.x + "," + cartesian3.y + "," + cartesian3.z
  );
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
