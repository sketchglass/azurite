import Action from '../actions/Action'

export default
class ActionRegistry {
  actions = new Map<string, Action>()

  add(...actions: Action[]) {
    for (const action of actions) {
      this.actions.set(action.id, action)
    }
  }
}

export const actionRegistry = new ActionRegistry()

export function addAction(klass: {new(): Action}) {
  actionRegistry.add(new klass())
}
