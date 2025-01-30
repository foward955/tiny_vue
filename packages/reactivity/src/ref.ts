import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";

declare const RefSymbol: unique symbol;
export declare const RawSymbol: unique symbol;

export interface Ref<T = any, S = T> {
  get value(): T;
  set value(_: S);
  /**
   * Type differentiator only.
   * We need this to be in public d.ts but don't want it to show up in IDE
   * autocomplete, so we use a private Symbol instead.
   */
  [RefSymbol]: true;
}

export function ref(target) {
  return createRef(target);
}

function createRef(target) {
  return new RefImpl(target);
}

class RefImpl {
  __v_isRef = true;
  _value;
  dep;

  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }

  /**
   * 通过ref定义的变量，在get value属性时触发依赖收集
   */
  get value() {
    trackRefValue(this);

    return this._value;
  }

  /**
   * 通过ref定义的变量，在set value属性时触发更新派发
   */
  set value(newVal) {
    if (this.rawValue !== newVal) {
      this.rawValue = newVal;
      this._value = newVal;
      triggerRefValue(this);
    }
  }
}

export function trackRefValue(ref) {
  if (activeEffect) {
    if (!ref.dep) {
      ref.dep = new Map();
      ref.dep.name = "undefined";
      ref.dep.cleanup = () => {
        ref.dep = undefined;
      };
    }

    trackEffect(ref.dep);
  }
}

export function triggerRefValue(ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffects(dep);
  }
}

class ObjectRefImpl {
  constructor(public _object, public _key) {}

  get value() {
    return this._object[this._key];
  }

  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

export function toRefs(object) {
  const res = {};

  for (const key in object) {
    res[key] = toRef(object, key);
  }

  return res;
}

export function proxyRefs(objectWithRef) {
  return new Proxy(objectWithRef, {
    get(target, key, receiver) {
      let res = Reflect.get(target, key, receiver);

      return receiver.__v_isRef ? res.value : res;
    },
    set(target, key, value, receiver) {
      const old = target[key];

      if (old.__v_isRef) {
        old.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}

export function isRef(v) {
  return v && v.__v_isRef;
}
