import * as Cesium from "cesium";

export const addOtherElement = {
  addGroundLabel(lngLatHeight, option) {
    const canvas = document.createElement("canvas");
    canvas.width = 60;
    canvas.height = 20;
    const context = canvas.getContext("2d");

    //context.fillStyle = "rgba(240, 240, 240, 0)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = "14px sans-serif";
    context.fillStyle = option.color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(option.text, canvas.width / 2, canvas.height / 2);

    const image = new Image();
    image.src = canvas.toDataURL();

    const labelPrimitive = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.RectangleGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(
              lngLatHeight[0] - 0.0035,
              lngLatHeight[1] - 0.001,
              lngLatHeight[0] + 0.0035,
              lngLatHeight[1] + 0.001
            ),
            height: lngLatHeight[2],
          }),
        }),
        appearance: new Cesium.MaterialAppearance({
          material: new Cesium.Material({
            fabric: {
              type: "Image",
              uniforms: {
                image: image.src,
              },
            },
          }),
        }),
      })
    );
    console.log("labelPrimitive", labelPrimitive);
    labelPrimitive.canvas = canvas;

    return labelPrimitive;
  },
  removeGroundLabel(labelObj) {
    this.viewer.scene.primitives.remove(labelObj);
  },
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
  },
  removeHtml(htmlOverlay) {
    try {
      document.getElementById(this.cesiumID).removeChild(htmlOverlay);
    } catch (error) {
      console.log("removeHtml--error", error);
    }
  },
};
