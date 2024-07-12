import * as Cesium from "cesium";
import * as turf from "@turf/turf";
import { nextTick } from "vue";
import CesiumNavigation from "cesium-navigation-es6";
import SkyBoxOnGround from "../../dependentLib/skyboxExtend.js";

export const mapTool = {
  measureLineLengthEntitys: [],
  measureLineLengthHandler: null,
  measureAreaSpaceEntitys: [],
  measureAreaSpaceHandler: null,
  cesiumNavigation: null, //指南针罗盘
  openMapInfoHtmlOverlay: null, //地图信息

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
    // this.viewer.scene.preUpdate.addEventListener(() => {
    //   let position = this.viewer.scene.camera.position;
    //   let cameraHeight = Cesium.Cartographic.fromCartesian(position).height;
    //   if (cameraHeight < 240000) {
    //     this.viewer.scene.skyBox = skybox;
    //     this.viewer.scene.skyAtmosphere.show = false; //关闭地球大气层
    //   } else {
    //     this.viewer.scene.skyBox = this.defaultSkybox; //使用系统默认星空天空盒
    //     this.viewer.scene.skyAtmosphere.show = true; //显示大气层
    //   }
    // });
  },
  removeSkyBox() {
    //this.viewer.scene.skyBox.show = false;
    this.viewer.scene.skyBox = this.viewer.defaultSkybox;
    this.viewer.scene.skyAtmosphere.show = true; //显示大气层
  },

  //世界坐标转经纬度
  cartesian3ToLngLat(cartesian3) {
    let ellipsoid = this.viewer.scene.globe.ellipsoid;
    let cartographic = ellipsoid.cartesianToCartographic(cartesian3);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let lng = Cesium.Math.toDegrees(cartographic.longitude);
    let height = cartographic.height;
    return { lat: lat, lng: lng, height: height };
  },
  //经纬度转世界坐标
  lngLatToCartesian3(lngLatHeight) {
    if (!lngLatHeight.height) {
      lngLatHeight.height = 0;
    }
    let cartesian3 = Cesium.Cartesian3.fromDegrees(
      lngLatHeight.lng,
      lngLatHeight.lat,
      lngLatHeight.height
    );
    return cartesian3;
  },
  //经纬度转世界坐标
  lngLatArrToCartesian3(lngLatArr) {
    if (!lngLatArr[2]) {
      lngLatArr[2] = 0;
    }
    let cartesian3 = Cesium.Cartesian3.fromDegrees(
      lngLatArr[0],
      lngLatArr[1],
      lngLatArr[2]
    );
    return cartesian3;
  },
  //打开地图信息
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
        //将笛卡尔三维坐标转为地图坐标（弧度）
        var cartographic =
          the.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        //将地图坐标（弧度）转为十进制的度数
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
  },
  closeMapInfo() {
    this.openMapInfoHtmlOverlay.style.display = "none";
  },
  //测量距离
  measureLineLength(callback) {
    let distanceCount = 0;
    let points = [];
    let gatherPolyline = null;
    this.measureLineLengthHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.canvas
    );
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    let the = this;
    // 对鼠标按下事件的监听
    this.measureLineLengthHandler.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
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
        //叠加线
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
        } else {
          //CallbackProperty监听point变化值会自动set
        }
        //叠加测量点
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
        let centerPoint = the.measureCenterByCartesian(
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
      //鼠标变成加号
      document.getElementById(the.cesiumID).style.cursor = "default";
      the.measureLineLengthHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
      the.measureLineLengthHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.RIGHT_CLICK
      );
      callback(distanceCount);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  //清除所有采集线相关实体
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
  },
  //计算出两点距离（内部接口）
  measureCenterByCartesian(from, to) {
    // 转换为Cartographic
    var carto1 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(from);
    var carto2 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(to);
    // 计算中心点的经纬度
    var lon = (carto1.longitude + carto2.longitude) / 2;
    var lat = (carto1.latitude + carto2.latitude) / 2;
    var center = Cesium.Cartographic.fromRadians(lon, lat);
    // 将中心点的经纬度转换回Cartesian3
    let centerPoint = Cesium.Ellipsoid.WGS84.cartographicToCartesian(center);
    return centerPoint;
  },

  //测量面积
  measureAreaSpace(callback) {
    var points = [];
    var gatherPolygon = null;

    this.measureAreaSpaceHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    );

    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    let the = this;
    // 对鼠标按下事件的监听
    this.measureAreaSpaceHandler.setInputAction((event) => {
      //获取加载地形后对应的经纬度和高程：地标坐标
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
          //console.log("cartographic",cartographic);
          var obj = {};
          obj.lat = Cesium.Math.toDegrees(cartographic.latitude);
          obj.lng = Cesium.Math.toDegrees(cartographic.longitude);
          objArr.push(obj);
        }
        console.log("采集的面坐标(经纬度)", objArr);

        let featuresArr = [];
        let areaXYArr = [];
        objArr.forEach((obj, index) => {
          featuresArr.push(turf.point([obj.lng, obj.lat]));
          areaXYArr.push([obj.lng, obj.lat]);
        });

        var features = turf.featureCollection(featuresArr);
        var center = turf.center(features);
        console.log("center232", center);

        let lngTemp = center.geometry.coordinates[0];
        let latTemp = center.geometry.coordinates[1];

        areaXYArr.push(areaXYArr[0]);
        console.log("areaXYArr", areaXYArr);
        var polygon = turf.polygon([areaXYArr]);
        var area = turf.area(polygon);
        console.log("area", area);
        let textDisance = "";
        if (area > 10000) {
          textDisance = (area / 1000000).toFixed(2) + "k㎡";
        } else {
          textDisance = area.toFixed(2) + "㎡";
        }

        let labelTemp = the.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lngTemp, latTemp),
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
        //鼠标变成加号
        document.getElementById(the.cesiumID).style.cursor = "default";
        //移除地图点击事件
        the.measureAreaSpaceHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        ); //移除事件
        the.measureAreaSpaceHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.RIGHT_CLICK
        ); //移除事件
        callback(area);
      } else {
        this.clearMeasureAreaSpaceEntitys();
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },

  //清除所有采集面相关实体
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
  },

  //打开指南针
  openCompassTool(option) {
    // 创建罗盘等控件
    if (!this.cesiumNavigation) {
      this.cesiumNavigation = new CesiumNavigation(this.viewer, {
        enableCompass: true,
        enableZoomControls: false, //是否启用缩放控件
        enableDistanceLegend: false,
      });
    }
    const elements = document.getElementsByClassName("compass");
    console.log("elements132", elements);
    elements[0].style.display = "none";
    for (let key in option) {
      elements[0].style[key] = option[key];
    }
    nextTick(() => {
      elements[0].style.display = "block";
    });
  },
  //关闭罗盘
  closeCompassTool() {
    if (this.cesiumNavigation) {
      const elements = document.getElementsByClassName("compass");
      elements[0].style.display = "none";
    }
  },
  //打开指南针
  openScaleTool(option) {
    console.log("openScaleTool--option", option);
    if (!this.cesiumNavigation) {
      this.cesiumNavigation = new CesiumNavigation(this.viewer, {
        enableCompass: false,
        enableZoomControls: false, //是否启用缩放控件
        enableDistanceLegend: true,
      });
    }
    const elements = document.getElementsByClassName("distance-legend");
    elements[0].style.display = "none";
    for (let key in option) {
      elements[0].style[key] = option[key];
    }
    //比例尺样式
    const scaleLabel = document.getElementsByClassName("distance-legend-label");
    scaleLabel[0].style.color = "#000000";

    const scaleLegend = document.getElementsByClassName(
      "distance-legend-scale-bar"
    );
    scaleLegend[0].style.borderLeft = "1px solid #000000";
    scaleLegend[0].style.borderRight = "1px solid #000000";
    scaleLegend[0].style.borderBottom = "1px solid #000000";

    nextTick(() => {
      elements[0].style.display = "block";
    });
  },
  //关闭比例尺
  closeScaleTool() {
    if (this.cesiumNavigation) {
      const elements = document.getElementsByClassName("distance-legend");
      elements[0].style.display = "none";
    }
  },

  openMouseTipHandler: null,
  openMouseTipLabelEntity: null,
  openMouseTipLabel: "",
  openMouseTipOption: { backgroundColor: "#001129", color: "#FFFFFF" },
  setOpenMouseTipOption(option) {
    this.openMouseTipOption = option;
  },
  /**
   * 打开鼠标提示
   * @param {*} label
   */
  openMouseTip(label) {
    this.openMouseTipLabel = label;
    //关闭鼠标提示
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
  },
  /**
   * 关闭鼠标提示
   */
  closeMouseTip() {
    //移除事件
    if (this.openMouseTipHandler) {
      this.openMouseTipHandler.destroy();
      this.openMouseTipHandler = null;
    }
    //移除标注
    if (this.openMouseTipLabelEntity) {
      this.viewer.entities.remove(this.openMouseTipLabelEntity);
      this.openMouseTipLabelEntity = null;
    }
  },
  /**
   * 更新鼠标提示内容
   * @param {*} label
   */
  updateMouseTip(label) {
    this.openMouseTipLabel = label;
    if (this.openMouseTipLabelEntity) {
      this.openMouseTipLabelEntity.label.text = this.openMouseTipLabel;
    }
  },
};
