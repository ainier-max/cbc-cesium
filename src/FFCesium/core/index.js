import * as Cesium from "cesium";

//地图接入
import { mapServer } from "./libs/MapAccess/mapServer.js";
import { dataServer } from "./libs/MapAccess/dataServer.js";
//地图基础操作
import { mapTool } from "./libs/MapOperate/mapTool.js";
import { addPrimitive } from "./libs/MapOperate/addPrimitive.js";
import { addEntity } from "./libs/MapOperate/addEntity.js";
import { mapAction } from "./libs/MapOperate/mapAction.js";
import { addOtherElement } from "./libs/MapOperate/addOtherElement.js";
//地图采集
import { elementGather } from "./libs/MapGather/elementGather.js";
import { elementEdit } from "./libs/MapGather/elementEdit.js";
//军事标绘采集与修改
import { militaryPlottingGather } from "./libs/MapGather/militaryPlottingGather.js";
import { militaryPlottingEdit } from "./libs/MapGather/militaryPlottingEdit.js";
//地图效果
import { particleSystem } from "./libs/MapEffect/particleSystem.js";
import { polygonEffect } from "./libs/MapEffect/polygonEffect.js";
import { polylineEffect } from "./libs/MapEffect/polylineEffect.js";
//空间分析
import { judgeRelation } from "./libs/SpatialAnalysis/judgeRelation.js";
//高级示例
import { addType } from "./libs/AdvancedExamples/addType.js";
//地图通用工具包
import { mapUtil } from "./libs/mapUtil.js";
//其他
import { pipe } from "./libs/pipe.js";

//高级示例
import RotateTool from "../senior/libs/rotateTool/index.js";

//入口文件
class FFCesium {
  Version = "V1.0.0";
  cesiumID;
  viewer;
  Cesium;
  RotateTool;
  constructor(id, option) {
    this.Cesium = Cesium;
    //合并其他文件JS文件方法1231
    let time1 = new Date().getTime();
    Object.assign(FFCesium.prototype, {
      //地图接入
      ...mapServer,
      ...dataServer,
      //地图操作
      ...mapTool,
      ...addPrimitive,
      ...addEntity,
      ...mapAction,
      ...addOtherElement,
      //地图元素采集
      ...elementGather,
      //地图元素修改
      ...elementEdit,
      //军事标绘采集
      ...militaryPlottingGather,
      //军事标绘修改
      ...militaryPlottingEdit,
      //地图效果
      ...particleSystem,
      ...polygonEffect,
      ...polylineEffect,
      //空间分析
      ...judgeRelation,
      //高级示例
      ...addType,
      //地图通用工具包
      ...mapUtil,
      //其他
      ...pipe,
    });

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
    this.rotateTool = new RotateTool(this);
    this.addPrimitiveInit();
    console.log("FFCesium构建总耗时（ms）", time3 - time1);
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
      baseLayer: false,
    };
    this.viewer = new Cesium.Viewer(this.cesiumID, viewerOption);
    //得加高德标准地图
    let mapLayer = this.addGaodeLayer(
      "https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
    );
    this.setView({
      lng: 118.135,
      lat: 24.339,
      height: 20000,
      pitchRadiu: -50,
    });
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
        const cartographic =
          the.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
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
