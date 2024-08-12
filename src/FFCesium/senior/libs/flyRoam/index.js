import * as Cesium from "cesium";
/**
 * 飞行漫游
 */
class FlyRoam {
  constructor(ffCesium) {
    this.viewer = ffCesium.viewer;
    this.lineTool = "pan";
    this.line = null;
    this.model = null;
    this.points = []; //手动添加到地图的点
    this.autoPoints = []; //插值添加到地图的点
    this.tmpPositions = []; //手动添加的点
    this.positions = []; //插值后的点
    this.viewType = 1; //第一人称
    this.intervalTimer = null; //动画
    this.curState = "stop"; //漫游状态，play,stop,pause
    this.fun = null;
    this.executePoints = []; //记录已经执行回调方法的点

    this.heightOffset = 0;
    this.speed = 10;
    this.curPointIndex = 0;
  }

  init() {
    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    var that = this;
    //使用setInputAction方法进行监听,它可以监听各种点击、移入事件等，第一个参数放入回调函数
    /**
     * 绘制状态下，单击添加途经点
     */
    handler.setInputAction(function (movement) {
      if (that.lineTool == "set") {
        //var pick = viewer.scene.pick(movement.position); //endPosition position
        var pick = new Cesium.Cartesian2(
          movement.position.x,
          movement.position.y
        );
        //确定信息是否为空，当前获取的对象是否和之前绑定的一致
        if (Cesium.defined(pick)) {
          that.addEntity(pick);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK); //MOUSE_MOVE  LEFT_CLICK

    /**
     * 双击添加结束点，绘制结束，工具设置为pan漫游
     */
    handler.setInputAction(function (movement) {
      if (that.lineTool == "set") {
        var pick = new Cesium.Cartesian2(
          movement.position.x,
          movement.position.y
        ); //endPosition position
        //确定信息是否为空，当前获取的对象是否和之前绑定的一致
        if (Cesium.defined(pick)) {
          that.addEntity(pick);
        }
        that.lineTool = "pan";
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 添加点
   * @param {*} pick
   */
  addEntity(pick) {
    var cartesian = this.viewer.scene.globe.pick(
      this.viewer.camera.getPickRay(pick),
      this.viewer.scene
    );
    if (cartesian) {
      //世界坐标转地理坐标（弧度）
      var cartographic =
        this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      if (cartographic) {
        //海拔
        var height = this.viewer.scene.globe.getHeight(cartographic);
        //视角海拔高度
        var he = Math.sqrt(
          this.viewer.scene.camera.positionWC.x *
            this.viewer.scene.camera.positionWC.x +
            this.viewer.scene.camera.positionWC.y *
              this.viewer.scene.camera.positionWC.y +
            this.viewer.scene.camera.positionWC.z *
              this.viewer.scene.camera.positionWC.z
        );
        var he2 = Math.sqrt(
          cartesian.x * cartesian.x +
            cartesian.y * cartesian.y +
            cartesian.z * cartesian.z
        );
        //地理坐标（弧度）转经纬度坐标
        var point = [
          (cartographic.longitude / Math.PI) * 180,
          (cartographic.latitude / Math.PI) * 180,
        ];
        if (!height) {
          height = 0;
        }
        if (!he) {
          he = 0;
        }
        if (!he2) {
          he2 = 0;
        }
        if (!point) {
          point = [0, 0];
        }

        //添加途径点到地图上
        var p = this.viewer.entities.add({
          id: this.uuid(8, 32),
          position: new Cesium.Cartesian3.fromDegrees(
            point[0],
            point[1],
            height + parseFloat(this.heightOffset)
          ),
          point: {
            pixelSize: 15, //点的大小
            color: Cesium.Color.RED, //点的颜色
            outlineWidth: 2, //边框宽度
            outlineColor: Cesium.Color.WHITE.withAlpha(0.4), //边框颜色
          },
        });

        this.tmpPositions.push(
          Cesium.Cartesian3.fromDegrees(
            point[0],
            point[1],
            height + parseFloat(this.heightOffset)
          )
        );
        this.points.push(p);

        //添加轨迹线
        if (this.line != null) {
          this.viewer.entities.remove(this.line);
        }
        if (this.points.length > 1) {
          this.line = this.viewer.entities.add({
            polyline: {
              show: true,
              positions: this.tmpPositions,
              material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.YELLOW,
              }),
              //material: Cesium.Color.YELLOW,
              width: 4,
            },
            show: false,
          });
        }
      }
    }
  }

  /**
   * 基于点，生成漫游路线，包含插值处理
   * @param {*} type  插值类型，1：直线段；2、微弯曲线；3、弧线
   * @param {*} count 总插值点数量
   * @param {*} pointArr 坐标集合数组，逗号隔开
   */
  createFlyLine(type, count, pointArr) {
    var lon, lat, height;
    for (let i = 0; i < pointArr.length; ) {
      lon = pointArr[i];
      lat = pointArr[i + 1];
      height = pointArr[i + 2];
      i += 3;

      //添加途径点到地图上
      var p = this.viewer.entities.add({
        id: this.uuid(8, 32),
        position: new Cesium.Cartesian3.fromDegrees(lon, lat, height),
        point: {
          pixelSize: 15, //点的大小
          color: Cesium.Color.RED, //点的颜色
          outlineWidth: 2, //边框宽度
          outlineColor: Cesium.Color.WHITE.withAlpha(0.4), //边框颜色
        },
        show: false,
      });

      this.tmpPositions.push(Cesium.Cartesian3.fromDegrees(lon, lat, height));
      this.points.push(p);
      //进行插值处理
      this.interpolation(type, count);
    }
  }

  /**
   * 第三人称的模型设置
   * @param {*} position
   * @param {*} hpr
   */
  setModel(position, hpr) {
    if (this.model == null) {
      var orientation = Cesium.Transforms.headingPitchRollQuaternion(
        position,
        hpr
      );

      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      this.model = this.viewer.entities.add({
        name: "飞机",
        position: position,
        orientation: orientation,
        model: {
          uri: "resources/img3D/Cesium_Air.glb",
          //不管缩放如何，模型的最小最小像素大小。
          minimumPixelSize: 64,
          //模型的最大比例尺大小。 minimumPixelSize的上限。
          maximumScale: 20000,
        },
        //viewFrom: Cesium.Cartesian3.fromDegrees(lon,lat,15000.0)
        viewFrom: new Cesium.Cartesian3(0, -300, 100),
      });
      this.viewer.trackedEntity = this.model;
    } else {
      //var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr, Cesium.Ellipsoid.WGS84);

      this.model.orientation = Cesium.Transforms.headingPitchRollQuaternion(
        position,
        hpr
      );
      this.model.position = position;
      this.viewer.trackedEntity = this.model;
    }
  }

  /**
   * 设定绘制轨迹操作
   */
  setLineTool(tool) {
    this.lineTool = tool;
    if (tool == "set") {
      if (this.line != null) {
        this.viewer.entities.remove(this.line);
      }
      this.points.forEach((point) => {
        this.viewer.entities.remove(point);
      });
      this.autoPoints.forEach((point) => {
        this.viewer.entities.remove(point);
      });
      this.tmpPositions = [];
      this.positions = [];
      this.points = [];
      this.autoPoints = [];
      this.line = null;
    }
  }

  /**
   * 计算两点间的偏航角
   * @param {*} viewPosition
   * @param {*} viewPositionEnd
   * @returns
   */
  getHeading(viewPosition, viewPositionEnd) {
    // 将笛卡尔坐标转换为经纬度坐标
    const cartographicPosition =
      Cesium.Cartographic.fromCartesian(viewPosition);
    const cartographicPositionEnd =
      Cesium.Cartographic.fromCartesian(viewPositionEnd); //this.points[0].position._value.x

    // var cartesian1 = new Cesium.Cartesian3(viewPosition.x, viewPosition.y, viewPosition.z);
    // var cartographicPosition = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian1);
    // var cartesian2 = new Cesium.Cartesian3(viewPositionEnd.x, viewPositionEnd.y, viewPositionEnd.z);
    // var cartographicPositionEnd = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian2);

    // 获取经纬度坐标中的经度和纬度
    const longitude1 = Cesium.Math.toDegrees(cartographicPosition.longitude);
    const latitude1 = Cesium.Math.toDegrees(cartographicPosition.latitude);
    const longitude2 = Cesium.Math.toDegrees(cartographicPositionEnd.longitude);
    const latitude2 = Cesium.Math.toDegrees(cartographicPositionEnd.latitude);

    // const longitude1 = viewPosition[0];
    // const latitude1 = viewPosition[1];
    // const longitude2 = viewPositionEnd[0];
    // const latitude2 = viewPositionEnd[1];

    // 计算方向角
    let heading = Math.atan2(longitude2 - longitude1, latitude2 - latitude1);
    heading = Cesium.Math.toDegrees(heading);

    // 将方向角限制在 0 到 360 度之间
    heading = (heading + 360) % 360;
    return heading;
  }

  /**
   * 计算两点间的俯仰角
   * @param {*} fromPosition
   * @param {*} toPosition
   * @returns
   */
  getPitch(fromPosition, toPosition) {
    // var position1 = new Cesium.Cartesian3.fromDegrees(fromPosition[0], fromPosition[1], fromPosition[2]);
    // var position2 = new Cesium.Cartesian3.fromDegrees(toPosition[0], toPosition[1], toPosition[2]);
    const finalPosition = new Cesium.Cartesian3();
    const matrix4 = Cesium.Transforms.eastNorthUpToFixedFrame(fromPosition);
    Cesium.Matrix4.inverse(matrix4, matrix4);
    Cesium.Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
    Cesium.Cartesian3.normalize(finalPosition, finalPosition);
    return Cesium.Math.toDegrees(Math.asin(finalPosition.z));
  }

  /**
   * 漫游前初始化相机位置，第一人称
   */
  setCameraView(viewType, index, fun) {
    this.lineTool = "pan";

    if (this.positions.length - 1 > index) {
      var heading = this.getHeading(
        this.positions[index],
        this.positions[index + 1]
      );
      //console.log(heading);

      var cPitch = parseInt(Cesium.Math.toDegrees(this.viewer.camera.pitch));
      var pitch = this.getPitch(
        this.positions[index],
        this.positions[index + 1]
      );
      var origin = this.positions[index];
      if (viewType == 1) {
        let options = {
          destination: origin,
          orientation: {
            heading: Cesium.Math.toRadians(heading), // 水平偏角，默认正北 0
            pitch: Cesium.Math.toRadians(pitch), // 俯视角，默认-90，垂直向下
            roll: 0, //旋转角
          },
        };
        this.viewer.camera.setView(options);

        this.viewer.scene.screenSpaceCameraController.enableTranslate = false; //2D和哥伦布视图,禁止左键拖动视角
        this.viewer.scene.screenSpaceCameraController.enableRotate = false; //禁止左键拖动视角
        this.viewer.scene.screenSpaceCameraController.enableZoom = false; //禁止中键控制视角缩放
        this.viewer.scene.screenSpaceCameraController.enableTilt = false; //禁止中键旋转视角
      } else if (viewType == 3) {
        var hpr = new Cesium.HeadingPitchRoll(
          Cesium.Math.toRadians(heading - 90),
          Cesium.Math.toRadians(pitch),
          0
        );
        this.setModel(origin, hpr);
        //  let options = {
        //     destination: origin,
        //     orientation: {
        //         heading: Cesium.Math.toRadians(heading), // 水平偏角，默认正北 0
        //         pitch: Cesium.Math.toRadians(pitch), // 俯视角，默认-90，垂直向下
        //         roll: 0, //旋转角
        //     },
        // };
        // this.viewer.camera.setView(options);
      }
    } else if (this.positions.length - 1 == index) {
      var heading = this.getHeading(
        this.positions[index - 1],
        this.positions[index]
      );
      //console.log(heading);
      var pitch = this.getPitch(
        this.positions[index - 1],
        this.positions[index]
      );
      var origin = this.positions[index];
      if (viewType == 1) {
        let options = {
          destination: origin,
          orientation: {
            heading: Cesium.Math.toRadians(heading), // 水平偏角，默认正北 0
            pitch: Cesium.Math.toRadians(pitch), // 俯视角，默认-90，垂直向下
            roll: 0, // 旋转角
          },
        };
        this.viewer.camera.setView(options);

        this.viewer.scene.screenSpaceCameraController.enableTranslate = false; //2D和哥伦布视图,禁止左键拖动视角
        this.viewer.scene.screenSpaceCameraController.enableRotate = false; //禁止左键拖动视角
        this.viewer.scene.screenSpaceCameraController.enableZoom = false; //禁止中键控制视角缩放
        this.viewer.scene.screenSpaceCameraController.enableTilt = false; //禁止中键旋转视角
      } else if (viewType == 3) {
        var hpr = new Cesium.HeadingPitchRoll(
          Cesium.Math.toRadians(heading - 90),
          Cesium.Math.toRadians(pitch),
          0
        );
        this.setModel(origin, hpr);
        // let options = {
        //     destination: origin,
        //     orientation: {
        //         heading: Cesium.Math.toRadians(heading), // 水平偏角，默认正北 0
        //         pitch: Cesium.Math.toRadians(pitch), // 俯视角，默认-90，垂直向下
        //         roll: 0, //旋转角
        //     },
        // };
        // this.viewer.camera.setView(options);
      }
    }
    if (index < this.positions.length) {
      for (let i = 0; i < this.tmpPositions.length; i++) {
        const p = this.tmpPositions[i];
        if (
          p.x == this.positions[index].x &&
          p.y == this.positions[index].y &&
          p.z == this.positions[index].z
        ) {
          if (this.executePoints.indexOf(i) == -1) {
            this.executePoints.push(i);
            if (fun != undefined && fun != null) {
              fun(i, p);
            }
          }
        }
      }
    }
  }

  /**
   * 对手动标绘的点进行插值处理
   * @param {*} type 插值类型
   * @param {*} count 总插值数量
   */
  interpolation(type, count) {
    if (this.tmpPositions.length > 1) {
      // HermiteSpline
      var times = [];
      var section = parseFloat(1 / (this.tmpPositions.length - 1));
      for (var i = 0; i < this.tmpPositions.length; i++) {
        times.push((section * i).toFixed(2));
      }

      var spline;
      //正常直线段
      if (type == 1) {
        spline = new Cesium.LinearSpline({
          times: times,
          points: this.tmpPositions,
        });
      }
      //微弯曲
      else if (type == 2) {
        spline = Cesium.HermiteSpline.createNaturalCubic({
          times: times,
          points: this.tmpPositions,
        });
      }
      //弧线
      else if (type == 3) {
        spline = new Cesium.CatmullRomSpline({
          times: times,
          points: this.tmpPositions,
        });
      }

      //如果已经生成过插值点，则清除掉
      this.autoPoints.forEach((point) => {
        this.viewer.entities.remove(point);
      });

      this.positions = [];
      this.autoPoints = [];
      for (var i = 0; i <= count; i++) {
        var cartesian3 = spline.evaluate(i / count);
        //console.log(i,cartesian3);
        this.positions.push(cartesian3);
        var p = this.viewer.entities.add({
          position: cartesian3,
          point: {
            color: Cesium.Color.YELLOW,
            pixelSize: 6,
          },
          show: false,
        });
        this.autoPoints.push(p);
      }

      if (this.line != null) {
        this.viewer.entities.remove(this.line);
      }
      this.line = this.viewer.entities.add({
        name: "LinearSpline",
        polyline: {
          positions: this.positions,
          width: 3,
          material: Cesium.Color.GREEN,
        },
        show: false,
      });
    }

    /**
     * 判定点在两点间的位置，左边，右边或中间
     * @param {*} A
     * @param {*} B
     * @param {*} P
     * @returns
     */
    function pointPosition(A, B, P) {
      var crossProduct = (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
      if (crossProduct > 0) {
        return "left";
      } else if (crossProduct < 0) {
        return "right";
      } else {
        return "on";
      }
    }

    function isFootWithinSegment(A, B, P) {
      var AB = { x: B.x - A.x, y: B.y - A.y };
      var AP = { x: P.x - A.x, y: P.y - A.y };
      var t = (AP.x * AB.x + AP.y * AB.y) / (AB.x * AB.x + AB.y * AB.y);
      // 计算点P到线段AB的垂足H
      var H = { x: A.x + t * AB.x, y: A.y + t * AB.y };
      var AH = { x: H.x - A.x, y: H.y - A.y };
      var BH = { x: H.x - B.x, y: H.y - B.y };

      var dotProductAH = AH.x * AB.x + AH.y * AB.y;
      var dotProductBH = BH.x * AB.x + BH.y * AB.y;

      var dotProductAB = AB.x * AB.x + AB.y * AB.y;

      // if(dotProductAH <= 0 && dotProductBH <= 0){
      //     console.log(true);
      // }
      // else{
      //     console.log(false);
      // }

      // 判断点H是否在线段AB的延长线上
      if (dotProductAB <= 0 || dotProductAH >= dotProductAB) {
        return false;
      }

      // 判断点H是否在线段AB之间
      var t = dotProductAH / dotProductAB;
      return t >= 0 && t <= 1;
    }
  }

  setSpeed(speed) {
    this.speed = speed;
    if (this.curState == "play") {
      if (this.intervalTimer != null) {
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
      }
      const that = this;
      that.curState = "play";
      this.intervalTimer = setInterval(function () {
        if (that.curPointIndex >= that.positions.length) {
          that.stopFly();
        }
        that.setCameraView(that.viewType, that.curPointIndex, that.fun);
        that.curPointIndex++;
      }, (1 / that.speed) * 100);
    }
  }

  /**
   * 根据路线开始漫游
   */
  startFly(viewType, fun) {
    this.executePoints = [];
    if (fun != undefined) this.fun = fun;
    this.viewType = viewType;
    this.points.forEach((p) => {
      p.show = false;
    });
    this.autoPoints.forEach((p) => {
      p.show = false;
    });
    this.line.show = false;
    this.setCameraView(viewType, 0, fun);
    this.curPointIndex = 0;
    if (this.intervalTimer != null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    const that = this;
    that.curState = "play";
    this.intervalTimer = setInterval(function () {
      if (that.curPointIndex >= that.positions.length) {
        that.stopFly();
      }
      that.setCameraView(viewType, that.curPointIndex, fun);
      that.curPointIndex++;
    }, (1 / that.speed) * 100);
  }
  /**
   * 停止漫游
   */
  stopFly() {
    this.fun = null;
    this.executePoints = [];
    this.viewer.trackedEntity = null;
    //this.curPointIndex = 0;
    if (this.intervalTimer != null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.curState = "stop";
    // this.points.forEach(p => {
    //     p.show = true;
    // });
    // this.autoPoints.forEach(p => {
    //     p.show = true;
    // });
    // this.line.show = true;

    this.viewer.scene.screenSpaceCameraController.enableTranslate = true; //2D和哥伦布视图,禁止左键拖动视角
    this.viewer.scene.screenSpaceCameraController.enableRotate = true; //禁止左键拖动视角
    this.viewer.scene.screenSpaceCameraController.enableZoom = true; //禁止中键控制视角缩放
    this.viewer.scene.screenSpaceCameraController.enableTilt = true; //禁止中键旋转视角
  }
  /**
   * 暂停
   */
  pauseFly() {
    if (this.intervalTimer != null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.curState = "pause";
  }
  /**
   * 继续
   */
  continueFly() {
    if (this.curState == "pause") {
      if (this.intervalTimer != null) {
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
      }
      const that = this;
      this.curState = "play";
      this.intervalTimer = setInterval(function () {
        if (that.curPointIndex >= that.positions.length) {
          that.stopFly();
        }
        that.setCameraView(that.viewType, that.curPointIndex, that.fun);
        that.curPointIndex++;
      }, (1 / that.speed) * 100);
    }
  }

  /**
   * 生成不重复的标识
   * @param {*} len
   * @param {*} radix
   * @returns
   */
  uuid(len, radix) {
    var chars =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(
        ""
      );
    var uuid = [],
      i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
      uuid[14] = "4";

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | (Math.random() * 16);
          uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join("");
  }
}

export default FlyRoam;
