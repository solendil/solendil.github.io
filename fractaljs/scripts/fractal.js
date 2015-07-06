/*
 * Definition of the FractalJS global object that contains all the rest
 */
window.FractalJS = window.FractalJS || {};

/*
 * Some global initialization methods (polyfills)
 * Some static utility methods
 */
FractalJS.util = (function(){
"use strict";

//-------- polyfills 

Math.trunc = Math.trunc || function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
  };
}

if ("performance" in window === false) {
	window.performance = {};
}
  
// https://gist.github.com/paulirish/5438650
if ("now" in window.performance === false){
	var nowOffset = Date.now();
	if (performance.timing && performance.timing.navigationStart){
	  nowOffset = performance.timing.navigationStart;
	}
	window.performance.now = function now(){
	  return Date.now() - nowOffset;
	};
}

//-------- private functions

var toHex2 = function(number) {
	if (number<0 || number>255) 
		throw "Number is out of range";
	if (number<16)
		return "0" + number.toString(16);
	return number.toString(16);
};

//-------- public functions

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

getHashColor: function(r, g, b) {
		return "#" + toHex2(r) + toHex2(g) + toHex2(b);
},

// http://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
base64ToArrayBuffer: function (base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

};

})();;/*
 * Event center of the Fractal engine, allows components to send or 
 * subscribe to events.
 */
FractalJS.Events = function(){
"use strict";

var listeners = {};

// call all functions in the cblist with _param
// _param is computed if it's a function and only if there are callbacks to do
var callbackHelp = function(cblist, _param) {
	if(cblist.length>0) {
		var param = _param;
		if (typeof(_param) === "function") 
			param = _param();
		for(var cb in cblist) {
			cblist[cb](param);
		}
	}
};

return {

on: function(_event, callback) {
	// events can be a single event or a list
	var events = _event;
	if (_event.constructor !== Array) 
		events = [_event];

	for (var i in events) {
		var event = events[i];
		if (!(event in listeners)) {
			listeners[event] = [];
		}
		listeners[event].push(callback);
	}
},

send: function(_event, _param) {
	// events can be a single event or a list
	var events = _event;
	if (_event.constructor !== Array)
		events = [_event];
	// param can be a single object or a function to be called
	var param = _param;
	if (typeof(_param) === "function") 
		param = _param();

	var cblist = [];
	for (var i in events) {
		var event = events[i];
		for (var j in listeners[event]) {
			cblist.push(listeners[event][j]);
		}
	}
	for(var cb in cblist) {
		cblist[cb](param);
	}
}

};

};;/*
 * The fractal engine:
 * - knows complex plane (P) and screen (S) size, coordinates and transforms
 * - handles the computation backbuffer
 * - performs fractal computations in tiles
 */
FractalJS.Engine = function(desc) {
"use strict";

//-------- private members

var x, y;		// coordinates of the center of S on P
var w;			// minimum extent of P displayed on S (height or width)
var iter;		// maximum number of iterations
var escape = 4;	// square of escape distance
var type;		// type of fractal

var swidth, sheight;	// S width & height
var pixelOnP;			// size of one pixel on P
var pxmin, pymin;		// upper-left displayed coordinate of P

var frame;				// the computation backbuffer 
var fractalFunction;	// the fractal function used

//-------- private methds

var project = function() {
	var sminExtent = Math.min(swidth, sheight);

	// precision limit is ten times the nb of pixels times double precision
	var limit = sminExtent*1.11e-15; 
	if (w<limit)
		w = limit; 

	pixelOnP = w/sminExtent;
	pxmin = x - swidth/2 * pixelOnP;
	pymin = y - sheight/2 * pixelOnP;
};

var logBase = 1.0 / Math.log(2.0);
var logHalfBase = Math.log(0.5)*logBase;

var fractalFunctionList = {
	'mandelsmooth' : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		for(j=0;j<4; ++j) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}

		var res = 5 + i - logHalfBase - Math.log(Math.log(sqx+sqy))*logBase;
		return res;
		//return i;	
	},	
	'mandel' : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		return i;	
	},
	'mandel3' : function(cx,cy) {
		var zx=0, zy=0, i=0, znx, zny;
		while (true) {
			znx = zx*zx*zx-3*zx*zy*zy+cx;
			zny = 3*zx*zx*zy-zy*zy*zy+cy;
			zx = znx;
			zy = zny;
			if (++i>=iter)
				break;
			if (zx*zx+zy*zy>escape)
				break;
		}		
		return i;
	},
	'burningship' : function(cx,cy) {
		var zx=0, zy=0, i=0, znx, zny;
		while (true) {
			znx = zx*zx-zy*zy+cx;
			zny = 2*zx*zy+cy;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			if (++i>=iter)
				break;
			if (zx*zx+zy*zy>escape)
				break;
		}		
		return i;
	}
};
fractalFunction = fractalFunctionList.mandel; //default

//-------- public methods

var publicMethods = {

setFractalDesc: function(desc) {
	if ('x' in desc)
		x = desc.x;
	if ('y' in desc)
		y = desc.y;
	if (desc.w)
		w = desc.w;
	if (desc.i)
		iter = Math.round(desc.i);
	if (desc.iter)
		iter = Math.round(desc.iter);
	if (desc.type) {
		if (!(desc.type in fractalFunctionList))
			throw "Invalid fractal function " + desc.type;
		type = desc.type;
		fractalFunction = fractalFunctionList[type];
	}
	if (desc.swidth) {
		swidth = desc.swidth;
		sheight = desc.sheight;
		frame = new Float32Array(swidth*sheight);
	}
	project();
	var res = this.getFractalDesc();
	//console.log(res);
	return res;
},

getFractalDesc: function() {
	var res = {
		x:x, y:y, w:w, iter:iter,
		testx:x, testy:y,
		pixelOnP:pixelOnP, 
		swidth:swidth, sheight:sheight,
		pxmin:pxmin, pymin:pymin,
		type:type,
	};
	return res;
},

drawTile: function(tile) {
	var py = pymin+tile.y1*pixelOnP;
	for (var sy=tile.y1; sy<tile.y2; sy++) {
		var px = pxmin+tile.x1*pixelOnP;
		var dx = sy*swidth+tile.x1;
		for (var sx=tile.x1; sx<tile.x2; sx++) {
			var piter = fractalFunction(px, py);
			//console.log(px, py, piter)
			if (piter==iter)
				frame[dx++] = 0;
			else
				frame[dx++] = piter;
			px += pixelOnP;
		}
		py += pixelOnP;
	}	
	return frame;	
},

getBuffer: function() {
	return frame;
},

};

//-------- constructor
publicMethods.setFractalDesc(desc);
return publicMethods;

};


;/*
 * The palette:
 * - is a looping gradient in the range [0,1[
 * - the gradient is mapped to fractal iterations using a resolution and an offset
 * - there must be at least one stop, a stop is an index and an RGB color
 */
FractalJS.Palette = function(params) {
"use strict";

//-------- private members

var stops;
var resolution = params.resolution;
var buffer = new Int32Array(resolution);

var offset = params.offset;
var modulo = params.modulo;
var factor;			// factor for projection iteration -> color space

var callbacks = {		// external callbacks
	"palette.change":[],
};

//-------- private methds

var buildStops = function(params) {
	if (params.constructor === Array) {
		stops = params;
		return;
	}
	stops = [];
	var tstops = params.split(";");
	for (var i in tstops) {
		var tstop = tstops[i];
		var items = tstop.split("#");
		var index = Number(items[0]);
		var red = parseInt(items[1].substring(0,2),16);
		var green = parseInt(items[1].substring(2,4),16);
		var blue = parseInt(items[1].substring(4,6),16);
		stops.push({
			index:index,r:red,g:green,b:blue
		});
	}

};

var copyStop = function(stop, offset) {
	return {
		index:stop.index+(offset?offset:0), 
		r:stop.r,
		g:stop.g,
		b:stop.b
	};
};

var buildBuffer = function() {
	var i;
	var byteBuffer = new Uint8Array(buffer.buffer); // create an 8-bit view on the buffer
	
	//console.log(offset)
	var gstops = [];
	for (i in stops) {
		var stop = copyStop(stops[i], offset);
		stop.index = stop.index%1;
		gstops.push(stop);
	}
	gstops.sort(function(a,b){return a.index-b.index;});
	gstops.push(copyStop(gstops[0], +1));
	gstops.splice(0, 0, copyStop(gstops[gstops.length-2], -1));
	//console.log(gstops);
	var fstops=gstops;

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

var project = function() {
	factor = resolution/modulo;
	//console.log(factor, resolution, modulo)
};

//-------- constructor

buildStops(params.stops);
buildBuffer();
project();

//-------- public methods

return {

getColorForIter: function(iter) {
	if (iter===0)
		// TODO paletize this color
		return 0xFF000000;
	//var res = buffer[iter%resolution];
	//console.log(iter, factor, resolution, )
	var res = buffer[Math.trunc(iter*factor%resolution)];
	return res;
},

// what a mess...
getState: function() {
	return {buffer:buffer, stops:stops, offset:offset, modulo:modulo};
},

setShortDesc: function(state) {
	if (state.offset)
		offset = state.offset;
	if (state.modulo)
		modulo = state.modulo;
	buildStops(state.stops);
	buildBuffer();
	project();
},

getShortDesc: function() {
	var short="";
	for (var i in stops) {
		var stop = stops[i];
		short += stop.index;
		short += util.getHashColor(stop.r, stop.g, stop.b);
		short += ";";
	}
	return {modulo:modulo, offset:offset, stops:short.slice(0,-1)};
},

setState: function(state) {
	if (state.offset)
		offset = state.offset;
	if (state.modulo)
		modulo = state.modulo;
	util.callbackHelp(callbacks["palette.change"]);
	project();
},

build: function(state) {
	buildBuffer();
},

on: function(event, callback) {
	callbacks[event].push(callback);
}


};

};


;/*
 * The renderer:
 * - knows a fractal engine, a palette and a canvas
 * - can draw a frame, knows the movement vector if applicable
 * - splits renderings into "draw items", can cancel frames
 */
 FractalJS.Renderer = function(params, events) {
"use strict";

var util = FractalJS.util;

//-------- private members

var canvas, context;	// the canvas on which to display 
var imageData, idata32; // canvas backbuffer and view as 32bit-int array
var engine;				// the fractal engine
var palette; 			// palette

var drawList = [];		// list of remaining items to be drawn 
var nextCallback;		// id of the next callback for the draw list

var public_methods;
var startFrameMs;

//-------- constructor

canvas = params.canvas;
context = canvas.getContext("2d");
imageData = context.createImageData(canvas.width, canvas.height);
idata32 = new Uint32Array(imageData.data.buffer);

params.fractalDesc.swidth = canvas.width;
params.fractalDesc.sheight = canvas.height;

engine = new FractalJS.Engine(params.fractalDesc);
palette = new FractalJS.Palette(params.palette);

//-------- private methods

var callbackNewFrame = function() {
	startFrameMs = performance.now();
	events.send("frame.start", function() {
		return {fractalDesc:engine.getFractalDesc()};
	});
};

var callbackEndFrame = function() {
	var endFrameMs = performance.now();
	events.send("frame.end", function() {
		return {
			fractalDesc : engine.getFractalDesc(),
			buffer : engine.getBuffer(),
			time: endFrameMs-startFrameMs,
		};
	});
	// frame is finished; analyze buffer to auto-adjust iteration count
	// algorithm:
	// - we compute the percentage of pixels in the set/pixels on the screen
	// - the fringe is the band of pixels whose iteration is in the 10% upper
	// - we compute the percentage of pixels in the fringe/pixels in the set
	// - if set is big enough (>1%) and fringe is big vs set (>1%) increase iterations
	// - if set is big enough (>1%) and fringe is small vs set (<0.2%) decrease iterations
	var i, iter;
	var buffer = engine.getBuffer();
	var fractalDesc = engine.getFractalDesc();
	var minIter = 1e12, maxIter = -1;
	var nb = 0, nbInSet = 0;
	for (i=0; i<buffer.length; i++) {
		nb++;
		iter = buffer[i];
		if (iter===0) {
			nbInSet++;
			continue;
		}
		if (iter>maxIter) maxIter=iter;
		if (iter<minIter) minIter=iter;
	}
	var iterRange = maxIter-minIter;
	var fringe10p = fractalDesc.iter - Math.ceil(iterRange/10);
	var nbFringe10p = 0;
	for (i=0; i<buffer.length; i++) {
		iter = buffer[i];
		if (iter===0) 
			continue;
		if (iter>=fringe10p) 
			nbFringe10p++;
	}	
	var percInSet = 100.0*nbInSet/nb;
 	var percFringe10p = 100.0*nbFringe10p/nbInSet;
	if (percInSet > 1 && percFringe10p>1) {
		engine.setFractalDesc({iter:fractalDesc.iter*1.5});
		public_methods.draw();
		events.send("iter.change");
	}
	if (percInSet > 1 && percFringe10p<0.2) {
		engine.setFractalDesc({iter:fractalDesc.iter/1.5});
		// public_methods.draw();
		events.send("iter.change");
	}
};

var callbackInterruptFrame = function() {
};

// TODO : insert this in the drawing queue ?
var drawPalette = function() {
	var iterbuffer = engine.getBuffer();
	var limit = canvas.height*canvas.width;
	for (var i=0; i<limit; i++) 
		idata32[i] = palette.getColorForIter(iterbuffer[i]);
	context.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
};

var drawItem = function() {
	var tile = drawList.shift();

	var iterbuffer = engine.drawTile(tile);
	for (var sy=tile.y1; sy<tile.y2; sy++) {
		var dx = sy*canvas.width+tile.x1;
		for (var sx=tile.x1; sx<tile.x2; sx++) {
			var iter = iterbuffer[dx];
			var color = palette.getColorForIter(iter);
			idata32[dx++] = color;
		}
	}
	
	context.putImageData(imageData, 
		0, 0, tile.x1, tile.y1, 
		tile.x2-tile.x1, tile.y2-tile.y1);
	
	if (drawList.length>0) {
		nextCallback = setTimeout(drawItem,0);
	} else {
		callbackEndFrame();
	}
};

//-------- public methods

public_methods = {

drawPalette: function() {
	drawPalette();
},

draw: function(vector) {
	// if a frame is being drawn, cancel next callback, empty draw list
	if (drawList.length!==0) {
		clearTimeout(nextCallback);
		drawList.length = 0;
		callbackInterruptFrame();
	}

	callbackNewFrame();

	// if a movement vector is provided, zoom/pan the current canvas accordingly to provide a quick first picture
	if (vector) {
		var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		// TODO : cache to improve speed
		// http://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
		var div = document.createElement('div');
		div.innerHTML = "<canvas width='"+imageData.width+"' "+
			"height='"+imageData.height+"'> </canvas>";
		var newCanvas = div.firstChild;

		newCanvas.getContext("2d").putImageData(imageData, 0, 0);
		context.scale(vector.z, vector.z);
		context.translate(vector.x, vector.y);
		context.drawImage(newCanvas,0,0);	
		context.setTransform(1, 0, 0, 1, 0, 0);
	}

	// generate tiles in drawList
	var tilesNb = Math.sqrt(params.renderer.numberOfTiles);
	var tilewidth = canvas.width/tilesNb;
	var tileheight = canvas.height/tilesNb;
	var id = 0;
	for (var i=0; i<tilesNb; i++) {
		for (var j=0; j<tilesNb; j++) {
			var tile = {
				i:i,j:j,id:id++,
				// TODO : Math.round? We must have overlapping pixels
				x1:Math.round(j*canvas.width/tilesNb),
				x2:Math.round((j+1)*canvas.width/tilesNb),
				y1:Math.round(i*canvas.height/tilesNb),
				y2:Math.round((i+1)*canvas.height/tilesNb),
			};
			if (vector && (vector.mvt=="zoomin" || vector.mvt=="zoomout")) {
				tile.x = (tile.x1+tile.x2)/2; // center of tile
				tile.y = (tile.y1+tile.y2)/2;
				tile.dx = vector.sx-tile.x; // distance to zoom point
				tile.dy = vector.sy-tile.y;
				tile.dist = tile.dx*tile.dx + tile.dy*tile.dy;
			}
			if (vector && vector.mvt=="pan") {
				tile.prio = 0;
				if (vector.x>0 && tile.x1<vector.x) {
					tile.prio = 1;
				}
				if (vector.x<0 && tile.x2>canvas.width+vector.x) {
					tile.prio = 1;
				}
				if (vector.y>0 && tile.y1<vector.y) {
					tile.prio = 1;
				}
				if (vector.y<0 && tile.y2>canvas.height+vector.y) {
					tile.prio = 1;
				}
			}
			drawList.push(tile);
		}
	}

	// prioritize tiles according to movement
	if (vector && vector.mvt=="pan") {
		drawList.sort(function(t1,t2){
			return t2.prio - t1.prio;
		});
	}
	if (vector && vector.mvt=="zoomin") {
		drawList.sort(function(t1,t2){
			return t1.dist - t2.dist;
		});
	}
	if (vector && vector.mvt=="zoomout") {
		drawList.sort(function(t1,t2){
			return t2.dist - t1.dist;
		});
	}

	// call first item in drawList
	nextCallback = setTimeout(drawItem,0);	
},

resize: function() {
	engine.setFractalDesc({
		swidth: canvas.width, 
		sheight: canvas.height
	});
	imageData = context.createImageData(canvas.width, canvas.height);
	idata32 = new Uint32Array(imageData.data.buffer);
},

setFractalDesc: function (desc) {
	var res = engine.setFractalDesc(desc);
	return res;
},

getFractalDesc: function () {
	return engine.getFractalDesc();
},

getPalette: function () {
	return palette;
}

};

return public_methods;

};
;/*
 * The controller:
 * - capture events related to the canvas and modify the view accordingly
 * - loads the URL parameters and updates the URL in relatime
 */
FractalJS.Controller = function(renderer, canvas, params, events) {
"use strict";

//-------- private members

var zoomFactor = 1.3;

var isDragging;			// is the user dragging ?
var dragX, dragY;		// start dragging point
var dragStartDesc;		// start fractal description
var ldragX, ldragY;		// last dragging point

var callbacks = {		// external callbacks
	"mouse.control":[],
};

//-------- private methods

var updateUrl = function() {
	var desc = renderer.getFractalDesc();

	// create a buffer and two views on it to store fractal parameters
	var buffer = new ArrayBuffer(32);
	var intArray = new Uint16Array(buffer);
	var doubleArray = new Float64Array(buffer);
	intArray[0] = 1; // version number
	intArray[1] = desc.iter;
	doubleArray[1] = desc.x;
	doubleArray[2] = desc.y;
	doubleArray[3] = desc.w;

	// encode as base64 and put in the URL
	// https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string/11562550#11562550
	var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
	base64String = base64String.split("/").join("*");
	base64String = base64String.split("=").join("_");

	history.replaceState("", "", "#A"+base64String);
	//document.location.hash="A"+base64String;
	//console.log("Updating URL", {x:desc.x,y:desc.y,w:desc.w,iter:desc.iter});
};

var readUrl = function() {
	try {
		var url = document.location.hash;
		if (url.startsWith("#A")) {
			var base64String = url.substr(2);
			base64String = base64String.split("*").join("/");
			base64String = base64String.split("_").join("=");

			var buffer = FractalJS.util.base64ToArrayBuffer(base64String);
			var intArray = new Uint16Array(buffer);
			var doubleArray = new Float64Array(buffer);

			var desc = {
				x:doubleArray[1],
				y:doubleArray[2],
				w:doubleArray[3],
				iter:intArray[1]
			};

			//console.log("Initialization", desc);
			renderer.setFractalDesc(desc);
		}
	} catch(e) {
		console.error("Could not read URL");
	}
};

//-------- event catchers

if (params.mouseControl) {

	canvas.onmousedown = function(e) {
		if (!e) e = window.event;
		isDragging = true;
		dragX = ldragX = e.screenX;
		dragY = ldragY = e.screenY;
		dragStartDesc = renderer.getFractalDesc();
	};

	window.addEventListener("mouseup", function(e) {
		if (!e) e = window.event;
		isDragging = false;
	});

	window.addEventListener("mousemove", function(e) {
		if (!e) e = window.event;
		if (isDragging) {
			var vecx = e.screenX-dragX;
			var vecy = e.screenY-dragY;
			var vecpx = vecx*dragStartDesc.pixelOnP;
			var vecpy = vecy*dragStartDesc.pixelOnP;
			var c = {x:dragStartDesc.x-vecpx, y:dragStartDesc.y-vecpy};
			renderer.setFractalDesc(c);

	        var vfx = e.screenX - ldragX;
	        var vfy = e.screenY - ldragY;  
	        var vector = {x:vfx,y:vfy,mvt:"pan"};     
			renderer.draw(vector);
			events.send("mouse.control");
	        ldragX = e.screenX;
	        ldragY = e.screenY;
		}
	});

	var wheelFunction = function(e) {
		if (!e) e = window.event;
		var mousex = e.clientX;
		var mousey = e.clientY;

	    var startDesc = renderer.getFractalDesc();
	    var c = renderer.getFractalDesc();

		// zoom in place, two steps : 
		// 1) translate complex point under mouse to center
		// 2) zoom, and translate back by the zoomed vector
		// should happen in only one step if I could figure out the math :-)
		var pax = (mousex - c.swidth/2)*c.pixelOnP;
		var pay = (mousey - c.sheight/2)*c.pixelOnP;
		c.x += pax;
		c.y += pay;
		c = renderer.setFractalDesc(c);
	    var vector = {sx:mousex,sy:mousey};

	    var delta = e.deltaY || e.wheelDelta; // IE11 special

	    if(delta > 0) {
	        c.w /= zoomFactor;
			c.x -= pax / zoomFactor;
			c.y -= pay / zoomFactor;
	        vector.z = 1 * zoomFactor;
	        vector.mvt = "zoomin";
	    } else {
	        c.w *= zoomFactor;
			c.x -= pax * zoomFactor;
			c.y -= pay * zoomFactor;
	        vector.z = 1 / zoomFactor;
	        vector.mvt = "zoomout";
	    }
	    var endDesc = renderer.setFractalDesc(c);

	    // computes the movement vector, then redraws
	    vector.x = (startDesc.pxmin - endDesc.pxmin) / startDesc.pixelOnP;
	    vector.y = (startDesc.pymin - endDesc.pymin) / startDesc.pixelOnP;
		renderer.draw(vector);
		events.send("mouse.control");
		e.preventDefault();
	};

	// IE11 special
	if ("onwheel" in canvas) 
		canvas.onwheel = wheelFunction;
	else 
		canvas.onmousewheel = wheelFunction;

}

if (params.fitToWindow) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	renderer.resize();
	window.onresize = function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		renderer.resize();
		renderer.draw();
	};
}

//-------- constructor & jquery callbacks

readUrl();
events.on("iter.change", updateUrl);
events.on("mouse.control", updateUrl);
events.on("api.change", updateUrl);

//-------- public methods
// none :)

};
;/*
 * The main fractal module:
 * - receives one single object describing a fractal to display/manipulate
 * - provides additional methods and callbacks
 * - configuration object:

{
    canvas : <DOM canvas node>		// mandatory canvas
    fractalDesc	: <JSON object>		// mandatory fractal description (see engine.js)
    palette : {						// the default palette object
		stops : [
			{index:0,r:0,g:0,b:0},
			{index:0.5,r:255,g:255,b:255},
		],
		resolution : 100,
		offset : 0,
		modulo : 0
    }
    renderer : {
		numberOfTiles : 1,			// number of tiles to draw (approximate)
		drawAfterInit : true,		// should the fractal be drawn after init
    },
	controller : {
		mouseControl : true,		// allow mouse navigation in canvas
		fitToWindow : false,		// fit the canvas to the window
	}    
}

 */
FractalJS.create = function(params) {
"use strict";

//-------- private members

var renderer, controller;
var util = FractalJS.util;
var events = FractalJS.Events();

//-------- constructor

if (!params.canvas || !params.canvas.width)
	throw "Canvas is not set";
if (!params.fractalDesc) 
	throw "Fractal Description is not set";

if (!params.palette) 
	params.palette = {
		stops : [
			{index:0,r:0,g:0,b:0},
			{index:0.5,r:255,g:255,b:255},
		],
    };

params.palette = util.defaultProps(params.palette, {
	stops: [],
	resolution: 1000,
	offset: 0,
	modulo: 50,
});

params.renderer = util.defaultProps(params.renderer, {
	numberOfTiles: 1,
	drawAfterInit: true
});

params.controller = util.defaultProps(params.controller, {
	mouseControl: true,
	fitToWindow: false
});

renderer = new FractalJS.Renderer(params, events);

controller = new FractalJS.Controller(renderer, params.canvas, params.controller, events);

if (params.renderer.drawAfterInit)
	renderer.draw();

//-------- private methods


//-------- public methods

return {

setFractalDesc: function (desc) {
	var res = renderer.setFractalDesc(desc);
	events.send("api.change");
	return res;
},

getFractalDesc: function () {
	return renderer.getFractalDesc();
},

getPalette: function () {
	return renderer.getPalette();
},

draw: function() {
	renderer.draw();
},

drawPalette: function() {
	renderer.drawPalette();
},

events: events,

};	
};

