import {remote, ipcRenderer} from 'electron'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import '../common.css'
import NewPictureDialog from './NewPictureDialog'
import ResolutionChangeDialog from './ResolutionChangeDialog'
import ToolShortcutsDialog from './ToolShortcutsDialog'

window.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.DialogRoot')!

  const onReadyShow = () => {
    const {width, height} = root.firstElementChild!.getBoundingClientRect()
    const win = remote.getCurrentWindow()
    win.setMenu(null as any)
    win.setContentSize(Math.round(width), Math.round(height))
    win.center()
    setImmediate(() => {
      // delay window show to avoid flicker
      remote.getCurrentWindow().show()
    })
  }
  const onDone = (result: any) => {
    remote.getCurrentWindow().hide()
    ipcRenderer.send('dialogDone', result)
  }

  ipcRenderer.on('dialogOpen', (ev: Electron.IpcMessageEvent, name: string, param: any) => {
    ReactDOM.unmountComponentAtNode(root)
    let dialog: JSX.Element|undefined
    switch (name) {
      case 'newPicture':
        dialog = <NewPictureDialog onReadyShow={onReadyShow} onDone={onDone} />
        break
      case 'resolutionChange':
        dialog = <ResolutionChangeDialog init={param} onReadyShow={onReadyShow} onDone={onDone} />
        break
      case 'toolShortcuts':
        dialog = <ToolShortcutsDialog init={param} onReadyShow={onReadyShow} onDone={onDone} />
        break
    }
    if (dialog) {
      ReactDOM.render(dialog, root)
    }
  })
})
