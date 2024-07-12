import * as Cesium from "cesium";

export const mapAction = {
  //飞行定位
  flyTo(option, callback) {
    let the = this;
    let cartographics = [
      Cesium.Cartographic.fromDegrees(option.lng, option.lat),
    ];
    cartographics.option = option;
    Cesium.sampleTerrain(
      the.viewer.scene.terrainProvider,
      14,
      cartographics
    ).then((updatedPositions) => {
      updatedPositions.option.height = updatedPositions[0].height;
      let flyToEntity = new Cesium.Entity({
        position: Cesium.Cartesian3.fromDegrees(
          updatedPositions.option.lng,
          updatedPositions.option.lat,
          updatedPositions.option.height
        ),
        point: {
          pixelSize: 1,
          color: Cesium.Color.RED.withAlpha(0.9),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.9),
          outlineWidth: 0,
        },
      });
      the.viewer.entities.add(flyToEntity);
      var flyPromise = the.viewer.flyTo(flyToEntity, {
        duration: option.time, //飞行时间,单位：秒
        offset: {
          heading: Cesium.Math.toRadians(0.0), //旋转角度
          pitch: Cesium.Math.toRadians(updatedPositions.option.pitchRadiu), //倾斜角度
          range: updatedPositions.option.eyeHeight, //视角高度
        },
      });
      // 飞行完后，移除flyToEntity。
      flyPromise.then(function () {
        the.viewer.entities.remove(flyToEntity);
        flyToEntity = null;
        if (callback) {
          callback();
        }
      });
    });
  },
  //定位
  setView(option) {
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        option.lng,
        option.lat,
        option.height
      ),
      orientation: {
        // 指向
        heading: Cesium.Math.toRadians(0, 0),
        // 视角
        pitch: Cesium.Math.toRadians(option.pitchRadiu),
        roll: 0.0,
      },
    });
  },
};
