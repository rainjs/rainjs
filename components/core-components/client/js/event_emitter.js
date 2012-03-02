define(function() {
	function EventEmitter() {
		this.topics = {};
	}
	
	/**
	 * Listen on the given `topic` event with `fn`.
	 *
	 * @param {String} topic
	 * @param {Function} fn
	 * @param {Mixed} ... options for $.Callbacks handling
	 */
	
	EventEmitter.prototype.on = function(topic, fn) {
		if(!this.topics) {
			this.topics = {};
		}
		
		this.topics[topic] = this.topics[topic] || $.Callbacks().add(fn);		
	};
	
	/**
	 * Emit `topic` event with the given args.
	 *
	 * @param {String} topic
	 * @param {Mixed} ...
	 */
	
	EventEmitter.prototype.emit = function(topic) {
		if(!this.topics) {
			this.topics = {};
		}
		
		var args = Array.prototype.slice.call(arguments, 1), 
			callbacks = this.topics[topic];
				
		if(callbacks) {
			callbacks.fire(args);
		}
	};
	
	/**
	 * Method used to remove a specific function from the listeners list.
	 */
	EventEmitter.prototype.removeOn = function(topic, fn) {
		var callbacks = this.topics[topic];
		
		callbacks.remove(fn);
	};
	
	return EventEmitter;
});