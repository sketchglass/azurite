
interface Action {
  id: string
  title: string
  enabled?: boolean
  run(...args: any[]): void
}
export default Action
