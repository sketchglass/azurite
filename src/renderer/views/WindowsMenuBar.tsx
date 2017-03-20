import * as React from "react"
import {observer} from "mobx-react"
import {remote} from "electron"
import {menuBar} from "./MenuBar"
import "./WindowsMenuBar.css"
const {Menu} = remote

@observer
export default
class WindowsMenuBar extends React.Component<{}, {}> {
  currentMenu: Electron.Menu | undefined

  closeMenu() {
    if (this.currentMenu) {
      this.currentMenu.closePopup()
      this.currentMenu = undefined
    }
  }

  componentDidMount() {
    window.addEventListener("click", e => {
      this.closeMenu()
    })
  }

  render() {
    const menuTemplates = menuBar.render()

    return (
      <div className="WindowsMenuBar">{
        menuTemplates.map(template => {
          const menu = Menu.buildFromTemplate(template.submenu as Electron.MenuItemOptions[])
          const onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
            if (this.currentMenu) {
              this.closeMenu()
              showMenu(e.currentTarget)
            }
          }
          const showMenu = (element: HTMLElement) => {
            const rect = element.getBoundingClientRect()
            this.currentMenu = menu
            menu.popup(remote.getCurrentWindow(), {
              x: Math.round(rect.left),
              y: Math.round(rect.bottom),
              async: true
            })
          }
          const onClick = (e: React.MouseEvent<HTMLElement>) => {
            if (this.currentMenu) {
              this.closeMenu()
            } else {
              showMenu(e.currentTarget)
            }
            e.stopPropagation()
          }
          return <div className="WindowsMenuBar_item" onClick={onClick} onMouseEnter={onMouseEnter}>{template.label}</div>
        })
      }</div>
    )
  }
}
