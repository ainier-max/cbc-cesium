# <span style='color:#0950FC'>┃</span> WMS服务加载

## 方法名

### addWmslayer(url, layerName)

## 参数介绍

#### url : '' 链接地址
#### layerName : '' 特定图层的名称或标识符

## 返回值
执行完成后的返回值为ImageryLayer
### 使用示例

```javascript
  let url = "http://192.168.15.228:8078/geoserver/cbc/wms";
  let layerName = "cbc:ground";
  wmslayer = ffCesium.addWmslayer(url, layerName);
```

### [示例地址](./#/mapCode?id=2&type=2&urlname=basicMapLoadingInterface-addWMSService)
