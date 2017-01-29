import * as React from "react"
import {remote} from "electron"

export default
function DialogTitleBar(props: {title: string}) {
  const {title} = props
  const className = `DialogTitleBar DialogTitleBar-${process.platform}`
  const onClose = () => {
    remote.getCurrentWindow().close()
  }
  return (
    <div className={className}>
      {title}
      <div className="DialogTitleBar_close" onClick={onClose} />
    </div>
  )
}
