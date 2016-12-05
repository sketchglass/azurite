import * as React from "react"
import * as ReactDOM from "react-dom"
import {remote, ipcRenderer} from "electron"
import NewPictureDialog from "./NewPictureDialog"
import "../../../styles/main.css"

window.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".DialogContainer")!

  const onReadyShow = () => {
    const {width, height} = container.firstElementChild.getBoundingClientRect()
    const win = remote.getCurrentWindow()
    win.setMenu(null as any)
    win.setContentSize(Math.round(width), Math.round(height))
    win.center()
    setImmediate(() => {
      // delay window show to avoid flicker
      remote.getCurrentWindow().show()
    })
  }
  const onDone = (result: any) => {
    remote.getCurrentWindow().hide()
    ipcRenderer.send("dialogDone", result)
  }

  ipcRenderer.on("dialogOpen", (ev: Electron.IpcRendererEvent, name: string, param: any) => {
    ReactDOM.unmountComponentAtNode(container)
    switch (name) {
      case "newPicture":
        ReactDOM.render(<NewPictureDialog onReadyShow={onReadyShow} onDone={onDone} />, container)
        break
    }
  })
})
