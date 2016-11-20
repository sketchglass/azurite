import React = require("react")
import {action} from "mobx"
import {observer} from "mobx-react"
import Tool from "../tools/Tool"
import BaseBrushTool from "../tools/BaseBrushTool"
import BrushTool from "../tools/BrushTool"
import WatercolorTool from "../tools/WatercolorTool"
import DrawArea from "./DrawArea"
import LayerList from "./LayerList"
import ColorPicker from "./components/ColorPicker"
import Palette from "./components/Palette"
import Navigator from "./Navigator"
import RGBRangeSliders from "./components/RGBRangeSliders"
import {DraggablePanel, DraggablePanelContainer} from "./components/DraggablePanel"
import {PictureTabBar} from "./PictureTabBar"
import {HSVColor} from "../../lib/Color"
import NavigationKeyBinding from "./NavigationKeyBinding"
import {appState} from "../state/AppState"
import {remote} from "electron"
import SVGIcon from "./components/SVGIcon"
import {DockContainer} from "./components/DockContainer"
const {Menu, app} = remote
import "./MenuBar"
import "../../styles/main.css"

const toolToIcon = (tool: Tool) => {
  const map = {
    "Watercolor": "paint-brush",
    "Brush": "pen",
    "Pan": "move",
    "Rotate": "rotate",
    "Move": "transform",
    "Zoom": "search",
  }
  return <SVGIcon className={map[tool.name]} />
}
function ToolSelection(props: {tools: Tool[], currentTool: Tool, onChange: (tool: Tool) => void, onContextMenu: (tool: Tool, e: React.MouseEvent<Element>) => void}) {
  return (
    <div className="ToolSelection">{
        props.tools.filter(tool => { return !(tool instanceof BaseBrushTool) }).map((tool, i) => {
          const selected = tool === props.currentTool
          const className = (selected) ? "ToolSelection_button ToolSelection_button-selected" : "ToolSelection_button"
          const onClick = () => props.onChange(tool)
          return <button key={i} onClick={onClick} className={className}>{toolToIcon(tool)}</button>
        })
      }{
        props.tools.filter(tool => { return tool instanceof BaseBrushTool }).map((tool, i) => {
          const onContextMenu = (e: React.MouseEvent<Element>) => props.onContextMenu(tool, e)
          const selected = tool === props.currentTool
          const className = (selected) ? "ToolSelection_button ToolSelection_button-selected" : "ToolSelection_button"
          const onClick = () => props.onChange(tool)
          return <button key={i} onContextMenu={onContextMenu} onClick={onClick} className={className}>{toolToIcon(tool)}</button>
        })
      }
    </div>
  )
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
  }
  render() {
    const {tools, currentTool, overrideTool, color, paletteIndex, palette} = appState
    const picture = appState.currentPicture
    const onToolChange = (tool: Tool) => {
      appState.currentTool = tool
    }
    const onToolContextMenu = action((selectedTool: Tool, e: React.MouseEvent<Element>) => {
      e.preventDefault()
      const removeTool = action(() => {
        const index = appState.tools.indexOf(selectedTool)
        appState.tools.splice(index, 1)
      })
      const appendTool = action((item: Tool) => {
        return () => {
          const index = appState.tools.indexOf(selectedTool) + 1
          appState.tools.splice(index, 0, item)
        }
      })
      const menuTemplate = [
        {label: '追加', submenu: [
          {label: "BrushTool", click: appendTool(new BrushTool(appState))},
          {label: "WatercolorTool", click: appendTool(new WatercolorTool(appState))}
        ]},
        {label: '削除', click: removeTool}
      ]
      const menu = Menu.buildFromTemplate(menuTemplate)
      menu.popup(remote.getCurrentWindow())
    })
    const onPaletteChange = action((e: React.MouseEvent<Element>, index: number) => {
      appState.paletteIndex = index
      if(e.shiftKey) {
        appState.palette[index] = appState.color
      } else {
        appState.color = appState.palette[index]
      }
    })
    const onColorChange = action((value: HSVColor) => {
      appState.color = value
    })

    const renderTab = (id: string) => {
      switch (id) {
        case "color":
          return <ColorPicker color={color} onChange={onColorChange} />
        case "slider":
          return <RGBRangeSliders color={color} onChange={onColorChange} />
        case "palette":
          return <Palette palette={palette} paletteIndex={paletteIndex} onChange={onPaletteChange} />
        case "settings":
          return currentTool.renderSettings()
        case "navigator":
          return <Navigator picture={picture} />
        case "layers":
          return <LayerList picture={picture} />
        default:
          return <div />
      }
    }

    return (
      <div className="App">
        <div className="AppItem">
          <ToolSelection tools={tools} currentTool={currentTool} onChange={onToolChange} onContextMenu={onToolContextMenu} />
        </div>
        <div className="AppItem">
          <DockContainer initData={dockPlacement} renderTab={renderTab}>
            <PictureTabBar />
            <DrawArea tool={overrideTool ? overrideTool : currentTool} picture={picture} />
          </DockContainer>
        </div>
      </div>
    )
  }
}

const dockPlacement = {
  left: {
    rows: [
      {
        tabs: [{id: "color"}],
        currentTabIndex: 0,
        height: 200,
      },
      {
        tabs: [{id: "slider"}],
        currentTabIndex: 0,
        height: 70,
      },
      {
        tabs: [{id: "palette"}],
        currentTabIndex: 0,
        height: 80,
      },
      {
        tabs: [{id: "settings"}],
        currentTabIndex: 0,
        height: 200,
      },
    ],
  },
  right: {
    rows: [
      {
        tabs: [{id: "navigator"}],
        currentTabIndex: 0,
        height: 100,
      },
      {
        tabs: [{id: "layers"}],
        currentTabIndex: 0,
        height: 200,
      }
    ],
  },
}