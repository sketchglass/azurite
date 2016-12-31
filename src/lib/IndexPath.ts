
export default
class IndexPath {

  constructor(public indices: number[] = []) {
  }

  get length() {
    return this.indices.length
  }

  get parent() {
    if (this.indices.length > 0) {
      return new IndexPath(this.indices.slice(0, -1))
    }
  }

  at(i: number) {
    return this.indices[i]
  }

  get last() {
    return this.indices[this.indices.length - 1]
  }

  slice(start: number, end: number = this.length) {
    return new IndexPath(this.indices.slice(start, end))
  }

  child(index: number) {
    return new IndexPath([...this.indices, index])
  }

  equals(other: IndexPath) {
    return this.compare(other) == 0
  }

  compare(other: IndexPath): number {
    if (this.length == 0 && other.length == 0) {
      return 0
    } else if (this.length == 0) {
      return -1
    } else if (other.length == 0) {
      return 1
    } else {
      const diff = this.at(0) - other.at(0)
      if (diff == 0) {
        return this.slice(1).compare(other.slice(1))
      } else {
        return diff
      }
    }
  }
}
