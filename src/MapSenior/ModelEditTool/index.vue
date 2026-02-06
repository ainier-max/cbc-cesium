<template>
  <div id="cesiumContainer">
    <div class="tools" style="padding-left: 100px; pointer-events: none">
      <div style="padding-top: 20px">
        <el-input v-model="qxsyValue" style="width: 400px; pointer-events: auto" placeholder="倾斜模型地址" />
      </div>
      <div style="padding-top: 20px">
        <el-button type="primary" style="pointer-events: auto" @click="addQxsy()">叠加倾斜摄影并定位</el-button>
      </div>

      <div style="padding-top: 50px">
        <el-input v-model="modelValue" style="width: 600px; pointer-events: auto" placeholder="模型地址" />
      </div>
      <div style="padding-top: 20px">
        <el-button type="primary" @click="addModel()" style="pointer-events: auto">地图中心点叠加模型(需要支持跨域访问)</el-button>
      </div>

      <!-- <button class="bt_normal" @click="start()">开始编辑</button> -->
      <div style="padding-top: 20px">
        <el-button type="success" style="pointer-events: auto" @click="distance()">移动编辑</el-button>
      </div>
      <div style="padding-top: 20px">
        <el-button type="success" style="pointer-events: auto" @click="rotation()">旋转编辑</el-button>
      </div>
      <div style="padding-top: 20px">
        <el-button type="success" style="pointer-events: auto" @click="destroy()">关闭编辑</el-button>
      </div>
    </div>

    <div style="position: absolute; right: 20px; top: 100px; z-index: 9999; background-color: white; padding: 20px">
      <span style="color: red; font-size: 12px">注：旋转操作时，以垂直与圆圈的方向更加容易操作。</span>
      <el-form :model="form" label-width="auto" style="max-width: 600px; padding-top: 10px">
        <el-form-item label="坐标X">
          <el-input v-model="form.zbx" style="width: 200px" placeholder="Please input" />
        </el-form-item>
        <el-form-item label="坐标Y">
          <el-input v-model="form.zby" style="width: 200px" placeholder="Please input" />
        </el-form-item>
        <el-form-item label="坐标Z">
          <el-input v-model="form.zbz" style="width: 200px" placeholder="Please input" />
        </el-form-item>

        <el-form-item label="偏航角(heading)">
          <el-input v-model="form.heading" style="width: 200px" placeholder="Please input" />
        </el-form-item>

        <el-form-item label="俯仰角(pitch)">
          <el-input v-model="form.pitch" style="width: 200px" placeholder="Please input" />
        </el-form-item>

        <el-form-item label="翻滚角(roll)">
          <el-input v-model="form.roll" style="width: 200px" placeholder="Please input" />
        </el-form-item>
        <el-form-item label="操作">
          <div align="center">
            <el-button type="primary" @click="update('no')">更新</el-button>
            <el-button type="primary" @click="update('yes')">更新并定位</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, reactive } from "vue";

import * as Cesium from "cesium";
let viewer = undefined;

let editObj = undefined;
import EditGltf from "./js/EditGltf4Entity";

const form = reactive({
  zbx: 0,
  zby: 0,
  zbz: 0,
  heading: 0,
  pitch: 0,
  roll: 0
});

onMounted(() => {
  viewer = new Cesium.Viewer("cesiumContainer", {
    imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
    }),
    // terrainProvider: Cesium.createWorldTerrain(),
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
    baseLayer: false
  });
  //得加高德标准地图
  var imgProvider = new Cesium.UrlTemplateImageryProvider({ url: "https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}" });
  let mapLayer = viewer.imageryLayers.addImageryProvider(imgProvider);

  viewer._cesiumWidget._creditContainer.style.display = "none"; // 隐藏版权

  addTerrain("http://data.marsgis.cn/terrain");

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(119.09401880824325, 26.06913998003164, 1500),
    orientation: {
      // 指向
      heading: Cesium.Math.toRadians(0),
      // 视角
      pitch: Cesium.Math.toRadians(-60),
      roll: 0.0
    }
  });
});

/**
 * 异步添加地形服务。
 * @param {string} url - 地形数据的URL。
 * @returns {Promise} 返回一个Promise，解析为添加的地形提供者对象。
 */
const addTerrain = async (url) => {
  try {
    var terrainLayer = await Cesium.CesiumTerrainProvider.fromUrl(url, {});
    viewer.scene.terrainProvider = terrainLayer;
    return terrainLayer;
  } catch (error) {
    console.log(`Error loading tileset: ${error}`);
  }
};

const modelValue = ref("http://192.168.15.228:4000/model/DracoCompressed/CesiumMilkTruck.gltf");

const flyToCallback = () => {
  console.log("完成飞跃");
};

let gltf = null;
const addModel = async () => {
  if (gltf) {
    viewer.entities.remove(gltf);
  }

  const lnglatObj = getCenterLatLon();
  console.log("lnglatObj", lnglatObj);
  let heightTemp = await getHeightAtPoint([lnglatObj.lon, lnglatObj.lat], 15);
  console.log("heightTemp", heightTemp);
  heightTemp = heightTemp + 500;

  let option = {
    lng: lnglatObj.lon,
    lat: lnglatObj.lat,
    height: heightTemp,
    distance: 100,
    pitchRadiu: -60,
    time: 1
  };
  flyTo(option, flyToCallback);

  /*
  130.12461155821515,
    46.71925403799818,
    100
    */

  const position = Cesium.Cartesian3.fromDegrees(lnglatObj.lon, lnglatObj.lat, heightTemp);
  let heading = Cesium.Math.toRadians(90);
  //弧度的螺距分量。
  let pitch = Cesium.Math.toRadians(0);
  //滚动分量（以弧度为单位）
  let roll = Cesium.Math.toRadians(0);
  //HeadingPitchRoll旋转表示为航向，俯仰和滚动。围绕Z轴。节距是绕负y轴的旋转。滚动是关于正x轴。
  let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  gltf = viewer.entities.add({
    name: "Gltf模型Entity形式",
    position: position,
    orientation: orientation,
    model: {
      uri: "./model/DracoCompressed/CesiumMilkTruck.gltf",
      scale: 2
    }
  });

  let xyHeightArr = positionToLngLatHeight(gltf.position.getValue(Cesium.JulianDate.now()));
  form.zbx = xyHeightArr[0];
  form.zby = xyHeightArr[1];
  form.zbz = xyHeightArr[2];
  let headingPitchRollArr = getDegrees(gltf.position.getValue(Cesium.JulianDate.now()), gltf.orientation.getValue(Cesium.JulianDate.now()));
  form.heading = Math.round(headingPitchRollArr[0]);
  form.pitch = Math.round(headingPitchRollArr[1]);
  form.roll = Math.round(headingPitchRollArr[2]);
};

/**
 * 获取某个点的地形高度
 * 输入：[118,24]
 * 输出：100.0
 * @param {*} LngLat
 * @returns
 */
const getHeightAtPoint = async (LngLat, level) => {
  let cartographics = [Cesium.Cartographic.fromDegrees(LngLat[0], LngLat[1])];
  console.log("getHeightAtPoint--cartographics", cartographics);

  try {
    const updatedPositions = await Cesium.sampleTerrain(viewer.terrainProvider, level, cartographics, true);
    console.log("updatedPositions23232", updatedPositions);
    let height = updatedPositions[0].height;
    return height;
  } catch (error) {
    // A tile request error occurred.
  }
};

// 获取中心点的经纬度
const getCenterLatLon = () => {
  var center = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas.clientHeight / 2));
  if (Cesium.defined(center)) {
    var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(center);
    var latLon = {
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      lon: Cesium.Math.toDegrees(cartographic.longitude)
    };
    return latLon;
  }
  return undefined;
};

//const qxsyValue = ref("http://192.168.9.212/3dtiles/baoli3dtile/tileset.json");
const qxsyValue = ref("http://192.168.9.212/3dtiles/xysk/tileset.json");

let qxsyLayer = null;
const addQxsy = () => {
  let url = qxsyValue.value;
  let option = {
    maximumMemoryUsage: 100, //不可设置太高，目标机子空闲内存值以内，防止浏览器过于卡
    maximumScreenSpaceError: 20, //用于驱动细节细化级别的最大屏幕空间错误;较高的值可提供更好的性能，但视觉质量较低。
    maximumNumberOfLoadedTiles: 1000, //最大加载瓦片个数
    shadows: false, //是否显示阴影
    skipLevelOfDetail: true,
    baseScreenSpaceError: 1024,
    skipScreenSpaceErrorFactor: 16,
    skipLevels: 1,
    immediatelyLoadDesiredLevelOfDetail: false,
    loadSiblings: false,
    cullWithChildrenBounds: true,
    dynamicScreenSpaceError: true,
    dynamicScreenSpaceErrorDensity: 0.00278,
    dynamicScreenSpaceErrorFactor: 4.0,
    dynamicScreenSpaceErrorHeightFalloff: 0.25
  };
  let promise = addObliquePhotography(url, option);
  promise.then((result) => {
    qxsyLayer = result;
    viewer.flyTo(qxsyLayer);
  });
};

const addObliquePhotography = async (url, option) => {
  try {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(url, option);
    viewer.scene.primitives.add(tileset);
    return tileset;
  } catch (error) {
    console.log(`Error loading tileset: ${error}`);
  }
};

const update = (type) => {
  const position = Cesium.Cartesian3.fromDegrees(Number(form.zbx), Number(form.zby), Number(form.zbz));
  let heading = Cesium.Math.toRadians(form.heading);
  //弧度的螺距分量。
  let pitch = Cesium.Math.toRadians(form.pitch);
  //滚动分量（以弧度为单位）
  let roll = Cesium.Math.toRadians(form.roll);
  //HeadingPitchRoll旋转表示为航向，俯仰和滚动。围绕Z轴。节距是绕负y轴的旋转。滚动是关于正x轴。
  let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  gltf.position = position;
  gltf.orientation = orientation;

  if (type == "yes") {
    viewer.flyTo(gltf);
  }
};

const callback = (gltf, type) => {
  if (type == "Arrow") {
    let xyHeightArr = positionToLngLatHeight(gltf.position.getValue(Cesium.JulianDate.now()));
    form.zbx = xyHeightArr[0];
    form.zby = xyHeightArr[1];
    form.zbz = xyHeightArr[2];
  } else {
    let headingPitchRollArr = getDegrees(gltf.position.getValue(Cesium.JulianDate.now()), gltf.orientation.getValue(Cesium.JulianDate.now()));
    form.heading = headingPitchRollArr[0];
    form.pitch = headingPitchRollArr[1];
    form.roll = headingPitchRollArr[2];
  }
};
const edit = () => {
  if (!editObj) {
    let myOption = {};
    myOption.callback = callback;
    myOption.length = 20;
    editObj = new EditGltf(viewer, gltf, 1, 1, myOption);
  }
  editObj.editTranslation();
  editObj.editRtation();
};
const distance = () => {
  if (!editObj) {
    let myOption = {};
    myOption.callback = callback;
    myOption.length = 20;
    editObj = new EditGltf(viewer, gltf, 1, 1, myOption);
  }
  editObj && editObj.editTranslation();
};
const rotation = () => {
  if (!editObj) {
    editObj = new EditGltf(viewer, gltf, 1, 1);
  }
  editObj && editObj.editRtation();
};
const destroy = () => {
  editObj && editObj.destroy();
  editObj = null;
};

const getLocation = () => {
  let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  handler.setInputAction(function (event) {
    let earthPosition = viewer.scene.pickPosition(event.position);
    if (Cesium.defined(earthPosition)) {
      let cartographic = Cesium.Cartographic.fromCartesian(earthPosition);
      let lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5);
      let lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5);
      let height = cartographic.height.toFixed(2);
      console.log(earthPosition, {
        lon: lon,
        lat: lat,
        height: height
      });
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

const getDegrees = (position, orientation) => {
  // 四元数计算三维旋转矩阵
  let mtx3 = Cesium.Matrix3.fromQuaternion(orientation, new Cesium.Matrix3());
  // 四维转换矩阵
  let mtx4 = Cesium.Matrix4.fromRotationTranslation(mtx3, position, new Cesium.Matrix4());
  // 计算HeadingPitchRoll，结果为弧度
  let hpr = Cesium.Transforms.fixedFrameToHeadingPitchRoll(
    mtx4,
    Cesium.Ellipsoid.WGS84,
    Cesium.Transforms.eastNorthUpToFixedFrame,
    new Cesium.HeadingPitchRoll()
  );
  // 转成角度
  let heading = Cesium.Math.toDegrees(hpr.heading);
  let pitch = Cesium.Math.toDegrees(hpr.pitch);
  let roll = Cesium.Math.toDegrees(hpr.roll);

  return [heading, pitch, roll];
};
/**
 * 世界坐标转换经纬度坐标
 * 输入：Cartesian3
 * 输出：[118.11,24.11,0]
 * @param {*} position
 * @returns
 */
const positionToLngLatHeight = (position) => {
  let ellipsoid = viewer.scene.globe.ellipsoid;
  let cartographic = ellipsoid.cartesianToCartographic(position);
  let lat = Cesium.Math.toDegrees(cartographic.latitude);
  let lng = Cesium.Math.toDegrees(cartographic.longitude);
  let height = cartographic.height;
  return [lng, lat, height];
};

const flyTo = (option, callback) => {
  let position = Cesium.Cartesian3.fromDegrees(option.lng, option.lat, option.height);
  let flyToEntity = new Cesium.Entity({
    position: position,
    point: {
      pixelSize: 0
    }
  });
  viewer.entities.add(flyToEntity);
  const flyPromise = viewer.flyTo(flyToEntity, {
    duration: option.time || 0.75,
    offset: {
      heading: viewer.camera.heading,
      pitch: Cesium.Math.toRadians(option.pitchRadiu),
      range: option.distance
    }
  });
  flyPromise.then(function () {
    viewer.entities.remove(flyToEntity);
    flyToEntity = null;
    if (callback) {
      callback();
    }
  });
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  position: relative;

  .tools {
    position: absolute;
    margin: 10px;
    padding: 10px;
    z-index: 10;
  }
}
</style>
