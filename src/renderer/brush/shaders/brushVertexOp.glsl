
float correctOpacity(float opacity, float invWidth) {
   return 1.0 - pow(1.0 - min(opacity, 0.998), invWidth);
}

void brushVertexOp(
  vec2 pos,
  float pressure,
  vec2 center,
  float maxWidth,
  float minWidthRatio,
  float maxOpacity,
  float minOpacityRatio,
  float maxBlending,
  vec2 pictureSize,
  out vec2 offset,
  out float radius,
  out float opacity,
  out float blending,
  out vec2 selectionUV
) {
  offset = pos - center;
  float width = maxWidth * mix(minWidthRatio, 1.0, pressure);
  radius = width * 0.5;
  float overlappedOpacity = maxOpacity * mix(minOpacityRatio, 1.0, pressure);
  float invWidth = 1.0 / width;
  opacity = correctOpacity(overlappedOpacity, invWidth);
  blending = correctOpacity(maxBlending * pressure, invWidth);
  selectionUV = pos / pictureSize;
}

#pragma glslify: export(brushVertexOp)

