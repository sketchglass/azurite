import {remote} from "electron"
const {BrowserWindow, ipcMain} = remote

export
class Dialog<TResult> {
  constructor(public name: string) {
  }

  async open(): Promise<TResult|undefined> {
    const win = new BrowserWindow({width: 400, height: 200, show: false})
    win.setMenu(null as any)
    win.loadURL(`file://${__dirname}/../dialogs/${this.name}.html`)
    let callback: any
    let closed = false
    const result = await new Promise<TResult|undefined>((resolve, reject) => {
      callback = (e: Electron.IpcMainEvent, result: TResult) => {
        if (e.sender == win.webContents) {
          resolve(result)
        }
      }
      ipcMain.on("dialogDone", callback)
      win.on("closed", () => {
        closed = true
        resolve(undefined)
      })
    })
    ipcMain.removeListener("dialogDone", callback)
    if (!closed) {
      win.close()
    }
    return result
  }
}
