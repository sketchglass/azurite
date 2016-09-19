import {remote} from "electron"
const {Menu, app} = remote
type MenuItem = Electron.MenuItem
type BrowserWindow = Electron.BrowserWindow
type MenuItemOptions = Electron.MenuItemOptions
import Picture from "../models/Picture"
import PictureExport from "../models/PictureExport"

function isTextInput(elem: Element) {
  if (elem instanceof HTMLTextAreaElement) {
    return true
  }
  if (elem instanceof HTMLInputElement) {
    const inputTypes = ['text', 'password', 'number', 'email', 'url', 'search', 'date', 'datetime', 'datetime-local', 'time', 'month', 'week']
    return inputTypes.indexOf(elem.type) >= 0
  }
  return false
}

class MenuBar {
  constructor() {
    const menu = Menu.buildFromTemplate(this.render())
    Menu.setApplicationMenu(menu)
  }

  undo() {
    if (isTextInput(document.activeElement)) {
      remote.getCurrentWebContents().undo()
    } else if (Picture.current) {
      Picture.current.undoStack.undo()
    }
  }

  redo() {
    if (isTextInput(document.activeElement)) {
      remote.getCurrentWebContents().redo()
    } else if (Picture.current) {
      Picture.current.undoStack.redo()
    }
  }

  async export(format: "png"|"jpeg"|"bmp") {
    if (Picture.current) {
      const pictureExport = new PictureExport(Picture.current)
      await pictureExport.showExportDialog(format)
      pictureExport.dispose()
    }
  }
  exportPng() {
    this.export("png")
  }
  exportJpeg() {
    this.export("jpeg")
  }
  exportBmp() {
    this.export("bmp")
  }

  render() {
    const fileMenu: MenuItemOptions = {
      label: "File",
      submenu: [
        {
          label: "Export",
          submenu: [
            {
              label: "PNG...",
              click: () => this.exportPng(),
            },
            {
              label: "JPEG...",
              click: () => this.exportJpeg(),
            },
            {
              label: "BMP...",
              click: () => this.exportBmp(),
            },
          ],
        },
      ],
    }

    const editMenu: MenuItemOptions = {
      label: 'Edit',
      submenu: [
        {
          label: "Undo",
          click: this.undo.bind(this),
          accelerator: "CmdOrCtrl+Z"
        },
        {
          label: "Redo",
          accelerator: process.platform === 'darwin' ? 'Shift+Command+Z' : 'Ctrl+Y',
          click: this.redo.bind(this)
        },
        {
          type: 'separator'
        },
        {
          role: 'cut'
        },
        {
          role: 'copy'
        },
        {
          role: 'paste'
        },
        {
          role: 'pasteandmatchstyle'
        },
        {
          role: 'delete'
        },
        {
          role: 'selectall'
        }
      ]
    }

    const viewMenu: MenuItemOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click (item: MenuItem, focusedWindow: BrowserWindow) {
            if (focusedWindow) focusedWindow.reload()
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click (item: MenuItem, focusedWindow: BrowserWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'resetzoom'
        },
        {
          role: 'zoomin'
        },
        {
          role: 'zoomout'
        },
        {
          type: 'separator'
        },
        {
          role: 'togglefullscreen'
        }
      ]
    }

    const windowMenu: MenuItemOptions = {
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          role: 'close'
        }
      ]
    }

    const helpMenu: MenuItemOptions = {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('http://electron.atom.io') }
        }
      ]
    }

    const template: MenuItemOptions[] = [
      fileMenu, editMenu, viewMenu, windowMenu, helpMenu
    ]

    if (process.platform === 'darwin') {
      const name = app.getName()
      const appMenu: MenuItemOptions = {
        label: name,
        submenu: [
          {
            role: 'about'
          },
          {
            type: 'separator'
          },
          {
            role: 'services',
            submenu: []
          },
          {
            type: 'separator'
          },
          {
            role: 'hide'
          },
          {
            role: 'hideothers'
          },
          {
            role: 'unhide'
          },
          {
            type: 'separator'
          },
          {
            role: 'quit'
          }
        ]
      }
      template.unshift(appMenu);
      (editMenu.submenu as MenuItemOptions[]).push(
        {
          type: 'separator'
        },
        {
          label: 'Speech',
          submenu: [
            {
              role: 'startspeaking'
            },
            {
              role: 'stopspeaking'
            }
          ]
        }
      )
      windowMenu.submenu = [
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Zoom',
          role: 'zoom'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    }

    return template
  }
}

new MenuBar()
