import {remote} from "electron"
const {Menu, app, dialog} = remote
type MenuItem = Electron.MenuItem
type BrowserWindow = Electron.BrowserWindow
type MenuItemOptions = Electron.MenuItemOptions
import Picture from "../models/Picture"
import PictureExport from "../models/PictureExport"
import PictureSave from "../models/PictureSave"
import {isTextInput} from "./util"
import * as IPCChannels from "../../common/IPCChannels"

class MenuBar {
  constructor() {
    const menu = Menu.buildFromTemplate(this.render())
    Menu.setApplicationMenu(menu)
  }

  save() {
    new PictureSave(Picture.current).save()
  }

  saveAs() {
    new PictureSave(Picture.current).saveAs()
  }

  newPicture() {
    IPCChannels.newPicture.send(undefined)
  }

  async open() {
    const filePath = await PictureSave.getOpenPath()
    if (filePath != undefined) {
      IPCChannels.openPicture.send(filePath)
    }
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
          label: "New",
          accelerator: "CmdOrCtrl+N",
          click: () => this.newPicture()
        },
        {
          label: "Open",
          accelerator: "CmdOrCtrl+O",
          click: () => this.open()
        },
        {
          type: 'separator'
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => this.save(),
        },
        {
          label: "Save As...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => this.saveAs(),
        },
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
