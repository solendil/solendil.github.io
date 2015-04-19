define(["jquery"], function($) {
"use strict";

/*
 * The controller:
 * - capture events related to the canvas and modify the view accordingly
 */
return function(renderer, canvas, params) {

//-------- private members

var zoomFactor = 1.3;

var isDragging;			// is the user dragging ?
var dragX, dragY;		// start dragging point
var dragStartDesc;		// start fractal desc
var ldragX, ldragY;		// last dragging point

//-------- event catchers

if (params.mouseControl) {
	$(canvas).mousedown(function(e) {
		isDragging = true;
		dragX = ldragX = e.screenX;
		dragY = ldragY = e.screenY;
		dragStartDesc = renderer.getFractalDesc();
	});

	$(window).mouseup(function(e) {
		isDragging = false;
	});

	$(window).mousemove(function(e) {
		if (isDragging) {
			var vecx = e.screenX-dragX;
			var vecy = e.screenY-dragY;
			var vecpx = vecx*dragStartDesc.pixelOnP;
			var vecpy = vecy*dragStartDesc.pixelOnP;
			var c = {x:dragStartDesc.x-vecpx, y:dragStartDesc.y-vecpy};
			renderer.setFractalDesc(c);

	        var vfx = e.screenX - ldragX;
	        var vfy = e.screenY - ldragY;           
			renderer.draw({x:vfx,y:vfy,mvt:"pan"});

	        ldragX = e.screenX;
	        ldragY = e.screenY;
		}
	});

	$(canvas).bind('wheel', function(e){
		var mousex = e.originalEvent.offsetX;
		var mousey = e.originalEvent.offsetY;

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

	    if(e.originalEvent.wheelDelta > 0) {
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
	});
}

if (params.fitToWindow) {
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	renderer.resize();
	$(window).resize(function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		renderer.resize();
		renderer.draw();
	});
}

//-------- private methods


//-------- public methods

return {

};

};
});