import {observable} from "mobx"
import {ipcRenderer} from "electron"
import IPCChannels from "../../common/IPCChannels"

export interface PreferencesData {
  undoGroupingInterval: number
}

export default class PreferencesViewModel {
  @observable undoGroupingInterval = 0

  setData(data: PreferencesData) {
    this.undoGroupingInterval = data.undoGroupingInterval
  }

  toData(): PreferencesData {
    const {undoGroupingInterval} = this
    return {undoGroupingInterval}
  }

  notifyChange() {
    ipcRenderer.send(IPCChannels.preferencesChange, this.toData())
  }
}
