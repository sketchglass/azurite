import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {Geometry, Shader, Model, GeometryUsage, Framebuffer} from "../../lib/GL"
import {context} from "../GLContext"

const sampleVertShader = `
  precision mediump float;

  uniform float uSampleSize;
  uniform vec2 uLayerSize;

  attribute vec2 aPosition;

  varying vec2 vCenter;

  void main(void) {
    vec2 center = floor(aPosition - vec2(0.5)) + vec2(0.5);
    vCenter = center;
    gl_Position = vec4(center / uLayerSize * vec2(2.0) - vec2(1.0), 0.0, 1.0);
    gl_PointSize = uSampleSize;
  }
`

const copyOrigFragShader = `
  precision lowp float;

  uniform mediump float uSampleSize;

  uniform sampler2D uLayer;
  uniform mediump vec2 uLayerSize;

  varying mediump vec2 vCenter;

  void main(void) {
    vec2 pos = (gl_PointCoord - vec2(0.5)) * vec2(uSampleSize) + vCenter;
    gl_FragColor = texture2D(uLayer, pos / uLayerSize);
  }
`

const shapeFragShader = `
  precision lowp float;

  uniform mediump float uBrushRadius;
  uniform mediump float uSampleSize;

  void main(void) {
    float r = distance(gl_PointCoord, vec2(0.5)) * uSampleSize;
    lowp float opacity = smoothstep(uBrushRadius, uBrushRadius - 1.0, r);
    gl_FragColor = vec4(opacity);
  }
`

const sampleFragShader = `
  precision lowp float;

  uniform sampler2D uOriginal;
  uniform sampler2D uBrushShape;

  void main(void) {
    gl_FragColor = texture2D(uOriginal, gl_PointCoord) * vec4(texture2D(uBrushShape, gl_PointCoord).a);
  }
`

const brushVertShader = `
  precision mediump float;

  uniform float uSampleSize;
  uniform vec2 uLayerSize;
  attribute vec2 aPosition;

  uniform sampler2D uBrushShape;
  uniform sampler2D uSample;

  varying lowp vMixColor;

  void main(void) {
    vec2 center = floor(aPosition - vec2(0.5)) + vec2(0.5);
    gl_Position = vec4(center / uLayerSize * vec2(2.0) - vec2(1.0), 0.0, 1.0);
    gl_PointSize = uSampleSize;

    float topLevel = log2(uSampleSize);
    vMixColor = texture2DLod(uSample, vec2(0.0), topLevel) / vec4(texture2DLod(uBrushShape, vec2(0.0),  topLevel).a);
  }
`

const brushFragShader = `
  precision lowp float;

  uniform lowp float uBlending;
  uniform lowp float uThickness;
  uniform lowp vec4 uColor;

  uniform sampler2D uOriginal;
  uniform sampler2D uBrushShape;

  varying lowp vec4 vMixColor;

  void main(void) {
    vec4 orig = texture2D(uOriginal, gl_PointCoord);
    float brushOpacity = texture2D(uOriginal, gl_PointCoord).a;

    float mixRate = brushOpacity * uBlending;
    // mix color
    vec4 color = orig * vec4(1.0 - mixRate) + vMixColor * vec4(mixRate);
    // add color
    vec4 addColor = uColor * vec4(uThickness * brushOpacity);
    gl_FragColor = addColor + color * vec4(1.0 - addColor.a);
  }
`
