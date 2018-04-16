import {ipcRenderer} from 'electron'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import IPCChannels from '../../../common/IPCChannels'
import {PreferencesData} from '../../viewmodels/PreferencesViewModel'
import '../common.css'
import Preferences from './Preferences'

window.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.PreferencesRoot')!
  let preferences: Preferences
  ReactDOM.render(<Preferences ref={e => preferences = e!} />, root)
  ipcRenderer.on(IPCChannels.preferencesOpen, (ev: Electron.IpcMessageEvent, data: PreferencesData) => {
    preferences.viewModel.setData(data)
  })
})
