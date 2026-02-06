<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 50px; z-index: 999" @click="findWMSServiceFun">
      查询wms服务接口(所有数据)
    </button>

    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="findWMSServiceByPointFun">
      点周边查询wms服务接口
    </button>

    <button style="position: absolute; left: 100px; top: 150px; z-index: 999" @click="findWMSServiceByRectFun">
      矩形查询wms服务接口
    </button>

    <button style="position: absolute; left: 100px; top: 200px; z-index: 999" @click="findWMSServiceByConditionFun">
      条件查询wms服务接口(kind='2380')
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";
let ffCesium = null;
onMounted(() => {
  let viewerOption = {
    animation: false, //是否创建动画小器件，左下角仪表
    baseLayerPicker: false, //是否显示图层选择器
    fullscreenButton: false, //是否显示全屏按钮
    geocoder: false, //是否显示geocoder小器件，右上角查询按钮
    homeButton: false, //是否显示Home按钮
    infoBox: false, //是否显示信息框
    sceneModePicker: false, //是否显示3D/2D选择器
    scene3DOnly: false, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
    selectionIndicator: false, //是否显示选取指示器组件
    timeline: false, //是否显示时间轴
    navigationHelpButton: false, //是否显示右上角的帮助按钮
    shadows: true, //是否显示背影
    shouldAnimate: true,
    baseLayer: false,
  }; //初始化
  ffCesium = new FFCesium("cesiumContainer", viewerOption);
  let mapLayer = ffCesium.mapServerClass.addTdtImgLayer();
  ffCesium.mapActionClass.setView({
    lng: 118.135,
    lat: 24.489,
    height: 20000,
    pitchRadiu: -90,
  });
});

let filterLayer = null;
const findWMSServiceFun = () => {
  removeRun();
  let wmsOption = {
    url: "http://192.168.15.228:8078/geoserver/cbc/wms",
    layers: "cite:shopping",
    parameters: {
      transparent: true, //透明配置
      service: "WMS",
      format: "image/png",
    },
  };
  filterLayer = ffCesium.dataServerClass.findWmsLayer(wmsOption);
};

let pointPrimitive = null;
const findWMSServiceByPointFun = () => {
  removeRun();
  let lngLatHeight = [118.135, 24.489, 10];
  let option = {
    pixelSize: 10,
    color: "#000000",
    alpha: 1,
  };
  pointPrimitive = ffCesium.addPointPrimitive(lngLatHeight, option);

  let wmsOption = {
    url: "http://192.168.15.228:8078/geoserver/cbc/wms",
    layers: "cite:shopping",
    parameters: {
      transparent: true, //透明配置
      service: "WMS",
      format: "image/png",
      cql_filter: "DWITHIN(the_geom,Point(118.135 24.489),0.005,meters)",
    },
  };
  filterLayer = ffCesium.dataServerClass.findWmsLayer(wmsOption);
};
let polylinePrimitive = null;
const findWMSServiceByRectFun = () => {
  removeRun();

  let lnglatArr = [
    [118.145, 24.479, 10],
    [118.145, 24.499, 10],
    [118.165, 24.499, 10],
    [118.165, 24.479, 10],
    [118.145, 24.479, 10],
  ];

  let option = {
    width: 2,
    color: "#FFFF00",
    alpha: 1,
  };
  polylinePrimitive = ffCesium.addPolylinePrimitive(lnglatArr, option);

  let wmsOption = {
    url: "http://192.168.15.228:8078/geoserver/cbc/wms",
    layers: "cite:shopping",
    parameters: {
      transparent: true, //透明配置
      service: "WMS",
      format: "image/png",
      cql_filter: "BBOX(the_geom, 118.145, 24.479, 118.165, 24.499)",
    },
  };
  filterLayer = ffCesium.dataServerClass.findWmsLayer(wmsOption);
};

//条件查询
const findWMSServiceByConditionFun = () => {
  removeRun();

  let wmsOption = {
    url: "http://192.168.15.228:8078/geoserver/cbc/wms",
    layers: "cite:shopping",
    parameters: {
      transparent: true, //透明配置
      service: "WMS",
      format: "image/png",
      cql_filter: "kind='2380'",
    },
  };
  filterLayer = ffCesium.dataServerClass.findWmsLayer(wmsOption);
};

const removeRun = () => {
  if (filterLayer) {
    ffCesium.mapServerClass.removeMapLayer(filterLayer);
    filterLayer = null;
  }
  if (pointPrimitive) {
    ffCesium.removeFFPrimitive(pointPrimitive);
    pointPrimitive = null;
  }
  if (polylinePrimitive) {
    ffCesium.removeFFPrimitive(polylinePrimitive);
    polylinePrimitive = null;
  }
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
