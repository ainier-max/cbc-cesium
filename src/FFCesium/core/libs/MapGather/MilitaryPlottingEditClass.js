import * as Cesium from "cesium";
import { createGatherPoint } from "./LogicClass/common.js";
import { xp } from "../../dependentLib/plotHelper/algorithm.js";
import MilitaryPlottingEditLogic from "./LogicClass/MilitaryPlottingEditLogic.js";
import { P } from "../../dependentLib/plotHelper/plotUtil.js";

/**
 * 军事标绘编辑类
 */
class MilitaryPlottingEditClass {
    //一次只能有一个修改事件
    militaryPlottingEditHandler = null;
    //军事修改点
    militaryPlottingEditPoints = [];
    endMilitaryPlottingEditDealInfo = "结束军事标绘编辑方法(endMilitaryPlottingEditDeal)";
    closeRendezvousEditInfo = "关闭集结地编辑方法(closeRendezvousEdit)";
    rendezvousEditInfo = "集结地编辑方法(rendezvousEdit)";
    addRendezvousEntityInfo = "添加集结地实体方法(addRendezvousEntity)";
    closeDoubleArrowEditInfo = "关闭双箭头编辑方法(closeDoubleArrowEdit)";
    doubleArrowEditInfo = "双箭头编辑方法(doubleArrowEdit)";
    addDoubleArrowEntityInfo = "添加双箭头实体方法(addDoubleArrowEntity)";
    closeTailedAttackArrowEditInfo = "关闭燕尾箭头编辑方法(closeTailedAttackArrowEdit)";
    tailedAttackArrowEditInfo = "燕尾箭头编辑方法(tailedAttackArrowEdit)";
    addTailedAttackArrowInfo = "添加燕尾箭头实体方法(addTailedAttackArrow)";
    addStraightArrowEntityInfo = "添加直箭头实体方法(addStraightArrowEntity)";
    closeStraightArrowEditInfo = "关闭直箭头编辑方法(closeStraightArrowEdit)";
    straightArrowEditInfo = "直箭头编辑方法(straightArrowEdit)";
    fineGatheringPlaceInfo = "集结地平滑处理方法(fineGatheringPlace)";

    constructor(ffCesium) {
        this.ffCesium = ffCesium;
        this.viewer = ffCesium.viewer;
        this.cesiumID = ffCesium.cesiumID;
        this.militaryPlottingEditLogic = new MilitaryPlottingEditLogic();
    }

    endMilitaryPlottingEditDeal() {
        document.getElementById(this.cesiumID).style.cursor = "default";
        if (this.militaryPlottingEditHandler) {
            this.militaryPlottingEditHandler.destroy();
            this.militaryPlottingEditHandler = null;
        }
        this.ffCesium.mapToolClass.closeMouseTip();
        for (var i = 0; i < this.militaryPlottingEditPoints.length; i++) {
            this.viewer.entities.remove(this.militaryPlottingEditPoints[i]);
        }
        this.militaryPlottingEditPoints = [];
    }

    closeRendezvousEdit(entityObj) {
        entityObj.FFPosition = entityObj.polygon.hierarchy.getValue().positions;
        let lngLatHeightArr = this.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(entityObj.FFPosition);
        entityObj.FFCoordinates = lngLatHeightArr;
        this.endMilitaryPlottingEditDeal();
        return entityObj;
    }

    rendezvousEdit(entityObj, callback) {
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");
        document.getElementById(this.cesiumID).style.cursor = "pointer";
        let the = this;
        let isMoving = false;
        let pickedAnchor = null;
        let gatherPosition = this.ffCesium.mapUtilClass.lngLatHeightArrToCartesian3Arr(entityObj.FFPlotKeyPoints);
        for (var i = 0; i < gatherPosition.length; i++) {
            let pointTemp = createGatherPoint(gatherPosition[i], this.viewer);
            pointTemp.oid = i;
            pointTemp.flag = "anchor";
            the.militaryPlottingEditPoints.push(pointTemp);
        }
        this.militaryPlottingEditHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.militaryPlottingEditHandler.setInputAction(function (event) {
            var position = event.position;
            if (!Cesium.defined(position)) {
                return;
            }
            var ray = the.viewer.camera.getPickRay(position);
            if (!Cesium.defined(ray)) {
                return;
            }
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            if (isMoving) {
                isMoving = false;
                pickedAnchor.position.setValue(cartesian);
                var oid = pickedAnchor.oid;
                gatherPosition[oid] = cartesian;
            } else {
                var pickedObject = the.viewer.scene.pick(position);
                if (!Cesium.defined(pickedObject)) {
                    return;
                }
                if (!Cesium.defined(pickedObject.id)) {
                    return;
                }
                var entity = pickedObject.id;
                if (entity.flag != "anchor") {
                    return;
                }
                pickedAnchor = entity;
                isMoving = true;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.militaryPlottingEditHandler.setInputAction((event) => {
            pickedAnchor = null;
            isMoving = false;
            the.viewer.scene.screenSpaceCameraController.enableRotate = true;
            the.viewer.scene.screenSpaceCameraController.enableZoom = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        this.militaryPlottingEditHandler.setInputAction(function (event) {
            if (!isMoving || !pickedAnchor) {
                return;
            }
            the.viewer.scene.screenSpaceCameraController.enableRotate = false;
            the.viewer.scene.screenSpaceCameraController.enableZoom = false;

            var position = event.endPosition;
            if (!Cesium.defined(position)) {
                return;
            }

            var ray = the.viewer.scene.camera.getPickRay(position);
            if (!Cesium.defined(ray)) {
                return;
            }
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            pickedAnchor.position.setValue(cartesian);
            var oid = pickedAnchor.oid;
            gatherPosition[oid] = cartesian;
            entityObj.FFPlotKeyPoints = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(gatherPosition);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.militaryPlottingEditHandler.setInputAction(function (event) {
            the.closeDoubleArrowEdit(entityObj);
            callback(entityObj);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        entityObj.polygon.hierarchy = new Cesium.CallbackProperty(function () {
            if (gatherPosition.length > 2) {
                var res = the.fineGatheringPlace(gatherPosition);
                if (res == null || res.length < 3) {
                    return null;
                }
                var pHierarchy = new Cesium.PolygonHierarchy(res);
                return pHierarchy;
            } else {
                return null;
            }
        }, false);
    }

    addRendezvousEntity(lnglatArr, option) {
        let newOption = Object.assign({}, option);
        var res = this.fineGatheringPlace(this.ffCesium.mapUtilClass.lngLatHeightArrToCartesian3Arr(lnglatArr));
        var pHierarchy = new Cesium.PolygonHierarchy(res);
        var bData = {
            polygon: new Cesium.PolygonGraphics({
                hierarchy: pHierarchy,
                material: Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha),
                show: true,
                ...newOption,
            }),
        };
        if (newOption.id) {
            bData.id = newOption.id;
        }
        let rendezvousEntity = this.viewer.entities.add(bData);
        this.ffCesium.mapUtilClass.setAttributeForEntity(rendezvousEntity, option, "FFRendezvousEntity");
        rendezvousEntity.FFPlotKeyPoints = lnglatArr;
        return rendezvousEntity;
    }

    closeDoubleArrowEdit(entityObj) {
        entityObj.FFPosition = entityObj.polygon.hierarchy.getValue().positions;
        let lngLatHeightArr = this.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(entityObj.FFPosition);
        entityObj.FFCoordinates = lngLatHeightArr;
        this.endMilitaryPlottingEditDeal();
        return entityObj;
    }

    doubleArrowEdit(entityObj, callback) {
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");
        document.getElementById(this.cesiumID).style.cursor = "pointer";
        let the = this;
        let isMoving = false;
        let pickedAnchor = null;
        let gatherPosition = this.ffCesium.mapUtilClass.lngLatHeightArrToCartesian3Arr(entityObj.FFPlotKeyPoints);
        for (var i = 0; i < gatherPosition.length; i++) {
            let pointTemp = createGatherPoint(gatherPosition[i], this.viewer);
            pointTemp.oid = i;
            pointTemp.flag = "anchor";
            the.militaryPlottingEditPoints.push(pointTemp);
        }
        this.militaryPlottingEditHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.militaryPlottingEditHandler.setInputAction(function (event) {
            var position = event.position;
            if (!Cesium.defined(position)) {
                return;
            }
            var ray = the.viewer.camera.getPickRay(position);
            if (!Cesium.defined(ray)) {
                return;
            }
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            if (isMoving) {
                isMoving = false;
                pickedAnchor.position.setValue(cartesian);
                var oid = pickedAnchor.oid;
                gatherPosition[oid] = cartesian;
            } else {
                var pickedObject = the.viewer.scene.pick(position);
                if (!Cesium.defined(pickedObject)) {
                    return;
                }
                if (!Cesium.defined(pickedObject.id)) {
                    return;
                }
                var entity = pickedObject.id;
                if (entity.flag != "anchor") {
                    return;
                }
                pickedAnchor = entity;
                isMoving = true;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.militaryPlottingEditHandler.setInputAction((event) => {
            pickedAnchor = null;
            isMoving = false;
            the.viewer.scene.screenSpaceCameraController.enableRotate = true;
            the.viewer.scene.screenSpaceCameraController.enableZoom = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
        this.militaryPlottingEditHandler.setInputAction(function (event) {
            if (!isMoving || !pickedAnchor) {
                return;
            }
            the.viewer.scene.screenSpaceCameraController.enableRotate = false;
            the.viewer.scene.screenSpaceCameraController.enableZoom = false;
            var position = event.endPosition;
            if (!Cesium.defined(position)) {
                return;
            }
            var ray = the.viewer.scene.camera.getPickRay(position);
            if (!Cesium.defined(ray)) {
                return;
            }
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            pickedAnchor.position.setValue(cartesian);
            var oid = pickedAnchor.oid;
            gatherPosition[oid] = cartesian;
            entityObj.FFPlotKeyPoints = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(gatherPosition);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.militaryPlottingEditHandler.setInputAction(function (event) {
            the.closeDoubleArrowEdit(entityObj);
            callback(entityObj);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        entityObj.polygon.hierarchy = new Cesium.CallbackProperty(function () {
            if (gatherPosition.length > 2) {
                try {
                    var lonLats = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(gatherPosition);
                    the.ffCesium.mapUtilClass.coordinateArrDeduplication(lonLats);
                    var doubleArrow = xp.algorithm.doubleArrow(lonLats);
                    var positions = doubleArrow.polygonalPoint;
                    if (!Cesium.defined(positions)) {
                        return null;
                    }
                    if (positions == null || positions.length < 3) {
                        return null;
                    }
                    var pHierarchy = new Cesium.PolygonHierarchy(positions);
                    pHierarchy.keyPoints = lonLats;
                    return pHierarchy;
                } catch (err) {
                    return null;
                }
            } else {
                return null;
            }
        }, false);
    }

    addDoubleArrowEntity(lnglatArr, option) {
        let newOption = Object.assign({}, option);
        var attackObj = xp.algorithm.doubleArrow(lnglatArr);
        var arrow = attackObj.polygonalPoint;
        var pHierarchy = new Cesium.PolygonHierarchy(arrow);
        var bData = {
            polygon: new Cesium.PolygonGraphics({
                hierarchy: pHierarchy,
                material: Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha),
                ...newOption,
            }),
        };
        if (newOption.id) {
            bData.id = newOption.id;
        }
        let doubleArrowEntity = this.viewer.entities.add(bData);
        this.ffCesium.mapUtilClass.setAttributeForEntity(doubleArrowEntity, option, "FFDoubleArrowEntity");
        doubleArrowEntity.FFPlotKeyPoints = lnglatArr;
        return doubleArrowEntity;
    }

    closeTailedAttackArrowEdit(entityObj) {
        entityObj.FFPosition = entityObj.polygon.hierarchy.getValue().positions;
        let lngLatHeightArr = this.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(entityObj.FFPosition);
        entityObj.FFCoordinates = lngLatHeightArr;
        this.endMilitaryPlottingEditDeal();
        return entityObj;
    }

    tailedAttackArrowEdit(entityObj, callback) {
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");
        document.getElementById(this.cesiumID).style.cursor = "pointer";
        let the = this;
        let isMoving = false;
        let pickedAnchor = null;
        let gatherPosition = this.ffCesium.mapUtilClass.lngLatHeightArrToCartesian3Arr(entityObj.FFPlotKeyPoints);
        for (var i = 0; i < gatherPosition.length; i++) {
            let pointTemp = createGatherPoint(gatherPosition[i], this.viewer);
            pointTemp.oid = i;
            pointTemp.flag = "anchor";
            the.militaryPlottingEditPoints.push(pointTemp);
        }
        this.militaryPlottingEditHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.militaryPlottingEditHandler.setInputAction(function (event) {
            var position = event.position;
            if (!Cesium.defined(position)) {
                return;
            }
            var ray = the.viewer.camera.getPickRay(position);
            if (!Cesium.defined(ray)) {
                return;
            }
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            if (isMoving) {
                isMoving = false;
                pickedAnchor.position.setValue(cartesian);
                var oid = pickedAnchor.oid;
                gatherPosition[oid] = cartesian;
            } else {
                var pickedObject = the.viewer.scene.pick(position);
                if (!Cesium.defined(pickedObject)) {
                    return;
                }
                if (!Cesium.defined(pickedObject.id)) {
                    return;
                }
                var entity = pickedObject.id;
                if (entity.flag != "anchor") {
                    return;
                }
                pickedAnchor = entity;
                isMoving = true;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.militaryPlottingEditHandler.setInputAction((event) => {
            pickedAnchor = null;
            isMoving = false;
            the.viewer.scene.screenSpaceCameraController.enableRotate = true;
            the.viewer.scene.screenSpaceCameraController.enableZoom = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
        this.militaryPlottingEditHandler.setInputAction(function (event) {
            if (!isMoving || !pickedAnchor) {
                return;
            }
            the.viewer.scene.screenSpaceCameraController.enableRotate = false;
            the.viewer.scene.screenSpaceCameraController.enableZoom = false;
            var position = event.endPosition;
            if (!Cesium.defined(position)) {
                return;
            }
            var ray = the.viewer.scene.camera.getPickRay(position);
            if (!Cesium.defined(ray)) {
                return;
            }
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            pickedAnchor.position.setValue(cartesian);
            var oid = pickedAnchor.oid;
            gatherPosition[oid] = cartesian;
            entityObj.FFPlotKeyPoints = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(gatherPosition);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.militaryPlottingEditHandler.setInputAction(function (event) {
            the.closeTailedAttackArrowEdit(entityObj);
            callback(entityObj);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        entityObj.polygon.hierarchy = new Cesium.CallbackProperty(function () {
            if (gatherPosition.length > 1) {
                var lonLats = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(gatherPosition);
                var tailedAttackArrowTemp = xp.algorithm.tailedAttackArrow(lonLats);
                var positions = tailedAttackArrowTemp.polygonalPoint;
                if (positions == null || positions.length < 3) {
                    return null;
                }
                var pHierarchy = new Cesium.PolygonHierarchy(positions);
                pHierarchy.keyPoints = lonLats;
                return pHierarchy;
            } else {
                return null;
            }
        }, false);
    }

    addTailedAttackArrow(lnglatArr, option) {
        let newOption = Object.assign({}, option);
        var attackObj = xp.algorithm.tailedAttackArrow(lnglatArr);
        var arrow = attackObj.polygonalPoint;
        var pHierarchy = new Cesium.PolygonHierarchy(arrow);
        var bData = {
            polygon: new Cesium.PolygonGraphics({
                hierarchy: pHierarchy,
                material: Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha),
                ...newOption,
            }),
        };
        if (newOption.id) {
            bData.id = newOption.id;
        }
        let tailedAttackArrowEntity = this.viewer.entities.add(bData);
        var keyPointArr = [];
        for (var i = 0; i < attackObj.controlPoint.length; i++) {
            var obj = Cesium.Cartesian3.fromDegrees(attackObj.controlPoint[i][0], attackObj.controlPoint[i][1]);
            keyPointArr.push(obj);
        }
        tailedAttackArrowEntity.keyPoints = keyPointArr;
        this.ffCesium.mapUtilClass.setAttributeForEntity(tailedAttackArrowEntity, option, "FFTailedAttackArrowEntity");
        tailedAttackArrowEntity.FFPlotKeyPoints = lnglatArr;
        return tailedAttackArrowEntity;
    }

    addStraightArrowEntity(lnglatArr, option) {
        let newOption = Object.assign({}, option);
        var arrow = xp.algorithm.fineArrow(lnglatArr[0], lnglatArr[1]);
        var pHierarchy = new Cesium.PolygonHierarchy(arrow);
        var bData = {
            polygon: new Cesium.PolygonGraphics({
                hierarchy: pHierarchy,
                material: Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha),
                ...newOption,
            }),
        };
        if (newOption.id) {
            bData.id = newOption.id;
        }
        let straightArrowEntity = this.viewer.entities.add(bData);
        this.ffCesium.mapUtilClass.setAttributeForEntity(straightArrowEntity, option, "FFStraightArrowEntity");
        straightArrowEntity.FFPlotKeyPoints = lnglatArr;
        return straightArrowEntity;
    }

    closeStraightArrowEdit(entityObj) {
        entityObj.FFPosition = entityObj.polygon.hierarchy.getValue().positions;
        let lngLatHeightArr = this.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(entityObj.FFPosition);
        entityObj.FFCoordinates = lngLatHeightArr;
        this.endMilitaryPlottingEditDeal();
        return entityObj;
    }

    straightArrowEdit(entityObj, callback) {
        this.ffCesium.mapToolClass.openMouseTip("压住编辑点移动，右击即可完成采集");
        document.getElementById(this.cesiumID).style.cursor = "pointer";
        let the = this;
        let isMoving = false;
        let pickedAnchor = null;
        let gatherPosition = this.ffCesium.mapUtilClass.lngLatHeightArrToCartesian3Arr(entityObj.FFPlotKeyPoints);
        for (var i = 0; i < gatherPosition.length; i++) {
            let pointTemp = createGatherPoint(gatherPosition[i], this.viewer);
            pointTemp.oid = i;
            pointTemp.flag = "anchor";
            the.militaryPlottingEditPoints.push(pointTemp);
        }
        this.militaryPlottingEditHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.militaryPlottingEditHandler.setInputAction(function (event) {
            var position = event.position;
            if (!Cesium.defined(position)) {
                return;
            }
            var ray = the.viewer.camera.getPickRay(position);
            if (!Cesium.defined(ray)) {
                return;
            }
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            if (isMoving) {
                isMoving = false;
                pickedAnchor.position.setValue(cartesian);
                var oid = pickedAnchor.oid;
                gatherPosition[oid] = cartesian;
            } else {
                var pickedObject = the.viewer.scene.pick(position);
                if (!Cesium.defined(pickedObject)) {
                    return;
                }
                if (!Cesium.defined(pickedObject.id)) {
                    return;
                }
                var entity = pickedObject.id;
                if (entity.flag != "anchor") {
                    return;
                }
                pickedAnchor = entity;
                isMoving = true;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.militaryPlottingEditHandler.setInputAction((event) => {
            pickedAnchor = null;
            isMoving = false;
            the.viewer.scene.screenSpaceCameraController.enableRotate = true;
            the.viewer.scene.screenSpaceCameraController.enableZoom = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
        this.militaryPlottingEditHandler.setInputAction(function (event) {
            if (!isMoving || !pickedAnchor) {
                return;
            }
            the.viewer.scene.screenSpaceCameraController.enableRotate = false;
            the.viewer.scene.screenSpaceCameraController.enableZoom = false;
            var position = event.endPosition;
            if (!Cesium.defined(position)) {
                return;
            }
            var ray = the.viewer.scene.camera.getPickRay(position);
            if (!Cesium.defined(ray)) {
                return;
            }
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            pickedAnchor.position.setValue(cartesian);
            var oid = pickedAnchor.oid;
            gatherPosition[oid] = cartesian;
            entityObj.FFPlotKeyPoints = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(gatherPosition);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.militaryPlottingEditHandler.setInputAction(function (event) {
            the.closeStraightArrowEdit(entityObj);
            callback(entityObj);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        entityObj.polygon.hierarchy = new Cesium.CallbackProperty(function () {
            if (gatherPosition.length > 1) {
                var p1 = gatherPosition[0];
                var p2 = gatherPosition[1];
                if (the.ffCesium.mapUtilClass.isSimpleXYZ(p1, p2)) {
                    return null;
                }
                var firstPoint = the.ffCesium.mapUtilClass.positionToLngLatHeight(p1);
                var endPoints = the.ffCesium.mapUtilClass.positionToLngLatHeight(p2);
                var arrow = xp.algorithm.fineArrow([firstPoint[0], firstPoint[1]], [endPoints[0], endPoints[1]]);
                var pHierarchy = new Cesium.PolygonHierarchy(arrow);
                pHierarchy.keyPoints = [firstPoint, endPoints];
                return pHierarchy;
            } else {
                return null;
            }
        }, false);
    }

    fineGatheringPlace(cartesianPoints) {
        let the = this;
        let points = cartesianPoints.length;
        if (points < 2) {
            return false;
        } else {
            let pnts = new Array();
            cartesianPoints.forEach(function (item) {
                var posLonLat = the.ffCesium.mapUtilClass.positionToLngLatHeight(item);
                pnts.push([posLonLat[0], posLonLat[1]]);
            });

            if (pnts.length === 2) {
                let mid = P.PlotUtils.mid(pnts[0], pnts[1]);
                let d = P.PlotUtils.distance(pnts[0], mid) / 0.9;
                let pnt = P.PlotUtils.getThirdPoint(pnts[0], mid, P.Constants.HALF_PI, d, true);
                pnts = [pnts[0], pnt, pnts[1]];
            }
            let mid = P.PlotUtils.mid(pnts[0], pnts[2]);
            pnts.push(mid, pnts[0], pnts[1]);
            let [normals, pnt1, pnt2, pnt3, pList] = [[], undefined, undefined, undefined, []];
            for (let i = 0; i < pnts.length - 2; i++) {
                pnt1 = pnts[i];
                pnt2 = pnts[i + 1];
                pnt3 = pnts[i + 2];
                let normalPoints = P.PlotUtils.getBisectorNormals(0.4, pnt1, pnt2, pnt3);
                normals = normals.concat(normalPoints);
            }
            let count = normals.length;
            normals = [normals[count - 1]].concat(normals.slice(0, count - 1));
            for (let i = 0; i < pnts.length - 2; i++) {
                pnt1 = pnts[i];
                pnt2 = pnts[i + 1];
                pList = pList.concat(pnt1);
                for (let t = 0; t <= P.Constants.FITTING_COUNT; t++) {
                    let pnt = P.PlotUtils.getCubicValue(t / P.Constants.FITTING_COUNT, pnt1, normals[i * 2], normals[i * 2 + 1], pnt2);
                    pList = pList.concat(pnt);
                }
                pList = pList.concat(pnt2);
            }
            return Cesium.Cartesian3.fromDegreesArray(pList);
        }
    }
}

export default MilitaryPlottingEditClass;
