<template>
  <div id="cesiumContainer">
    <div style="position: absolute; left: 50px; top: 50px; z-index: 999">
      <button @click="panModel">模型平移</button>
      <button @click="rotateModel" style="margin-left: 50px">模型旋转</button>
    </div>
    <div style="position: absolute; left: 50px; top: 100px; z-index: 999">
      <button @click="getModelLoaction">获取模型位置</button>
    </div>

    <div style="position: absolute; left: 50px; top: 150px; z-index: 999">
      <el-input v-model="areaJsonRef" type="textarea" style="width: 600px" /><br />
      <input type="button" value="读取坐标并上图" @click="readXy" />
      <input style="margin-left: 10px" type="button" value="面编辑,右击编辑结束后自动裁切" @click="polygonEditFun" /><br />
      <input style="margin-top: 10px" type="button" value="面采集,右击采集结束后自动裁切" @click="polygonGatherFun" /><br />

      <input style="margin-top: 10px" type="button" value="取消裁切" @click="cancelCut" />
    </div>
  </div>
</template>
<script setup>
  import { ref, onMounted, reactive } from "vue";
  import MapClass from "./js/MapClass.js";
  import EditB3DM from "./js/EditB3DM.js";
  import PolygonCLass from "./tool/polygonTool/PolygonCLass.js";
  import { createGatherPoint, createHalfGatherPoint, cartesian3ArrToLngLatHeightArr } from "./tool/polygonTool/common.js";
  import * as Cesium from "cesium";
  import { modelDataArr } from "./data/modelData.js";
  import CoordTransform from "./js/CoordTransform";

  let viewer = null;
  let mapClass = null;
  let editObj = null;
  let editModelLayer = null;
  let polygonCLass = null;
  const areaJsonRef = ref("");
  let editPolygonEntity = null;

  onMounted(() => {
    mapClass = new MapClass();
    console.log("Cesium版本", Cesium.VERSION);
    let modelParam=modelDataArr[0];//渠首模型
    //let modelParam=modelDataArr[1];//引汤进水闸模型
    //let modelParam=modelDataArr[2];//伏胜节制闸模型
    //let modelParam=modelDataArr[3];//格节河节制闸模型
    //let modelParam = modelDataArr[4]; //红旗沟节制闸
    //let modelParam = modelDataArr[5]; //香兰河节制闸
    //let modelParam = modelDataArr[6]; //阿凌达河节制闸
    //let modelParam = modelDataArr[7]; //北干渠莲农闸
    //let modelParam = modelDataArr[8]; //红丰抽水站
    //let modelParam = modelDataArr[9]; //解放泵站
    //let modelParam = modelDataArr[10]; //景阳交叉节制闸
    //let modelParam = modelDataArr[11]; //合作节制闸
    //let modelParam = modelDataArr[12];//双阳泵站
    //let modelParam = modelDataArr[13];//乌龙河交叉节制闸
    console.log("当前模型--modelParam", modelParam);

    viewer = mapClass.initMap("cesiumContainer");
    polygonCLass = new PolygonCLass(viewer, "cesiumContainer");

    //实时获取地图中心点信息
    mapClass.getCameraEvent();

    areaJsonRef.value = JSON.stringify(modelParam.clippingLnglatArr);
    let promiseTemp = mapClass.addModelLayer(modelParam);
    console.log("promiseTemp", promiseTemp);
    promiseTemp
      .then((result) => {
        console.log("promiseTemp--成功:", result);
        editModelLayer = result;

        /** 
        console.log("onMounted--editModelLayer.boundingSphere.center",editModelLayer.boundingSphere.center)

        const originDegree = CoordTransform.transformCartesianToWGS84(viewer, editModelLayer.boundingSphere.center);
        console.log("onMounted--originDegree", originDegree);

        let positionTemp=Cesium.Cartesian3.fromDegrees(130.20092536130795, 46.97871562757069, 104.977274214235)
        positionTemp.z=editModelLayer.boundingSphere.center.z

        // 创建新的边界球（扩大半径）
        const newBoundingSphere = new Cesium.BoundingSphere(
            positionTemp,
            editModelLayer.boundingSphere.radius// 扩大50%
        );
      
        // 应用新的边界球
        //editModelLayer.boundingSphere = newBoundingSphere;
        */

        editObj = new EditB3DM(viewer, editModelLayer, 1, 1);
        //裁切倾斜摄影
        if (modelParam.clippingLnglatArr && modelParam.clippingLnglatArr.length > 0) {
          mapClass.clippingPolygons(modelParam.clippingLnglatArr);
        }

        viewer.zoomTo(editModelLayer);
        //定位
        //mapClass.flyTo(modelParam.flyLocation);

        //叠加点
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(modelParam.flyLocation.x, modelParam.flyLocation.y, modelParam.flyLocation.z),
          point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });
      })
      .catch((error) => {
        console.error("promiseTemp--失败:", error);
      });
  });

  const cancelCut = () => {
    mapClass.cancelCut();
  };

  const readXy = () => {
    console.log("readXy--areaJsonRef.value", areaJsonRef.value);
    let FFCoordinates = JSON.parse(areaJsonRef.value);
    let positionTemp = Cesium.Cartesian3.fromDegreesArray(FFCoordinates.flat());
    //叠加面
    editPolygonEntity = viewer.entities.add({
      polygon: {
        hierarchy: positionTemp,
        material: new Cesium.Color.fromCssColorString("#FBFF65").withAlpha(0.5)
      }
    });
    editPolygonEntity.FFPosition = positionTemp;
  };
  const polygonEditFun = () => {
    if (editPolygonEntity) {
      polygonCLass.polygonEdit(editPolygonEntity, polygonEditFunCallback);
    }
  };

  const polygonEditFunCallback = (polygon) => {
    console.log("坐标采集成功,其对象为：", polygon);
    console.log("坐标采集成功,其坐标为：", polygon.FFCoordinates);
    areaJsonRef.value = JSON.stringify(polygon.FFCoordinates);
    mapClass.clippingPolygons(polygon.FFCoordinates);
  };

  const polygonGatherFun = () => {
    polygonCLass.polygonGather(polygonGatherFunCallback, {
      color: "#FBFF65",
      alpha: 0.5
    });
  };
  const polygonGatherFunCallback = (gatherPolygon) => {
    console.log("坐标采集成功,其对象为：", gatherPolygon);
    let FFCoordinates = cartesian3ArrToLngLatHeightArr(gatherPolygon.polygon.hierarchy.getValue().positions, viewer);
    console.log("坐标采集成功,其坐标为：", FFCoordinates);
    areaJsonRef.value = JSON.stringify(FFCoordinates);
    mapClass.clippingPolygons(FFCoordinates);
  };

  const panModel = () => {
    //平移
    editObj.editTranslation();
  };
  const rotateModel = () => {
    //旋转
    editObj.editRtation();
  };
  const getModelLoaction = () => {
    //取消编辑
    //editObj.destroy();
    let paramsTemp = editObj.getParams();
    console.log("模型位置:", paramsTemp);
  };
</script>
<style scoped>
  #cesiumContainer {
    width: 100%;
    height: 100%;
    position: relative;
  }
</style>
