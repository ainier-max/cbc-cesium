<template>
  <template v-if="item.state == 'outline'">
    <img class="lefttop" :src="outlinelefttop" />
    <img class="leftbottom" :src="outlineleftbottom" />
    <img class="righttop" :src="outlinerighttop" />
    <img class="rightbottom" :src="outlinerightbottom" />
  </template>

  <template v-else-if="item.state == 'blue'">
    <img class="lefttop" :src="bluelefttop" />
    <img class="leftbottom" :src="blueleftbottom" />
    <img class="righttop" :src="bluerighttop" />
    <img class="rightbottom" :src="bluerightbottom" />
  </template>

  <template v-else-if="item.state == 'yellow'">
    <img class="lefttop" :src="yellowlefttop" />
    <img class="leftbottom" :src="yellowleftbottom" />
    <img class="righttop" :src="yellowrighttop" />
    <img class="rightbottom" :src="yellowrightbottom" />
  </template>

  <template v-else-if="item.state == 'orange'">
    <img class="lefttop" :src="orangelefttop" />
    <img class="leftbottom" :src="orangeleftbottom" />
    <img class="righttop" :src="orangerighttop" />
    <img class="rightbottom" :src="orangerightbottom" />
  </template>

  <template v-else-if="item.state == 'red'">
    <img class="lefttop" :src="redlefttop" />
    <img class="leftbottom" :src="redleftbottom" />
    <img class="righttop" :src="redrighttop" />
    <img class="rightbottom" :src="redrightbottom" />
  </template>

  <template v-else>
    <img class="lefttop" :src="normallefttop" />
    <img class="leftbottom" :src="normalleftbottom" />
    <img class="righttop" :src="normalrighttop" />
    <img class="rightbottom" :src="normalrightbottom" />
  </template>
</template>

<script setup>
  import { ref, onMounted, nextTick } from "vue";

  import normallefttop from "./images/normallefttop.png";
  import normalleftbottom from "./images/normalleftbottom.png";
  import normalrighttop from "./images/normalrighttop.png";
  import normalrightbottom from "./images/normalrightbottom.png";

  import outlinelefttop from "./images/outlinelefttop.png";
  import outlineleftbottom from "./images/outlineleftbottom.png";
  import outlinerighttop from "./images/outlinerighttop.png";
  import outlinerightbottom from "./images/outlinerightbottom.png";

  import bluerighttop from "./images/bluerighttop.png";
  import bluelefttop from "./images/bluelefttop.png";
  import blueleftbottom from "./images/blueleftbottom.png";
  import bluerightbottom from "./images/bluerightbottom.png";

  import yellowlefttop from "./images/yellowlefttop.png";
  import yellowleftbottom from "./images/yellowleftbottom.png";
  import yellowrighttop from "./images/yellowrighttop.png";
  import yellowrightbottom from "./images/yellowrightbottom.png";

  import orangelefttop from "./images/orangelefttop.png";
  import orangeleftbottom from "./images/orangeleftbottom.png";
  import orangerighttop from "./images/orangerighttop.png";
  import orangerightbottom from "./images/orangerightbottom.png";

  import redlefttop from "./images/redlefttop.png";
  import redleftbottom from "./images/redleftbottom.png";
  import redrighttop from "./images/redrighttop.png";
  import redrightbottom from "./images/redrightbottom.png";

  const props = defineProps({
    item: {
      type: Object,
      required: true
    }
  });
  const item = ref(null);
  item.value = props.item;
</script>

<style scoped>
  .lefttop {
    position: absolute;
    left: 0px;
    top: 0px;
    margin: 0px;
    padding: 0px;
    width: 7px;
    height: 7px;
  }
  .leftbottom {
    position: absolute;
    left: 0px;
    bottom: 0px;
    margin: 0px;
    padding: 0px;
    width: 7px;
    height: 7px;
  }

  .righttop {
    position: absolute;
    right: 0px;
    top: 0px;
    margin: 0px;
    padding: 0px;
    width: 7px;
    height: 7px;
  }
  .rightbottom {
    position: absolute;
    right: 0px;
    bottom: 0px;
    margin: 0px;
    padding: 0px;
    width: 7px;
    height: 7px;
  }
</style>
