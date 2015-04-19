define(["jquery", "palette.ui"], 
function($, PaletteUi) {
"use strict";

/*
 * The fractal UI:
 */
return function(fractal) {

//-------- private members

// presets for fractal type
var typeList = {
	"mandel" : {
		type:'mandel',
		x:-0.7, 
		y:0.0, 
		w:2.5, 
		i:50
	},
	"mandel3" : {
		type:'mandel3',
		x:0.0, 
		y:0.0, 
		w:3.0, 
		i:50
	},
	"burningship" : {
		type:'burningship',
		x:-0.2, 
		y:-0.7, 
		w:2.5, 
		i:50
	}
};

var paletteui = new PaletteUi(
	fractal, 
	fractal.getPalette(), 
	document.getElementById("palettecanvas"));

//-------- jquery callbacks

// PANELS

$(".menuitem").click(function(e) {
	var selected = $(this).hasClass("selected");
	$(".menuitem").removeClass("selected");
	$(".pane").addClass("hidden");
	if (selected) {
		$(this).removeClass("selected");
	} else {
		var menuName = $(this).attr("menu-name");
		$(this).addClass("selected");
		var pane = $(".pane[menu-name='"+menuName+"']");
		pane.removeClass("hidden");
		if (menuName=="color")
			paletteui.resize()
	}
});

// FRACTAL TYPE buttons 

var desc = fractal.getFractalDesc();
$(".changetype[type-name='"+desc.type+"']").addClass("selected");

$(".changetype").click(function(e) {
	var type = $(this).attr("type-name");
	fractal.setFractalDesc(typeList[type]);
	fractal.draw();
	$(".changetype").removeClass("selected");
	$(".changetype[type-name='"+type+"']").addClass("selected");
});

fractal.on("mouse.control", function(e) {
	// make the fractal type menu disappear on mouse control
	if ($(".menuitem[menu-name='type']").hasClass("selected")) {
		$(".menuitem").removeClass("selected");
		$(".pane").addClass("hidden");
	}
});


//-------- private methods

//-------- public methods

return {


};

};
});