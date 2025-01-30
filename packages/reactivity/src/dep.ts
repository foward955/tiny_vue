import { activeEffect, trackEffect, triggerEffects } from "./effect";

type Dep = any;
type KeyToDepMap = Map<any, Dep>; // TODO: specify definition

/**
 * ```
 * 原始对象的effect链
 * WeakMap {
 *    { name: 'mk' }: Map {
 *      name: Map {
 *        ReactiveEffect1: _trackId,
 *        ReactiveEffect2: _trackId,
 *        ...
 *      },
 *      ...
 *    }
 * }
 * ```
 */
const targetMap: WeakMap<object, KeyToDepMap> = new WeakMap();

export function track(target: object, key: unknown) {
  // activeEffect 存在，说明key是在effect中访问的
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }

    let dep = depsMap.get(key);
    if (!dep) {
      dep = new Map() as any;

      dep.name = key;
      dep.cleanup = () => {
        depsMap.delete(key);
      }; // 后面用于清理不需要的属性

      depsMap.set(key, dep);
    }

    // 将当前的effect放入dep映射表中，后续可以根据值的变化触发此dep中存放的effect
    trackEffect(dep);
  }
}

/**
 * 触发副作用
 * @param target 未被代理的原始对象
 * @param key 对象的属性
 * @param value 新值
 * @param oldValue 旧值
 * @returns
 */
export function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }

  let dep = depsMap.get(key);
  if (dep) {
    // 修改的属性对应了effect
    triggerEffects(dep);
  }
}
