# <span style='color:#0950FC'>┃</span> 高级div

## 方法名

### 添加div addHtmlForVue(lngLatHeight, htmlOverlay, offset);
### 开启碰撞检测 openDivCollisionChecking(allHtmlOverlay, option);
### 关闭碰撞检测 closeDivCollisionChecking();

## 参数介绍

####  lngLatHeight   添加div的坐标[经度:number，纬度:number，高度:number]
####  htmlOverlay    该div的DOW对象

####  offset         该div的位置
| offset      | type   | 描述                                                           |
| ----------- | ------ | ------------------------------------------------------------- |
| top       | number | 与顶部的距离                                  |
| left       | number | 与左边的距离                                    |

####  allHtmlOverlay 所有被添加的div的DOW数组
####  option         碰撞时div的显示样式
| option      | type   | 描述                                                           |
| ----------- | ------ | ------------------------------------------------------------- |
| opacity       | number | 碰撞时后置div的透明度                                  |
## 返回值
addHtmlForVue()执行完成后的返回值为被添加div的DOW对象

### 使用示例

```javascript
//添加div
  let allHtmlOverlay = [];
 peopleArr.value.forEach((element) => {
    let lngLatHeight = element.lngLatHeight;
    let offset = { top: 0, left: 0 };
    //获取html元素对象也可用ref方式，如：this.$refs.myButton
    let htmlOverlay = document.getElementById(element.id);
    htmlOverlay.lngLatHeight = lngLatHeight;
    ffCesium.addHtmlForVue(lngLatHeight, htmlOverlay, offset);
    allHtmlOverlay.push(htmlOverlay);
  });
  //开启碰撞检测
  let option = {
      opacity: 0.1,
  };
  ffCesium.openDivCollisionChecking(allHtmlOverlay, option);

   //关闭碰撞检测
  ffCesium.closeDivCollisionChecking();
```

### [示例地址](./#/mapCode?id=0&type=5&urlname=seniorDIV)