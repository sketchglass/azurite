import * as React from "react"
import {action, observable} from "mobx"
import {observer} from "mobx-react"
import {Tree, TreeNode, NodeInfo} from "react-draggable-tree"
import "react-draggable-tree/lib/index.css"
import {brushPresetManager} from "../../app/BrushPresetManager"
import {BrushPreset} from "../../brush/BrushPreset"

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
      {title}
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
    return (
      <div className="BrushPresetsPanel">
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
  })
  private onMove = action((src: NodeInfo<TreeNode>[], dest: NodeInfo<TreeNode>, destIndex: number) => {
    // TODO
  })
  private onCopy = action((src: NodeInfo<TreeNode>[], dest: NodeInfo<TreeNode>, destIndex: number) => {
    // TODO
  })
}
