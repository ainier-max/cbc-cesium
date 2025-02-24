import * as Cesium from "cesium";
import { createGatherPoint } from "./common.js";

export const elementGather = {
  //一次只能由一个采集事件,gatherHandler
  gatherHandler: null,
  //进入采集到一半，强制关闭采集
  forceGatherEnd() {
    console.log("this.gatherHandler", this.gatherHandler);
    if (this.gatherHandler) {
      if (this.gatherHandler.GatherEntity !== undefined && this.gatherHandler.GatherEntity.length > 0) {
        for (let i = 0; i < this.gatherHandler.GatherEntity.length; i++) {
          this.viewer.entities.remove(this.gatherHandler.GatherEntity[i]);
        }
        this.gatherHandler.GatherEntity = [];
      }
    }
    this.gatherHandlerDestroy();
  },
  //如果存在gatherHandler，则先销毁
  gatherHandlerDestroy() {
    if (this.gatherHandler) {
      this.gatherHandler.destroy();
      this.gatherHandler = null;
    }
    //关闭鼠标提示
    this.closeMouseTip();
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "default";
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.viewer.scene.screenSpaceCameraController.enableZoom = true;
  },
  //圆形采集
  circleGather(callback, option) {
    this.openMouseTip("点击采集后拖动，右击即可完成采集");
    let the = this;
    let viewer = this.viewer;
    let gatherCircleEntity = null;
    let centerPoint = null;
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    //进制地图移动
    viewer.scene.screenSpaceCameraController.enableRotate = false;
    viewer.scene.screenSpaceCameraController.enableZoom = false;
    this.gatherHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    //鼠标点击事件
    this.gatherHandler.setInputAction((event) => {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = viewer.camera.getPickRay(event.position);
      var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      centerPoint = createGatherPoint(cartesian, viewer);
      //默认生成半径为0.1米的圆。
      gatherCircleEntity = viewer.entities.add({
        position: cartesian,
        ellipse: {
          semiMinorAxis: 0.1, //椭圆短轴（单位米）
          semiMajorAxis: 0.1, //椭圆长轴（单位米）
          material: Cesium.Color.GREENYELLOW.withAlpha(0.5),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3
        }
      });
      //供forceGatherEnd使用，采集到一半强制关闭采集
      this.gatherHandler.GatherEntity = [];
      this.gatherHandler.GatherEntity.push(centerPoint);
      this.gatherHandler.GatherEntity.push(gatherCircleEntity);
      this.gatherHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 对鼠标移动事件的监听
    this.gatherHandler.setInputAction((event) => {
      if (centerPoint == null || gatherCircleEntity == null) {
        return;
      }
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = viewer.camera.getPickRay(event.endPosition);
      var radiusCartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!radiusCartesian) {
        return;
      }
      var centerCartesian = centerPoint.position.getValue(Cesium.JulianDate.now());
      //计算移动点与中心点的距离（单位米）
      var centerTemp = viewer.scene.globe.ellipsoid.cartesianToCartographic(centerCartesian);
      var radiusTemp = viewer.scene.globe.ellipsoid.cartesianToCartographic(radiusCartesian);
      var geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(centerTemp, radiusTemp);
      var radius = geodesic.surfaceDistance;
      //console.log("radius",radius);
      //如果半径小于0,则不更新圆信息
      if (radius <= 0) {
        return;
      }
      gatherCircleEntity.ellipse.semiMinorAxis = new Cesium.CallbackProperty(function (time, result) {
        return radius;
      }, false);
      gatherCircleEntity.ellipse.semiMajorAxis = new Cesium.CallbackProperty(function (time, result) {
        return radius;
      }, false);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 对鼠标抬起事件的监听(结束点采集)
    this.gatherHandler.setInputAction((event) => {
      //鼠标变成默认
      document.getElementById(this.cesiumID).style.cursor = "default";
      //开始鼠标操作地图
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
      //移除事件
      the.gatherHandlerDestroy();
      //如果圆半径小于0.5米则删除，防止出现默认为0.1米的被采集。该种情况则是用户取消圆采集
      //if (gatherCircleEntity.ellipse.semiMinorAxis.getValue() < 0.5) {
      // viewer.entities.remove(gatherCircleEntity);
      // gatherCircleEntity = null;
      // return;
      //}
      //清除圆中心点和半径点
      viewer.entities.remove(centerPoint);
      centerPoint = null;
      the.setAttributeForEntity(gatherCircleEntity, option, "circle");
      callback(gatherCircleEntity);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  //矩形采集
  rectangleGather(callback, option) {
    let the = this;
    this.openMouseTip("点击采集后拖动，右击即可完成采集");
    let gatherRectangleEntity = null;
    let startPoint = null;
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    //进制地图移动
    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
    this.viewer.scene.screenSpaceCameraController.enableZoom = false;
    this.gatherHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    //鼠标点击事件
    this.gatherHandler.setInputAction((event) => {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      startPoint = createGatherPoint(cartesian, the.viewer);
      gatherRectangleEntity = the.viewer.entities.add({
        rectangle: {
          coordinates: Cesium.Rectangle.fromCartesianArray([cartesian, cartesian]),
          material: Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha)
        }
      });
      this.gatherHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);

      //供forceGatherEnd使用，采集到一半强制关闭采集
      this.gatherHandler.GatherEntity = [];
      this.gatherHandler.GatherEntity.push(startPoint);
      this.gatherHandler.GatherEntity.push(gatherRectangleEntity);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    // 对鼠标移动事件的监听
    this.gatherHandler.setInputAction((event) => {
      if (startPoint == null || gatherRectangleEntity == null) {
        return;
      }
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.endPosition);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!cartesian) {
        return;
      }
      var startCartesian = startPoint.position.getValue(Cesium.JulianDate.now());
      gatherRectangleEntity.rectangle.coordinates = new Cesium.CallbackProperty(function (time, result) {
        return Cesium.Rectangle.fromCartesianArray([startCartesian, cartesian]);
      }, false);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 对鼠标抬起事件的监听(结束点采集)
    this.gatherHandler.setInputAction((event) => {
      //鼠标变成默认
      document.getElementById(this.cesiumID).style.cursor = "default";
      the.viewer.scene.screenSpaceCameraController.enableRotate = true;
      the.viewer.scene.screenSpaceCameraController.enableZoom = true;
      the.viewer.entities.remove(startPoint);
      //移除事件
      the.gatherHandlerDestroy();
      the.setAttributeForEntity(gatherRectangleEntity, option, "rectangle");
      callback(gatherRectangleEntity);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    //Cesium.ScreenSpaceEventType.LEFT_UP
  },
  //图标点采集
  billboardGather(callback, option) {
    let the = this;
    this.openMouseTip("点击即可完成采集");
    let gatherPointEntity = null;
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    this.gatherHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // 对鼠标按下事件的监听
    this.gatherHandler.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }

      let lngLatHeightTemp = the.cartesian3ToLngLat(cartesian);
      gatherPointEntity = the.addBillboardEntity([lngLatHeightTemp.lng, lngLatHeightTemp.lat, lngLatHeightTemp.height], option);
      //鼠标变成默认
      document.getElementById(the.cesiumID).style.cursor = "default";
      //移除事件
      the.gatherHandlerDestroy();
      callback(gatherPointEntity);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  },
  //点采集
  pointGather(callback, option) {
    let the = this;
    //移除事件
    this.openMouseTip("点击即可完成采集");
    let gatherPointEntity = null;
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    this.gatherHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // 对鼠标按下事件的监听
    this.gatherHandler.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      let lngLatHeightTemp = the.cartesian3ToLngLat(cartesian);
      gatherPointEntity = the.addPointEntity([lngLatHeightTemp.lng, lngLatHeightTemp.lat, lngLatHeightTemp.height], option);
      //鼠标变成默认
      document.getElementById(the.cesiumID).style.cursor = "default";
      //移除事件
      the.gatherHandlerDestroy();
      //设置属性
      the.setAttributeForEntity(gatherPointEntity, option, "point");
      callback(gatherPointEntity);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  },
  //线采集
  polylineGather(callback, option) {
    let the = this;
    this.openMouseTip("不断点击采集，右击即可完成采集");
    let gatherPolylineEntity = null;
    let entityPoints = [];
    let cartesianPoints = [];
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    this.gatherHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    //供forceGatherEnd使用，采集到一半强制关闭采集
    the.gatherHandler.GatherEntity = [];
    // 对鼠标按下事件的监听
    this.gatherHandler.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      var point = createGatherPoint(cartesian, the.viewer);
      entityPoints.push(point);
      cartesianPoints.push(cartesian);
      the.gatherHandler.GatherEntity.push(point);
      if (cartesianPoints.length >= 2) {
        if (gatherPolylineEntity == null) {
          gatherPolylineEntity = the.viewer.entities.add({
            polyline: {
              positions: new Cesium.CallbackProperty(function (time, result) {
                return cartesianPoints;
              }, false),
              material: new Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha),
              ...option
            }
          });
          the.gatherHandler.GatherEntity.push(gatherPolylineEntity);
        } else {
          //CallbackProperty监听point变化值会自动set
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.gatherHandler.setInputAction(function (rightClick) {
      //移除地图点
      for (var i = 0; i < entityPoints.length; i++) {
        the.viewer.entities.remove(entityPoints[i]);
      }
      entityPoints = [];
      //鼠标变成加号
      document.getElementById(the.cesiumID).style.cursor = "default";
      //移除事件
      the.gatherHandlerDestroy();
      //设置属性
      the.setAttributeForEntity(gatherPolylineEntity, option, "polyline");

      callback(gatherPolylineEntity);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  //面采集
  polygonGather(callback, option) {
    let the = this;
    this.openMouseTip("不断点击采集，右击即可完成采集");
    let gatherPolygonEntity = null;
    let entityPoints = [];
    let cartesianPoints = [];
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    this.gatherHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // 对鼠标按下事件的监听
    this.gatherHandler.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      var point = createGatherPoint(cartesian, the.viewer);
      entityPoints.push(point);
      cartesianPoints.push(cartesian);

      //供forceGatherEnd使用，采集到一半强制关闭采集
      the.gatherHandler.GatherEntity = [];
      the.gatherHandler.GatherEntity.push(point);

      if (cartesianPoints.length >= 3) {
        if (gatherPolygonEntity == null) {
          gatherPolygonEntity = the.viewer.entities.add({
            polygon: {
              hierarchy: new Cesium.CallbackProperty(function (time, result) {
                var hierarchyTemp = new Cesium.PolygonHierarchy(cartesianPoints, null);
                return hierarchyTemp;
              }, false),
              material: Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha),
              ...option
            }
          });
          //供forceGatherEnd使用，采集到一半强制关闭采集
          the.gatherHandler.GatherEntity.push(gatherPolygonEntity);
        } else {
          gatherPolygonEntity.polygon.hierarchy = new Cesium.CallbackProperty(function (time, result) {
            var hierarchyTemp = new Cesium.PolygonHierarchy(cartesianPoints, null);
            return hierarchyTemp;
          }, false);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.gatherHandler.setInputAction(function (rightClick) {
      //移除面采集点
      for (var i = 0; i < entityPoints.length; i++) {
        the.viewer.entities.remove(entityPoints[i]);
      }
      entityPoints = [];
      //鼠标变成加号
      document.getElementById(the.cesiumID).style.cursor = "default";
      //移除事件
      the.gatherHandlerDestroy();
      the.setAttributeForEntity(gatherPolygonEntity, option, "polygon");
      callback(gatherPolygonEntity);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }
};
