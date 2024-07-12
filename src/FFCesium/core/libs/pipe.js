import * as Cesium from "cesium";
import { getModelMatrix, getHeadingPitchRoll } from "../dependentLib/getHpr.js";
//点线面采集方法
export const pipe = {
  addCylinder(linePoints, option) {
    //圆柱的中心点
    let centerPointX = (linePoints[0] + linePoints[3]) / 2;
    let centerPointY = (linePoints[1] + linePoints[4]) / 2;
    let centerPointH = (linePoints[2] + linePoints[5]) / 2;
    let centerPosition = Cesium.Cartesian3.fromDegrees(
      centerPointX,
      centerPointY,
      centerPointH
    );
    //圆柱的长度
    var startheightCartesian = Cesium.Cartesian3.fromDegrees(
      linePoints[0],
      linePoints[1],
      linePoints[2]
    );
    var endheightCartesian = Cesium.Cartesian3.fromDegrees(
      linePoints[3],
      linePoints[4],
      linePoints[5]
    );
    let distance = this.getDistance(startheightCartesian, endheightCartesian);
    /** */
    //获取倾斜角度
    var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerPosition);
    let pointA = Cesium.Cartesian3.fromDegrees(
      linePoints[0],
      linePoints[1],
      linePoints[2]
    );
    let pointB = Cesium.Cartesian3.fromDegrees(
      linePoints[3],
      linePoints[4],
      linePoints[5]
    );
    let m = getModelMatrix(pointA, pointB);
    let hpr = getHeadingPitchRoll(m);
    hpr.pitch = hpr.pitch + 3.14 / 2 + 3.14;
    var hprRotation = Cesium.Matrix3.fromHeadingPitchRoll(hpr);
    //console.log("hprRotation",hprRotation);
    var hprnew = Cesium.Matrix4.fromRotationTranslation(
      hprRotation,
      new Cesium.Cartesian3(0.0, 0.0, 0.0) // 不平移
    );
    // console.log("hprnew", hprnew);
    Cesium.Matrix4.multiply(modelMatrix, hprnew, modelMatrix);
    // console.log("modelMatrix", modelMatrix);
    // 创建圆柱/圆锥几何实例
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.CylinderGeometry({
        length: distance, // 圆柱体的长度
        topRadius: option.radius, // 顶部半径， 值为0即为圆柱
        bottomRadius: option.radius, // 底部半径
        slices: option.slices,
        //vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL  // 指定顶点格式，包括位置和法线
      }),
      //modelMatrix: Cesium.Matrix4.fromTranslation(centerPosition), // 圆柱体的位置
      modelMatrix: modelMatrix, // 圆柱体的位置
    });

    // 根据几何实例创建图元
    const primitive = new Cesium.Primitive({
      geometryInstances: instance, //可以是实例数组
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: Cesium.Material.fromType("Color", {
          color: new Cesium.Color.fromCssColorString(option.color).withAlpha(
            option.alpha
          ), // 圆柱体的颜色
        }),
      }),
    });

    // 将图元添加到集合
    this.viewer.scene.primitives.add(primitive);

    return primitive;
  },
  //获取距离
  getDistance(startPosition, endPosition) {
    var distance = Cesium.Cartesian3.distance(startPosition, endPosition);
    //console.log("两点（有高度差）之间的距离：" + distance + "米");
    return distance;
  },
};
