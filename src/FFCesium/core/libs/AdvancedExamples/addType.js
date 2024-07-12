import * as Cesium from "cesium";
export const addType = {
  addHtmlForVue(lngLatHeight, htmlOverlay, offset) {
    if (htmlOverlay.removeListener) {
      htmlOverlay.removeListener();
    }

    htmlOverlay.style.position = "absolute";
    var scratch = new Cesium.Cartesian2();
    let the = this;
    //htmlOverlay.displayFlag = true;
    //htmlOverlay.collisionFlag = false;
    htmlOverlay.removeListener = this.viewer.scene.preRender.addEventListener(
      function () {
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
          let top = htmlOverlay.offsetHeight + offset.top;
          let left = htmlOverlay.offsetWidth / 2 + offset.left;
          htmlOverlay.style.top = canvasPosition.y - top + "px";
          htmlOverlay.style.left = canvasPosition.x - left + "px";
        } else {
        }

        if (htmlOverlay.style.display == "none") {
          window.setTimeout(() => {
            htmlOverlay.style.display = "block";
          }, 50);
        }
      }
    );
    return htmlOverlay;
  },
  closeHtmlForVue(htmlOverlay) {
    htmlOverlay.style.display = "none";
    if (htmlOverlay.removeListener) {
      htmlOverlay.removeListener();
    }
  },

  openDivCollisionCheckingTimer: null,
  openDivCollisionCheckingAllHtmlOverlay: null,
  openDivCollisionCheckingOption: null,
  openDivCollisionCheckFunction: null,
  //打开div碰撞检测
  openDivCollisionChecking(allHtmlOverlay, option) {
    this.openDivCollisionCheckingAllHtmlOverlay = allHtmlOverlay;
    this.openDivCollisionCheckingOption = option;
    let the = this;
    this.openDivCollisionCheckFunction = function () {
      //the.openDivCollisionCheckingCallBack(allHtmlOverlay, option);
      if (the.openDivCollisionCheckingTimer) {
        clearInterval(the.openDivCollisionCheckingTimer);
        the.openDivCollisionCheckingTimer = null;
      }
      the.openDivCollisionCheckingTimer = setTimeout(function () {
        the.openDivCollisionCheckingCallBack();
      }, 100);
    };

    this.viewer.scene.camera.changed.addEventListener(
      this.openDivCollisionCheckFunction
    );
    this.viewer.scene.camera.moveEnd.addEventListener(
      this.openDivCollisionCheckFunction
    );
  },
  openDivCollisionCheckingCallBack() {
    let allHtmlOverlay = this.openDivCollisionCheckingAllHtmlOverlay;
    let option = this.openDivCollisionCheckingOption;
    console.log("相机移动结束");
    //重置计算标识
    allHtmlOverlay.forEach((element) => {
      element.countFlag = false;
      element.collisionFlag = false;
      element.isHidden = false;
    });
    //判断两个div是否碰撞
    const doDivsOverlap = (div1, div2) => {
      let rect1 = div1.getBoundingClientRect();
      let rect2 = div2.getBoundingClientRect();
      console.log("rect1", rect1);
      console.log("rect2", rect2);
      return !(
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom ||
        rect1.right < rect2.left ||
        rect1.left > rect2.right
      );
    };

    allHtmlOverlay.forEach((element, index) => {
      for (let i = 0; i < allHtmlOverlay.length; i++) {
        //自己和自己不需要判断
        if (index != i && allHtmlOverlay[i].countFlag == false) {
          let collisionFlag = doDivsOverlap(element, allHtmlOverlay[i]);
          // console.log(
          //   element.name + "," + allHtmlOverlay[i].name + "是否碰撞",
          //   collisionFlag
          // );
          if (collisionFlag == true) {
            element.collisionFlag = true;
            allHtmlOverlay[i].collisionFlag = true;
            //计算这两个点，哪个点离相机更加近
            let point1Position = Cesium.Cartesian3.fromDegrees(
              element.lngLatHeight[0],
              element.lngLatHeight[1],
              element.lngLatHeight[2]
            );
            let point2Position = Cesium.Cartesian3.fromDegrees(
              allHtmlOverlay[i].lngLatHeight[0],
              allHtmlOverlay[i].lngLatHeight[1],
              allHtmlOverlay[i].lngLatHeight[2]
            );
            // 计算目标点与相机之间的距离
            let cameraPosition = this.viewer.scene.camera.position;

            let point1Distance = Cesium.Cartesian3.distance(
              point1Position,
              cameraPosition
            );
            let point2Distance = Cesium.Cartesian3.distance(
              point2Position,
              cameraPosition
            );
            //隐藏距离比较远的
            if (point1Distance > point2Distance) {
              element.style.opacity = option.opacity;
              element.isHidden = true;
              console.log("显示:" + allHtmlOverlay[i].namecc);
              //没有被隐藏，才能显示
              if (allHtmlOverlay[i].isHidden == false) {
                allHtmlOverlay[i].style.opacity = 1;
              }
            } else {
              allHtmlOverlay[i].style.opacity = option.opacity;
              allHtmlOverlay[i].isHidden = true;
              console.log("显示:" + element.namecc);
              //没有被隐藏，才能显示
              if (element.isHidden == false) {
                element.style.opacity = 1;
              }
            }
            console.log("point1Distance", point1Distance);
            console.log("point2Distance", point2Distance);
          }
        }
      }
      //元素计算后，就不再被遍历
      element.countFlag = true;
      allHtmlOverlay[index].countFlag = true;
    });

    console.log("allHtmlOverlay123", allHtmlOverlay);
    allHtmlOverlay.forEach((item) => {
      if (item.collisionFlag == false) {
        item.style.opacity = 1;
      }
    });
  },

  //关闭div碰撞检测
  closeDivCollisionChecking() {
    //清除事件监听器
    this.viewer.scene.camera.changed.removeEventListener(
      this.openDivCollisionCheckFunction
    );
    this.viewer.scene.camera.moveEnd.removeEventListener(
      this.openDivCollisionCheckFunction
    );
    if (this.openDivCollisionCheckingTimer) {
      clearInterval(this.openDivCollisionCheckingTimer);
      this.openDivCollisionCheckingTimer = null;
    }
  },

  //根据区域坐标展示地图
  showMapByAreaLngLat(LngLats) {
    //需要开启地形检测
    this.viewer.scene.globe.depthTestAgainstTerrain = true;
    // 透明必须设置true
    this.viewer.scene.globe.baseColor = Cesium.Color.TRANSPARENT;
    this.viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
    // 关掉太空
    this.viewer.scene.skyBox.show = false;
    // 关掉大气层
    this.viewer.scene.skyAtmosphere.show = false;

    const polygon = [
      new Cesium.ClippingPolygon({
        positions: Cesium.Cartesian3.fromDegreesArray(LngLats),
      }),
    ];
    this.viewer.scene.globe.clippingPolygons =
      new Cesium.ClippingPolygonCollection({
        polygons: polygon,
      });
    this.viewer.scene.globe.clippingPolygons.inverse = true;

    this.viewer.entities.add({
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray(LngLats),
        height: -1000, // 高度
        width: 300, // 宽度
        extrudedHeight: 10, // 挤出高度,也就是通道的高度
        cornerType: Cesium.CornerType.MITERED,
        material: Cesium.Color.fromCssColorString("#4ABAE9"),
      },
    });
  },
};
