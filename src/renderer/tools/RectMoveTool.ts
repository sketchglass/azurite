import * as React from "react"
import {reaction, observable, computed, action} from "mobx"
import {observer} from "mobx-react"
import {Vec2, Rect, Transform} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'

export
enum DragType {
  None,
  Translate,
  MoveTopLeft,
  MoveTopCenter,
  MoveTopRight,
  MoveCenterRight,
  MoveBottomRight,
  MoveBottomCenter,
  MoveBottomLeft,
  MoveCenterLeft,
  Rotate,
}

abstract class RectMoveTool extends Tool {
  abstract handleRadius: number

  dragType = DragType.None

  startRectPos = new Vec2()
  startQuadPos = new Vec2()
  startTranslatePos = new Vec2()

  originalRect = new Rect()

  lastTranslation = new Vec2()
  lastRect = new Rect()
  lastAdditionalTransform = new Transform()

  @observable translation = new Vec2()
  @observable rect = new Rect()
  @observable additionalTransform = new Transform()
  @observable hasRect = false

  resetRect(rect?: Rect) {
    if (rect) {
      this.lastTranslation = this.translation = new Vec2()
      this.lastRect = this.rect = this.originalRect = rect
      this.lastAdditionalTransform = this.additionalTransform = new Transform()
      this.hasRect = true
    } else {
      this.hasRect = false
    }
  }

  @computed get transformToRect() {
    return this.additionalTransform.translate(this.translation).invert() || new Transform()
  }

  @computed get normalizedRect() {
    return normalizeFlippedRect(this.rect)
  }

  @computed get transform() {
    const rectToRect = Transform.rectToRect(this.originalRect, this.rect)
    return rectToRect.merge(this.additionalTransform).translate(this.translation)
  }

  @computed get lastQuad() {
    return this.lastRect.vertices().map(v => v.transform(this.lastAdditionalTransform)) as [Vec2, Vec2, Vec2, Vec2]
  }

  @action start(ev: ToolPointerEvent) {
    if (!this.hasRect) {
      this.dragType = DragType.None
      return
    }

    const rectPos = this.startRectPos = ev.picturePos.transform(this.transformToRect).round()
    this.startTranslatePos = ev.picturePos.round()
    this.startQuadPos = ev.picturePos.sub(this.translation)

    this.lastTranslation = this.translation
    this.lastRect = this.rect
    this.lastAdditionalTransform = this.additionalTransform

    const [topLeft, topRight, bottomRight, bottomLeft] = this.originalRect.vertices().map(
      v => v.transform(this.transform).transform(this.renderer.transformFromPicture)
    )

    const handlePoints = new Map<DragType, Vec2>([
      [DragType.MoveTopLeft, topLeft],
      [DragType.MoveTopCenter, topLeft.add(topRight).divScalar(2)],
      [DragType.MoveTopRight, topRight],
      [DragType.MoveCenterRight, topRight.add(bottomRight).divScalar(2)],
      [DragType.MoveBottomRight, bottomRight],
      [DragType.MoveBottomCenter, bottomRight.add(bottomLeft).divScalar(2)],
      [DragType.MoveBottomLeft, bottomLeft],
      [DragType.MoveCenterLeft, bottomLeft.add(topLeft).divScalar(2)],
    ])

    for (const [dragType, handlePos] of handlePoints) {
      if (ev.rendererPos.sub(handlePos).length() <= this.handleRadius * 1.5 * devicePixelRatio) {
        this.dragType = dragType
        return
      }
    }
    if (normalizeFlippedRect(this.rect).includes(rectPos)) {
      this.dragType = DragType.Translate
    } else {
      this.dragType = DragType.Rotate
    }
  }

  @action move(ev: ToolPointerEvent) {
    const rectPos = ev.picturePos.transform(this.transformToRect).round()
    const rectOffset = rectPos.sub(this.startRectPos)
    const quadPos = ev.picturePos.sub(this.lastTranslation)
    const translatePos = ev.picturePos.round()

    const keepRatio = ev.shiftKey
    const perspective = ev.ctrlKey || ev.metaKey

    switch (this.dragType) {
      case DragType.None:
        return
      case DragType.Translate: {
        const translateOffset = translatePos.sub(this.startTranslatePos)
        this.translation = this.lastTranslation.add(translateOffset)
        break
      }
      case DragType.MoveTopLeft:
        if (perspective) {
          this.resizeQuad(0, quadPos)
        } else {
          this.resizeRect(-rectOffset.x, -rectOffset.y, new Vec2(0, 0), keepRatio)
        }
        break
      case DragType.MoveTopCenter:
        this.resizeRect(undefined, -rectOffset.y, new Vec2(0.5, 0), keepRatio)
        break
      case DragType.MoveTopRight:
        if (perspective) {
          this.resizeQuad(1, quadPos)
        } else {
          this.resizeRect(rectOffset.x, -rectOffset.y, new Vec2(1, 0), keepRatio)
        }
        break
      case DragType.MoveCenterRight:
        this.resizeRect(rectOffset.x, undefined, new Vec2(1, 0.5), keepRatio)
        break
      case DragType.MoveBottomRight:
        if (perspective) {
          this.resizeQuad(2, quadPos)
        } else {
          this.resizeRect(rectOffset.x, rectOffset.y, new Vec2(1, 1), keepRatio)
        }
        break
      case DragType.MoveBottomCenter:
        this.resizeRect(undefined, rectOffset.y, new Vec2(0.5, 1), keepRatio)
        break
      case DragType.MoveBottomLeft:
        if (perspective) {
          this.resizeQuad(3, quadPos)
        } else {
          this.resizeRect(-rectOffset.x, rectOffset.y, new Vec2(0, 1), keepRatio)
        }
        break
      case DragType.MoveCenterLeft:
        this.resizeRect(-rectOffset.x, undefined, new Vec2(0, 0.5), keepRatio)
        break
      case DragType.Rotate: {
        const center = this.lastRect.center.transform(this.lastAdditionalTransform)
        const origAngle = this.startQuadPos.sub(center).angle()
        const angle = quadPos.sub(center).angle()
        let rotation = angle - origAngle
        if (keepRatio) {
          const deg45 = Math.PI * 0.25
          rotation = Math.round(rotation / deg45) * deg45
        }
        const rotationTransform = Transform.translate(center.neg()).rotate(rotation).translate(center)
        this.additionalTransform = this.lastAdditionalTransform.merge(rotationTransform)
        break
      }
    }
  }

  private resizeRect(diffWidth: number|undefined, diffHeight: number|undefined, origin: Vec2, keepRatio: boolean) {
    if (keepRatio) {
      const wToH = this.lastRect.height / this.lastRect.width
      const hToW = this.lastRect.width / this.lastRect.height

      const {width, height} = this.lastRect
      const newWidth = width + diffWidth
      const newHeight = height + diffHeight
      if (diffHeight == undefined || newWidth / width < newHeight / height) {
        diffHeight = newWidth * wToH - height
      } else {
        diffWidth = newHeight * hToW - width
      }
    }
    const diff = new Vec2(diffWidth || 0, diffHeight || 0)
    const topLeftDiff = diff.mul(new Vec2(1).sub(origin))
    const bottomRightDiff = diff.mul(origin)
    const {topLeft, bottomRight} = this.lastRect
    this.rect = new Rect(topLeft.sub(topLeftDiff), bottomRight.add(bottomRightDiff))
  }

  private resizeQuad(vertexIndex: number, newVertex: Vec2) {
    const newQuad = [...this.lastQuad]
    newQuad[vertexIndex] = newVertex
    const transform = Transform.quadToQuad(this.lastQuad, newQuad as [Vec2, Vec2, Vec2, Vec2])
    if (!transform) {
      return
    }
    this.additionalTransform = this.lastAdditionalTransform.merge(transform)
  }

  end() {
    this.dragType = DragType.None
  }
}

function normalizeFlippedRect(rect: Rect) {
  const {left, right, top, bottom} = rect
  const trueLeft = Math.min(left, right)
  const trueRight = Math.max(left, right)
  const trueTop = Math.min(top, bottom)
  const trueBottom = Math.max(top, bottom)
  return new Rect(new Vec2(trueLeft, trueTop), new Vec2(trueRight, trueBottom))
}

export default RectMoveTool
