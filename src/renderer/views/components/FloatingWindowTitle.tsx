import * as React from "react"

export default
function FloatingWindowTitle(props: {title: string}) {
  const {title} = props
  const className = `FloatingWindowTitle FloatingWindowTitle-${process.platform}`
  return (
    <div className={className}>
      {title}
      <div className="FloatingWindowTitle_close" />
    </div>
  )
}
