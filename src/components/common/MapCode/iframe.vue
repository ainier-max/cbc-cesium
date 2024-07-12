<template>
  <div style="position: fixed; width: 100%; height: 100%; overflow: hidden">
    <component
      style="width: 100%; height: 100%; overflow: hidden"
      :is="key"
      v-if="componentShowFlag"
    >
    </component>
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
import { useRoute } from "vue-router";
import { loadModule } from "vue3-sfc-loader";
import * as Vue from "vue";
import FFCesium from "@/FFCesium/core/index.js";
import * as turf from "@turf/turf";

const route = useRoute();
const pageURL = route.query.url;
const key = route.query.key;

const componentShowFlag = ref(false);

let currentInstance = getCurrentInstance();
if (currentInstance.components == null) {
  currentInstance.components = {};
}

onMounted(() => {
  window.cbcIframeFunction = registerComponent;
});

//注册组件
const registerComponent = (code) => {
  var option = {
    moduleCache: { vue: Vue, FFCesium: FFCesium, turf: turf },
    getFile(url) {
      return Promise.resolve(code);
    },
    addStyle(textContent) {
      const style = Object.assign(document.createElement("style"), {
        textContent,
      });
      const ref = document.head.getElementsByTagName("style")[0] || null;
      document.head.insertBefore(style, ref);
    },
  };
  //局部动态注册组件
  let component = loadModule("./Main.vue", option);
  //局部动态注册组件
  currentInstance.components[key] = defineAsyncComponent(() => component);
  componentShowFlag.value = true;
};
</script>

<style scoped>
body {
  overflow: hidden;
}
</style>
