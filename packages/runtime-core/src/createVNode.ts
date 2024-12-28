import { isString, ShapeFlags } from "@tiny_vue/shared";

export function createVNode(type, props, children?) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    key: props?.key, // diff算法需要的key
    el: null, // 虚拟节点对应的真实节点
    shapeFlag,
  };

  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
}

export function isVNode(value: any) {
  return value ? value.__v_isVNode === true : false;
}

export function isSameVNode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
