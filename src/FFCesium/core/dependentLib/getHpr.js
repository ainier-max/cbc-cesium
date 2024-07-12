import * as Cesium from "cesium";
//获取模型矩阵
export function getModelMatrix(pointA, pointB) {
  //向量AB
  const vector2 = Cesium.Cartesian3.subtract(
    pointB,
    pointA,
    new Cesium.Cartesian3()
  );
  //归一化
  const normal = Cesium.Cartesian3.normalize(vector2, new Cesium.Cartesian3());
  //normal.x=0.9

  //旋转矩阵 rotationMatrixFromPositionVelocity源码中有，并未出现在cesiumAPI中
  const rotationMatrix3 = Cesium.Transforms.rotationMatrixFromPositionVelocity(
    pointA,
    normal,
    Cesium.Ellipsoid.WGS84
  );

  const modelMatrix4 = Cesium.Matrix4.fromRotationTranslation(
    rotationMatrix3,
    pointA
  );
  return modelMatrix4;
}

export function getHeadingPitchRoll(m) {
  var m1 = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Matrix4.getTranslation(m, new Cesium.Cartesian3()),
    Cesium.Ellipsoid.WGS84,
    new Cesium.Matrix4()
  );
  // 矩阵相除
  var m3 = Cesium.Matrix4.multiply(
    Cesium.Matrix4.inverse(m1, new Cesium.Matrix4()),
    m,
    new Cesium.Matrix4()
  );
  // 得到旋转矩阵
  var mat3 = Cesium.Matrix4.getMatrix3(m3, new Cesium.Matrix3());
  // 计算四元数
  var q = Cesium.Quaternion.fromRotationMatrix(mat3);
  // 计算旋转角(弧度)
  var hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);
  return hpr;
}

export function getMyMatrix3(m) {
  var m1 = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Matrix4.getTranslation(m, new Cesium.Cartesian3()),
    Cesium.Ellipsoid.WGS84,
    new Cesium.Matrix4()
  );
  // 矩阵相除
  var m3 = Cesium.Matrix4.multiply(
    Cesium.Matrix4.inverse(m1, new Cesium.Matrix4()),
    m,
    new Cesium.Matrix4()
  );
  // 得到旋转矩阵
  var mat3 = Cesium.Matrix4.getMatrix3(m3, new Cesium.Matrix3());
  var q = Cesium.Quaternion.fromRotationMatrix(mat3);
  return mat3;
}
