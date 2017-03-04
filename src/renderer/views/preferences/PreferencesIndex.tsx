import * as React from "react"
import * as ReactDOM from "react-dom"
import {ipcRenderer} from "electron"
import Preferences from "./Preferences"
import IPCChannels from "../../../common/IPCChannels"
import {PreferencesData} from "../../viewmodels/PreferencesViewModel"
import "../../../styles/main.css"

window.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".PreferencesRoot")!
  let preferences: Preferences
  ReactDOM.render(<Preferences ref={e => preferences = e} />, root)
  ipcRenderer.on(IPCChannels.preferencesOpen, (ev: Electron.IpcRendererEvent, data: PreferencesData) => {
    preferences.viewModel.setData(data)
  })
})
