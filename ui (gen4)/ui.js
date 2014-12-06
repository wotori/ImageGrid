/**********************************************************************
* 
*
*
**********************************************************************/

window.nodejs = (typeof(process) === 'object' && process.features.uv) 
	? {
		require: window.require,
	} 
	: null


define(function(require){ var module = {}
console.log('>>> ui')

//var DEBUG = DEBUG != null ? DEBUG : true

var keyboard = require('lib/keyboard')
var doc = keyboard.doc

// compatibility...
var browser = require('browser')
var nw = require('nw')

// XXX load only the actualy used here modules...
var actions = require('actions')
var data = require('data')
var ribbons = require('ribbons')


// XXX 
var testing = require('testing')


var client = require('client')

var viewer = require('viewer')



/*********************************************************************/

// XXX add this to the global doc...
module.GLOBAL_KEYBOARD = {
	'Global bindings': {
		doc: 'NOTE: binding priority is the same as the order of sections '+
			'on this page.',
		pattern: '*',

		F4: {
			alt: 'close',
			/*
			alt: doc('Close viewer', 
				function(){ 
					window.close() 
					return false
				}),
			*/
		},
		F5: doc('Full reload viewer', 
			function(){ 
				/*
				killAllWorkers()
					.done(function(){
						reload() 
					})
				*/
				location.reload()
				return false
			}),
		F12: 'showDevTools',
		// NOTE: these are for systems where F** keys are not available 
		// 		or do other stuff...
		R: {
			default: 'rotateCW',
			shift: 'reverseImages',
			ctrl: 'reload!',
			'ctrl+shift': 'F5',
		},
		L: 'rotateCCW',
		H: 'flipHorizontal',
		V: 'flipVertical',
		P: {
			'ctrl+shift': 'F12',
		},

		// NOTE: this is handled by the wrapper at this point, so we do 
		// 		not have to do anything here...
		F11: 'toggleFullScreen', 
		F: {
			ctrl: 'F11',
		},

		// XXX testing...

		Enter: 'toggleSingleImage',

		Home: {
			default: 'firstImage',
			ctrl: 'firstGlobalImage',
			shift: 'firstRibbon',
		},
		End: {
			default: 'lastImage',
			ctrl: 'lastGlobalImage',
			shift: 'lastRibbon',
		},
		Left: {
			default: 'prevImage',
			alt: 'shiftImageLeft!',
			ctrl: 'prevScreen',
		},
		PgUp: 'prevScreen',
		PgDown: 'nextScreen',
		Right: {
			default: 'nextImage',
			alt: 'shiftImageRight!',
			ctrl: 'nextScreen',
		},
		'(': 'prevImageInOrder',
		')': 'nextImageInOrder',
		',': 'prevMarked',
		'.': 'nextMarked',
		'[': 'prevBookmarked',
		']': 'nextBookmarked',
		Up: {
			default: 'prevRibbon',
			shift: 'shiftImageUp',
			'ctrl+shift': 'shiftImageUpNewRibbon',
		},
		Down: {
			default: 'nextRibbon',
			shift: 'shiftImageDown',
			'ctrl+shift': 'shiftImageDownNewRibbon',
		},

		'#0': 'fitMax',
		'#1': {
			default: 'fitImage',
			shift: 'fitRibbon',
			ctrl: 'fitOrig!',
		},
		'#2': 'fitImage: 2',
		'#3': {
			default: 'fitImage: 3',
			shift: 'fitRibbon: 3.5',
		},
		'#4': 'fitImage: 4',
		'#5': {
			default: 'fitImage: 5',
			shift: 'fitRibbon: 5.5',
		},
		'#6': 'fitImage: 6',
		'#7': 'fitImage: 7',
		'#8':'fitImage: 8',
		'#9': 'fitImage: 9',
		
		'+': 'zoomIn',
		'=': '+',
		'-': 'zoomOut',

		F2: {
			default: 'cropRibbon',
			shift: 'cropRibbonAndAbove',
			ctrl: 'cropMarked',
			alt: 'cropBookmarked',
		},
		Esc: {
			default: 'uncrop',
			ctrl: 'uncropAll',
		},

		// marking...
		M: {
			default: 'toggleMark',
		},
		A: {
			ctrl: 'toggleMark!: "ribbon" "on"',
		},
		D: {
			ctrl: 'toggleMark!: "ribbon" "off"',
		},
		I: {
			ctrl: 'toggleMark!: "ribbon"',
		},
		
		B: {
			default: 'toggleBookmark',
			ctrl: 'toggleTheme!',
		},
	},
}	




/*********************************************************************/

$(function(){

	// XXX
	window.a = testing.setupActions()
		.load({
			viewer: $('.viewer')
		})


	// XXX for some reason this is not visible when loading...
	a.setEmptyMsg('Loading...')


	viewer.ImageGridFeatures.setup(a, [
		// features...
		'ui-ribbon-align-to-order',
		'ui-single-image-view',

		'fs-loader',
		'app-control',

		// ui elements...
		'image-marks',
		'image-bookmarks',

		'ui-partial-ribbons',
		// chrome...
		'ui-animation',
		'ui-bounds-indicators',
		'ui-current-image-indicator',
			// NOTE: only one of these can be set...
			'ui-current-image-indicator-hide-on-fast-screen-nav',
			//'ui-current-image-indicator-hide-on-screen-nav',
		'ui-image-state-indicator',
		'ui-global-state-indicator',

		// experimental and optional features...
		//'auto-single-image',
	])

	// this publishes all the actions...
	//module.GLOBAL_KEYBOARD.__proto__ = a

	// load some testing data...
	// NOTE: we can load this in parts...
	a.load({
		//viewer: $('.viewer'),
		data: data.Data(testing.mock_data),
		images: testing.makeTestImages(),
	})


	a.setEmptyMsg(
		'Nothing loaded...',
		'Press \'O\' to load, \'F1\' for help or \'?\' for keyboard mappings.')


	// setup base keyboard for devel, in case something breaks...
	$(document)
		.keydown(
			keyboard.makeKeyboardHandler(
				module.GLOBAL_KEYBOARD,
				function(k){
					window.DEBUG && console.log(k)
				}, 
				a))
})



/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
return module })
