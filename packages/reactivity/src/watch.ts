import { isFunction, isObject, isReactive } from "@tiny_vue/shared";
import { ReactiveEffect } from "./effect";
import { isRef } from "./ref";

export function watch(source, cb, options = {} as any) {
  return doWatch(source, cb, options);
}

export function watchEffect(source, options = {}) {
  return doWatch(source, null, options as any);
}

function doWatch(source, cb, { deep, immediate }) {
  const reactiveGetter = (source) => traverse(source, deep ? undefined : 1);
  let getter;

  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }

  let old;

  const job = () => {
    if (cb) {
      const newValue = effect.run();
      cb(newValue, old);
      old = newValue;
    } else {
      effect.run();
    }
  };

  const effect = new ReactiveEffect(getter, job);

  if (cb) {
    if (immediate) {
      job();
    } else {
      old = effect.run();
    }
  } else {
    effect.run();
  }

  const unwatch = () => {
    effect.stop();
  };

  return unwatch;
}

function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  if (!isObject(source)) {
    return source;
  }

  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    currentDepth++;
  }

  if (seen.has(source)) {
    return source;
  }

  for (const key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }

  return source;
}
