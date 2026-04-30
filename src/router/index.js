import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
const routes = [
  {
    path: "/",
    component: () => import("@/components/FFCesiumMain/index.vue")
  },
  {
    path: "/test",
    component: () => import("@/components/useTest/index.vue")
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
      },
      {
        name: "FrontendExamples",
        path: "FrontendExamples",
        component: () => import("@/components/FFCesiumMain/FrontendExamples/index.vue")
      }
    ]
  },
  {
    path: "/FrontendExamples/structural-settings",
    component: () => import("@/FrontendExamples/structural-settings/index.vue")
  },
  {
    path: "/FrontendExamples/universal-echarts",
    component: () => import("@/FrontendExamples/universal-echarts/index.vue")
  },
  {
    path: "/modelEditTool",
    component: () => import("@/MapSenior/ModelEditTool/index.vue")
  },
  {
    path: "/mapDataLayer",
    component: () => import("@/MapSenior/MapDataLayer/index.vue")
  },
  {
    path: "/TileEditTool",
    component: () => import("@/MapSenior/TileEditTool/index.vue")
  },
  {
    path: "/CesiumForFluid",
    component: () => import("@/MapSenior/CesiumForFluid/index.vue")
  },
  {
    path: "/WaterHead",
    component: () => import("@/MapSenior/WaterHead/index.vue")
  },
  {
    path: "/DynamicDiv",
    component: () => import("@/MapSenior/DynamicDiv/index.vue")
  }
];
const router = createRouter({
  history: createWebHashHistory(), // hash路由模式
  // history: createWebHistory(),  // history路由模式
  routes
});
export default router;
