import * as Cesium from "cesium";
import gatherPoint from "./gatherPoint.png";
import gatherPointHalf from "./gatherPointHalf.png";

/**
 * 通用产生采集点
 * @param {*} cartesian
 * @returns
 */
export function createGatherPoint(cartesian, viewer) {
  var point = viewer.entities.add({
    position: cartesian,
    billboard: {
      image: gatherPoint,
      width: 12,
      height: 12,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
  return point;
}

/**
 * 通用产生采集半点
 * @param {*} cartesian
 * @returns
 */
export function createHalfGatherPoint(cartesian, viewer) {
  var point = viewer.entities.add({
    position: cartesian,
    billboard: {
      image: gatherPointHalf,
      width: 12,
      height: 12,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
  return point;
}
