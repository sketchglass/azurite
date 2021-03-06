import Electron = require('electron')
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow, ipcMain} = Electron
import {TabletEventReceiver} from 'receive-tablet-event'
import IPCChannels from '../common/IPCChannels'
const argv = require('minimist')(process.argv.slice(2))
import nativelib = require('../common/nativelib')
const {WindowUtilMac} = nativelib

let contentBase = argv.devserver ? 'http://localhost:23000' : `file://${app.getAppPath()}/dist`

let mainWindow: BrowserWindow|undefined
let dialogsWindow: BrowserWindow|undefined
let preferencesWindow: BrowserWindow|undefined
let preferencesShown = false
let testWindow: BrowserWindow|undefined

function openDialogsWindow() {
  const win = dialogsWindow = new BrowserWindow({
    width: 100,
    height: 100,
    show: false,
    parent: mainWindow,
    modal: true,
    frame: false,
  })
  win.loadURL(`${contentBase}/dialogs.html`)
  win.on('closed', () => {
    dialogsWindow = undefined
  })
  ipcMain.on(IPCChannels.dialogOpen, (ev: Electron.IpcMessageEvent, name: string, param: any) => {
    win.webContents.send(IPCChannels.dialogOpen, name, param)
  })
  ipcMain.on(IPCChannels.dialogDone, (ev: Electron.IpcMessageEvent, result: any) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPCChannels.dialogDone, result)
    }
  })
  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
    if (mainWindow) {
      mainWindow.webContents.send(IPCChannels.dialogDone, undefined)
    }
  })
}

function openPreferencesWindow() {
  const win = preferencesWindow = new BrowserWindow({
    width: 400,
    height: 200,
    minWidth: 400,
    minHeight: 200,
    show: false,
    titleBarStyle: 'hidden',
    title: 'Preferences',
    frame: process.platform === 'darwin',
  })
  win.loadURL(`${contentBase}/preferences.html`)
  win.on('closed', () => {
    preferencesWindow = undefined
  })
  ipcMain.on(IPCChannels.preferencesOpen, (ev: Electron.IpcMessageEvent, data: any) => {
    win.webContents.send(IPCChannels.preferencesOpen, data)
    win.setAlwaysOnTop(true)
    win.show()
    preferencesShown = true
  })
  ipcMain.on(IPCChannels.preferencesChange, (ev: Electron.IpcMessageEvent, data: any) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPCChannels.preferencesChange, data)
    }
  })
  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
    preferencesShown = false
  })
}

async function openWindow() {
  if (argv.development) {
    const {default: installExtension, REACT_DEVELOPER_TOOLS} = require('electron-devtools-installer')
    await installExtension(REACT_DEVELOPER_TOOLS)
  }

  const win = mainWindow = new BrowserWindow({
    width: 1200,
    height: 768,
    show: false,
  })

  const resetTitleColor = () => {
    if (process.platform === 'darwin') {
      WindowUtilMac.setTitleColor(win.getNativeWindowHandle(), 236 / 255, 237 / 255, 244 / 255, 1)
    }
  }

  if (process.platform === 'darwin') {
    WindowUtilMac.initWindow(win.getNativeWindowHandle())
  }
  resetTitleColor()

  win.loadURL(`${contentBase}/index.html`)
  if (argv.development) {
    win.webContents.openDevTools()
  }

  const receiver = new TabletEventReceiver(win)

  ipcMain.on(IPCChannels.setTabletCaptureArea, (e: Electron.IpcMessageEvent, captureArea: any) => {
    receiver.captureArea = captureArea
  })

  receiver.on('down', ev => {
    win.webContents.send(IPCChannels.tabletDown, ev)
  })
  receiver.on('move', ev => {
    win.webContents.send(IPCChannels.tabletMove, ev)
  })
  receiver.on('up', ev => {
    win.webContents.send(IPCChannels.tabletUp, ev)
  })

  for (const ev of ['resize', 'enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize']) {
    win.on(ev as any, () => {
      win.webContents.send(IPCChannels.windowResize)
    })
  }

  win.on('close', e => {
    e.preventDefault()
    win.webContents.send(IPCChannels.quit)
  })

  win.on('closed', () => {
    receiver.dispose()
    mainWindow = undefined
    if (dialogsWindow) {
      dialogsWindow.destroy()
    }
    if (preferencesWindow) {
      preferencesWindow.destroy()
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.on('leave-full-screen', resetTitleColor)
}

function openTestWindow() {
  const win = testWindow = new BrowserWindow({
    width: 1200,
    height: 768,
  })
  win.loadURL(`${contentBase}/test.html`)
  win.webContents.openDevTools()
  win.on('closed', () => {
    testWindow = undefined
  })
  ipcMain.on('testDone', (e: Electron.IpcMessageEvent, failCount: number) => {
    if (!argv.devserver) {
      setImmediate(() => {
        process.exit(failCount)
      })
    }
  })
}

app.commandLine.appendSwitch('enable-experimental-web-platform-features')

app.on('ready', async () => {
  if (argv.test) {
    openTestWindow()
  } else {
    await openWindow()
    openDialogsWindow()
    openPreferencesWindow()
  }
})
app.on('browser-window-blur', () => {
  if (preferencesShown && mainWindow && !mainWindow.isFocused() && preferencesWindow && !preferencesWindow.isFocused()) {
    preferencesWindow.hide()
  }
})
app.on('browser-window-focus', (ev, win) => {
  if (preferencesShown &&  preferencesWindow && !preferencesWindow.isVisible()) {
    preferencesWindow.show()
  }
})
