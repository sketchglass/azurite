import {observable, computed, action} from 'mobx'
import {Vec2, Rect, Transform} from 'paintvec'
import * as React from 'react'
import {UndoStack, UndoCommand} from '../models/UndoStack'
import {renderer} from '../views/Renderer'
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


class TransformChangeCommand implements UndoCommand {
  constructor(
    public tool: RectMoveTool,
    public oldTranslation: Vec2, public oldRect: Rect, public oldAdditionalTransform: Transform,
    public newTranslation: Vec2, public newRect: Rect, public newAdditionalTransform: Transform
  ) {}

  title = 'Change Transform'

  redo() {
    this.tool.translation = this.newTranslation
    this.tool.rect = this.newRect
    this.tool.additionalTransform = this.newAdditionalTransform
  }

  undo() {
    this.tool.translation = this.oldTranslation
    this.tool.rect = this.oldRect
    this.tool.additionalTransform = this.oldAdditionalTransform
  }
}

abstract class RectMoveTool extends Tool {
  abstract handleRadius: number
  @observable canRotate = true
  @observable canDistort = true
  @observable alwaysKeepsRatio = false

  dragType = DragType.None

  private startRectPos = new Vec2()
  private startQuadPos = new Vec2()
  private startTranslatePos = new Vec2()

  originalRect = new Rect()

  private lastTranslation = new Vec2()
  private lastRect = new Rect()
  private lastAdditionalTransform = new Transform()

  @observable translation = new Vec2()
  @observable rect = new Rect()
  @observable additionalTransform = new Transform()
  @observable hasRect = false

  @observable private _modal = false
  private readonly _modalUndoStack = new UndoStack()

  @computed get modal() {
    return this._modal
  }
  @computed get modalUndoStack() {
    return this._modalUndoStack
  }

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

  @computed private get transformToRect() {
    return this.additionalTransform.translate(this.translation).invert() || new Transform()
  }

  @computed get normalizedRect() {
    return Rect.fromTwoPoints(this.rect.topLeft, this.rect.bottomRight)
  }

  @computed get transform() {
    const rectToRect = Transform.rectToRect(this.originalRect, this.rect)
    return rectToRect.merge(this.additionalTransform).translate(this.translation)
  }

  @computed private get lastQuad() {
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
      v => v.transform(this.transform).transform(renderer.transformFromPicture)
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
    if (this.normalizedRect.includes(rectPos)) {
      this.dragType = DragType.Translate
    } else if (this.canRotate) {
      this.dragType = DragType.Rotate
    } else {
      this.dragType = DragType.None
    }
  }

  @action move(ev: ToolPointerEvent) {
    const rectPos = ev.picturePos.transform(this.transformToRect).round()
    const rectOffset = rectPos.sub(this.startRectPos)
    const quadPos = ev.picturePos.sub(this.lastTranslation)
    const translatePos = ev.picturePos.round()

    const keepRatio = this.alwaysKeepsRatio || ev.shiftKey
    const distorting = this.canDistort && (ev.ctrlKey || ev.metaKey)

    switch (this.dragType) {
      case DragType.None:
        return
      case DragType.Translate: {
        const translateOffset = translatePos.sub(this.startTranslatePos)
        this.translation = this.lastTranslation.add(translateOffset)
        break
      }
      case DragType.MoveTopLeft:
        if (distorting) {
          this.resizeQuad(0, quadPos)
        } else {
          this.resizeRect(-rectOffset.x, -rectOffset.y, new Vec2(0, 0), keepRatio)
        }
        break
      case DragType.MoveTopCenter:
        this.resizeRect(undefined, -rectOffset.y, new Vec2(0.5, 0), keepRatio)
        break
      case DragType.MoveTopRight:
        if (distorting) {
          this.resizeQuad(1, quadPos)
        } else {
          this.resizeRect(rectOffset.x, -rectOffset.y, new Vec2(1, 0), keepRatio)
        }
        break
      case DragType.MoveCenterRight:
        this.resizeRect(rectOffset.x, undefined, new Vec2(1, 0.5), keepRatio)
        break
      case DragType.MoveBottomRight:
        if (distorting) {
          this.resizeQuad(2, quadPos)
        } else {
          this.resizeRect(rectOffset.x, rectOffset.y, new Vec2(1, 1), keepRatio)
        }
        break
      case DragType.MoveBottomCenter:
        this.resizeRect(undefined, rectOffset.y, new Vec2(0.5, 1), keepRatio)
        break
      case DragType.MoveBottomLeft:
        if (distorting) {
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
      const newWidth = width + (diffWidth || 0)
      const newHeight = height + (diffHeight || 0)
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
    if (this.dragType !== DragType.None && this.modal) {
      const command = new TransformChangeCommand(
        this,
        this.lastTranslation, this.lastRect, this.lastAdditionalTransform,
        this.translation, this.rect, this.additionalTransform
      )
      this.modalUndoStack.push(command)
    }
    this.dragType = DragType.None
  }

  @action keyDown(ev: React.KeyboardEvent<HTMLElement>) {
    super.keyDown(ev)
    switch (ev.key) {
      case 'ArrowLeft':
        this.translation = this.translation.add(new Vec2(-1, 0))
        break
      case 'ArrowRight':
        this.translation = this.translation.add(new Vec2(1, 0))
        break
      case 'ArrowUp':
        this.translation = this.translation.add(new Vec2(0, -1))
        break
      case 'ArrowDown':
        this.translation = this.translation.add(new Vec2(0, 1))
        break
    }
  }

  startModal() {
    if (!this.modal) {
      this._modal = true
      this.modalUndoStack.clear()
    }
  }

  endModal() {
    if (this.modal) {
      this._modal = false
      this.modalUndoStack.clear()
    }
  }
}

export default RectMoveTool
