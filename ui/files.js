/**********************************************************************
* 
*
*
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true



/**********************************************************************
* File storage (Extension API -- CEF/PhoneGap/...)
*
* XXX need to cleanup this section...
*/


/********************************************************* Helpers ***/

// Report deferred progress
//
// This uses showStatus(...) and showErrorStatus(...) to report actions.
//
// Will use showErrorStatus(...) iff "Error" is the last argument of the
// progress/notify action, removing it (string 'Error') from the arguments.
//
// Will return the original deferred.
function statusNotify(prefix, loader, not_queued){
	var report = not_queued == true ? showStatus : showStatusQ
	if(loader == null){
		loader = prefix
		prefix = null
	}
	return loader
		.progress(function(){
			var args = Array.apply(null, arguments)
			if(prefix != null && prefix != ''){
				args.splice(0, 0, prefix)
			}
			if(args.indexOf('Error') >= 0){
				args.pop()
				return showErrorStatus(args.join(': '))
			}
			return report(args.join(': '))
		})
}


// Bubble up actions in the deferred chain
//
// Will chain progress/notify and if only_progress is not set, also
// done/resolve and fail/reject from "from" to "to" deferred objects.
//
// Will add prefix to the list of arguments of progress/notify and
// fail/reject (if not disabled), unless it is set to null.
//
// Will return "from" object.
function bubbleProgress(prefix, from, to, only_progress){
	from
		.progress(function(){ 
			var args = Array.apply(null, arguments)
			prefix != null && args.splice(0, 0, prefix)
			to.notify.apply(to, args) 
		})

	if(only_progress == null){
		from
			.done(function(){
				var args = Array.apply(null, arguments)
				to.resolve.apply(to, args) 
			})
			.fail(function(){
				var args = Array.apply(null, arguments)
				prefix != null && args.splice(0, 0, prefix)
				to.reject.apply(to, args) 
			})
	}

	return from
}


// Semi-generic deferred file loader
//
// if pattern is given, then search for the latest (ordered last) file 
// and load that.
// else load the dfl file.
//
// if diff_pattern is given, then merge all matching files in order 
// (first to last) with the loaded "main" file
//
// NOTE: this expects a file to be JSON.
// NOTE: if diffs are available this expects the file to contain an object,
// 		and will extend that object.
// NOTE: if neither of dfl, pattern or diff_pattern are given, then this
// 		is essentially the same as $.getJSON(...)
// NOTE: this needs listDir(...) to search for latest versions of files.
function loadLatestFile(path, dfl, pattern, diff_pattern){
	var pparts = path.split(/[\/\\]/)
	dfl = dfl == null ? pparts.pop() : dfl
	//path = path == dfl ? '.' : path
	path = pparts.join('/')

	var res = $.Deferred()
	
	if(dfl == ''){
		return res.reject()
	}

	// can't find diffs if can't list dirs...
	if(window.listDir == null && (pattern != null || diff_pattern != null)){
		res.notify('Unsupported', 'directory listing.')
		return res.reject('listDir unsupported.')
	}

	// find the latest...
	if(pattern != null){
		pattern = RegExp(pattern)
		var file = $.map(listDir(path), function(e){ 
			return pattern.test(e) ? e : null
		}).sort().reverse()[0]
	}
	var file = file == null ? dfl : file
	
	var diff_data = {}
	var diff = true

	// collect and merge diffs...
	if(diff_pattern != null){
		diff_pattern = RegExp(diff_pattern)
		var diff_data = [diff_data]
		var diffs_names = $.map(listDir(path), function(e){ 
			return diff_pattern.test(e) ? e : null
		}).sort()
		diff = $.when.apply(null, $.map(diffs_names, function(e, i){
					return $.getJSON(path +'/'+ e)
						.done(function(data){
							diff_data[i+1] = data
							res.notify('Loaded', e)
						})
						.fail(function(){
							// XXX should we kill the load here???
							res.notify('Loading', e, 'Error')
						})
				}))
			// NOTE: .then(...) handlers get different signature args 
			// 		depending on the number of arguments to .when(...)...
			.then(function(){
				$.extend.apply(null, diff_data)
				diff_data = diff_data[0]
			})
	} 

	// load the main file and merge the diff with it...
	$.when(diff, $.getJSON(path +'/'+ file))
		.done(function(_, json){
			json = json[0]

			res.notify('Loaded', file)

			// merge diffs...
			if(Object.keys(diff_data).length != 0){
				$.extend(json, diff_data)
				res.notify('Merged')
			}

			res.resolve(json)
		})
		.fail(function(){
			res.notify('Loading', file, 'Error')

			return res.reject(file)
		})

	return res
}


// Construct a ribbons hierarchy from the fav dirs structure
//
// NOTE: this depends on listDir(...)
// NOTE: this assumes that images contain ALL the images...
// NOTE: this assumes that all file names are unique...
function ribbonsFromFavDirs(path, images, cmp){
	path = path == null ? getBaseURL() : path
	images = images == null ? IMAGES : images

	// build a reverse name-gid index for fast access...
	var index = {}
	var name
	for(var gid in images){
		name = images[gid].path.split('/').pop()
		// XXX we assume that names are unique...
		index[name] = gid
	}

	var ribbons = []
	// add the base row...
	var base = Object.keys(images)
	ribbons.push(base)

	var files = listDir(path)	
	var cur_path = path
	while(files.indexOf('fav') >= 0){
		cur_path += '/fav'
		files = listDir(cur_path)
		ribbon = []
		// collect the images...
		$.each(files, function(i, e){
			var _gid = index[e]
			// skip files not in index...
			// NOTE: we do not need to filter the files by name as we 
			// 		trust the index...
			if(_gid == null){
				return 
			}
			// remove the found item from each of the below ribbons...
			$.each(ribbons, function(i ,e){
				if(e.indexOf(_gid) != -1){
					e.splice(e.indexOf(_gid), 1)
				}
			})

			ribbon.push(_gid)
		})
		ribbons.push(ribbon)
	}

	// remove empty ribbons and sort the rest...
	ribbons = $.map(ribbons, function(e){ 
		return e.length > 0 ? [cmp == null ? e : e.sort(cmp)] : null 
	})

	return ribbons.reverse()
}



/*********************************************************************/

// Load images from file
//
// This will also merge all diff files.
function loadFileImages(path, no_load_diffs){
	no_load_diffs = window.listDir == null ? true : no_load_diffs 

	var res = $.Deferred()

	// default locations...
	if(path == null){
		var base = normalizePath(CACHE_DIR_VAR) 
		var loader = loadLatestFile(base, 
				IMAGES_FILE_DEFAULT, 
				IMAGES_FILE_PATTERN, 
				IMAGES_DIFF_FILE_PATTERN)
	
	// explicit base dir...
	} else if(!/\.json$/i.test(path)) {
		var base = normalizePath(path +'/'+ CACHE_DIR_VAR) 
		var loader = loadLatestFile(base, 
				IMAGES_FILE_DEFAULT, 
				IMAGES_FILE_PATTERN, 
				IMAGES_DIFF_FILE_PATTERN)

	// explicit path...
	} else {
		var loader = loadLatestFile(normalizePath(path))
	}

	bubbleProgress('Images', loader, res)

	res.done(function(images){
		IMAGES = images
	})

	return res
}


// Save current images list to file
//
// If not name is given this will merge all the diffs and save a "clean"
// (full) images.json file. Also removing the diff files.
//
// NOTE: if an explicit name is given then this will not remove anything.
// NOTE: this will use CACHE_DIR as the location if no name is given.
function saveFileImages(name){
	var remove_diffs = (name == null)
	name = name == null ? normalizePath(CACHE_DIR_VAR +'/'+ Date.timeStamp()) : name

	if(window.dumpJSON == null){
		showErrorStatus('Can\'t save to file.')
		return
	}

	// remove the diffs...
	if(remove_diffs){
		$.each($.map(listDir(normalizePath(CACHE_DIR_VAR)), function(e){ 
				return IMAGES_DIFF_FILE_PATTERN.test(e) ? e : null
			}), function(i, e){
				showStatusQ('removeing:', e)
				removeFile(normalizePath(CACHE_DIR_VAR +'/'+ e))
			})
		IMAGES_UPDATED = []
	}

	// XXX use the pattern...
	dumpJSON(name + '-images.json', IMAGES)
	//DATA.image_file = normalizePath(name + '-images.json', null, 'relative')
}


// Load image marks form file
function loadFileMarks(path){
	var res = $.Deferred()
	// default locations...
	if(path == null){
		var base = normalizePath(CACHE_DIR_VAR)
		var loader = loadLatestFile(base, 
				MARKED_FILE_DEFAULT, 
				MARKED_FILE_PATTERN)
	
	// explicit path...
	// XXX need to account for paths without a CACHE_DIR
	} else {
		path = normalizePath(path)
		var base = path.split(CACHE_DIR)[0]
		//base = normalizePath(path +'/'+ CACHE_DIR_VAR)
		base = path +'/'+ CACHE_DIR

		// XXX is this correct???
		var loader = loadLatestFile(base, 
				path.split(base)[0], 
				RegExp(path.split(base)[0]))
	}

	bubbleProgress('Marks', loader, res)

	res.done(function(images){
		MARKED = images
	})

	return res
}


// Save image marks to file
function saveFileMarks(name){
	name = name == null ? normalizePath(CACHE_DIR_VAR +'/'+ Date.timeStamp()) : name

	dumpJSON(name + '-marked.json', MARKED)
}


// Load images, ribbons and marks from cache
//
// XXX add support for explicit filenames...
function loadFileState(path, prefix){
	prefix = prefix == null ? 'Data' : prefix
	prefix = prefix === false ? null : prefix

	// XXX explicit data file path...
	if(/\.json$/i.test(path)){
		// XXX at this 
		var base = path.split(CACHE_DIR)[0]
		base = base == path ? '.' : base
	} else {
		var base = path.split(CACHE_DIR)[0]
		base = base == path ? '.' : base
	}

	var res = $.Deferred()

	bubbleProgress(prefix,
			loadLatestFile(path, 
				DATA_FILE_DEFAULT, 
				DATA_FILE_PATTERN), res, true)
		.done(function(json){
			setBaseURL(base)

			// legacy format...
			if(json.version == null){
				json = convertDataGen1(json)
				DATA = json.data
				IMAGES = json.images
				MARKED = []
				reloadViewer()
				res.resolve()

			// version 2.0
			} else if(json.version == '2.0') {
				DATA = json
				$.when(
						// XXX load config...
						// load images...
						bubbleProgress(prefix,
							loadFileImages(base), res, true),
							//loadFileImages(DATA.image_file != null ?
							//		normalizePath(DATA.image_file, base) 
							//		: null), res, true),
						// load marks if available...
						bubbleProgress(prefix,
							loadFileMarks(), res, true))
					.done(function(){
						reloadViewer()
						res.resolve()
					})
					// XXX fail???

			// unknown format...
			} else {
				res.reject('unknown format.')
			}
		})
		.fail(function(){
			res.reject('Loading', path, 'Error')
		})

	return res
}


// Save, ribbons and marks to cache
//
// NOTE: this will NOT save images, that operation must be explicitly 
// 		performed by saveFileImages(...)
function saveFileState(name, no_normalize_path){
	name = name == null ? Date.timeStamp() : name

	if(!no_normalize_path){
		name = normalizePath(CACHE_DIR_VAR +'/'+ name)

	// write .image_file only if saving data to a non-cache dir...
	// XXX check if this is correct...
	} else {
		if(DATA.image_file == null){
			DATA.image_file = name + '-images.json'
		}
	}

	dumpJSON(name + '-data.json', DATA)
	// XXX do we need to do this???
	saveFileMarks(name)

	// save the updated images...
	if(IMAGES_UPDATED.length > 0){
		var updated = {}
		$.each(IMAGES_UPDATED, function(i, e){
			updated[e] = IMAGES[e]
		})
		dumpJSON(name + '-images-diff.json', updated)
		IMAGES_UPDATED = []
	}
}


// Load a directory as-is
//
// XXX check if we need to pass down sorting settings to the generators...
function loadRawDir(path, no_preview_processing, prefix){
	prefix = prefix == null ? 'Data' : prefix
	prefix = prefix === false ? null : prefix

	var files = listDir(path)

	var res = $.Deferred()

	// filter images...
	var image_paths = $.map(files, function(e){
		return IMAGE_PATTERN.test(e) ? e : null
	})

	if(image_paths.length == 0){
		// no images in path...
		res.notify(prefix, 'Load', path, 'Error')
		return res.reject()
	}

	setBaseURL(path)

	IMAGES = imagesFromUrls(image_paths)
	res.notify(prefix, 'Loaded', 'Images.')
	IMAGES_CREATED = true

	DATA = dataFromImages(IMAGES)
	res.notify(prefix, 'Loaded', 'Data.')

	// XXX this will reload viewer...
	//updateRibbonsFromFavDirs()
	DATA.ribbons = ribbonsFromFavDirs(null, null, imageOrderCmp)
	res.notify(prefix, 'Loaded', 'Fav dirs.')

	MARKED = []

	reloadViewer()

	// read orientation form files...
	res.notify(prefix, 'Loading', 'Images orientation.')
	var o = updateImagesOrientationQ()
		.done(function(){
			res.notify(prefix, 'Loaded', 'Images orientation.')
		})

	// load/generate previews...
	if(!no_preview_processing){
		res.notify(prefix, 'Loading/Generating', 'Previews.')
		var p = makeImagesPreviewsQ()
			.done(function(){
				res.notify(prefix, 'Loaded', 'Previews.')
			})

	} else {
		var p = 0
	}

	// NOTE: we are not waiting for previews and orientation...
	return res.resolve()

	/* XXX do we need to make everyone wait for previews and orientation???
	$.when(o, p).done(function(){
		res.resolve()
	})
	return res
	*/
}


// Load a path
//
// This will try and do one of the following in order:
// 	1) look for a cache and load it,
// 	2) load data from within the directory
// 	3) load a directory as-is
// 		load fav dirs
//
// NOTE: this will create an images.json file in cache on opening an 
// 		un-cached dir (XXX is this correct???)
function loadDir(path, no_preview_processing, prefix){
	prefix = prefix == null ? 'Data' : prefix
	prefix = prefix === false ? null : prefix

	IMAGES_CREATED = false

	path = normalizePath(path)
	var orig_path = path
	var data

	var res = $.Deferred()

	res.notify(prefix, 'Loading', path)

	var files = listDir(path)

	if(files == null){
		//showErrorStatus('No files in path: ' + path)
		res.notify('load_error', path)
		return res.reject()
	}

	// see if there is a cache...
	if(files.indexOf(CACHE_DIR) >= 0){
		path = path +'/'+ CACHE_DIR
	}

	bubbleProgress(prefix, 
			loadFileState(path, false), res, true)
		.done(function(){
			res.resolve()
		})
		.fail(function(){
			bubbleProgress('Raw directory', loadRawDir(orig_path, no_preview_processing), res)
		})

	return res
}


// Load ribbon structure from fav directory tree
//
// XXX loads duplicate images....
function updateRibbonsFromFavDirs(){
	DATA.ribbons = ribbonsFromFavDirs(null, null, imageOrderCmp)
	sortImagesByDate()
	reloadViewer()
}


// Export current state to directory...
//
// XXX this copies the files in parallel, make it sync and sequential...
// 		...reason is simple, if we stop the copy we need to end up with 
// 		part of the files copied full rather than all partially...
function exportTo(path, im_name, dir_name, size){
	path = path == null ? BASE_URL : path
	im_name = im_name == null ? '%f' : im_name
	dir_name = dir_name == null ? 'fav' : dir_name
	size = size == null ? 1000 : size

	// starting point...
	//var deferred = $.Deferred().resolve()

	var base_path = path
	path = normalizePath(path)

	var order = DATA.order
	var Z = (('10e' + (order.length + '').length) * 1 + '').slice(2)

	// mainly used for file naming, gives us ability to number images 
	// in the current selection...
	var selection = []
	$.each(DATA.ribbons, function(_, e){
		selection = selection.concat(e)
	})
	selection.sort(imageOrderCmp)
	var z = (('10e' + (selection.length + '').length) * 1 + '').slice(2)

	// go through ribbons...
	for(var i=DATA.ribbons.length-1; i >= 0; i--){
		var ribbon = DATA.ribbons[i]
		// go through images...
		for(var j=0; j < ribbon.length; j++){
			var gid = ribbon[j]
			// get correct preview...
			var src = getBestPreview(gid, size).url
			var orig = IMAGES[gid].path.split('/').pop()

			// XXX might be a good idea to combine this with docs as a 
			// 		single mechanism...
			// form image name...
			var dest = im_name
			// full filename...
			dest = dest.replace('%f', orig)
			// file name w.o. ext...
			dest = dest.replace('%n', orig.split('.')[0])
			// ext...
			dest = dest.replace('%e', '.'+src.split('.').pop())
			// marked status...
			dest = dest.replace(/%\(([^)]*)\)m/, MARKED.indexOf(gid) >= 0 ? '$1' : '')
			// gid...
			dest = dest.replace('%gid', gid)
			dest = dest.replace('%g', gid.slice(34))
			// global order...
			var o = order.indexOf(gid) + ''
			dest = dest.replace('%I', (Z + o).slice(o.length))
			// current order...
			var o = selection.indexOf(gid) + ''
			dest = dest.replace('%i', (z + o).slice(o.length))
			// XXX Metadata...
			// XXX

			dest = path +'/'+ dest

			// copy... 
			copyFile(src, dest)
		}

		path = normalizePath(path +'/'+ dir_name)
	}
}



/*********************************************************************/

// NOTE: this will overwrite current image orientation...
//
// XXX this depends on getImageOrientation(...)
function updateImageOrientation(gid, no_update_loaded){
	gid = gid == null ? getImageGID() : gid
	var img = IMAGES[gid]

	return getImageOrientation(normalizePath(img.path))
		.done(function(o){
			var o_o = img.orientation
			var o_f = img.flipped

			img.orientation = o.orientation
			img.flipped = o.flipped

			// mark image dirty...
			if((o_o != o.orientation || o_f != o.flipped ) 
					&& IMAGES_UPDATED.indexOf(gid) < 0){
				IMAGES_UPDATED.push(gid)
			}

			// update image if loaded...
			if(!no_update_loaded){
				var o = getImage(gid)
				if(o.length > 0){
					updateImage(o)
				}
			}
		})
}


function updateImagesOrientation(gids, no_update_loaded){
	gids = gids == null ? getClosestGIDs() : gids
	var res = []

	$.each(gids, function(_, gid){
		res.push(updateImageOrientation(gid, no_update_loaded))
	})

	return $.when.apply(null, res)
}


// queued version of updateImagesOrientation(...)
//
// NOTE: this will ignore errors.
//
// XXX need a way to cancel this...
// 		- one way is to .reject(...) any of the still pending elements,
// 		  but there appears no way of getting the list out of when...
function updateImagesOrientationQ(gids, no_update_loaded){
	gids = gids == null ? getClosestGIDs() : gids
	//var res = []

	var last = $.Deferred().resolve()

	$.each(gids, function(_, gid){
		var cur = $.Deferred()
		last.done(function(){
			updateImageOrientation(gid, no_update_loaded)
				.done(function(o){ cur.resolve(o) })
				.fail(function(){ cur.resolve('fail') })
		})

		last = cur
		//res.push(cur)
	})

	// NOTE: .when(...) is used to add more introspecitve feedback...
	//return $.when.apply(null, res)
	return last
}



/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
