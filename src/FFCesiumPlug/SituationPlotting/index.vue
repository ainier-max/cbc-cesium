<template>
  <div>
    <div v-if="!editFlag">
      <div style="height: 10px"></div>
      <div style="padding-left: 15px; padding-right: 15px">
        <el-divider content-position="left">绘制区</el-divider>
      </div>
      <div
        style="padding-left: 15px; padding-right: 15px; padding-bottom: 10px"
      >
        <el-button
          type="primary"
          style="margin-top: 10px"
          @click="gatherBillboard"
          >点</el-button
        >
        <el-button
          type="primary"
          style="margin-top: 10px"
          @click="gatherPolyline"
          >线</el-button
        >
        <el-button
          type="primary"
          style="margin-top: 10px"
          @click="gatherPolygon"
          >面</el-button
        >
        <el-button
          type="primary"
          style="margin-top: 10px"
          @click="gatherRectangle"
          >矩形</el-button
        >
        <el-button
          type="primary"
          style="margin-top: 10px"
          @click="circleGatherFun"
          >圆</el-button
        >
      </div>
    </div>

    <div v-if="editFlag">
      <div style="height: 10px"></div>
      <div style="padding-left: 15px; padding-right: 15px">
        <el-divider content-position="left">编辑区</el-divider>
      </div>
      <span style="color: red; font-size: 12px; padding-left: 15px"
        >* 地图右击也可保存</span
      >

      <el-form
        :model="form"
        label-width="auto"
        style="max-width: 600px; padding: 10px"
      >
        <el-form-item label="名称">
          <el-input v-model="form.text" />
        </el-form-item>

        <el-form-item label="图标" v-if="form.imageType">
          <div class="iconList">
            <img
              v-for="item in iconList"
              :key="item.key"
              @click="setIcon(item)"
              :src="item.value"
              :style="setIconClass(item)"
            />
            <div class="checkmark"></div>
          </div>
        </el-form-item>

        <el-form-item label="颜色" v-if="form.color">
          <el-color-picker
            v-model="form.color"
            show-alpha
            :predefine="predefineColors"
            color-format="hex"
          />
        </el-form-item>
        <el-form-item label="面积" v-if="form.area">
          <el-input v-model="form.area" :disabled="true">
            <template #append>m²</template>
          </el-input>
        </el-form-item>
        <el-form-item label="周长" v-if="form.length">
          <el-input v-model="form.length" :disabled="true">
            <template #append>m</template>
          </el-input>
        </el-form-item>

        <el-button type="primary" style="margin-left: 70px" @click="save"
          >保存</el-button
        >
      </el-form>
    </div>
    <!--菜单栏-->
    <Teleport to="#cesiumContainer">
      <div
        id="plotMenuID"
        style="
          background-color: white;
          display: none;
          z-index: 999;
          height: 90px;
          width: 80px;
        "
      >
        <div class="hover-div" @click="editCurrentEntity">编辑</div>
        <div class="hover-div" @click="deleteCurrentEntity">删除</div>
        <div class="hover-div" @click="closeplotMenuHtmlOverlay">关闭</div>
      </div>
    </Teleport>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";

import commonImage from "./image/common.png";
import fireEngineImage from "./image/fireEngine.png";
import fireStationImage from "./image/fireStation.png";

const iconList = [
  { key: "common", value: commonImage },
  { key: "fireEngine", value: fireEngineImage },
  { key: "fireStation", value: fireStationImage },
];

const userChooseIcon = ref({ key: "common", value: commonImage });
const setIcon = (icon) => {
  console.log(icon);
  userChooseIcon.value = icon;
};

const setIconClass = computed(() => {
  return function (item) {
    let styleTemp = {};
    if (item.key == userChooseIcon.value.key) {
      styleTemp.border = "1px solid red";
    }
    styleTemp.height = "31px";
    styleTemp.width = "21px";
    styleTemp.marginRight = "10px";
    styleTemp.cursor = "pointer";
    return styleTemp;
  };
});

const form = ref({
  imageType: "",
  text: "",
  color: "",
});

const percentToHex = (percent) => {
  // 确保百分比在0-100之间
  percent = Math.max(Math.min(percent, 100), 0);
  // 将百分比转换为0-255的整数
  var intValue = Math.round((percent / 100) * 255);
  // 转换为无符号的十六进制字符串
  var hexValue = intValue.toString(16);
  // 确保十六进制值是两位数
  return hexValue.padStart(2, "0");
};

const predefineColors = ref([
  "#ff4500",
  "#ff450099",
  "#ff8c0066",
  "#ffd70066",
  "#90ee9066",
  "#00ced166",
  "#1e90ff66",
  "#c7158577",
]);

const props = defineProps({
  ffCesium: Object,
  plotDataArray: Array,
});
let ffCesium = props.ffCesium;

const save = () => {
  //停止编辑
  if (currentEntity.FFType == "FFBillboardEntity") {
    ffCesium.closeBillboardEdit(currentEntity);
    updateCurrentEntityData();
    userChooseIcon.value = { key: "common", value: commonImage };
  } else if (currentEntity.FFType == "FFPolylineEntity") {
    ffCesium.closePolylineEdit(currentEntity);
    updateCurrentEntityData();
  } else if (currentEntity.FFType == "FFPolygonEntity") {
    ffCesium.closePolygonEdit(currentEntity);
    updateCurrentEntityData();
  } else if (currentEntity.FFType == "FFRectangleEntity") {
    ffCesium.closeRectangleEdit(currentEntity);
    updateCurrentEntityData();
  } else if (currentEntity.FFType == "FFCircleEntity") {
    ffCesium.closeCircleEdit(currentEntity);
    updateCurrentEntityData();
  }
  //更新标签
  updateLable();
  ElMessage({
    message: "保存数据",
    type: "success",
  });
  editFlag.value = false;
  addMenuHandler();
};

//菜单
let plotMenuHtmlOverlay = null;
let textHtmlOverlayArray = [];
let currentEntity = null;
let editFlag = ref(false);
let menuHandler = null;
//关闭弹窗
const closeplotMenuHtmlOverlay = () => {
  console.log("closeplotMenuHtmlOverlay");
  ffCesium.closeHtmlForVue(plotMenuHtmlOverlay);
};
//修改标绘实体
const editCurrentEntity = () => {
  console.log("当前实体对象currentEntity", currentEntity);
  //设置FormValue
  setFormValueFromCurrentEntity();
  console.log("form123", form);
  closeMenuHandler();
  editFlag.value = true;
  closeplotMenuHtmlOverlay();
  if (currentEntity.FFType == "FFBillboardEntity") {
    ffCesium.billboardEdit(currentEntity, editCurrentEntityCallback);
  } else if (currentEntity.FFType == "FFPolylineEntity") {
    ffCesium.polylineEdit(currentEntity, editCurrentEntityCallback);
  } else if (currentEntity.FFType == "FFPolygonEntity") {
    ffCesium.polygonEdit(currentEntity, editCurrentEntityCallback);
  } else if (currentEntity.FFType == "FFRectangleEntity") {
    ffCesium.rectangleEdit(currentEntity, editCurrentEntityCallback);
  } else if (currentEntity.FFType == "FFCircleEntity") {
    ffCesium.circleEdit(currentEntity, editCurrentEntityCallback);
  }
};
const editCurrentEntityCallback = (entity) => {
  save();
};
//更新实体数据
const updateCurrentEntityData = () => {
  currentEntity.ForItem.plotObj.text = form.value.text;
  if (currentEntity.FFType == "FFBillboardEntity") {
    currentEntity.ForItem.plotObj.imageType = userChooseIcon.value.key;
    currentEntity.ForItem.plotObj.FFCoordinates = currentEntity.FFCoordinates;
    currentEntity.billboard.image = userChooseIcon.value.value;
  } else if (currentEntity.FFType == "FFPolylineEntity") {
    currentEntity.ForItem.plotObj.color = form.value.color.substring(0, 7);
    currentEntity.ForItem.plotObj.alpha =
      parseInt(form.value.color.substring(7, 9), 16) / 255;
    currentEntity.ForItem.plotObj.FFCoordinates = currentEntity.FFCoordinates;
    let optionTemp = {};
    optionTemp.type = "polyline";
    optionTemp.LngLatArr = currentEntity.ForItem.plotObj.FFCoordinates;
    currentEntity.ForItem.plotObj.length = ffCesium.countlength(optionTemp);
    //更新实体
    currentEntity.polyline.material = ffCesium.Cesium.Color.fromCssColorString(
      currentEntity.ForItem.plotObj.color
    ).withAlpha(currentEntity.ForItem.plotObj.alpha);
  } else if (currentEntity.FFType == "FFPolygonEntity") {
    currentEntity.ForItem.plotObj.color = form.value.color.substring(0, 7);
    currentEntity.ForItem.plotObj.alpha =
      parseInt(form.value.color.substring(7, 9), 16) / 255;
    currentEntity.ForItem.plotObj.FFCoordinates = currentEntity.FFCoordinates;
    let optionTemp = {};
    optionTemp.type = "polygon";
    optionTemp.LngLatArr = currentEntity.ForItem.plotObj.FFCoordinates;
    currentEntity.ForItem.plotObj.area = ffCesium.countArea(optionTemp);
    currentEntity.ForItem.plotObj.length = ffCesium.countlength(optionTemp);
    //更新实体
    currentEntity.polygon.material = ffCesium.Cesium.Color.fromCssColorString(
      currentEntity.ForItem.plotObj.color
    ).withAlpha(currentEntity.ForItem.plotObj.alpha);
  } else if (currentEntity.FFType == "FFRectangleEntity") {
    currentEntity.ForItem.plotObj.color = form.value.color.substring(0, 7);
    currentEntity.ForItem.plotObj.alpha =
      parseInt(form.value.color.substring(7, 9), 16) / 255;
    currentEntity.ForItem.plotObj.FFCoordinates = currentEntity.FFCoordinates;
    //更新面积与长度值
    let optionTemp = {};
    optionTemp.type = "rectangle";
    optionTemp.LngLat = currentEntity.ForItem.plotObj.FFCoordinates;
    currentEntity.ForItem.plotObj.area = ffCesium.countArea(optionTemp);
    currentEntity.ForItem.plotObj.length = ffCesium.countlength(optionTemp);
    //更新实体
    currentEntity.rectangle.material = ffCesium.Cesium.Color.fromCssColorString(
      currentEntity.ForItem.plotObj.color
    ).withAlpha(currentEntity.ForItem.plotObj.alpha);
  } else if (currentEntity.FFType == "FFCircleEntity") {
    currentEntity.ForItem.plotObj.color = form.value.color.substring(0, 7);
    currentEntity.ForItem.plotObj.alpha =
      parseInt(form.value.color.substring(7, 9), 16) / 255;
    currentEntity.ForItem.plotObj.FFCenterPoint = currentEntity.FFCenterPoint;
    currentEntity.ForItem.plotObj.FFRadius = currentEntity.FFRadius;
    let optionTemp = {};
    optionTemp.type = "circle";
    optionTemp.centerPoint = currentEntity.FFCenterPoint;
    optionTemp.radius = currentEntity.FFRadius;
    currentEntity.ForItem.plotObj.area = ffCesium.countArea(optionTemp);
    currentEntity.ForItem.plotObj.length = ffCesium.countlength(optionTemp);
    //更新实体
    currentEntity.ellipse.material = ffCesium.Cesium.Color.fromCssColorString(
      currentEntity.ForItem.plotObj.color
    ).withAlpha(currentEntity.ForItem.plotObj.alpha);
  }
};

const setFormValueFromCurrentEntity = () => {
  form.value.text = currentEntity.ForItem.plotObj.text;

  form.value.imageType = currentEntity.ForItem.plotObj.imageType
    ? currentEntity.ForItem.plotObj.imageType
    : "";

  let colorTemp =
    currentEntity.ForItem.plotObj.color +
    percentToHex(currentEntity.ForItem.plotObj.alpha * 100);

  form.value.color = currentEntity.ForItem.plotObj.color ? colorTemp : "";

  form.value.area = currentEntity.ForItem.plotObj.area
    ? currentEntity.ForItem.plotObj.area
    : "";
  form.value.length = currentEntity.ForItem.plotObj.length
    ? currentEntity.ForItem.plotObj.length
    : "";
};

//删除标绘实体并删除其对应的标签
const deleteCurrentEntity = () => {
  console.log("props.plotDataArray", props.plotDataArray);
  console.log("deletePlotMenuHtmlOverlay--currentEntity", currentEntity);
  for (let i = 0; i < props.plotDataArray.length; i++) {
    if (props.plotDataArray[i].plotObj.id == currentEntity.id) {
      props.plotDataArray.splice(i, 1);
    }
  }
  //移除标签
  for (let i = 0; i < textHtmlOverlayArray.length; i++) {
    if (textHtmlOverlayArray[i].ForItem.plotObj.id == currentEntity.id) {
      ffCesium.removeHtml(textHtmlOverlayArray[i]);
      textHtmlOverlayArray.splice(i, 1);
    }
  }
  //移除实体
  ffCesium.removeFFEntity(currentEntity);
  closeplotMenuHtmlOverlay();
  currentEntity = null;
};

onMounted(() => {
  plotMenuHtmlOverlay = document.getElementById("plotMenuID");
  console.log("props.plotDataArray", props.plotDataArray);
  //叠加默认的标绘数据
  props.plotDataArray.forEach((item) => {
    let plotObj = item.plotObj;
    if (plotObj.FFType == "FFPolygonEntity") {
      let option = {
        id: plotObj.id,
        color: plotObj.color,
        alpha: plotObj.alpha,
      };
      let polygonObj = ffCesium.addPolygonEntity(plotObj.FFCoordinates, option);
      polygonObj.ForItem = item;
    }
    addLabel(item);
  });

  addMenuHandler();
});

const addLabel = (item) => {
  console.log("addLabel--item", item);
  let option = {};
  option.offset = { top: 0, left: 0 };
  let centerPoint = null;
  //叠加文本标签
  if (item.plotObj.FFType == "FFBillboardEntity") {
    centerPoint = item.plotObj.FFCoordinates;
    option.offset = { top: 62, left: 0 };
  } else if (item.plotObj.FFType == "FFPolylineEntity") {
    centerPoint = ffCesium.getCenterPointByPolyline(item.plotObj.FFCoordinates);
  } else if (item.plotObj.FFType == "FFPolygonEntity") {
    centerPoint = ffCesium.getCenterPointFromLngLatArr(
      item.plotObj.FFCoordinates
    );
  } else if (item.plotObj.FFType == "FFRectangleEntity") {
    let lngTemp =
      (item.plotObj.FFCoordinates.east + item.plotObj.FFCoordinates.west) / 2;
    let latTemp =
      (item.plotObj.FFCoordinates.north + item.plotObj.FFCoordinates.south) / 2;
    centerPoint = [lngTemp, latTemp];
  } else if (item.plotObj.FFType == "FFCircleEntity") {
    centerPoint = item.plotObj.FFCenterPoint;
  }

  let html = "";
  html +=
    "<div style='cursor:pointer;color: white;background-color:#000000;padding:5px;border-radius: 5px;font-weight:bold'>" +
    item.plotObj.text +
    "</div>";

  option.zIndex = 10;
  let htmlOverlay = ffCesium.addHtml(centerPoint, html, option);
  htmlOverlay.ForItem = item;
  textHtmlOverlayArray.push(htmlOverlay);
};
const updateLable = () => {
  if (!currentEntity.ForItem.plotObj.text) {
    return;
  }

  let flag = isLabelExit();
  console.log("标签是否存在", flag);
  console.log("currentEntity1232", currentEntity);
  //currentEntity.ForItem.plotObj = { form.value };
  if (flag) {
    //移除标签
    for (let i = 0; i < textHtmlOverlayArray.length; i++) {
      if (textHtmlOverlayArray[i].ForItem.plotObj.id == currentEntity.id) {
        ffCesium.removeHtml(textHtmlOverlayArray[i]);
        textHtmlOverlayArray.splice(i, 1);
      }
    }
  }
  addLabel(currentEntity.ForItem);
};

const isLabelExit = () => {
  let flag = false;
  textHtmlOverlayArray.forEach((htmlOverlay) => {
    if (htmlOverlay.ForItem.plotObj.id == currentEntity.id) {
      flag = true;
    }
  });
  return flag;
};

//关闭菜单事件
const closeMenuHandler = () => {
  if (menuHandler) {
    menuHandler.destroy();
    menuHandler = null;
  }
};
//打开菜单事件
const addMenuHandler = () => {
  menuHandler = new ffCesium.Cesium.ScreenSpaceEventHandler(
    ffCesium.viewer.scene.canvas
  );
  //鼠标点击事件
  menuHandler.setInputAction((event) => {
    let pickedObject = ffCesium.viewer.scene.pick(event.position);
    var ray = ffCesium.viewer.camera.getPickRay(event.position);
    var cartesian = ffCesium.viewer.scene.globe.pick(
      ray,
      ffCesium.viewer.scene
    );
    if (ffCesium.Cesium.defined(pickedObject)) {
      currentEntity = pickedObject.id;
      let offset = { top: -90, left: -40 };
      let lngLatHeight = ffCesium.positionToLngLatHeight(cartesian);
      plotMenuHtmlOverlay.lngLatHeight = lngLatHeight;
      ffCesium.addHtmlForVue(lngLatHeight, plotMenuHtmlOverlay, offset);
    } else {
      ffCesium.closeHtmlForVue(plotMenuHtmlOverlay);
    }
  }, ffCesium.Cesium.ScreenSpaceEventType.LEFT_DOWN);
};

const addToPlotDataArray = (entity) => {
  let obj = {};
  obj.jqid = "jqid";
  obj.username = "username";
  obj.createTime = "createTime";
  obj.plotObj = {};
  obj.plotObj.id = entity.id;
  obj.plotObj.text = "";
  if (entity.FFType == "FFBillboardEntity") {
    obj.plotObj.FFType = entity.FFType;
    obj.plotObj.imageType = "common";
    obj.plotObj.FFCoordinates = ffCesium.getLngLatFromLngLatHeight(
      entity.FFCoordinates
    );
  } else if (entity.FFType == "FFPolylineEntity") {
    obj.plotObj.FFType = entity.FFType;
    obj.plotObj.color = entity.FFOption.color;
    obj.plotObj.alpha = entity.FFOption.alpha;
    obj.plotObj.FFCoordinates = ffCesium.getLngLatArrFromLngLatHeightArr(
      entity.FFCoordinates
    );
    let optionTemp = {};
    optionTemp.type = "polyline";
    optionTemp.LngLatArr = obj.plotObj.FFCoordinates;
    obj.plotObj.length = ffCesium.countlength(optionTemp);
  } else if (entity.FFType == "FFPolygonEntity") {
    obj.plotObj.FFType = entity.FFType;
    obj.plotObj.color = entity.FFOption.color;
    obj.plotObj.alpha = entity.FFOption.alpha;
    obj.plotObj.FFCoordinates = ffCesium.getLngLatArrFromLngLatHeightArr(
      entity.FFCoordinates
    );
    let optionTemp = {};
    optionTemp.type = "polygon";
    optionTemp.LngLatArr = obj.plotObj.FFCoordinates;
    obj.plotObj.area = ffCesium.countArea(optionTemp);
    obj.plotObj.length = ffCesium.countlength(optionTemp);
  } else if (entity.FFType == "FFRectangleEntity") {
    obj.plotObj.FFType = entity.FFType;
    obj.plotObj.color = entity.FFOption.color;
    obj.plotObj.alpha = entity.FFOption.alpha;
    obj.plotObj.FFCoordinates = entity.FFCoordinates;
    let optionTemp = {};
    optionTemp.type = "rectangle";
    optionTemp.LngLat = obj.plotObj.FFCoordinates;
    obj.plotObj.area = ffCesium.countArea(optionTemp);
    obj.plotObj.length = ffCesium.countlength(optionTemp);
  } else if (entity.FFType == "FFCircleEntity") {
    obj.plotObj.FFType = entity.FFType;
    obj.plotObj.color = entity.FFOption.color;
    obj.plotObj.alpha = entity.FFOption.alpha;
    obj.plotObj.FFCenterPoint = ffCesium.getLngLatFromLngLatHeight(
      entity.FFCenterPoint
    );
    obj.plotObj.FFRadius = entity.FFRadius;

    let optionTemp = {};
    optionTemp.type = "circle";
    optionTemp.centerPoint = obj.plotObj.FFCenterPoint;
    optionTemp.radius = obj.plotObj.FFRadius;
    obj.plotObj.area = ffCesium.countArea(optionTemp);
    obj.plotObj.length = ffCesium.countlength(optionTemp);
  }
  props.plotDataArray.push(obj);
  entity.ForItem = obj;
  console.log("addToPlotDataArray--props.plotDataArray", props.plotDataArray);
};

//采集消防车
const gatherBillboard = () => {
  closeMenuHandler();
  ffCesium.billboardGather(gatherBillboardCallback, {
    image: commonImage,
    pixelOffset: [0, -31], //数组第一个元素是左右方向，负值向左，第二个元素是上下方向，负值向上，
  });
};
const gatherBillboardCallback = (billboard) => {
  console.log("坐标采集成功,其对象为：", billboard);
  console.log("坐标采集成功,其坐标为：", billboard.FFCoordinates);
  //billboard.imageType = "fireEngine";
  addToPlotDataArray(billboard);
  //进入编辑
  currentEntity = billboard;
  editCurrentEntity();
};
//采集线
const gatherPolyline = () => {
  closeMenuHandler();
  ffCesium.polylineGather(gatherPolylineCallback, {
    color: "#FBFF65",
    alpha: 1,
    width: 5,
    clampToGround: true,
  });
};
const gatherPolylineCallback = (gatherPolyline) => {
  console.log("坐标采集成功,其对象为：", gatherPolyline);
  console.log("坐标采集成功,其坐标为：", gatherPolyline.FFCoordinates);
  addToPlotDataArray(gatherPolyline);
  //进入编辑
  currentEntity = gatherPolyline;
  editCurrentEntity();
};
//采集面
const gatherPolygon = () => {
  closeMenuHandler();
  ffCesium.polygonGather(gatherPolygonCallback, {
    color: "#FBFF65",
    alpha: 0.5,
  });
};
const gatherPolygonCallback = (gatherPolygon) => {
  console.log("坐标采集成功,其对象为：", gatherPolygon);
  console.log("坐标采集成功,其坐标为：", gatherPolygon.FFCoordinates);
  addToPlotDataArray(gatherPolygon);
  //进入编辑
  currentEntity = gatherPolygon;
  editCurrentEntity();
};
//采集矩形
const gatherRectangle = () => {
  closeMenuHandler();
  ffCesium.rectangleGather(gatherRectangleCallback, {
    color: "#FBFF65",
    alpha: 0.5,
  });
};
const gatherRectangleCallback = (gatherRectangle) => {
  console.log("坐标采集成功,其对象为：", gatherRectangle);
  console.log("坐标采集成功,其坐标为：", gatherRectangle.FFCoordinates);
  addToPlotDataArray(gatherRectangle);
  //进入编辑
  currentEntity = gatherRectangle;
  editCurrentEntity();
};

//圆
const circleGatherFun = () => {
  closeMenuHandler();
  ffCesium.circleGather(circleGatherFunCallback, {
    color: "#FBFF65",
    alpha: 0.5,
  });
};

const circleGatherFunCallback = (gatherCircle) => {
  console.log("采集成功,其对象为：", gatherCircle);
  console.log("采集成功,其坐标为：", gatherCircle.FFCenterPoint);
  console.log("采集成功,其半径为：", gatherCircle.FFRadius);
  addToPlotDataArray(gatherCircle);
  //进入编辑
  currentEntity = gatherCircle;
  editCurrentEntity();
};
</script>
<style scoped>
.hover-div {
  transition: background-color 0.3s; /* 平滑过渡效果 */
  text-align: center;
  line-height: 30px;
}
.hover-div:hover {
  cursor: pointer;
  background-color: #3498db; /* 悬浮时的背景色 */
}
.el-divider--horizontal {
  border-top: 1px var(--el-border-color) var(--el-border-style);
  display: block;
  height: 1px;
  margin: 12px 0;
  width: 100%;
}

.iconList {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}
</style>
