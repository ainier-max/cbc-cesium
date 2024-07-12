import * as Cesium from "cesium";
//点线面采集方法
export const dataServer = {
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
  /**
   * 添加WMS图层
   * 通过此函数可以向Cesium的视图中添加Web Map Service (WMS) 图层。
   * WMS是一种标准的OGC协议，用于从服务器获取地图图像。
   *
   * @param {Object} option - WMS服务的配置选项
   * @returns {ImageryLayer} 返回添加的WMS图层对象，此对象可以在进一步的操作中被引用。
   */
  findWmsLayer(option) {
    let webMapTemp = new Cesium.WebMapServiceImageryProvider(option);
    let wmsLayer = this.viewer.imageryLayers.addImageryProvider(webMapTemp);
    return wmsLayer;
  },
};
