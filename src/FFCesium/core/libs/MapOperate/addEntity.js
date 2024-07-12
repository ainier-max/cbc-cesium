import * as Cesium from 'cesium';

export const addEntity = {
  /**
   * 移除所给实体数据
   * @param {*} FFEntity
   */
  removeFFEntity(FFEntity) {
    this.viewer.entities.remove(FFEntity);
  },
  /**
   * 移除所给实体数据
   * @param {*} FFEntityArr
   */
  removeFFEntityArr(FFEntityArr) {
    FFEntityArr.forEach(element => {
      this.viewer.entities.remove(element);
    });
  },
  /**
   * 根据ID值移除所给实体数据
   * @param {*} FFEntityArr
   */
  removeFFEntityID(FFEntityID) {
    this.viewer.entities.removeById(FFEntityID);
  },
  /**
   * 根据ID值移除所给实体数据
   * @param {*} FFEntityArr
   */
  removeFFEntityIDArr(FFEntityIDArr) {
    FFEntityIDArr.forEach(element => {
      this.viewer.entities.removeById(element);
    });
  },
  /**
   * 叠加圆实体
   * @param {*} centerPoint
   * @param {*} radius
   * @param {*} option
   * @returns
   */
  addCircleEntity(centerPoint, radius, option) {
    let newOption = Object.assign({}, option);
    newOption.semiMinorAxis = radius;
    newOption.semiMajorAxis = radius;
    newOption.material = new Cesium.Color.fromCssColorString(newOption.color).withAlpha(newOption.alpha);
    let positionTemp = Cesium.Cartesian3.fromDegrees(centerPoint[0], centerPoint[1], centerPoint[2]);

    let circleConfig = {
      position: positionTemp,
      ellipse: {
        ...newOption
      }
    };
    if (newOption.id) {
      circleConfig.id = newOption.id;
    }
    let circleEntity = this.viewer.entities.add(circleConfig);
    circleEntity.FFOption = option;
    circleEntity.FFType = 'FFCircleEntity';
    circleEntity.FFCenterPoint = centerPoint;
    circleEntity.FFRadius = radius;
    circleEntity.FFPosition = positionTemp;
    return circleEntity;
  },

  /**
   * 添加点实体
   * @param {*} lngLatHeight
   * @param {*} option
   * @returns
   */
  addPointEntity(lngLatHeight, option) {
    let newOption = Object.assign({}, option);
    let positionTemp = Cesium.Cartesian3.fromDegrees(lngLatHeight[0], lngLatHeight[1], lngLatHeight[2]);
    newOption.color = new Cesium.Color.fromCssColorString(option.color).withAlpha(option.alpha);

    if (option.outlineColor) {
      newOption.outlineColor = new Cesium.Color.fromCssColorString(option.outlineColor);
    }

    let pointConfig = {
      position: positionTemp,
      point: {
        ...newOption
      }
    };
    if (newOption.id) {
      pointConfig.id = newOption.id;
    }
    let pointEntity = this.viewer.entities.add(pointConfig);
    pointEntity.FFOption = option;
    pointEntity.FFType = 'FFPointEntity';
    pointEntity.FFCoordinates = lngLatHeight;
    pointEntity.FFPosition = positionTemp;
    return pointEntity;
  },
  /**
   * 叠加图标点
   * @param {*} lngLatHeight
   * @param {*} option
   * @returns
   */
  addBillboardEntity(lngLatHeight, option) {
    let newOption = Object.assign({}, option);
    console.log('newOption111', newOption);
    let positionTemp = null;
    if (option.heightReference) {
      positionTemp = Cesium.Cartesian3.fromDegrees(lngLatHeight[0], lngLatHeight[1]);
    } else {
      positionTemp = Cesium.Cartesian3.fromDegrees(lngLatHeight[0], lngLatHeight[1], lngLatHeight[2]);
    }

    newOption.pixelOffset = new Cesium.Cartesian2(newOption.pixelOffset[0], newOption.pixelOffset[1]);

    let billboardConfig = {
      position: positionTemp,
      billboard: {
        ...newOption
      }
    };
    if (newOption.id) {
      billboardConfig.id = newOption.id;
    }

    let billboardEntity = this.viewer.entities.add(billboardConfig);
    billboardEntity.FFOption = option;
    billboardEntity.FFType = 'FFBillboardEntity';
    billboardEntity.FFCoordinates = lngLatHeight;
    billboardEntity.FFPosition = positionTemp;
    return billboardEntity;
  },
  /**
   * 叠加矩形实体
   * @param {*} coordinates
   * @param {*} option
   * @returns
   */
  addRectangleEntity(coordinates, option) {
    let newOption = Object.assign({}, option);
    let positionTemp = Cesium.Rectangle.fromDegrees(
      coordinates.west,
      coordinates.south,
      coordinates.east,
      coordinates.north
    );

    let rectangleConfig = {
      rectangle: {
        coordinates: positionTemp,
        material: new Cesium.Color.fromCssColorString(newOption.color).withAlpha(newOption.alpha),
        ...newOption
      }
    };
    if (newOption.id) {
      rectangleConfig.id = newOption.id;
    }
    let rectangleEntity = this.viewer.entities.add(rectangleConfig);
    rectangleEntity.FFOption = option;
    rectangleEntity.FFType = 'FFRectangleEntity';
    rectangleEntity.FFCoordinates = coordinates;
    rectangleEntity.FFPosition = positionTemp;
    return rectangleEntity;
  },

  /**
   * 叠加面实体
   * @param {*} lngLatHeightArr
   * @param {*} option
   * @returns
   */
  addPolygonEntity(lnglatArr, option) {
    let newOption = Object.assign({}, option);
    if (lnglatArr.length > 0 && lnglatArr[0].length > 2) {
      lnglatArr = this.getLngLatArrFromLngLatHeightArr(lnglatArr);
    }
    //处理newOption
    let positionTemp = Cesium.Cartesian3.fromDegreesArray(lnglatArr.flat());

    let polygonConfig = {
      polygon: {
        hierarchy: positionTemp,
        material: new Cesium.Color.fromCssColorString(newOption.color).withAlpha(newOption.alpha),
        ...newOption
      }
    };
    if (newOption.id) {
      polygonConfig.id = newOption.id;
    }
    let polygonEntity = this.viewer.entities.add(polygonConfig);
    polygonEntity.FFOption = option;
    polygonEntity.FFType = 'FFPolygonEntity';
    polygonEntity.FFCoordinates = lnglatArr;
    polygonEntity.FFPosition = positionTemp;
    return polygonEntity;
  },

  /**
   * 叠加线实体
   * @param {*} lngLatHeightArr
   * @param {*} option
   * @returns
   */
  addPolylineEntity(lngLatHeightArr, option) {
    let newOption = Object.assign({}, option);
    let positionTemp = Cesium.Cartesian3.fromDegreesArrayHeights(lngLatHeightArr.flat());

    let polylineConfig = {
      polyline: {
        positions: positionTemp,
        material: new Cesium.Color.fromCssColorString(newOption.color).withAlpha(newOption.alpha),
        ...newOption
      }
    };
    if (newOption.id) {
      polylineConfig.id = newOption.id;
    }

    let polylineEntity = this.viewer.entities.add(polylineConfig);
    polylineEntity.FFOption = option;
    polylineEntity.FFType = 'FFPolylineEntity';
    polylineEntity.FFCoordinates = lngLatHeightArr;
    polylineEntity.FFPosition = positionTemp;
    return polylineEntity;
  }
};
