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

epsilonEquals: function(v1, v2, epsilon) {
	if (!epsilon)
		epsilon=1e-15;
	return Math.abs(v1-v2)<epsilon;
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
},

// https://jmperezperez.com/ondemand-javascript-lazy-loading-stubs/
loadJs: function(url, cb) {
  var script = document.createElement('script');
  script.setAttribute('src', url);
  script.setAttribute('type', 'text/javascript');

  var loaded = false;
  var loadFunction = function () {
    if (loaded) return;
    loaded = true;
    if (cb) cb();
  };
  script.onload = loadFunction;
  script.onreadystatechange = loadFunction;
  document.getElementsByTagName("head")[0].appendChild(script);
},

// http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
is_touch_device: function() {
  return 'ontouchstart' in window ||        // works on most browsers
       navigator.maxTouchPoints;       // works on IE10/11 and Surface
},

Matrix: function(a,b,c,d,e,f) {
	var Matrix = FractalJS.util.Matrix;
    if (f===undefined) {
      this.a = 1; this.c = 0; this.e = 0;
      this.b = 0; this.d = 1; this.f = 0;
    } else {
      this.a = a; this.c = c; this.e = e;
      this.b = b; this.d = d; this.f = f;
    }
    this.isInvertible = function() {
      var deter = this.a * this.d - this.b * this.c;
      return Math.abs(deter)>1e-15;
    };
    this.inverseGaussJordan = function() {
		function gje(M,c1i,c2i,f) {
			var c1 = M[c1i];
			var c2 = M[c2i];
			for (var i=0; i<6; i++) {
				// console.log("multiply factor", f, "by member", c2[i])
				c1[i] += c2[i] * f;
			}
		}
		function gjet(M,c1i,f) {
			var c1 = M[c1i];
			for (var i=0; i<6; i++) {
				// console.log("multiply factor", f, "by member", c1[i], "res", c1[i] * f)
				c1[i] = c1[i] * f;
			}
		}
		var M = [[a,c,e,1,0,0],[b,d,f,0,1,0],[0,0,1,0,0,1]];
		// console.log("START\n"+str(M));
		gje(M,1,2,-M[1][2]); // c2 = c2 + c3 * -f
		// console.log("c2=c2-fc3\n"+str(M));
		gje(M,0,2,-M[0][2]); // c1 = c1 + c3 * -e
		// console.log("c2=c2-ec3\n"+str(M));
		gje(M,1,0,-M[1][0]/M[0][0]);
		// console.log("c2=c2-?c3\n"+str(M));
		gje(M,0,1,-M[0][1]/M[1][1]);
		// console.log("c2=c2-?c3\n"+str(M));
		gjet(M,0,1/M[0][0]);
		// console.log("c1 norm\n"+str(M));
		gjet(M,1,1/M[1][1]);
		// console.log("c1 norm\n"+str(M));
		return new Matrix(M[0][3],M[1][3],M[0][4],M[1][4],M[0][5],M[1][5]);
    };
    this.inverse = function() {
      if (!this.isInvertible()) {
      	return this.inverseGaussJordan();
      } else {
        var a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f;
        var dt = a * d - b * c;
        return new Matrix(d/dt, -b/dt, -c/dt, a/dt, (c * f - d * e) / dt, -(a * f - b * e) / dt);
      }
    };
    this.multiply = function(o) {
      return new Matrix(
        this.a * o.a + this.c * o.b,
    		this.b * o.a + this.d * o.b,
    		this.a * o.c + this.c * o.d,
    		this.b * o.c + this.d * o.d,
    		this.a * o.e + this.c * o.f + this.e,
    		this.b * o.e + this.d * o.f + this.f
      );
    };
    this.rotate = function(angle) {
      var cos = Math.cos(angle), sin = Math.sin(angle);
      return this.multiply(new Matrix(cos, sin, -sin, cos, 0, 0));
    };
    this.isIdentity = function() {
      return this.a==1 && this.b===0 && this.c===0 && this.d==1 && this.e===0 && this.f===0;
    };
    this.clone = function(angle) {
      return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
    };
    this.applyTo = function(x, y) {
      return {
        x: x * this.a + y * this.c + this.e,
        y: x * this.b + y * this.d + this.f
      };
    };
    // this method is used to pass a matrix to a worker
    this.params = function() {
      return {a:a,b:b,c:c,d:d,e:e,f:f};
    };
}

};

})();

// add static method to matrix
FractalJS.util.Matrix.GetTriangleToTriangle = function(t1px, t1py, t1qx, t1qy, t1rx, t1ry, t2px, t2py, t2qx, t2qy, t2rx, t2ry) {
  var STD2T1 = new FractalJS.util.Matrix(t1px-t1rx, t1py-t1ry, t1qx-t1rx, t1qy-t1ry, t1rx, t1ry);
  var STD2T2 = new FractalJS.util.Matrix(t2px-t2rx, t2py-t2ry, t2qx-t2rx, t2qy-t2ry, t2rx, t2ry);
  var T12STD = STD2T1.inverse();
  return STD2T2.multiply(T12STD);
};

// add static method to matrix
FractalJS.util.Matrix.GetRotationMatrix = function(angle) {
  var cos = Math.cos(angle), sin = Math.sin(angle);
  return new FractalJS.util.Matrix(cos, sin, -sin, cos, 0, 0);
};

// add static method to matrix
FractalJS.util.Matrix.GetScaleMatrix = function(x, y) {
 	return new FractalJS.util.Matrix(x, 0, 0, y, 0, 0);
};

// add static method to matrix
FractalJS.util.Matrix.GetShearMatrix = function(x, y) {
 	return new FractalJS.util.Matrix(1, y, x, 1, 0, 0);
};

// add static method to matrix
FractalJS.util.Matrix.Identity = function(scale) {
  return new FractalJS.util.Matrix(1, 0, 0, 1, 0, 0);
};

;/*
 * Event center of the Fractal engine, allows components to send or
 * subscribe to events.
 */

/*
List of events :

frame.end
	Sent by the renderer when a frame is finished drawing. This event is generated for every quality.



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

};
;/*
 * The camera projects screen space on complex space and vice-versa
 */
FractalJS.Camera = function(){
  "use strict";

  var util = FractalJS.util;

  var matrix = null;
  var cam = this; //javascript and "this"... sigh...

  this.width = 100;
  this.height = 100;
  this.x = 0;
  this.y = 0;
  this.w = 0;
  this.pixelOnP = 0;
  this.viewportMatrix = util.Matrix.Identity();

  var getScreenToSquareMatrix = function(width, height) {
    var p = cam.viewportMatrix.applyTo(1,-1);
    var q = cam.viewportMatrix.applyTo(-1,1);
    var r = cam.viewportMatrix.applyTo(-1,-1);

    if (width >= height) {
      var x1=(width-height)/2, x2=x1+height;
      return util.Matrix.GetTriangleToTriangle(x2,height,x1,0,x1,height,p.x,p.y,q.x,q.y,r.x,r.y);
    } else {
      var y1=(height-width)/2, y2=y1+width;
      return util.Matrix.GetTriangleToTriangle(width,y2,0,y1,0,y2,p.x,p.y,q.x,q.y,r.x,r.y);
    }
  };

  var getSquareToComplexMatrix = function(x, y, w) {
    return util.Matrix.GetTriangleToTriangle(1,0,0,1,0,0,x+w/2,y,x,y+w/2,x,y);
  };

  // project is called whenever the camera changes; it computes new projection parameters
  this.project = function() {
    // precision limit is ten times the nb of pixels times double precision
    var extent = Math.min(this.width, this.height);
    var limit = extent*1.11e-15;
    if (this.w<limit)
      this.w = limit;
    this.pixelOnP = this.w/extent;

    // matrix stuff
    var S2Q = getScreenToSquareMatrix(this.width,this.height);
    var Q2C = getSquareToComplexMatrix(this.x,this.y,this.w);
    matrix = Q2C.multiply(S2Q);
  };

  this.setSize = function(width, height) {
    this.width = width;
    this.height = height;
    this.project();
  };

  this.transformViewport = function(type, value) {
    var m;
    if (type=="rotate")
      m = util.Matrix.GetRotationMatrix(value);
    else if (type=="scaleX")
      m = util.Matrix.GetScaleMatrix(value,1);
    else if (type=="scaleY")
      m = util.Matrix.GetScaleMatrix(1, value);
    else if (type=="shearX")
      m = util.Matrix.GetShearMatrix(value,0);
    else if (type=="shearY")
      m = util.Matrix.GetShearMatrix(0, value);
    else
      throw "what? " + type;
    this.viewportMatrix = this.viewportMatrix.multiply(m);
    this.project();
    if (type=="scaleX" || type=="scaleY")
      return m.inverse();
    else
      return m;
  };

  this.resetViewport = function(type, value) {
    this.viewportMatrix = util.Matrix.Identity();
    this.project();
  };

  this.setXYW = function(x,y,w) {
    this.x = x;
    this.y = y;
    if (w) this.w = w;
    this.project();
  };

  this.S2C = function(x,y) {
    return matrix.applyTo(x,y);
  };

  this.C2S = function(x,y) {
    return matrix.inverse().applyTo(x,y);
  };

  // returns a serialisable object
  this.getWorkerModel = function() {
    return {pixelOnP:this.pixelOnP,
            a:matrix.a, b:matrix.b, c:matrix.c, d:matrix.d, e:matrix.e, f:matrix.f};
  };

  this.clone = function() {
    var res = new FractalJS.Camera();
    res.width    = this.width;
    res.height   = this.height;
    res.x        = this.x;
    res.y        = this.y;
    res.w        = this.w;
    res.angle    = this.angle;
    res.scaleX   = this.scaleX;
    res.viewportMatrix   = this.viewportMatrix.clone();
    res.project();
    return res;
  };

};
;/*
 * The Model of the fractal engine, ie the central place where data is
 * stored and shared between components.
 */
FractalJS.Model = function(canvas){
"use strict";

	this.canvas = canvas;
	this.camera = new FractalJS.Camera();
	this.camera.setSize(canvas.width, canvas.height);

	this.resize = function() {
		this.camera.setSize(this.canvas.width, this.canvas.height);
	};

	this.getWorkerModel = function() {
		var res = this.camera.getWorkerModel();
		res.smooth = this.smooth;
		res.typeId = this.typeId;
		res.iter   = this.iter;
		return res;
	};

	this.setFractalDesc = function (desc) {
		if ("x" in desc)
			this.camera.setXYW(desc.x, desc.y, desc.w);
		if ("iter" in desc)
			this.iter = desc.iter;
		if ("typeId" in desc)
			this.typeId = desc.typeId;
		if ("smooth" in desc)
			this.smooth = desc.smooth;
		if ("angle" in desc || "scaleX" in desc )
			this.camera.setViewport(desc.angle, desc.scaleX);
		if ("viewport" in desc && desc.viewport !== undefined) {
			this.camera.viewportMatrix = desc.viewport;
			this.camera.project();
		}
	};

};
;/*
* The camera projects screen space on complex space and vice-versa
*/
FractalJS.Url = function(model, fractal){
"use strict";

	var util = FractalJS.util;

	this.update = function() {
		try {
			var args = [];
			var color = fractal.getColorDesc();
			args.push(["t",model.typeId]);
			args.push(["x",model.camera.x]);
			args.push(["y",model.camera.y]);
			args.push(["w",model.camera.w]);
			args.push(["i",model.iter]);
			args.push(["fs",model.smooth?1:0]);
			args.push(["ct",color.typeId]);
			args.push(["co",Math.round(color.offset*100)]);
			args.push(["cd",+color.density.toFixed(2)]);
			if (!model.camera.viewportMatrix.isIdentity()) {
				args.push(["va",model.camera.viewportMatrix.a.toFixed(4)]);
				args.push(["vb",model.camera.viewportMatrix.b.toFixed(4)]);
				args.push(["vc",model.camera.viewportMatrix.c.toFixed(4)]);
				args.push(["vd",model.camera.viewportMatrix.d.toFixed(4)]);
			}
			var str = "";
			for (var i in args) {
				var arg = args[i];
				str += "&" + arg[0] + "_" + arg[1];
			}
			history.replaceState("", "", "#B"+str.substr(1));
		} catch(e) {
			console.error("Could not set URL");
			console.error(e);
		}
	};

	this.read = function() {
	var desc, color;
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
			desc = {
				x:doubleArray[1],
				y:-doubleArray[2],
				w:doubleArray[3],
				iter:intArray[1],
				typeId:byteArray[4],
				smooth:flags&0x1==1
			};
			color = {
				offset:intArray[3]/10000.0,
				density:byteArray.length>32?floatArray[8]:20,
				typeId:byteArray[5],
				resolution:1000,
				buffer:FractalJS.Colormapbuilder().fromId(1000, byteArray[5]),
			};
			return [desc,color];
		} else if (url.startsWith("#B")) {
			var str = url.substr(2);
			var tuples = str.split("&");
			var map = {};
			for (var i in tuples) {
				var tuple = tuples[i].split("_");
				map[tuple[0]] = tuple[1];
			}
			desc = {
				x:parseFloat(map.x),
				y:parseFloat(map.y),
				w:parseFloat(map.w),
				iter:parseInt(map.i),
				typeId:parseInt(map.t),
				smooth:map.fs==1,
			};
			if ("va" in map) {
				desc.viewport = new util.Matrix(parseFloat(map.va),parseFloat(map.vb),
					parseFloat(map.vc),parseFloat(map.vd),0,0);
			}
			color = {
				offset:parseInt(map.co)/100.0,
				density:parseFloat(map.cd),
				typeId:parseInt(map.ct),
				resolution:1000,
				buffer:FractalJS.Colormapbuilder().fromId(1000, parseInt(map.ct)),
			};
			return [desc,color];
		}
	} catch(e) {
		console.error("Could not read URL");
		console.error(e);
	} finally {}
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
var iter, pixelOnP;
var fractalFunction;	// the fractal function used

//-------- private methds

var iLog2 = 1.0 / Math.log(2.0);
var iLog3 = 1.0 / Math.log(3.0);

// core fractal functions
var fractalFunctionListSmooth = {
	0 : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		if (i==iter) return i;
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
			if (++i>=iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		if (i==iter) return i;
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
		cy = -cy; // this fractal is usually represented upside down
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			zny = (zx+zx)*zy+cy;
			znx = sqx-sqy+cx;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			if (++i>=iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		if (i==iter) return i;
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
		for(;i<iter && sqx+sqy<=escape; ++i) {
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
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + 0.15;
			znx = sqx-sqy -0.79;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		if (i==iter) return i;
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
		for(;i<iter && sx+sy<=escape; ++i) {
			xp1 = x*x-y*y+c+p*xm1;
			yp1 = 2*x*y+p*ym1;
			sx = xp1*xp1;
			sy = yp1*yp1;
			xm1=x; ym1=y;
			x=xp1; y=yp1;
		}
		if (i==iter) return i;
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
	// mandelbrot
	0 : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
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
			if (++i>=iter)
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
		cy = -cy; // this fractal is usually represented upside down
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			zny = (zx+zx)*zy+cy;
			znx = sqx-sqy+cx;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			if (++i>=iter)
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
		for(;i<iter && sqx+sqy<=escape; ++i) {
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
		for(;i<iter && sqx+sqy<=escape; ++i) {
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
		for(;i<iter && sx+sy<=escape; ++i) {
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

drawTileOnBuffer: function(tile, model) {
	var frame = tile.frame;
	var dx = 0;
	for (var sy=tile.y1; sy<=tile.y2; sy++) {
		for (var sx=tile.x1; sx<=tile.x2; sx++) {
			var px = sx * model.a + sy * model.c + model.e;
			var py = sx * model.b + sy * model.d + model.f;
			var piter = fractalFunction(px, py);
			if (piter==iter)
				frame[dx++] = 0;
			else
				frame[dx++] = piter;
		}
	}
},

// subsampling with a regular 4*4 grid
drawSuperTileOnBuffer: function(tile, model) {
	var sss = model.pixelOnP/4;
	var frame = tile.frame;
	var dx = 0;
	for (var sy=tile.y1; sy<=tile.y2; sy++) {
		for (var sx=tile.x1; sx<=tile.x2; sx++) {
			var px = sx * model.a + sy * model.c + model.e - model.pixelOnP/2;
			var py = sx * model.b + sy * model.d + model.f - model.pixelOnP/2;
			var itersum = 0;
			for (var ss=0; ss<16; ss++) {
				itersum += fractalFunction(px+(ss/4*sss), py+(ss%4*sss));
			}
			var piter = itersum/16;
			frame[dx++] = piter==iter?0:piter;
		}
	}
},

drawSubTileOnBuffer: function(tile, model) {
	var res = 4;
	var frame = tile.frame;
	var dx, sx, sy;
	for (sy=tile.y1; sy<=tile.y2; sy+=res) {
		dx = (sy-tile.y1)*tile.width;
		for (sx=tile.x1; sx<=tile.x2; sx+=res) {
			var px = sx * model.a + sy * model.c + model.e + (res/2)*pixelOnP;
			var py = sx * model.b + sy * model.d + model.f - (res/2)*pixelOnP;
			var piter = fractalFunction(px, py);
			if (piter==iter)
				frame[dx] = 0;
			else
				frame[dx] = piter;
			dx+=res;
		}
	}
	dx = 0;
	for (sy=0; sy<tile.height; sy++) {
		for (sx=0; sx<tile.width; sx++) {
			if (sy%res===0 && sx%res===0) {
			} else {
				frame[dx]= frame[(sy-sy%res)*tile.width+sx-sx%res];
			}
			dx++;
		}
	}
},

setModel: function(model) {
	pixelOnP = model.pixelOnP;
	iter = model.iter;
	if (model.smooth)
		fractalFunction = fractalFunctionListSmooth[model.typeId];
	else
		fractalFunction = fractalFunctionList[model.typeId];
}

};

//-------- constructor
})({});

onmessage = function(param) {
	var data = param.data;
	if (!data)
		console.error(param);
	if (data.action === "draw") {
		engine.setModel(data.model);
		//console.log("receive DRAW", param)
		if (data.quality==200) engine.drawTileOnBuffer(data.tile, data.model);
		else if (data.quality==100) engine.drawSubTileOnBuffer(data.tile, data.model);
		else if (data.quality==300) engine.drawSuperTileOnBuffer(data.tile, data.model);
		else throw "invalid drawing quality";
		//setTimeout(function() {
		postMessage({
			action:"endTile",
			quality:data.quality,
			tile:param.data.tile,
			frameId:param.data.frameId,
			finished:param.data.finished
		});
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
var typeId = params.typeId;

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
		typeId:typeId,
	};
},

setDesc: function(cmap) {
	//console.log("set ", cmap)
	if (cmap.offset)
		offset = cmap.offset;
	if (cmap.density)
		density = cmap.density;
	if (cmap.typeId)
		typeId = cmap.typeId;
	if (cmap.buffer) {
		buffer = cmap.buffer;
		resolution = cmap.buffer.length;
	}
}

};

};


; FractalJS.Renderer = function(fractal, model) {
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
var vectorCanvas;

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

var workers = [];

//-------- public methods

this.resize = function() {
	// resize temp buffers
	imageData = context.createImageData(canvas.width, canvas.height);
	idata32 = new Uint32Array(imageData.data.buffer);
  vectorCanvas = document.createElement('canvas');
  vectorCanvas.width = canvas.width;
  vectorCanvas.height = canvas.height;

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
  this.draw("supersampling", null, lastvector, 300);
};

this.draw = function(reason, vector, priovector, quality) {
  //console.log("start frae", reason)
  //throw "stack"
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
		vectorCanvas.getContext("2d").putImageData(imageData, 0, 0);
		if (vector.matrix) {
			context.translate(model.camera.width/2,model.camera.height/2);
			context.transform(vector.matrix.a, vector.matrix.b, vector.matrix.c, vector.matrix.d, vector.matrix.e, vector.matrix.f);
			context.translate(-model.camera.width/2,-model.camera.height/2);
		} else {
			context.scale(vector.z, vector.z);
			context.translate(vector.x, vector.y);
		}
		context.drawImage(vectorCanvas,0,0);
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
    // if this is an initialisation drawing, stars with a low quality 16x subsampling
    if (reason=="init")
      drawList.push({action:'draw', quality:100, frameId:frameId, tile:tile});
    drawList.push({action:'draw', quality:quality, frameId:frameId, tile:tile});
	}

  // prioritize tiles according to movement
  drawList.sort(function(t1,t2){
    if (t1.quality!=t2.quality)
      return t1.quality-t2.quality;
    if (vector) {
      if (vector.mvt=="pan")
        return t2.tile.prio - t1.tile.prio;
      if (vector.mvt=="zoomin")
        return t1.tile.dist - t2.tile.dist;
      if (vector.mvt=="zoomout")
        return t2.tile.dist - t1.tile.dist;
    }
    return t1.tile.id-t2.tile.id;
  });

	// dispatch first items of the drawList to all workers
	for (var w in workers) {
		var drawOrder = drawList.shift();
		if (drawOrder) {
			drawOrder.model = model.getWorkerModel();
			workers[w].postMessage(drawOrder);
		}
	}

};

//-------- private methods

var endOfFrame = function() {
	var endFrameMs = performance.now();
	events.send("frame.end", function() {
		return {
			time: endFrameMs-startFrameMs,
			data:{
				lastquality:lastquality,
			}
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
	var fringe10p = model.iter - Math.ceil(iterRange/10);
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
		model.iter = Math.round(model.iter*1.5);
		that.draw();
		events.send("iter.change");
	} else {
    setTimeout(function() {that.refine();},1000);
  }
	if (percInSet > 1 && percFringe10p<0.2) {
		model.iter = Math.round(model.iter/1.5);
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

this.workerMessage = function(param) {
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
			var drawOrder = drawList.shift();
			if (drawList.length===0) {
				drawOrder.finished=true;
			}
      drawOrder.model = model.getWorkerModel();
			param.target.postMessage(drawOrder);
		}

		// this mechanism looks fragile...
		if (param.data.finished)
			endOfFrame();
	} else {
    throw "Unknown message";
  }
};

for (var i=0; i<nbOfThreads; i++) {
	var worker = FractalJS.EngineWorker();
	workers.push(worker);
	worker.onmessage=this.workerMessage;
}

 this.resize();

};
;/*
 * The controller:
 * - capture events related to the canvas and modify the view accordingly
 * - loads the URL parameters and updates the URL in relatime
 */
FractalJS.Controller = function(fractal, model) {
"use strict";

//-------- private members

var ZOOM  = 0.3; // 1+
var SCALE = 0.1; // 1+
var SHEAR = 0.1;
var ANGLE = Math.PI/18;
var PAN   = 0.095;

var isDragging;			// is the user dragging ?
var dragX, dragY;		// start dragging point
var ldragX, ldragY;		// last dragging point
var camStart;			// start camera

//-------- shortcuts

var canvas = fractal.params.canvas;
var params = fractal.params.controller;
var events = fractal.events;
var camera = model.camera;
var util = FractalJS.util;

//-------- public members

this.url = new FractalJS.Url(model, fractal);

//-------- event catchers

/*
 * This section of code manipulates a lot of geometry on both the screen space and
 * complex. Some conventions help to make te code readable:
 *   v : vector
 *   p : point
 *   s : screen space
 *   c : complex space
 */

// transforms the viewport
var transformViewport = function(type, value) {
	var matrix = model.camera.transformViewport(type, value);
	fractal.draw("user.control", {matrix:matrix});
	events.send("user.control");
};

// pan the screen by the given ration of its resolution
var pan = function(ratiox, ratioy) {
	var vsx = ratiox * camera.width, vsy = -ratioy * camera.height;
	var pc1 = camera.S2C(0,0), pc2 = camera.S2C(vsx,vsy); // [pc1,pc2] is the movement vector on C
	camera.setXYW(camera.x - (pc2.x - pc1.x), camera.y - (pc2.y - pc1.y));
	fractal.draw("user.control",{x:vsx,y:vsy,mvt:"pan"});
	events.send("user.control");
};

// zoom the screen at the given screen point, using the given delta ratio
var zoom = function(psx, psy, delta) {
	// test if we're at the maximum possible resolution (1.11e-15/pixel)
	var extent = Math.min(camera.width, camera.height);
	var limit = extent*1.11e-15;
	if (camera.w<=limit && delta < 1) {
		events.send("zoom.limit.reached");
		return;
	}

	var pc00 = camera.S2C(0,0);
	var pc = camera.S2C(psx,psy);				// complex point under mouse
	var vc = {x:camera.x-pc.x, y:camera.y-pc.y};   // vector to complex point at center
	camera.setXYW(pc.x+vc.x*delta, pc.y+vc.y*delta, camera.w*delta); // adjust camera using scaled vector
	var ps00A = camera.C2S(pc00.x,pc00.y);

	var vector = {x:ps00A.x*delta, y:ps00A.y*delta, z:1/delta, mvt:delta<1?"zoomin":"zoomout", sx:psx,sy:psy};
	fractal.draw("user.control",vector);
	events.send("user.control");
};

if (params.touchControl && util.is_touch_device()) {
	// lazy loading of hammer.js library only if required
	console.log("loading touch events library and code");
	util.loadJs("libs/hammerjs/hammer.min.js", function() {
		var hammertime = new Hammer(canvas, {});
		hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold:1 });
		hammertime.get('pinch').set({ enable: true });

		hammertime.on('panstart', function(ev) {
			isDragging = true;
			dragX = ldragX = ev.center.x;
			dragY = ldragY = ev.center.y;
			camStart = model.camera.clone();
		});

		hammertime.on('panend', function(ev) {
			isDragging = false;
		});

		hammertime.on('panmove', function(ev) {
			console.log('panmove');
			if (isDragging) {
				var vsx = ev.center.x - dragX; // since beginning
				var vsy = ev.center.y - dragY;
				var pc1 = camStart.S2C(0,0), pc2 = camStart.S2C(vsx,vsy); // [pc1,pc2] is the movement vector on C
				camera.setXYW(camStart.x - (pc2.x - pc1.x), camStart.y - (pc2.y - pc1.y));
				var vsxr = ev.center.x - ldragX; // relative to last frame
				var vsyr = ev.center.y - ldragY;
				fractal.draw("user.control",{x:vsxr,y:vsyr,mvt:"pan"});
				events.send("user.control");
				ldragX = ev.center.x;
				ldragY = ev.center.y;
			}
		});

		var isPinching = false;
		var pinchX, pinchY;		// start dragging point
		var lastScale;

		hammertime.on('pinchstart', function(ev) {
			console.log("pinchstart");
			isPinching = true;
			pinchX =  ev.center.x;
			pinchY =  ev.center.y;
			lastScale = 1;
			camStart = model.camera.clone();
		});

		hammertime.on('pinchend', function(ev) {
			console.log("pinchend");
			isPinching = false;
		});

		hammertime.on('pinch', function(ev) {
			if (isPinching) {
				var delta = lastScale/ev.scale;
				var pc00 = camera.S2C(0,0);

				// compute matrix that transforms an original triangle to the transformed triangle
				var pc1 = camStart.S2C(pinchX, pinchY);
				var pc2 = camStart.S2C(ev.center.x, ev.center.y);
				var m = util.Matrix.GetTriangleToTriangle(
					pc1.x, pc1.y, pc1.x+1,        pc1.y, pc1.x, pc1.y+1,
					pc2.x, pc2.y, pc2.x+ev.scale, pc2.y, pc2.x, pc2.y+ev.scale);

				// apply inverse of this matrix to starting point
				var pc0A = m.inverse().applyTo(camStart.x, camStart.y);
				camera.setXYW(pc0A.x, pc0A.y, camStart.w/m.a);

				var ps00A = camera.C2S(pc00.x,pc00.y);
				var vector = {x:ps00A.x*delta, y:ps00A.y*delta, z:1/delta, mvt:delta<1?"zoomin":"zoomout", sx:ev.center.x,sy:ev.center.y};
				fractal.draw("user.control", vector);
				events.send("user.control");

				lastScale = ev.scale;
			}
		});
	});
}

var keymap = [];
if (params.keyboardControl) {
	document.onkeyup = function(e) {
	    e = e || window.event;
	    keymap[e.keyCode] = false;
	};
	document.onkeydown = function(e) {
	    e = e || window.event;
	    keymap[e.keyCode] = true;
	    var keyCode = (typeof e.which == "number") ? e.which : e.keyCode;
	    var modifier = 1;
	    if (e.getModifierState("Shift")) modifier = 1/10;
		switch (keyCode) {
			case 107: zoom(canvas.width/2, canvas.height/2, 1/(1+ZOOM*modifier)); break; // key +, zoom in
			case 109: zoom(canvas.width/2, canvas.height/2, 1+ZOOM*modifier); break;  // key -, zoom out
			case 86 : // key V, reset viewport
				camera.resetViewport();
				fractal.draw("init");
				events.send("user.control");
				break;
			case 37: // left arrow
				if (keymap[82]===true) // R
					transformViewport("rotate", -ANGLE*modifier);
				else if (keymap[83]===true) // S
					transformViewport("scaleX", 1+SCALE*modifier);
				else if (keymap[72]===true) // H
					transformViewport("shearX", SHEAR*modifier);
				else
					pan(PAN*modifier, 0);
				break;
			case 39: // right arrow
				if (keymap[82]===true) // R
					transformViewport("rotate", ANGLE*modifier);
				else if (keymap[83]===true) // S
					transformViewport("scaleX", 1/(1+SCALE*modifier));
				else if (keymap[72]===true) // H
					transformViewport("shearX", -SHEAR*modifier);
				else
					pan(-PAN*modifier, 0);
				break;
			case 38: // up arrow
				if (keymap[83]===true) // S
					transformViewport("scaleY", 1/(1+SCALE*modifier));
				else if (keymap[72]===true) // H
					transformViewport("shearY", -SHEAR*modifier);
				else
					pan(0, -PAN*modifier);
				break;
			case 40: // down arrow
				if (keymap[83]===true) // S
					transformViewport("scaleY", 1+SCALE*modifier);
				else if (keymap[72]===true) // H
					transformViewport("shearY", SHEAR*modifier);
				else
					pan(0, PAN*modifier);
				break;
		}
	};
}

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
		camStart = model.camera.clone();
	};

	window.addEventListener("mouseup", function(e) {
		if (!e) e = window.event;
		isDragging = false;
	});

	window.addEventListener("mousemove", function(e) {
		if (!e) e = window.event;
		if (isDragging) {
			var vsx = e.screenX - dragX; // since beginning
			var vsy = e.screenY - dragY;
			var pc1 = camStart.S2C(0,0), pc2 = camStart.S2C(vsx,vsy); // [pc1,pc2] is the movement vector on C
			camera.setXYW(camStart.x - (pc2.x - pc1.x), camStart.y - (pc2.y - pc1.y));
			var vsxr = e.screenX - ldragX; // relative to last frame
			var vsyr = e.screenY - ldragY;
			fractal.draw("user.control",{x:vsxr,y:vsyr,mvt:"pan"});
			events.send("user.control");
			ldragX = e.screenX;
			ldragY = e.screenY;
		}
	});


	var wheelFunction = function(e) {
		if (!e) e = window.event;
		e.preventDefault();
		var modifier = e.shiftKey?1/10:1;
		var delta = e.deltaY || e.wheelDelta; // IE11 special
		zoom(e.clientX, e.clientY, delta>0?1+ZOOM*modifier:1/(1+ZOOM*modifier));
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
	model.resize();
	window.onresize = function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		fractal.resize();
		fractal.draw("init");
	};
}

//-------- constructor & jquery callbacks

events.on("iter.change", this.url.update);
events.on("user.control", this.url.update);
events.on("api.change", this.url.update);

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
		keyboardControl : true,		// allow keyboard navigation in canvas
		fitToWindow : false,		// fit the canvas to the window
	}
}

 */
FractalJS.create = function(params) {
"use strict";

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

var model = new FractalJS.Model(params.canvas);

// define default values
params.renderer = util.defaultProps(params.renderer, {
	numberOfTiles: 1,
	drawAfterInit: true
});
params.controller = util.defaultProps(params.controller, {
	mouseControl: true,
	keyboardControl: true,
	touchControl: true,
	fitToWindow: false
});

// instanciate controller, read and set URL
controller = new FractalJS.Controller(this, model);
var urlParams = controller.url.read();
if (urlParams) {
	params.fractalDesc = urlParams[0];
	params.colorDesc = urlParams[1];
}

model.setFractalDesc(params.fractalDesc);

// define default palette if not set
if (!params.colorDesc) {
	params.colorDesc = {typeId:0, resolution:1000, buffer:FractalJS.Colormapbuilder().fromId(1000, 0)};
}

// instanciate renderer and set startup params
renderer = new FractalJS.Renderer(this, model);
renderer.setColorDesc(params.colorDesc);

// draw if required
if (params.renderer.drawAfterInit)
	renderer.draw("init");

//-------- public API

this.setFractalDesc = function (desc) {
	if ("x" in desc)
		model.camera.setXYW(desc.x, desc.y, desc.w);
	if ("iter" in desc)
		model.iter = desc.iter;
	if ("typeId" in desc)
		model.typeId = desc.typeId;
	if ("smooth" in desc)
		model.smooth = desc.smooth;
};

this.resetViewport = function (desc) {
	model.camera.resetViewport();
};

this.getModel = function () {
	return model;
};

this.draw= function(reason,vector) {
	renderer.draw(reason,vector);
};

this.resize= function() {
	model.resize();
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
