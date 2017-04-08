import {Rect} from 'paintvec'

export default
class Dirtiness {
  private _whole = false
  private _rect: Rect|undefined

  get whole() {
    return this._whole
  }
  get rect() {
    if (!this._whole) {
      return this._rect
    }
  }
  get dirty() {
    return this._whole || !!this.rect
  }

  clear() {
    this._whole = false
    this._rect = undefined
  }
  addWhole() {
    this._whole = true
    this._rect = undefined
  }
  addRect(rect: Rect) {
    if (this._rect) {
      this._rect = this._rect.union(rect)
    } else {
      this._rect = rect
    }
  }
}
