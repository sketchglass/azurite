import {PictureDimension} from "../../models/Picture"
import {ipcRenderer} from "electron"

export default
class DialogLauncher {

  openNewPictureDialog(): Promise<PictureDimension|undefined> {
    return this.open<PictureDimension, void>("newPicture", undefined)
  }

  async open<TResult, TParam>(name: string, param: TParam): Promise<TResult|undefined> {
    let callback: any
    const result = await new Promise<TResult|undefined>((resolve, reject) => {
      callback = (e: Electron.IpcRendererEvent, result: TResult|undefined) => {
        resolve(result)
      }
      ipcRenderer.on("dialogDone", callback)
      ipcRenderer.send("dialogOpen", name, param)
    })
    ipcRenderer.removeListener("dialogDone", callback)
    return result
  }
}

export
const dialogLauncher = new DialogLauncher()
