import React = require("react")

interface ClickToEditProps {
  text: string
  onChange: (text: string) => void
  editable: boolean
}

export default
class ClickToEdit extends React.Component<ClickToEditProps, void> {
  isEditing = false

  render() {
    const {text, onChange, editable} = this.props
    if (!editable) {
      this.isEditing = false
    }
    const {isEditing} = this
    return (
      <div className="ClickToEdit">
        <div hidden={isEditing} className="ClickToEdit-text" onClick={this.onTextClick.bind(this)}>{text}</div>
        <input ref="input" type="text" hidden={!isEditing} className="ClickToEdit-input" defaultValue={text}
          onBlur={this.onInputBlur.bind(this)}
          onKeyPress={this.onInputKeyPress.bind(this)}
        />
      </div>
    )
  }

  get inputElem() {
    return this.refs["input"] as HTMLInputElement
  }

  onTextClick() {
    if (!this.props.editable) {
      return
    }
    this.isEditing = true
    this.forceUpdate()
    this.inputElem.setSelectionRange(0, this.inputElem.value.length);
  }

  onEditFinish(text: string) {
    this.isEditing = false
    this.forceUpdate()
    this.props.onChange(text)
  }
  onInputBlur(event: React.FocusEvent<HTMLInputElement>) {
    const text = this.inputElem.value
    this.onEditFinish(text)
  }
  onInputKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key == "Enter") {
      const text = this.inputElem.value
      this.onEditFinish(text)
      event.preventDefault()
    }
  }
}
