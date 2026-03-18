/**
 * @description Shader sources for Cesium Fluid simulation
 */

export const Command = `
// cesium for fluid by mind3d , fluid demo from https://www.shadertoy.com/view/7tSSDD
const int textureSize = 1024;
// Render
const vec3 backgroundColor = vec3(0.2);
// Terrain
uniform sampler2D boundaryMask;
uniform float allowFlowOut;
const float transitionTime = 5.0;
const float transitionPercent = 0.3;
const int octaves = 7;
// Water simulation
const float minTotalFlow = 0.0001;
const float initialWaterLevel = 0.03;
uniform vec4 fluidParam;
uniform vec4 customParam;
uniform float waterSize;

mat2 rot(in float ang) 
{
   return mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
}

float hash12(vec2 p)
{
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3)
{
    p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 boxIntersection( in vec3 ro, in vec3 rd, in vec3 rad, out vec3 oN ) 
{
    vec3 m = 1.0 / rd;
    vec3 n = m * ro;
    vec3 k = abs(m) * rad;
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;
    float tN = max( max( t1.x, t1.y ), t1.z );
    float tF = min( min( t2.x, t2.y ), t2.z );
    if( tN > tF || tF < 0.0) return vec2(-1.0);
    oN = -sign(rd)*step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
    return vec2( tN, tF );
}

vec2 hitBox(vec3 orig, vec3 dir) {
    const vec3 box_min = vec3(-0.5);
    const vec3 box_max = vec3(0.5);
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = (box_min - orig) * inv_dir;
    vec3 tmax_tmp = (box_max - orig) * inv_dir;
    vec3 tmin = min(tmin_tmp, tmax_tmp);
    vec3 tmax = max(tmin_tmp, tmax_tmp);
    float t0 = max(tmin.x, max(tmin.y, tmin.z));
    float t1 = min(tmax.x, min(tmax.y, tmax.z));
    return vec2(t0, t1);
}

vec3 applyFog( in vec3  rgb, vec3 fogColor, in float distance)
{
    float fogAmount = exp( -distance );
    return mix( fogColor, rgb, fogAmount );
}
`;

export const BufferA = `
// compute Terrain and update water level 1st pass
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D heightMap;
uniform float     iTime;
uniform int     iFrame;
uniform vec2     center;
uniform float   playTime;
uniform vec2    resolution;
uniform float     minHeight;
uniform float     maxHeight;
uniform vec2     waterSourcePos;
uniform float    waterSourceRadius;
uniform float    waterSourceStrength;
uniform float    continuousFlow;
uniform vec2     continuousSourcePos;
uniform float    flowRate;
uniform float    deltaTime;
uniform float    flowToNormalized;
uniform float    clickVolumeToNormalized;
float boxNoise( in vec2 p, in float z )
{
    vec2 fl = floor(p);
    vec2 fr = fract(p);
    fr = smoothstep(0.0, 1.0, fr);
    float res = mix(mix( hash13(vec3(fl, z)), hash13(vec3(fl + vec2(1,0), z)),fr.x),
                    mix( hash13(vec3(fl + vec2(0,1), z)), hash13(vec3(fl + vec2(1,1), z)),fr.x),fr.y);
    return res;
}

float Terrain( in vec2 p, in float z, in int octaveNum)
{
    float a = 1.0;
    float f = .0;
    for (int i = 0; i < octaveNum; i++)
    {
        f += a * boxNoise(p, z);
        a *= 0.45;
        p = 2.0 * rot(radians(41.0)) * p;
    }
    return f;
}

vec2 readHeight(ivec2 p)
{
    p = clamp(p, ivec2(0), ivec2(textureSize - 1));
    return texelFetch(iChannel0, p, 0).xy;
}

vec4 readOutFlow(ivec2 p)
{
    if(p.x < 0 || p.y < 0 || p.x >= textureSize || p.y >= textureSize)
        return vec4(0);
    return texelFetch(iChannel1, p, 0);
}
void main( )
{
    if( max(gl_FragCoord.x, gl_FragCoord.y) > float(textureSize) )
        discard;

    vec2 uv = gl_FragCoord.xy / float(textureSize);
    float maskValue = texture(boundaryMask, uv).r;
    float t = iTime / transitionTime;
    float terrainElevation = texture(heightMap, uv).r;
    terrainElevation = (terrainElevation - (minHeight)) / (maxHeight - (minHeight));

    float waterDept = 0.0;
    float dist = length(uv - waterSourcePos);
    if(dist < waterSourceRadius) {
        float falloff = 1.0 - (dist / waterSourceRadius);
        waterDept = waterSourceStrength * clickVolumeToNormalized * falloff * falloff;
    }

    if(continuousFlow > 0.5) {
        float contDist = length(uv - continuousSourcePos);
        if(contDist < waterSourceRadius) {
            float falloff = 1.0 - (contDist / waterSourceRadius);
            waterDept += flowRate * deltaTime * flowToNormalized * falloff * falloff;
        }
    }

    if(iFrame != 0)
    {
        ivec2 p = ivec2(gl_FragCoord.xy);
        vec2 height = readHeight(p);
        vec4 OutFlow = texelFetch(iChannel1, p, 0);
        float totalOutFlow = OutFlow.x + OutFlow.y + OutFlow.z + OutFlow.w;
        float totalInFlow = 0.0;
        totalInFlow += readOutFlow(p  + ivec2( 1,  0)).z;
        totalInFlow += readOutFlow(p  + ivec2( 0,  1)).w;
        totalInFlow += readOutFlow(p  + ivec2(-1,  0)).x;
        totalInFlow += readOutFlow(p  + ivec2( 0, -1)).y;
        waterDept += height.y - totalOutFlow + totalInFlow;

        if(allowFlowOut < 0.5 && maskValue < 0.5) {
            float dissipationRate = 0.95;
            waterDept *= dissipationRate;
        }
    }
    out_FragColor = vec4(terrainElevation, waterDept, 0, 1);
}
`;

export const BufferB = `
// Update Outflow 1st pass
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform float     iTime;
uniform int     iFrame;
vec2 readHeight(ivec2 p)
{
    p = clamp(p, ivec2(0), ivec2(textureSize - 1));
    return texelFetch(iChannel0, p, 0).xy;
} 

float computeOutFlowDir(vec2 centerHeight, ivec2 pos)
{
    vec2 dirHeight = readHeight(pos);
    vec2 targetUV = vec2(pos) / float(textureSize);
    float targetMask = texture(boundaryMask, targetUV).r;
    if(allowFlowOut < 0.5 && targetMask < 0.5) return 0.0;
    return max(0.0f, (centerHeight.x + centerHeight.y) - (dirHeight.x + dirHeight.y));
}

void main()
{
    ivec2 p = ivec2(gl_FragCoord.xy);
    if(iFrame == 0)
    {
        out_FragColor = vec4(0);
        return;
    }    
    if( max(p.x, p.y) > textureSize )
        discard;
    
    vec4 oOutFlow = texelFetch(iChannel1, p, 0);
    vec2 height = readHeight(p);
    vec4 nOutFlow;        
    nOutFlow.x = computeOutFlowDir(height, p + ivec2( 1,  0));
    nOutFlow.y = computeOutFlowDir(height, p + ivec2( 0,  1));
    nOutFlow.z = computeOutFlowDir(height, p + ivec2(-1,  0));
    nOutFlow.w = computeOutFlowDir(height, p + ivec2( 0, -1));
    nOutFlow = fluidParam.x * oOutFlow + fluidParam.y * nOutFlow;
    float totalFlow = nOutFlow.x + nOutFlow.y + nOutFlow.z + nOutFlow.w;
    if(totalFlow > fluidParam.z)
    {
        if(height.y < totalFlow)
        {
            nOutFlow = nOutFlow * (height.y / totalFlow);
        }
    }
    else
    {
        nOutFlow = vec4(0);
    }
    out_FragColor = nOutFlow;
}
`;

export const BufferC = `
// water level 2nd pass
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform float     iTime;
uniform int     iFrame;
vec2 readHeight(ivec2 p)
{
    p = clamp(p, ivec2(0), ivec2(textureSize - 1));
    return texelFetch(iChannel0, p, 0).xy;
} 

vec4 readOutFlow(ivec2 p)
{
    if(p.x < 0 || p.y < 0 || p.x >= textureSize || p.y >= textureSize)
        return vec4(0);
    return texelFetch(iChannel1, p, 0);
} 

void main( )
{
    if( max(gl_FragCoord.x, gl_FragCoord.y) > float(textureSize) )
        discard;
           
    ivec2 p = ivec2(gl_FragCoord.xy);
    vec2 height = readHeight(p);
    vec4 OutFlow = texelFetch(iChannel1, p, 0);
    float totalOutFlow = OutFlow.x + OutFlow.y + OutFlow.z + OutFlow.w;
    float totalInFlow = 0.0;
    totalInFlow += readOutFlow(p  + ivec2( 1,  0)).z;
    totalInFlow += readOutFlow(p  + ivec2( 0,  1)).w;
    totalInFlow += readOutFlow(p  + ivec2(-1,  0)).x;
    totalInFlow += readOutFlow(p  + ivec2( 0, -1)).y;
    float waterDept = height.y - totalOutFlow + totalInFlow;
    out_FragColor = vec4(height.x, waterDept, 0, 1);
}
`;

export const BufferD = `
// Update Outflow 2nd pass
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform float     iTime;
uniform int     iFrame;
vec2 readHeight(ivec2 p)
{
    p = clamp(p, ivec2(0), ivec2(textureSize - 1));
    return texelFetch(iChannel0, p, 0).xy;
} 

float computeOutFlowDir(vec2 centerHeight, ivec2 pos)
{
    vec2 dirHeight = readHeight(pos);
    vec2 targetUV = vec2(pos) / float(textureSize);
    float targetMask = texture(boundaryMask, targetUV).r;
    if(allowFlowOut < 0.5 && targetMask < 0.5) return 0.0;
    return max(0.0f, (centerHeight.x + centerHeight.y) - (dirHeight.x + dirHeight.y));
}

void main( )
{
    ivec2 p = ivec2(gl_FragCoord.xy);
    if( max(p.x, p.y) > textureSize )
        discard;
    
    vec4 oOutFlow = texelFetch(iChannel1, p, 0);
    vec2 height = readHeight(p);
    vec4 nOutFlow;        
    nOutFlow.x = computeOutFlowDir(height, p + ivec2( 1,  0));
    nOutFlow.y = computeOutFlowDir(height, p + ivec2( 0,  1));
    nOutFlow.z = computeOutFlowDir(height, p + ivec2(-1,  0));
    nOutFlow.w = computeOutFlowDir(height, p + ivec2( 0, -1));
    nOutFlow = fluidParam.x * oOutFlow + fluidParam.y * nOutFlow;
    float totalFlow = nOutFlow.x + nOutFlow.y + nOutFlow.z + nOutFlow.w;
    if(totalFlow > fluidParam.z)
    {
        if(height.y < totalFlow)
        {
            nOutFlow = nOutFlow * (height.y / totalFlow);
        }
    }
    else
    {
        nOutFlow = vec4(0);
    }
    out_FragColor = nOutFlow;
}
`;

export const renderShaderSource = `
// Created by David Gallardo - xjorma/2021
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0
uniform sampler2D iChannel0;
uniform sampler2D heightMap;
uniform sampler2D colorTexture;
uniform vec2     iResolution;
uniform float     iTime;
uniform int     iFrame;
uniform float    waterDepthColorIntensity;
in vec3 vo;
in vec3 vd;
in vec2 v_st;
const vec3 light = vec3(0.,4.,2.);
const vec3 boxSize = vec3(0.5);

vec3 getDepthColor(float waterDepth) {
    float normalizedDepth = clamp(waterDepth * waterDepthColorIntensity * 10.0, 0.0, 1.0);
    vec3 color1 = vec3(0.0, 0.4, 0.9);
    vec3 color2 = vec3(0.9, 0.9, 0.2);
    vec3 color3 = vec3(1.0, 0.5, 0.0);
    vec3 color4 = vec3(0.9, 0.0, 0.0);
    vec3 color;
    if (normalizedDepth < 0.33) {
        color = mix(color1, color2, normalizedDepth * 3.0);
    } else if (normalizedDepth < 0.66) {
        color = mix(color2, color3, (normalizedDepth - 0.33) * 3.0);
    } else {
        color = mix(color3, color4, (normalizedDepth - 0.66) * 3.0);
    }
    return color;
}

float getWaterDepth(in vec3 p) {
    p = (p + 1.0) - 0.5;
    vec2 p2 = p.xz * vec2(float(textureSize)) / iResolution.xy;
    p2 = min(p2, vec2(float(textureSize) - 0.5) / iResolution.xy);
    vec2 h = texture(iChannel0, p2).xy;
    return h.y;
}

vec2 getHeight(in vec3 p)
{
    p = (p + 1.0) - 0.5;
    vec2 p2 = p.xz * vec2(float(textureSize)) / iResolution.xy;
    p2 = min(p2, vec2(float(textureSize) - 0.5) / iResolution.xy);
    vec2 h = texture(iChannel0, p2).xy;
    h.y += h.x;
    return h - boxSize.z;
} 

vec3 getNormal(in vec3 p, int comp)
{
    float d = 2.0 / float(textureSize);
    float hMid = getHeight(p)[comp];
    float hRight = getHeight(p + vec3(d, 0, 0))[comp];
    float hTop = getHeight(p + vec3(0, 0, d))[comp];
    return normalize(cross(vec3(0, hTop - hMid, d), vec3(d, hRight - hMid, 0)));
}

vec3 terrainColor(in vec3 p, in vec3 n, out float spec)
{
    return texture(heightMap, p.xz).yzw;
}

vec3 undergroundColor(float d)
{
    vec3 color[4] = vec3[](vec3(0.5, 0.45, 0.5), vec3(0.40, 0.35, 0.25), vec3(0.55, 0.50, 0.4), vec3(0.45, 0.30, 0.20));
    d *= 6.0;
    d = min(d, 3.0 - 0.001);
    float fr = fract(d);
    float fl = floor(d);
    return mix(color[int(fl)], color[int(fl) + 1], fr);
}

vec3 Render(in vec3 ro, in vec3 rd)
{
    vec3 n;
    vec2 ret = boxIntersection(ro, rd, boxSize, n);
    vec2 uv = gl_FragCoord.xy / czm_viewport.zw;
    if(ret.x > 0.0)
    {
        vec3 pi = ro + rd * ret.x;
        vec3 tc;
        vec3 tn;
        float tt = ret.x;
        vec2 h = getHeight(pi);
        float spec;
        if(pi.y < h.x)
        {
            tn = n;
            tc = undergroundColor(h.x - pi.y);
        }
        else
        {
            for (int i = 0; i < 80; i++)
            {
                vec3 p = ro + rd * tt;
                float h = p.y - getHeight(p).x;
                if (h < 0.0002 || tt > ret.y)
                    break;
                tt += h * 0.1;
            }
            vec3 p = ro + rd * tt;
            p = (p + 1.0) - 0.5;
            vec2 uv = gl_FragCoord.xy / czm_viewport.zw;
            tc = texture(colorTexture, uv).rgb;
        }
        
        if(tt > ret.y) {
            tc = texture(colorTexture, uv).rgb;
        }
        
        float wt = ret.x;
        h = getHeight(pi);
        vec3 waterNormal;
        if(pi.y < h.y)
        {
            waterNormal = n;
        }
        else
        {
            for (int i = 0; i < 80; i++)
            {
                vec3 p = ro + rd * wt;
                float h = p.y - getHeight(p).y;
                if (h < 0.0002 || wt > min(tt, ret.y))
                    break;
                wt += h * 0.1;
            }
            waterNormal = getNormal(ro + rd * wt, 1);
        }
        
        if(wt < ret.y)
        {
            float dist = (min(tt, ret.y) - wt);
            vec3 waterPos = ro + rd * wt;
            vec3 lightDir = normalize(light - (ro + rd * tt));
            float actualWaterDepth = getWaterDepth(waterPos);
            vec3 depthColor = getDepthColor(actualWaterDepth);
            vec3 color = depthColor;
            tc = applyFog( tc, color, dist * customParam.x);
            float spec = pow(max(0., dot(lightDir, reflect(rd, waterNormal))),customParam.y);
            tc += customParam.z * spec * smoothstep(0.0, 0.1, dist);
        }else{
            discard;
        }
        return tc;
    }
    discard;
}

void main()
{
    vec3 tot = vec3(0.0);
    vec3 rayDir = normalize(vd);
    vec3 col = Render(vo, rayDir);
    tot += col;
    out_FragColor = vec4( tot, 1.0 );
}
`;

export const atmosphereFs = `
precision highp float;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform vec4 customParam;
in vec2 v_textureCoordinates;
const float PI = 3.14159265359;
const float TWO_PI = PI * 2.0;
const float FOUR_PI = PI * 4.0;
const vec3 betaR = vec3(5.5e-6, 13.0e-6, 22.4e-6); 
const vec3 betaM = vec3(21e-6);
const float hR = 10e3;
const float hM = 3.8e3;
const int num_samples = 16;
const int num_samples_light = 4;
#ifdef GL_ES
    #define _in(T) const in T
    #define _inout(T) inout T
    #define _out(T) out T
    #define _begin(type) type (
    #define _end )
    #define mul(a, b) (a) * (b)
#endif
struct ray_t { vec3 origin; vec3 direction; };
struct sphere_t { vec3 origin; float radius; int material; };
struct plane_t { vec3 direction; float distance; int material; };
plane_t plane;
mat3 rotate_around_x(const in float angle_degrees) {
    float angle = radians(angle_degrees);
    float _sin = sin(angle); float _cos = cos(angle);
    return mat3(1, 0, 0, 0, _cos, -_sin, 0, _sin, _cos);
}
bool isect_sphere(const in ray_t ray, const in sphere_t sphere, inout float t0, inout float t1) {
    vec3 rc = sphere.origin - ray.origin;
    float radius2 = sphere.radius * sphere.radius;
    float tca = dot(rc, ray.direction);
    float d2 = dot(rc, rc) - tca * tca;
    if (d2 > radius2) return false;
    float thc = sqrt(radius2 - d2);
    t0 = tca - thc; t1 = tca + thc;
    return true;
}
float rayleigh_phase_func(float mu) { return 3. * (1. + mu*mu) / (16. * PI); }
const float g = 0.76;
float henyey_greenstein_phase_func(float mu) {
    return (1. - g*g) / ((4. * PI) * pow(1. + g*g - 2.*g*mu, 1.5));
}
const sphere_t atmosphere = sphere_t(vec3(0, 0, 0), 6420e3, 0);
bool get_sun_light(const in ray_t ray, inout float optical_depthR, inout float optical_depthM) {
    float t0, t1;
    isect_sphere(ray, atmosphere, t0, t1);
    float march_pos = 0.;
    float march_step = t1 / float(num_samples_light);
    for (int i = 0; i < num_samples_light; i++) {
        vec3 s = ray.origin + ray.direction * (march_pos + 0.5 * march_step);
        float height = length(s) - 6360e3;
        if (height < 0.) return false;
        optical_depthR += exp(-height / hR) * march_step;
        optical_depthM += exp(-height / hM) * march_step;
        march_pos += march_step;
    }
    return true;
}
vec4 get_incident_light(const in ray_t ray) {
    vec3 dir = ray.direction; vec3 start = ray.origin;
    float a = dot(dir, dir);
    float b = 2.0 * dot(dir, start);
    float radius2 = atmosphere.radius * atmosphere.radius;
    float c = dot(start, start) - radius2;
    float d = (b * b) - 4.0 * a * c;
    if (d < 0.0) return vec4(0.0);
    float squaredD = sqrt(d);
    vec2 ray_length = vec2(max((-b - squaredD) / (2.0 * a), 0.0), min((-b + squaredD) / (2.0 * a), plane.distance));
    if (ray_length.x > ray_length.y) return vec4(0.0);
    float march_step = (ray_length.y - ray_length.x) / float(num_samples);
    float mu = dot(ray.direction, normalize(czm_sunPositionWC));
    float phaseR = rayleigh_phase_func(mu);
    float phaseM = henyey_greenstein_phase_func(mu);
    float optical_depthR = 0.; float optical_depthM = 0.;
    vec3 sumR = vec3(0); vec3 sumM = vec3(0);
    float march_pos = 0.;
    for (int i = 0; i < num_samples; i++) {
        vec3 s = ray.origin + ray.direction * (march_pos + 0.5 * march_step);
        float height = length(s) - 6360e3;
        float hr = exp(-height / hR) * march_step;
        float hm = exp(-height / hM) * march_step;
        optical_depthR += hr; optical_depthM += hm;
        ray_t light_ray = ray_t(s, normalize(czm_sunPositionWC));
        float optical_depth_lightR = 0.; float optical_depth_lightM = 0.;
        bool overground = get_sun_light(light_ray, optical_depth_lightR, optical_depth_lightM);
        if (overground) {
            vec3 tau = betaR * (optical_depthR + optical_depth_lightR) + betaM * 1.1 * (optical_depthM + optical_depth_lightM);
            vec3 attenuation = exp(-tau);
            sumR += hr * attenuation; sumM += hm * attenuation;
        }
        march_pos += march_step;
    }
    float attenuation = length(exp(-((betaM * optical_depthM) + (betaR * optical_depthR)) * 4.));
    return vec4(23. * (sumR * phaseR * betaR + sumM * phaseM * betaM), 1.0 - attenuation);
}

void main() {
    vec4 rawColor = texture(colorTexture, v_textureCoordinates);
    float depth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates));
    vec4 positionEC = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
    vec4 positionWC = czm_inverseView * positionEC;
    positionWC.xyz = positionWC.xyz / positionWC.w;
    vec3 lVector = positionWC.xyz - czm_viewerPositionWC;
    ray_t ray;
    ray.origin = czm_viewerPositionWC;
    ray.direction = normalize(lVector);
    plane.distance = length(lVector);
    vec4 atmosphereColor = get_incident_light(ray);
    rawColor = atmosphereColor + rawColor * (1.0 - atmosphereColor.a);
    rawColor = vec4(1.0 - exp(-2.2 * rawColor));
    out_FragColor = rawColor;
}      
`;
