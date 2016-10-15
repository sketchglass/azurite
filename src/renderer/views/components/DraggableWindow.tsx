import * as React from "react"
import "../../../styles/components/DraggableWindow.sass"

interface DraggableWindowProps {
  label: string
  height: number
}
export class DraggableWindow extends React.Component<DraggableWindowProps, void> {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
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
    const {left, top, height} = this.props
    this.window.style.height = `${height}px`
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
interface ChildrenState {
  height: number
  left: number
  top: number
  initialTop: number
  initialLeft: number
  order: number
}
const labelHeight = 28
const offsetTop = 30
export class DraggableWindowContainer extends React.Component<void, void> {
  childrenState: ChildrenState[] = []
  componentWillMount() {
    React.Children.forEach(this.props.children!, (_child, i) => {
      if(_child["props"] && _child["props"]["label"]) {
        const child = _child as any as DraggableWindow
        const order = i
        this.childrenState[i] = {
          order: order,
          initialTop: 0,
          initialLeft: 18,
          top: 0,
          left: 18,
          height: child.props.height + labelHeight
        }
      }
    })
    for(let s of this.childrenState) {
      const top = this.childrenState.filter(x => { return x.order < s.order }).map(x => { return x.height }).reduce((a, b) => {
        return a + b
      }, offsetTop)
      s.top = s.initialTop = top
    }
  }
  render() {
    const children = React.Children.map(this.props.children!, (_child, i) => {
      if(_child["props"] && _child["props"]["label"]) {
        const child = _child as any as DraggableWindow
        const currentIndex = i
        const onDrag = (x: number, y: number) => {
          this.childrenState[currentIndex].left = x
          this.childrenState[currentIndex].top = y
          this.forceUpdate()
        }
        const onDrop = (x: number, y: number) => {
          this.childrenState[currentIndex].left = this.childrenState[currentIndex].initialLeft
          this.childrenState[currentIndex].top = this.childrenState[currentIndex].initialTop
          this.forceUpdate()
        }
        const result = (
          <Window height={child.props.height} label={child.props.label} top={this.childrenState[i].top} left={this.childrenState[i].left} onDrag={onDrag} onDrop={onDrop}>
            {child.props.children}
          </Window>
        )
        return result
      }
    })
    return (
      <div className="DraggableWindowContainer">
        {children}
      </div>
    )
  }
}
