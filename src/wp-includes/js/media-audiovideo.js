(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var media = wp.media,
	baseSettings = window._wpmejsSettings || {},
	l10n = window._wpMediaViewsL10n || {};

/**
 * @mixin
 */
wp.media.mixin = {
	mejsSettings: baseSettings,

	removeAllPlayers: function() {
		var p;

		if ( window.mejs && window.mejs.players ) {
			for ( p in window.mejs.players ) {
				window.mejs.players[p].pause();
				this.removePlayer( window.mejs.players[p] );
			}
		}
	},

	/**
	 * Override the MediaElement method for removing a player.
	 *	MediaElement tries to pull the audio/video tag out of
	 *	its container and re-add it to the DOM.
	 */
	removePlayer: function(t) {
		var featureIndex, feature;

		if ( ! t.options ) {
			return;
		}

		// invoke features cleanup
		for ( featureIndex in t.options.features ) {
			feature = t.options.features[featureIndex];
			if ( t['clean' + feature] ) {
				try {
					t['clean' + feature](t);
				} catch (e) {}
			}
		}

		if ( ! t.isDynamic ) {
			t.$node.remove();
		}

		if ( 'native' !== t.media.pluginType ) {
			t.$media.remove();
		}

		delete window.mejs.players[t.id];

		t.container.remove();
		t.globalUnbind();
		delete t.node.player;
	},

	/**
	 * Allows any class that has set 'player' to a MediaElementPlayer
	 *  instance to remove the player when listening to events.
	 *
	 *  Examples: modal closes, shortcode properties are removed, etc.
	 */
	unsetPlayers : function() {
		if ( this.players && this.players.length ) {
			_.each( this.players, function (player) {
				player.pause();
				wp.media.mixin.removePlayer( player );
			} );
			this.players = [];
		}
	}
};

/**
 * Autowire "collection"-type shortcodes
 */
wp.media.playlist = new wp.media.collection({
	tag: 'playlist',
	editTitle : l10n.editPlaylistTitle,
	defaults : {
		id: wp.media.view.settings.post.id,
		style: 'light',
		tracklist: true,
		tracknumbers: true,
		images: true,
		artists: true,
		type: 'audio'
	}
});

/**
 * Shortcode modeling for audio
 *  `edit()` prepares the shortcode for the media modal
 *  `shortcode()` builds the new shortcode after update
 *
 * @namespace
 */
wp.media.audio = {
	coerce : wp.media.coerce,

	defaults : {
		id : wp.media.view.settings.post.id,
		src : '',
		loop : false,
		autoplay : false,
		preload : 'none',
		width : 400
	},

	edit : function( data ) {
		var frame, shortcode = wp.shortcode.next( 'audio', data ).shortcode;

		frame = wp.media({
			frame: 'audio',
			state: 'audio-details',
			metadata: _.defaults( shortcode.attrs.named, this.defaults )
		});

		return frame;
	},

	shortcode : function( model ) {
		var content;

		_.each( this.defaults, function( value, key ) {
			model[ key ] = this.coerce( model, key );

			if ( value === model[ key ] ) {
				delete model[ key ];
			}
		}, this );

		content = model.content;
		delete model.content;

		return new wp.shortcode({
			tag: 'audio',
			attrs: model,
			content: content
		});
	}
};

/**
 * Shortcode modeling for video
 *  `edit()` prepares the shortcode for the media modal
 *  `shortcode()` builds the new shortcode after update
 *
 * @namespace
 */
wp.media.video = {
	coerce : wp.media.coerce,

	defaults : {
		id : wp.media.view.settings.post.id,
		src : '',
		poster : '',
		loop : false,
		autoplay : false,
		preload : 'metadata',
		content : '',
		width : 640,
		height : 360
	},

	edit : function( data ) {
		var frame,
			shortcode = wp.shortcode.next( 'video', data ).shortcode,
			attrs;

		attrs = shortcode.attrs.named;
		attrs.content = shortcode.content;

		frame = wp.media({
			frame: 'video',
			state: 'video-details',
			metadata: _.defaults( attrs, this.defaults )
		});

		return frame;
	},

	shortcode : function( model ) {
		var content;

		_.each( this.defaults, function( value, key ) {
			model[ key ] = this.coerce( model, key );

			if ( value === model[ key ] ) {
				delete model[ key ];
			}
		}, this );

		content = model.content;
		delete model.content;

		return new wp.shortcode({
			tag: 'video',
			attrs: model,
			content: content
		});
	}
};

media.model.PostMedia = require( './models/post-media.js' );
media.controller.AudioDetails = require( './controllers/audio-details.js' );
media.controller.VideoDetails = require( './controllers/video-details.js' );
media.view.MediaFrame.MediaDetails = require( './views/frame/media-details.js' );
media.view.MediaFrame.AudioDetails = require( './views/frame/audio-details.js' );
media.view.MediaFrame.VideoDetails = require( './views/frame/video-details.js' );
media.view.MediaDetails = require( './views/media-details.js' );
media.view.AudioDetails = require( './views/audio-details.js' );
media.view.VideoDetails = require( './views/video-details.js' );

},{"./controllers/audio-details.js":2,"./controllers/video-details.js":3,"./models/post-media.js":4,"./views/audio-details.js":5,"./views/frame/audio-details.js":6,"./views/frame/media-details.js":7,"./views/frame/video-details.js":8,"./views/media-details.js":9,"./views/video-details.js":10}],2:[function(require,module,exports){
/**
 * wp.media.controller.AudioDetails
 *
 * The controller for the Audio Details state
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var State = wp.media.controller.State,
	l10n = wp.media.view.l10n,
	AudioDetails;

AudioDetails = State.extend({
	defaults: {
		id: 'audio-details',
		toolbar: 'audio-details',
		title: l10n.audioDetailsTitle,
		content: 'audio-details',
		menu: 'audio-details',
		router: false,
		priority: 60
	},

	initialize: function( options ) {
		this.media = options.media;
		State.prototype.initialize.apply( this, arguments );
	}
});

module.exports = AudioDetails;

},{}],3:[function(require,module,exports){
/**
 * wp.media.controller.VideoDetails
 *
 * The controller for the Video Details state
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var State = wp.media.controller.State,
	l10n = wp.media.view.l10n,
	VideoDetails;

VideoDetails = State.extend({
	defaults: {
		id: 'video-details',
		toolbar: 'video-details',
		title: l10n.videoDetailsTitle,
		content: 'video-details',
		menu: 'video-details',
		router: false,
		priority: 60
	},

	initialize: function( options ) {
		this.media = options.media;
		State.prototype.initialize.apply( this, arguments );
	}
});

module.exports = VideoDetails;

},{}],4:[function(require,module,exports){
/**
 * wp.media.model.PostMedia
 *
 * Shared model class for audio and video. Updates the model after
 *   "Add Audio|Video Source" and "Replace Audio|Video" states return
 *
 * @class
 * @augments Backbone.Model
 */
var PostMedia = Backbone.Model.extend({
	initialize: function() {
		this.attachment = false;
	},

	setSource: function( attachment ) {
		this.attachment = attachment;
		this.extension = attachment.get( 'filename' ).split('.').pop();

		if ( this.get( 'src' ) && this.extension === this.get( 'src' ).split('.').pop() ) {
			this.unset( 'src' );
		}

		if ( _.contains( wp.media.view.settings.embedExts, this.extension ) ) {
			this.set( this.extension, this.attachment.get( 'url' ) );
		} else {
			this.unset( this.extension );
		}
	},

	changeAttachment: function( attachment ) {
		this.setSource( attachment );

		this.unset( 'src' );
		_.each( _.without( wp.media.view.settings.embedExts, this.extension ), function( ext ) {
			this.unset( ext );
		}, this );
	}
});

module.exports = PostMedia;

},{}],5:[function(require,module,exports){
/**
 * wp.media.view.AudioDetails
 *
 * @class
 * @augments wp.media.view.MediaDetails
 * @augments wp.media.view.Settings.AttachmentDisplay
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var MediaDetails = wp.media.view.MediaDetails,
	AudioDetails;

AudioDetails = MediaDetails.extend({
	className: 'audio-details',
	template:  wp.template('audio-details'),

	setMedia: function() {
		var audio = this.$('.wp-audio-shortcode');

		if ( audio.find( 'source' ).length ) {
			if ( audio.is(':hidden') ) {
				audio.show();
			}
			this.media = MediaDetails.prepareSrc( audio.get(0) );
		} else {
			audio.hide();
			this.media = false;
		}

		return this;
	}
});

module.exports = AudioDetails;

},{}],6:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.AudioDetails
 *
 * @class
 * @augments wp.media.view.MediaFrame.MediaDetails
 * @augments wp.media.view.MediaFrame.Select
 * @augments wp.media.view.MediaFrame
 * @augments wp.media.view.Frame
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
var MediaDetails = wp.media.view.MediaFrame.MediaDetails,
	MediaLibrary = wp.media.controller.MediaLibrary,

	l10n = wp.media.view.l10n,
	AudioDetails;

AudioDetails = MediaDetails.extend({
	defaults: {
		id:      'audio',
		url:     '',
		menu:    'audio-details',
		content: 'audio-details',
		toolbar: 'audio-details',
		type:    'link',
		title:    l10n.audioDetailsTitle,
		priority: 120
	},

	initialize: function( options ) {
		options.DetailsView = wp.media.view.AudioDetails;
		options.cancelText = l10n.audioDetailsCancel;
		options.addText = l10n.audioAddSourceTitle;

		MediaDetails.prototype.initialize.call( this, options );
	},

	bindHandlers: function() {
		MediaDetails.prototype.bindHandlers.apply( this, arguments );

		this.on( 'toolbar:render:replace-audio', this.renderReplaceToolbar, this );
		this.on( 'toolbar:render:add-audio-source', this.renderAddSourceToolbar, this );
	},

	createStates: function() {
		this.states.add([
			new wp.media.controller.AudioDetails( {
				media: this.media
			} ),

			new MediaLibrary( {
				type: 'audio',
				id: 'replace-audio',
				title: l10n.audioReplaceTitle,
				toolbar: 'replace-audio',
				media: this.media,
				menu: 'audio-details'
			} ),

			new MediaLibrary( {
				type: 'audio',
				id: 'add-audio-source',
				title: l10n.audioAddSourceTitle,
				toolbar: 'add-audio-source',
				media: this.media,
				menu: false
			} )
		]);
	}
});

module.exports = AudioDetails;

},{}],7:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.MediaDetails
 *
 * @class
 * @augments wp.media.view.MediaFrame.Select
 * @augments wp.media.view.MediaFrame
 * @augments wp.media.view.Frame
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
var Select = wp.media.view.MediaFrame.Select,
	l10n = wp.media.view.l10n,
	MediaDetails;

MediaDetails = Select.extend({
	defaults: {
		id:      'media',
		url:     '',
		menu:    'media-details',
		content: 'media-details',
		toolbar: 'media-details',
		type:    'link',
		priority: 120
	},

	initialize: function( options ) {
		this.DetailsView = options.DetailsView;
		this.cancelText = options.cancelText;
		this.addText = options.addText;

		this.media = new wp.media.model.PostMedia( options.metadata );
		this.options.selection = new wp.media.model.Selection( this.media.attachment, { multiple: false } );
		Select.prototype.initialize.apply( this, arguments );
	},

	bindHandlers: function() {
		var menu = this.defaults.menu;

		Select.prototype.bindHandlers.apply( this, arguments );

		this.on( 'menu:create:' + menu, this.createMenu, this );
		this.on( 'content:render:' + menu, this.renderDetailsContent, this );
		this.on( 'menu:render:' + menu, this.renderMenu, this );
		this.on( 'toolbar:render:' + menu, this.renderDetailsToolbar, this );
	},

	renderDetailsContent: function() {
		var view = new this.DetailsView({
			controller: this,
			model: this.state().media,
			attachment: this.state().media.attachment
		}).render();

		this.content.set( view );
	},

	renderMenu: function( view ) {
		var lastState = this.lastState(),
			previous = lastState && lastState.id,
			frame = this;

		view.set({
			cancel: {
				text:     this.cancelText,
				priority: 20,
				click:    function() {
					if ( previous ) {
						frame.setState( previous );
					} else {
						frame.close();
					}
				}
			},
			separateCancel: new wp.media.View({
				className: 'separator',
				priority: 40
			})
		});

	},

	setPrimaryButton: function(text, handler) {
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				button: {
					style:    'primary',
					text:     text,
					priority: 80,
					click:    function() {
						var controller = this.controller;
						handler.call( this, controller, controller.state() );
						// Restore and reset the default state.
						controller.setState( controller.options.state );
						controller.reset();
					}
				}
			}
		}) );
	},

	renderDetailsToolbar: function() {
		this.setPrimaryButton( l10n.update, function( controller, state ) {
			controller.close();
			state.trigger( 'update', controller.media.toJSON() );
		} );
	},

	renderReplaceToolbar: function() {
		this.setPrimaryButton( l10n.replace, function( controller, state ) {
			var attachment = state.get( 'selection' ).single();
			controller.media.changeAttachment( attachment );
			state.trigger( 'replace', controller.media.toJSON() );
		} );
	},

	renderAddSourceToolbar: function() {
		this.setPrimaryButton( this.addText, function( controller, state ) {
			var attachment = state.get( 'selection' ).single();
			controller.media.setSource( attachment );
			state.trigger( 'add-source', controller.media.toJSON() );
		} );
	}
});

module.exports = MediaDetails;

},{}],8:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.VideoDetails
 *
 * @class
 * @augments wp.media.view.MediaFrame.MediaDetails
 * @augments wp.media.view.MediaFrame.Select
 * @augments wp.media.view.MediaFrame
 * @augments wp.media.view.Frame
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
var MediaDetails = wp.media.view.MediaFrame.MediaDetails,
	MediaLibrary = wp.media.controller.MediaLibrary,
	l10n = wp.media.view.l10n,
	VideoDetails;

VideoDetails = MediaDetails.extend({
	defaults: {
		id:      'video',
		url:     '',
		menu:    'video-details',
		content: 'video-details',
		toolbar: 'video-details',
		type:    'link',
		title:    l10n.videoDetailsTitle,
		priority: 120
	},

	initialize: function( options ) {
		options.DetailsView = wp.media.view.VideoDetails;
		options.cancelText = l10n.videoDetailsCancel;
		options.addText = l10n.videoAddSourceTitle;

		MediaDetails.prototype.initialize.call( this, options );
	},

	bindHandlers: function() {
		MediaDetails.prototype.bindHandlers.apply( this, arguments );

		this.on( 'toolbar:render:replace-video', this.renderReplaceToolbar, this );
		this.on( 'toolbar:render:add-video-source', this.renderAddSourceToolbar, this );
		this.on( 'toolbar:render:select-poster-image', this.renderSelectPosterImageToolbar, this );
		this.on( 'toolbar:render:add-track', this.renderAddTrackToolbar, this );
	},

	createStates: function() {
		this.states.add([
			new wp.media.controller.VideoDetails({
				media: this.media
			}),

			new MediaLibrary( {
				type: 'video',
				id: 'replace-video',
				title: l10n.videoReplaceTitle,
				toolbar: 'replace-video',
				media: this.media,
				menu: 'video-details'
			} ),

			new MediaLibrary( {
				type: 'video',
				id: 'add-video-source',
				title: l10n.videoAddSourceTitle,
				toolbar: 'add-video-source',
				media: this.media,
				menu: false
			} ),

			new MediaLibrary( {
				type: 'image',
				id: 'select-poster-image',
				title: l10n.videoSelectPosterImageTitle,
				toolbar: 'select-poster-image',
				media: this.media,
				menu: 'video-details'
			} ),

			new MediaLibrary( {
				type: 'text',
				id: 'add-track',
				title: l10n.videoAddTrackTitle,
				toolbar: 'add-track',
				media: this.media,
				menu: 'video-details'
			} )
		]);
	},

	renderSelectPosterImageToolbar: function() {
		this.setPrimaryButton( l10n.videoSelectPosterImageTitle, function( controller, state ) {
			var urls = [], attachment = state.get( 'selection' ).single();

			controller.media.set( 'poster', attachment.get( 'url' ) );
			state.trigger( 'set-poster-image', controller.media.toJSON() );

			_.each( wp.media.view.settings.embedExts, function (ext) {
				if ( controller.media.get( ext ) ) {
					urls.push( controller.media.get( ext ) );
				}
			} );

			wp.ajax.send( 'set-attachment-thumbnail', {
				data : {
					urls: urls,
					thumbnail_id: attachment.get( 'id' )
				}
			} );
		} );
	},

	renderAddTrackToolbar: function() {
		this.setPrimaryButton( l10n.videoAddTrackTitle, function( controller, state ) {
			var attachment = state.get( 'selection' ).single(),
				content = controller.media.get( 'content' );

			if ( -1 === content.indexOf( attachment.get( 'url' ) ) ) {
				content += [
					'<track srclang="en" label="English" kind="subtitles" src="',
					attachment.get( 'url' ),
					'" />'
				].join('');

				controller.media.set( 'content', content );
			}
			state.trigger( 'add-track', controller.media.toJSON() );
		} );
	}
});

module.exports = VideoDetails;

},{}],9:[function(require,module,exports){
/* global MediaElementPlayer */

/**
 * wp.media.view.MediaDetails
 *
 * @class
 * @augments wp.media.view.Settings.AttachmentDisplay
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var AttachmentDisplay = wp.media.view.Settings.AttachmentDisplay,
	$ = jQuery,
	MediaDetails;

MediaDetails = AttachmentDisplay.extend({
	initialize: function() {
		_.bindAll(this, 'success');
		this.players = [];
		this.listenTo( this.controller, 'close', wp.media.mixin.unsetPlayers );
		this.on( 'ready', this.setPlayer );
		this.on( 'media:setting:remove', wp.media.mixin.unsetPlayers, this );
		this.on( 'media:setting:remove', this.render );
		this.on( 'media:setting:remove', this.setPlayer );

		AttachmentDisplay.prototype.initialize.apply( this, arguments );
	},

	events: function(){
		return _.extend( {
			'click .remove-setting' : 'removeSetting',
			'change .content-track' : 'setTracks',
			'click .remove-track' : 'setTracks',
			'click .add-media-source' : 'addSource'
		}, AttachmentDisplay.prototype.events );
	},

	prepare: function() {
		return _.defaults({
			model: this.model.toJSON()
		}, this.options );
	},

	/**
	 * Remove a setting's UI when the model unsets it
	 *
	 * @fires wp.media.view.MediaDetails#media:setting:remove
	 *
	 * @param {Event} e
	 */
	removeSetting : function(e) {
		var wrap = $( e.currentTarget ).parent(), setting;
		setting = wrap.find( 'input' ).data( 'setting' );

		if ( setting ) {
			this.model.unset( setting );
			this.trigger( 'media:setting:remove', this );
		}

		wrap.remove();
	},

	/**
	 *
	 * @fires wp.media.view.MediaDetails#media:setting:remove
	 */
	setTracks : function() {
		var tracks = '';

		_.each( this.$('.content-track'), function(track) {
			tracks += $( track ).val();
		} );

		this.model.set( 'content', tracks );
		this.trigger( 'media:setting:remove', this );
	},

	addSource : function( e ) {
		this.controller.lastMime = $( e.currentTarget ).data( 'mime' );
		this.controller.setState( 'add-' + this.controller.defaults.id + '-source' );
	},

	loadPlayer: function () {
		this.players.push( new MediaElementPlayer( this.media, this.settings ) );
		this.scriptXhr = false;
	},

	/**
	 * @global MediaElementPlayer
	 */
	setPlayer : function() {
		var baseSettings, src;

		if ( this.players.length || ! this.media || this.scriptXhr ) {
			return;
		}

		src = this.model.get( 'src' );

		if ( src && src.indexOf( 'vimeo' ) > -1 && ! ( 'Froogaloop' in window ) ) {
			baseSettings = wp.media.mixin.mejsSettings;
			this.scriptXhr = $.getScript( baseSettings.pluginPath + 'froogaloop.min.js', _.bind( this.loadPlayer, this ) );
		} else {
			this.loadPlayer();
		}
	},

	/**
	 * @abstract
	 */
	setMedia : function() {
		return this;
	},

	success : function(mejs) {
		var autoplay = mejs.attributes.autoplay && 'false' !== mejs.attributes.autoplay;

		if ( 'flash' === mejs.pluginType && autoplay ) {
			mejs.addEventListener( 'canplay', function() {
				mejs.play();
			}, false );
		}

		this.mejs = mejs;
	},

	/**
	 * @returns {media.view.MediaDetails} Returns itself to allow chaining
	 */
	render: function() {
		AttachmentDisplay.prototype.render.apply( this, arguments );

		setTimeout( _.bind( function() {
			this.resetFocus();
		}, this ), 10 );

		this.settings = _.defaults( {
			success : this.success
		}, wp.media.mixin.mejsSettings );

		return this.setMedia();
	},

	resetFocus: function() {
		this.$( '.embed-media-settings' ).scrollTop( 0 );
	}
}, {
	instances : 0,
	/**
	 * When multiple players in the DOM contain the same src, things get weird.
	 *
	 * @param {HTMLElement} elem
	 * @returns {HTMLElement}
	 */
	prepareSrc : function( elem ) {
		var i = MediaDetails.instances++;
		_.each( $( elem ).find( 'source' ), function( source ) {
			source.src = [
				source.src,
				source.src.indexOf('?') > -1 ? '&' : '?',
				'_=',
				i
			].join('');
		} );

		return elem;
	}
});

module.exports = MediaDetails;

},{}],10:[function(require,module,exports){
/**
 * wp.media.view.VideoDetails
 *
 * @class
 * @augments wp.media.view.MediaDetails
 * @augments wp.media.view.Settings.AttachmentDisplay
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var MediaDetails = wp.media.view.MediaDetails,
	VideoDetails;

VideoDetails = MediaDetails.extend({
	className: 'video-details',
	template:  wp.template('video-details'),

	setMedia: function() {
		var video = this.$('.wp-video-shortcode');

		if ( video.find( 'source' ).length ) {
			if ( video.is(':hidden') ) {
				video.show();
			}

			if ( ! video.hasClass( 'youtube-video' ) && ! video.hasClass( 'vimeo-video' ) ) {
				this.media = MediaDetails.prepareSrc( video.get(0) );
			} else {
				this.media = video.get(0);
			}
		} else {
			video.hide();
			this.media = false;
		}

		return this;
	}
});

module.exports = VideoDetails;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvYXVkaW92aWRlby5tYW5pZmVzdC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9hdWRpby1kZXRhaWxzLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL2NvbnRyb2xsZXJzL3ZpZGVvLWRldGFpbHMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvbW9kZWxzL3Bvc3QtbWVkaWEuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXVkaW8tZGV0YWlscy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9mcmFtZS9hdWRpby1kZXRhaWxzLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2ZyYW1lL21lZGlhLWRldGFpbHMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZnJhbWUvdmlkZW8tZGV0YWlscy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9tZWRpYS1kZXRhaWxzLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3ZpZGVvLWRldGFpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbWVkaWEgPSB3cC5tZWRpYSxcblx0YmFzZVNldHRpbmdzID0gd2luZG93Ll93cG1lanNTZXR0aW5ncyB8fCB7fSxcblx0bDEwbiA9IHdpbmRvdy5fd3BNZWRpYVZpZXdzTDEwbiB8fCB7fTtcblxuLyoqXG4gKiBAbWl4aW5cbiAqL1xud3AubWVkaWEubWl4aW4gPSB7XG5cdG1lanNTZXR0aW5nczogYmFzZVNldHRpbmdzLFxuXG5cdHJlbW92ZUFsbFBsYXllcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwO1xuXG5cdFx0aWYgKCB3aW5kb3cubWVqcyAmJiB3aW5kb3cubWVqcy5wbGF5ZXJzICkge1xuXHRcdFx0Zm9yICggcCBpbiB3aW5kb3cubWVqcy5wbGF5ZXJzICkge1xuXHRcdFx0XHR3aW5kb3cubWVqcy5wbGF5ZXJzW3BdLnBhdXNlKCk7XG5cdFx0XHRcdHRoaXMucmVtb3ZlUGxheWVyKCB3aW5kb3cubWVqcy5wbGF5ZXJzW3BdICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBPdmVycmlkZSB0aGUgTWVkaWFFbGVtZW50IG1ldGhvZCBmb3IgcmVtb3ZpbmcgYSBwbGF5ZXIuXG5cdCAqXHRNZWRpYUVsZW1lbnQgdHJpZXMgdG8gcHVsbCB0aGUgYXVkaW8vdmlkZW8gdGFnIG91dCBvZlxuXHQgKlx0aXRzIGNvbnRhaW5lciBhbmQgcmUtYWRkIGl0IHRvIHRoZSBET00uXG5cdCAqL1xuXHRyZW1vdmVQbGF5ZXI6IGZ1bmN0aW9uKHQpIHtcblx0XHR2YXIgZmVhdHVyZUluZGV4LCBmZWF0dXJlO1xuXG5cdFx0aWYgKCAhIHQub3B0aW9ucyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBpbnZva2UgZmVhdHVyZXMgY2xlYW51cFxuXHRcdGZvciAoIGZlYXR1cmVJbmRleCBpbiB0Lm9wdGlvbnMuZmVhdHVyZXMgKSB7XG5cdFx0XHRmZWF0dXJlID0gdC5vcHRpb25zLmZlYXR1cmVzW2ZlYXR1cmVJbmRleF07XG5cdFx0XHRpZiAoIHRbJ2NsZWFuJyArIGZlYXR1cmVdICkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHRbJ2NsZWFuJyArIGZlYXR1cmVdKHQpO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICggISB0LmlzRHluYW1pYyApIHtcblx0XHRcdHQuJG5vZGUucmVtb3ZlKCk7XG5cdFx0fVxuXG5cdFx0aWYgKCAnbmF0aXZlJyAhPT0gdC5tZWRpYS5wbHVnaW5UeXBlICkge1xuXHRcdFx0dC4kbWVkaWEucmVtb3ZlKCk7XG5cdFx0fVxuXG5cdFx0ZGVsZXRlIHdpbmRvdy5tZWpzLnBsYXllcnNbdC5pZF07XG5cblx0XHR0LmNvbnRhaW5lci5yZW1vdmUoKTtcblx0XHR0Lmdsb2JhbFVuYmluZCgpO1xuXHRcdGRlbGV0ZSB0Lm5vZGUucGxheWVyO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBbGxvd3MgYW55IGNsYXNzIHRoYXQgaGFzIHNldCAncGxheWVyJyB0byBhIE1lZGlhRWxlbWVudFBsYXllclxuXHQgKiAgaW5zdGFuY2UgdG8gcmVtb3ZlIHRoZSBwbGF5ZXIgd2hlbiBsaXN0ZW5pbmcgdG8gZXZlbnRzLlxuXHQgKlxuXHQgKiAgRXhhbXBsZXM6IG1vZGFsIGNsb3Nlcywgc2hvcnRjb2RlIHByb3BlcnRpZXMgYXJlIHJlbW92ZWQsIGV0Yy5cblx0ICovXG5cdHVuc2V0UGxheWVycyA6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5wbGF5ZXJzICYmIHRoaXMucGxheWVycy5sZW5ndGggKSB7XG5cdFx0XHRfLmVhY2goIHRoaXMucGxheWVycywgZnVuY3Rpb24gKHBsYXllcikge1xuXHRcdFx0XHRwbGF5ZXIucGF1c2UoKTtcblx0XHRcdFx0d3AubWVkaWEubWl4aW4ucmVtb3ZlUGxheWVyKCBwbGF5ZXIgKTtcblx0XHRcdH0gKTtcblx0XHRcdHRoaXMucGxheWVycyA9IFtdO1xuXHRcdH1cblx0fVxufTtcblxuLyoqXG4gKiBBdXRvd2lyZSBcImNvbGxlY3Rpb25cIi10eXBlIHNob3J0Y29kZXNcbiAqL1xud3AubWVkaWEucGxheWxpc3QgPSBuZXcgd3AubWVkaWEuY29sbGVjdGlvbih7XG5cdHRhZzogJ3BsYXlsaXN0Jyxcblx0ZWRpdFRpdGxlIDogbDEwbi5lZGl0UGxheWxpc3RUaXRsZSxcblx0ZGVmYXVsdHMgOiB7XG5cdFx0aWQ6IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MucG9zdC5pZCxcblx0XHRzdHlsZTogJ2xpZ2h0Jyxcblx0XHR0cmFja2xpc3Q6IHRydWUsXG5cdFx0dHJhY2tudW1iZXJzOiB0cnVlLFxuXHRcdGltYWdlczogdHJ1ZSxcblx0XHRhcnRpc3RzOiB0cnVlLFxuXHRcdHR5cGU6ICdhdWRpbydcblx0fVxufSk7XG5cbi8qKlxuICogU2hvcnRjb2RlIG1vZGVsaW5nIGZvciBhdWRpb1xuICogIGBlZGl0KClgIHByZXBhcmVzIHRoZSBzaG9ydGNvZGUgZm9yIHRoZSBtZWRpYSBtb2RhbFxuICogIGBzaG9ydGNvZGUoKWAgYnVpbGRzIHRoZSBuZXcgc2hvcnRjb2RlIGFmdGVyIHVwZGF0ZVxuICpcbiAqIEBuYW1lc3BhY2VcbiAqL1xud3AubWVkaWEuYXVkaW8gPSB7XG5cdGNvZXJjZSA6IHdwLm1lZGlhLmNvZXJjZSxcblxuXHRkZWZhdWx0cyA6IHtcblx0XHRpZCA6IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MucG9zdC5pZCxcblx0XHRzcmMgOiAnJyxcblx0XHRsb29wIDogZmFsc2UsXG5cdFx0YXV0b3BsYXkgOiBmYWxzZSxcblx0XHRwcmVsb2FkIDogJ25vbmUnLFxuXHRcdHdpZHRoIDogNDAwXG5cdH0sXG5cblx0ZWRpdCA6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdHZhciBmcmFtZSwgc2hvcnRjb2RlID0gd3Auc2hvcnRjb2RlLm5leHQoICdhdWRpbycsIGRhdGEgKS5zaG9ydGNvZGU7XG5cblx0XHRmcmFtZSA9IHdwLm1lZGlhKHtcblx0XHRcdGZyYW1lOiAnYXVkaW8nLFxuXHRcdFx0c3RhdGU6ICdhdWRpby1kZXRhaWxzJyxcblx0XHRcdG1ldGFkYXRhOiBfLmRlZmF1bHRzKCBzaG9ydGNvZGUuYXR0cnMubmFtZWQsIHRoaXMuZGVmYXVsdHMgKVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGZyYW1lO1xuXHR9LFxuXG5cdHNob3J0Y29kZSA6IGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHR2YXIgY29udGVudDtcblxuXHRcdF8uZWFjaCggdGhpcy5kZWZhdWx0cywgZnVuY3Rpb24oIHZhbHVlLCBrZXkgKSB7XG5cdFx0XHRtb2RlbFsga2V5IF0gPSB0aGlzLmNvZXJjZSggbW9kZWwsIGtleSApO1xuXG5cdFx0XHRpZiAoIHZhbHVlID09PSBtb2RlbFsga2V5IF0gKSB7XG5cdFx0XHRcdGRlbGV0ZSBtb2RlbFsga2V5IF07XG5cdFx0XHR9XG5cdFx0fSwgdGhpcyApO1xuXG5cdFx0Y29udGVudCA9IG1vZGVsLmNvbnRlbnQ7XG5cdFx0ZGVsZXRlIG1vZGVsLmNvbnRlbnQ7XG5cblx0XHRyZXR1cm4gbmV3IHdwLnNob3J0Y29kZSh7XG5cdFx0XHR0YWc6ICdhdWRpbycsXG5cdFx0XHRhdHRyczogbW9kZWwsXG5cdFx0XHRjb250ZW50OiBjb250ZW50XG5cdFx0fSk7XG5cdH1cbn07XG5cbi8qKlxuICogU2hvcnRjb2RlIG1vZGVsaW5nIGZvciB2aWRlb1xuICogIGBlZGl0KClgIHByZXBhcmVzIHRoZSBzaG9ydGNvZGUgZm9yIHRoZSBtZWRpYSBtb2RhbFxuICogIGBzaG9ydGNvZGUoKWAgYnVpbGRzIHRoZSBuZXcgc2hvcnRjb2RlIGFmdGVyIHVwZGF0ZVxuICpcbiAqIEBuYW1lc3BhY2VcbiAqL1xud3AubWVkaWEudmlkZW8gPSB7XG5cdGNvZXJjZSA6IHdwLm1lZGlhLmNvZXJjZSxcblxuXHRkZWZhdWx0cyA6IHtcblx0XHRpZCA6IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MucG9zdC5pZCxcblx0XHRzcmMgOiAnJyxcblx0XHRwb3N0ZXIgOiAnJyxcblx0XHRsb29wIDogZmFsc2UsXG5cdFx0YXV0b3BsYXkgOiBmYWxzZSxcblx0XHRwcmVsb2FkIDogJ21ldGFkYXRhJyxcblx0XHRjb250ZW50IDogJycsXG5cdFx0d2lkdGggOiA2NDAsXG5cdFx0aGVpZ2h0IDogMzYwXG5cdH0sXG5cblx0ZWRpdCA6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdHZhciBmcmFtZSxcblx0XHRcdHNob3J0Y29kZSA9IHdwLnNob3J0Y29kZS5uZXh0KCAndmlkZW8nLCBkYXRhICkuc2hvcnRjb2RlLFxuXHRcdFx0YXR0cnM7XG5cblx0XHRhdHRycyA9IHNob3J0Y29kZS5hdHRycy5uYW1lZDtcblx0XHRhdHRycy5jb250ZW50ID0gc2hvcnRjb2RlLmNvbnRlbnQ7XG5cblx0XHRmcmFtZSA9IHdwLm1lZGlhKHtcblx0XHRcdGZyYW1lOiAndmlkZW8nLFxuXHRcdFx0c3RhdGU6ICd2aWRlby1kZXRhaWxzJyxcblx0XHRcdG1ldGFkYXRhOiBfLmRlZmF1bHRzKCBhdHRycywgdGhpcy5kZWZhdWx0cyApXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gZnJhbWU7XG5cdH0sXG5cblx0c2hvcnRjb2RlIDogZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdHZhciBjb250ZW50O1xuXG5cdFx0Xy5lYWNoKCB0aGlzLmRlZmF1bHRzLCBmdW5jdGlvbiggdmFsdWUsIGtleSApIHtcblx0XHRcdG1vZGVsWyBrZXkgXSA9IHRoaXMuY29lcmNlKCBtb2RlbCwga2V5ICk7XG5cblx0XHRcdGlmICggdmFsdWUgPT09IG1vZGVsWyBrZXkgXSApIHtcblx0XHRcdFx0ZGVsZXRlIG1vZGVsWyBrZXkgXTtcblx0XHRcdH1cblx0XHR9LCB0aGlzICk7XG5cblx0XHRjb250ZW50ID0gbW9kZWwuY29udGVudDtcblx0XHRkZWxldGUgbW9kZWwuY29udGVudDtcblxuXHRcdHJldHVybiBuZXcgd3Auc2hvcnRjb2RlKHtcblx0XHRcdHRhZzogJ3ZpZGVvJyxcblx0XHRcdGF0dHJzOiBtb2RlbCxcblx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRcblx0XHR9KTtcblx0fVxufTtcblxubWVkaWEubW9kZWwuUG9zdE1lZGlhID0gcmVxdWlyZSggJy4vbW9kZWxzL3Bvc3QtbWVkaWEuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkF1ZGlvRGV0YWlscyA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2F1ZGlvLWRldGFpbHMuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLlZpZGVvRGV0YWlscyA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL3ZpZGVvLWRldGFpbHMuanMnICk7XG5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuTWVkaWFEZXRhaWxzID0gcmVxdWlyZSggJy4vdmlld3MvZnJhbWUvbWVkaWEtZGV0YWlscy5qcycgKTtcbm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5BdWRpb0RldGFpbHMgPSByZXF1aXJlKCAnLi92aWV3cy9mcmFtZS9hdWRpby1kZXRhaWxzLmpzJyApO1xubWVkaWEudmlldy5NZWRpYUZyYW1lLlZpZGVvRGV0YWlscyA9IHJlcXVpcmUoICcuL3ZpZXdzL2ZyYW1lL3ZpZGVvLWRldGFpbHMuanMnICk7XG5tZWRpYS52aWV3Lk1lZGlhRGV0YWlscyA9IHJlcXVpcmUoICcuL3ZpZXdzL21lZGlhLWRldGFpbHMuanMnICk7XG5tZWRpYS52aWV3LkF1ZGlvRGV0YWlscyA9IHJlcXVpcmUoICcuL3ZpZXdzL2F1ZGlvLWRldGFpbHMuanMnICk7XG5tZWRpYS52aWV3LlZpZGVvRGV0YWlscyA9IHJlcXVpcmUoICcuL3ZpZXdzL3ZpZGVvLWRldGFpbHMuanMnICk7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuQXVkaW9EZXRhaWxzXG4gKlxuICogVGhlIGNvbnRyb2xsZXIgZm9yIHRoZSBBdWRpbyBEZXRhaWxzIHN0YXRlXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKi9cbnZhciBTdGF0ZSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUsXG5cdGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdEF1ZGlvRGV0YWlscztcblxuQXVkaW9EZXRhaWxzID0gU3RhdGUuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IHtcblx0XHRpZDogJ2F1ZGlvLWRldGFpbHMnLFxuXHRcdHRvb2xiYXI6ICdhdWRpby1kZXRhaWxzJyxcblx0XHR0aXRsZTogbDEwbi5hdWRpb0RldGFpbHNUaXRsZSxcblx0XHRjb250ZW50OiAnYXVkaW8tZGV0YWlscycsXG5cdFx0bWVudTogJ2F1ZGlvLWRldGFpbHMnLFxuXHRcdHJvdXRlcjogZmFsc2UsXG5cdFx0cHJpb3JpdHk6IDYwXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5tZWRpYSA9IG9wdGlvbnMubWVkaWE7XG5cdFx0U3RhdGUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdWRpb0RldGFpbHM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuVmlkZW9EZXRhaWxzXG4gKlxuICogVGhlIGNvbnRyb2xsZXIgZm9yIHRoZSBWaWRlbyBEZXRhaWxzIHN0YXRlXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKi9cbnZhciBTdGF0ZSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUsXG5cdGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdFZpZGVvRGV0YWlscztcblxuVmlkZW9EZXRhaWxzID0gU3RhdGUuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IHtcblx0XHRpZDogJ3ZpZGVvLWRldGFpbHMnLFxuXHRcdHRvb2xiYXI6ICd2aWRlby1kZXRhaWxzJyxcblx0XHR0aXRsZTogbDEwbi52aWRlb0RldGFpbHNUaXRsZSxcblx0XHRjb250ZW50OiAndmlkZW8tZGV0YWlscycsXG5cdFx0bWVudTogJ3ZpZGVvLWRldGFpbHMnLFxuXHRcdHJvdXRlcjogZmFsc2UsXG5cdFx0cHJpb3JpdHk6IDYwXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5tZWRpYSA9IG9wdGlvbnMubWVkaWE7XG5cdFx0U3RhdGUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWRlb0RldGFpbHM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLm1vZGVsLlBvc3RNZWRpYVxuICpcbiAqIFNoYXJlZCBtb2RlbCBjbGFzcyBmb3IgYXVkaW8gYW5kIHZpZGVvLiBVcGRhdGVzIHRoZSBtb2RlbCBhZnRlclxuICogICBcIkFkZCBBdWRpb3xWaWRlbyBTb3VyY2VcIiBhbmQgXCJSZXBsYWNlIEF1ZGlvfFZpZGVvXCIgc3RhdGVzIHJldHVyblxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKi9cbnZhciBQb3N0TWVkaWEgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmF0dGFjaG1lbnQgPSBmYWxzZTtcblx0fSxcblxuXHRzZXRTb3VyY2U6IGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdHRoaXMuYXR0YWNobWVudCA9IGF0dGFjaG1lbnQ7XG5cdFx0dGhpcy5leHRlbnNpb24gPSBhdHRhY2htZW50LmdldCggJ2ZpbGVuYW1lJyApLnNwbGl0KCcuJykucG9wKCk7XG5cblx0XHRpZiAoIHRoaXMuZ2V0KCAnc3JjJyApICYmIHRoaXMuZXh0ZW5zaW9uID09PSB0aGlzLmdldCggJ3NyYycgKS5zcGxpdCgnLicpLnBvcCgpICkge1xuXHRcdFx0dGhpcy51bnNldCggJ3NyYycgKTtcblx0XHR9XG5cblx0XHRpZiAoIF8uY29udGFpbnMoIHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MuZW1iZWRFeHRzLCB0aGlzLmV4dGVuc2lvbiApICkge1xuXHRcdFx0dGhpcy5zZXQoIHRoaXMuZXh0ZW5zaW9uLCB0aGlzLmF0dGFjaG1lbnQuZ2V0KCAndXJsJyApICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudW5zZXQoIHRoaXMuZXh0ZW5zaW9uICk7XG5cdFx0fVxuXHR9LFxuXG5cdGNoYW5nZUF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdHRoaXMuc2V0U291cmNlKCBhdHRhY2htZW50ICk7XG5cblx0XHR0aGlzLnVuc2V0KCAnc3JjJyApO1xuXHRcdF8uZWFjaCggXy53aXRob3V0KCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLmVtYmVkRXh0cywgdGhpcy5leHRlbnNpb24gKSwgZnVuY3Rpb24oIGV4dCApIHtcblx0XHRcdHRoaXMudW5zZXQoIGV4dCApO1xuXHRcdH0sIHRoaXMgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9zdE1lZGlhO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF1ZGlvRGV0YWlsc1xuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuTWVkaWFEZXRhaWxzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIE1lZGlhRGV0YWlscyA9IHdwLm1lZGlhLnZpZXcuTWVkaWFEZXRhaWxzLFxuXHRBdWRpb0RldGFpbHM7XG5cbkF1ZGlvRGV0YWlscyA9IE1lZGlhRGV0YWlscy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdhdWRpby1kZXRhaWxzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgnYXVkaW8tZGV0YWlscycpLFxuXG5cdHNldE1lZGlhOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYXVkaW8gPSB0aGlzLiQoJy53cC1hdWRpby1zaG9ydGNvZGUnKTtcblxuXHRcdGlmICggYXVkaW8uZmluZCggJ3NvdXJjZScgKS5sZW5ndGggKSB7XG5cdFx0XHRpZiAoIGF1ZGlvLmlzKCc6aGlkZGVuJykgKSB7XG5cdFx0XHRcdGF1ZGlvLnNob3coKTtcblx0XHRcdH1cblx0XHRcdHRoaXMubWVkaWEgPSBNZWRpYURldGFpbHMucHJlcGFyZVNyYyggYXVkaW8uZ2V0KDApICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGF1ZGlvLmhpZGUoKTtcblx0XHRcdHRoaXMubWVkaWEgPSBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXVkaW9EZXRhaWxzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuQXVkaW9EZXRhaWxzXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLk1lZGlhRGV0YWlsc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5TZWxlY3RcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWVcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkZyYW1lXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKiBAbWl4ZXMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmVcbiAqL1xudmFyIE1lZGlhRGV0YWlscyA9IHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5NZWRpYURldGFpbHMsXG5cdE1lZGlhTGlicmFyeSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuTWVkaWFMaWJyYXJ5LFxuXG5cdGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdEF1ZGlvRGV0YWlscztcblxuQXVkaW9EZXRhaWxzID0gTWVkaWFEZXRhaWxzLmV4dGVuZCh7XG5cdGRlZmF1bHRzOiB7XG5cdFx0aWQ6ICAgICAgJ2F1ZGlvJyxcblx0XHR1cmw6ICAgICAnJyxcblx0XHRtZW51OiAgICAnYXVkaW8tZGV0YWlscycsXG5cdFx0Y29udGVudDogJ2F1ZGlvLWRldGFpbHMnLFxuXHRcdHRvb2xiYXI6ICdhdWRpby1kZXRhaWxzJyxcblx0XHR0eXBlOiAgICAnbGluaycsXG5cdFx0dGl0bGU6ICAgIGwxMG4uYXVkaW9EZXRhaWxzVGl0bGUsXG5cdFx0cHJpb3JpdHk6IDEyMFxuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdG9wdGlvbnMuRGV0YWlsc1ZpZXcgPSB3cC5tZWRpYS52aWV3LkF1ZGlvRGV0YWlscztcblx0XHRvcHRpb25zLmNhbmNlbFRleHQgPSBsMTBuLmF1ZGlvRGV0YWlsc0NhbmNlbDtcblx0XHRvcHRpb25zLmFkZFRleHQgPSBsMTBuLmF1ZGlvQWRkU291cmNlVGl0bGU7XG5cblx0XHRNZWRpYURldGFpbHMucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0aW9ucyApO1xuXHR9LFxuXG5cdGJpbmRIYW5kbGVyczogZnVuY3Rpb24oKSB7XG5cdFx0TWVkaWFEZXRhaWxzLnByb3RvdHlwZS5iaW5kSGFuZGxlcnMuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dGhpcy5vbiggJ3Rvb2xiYXI6cmVuZGVyOnJlcGxhY2UtYXVkaW8nLCB0aGlzLnJlbmRlclJlcGxhY2VUb29sYmFyLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ3Rvb2xiYXI6cmVuZGVyOmFkZC1hdWRpby1zb3VyY2UnLCB0aGlzLnJlbmRlckFkZFNvdXJjZVRvb2xiYXIsIHRoaXMgKTtcblx0fSxcblxuXHRjcmVhdGVTdGF0ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc3RhdGVzLmFkZChbXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5BdWRpb0RldGFpbHMoIHtcblx0XHRcdFx0bWVkaWE6IHRoaXMubWVkaWFcblx0XHRcdH0gKSxcblxuXHRcdFx0bmV3IE1lZGlhTGlicmFyeSgge1xuXHRcdFx0XHR0eXBlOiAnYXVkaW8nLFxuXHRcdFx0XHRpZDogJ3JlcGxhY2UtYXVkaW8nLFxuXHRcdFx0XHR0aXRsZTogbDEwbi5hdWRpb1JlcGxhY2VUaXRsZSxcblx0XHRcdFx0dG9vbGJhcjogJ3JlcGxhY2UtYXVkaW8nLFxuXHRcdFx0XHRtZWRpYTogdGhpcy5tZWRpYSxcblx0XHRcdFx0bWVudTogJ2F1ZGlvLWRldGFpbHMnXG5cdFx0XHR9ICksXG5cblx0XHRcdG5ldyBNZWRpYUxpYnJhcnkoIHtcblx0XHRcdFx0dHlwZTogJ2F1ZGlvJyxcblx0XHRcdFx0aWQ6ICdhZGQtYXVkaW8tc291cmNlJyxcblx0XHRcdFx0dGl0bGU6IGwxMG4uYXVkaW9BZGRTb3VyY2VUaXRsZSxcblx0XHRcdFx0dG9vbGJhcjogJ2FkZC1hdWRpby1zb3VyY2UnLFxuXHRcdFx0XHRtZWRpYTogdGhpcy5tZWRpYSxcblx0XHRcdFx0bWVudTogZmFsc2Vcblx0XHRcdH0gKVxuXHRcdF0pO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdWRpb0RldGFpbHM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5NZWRpYURldGFpbHNcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuU2VsZWN0XG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5GcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICogQG1peGVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lXG4gKi9cbnZhciBTZWxlY3QgPSB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuU2VsZWN0LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRNZWRpYURldGFpbHM7XG5cbk1lZGlhRGV0YWlscyA9IFNlbGVjdC5leHRlbmQoe1xuXHRkZWZhdWx0czoge1xuXHRcdGlkOiAgICAgICdtZWRpYScsXG5cdFx0dXJsOiAgICAgJycsXG5cdFx0bWVudTogICAgJ21lZGlhLWRldGFpbHMnLFxuXHRcdGNvbnRlbnQ6ICdtZWRpYS1kZXRhaWxzJyxcblx0XHR0b29sYmFyOiAnbWVkaWEtZGV0YWlscycsXG5cdFx0dHlwZTogICAgJ2xpbmsnLFxuXHRcdHByaW9yaXR5OiAxMjBcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR0aGlzLkRldGFpbHNWaWV3ID0gb3B0aW9ucy5EZXRhaWxzVmlldztcblx0XHR0aGlzLmNhbmNlbFRleHQgPSBvcHRpb25zLmNhbmNlbFRleHQ7XG5cdFx0dGhpcy5hZGRUZXh0ID0gb3B0aW9ucy5hZGRUZXh0O1xuXG5cdFx0dGhpcy5tZWRpYSA9IG5ldyB3cC5tZWRpYS5tb2RlbC5Qb3N0TWVkaWEoIG9wdGlvbnMubWV0YWRhdGEgKTtcblx0XHR0aGlzLm9wdGlvbnMuc2VsZWN0aW9uID0gbmV3IHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbiggdGhpcy5tZWRpYS5hdHRhY2htZW50LCB7IG11bHRpcGxlOiBmYWxzZSB9ICk7XG5cdFx0U2VsZWN0LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRiaW5kSGFuZGxlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtZW51ID0gdGhpcy5kZWZhdWx0cy5tZW51O1xuXG5cdFx0U2VsZWN0LnByb3RvdHlwZS5iaW5kSGFuZGxlcnMuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dGhpcy5vbiggJ21lbnU6Y3JlYXRlOicgKyBtZW51LCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnY29udGVudDpyZW5kZXI6JyArIG1lbnUsIHRoaXMucmVuZGVyRGV0YWlsc0NvbnRlbnQsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnbWVudTpyZW5kZXI6JyArIG1lbnUsIHRoaXMucmVuZGVyTWVudSwgdGhpcyApO1xuXHRcdHRoaXMub24oICd0b29sYmFyOnJlbmRlcjonICsgbWVudSwgdGhpcy5yZW5kZXJEZXRhaWxzVG9vbGJhciwgdGhpcyApO1xuXHR9LFxuXG5cdHJlbmRlckRldGFpbHNDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmlldyA9IG5ldyB0aGlzLkRldGFpbHNWaWV3KHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRtb2RlbDogdGhpcy5zdGF0ZSgpLm1lZGlhLFxuXHRcdFx0YXR0YWNobWVudDogdGhpcy5zdGF0ZSgpLm1lZGlhLmF0dGFjaG1lbnRcblx0XHR9KS5yZW5kZXIoKTtcblxuXHRcdHRoaXMuY29udGVudC5zZXQoIHZpZXcgKTtcblx0fSxcblxuXHRyZW5kZXJNZW51OiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgbGFzdFN0YXRlID0gdGhpcy5sYXN0U3RhdGUoKSxcblx0XHRcdHByZXZpb3VzID0gbGFzdFN0YXRlICYmIGxhc3RTdGF0ZS5pZCxcblx0XHRcdGZyYW1lID0gdGhpcztcblxuXHRcdHZpZXcuc2V0KHtcblx0XHRcdGNhbmNlbDoge1xuXHRcdFx0XHR0ZXh0OiAgICAgdGhpcy5jYW5jZWxUZXh0LFxuXHRcdFx0XHRwcmlvcml0eTogMjAsXG5cdFx0XHRcdGNsaWNrOiAgICBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZiAoIHByZXZpb3VzICkge1xuXHRcdFx0XHRcdFx0ZnJhbWUuc2V0U3RhdGUoIHByZXZpb3VzICk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGZyYW1lLmNsb3NlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0c2VwYXJhdGVDYW5jZWw6IG5ldyB3cC5tZWRpYS5WaWV3KHtcblx0XHRcdFx0Y2xhc3NOYW1lOiAnc2VwYXJhdG9yJyxcblx0XHRcdFx0cHJpb3JpdHk6IDQwXG5cdFx0XHR9KVxuXHRcdH0pO1xuXG5cdH0sXG5cblx0c2V0UHJpbWFyeUJ1dHRvbjogZnVuY3Rpb24odGV4dCwgaGFuZGxlcikge1xuXHRcdHRoaXMudG9vbGJhci5zZXQoIG5ldyB3cC5tZWRpYS52aWV3LlRvb2xiYXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGl0ZW1zOiB7XG5cdFx0XHRcdGJ1dHRvbjoge1xuXHRcdFx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRcdFx0dGV4dDogICAgIHRleHQsXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDgwLFxuXHRcdFx0XHRcdGNsaWNrOiAgICBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyO1xuXHRcdFx0XHRcdFx0aGFuZGxlci5jYWxsKCB0aGlzLCBjb250cm9sbGVyLCBjb250cm9sbGVyLnN0YXRlKCkgKTtcblx0XHRcdFx0XHRcdC8vIFJlc3RvcmUgYW5kIHJlc2V0IHRoZSBkZWZhdWx0IHN0YXRlLlxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSggY29udHJvbGxlci5vcHRpb25zLnN0YXRlICk7XG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLnJlc2V0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHRyZW5kZXJEZXRhaWxzVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRQcmltYXJ5QnV0dG9uKCBsMTBuLnVwZGF0ZSwgZnVuY3Rpb24oIGNvbnRyb2xsZXIsIHN0YXRlICkge1xuXHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXHRcdFx0c3RhdGUudHJpZ2dlciggJ3VwZGF0ZScsIGNvbnRyb2xsZXIubWVkaWEudG9KU09OKCkgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0cmVuZGVyUmVwbGFjZVRvb2xiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc2V0UHJpbWFyeUJ1dHRvbiggbDEwbi5yZXBsYWNlLCBmdW5jdGlvbiggY29udHJvbGxlciwgc3RhdGUgKSB7XG5cdFx0XHR2YXIgYXR0YWNobWVudCA9IHN0YXRlLmdldCggJ3NlbGVjdGlvbicgKS5zaW5nbGUoKTtcblx0XHRcdGNvbnRyb2xsZXIubWVkaWEuY2hhbmdlQXR0YWNobWVudCggYXR0YWNobWVudCApO1xuXHRcdFx0c3RhdGUudHJpZ2dlciggJ3JlcGxhY2UnLCBjb250cm9sbGVyLm1lZGlhLnRvSlNPTigpICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdHJlbmRlckFkZFNvdXJjZVRvb2xiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc2V0UHJpbWFyeUJ1dHRvbiggdGhpcy5hZGRUZXh0LCBmdW5jdGlvbiggY29udHJvbGxlciwgc3RhdGUgKSB7XG5cdFx0XHR2YXIgYXR0YWNobWVudCA9IHN0YXRlLmdldCggJ3NlbGVjdGlvbicgKS5zaW5nbGUoKTtcblx0XHRcdGNvbnRyb2xsZXIubWVkaWEuc2V0U291cmNlKCBhdHRhY2htZW50ICk7XG5cdFx0XHRzdGF0ZS50cmlnZ2VyKCAnYWRkLXNvdXJjZScsIGNvbnRyb2xsZXIubWVkaWEudG9KU09OKCkgKTtcblx0XHR9ICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lZGlhRGV0YWlscztcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLlZpZGVvRGV0YWlsc1xuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5NZWRpYURldGFpbHNcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuU2VsZWN0XG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5GcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICogQG1peGVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lXG4gKi9cbnZhciBNZWRpYURldGFpbHMgPSB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuTWVkaWFEZXRhaWxzLFxuXHRNZWRpYUxpYnJhcnkgPSB3cC5tZWRpYS5jb250cm9sbGVyLk1lZGlhTGlicmFyeSxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0VmlkZW9EZXRhaWxzO1xuXG5WaWRlb0RldGFpbHMgPSBNZWRpYURldGFpbHMuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IHtcblx0XHRpZDogICAgICAndmlkZW8nLFxuXHRcdHVybDogICAgICcnLFxuXHRcdG1lbnU6ICAgICd2aWRlby1kZXRhaWxzJyxcblx0XHRjb250ZW50OiAndmlkZW8tZGV0YWlscycsXG5cdFx0dG9vbGJhcjogJ3ZpZGVvLWRldGFpbHMnLFxuXHRcdHR5cGU6ICAgICdsaW5rJyxcblx0XHR0aXRsZTogICAgbDEwbi52aWRlb0RldGFpbHNUaXRsZSxcblx0XHRwcmlvcml0eTogMTIwXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0b3B0aW9ucy5EZXRhaWxzVmlldyA9IHdwLm1lZGlhLnZpZXcuVmlkZW9EZXRhaWxzO1xuXHRcdG9wdGlvbnMuY2FuY2VsVGV4dCA9IGwxMG4udmlkZW9EZXRhaWxzQ2FuY2VsO1xuXHRcdG9wdGlvbnMuYWRkVGV4dCA9IGwxMG4udmlkZW9BZGRTb3VyY2VUaXRsZTtcblxuXHRcdE1lZGlhRGV0YWlscy5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRpb25zICk7XG5cdH0sXG5cblx0YmluZEhhbmRsZXJzOiBmdW5jdGlvbigpIHtcblx0XHRNZWRpYURldGFpbHMucHJvdG90eXBlLmJpbmRIYW5kbGVycy5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHR0aGlzLm9uKCAndG9vbGJhcjpyZW5kZXI6cmVwbGFjZS12aWRlbycsIHRoaXMucmVuZGVyUmVwbGFjZVRvb2xiYXIsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpyZW5kZXI6YWRkLXZpZGVvLXNvdXJjZScsIHRoaXMucmVuZGVyQWRkU291cmNlVG9vbGJhciwgdGhpcyApO1xuXHRcdHRoaXMub24oICd0b29sYmFyOnJlbmRlcjpzZWxlY3QtcG9zdGVyLWltYWdlJywgdGhpcy5yZW5kZXJTZWxlY3RQb3N0ZXJJbWFnZVRvb2xiYXIsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpyZW5kZXI6YWRkLXRyYWNrJywgdGhpcy5yZW5kZXJBZGRUcmFja1Rvb2xiYXIsIHRoaXMgKTtcblx0fSxcblxuXHRjcmVhdGVTdGF0ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc3RhdGVzLmFkZChbXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5WaWRlb0RldGFpbHMoe1xuXHRcdFx0XHRtZWRpYTogdGhpcy5tZWRpYVxuXHRcdFx0fSksXG5cblx0XHRcdG5ldyBNZWRpYUxpYnJhcnkoIHtcblx0XHRcdFx0dHlwZTogJ3ZpZGVvJyxcblx0XHRcdFx0aWQ6ICdyZXBsYWNlLXZpZGVvJyxcblx0XHRcdFx0dGl0bGU6IGwxMG4udmlkZW9SZXBsYWNlVGl0bGUsXG5cdFx0XHRcdHRvb2xiYXI6ICdyZXBsYWNlLXZpZGVvJyxcblx0XHRcdFx0bWVkaWE6IHRoaXMubWVkaWEsXG5cdFx0XHRcdG1lbnU6ICd2aWRlby1kZXRhaWxzJ1xuXHRcdFx0fSApLFxuXG5cdFx0XHRuZXcgTWVkaWFMaWJyYXJ5KCB7XG5cdFx0XHRcdHR5cGU6ICd2aWRlbycsXG5cdFx0XHRcdGlkOiAnYWRkLXZpZGVvLXNvdXJjZScsXG5cdFx0XHRcdHRpdGxlOiBsMTBuLnZpZGVvQWRkU291cmNlVGl0bGUsXG5cdFx0XHRcdHRvb2xiYXI6ICdhZGQtdmlkZW8tc291cmNlJyxcblx0XHRcdFx0bWVkaWE6IHRoaXMubWVkaWEsXG5cdFx0XHRcdG1lbnU6IGZhbHNlXG5cdFx0XHR9ICksXG5cblx0XHRcdG5ldyBNZWRpYUxpYnJhcnkoIHtcblx0XHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdFx0aWQ6ICdzZWxlY3QtcG9zdGVyLWltYWdlJyxcblx0XHRcdFx0dGl0bGU6IGwxMG4udmlkZW9TZWxlY3RQb3N0ZXJJbWFnZVRpdGxlLFxuXHRcdFx0XHR0b29sYmFyOiAnc2VsZWN0LXBvc3Rlci1pbWFnZScsXG5cdFx0XHRcdG1lZGlhOiB0aGlzLm1lZGlhLFxuXHRcdFx0XHRtZW51OiAndmlkZW8tZGV0YWlscydcblx0XHRcdH0gKSxcblxuXHRcdFx0bmV3IE1lZGlhTGlicmFyeSgge1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGlkOiAnYWRkLXRyYWNrJyxcblx0XHRcdFx0dGl0bGU6IGwxMG4udmlkZW9BZGRUcmFja1RpdGxlLFxuXHRcdFx0XHR0b29sYmFyOiAnYWRkLXRyYWNrJyxcblx0XHRcdFx0bWVkaWE6IHRoaXMubWVkaWEsXG5cdFx0XHRcdG1lbnU6ICd2aWRlby1kZXRhaWxzJ1xuXHRcdFx0fSApXG5cdFx0XSk7XG5cdH0sXG5cblx0cmVuZGVyU2VsZWN0UG9zdGVySW1hZ2VUb29sYmFyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNldFByaW1hcnlCdXR0b24oIGwxMG4udmlkZW9TZWxlY3RQb3N0ZXJJbWFnZVRpdGxlLCBmdW5jdGlvbiggY29udHJvbGxlciwgc3RhdGUgKSB7XG5cdFx0XHR2YXIgdXJscyA9IFtdLCBhdHRhY2htZW50ID0gc3RhdGUuZ2V0KCAnc2VsZWN0aW9uJyApLnNpbmdsZSgpO1xuXG5cdFx0XHRjb250cm9sbGVyLm1lZGlhLnNldCggJ3Bvc3RlcicsIGF0dGFjaG1lbnQuZ2V0KCAndXJsJyApICk7XG5cdFx0XHRzdGF0ZS50cmlnZ2VyKCAnc2V0LXBvc3Rlci1pbWFnZScsIGNvbnRyb2xsZXIubWVkaWEudG9KU09OKCkgKTtcblxuXHRcdFx0Xy5lYWNoKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLmVtYmVkRXh0cywgZnVuY3Rpb24gKGV4dCkge1xuXHRcdFx0XHRpZiAoIGNvbnRyb2xsZXIubWVkaWEuZ2V0KCBleHQgKSApIHtcblx0XHRcdFx0XHR1cmxzLnB1c2goIGNvbnRyb2xsZXIubWVkaWEuZ2V0KCBleHQgKSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdHdwLmFqYXguc2VuZCggJ3NldC1hdHRhY2htZW50LXRodW1ibmFpbCcsIHtcblx0XHRcdFx0ZGF0YSA6IHtcblx0XHRcdFx0XHR1cmxzOiB1cmxzLFxuXHRcdFx0XHRcdHRodW1ibmFpbF9pZDogYXR0YWNobWVudC5nZXQoICdpZCcgKVxuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdHJlbmRlckFkZFRyYWNrVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRQcmltYXJ5QnV0dG9uKCBsMTBuLnZpZGVvQWRkVHJhY2tUaXRsZSwgZnVuY3Rpb24oIGNvbnRyb2xsZXIsIHN0YXRlICkge1xuXHRcdFx0dmFyIGF0dGFjaG1lbnQgPSBzdGF0ZS5nZXQoICdzZWxlY3Rpb24nICkuc2luZ2xlKCksXG5cdFx0XHRcdGNvbnRlbnQgPSBjb250cm9sbGVyLm1lZGlhLmdldCggJ2NvbnRlbnQnICk7XG5cblx0XHRcdGlmICggLTEgPT09IGNvbnRlbnQuaW5kZXhPZiggYXR0YWNobWVudC5nZXQoICd1cmwnICkgKSApIHtcblx0XHRcdFx0Y29udGVudCArPSBbXG5cdFx0XHRcdFx0Jzx0cmFjayBzcmNsYW5nPVwiZW5cIiBsYWJlbD1cIkVuZ2xpc2hcIiBraW5kPVwic3VidGl0bGVzXCIgc3JjPVwiJyxcblx0XHRcdFx0XHRhdHRhY2htZW50LmdldCggJ3VybCcgKSxcblx0XHRcdFx0XHQnXCIgLz4nXG5cdFx0XHRcdF0uam9pbignJyk7XG5cblx0XHRcdFx0Y29udHJvbGxlci5tZWRpYS5zZXQoICdjb250ZW50JywgY29udGVudCApO1xuXHRcdFx0fVxuXHRcdFx0c3RhdGUudHJpZ2dlciggJ2FkZC10cmFjaycsIGNvbnRyb2xsZXIubWVkaWEudG9KU09OKCkgKTtcblx0XHR9ICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZGVvRGV0YWlscztcbiIsIi8qIGdsb2JhbCBNZWRpYUVsZW1lbnRQbGF5ZXIgKi9cblxuLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lZGlhRGV0YWlsc1xuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3MuQXR0YWNobWVudERpc3BsYXlcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlNldHRpbmdzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBBdHRhY2htZW50RGlzcGxheSA9IHdwLm1lZGlhLnZpZXcuU2V0dGluZ3MuQXR0YWNobWVudERpc3BsYXksXG5cdCQgPSBqUXVlcnksXG5cdE1lZGlhRGV0YWlscztcblxuTWVkaWFEZXRhaWxzID0gQXR0YWNobWVudERpc3BsYXkuZXh0ZW5kKHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Xy5iaW5kQWxsKHRoaXMsICdzdWNjZXNzJyk7XG5cdFx0dGhpcy5wbGF5ZXJzID0gW107XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jb250cm9sbGVyLCAnY2xvc2UnLCB3cC5tZWRpYS5taXhpbi51bnNldFBsYXllcnMgKTtcblx0XHR0aGlzLm9uKCAncmVhZHknLCB0aGlzLnNldFBsYXllciApO1xuXHRcdHRoaXMub24oICdtZWRpYTpzZXR0aW5nOnJlbW92ZScsIHdwLm1lZGlhLm1peGluLnVuc2V0UGxheWVycywgdGhpcyApO1xuXHRcdHRoaXMub24oICdtZWRpYTpzZXR0aW5nOnJlbW92ZScsIHRoaXMucmVuZGVyICk7XG5cdFx0dGhpcy5vbiggJ21lZGlhOnNldHRpbmc6cmVtb3ZlJywgdGhpcy5zZXRQbGF5ZXIgKTtcblxuXHRcdEF0dGFjaG1lbnREaXNwbGF5LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRldmVudHM6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIF8uZXh0ZW5kKCB7XG5cdFx0XHQnY2xpY2sgLnJlbW92ZS1zZXR0aW5nJyA6ICdyZW1vdmVTZXR0aW5nJyxcblx0XHRcdCdjaGFuZ2UgLmNvbnRlbnQtdHJhY2snIDogJ3NldFRyYWNrcycsXG5cdFx0XHQnY2xpY2sgLnJlbW92ZS10cmFjaycgOiAnc2V0VHJhY2tzJyxcblx0XHRcdCdjbGljayAuYWRkLW1lZGlhLXNvdXJjZScgOiAnYWRkU291cmNlJ1xuXHRcdH0sIEF0dGFjaG1lbnREaXNwbGF5LnByb3RvdHlwZS5ldmVudHMgKTtcblx0fSxcblxuXHRwcmVwYXJlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5kZWZhdWx0cyh7XG5cdFx0XHRtb2RlbDogdGhpcy5tb2RlbC50b0pTT04oKVxuXHRcdH0sIHRoaXMub3B0aW9ucyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgYSBzZXR0aW5nJ3MgVUkgd2hlbiB0aGUgbW9kZWwgdW5zZXRzIGl0XG5cdCAqXG5cdCAqIEBmaXJlcyB3cC5tZWRpYS52aWV3Lk1lZGlhRGV0YWlscyNtZWRpYTpzZXR0aW5nOnJlbW92ZVxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBlXG5cdCAqL1xuXHRyZW1vdmVTZXR0aW5nIDogZnVuY3Rpb24oZSkge1xuXHRcdHZhciB3cmFwID0gJCggZS5jdXJyZW50VGFyZ2V0ICkucGFyZW50KCksIHNldHRpbmc7XG5cdFx0c2V0dGluZyA9IHdyYXAuZmluZCggJ2lucHV0JyApLmRhdGEoICdzZXR0aW5nJyApO1xuXG5cdFx0aWYgKCBzZXR0aW5nICkge1xuXHRcdFx0dGhpcy5tb2RlbC51bnNldCggc2V0dGluZyApO1xuXHRcdFx0dGhpcy50cmlnZ2VyKCAnbWVkaWE6c2V0dGluZzpyZW1vdmUnLCB0aGlzICk7XG5cdFx0fVxuXG5cdFx0d3JhcC5yZW1vdmUoKTtcblx0fSxcblxuXHQvKipcblx0ICpcblx0ICogQGZpcmVzIHdwLm1lZGlhLnZpZXcuTWVkaWFEZXRhaWxzI21lZGlhOnNldHRpbmc6cmVtb3ZlXG5cdCAqL1xuXHRzZXRUcmFja3MgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdHJhY2tzID0gJyc7XG5cblx0XHRfLmVhY2goIHRoaXMuJCgnLmNvbnRlbnQtdHJhY2snKSwgZnVuY3Rpb24odHJhY2spIHtcblx0XHRcdHRyYWNrcyArPSAkKCB0cmFjayApLnZhbCgpO1xuXHRcdH0gKTtcblxuXHRcdHRoaXMubW9kZWwuc2V0KCAnY29udGVudCcsIHRyYWNrcyApO1xuXHRcdHRoaXMudHJpZ2dlciggJ21lZGlhOnNldHRpbmc6cmVtb3ZlJywgdGhpcyApO1xuXHR9LFxuXG5cdGFkZFNvdXJjZSA6IGZ1bmN0aW9uKCBlICkge1xuXHRcdHRoaXMuY29udHJvbGxlci5sYXN0TWltZSA9ICQoIGUuY3VycmVudFRhcmdldCApLmRhdGEoICdtaW1lJyApO1xuXHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSggJ2FkZC0nICsgdGhpcy5jb250cm9sbGVyLmRlZmF1bHRzLmlkICsgJy1zb3VyY2UnICk7XG5cdH0sXG5cblx0bG9hZFBsYXllcjogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMucGxheWVycy5wdXNoKCBuZXcgTWVkaWFFbGVtZW50UGxheWVyKCB0aGlzLm1lZGlhLCB0aGlzLnNldHRpbmdzICkgKTtcblx0XHR0aGlzLnNjcmlwdFhociA9IGZhbHNlO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAZ2xvYmFsIE1lZGlhRWxlbWVudFBsYXllclxuXHQgKi9cblx0c2V0UGxheWVyIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGJhc2VTZXR0aW5ncywgc3JjO1xuXG5cdFx0aWYgKCB0aGlzLnBsYXllcnMubGVuZ3RoIHx8ICEgdGhpcy5tZWRpYSB8fCB0aGlzLnNjcmlwdFhociApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRzcmMgPSB0aGlzLm1vZGVsLmdldCggJ3NyYycgKTtcblxuXHRcdGlmICggc3JjICYmIHNyYy5pbmRleE9mKCAndmltZW8nICkgPiAtMSAmJiAhICggJ0Zyb29nYWxvb3AnIGluIHdpbmRvdyApICkge1xuXHRcdFx0YmFzZVNldHRpbmdzID0gd3AubWVkaWEubWl4aW4ubWVqc1NldHRpbmdzO1xuXHRcdFx0dGhpcy5zY3JpcHRYaHIgPSAkLmdldFNjcmlwdCggYmFzZVNldHRpbmdzLnBsdWdpblBhdGggKyAnZnJvb2dhbG9vcC5taW4uanMnLCBfLmJpbmQoIHRoaXMubG9hZFBsYXllciwgdGhpcyApICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMubG9hZFBsYXllcigpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQGFic3RyYWN0XG5cdCAqL1xuXHRzZXRNZWRpYSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHN1Y2Nlc3MgOiBmdW5jdGlvbihtZWpzKSB7XG5cdFx0dmFyIGF1dG9wbGF5ID0gbWVqcy5hdHRyaWJ1dGVzLmF1dG9wbGF5ICYmICdmYWxzZScgIT09IG1lanMuYXR0cmlidXRlcy5hdXRvcGxheTtcblxuXHRcdGlmICggJ2ZsYXNoJyA9PT0gbWVqcy5wbHVnaW5UeXBlICYmIGF1dG9wbGF5ICkge1xuXHRcdFx0bWVqcy5hZGRFdmVudExpc3RlbmVyKCAnY2FucGxheScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRtZWpzLnBsYXkoKTtcblx0XHRcdH0sIGZhbHNlICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5tZWpzID0gbWVqcztcblx0fSxcblxuXHQvKipcblx0ICogQHJldHVybnMge21lZGlhLnZpZXcuTWVkaWFEZXRhaWxzfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRBdHRhY2htZW50RGlzcGxheS5wcm90b3R5cGUucmVuZGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHNldFRpbWVvdXQoIF8uYmluZCggZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnJlc2V0Rm9jdXMoKTtcblx0XHR9LCB0aGlzICksIDEwICk7XG5cblx0XHR0aGlzLnNldHRpbmdzID0gXy5kZWZhdWx0cygge1xuXHRcdFx0c3VjY2VzcyA6IHRoaXMuc3VjY2Vzc1xuXHRcdH0sIHdwLm1lZGlhLm1peGluLm1lanNTZXR0aW5ncyApO1xuXG5cdFx0cmV0dXJuIHRoaXMuc2V0TWVkaWEoKTtcblx0fSxcblxuXHRyZXNldEZvY3VzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiQoICcuZW1iZWQtbWVkaWEtc2V0dGluZ3MnICkuc2Nyb2xsVG9wKCAwICk7XG5cdH1cbn0sIHtcblx0aW5zdGFuY2VzIDogMCxcblx0LyoqXG5cdCAqIFdoZW4gbXVsdGlwbGUgcGxheWVycyBpbiB0aGUgRE9NIGNvbnRhaW4gdGhlIHNhbWUgc3JjLCB0aGluZ3MgZ2V0IHdlaXJkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtXG5cdCAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH1cblx0ICovXG5cdHByZXBhcmVTcmMgOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHR2YXIgaSA9IE1lZGlhRGV0YWlscy5pbnN0YW5jZXMrKztcblx0XHRfLmVhY2goICQoIGVsZW0gKS5maW5kKCAnc291cmNlJyApLCBmdW5jdGlvbiggc291cmNlICkge1xuXHRcdFx0c291cmNlLnNyYyA9IFtcblx0XHRcdFx0c291cmNlLnNyYyxcblx0XHRcdFx0c291cmNlLnNyYy5pbmRleE9mKCc/JykgPiAtMSA/ICcmJyA6ICc/Jyxcblx0XHRcdFx0J189Jyxcblx0XHRcdFx0aVxuXHRcdFx0XS5qb2luKCcnKTtcblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gZWxlbTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWVkaWFEZXRhaWxzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlZpZGVvRGV0YWlsc1xuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuTWVkaWFEZXRhaWxzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIE1lZGlhRGV0YWlscyA9IHdwLm1lZGlhLnZpZXcuTWVkaWFEZXRhaWxzLFxuXHRWaWRlb0RldGFpbHM7XG5cblZpZGVvRGV0YWlscyA9IE1lZGlhRGV0YWlscy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICd2aWRlby1kZXRhaWxzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgndmlkZW8tZGV0YWlscycpLFxuXG5cdHNldE1lZGlhOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmlkZW8gPSB0aGlzLiQoJy53cC12aWRlby1zaG9ydGNvZGUnKTtcblxuXHRcdGlmICggdmlkZW8uZmluZCggJ3NvdXJjZScgKS5sZW5ndGggKSB7XG5cdFx0XHRpZiAoIHZpZGVvLmlzKCc6aGlkZGVuJykgKSB7XG5cdFx0XHRcdHZpZGVvLnNob3coKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCAhIHZpZGVvLmhhc0NsYXNzKCAneW91dHViZS12aWRlbycgKSAmJiAhIHZpZGVvLmhhc0NsYXNzKCAndmltZW8tdmlkZW8nICkgKSB7XG5cdFx0XHRcdHRoaXMubWVkaWEgPSBNZWRpYURldGFpbHMucHJlcGFyZVNyYyggdmlkZW8uZ2V0KDApICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLm1lZGlhID0gdmlkZW8uZ2V0KDApO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2aWRlby5oaWRlKCk7XG5cdFx0XHR0aGlzLm1lZGlhID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZGVvRGV0YWlscztcbiJdfQ==
