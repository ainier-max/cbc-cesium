import * as Cesium from "cesium";
import * as mainCanalPolygonData from "../data/mainCanalPolygon.json";
import water from "../images/water.jpg";

class MapClass {
  viewer = null;
  qxsyUrl = "http://113.0.120.80:8003/YTQSQXSY2/tileset.json";
  terrainUrl = "http://113.0.120.80:8003/terrain";
  //mapUrl = "http://113.0.120.80:8003/YTBingmap/{z}/{x}/{y}.jpg";
  mapUrl = "http://t0.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=e7a6694e4622933c3a2bd66ba10233aa";

  initMap(containerId = "cesiumViewer") {
    const viewerOption = {
      animation: false,
      baseLayerPicker: false,
      baseLayer: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      scene3DOnly: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      shadows: true,
      shouldAnimate: true
    };

    this.viewer = new Cesium.Viewer(containerId, viewerOption);
    this.viewer._cesiumWidget._creditContainer.style.display = "none";

    const imgProvider = new Cesium.UrlTemplateImageryProvider({
      url: this.mapUrl
    });
    this.viewer.imageryLayers.addImageryProvider(imgProvider);

    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(129.7206812557529, 46.67837720220225, 1000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-50),
        roll: 0.0
      }
    });

    this.addPhotography();
    this.addTerrain(this.terrainUrl);
    this.addCanalWaterPolygon();
    return this.viewer;
  }

  addCanalWaterPolygon() {
    if (!this.viewer) return null;
    const lnglatArr = mainCanalPolygonData.features[0].geometry.coordinates[0][0];
    return this.drawWater(lnglatArr, {
      frequency: 10000,
      animationSpeed: 0.005,
      amplitude: 100.0
    });
  }

  drawWater(lnglatArr, option) {
    if (!this.viewer) return null;
    return this.viewer.scene.primitives.add(
      new Cesium.GroundPrimitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(lnglatArr.flat())),
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
          })
        }),
        appearance: new Cesium.EllipsoidSurfaceAppearance({
          aboveGround: true,
          material: new Cesium.Material({
            fabric: {
              type: "Water",
              uniforms: {
                baseWaterColor: new Cesium.Color(103 / 255, 94 / 255, 79 / 255, 0.4),
                normalMap: water,
                frequency: option.frequency,
                animationSpeed: option.animationSpeed,
                amplitude: option.amplitude
              }
            }
          })
        }),
        show: true
      })
    );
  }

  async addTerrain(url) {
    if (!this.viewer) return null;
    try {
      const terrainLayer = await Cesium.CesiumTerrainProvider.fromUrl(url, {});
      this.viewer.scene.terrainProvider = terrainLayer;
      return terrainLayer;
    } catch (error) {
      console.log(`Error loading terrain: ${error}`);
      return null;
    }
  }

  addPhotography() {
    const option = {
      maximumMemoryUsage: 1024,
      maximumScreenSpaceError: 20,
      maximumNumberOfLoadedTiles: 2000,
      shadows: false,
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
    return this.addObliquePhotography(this.qxsyUrl, option);
  }

  async addObliquePhotography(url, option) {
    if (!this.viewer) return null;
    try {
      const tileset = await Cesium.Cesium3DTileset.fromUrl(url, option);
      this.viewer.scene.primitives.add(tileset);
      return tileset;
    } catch (error) {
      console.log(`Error loading tileset: ${error}`);
      return null;
    }
  }
}

export default MapClass;
