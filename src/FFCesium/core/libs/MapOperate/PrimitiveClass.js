import PrimitiveLogic from "./LogicClass/PrimitiveLogic.js";
import * as Cesium from "cesium";

export default class PrimitiveClass {
    addGltfPrimitiveInfo = "添加GLTF模型方法(addGltfPrimitive)";
    addBillboardPrimitiveInfo = "添加图标Primitive方法(addBillboardPrimitive)";
    addPointPrimitiveInfo = "添加点Primitive方法(addPointPrimitive)";
    addPolylinePrimitiveInfo = "添加线Primitive方法(addPolylinePrimitive)";
    addPolygonPrimitiveInfo = "添加面Primitive方法(addPolygonPrimitive)";
    removeFFPrimitiveInfo = "移除Primitive方法(removeFFPrimitive)";
    constructor(viewer) {
        this.viewer = viewer;
        this.primitiveLogic = new PrimitiveLogic();
        this.ffCesiumPointPrimitiveCollection = this.viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        this.ffCesiumPrimitiveCollection = this.viewer.scene.primitives.add(new Cesium.PrimitiveCollection());
        this.ffCesiumGltfCollection = this.viewer.scene.primitives.add(new Cesium.PrimitiveCollection());
        this.ffCesiumBillboardPrimitiveCollection = this.viewer.scene.primitives.add(new Cesium.BillboardCollection());
    }

    async addGltfPrimitive(lngLatHeight, option) {
        const position = Cesium.Cartesian3.fromDegrees(lngLatHeight[0], lngLatHeight[1], lngLatHeight[2]);
        let modelMatrix = this.primitiveLogic.getGltfModelMatrix(position, option.headingAngle, option.pitchAngle, option.rollAngle);
        try {
            const model = await Cesium.Model.fromGltfAsync({
                url: option.url,
                modelMatrix: modelMatrix,
                minimumPixelSize: option.minimumPixelSize,
                maximumScale: option.maximumScale
            });
            model.FFtype = "FFGltfPrimitive";
            this.ffCesiumGltfCollection.add(model);
            return model;
        } catch (error) {
            console.log(`Failed to load model. ${error}`);
        }
    }

    addBillboardPrimitive(lngLatHeight, option) {
        let newOption = this.primitiveLogic.getBillboardOption(lngLatHeight, option);
        let primitive = this.ffCesiumBillboardPrimitiveCollection.add(newOption);
        primitive.FFtype = "FFBillboardPrimitive";
        return primitive;
    }

    addPointPrimitive(lngLatHeight, option) {
        let newOption = this.primitiveLogic.getPointOption(lngLatHeight, option);
        let primitive = this.ffCesiumPointPrimitiveCollection.add(newOption);
        primitive.FFtype = "FFPointPrimitive";
        return primitive;
    }

    addPolylinePrimitive(lnglatArr, option) {
        let { primitive, positionTemp } = this.primitiveLogic.getPolylinePrimitive(lnglatArr, option);
        this.ffCesiumPrimitiveCollection.add(primitive);
        primitive.FFOption = option;
        primitive.FFtype = "FFPolylinePrimitive";
        primitive.FFLngLatHeightArr = lnglatArr;
        primitive.FFPosition = positionTemp;
        return primitive;
    }

    addPolygonPrimitive(lnglatArr, option) {
        let primitive = this.primitiveLogic.getPolygonPrimitive(lnglatArr, option);
        this.ffCesiumPrimitiveCollection.add(primitive);
        primitive.FFtype = "FFPolygonPrimitive";
        return primitive;
    }

    removeFFPrimitive(FFPrimitive) {
        console.log("removeFFPrimitive--FFPrimitive", FFPrimitive);
        if (FFPrimitive.FFtype) {
            if (FFPrimitive.FFtype == "FFPointPrimitive") {
                this.ffCesiumPointPrimitiveCollection.remove(FFPrimitive);
            } else if (FFPrimitive.FFtype == "FFBillboardPrimitive") {
                this.ffCesiumBillboardPrimitiveCollection.remove(FFPrimitive);
            } else if (FFPrimitive.FFtype == "FFGltfPrimitive") {
                this.ffCesiumGltfCollection.remove(FFPrimitive);
            } else if (FFPrimitive.FFtype == "FFPolylinePrimitive" || FFPrimitive.FFtype == "FFPolygonPrimitive") {
                this.ffCesiumPrimitiveCollection.remove(FFPrimitive);
            }
        }
    }
}
