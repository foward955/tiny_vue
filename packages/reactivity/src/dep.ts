import { activeEffect, trackEffect, triggerEffects } from "./effect";

/**
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
 */
const targetMap = new WeakMap();

export function createDep(cleanup, key) {
  const dep = new Map() as any;

  dep.cleanup = cleanup;
  dep.name = key; // 标识这个映射表服务于哪个属性

  return dep;
}

export function track(target, key) {
  // activeEffect 存在，说明key是在effect中访问的
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }

    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(
        key,
        (dep = createDep(() => {
          depsMap.delete(key);
        }, key)) // 后面用于清理不需要的属性
      );
    }

    // 将当前的effect放入dep映射表中，后续可以根据值的变化触发此dep中存放的effect
    trackEffect(activeEffect, dep);
  }

  console.log(targetMap);
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
