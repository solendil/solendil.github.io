define(["jquery"], 
function($) {
"use strict";

/*
 * The fractal UI:
 */
return function(f) {

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
	}
});

// FRACTAL TYPE buttons 

var desc = f.getFractalDesc();
$(".changetype[type-name='"+desc.type+"']").addClass("selected");

$(".changetype").click(function(e) {
	var type = $(this).attr("type-name");
	f.setFractalDesc(typeList[type]);
	f.draw();
	$(".changetype").removeClass("selected");
	$(".changetype[type-name='"+type+"']").addClass("selected");
});

f.on("mouse.control", function(e) {
	// make the fractal type menu disappear on mouse control
	if ($(".menuitem[menu-name='type']").hasClass("selected")) {
		$(".menuitem").removeClass("selected");
		$(".pane").addClass("hidden");
	}
});

// DEBUG text

f.on("frame.start", function(e) {
	var text = 
		"x:"+e.fractalDesc.x+"<br />"+
		"y:"+e.fractalDesc.y+"<br />"+
		"w:"+e.fractalDesc.w+"<br />";
	$(".debugtext").html(text);
});

//-------- private methods

//-------- public methods

return {


};

};
});