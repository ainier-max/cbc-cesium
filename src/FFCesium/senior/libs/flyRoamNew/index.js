import * as Cesium from "cesium";
import * as turf from "@turf/turf";
/**
 * 飞行漫游
 */
class FlyRoamNew {
  ffCesium;
  oldBearingArr = [];
  currentBearing = 0;
  turnFlag = false;
  turnArr = [];
  turnIndex = 0;
  turnCount = 0;
  option;
  FlyRoamPoint = null;
  pauseFlag = false;

  constructor(ffCesium) {
    this.ffCesium = ffCesium;

    let lnglat1 = [129.98447987500003, 46.814738987000055];
    let lnglat2 = [129.98447560193068, 46.81472150645828];
    let bearing = turf.bearing(turf.point(lnglat1), turf.point(lnglat2)).toFixed(0);
    console.log("角度bearing", bearing);
  }
  pauseFly() {
    this.pauseFlag = true;
  }
  continueFly() {
    this.pauseFlag = false;
  }

  stopFly() {
    this.ffCesium.viewer.entities.remove(this.FlyRoamPoint);
    this.FlyRoamPoint = null;
    this.pauseFlag = false;
  }

  startFly(lngLatHeightArr, option) {
    this.option = option;
    let the = this;
    let viewer = this.ffCesium.viewer;
    //console.log("开始飞行", lngLatHeightArr);
    let movePointArr = this.ffCesium.getLngLatArrFromLngLatHeightArr(lngLatHeightArr);
    //console.log("movePointArr", movePointArr);
    let indexFlag = 0;
    var line = turf.lineString(movePointArr);
    let chunk = turf.lineChunk(line, 2, { units: "meters" });
    console.log("chunk", chunk);
    let alphaTemp = 0;
    if (this.option.showPoint) {
      alphaTemp = 1;
    } else {
      alphaTemp = 0;
    }
    this.FlyRoamPoint = viewer.entities.add({
      position: new Cesium.CallbackProperty(function () {
        //暂停漫游与继续漫游
        if (!the.pauseFlag) {
          indexFlag = indexFlag + the.option.speed;
        }

        if (indexFlag >= chunk.features.length) {
          indexFlag = chunk.features.length - 1;
        }
        const chunkLng = chunk.features[indexFlag].geometry.coordinates[1][0];
        const chunkLat = chunk.features[indexFlag].geometry.coordinates[1][1];
        var cartesian = Cesium.Cartesian3.fromDegrees(chunkLng, chunkLat, 5);
        let startPoint = [chunkLng, chunkLat];
        if (indexFlag < chunk.features.length - 1) {
          let nextChunkLng = chunk.features[indexFlag + 1].geometry.coordinates[1][0];
          let nextChunkLat = chunk.features[indexFlag + 1].geometry.coordinates[1][1];
          let endPoint = [nextChunkLng, nextChunkLat];
          if (!the.pauseFlag) {
            the.setViewTempNew(startPoint, endPoint);
          }
        } else {
        }
        return cartesian;
      }, false),
      point: {
        pixelSize: 10, // 点的大小
        color: Cesium.Color.RED.withAlpha(alphaTemp), // 点的颜色
        outlineColor: Cesium.Color.RED.withAlpha(alphaTemp) // 点的颜色
      }
    });
  }

  setViewTempNew(startPoint, endPoint) {
    let viewer = this.ffCesium.viewer;
    // 使用Turf.js的bearing方法获取角度
    let bearing = turf.bearing(turf.point(startPoint), turf.point(endPoint)).toFixed(0);
    // console.log("bearing", bearing);
    //console.log("this.oldBearingArr", this.oldBearingArr);
    if (this.oldBearingArr.length == 0) {
      this.oldBearingArr.push(Number(bearing));
    }
    if (this.oldBearingArr[0]) {
      if (this.oldBearingArr[0] != bearing) {
        this.turnFlag = true;
        console.log("旧角度", this.oldBearingArr[0]);
        console.log("新角度", bearing);
        const radiansToDegrees = (radians) => {
          return radians * (180 / Math.PI);
        };
        const degreesToRadians = (degrees) => {
          return degrees * (Math.PI / 180);
        };
        const getSmallestAngleDifference = (angle1, angle2) => {
          var difference = angle2 - angle1;
          var times = Math.floor((difference + Math.PI) / (2 * Math.PI));
          return difference - 2 * Math.PI * times;
        };

        var smallestDifference = getSmallestAngleDifference(degreesToRadians(this.currentBearing), degreesToRadians(bearing)); // radians
        let chazhi = Math.ceil(radiansToDegrees(smallestDifference));

        //角度相差不大，不进行转向
        if (Math.abs(chazhi) < 5) {
          console.log("相差较近的角度123", Math.ceil(radiansToDegrees(smallestDifference)));
          chazhi = 0;
          this.turnFlag = false;
          bearing = this.oldBearingArr[0];
        }

        console.log("插值", chazhi);
        this.turnCount = Math.abs(chazhi / 0.5).toFixed(0);
        // if (this.turnCount > 50) {
        //   this.turnCount = 50;
        // }
        let junzhi = chazhi / this.turnCount;
        this.turnArr = [];
        for (let i = 0; i < this.turnCount; i++) {
          this.turnArr.push(Number(this.currentBearing) + junzhi * (i + 1));
        }
        console.log("this.turnAr123r", this.turnArr);
        this.oldBearingArr[0] = Number(bearing);
      }
    }

    //平稳旋转
    if (this.turnFlag == true) {
      bearing = this.turnArr[this.turnIndex];
      //this.turnIndex = this.turnIndex + this.option.speed;
      this.turnIndex = this.turnIndex + 1;
      if (this.turnIndex >= this.turnCount) {
        this.turnFlag = false;
        this.turnIndex = 0;
        this.turnArr = [];
      }
    }
    //console.log("bearing123123", bearing);
    if (bearing) {
      this.currentBearing = bearing;
      let position = Cesium.Cartesian3.fromDegrees(startPoint[0], startPoint[1], 10);
      viewer.camera.setView({
        destination: position,
        orientation: {
          // 指向
          heading: Cesium.Math.toRadians(bearing),
          // 视角
          pitch: Cesium.Math.toRadians(this.option.pitch),
          roll: 0.0
        }
      });
      viewer.scene.camera.moveBackward(this.option.rangeHeight);
    }
  }
}
export default FlyRoamNew;
