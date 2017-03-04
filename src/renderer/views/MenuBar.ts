import {remote} from "electron"
const {Menu, app} = remote
import {computed, autorun} from "mobx"
import {appState} from "../app/AppState"
import {actionRegistry} from "../app/ActionRegistry"
import {keyBindingRegistry} from "../app/KeyBindingRegistry"
import {formatRegistry} from "../app/FormatRegistry"
import ActionIDs from "../actions/ActionIDs"

interface MenuDescription extends Electron.MenuItemOptions {
  action?: string
  submenu?: MenuDescription[]
}

function menuDescriptionToElectron(description: MenuDescription): Electron.MenuItemOptions {
  const options: Electron.MenuItemOptions = {}
  Object.assign(options, description)
  if (description.action) {
    const action = actionRegistry.actions.get(description.action)
    if (action) {
      if (!options.label) {
        options.label = action.title
      }
      options.enabled = action.enabled
      options.click = () => action.run()
      const key = keyBindingRegistry.keyInputForAction(description.action)
      if (key) {
        options.accelerator = key.toElectronAccelerator()
      }
    }
  }
  if (description.submenu) {
    options.submenu = description.submenu.map(menuDescriptionToElectron)
  }
  return options
}

export default
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

  render() {
    const fileMenu: MenuDescription = {
      label: "File",
      submenu: [
        {action: ActionIDs.fileNew},
        {action: ActionIDs.fileOpen},
        {type: "separator"},
        {action: ActionIDs.fileImport},
        {type: "separator"},
        {action: ActionIDs.fileSave},
        {action: ActionIDs.fileSaveAs},
        {
          label: "Export",
          submenu: formatRegistry.imageFormats.map(format => {
            return {
              action: `${ActionIDs.fileExport}:${format.mimeType}`,
              label: `${format.title}...`,
            }
          }),
        },
        {type: "separator"},
        {action: ActionIDs.fileClose},
      ],
    }

    const editMenu: MenuDescription = {
      label: 'Edit',
      submenu: [
        {action: ActionIDs.editUndo},
        {action: ActionIDs.editRedo},
        {type: 'separator'},
        {action: ActionIDs.editCut},
        {action: ActionIDs.editCopy},
        {action: ActionIDs.editPaste},
        {action: ActionIDs.editDelete},
      ]
    }
    if (process.platform == "win32") {
      editMenu.submenu!.push(
        {type: "separator"},
        {action: ActionIDs.appPreferences},
      )
    }

    const selectionMenu: MenuDescription = {
      label: "Selection",
      submenu: [
        {action: ActionIDs.selectionSelectAll},
        {action: ActionIDs.selectionClear},
        {action: ActionIDs.selectionInvert},
      ],
    }

    const layerMenu: MenuDescription = {
      label: "Layer",
      submenu: [
        {action: ActionIDs.layerAdd},
        {action: ActionIDs.layerAddGroup},
        {action: ActionIDs.layerGroup},
        {action: ActionIDs.layerRemove},
        {type: "separator"},
        {action: ActionIDs.layerMerge},
        {type: "separator"},
        {action: ActionIDs.layerClear},
        {action: ActionIDs.layerFill},
      ],
    }

    const canvasMenu: MenuDescription = {
      label: "Canvas",
      submenu: [
        {action: ActionIDs.canvasChangeResolution},
        {type: "separator"},
        {action: ActionIDs.canvasRotateLeft},
        {action: ActionIDs.canvasRotateRight},
        {action: ActionIDs.canvasRotate180},
        {type: "separator"},
        {action: ActionIDs.canvasFlipHorizontally},
        {action: ActionIDs.canvasFlipVertically},
      ],
    }

    const viewMenu: MenuDescription = {
      label: 'View',
      submenu: [
        {action: ActionIDs.viewReload},
        {action: ActionIDs.viewToggleDevTools},
        {type: 'separator'},
        {action: ActionIDs.viewActualSize},
        {action: ActionIDs.viewZoomIn},
        {action: ActionIDs.viewZoomOut},
        {type: 'separator'},
        {action: ActionIDs.viewToggleUIPanels},
        {type: 'separator'},
        {action: ActionIDs.viewToggleFullscreen},
      ]
    }

    const windowMenu: MenuDescription = {
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'},
      ]
    }

    const helpMenu: MenuDescription = {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('http://electron.atom.io') }
        }
      ]
    }

    const template: MenuDescription[] = [
      fileMenu, editMenu, selectionMenu, layerMenu, canvasMenu, viewMenu, windowMenu, helpMenu
    ]

    if (process.platform === 'darwin') {
      const name = app.getName()
      const appMenu: MenuDescription = {
        label: name,
        submenu: [
          {role: 'about'},
          {type: 'separator'},
          {action: ActionIDs.appPreferences},
          {type: 'separator'},
          {role: 'services', submenu: []},
          {type: 'separator'},
          {role: 'hide'},
          {role: 'hideothers'},
          {role: 'unhide'},
          {type: 'separator'},
          {role: 'quit'},
        ]
      }
      template.unshift(appMenu);
      (editMenu.submenu as MenuDescription[]).push(
        {type: 'separator'},
        {label: 'Speech', submenu: [
          {role: 'startspeaking'},
          {role: 'stopspeaking'},
        ]},
      )
      windowMenu.submenu = [
        {role: 'close'},
        {role: 'minimize'},
        {role: 'zoom'},
        {type: 'separator'},
        {role: 'front'},
      ]
    }

    return template.map(menuDescriptionToElectron)
  }
}

export const menuBar = new MenuBar()
