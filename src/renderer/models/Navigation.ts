import {Vec2} from "paintvec"
import {observable} from "mobx"

export
class Navigation {
  @observable translation = new Vec2(0)
  @observable scale = 1
  @observable rotation = 0
  @observable horizontalFlip = false
}
