<template>
    <div id="cesiumContainer">
      <button
        style="position: absolute; left: 100px; top: 100px; z-index: 999"
        @click="flyToByBoundingSphereFun"
      >
        定位
      </button>
    </div>
  </template>
  <script lang="ts" setup>
  import { onMounted } from "vue";
  import FFCesium from "FFCesium";
  let ffCesium = null;
  let lnglatArr=[
    [118.09867478145213, 24.492078791812876],
    [118.08889587111446, 24.475696516252306],
    [118.1039008897915, 24.47147676957518],
    [118.10601362374692, 24.484743381913322]
  ]
  onMounted(() => {
    //初始化
    ffCesium = new FFCesium("cesiumContainer");
    let option = {
        color: "#FFFF00",
        alpha: 0.5,
    };
    let polygonObj = ffCesium.addPolygonEntity(lnglatArr, option);
    console.log("polygonObj", polygonObj);
});
  const flyToByBoundingSphereFun = () => {
    let option={
        duration: 2, // 动画持续时间
        offset: new ffCesium.Cesium.HeadingPitchRange(
            ffCesium.Cesium.Math.toRadians(0), // 朝向
            ffCesium.Cesium.Math.toRadians(-50), // 俯仰角（从上往下看）
            0 // 距离（设置为 0，Cesium 会自动调整距离以确保整个包围球在视野中）
        ),
        complete: function () {
          console.log('定位完成！')
        }
    }
    ffCesium.flyToByBoundingSphere(lnglatArr,option);
  };

  </script>
  <style scoped>
  #cesiumContainer {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  </style>
  