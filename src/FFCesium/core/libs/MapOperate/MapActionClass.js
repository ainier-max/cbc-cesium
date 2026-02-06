import MapActionLogic from "./LogicClass/MapActionLogic.js";
import * as Cesium from "cesium";

export default class MapActionClass {
    getCameraEventInfo = "获取相机信息事件方法(getCameraEvent)";
    getCameraLocationInfo = "获取相机位置信息方法(getCameraLocation)";
    flyToInfo = "飞行定位方法(flyTo)";
    flyToByBoundingSphereInfo = "根据包围球飞行方法(flyToByBoundingSphere)";
    setViewInfo = "设置视角方法(setView)";
    resetViewInfo = "重置视角方法(resetView)";
    constructor(ffCesium) {
        this.ffCesium = ffCesium;
        this.viewer = ffCesium.viewer;
        this.mapActionLogic = new MapActionLogic();
    }

    getCameraEvent() {
        let viewer = this.viewer;
        let option = {};
        window.setInterval(() => {
            // 获取相机位置
            var cameraPosition = viewer.camera.position;
            var ellipsoid = viewer.scene.globe.ellipsoid;
            var cartesian3 = new Cesium.Cartesian3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
            var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
            var lat = Cesium.Math.toDegrees(cartographic.latitude);
            var lng = Cesium.Math.toDegrees(cartographic.longitude);
            var height = cartographic.height;
            option.lng = lng;
            option.lat = lat;
            option.height = height;
            //获取倾斜角度
            var pitch = Cesium.Math.toDegrees(viewer.camera.pitch);
            var heading = Cesium.Math.toDegrees(viewer.camera.heading);
            var roll = Cesium.Math.toDegrees(viewer.camera.roll);
            var heightInMeters = viewer.camera.positionCartographic.height;
            option.lng = lng;
            option.lat = lat;
            option.height = heightInMeters;
            option.pitch = pitch;
            option.heading = heading;
            option.roll = roll;
            console.log("getCameraEvent--当前相机位置信息--option", option);
        }, 2000);
    }

    getCameraLocation() {
        let viewer = this.viewer;
        let option = {};
        // 获取相机位置
        var cameraPosition = viewer.camera.position;
        var ellipsoid = viewer.scene.globe.ellipsoid;
        var cartesian3 = new Cesium.Cartesian3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var height = cartographic.height;
        option.lng = lng;
        option.lat = lat;
        option.height = height;
        //获取倾斜角度
        var pitch = Cesium.Math.toDegrees(viewer.camera.pitch);
        var heading = Cesium.Math.toDegrees(viewer.camera.heading);
        var roll = Cesium.Math.toDegrees(viewer.camera.roll);
        var heightInMeters = viewer.camera.positionCartographic.height;
        option.lng = lng;
        option.lat = lat;
        option.height = heightInMeters;
        option.pitch = pitch;
        option.heading = heading;
        option.roll = roll;
        console.log("getCameraEvent--当前相机位置信息--option", option);
        return option;
    }

    flyTo(option, callback) {
        let the = this;
        let position = Cesium.Cartesian3.fromDegrees(option.lng, option.lat, option.height);
        let flyToEntity = new Cesium.Entity({
            position: position,
            point: {
                pixelSize: 0
            }
        });
        the.viewer.entities.add(flyToEntity);
        const flyPromise = the.viewer.flyTo(flyToEntity, {
            duration: option.time || 0.75,
            offset: {
                heading: the.viewer.camera.heading,
                pitch: Cesium.Math.toRadians(option.pitchRadiu),
                range: option.eyeHeight
            }
        });
        flyPromise.then(function () {
            the.viewer.entities.remove(flyToEntity);
            flyToEntity = null;
            if (callback) {
                callback();
            }
        });
    }

    flyToByBoundingSphere(lnglatArr, option) {
        let boundingSphere = Cesium.BoundingSphere.fromPoints(this.ffCesium.mapUtilClass.lngLatHeightArrToCartesian3Arr(lnglatArr));
        this.viewer.camera.flyToBoundingSphere(boundingSphere, option);
    }

    setView(option) {
        let options = this.mapActionLogic.getSetViewOptions(option);
        this.viewer.camera.setView(options);
    }

    resetView(lngLatHeight, option, callback) {
        let viewer = this.viewer;
        let position = Cesium.Cartesian3.fromDegrees(lngLatHeight[0], lngLatHeight[1], lngLatHeight[2]);
        var distanceTemp = Cesium.Cartesian3.distance(viewer.scene.camera.position, position);
        let flyToEntity = new Cesium.Entity({
            position: position,
            point: {
                pixelSize: 0
            }
        });
        viewer.entities.add(flyToEntity);
        const flyPromise = viewer.flyTo(flyToEntity, {
            duration: option.time,
            offset: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: viewer.scene.camera.pitch,
                range: distanceTemp
            }
        });
        flyPromise.then(function () {
            callback && callback(option);
            viewer.entities.remove(flyToEntity);
            flyToEntity = null;
        });
    }
}
