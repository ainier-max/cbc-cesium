import TransformClassLogic from "./LogicClass/TransformClassLogic.js";
class TransformClass {
  viewer;
  transformClassLogic;
  getLngLatArrFromLngLatHeightArrInfo = "经纬高数组转经纬度数组方法(getLngLatArrFromLngLatHeightArr)";
  constructor(viewer) {
    this.viewer = viewer;
    this.transformClassLogic = new TransformClassLogic(viewer);
  }
  /**
   * 带有高度的坐标数组转成没有高度的坐标数组
   * 输入：[[118,24,10][118,24,10][118,24,10]]
   * 输出：[[118,24][118,24][118,24]]
   * @param {*} LngLatHeightArr
   * @returns
   */
  getLngLatArrFromLngLatHeightArr(LngLatHeightArr) {
    return this.transformClassLogic.getLngLatArrFromLngLatHeightArr(LngLatHeightArr);
  }
}
export default TransformClass;
