<template>
  <div style="width: 100%; margin-bottom: 60px">
    <MapSeniorItem menuName="前端示例" :menuConfigs="FrontendExamplesMenuConfigs"></MapSeniorItem>
  </div>
</template>
<script setup lang="ts">
  import MapSeniorItem from "@/components/common/MapSeniorItem/index.vue";
  import { FrontendExamplesMenuConfigs } from "./config.js";
</script>

<style scoped></style>
