<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addHtmlFun"
    >
      叠加气泡框（div）
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="changeValue"
    >
      测试更新气泡框的值（更改<将军山水厂>为<中山水厂>）
    </button>

    <button
      style="position: absolute; left: 100px; top: 200px; z-index: 999"
      @click="closeDivCollisionCheckingFun"
    >
      关闭碰撞检测
    </button>

    <button
      style="position: absolute; left: 100px; top: 250px; z-index: 999"
      @click="removeHtmlFun"
    >
      移除气泡框（div）
    </button>

    <div
      v-for="(item, key) in peopleArr"
      :id="item.id"
      style="
        display: none;
        z-index: 999;
        background: white;
        width: 258px;
        height: 70px;
      "
    >
      <div class="hh-popu-card-wrapper">
        <div class="hh-popu-card-header">
          <div class="vertical-line"></div>
          <div class="hh-popu-dialog-name">{{ item.name }}</div>
        </div>
        <div
          class="hh-popu-dialog-content"
          style="display: flex; flex-direction: row"
        >
          <div class="first column">
            <span class="tab-title" style="padding-left: 5px">{{
              item.name
            }}</span>
          </div>

          <div class="second column">
            <span class="tab-title" style="padding-left: 25px; color: #00ffb2">
              {{ item.height }}
            </span>
          </div>

          <div class="spr column" style="margin-top: -10px">|</div>

          <div class="third column">
            <span class="tab-title" style="padding-left: 5px; color: #00ffb2">
              {{ item.speed }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, nextTick } from "vue";
import FFCesium from "FFCesium";

let peopleArr = ref([
  {
    id: "div3501",
    name: "将军山水厂",
    height: "4.00m",
    speed: "4.00m³/s",
    lngLatHeight: [118.1022, 24.4959, 100],
  },
  {
    id: "div3502",
    name: "草堂水厂",
    height: "6.00m",
    speed: "4.00m³/s",
    lngLatHeight: [118.2022, 24.4959, 100],
  },
  {
    id: "div3503",
    name: "见子河站",
    height: "9.00m",
    speed: "4.00m³/s",
    lngLatHeight: [118.2022, 24.4259, 100],
  },
]);

let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
});
let allHtmlOverlay = [];
const addHtmlFun = () => {
  peopleArr.value.forEach((element) => {
    let lngLatHeight = element.lngLatHeight;
    let offset = { top: 0, left: 0 };
    //获取html元素对象也可用ref方式，如：this.$refs.myButton
    let htmlOverlay = document.getElementById(element.id);
    htmlOverlay.lngLatHeight = lngLatHeight;
    //htmlOverlay.name = element.name;
    ffCesium.addHtmlForVue(lngLatHeight, htmlOverlay, offset);
    allHtmlOverlay.push(htmlOverlay);
  });

  let option = {
    opacity: 0.1,
  };
  ffCesium.openDivCollisionChecking(allHtmlOverlay, option);
};

const closeDivCollisionCheckingFun = () => {
  ffCesium.closeDivCollisionChecking();
};

const changeValue = () => {
  peopleArr.value[0].name = "中山水厂";
  //打开碰撞检查,allHtmlOverlay需要含有坐标数据，格式： [118.2022, 24.4259, 100]
};

const showInfo = (valueParam) => {
  console.log("调用了vue的方法,传值为:", valueParam);
};

const clickFun = (item) => {
  console.log("clickFun--item", item);
  alert("点击的是:" + item.name);
};

const removeHtmlFun = () => {
  allHtmlOverlay.forEach((htmlOverlay) => {
    ffCesium.removeHtml(htmlOverlay);
  });
  allHtmlOverlay = [];
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.hh-popu-card-header {
  display: flex;
  height: 30px;
  line-height: 30px;
  justify-content: space-between;
  align-items: center;
  background-image: linear-gradient(
    90deg,
    #072c28 47%,
    rgba(7, 44, 40, 0.82) 67%,
    rgba(7, 44, 40, 0.6) 82%,
    rgba(7, 44, 40, 0.42) 93%,
    rgba(7, 44, 40, 0) 100%
  );
}
.hh-popu-dialog-name {
  padding-left: 10px;
  font-family: SourceHanSansSC-Bold;
  font-size: 16px;
  color: #ffffff;
  letter-spacing: 0;
  font-weight: 700;
  text-align: left;
}

.hh-popu-dialog-content {
  padding: 8px 6px;
  width: 246px;
  height: 30px;
  background: #05211e;
  border-radius: 0 0 2px 2px;
  justify-content: flex-start;
  justify-content: flex-end;
  justify-content: center;
  justify-content: space-around;
  justify-content: space-between;
}
.tab-title {
  font-family: SourceHanSansSC-Regular;
  font-size: 14px;
  color: #ffffff;
  letter-spacing: 0;
  font-weight: 400;
  height: 20px;
  overflow: hidden;
}
.vertical-line {
  position: absolute;
  left: 0;
  height: 30px;
  width: 3px;
  background-color: #00ffb2;
}

.spr {
  margin-left: 5px;
  width: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #17645c;
}

.vertical-line-small {
  position: absolute;
  left: 100;
  height: 30px;
  width: 3px;
  background-color: #00ffb2;
}
</style>
