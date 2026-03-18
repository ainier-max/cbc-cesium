import * as Cesium from 'cesium';

/**
 * @description 渲染工具类
 */
export class RenderUtil {
    static getFullscreenQuad() {
        return new Cesium.Geometry({
            attributes: new Cesium.GeometryAttributes({
                position: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 3,
                    values: new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0])
                }),
                st: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 2,
                    values: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])
                })
            }),
            indices: new Uint32Array([3, 2, 0, 0, 2, 1])
        });
    }

    static createTexture(options) {
        if (Cesium.defined(options.arrayBufferView)) {
            let source = {};
            source.arrayBufferView = options.arrayBufferView;
            options.source = source;
            options.flipY = false;
        }
        return new Cesium.Texture(options);
    }

    static createDepthFramebuffer(context, width, height) {
        return new Cesium.Framebuffer({
            context: context,
            colorTextures: [
                this.createTexture({
                    context: context,
                    width: width,
                    height: height,
                    flipY: false,
                    pixelFormat: Cesium.PixelFormat.RGBA,
                    pixelDatatype: Cesium.PixelDatatype.FLOAT,
                    arrayBufferView: new Float32Array(width * height * 4)
                })
            ],
            depthRenderbuffer: new Cesium.Renderbuffer({
                context: context,
                width: width,
                height: height,
                format: Cesium.RenderbufferFormat.DEPTH_COMPONENT16
            }),
            destroyAttachments: false,
        });
    }

    static createFramebuffer(context, colorTexture, depthTexture) {
        return new Cesium.Framebuffer({
            context: context,
            colorTextures: [colorTexture],
            depthTexture: depthTexture
        });
    }

    static createRawRenderState(options) {
        let translucent = true;
        let closed = false;
        let existing = {
            viewport: options.viewport,
            depthTest: options.depthTest,
            depthMask: options.depthMask,
            blending: options.blending
        };
        return Cesium.Appearance.getDefaultRenderState(translucent, closed, existing);
    }
}
