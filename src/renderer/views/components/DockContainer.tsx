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

  render() {
    return this.root.renderTab(this.id)
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

  @computed get title() {
    return this.root.getTabName(this.id)
  }

  @computed get selected() {
    return this.row.tabs.indexOf(this) == this.row.currentTabIndex
  }
}

class DockRowViewModel {
  static id = 0

  constructor(public root: DockContainerViewModel) {}

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
      const row = new DockRowViewModel(this.root)
      row.loadData(rowData)
      this.rows.push(row)
    }
  }
}

class DockContainerViewModel {
  left = new DockColumnViewModel(this)
  right = new DockColumnViewModel(this)
  @observable renderTab: (id: string) => JSX.Element
  @observable getTabName: (id: string) => string
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

interface DockContainerProps {
  initData: DockContainerData
  renderTab: (id: string) => JSX.Element
  getTabName: (id: string) => string
}

@observer
class DockTab extends React.Component<{viewModel: DockTabViewModel}, {}> {
  render() {
    return (
      <div className="DockTab" hidden={!this.props.viewModel.selected}>
        {this.props.viewModel.render()}
      </div>
    )
  }
}

@observer
class DockRow extends React.Component<{viewModel: DockRowViewModel}, {}> {
  tabsElement: HTMLElement

  render() {
    const {viewModel} = this.props
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
    const onSeparatorMove = (dy: number) => {
      console.log(dy)
    }
    return (
      <div className="DockRow" style={{minHeight: `${height}px`}}>
        <div className="DockRow_tabs" ref={e => this.tabsElement = e} onDragOver={onTabsDragOver} onDrop={onTabsDrop}>
          {
            tabs.map((t, i) => {
              const className = classNames("DockRow_tab", {"DockRow_tab-selected": t.selected})
              const onClick = () => this.props.viewModel.currentTabIndex = i
              const onDragStart = (e: React.DragEvent<HTMLElement>) => {
                e.dataTransfer.setData("DockTab", "")
                this.props.viewModel.root.draggingTab = t
              }
              return <div key={t.title} className={className} onClick={onClick} onDragStart={onDragStart} draggable={true}>{t.title}</div>
            })
          }
        </div>
        {tabs.map(t => <DockTab key={t.id} viewModel={t} />)}
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
class DockColumn extends React.Component<{viewModel: DockColumnViewModel}, {}> {
  render() {
    const {rows} = this.props.viewModel
    return (
      <div className="DockColumn">
        {
          rows.map(r => <DockRow key={r.id} viewModel={r} />)
        }
      </div>
    )
  }
}

@observer
export
class DockContainer extends React.Component<DockContainerProps, {}> {
  viewModel = new DockContainerViewModel()

  constructor(props: DockContainerProps) {
    super(props)
    this.viewModel.renderTab = props.renderTab
    this.viewModel.getTabName = props.getTabName
    this.viewModel.loadData(props.initData)
  }

  componentWillReceiveProps(props: DockContainerProps) {
    this.viewModel.renderTab = props.renderTab
    this.viewModel.getTabName = props.getTabName
  }

  render() {
    return (
      <div className="DockContainer">
        <DockColumn viewModel={this.viewModel.left} />
        <div className="DockCenter">
          {this.props.children}
        </div>
        <DockColumn viewModel={this.viewModel.right} />
      </div>
    )
  }
}
