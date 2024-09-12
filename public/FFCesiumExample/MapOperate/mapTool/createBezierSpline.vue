<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="createBezierSplineFun"
    >
      生成贝塞尔曲线
    </button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let lnglatArr = [
  [129.869868420606991, 46.732723380714098, 94.851418648205794],
  [129.873666428571994, 46.735984946876201, 94.748913990356101],
  [129.877920412070011, 46.738661791473099, 94.658284223747103],
  [129.882158302313002, 46.741499568610799, 95.824619615330207],
  [129.887393974309987, 46.743935014396399, 95.671481421049293],
  [129.894281887060998, 46.747271682410897, 94.952947013899802],
  [129.901695512777991, 46.750790740638401, 94.081488572017903],
  [129.902264141089006, 46.751477386146199, 94.698849496940497],
  [129.905375503545997, 46.758558417945601, 94.092628819230001],
  [129.909323715216004, 46.7637940899426, 94.307786937873999],
  [129.913368486411002, 46.769115592628197, 93.574928509349306],
];
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  let option = {
    lng: 129.869868420606991,
    lat: 46.702723380714098,
    height: 5000,
    pitchRadiu: -50,
  };
  ffCesium.setView(option);

  let option1 = {
    width: 5,
    color: "#FFFF00",
    alpha: 1,
  };
  let polylineEntity = ffCesium.addPolylineEntity(lnglatArr, option1);

  polylineEntity.position.setInterpolationOptions({
    interpolationDegree: 2,
    interpolationAlgorithm: ffCesium.Cesium.HermitePolynomialApproximation,
  });
});
const createBezierSplineFun = () => {
  let lnglatArrTemp = ffCesium.getLngLatArrFromLngLatHeightArr(lnglatArr);
  console.log("lnglatArrTemp", lnglatArrTemp);
  let newlnglatArr = ffCesium.createBezierSpline(lnglatArrTemp);
  for (let i = 0; i < newlnglatArr.length; i++) {
    newlnglatArr[i][2] = 100;
  }
  console.log("newlnglatArr", newlnglatArr);

  let option1 = {
    width: 5,
    color: "#FF0000",
    alpha: 1,
  };
  let polylinePrimitive = ffCesium.addPolylinePrimitive(newlnglatArr, option1);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
