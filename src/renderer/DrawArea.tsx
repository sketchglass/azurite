import React = require("react")

export default
class DrawArea extends React.Component<void, void> {
  render() {
    return (
      <canvas width={1024} height={768} />
    )
  }
}
