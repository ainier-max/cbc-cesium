# <span style='color:#0950FC'>┃</span> GeoJson数据加载

## 方法名

### 解析geojson数据readGeojson(geojson)
### 添加geojson数据addGeojson(dataSource, option)

## 参数介绍

#### geojson : json数据资源
#### dataSource : 解析geojson数据的返回值GeoJsonDataSource 
#### option ：{} 
| option      | type   | 描述                                                                       |
| ----------- | ------ | -------------------------------------------------------------------------- |
| stroke      | color | 边框线颜色                                                                   |
| strokeWidth | Number  | 边框线宽度|
| fill | color  | 填充颜色 |
| fillAlpha | Number  | 填充颜色透明度 |

## 返回值
执行完成后的返回值为GeoJsonDataSource

### 使用示例

```javascript
 let promise = ffCesium.readGeojson("./data/geojson/zhanhua.geojson");
  promise.then(function (data) {
    let option = {
      stroke: "#fFF",
      strokeWidth: 2,
      fill: "#000000",
      fillAlpha: 0.5,
    };
    dataSource = ffCesium.addGeojson(data, option);
});
```

### [示例地址](./#/mapCode?id=7&type=2&urlname=basicMapLoadingInterface-addGeoJson)
