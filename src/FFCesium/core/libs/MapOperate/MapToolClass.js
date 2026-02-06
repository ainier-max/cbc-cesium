import MapToolLogic from "./LogicClass/MapToolLogic.js";
import * as Cesium from "cesium";
import { nextTick } from "vue";
import CesiumNavigation from "cesium-navigation-es6";
import SkyBoxOnGround from "../../dependentLib/skyboxExtend.js";

export default class MapToolClass {
    addSkyBoxInfo = "添加天空盒方法(addSkyBox)";
    removeSkyBoxInfo = "移除天空盒方法(removeSkyBox)";
    cartesian3ToLngLatInfo = "Cartesian3转经纬度方法(cartesian3ToLngLat)";
    lngLatToCartesian3Info = "经纬度转Cartesian3方法(lngLatToCartesian3)";
    lngLatArrToCartesian3Info = "经纬度数组转Cartesian3数组方法(lngLatArrToCartesian3)";
    openMapInfoInfo = "显示经纬度信息方法(openMapInfo)";
    closeMapInfoInfo = "关闭经纬度信息方法(closeMapInfo)";
    measureLineLengthInfo = "测量距离方法(measureLineLength)";
    clearMeasureLineLengthEntitysInfo = "清除测距实体方法(clearMeasureLineLengthEntitys)";
    measureAreaSpaceInfo = "测量面积方法(measureAreaSpace)";
    clearMeasureAreaSpaceEntitysInfo = "清除测面实体方法(clearMeasureAreaSpaceEntitys)";
    openCompassToolInfo = "打开指北针工具方法(openCompassTool)";
    closeCompassToolInfo = "关闭指北针工具方法(closeCompassTool)";
    openScaleToolInfo = "打开比例尺工具方法(openScaleTool)";
    closeScaleToolInfo = "关闭比例尺工具方法(closeScaleTool)";
    setOpenMouseTipOptionInfo = "设置鼠标提示样式方法(setOpenMouseTipOption)";
    openMouseTipInfo = "开启鼠标提示方法(openMouseTip)";
    closeMouseTipInfo = "关闭鼠标提示方法(closeMouseTip)";
    updateMouseTipInfo = "更新鼠标提示方法(updateMouseTip)";
    createBezierSplineInfo = "创建贝塞尔曲线方法(createBezierSpline)";
    constructor(viewer, cesiumID) {
        this.viewer = viewer;
        this.cesiumID = cesiumID;
        this.mapToolLogic = new MapToolLogic();
        this.measureLineLengthEntitys = [];
        this.measureLineLengthHandler = null;
        this.measureAreaSpaceEntitys = [];
        this.measureAreaSpaceHandler = null;
        this.cesiumNavigation = null; //指南针罗盘
        this.openMapInfoHtmlOverlay = null; //地图信息
        this.openMouseTipHandler = null;
        this.openMouseTipLabelEntity = null;
        this.openMouseTipLabel = "";
        this.openMouseTipOption = { backgroundColor: "#001129", color: "#FFFFFF" };
    }

    //添加天空盒
    addSkyBox(option) {
        console.log("setSkyBox--option", option);
        const skybox = new SkyBoxOnGround({
            sources: {
                positiveX: option.px,
                negativeX: option.nx,
                positiveY: option.py,
                negativeY: option.ny,
                positiveZ: option.pz,
                negativeZ: option.nz,
            },
        });
        this.viewer.scene.skyBox = skybox;
        this.viewer.scene.skyAtmosphere.show = false; //关闭地球大气层
    }

    removeSkyBox() {
        this.viewer.scene.skyBox = this.viewer.defaultSkybox;
        this.viewer.scene.skyAtmosphere.show = true; //显示大气层
    }

    cartesian3ToLngLat(cartesian3) {
        return this.mapToolLogic.cartesian3ToLngLat(cartesian3, this.viewer);
    }

    lngLatToCartesian3(lngLatHeight) {
        return this.mapToolLogic.lngLatToCartesian3(lngLatHeight);
    }

    lngLatArrToCartesian3(lngLatArr) {
        return this.mapToolLogic.lngLatArrToCartesian3(lngLatArr);
    }

    openMapInfo(option) {
        if (!this.openMapInfoHtmlOverlay) {
            let cesiumDiv = document.getElementById(this.cesiumID);
            this.openMapInfoHtmlOverlay = document.createElement("div");
            this.openMapInfoHtmlOverlay.style.zIndex = 100;
            this.openMapInfoHtmlOverlay.style.position = "absolute";
            this.openMapInfoHtmlOverlay.innerHTML =
                "经度：<span id='openMapInfoLng'>0</span> , 纬度：<span id='openMapInfoLat'>0</span>";
            cesiumDiv.appendChild(this.openMapInfoHtmlOverlay);
        }
        for (let key in option) {
            this.openMapInfoHtmlOverlay.style[key] = option[key];
        }
        this.openMapInfoHtmlOverlay.style.display = "block";
        let the = this;
        var ellipsoid = this.viewer.scene.globe.ellipsoid;
        var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
        handler.setInputAction(function (movement) {
            var cartesian = the.viewer.camera.pickEllipsoid(
                movement.endPosition,
                ellipsoid
            );
            if (cartesian) {
                var cartographic =
                    the.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
                var latTemp = Cesium.Math.toDegrees(cartographic.latitude);
                var lngTemp = Cesium.Math.toDegrees(cartographic.longitude);
                if (typeof latTemp != "undefined" && typeof lngTemp != "undefined") {
                    document.getElementById("openMapInfoLng").innerHTML =
                        lngTemp.toFixed(4);
                    document.getElementById("openMapInfoLat").innerHTML =
                        latTemp.toFixed(4);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    closeMapInfo() {
        this.openMapInfoHtmlOverlay.style.display = "none";
    }

    measureLineLength(callback) {
        let distanceCount = 0;
        let points = [];
        let gatherPolyline = null;
        this.measureLineLengthHandler = new Cesium.ScreenSpaceEventHandler(
            this.viewer.canvas
        );
        document.getElementById(this.cesiumID).style.cursor = "crosshair";
        let the = this;
        this.measureLineLengthHandler.setInputAction(function (event) {
            let ray = the.viewer.camera.getPickRay(event.position);
            let cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);

            if (!Cesium.defined(cartesian)) {
                return;
            }
            let point = the.viewer.entities.add({
                name: "polyline_point",
                position: cartesian,
                point: {
                    color: Cesium.Color.WHITE,
                    pixelSize: 5,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 1,
                },
            });
            the.measureLineLengthEntitys.push(point);
            points.push(cartesian);
            if (points.length >= 2) {
                if (gatherPolyline == null) {
                    gatherPolyline = the.viewer.entities.add({
                        polyline: {
                            positions: new Cesium.CallbackProperty(function (time, result) {
                                return points;
                            }, false),
                            width: 10.0,
                            clampToGround: true,
                            material: new Cesium.PolylineGlowMaterialProperty({
                                color: Cesium.Color.CHARTREUSE.withAlpha(0.5),
                            }),
                        },
                    });
                    the.measureLineLengthEntitys.push(gatherPolyline);
                }
                var distance = Cesium.Cartesian3.distance(
                    points[points.length - 2],
                    points[points.length - 1]
                );
                distanceCount = distanceCount + distance;
                let textDisance = "";
                if (distance > 10000) {
                    textDisance = (distance / 1000).toFixed(2) + "km";
                } else {
                    textDisance = distance.toFixed(2) + "m";
                }
                let centerPoint = the.mapToolLogic.measureCenterByCartesian(
                    points[points.length - 2],
                    points[points.length - 1]
                );
                let labelTemp = the.viewer.entities.add({
                    position: centerPoint,
                    label: {
                        text: textDisance,
                        font: "18px sans-serif",
                        fillColor: Cesium.Color.GOLD,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    },
                });
                the.measureLineLengthEntitys.push(labelTemp);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.measureLineLengthHandler.setInputAction(function (rightClick) {
            document.getElementById(the.cesiumID).style.cursor = "default";
            the.measureLineLengthHandler.removeInputAction(
                Cesium.ScreenSpaceEventType.LEFT_CLICK
            );
            the.measureLineLengthHandler.removeInputAction(
                Cesium.ScreenSpaceEventType.RIGHT_CLICK
            );
            callback(distanceCount);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    clearMeasureLineLengthEntitys() {
        document.getElementById(this.cesiumID).style.cursor = "default";
        this.measureLineLengthHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
        this.measureLineLengthHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.RIGHT_CLICK
        );
        this.measureLineLengthEntitys.forEach((element) => {
            this.viewer.entities.remove(element);
        });
        this.measureLineLengthEntitys = [];
    }

    measureAreaSpace(callback) {
        var points = [];
        var gatherPolygon = null;

        this.measureAreaSpaceHandler = new Cesium.ScreenSpaceEventHandler(
            this.viewer.scene.canvas
        );

        document.getElementById(this.cesiumID).style.cursor = "crosshair";
        let the = this;
        this.measureAreaSpaceHandler.setInputAction((event) => {
            var ray = the.viewer.camera.getPickRay(event.position);
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            console.log(cartesian);
            if (!Cesium.defined(cartesian)) {
                return;
            }
            var point = the.viewer.entities.add({
                position: cartesian,
                point: {
                    color: Cesium.Color.WHITE,
                    pixelSize: 5,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 1,
                },
            });
            the.measureAreaSpaceEntitys.push(point);
            points.push(cartesian);
            if (points.length >= 3) {
                if (gatherPolygon == null) {
                    gatherPolygon = the.viewer.entities.add({
                        polygon: {
                            hierarchy: new Cesium.CallbackProperty(function (time, result) {
                                var hierarchyTemp = new Cesium.PolygonHierarchy(points, null);
                                return hierarchyTemp;
                            }, false),
                            material: Cesium.Color.GREENYELLOW.withAlpha(0.5),
                        },
                    });
                    the.measureAreaSpaceEntitys.push(gatherPolygon);
                } else {
                    gatherPolygon.polygon.hierarchy = new Cesium.CallbackProperty(
                        function (time, result) {
                            var hierarchyTemp = new Cesium.PolygonHierarchy(points, null);
                            return hierarchyTemp;
                        },
                        false
                    );
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.measureAreaSpaceHandler.setInputAction(function (rightClick) {
            var dke = gatherPolygon.polygon.hierarchy.getValue().positions;

            if (dke.length >= 3) {
                var objArr = [];
                for (var i = 0; i < dke.length; i++) {
                    var ellipsoid = the.viewer.scene.globe.ellipsoid;
                    var cartesian3 = new Cesium.Cartesian3(dke[i].x, dke[i].y, dke[i].z);
                    var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
                    var obj = {};
                    obj.lat = Cesium.Math.toDegrees(cartographic.latitude);
                    obj.lng = Cesium.Math.toDegrees(cartographic.longitude);
                    objArr.push(obj);
                }
                console.log("采集的面坐标(经纬度)", objArr);

                const { area, centerLng, centerLat } = the.mapToolLogic.calculateArea(objArr);

                console.log("area", area);
                let textDisance = "";
                if (area > 10000) {
                    textDisance = (area / 1000000).toFixed(2) + "k㎡";
                } else {
                    textDisance = area.toFixed(2) + "㎡";
                }

                let labelTemp = the.viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(centerLng, centerLat),
                    label: {
                        text: textDisance,
                        font: "18px sans-serif",
                        fillColor: Cesium.Color.GOLD,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    },
                });

                the.measureAreaSpaceEntitys.push(labelTemp);
                document.getElementById(the.cesiumID).style.cursor = "default";
                the.measureAreaSpaceHandler.removeInputAction(
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );
                the.measureAreaSpaceHandler.removeInputAction(
                    Cesium.ScreenSpaceEventType.RIGHT_CLICK
                );
                callback(area);
            } else {
                this.clearMeasureAreaSpaceEntitys();
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    clearMeasureAreaSpaceEntitys() {
        document.getElementById(this.cesiumID).style.cursor = "default";
        this.measureAreaSpaceHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
        this.measureAreaSpaceHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.RIGHT_CLICK
        );
        this.measureAreaSpaceEntitys.forEach((element) => {
            this.viewer.entities.remove(element);
        });
        this.measureAreaSpaceEntitys = [];
    }

    openCompassTool(option) {
        if (!this.cesiumNavigation) {
            this.cesiumNavigation = new CesiumNavigation(this.viewer, {
                enableCompass: true,
                enableZoomControls: false,
                enableDistanceLegend: false,
            });
        }
        const elements = document.getElementsByClassName("compass");
        if (elements.length > 0) {
            elements[0].style.display = "none";
            for (let key in option) {
                elements[0].style[key] = option[key];
            }
            nextTick(() => {
                elements[0].style.display = "block";
            });
        }
    }

    closeCompassTool() {
        if (this.cesiumNavigation) {
            const elements = document.getElementsByClassName("compass");
            if (elements.length > 0) elements[0].style.display = "none";
        }
    }

    openScaleTool(option) {
        if (!this.cesiumNavigation) {
            this.cesiumNavigation = new CesiumNavigation(this.viewer, {
                enableCompass: false,
                enableZoomControls: false,
                enableDistanceLegend: true,
            });
        }
        const elements = document.getElementsByClassName("distance-legend");
        if (elements.length > 0) {
            elements[0].style.display = "none";
            for (let key in option) {
                elements[0].style[key] = option[key];
            }
            //比例尺样式
            const scaleLabel = document.getElementsByClassName("distance-legend-label");
            if (scaleLabel.length > 0) scaleLabel[0].style.color = "#000000";

            const scaleLegend = document.getElementsByClassName(
                "distance-legend-scale-bar"
            );
            if (scaleLegend.length > 0) {
                scaleLegend[0].style.borderLeft = "1px solid #000000";
                scaleLegend[0].style.borderRight = "1px solid #000000";
                scaleLegend[0].style.borderBottom = "1px solid #000000";
            }

            nextTick(() => {
                elements[0].style.display = "block";
            });
        }
    }

    closeScaleTool() {
        if (this.cesiumNavigation) {
            const elements = document.getElementsByClassName("distance-legend");
            if (elements.length > 0) elements[0].style.display = "none";
        }
    }

    setOpenMouseTipOption(option) {
        this.openMouseTipOption = option;
    }

    openMouseTip(label) {
        this.openMouseTipLabel = label;
        this.closeMouseTip();
        let the = this;
        this.openMouseTipHandler = new Cesium.ScreenSpaceEventHandler(
            the.viewer.scene.canvas
        );
        this.openMouseTipHandler.setInputAction(function (event) {
            var position = event.endPosition;
            var ray = the.viewer.camera.getPickRay(position);
            var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
            if (Cesium.defined(cartesian)) {
                if (!the.openMouseTipLabelEntity) {
                    the.openMouseTipLabelEntity = the.viewer.entities.add({
                        position: cartesian,
                        label: {
                            text: the.openMouseTipLabel,
                            font: "14px 宋体",
                            showBackground: true,
                            pixelOffset: new Cesium.Cartesian2(20, 0),
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            backgroundColor: new Cesium.Color.fromCssColorString(
                                the.openMouseTipOption.backgroundColor
                            ).withAlpha(1),
                            fillColor: new Cesium.Color.fromCssColorString(
                                the.openMouseTipOption.color
                            ).withAlpha(1),
                        },
                    });
                } else {
                    the.openMouseTipLabelEntity.position = cartesian;
                    the.openMouseTipLabelEntity.label.text = the.openMouseTipLabel;
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    closeMouseTip() {
        if (this.openMouseTipHandler) {
            this.openMouseTipHandler.destroy();
            this.openMouseTipHandler = null;
        }
        if (this.openMouseTipLabelEntity) {
            this.viewer.entities.remove(this.openMouseTipLabelEntity);
            this.openMouseTipLabelEntity = null;
        }
    }

    updateMouseTip(label) {
        this.openMouseTipLabel = label;
        if (this.openMouseTipLabelEntity) {
            this.openMouseTipLabelEntity.label.text = this.openMouseTipLabel;
        }
    }

    createBezierSpline(latlngArr) {
        return this.mapToolLogic.createBezierSpline(latlngArr);
    }
}
