import { ShapeFlags } from "@tiny_vue/shared";

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    setText: hostSetText,
    setElementText: hostElementSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // 可能是纯文本
      patch(null, children[i], container);
    }
  };

  const mountElement = (vnode, container) => {
    const { type, children, props, shapeFlag } = vnode;

    let el = hostCreateElement(type);

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostElementSetText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostInsert(el, container);
  };

  const patch = (n1, n2, container) => {
    // 两次一样的元素，则跳过
    if (n1 === n2) {
      return;
    }

    if (n1 === null) {
      mountElement(n2, container);
    }
  };

  // 多次调用render会进行虚拟节点的对比，再进行更新
  const render = (vnode, container) => {
    // 将虚拟节点变成真实节点进行渲染
    patch(container._vnode || null, vnode, container);

    container._vnode = vnode;
  };

  return {
    render,
  };
}
