import * as Cesium from "cesium";
/*
      流动纹理线
      color 颜色
      duration 持续时间 毫秒
      trailImage 贴图地址
  */
function PolylineFlow(color, trailImage, duration) {
  this._definitionChanged = new Cesium.Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this.color = color;
  this.duration = duration;
  this.trailImage = trailImage;
  this._time = new Date().getTime();
}

Object.defineProperties(PolylineFlow.prototype, {
  isConstant: {
    //该属性是否会随时间变化,为true时只会获取一次数值
    get: function () {
      return false;
    },
  },
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  color: Cesium.createPropertyDescriptor("color"),
});

var MaterialType = "polylineType" + parseInt(Math.random() * 1000);
PolylineFlow.prototype.getType = function (time) {
  return MaterialType;
};

PolylineFlow.prototype.getValue = function (time, result) {
  if (!Cesium.defined(result)) {
    result = {};
  }
  result.color = Cesium.Property.getValueOrClonedDefault(
    this._color,
    time,
    Cesium.Color.WHITE,
    result.color
  );
  result.image = this.trailImage;
  result.time =
    ((new Date().getTime() - this._time) % this.duration) / this.duration;
  return result;
};

PolylineFlow.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineFlow &&
      Cesium.Property.equals(this._color, other._color) &&
      Cesium.Property.equals(this._image, other._image))
  );
};

Cesium.Material._materialCache.addMaterial(MaterialType, {
  fabric: {
    type: MaterialType,
    uniforms: {
      color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
      image: Cesium.Material.DefaultImageId,
      time: -20,
    },
    source: _getPolylineShader(),
  },
  translucent: function (material) {
    return true;
  },
});
/**
 * 自定义材质
 */
function _getPolylineShader() {
  var materail =
    "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
          {\n\
                czm_material material = czm_getDefaultMaterial(materialInput);\n\
                vec2 st = materialInput.st;\n\
                vec4 colorImage = texture(image, vec2(fract(st.s - time), st.t));\n\
                material.alpha = colorImage.a * color.a;\n\
                material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
                return material;\n\
          }";

  return materail;
}
export default PolylineFlow; //ES
//Cesium.PolylineFlow = PolylineFlow;//CDN
