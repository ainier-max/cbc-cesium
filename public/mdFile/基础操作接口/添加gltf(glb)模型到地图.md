#### <span style='color:#0950FC'>┃</span> 添加gltf(glb)模型到地图

## 方法名

### addGltfPrimitive(latLngHeight, option)

## 参数介绍

#### latLngHeight : [lng,lat,height]

#### option : {}

| option      | type   | 描述                                                                       |
| ----------- | ------ | -------------------------------------------------------------------------- |
| url         | String | 模型路径（gltf/glb格式）                                             |
| headingAngle| Number | 航向                                                                 |
| pitchAngle  | Number | 倾斜角度                                                              |
| rollAngle   | Number | 旋转                                                                 |
| minimumPixelSize   | Number | 设置模型的最小像素尺寸                                          |
| maximumScale   | Number | 限制模型的最大缩放比例                                              |

## 返回值
执行完成后的返回值为图元primitive

### 使用示例

```javascript
let gltfPrimitive = null;
 let latLngHeight = [118.1022, 24.4959, 0];
  let option = {
    url: "./model/DracoCompressed/CesiumMilkTruck.gltf",
    headingAngle: 90, //航向
    pitchAngle: 0, //倾斜角度
    rollAngle: 0, //旋转
  };
  let promise = ffCesium.addGltfPrimitive(latLngHeight, option);
  promise.then((result) => {
    gltfPrimitive = result;
  });
```

### [示例地址](./#/mapCode?id=1&type=3&urlname=addGLTFModel)
