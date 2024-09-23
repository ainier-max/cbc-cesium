# <span style='color:#0950FC'>┃</span> KML数据加载

## 方法名

### 解析kml数据 readKml(kml)
### 加载kml数据 addKml(dataSource)

## 参数介绍

#### kml：数据资源
#### dataSource： 解析kml数据的返回值KmlDataSource 


## 返回值

执行完成后的返回值为KmlDataSource

### 使用示例

```javascript
let promise = ffCesium.readKml("./data/kml/facilities.kml");
  promise.then(function (data) {
    dataSource = ffCesium.addKml(data);
  });
```

### [示例地址](./#/mapCode?id=8&type=2&urlname=basicMapLoadingInterface-addKML)
