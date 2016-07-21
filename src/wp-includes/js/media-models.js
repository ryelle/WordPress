(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var $ = jQuery,
	Attachment, Attachments, l10n, media;

window.wp = window.wp || {};

/**
 * Create and return a media frame.
 *
 * Handles the default media experience.
 *
 * @param  {object} attributes The properties passed to the main media controller.
 * @return {wp.media.view.MediaFrame} A media workflow.
 */
media = wp.media = function( attributes ) {
	var MediaFrame = media.view.MediaFrame,
		frame;

	if ( ! MediaFrame ) {
		return;
	}

	attributes = _.defaults( attributes || {}, {
		frame: 'select'
	});

	if ( 'select' === attributes.frame && MediaFrame.Select ) {
		frame = new MediaFrame.Select( attributes );
	} else if ( 'post' === attributes.frame && MediaFrame.Post ) {
		frame = new MediaFrame.Post( attributes );
	} else if ( 'manage' === attributes.frame && MediaFrame.Manage ) {
		frame = new MediaFrame.Manage( attributes );
	} else if ( 'image' === attributes.frame && MediaFrame.ImageDetails ) {
		frame = new MediaFrame.ImageDetails( attributes );
	} else if ( 'audio' === attributes.frame && MediaFrame.AudioDetails ) {
		frame = new MediaFrame.AudioDetails( attributes );
	} else if ( 'video' === attributes.frame && MediaFrame.VideoDetails ) {
		frame = new MediaFrame.VideoDetails( attributes );
	} else if ( 'edit-attachments' === attributes.frame && MediaFrame.EditAttachments ) {
		frame = new MediaFrame.EditAttachments( attributes );
	}

	delete attributes.frame;

	media.frame = frame;

	return frame;
};

_.extend( media, { model: {}, view: {}, controller: {}, frames: {} });

// Link any localized strings.
l10n = media.model.l10n = window._wpMediaModelsL10n || {};

// Link any settings.
media.model.settings = l10n.settings || {};
delete l10n.settings;

Attachment = media.model.Attachment = require( './models/attachment.js' );
Attachments = media.model.Attachments = require( './models/attachments.js' );

media.model.Query = require( './models/query.js' );
media.model.PostImage = require( './models/post-image.js' );
media.model.Selection = require( './models/selection.js' );

/**
 * ========================================================================
 * UTILITIES
 * ========================================================================
 */

/**
 * A basic equality comparator for Backbone models.
 *
 * Used to order models within a collection - @see wp.media.model.Attachments.comparator().
 *
 * @param  {mixed}  a  The primary parameter to compare.
 * @param  {mixed}  b  The primary parameter to compare.
 * @param  {string} ac The fallback parameter to compare, a's cid.
 * @param  {string} bc The fallback parameter to compare, b's cid.
 * @return {number}    -1: a should come before b.
 *                      0: a and b are of the same rank.
 *                      1: b should come before a.
 */
media.compare = function( a, b, ac, bc ) {
	if ( _.isEqual( a, b ) ) {
		return ac === bc ? 0 : (ac > bc ? -1 : 1);
	} else {
		return a > b ? -1 : 1;
	}
};

_.extend( media, {
	/**
	 * media.template( id )
	 *
	 * Fetch a JavaScript template for an id, and return a templating function for it.
	 *
	 * See wp.template() in `wp-includes/js/wp-util.js`.
	 *
	 * @borrows wp.template as template
	 */
	template: wp.template,

	/**
	 * media.post( [action], [data] )
	 *
	 * Sends a POST request to WordPress.
	 * See wp.ajax.post() in `wp-includes/js/wp-util.js`.
	 *
	 * @borrows wp.ajax.post as post
	 */
	post: wp.ajax.post,

	/**
	 * media.ajax( [action], [options] )
	 *
	 * Sends an XHR request to WordPress.
	 * See wp.ajax.send() in `wp-includes/js/wp-util.js`.
	 *
	 * @borrows wp.ajax.send as ajax
	 */
	ajax: wp.ajax.send,

	/**
	 * Scales a set of dimensions to fit within bounding dimensions.
	 *
	 * @param {Object} dimensions
	 * @returns {Object}
	 */
	fit: function( dimensions ) {
		var width     = dimensions.width,
			height    = dimensions.height,
			maxWidth  = dimensions.maxWidth,
			maxHeight = dimensions.maxHeight,
			constraint;

		// Compare ratios between the two values to determine which
		// max to constrain by. If a max value doesn't exist, then the
		// opposite side is the constraint.
		if ( ! _.isUndefined( maxWidth ) && ! _.isUndefined( maxHeight ) ) {
			constraint = ( width / height > maxWidth / maxHeight ) ? 'width' : 'height';
		} else if ( _.isUndefined( maxHeight ) ) {
			constraint = 'width';
		} else if (  _.isUndefined( maxWidth ) && height > maxHeight ) {
			constraint = 'height';
		}

		// If the value of the constrained side is larger than the max,
		// then scale the values. Otherwise return the originals; they fit.
		if ( 'width' === constraint && width > maxWidth ) {
			return {
				width : maxWidth,
				height: Math.round( maxWidth * height / width )
			};
		} else if ( 'height' === constraint && height > maxHeight ) {
			return {
				width : Math.round( maxHeight * width / height ),
				height: maxHeight
			};
		} else {
			return {
				width : width,
				height: height
			};
		}
	},
	/**
	 * Truncates a string by injecting an ellipsis into the middle.
	 * Useful for filenames.
	 *
	 * @param {String} string
	 * @param {Number} [length=30]
	 * @param {String} [replacement=&hellip;]
	 * @returns {String} The string, unless length is greater than string.length.
	 */
	truncate: function( string, length, replacement ) {
		length = length || 30;
		replacement = replacement || '&hellip;';

		if ( string.length <= length ) {
			return string;
		}

		return string.substr( 0, length / 2 ) + replacement + string.substr( -1 * length / 2 );
	}
});

/**
 * ========================================================================
 * MODELS
 * ========================================================================
 */
/**
 * wp.media.attachment
 *
 * @static
 * @param {String} id A string used to identify a model.
 * @returns {wp.media.model.Attachment}
 */
media.attachment = function( id ) {
	return Attachment.get( id );
};

/**
 * A collection of all attachments that have been fetched from the server.
 *
 * @static
 * @member {wp.media.model.Attachments}
 */
Attachments.all = new Attachments();

/**
 * wp.media.query
 *
 * Shorthand for creating a new Attachments Query.
 *
 * @param {object} [props]
 * @returns {wp.media.model.Attachments}
 */
media.query = function( props ) {
	return new Attachments( null, {
		props: _.extend( _.defaults( props || {}, { orderby: 'date' } ), { query: true } )
	});
};

// Clean up. Prevents mobile browsers caching
$(window).on('unload', function(){
	window.wp = null;
});

},{"./models/attachment.js":2,"./models/attachments.js":3,"./models/post-image.js":4,"./models/query.js":5,"./models/selection.js":6}],2:[function(require,module,exports){
/**
 * wp.media.model.Attachment
 *
 * @class
 * @augments Backbone.Model
 */
var $ = Backbone.$,
	Attachment;

Attachment = Backbone.Model.extend({
	/**
	 * Triggered when attachment details change
	 * Overrides Backbone.Model.sync
	 *
	 * @param {string} method
	 * @param {wp.media.model.Attachment} model
	 * @param {Object} [options={}]
	 *
	 * @returns {Promise}
	 */
	sync: function( method, model, options ) {
		// If the attachment does not yet have an `id`, return an instantly
		// rejected promise. Otherwise, all of our requests will fail.
		if ( _.isUndefined( this.id ) ) {
			return $.Deferred().rejectWith( this ).promise();
		}

		// Overload the `read` request so Attachment.fetch() functions correctly.
		if ( 'read' === method ) {
			options = options || {};
			options.context = this;
			options.data = _.extend( options.data || {}, {
				action: 'get-attachment',
				id: this.id
			});
			return wp.media.ajax( options );

		// Overload the `update` request so properties can be saved.
		} else if ( 'update' === method ) {
			// If we do not have the necessary nonce, fail immeditately.
			if ( ! this.get('nonces') || ! this.get('nonces').update ) {
				return $.Deferred().rejectWith( this ).promise();
			}

			options = options || {};
			options.context = this;

			// Set the action and ID.
			options.data = _.extend( options.data || {}, {
				action:  'save-attachment',
				id:      this.id,
				nonce:   this.get('nonces').update,
				post_id: wp.media.model.settings.post.id
			});

			// Record the values of the changed attributes.
			if ( model.hasChanged() ) {
				options.data.changes = {};

				_.each( model.changed, function( value, key ) {
					options.data.changes[ key ] = this.get( key );
				}, this );
			}

			return wp.media.ajax( options );

		// Overload the `delete` request so attachments can be removed.
		// This will permanently delete an attachment.
		} else if ( 'delete' === method ) {
			options = options || {};

			if ( ! options.wait ) {
				this.destroyed = true;
			}

			options.context = this;
			options.data = _.extend( options.data || {}, {
				action:   'delete-post',
				id:       this.id,
				_wpnonce: this.get('nonces')['delete']
			});

			return wp.media.ajax( options ).done( function() {
				this.destroyed = true;
			}).fail( function() {
				this.destroyed = false;
			});

		// Otherwise, fall back to `Backbone.sync()`.
		} else {
			/**
			 * Call `sync` directly on Backbone.Model
			 */
			return Backbone.Model.prototype.sync.apply( this, arguments );
		}
	},
	/**
	 * Convert date strings into Date objects.
	 *
	 * @param {Object} resp The raw response object, typically returned by fetch()
	 * @returns {Object} The modified response object, which is the attributes hash
	 *    to be set on the model.
	 */
	parse: function( resp ) {
		if ( ! resp ) {
			return resp;
		}

		resp.date = new Date( resp.date );
		resp.modified = new Date( resp.modified );
		return resp;
	},
	/**
	 * @param {Object} data The properties to be saved.
	 * @param {Object} options Sync options. e.g. patch, wait, success, error.
	 *
	 * @this Backbone.Model
	 *
	 * @returns {Promise}
	 */
	saveCompat: function( data, options ) {
		var model = this;

		// If we do not have the necessary nonce, fail immeditately.
		if ( ! this.get('nonces') || ! this.get('nonces').update ) {
			return $.Deferred().rejectWith( this ).promise();
		}

		return wp.media.post( 'save-attachment-compat', _.defaults({
			id:      this.id,
			nonce:   this.get('nonces').update,
			post_id: wp.media.model.settings.post.id
		}, data ) ).done( function( resp, status, xhr ) {
			model.set( model.parse( resp, xhr ), options );
		});
	}
}, {
	/**
	 * Create a new model on the static 'all' attachments collection and return it.
	 *
	 * @static
	 * @param {Object} attrs
	 * @returns {wp.media.model.Attachment}
	 */
	create: function( attrs ) {
		var Attachments = wp.media.model.Attachments;
		return Attachments.all.push( attrs );
	},
	/**
	 * Create a new model on the static 'all' attachments collection and return it.
	 *
	 * If this function has already been called for the id,
	 * it returns the specified attachment.
	 *
	 * @static
	 * @param {string} id A string used to identify a model.
	 * @param {Backbone.Model|undefined} attachment
	 * @returns {wp.media.model.Attachment}
	 */
	get: _.memoize( function( id, attachment ) {
		var Attachments = wp.media.model.Attachments;
		return Attachments.all.push( attachment || { id: id } );
	})
});

module.exports = Attachment;

},{}],3:[function(require,module,exports){
/**
 * wp.media.model.Attachments
 *
 * A collection of attachments.
 *
 * This collection has no persistence with the server without supplying
 * 'options.props.query = true', which will mirror the collection
 * to an Attachments Query collection - @see wp.media.model.Attachments.mirror().
 *
 * @class
 * @augments Backbone.Collection
 *
 * @param {array}  [models]                Models to initialize with the collection.
 * @param {object} [options]               Options hash for the collection.
 * @param {string} [options.props]         Options hash for the initial query properties.
 * @param {string} [options.props.order]   Initial order (ASC or DESC) for the collection.
 * @param {string} [options.props.orderby] Initial attribute key to order the collection by.
 * @param {string} [options.props.query]   Whether the collection is linked to an attachments query.
 * @param {string} [options.observe]
 * @param {string} [options.filters]
 *
 */
var Attachments = Backbone.Collection.extend({
	/**
	 * @type {wp.media.model.Attachment}
	 */
	model: wp.media.model.Attachment,
	/**
	 * @param {Array} [models=[]] Array of models used to populate the collection.
	 * @param {Object} [options={}]
	 */
	initialize: function( models, options ) {
		options = options || {};

		this.props   = new Backbone.Model();
		this.filters = options.filters || {};

		// Bind default `change` events to the `props` model.
		this.props.on( 'change', this._changeFilteredProps, this );

		this.props.on( 'change:order',   this._changeOrder,   this );
		this.props.on( 'change:orderby', this._changeOrderby, this );
		this.props.on( 'change:query',   this._changeQuery,   this );

		this.props.set( _.defaults( options.props || {} ) );

		if ( options.observe ) {
			this.observe( options.observe );
		}
	},
	/**
	 * Sort the collection when the order attribute changes.
	 *
	 * @access private
	 */
	_changeOrder: function() {
		if ( this.comparator ) {
			this.sort();
		}
	},
	/**
	 * Set the default comparator only when the `orderby` property is set.
	 *
	 * @access private
	 *
	 * @param {Backbone.Model} model
	 * @param {string} orderby
	 */
	_changeOrderby: function( model, orderby ) {
		// If a different comparator is defined, bail.
		if ( this.comparator && this.comparator !== Attachments.comparator ) {
			return;
		}

		if ( orderby && 'post__in' !== orderby ) {
			this.comparator = Attachments.comparator;
		} else {
			delete this.comparator;
		}
	},
	/**
	 * If the `query` property is set to true, query the server using
	 * the `props` values, and sync the results to this collection.
	 *
	 * @access private
	 *
	 * @param {Backbone.Model} model
	 * @param {Boolean} query
	 */
	_changeQuery: function( model, query ) {
		if ( query ) {
			this.props.on( 'change', this._requery, this );
			this._requery();
		} else {
			this.props.off( 'change', this._requery, this );
		}
	},
	/**
	 * @access private
	 *
	 * @param {Backbone.Model} model
	 */
	_changeFilteredProps: function( model ) {
		// If this is a query, updating the collection will be handled by
		// `this._requery()`.
		if ( this.props.get('query') ) {
			return;
		}

		var changed = _.chain( model.changed ).map( function( t, prop ) {
			var filter = Attachments.filters[ prop ],
				term = model.get( prop );

			if ( ! filter ) {
				return;
			}

			if ( term && ! this.filters[ prop ] ) {
				this.filters[ prop ] = filter;
			} else if ( ! term && this.filters[ prop ] === filter ) {
				delete this.filters[ prop ];
			} else {
				return;
			}

			// Record the change.
			return true;
		}, this ).any().value();

		if ( ! changed ) {
			return;
		}

		// If no `Attachments` model is provided to source the searches
		// from, then automatically generate a source from the existing
		// models.
		if ( ! this._source ) {
			this._source = new Attachments( this.models );
		}

		this.reset( this._source.filter( this.validator, this ) );
	},

	validateDestroyed: false,
	/**
	 * Checks whether an attachment is valid.
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @returns {Boolean}
	 */
	validator: function( attachment ) {
		if ( ! this.validateDestroyed && attachment.destroyed ) {
			return false;
		}
		return _.all( this.filters, function( filter ) {
			return !! filter.call( this, attachment );
		}, this );
	},
	/**
	 * Add or remove an attachment to the collection depending on its validity.
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @param {Object} options
	 * @returns {wp.media.model.Attachments} Returns itself to allow chaining
	 */
	validate: function( attachment, options ) {
		var valid = this.validator( attachment ),
			hasAttachment = !! this.get( attachment.cid );

		if ( ! valid && hasAttachment ) {
			this.remove( attachment, options );
		} else if ( valid && ! hasAttachment ) {
			this.add( attachment, options );
		}

		return this;
	},

	/**
	 * Add or remove all attachments from another collection depending on each one's validity.
	 *
	 * @param {wp.media.model.Attachments} attachments
	 * @param {object} [options={}]
	 *
	 * @fires wp.media.model.Attachments#reset
	 *
	 * @returns {wp.media.model.Attachments} Returns itself to allow chaining
	 */
	validateAll: function( attachments, options ) {
		options = options || {};

		_.each( attachments.models, function( attachment ) {
			this.validate( attachment, { silent: true });
		}, this );

		if ( ! options.silent ) {
			this.trigger( 'reset', this, options );
		}
		return this;
	},
	/**
	 * Start observing another attachments collection change events
	 * and replicate them on this collection.
	 *
	 * @param {wp.media.model.Attachments} The attachments collection to observe.
	 * @returns {wp.media.model.Attachments} Returns itself to allow chaining.
	 */
	observe: function( attachments ) {
		this.observers = this.observers || [];
		this.observers.push( attachments );

		attachments.on( 'add change remove', this._validateHandler, this );
		attachments.on( 'reset', this._validateAllHandler, this );
		this.validateAll( attachments );
		return this;
	},
	/**
	 * Stop replicating collection change events from another attachments collection.
	 *
	 * @param {wp.media.model.Attachments} The attachments collection to stop observing.
	 * @returns {wp.media.model.Attachments} Returns itself to allow chaining
	 */
	unobserve: function( attachments ) {
		if ( attachments ) {
			attachments.off( null, null, this );
			this.observers = _.without( this.observers, attachments );

		} else {
			_.each( this.observers, function( attachments ) {
				attachments.off( null, null, this );
			}, this );
			delete this.observers;
		}

		return this;
	},
	/**
	 * @access private
	 *
	 * @param {wp.media.model.Attachments} attachment
	 * @param {wp.media.model.Attachments} attachments
	 * @param {Object} options
	 *
	 * @returns {wp.media.model.Attachments} Returns itself to allow chaining
	 */
	_validateHandler: function( attachment, attachments, options ) {
		// If we're not mirroring this `attachments` collection,
		// only retain the `silent` option.
		options = attachments === this.mirroring ? options : {
			silent: options && options.silent
		};

		return this.validate( attachment, options );
	},
	/**
	 * @access private
	 *
	 * @param {wp.media.model.Attachments} attachments
	 * @param {Object} options
	 * @returns {wp.media.model.Attachments} Returns itself to allow chaining
	 */
	_validateAllHandler: function( attachments, options ) {
		return this.validateAll( attachments, options );
	},
	/**
	 * Start mirroring another attachments collection, clearing out any models already
	 * in the collection.
	 *
	 * @param {wp.media.model.Attachments} The attachments collection to mirror.
	 * @returns {wp.media.model.Attachments} Returns itself to allow chaining
	 */
	mirror: function( attachments ) {
		if ( this.mirroring && this.mirroring === attachments ) {
			return this;
		}

		this.unmirror();
		this.mirroring = attachments;

		// Clear the collection silently. A `reset` event will be fired
		// when `observe()` calls `validateAll()`.
		this.reset( [], { silent: true } );
		this.observe( attachments );

		return this;
	},
	/**
	 * Stop mirroring another attachments collection.
	 */
	unmirror: function() {
		if ( ! this.mirroring ) {
			return;
		}

		this.unobserve( this.mirroring );
		delete this.mirroring;
	},
	/**
	 * Retrive more attachments from the server for the collection.
	 *
	 * Only works if the collection is mirroring a Query Attachments collection,
	 * and forwards to its `more` method. This collection class doesn't have
	 * server persistence by itself.
	 *
	 * @param {object} options
	 * @returns {Promise}
	 */
	more: function( options ) {
		var deferred = jQuery.Deferred(),
			mirroring = this.mirroring,
			attachments = this;

		if ( ! mirroring || ! mirroring.more ) {
			return deferred.resolveWith( this ).promise();
		}
		// If we're mirroring another collection, forward `more` to
		// the mirrored collection. Account for a race condition by
		// checking if we're still mirroring that collection when
		// the request resolves.
		mirroring.more( options ).done( function() {
			if ( this === attachments.mirroring ) {
				deferred.resolveWith( this );
			}
		});

		return deferred.promise();
	},
	/**
	 * Whether there are more attachments that haven't been sync'd from the server
	 * that match the collection's query.
	 *
	 * Only works if the collection is mirroring a Query Attachments collection,
	 * and forwards to its `hasMore` method. This collection class doesn't have
	 * server persistence by itself.
	 *
	 * @returns {boolean}
	 */
	hasMore: function() {
		return this.mirroring ? this.mirroring.hasMore() : false;
	},
	/**
	 * A custom AJAX-response parser.
	 *
	 * See trac ticket #24753
	 *
	 * @param {Object|Array} resp The raw response Object/Array.
	 * @param {Object} xhr
	 * @returns {Array} The array of model attributes to be added to the collection
	 */
	parse: function( resp, xhr ) {
		if ( ! _.isArray( resp ) ) {
			resp = [resp];
		}

		return _.map( resp, function( attrs ) {
			var id, attachment, newAttributes;

			if ( attrs instanceof Backbone.Model ) {
				id = attrs.get( 'id' );
				attrs = attrs.attributes;
			} else {
				id = attrs.id;
			}

			attachment = wp.media.model.Attachment.get( id );
			newAttributes = attachment.parse( attrs, xhr );

			if ( ! _.isEqual( attachment.attributes, newAttributes ) ) {
				attachment.set( newAttributes );
			}

			return attachment;
		});
	},
	/**
	 * If the collection is a query, create and mirror an Attachments Query collection.
	 *
	 * @access private
	 */
	_requery: function( refresh ) {
		var props;
		if ( this.props.get('query') ) {
			props = this.props.toJSON();
			props.cache = ( true !== refresh );
			this.mirror( wp.media.model.Query.get( props ) );
		}
	},
	/**
	 * If this collection is sorted by `menuOrder`, recalculates and saves
	 * the menu order to the database.
	 *
	 * @returns {undefined|Promise}
	 */
	saveMenuOrder: function() {
		if ( 'menuOrder' !== this.props.get('orderby') ) {
			return;
		}

		// Removes any uploading attachments, updates each attachment's
		// menu order, and returns an object with an { id: menuOrder }
		// mapping to pass to the request.
		var attachments = this.chain().filter( function( attachment ) {
			return ! _.isUndefined( attachment.id );
		}).map( function( attachment, index ) {
			// Indices start at 1.
			index = index + 1;
			attachment.set( 'menuOrder', index );
			return [ attachment.id, index ];
		}).object().value();

		if ( _.isEmpty( attachments ) ) {
			return;
		}

		return wp.media.post( 'save-attachment-order', {
			nonce:       wp.media.model.settings.post.nonce,
			post_id:     wp.media.model.settings.post.id,
			attachments: attachments
		});
	}
}, {
	/**
	 * A function to compare two attachment models in an attachments collection.
	 *
	 * Used as the default comparator for instances of wp.media.model.Attachments
	 * and its subclasses. @see wp.media.model.Attachments._changeOrderby().
	 *
	 * @static
	 *
	 * @param {Backbone.Model} a
	 * @param {Backbone.Model} b
	 * @param {Object} options
	 * @returns {Number} -1 if the first model should come before the second,
	 *    0 if they are of the same rank and
	 *    1 if the first model should come after.
	 */
	comparator: function( a, b, options ) {
		var key   = this.props.get('orderby'),
			order = this.props.get('order') || 'DESC',
			ac    = a.cid,
			bc    = b.cid;

		a = a.get( key );
		b = b.get( key );

		if ( 'date' === key || 'modified' === key ) {
			a = a || new Date();
			b = b || new Date();
		}

		// If `options.ties` is set, don't enforce the `cid` tiebreaker.
		if ( options && options.ties ) {
			ac = bc = null;
		}

		return ( 'DESC' === order ) ? wp.media.compare( a, b, ac, bc ) : wp.media.compare( b, a, bc, ac );
	},
	/**
	 * @namespace
	 */
	filters: {
		/**
		 * @static
		 * Note that this client-side searching is *not* equivalent
		 * to our server-side searching.
		 *
		 * @param {wp.media.model.Attachment} attachment
		 *
		 * @this wp.media.model.Attachments
		 *
		 * @returns {Boolean}
		 */
		search: function( attachment ) {
			if ( ! this.props.get('search') ) {
				return true;
			}

			return _.any(['title','filename','description','caption','name'], function( key ) {
				var value = attachment.get( key );
				return value && -1 !== value.search( this.props.get('search') );
			}, this );
		},
		/**
		 * @static
		 * @param {wp.media.model.Attachment} attachment
		 *
		 * @this wp.media.model.Attachments
		 *
		 * @returns {Boolean}
		 */
		type: function( attachment ) {
			var type = this.props.get('type'), atts = attachment.toJSON(), mime, found;

			if ( ! type || ( _.isArray( type ) && ! type.length ) ) {
				return true;
			}

			mime = atts.mime || ( atts.file && atts.file.type ) || '';

			if ( _.isArray( type ) ) {
				found = _.find( type, function (t) {
					return -1 !== mime.indexOf( t );
				} );
			} else {
				found = -1 !== mime.indexOf( type );
			}

			return found;
		},
		/**
		 * @static
		 * @param {wp.media.model.Attachment} attachment
		 *
		 * @this wp.media.model.Attachments
		 *
		 * @returns {Boolean}
		 */
		uploadedTo: function( attachment ) {
			var uploadedTo = this.props.get('uploadedTo');
			if ( _.isUndefined( uploadedTo ) ) {
				return true;
			}

			return uploadedTo === attachment.get('uploadedTo');
		},
		/**
		 * @static
		 * @param {wp.media.model.Attachment} attachment
		 *
		 * @this wp.media.model.Attachments
		 *
		 * @returns {Boolean}
		 */
		status: function( attachment ) {
			var status = this.props.get('status');
			if ( _.isUndefined( status ) ) {
				return true;
			}

			return status === attachment.get('status');
		}
	}
});

module.exports = Attachments;

},{}],4:[function(require,module,exports){
/**
 * wp.media.model.PostImage
 *
 * An instance of an image that's been embedded into a post.
 *
 * Used in the embedded image attachment display settings modal - @see wp.media.view.MediaFrame.ImageDetails.
 *
 * @class
 * @augments Backbone.Model
 *
 * @param {int} [attributes]               Initial model attributes.
 * @param {int} [attributes.attachment_id] ID of the attachment.
 **/
var PostImage = Backbone.Model.extend({

	initialize: function( attributes ) {
		var Attachment = wp.media.model.Attachment;
		this.attachment = false;

		if ( attributes.attachment_id ) {
			this.attachment = Attachment.get( attributes.attachment_id );
			if ( this.attachment.get( 'url' ) ) {
				this.dfd = jQuery.Deferred();
				this.dfd.resolve();
			} else {
				this.dfd = this.attachment.fetch();
			}
			this.bindAttachmentListeners();
		}

		// keep url in sync with changes to the type of link
		this.on( 'change:link', this.updateLinkUrl, this );
		this.on( 'change:size', this.updateSize, this );

		this.setLinkTypeFromUrl();
		this.setAspectRatio();

		this.set( 'originalUrl', attributes.url );
	},

	bindAttachmentListeners: function() {
		this.listenTo( this.attachment, 'sync', this.setLinkTypeFromUrl );
		this.listenTo( this.attachment, 'sync', this.setAspectRatio );
		this.listenTo( this.attachment, 'change', this.updateSize );
	},

	changeAttachment: function( attachment, props ) {
		this.stopListening( this.attachment );
		this.attachment = attachment;
		this.bindAttachmentListeners();

		this.set( 'attachment_id', this.attachment.get( 'id' ) );
		this.set( 'caption', this.attachment.get( 'caption' ) );
		this.set( 'alt', this.attachment.get( 'alt' ) );
		this.set( 'size', props.get( 'size' ) );
		this.set( 'align', props.get( 'align' ) );
		this.set( 'link', props.get( 'link' ) );
		this.updateLinkUrl();
		this.updateSize();
	},

	setLinkTypeFromUrl: function() {
		var linkUrl = this.get( 'linkUrl' ),
			type;

		if ( ! linkUrl ) {
			this.set( 'link', 'none' );
			return;
		}

		// default to custom if there is a linkUrl
		type = 'custom';

		if ( this.attachment ) {
			if ( this.attachment.get( 'url' ) === linkUrl ) {
				type = 'file';
			} else if ( this.attachment.get( 'link' ) === linkUrl ) {
				type = 'post';
			}
		} else {
			if ( this.get( 'url' ) === linkUrl ) {
				type = 'file';
			}
		}

		this.set( 'link', type );
	},

	updateLinkUrl: function() {
		var link = this.get( 'link' ),
			url;

		switch( link ) {
			case 'file':
				if ( this.attachment ) {
					url = this.attachment.get( 'url' );
				} else {
					url = this.get( 'url' );
				}
				this.set( 'linkUrl', url );
				break;
			case 'post':
				this.set( 'linkUrl', this.attachment.get( 'link' ) );
				break;
			case 'none':
				this.set( 'linkUrl', '' );
				break;
		}
	},

	updateSize: function() {
		var size;

		if ( ! this.attachment ) {
			return;
		}

		if ( this.get( 'size' ) === 'custom' ) {
			this.set( 'width', this.get( 'customWidth' ) );
			this.set( 'height', this.get( 'customHeight' ) );
			this.set( 'url', this.get( 'originalUrl' ) );
			return;
		}

		size = this.attachment.get( 'sizes' )[ this.get( 'size' ) ];

		if ( ! size ) {
			return;
		}

		this.set( 'url', size.url );
		this.set( 'width', size.width );
		this.set( 'height', size.height );
	},

	setAspectRatio: function() {
		var full;

		if ( this.attachment && this.attachment.get( 'sizes' ) ) {
			full = this.attachment.get( 'sizes' ).full;

			if ( full ) {
				this.set( 'aspectRatio', full.width / full.height );
				return;
			}
		}

		this.set( 'aspectRatio', this.get( 'customWidth' ) / this.get( 'customHeight' ) );
	}
});

module.exports = PostImage;

},{}],5:[function(require,module,exports){
/**
 * wp.media.model.Query
 *
 * A collection of attachments that match the supplied query arguments.
 *
 * Note: Do NOT change this.args after the query has been initialized.
 *       Things will break.
 *
 * @class
 * @augments wp.media.model.Attachments
 * @augments Backbone.Collection
 *
 * @param {array}  [models]                      Models to initialize with the collection.
 * @param {object} [options]                     Options hash.
 * @param {object} [options.args]                Attachments query arguments.
 * @param {object} [options.args.posts_per_page]
 */
var Attachments = wp.media.model.Attachments,
	Query;

Query = Attachments.extend({
	/**
	 * @global wp.Uploader
	 *
	 * @param {array}  [models=[]]  Array of initial models to populate the collection.
	 * @param {object} [options={}]
	 */
	initialize: function( models, options ) {
		var allowed;

		options = options || {};
		Attachments.prototype.initialize.apply( this, arguments );

		this.args     = options.args;
		this._hasMore = true;
		this.created  = new Date();

		this.filters.order = function( attachment ) {
			var orderby = this.props.get('orderby'),
				order = this.props.get('order');

			if ( ! this.comparator ) {
				return true;
			}

			// We want any items that can be placed before the last
			// item in the set. If we add any items after the last
			// item, then we can't guarantee the set is complete.
			if ( this.length ) {
				return 1 !== this.comparator( attachment, this.last(), { ties: true });

			// Handle the case where there are no items yet and
			// we're sorting for recent items. In that case, we want
			// changes that occurred after we created the query.
			} else if ( 'DESC' === order && ( 'date' === orderby || 'modified' === orderby ) ) {
				return attachment.get( orderby ) >= this.created;

			// If we're sorting by menu order and we have no items,
			// accept any items that have the default menu order (0).
			} else if ( 'ASC' === order && 'menuOrder' === orderby ) {
				return attachment.get( orderby ) === 0;
			}

			// Otherwise, we don't want any items yet.
			return false;
		};

		// Observe the central `wp.Uploader.queue` collection to watch for
		// new matches for the query.
		//
		// Only observe when a limited number of query args are set. There
		// are no filters for other properties, so observing will result in
		// false positives in those queries.
		allowed = [ 's', 'order', 'orderby', 'posts_per_page', 'post_mime_type', 'post_parent' ];
		if ( wp.Uploader && _( this.args ).chain().keys().difference( allowed ).isEmpty().value() ) {
			this.observe( wp.Uploader.queue );
		}
	},
	/**
	 * Whether there are more attachments that haven't been sync'd from the server
	 * that match the collection's query.
	 *
	 * @returns {boolean}
	 */
	hasMore: function() {
		return this._hasMore;
	},
	/**
	 * Fetch more attachments from the server for the collection.
	 *
	 * @param   {object}  [options={}]
	 * @returns {Promise}
	 */
	more: function( options ) {
		var query = this;

		// If there is already a request pending, return early with the Deferred object.
		if ( this._more && 'pending' === this._more.state() ) {
			return this._more;
		}

		if ( ! this.hasMore() ) {
			return jQuery.Deferred().resolveWith( this ).promise();
		}

		options = options || {};
		options.remove = false;

		return this._more = this.fetch( options ).done( function( resp ) {
			if ( _.isEmpty( resp ) || -1 === this.args.posts_per_page || resp.length < this.args.posts_per_page ) {
				query._hasMore = false;
			}
		});
	},
	/**
	 * Overrides Backbone.Collection.sync
	 * Overrides wp.media.model.Attachments.sync
	 *
	 * @param {String} method
	 * @param {Backbone.Model} model
	 * @param {Object} [options={}]
	 * @returns {Promise}
	 */
	sync: function( method, model, options ) {
		var args, fallback;

		// Overload the read method so Attachment.fetch() functions correctly.
		if ( 'read' === method ) {
			options = options || {};
			options.context = this;
			options.data = _.extend( options.data || {}, {
				action:  'query-attachments',
				post_id: wp.media.model.settings.post.id
			});

			// Clone the args so manipulation is non-destructive.
			args = _.clone( this.args );

			// Determine which page to query.
			if ( -1 !== args.posts_per_page ) {
				args.paged = Math.round( this.length / args.posts_per_page ) + 1;
			}

			options.data.query = args;
			return wp.media.ajax( options );

		// Otherwise, fall back to Backbone.sync()
		} else {
			/**
			 * Call wp.media.model.Attachments.sync or Backbone.sync
			 */
			fallback = Attachments.prototype.sync ? Attachments.prototype : Backbone;
			return fallback.sync.apply( this, arguments );
		}
	}
}, {
	/**
	 * @readonly
	 */
	defaultProps: {
		orderby: 'date',
		order:   'DESC'
	},
	/**
	 * @readonly
	 */
	defaultArgs: {
		posts_per_page: 40
	},
	/**
	 * @readonly
	 */
	orderby: {
		allowed:  [ 'name', 'author', 'date', 'title', 'modified', 'uploadedTo', 'id', 'post__in', 'menuOrder' ],
		/**
		 * A map of JavaScript orderby values to their WP_Query equivalents.
		 * @type {Object}
		 */
		valuemap: {
			'id':         'ID',
			'uploadedTo': 'parent',
			'menuOrder':  'menu_order ID'
		}
	},
	/**
	 * A map of JavaScript query properties to their WP_Query equivalents.
	 *
	 * @readonly
	 */
	propmap: {
		'search':    's',
		'type':      'post_mime_type',
		'perPage':   'posts_per_page',
		'menuOrder': 'menu_order',
		'uploadedTo': 'post_parent',
		'status':     'post_status',
		'include':    'post__in',
		'exclude':    'post__not_in'
	},
	/**
	 * Creates and returns an Attachments Query collection given the properties.
	 *
	 * Caches query objects and reuses where possible.
	 *
	 * @static
	 * @method
	 *
	 * @param {object} [props]
	 * @param {Object} [props.cache=true]   Whether to use the query cache or not.
	 * @param {Object} [props.order]
	 * @param {Object} [props.orderby]
	 * @param {Object} [props.include]
	 * @param {Object} [props.exclude]
	 * @param {Object} [props.s]
	 * @param {Object} [props.post_mime_type]
	 * @param {Object} [props.posts_per_page]
	 * @param {Object} [props.menu_order]
	 * @param {Object} [props.post_parent]
	 * @param {Object} [props.post_status]
	 * @param {Object} [options]
	 *
	 * @returns {wp.media.model.Query} A new Attachments Query collection.
	 */
	get: (function(){
		/**
		 * @static
		 * @type Array
		 */
		var queries = [];

		/**
		 * @returns {Query}
		 */
		return function( props, options ) {
			var args     = {},
				orderby  = Query.orderby,
				defaults = Query.defaultProps,
				query,
				cache    = !! props.cache || _.isUndefined( props.cache );

			// Remove the `query` property. This isn't linked to a query,
			// this *is* the query.
			delete props.query;
			delete props.cache;

			// Fill default args.
			_.defaults( props, defaults );

			// Normalize the order.
			props.order = props.order.toUpperCase();
			if ( 'DESC' !== props.order && 'ASC' !== props.order ) {
				props.order = defaults.order.toUpperCase();
			}

			// Ensure we have a valid orderby value.
			if ( ! _.contains( orderby.allowed, props.orderby ) ) {
				props.orderby = defaults.orderby;
			}

			_.each( [ 'include', 'exclude' ], function( prop ) {
				if ( props[ prop ] && ! _.isArray( props[ prop ] ) ) {
					props[ prop ] = [ props[ prop ] ];
				}
			} );

			// Generate the query `args` object.
			// Correct any differing property names.
			_.each( props, function( value, prop ) {
				if ( _.isNull( value ) ) {
					return;
				}

				args[ Query.propmap[ prop ] || prop ] = value;
			});

			// Fill any other default query args.
			_.defaults( args, Query.defaultArgs );

			// `props.orderby` does not always map directly to `args.orderby`.
			// Substitute exceptions specified in orderby.keymap.
			args.orderby = orderby.valuemap[ props.orderby ] || props.orderby;

			// Search the query cache for a matching query.
			if ( cache ) {
				query = _.find( queries, function( query ) {
					return _.isEqual( query.args, args );
				});
			} else {
				queries = [];
			}

			// Otherwise, create a new query and add it to the cache.
			if ( ! query ) {
				query = new Query( [], _.extend( options || {}, {
					props: props,
					args:  args
				} ) );
				queries.push( query );
			}

			return query;
		};
	}())
});

module.exports = Query;

},{}],6:[function(require,module,exports){
/**
 * wp.media.model.Selection
 *
 * A selection of attachments.
 *
 * @class
 * @augments wp.media.model.Attachments
 * @augments Backbone.Collection
 */
var Attachments = wp.media.model.Attachments,
	Selection;

Selection = Attachments.extend({
	/**
	 * Refresh the `single` model whenever the selection changes.
	 * Binds `single` instead of using the context argument to ensure
	 * it receives no parameters.
	 *
	 * @param {Array} [models=[]] Array of models used to populate the collection.
	 * @param {Object} [options={}]
	 */
	initialize: function( models, options ) {
		/**
		 * call 'initialize' directly on the parent class
		 */
		Attachments.prototype.initialize.apply( this, arguments );
		this.multiple = options && options.multiple;

		this.on( 'add remove reset', _.bind( this.single, this, false ) );
	},

	/**
	 * If the workflow does not support multi-select, clear out the selection
	 * before adding a new attachment to it.
	 *
	 * @param {Array} models
	 * @param {Object} options
	 * @returns {wp.media.model.Attachment[]}
	 */
	add: function( models, options ) {
		if ( ! this.multiple ) {
			this.remove( this.models );
		}
		/**
		 * call 'add' directly on the parent class
		 */
		return Attachments.prototype.add.call( this, models, options );
	},

	/**
	 * Fired when toggling (clicking on) an attachment in the modal.
	 *
	 * @param {undefined|boolean|wp.media.model.Attachment} model
	 *
	 * @fires wp.media.model.Selection#selection:single
	 * @fires wp.media.model.Selection#selection:unsingle
	 *
	 * @returns {Backbone.Model}
	 */
	single: function( model ) {
		var previous = this._single;

		// If a `model` is provided, use it as the single model.
		if ( model ) {
			this._single = model;
		}
		// If the single model isn't in the selection, remove it.
		if ( this._single && ! this.get( this._single.cid ) ) {
			delete this._single;
		}

		this._single = this._single || this.last();

		// If single has changed, fire an event.
		if ( this._single !== previous ) {
			if ( previous ) {
				previous.trigger( 'selection:unsingle', previous, this );

				// If the model was already removed, trigger the collection
				// event manually.
				if ( ! this.get( previous.cid ) ) {
					this.trigger( 'selection:unsingle', previous, this );
				}
			}
			if ( this._single ) {
				this._single.trigger( 'selection:single', this._single, this );
			}
		}

		// Return the single model, or the last model as a fallback.
		return this._single;
	}
});

module.exports = Selection;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvbW9kZWxzLm1hbmlmZXN0LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL21vZGVscy9hdHRhY2htZW50LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL21vZGVscy9hdHRhY2htZW50cy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9tb2RlbHMvcG9zdC1pbWFnZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9tb2RlbHMvcXVlcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvbW9kZWxzL3NlbGVjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgJCA9IGpRdWVyeSxcblx0QXR0YWNobWVudCwgQXR0YWNobWVudHMsIGwxMG4sIG1lZGlhO1xuXG53aW5kb3cud3AgPSB3aW5kb3cud3AgfHwge307XG5cbi8qKlxuICogQ3JlYXRlIGFuZCByZXR1cm4gYSBtZWRpYSBmcmFtZS5cbiAqXG4gKiBIYW5kbGVzIHRoZSBkZWZhdWx0IG1lZGlhIGV4cGVyaWVuY2UuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSBhdHRyaWJ1dGVzIFRoZSBwcm9wZXJ0aWVzIHBhc3NlZCB0byB0aGUgbWFpbiBtZWRpYSBjb250cm9sbGVyLlxuICogQHJldHVybiB7d3AubWVkaWEudmlldy5NZWRpYUZyYW1lfSBBIG1lZGlhIHdvcmtmbG93LlxuICovXG5tZWRpYSA9IHdwLm1lZGlhID0gZnVuY3Rpb24oIGF0dHJpYnV0ZXMgKSB7XG5cdHZhciBNZWRpYUZyYW1lID0gbWVkaWEudmlldy5NZWRpYUZyYW1lLFxuXHRcdGZyYW1lO1xuXG5cdGlmICggISBNZWRpYUZyYW1lICkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGF0dHJpYnV0ZXMgPSBfLmRlZmF1bHRzKCBhdHRyaWJ1dGVzIHx8IHt9LCB7XG5cdFx0ZnJhbWU6ICdzZWxlY3QnXG5cdH0pO1xuXG5cdGlmICggJ3NlbGVjdCcgPT09IGF0dHJpYnV0ZXMuZnJhbWUgJiYgTWVkaWFGcmFtZS5TZWxlY3QgKSB7XG5cdFx0ZnJhbWUgPSBuZXcgTWVkaWFGcmFtZS5TZWxlY3QoIGF0dHJpYnV0ZXMgKTtcblx0fSBlbHNlIGlmICggJ3Bvc3QnID09PSBhdHRyaWJ1dGVzLmZyYW1lICYmIE1lZGlhRnJhbWUuUG9zdCApIHtcblx0XHRmcmFtZSA9IG5ldyBNZWRpYUZyYW1lLlBvc3QoIGF0dHJpYnV0ZXMgKTtcblx0fSBlbHNlIGlmICggJ21hbmFnZScgPT09IGF0dHJpYnV0ZXMuZnJhbWUgJiYgTWVkaWFGcmFtZS5NYW5hZ2UgKSB7XG5cdFx0ZnJhbWUgPSBuZXcgTWVkaWFGcmFtZS5NYW5hZ2UoIGF0dHJpYnV0ZXMgKTtcblx0fSBlbHNlIGlmICggJ2ltYWdlJyA9PT0gYXR0cmlidXRlcy5mcmFtZSAmJiBNZWRpYUZyYW1lLkltYWdlRGV0YWlscyApIHtcblx0XHRmcmFtZSA9IG5ldyBNZWRpYUZyYW1lLkltYWdlRGV0YWlscyggYXR0cmlidXRlcyApO1xuXHR9IGVsc2UgaWYgKCAnYXVkaW8nID09PSBhdHRyaWJ1dGVzLmZyYW1lICYmIE1lZGlhRnJhbWUuQXVkaW9EZXRhaWxzICkge1xuXHRcdGZyYW1lID0gbmV3IE1lZGlhRnJhbWUuQXVkaW9EZXRhaWxzKCBhdHRyaWJ1dGVzICk7XG5cdH0gZWxzZSBpZiAoICd2aWRlbycgPT09IGF0dHJpYnV0ZXMuZnJhbWUgJiYgTWVkaWFGcmFtZS5WaWRlb0RldGFpbHMgKSB7XG5cdFx0ZnJhbWUgPSBuZXcgTWVkaWFGcmFtZS5WaWRlb0RldGFpbHMoIGF0dHJpYnV0ZXMgKTtcblx0fSBlbHNlIGlmICggJ2VkaXQtYXR0YWNobWVudHMnID09PSBhdHRyaWJ1dGVzLmZyYW1lICYmIE1lZGlhRnJhbWUuRWRpdEF0dGFjaG1lbnRzICkge1xuXHRcdGZyYW1lID0gbmV3IE1lZGlhRnJhbWUuRWRpdEF0dGFjaG1lbnRzKCBhdHRyaWJ1dGVzICk7XG5cdH1cblxuXHRkZWxldGUgYXR0cmlidXRlcy5mcmFtZTtcblxuXHRtZWRpYS5mcmFtZSA9IGZyYW1lO1xuXG5cdHJldHVybiBmcmFtZTtcbn07XG5cbl8uZXh0ZW5kKCBtZWRpYSwgeyBtb2RlbDoge30sIHZpZXc6IHt9LCBjb250cm9sbGVyOiB7fSwgZnJhbWVzOiB7fSB9KTtcblxuLy8gTGluayBhbnkgbG9jYWxpemVkIHN0cmluZ3MuXG5sMTBuID0gbWVkaWEubW9kZWwubDEwbiA9IHdpbmRvdy5fd3BNZWRpYU1vZGVsc0wxMG4gfHwge307XG5cbi8vIExpbmsgYW55IHNldHRpbmdzLlxubWVkaWEubW9kZWwuc2V0dGluZ3MgPSBsMTBuLnNldHRpbmdzIHx8IHt9O1xuZGVsZXRlIGwxMG4uc2V0dGluZ3M7XG5cbkF0dGFjaG1lbnQgPSBtZWRpYS5tb2RlbC5BdHRhY2htZW50ID0gcmVxdWlyZSggJy4vbW9kZWxzL2F0dGFjaG1lbnQuanMnICk7XG5BdHRhY2htZW50cyA9IG1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzID0gcmVxdWlyZSggJy4vbW9kZWxzL2F0dGFjaG1lbnRzLmpzJyApO1xuXG5tZWRpYS5tb2RlbC5RdWVyeSA9IHJlcXVpcmUoICcuL21vZGVscy9xdWVyeS5qcycgKTtcbm1lZGlhLm1vZGVsLlBvc3RJbWFnZSA9IHJlcXVpcmUoICcuL21vZGVscy9wb3N0LWltYWdlLmpzJyApO1xubWVkaWEubW9kZWwuU2VsZWN0aW9uID0gcmVxdWlyZSggJy4vbW9kZWxzL3NlbGVjdGlvbi5qcycgKTtcblxuLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIFVUSUxJVElFU1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuLyoqXG4gKiBBIGJhc2ljIGVxdWFsaXR5IGNvbXBhcmF0b3IgZm9yIEJhY2tib25lIG1vZGVscy5cbiAqXG4gKiBVc2VkIHRvIG9yZGVyIG1vZGVscyB3aXRoaW4gYSBjb2xsZWN0aW9uIC0gQHNlZSB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50cy5jb21wYXJhdG9yKCkuXG4gKlxuICogQHBhcmFtICB7bWl4ZWR9ICBhICBUaGUgcHJpbWFyeSBwYXJhbWV0ZXIgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSAge21peGVkfSAgYiAgVGhlIHByaW1hcnkgcGFyYW1ldGVyIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGFjIFRoZSBmYWxsYmFjayBwYXJhbWV0ZXIgdG8gY29tcGFyZSwgYSdzIGNpZC5cbiAqIEBwYXJhbSAge3N0cmluZ30gYmMgVGhlIGZhbGxiYWNrIHBhcmFtZXRlciB0byBjb21wYXJlLCBiJ3MgY2lkLlxuICogQHJldHVybiB7bnVtYmVyfSAgICAtMTogYSBzaG91bGQgY29tZSBiZWZvcmUgYi5cbiAqICAgICAgICAgICAgICAgICAgICAgIDA6IGEgYW5kIGIgYXJlIG9mIHRoZSBzYW1lIHJhbmsuXG4gKiAgICAgICAgICAgICAgICAgICAgICAxOiBiIHNob3VsZCBjb21lIGJlZm9yZSBhLlxuICovXG5tZWRpYS5jb21wYXJlID0gZnVuY3Rpb24oIGEsIGIsIGFjLCBiYyApIHtcblx0aWYgKCBfLmlzRXF1YWwoIGEsIGIgKSApIHtcblx0XHRyZXR1cm4gYWMgPT09IGJjID8gMCA6IChhYyA+IGJjID8gLTEgOiAxKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gYSA+IGIgPyAtMSA6IDE7XG5cdH1cbn07XG5cbl8uZXh0ZW5kKCBtZWRpYSwge1xuXHQvKipcblx0ICogbWVkaWEudGVtcGxhdGUoIGlkIClcblx0ICpcblx0ICogRmV0Y2ggYSBKYXZhU2NyaXB0IHRlbXBsYXRlIGZvciBhbiBpZCwgYW5kIHJldHVybiBhIHRlbXBsYXRpbmcgZnVuY3Rpb24gZm9yIGl0LlxuXHQgKlxuXHQgKiBTZWUgd3AudGVtcGxhdGUoKSBpbiBgd3AtaW5jbHVkZXMvanMvd3AtdXRpbC5qc2AuXG5cdCAqXG5cdCAqIEBib3Jyb3dzIHdwLnRlbXBsYXRlIGFzIHRlbXBsYXRlXG5cdCAqL1xuXHR0ZW1wbGF0ZTogd3AudGVtcGxhdGUsXG5cblx0LyoqXG5cdCAqIG1lZGlhLnBvc3QoIFthY3Rpb25dLCBbZGF0YV0gKVxuXHQgKlxuXHQgKiBTZW5kcyBhIFBPU1QgcmVxdWVzdCB0byBXb3JkUHJlc3MuXG5cdCAqIFNlZSB3cC5hamF4LnBvc3QoKSBpbiBgd3AtaW5jbHVkZXMvanMvd3AtdXRpbC5qc2AuXG5cdCAqXG5cdCAqIEBib3Jyb3dzIHdwLmFqYXgucG9zdCBhcyBwb3N0XG5cdCAqL1xuXHRwb3N0OiB3cC5hamF4LnBvc3QsXG5cblx0LyoqXG5cdCAqIG1lZGlhLmFqYXgoIFthY3Rpb25dLCBbb3B0aW9uc10gKVxuXHQgKlxuXHQgKiBTZW5kcyBhbiBYSFIgcmVxdWVzdCB0byBXb3JkUHJlc3MuXG5cdCAqIFNlZSB3cC5hamF4LnNlbmQoKSBpbiBgd3AtaW5jbHVkZXMvanMvd3AtdXRpbC5qc2AuXG5cdCAqXG5cdCAqIEBib3Jyb3dzIHdwLmFqYXguc2VuZCBhcyBhamF4XG5cdCAqL1xuXHRhamF4OiB3cC5hamF4LnNlbmQsXG5cblx0LyoqXG5cdCAqIFNjYWxlcyBhIHNldCBvZiBkaW1lbnNpb25zIHRvIGZpdCB3aXRoaW4gYm91bmRpbmcgZGltZW5zaW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGRpbWVuc2lvbnNcblx0ICogQHJldHVybnMge09iamVjdH1cblx0ICovXG5cdGZpdDogZnVuY3Rpb24oIGRpbWVuc2lvbnMgKSB7XG5cdFx0dmFyIHdpZHRoICAgICA9IGRpbWVuc2lvbnMud2lkdGgsXG5cdFx0XHRoZWlnaHQgICAgPSBkaW1lbnNpb25zLmhlaWdodCxcblx0XHRcdG1heFdpZHRoICA9IGRpbWVuc2lvbnMubWF4V2lkdGgsXG5cdFx0XHRtYXhIZWlnaHQgPSBkaW1lbnNpb25zLm1heEhlaWdodCxcblx0XHRcdGNvbnN0cmFpbnQ7XG5cblx0XHQvLyBDb21wYXJlIHJhdGlvcyBiZXR3ZWVuIHRoZSB0d28gdmFsdWVzIHRvIGRldGVybWluZSB3aGljaFxuXHRcdC8vIG1heCB0byBjb25zdHJhaW4gYnkuIElmIGEgbWF4IHZhbHVlIGRvZXNuJ3QgZXhpc3QsIHRoZW4gdGhlXG5cdFx0Ly8gb3Bwb3NpdGUgc2lkZSBpcyB0aGUgY29uc3RyYWludC5cblx0XHRpZiAoICEgXy5pc1VuZGVmaW5lZCggbWF4V2lkdGggKSAmJiAhIF8uaXNVbmRlZmluZWQoIG1heEhlaWdodCApICkge1xuXHRcdFx0Y29uc3RyYWludCA9ICggd2lkdGggLyBoZWlnaHQgPiBtYXhXaWR0aCAvIG1heEhlaWdodCApID8gJ3dpZHRoJyA6ICdoZWlnaHQnO1xuXHRcdH0gZWxzZSBpZiAoIF8uaXNVbmRlZmluZWQoIG1heEhlaWdodCApICkge1xuXHRcdFx0Y29uc3RyYWludCA9ICd3aWR0aCc7XG5cdFx0fSBlbHNlIGlmICggIF8uaXNVbmRlZmluZWQoIG1heFdpZHRoICkgJiYgaGVpZ2h0ID4gbWF4SGVpZ2h0ICkge1xuXHRcdFx0Y29uc3RyYWludCA9ICdoZWlnaHQnO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSB2YWx1ZSBvZiB0aGUgY29uc3RyYWluZWQgc2lkZSBpcyBsYXJnZXIgdGhhbiB0aGUgbWF4LFxuXHRcdC8vIHRoZW4gc2NhbGUgdGhlIHZhbHVlcy4gT3RoZXJ3aXNlIHJldHVybiB0aGUgb3JpZ2luYWxzOyB0aGV5IGZpdC5cblx0XHRpZiAoICd3aWR0aCcgPT09IGNvbnN0cmFpbnQgJiYgd2lkdGggPiBtYXhXaWR0aCApIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHdpZHRoIDogbWF4V2lkdGgsXG5cdFx0XHRcdGhlaWdodDogTWF0aC5yb3VuZCggbWF4V2lkdGggKiBoZWlnaHQgLyB3aWR0aCApXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSBpZiAoICdoZWlnaHQnID09PSBjb25zdHJhaW50ICYmIGhlaWdodCA+IG1heEhlaWdodCApIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHdpZHRoIDogTWF0aC5yb3VuZCggbWF4SGVpZ2h0ICogd2lkdGggLyBoZWlnaHQgKSxcblx0XHRcdFx0aGVpZ2h0OiBtYXhIZWlnaHRcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHdpZHRoIDogd2lkdGgsXG5cdFx0XHRcdGhlaWdodDogaGVpZ2h0XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIFRydW5jYXRlcyBhIHN0cmluZyBieSBpbmplY3RpbmcgYW4gZWxsaXBzaXMgaW50byB0aGUgbWlkZGxlLlxuXHQgKiBVc2VmdWwgZm9yIGZpbGVuYW1lcy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuXHQgKiBAcGFyYW0ge051bWJlcn0gW2xlbmd0aD0zMF1cblx0ICogQHBhcmFtIHtTdHJpbmd9IFtyZXBsYWNlbWVudD0maGVsbGlwO11cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIHN0cmluZywgdW5sZXNzIGxlbmd0aCBpcyBncmVhdGVyIHRoYW4gc3RyaW5nLmxlbmd0aC5cblx0ICovXG5cdHRydW5jYXRlOiBmdW5jdGlvbiggc3RyaW5nLCBsZW5ndGgsIHJlcGxhY2VtZW50ICkge1xuXHRcdGxlbmd0aCA9IGxlbmd0aCB8fCAzMDtcblx0XHRyZXBsYWNlbWVudCA9IHJlcGxhY2VtZW50IHx8ICcmaGVsbGlwOyc7XG5cblx0XHRpZiAoIHN0cmluZy5sZW5ndGggPD0gbGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuIHN0cmluZztcblx0XHR9XG5cblx0XHRyZXR1cm4gc3RyaW5nLnN1YnN0ciggMCwgbGVuZ3RoIC8gMiApICsgcmVwbGFjZW1lbnQgKyBzdHJpbmcuc3Vic3RyKCAtMSAqIGxlbmd0aCAvIDIgKTtcblx0fVxufSk7XG5cbi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBNT0RFTFNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG4vKipcbiAqIHdwLm1lZGlhLmF0dGFjaG1lbnRcbiAqXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgQSBzdHJpbmcgdXNlZCB0byBpZGVudGlmeSBhIG1vZGVsLlxuICogQHJldHVybnMge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9XG4gKi9cbm1lZGlhLmF0dGFjaG1lbnQgPSBmdW5jdGlvbiggaWQgKSB7XG5cdHJldHVybiBBdHRhY2htZW50LmdldCggaWQgKTtcbn07XG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIG9mIGFsbCBhdHRhY2htZW50cyB0aGF0IGhhdmUgYmVlbiBmZXRjaGVkIGZyb20gdGhlIHNlcnZlci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c31cbiAqL1xuQXR0YWNobWVudHMuYWxsID0gbmV3IEF0dGFjaG1lbnRzKCk7XG5cbi8qKlxuICogd3AubWVkaWEucXVlcnlcbiAqXG4gKiBTaG9ydGhhbmQgZm9yIGNyZWF0aW5nIGEgbmV3IEF0dGFjaG1lbnRzIFF1ZXJ5LlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcHJvcHNdXG4gKiBAcmV0dXJucyB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9XG4gKi9cbm1lZGlhLnF1ZXJ5ID0gZnVuY3Rpb24oIHByb3BzICkge1xuXHRyZXR1cm4gbmV3IEF0dGFjaG1lbnRzKCBudWxsLCB7XG5cdFx0cHJvcHM6IF8uZXh0ZW5kKCBfLmRlZmF1bHRzKCBwcm9wcyB8fCB7fSwgeyBvcmRlcmJ5OiAnZGF0ZScgfSApLCB7IHF1ZXJ5OiB0cnVlIH0gKVxuXHR9KTtcbn07XG5cbi8vIENsZWFuIHVwLiBQcmV2ZW50cyBtb2JpbGUgYnJvd3NlcnMgY2FjaGluZ1xuJCh3aW5kb3cpLm9uKCd1bmxvYWQnLCBmdW5jdGlvbigpe1xuXHR3aW5kb3cud3AgPSBudWxsO1xufSk7XG4iLCIvKipcbiAqIHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICovXG52YXIgJCA9IEJhY2tib25lLiQsXG5cdEF0dGFjaG1lbnQ7XG5cbkF0dGFjaG1lbnQgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuXHQvKipcblx0ICogVHJpZ2dlcmVkIHdoZW4gYXR0YWNobWVudCBkZXRhaWxzIGNoYW5nZVxuXHQgKiBPdmVycmlkZXMgQmFja2JvbmUuTW9kZWwuc3luY1xuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH0gbW9kZWxcblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XVxuXHQgKlxuXHQgKiBAcmV0dXJucyB7UHJvbWlzZX1cblx0ICovXG5cdHN5bmM6IGZ1bmN0aW9uKCBtZXRob2QsIG1vZGVsLCBvcHRpb25zICkge1xuXHRcdC8vIElmIHRoZSBhdHRhY2htZW50IGRvZXMgbm90IHlldCBoYXZlIGFuIGBpZGAsIHJldHVybiBhbiBpbnN0YW50bHlcblx0XHQvLyByZWplY3RlZCBwcm9taXNlLiBPdGhlcndpc2UsIGFsbCBvZiBvdXIgcmVxdWVzdHMgd2lsbCBmYWlsLlxuXHRcdGlmICggXy5pc1VuZGVmaW5lZCggdGhpcy5pZCApICkge1xuXHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3RXaXRoKCB0aGlzICkucHJvbWlzZSgpO1xuXHRcdH1cblxuXHRcdC8vIE92ZXJsb2FkIHRoZSBgcmVhZGAgcmVxdWVzdCBzbyBBdHRhY2htZW50LmZldGNoKCkgZnVuY3Rpb25zIGNvcnJlY3RseS5cblx0XHRpZiAoICdyZWFkJyA9PT0gbWV0aG9kICkge1xuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0XHRvcHRpb25zLmNvbnRleHQgPSB0aGlzO1xuXHRcdFx0b3B0aW9ucy5kYXRhID0gXy5leHRlbmQoIG9wdGlvbnMuZGF0YSB8fCB7fSwge1xuXHRcdFx0XHRhY3Rpb246ICdnZXQtYXR0YWNobWVudCcsXG5cdFx0XHRcdGlkOiB0aGlzLmlkXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiB3cC5tZWRpYS5hamF4KCBvcHRpb25zICk7XG5cblx0XHQvLyBPdmVybG9hZCB0aGUgYHVwZGF0ZWAgcmVxdWVzdCBzbyBwcm9wZXJ0aWVzIGNhbiBiZSBzYXZlZC5cblx0XHR9IGVsc2UgaWYgKCAndXBkYXRlJyA9PT0gbWV0aG9kICkge1xuXHRcdFx0Ly8gSWYgd2UgZG8gbm90IGhhdmUgdGhlIG5lY2Vzc2FyeSBub25jZSwgZmFpbCBpbW1lZGl0YXRlbHkuXG5cdFx0XHRpZiAoICEgdGhpcy5nZXQoJ25vbmNlcycpIHx8ICEgdGhpcy5nZXQoJ25vbmNlcycpLnVwZGF0ZSApIHtcblx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3RXaXRoKCB0aGlzICkucHJvbWlzZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRcdG9wdGlvbnMuY29udGV4dCA9IHRoaXM7XG5cblx0XHRcdC8vIFNldCB0aGUgYWN0aW9uIGFuZCBJRC5cblx0XHRcdG9wdGlvbnMuZGF0YSA9IF8uZXh0ZW5kKCBvcHRpb25zLmRhdGEgfHwge30sIHtcblx0XHRcdFx0YWN0aW9uOiAgJ3NhdmUtYXR0YWNobWVudCcsXG5cdFx0XHRcdGlkOiAgICAgIHRoaXMuaWQsXG5cdFx0XHRcdG5vbmNlOiAgIHRoaXMuZ2V0KCdub25jZXMnKS51cGRhdGUsXG5cdFx0XHRcdHBvc3RfaWQ6IHdwLm1lZGlhLm1vZGVsLnNldHRpbmdzLnBvc3QuaWRcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBSZWNvcmQgdGhlIHZhbHVlcyBvZiB0aGUgY2hhbmdlZCBhdHRyaWJ1dGVzLlxuXHRcdFx0aWYgKCBtb2RlbC5oYXNDaGFuZ2VkKCkgKSB7XG5cdFx0XHRcdG9wdGlvbnMuZGF0YS5jaGFuZ2VzID0ge307XG5cblx0XHRcdFx0Xy5lYWNoKCBtb2RlbC5jaGFuZ2VkLCBmdW5jdGlvbiggdmFsdWUsIGtleSApIHtcblx0XHRcdFx0XHRvcHRpb25zLmRhdGEuY2hhbmdlc1sga2V5IF0gPSB0aGlzLmdldCgga2V5ICk7XG5cdFx0XHRcdH0sIHRoaXMgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHdwLm1lZGlhLmFqYXgoIG9wdGlvbnMgKTtcblxuXHRcdC8vIE92ZXJsb2FkIHRoZSBgZGVsZXRlYCByZXF1ZXN0IHNvIGF0dGFjaG1lbnRzIGNhbiBiZSByZW1vdmVkLlxuXHRcdC8vIFRoaXMgd2lsbCBwZXJtYW5lbnRseSBkZWxldGUgYW4gYXR0YWNobWVudC5cblx0XHR9IGVsc2UgaWYgKCAnZGVsZXRlJyA9PT0gbWV0aG9kICkge1xuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHRcdGlmICggISBvcHRpb25zLndhaXQgKSB7XG5cdFx0XHRcdHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0b3B0aW9ucy5jb250ZXh0ID0gdGhpcztcblx0XHRcdG9wdGlvbnMuZGF0YSA9IF8uZXh0ZW5kKCBvcHRpb25zLmRhdGEgfHwge30sIHtcblx0XHRcdFx0YWN0aW9uOiAgICdkZWxldGUtcG9zdCcsXG5cdFx0XHRcdGlkOiAgICAgICB0aGlzLmlkLFxuXHRcdFx0XHRfd3Bub25jZTogdGhpcy5nZXQoJ25vbmNlcycpWydkZWxldGUnXVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB3cC5tZWRpYS5hamF4KCBvcHRpb25zICkuZG9uZSggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcblx0XHRcdH0pLmZhaWwoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLmRlc3Ryb3llZCA9IGZhbHNlO1xuXHRcdFx0fSk7XG5cblx0XHQvLyBPdGhlcndpc2UsIGZhbGwgYmFjayB0byBgQmFja2JvbmUuc3luYygpYC5cblx0XHR9IGVsc2Uge1xuXHRcdFx0LyoqXG5cdFx0XHQgKiBDYWxsIGBzeW5jYCBkaXJlY3RseSBvbiBCYWNrYm9uZS5Nb2RlbFxuXHRcdFx0ICovXG5cdFx0XHRyZXR1cm4gQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnN5bmMuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIENvbnZlcnQgZGF0ZSBzdHJpbmdzIGludG8gRGF0ZSBvYmplY3RzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gcmVzcCBUaGUgcmF3IHJlc3BvbnNlIG9iamVjdCwgdHlwaWNhbGx5IHJldHVybmVkIGJ5IGZldGNoKClcblx0ICogQHJldHVybnMge09iamVjdH0gVGhlIG1vZGlmaWVkIHJlc3BvbnNlIG9iamVjdCwgd2hpY2ggaXMgdGhlIGF0dHJpYnV0ZXMgaGFzaFxuXHQgKiAgICB0byBiZSBzZXQgb24gdGhlIG1vZGVsLlxuXHQgKi9cblx0cGFyc2U6IGZ1bmN0aW9uKCByZXNwICkge1xuXHRcdGlmICggISByZXNwICkge1xuXHRcdFx0cmV0dXJuIHJlc3A7XG5cdFx0fVxuXG5cdFx0cmVzcC5kYXRlID0gbmV3IERhdGUoIHJlc3AuZGF0ZSApO1xuXHRcdHJlc3AubW9kaWZpZWQgPSBuZXcgRGF0ZSggcmVzcC5tb2RpZmllZCApO1xuXHRcdHJldHVybiByZXNwO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGRhdGEgVGhlIHByb3BlcnRpZXMgdG8gYmUgc2F2ZWQuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFN5bmMgb3B0aW9ucy4gZS5nLiBwYXRjaCwgd2FpdCwgc3VjY2VzcywgZXJyb3IuXG5cdCAqXG5cdCAqIEB0aGlzIEJhY2tib25lLk1vZGVsXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlfVxuXHQgKi9cblx0c2F2ZUNvbXBhdDogZnVuY3Rpb24oIGRhdGEsIG9wdGlvbnMgKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcztcblxuXHRcdC8vIElmIHdlIGRvIG5vdCBoYXZlIHRoZSBuZWNlc3Nhcnkgbm9uY2UsIGZhaWwgaW1tZWRpdGF0ZWx5LlxuXHRcdGlmICggISB0aGlzLmdldCgnbm9uY2VzJykgfHwgISB0aGlzLmdldCgnbm9uY2VzJykudXBkYXRlICkge1xuXHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3RXaXRoKCB0aGlzICkucHJvbWlzZSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiB3cC5tZWRpYS5wb3N0KCAnc2F2ZS1hdHRhY2htZW50LWNvbXBhdCcsIF8uZGVmYXVsdHMoe1xuXHRcdFx0aWQ6ICAgICAgdGhpcy5pZCxcblx0XHRcdG5vbmNlOiAgIHRoaXMuZ2V0KCdub25jZXMnKS51cGRhdGUsXG5cdFx0XHRwb3N0X2lkOiB3cC5tZWRpYS5tb2RlbC5zZXR0aW5ncy5wb3N0LmlkXG5cdFx0fSwgZGF0YSApICkuZG9uZSggZnVuY3Rpb24oIHJlc3AsIHN0YXR1cywgeGhyICkge1xuXHRcdFx0bW9kZWwuc2V0KCBtb2RlbC5wYXJzZSggcmVzcCwgeGhyICksIG9wdGlvbnMgKTtcblx0XHR9KTtcblx0fVxufSwge1xuXHQvKipcblx0ICogQ3JlYXRlIGEgbmV3IG1vZGVsIG9uIHRoZSBzdGF0aWMgJ2FsbCcgYXR0YWNobWVudHMgY29sbGVjdGlvbiBhbmQgcmV0dXJuIGl0LlxuXHQgKlxuXHQgKiBAc3RhdGljXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyc1xuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH1cblx0ICovXG5cdGNyZWF0ZTogZnVuY3Rpb24oIGF0dHJzICkge1xuXHRcdHZhciBBdHRhY2htZW50cyA9IHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzO1xuXHRcdHJldHVybiBBdHRhY2htZW50cy5hbGwucHVzaCggYXR0cnMgKTtcblx0fSxcblx0LyoqXG5cdCAqIENyZWF0ZSBhIG5ldyBtb2RlbCBvbiB0aGUgc3RhdGljICdhbGwnIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24gYW5kIHJldHVybiBpdC5cblx0ICpcblx0ICogSWYgdGhpcyBmdW5jdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGNhbGxlZCBmb3IgdGhlIGlkLFxuXHQgKiBpdCByZXR1cm5zIHRoZSBzcGVjaWZpZWQgYXR0YWNobWVudC5cblx0ICpcblx0ICogQHN0YXRpY1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gaWQgQSBzdHJpbmcgdXNlZCB0byBpZGVudGlmeSBhIG1vZGVsLlxuXHQgKiBAcGFyYW0ge0JhY2tib25lLk1vZGVsfHVuZGVmaW5lZH0gYXR0YWNobWVudFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH1cblx0ICovXG5cdGdldDogXy5tZW1vaXplKCBmdW5jdGlvbiggaWQsIGF0dGFjaG1lbnQgKSB7XG5cdFx0dmFyIEF0dGFjaG1lbnRzID0gd3AubWVkaWEubW9kZWwuQXR0YWNobWVudHM7XG5cdFx0cmV0dXJuIEF0dGFjaG1lbnRzLmFsbC5wdXNoKCBhdHRhY2htZW50IHx8IHsgaWQ6IGlkIH0gKTtcblx0fSlcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF0dGFjaG1lbnQ7XG4iLCIvKipcbiAqIHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzXG4gKlxuICogQSBjb2xsZWN0aW9uIG9mIGF0dGFjaG1lbnRzLlxuICpcbiAqIFRoaXMgY29sbGVjdGlvbiBoYXMgbm8gcGVyc2lzdGVuY2Ugd2l0aCB0aGUgc2VydmVyIHdpdGhvdXQgc3VwcGx5aW5nXG4gKiAnb3B0aW9ucy5wcm9wcy5xdWVyeSA9IHRydWUnLCB3aGljaCB3aWxsIG1pcnJvciB0aGUgY29sbGVjdGlvblxuICogdG8gYW4gQXR0YWNobWVudHMgUXVlcnkgY29sbGVjdGlvbiAtIEBzZWUgd3AubWVkaWEubW9kZWwuQXR0YWNobWVudHMubWlycm9yKCkuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuQ29sbGVjdGlvblxuICpcbiAqIEBwYXJhbSB7YXJyYXl9ICBbbW9kZWxzXSAgICAgICAgICAgICAgICBNb2RlbHMgdG8gaW5pdGlhbGl6ZSB3aXRoIHRoZSBjb2xsZWN0aW9uLlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAgICAgICAgICAgICAgIE9wdGlvbnMgaGFzaCBmb3IgdGhlIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMucHJvcHNdICAgICAgICAgT3B0aW9ucyBoYXNoIGZvciB0aGUgaW5pdGlhbCBxdWVyeSBwcm9wZXJ0aWVzLlxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnByb3BzLm9yZGVyXSAgIEluaXRpYWwgb3JkZXIgKEFTQyBvciBERVNDKSBmb3IgdGhlIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMucHJvcHMub3JkZXJieV0gSW5pdGlhbCBhdHRyaWJ1dGUga2V5IHRvIG9yZGVyIHRoZSBjb2xsZWN0aW9uIGJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnByb3BzLnF1ZXJ5XSAgIFdoZXRoZXIgdGhlIGNvbGxlY3Rpb24gaXMgbGlua2VkIHRvIGFuIGF0dGFjaG1lbnRzIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLm9ic2VydmVdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsdGVyc11cbiAqXG4gKi9cbnZhciBBdHRhY2htZW50cyA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcblx0LyoqXG5cdCAqIEB0eXBlIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50fVxuXHQgKi9cblx0bW9kZWw6IHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnQsXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0FycmF5fSBbbW9kZWxzPVtdXSBBcnJheSBvZiBtb2RlbHMgdXNlZCB0byBwb3B1bGF0ZSB0aGUgY29sbGVjdGlvbi5cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XVxuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG1vZGVscywgb3B0aW9ucyApIHtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdHRoaXMucHJvcHMgICA9IG5ldyBCYWNrYm9uZS5Nb2RlbCgpO1xuXHRcdHRoaXMuZmlsdGVycyA9IG9wdGlvbnMuZmlsdGVycyB8fCB7fTtcblxuXHRcdC8vIEJpbmQgZGVmYXVsdCBgY2hhbmdlYCBldmVudHMgdG8gdGhlIGBwcm9wc2AgbW9kZWwuXG5cdFx0dGhpcy5wcm9wcy5vbiggJ2NoYW5nZScsIHRoaXMuX2NoYW5nZUZpbHRlcmVkUHJvcHMsIHRoaXMgKTtcblxuXHRcdHRoaXMucHJvcHMub24oICdjaGFuZ2U6b3JkZXInLCAgIHRoaXMuX2NoYW5nZU9yZGVyLCAgIHRoaXMgKTtcblx0XHR0aGlzLnByb3BzLm9uKCAnY2hhbmdlOm9yZGVyYnknLCB0aGlzLl9jaGFuZ2VPcmRlcmJ5LCB0aGlzICk7XG5cdFx0dGhpcy5wcm9wcy5vbiggJ2NoYW5nZTpxdWVyeScsICAgdGhpcy5fY2hhbmdlUXVlcnksICAgdGhpcyApO1xuXG5cdFx0dGhpcy5wcm9wcy5zZXQoIF8uZGVmYXVsdHMoIG9wdGlvbnMucHJvcHMgfHwge30gKSApO1xuXG5cdFx0aWYgKCBvcHRpb25zLm9ic2VydmUgKSB7XG5cdFx0XHR0aGlzLm9ic2VydmUoIG9wdGlvbnMub2JzZXJ2ZSApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIFNvcnQgdGhlIGNvbGxlY3Rpb24gd2hlbiB0aGUgb3JkZXIgYXR0cmlidXRlIGNoYW5nZXMuXG5cdCAqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKi9cblx0X2NoYW5nZU9yZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuY29tcGFyYXRvciApIHtcblx0XHRcdHRoaXMuc29ydCgpO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIFNldCB0aGUgZGVmYXVsdCBjb21wYXJhdG9yIG9ubHkgd2hlbiB0aGUgYG9yZGVyYnlgIHByb3BlcnR5IGlzIHNldC5cblx0ICpcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuTW9kZWx9IG1vZGVsXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBvcmRlcmJ5XG5cdCAqL1xuXHRfY2hhbmdlT3JkZXJieTogZnVuY3Rpb24oIG1vZGVsLCBvcmRlcmJ5ICkge1xuXHRcdC8vIElmIGEgZGlmZmVyZW50IGNvbXBhcmF0b3IgaXMgZGVmaW5lZCwgYmFpbC5cblx0XHRpZiAoIHRoaXMuY29tcGFyYXRvciAmJiB0aGlzLmNvbXBhcmF0b3IgIT09IEF0dGFjaG1lbnRzLmNvbXBhcmF0b3IgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCBvcmRlcmJ5ICYmICdwb3N0X19pbicgIT09IG9yZGVyYnkgKSB7XG5cdFx0XHR0aGlzLmNvbXBhcmF0b3IgPSBBdHRhY2htZW50cy5jb21wYXJhdG9yO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgdGhpcy5jb21wYXJhdG9yO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIElmIHRoZSBgcXVlcnlgIHByb3BlcnR5IGlzIHNldCB0byB0cnVlLCBxdWVyeSB0aGUgc2VydmVyIHVzaW5nXG5cdCAqIHRoZSBgcHJvcHNgIHZhbHVlcywgYW5kIHN5bmMgdGhlIHJlc3VsdHMgdG8gdGhpcyBjb2xsZWN0aW9uLlxuXHQgKlxuXHQgKiBAYWNjZXNzIHByaXZhdGVcblx0ICpcblx0ICogQHBhcmFtIHtCYWNrYm9uZS5Nb2RlbH0gbW9kZWxcblx0ICogQHBhcmFtIHtCb29sZWFufSBxdWVyeVxuXHQgKi9cblx0X2NoYW5nZVF1ZXJ5OiBmdW5jdGlvbiggbW9kZWwsIHF1ZXJ5ICkge1xuXHRcdGlmICggcXVlcnkgKSB7XG5cdFx0XHR0aGlzLnByb3BzLm9uKCAnY2hhbmdlJywgdGhpcy5fcmVxdWVyeSwgdGhpcyApO1xuXHRcdFx0dGhpcy5fcmVxdWVyeSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnByb3BzLm9mZiggJ2NoYW5nZScsIHRoaXMuX3JlcXVlcnksIHRoaXMgKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBAYWNjZXNzIHByaXZhdGVcblx0ICpcblx0ICogQHBhcmFtIHtCYWNrYm9uZS5Nb2RlbH0gbW9kZWxcblx0ICovXG5cdF9jaGFuZ2VGaWx0ZXJlZFByb3BzOiBmdW5jdGlvbiggbW9kZWwgKSB7XG5cdFx0Ly8gSWYgdGhpcyBpcyBhIHF1ZXJ5LCB1cGRhdGluZyB0aGUgY29sbGVjdGlvbiB3aWxsIGJlIGhhbmRsZWQgYnlcblx0XHQvLyBgdGhpcy5fcmVxdWVyeSgpYC5cblx0XHRpZiAoIHRoaXMucHJvcHMuZ2V0KCdxdWVyeScpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBjaGFuZ2VkID0gXy5jaGFpbiggbW9kZWwuY2hhbmdlZCApLm1hcCggZnVuY3Rpb24oIHQsIHByb3AgKSB7XG5cdFx0XHR2YXIgZmlsdGVyID0gQXR0YWNobWVudHMuZmlsdGVyc1sgcHJvcCBdLFxuXHRcdFx0XHR0ZXJtID0gbW9kZWwuZ2V0KCBwcm9wICk7XG5cblx0XHRcdGlmICggISBmaWx0ZXIgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCB0ZXJtICYmICEgdGhpcy5maWx0ZXJzWyBwcm9wIF0gKSB7XG5cdFx0XHRcdHRoaXMuZmlsdGVyc1sgcHJvcCBdID0gZmlsdGVyO1xuXHRcdFx0fSBlbHNlIGlmICggISB0ZXJtICYmIHRoaXMuZmlsdGVyc1sgcHJvcCBdID09PSBmaWx0ZXIgKSB7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLmZpbHRlcnNbIHByb3AgXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmVjb3JkIHRoZSBjaGFuZ2UuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LCB0aGlzICkuYW55KCkudmFsdWUoKTtcblxuXHRcdGlmICggISBjaGFuZ2VkICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIElmIG5vIGBBdHRhY2htZW50c2AgbW9kZWwgaXMgcHJvdmlkZWQgdG8gc291cmNlIHRoZSBzZWFyY2hlc1xuXHRcdC8vIGZyb20sIHRoZW4gYXV0b21hdGljYWxseSBnZW5lcmF0ZSBhIHNvdXJjZSBmcm9tIHRoZSBleGlzdGluZ1xuXHRcdC8vIG1vZGVscy5cblx0XHRpZiAoICEgdGhpcy5fc291cmNlICkge1xuXHRcdFx0dGhpcy5fc291cmNlID0gbmV3IEF0dGFjaG1lbnRzKCB0aGlzLm1vZGVscyApO1xuXHRcdH1cblxuXHRcdHRoaXMucmVzZXQoIHRoaXMuX3NvdXJjZS5maWx0ZXIoIHRoaXMudmFsaWRhdG9yLCB0aGlzICkgKTtcblx0fSxcblxuXHR2YWxpZGF0ZURlc3Ryb3llZDogZmFsc2UsXG5cdC8qKlxuXHQgKiBDaGVja3Mgd2hldGhlciBhbiBhdHRhY2htZW50IGlzIHZhbGlkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0ICogQHJldHVybnMge0Jvb2xlYW59XG5cdCAqL1xuXHR2YWxpZGF0b3I6IGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdGlmICggISB0aGlzLnZhbGlkYXRlRGVzdHJveWVkICYmIGF0dGFjaG1lbnQuZGVzdHJveWVkICkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gXy5hbGwoIHRoaXMuZmlsdGVycywgZnVuY3Rpb24oIGZpbHRlciApIHtcblx0XHRcdHJldHVybiAhISBmaWx0ZXIuY2FsbCggdGhpcywgYXR0YWNobWVudCApO1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblx0LyoqXG5cdCAqIEFkZCBvciByZW1vdmUgYW4gYXR0YWNobWVudCB0byB0aGUgY29sbGVjdGlvbiBkZXBlbmRpbmcgb24gaXRzIHZhbGlkaXR5LlxuXHQgKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICogQHJldHVybnMge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0dmFsaWRhdGU6IGZ1bmN0aW9uKCBhdHRhY2htZW50LCBvcHRpb25zICkge1xuXHRcdHZhciB2YWxpZCA9IHRoaXMudmFsaWRhdG9yKCBhdHRhY2htZW50ICksXG5cdFx0XHRoYXNBdHRhY2htZW50ID0gISEgdGhpcy5nZXQoIGF0dGFjaG1lbnQuY2lkICk7XG5cblx0XHRpZiAoICEgdmFsaWQgJiYgaGFzQXR0YWNobWVudCApIHtcblx0XHRcdHRoaXMucmVtb3ZlKCBhdHRhY2htZW50LCBvcHRpb25zICk7XG5cdFx0fSBlbHNlIGlmICggdmFsaWQgJiYgISBoYXNBdHRhY2htZW50ICkge1xuXHRcdFx0dGhpcy5hZGQoIGF0dGFjaG1lbnQsIG9wdGlvbnMgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogQWRkIG9yIHJlbW92ZSBhbGwgYXR0YWNobWVudHMgZnJvbSBhbm90aGVyIGNvbGxlY3Rpb24gZGVwZW5kaW5nIG9uIGVhY2ggb25lJ3MgdmFsaWRpdHkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9IGF0dGFjaG1lbnRzXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucz17fV1cblx0ICpcblx0ICogQGZpcmVzIHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzI3Jlc2V0XG5cdCAqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHZhbGlkYXRlQWxsOiBmdW5jdGlvbiggYXR0YWNobWVudHMsIG9wdGlvbnMgKSB7XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHRfLmVhY2goIGF0dGFjaG1lbnRzLm1vZGVscywgZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHR0aGlzLnZhbGlkYXRlKCBhdHRhY2htZW50LCB7IHNpbGVudDogdHJ1ZSB9KTtcblx0XHR9LCB0aGlzICk7XG5cblx0XHRpZiAoICEgb3B0aW9ucy5zaWxlbnQgKSB7XG5cdFx0XHR0aGlzLnRyaWdnZXIoICdyZXNldCcsIHRoaXMsIG9wdGlvbnMgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBTdGFydCBvYnNlcnZpbmcgYW5vdGhlciBhdHRhY2htZW50cyBjb2xsZWN0aW9uIGNoYW5nZSBldmVudHNcblx0ICogYW5kIHJlcGxpY2F0ZSB0aGVtIG9uIHRoaXMgY29sbGVjdGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gVGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24gdG8gb2JzZXJ2ZS5cblx0ICogQHJldHVybnMge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZy5cblx0ICovXG5cdG9ic2VydmU6IGZ1bmN0aW9uKCBhdHRhY2htZW50cyApIHtcblx0XHR0aGlzLm9ic2VydmVycyA9IHRoaXMub2JzZXJ2ZXJzIHx8IFtdO1xuXHRcdHRoaXMub2JzZXJ2ZXJzLnB1c2goIGF0dGFjaG1lbnRzICk7XG5cblx0XHRhdHRhY2htZW50cy5vbiggJ2FkZCBjaGFuZ2UgcmVtb3ZlJywgdGhpcy5fdmFsaWRhdGVIYW5kbGVyLCB0aGlzICk7XG5cdFx0YXR0YWNobWVudHMub24oICdyZXNldCcsIHRoaXMuX3ZhbGlkYXRlQWxsSGFuZGxlciwgdGhpcyApO1xuXHRcdHRoaXMudmFsaWRhdGVBbGwoIGF0dGFjaG1lbnRzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBTdG9wIHJlcGxpY2F0aW5nIGNvbGxlY3Rpb24gY2hhbmdlIGV2ZW50cyBmcm9tIGFub3RoZXIgYXR0YWNobWVudHMgY29sbGVjdGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gVGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24gdG8gc3RvcCBvYnNlcnZpbmcuXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHVub2JzZXJ2ZTogZnVuY3Rpb24oIGF0dGFjaG1lbnRzICkge1xuXHRcdGlmICggYXR0YWNobWVudHMgKSB7XG5cdFx0XHRhdHRhY2htZW50cy5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHRcdHRoaXMub2JzZXJ2ZXJzID0gXy53aXRob3V0KCB0aGlzLm9ic2VydmVycywgYXR0YWNobWVudHMgKTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRfLmVhY2goIHRoaXMub2JzZXJ2ZXJzLCBmdW5jdGlvbiggYXR0YWNobWVudHMgKSB7XG5cdFx0XHRcdGF0dGFjaG1lbnRzLm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdFx0fSwgdGhpcyApO1xuXHRcdFx0ZGVsZXRlIHRoaXMub2JzZXJ2ZXJzO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9IGF0dGFjaG1lbnRcblx0ICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gYXR0YWNobWVudHNcblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICpcblx0ICogQHJldHVybnMge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0X3ZhbGlkYXRlSGFuZGxlcjogZnVuY3Rpb24oIGF0dGFjaG1lbnQsIGF0dGFjaG1lbnRzLCBvcHRpb25zICkge1xuXHRcdC8vIElmIHdlJ3JlIG5vdCBtaXJyb3JpbmcgdGhpcyBgYXR0YWNobWVudHNgIGNvbGxlY3Rpb24sXG5cdFx0Ly8gb25seSByZXRhaW4gdGhlIGBzaWxlbnRgIG9wdGlvbi5cblx0XHRvcHRpb25zID0gYXR0YWNobWVudHMgPT09IHRoaXMubWlycm9yaW5nID8gb3B0aW9ucyA6IHtcblx0XHRcdHNpbGVudDogb3B0aW9ucyAmJiBvcHRpb25zLnNpbGVudFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy52YWxpZGF0ZSggYXR0YWNobWVudCwgb3B0aW9ucyApO1xuXHR9LFxuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9IGF0dGFjaG1lbnRzXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdF92YWxpZGF0ZUFsbEhhbmRsZXI6IGZ1bmN0aW9uKCBhdHRhY2htZW50cywgb3B0aW9ucyApIHtcblx0XHRyZXR1cm4gdGhpcy52YWxpZGF0ZUFsbCggYXR0YWNobWVudHMsIG9wdGlvbnMgKTtcblx0fSxcblx0LyoqXG5cdCAqIFN0YXJ0IG1pcnJvcmluZyBhbm90aGVyIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24sIGNsZWFyaW5nIG91dCBhbnkgbW9kZWxzIGFscmVhZHlcblx0ICogaW4gdGhlIGNvbGxlY3Rpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9IFRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uIHRvIG1pcnJvci5cblx0ICogQHJldHVybnMge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0bWlycm9yOiBmdW5jdGlvbiggYXR0YWNobWVudHMgKSB7XG5cdFx0aWYgKCB0aGlzLm1pcnJvcmluZyAmJiB0aGlzLm1pcnJvcmluZyA9PT0gYXR0YWNobWVudHMgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHR0aGlzLnVubWlycm9yKCk7XG5cdFx0dGhpcy5taXJyb3JpbmcgPSBhdHRhY2htZW50cztcblxuXHRcdC8vIENsZWFyIHRoZSBjb2xsZWN0aW9uIHNpbGVudGx5LiBBIGByZXNldGAgZXZlbnQgd2lsbCBiZSBmaXJlZFxuXHRcdC8vIHdoZW4gYG9ic2VydmUoKWAgY2FsbHMgYHZhbGlkYXRlQWxsKClgLlxuXHRcdHRoaXMucmVzZXQoIFtdLCB7IHNpbGVudDogdHJ1ZSB9ICk7XG5cdFx0dGhpcy5vYnNlcnZlKCBhdHRhY2htZW50cyApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBTdG9wIG1pcnJvcmluZyBhbm90aGVyIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24uXG5cdCAqL1xuXHR1bm1pcnJvcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAhIHRoaXMubWlycm9yaW5nICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMudW5vYnNlcnZlKCB0aGlzLm1pcnJvcmluZyApO1xuXHRcdGRlbGV0ZSB0aGlzLm1pcnJvcmluZztcblx0fSxcblx0LyoqXG5cdCAqIFJldHJpdmUgbW9yZSBhdHRhY2htZW50cyBmcm9tIHRoZSBzZXJ2ZXIgZm9yIHRoZSBjb2xsZWN0aW9uLlxuXHQgKlxuXHQgKiBPbmx5IHdvcmtzIGlmIHRoZSBjb2xsZWN0aW9uIGlzIG1pcnJvcmluZyBhIFF1ZXJ5IEF0dGFjaG1lbnRzIGNvbGxlY3Rpb24sXG5cdCAqIGFuZCBmb3J3YXJkcyB0byBpdHMgYG1vcmVgIG1ldGhvZC4gVGhpcyBjb2xsZWN0aW9uIGNsYXNzIGRvZXNuJ3QgaGF2ZVxuXHQgKiBzZXJ2ZXIgcGVyc2lzdGVuY2UgYnkgaXRzZWxmLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuXHQgKiBAcmV0dXJucyB7UHJvbWlzZX1cblx0ICovXG5cdG1vcmU6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdHZhciBkZWZlcnJlZCA9IGpRdWVyeS5EZWZlcnJlZCgpLFxuXHRcdFx0bWlycm9yaW5nID0gdGhpcy5taXJyb3JpbmcsXG5cdFx0XHRhdHRhY2htZW50cyA9IHRoaXM7XG5cblx0XHRpZiAoICEgbWlycm9yaW5nIHx8ICEgbWlycm9yaW5nLm1vcmUgKSB7XG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucmVzb2x2ZVdpdGgoIHRoaXMgKS5wcm9taXNlKCk7XG5cdFx0fVxuXHRcdC8vIElmIHdlJ3JlIG1pcnJvcmluZyBhbm90aGVyIGNvbGxlY3Rpb24sIGZvcndhcmQgYG1vcmVgIHRvXG5cdFx0Ly8gdGhlIG1pcnJvcmVkIGNvbGxlY3Rpb24uIEFjY291bnQgZm9yIGEgcmFjZSBjb25kaXRpb24gYnlcblx0XHQvLyBjaGVja2luZyBpZiB3ZSdyZSBzdGlsbCBtaXJyb3JpbmcgdGhhdCBjb2xsZWN0aW9uIHdoZW5cblx0XHQvLyB0aGUgcmVxdWVzdCByZXNvbHZlcy5cblx0XHRtaXJyb3JpbmcubW9yZSggb3B0aW9ucyApLmRvbmUoIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCB0aGlzID09PSBhdHRhY2htZW50cy5taXJyb3JpbmcgKSB7XG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmVXaXRoKCB0aGlzICk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHR9LFxuXHQvKipcblx0ICogV2hldGhlciB0aGVyZSBhcmUgbW9yZSBhdHRhY2htZW50cyB0aGF0IGhhdmVuJ3QgYmVlbiBzeW5jJ2QgZnJvbSB0aGUgc2VydmVyXG5cdCAqIHRoYXQgbWF0Y2ggdGhlIGNvbGxlY3Rpb24ncyBxdWVyeS5cblx0ICpcblx0ICogT25seSB3b3JrcyBpZiB0aGUgY29sbGVjdGlvbiBpcyBtaXJyb3JpbmcgYSBRdWVyeSBBdHRhY2htZW50cyBjb2xsZWN0aW9uLFxuXHQgKiBhbmQgZm9yd2FyZHMgdG8gaXRzIGBoYXNNb3JlYCBtZXRob2QuIFRoaXMgY29sbGVjdGlvbiBjbGFzcyBkb2Vzbid0IGhhdmVcblx0ICogc2VydmVyIHBlcnNpc3RlbmNlIGJ5IGl0c2VsZi5cblx0ICpcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRoYXNNb3JlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5taXJyb3JpbmcgPyB0aGlzLm1pcnJvcmluZy5oYXNNb3JlKCkgOiBmYWxzZTtcblx0fSxcblx0LyoqXG5cdCAqIEEgY3VzdG9tIEFKQVgtcmVzcG9uc2UgcGFyc2VyLlxuXHQgKlxuXHQgKiBTZWUgdHJhYyB0aWNrZXQgIzI0NzUzXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSByZXNwIFRoZSByYXcgcmVzcG9uc2UgT2JqZWN0L0FycmF5LlxuXHQgKiBAcGFyYW0ge09iamVjdH0geGhyXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGFycmF5IG9mIG1vZGVsIGF0dHJpYnV0ZXMgdG8gYmUgYWRkZWQgdG8gdGhlIGNvbGxlY3Rpb25cblx0ICovXG5cdHBhcnNlOiBmdW5jdGlvbiggcmVzcCwgeGhyICkge1xuXHRcdGlmICggISBfLmlzQXJyYXkoIHJlc3AgKSApIHtcblx0XHRcdHJlc3AgPSBbcmVzcF07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIF8ubWFwKCByZXNwLCBmdW5jdGlvbiggYXR0cnMgKSB7XG5cdFx0XHR2YXIgaWQsIGF0dGFjaG1lbnQsIG5ld0F0dHJpYnV0ZXM7XG5cblx0XHRcdGlmICggYXR0cnMgaW5zdGFuY2VvZiBCYWNrYm9uZS5Nb2RlbCApIHtcblx0XHRcdFx0aWQgPSBhdHRycy5nZXQoICdpZCcgKTtcblx0XHRcdFx0YXR0cnMgPSBhdHRycy5hdHRyaWJ1dGVzO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWQgPSBhdHRycy5pZDtcblx0XHRcdH1cblxuXHRcdFx0YXR0YWNobWVudCA9IHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnQuZ2V0KCBpZCApO1xuXHRcdFx0bmV3QXR0cmlidXRlcyA9IGF0dGFjaG1lbnQucGFyc2UoIGF0dHJzLCB4aHIgKTtcblxuXHRcdFx0aWYgKCAhIF8uaXNFcXVhbCggYXR0YWNobWVudC5hdHRyaWJ1dGVzLCBuZXdBdHRyaWJ1dGVzICkgKSB7XG5cdFx0XHRcdGF0dGFjaG1lbnQuc2V0KCBuZXdBdHRyaWJ1dGVzICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhdHRhY2htZW50O1xuXHRcdH0pO1xuXHR9LFxuXHQvKipcblx0ICogSWYgdGhlIGNvbGxlY3Rpb24gaXMgYSBxdWVyeSwgY3JlYXRlIGFuZCBtaXJyb3IgYW4gQXR0YWNobWVudHMgUXVlcnkgY29sbGVjdGlvbi5cblx0ICpcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqL1xuXHRfcmVxdWVyeTogZnVuY3Rpb24oIHJlZnJlc2ggKSB7XG5cdFx0dmFyIHByb3BzO1xuXHRcdGlmICggdGhpcy5wcm9wcy5nZXQoJ3F1ZXJ5JykgKSB7XG5cdFx0XHRwcm9wcyA9IHRoaXMucHJvcHMudG9KU09OKCk7XG5cdFx0XHRwcm9wcy5jYWNoZSA9ICggdHJ1ZSAhPT0gcmVmcmVzaCApO1xuXHRcdFx0dGhpcy5taXJyb3IoIHdwLm1lZGlhLm1vZGVsLlF1ZXJ5LmdldCggcHJvcHMgKSApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIElmIHRoaXMgY29sbGVjdGlvbiBpcyBzb3J0ZWQgYnkgYG1lbnVPcmRlcmAsIHJlY2FsY3VsYXRlcyBhbmQgc2F2ZXNcblx0ICogdGhlIG1lbnUgb3JkZXIgdG8gdGhlIGRhdGFiYXNlLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dW5kZWZpbmVkfFByb21pc2V9XG5cdCAqL1xuXHRzYXZlTWVudU9yZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICdtZW51T3JkZXInICE9PSB0aGlzLnByb3BzLmdldCgnb3JkZXJieScpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFJlbW92ZXMgYW55IHVwbG9hZGluZyBhdHRhY2htZW50cywgdXBkYXRlcyBlYWNoIGF0dGFjaG1lbnQnc1xuXHRcdC8vIG1lbnUgb3JkZXIsIGFuZCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGFuIHsgaWQ6IG1lbnVPcmRlciB9XG5cdFx0Ly8gbWFwcGluZyB0byBwYXNzIHRvIHRoZSByZXF1ZXN0LlxuXHRcdHZhciBhdHRhY2htZW50cyA9IHRoaXMuY2hhaW4oKS5maWx0ZXIoIGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdFx0cmV0dXJuICEgXy5pc1VuZGVmaW5lZCggYXR0YWNobWVudC5pZCApO1xuXHRcdH0pLm1hcCggZnVuY3Rpb24oIGF0dGFjaG1lbnQsIGluZGV4ICkge1xuXHRcdFx0Ly8gSW5kaWNlcyBzdGFydCBhdCAxLlxuXHRcdFx0aW5kZXggPSBpbmRleCArIDE7XG5cdFx0XHRhdHRhY2htZW50LnNldCggJ21lbnVPcmRlcicsIGluZGV4ICk7XG5cdFx0XHRyZXR1cm4gWyBhdHRhY2htZW50LmlkLCBpbmRleCBdO1xuXHRcdH0pLm9iamVjdCgpLnZhbHVlKCk7XG5cblx0XHRpZiAoIF8uaXNFbXB0eSggYXR0YWNobWVudHMgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4gd3AubWVkaWEucG9zdCggJ3NhdmUtYXR0YWNobWVudC1vcmRlcicsIHtcblx0XHRcdG5vbmNlOiAgICAgICB3cC5tZWRpYS5tb2RlbC5zZXR0aW5ncy5wb3N0Lm5vbmNlLFxuXHRcdFx0cG9zdF9pZDogICAgIHdwLm1lZGlhLm1vZGVsLnNldHRpbmdzLnBvc3QuaWQsXG5cdFx0XHRhdHRhY2htZW50czogYXR0YWNobWVudHNcblx0XHR9KTtcblx0fVxufSwge1xuXHQvKipcblx0ICogQSBmdW5jdGlvbiB0byBjb21wYXJlIHR3byBhdHRhY2htZW50IG1vZGVscyBpbiBhbiBhdHRhY2htZW50cyBjb2xsZWN0aW9uLlxuXHQgKlxuXHQgKiBVc2VkIGFzIHRoZSBkZWZhdWx0IGNvbXBhcmF0b3IgZm9yIGluc3RhbmNlcyBvZiB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c1xuXHQgKiBhbmQgaXRzIHN1YmNsYXNzZXMuIEBzZWUgd3AubWVkaWEubW9kZWwuQXR0YWNobWVudHMuX2NoYW5nZU9yZGVyYnkoKS5cblx0ICpcblx0ICogQHN0YXRpY1xuXHQgKlxuXHQgKiBAcGFyYW0ge0JhY2tib25lLk1vZGVsfSBhXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuTW9kZWx9IGJcblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICogQHJldHVybnMge051bWJlcn0gLTEgaWYgdGhlIGZpcnN0IG1vZGVsIHNob3VsZCBjb21lIGJlZm9yZSB0aGUgc2Vjb25kLFxuXHQgKiAgICAwIGlmIHRoZXkgYXJlIG9mIHRoZSBzYW1lIHJhbmsgYW5kXG5cdCAqICAgIDEgaWYgdGhlIGZpcnN0IG1vZGVsIHNob3VsZCBjb21lIGFmdGVyLlxuXHQgKi9cblx0Y29tcGFyYXRvcjogZnVuY3Rpb24oIGEsIGIsIG9wdGlvbnMgKSB7XG5cdFx0dmFyIGtleSAgID0gdGhpcy5wcm9wcy5nZXQoJ29yZGVyYnknKSxcblx0XHRcdG9yZGVyID0gdGhpcy5wcm9wcy5nZXQoJ29yZGVyJykgfHwgJ0RFU0MnLFxuXHRcdFx0YWMgICAgPSBhLmNpZCxcblx0XHRcdGJjICAgID0gYi5jaWQ7XG5cblx0XHRhID0gYS5nZXQoIGtleSApO1xuXHRcdGIgPSBiLmdldCgga2V5ICk7XG5cblx0XHRpZiAoICdkYXRlJyA9PT0ga2V5IHx8ICdtb2RpZmllZCcgPT09IGtleSApIHtcblx0XHRcdGEgPSBhIHx8IG5ldyBEYXRlKCk7XG5cdFx0XHRiID0gYiB8fCBuZXcgRGF0ZSgpO1xuXHRcdH1cblxuXHRcdC8vIElmIGBvcHRpb25zLnRpZXNgIGlzIHNldCwgZG9uJ3QgZW5mb3JjZSB0aGUgYGNpZGAgdGllYnJlYWtlci5cblx0XHRpZiAoIG9wdGlvbnMgJiYgb3B0aW9ucy50aWVzICkge1xuXHRcdFx0YWMgPSBiYyA9IG51bGw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICggJ0RFU0MnID09PSBvcmRlciApID8gd3AubWVkaWEuY29tcGFyZSggYSwgYiwgYWMsIGJjICkgOiB3cC5tZWRpYS5jb21wYXJlKCBiLCBhLCBiYywgYWMgKTtcblx0fSxcblx0LyoqXG5cdCAqIEBuYW1lc3BhY2Vcblx0ICovXG5cdGZpbHRlcnM6IHtcblx0XHQvKipcblx0XHQgKiBAc3RhdGljXG5cdFx0ICogTm90ZSB0aGF0IHRoaXMgY2xpZW50LXNpZGUgc2VhcmNoaW5nIGlzICpub3QqIGVxdWl2YWxlbnRcblx0XHQgKiB0byBvdXIgc2VydmVyLXNpZGUgc2VhcmNoaW5nLlxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50fSBhdHRhY2htZW50XG5cdFx0ICpcblx0XHQgKiBAdGhpcyB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c1xuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge0Jvb2xlYW59XG5cdFx0ICovXG5cdFx0c2VhcmNoOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHRcdGlmICggISB0aGlzLnByb3BzLmdldCgnc2VhcmNoJykgKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gXy5hbnkoWyd0aXRsZScsJ2ZpbGVuYW1lJywnZGVzY3JpcHRpb24nLCdjYXB0aW9uJywnbmFtZSddLCBmdW5jdGlvbigga2V5ICkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBhdHRhY2htZW50LmdldCgga2V5ICk7XG5cdFx0XHRcdHJldHVybiB2YWx1ZSAmJiAtMSAhPT0gdmFsdWUuc2VhcmNoKCB0aGlzLnByb3BzLmdldCgnc2VhcmNoJykgKTtcblx0XHRcdH0sIHRoaXMgKTtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIEBzdGF0aWNcblx0XHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0XHQgKlxuXHRcdCAqIEB0aGlzIHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHR0eXBlOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHRcdHZhciB0eXBlID0gdGhpcy5wcm9wcy5nZXQoJ3R5cGUnKSwgYXR0cyA9IGF0dGFjaG1lbnQudG9KU09OKCksIG1pbWUsIGZvdW5kO1xuXG5cdFx0XHRpZiAoICEgdHlwZSB8fCAoIF8uaXNBcnJheSggdHlwZSApICYmICEgdHlwZS5sZW5ndGggKSApIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdG1pbWUgPSBhdHRzLm1pbWUgfHwgKCBhdHRzLmZpbGUgJiYgYXR0cy5maWxlLnR5cGUgKSB8fCAnJztcblxuXHRcdFx0aWYgKCBfLmlzQXJyYXkoIHR5cGUgKSApIHtcblx0XHRcdFx0Zm91bmQgPSBfLmZpbmQoIHR5cGUsIGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdFx0cmV0dXJuIC0xICE9PSBtaW1lLmluZGV4T2YoIHQgKTtcblx0XHRcdFx0fSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm91bmQgPSAtMSAhPT0gbWltZS5pbmRleE9mKCB0eXBlICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmb3VuZDtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIEBzdGF0aWNcblx0XHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0XHQgKlxuXHRcdCAqIEB0aGlzIHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7Qm9vbGVhbn1cblx0XHQgKi9cblx0XHR1cGxvYWRlZFRvOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHRcdHZhciB1cGxvYWRlZFRvID0gdGhpcy5wcm9wcy5nZXQoJ3VwbG9hZGVkVG8nKTtcblx0XHRcdGlmICggXy5pc1VuZGVmaW5lZCggdXBsb2FkZWRUbyApICkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHVwbG9hZGVkVG8gPT09IGF0dGFjaG1lbnQuZ2V0KCd1cGxvYWRlZFRvJyk7XG5cdFx0fSxcblx0XHQvKipcblx0XHQgKiBAc3RhdGljXG5cdFx0ICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50fSBhdHRhY2htZW50XG5cdFx0ICpcblx0XHQgKiBAdGhpcyB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c1xuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge0Jvb2xlYW59XG5cdFx0ICovXG5cdFx0c3RhdHVzOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHRcdHZhciBzdGF0dXMgPSB0aGlzLnByb3BzLmdldCgnc3RhdHVzJyk7XG5cdFx0XHRpZiAoIF8uaXNVbmRlZmluZWQoIHN0YXR1cyApICkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHN0YXR1cyA9PT0gYXR0YWNobWVudC5nZXQoJ3N0YXR1cycpO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0YWNobWVudHM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLm1vZGVsLlBvc3RJbWFnZVxuICpcbiAqIEFuIGluc3RhbmNlIG9mIGFuIGltYWdlIHRoYXQncyBiZWVuIGVtYmVkZGVkIGludG8gYSBwb3N0LlxuICpcbiAqIFVzZWQgaW4gdGhlIGVtYmVkZGVkIGltYWdlIGF0dGFjaG1lbnQgZGlzcGxheSBzZXR0aW5ncyBtb2RhbCAtIEBzZWUgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLkltYWdlRGV0YWlscy5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICpcbiAqIEBwYXJhbSB7aW50fSBbYXR0cmlidXRlc10gICAgICAgICAgICAgICBJbml0aWFsIG1vZGVsIGF0dHJpYnV0ZXMuXG4gKiBAcGFyYW0ge2ludH0gW2F0dHJpYnV0ZXMuYXR0YWNobWVudF9pZF0gSUQgb2YgdGhlIGF0dGFjaG1lbnQuXG4gKiovXG52YXIgUG9zdEltYWdlID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggYXR0cmlidXRlcyApIHtcblx0XHR2YXIgQXR0YWNobWVudCA9IHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnQ7XG5cdFx0dGhpcy5hdHRhY2htZW50ID0gZmFsc2U7XG5cblx0XHRpZiAoIGF0dHJpYnV0ZXMuYXR0YWNobWVudF9pZCApIHtcblx0XHRcdHRoaXMuYXR0YWNobWVudCA9IEF0dGFjaG1lbnQuZ2V0KCBhdHRyaWJ1dGVzLmF0dGFjaG1lbnRfaWQgKTtcblx0XHRcdGlmICggdGhpcy5hdHRhY2htZW50LmdldCggJ3VybCcgKSApIHtcblx0XHRcdFx0dGhpcy5kZmQgPSBqUXVlcnkuRGVmZXJyZWQoKTtcblx0XHRcdFx0dGhpcy5kZmQucmVzb2x2ZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5kZmQgPSB0aGlzLmF0dGFjaG1lbnQuZmV0Y2goKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuYmluZEF0dGFjaG1lbnRMaXN0ZW5lcnMoKTtcblx0XHR9XG5cblx0XHQvLyBrZWVwIHVybCBpbiBzeW5jIHdpdGggY2hhbmdlcyB0byB0aGUgdHlwZSBvZiBsaW5rXG5cdFx0dGhpcy5vbiggJ2NoYW5nZTpsaW5rJywgdGhpcy51cGRhdGVMaW5rVXJsLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NoYW5nZTpzaXplJywgdGhpcy51cGRhdGVTaXplLCB0aGlzICk7XG5cblx0XHR0aGlzLnNldExpbmtUeXBlRnJvbVVybCgpO1xuXHRcdHRoaXMuc2V0QXNwZWN0UmF0aW8oKTtcblxuXHRcdHRoaXMuc2V0KCAnb3JpZ2luYWxVcmwnLCBhdHRyaWJ1dGVzLnVybCApO1xuXHR9LFxuXG5cdGJpbmRBdHRhY2htZW50TGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmF0dGFjaG1lbnQsICdzeW5jJywgdGhpcy5zZXRMaW5rVHlwZUZyb21VcmwgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmF0dGFjaG1lbnQsICdzeW5jJywgdGhpcy5zZXRBc3BlY3RSYXRpbyApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuYXR0YWNobWVudCwgJ2NoYW5nZScsIHRoaXMudXBkYXRlU2l6ZSApO1xuXHR9LFxuXG5cdGNoYW5nZUF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBhdHRhY2htZW50LCBwcm9wcyApIHtcblx0XHR0aGlzLnN0b3BMaXN0ZW5pbmcoIHRoaXMuYXR0YWNobWVudCApO1xuXHRcdHRoaXMuYXR0YWNobWVudCA9IGF0dGFjaG1lbnQ7XG5cdFx0dGhpcy5iaW5kQXR0YWNobWVudExpc3RlbmVycygpO1xuXG5cdFx0dGhpcy5zZXQoICdhdHRhY2htZW50X2lkJywgdGhpcy5hdHRhY2htZW50LmdldCggJ2lkJyApICk7XG5cdFx0dGhpcy5zZXQoICdjYXB0aW9uJywgdGhpcy5hdHRhY2htZW50LmdldCggJ2NhcHRpb24nICkgKTtcblx0XHR0aGlzLnNldCggJ2FsdCcsIHRoaXMuYXR0YWNobWVudC5nZXQoICdhbHQnICkgKTtcblx0XHR0aGlzLnNldCggJ3NpemUnLCBwcm9wcy5nZXQoICdzaXplJyApICk7XG5cdFx0dGhpcy5zZXQoICdhbGlnbicsIHByb3BzLmdldCggJ2FsaWduJyApICk7XG5cdFx0dGhpcy5zZXQoICdsaW5rJywgcHJvcHMuZ2V0KCAnbGluaycgKSApO1xuXHRcdHRoaXMudXBkYXRlTGlua1VybCgpO1xuXHRcdHRoaXMudXBkYXRlU2l6ZSgpO1xuXHR9LFxuXG5cdHNldExpbmtUeXBlRnJvbVVybDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxpbmtVcmwgPSB0aGlzLmdldCggJ2xpbmtVcmwnICksXG5cdFx0XHR0eXBlO1xuXG5cdFx0aWYgKCAhIGxpbmtVcmwgKSB7XG5cdFx0XHR0aGlzLnNldCggJ2xpbmsnLCAnbm9uZScgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBkZWZhdWx0IHRvIGN1c3RvbSBpZiB0aGVyZSBpcyBhIGxpbmtVcmxcblx0XHR0eXBlID0gJ2N1c3RvbSc7XG5cblx0XHRpZiAoIHRoaXMuYXR0YWNobWVudCApIHtcblx0XHRcdGlmICggdGhpcy5hdHRhY2htZW50LmdldCggJ3VybCcgKSA9PT0gbGlua1VybCApIHtcblx0XHRcdFx0dHlwZSA9ICdmaWxlJztcblx0XHRcdH0gZWxzZSBpZiAoIHRoaXMuYXR0YWNobWVudC5nZXQoICdsaW5rJyApID09PSBsaW5rVXJsICkge1xuXHRcdFx0XHR0eXBlID0gJ3Bvc3QnO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIHRoaXMuZ2V0KCAndXJsJyApID09PSBsaW5rVXJsICkge1xuXHRcdFx0XHR0eXBlID0gJ2ZpbGUnO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuc2V0KCAnbGluaycsIHR5cGUgKTtcblx0fSxcblxuXHR1cGRhdGVMaW5rVXJsOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGluayA9IHRoaXMuZ2V0KCAnbGluaycgKSxcblx0XHRcdHVybDtcblxuXHRcdHN3aXRjaCggbGluayApIHtcblx0XHRcdGNhc2UgJ2ZpbGUnOlxuXHRcdFx0XHRpZiAoIHRoaXMuYXR0YWNobWVudCApIHtcblx0XHRcdFx0XHR1cmwgPSB0aGlzLmF0dGFjaG1lbnQuZ2V0KCAndXJsJyApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHVybCA9IHRoaXMuZ2V0KCAndXJsJyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuc2V0KCAnbGlua1VybCcsIHVybCApO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3Bvc3QnOlxuXHRcdFx0XHR0aGlzLnNldCggJ2xpbmtVcmwnLCB0aGlzLmF0dGFjaG1lbnQuZ2V0KCAnbGluaycgKSApO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ25vbmUnOlxuXHRcdFx0XHR0aGlzLnNldCggJ2xpbmtVcmwnLCAnJyApO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH0sXG5cblx0dXBkYXRlU2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNpemU7XG5cblx0XHRpZiAoICEgdGhpcy5hdHRhY2htZW50ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5nZXQoICdzaXplJyApID09PSAnY3VzdG9tJyApIHtcblx0XHRcdHRoaXMuc2V0KCAnd2lkdGgnLCB0aGlzLmdldCggJ2N1c3RvbVdpZHRoJyApICk7XG5cdFx0XHR0aGlzLnNldCggJ2hlaWdodCcsIHRoaXMuZ2V0KCAnY3VzdG9tSGVpZ2h0JyApICk7XG5cdFx0XHR0aGlzLnNldCggJ3VybCcsIHRoaXMuZ2V0KCAnb3JpZ2luYWxVcmwnICkgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRzaXplID0gdGhpcy5hdHRhY2htZW50LmdldCggJ3NpemVzJyApWyB0aGlzLmdldCggJ3NpemUnICkgXTtcblxuXHRcdGlmICggISBzaXplICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuc2V0KCAndXJsJywgc2l6ZS51cmwgKTtcblx0XHR0aGlzLnNldCggJ3dpZHRoJywgc2l6ZS53aWR0aCApO1xuXHRcdHRoaXMuc2V0KCAnaGVpZ2h0Jywgc2l6ZS5oZWlnaHQgKTtcblx0fSxcblxuXHRzZXRBc3BlY3RSYXRpbzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZ1bGw7XG5cblx0XHRpZiAoIHRoaXMuYXR0YWNobWVudCAmJiB0aGlzLmF0dGFjaG1lbnQuZ2V0KCAnc2l6ZXMnICkgKSB7XG5cdFx0XHRmdWxsID0gdGhpcy5hdHRhY2htZW50LmdldCggJ3NpemVzJyApLmZ1bGw7XG5cblx0XHRcdGlmICggZnVsbCApIHtcblx0XHRcdFx0dGhpcy5zZXQoICdhc3BlY3RSYXRpbycsIGZ1bGwud2lkdGggLyBmdWxsLmhlaWdodCApO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXQoICdhc3BlY3RSYXRpbycsIHRoaXMuZ2V0KCAnY3VzdG9tV2lkdGgnICkgLyB0aGlzLmdldCggJ2N1c3RvbUhlaWdodCcgKSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb3N0SW1hZ2U7XG4iLCIvKipcbiAqIHdwLm1lZGlhLm1vZGVsLlF1ZXJ5XG4gKlxuICogQSBjb2xsZWN0aW9uIG9mIGF0dGFjaG1lbnRzIHRoYXQgbWF0Y2ggdGhlIHN1cHBsaWVkIHF1ZXJ5IGFyZ3VtZW50cy5cbiAqXG4gKiBOb3RlOiBEbyBOT1QgY2hhbmdlIHRoaXMuYXJncyBhZnRlciB0aGUgcXVlcnkgaGFzIGJlZW4gaW5pdGlhbGl6ZWQuXG4gKiAgICAgICBUaGluZ3Mgd2lsbCBicmVhay5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c1xuICogQGF1Z21lbnRzIEJhY2tib25lLkNvbGxlY3Rpb25cbiAqXG4gKiBAcGFyYW0ge2FycmF5fSAgW21vZGVsc10gICAgICAgICAgICAgICAgICAgICAgTW9kZWxzIHRvIGluaXRpYWxpemUgd2l0aCB0aGUgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gICAgICAgICAgICAgICAgICAgICBPcHRpb25zIGhhc2guXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuYXJnc10gICAgICAgICAgICAgICAgQXR0YWNobWVudHMgcXVlcnkgYXJndW1lbnRzLlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmFyZ3MucG9zdHNfcGVyX3BhZ2VdXG4gKi9cbnZhciBBdHRhY2htZW50cyA9IHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzLFxuXHRRdWVyeTtcblxuUXVlcnkgPSBBdHRhY2htZW50cy5leHRlbmQoe1xuXHQvKipcblx0ICogQGdsb2JhbCB3cC5VcGxvYWRlclxuXHQgKlxuXHQgKiBAcGFyYW0ge2FycmF5fSAgW21vZGVscz1bXV0gIEFycmF5IG9mIGluaXRpYWwgbW9kZWxzIHRvIHBvcHVsYXRlIHRoZSBjb2xsZWN0aW9uLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnM9e31dXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggbW9kZWxzLCBvcHRpb25zICkge1xuXHRcdHZhciBhbGxvd2VkO1xuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0QXR0YWNobWVudHMucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dGhpcy5hcmdzICAgICA9IG9wdGlvbnMuYXJncztcblx0XHR0aGlzLl9oYXNNb3JlID0gdHJ1ZTtcblx0XHR0aGlzLmNyZWF0ZWQgID0gbmV3IERhdGUoKTtcblxuXHRcdHRoaXMuZmlsdGVycy5vcmRlciA9IGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdFx0dmFyIG9yZGVyYnkgPSB0aGlzLnByb3BzLmdldCgnb3JkZXJieScpLFxuXHRcdFx0XHRvcmRlciA9IHRoaXMucHJvcHMuZ2V0KCdvcmRlcicpO1xuXG5cdFx0XHRpZiAoICEgdGhpcy5jb21wYXJhdG9yICkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gV2Ugd2FudCBhbnkgaXRlbXMgdGhhdCBjYW4gYmUgcGxhY2VkIGJlZm9yZSB0aGUgbGFzdFxuXHRcdFx0Ly8gaXRlbSBpbiB0aGUgc2V0LiBJZiB3ZSBhZGQgYW55IGl0ZW1zIGFmdGVyIHRoZSBsYXN0XG5cdFx0XHQvLyBpdGVtLCB0aGVuIHdlIGNhbid0IGd1YXJhbnRlZSB0aGUgc2V0IGlzIGNvbXBsZXRlLlxuXHRcdFx0aWYgKCB0aGlzLmxlbmd0aCApIHtcblx0XHRcdFx0cmV0dXJuIDEgIT09IHRoaXMuY29tcGFyYXRvciggYXR0YWNobWVudCwgdGhpcy5sYXN0KCksIHsgdGllczogdHJ1ZSB9KTtcblxuXHRcdFx0Ly8gSGFuZGxlIHRoZSBjYXNlIHdoZXJlIHRoZXJlIGFyZSBubyBpdGVtcyB5ZXQgYW5kXG5cdFx0XHQvLyB3ZSdyZSBzb3J0aW5nIGZvciByZWNlbnQgaXRlbXMuIEluIHRoYXQgY2FzZSwgd2Ugd2FudFxuXHRcdFx0Ly8gY2hhbmdlcyB0aGF0IG9jY3VycmVkIGFmdGVyIHdlIGNyZWF0ZWQgdGhlIHF1ZXJ5LlxuXHRcdFx0fSBlbHNlIGlmICggJ0RFU0MnID09PSBvcmRlciAmJiAoICdkYXRlJyA9PT0gb3JkZXJieSB8fCAnbW9kaWZpZWQnID09PSBvcmRlcmJ5ICkgKSB7XG5cdFx0XHRcdHJldHVybiBhdHRhY2htZW50LmdldCggb3JkZXJieSApID49IHRoaXMuY3JlYXRlZDtcblxuXHRcdFx0Ly8gSWYgd2UncmUgc29ydGluZyBieSBtZW51IG9yZGVyIGFuZCB3ZSBoYXZlIG5vIGl0ZW1zLFxuXHRcdFx0Ly8gYWNjZXB0IGFueSBpdGVtcyB0aGF0IGhhdmUgdGhlIGRlZmF1bHQgbWVudSBvcmRlciAoMCkuXG5cdFx0XHR9IGVsc2UgaWYgKCAnQVNDJyA9PT0gb3JkZXIgJiYgJ21lbnVPcmRlcicgPT09IG9yZGVyYnkgKSB7XG5cdFx0XHRcdHJldHVybiBhdHRhY2htZW50LmdldCggb3JkZXJieSApID09PSAwO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBPdGhlcndpc2UsIHdlIGRvbid0IHdhbnQgYW55IGl0ZW1zIHlldC5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cdFx0Ly8gT2JzZXJ2ZSB0aGUgY2VudHJhbCBgd3AuVXBsb2FkZXIucXVldWVgIGNvbGxlY3Rpb24gdG8gd2F0Y2ggZm9yXG5cdFx0Ly8gbmV3IG1hdGNoZXMgZm9yIHRoZSBxdWVyeS5cblx0XHQvL1xuXHRcdC8vIE9ubHkgb2JzZXJ2ZSB3aGVuIGEgbGltaXRlZCBudW1iZXIgb2YgcXVlcnkgYXJncyBhcmUgc2V0LiBUaGVyZVxuXHRcdC8vIGFyZSBubyBmaWx0ZXJzIGZvciBvdGhlciBwcm9wZXJ0aWVzLCBzbyBvYnNlcnZpbmcgd2lsbCByZXN1bHQgaW5cblx0XHQvLyBmYWxzZSBwb3NpdGl2ZXMgaW4gdGhvc2UgcXVlcmllcy5cblx0XHRhbGxvd2VkID0gWyAncycsICdvcmRlcicsICdvcmRlcmJ5JywgJ3Bvc3RzX3Blcl9wYWdlJywgJ3Bvc3RfbWltZV90eXBlJywgJ3Bvc3RfcGFyZW50JyBdO1xuXHRcdGlmICggd3AuVXBsb2FkZXIgJiYgXyggdGhpcy5hcmdzICkuY2hhaW4oKS5rZXlzKCkuZGlmZmVyZW5jZSggYWxsb3dlZCApLmlzRW1wdHkoKS52YWx1ZSgpICkge1xuXHRcdFx0dGhpcy5vYnNlcnZlKCB3cC5VcGxvYWRlci5xdWV1ZSApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIFdoZXRoZXIgdGhlcmUgYXJlIG1vcmUgYXR0YWNobWVudHMgdGhhdCBoYXZlbid0IGJlZW4gc3luYydkIGZyb20gdGhlIHNlcnZlclxuXHQgKiB0aGF0IG1hdGNoIHRoZSBjb2xsZWN0aW9uJ3MgcXVlcnkuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0aGFzTW9yZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2hhc01vcmU7XG5cdH0sXG5cdC8qKlxuXHQgKiBGZXRjaCBtb3JlIGF0dGFjaG1lbnRzIGZyb20gdGhlIHNlcnZlciBmb3IgdGhlIGNvbGxlY3Rpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSAgIHtvYmplY3R9ICBbb3B0aW9ucz17fV1cblx0ICogQHJldHVybnMge1Byb21pc2V9XG5cdCAqL1xuXHRtb3JlOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR2YXIgcXVlcnkgPSB0aGlzO1xuXG5cdFx0Ly8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhIHJlcXVlc3QgcGVuZGluZywgcmV0dXJuIGVhcmx5IHdpdGggdGhlIERlZmVycmVkIG9iamVjdC5cblx0XHRpZiAoIHRoaXMuX21vcmUgJiYgJ3BlbmRpbmcnID09PSB0aGlzLl9tb3JlLnN0YXRlKCkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fbW9yZTtcblx0XHR9XG5cblx0XHRpZiAoICEgdGhpcy5oYXNNb3JlKCkgKSB7XG5cdFx0XHRyZXR1cm4galF1ZXJ5LkRlZmVycmVkKCkucmVzb2x2ZVdpdGgoIHRoaXMgKS5wcm9taXNlKCk7XG5cdFx0fVxuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0b3B0aW9ucy5yZW1vdmUgPSBmYWxzZTtcblxuXHRcdHJldHVybiB0aGlzLl9tb3JlID0gdGhpcy5mZXRjaCggb3B0aW9ucyApLmRvbmUoIGZ1bmN0aW9uKCByZXNwICkge1xuXHRcdFx0aWYgKCBfLmlzRW1wdHkoIHJlc3AgKSB8fCAtMSA9PT0gdGhpcy5hcmdzLnBvc3RzX3Blcl9wYWdlIHx8IHJlc3AubGVuZ3RoIDwgdGhpcy5hcmdzLnBvc3RzX3Blcl9wYWdlICkge1xuXHRcdFx0XHRxdWVyeS5faGFzTW9yZSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9LFxuXHQvKipcblx0ICogT3ZlcnJpZGVzIEJhY2tib25lLkNvbGxlY3Rpb24uc3luY1xuXHQgKiBPdmVycmlkZXMgd3AubWVkaWEubW9kZWwuQXR0YWNobWVudHMuc3luY1xuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuTW9kZWx9IG1vZGVsXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV1cblx0ICogQHJldHVybnMge1Byb21pc2V9XG5cdCAqL1xuXHRzeW5jOiBmdW5jdGlvbiggbWV0aG9kLCBtb2RlbCwgb3B0aW9ucyApIHtcblx0XHR2YXIgYXJncywgZmFsbGJhY2s7XG5cblx0XHQvLyBPdmVybG9hZCB0aGUgcmVhZCBtZXRob2Qgc28gQXR0YWNobWVudC5mZXRjaCgpIGZ1bmN0aW9ucyBjb3JyZWN0bHkuXG5cdFx0aWYgKCAncmVhZCcgPT09IG1ldGhvZCApIHtcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRcdFx0b3B0aW9ucy5jb250ZXh0ID0gdGhpcztcblx0XHRcdG9wdGlvbnMuZGF0YSA9IF8uZXh0ZW5kKCBvcHRpb25zLmRhdGEgfHwge30sIHtcblx0XHRcdFx0YWN0aW9uOiAgJ3F1ZXJ5LWF0dGFjaG1lbnRzJyxcblx0XHRcdFx0cG9zdF9pZDogd3AubWVkaWEubW9kZWwuc2V0dGluZ3MucG9zdC5pZFxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIENsb25lIHRoZSBhcmdzIHNvIG1hbmlwdWxhdGlvbiBpcyBub24tZGVzdHJ1Y3RpdmUuXG5cdFx0XHRhcmdzID0gXy5jbG9uZSggdGhpcy5hcmdzICk7XG5cblx0XHRcdC8vIERldGVybWluZSB3aGljaCBwYWdlIHRvIHF1ZXJ5LlxuXHRcdFx0aWYgKCAtMSAhPT0gYXJncy5wb3N0c19wZXJfcGFnZSApIHtcblx0XHRcdFx0YXJncy5wYWdlZCA9IE1hdGgucm91bmQoIHRoaXMubGVuZ3RoIC8gYXJncy5wb3N0c19wZXJfcGFnZSApICsgMTtcblx0XHRcdH1cblxuXHRcdFx0b3B0aW9ucy5kYXRhLnF1ZXJ5ID0gYXJncztcblx0XHRcdHJldHVybiB3cC5tZWRpYS5hamF4KCBvcHRpb25zICk7XG5cblx0XHQvLyBPdGhlcndpc2UsIGZhbGwgYmFjayB0byBCYWNrYm9uZS5zeW5jKClcblx0XHR9IGVsc2Uge1xuXHRcdFx0LyoqXG5cdFx0XHQgKiBDYWxsIHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzLnN5bmMgb3IgQmFja2JvbmUuc3luY1xuXHRcdFx0ICovXG5cdFx0XHRmYWxsYmFjayA9IEF0dGFjaG1lbnRzLnByb3RvdHlwZS5zeW5jID8gQXR0YWNobWVudHMucHJvdG90eXBlIDogQmFja2JvbmU7XG5cdFx0XHRyZXR1cm4gZmFsbGJhY2suc3luYy5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0fVxuXHR9XG59LCB7XG5cdC8qKlxuXHQgKiBAcmVhZG9ubHlcblx0ICovXG5cdGRlZmF1bHRQcm9wczoge1xuXHRcdG9yZGVyYnk6ICdkYXRlJyxcblx0XHRvcmRlcjogICAnREVTQydcblx0fSxcblx0LyoqXG5cdCAqIEByZWFkb25seVxuXHQgKi9cblx0ZGVmYXVsdEFyZ3M6IHtcblx0XHRwb3N0c19wZXJfcGFnZTogNDBcblx0fSxcblx0LyoqXG5cdCAqIEByZWFkb25seVxuXHQgKi9cblx0b3JkZXJieToge1xuXHRcdGFsbG93ZWQ6ICBbICduYW1lJywgJ2F1dGhvcicsICdkYXRlJywgJ3RpdGxlJywgJ21vZGlmaWVkJywgJ3VwbG9hZGVkVG8nLCAnaWQnLCAncG9zdF9faW4nLCAnbWVudU9yZGVyJyBdLFxuXHRcdC8qKlxuXHRcdCAqIEEgbWFwIG9mIEphdmFTY3JpcHQgb3JkZXJieSB2YWx1ZXMgdG8gdGhlaXIgV1BfUXVlcnkgZXF1aXZhbGVudHMuXG5cdFx0ICogQHR5cGUge09iamVjdH1cblx0XHQgKi9cblx0XHR2YWx1ZW1hcDoge1xuXHRcdFx0J2lkJzogICAgICAgICAnSUQnLFxuXHRcdFx0J3VwbG9hZGVkVG8nOiAncGFyZW50Jyxcblx0XHRcdCdtZW51T3JkZXInOiAgJ21lbnVfb3JkZXIgSUQnXG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogQSBtYXAgb2YgSmF2YVNjcmlwdCBxdWVyeSBwcm9wZXJ0aWVzIHRvIHRoZWlyIFdQX1F1ZXJ5IGVxdWl2YWxlbnRzLlxuXHQgKlxuXHQgKiBAcmVhZG9ubHlcblx0ICovXG5cdHByb3BtYXA6IHtcblx0XHQnc2VhcmNoJzogICAgJ3MnLFxuXHRcdCd0eXBlJzogICAgICAncG9zdF9taW1lX3R5cGUnLFxuXHRcdCdwZXJQYWdlJzogICAncG9zdHNfcGVyX3BhZ2UnLFxuXHRcdCdtZW51T3JkZXInOiAnbWVudV9vcmRlcicsXG5cdFx0J3VwbG9hZGVkVG8nOiAncG9zdF9wYXJlbnQnLFxuXHRcdCdzdGF0dXMnOiAgICAgJ3Bvc3Rfc3RhdHVzJyxcblx0XHQnaW5jbHVkZSc6ICAgICdwb3N0X19pbicsXG5cdFx0J2V4Y2x1ZGUnOiAgICAncG9zdF9fbm90X2luJ1xuXHR9LFxuXHQvKipcblx0ICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhbiBBdHRhY2htZW50cyBRdWVyeSBjb2xsZWN0aW9uIGdpdmVuIHRoZSBwcm9wZXJ0aWVzLlxuXHQgKlxuXHQgKiBDYWNoZXMgcXVlcnkgb2JqZWN0cyBhbmQgcmV1c2VzIHdoZXJlIHBvc3NpYmxlLlxuXHQgKlxuXHQgKiBAc3RhdGljXG5cdCAqIEBtZXRob2Rcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IFtwcm9wc11cblx0ICogQHBhcmFtIHtPYmplY3R9IFtwcm9wcy5jYWNoZT10cnVlXSAgIFdoZXRoZXIgdG8gdXNlIHRoZSBxdWVyeSBjYWNoZSBvciBub3QuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMub3JkZXJdXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMub3JkZXJieV1cblx0ICogQHBhcmFtIHtPYmplY3R9IFtwcm9wcy5pbmNsdWRlXVxuXHQgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLmV4Y2x1ZGVdXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcHMuc11cblx0ICogQHBhcmFtIHtPYmplY3R9IFtwcm9wcy5wb3N0X21pbWVfdHlwZV1cblx0ICogQHBhcmFtIHtPYmplY3R9IFtwcm9wcy5wb3N0c19wZXJfcGFnZV1cblx0ICogQHBhcmFtIHtPYmplY3R9IFtwcm9wcy5tZW51X29yZGVyXVxuXHQgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnBvc3RfcGFyZW50XVxuXHQgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzLnBvc3Rfc3RhdHVzXVxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5tb2RlbC5RdWVyeX0gQSBuZXcgQXR0YWNobWVudHMgUXVlcnkgY29sbGVjdGlvbi5cblx0ICovXG5cdGdldDogKGZ1bmN0aW9uKCl7XG5cdFx0LyoqXG5cdFx0ICogQHN0YXRpY1xuXHRcdCAqIEB0eXBlIEFycmF5XG5cdFx0ICovXG5cdFx0dmFyIHF1ZXJpZXMgPSBbXTtcblxuXHRcdC8qKlxuXHRcdCAqIEByZXR1cm5zIHtRdWVyeX1cblx0XHQgKi9cblx0XHRyZXR1cm4gZnVuY3Rpb24oIHByb3BzLCBvcHRpb25zICkge1xuXHRcdFx0dmFyIGFyZ3MgICAgID0ge30sXG5cdFx0XHRcdG9yZGVyYnkgID0gUXVlcnkub3JkZXJieSxcblx0XHRcdFx0ZGVmYXVsdHMgPSBRdWVyeS5kZWZhdWx0UHJvcHMsXG5cdFx0XHRcdHF1ZXJ5LFxuXHRcdFx0XHRjYWNoZSAgICA9ICEhIHByb3BzLmNhY2hlIHx8IF8uaXNVbmRlZmluZWQoIHByb3BzLmNhY2hlICk7XG5cblx0XHRcdC8vIFJlbW92ZSB0aGUgYHF1ZXJ5YCBwcm9wZXJ0eS4gVGhpcyBpc24ndCBsaW5rZWQgdG8gYSBxdWVyeSxcblx0XHRcdC8vIHRoaXMgKmlzKiB0aGUgcXVlcnkuXG5cdFx0XHRkZWxldGUgcHJvcHMucXVlcnk7XG5cdFx0XHRkZWxldGUgcHJvcHMuY2FjaGU7XG5cblx0XHRcdC8vIEZpbGwgZGVmYXVsdCBhcmdzLlxuXHRcdFx0Xy5kZWZhdWx0cyggcHJvcHMsIGRlZmF1bHRzICk7XG5cblx0XHRcdC8vIE5vcm1hbGl6ZSB0aGUgb3JkZXIuXG5cdFx0XHRwcm9wcy5vcmRlciA9IHByb3BzLm9yZGVyLnRvVXBwZXJDYXNlKCk7XG5cdFx0XHRpZiAoICdERVNDJyAhPT0gcHJvcHMub3JkZXIgJiYgJ0FTQycgIT09IHByb3BzLm9yZGVyICkge1xuXHRcdFx0XHRwcm9wcy5vcmRlciA9IGRlZmF1bHRzLm9yZGVyLnRvVXBwZXJDYXNlKCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEVuc3VyZSB3ZSBoYXZlIGEgdmFsaWQgb3JkZXJieSB2YWx1ZS5cblx0XHRcdGlmICggISBfLmNvbnRhaW5zKCBvcmRlcmJ5LmFsbG93ZWQsIHByb3BzLm9yZGVyYnkgKSApIHtcblx0XHRcdFx0cHJvcHMub3JkZXJieSA9IGRlZmF1bHRzLm9yZGVyYnk7XG5cdFx0XHR9XG5cblx0XHRcdF8uZWFjaCggWyAnaW5jbHVkZScsICdleGNsdWRlJyBdLCBmdW5jdGlvbiggcHJvcCApIHtcblx0XHRcdFx0aWYgKCBwcm9wc1sgcHJvcCBdICYmICEgXy5pc0FycmF5KCBwcm9wc1sgcHJvcCBdICkgKSB7XG5cdFx0XHRcdFx0cHJvcHNbIHByb3AgXSA9IFsgcHJvcHNbIHByb3AgXSBdO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIEdlbmVyYXRlIHRoZSBxdWVyeSBgYXJnc2Agb2JqZWN0LlxuXHRcdFx0Ly8gQ29ycmVjdCBhbnkgZGlmZmVyaW5nIHByb3BlcnR5IG5hbWVzLlxuXHRcdFx0Xy5lYWNoKCBwcm9wcywgZnVuY3Rpb24oIHZhbHVlLCBwcm9wICkge1xuXHRcdFx0XHRpZiAoIF8uaXNOdWxsKCB2YWx1ZSApICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFyZ3NbIFF1ZXJ5LnByb3BtYXBbIHByb3AgXSB8fCBwcm9wIF0gPSB2YWx1ZTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBGaWxsIGFueSBvdGhlciBkZWZhdWx0IHF1ZXJ5IGFyZ3MuXG5cdFx0XHRfLmRlZmF1bHRzKCBhcmdzLCBRdWVyeS5kZWZhdWx0QXJncyApO1xuXG5cdFx0XHQvLyBgcHJvcHMub3JkZXJieWAgZG9lcyBub3QgYWx3YXlzIG1hcCBkaXJlY3RseSB0byBgYXJncy5vcmRlcmJ5YC5cblx0XHRcdC8vIFN1YnN0aXR1dGUgZXhjZXB0aW9ucyBzcGVjaWZpZWQgaW4gb3JkZXJieS5rZXltYXAuXG5cdFx0XHRhcmdzLm9yZGVyYnkgPSBvcmRlcmJ5LnZhbHVlbWFwWyBwcm9wcy5vcmRlcmJ5IF0gfHwgcHJvcHMub3JkZXJieTtcblxuXHRcdFx0Ly8gU2VhcmNoIHRoZSBxdWVyeSBjYWNoZSBmb3IgYSBtYXRjaGluZyBxdWVyeS5cblx0XHRcdGlmICggY2FjaGUgKSB7XG5cdFx0XHRcdHF1ZXJ5ID0gXy5maW5kKCBxdWVyaWVzLCBmdW5jdGlvbiggcXVlcnkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIF8uaXNFcXVhbCggcXVlcnkuYXJncywgYXJncyApO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHF1ZXJpZXMgPSBbXTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gT3RoZXJ3aXNlLCBjcmVhdGUgYSBuZXcgcXVlcnkgYW5kIGFkZCBpdCB0byB0aGUgY2FjaGUuXG5cdFx0XHRpZiAoICEgcXVlcnkgKSB7XG5cdFx0XHRcdHF1ZXJ5ID0gbmV3IFF1ZXJ5KCBbXSwgXy5leHRlbmQoIG9wdGlvbnMgfHwge30sIHtcblx0XHRcdFx0XHRwcm9wczogcHJvcHMsXG5cdFx0XHRcdFx0YXJnczogIGFyZ3Ncblx0XHRcdFx0fSApICk7XG5cdFx0XHRcdHF1ZXJpZXMucHVzaCggcXVlcnkgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHF1ZXJ5O1xuXHRcdH07XG5cdH0oKSlcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb25cbiAqXG4gKiBBIHNlbGVjdGlvbiBvZiBhdHRhY2htZW50cy5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c1xuICogQGF1Z21lbnRzIEJhY2tib25lLkNvbGxlY3Rpb25cbiAqL1xudmFyIEF0dGFjaG1lbnRzID0gd3AubWVkaWEubW9kZWwuQXR0YWNobWVudHMsXG5cdFNlbGVjdGlvbjtcblxuU2VsZWN0aW9uID0gQXR0YWNobWVudHMuZXh0ZW5kKHtcblx0LyoqXG5cdCAqIFJlZnJlc2ggdGhlIGBzaW5nbGVgIG1vZGVsIHdoZW5ldmVyIHRoZSBzZWxlY3Rpb24gY2hhbmdlcy5cblx0ICogQmluZHMgYHNpbmdsZWAgaW5zdGVhZCBvZiB1c2luZyB0aGUgY29udGV4dCBhcmd1bWVudCB0byBlbnN1cmVcblx0ICogaXQgcmVjZWl2ZXMgbm8gcGFyYW1ldGVycy5cblx0ICpcblx0ICogQHBhcmFtIHtBcnJheX0gW21vZGVscz1bXV0gQXJyYXkgb2YgbW9kZWxzIHVzZWQgdG8gcG9wdWxhdGUgdGhlIGNvbGxlY3Rpb24uXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV1cblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBtb2RlbHMsIG9wdGlvbnMgKSB7XG5cdFx0LyoqXG5cdFx0ICogY2FsbCAnaW5pdGlhbGl6ZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzc1xuXHRcdCAqL1xuXHRcdEF0dGFjaG1lbnRzLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR0aGlzLm11bHRpcGxlID0gb3B0aW9ucyAmJiBvcHRpb25zLm11bHRpcGxlO1xuXG5cdFx0dGhpcy5vbiggJ2FkZCByZW1vdmUgcmVzZXQnLCBfLmJpbmQoIHRoaXMuc2luZ2xlLCB0aGlzLCBmYWxzZSApICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIElmIHRoZSB3b3JrZmxvdyBkb2VzIG5vdCBzdXBwb3J0IG11bHRpLXNlbGVjdCwgY2xlYXIgb3V0IHRoZSBzZWxlY3Rpb25cblx0ICogYmVmb3JlIGFkZGluZyBhIG5ldyBhdHRhY2htZW50IHRvIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0FycmF5fSBtb2RlbHNcblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICogQHJldHVybnMge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRbXX1cblx0ICovXG5cdGFkZDogZnVuY3Rpb24oIG1vZGVscywgb3B0aW9ucyApIHtcblx0XHRpZiAoICEgdGhpcy5tdWx0aXBsZSApIHtcblx0XHRcdHRoaXMucmVtb3ZlKCB0aGlzLm1vZGVscyApO1xuXHRcdH1cblx0XHQvKipcblx0XHQgKiBjYWxsICdhZGQnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3Ncblx0XHQgKi9cblx0XHRyZXR1cm4gQXR0YWNobWVudHMucHJvdG90eXBlLmFkZC5jYWxsKCB0aGlzLCBtb2RlbHMsIG9wdGlvbnMgKTtcblx0fSxcblxuXHQvKipcblx0ICogRmlyZWQgd2hlbiB0b2dnbGluZyAoY2xpY2tpbmcgb24pIGFuIGF0dGFjaG1lbnQgaW4gdGhlIG1vZGFsLlxuXHQgKlxuXHQgKiBAcGFyYW0ge3VuZGVmaW5lZHxib29sZWFufHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IG1vZGVsXG5cdCAqXG5cdCAqIEBmaXJlcyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24jc2VsZWN0aW9uOnNpbmdsZVxuXHQgKiBAZmlyZXMgd3AubWVkaWEubW9kZWwuU2VsZWN0aW9uI3NlbGVjdGlvbjp1bnNpbmdsZVxuXHQgKlxuXHQgKiBAcmV0dXJucyB7QmFja2JvbmUuTW9kZWx9XG5cdCAqL1xuXHRzaW5nbGU6IGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHR2YXIgcHJldmlvdXMgPSB0aGlzLl9zaW5nbGU7XG5cblx0XHQvLyBJZiBhIGBtb2RlbGAgaXMgcHJvdmlkZWQsIHVzZSBpdCBhcyB0aGUgc2luZ2xlIG1vZGVsLlxuXHRcdGlmICggbW9kZWwgKSB7XG5cdFx0XHR0aGlzLl9zaW5nbGUgPSBtb2RlbDtcblx0XHR9XG5cdFx0Ly8gSWYgdGhlIHNpbmdsZSBtb2RlbCBpc24ndCBpbiB0aGUgc2VsZWN0aW9uLCByZW1vdmUgaXQuXG5cdFx0aWYgKCB0aGlzLl9zaW5nbGUgJiYgISB0aGlzLmdldCggdGhpcy5fc2luZ2xlLmNpZCApICkge1xuXHRcdFx0ZGVsZXRlIHRoaXMuX3NpbmdsZTtcblx0XHR9XG5cblx0XHR0aGlzLl9zaW5nbGUgPSB0aGlzLl9zaW5nbGUgfHwgdGhpcy5sYXN0KCk7XG5cblx0XHQvLyBJZiBzaW5nbGUgaGFzIGNoYW5nZWQsIGZpcmUgYW4gZXZlbnQuXG5cdFx0aWYgKCB0aGlzLl9zaW5nbGUgIT09IHByZXZpb3VzICkge1xuXHRcdFx0aWYgKCBwcmV2aW91cyApIHtcblx0XHRcdFx0cHJldmlvdXMudHJpZ2dlciggJ3NlbGVjdGlvbjp1bnNpbmdsZScsIHByZXZpb3VzLCB0aGlzICk7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIG1vZGVsIHdhcyBhbHJlYWR5IHJlbW92ZWQsIHRyaWdnZXIgdGhlIGNvbGxlY3Rpb25cblx0XHRcdFx0Ly8gZXZlbnQgbWFudWFsbHkuXG5cdFx0XHRcdGlmICggISB0aGlzLmdldCggcHJldmlvdXMuY2lkICkgKSB7XG5cdFx0XHRcdFx0dGhpcy50cmlnZ2VyKCAnc2VsZWN0aW9uOnVuc2luZ2xlJywgcHJldmlvdXMsIHRoaXMgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCB0aGlzLl9zaW5nbGUgKSB7XG5cdFx0XHRcdHRoaXMuX3NpbmdsZS50cmlnZ2VyKCAnc2VsZWN0aW9uOnNpbmdsZScsIHRoaXMuX3NpbmdsZSwgdGhpcyApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFJldHVybiB0aGUgc2luZ2xlIG1vZGVsLCBvciB0aGUgbGFzdCBtb2RlbCBhcyBhIGZhbGxiYWNrLlxuXHRcdHJldHVybiB0aGlzLl9zaW5nbGU7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGlvbjtcbiJdfQ==
