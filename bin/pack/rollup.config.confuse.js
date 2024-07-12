import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import image from "@rollup/plugin-image";
import postcss from "rollup-plugin-postcss";
import Obfuscator from "rollup-plugin-obfuscator";

export default {
  input: "./src/FFCesium/core/index.js", // 输入文件
  output: {
    file: "public/lastVersion/FFCesium.confuse.js", // 输出文件
    //format: "cjs", // 打包格式为cjs
    format: "es",
    exports: "default", // 或者 'default'
  },
  external: ["cesium", "cesium-navigation-es6", "@turf/turf", "vue"],
  plugins: [
    Obfuscator(),
    nodeResolve(), // 解析npm模块
    commonjs(), // 将CommonJS模块转为可被Rollup处理的格式
    image(), //支持打包图片
    postcss({
      extract: false, // 提取到单独的 CSS 文件
      minimize: true, // 压缩 CSS
    }), //支持打包css
  ],
};
