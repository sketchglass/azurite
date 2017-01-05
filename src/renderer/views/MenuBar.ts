import {remote} from "electron"
const {Menu, app} = remote
import {computed, autorun} from "mobx"
import {appState} from "../state/AppState"
import ActionIDs from "../state/ActionIDs"

interface MenuDescription extends Electron.MenuItemOptions {
  action?: string
  submenu?: MenuDescription[]
}

function resolveMenuDescription(description: MenuDescription): Electron.MenuItemOptions {
  const options: Electron.MenuItemOptions = {}
  Object.assign(options, description)
  if (description.action) {
    const action = appState.actions.get(description.action)
    if (action) {
      options.label = action.title
      options.enabled = action.enabled
      options.click = () => action.run()
      const key = appState.keyBindings.get(description.action)
      if (key) {
        options.accelerator = key.toElectronAccelerator()
      }
    }
  }
  if (description.submenu) {
    options.submenu = description.submenu.map(resolveMenuDescription)
  }
  return options
}

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

  open() {
    appState.openPicture()
  }

  close() {
    appState.closePicture(appState.currentPictureIndex)
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
          submenu: appState.imageFormats.map(format => {
            return {
              label: `${format.title}...`,
              enabled: !!this.pictureState,
              click: () => this.pictureState && this.pictureState.export(format),
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

    const selectionMenu: MenuDescription = {
      label: "Selection",
      submenu: [
        {action: ActionIDs.selectionSelectAll},
        {action: ActionIDs.selectionClear},
        {action: ActionIDs.selectionInvert},
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
        {
          role: 'minimize'
        },
        {
          role: 'close'
        }
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
      fileMenu, editMenu, selectionMenu, canvasMenu, viewMenu, windowMenu, helpMenu
    ]

    if (process.platform === 'darwin') {
      const name = app.getName()
      const appMenu: MenuDescription = {
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
      (editMenu.submenu as MenuDescription[]).push(
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

    return template.map(resolveMenuDescription)
  }
}

new MenuBar()
