import * as Cesium from "cesium";

export const polygonEffect = {
  //叠加水面效果
  addWaterSurfaceEffect(lnglatArr, option) {
    let polygonPrimitive = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(
              Cesium.Cartesian3.fromDegreesArray(lnglatArr.flat())
            ),
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
          }),
        }),
        appearance: new Cesium.EllipsoidSurfaceAppearance({
          aboveGround: true,
          material: new Cesium.Material({
            fabric: {
              type: "Water",
              uniforms: {
                normalMap: Cesium.buildModuleUrl(option.image),
                frequency: option.frequency, //频率
                animationSpeed: option.animationSpeed, //动画速度
                amplitude: option.amplitude, //振幅
              },
            },
          }),
        }),
        show: true,
      })
    );
    return polygonPrimitive;
  },
  //移除水面效果
  removeWaterSurfaceEffect(polygonPrimitive) {
    this.viewer.scene.primitives.remove(polygonPrimitive);
  },
};
