<template>
  <div style="width: 100%; margin-bottom: 60px">
    <MapSeniorItem menuName="地图场景" :menuConfigs="mapSeniorMenuConfigs"></MapSeniorItem>
  </div>
</template>
<script setup lang="ts">
  import MapSeniorItem from "@/components/common/MapSeniorItem/index.vue";
  import { mapSeniorMenuConfigs } from "./config.js";
</script>

<style scoped></style>
