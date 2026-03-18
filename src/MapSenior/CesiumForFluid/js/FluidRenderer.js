import * as Cesium from 'cesium';
import { RenderUtil } from './RenderUtil.js';
import { CustomPrimitive } from './CustomPrimitive.js';
import { Command, BufferA, BufferB, BufferC, BufferD, renderShaderSource } from './shaders.js';

/**
 * 生成模型矩阵
 */
export const generateModelMatrix = (position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) => {
    const rotationX = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(rotation[0])));
    const rotationY = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(rotation[1])));
    const rotationZ = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(rotation[2])));
    if (!(position instanceof Cesium.Cartesian3)) {
        position = Cesium.Cartesian3.fromDegrees(...position);
    }
    const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    Cesium.Matrix4.multiply(enuMatrix, rotationX, enuMatrix);
    Cesium.Matrix4.multiply(enuMatrix, rotationY, enuMatrix);
    Cesium.Matrix4.multiply(enuMatrix, rotationZ, enuMatrix);
    const scaleMatrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(...scale));
    return Cesium.Matrix4.multiply(enuMatrix, scaleMatrix, new Cesium.Matrix4());
};

/**
 * @description 流体体渲染
 */
export class FluidRenderer {
    static DEFAULTS = {
        width: 1024,
        height: 1024,
        dimensions: new Cesium.Cartesian3(2500, 2500, 2500),
        heightRange: [0, 2000],
        fluidParams: new Cesium.Cartesian4(0.995, 0.25, 0.0001, 0.1),
        customParams: new Cesium.Cartesian4(10, 20, 0.2, 10),
        lonLat: [120.20998865783179, 30.13650797533829],
        timeStep: 0.3,
        waterSize: 0.005
    };

    constructor(viewer, options = {}) {
        if (!viewer) throw new Error('Cesium Viewer is required');
        this.viewer = viewer;
        this._initConfiguration(options);
        this._initState();
        this._createResources();
        this._setupRenderPipeline();
    }

    _initConfiguration(options) {
        this.config = {
            resolution: new Cesium.Cartesian2(
                options.width || FluidRenderer.DEFAULTS.width,
                options.height || FluidRenderer.DEFAULTS.height
            ),
            dimensions: options.dimensions || FluidRenderer.DEFAULTS.dimensions.clone(),
            heightRange: {
                min: options.minHeight || FluidRenderer.DEFAULTS.heightRange[0],
                max: options.maxHeight || FluidRenderer.DEFAULTS.heightRange[1]
            },
            fluidParams: options.fluidParams || FluidRenderer.DEFAULTS.fluidParams.clone(),
            customParams: options.customParams || FluidRenderer.DEFAULTS.customParams.clone(),
            lonLat: options.lonLat || [...FluidRenderer.DEFAULTS.lonLat],
            timeStep: options.timeStep || FluidRenderer.DEFAULTS.timeStep,
            waterSize: options.waterSize || FluidRenderer.DEFAULTS.waterSize
        };
        this._calculateUnitSystem();
    }

    _calculateUnitSystem() {
        const { x: areaWidth, y: areaHeight, z: areaDepth } = this.config.dimensions;
        const { x: texWidth, y: texHeight } = this.config.resolution;
        const pixelWidth = areaWidth / texWidth;
        const pixelHeight = areaHeight / texHeight;
        const pixelArea = pixelWidth * pixelHeight;
        const heightScale = areaDepth;
        const oneCubicMeterDepth = 1.0 / pixelArea;
        const oneCubicMeterNormalized = oneCubicMeterDepth / heightScale;
        this.unitSystem = {
            areaWidth, areaHeight, areaDepth,
            totalArea: areaWidth * areaHeight,
            texWidth, texHeight,
            totalPixels: texWidth * texHeight,
            pixelWidth, pixelHeight, pixelArea,
            heightScale,
            heightToNormalized: 1.0 / heightScale,
            oneCubicMeterDepth,
            oneCubicMeterNormalized,
            getClickVolumeToNormalized: (radiusNormalized) => {
                const radiusPixels = radiusNormalized * texWidth;
                const affectedPixels = Math.PI * radiusPixels * radiusPixels;
                return oneCubicMeterNormalized / affectedPixels;
            }
        };
    }

    _initState() {
        this._frameCount = 0;
        this._isActive = true;
        this._time = 0;
        this._waterSourcePos = new Cesium.Cartesian2(-1, -1);
        this._waterSourceRadius = 0.02;
        this._waterDepthColorIntensity = 1.0;
        this._boundaryDrawing = false;
        this._boundaryPoints = [];
        this._allowFlowOut = false;
        this._continuousFlow = true;
        this._flowRate = 10000000;
        this._waterSourceStrength = 10000000;
        this._continuousSourcePos = new Cesium.Cartesian2(-1, -1);
        this._continuousFlowStartTime = 0;
        this._totalVolume = 0;
        this._lastTime = 0;
        this._waterDepthCache = new Map();
        this._lastWaterAddTime = 0;
        this._deltaTime = 0.016;
    }

    _createResources() {
        this._createTextures();
        this._setupHeightMap();
        this._createDebugVisualization();
    }

    _createTextures() {
        const createFloatTexture = () => RenderUtil.createTexture({
            context: this.viewer.scene.context,
            width: this.config.resolution.x,
            height: this.config.resolution.y,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            arrayBufferView: new Float32Array(this.config.resolution.x * this.config.resolution.y * 4)
        });

        this.textures = { A: createFloatTexture(), B: createFloatTexture(), C: createFloatTexture(), D: createFloatTexture() };

        const maskData = new Float32Array(this.config.resolution.x * this.config.resolution.y * 4);
        for (let i = 0; i < maskData.length; i += 4) {
            maskData[i] = maskData[i + 1] = maskData[i + 2] = maskData[i + 3] = 1.0;
        }
        this._boundaryMask = RenderUtil.createTexture({
            context: this.viewer.scene.context,
            width: this.config.resolution.x,
            height: this.config.resolution.y,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            arrayBufferView: maskData
        });
    }

    _setupHeightMap() {
        this.heightMapCamera = this._createOrthographicCamera();
        this._heightMap = this._generateHeightMapTexture();
    }

    _generateHeightMapTexture() {
        const context = this.viewer.scene.context;
        const fbo = RenderUtil.createDepthFramebuffer(context, this.config.resolution.x, this.config.resolution.y);
        const passState = this.viewer.scene._view.passState;
        const originalCamera = this.viewer.scene.camera;
        const originalFramebuffer = context._currentFramebuffer;
        const originalViewport = passState.viewport;
        passState.viewport.x = 0;
        passState.viewport.y = 0;
        passState.viewport.width = this.config.resolution.x;
        passState.viewport.height = this.config.resolution.y;
        passState.framebuffer = fbo;
        this.viewer.scene.camera = this.heightMapCamera;
        this._processHeightMapShaders();
        this._renderDepthPrepass(passState);
        const heightMap = RenderUtil.createTexture({
            context: context,
            width: this.config.resolution.x,
            height: this.config.resolution.y,
            flipY: false,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.FLOAT
        });
        const copyFBO = RenderUtil.createFramebuffer(context, heightMap);
        this._copyTexture(fbo.getColorTexture(0), copyFBO);
        passState.framebuffer = originalFramebuffer;
        passState.viewport = originalViewport;
        this.viewer.scene.camera = originalCamera;
        return heightMap;
    }

    _renderDepthPrepass(passState) {
        const frameState = this.viewer.scene.frameState;
        frameState.camera = this.heightMapCamera;
        this.viewer.scene.frameState.context.uniformState.updateCamera(this.heightMapCamera);
        const commands = this._getDepthRenderCommands();
        commands.forEach(cmd => cmd.execute(this.viewer.scene.context, passState));
    }

    _createDebugVisualization() {
        this.debugEntity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(...this.config.lonLat, this.config.dimensions.z / 2),
            box: {
                dimensions: this.config.dimensions,
                fill: false,
                outline: true,
                outlineColor: Cesium.Color.WHITE
            }
        });
    }

    _setupRenderPipeline() {
        this._createComputePasses();
        this._createMainRenderPass();
        this._startRenderLoop();
    }

    _createComputePasses() {
        const commonUniforms = {
            iTime: () => this._time,
            iFrame: () => this._frameCount,
            resolution: () => this.config.resolution,
            waterSize: () => this.config.waterSize,
            fluidParam: () => this.config.fluidParams,
            customParam: () => this.config.customParams,
            minHeight: () => this.config.heightRange.min,
            maxHeight: () => this.config.heightRange.max,
            heightMap: () => this._heightMap,
            waterSourcePos: () => this._waterSourcePos,
            waterSourceRadius: () => this._waterSourceRadius,
            waterSourceStrength: () => this._waterSourceStrength,
            boundaryMask: () => this._boundaryMask,
            allowFlowOut: () => this._allowFlowOut ? 1.0 : 0.0,
            continuousFlow: () => this._continuousFlow ? 1.0 : 0.0,
            continuousSourcePos: () => this._continuousSourcePos,
            flowRate: () => this._flowRate,
            deltaTime: () => this._deltaTime,
            flowToNormalized: () => {
                const radiusInPixels = this._waterSourceRadius * this.config.resolution.x;
                const falloffIntegral = Math.PI * radiusInPixels * radiusInPixels / 6.0;
                return this.unitSystem.oneCubicMeterNormalized / falloffIntegral;
            },
            clickVolumeToNormalized: () => this.unitSystem.getClickVolumeToNormalized(this._waterSourceRadius),
        };

        this.computePasses = [
            this._createComputePass('A', { uniforms: { ...commonUniforms, iChannel0: () => this.textures.C, iChannel1: () => this.textures.D }, shaderSource: BufferA }),
            this._createComputePass('B', { uniforms: { ...commonUniforms, iChannel0: () => this.textures.A, iChannel1: () => this.textures.D }, shaderSource: BufferB }),
            this._createComputePass('C', { uniforms: { ...commonUniforms, iChannel0: () => this.textures.A, iChannel1: () => this.textures.B }, shaderSource: BufferC }),
            this._createComputePass('D', { uniforms: { ...commonUniforms, iChannel0: () => this.textures.C, iChannel1: () => this.textures.B }, shaderSource: BufferD })
        ];
    }

    _createComputePass(outputTextureName, { uniforms, shaderSource }) {
        return new CustomPrimitive({
            commandType: 'Compute',
            uniformMap: uniforms,
            fragmentShaderSource: new Cesium.ShaderSource({ sources: [Command, shaderSource] }),
            geometry: RenderUtil.getFullscreenQuad(),
            outputTexture: this.textures[outputTextureName],
            preExecute: (cmd) => cmd.commandToExecute.outputTexture = this.textures[outputTextureName]
        });
    }

    _createMainRenderPass() {
        const modelMatrix = generateModelMatrix(
            [...this.config.lonLat, this.config.dimensions.z / 2],
            [90, 0, 0],
            [this.config.dimensions.x, this.config.dimensions.z, this.config.dimensions.y]
        );
        this.mainRenderPass = new CustomPrimitive({
            commandType: 'Draw',
            uniformMap: this._getMainRenderUniforms(),
            vertexShaderSource: this._getVertexShader(),
            fragmentShaderSource: new Cesium.ShaderSource({ sources: [Command, renderShaderSource] }),
            geometry: this._createBoxGeometry(),
            modelMatrix: modelMatrix,
            attributeLocations: this._getAttributeLocations(),
            rawRenderState: this._createRenderState()
        });
    }

    _getMainRenderUniforms() {
        return {
            iTime: () => this._time,
            iFrame: () => this._frameCount,
            iResolution: () => this.config.resolution,
            iChannel0: () => this.textures.C,
            heightMap: () => this._heightMap,
            customParam: () => this.config.customParams,
            colorTexture: () => this.viewer.scene.view.globeDepth.colorFramebufferManager._colorTextures[0],
            waterDepthColorIntensity: () => this._waterDepthColorIntensity
        };
    }

    _startRenderLoop() {
        this._lastTime = performance.now() / 1000;
        this.postRenderHandler = this.viewer.scene.postRender.addEventListener(() => {
            if (!this._isActive) return;
            const currentTime = performance.now() / 1000;
            const deltaTime = currentTime - this._lastTime;
            this._lastTime = currentTime;
            this._deltaTime = Math.min(Math.max(deltaTime, 0.001), 0.1);
            this._time = currentTime;
            this._frameCount += this.config.timeStep;
            if (Math.floor(currentTime) !== Math.floor(currentTime - deltaTime)) {
                this._updateTotalVolume();
            }
        });
        this.computePasses.forEach(p => this.viewer.scene.primitives.add(p));
        this.viewer.scene.primitives.add(this.mainRenderPass);
    }

    _createOrthographicCamera() {
        const camera = new Cesium.Camera(this.viewer.scene);
        camera.frustum = new Cesium.OrthographicOffCenterFrustum();
        const [lon, lat] = this.config.lonLat;
        const center = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const frustum = camera.frustum;
        frustum.near = 0.01;
        frustum.far = this.config.dimensions.z * 2;
        frustum.left = -this.config.dimensions.x / 2;
        frustum.right = this.config.dimensions.x / 2;
        frustum.bottom = -this.config.dimensions.y / 2;
        frustum.top = this.config.dimensions.y / 2;
        const dir = Cesium.Matrix4.getColumn(enuMatrix, 2, new Cesium.Cartesian3());
        Cesium.Cartesian3.negate(dir, dir);
        const up = Cesium.Matrix4.getColumn(enuMatrix, 1, new Cesium.Cartesian3());
        const right = Cesium.Matrix4.getColumn(enuMatrix, 0, new Cesium.Cartesian3());
        const offset = Cesium.Cartesian3.multiplyByScalar(dir, -frustum.far, new Cesium.Cartesian3());
        camera.position = Cesium.Cartesian3.add(center, offset, new Cesium.Cartesian3());
        camera.direction = dir;
        camera.up = up;
        camera.right = right;
        return camera;
    }

    addWaterSource(screenPosition) {
        const cartesian = this.viewer.scene.pickPosition(screenPosition);
        if (!Cesium.defined(cartesian)) return;
        const center = Cesium.Cartesian3.fromDegrees(...this.config.lonLat, 0);
        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const inverseEnu = Cesium.Matrix4.inverse(enuMatrix, new Cesium.Matrix4());
        const localPos = Cesium.Matrix4.multiplyByPoint(inverseEnu, cartesian, new Cesium.Cartesian3());
        const normalizedU = (localPos.x / this.config.dimensions.x) + 0.5;
        const normalizedV = 1.0 - ((localPos.y / this.config.dimensions.y) + 0.5);
        if (normalizedU >= 0 && normalizedU <= 1 && normalizedV >= 0 && normalizedV <= 1) {
            this._waterSourcePos = new Cesium.Cartesian2(normalizedU, normalizedV);
            this.addWaterSourceVolume();
            this._updateWaterDepthCache(normalizedU, normalizedV);
            setTimeout(() => { this._waterSourcePos = new Cesium.Cartesian2(-1, -1); }, 100);
            if (this._debugMarker) this.viewer.entities.remove(this._debugMarker);
            this._debugMarker = this.viewer.entities.add({
                position: cartesian,
                point: { pixelSize: 10, color: Cesium.Color.RED, outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
                label: {
                    text: `UV: ${normalizedU.toFixed(2)}, ${normalizedV.toFixed(2)}`,
                    font: '14px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -20)
                }
            });
        }
    }

    _updateTotalVolume() {
        if (this._continuousFlow && this._continuousSourcePos.x >= 0) {
            this._totalVolume += this._flowRate;
        }
        if (this._allowFlowOut) this._totalVolume *= 0.99;
        this._totalVolume = Math.max(0, this._totalVolume);
        return this._totalVolume;
    }

    addWaterSourceVolume() {
        this._totalVolume += this._waterSourceStrength;
    }

    getWaterDepthAtUV(u, v) {
        if (!this.unitSystem) return 0;
        let totalDepth = 0;
        const currentTime = performance.now() / 1000;
        if (this._continuousFlow && this._continuousSourcePos.x >= 0 && this._continuousSourcePos.x <= 1) {
            const dx = u - this._continuousSourcePos.x;
            const dy = v - this._continuousSourcePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const effectiveRadius = this._waterSourceRadius * 3;
            if (dist < effectiveRadius) {
                const falloff = Math.max(0, 1 - dist / effectiveRadius);
                const accumulatedTime = Math.min(currentTime - (this._continuousFlowStartTime || currentTime), 30);
                totalDepth += (this._flowRate * accumulatedTime * falloff * falloff) / this.unitSystem.pixelArea;
            }
        }
        if (this._lastWaterAddTime > 0 && (currentTime - this._lastWaterAddTime) < 10) {
            const cacheKey = `${Math.floor(u * 100)},${Math.floor(v * 100)}`;
            if (this._waterDepthCache.has(cacheKey)) totalDepth += this._waterDepthCache.get(cacheKey);
        }
        return totalDepth;
    }

    _updateWaterDepthCache(centerU, centerV) {
        const radius = this._waterSourceRadius * 5;
        const steps = 20;
        const totalVolume = this._waterSourceStrength;
        const affectedPixels = Math.PI * Math.pow(this._waterSourceRadius * this.config.resolution.x, 2);
        const avgDepthPerPixel = totalVolume / (affectedPixels * this.unitSystem.pixelArea);
        for (let i = -steps; i <= steps; i++) {
            for (let j = -steps; j <= steps; j++) {
                const u = centerU + (i / steps) * radius;
                const v = centerV + (j / steps) * radius;
                if (u < 0 || u > 1 || v < 0 || v > 1) continue;
                const dist = Math.sqrt(Math.pow(i / steps, 2) + Math.pow(j / steps, 2));
                if (dist <= 1) {
                    const falloff = Math.max(0, 1 - dist);
                    const depth = avgDepthPerPixel * Math.pow(falloff, 1.5);
                    const cacheKey = `${Math.floor(u * 100)},${Math.floor(v * 100)}`;
                    this._waterDepthCache.set(cacheKey, Math.max(this._waterDepthCache.get(cacheKey) || 0, depth));
                }
            }
        }
        this._lastWaterAddTime = performance.now() / 1000;
    }

    getWaterDepthAtScreen(screenPosition) {
        const cartesian = this.viewer.scene.pickPosition(screenPosition);
        if (!Cesium.defined(cartesian)) return null;
        const center = Cesium.Cartesian3.fromDegrees(...this.config.lonLat, 0);
        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const inverseEnu = Cesium.Matrix4.inverse(enuMatrix, new Cesium.Matrix4());
        const localPos = Cesium.Matrix4.multiplyByPoint(inverseEnu, cartesian, new Cesium.Cartesian3());
        const normalizedU = (localPos.x / this.config.dimensions.x) + 0.5;
        const normalizedV = 1.0 - ((localPos.y / this.config.dimensions.y) + 0.5);
        if (normalizedU >= 0 && normalizedU <= 1 && normalizedV >= 0 && normalizedV <= 1) {
            return this.getWaterDepthAtUV(normalizedU, normalizedV);
        }
        return null;
    }

    startBoundaryDrawing() {
        this._boundaryDrawing = true;
        this._boundaryPoints = [];
    }

    stopBoundaryDrawing() {
        this._boundaryDrawing = false;
        if (this._boundaryPoints.length > 2) this._updateBoundaryMask();
    }

    addBoundaryPoint(screenPosition) {
        const cartesian = this.viewer.scene.pickPosition(screenPosition);
        if (!Cesium.defined(cartesian)) return;
        const center = Cesium.Cartesian3.fromDegrees(...this.config.lonLat, 0);
        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const inverseEnu = Cesium.Matrix4.inverse(enuMatrix, new Cesium.Matrix4());
        const localPos = Cesium.Matrix4.multiplyByPoint(inverseEnu, cartesian, new Cesium.Cartesian3());
        const normalizedU = (localPos.x / this.config.dimensions.x) + 0.5;
        const normalizedV = 1.0 - ((localPos.y / this.config.dimensions.y) + 0.5);
        if (normalizedU >= 0 && normalizedU <= 1 && normalizedV >= 0 && normalizedV <= 1) {
            this._boundaryPoints.push({ u: normalizedU, v: normalizedV });
            this.viewer.entities.add({
                position: cartesian,
                point: { pixelSize: 8, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 2 }
            });
        }
    }

    _updateBoundaryMask() {
        const width = this.config.resolution.x;
        const height = this.config.resolution.y;
        const maskData = new Float32Array(width * height * 4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const u = x / width;
                const v = y / height;
                const inside = this._isPointInPolygon(u, v, this._boundaryPoints);
                const idx = (y * width + x) * 4;
                const value = inside ? 1.0 : 0.0;
                maskData[idx] = maskData[idx + 1] = maskData[idx + 2] = value;
                maskData[idx + 3] = 1.0;
            }
        }
        this._boundaryMask.destroy();
        this._boundaryMask = RenderUtil.createTexture({
            context: this.viewer.scene.context,
            width, height,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            arrayBufferView: maskData
        });
    }

    _isPointInPolygon(u, v, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].u, yi = polygon[i].v;
            const xj = polygon[j].u, yj = polygon[j].v;
            const intersect = ((yi > v) !== (yj > v)) && (u < (xj - xi) * (v - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    clearBoundary() {
        const width = this.config.resolution.x;
        const height = this.config.resolution.y;
        const maskData = new Float32Array(width * height * 4);
        for (let i = 0; i < maskData.length; i += 4) {
            maskData[i] = maskData[i + 1] = maskData[i + 2] = maskData[i + 3] = 1.0;
        }
        this._boundaryMask.destroy();
        this._boundaryMask = RenderUtil.createTexture({
            context: this.viewer.scene.context,
            width, height,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            arrayBufferView: maskData
        });
        this._boundaryPoints = [];
    }

    updateBoundaryDimensions(newWidth, newHeight) {
        this.config.dimensions.x = newWidth;
        this.config.dimensions.y = newHeight;
        if (this.debugEntity) {
            this.viewer.entities.remove(this.debugEntity);
            this.debugEntity = this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(...this.config.lonLat, this.config.dimensions.z / 2),
                box: { dimensions: this.config.dimensions, fill: false, outline: true, outlineColor: Cesium.Color.WHITE }
            });
        }
        if (this.heightMapCamera) {
            const frustum = this.heightMapCamera.frustum;
            frustum.left = -newWidth / 2;
            frustum.right = newWidth / 2;
            frustum.bottom = -newHeight / 2;
            frustum.top = newHeight / 2;
        }
    }

    destroy() {
        this._isActive = false;
        this.viewer.scene.postRender.removeEventListener(this.postRenderHandler);
        [this.mainRenderPass, ...this.computePasses].forEach(p => this.viewer.scene.primitives.remove(p));
        this.viewer.entities.remove(this.debugEntity);
        Object.values(this.textures).forEach(tex => tex.destroy());
        this._heightMap.destroy();
        this._boundaryMask.destroy();
    }

    _copyTexture(sourceTexture, targetFBO) {
        const context = this.viewer.scene.context;
        const passState = this.viewer.scene.view.passState;
        const drawCommand = context.createViewportQuadCommand(
            `uniform sampler2D u_texToCopy;
            in vec2 v_textureCoordinates;
            void main() {
                out_FragColor = texture(u_texToCopy, vec2(v_textureCoordinates.x, 1.0 - v_textureCoordinates.y));
            }`,
            { uniformMap: { u_texToCopy: () => sourceTexture }, owner: this }
        );
        const originalFramebuffer = passState.framebuffer;
        passState.framebuffer = targetFBO;
        drawCommand.execute(context, passState);
        passState.framebuffer = originalFramebuffer;
    }

    _getDepthRenderCommands() {
        const commands = [];
        const frustumCommandsList = this.viewer.scene._view.frustumCommandsList;
        for (let i = 0; i < frustumCommandsList.length; ++i) {
            const frustumCommands = frustumCommandsList[i];
            const length = frustumCommands.indices[2];
            if (length > 0) commands.push(...frustumCommands.commands[2].slice(0, length));
        }
        return commands;
    }

    _processHeightMapShaders() {
        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(...this.config.lonLat, 0)
        );
        const localMat4 = Cesium.Matrix4.inverse(enuMatrix, new Cesium.Matrix4());
        this._inverseEnuMatrix = Cesium.Matrix4.multiply(
            localMat4,
            this.viewer.scene.frameState.context.uniformState.model,
            new Cesium.Matrix4()
        );
        const frameState = this.viewer.scene.frameState;
        const commands = this._getDepthRenderCommands();
        commands.forEach(command => {
            command.uniformMap.u_inverseEnuMatrix = () => this._inverseEnuMatrix;
            if (!command.heightMap_ShaderProgram) {
                command.heightMap_ShaderProgram = this._getDerivedShaderProgram(
                    frameState.context, command.shaderProgram, 'Height_Map'
                );
            }
            command.shaderProgram = command.heightMap_ShaderProgram;
        });
    }

    _getDerivedShaderProgram(context, baseShaderProgram, passName) {
        let derivedProgram = context.shaderCache.getDerivedShaderProgram(baseShaderProgram, passName);
        if (!Cesium.defined(derivedProgram)) {
            derivedProgram = this._createHeightMapShaderProgram(context, baseShaderProgram, passName);
        }
        return derivedProgram;
    }

    _createHeightMapShaderProgram(context, baseShaderProgram, passName) {
        const newFS = this._modifyFragmentShader(baseShaderProgram.fragmentShaderSource);
        return context.shaderCache.createDerivedShaderProgram(baseShaderProgram, passName, {
            vertexShaderSource: baseShaderProgram.vertexShaderSource,
            fragmentShaderSource: newFS,
            attributeLocations: baseShaderProgram._attributeLocations
        });
    }

    _modifyFragmentShader(originalFS) {
        const modifiedSources = originalFS.sources.map(source =>
            Cesium.ShaderSource.replaceMain(source, 'czm_heightMap_main')
        );
        modifiedSources.push(`
            uniform mat4 u_inverseEnuMatrix;
            void main() {
                czm_heightMap_main();
                vec3 posMC = (u_inverseEnuMatrix * vec4(v_positionMC, 1.0)).xyz;
                out_FragColor = vec4(posMC.z, out_FragColor.gb, 1.0);
            }
        `);
        return new Cesium.ShaderSource({ sources: modifiedSources, defines: originalFS.defines });
    }

    _createBoxGeometry() {
        return Cesium.BoxGeometry.createGeometry(
            Cesium.BoxGeometry.fromDimensions({
                vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
                dimensions: new Cesium.Cartesian3(1, 1, 1)
            })
        );
    }

    _getAttributeLocations() {
        return Cesium.GeometryPipeline.createAttributeLocations(this._createBoxGeometry());
    }

    _createRenderState() {
        return Cesium.RenderState.fromCache({
            cull: { enabled: false, face: Cesium.CullFace.BACK },
            depthRange: { near: 0, far: 1 },
            depthTest: { enabled: true },
            depthMask: true,
            colorMask: { red: true, green: true, blue: true, alpha: true }
        });
    }

    _getVertexShader() {
        return new Cesium.ShaderSource({
            sources: [`
                in vec3 position;
                in vec2 st;
                out vec3 vo;
                out vec3 vd;
                out vec2 v_st;
                void main() {    
                    vo = czm_encodedCameraPositionMCHigh + czm_encodedCameraPositionMCLow;
                    vd = position - vo;
                    v_st = st;
                    gl_Position = czm_modelViewProjection * vec4(position,1.0);
                }`
            ]
        });
    }
}
