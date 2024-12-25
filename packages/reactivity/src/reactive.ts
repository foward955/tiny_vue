import { isObject } from "@tiny_vue/shared";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constant";

/**
 * 原始对象映射响应式对象
 */
const reactiveMap = new WeakMap();

/**
 * 将原始对象转换为响应式对象
 * @param target 转换成响应式对象的原始对象
 * @returns 响应式对象
 */
export function reactive<Target extends object>(target: Target) {
  return createReactiveObject(target, mutableHandlers);
}

/**
 * 创建响应式对象
 * @param target 原始对象
 * @param mutableHandlers proxy handler, get set 等方法
 * @returns 响应式对象
 */
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
