/**********************************************************************
* 
*
*
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true


/*********************************************************************/

// NOTE: context is dynamic.
function Action(context, name, doc, code){
	var action = function(){
		var args = args2array(arguments)
		var c = $(context)
			.trigger(name + '.pre', args)

		// run compound action content...
		if(code != null){
			// code is a function...
			if(typeof(code) == typeof(function(){})){
				code.apply(this, [c].concat(args))

			// code is an object...
			} else {
				for(var a in code){
					var sargs = code[a]
					sargs = sargs.constructor.name != 'Array' ? [sargs] : sargs
					this[a].apply(this, sargs)
				}
			}
		}

		return c
			.trigger(name, args)
			.trigger(name + '.post', args)
	}
	action.doc = doc == null ? name : doc
	return action
}


// if actions is given this will extend that action object, else a new 
// action object will be created.
//
// names format:
// 	{
// 		// basic action...
// 		<action-name>: <doc>,
//
// 		// compound action...
// 		<action-name>: [<doc>, {
// 			<action-name>: <args>,
// 			...
// 		}],
//
// 		// compound action with a JS function...
// 		<action-name>: [<doc>, 
// 			// this is run in the context of the action set...
// 			// NOTE: this will get the same arguments passed to the action
// 			//		preceded with the action event context.
// 			function(evt_context, ...){
// 				...
// 			}],
//
// 		...
// 	}
//
//
// NOTE: context is dynamic.
function Actions(context, names, actions){
	actions = actions == null ? {} : actions
	Object.keys(names).forEach(function(e){
		var doc = names[e]
		var code = doc.constructor.name == 'Array' ? doc[1] : null
		doc = code != null ? doc : doc[0]

		actions[e] = Action(context, e, doc, code)
	})
	return actions
}



/*********************************************************************/

// XXX need a way to define compound actions...
// 		- compound action is like a normal action with a set of other 
// 			actions chanined to it's main event.
// 		- actions should accept arguments, both optional and required
var BASE_ACTIONS = {
	// basic navigation...
	nextImage: 'Focus next image in current ribbon',
	nextRibbon: 'Focus next ribbon (down)',
	nextScreen: 'Show next screen width of images',

	prevImage: 'Focus previous image in current ribbon',
	prevRibbon: 'Focus previous ribbon (up)',
	prevScreen: 'Show previous screen width of images',

	firstImage: 'Focus first image in ribbon',
	lastImage: 'Focus last image in ribbon',

	// zooming...
	zoomIn: 'Zoom in',
	zoomOut: 'Zoom out',

	fitNImages: 'fit N images',

	fitOne: ['Fit one image',{ fitNImages: 1, }],
	fitTwo: ['Fit two images', { fitNImages: 2, }],
	fitThree: ['Fit three images', { fitNImages: 3, }],
	fitFour: ['Fit four images', { fitNImages: 4, }],
	fitFive: ['Fit five images', { fitNImages: 5, }],
	fitSix: ['Fit six images', { fitNImages: 6, }],
	fitSeven: ['Fit seven images', { fitNImages: 7, }],
	fitEight: ['Fit eight images', { fitNImages: 8, }],
	fitNine: ['Fit nine images', { fitNImages: 9, }],

	fitMax: 'Fit the maximum number of images',

	fitSmall: 'Show small image',
	fitNormal: 'Show normal image',
	fitScreen: 'Fit image to screen',

	// basic editing...
	shiftImageUp: 
		'Shift image to the ribbon above current, creating one if '
		+'it does not exist',
	shiftImageDown:
		'Shift image to the ribbon below current, creating one if '
		+'it does not exist',
	shiftImageLeft: 'Shift image to the left',
	shiftImageRight: 'Shift image to the right',

	moveRibbonUp: 'Move current ribbon one position up',
	moveRibbonDown: 'Move current ribbon one position down',

	sortImages: '',
	reverseImages: '',
	setAsBaseRibbon: '',

	// image adjustments...
	rotateLeft: '',
	rotateRight: '',
	flipVertical: '',
	flipHorizontal: '',

	// external editors/viewers...
	systemOpen: '',
	openWith: '',

	// crop...
	// XXX should this be here on in a crop pligin...
	cropRibbon: '',
	uncropView: '',
	uncropAll: '',

	// modes...
	singleImageMode: '',
	ribbonMode: '',

	toggleTheme: '',

	// panels...
	togglePanels: '',
	showInfoPanel: '',
	showTagsPanel: '',
	showSearchPanel: '',
	showQuickEditPanel: '',
	showStatesPanel: '',
	showConsolePanel: '',

	openURL: '',
	openHistory: '',

	saveState: '',
	exportImages: '',

	exit: '',

	// developer actions...
	showConsole: '',
	showDevTools: '',
}


// XXX think of a better name...
function setupBaseActions(context, actions){
	return Actions(context, BASE_ACTIONS, actions)
}



/*********************************************************************/

// Marks actions...
// XXX move to marks.js
var MARKS_ACTIONS = {
	toggleMark: '',
	toggleMarkBlock: '',

	markRibbon: '',
	unmarkRibbon: '',
	markAll: '',
	unmarkAll: '',
	invertMarkedRibbon: '',
	invertMarkedAll: '',

	shiftMarkedUp: '',
	shiftMarkedDown: '',
	shiftMarkedLeft: '',
	shiftMarkedRight: '',

	cropMarkedImages: '',
	cropMarkedImagesToSingleRibbon: '',
}

function setupMarksActions(context, actions){
	return Actions(context, MARKS_ACTIONS, actions)
}



/*********************************************************************/

// Bookmarks actions...
// XXX move to bookmarks.js
var BOOKMARKS_ACTIONS = {
	toggleBookmark: 'Toggle image bookmark',

	bookmarkMarked: 'Bookmark marked images',
	unbookmarkMarked: 'Remove bookmarks from marked images',
	toggleBookmarkMarked: 'Toggle bookmarks on marked images',

	clearRibbonBookmarks: 'Remove bookmarks in ribbon',
	clearAllBookmarks: 'Clear all bookmarks',

	cropBookmarkedImages: '',
	cropBookmarkedImagesToSingleRibbon: '',
}

function setupBookmarksActions(context, actions){
	return Actions(context, BOOKMARKS_ACTIONS, actions)
}




/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
