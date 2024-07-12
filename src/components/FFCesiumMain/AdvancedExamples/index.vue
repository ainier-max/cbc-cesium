<template>
  <div style="width: 100%; margin-bottom: 60px">
    <FFMenuItem
      menuName="高级示例"
      :menuConfigs="advancedExamplesMenuConfigs"
    ></FFMenuItem>
  </div>
</template>
<script setup lang="ts">
import FFMenuItem from "@/components/common/FFMenuItem/index.vue";
import { advancedExamplesMenuConfigs } from "./config.js";
</script>

<style scoped></style>
