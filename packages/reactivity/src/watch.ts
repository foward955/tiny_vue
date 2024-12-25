import { isObject } from "@tiny_vue/shared";
import { ReactiveEffect } from "./effect";

export function watch(source, cb, options = {} as any) {
  return doWatch(source, cb, options);
}

function doWatch(source, cb, { deep }) {
  const reactiveGetter = (source) => traverse(source, deep ? undefined : 1);
  let getter = () => reactiveGetter(source);

  let old;

  const effect = new ReactiveEffect(getter, () => {
    const newValue = effect.run();
    cb(newValue, old);
    old = newValue;
  });

  old = effect.run();
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
