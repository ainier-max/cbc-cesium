import * as Cesium from "cesium";

export const mapAction = {
  /**
   * 不断获取当前相机的经纬度、高度和偏航角。
   *
   * @returns {Object} 包含经度、纬度、高度和偏航角的对象。
   */
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
  },
  


  /**
   * 飞向指定坐标并应用特定的视角效果。
   *
   * 此函数首先将给定的经纬度转换为地形高度相关的Cartesian3坐标。
   * 然后，它创建一个实体以表示这个位置，并配置飞行选项，包括飞行持续时间、视角偏移等。
   * 最后，它执行一个飞向这个新位置的动画，并在飞行结束后删除这个临时实体，如果提供了回调函数，则调用它。
   *
   * @param {object} option 飞向目标的选项，包括经纬度、飞行时间、视角倾斜度、视角高度等。
   * @param {function} callback 飞行结束后调用的回调函数。
   */
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
        range: option.distance
      }
    });
    flyPromise.then(function () {
      the.viewer.entities.remove(flyToEntity);
      flyToEntity = null;
      if (callback) {
        callback();
      }
    });
  },
  /**
   * 根据坐标串进行定位
   * @param {*} lnglatArr 
   */
  flyToByBoundingSphere(lnglatArr,option){
    let boundingSphere = Cesium.BoundingSphere.fromPoints(this.lngLatHeightArrToCartesian3Arr(lnglatArr))
    //console.log("boundingSphere",boundingSphere);
    // 使用 flyToBoundingSphere 定位到包围球
    this.viewer.camera.flyToBoundingSphere(boundingSphere, option)
  },

  //定位
  setView(option) {
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(option.lng, option.lat, option.height),
      orientation: {
        // 指向
        heading: Cesium.Math.toRadians(0, 0),
        // 视角
        pitch: Cesium.Math.toRadians(option.pitchRadiu),
        roll: 0.0
      }
    });
  },
  /**
   * 重置视图
   *
   * @param {Array} lngLatHeight - 经纬度高度数组，包含经度、纬度、高度。
   * @param {Object} option - 视图重置选项对象，包含以下属性：
   *   - time: 视图重置的持续时间，以秒为单位。
   * @param {Function} callback - 视图重置完成后的回调函数。
   */
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
      callback && callback(options);
      viewer.entities.remove(flyToEntity);
      flyToEntity = null;
    });
  }
};
