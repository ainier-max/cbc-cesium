<template>
  <div style="height: 100%; overflow: hidden">
    <el-container style="height: 100%">
      <el-header>
        <div>
          <span style="cursor: pointer; color: #ffffff; font-size: 26px; font-weight: bold; padding-left: 30px">信图GIS平台</span>
        </div>
      </el-header>
      <el-container style="height: 100%">
        <el-aside width="201px">
          <div style="height: 100%; padding-top: -10px">
            <el-menu
              :default-active="activeIndex"
              class="elmenu-vertical"
              @select="handleSelect"
              @open="handleOpen"
              @close="handleClose"
              text-color="#fff"
              active-text-color="#ffd04b"
            >
              <el-menu-item index="1">
                <i class="el-icon-location"></i>
                <span style="font-size: 16px">地图接入</span>
              </el-menu-item>

              <el-menu-item index="2">
                <i class="el-icon-menu"></i>
                <span style="font-size: 16px">地图操作</span>
              </el-menu-item>

              <el-menu-item index="3">
                <i class="el-icon-s-data"></i>
                <span style="font-size: 16px">地图采集</span>
              </el-menu-item>

              <el-menu-item index="4">
                <i class="el-icon-s-data"></i>
                <span style="font-size: 16px">地图特效</span>
              </el-menu-item>

              <el-menu-item index="5">
                <i class="el-icon-s-help"></i>
                <span style="font-size: 16px">空间分析</span>
              </el-menu-item>

              <el-menu-item index="6">
                <i class="el-icon-s-help"></i>
                <span style="font-size: 16px">高级示例</span>
              </el-menu-item>

              <el-menu-item index="7">
                <i class="el-icon-date"></i>
                <span style="font-size: 16px">应用场景</span>
              </el-menu-item>

              <el-menu-item index="8">
                <i class="el-icon-date"></i>
                <span style="font-size: 16px">平台手册</span>
              </el-menu-item>
            </el-menu>
          </div>
        </el-aside>

        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
<script setup lang="ts">
  import { provide, ref, nextTick, onMounted } from "vue";
  const activeIndex = ref("1");

  import { useRoute, useRouter } from "vue-router";
  const router = useRouter();

  console.log("router.currentRoute.value.path", router.currentRoute.value.path);
  if (router.currentRoute.value.path == "/") {
    router.push({ name: "mapAccess" });
  } else if (router.currentRoute.value.path == "/ffCesiumMain/mapAccess") {
    activeIndex.value = "1";
  } else if (router.currentRoute.value.path == "/ffCesiumMain/MapOperate") {
    activeIndex.value = "2";
  } else if (router.currentRoute.value.path == "/ffCesiumMain/MapGather") {
    activeIndex.value = "3";
  } else if (router.currentRoute.value.path == "/ffCesiumMain/MapEffect") {
    activeIndex.value = "4";
  } else if (router.currentRoute.value.path == "/ffCesiumMain/SpatialAnalysis") {
    activeIndex.value = "5";
  } else if (router.currentRoute.value.path == "/ffCesiumMain/AdvancedExamples") {
    activeIndex.value = "6";
  } else if (router.currentRoute.value.path == "/ffCesiumMain/MapSenior") {
    activeIndex.value = "7";
  } else if (router.currentRoute.value.path == "/ffCesiumMain/Md") {
    activeIndex.value = "8";
  }

  console.log("activeIndex", activeIndex);

  const handleSelect = (key, keyPath) => {
    if (key == "1") {
      router.push({ name: "mapAccess" });
    }
    if (key == "2") {
      router.push({ name: "MapOperate" });
    }
    if (key == "3") {
      router.push({ name: "MapGather" });
    }
    if (key == "4") {
      router.push({ name: "MapEffect" });
    }
    if (key == "5") {
      router.push({ name: "SpatialAnalysis" });
    }
    if (key == "6") {
      router.push({ name: "AdvancedExamples" });
    }
    if (key == "7") {
      router.push({ name: "MapSenior" });
    }
    if (key == "8") {
      router.push({ name: "Md" });
      // const { href } = router.resolve({
      //   path: "/Md"
      // });
      // window.open(href, "_blank");
      // router.push({ name: "Md" });
    }
  };
  const handleOpen = (key, keyPath) => {};
  const handleClose = (key, keyPath) => {};
</script>

<style scoped>
  .el-header {
    line-height: 60px;
    height: 60px;
    padding: 0;
    background-color: #453628;
    margin-bottom: -2px;
    padding-bottom: 20px;
  }

  .el-aside {
    background-color: #453628;
  }

  .el-footer {
    line-height: 44px;
    height: 44px;
    padding: 0;
    background-color: #eee;
  }

  .el-main {
    background-color: #f8f8f8;
  }

  .el-menu {
    border-right: solid 0px #333;
    background-color: rgba(13, 13, 13, 0) !important;
  }

  .logo {
    width: 200px;
    float: left;
    text-align: center;
    font-weight: 900;
    font-size: 20px;
  }

  .elmenu-horizontal {
    margin-left: 201px;
  }

  .el-menu-item:focus,
  .el-menu-item:hover {
    background-color: rgba(13, 13, 13, 0.5) !important;
  }

  .is-active {
    background-color: rgba(13, 13, 13, 0.5);
  }

  .el-divider--horizontal {
    display: block;
    height: 1px;
    width: 100%;
    margin: 0;
  }
</style>
