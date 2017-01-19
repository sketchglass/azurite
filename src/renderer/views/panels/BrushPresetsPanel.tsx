import * as React from "react"
import {action, observable} from "mobx"
import {observer} from "mobx-react"
import * as classNames from "classnames"
import {Tree, TreeNode, NodeInfo} from "react-draggable-tree"
import "react-draggable-tree/lib/index.css"
import {remote} from "electron"
const {Menu} = remote
import {BrushPreset} from "../../brush/BrushPreset"
import {brushPresetManager} from "../../app/BrushPresetManager"
import {brushEngineRegistry} from "../../app/BrushEngineRegistry"
import {toolManager} from "../../app/ToolManager"
import {defaultBrushPresets} from "../../brush/DefaultBrushPresets"
import BrushTool from "../../tools/BrushTool"
import SVGIcon from "../components/SVGIcon"
import ClickToEdit from "../components/ClickToEdit"

interface BrushPresetNode extends TreeNode {
  preset: BrushPreset
}

const BrushPresetItem = observer((props: {index: number, selected: boolean}) => {
  const {index, selected} = props
  const preset = brushPresetManager.presets[index]
  const {title} = preset
  const onClick = action(() => {
    brushPresetManager.currentPresetIndex = index
  })
  const onTitleChange = action((title: string) => {
    preset.title = title
  })
  return (
    <div className="BrushPresetItem" onClick={onClick}>
      <SVGIcon className={preset.iconType} />
      <ClickToEdit text={title} onChange={onTitleChange} editable={selected} />
    </div>
  )
})

class BrushPresetTree extends Tree<TreeNode> {
}

@observer
export default class BrushPresetsPanel extends React.Component<{}, {}> {
  @observable selectedKeys = new Set<number>(brushPresetManager.currentPreset ? [brushPresetManager.currentPreset.internalKey] : [])

  render() {
    const children: BrushPresetNode[] = brushPresetManager.presets.map(preset => {
      return {key: preset.internalKey, preset}
    })
    const root: TreeNode = {key: -1, children}
    const brushToolActive = toolManager.currentTool instanceof BrushTool
    const className = classNames("BrushPresetsPanel", {"BrushPresetsPanel-brushToolActive": brushToolActive})
    return (
      <div className={className} onContextMenu={this.onContextMenu}>
        <BrushPresetTree
          root={root}
          selectedKeys={this.selectedKeys}
          rowHeight={32}
          rowContent={nodeInfo => <BrushPresetItem index={nodeInfo.path[0]} selected={nodeInfo.selected} />}
          onSelectedKeysChange={this.onSelectedKeysChange}
          onCollapsedChange={() => {}}
          onMove={this.onMove}
          onCopy={this.onCopy}
        />
      </div>
    )
  }

  private onSelectedKeysChange = action((selectedKeys: Set<number>, selectedInfos: NodeInfo<TreeNode>[]) => {
    this.selectedKeys = selectedKeys
    if (selectedInfos.length > 0) {
      brushPresetManager.currentPresetIndex = selectedInfos[0].path[0]
    }
    const brushTool = toolManager.tools.find(t => t instanceof BrushTool)
    if (brushTool) {
      toolManager.currentTool = brushTool
    }
  })
  private onMove = action((src: NodeInfo<TreeNode>[], dest: NodeInfo<TreeNode>, destIndex: number, destIndexAfter: number) => {
    const presets: BrushPreset[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const index = src[i].path[0]
      const [preset] = brushPresetManager.presets.splice(index, 1)
      presets.unshift(preset)
    }
    brushPresetManager.presets.splice(destIndexAfter, 0, ...presets)
  })
  private onCopy = action((src: NodeInfo<TreeNode>[], dest: NodeInfo<TreeNode>, destIndex: number) => {
    const presets: BrushPreset[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const index = src[i].path[0]
      const preset = brushPresetManager.presets[index].clone()
      presets.unshift(preset)
    }
    brushPresetManager.presets.splice(destIndex, 0, ...presets)
  })
  private onContextMenu = action((event: React.MouseEvent<Element>) => {
    event.preventDefault()
    const index = Math.max(0, Math.min((event.nativeEvent as MouseEvent).offsetY / 32))
    const addPresetItems: Electron.MenuItemOptions[] = defaultBrushPresets().map(data => {
      return {
        label: data.title,
        click: action(() => {
          const preset = brushEngineRegistry.createPreset(data)
          if (preset) {
            brushPresetManager.presets.splice(index, 0, preset)
          }
        }),
      }
    })
    const removePresets = action(() => {
      const selectedIndices = Array.from(this.selectedKeys).map(key => brushPresetManager.presets.findIndex(p => p.internalKey == key))
      selectedIndices.sort()
      for (let i = selectedIndices.length - 1; i >= 0; --i) {
        brushPresetManager.presets.splice(selectedIndices[i], 1)
      }
    })
    const menu = Menu.buildFromTemplate([
      {label: "Add", submenu: addPresetItems},
      {label: "Remove", click: removePresets}
    ])
    menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY)
  })
}
