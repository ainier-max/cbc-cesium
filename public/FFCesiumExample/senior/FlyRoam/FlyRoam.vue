<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="FlyRoam"
    >
      开始漫游
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="pauseFly"
    >
      暂停漫游
    </button>

    <button
      style="position: absolute; left: 100px; top: 200px; z-index: 999"
      @click="continueFly"
    >
      继续漫游
    </button>

    <button
      style="position: absolute; left: 100px; top: 250px; z-index: 999"
      @click="stopFly"
    >
      停止漫游
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
// 123
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  console.log("ffCesium", ffCesium);

  let lnglatArr = [
    [118.05188113863016, 24.510436012767556, 480.78982254090295],
    [118.06514919580924, 24.47541823047743, 480.78982254090295],
    [118.10523864011213, 24.478852329447786, 480.78982254090295],
    [118.13710000000002, 24.449, 480.78982254090295],
  ];

  //初始化飞行漫游
  ffCesium.flyRoam.init();
  let option = {};
  option.interpolationType = "3"; //1：直线段；2、微弯曲线；3、弧线
  option.interpolationCount = 1000; //插值点数
  option.showPointFlag = true;
  option.lnglatArr = lnglatArr;
  option.speed = 5;
  ffCesium.flyRoam.createFlyLine(option);
});

const FlyRoam = () => {
  ffCesium.flyRoam.startFly(1, (index, position) => {
    console.log("index, position", index, position);
    if (index == 1) {
      // flyCesium.pauseFly();
      // console.log("暂停4秒", index, p);
      // setTimeout(function () {
      //     console.log("继续执行", index, p);
      //     flyCesium.continueFly();
      // }, 4000);
    } else if (index == 2) {
      // flyCesium.pauseFly();
      // console.log("暂停2秒", index, p);
      // setTimeout(function () {
      //     console.log("继续执行", index, p);
      //     flyCesium.continueFly();
      // }, 2000);
    }
  });
};
const pauseFly = () => {
  ffCesium.flyRoam.pauseFly();
};

const continueFly = () => {
  ffCesium.flyRoam.continueFly();
};

const stopFly = () => {
  ffCesium.flyRoam.stopFly();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
