import {observer} from 'mobx-react'
import React = require('react')
import RangeSlider from './components/RangeSlider'
import FloodFillTool from '../tools/FloodFillTool'

@observer export default
class FloodFillSettings extends React.Component<{tool: FloodFillTool}, void> {
  render() {
    const {tool} = this.props
    const onToleranceChange = (value: number) => {
      tool.tolerance = value
    }
    return (
      <table className="BrushSettings">
        <tbody>
          <tr>
            <td>Tolerance</td>
            <td><RangeSlider onChange={onToleranceChange} min={0} max={255} value={tool.tolerance} /></td>
          </tr>
        </tbody>
      </table>
    )
  }
}
