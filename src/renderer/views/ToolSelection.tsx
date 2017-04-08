import * as classNames from 'classnames'
import {remote} from 'electron'
import {action} from 'mobx'
import {observer} from 'mobx-react'
import * as React from 'react'
const {Menu} = remote

import KeyInput from '../../lib/KeyInput'

import SVGIcon from './components/SVGIcon'

import {toolManager} from '../app/ToolManager'

import Tool from '../tools/Tool'
import ToolIDs from '../tools/ToolIDs'

import {dialogLauncher} from '../views/dialogs/DialogLauncher'

import './ToolSelection.css'

const toolToIcon = (tool: Tool) => {
  const map = {
    [ToolIDs.brush]: 'paint-brush',
    [ToolIDs.pan]: 'move',
    [ToolIDs.rotate]: 'rotate',
    [ToolIDs.zoom]: 'search',
    [ToolIDs.transformLayer]: 'transform',
    [ToolIDs.rectSelect]: 'rect-select',
    [ToolIDs.ellipseSelect]: 'ellipse-select',
    [ToolIDs.freehandSelect]: 'freehand-select',
    [ToolIDs.polygonSelect]: 'polygon-select',
    [ToolIDs.floodFill]: 'magic-wand',
    [ToolIDs.canvasArea]: 'crop',
  }
  return <SVGIcon className={map[tool.id]} />
}

@observer
export default
class ToolSelection extends React.Component<{hidden: boolean}, {}> {
  render() {
    const {hidden} = this.props
    const {tools, currentTool} = toolManager
    return (
      <div className="ToolSelection" hidden={hidden}>{
        tools.map((tool, i) => {
          const selected = tool === currentTool
          const className = classNames('ToolSelection_button', {'ToolSelection_button-selected': selected})
          const onClick = () => this.onChange(tool)
          const onContextMenu = (e: React.MouseEvent<HTMLElement>) => this.onContextMenu(e, tool)
          return <button key={i} onClick={onClick} onContextMenu={onContextMenu} className={className}>{toolToIcon(tool)}</button>
        })
      }
      </div>
    )
  }
  private onChange = action((tool: Tool) => {
    toolManager.currentTool = tool
  })
  private onContextMenu = action((e: React.MouseEvent<HTMLElement>, tool: Tool) => {
    toolManager.currentTool = tool
    const selectShortcuts = async () => {
      const result = await dialogLauncher.openToolShortcutsDialog({
        toggle: tool.toggleShortcut && tool.toggleShortcut.toData(),
        temp: tool.tempShortcut && tool.tempShortcut.toData(),
      })
      if (result) {
        const {toggle, temp} = result
        tool.toggleShortcut  = toggle && KeyInput.fromData(toggle)
        tool.tempShortcut = temp && KeyInput.fromData(temp)
      }
    }
    const menu = Menu.buildFromTemplate([
      {label: 'Shortcuts...', click: selectShortcuts},
    ])
    menu.popup(remote.getCurrentWindow(), {
      x: e.clientX,
      y: e.clientY,
      async: true
    })
  })
}
