import Electron = require("electron")
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow, ipcMain} = Electron
import {TabletEventReceiver} from "receive-tablet-event"
import * as IPCChannels from "../common/IPCChannels"
const argv = require('minimist')(process.argv.slice(2))
import nativelib = require("../common/nativelib")
const {WindowUtilMac} = nativelib

let contentBase = argv.devserver ? "http://localhost:23000" : `file://${app.getAppPath()}/dist`

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

  const resetTitleColor = () => {
    if (process.platform == "darwin") {
      WindowUtilMac.setTitleColor(win.getNativeWindowHandle(), 236 / 255, 237 / 255, 244 / 255, 1)
    }
  }

  if (process.platform == "darwin") {
    WindowUtilMac.initWindow(win.getNativeWindowHandle())
  }
  resetTitleColor()

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

  for (const ev of ["resize", "enter-full-screen", "leave-full-screen", "maximize", "unmaximize"]) {
    win.on(ev, () => {
      IPCChannels.windowResize.send(win.webContents, undefined)
    })
  }

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

  win.on("leave-full-screen", resetTitleColor)
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
  ipcMain.on("testDone", (e, failCount) => {
    if (!argv.devserver) {
      setImmediate(() => {
        process.exit(failCount)
      })
    }
  })
}

app.commandLine.appendSwitch("enable-experimental-web-platform-features")

app.on("ready", async () => {
  if (process.env.NODE_ENV == "test") {
    openTestWindow()
  } else {
    await openWindow()
    openDialogsWindow()
  }
})
