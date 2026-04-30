<template>
  <div id="dynamicDivViewer">
    <div class="tool-panel">
      <button type="button" @click="flyToView">定位示例</button>
    </div>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, onMounted } from "vue";
  import * as Cesium from "cesium";
  import DynamicDivClass from "./DynamicDivClass.js";

  let viewer = null;
  let dynamicDiv = null;

  const basePoints = [
    { id: "C1_PTJ", name: "C1_PTJ", lon: 110.24700026, lat: 26.93742774, height: 20, flow: "48.00", level: "182.00" },
    { id: "C2_SKX", name: "C2_SKX", lon: 110.24761189, lat: 26.93780086, height: 20, flow: "51.00", level: "182.25" },
    { id: "C3_GXH1", name: "C3_GXH1", lon: 110.2318535, lat: 26.94726843, height: 20, flow: "54.00", level: "182.50" },
    { id: "C4_TTSH", name: "C4_TTSH", lon: 110.22184099, lat: 26.98577487, height: 20, flow: "57.00", level: "182.75" },
    { id: "C5_GXH2", name: "C5_GXH2", lon: 110.22969652, lat: 26.99269842, height: 20, flow: "60.00", level: "183.00" },
    { id: "C6_GXH3", name: "C6_GXH3", lon: 110.21932718, lat: 26.99553204, height: 20, flow: "63.00", level: "183.25" }
  ];

  onMounted(() => {
    initMap();
    dynamicDiv = new DynamicDivClass(viewer);
    dynamicDiv.update(basePoints);
  });

  onBeforeUnmount(() => {
    if (dynamicDiv) {
      dynamicDiv.destroy();
      dynamicDiv = null;
    }
    if (viewer && !viewer.isDestroyed()) {
      viewer.destroy();
      viewer = null;
    }
  });

  const initMap = () => {
    viewer = new Cesium.Viewer("dynamicDivViewer", {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      shouldAnimate: true,
      baseLayer: false
    });

    const imgProvider = new Cesium.UrlTemplateImageryProvider({
      url: "https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
    });
    viewer.imageryLayers.addImageryProvider(imgProvider);
    viewer._cesiumWidget._creditContainer.style.display = "none";

    viewer.scene.globe.depthTestAgainstTerrain = false;
    flyToView();
  };

  const flyToView = () => {
    if (!viewer) return;

    const longitudes = basePoints.map((point) => point.lon);
    const latitudes = basePoints.map((point) => point.lat);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const paddingLon = Math.max((maxLon - minLon) * 0.12, 0.002);
    const paddingLat = Math.max((maxLat - minLat) * 0.12, 0.002);

    viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(
        minLon - paddingLon,
        minLat - paddingLat,
        maxLon + paddingLon,
        maxLat + paddingLat
      ),
      duration: 1
    });
  };
</script>

<style>
  .cesium-viewer-toolbar {
    display: none;
  }
</style>

<style scoped>
  #dynamicDivViewer {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .tool-panel {
    position: absolute;
    left: 24px;
    top: 24px;
    z-index: 999;
    display: flex;
    gap: 10px;
    pointer-events: auto;
  }

  .tool-panel button {
    height: 32px;
    padding: 0 14px;
    border: 1px solid #2f7cc0;
    border-radius: 4px;
    color: #163653;
    background: rgba(255, 255, 255, 0.92);
    cursor: pointer;
  }
</style>
