import * as Cesium from 'cesium';

export const addOtherElement = {
  addHtml(lngLatHeight, html, option) {
    let htmlOverlay = document.createElement('div');
    htmlOverlay.style.zIndex = option.zIndex;
    htmlOverlay.style.position = 'absolute';
    htmlOverlay.style.display = 'none';
    htmlOverlay.innerHTML = html;
    document.getElementById(this.cesiumID).appendChild(htmlOverlay);

    var scratch = new Cesium.Cartesian2();
    let the = this;
    this.viewer.scene.preRender.addEventListener(function () {
      var position = Cesium.Cartesian3.fromDegrees(lngLatHeight[0], lngLatHeight[1], lngLatHeight[2]);
      var canvasPosition = the.viewer.scene.cartesianToCanvasCoordinates(position, scratch);
      if (Cesium.defined(canvasPosition)) {
        let top = htmlOverlay.offsetHeight + option.offset.top;
        let left = htmlOverlay.offsetWidth / 2 + option.offset.left;
        htmlOverlay.style.top = canvasPosition.y - top + 'px';
        htmlOverlay.style.left = canvasPosition.x - left + 'px';
      } else {
      }
      if (htmlOverlay.style.display == 'none') {
        window.setTimeout(() => {
          htmlOverlay.style.display = 'block';
        }, 50);
      }
    });
    return htmlOverlay;
  },
  removeHtml(htmlOverlay) {
    try {
      document.getElementById(this.cesiumID).removeChild(htmlOverlay);
    } catch (error) {
      console.log('removeHtml--error', error);
    }
  }
};
