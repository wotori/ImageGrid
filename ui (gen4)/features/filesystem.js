/**********************************************************************
* 
*
*
**********************************************************************/

define(function(require){ var module = {}

//var DEBUG = DEBUG != null ? DEBUG : true

// XXX this should not be imported!!!
// 		...something wrong with requirejs(..)
if(typeof(process) != 'undefined'){
	var fse = requirejs('fs-extra')
	var pathlib = requirejs('path')
	var glob = requirejs('glob')
	var file = requirejs('./file')
}

var data = require('data')
var images = require('images')

var util = require('lib/util')

var actions = require('lib/actions')
var features = require('lib/features')

var core = require('features/core')

var overlay = require('lib/widget/overlay')
var browse = require('lib/widget/browse')
var browseWalk = require('lib/widget/browse-walk')



/*********************************************************************/
// fs reader/loader...


// XXX revise base path mechanics...
// 		.loaded_paths
var FileSystemLoaderActions = actions.Actions({
	config: {
		'index-dir': '.ImageGrid',

		'image-file-pattern': '*+(jpg|jpeg|png|JPG|JPEG|PNG)',

		// XXX if true and multiple indexes found, load only the first 
		// 		without merging...
		'load-first-index-only': false,
	},

	clone: [function(full){
		return function(res){
			if(this.location){
				res.location.path = this.location.path
				res.location.method = this.location.method
			}
			if(this.loaded_paths){
				res.loaded_paths = JSON.parse(JSON.stringify(this.loaded_paths))
			}
		}
	}],

	loaded_paths: null,


	// XXX is this a hack???
	// XXX need a more generic form...
	checkPath: ['- File/',
		function(path){ return fse.existsSync(path) }],

	// NOTE: when passed no path this will not do anything...
	// XXX should this set something like .path???
	// 		...and how should this be handled when merging indexes or
	//		viewing multiple/clustered indexes???
	// XXX add a symmetric equivalent to .prepareIndexForWrite(..) so as 
	// 		to enable features to load their data...
	// XXX look inside...
	loadIndex: ['- File/Load index',
		function(path, logger){
			var that = this

			if(path == null){
				return
			}

			// XXX get a logger...
			logger = logger || this.logger

			// XXX make this load incrementally (i.e. and EventEmitter
			// 		a-la glob)....
			file.loadIndex(path, this.config['index-dir'], logger)
				.then(function(res){
					// XXX if res is empty load raw...

					// XXX use the logger...
					//console.log('FOUND INDEXES:', Object.keys(res).length)

					// skip nested paths...
					// XXX make this optional...
					// XXX this is best done BEFORE we load all the 
					// 		indexes, e.g. in .loadIndex(..)
					var paths = Object.keys(res)
					var skipped = []
					paths.forEach(function(p){
						// already removed...
						if(skipped.indexOf(p) >= 0){
							return
						}

						paths
							// get all paths that fully contain p...
							.filter(function(o){
								return o != p && o.indexOf(p) == 0
							})
							// drop all longer paths...
							.forEach(function(e){
								skipped.push(e)
								delete res[e]
							})
					})
					//console.log('SKIPPING NESTED:', skipped.length)

					var index
					var base_path
					var loaded = []

					// NOTE: res may contain multiple indexes...
					for(var k in res){

						// skip empty indexes...
						// XXX should we rebuild  or list here???
						if(res[k].data == null || res[k].images == null){
							continue
						}

						var part = file.buildIndex(res[k], k)

						// load the first index...
						if(index == null){
							// XXX use the logger...
							//console.log('LOADING:', k, res)
							logger && logger.emit('base index', k, res)

							index = part

						// merge indexes...
						// XXX need to skip sub-indexes in the same sub-tree...
						// 		...skip any path that fully contains an 
						// 		already loaded path..
						// XXX load data in chunks rather than merge...
						} else {
							//console.log('MERGING:', k, part)
							logger && logger.emit('merge index', k, res)

							// merge...
							index.data.join(part.data)
							index.images.join(part.images)
						}

						loaded.push(k)

						// XXX do a better merge and remove this...
						// 		...we either need to lazy-load clustered indexes
						// 		or merge, in both cases base_path should reflet
						// 		the fact that we have multiple indexes...
						if(that.config['load-first-index-only']){
							break
						}
					}

					logger && logger.emit('load index', index)

					that.load(index)

					that.loaded_paths = loaded
					that.__location = {
						path: loaded.length == 1 ? loaded[0] : path,
						method: 'loadIndex',
					}
				})
		}],
	// XXX use the logger...
	// XXX add a recursive option...
	// 		...might also be nice to add sub-dirs to ribbons...
	// XXX make image pattern more generic...
	loadImages: ['- File/Load images',
		function(path, logger){
			if(path == null){
				return
			}

			var that = this

			// NOTE: we set this before we start the load so as to let 
			// 		clients know what we are loading and not force them
			// 		to wait to find out...
			// XXX not sure if this is the way to go...
			this.__location = {
				path: path,
				method: 'loadImages',
			}

			glob(path + '/'+ this.config['image-file-pattern'])
				.on('error', function(err){
					console.log('!!!!', err)
				})
				.on('end', function(lst){ 
					that.loadURLs(lst
						.map(function(p){ return util.normalizePath(p) }), path)

					// NOTE: we set it again because .loadURLs() does a clear
					// 		before it starts loading...
					// 		XXX is this a bug???
					that.__location = {
						path: path,
						method: 'loadImages',
					}
				})
		}],

	// XXX auto-detect format or let the user chose...
	loadPath: ['- File/Load path (STUB)',
		function(path, logger){
			// XXX check if this.config['index-dir'] exists, if yes then
			// 		.loadIndex(..) else .loadImages(..)

			//this.location.method = 'loadImages'
		}],

	// XXX merging does not work (something wrong with .data.join(..))
	// 		...fixed a bug in images.js hash generator, now might be fixed...
	// XXX revise logger...
	loadNewImages: ['File/Load new images',
		function(path, logger){
			path = path || this.location.path
			logger = logger || this.logger

			if(path == null){
				return
			}

			var that = this

			// cache the loaded images...
			var loaded = this.images.map(function(gid, img){ return img.path })
			var base_pattern = RegExp('^'+path)

			// find images...
			glob(path + '/'+ this.config['image-file-pattern'])
				.on('end', function(lst){ 
					// create a new images chunk...
					lst = lst
						// filter out loaded images...
						.filter(function(p){
							return loaded.indexOf(
								util.normalizePath(p)
									// remove the base path if it exists...
									.replace(base_pattern, '')
									// normalize the leading './'
									.replace(/^[\/\\]+/, './')) < 0
						})


					// nothing new...
					if(lst.length == 0){
						// XXX
						logger && logger.emit('loaded', [])
						return
					}

					// XXX
					logger && logger.emit('queued', lst)

					var new_images = images.Images.fromArray(lst, path)
					var gids = new_images.keys()
					var new_data = that.data.constructor.fromArray(gids)

					// merge with index...
					// NOTE: we are prepending new images to the start...
					// NOTE: all ribbon gids will change here...
					var cur = that.data.current
					// XXX this does not seem to work...
					//that.data = new_data.join(that.data)
					that.data = new_data.join('top', that.data)
					that.data.current = cur

					that.images.join(new_images)

					that.reload()

					// XXX report that we are done...
					logger && logger.emit('loaded', lst)
				})
		}],

	clear: [function(){
		delete this.__location
		delete this.loaded_paths
	}],
})


var FileSystemLoader = 
module.FileSystemLoader = core.ImageGridFeatures.Feature({
	title: '',
	doc: '',

	tag: 'fs-loader',
	depends: [
		'location',
	],

	actions: FileSystemLoaderActions,

	isApplicable: function(){ 
		return this.runtime == 'node' || this.runtime == 'nw' },
})



//---------------------------------------------------------------------

// XXX would need to delay the original action while the user is 
// 		browsing...
var makeBrowseProxy = function(action, callback){
	return function(path, logger){
		var that = this
		path = path || this.location.path
		// XXX should we set a start path here to current???
		return this.browsePath(path, 
			function(path){ 
				var res = that[action](path, logger) 
				callback && callback.call(that, path)
				return res
			})
	}
}


var FileSystemLoaderUIActions = actions.Actions({
	config: {
		// list of loaders to complete .browsePath(..) action
		//
		// NOTE: these will be displayed in the same order as they appear
		// 		in the list.
		// NOTE: the first one is auto-selected.
		'path-loaders': [
			'loadIndex',
			'loadImages',
			//'loadPath',
		],

		'file-browser-settings': {
			disableFiles: true,
			showNonTraversable: true,
			showDisabled: true,
		},
	},

	// XXX for some reason the path list blinks (.update()???) when sub 
	// 		menu is shown...
	// XXX should the loader list be nested or open in overlay (as-is now)???
	browsePath: ['File/Browse file system...',
		function(base, callback){
			var that = this
			base = base || this.location.path || '/'

			var o = overlay.Overlay(this.ribbons.viewer, 
				browseWalk.makeWalk(
						null, base, this.config['image-file-pattern'],
						this.config['file-browser-settings'])
					// path selected...
					.open(function(evt, path){ 
						var item = o.client.selected

						// single loader...
						if(callback && callback.constructor === Function){
							// close self and parent...
							o.close() 

							callback(path)

						// list of loaders...
						} else {
							// user-provided list...
							if(callback){
								var loaders = callback

							// build the loaders list from .config...
							} else {
								var loaders = {}
								that.config['path-loaders'].forEach(function(m){
									loaders[that.getDoc(m)[m][0].split('/').pop()] = function(){ 
										return that[m](path) 
									}
								})
							}

							// show user the list...
							var so = overlay.Overlay(that.ribbons.viewer, 
								browse.makeList(null, loaders)
									// close self and parent...
									.open(function(){
										so.close()
										o.close() 
									}))
									// closed menu...
									.close(function(){
										o.focus()
										o.client.select(item)
									})
							// select top element...
							so.client.select(0)

							return so
						}
					}))
					// we closed the browser -- save settings to .config...
					.close(function(){

						var config = that.config['file-browser-settings']

						config.disableFiles = o.client.options.disableFiles
						config.showDisabled = o.client.options.showDisabled
						config.showNonTraversable = o.client.options.showNonTraversable
					})

			return o
		}],

	// NOTE: if no path is passed (null) these behave just like .browsePath(..)
	// 		with the appropriate callback otherwise it will just load 
	// 		the given path (no UI) while .browsePath(..) will load the 
	// 		UI in all cases but will treat the given path as a base path 
	// 		to start from.
	// XXX should passing no path to this start browsing from the current
	// 		path or from the root?
	browseIndex: ['File/Load index', makeBrowseProxy('loadIndex')],
	browseImages: ['File/Load images', makeBrowseProxy('loadImages')],
})


// XXX is this a good name???
var FileSystemLoaderUI = 
module.FileSystemLoaderUI = core.ImageGridFeatures.Feature({
	title: '',
	doc: '',

	tag: 'ui-fs-loader',
	depends: ['fs-loader'],

	actions: FileSystemLoaderUIActions,
})



//---------------------------------------------------------------------

var pushToHistory = function(action, to_top, checker){
	return [action, 
		function(_, path){ 
			path = util.normalizePath(path)
			if(path){
				this.pushURLToHistory(
					util.normalizePath(path), 
					action, 
					checker || 'checkPath') 
			}
			if(to_top){
				this.setTopURLHistory(path)
			}
		}]
}

var FileSystemURLHistory = 
module.FileSystemLoaderURLHistory = core.ImageGridFeatures.Feature({
	title: '',
	doc: '',

	tag: 'fs-url-history',
	depends: [
		'fs-loader',
		'url-history',
	],

	handlers: [
		pushToHistory('loadImages'), 
		pushToHistory('loadIndex'), 
		pushToHistory('loadPath'), 
		//pushToHistory('loadNewImages'), 
	],
})



//---------------------------------------------------------------------

// Opening the url via .browsePath(..) if url is in history will move 
// it to top of list...
var FileSystemURLHistoryUI = 
module.FileSystemLoaderURLHistoryUI = core.ImageGridFeatures.Feature({
	title: '',
	doc: '',

	tag: 'ui-fs-url-history',
	depends: [
		'ui-fs-loader',
		'fs-url-history',
	],

	handlers: [
		['browsePath', 
			function(res){ 
				var that = this
				res.client.open(function(_, path){
					that.setTopURLHistory(path) 
				})
			}],
	],
})



//---------------------------------------------------------------------
// fs writer...

var FileSystemWriterActions = actions.Actions({
	config: {
		//'index-filename-template': '${DATE}-${KEYWORD}.${EXT}',
	},

	// This can be:
	// 	- null/undefined	- write all
	// 	- true				- write all
	// 	- false				- write nothing
	// 	- {
	//		// write/skip data...
	//		data: <bool>,
	//
	//		// write/skip images or write a diff including the given 
	//		// <gid>s only...
	//		images: <bool> | [ <gid>, ... ],
	//
	//		// write/skip tags...
	//		tags: <bool>,
	//
	//		// write/skip bookmarks...
	//		bookmarked: <bool>,
	//
	//		// write/skip selected...
	//		selected: <bool>,
	// 	  }
	//
	// NOTE: in the complex format all fields ar optional; if a field 
	// 		is not included it is not written (same as when set to false)
	// NOTE: .current is written always.
	chages: null,

	clone: [function(full){
			return function(res){
				res.changes = null
				if(full && this.hasOwnProperty('changes') && this.changes){
					res.changes = JSON.parse(JSON.stringify(this.changes))
				}
			}
		}],

	// Mark data sections as changed...
	//
	//	Mark everything changed...
	//	.markChanged('all')
	//
	//	Mark nothing changed...
	//	.markChanged('none')
	//
	//	Mark a section changed...
	//	.markChanged('data')
	//	.markChanged('tags')
	//	.markChanged('selected')
	//	.markChanged('bookmarked')
	//
	//	Mark image changed...
	//	.markChanged(<gid>, ...)
	//
	//
	// NOTE: when .changes is null (i.e. everything changed, marked via
	// 		.markChanged('all')) then calling this with anything other 
	// 		than 'none' will have no effect.
	markChanged: ['- System/',
		function(){
			var that = this
			var args = util.args2array(arguments)
			//var changes = this.changes = 
			var changes = 
				this.hasOwnProperty('changes') ?
					this.changes || {}
					: {}

			// all...
			if(args.length == 1 && args[0] == 'all'){
				// NOTE: this is better than delete as it will shadow 
				// 		the parent's changes in case we got cloned from
				// 		a live instance...
				//delete this.changes
				this.changes = null

			// none...
			} else if(args.length == 1 && args[0] == 'none'){
				this.changes = false 

			// everything is marked changed, everything will be saved
			// anyway...
			// NOTE: to reset this use .markChanged('none') and then 
			// 		manually add the desired changes...
			} else if(this.changes == null){
				return

			} else {
				var images = (changes.images || [])

				args.forEach(function(arg){
					var gid = that.data.getImage(arg)

					// special case: image gid...
					if(gid != -1 && gid != null){
						images.push(gid)
						images = images.unique()

						changes.images = images
						that.changes = changes

					// all other keywords...
					} else {
						changes[arg] = true
						that.changes = changes
					}
				})
			}
		}],

	// Convert json index to a format compatible with file.writeIndex(..)
	//
	// This is here so as other features can participate in index
	// preparation...
	// There are several stages features can control the output format:
	// 	1) .json() action
	// 		- use this for global high level serialization format
	// 		- the output of this is .load(..) compatible
	// 	2) .prepareIndex(..) action
	// 		- use this for file system write preparation
	// 		- this directly affects the index structure
	//
	// This will get the base index, ignoring the cropped state.
	//
	// Returns:
	// 	{
	// 		// This is the original json object, either the one passed as
	// 		// an argument or the one returned by .json('base')
	// 		raw: <original-json>,
	//
	// 		// this is the prepared object, the one that is going to be
	// 		// saved.
	// 		prepared: <prepared-json>,
	// 	}
	//
	//
	// The format for the <prapared-json> is as follows:
	// 	{
	// 		<keyword>: <data>,
	// 		...
	// 	}
	//
	// The <prepared-json> is written out to a fs index in the following
	// way:
	// 		<index-dir>/<timestamp>-<keyword>.json
	//
	// 	<index-dir>		- taken from .config['index-dir'] (default: '.ImageGrid')
	// 	<timestamp>		- as returned by Date.timeStamp() (see: jli)
	//
	// For more info see file.writeIndex(..) and file.loadIndex(..).
	//
	prepareIndexForWrite: ['- File/Prepare index for writing',
		function(json, full){
			json = json || this.json('base')
			var changes = full ? null 
				: this.hasOwnProperty('changes') ? this.changes
				: null
			return {
				raw: json,
				prepared: file.prepareIndex(json, changes),
			}
		}],
	// NOTE: with no arguments this will save index to .location.path
	saveIndex: ['- File/Save index',
		function(path, logger){
			var that = this
			// XXX this is a stub to make this compatible with makeBrowseProxy(..)
			// 		...we do need a default here...
			/*
			if(path == null){
				return
			}
			*/
			path = path || this.location.path

			// XXX get a logger...
			logger = logger || this.logger

			// XXX get real base path...
			//path = path || this.location.path +'/'+ this.config['index-dir']

			file.writeIndex(
					this.prepareIndexForWrite().prepared, 
					// XXX should we check if index dir is present in path???
					//path, 
					path +'/'+ this.config['index-dir'], 
					this.config['index-filename-template'], 
					logger || this.logger)
				.then(function(){
					that.location.method = 'loadIndex'
				})
		}],

	// XXX same as ctrl-shif-s in gen3
	exportView: ['File/Export current view',
		function(){
		}],
	// XXX not done yet...
	// 		needs:
	// 			ensureDir(..)
	// 			copy(..)
	// 		...both denodeify(..)'ed
	// XXX export current state as a full loadable index
	// XXX might be interesting to unify this and .exportView(..)
	// XXX local collections???
	exportCollection: ['File/Export as collection',
		function(path, logger){
			var json = this.json()

			// get all loaded gids...
			var gids = []
			for(var r in json.data.ribbons){
				this.data.makeSparseImages(json.data.ribbons[r], gids)
			}
			gids = gids.compact()

			// build .images with loaded images...
			// XXX list of previews should be configurable (max size)
			var images = {}
			gids.forEach(function(gid){
				var img = json.images[gid]
				if(img){
					images[gid] = json.images[gid]
					// remove un-needed previews...
					// XXX
				}
			})

			// prepare and save index to target path...
			json.data.order = gids
			json.images = images
			// XXX should we check if index dir is present in path???
			path = path +'/'+ this.config['index-dir']

			// NOTE: if we are to use .saveIndex(..) here, do not forget
			// 		to reset .changes
			file.writeIndex(
				this.prepareIndexForWrite(json).prepared, 
				path, 
				this.config['index-filename-template'], 
				logger || this.logger)
			
			// copy previews for the loaded images...
			// XXX should also optionally populate the base dir and nested favs...
			var base_dir = this.base_dir
			gids.forEach(function(gid){
				var img = json.images[gid]
				var img_base = img.base_path
				img.base_path = path
				var previews = img.preview

				for(var res in previews){
					var from = (img_base || base_dir) +'/'+ preview_path 
					var to = path +'/'+ preview_path

					// XXX do we queue these or let the OS handle it???
					// 		...needs testing, if node's fs queues the io
					// 		internally then we do not need to bother...
					// XXX
					ensureDir(pathlib.dirname(to))
						.catch(function(err){
							// XXX
						})
						.then(function(){
							return copy(from, to)
								// XXX do we need to have both of this 
								// 		and the above .catch(..) or can
								// 		we just use the one above (after
								// 		.then(..))
								.catch(function(err){
									// XXX
								})
						})
				}
			})
		}],
})


var FileSystemWriter = 
module.FileSystemWriter = core.ImageGridFeatures.Feature({
	title: '',
	doc: '',

	tag: 'fs-writer',
	// NOTE: this is mostly because of the base path handling...
	depends: ['fs-loader'],

	actions: FileSystemWriterActions,

	isApplicable: function(){ 
		return this.runtime == 'node' || this.runtime == 'nw' },

	// monitor changes...
	// XXX should we use .load(..) to trigger changes instead of .loadURLs(..)???
	// 		...the motivation is that .crop(..) may also trigger loads...
	// 		....needs more thought...
	handlers: [
		// clear changes...
		// XXX currently if no args are passed then nothing is 
		// 		done here, this might change...
		['loadIndex',
			function(_, path){
				if(path){
					this.markChanged('none')
				}
			}],
		['saveIndex',
			function(_, path){
				// NOTE: if saving to a different path than loaded do not
				// 		drop the .changes flags...
				if(path && path == this.location.path){
					this.markChanged('none')
				}
			}],

		// everything changed...
		[[
			'loadURLs',
			'clear',
		], 
			function(){ this.markChanged('all') }],

		// data...
		[[
			//'clear',
			//'load',

			'setBaseRibbon',

			'shiftImageTo',
			'shiftImageUp',
			'shiftImageDown',
			'shiftImageLeft',
			'shiftImageRight',
			'shiftRibbonUp',
			'shiftRibbonDown',

			'sortImages',
			'reverseImages',
			'reverseRibbons',

			'group',
			'ungroup',
			'expandGroup',
			'collapseGroup',
		], 
			function(_, target){ this.markChanged('data') }],

		// image specific...
		[[
			'rotateCW',
			'rotateCCW',
			'flipHorizontal',
			'flipVertical',
		], 
			function(_, target){ this.markChanged(target) }],

		// tags and images...
		// NOTE: tags are also stored in images...
		['tag untag',
			function(_, tags, gids){
				var changes = []

				gids = gids || [this.data.getImage()]
				gids = gids.constructor !== Array ? [this.data.getImage(gids)] : gids

				tags = tags || []
				tags = tags.constructor !== Array ? [tags] : tags

				// images...
				changes = changes.concat(gids)

				// tags...
				if(tags.length > 0){
					changes.push('tags')

					// selected...
					if(tags.indexOf('selected') >= 0){
						changes.push('selected')
					}

					// bookmark...
					if(tags.indexOf('bookmark') >= 0){
						changes.push('bookmarked')
					}
				}

				this.markChanged.apply(this, changes)
			}],
	]
})


//---------------------------------------------------------------------
// XXX add writer UI feature...
// 		- save as.. (browser)
// 		- save if not base path present (browser)
var FileSystemWriterUIActions = actions.Actions({
	// XXX should this ask the user for a path???
	// XXX this for some reason works differently than browseSaveIndex(..)
	// 		and saves images-diff instead of images...
	saveIndexHere: ['File/Save',
		function(){ 
			if(this.location.path){ 
				this.saveIndex(this.location.path) 
			} 
		}],
	// XXX add ability to create dirs...
	browseSaveIndex: ['File/Save index to...', 
		makeBrowseProxy('saveIndex', function(){
			this.location.method = 'loadIndex' })],
})


var FileSystemWriterUI = 
module.FileSystemWriterUI = core.ImageGridFeatures.Feature({
	title: '',
	doc: '',

	tag: 'ui-fs-writer',
	depends: [
		'fs-writer', 
		'ui-fs-loader',
	],

	actions: FileSystemWriterUIActions,
})




/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
return module })
