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
  // let lnglatArr = [
  //   [129.869868420606991, 46.732723380714098, 94.851418648205794],
  //   [129.873666428571994, 46.735984946876201, 94.748913990356101],
  //   [129.877920412070011, 46.738661791473099, 94.658284223747103],
  //   [129.882158302313002, 46.741499568610799, 95.824619615330207],
  //   [129.887393974309987, 46.743935014396399, 95.671481421049293],
  //   [129.894281887060998, 46.747271682410897, 94.952947013899802],
  //   [129.901695512777991, 46.750790740638401, 94.081488572017903],
  //   [129.902264141089006, 46.751477386146199, 94.698849496940497],
  //   [129.905375503545997, 46.758558417945601, 94.092628819230001],
  //   [129.909323715216004, 46.7637940899426, 94.307786937873999],
  //   [129.913368486411002, 46.769115592628197, 93.574928509349306],
  // ];

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
