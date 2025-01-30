import { ShapeFlags } from "@tiny_vue/shared";
import { isSameVNodeType, VNode } from "./createVNode";

// Renderer Node can technically be any object in the context of core renderer
// logic - they are never directly operated on and always passed to the node op
// functions provided via options, so the internal constraint is really just
// a generic object.
export interface RendererNode {
  [key: string | symbol]: any;
}

export interface RendererElement extends RendererNode {}

// These functions are created inside a closure and therefore their types cannot
// be directly exported. In order to avoid maintaining function signatures in
// two places, we declare them once here and use them inside the closure.
type PatchFn = (
  n1: VNode | null, // null means this is a mount
  n2: VNode,
  container: RendererElement,
  anchor?: RendererNode | null
  // parentComponent?: ComponentInternalInstance | null,
  // parentSuspense?: SuspenseBoundary | null,
  // namespace?: ElementNamespace,
  // slotScopeIds?: string[] | null,
  // optimized?: boolean
) => void;

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

  const mountElement = (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => {
    const { type, children, props, shapeFlag } = vnode;

    let el = (vnode.el = hostCreateElement(type));

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

    hostInsert(el, container, anchor);
  };

  const processElement = (
    n1: VNode | null, // n1是旧vnode / null，用于与新vnode(n2)做对比；如果是n1为null，则是挂载n2
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => {
    // 如果是n1为null，则是挂载n2
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      // n1是旧vnode，用于与新vnode(n2)做对比
      patchElement(n1, n2, container);
    }
  };

  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  // vue3中有两种diff (靶向更新)
  // 当前为全量diff
  const patchKeyedChildren = (c1: any[], c2: any[], el) => {
    // 比较两儿子的差异更新el
    // appendChild removeChild insertBefore
    // [a,b,c,e,f,d]
    // [a,b,d,q,f,d]
    //
    // 1. 先从头开始比较，再从尾部开始比较，确定不一样元素的范围
    // 2.

    let i = 0; // 开始对比索引
    let e1 = c1.length - 1; // 旧vnode数组的尾部索引
    let e2 = c2.length - 1; // 新vnode数组的尾部索引

    // 1. sync from start
    // (a b) c
    // (a b) d e
    while (i <= e1 && i <= e2) {
      // 任何一个数组循环结束，就要终止比较
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }

    // 2. sync from end
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    // 3. common sequence + mount
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0
    if (i > e1) {
      // 新的多
      if (i <= e2) {
        let nextPos = e2 + 1;
        let anchor = c2[nextPos]?.el;

        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    }

    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1
    else if (i > e2) {
      // 新的少
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    }

    // 5. unknown sequence
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      const s1 = i; // prev starting index
      const s2 = i; // next starting index

      // 5.1 为新的vnode节点创建vnode key :vnode index 的map
      const keyToNewIndexMap = new Map();
      for (let index = s2; index <= e2; index++) {
        const nextChild = c2[index];

        keyToNewIndexMap.set(nextChild.key, index);
      }

      // 5.2 遍历旧vnode数组的节点，从新的vnode数组中找出旧节点key的索引，如果不存在，则需要卸载。
      // 如果存在，则记录旧索引（+1 避免0冲突）并更新
      // 记录的旧索引数组，之后用于计算最长递增子序列，用于降低节点移动次数
      let toBePatched = e2 - s2 + 1;
      const newIndexToOldMapIndex = new Array(toBePatched).fill(0);

      for (let index = s1; index <= e1; index++) {
        const v = c1[index];
        const newIndex = keyToNewIndexMap.get(v.key);

        if (newIndex === undefined) {
          // 新的里面未找到，则删除
          unmount(v);
        } else {
          newIndexToOldMapIndex[newIndex - s2] = index + 1; // 避免index为0的歧义
          patch(v, c2[newIndex], el);
        }
      }

      // 5.3 节点移动和挂载
      // 生成最长递增子序列，减少节点的移动次数
      let increasingSeq = getSequence(newIndexToOldMapIndex);
      let j = increasingSeq.length - 1;

      // 插入过程中新的多，需要挂载
      // let toBePatched = e2 - s2 + 1; // 倒序插入的个数
      for (let index = toBePatched - 1; index >= 0; index--) {
        let newIndex = s2 + index;
        let anchor = c2[newIndex + 1]?.el;
        let vnode = c2[newIndex];

        if (!vnode.el) {
          // 新增的
          patch(null, vnode, el, anchor);
        } else {
          if (index === increasingSeq[j]) {
            j--; // 优化
          } else {
            hostInsert(vnode.el, el, anchor);
          }
        }
      }
    }
  };

  /**
   * 算法重要 对比children: text array null
   *
   * 新      旧
   * text    array  删除旧的，设置文本内容
   * text    text   更新文本即可
   * text    null   更新文本即可
   * array   array  diff算法
   * array   text   清空文本，进行挂载
   * array   null   进行挂载
   * null    array  删除所有儿子
   * null    text   清空文本
   * null    null   无需处理
   */
  const patchChildren = (n1, n2, el) => {
    let c1 = n1.children;
    let c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const currShapeFlag = n2.shapeFlag;

    if (currShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }

      if (c1 !== c2) {
        hostElementSetText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (currShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff 算法

          patchKeyedChildren(c1, c2, el);
        } else {
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostElementSetText(el, "");
        }

        if (currShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  const patchElement = (n1: VNode, n2: VNode, container) => {
    // 1. 比较元素的差异，需要复用dom
    // 2. 比较属性和元素的子节点

    let el = (n2.el = n1.el); // 复用dom

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // 只针对某个属性处理
    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, el);
  };

  /**
   * 对新旧节点进行比对更新操作，对节点本身比对更新props等数据。如果有children，则递归进行这些操作。
   * @param n1 vnode | null
   * @param n2 vnode
   * @param container
   * @param anchor
   * @returns
   */
  const patch: PatchFn = (n1, n2, container, anchor = null) => {
    // 两次一样的元素，则跳过
    if (n1 === n2) {
      return;
    }

    // 策略是：如果vnode 类型不一致，卸载旧的vnode，即n1；
    // 并将n1设置为null，配合processElement的逻辑，挂载n2
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }

    const { type, ref, shapeFlag } = n2;
    switch (type) {
      case Text:
        break;
      // .....
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
        }
    }

    // 对元素处理
    processElement(n1, n2, container, anchor);
  };

  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  // 多次调用render会进行虚拟节点的对比，再进行更新
  const render = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    }

    // 将虚拟节点变成真实节点进行渲染
    patch(container._vnode || null, vnode, container);

    container._vnode = vnode;
  };

  return {
    render,
  };
}

function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
