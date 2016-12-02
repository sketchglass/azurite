import {PictureDimension} from "../../models/Picture"
import {ipcRenderer} from "electron"

export default
class DialogLauncher {

  openNewPictureDialog(): Promise<PictureDimension|undefined> {
    return this.open("newPicture")
  }

  async open<T>(name: string): Promise<T|undefined> {
    let callback: any
    const result = await new Promise<T>((resolve, reject) => {
      callback = (e: Electron.IpcRendererEvent, result: T|undefined) => {
        resolve(result)
      }
      ipcRenderer.on("dialogDone", callback)
      ipcRenderer.send("dialogOpen", {name})
    })
    ipcRenderer.removeListener("dialogDone", callback)
    return result
  }
}

export
const dialogLauncher = new DialogLauncher()
