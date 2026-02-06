import * as Cesium from "cesium";
import { createGatherPoint, createHalfGatherPoint } from "./LogicClass/common.js";
import ElementEditLogic from "./LogicClass/ElementEditLogic.js";

/**
 * 元素编辑类
 */
class ElementEditClass {
    rectangleEditInfo = "矩形编辑方法(rectangleEdit)";
    closeRectangleEditInfo = "关闭矩形编辑方法(closeRectangleEdit)";
    circleEditInfo = "圆编辑方法(circleEdit)";
    closeCircleEditInfo = "关闭圆编辑方法(closeCircleEdit)";
    polygonEditInfo = "面编辑方法(polygonEdit)";
    closePolygonEditInfo = "关闭面编辑方法(closePolygonEdit)";
    polylineEditInfo = "线编辑方法(polylineEdit)";
    closePolylineEditInfo = "关闭线编辑方法(closePolylineEdit)";
    pointEditInfo = "点编辑方法(pointEdit)";
    closePointEditInfo = "关闭点编辑方法(closePointEdit)";
    billboardEditInfo = "图标编辑方法(billboardEdit)";
    closeBillboardEditInfo = "关闭图标编辑方法(closeBillboardEdit)";
    constructor(ffCesium) {
        this.ffCesium = ffCesium;
        this.viewer = ffCesium.viewer;
        this.cesiumID = ffCesium.cesiumID;
        this.elementEditLogic = new ElementEditLogic();
    }

    rectangleEdit(rectangle, callback) {
        console.log("rectangleEdit--rectangle", rectangle);
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");
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
            point.flag = cartesian.flag;
            rectangle.pointsId.push(point.id);
        }

        // 生成中心编辑点
        var centerLng = (degrees.west + degrees.east) / 2;
        var centerLat = (degrees.north + degrees.south) / 2;
        var rect_center_cartesian = Cesium.Cartesian3.fromRadians(centerLng, centerLat);

        var pointTemp = createGatherPoint(rect_center_cartesian, viewer);
        pointTemp.name = "rectangleCenterEdit_point";
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
                if (entity.name == "rectangleBorderEdit_point" || entity.name == "rectangleCenterEdit_point") {
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
                return;
            }
            //当前移动是哪个点，获取新的矩形边界
            var ellipsoid = viewer.scene.globe.ellipsoid;
            var lngArr = [];
            var latArr = [];
            if (currentPoint.flag == "westNorth" || currentPoint.flag == "eastSouth") {
                for (var i = 0; i < points.length; i++) {
                    if (points[i].flag == "westNorth" || points[i].flag == "eastSouth") {
                        var cartographic = ellipsoid.cartesianToCartographic(points[i]);
                        var lng = Cesium.Math.toDegrees(cartographic.longitude);
                        var lat = Cesium.Math.toDegrees(cartographic.latitude);
                        lngArr.push(lng);
                        latArr.push(lat);
                    }
                }
            } else if (currentPoint.flag == "eastNorth" || currentPoint.flag == "westSouth") {
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
                var cartographic = ellipsoid.cartesianToCartographic(currentPoint.position._value);
                var centerLng = Cesium.Math.toDegrees(cartographic.longitude);
                var centerLat = Cesium.Math.toDegrees(cartographic.latitude);
                var rectInfo = rectangle.rectangle.coordinates.getValue();
                var rectWidth = Cesium.Math.toDegrees(rectInfo.east) - Cesium.Math.toDegrees(rectInfo.west);
                var rectHeight = Cesium.Math.toDegrees(rectInfo.north) - Cesium.Math.toDegrees(rectInfo.south);
                var rectInfoEast = centerLng + rectWidth / 2;
                lngArr.push(rectInfoEast);
                var rectInfoWest = centerLng - rectWidth / 2;
                lngArr.push(rectInfoWest);
                var rectInfoNorth = centerLat + rectHeight / 2;
                latArr.push(rectInfoNorth);
                var rectInfoSouth = centerLat - rectHeight / 2;
                latArr.push(rectInfoSouth);
            }
            var east = Math.max.apply(null, lngArr);
            var west = Math.min.apply(null, lngArr);
            var north = Math.max.apply(null, latArr);
            var south = Math.min.apply(null, latArr);
            //更新所有编辑点的位置
            for (var i = 0; i < rectangle.pointsId.length; i++) {
                var id = rectangle.pointsId[i];
                var entityTemp = viewer.entities.getById(id);
                if (typeof entityTemp != "undefined" && typeof currentPoint != "undefined") {
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
                            entityTemp.position = Cesium.Cartesian3.fromDegrees(centerLng, centerLat);
                        }
                    }
                }
                if (west >= east || south >= north) {
                    currentPoint = undefined;
                    return;
                }
                var radians = Cesium.Rectangle.fromDegrees(west, south, east, north);
                //更新矩形位置
                rectangle.rectangle.coordinates = new Cesium.CallbackProperty(function (time, result) {
                    return radians;
                }, false);
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
    }

    closeRectangleEdit(rectangle) {
        this.ffCesium.mapToolClass.closeMouseTip();
        let the = this;
        document.getElementById(the.cesiumID).style.cursor = "default";
        rectangle.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        rectangle.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        rectangle.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
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
        rectangle.FFPosition = Cesium.Rectangle.fromDegrees(west, south, east, north);

        this.ffCesium.entityClass.removeFFEntityIDArr(rectangle.pointsId);
        rectangle.pointsId = [];
        return rectangle;
    }

    circleEdit(circle, callback) {
        console.log("circleEdit--circle", circle);
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");

        let the = this;
        let viewer = this.viewer;
        let currentPoint = null;
        circle.pointsId = [];
        let degreeMeter = 101194;
        document.getElementById(this.cesiumID).style.cursor = "pointer";

        var pointCenter = createGatherPoint(circle.FFPosition, viewer);
        pointCenter.name = "circleCenterEdit_point";
        circle.pointsId.push(pointCenter.id);

        var degreeTemp = circle.FFRadius / degreeMeter;
        var circleBorderCartesian = Cesium.Cartesian3.fromDegrees(circle.FFCenterPoint[0] + degreeTemp, circle.FFCenterPoint[1], circle.FFCenterPoint[2]);
        var pointBorder = createGatherPoint(circleBorderCartesian, viewer);
        pointBorder.name = "circleBorderEdit_point";
        circle.pointsId.push(pointBorder.id);

        circle.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        circle.handler.setInputAction((event) => {
            let windowPosition = event.position;
            let pickedObject = viewer.scene.pick(windowPosition);
            if (Cesium.defined(pickedObject)) {
                if (pickedObject.id.name == "circleCenterEdit_point" || pickedObject.id.name == "circleBorderEdit_point") {
                    currentPoint = pickedObject.id;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        circle.handler.setInputAction((event) => {
            var ray = viewer.camera.getPickRay(event.endPosition);
            var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (!cartesian) {
                return;
            }
            if (currentPoint == null) {
                return;
            }
            currentPoint.position = cartesian;
            if (currentPoint.name == "circleBorderEdit_point") {
                viewer.scene.screenSpaceCameraController.enableRotate = false;
                viewer.scene.screenSpaceCameraController.enableZoom = false;
                var centerTemp = viewer.scene.globe.ellipsoid.cartesianToCartographic(circle.position.getValue(Cesium.JulianDate.now()));
                var radiusTemp = viewer.scene.globe.ellipsoid.cartesianToCartographic(currentPoint.position.getValue(Cesium.JulianDate.now()));
                var geodesic = new Cesium.EllipsoidGeodesic();
                geodesic.setEndPoints(centerTemp, radiusTemp);
                var radius = geodesic.surfaceDistance;
                circle.ellipse.semiMinorAxis = new Cesium.CallbackProperty(function (time, result) {
                    return radius;
                }, false);
                circle.ellipse.semiMajorAxis = new Cesium.CallbackProperty(function (time, result) {
                    return radius;
                }, false);
            }
            if (currentPoint.name == "circleCenterEdit_point") {
                viewer.scene.screenSpaceCameraController.enableRotate = false;
                viewer.scene.screenSpaceCameraController.enableZoom = false;
                var circleRadius = circle.ellipse.semiMinorAxis.getValue();
                var degreeTemp = circleRadius / degreeMeter;
                var ellipsoid = viewer.scene.globe.ellipsoid;
                var cartographic = ellipsoid.cartesianToCartographic(currentPoint.position.getValue(Cesium.JulianDate.now()));
                var circleCenterLng = Cesium.Math.toDegrees(cartographic.longitude);
                var circleCenterLat = Cesium.Math.toDegrees(cartographic.latitude);
                var circleBorderCartesian = Cesium.Cartesian3.fromDegrees(circleCenterLng + degreeTemp, circleCenterLat, circle.FFCenterPoint[2]);
                for (var i = 0; i < circle.pointsId.length; i++) {
                    var entityTemp = viewer.entities.getById(circle.pointsId[i]);
                    if (entityTemp.name == "circleBorderEdit_point") {
                        entityTemp.position = circleBorderCartesian;
                    }
                }
                var positionTemp = currentPoint.position.getValue(Cesium.JulianDate.now());
                circle.position = new Cesium.CallbackProperty(function (time, result) {
                    return positionTemp;
                }, false);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        circle.handler.setInputAction((event) => {
            currentPoint = null;
            viewer.scene.screenSpaceCameraController.enableRotate = true;
            viewer.scene.screenSpaceCameraController.enableZoom = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        circle.handler.setInputAction((event) => {
            the.closeCircleEdit(circle);
            callback(circle);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    closeCircleEdit(circle) {
        this.ffCesium.mapToolClass.closeMouseTip();
        let the = this;
        document.getElementById(the.cesiumID).style.cursor = "default";
        circle.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        circle.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        circle.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        circle.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

        this.ffCesium.mapUtilClass.setAttributeForEntity(circle, circle.FFOption, "circle");
        this.ffCesium.entityClass.removeFFEntityIDArr(circle.pointsId);
        circle.pointsId = [];
        return circle;
    }

    polygonEdit(polygon, callback) {
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");
        let the = this;
        let viewer = this.viewer;
        polygon.pointsId = [];
        polygon.halfPointsId = [];
        let currentPoint = null;
        if (!polygon.id) {
            polygon.id = "polygonEdit_" + new Date().getTime() + "_" + Math.random();
        }
        document.getElementById(this.cesiumID).style.cursor = "pointer";
        for (var i = 0; i < polygon.FFPosition.length; i++) {
            var cartesian = polygon.FFPosition[i];
            var point = createGatherPoint(cartesian, viewer);
            point.name = "polygonEdit_point";
            polygon.pointsId.push(point.id);
        }
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
            if (i == polygon.pointsId.length - 1) {
                pointEntity.positionFlag = [i, 0];
            } else {
                pointEntity.positionFlag = [i, i + 1];
            }
            polygon.halfPointsId.push(pointEntity.id);
        }

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
                    let cartesian = viewer.camera.pickEllipsoid(windowPosition, ellipsoid);
                    if (!cartesian) {
                        return;
                    }
                    var point = createGatherPoint(cartesian, viewer);
                    point.name = "polygonEdit_point";
                    currentPoint = point;
                    polygon.pointsId.splice(entity.positionFlag[0] + 1, 0, point.id);
                    for (var i = 0; i < polygon.halfPointsId.length; i++) {
                        viewer.entities.remove(viewer.entities.getById(polygon.halfPointsId[i]));
                    }
                    polygon.halfPointsId = [];
                    for (var i = 0; i < polygon.pointsId.length; i++) {
                        var oneTemp = null;
                        var twoTemp = null;
                        if (i == polygon.pointsId.length - 1) {
                            oneTemp = viewer.entities.getById(polygon.pointsId[i]).position._value;
                            twoTemp = viewer.entities.getById(polygon.pointsId[0]).position._value;
                        } else {
                            oneTemp = viewer.entities.getById(polygon.pointsId[i]).position._value;
                            twoTemp = viewer.entities.getById(polygon.pointsId[i + 1]).position._value;
                        }
                        var halfX = (oneTemp.x + twoTemp.x) / 2;
                        var halfY = (oneTemp.y + twoTemp.y) / 2;
                        var halfZ = (oneTemp.z + twoTemp.z) / 2;
                        var cartesianHalf = new Cesium.Cartesian3(halfX, halfY, halfZ);

                        var pointEntity = createHalfGatherPoint(cartesianHalf, viewer);
                        pointEntity.name = "polygonEdit_half_point";
                        if (i == polygon.pointsId.length - 1) {
                            pointEntity.positionFlag = [i, 0];
                        } else {
                            pointEntity.positionFlag = [i, i + 1];
                        }
                        polygon.halfPointsId.push(pointEntity.id);
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

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
                for (var i = 0; i < polygon.halfPointsId.length; i++) {
                    var entityTemp = viewer.entities.getById(polygon.halfPointsId[i]);
                    if (typeof entityTemp != "undefined") {
                        var oneTemp = entityTemp.positionFlag[0];
                        var twoTemp = entityTemp.positionFlag[1];
                        if (typeof points[oneTemp] != "undefined" && typeof points[twoTemp] != "undefined") {
                            var halfX = (points[oneTemp].x + points[twoTemp].x) / 2;
                            var halfY = (points[oneTemp].y + points[twoTemp].y) / 2;
                            var halfZ = (points[oneTemp].z + points[twoTemp].z) / 2;
                            var cartesian = new Cesium.Cartesian3(halfX, halfY, halfZ);
                            entityTemp.position = cartesian;
                        }
                    }
                }
                polygon.polygon.hierarchy = new Cesium.CallbackProperty(function (time, result) {
                    var hierarchyTemp = new Cesium.PolygonHierarchy(points, null);
                    return hierarchyTemp;
                }, false);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        polygon.handler.setInputAction((event) => {
            currentPoint = null;
            viewer.scene.screenSpaceCameraController.enableRotate = true;
            viewer.scene.screenSpaceCameraController.enableZoom = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        polygon.handler.setInputAction((event) => {
            the.closePolygonEdit(polygon);
            callback(polygon);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    closePolygonEdit(polygon) {
        this.ffCesium.mapToolClass.closeMouseTip();
        let the = this;
        document.getElementById(the.cesiumID).style.cursor = "default";
        polygon.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        polygon.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        polygon.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        polygon.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

        this.ffCesium.mapUtilClass.setAttributeForEntity(polygon, polygon.FFOption, "polygon");
        this.ffCesium.entityClass.removeFFEntityIDArr(polygon.pointsId);
        polygon.pointsId = [];
        this.ffCesium.entityClass.removeFFEntityIDArr(polygon.halfPointsId);
        polygon.halfPointsId = [];
        return polygon;
    }

    polylineEdit(polyline, callback) {
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");
        let the = this;
        let viewer = this.viewer;
        polyline.pointsId = [];
        polyline.halfPointsId = [];
        let currentPoint = null;
        if (!polyline.id) {
            polyline.id = "polylineEdit_" + new Date().getTime() + "_" + Math.random();
        }
        document.getElementById(this.cesiumID).style.cursor = "pointer";
        for (var i = 0; i < polyline.FFPosition.length; i++) {
            var cartesian = polyline.FFPosition[i];
            var point = createGatherPoint(cartesian, viewer);
            point.name = "polylineEdit_point";
            polyline.pointsId.push(point.id);
        }
        for (var i = 0; i < polyline.FFPosition.length - 1; i++) {
            var halfX = (polyline.FFPosition[i].x + polyline.FFPosition[i + 1].x) / 2;
            var halfY = (polyline.FFPosition[i].y + polyline.FFPosition[i + 1].y) / 2;
            var halfZ = (polyline.FFPosition[i].z + polyline.FFPosition[i + 1].z) / 2;
            var cartesian = new Cesium.Cartesian3(halfX, halfY, halfZ);
            var pointEntity = createHalfGatherPoint(cartesian, viewer);
            pointEntity.name = "polylineEdit_half_point";
            pointEntity.positionFlag = [i, i + 1];
            polyline.halfPointsId.push(pointEntity.id);
        }
        polyline.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        polyline.handler.setInputAction((event) => {
            let windowPosition = event.position;
            let pickedObject = viewer.scene.pick(windowPosition);
            if (Cesium.defined(pickedObject)) {
                let entity = pickedObject.id;
                if (entity.name === "polylineEdit_point") {
                    currentPoint = entity;
                }
                if (entity.name === "polylineEdit_half_point") {
                    let ellipsoid = viewer.scene.globe.ellipsoid;
                    let cartesian = viewer.camera.pickEllipsoid(windowPosition, ellipsoid);
                    if (!cartesian) {
                        return;
                    }
                    var point = createGatherPoint(cartesian, viewer);
                    point.name = "polylineEdit_point";
                    currentPoint = point;
                    polyline.pointsId.splice(entity.positionFlag[0] + 1, 0, point.id);
                    for (var i = 0; i < polyline.halfPointsId.length; i++) {
                        viewer.entities.remove(viewer.entities.getById(polyline.halfPointsId[i]));
                    }
                    polyline.halfPointsId = [];
                    for (var i = 0; i < polyline.pointsId.length - 1; i++) {
                        var oneTemp = viewer.entities.getById(polyline.pointsId[i]).position._value;
                        var twoTemp = viewer.entities.getById(polyline.pointsId[i + 1]).position._value;
                        var halfX = (oneTemp.x + twoTemp.x) / 2;
                        var halfY = (oneTemp.y + twoTemp.y) / 2;
                        var halfZ = (oneTemp.z + twoTemp.z) / 2;
                        var cartesianHalf = new Cesium.Cartesian3(halfX, halfY, halfZ);
                        var pointEntity = createHalfGatherPoint(cartesianHalf, viewer);
                        pointEntity.name = "polylineEdit_half_point";
                        pointEntity.positionFlag = [i, i + 1];
                        polyline.halfPointsId.push(pointEntity.id);
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        polyline.handler.setInputAction((event) => {
            if (currentPoint && currentPoint.name == "polylineEdit_point") {
                viewer.scene.screenSpaceCameraController.enableRotate = false;
                viewer.scene.screenSpaceCameraController.enableZoom = false;
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
                polyline.polyline.positions = new Cesium.CallbackProperty(function (time, result) {
                    for (var i = 0; i < polyline.halfPointsId.length; i++) {
                        var entityTemp = viewer.entities.getById(polyline.halfPointsId[i]);
                        if (typeof entityTemp != "undefined") {
                            var oneTemp = entityTemp.positionFlag[0];
                            var twoTemp = entityTemp.positionFlag[1];
                            if (typeof points[oneTemp] != "undefined" && typeof points[twoTemp] != "undefined") {
                                var halfX = (points[oneTemp].x + points[twoTemp].x) / 2;
                                var halfY = (points[oneTemp].y + points[twoTemp].y) / 2;
                                var halfZ = (points[oneTemp].z + points[twoTemp].z) / 2;
                                var cartesian = new Cesium.Cartesian3(halfX, halfY, halfZ);
                                entityTemp.position = cartesian;
                            }
                        }
                    }
                    return points;
                }, false);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        polyline.handler.setInputAction((event) => {
            currentPoint = null;
            viewer.scene.screenSpaceCameraController.enableRotate = true;
            viewer.scene.screenSpaceCameraController.enableZoom = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        polyline.handler.setInputAction((event) => {
            the.closePolylineEdit(polyline);
            callback(polyline);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    closePolylineEdit(polyline) {
        this.ffCesium.mapToolClass.closeMouseTip();
        let the = this;
        document.getElementById(the.cesiumID).style.cursor = "default";
        polyline.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        polyline.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        polyline.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        polyline.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        this.ffCesium.mapUtilClass.setAttributeForEntity(polyline, polyline.FFOption, "polyline");
        this.ffCesium.entityClass.removeFFEntityIDArr(polyline.pointsId);
        polyline.pointsId = [];
        this.ffCesium.entityClass.removeFFEntityIDArr(polyline.halfPointsId);
        polyline.halfPointsId = [];
        return polyline;
    }

    pointEdit(point, callback) {
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");
        let the = this;
        let viewer = this.viewer;
        point.timer = null;
        point.isEditting = false;
        point.point.outlineWidth = 4;
        point.point.outlineColor = new Cesium.Color.fromCssColorString("#0000FF").withAlpha(1);
        if (!point.id) {
            point.id = "pointEdit_" + new Date().getTime() + "_" + Math.random();
        }
        document.getElementById(this.cesiumID).style.cursor = "pointer";
        point.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        point.handler.setInputAction((event) => {
            let pickedObject = viewer.scene.pick(event.position);
            if (Cesium.defined(pickedObject)) {
                if (pickedObject.id.id == point.id && !point.isEditting) {
                    point.isEditting = true;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        point.handler.setInputAction((event) => {
            if (point.isEditting) {
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
        point.handler.setInputAction((event) => {
            viewer.scene.screenSpaceCameraController.enableRotate = true;
            viewer.scene.screenSpaceCameraController.enableZoom = true;
            point.isEditting = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
        point.handler.setInputAction((event) => {
            the.closePointEdit(point);
            callback(point);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    closePointEdit(point) {
        this.ffCesium.mapToolClass.closeMouseTip();
        let the = this;
        document.getElementById(the.cesiumID).style.cursor = "default";
        point.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        point.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        point.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        point.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        point.isEditting = false;
        point.point.outlineWidth = 0;
        this.ffCesium.mapUtilClass.setAttributeForEntity(point, point.FFOption, "point");
    }

    billboardEdit(billboard, callback) {
        this.ffCesium.mapToolClass.openMouseTip("压住图标点移动，右击即可完成采集");
        let the = this;
        let viewer = this.viewer;
        billboard.timer = null;
        billboard.isEditting = false;
        billboard.billboard.color = new Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(0.6);
        if (!billboard.id) {
            billboard.id = "billboardEdit_" + new Date().getTime() + "_" + Math.random();
        }
        document.getElementById(this.cesiumID).style.cursor = "pointer";
        billboard.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        billboard.handler.setInputAction((event) => {
            let pickedObject = viewer.scene.pick(event.position);
            if (Cesium.defined(pickedObject)) {
                if (pickedObject.id.id == billboard.id && !billboard.isEditting) {
                    billboard.isEditting = true;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        billboard.handler.setInputAction((event) => {
            if (billboard.isEditting) {
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
        billboard.handler.setInputAction((event) => {
            viewer.scene.screenSpaceCameraController.enableRotate = true;
            viewer.scene.screenSpaceCameraController.enableZoom = true;
            billboard.isEditting = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
        billboard.handler.setInputAction((event) => {
            the.closeBillboardEdit(billboard);
            callback(billboard);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    closeBillboardEdit(billboard) {
        this.ffCesium.mapToolClass.closeMouseTip();
        let the = this;
        document.getElementById(the.cesiumID).style.cursor = "default";
        billboard.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        billboard.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        billboard.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        billboard.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        billboard.isEditting = false;
        billboard.billboard.color = new Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(1);
        this.ffCesium.mapUtilClass.setAttributeForEntity(billboard, billboard.FFOption, "billboard");
    }
}

export default ElementEditClass;
