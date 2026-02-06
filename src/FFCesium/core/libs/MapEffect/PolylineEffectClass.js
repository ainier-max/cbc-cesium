import * as Cesium from "cesium";
import PolylineEffectLogic from "./LogicClass/PolylineEffectLogic.js";

class PolylineEffectClass {
  viewer;
  polylineEffectLogic;
  addPolylineMovePointInfo = "叠加线的移动点效果方法(addPolylineMovePoint)";
  removePolylineMovePointInfo = "移除线的移动点效果方法(removePolylineMovePoint)";
  addPolylineFlickerInfo = "叠加线的闪烁效果方法(addPolylineFlicker)";
  removePolylineFlickerInfo = "移除线的闪烁效果方法(removePolylineFlicker)";
  addLineSegmentLabelInfo = "叠加线段标签效果方法(addLineSegmentLabel)";
  removeLineSegmentLabelInfo = "移除线段标签效果方法(removeLineSegmentLabel)";
  addPolylineFlowInfo = "叠加流动线效果方法(addPolylineFlow)";
  removePolylineFlowInfo = "移除流动线效果方法(removePolylineFlow)";
  constructor(viewer) {
    this.viewer = viewer;
    this.polylineEffectLogic = new PolylineEffectLogic(viewer);
  }
  //叠加线的移动点效果方法(addPolylineMovePoint)
  addPolylineMovePoint(movePointArr, option) {
    return this.polylineEffectLogic.addPolylineMovePoint(movePointArr, option);
  }
  //移除线的移动点效果方法(removePolylineMovePoint)
  removePolylineMovePoint(polylineMovePointArr) {
    this.polylineEffectLogic.removePolylineMovePoint(polylineMovePointArr);
  }
  //叠加线的闪烁效果方法(addPolylineFlicker)
  addPolylineFlicker(lnglatArr, option) {
    return this.polylineEffectLogic.addPolylineFlicker(lnglatArr, option);
  }
  //移除线的闪烁效果方法(removePolylineFlicker)
  removePolylineFlicker(polylineFlickerObj) {
    this.polylineEffectLogic.removePolylineFlicker(polylineFlickerObj);
  }
  //叠加线段标签效果方法(addLineSegmentLabel)
  addLineSegmentLabel(lnglatHeightArr, option) {
    return this.polylineEffectLogic.addLineSegmentLabel(lnglatHeightArr, option);
  }
  //移除线段标签效果方法(removeLineSegmentLabel)
  removeLineSegmentLabel(htmlOverlayArr) {
    this.polylineEffectLogic.removeLineSegmentLabel(htmlOverlayArr);
  }
  //叠加流动线(addPolylineFlow)
  addPolylineFlow(lnglatArr, option) {
    return this.polylineEffectLogic.addPolylineFlow(lnglatArr, option);
  }
  //移除流动线(removePolylineFlow)
  removePolylineFlow(polylineObj) {
    this.polylineEffectLogic.removePolylineFlow(polylineObj);
  }
}
export default PolylineEffectClass;
