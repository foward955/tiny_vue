export default function patchEvent(el, name, value) {
  const invokers = el._vei || (el._vei = {});

  const eventName = name.slice(2).toLowerCase();

  const existInvoker = invokers[name];

  if (value && existInvoker) {
    return (existInvoker.value = value);
  }
  if (value) {
    const invoker = (invokers[name] = createInvoker(value));
    return el.addEventListener(eventName, invoker);
  }
  if (existInvoker) {
    el.addEventListener(eventName, existInvoker);
    invokers[name] = undefined;
  }
}

function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  invoker.value = value;

  return invoker;
}
