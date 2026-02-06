import DataServerLogic from "./LogicClass/DataServerLogic.js";
import * as Cesium from "cesium"; // Import Cesium just in case, though usually logic handles it, but maybe needed for types or checks? Ideally not needed if Logic handles it.
// Actually mapServer.js and dataServer.js imported Cesium.
// Here Logic imports Cesium. Class accesses logic.

class DataServerClass {
    addObliquePhotographyInfo = "添加倾斜摄影服务方法(addObliquePhotography)";
    removeObliquePhotographyInfo = "移除倾斜摄影方法(removeObliquePhotography)";
    addTerrainInfo = "添加地形服务方法(addTerrain)";
    removeTerrainInfo = "移除地形方法(removeTerrain)";
    readGeojsonInfo = "解析GeoJSON数据方法(readGeojson)";
    addGeojsonInfo = "添加GeoJSON数据方法(addGeojson)";
    readKmlInfo = "解析KML数据方法(readKml)";
    addKmlInfo = "添加KML数据方法(addKml)";
    removeDataSourceInfo = "移除数据源方法(removeDataSource)";
    addWmslayerInfo = "叠加WMS图层服务方法(addWmslayer)";
    findWmsLayerInfo = "添加WMS图层方法(findWmsLayer)";
    constructor(viewer) {
        this.viewer = viewer;
        this.dataServerLogic = new DataServerLogic();
    }

    // 添加倾斜摄影服务
    async addObliquePhotography(url, option) {
        try {
            const tileset = await this.dataServerLogic.createObliquePhotography(url, option);
            this.viewer.scene.primitives.add(tileset);
            return tileset;
        } catch (error) {
            console.log(`Error loading tileset: ${error}`);
        }
    }

    // 移除倾斜摄影
    removeObliquePhotography(tileset) {
        this.viewer.scene.primitives.remove(tileset);
    }

    // 添加地形服务
    async addTerrain(url) {
        try {
            var terrainLayer = await this.dataServerLogic.createTerrainProvider(url);
            this.viewer.scene.terrainProvider = terrainLayer;
            return terrainLayer;
        } catch (error) {
            console.log(`Error loading tileset: ${error}`);
        }
    }

    // 移除地形（恢复椭球体）
    removeTerrain() {
        this.viewer.scene.terrainProvider = this.dataServerLogic.createEllipsoidTerrainProvider();
    }

    // 解析geojson数据
    readGeojson(geojson) {
        return this.dataServerLogic.readGeojson(geojson);
    }

    // 添加geojson
    addGeojson(dataSource, option) {
        this.viewer.dataSources.add(dataSource);
        this.dataServerLogic.styleGeoJson(dataSource, option);
        return dataSource;
    }

    // 解析kml数据
    readKml(kml) {
        return this.dataServerLogic.readKml(kml, this.viewer);
    }

    addKml(dataSource) {
        this.viewer.dataSources.add(dataSource);
        return dataSource;
    }

    // 移除某个dataSource
    removeDataSource(dataSource) {
        this.viewer.dataSources.remove(dataSource);
    }

    // 叠加wms图层服务
    addWmslayer(url, layerName) {
        let wmsLayer = this.dataServerLogic.createWmsProvider(url, layerName);
        return this.viewer.imageryLayers.addImageryProvider(wmsLayer);
    }

    /**
     * 添加WMS图层
     * @param {Object} option - WMS服务的配置选项
     * @returns {ImageryLayer}
     */
    findWmsLayer(option) {
        let webMapTemp = this.dataServerLogic.createWmsProviderFromOption(option);
        return this.viewer.imageryLayers.addImageryProvider(webMapTemp);
    }
}

export default DataServerClass;
