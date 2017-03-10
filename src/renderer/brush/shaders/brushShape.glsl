
float brushShape(
  vec2 offset,
  float radius,
  float softness,
  bool hasSelection,
  sampler2D selection,
  vec2 selectionUV
) {
  float r = length(offset);
  float shape = smoothstep(radius, radius - max(1.0, radius * softness), r);
  if (hasSelection) {
    return shape * texture2D(selection, selectionUV).a;
  } else {
    return shape;
  }
}
#pragma glslify: export(brushShape)
