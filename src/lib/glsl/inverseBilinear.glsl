// http://www.iquilezles.org/www/articles/ibilinear/ibilinear.htm

float cross(vec2 a, vec2 b) {
  return a.x*b.y - a.y*b.x;
}

vec2 inverseBilinear(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  vec2 e = b-a;
  vec2 f = d-a;
  vec2 g = a-b+c-d;
  vec2 h = p-a;

  float k2 = cross( g, f );
  float k1 = cross( e, f ) + cross( h, g );
  float k0 = cross( h, e );

  float w = k1*k1 - 4.0*k0*k2;

  if( w<0.0 ) return vec2(-1.0);

  w = sqrt( w );

  if (abs(k2) < 0.001) {
    float v = -k0/k1;
    float u = (h.x - f.x*v)/(e.x + g.x*v);
    return vec2(u, v);
  }

  float v1 = (-k1 - w)/(2.0*k2);
  float v2 = (-k1 + w)/(2.0*k2);
  float u1 = (h.x - f.x*v1)/(e.x + g.x*v1);
  float u2 = (h.x - f.x*v2)/(e.x + g.x*v2);
  bool  b1 = v1>0.0 && v1<1.0 && u1>0.0 && u1<1.0;
  bool  b2 = v2>0.0 && v2<1.0 && u2>0.0 && u2<1.0;

  vec2 res = vec2(-1.0);

  if(  b1 && !b2 ) res = vec2( u1, v1 );
  if( !b1 &&  b2 ) res = vec2( u2, v2 );

  return res;
}

#pragma glslify: export(inverseBilinear)
