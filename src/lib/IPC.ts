import Electron = require("electron")
import assert = require("assert")
import {Observable} from "rxjs/Observable"
import {Observer} from "rxjs/Observer"

export
class IPCToRenderer<T> {
  constructor(public name: string) {
  }

  send(webContents: Electron.WebContents, value: T) {
    assert.equal(process.type, "browser")
    webContents.send(this.name, value)
  }

  listen(): Observable<T> {
    assert.equal(process.type, "renderer")
    return Observable.create((observer: Observer<T>) => {
      const {ipcRenderer} = Electron
      const callback = (ev: Electron.IpcRendererEvent, value: T) => observer.next(value)
      ipcRenderer.on(this.name, callback)
      return () => ipcRenderer.removeListener(this.name, callback)
    })
  }
}

export
class IPCToMain<T> {
  constructor(public name: string) {
  }

  send(value: T) {
    assert.equal(process.type, "renderer")
    Electron.ipcRenderer.send(this.name, value)
  }

  listen(sender?: Electron.WebContents): Observable<T> {
    assert.equal(process.type, "browser")
    return Observable.create((observer: Observer<T>) => {
      const {ipcMain} = Electron
      const callback = (ev: Electron.IpcMainEvent, value: T) => {
        if (!sender || ev.sender == sender) {
          observer.next(value)
        }
      }
      ipcMain.on(this.name, callback)
      return () => ipcMain.removeListener(this.name, callback)
    })
  }
}
