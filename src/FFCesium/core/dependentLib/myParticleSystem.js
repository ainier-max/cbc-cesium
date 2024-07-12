import * as Cesium from "cesium";

export const myParticleSystem = {
  init(lnglatheight, option) {
    let particlefire = new Cesium.ParticleSystem({
      image: option.url,
      startColor: Cesium.Color.RED.withAlpha(0.1), //粒子在其生命初期的颜色。
      endColor: Cesium.Color.YELLOW.withAlpha(0.5), //粒子寿命结束时的颜色。
      imageSize: new Cesium.Cartesian2(5, 5), //图片比例 宽高
      startScale: 0.5, //开始大小
      endScale: option.endScale, //结束大小
      minimumParticleLife: 1.5, //最短存活时间
      maximumParticleLife: 3, //最长存活时间
      // lifetime: 16.0,//粒子系统发射粒子的时间
      minimumSpeed: 29,
      maximumSpeed: 30,
      emissionRate: 100.0, //粒子数
      // particleLife: 1.0,//粒子生命
      // speed: 5.0,//发射速度
      emitter: new Cesium.CircleEmitter(10.0), //生成区域 粒子发射器。
      sizeInMeters: true, //true 米为单位 false 像素为单位，大小不变
      modelMatrix: this.computeModelMatrix({
        lng: lnglatheight[0],
        lat: lnglatheight[1],
        height: lnglatheight[2],
      }), //位置 （世界矩阵）
      emitterModelMatrix: this.computeEmitterModelMatrix(), //模型矩阵
    });
    return particlefire;
  },
  computeModelMatrix(position) {
    const center = Cesium.Cartesian3.fromDegrees(
      position.lng,
      position.lat,
      position.height
    );
    const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
    return matrix;
  },
  computeEmitterModelMatrix() {
    let hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0); //朝向
    let trs = new Cesium.TranslationRotationScale();
    trs.translation = Cesium.Cartesian3.fromElements(0.0, 0.0, 0.0);
    trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr);
    let result = Cesium.Matrix4.fromTranslationRotationScale(trs);
    return result;
  },
};
