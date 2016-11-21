import * as React from "react"
import {observable, computed, action} from "mobx"
import {observer} from "mobx-react"
import * as classNames from "classnames"
import {dropXIndexAt, dropYIndexAt} from "../util"

class DockTabViewModel {
  constructor(public root: DockContainerViewModel, public row: DockRowViewModel) {}
  id: string

  loadData(data: DockTabData) {
    this.id = data.id
  }

  @action moveToNewRow(row: DockRowViewModel, index: number) {
    const oldIndex = this.row.tabs.indexOf(this)
    this.row.tabs.splice(oldIndex, 1)
    this.row.currentTabIndex = Math.min(this.row.currentTabIndex, this.row.tabs.length - 1)
    if (this.row == row && oldIndex < index) {
      index += 1
    }
    row.tabs.splice(index, 0, this)
    row.currentTabIndex = row.tabs.indexOf(this)
    this.row = row
  }

  @computed get selected() {
    return this.row.tabs.indexOf(this) == this.row.currentTabIndex
  }
}

class DockRowViewModel {
  static id = 0

  constructor(public root: DockContainerViewModel, public column: DockColumnViewModel) {}

  readonly id = DockRowViewModel.id++
  tabs = observable<DockTabViewModel>([])
  @observable currentTabIndex = 0
  @observable height = 0

  loadData(data: DockRowData) {
    for (const tabData of data.tabs) {
      const tab = new DockTabViewModel(this.root, this)
      tab.loadData(tabData)
      this.tabs.push(tab)
    }
    this.currentTabIndex = data.currentTabIndex
    this.height = data.height
  }
}

class DockColumnViewModel {
  constructor(public root: DockContainerViewModel) {}

  rows = observable<DockRowViewModel>([])

  loadData(data: DockColumnData) {
    for (const rowData of data.rows) {
      const row = new DockRowViewModel(this.root, this)
      row.loadData(rowData)
      this.rows.push(row)
    }
  }
}

class DockContainerViewModel {
  left = new DockColumnViewModel(this)
  right = new DockColumnViewModel(this)
  @observable draggingTab: DockTabViewModel|undefined

  loadData(data: DockContainerData) {
    this.left.loadData(data.left)
    this.right.loadData(data.right)
  }
}

interface DockTabData {
  id: string
}

interface DockRowData {
  tabs: DockTabData[]
  currentTabIndex: number
  height: number
}

interface DockColumnData {
  rows: DockRowData[]
}

interface DockContainerData {
  left: DockColumnData
  right: DockColumnData
}

@observer
class DockTab extends React.Component<{viewModel: DockTabViewModel, height: number, panels: Map<string, DockPanelInfo>}, {}> {
  render() {
    const {viewModel, height, panels} = this.props
    const panel = panels.get(viewModel.id)!.children
    return (
      <div className="DockTab" hidden={!viewModel.selected} style={{height: height + "px"}}>
        {panel}
      </div>
    )
  }
}

@observer
class DockRow extends React.Component<{viewModel: DockRowViewModel, panels: Map<string, DockPanelInfo>}, {}> {
  tabsElement: HTMLElement

  render() {
    const {viewModel, panels} = this.props
    const {tabs, height} = viewModel
    const onTabsDragOver = (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault()
    }
    const onTabsDrop = (e: React.DragEvent<HTMLElement>) => {
      const index = dropXIndexAt(this.tabsElement, e.clientX)
      if (viewModel.root.draggingTab) {
        viewModel.root.draggingTab.moveToNewRow(viewModel, index)
      }
    }
    const onSeparatorMove = action((dy: number) => {
      viewModel.height += dy
    })
    return (
      <div className="DockRow">
        <div className="DockRow_tabs" ref={e => this.tabsElement = e} onDragOver={onTabsDragOver} onDrop={onTabsDrop}>
          {
            tabs.map((t, i) => {
              const className = classNames("DockRow_tab", {"DockRow_tab-selected": t.selected})
              const onClick = () => this.props.viewModel.currentTabIndex = i
              const onDragStart = (e: React.DragEvent<HTMLElement>) => {
                e.dataTransfer.setData("DockTab", "")
                this.props.viewModel.root.draggingTab = t
              }
              const {title} = panels.get(t.id)!
              return <div key={title} className={className} onClick={onClick} onDragStart={onDragStart} draggable={true}>{title}</div>
            })
          }
        </div>
        {tabs.map(t => <DockTab key={t.id} viewModel={t} height={height} panels={panels} />)}
        <DockRowSeparator onMove={onSeparatorMove} />
      </div>
    )
  }
}

class DockRowSeparator extends React.Component<{onMove: (dy: number) => void}, {}> {
  element: HTMLElement
  dragged = false
  lastY: number

  onPointerDown = (e: PointerEvent) => {
    this.dragged = true
    this.lastY = Math.round(e.clientY)
    this.element.setPointerCapture(e.pointerId)
  }
  onPointerMove = (e: PointerEvent) => {
    if (this.dragged) {
      const y = Math.round(e.clientY)
      this.props.onMove(y - this.lastY)
      this.lastY = y
    }
  }
  onPointerUp = () => {
    this.dragged = false
  }

  componentDidMount() {
    this.element.addEventListener("pointerdown", this.onPointerDown)
    this.element.addEventListener("pointermove", this.onPointerMove)
    this.element.addEventListener("pointerup", this.onPointerUp)
  }
  componentWillUnmount() {
    this.element.removeEventListener("pointerdown", this.onPointerDown)
    this.element.removeEventListener("pointermove", this.onPointerMove)
    this.element.removeEventListener("pointerup", this.onPointerUp)
  }
  render() {
    return <div ref={e => this.element = e} className="DockRowSeparator" />
  }
}

@observer
class DockColumn extends React.Component<{viewModel: DockColumnViewModel, panels: Map<string, DockPanelInfo>}, {}> {
  render() {
    const {panels} = this.props
    const {rows} = this.props.viewModel
    return (
      <div className="DockColumn">
        {
          rows.map(r => <DockRow key={r.id} viewModel={r} panels={panels} />)
        }
      </div>
    )
  }
}

interface DockPanelProps {
  id: string
  title: string
}

type DockPanelInfo = DockPanelProps & {children: JSX.Element}

export
class DockPanel extends React.Component<DockPanelProps, {}> {
}

interface DockContainerProps {
  initPlacement: DockContainerData
}

@observer
export
class DockContainer extends React.Component<DockContainerProps, {}> {
  viewModel = new DockContainerViewModel()

  constructor(props: DockContainerProps) {
    super(props)
    this.viewModel.loadData(props.initPlacement)
  }

  render() {
    const children = React.Children.toArray(this.props.children as React.ReactNode) as React.ReactElement<any>[]
    const panels = children.filter(c => c.type == DockPanel) as React.ReactElement<DockPanelInfo>[]
    const center = children.filter(c => c.type != DockPanel)
    const panelMap = new Map<string, DockPanelInfo>()
    for (const panel of panels) {
      panelMap.set(panel.props.id, panel.props)
    }

    return (
      <div className="DockContainer">
        <DockColumn viewModel={this.viewModel.left} panels={panelMap} />
        <div className="DockCenter">
          {center}
        </div>
        <DockColumn viewModel={this.viewModel.right} panels={panelMap} />
      </div>
    )
  }
}
