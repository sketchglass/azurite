import Electron = require('electron')
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow} = Electron
import {TabletEventReceiver} from "receive-tablet-event"
import * as IPCChannels from "../common/IPCChannels"

app.commandLine.appendSwitch("enable-experimental-web-platform-features")

let window: BrowserWindow|undefined

function openWindow() {
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
    receiver.dispose()
    window = undefined
  })
}

app.on('ready', openWindow)

app.on('window-all-closed', () => {
  if (process.platform != 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (!window) {
    openWindow()
  }
})
