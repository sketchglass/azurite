import {remote} from "electron"
const {Menu, app} = remote
type MenuItem = Electron.MenuItem
type BrowserWindow = Electron.BrowserWindow
type MenuItemOptions = Electron.MenuItemOptions
import {observable, computed, autorun} from "mobx"
import {appState} from "../state/AppState"
import Picture from "../models/Picture"
import PictureParams from "../models/PictureParams"
import PictureExport from "../services/PictureExport"
import {isTextInput} from "./util"
import {Dialog} from "./Dialog"
import {PictureSave} from "../services/PictureSave"

class MenuBar {
  constructor() {
    autorun(() => {
      const menu = Menu.buildFromTemplate(this.render())
      Menu.setApplicationMenu(menu)
    })
    window.addEventListener("focus", e => {
      this.isTextInputFocused = isTextInput(document.activeElement)
    }, true)
  }

  @computed get currentPicture() {
    const {modal, currentPicture} = appState
    if (!modal) {
      return currentPicture
    }
  }
  @computed get undoStack() {
    const {modal, modalUndoStack, currentPicture} = appState
    if (modal) {
      return modalUndoStack
    }
    if (currentPicture) {
      return currentPicture.undoStack
    }
  }

  async newPicture() {
    const dialog = new Dialog<PictureParams>("newPicture")
    const params = await dialog.open()
    if (params) {
      appState.pictures.push(new Picture(params))
      appState.currentPictureIndex = appState.pictures.length - 1
    }
  }

  async save() {
    if (this.currentPicture) {
      await new PictureSave(this.currentPicture).save()
    }
  }

  async saveAs() {
    if (this.currentPicture) {
      await new PictureSave(this.currentPicture).saveAs()
    }
  }

  async open() {
    const picture = await PictureSave.open()
    if (picture) {
      appState.pictures.push(picture)
      appState.currentPictureIndex = appState.pictures.length - 1
    }
  }

  @observable isTextInputFocused = false

  @computed get canUndo() {
    if (this.isTextInputFocused) {
      return true
    } else if (this.undoStack) {
      return this.undoStack.isUndoable
    }
    return false
  }

  @computed get canRedo() {
    if (this.isTextInputFocused) {
      return true
    } else if (this.undoStack) {
      return this.undoStack.isRedoable
    }
    return false
  }

  @computed get undoName() {
    if (this.undoStack) {
      const {undoCommand} = this.undoStack
      if (undoCommand) {
        return undoCommand.title
      }
    }
    return ""
  }

  @computed get redoName() {
    if (this.undoStack) {
      const {redoCommand} = this.undoStack
      if (redoCommand) {
        return redoCommand.title
      }
    }
    return ""
  }

  undo() {
    if (this.isTextInputFocused) {
      remote.getCurrentWebContents().undo()
    } else if (this.undoStack) {
      this.undoStack.undo()
    }
  }

  redo() {
    if (this.isTextInputFocused) {
      remote.getCurrentWebContents().redo()
    } else if (this.undoStack) {
      this.undoStack.redo()
    }
  }

  async export(format: "png"|"jpeg"|"bmp") {
    if (this.currentPicture) {
      const pictureExport = new PictureExport(this.currentPicture)
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

  zoomIn() {
    if (appState.currentPicture) {
      appState.currentPicture.navigation.zoomIn()
    }
  }
  zoomOut() {
    if (appState.currentPicture) {
      appState.currentPicture.navigation.zoomOut()
    }
  }
  resetZoom() {
    if (appState.currentPicture) {
      appState.currentPicture.navigation.scale = 1
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
      ],
    }

    const editMenu: MenuItemOptions = {
      label: 'Edit',
      submenu: [
        {
          label: `Undo ${this.undoName}`,
          enabled: this.canUndo,
          click: this.undo.bind(this),
          accelerator: "CmdOrCtrl+Z"
        },
        {
          label: `Redo ${this.redoName}`,
          enabled: this.canRedo,
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
