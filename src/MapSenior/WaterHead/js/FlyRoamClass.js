import * as Cesium from "cesium";
import * as turf from "@turf/turf";
import labelBack from "../images/labelBack.png";

class FlyRoamClass {
  viewer = null;
  oldBearingArr = [];
  currentBearing = 0;
  turnFlag = false;
  turnArr = [];
  turnIndex = 0;
  turnCount = 0;
  option = null;
  FlyRoamPoint = null;
  pauseFlag = false;
  intervalTime = null;

  constructor(viewer) {
    this.viewer = viewer;
  }

  pauseFly() {
    this.pauseFlag = true;
  }

  continueFly() {
    this.pauseFlag = false;
  }

  stopFly() {
    if (this.intervalTime !== null) {
      window.clearInterval(this.intervalTime);
      this.intervalTime = null;
    }
    if (this.FlyRoamPoint && this.viewer) {
      this.viewer.entities.remove(this.FlyRoamPoint);
      this.FlyRoamPoint = null;
    }
    this.pauseFlag = false;
    this.resetTurnState();
  }

  resetTurnState() {
    this.oldBearingArr = [];
    this.currentBearing = 0;
    this.turnFlag = false;
    this.turnArr = [];
    this.turnIndex = 0;
    this.turnCount = 0;
  }

  startFly(lngLatHeightArr, option) {
    if (!this.viewer) return;
    this.stopFly();
    this.option = option;

    const movePointArr = this.getLngLatArrFromLngLatHeightArr(lngLatHeightArr);
    const line = turf.lineString(movePointArr);
    const chunk = turf.lineChunk(line, option.lineChunkDis, { units: "meters" });
    let indexFlag = 0;

    this.intervalTime = window.setInterval(() => {
      if (this.option?.continuousFun) this.option.continuousFun();
    }, option.continuousTime);

    this.FlyRoamPoint = this.viewer.entities.add({
      position: new Cesium.CallbackProperty(() => {
        if (!this.pauseFlag) indexFlag += this.option.speed;

        if (indexFlag >= chunk.features.length) {
          indexFlag = chunk.features.length - 1;
          this.option.endFlyRoamCallBack();
          this.stopFly();
        }

        const chunkLng = chunk.features[indexFlag].geometry.coordinates[1][0];
        const chunkLat = chunk.features[indexFlag].geometry.coordinates[1][1];
        const cartesian = Cesium.Cartesian3.fromDegrees(chunkLng, chunkLat, 115);

        if (indexFlag < chunk.features.length - 1 && !this.pauseFlag) {
          const nextChunkLng = chunk.features[indexFlag + 1].geometry.coordinates[1][0];
          const nextChunkLat = chunk.features[indexFlag + 1].geometry.coordinates[1][1];
          this.setViewTempNew([chunkLng, chunkLat], [nextChunkLng, nextChunkLat]);
        }

        return cartesian;
      }, false),
      point: {
        pixelSize: 10,
        color: Cesium.Color.YELLOW.withAlpha(0.0),
        outlineColor: Cesium.Color.YELLOW.withAlpha(0.0)
      },
      billboard: {
        image: labelBack,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 1.0
      },
      label: {
        text: "2.30 m",
        pixelOffset: new Cesium.Cartesian2(0, -22),
        font: "14px sans-serif",
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      }
    });
  }

  setViewTempNew(startPoint, endPoint) {
    if (!this.viewer) return;

    let bearing = Number(turf.bearing(turf.point(startPoint), turf.point(endPoint)).toFixed(0));
    if (this.oldBearingArr.length === 0) this.oldBearingArr.push(bearing);

    if (this.oldBearingArr[0] !== bearing) {
      this.turnFlag = true;

      const radiansToDegrees = (radians) => radians * (180 / Math.PI);
      const degreesToRadians = (degrees) => degrees * (Math.PI / 180);
      const getSmallestAngleDifference = (angle1, angle2) => {
        const difference = angle2 - angle1;
        const times = Math.floor((difference + Math.PI) / (2 * Math.PI));
        return difference - 2 * Math.PI * times;
      };

      const smallestDifference = getSmallestAngleDifference(
        degreesToRadians(this.currentBearing),
        degreesToRadians(bearing)
      );
      let diff = Math.ceil(radiansToDegrees(smallestDifference));

      if (Math.abs(diff) < 5) {
        diff = 0;
        this.turnFlag = false;
        bearing = this.oldBearingArr[0];
      }

      this.turnCount = Number(Math.abs(diff / 0.5).toFixed(0));
      const average = this.turnCount === 0 ? 0 : diff / this.turnCount;
      this.turnArr = [];
      for (let i = 0; i < this.turnCount; i++) {
        this.turnArr.push(Number(this.currentBearing) + average * (i + 1));
      }
      this.oldBearingArr[0] = bearing;
    }

    if (this.turnFlag) {
      bearing = this.turnArr[this.turnIndex];
      this.turnIndex += 1;
      if (this.turnIndex >= this.turnCount) {
        this.turnFlag = false;
        this.turnIndex = 0;
        this.turnArr = [];
      }
    }

    this.currentBearing = Number(bearing);
    const position = Cesium.Cartesian3.fromDegrees(startPoint[0], startPoint[1], 10);
    this.viewer.camera.setView({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(bearing),
        pitch: Cesium.Math.toRadians(this.option.pitch),
        roll: 0.0
      }
    });
    this.viewer.scene.camera.moveBackward(this.option.rangeHeight);
  }

  getLngLatArrFromLngLatHeightArr(lngLatHeightArr) {
    return lngLatHeightArr.map((item) => [item[0], item[1]]);
  }
}

export default FlyRoamClass;
