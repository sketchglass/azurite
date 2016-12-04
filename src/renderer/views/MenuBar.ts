import {remote} from "electron"
const {Menu, app} = remote
type MenuItem = Electron.MenuItem
type BrowserWindow = Electron.BrowserWindow
type MenuItemOptions = Electron.MenuItemOptions
import {observable, computed, autorun} from "mobx"
import {appState} from "../state/AppState"
import {undoState} from "../state/UndoState"
import Picture from "../models/Picture"
import {PictureExportFormat} from "../services/PictureExport"

class MenuBar {
  @computed get pictureState() {
    return appState.currentPictureState
  }

  constructor() {
    autorun(() => {
      const menu = Menu.buildFromTemplate(this.render())
      Menu.setApplicationMenu(menu)
    })
  }

  newPicture() {
    appState.newPicture()
  }

  async save() {
    if (appState.currentPictureState) {
      appState.currentPictureState.save()
    }
  }

  async saveAs() {
    if (appState.currentPictureState) {
      appState.currentPictureState.saveAs()
    }
  }

  async open() {
    appState.openPicture()
  }

  async close() {
    appState.closePicture(appState.currentPictureIndex)
  }

  async export(format: PictureExportFormat) {
    if (appState.currentPictureState) {
      appState.currentPictureState.export(format)
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

  flipHorizontally() {
    if (appState.currentPictureState) {
      appState.currentPictureState.flip("horizontal")
    }
  }
  flipVertically() {
    if (appState.currentPictureState) {
      appState.currentPictureState.flip("vertical")
    }
  }

  zoomIn() {
    if (appState.currentPictureState) {
      appState.currentPictureState.picture.navigation.zoomIn()
    }
  }
  zoomOut() {
    if (appState.currentPictureState) {
      appState.currentPictureState.picture.navigation.zoomOut()
    }
  }
  resetZoom() {
    if (appState.currentPictureState) {
      appState.currentPictureState.picture.navigation.scale = 1
    }
  }

  render() {
    const fileMenu: MenuItemOptions = {
      label: "File",
      submenu: [
        {
          label: "New...",
          accelerator: "CmdOrCtrl+N",
          click: () => this.newPicture(),
        },
        {
          label: "Open...",
          accelerator: "CmdOrCtrl+O",
          click: () => this.open(),
        },
        {
          type: "separator",
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
        {
          type: "separator",
        },
        {
          label: "Close",
          accelerator: "CmdOrCtrl+W",
          click: () => this.close(),
        },
      ],
    }

    const editMenu: MenuItemOptions = {
      label: 'Edit',
      submenu: [
        {
          label: `Undo ${undoState.undoName}`,
          accelerator: "CmdOrCtrl+Z",
          enabled: undoState.canUndo,
          click: () => undoState.undo(),
        },
        {
          label: `Redo ${undoState.redoName}`,
          accelerator: process.platform === 'darwin' ? 'Shift+Command+Z' : 'Ctrl+Y',
          enabled: undoState.canRedo,
          click: () => undoState.redo(),
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

    const canvasMenu: MenuItemOptions = {
      label: "Canvas",
      submenu: [
        {
          label: "Flip Canvas Horizontally",
          click: () => this.flipHorizontally(),
        },
        {
          label: "Flip Canvas Vertically",
          click: () => this.flipVertically(),
        },
        {
          label: "Rotate 90° Left",
          enabled: !!this.pictureState,
          click: () => this.pictureState && this.pictureState.rotate90("left"),
        },
        {
          label: "Rotate 90° Right",
          enabled: !!this.pictureState,
          click: () => this.pictureState && this.pictureState.rotate90("right"),
        },
        {
          label: "Rotate 180°",
          enabled: !!this.pictureState,
          click: () => this.pictureState && this.pictureState.rotate180(),
        },
      ],
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
          label: "Actual Size",
          accelerator: "CmdOrCtrl+0",
          click: () => this.resetZoom(),
        },
        {
          label: "Zoom In",
          accelerator: "CmdOrCtrl+Plus",
          click: () => this.zoomIn(),
        },
        {
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          click: () => this.zoomOut(),
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
      fileMenu, editMenu, canvasMenu, viewMenu, windowMenu, helpMenu
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
