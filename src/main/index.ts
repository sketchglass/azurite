import Electron = require("electron")
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow, ipcMain} = Electron
import {TabletEventReceiver} from "receive-tablet-event"
import * as IPCChannels from "../common/IPCChannels"
import {contentBase} from "../common/contentBase"

app.commandLine.appendSwitch("enable-experimental-web-platform-features")

let mainWindow: BrowserWindow|undefined
let dialogsWindow: BrowserWindow|undefined
let testWindow: BrowserWindow|undefined

function openDialogsWindow() {
  const win = dialogsWindow = new BrowserWindow({
    width: 100,
    height: 100,
    show: false,
    parent: mainWindow,
    modal: true,
  })
  win.loadURL(`${contentBase}/dialogs.html`)
  win.on("closed", () => {
    dialogsWindow = undefined
  })
  ipcMain.on("dialogOpen", (ev: Electron.IpcMainEvent, name: string, param: any) => {
    win.webContents.send("dialogOpen", name, param)
  })
  ipcMain.on("dialogDone", (ev: Electron.IpcMainEvent, result: any) => {
    if (mainWindow) {
      mainWindow.webContents.send("dialogDone", result)
    }
  })
  win.on("close", (e) => {
    e.preventDefault()
    win.hide()
    if (mainWindow) {
      mainWindow.webContents.send("dialogDone", undefined)
    }
  })
}

async function openWindow() {
  if (process.env.NODE_ENV === "development") {
    const {default: installExtension, REACT_DEVELOPER_TOOLS} = require("electron-devtools-installer");
    await installExtension(REACT_DEVELOPER_TOOLS)
  }

  const win = mainWindow = new BrowserWindow({
    width: 1200,
    height: 768,
    show: false,
  })

  win.loadURL(`${contentBase}/index.html`)
  if (process.env.NODE_ENV === "development") {
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

  win.on("close", e => {
    e.preventDefault()
    IPCChannels.quit.send(win.webContents, undefined)
  })

  win.on("closed", () => {
    receiver.dispose()
    mainWindow = undefined
    if (dialogsWindow) {
      dialogsWindow.destroy()
    }
  })

  win.on("ready-to-show", () => {
    win.show()
  })
}

function openTestWindow() {
  const win = testWindow = new BrowserWindow({
    width: 1200,
    height: 768,
  })
  win.loadURL(`${contentBase}/test.html`)
  win.webContents.openDevTools()
  win.on("closed", () => {
    testWindow = undefined
  })
}

app.on("ready", async () => {
  if (process.env.NODE_ENV == "test") {
    openTestWindow()
  } else {
    await openWindow()
    openDialogsWindow()
  }
})
