import * as Cesium from "cesium";
import * as turf from "@turf/turf";

export const mapUtil = {
  /**
   * 获取当前相机中心点
   * @param {*} ffCesium
   */
  getCenterPosition(ffCesium) {
    let viewer = ffCesium.viewer;
    let centerResult = viewer.camera.pickEllipsoid(
      new ffCesium.Cesium.Cartesian2(
        viewer.canvas.clientWidth / 2,
        viewer.canvas.clientHeight / 2
      )
    );
    if (centerResult) {
      let curPosition =
        ffCesium.Cesium.Ellipsoid.WGS84.cartesianToCartographic(centerResult);
      let curLongitude = (curPosition.longitude * 180) / Math.PI;
      let curLatitude = (curPosition.latitude * 180) / Math.PI;
      return {
        lon: curLongitude,
        lat: curLatitude,
      };
    } else {
      return null;
    }
  },
  /**
   * 获取某个点的地形高度
   * 输入：[118,24]
   * 输出：100.0
   * @param {*} LngLat
   * @returns
   */
  async getHeightAtPoint(LngLat) {
    let cartographics = [Cesium.Cartographic.fromDegrees(LngLat[0], LngLat[1])];
    console.log("getHeightAtPoint--cartographics", cartographics);

    try {
      const updatedPositions = await Cesium.sampleTerrain(
        this.viewer.terrainProvider,
        11,
        cartographics,
        true
      );
      console.log("updatedPositions23232", updatedPositions);
      let height = updatedPositions[0].height;
      return height;
    } catch (error) {
      // A tile request error occurred.
    }
  },

  /**
   * 获取线的中心点（线上）
   * 输入：[[118,24][118,24][118,24]]
   * 输出：[118,24]
   * @param {*} LngLatArr
   * @returns
   */
  getCenterPointByPolyline(LngLatArr) {
    var line = turf.lineString(LngLatArr);
    var lineLength = turf.length(line, { units: "meters" });
    let chunk = turf.lineChunk(line, lineLength / 2, { units: "meters" });
    let chunkLength = chunk.features[0].geometry.coordinates.length - 1;
    let centerPoint = chunk.features[0].geometry.coordinates[chunkLength];
    return centerPoint;
  },
  /**
   * 计算长度
   * option:{
   *    type:'polygon',
   *    LngLatArr:[[118,24][118,24][118,24]]
   * }
   *
   * @param {*} LngLatHeightArr
   * @returns
   */
  countlength(option) {
    console.log("countlength--option", option);
    let returnLength = 0;
    if (option.type == "polygon") {
      var line = turf.lineString(option.LngLatArr);
      returnLength = turf.length(line, { units: "kilometers" }) * 1000;
    } else if (option.type == "rectangle") {
      let LngLatArr = this.rectangleCoordinateToPolygonCoordinate(
        option.LngLat.east,
        option.LngLat.west,
        option.LngLat.south,
        option.LngLat.north
      );
      var line = turf.lineString(LngLatArr);
      returnLength = turf.length(line, { units: "kilometers" }) * 1000;
    } else if (option.type == "circle") {
      returnLength = 2 * Math.PI * option.radius;
    } else if (option.type == "polyline") {
      var line = turf.lineString(option.LngLatArr);
      returnLength = turf.length(line, { units: "kilometers" }) * 1000;
    }
    returnLength = returnLength.toFixed(2);
    return returnLength;
  },
  /**
   * 计算面积
   * option:{
   *    type:'polygon',
   *    LngLatArr:[[118,24][118,24][118,24]]
   * }
   *
   * @param {*} LngLatHeightArr
   * @returns
   */
  countArea(option) {
    let area = 0;
    if (option.type == "polygon") {
      let LngLatArr = option.LngLatArr;
      let lastIndex = LngLatArr.length - 1;
      if (
        LngLatArr[0][0] != LngLatArr[lastIndex][0] &&
        LngLatArr[0][1] !== LngLatArr[lastIndex][1]
      ) {
        LngLatArr.push(LngLatArr[0]);
      }
      var polygon = turf.polygon([LngLatArr]);
      area = turf.area(polygon);
    } else if (option.type == "rectangle") {
      let LngLatArr = this.rectangleCoordinateToPolygonCoordinate(
        option.LngLat.east,
        option.LngLat.west,
        option.LngLat.south,
        option.LngLat.north
      );
      var polygon = turf.polygon([LngLatArr]);
      area = turf.area(polygon);
    } else if (option.type == "circle") {
      area = Math.PI * option.radius * option.radius;
    }
    area = area.toFixed(2);
    return area;
  },
  /**
   * 矩形坐标转面坐标
   * 输入：118，117，24，25
   * 输出：[[118,24][118,24][118,24]]
   * @param {*} east
   * @param {*} west
   * @param {*} south
   * @param {*} north
   * @returns
   */
  rectangleCoordinateToPolygonCoordinate(east, west, south, north) {
    let polygonCoordinate = [];
    polygonCoordinate.push([west, north]);
    polygonCoordinate.push([west, south]);
    polygonCoordinate.push([east, south]);
    polygonCoordinate.push([east, north]);
    polygonCoordinate.push([west, north]);
    return polygonCoordinate;
  },
  /**
   * 带有高度的坐标转成没有高度的坐标
   * 输入：[118,24,10]
   * 输出：[118,24]
   * @param {*} LngLatHeightArr
   * @returns
   */
  getLngLatFromLngLatHeight(LngLatHeight) {
    let lngLatArr = [LngLatHeight[0], LngLatHeight[1]];
    return lngLatArr;
  },
  /**
   * 带有高度的坐标数组转成没有高度的坐标数组
   * 输入：[[118,24,10][118,24,10][118,24,10]]
   * 输出：[[118,24][118,24][118,24]]
   * @param {*} LngLatHeightArr
   * @returns
   */
  getLngLatArrFromLngLatHeightArr(LngLatHeightArr) {
    let lngLatArr = [];
    LngLatHeightArr.forEach((item) => {
      let arrTemp = [item[0], item[1]];
      lngLatArr.push(arrTemp);
    });
    return lngLatArr;
  },
  /**
   * 从经纬度数组计算出中心点
   * 输入：[[118,24][118,24][118,24]]
   * 输出：[118,24]
   * @param {*} LngLatArr
   * @returns
   */
  getCenterPointFromLngLatArr(LngLatArr) {
    console.log("LngLatArr", LngLatArr);
    let lastIndex = LngLatArr.length - 1;
    if (
      LngLatArr[0][0] != LngLatArr[lastIndex][0] &&
      LngLatArr[0][1] !== LngLatArr[lastIndex][1]
    ) {
      LngLatArr.push(LngLatArr[0]);
    }

    var polygon = turf.polygon([LngLatArr]);
    // 使用turf.center获取多边形的中心点
    var centerPoint = turf.center(polygon);
    // 输出中心点的坐标
    return centerPoint.geometry.coordinates;
  },
  /**
   * 坐标高度数组 转换 坐标数组
   * 输入：[[118.11,24.11,0],[118.11,24.11,0],[118.11,24.11,0],[118.11,24.11,0]]
   * 输出：[[118.11,24.11],[118.11,24.11],[118.11,24.11],[118.11,24.11]]
   * @param {*} LngLatHeightArr
   * @returns
   */
  getLngLatArrFromLngLatHeightArr(LngLatHeightArr) {
    let lngLatArr = [];
    LngLatHeightArr.forEach((element) => {
      let arrTemp = [];
      arrTemp.push(element[0]);
      arrTemp.push(element[1]);
      lngLatArr.push(arrTemp);
    });
    return lngLatArr;
  },

  /**
   * 世界坐标数组转换坐标数组
   * 输入：[Cartesian3,Cartesian3,Cartesian3,Cartesian3]
   * 输出：[[118.11,24.11,0],[118.11,24.11,0],[118.11,24.11,0],[118.11,24.11,0]]
   * @param {*} cartesian3Arr
   * @returns
   */
  cartesian3ArrToLngLatHeightArr(cartesian3Arr) {
    var lngLatHeightArr = [];
    for (var i = 0; i < cartesian3Arr.length; i++) {
      var ellipsoid = this.viewer.scene.globe.ellipsoid;
      var cartesian3 = new Cesium.Cartesian3(
        cartesian3Arr[i].x,
        cartesian3Arr[i].y,
        cartesian3Arr[i].z
      );
      var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
      var arr = [];
      arr.push(Cesium.Math.toDegrees(cartographic.longitude));
      arr.push(Cesium.Math.toDegrees(cartographic.latitude));
      arr.push(cartographic.height);
      lngLatHeightArr.push(arr);
    }
    return lngLatHeightArr;
  },
  /**
   * 坐标数组转换世界坐标数组
   * 输入：[[118.11,24.11,0],[118.11,24.11,0],[118.11,24.11,0],[118.11,24.11,0]]
   * 输出：[Cartesian3,Cartesian3,Cartesian3,Cartesian3]
   * @param {*} positions
   * @returns
   */
  LngLatHeightArrToCartesian3Arr(lngLatHeightArr) {
    let cartesian3Arr = [];
    lngLatHeightArr.forEach((item) => {
      if (!item[2]) {
        item[2] = 0;
      }
      let cartesian3Temp = Cesium.Cartesian3.fromDegrees(
        item[0],
        item[1],
        item[2]
      );
      cartesian3Arr.push(cartesian3Temp);
    });
    return cartesian3Arr;
  },
  /**
   * 世界坐标转换经纬度坐标
   * 输入：Cartesian3
   * 输出：[118.11,24.11,0]
   * @param {*} position
   * @returns
   */
  positionToLngLatHeight(position) {
    let ellipsoid = this.viewer.scene.globe.ellipsoid;
    let cartographic = ellipsoid.cartesianToCartographic(position);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let lng = Cesium.Math.toDegrees(cartographic.longitude);
    let height = cartographic.height;
    return [lng, lat, height];
  },
  /**
   * 判断cartesian是不是同一个点。
   * @param {*} p1
   * @param {*} p2
   * @returns
   */
  isSimpleXYZ(p1, p2) {
    if (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z) {
      return true;
    }
    return false;
  },
  /**
   * 坐标去重
   * @param {*} lngLatArr
   * @returns
   */
  coordinateArrDeduplication(lngLatArr) {
    if (!lngLatArr || lngLatArr.length < 2) {
      return;
    }
    for (var i = 1; i < lngLatArr.length; i++) {
      var p1 = lngLatArr[i - 1];
      var p2 = lngLatArr[i];
      if (p2[0] == p1[0] && p2[1] == p1[1]) {
        lngLatArr.splice(i, 1);
        i--;
      }
    }
  },
  /**
   * 设置属性
   * @param {*} entity
   * @param {*} option
   * @param {*} type
   */
  setAttributeForEntity(entity, option, type) {
    console.log("设置属性：setAttributeForEntity", entity);
    if (type == "point") {
      let positionTemp = entity.position.getValue(Cesium.JulianDate.now());
      let FFCoordinates = this.positionToLngLatHeight(positionTemp);
      entity.FFType = "FFPointEntity";
      entity.FFOption = option;
      entity.FFCoordinates = FFCoordinates;
      entity.FFPosition = positionTemp;
    }
    if (type == "billboard") {
      let positionTemp = entity.position.getValue(Cesium.JulianDate.now());
      let FFCoordinates = this.positionToLngLatHeight(positionTemp);
      entity.FFType = "FFBillboardEntity";
      entity.FFOption = option;
      entity.FFCoordinates = FFCoordinates;
      entity.FFPosition = positionTemp;
    }
    if (type == "polyline") {
      let positionsTemp = entity.polyline.positions.getValue();
      let FFCoordinates = this.cartesian3ArrToLngLatHeightArr(positionsTemp);
      entity.FFType = "FFPolylineEntity";
      entity.FFOption = option;
      entity.FFCoordinates = FFCoordinates;
      entity.FFPosition = positionsTemp;
    }
    if (type == "polygon") {
      let positionsTemp = entity.polygon.hierarchy.getValue().positions;
      let FFCoordinates = this.cartesian3ArrToLngLatHeightArr(positionsTemp);
      entity.FFType = "FFPolygonEntity";
      entity.FFOption = option;
      entity.FFCoordinates = FFCoordinates;
      entity.FFPosition = positionsTemp;
    }
    if (type == "rectangle") {
      let positionsTemp = entity.rectangle.coordinates.getValue();
      let FFCoordinates = {};
      FFCoordinates.east = Cesium.Math.toDegrees(positionsTemp.east);
      FFCoordinates.west = Cesium.Math.toDegrees(positionsTemp.west);
      FFCoordinates.north = Cesium.Math.toDegrees(positionsTemp.north);
      FFCoordinates.south = Cesium.Math.toDegrees(positionsTemp.south);
      entity.FFType = "FFRectangleEntity";
      entity.FFOption = option;
      entity.FFCoordinates = FFCoordinates;
      entity.FFPosition = positionsTemp;
      FFCoordinates;
    }
    if (type == "circle") {
      let positionTemp = entity.position.getValue(Cesium.JulianDate.now());
      entity.FFOption = option;
      entity.FFType = "FFCircleEntity";
      entity.FFCenterPoint = this.positionToLngLatHeight(positionTemp);
      entity.FFRadius = entity.ellipse.semiMinorAxis.getValue();
      entity.FFPosition = positionTemp;
    }

    if (
      type == "FFStraightArrowEntity" ||
      type == "FFTailedAttackArrowEntity" ||
      type == "FFDoubleArrowEntity" ||
      type == "FFRendezvousEntity"
    ) {
      let positionsTemp = entity.polygon.hierarchy.getValue().positions;
      let FFCoordinates = this.cartesian3ArrToLngLatHeightArr(positionsTemp);
      entity.FFType = type;
      entity.FFOption = option;
      entity.FFCoordinates = FFCoordinates;
      entity.FFPosition = positionsTemp;
    }
  },
};
