import * as React from "react"
import {remote} from "electron"

export default
function FloatingWindowTitle(props: {title: string}) {
  const {title} = props
  const className = `FloatingWindowTitle FloatingWindowTitle-${process.platform}`
  const onClose = () => {
    remote.getCurrentWindow().close()
  }
  return (
    <div className={className}>
      {title}
      <div className="FloatingWindowTitle_close" onClick={onClose} />
    </div>
  )
}
