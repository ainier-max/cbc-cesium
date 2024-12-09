import { createApp } from "vue";
import App from "./App.vue";

window.vueApp = createApp(App);
import router from "./router/index";

//ElementPlus（全注册1）
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import { createPinia } from "pinia";
const pinia = createPinia();

window.vueApp.use(ElementPlus).use(router).use(pinia).mount("#app");
console.log("router", router);
router.beforeEach((to, from, next) => {
  console.log("beforeEach--to", to);
  next();
});
