define(["util"], function(util) {
"use strict";

/*
 * The palette:
 * - is a looping gradient in the range [0,1[
 * - the gradient is mapped to fractal iterations using a resolution and an offset
 * - there must be at least one stop, a stop is an index and an RGB color
 */
return function(params) {

//-------- private members

var stops = params.stops;
var resolution = params.resolution;
var buffer = new Int32Array(resolution);

//-------- private methds

var copyStop = function(stop) {
	return {
		index:stop.index, 
		h:stop.h,
		s:stop.s,
		v:stop.v
	};
};

var buildBuffer = function() {
	var i;
	var byteBuffer = new Uint8Array(buffer.buffer); // create an 8-bit view on the buffer
	
	var fstops = [];
	var copy = copyStop(stops[stops.length-1]);
	copy.index-=1.0;
	fstops.push(copy);
	for (i in stops) 
		fstops.push(stops[i]);
	copy = copyStop(stops[0]);
	copy.index+=1.0;
	fstops.push(copy);
	//console.log(fstops);
	
	var stopAindex = 0;
	var stopBindex = 1;
	var stopA = fstops[stopAindex];
	var stopB = fstops[stopBindex];
	var stopRange = stopB.index-stopA.index;
	//console.log("stops", stopAindex, stopBindex);
	//console.log("stoprange", stopRange);
	
	var bufferIndex = 0;
	for (i=0; i<resolution; i++) {
		var x01 = i/resolution;
		//console.log("-----------", i, x01);
		if (x01>=stopB.index) { 
			//console.log("swap")
			stopAindex++;
			stopBindex++;
			stopA = fstops[stopAindex];
			stopB = fstops[stopBindex];
			stopRange = stopB.index-stopA.index;
			//console.log("stopindeices", stopAindex, stopBindex);
			//console.log("stoprange", stopRange);
		}
		
		var stopdelta = (x01-stopA.index) / stopRange;
		//console.log("delta", stopdelta);

		var r = stopA.r + (stopB.r - stopA.r)*stopdelta;
		var g = stopA.g + (stopB.g - stopA.g)*stopdelta;
		var b = stopA.b + (stopB.b - stopA.b)*stopdelta;
		//var rgb = util.hsv_to_rgb(h, s, v);
		//console.log("rgb",r,g,b);
		byteBuffer[bufferIndex++] = r;
		byteBuffer[bufferIndex++] = g;
		byteBuffer[bufferIndex++] = b;
		byteBuffer[bufferIndex++] = 255 ;
	}
};

//-------- constructor

buildBuffer();

//-------- public methods

return {

getColorForIter: function(iter) {
	if (iter===0)
		return 0xFF000000;
	var res = buffer[iter%resolution];
	//console.log(iter, res)
	return res;
}

};

};
});

