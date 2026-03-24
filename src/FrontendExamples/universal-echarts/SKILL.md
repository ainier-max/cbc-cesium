---
name: universal-echarts
description: "\u7528\u4e8e\u7ef4\u62a4 src/FrontendExamples/universal-echarts/EchartClass.js \u4e2d\u7684 EchartClass \u5c01\u88c5\u3002\u5728\u5904\u7406 ECharts \u624b\u52a8\u7f29\u653e\u3001\u53cc\u51fb\u8fd8\u539f\u7f29\u653e\u3001\u4ee5\u53ca\u57fa\u4e8e\u6570\u636e\u96c6\u5408\u8ba1\u7b97 y \u8f74\u6700\u5927\u503c\u548c\u6700\u5c0f\u503c\u65f6\u4f7f\u7528\u3002"
---

# Universal ECharts

将 [EchartClass.js](./EchartClass.js) 视为当前 skill 的唯一实现来源。

## 处理范围

- 处理 `useZoomTool(chartInstance, divID)` 的缩放行为。
- 处理 `getMaxAndMin(dataArr)` 的最大值和最小值计算。
- 不扩展到主题、图例、异步数据加载、图表联动等其他 ECharts 功能，除非用户明确提出。

## 类职责

`EchartClass` 是一个轻量封装类，目前只负责两件事：

1. 给图表启用框选缩放和双击还原。
2. 根据一个或多个数值数组，生成带 padding 的 `minVlaue` 和 `maxVlaue`。

修改这个类时，优先保持职责单一，不要把页面级状态、请求逻辑或业务格式化逻辑塞进来。

## 缩放工具

`useZoomTool(chartInstance, divID)` 的目标是让图表具备以下默认交互：

- 初始化后进入框选缩放状态。
- 双击图表容器时恢复到 `dataZoom` 全范围。

建议保留这两个关键动作：

```js
chartInstance.dispatchAction({
  type: "takeGlobalCursor",
  key: "dataZoomSelect",
  dataZoomSelectActive: true
});
```

```js
chartInstance.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
```

## 缩放工具修改原则

- `chartInstance` 必须是已完成初始化的 ECharts 实例。
- `divID` 必须能找到真实 DOM 容器。
- 如果后续要避免重复绑定双击事件，优先在类外部或调用方补充解绑逻辑。
- 如果要改成别的缩放触发方式，优先保留“可恢复全范围”的能力。

## 最大最小值算法

`getMaxAndMin(dataArr)` 的当前规则是：

- 接收多个数组组成的集合。
- 展平数据。
- 过滤 `null`、`undefined` 和非数字内容。
- 求真实最小值和最大值。
- 在上下边界额外增加 20% padding。

当前返回结构保持为：

```js
{
  minVlaue: number,
  maxVlaue: number
}
```

如果数据为空，返回：

```js
{
  minVlaue: 0,
  maxVlaue: 0
}
```

## 最大最小值修改原则

- 优先保持输入兼容多个数组。
- 优先过滤非法值后再计算，不要直接对原始数组做 `Math.min` / `Math.max`。
- 保持 padding 逻辑明确可读。
- 如果最大值和最小值相同，仍要保留一个最小边距，避免图表上下限重合。

## 使用方式

典型接入方式如下：

```js
const echartClass = new EchartClass();
const { minVlaue, maxVlaue } = echartClass.getMaxAndMin([seriesValues]);

chartInstance.setOption({
  yAxis: {
    min: minVlaue,
    max: maxVlaue
  }
});

echartClass.useZoomTool(chartInstance, "chart-id");
```

## 避免的问题

- 不要在 `chartInstance` 未初始化时调用 `useZoomTool`。
- 不要传入不存在的 `divID`，否则双击还原不会生效。
- 不要移除非法值过滤，否则 `minVlaue` 和 `maxVlaue` 可能变成 `NaN`。
- 不要随意修改返回字段名，除非同步修改所有调用方。
