import React = require("react")
import "./SVGIcon.css"

const SVGIcon = (props: {className: string}) => {
  return <div className={"SVGIcon " + props.className} />
}
export default SVGIcon
