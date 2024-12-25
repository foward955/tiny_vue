export function isObject(target: any) {
  return target !== null && typeof target === "object";
}

export function isFunction(v) {
  return typeof v === "function";
}
