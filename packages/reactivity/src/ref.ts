import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";

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

  get value() {
    trackRefValue(this);

    return this._value;
  }

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
