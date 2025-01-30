import { Ref } from "@tiny_vue/reactivity";
import { isString, ShapeFlags } from "@tiny_vue/shared";

export type VNodeTypes = any; // TODO
export type VNodeProps = any; // TODO
export type VNodeNormalizedChildren = any; // TODO

export type RendererNode = any; // TODO
export type RendererElement = any; // TODO
export type ComponentPublicInstance = any; // TODO
export type ComponentInternalInstance = any; // TODO

export type VNodeRef =
  | string
  | Ref
  | ((
      ref: Element | ComponentPublicInstance | null,
      refs: Record<string, any>
    ) => void);

export type VNodeNormalizedRefAtom = {
  /**
   * component instance
   */
  i: ComponentInternalInstance;
  /**
   * Actual ref
   */
  r: VNodeRef;
  /**
   * setup ref key
   */
  k?: string;
  /**
   * refInFor marker
   */
  f?: boolean;
};

export type VNodeNormalizedRef =
  | VNodeNormalizedRefAtom
  | VNodeNormalizedRefAtom[];

export interface VNode<
  HostNode = RendererNode,
  HostElement = RendererElement,
  ExtraProps = { [key: string]: any }
> {
  __v_isVNode: true;

  type: VNodeTypes;
  props: (VNodeProps & ExtraProps) | null;
  key: PropertyKey | null;
  ref: VNodeNormalizedRef | null;

  children: VNodeNormalizedChildren;

  el: HostNode | null;

  /**
   * SFC only.
   * 是 Vue 实现 Scoped CSS 的关键机制，它通过编译时重写选择器和运行时注入唯一属性，确保组件样式隔离。
   */
  scopeId: string | null;

  // optimization only
  shapeFlag: number;
  patchFlag: number;
}

export function createVNode(type, props, children?): VNode {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  const vnode: VNode = {
    __v_isVNode: true,
    type,
    props,
    children,
    key: props?.key, // diff算法需要的key
    ref: props?.key, // TODO

    el: null, // 虚拟节点对应的真实节点
    shapeFlag,

    scopeId: null,
    patchFlag: 0,
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

export function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key;
}
