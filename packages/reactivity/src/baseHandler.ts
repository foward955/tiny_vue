import { isObject } from "@tiny_vue/shared";
import { ReactiveFlags } from "./constant";
import { track, trigger } from "./dep";
import { reactive } from "./reactive";

class MutableHandler {
  constructor() {}

  // 访问响应式对象的时候开始追踪
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    // 收集这个对象的这个属性，并且与effect关联
    track(target, key);

    let result = Reflect.get(target, key, receiver);
    // 对内部对象进行代理
    if (isObject(result)) {
      return reactive(result);
    }

    return result;
  }

  /**
   * 修改属性也会导致依赖收集，检查此属性映射的副作用情况
   * @param target
   * @param key
   * @param value
   * @param receiver
   * @returns
   */
  set(target, key, value, receiver) {
    let oldValue = target[key];

    let result = Reflect.set(target, key, value, receiver);

    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }

    return result;
  }
}

export const mutableHandlers = new MutableHandler();
