import * as Cesium from "cesium";
import { createGatherPoint } from "./common.js";
import { xp } from "../../dependentLib/plotHelper/algorithm.js";
import { P } from "../../dependentLib/plotHelper/plotUtil.js";
import { fa } from "element-plus/es/locales.mjs";
export const militaryPlottingEdit = {
  //一次只能有一个修改事件
  militaryPlottingEditHandler: null,
  //军事修改点
  militaryPlottingEditPoints: [],
  /**
   * 结束军事标绘编辑的处理
   */
  endMilitaryPlottingEditDeal() {
    //鼠标变成默认
    document.getElementById(this.cesiumID).style.cursor = "default";
    //移除事件
    if (this.militaryPlottingEditHandler) {
      this.militaryPlottingEditHandler.destroy();
      this.militaryPlottingEditHandler = null;
    }
    //关闭鼠标提示
    this.closeMouseTip();
    //移除标注点
    for (var i = 0; i < this.militaryPlottingEditPoints.length; i++) {
      this.viewer.entities.remove(this.militaryPlottingEditPoints[i]);
    }
    this.militaryPlottingEditPoints = [];
  },
  /**
   * 关闭集结地采集
   * @param {*} entityObj
   * @returns
   */
  closeRendezvousEdit(entityObj) {
    entityObj.FFPosition = entityObj.polygon.hierarchy.getValue().positions;
    let lngLatHeightArr = this.cartesian3ArrToLngLatHeightArr(
      entityObj.FFPosition
    );
    entityObj.FFCoordinates = lngLatHeightArr;
    //结束处理
    this.endMilitaryPlottingEditDeal();
    return entityObj;
  },

  /**
   * 集结地进入编辑
   * @param {*} entityObj
   * @param {*} callback
   */
  rendezvousEdit(entityObj, callback) {
    this.openMouseTip("压住编辑点移动，右击即可完成采集");
    document.getElementById(this.cesiumID).style.cursor = "pointer";
    let the = this;
    let isMoving = false;
    let pickedAnchor = null;
    let gatherPosition = this.LngLatHeightArrToCartesian3Arr(
      entityObj.FFPlotKeyPoints
    );
    for (var i = 0; i < gatherPosition.length; i++) {
      let pointTemp = createGatherPoint(gatherPosition[i], this.viewer);
      pointTemp.oid = i;
      pointTemp.flag = "anchor";
      the.militaryPlottingEditPoints.push(pointTemp);
    }
    //添加事件
    this.militaryPlottingEditHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    );
    //点击事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      var position = event.position;
      if (!Cesium.defined(position)) {
        return;
      }
      var ray = the.viewer.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (isMoving) {
        isMoving = false;
        pickedAnchor.position.setValue(cartesian);
        var oid = pickedAnchor.oid;
        gatherPosition[oid] = cartesian;
      } else {
        var pickedObject = the.viewer.scene.pick(position);
        if (!Cesium.defined(pickedObject)) {
          return;
        }
        if (!Cesium.defined(pickedObject.id)) {
          return;
        }
        var entity = pickedObject.id;
        //console.log("entity",entity);
        //如果点击的不是点；则返回
        if (entity.flag != "anchor") {
          return;
        }
        pickedAnchor = entity;
        isMoving = true;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    // 对鼠标抬起事件的监听
    this.militaryPlottingEditHandler.setInputAction((event) => {
      pickedAnchor = null;
      isMoving = false;
      the.viewer.scene.screenSpaceCameraController.enableRotate = true;
      the.viewer.scene.screenSpaceCameraController.enableZoom = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    //移动事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      if (!isMoving || !pickedAnchor) {
        return;
      }
      the.viewer.scene.screenSpaceCameraController.enableRotate = false;
      the.viewer.scene.screenSpaceCameraController.enableZoom = false;

      var position = event.endPosition;
      if (!Cesium.defined(position)) {
        return;
      }

      var ray = the.viewer.scene.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      pickedAnchor.position.setValue(cartesian);
      var oid = pickedAnchor.oid;
      gatherPosition[oid] = cartesian;
      entityObj.FFPlotKeyPoints =
        the.cartesian3ArrToLngLatHeightArr(gatherPosition);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    //右击事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      // entityObj.FFPlotKeyPoints =
      //   the.cartesian3ArrToLngLatHeightArr(gatherPosition);
      //关闭编辑
      the.closeDoubleArrowEdit(entityObj);
      callback(entityObj);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    //重绘
    entityObj.polygon.hierarchy = new Cesium.CallbackProperty(function () {
      if (gatherPosition.length > 2) {
        var res = the.fineGatheringPlace(gatherPosition);
        if (res == null || res.length < 3) {
          return null;
        }
        var pHierarchy = new Cesium.PolygonHierarchy(res);
        return pHierarchy;
      } else {
        return null;
      }
    }, false);
  },
  /**
   * 添加集结地
   * @param {*} lnglatArr
   * @param {*} option
   */
  addRendezvousEntity(lnglatArr, option) {
    var res = this.fineGatheringPlace(
      this.LngLatHeightArrToCartesian3Arr(lnglatArr)
    );
    var pHierarchy = new Cesium.PolygonHierarchy(res);
    var bData = {
      polygon: new Cesium.PolygonGraphics({
        hierarchy: pHierarchy,
        material: Cesium.Color.fromCssColorString(option.color).withAlpha(
          option.alpha
        ),
        show: true,
      }),
    };
    let rendezvousEntity = this.viewer.entities.add(bData);
    this.setAttributeForEntity(rendezvousEntity, option, "straightArrow");
    rendezvousEntity.FFPlotKeyPoints = lnglatArr;
    return rendezvousEntity;
  },

  /**
   * 关闭双箭头编辑
   * @param {*} entityObj
   * @returns
   */
  closeDoubleArrowEdit(entityObj) {
    entityObj.FFPosition = entityObj.polygon.hierarchy.getValue().positions;
    let lngLatHeightArr = this.cartesian3ArrToLngLatHeightArr(
      entityObj.FFPosition
    );
    entityObj.FFCoordinates = lngLatHeightArr;
    //结束处理
    this.endMilitaryPlottingEditDeal();
    return entityObj;
  },
  /**
   * 双击箭头进入编辑
   * @param {*} entityObj
   */
  doubleArrowEdit(entityObj, callback) {
    this.openMouseTip("压住编辑点移动，右击即可完成采集");
    document.getElementById(this.cesiumID).style.cursor = "pointer";

    let the = this;
    let isMoving = false;
    let pickedAnchor = null;
    let gatherPosition = this.LngLatHeightArrToCartesian3Arr(
      entityObj.FFPlotKeyPoints
    );
    for (var i = 0; i < gatherPosition.length; i++) {
      let pointTemp = createGatherPoint(gatherPosition[i], this.viewer);
      pointTemp.oid = i;
      pointTemp.flag = "anchor";
      the.militaryPlottingEditPoints.push(pointTemp);
    }
    //添加事件
    this.militaryPlottingEditHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    );
    //点击事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      var position = event.position;
      if (!Cesium.defined(position)) {
        return;
      }
      var ray = the.viewer.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (isMoving) {
        isMoving = false;
        pickedAnchor.position.setValue(cartesian);
        var oid = pickedAnchor.oid;
        gatherPosition[oid] = cartesian;
      } else {
        var pickedObject = the.viewer.scene.pick(position);
        if (!Cesium.defined(pickedObject)) {
          return;
        }
        if (!Cesium.defined(pickedObject.id)) {
          return;
        }
        var entity = pickedObject.id;
        //console.log("entity",entity);
        //如果点击的不是点；则返回
        if (entity.flag != "anchor") {
          return;
        }
        pickedAnchor = entity;
        isMoving = true;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    // 对鼠标抬起事件的监听
    this.militaryPlottingEditHandler.setInputAction((event) => {
      pickedAnchor = null;
      isMoving = false;
      the.viewer.scene.screenSpaceCameraController.enableRotate = true;
      the.viewer.scene.screenSpaceCameraController.enableZoom = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    //移动事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      if (!isMoving || !pickedAnchor) {
        return;
      }
      the.viewer.scene.screenSpaceCameraController.enableRotate = false;
      the.viewer.scene.screenSpaceCameraController.enableZoom = false;
      var position = event.endPosition;
      if (!Cesium.defined(position)) {
        return;
      }

      var ray = the.viewer.scene.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      pickedAnchor.position.setValue(cartesian);
      var oid = pickedAnchor.oid;
      gatherPosition[oid] = cartesian;
      entityObj.FFPlotKeyPoints =
        the.cartesian3ArrToLngLatHeightArr(gatherPosition);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    //右击事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      // entityObj.FFPlotKeyPoints =
      //   the.cartesian3ArrToLngLatHeightArr(gatherPosition);
      //关闭编辑
      the.closeDoubleArrowEdit(entityObj);
      callback(entityObj);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    //重绘
    entityObj.polygon.hierarchy = new Cesium.CallbackProperty(function () {
      if (gatherPosition.length > 2) {
        try {
          var lonLats = the.cartesian3ArrToLngLatHeightArr(gatherPosition);
          //去重
          the.coordinateArrDeduplication(lonLats);
          var doubleArrow = xp.algorithm.doubleArrow(lonLats);
          var positions = doubleArrow.polygonalPoint;
          if (!Cesium.defined(positions)) {
            return null;
          }
          if (positions == null || positions.length < 3) {
            return null;
          }
          var pHierarchy = new Cesium.PolygonHierarchy(positions);
          pHierarchy.keyPoints = lonLats;
          return pHierarchy;
        } catch (err) {
          return null;
        }
      } else {
        return null;
      }
    }, false);
  },
  /**
   * 叠加双箭头
   * @param {*} lnglatArr
   * @param {*} option
   * @returns
   */
  addDoubleArrowEntity(lnglatArr, option) {
    var attackObj = xp.algorithm.doubleArrow(lnglatArr);
    console.log("attackObj", attackObj);
    var arrow = attackObj.polygonalPoint;
    console.log("根据箭头关键点获取箭头数据：", arrow);
    var pHierarchy = new Cesium.PolygonHierarchy(arrow);
    //闭合虚线
    var firstPoint = arrow[0];
    arrow.push(firstPoint);
    var bData = {
      polygon: new Cesium.PolygonGraphics({
        hierarchy: pHierarchy,
        material: Cesium.Color.fromCssColorString(option.color).withAlpha(
          option.alpha
        ),
        show: true,
      }),
    };
    let doubleArrowEntity = this.viewer.entities.add(bData);
    this.setAttributeForEntity(doubleArrowEntity, option, "straightArrow");
    //获取直线箭头关键坐标数据
    doubleArrowEntity.FFPlotKeyPoints = lnglatArr;
    return doubleArrowEntity;
  },

  /**
   * 关闭攻击箭头修改
   * @param {*} entityObj
   * @returns
   */
  closeTailedAttackArrowEdit(entityObj) {
    entityObj.FFPosition = entityObj.polygon.hierarchy.getValue().positions;
    let lngLatHeightArr = this.cartesian3ArrToLngLatHeightArr(
      entityObj.FFPosition
    );
    entityObj.FFCoordinates = lngLatHeightArr;
    //结束处理
    this.endMilitaryPlottingEditDeal();
    return entityObj;
  },

  /**
   * 攻击箭头进入修改
   * @param {*} entityObj
   * @param {*} callback
   */
  tailedAttackArrowEdit(entityObj, callback) {
    this.openMouseTip("压住编辑点移动，右击即可完成采集");
    document.getElementById(this.cesiumID).style.cursor = "pointer";

    let the = this;
    let isMoving = false;
    let pickedAnchor = null;
    let gatherPosition = this.LngLatHeightArrToCartesian3Arr(
      entityObj.FFPlotKeyPoints
    );
    for (var i = 0; i < gatherPosition.length; i++) {
      let pointTemp = createGatherPoint(gatherPosition[i], this.viewer);
      pointTemp.oid = i;
      pointTemp.flag = "anchor";
      the.militaryPlottingEditPoints.push(pointTemp);
    }
    //添加事件
    this.militaryPlottingEditHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    );
    //点击事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      var position = event.position;
      if (!Cesium.defined(position)) {
        return;
      }
      var ray = the.viewer.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (isMoving) {
        isMoving = false;
        pickedAnchor.position.setValue(cartesian);
        var oid = pickedAnchor.oid;
        gatherPosition[oid] = cartesian;
      } else {
        var pickedObject = the.viewer.scene.pick(position);
        if (!Cesium.defined(pickedObject)) {
          return;
        }
        if (!Cesium.defined(pickedObject.id)) {
          return;
        }
        var entity = pickedObject.id;
        //console.log("entity",entity);
        //如果点击的不是点；则返回
        if (entity.flag != "anchor") {
          return;
        }
        pickedAnchor = entity;
        isMoving = true;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    // 对鼠标抬起事件的监听
    this.militaryPlottingEditHandler.setInputAction((event) => {
      pickedAnchor = null;
      isMoving = false;
      the.viewer.scene.screenSpaceCameraController.enableRotate = true;
      the.viewer.scene.screenSpaceCameraController.enableZoom = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    //移动事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      if (!isMoving || !pickedAnchor) {
        return;
      }
      the.viewer.scene.screenSpaceCameraController.enableRotate = false;
      the.viewer.scene.screenSpaceCameraController.enableZoom = false;
      var position = event.endPosition;
      if (!Cesium.defined(position)) {
        return;
      }

      var ray = the.viewer.scene.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      pickedAnchor.position.setValue(cartesian);
      var oid = pickedAnchor.oid;
      gatherPosition[oid] = cartesian;
      entityObj.FFPlotKeyPoints =
        the.cartesian3ArrToLngLatHeightArr(gatherPosition);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    //右击事件
    this.militaryPlottingEditHandler.setInputAction(function (event) {
      // entityObj.FFPlotKeyPoints =
      //   the.cartesian3ArrToLngLatHeightArr(gatherPosition);
      //关闭编辑
      the.closeTailedAttackArrowEdit(entityObj);
      callback(entityObj);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    //重绘
    entityObj.polygon.hierarchy = new Cesium.CallbackProperty(function () {
      if (gatherPosition.length > 1) {
        var lonLats = the.cartesian3ArrToLngLatHeightArr(gatherPosition);
        //console.log("lonLats", lonLats);
        var tailedAttackArrowTemp = xp.algorithm.tailedAttackArrow(lonLats);
        //console.log("tailedAttackArrowTemp", tailedAttackArrowTemp);
        var positions = tailedAttackArrowTemp.polygonalPoint;
        if (positions == null || positions.length < 3) {
          return null;
        }
        var pHierarchy = new Cesium.PolygonHierarchy(positions);
        pHierarchy.keyPoints = lonLats;
        return pHierarchy;
      } else {
        return null;
      }
    }, false);
  },
  /**
   * 添加攻击箭头
   * @param {*} lnglatArr
   * @param {*} option
   * @returns
   */
  addTailedAttackArrow(lnglatArr, option) {
    var attackObj = xp.algorithm.tailedAttackArrow(lnglatArr);
    var arrow = attackObj.polygonalPoint;
    console.log("attackObj:", attackObj);
    console.log("根据箭头关键点获取箭头数据：", arrow);
    var pHierarchy = new Cesium.PolygonHierarchy(arrow);
    var bData = {
      polygon: new Cesium.PolygonGraphics({
        hierarchy: pHierarchy,
        material: Cesium.Color.fromCssColorString(option.color).withAlpha(
          option.alpha
        ),
        show: true,
      }),
    };
    let tailedAttackArrowEntity = this.viewer.entities.add(bData);
    var keyPointArr = [];
    for (var i = 0; i < attackObj.controlPoint.length; i++) {
      var obj = Cesium.Cartesian3.fromDegrees(
        attackObj.controlPoint[i][0],
        attackObj.controlPoint[i][1]
      );
      keyPointArr.push(obj);
    }
    tailedAttackArrowEntity.keyPoints = keyPointArr;
    this.setAttributeForEntity(
      tailedAttackArrowEntity,
      option,
      "tailedAttackArrow"
    );
    //获取直线箭头关键坐标数据
    tailedAttackArrowEntity.FFPlotKeyPoints = lnglatArr;
    return tailedAttackArrowEntity;
  },

  /**
   * 叠加直线箭头的标绘
   * @param {*} lnglatArr
   * @param {*} option
   * @returns
   */
  addStraightArrowEntity(lnglatArr, option) {
    var arrow = xp.algorithm.fineArrow(lnglatArr[0], lnglatArr[1]);
    console.log("根据箭头关键点获取箭头数据：", arrow);
    var pHierarchy = new Cesium.PolygonHierarchy(arrow);
    var bData = {
      polygon: new Cesium.PolygonGraphics({
        hierarchy: pHierarchy,
        material: Cesium.Color.fromCssColorString(option.color).withAlpha(
          option.alpha
        ),
        show: true,
      }),
    };
    let straightArrowEntity = this.viewer.entities.add(bData);
    this.setAttributeForEntity(straightArrowEntity, option, "straightArrow");
    //获取直线箭头关键坐标数据
    straightArrowEntity.FFPlotKeyPoints = lnglatArr;
    return straightArrowEntity;
  },
  /**
   * 关闭直线箭头修改
   * @param {*} entityObj
   * @returns
   */
  closeStraightArrowEdit(entityObj) {
    entityObj.FFPosition = entityObj.polygon.hierarchy.getValue().positions;
    let lngLatHeightArr = this.cartesian3ArrToLngLatHeightArr(
      entityObj.FFPosition
    );
    entityObj.FFCoordinates = lngLatHeightArr;
    //结束处理
    this.endMilitaryPlottingEditDeal();
    return entityObj;
  },
  /**
   * 直线箭头修改
   * @param {*} entityObj
   * @param {*} callback
   */
  straightArrowEdit(entityObj, callback) {
    this.openMouseTip("压住编辑点移动，右击即可完成采集");
    document.getElementById(this.cesiumID).style.cursor = "pointer";

    let the = this;
    let isMoving = false;
    let pickedAnchor = null;
    let gatherPosition = this.LngLatHeightArrToCartesian3Arr(
      entityObj.FFPlotKeyPoints
    );
    for (var i = 0; i < gatherPosition.length; i++) {
      let pointTemp = createGatherPoint(gatherPosition[i], this.viewer);
      pointTemp.oid = i;
      pointTemp.flag = "anchor";
      the.militaryPlottingEditPoints.push(pointTemp);
    }
    //添加事件
    this.militaryPlottingEditHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    );

    this.militaryPlottingEditHandler.setInputAction(function (event) {
      var position = event.position;
      if (!Cesium.defined(position)) {
        return;
      }
      var ray = the.viewer.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (isMoving) {
        isMoving = false;
        pickedAnchor.position.setValue(cartesian);
        var oid = pickedAnchor.oid;
        gatherPosition[oid] = cartesian;
      } else {
        var pickedObject = the.viewer.scene.pick(position);
        if (!Cesium.defined(pickedObject)) {
          return;
        }
        if (!Cesium.defined(pickedObject.id)) {
          return;
        }
        var entity = pickedObject.id;
        //console.log("entity",entity);
        //如果点击的不是点；则返回
        if (entity.flag != "anchor") {
          return;
        }
        pickedAnchor = entity;
        isMoving = true;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 对鼠标抬起事件的监听
    this.militaryPlottingEditHandler.setInputAction((event) => {
      pickedAnchor = null;
      isMoving = false;
      the.viewer.scene.screenSpaceCameraController.enableRotate = true;
      the.viewer.scene.screenSpaceCameraController.enableZoom = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    this.militaryPlottingEditHandler.setInputAction(function (event) {
      if (!isMoving || !pickedAnchor) {
        return;
      }
      the.viewer.scene.screenSpaceCameraController.enableRotate = false;
      the.viewer.scene.screenSpaceCameraController.enableZoom = false;
      var position = event.endPosition;
      if (!Cesium.defined(position)) {
        return;
      }

      var ray = the.viewer.scene.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      var cartesian = the.viewer.scene.globe.pick(ray, the.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      pickedAnchor.position.setValue(cartesian);
      var oid = pickedAnchor.oid;
      gatherPosition[oid] = cartesian;
      entityObj.FFPlotKeyPoints =
        the.cartesian3ArrToLngLatHeightArr(gatherPosition);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.militaryPlottingEditHandler.setInputAction(function (event) {
      //关闭编辑
      the.closeStraightArrowEdit(entityObj);
      callback(entityObj);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    //重绘
    entityObj.polygon.hierarchy = new Cesium.CallbackProperty(function () {
      if (gatherPosition.length > 1) {
        var p1 = gatherPosition[0];
        var p2 = gatherPosition[1];
        if (the.isSimpleXYZ(p1, p2)) {
          return null;
        }
        var firstPoint = the.positionToLngLatHeight(p1);
        var endPoints = the.positionToLngLatHeight(p2);
        var arrow = xp.algorithm.fineArrow(
          [firstPoint[0], firstPoint[1]],
          [endPoints[0], endPoints[1]]
        );
        var pHierarchy = new Cesium.PolygonHierarchy(arrow);
        pHierarchy.keyPoints = [firstPoint, endPoints];
        return pHierarchy;
      } else {
        return null;
      }
    }, false);
  },
};
