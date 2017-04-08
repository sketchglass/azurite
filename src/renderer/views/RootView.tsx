import React = require('react')
import {observer} from 'mobx-react'

import DrawArea from './DrawArea'
import {PictureTabBar} from './PictureTabBar'
import ToolSelection from './ToolSelection'

import BrushPresetsPanel from './panels/BrushPresetsPanel'
import ColorPanel from './panels/ColorPanel'
import LayerPanel from './panels/LayerPanel'
import NavigatorPanel from './panels/NavigatorPanel'
import ToolSettingsPanel from './panels/ToolSettingsPanel'

import {appState} from '../app/AppState'
import {toolManager} from '../app/ToolManager'

import './common.css'
import './KeyBindingHandler'
import './MenuBar'
import './RootView.css'

@observer export default
class RootView extends React.Component<{}, {}> {
  render() {
    const {currentTool, overrideTool} = toolManager
    const {uiVisible} = appState
    const picture = appState.currentPicture
    return (
      <div className="RootView">
        {process.platform === 'darwin' ? <div className="TitleBarPaddingMac" /> : undefined}
        <div className="WindowContent">
          <ToolSelection hidden={!uiVisible} />
          <aside className="Sidebar Sidebar-left" hidden={!uiVisible}>
            <div className="PanelTitle">Color</div>
            <ColorPanel />
            <div className="PanelTitle">Brushes</div>
            <BrushPresetsPanel />
            <div className="PanelTitle">Tool</div>
            <ToolSettingsPanel />
          </aside>
          <div className="CenterArea">
            <PictureTabBar hidden={!uiVisible} />
            <DrawArea tool={overrideTool ? overrideTool : currentTool} picture={picture} />
          </div>
          <aside className="Sidebar Sidebar-right" hidden={!uiVisible}>
            <div className="PanelTitle">Navigator</div>
            <NavigatorPanel />
            <div className="PanelTitle">Layers</div>
            <LayerPanel />
          </aside>
        </div>
      </div>
    )
  }
}
