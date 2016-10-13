import Electron = require('electron')
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow, ipcMain} = Electron

import {TabletEventReceiver} from "receive-tablet-event"
import * as IPCChannels from "../common/IPCChannels"

let window: BrowserWindow|undefined

app.commandLine.appendSwitch("enable-experimental-web-platform-features")

function createWindow () {
  const win = window = new BrowserWindow({width: 1200, height: 768})

  win.loadURL(`file://${__dirname}/../index.html`)

  if (process.env.NODE_ENV == "development") {
    win.webContents.openDevTools()
  }

  const receiver = new TabletEventReceiver(win)

  IPCChannels.setTabletCaptureArea.listen().forEach(captureArea => {
    receiver.captureArea = captureArea;
  })

  receiver.on("down", (ev) => {
    IPCChannels.tabletDown.send(win.webContents, ev)
  })
  receiver.on("move", (ev) => {
    IPCChannels.tabletMove.send(win.webContents, ev)
  })
  receiver.on("up", (ev) => {
    IPCChannels.tabletUp.send(win.webContents, ev)
  })

  win.on('closed', () => {
    window = undefined
    receiver.dispose()
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (!window) {
    createWindow()
  }
})
