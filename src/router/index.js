import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
const routes = [
  {
    path: "/",
    component: () => import("@/components/FFCesiumMain/index.vue")
  },
  {
    path: "/test",
    component: () => import("@/components/test/index.vue")
  },
  {
    path: "/SituationPlotting",
    component: () => import("@/components/test/SituationPlotting/index.vue")
  },
  {
    path: "/mapCode",
    component: () => import("@/components/common/MapCode/index.vue")
  },
  {
    path: "/iframe",
    component: () => import("@/components/common/MapCode/iframe.vue")
  },

  {
    path: "/ffCesiumMain",
    component: () => import("@/components/FFCesiumMain/index.vue"),
    children: [
      {
        name: "mapAccess",
        path: "mapAccess",
        component: () => import("@/components/FFCesiumMain/MapAccess/index.vue")
      },
      {
        name: "MapOperate",
        path: "MapOperate",
        component: () => import("@/components/FFCesiumMain/MapOperate/index.vue")
      },
      {
        name: "MapGather",
        path: "MapGather",
        component: () => import("@/components/FFCesiumMain/MapGather/index.vue")
      },
      {
        name: "MapEffect",
        path: "MapEffect",
        component: () => import("@/components/FFCesiumMain/MapEffect/index.vue")
      },
      {
        name: "SpatialAnalysis",
        path: "SpatialAnalysis",
        component: () => import("@/components/FFCesiumMain/SpatialAnalysis/index.vue")
      },
      {
        name: "AdvancedExamples",
        path: "AdvancedExamples",
        component: () => import("@/components/FFCesiumMain/AdvancedExamples/index.vue")
      },
      {
        name: "MapSenior",
        path: "MapSenior",
        component: () => import("@/components/FFCesiumMain/MapSenior/index.vue")
      },
      {
        name: "Md",
        path: "Md",
        component: () => import("@/components/FFCesiumMain/Md/index.vue")
      }
    ]
  },
  {
    path: "/modelEditTool",
    component: () => import("@/MapSenior/ModelEditTool/index.vue")
  }
];
const router = createRouter({
  history: createWebHashHistory(), // hash路由模式
  // history: createWebHistory(),  // history路由模式
  routes
});
export default router;
