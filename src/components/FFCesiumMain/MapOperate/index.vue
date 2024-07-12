<template>
  <div style="width: 100%; margin-bottom: 60px">
    <FFMenuItem
      menuName="地图动作"
      :menuConfigs="mapActionMenuConfigs"
    ></FFMenuItem>

    <FFMenuItem
      menuName="地图工具"
      :menuConfigs="mapToolMenuConfigs"
    ></FFMenuItem>

    <FFMenuItem
      menuName="添加图元"
      :menuConfigs="addPrimitiveMenuConfigs"
    ></FFMenuItem>

    <FFMenuItem
      menuName="添加实体"
      :menuConfigs="addEntityMenuConfigs"
    ></FFMenuItem>

    <FFMenuItem
      menuName="添加其他元素"
      :menuConfigs="addOtherElementMenuConfigs"
    ></FFMenuItem>
  </div>
</template>
<script setup lang="ts">
import FFMenuItem from "@/components/common/FFMenuItem/index.vue";
import {
  addOtherElementMenuConfigs,
  mapActionMenuConfigs,
  mapToolMenuConfigs,
  addPrimitiveMenuConfigs,
  addEntityMenuConfigs,
} from "./config.js";
</script>

<style scoped></style>
