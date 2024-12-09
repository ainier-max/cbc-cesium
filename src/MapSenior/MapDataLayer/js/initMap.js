import FFCesium from "@/FFCesium/core/index.js";
import * as Cesium from "cesium";
export async function initMap() {
  let viewerOption = {
    animation: false, //是否创建动画小器件，左下角仪表
    baseLayerPicker: false, //是否显示图层选择器
    baseLayer: false,
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
    orderIndependentTranslucency: true,
    contextOptions: {
      // requestWebgl1: true,
      webgl: {
        alpha: true
      }
    }
  };
  let ffCesium = new FFCesium("cesiumContainer", viewerOption);
  //加载地形
  //await ffCesium.addTerrain(window.mapParam.terrainUrl); //15
  //加载底图
  addMyMap(ffCesium);
  //启用地形监测
  ffCesium.viewer.scene.globe.depthTestAgainstTerrain = true;
  //启用抗锯齿
  ffCesium.viewer.scene.postProcessStages.fxaa.enabled = true;
  return ffCesium;
}
function addMyMap(ffCesium) {
  var mapOption = {
    url: "https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    minimumLevel: 0, //最小层级
    maximumLevel: 19
  };
  var imgProvider = new ffCesium.Cesium.UrlTemplateImageryProvider(mapOption);
  ffCesium.viewer.imageryLayers.addImageryProvider(imgProvider);

  // 添加注记图层
  var zjMapOption = {
    url: "http://t0.tianditu.gov.cn/cia_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=c&TileMatrix={level}&TileRow={y}&TileCol={x}&style=default&tk=e7a6694e4622933c3a2bd66ba10233aa",
    customTags: {
      level: function (imageryProvider, x, y, level) {
        //console.log("级别：", level);
        return level + 1;
      }
    },
    tilingScheme: new ffCesium.Cesium.GeographicTilingScheme(),
    minimumLevel: 0, //最小层级
    maximumLevel: 17
  };
  var zjProvider = new ffCesium.Cesium.UrlTemplateImageryProvider(zjMapOption);
  ffCesium.viewer.imageryLayers.addImageryProvider(zjProvider);
}

export function destroyMap(ffCesium) {
  // 清除全部实体
  ffCesium.viewer.entities.values.forEach((entity, index) => {
    ffCesium.viewer.entities.remove(entity);
  });
  // 删除底图
  ffCesium.viewer.imageryLayers.removeAll();
  // 删除边界
  ffCesium.viewer.dataSources.removeAll();
  // 删除上下文
  let gl = ffCesium.viewer.scene.context._originalGLContext;
  gl.canvas.width = 1;
  gl.canvas.height = 1;
  ffCesium.viewer.destroy(); // 销毁Viewer实例
  gl.getExtension("WEBGL_lose_context").loseContext();
  gl = null;

  if (ffCesium.viewer) {
    ffCesium.viewer = null;
  }
}
