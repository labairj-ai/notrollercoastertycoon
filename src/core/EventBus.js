export class EventBus {
  #listeners = new Map();

  on(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const list = this.#listeners.get(event);
    if (list) {
      const i = list.indexOf(fn);
      if (i !== -1) list.splice(i, 1);
    }
  }

  emit(event, data) {
    this.#listeners.get(event)?.forEach(fn => fn(data));
  }
}
