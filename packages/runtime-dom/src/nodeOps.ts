// 节点元素的属性操作 class style

export const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement(type) {
    return document.createElement(type);
  },

  createText: (text) => document.createTextNode(text),

  setText: (node, text) => {
    node.nodeValue = text;
  },

  setElementText: (el, text) => {
    el.textContent = text;
  },

  parentNode: (node) => node.parentNode as Element | null,

  nextSibling: (node) => node.nextSibling,
};
