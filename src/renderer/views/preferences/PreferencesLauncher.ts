import {ipcRenderer} from 'electron'
import IPCChannels from '../../../common/IPCChannels'
import {appState} from '../../app/AppState'
import {PreferencesData} from '../../viewmodels/PreferencesViewModel'

export default
class PreferencesLauncher {
  constructor() {
    ipcRenderer.on(IPCChannels.preferencesChange, (e: Electron.IpcRendererEvent, data: PreferencesData) => {
      appState.undoGroupingInterval = data.undoGroupingInterval
    })
  }

  open() {
    const {undoGroupingInterval} = appState
    const data: PreferencesData = {
      undoGroupingInterval
    }
    ipcRenderer.send(IPCChannels.preferencesOpen, data)
  }
}

export const preferencesLauncher = new PreferencesLauncher()
