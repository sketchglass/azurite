import Electron = require('electron')
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow, ipcMain, Menu} = Electron

import {TabletEventReceiver} from "receive-tablet-event"

let window: BrowserWindow|undefined

function createWindow () {
  const win = window = new BrowserWindow({width: 1200, height: 768})

  win.loadURL(`file://${__dirname}/../index.html`)
  win.webContents.openDevTools()

  const menuTemplate: Electron.MenuItemOptions[] = [
    {
      label: "Edit",
      submenu: [
        {
          label: "Save As…",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send("document.save")
          }
        },
        {
          type: "separator"
        },
        {
          role: "quit"
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  const receiver = new TabletEventReceiver(win)

  ipcMain.on("tablet.install", (ev, captureArea) => {
    receiver.captureArea = captureArea;
  })

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
