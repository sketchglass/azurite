import Action from "./Action"

export default
class ActionManager {
  actions = new Map<string, Action>()

  addAction(...actions: Action[]) {
    for (const action of actions) {
      this.actions.set(action.id, action)
    }
  }
}

export const actionManager = new ActionManager()

export function addAction(klass: {new(): Action}) {
  actionManager.addAction(new klass())
}
