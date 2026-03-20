<template>
  <div id="cesiumViewer">
    <div class="tool-panel">
      <button type="button" @click="startRoam">开始漫游</button>
      <button type="button" @click="pauseRoam">暂停漫游</button>
      <button type="button" @click="continueRoam">继续漫游</button>
      <button type="button" @click="stopRoam">停止漫游</button>
    </div>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, onMounted } from "vue";
  import * as Cesium from "cesium";
  import * as turf from "@turf/turf";
  import MapClass from "./js/MapClass.js";
  import FlyRoamClass from "./js/FlyRoamClass.js";
  import canalJson from "./data/canal4.json";
  import * as mainCanalPolygonData from "./data/mainCanalPolygon.json";

  let viewer = null;
  let mapClass = null;
  let flyRoamClass = null;
  let polygonEntity = null;
  let clickHandler = null;
  let labelInterval = null;
  const labelEntities = [];
  const mainCanalPolygon = mainCanalPolygonData.features[0];

  onMounted(() => {
    mapClass = new MapClass();
    viewer = mapClass.initMap("cesiumViewer");
    flyRoamClass = new FlyRoamClass(viewer);
    bindMapClick();
  });

  onBeforeUnmount(() => {
    stopRoam();
    if (clickHandler) {
      clickHandler.destroy();
      clickHandler = null;
    }
    if (flyRoamClass) {
      flyRoamClass = null;
    }
    if (viewer && !viewer.isDestroyed()) {
      viewer.destroy();
      viewer = null;
    }
  });

  const bindMapClick = () => {
    if (!viewer) return;
    clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    clickHandler.setInputAction((event) => {
      const ray = viewer.camera.getPickRay(event.position);
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!Cesium.defined(cartesian)) return;
      const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);
      console.log("Picked coordinate:", longitude, latitude);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  const clearLabelInterval = () => {
    if (labelInterval !== null) {
      window.clearInterval(labelInterval);
      labelInterval = null;
    }
  };

  const clearLabelEntities = () => {
    if (!viewer) {
      labelEntities.length = 0;
      return;
    }
    while (labelEntities.length) {
      const entity = labelEntities.pop();
      viewer.entities.remove(entity);
    }
  };

  const pauseRoam = () => {
    if (flyRoamClass) flyRoamClass.pauseFly();
  };

  const continueRoam = () => {
    if (flyRoamClass) flyRoamClass.continueFly();
  };

  const stopRoam = () => {
    clearLabelInterval();
    clearLabelEntities();
    if (polygonEntity && viewer) {
      viewer.entities.remove(polygonEntity);
      polygonEntity = null;
    }
    if (flyRoamClass) {
      flyRoamClass.stopFly();
    }
  };

  const startRoam = () => {
    if (!viewer || !flyRoamClass) return;

    stopRoam();

    const flyItem = canalJson.features[1];
    const lnglatArr = flyItem.geometry.coordinates;
    const option = {
      showPoint: true,
      speed: 1,
      lineChunkDis: 0.5,
      pitch: -25,
      rangeHeight: 800,
      endFlyRoamCallBack,
      continuousTime: 120,
      continuousFun
    };

    flyRoamClass.startFly(lnglatArr, option);
    labelInterval = window.setInterval(addLabel, 2000);
  };

  const addLabel = () => {
    if (!viewer || !flyRoamClass || !flyRoamClass.FlyRoamPoint) return;
    const position = flyRoamClass.FlyRoamPoint.position.getValue(viewer.clock.currentTime);
    if (!position) return;

    const text = `${(1.8 + Math.random() * 0.5).toFixed(2)} m`;
    const entity = viewer.entities.add({
      position,
      label: {
        text,
        font: "14px sans-serif",
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -22),
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      }
    });
    labelEntities.push(entity);
    flyRoamClass.FlyRoamPoint.label.text = text;
  };

  const endFlyRoamCallBack = () => {
    clearLabelInterval();
    console.log("Roam finished");
  };

  const continuousFun = () => {
    if (!viewer || !flyRoamClass || !flyRoamClass.FlyRoamPoint) return;
    const position = flyRoamClass.FlyRoamPoint.position.getValue(viewer.clock.currentTime);
    if (!position) return;

    const angle = flyRoamClass.currentBearing;
    if (typeof angle !== "number") return;

    const otherPosition1 = calculateEndPosition(position, angle - 90, 50);
    const otherPosition2 = calculateEndPosition(position, angle + 90, 50);
    const lnglatArr = cartesian3ArrToLngLatHeightArr([otherPosition1, otherPosition2]);
    const cuttingLine = turf.lineString(lnglatArr);
    const lineBuffer = turf.buffer(cuttingLine, 0.001);
    const result = turf.difference(mainCanalPolygon, lineBuffer);
    const polygonLngLat = extractPolygonLngLat(result);
    if (polygonLngLat) addPolygon(polygonLngLat);
  };

  const extractPolygonLngLat = (feature) => {
    if (!feature || !feature.geometry) return null;
    const { type, coordinates } = feature.geometry;
    if (type === "Polygon") return coordinates[0] || null;
    if (type === "MultiPolygon") return coordinates[0]?.[0] || null;
    return null;
  };

  const addPolygon = (lnglatArr) => {
    if (!viewer) return;
    const hierarchy = Cesium.Cartesian3.fromDegreesArray(lnglatArr.flat());
    if (!polygonEntity) {
      polygonEntity = viewer.entities.add({
        polygon: {
          hierarchy,
          material: Cesium.Color.fromCssColorString("#83CEFF").withAlpha(0.5)
        }
      });
      polygonEntity.lnglatArr = lnglatArr;
      return;
    }

    polygonEntity.polygon.hierarchy = hierarchy;
    polygonEntity.lnglatArr = lnglatArr;
  };

  const cartesian3ArrToLngLatHeightArr = (cartesian3Arr) => {
    if (!viewer) return [];
    const lngLatHeightArr = [];
    const ellipsoid = viewer.scene.globe.ellipsoid;
    for (let i = 0; i < cartesian3Arr.length; i++) {
      const cartographic = ellipsoid.cartesianToCartographic(cartesian3Arr[i]);
      lngLatHeightArr.push([
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude),
        cartographic.height
      ]);
    }
    return lngLatHeightArr;
  };

  const calculateEndPosition = (startPosition, angle, length) => {
    const cartographic = Cesium.Cartographic.fromCartesian(startPosition);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const destination = turf.destination([longitude, latitude], length, angle, { units: "meters" });
    const [endLongitude, endLatitude] = destination.geometry.coordinates;
    return Cesium.Cartesian3.fromDegrees(endLongitude, endLatitude, cartographic.height);
  };
</script>

<style>
  .cesium-viewer-toolbar {
    display: none;
  }
</style>

<style scoped>
  #cesiumViewer {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .tool-panel {
    position: absolute;
    top: 50px;
    left: 50px;
    z-index: 999;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tool-panel button {
    width: 96px;
    height: 32px;
    border: 1px solid #2f7cc0;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.92);
    cursor: pointer;
  }
</style>
