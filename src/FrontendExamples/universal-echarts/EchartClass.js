/**
 * @description EchartClass
 * 通用封装Echart类
 */
class EchartClass {
  constructor() {}

  //手动缩放组件
  useZoomTool(chartInstance, divID) {
    // 默认激活区域缩放（框选放大）
    chartInstance.dispatchAction({
      type: "takeGlobalCursor",
      key: "dataZoomSelect",
      dataZoomSelectActive: true
    });

    // 双击还原缩放
    document.getElementById(divID).addEventListener("dblclick", () => {
      chartInstance.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
    });
  }

  /**
   * 多个数组求最大值和最小值
   * Y 轴最小值 = 数据集合实际最小值 - 0.2 * (数据最大值 - 数据最小值)
   * Y 轴最大值 = 数据集合实际最大值 + 0.2 * (数据最大值 - 数据最小值)
   * 设置数据的最大值和最小值，添加20%的padding
   * @param {*} dataArr 
   * @returns 
   */
  getMaxAndMin(dataArr) {
    const result = dataArr
      .flat()
      .filter((value) => value !== null && value !== undefined && !Number.isNaN(Number(value)))
      .map((value) => Number(value));

    if (result.length === 0) {
      return {
        minVlaue: 0,
        maxVlaue: 0
      };
    }

    const minVlaue = Math.min(...result);
    const maxVlaue = Math.max(...result);
    const range = maxVlaue - minVlaue;
    const padding = range === 0 ? Math.max(Math.abs(maxVlaue) * 0.2, 1) : range * 0.2;

    return {
      minVlaue: Number((minVlaue - padding).toFixed(2)),
      maxVlaue: Number((maxVlaue + padding).toFixed(2))
    };
  }
}

export default EchartClass;
