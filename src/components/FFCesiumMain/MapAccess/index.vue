<template>
  <div style="width: 100%">
    <FFMenuItem
      menuName="地图服务"
      :menuConfigs="mapServerMenuConfigs"
    ></FFMenuItem>

    <FFMenuItem
      menuName="数据服务"
      :menuConfigs="dataServerMenuConfigs"
    ></FFMenuItem>
  </div>
</template>
<script setup lang="ts">
import FFMenuItem from "@/components/common/FFMenuItem/index.vue";
import { mapServerMenuConfigs, dataServerMenuConfigs } from "./config.js";
</script>

<style scoped></style>
