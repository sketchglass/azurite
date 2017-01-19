import * as React from "react"
import {action, observable} from "mobx"
import {observer} from "mobx-react"
import {Tree, TreeNode, NodeInfo} from "react-draggable-tree"
import "react-draggable-tree/lib/index.css"
import {BrushPreset} from "../../brush/BrushPreset"
import {brushPresetManager} from "../../app/BrushPresetManager"
import {toolManager} from "../../app/ToolManager"
import BrushTool from "../../tools/BrushTool"
import SVGIcon from "../components/SVGIcon"
import * as classNames from "classnames"

interface BrushPresetNode extends TreeNode {
  preset: BrushPreset
}

const BrushPresetItem = observer((props: {index: number}) => {
  const {index} = props
  const preset = brushPresetManager.presets[index]
  const {title} = preset
  const onClick = action(() => {
    brushPresetManager.currentPresetIndex = index
  })
  return (
    <div className="BrushPresetItem" onClick={onClick}>
      <SVGIcon className={preset.iconType} />
      <div className="BrushPresetItem_title">{title}</div>
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
      <div className={className}>
        <BrushPresetTree
          root={root}
          selectedKeys={this.selectedKeys}
          rowHeight={32}
          rowContent={nodeInfo => <BrushPresetItem index={nodeInfo.path[0]} />}
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
}
