import * as Cesium from 'cesium';
import * as turf from '@turf/turf';
import { nextTick } from 'vue';
import CesiumNavigation from 'cesium-navigation-es6';

//点线面采集方法
const mapServer = {
  //添加高德标准地图
  addGaodeLayer(url) {
    var imgProvider = new Cesium.UrlTemplateImageryProvider({ url: url });
    this.viewer.imageryLayers.addImageryProvider(imgProvider);
    return imgProvider;
  },
  //天地图平面地图加载
  addTdtVecLayer() {
    let url =
      "https://t4.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=2cf56b2e77c1be9a456ef411d808daad";
    return this.addTdtLayer(url);
  },

  //加载天地图平面注记地图加载
  addTdtCvaLayer() {
    let url =
      "https://t4.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=2cf56b2e77c1be9a456ef411d808daad";
    return this.addTdtLayer(url);
  },

  //天地图影像地图加载
  addTdtImgLayer() {
    let url =
      "https://t4.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=2cf56b2e77c1be9a456ef411d808daad";
    return this.addTdtLayer(url);
  },

  //天地图影像地图加载
  addTdtCiaLayer() {
    let url =
      "https://t4.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=2cf56b2e77c1be9a456ef411d808daad";
    return this.addTdtLayer(url);
  },

  //天地图道路地图加载
  addTdtCtaLayer() {
    let url =
      "https://t4.tianditu.gov.cn/cta_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=2cf56b2e77c1be9a456ef411d808daad";
    return this.addTdtLayer(url);
  },

  //其他天地图服务
  addTdtLayer(url) {
    var mapOption = {
      url: url,
    };
    var imgProvider = new Cesium.UrlTemplateImageryProvider(mapOption);
    let mapLayer = this.viewer.imageryLayers.addImageryProvider(imgProvider);
    return mapLayer;
  },

  //arcgis瓦片服务加载
  addArcgisImgLayer() {
    let url =
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    return this.addCustomLayer(url);
  },

  //自定义地图服务
  addCustomLayer(url) {
    var mapOption = {
      url: url,
    };
    var imgProvider = new Cesium.UrlTemplateImageryProvider(mapOption);
    let mapLayer = this.viewer.imageryLayers.addImageryProvider(imgProvider);
    return mapLayer;
  },

  //叠加wms图层服务
  addWmslayer(url, layerName) {
    var wms = new Cesium.WebMapServiceImageryProvider({
      url: url,
      layers: layerName,
      parameters: {
        transparent: true, //透明配置
        service: "WMS",
        format: "image/png",
        srs: "EPSG:4326",
      },
    });
    let wmsLayer = this.viewer.imageryLayers.addImageryProvider(wms);
    return wmsLayer;
  },

  //删除地图图层
  removeMapLayer(mapLayer) {
    this.viewer.imageryLayers.remove(mapLayer, true);
  },
  hideMapLayer() {},
};

//点线面采集方法
const dataServer = {
  //添加倾斜摄影服务
  async addObliquePhotography(url, option) {
    try {
      const tileset = await Cesium.Cesium3DTileset.fromUrl(url, option);
      this.viewer.scene.primitives.add(tileset);
      return tileset;
    } catch (error) {
      console.log(`Error loading tileset: ${error}`);
    }
  },
  //移除倾斜摄影
  removeObliquePhotography(tileset) {
    this.viewer.scene.primitives.remove(tileset);
  },
  //添加地形服务
  async addTerrain(url) {
    try {
      var terrainLayer = await Cesium.CesiumTerrainProvider.fromUrl(url, {});
      this.viewer.scene.terrainProvider = terrainLayer;
      return terrainLayer;
    } catch (error) {
      console.log(`Error loading tileset: ${error}`);
    }
  },
  removeTerrain() {
    this.viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  },
  //解析geojson数据
  readGeojson(geojson) {
    let promise = Cesium.GeoJsonDataSource.load(geojson);
    return promise;
  },
  //添加geojson
  addGeojson(dataSource, option) {
    this.viewer.dataSources.add(dataSource);
    option.stroke = Cesium.Color.fromCssColorString(option.stroke);
    option.fill = Cesium.Color.fromCssColorString(option.fill).withAlpha(
      option.fillAlpha
    );
    dataSource.entities.values.forEach(function (entity) {
      if (entity.polygon) {
        entity.polygon.outline = false;
        entity.polygon.material = option.fill;
        entity.polyline = {
          positions: entity.polygon.hierarchy._value.positions,
          width: option.strokeWidth,
          material: option.stroke,
        };
      }
    });
    return dataSource;
  },

  //解析kml数据
  readKml(kml) {
    let promise = Cesium.KmlDataSource.load(kml, {
      camera: this.viewer.scene.camera,
      canvas: this.viewer.scene.canvas,
      screenOverlayContainer: this.viewer.container,
    });
    return promise;
  },
  addKml(dataSource) {
    this.viewer.dataSources.add(dataSource);
    return dataSource;
  },

  //移除某个dataSource
  removeDataSource(dataSource) {
    this.viewer.dataSources.remove(dataSource);
  },
};

//以下代码复制自Cesium源码的SkyBox，然后做了一点点修改。

const BoxGeometry = Cesium.BoxGeometry;
const Cartesian3 = Cesium.Cartesian3;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const destroyObject = Cesium.destroyObject;
const DeveloperError = Cesium.DeveloperError;
const GeometryPipeline = Cesium.GeometryPipeline;
const Matrix3 = Cesium.Matrix3;
const Matrix4 = Cesium.Matrix4;
const Transforms = Cesium.Transforms;
const VertexFormat = Cesium.VertexFormat;
const BufferUsage = Cesium.BufferUsage;
const CubeMap = Cesium.CubeMap;
const DrawCommand = Cesium.DrawCommand;
const loadCubeMap = Cesium.loadCubeMap;
const RenderState = Cesium.RenderState;
const VertexArray = Cesium.VertexArray;
const BlendingState = Cesium.BlendingState;
const SceneMode = Cesium.SceneMode;
const ShaderProgram = Cesium.ShaderProgram;
const ShaderSource = Cesium.ShaderSource;
//片元着色器，直接从源码复制
const SkyBoxFS =
  "uniform samplerCube u_cubeMap;\n\
  varying vec3 v_texCoord;\n\
  void main()\n\
  {\n\
  vec4 color = textureCube(u_cubeMap, normalize(v_texCoord));\n\
  gl_FragColor = vec4(czm_gammaCorrect(color).rgb, czm_morphTime);\n\
  }\n\
  ";

//顶点着色器有修改，主要是乘了一个旋转矩阵
const SkyBoxVS =
  "attribute vec3 position;\n\
  varying vec3 v_texCoord;\n\
  uniform mat3 u_rotateMatrix;\n\
  void main()\n\
  {\n\
  vec3 p = czm_viewRotation * u_rotateMatrix * (czm_temeToPseudoFixed * (czm_entireFrustum.y * position));\n\
  gl_Position = czm_projection * vec4(p, 1.0);\n\
  v_texCoord = position.xyz;\n\
  }\n\
  ";
/**
 * 为了兼容高版本的Cesium，因为新版cesium中getRotation被移除
 */
if (!Cesium.defined(Cesium.Matrix4.getRotation)) {
  Cesium.Matrix4.getRotation = Cesium.Matrix4.getMatrix3;
}
function SkyBoxOnGround(options) {
  /**
   * 近景天空盒
   * @type Object
   * @default undefined
   */
  this.sources = options.sources;
  this._sources = undefined;

  /**
   * Determines if the sky box will be shown.
   *
   * @type {Boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  this._command = new DrawCommand({
    modelMatrix: Matrix4.clone(Matrix4.IDENTITY),
    owner: this,
  });
  this._cubeMap = undefined;

  this._attributeLocations = undefined;
  this._useHdr = undefined;
}

const skyboxMatrix3 = new Matrix3();
SkyBoxOnGround.prototype.update = function (frameState, useHdr) {
  const that = this;

  if (!this.show) {
    return undefined;
  }

  if (
    frameState.mode !== SceneMode.SCENE3D &&
    frameState.mode !== SceneMode.MORPHING
  ) {
    return undefined;
  }

  if (!frameState.passes.render) {
    return undefined;
  }

  const context = frameState.context;

  if (this._sources !== this.sources) {
    this._sources = this.sources;
    const sources = this.sources;

    if (
      !defined(sources.positiveX) ||
      !defined(sources.negativeX) ||
      !defined(sources.positiveY) ||
      !defined(sources.negativeY) ||
      !defined(sources.positiveZ) ||
      !defined(sources.negativeZ)
    ) {
      throw new DeveloperError(
        "this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties."
      );
    }

    if (
      typeof sources.positiveX !== typeof sources.negativeX ||
      typeof sources.positiveX !== typeof sources.positiveY ||
      typeof sources.positiveX !== typeof sources.negativeY ||
      typeof sources.positiveX !== typeof sources.positiveZ ||
      typeof sources.positiveX !== typeof sources.negativeZ
    ) {
      throw new DeveloperError(
        "this.sources properties must all be the same type."
      );
    }

    if (typeof sources.positiveX === "string") {
      // Given urls for cube-map images.  Load them.
      loadCubeMap(context, this._sources).then(function (cubeMap) {
        that._cubeMap = that._cubeMap && that._cubeMap.destroy();
        that._cubeMap = cubeMap;
      });
    } else {
      this._cubeMap = this._cubeMap && this._cubeMap.destroy();
      this._cubeMap = new CubeMap({
        context: context,
        source: sources,
      });
    }
  }

  const command = this._command;

  command.modelMatrix = Transforms.eastNorthUpToFixedFrame(
    frameState.camera._positionWC
  );
  if (!defined(command.vertexArray)) {
    command.uniformMap = {
      u_cubeMap: function () {
        return that._cubeMap;
      },
      u_rotateMatrix: function () {
        return Matrix4.getRotation(command.modelMatrix, skyboxMatrix3);
      },
    };

    const geometry = BoxGeometry.createGeometry(
      BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(2.0, 2.0, 2.0),
        vertexFormat: VertexFormat.POSITION_ONLY,
      })
    );
    const attributeLocations = (this._attributeLocations =
      GeometryPipeline.createAttributeLocations(geometry));

    command.vertexArray = VertexArray.fromGeometry({
      context: context,
      geometry: geometry,
      attributeLocations: attributeLocations,
      bufferUsage: BufferUsage._DRAW,
    });

    command.renderState = RenderState.fromCache({
      blending: BlendingState.ALPHA_BLEND,
    });
  }

  if (!defined(command.shaderProgram) || this._useHdr !== useHdr) {
    const fs = new ShaderSource({
      defines: [useHdr ? "HDR" : ""],
      sources: [SkyBoxFS],
    });
    command.shaderProgram = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: SkyBoxVS,
      fragmentShaderSource: fs,
      attributeLocations: this._attributeLocations,
    });
    this._useHdr = useHdr;
  }

  if (!defined(this._cubeMap)) {
    return undefined;
  }

  return command;
};
SkyBoxOnGround.prototype.isDestroyed = function () {
  return false;
};
SkyBoxOnGround.prototype.destroy = function () {
  const command = this._command;
  command.vertexArray = command.vertexArray && command.vertexArray.destroy();
  command.shaderProgram =
    command.shaderProgram && command.shaderProgram.destroy();
  this._cubeMap = this._cubeMap && this._cubeMap.destroy();
  return destroyObject(this);
};

const mapTool = {
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
    let defaultSkybox = this.viewer.scene.skyBox; //先把系统默认的天空盒保存下来
    let currSkyBox = skybox;
    this.viewer.scene.preUpdate.addEventListener(() => {
      let position = this.viewer.scene.camera.position;
      let cameraHeight = Cesium.Cartographic.fromCartesian(position).height;
      if (cameraHeight < 240000) {
        this.viewer.scene.skyBox = currSkyBox;
        this.viewer.scene.skyAtmosphere.show = false; //关闭地球大气层
      } else {
        this.viewer.scene.skyBox = defaultSkybox; //使用系统默认星空天空盒
        this.viewer.scene.skyAtmosphere.show = true; //显示大气层
      }
    });
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
};

const addPrimitive = {
  ffCesiumPointPrimitiveCollection: null, //大量点
  ffCesiumPrimitiveCollection: null, //大量线，面
  ffCesiumBillboardPrimitiveCollection: null, //大量广告牌
  ffCesiumGltfCollection: null, //大量模型
  //初始化
  addPrimitiveInit() {
    this.ffCesiumPointPrimitiveCollection = this.viewer.scene.primitives.add(
      new Cesium.PointPrimitiveCollection()
    );
    this.ffCesiumPrimitiveCollection = this.viewer.scene.primitives.add(
      new Cesium.PrimitiveCollection()
    );
    this.ffCesiumGltfCollection = this.viewer.scene.primitives.add(
      new Cesium.PrimitiveCollection()
    );
    this.ffCesiumBillboardPrimitiveCollection =
      this.viewer.scene.primitives.add(new Cesium.BillboardCollection());
  },
  //添加gltf/glb模型
  async addGltfPrimitive(lngLatHeight, option) {
    const position = Cesium.Cartesian3.fromDegrees(
      lngLatHeight[0],
      lngLatHeight[1],
      lngLatHeight[2]
    );

    let heading = Cesium.Math.toRadians(option.headingAngle);
    let pitch = Cesium.Math.toRadians(option.pitchAngle);
    let roll = Cesium.Math.toRadians(option.rollAngle);
    let headingPositionRoll = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    //const headingPositionRoll = new Cesium.HeadingPitchRoll();
    const fixedFrameTransform =
      Cesium.Transforms.localFrameToFixedFrameGenerator("north", "west");
    try {
      const model = await Cesium.Model.fromGltfAsync({
        url: option.url,
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
          position,
          headingPositionRoll,
          Cesium.Ellipsoid.WGS84,
          fixedFrameTransform
        ),
        minimumPixelSize: option.minimumPixelSize,
        maximumScale: option.maximumScale,
      });
      model.FFtype = "FFGltfPrimitive";
      this.ffCesiumGltfCollection.add(model);
      return model;
    } catch (error) {
      console.log(`Failed to load model. ${error}`);
    }
  },

  //添加广告牌
  addBillboardPrimitive(lngLatHeight, option) {
    let primitive = this.ffCesiumBillboardPrimitiveCollection.add({
      position: Cesium.Cartesian3.fromDegrees(
        lngLatHeight[0],
        lngLatHeight[1],
        lngLatHeight[2]
      ),
      image: option.image,
      pixelOffset: new Cesium.Cartesian2(
        option.pixelOffset[0],
        option.pixelOffset[1]
      ),
    });
    primitive.FFtype = "FFBillboardPrimitive";
    return primitive;
  },

  //添加点图元
  addPointPrimitive(lngLatHeight, option) {
    let newOption = Object.assign({}, option);
    //其他特殊参数设置
    newOption.position = Cesium.Cartesian3.fromDegrees(
      lngLatHeight[0],
      lngLatHeight[1],
      lngLatHeight[2]
    );

    //颜色属性设置
    newOption.color = new Cesium.Color.fromCssColorString(
      option.color
    ).withAlpha(option.alpha);

    if (option.outlineColor) {
      newOption.outlineColor = new Cesium.Color.fromCssColorString(
        option.outlineColor
      );
    }
    let primitive = this.ffCesiumPointPrimitiveCollection.add(newOption);
    primitive.FFtype = "FFPointPrimitive";
    return primitive;
  },
  //添加线图元
  addPolylinePrimitive(lnglatArr, option) {
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(lnglatArr.flat()),
        width: option.width,
      }),
    });
    const primitive = new Cesium.Primitive({
      geometryInstances: instance, //可以是实例数组
      appearance: new Cesium.PolylineMaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: "Color",
            uniforms: {
              color: new Cesium.Color.fromCssColorString(
                option.color
              ).withAlpha(option.alpha),
            },
          },
        }),
      }),
    });
    this.ffCesiumPrimitiveCollection.add(primitive);
    primitive.FFtype = "FFPolylinePrimitive";
    return primitive;
  },
  //添加面图元
  addPolygonPrimitive(lnglatArr, option) {
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray(lnglatArr.flat())
        ),
      }),
    });
    const primitive = new Cesium.Primitive({
      geometryInstances: instance, //可以是实例数组
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: "Color",
            uniforms: {
              color: new Cesium.Color.fromCssColorString(
                option.color
              ).withAlpha(option.alpha),
            },
          },
        }),
      }),
    });
    this.ffCesiumPrimitiveCollection.add(primitive);
    primitive.FFtype = "FFPolygonPrimitive";
    return primitive;
  },
  //删除原始图形Primitive
  removeFFPrimitive(FFPrimitive) {
    console.log("removeFFPrimitive--FFPrimitive", FFPrimitive);
    if (FFPrimitive.FFtype) {
      if (FFPrimitive.FFtype == "FFPointPrimitive") {
        this.ffCesiumPointPrimitiveCollection.remove(FFPrimitive);
      } else if (FFPrimitive.FFtype == "FFBillboardPrimitive") {
        this.ffCesiumBillboardPrimitiveCollection.remove(FFPrimitive);
      } else if (FFPrimitive.FFtype == "FFGltfPrimitive") {
        this.ffCesiumGltfCollection.remove(FFPrimitive);
      } else if (
        FFPrimitive.FFtype == "FFPolylinePrimitive" ||
        FFPrimitive.FFtype == "FFPolygonPrimitive"
      ) {
        this.ffCesiumPrimitiveCollection.remove(FFPrimitive);
      }
    }
  },
};

const mapAction = {
  //飞行定位
  flyTo(option, callback) {
    let the = this;
    let cartographics = [
      Cesium.Cartographic.fromDegrees(option.lng, option.lat),
    ];
    cartographics.option = option;
    Cesium.sampleTerrain(
      the.viewer.scene.terrainProvider,
      14,
      cartographics
    ).then((updatedPositions) => {
      updatedPositions.option.height = updatedPositions[0].height;
      let flyToEntity = new Cesium.Entity({
        position: Cesium.Cartesian3.fromDegrees(
          updatedPositions.option.lng,
          updatedPositions.option.lat,
          updatedPositions.option.height
        ),
        point: {
          pixelSize: 1,
          color: Cesium.Color.RED.withAlpha(0.9),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.9),
          outlineWidth: 0,
        },
      });
      the.viewer.entities.add(flyToEntity);
      var flyPromise = the.viewer.flyTo(flyToEntity, {
        duration: option.time, //飞行时间,单位：秒
        offset: {
          heading: Cesium.Math.toRadians(0.0), //旋转角度
          pitch: Cesium.Math.toRadians(updatedPositions.option.pitchRadiu), //倾斜角度
          range: updatedPositions.option.eyeHeight, //视角高度
        },
      });
      // 飞行完后，移除flyToEntity。
      flyPromise.then(function () {
        the.viewer.entities.remove(flyToEntity);
        flyToEntity = null;
        if (callback) {
          callback();
        }
      });
    });
  },
  //定位
  setView(option) {
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        option.lng,
        option.lat,
        option.height
      ),
      orientation: {
        // 指向
        heading: Cesium.Math.toRadians(0, 0),
        // 视角
        pitch: Cesium.Math.toRadians(option.pitchRadiu),
        roll: 0.0,
      },
    });
  },
};

const addOtherElement = {
  addHtml(lngLatHeight, html, offset) {
    let htmlOverlay = document.createElement("div");
    htmlOverlay.style.zIndex = 9999;
    htmlOverlay.style.position = "absolute";
    htmlOverlay.style.display = "none";
    htmlOverlay.innerHTML = html;
    document.getElementById(this.cesiumID).appendChild(htmlOverlay);

    var scratch = new Cesium.Cartesian2();
    let the = this;
    this.viewer.scene.preRender.addEventListener(function () {
      var position = Cesium.Cartesian3.fromDegrees(
        lngLatHeight[0],
        lngLatHeight[1],
        lngLatHeight[2]
      );
      var canvasPosition = the.viewer.scene.cartesianToCanvasCoordinates(
        position,
        scratch
      );
      if (Cesium.defined(canvasPosition)) {
        let top = htmlOverlay.offsetHeight + offset.top;
        let left = htmlOverlay.offsetWidth / 2 + offset.left;
        htmlOverlay.style.top = canvasPosition.y - top + "px";
        htmlOverlay.style.left = canvasPosition.x - left + "px";
      }
      if (htmlOverlay.style.display == "none") {
        window.setTimeout(() => {
          htmlOverlay.style.display = "block";
        }, 50);
      }
    });
    return htmlOverlay;
  },

  removeHtml(htmlOverlay) {
    document.getElementById(this.cesiumID).removeChild(htmlOverlay);
  },
};

const elementGather = {
  //点采集
  pointGather(callback, option) {
    let the = this;
    let gatherPointEntity = null;
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // 对鼠标按下事件的监听
    handler.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      gatherPointEntity = the.viewer.entities.add({
        position: cartesian,
        point: {
          color: Cesium.Color.fromCssColorString(option.color).withAlpha(
            option.alpha
          ),
          pixelSize: option.pixelSize,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      //笛卡尔坐标转经纬度坐标
      var ellipsoid = the.viewer.scene.globe.ellipsoid;
      var cartographic = ellipsoid.cartesianToCartographic(cartesian);
      gatherPointEntity.gatherPoint = {};
      gatherPointEntity.gatherPoint.lng = Cesium.Math.toDegrees(
        cartographic.longitude
      );
      gatherPointEntity.gatherPoint.lat = Cesium.Math.toDegrees(
        cartographic.latitude
      );
      gatherPointEntity.gatherPoint.height = cartographic.height;
      //鼠标变成默认
      document.getElementById(the.cesiumID).style.cursor = "default";
      //移除地图点击事件
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK); //移除事件
      callback(gatherPointEntity);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  },
  //线采集
  polylineGather(callback, option) {
    let the = this;
    let gatherPolylineEntity = null;
    let entityPoints = [];
    let cartesianPoints = [];
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // 对鼠标按下事件的监听
    handler.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
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
      entityPoints.push(point);
      cartesianPoints.push(cartesian);

      if (cartesianPoints.length >= 2) {
        if (gatherPolylineEntity == null) {
          gatherPolylineEntity = the.viewer.entities.add({
            polyline: {
              positions: new Cesium.CallbackProperty(function (time, result) {
                return cartesianPoints;
              }, false),
              width: option.width,
              clampToGround: true,
              material: new Cesium.Color.fromCssColorString(
                option.color
              ).withAlpha(option.alpha),
            },
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function (rightClick) {
      var dke = gatherPolylineEntity.polyline.positions.getValue();
      gatherPolylineEntity.gatherPoints = [];
      for (var i = 0; i < dke.length; i++) {
        var ellipsoid = the.viewer.scene.globe.ellipsoid;
        var cartesian3 = new Cesium.Cartesian3(dke[i].x, dke[i].y, dke[i].z);
        var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
        //console.log("cartographic",cartographic);
        var obj = {};
        obj.lng = Cesium.Math.toDegrees(cartographic.longitude);
        obj.lat = Cesium.Math.toDegrees(cartographic.latitude);
        obj.height = cartographic.height;
        gatherPolylineEntity.gatherPoints.push(obj);
      }
      for (var i = 0; i < entityPoints.length; i++) {
        the.viewer.entities.remove(entityPoints[i]);
      }
      entityPoints = [];
      //鼠标变成加号
      document.getElementById(the.cesiumID).style.cursor = "default";
      //移除地图点击事件
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      //移除地图点击事件
      handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      callback(gatherPolylineEntity);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
  //面采集
  polygonGather(callback, option) {
    let the = this;
    let gatherPolygonEntity = null;
    let entityPoints = [];
    let cartesianPoints = [];
    //鼠标变成加号
    document.getElementById(this.cesiumID).style.cursor = "crosshair";
    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // 对鼠标按下事件的监听
    handler.setInputAction(function (event) {
      //获取加载地形后对应的经纬度和高程：地标坐标
      var ray = the.viewer.camera.getPickRay(event.position);
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
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
      entityPoints.push(point);
      cartesianPoints.push(cartesian);

      if (cartesianPoints.length >= 3) {
        if (gatherPolygonEntity == null) {
          gatherPolygonEntity = the.viewer.entities.add({
            polygon: {
              hierarchy: new Cesium.CallbackProperty(function (time, result) {
                var hierarchyTemp = new Cesium.PolygonHierarchy(
                  cartesianPoints,
                  null
                );
                return hierarchyTemp;
              }, false),
              material: Cesium.Color.fromCssColorString(option.color).withAlpha(
                option.alpha
              ),
            },
          });
        } else {
          gatherPolygonEntity.polygon.hierarchy = new Cesium.CallbackProperty(
            function (time, result) {
              var hierarchyTemp = new Cesium.PolygonHierarchy(
                cartesianPoints,
                null
              );
              return hierarchyTemp;
            },
            false
          );
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function (rightClick) {
      var dke = gatherPolygonEntity.polygon.hierarchy.getValue().positions;
      gatherPolygonEntity.gatherPoints = [];
      for (var i = 0; i < dke.length; i++) {
        var ellipsoid = the.viewer.scene.globe.ellipsoid;
        var cartesian3 = new Cesium.Cartesian3(dke[i].x, dke[i].y, dke[i].z);
        var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
        var obj = {};
        obj.lng = Cesium.Math.toDegrees(cartographic.longitude);
        obj.lat = Cesium.Math.toDegrees(cartographic.latitude);
        obj.height = cartographic.height;
        gatherPolygonEntity.gatherPoints.push(obj);
      }
      for (var i = 0; i < entityPoints.length; i++) {
        the.viewer.entities.remove(entityPoints[i]);
      }
      entityPoints = [];
      //鼠标变成加号
      document.getElementById(the.cesiumID).style.cursor = "default";
      //移除地图点击事件
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      //移除地图点击事件
      handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      callback(gatherPolygonEntity);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  },
};

const myParticleSystem = {
  init(lnglatheight, option) {
    let particlefire = new Cesium.ParticleSystem({
      image: option.url,
      startColor: Cesium.Color.RED.withAlpha(0.1), //粒子在其生命初期的颜色。
      endColor: Cesium.Color.YELLOW.withAlpha(0.5), //粒子寿命结束时的颜色。
      imageSize: new Cesium.Cartesian2(5, 5), //图片比例 宽高
      startScale: 0.5, //开始大小
      endScale: option.endScale, //结束大小
      minimumParticleLife: 1.5, //最短存活时间
      maximumParticleLife: 3, //最长存活时间
      // lifetime: 16.0,//粒子系统发射粒子的时间
      minimumSpeed: 29,
      maximumSpeed: 30,
      emissionRate: 100.0, //粒子数
      // particleLife: 1.0,//粒子生命
      // speed: 5.0,//发射速度
      emitter: new Cesium.CircleEmitter(10.0), //生成区域 粒子发射器。
      sizeInMeters: true, //true 米为单位 false 像素为单位，大小不变
      modelMatrix: this.computeModelMatrix({
        lng: lnglatheight[0],
        lat: lnglatheight[1],
        height: lnglatheight[2],
      }), //位置 （世界矩阵）
      emitterModelMatrix: this.computeEmitterModelMatrix(), //模型矩阵
    });
    return particlefire;
  },
  computeModelMatrix(position) {
    const center = Cesium.Cartesian3.fromDegrees(
      position.lng,
      position.lat,
      position.height
    );
    const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
    return matrix;
  },
  computeEmitterModelMatrix() {
    let hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0); //朝向
    let trs = new Cesium.TranslationRotationScale();
    trs.translation = Cesium.Cartesian3.fromElements(0.0, 0.0, 0.0);
    trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr);
    let result = Cesium.Matrix4.fromTranslationRotationScale(trs);
    return result;
  },
};

const particleSystem = {
  ffCesiumCloudCollection: null, //大量云朵
  addCloudEffect(option) {
    if (!this.ffCesiumCloudCollection) {
      this.ffCesiumCloudCollection = this.viewer.scene.primitives.add(
        new Cesium.CloudCollection({
          noiseDetail: 16.0,
          noiseOffset: Cesium.Cartesian3.ZERO,
        })
      );
    }

    let cloud = this.ffCesiumCloudCollection.add({
      position: Cesium.Cartesian3.fromDegrees(
        option.lng,
        option.lat,
        option.height
      ),
      scale: new Cesium.Cartesian2(option.scaleX, option.scaleY),
      slice: option.slice,
      color: Cesium.Color.fromCssColorString(option.color),
      maximumSize: new Cesium.Cartesian3(
        option.maximumSizeX,
        option.maximumSizeY,
        option.maximumSizeZ
      ),
    });
    return cloud;
  },

  //叠加雨效果
  addRainEffect(option) {
    const FS_Rain = `uniform sampler2D colorTexture;
			 in vec2 v_textureCoordinates;
       uniform float tiltAngle;
       uniform float rainSize;
       uniform float rainWidth;
       uniform float rainSpeed;
			 float hash(float x){
					return fract(sin(x*233.3)*13.13);
			 }
       out vec4 vFragColor;
			void main(void){
				float time = czm_frameNumber / rainSpeed;
			  vec2 resolution = czm_viewport.zw;
			  vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
			  vec3 c=vec3(1.0,1.0,1.0);
			  float a= tiltAngle;
			  float si=sin(a),co=cos(a);
			  uv*=mat2(co,-si,si,co);
			  uv*=length(uv+vec2(0,4.9))*rainSize + 1.;
			  float v = 1.0 - abs(sin(hash(floor(uv.x * rainWidth)) * 2.0));
			  float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;
			  c*=v*b;
        vFragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c,.3), .3);
			}
    `;
    var rainEffect = new Cesium.PostProcessStage({
      name: "FFCesium.addRainEffect",
      fragmentShader: FS_Rain,
      uniforms: {
        tiltAngle: option.tiltAngle, //雨长度
        rainSize: option.rainSize, //雨长度
        rainWidth: option.rainWidth, //雨长度
        rainSpeed: option.rainSpeed, //雨长度
      },
    });
    this.viewer.scene.postProcessStages.add(rainEffect);
    return rainEffect;
  },
  //移除雨效果
  removeRainEffect(rainEffect) {
    this.viewer.scene.postProcessStages.remove(rainEffect);
  },

  //叠加雪效果
  addSnowEffect(option) {
    const FS_Snow = `uniform sampler2D colorTexture;
    in vec2 v_textureCoordinates;
    uniform float snowSpeed;
    float snow(vec2 uv,float scale){
        float time = czm_frameNumber / snowSpeed;
        float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;
        uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;
        uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;
        p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);
        k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
        return k*w;
    }
    out vec4 vFragColor;
    void main(void){
        vec2 resolution = czm_viewport.zw;
        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
        vec3 finalColor=vec3(0);
        float c = 0.0;
        c+=snow(uv,50.)*.0;
        c+=snow(uv,30.)*.0;
        c+=snow(uv,10.)*.0;
        c+=snow(uv,5.);
        c+=snow(uv,4.);
        c+=snow(uv,3.);
        c+=snow(uv,2.);
        finalColor=(vec3(c));
        vFragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.3);
    }
    `;
    var snowEffect = new Cesium.PostProcessStage({
      name: "FFCesium.addSnowEffect",
      fragmentShader: FS_Snow,
      uniforms: {
        snowSpeed: option.snowSpeed, //雪速
      },
    });
    this.viewer.scene.postProcessStages.add(snowEffect);
    return snowEffect;
  },

  //移除雪效果
  removeSnowEffect(snowEffect) {
    this.viewer.scene.postProcessStages.remove(snowEffect);
  },

  //叠加雾效果
  addFogEffect(option) {
    const FS_Fog = `float getDistance(sampler2D depthTexture, vec2 texCoords)
    {
        float depth = czm_unpackDepth(texture(depthTexture, texCoords));
        if (depth == 0.0) {
            return czm_infinity;
        }
        vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
        return -eyeCoordinate.z / eyeCoordinate.w;
    }
    //根据距离，在中间进行插值
    float interpolateByDistance(vec4 nearFarScalar, float distance)
    {
        //根据常识，雾应该是距离远，越看不清，近距离内的物体可以看清
        //因此近距离alpha=0，远距离的alpha=1.0
        //本例中设置可见度为200米
        //雾特效的起始距离
        float startDistance = nearFarScalar.x;
        //雾特效的起始alpha值
        float startValue = nearFarScalar.y;
        //雾特效的结束距离
        float endDistance = nearFarScalar.z;
        //雾特效的结束alpha值
        float endValue = nearFarScalar.w;
        //根据每段距离占总长度的占比，插值alpha，距离越远，alpha值越大。插值范围0,1。
        float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
        return mix(startValue, endValue, t);
    }
    vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
    {
        return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
    }
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    uniform vec4 fogByDistance;
    uniform vec4 fogColor;
    in vec2 v_textureCoordinates;
    void main(void)
    {
        //获取地物距相机的距离
        float distance = getDistance(depthTexture, v_textureCoordinates);
        //获取场景原本的纹理颜色
        vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
        //根据距离，对alpha进行插值
        float blendAmount = interpolateByDistance(fogByDistance, distance);
        //将alpha变化值代入雾的原始颜色中，并将雾与场景原始纹理进行融合
        vec4 finalFogColor = vec4(fogColor.rgb, fogColor.a * blendAmount);
        out_FragColor = alphaBlend(finalFogColor, sceneColor);
    }`;
    var fogEffect = new Cesium.PostProcessStage({
      name: "FFCesium.addFogEffect",
      fragmentShader: FS_Fog,
      uniforms: {
        fogByDistance: new Cesium.Cartesian4(500, 0.0, 4000, option.alpha), //alpha 浓度
        fogColor: Cesium.Color.WHITE,
      },
    });
    this.viewer.scene.postProcessStages.add(fogEffect);
    return fogEffect;
  },
  //移除雾效果
  removeFogEffect(fogEffect) {
    this.viewer.scene.postProcessStages.remove(fogEffect);
  },
  //叠加火焰效果
  addFireEffect(lnglatheight, option) {
    let particlefire = myParticleSystem.init(lnglatheight, option);
    this.viewer.scene.primitives.add(particlefire);
    return particlefire;
  },
  //移除火焰效果
  removeFireEffect(primitive) {
    console.log("removeFireEffect--primitive", primitive);
    this.viewer.scene.primitives.remove(primitive);
  },
};

const polygonEffect = {
  //叠加水面效果
  addWaterSurfaceEffect(lnglatArr, option) {
    let polygonPrimitive = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(
              Cesium.Cartesian3.fromDegreesArray(lnglatArr.flat())
            ),
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
          }),
        }),
        appearance: new Cesium.EllipsoidSurfaceAppearance({
          aboveGround: true,
          material: new Cesium.Material({
            fabric: {
              type: "Water",
              uniforms: {
                normalMap: Cesium.buildModuleUrl(option.image),
                frequency: option.frequency, //频率
                animationSpeed: option.animationSpeed, //动画速度
                amplitude: option.amplitude, //振幅
              },
            },
          }),
        }),
        show: true,
      })
    );
    return polygonPrimitive;
  },
  //移除水面效果
  removeWaterSurfaceEffect(polygonPrimitive) {
    this.viewer.scene.primitives.remove(polygonPrimitive);
  },
};

var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAuCAYAAAHIPq6KAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAUKADAAQAAAABAAAALgAAAAB3AhLhAAADf0lEQVRoBe1bTWsUQRCtnqnZuIagqCzoGvTkyWs8ePcvePXknxAED4I/y7PgQS9KohdBxYAEIQY/9qN9r7MrAyHbnZ1OUrBdMDvDTHX169fV1dU9s+6l97oh4iQiujmWe16kF9ET93jfQy8uVVzlUMNtT/wTmQpgLhb30fvNkUi9WA2tfe19E1Pic700lvs4R+k5hVbvjPxzEBlvzHvvbxNsTEjPAOaqXwkNihnjc51M5eFUpA8uozBTDCazmGKMOsk+lmrQoVcewB168Igsxt0H79c0U4ewFS51RKc2WW+JXP2dqbmsVEdjuZPLZYJBdMUWLqKxicopYt8Ps/hem4rsBt32yD9DDWvtWrpcK4bdK8DEYMkj2tTy7k/GoacICrsX8oALVtxb79fnwQERNjoNZaw7yZRiyA3RJxWQOR5Jpc5QSeuJ3AUq5UyKwx5AJEtbALYGChuCPENykqrKHguTaj2BUvbIdYK6k1QLwCSaFii57bF/hOcNYkyNIWyOUcXy5M0sDlZji2Gm18gnAHQ/DYJjz2dPWxe401KPdCDyf243ORf3RdYxOMIUl2uJtxRVxxTSvyKXCZAH8v8A9Bjdc7mtMpZrQMUQQ3D2AALZdSy4mQKbi4HsMvVOhqCtwcFMxh6DCNQ3Aaw3dcJ03RzAkm7Rj7qIyYHRblAB2GZjmevC4DKstcuYZ9DtTPxTBGtutNaY8swFahUvnzELc9FegU57AJ2Xr2BuvmCyBxBbH7uVl2piNZupG9kDbc7iio6jWZEI7vPC4gAJAAEMSxGRi/wxKNlfvxhs46lCogv22+HP6gbDqbLQwbgi+m1w/DLQ0E6bzA52V6aoTkZyheTNCAxbC1YjtsVeUTA3AHkV1sTMCwOR9MIZoRYxm8LEXY8bQETyarAWSMQ1+LOXFgKTOeGr3SFQ1UhkauTVYesoeGQhMKmzzO8aJbXiHJU4ZIt0YKAQ2IE8Fi0EFgI7MtCxePHAQmBHBjoWLx7YkUB+dPkCiXP43A3nsBrB5kL4Pq+j7ZUorpiHv6ClXIHwwPa0OLglPZPLuSIRBpRvHbh04zH3PJIYKVcezxhQuNw3bl/NSGzvwhQSE9xERyrfwRTJgjMGCcTN7iWYWG0VxbdZPxDwjpBm8aMyi12lByIH88/22wAxowRS2/fK9VEGdE8Ef8w4lJR/J851y/mQgX+Q0aRPfs4pYQAAAABJRU5ErkJggg==";

/*
      流动纹理线
      color 颜色
      duration 持续时间 毫秒
      trailImage 贴图地址
  */
function PolylineFlow(color, trailImage, duration) {
  this._definitionChanged = new Cesium.Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this.color = color;
  this.duration = duration;
  this.trailImage = trailImage;
  this._time = new Date().getTime();
}

Object.defineProperties(PolylineFlow.prototype, {
  isConstant: {
    //该属性是否会随时间变化,为true时只会获取一次数值
    get: function () {
      return false;
    },
  },
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  color: Cesium.createPropertyDescriptor("color"),
});

var MaterialType = "polylineType" + parseInt(Math.random() * 1000);
PolylineFlow.prototype.getType = function (time) {
  return MaterialType;
};

PolylineFlow.prototype.getValue = function (time, result) {
  if (!Cesium.defined(result)) {
    result = {};
  }
  result.color = Cesium.Property.getValueOrClonedDefault(
    this._color,
    time,
    Cesium.Color.WHITE,
    result.color
  );
  result.image = this.trailImage;
  result.time =
    ((new Date().getTime() - this._time) % this.duration) / this.duration;
  return result;
};

PolylineFlow.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineFlow &&
      Cesium.Property.equals(this._color, other._color) &&
      Cesium.Property.equals(this._image, other._image))
  );
};

Cesium.Material._materialCache.addMaterial(MaterialType, {
  fabric: {
    type: MaterialType,
    uniforms: {
      color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
      image: Cesium.Material.DefaultImageId,
      time: -20,
    },
    source: _getPolylineShader(),
  },
  translucent: function (material) {
    return true;
  },
});
/**
 * 自定义材质
 */
function _getPolylineShader() {
  var materail =
    "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
          {\n\
                czm_material material = czm_getDefaultMaterial(materialInput);\n\
                vec2 st = materialInput.st;\n\
                vec4 colorImage = texture(image, vec2(fract(st.s - time), st.t));\n\
                material.alpha = colorImage.a * color.a;\n\
                material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
                return material;\n\
          }";

  return materail;
}
//Cesium.PolylineFlow = PolylineFlow;//CDN

const polylineEffect = {
  //添加线的移动点
  addPolylineMovePoint(movePointArr, option) {
    let pointEntityArray = [];
    var line = turf.lineString(movePointArr);
    var length = turf.length(line, { units: "meters" });
    var chunk = null;
    if (length > 40000) {
      chunk = turf.lineChunk(line, 80, { units: "meters" });
    } else if (length > 5000) {
      chunk = turf.lineChunk(line, 60, { units: "meters" });
    } else if (length > 1000) {
      chunk = turf.lineChunk(line, 40, { units: "meters" });
    } else {
      chunk = turf.lineChunk(line, 20, { units: "meters" });
    }
    for (let i = 0; i < chunk.features.length; i++) {
      if (i % 30 == 0 && chunk.features.length - i > 16) {
        let movePoint = null;
        if (option.addType == "entity") {
          movePoint = this.addPolylineMovePointByEntity(chunk, i, option);
          pointEntityArray.push(movePoint);
        } else {
          movePoint = this.addPolylineMovePointByPrimitive(chunk, i, option);
          pointEntityArray.push(movePoint);
        }
      }
    }
    pointEntityArray.addType = option.addType;
    return pointEntityArray;
  },
  //通过Primitive添加线移动点
  addPolylineMovePointByPrimitive(chunk, indexFlag, option) {
    let lnglat = [
      chunk.features[0].geometry.coordinates[1][0],
      chunk.features[0].geometry.coordinates[1][1],
      option.height,
    ];
    let pointPrimitive = this.addPointPrimitive(lnglat, option);
    let intervalTimer = setInterval(() => {
      if (indexFlag < chunk.features.length - 1) {
        indexFlag = indexFlag + 1;
      } else {
        indexFlag = 0;
      }
      const chunkLng = chunk.features[indexFlag].geometry.coordinates[1][0];
      const chunkLat = chunk.features[indexFlag].geometry.coordinates[1][1];
      pointPrimitive.position = Cesium.Cartesian3.fromDegrees(
        chunkLng,
        chunkLat,
        option.height
      );
    }, 20);
    pointPrimitive.intervalTimer = intervalTimer;
    return pointPrimitive;
  },
  //通过entity添加线移动点
  addPolylineMovePointByEntity(chunk, indexFlag, option) {
    let pointEntity = new Cesium.Entity({
      position: Cesium.Cartesian3.fromDegrees(
        chunk.features[0].geometry.coordinates[1][0],
        chunk.features[0].geometry.coordinates[1][1],
        option.height
      ),
      point: {
        pixelSize: option.pixelSize,
        color: Cesium.Color.fromCssColorString(option.color),
      },
    });
    pointEntity.type = "FFCesiumAddMovePoint";
    this.viewer.entities.add(pointEntity);
    pointEntity._position = new Cesium.CallbackProperty(function () {
      if (indexFlag < chunk.features.length - 1) {
        indexFlag = indexFlag + 1;
      } else {
        indexFlag = 0;
      }
      const chunkLng = chunk.features[indexFlag].geometry.coordinates[1][0];
      const chunkLat = chunk.features[indexFlag].geometry.coordinates[1][1];
      var cartesian = Cesium.Cartesian3.fromDegrees(
        chunkLng,
        chunkLat,
        option.height
      );
      return cartesian;
    }, false);
    return pointEntity;
  },
  //移除移动点
  removePolylineMovePoint(polylineMovePointArr) {
    if (polylineMovePointArr.addType == "entity") {
      for (let i = 0; i < polylineMovePointArr.length; i++) {
        this.viewer.entities.remove(polylineMovePointArr[i]);
      }
    } else {
      for (let i = 0; i < polylineMovePointArr.length; i++) {
        clearInterval(polylineMovePointArr[i].intervalTimer);
        this.removeFFPrimitive(polylineMovePointArr[i]);
      }
    }
    polylineMovePointArr = [];
  },
  //添加闪烁线
  addPolylineFlicker(lnglatArr, option) {
    if (option.addType == "entity") {
      return this.addPolylineFlickerByEntity(lnglatArr, option);
    } else {
      return this.addPolylineFlickerByPrimitive(lnglatArr, option);
    }
  },

  //删除闪烁线
  removePolylineFlicker(polylineFlickerObj) {
    if (polylineFlickerObj.addType == "entity") {
      this.viewer.entities.remove(polylineFlickerObj);
    } else {
      clearInterval(polylineFlickerObj.intervalTimer);
      this.viewer.scene.primitives.remove(primitive);
    }
  },

  addPolylineFlickerByPrimitive(lnglatArr, option) {
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(lnglatArr.flat()),
        width: option.width,
      }),
    });
    const primitive = new Cesium.Primitive({
      geometryInstances: instance, //可以是实例数组
      appearance: new Cesium.PolylineMaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: "Color",
            uniforms: {
              color: new Cesium.Color.fromCssColorString(option.color),
            },
          },
        }),
      }),
    });
    primitive.flickerFlag = 1;
    primitive.flickerChangeFlag = "minus";
    let intervalTimer = setInterval(() => {
      if (primitive.flickerChangeFlag == "plus") {
        primitive.flickerFlag = primitive.flickerFlag + 0.02;
        if (primitive.flickerFlag > 1) {
          primitive.flickerChangeFlag = "minus";
        }
      } else if (primitive.flickerChangeFlag == "minus") {
        primitive.flickerFlag = primitive.flickerFlag - 0.02;
        if (primitive.flickerFlag < 0.3) {
          primitive.flickerChangeFlag = "plus";
        }
      }
      primitive.appearance.material.uniforms.color =
        Cesium.Color.fromCssColorString(option.color).withAlpha(
          primitive.flickerFlag
        );
    }, 20);
    primitive.intervalTimer = intervalTimer;
    primitive.addType = option.addType;
    this.viewer.scene.primitives.add(primitive);
    return primitive;
  },

  //添加闪烁线
  addPolylineFlickerByEntity(lnglatArr, option) {
    let FFentity = this.viewer.entities.add({
      show: true,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(lnglatArr.flat()),
        width: 5,
        material: Cesium.Color.fromCssColorString(option.color),
      },
    });
    FFentity.flickerFlag = 1;
    FFentity.flickerChangeFlag = "minus";
    FFentity.polyline = {
      positions: FFentity.polyline.positions,
      width: option.width,
      material: new Cesium.ImageMaterialProperty({
        image: img,
        color: new Cesium.CallbackProperty(function () {
          if (FFentity.flickerChangeFlag == "plus") {
            FFentity.flickerFlag = FFentity.flickerFlag + 0.02;
            if (FFentity.flickerFlag > 1) {
              FFentity.flickerChangeFlag = "minus";
            }
          } else if (FFentity.flickerChangeFlag == "minus") {
            FFentity.flickerFlag = FFentity.flickerFlag - 0.02;
            if (FFentity.flickerFlag < 0.3) {
              FFentity.flickerChangeFlag = "plus";
            }
          }
          return Cesium.Color.fromCssColorString(option.color).withAlpha(
            FFentity.flickerFlag
          );
        }, false),
        repeat: new Cesium.Cartesian2(1.0, 1.0),
        transparent: true,
      }),
    };
    FFentity.addType = option.addType;
    return FFentity;
  },
  //流动线
  addPolylineFlow(lnglatArr, option) {
    console.log("lnglatArr, option", lnglatArr, option);
    let polylineObj = this.viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(lnglatArr.flat()),
        width: option.width,
        material: new PolylineFlow(
          Cesium.Color.fromCssColorString(option.color),
          option.url,
          option.time
        ),
      },
    });
    return polylineObj;
  },
  //删除流动线
  removePolylineFlow(polylineObj) {
    this.viewer.entities.remove(polylineObj);
  },
};

const judgeRelation = {
  //判断点与面空间关系
  judgePointAndPolygon(point, polygon) {
    var pt = turf.point(point);
    polygon.forEach((element) => {
      element.push(element[0]);
    });
    var poly = turf.polygon(polygon);
    let flagTemp = turf.booleanDisjoint(pt, poly);
    return !flagTemp;
  },
  //判断线与面空间关系
  judgePolylineAndPolygon(polyline, polygon) {
    var pl = turf.lineString(polyline);
    polygon.forEach((element) => {
      element.push(element[0]);
    });
    var poly = turf.polygon(polygon);
    let flagTemp = turf.booleanDisjoint(pl, poly);
    return !flagTemp;
  },
  //判断面与面空间关系
  judgePolygonAndPolygon(polygon1, polygon2) {
    polygon1.forEach((element) => {
      element.push(element[0]);
    });
    var pg1 = turf.polygon(polygon1);

    polygon2.forEach((element) => {
      element.push(element[0]);
    });
    var pg2 = turf.polygon(polygon2);
    let flagTemp = turf.booleanDisjoint(pg1, pg2);
    return !flagTemp;
  },
};

//获取模型矩阵
function getModelMatrix(pointA, pointB) {
  //向量AB
  const vector2 = Cesium.Cartesian3.subtract(
    pointB,
    pointA,
    new Cesium.Cartesian3()
  );
  //归一化
  const normal = Cesium.Cartesian3.normalize(vector2, new Cesium.Cartesian3());
  //normal.x=0.9

  //旋转矩阵 rotationMatrixFromPositionVelocity源码中有，并未出现在cesiumAPI中
  const rotationMatrix3 = Cesium.Transforms.rotationMatrixFromPositionVelocity(
    pointA,
    normal,
    Cesium.Ellipsoid.WGS84
  );

  const modelMatrix4 = Cesium.Matrix4.fromRotationTranslation(
    rotationMatrix3,
    pointA
  );
  return modelMatrix4;
}

function getHeadingPitchRoll(m) {
  var m1 = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Matrix4.getTranslation(m, new Cesium.Cartesian3()),
    Cesium.Ellipsoid.WGS84,
    new Cesium.Matrix4()
  );
  // 矩阵相除
  var m3 = Cesium.Matrix4.multiply(
    Cesium.Matrix4.inverse(m1, new Cesium.Matrix4()),
    m,
    new Cesium.Matrix4()
  );
  // 得到旋转矩阵
  var mat3 = Cesium.Matrix4.getMatrix3(m3, new Cesium.Matrix3());
  // 计算四元数
  var q = Cesium.Quaternion.fromRotationMatrix(mat3);
  // 计算旋转角(弧度)
  var hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);
  return hpr;
}

//点线面采集方法
const pipe = {
  addCylinder(linePoints, option) {
    //圆柱的中心点
    let centerPointX = (linePoints[0] + linePoints[3]) / 2;
    let centerPointY = (linePoints[1] + linePoints[4]) / 2;
    let centerPointH = (linePoints[2] + linePoints[5]) / 2;
    let centerPosition = Cesium.Cartesian3.fromDegrees(
      centerPointX,
      centerPointY,
      centerPointH
    );
    //圆柱的长度
    var startheightCartesian = Cesium.Cartesian3.fromDegrees(
      linePoints[0],
      linePoints[1],
      linePoints[2]
    );
    var endheightCartesian = Cesium.Cartesian3.fromDegrees(
      linePoints[3],
      linePoints[4],
      linePoints[5]
    );
    let distance = this.getDistance(startheightCartesian, endheightCartesian);
    /** */
    //获取倾斜角度
    var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerPosition);
    let pointA = Cesium.Cartesian3.fromDegrees(
      linePoints[0],
      linePoints[1],
      linePoints[2]
    );
    let pointB = Cesium.Cartesian3.fromDegrees(
      linePoints[3],
      linePoints[4],
      linePoints[5]
    );
    let m = getModelMatrix(pointA, pointB);
    let hpr = getHeadingPitchRoll(m);
    hpr.pitch = hpr.pitch + 3.14 / 2 + 3.14;
    var hprRotation = Cesium.Matrix3.fromHeadingPitchRoll(hpr);
    //console.log("hprRotation",hprRotation);
    var hprnew = Cesium.Matrix4.fromRotationTranslation(
      hprRotation,
      new Cesium.Cartesian3(0.0, 0.0, 0.0) // 不平移
    );
    // console.log("hprnew", hprnew);
    Cesium.Matrix4.multiply(modelMatrix, hprnew, modelMatrix);
    // console.log("modelMatrix", modelMatrix);
    // 创建圆柱/圆锥几何实例
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.CylinderGeometry({
        length: distance, // 圆柱体的长度
        topRadius: option.radius, // 顶部半径， 值为0即为圆柱
        bottomRadius: option.radius, // 底部半径
        slices: option.slices,
        //vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL  // 指定顶点格式，包括位置和法线
      }),
      //modelMatrix: Cesium.Matrix4.fromTranslation(centerPosition), // 圆柱体的位置
      modelMatrix: modelMatrix, // 圆柱体的位置
    });

    // 根据几何实例创建图元
    const primitive = new Cesium.Primitive({
      geometryInstances: instance, //可以是实例数组
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: Cesium.Material.fromType("Color", {
          color: new Cesium.Color.fromCssColorString(option.color).withAlpha(
            option.alpha
          ), // 圆柱体的颜色
        }),
      }),
    });

    // 将图元添加到集合
    this.viewer.scene.primitives.add(primitive);

    return primitive;
  },
  //获取距离
  getDistance(startPosition, endPosition) {
    var distance = Cesium.Cartesian3.distance(startPosition, endPosition);
    //console.log("两点（有高度差）之间的距离：" + distance + "米");
    return distance;
  },
};

//入口文件
class FFCesium {
  cesiumID;
  viewer;
  Cesium;
  constructor(id, option) {
    this.Cesium = Cesium;
    //合并其他文件JS文件方法
    let time1 = new Date().getTime();
    Object.assign(FFCesium.prototype, {
      //地图接入
      ...mapServer,
      ...dataServer,
      //地图操作
      ...mapTool,
      ...addPrimitive,
      ...mapAction,
      ...addOtherElement,
      //地图采集
      ...elementGather,
      //地图效果
      ...particleSystem,
      ...polygonEffect,
      ...polylineEffect,
      //空间分析
      ...judgeRelation,
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
      this.viewer = new Cesium.Viewer(id, option);
    }
    this.viewer._cesiumWidget._creditContainer.style.display = "none"; //去除版权信息
    let time3 = new Date().getTime();

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
        the.viewer.scene.globe.getHeight(cartographic);
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

export { FFCesium as default };
