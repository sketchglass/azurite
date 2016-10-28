import React = require("react")

interface ClickToEditProps {
  text: string
  onChange: (text: string) => void
  editable: boolean
}

interface ClickToEditState {
  isEditing: boolean
}

export default
class ClickToEdit extends React.Component<ClickToEditProps, ClickToEditState> {
  state = {
    isEditing: false
  }

  componentWillReceiveProps(props: ClickToEditProps) {
    if (!props.editable) {
      this.setState({
        isEditing: false
      })
    }
  }

  render() {
    const {text, onChange, editable} = this.props
    const {isEditing} = this.state
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
    this.setState({
      isEditing: true
    })
    this.inputElem.setSelectionRange(0, this.inputElem.value.length);
  }

  onEditFinish(text: string) {
    this.setState({
      isEditing: false
    })
    this.props.onChange(text)
  }
  onInputBlur(event: React.FocusEvent) {
    const text = this.inputElem.value
    this.onEditFinish(text)
  }
  onInputKeyPress(event: React.KeyboardEvent) {
    if (event.key == "Enter") {
      const text = this.inputElem.value
      this.onEditFinish(text)
      event.preventDefault()
    }
  }
}
