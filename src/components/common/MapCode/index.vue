<template>
  <div style="width: 100%; height: 100%; overflow-y: hidden">
    <div class="box left" id="leftBox">
      <div class="resize-bar"></div>
      <div class="resize-line"></div>
      <div class="resize-box" id="resize-box">
        <el-button
          style="position: absolute; left: 60%; top: 10px; z-index: 9999"
          @click="runCode"
          >运行</el-button
        >
        <MyMonacoEditor
          v-if="codeShowFlag"
          id="MyMonacoEditorID"
          :code="codeValue"
          @update="updateCode"
        ></MyMonacoEditor>
      </div>
    </div>
    <div
      class="box right"
      id="rightDiv"
      style="background: #282c34; overflow-y: hidden"
    >
      <iframe
        style="overflow: hidden"
        id="receiver"
        width="100%"
        height="100%"
        :src="iframeUrl"
        frameborder="no"
      ></iframe>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  provide,
  ref,
  nextTick,
  onMounted,
  defineAsyncComponent,
  getCurrentInstance,
} from "vue";
import elementResizeDetectorMaker from "element-resize-detector";
import MyMonacoEditor from "@/components/common/MyMonacoEditor/index.vue";
import { useRoute } from "vue-router";
import FFCesium from "@/FFCesium/core/index.js";

const route = useRoute();
const pageURL = route.query.url;
const key = route.query.key;

const codeShowFlag = ref(true);

const codeValue = ref("");
const iframeUrl = ref(
  window.location.origin +
    window.location.pathname +
    "#/iframe?key=" +
    key +
    "&url=" +
    pageURL
);

const runCode = () => {
  sendMeaage(codeValue.value);
};

//定时刷新
let updateCodeTimer = null;
const updateCode = (code) => {
  codeValue.value = code;
  // // 有定时器,则清除
  if (updateCodeTimer) {
    clearInterval(updateCodeTimer);
    updateCodeTimer = null;
  }
  // 开启定时器
  updateCodeTimer = setTimeout(function () {
    // 调用函数fn
    sendMeaage(codeValue.value);
  }, 1000);
};

let timer = null;
const sendMeaage = (code) => {
  let frame = document.getElementById("receiver");
  //重新加载iframe页面
  frame.src = "about:blank";
  frame.onload = function () {
    frame.src = iframeUrl.value;
    frame.onload = function () {
      return false;
    };
  };

  let receiverWindow = frame.contentWindow;
  //receiverWindow.cbcIframeFunction(code);
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
  timer = window.setInterval(function () {
    if (typeof receiverWindow.cbcIframeFunction != "undefined") {
      receiverWindow.cbcIframeFunction(code);
      window.clearInterval(timer);
    }
  }, 100);
};

const readFile = (filePath) => {
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
};

onMounted(() => {
  let codeContent = readFile(pageURL);
  nextTick(() => {
    //console.log("获取到的code", codeContent);
    sendMeaage(codeContent);
    codeValue.value = codeContent;
    codeShowFlag.value = true;
  });

  // import(/* @vite-ignore */ newPageURL /* @vite-ignore */).then((res) => {
  //   codeShowFlag.value = false;
  //   nextTick(() => {
  //     //console.log("获取到的code", res.default);
  //     sendMeaage(res.default);
  //     codeValue.value = res.default;
  //     codeShowFlag.value = true;
  //   });
  // });
  const erd = elementResizeDetectorMaker();
  erd.listenTo(document.getElementById("resize-box"), (element) => {
    nextTick(() => {
      codeShowFlag.value = false;
      nextTick(() => {
        codeShowFlag.value = true;
      });
    });
  });
});
</script>

<style scopep>
::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 5px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}

::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 5px;
  background: #a8a9ab;
}

::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  border-radius: 5px;
  background: #f0f2f5;
}

.left {
  position: relative;
  height: 100vh;
  overflow: auto;
  float: left;
}

.right {
  position: relative;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.resize-box {
  position: absolute;
  top: 0;
  right: 7px;
  bottom: 0;
  left: 0;
  overflow-x: hidden;
}

.resize-bar {
  width: 40vw;
  height: inherit;
  resize: horizontal;
  cursor: ew-resize;
  opacity: 0;
  overflow: scroll;
}

/* 拖拽线 */
.resize-line {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  border-right: 3px solid #eee;
  border-left: 2px solid #bbb;
  pointer-events: none;
}

.resize-bar:hover ~ .resize-line,
.resize-bar:active ~ .resize-line {
  border-left: 1px dashed skyblue;
}

.resize-bar::-webkit-scrollbar {
  width: 1vw;
  height: inherit;
}

/* Firefox只有下面一小块区域可以拉伸 */
@supports (-moz-user-select: none) {
  .resize-bar:hover ~ .resize-line,
  .resize-bar:active ~ .resize-line {
    border-left: 1px solid #bbb;
  }

  .resize-bar:hover ~ .resize-line::after,
  .resize-bar:active ~ .resize-line::after {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    bottom: 0;
    right: -8px;
    /*background: url(./resize.svg);*/
    background-size: 100% 100%;
  }
}
</style>
