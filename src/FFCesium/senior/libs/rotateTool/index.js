import * as Cesium from "cesium";
import startBase64 from "../../images/start.png";
import stopBase64 from "../../images/stop.png";
import returnBase64 from "../../images/return.png";

//旋转工具
class RotateTool {
  ffCesium;
  openRotateToolRotateHandler;
  currentEntity;
  rotateFlag = false;
  Exection;
  constructor(ffCesium) {
    this.ffCesium = ffCesium;
  }
  openRotateTool(lngLatHeightArr, option) {
    //启动监听事件--地图操作时停止旋转
    this.openRotateToolRotateHandler = new Cesium.ScreenSpaceEventHandler(
      this.ffCesium.viewer.scene.canvas
    );
    this.addHandler();
    this.addButton(lngLatHeightArr, option);
  }

  /**
   * 添加监听事件
   */
  addHandler() {
    const clickCallBack = (event) => {
      const windowPosition = event.position;
      const pickedObject = this.ffCesium.viewer.scene.pick(windowPosition);
      if (Cesium.defined(pickedObject)) {
        if (pickedObject.id.openRotateToolType == "start") {
          if (this.rotateFlag == false) {
            this.currentEntity = pickedObject.id;
            //先判断距离
            let centerPosition = this.ffCesium.getCenterPosition(this.ffCesium);
            console.log("centerPosition555", centerPosition);
            let distancetemp;
            if (centerPosition) {
              let position1 = Cesium.Cartesian3.fromDegrees(
                centerPosition.lon,
                centerPosition.lat,
                900
              );
              let position2 = pickedObject.id.position._value;
              // 计算两个点之间的距离
              distancetemp = Cesium.Cartesian3.distance(position1, position2);
            } else {
              distancetemp = 1000;
            }

            if (distancetemp < 3000) {
              flyToCallback();
            } else {
              //开始旋转（飞行定位）
              this.ffCesium.flyTo(
                {
                  lng: this.currentEntity.lngLatHeight[0],
                  lat: this.currentEntity.lngLatHeight[1],
                  height: this.currentEntity.lngLatHeight[2],
                  distance: 1700,
                  pitchRadiu: -50,
                  time: 2,
                },
                flyToCallback
              );
            }
          } else {
            //继续旋转
          }
        } else if (pickedObject.id.openRotateToolType == "stop") {
          this.stopRotate();
        } else if (pickedObject.id.openRotateToolType == "return") {
          this.stopRotate();
          //重置相机
          this.ffCesium.resetView(pickedObject.id.lngLatHeight, { time: 2 });
        }
      }
    };
    const flyToCallback = () => {
      let paramObj = {
        lng: this.currentEntity.lngLatHeight[0],
        lat: this.currentEntity.lngLatHeight[1],
        height: this.currentEntity.lngLatHeight[2],
        distance: 1700,
        time: 50,
        direction: false,
        delayTime: 0,
      };
      this.startRotate(paramObj);
    };

    const stopRotateCallBack = () => {
      //停止旋转
      console.log("stopRotateCallBack--停止旋转");
    };

    this.openRotateToolRotateHandler.setInputAction(
      clickCallBack,
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    );
    this.openRotateToolRotateHandler.setInputAction(
      stopRotateCallBack,
      Cesium.ScreenSpaceEventType.WHEEL
    );
    this.openRotateToolRotateHandler.setInputAction(
      stopRotateCallBack,
      Cesium.ScreenSpaceEventType.RIGHT_DOWN
    );
    this.openRotateToolRotateHandler.setInputAction(
      stopRotateCallBack,
      Cesium.ScreenSpaceEventType.MIDDLE_DOWN
    );
  }

  startRotate(param) {
    let viewer = this.ffCesium.viewer;
    let LoopTime = 10000;
    console.log("开始旋转！");
    if (param.direction == false) {
      param.angleForSecond = 360 / param.time;
    } else {
      param.angleForSecond = -360 / param.time;
    }
    var position = Cesium.Cartesian3.fromDegrees(
      param.lng,
      param.lat,
      param.height
    );
    // 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值，这里取-30度
    // 给定飞行一周所需时间，比如20s, 那么每秒转动度数

    var startTime = Cesium.JulianDate.fromDate(new Date());
    //只旋转10秒
    var stopTime = Cesium.JulianDate.addSeconds(
      startTime,
      LoopTime,
      new Cesium.JulianDate()
    );
    viewer.clock.stopTime = stopTime.clone(); // 结速时间
    viewer.clock.startTime = startTime.clone(); // 开始时间
    viewer.clock.currentTime = startTime.clone(); // 当前时间
    viewer.clock.clockRange = Cesium.ClockRange.CLAMPED; // 行为方式
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK; // 时钟设置为当前系统时间; 忽略所有其他设置。
    // 相机的当前heading
    var initialHeading = viewer.camera.heading;
    let pitchTemp = viewer.camera.pitch;

    //console.log("pitchTemp",pitchTemp);
    let the = this;
    this.Exection = function TimeExecution() {
      // 当前已经过去的时间，单位s
      var delTime = Cesium.JulianDate.secondsDifference(
        viewer.clock.currentTime,
        viewer.clock.startTime
      );
      var heading =
        Cesium.Math.toRadians(delTime * param.angleForSecond) + initialHeading;

      if (the.rotateFlag) {
        viewer.scene.camera.setView({
          destination: position, // 点的坐标
          orientation: {
            heading: heading,
            pitch: pitchTemp,
          },
        });
        // 给定相机距离点多少距离飞行，这里取值为5000m
        viewer.scene.camera.moveBackward(param.distance);
      }
      if (
        Cesium.JulianDate.compare(
          viewer.clock.currentTime,
          viewer.clock.stopTime
        ) >= 0
      ) {
        viewer.clock.onTick.removeEventListener(this.Exection);
      }
    };
    window.rotateTimer = window.setTimeout(() => {
      viewer.clock.onTick.addEventListener(this.Exection);
      this.rotateFlag = true;
      window.rotateTimer = null;
    }, param.delayTime);
  }
  /**
   * 停止旋转
   */
  stopRotate() {
    //如果正在旋转，则关闭旋转，并清除相关事件
    if (this.rotateFlag) {
      if (this.Exection) {
        this.ffCesium.viewer.clock.onTick.removeEventListener(this.Exection);
        this.Exection = null;
      }
      console.log("停止旋转！");
      this.ffCesium.viewer.clock.stopTime =
        this.ffCesium.viewer.clock.startTime.clone();
      this.rotateFlag = false;
    }
  }

  /**
   * 添加按钮
   * @param {*} lngLatHeightArr
   * @param {*} option
   */
  addButton(lngLatHeightArr, option) {
    lngLatHeightArr.forEach((item) => {
      //测试点
      let pointPrimitive = this.ffCesium.addPointPrimitive(item, {
        pixelSize: 10,
        color: "#FFFF00",
        alpha: 1,
      });

      //开始旋转按钮
      let startEntity = this.ffCesium.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(item[0], item[1], item[2]),
        billboard: {
          image: startBase64,
          show: true, // default
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
          scale: 1.0, // default: 1.0 // color: Cesium.Color.LIME, // default: WHITE
          rotation: Cesium.Math.PI_OVER_FOUR, // default: 0.0
          alignedAxis: Cesium.Cartesian3.ZERO, // default
          width: 40, // default: undefined
          height: 40, // default: undefined
          rotation: -0,
          pixelOffset: new Cesium.Cartesian2(-50, -45),
          pixelOffsetScaleByDistance: new Cesium.NearFarScalar(
            3000,
            1.0,
            15000,
            0.4
          ),
          scaleByDistance: new Cesium.NearFarScalar(3000, 1.0, 15000, 0.4),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            30000
          ),
        },
      });
      startEntity.lngLatHeight = item;
      startEntity.openRotateToolType = "start";
      //停止旋转按钮
      let stopEntity = this.ffCesium.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(item[0], item[1], item[2]),
        billboard: {
          image: stopBase64,
          show: true, // default
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
          scale: 1.0, // default: 1.0 //
          rotation: Cesium.Math.PI_OVER_FOUR, // default: 0.0
          alignedAxis: Cesium.Cartesian3.ZERO, // default
          width: 40, // default: undefined
          height: 40, // default: undefined
          rotation: -0,
          // pixelOffset: new Cesium.Cartesian2(65, -5),
          pixelOffset: new Cesium.Cartesian2(0, -45),
          pixelOffsetScaleByDistance: new Cesium.NearFarScalar(
            3000,
            1.0,
            15000,
            0.4
          ),
          scaleByDistance: new Cesium.NearFarScalar(3000, 1.0, 15000, 0.4),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            30000
          ),
        },
      });
      stopEntity.lngLatHeight = item;
      stopEntity.openRotateToolType = "stop";
      //复位按钮
      let returnEntity = this.ffCesium.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(item[0], item[1], item[2]),
        billboard: {
          image: returnBase64,
          show: true, // default
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
          scale: 1.0, // default: 1.0 // color: Cesium.Color.LIME, // default: WHITE
          rotation: Cesium.Math.PI_OVER_FOUR, // default: 0.0
          alignedAxis: Cesium.Cartesian3.ZERO, // default
          width: 40, // default: undefined
          height: 40, // default: undefined
          rotation: -0,
          // pixelOffset: new Cesium.Cartesian2(40, -5),
          pixelOffset: new Cesium.Cartesian2(50, -45),
          pixelOffsetScaleByDistance: new Cesium.NearFarScalar(
            3000,
            1.0,
            15000,
            0.4
          ),
          scaleByDistance: new Cesium.NearFarScalar(3000, 1.0, 15000, 0.4),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            30000
          ),
        },
      });
      returnEntity.lngLatHeight = item;
      returnEntity.openRotateToolType = "return";
    });
  }
}

export default RotateTool;
