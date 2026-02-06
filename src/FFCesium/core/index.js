import * as Cesium from "cesium";

//缓存类
import CacheUrlClass from "./dependentLib/CacheUrlClass.js";

//地图效果
import ParticleEffectClass from "./libs/MapEffect/ParticleEffectClass.js";//粒子效果类
import WeatherEffectClass from "./libs/MapEffect/WeatherEffectClass.js";//天气效果类
import PolygonEffectClass from "./libs/MapEffect/PolygonEffectClass.js";//面效果类
import PolylineEffectClass from "./libs/MapEffect/PolylineEffectClass.js";//线效果类

//地图接入
import MapServerClass from "./libs/MapAccess/MapServerClass.js";
import DataServerClass from "./libs/MapAccess/DataServerClass.js";

//地图基础操作
import MapToolClass from "./libs/MapOperate/MapToolClass.js";
import PrimitiveClass from "./libs/MapOperate/PrimitiveClass.js";
import EntityClass from "./libs/MapOperate/EntityClass.js";
import MapActionClass from "./libs/MapOperate/MapActionClass.js";
import ElementClass from "./libs/MapOperate/ElementClass.js";
//地图采集
import ElementGatherClass from "./libs/MapGather/ElementGatherClass.js";
import ElementEditClass from "./libs/MapGather/ElementEditClass.js";
//军事标绘采集与修改
import MilitaryPlottingGatherClass from "./libs/MapGather/MilitaryPlottingGatherClass.js";
import MilitaryPlottingEditClass from "./libs/MapGather/MilitaryPlottingEditClass.js";

//空间分析
import SpatialAnalysisClass from "./libs/SpatialAnalysis/SpatialAnalysisClass.js";
//高级示例
import AddTypeClass from "./libs/AdvancedExamples/AddTypeClass.js";
//地图通用工具包
import MapUtilClass from "./libs/MapUtil/MapUtilClass.js";

//高级示例
import RotateTool from "../senior/libs/rotateTool/index.js";
import FlyRoam from "../senior/libs/flyRoam/index.js";
import FlyRoamNew from "../senior/libs/flyRoamNew/index.js";

//入口文件
class FFCesium {
  Version = "V1.0.0";
  particleEffectClass; //地图效果--粒子效果类
  weatherEffectClass; //地图效果--天气效果类
  polygonEffectClass;//地图效果--面效果类
  polylineEffectClass;//地图效果--线效果类
  addTypeClass;//高级示例--AddType类
  mapServerClass;
  dataServerClass;
  mapToolClass;
  primitiveClass;
  entityClass;
  mapActionClass;
  elementClass;
  elementGatherClass;
  elementEditClass;
  militaryPlottingGatherClass;
  militaryPlottingEditClass;
  spatialAnalysisClass;
  mapUtilClass;
  cesiumID;
  viewer;
  Cesium;
  RotateTool;
  flyRoam;
  flyRoamNew;
  constructor(id, option) {
    // Synchronous constructor: start async cache init without awaiting
    // readiness promise so callers can wait for full initialization
    this._ready = new Promise((resolve) => {
      this._resolveReady = resolve
    })

    if (option?.customOption?.cacheUrl) {
      this.openCache(id, option)
    } else {
      this.initMap(id, option)
    }
  }
  //开启缓存
  async openCache(id, option) {
    console.log("开启缓存");
    let cacheOption = {
      cacheUrl: option.customOption.cacheUrl,
    }
    let cacheUrlClass = new CacheUrlClass(cacheOption)
    await cacheUrlClass.openIndexDb()
    this.initMap(id, option)
  }
  //地图初始化
  initMap(id, option) {
    this.Cesium = Cesium;
    //合并其他文件JS文件方法1231
    let time1 = new Date().getTime();
    //Object.assign(FFCesium.prototype, {});

    let time2 = new Date().getTime();
    console.log("FFCesium所使用Cesium版本", Cesium.VERSION);
    console.log("FFCesium注册方法耗时（ms）", time2 - time1);

    this.cesiumID = id;
    if (!option) {
      this.defaultMap();
    } else {
      if (option.viewer) {
        //不是用FFCesium进行初始化的使用方式
        this.viewer = option.viewer;
      } else {
        this.viewer = new Cesium.Viewer(id, option);
      }
    }
    this.viewer._cesiumWidget._creditContainer.style.display = "none"; //去除版权信息
    let time3 = new Date().getTime();

    // this.addPrimitiveInit();
    console.log("FFCesium构建总耗时（ms）", time3 - time1);

    /**
     * 地图效果类
     */
    this.particleEffectClass = new ParticleEffectClass(this.viewer); //地图效果--粒子效果类
    this.weatherEffectClass = new WeatherEffectClass(this.viewer);//地图效果--天气效果类
    this.polygonEffectClass = new PolygonEffectClass(this.viewer);//地图效果--面效果类
    this.polylineEffectClass = new PolylineEffectClass(this.viewer);//地图效果--线效果类 
    this.addTypeClass = new AddTypeClass(this.viewer);//高级示例--AddType类

    // 初始化服务类
    this.mapServerClass = new MapServerClass(this.viewer);
    this.dataServerClass = new DataServerClass(this.viewer);

    // 初始化地图操作类
    this.mapToolClass = new MapToolClass(this.viewer, this.cesiumID);
    this.primitiveClass = new PrimitiveClass(this.viewer);
    this.entityClass = new EntityClass(this);
    this.mapActionClass = new MapActionClass(this);
    this.elementClass = new ElementClass(this.viewer, this.cesiumID);

    // 初始化地图采集类
    this.elementGatherClass = new ElementGatherClass(this);
    this.elementEditClass = new ElementEditClass(this);
    this.militaryPlottingGatherClass = new MilitaryPlottingGatherClass(this);
    this.militaryPlottingEditClass = new MilitaryPlottingEditClass(this);
    //空间分析类
    this.spatialAnalysisClass = new SpatialAnalysisClass(this);
    //地图工具类
    this.mapUtilClass = new MapUtilClass(this);

    //高级示例
    this.rotateTool = new RotateTool(this);
    this.flyRoam = new FlyRoam(this);
    this.flyRoamNew = new FlyRoamNew(this);
    // mark ready
    try {
      this._resolveReady && this._resolveReady(this)
    } catch (e) {
      // ignore
    }
  }

  // return a promise that resolves when initialization completes
  whenReady() {
    return this._ready
  }

  defaultMap() {
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
      baseLayer: false
    };
    this.viewer = new Cesium.Viewer(this.cesiumID, viewerOption);
    //得加高德标准地图
    var imgProvider = new Cesium.UrlTemplateImageryProvider({ url: "https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}" });
    let mapLayer = this.viewer.imageryLayers.addImageryProvider(imgProvider);
    let optionTemp = {
      destination: Cesium.Cartesian3.fromDegrees(118.135, 24.339, 20000),
      orientation: {
        // 指向
        heading: Cesium.Math.toRadians(0, 0),
        // 视角
        pitch: Cesium.Math.toRadians(-50),
        roll: 0.0
      }
    };
    this.viewer.camera.setView(optionTemp);
    return mapLayer;
  }

  getXyEvent() {
    let the = this;
    let getXYHandle = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    getXYHandle.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (Cesium.defined(cartesian)) {
        // 转换为经纬度
        const cartographic = the.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        const longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
        const latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
        const height = the.viewer.scene.globe.getHeight(cartographic);
        // 输出点击的经纬度和高度
        console.log("采集坐标：" + longitudeString + "," + latitudeString);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //添加实体，官网已经够简捷不需要封装，可直接使用
  //参考文档：https://www.vvpstk.com/public/Cesium/Documentation/Entity.html?classFilter=entity
  addFFEntity(option) {
    return this.viewer.entities.add(option);
  }

  //删除实体Entity
  removeFFEntityArray(FFEntityArray) {
    console.log("removeFFEntityArray", FFEntityArray);
    FFEntityArray.forEach((element) => {
      this.viewer.entities.remove(element);
    });
  }
  //删除原始图形Primitive（数组）
  removeFFPrimitiveArray(FFPrimitiveArray) {
    FFPrimitiveArray.forEach((element) => {
      this.viewer.scene.primitives.remove(element);
    });
  }
}

export default FFCesium;
