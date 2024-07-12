import * as Cesium from "cesium";
import { createGatherPoint, createHalfGatherPoint } from "./common.js";

export const elementEdit = {
  rectangleEdit(rectangle, callback) {
    console.log("rectangleEdit--rectangle", rectangle);
    this.openMouseTip("压住编辑点移动，右击即可完成采集");
    let the = this;
    let viewer = this.viewer;
    let currentPoint = null;
    rectangle.pointsId = [];
    document.getElementById(this.cesiumID).style.cursor = "pointer";

    // 生成边界编辑点
    var degrees = rectangle.rectangle.coordinates.getValue();
    var cartesianArr = [];
    var westNorth = Cesium.Cartesian3.fromRadians(degrees.west, degrees.north);
    westNorth.flag = "westNorth";
    cartesianArr.push(westNorth);
    var eastNorth = Cesium.Cartesian3.fromRadians(degrees.east, degrees.north);
    eastNorth.flag = "eastNorth";
    cartesianArr.push(eastNorth);
    var eastSouth = Cesium.Cartesian3.fromRadians(degrees.east, degrees.south);
    eastSouth.flag = "eastSouth";
    cartesianArr.push(eastSouth);
    var westSouth = Cesium.Cartesian3.fromRadians(degrees.west, degrees.south);
    westSouth.flag = "westSouth";
    cartesianArr.push(westSouth);
    console.log("cartesianArr", cartesianArr);
    for (var i = 0; i < cartesianArr.length; i++) {
      var cartesian = cartesianArr[i];
      var point = createGatherPoint(cartesian, viewer);
      point.name = "rectangleBorderEdit_point";
      // var point = viewer.entities.add({
      //   name: "rectangleBorderEdit_point",
      //   position: cartesian,
      //   point: {
      //     color: Cesium.Color.WHITE,
      //     pixelSize: 8,
      //     outlineColor: Cesium.Color.BLACK,
      //     outlineWidth: 1,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
      //   },
      // });
      point.flag = cartesian.flag;
      rectangle.pointsId.push(point.id);
    }

    // 生成中心编辑点
    var centerLng = (degrees.west + degrees.east) / 2;
    var centerLat = (degrees.north + degrees.south) / 2;
    var rect_center_cartesian = Cesium.Cartesian3.fromRadians(
      centerLng,
      centerLat
    );

    var pointTemp = createGatherPoint(rect_center_cartesian, viewer);
    pointTemp.name = "rectangleCenterEdit_point";
    // var pointTemp = viewer.entities.add({
    //   name: "rectangleCenterEdit_point",
    //   position: rect_center_cartesian,
    //   point: {
    //     color: Cesium.Color.WHITE,
    //     pixelSize: 8,
    //     outlineColor: Cesium.Color.BLACK,
    //     outlineWidth: 1,
    //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
    //   },
    // });
    pointTemp.flag = "center";
    rectangle.pointsId.push(pointTemp.id);

    //事件
    rectangle.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    //点击事件
    rectangle.handler.setInputAction((event) => {
      let windowPosition = event.position;
      let pickedObject = viewer.scene.pick(windowPosition);
      if (Cesium.defined(pickedObject)) {
        let entity = pickedObject.id;
        if (
          entity.name == "rectangleBorderEdit_point" ||
          entity.name == "rectangleCenterEdit_point"
        ) {
          currentPoint = entity;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 对鼠标移动事件的监听
    rectangle.handler.setInputAction((event) => {
      if (!currentPoint) {
        return;
      }
      viewer.scene.screenSpaceCameraController.enableRotate = false;
      viewer.scene.screenSpaceCameraController.enableZoom = false;
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = viewer.camera.getPickRay(event.endPosition);
      var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      let points = [];
      if (!cartesian) {
        return;
      }
      //更新当前点的位置
      currentPoint.position = cartesian;
      for (var i = 0; i < rectangle.pointsId.length; i++) {
        if (currentPoint.id == rectangle.pointsId[i]) {
          var objTemp = currentPoint.position._value;
          objTemp.flag = currentPoint.flag;
          points.push(objTemp);
        } else {
          var id = rectangle.pointsId[i];
          var objTemp = viewer.entities.getById(id).position._value;
          objTemp.flag = viewer.entities.getById(id).flag;
          points.push(objTemp);
        }
      }
      if (typeof currentPoint == "undefined") {
        var radians = Cesium.Rectangle.fromDegrees(west, south, east, north);
        return radians;
      }
      //当前移动是哪个点，获取新的矩形边界
      var ellipsoid = viewer.scene.globe.ellipsoid;
      var lngArr = [];
      var latArr = [];
      if (
        currentPoint.flag == "westNorth" ||
        currentPoint.flag == "eastSouth"
      ) {
        for (var i = 0; i < points.length; i++) {
          if (points[i].flag == "westNorth" || points[i].flag == "eastSouth") {
            var cartographic = ellipsoid.cartesianToCartographic(points[i]);
            var lng = Cesium.Math.toDegrees(cartographic.longitude);
            var lat = Cesium.Math.toDegrees(cartographic.latitude);
            lngArr.push(lng);
            latArr.push(lat);
          }
        }
      } else if (
        currentPoint.flag == "eastNorth" ||
        currentPoint.flag == "westSouth"
      ) {
        for (var i = 0; i < points.length; i++) {
          if (points[i].flag == "eastNorth" || points[i].flag == "westSouth") {
            var cartographic = ellipsoid.cartesianToCartographic(points[i]);
            var lng = Cesium.Math.toDegrees(cartographic.longitude);
            var lat = Cesium.Math.toDegrees(cartographic.latitude);
            lngArr.push(lng);
            latArr.push(lat);
          }
        }
      } else if (currentPoint.flag == "center") {
        var cartographic = ellipsoid.cartesianToCartographic(
          currentPoint.position._value
        );
        var centerLng = Cesium.Math.toDegrees(cartographic.longitude);
        var centerLat = Cesium.Math.toDegrees(cartographic.latitude);
        //console.log("centerLng",centerLng);
        var rectInfo = rectangle.rectangle.coordinates.getValue();
        //console.log("currentPoint.position",currentPoint.position._value);
        var rectWidth =
          Cesium.Math.toDegrees(rectInfo.east) -
          Cesium.Math.toDegrees(rectInfo.west);
        var rectHeight =
          Cesium.Math.toDegrees(rectInfo.north) -
          Cesium.Math.toDegrees(rectInfo.south);
        //console.log("rectWidth:",rectWidth);
        var rectInfoEast = centerLng + rectWidth / 2;
        lngArr.push(rectInfoEast);
        var rectInfoWest = centerLng - rectWidth / 2;
        lngArr.push(rectInfoWest);
        var rectInfoNorth = centerLat + rectHeight / 2;
        latArr.push(rectInfoNorth);
        var rectInfoSouth = centerLat - rectHeight / 2;
        latArr.push(rectInfoSouth);
        //console.log("rectInfoEast",rectInfoEast);
        //console.log("经度组：",lngArr);
      }
      var east = Math.max.apply(null, lngArr);
      var west = Math.min.apply(null, lngArr);
      var north = Math.max.apply(null, latArr);
      var south = Math.min.apply(null, latArr);
      //更新所有编辑点的位置
      for (var i = 0; i < rectangle.pointsId.length; i++) {
        var id = rectangle.pointsId[i];
        var entityTemp = viewer.entities.getById(id);
        if (
          typeof entityTemp != "undefined" &&
          typeof currentPoint != "undefined"
        ) {
          if (entityTemp.flag != currentPoint.flag) {
            if (entityTemp.flag == "westNorth") {
              entityTemp.position = Cesium.Cartesian3.fromDegrees(west, north);
            } else if (entityTemp.flag == "eastNorth") {
              entityTemp.position = Cesium.Cartesian3.fromDegrees(east, north);
            } else if (entityTemp.flag == "eastSouth") {
              entityTemp.position = Cesium.Cartesian3.fromDegrees(east, south);
            } else if (entityTemp.flag == "westSouth") {
              entityTemp.position = Cesium.Cartesian3.fromDegrees(west, south);
            } else if (entityTemp.flag == "center") {
              var centerLng = (west + east) / 2;
              var centerLat = (north + south) / 2;
              entityTemp.position = Cesium.Cartesian3.fromDegrees(
                centerLng,
                centerLat
              );
            }
          }
        }
        //console.log("坐标：",west, south, east, north);
        if (west >= east || south >= north) {
          currentPoint = undefined;
          return;
        }
        var radians = Cesium.Rectangle.fromDegrees(west, south, east, north);
        //更新矩形位置
        rectangle.rectangle.coordinates = new Cesium.CallbackProperty(function (
          time,
          result
        ) {
          return radians;
        },
        false);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 对鼠标抬起事件的监听
    rectangle.handler.setInputAction((event) => {
      currentPoint = null;
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // 右击事件的监听
    rectangle.handler.setInputAction((event) => {
      the.closeRectangleEdit(rectangle);
      callback(rectangle);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  /**
   * 关闭编辑
   * @param {*} rectangle
   * @returns
   */
  closeRectangleEdit(rectangle) {
    //关闭鼠标提示
    this.closeMouseTip();
    let the = this;
    //鼠标变成加号
    document.getElementById(the.cesiumID).style.cursor = "default";
    //移除地图事件
    rectangle.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    rectangle.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    rectangle.handler.removeInputAction(
      Cesium.ScreenSpaceEventType.RIGHT_CLICK
    );
    rectangle.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

    var dke = rectangle.rectangle.coordinates.getValue();
    var east = Cesium.Math.toDegrees(dke.east);
    var west = Cesium.Math.toDegrees(dke.west);
    var north = Cesium.Math.toDegrees(dke.north);
    var south = Cesium.Math.toDegrees(dke.south);

    rectangle.FFCoordinates.east = east;
    rectangle.FFCoordinates.west = west;
    rectangle.FFCoordinates.north = north;
    rectangle.FFCoordinates.south = south;
    rectangle.FFPosition = Cesium.Rectangle.fromDegrees(
      west,
      south,
      east,
      north
    );

    the.removeFFEntityIDArr(rectangle.pointsId);
    rectangle.pointsId = [];
    return rectangle;
  },

  /**
   * 圆编辑
   * @param {*} circle
   * @param {*} callback
   */
  circleEdit(circle, callback) {
    console.log("circleEdit--circle", circle);
    this.openMouseTip("压住编辑点移动，右击即可完成采集");

    let the = this;
    let viewer = this.viewer;
    let currentPoint = null;
    circle.pointsId = [];
    let degreeMeter = 101194; //经度1度=101194米,该值在不同的纬度上不同的值，可以根据自己的情况进行调整
    document.getElementById(this.cesiumID).style.cursor = "pointer";

    //生成圆心编辑点
    var pointCenter = createGatherPoint(circle.FFPosition, viewer);
    pointCenter.name = "circleCenterEdit_point";
    // let pointCenter = viewer.entities.add({
    //   name: "circleCenterEdit_point",
    //   position: circle.FFPosition,
    //   point: {
    //     color: Cesium.Color.WHITE,
    //     pixelSize: 8,
    //     outlineColor: Cesium.Color.BLACK,
    //     outlineWidth: 1,
    //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
    //   },
    // });
    circle.pointsId.push(pointCenter.id);
    //生成圆边编辑点
    var degreeTemp = circle.FFRadius / degreeMeter;
    var circleBorderCartesian = Cesium.Cartesian3.fromDegrees(
      circle.FFCenterPoint[0] + degreeTemp,
      circle.FFCenterPoint[1],
      circle.FFCenterPoint[2]
    );
    var pointBorder = createGatherPoint(circleBorderCartesian, viewer);
    pointBorder.name = "circleBorderEdit_point";
    // var pointBorder = viewer.entities.add({
    //   name: "circleBorderEdit_point",
    //   position: circleBorderCartesian,
    //   point: {
    //     color: Cesium.Color.WHITE,
    //     pixelSize: 8,
    //     outlineColor: Cesium.Color.BLACK,
    //     outlineWidth: 1,
    //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
    //   },
    // });
    circle.pointsId.push(pointBorder.id);
    //事件
    circle.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    //点击事件
    circle.handler.setInputAction((event) => {
      let windowPosition = event.position;
      let pickedObject = viewer.scene.pick(windowPosition);
      if (Cesium.defined(pickedObject)) {
        if (
          pickedObject.id.name == "circleCenterEdit_point" ||
          pickedObject.id.name == "circleBorderEdit_point"
        ) {
          currentPoint = pickedObject.id;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 对鼠标移动事件的监听
    circle.handler.setInputAction((event) => {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = viewer.camera.getPickRay(event.endPosition);
      var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!cartesian) {
        return;
      }
      if (currentPoint == null) {
        return;
      }
      //更新当前点的位置
      currentPoint.position = cartesian;
      //移动的是半径点，则更新半径
      if (currentPoint.name == "circleBorderEdit_point") {
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        var centerTemp = viewer.scene.globe.ellipsoid.cartesianToCartographic(
          circle.position.getValue(Cesium.JulianDate.now())
        );
        var radiusTemp = viewer.scene.globe.ellipsoid.cartesianToCartographic(
          currentPoint.position.getValue(Cesium.JulianDate.now())
        );
        var geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(centerTemp, radiusTemp);
        var radius = geodesic.surfaceDistance;
        circle.ellipse.semiMinorAxis = new Cesium.CallbackProperty(function (
          time,
          result
        ) {
          return radius;
        },
        false);
        circle.ellipse.semiMajorAxis = new Cesium.CallbackProperty(function (
          time,
          result
        ) {
          return radius;
        },
        false);
      }
      //移动的是圆中心，则更新圆中心
      if (currentPoint.name == "circleCenterEdit_point") {
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        //更新圆边编辑点
        var circleRadius = circle.ellipse.semiMinorAxis.getValue();
        //圆半径换成米
        var degreeTemp = circleRadius / degreeMeter; //该值在不同的纬度上不同的值，可以根据自己的情况进行调整
        //获取圆心（经度）
        var ellipsoid = viewer.scene.globe.ellipsoid;
        var cartographic = ellipsoid.cartesianToCartographic(
          currentPoint.position.getValue(Cesium.JulianDate.now())
        );
        var circleCenterLng = Cesium.Math.toDegrees(cartographic.longitude);
        var circleCenterLat = Cesium.Math.toDegrees(cartographic.latitude);
        //获取圆边经纬度
        var circleBorderCartesian = Cesium.Cartesian3.fromDegrees(
          circleCenterLng + degreeTemp,
          circleCenterLat,
          circle.FFCenterPoint[2]
        );
        for (var i = 0; i < circle.pointsId.length; i++) {
          var entityTemp = viewer.entities.getById(circle.pointsId[i]);
          if (entityTemp.name == "circleBorderEdit_point") {
            entityTemp.position = circleBorderCartesian;
          }
        }
        //更新圆中心点
        var positionTemp = currentPoint.position.getValue(
          Cesium.JulianDate.now()
        );
        circle.position = new Cesium.CallbackProperty(function (time, result) {
          return positionTemp;
        }, false);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 对鼠标抬起事件的监听
    circle.handler.setInputAction((event) => {
      currentPoint = null;
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // 右击事件的监听
    circle.handler.setInputAction((event) => {
      the.closeCircleEdit(circle);
      callback(circle);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  closeCircleEdit(circle) {
    //关闭鼠标提示
    this.closeMouseTip();
    let the = this;
    //鼠标变成加号
    document.getElementById(the.cesiumID).style.cursor = "default";
    //移除地图事件
    circle.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    circle.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    circle.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    circle.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

    // var circle_center_cartesian = circle.position.getValue(
    //   Cesium.JulianDate.now()
    // );
    // var ellipsoid = viewer.scene.globe.ellipsoid;
    // var cartographic = ellipsoid.cartesianToCartographic(
    //   circle_center_cartesian
    // );
    // var lat = Cesium.Math.toDegrees(cartographic.latitude);
    // var lng = Cesium.Math.toDegrees(cartographic.longitude);

    // circle.FFCenterPoint = [lng, lat, circle.FFCenterPoint[2]];
    // circle.FFRadius = circle.ellipse.semiMinorAxis.getValue();
    // circle.FFPosition = circle_center_cartesian;
    //设置属性
    the.setAttributeForEntity(circle, circle.FFOption, "circle");

    the.removeFFEntityIDArr(circle.pointsId);
    circle.pointsId = [];
    return circle;
  },

  /**
   * 面修改
   * @param {*} polygon
   * @param {*} callback
   */
  polygonEdit(polygon, callback) {
    this.openMouseTip("压住编辑点移动，右击即可完成采集");
    let the = this;
    let viewer = this.viewer;
    polygon.pointsId = [];
    polygon.halfPointsId = [];
    let currentPoint = null;
    if (!polygon.id) {
      polygon.id = "polygonEdit_" + new Date().getTime() + "_" + Math.random();
    }
    document.getElementById(this.cesiumID).style.cursor = "pointer";
    //叠加编辑点
    for (var i = 0; i < polygon.FFPosition.length; i++) {
      var cartesian = polygon.FFPosition[i];
      var point = createGatherPoint(cartesian, viewer);
      point.name = "polygonEdit_point";
      // var point = viewer.entities.add({
      //   name: "polygonEdit_point",
      //   position: cartesian,
      //   point: {
      //     color: Cesium.Color.WHITE,
      //     pixelSize: 8,
      //     outlineColor: Cesium.Color.BLACK,
      //     outlineWidth: 1,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
      //   },
      // });
      polygon.pointsId.push(point.id);
    }
    //叠加half采集点
    for (var i = 0; i < polygon.FFPosition.length; i++) {
      let cartesian = null;
      if (i == polygon.FFPosition.length - 1) {
        var halfX = (polygon.FFPosition[i].x + polygon.FFPosition[0].x) / 2;
        var halfY = (polygon.FFPosition[i].y + polygon.FFPosition[0].y) / 2;
        var halfZ = (polygon.FFPosition[i].z + polygon.FFPosition[0].z) / 2;
        cartesian = new Cesium.Cartesian3(halfX, halfY, halfZ);
      } else {
        var halfX = (polygon.FFPosition[i].x + polygon.FFPosition[i + 1].x) / 2;
        var halfY = (polygon.FFPosition[i].y + polygon.FFPosition[i + 1].y) / 2;
        var halfZ = (polygon.FFPosition[i].z + polygon.FFPosition[i + 1].z) / 2;
        cartesian = new Cesium.Cartesian3(halfX, halfY, halfZ);
      }

      var pointEntity = createHalfGatherPoint(cartesian, viewer);
      pointEntity.name = "polygonEdit_half_point";

      // var pointEntity = {
      //   name: "polygonEdit_half_point",
      //   position: cartesian,
      //   point: {
      //     color: Cesium.Color.RED,
      //     pixelSize: 8,
      //     outlineColor: Cesium.Color.BLACK,
      //     outlineWidth: 1,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
      //   },
      // };
      if (i == polygon.pointsId.length - 1) {
        pointEntity.positionFlag = [i, 0];
      } else {
        pointEntity.positionFlag = [i, i + 1];
      }
      // var point = viewer.entities.add(pointEntity);
      console.log("pointEntity", pointEntity);
      polygon.halfPointsId.push(pointEntity.id);
    }

    //事件
    polygon.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    polygon.handler.setInputAction((event) => {
      let windowPosition = event.position;
      let pickedObject = viewer.scene.pick(windowPosition);
      if (Cesium.defined(pickedObject)) {
        let entity = pickedObject.id;
        if (entity.name === "polygonEdit_point") {
          currentPoint = entity;
        } else if (entity.name === "polygonEdit_half_point") {
          let ellipsoid = viewer.scene.globe.ellipsoid;
          let cartesian = viewer.camera.pickEllipsoid(
            windowPosition,
            ellipsoid
          );
          if (!cartesian) {
            return;
          }
          // var point = viewer.entities.add({
          //   name: "polygonEdit_point",
          //   position: cartesian,
          //   point: {
          //     color: Cesium.Color.WHITE,
          //     pixelSize: 8,
          //     outlineColor: Cesium.Color.BLACK,
          //     outlineWidth: 1,
          //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
          //   },
          // });
          var point = createGatherPoint(cartesian, viewer);
          point.name = "polygonEdit_point";
          currentPoint = point;
          //线半点变成线上点
          polygon.pointsId.splice(entity.positionFlag[0] + 1, 0, point.id);
          //删除所有线半点
          for (var i = 0; i < polygon.halfPointsId.length; i++) {
            viewer.entities.remove(
              viewer.entities.getById(polygon.halfPointsId[i])
            );
          }
          polygon.halfPointsId = [];
          //重新生成所有线半点
          console.log("polygon.pointsId123", polygon.pointsId);
          for (var i = 0; i < polygon.pointsId.length; i++) {
            var oneTemp = null;
            var twoTemp = null;
            if (i == polygon.pointsId.length - 1) {
              oneTemp = viewer.entities.getById(polygon.pointsId[i]).position
                ._value;
              twoTemp = viewer.entities.getById(polygon.pointsId[0]).position
                ._value;
            } else {
              oneTemp = viewer.entities.getById(polygon.pointsId[i]).position
                ._value;
              twoTemp = viewer.entities.getById(polygon.pointsId[i + 1])
                .position._value;
            }
            var halfX = (oneTemp.x + twoTemp.x) / 2;
            var halfY = (oneTemp.y + twoTemp.y) / 2;
            var halfZ = (oneTemp.z + twoTemp.z) / 2;
            var cartesianHalf = new Cesium.Cartesian3(halfX, halfY, halfZ);

            var pointEntity = createHalfGatherPoint(cartesianHalf, viewer);
            pointEntity.name = "polygonEdit_half_point";
            // var pointEntity = {
            //   name: "polygonEdit_half_point",
            //   position: cartesianHalf,
            //   point: {
            //     color: Cesium.Color.RED,
            //     pixelSize: 8,
            //     outlineColor: Cesium.Color.BLACK,
            //     outlineWidth: 1,
            //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
            //   },
            // };
            if (i == polygon.pointsId.length - 1) {
              pointEntity.positionFlag = [i, 0];
            } else {
              pointEntity.positionFlag = [i, i + 1];
            }
            // var point = viewer.entities.add(pointEntity);
            polygon.halfPointsId.push(pointEntity.id);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 对鼠标移动事件的监听
    polygon.handler.setInputAction((event) => {
      if (currentPoint && currentPoint.name == "polygonEdit_point") {
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        var ray = viewer.camera.getPickRay(event.endPosition);
        var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        let points = [];
        if (!cartesian) {
          return;
        }
        currentPoint.position = cartesian;
        for (var i = 0; i < polygon.pointsId.length; i++) {
          if (currentPoint.id == polygon.pointsId[i]) {
            points.push(currentPoint.position._value);
          } else {
            var id = polygon.pointsId[i];
            points.push(viewer.entities.getById(id).position._value);
          }
        }

        //更新线上中心点位置信息
        for (var i = 0; i < polygon.halfPointsId.length; i++) {
          var entityTemp = viewer.entities.getById(polygon.halfPointsId[i]);
          if (typeof entityTemp != "undefined") {
            //console.log("entityTemp123", entityTemp);
            var oneTemp = entityTemp.positionFlag[0];
            var twoTemp = entityTemp.positionFlag[1];
            if (
              typeof points[oneTemp] != "undefined" &&
              typeof points[twoTemp] != "undefined"
            ) {
              var halfX = (points[oneTemp].x + points[twoTemp].x) / 2;
              var halfY = (points[oneTemp].y + points[twoTemp].y) / 2;
              var halfZ = (points[oneTemp].z + points[twoTemp].z) / 2;
              var cartesian = new Cesium.Cartesian3(halfX, halfY, halfZ);
              entityTemp.position = cartesian;
            }
          }
        }

        polygon.polygon.hierarchy = new Cesium.CallbackProperty(function (
          time,
          result
        ) {
          var hierarchyTemp = new Cesium.PolygonHierarchy(points, null);
          return hierarchyTemp;
        },
        false);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 对鼠标抬起事件的监听
    polygon.handler.setInputAction((event) => {
      currentPoint = null;
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // 右击事件的监听
    polygon.handler.setInputAction((event) => {
      the.closePolygonEdit(polygon);
      callback(polygon);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  closePolygonEdit(polygon) {
    //关闭鼠标提示
    this.closeMouseTip();
    let the = this;
    //鼠标变成加号
    document.getElementById(the.cesiumID).style.cursor = "default";
    //移除地图事件
    polygon.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    polygon.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    polygon.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    polygon.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

    let lngLatHeightArr = the.cartesian3ArrToLngLatHeightArr(
      polygon.polygon.hierarchy.getValue().positions
    );

    polygon.FFCoordinates = lngLatHeightArr;
    polygon.FFPosition = polygon.polygon.hierarchy.getValue().positions;
    the.removeFFEntityIDArr(polygon.pointsId);
    polygon.pointsId = [];
    the.removeFFEntityIDArr(polygon.halfPointsId);
    polygon.halfPointsId = [];
    return polygon;
  },
  /**
   * 线编辑
   * @param {*} polyline
   * @param {*} callback
   */
  polylineEdit(polyline, callback) {
    this.openMouseTip("压住编辑点移动，右击即可完成采集");
    let the = this;
    let viewer = this.viewer;

    polyline.pointsId = [];
    polyline.halfPointsId = [];
    let currentPoint = null;

    if (!polyline.id) {
      polyline.id =
        "polylineEdit_" + new Date().getTime() + "_" + Math.random();
    }
    document.getElementById(this.cesiumID).style.cursor = "pointer";
    //叠加编辑点
    for (var i = 0; i < polyline.FFPosition.length; i++) {
      var cartesian = polyline.FFPosition[i];
      // var point = viewer.entities.add({
      //   name: "polylineEdit_point",
      //   position: cartesian,
      //   point: {
      //     color: Cesium.Color.WHITE,
      //     pixelSize: 8,
      //     outlineColor: Cesium.Color.BLACK,
      //     outlineWidth: 1,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
      //   },
      // });
      var point = createGatherPoint(cartesian, viewer);
      point.name = "polylineEdit_point";
      polyline.pointsId.push(point.id);
    }
    //叠加half采集点
    for (var i = 0; i < polyline.FFPosition.length - 1; i++) {
      var halfX = (polyline.FFPosition[i].x + polyline.FFPosition[i + 1].x) / 2;
      var halfY = (polyline.FFPosition[i].y + polyline.FFPosition[i + 1].y) / 2;
      var halfZ = (polyline.FFPosition[i].z + polyline.FFPosition[i + 1].z) / 2;
      var cartesian = new Cesium.Cartesian3(halfX, halfY, halfZ);

      var pointEntity = createHalfGatherPoint(cartesian, viewer);
      pointEntity.name = "polylineEdit_half_point";

      // var pointEntity = {
      //   name: "polylineEdit_half_point",
      //   position: cartesian,
      //   point: {
      //     color: Cesium.Color.RED,
      //     pixelSize: 8,
      //     outlineColor: Cesium.Color.BLACK,
      //     outlineWidth: 1,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
      //   },
      // };
      pointEntity.positionFlag = [i, i + 1];
      // var point = viewer.entities.add(pointEntity);
      polyline.halfPointsId.push(pointEntity.id);
    }
    //事件
    polyline.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    polyline.handler.setInputAction((event) => {
      let windowPosition = event.position;
      let pickedObject = viewer.scene.pick(windowPosition);
      if (Cesium.defined(pickedObject)) {
        let entity = pickedObject.id;
        if (entity.name === "polylineEdit_point") {
          currentPoint = entity;
        }
        //点击中间点则生成新的中间点
        if (entity.name === "polylineEdit_half_point") {
          let ellipsoid = viewer.scene.globe.ellipsoid;
          let cartesian = viewer.camera.pickEllipsoid(
            windowPosition,
            ellipsoid
          );
          if (!cartesian) {
            return;
          }
          // var entityTemp = {
          //   name: "polylineEdit_point",
          //   position: cartesian,
          //   point: {
          //     color: Cesium.Color.WHITE,
          //     pixelSize: 8,
          //     outlineColor: Cesium.Color.BLACK,
          //     outlineWidth: 1,
          //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
          //   },
          // };
          // var point = viewer.entities.add(entityTemp);
          var point = createGatherPoint(cartesian, viewer);
          point.name = "polylineEdit_point";
          currentPoint = point;
          //线半点变成线上点
          polyline.pointsId.splice(entity.positionFlag[0] + 1, 0, point.id);
          //删除所有线半点
          for (var i = 0; i < polyline.halfPointsId.length; i++) {
            viewer.entities.remove(
              viewer.entities.getById(polyline.halfPointsId[i])
            );
          }
          polyline.halfPointsId = [];
          //重新生成所有线半点
          //console.log("pointsId",pointsId);
          for (var i = 0; i < polyline.pointsId.length - 1; i++) {
            var oneTemp = viewer.entities.getById(polyline.pointsId[i]).position
              ._value;
            var twoTemp = viewer.entities.getById(polyline.pointsId[i + 1])
              .position._value;
            var halfX = (oneTemp.x + twoTemp.x) / 2;
            var halfY = (oneTemp.y + twoTemp.y) / 2;
            var halfZ = (oneTemp.z + twoTemp.z) / 2;
            var cartesianHalf = new Cesium.Cartesian3(halfX, halfY, halfZ);
            var pointEntity = createHalfGatherPoint(cartesianHalf, viewer);
            pointEntity.name = "polylineEdit_half_point";
            // var pointEntity = {
            //   name: "polylineEdit_half_point",
            //   position: cartesianHalf,
            //   point: {
            //     color: Cesium.Color.RED,
            //     pixelSize: 8,
            //     outlineColor: Cesium.Color.BLACK,
            //     outlineWidth: 1,
            //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
            //   },
            // };
            pointEntity.positionFlag = [i, i + 1];
            //var point = viewer.entities.add(pointEntity);
            polyline.halfPointsId.push(pointEntity.id);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 对鼠标移动事件的监听
    polyline.handler.setInputAction((event) => {
      //console.log("currentPoint11",currentPoint);
      if (currentPoint && currentPoint.name == "polylineEdit_point") {
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        //线上的点
        //获取加载地形后对应的经纬度和高程：地标坐标
        var ray = viewer.camera.getPickRay(event.endPosition);
        var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        let points = [];
        if (!cartesian) {
          return;
        }
        currentPoint.position = cartesian;
        for (var i = 0; i < polyline.pointsId.length; i++) {
          if (currentPoint.id == polyline.pointsId[i]) {
            points.push(currentPoint.position._value);
          } else {
            var id = polyline.pointsId[i];
            points.push(viewer.entities.getById(id).position._value);
          }
        }
        polyline.polyline.positions = new Cesium.CallbackProperty(function (
          time,
          result
        ) {
          //更新线上中心点位置信息
          for (var i = 0; i < polyline.halfPointsId.length; i++) {
            var entityTemp = viewer.entities.getById(polyline.halfPointsId[i]);
            if (typeof entityTemp != "undefined") {
              var oneTemp = entityTemp.positionFlag[0];
              var twoTemp = entityTemp.positionFlag[1];
              if (
                typeof points[oneTemp] != "undefined" &&
                typeof points[twoTemp] != "undefined"
              ) {
                var halfX = (points[oneTemp].x + points[twoTemp].x) / 2;
                var halfY = (points[oneTemp].y + points[twoTemp].y) / 2;
                var halfZ = (points[oneTemp].z + points[twoTemp].z) / 2;
                var cartesian = new Cesium.Cartesian3(halfX, halfY, halfZ);
                entityTemp.position = cartesian;
              }
            }
          }
          return points;
        },
        false);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标弹起的监听
    polyline.handler.setInputAction((event) => {
      currentPoint = null;
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // 右击事件的监听
    polyline.handler.setInputAction((event) => {
      the.closePolylineEdit(polyline);
      callback(polyline);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },

  closePolylineEdit(polyline) {
    //关闭鼠标提示
    this.closeMouseTip();
    let the = this;
    //鼠标变成加号
    document.getElementById(the.cesiumID).style.cursor = "default";
    //移除地图事件
    polyline.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    polyline.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    polyline.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    polyline.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    // let FFCoordinates = the.cartesian3ArrToLngLatHeightArr(
    //   polyline.polyline.positions.getValue()
    // );
    // polyline.FFCoordinates = FFCoordinates;
    // polyline.FFPosition = polyline.polyline.positions.getValue();
    the.setAttributeForEntity(polyline, polyline.FFOption, "polyline");
    the.removeFFEntityIDArr(polyline.pointsId);
    polyline.pointsId = [];
    the.removeFFEntityIDArr(polyline.halfPointsId);
    polyline.halfPointsId = [];
    return polyline;
  },

  //点修改
  pointEdit(point, callback) {
    this.openMouseTip("压住编辑点移动，右击即可完成采集");
    let the = this;
    let viewer = this.viewer;
    point.timer = null;
    point.isEditting = false;

    // point.point.color = new Cesium.Color.fromCssColorString(point.FFOption.color).withAlpha(0.5);
    point.point.outlineWidth = 4;
    point.point.outlineColor = new Cesium.Color.fromCssColorString(
      "#0000FF"
    ).withAlpha(1);
    if (!point.id) {
      point.id = "pointEdit_" + new Date().getTime() + "_" + Math.random();
    }
    document.getElementById(this.cesiumID).style.cursor = "pointer";
    point.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    //鼠标点击事件
    point.handler.setInputAction((event) => {
      let pickedObject = viewer.scene.pick(event.position);
      if (Cesium.defined(pickedObject)) {
        if (pickedObject.id.id == point.id && !point.isEditting) {
          point.isEditting = true;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 对鼠标移动事件的监听
    point.handler.setInputAction((event) => {
      if (point.isEditting) {
        //限制地图操作
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        var ray = viewer.camera.getPickRay(event.endPosition);
        var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (!cartesian) {
          return;
        }
        point.position = cartesian;
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 对鼠标抬起事件的监听(结束点采集)
    point.handler.setInputAction((event) => {
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
      point.isEditting = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    point.handler.setInputAction((event) => {
      the.closePointEdit(point);
      callback(point);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  closePointEdit(point) {
    //关闭鼠标提示
    this.closeMouseTip();
    let the = this;
    //鼠标变成加号
    document.getElementById(the.cesiumID).style.cursor = "default";
    //移除地图事件
    point.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    point.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    point.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    point.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    point.isEditting = false;
    // point.point.color = new Cesium.Color.fromCssColorString(point.point.color._value.toCssHexString()).withAlpha(1);
    point.point.outlineWidth = 0;
    the.setAttributeForEntity(point, point.FFOption, "point");
  },
  //图标点修改
  billboardEdit(billboard, callback) {
    this.openMouseTip("压住图标点移动，右击即可完成采集");
    let the = this;
    let viewer = this.viewer;
    billboard.timer = null;
    billboard.isEditting = false;
    billboard.billboard.color = new Cesium.Color.fromCssColorString(
      "#FFFFFF"
    ).withAlpha(0.6);
    if (!billboard.id) {
      billboard.id =
        "billboardEdit_" + new Date().getTime() + "_" + Math.random();
    }
    document.getElementById(this.cesiumID).style.cursor = "pointer";
    billboard.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    //鼠标点击事件
    billboard.handler.setInputAction((event) => {
      let pickedObject = viewer.scene.pick(event.position);
      console.log("pickedObject1232", pickedObject);
      if (Cesium.defined(pickedObject)) {
        if (pickedObject.id.id == billboard.id && !billboard.isEditting) {
          //billboard.point.color = Cesium.Color.RED;
          billboard.isEditting = true;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 对鼠标移动事件的监听
    billboard.handler.setInputAction((event) => {
      if (billboard.isEditting) {
        //限制地图操作
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        var ray = viewer.camera.getPickRay(event.endPosition);
        var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (!cartesian) {
          return;
        }
        billboard.position = cartesian;
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 对鼠标抬起事件的监听(结束点采集)
    billboard.handler.setInputAction((event) => {
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
      billboard.isEditting = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    billboard.handler.setInputAction((event) => {
      the.closeBillboardEdit(billboard);
      callback(billboard);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  closeBillboardEdit(billboard) {
    //关闭鼠标提示
    this.closeMouseTip();
    let the = this;
    //鼠标变成加号
    document.getElementById(the.cesiumID).style.cursor = "default";
    //移除地图事件
    billboard.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    billboard.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    billboard.handler.removeInputAction(
      Cesium.ScreenSpaceEventType.RIGHT_CLICK
    );
    billboard.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    billboard.isEditting = false;
    billboard.billboard.color = new Cesium.Color.fromCssColorString(
      "#FFFFFF"
    ).withAlpha(1);
    the.setAttributeForEntity(billboard, billboard.FFOption, "billboard");
  },
};
