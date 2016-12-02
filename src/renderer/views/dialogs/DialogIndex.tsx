import * as React from "react"
import * as ReactDOM from "react-dom"
import {remote, ipcRenderer} from "electron"
import NewPictureDialog from "./NewPictureDialog"
import "../../../styles/main.css"

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app")!

  const onReadyShow = () => {
    const {width, height} = container.firstElementChild.getBoundingClientRect()
    const win = remote.getCurrentWindow()
    win.setContentSize(Math.round(width), Math.round(height))
    win.show()
  }
  const onOK = (result: any) => {
    remote.getCurrentWindow().hide()
    ipcRenderer.send("dialogDone", result)
  }

  ipcRenderer.on("dialogOpen", (ev: Electron.IpcRendererEvent, params: {name: string}) => {
    ReactDOM.unmountComponentAtNode(container)
    switch (params.name) {
      case "newPicture":
        ReactDOM.render(<NewPictureDialog onReadyShow={onReadyShow} onOK={onOK} />, container)
        break
    }
  })
})
