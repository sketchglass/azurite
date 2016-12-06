import * as React from "react"
import * as ReactDOM from "react-dom"
import {remote, ipcRenderer} from "electron"
import NewPictureDialog from "./NewPictureDialog"
import ResolutionChangeDialog from "./ResolutionChangeDialog"
import "../../../styles/main.css"

window.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".DialogRoot")!

  const onReadyShow = () => {
    const {width, height} = root.firstElementChild.getBoundingClientRect()
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
    ReactDOM.unmountComponentAtNode(root)
    let dialog: JSX.Element|undefined
    switch (name) {
      case "newPicture":
        document.title = "New Picture"
        dialog = <NewPictureDialog onReadyShow={onReadyShow} onDone={onDone} />
        break
      case "resolutionChange":
        document.title = "Change Canvas Resolution"
        dialog = <ResolutionChangeDialog init={param} onReadyShow={onReadyShow} onDone={onDone} />
        break
    }
    if (dialog) {
      ReactDOM.render(dialog, root)
    }
  })
})
