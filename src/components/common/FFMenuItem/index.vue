<template>
  <div style="width: 100%">
    <div
      style="
        margin-bottom: -10px;
        padding-top: 20px;
        color: gray;
        font-size: 20px;
      "
    >
      <span
        style="
          padding-left: 30px;
          margin-bottom: -10px;
          padding-top: 20px;
          color: gray;
          font-size: 20px;
        "
        >{{ menuName }}</span
      >
    </div>

    <div style="padding-left: 30px; padding-right: 30px">
      <el-divider></el-divider>
    </div>

    <div style="width: 100%">
      <div>
        <ul style="padding-inline-start: 10px; padding-right: 5px">
          <li
            v-for="(item, index) in menuConfigs"
            :key="index"
            style="
              cursor: pointer;
              padding-left: 40px;
              display: inline-block;
              list-style: none;
              padding-bottom: 30px;
            "
          >
            <div
              style="background-color: white; text-align: center"
              class="showpic"
              @click="goPath(item)"
            >
              <div style="line-height: 30px; font-size: 16px">
                {{ item.title }}
              </div>
              <div>
                <img
                  style="width: 200px; height: 160px; display: block"
                  :src="item.img"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { provide, ref, nextTick, onMounted } from "vue";

const props = withDefaults(
  defineProps<{
    menuName: string;
    menuConfigs: Array<object>;
  }>(),
  {
    menuName: "",
    menuConfigs: [],
  }
);

console.log("获得的menuConfigs", props.menuConfigs);

import { useRoute, useRouter } from "vue-router";
const router = useRouter();
const goPath = (item) => {
  console.log("goPath--item", item);
  const { href } = router.resolve({
    path: "/mapCode",
    query: {
      key: item.key,
      url: item.url,
    },
  });
  window.open(href, "_blank");
};
</script>

<style scoped></style>
