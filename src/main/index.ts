import Electron = require('electron')
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow, ipcMain} = Electron
import qs = require('querystring')
import {TabletEventReceiver} from "receive-tablet-event"
import "rxjs/add/operator/first"
import * as IPCChannels from "../common/IPCChannels"
import PictureParams from "../renderer/models/PictureParams"

app.commandLine.appendSwitch("enable-experimental-web-platform-features")

const windows = new Set<BrowserWindow>()

async function openNewPictureDialog() {
  const win = new BrowserWindow({width: 400, height: 200, show: false})
  win.setMenu(null as any)
  windows.add(win)
  win.loadURL(`file://${__dirname}/../dialogs/newPicture.html`)

  const pictureParams = await new Promise<PictureParams|undefined>((resolve, reject) => {
    IPCChannels.newPictureDialogDone.listen(win.webContents).first().forEach(pictureParams => {
      resolve(pictureParams)
    })
    win.once('closed', () => {
      resolve(undefined)
    })
  })

  windows.delete(win)
  return pictureParams
}

function openPictureWindow(params: PictureParams) {
  const win = new BrowserWindow({width: 1200, height: 768})
  windows.add(win)

  const query = qs.stringify({params: JSON.stringify(params)})

  win.loadURL(`file://${__dirname}/../index.html?${query}`)
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
    windows.delete(win)
    receiver.dispose()
  })
}

async function onStartup() {
  const pictureParams = await openNewPictureDialog()
  if (pictureParams) {
    openPictureWindow(pictureParams)
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
