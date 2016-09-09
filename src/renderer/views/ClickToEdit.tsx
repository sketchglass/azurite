import React = require("react")

interface ClickToEditProps {
  text: string
  onChange: (text: string) => void
}

export default
class ClickToEdit extends React.Component<ClickToEditProps, void> {
  isEditing = false

  render() {
    const {text, onChange} = this.props
    const {isEditing} = this
    return (
      <div className="ClickToEdit">
        <div hidden={isEditing} className="ClickToEdit-text" onClick={this.onTextClick.bind(this)}>{text}</div>
        <input type="text" hidden={!isEditing} className="ClickToEdit-input" defaultValue={text}
          onBlur={this.onInputBlur.bind(this)}
          onKeyPress={this.onInputKeyPress.bind(this)}
        />
      </div>
    )
  }

  onTextClick() {
    this.isEditing = true
    this.forceUpdate()
  }

  onEditFinish(text: string) {
    this.isEditing = false
    this.forceUpdate()
    this.props.onChange(text)
  }
  onInputBlur(event: React.FocusEvent<HTMLInputElement>) {
    const text = (event.target as HTMLInputElement).value
    this.onEditFinish(text)
  }
  onInputKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key == "Enter") { // enter
      const text = (event.target as HTMLInputElement).value
      this.onEditFinish(text)
      event.preventDefault()
    }
  }
}
