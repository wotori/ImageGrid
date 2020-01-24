/**********************************************************************
* 
*
*
**********************************************************************/
((typeof define)[0]=='u'?function(f){module.exports=f(require)}:define)
(function(require){ var module={} // make module AMD/node compatible...
/*********************************************************************/

var keyboard = require('../keyboard')
var object = require('../object')



/*********************************************************************/
// helpers...

var proxyToDom =
module.proxyToDom = 
function(name){
	return function(...args){ 
		// bind functions to this...
		// XXX is this the right way to go???
		args = args
			.map(function(a){ 
				return a instanceof Function ? 
					a.bind(this) 
					: a 
			}.bind(this))

		name in this.dom ?
			// proxy handler...
			this.dom[name](...args)
			// on/trigger handlers...
			: this.dom.trigger(name, args) 

		return this 
	}
}

var eventToDom =
module.eventToDom = 
function(name, defaults){
	return function(){ 
		// register...
		if(arguments[0] instanceof Function){
			this.dom.trigger(name, [...arguments]) 

		// trigger...
		} else {
			var args = (arguments.length == 0 && defaults) ? 
				defaults.call(this) 
				: [...arguments]
			args = args instanceof Array ? args : [args]

			this.dom.trigger(name, args) 
		}
		return this 
	}
}


// XXX triggering events from here and from jQuery/dom has a 
// 		different effect...
var triggerEventWithSource =
module.triggerEventWithSource = 
function(){
	var args = [...arguments]
	var evt = args.shift()
	
	if(typeof(evt) == typeof('str')){
		evt = $.Event(evt)
	}

	evt.source = this

	args.splice(0, 0, evt)

	this.dom.trigger.apply(this.dom, args)
	return this 
}



/*********************************************************************/

var WidgetClassPrototype = {
	make: function(obj, client, options){
		console.error('Widget must define a .make method.')
	},
}


var WidgetPrototype = {
	// NOTE: this must have .data('widget-controller', this) set...
	dom: null,
	client: null,

	options: {
		keyboardRepeatPause: 100,

		nonPropagatedEvents: [
			'start',

			'click',
			'keydown',

			'close',
		],
	},

	keybindings: null,
	keyboard: null,

	// XXX triggering events from here and from jQuery/dom has a 
	// 		different effect...
	trigger: triggerEventWithSource,

	// proxy event api...
	on: proxyToDom('on'),
	one: proxyToDom('one'),
	off: proxyToDom('off'),
	bind: proxyToDom('bind'),
	unbind: proxyToDom('unbind'),
	deligate: proxyToDom('deligate'),
	undeligate: proxyToDom('undeligate'),

	// custom events...
	//
	start: function(handler){
		handler ?
			this.on('start', handler)
			:this.trigger('start')
		return this
	}, 
	// NOTE: this can be passed a string that can be used as a reason 
	// 		for closing... 
	close: function(a){
		// trigger...
		if(a == null || typeof(a) == typeof('str')){
			a = a || 'accept'
			this.parent.close 
				&& this.parent.close(a)
			this.trigger('close', a)

		// register new handler...
		} else {
			this.on('close', a)
		}
		return this
	},

	// XXX this will not:
	// 		- attach dom to parent... (???)
	// 		- handle focus... (???)
	// XXX same as ContainerPrototype.__init__ but skips client...
	__init__: function(parent, options){
		var that = this

		parent = this.parent = $(parent || 'body')
		options = options || {}

		this.keybindings = JSON.parse(JSON.stringify(this.keybindings))

		// merge options...
		var opts = Object.create(this.options)
		Object.keys(options).forEach(function(n){ opts[n] = options[n] })
		options = this.options = opts

		// build the dom...
		if(this.constructor.make){
			this.dom = this.constructor.make(this, options)

			this.dom.data('widget-controller', this)
		}

		// XXX do we do this here???
		/*
		if(parent && this.dom){
			parent.append(this.dom)
		}
		*/

		// add keyboard handler...
		if(this.keybindings && this.dom){
			this.keyboard = 
				this.keyboard || keyboard.KeyboardWithCSSModes(
						function(){ return that.keybindings },
						function(){ return that.dom })
			this.dom
				.keydown(
					keyboard.makePausableKeyboardHandler(
						this.keyboard,
						options.logKeys,
						this,
						function(){ return this.options.keyboardRepeatPause }))
		}

		if(this.options.nonPropagatedEvents != null){
			this.on(this.options.nonPropagatedEvents.join(' '), 
				function(evt){ evt.stopPropagation() })
		}

		return this
	},
}


var Widget = 
module.Widget = 
object.Constructor('Widget', 
		WidgetClassPrototype, 
		WidgetPrototype)



/*********************************************************************/

var ContainerClassPrototype = {
}


var ContainerPrototype = {
	// NOTE: this must have .data('widget-controller', this) set...
	dom: null,

	focus: function(handler){
		if(handler != null){
			this.on('focus', handler)

		} else {
			this.dom.focus()
			this.client
				&& this.client.focus 
				&& this.client.focus()
		}
		return this
	},

	// XXX this is the same as WidgetPrototype.__init__ but also handles
	// 		the client...
	__init__: function(parent, client, options){
		var that = this

		parent = this.parent = $(parent || 'body')
		options = options || {}

		this.keybindings = JSON.parse(JSON.stringify(this.keybindings))

		this.client = client
		client.parent = this

		// merge options...
		var opts = Object.create(this.options)
		Object.keys(options).forEach(function(n){ opts[n] = options[n] })
		options = this.options = opts

		// build the dom...
		if(this.constructor.make){
			this.dom = this.constructor
				.make(this, client.dom || client, options)

			this.dom.data('widget-controller', this)
		}

		// add keyboard handler...
		if(this.keybindings && this.dom){
			this.keyboard = 
				this.keyboard || keyboard.KeyboardWithCSSModes(
						function(){ return that.keybindings },
						function(){ return that.dom })
			this.dom
				.keydown(
					keyboard.makePausableKeyboardHandler(
						this.keyboard,
						options.logKeys,
						this,
						function(){ return this.options.keyboardRepeatPause }))
		}

		if(this.options.nonPropagatedEvents != null){
			this.on(this.options.nonPropagatedEvents.join(' '), 
				function(evt){ evt.stopPropagation() })
		}

		return this
	},
}


var Container = 
module.Container = 
object.Constructor('Container', 
		ContainerClassPrototype, 
		ContainerPrototype)

Container.prototype.__proto__ = Widget.prototype



/**********************************************************************
* vim:set ts=4 sw=4 :                               */ return module })
