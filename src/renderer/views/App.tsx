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
import {isTextInput} from "./util"

import "./MenuBar"
import "../../styles/main.css"

Mousetrap.prototype.stopCallback = function (e: KeyboardEvent, element: Element, combo: string) {
  return isTextInput(element)
}

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
    Mousetrap.bind("tab", e => {
      e.preventDefault()
      appState.toggleUIVisible()
    })
  }
  render() {
    const {currentTool, overrideTool, uiVisible} = appState
    const picture = appState.currentPicture
    return (
      <div className="App">
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
    )
  }
}
