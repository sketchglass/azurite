import Action from "./Action"

export default
class ActionManager {
  actions = new Map<string, Action>()

  add(...actions: Action[]) {
    for (const action of actions) {
      this.actions.set(action.id, action)
    }
  }
}

export const actionManager = new ActionManager()

export function addAction(klass: {new(): Action}) {
  actionManager.add(new klass())
}
