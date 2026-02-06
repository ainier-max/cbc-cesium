import { defineStore, storeToRefs } from "pinia";
import { ref, onMounted, nextTick } from "vue";

import * as Cesium from "cesium";
import * as turf from "@turf/turf";

export const OverviewStore = defineStore("overviewID", {
  state: () => ({
    changeHeight: 20000,
    ffCesium: null,
    overviewDataLayer: {},
    heightInterval: null,
    overviewData: {
      regimenLayer: {
        showFlag: false,
        data: [
          {
            id: "1",
            name: "水情监测站点1",
            type: "regimenLayer",
            state: "yellow",
            lnglat: [129.8967497251477, 46.7282265176899],
            dynamicTitleList: [
              {
                field: "瞬时流量",
                value: "60.0 m³/s"
              },
              {
                field: "降水量",
                value: "100 mm"
              }
            ]
          },
          {
            id: "2",
            name: "水情监测站点2",
            type: "regimenLayer",
            state: "red",
            lnglat: [129.99017960566712, 46.73269516605032],
            dynamicTitleList: [
              {
                field: "瞬时流量",
                value: "10.0 m³/s"
              },
              {
                field: "降水量",
                value: "100 mm"
              }
            ]
          },
          {
            id: "3",
            name: "水情监测站点3",
            type: "regimenLayer",
            state: "normal",
            lnglat: [129.945873473941, 46.75785937157089],
            dynamicTitleList: [
              {
                field: "瞬时流量",
                value: "40.0 m³/s"
              },
              {
                field: "降水量",
                value: "100 mm"
              }
            ]
          },
          {
            id: "4",
            name: "水情监测站点4",
            type: "regimenLayer",
            state: "orange",
            lnglat: [129.94651706707083, 46.7320655059075],
            dynamicTitleList: [
              {
                field: "瞬时流量",
                value: "40.0 m³/s"
              },
              {
                field: "降水量",
                value: "100 mm"
              }
            ]
          }
        ]
      },
      soilContentLayer: {
        showFlag: false,
        data: [
          {
            id: "1",
            name: "土壤墒情站点1",
            type: "soilContentLayer",
            lnglat: [129.91776370663652, 46.757823302533474],
            dynamicTitleList: [
              {
                field: "土壤水分",
                value: "10.0 L"
              }
            ]
          }
        ]
      }
    }
  }),
  getters: {},
  actions: {
    init(ffCesium) {
      this.ffCesium = ffCesium;
      console.log("init--ffCesium", this.ffCesium);
      this.addMouseOverHandler();
    },
    //高度控制 标题的显示隐藏
    addMouseOverHandler() {
      let the = this;
      if (!this.heightInterval) {
        this.heightInterval = window.setInterval(() => {
          var height = the.ffCesium.viewer.camera.positionCartographic.height;
          if (height >= this.changeHeight) {
            the.setLayerImg(1);
          } else {
            the.setLayerImg(2);
          }
        }, 1000);
      }
    },
    setLayerImg(level) {
      for (let key in this.overviewDataLayer) {
        if (this.overviewDataLayer[key].length > 0) {
          for (let i = 0; i < this.overviewDataLayer[key].length; i++) {
            let layer = this.overviewDataLayer[key][i];
            this.changeImg(layer, level);
          }
        }
      }
    },
    changeImg(layer, level) {
      //console.log('changeImg--layer.type', layer.type)
      //console.log('changeImg--layer.layerID', layer.layerID)
      if (level == 1) {
        if (document.getElementById(layer.type + "Img_" + layer.layerID).style.width != "20px") {
          document.getElementById(layer.type + "Img_" + layer.layerID).style.width = "20px";
          document.getElementById(layer.type + "Img_" + layer.layerID).style.height = "25px";
          document.getElementById(layer.type + "Title_" + layer.layerID).style.display = "none";
        }
      } else {
        if (document.getElementById(layer.type + "Img_" + layer.layerID).style.width != "41px") {
          document.getElementById(layer.type + "Img_" + layer.layerID).style.width = "41px";
          document.getElementById(layer.type + "Img_" + layer.layerID).style.height = "55px";
          document.getElementById(layer.type + "Title_" + layer.layerID).style.display = "block";
        }
      }
    },

    toLocation(lnglat) {
      let option = {
        lng: lnglat[0],
        lat: lnglat[1],
        height: lnglat[2] ? lnglat[2] : 0,
        distance: 1700,
        pitchRadiu: -50,
        time: 2
      };
      this.ffCesium.mapActionClass.flyTo(option, this.toLocationCallback);
    },
    toLocationCallback() {
      console.log("完成定位");
    },

    removeAllLayer() {
      for (let key in this.overviewDataLayer) {
        this.removeMapLayer(key);
      }
    },

    removeMapLayer(type) {
      console.log("removeMapLayer--element", type);
      console.log("removeMapLayer--this.overviewData[type]", this.overviewDataLayer[type]);

      if (this.overviewDataLayer[type]) {
        this.overviewDataLayer[type].forEach((element, index) => {
          try {
            this.ffCesium.elementClass.removeHtml(element);
          } catch (error) {
            console.log("removeMapLayer--error", error);
            if (error.toString().indexOf("removeChild") > 0) {
              this.overviewDataLayer[type].splice(index, 1);
            }
          }
        });
        this.overviewDataLayer[type] = [];
        this.overviewData[type].showFlag = false;
      }
      console.log("removeMapLayer--this.overviewDataLayer", this.overviewDataLayer);
    },
    addOverviewDataLayer(type) {
      this.overviewDataLayer[type] = [];
      this.overviewData[type].showFlag = false;
      nextTick(() => {
        console.log("this.overviewData11", this.overviewData);
        let layerData = this.overviewData[type].data;
        let offset = { top: 0, left: 0 };
        this.overviewData[type].showFlag = true;
        nextTick(() => {
          layerData.forEach(async (element) => {
            let lngLatHeight = element.lnglat;
            //经纬度坐标是真实存在
            if (lngLatHeight[0] && lngLatHeight[1]) {
              //获取高度
              let heightTemp = await this.ffCesium.mapUtilClass.getHeightAtPoint(lngLatHeight);
              lngLatHeight[2] = heightTemp;
              let idTemp = type + "_" + element.id;
              console.log("idTemp", idTemp);
              let htmlOverlay = document.getElementById(idTemp);
              htmlOverlay.lngLatHeight = lngLatHeight;
              htmlOverlay.layerID = element.id;
              htmlOverlay.type = type;
              this.ffCesium.addTypeClass.addHtmlForVue(lngLatHeight, htmlOverlay, offset);
              this.overviewDataLayer[type].push(htmlOverlay);
            }
          });
        });
      });
    }
  }
});
