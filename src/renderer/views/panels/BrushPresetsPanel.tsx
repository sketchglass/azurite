import * as classNames from 'classnames'
import {remote} from 'electron'
import {action, observable, reaction} from 'mobx'
import {observer} from 'mobx-react'
import * as React from 'react'
import {ListView, ListDelegate, ListRowInfo} from 'react-draggable-tree'
import 'react-draggable-tree/lib/index.css'
const {Menu} = remote
import KeyInput from '../../../lib/KeyInput'
import {brushPresetManager} from '../../app/BrushPresetManager'
import {toolManager} from '../../app/ToolManager'
import {BrushPreset} from '../../brush/BrushPreset'
import {defaultBrushPresets} from '../../brush/DefaultBrushPresets'
import BrushTool from '../../tools/BrushTool'
import ClickToEdit from '../components/ClickToEdit'
import SVGIcon from '../components/SVGIcon'
import {dialogLauncher} from '../dialogs/DialogLauncher'
import './BrushPresetsPanel.css'

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
    <div className='BrushPresetItem' onClick={onClick}>
      <SVGIcon className={preset.iconType} />
      <ClickToEdit text={title} onChange={onTitleChange} editable={selected} />
    </div>
  )
})

class BrushPresetListDelegate implements ListDelegate<BrushPreset> {
  constructor(public panel: BrushPresetsPanel) {
  }

  getKey(preset: BrushPreset) {
    return preset.internalKey
  }

  renderRow(info: ListRowInfo<BrushPreset>) {
    return <BrushPresetItem index={info.index} selected={info.selected} />
  }

  @action onSelectedKeysChange(selectedKeys: Set<number>, selectedInfos: ListRowInfo<BrushPreset>[]) {
    this.panel.selectedKeys = selectedKeys
    if (selectedInfos.length > 0) {
      brushPresetManager.currentPresetIndex = selectedInfos[0].index
    }
    const brushTool = toolManager.tools.find(t => t instanceof BrushTool)
    if (brushTool) {
      toolManager.currentTool = brushTool
    }
  }
  @action onMove(src: ListRowInfo<BrushPreset>[], destIndex: number, destIndexAfter: number) {
    const presets: BrushPreset[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {index} = src[i]
      const [preset] = brushPresetManager.presets.splice(index, 1)
      presets.unshift(preset)
    }
    brushPresetManager.presets.splice(destIndexAfter, 0, ...presets)
  }
  @action onCopy(src: ListRowInfo<BrushPreset>[], destIndex: number) {
    const presets: BrushPreset[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {index} = src[i]
      const preset = brushPresetManager.presets[index].clone()
      presets.unshift(preset)
    }
    brushPresetManager.presets.splice(destIndex, 0, ...presets)
  }
  @action onContextMenu(nodeInfo: ListRowInfo<BrushPreset>|undefined, event: React.MouseEvent<Element>) {
    const index = nodeInfo ? nodeInfo.index : brushPresetManager.presets.length

    const addPresetItems: Electron.MenuItemConstructorOptions[] = defaultBrushPresets().map(data => {
      return {
        label: data.title,
        click: action(() => {
          const preset = new BrushPreset(data)
          if (preset) {
            brushPresetManager.presets.splice(index, 0, preset)
          }
        }),
      }
    })
    const removePresets = action(() => {
      const selectedIndices = Array.from(this.panel.selectedKeys).map(key => brushPresetManager.presets.findIndex(p => p.internalKey === key))
      selectedIndices.sort()
      for (let i = selectedIndices.length - 1; i >= 0; --i) {
        brushPresetManager.presets.splice(selectedIndices[i], 1)
      }
    })
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [
      {label: 'Add', submenu: addPresetItems},
      {label: 'Remove', click: removePresets}
    ]
    if (index < brushPresetManager.presets.length) {
      const preset = brushPresetManager.presets[index]
      const editShortcut = action(async () => {
        const result = await dialogLauncher.openToolShortcutsDialog({
          noTemp: true,
          toggle: preset.shortcut && preset.shortcut.toData(),
          temp: undefined,
        })
        if (result) {
          const {toggle} = result
          preset.shortcut = toggle && KeyInput.fromData(toggle)
        }
      })
      menuTemplate.push(
        {type: 'separator'},
        {label: 'Shortcut...', click: editShortcut},
      )
    }
    const menu = Menu.buildFromTemplate(menuTemplate)
    menu.popup(remote.getCurrentWindow(), {
      x: event.clientX,
      y: event.clientY,
      async: true
    })
  }
}

@observer
export default class BrushPresetsPanel extends React.Component<{}, {}> {
  @observable selectedKeys = new Set<number>(brushPresetManager.currentPreset ? [brushPresetManager.currentPreset.internalKey] : [])
  private readonly delegate = new BrushPresetListDelegate(this)

  constructor() {
    super()
    // reselect when current changed
    reaction(() => brushPresetManager.currentPreset, preset => {
      if (preset && !this.selectedKeys.has(preset.internalKey)) {
        this.selectedKeys = new Set<number>([preset.internalKey])
      }
    })
  }

  render() {
    const brushToolActive = toolManager.currentTool instanceof BrushTool
    const className = classNames('BrushPresetsPanel', {'BrushPresetsPanel-brushToolActive': brushToolActive})
    const BrushPresetListView = ListView as new () => ListView<BrushPreset>
    return (
      <div className={className}>
        <BrushPresetListView
          items={brushPresetManager.presets}
          selectedKeys={this.selectedKeys}
          rowHeight={32}
          delegate={this.delegate}
        />
      </div>
    )
  }
}
