export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  IS_SHALLOW = "__v_isShallow",
  RAW = "__v_raw",
}

export enum DirtyLevels {
  Dirty = 4, // 脏值，取值要运行计算属性
  NoDirty = 0, // 不脏就用上一次返回的结果
}
