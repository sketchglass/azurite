import ImageFormat from "./ImageFormat"
import {addImageFormat} from "../state/FormatRegistry"

@addImageFormat
export
class JPEGImageFormat extends ImageFormat {
  title = "JPEG"
  extensions = ["jpg", "jpeg"]
  mimeType = "image/jpeg"
}

@addImageFormat
export
class PNGImageFormat extends ImageFormat {
  title = "PNG"
  extensions = ["png"]
  mimeType = "image/png"
}

@addImageFormat
export
class BMPImageFormat extends ImageFormat {
  title = "BMP"
  extensions = ["bmp"]
  mimeType = "image/bmp"
}
