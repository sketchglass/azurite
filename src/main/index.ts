import Electron = require('electron')
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow, ipcMain} = Electron
import qs = require('querystring')

import {TabletEventReceiver} from "receive-tablet-event"
import * as IPCChannels from "../common/IPCChannels"

const windows = new Set<BrowserWindow>()

async function openSizeDialog() {
  const win = new BrowserWindow({width: 400, height: 300})
  windows.add(win)
  win.loadURL(`file://${__dirname}/../sizeDialog.html`)

  const size = await new Promise<PictureParams|undefined>((resolve, reject) => {
    IPCChannels.sizeDialogDone.listen(win.webContents).first().forEach(size => {
      resolve(size)
    })
    win.once('closed', () => {
      resolve(undefined)
    })
  })

  windows.delete(win)
  return size
}

interface PictureParams {
  width: number
  height: number
}

function openPictureWindow(params: PictureParams) {
  const win = new BrowserWindow({width: 1200, height: 768})
  windows.add(win)

  const query = qs.stringify({params: JSON.stringify(params)})

  win.loadURL(`file://${__dirname}/../index.html?${query}`)
  win.webContents.openDevTools()

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
    windows.delete(win)
    receiver.dispose()
  })
}

async function onStartup() {
  const size = await openSizeDialog()
  if (size) {
    openPictureWindow(size)
  } else {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }
}

app.on('ready', onStartup)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (!window) {
    onStartup()
  }
})
