import Electron = require('electron')
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow, ipcMain} = Electron

import {TabletEventReceiver} from "receive-tablet-event"

let window: BrowserWindow|undefined

function createWindow () {
  const win = window = new BrowserWindow({width: 800, height: 600})

  win.loadURL(`file://${__dirname}/../index.html`)
  win.webContents.openDevTools()

  win.on('closed', () => {
    window = undefined
  })

  let receiver: TabletEventReceiver|undefined;

  ipcMain.on("tablet.install", (ev, captureArea) => {
    if (!receiver) {
      receiver = new TabletEventReceiver(win)
      receiver.captureArea = captureArea

      receiver.on("enterProximity", (ev) => {
        win.webContents.send("tablet.enterProximity", ev)
      })
      receiver.on("leaveProximity", (ev) => {
        win.webContents.send("tablet.leaveProximity", ev)
      })
      receiver.on("down", (ev) => {
        win.webContents.send("tablet.down", ev)
      })
      receiver.on("move", (ev) => {
        win.webContents.send("tablet.move", ev)
      })
      receiver.on("up", (ev) => {
        win.webContents.send("tablet.up", ev)
      })
      win.on('closed', () => {
        receiver!.dispose()
      })
    }
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
