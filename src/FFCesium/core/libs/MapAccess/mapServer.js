import * as Cesium from "cesium";
//点线面采集方法
export const mapServer = {
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

  //删除地图图层
  removeMapLayer(mapLayer) {
    this.viewer.imageryLayers.remove(mapLayer, true);
  },
  hideMapLayer() {},
};
