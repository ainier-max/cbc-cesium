import * as Cesium from "cesium";
import { createGatherPoint } from "./LogicClass/common.js";
import { xp } from "../../dependentLib/plotHelper/algorithm.js";
import { P } from "../../dependentLib/plotHelper/plotUtil.js";
import MilitaryPlottingGatherLogic from "./LogicClass/MilitaryPlottingGatherLogic.js";

/**
 * 军事标绘采集类
 */
class MilitaryPlottingGatherClass {
    //一次只能由一个采集事件,militaryPlottingGatherHandler
    militaryPlottingGatherHandler = null;
    //军事标绘点
    militaryPlottingGatherPoints = [];
    forceMilitaryGatherEndInfo = "强制结束军事标绘采集方法(forceMilitaryGatherEnd)";
    endMilitaryPlottingGatherDealInfo = "结束军事标绘采集方法(endMilitaryPlottingGatherDeal)";
    addMilitaryPlottingInfo = "添加军事标绘区域展示方法(addMilitaryPlotting)";
    rendezvousGatherInfo = "集结地采集方法(rendezvousGather)";
    doubleArrowGatherInfo = "双箭头采集方法(doubleArrowGather)";
    tailedAttackArrowGatherInfo = "燕尾箭头采集方法(tailedAttackArrowGather)";
    straightArrowGatherInfo = "直箭头采集方法(straightArrowGather)";
    fineGatheringPlaceInfo = "集结地平滑处理方法(fineGatheringPlace)";

    constructor(ffCesium) {
        this.ffCesium = ffCesium;
        this.viewer = ffCesium.viewer;
        this.cesiumID = ffCesium.cesiumID;
        this.militaryPlottingGatherLogic = new MilitaryPlottingGatherLogic();
    }

    //进入采集到一半，强制关闭采集
    forceMilitaryGatherEnd() {
        console.log("this.militaryPlottingGatherHandler", this.militaryPlottingGatherHandler);
        if (this.militaryPlottingGatherHandler) {
            if (this.militaryPlottingGatherHandler.GatherEntity !== undefined && this.militaryPlottingGatherHandler.GatherEntity.length > 0) {
                for (let i = 0; i < this.militaryPlottingGatherHandler.GatherEntity.length; i++) {
                    this.viewer.entities.remove(this.militaryPlottingGatherHandler.GatherEntity[i]);
                }
                this.militaryPlottingGatherHandler.GatherEntity = [];
            }
        }
        this.endMilitaryPlottingGatherDeal();
    }

    //结束采集Deal
    endMilitaryPlottingGatherDeal() {
        console.log("endMilitaryPlottingGatherDeal");
        document.getElementById(this.cesiumID).style.cursor = "default";
        if (this.militaryPlottingGatherHandler) {
            this.militaryPlottingGatherHandler.destroy();
            this.militaryPlottingGatherHandler = null;
        }
        this.ffCesium.mapToolClass.closeMouseTip();
        for (var i = 0; i < this.militaryPlottingGatherPoints.length; i++) {
            this.viewer.entities.remove(this.militaryPlottingGatherPoints[i]);
        }
        this.militaryPlottingGatherPoints = [];
    }

    //采集军事标绘区域展示
    addMilitaryPlotting(cartesianPoints, option, type) {
        let the = this;
        let dynamicHierarchy = null;
        if (type == "FFStraightArrowEntity") {
            dynamicHierarchy = new Cesium.CallbackProperty(function () {
                if (cartesianPoints.length > 1) {
                    var p1 = cartesianPoints[0];
                    var p2 = cartesianPoints[1];
                    if (the.ffCesium.mapUtilClass.isSimpleXYZ(p1, p2)) {
                        return null;
                    }
                    let firstPoint = the.ffCesium.mapUtilClass.positionToLngLatHeight(p1);
                    let endPoints = the.ffCesium.mapUtilClass.positionToLngLatHeight(p2);
                    var arrow = xp.algorithm.fineArrow([firstPoint[0], firstPoint[1]], [endPoints[0], endPoints[1]]);
                    var pHierarchy = new Cesium.PolygonHierarchy(arrow);
                    pHierarchy.keyPoints = [firstPoint, endPoints];
                    return pHierarchy;
                } else {
                    return null;
                }
            }, false);
        } else if (type == "FFTailedAttackArrowEntity") {
            dynamicHierarchy = new Cesium.CallbackProperty(function () {
                if (cartesianPoints.length > 1) {
                    var lonLats = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(cartesianPoints);
                    var doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
                    var positions = doubleArrow.polygonalPoint;
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
        } else if (type == "FFDoubleArrowEntity") {
            dynamicHierarchy = new Cesium.CallbackProperty(function () {
                if (cartesianPoints.length > 2) {
                    var lonLats = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(cartesianPoints);
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
                } else {
                    return null;
                }
            }, false);
        } else if (type == "FFRendezvousEntity") {
            dynamicHierarchy = new Cesium.CallbackProperty(function () {
                var length = cartesianPoints.length;
                if (length < 3) {
                    return;
                }
                var res = the.fineGatheringPlace(cartesianPoints);
                var pHierarchy = new Cesium.PolygonHierarchy(res);
                return pHierarchy;
            }, false);
        }
        var bData = {
            polygon: new Cesium.PolygonGraphics({
                hierarchy: dynamicHierarchy,
                material: Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha),
                show: true
            })
        };
        let gatherEntityTemp = this.viewer.entities.add(bData);
        return gatherEntityTemp;
    }

    rendezvousGather(callback, option) {
        document.getElementById(this.cesiumID).style.cursor = "crosshair";
        let the = this;
        this.ffCesium.mapToolClass.openMouseTip("点击2次地图后，右击即可完成采集");
        let cartesianPoints = [];
        let floatingPoint = null;
        let gatherEntity = null;
        this.militaryPlottingGatherHandler = new Cesium.ScreenSpaceEventHandler(the.viewer.scene.canvas);
        this.militaryPlottingGatherHandler.GatherEntity = [];
        this.militaryPlottingGatherHandler.setInputAction(function (event) {
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
            if (cartesianPoints.length == 0) {
                cartesianPoints.push(cartesian.clone());
                floatingPoint = createGatherPoint(cartesian, the.viewer);
                the.militaryPlottingGatherPoints.push(floatingPoint);
            }

            if (cartesianPoints.length <= 2) {
                let pointTemp = createGatherPoint(cartesian, the.viewer);
                cartesianPoints.push(cartesian);
                the.militaryPlottingGatherPoints.push(pointTemp);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.militaryPlottingGatherHandler.setInputAction(function (event) {
            if (cartesianPoints.length < 2) {
                return;
            }
            var position = event.endPosition;
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
            if (!gatherEntity) {
                gatherEntity = the.addMilitaryPlotting(cartesianPoints, option, "FFRendezvousEntity");
                the.militaryPlottingGatherHandler.GatherEntity.push(gatherEntity);
            }
            floatingPoint.position.setValue(cartesian);

            if (gatherEntity) {
                if (cartesianPoints.length == 3) {
                    cartesianPoints[1] = cartesian;
                } else {
                    cartesianPoints.pop();
                    cartesianPoints.push(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.militaryPlottingGatherHandler.setInputAction(function (movement) {
            var num = cartesianPoints.length;
            if (num > 2) {
                gatherEntity.FFPlotKeyPoints = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(cartesianPoints);
                the.endMilitaryPlottingGatherDeal();
                the.ffCesium.mapUtilClass.setAttributeForEntity(gatherEntity, option, "FFRendezvousEntity");
                callback(gatherEntity);
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    doubleArrowGather(callback, option) {
        document.getElementById(this.cesiumID).style.cursor = "crosshair";
        let the = this;
        this.ffCesium.mapToolClass.openMouseTip("点击5次地图即可完成采集");
        let gatherEntity = null;
        let cartesianPoints = [];
        let floatingPoint = null;
        this.militaryPlottingGatherHandler = new Cesium.ScreenSpaceEventHandler(the.viewer.scene.canvas);
        this.militaryPlottingGatherHandler.GatherEntity = [];

        this.militaryPlottingGatherHandler.setInputAction(function (event) {
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
            var num = cartesianPoints.length;
            if (num == 0) {
                cartesianPoints.push(cartesian);
                floatingPoint = createGatherPoint(cartesian, the.viewer);
                floatingPoint.oid = -1;
                the.militaryPlottingGatherPoints.push(floatingPoint);
                gatherEntity = the.addMilitaryPlotting(cartesianPoints, option, "FFDoubleArrowEntity");
                the.militaryPlottingGatherHandler.GatherEntity.push(gatherEntity);
            }
            cartesianPoints.push(cartesian);
            var oid = cartesianPoints.length - 2;
            let endPoint = createGatherPoint(cartesian, the.viewer);
            endPoint.oid = oid;
            the.militaryPlottingGatherPoints.push(endPoint);

            if (cartesianPoints.length > 5) {
                cartesianPoints.pop();
                the.viewer.entities.remove(floatingPoint);
                gatherEntity.FFPlotKeyPoints = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(cartesianPoints);
                the.endMilitaryPlottingGatherDeal();
                the.ffCesium.mapUtilClass.setAttributeForEntity(gatherEntity, option, "FFDoubleArrowEntity");
                callback(gatherEntity);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.militaryPlottingGatherHandler.setInputAction(function (event) {
            var position = event.endPosition;
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
            if (floatingPoint == null) {
                return;
            }
            floatingPoint.position.setValue(cartesian);
            cartesianPoints.pop();
            cartesianPoints.push(cartesian);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    tailedAttackArrowGather(callback, option) {
        this.ffCesium.mapToolClass.openMouseTip("点击两次以上地图，右击完成采集");
        document.getElementById(this.cesiumID).style.cursor = "crosshair";
        let the = this;
        let gatherEntity = null;
        let cartesianPoints = [];
        let floatingPoint = null;
        this.militaryPlottingGatherHandler = new Cesium.ScreenSpaceEventHandler(the.viewer.scene.canvas);
        this.militaryPlottingGatherHandler.GatherEntity = [];

        this.militaryPlottingGatherHandler.setInputAction(function (event) {
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
            var num = cartesianPoints.length;
            if (num == 0) {
                cartesianPoints.push(cartesian);
                floatingPoint = createGatherPoint(cartesian, the.viewer);
                floatingPoint.oid = -1;
                the.militaryPlottingGatherPoints.push(floatingPoint);
                gatherEntity = the.addMilitaryPlotting(cartesianPoints, option, "FFTailedAttackArrowEntity");
                the.militaryPlottingGatherHandler.GatherEntity.push(gatherEntity);
            }
            cartesianPoints.push(cartesian);
            var oid = cartesianPoints.length - 2;
            let endPoint = createGatherPoint(cartesian, the.viewer);
            endPoint.oid = oid;
            the.militaryPlottingGatherPoints.push(endPoint);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.militaryPlottingGatherHandler.setInputAction(function (event) {
            if (cartesianPoints.length < 2) {
                return;
            }
            gatherEntity.FFPlotKeyPoints = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(cartesianPoints);
            the.endMilitaryPlottingGatherDeal();
            the.ffCesium.mapUtilClass.setAttributeForEntity(gatherEntity, option, "FFTailedAttackArrowEntity");
            callback(gatherEntity);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        this.militaryPlottingGatherHandler.setInputAction(function (event) {
            var position = event.endPosition;
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
            if (floatingPoint == null) {
                return;
            }
            floatingPoint.position.setValue(cartesian);
            cartesianPoints.pop();
            cartesianPoints.push(cartesian);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    straightArrowGather(callback, option) {
        this.ffCesium.mapToolClass.openMouseTip("点击一次地图，右击完成采集");
        document.getElementById(this.cesiumID).style.cursor = "crosshair";
        let the = this;
        let gatherEntity = null;
        let cartesianPoints = [];
        let floatingPoint = null;
        this.militaryPlottingGatherHandler = new Cesium.ScreenSpaceEventHandler(the.viewer.scene.canvas);
        this.militaryPlottingGatherHandler.GatherEntity = [];
        this.militaryPlottingGatherHandler.setInputAction(function (event) {
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
            var num = cartesianPoints.length;
            if (num == 0) {
                cartesianPoints.push(cartesian);
                floatingPoint = createGatherPoint(cartesian, the.viewer);
                floatingPoint.oid = -1;
                the.militaryPlottingGatherPoints.push(floatingPoint);
                gatherEntity = the.addMilitaryPlotting(cartesianPoints, option, "FFStraightArrowEntity");
                the.militaryPlottingGatherHandler.GatherEntity.push(gatherEntity);
                cartesianPoints.push(cartesian);
                var oid = cartesianPoints.length - 2;
                let endPoint = createGatherPoint(cartesian, the.viewer);
                endPoint.oid = oid;
                the.militaryPlottingGatherPoints.push(endPoint);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.militaryPlottingGatherHandler.setInputAction(function (event) {
            var ray = the.viewer.camera.getPickRay(event.position);
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            cartesianPoints.push(cartesian);
            var oid = cartesianPoints.length - 2;
            let endPoint = createGatherPoint(cartesian, the.viewer);
            endPoint.oid = oid;
            the.militaryPlottingGatherPoints.push(endPoint);
            var num = cartesianPoints.length;
            if (num > 1) {
                cartesianPoints.pop();
                gatherEntity.FFPlotKeyPoints = the.ffCesium.mapUtilClass.cartesian3ArrToLngLatHeightArr(cartesianPoints);
                the.endMilitaryPlottingGatherDeal();
                the.ffCesium.mapUtilClass.setAttributeForEntity(gatherEntity, option, "FFStraightArrowEntity");
                callback(gatherEntity);
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        this.militaryPlottingGatherHandler.setInputAction(function (event) {
            var position = event.endPosition;
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
            if (floatingPoint == null) {
                return;
            }
            floatingPoint.position.setValue(cartesian);
            cartesianPoints.pop();
            cartesianPoints.push(cartesian);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
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

export default MilitaryPlottingGatherClass;
