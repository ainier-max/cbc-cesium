<template>
  <!--通用图层-->
  <template v-for="(object, key) in overviewData" :key="key">
    <template v-if="object.showFlag">
      <div
        v-for="(item, index) in object.data"
        @mouseenter="showPopup(item)"
        @mouseleave="hidePopup(item)"
        :key="index"
        :id="item.type + '_' + item.id"
        style="pointer-events: none; display: none; z-index: 999"
      >
        <div class="titleClass" align="center" :id="item.type + 'Title_' + item.id" style="position: relative; display: none">
          <div style="height: 100%; color: white; font-size: 14px; margin-left: 10px; margin-right: 10px" align="center">{{ item.name }}</div>
        </div>
        <div
          :class="setClass(item)"
          :id="item.type + 'Popup_' + item.id"
          style="position: relative; display: none; pointer-events: auto; font-size: 14px"
        >
          <BorderImg :item="item"></BorderImg>
          <div style="height: 5px"></div>
          <div class="headerClass">
            <div
              style="
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex-grow: 8;
                color: white;
                margin-left: 10px;
                margin-top: 2px;
                font-weight: 700;
                letter-spacing: 0;
                font-family: SourceHanSansSC-Bold;
              "
            >
              {{ item.name }}
            </div>
          </div>
          <div style="max-height: 250px; overflow-y: auto; overflow-x: hidden">
            <div style="display: flex" v-for="(element, indexFlag) in item.dynamicTitleList" :key="indexFlag">
              <div
                style="
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  padding-left: 10px;
                  padding-top: 10px;
                  color: #c2c5c9;
                  font-size: 14px;
                "
                :title="element.field"
              >
                {{ element.field }}
              </div>
              <div align="right" style="flex: 1; padding-top: 10px; padding-right: 10px; color: #ffffff">&nbsp;{{ element.value }}</div>
            </div>
            <div style="height: 3px"></div>
          </div>
          <div style="height: 2px"></div>
        </div>

        <div style="height: 3px"></div>
        <div align="center" @click="showDialog(item)">
          <div v-if="item.state == 'outline'" :id="item.type + 'Img_' + item.id" class="imgClass" :style="getImgStyle(item)"></div>
          <div v-else-if="item.state == 'blue'" :id="item.type + 'Img_' + item.id" class="imgClass" :style="getImgStyle(item)"></div>
          <div v-else-if="item.state == 'yellow'" :id="item.type + 'Img_' + item.id" class="imgClass" :style="getImgStyle(item)"></div>
          <div v-else-if="item.state == 'orange'" :id="item.type + 'Img_' + item.id" class="imgClass" :style="getImgStyle(item)"></div>
          <div v-else-if="item.state == 'red'" :id="item.type + 'Img_' + item.id" class="imgClass" :style="getImgStyle(item)"></div>
          <div v-else :id="item.type + 'Img_' + item.id" class="imgClass" :style="getImgStyle(item)"></div>
        </div>
      </div>
    </template>
  </template>
</template>
<script setup>
  import { ref, onMounted, nextTick } from "vue";
  import { storeToRefs } from "pinia";
  import BorderImg from "../BorderImg/index.vue";

  import { OverviewStore } from "../../store/overview.ts";
  const OverviewObj = OverviewStore();
  const { overviewData, ffCesium, changeHeight } = storeToRefs(OverviewObj);

  import { getImgURL } from "./getImgURL.js";
  const showNum = ref(4);

  const props = defineProps({});

  onMounted(() => {
    console.log("inforgis初始化--overviewData", overviewData);
  });

  const showAllTitle = () => {
    if (showNum.value == 4) {
      showNum.value = 100;
    } else {
      showNum.value = 4;
    }
  };

  const setClass = (item) => {
    let classStr = "";
    if (item.state == "blue") {
      classStr = "contentClassBlue";
    } else if (item.state == "yellow") {
      classStr = "contentClassYellow";
    } else if (item.state == "orange") {
      classStr = "contentClassOrange";
    } else if (item.state == "red") {
      classStr = "contentClassRed";
    } else if (item.state == "outline") {
      classStr = "contentClassOutline";
    } else {
      classStr = "contentClassNormal";
    }
    return classStr;
  };

  const getImgStyle = (item) => {
    let objStyle = {};
    let imgUrl = getImgURL(item);
    console.log("getImgStyle--imgUrl", imgUrl);
    objStyle.backgroundImage = "url(" + imgUrl + ")";
    objStyle.backgroundSize = "cover";
    objStyle.backgroundPosition = "center";
    return objStyle;
  };

  const showDialog = (item) => {
    consle.log("showDialog--item", item);
  };

  const showPopup = (item) => {
    document.getElementById(item.type + "Popup_" + item.id).style.display = "block";
    document.getElementById(item.type + "_" + item.id).style.zIndex = "9999";
    document.getElementById(item.type + "Title_" + item.id).style.display = "none";
  };
  const hidePopup = (item) => {
    showNum.value = 4;
    document.getElementById(item.type + "Popup_" + item.id).style.display = "none";
    document.getElementById(item.type + "_" + item.id).style.zIndex = "100";
    var height = ffCesium.value.viewer.camera.positionCartographic.height;
    if (height < changeHeight.value) {
      document.getElementById(item.type + "Title_" + item.id).style.display = "block";
    }
  };
</script>

<style scoped>
  .headerClass {
    display: flex;
    margin-left: 5px;
    background-image: url("@/MapSenior/MapDataLayer/components/CommonLayer/images/contentTitleBack.png");
    background-size: cover;
    background-position: center;
    width: 130px;
    height: 26px;
  }

  .imgClass {
    pointer-events: auto;
    width: 20px;
    height: 25px;
  }
  .titleClass {
    white-space: nowrap;
    height: 21px;
    background: rgba(9, 17, 31, 0.65);
    border-radius: 4px;
  }

  .contentClassOutline {
    width: 147px;
    background-image: linear-gradient(180deg, rgba(9, 17, 31, 0.7) 21%, #515151 100%);
  }
  .contentClassNormal {
    width: 147px;
    background-image: linear-gradient(180deg, rgba(9, 17, 31, 0.7) 21%, #174f53 100%);
  }
  .contentClassBlue {
    width: 147px;
    background-image: linear-gradient(180deg, rgba(9, 17, 31, 0.7) 21%, #17425e 100%);
  }
  .contentClassYellow {
    width: 147px;
    background-image: linear-gradient(180deg, rgba(9, 17, 31, 0.7) 21%, #413f1c 100%);
  }
  .contentClassOrange {
    width: 147px;
    background-image: linear-gradient(180deg, rgba(9, 17, 31, 0.7) 21%, #4e3521 100%);
  }
  .contentClassRed {
    width: 147px;
    background-image: linear-gradient(180deg, rgba(9, 17, 31, 0.7) 21%, #482525 100%);
  }

  ::-webkit-scrollbar {
    /*滚动条整体样式*/
    width: 2px; /*高宽分别对应横竖滚动条的尺寸*/
    height: 1px;
  }

  ::-webkit-scrollbar-thumb {
    /*滚动条里面小方块*/
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.5);
  }

  ::-webkit-scrollbar-track {
    /*滚动条里面轨道*/
    border-radius: 2px;
    background: #ffffff;
  }
</style>
