import { ReactiveFlags } from "./constant";
import { track, trigger } from "./dep";

class MutableHandler {
  constructor() {}

  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    // 收集这个对象的这个属性，并且与effect关联
    track(target, key);

    return Reflect.get(target, key, receiver);
  }

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
