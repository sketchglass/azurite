import {addAction} from '../app/ActionRegistry'
import {preferencesLauncher} from '../views/preferences/PreferencesLauncher'
import Action from './Action'
import ActionIDs from './ActionIDs'

@addAction
export class AppPreferencesAction extends Action {
  enabled = true
  title = 'Preferences...'
  id = ActionIDs.appPreferences

  run() {
    preferencesLauncher.open()
  }
}
