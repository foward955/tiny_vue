import { isObject } from "@tiny_vue/shared";
import { createVNode, isVnode } from "./createVNode";

export function h(type, propsOrChildren?, children?) {
  let l = arguments.length;

  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // 属性或虚拟节点

      if (isVnode(propsOrChildren)) {
        // h('div', h('a'))
        return createVNode(type, null, [propsOrChildren]);
      } else {
        return createVNode(type, propsOrChildren);
      }
    }

    // 文本或数组
    return createVNode(type, null, [propsOrChildren]);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l === 3 && isVnode(children)) {
      children = [children];
    }

    return createVNode(type, propsOrChildren, children);
  }
}
