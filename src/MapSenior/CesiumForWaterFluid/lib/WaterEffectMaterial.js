/**
 * 河流水面材质，负责把水面 shader 挂接到 Cesium 渲染管线。
 */
export class WaterEffectMaterial {
  /**
   * 创建河流水面材质。
   *
   * @param {object} options - 水面创建参数。
   * @param {Cesium.Geometry} options.geometry - 水面平面几何。
   * @param {Cesium.Matrix4} options.modelMatrix - 水面局部坐标到世界坐标的矩阵。
   * @param {object} options.uniforms - GUI 可调 shader 参数。
   */
  constructor(options) {
    /** @type {boolean} 控制水面是否参与绘制。 */
    this.show = true;
    /** @type {Cesium.Geometry} 水面网格几何。 */
    this.geometry = options.geometry;
    /** @type {Cesium.Matrix4} 水面模型矩阵。 */
    this.modelMatrix = Cesium.Matrix4.clone(options.modelMatrix);
    /** @type {object} GUI 可调 shader 参数对象。 */
    this.uniforms = options.uniforms;
    /** @type {Cesium.VertexArray|null} Cesium 顶点数组资源。 */
    this._vertexArray = null;
    /** @type {Cesium.ShaderProgram|null} Cesium shader program 资源。 */
    this._shaderProgram = null;
    /** @type {Cesium.RenderState|null} Cesium 渲染状态。 */
    this._renderState = null;
    /** @type {Cesium.DrawCommand|null} Cesium 绘制命令。 */
    this._drawCommand = null;
    /** @type {Cesium.BoundingSphere} 局部包围球。 */
    this._localBoundingSphere = this.geometry.boundingSphere;
    /** @type {Cesium.BoundingSphere} 世界包围球缓存。 */
    this._worldBoundingSphere = new Cesium.BoundingSphere();
    /** @type {Cesium.Cartesian2} 水面真实尺寸，单位米。 */
    this._waterSize = new Cesium.Cartesian2(
      this.uniforms.waterWidth,
      this.uniforms.waterLength,
    );
    /** @type {Cesium.Cartesian3} 水浅颜色缓存。 */
    this._shallowColor = new Cesium.Cartesian3();
    /** @type {Cesium.Cartesian3} 水深颜色缓存。 */
    this._deepColor = new Cesium.Cartesian3();
    /** @type {Cesium.Cartesian3} 泡沫颜色缓存。 */
    this._foamColor = new Cesium.Cartesian3();
    /** @type {Cesium.Cartesian3} 天空顶部颜色缓存。 */
    this._skyTopColor = new Cesium.Cartesian3();
    /** @type {Cesium.Cartesian3} 天空地平线颜色缓存。 */
    this._skyHorizonColor = new Cesium.Cartesian3();
    /** @type {Cesium.Cartesian3} 太阳颜色缓存。 */
    this._sunColor = new Cesium.Cartesian3();
    /** @type {Cesium.Matrix3} 水面局部法线转世界矩阵。 */
    this._normalMatrix = new Cesium.Matrix3();
    /** @type {number} 动画起始时间戳，单位毫秒。 */
    this._startTime = performance.now();
    /** @type {object} DrawCommand 使用的 uniform map。 */
    this._uniformMap = this._createUniformMap();
  }

  /**
   * Cesium 每帧调用的更新入口。
   *
   * @param {Cesium.FrameState} frameState - Cesium 当前帧状态。
   * @returns {void}
   */
  update(frameState) {
    if (!this.show) {
      return;
    }

    if (!this._drawCommand) {
      this._drawCommand = this._createDrawCommand(frameState.context);
    }

    this._waterSize.x = this.uniforms.waterWidth;
    this._waterSize.y = this.uniforms.waterLength;
    Cesium.Matrix4.getMatrix3(this.modelMatrix, this._normalMatrix);
    this._drawCommand.modelMatrix = this.modelMatrix;
    this._drawCommand.boundingVolume = this._getWorldBoundingSphere();
    frameState.commandList.push(this._drawCommand);
  }

  /**
   * 创建 Cesium 绘制命令。
   *
   * @param {Cesium.Context} context - Cesium WebGL 上下文。
   * @returns {Cesium.DrawCommand} 水面绘制命令。
   */
  _createDrawCommand(context) {
    this._vertexArray = Cesium.VertexArray.fromGeometry({
      context,
      geometry: this.geometry,
      attributeLocations: WaterEffectMaterial.attributeLocations,
      bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
    });

    this._shaderProgram = Cesium.ShaderProgram.fromCache({
      context,
      attributeLocations: WaterEffectMaterial.attributeLocations,
      vertexShaderSource: new Cesium.ShaderSource({
        sources: [RIVER_WATER_VERTEX_SHADER],
      }),
      fragmentShaderSource: new Cesium.ShaderSource({
        sources: [RIVER_WATER_FRAGMENT_SHADER],
      }),
    });

    this._renderState = Cesium.RenderState.fromCache({
      depthTest: {
        enabled: true,
      },
      depthMask: false,
      cull: {
        enabled: false,
      },
      blending: Cesium.BlendingState.ALPHA_BLEND,
    });

    return new Cesium.DrawCommand({
      owner: this,
      vertexArray: this._vertexArray,
      primitiveType: this.geometry.primitiveType,
      uniformMap: this._uniformMap,
      modelMatrix: this.modelMatrix,
      shaderProgram: this._shaderProgram,
      renderState: this._renderState,
      pass: Cesium.Pass.TRANSLUCENT,
      boundingVolume: this._getWorldBoundingSphere(),
    });
  }

  /**
   * 创建 shader uniform 读取映射。
   *
   * @returns {object} Cesium uniformMap。
   */
  _createUniformMap() {
    /** @type {WaterEffectMaterial} 当前材质实例。 */
    const primitive = this;

    return {
      u_time() {
        return (performance.now() - primitive._startTime) * 0.001 * primitive.uniforms.timeScale;
      },
      u_waterSize() {
        return primitive._waterSize;
      },
      u_flowSpeed() {
        return primitive.uniforms.flowSpeed;
      },
      u_flowStrength() {
        return primitive.uniforms.flowStrength;
      },
      u_waveScale() {
        return primitive.uniforms.waveScale;
      },
      u_waveStrength() {
        return primitive.uniforms.waveStrength;
      },
      u_foamAmount() {
        return primitive.uniforms.foamAmount;
      },
      u_foamContrast() {
        return primitive.uniforms.foamContrast;
      },
      u_foamCoverage() {
        return primitive.uniforms.foamCoverage;
      },
      u_meanderAmount() {
        return primitive.uniforms.meanderAmount;
      },
      u_meanderFrequency() {
        return primitive.uniforms.meanderFrequency;
      },
      u_riverWidth() {
        return primitive.uniforms.riverWidth;
      },
      u_bankSoftness() {
        return primitive.uniforms.bankSoftness;
      },
      u_reflectivity() {
        return primitive.uniforms.reflectivity;
      },
      u_specularStrength() {
        return primitive.uniforms.specularStrength;
      },
      u_gloss() {
        return primitive.uniforms.gloss;
      },
      u_fresnelPower() {
        return primitive.uniforms.fresnelPower;
      },
      u_refractionStrength() {
        return primitive.uniforms.refractionStrength;
      },
      u_alpha() {
        return primitive.uniforms.alpha;
      },
      u_exposure() {
        return primitive.uniforms.exposure;
      },
      u_shallowColor() {
        return colorToCartesian3(primitive.uniforms.shallowColor, primitive._shallowColor);
      },
      u_deepColor() {
        return colorToCartesian3(primitive.uniforms.deepColor, primitive._deepColor);
      },
      u_foamColor() {
        return colorToCartesian3(primitive.uniforms.foamColor, primitive._foamColor);
      },
      u_skyTopColor() {
        return colorToCartesian3(primitive.uniforms.skyTopColor, primitive._skyTopColor);
      },
      u_skyHorizonColor() {
        return colorToCartesian3(primitive.uniforms.skyHorizonColor, primitive._skyHorizonColor);
      },
      u_sunColor() {
        return colorToCartesian3(primitive.uniforms.sunColor, primitive._sunColor);
      },
      u_sunIntensity() {
        return primitive.uniforms.sunIntensity;
      },
      u_normalMatrix() {
        return primitive._normalMatrix;
      },
    };
  }

  /**
   * 获取当前水面世界包围球。
   *
   * @returns {Cesium.BoundingSphere} 世界坐标包围球。
   */
  _getWorldBoundingSphere() {
    return Cesium.BoundingSphere.transform(
      this._localBoundingSphere,
      this.modelMatrix,
      this._worldBoundingSphere,
    );
  }

  /**
   * 查询 Cesium 资源是否已经销毁。
   *
   * @returns {boolean} 是否已经销毁。
   */
  isDestroyed() {
    return false;
  }

  /**
   * 释放 Cesium GPU 资源。
   *
   * @returns {object} Cesium 销毁后的对象。
   */
  destroy() {
    if (this._vertexArray) {
      this._vertexArray.destroy();
    }

    if (this._shaderProgram) {
      this._shaderProgram.destroy();
    }

    this._vertexArray = null;
    this._shaderProgram = null;
    this._drawCommand = null;
    return Cesium.destroyObject(this);
  }
}

/**
 * 把 CSS 颜色转换为 shader 使用的三维颜色。
 *
 * @param {string} colorText - CSS 颜色字符串。
 * @param {Cesium.Cartesian3} result - 复用输出对象。
 * @returns {Cesium.Cartesian3} 线性 RGB 颜色。
 */
function colorToCartesian3(colorText, result) {
  /** @type {Cesium.Color} Cesium 颜色对象。 */
  const color = Cesium.Color.fromCssColorString(colorText);
  result.x = color.red;
  result.y = color.green;
  result.z = color.blue;
  return result;
}

/**
 * 水面顶点 attribute 绑定位置。
 *
 * @type {{position: number, st: number}}
 */
WaterEffectMaterial.attributeLocations = {
  position: 0,
  st: 1,
};

/**
 * 水面顶点 shader，输出局部坐标、世界坐标和 UV。
 *
 * @type {string}
 */
const RIVER_WATER_VERTEX_SHADER = /* glsl */ `
  in vec3 position;
  in vec2 st;

  uniform mat3 u_normalMatrix;

  out vec2 v_uv;
  out vec2 v_localXY;
  out vec3 v_worldPosition;
  out vec3 v_eastWorld;
  out vec3 v_northWorld;
  out vec3 v_upWorld;

  void main() {
    vec4 worldPosition = czm_model * vec4(position, 1.0);
    v_uv = st;
    v_localXY = position.xy;
    v_worldPosition = worldPosition.xyz;
    v_eastWorld = normalize(u_normalMatrix * vec3(1.0, 0.0, 0.0));
    v_northWorld = normalize(u_normalMatrix * vec3(0.0, 1.0, 0.0));
    v_upWorld = normalize(u_normalMatrix * vec3(0.0, 0.0, 1.0));

    gl_Position = czm_modelViewProjection * vec4(position, 1.0);
    czm_vertexLogDepth();
  }
`;

/**
 * 水面片元 shader，移植 Shadertoy 的流场、FBM 法线、泡沫、菲涅尔和高光。
 *
 * @type {string}
 */
const RIVER_WATER_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_waterSize;
  uniform float u_flowSpeed;
  uniform float u_flowStrength;
  uniform float u_waveScale;
  uniform float u_waveStrength;
  uniform float u_foamAmount;
  uniform float u_foamContrast;
  uniform float u_foamCoverage;
  uniform float u_meanderAmount;
  uniform float u_meanderFrequency;
  uniform float u_riverWidth;
  uniform float u_bankSoftness;
  uniform float u_reflectivity;
  uniform float u_specularStrength;
  uniform float u_gloss;
  uniform float u_fresnelPower;
  uniform float u_refractionStrength;
  uniform float u_alpha;
  uniform float u_exposure;
  uniform vec3 u_shallowColor;
  uniform vec3 u_deepColor;
  uniform vec3 u_foamColor;
  uniform vec3 u_skyTopColor;
  uniform vec3 u_skyHorizonColor;
  uniform vec3 u_sunColor;
  uniform float u_sunIntensity;

  in vec2 v_uv;
  in vec2 v_localXY;
  in vec3 v_worldPosition;
  in vec3 v_eastWorld;
  in vec3 v_northWorld;
  in vec3 v_upWorld;

  const vec2 MOD2 = vec2(4.438975, 3.972973);
  const int WATER_FBM_STEPS = 4;

  float Hash(float p) {
    vec2 p2 = fract(vec2(p) * MOD2);
    p2 += dot(p2.yx, p2.xy + 19.19);
    return fract(p2.x * p2.y);
  }

  vec2 Hash2(float p) {
    vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
  }

  float SmoothNoise(vec2 o) {
    vec2 p = floor(o);
    vec2 f = fract(o);
    float n = p.x + p.y * 57.0;
    float a = Hash(n + 0.0);
    float b = Hash(n + 1.0);
    float c = Hash(n + 57.0);
    float d = Hash(n + 58.0);
    vec2 f2 = f * f;
    vec2 f3 = f2 * f;
    vec2 t = 3.0 * f2 - 2.0 * f3;
    float u = t.x;
    float v = t.y;
    return a + (b - a) * u + (c - a) * v + (a - b + d - c) * u * v;
  }

  vec3 SmoothNoiseDxy(vec2 o) {
    vec2 p = floor(o);
    vec2 f = fract(o);
    float n = p.x + p.y * 57.0;
    float a = Hash(n + 0.0);
    float b = Hash(n + 1.0);
    float c = Hash(n + 57.0);
    float d = Hash(n + 58.0);
    vec2 f2 = f * f;
    vec2 f3 = f2 * f;
    vec2 t = 3.0 * f2 - 2.0 * f3;
    vec2 dt = 6.0 * f - 6.0 * f2;
    float u = t.x;
    float v = t.y;
    float du = dt.x;
    float dv = dt.y;
    float res = a + (b - a) * u + (c - a) * v + (a - b + d - c) * u * v;
    float dx = (b - a) * du + (a - b + d - c) * du * v;
    float dy = (c - a) * dv + (a - b + d - c) * u * dv;
    return vec3(dx, dy, res);
  }

  vec3 FbmDxy(vec2 p, vec2 flow, float persistence, float gradientPush) {
    vec3 f = vec3(0.0);
    float total = 0.0;
    float amplitude = 1.0;
    for (int i = 0; i < WATER_FBM_STEPS; i++) {
      p += flow;
      flow *= -0.75;
      vec3 value = SmoothNoiseDxy(p);
      f += value * amplitude;
      p += value.xy * gradientPush;
      p *= 2.0;
      total += amplitude;
      amplitude *= persistence;
    }
    return f / total;
  }

  float GetRiverMeander(float x) {
    return sin(x * u_meanderFrequency) * u_meanderAmount;
  }

  float GetRiverMeanderDx(float x) {
    return cos(x * u_meanderFrequency) * u_meanderAmount * u_meanderFrequency;
  }

  float GetRiverMask(vec2 pos) {
    float center = GetRiverMeander(pos.x);
    float distToCenter = abs(pos.y - center);
    float halfWidth = max(u_riverWidth * 0.5, 0.001);
    float softWidth = max(u_bankSoftness, 0.001);
    return 1.0 - smoothstep(halfWidth, halfWidth + softWidth, distToCenter);
  }

  float GetRiverDepth(vec2 pos) {
    float center = GetRiverMeander(pos.x);
    float halfWidth = max(u_riverWidth * 0.5, 0.001);
    float normalizedDist = clamp(abs(pos.y - center) / halfWidth, 0.0, 1.0);
    float bed = 1.0 - normalizedDist * normalizedDist;
    float ripple = 0.75 + 0.25 * SmoothNoise(pos * vec2(0.35, 0.8));
    return clamp(bed * ripple, 0.0, 1.0);
  }

  vec2 GetGradient(vec2 pos) {
    vec2 delta = vec2(0.02, 0.0);
    float dx = GetRiverDepth(pos + delta.xy) - GetRiverDepth(pos - delta.xy);
    float dy = GetRiverDepth(pos + delta.yx) - GetRiverDepth(pos - delta.yx);
    return vec2(dx, dy);
  }

  vec3 GetFlowRate(vec2 pos) {
    vec2 baseFlow = vec2(1.0, GetRiverMeanderDx(pos.x));
    float depth = max(GetRiverDepth(pos), 0.001);
    vec2 gradient = GetGradient(pos);
    vec2 flow = baseFlow + gradient * 18.0 / (1.0 + depth * 1.5);
    flow *= u_flowStrength / (1.0 + (1.0 - depth) * 0.8);
    float obstacleFoam = clamp(length(gradient) * 6.0, 0.0, 1.0);
    float speedFoam = clamp(length(flow) * 0.45, 0.0, 1.0);
    float foam = clamp((speedFoam + obstacleFoam) * depth, 0.0, 1.0);
    return vec3(flow * 0.6, foam);
  }

  vec4 SampleWaterNormal(vec2 uv, vec2 flowOffset, float normalMag, float foam) {
    vec2 filterWidth = max(abs(dFdx(uv)), abs(dFdy(uv)));
    float filterScale = 1.0 / (1.0 + max(filterWidth.x, filterWidth.y) * 120.0);
    float gradientPush = 0.25 + foam * -1.5;
    vec3 dxy = FbmDxy(uv * 20.0, flowOffset * 20.0, 0.75 + foam * 0.25, gradientPush);
    filterScale *= max(0.25, 1.0 - foam * 5.0);
    vec3 blended = mix(vec3(0.0, 1.0, 0.0), normalize(vec3(dxy.x, normalMag, dxy.y)), filterScale);
    return vec4(normalize(blended), dxy.z * filterScale);
  }

  float SampleWaterFoam(vec2 uv, vec2 flowOffset) {
    float f = FbmDxy(uv * 30.0, flowOffset * 50.0, 0.8, -0.5).z;
    float amount = max(u_foamCoverage, 0.001);
    f = max(0.0, (f - amount) / amount);
    return pow(0.5, f);
  }

  vec4 SampleFlowingNormal(vec2 uv, vec2 flowRate, float foam, float time, out float foamTex) {
    float normalMag = u_waveStrength / (1.0 + dot(flowRate, flowRate) * 5.0);
    float t0 = fract(time);
    float t1 = fract(time + 0.5);
    float i0 = floor(time);
    float i1 = floor(time + 0.5);
    float o0 = t0 - 0.5;
    float o1 = t1 - 0.5;
    vec2 uv0 = uv + Hash2(i0);
    vec2 uv1 = uv + Hash2(i1);
    vec4 sample0 = SampleWaterNormal(uv0, flowRate * o0, normalMag, foam);
    vec4 sample1 = SampleWaterNormal(uv1, flowRate * o1, normalMag, foam);
    float weight = abs(t0 - 0.5) * 2.0;
    float foam0 = SampleWaterFoam(uv0, flowRate * o0 * 0.25);
    float foam1 = SampleWaterFoam(uv1, flowRate * o1 * 0.25);
    vec4 result = mix(sample0, sample1, weight);
    result.xyz = normalize(result.xyz);
    foamTex = mix(foam0, foam1, weight);
    return result;
  }

  vec3 GetSkyColour(vec3 rayDir, vec3 upDir) {
    float upAmount = clamp(dot(rayDir, upDir) * 0.5 + 0.5, 0.0, 1.0);
    vec3 sky = mix(u_skyHorizonColor, u_skyTopColor, upAmount);
    float sunDot = clamp(dot(normalize(czm_sunDirectionWC), rayDir) * 0.5 + 0.5, 0.0, 1.0);
    sky += u_sunColor * u_sunIntensity * (1.0 - exp2(sunDot * -0.5)) * 0.4;
    return sky;
  }

  vec3 GetFresnel(vec3 viewDir, vec3 normal) {
    float ndotv = max(dot(viewDir, normal), 0.0);
    float fresnel = pow(1.0 - ndotv, max(u_fresnelPower, 0.001));
    return vec3(0.02) + (vec3(1.0) - vec3(0.02)) * fresnel * u_reflectivity;
  }

  vec3 Tonemap(vec3 color) {
    float a = 0.010;
    float b = 0.132;
    float c = 0.010;
    float d = 0.163;
    float e = 0.101;
    return (color * (a * color + b)) / (color * (c * color + d) + e);
  }

  void main() {
    czm_writeLogDepth();

    vec2 localMeters = vec2(v_localXY.y, v_localXY.x);
    vec2 shaderPos = localMeters / max(u_waterSize.y, 1.0) * u_waveScale;
    vec2 riverCoord = shaderPos * 8.0;
    float riverMask = GetRiverMask(riverCoord);
    if (riverMask <= 0.002) {
      discard;
    }

    vec3 flowRateAndFoam = GetFlowRate(riverCoord);
    vec2 flowRate = flowRateAndFoam.xy;
    float flowFoam = clamp((flowRateAndFoam.z - 0.2) * 1.5, 0.0, 1.0);
    flowFoam = flowFoam * flowFoam * 0.5 * u_foamAmount;

    float waterFoamTex = 1.0;
    vec4 normalAndHeight = SampleFlowingNormal(shaderPos, flowRate, flowFoam, u_time * u_flowSpeed, waterFoamTex);
    vec3 tangentNormal = normalize(vec3(normalAndHeight.x, normalAndHeight.z, normalAndHeight.y));
    vec3 eastWorld = normalize(v_northWorld);
    vec3 northWorld = normalize(v_eastWorld);
    vec3 upWorld = normalize(v_upWorld);
    mat3 tangentToWorld = mat3(eastWorld, northWorld, upWorld);
    vec3 waterNormal = normalize(tangentToWorld * tangentNormal);

    vec3 viewDir = normalize(czm_viewerPositionWC - v_worldPosition);
    vec3 reflectDir = normalize(reflect(-viewDir, waterNormal));
    vec3 skyReflect = GetSkyColour(reflectDir, upWorld);
    vec3 shallow = u_shallowColor;
    vec3 deep = u_deepColor;
    float depth = GetRiverDepth(riverCoord);
    float refractNoise = normalAndHeight.w * u_refractionStrength;
    vec3 transmit = mix(deep, shallow, clamp(depth + refractNoise, 0.0, 1.0));

    vec3 sunDir = normalize(czm_sunDirectionWC);
    vec3 halfDir = normalize(viewDir + sunDir);
    float ndotl = clamp(dot(waterNormal, sunDir), 0.0, 1.0);
    float specPower = mix(24.0, 520.0, clamp(u_gloss, 0.0, 1.0));
    float sunSpecular = pow(clamp(dot(waterNormal, halfDir), 0.0, 1.0), specPower) * u_specularStrength;
    float forwardScatter = pow(max(dot(viewDir, -sunDir), 0.0), 4.0);
    transmit += u_sunColor * u_sunIntensity * (ndotl * 0.12 + forwardScatter * 0.18);

    vec3 fresnel = GetFresnel(viewDir, waterNormal);
    vec3 color = mix(transmit, skyReflect, fresnel);
    color += u_sunColor * u_sunIntensity * sunSpecular;

    float foamBlend = 1.0 - pow(waterFoamTex, max(flowFoam * u_foamContrast, 0.001) * 5.0);
    float edgeFoam = smoothstep(0.08, 0.0, riverMask) * 0.45 * u_foamAmount;
    foamBlend = clamp(foamBlend + edgeFoam, 0.0, 1.0);
    color = mix(color, u_foamColor, foamBlend);

    float alpha = clamp(u_alpha * smoothstep(0.0, 0.12, riverMask), 0.0, 1.0);
    vec3 finalColor = Tonemap(color * u_exposure);
    finalColor = finalColor * 1.1 - 0.1;
    out_FragColor = vec4(finalColor, alpha);
  }
`;
