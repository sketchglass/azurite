import React = require("react")
import {observer} from "mobx-react"
import * as Mousetrap from "mousetrap"

import DrawArea from "./DrawArea"
import {PictureTabBar} from "./PictureTabBar"
import ToolSelection from "./ToolSelection"

import ColorPanel from "./panels/ColorPanel"
import ToolSettingsPanel from "./panels/ToolSettingsPanel"
import NavigatorPanel from "./panels/NavigatorPanel"
import LayerPanel from "./panels/LayerPanel"

import NavigationKeyBinding from "./NavigationKeyBinding"
import {appState} from "../state/AppState"

import "./MenuBar"
import "../../styles/main.css"

@observer export default
class App extends React.Component<{}, {}> {
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
    Mousetrap.bind("tab", () => {
      appState.sidebarVisible = !appState.sidebarVisible
    })
  }
  render() {
    const {currentTool, overrideTool, sidebarVisible} = appState
    const picture = appState.currentPicture
    return (
      <div className="App">
        <ToolSelection hidden={!sidebarVisible} />
        <aside className="Sidebar Sidebar-left" hidden={!sidebarVisible}>
          <div className="PanelTitle">Color</div>
          <ColorPanel />
          <div className="PanelTitle">Tool</div>
          <ToolSettingsPanel />
        </aside>
        <div className="CenterArea">
          <PictureTabBar hidden={!sidebarVisible} />
          <DrawArea tool={overrideTool ? overrideTool : currentTool} picture={picture} />
        </div>
        <aside className="Sidebar Sidebar-right" hidden={!sidebarVisible}>
          <div className="PanelTitle">Navigator</div>
          <NavigatorPanel />
          <div className="PanelTitle">Layers</div>
          <LayerPanel />
        </aside>
      </div>
    )
  }
}
