import { DirtyLevels } from "./constant";

/**
 * 全局记录当前的副作用
 */
export let activeEffect;

export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });

  // 先运行一次
  _effect.run();

  if (options) {
    Object.assign(_effect, options);
  }

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

function preCleanEffect(effect) {
  effect._depsLength = 0;
  effect._trackId++;
}

function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    for (let index = effect._depsLength; index < effect.deps.length; index++) {
      cleanDepEffect(effect.deps[index], effect);
    }

    effect.deps.length = effect._depsLength;
  }
}

export class ReactiveEffect {
  _trackId = 0; // 用于记录当前effect执行了几次
  _depsLength = 0;
  _running = 0;
  deps = [];

  _dirtyLevels = DirtyLevels.Dirty;

  public active = true;

  constructor(public fn, public scheduler) {}

  public get dirty() {
    return this._dirtyLevels === DirtyLevels.Dirty;
  }

  public set dirty(v) {
    this._dirtyLevels = v ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }

  run() {
    this._dirtyLevels = DirtyLevels.NoDirty;

    if (!this.active) {
      return this.fn();
    }

    const prevEffect = activeEffect;

    try {
      activeEffect = this;

      // effect重新执行前，需要将上一次依赖情况清理
      preCleanEffect(this);
      this._running++;
      return this.fn(); // 收集依赖
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = prevEffect;
    }
  }
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect);
  if (dep.size === 0) {
    dep.cleanup();
  }
}

/**
 * 追踪副作用
 * @param effect 副作用
 * @param dep
 */
export function trackEffect(dep) {
  // 重新收集，不需要的移除
  // console.log(dep, activeEffect);

  if (dep.get(activeEffect) !== activeEffect._trackId) {
    dep.set(activeEffect, activeEffect._trackId);
    let oldDep = activeEffect.deps[activeEffect._depsLength];

    if (oldDep !== dep) {
      if (oldDep) {
        // 删除旧的
        cleanDepEffect(oldDep, activeEffect);
      }
      activeEffect.deps[activeEffect._depsLength++] = dep;
    } else {
      activeEffect._depsLength++;
    }
  }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect._dirtyLevels < DirtyLevels.Dirty) {
      effect._dirtyLevels = DirtyLevels.Dirty;
    }

    if (!effect._running) {
      if (effect.scheduler) {
        effect.scheduler();
      }
    }
  }
}
