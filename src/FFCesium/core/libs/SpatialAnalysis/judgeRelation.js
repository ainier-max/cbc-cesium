import * as Cesium from "cesium";
import * as turf from "@turf/turf";

export const judgeRelation = {
  //判断点与面空间关系
  judgePointAndPolygon(point, polygon) {
    var pt = turf.point(point);
    polygon.forEach((element) => {
      element.push(element[0]);
    });
    var poly = turf.polygon(polygon);
    let flagTemp = turf.booleanDisjoint(pt, poly);
    return !flagTemp;
  },
  //判断线与面空间关系
  judgePolylineAndPolygon(polyline, polygon) {
    var pl = turf.lineString(polyline);
    polygon.forEach((element) => {
      element.push(element[0]);
    });
    var poly = turf.polygon(polygon);
    let flagTemp = turf.booleanDisjoint(pl, poly);
    return !flagTemp;
  },
  //判断面与面空间关系
  judgePolygonAndPolygon(polygon1, polygon2) {
    polygon1.forEach((element) => {
      element.push(element[0]);
    });
    var pg1 = turf.polygon(polygon1);

    polygon2.forEach((element) => {
      element.push(element[0]);
    });
    var pg2 = turf.polygon(polygon2);
    let flagTemp = turf.booleanDisjoint(pg1, pg2);
    return !flagTemp;
  },
};
