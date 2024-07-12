import * as Cesium from "cesium";

import { myParticleSystem } from "../../dependentLib/myParticleSystem.js";

export const particleSystem = {
  ffCesiumCloudCollection: null, //大量云朵
  addCloudEffect(option) {
    if (!this.ffCesiumCloudCollection) {
      this.ffCesiumCloudCollection = this.viewer.scene.primitives.add(
        new Cesium.CloudCollection({
          noiseDetail: 16.0,
          noiseOffset: Cesium.Cartesian3.ZERO,
        })
      );
    }

    let cloud = this.ffCesiumCloudCollection.add({
      position: Cesium.Cartesian3.fromDegrees(
        option.lng,
        option.lat,
        option.height
      ),
      scale: new Cesium.Cartesian2(option.scaleX, option.scaleY),
      slice: option.slice,
      color: Cesium.Color.fromCssColorString(option.color),
      maximumSize: new Cesium.Cartesian3(
        option.maximumSizeX,
        option.maximumSizeY,
        option.maximumSizeZ
      ),
    });
    return cloud;
  },

  //叠加雨效果
  addRainEffect(option) {
    const FS_Rain = `uniform sampler2D colorTexture;
			 in vec2 v_textureCoordinates;
       uniform float tiltAngle;
       uniform float rainSize;
       uniform float rainWidth;
       uniform float rainSpeed;
			 float hash(float x){
					return fract(sin(x*233.3)*13.13);
			 }
       out vec4 vFragColor;
			void main(void){
				float time = czm_frameNumber / rainSpeed;
			  vec2 resolution = czm_viewport.zw;
			  vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
			  vec3 c=vec3(1.0,1.0,1.0);
			  float a= tiltAngle;
			  float si=sin(a),co=cos(a);
			  uv*=mat2(co,-si,si,co);
			  uv*=length(uv+vec2(0,4.9))*rainSize + 1.;
			  float v = 1.0 - abs(sin(hash(floor(uv.x * rainWidth)) * 2.0));
			  float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;
			  c*=v*b;
        vFragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c,.3), .3);
			}
    `;
    var rainEffect = new Cesium.PostProcessStage({
      name: "FFCesium.addRainEffect",
      fragmentShader: FS_Rain,
      uniforms: {
        tiltAngle: option.tiltAngle, //雨长度
        rainSize: option.rainSize, //雨长度
        rainWidth: option.rainWidth, //雨长度
        rainSpeed: option.rainSpeed, //雨长度
      },
    });
    this.viewer.scene.postProcessStages.add(rainEffect);
    return rainEffect;
  },
  //移除雨效果
  removeRainEffect(rainEffect) {
    this.viewer.scene.postProcessStages.remove(rainEffect);
  },

  //叠加雪效果
  addSnowEffect(option) {
    const FS_Snow = `uniform sampler2D colorTexture;
    in vec2 v_textureCoordinates;
    uniform float snowSpeed;
    float snow(vec2 uv,float scale){
        float time = czm_frameNumber / snowSpeed;
        float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;
        uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;
        uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;
        p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);
        k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
        return k*w;
    }
    out vec4 vFragColor;
    void main(void){
        vec2 resolution = czm_viewport.zw;
        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
        vec3 finalColor=vec3(0);
        float c = 0.0;
        c+=snow(uv,50.)*.0;
        c+=snow(uv,30.)*.0;
        c+=snow(uv,10.)*.0;
        c+=snow(uv,5.);
        c+=snow(uv,4.);
        c+=snow(uv,3.);
        c+=snow(uv,2.);
        finalColor=(vec3(c));
        vFragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.3);
    }
    `;
    var snowEffect = new Cesium.PostProcessStage({
      name: "FFCesium.addSnowEffect",
      fragmentShader: FS_Snow,
      uniforms: {
        snowSpeed: option.snowSpeed, //雪速
      },
    });
    this.viewer.scene.postProcessStages.add(snowEffect);
    return snowEffect;
  },

  //移除雪效果
  removeSnowEffect(snowEffect) {
    this.viewer.scene.postProcessStages.remove(snowEffect);
  },

  //叠加雾效果
  addFogEffect(option) {
    const FS_Fog = `float getDistance(sampler2D depthTexture, vec2 texCoords)
    {
        float depth = czm_unpackDepth(texture(depthTexture, texCoords));
        if (depth == 0.0) {
            return czm_infinity;
        }
        vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
        return -eyeCoordinate.z / eyeCoordinate.w;
    }
    //根据距离，在中间进行插值
    float interpolateByDistance(vec4 nearFarScalar, float distance)
    {
        //根据常识，雾应该是距离远，越看不清，近距离内的物体可以看清
        //因此近距离alpha=0，远距离的alpha=1.0
        //本例中设置可见度为200米
        //雾特效的起始距离
        float startDistance = nearFarScalar.x;
        //雾特效的起始alpha值
        float startValue = nearFarScalar.y;
        //雾特效的结束距离
        float endDistance = nearFarScalar.z;
        //雾特效的结束alpha值
        float endValue = nearFarScalar.w;
        //根据每段距离占总长度的占比，插值alpha，距离越远，alpha值越大。插值范围0,1。
        float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
        return mix(startValue, endValue, t);
    }
    vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
    {
        return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
    }
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    uniform vec4 fogByDistance;
    uniform vec4 fogColor;
    in vec2 v_textureCoordinates;
    void main(void)
    {
        //获取地物距相机的距离
        float distance = getDistance(depthTexture, v_textureCoordinates);
        //获取场景原本的纹理颜色
        vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
        //根据距离，对alpha进行插值
        float blendAmount = interpolateByDistance(fogByDistance, distance);
        //将alpha变化值代入雾的原始颜色中，并将雾与场景原始纹理进行融合
        vec4 finalFogColor = vec4(fogColor.rgb, fogColor.a * blendAmount);
        out_FragColor = alphaBlend(finalFogColor, sceneColor);
    }`;
    var fogEffect = new Cesium.PostProcessStage({
      name: "FFCesium.addFogEffect",
      fragmentShader: FS_Fog,
      uniforms: {
        fogByDistance: new Cesium.Cartesian4(500, 0.0, 4000, option.alpha), //alpha 浓度
        fogColor: Cesium.Color.WHITE,
      },
    });
    this.viewer.scene.postProcessStages.add(fogEffect);
    return fogEffect;
  },
  //移除雾效果
  removeFogEffect(fogEffect) {
    this.viewer.scene.postProcessStages.remove(fogEffect);
  },
  //叠加火焰效果
  addFireEffect(lnglatheight, option) {
    let particlefire = myParticleSystem.init(lnglatheight, option);
    this.viewer.scene.primitives.add(particlefire);
    return particlefire;
  },
  //移除火焰效果
  removeFireEffect(primitive) {
    console.log("removeFireEffect--primitive", primitive);
    this.viewer.scene.primitives.remove(primitive);
  },
};
