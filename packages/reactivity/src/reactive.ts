import { isObject } from "@tiny_vue/shared";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constant";

const reactiveMap = new WeakMap();

export function reactive<Target extends object>(target: Target) {
  return createReactiveObject(target, mutableHandlers);
}

function createReactiveObject(target: any, mutableHandlers: ProxyHandler<any>) {
  // reactive 作用于对象
  if (!isObject(target)) {
    return;
  }

  // 防止响应式对象被再次套一层
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 防止嵌套代理
  const existProxy = reactiveMap.get(target);
  if (existProxy) {
    return existProxy;
  }

  let proxy = new Proxy(target, mutableHandlers);

  reactiveMap.set(target, proxy);

  return proxy;
}
