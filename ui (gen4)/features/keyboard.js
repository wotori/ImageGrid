/**********************************************************************
* 
*
*
**********************************************************************/
((typeof define)[0]=='u'?function(f){module.exports=f(require)}:define)
(function(require){ var module={} // make module AMD/node compatible...
/*********************************************************************/

var actions = require('lib/actions')
var features = require('lib/features')
var toggler = require('lib/toggler')
// XXX
var keyboard = require('lib/keyboard2')

var core = require('features/core')
var widgets = require('features/ui-widgets')

var widget = require('lib/widget/widget')
var browse = require('lib/widget/browse')
var overlay = require('lib/widget/overlay')
var drawer = require('lib/widget/drawer')



/*********************************************************************/

var GLOBAL_KEYBOARD =
module.GLOBAL_KEYBOARD2 = {
	'Global': {
		doc: 'Global bindings that take priority over other sections.',
		pattern: '*',

	},

	'Slideshow': {
		pattern: '.slideshow-running',
		drop: [
			'Esc',
			'Up', 'Down', 'Enter',
			'R', 'L', 'G', 'T',
		],

		Esc: 'toggleSlideshow: "off" -- Exit slideshow',
		Enter: 'slideshowDialog',

		Left: 'resetSlideshowTimer',
		Right: 'resetSlideshowTimer',
		Home: 'resetSlideshowTimer',
		End: 'resetSlideshowTimer',

		T: 'slideshowIntervalDialog',
		R: 'toggleSlideshowDirection',
		L: 'toggleSlideshowLooping',
	},

	// XXX do we need to prevent up/down navigation here, it may get confusing?
	// XXX do we need to disable fast sorting here???
	'Single Image': {
		pattern: '.single-image-mode',
		drop: [
			'Esc',

			// do not crop in single image mode...
			'C', 'F2',

			// zooming...
			'#0', '#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9',
		],


		// handle in next section...
		'(': 'NEXT_SECTION',
		')': 'NEXT_SECTION',

		// zooming...
		'#1': 'fitScreen',
		// XXX should these also be implemented in the same way as 4-9???
		'#2': 'fitNormal',
		'alt+#2': 'setNormalScale -- Set current image size as normal',
		'ctrl+shift+#2': 'setNormalScale: null -- Reset normal image size to default',
		'#3': 'fitSmall',
		'alt+#3': 'setSmallScale -- Set current image size as small',
		'ctrl+shift+#3': 'setSmallScale: null -- Reset small image size to default',

		// NOTE: these are the same, the only difference is the number...
		'#4': 'fitCustom: 4 -- Set cutom image size',
		'alt+#4': 'setCustomSize: 4 -- Set current image size as custom',
		'ctrl+shift+#4': 'setCustomSize: 4 null -- Clear custom image size',

		'#5': 'fitCustom: 5 -- Set cutom image size',
		'alt+#5': 'setCustomSize: 5 -- Set current image size as custom',
		'ctrl+shift+#5': 'setCustomSize: 5 null -- Clear custom image size',

		'#6': 'fitCustom: 6 -- Set cutom image size',
		'alt+#6': 'setCustomSize: 6 -- Set current image size as custom',
		'ctrl+shift+#6': 'setCustomSize: 6 null -- Clear custom image size',

		'#7': 'fitCustom: 7 -- Set cutom image size',
		'alt+#7': 'setCustomSize: 7 -- Set current image size as custom',
		'ctrl+shift+#7': 'setCustomSize: 7 null -- Clear custom image size',

		'#8': 'fitCustom: 8 -- Set cutom image size',
		'alt+#8': 'setCustomSize: 8 -- Set current image size as custom',
		'ctrl+shift+#8': 'setCustomSize: 8 null -- Clear custom image size',

		'#9': 'fitCustom: 9 -- Set cutom image size',
		'alt+#9': 'setCustomSize: 9 -- Set current image size as custom',
		'ctrl+shift+#9': 'setCustomSize: 9 null -- Clear custom image size',

		'#0': 'fitCustom: 0 -- Set cutom image size',
		'alt+#0': 'setCustomSize: 0 -- Set current image size as custom',
		'ctrl+shift+#0': 'setCustomSize: 0 null -- Clear custom image size',

		Esc: 'toggleSingleImage: "off" -- Exit single image view',

		// ignore sorting and reversing...
		// XXX not sure about these yet, especially reversing...
		shift_R: 'DROP',
		shift_S: 'DROP',
	},

	// XXX add "save as collection..."
	'Cropped': {
		pattern: '.crop-mode',

		Esc: 'uncrop',
		ctrl_Esc: 'uncropAll',
	},

	'Range': {
		doc: 'Range editing',
		pattern: '.brace',

		// XXX add:
		// 		- range navigation
		// 		- range manipulation

		Esc: 'clearRange',
	},

	// XXX add "save as collection..." (???)
	// XXX cleanup...
	'Viewer': {
		doc: 'NOTE: binding priority is the same as the order of sections '+
			'on this page.',
		pattern: '*',

		alt_X: 'close',
		alt_F4: 'close',
		meta_Q: 'close',

		// XXX
		F5: keyboard.doc('Full reload viewer', 
			function(){ 
				//a.stop()
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
		meta_alt_I: 'F12',
		ctrl_shift_p: 'F12',


		// dialogs...
		// XXX should this be all here or in respective sections???
		alt_A: 'browseActions',

		//alt_S: 'browseActions: "/Sort/"',
		alt_shift_A: 'listActions',


		// open/save...
		O: 'browsePath',
		ctrl_S: 'saveIndexHere',
		ctrl_shift_S: 'exportDialog',


		// external editors...
		// XXX not sure if this is the right way to go...
		E: 'openInExtenalEditor',
		shift_E: 'openInExtenalEditor: 1 -- Open in alternative editor',
		alt_E: 'listExtenalEditors',


		// history...
		ctrl_H: 'listURLHistory',
		ctrl_shift_H: 'listSaveHistory',

		U: 'undo',
		ctrl_Z: 'undo',
		shift_U: 'redo',
		ctrl_shift_Z: 'redo',
		alt_H: 'browseActions: "/History/" -- Open history menu',


		// tilt...
		// XXX experimental, not sure if wee need this with a keyboard...
		T: 'rotateRibbonCCW -- Tilt ribbons counter clock wise',
		shift_T: 'rotateRibbonCW -- Tilt ribbons clock wise',
		alt_T: 'resetRibbonRotation -- Reset ribbon tilt',


		// NOTE: this is handled by the wrapper at this point, so we do 
		// 		not have to do anything here...
		F11: 'toggleFullScreen', 
		ctrl_F: 'F11',
		meta_F: 'F11',

		ctrl_R: 'loadNewImages!',
		ctrl_alt_R: 'reload!',
		ctrl_shift_R: 'F5',


		// modes... 
		Enter: 'toggleSingleImage',
		S: 'slideshowDialog',


		// statusbar...
		shift_I: 'toggleStatusBar',
		G: 'editStatusBarIndex!',
		shift_G: 'toggleStatusBarIndexMode!',


		// theme...
		ctrl_R: 'toggleTheme!',
		ctrl_shift_R: 'toggleTheme!: "prev"',
		'ctrl+-': 'darkerTheme!',
		'ctrl++': 'lighterTheme!',


		// navigation...
		Left: 'prevImage',
		Backspace: 'Left',
		Right: 'nextImage',
		Space: 'Right',

		'(': 'prevImageInOrder',
		')': 'nextImageInOrder',

		PgUp: 'prevScreen',
		ctrl_Left: 'prevScreen',
		// XXX need to prevent default on mac + browser...
		meta_Left: 'prevScreen',

		PgDown: 'nextScreen',
		ctrl_Right: 'nextScreen',
		// XXX need to prevent default on mac + browser...
		meta_Right: 'nextScreen',

		Home: 'firstImage',
		ctrl_Home: 'firstGlobalImage',
		shift_Home: 'firstRibbon',
		End: 'lastImage',
		ctrl_End: 'lastGlobalImage',
		shift_End: 'lastRibbon',

		Up: 'prevRibbon',
		Down: 'nextRibbon',


		// shifting...
		shift_Up: 'shiftImageUp',
		alt_shift_Up: 'travelImageUp',
		ctrl_shift_Up: 'shiftImageUpNewRibbon',

		shift_Down: 'shiftImageDown',
		alt_shift_Down: 'travelImageDown',
		ctrl_shift_Down: 'shiftImageDownNewRibbon',

		alt_Left: 'shiftImageLeft!',
		alt_Right: 'shiftImageRight!',

		shift_R: 'setBaseRibbon',


		// editing...
		R: 'rotateCW',
		L: 'rotateCCW',
		H: 'flipHorizontal',
		V: 'flipVertical',


		// ribbon image stuff...
		alt_I: 'browseActions: "/Image/" -- Show image menu',
		alt_R: 'browseActions: "/Ribbon/" -- Open ribbon menu',


		// ranges...
		// XXX experimental
		// XXX add border jumping to Home/End...
		'{': 'openRange',
		'}': 'closeRange',
		'*': 'setRangeBorder',


		// zooming...
		'+': 'zoomIn',
		'=': '+',
		'-': 'zoomOut',
		'_': '-',

		'#0': 'fitMax',
		'#1': 'fitImage',
		'shift+#1': 'fitRibbon',
		'ctrl+#1': 'fitOrig!',
		'#2': 'fitImage: 2 -- Fit 2 Images',
		'#3': 'fitImage: 3 -- Fit 3 images',
		'shift+#3': 'fitRibbon: 3.5 -- Fit 3.5 ribbons',
		'#4': 'fitImage: 4 -- Fit 4 images',
		'#5': 'fitImage: 5 -- Fit 5 images',
		'shift+#5': 'fitRibbon: 5.5 -- Fit 5.5 ribbons',
		'#6': 'fitImage: 6 -- Fit 6 images',
		'#7': 'fitImage: 7 -- Fit 7 images',
		'#8':'fitImage: 8 -- Fit 8 images',
		'#9': 'fitImage: 9 -- Fit 9 images',
		

		// cropping...
		F2: 'cropRibbon',
		shift_F2: 'cropRibbonAndAbove',
		ctrl_F2: 'cropMarked',
		alt_F2: 'cropBookmarked',
		C: 'browseActions: "/Crop/" -- Show crop menu',


		// metadata...
		I: 'showMetadata',
		ctrl_shift_I: 'showMetadata: "current" "full" -- Show full metadata',


		// marking...
		M: 'toggleMark',
		ctrl_A: 'toggleMark!: "ribbon" "on" -- Mark all images in ribbon',
		ctrl_D: 'toggleMark!: "ribbon" "off" -- Unmark all images in ribbon',
		ctrl_I: 'toggleMark!: "ribbon" -- Invert marks in ribbon',
		',': 'prevMarked',
		'.': 'nextMarked',
		alt_M: 'browseActions: "/Mark/" -- Show mark menu',


		// bookmarking...
		B: 'toggleBookmark',
		'[': 'prevBookmarked',
		']': 'nextBookmarked',
		alt_B: 'browseActions: "/Bookmark/" -- Show bookmark menu',



		// copy/paste...
		// do the default copy thing...
		// NOTE: this stops the default: handler from getting the ctrl:
		// 		key case...
		ctrl_C: '',
		ctrl_V: '',


		// sort...
		//shift_S: 'sortImages: "Date" -- Sort images by date',
		shift_S: 'sortImages -- Sort images',
		// XXX need to make this save to base_path if it exists and
		// 		ask the user if it does not... now it always asks.
		shift_R: 'reverseImages',
		alt_S: 'sortDialog',


		// doc...
		// XXX for debug...
		//ctrl_G: function(){ $('.viewer').toggleClass('visible-gid') },
		'?': 'showKeyboardBindings',


		W: 'testAction',
	},
}


//---------------------------------------------------------------------

// XXX DEBUG: remove when done...
window.kb = keyboard.Keyboard(
	GLOBAL_KEYBOARD, 
	function checkGlobalMode(mode, keyboard, context){
		var pattern = keyboard[mode].pattern
		return !pattern 
			|| pattern == '*' 
			|| $(keyboard[mode].pattern).length > 0 })




/*********************************************************************/
// XXX add a key binding list UI...
// XXX add loading/storing of kb bindings...

// XXX add introspection and doc actions...
var KeyboardActions = actions.Actions({
	config: {
		// limit key repeat to one per N milliseconds.
		//
		// Set this to -1 or null to run keys without any limitations.
		'max-key-repeat-rate': 0,

		'keyboard-repeat-pause-check': 100,

		// Sets the target element to which the keyboard event handler 
		// is bound...
		//
		// Supported values:
		// 	'window'			- window element
		// 	'document'			- document element
		// 	'viewer'			- the viewer (default)
		// 	null				- default element
		// 	<css selector>		- any css selector
		//
		// NOTE: this value is not live, to update the target restart 
		// 		the handler by cycling the toggler off and on...
		// NOTE: the target element must be focusable...
		'keyboard-event-source': 'window',
	},

	// XXX do we need these as wrappers???
	get keybindigs(){
		return this.__keyboard_config },
	get keyboard(){
		return this.__keyboard_object },

	pauseKeyboardRepeat: ['- Interface/',
		function(){ 
			this.__keyboard_repeat_paused = true }],

	toggleKeyboardHandling: ['- Interface/Keyboard handling',
		toggler.Toggler(null, function(_, state){ 
			if(state == null){
				return this.__keyboard_handler ? 'on' : 'off'
			}

			// repeat stop checker...
			var check = (function(){
				if(this.config['keyboard-repeat-pause-check'] > 0
						&& this.__keyboard_repeat_paused){
					var that = this
					this.__keyboard_repeat_pause_timeout 
						&& clearTimeout(this.__keyboard_repeat_pause_timeout)

					this.__keyboard_repeat_pause_timeout = setTimeout(function(){
						delete that.__keyboard_repeat_paused
						delete that.__keyboard_repeat_pause_timeout 
					}, this.config['keyboard-repeat-pause-check'] || 100)

					return false
				}
				return true
			}).bind(this)

			//* XXX gen2
			var kb = this.__keyboard_object = 
				this.__keyboard_object 
					|| keyboard.Keyboard(
						function(){ return that.__keyboard_config },
						function(mode, keyboard, context){ 
							var pattern = keyboard[mode].pattern || mode
							var target = that.ribbons.viewer
							return !pattern 
								|| pattern == '*' 
								// XXX legacy...
								//|| $(pattern).length > 0
								// XXX can we join these into one search???
								|| target.is(pattern)
								|| target.find(pattern).length > 0
						})
			kb.service_fields = kb.constructor.service_fields.concat(['pattern'])
			//*/

			// start/reset keyboard handling...
			if(state == 'on'){
				var that = this

				// NOTE: the target element must be focusable...
				var target =
				this.__keyboard_event_source =
					this.config['keyboard-event-source'] == null 
						|| this.config['keyboard-event-source'] == 'viewer' ? this.ribbons.viewer
					: this.config['keyboard-event-source'] == 'window' ? $(window)
					: this.config['keyboard-event-source'] == 'document' ? $(document)
					: $(this.config['keyboard-event-source'])

				// need to reset...
				if(this.__keyboard_handler != null){
					target.off('keydown', this.__keyboard_handler)
				}

				// setup base keyboard for devel, in case something breaks...
				// This branch does not drop keys...
				if(this.config['max-key-repeat-rate'] < 0 
						|| this.config['max-key-repeat-rate'] == null){
					//this.ribbons.viewer
					var handler = 
					this.__keyboard_handler =
						keyboard.stoppableKeyboardRepeat(
							keyboard.makeKeyboardHandler(
								this.keyboard,
								//function(){ return that.__keyboard_config },
								function(k){ window.DEBUG && console.log('KEY:', k) }, 
								this),
							check)

				// drop keys if repeating too fast...
				// NOTE: this is done for smoother animations...
				} else {
					var handler = 
					this.__keyboard_handler =
						keyboard.stoppableKeyboardRepeat(
							keyboard.dropRepeatingkeys(
								keyboard.makeKeyboardHandler(
									this.keyboard,
									//function(){ return that.__keyboard_config },
									function(k){ window.DEBUG && console.log(k) },
									this), 
								function(){ 
									return that.config['max-key-repeat-rate']
								}),
							check)
				}

				target.keydown(handler)

			// stop keyboard handling...
			} else {
				this.__keyboard_event_source
					&& this.__keyboard_event_source
						.off('keydown', this.__keyboard_handler)

				//delete this.__keyboard_object
				delete this.__keyboard_handler
				delete this.__keyboard_event_source
			}
		},
		['on', 'off'])],

	// Format:
	// 	{
	// 		<action>: [
	// 			<key>,
	// 			...
	// 		],
	// 		...
	// 	}
	//
	// XXX this does not check overloading between modes...
	getKeysForAction: ['- Interface/',
		function(actions, modes){
			var that = this
			actions = actions == '*' ? null : actions
			actions = !actions || actions instanceof Array ? actions : [actions]

			modes = modes || null
			modes = !modes || modes instanceof Array ? modes : [modes]
			modes = modes || this.keyboard.modes()

			var keys = this.keyboard.keys('*')
			
			var res = {}

			// build the result...
			Object.keys(keys)
				// filter modes...
				.filter(function(mode){ return modes.indexOf(mode) >= 0 })
				.forEach(function(mode){
					Object.keys(keys[mode])
						// parse the actions...
						// NOTE: this will ignore the no_defaults flag...
						.map(function(action){ 
							action = keyboard.parseActionCall(action.doc || action)
					   		return (action.arguments.length == 0 
									&& action.action in that) ? 
								action.action 
								: '--'})
						// keep only the actions given...
						.filter(function(action){
							return action != '--'
								&& (!actions 
									|| actions.indexOf(action) >= 0)
						})
						.forEach(function(action){
							res[action] = (res[action] || []).concat(keys[mode][action])
						})
				})

			return res
		}],


	// XXX move to gen2
	// XXX need to pre-process the docs...
	// 		- remove the path component...
	// 		- insert the action name where not doc present...
	// XXX cleanup CSS
	showKeyboardBindings: ['Interface/Show keyboard bindings...',
		widgets.makeUIDialog('Drawer', 
			function(){
				return keyboard.buildKeybindingsHelpHTML(
					this.__keyboard_config, 
					this, 
					function(action){
						return Object.keys(this.getPath(action))[0] })
			},
			{
				background: 'white',
				focusable: true,
			})],


	// XXX Things not to forget: 
	// 		* sort modes
	// 		* sort actions
	// 		* action editor dialog
	// 		* mode editor dialog
	// 		* add ability to disable key (???)
	// 		* ignore flag/list...
	// XXX key editor:
	//
	// 		[ mode ]
	// 		[  action (text with dataset)  ] [  args (text field)  ] no default: [_]
	//		---
	//		<list of keys>
	//		new
	// XXX BUG sections with doc do not show up in title...
	// XXX sub-group by path (???)
	browseKeyboardBindings: ['Interface/Keyboard bindings...',
		widgets.makeUIDialog(function(path, edit){
			var actions = this
			var keybindigs = this.keybindigs

			var keys = this.keyboard.keys('*')

			var dialog = browse.makeLister(null, 
				function(path, make){
					Object.keys(keybindigs)
						.forEach(function(mode){
							var dropped = keybindigs[mode].drop || []
							var bound_ignored = []

							// section heading...
							make(keybindigs[mode].doc ? 
									$('<span>')
										// NOTE: at this time adding a br
										// 		is faster and simpler than
										// 		doing this in CSS...
										// XXX revise...
										.html(mode + '<br>')
										.append($('<span>')
											.addClass('doc')
											.html(keybindigs[mode].doc))
									: mode, 
									{ 
										not_filtered_out: true,
										// XXX should sections be searchable???
										//not_searchable: true,
									})
								.addClass('mode')

							// bindings...
							var c = 0
							Object.keys(keys[mode] || {}).forEach(function(action){

								var o = keyboard.parseActionCall(action)
								var doc = o.doc
								var code = o.action 
									+ (o.no_default ? '!' : '') 
									+ (o.arguments.length > 0 ? 
										(': '+ o.arguments.map(JSON.stringify).join(' '))
										: '')

								// NOTE: wee need the button spec to be
								// 		searchable, thus we are not using 
								// 		the keys attr as in .browseActions(..)
								make([code, ' ', '$BUTTONS']
										.concat($('<span>')
											.addClass('text')
											.html(keys[mode][action]
												// mark key if it is in dropped...
												.map(function(s){ 
													s = s.split('+')
													var k = s.pop() 
													var i = dropped.indexOf(k)
													i >= 0 
														&& bound_ignored
															.push(dropped[i])
													s.push(k 
														+ (i >= 0 ?  '<sup>*</sup>' : ''))
													return s.join('+') })
												.join(' / '))))
									.attr('doc', 
										doc.trim() != '' ? 
											doc 
											: (actions.keyboard.special_handlers[action] 
												|| null))
									.addClass('key '
										+ (action in actions.keyboard.special_handlers ?
										   	'special-action' 
											: ''))
								c++
							})

							// no keys in view mode...
							// XXX is adding info stuff like this a correct 
							// 		thing to do in code?
							c == 0 && !edit 
								&& make('No bindings...', 
									{
										disabled: true,
										hide_on_search: true,
									})
									.addClass('info')

							// unpropagated and unbound keys...
							make(['Unpropagated and unbound keys:',
									// NOTE: this blank is so as to avoid
									// 		sticking the action and keys 
									// 		together in path...
									' ',
									'$BUTTONS',
									dropped
										.filter(function(k){ 
											return bound_ignored.indexOf(k) == -1 })
										.join(' / ')])
								.addClass('ignore-list')

							// controls...
							if(edit){
								var elem = make('new', {
									buttons: [
										// XXX
										['key', 
											function(){
												//elem.before( XXX )
											}],
										// XXX
										['mode', 
											function(){
												//elem.after( XXX )
											}],
									]})
									.addClass('new')
							}
						})

					// notes...
					// XXX is adding info stuff like this a correct 
					// 		thing to do in code?
					make('---')
					make($('<span>')
							.addClass('text')
							.html('<sup>*</sup> keys not propogated to next section.'), 
						{ 
							disabled: true ,
							hide_on_search: true,
						})
						.addClass('info')
				}, {
					cls: [
						'key-bindings',
						'no-item-numbers',
						(edit ? 'edit' : 'browse'),
					].join(' '),

					itemButtons: edit ?
					   	[
							// NOTE: ordering within one section is purely 
							// 		aesthetic and has no function...
							// XXX do wee actually need ordering???
							// XXX up
							//['&#9206;', function(){}],
							// XXX down
							//['&#9207;', function(){}],

							// XXX edit -- launch the editor...
							['&ctdot;', function(){}],
							//['edit', function(){}],
							//['&#128393;', function(){}],
						]
						: [],
				})

			return dialog
		})],
	// XXX place this in /Doc/.. (???)
	editKeyboardBindings: ['Interface/Keyboard bindings editor...',
		widgets.uiDialog(function(path){ 
			return this.browseKeyboardBindings(path, true) })],

	// XXX
	resetKeyBindings: ['Interface/Restore default key bindings',
		function(){ 
			thiis.__keyboard_config = GLOBAL_KEYBOARD }],

	// XXX do we look for aliases in this mode only or in all modes?
	getKeyHandler: ['- Interface/',
		function(modes, key, action){
			var that = this

			// XXX normalize key...
			var full_key = key
			var modifiers = key.split('+')
			key = modifiers.pop()

			var code = keyboard.toKeyCode(key)
			var args = [].slice.call(arguments).slice(3)

			// set handler...
			if(action){
				modes = modes instanceof Array ? modes : [modes]
				// ignore all but the first mode...
				modes = modes.slice(0, 1)

			// get handler...
			} else {
				var shift_key = (modifiers.indexOf('shift') >= 0 ? 
						keyboard._SHIFT_KEYS[key]
						: keyboard._UNSHIFT_KEYS[key])
					|| '' 
				var shift_modifiers = shift_key != '' 
					&& (((modifiers.indexOf('shift') >= 0 ?
						modifiers.filter(function(k){ return k != 'shift' })
						: modifiers.concat(['shift'])))
					|| modifiers).join('+')
				var full_shift_key = shift_modifiers == '' ? 
					shift_key 
					: shift_modifiers +'+'+ shift_key

				var any = modes == 'any'
				modes = any ? this.keyboard.modes()
					: modes == '*' ? Object.keys(this.keybindigs) 
					: modes
				modes = modes instanceof Array ? modes : [modes]

				// filter modes...
				var ignore = false
				modes = any ? 
					modes
						.filter(function(mode){
							if(ignore){
								return false
							}

							var i = that.keybindigs[mode].ignore || []

							ignore = i.indexOf(full_key) >= 0
								|| i.indexOf(key) >= 0
								|| i.indexOf(shift_key) >= 0
								|| i.indexOf(full_shift_key) >= 0
								|| i.indexOf(code) >= 0

							return true
						})
					: modes
			}

			modifiers = modifiers.join('+')


			// search modes...
			var res = {}
			ignore = false
			modes
				.forEach(function(mode){
					if(ignore){
						return false
					}

					var bindings = that.keybindigs[mode]

					if(action){
						var match = 'direct'
						var alias = code in bindings ? code : key

					} else {
						// direct match...
						var match = 'direct'
						var alias = full_key in bindings ? full_key 
							: key in bindings ? key 
							: null
						// shift key match...
						match = alias == null ? 'shifted' : match
						alias = alias == null ? 
							(full_shift_key in bindings ? full_shift_key 
								: shift_key in bindings ? shift_key 
								: null)
							: alias
						// code match...
						match = alias == null ? 'code' : match
						alias = alias == null ? 
							(code in bindings ? code : null)
							: alias
					}

					var mod = (match == 'code' || match == 'direct') ? 
						modifiers 
						: shift_modifiers
					mod = mod == '' ? 'default' : mod

					var handler = alias

					// spin through aliases...
					// XXX do we look for aliases in this mode only or in all modes?
					var seen = []
					while(handler in bindings){
						// handler loop...
						if(seen.indexOf(handler) >= 0){
							return null
						}
						
						alias = handler
						handler = bindings[alias]
						seen.push(alias)

						// go into the map structure...
						if(!action && typeof(handler) != typeof('str')){
							handler = handler[mod]
						}
					}

					// set the action...
					if(action){
						if(handler == null || typeof(handler) == typeof('str')){
							bindings[alias] = modifiers.length == 0 ?
								action
								: { modifiers : action }

						} else if(modifiers.length == 0){
							handler['default'] = action

						} else {
							handler[modifiers] = action
						}

					// get the action...
					} else {
						if(handler){
							res[mode] = handler
						}

						ignore = any && handler == 'DROP'
					}
				})

			return !action ? 
				(modes.length == 1 ? res[modes[0]] : res) || null
				: undefined
		}],
	// XXX move this to lib/keyboard.js
	// XXX not done yet...
	bindKey: ['- Interface/',
		function(mode, key, action){
			var modifiers = key.split('+')
			key = modifiers.pop()
			modifiers = modifiers.join('+')
			var code = keyboard.toKeyCode(key)
			var args = [].slice.call(arguments).slice(3)
			action = action 
					+ (args.length > 0 ? 
						': '+ args.map(JSON.stringify).join(' ')
						: '')
			var bindings = this.keybindigs[mode]

			var alias = code in bindings ? code : key
			var handler = bindings[key] || bindings[code]

			// spin through aliases...
			var seen = []
			while(handler in bindings){
				// handler loop...
				if(seen.indexOf(handler) >= 0){
					return null
				}
				
				alias = handler
				handler = bindings[alias]
				seen.push(alias)
			}

			if(handler == null || typeof(handler) == typeof('str')){
				bindings[alias] = modifiers.length == 0 ?
					action
					: { modifiers : action }

			} else if(modifiers.length == 0){
				handler['default'] = action

			} else {
				handler[modifiers] = action
			}
		}],
})

var Keyboard = 
module.Keyboard = core.ImageGridFeatures.Feature({
	title: '',
	doc: '',

	tag: 'keyboard',
	depends: [
		'ui'
	],

	actions: KeyboardActions, 

	handlers: [
		['start',
			function(){
				var that = this
				this.__keyboard_config = this.keybindigs || GLOBAL_KEYBOARD

				this.toggleKeyboardHandling('on')
			}],

		// pause keyboard repeat...
		['shiftImageUp.pre shiftImageDown.pre',
			function(){
				var r = this.current_ribbon

				return function(){
					// pause repeat if shifting last image out of the ribbon... 
					if(this.data.ribbons[r] == null 
							|| this.data.ribbons[r].len == 0){
						this.pauseKeyboardRepeat()
					}
				}
			}],
	],
})




/**********************************************************************
* vim:set ts=4 sw=4 :                               */ return module })
