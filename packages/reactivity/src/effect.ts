export let activeEffect;

export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });

  _effect.run();

  return _effect;
}

class ReactiveEffect {
  _trackId = 0; // 用于记录当前effect执行了几次
  deps = [];
  _depsLength = 0;
  public active = true;

  constructor(public fn, public scheduler) {}

  run() {
    if (!this.active) {
      return this.fn();
    }

    const prevEffect = activeEffect;

    try {
      activeEffect = this;

      return this.fn();
    } finally {
      activeEffect = prevEffect;
    }
  }
}

export function trackEffect(effect, dep) {
  dep.set(effect, effect._trackId);
  // effect和dep关联起来
  effect.deps[effect._depsLength++] = dep;
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) {
      effect.scheduler();
    }
  }
}
