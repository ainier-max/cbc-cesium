import ElementLogic from "./LogicClass/ElementLogic.js";
import * as Cesium from "cesium";

export default class ElementClass {
    addGroundLabelInfo = "添加贴地标签方法(addGroundLabel)";
    removeGroundLabelInfo = "移除贴地标签方法(removeGroundLabel)";
    addHtmlInfo = "叠加HTML元素方法(addHtml)";
    addCylinderInfo = "添加圆柱体方法(addCylinder)";
    removeHtmlInfo = "移除HTML元素方法(removeHtml)";
    constructor(viewer, cesiumID) {
        this.viewer = viewer;
        this.cesiumID = cesiumID;
        this.elementLogic = new ElementLogic();
    }

    addGroundLabel(lngLatHeight, option) {
        const { geometryInstance, appearance, canvas } = this.elementLogic.getGroundLabelPrimitive(lngLatHeight, option);
        const labelPrimitive = this.viewer.scene.primitives.add(
            new Cesium.Primitive({
                geometryInstances: geometryInstance,
                appearance: appearance,
            })
        );
        labelPrimitive.canvas = canvas;
        return labelPrimitive;
    }

    removeGroundLabel(labelObj) {
        this.viewer.scene.primitives.remove(labelObj);
    }

    addHtml(lngLatHeight, html, option) {
        let htmlOverlay = document.createElement("div");
        htmlOverlay.style.zIndex = option.zIndex;
        htmlOverlay.style.position = "absolute";
        htmlOverlay.style.display = "none";
        htmlOverlay.innerHTML = html;
        document.getElementById(this.cesiumID).appendChild(htmlOverlay);

        var scratch = new Cesium.Cartesian2();
        let the = this;
        this.viewer.scene.preRender.addEventListener(function () {
            var position = Cesium.Cartesian3.fromDegrees(
                lngLatHeight[0],
                lngLatHeight[1],
                lngLatHeight[2]
            );
            var canvasPosition = the.viewer.scene.cartesianToCanvasCoordinates(
                position,
                scratch
            );
            if (Cesium.defined(canvasPosition)) {
                let top = htmlOverlay.offsetHeight + option.offset.top;
                let left = htmlOverlay.offsetWidth / 2 + option.offset.left;
                htmlOverlay.style.top = canvasPosition.y - top + "px";
                htmlOverlay.style.left = canvasPosition.x - left + "px";
            } else {
            }
            if (htmlOverlay.style.display == "none") {
                window.setTimeout(() => {
                    htmlOverlay.style.display = "block";
                }, 50);
            }
        });
        return htmlOverlay;
    }

    /**
     * 添加圆柱体
     * @param {*} linePoints 
     * @param {*} option 
     * @returns 
     */
    addCylinder(linePoints, option) {
        let primitive = this.elementLogic.addCylinder(linePoints, option);
        this.viewer.scene.primitives.add(primitive);
        return primitive;
    }

    removeHtml(htmlOverlay) {
        try {
            document.getElementById(this.cesiumID).removeChild(htmlOverlay);
        } catch (error) {
            console.log("removeHtml--error", error);
        }
    }
}
