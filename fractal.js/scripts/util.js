define([], function() {
"use strict";

return {

/*
 * Convert hue-saturation-value/luminosity to RGB.
 * Input ranges:
 *   H =   [0, 360] (integer degrees)
 *   S = [0.0, 1.0] (float)
 *   V = [0.0, 1.0] (float)
 */
hsv_to_rgb: function(h, s, v) {
	if (h==360) h=0;
	if ( v > 1.0 ) v = 1.0;
	var hp = h/60.0;
	var c = v * s;
	var x = c*(1 - Math.abs((hp % 2) - 1));
	var rgb = [0,0,0];

	if ( 0<=hp && hp<1 ) rgb = [c, x, 0];
	if ( 1<=hp && hp<2 ) rgb = [x, c, 0];
	if ( 2<=hp && hp<3 ) rgb = [0, c, x];
	if ( 3<=hp && hp<4 ) rgb = [0, x, c];
	if ( 4<=hp && hp<5 ) rgb = [x, 0, c];
	if ( 5<=hp && hp<6 ) rgb = [c, 0, x];

	var m = v - c;
	rgb[0] += m;
	rgb[1] += m;
	rgb[2] += m;

	rgb[0] *= 255;
	rgb[1] *= 255;
	rgb[2] *= 255;
	return rgb;
},

defaultProps: function(dest, def) {
	var prop;
	if (!dest) {
		dest={};
	}
	for (prop in def) {
		if (!(prop in dest)) {
			dest[prop] = def[prop];
		}
	}
	for (prop in dest) {
		if (!(prop in def)) {
			console.log("WARN : unknown property ", prop);
		}
	}
	return dest;
},

};

});