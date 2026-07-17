import { defineConfig, type UserConfigExport } from "@tarojs/cli";
import path from "node:path";

export default defineConfig({
  projectName: "sugarpet-care-weapp-prototype",
  date: "2026-07-17",
  designWidth: 750,
  sourceRoot: "src",
  outputRoot: "dist",
  framework: "react",
  compiler: "webpack5",
  cache: { enable: false },
  plugins: [],
  defineConstants: {},
  copy: { patterns: [], options: {} },
  mini: {
    compile: {
      include: [path.resolve(__dirname, "../../../packages")],
    },
    postcss: {
      pxtransform: { enable: true, config: {} },
      url: { enable: true, config: { limit: 1024 } },
      cssModules: { enable: false, config: { namingPattern: "module", generateScopedName: "[name]__[local]___[hash:base64:5]" } },
    },
  },
} satisfies UserConfigExport<"webpack5">);
