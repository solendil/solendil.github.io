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

/* Monotone cubic spline interpolation
   Usage example:
	var f = createInterpolant([0, 1, 2, 3, 4], [0, 1, 4, 9, 16]);
	var message = '';
	for (var x = 0; x <= 4; x += 0.5) {
		var xSquared = f(x);
		message += x + ' squared is about ' + xSquared + '\n';
	}
	alert(message);
	https://en.wikipedia.org/wiki/Monotone_cubic_interpolation
*/
/* jshint ignore:start */
createInterpolant: function(xs, ys) {
	var i, length = xs.length;
	
	// Deal with length issues
	if (length != ys.length) { throw 'Need an equal count of xs and ys.'; }
	if (length === 0) { return function(x) { return 0; }; }
	if (length === 1) {
		// Impl: Precomputing the result prevents problems if ys is mutated later and allows garbage collection of ys
		// Impl: Unary plus properly converts values to numbers
		var result = +ys[0];
		return function(x) { return result; };
	}
	
	// Rearrange xs and ys so that xs is sorted
	var indexes = [];
	for (i = 0; i < length; i++) { indexes.push(i); }
	indexes.sort(function(a, b) { return xs[a] < xs[b] ? -1 : 1; });
	var oldXs = xs, oldYs = ys;
	// Impl: Creating new arrays also prevents problems if the input arrays are mutated later
	xs = []; ys = [];
	// Impl: Unary plus properly converts values to numbers
	for (i = 0; i < length; i++) { xs.push(+oldXs[indexes[i]]); ys.push(+oldYs[indexes[i]]); }
	
	// Get consecutive differences and slopes
	var dys = [], dxs = [], ms = [];
	for (i = 0; i < length - 1; i++) {
		var dx = xs[i + 1] - xs[i], dy = ys[i + 1] - ys[i];
		dxs.push(dx); dys.push(dy); ms.push(dy/dx);
	}
	
	// Get degree-1 coefficients
	var c1s = [ms[0]];
	for (i = 0; i < dxs.length - 1; i++) {
		var m = ms[i], mNext = ms[i + 1];
		if (m*mNext <= 0) {
			c1s.push(0);
		} else {
			var dx = dxs[i], dxNext = dxs[i + 1], common = dx + dxNext;
			c1s.push(3*common/((common + dxNext)/m + (common + dx)/mNext));
		}
	}
	c1s.push(ms[ms.length - 1]);
	
	// Get degree-2 and degree-3 coefficients
	var c2s = [], c3s = [];
	for (i = 0; i < c1s.length - 1; i++) {
		var c1 = c1s[i], m = ms[i], invDx = 1/dxs[i], common = c1 + c1s[i + 1] - m - m;
		c2s.push((m - c1 - common)*invDx); c3s.push(common*invDx*invDx);
	}
	
	// Return interpolant function
	return function(x) {
		// The rightmost point in the dataset should give an exact result
		var i = xs.length - 1;
		if (x == xs[i]) { return ys[i]; }
		
		// Search for the interval x is in, returning the corresponding y if x is one of the original xs
		var low = 0, mid, high = c3s.length - 1;
		while (low <= high) {
			mid = Math.floor(0.5*(low + high));
			var xHere = xs[mid];
			if (xHere < x) { low = mid + 1; }
			else if (xHere > x) { high = mid - 1; }
			else { return ys[mid]; }
		}
		i = Math.max(0, high);
		
		// Interpolate
		var diff = x - xs[i], diffSq = diff*diff;
		return ys[i] + c1s[i]*diff + c2s[i]*diffSq + c3s[i]*diff*diffSq;
	};
},
/* jshint ignore:end */

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
FractalJS.EngineWorker = function() {
"use strict";
	return new Worker(FractalJS.EngineWorkerBlob);
};

// the web worker is defined as a blob, thank to
// http://stackoverflow.com/questions/5408406/web-workers-without-a-separate-javascript-file
FractalJS.EngineWorkerBlob = (function() {
"use strict";
var blobURL = URL.createObjectURL( new Blob([ '(',
function(){

//-------- start of actual worker code
var engine = (function() {

//-------- private members

var escape = 4;	// square of escape distance

var typeid;		// type of fractal
var fractalFunction;	// the fractal function used

var desc;

//-------- private methds

var iLog2 = 1.0 / Math.log(2.0);
var iLog3 = 1.0 / Math.log(3.0);

// core fractal functions
var fractalFunctionListSmooth = {
	0 : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<desc.iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		if (i==desc.iter) return i;
		for(j=0;j<4; ++j) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		var res = 5 + i - Math.log(Math.log(sqx+sqy)) * iLog2;
		return res;
	},
	// multibrot3
	1 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			znx = sqx*zx-3*zx*sqy+cx;
			zny = 3*sqx*zy-sqy*zy+cy;
			zx = znx;
			zy = zny;
			if (++i>=desc.iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		if (i==desc.iter) return i;
		for(j=0;j<4; ++j) {
			znx = sqx*zx-3*zx*sqy+cx;
			zny = 3*sqx*zy-sqy*zy+cy;
			zx = znx;
			zy = zny;
			sqx = zx*zx;
			sqy = zy*zy;
		}
		var res = 5 + i - Math.log(Math.log(sqx+sqy)) * iLog3;
		return res;
	},
	// burningship
	2 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			zny = (zx+zx)*zy+cy;
			znx = sqx-sqy+cx;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			if (++i>=desc.iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		if (i==desc.iter) return i;
		for(j=0;j<4; ++j) {
			zny = (zx+zx)*zy+cy;
			znx = sqx-sqy+cx;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			sqx = zx*zx;
			sqy = zy*zy;
		}
		var res = 5 + i - Math.log(Math.log(sqx+sqy)) * iLog2;
		return res;
	},
	// tippetts
	3 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0;
		for(;i<desc.iter && sqx+sqy<=escape; ++i) {
			zx = sqx-sqy+cx;
			zy = (zx+zx)*zy+cy;
			sqx = zx*zx;
			sqy = zy*zy;
		}
		return i;
	},
	// Julia Set A
	4 : function(cx,cy) {
		var znx=cx, zny=cy, sqx=cx*cx, sqy=cy*cy, i=0, j=0;
		for(;i<desc.iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + 0.15;
			znx = sqx-sqy -0.79;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		if (i==desc.iter) return i;
		for(j=0;j<4; ++j) {
			zny = (znx+znx)*zny + 0.15;
			znx = sqx-sqy -0.79;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		var res = 5 + i - Math.log(Math.log(sqx+sqy)) * iLog2;
		return res;
	},
	// Phoenix Set
	5 : function(cx,cy) {
		var x=-cy, y=cx, xm1=0, ym1=0;
		var sx=0, sy=0, i=0;
		var c=0.5667, p=-0.5;
		for(;i<desc.iter && sx+sy<=escape; ++i) {
			xp1 = x*x-y*y+c+p*xm1;
			yp1 = 2*x*y+p*ym1;
			sx = xp1*xp1;
			sy = yp1*yp1;
			xm1=x; ym1=y;
			x=xp1; y=yp1;
		}
		if (i==desc.iter) return i;
		for(j=0;j<4; ++j) {
			xp1 = x*x-y*y+c+p*xm1;
			yp1 = 2*x*y+p*ym1;
			sx = xp1*xp1;
			sy = yp1*yp1;
			xm1=x; ym1=y;
			x=xp1; y=yp1;
		}
		var res = 5 + i - Math.log(Math.log(x*x+y*y)) * iLog2;
		return res;
	},
};

// core fractal functions
var fractalFunctionList = {
	'mandelsmooth' : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<desc.iter && sqx+sqy<=escape; ++i) {
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
	// mandelbrot
	0 : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<desc.iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		return i;
	},
	// multibrot3
	1 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			znx = sqx*zx-3*zx*sqy+cx;
			zny = 3*sqx*zy-sqy*zy+cy;
			zx = znx;
			zy = zny;
			if (++i>=desc.iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		return i;
	},
	// burningship
	2 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			zny = (zx+zx)*zy+cy;
			znx = sqx-sqy+cx;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			if (++i>=desc.iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		return i;
	},
	// tippetts
	3 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0;
		for(;i<desc.iter && sqx+sqy<=escape; ++i) {
			zx = sqx-sqy+cx;
			zy = (zx+zx)*zy+cy;
			sqx = zx*zx;
			sqy = zy*zy;
		}
		return i;
	},
	// Julia Set A
	4 : function(cx,cy) {
		var znx=cx, zny=cy, sqx=cx*cx, sqy=cy*cy, i=0, j=0;
		for(;i<desc.iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + 0.15;
			znx = sqx-sqy -0.79;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		return i;
	},
	// Phoenix Set
	5 : function(cx,cy) {
		var x=-cy, y=cx, xm1=0, ym1=0;
		var sx=0, sy=0, i=0;
		var c=0.5667, p=-0.5;
		for(;i<desc.iter && sx+sy<=escape; ++i) {
			xp1 = x*x-y*y+c+p*xm1;
			yp1 = 2*x*y+p*ym1;
			sx = xp1*xp1;
			sy = yp1*yp1;
			xm1=x; ym1=y;
			x=xp1; y=yp1;
		}
		return i;
	},
};

//-------- public methods

return {

drawTileOnBuffer: function(tile) {
	//console.log("draw", tile, desc)
	//console.log(fractalFunction)
	var frame = tile.frame;
	var py = desc.pymin+tile.y1*desc.pixelOnP;
	var dx = 0;
	for (var sy=tile.y1; sy<=tile.y2; sy++) {
		var px = desc.pxmin+tile.x1*desc.pixelOnP;
		for (var sx=tile.x1; sx<=tile.x2; sx++) {
			var piter = fractalFunction(px, py);
			if (piter==desc.iter)
				frame[dx++] = 0;
			else
				frame[dx++] = piter;
			px += desc.pixelOnP;
		}
		py += desc.pixelOnP;
	}
},

drawSuperTileOnBuffer: function(tile) {
	var sss = desc.pixelOnP/4;
	var frame = tile.frame;
	var py = desc.pymin+tile.y1*desc.pixelOnP;
	var dx = 0;
	for (var sy=tile.y1; sy<=tile.y2; sy++) {
		var px = desc.pxmin+tile.x1*desc.pixelOnP;
		for (var sx=tile.x1; sx<=tile.x2; sx++) {
			var itersum = 0;
			for (var ss=0; ss<16; ss++) {
				itersum += fractalFunction(px+(ss/4*sss), py+(ss%4*sss));
			}
			var piter = itersum/16;
			frame[dx++] = piter==desc.iter?0:piter;
			px += desc.pixelOnP;
		}
		py += desc.pixelOnP;
	}
},

drawSubTileOnBuffer: function(tile) {
	var res=4;
	var py = desc.pymin+(tile.y1+res/2)*desc.pixelOnP;
	var index = 0;
	for (var y=0; y<tile.height; y+=res) {
		var px = desc.pxmin+(tile.x1+res/2)*desc.pixelOnP;
		var lineindex = index;
		for (var x=0; x<tile.width; x+=res) {
			var piter = fractalFunction(px, py);
			var color = piter==desc.iter?0:piter;
			for (var sx=0; sx<res && x+sx<tile.width; sx++)
				tile.frame[index++] = color;
			px += desc.pixelOnP*res;
		}
		for (var sy=1; sy<res && y+sy<tile.height; sy++)
			for (var tx=0; tx<tile.width; tx++)
				tile.frame[index++] = tile.frame[lineindex+tx];
		py += desc.pixelOnP*res;
	}
},

	setDesc: function(other) {
		desc=other;
		//console.log("setDesc",desc)
		if (desc.smooth)
			fractalFunction = fractalFunctionListSmooth[desc.typeid];
		else
			fractalFunction = fractalFunctionList[desc.typeid];
	}

};

//-------- constructor
})({});

onmessage = function(param) {
	var data = param.data;
	if (!data)
		console.error(param);
	if (data.action === "setDesc") {
		engine.setDesc(data.desc);
	} else if (data.action === "draw") {
		if (data.quality==200) engine.drawTileOnBuffer(data.tile);
		else if (data.quality==100) engine.drawSubTileOnBuffer(data.tile);
		else if (data.quality==300) engine.drawSuperTileOnBuffer(data.tile);
		else throw "invalid drawing quality";
		//setTimeout(function() {
		postMessage({
			action:"endTile",
			quality:data.quality,
			tile:param.data.tile,
			frameId:param.data.frameId,
			finished:param.data.finished
		});
		//},0);
	} else {
		throw "invalid worker message";
	}
};
//-------- end of actual worker code

}.toString(),
')()' ], { type: 'application/javascript' } ) );
return blobURL;
})();
;/*
 * The engine:
 * - knows fractal parameters and perform basic computations on them (pixel ratio, zoom limit, etc...)
 * - instanciates and maintains workers to perform the actual fractal computations
 */
FractalJS.Engine = function(nbThreads) {
"use strict";

var desc = {};
var workers = [];
for (var i=0; i<nbThreads; i++)
  workers.push(FractalJS.EngineWorker());

var project = function() {
  var sminExtent = Math.min(desc.swidth, desc.sheight);
  // precision limit is ten times the nb of pixels times double precision
  var limit = sminExtent*1.11e-15;
  if (desc.w<limit)
    desc.w = limit;
  desc.pixelOnP = desc.w/sminExtent;
  desc.pxmin = desc.x - desc.swidth/2 * desc.pixelOnP;
  desc.pymin = desc.y - desc.sheight/2 * desc.pixelOnP;
};

this.eachWorker = function (callback) {
  for (var w in workers)
    callback(workers[w]);
};

this.setDesc = function (other) {
  if ('x' in other)
    desc.x = other.x;
  if ('y' in other)
    desc.y = other.y;
  if (other.w)
    desc.w = other.w;
  if (other.i)
    desc.iter = Math.round(other.i);
  if (other.iter)
    desc.iter = Math.round(other.iter);
  if ('typeid' in other)
    desc.typeid = other.typeid;
  if ('smooth' in other)
    desc.smooth = other.smooth;
  if (other.swidth) {
    desc.swidth = other.swidth;
    desc.sheight = other.sheight;
  }
  project();
  for (var w in workers)
    workers[w].postMessage({action:"setDesc",desc:desc,other:other});
};

this.getDesc = function () {
  return {
    x:desc.x, y:desc.y, w:desc.w, iter:desc.iter,
    pixelOnP:desc.pixelOnP,
    swidth:desc.swidth, sheight:desc.sheight,
    pxmin:desc.pxmin, pymin:desc.pymin,
    typeid:desc.typeid, smooth:desc.smooth
  };
};

};
;/*
 * The color map:
 * - is an array of colors whose size is the "resolution"
 * - a fractal iteration number is mapped onto this array according to 
 *   the "offset" (range [0..1[) and the "density" (range [0.1..10[)
 * - is created from the different palette builders
 */
FractalJS.Colormap = function(params) {
"use strict";

//-------- private members

var buffer = new Int32Array(params.buffer);
var offset = params.offset || 0.0;
var density = params.density || 20;
var resolution = buffer.length;
var typeid = params.typeid;

//-------- private methds

//-------- constructor

//-------- public methods

return {

getColorForIter: function(iter) {
	if (iter===0)
		return 0xFF000000;
	var res = buffer[Math.floor((iter*density+offset*resolution)%resolution)];
	return res;
},

buffer: function() {
	return buffer;
},

getDesc: function() {
	return {
		offset:offset,
		density:density,
		buffer:buffer,
		typeid:typeid,
	};
},

setDesc: function(cmap) {
	//console.log("set ", cmap)
	if (cmap.offset)
		offset = cmap.offset;
	if (cmap.density)
		density = cmap.density;
	if (cmap.typeid)
		typeid = cmap.typeid;
	if (cmap.buffer) {
		buffer = cmap.buffer;
		resolution = cmap.buffer.length;
	}
}

};

};


; FractalJS.Renderer = function(fractal) {
"use strict";

//-------- shortcuts

var events = fractal.events;
var params = fractal.params.renderer;
var canvas = fractal.params.canvas;
var util   = FractalJS.util;
var that   = this;
var debug  = false;

//-------- private members

// the canvas on which to display, its context, backbuffer and view as int32
var context  	= canvas.getContext("2d");
var imageData, idata32;

// colormap is defined later
var colormap 	= null;

// internal state for tiling
var tiles=[];
var drawList = [];		// list of remaining items to be drawn

var startFrameMs;
var frameId = 0;
var nbOfThreads = 4;

//-------- constructor

if ("hardwareConcurrency" in navigator) {
	nbOfThreads = navigator.hardwareConcurrency;
	console.log("FractalJS will use all " + nbOfThreads + " cores");
} else {
	console.log("FractalJS will use the default " + nbOfThreads + " threads");
}

var engine = new FractalJS.Engine(nbOfThreads);

//-------- public methods

this.resize = function() {
	// send message to workers
	this.setFractalDesc({
			swidth: canvas.width,
			sheight: canvas.height
		});
	// resize temp buffers
	imageData = context.createImageData(canvas.width, canvas.height);
	idata32 = new Uint32Array(imageData.data.buffer);

  // compute new tiling
  var ratio = canvas.width / canvas.height;
  var tileNbHeight = Math.sqrt(params.numberOfTiles/ratio);
  var tileNbWidth = Math.round(tileNbHeight*ratio);
  tileNbHeight = Math.round(tileNbHeight);
  console.log("tiles: "+tileNbWidth+"*"+tileNbHeight+" = "+tileNbHeight*tileNbWidth+" ("+params.numberOfTiles+" asked), ratio "+ratio);
  // instanciate new tiles
  var tileid = 0;
  tiles.length=0;
  for (var j=0; j<tileNbHeight; j++) {
    for (var i=0; i<tileNbWidth; i++) {
      var tile = {
        i:i,j:j,id:tileid++,
        x1:Math.round(i*canvas.width/tileNbWidth),
        x2:Math.round((i+1)*canvas.width/tileNbWidth)-1,
        y1:Math.round(j*canvas.height/tileNbHeight),
        y2:Math.round((j+1)*canvas.height/tileNbHeight)-1,
      };
      tile.x = (tile.x1+tile.x2)/2; // center of tile
      tile.y = (tile.y1+tile.y2)/2;
      tile.width = tile.x2-tile.x1+1;
      tile.height = tile.y2-tile.y1+1;
      tile.frame = new Float32Array(tile.width*tile.height);
      tile.indexScreen = tile.y1*canvas.width+tile.x1;
      tiles.push(tile);
    }
  }
};

this.setFractalDesc = function (desc) {
  engine.setDesc(desc);
};
this.getFractalDesc = function () {
  return engine.getDesc();
};


this.setColorDesc = function(desc) {
	if (!colormap) {
		colormap = FractalJS.Colormap(desc);
	} else
		return colormap.setDesc(desc);
};

this.getColorDesc = function() {
	return colormap.getDesc();
};

this.drawColors = function() {
	refreshColormap();
};

var lastvector = null;
var lastquality = null;

this.refine = function() {
  this.draw(null, lastvector, 300);
};

this.draw = function(vector, priovector, quality) {
  lastvector = vector;
  if (!quality) quality=200;
  if (!priovector) priovector=vector;
  lastquality = quality;

	// if a frame is being drawn, cancel next callback, empty draw list
	if (drawList.length!==0)
		drawList.length = 0;

	startFrameMs = performance.now();
	frameId++;
	events.send("frame.start");

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

	// push tiles in drawList
	var tile;
	for (var i in tiles) {
		tile = tiles[i];
		if (vector && (vector.mvt=="zoomin" || vector.mvt=="zoomout")) {
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

	// dispatch first items of the drawList to all workers
  engine.eachWorker(function(w){
    tile = drawList.shift();
		w.postMessage({action:"draw", quality:quality, frameId:frameId, tile:tile});
  });
};

//-------- private methods

var endOfFrame = function() {
	var endFrameMs = performance.now();
	events.send("frame.end", function() {
		return {
			fractalDesc : engine.getDesc(),
			time: endFrameMs-startFrameMs,
		};
	});
  if (lastquality==300)
    return;
	// frame is finished; analyze buffer to auto-adjust iteration count
	// algorithm:
	// - we compute the percentage of pixels in the set/pixels on the screen
	// - the fringe is the band of pixels whose iteration is in the 10% upper
	// - we compute the percentage of pixels in the fringe/pixels in the set
	// - if set is big enough (>1%) and fringe is big vs set (>1%) increase iterations
	// - if set is big enough (>1%) and fringe is small vs set (<0.2%) decrease iterations
	var i, iter;
	//var buffer = engine.getBuffer();
	var minIter = 1e12, maxIter = -1;
	var nb = 0, nbInSet = 0;
	var tile;
	for (var ti in tiles) {
		tile = tiles[ti];
		for (i=0; i<tile.frame.length; i++) {
			nb++;
			iter = tile.frame[i];
			if (iter===0) {
				nbInSet++;
				continue;
			}
			if (iter>maxIter) maxIter=iter;
			if (iter<minIter) minIter=iter;
		}
	}
	var iterRange = maxIter-minIter;
	var fringe10p = engine.getDesc().iter - Math.ceil(iterRange/10);
	var nbFringe10p = 0;
  //console.log(minIter, maxIter, iterRange +"/"+ engine.getDesc().iter, nbInSet, fringe10p)
	for (ti in tiles) {
		tile = tiles[ti];
		for (i=0; i<tile.frame.length; i++) {
			iter = tile.frame[i];
			if (iter===0)
				continue;
			if (iter>=fringe10p)
				nbFringe10p++;
		}
	}
	var percInSet = 100.0*nbInSet/nb;
 	var percFringe10p = 100.0*nbFringe10p/nbInSet;
  //console.log(nbFringe10p, percInSet, percFringe10p)
	if (percInSet > 1 && percFringe10p>1) {
		that.setFractalDesc({iter:engine.getDesc().iter*1.5});
		that.draw();
		events.send("iter.change");
	} else {
    setTimeout(function() {that.refine();},1000);
  }
	if (percInSet > 1 && percFringe10p<0.2) {
		that.setFractalDesc({iter:engine.getDesc().iter/1.5});
		// public_methods.draw();
		events.send("iter.change");
	}
};

var refreshColormap = function() {
	var start = performance.now();
	// Performing the colormap refresh in place instead of calling the colormap
	// object brings a 5x performance in Chrome (25ms instead of 150).
	var cmap = colormap.getDesc();
	var buffer=cmap.buffer, offset=cmap.offset*buffer.length,
		density=cmap.density, resolution=buffer.length;
	for (var ti in tiles) {
		var tile = tiles[ti];
		var indexscreen = tile.indexScreen;
		var index = 0;
		for (var y=0; y<tile.height; y++) {
			for (var x=0; x<tile.width; x++) {
				var iter = tile.frame[index++];
				if (iter===0)
					idata32[indexscreen] = 0xFF000000;
				else
					idata32[indexscreen] = buffer[~~((iter*density+offset)%resolution)];
				indexscreen++;
			}
			indexscreen += canvas.width-tile.width;
		}
	}
	context.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
	var end = performance.now();
	//console.log("colormap refreshed in ", (end-start))
};

var workerMessage = function(param) {
	if (param.data.action === "endTile") {
		if (param.data.frameId != frameId)
			return; // frame has changed, drop this result

		// replace original tile by the one coming from worker
		var incid = param.data.tile.id;
		var tile = param.data.tile;
		tiles[incid] = tile;

		// paint on canvas
    var tileIndex = 0;
    var bufferIndex = 0;
    for (var ty=0; ty<tile.height; ty++) {
      bufferIndex = (ty+tile.y1)*canvas.width+tile.x1;
      for (var tx=0; tx<tile.width; tx++) {
        var iter = tile.frame[tileIndex++];
        var color = colormap.getColorForIter(iter);
        idata32[bufferIndex++] = color;
      }
    }
    context.putImageData(imageData, 0, 0, tile.x1, tile.y1, tile.width, tile.height);

		// set this worker to another task
		if (drawList.length>0) {
			tile = drawList.shift();
			var message = {
				action:"draw",
        quality:param.data.quality,
				frameId:frameId,
				tile:tile
			};
			if (drawList.length===0) {
				message.finished=true;
			}
			// why is it called "target" when it's the source ?
			param.target.postMessage(message);
		}

		// this mechanism looks fragile...
		if (param.data.finished)
			endOfFrame();
	} else {
    throw "Unknown message";
  }
};

engine.eachWorker(function(w) {w.onmessage=workerMessage;});
this.resize();

};
;/*
 * The controller:
 * - capture events related to the canvas and modify the view accordingly
 * - loads the URL parameters and updates the URL in relatime
 */
FractalJS.Controller = function(fractal) {
"use strict";

//-------- private members

var zoomFactor = 1.3;

var isDragging;			// is the user dragging ?
var dragX, dragY;		// start dragging point
var dragStartDesc;		// start fractal description
var ldragX, ldragY;		// last dragging point

//-------- shortcuts

var canvas = fractal.params.canvas;
var params = fractal.params.controller;
var events = fractal.events;

//-------- private methods

/*
 * If first letter of URL hash is an 'A'
 * Decode rest of hash using base64, build three arrays on the buffer:
 *   Uint8Array, Uint16Array, Float64Array
 * --bytes ------ array -------------	usage --------------------
 *   0,1          Uint16Array[0]		version of hash
 *   2,3          Uint16Array[1]		number of iterations
 *   4            Uint8Array[4]	    type of fractal
 *   5            Uint8Array[5]	    type of gradient
 *   6,7          Uint16Array[3]		color offset (times 10000)
 *   8-15         Float64Array[1]		x
 *   16-23        Float64Array[2]		y
 *   24-31        Float64Array[3]		w (extent)
 *   32-35        Float32Array[8]		color density (if present, 20 if not)
 *   36           Uint8Array[36]    flags (if present, 0 if not)
 *                                  0x00000001 : smooth shading
 *   37-39        reserved
 */
var updateUrl = function() {
	var desc = fractal.getFractalDesc();
	var color = fractal.getColorDesc();
	// create a buffer and two views on it to store fractal parameters
	var buffer = new ArrayBuffer(40);
	var byteArray = new Uint8Array(buffer);
	var intArray = new Uint16Array(buffer);
	var doubleArray = new Float64Array(buffer);
	var floatArray = new Float32Array(buffer);
	intArray[0] = 1; // version number
	intArray[1] = desc.iter;
	byteArray[4] = desc.typeid;
	byteArray[5] = color.typeid;
	intArray[3] = color.offset*10000;
	doubleArray[1] = desc.x;
	doubleArray[2] = desc.y;
	doubleArray[3] = desc.w;
	floatArray[8] = color.density;
	var flags = desc.smooth?1:0;
	byteArray[36] = flags;
	// encode as base64 and put in the URL
	// https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string/11562550#11562550
	var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
	base64String = base64String.split("/").join("*");
	base64String = base64String.split("=").join("_");
	history.replaceState("", "", "#A"+base64String);
	//document.location.hash="A"+base64String;
	//console.log("Updating URL", {x:desc.x,y:desc.y,w:desc.w,iter:desc.iter});
};

//-------- event catchers

if (params.mouseControl) {

	canvas.onmousedown = function(e) {
		if (!e) e = window.event;
		if (e.button !== 0)
			return;
		isDragging = true;
		dragX = ldragX = e.screenX;
		dragY = ldragY = e.screenY;
		if (e.button !== 0)
			return;
		dragStartDesc = fractal.getFractalDesc();
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
			fractal.setFractalDesc(c, true);

	        var vfx = e.screenX - ldragX;
	        var vfy = e.screenY - ldragY;
	        var vector = {x:vfx,y:vfy,mvt:"pan"};
			fractal.draw(vector);
			events.send("mouse.control");
	        ldragX = e.screenX;
	        ldragY = e.screenY;
		}
	});

	var wheelFunction = function(e) {
		if (!e) e = window.event;
		e.preventDefault();
	    var delta = e.deltaY || e.wheelDelta; // IE11 special
		var mousex = e.clientX;
		var mousey = e.clientY;

	    var startDesc = fractal.getFractalDesc();
	    var c = fractal.getFractalDesc();

	    // test if we're at the maximum possible resolution (1.11e-15/pixel)
		var sminExtent = Math.min(c.swidth, c.sheight);
		var limit = sminExtent*1.11e-15;
		if (c.w<=limit && delta > 0) {
			events.send("zoom.limit.reached");
			return;
		}

		// zoom in place, two steps :
		// 1) translate complex point under mouse to center
		// 2) zoom, and translate back by the zoomed vector
		// should happen in only one step if I could figure out the math :-)
		var pax = (mousex - c.swidth/2)*c.pixelOnP;
		var pay = (mousey - c.sheight/2)*c.pixelOnP;
		c.x += pax;
		c.y += pay;
		fractal.setFractalDesc(c,true);
		c = fractal.getFractalDesc(c);
	    var vector = {sx:mousex,sy:mousey};

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
			fractal.setFractalDesc(c, true);
			var endDesc = fractal.getFractalDesc(c);

	    // computes the movement vector, then redraws
	    vector.x = (startDesc.pxmin - endDesc.pxmin) / startDesc.pixelOnP;
	    vector.y = (startDesc.pymin - endDesc.pymin) / startDesc.pixelOnP;
		fractal.draw(vector);
		events.send("mouse.control");
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
	window.onresize = function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		fractal.resize();
		fractal.draw();
	};
}

//-------- public methods

this.readUrl = function() {
	try {
		var url = document.location.hash;
		if (url.startsWith("#A")) {
			var base64String = url.substr(2);
			base64String = base64String.split("*").join("/");
			base64String = base64String.split("_").join("=");

			var buffer = FractalJS.util.base64ToArrayBuffer(base64String);
			var byteArray = new Uint8Array(buffer);
			var intArray = new Uint16Array(buffer);
			var doubleArray = new Float64Array(buffer);
			var floatArray = new Float32Array(buffer);

			var flags = byteArray[36];
			var desc = {
				x:doubleArray[1],
				y:doubleArray[2],
				w:doubleArray[3],
				iter:intArray[1],
				typeid:byteArray[4],
				smooth:flags&0x1==1
			};

			var color = {
				offset:intArray[3]/10000.0,
				density:byteArray.length>32?floatArray[8]:20,
				typeid:byteArray[5],
				resolution:1000,
				buffer:FractalJS.Colormapbuilder().fromId(1000, byteArray[5]),
			};

			return [desc,color];
		}
	} catch(e) {
		console.error("Could not read URL");
		console.error(e);
	}
};

//-------- constructor & jquery callbacks

events.on("iter.change", updateUrl);
events.on("mouse.control", updateUrl);
events.on("api.change", updateUrl);

};
;/*
 * The color map builder generates colormaps from a variety of means including:
 * - stops
 */
FractalJS.Colormapbuilder = function(params) {
"use strict";
 
var standardGradients = {
	0:"0#080560;0.2#2969CB;0.40#F1FEFE;0.60#FCA425;0.85#000000",
	1:"0.0775#78591e;0.55#d6e341", // gold
	2:"0#0000FF;0.33#FFFFFF;0.66#FF0000", // bleublancrouge
	3:"0.08#09353e;0.44#1fc3e6;0.77#08173e", // night			
	4:"0#000085;0.25#fffff5;0.5#ffb500;0.75#9c0000", // defaultProps 	
	5:"0#000000;0.25#000000;0.5#7f7f7f;0.75#ffffff;0.975#ffffff", // emboss		

	// flatUI palettes (http://designmodo.github.io/Flat-UI/)
	10:"0#000000;0.25#16A085;0.5#FFFFFF;0.75#16A085", // green sea	
	11:"0#000000;0.25#27AE60;0.5#FFFFFF;0.75#27AE60", // nephritis
	12:"0#000000;0.25#2980B9;0.5#FFFFFF;0.75#2980B9", // nephritis
	13:"0#000000;0.25#8E44AD;0.5#FFFFFF;0.75#8E44AD", // wisteria	
	14:"0#000000;0.25#2C3E50;0.5#FFFFFF;0.75#2C3E50", // midnight blue	
	15:"0#000000;0.25#F39C12;0.5#FFFFFF;0.75#F39C12", // orange
	16:"0#000000;0.25#D35400;0.5#FFFFFF;0.75#D35400", // pumpkin	
	17:"0#000000;0.25#C0392B;0.5#FFFFFF;0.75#C0392B", // pmoegranate
	18:"0#000000;0.25#BDC3C7;0.5#FFFFFF;0.75#BDC3C7", // silver
	19:"0#000000;0.25#7F8C8D;0.5#FFFFFF;0.75#7F8C8D", // asbestos

};

var fromstops = function(resolution, stops) {


var buffer = new Int32Array(resolution);
var indices=[], reds=[], greens=[], blues=[];

var buildStops = function(params) {
	var stops = params.split(";");
	for (var i in stops) {
		var stop = stops[i];
		var items = stop.split("#");
		indices.push(Number(items[0]));
		reds.push(parseInt(items[1].substring(0,2),16));
		greens.push(parseInt(items[1].substring(2,4),16));
		blues.push(parseInt(items[1].substring(4,6),16));
	}
	//console.log(indices, reds, greens, blues)
};

var buildBuffer = function() {
	// loop first stop to end
	indices.push(indices[0]+1);
	reds.push(reds[0]);
	greens.push(greens[0]);
	blues.push(blues[0]);
	//console.log(indices, reds, greens, blues)

	var interR = FractalJS.util.createInterpolant(indices, reds);
	var interG = FractalJS.util.createInterpolant(indices, greens);
	var interB = FractalJS.util.createInterpolant(indices, blues);

	var byteBuffer = new Uint8Array(buffer.buffer); // create an 8-bit view on the buffer
	var bufferIndex = 0;
	for (var i=0; i<resolution; i++) {
		var index = i/resolution;
		if (index<indices[0]) index+=1;
		byteBuffer[bufferIndex++] = interR(index);
		byteBuffer[bufferIndex++] = interG(index);
		byteBuffer[bufferIndex++] = interB(index);
		byteBuffer[bufferIndex++] = 255 ;
	}
};

buildStops(stops);
buildBuffer();

return buffer;
};

//-------- public methods

return {

getStandardGradients: function() {return standardGradients;},

fromId: function(resolution, id) {
	return fromstops(resolution, standardGradients[id]);
},

// with cubic interpolation
fromstops: function(resolution, stops) {
	return fromstops(resolution, stops);
},

};

};


;/*
 * The main fractal module:
 * - receives one single object describing a fractal to display/manipulate
 * - provides additional methods and callbacks
 * - configuration object:

{
    canvas : <DOM canvas node>		// mandatory canvas
    fractalDesc	: <JSON object>		// mandatory fractal description (see engine.js)
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
this.params = params;
this.events = FractalJS.Events();

//-------- constructor

// check parameters
if (!params.canvas || !params.canvas.width)
	throw "Canvas is not set";
if (!params.fractalDesc)
	throw "Fractal Description is not set";

// define default values
params.renderer = util.defaultProps(params.renderer, {
	numberOfTiles: 1,
	drawAfterInit: true
});
params.controller = util.defaultProps(params.controller, {
	mouseControl: true,
	fitToWindow: false
});

// instanciate controller, read and set URL
controller = new FractalJS.Controller(this);
var urlParams = controller.readUrl();
if (urlParams) {
	params.fractalDesc = urlParams[0];
	params.colorDesc = urlParams[1];
}

// define default palette if not set
if (!params.colorDesc) {
	params.colorDesc = {typeid:0, resolution:1000, buffer:FractalJS.Colormapbuilder().fromId(1000, 0)};
}

// instanciate renderer and set startup params
renderer = new FractalJS.Renderer(this);
renderer.setColorDesc(params.colorDesc);
renderer.setFractalDesc(params.fractalDesc);

// draw if required
if (params.renderer.drawAfterInit)
	renderer.draw();

//-------- public API

this.setFractalDesc = function (desc, nofire) {
	renderer.setFractalDesc(desc);
	if (!nofire)
		this.events.send("api.change");
};

this.getFractalDesc= function () {
	return renderer.getFractalDesc();
};

this.draw= function(vector) {
	renderer.draw(vector);
};

this.resize= function() {
	renderer.resize();
};

this.refreshColormap= function() {
	renderer.drawColors();
};

this.setColorDesc= function(cmap) {
	var res = renderer.setColorDesc(cmap);
	this.events.send("api.change");
	return res;
};

this.getColorDesc= function() {
	return renderer.getColorDesc();
};

};
