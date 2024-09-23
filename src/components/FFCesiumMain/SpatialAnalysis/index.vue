<template>
  <div style="width: 100%; margin-bottom: 60px">
    <FFMenuItem menuName="空间分析" :menuConfigs="spatialAnalysisMenuConfigs"></FFMenuItem>
  </div>
</template>
<script setup lang="ts">
  import FFMenuItem from "@/components/common/FFMenuItem/index.vue";
  import { spatialAnalysisMenuConfigs } from "./config.js";
</script>

<style scoped></style>
