define([
	"renderer", 
	"controller", 
	"util"], 
function(Renderer, Controller, util) {
"use strict";

/*
 * The main fractal module:
 * - receives one single object describing a fractal to display/manipulate
 * - provides additional methods and callbacks
 * - configuration object:

{
    canvas : <DOM canvas node>		// mandatory canvas
    fractalDesc	: <JSON object>		// mandatory fractal description (see engine.js)
    palette : {
		stops : [
			{index:0,r:0,g:0,b:0},
			{index:0.5,r:255,g:255,b:255},
		],
		resolution : 100
    }
    renderer : {
		numberOfTiles : 1,			// number of tiles to draw (approximate)
    },
	controller : {
		mouseControl : true,		// allow mouse navigation in canvas
		fitToWindow : false,		// fit the canvas to the window
	}    
}

 */
return function(params) {

//-------- private members

var renderer, controller;

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
		resolution : 100
    };

params.renderer = util.defaultProps(params.renderer, {
	numberOfTiles: 1,
});

params.controller = util.defaultProps(params.controller, {
	mouseControl: true,
	fitToWindow: false
});

renderer = new Renderer(params);

controller = new Controller(renderer, params.canvas, params.controller);

renderer.draw();

//-------- private methods


//-------- public methods

return {

setFractalDesc: function (desc) {
	var res = renderer.setFractalDesc(desc);
	return res;
},

getFractalDesc: function () {
	return renderer.getFractalDesc();
},

draw: function() {
	renderer.draw();
},

on: function(event, callback) {
	if (event=="frame.end" || event=="frame.start" )
		renderer.on(event, callback);
	else
		throw "Unknown event " + event;
}

};

};
});