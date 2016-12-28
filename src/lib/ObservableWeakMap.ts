import {observable} from "mobx"

class ObservableWeakMapContainer<T> {
  @observable value: T
}

export default
class ObservableWeakMap<K, V> {
  weakMap = new WeakMap<K, ObservableWeakMapContainer<V>>()

  has(key: K) {
    return this.weakMap.has(key)
  }

  set(key: K, value: V) {
    let container = this.weakMap.get(key)
    if (!container) {
      container = new ObservableWeakMapContainer<V>()
      this.weakMap.set(key, container)
    }
    container.value = value
  }

  get(key: K) {
    let container = this.weakMap.get(key)
    if (container) {
      return container.value
    }
  }
}
