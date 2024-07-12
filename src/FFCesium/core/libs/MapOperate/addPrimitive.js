import * as Cesium from "cesium";

export const addPrimitive = {
  ffCesiumPointPrimitiveCollection: null, //大量点
  ffCesiumPrimitiveCollection: null, //大量线，面
  ffCesiumBillboardPrimitiveCollection: null, //大量广告牌
  ffCesiumGltfCollection: null, //大量模型
  //初始化
  addPrimitiveInit() {
    this.ffCesiumPointPrimitiveCollection = this.viewer.scene.primitives.add(
      new Cesium.PointPrimitiveCollection()
    );
    this.ffCesiumPrimitiveCollection = this.viewer.scene.primitives.add(
      new Cesium.PrimitiveCollection()
    );
    this.ffCesiumGltfCollection = this.viewer.scene.primitives.add(
      new Cesium.PrimitiveCollection()
    );
    this.ffCesiumBillboardPrimitiveCollection =
      this.viewer.scene.primitives.add(new Cesium.BillboardCollection());
  },
  //添加gltf/glb模型
  async addGltfPrimitive(lngLatHeight, option) {
    const position = Cesium.Cartesian3.fromDegrees(
      lngLatHeight[0],
      lngLatHeight[1],
      lngLatHeight[2]
    );

    let heading = Cesium.Math.toRadians(option.headingAngle);
    let pitch = Cesium.Math.toRadians(option.pitchAngle);
    let roll = Cesium.Math.toRadians(option.rollAngle);
    let headingPositionRoll = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    //const headingPositionRoll = new Cesium.HeadingPitchRoll();
    const fixedFrameTransform =
      Cesium.Transforms.localFrameToFixedFrameGenerator("north", "west");
    try {
      const model = await Cesium.Model.fromGltfAsync({
        url: option.url,
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
          position,
          headingPositionRoll,
          Cesium.Ellipsoid.WGS84,
          fixedFrameTransform
        ),
        minimumPixelSize: option.minimumPixelSize,
        maximumScale: option.maximumScale,
      });
      model.FFtype = "FFGltfPrimitive";
      this.ffCesiumGltfCollection.add(model);
      return model;
    } catch (error) {
      console.log(`Failed to load model. ${error}`);
    }
  },

  //添加广告牌
  addBillboardPrimitive(lngLatHeight, option) {
    let newOption = Object.assign({}, option);
    newOption.position = Cesium.Cartesian3.fromDegrees(
      lngLatHeight[0],
      lngLatHeight[1],
      lngLatHeight[2]
    );
    newOption.image = newOption.image;
    newOption.pixelOffset = new Cesium.Cartesian2(
      newOption.pixelOffset[0],
      newOption.pixelOffset[1]
    );
    let primitive = this.ffCesiumBillboardPrimitiveCollection.add(newOption);
    primitive.FFtype = "FFBillboardPrimitive";
    return primitive;
  },

  //添加点图元
  addPointPrimitive(lngLatHeight, option) {
    let newOption = Object.assign({}, option);
    //其他特殊参数设置
    newOption.position = Cesium.Cartesian3.fromDegrees(
      lngLatHeight[0],
      lngLatHeight[1],
      lngLatHeight[2]
    );

    //颜色属性设置
    newOption.color = new Cesium.Color.fromCssColorString(
      option.color
    ).withAlpha(option.alpha);

    if (option.outlineColor) {
      newOption.outlineColor = new Cesium.Color.fromCssColorString(
        option.outlineColor
      );
    }
    let primitive = this.ffCesiumPointPrimitiveCollection.add(newOption);
    primitive.FFtype = "FFPointPrimitive";
    return primitive;
  },
  //添加线图元
  addPolylinePrimitive(lnglatArr, option) {
    let positionTemp = Cesium.Cartesian3.fromDegreesArrayHeights(
      lnglatArr.flat()
    );
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: positionTemp,
        width: option.width,
      }),
    });
    const primitive = new Cesium.Primitive({
      geometryInstances: instance, //可以是实例数组
      appearance: new Cesium.PolylineMaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: "Color",
            uniforms: {
              color: new Cesium.Color.fromCssColorString(
                option.color
              ).withAlpha(option.alpha),
            },
          },
        }),
      }),
    });
    this.ffCesiumPrimitiveCollection.add(primitive);
    primitive.FFOption = option;
    primitive.FFtype = "FFPolylinePrimitive";
    primitive.FFLngLatHeightArr = lnglatArr;
    primitive.FFPosition = positionTemp;
    return primitive;
  },
  //添加面图元
  addPolygonPrimitive(lnglatArr, option) {
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray(lnglatArr.flat())
        ),
      }),
    });
    const primitive = new Cesium.Primitive({
      geometryInstances: instance, //可以是实例数组
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: "Color",
            uniforms: {
              color: new Cesium.Color.fromCssColorString(
                option.color
              ).withAlpha(option.alpha),
            },
          },
        }),
      }),
    });
    this.ffCesiumPrimitiveCollection.add(primitive);
    primitive.FFtype = "FFPolygonPrimitive";
    return primitive;
  },
  //删除原始图形Primitive
  removeFFPrimitive(FFPrimitive) {
    console.log("removeFFPrimitive--FFPrimitive", FFPrimitive);
    if (FFPrimitive.FFtype) {
      if (FFPrimitive.FFtype == "FFPointPrimitive") {
        this.ffCesiumPointPrimitiveCollection.remove(FFPrimitive);
      } else if (FFPrimitive.FFtype == "FFBillboardPrimitive") {
        this.ffCesiumBillboardPrimitiveCollection.remove(FFPrimitive);
      } else if (FFPrimitive.FFtype == "FFGltfPrimitive") {
        this.ffCesiumGltfCollection.remove(FFPrimitive);
      } else if (
        FFPrimitive.FFtype == "FFPolylinePrimitive" ||
        FFPrimitive.FFtype == "FFPolygonPrimitive"
      ) {
        this.ffCesiumPrimitiveCollection.remove(FFPrimitive);
      }
    }
  },
};
