import { isObject } from "@tiny_vue/shared";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constant";

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.IS_SHALLOW]?: boolean;
  [ReactiveFlags.RAW]?: any;
}

/**
 * 原始对象映射响应式对象
 */
const reactiveMap: WeakMap<Target, any> = new WeakMap();

/**
 * 将原始对象转换为响应式对象
 * @param target 转换成响应式对象的原始对象
 * @returns 响应式对象
 */
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap);
}

/**
 * 创建响应式对象
 * @param target 原始对象
 * @param mutableHandlers proxy handler, get set 等方法
 * @returns 响应式对象
 */
function createReactiveObject(
  target: Target,
  mutableHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  // reactive 作用于对象
  if (!isObject(target)) {
    return;
  }

  // 防止响应式对象被再次套一层
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 防止嵌套代理
  const existProxy = proxyMap.get(target);
  if (existProxy) {
    return existProxy;
  }

  let proxy = new Proxy(target, mutableHandlers);

  proxyMap.set(target, proxy);

  return proxy;
}

export function isReactive(value: unknown): boolean {
  if (isReadonly(value)) {
    return isReactive((value as Target)[ReactiveFlags.RAW]);
  }

  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}

export function isReadonly(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY]);
}

export function isShallow(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_SHALLOW]);
}

export function toReactive(v) {
  return isObject(v) ? reactive(v) : v;
}
