import { ReactiveFlags } from "packages/reactivity/src/constant";

export function isObject(target: any) {
  return target !== null && typeof target === "object";
}

export function isFunction(v) {
  return typeof v === "function";
}

export function isReactive(v) {
  return v && v[ReactiveFlags.IS_REACTIVE];
}

export function isString(v) {
  return typeof v === "string";
}

export * from "./shapeFlags";
