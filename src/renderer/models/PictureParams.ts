
interface PictureOpenParams {
  action: "open"
  filePath: string
}

interface PictureNewParams {
  action: "new"
  width: number
  height: number
  dpi: number
}

type PictureParams = PictureOpenParams | PictureNewParams

export default PictureParams
