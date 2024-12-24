import minimist from "minimist";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import esbuild from "esbuild";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const args = minimist(process.argv.slice(2));

// 项目是哪个
const target = args._[0] || "reactivity";
// 格式
const format = args.f || "iife";
// 入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);

const pkg = require(`../packages/${target}/package.json`);

esbuild
  .context({
    entryPoints: [entry],
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
    bundle: true,
    platform: "browser",
    sourcemap: true,
    format,
    globalName: pkg.buildOptions?.name,
  })
  .then((ctx) => {
    console.log(`start dev`);

    // hot reload
    return ctx.watch();
  });
