import * as React from "react"
import {observer} from "mobx-react"
import {remote} from "electron"
import {menuBar} from "./MenuBar"
const {Menu} = remote

@observer
export default
class WindowsMenuBar extends React.Component<{}, {}> {
  render() {
    const menuTemplates = menuBar.render()

    return (
      <div className="WindowsMenuBar">{
        menuTemplates.map(template => {
          const menu = Menu.buildFromTemplate(template.submenu as Electron.MenuItemOptions[])
          const onClick = (e: React.MouseEvent<HTMLElement>) => {
            const element = e.target as HTMLElement
            const rect = element.getBoundingClientRect()
            menu.popup(remote.getCurrentWindow(), rect.left, rect.bottom)
          }
          return <div className="WindowsMenuBar_item" onClick={onClick}>{template.label}</div>
        })
      }</div>
    )
  }
}
