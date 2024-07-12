//地图服务配置
export const mapServerMenuConfigs = [
  {
    title: "天地图",
    key: "addTdt",
    url: "./FFCesiumExample/MapAccess/mapServer/addTdt.vue",
    img: "./images/menu/addGeode.png",
  },
  {
    title: "arcgis地图",
    key: "addArcgisImgLayer",
    url: "./FFCesiumExample/MapAccess/mapServer/addArcgisImgLayer.vue",
    img: "./images/menu/addGeode.png",
  },
  {
    title: "自定义瓦片加载",
    key: "addCustomLayer",
    url: "./FFCesiumExample/MapAccess/mapServer/addCustomLayer.vue",
    img: "./images/menu/addGeode.png",
  },
];

//数据服务配置
export const dataServerMenuConfigs = [
  {
    title: "倾斜摄影",
    key: "addObliquePhotography",
    url: "./FFCesiumExample/MapAccess/dataServer/addObliquePhotography.vue",
    img: "./images/menu/addGeode.png",
  },
  {
    title: "自定义地形",
    key: "addTerrain",
    url: "./FFCesiumExample/MapAccess/dataServer/addTerrain.vue",
    img: "./images/menu/addGeode.png",
  },
  {
    title: "GeoJson数据加载",
    key: "addGeojson",
    url: "./FFCesiumExample/MapAccess/dataServer/addGeojson.vue",
    img: "./images/menu/addGeode.png",
  },
  {
    title: "KML数据加载",
    key: "addKml",
    url: "./FFCesiumExample/MapAccess/dataServer/addKml.vue",
    img: "./images/menu/addGeode.png",
  },
  {
    title: "WMS服务加载",
    key: "addWmslayer",
    url: "./FFCesiumExample/MapAccess/dataServer/addWmslayer.vue",
    img: "./images/menu/addGeode.png",
  },
  {
    title: "WMS服务查询",
    key: "findWmslayer",
    url: "./FFCesiumExample/MapAccess/dataServer/findWmslayer.vue",
    img: "./images/menu/addGeode.png",
  },
];
