import Electron = require('electron')
type BrowserWindow = Electron.BrowserWindow
const {app, BrowserWindow} = Electron

let window: BrowserWindow|undefined

function createWindow () {
  const win = window = new BrowserWindow({width: 800, height: 600})

  win.loadURL(`file://${__dirname}/../index.html`)
  win.webContents.openDevTools()

  win.on('closed', () => {
    window = undefined
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
