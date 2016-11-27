import * as React from "react"
import PointerEvents from "./PointerEvents"

interface DraggablePanelProps {
  label: string
  height: number
  width: number
}
export const DraggablePanel = (props: DraggablePanelProps & { children?: React.ReactNode }) => {
  return (
    <div>
      {props.children}
    </div>
  )
}
interface PanelProps extends DraggablePanelProps {
  top: number
  left: number
  onDrag: (x: number, y: number) => void
  onDrop: (x: number, y: number) => void
  zIndex?: number
}
class Panel extends React.Component<PanelProps, void> {
  dragging = false
  window: HTMLDivElement
  label: HTMLDivElement
  offsetX: number
  offsetY: number
  constructor() {
    super()
  }
  componentDidMount() {
    this.update(this.props)
  }
  componentWillReceiveProps(props: PanelProps) {
    this.update(props)
  }
  update(props: PanelProps) {
    const {height, width, left, top, zIndex} = props
    this.window.style.height = `${height}px`
    this.window.style.width = `${width}px`
    this.window.style.left = `${left}px`
    this.window.style.top = `${top}px`
    this.window.style.zIndex = zIndex ? `${zIndex}` : "auto"
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
      <div className="DraggablePanel" ref={w => { this.window = w }}>
        <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
          <div className="DraggablePanel_label" ref={l => { this.label = l }}>
            {this.props.label}
          </div>
        </PointerEvents>
        <div className="DraggablePanel_contents">
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
const PreviewPanel = (props: PreviewState) => {
  const style = {
    top: `${props.top}px`,
    left: `${props.left}px`,
    width: `${props.width}px`,
    height: `${props.height}px`,
    zIndex: 100,
    visibility: props.visibility ? "visible" : "hidden"
  }
  return (
    <div style={style} className="PreviewPanel">
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
  dragging: boolean
}
interface DraggablePanelContainerProps {
  labelHeight: number
  margin: number
  top: number
  left: number
}
export class DraggablePanelContainer extends React.Component<DraggablePanelContainerProps, void> {
  childrenState: ChildState[] = []
  previewState: PreviewState
  componentWillMount() {
    React.Children.forEach(this.props.children!, (_child, i) => {
      if(_child["props"] && _child["props"]["label"]) {
        const child = _child as React.ReactElement<DraggablePanelProps & { children?: React.ReactNode }>
        const order = i
        this.childrenState[i] = {
          order: order,
          initialTop: 0,
          initialLeft: 0,
          top: 0,
          left: 0,
          height: child.props.height,
          width:  child.props.width,
          dragging: false
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
  insideSwapArea(childState: ChildState, x: number, y: number) {
    return childState.top <= y && y <= childState.top + this.props.labelHeight
  }
  getSwapTargets(childState: ChildState, x: number, y: number) {
    return this.childrenState.filter(s => { return s.order !== childState.order && this.insideSwapArea(s, x, y) })
  }
  swapChild(a: ChildState, b: ChildState) {
    const tmp = a.order
    a.order = b.order
    b.order = tmp
  }
  onChildDrag = (childState: ChildState, x: number, y: number) => {
    childState.left = x
    childState.top = y
    childState.dragging = true
    const swapTargets = this.getSwapTargets(childState, x, y)
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
  onChildDrop = (childState: ChildState, x: number, y: number) => {
    const swapTargets = this.getSwapTargets(childState, x, y)
    if(swapTargets.length) {
      this.swapChild(childState, swapTargets[0])
      childState.left = childState.initialLeft
      this.onChildrenOrderUpdate()
    } else {
      childState.left = childState.initialLeft
      childState.top = childState.initialTop
    }
    this.previewState.visibility = false
    childState.dragging = false
    this.forceUpdate()
  }
  render() {
    const children = React.Children.map(this.props.children!, (_child, i) => {
      if(_child["props"] && _child["props"]["label"]) {
        const child = _child as React.ReactElement<DraggablePanelProps & { children?: React.ReactNode }>
        const currentIndex = i
        const result = (
          <Panel height={child.props.height + this.props.labelHeight} width={child.props.width} label={child.props.label} top={this.childrenState[i].top} left={this.childrenState[i].left}
            onDrag={this.onChildDrag.bind(this, this.childrenState[currentIndex])} onDrop={this.onChildDrop.bind(this, this.childrenState[currentIndex])}
            zIndex={this.childrenState[i].dragging ? 100 : undefined}>
            {child.props.children}
          </Panel>
        )
        return result
      }
    })
    return (
      <div className="DraggablePanelContainer">
        {children}
        <PreviewPanel top={this.previewState.top} left={this.previewState.left}
          visibility={this.previewState.visibility} width={this.previewState.width} height={this.previewState.height} />
      </div>
    )
  }
}
