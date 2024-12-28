import { isObject } from "@tiny_vue/shared";
import { createVNode, isVNode } from "./createVNode";

export function h(type, propsOrChildren?, children?) {
  let l = arguments.length;

  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // 属性或虚拟节点

      if (isVNode(propsOrChildren)) {
        // h('div', h('a'))
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      // 文本或数组
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }

    return createVNode(type, propsOrChildren, children);
  }
}
