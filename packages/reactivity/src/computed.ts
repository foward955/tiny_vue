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

/**
 * ComputedRefImpl 对象，只有在访问 .value 时才会计算值，并缓存结果，
 * 如果effect依赖的响应式数据有了变化，则需要重新 执行effect.run() 获得返回值缓存起来。
 */
class ComputedRefImpl {
  public _value;
  public effect: ReactiveEffect;
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
