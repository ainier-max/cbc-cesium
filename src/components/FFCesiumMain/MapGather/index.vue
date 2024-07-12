<template>
  <div style="width: 100%; margin-bottom: 60px">
    <FFMenuItem
      menuName="元素采集"
      :menuConfigs="elementGatherMenuConfigs"
    ></FFMenuItem>

    <FFMenuItem
      menuName="元素修改"
      :menuConfigs="elementEditMenuConfigs"
    ></FFMenuItem>

    <FFMenuItem
      menuName="军事标绘采集"
      :menuConfigs="militaryPlottingGatherMenuConfigs"
    ></FFMenuItem>

    <FFMenuItem
      menuName="军事标绘修改"
      :menuConfigs="militaryPlottingEditMenuConfigs"
    ></FFMenuItem>
  </div>
</template>
<script setup lang="ts">
import FFMenuItem from "@/components/common/FFMenuItem/index.vue";
import {
  elementGatherMenuConfigs,
  elementEditMenuConfigs,
  militaryPlottingGatherMenuConfigs,
  militaryPlottingEditMenuConfigs,
} from "./config.js";
</script>

<style scoped></style>
