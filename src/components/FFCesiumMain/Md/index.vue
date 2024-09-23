<template>
  <div style="height: 100%; width: 100%">
    <div style="display: flex; height: 100%; width: 100%">
      <div class="indexleft">
        <div class="input">
          <el-input
            v-model="inputData"
            style="width: 240px; height: 32px"
            placeholder="请输入"
            :suffix-icon="Search"
            @input="inputChange(inputData)"
            @blur="inputData = ''"
          />
        </div>

        <el-collapse v-model="activeNames" @change="handleChange(activeNames)" v-for="(i, index) in newlist">
          <el-collapse-item :title="i.title" :name="index">
            <div v-for="(j, index) in i.list">
              <div @click="toPath(j.path, j.name)" class="listShow" :class="{ selectBlue: showMr === j.name }">
                {{ j.name }}
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <div style="height: 50px"></div>
      </div>
      <div class="indexRight">
        <v-md-preview :text="text"></v-md-preview>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from "vue";
  import { Search } from "@element-plus/icons-vue";
  import VMdPreview from "@kangc/v-md-editor/lib/preview";
  import "@kangc/v-md-editor/lib/style/preview.css";
  import githubTheme from "@kangc/v-md-editor/lib/theme/github.js";
  import "@kangc/v-md-editor/lib/theme/style/github.css";

  import hljs from "highlight.js";
  // import Prism from "prismjs";
  // 按需引入语言包;
  import json from "highlight.js/lib/languages/json";
  hljs.registerLanguage("json", json);

  VMdPreview.use(githubTheme, {
    Hljs: hljs
  });

  let newlist = reactive([]);
  // const routeFiles = require.context("../mdFile/", true, /\.md/);
  // 异步，返回 Promise 对象

  const modules = import.meta.glob("../../../../public/mdFile/**/*.md", {
    query: "?raw",
    import: "default"
  });
  console.log("modules123123", modules);
  //let modules = [];
  for (const str in modules) {
    const parts = str.split("mdFile/");
    const title = parts[1].split("/");
    const name = title[1].split(".");
    const existingItemIndex = newlist.findIndex((item) => item.title === title[0]);
    if (existingItemIndex === -1) {
      newlist.push({
        title: title[0],
        list: [
          {
            path: parts[1],
            name: name[0] // 去除文件后缀
          }
        ]
      });
    } else {
      // console.log("existingItemIndex", existingItemIndex);
      // 如果存在相同标题的条目，则将当前模块信息添加到对应的列表中
      newlist[existingItemIndex].list.push({
        path: parts[1],
        name: name[0] // 去除文件后缀
      });
    }
  }

  newlist.sort(function (a, b) {
    // order是规则bai  objs是需要排序的数du组
    var order = ["介绍", "地球初始化", "地图工具方法", "基础地图加载接口", "基础操作接口", "地图特效", "地图标绘", "高级工具"];
    return order.indexOf(a.title) - order.indexOf(b.title);
  });

  let text = ref("");
  let inputData = ref("");
  // 默认展开name为的项
  let activeNames = ref([0]);
  // 默认蓝色
  let showMr = ref("接入指南");
  onMounted(() => {
    // 默认打开页
    toPath("介绍/接入指南.md", showMr.value);
  });

  function handleChange(val) {
    console.log("val11", val);
  }
  function toPath(path: string, title: string) {
    showMr.value = title;
    let filePath = "./mdFile/" + path;
    text.value = readFile(filePath);
  }
  //文件数据读取
  function readFile(filePath) {
    // 创建一个新的xhr对象
    let xhr = null;
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else {
      // eslint-disable-next-line
      xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }
    const okStatus = document.location.protocol === "file" ? 0 : 200;
    xhr.open("GET", filePath, false);
    xhr.overrideMimeType("text/html;charset=utf-8");
    xhr.send(null);
    return xhr.status === okStatus ? xhr.responseText : null;
  }

  function inputChange(data) {
    let okList = reactive();
    // 包含字符收索
    const exists = newlist.some((section, i) => {
      return section.list.some((item) => {
        if (item.name.includes(data)) {
          okList = item;
          // console.log("activeNames", activeNames);
          // activeNames[2] = 2;
          // activeNames._rawValue.push(i);
        }
        return item.name.includes(data);
      });
    });

    // 全字符收索
    // const exists = wordList.some((section) => {
    //   return section.list.some((item) => {
    //     if (item.name === data) {
    //       okList = item;
    //     }
    //     return item.name === data;
    //   });
    // });

    if (exists) {
      toPath(okList.path, okList.name);
    }
  }
</script>

<style scoped>
  .listShow {
    padding-bottom: 4px;
    padding-left: 20px;
    font-family: SourceHanSansSC-Regular;
    color: #344054;
    font-size: 14px;
    cursor: pointer;
  }
  .selectBlue {
    color: #097efc;
  }
  .indexleft {
    padding: 20px;
    box-shadow: 1px 0px 2px rgba(0, 0, 0, 0.2);
    width: 280px;
    height: 94%;
    position: fixed;
    overflow-y: auto; /* 只有在内容超过父容器高度时才出现滚动条 */
  }
  .indexleft::-webkit-scrollbar {
    display: none;
  }
  .indexRight {
    overflow: auto;
    width: calc(100% - 280px);
    padding-right: 0px;
    padding-top: 13px;
    padding-left: 30px;
    position: relative;
    left: 280px;
  }
  ::v-deep(.el-input__inner) {
    border-bottom: 0px;
  }
  ::v-deep(.el-collapse) {
    border-color: transparent;
  }
  ::v-deep(.el-collapse-item__content) {
    color: #344054;
  }
  ::v-deep(.el-collapse-item__header) {
    /* color: #000000;
  font-size: 18px;
  font-weight: bold; */
    border-bottom: 0px;
    font-family: SourceHanSansSC-Bold;
    font-size: 16px;
    color: #344054;
    line-height: 24px;
    font-weight: 700;
  }
</style>
