import { isFunction } from "@tiny_vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);

  let getter;
  let setter;

  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}

class ComputedRefImpl {
  public _value;
  public effect;
  public dep;

  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // 计算属性依赖的值变化了，应该触发渲染
        triggerRefValue(this);
      }
    );
  }

  get value() {
    // 处理性能
    if (this.effect.dirty) {
      this._value = this.effect.run();

      // 如果在effect中访问计算属性，计算属性应该收集此effect
      trackRefValue(this);
    }

    return this._value;
  }
  set value(v) {
    this.setter(v);
  }
}
