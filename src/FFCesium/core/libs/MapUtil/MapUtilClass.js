import MapUtilLogic from "./LogicClass/MapUtilLogic.js";

class MapUtilClass {
    getCenterPositionInfo = "获取视角中心点方法(getCenterPosition)";
    getHeightAtPointInfo = "获取指定点高度方法(getHeightAtPoint)";
    getCenterPointByPolylineInfo = "获取线中心点方法(getCenterPointByPolyline)";
    countlengthInfo = "计算长度方法(countlength)";
    countAreaInfo = "计算面积方法(countArea)";
    rectangleCoordinateToPolygonCoordinateInfo = "矩形坐标转面坐标方法(rectangleCoordinateToPolygonCoordinate)";
    getLngLatFromLngLatHeightInfo = "经纬高转经纬度方法(getLngLatFromLngLatHeight)";
    getLngLatArrFromLngLatHeightArrInfo = "经纬高数组转经纬度数组方法(getLngLatArrFromLngLatHeightArr)";
    getCenterPointFromLngLatArrInfo = "经纬度数组求中心点方法(getCenterPointFromLngLatArr)";
    cartesian3ArrToLngLatHeightArrInfo = "Cartesian3数组转经纬高数组方法(cartesian3ArrToLngLatHeightArr)";
    lngLatHeightArrToCartesian3ArrInfo = "经纬高数组转Cartesian3数组方法(lngLatHeightArrToCartesian3Arr)";
    positionToLngLatHeightInfo = "位置转经纬高方法(positionToLngLatHeight)";
    isSimpleXYZInfo = "判断坐标是否重复方法(isSimpleXYZ)";
    coordinateArrDeduplicationInfo = "坐标去重方法(coordinateArrDeduplication)";
    setAttributeForEntityInfo = "设置实体属性方法(setAttributeForEntity)";
    constructor(ffCesium) {
        this.ffCesium = ffCesium;
        this.mapUtilLogic = new MapUtilLogic(ffCesium);
    }

    getCenterPosition() {
        return this.mapUtilLogic.getCenterPosition();
    }

    getHeightAtPoint(LngLat, level) {
        return this.mapUtilLogic.getHeightAtPoint(LngLat, level);
    }

    getCenterPointByPolyline(LngLatArr) {
        return this.mapUtilLogic.getCenterPointByPolyline(LngLatArr);
    }

    countlength(option) {
        return this.mapUtilLogic.countlength(option);
    }

    countArea(option) {
        return this.mapUtilLogic.countArea(option);
    }

    rectangleCoordinateToPolygonCoordinate(east, west, south, north) {
        return this.mapUtilLogic.rectangleCoordinateToPolygonCoordinate(east, west, south, north);
    }

    getLngLatFromLngLatHeight(LngLatHeight) {
        return this.mapUtilLogic.getLngLatFromLngLatHeight(LngLatHeight);
    }

    getLngLatArrFromLngLatHeightArr(LngLatHeightArr) {
        return this.mapUtilLogic.getLngLatArrFromLngLatHeightArr(LngLatHeightArr);
    }

    getCenterPointFromLngLatArr(LngLatArr) {
        return this.mapUtilLogic.getCenterPointFromLngLatArr(LngLatArr);
    }

    cartesian3ArrToLngLatHeightArr(cartesian3Arr) {
        return this.mapUtilLogic.cartesian3ArrToLngLatHeightArr(cartesian3Arr);
    }

    lngLatHeightArrToCartesian3Arr(lngLatHeightArr) {
        return this.mapUtilLogic.lngLatHeightArrToCartesian3Arr(lngLatHeightArr);
    }

    positionToLngLatHeight(position) {
        return this.mapUtilLogic.positionToLngLatHeight(position);
    }

    isSimpleXYZ(p1, p2) {
        return this.mapUtilLogic.isSimpleXYZ(p1, p2);
    }

    coordinateArrDeduplication(lngLatArr) {
        return this.mapUtilLogic.coordinateArrDeduplication(lngLatArr);
    }

    setAttributeForEntity(entity, option, type) {
        return this.mapUtilLogic.setAttributeForEntity(entity, option, type);
    }
}

export default MapUtilClass;
