/**
 * @class L.Draw.Circle
 * @aka Draw.Circle
 * @inherits L.Draw.SimpleShape
 */
L.Draw.Circle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'circle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		showRadius: true,
		metric: true, // Whether to use the metric measurement system or imperial
		feet: true, // When not metric, use feet instead of yards for display
		nautic: false,// When not metric, not feet use nautic mile for display
	},

	// @method initialize(): void
	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Circle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.circle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		// Calculate the distance based on the version


		if (L.GeometryUtil.isVersion07x()) {
			var distance = this._startLatLng.distanceTo(latlng);
		} else {
			//console.log(22);
			var distance = this._map.distance(this._startLatLng, latlng);
		}

		/**
		 * cbc_edit
		 */
    if(this._map.coordinateType=="WGS84" && this._map.coordinateUnit=="DEGREE"){
			var x1_cbc=this._startLatLng.lng;
			var y1_cbc=this._startLatLng.lat;
			var x2_cbc=latlng.lng;
			var y2_cbc=latlng.lat;
			//console.log(x1_cbc);
			var xdi=x2_cbc-x1_cbc;
			var ydi=y2_cbc-y1_cbc;
			distance=Math.pow((xdi*xdi+ydi*ydi),0.5);
		}
		//console.log(coordinate_flag+":"+distance);


		if (!this._shape) {
			this._shape = new L.Circle(this._startLatLng, distance, this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setRadius(distance);
		}
	},

	_fireCreatedEvent: function () {
		var circle = new L.Circle(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, circle);
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng,
			showRadius = this.options.showRadius,
			useMetric = this.options.metric,
			radius;



    //console.log("移动坐标");
    //console.log(latlng);

    //var latlngTemp=window.coordtransform.wgs84togcj02(latlng.lat,latlng.lng);
    //var newLatlng=window.coordtransform.bd09togcj02(latlng.lat,latlng.lng);
    //console.log("转换后坐标");
    //console.log(newLatlng);
    //latlng.lat=newLatlng[0];
    //latlng.lng=newLatlng[1];


		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._drawShape(latlng);

			// Get the new radius (rounded to 1 dp)
			radius = this._shape.getRadius().toFixed(1);

			var subtext = '';
			if (showRadius) {
			  if(this._map.coordinateType=="WGS84" && this._map.coordinateUnit=="DEGREE"){
          var meter=(1000*111.11)*this._shape.getRadius();
          subtext = "半径"+ ': ' +L.GeometryUtil.readableDistance(meter, useMetric, this.options.feet, this.options.nautic);;
        }else{
          subtext = L.drawLocal.draw.handlers.circle.radius + ': ' +
            L.GeometryUtil.readableDistance(radius, useMetric, this.options.feet, this.options.nautic);
        }

			}
			this._tooltip.updateContent({
				text: this._endLabelText,
				subtext: subtext
			});
		}
	}
});
