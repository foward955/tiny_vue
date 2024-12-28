import { createRenderer } from "@tiny_vue/runtime-core";
import { nodeOps } from "./nodeOps";
import patchProp from "./patchProp";

export const renderOptions = Object.assign({ patchProp }, nodeOps);

export const render = (vnode, container) => {
  createRenderer(renderOptions).render(vnode, container);
};

export * from "@tiny_vue/runtime-core";
