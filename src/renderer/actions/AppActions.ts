import Action from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../app/ActionRegistry"

@addAction
export class AppPreferencesAction extends Action {
  enabled = true
  title = "Preferences..."
  id = ActionIDs.appPreferences

  run() {
    // TODO
  }
}
