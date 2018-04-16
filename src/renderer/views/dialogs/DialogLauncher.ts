import {ipcRenderer} from 'electron'
import IPCChannels from '../../../common/IPCChannels'
import {PictureDimension} from '../../models/Picture'
import {ToolShortcutsDialogData} from './ToolShortcutsDialog'

export default
class DialogLauncher {

  openNewPictureDialog() {
    return this.open<PictureDimension, void>('newPicture', undefined)
  }

  openResolutionChangeDialog(init: PictureDimension) {
    return this.open<PictureDimension, PictureDimension>('resolutionChange', init)
  }

  openToolShortcutsDialog(init: ToolShortcutsDialogData) {
    return this.open<ToolShortcutsDialogData, ToolShortcutsDialogData>('toolShortcuts', init)
  }

  async open<TResult, TParam>(name: string, param: TParam): Promise<TResult|undefined> {
    let callback: any
    const result = await new Promise<TResult|undefined>((resolve, reject) => {
      callback = (e: Electron.IpcMessageEvent, result: TResult|undefined) => {
        resolve(result)
      }
      ipcRenderer.on(IPCChannels.dialogDone, callback)
      ipcRenderer.send(IPCChannels.dialogOpen, name, param)
    })
    ipcRenderer.removeListener(IPCChannels.dialogDone, callback)
    return result
  }
}

export
const dialogLauncher = new DialogLauncher()
