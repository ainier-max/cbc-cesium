<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="FlyRoam">开始漫游</button>
    <button style="position: absolute; left: 100px; top: 150px; z-index: 999" @click="pauseFly">暂停漫游</button>
    <button style="position: absolute; left: 100px; top: 200px; z-index: 999" @click="continueFly">继续漫游</button>
    <button style="position: absolute; left: 100px; top: 250px; z-index: 999" @click="stopFly">停止漫游</button>
  </div>
</template>
<script lang="ts" setup>
  import { onMounted } from "vue";
  import FFCesium from "FFCesium";

  let ffCesium = null;
  let lnglatArr = [
    [129.981290445000013, 46.826103293000074],
    [129.983103594000113, 46.822990958000048],
    [129.983128247000082, 46.822875908000071],
    [129.983274915000038, 46.822191459000067],
    [129.983830282000099, 46.818943495000042],
    [129.98386020800001, 46.818793864000043],
    [129.983901665000076, 46.81858657600003],
    [129.984222893000037, 46.816366539000057],
    [129.984479875000034, 46.814738987000055],
    [129.984417057000087, 46.814482006000048],
    [129.984202905000075, 46.814282131000027],
    [129.98240403300008, 46.813211374000048],
    [129.979520126000011, 46.811626652000029],
    [129.975550114000043, 46.809501432000047],
    [129.974309106000078, 46.808785576000048],
    [129.974166339000021, 46.80851431800005],
    [129.974137785000039, 46.808128845000056],
    [129.974608918000058, 46.806144374000041],
    [129.974865900000054, 46.805030787000078],
    [129.97529420300009, 46.803417512000067],
    [129.975808167000082, 46.802532353000061],
    [129.977635593000059, 46.800861971000074],
    [129.977806914000098, 46.800619266000069],
    [129.979720001000032, 46.79790668000004],
    [129.980790758000012, 46.796250575000045],
    [129.982418309000082, 46.793623651000075],
    [129.985145172000102, 46.791182324000033],
    [129.988371721000021, 46.788512568000044],
    [129.991641100000038, 46.786899294000079],
    [129.997009164000019, 46.784101048000025],
    [129.999407661000077, 46.783044567000047],
    [129.99980741100012, 46.782901799000058],
    [130.001106596000113, 46.782544880000046],
    [130.003562200000033, 46.782302175000041],
    [130.004090440000027, 46.782273622000048],
    [130.006117741000025, 46.782088024000075],
    [130.00637507600004, 46.782063121000078],
    [130.010100959000056, 46.78170255100008],
    [130.011799894000092, 46.781559783000034],
    [130.016097201000093, 46.781902426000045],
    [130.023435458000108, 46.782502050000062],
    [130.026447856000118, 46.782659094000053],
    [130.032658249000065, 46.782102300000076],
    [130.036555806000024, 46.781759658000055],
    [130.037341028000014, 46.781745381000064],
    [130.038012036000055, 46.781888149000054],
    [130.038740152000059, 46.782273622000048],
    [130.039553927000043, 46.783144504000063],
    [130.041038805000085, 46.784703290000039],
    [130.042709092000109, 46.786456714000053],
    [130.045678660000021, 46.789711817000068],
    [130.047520363000103, 46.79192471500005],
    [130.048058121000054, 46.792623484000046],
    [130.048486424000089, 46.793066063000026]
  ];
  onMounted(() => {
    ffCesium = new FFCesium("cesiumContainer");
    ffCesium.mapActionClass.setView({
      lng: 129.981290445000013,
      lat: 46.756103293000074,
      height: 8000,
      pitchRadiu: -50
    });
    console.log("ffCesium", ffCesium);

    //显示帧率
    ffCesium.viewer.scene.debugShowFramesPerSecond = true

    let option = {
      width: 1,
      color: "#FFFF00",
      alpha: 1
    };
    let polylineEntity = ffCesium.entityClass.addPolylineEntity(lnglatArr, option);
  });

  const endFlyRoamCallBack = () => {
    console.log("结束漫游回调");
  };


  const FlyRoam = () => {
    let option = {
      showPoint: true,
      speed: 1,
      pitch: -20,
      rangeHeight: 1700,
      endFlyRoamCallBack: endFlyRoamCallBack,
      continuousTime: 1000,
      continuousFun: continuousFun
    };
    ffCesium.flyRoamNew.startFly(lnglatArr, option);
  };

  const continuousFun = () => {
    // 获取坐标
    var position = ffCesium.flyRoamNew.FlyRoamPoint.position.getValue(ffCesium.viewer.clock.currentTime)
    console.log("continuousFun--position",position);

  };

  const pauseFly = () => {
    ffCesium.flyRoamNew.pauseFly();
  };
  const continueFly = () => {
    ffCesium.flyRoamNew.continueFly();
  };

  const stopFly = () => {
    ffCesium.flyRoamNew.stopFly();
  };
</script>
<style scoped>
  #cesiumContainer {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
