import * as React from "react"
import "../../../styles/components/DraggableWindow.sass"

interface DraggableWindowProps {
  label: string
  height: number
  width: number
}
export const DraggableWindow = (props: DraggableWindowProps & { children?: React.ReactNode }) => {
  return (
    <div>
      {props.children}
    </div>
  )
}
interface WindowProps extends DraggableWindowProps {
  top: number
  left: number
  onDrag: (x: number, y: number) => void
  onDrop: (x: number, y: number) => void
}
class Window extends React.Component<WindowProps, void> {
  dragging = false
  window: HTMLDivElement
  label: HTMLDivElement
  offsetX: number
  offsetY: number
  constructor() {
    super()
  }
  componentDidMount() {
    const {left, top, height, width} = this.props
    this.window.style.height = `${height}px`
    this.window.style.width = `${width}px`
    this.label.addEventListener('pointerup', this.onPointerUp)
    this.label.addEventListener('pointerdown', this.onPointerDown)
    this.label.addEventListener('pointermove', this.onPointerMove)
    this.update(left, top)
  }
  componentWillReceiveProps(props: WindowProps) {
    const {left, top} = props
    this.update(left, top)
  }
  update(left: number, top: number) {
    this.window.style.left = `${left}px`
    this.window.style.top = `${top}px`
  }
  onDrag = (e: PointerEvent) => {
    const {pageX, pageY} = e
    const {offsetX, offsetY} = this
    const x = pageX - offsetX
    const y = pageY - offsetY
    this.props.onDrag(x, y)
  }
  onPointerUp = (e: PointerEvent) => {
    e.preventDefault()
    this.dragging = false
    const {pageX, pageY} = e
    const {offsetX, offsetY} = this
    const x = pageX - offsetX
    const y = pageY - offsetY
    this.props.onDrop(x, y)
  }
  onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    this.label.setPointerCapture(e.pointerId)
    this.dragging = true
    const {left, top} = this.label.getBoundingClientRect()
    const {pageX, pageY} = e
    this.offsetX = pageX - left
    this.offsetY = pageY - top
  }
  onPointerMove = (e: PointerEvent) => {
    if(this.dragging) {
      this.onDrag(e)
    }
  }
  render() {
    return (
      <div className="DraggableWindow" ref={w => { this.window = w }}>
        <div className="DraggableWindow_label" ref={l => { this.label = l }}>
          {this.props.label}
        </div>
        <div className="DraggableWindow_contents">
          {this.props.children}
        </div>
      </div>
    )
  }
}
interface PreviewState {
  top: number
  left: number
  height: number
  width: number
  visibility: boolean
}
const PreviewWindow = (props: PreviewState) => {
  const style = {
    top: `${props.top}px`,
    left: `${props.left}px`,
    width: `${props.width}px`,
    height: `${props.height}px`,
    visibility: props.visibility ? "visible" : "hidden"
  }
  return (
    <div style={style} className="PreviewWindow">
    </div>
  )
}
interface ChildState {
  height: number
  width: number
  left: number
  top: number
  initialTop: number
  initialLeft: number
  order: number
}
interface DraggableWindowContainerProps {
  labelHeight: number
  margin: number
  top: number
  left: number
}
export class DraggableWindowContainer extends React.Component<DraggableWindowContainerProps, void> {
  childrenState: ChildState[] = []
  previewState: PreviewState
  componentWillMount() {
    React.Children.forEach(this.props.children!, (_child, i) => {
      if(_child["props"] && _child["props"]["label"]) {
        const child = _child as any as React.ReactElement<DraggableWindowProps & { children?: React.ReactNode }>
        const order = i
        this.childrenState[i] = {
          order: order,
          initialTop: 0,
          initialLeft: 0,
          top: 0,
          left: 0,
          height: child.props.height,
          width:  child.props.width
        }
        this.previewState = {
          visibility: false,
          top: 0,
          left: 0,
          width: 0,
          height: 0
        }
      }
    })
    this.onChildrenOrderUpdate()
  }
  onChildrenOrderUpdate = () => {
    for(let s of this.childrenState) {
      const top = this.childrenState.filter(x => { return x.order < s.order }).map(x => { return x.height }).reduce((a, b) => {
        return a + b + this.props.labelHeight + this.props.margin
      }, this.props.top)
      const left = this.props.left
      s.top = s.initialTop = top
      s.left = s.initialLeft = left
    }
  }
  render() {
    const children = React.Children.map(this.props.children!, (_child, i) => {
      if(_child["props"] && _child["props"]["label"]) {
        const child = _child as any as React.ReactElement<DraggableWindowProps & { children?: React.ReactNode }>
        const currentIndex = i
        let childState = this.childrenState[currentIndex]
        const onDrag = (x: number, y: number) => {
          this.childrenState[currentIndex].left = x
          this.childrenState[currentIndex].top = y
          const insideSwapArea = (childState: ChildState) => {
            return childState.top <= y && y <= childState.top + this.props.labelHeight
          }
          const swapTargets = this.childrenState.filter(x => { return x.order !== childState.order && insideSwapArea(x) })
          if(swapTargets.length) {
            this.previewState.top = swapTargets[0].top
            this.previewState.left = swapTargets[0].left
            this.previewState.height = swapTargets[0].height + this.props.labelHeight
            this.previewState.width = swapTargets[0].width
            this.previewState.visibility = true
          } else {
            this.previewState.visibility = false
          }
          this.forceUpdate()
        }
        const onDrop = (x: number, y: number) => {
          const insideSwapArea = (childState: ChildState) => {
            return childState.top <= y && y <= childState.top + this.props.labelHeight
          }
          const swapTargets = this.childrenState.filter(x => { return x.order !== childState.order && insideSwapArea(x) })
          const swap = (a: ChildState, b: ChildState) => {
            const tmp = a.order
            a.order = b.order
            b.order = tmp
          }
          if(swapTargets.length) {
            swap(childState, swapTargets[0])
            childState.left = childState.initialLeft
            this.onChildrenOrderUpdate()
          } else {
            childState.left = childState.initialLeft
            childState.top = childState.initialTop
          }
          this.previewState.visibility = false
          this.forceUpdate()
        }
        const result = (
          <Window height={child.props.height + this.props.labelHeight} width={child.props.width} label={child.props.label} top={this.childrenState[i].top} left={this.childrenState[i].left} onDrag={onDrag} onDrop={onDrop}>
            {child.props.children}
          </Window>
        )
        return result
      }
    })
    return (
      <div className="DraggableWindowContainer">
        {children}
        <PreviewWindow top={this.previewState.top} left={this.previewState.left}
          visibility={this.previewState.visibility} width={this.previewState.width} height={this.previewState.height} />
      </div>
    )
  }
}
