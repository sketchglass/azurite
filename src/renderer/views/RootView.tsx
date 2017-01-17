import React = require("react")
import {observer} from "mobx-react"

import DrawArea from "./DrawArea"
import {PictureTabBar} from "./PictureTabBar"
import ToolSelection from "./ToolSelection"

import ColorPanel from "./panels/ColorPanel"
import ToolSettingsPanel from "./panels/ToolSettingsPanel"
import NavigatorPanel from "./panels/NavigatorPanel"
import LayerPanel from "./panels/LayerPanel"

import NavigationKeyBinding from "./NavigationKeyBinding"
import {appState} from "../state/AppState"

import "./KeyBindingHandler"
import "./MenuBar"
import "../../styles/main.css"

@observer export default
class RootView extends React.Component<{}, {}> {
  constructor() {
    super()

    new NavigationKeyBinding(klass => {
      if (klass) {
        for (const tool of appState.tools) {
          if (tool instanceof klass) {
            appState.overrideTool = tool
          }
        }
      } else {
        appState.overrideTool = undefined
      }
    })
  }
  render() {
    const {currentTool, overrideTool, uiVisible} = appState
    const picture = appState.currentPicture
    return (
      <div className="RootView">
        {process.platform == "darwin" ? <div className="TitleBarPaddingMac" /> : undefined}
        <div className="WindowContent">
          <ToolSelection hidden={!uiVisible} />
          <aside className="Sidebar Sidebar-left" hidden={!uiVisible}>
            <div className="PanelTitle">Color</div>
            <ColorPanel />
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
