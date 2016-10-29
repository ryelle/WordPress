(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * wp.media.controller.CollectionAdd
 *
 * A state for adding attachments to a collection (e.g. video playlist).
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                         The attributes hash passed to the state.
 * @param {string}                     [attributes.id=library]      Unique identifier.
 * @param {string}                     attributes.title                    Title for the state. Displays in the frame's title region.
 * @param {boolean}                    [attributes.multiple=add]            Whether multi-select is enabled. @todo 'add' doesn't seem do anything special, and gets used as a boolean.
 * @param {wp.media.model.Attachments} [attributes.library]                 The attachments collection to browse.
 *                                                                          If one is not supplied, a collection of attachments of the specified type will be created.
 * @param {boolean|string}             [attributes.filterable=uploaded]     Whether the library is filterable, and if so what filters should be shown.
 *                                                                          Accepts 'all', 'uploaded', or 'unattached'.
 * @param {string}                     [attributes.menu=gallery]            Initial mode for the menu region.
 * @param {string}                     [attributes.content=upload]          Initial mode for the content region.
 *                                                                          Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                     [attributes.router=browse]           Initial mode for the router region.
 * @param {string}                     [attributes.toolbar=gallery-add]     Initial mode for the toolbar region.
 * @param {boolean}                    [attributes.searchable=true]         Whether the library is searchable.
 * @param {boolean}                    [attributes.sortable=true]           Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.autoSelect=true]         Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                    [attributes.contentUserSetting=true] Whether the content region's mode should be set and persisted per user.
 * @param {int}                        [attributes.priority=100]            The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.syncSelection=false]     Whether the Attachments selection should be persisted from the last state.
 *                                                                          Defaults to false because for this state, because the library of the Edit Gallery state is the selection.
 * @param {string}                     attributes.type                   The collection's media type. (e.g. 'video').
 * @param {string}                     attributes.collectionType         The collection type. (e.g. 'playlist').
 */
var Selection = wp.media.model.Selection,
	Library = wp.media.controller.Library,
	CollectionAdd;

CollectionAdd = Library.extend({
	defaults: _.defaults( {
		// Selection defaults. @see media.model.Selection
		multiple:      'add',
		// Attachments browser defaults. @see media.view.AttachmentsBrowser
		filterable:    'uploaded',

		priority:      100,
		syncSelection: false
	}, Library.prototype.defaults ),

	/**
	 * @since 3.9.0
	 */
	initialize: function() {
		var collectionType = this.get('collectionType');

		if ( 'video' === this.get( 'type' ) ) {
			collectionType = 'video-' + collectionType;
		}

		this.set( 'id', collectionType + '-library' );
		this.set( 'toolbar', collectionType + '-add' );
		this.set( 'menu', collectionType );

		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query({ type: this.get('type') }) );
		}
		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		var library = this.get('library'),
			editLibrary = this.get('editLibrary'),
			edit = this.frame.state( this.get('collectionType') + '-edit' ).get('library');

		if ( editLibrary && editLibrary !== edit ) {
			library.unobserve( editLibrary );
		}

		// Accepts attachments that exist in the original library and
		// that do not exist in gallery's library.
		library.validator = function( attachment ) {
			return !! this.mirroring.get( attachment.cid ) && ! edit.get( attachment.cid ) && Selection.prototype.validator.apply( this, arguments );
		};

		// Reset the library to ensure that all attachments are re-added
		// to the collection. Do so silently, as calling `observe` will
		// trigger the `reset` event.
		library.reset( library.mirroring.models, { silent: true });
		library.observe( edit );
		this.set('editLibrary', edit);

		Library.prototype.activate.apply( this, arguments );
	}
});

module.exports = CollectionAdd;

},{}],2:[function(require,module,exports){
/**
 * wp.media.controller.CollectionEdit
 *
 * A state for editing a collection, which is used by audio and video playlists,
 * and can be used for other collections.
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                      The attributes hash passed to the state.
 * @param {string}                     attributes.title                  Title for the state. Displays in the media menu and the frame's title region.
 * @param {wp.media.model.Attachments} [attributes.library]              The attachments collection to edit.
 *                                                                       If one is not supplied, an empty media.model.Selection collection is created.
 * @param {boolean}                    [attributes.multiple=false]       Whether multi-select is enabled.
 * @param {string}                     [attributes.content=browse]       Initial mode for the content region.
 * @param {string}                     attributes.menu                   Initial mode for the menu region. @todo this needs a better explanation.
 * @param {boolean}                    [attributes.searchable=false]     Whether the library is searchable.
 * @param {boolean}                    [attributes.sortable=true]        Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.date=true]            Whether to show the date filter in the browser's toolbar.
 * @param {boolean}                    [attributes.describe=true]        Whether to offer UI to describe the attachments - e.g. captioning images in a gallery.
 * @param {boolean}                    [attributes.dragInfo=true]        Whether to show instructional text about the attachments being sortable.
 * @param {boolean}                    [attributes.dragInfoText]         Instructional text about the attachments being sortable.
 * @param {int}                        [attributes.idealColumnWidth=170] The ideal column width in pixels for attachments.
 * @param {boolean}                    [attributes.editing=false]        Whether the gallery is being created, or editing an existing instance.
 * @param {int}                        [attributes.priority=60]          The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.syncSelection=false]  Whether the Attachments selection should be persisted from the last state.
 *                                                                       Defaults to false for this state, because the library passed in  *is* the selection.
 * @param {view}                       [attributes.SettingsView]         The view to edit the collection instance settings (e.g. Playlist settings with "Show tracklist" checkbox).
 * @param {view}                       [attributes.AttachmentView]       The single `Attachment` view to be used in the `Attachments`.
 *                                                                       If none supplied, defaults to wp.media.view.Attachment.EditLibrary.
 * @param {string}                     attributes.type                   The collection's media type. (e.g. 'video').
 * @param {string}                     attributes.collectionType         The collection type. (e.g. 'playlist').
 */
var Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	CollectionEdit;

CollectionEdit = Library.extend({
	defaults: {
		multiple:         false,
		sortable:         true,
		date:             false,
		searchable:       false,
		content:          'browse',
		describe:         true,
		dragInfo:         true,
		idealColumnWidth: 170,
		editing:          false,
		priority:         60,
		SettingsView:     false,
		syncSelection:    false
	},

	/**
	 * @since 3.9.0
	 */
	initialize: function() {
		var collectionType = this.get('collectionType');

		if ( 'video' === this.get( 'type' ) ) {
			collectionType = 'video-' + collectionType;
		}

		this.set( 'id', collectionType + '-edit' );
		this.set( 'toolbar', collectionType + '-edit' );

		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', new wp.media.model.Selection() );
		}
		// The single `Attachment` view to be used in the `Attachments` view.
		if ( ! this.get('AttachmentView') ) {
			this.set( 'AttachmentView', wp.media.view.Attachment.EditLibrary );
		}
		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		var library = this.get('library');

		// Limit the library to images only.
		library.props.set( 'type', this.get( 'type' ) );

		// Watch for uploaded attachments.
		this.get('library').observe( wp.Uploader.queue );

		this.frame.on( 'content:render:browse', this.renderSettings, this );

		Library.prototype.activate.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	deactivate: function() {
		// Stop watching for uploaded attachments.
		this.get('library').unobserve( wp.Uploader.queue );

		this.frame.off( 'content:render:browse', this.renderSettings, this );

		Library.prototype.deactivate.apply( this, arguments );
	},

	/**
	 * Render the collection embed settings view in the browser sidebar.
	 *
	 * @todo This is against the pattern elsewhere in media. Typically the frame
	 *       is responsible for adding region mode callbacks. Explain.
	 *
	 * @since 3.9.0
	 *
	 * @param {wp.media.view.attachmentsBrowser} The attachments browser view.
	 */
	renderSettings: function( attachmentsBrowserView ) {
		var library = this.get('library'),
			collectionType = this.get('collectionType'),
			dragInfoText = this.get('dragInfoText'),
			SettingsView = this.get('SettingsView'),
			obj = {};

		if ( ! library || ! attachmentsBrowserView ) {
			return;
		}

		library[ collectionType ] = library[ collectionType ] || new Backbone.Model();

		obj[ collectionType ] = new SettingsView({
			controller: this,
			model:      library[ collectionType ],
			priority:   40
		});

		attachmentsBrowserView.sidebar.set( obj );

		if ( dragInfoText ) {
			attachmentsBrowserView.toolbar.set( 'dragInfo', new wp.media.View({
				el: $( '<div class="instructions">' + dragInfoText + '</div>' )[0],
				priority: -40
			}) );
		}

		// Add the 'Reverse order' button to the toolbar.
		attachmentsBrowserView.toolbar.set( 'reverse', {
			text:     l10n.reverseOrder,
			priority: 80,

			click: function() {
				library.reset( library.toArray().reverse() );
			}
		});
	}
});

module.exports = CollectionEdit;

},{}],3:[function(require,module,exports){
/**
 * wp.media.controller.Cropper
 *
 * A state for cropping an image.
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var l10n = wp.media.view.l10n,
	Cropper;

Cropper = wp.media.controller.State.extend({
	defaults: {
		id:          'cropper',
		title:       l10n.cropImage,
		// Region mode defaults.
		toolbar:     'crop',
		content:     'crop',
		router:      false,
		canSkipCrop: false,

		// Default doCrop Ajax arguments to allow the Customizer (for example) to inject state.
		doCropArgs: {}
	},

	activate: function() {
		this.frame.on( 'content:create:crop', this.createCropContent, this );
		this.frame.on( 'close', this.removeCropper, this );
		this.set('selection', new Backbone.Collection(this.frame._selection.single));
	},

	deactivate: function() {
		this.frame.toolbar.mode('browse');
	},

	createCropContent: function() {
		this.cropperView = new wp.media.view.Cropper({
			controller: this,
			attachment: this.get('selection').first()
		});
		this.cropperView.on('image-loaded', this.createCropToolbar, this);
		this.frame.content.set(this.cropperView);

	},
	removeCropper: function() {
		this.imgSelect.cancelSelection();
		this.imgSelect.setOptions({remove: true});
		this.imgSelect.update();
		this.cropperView.remove();
	},
	createCropToolbar: function() {
		var canSkipCrop, toolbarOptions;

		canSkipCrop = this.get('canSkipCrop') || false;

		toolbarOptions = {
			controller: this.frame,
			items: {
				insert: {
					style:    'primary',
					text:     l10n.cropImage,
					priority: 80,
					requires: { library: false, selection: false },

					click: function() {
						var controller = this.controller,
							selection;

						selection = controller.state().get('selection').first();
						selection.set({cropDetails: controller.state().imgSelect.getSelection()});

						this.$el.text(l10n.cropping);
						this.$el.attr('disabled', true);

						controller.state().doCrop( selection ).done( function( croppedImage ) {
							controller.trigger('cropped', croppedImage );
							controller.close();
						}).fail( function() {
							controller.trigger('content:error:crop');
						});
					}
				}
			}
		};

		if ( canSkipCrop ) {
			_.extend( toolbarOptions.items, {
				skip: {
					style:      'secondary',
					text:       l10n.skipCropping,
					priority:   70,
					requires:   { library: false, selection: false },
					click:      function() {
						var selection = this.controller.state().get('selection').first();
						this.controller.state().cropperView.remove();
						this.controller.trigger('skippedcrop', selection);
						this.controller.close();
					}
				}
			});
		}

		this.frame.toolbar.set( new wp.media.view.Toolbar(toolbarOptions) );
	},

	doCrop: function( attachment ) {
		return wp.ajax.post( 'custom-header-crop', _.extend(
			{},
			this.defaults.doCropArgs,
			{
				nonce: attachment.get( 'nonces' ).edit,
				id: attachment.get( 'id' ),
				cropDetails: attachment.get( 'cropDetails' )
			}
		) );
	}
});

module.exports = Cropper;

},{}],4:[function(require,module,exports){
/**
 * wp.media.controller.CustomizeImageCropper
 *
 * A state for cropping an image.
 *
 * @class
 * @augments wp.media.controller.Cropper
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var Controller = wp.media.controller,
	CustomizeImageCropper;

CustomizeImageCropper = Controller.Cropper.extend({
	doCrop: function( attachment ) {
		var cropDetails = attachment.get( 'cropDetails' ),
			control = this.get( 'control' ),
			ratio = cropDetails.width / cropDetails.height;

		// Use crop measurements when flexible in both directions.
		if ( control.params.flex_width && control.params.flex_height ) {
			cropDetails.dst_width  = cropDetails.width;
			cropDetails.dst_height = cropDetails.height;

		// Constrain flexible side based on image ratio and size of the fixed side.
		} else {
			cropDetails.dst_width  = control.params.flex_width  ? control.params.height * ratio : control.params.width;
			cropDetails.dst_height = control.params.flex_height ? control.params.width  / ratio : control.params.height;
		}

		return wp.ajax.post( 'crop-image', {
			wp_customize: 'on',
			nonce: attachment.get( 'nonces' ).edit,
			id: attachment.get( 'id' ),
			context: control.id,
			cropDetails: cropDetails
		} );
	}
});

module.exports = CustomizeImageCropper;

},{}],5:[function(require,module,exports){
/**
 * wp.media.controller.EditImage
 *
 * A state for editing (cropping, etc.) an image.
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                    attributes                      The attributes hash passed to the state.
 * @param {wp.media.model.Attachment} attributes.model                The attachment.
 * @param {string}                    [attributes.id=edit-image]      Unique identifier.
 * @param {string}                    [attributes.title=Edit Image]   Title for the state. Displays in the media menu and the frame's title region.
 * @param {string}                    [attributes.content=edit-image] Initial mode for the content region.
 * @param {string}                    [attributes.toolbar=edit-image] Initial mode for the toolbar region.
 * @param {string}                    [attributes.menu=false]         Initial mode for the menu region.
 * @param {string}                    [attributes.url]                Unused. @todo Consider removal.
 */
var l10n = wp.media.view.l10n,
	EditImage;

EditImage = wp.media.controller.State.extend({
	defaults: {
		id:      'edit-image',
		title:   l10n.editImage,
		menu:    false,
		toolbar: 'edit-image',
		content: 'edit-image',
		url:     ''
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		this.frame.on( 'toolbar:render:edit-image', _.bind( this.toolbar, this ) );
	},

	/**
	 * @since 3.9.0
	 */
	deactivate: function() {
		this.frame.off( 'toolbar:render:edit-image' );
	},

	/**
	 * @since 3.9.0
	 */
	toolbar: function() {
		var frame = this.frame,
			lastState = frame.lastState(),
			previous = lastState && lastState.id;

		frame.toolbar.set( new wp.media.view.Toolbar({
			controller: frame,
			items: {
				back: {
					style: 'primary',
					text:     l10n.back,
					priority: 20,
					click:    function() {
						if ( previous ) {
							frame.setState( previous );
						} else {
							frame.close();
						}
					}
				}
			}
		}) );
	}
});

module.exports = EditImage;

},{}],6:[function(require,module,exports){
/**
 * wp.media.controller.Embed
 *
 * A state for embedding media from a URL.
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object} attributes                         The attributes hash passed to the state.
 * @param {string} [attributes.id=embed]              Unique identifier.
 * @param {string} [attributes.title=Insert From URL] Title for the state. Displays in the media menu and the frame's title region.
 * @param {string} [attributes.content=embed]         Initial mode for the content region.
 * @param {string} [attributes.menu=default]          Initial mode for the menu region.
 * @param {string} [attributes.toolbar=main-embed]    Initial mode for the toolbar region.
 * @param {string} [attributes.menu=false]            Initial mode for the menu region.
 * @param {int}    [attributes.priority=120]          The priority for the state link in the media menu.
 * @param {string} [attributes.type=link]             The type of embed. Currently only link is supported.
 * @param {string} [attributes.url]                   The embed URL.
 * @param {object} [attributes.metadata={}]           Properties of the embed, which will override attributes.url if set.
 */
var l10n = wp.media.view.l10n,
	$ = Backbone.$,
	Embed;

Embed = wp.media.controller.State.extend({
	defaults: {
		id:       'embed',
		title:    l10n.insertFromUrlTitle,
		content:  'embed',
		menu:     'default',
		toolbar:  'main-embed',
		priority: 120,
		type:     'link',
		url:      '',
		metadata: {}
	},

	// The amount of time used when debouncing the scan.
	sensitivity: 400,

	initialize: function(options) {
		this.metadata = options.metadata;
		this.debouncedScan = _.debounce( _.bind( this.scan, this ), this.sensitivity );
		this.props = new Backbone.Model( this.metadata || { url: '' });
		this.props.on( 'change:url', this.debouncedScan, this );
		this.props.on( 'change:url', this.refresh, this );
		this.on( 'scan', this.scanImage, this );
	},

	/**
	 * Trigger a scan of the embedded URL's content for metadata required to embed.
	 *
	 * @fires wp.media.controller.Embed#scan
	 */
	scan: function() {
		var scanners,
			embed = this,
			attributes = {
				type: 'link',
				scanners: []
			};

		// Scan is triggered with the list of `attributes` to set on the
		// state, useful for the 'type' attribute and 'scanners' attribute,
		// an array of promise objects for asynchronous scan operations.
		if ( this.props.get('url') ) {
			this.trigger( 'scan', attributes );
		}

		if ( attributes.scanners.length ) {
			scanners = attributes.scanners = $.when.apply( $, attributes.scanners );
			scanners.always( function() {
				if ( embed.get('scanners') === scanners ) {
					embed.set( 'loading', false );
				}
			});
		} else {
			attributes.scanners = null;
		}

		attributes.loading = !! attributes.scanners;
		this.set( attributes );
	},
	/**
	 * Try scanning the embed as an image to discover its dimensions.
	 *
	 * @param {Object} attributes
	 */
	scanImage: function( attributes ) {
		var frame = this.frame,
			state = this,
			url = this.props.get('url'),
			image = new Image(),
			deferred = $.Deferred();

		attributes.scanners.push( deferred.promise() );

		// Try to load the image and find its width/height.
		image.onload = function() {
			deferred.resolve();

			if ( state !== frame.state() || url !== state.props.get('url') ) {
				return;
			}

			state.set({
				type: 'image'
			});

			state.props.set({
				width:  image.width,
				height: image.height
			});
		};

		image.onerror = deferred.reject;
		image.src = url;
	},

	refresh: function() {
		this.frame.toolbar.get().refresh();
	},

	reset: function() {
		this.props.clear().set({ url: '' });

		if ( this.active ) {
			this.refresh();
		}
	}
});

module.exports = Embed;

},{}],7:[function(require,module,exports){
/**
 * wp.media.controller.FeaturedImage
 *
 * A state for selecting a featured image for a post.
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                          The attributes hash passed to the state.
 * @param {string}                     [attributes.id=featured-image]        Unique identifier.
 * @param {string}                     [attributes.title=Set Featured Image] Title for the state. Displays in the media menu and the frame's title region.
 * @param {wp.media.model.Attachments} [attributes.library]                  The attachments collection to browse.
 *                                                                           If one is not supplied, a collection of all images will be created.
 * @param {boolean}                    [attributes.multiple=false]           Whether multi-select is enabled.
 * @param {string}                     [attributes.content=upload]           Initial mode for the content region.
 *                                                                           Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                     [attributes.menu=default]             Initial mode for the menu region.
 * @param {string}                     [attributes.router=browse]            Initial mode for the router region.
 * @param {string}                     [attributes.toolbar=featured-image]   Initial mode for the toolbar region.
 * @param {int}                        [attributes.priority=60]              The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.searchable=true]          Whether the library is searchable.
 * @param {boolean|string}             [attributes.filterable=false]         Whether the library is filterable, and if so what filters should be shown.
 *                                                                           Accepts 'all', 'uploaded', or 'unattached'.
 * @param {boolean}                    [attributes.sortable=true]            Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.autoSelect=true]          Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                    [attributes.describe=false]           Whether to offer UI to describe attachments - e.g. captioning images in a gallery.
 * @param {boolean}                    [attributes.contentUserSetting=true]  Whether the content region's mode should be set and persisted per user.
 * @param {boolean}                    [attributes.syncSelection=true]       Whether the Attachments selection should be persisted from the last state.
 */
var Attachment = wp.media.model.Attachment,
	Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	FeaturedImage;

FeaturedImage = Library.extend({
	defaults: _.defaults({
		id:            'featured-image',
		title:         l10n.setFeaturedImageTitle,
		multiple:      false,
		filterable:    'uploaded',
		toolbar:       'featured-image',
		priority:      60,
		syncSelection: true
	}, Library.prototype.defaults ),

	/**
	 * @since 3.5.0
	 */
	initialize: function() {
		var library, comparator;

		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query({ type: 'image' }) );
		}

		Library.prototype.initialize.apply( this, arguments );

		library    = this.get('library');
		comparator = library.comparator;

		// Overload the library's comparator to push items that are not in
		// the mirrored query to the front of the aggregate collection.
		library.comparator = function( a, b ) {
			var aInQuery = !! this.mirroring.get( a.cid ),
				bInQuery = !! this.mirroring.get( b.cid );

			if ( ! aInQuery && bInQuery ) {
				return -1;
			} else if ( aInQuery && ! bInQuery ) {
				return 1;
			} else {
				return comparator.apply( this, arguments );
			}
		};

		// Add all items in the selection to the library, so any featured
		// images that are not initially loaded still appear.
		library.observe( this.get('selection') );
	},

	/**
	 * @since 3.5.0
	 */
	activate: function() {
		this.updateSelection();
		this.frame.on( 'open', this.updateSelection, this );

		Library.prototype.activate.apply( this, arguments );
	},

	/**
	 * @since 3.5.0
	 */
	deactivate: function() {
		this.frame.off( 'open', this.updateSelection, this );

		Library.prototype.deactivate.apply( this, arguments );
	},

	/**
	 * @since 3.5.0
	 */
	updateSelection: function() {
		var selection = this.get('selection'),
			id = wp.media.view.settings.post.featuredImageId,
			attachment;

		if ( '' !== id && -1 !== id ) {
			attachment = Attachment.get( id );
			attachment.fetch();
		}

		selection.reset( attachment ? [ attachment ] : [] );
	}
});

module.exports = FeaturedImage;

},{}],8:[function(require,module,exports){
/**
 * wp.media.controller.GalleryAdd
 *
 * A state for selecting more images to add to a gallery.
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                         The attributes hash passed to the state.
 * @param {string}                     [attributes.id=gallery-library]      Unique identifier.
 * @param {string}                     [attributes.title=Add to Gallery]    Title for the state. Displays in the frame's title region.
 * @param {boolean}                    [attributes.multiple=add]            Whether multi-select is enabled. @todo 'add' doesn't seem do anything special, and gets used as a boolean.
 * @param {wp.media.model.Attachments} [attributes.library]                 The attachments collection to browse.
 *                                                                          If one is not supplied, a collection of all images will be created.
 * @param {boolean|string}             [attributes.filterable=uploaded]     Whether the library is filterable, and if so what filters should be shown.
 *                                                                          Accepts 'all', 'uploaded', or 'unattached'.
 * @param {string}                     [attributes.menu=gallery]            Initial mode for the menu region.
 * @param {string}                     [attributes.content=upload]          Initial mode for the content region.
 *                                                                          Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                     [attributes.router=browse]           Initial mode for the router region.
 * @param {string}                     [attributes.toolbar=gallery-add]     Initial mode for the toolbar region.
 * @param {boolean}                    [attributes.searchable=true]         Whether the library is searchable.
 * @param {boolean}                    [attributes.sortable=true]           Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.autoSelect=true]         Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                    [attributes.contentUserSetting=true] Whether the content region's mode should be set and persisted per user.
 * @param {int}                        [attributes.priority=100]            The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.syncSelection=false]     Whether the Attachments selection should be persisted from the last state.
 *                                                                          Defaults to false because for this state, because the library of the Edit Gallery state is the selection.
 */
var Selection = wp.media.model.Selection,
	Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	GalleryAdd;

GalleryAdd = Library.extend({
	defaults: _.defaults({
		id:            'gallery-library',
		title:         l10n.addToGalleryTitle,
		multiple:      'add',
		filterable:    'uploaded',
		menu:          'gallery',
		toolbar:       'gallery-add',
		priority:      100,
		syncSelection: false
	}, Library.prototype.defaults ),

	/**
	 * @since 3.5.0
	 */
	initialize: function() {
		// If a library wasn't supplied, create a library of images.
		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query({ type: 'image' }) );
		}

		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.5.0
	 */
	activate: function() {
		var library = this.get('library'),
			edit    = this.frame.state('gallery-edit').get('library');

		if ( this.editLibrary && this.editLibrary !== edit ) {
			library.unobserve( this.editLibrary );
		}

		// Accepts attachments that exist in the original library and
		// that do not exist in gallery's library.
		library.validator = function( attachment ) {
			return !! this.mirroring.get( attachment.cid ) && ! edit.get( attachment.cid ) && Selection.prototype.validator.apply( this, arguments );
		};

		// Reset the library to ensure that all attachments are re-added
		// to the collection. Do so silently, as calling `observe` will
		// trigger the `reset` event.
		library.reset( library.mirroring.models, { silent: true });
		library.observe( edit );
		this.editLibrary = edit;

		Library.prototype.activate.apply( this, arguments );
	}
});

module.exports = GalleryAdd;

},{}],9:[function(require,module,exports){
/**
 * wp.media.controller.GalleryEdit
 *
 * A state for editing a gallery's images and settings.
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                       The attributes hash passed to the state.
 * @param {string}                     [attributes.id=gallery-edit]       Unique identifier.
 * @param {string}                     [attributes.title=Edit Gallery]    Title for the state. Displays in the frame's title region.
 * @param {wp.media.model.Attachments} [attributes.library]               The collection of attachments in the gallery.
 *                                                                        If one is not supplied, an empty media.model.Selection collection is created.
 * @param {boolean}                    [attributes.multiple=false]        Whether multi-select is enabled.
 * @param {boolean}                    [attributes.searchable=false]      Whether the library is searchable.
 * @param {boolean}                    [attributes.sortable=true]         Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.date=true]             Whether to show the date filter in the browser's toolbar.
 * @param {string|false}               [attributes.content=browse]        Initial mode for the content region.
 * @param {string|false}               [attributes.toolbar=image-details] Initial mode for the toolbar region.
 * @param {boolean}                    [attributes.describe=true]         Whether to offer UI to describe attachments - e.g. captioning images in a gallery.
 * @param {boolean}                    [attributes.displaySettings=true]  Whether to show the attachment display settings interface.
 * @param {boolean}                    [attributes.dragInfo=true]         Whether to show instructional text about the attachments being sortable.
 * @param {int}                        [attributes.idealColumnWidth=170]  The ideal column width in pixels for attachments.
 * @param {boolean}                    [attributes.editing=false]         Whether the gallery is being created, or editing an existing instance.
 * @param {int}                        [attributes.priority=60]           The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.syncSelection=false]   Whether the Attachments selection should be persisted from the last state.
 *                                                                        Defaults to false for this state, because the library passed in  *is* the selection.
 * @param {view}                       [attributes.AttachmentView]        The single `Attachment` view to be used in the `Attachments`.
 *                                                                        If none supplied, defaults to wp.media.view.Attachment.EditLibrary.
 */
var Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	GalleryEdit;

GalleryEdit = Library.extend({
	defaults: {
		id:               'gallery-edit',
		title:            l10n.editGalleryTitle,
		multiple:         false,
		searchable:       false,
		sortable:         true,
		date:             false,
		display:          false,
		content:          'browse',
		toolbar:          'gallery-edit',
		describe:         true,
		displaySettings:  true,
		dragInfo:         true,
		idealColumnWidth: 170,
		editing:          false,
		priority:         60,
		syncSelection:    false
	},

	/**
	 * @since 3.5.0
	 */
	initialize: function() {
		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', new wp.media.model.Selection() );
		}

		// The single `Attachment` view to be used in the `Attachments` view.
		if ( ! this.get('AttachmentView') ) {
			this.set( 'AttachmentView', wp.media.view.Attachment.EditLibrary );
		}

		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.5.0
	 */
	activate: function() {
		var library = this.get('library');

		// Limit the library to images only.
		library.props.set( 'type', 'image' );

		// Watch for uploaded attachments.
		this.get('library').observe( wp.Uploader.queue );

		this.frame.on( 'content:render:browse', this.gallerySettings, this );

		Library.prototype.activate.apply( this, arguments );
	},

	/**
	 * @since 3.5.0
	 */
	deactivate: function() {
		// Stop watching for uploaded attachments.
		this.get('library').unobserve( wp.Uploader.queue );

		this.frame.off( 'content:render:browse', this.gallerySettings, this );

		Library.prototype.deactivate.apply( this, arguments );
	},

	/**
	 * @since 3.5.0
	 *
	 * @param browser
	 */
	gallerySettings: function( browser ) {
		if ( ! this.get('displaySettings') ) {
			return;
		}

		var library = this.get('library');

		if ( ! library || ! browser ) {
			return;
		}

		library.gallery = library.gallery || new Backbone.Model();

		browser.sidebar.set({
			gallery: new wp.media.view.Settings.Gallery({
				controller: this,
				model:      library.gallery,
				priority:   40
			})
		});

		browser.toolbar.set( 'reverse', {
			text:     l10n.reverseOrder,
			priority: 80,

			click: function() {
				library.reset( library.toArray().reverse() );
			}
		});
	}
});

module.exports = GalleryEdit;

},{}],10:[function(require,module,exports){
/**
 * wp.media.controller.ImageDetails
 *
 * A state for editing the attachment display settings of an image that's been
 * inserted into the editor.
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                    [attributes]                       The attributes hash passed to the state.
 * @param {string}                    [attributes.id=image-details]      Unique identifier.
 * @param {string}                    [attributes.title=Image Details]   Title for the state. Displays in the frame's title region.
 * @param {wp.media.model.Attachment} attributes.image                   The image's model.
 * @param {string|false}              [attributes.content=image-details] Initial mode for the content region.
 * @param {string|false}              [attributes.menu=false]            Initial mode for the menu region.
 * @param {string|false}              [attributes.router=false]          Initial mode for the router region.
 * @param {string|false}              [attributes.toolbar=image-details] Initial mode for the toolbar region.
 * @param {boolean}                   [attributes.editing=false]         Unused.
 * @param {int}                       [attributes.priority=60]           Unused.
 *
 * @todo This state inherits some defaults from media.controller.Library.prototype.defaults,
 *       however this may not do anything.
 */
var State = wp.media.controller.State,
	Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	ImageDetails;

ImageDetails = State.extend({
	defaults: _.defaults({
		id:       'image-details',
		title:    l10n.imageDetailsTitle,
		content:  'image-details',
		menu:     false,
		router:   false,
		toolbar:  'image-details',
		editing:  false,
		priority: 60
	}, Library.prototype.defaults ),

	/**
	 * @since 3.9.0
	 *
	 * @param options Attributes
	 */
	initialize: function( options ) {
		this.image = options.image;
		State.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		this.frame.modal.$el.addClass('image-details');
	}
});

module.exports = ImageDetails;

},{}],11:[function(require,module,exports){
/**
 * wp.media.controller.Library
 *
 * A state for choosing an attachment or group of attachments from the media library.
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 * @mixes media.selectionSync
 *
 * @param {object}                          [attributes]                         The attributes hash passed to the state.
 * @param {string}                          [attributes.id=library]              Unique identifier.
 * @param {string}                          [attributes.title=Media library]     Title for the state. Displays in the media menu and the frame's title region.
 * @param {wp.media.model.Attachments}      [attributes.library]                 The attachments collection to browse.
 *                                                                               If one is not supplied, a collection of all attachments will be created.
 * @param {wp.media.model.Selection|object} [attributes.selection]               A collection to contain attachment selections within the state.
 *                                                                               If the 'selection' attribute is a plain JS object,
 *                                                                               a Selection will be created using its values as the selection instance's `props` model.
 *                                                                               Otherwise, it will copy the library's `props` model.
 * @param {boolean}                         [attributes.multiple=false]          Whether multi-select is enabled.
 * @param {string}                          [attributes.content=upload]          Initial mode for the content region.
 *                                                                               Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                          [attributes.menu=default]            Initial mode for the menu region.
 * @param {string}                          [attributes.router=browse]           Initial mode for the router region.
 * @param {string}                          [attributes.toolbar=select]          Initial mode for the toolbar region.
 * @param {boolean}                         [attributes.searchable=true]         Whether the library is searchable.
 * @param {boolean|string}                  [attributes.filterable=false]        Whether the library is filterable, and if so what filters should be shown.
 *                                                                               Accepts 'all', 'uploaded', or 'unattached'.
 * @param {boolean}                         [attributes.sortable=true]           Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                         [attributes.autoSelect=true]         Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                         [attributes.describe=false]          Whether to offer UI to describe attachments - e.g. captioning images in a gallery.
 * @param {boolean}                         [attributes.contentUserSetting=true] Whether the content region's mode should be set and persisted per user.
 * @param {boolean}                         [attributes.syncSelection=true]      Whether the Attachments selection should be persisted from the last state.
 */
var l10n = wp.media.view.l10n,
	getUserSetting = window.getUserSetting,
	setUserSetting = window.setUserSetting,
	Library;

Library = wp.media.controller.State.extend({
	defaults: {
		id:                 'library',
		title:              l10n.mediaLibraryTitle,
		multiple:           false,
		content:            'upload',
		menu:               'default',
		router:             'browse',
		toolbar:            'select',
		searchable:         true,
		filterable:         false,
		sortable:           true,
		autoSelect:         true,
		describe:           false,
		contentUserSetting: true,
		syncSelection:      true
	},

	/**
	 * If a library isn't provided, query all media items.
	 * If a selection instance isn't provided, create one.
	 *
	 * @since 3.5.0
	 */
	initialize: function() {
		var selection = this.get('selection'),
			props;

		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query() );
		}

		if ( ! ( selection instanceof wp.media.model.Selection ) ) {
			props = selection;

			if ( ! props ) {
				props = this.get('library').props.toJSON();
				props = _.omit( props, 'orderby', 'query' );
			}

			this.set( 'selection', new wp.media.model.Selection( null, {
				multiple: this.get('multiple'),
				props: props
			}) );
		}

		this.resetDisplays();
	},

	/**
	 * @since 3.5.0
	 */
	activate: function() {
		this.syncSelection();

		wp.Uploader.queue.on( 'add', this.uploading, this );

		this.get('selection').on( 'add remove reset', this.refreshContent, this );

		if ( this.get( 'router' ) && this.get('contentUserSetting') ) {
			this.frame.on( 'content:activate', this.saveContentMode, this );
			this.set( 'content', getUserSetting( 'libraryContent', this.get('content') ) );
		}
	},

	/**
	 * @since 3.5.0
	 */
	deactivate: function() {
		this.recordSelection();

		this.frame.off( 'content:activate', this.saveContentMode, this );

		// Unbind all event handlers that use this state as the context
		// from the selection.
		this.get('selection').off( null, null, this );

		wp.Uploader.queue.off( null, null, this );
	},

	/**
	 * Reset the library to its initial state.
	 *
	 * @since 3.5.0
	 */
	reset: function() {
		this.get('selection').reset();
		this.resetDisplays();
		this.refreshContent();
	},

	/**
	 * Reset the attachment display settings defaults to the site options.
	 *
	 * If site options don't define them, fall back to a persistent user setting.
	 *
	 * @since 3.5.0
	 */
	resetDisplays: function() {
		var defaultProps = wp.media.view.settings.defaultProps;
		this._displays = [];
		this._defaultDisplaySettings = {
			align: getUserSetting( 'align', defaultProps.align ) || 'none',
			size:  getUserSetting( 'imgsize', defaultProps.size ) || 'medium',
			link:  getUserSetting( 'urlbutton', defaultProps.link ) || 'none'
		};
	},

	/**
	 * Create a model to represent display settings (alignment, etc.) for an attachment.
	 *
	 * @since 3.5.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @returns {Backbone.Model}
	 */
	display: function( attachment ) {
		var displays = this._displays;

		if ( ! displays[ attachment.cid ] ) {
			displays[ attachment.cid ] = new Backbone.Model( this.defaultDisplaySettings( attachment ) );
		}
		return displays[ attachment.cid ];
	},

	/**
	 * Given an attachment, create attachment display settings properties.
	 *
	 * @since 3.6.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @returns {Object}
	 */
	defaultDisplaySettings: function( attachment ) {
		var settings = _.clone( this._defaultDisplaySettings );

		if ( settings.canEmbed = this.canEmbed( attachment ) ) {
			settings.link = 'embed';
		} else if ( ! this.isImageAttachment( attachment ) && settings.link === 'none' ) {
			settings.link = 'file';
		}

		return settings;
	},

	/**
	 * Whether an attachment is image.
	 *
	 * @since 4.4.1
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @returns {Boolean}
	 */
	isImageAttachment: function( attachment ) {
		// If uploading, we know the filename but not the mime type.
		if ( attachment.get('uploading') ) {
			return /\.(jpe?g|png|gif)$/i.test( attachment.get('filename') );
		}

		return attachment.get('type') === 'image';
	},

	/**
	 * Whether an attachment can be embedded (audio or video).
	 *
	 * @since 3.6.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @returns {Boolean}
	 */
	canEmbed: function( attachment ) {
		// If uploading, we know the filename but not the mime type.
		if ( ! attachment.get('uploading') ) {
			var type = attachment.get('type');
			if ( type !== 'audio' && type !== 'video' ) {
				return false;
			}
		}

		return _.contains( wp.media.view.settings.embedExts, attachment.get('filename').split('.').pop() );
	},


	/**
	 * If the state is active, no items are selected, and the current
	 * content mode is not an option in the state's router (provided
	 * the state has a router), reset the content mode to the default.
	 *
	 * @since 3.5.0
	 */
	refreshContent: function() {
		var selection = this.get('selection'),
			frame = this.frame,
			router = frame.router.get(),
			mode = frame.content.mode();

		if ( this.active && ! selection.length && router && ! router.get( mode ) ) {
			this.frame.content.render( this.get('content') );
		}
	},

	/**
	 * Callback handler when an attachment is uploaded.
	 *
	 * Switch to the Media Library if uploaded from the 'Upload Files' tab.
	 *
	 * Adds any uploading attachments to the selection.
	 *
	 * If the state only supports one attachment to be selected and multiple
	 * attachments are uploaded, the last attachment in the upload queue will
	 * be selected.
	 *
	 * @since 3.5.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 */
	uploading: function( attachment ) {
		var content = this.frame.content;

		if ( 'upload' === content.mode() ) {
			this.frame.content.mode('browse');
		}

		if ( this.get( 'autoSelect' ) ) {
			this.get('selection').add( attachment );
			this.frame.trigger( 'library:selection:add' );
		}
	},

	/**
	 * Persist the mode of the content region as a user setting.
	 *
	 * @since 3.5.0
	 */
	saveContentMode: function() {
		if ( 'browse' !== this.get('router') ) {
			return;
		}

		var mode = this.frame.content.mode(),
			view = this.frame.router.get();

		if ( view && view.get( mode ) ) {
			setUserSetting( 'libraryContent', mode );
		}
	}
});

// Make selectionSync available on any Media Library state.
_.extend( Library.prototype, wp.media.selectionSync );

module.exports = Library;

},{}],12:[function(require,module,exports){
/**
 * wp.media.controller.MediaLibrary
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var Library = wp.media.controller.Library,
	MediaLibrary;

MediaLibrary = Library.extend({
	defaults: _.defaults({
		// Attachments browser defaults. @see media.view.AttachmentsBrowser
		filterable:      'uploaded',

		displaySettings: false,
		priority:        80,
		syncSelection:   false
	}, Library.prototype.defaults ),

	/**
	 * @since 3.9.0
	 *
	 * @param options
	 */
	initialize: function( options ) {
		this.media = options.media;
		this.type = options.type;
		this.set( 'library', wp.media.query({ type: this.type }) );

		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		// @todo this should use this.frame.
		if ( wp.media.frame.lastMime ) {
			this.set( 'library', wp.media.query({ type: wp.media.frame.lastMime }) );
			delete wp.media.frame.lastMime;
		}
		Library.prototype.activate.apply( this, arguments );
	}
});

module.exports = MediaLibrary;

},{}],13:[function(require,module,exports){
/**
 * wp.media.controller.Region
 *
 * A region is a persistent application layout area.
 *
 * A region assumes one mode at any time, and can be switched to another.
 *
 * When mode changes, events are triggered on the region's parent view.
 * The parent view will listen to specific events and fill the region with an
 * appropriate view depending on mode. For example, a frame listens for the
 * 'browse' mode t be activated on the 'content' view and then fills the region
 * with an AttachmentsBrowser view.
 *
 * @class
 *
 * @param {object}        options          Options hash for the region.
 * @param {string}        options.id       Unique identifier for the region.
 * @param {Backbone.View} options.view     A parent view the region exists within.
 * @param {string}        options.selector jQuery selector for the region within the parent view.
 */
var Region = function( options ) {
	_.extend( this, _.pick( options || {}, 'id', 'view', 'selector' ) );
};

// Use Backbone's self-propagating `extend` inheritance method.
Region.extend = Backbone.Model.extend;

_.extend( Region.prototype, {
	/**
	 * Activate a mode.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} mode
	 *
	 * @fires this.view#{this.id}:activate:{this._mode}
	 * @fires this.view#{this.id}:activate
	 * @fires this.view#{this.id}:deactivate:{this._mode}
	 * @fires this.view#{this.id}:deactivate
	 *
	 * @returns {wp.media.controller.Region} Returns itself to allow chaining.
	 */
	mode: function( mode ) {
		if ( ! mode ) {
			return this._mode;
		}
		// Bail if we're trying to change to the current mode.
		if ( mode === this._mode ) {
			return this;
		}

		/**
		 * Region mode deactivation event.
		 *
		 * @event this.view#{this.id}:deactivate:{this._mode}
		 * @event this.view#{this.id}:deactivate
		 */
		this.trigger('deactivate');

		this._mode = mode;
		this.render( mode );

		/**
		 * Region mode activation event.
		 *
		 * @event this.view#{this.id}:activate:{this._mode}
		 * @event this.view#{this.id}:activate
		 */
		this.trigger('activate');
		return this;
	},
	/**
	 * Render a mode.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} mode
	 *
	 * @fires this.view#{this.id}:create:{this._mode}
	 * @fires this.view#{this.id}:create
	 * @fires this.view#{this.id}:render:{this._mode}
	 * @fires this.view#{this.id}:render
	 *
	 * @returns {wp.media.controller.Region} Returns itself to allow chaining
	 */
	render: function( mode ) {
		// If the mode isn't active, activate it.
		if ( mode && mode !== this._mode ) {
			return this.mode( mode );
		}

		var set = { view: null },
			view;

		/**
		 * Create region view event.
		 *
		 * Region view creation takes place in an event callback on the frame.
		 *
		 * @event this.view#{this.id}:create:{this._mode}
		 * @event this.view#{this.id}:create
		 */
		this.trigger( 'create', set );
		view = set.view;

		/**
		 * Render region view event.
		 *
		 * Region view creation takes place in an event callback on the frame.
		 *
		 * @event this.view#{this.id}:create:{this._mode}
		 * @event this.view#{this.id}:create
		 */
		this.trigger( 'render', view );
		if ( view ) {
			this.set( view );
		}
		return this;
	},

	/**
	 * Get the region's view.
	 *
	 * @since 3.5.0
	 *
	 * @returns {wp.media.View}
	 */
	get: function() {
		return this.view.views.first( this.selector );
	},

	/**
	 * Set the region's view as a subview of the frame.
	 *
	 * @since 3.5.0
	 *
	 * @param {Array|Object} views
	 * @param {Object} [options={}]
	 * @returns {wp.Backbone.Subviews} Subviews is returned to allow chaining
	 */
	set: function( views, options ) {
		if ( options ) {
			options.add = false;
		}
		return this.view.views.set( this.selector, views, options );
	},

	/**
	 * Trigger regional view events on the frame.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} event
	 * @returns {undefined|wp.media.controller.Region} Returns itself to allow chaining.
	 */
	trigger: function( event ) {
		var base, args;

		if ( ! this._mode ) {
			return;
		}

		args = _.toArray( arguments );
		base = this.id + ':' + event;

		// Trigger `{this.id}:{event}:{this._mode}` event on the frame.
		args[0] = base + ':' + this._mode;
		this.view.trigger.apply( this.view, args );

		// Trigger `{this.id}:{event}` event on the frame.
		args[0] = base;
		this.view.trigger.apply( this.view, args );
		return this;
	}
});

module.exports = Region;

},{}],14:[function(require,module,exports){
/**
 * wp.media.controller.ReplaceImage
 *
 * A state for replacing an image.
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                         The attributes hash passed to the state.
 * @param {string}                     [attributes.id=replace-image]        Unique identifier.
 * @param {string}                     [attributes.title=Replace Image]     Title for the state. Displays in the media menu and the frame's title region.
 * @param {wp.media.model.Attachments} [attributes.library]                 The attachments collection to browse.
 *                                                                          If one is not supplied, a collection of all images will be created.
 * @param {boolean}                    [attributes.multiple=false]          Whether multi-select is enabled.
 * @param {string}                     [attributes.content=upload]          Initial mode for the content region.
 *                                                                          Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                     [attributes.menu=default]            Initial mode for the menu region.
 * @param {string}                     [attributes.router=browse]           Initial mode for the router region.
 * @param {string}                     [attributes.toolbar=replace]         Initial mode for the toolbar region.
 * @param {int}                        [attributes.priority=60]             The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.searchable=true]         Whether the library is searchable.
 * @param {boolean|string}             [attributes.filterable=uploaded]     Whether the library is filterable, and if so what filters should be shown.
 *                                                                          Accepts 'all', 'uploaded', or 'unattached'.
 * @param {boolean}                    [attributes.sortable=true]           Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.autoSelect=true]         Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                    [attributes.describe=false]          Whether to offer UI to describe attachments - e.g. captioning images in a gallery.
 * @param {boolean}                    [attributes.contentUserSetting=true] Whether the content region's mode should be set and persisted per user.
 * @param {boolean}                    [attributes.syncSelection=true]      Whether the Attachments selection should be persisted from the last state.
 */
var Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	ReplaceImage;

ReplaceImage = Library.extend({
	defaults: _.defaults({
		id:            'replace-image',
		title:         l10n.replaceImageTitle,
		multiple:      false,
		filterable:    'uploaded',
		toolbar:       'replace',
		menu:          false,
		priority:      60,
		syncSelection: true
	}, Library.prototype.defaults ),

	/**
	 * @since 3.9.0
	 *
	 * @param options
	 */
	initialize: function( options ) {
		var library, comparator;

		this.image = options.image;
		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query({ type: 'image' }) );
		}

		Library.prototype.initialize.apply( this, arguments );

		library    = this.get('library');
		comparator = library.comparator;

		// Overload the library's comparator to push items that are not in
		// the mirrored query to the front of the aggregate collection.
		library.comparator = function( a, b ) {
			var aInQuery = !! this.mirroring.get( a.cid ),
				bInQuery = !! this.mirroring.get( b.cid );

			if ( ! aInQuery && bInQuery ) {
				return -1;
			} else if ( aInQuery && ! bInQuery ) {
				return 1;
			} else {
				return comparator.apply( this, arguments );
			}
		};

		// Add all items in the selection to the library, so any featured
		// images that are not initially loaded still appear.
		library.observe( this.get('selection') );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		this.updateSelection();
		Library.prototype.activate.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	updateSelection: function() {
		var selection = this.get('selection'),
			attachment = this.image.attachment;

		selection.reset( attachment ? [ attachment ] : [] );
	}
});

module.exports = ReplaceImage;

},{}],15:[function(require,module,exports){
/**
 * wp.media.controller.SiteIconCropper
 *
 * A state for cropping a Site Icon.
 *
 * @class
 * @augments wp.media.controller.Cropper
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var Controller = wp.media.controller,
	SiteIconCropper;

SiteIconCropper = Controller.Cropper.extend({
	activate: function() {
		this.frame.on( 'content:create:crop', this.createCropContent, this );
		this.frame.on( 'close', this.removeCropper, this );
		this.set('selection', new Backbone.Collection(this.frame._selection.single));
	},

	createCropContent: function() {
		this.cropperView = new wp.media.view.SiteIconCropper({
			controller: this,
			attachment: this.get('selection').first()
		});
		this.cropperView.on('image-loaded', this.createCropToolbar, this);
		this.frame.content.set(this.cropperView);

	},

	doCrop: function( attachment ) {
		var cropDetails = attachment.get( 'cropDetails' ),
			control = this.get( 'control' );

		cropDetails.dst_width  = control.params.width;
		cropDetails.dst_height = control.params.height;

		return wp.ajax.post( 'crop-image', {
			nonce: attachment.get( 'nonces' ).edit,
			id: attachment.get( 'id' ),
			context: 'site-icon',
			cropDetails: cropDetails
		} );
	}
});

module.exports = SiteIconCropper;

},{}],16:[function(require,module,exports){
/**
 * wp.media.controller.StateMachine
 *
 * A state machine keeps track of state. It is in one state at a time,
 * and can change from one state to another.
 *
 * States are stored as models in a Backbone collection.
 *
 * @since 3.5.0
 *
 * @class
 * @augments Backbone.Model
 * @mixin
 * @mixes Backbone.Events
 *
 * @param {Array} states
 */
var StateMachine = function( states ) {
	// @todo This is dead code. The states collection gets created in media.view.Frame._createStates.
	this.states = new Backbone.Collection( states );
};

// Use Backbone's self-propagating `extend` inheritance method.
StateMachine.extend = Backbone.Model.extend;

_.extend( StateMachine.prototype, Backbone.Events, {
	/**
	 * Fetch a state.
	 *
	 * If no `id` is provided, returns the active state.
	 *
	 * Implicitly creates states.
	 *
	 * Ensure that the `states` collection exists so the `StateMachine`
	 *   can be used as a mixin.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} id
	 * @returns {wp.media.controller.State} Returns a State model
	 *   from the StateMachine collection
	 */
	state: function( id ) {
		this.states = this.states || new Backbone.Collection();

		// Default to the active state.
		id = id || this._state;

		if ( id && ! this.states.get( id ) ) {
			this.states.add({ id: id });
		}
		return this.states.get( id );
	},

	/**
	 * Sets the active state.
	 *
	 * Bail if we're trying to select the current state, if we haven't
	 * created the `states` collection, or are trying to select a state
	 * that does not exist.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} id
	 *
	 * @fires wp.media.controller.State#deactivate
	 * @fires wp.media.controller.State#activate
	 *
	 * @returns {wp.media.controller.StateMachine} Returns itself to allow chaining
	 */
	setState: function( id ) {
		var previous = this.state();

		if ( ( previous && id === previous.id ) || ! this.states || ! this.states.get( id ) ) {
			return this;
		}

		if ( previous ) {
			previous.trigger('deactivate');
			this._lastState = previous.id;
		}

		this._state = id;
		this.state().trigger('activate');

		return this;
	},

	/**
	 * Returns the previous active state.
	 *
	 * Call the `state()` method with no parameters to retrieve the current
	 * active state.
	 *
	 * @since 3.5.0
	 *
	 * @returns {wp.media.controller.State} Returns a State model
	 *    from the StateMachine collection
	 */
	lastState: function() {
		if ( this._lastState ) {
			return this.state( this._lastState );
		}
	}
});

// Map all event binding and triggering on a StateMachine to its `states` collection.
_.each([ 'on', 'off', 'trigger' ], function( method ) {
	/**
	 * @returns {wp.media.controller.StateMachine} Returns itself to allow chaining.
	 */
	StateMachine.prototype[ method ] = function() {
		// Ensure that the `states` collection exists so the `StateMachine`
		// can be used as a mixin.
		this.states = this.states || new Backbone.Collection();
		// Forward the method to the `states` collection.
		this.states[ method ].apply( this.states, arguments );
		return this;
	};
});

module.exports = StateMachine;

},{}],17:[function(require,module,exports){
/**
 * wp.media.controller.State
 *
 * A state is a step in a workflow that when set will trigger the controllers
 * for the regions to be updated as specified in the frame.
 *
 * A state has an event-driven lifecycle:
 *
 *     'ready'      triggers when a state is added to a state machine's collection.
 *     'activate'   triggers when a state is activated by a state machine.
 *     'deactivate' triggers when a state is deactivated by a state machine.
 *     'reset'      is not triggered automatically. It should be invoked by the
 *                  proper controller to reset the state to its default.
 *
 * @class
 * @augments Backbone.Model
 */
var State = Backbone.Model.extend({
	/**
	 * Constructor.
	 *
	 * @since 3.5.0
	 */
	constructor: function() {
		this.on( 'activate', this._preActivate, this );
		this.on( 'activate', this.activate, this );
		this.on( 'activate', this._postActivate, this );
		this.on( 'deactivate', this._deactivate, this );
		this.on( 'deactivate', this.deactivate, this );
		this.on( 'reset', this.reset, this );
		this.on( 'ready', this._ready, this );
		this.on( 'ready', this.ready, this );
		/**
		 * Call parent constructor with passed arguments
		 */
		Backbone.Model.apply( this, arguments );
		this.on( 'change:menu', this._updateMenu, this );
	},
	/**
	 * Ready event callback.
	 *
	 * @abstract
	 * @since 3.5.0
	 */
	ready: function() {},

	/**
	 * Activate event callback.
	 *
	 * @abstract
	 * @since 3.5.0
	 */
	activate: function() {},

	/**
	 * Deactivate event callback.
	 *
	 * @abstract
	 * @since 3.5.0
	 */
	deactivate: function() {},

	/**
	 * Reset event callback.
	 *
	 * @abstract
	 * @since 3.5.0
	 */
	reset: function() {},

	/**
	 * @access private
	 * @since 3.5.0
	 */
	_ready: function() {
		this._updateMenu();
	},

	/**
	 * @access private
	 * @since 3.5.0
	*/
	_preActivate: function() {
		this.active = true;
	},

	/**
	 * @access private
	 * @since 3.5.0
	 */
	_postActivate: function() {
		this.on( 'change:menu', this._menu, this );
		this.on( 'change:titleMode', this._title, this );
		this.on( 'change:content', this._content, this );
		this.on( 'change:toolbar', this._toolbar, this );

		this.frame.on( 'title:render:default', this._renderTitle, this );

		this._title();
		this._menu();
		this._toolbar();
		this._content();
		this._router();
	},

	/**
	 * @access private
	 * @since 3.5.0
	 */
	_deactivate: function() {
		this.active = false;

		this.frame.off( 'title:render:default', this._renderTitle, this );

		this.off( 'change:menu', this._menu, this );
		this.off( 'change:titleMode', this._title, this );
		this.off( 'change:content', this._content, this );
		this.off( 'change:toolbar', this._toolbar, this );
	},

	/**
	 * @access private
	 * @since 3.5.0
	 */
	_title: function() {
		this.frame.title.render( this.get('titleMode') || 'default' );
	},

	/**
	 * @access private
	 * @since 3.5.0
	 */
	_renderTitle: function( view ) {
		view.$el.text( this.get('title') || '' );
	},

	/**
	 * @access private
	 * @since 3.5.0
	 */
	_router: function() {
		var router = this.frame.router,
			mode = this.get('router'),
			view;

		this.frame.$el.toggleClass( 'hide-router', ! mode );
		if ( ! mode ) {
			return;
		}

		this.frame.router.render( mode );

		view = router.get();
		if ( view && view.select ) {
			view.select( this.frame.content.mode() );
		}
	},

	/**
	 * @access private
	 * @since 3.5.0
	 */
	_menu: function() {
		var menu = this.frame.menu,
			mode = this.get('menu'),
			view;

		this.frame.$el.toggleClass( 'hide-menu', ! mode );
		if ( ! mode ) {
			return;
		}

		menu.mode( mode );

		view = menu.get();
		if ( view && view.select ) {
			view.select( this.id );
		}
	},

	/**
	 * @access private
	 * @since 3.5.0
	 */
	_updateMenu: function() {
		var previous = this.previous('menu'),
			menu = this.get('menu');

		if ( previous ) {
			this.frame.off( 'menu:render:' + previous, this._renderMenu, this );
		}

		if ( menu ) {
			this.frame.on( 'menu:render:' + menu, this._renderMenu, this );
		}
	},

	/**
	 * Create a view in the media menu for the state.
	 *
	 * @access private
	 * @since 3.5.0
	 *
	 * @param {media.view.Menu} view The menu view.
	 */
	_renderMenu: function( view ) {
		var menuItem = this.get('menuItem'),
			title = this.get('title'),
			priority = this.get('priority');

		if ( ! menuItem && title ) {
			menuItem = { text: title };

			if ( priority ) {
				menuItem.priority = priority;
			}
		}

		if ( ! menuItem ) {
			return;
		}

		view.set( this.id, menuItem );
	}
});

_.each(['toolbar','content'], function( region ) {
	/**
	 * @access private
	 */
	State.prototype[ '_' + region ] = function() {
		var mode = this.get( region );
		if ( mode ) {
			this.frame[ region ].render( mode );
		}
	};
});

module.exports = State;

},{}],18:[function(require,module,exports){
/**
 * wp.media.selectionSync
 *
 * Sync an attachments selection in a state with another state.
 *
 * Allows for selecting multiple images in the Insert Media workflow, and then
 * switching to the Insert Gallery workflow while preserving the attachments selection.
 *
 * @mixin
 */
var selectionSync = {
	/**
	 * @since 3.5.0
	 */
	syncSelection: function() {
		var selection = this.get('selection'),
			manager = this.frame._selection;

		if ( ! this.get('syncSelection') || ! manager || ! selection ) {
			return;
		}

		// If the selection supports multiple items, validate the stored
		// attachments based on the new selection's conditions. Record
		// the attachments that are not included; we'll maintain a
		// reference to those. Other attachments are considered in flux.
		if ( selection.multiple ) {
			selection.reset( [], { silent: true });
			selection.validateAll( manager.attachments );
			manager.difference = _.difference( manager.attachments.models, selection.models );
		}

		// Sync the selection's single item with the master.
		selection.single( manager.single );
	},

	/**
	 * Record the currently active attachments, which is a combination
	 * of the selection's attachments and the set of selected
	 * attachments that this specific selection considered invalid.
	 * Reset the difference and record the single attachment.
	 *
	 * @since 3.5.0
	 */
	recordSelection: function() {
		var selection = this.get('selection'),
			manager = this.frame._selection;

		if ( ! this.get('syncSelection') || ! manager || ! selection ) {
			return;
		}

		if ( selection.multiple ) {
			manager.attachments.reset( selection.toArray().concat( manager.difference ) );
			manager.difference = [];
		} else {
			manager.attachments.add( selection.toArray() );
		}

		manager.single = selection._single;
	}
};

module.exports = selectionSync;

},{}],19:[function(require,module,exports){
var media = wp.media,
	$ = jQuery,
	l10n;

media.isTouchDevice = ( 'ontouchend' in document );

// Link any localized strings.
l10n = media.view.l10n = window._wpMediaViewsL10n || {};

// Link any settings.
media.view.settings = l10n.settings || {};
delete l10n.settings;

// Copy the `post` setting over to the model settings.
media.model.settings.post = media.view.settings.post;

// Check if the browser supports CSS 3.0 transitions
$.support.transition = (function(){
	var style = document.documentElement.style,
		transitions = {
			WebkitTransition: 'webkitTransitionEnd',
			MozTransition:    'transitionend',
			OTransition:      'oTransitionEnd otransitionend',
			transition:       'transitionend'
		}, transition;

	transition = _.find( _.keys( transitions ), function( transition ) {
		return ! _.isUndefined( style[ transition ] );
	});

	return transition && {
		end: transitions[ transition ]
	};
}());

/**
 * A shared event bus used to provide events into
 * the media workflows that 3rd-party devs can use to hook
 * in.
 */
media.events = _.extend( {}, Backbone.Events );

/**
 * Makes it easier to bind events using transitions.
 *
 * @param {string} selector
 * @param {Number} sensitivity
 * @returns {Promise}
 */
media.transition = function( selector, sensitivity ) {
	var deferred = $.Deferred();

	sensitivity = sensitivity || 2000;

	if ( $.support.transition ) {
		if ( ! (selector instanceof $) ) {
			selector = $( selector );
		}

		// Resolve the deferred when the first element finishes animating.
		selector.first().one( $.support.transition.end, deferred.resolve );

		// Just in case the event doesn't trigger, fire a callback.
		_.delay( deferred.resolve, sensitivity );

	// Otherwise, execute on the spot.
	} else {
		deferred.resolve();
	}

	return deferred.promise();
};

media.controller.Region = require( './controllers/region.js' );
media.controller.StateMachine = require( './controllers/state-machine.js' );
media.controller.State = require( './controllers/state.js' );

media.selectionSync = require( './utils/selection-sync.js' );
media.controller.Library = require( './controllers/library.js' );
media.controller.ImageDetails = require( './controllers/image-details.js' );
media.controller.GalleryEdit = require( './controllers/gallery-edit.js' );
media.controller.GalleryAdd = require( './controllers/gallery-add.js' );
media.controller.CollectionEdit = require( './controllers/collection-edit.js' );
media.controller.CollectionAdd = require( './controllers/collection-add.js' );
media.controller.FeaturedImage = require( './controllers/featured-image.js' );
media.controller.ReplaceImage = require( './controllers/replace-image.js' );
media.controller.EditImage = require( './controllers/edit-image.js' );
media.controller.MediaLibrary = require( './controllers/media-library.js' );
media.controller.Embed = require( './controllers/embed.js' );
media.controller.Cropper = require( './controllers/cropper.js' );
media.controller.CustomizeImageCropper = require( './controllers/customize-image-cropper.js' );
media.controller.SiteIconCropper = require( './controllers/site-icon-cropper.js' );

media.View = require( './views/view.js' );
media.view.Frame = require( './views/frame.js' );
media.view.MediaFrame = require( './views/media-frame.js' );
media.view.MediaFrame.Select = require( './views/frame/select.js' );
media.view.MediaFrame.Post = require( './views/frame/post.js' );
media.view.MediaFrame.ImageDetails = require( './views/frame/image-details.js' );
media.view.Modal = require( './views/modal.js' );
media.view.FocusManager = require( './views/focus-manager.js' );
media.view.UploaderWindow = require( './views/uploader/window.js' );
media.view.EditorUploader = require( './views/uploader/editor.js' );
media.view.UploaderInline = require( './views/uploader/inline.js' );
media.view.UploaderStatus = require( './views/uploader/status.js' );
media.view.UploaderStatusError = require( './views/uploader/status-error.js' );
media.view.Toolbar = require( './views/toolbar.js' );
media.view.Toolbar.Select = require( './views/toolbar/select.js' );
media.view.Toolbar.Embed = require( './views/toolbar/embed.js' );
media.view.Button = require( './views/button.js' );
media.view.ButtonGroup = require( './views/button-group.js' );
media.view.PriorityList = require( './views/priority-list.js' );
media.view.MenuItem = require( './views/menu-item.js' );
media.view.Menu = require( './views/menu.js' );
media.view.RouterItem = require( './views/router-item.js' );
media.view.Router = require( './views/router.js' );
media.view.Sidebar = require( './views/sidebar.js' );
media.view.Attachment = require( './views/attachment.js' );
media.view.Attachment.Library = require( './views/attachment/library.js' );
media.view.Attachment.EditLibrary = require( './views/attachment/edit-library.js' );
media.view.Attachments = require( './views/attachments.js' );
media.view.Search = require( './views/search.js' );
media.view.AttachmentFilters = require( './views/attachment-filters.js' );
media.view.DateFilter = require( './views/attachment-filters/date.js' );
media.view.AttachmentFilters.Uploaded = require( './views/attachment-filters/uploaded.js' );
media.view.AttachmentFilters.All = require( './views/attachment-filters/all.js' );
media.view.AttachmentsBrowser = require( './views/attachments/browser.js' );
media.view.Selection = require( './views/selection.js' );
media.view.Attachment.Selection = require( './views/attachment/selection.js' );
media.view.Attachments.Selection = require( './views/attachments/selection.js' );
media.view.Attachment.EditSelection = require( './views/attachment/edit-selection.js' );
media.view.Settings = require( './views/settings.js' );
media.view.Settings.AttachmentDisplay = require( './views/settings/attachment-display.js' );
media.view.Settings.Gallery = require( './views/settings/gallery.js' );
media.view.Settings.Playlist = require( './views/settings/playlist.js' );
media.view.Attachment.Details = require( './views/attachment/details.js' );
media.view.AttachmentCompat = require( './views/attachment-compat.js' );
media.view.Iframe = require( './views/iframe.js' );
media.view.Embed = require( './views/embed.js' );
media.view.Label = require( './views/label.js' );
media.view.EmbedUrl = require( './views/embed/url.js' );
media.view.EmbedLink = require( './views/embed/link.js' );
media.view.EmbedImage = require( './views/embed/image.js' );
media.view.ImageDetails = require( './views/image-details.js' );
media.view.Cropper = require( './views/cropper.js' );
media.view.SiteIconCropper = require( './views/site-icon-cropper.js' );
media.view.SiteIconPreview = require( './views/site-icon-preview.js' );
media.view.EditImage = require( './views/edit-image.js' );
media.view.Spinner = require( './views/spinner.js' );

},{"./controllers/collection-add.js":1,"./controllers/collection-edit.js":2,"./controllers/cropper.js":3,"./controllers/customize-image-cropper.js":4,"./controllers/edit-image.js":5,"./controllers/embed.js":6,"./controllers/featured-image.js":7,"./controllers/gallery-add.js":8,"./controllers/gallery-edit.js":9,"./controllers/image-details.js":10,"./controllers/library.js":11,"./controllers/media-library.js":12,"./controllers/region.js":13,"./controllers/replace-image.js":14,"./controllers/site-icon-cropper.js":15,"./controllers/state-machine.js":16,"./controllers/state.js":17,"./utils/selection-sync.js":18,"./views/attachment-compat.js":20,"./views/attachment-filters.js":21,"./views/attachment-filters/all.js":22,"./views/attachment-filters/date.js":23,"./views/attachment-filters/uploaded.js":24,"./views/attachment.js":25,"./views/attachment/details.js":26,"./views/attachment/edit-library.js":27,"./views/attachment/edit-selection.js":28,"./views/attachment/library.js":29,"./views/attachment/selection.js":30,"./views/attachments.js":31,"./views/attachments/browser.js":32,"./views/attachments/selection.js":33,"./views/button-group.js":34,"./views/button.js":35,"./views/cropper.js":36,"./views/edit-image.js":37,"./views/embed.js":38,"./views/embed/image.js":39,"./views/embed/link.js":40,"./views/embed/url.js":41,"./views/focus-manager.js":42,"./views/frame.js":43,"./views/frame/image-details.js":44,"./views/frame/post.js":45,"./views/frame/select.js":46,"./views/iframe.js":47,"./views/image-details.js":48,"./views/label.js":49,"./views/media-frame.js":50,"./views/menu-item.js":51,"./views/menu.js":52,"./views/modal.js":53,"./views/priority-list.js":54,"./views/router-item.js":55,"./views/router.js":56,"./views/search.js":57,"./views/selection.js":58,"./views/settings.js":59,"./views/settings/attachment-display.js":60,"./views/settings/gallery.js":61,"./views/settings/playlist.js":62,"./views/sidebar.js":63,"./views/site-icon-cropper.js":64,"./views/site-icon-preview.js":65,"./views/spinner.js":66,"./views/toolbar.js":67,"./views/toolbar/embed.js":68,"./views/toolbar/select.js":69,"./views/uploader/editor.js":70,"./views/uploader/inline.js":71,"./views/uploader/status-error.js":72,"./views/uploader/status.js":73,"./views/uploader/window.js":74,"./views/view.js":75}],20:[function(require,module,exports){
/**
 * wp.media.view.AttachmentCompat
 *
 * A view to display fields added via the `attachment_fields_to_edit` filter.
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	AttachmentCompat;

AttachmentCompat = View.extend({
	tagName:   'form',
	className: 'compat-item',

	events: {
		'submit':          'preventDefault',
		'change input':    'save',
		'change select':   'save',
		'change textarea': 'save'
	},

	initialize: function() {
		this.listenTo( this.model, 'change:compat', this.render );
	},
	/**
	 * @returns {wp.media.view.AttachmentCompat} Returns itself to allow chaining
	 */
	dispose: function() {
		if ( this.$(':focus').length ) {
			this.save();
		}
		/**
		 * call 'dispose' directly on the parent class
		 */
		return View.prototype.dispose.apply( this, arguments );
	},
	/**
	 * @returns {wp.media.view.AttachmentCompat} Returns itself to allow chaining
	 */
	render: function() {
		var compat = this.model.get('compat');
		if ( ! compat || ! compat.item ) {
			return;
		}

		this.views.detach();
		this.$el.html( compat.item );
		this.views.render();
		return this;
	},
	/**
	 * @param {Object} event
	 */
	preventDefault: function( event ) {
		event.preventDefault();
	},
	/**
	 * @param {Object} event
	 */
	save: function( event ) {
		var data = {};

		if ( event ) {
			event.preventDefault();
		}

		_.each( this.$el.serializeArray(), function( pair ) {
			data[ pair.name ] = pair.value;
		});

		this.controller.trigger( 'attachment:compat:waiting', ['waiting'] );
		this.model.saveCompat( data ).always( _.bind( this.postSave, this ) );
	},

	postSave: function() {
		this.controller.trigger( 'attachment:compat:ready', ['ready'] );
	}
});

module.exports = AttachmentCompat;

},{}],21:[function(require,module,exports){
/**
 * wp.media.view.AttachmentFilters
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var $ = jQuery,
	AttachmentFilters;

AttachmentFilters = wp.media.View.extend({
	tagName:   'select',
	className: 'attachment-filters',
	id:        'media-attachment-filters',

	events: {
		change: 'change'
	},

	keys: [],

	initialize: function() {
		this.createFilters();
		_.extend( this.filters, this.options.filters );

		// Build `<option>` elements.
		this.$el.html( _.chain( this.filters ).map( function( filter, value ) {
			return {
				el: $( '<option></option>' ).val( value ).html( filter.text )[0],
				priority: filter.priority || 50
			};
		}, this ).sortBy('priority').pluck('el').value() );

		this.listenTo( this.model, 'change', this.select );
		this.select();
	},

	/**
	 * @abstract
	 */
	createFilters: function() {
		this.filters = {};
	},

	/**
	 * When the selected filter changes, update the Attachment Query properties to match.
	 */
	change: function() {
		var filter = this.filters[ this.el.value ];
		if ( filter ) {
			this.model.set( filter.props );
		}
	},

	select: function() {
		var model = this.model,
			value = 'all',
			props = model.toJSON();

		_.find( this.filters, function( filter, id ) {
			var equal = _.all( filter.props, function( prop, key ) {
				return prop === ( _.isUndefined( props[ key ] ) ? null : props[ key ] );
			});

			if ( equal ) {
				return value = id;
			}
		});

		this.$el.val( value );
	}
});

module.exports = AttachmentFilters;

},{}],22:[function(require,module,exports){
/**
 * wp.media.view.AttachmentFilters.All
 *
 * @class
 * @augments wp.media.view.AttachmentFilters
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var l10n = wp.media.view.l10n,
	All;

All = wp.media.view.AttachmentFilters.extend({
	createFilters: function() {
		var filters = {};

		_.each( wp.media.view.settings.mimeTypes || {}, function( text, key ) {
			filters[ key ] = {
				text: text,
				props: {
					status:  null,
					type:    key,
					uploadedTo: null,
					orderby: 'date',
					order:   'DESC'
				}
			};
		});

		filters.all = {
			text:  l10n.allMediaItems,
			props: {
				status:  null,
				type:    null,
				uploadedTo: null,
				orderby: 'date',
				order:   'DESC'
			},
			priority: 10
		};

		if ( wp.media.view.settings.post.id ) {
			filters.uploaded = {
				text:  l10n.uploadedToThisPost,
				props: {
					status:  null,
					type:    null,
					uploadedTo: wp.media.view.settings.post.id,
					orderby: 'menuOrder',
					order:   'ASC'
				},
				priority: 20
			};
		}

		filters.unattached = {
			text:  l10n.unattached,
			props: {
				status:     null,
				uploadedTo: 0,
				type:       null,
				orderby:    'menuOrder',
				order:      'ASC'
			},
			priority: 50
		};

		if ( wp.media.view.settings.mediaTrash &&
			this.controller.isModeActive( 'grid' ) ) {

			filters.trash = {
				text:  l10n.trash,
				props: {
					uploadedTo: null,
					status:     'trash',
					type:       null,
					orderby:    'date',
					order:      'DESC'
				},
				priority: 50
			};
		}

		this.filters = filters;
	}
});

module.exports = All;

},{}],23:[function(require,module,exports){
/**
 * A filter dropdown for month/dates.
 *
 * @class
 * @augments wp.media.view.AttachmentFilters
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var l10n = wp.media.view.l10n,
	DateFilter;

DateFilter = wp.media.view.AttachmentFilters.extend({
	id: 'media-attachment-date-filters',

	createFilters: function() {
		var filters = {};
		_.each( wp.media.view.settings.months || {}, function( value, index ) {
			filters[ index ] = {
				text: value.text,
				props: {
					year: value.year,
					monthnum: value.month
				}
			};
		});
		filters.all = {
			text:  l10n.allDates,
			props: {
				monthnum: false,
				year:  false
			},
			priority: 10
		};
		this.filters = filters;
	}
});

module.exports = DateFilter;

},{}],24:[function(require,module,exports){
/**
 * wp.media.view.AttachmentFilters.Uploaded
 *
 * @class
 * @augments wp.media.view.AttachmentFilters
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var l10n = wp.media.view.l10n,
	Uploaded;

Uploaded = wp.media.view.AttachmentFilters.extend({
	createFilters: function() {
		var type = this.model.get('type'),
			types = wp.media.view.settings.mimeTypes,
			text;

		if ( types && type ) {
			text = types[ type ];
		}

		this.filters = {
			all: {
				text:  text || l10n.allMediaItems,
				props: {
					uploadedTo: null,
					orderby: 'date',
					order:   'DESC'
				},
				priority: 10
			},

			uploaded: {
				text:  l10n.uploadedToThisPost,
				props: {
					uploadedTo: wp.media.view.settings.post.id,
					orderby: 'menuOrder',
					order:   'ASC'
				},
				priority: 20
			},

			unattached: {
				text:  l10n.unattached,
				props: {
					uploadedTo: 0,
					orderby: 'menuOrder',
					order:   'ASC'
				},
				priority: 50
			}
		};
	}
});

module.exports = Uploaded;

},{}],25:[function(require,module,exports){
/**
 * wp.media.view.Attachment
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	$ = jQuery,
	Attachment;

Attachment = View.extend({
	tagName:   'li',
	className: 'attachment',
	template:  wp.template('attachment'),

	attributes: function() {
		return {
			'tabIndex':     0,
			'role':         'checkbox',
			'aria-label':   this.model.get( 'title' ),
			'aria-checked': false,
			'data-id':      this.model.get( 'id' )
		};
	},

	events: {
		'click .js--select-attachment':   'toggleSelectionHandler',
		'change [data-setting]':          'updateSetting',
		'change [data-setting] input':    'updateSetting',
		'change [data-setting] select':   'updateSetting',
		'change [data-setting] textarea': 'updateSetting',
		'click .attachment-close':        'removeFromLibrary',
		'click .check':                   'checkClickHandler',
		'keydown':                        'toggleSelectionHandler'
	},

	buttons: {},

	initialize: function() {
		var selection = this.options.selection,
			options = _.defaults( this.options, {
				rerenderOnModelChange: true
			} );

		if ( options.rerenderOnModelChange ) {
			this.listenTo( this.model, 'change', this.render );
		} else {
			this.listenTo( this.model, 'change:percent', this.progress );
		}
		this.listenTo( this.model, 'change:title', this._syncTitle );
		this.listenTo( this.model, 'change:caption', this._syncCaption );
		this.listenTo( this.model, 'change:artist', this._syncArtist );
		this.listenTo( this.model, 'change:album', this._syncAlbum );

		// Update the selection.
		this.listenTo( this.model, 'add', this.select );
		this.listenTo( this.model, 'remove', this.deselect );
		if ( selection ) {
			selection.on( 'reset', this.updateSelect, this );
			// Update the model's details view.
			this.listenTo( this.model, 'selection:single selection:unsingle', this.details );
			this.details( this.model, this.controller.state().get('selection') );
		}

		this.listenTo( this.controller, 'attachment:compat:waiting attachment:compat:ready', this.updateSave );
	},
	/**
	 * @returns {wp.media.view.Attachment} Returns itself to allow chaining
	 */
	dispose: function() {
		var selection = this.options.selection;

		// Make sure all settings are saved before removing the view.
		this.updateAll();

		if ( selection ) {
			selection.off( null, null, this );
		}
		/**
		 * call 'dispose' directly on the parent class
		 */
		View.prototype.dispose.apply( this, arguments );
		return this;
	},
	/**
	 * @returns {wp.media.view.Attachment} Returns itself to allow chaining
	 */
	render: function() {
		var options = _.defaults( this.model.toJSON(), {
				orientation:   'landscape',
				uploading:     false,
				type:          '',
				subtype:       '',
				icon:          '',
				filename:      '',
				caption:       '',
				title:         '',
				dateFormatted: '',
				width:         '',
				height:        '',
				compat:        false,
				alt:           '',
				description:   ''
			}, this.options );

		options.buttons  = this.buttons;
		options.describe = this.controller.state().get('describe');

		if ( 'image' === options.type ) {
			options.size = this.imageSize();
		}

		options.can = {};
		if ( options.nonces ) {
			options.can.remove = !! options.nonces['delete'];
			options.can.save = !! options.nonces.update;
		}

		if ( this.controller.state().get('allowLocalEdits') ) {
			options.allowLocalEdits = true;
		}

		if ( options.uploading && ! options.percent ) {
			options.percent = 0;
		}

		this.views.detach();
		this.$el.html( this.template( options ) );

		this.$el.toggleClass( 'uploading', options.uploading );

		if ( options.uploading ) {
			this.$bar = this.$('.media-progress-bar div');
		} else {
			delete this.$bar;
		}

		// Check if the model is selected.
		this.updateSelect();

		// Update the save status.
		this.updateSave();

		this.views.render();

		return this;
	},

	progress: function() {
		if ( this.$bar && this.$bar.length ) {
			this.$bar.width( this.model.get('percent') + '%' );
		}
	},

	/**
	 * @param {Object} event
	 */
	toggleSelectionHandler: function( event ) {
		var method;

		// Don't do anything inside inputs and on the attachment check and remove buttons.
		if ( 'INPUT' === event.target.nodeName || 'BUTTON' === event.target.nodeName ) {
			return;
		}

		// Catch arrow events
		if ( 37 === event.keyCode || 38 === event.keyCode || 39 === event.keyCode || 40 === event.keyCode ) {
			this.controller.trigger( 'attachment:keydown:arrow', event );
			return;
		}

		// Catch enter and space events
		if ( 'keydown' === event.type && 13 !== event.keyCode && 32 !== event.keyCode ) {
			return;
		}

		event.preventDefault();

		// In the grid view, bubble up an edit:attachment event to the controller.
		if ( this.controller.isModeActive( 'grid' ) ) {
			if ( this.controller.isModeActive( 'edit' ) ) {
				// Pass the current target to restore focus when closing
				this.controller.trigger( 'edit:attachment', this.model, event.currentTarget );
				return;
			}

			if ( this.controller.isModeActive( 'select' ) ) {
				method = 'toggle';
			}
		}

		if ( event.shiftKey ) {
			method = 'between';
		} else if ( event.ctrlKey || event.metaKey ) {
			method = 'toggle';
		}

		this.toggleSelection({
			method: method
		});

		this.controller.trigger( 'selection:toggle' );
	},
	/**
	 * @param {Object} options
	 */
	toggleSelection: function( options ) {
		var collection = this.collection,
			selection = this.options.selection,
			model = this.model,
			method = options && options.method,
			single, models, singleIndex, modelIndex;

		if ( ! selection ) {
			return;
		}

		single = selection.single();
		method = _.isUndefined( method ) ? selection.multiple : method;

		// If the `method` is set to `between`, select all models that
		// exist between the current and the selected model.
		if ( 'between' === method && single && selection.multiple ) {
			// If the models are the same, short-circuit.
			if ( single === model ) {
				return;
			}

			singleIndex = collection.indexOf( single );
			modelIndex  = collection.indexOf( this.model );

			if ( singleIndex < modelIndex ) {
				models = collection.models.slice( singleIndex, modelIndex + 1 );
			} else {
				models = collection.models.slice( modelIndex, singleIndex + 1 );
			}

			selection.add( models );
			selection.single( model );
			return;

		// If the `method` is set to `toggle`, just flip the selection
		// status, regardless of whether the model is the single model.
		} else if ( 'toggle' === method ) {
			selection[ this.selected() ? 'remove' : 'add' ]( model );
			selection.single( model );
			return;
		} else if ( 'add' === method ) {
			selection.add( model );
			selection.single( model );
			return;
		}

		// Fixes bug that loses focus when selecting a featured image
		if ( ! method ) {
			method = 'add';
		}

		if ( method !== 'add' ) {
			method = 'reset';
		}

		if ( this.selected() ) {
			// If the model is the single model, remove it.
			// If it is not the same as the single model,
			// it now becomes the single model.
			selection[ single === model ? 'remove' : 'single' ]( model );
		} else {
			// If the model is not selected, run the `method` on the
			// selection. By default, we `reset` the selection, but the
			// `method` can be set to `add` the model to the selection.
			selection[ method ]( model );
			selection.single( model );
		}
	},

	updateSelect: function() {
		this[ this.selected() ? 'select' : 'deselect' ]();
	},
	/**
	 * @returns {unresolved|Boolean}
	 */
	selected: function() {
		var selection = this.options.selection;
		if ( selection ) {
			return !! selection.get( this.model.cid );
		}
	},
	/**
	 * @param {Backbone.Model} model
	 * @param {Backbone.Collection} collection
	 */
	select: function( model, collection ) {
		var selection = this.options.selection,
			controller = this.controller;

		// Check if a selection exists and if it's the collection provided.
		// If they're not the same collection, bail; we're in another
		// selection's event loop.
		if ( ! selection || ( collection && collection !== selection ) ) {
			return;
		}

		// Bail if the model is already selected.
		if ( this.$el.hasClass( 'selected' ) ) {
			return;
		}

		// Add 'selected' class to model, set aria-checked to true.
		this.$el.addClass( 'selected' ).attr( 'aria-checked', true );
		//  Make the checkbox tabable, except in media grid (bulk select mode).
		if ( ! ( controller.isModeActive( 'grid' ) && controller.isModeActive( 'select' ) ) ) {
			this.$( '.check' ).attr( 'tabindex', '0' );
		}
	},
	/**
	 * @param {Backbone.Model} model
	 * @param {Backbone.Collection} collection
	 */
	deselect: function( model, collection ) {
		var selection = this.options.selection;

		// Check if a selection exists and if it's the collection provided.
		// If they're not the same collection, bail; we're in another
		// selection's event loop.
		if ( ! selection || ( collection && collection !== selection ) ) {
			return;
		}
		this.$el.removeClass( 'selected' ).attr( 'aria-checked', false )
			.find( '.check' ).attr( 'tabindex', '-1' );
	},
	/**
	 * @param {Backbone.Model} model
	 * @param {Backbone.Collection} collection
	 */
	details: function( model, collection ) {
		var selection = this.options.selection,
			details;

		if ( selection !== collection ) {
			return;
		}

		details = selection.single();
		this.$el.toggleClass( 'details', details === this.model );
	},
	/**
	 * @param {string} size
	 * @returns {Object}
	 */
	imageSize: function( size ) {
		var sizes = this.model.get('sizes'), matched = false;

		size = size || 'medium';

		// Use the provided image size if possible.
		if ( sizes ) {
			if ( sizes[ size ] ) {
				matched = sizes[ size ];
			} else if ( sizes.large ) {
				matched = sizes.large;
			} else if ( sizes.thumbnail ) {
				matched = sizes.thumbnail;
			} else if ( sizes.full ) {
				matched = sizes.full;
			}

			if ( matched ) {
				return _.clone( matched );
			}
		}

		return {
			url:         this.model.get('url'),
			width:       this.model.get('width'),
			height:      this.model.get('height'),
			orientation: this.model.get('orientation')
		};
	},
	/**
	 * @param {Object} event
	 */
	updateSetting: function( event ) {
		var $setting = $( event.target ).closest('[data-setting]'),
			setting, value;

		if ( ! $setting.length ) {
			return;
		}

		setting = $setting.data('setting');
		value   = event.target.value;

		if ( this.model.get( setting ) !== value ) {
			this.save( setting, value );
		}
	},

	/**
	 * Pass all the arguments to the model's save method.
	 *
	 * Records the aggregate status of all save requests and updates the
	 * view's classes accordingly.
	 */
	save: function() {
		var view = this,
			save = this._save = this._save || { status: 'ready' },
			request = this.model.save.apply( this.model, arguments ),
			requests = save.requests ? $.when( request, save.requests ) : request;

		// If we're waiting to remove 'Saved.', stop.
		if ( save.savedTimer ) {
			clearTimeout( save.savedTimer );
		}

		this.updateSave('waiting');
		save.requests = requests;
		requests.always( function() {
			// If we've performed another request since this one, bail.
			if ( save.requests !== requests ) {
				return;
			}

			view.updateSave( requests.state() === 'resolved' ? 'complete' : 'error' );
			save.savedTimer = setTimeout( function() {
				view.updateSave('ready');
				delete save.savedTimer;
			}, 2000 );
		});
	},
	/**
	 * @param {string} status
	 * @returns {wp.media.view.Attachment} Returns itself to allow chaining
	 */
	updateSave: function( status ) {
		var save = this._save = this._save || { status: 'ready' };

		if ( status && status !== save.status ) {
			this.$el.removeClass( 'save-' + save.status );
			save.status = status;
		}

		this.$el.addClass( 'save-' + save.status );
		return this;
	},

	updateAll: function() {
		var $settings = this.$('[data-setting]'),
			model = this.model,
			changed;

		changed = _.chain( $settings ).map( function( el ) {
			var $input = $('input, textarea, select, [value]', el ),
				setting, value;

			if ( ! $input.length ) {
				return;
			}

			setting = $(el).data('setting');
			value = $input.val();

			// Record the value if it changed.
			if ( model.get( setting ) !== value ) {
				return [ setting, value ];
			}
		}).compact().object().value();

		if ( ! _.isEmpty( changed ) ) {
			model.save( changed );
		}
	},
	/**
	 * @param {Object} event
	 */
	removeFromLibrary: function( event ) {
		// Catch enter and space events
		if ( 'keydown' === event.type && 13 !== event.keyCode && 32 !== event.keyCode ) {
			return;
		}

		// Stop propagation so the model isn't selected.
		event.stopPropagation();

		this.collection.remove( this.model );
	},

	/**
	 * Add the model if it isn't in the selection, if it is in the selection,
	 * remove it.
	 *
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
	 */
	checkClickHandler: function ( event ) {
		var selection = this.options.selection;
		if ( ! selection ) {
			return;
		}
		event.stopPropagation();
		if ( selection.where( { id: this.model.get( 'id' ) } ).length ) {
			selection.remove( this.model );
			// Move focus back to the attachment tile (from the check).
			this.$el.focus();
		} else {
			selection.add( this.model );
		}
	}
});

// Ensure settings remain in sync between attachment views.
_.each({
	caption: '_syncCaption',
	title:   '_syncTitle',
	artist:  '_syncArtist',
	album:   '_syncAlbum'
}, function( method, setting ) {
	/**
	 * @param {Backbone.Model} model
	 * @param {string} value
	 * @returns {wp.media.view.Attachment} Returns itself to allow chaining
	 */
	Attachment.prototype[ method ] = function( model, value ) {
		var $setting = this.$('[data-setting="' + setting + '"]');

		if ( ! $setting.length ) {
			return this;
		}

		// If the updated value is in sync with the value in the DOM, there
		// is no need to re-render. If we're currently editing the value,
		// it will automatically be in sync, suppressing the re-render for
		// the view we're editing, while updating any others.
		if ( value === $setting.find('input, textarea, select, [value]').val() ) {
			return this;
		}

		return this.render();
	};
});

module.exports = Attachment;

},{}],26:[function(require,module,exports){
/**
 * wp.media.view.Attachment.Details
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Attachment = wp.media.view.Attachment,
	l10n = wp.media.view.l10n,
	Details;

Details = Attachment.extend({
	tagName:   'div',
	className: 'attachment-details',
	template:  wp.template('attachment-details'),

	attributes: function() {
		return {
			'tabIndex':     0,
			'data-id':      this.model.get( 'id' )
		};
	},

	events: {
		'change [data-setting]':          'updateSetting',
		'change [data-setting] input':    'updateSetting',
		'change [data-setting] select':   'updateSetting',
		'change [data-setting] textarea': 'updateSetting',
		'click .delete-attachment':       'deleteAttachment',
		'click .trash-attachment':        'trashAttachment',
		'click .untrash-attachment':      'untrashAttachment',
		'click .edit-attachment':         'editAttachment',
		'keydown':                        'toggleSelectionHandler'
	},

	initialize: function() {
		this.options = _.defaults( this.options, {
			rerenderOnModelChange: false
		});

		this.on( 'ready', this.initialFocus );
		// Call 'initialize' directly on the parent class.
		Attachment.prototype.initialize.apply( this, arguments );
	},

	initialFocus: function() {
		if ( ! wp.media.isTouchDevice ) {
			/*
			Previously focused the first ':input' (the readonly URL text field).
			Since the first ':input' is now a button (delete/trash): when pressing
			spacebar on an attachment, Firefox fires deleteAttachment/trashAttachment
			as soon as focus is moved. Explicitly target the first text field for now.
			@todo change initial focus logic, also for accessibility.
			*/
			this.$( 'input[type="text"]' ).eq( 0 ).focus();
		}
	},
	/**
	 * @param {Object} event
	 */
	deleteAttachment: function( event ) {
		event.preventDefault();

		if ( window.confirm( l10n.warnDelete ) ) {
			this.model.destroy();
			// Keep focus inside media modal
			// after image is deleted
			this.controller.modal.focusManager.focus();
		}
	},
	/**
	 * @param {Object} event
	 */
	trashAttachment: function( event ) {
		var library = this.controller.library;
		event.preventDefault();

		if ( wp.media.view.settings.mediaTrash &&
			'edit-metadata' === this.controller.content.mode() ) {

			this.model.set( 'status', 'trash' );
			this.model.save().done( function() {
				library._requery( true );
			} );
		}  else {
			this.model.destroy();
		}
	},
	/**
	 * @param {Object} event
	 */
	untrashAttachment: function( event ) {
		var library = this.controller.library;
		event.preventDefault();

		this.model.set( 'status', 'inherit' );
		this.model.save().done( function() {
			library._requery( true );
		} );
	},
	/**
	 * @param {Object} event
	 */
	editAttachment: function( event ) {
		var editState = this.controller.states.get( 'edit-image' );
		if ( window.imageEdit && editState ) {
			event.preventDefault();

			editState.set( 'image', this.model );
			this.controller.setState( 'edit-image' );
		} else {
			this.$el.addClass('needs-refresh');
		}
	},
	/**
	 * When reverse tabbing(shift+tab) out of the right details panel, deliver
	 * the focus to the item in the list that was being edited.
	 *
	 * @param {Object} event
	 */
	toggleSelectionHandler: function( event ) {
		if ( 'keydown' === event.type && 9 === event.keyCode && event.shiftKey && event.target === this.$( ':tabbable' ).get( 0 ) ) {
			this.controller.trigger( 'attachment:details:shift-tab', event );
			return false;
		}

		if ( 37 === event.keyCode || 38 === event.keyCode || 39 === event.keyCode || 40 === event.keyCode ) {
			this.controller.trigger( 'attachment:keydown:arrow', event );
			return;
		}
	}
});

module.exports = Details;

},{}],27:[function(require,module,exports){
/**
 * wp.media.view.Attachment.EditLibrary
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var EditLibrary = wp.media.view.Attachment.extend({
	buttons: {
		close: true
	}
});

module.exports = EditLibrary;

},{}],28:[function(require,module,exports){
/**
 * wp.media.view.Attachments.EditSelection
 *
 * @class
 * @augments wp.media.view.Attachment.Selection
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var EditSelection = wp.media.view.Attachment.Selection.extend({
	buttons: {
		close: true
	}
});

module.exports = EditSelection;

},{}],29:[function(require,module,exports){
/**
 * wp.media.view.Attachment.Library
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Library = wp.media.view.Attachment.extend({
	buttons: {
		check: true
	}
});

module.exports = Library;

},{}],30:[function(require,module,exports){
/**
 * wp.media.view.Attachment.Selection
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Selection = wp.media.view.Attachment.extend({
	className: 'attachment selection',

	// On click, just select the model, instead of removing the model from
	// the selection.
	toggleSelection: function() {
		this.options.selection.single( this.model );
	}
});

module.exports = Selection;

},{}],31:[function(require,module,exports){
/**
 * wp.media.view.Attachments
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	$ = jQuery,
	Attachments;

Attachments = View.extend({
	tagName:   'ul',
	className: 'attachments',

	attributes: {
		tabIndex: -1
	},

	initialize: function() {
		this.el.id = _.uniqueId('__attachments-view-');

		_.defaults( this.options, {
			refreshSensitivity: wp.media.isTouchDevice ? 300 : 200,
			refreshThreshold:   3,
			AttachmentView:     wp.media.view.Attachment,
			sortable:           false,
			resize:             true,
			idealColumnWidth:   $( window ).width() < 640 ? 135 : 150
		});

		this._viewsByCid = {};
		this.$window = $( window );
		this.resizeEvent = 'resize.media-modal-columns';

		this.collection.on( 'add', function( attachment ) {
			this.views.add( this.createAttachmentView( attachment ), {
				at: this.collection.indexOf( attachment )
			});
		}, this );

		this.collection.on( 'remove', function( attachment ) {
			var view = this._viewsByCid[ attachment.cid ];
			delete this._viewsByCid[ attachment.cid ];

			if ( view ) {
				view.remove();
			}
		}, this );

		this.collection.on( 'reset', this.render, this );

		this.listenTo( this.controller, 'library:selection:add',    this.attachmentFocus );

		// Throttle the scroll handler and bind this.
		this.scroll = _.chain( this.scroll ).bind( this ).throttle( this.options.refreshSensitivity ).value();

		this.options.scrollElement = this.options.scrollElement || this.el;
		$( this.options.scrollElement ).on( 'scroll', this.scroll );

		this.initSortable();

		_.bindAll( this, 'setColumns' );

		if ( this.options.resize ) {
			this.on( 'ready', this.bindEvents );
			this.controller.on( 'open', this.setColumns );

			// Call this.setColumns() after this view has been rendered in the DOM so
			// attachments get proper width applied.
			_.defer( this.setColumns, this );
		}
	},

	bindEvents: function() {
		this.$window.off( this.resizeEvent ).on( this.resizeEvent, _.debounce( this.setColumns, 50 ) );
	},

	attachmentFocus: function() {
		this.$( 'li:first' ).focus();
	},

	restoreFocus: function() {
		this.$( 'li.selected:first' ).focus();
	},

	arrowEvent: function( event ) {
		var attachments = this.$el.children( 'li' ),
			perRow = this.columns,
			index = attachments.filter( ':focus' ).index(),
			row = ( index + 1 ) <= perRow ? 1 : Math.ceil( ( index + 1 ) / perRow );

		if ( index === -1 ) {
			return;
		}

		// Left arrow
		if ( 37 === event.keyCode ) {
			if ( 0 === index ) {
				return;
			}
			attachments.eq( index - 1 ).focus();
		}

		// Up arrow
		if ( 38 === event.keyCode ) {
			if ( 1 === row ) {
				return;
			}
			attachments.eq( index - perRow ).focus();
		}

		// Right arrow
		if ( 39 === event.keyCode ) {
			if ( attachments.length === index ) {
				return;
			}
			attachments.eq( index + 1 ).focus();
		}

		// Down arrow
		if ( 40 === event.keyCode ) {
			if ( Math.ceil( attachments.length / perRow ) === row ) {
				return;
			}
			attachments.eq( index + perRow ).focus();
		}
	},

	dispose: function() {
		this.collection.props.off( null, null, this );
		if ( this.options.resize ) {
			this.$window.off( this.resizeEvent );
		}

		/**
		 * call 'dispose' directly on the parent class
		 */
		View.prototype.dispose.apply( this, arguments );
	},

	setColumns: function() {
		var prev = this.columns,
			width = this.$el.width();

		if ( width ) {
			this.columns = Math.min( Math.round( width / this.options.idealColumnWidth ), 12 ) || 1;

			if ( ! prev || prev !== this.columns ) {
				this.$el.closest( '.media-frame-content' ).attr( 'data-columns', this.columns );
			}
		}
	},

	initSortable: function() {
		var collection = this.collection;

		if ( wp.media.isTouchDevice || ! this.options.sortable || ! $.fn.sortable ) {
			return;
		}

		this.$el.sortable( _.extend({
			// If the `collection` has a `comparator`, disable sorting.
			disabled: !! collection.comparator,

			// Change the position of the attachment as soon as the
			// mouse pointer overlaps a thumbnail.
			tolerance: 'pointer',

			// Record the initial `index` of the dragged model.
			start: function( event, ui ) {
				ui.item.data('sortableIndexStart', ui.item.index());
			},

			// Update the model's index in the collection.
			// Do so silently, as the view is already accurate.
			update: function( event, ui ) {
				var model = collection.at( ui.item.data('sortableIndexStart') ),
					comparator = collection.comparator;

				// Temporarily disable the comparator to prevent `add`
				// from re-sorting.
				delete collection.comparator;

				// Silently shift the model to its new index.
				collection.remove( model, {
					silent: true
				});
				collection.add( model, {
					silent: true,
					at:     ui.item.index()
				});

				// Restore the comparator.
				collection.comparator = comparator;

				// Fire the `reset` event to ensure other collections sync.
				collection.trigger( 'reset', collection );

				// If the collection is sorted by menu order,
				// update the menu order.
				collection.saveMenuOrder();
			}
		}, this.options.sortable ) );

		// If the `orderby` property is changed on the `collection`,
		// check to see if we have a `comparator`. If so, disable sorting.
		collection.props.on( 'change:orderby', function() {
			this.$el.sortable( 'option', 'disabled', !! collection.comparator );
		}, this );

		this.collection.props.on( 'change:orderby', this.refreshSortable, this );
		this.refreshSortable();
	},

	refreshSortable: function() {
		if ( wp.media.isTouchDevice || ! this.options.sortable || ! $.fn.sortable ) {
			return;
		}

		// If the `collection` has a `comparator`, disable sorting.
		var collection = this.collection,
			orderby = collection.props.get('orderby'),
			enabled = 'menuOrder' === orderby || ! collection.comparator;

		this.$el.sortable( 'option', 'disabled', ! enabled );
	},

	/**
	 * @param {wp.media.model.Attachment} attachment
	 * @returns {wp.media.View}
	 */
	createAttachmentView: function( attachment ) {
		var view = new this.options.AttachmentView({
			controller:           this.controller,
			model:                attachment,
			collection:           this.collection,
			selection:            this.options.selection
		});

		return this._viewsByCid[ attachment.cid ] = view;
	},

	prepare: function() {
		// Create all of the Attachment views, and replace
		// the list in a single DOM operation.
		if ( this.collection.length ) {
			this.views.set( this.collection.map( this.createAttachmentView, this ) );

		// If there are no elements, clear the views and load some.
		} else {
			this.views.unset();
			this.collection.more().done( this.scroll );
		}
	},

	ready: function() {
		// Trigger the scroll event to check if we're within the
		// threshold to query for additional attachments.
		this.scroll();
	},

	scroll: function() {
		var view = this,
			el = this.options.scrollElement,
			scrollTop = el.scrollTop,
			toolbar;

		// The scroll event occurs on the document, but the element
		// that should be checked is the document body.
		if ( el === document ) {
			el = document.body;
			scrollTop = $(document).scrollTop();
		}

		if ( ! $(el).is(':visible') || ! this.collection.hasMore() ) {
			return;
		}

		toolbar = this.views.parent.toolbar;

		// Show the spinner only if we are close to the bottom.
		if ( el.scrollHeight - ( scrollTop + el.clientHeight ) < el.clientHeight / 3 ) {
			toolbar.get('spinner').show();
		}

		if ( el.scrollHeight < scrollTop + ( el.clientHeight * this.options.refreshThreshold ) ) {
			this.collection.more().done(function() {
				view.scroll();
				toolbar.get('spinner').hide();
			});
		}
	}
});

module.exports = Attachments;

},{}],32:[function(require,module,exports){
/**
 * wp.media.view.AttachmentsBrowser
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 *
 * @param {object}         [options]               The options hash passed to the view.
 * @param {boolean|string} [options.filters=false] Which filters to show in the browser's toolbar.
 *                                                 Accepts 'uploaded' and 'all'.
 * @param {boolean}        [options.search=true]   Whether to show the search interface in the
 *                                                 browser's toolbar.
 * @param {boolean}        [options.date=true]     Whether to show the date filter in the
 *                                                 browser's toolbar.
 * @param {boolean}        [options.display=false] Whether to show the attachments display settings
 *                                                 view in the sidebar.
 * @param {boolean|string} [options.sidebar=true]  Whether to create a sidebar for the browser.
 *                                                 Accepts true, false, and 'errors'.
 */
var View = wp.media.View,
	mediaTrash = wp.media.view.settings.mediaTrash,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	AttachmentsBrowser;

AttachmentsBrowser = View.extend({
	tagName:   'div',
	className: 'attachments-browser',

	initialize: function() {
		_.defaults( this.options, {
			filters: false,
			search:  true,
			date:    true,
			display: false,
			sidebar: true,
			AttachmentView: wp.media.view.Attachment.Library
		});

		this.controller.on( 'toggle:upload:attachment', this.toggleUploader, this );
		this.controller.on( 'edit:selection', this.editSelection );
		this.createToolbar();
		this.createUploader();
		this.createAttachments();
		if ( this.options.sidebar ) {
			this.createSidebar();
		}
		this.updateContent();

		if ( ! this.options.sidebar || 'errors' === this.options.sidebar ) {
			this.$el.addClass( 'hide-sidebar' );

			if ( 'errors' === this.options.sidebar ) {
				this.$el.addClass( 'sidebar-for-errors' );
			}
		}

		this.collection.on( 'add remove reset', this.updateContent, this );
	},

	editSelection: function( modal ) {
		modal.$( '.media-button-backToLibrary' ).focus();
	},

	/**
	 * @returns {wp.media.view.AttachmentsBrowser} Returns itself to allow chaining
	 */
	dispose: function() {
		this.options.selection.off( null, null, this );
		View.prototype.dispose.apply( this, arguments );
		return this;
	},

	createToolbar: function() {
		var LibraryViewSwitcher, Filters, toolbarOptions;

		toolbarOptions = {
			controller: this.controller
		};

		if ( this.controller.isModeActive( 'grid' ) ) {
			toolbarOptions.className = 'media-toolbar wp-filter';
		}

		/**
		* @member {wp.media.view.Toolbar}
		*/
		this.toolbar = new wp.media.view.Toolbar( toolbarOptions );

		this.views.add( this.toolbar );

		this.toolbar.set( 'spinner', new wp.media.view.Spinner({
			priority: -60
		}) );

		if ( -1 !== $.inArray( this.options.filters, [ 'uploaded', 'all' ] ) ) {
			// "Filters" will return a <select>, need to render
			// screen reader text before
			this.toolbar.set( 'filtersLabel', new wp.media.view.Label({
				value: l10n.filterByType,
				attributes: {
					'for':  'media-attachment-filters'
				},
				priority:   -80
			}).render() );

			if ( 'uploaded' === this.options.filters ) {
				this.toolbar.set( 'filters', new wp.media.view.AttachmentFilters.Uploaded({
					controller: this.controller,
					model:      this.collection.props,
					priority:   -80
				}).render() );
			} else {
				Filters = new wp.media.view.AttachmentFilters.All({
					controller: this.controller,
					model:      this.collection.props,
					priority:   -80
				});

				this.toolbar.set( 'filters', Filters.render() );
			}
		}

		// Feels odd to bring the global media library switcher into the Attachment
		// browser view. Is this a use case for doAction( 'add:toolbar-items:attachments-browser', this.toolbar );
		// which the controller can tap into and add this view?
		if ( this.controller.isModeActive( 'grid' ) ) {
			LibraryViewSwitcher = View.extend({
				className: 'view-switch media-grid-view-switch',
				template: wp.template( 'media-library-view-switcher')
			});

			this.toolbar.set( 'libraryViewSwitcher', new LibraryViewSwitcher({
				controller: this.controller,
				priority: -90
			}).render() );

			// DateFilter is a <select>, screen reader text needs to be rendered before
			this.toolbar.set( 'dateFilterLabel', new wp.media.view.Label({
				value: l10n.filterByDate,
				attributes: {
					'for': 'media-attachment-date-filters'
				},
				priority: -75
			}).render() );
			this.toolbar.set( 'dateFilter', new wp.media.view.DateFilter({
				controller: this.controller,
				model:      this.collection.props,
				priority: -75
			}).render() );

			// BulkSelection is a <div> with subviews, including screen reader text
			this.toolbar.set( 'selectModeToggleButton', new wp.media.view.SelectModeToggleButton({
				text: l10n.bulkSelect,
				controller: this.controller,
				priority: -70
			}).render() );

			this.toolbar.set( 'deleteSelectedButton', new wp.media.view.DeleteSelectedButton({
				filters: Filters,
				style: 'primary',
				disabled: true,
				text: mediaTrash ? l10n.trashSelected : l10n.deleteSelected,
				controller: this.controller,
				priority: -60,
				click: function() {
					var changed = [], removed = [],
						selection = this.controller.state().get( 'selection' ),
						library = this.controller.state().get( 'library' );

					if ( ! selection.length ) {
						return;
					}

					if ( ! mediaTrash && ! window.confirm( l10n.warnBulkDelete ) ) {
						return;
					}

					if ( mediaTrash &&
						'trash' !== selection.at( 0 ).get( 'status' ) &&
						! window.confirm( l10n.warnBulkTrash ) ) {

						return;
					}

					selection.each( function( model ) {
						if ( ! model.get( 'nonces' )['delete'] ) {
							removed.push( model );
							return;
						}

						if ( mediaTrash && 'trash' === model.get( 'status' ) ) {
							model.set( 'status', 'inherit' );
							changed.push( model.save() );
							removed.push( model );
						} else if ( mediaTrash ) {
							model.set( 'status', 'trash' );
							changed.push( model.save() );
							removed.push( model );
						} else {
							model.destroy({wait: true});
						}
					} );

					if ( changed.length ) {
						selection.remove( removed );

						$.when.apply( null, changed ).then( _.bind( function() {
							library._requery( true );
							this.controller.trigger( 'selection:action:done' );
						}, this ) );
					} else {
						this.controller.trigger( 'selection:action:done' );
					}
				}
			}).render() );

			if ( mediaTrash ) {
				this.toolbar.set( 'deleteSelectedPermanentlyButton', new wp.media.view.DeleteSelectedPermanentlyButton({
					filters: Filters,
					style: 'primary',
					disabled: true,
					text: l10n.deleteSelected,
					controller: this.controller,
					priority: -55,
					click: function() {
						var removed = [], selection = this.controller.state().get( 'selection' );

						if ( ! selection.length || ! window.confirm( l10n.warnBulkDelete ) ) {
							return;
						}

						selection.each( function( model ) {
							if ( ! model.get( 'nonces' )['delete'] ) {
								removed.push( model );
								return;
							}

							model.destroy();
						} );

						selection.remove( removed );
						this.controller.trigger( 'selection:action:done' );
					}
				}).render() );
			}

		} else if ( this.options.date ) {
			// DateFilter is a <select>, screen reader text needs to be rendered before
			this.toolbar.set( 'dateFilterLabel', new wp.media.view.Label({
				value: l10n.filterByDate,
				attributes: {
					'for': 'media-attachment-date-filters'
				},
				priority: -75
			}).render() );
			this.toolbar.set( 'dateFilter', new wp.media.view.DateFilter({
				controller: this.controller,
				model:      this.collection.props,
				priority: -75
			}).render() );
		}

		if ( this.options.search ) {
			// Search is an input, screen reader text needs to be rendered before
			this.toolbar.set( 'searchLabel', new wp.media.view.Label({
				value: l10n.searchMediaLabel,
				attributes: {
					'for': 'media-search-input'
				},
				priority:   60
			}).render() );
			this.toolbar.set( 'search', new wp.media.view.Search({
				controller: this.controller,
				model:      this.collection.props,
				priority:   60
			}).render() );
		}

		if ( this.options.dragInfo ) {
			this.toolbar.set( 'dragInfo', new View({
				el: $( '<div class="instructions">' + l10n.dragInfo + '</div>' )[0],
				priority: -40
			}) );
		}

		if ( this.options.suggestedWidth && this.options.suggestedHeight ) {
			this.toolbar.set( 'suggestedDimensions', new View({
				el: $( '<div class="instructions">' + l10n.suggestedDimensions + ' ' + this.options.suggestedWidth + ' &times; ' + this.options.suggestedHeight + '</div>' )[0],
				priority: -40
			}) );
		}
	},

	updateContent: function() {
		var view = this,
			noItemsView;

		if ( this.controller.isModeActive( 'grid' ) ) {
			noItemsView = view.attachmentsNoResults;
		} else {
			noItemsView = view.uploader;
		}

		if ( ! this.collection.length ) {
			this.toolbar.get( 'spinner' ).show();
			this.dfd = this.collection.more().done( function() {
				if ( ! view.collection.length ) {
					noItemsView.$el.removeClass( 'hidden' );
				} else {
					noItemsView.$el.addClass( 'hidden' );
				}
				view.toolbar.get( 'spinner' ).hide();
			} );
		} else {
			noItemsView.$el.addClass( 'hidden' );
			view.toolbar.get( 'spinner' ).hide();
		}
	},

	createUploader: function() {
		this.uploader = new wp.media.view.UploaderInline({
			controller: this.controller,
			status:     false,
			message:    this.controller.isModeActive( 'grid' ) ? '' : l10n.noItemsFound,
			canClose:   this.controller.isModeActive( 'grid' )
		});

		this.uploader.hide();
		this.views.add( this.uploader );
	},

	toggleUploader: function() {
		if ( this.uploader.$el.hasClass( 'hidden' ) ) {
			this.uploader.show();
		} else {
			this.uploader.hide();
		}
	},

	createAttachments: function() {
		this.attachments = new wp.media.view.Attachments({
			controller:           this.controller,
			collection:           this.collection,
			selection:            this.options.selection,
			model:                this.model,
			sortable:             this.options.sortable,
			scrollElement:        this.options.scrollElement,
			idealColumnWidth:     this.options.idealColumnWidth,

			// The single `Attachment` view to be used in the `Attachments` view.
			AttachmentView: this.options.AttachmentView
		});

		// Add keydown listener to the instance of the Attachments view
		this.controller.on( 'attachment:keydown:arrow',     _.bind( this.attachments.arrowEvent, this.attachments ) );
		this.controller.on( 'attachment:details:shift-tab', _.bind( this.attachments.restoreFocus, this.attachments ) );

		this.views.add( this.attachments );


		if ( this.controller.isModeActive( 'grid' ) ) {
			this.attachmentsNoResults = new View({
				controller: this.controller,
				tagName: 'p'
			});

			this.attachmentsNoResults.$el.addClass( 'hidden no-media' );
			this.attachmentsNoResults.$el.html( l10n.noMedia );

			this.views.add( this.attachmentsNoResults );
		}
	},

	createSidebar: function() {
		var options = this.options,
			selection = options.selection,
			sidebar = this.sidebar = new wp.media.view.Sidebar({
				controller: this.controller
			});

		this.views.add( sidebar );

		if ( this.controller.uploader ) {
			sidebar.set( 'uploads', new wp.media.view.UploaderStatus({
				controller: this.controller,
				priority:   40
			}) );
		}

		selection.on( 'selection:single', this.createSingle, this );
		selection.on( 'selection:unsingle', this.disposeSingle, this );

		if ( selection.single() ) {
			this.createSingle();
		}
	},

	createSingle: function() {
		var sidebar = this.sidebar,
			single = this.options.selection.single();

		sidebar.set( 'details', new wp.media.view.Attachment.Details({
			controller: this.controller,
			model:      single,
			priority:   80
		}) );

		sidebar.set( 'compat', new wp.media.view.AttachmentCompat({
			controller: this.controller,
			model:      single,
			priority:   120
		}) );

		if ( this.options.display ) {
			sidebar.set( 'display', new wp.media.view.Settings.AttachmentDisplay({
				controller:   this.controller,
				model:        this.model.display( single ),
				attachment:   single,
				priority:     160,
				userSettings: this.model.get('displayUserSettings')
			}) );
		}

		// Show the sidebar on mobile
		if ( this.model.id === 'insert' ) {
			sidebar.$el.addClass( 'visible' );
		}
	},

	disposeSingle: function() {
		var sidebar = this.sidebar;
		sidebar.unset('details');
		sidebar.unset('compat');
		sidebar.unset('display');
		// Hide the sidebar on mobile
		sidebar.$el.removeClass( 'visible' );
	}
});

module.exports = AttachmentsBrowser;

},{}],33:[function(require,module,exports){
/**
 * wp.media.view.Attachments.Selection
 *
 * @class
 * @augments wp.media.view.Attachments
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Attachments = wp.media.view.Attachments,
	Selection;

Selection = Attachments.extend({
	events: {},
	initialize: function() {
		_.defaults( this.options, {
			sortable:   false,
			resize:     false,

			// The single `Attachment` view to be used in the `Attachments` view.
			AttachmentView: wp.media.view.Attachment.Selection
		});
		// Call 'initialize' directly on the parent class.
		return Attachments.prototype.initialize.apply( this, arguments );
	}
});

module.exports = Selection;

},{}],34:[function(require,module,exports){
/**
 * wp.media.view.ButtonGroup
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var $ = Backbone.$,
	ButtonGroup;

ButtonGroup = wp.media.View.extend({
	tagName:   'div',
	className: 'button-group button-large media-button-group',

	initialize: function() {
		/**
		 * @member {wp.media.view.Button[]}
		 */
		this.buttons = _.map( this.options.buttons || [], function( button ) {
			if ( button instanceof Backbone.View ) {
				return button;
			} else {
				return new wp.media.view.Button( button ).render();
			}
		});

		delete this.options.buttons;

		if ( this.options.classes ) {
			this.$el.addClass( this.options.classes );
		}
	},

	/**
	 * @returns {wp.media.view.ButtonGroup}
	 */
	render: function() {
		this.$el.html( $( _.pluck( this.buttons, 'el' ) ).detach() );
		return this;
	}
});

module.exports = ButtonGroup;

},{}],35:[function(require,module,exports){
/**
 * wp.media.view.Button
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Button = wp.media.View.extend({
	tagName:    'button',
	className:  'media-button',
	attributes: { type: 'button' },

	events: {
		'click': 'click'
	},

	defaults: {
		text:     '',
		style:    '',
		size:     'large',
		disabled: false
	},

	initialize: function() {
		/**
		 * Create a model with the provided `defaults`.
		 *
		 * @member {Backbone.Model}
		 */
		this.model = new Backbone.Model( this.defaults );

		// If any of the `options` have a key from `defaults`, apply its
		// value to the `model` and remove it from the `options object.
		_.each( this.defaults, function( def, key ) {
			var value = this.options[ key ];
			if ( _.isUndefined( value ) ) {
				return;
			}

			this.model.set( key, value );
			delete this.options[ key ];
		}, this );

		this.listenTo( this.model, 'change', this.render );
	},
	/**
	 * @returns {wp.media.view.Button} Returns itself to allow chaining
	 */
	render: function() {
		var classes = [ 'button', this.className ],
			model = this.model.toJSON();

		if ( model.style ) {
			classes.push( 'button-' + model.style );
		}

		if ( model.size ) {
			classes.push( 'button-' + model.size );
		}

		classes = _.uniq( classes.concat( this.options.classes ) );
		this.el.className = classes.join(' ');

		this.$el.attr( 'disabled', model.disabled );
		this.$el.text( this.model.get('text') );

		return this;
	},
	/**
	 * @param {Object} event
	 */
	click: function( event ) {
		if ( '#' === this.attributes.href ) {
			event.preventDefault();
		}

		if ( this.options.click && ! this.model.get('disabled') ) {
			this.options.click.apply( this, arguments );
		}
	}
});

module.exports = Button;

},{}],36:[function(require,module,exports){
/**
 * wp.media.view.Cropper
 *
 * Uses the imgAreaSelect plugin to allow a user to crop an image.
 *
 * Takes imgAreaSelect options from
 * wp.customize.HeaderControl.calculateImageSelectOptions via
 * wp.customize.HeaderControl.openMM.
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	UploaderStatus = wp.media.view.UploaderStatus,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	Cropper;

Cropper = View.extend({
	className: 'crop-content',
	template: wp.template('crop-content'),
	initialize: function() {
		_.bindAll(this, 'onImageLoad');
	},
	ready: function() {
		this.controller.frame.on('content:error:crop', this.onError, this);
		this.$image = this.$el.find('.crop-image');
		this.$image.on('load', this.onImageLoad);
		$(window).on('resize.cropper', _.debounce(this.onImageLoad, 250));
	},
	remove: function() {
		$(window).off('resize.cropper');
		this.$el.remove();
		this.$el.off();
		View.prototype.remove.apply(this, arguments);
	},
	prepare: function() {
		return {
			title: l10n.cropYourImage,
			url: this.options.attachment.get('url')
		};
	},
	onImageLoad: function() {
		var imgOptions = this.controller.get('imgSelectOptions');
		if (typeof imgOptions === 'function') {
			imgOptions = imgOptions(this.options.attachment, this.controller);
		}

		imgOptions = _.extend(imgOptions, {parent: this.$el});
		this.trigger('image-loaded');
		this.controller.imgSelect = this.$image.imgAreaSelect(imgOptions);
	},
	onError: function() {
		var filename = this.options.attachment.get('filename');

		this.views.add( '.upload-errors', new wp.media.view.UploaderStatusError({
			filename: UploaderStatus.prototype.filename(filename),
			message: window._wpMediaViewsL10n.cropError
		}), { at: 0 });
	}
});

module.exports = Cropper;

},{}],37:[function(require,module,exports){
/**
 * wp.media.view.EditImage
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	EditImage;

EditImage = View.extend({
	className: 'image-editor',
	template: wp.template('image-editor'),

	initialize: function( options ) {
		this.editor = window.imageEdit;
		this.controller = options.controller;
		View.prototype.initialize.apply( this, arguments );
	},

	prepare: function() {
		return this.model.toJSON();
	},

	loadEditor: function() {
		var dfd = this.editor.open( this.model.get('id'), this.model.get('nonces').edit, this );
		dfd.done( _.bind( this.focus, this ) );
	},

	focus: function() {
		this.$( '.imgedit-submit .button' ).eq( 0 ).focus();
	},

	back: function() {
		var lastState = this.controller.lastState();
		this.controller.setState( lastState );
	},

	refresh: function() {
		this.model.fetch();
	},

	save: function() {
		var lastState = this.controller.lastState();

		this.model.fetch().done( _.bind( function() {
			this.controller.setState( lastState );
		}, this ) );
	}

});

module.exports = EditImage;

},{}],38:[function(require,module,exports){
/**
 * wp.media.view.Embed
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Embed = wp.media.View.extend({
	className: 'media-embed',

	initialize: function() {
		/**
		 * @member {wp.media.view.EmbedUrl}
		 */
		this.url = new wp.media.view.EmbedUrl({
			controller: this.controller,
			model:      this.model.props
		}).render();

		this.views.set([ this.url ]);
		this.refresh();
		this.listenTo( this.model, 'change:type', this.refresh );
		this.listenTo( this.model, 'change:loading', this.loading );
	},

	/**
	 * @param {Object} view
	 */
	settings: function( view ) {
		if ( this._settings ) {
			this._settings.remove();
		}
		this._settings = view;
		this.views.add( view );
	},

	refresh: function() {
		var type = this.model.get('type'),
			constructor;

		if ( 'image' === type ) {
			constructor = wp.media.view.EmbedImage;
		} else if ( 'link' === type ) {
			constructor = wp.media.view.EmbedLink;
		} else {
			return;
		}

		this.settings( new constructor({
			controller: this.controller,
			model:      this.model.props,
			priority:   40
		}) );
	},

	loading: function() {
		this.$el.toggleClass( 'embed-loading', this.model.get('loading') );
	}
});

module.exports = Embed;

},{}],39:[function(require,module,exports){
/**
 * wp.media.view.EmbedImage
 *
 * @class
 * @augments wp.media.view.Settings.AttachmentDisplay
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var AttachmentDisplay = wp.media.view.Settings.AttachmentDisplay,
	EmbedImage;

EmbedImage = AttachmentDisplay.extend({
	className: 'embed-media-settings',
	template:  wp.template('embed-image-settings'),

	initialize: function() {
		/**
		 * Call `initialize` directly on parent class with passed arguments
		 */
		AttachmentDisplay.prototype.initialize.apply( this, arguments );
		this.listenTo( this.model, 'change:url', this.updateImage );
	},

	updateImage: function() {
		this.$('img').attr( 'src', this.model.get('url') );
	}
});

module.exports = EmbedImage;

},{}],40:[function(require,module,exports){
/**
 * wp.media.view.EmbedLink
 *
 * @class
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var $ = jQuery,
	EmbedLink;

EmbedLink = wp.media.view.Settings.extend({
	className: 'embed-link-settings',
	template:  wp.template('embed-link-settings'),

	initialize: function() {
		this.listenTo( this.model, 'change:url', this.updateoEmbed );
	},

	updateoEmbed: _.debounce( function() {
		var url = this.model.get( 'url' );

		// clear out previous results
		this.$('.embed-container').hide().find('.embed-preview').empty();
		this.$( '.setting' ).hide();

		// only proceed with embed if the field contains more than 11 characters
		// Example: http://a.io is 11 chars
		if ( url && ( url.length < 11 || ! url.match(/^http(s)?:\/\//) ) ) {
			return;
		}

		this.fetch();
	}, wp.media.controller.Embed.sensitivity ),

	fetch: function() {
		var embed;

		// check if they haven't typed in 500 ms
		if ( $('#embed-url-field').val() !== this.model.get('url') ) {
			return;
		}

		if ( this.dfd && 'pending' === this.dfd.state() ) {
			this.dfd.abort();
		}

		embed = new wp.shortcode({
			tag: 'embed',
			attrs: _.pick( this.model.attributes, [ 'width', 'height', 'src' ] ),
			content: this.model.get('url')
		});

		this.dfd = $.ajax({
			type:    'POST',
			url:     wp.ajax.settings.url,
			context: this,
			data:    {
				action: 'parse-embed',
				post_ID: wp.media.view.settings.post.id,
				shortcode: embed.string()
			}
		})
			.done( this.renderoEmbed )
			.fail( this.renderFail );
	},

	renderFail: function ( response, status ) {
		if ( 'abort' === status ) {
			return;
		}
		this.$( '.link-text' ).show();
	},

	renderoEmbed: function( response ) {
		var html = ( response && response.data && response.data.body ) || '';

		if ( html ) {
			this.$('.embed-container').show().find('.embed-preview').html( html );
		} else {
			this.renderFail();
		}
	}
});

module.exports = EmbedLink;

},{}],41:[function(require,module,exports){
/**
 * wp.media.view.EmbedUrl
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	$ = jQuery,
	EmbedUrl;

EmbedUrl = View.extend({
	tagName:   'label',
	className: 'embed-url',

	events: {
		'input':  'url',
		'keyup':  'url',
		'change': 'url'
	},

	initialize: function() {
		this.$input = $('<input id="embed-url-field" type="url" />').val( this.model.get('url') );
		this.input = this.$input[0];

		this.spinner = $('<span class="spinner" />')[0];
		this.$el.append([ this.input, this.spinner ]);

		this.listenTo( this.model, 'change:url', this.render );

		if ( this.model.get( 'url' ) ) {
			_.delay( _.bind( function () {
				this.model.trigger( 'change:url' );
			}, this ), 500 );
		}
	},
	/**
	 * @returns {wp.media.view.EmbedUrl} Returns itself to allow chaining
	 */
	render: function() {
		var $input = this.$input;

		if ( $input.is(':focus') ) {
			return;
		}

		this.input.value = this.model.get('url') || 'http://';
		/**
		 * Call `render` directly on parent class with passed arguments
		 */
		View.prototype.render.apply( this, arguments );
		return this;
	},

	ready: function() {
		if ( ! wp.media.isTouchDevice ) {
			this.focus();
		}
	},

	url: function( event ) {
		this.model.set( 'url', event.target.value );
	},

	/**
	 * If the input is visible, focus and select its contents.
	 */
	focus: function() {
		var $input = this.$input;
		if ( $input.is(':visible') ) {
			$input.focus()[0].select();
		}
	}
});

module.exports = EmbedUrl;

},{}],42:[function(require,module,exports){
/**
 * wp.media.view.FocusManager
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var FocusManager = wp.media.View.extend({

	events: {
		'keydown': 'constrainTabbing'
	},

	focus: function() { // Reset focus on first left menu item
		this.$('.media-menu-item').first().focus();
	},
	/**
	 * @param {Object} event
	 */
	constrainTabbing: function( event ) {
		var tabbables;

		// Look for the tab key.
		if ( 9 !== event.keyCode ) {
			return;
		}

		// Skip the file input added by Plupload.
		tabbables = this.$( ':tabbable' ).not( '.moxie-shim input[type="file"]' );

		// Keep tab focus within media modal while it's open
		if ( tabbables.last()[0] === event.target && ! event.shiftKey ) {
			tabbables.first().focus();
			return false;
		} else if ( tabbables.first()[0] === event.target && event.shiftKey ) {
			tabbables.last().focus();
			return false;
		}
	}

});

module.exports = FocusManager;

},{}],43:[function(require,module,exports){
/**
 * wp.media.view.Frame
 *
 * A frame is a composite view consisting of one or more regions and one or more
 * states.
 *
 * @see wp.media.controller.State
 * @see wp.media.controller.Region
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
var Frame = wp.media.View.extend({
	initialize: function() {
		_.defaults( this.options, {
			mode: [ 'select' ]
		});
		this._createRegions();
		this._createStates();
		this._createModes();
	},

	_createRegions: function() {
		// Clone the regions array.
		this.regions = this.regions ? this.regions.slice() : [];

		// Initialize regions.
		_.each( this.regions, function( region ) {
			this[ region ] = new wp.media.controller.Region({
				view:     this,
				id:       region,
				selector: '.media-frame-' + region
			});
		}, this );
	},
	/**
	 * Create the frame's states.
	 *
	 * @see wp.media.controller.State
	 * @see wp.media.controller.StateMachine
	 *
	 * @fires wp.media.controller.State#ready
	 */
	_createStates: function() {
		// Create the default `states` collection.
		this.states = new Backbone.Collection( null, {
			model: wp.media.controller.State
		});

		// Ensure states have a reference to the frame.
		this.states.on( 'add', function( model ) {
			model.frame = this;
			model.trigger('ready');
		}, this );

		if ( this.options.states ) {
			this.states.add( this.options.states );
		}
	},

	/**
	 * A frame can be in a mode or multiple modes at one time.
	 *
	 * For example, the manage media frame can be in the `Bulk Select` or `Edit` mode.
	 */
	_createModes: function() {
		// Store active "modes" that the frame is in. Unrelated to region modes.
		this.activeModes = new Backbone.Collection();
		this.activeModes.on( 'add remove reset', _.bind( this.triggerModeEvents, this ) );

		_.each( this.options.mode, function( mode ) {
			this.activateMode( mode );
		}, this );
	},
	/**
	 * Reset all states on the frame to their defaults.
	 *
	 * @returns {wp.media.view.Frame} Returns itself to allow chaining
	 */
	reset: function() {
		this.states.invoke( 'trigger', 'reset' );
		return this;
	},
	/**
	 * Map activeMode collection events to the frame.
	 */
	triggerModeEvents: function( model, collection, options ) {
		var collectionEvent,
			modeEventMap = {
				add: 'activate',
				remove: 'deactivate'
			},
			eventToTrigger;
		// Probably a better way to do this.
		_.each( options, function( value, key ) {
			if ( value ) {
				collectionEvent = key;
			}
		} );

		if ( ! _.has( modeEventMap, collectionEvent ) ) {
			return;
		}

		eventToTrigger = model.get('id') + ':' + modeEventMap[collectionEvent];
		this.trigger( eventToTrigger );
	},
	/**
	 * Activate a mode on the frame.
	 *
	 * @param string mode Mode ID.
	 * @returns {this} Returns itself to allow chaining.
	 */
	activateMode: function( mode ) {
		// Bail if the mode is already active.
		if ( this.isModeActive( mode ) ) {
			return;
		}
		this.activeModes.add( [ { id: mode } ] );
		// Add a CSS class to the frame so elements can be styled for the mode.
		this.$el.addClass( 'mode-' + mode );

		return this;
	},
	/**
	 * Deactivate a mode on the frame.
	 *
	 * @param string mode Mode ID.
	 * @returns {this} Returns itself to allow chaining.
	 */
	deactivateMode: function( mode ) {
		// Bail if the mode isn't active.
		if ( ! this.isModeActive( mode ) ) {
			return this;
		}
		this.activeModes.remove( this.activeModes.where( { id: mode } ) );
		this.$el.removeClass( 'mode-' + mode );
		/**
		 * Frame mode deactivation event.
		 *
		 * @event this#{mode}:deactivate
		 */
		this.trigger( mode + ':deactivate' );

		return this;
	},
	/**
	 * Check if a mode is enabled on the frame.
	 *
	 * @param  string mode Mode ID.
	 * @return bool
	 */
	isModeActive: function( mode ) {
		return Boolean( this.activeModes.where( { id: mode } ).length );
	}
});

// Make the `Frame` a `StateMachine`.
_.extend( Frame.prototype, wp.media.controller.StateMachine.prototype );

module.exports = Frame;

},{}],44:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.ImageDetails
 *
 * A media frame for manipulating an image that's already been inserted
 * into a post.
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
	ImageDetails;

ImageDetails = Select.extend({
	defaults: {
		id:      'image',
		url:     '',
		menu:    'image-details',
		content: 'image-details',
		toolbar: 'image-details',
		type:    'link',
		title:    l10n.imageDetailsTitle,
		priority: 120
	},

	initialize: function( options ) {
		this.image = new wp.media.model.PostImage( options.metadata );
		this.options.selection = new wp.media.model.Selection( this.image.attachment, { multiple: false } );
		Select.prototype.initialize.apply( this, arguments );
	},

	bindHandlers: function() {
		Select.prototype.bindHandlers.apply( this, arguments );
		this.on( 'menu:create:image-details', this.createMenu, this );
		this.on( 'content:create:image-details', this.imageDetailsContent, this );
		this.on( 'content:render:edit-image', this.editImageContent, this );
		this.on( 'toolbar:render:image-details', this.renderImageDetailsToolbar, this );
		// override the select toolbar
		this.on( 'toolbar:render:replace', this.renderReplaceImageToolbar, this );
	},

	createStates: function() {
		this.states.add([
			new wp.media.controller.ImageDetails({
				image: this.image,
				editable: false
			}),
			new wp.media.controller.ReplaceImage({
				id: 'replace-image',
				library: wp.media.query( { type: 'image' } ),
				image: this.image,
				multiple:  false,
				title:     l10n.imageReplaceTitle,
				toolbar: 'replace',
				priority:  80,
				displaySettings: true
			}),
			new wp.media.controller.EditImage( {
				image: this.image,
				selection: this.options.selection
			} )
		]);
	},

	imageDetailsContent: function( options ) {
		options.view = new wp.media.view.ImageDetails({
			controller: this,
			model: this.state().image,
			attachment: this.state().image.attachment
		});
	},

	editImageContent: function() {
		var state = this.state(),
			model = state.get('image'),
			view;

		if ( ! model ) {
			return;
		}

		view = new wp.media.view.EditImage( { model: model, controller: this } ).render();

		this.content.set( view );

		// after bringing in the frame, load the actual editor via an ajax call
		view.loadEditor();

	},

	renderImageDetailsToolbar: function() {
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				select: {
					style:    'primary',
					text:     l10n.update,
					priority: 80,

					click: function() {
						var controller = this.controller,
							state = controller.state();

						controller.close();

						// not sure if we want to use wp.media.string.image which will create a shortcode or
						// perhaps wp.html.string to at least to build the <img />
						state.trigger( 'update', controller.image.toJSON() );

						// Restore and reset the default state.
						controller.setState( controller.options.state );
						controller.reset();
					}
				}
			}
		}) );
	},

	renderReplaceImageToolbar: function() {
		var frame = this,
			lastState = frame.lastState(),
			previous = lastState && lastState.id;

		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				back: {
					text:     l10n.back,
					priority: 20,
					click:    function() {
						if ( previous ) {
							frame.setState( previous );
						} else {
							frame.close();
						}
					}
				},

				replace: {
					style:    'primary',
					text:     l10n.replace,
					priority: 80,

					click: function() {
						var controller = this.controller,
							state = controller.state(),
							selection = state.get( 'selection' ),
							attachment = selection.single();

						controller.close();

						controller.image.changeAttachment( attachment, state.display( attachment ) );

						// not sure if we want to use wp.media.string.image which will create a shortcode or
						// perhaps wp.html.string to at least to build the <img />
						state.trigger( 'replace', controller.image.toJSON() );

						// Restore and reset the default state.
						controller.setState( controller.options.state );
						controller.reset();
					}
				}
			}
		}) );
	}

});

module.exports = ImageDetails;

},{}],45:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.Post
 *
 * The frame for manipulating media on the Edit Post page.
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
	Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	Post;

Post = Select.extend({
	initialize: function() {
		this.counts = {
			audio: {
				count: wp.media.view.settings.attachmentCounts.audio,
				state: 'playlist'
			},
			video: {
				count: wp.media.view.settings.attachmentCounts.video,
				state: 'video-playlist'
			}
		};

		_.defaults( this.options, {
			multiple:  true,
			editing:   false,
			state:    'insert',
			metadata:  {}
		});

		// Call 'initialize' directly on the parent class.
		Select.prototype.initialize.apply( this, arguments );
		this.createIframeStates();

	},

	/**
	 * Create the default states.
	 */
	createStates: function() {
		var options = this.options;

		this.states.add([
			// Main states.
			new Library({
				id:         'insert',
				title:      l10n.insertMediaTitle,
				priority:   20,
				toolbar:    'main-insert',
				filterable: 'all',
				library:    wp.media.query( options.library ),
				multiple:   options.multiple ? 'reset' : false,
				editable:   true,

				// If the user isn't allowed to edit fields,
				// can they still edit it locally?
				allowLocalEdits: true,

				// Show the attachment display settings.
				displaySettings: true,
				// Update user settings when users adjust the
				// attachment display settings.
				displayUserSettings: true
			}),

			new Library({
				id:         'gallery',
				title:      l10n.createGalleryTitle,
				priority:   40,
				toolbar:    'main-gallery',
				filterable: 'uploaded',
				multiple:   'add',
				editable:   false,

				library:  wp.media.query( _.defaults({
					type: 'image'
				}, options.library ) )
			}),

			// Embed states.
			new wp.media.controller.Embed( { metadata: options.metadata } ),

			new wp.media.controller.EditImage( { model: options.editImage } ),

			// Gallery states.
			new wp.media.controller.GalleryEdit({
				library: options.selection,
				editing: options.editing,
				menu:    'gallery'
			}),

			new wp.media.controller.GalleryAdd(),

			new Library({
				id:         'playlist',
				title:      l10n.createPlaylistTitle,
				priority:   60,
				toolbar:    'main-playlist',
				filterable: 'uploaded',
				multiple:   'add',
				editable:   false,

				library:  wp.media.query( _.defaults({
					type: 'audio'
				}, options.library ) )
			}),

			// Playlist states.
			new wp.media.controller.CollectionEdit({
				type: 'audio',
				collectionType: 'playlist',
				title:          l10n.editPlaylistTitle,
				SettingsView:   wp.media.view.Settings.Playlist,
				library:        options.selection,
				editing:        options.editing,
				menu:           'playlist',
				dragInfoText:   l10n.playlistDragInfo,
				dragInfo:       false
			}),

			new wp.media.controller.CollectionAdd({
				type: 'audio',
				collectionType: 'playlist',
				title: l10n.addToPlaylistTitle
			}),

			new Library({
				id:         'video-playlist',
				title:      l10n.createVideoPlaylistTitle,
				priority:   60,
				toolbar:    'main-video-playlist',
				filterable: 'uploaded',
				multiple:   'add',
				editable:   false,

				library:  wp.media.query( _.defaults({
					type: 'video'
				}, options.library ) )
			}),

			new wp.media.controller.CollectionEdit({
				type: 'video',
				collectionType: 'playlist',
				title:          l10n.editVideoPlaylistTitle,
				SettingsView:   wp.media.view.Settings.Playlist,
				library:        options.selection,
				editing:        options.editing,
				menu:           'video-playlist',
				dragInfoText:   l10n.videoPlaylistDragInfo,
				dragInfo:       false
			}),

			new wp.media.controller.CollectionAdd({
				type: 'video',
				collectionType: 'playlist',
				title: l10n.addToVideoPlaylistTitle
			})
		]);

		if ( wp.media.view.settings.post.featuredImageId ) {
			this.states.add( new wp.media.controller.FeaturedImage() );
		}
	},

	bindHandlers: function() {
		var handlers, checkCounts;

		Select.prototype.bindHandlers.apply( this, arguments );

		this.on( 'activate', this.activate, this );

		// Only bother checking media type counts if one of the counts is zero
		checkCounts = _.find( this.counts, function( type ) {
			return type.count === 0;
		} );

		if ( typeof checkCounts !== 'undefined' ) {
			this.listenTo( wp.media.model.Attachments.all, 'change:type', this.mediaTypeCounts );
		}

		this.on( 'menu:create:gallery', this.createMenu, this );
		this.on( 'menu:create:playlist', this.createMenu, this );
		this.on( 'menu:create:video-playlist', this.createMenu, this );
		this.on( 'toolbar:create:main-insert', this.createToolbar, this );
		this.on( 'toolbar:create:main-gallery', this.createToolbar, this );
		this.on( 'toolbar:create:main-playlist', this.createToolbar, this );
		this.on( 'toolbar:create:main-video-playlist', this.createToolbar, this );
		this.on( 'toolbar:create:featured-image', this.featuredImageToolbar, this );
		this.on( 'toolbar:create:main-embed', this.mainEmbedToolbar, this );

		handlers = {
			menu: {
				'default': 'mainMenu',
				'gallery': 'galleryMenu',
				'playlist': 'playlistMenu',
				'video-playlist': 'videoPlaylistMenu'
			},

			content: {
				'embed':          'embedContent',
				'edit-image':     'editImageContent',
				'edit-selection': 'editSelectionContent'
			},

			toolbar: {
				'main-insert':      'mainInsertToolbar',
				'main-gallery':     'mainGalleryToolbar',
				'gallery-edit':     'galleryEditToolbar',
				'gallery-add':      'galleryAddToolbar',
				'main-playlist':	'mainPlaylistToolbar',
				'playlist-edit':	'playlistEditToolbar',
				'playlist-add':		'playlistAddToolbar',
				'main-video-playlist': 'mainVideoPlaylistToolbar',
				'video-playlist-edit': 'videoPlaylistEditToolbar',
				'video-playlist-add': 'videoPlaylistAddToolbar'
			}
		};

		_.each( handlers, function( regionHandlers, region ) {
			_.each( regionHandlers, function( callback, handler ) {
				this.on( region + ':render:' + handler, this[ callback ], this );
			}, this );
		}, this );
	},

	activate: function() {
		// Hide menu items for states tied to particular media types if there are no items
		_.each( this.counts, function( type ) {
			if ( type.count < 1 ) {
				this.menuItemVisibility( type.state, 'hide' );
			}
		}, this );
	},

	mediaTypeCounts: function( model, attr ) {
		if ( typeof this.counts[ attr ] !== 'undefined' && this.counts[ attr ].count < 1 ) {
			this.counts[ attr ].count++;
			this.menuItemVisibility( this.counts[ attr ].state, 'show' );
		}
	},

	// Menus
	/**
	 * @param {wp.Backbone.View} view
	 */
	mainMenu: function( view ) {
		view.set({
			'library-separator': new wp.media.View({
				className: 'separator',
				priority: 100
			})
		});
	},

	menuItemVisibility: function( state, visibility ) {
		var menu = this.menu.get();
		if ( visibility === 'hide' ) {
			menu.hide( state );
		} else if ( visibility === 'show' ) {
			menu.show( state );
		}
	},
	/**
	 * @param {wp.Backbone.View} view
	 */
	galleryMenu: function( view ) {
		var lastState = this.lastState(),
			previous = lastState && lastState.id,
			frame = this;

		view.set({
			cancel: {
				text:     l10n.cancelGalleryTitle,
				priority: 20,
				click:    function() {
					if ( previous ) {
						frame.setState( previous );
					} else {
						frame.close();
					}

					// Keep focus inside media modal
					// after canceling a gallery
					this.controller.modal.focusManager.focus();
				}
			},
			separateCancel: new wp.media.View({
				className: 'separator',
				priority: 40
			})
		});
	},

	playlistMenu: function( view ) {
		var lastState = this.lastState(),
			previous = lastState && lastState.id,
			frame = this;

		view.set({
			cancel: {
				text:     l10n.cancelPlaylistTitle,
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

	videoPlaylistMenu: function( view ) {
		var lastState = this.lastState(),
			previous = lastState && lastState.id,
			frame = this;

		view.set({
			cancel: {
				text:     l10n.cancelVideoPlaylistTitle,
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

	// Content
	embedContent: function() {
		var view = new wp.media.view.Embed({
			controller: this,
			model:      this.state()
		}).render();

		this.content.set( view );

		if ( ! wp.media.isTouchDevice ) {
			view.url.focus();
		}
	},

	editSelectionContent: function() {
		var state = this.state(),
			selection = state.get('selection'),
			view;

		view = new wp.media.view.AttachmentsBrowser({
			controller: this,
			collection: selection,
			selection:  selection,
			model:      state,
			sortable:   true,
			search:     false,
			date:       false,
			dragInfo:   true,

			AttachmentView: wp.media.view.Attachments.EditSelection
		}).render();

		view.toolbar.set( 'backToLibrary', {
			text:     l10n.returnToLibrary,
			priority: -100,

			click: function() {
				this.controller.content.mode('browse');
			}
		});

		// Browse our library of attachments.
		this.content.set( view );

		// Trigger the controller to set focus
		this.trigger( 'edit:selection', this );
	},

	editImageContent: function() {
		var image = this.state().get('image'),
			view = new wp.media.view.EditImage( { model: image, controller: this } ).render();

		this.content.set( view );

		// after creating the wrapper view, load the actual editor via an ajax call
		view.loadEditor();

	},

	// Toolbars

	/**
	 * @param {wp.Backbone.View} view
	 */
	selectionStatusToolbar: function( view ) {
		var editable = this.state().get('editable');

		view.set( 'selection', new wp.media.view.Selection({
			controller: this,
			collection: this.state().get('selection'),
			priority:   -40,

			// If the selection is editable, pass the callback to
			// switch the content mode.
			editable: editable && function() {
				this.controller.content.mode('edit-selection');
			}
		}).render() );
	},

	/**
	 * @param {wp.Backbone.View} view
	 */
	mainInsertToolbar: function( view ) {
		var controller = this;

		this.selectionStatusToolbar( view );

		view.set( 'insert', {
			style:    'primary',
			priority: 80,
			text:     l10n.insertIntoPost,
			requires: { selection: true },

			/**
			 * @fires wp.media.controller.State#insert
			 */
			click: function() {
				var state = controller.state(),
					selection = state.get('selection');

				controller.close();
				state.trigger( 'insert', selection ).reset();
			}
		});
	},

	/**
	 * @param {wp.Backbone.View} view
	 */
	mainGalleryToolbar: function( view ) {
		var controller = this;

		this.selectionStatusToolbar( view );

		view.set( 'gallery', {
			style:    'primary',
			text:     l10n.createNewGallery,
			priority: 60,
			requires: { selection: true },

			click: function() {
				var selection = controller.state().get('selection'),
					edit = controller.state('gallery-edit'),
					models = selection.where({ type: 'image' });

				edit.set( 'library', new wp.media.model.Selection( models, {
					props:    selection.props.toJSON(),
					multiple: true
				}) );

				this.controller.setState('gallery-edit');

				// Keep focus inside media modal
				// after jumping to gallery view
				this.controller.modal.focusManager.focus();
			}
		});
	},

	mainPlaylistToolbar: function( view ) {
		var controller = this;

		this.selectionStatusToolbar( view );

		view.set( 'playlist', {
			style:    'primary',
			text:     l10n.createNewPlaylist,
			priority: 100,
			requires: { selection: true },

			click: function() {
				var selection = controller.state().get('selection'),
					edit = controller.state('playlist-edit'),
					models = selection.where({ type: 'audio' });

				edit.set( 'library', new wp.media.model.Selection( models, {
					props:    selection.props.toJSON(),
					multiple: true
				}) );

				this.controller.setState('playlist-edit');

				// Keep focus inside media modal
				// after jumping to playlist view
				this.controller.modal.focusManager.focus();
			}
		});
	},

	mainVideoPlaylistToolbar: function( view ) {
		var controller = this;

		this.selectionStatusToolbar( view );

		view.set( 'video-playlist', {
			style:    'primary',
			text:     l10n.createNewVideoPlaylist,
			priority: 100,
			requires: { selection: true },

			click: function() {
				var selection = controller.state().get('selection'),
					edit = controller.state('video-playlist-edit'),
					models = selection.where({ type: 'video' });

				edit.set( 'library', new wp.media.model.Selection( models, {
					props:    selection.props.toJSON(),
					multiple: true
				}) );

				this.controller.setState('video-playlist-edit');

				// Keep focus inside media modal
				// after jumping to video playlist view
				this.controller.modal.focusManager.focus();
			}
		});
	},

	featuredImageToolbar: function( toolbar ) {
		this.createSelectToolbar( toolbar, {
			text:  l10n.setFeaturedImage,
			state: this.options.state
		});
	},

	mainEmbedToolbar: function( toolbar ) {
		toolbar.view = new wp.media.view.Toolbar.Embed({
			controller: this
		});
	},

	galleryEditToolbar: function() {
		var editing = this.state().get('editing');
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				insert: {
					style:    'primary',
					text:     editing ? l10n.updateGallery : l10n.insertGallery,
					priority: 80,
					requires: { library: true },

					/**
					 * @fires wp.media.controller.State#update
					 */
					click: function() {
						var controller = this.controller,
							state = controller.state();

						controller.close();
						state.trigger( 'update', state.get('library') );

						// Restore and reset the default state.
						controller.setState( controller.options.state );
						controller.reset();
					}
				}
			}
		}) );
	},

	galleryAddToolbar: function() {
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				insert: {
					style:    'primary',
					text:     l10n.addToGallery,
					priority: 80,
					requires: { selection: true },

					/**
					 * @fires wp.media.controller.State#reset
					 */
					click: function() {
						var controller = this.controller,
							state = controller.state(),
							edit = controller.state('gallery-edit');

						edit.get('library').add( state.get('selection').models );
						state.trigger('reset');
						controller.setState('gallery-edit');
					}
				}
			}
		}) );
	},

	playlistEditToolbar: function() {
		var editing = this.state().get('editing');
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				insert: {
					style:    'primary',
					text:     editing ? l10n.updatePlaylist : l10n.insertPlaylist,
					priority: 80,
					requires: { library: true },

					/**
					 * @fires wp.media.controller.State#update
					 */
					click: function() {
						var controller = this.controller,
							state = controller.state();

						controller.close();
						state.trigger( 'update', state.get('library') );

						// Restore and reset the default state.
						controller.setState( controller.options.state );
						controller.reset();
					}
				}
			}
		}) );
	},

	playlistAddToolbar: function() {
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				insert: {
					style:    'primary',
					text:     l10n.addToPlaylist,
					priority: 80,
					requires: { selection: true },

					/**
					 * @fires wp.media.controller.State#reset
					 */
					click: function() {
						var controller = this.controller,
							state = controller.state(),
							edit = controller.state('playlist-edit');

						edit.get('library').add( state.get('selection').models );
						state.trigger('reset');
						controller.setState('playlist-edit');
					}
				}
			}
		}) );
	},

	videoPlaylistEditToolbar: function() {
		var editing = this.state().get('editing');
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				insert: {
					style:    'primary',
					text:     editing ? l10n.updateVideoPlaylist : l10n.insertVideoPlaylist,
					priority: 140,
					requires: { library: true },

					click: function() {
						var controller = this.controller,
							state = controller.state(),
							library = state.get('library');

						library.type = 'video';

						controller.close();
						state.trigger( 'update', library );

						// Restore and reset the default state.
						controller.setState( controller.options.state );
						controller.reset();
					}
				}
			}
		}) );
	},

	videoPlaylistAddToolbar: function() {
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				insert: {
					style:    'primary',
					text:     l10n.addToVideoPlaylist,
					priority: 140,
					requires: { selection: true },

					click: function() {
						var controller = this.controller,
							state = controller.state(),
							edit = controller.state('video-playlist-edit');

						edit.get('library').add( state.get('selection').models );
						state.trigger('reset');
						controller.setState('video-playlist-edit');
					}
				}
			}
		}) );
	}
});

module.exports = Post;

},{}],46:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.Select
 *
 * A frame for selecting an item or items from the media library.
 *
 * @class
 * @augments wp.media.view.MediaFrame
 * @augments wp.media.view.Frame
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */

var MediaFrame = wp.media.view.MediaFrame,
	l10n = wp.media.view.l10n,
	Select;

Select = MediaFrame.extend({
	initialize: function() {
		// Call 'initialize' directly on the parent class.
		MediaFrame.prototype.initialize.apply( this, arguments );

		_.defaults( this.options, {
			selection: [],
			library:   {},
			multiple:  false,
			state:    'library'
		});

		this.createSelection();
		this.createStates();
		this.bindHandlers();
	},

	/**
	 * Attach a selection collection to the frame.
	 *
	 * A selection is a collection of attachments used for a specific purpose
	 * by a media frame. e.g. Selecting an attachment (or many) to insert into
	 * post content.
	 *
	 * @see media.model.Selection
	 */
	createSelection: function() {
		var selection = this.options.selection;

		if ( ! (selection instanceof wp.media.model.Selection) ) {
			this.options.selection = new wp.media.model.Selection( selection, {
				multiple: this.options.multiple
			});
		}

		this._selection = {
			attachments: new wp.media.model.Attachments(),
			difference: []
		};
	},

	/**
	 * Create the default states on the frame.
	 */
	createStates: function() {
		var options = this.options;

		if ( this.options.states ) {
			return;
		}

		// Add the default states.
		this.states.add([
			// Main states.
			new wp.media.controller.Library({
				library:   wp.media.query( options.library ),
				multiple:  options.multiple,
				title:     options.title,
				priority:  20
			})
		]);
	},

	/**
	 * Bind region mode event callbacks.
	 *
	 * @see media.controller.Region.render
	 */
	bindHandlers: function() {
		this.on( 'router:create:browse', this.createRouter, this );
		this.on( 'router:render:browse', this.browseRouter, this );
		this.on( 'content:create:browse', this.browseContent, this );
		this.on( 'content:render:upload', this.uploadContent, this );
		this.on( 'toolbar:create:select', this.createSelectToolbar, this );
	},

	/**
	 * Render callback for the router region in the `browse` mode.
	 *
	 * @param {wp.media.view.Router} routerView
	 */
	browseRouter: function( routerView ) {
		routerView.set({
			upload: {
				text:     l10n.uploadFilesTitle,
				priority: 20
			},
			browse: {
				text:     l10n.mediaLibraryTitle,
				priority: 40
			}
		});
	},

	/**
	 * Render callback for the content region in the `browse` mode.
	 *
	 * @param {wp.media.controller.Region} contentRegion
	 */
	browseContent: function( contentRegion ) {
		var state = this.state();

		this.$el.removeClass('hide-toolbar');

		// Browse our library of attachments.
		contentRegion.view = new wp.media.view.AttachmentsBrowser({
			controller: this,
			collection: state.get('library'),
			selection:  state.get('selection'),
			model:      state,
			sortable:   state.get('sortable'),
			search:     state.get('searchable'),
			filters:    state.get('filterable'),
			date:       state.get('date'),
			display:    state.has('display') ? state.get('display') : state.get('displaySettings'),
			dragInfo:   state.get('dragInfo'),

			idealColumnWidth: state.get('idealColumnWidth'),
			suggestedWidth:   state.get('suggestedWidth'),
			suggestedHeight:  state.get('suggestedHeight'),

			AttachmentView: state.get('AttachmentView')
		});
	},

	/**
	 * Render callback for the content region in the `upload` mode.
	 */
	uploadContent: function() {
		this.$el.removeClass( 'hide-toolbar' );
		this.content.set( new wp.media.view.UploaderInline({
			controller: this
		}) );
	},

	/**
	 * Toolbars
	 *
	 * @param {Object} toolbar
	 * @param {Object} [options={}]
	 * @this wp.media.controller.Region
	 */
	createSelectToolbar: function( toolbar, options ) {
		options = options || this.options.button || {};
		options.controller = this;

		toolbar.view = new wp.media.view.Toolbar.Select( options );
	}
});

module.exports = Select;

},{}],47:[function(require,module,exports){
/**
 * wp.media.view.Iframe
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Iframe = wp.media.View.extend({
	className: 'media-iframe',
	/**
	 * @returns {wp.media.view.Iframe} Returns itself to allow chaining
	 */
	render: function() {
		this.views.detach();
		this.$el.html( '<iframe src="' + this.controller.state().get('src') + '" />' );
		this.views.render();
		return this;
	}
});

module.exports = Iframe;

},{}],48:[function(require,module,exports){
/**
 * wp.media.view.ImageDetails
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
	ImageDetails;

ImageDetails = AttachmentDisplay.extend({
	className: 'image-details',
	template:  wp.template('image-details'),
	events: _.defaults( AttachmentDisplay.prototype.events, {
		'click .edit-attachment': 'editAttachment',
		'click .replace-attachment': 'replaceAttachment',
		'click .advanced-toggle': 'onToggleAdvanced',
		'change [data-setting="customWidth"]': 'onCustomSize',
		'change [data-setting="customHeight"]': 'onCustomSize',
		'keyup [data-setting="customWidth"]': 'onCustomSize',
		'keyup [data-setting="customHeight"]': 'onCustomSize'
	} ),
	initialize: function() {
		// used in AttachmentDisplay.prototype.updateLinkTo
		this.options.attachment = this.model.attachment;
		this.listenTo( this.model, 'change:url', this.updateUrl );
		this.listenTo( this.model, 'change:link', this.toggleLinkSettings );
		this.listenTo( this.model, 'change:size', this.toggleCustomSize );

		AttachmentDisplay.prototype.initialize.apply( this, arguments );
	},

	prepare: function() {
		var attachment = false;

		if ( this.model.attachment ) {
			attachment = this.model.attachment.toJSON();
		}
		return _.defaults({
			model: this.model.toJSON(),
			attachment: attachment
		}, this.options );
	},

	render: function() {
		var args = arguments;

		if ( this.model.attachment && 'pending' === this.model.dfd.state() ) {
			this.model.dfd
				.done( _.bind( function() {
					AttachmentDisplay.prototype.render.apply( this, args );
					this.postRender();
				}, this ) )
				.fail( _.bind( function() {
					this.model.attachment = false;
					AttachmentDisplay.prototype.render.apply( this, args );
					this.postRender();
				}, this ) );
		} else {
			AttachmentDisplay.prototype.render.apply( this, arguments );
			this.postRender();
		}

		return this;
	},

	postRender: function() {
		setTimeout( _.bind( this.resetFocus, this ), 10 );
		this.toggleLinkSettings();
		if ( window.getUserSetting( 'advImgDetails' ) === 'show' ) {
			this.toggleAdvanced( true );
		}
		this.trigger( 'post-render' );
	},

	resetFocus: function() {
		this.$( '.link-to-custom' ).blur();
		this.$( '.embed-media-settings' ).scrollTop( 0 );
	},

	updateUrl: function() {
		this.$( '.image img' ).attr( 'src', this.model.get( 'url' ) );
		this.$( '.url' ).val( this.model.get( 'url' ) );
	},

	toggleLinkSettings: function() {
		if ( this.model.get( 'link' ) === 'none' ) {
			this.$( '.link-settings' ).addClass('hidden');
		} else {
			this.$( '.link-settings' ).removeClass('hidden');
		}
	},

	toggleCustomSize: function() {
		if ( this.model.get( 'size' ) !== 'custom' ) {
			this.$( '.custom-size' ).addClass('hidden');
		} else {
			this.$( '.custom-size' ).removeClass('hidden');
		}
	},

	onCustomSize: function( event ) {
		var dimension = $( event.target ).data('setting'),
			num = $( event.target ).val(),
			value;

		// Ignore bogus input
		if ( ! /^\d+/.test( num ) || parseInt( num, 10 ) < 1 ) {
			event.preventDefault();
			return;
		}

		if ( dimension === 'customWidth' ) {
			value = Math.round( 1 / this.model.get( 'aspectRatio' ) * num );
			this.model.set( 'customHeight', value, { silent: true } );
			this.$( '[data-setting="customHeight"]' ).val( value );
		} else {
			value = Math.round( this.model.get( 'aspectRatio' ) * num );
			this.model.set( 'customWidth', value, { silent: true  } );
			this.$( '[data-setting="customWidth"]' ).val( value );
		}
	},

	onToggleAdvanced: function( event ) {
		event.preventDefault();
		this.toggleAdvanced();
	},

	toggleAdvanced: function( show ) {
		var $advanced = this.$el.find( '.advanced-section' ),
			mode;

		if ( $advanced.hasClass('advanced-visible') || show === false ) {
			$advanced.removeClass('advanced-visible');
			$advanced.find('.advanced-settings').addClass('hidden');
			mode = 'hide';
		} else {
			$advanced.addClass('advanced-visible');
			$advanced.find('.advanced-settings').removeClass('hidden');
			mode = 'show';
		}

		window.setUserSetting( 'advImgDetails', mode );
	},

	editAttachment: function( event ) {
		var editState = this.controller.states.get( 'edit-image' );

		if ( window.imageEdit && editState ) {
			event.preventDefault();
			editState.set( 'image', this.model.attachment );
			this.controller.setState( 'edit-image' );
		}
	},

	replaceAttachment: function( event ) {
		event.preventDefault();
		this.controller.setState( 'replace-image' );
	}
});

module.exports = ImageDetails;

},{}],49:[function(require,module,exports){
/**
 * wp.media.view.Label
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Label = wp.media.View.extend({
	tagName: 'label',
	className: 'screen-reader-text',

	initialize: function() {
		this.value = this.options.value;
	},

	render: function() {
		this.$el.html( this.value );

		return this;
	}
});

module.exports = Label;

},{}],50:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame
 *
 * The frame used to create the media modal.
 *
 * @class
 * @augments wp.media.view.Frame
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
var Frame = wp.media.view.Frame,
	$ = jQuery,
	MediaFrame;

MediaFrame = Frame.extend({
	className: 'media-frame',
	template:  wp.template('media-frame'),
	regions:   ['menu','title','content','toolbar','router'],

	events: {
		'click div.media-frame-title h1': 'toggleMenu'
	},

	/**
	 * @global wp.Uploader
	 */
	initialize: function() {
		Frame.prototype.initialize.apply( this, arguments );

		_.defaults( this.options, {
			title:    '',
			modal:    true,
			uploader: true
		});

		// Ensure core UI is enabled.
		this.$el.addClass('wp-core-ui');

		// Initialize modal container view.
		if ( this.options.modal ) {
			this.modal = new wp.media.view.Modal({
				controller: this,
				title:      this.options.title
			});

			this.modal.content( this );
		}

		// Force the uploader off if the upload limit has been exceeded or
		// if the browser isn't supported.
		if ( wp.Uploader.limitExceeded || ! wp.Uploader.browser.supported ) {
			this.options.uploader = false;
		}

		// Initialize window-wide uploader.
		if ( this.options.uploader ) {
			this.uploader = new wp.media.view.UploaderWindow({
				controller: this,
				uploader: {
					dropzone:  this.modal ? this.modal.$el : this.$el,
					container: this.$el
				}
			});
			this.views.set( '.media-frame-uploader', this.uploader );
		}

		this.on( 'attach', _.bind( this.views.ready, this.views ), this );

		// Bind default title creation.
		this.on( 'title:create:default', this.createTitle, this );
		this.title.mode('default');

		this.on( 'title:render', function( view ) {
			view.$el.append( '<span class="dashicons dashicons-arrow-down"></span>' );
		});

		// Bind default menu.
		this.on( 'menu:create:default', this.createMenu, this );
	},
	/**
	 * @returns {wp.media.view.MediaFrame} Returns itself to allow chaining
	 */
	render: function() {
		// Activate the default state if no active state exists.
		if ( ! this.state() && this.options.state ) {
			this.setState( this.options.state );
		}
		/**
		 * call 'render' directly on the parent class
		 */
		return Frame.prototype.render.apply( this, arguments );
	},
	/**
	 * @param {Object} title
	 * @this wp.media.controller.Region
	 */
	createTitle: function( title ) {
		title.view = new wp.media.View({
			controller: this,
			tagName: 'h1'
		});
	},
	/**
	 * @param {Object} menu
	 * @this wp.media.controller.Region
	 */
	createMenu: function( menu ) {
		menu.view = new wp.media.view.Menu({
			controller: this
		});
	},

	toggleMenu: function() {
		this.$el.find( '.media-menu' ).toggleClass( 'visible' );
	},

	/**
	 * @param {Object} toolbar
	 * @this wp.media.controller.Region
	 */
	createToolbar: function( toolbar ) {
		toolbar.view = new wp.media.view.Toolbar({
			controller: this
		});
	},
	/**
	 * @param {Object} router
	 * @this wp.media.controller.Region
	 */
	createRouter: function( router ) {
		router.view = new wp.media.view.Router({
			controller: this
		});
	},
	/**
	 * @param {Object} options
	 */
	createIframeStates: function( options ) {
		var settings = wp.media.view.settings,
			tabs = settings.tabs,
			tabUrl = settings.tabUrl,
			$postId;

		if ( ! tabs || ! tabUrl ) {
			return;
		}

		// Add the post ID to the tab URL if it exists.
		$postId = $('#post_ID');
		if ( $postId.length ) {
			tabUrl += '&post_id=' + $postId.val();
		}

		// Generate the tab states.
		_.each( tabs, function( title, id ) {
			this.state( 'iframe:' + id ).set( _.defaults({
				tab:     id,
				src:     tabUrl + '&tab=' + id,
				title:   title,
				content: 'iframe',
				menu:    'default'
			}, options ) );
		}, this );

		this.on( 'content:create:iframe', this.iframeContent, this );
		this.on( 'content:deactivate:iframe', this.iframeContentCleanup, this );
		this.on( 'menu:render:default', this.iframeMenu, this );
		this.on( 'open', this.hijackThickbox, this );
		this.on( 'close', this.restoreThickbox, this );
	},

	/**
	 * @param {Object} content
	 * @this wp.media.controller.Region
	 */
	iframeContent: function( content ) {
		this.$el.addClass('hide-toolbar');
		content.view = new wp.media.view.Iframe({
			controller: this
		});
	},

	iframeContentCleanup: function() {
		this.$el.removeClass('hide-toolbar');
	},

	iframeMenu: function( view ) {
		var views = {};

		if ( ! view ) {
			return;
		}

		_.each( wp.media.view.settings.tabs, function( title, id ) {
			views[ 'iframe:' + id ] = {
				text: this.state( 'iframe:' + id ).get('title'),
				priority: 200
			};
		}, this );

		view.set( views );
	},

	hijackThickbox: function() {
		var frame = this;

		if ( ! window.tb_remove || this._tb_remove ) {
			return;
		}

		this._tb_remove = window.tb_remove;
		window.tb_remove = function() {
			frame.close();
			frame.reset();
			frame.setState( frame.options.state );
			frame._tb_remove.call( window );
		};
	},

	restoreThickbox: function() {
		if ( ! this._tb_remove ) {
			return;
		}

		window.tb_remove = this._tb_remove;
		delete this._tb_remove;
	}
});

// Map some of the modal's methods to the frame.
_.each(['open','close','attach','detach','escape'], function( method ) {
	/**
	 * @returns {wp.media.view.MediaFrame} Returns itself to allow chaining
	 */
	MediaFrame.prototype[ method ] = function() {
		if ( this.modal ) {
			this.modal[ method ].apply( this.modal, arguments );
		}
		return this;
	};
});

module.exports = MediaFrame;

},{}],51:[function(require,module,exports){
/**
 * wp.media.view.MenuItem
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var $ = jQuery,
	MenuItem;

MenuItem = wp.media.View.extend({
	tagName:   'a',
	className: 'media-menu-item',

	attributes: {
		href: '#'
	},

	events: {
		'click': '_click'
	},
	/**
	 * @param {Object} event
	 */
	_click: function( event ) {
		var clickOverride = this.options.click;

		if ( event ) {
			event.preventDefault();
		}

		if ( clickOverride ) {
			clickOverride.call( this );
		} else {
			this.click();
		}

		// When selecting a tab along the left side,
		// focus should be transferred into the main panel
		if ( ! wp.media.isTouchDevice ) {
			$('.media-frame-content input').first().focus();
		}
	},

	click: function() {
		var state = this.options.state;

		if ( state ) {
			this.controller.setState( state );
			this.views.parent.$el.removeClass( 'visible' ); // TODO: or hide on any click, see below
		}
	},
	/**
	 * @returns {wp.media.view.MenuItem} returns itself to allow chaining
	 */
	render: function() {
		var options = this.options;

		if ( options.text ) {
			this.$el.text( options.text );
		} else if ( options.html ) {
			this.$el.html( options.html );
		}

		return this;
	}
});

module.exports = MenuItem;

},{}],52:[function(require,module,exports){
/**
 * wp.media.view.Menu
 *
 * @class
 * @augments wp.media.view.PriorityList
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var MenuItem = wp.media.view.MenuItem,
	PriorityList = wp.media.view.PriorityList,
	Menu;

Menu = PriorityList.extend({
	tagName:   'div',
	className: 'media-menu',
	property:  'state',
	ItemView:  MenuItem,
	region:    'menu',

	/* TODO: alternatively hide on any click anywhere
	events: {
		'click': 'click'
	},

	click: function() {
		this.$el.removeClass( 'visible' );
	},
	*/

	/**
	 * @param {Object} options
	 * @param {string} id
	 * @returns {wp.media.View}
	 */
	toView: function( options, id ) {
		options = options || {};
		options[ this.property ] = options[ this.property ] || id;
		return new this.ItemView( options ).render();
	},

	ready: function() {
		/**
		 * call 'ready' directly on the parent class
		 */
		PriorityList.prototype.ready.apply( this, arguments );
		this.visibility();
	},

	set: function() {
		/**
		 * call 'set' directly on the parent class
		 */
		PriorityList.prototype.set.apply( this, arguments );
		this.visibility();
	},

	unset: function() {
		/**
		 * call 'unset' directly on the parent class
		 */
		PriorityList.prototype.unset.apply( this, arguments );
		this.visibility();
	},

	visibility: function() {
		var region = this.region,
			view = this.controller[ region ].get(),
			views = this.views.get(),
			hide = ! views || views.length < 2;

		if ( this === view ) {
			this.controller.$el.toggleClass( 'hide-' + region, hide );
		}
	},
	/**
	 * @param {string} id
	 */
	select: function( id ) {
		var view = this.get( id );

		if ( ! view ) {
			return;
		}

		this.deselect();
		view.$el.addClass('active');
	},

	deselect: function() {
		this.$el.children().removeClass('active');
	},

	hide: function( id ) {
		var view = this.get( id );

		if ( ! view ) {
			return;
		}

		view.$el.addClass('hidden');
	},

	show: function( id ) {
		var view = this.get( id );

		if ( ! view ) {
			return;
		}

		view.$el.removeClass('hidden');
	}
});

module.exports = Menu;

},{}],53:[function(require,module,exports){
/**
 * wp.media.view.Modal
 *
 * A modal view, which the media modal uses as its default container.
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var $ = jQuery,
	Modal;

Modal = wp.media.View.extend({
	tagName:  'div',
	template: wp.template('media-modal'),

	attributes: {
		tabindex: 0
	},

	events: {
		'click .media-modal-backdrop, .media-modal-close': 'escapeHandler',
		'keydown': 'keydown'
	},

	initialize: function() {
		_.defaults( this.options, {
			container: document.body,
			title:     '',
			propagate: true,
			freeze:    true
		});

		this.focusManager = new wp.media.view.FocusManager({
			el: this.el
		});
	},
	/**
	 * @returns {Object}
	 */
	prepare: function() {
		return {
			title: this.options.title
		};
	},

	/**
	 * @returns {wp.media.view.Modal} Returns itself to allow chaining
	 */
	attach: function() {
		if ( this.views.attached ) {
			return this;
		}

		if ( ! this.views.rendered ) {
			this.render();
		}

		this.$el.appendTo( this.options.container );

		// Manually mark the view as attached and trigger ready.
		this.views.attached = true;
		this.views.ready();

		return this.propagate('attach');
	},

	/**
	 * @returns {wp.media.view.Modal} Returns itself to allow chaining
	 */
	detach: function() {
		if ( this.$el.is(':visible') ) {
			this.close();
		}

		this.$el.detach();
		this.views.attached = false;
		return this.propagate('detach');
	},

	/**
	 * @returns {wp.media.view.Modal} Returns itself to allow chaining
	 */
	open: function() {
		var $el = this.$el,
			options = this.options,
			mceEditor;

		if ( $el.is(':visible') ) {
			return this;
		}

		if ( ! this.views.attached ) {
			this.attach();
		}

		// If the `freeze` option is set, record the window's scroll position.
		if ( options.freeze ) {
			this._freeze = {
				scrollTop: $( window ).scrollTop()
			};
		}

		// Disable page scrolling.
		$( 'body' ).addClass( 'modal-open' );

		$el.show();

		// Try to close the onscreen keyboard
		if ( 'ontouchend' in document ) {
			if ( ( mceEditor = window.tinymce && window.tinymce.activeEditor )  && ! mceEditor.isHidden() && mceEditor.iframeElement ) {
				mceEditor.iframeElement.focus();
				mceEditor.iframeElement.blur();

				setTimeout( function() {
					mceEditor.iframeElement.blur();
				}, 100 );
			}
		}

		this.$el.focus();

		return this.propagate('open');
	},

	/**
	 * @param {Object} options
	 * @returns {wp.media.view.Modal} Returns itself to allow chaining
	 */
	close: function( options ) {
		var freeze = this._freeze;

		if ( ! this.views.attached || ! this.$el.is(':visible') ) {
			return this;
		}

		// Enable page scrolling.
		$( 'body' ).removeClass( 'modal-open' );

		// Hide modal and remove restricted media modal tab focus once it's closed
		this.$el.hide().undelegate( 'keydown' );

		// Put focus back in useful location once modal is closed
		$('#wpbody-content').focus();

		this.propagate('close');

		// If the `freeze` option is set, restore the container's scroll position.
		if ( freeze ) {
			$( window ).scrollTop( freeze.scrollTop );
		}

		if ( options && options.escape ) {
			this.propagate('escape');
		}

		return this;
	},
	/**
	 * @returns {wp.media.view.Modal} Returns itself to allow chaining
	 */
	escape: function() {
		return this.close({ escape: true });
	},
	/**
	 * @param {Object} event
	 */
	escapeHandler: function( event ) {
		event.preventDefault();
		this.escape();
	},

	/**
	 * @param {Array|Object} content Views to register to '.media-modal-content'
	 * @returns {wp.media.view.Modal} Returns itself to allow chaining
	 */
	content: function( content ) {
		this.views.set( '.media-modal-content', content );
		return this;
	},

	/**
	 * Triggers a modal event and if the `propagate` option is set,
	 * forwards events to the modal's controller.
	 *
	 * @param {string} id
	 * @returns {wp.media.view.Modal} Returns itself to allow chaining
	 */
	propagate: function( id ) {
		this.trigger( id );

		if ( this.options.propagate ) {
			this.controller.trigger( id );
		}

		return this;
	},
	/**
	 * @param {Object} event
	 */
	keydown: function( event ) {
		// Close the modal when escape is pressed.
		if ( 27 === event.which && this.$el.is(':visible') ) {
			this.escape();
			event.stopImmediatePropagation();
		}
	}
});

module.exports = Modal;

},{}],54:[function(require,module,exports){
/**
 * wp.media.view.PriorityList
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var PriorityList = wp.media.View.extend({
	tagName:   'div',

	initialize: function() {
		this._views = {};

		this.set( _.extend( {}, this._views, this.options.views ), { silent: true });
		delete this.options.views;

		if ( ! this.options.silent ) {
			this.render();
		}
	},
	/**
	 * @param {string} id
	 * @param {wp.media.View|Object} view
	 * @param {Object} options
	 * @returns {wp.media.view.PriorityList} Returns itself to allow chaining
	 */
	set: function( id, view, options ) {
		var priority, views, index;

		options = options || {};

		// Accept an object with an `id` : `view` mapping.
		if ( _.isObject( id ) ) {
			_.each( id, function( view, id ) {
				this.set( id, view );
			}, this );
			return this;
		}

		if ( ! (view instanceof Backbone.View) ) {
			view = this.toView( view, id, options );
		}
		view.controller = view.controller || this.controller;

		this.unset( id );

		priority = view.options.priority || 10;
		views = this.views.get() || [];

		_.find( views, function( existing, i ) {
			if ( existing.options.priority > priority ) {
				index = i;
				return true;
			}
		});

		this._views[ id ] = view;
		this.views.add( view, {
			at: _.isNumber( index ) ? index : views.length || 0
		});

		return this;
	},
	/**
	 * @param {string} id
	 * @returns {wp.media.View}
	 */
	get: function( id ) {
		return this._views[ id ];
	},
	/**
	 * @param {string} id
	 * @returns {wp.media.view.PriorityList}
	 */
	unset: function( id ) {
		var view = this.get( id );

		if ( view ) {
			view.remove();
		}

		delete this._views[ id ];
		return this;
	},
	/**
	 * @param {Object} options
	 * @returns {wp.media.View}
	 */
	toView: function( options ) {
		return new wp.media.View( options );
	}
});

module.exports = PriorityList;

},{}],55:[function(require,module,exports){
/**
 * wp.media.view.RouterItem
 *
 * @class
 * @augments wp.media.view.MenuItem
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var RouterItem = wp.media.view.MenuItem.extend({
	/**
	 * On click handler to activate the content region's corresponding mode.
	 */
	click: function() {
		var contentMode = this.options.contentMode;
		if ( contentMode ) {
			this.controller.content.mode( contentMode );
		}
	}
});

module.exports = RouterItem;

},{}],56:[function(require,module,exports){
/**
 * wp.media.view.Router
 *
 * @class
 * @augments wp.media.view.Menu
 * @augments wp.media.view.PriorityList
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Menu = wp.media.view.Menu,
	Router;

Router = Menu.extend({
	tagName:   'div',
	className: 'media-router',
	property:  'contentMode',
	ItemView:  wp.media.view.RouterItem,
	region:    'router',

	initialize: function() {
		this.controller.on( 'content:render', this.update, this );
		// Call 'initialize' directly on the parent class.
		Menu.prototype.initialize.apply( this, arguments );
	},

	update: function() {
		var mode = this.controller.content.mode();
		if ( mode ) {
			this.select( mode );
		}
	}
});

module.exports = Router;

},{}],57:[function(require,module,exports){
/**
 * wp.media.view.Search
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var l10n = wp.media.view.l10n,
	Search;

Search = wp.media.View.extend({
	tagName:   'input',
	className: 'search',
	id:        'media-search-input',

	attributes: {
		type:        'search',
		placeholder: l10n.search
	},

	events: {
		'input':  'search',
		'keyup':  'search',
		'change': 'search',
		'search': 'search'
	},

	/**
	 * @returns {wp.media.view.Search} Returns itself to allow chaining
	 */
	render: function() {
		this.el.value = this.model.escape('search');
		return this;
	},

	search: function( event ) {
		if ( event.target.value ) {
			this.model.set( 'search', event.target.value );
		} else {
			this.model.unset('search');
		}
	}
});

module.exports = Search;

},{}],58:[function(require,module,exports){
/**
 * wp.media.view.Selection
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var l10n = wp.media.view.l10n,
	Selection;

Selection = wp.media.View.extend({
	tagName:   'div',
	className: 'media-selection',
	template:  wp.template('media-selection'),

	events: {
		'click .edit-selection':  'edit',
		'click .clear-selection': 'clear'
	},

	initialize: function() {
		_.defaults( this.options, {
			editable:  false,
			clearable: true
		});

		/**
		 * @member {wp.media.view.Attachments.Selection}
		 */
		this.attachments = new wp.media.view.Attachments.Selection({
			controller: this.controller,
			collection: this.collection,
			selection:  this.collection,
			model:      new Backbone.Model()
		});

		this.views.set( '.selection-view', this.attachments );
		this.collection.on( 'add remove reset', this.refresh, this );
		this.controller.on( 'content:activate', this.refresh, this );
	},

	ready: function() {
		this.refresh();
	},

	refresh: function() {
		// If the selection hasn't been rendered, bail.
		if ( ! this.$el.children().length ) {
			return;
		}

		var collection = this.collection,
			editing = 'edit-selection' === this.controller.content.mode();

		// If nothing is selected, display nothing.
		this.$el.toggleClass( 'empty', ! collection.length );
		this.$el.toggleClass( 'one', 1 === collection.length );
		this.$el.toggleClass( 'editing', editing );

		this.$('.count').text( l10n.selected.replace('%d', collection.length) );
	},

	edit: function( event ) {
		event.preventDefault();
		if ( this.options.editable ) {
			this.options.editable.call( this, this.collection );
		}
	},

	clear: function( event ) {
		event.preventDefault();
		this.collection.reset();

		// Keep focus inside media modal
		// after clear link is selected
		this.controller.modal.focusManager.focus();
	}
});

module.exports = Selection;

},{}],59:[function(require,module,exports){
/**
 * wp.media.view.Settings
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	$ = Backbone.$,
	Settings;

Settings = View.extend({
	events: {
		'click button':    'updateHandler',
		'change input':    'updateHandler',
		'change select':   'updateHandler',
		'change textarea': 'updateHandler'
	},

	initialize: function() {
		this.model = this.model || new Backbone.Model();
		this.listenTo( this.model, 'change', this.updateChanges );
	},

	prepare: function() {
		return _.defaults({
			model: this.model.toJSON()
		}, this.options );
	},
	/**
	 * @returns {wp.media.view.Settings} Returns itself to allow chaining
	 */
	render: function() {
		View.prototype.render.apply( this, arguments );
		// Select the correct values.
		_( this.model.attributes ).chain().keys().each( this.update, this );
		return this;
	},
	/**
	 * @param {string} key
	 */
	update: function( key ) {
		var value = this.model.get( key ),
			$setting = this.$('[data-setting="' + key + '"]'),
			$buttons, $value;

		// Bail if we didn't find a matching setting.
		if ( ! $setting.length ) {
			return;
		}

		// Attempt to determine how the setting is rendered and update
		// the selected value.

		// Handle dropdowns.
		if ( $setting.is('select') ) {
			$value = $setting.find('[value="' + value + '"]');

			if ( $value.length ) {
				$setting.find('option').prop( 'selected', false );
				$value.prop( 'selected', true );
			} else {
				// If we can't find the desired value, record what *is* selected.
				this.model.set( key, $setting.find(':selected').val() );
			}

		// Handle button groups.
		} else if ( $setting.hasClass('button-group') ) {
			$buttons = $setting.find('button').removeClass('active');
			$buttons.filter( '[value="' + value + '"]' ).addClass('active');

		// Handle text inputs and textareas.
		} else if ( $setting.is('input[type="text"], textarea') ) {
			if ( ! $setting.is(':focus') ) {
				$setting.val( value );
			}
		// Handle checkboxes.
		} else if ( $setting.is('input[type="checkbox"]') ) {
			$setting.prop( 'checked', !! value && 'false' !== value );
		}
	},
	/**
	 * @param {Object} event
	 */
	updateHandler: function( event ) {
		var $setting = $( event.target ).closest('[data-setting]'),
			value = event.target.value,
			userSetting;

		event.preventDefault();

		if ( ! $setting.length ) {
			return;
		}

		// Use the correct value for checkboxes.
		if ( $setting.is('input[type="checkbox"]') ) {
			value = $setting[0].checked;
		}

		// Update the corresponding setting.
		this.model.set( $setting.data('setting'), value );

		// If the setting has a corresponding user setting,
		// update that as well.
		if ( userSetting = $setting.data('userSetting') ) {
			window.setUserSetting( userSetting, value );
		}
	},

	updateChanges: function( model ) {
		if ( model.hasChanged() ) {
			_( model.changed ).chain().keys().each( this.update, this );
		}
	}
});

module.exports = Settings;

},{}],60:[function(require,module,exports){
/**
 * wp.media.view.Settings.AttachmentDisplay
 *
 * @class
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Settings = wp.media.view.Settings,
	AttachmentDisplay;

AttachmentDisplay = Settings.extend({
	className: 'attachment-display-settings',
	template:  wp.template('attachment-display-settings'),

	initialize: function() {
		var attachment = this.options.attachment;

		_.defaults( this.options, {
			userSettings: false
		});
		// Call 'initialize' directly on the parent class.
		Settings.prototype.initialize.apply( this, arguments );
		this.listenTo( this.model, 'change:link', this.updateLinkTo );

		if ( attachment ) {
			attachment.on( 'change:uploading', this.render, this );
		}
	},

	dispose: function() {
		var attachment = this.options.attachment;
		if ( attachment ) {
			attachment.off( null, null, this );
		}
		/**
		 * call 'dispose' directly on the parent class
		 */
		Settings.prototype.dispose.apply( this, arguments );
	},
	/**
	 * @returns {wp.media.view.AttachmentDisplay} Returns itself to allow chaining
	 */
	render: function() {
		var attachment = this.options.attachment;
		if ( attachment ) {
			_.extend( this.options, {
				sizes: attachment.get('sizes'),
				type:  attachment.get('type')
			});
		}
		/**
		 * call 'render' directly on the parent class
		 */
		Settings.prototype.render.call( this );
		this.updateLinkTo();
		return this;
	},

	updateLinkTo: function() {
		var linkTo = this.model.get('link'),
			$input = this.$('.link-to-custom'),
			attachment = this.options.attachment;

		if ( 'none' === linkTo || 'embed' === linkTo || ( ! attachment && 'custom' !== linkTo ) ) {
			$input.addClass( 'hidden' );
			return;
		}

		if ( attachment ) {
			if ( 'post' === linkTo ) {
				$input.val( attachment.get('link') );
			} else if ( 'file' === linkTo ) {
				$input.val( attachment.get('url') );
			} else if ( ! this.model.get('linkUrl') ) {
				$input.val('http://');
			}

			$input.prop( 'readonly', 'custom' !== linkTo );
		}

		$input.removeClass( 'hidden' );

		// If the input is visible, focus and select its contents.
		if ( ! wp.media.isTouchDevice && $input.is(':visible') ) {
			$input.focus()[0].select();
		}
	}
});

module.exports = AttachmentDisplay;

},{}],61:[function(require,module,exports){
/**
 * wp.media.view.Settings.Gallery
 *
 * @class
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Gallery = wp.media.view.Settings.extend({
	className: 'collection-settings gallery-settings',
	template:  wp.template('gallery-settings')
});

module.exports = Gallery;

},{}],62:[function(require,module,exports){
/**
 * wp.media.view.Settings.Playlist
 *
 * @class
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Playlist = wp.media.view.Settings.extend({
	className: 'collection-settings playlist-settings',
	template:  wp.template('playlist-settings')
});

module.exports = Playlist;

},{}],63:[function(require,module,exports){
/**
 * wp.media.view.Sidebar
 *
 * @class
 * @augments wp.media.view.PriorityList
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Sidebar = wp.media.view.PriorityList.extend({
	className: 'media-sidebar'
});

module.exports = Sidebar;

},{}],64:[function(require,module,exports){
/**
 * wp.media.view.SiteIconCropper
 *
 * Uses the imgAreaSelect plugin to allow a user to crop a Site Icon.
 *
 * Takes imgAreaSelect options from
 * wp.customize.SiteIconControl.calculateImageSelectOptions.
 *
 * @class
 * @augments wp.media.view.Cropper
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.view,
	SiteIconCropper;

SiteIconCropper = View.Cropper.extend({
	className: 'crop-content site-icon',

	ready: function () {
		View.Cropper.prototype.ready.apply( this, arguments );

		this.$( '.crop-image' ).on( 'load', _.bind( this.addSidebar, this ) );
	},

	addSidebar: function() {
		this.sidebar = new wp.media.view.Sidebar({
			controller: this.controller
		});

		this.sidebar.set( 'preview', new wp.media.view.SiteIconPreview({
			controller: this.controller,
			attachment: this.options.attachment
		}) );

		this.controller.cropperView.views.add( this.sidebar );
	}
});

module.exports = SiteIconCropper;

},{}],65:[function(require,module,exports){
/**
 * wp.media.view.SiteIconPreview
 *
 * Shows a preview of the Site Icon as a favicon and app icon while cropping.
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	$ = jQuery,
	SiteIconPreview;

SiteIconPreview = View.extend({
	className: 'site-icon-preview',
	template: wp.template( 'site-icon-preview' ),

	ready: function() {
		this.controller.imgSelect.setOptions({
			onInit: this.updatePreview,
			onSelectChange: this.updatePreview
		});
	},

	prepare: function() {
		return {
			url: this.options.attachment.get( 'url' )
		};
	},

	updatePreview: function( img, coords ) {
		var rx = 64 / coords.width,
			ry = 64 / coords.height,
			preview_rx = 16 / coords.width,
			preview_ry = 16 / coords.height;

		$( '#preview-app-icon' ).css({
			width: Math.round(rx * this.imageWidth ) + 'px',
			height: Math.round(ry * this.imageHeight ) + 'px',
			marginLeft: '-' + Math.round(rx * coords.x1) + 'px',
			marginTop: '-' + Math.round(ry * coords.y1) + 'px'
		});

		$( '#preview-favicon' ).css({
			width: Math.round( preview_rx * this.imageWidth ) + 'px',
			height: Math.round( preview_ry * this.imageHeight ) + 'px',
			marginLeft: '-' + Math.round( preview_rx * coords.x1 ) + 'px',
			marginTop: '-' + Math.floor( preview_ry* coords.y1 ) + 'px'
		});
	}
});

module.exports = SiteIconPreview;

},{}],66:[function(require,module,exports){
/**
 * wp.media.view.Spinner
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Spinner = wp.media.View.extend({
	tagName:   'span',
	className: 'spinner',
	spinnerTimeout: false,
	delay: 400,

	show: function() {
		if ( ! this.spinnerTimeout ) {
			this.spinnerTimeout = _.delay(function( $el ) {
				$el.addClass( 'is-active' );
			}, this.delay, this.$el );
		}

		return this;
	},

	hide: function() {
		this.$el.removeClass( 'is-active' );
		this.spinnerTimeout = clearTimeout( this.spinnerTimeout );

		return this;
	}
});

module.exports = Spinner;

},{}],67:[function(require,module,exports){
/**
 * wp.media.view.Toolbar
 *
 * A toolbar which consists of a primary and a secondary section. Each sections
 * can be filled with views.
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	Toolbar;

Toolbar = View.extend({
	tagName:   'div',
	className: 'media-toolbar',

	initialize: function() {
		var state = this.controller.state(),
			selection = this.selection = state.get('selection'),
			library = this.library = state.get('library');

		this._views = {};

		// The toolbar is composed of two `PriorityList` views.
		this.primary   = new wp.media.view.PriorityList();
		this.secondary = new wp.media.view.PriorityList();
		this.primary.$el.addClass('media-toolbar-primary search-form');
		this.secondary.$el.addClass('media-toolbar-secondary');

		this.views.set([ this.secondary, this.primary ]);

		if ( this.options.items ) {
			this.set( this.options.items, { silent: true });
		}

		if ( ! this.options.silent ) {
			this.render();
		}

		if ( selection ) {
			selection.on( 'add remove reset', this.refresh, this );
		}

		if ( library ) {
			library.on( 'add remove reset', this.refresh, this );
		}
	},
	/**
	 * @returns {wp.media.view.Toolbar} Returns itsef to allow chaining
	 */
	dispose: function() {
		if ( this.selection ) {
			this.selection.off( null, null, this );
		}

		if ( this.library ) {
			this.library.off( null, null, this );
		}
		/**
		 * call 'dispose' directly on the parent class
		 */
		return View.prototype.dispose.apply( this, arguments );
	},

	ready: function() {
		this.refresh();
	},

	/**
	 * @param {string} id
	 * @param {Backbone.View|Object} view
	 * @param {Object} [options={}]
	 * @returns {wp.media.view.Toolbar} Returns itself to allow chaining
	 */
	set: function( id, view, options ) {
		var list;
		options = options || {};

		// Accept an object with an `id` : `view` mapping.
		if ( _.isObject( id ) ) {
			_.each( id, function( view, id ) {
				this.set( id, view, { silent: true });
			}, this );

		} else {
			if ( ! ( view instanceof Backbone.View ) ) {
				view.classes = [ 'media-button-' + id ].concat( view.classes || [] );
				view = new wp.media.view.Button( view ).render();
			}

			view.controller = view.controller || this.controller;

			this._views[ id ] = view;

			list = view.options.priority < 0 ? 'secondary' : 'primary';
			this[ list ].set( id, view, options );
		}

		if ( ! options.silent ) {
			this.refresh();
		}

		return this;
	},
	/**
	 * @param {string} id
	 * @returns {wp.media.view.Button}
	 */
	get: function( id ) {
		return this._views[ id ];
	},
	/**
	 * @param {string} id
	 * @param {Object} options
	 * @returns {wp.media.view.Toolbar} Returns itself to allow chaining
	 */
	unset: function( id, options ) {
		delete this._views[ id ];
		this.primary.unset( id, options );
		this.secondary.unset( id, options );

		if ( ! options || ! options.silent ) {
			this.refresh();
		}
		return this;
	},

	refresh: function() {
		var state = this.controller.state(),
			library = state.get('library'),
			selection = state.get('selection');

		_.each( this._views, function( button ) {
			if ( ! button.model || ! button.options || ! button.options.requires ) {
				return;
			}

			var requires = button.options.requires,
				disabled = false;

			// Prevent insertion of attachments if any of them are still uploading
			disabled = _.some( selection.models, function( attachment ) {
				return attachment.get('uploading') === true;
			});

			if ( requires.selection && selection && ! selection.length ) {
				disabled = true;
			} else if ( requires.library && library && ! library.length ) {
				disabled = true;
			}
			button.model.set( 'disabled', disabled );
		});
	}
});

module.exports = Toolbar;

},{}],68:[function(require,module,exports){
/**
 * wp.media.view.Toolbar.Embed
 *
 * @class
 * @augments wp.media.view.Toolbar.Select
 * @augments wp.media.view.Toolbar
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Select = wp.media.view.Toolbar.Select,
	l10n = wp.media.view.l10n,
	Embed;

Embed = Select.extend({
	initialize: function() {
		_.defaults( this.options, {
			text: l10n.insertIntoPost,
			requires: false
		});
		// Call 'initialize' directly on the parent class.
		Select.prototype.initialize.apply( this, arguments );
	},

	refresh: function() {
		var url = this.controller.state().props.get('url');
		this.get('select').model.set( 'disabled', ! url || url === 'http://' );
		/**
		 * call 'refresh' directly on the parent class
		 */
		Select.prototype.refresh.apply( this, arguments );
	}
});

module.exports = Embed;

},{}],69:[function(require,module,exports){
/**
 * wp.media.view.Toolbar.Select
 *
 * @class
 * @augments wp.media.view.Toolbar
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Toolbar = wp.media.view.Toolbar,
	l10n = wp.media.view.l10n,
	Select;

Select = Toolbar.extend({
	initialize: function() {
		var options = this.options;

		_.bindAll( this, 'clickSelect' );

		_.defaults( options, {
			event: 'select',
			state: false,
			reset: true,
			close: true,
			text:  l10n.select,

			// Does the button rely on the selection?
			requires: {
				selection: true
			}
		});

		options.items = _.defaults( options.items || {}, {
			select: {
				style:    'primary',
				text:     options.text,
				priority: 80,
				click:    this.clickSelect,
				requires: options.requires
			}
		});
		// Call 'initialize' directly on the parent class.
		Toolbar.prototype.initialize.apply( this, arguments );
	},

	clickSelect: function() {
		var options = this.options,
			controller = this.controller;

		if ( options.close ) {
			controller.close();
		}

		if ( options.event ) {
			controller.state().trigger( options.event );
		}

		if ( options.state ) {
			controller.setState( options.state );
		}

		if ( options.reset ) {
			controller.reset();
		}
	}
});

module.exports = Select;

},{}],70:[function(require,module,exports){
/**
 * Creates a dropzone on WP editor instances (elements with .wp-editor-wrap)
 * and relays drag'n'dropped files to a media workflow.
 *
 * wp.media.view.EditorUploader
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	EditorUploader;

EditorUploader = View.extend({
	tagName:   'div',
	className: 'uploader-editor',
	template:  wp.template( 'uploader-editor' ),

	localDrag: false,
	overContainer: false,
	overDropzone: false,
	draggingFile: null,

	/**
	 * Bind drag'n'drop events to callbacks.
	 */
	initialize: function() {
		this.initialized = false;

		// Bail if not enabled or UA does not support drag'n'drop or File API.
		if ( ! window.tinyMCEPreInit || ! window.tinyMCEPreInit.dragDropUpload || ! this.browserSupport() ) {
			return this;
		}

		this.$document = $(document);
		this.dropzones = [];
		this.files = [];

		this.$document.on( 'drop', '.uploader-editor', _.bind( this.drop, this ) );
		this.$document.on( 'dragover', '.uploader-editor', _.bind( this.dropzoneDragover, this ) );
		this.$document.on( 'dragleave', '.uploader-editor', _.bind( this.dropzoneDragleave, this ) );
		this.$document.on( 'click', '.uploader-editor', _.bind( this.click, this ) );

		this.$document.on( 'dragover', _.bind( this.containerDragover, this ) );
		this.$document.on( 'dragleave', _.bind( this.containerDragleave, this ) );

		this.$document.on( 'dragstart dragend drop', _.bind( function( event ) {
			this.localDrag = event.type === 'dragstart';

			if ( event.type === 'drop' ) {
				this.containerDragleave();
			}
		}, this ) );

		this.initialized = true;
		return this;
	},

	/**
	 * Check browser support for drag'n'drop.
	 *
	 * @return Boolean
	 */
	browserSupport: function() {
		var supports = false, div = document.createElement('div');

		supports = ( 'draggable' in div ) || ( 'ondragstart' in div && 'ondrop' in div );
		supports = supports && !! ( window.File && window.FileList && window.FileReader );
		return supports;
	},

	isDraggingFile: function( event ) {
		if ( this.draggingFile !== null ) {
			return this.draggingFile;
		}

		if ( _.isUndefined( event.originalEvent ) || _.isUndefined( event.originalEvent.dataTransfer ) ) {
			return false;
		}

		this.draggingFile = _.indexOf( event.originalEvent.dataTransfer.types, 'Files' ) > -1 &&
			_.indexOf( event.originalEvent.dataTransfer.types, 'text/plain' ) === -1;

		return this.draggingFile;
	},

	refresh: function( e ) {
		var dropzone_id;
		for ( dropzone_id in this.dropzones ) {
			// Hide the dropzones only if dragging has left the screen.
			this.dropzones[ dropzone_id ].toggle( this.overContainer || this.overDropzone );
		}

		if ( ! _.isUndefined( e ) ) {
			$( e.target ).closest( '.uploader-editor' ).toggleClass( 'droppable', this.overDropzone );
		}

		if ( ! this.overContainer && ! this.overDropzone ) {
			this.draggingFile = null;
		}

		return this;
	},

	render: function() {
		if ( ! this.initialized ) {
			return this;
		}

		View.prototype.render.apply( this, arguments );
		$( '.wp-editor-wrap' ).each( _.bind( this.attach, this ) );
		return this;
	},

	attach: function( index, editor ) {
		// Attach a dropzone to an editor.
		var dropzone = this.$el.clone();
		this.dropzones.push( dropzone );
		$( editor ).append( dropzone );
		return this;
	},

	/**
	 * When a file is dropped on the editor uploader, open up an editor media workflow
	 * and upload the file immediately.
	 *
	 * @param  {jQuery.Event} event The 'drop' event.
	 */
	drop: function( event ) {
		var $wrap, uploadView;

		this.containerDragleave( event );
		this.dropzoneDragleave( event );

		this.files = event.originalEvent.dataTransfer.files;
		if ( this.files.length < 1 ) {
			return;
		}

		// Set the active editor to the drop target.
		$wrap = $( event.target ).parents( '.wp-editor-wrap' );
		if ( $wrap.length > 0 && $wrap[0].id ) {
			window.wpActiveEditor = $wrap[0].id.slice( 3, -5 );
		}

		if ( ! this.workflow ) {
			this.workflow = wp.media.editor.open( window.wpActiveEditor, {
				frame:    'post',
				state:    'insert',
				title:    l10n.addMedia,
				multiple: true
			});

			uploadView = this.workflow.uploader;

			if ( uploadView.uploader && uploadView.uploader.ready ) {
				this.addFiles.apply( this );
			} else {
				this.workflow.on( 'uploader:ready', this.addFiles, this );
			}
		} else {
			this.workflow.state().reset();
			this.addFiles.apply( this );
			this.workflow.open();
		}

		return false;
	},

	/**
	 * Add the files to the uploader.
	 */
	addFiles: function() {
		if ( this.files.length ) {
			this.workflow.uploader.uploader.uploader.addFile( _.toArray( this.files ) );
			this.files = [];
		}
		return this;
	},

	containerDragover: function( event ) {
		if ( this.localDrag || ! this.isDraggingFile( event ) ) {
			return;
		}

		this.overContainer = true;
		this.refresh();
	},

	containerDragleave: function() {
		this.overContainer = false;

		// Throttle dragleave because it's called when bouncing from some elements to others.
		_.delay( _.bind( this.refresh, this ), 50 );
	},

	dropzoneDragover: function( event ) {
		if ( this.localDrag || ! this.isDraggingFile( event ) ) {
			return;
		}

		this.overDropzone = true;
		this.refresh( event );
		return false;
	},

	dropzoneDragleave: function( e ) {
		this.overDropzone = false;
		_.delay( _.bind( this.refresh, this, e ), 50 );
	},

	click: function( e ) {
		// In the rare case where the dropzone gets stuck, hide it on click.
		this.containerDragleave( e );
		this.dropzoneDragleave( e );
		this.localDrag = false;
	}
});

module.exports = EditorUploader;

},{}],71:[function(require,module,exports){
/**
 * wp.media.view.UploaderInline
 *
 * The inline uploader that shows up in the 'Upload Files' tab.
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	UploaderInline;

UploaderInline = View.extend({
	tagName:   'div',
	className: 'uploader-inline',
	template:  wp.template('uploader-inline'),

	events: {
		'click .close': 'hide'
	},

	initialize: function() {
		_.defaults( this.options, {
			message: '',
			status:  true,
			canClose: false
		});

		if ( ! this.options.$browser && this.controller.uploader ) {
			this.options.$browser = this.controller.uploader.$browser;
		}

		if ( _.isUndefined( this.options.postId ) ) {
			this.options.postId = wp.media.view.settings.post.id;
		}

		if ( this.options.status ) {
			this.views.set( '.upload-inline-status', new wp.media.view.UploaderStatus({
				controller: this.controller
			}) );
		}
	},

	prepare: function() {
		var suggestedWidth = this.controller.state().get('suggestedWidth'),
			suggestedHeight = this.controller.state().get('suggestedHeight'),
			data = {};

		data.message = this.options.message;
		data.canClose = this.options.canClose;

		if ( suggestedWidth && suggestedHeight ) {
			data.suggestedWidth = suggestedWidth;
			data.suggestedHeight = suggestedHeight;
		}

		return data;
	},
	/**
	 * @returns {wp.media.view.UploaderInline} Returns itself to allow chaining
	 */
	dispose: function() {
		if ( this.disposing ) {
			/**
			 * call 'dispose' directly on the parent class
			 */
			return View.prototype.dispose.apply( this, arguments );
		}

		// Run remove on `dispose`, so we can be sure to refresh the
		// uploader with a view-less DOM. Track whether we're disposing
		// so we don't trigger an infinite loop.
		this.disposing = true;
		return this.remove();
	},
	/**
	 * @returns {wp.media.view.UploaderInline} Returns itself to allow chaining
	 */
	remove: function() {
		/**
		 * call 'remove' directly on the parent class
		 */
		var result = View.prototype.remove.apply( this, arguments );

		_.defer( _.bind( this.refresh, this ) );
		return result;
	},

	refresh: function() {
		var uploader = this.controller.uploader;

		if ( uploader ) {
			uploader.refresh();
		}
	},
	/**
	 * @returns {wp.media.view.UploaderInline}
	 */
	ready: function() {
		var $browser = this.options.$browser,
			$placeholder;

		if ( this.controller.uploader ) {
			$placeholder = this.$('.browser');

			// Check if we've already replaced the placeholder.
			if ( $placeholder[0] === $browser[0] ) {
				return;
			}

			$browser.detach().text( $placeholder.text() );
			$browser[0].className = $placeholder[0].className;
			$placeholder.replaceWith( $browser.show() );
		}

		this.refresh();
		return this;
	},
	show: function() {
		this.$el.removeClass( 'hidden' );
	},
	hide: function() {
		this.$el.addClass( 'hidden' );
	}

});

module.exports = UploaderInline;

},{}],72:[function(require,module,exports){
/**
 * wp.media.view.UploaderStatusError
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var UploaderStatusError = wp.media.View.extend({
	className: 'upload-error',
	template:  wp.template('uploader-status-error')
});

module.exports = UploaderStatusError;

},{}],73:[function(require,module,exports){
/**
 * wp.media.view.UploaderStatus
 *
 * An uploader status for on-going uploads.
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	UploaderStatus;

UploaderStatus = View.extend({
	className: 'media-uploader-status',
	template:  wp.template('uploader-status'),

	events: {
		'click .upload-dismiss-errors': 'dismiss'
	},

	initialize: function() {
		this.queue = wp.Uploader.queue;
		this.queue.on( 'add remove reset', this.visibility, this );
		this.queue.on( 'add remove reset change:percent', this.progress, this );
		this.queue.on( 'add remove reset change:uploading', this.info, this );

		this.errors = wp.Uploader.errors;
		this.errors.reset();
		this.errors.on( 'add remove reset', this.visibility, this );
		this.errors.on( 'add', this.error, this );
	},
	/**
	 * @global wp.Uploader
	 * @returns {wp.media.view.UploaderStatus}
	 */
	dispose: function() {
		wp.Uploader.queue.off( null, null, this );
		/**
		 * call 'dispose' directly on the parent class
		 */
		View.prototype.dispose.apply( this, arguments );
		return this;
	},

	visibility: function() {
		this.$el.toggleClass( 'uploading', !! this.queue.length );
		this.$el.toggleClass( 'errors', !! this.errors.length );
		this.$el.toggle( !! this.queue.length || !! this.errors.length );
	},

	ready: function() {
		_.each({
			'$bar':      '.media-progress-bar div',
			'$index':    '.upload-index',
			'$total':    '.upload-total',
			'$filename': '.upload-filename'
		}, function( selector, key ) {
			this[ key ] = this.$( selector );
		}, this );

		this.visibility();
		this.progress();
		this.info();
	},

	progress: function() {
		var queue = this.queue,
			$bar = this.$bar;

		if ( ! $bar || ! queue.length ) {
			return;
		}

		$bar.width( ( queue.reduce( function( memo, attachment ) {
			if ( ! attachment.get('uploading') ) {
				return memo + 100;
			}

			var percent = attachment.get('percent');
			return memo + ( _.isNumber( percent ) ? percent : 100 );
		}, 0 ) / queue.length ) + '%' );
	},

	info: function() {
		var queue = this.queue,
			index = 0, active;

		if ( ! queue.length ) {
			return;
		}

		active = this.queue.find( function( attachment, i ) {
			index = i;
			return attachment.get('uploading');
		});

		this.$index.text( index + 1 );
		this.$total.text( queue.length );
		this.$filename.html( active ? this.filename( active.get('filename') ) : '' );
	},
	/**
	 * @param {string} filename
	 * @returns {string}
	 */
	filename: function( filename ) {
		return _.escape( filename );
	},
	/**
	 * @param {Backbone.Model} error
	 */
	error: function( error ) {
		this.views.add( '.upload-errors', new wp.media.view.UploaderStatusError({
			filename: this.filename( error.get('file').name ),
			message:  error.get('message')
		}), { at: 0 });
	},

	/**
	 * @global wp.Uploader
	 *
	 * @param {Object} event
	 */
	dismiss: function( event ) {
		var errors = this.views.get('.upload-errors');

		event.preventDefault();

		if ( errors ) {
			_.invoke( errors, 'remove' );
		}
		wp.Uploader.errors.reset();
	}
});

module.exports = UploaderStatus;

},{}],74:[function(require,module,exports){
/**
 * wp.media.view.UploaderWindow
 *
 * An uploader window that allows for dragging and dropping media.
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 *
 * @param {object} [options]                   Options hash passed to the view.
 * @param {object} [options.uploader]          Uploader properties.
 * @param {jQuery} [options.uploader.browser]
 * @param {jQuery} [options.uploader.dropzone] jQuery collection of the dropzone.
 * @param {object} [options.uploader.params]
 */
var $ = jQuery,
	UploaderWindow;

UploaderWindow = wp.media.View.extend({
	tagName:   'div',
	className: 'uploader-window',
	template:  wp.template('uploader-window'),

	initialize: function() {
		var uploader;

		this.$browser = $('<a href="#" class="browser" />').hide().appendTo('body');

		uploader = this.options.uploader = _.defaults( this.options.uploader || {}, {
			dropzone:  this.$el,
			browser:   this.$browser,
			params:    {}
		});

		// Ensure the dropzone is a jQuery collection.
		if ( uploader.dropzone && ! (uploader.dropzone instanceof $) ) {
			uploader.dropzone = $( uploader.dropzone );
		}

		this.controller.on( 'activate', this.refresh, this );

		this.controller.on( 'detach', function() {
			this.$browser.remove();
		}, this );
	},

	refresh: function() {
		if ( this.uploader ) {
			this.uploader.refresh();
		}
	},

	ready: function() {
		var postId = wp.media.view.settings.post.id,
			dropzone;

		// If the uploader already exists, bail.
		if ( this.uploader ) {
			return;
		}

		if ( postId ) {
			this.options.uploader.params.post_id = postId;
		}
		this.uploader = new wp.Uploader( this.options.uploader );

		dropzone = this.uploader.dropzone;
		dropzone.on( 'dropzone:enter', _.bind( this.show, this ) );
		dropzone.on( 'dropzone:leave', _.bind( this.hide, this ) );

		$( this.uploader ).on( 'uploader:ready', _.bind( this._ready, this ) );
	},

	_ready: function() {
		this.controller.trigger( 'uploader:ready' );
	},

	show: function() {
		var $el = this.$el.show();

		// Ensure that the animation is triggered by waiting until
		// the transparent element is painted into the DOM.
		_.defer( function() {
			$el.css({ opacity: 1 });
		});
	},

	hide: function() {
		var $el = this.$el.css({ opacity: 0 });

		wp.media.transition( $el ).done( function() {
			// Transition end events are subject to race conditions.
			// Make sure that the value is set as intended.
			if ( '0' === $el.css('opacity') ) {
				$el.hide();
			}
		});

		// https://core.trac.wordpress.org/ticket/27341
		_.delay( function() {
			if ( '0' === $el.css('opacity') && $el.is(':visible') ) {
				$el.hide();
			}
		}, 500 );
	}
});

module.exports = UploaderWindow;

},{}],75:[function(require,module,exports){
/**
 * wp.media.View
 *
 * The base view class for media.
 *
 * Undelegating events, removing events from the model, and
 * removing events from the controller mirror the code for
 * `Backbone.View.dispose` in Backbone 0.9.8 development.
 *
 * This behavior has since been removed, and should not be used
 * outside of the media manager.
 *
 * @class
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.Backbone.View.extend({
	constructor: function( options ) {
		if ( options && options.controller ) {
			this.controller = options.controller;
		}
		wp.Backbone.View.apply( this, arguments );
	},
	/**
	 * @todo The internal comment mentions this might have been a stop-gap
	 *       before Backbone 0.9.8 came out. Figure out if Backbone core takes
	 *       care of this in Backbone.View now.
	 *
	 * @returns {wp.media.View} Returns itself to allow chaining
	 */
	dispose: function() {
		// Undelegating events, removing events from the model, and
		// removing events from the controller mirror the code for
		// `Backbone.View.dispose` in Backbone 0.9.8 development.
		this.undelegateEvents();

		if ( this.model && this.model.off ) {
			this.model.off( null, null, this );
		}

		if ( this.collection && this.collection.off ) {
			this.collection.off( null, null, this );
		}

		// Unbind controller events.
		if ( this.controller && this.controller.off ) {
			this.controller.off( null, null, this );
		}

		return this;
	},
	/**
	 * @returns {wp.media.View} Returns itself to allow chaining
	 */
	remove: function() {
		this.dispose();
		/**
		 * call 'remove' directly on the parent class
		 */
		return wp.Backbone.View.prototype.remove.apply( this, arguments );
	}
});

module.exports = View;

},{}]},{},[19])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvY29sbGVjdGlvbi1hZGQuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvY29sbGVjdGlvbi1lZGl0LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL2NvbnRyb2xsZXJzL2Nyb3BwZXIuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvY3VzdG9taXplLWltYWdlLWNyb3BwZXIuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvZWRpdC1pbWFnZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9lbWJlZC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9mZWF0dXJlZC1pbWFnZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9nYWxsZXJ5LWFkZC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9nYWxsZXJ5LWVkaXQuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvaW1hZ2UtZGV0YWlscy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9saWJyYXJ5LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL2NvbnRyb2xsZXJzL21lZGlhLWxpYnJhcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvcmVnaW9uLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL2NvbnRyb2xsZXJzL3JlcGxhY2UtaW1hZ2UuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvc2l0ZS1pY29uLWNyb3BwZXIuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvc3RhdGUtbWFjaGluZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9zdGF0ZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS91dGlscy9zZWxlY3Rpb24tc3luYy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy5tYW5pZmVzdC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50LWNvbXBhdC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC1maWx0ZXJzL2FsbC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMvZGF0ZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMvdXBsb2FkZWQuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50L2RldGFpbHMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC9lZGl0LWxpYnJhcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC9lZGl0LXNlbGVjdGlvbi5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50L2xpYnJhcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC9zZWxlY3Rpb24uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudHMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudHMvYnJvd3Nlci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50cy9zZWxlY3Rpb24uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYnV0dG9uLWdyb3VwLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2J1dHRvbi5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9jcm9wcGVyLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2VkaXQtaW1hZ2UuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZW1iZWQuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZW1iZWQvaW1hZ2UuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZW1iZWQvbGluay5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9lbWJlZC91cmwuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZm9jdXMtbWFuYWdlci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9mcmFtZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9mcmFtZS9pbWFnZS1kZXRhaWxzLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2ZyYW1lL3Bvc3QuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZnJhbWUvc2VsZWN0LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2lmcmFtZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9pbWFnZS1kZXRhaWxzLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2xhYmVsLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL21lZGlhLWZyYW1lLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL21lbnUtaXRlbS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9tZW51LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL21vZGFsLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3ByaW9yaXR5LWxpc3QuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvcm91dGVyLWl0ZW0uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvcm91dGVyLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3NlYXJjaC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9zZWxlY3Rpb24uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvc2V0dGluZ3MuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvc2V0dGluZ3MvYXR0YWNobWVudC1kaXNwbGF5LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3NldHRpbmdzL2dhbGxlcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvc2V0dGluZ3MvcGxheWxpc3QuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvc2lkZWJhci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9zaXRlLWljb24tY3JvcHBlci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9zaXRlLWljb24tcHJldmlldy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9zcGlubmVyLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3Rvb2xiYXIuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvdG9vbGJhci9lbWJlZC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy90b29sYmFyL3NlbGVjdC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy91cGxvYWRlci9lZGl0b3IuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvdXBsb2FkZXIvaW5saW5lLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3VwbG9hZGVyL3N0YXR1cy1lcnJvci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy91cGxvYWRlci9zdGF0dXMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvdXBsb2FkZXIvd2luZG93LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3ZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzd0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkNvbGxlY3Rpb25BZGRcbiAqXG4gKiBBIHN0YXRlIGZvciBhZGRpbmcgYXR0YWNobWVudHMgdG8gYSBjb2xsZWN0aW9uIChlLmcuIHZpZGVvIHBsYXlsaXN0KS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnlcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlc10gICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGF0dHJpYnV0ZXMgaGFzaCBwYXNzZWQgdG8gdGhlIHN0YXRlLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuaWQ9bGlicmFyeV0gICAgICBVbmlxdWUgaWRlbnRpZmllci5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMudGl0bGUgICAgICAgICAgICAgICAgICAgIFRpdGxlIGZvciB0aGUgc3RhdGUuIERpc3BsYXlzIGluIHRoZSBmcmFtZSdzIHRpdGxlIHJlZ2lvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm11bHRpcGxlPWFkZF0gICAgICAgICAgICBXaGV0aGVyIG11bHRpLXNlbGVjdCBpcyBlbmFibGVkLiBAdG9kbyAnYWRkJyBkb2Vzbid0IHNlZW0gZG8gYW55dGhpbmcgc3BlY2lhbCwgYW5kIGdldHMgdXNlZCBhcyBhIGJvb2xlYW4uXG4gKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzfSBbYXR0cmlidXRlcy5saWJyYXJ5XSAgICAgICAgICAgICAgICAgVGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24gdG8gYnJvd3NlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElmIG9uZSBpcyBub3Qgc3VwcGxpZWQsIGEgY29sbGVjdGlvbiBvZiBhdHRhY2htZW50cyBvZiB0aGUgc3BlY2lmaWVkIHR5cGUgd2lsbCBiZSBjcmVhdGVkLlxuICogQHBhcmFtIHtib29sZWFufHN0cmluZ30gICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZmlsdGVyYWJsZT11cGxvYWRlZF0gICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgZmlsdGVyYWJsZSwgYW5kIGlmIHNvIHdoYXQgZmlsdGVycyBzaG91bGQgYmUgc2hvd24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWNjZXB0cyAnYWxsJywgJ3VwbG9hZGVkJywgb3IgJ3VuYXR0YWNoZWQnLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubWVudT1nYWxsZXJ5XSAgICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIG1lbnUgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudD11cGxvYWRdICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE92ZXJyaWRkZW4gYnkgcGVyc2lzdGVudCB1c2VyIHNldHRpbmcgaWYgJ2NvbnRlbnRVc2VyU2V0dGluZycgaXMgdHJ1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnJvdXRlcj1icm93c2VdICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSByb3V0ZXIgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudG9vbGJhcj1nYWxsZXJ5LWFkZF0gICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHRvb2xiYXIgcmVnaW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc2VhcmNoYWJsZT10cnVlXSAgICAgICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgc2VhcmNoYWJsZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNvcnRhYmxlPXRydWVdICAgICAgICAgICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzaG91bGQgYmUgc29ydGFibGUuIERlcGVuZHMgb24gdGhlIG9yZGVyYnkgcHJvcGVydHkgYmVpbmcgc2V0IHRvIG1lbnVPcmRlciBvbiB0aGUgYXR0YWNobWVudHMgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmF1dG9TZWxlY3Q9dHJ1ZV0gICAgICAgICBXaGV0aGVyIGFuIHVwbG9hZGVkIGF0dGFjaG1lbnQgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgYWRkZWQgdG8gdGhlIHNlbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnRVc2VyU2V0dGluZz10cnVlXSBXaGV0aGVyIHRoZSBjb250ZW50IHJlZ2lvbidzIG1vZGUgc2hvdWxkIGJlIHNldCBhbmQgcGVyc2lzdGVkIHBlciB1c2VyLlxuICogQHBhcmFtIHtpbnR9ICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucHJpb3JpdHk9MTAwXSAgICAgICAgICAgIFRoZSBwcmlvcml0eSBmb3IgdGhlIHN0YXRlIGxpbmsgaW4gdGhlIG1lZGlhIG1lbnUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zeW5jU2VsZWN0aW9uPWZhbHNlXSAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2VsZWN0aW9uIHNob3VsZCBiZSBwZXJzaXN0ZWQgZnJvbSB0aGUgbGFzdCBzdGF0ZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0cyB0byBmYWxzZSBiZWNhdXNlIGZvciB0aGlzIHN0YXRlLCBiZWNhdXNlIHRoZSBsaWJyYXJ5IG9mIHRoZSBFZGl0IEdhbGxlcnkgc3RhdGUgaXMgdGhlIHNlbGVjdGlvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMudHlwZSAgICAgICAgICAgICAgICAgICBUaGUgY29sbGVjdGlvbidzIG1lZGlhIHR5cGUuIChlLmcuICd2aWRlbycpLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcy5jb2xsZWN0aW9uVHlwZSAgICAgICAgIFRoZSBjb2xsZWN0aW9uIHR5cGUuIChlLmcuICdwbGF5bGlzdCcpLlxuICovXG52YXIgU2VsZWN0aW9uID0gd3AubWVkaWEubW9kZWwuU2VsZWN0aW9uLFxuXHRMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXHRDb2xsZWN0aW9uQWRkO1xuXG5Db2xsZWN0aW9uQWRkID0gTGlicmFyeS5leHRlbmQoe1xuXHRkZWZhdWx0czogXy5kZWZhdWx0cygge1xuXHRcdC8vIFNlbGVjdGlvbiBkZWZhdWx0cy4gQHNlZSBtZWRpYS5tb2RlbC5TZWxlY3Rpb25cblx0XHRtdWx0aXBsZTogICAgICAnYWRkJyxcblx0XHQvLyBBdHRhY2htZW50cyBicm93c2VyIGRlZmF1bHRzLiBAc2VlIG1lZGlhLnZpZXcuQXR0YWNobWVudHNCcm93c2VyXG5cdFx0ZmlsdGVyYWJsZTogICAgJ3VwbG9hZGVkJyxcblxuXHRcdHByaW9yaXR5OiAgICAgIDEwMCxcblx0XHRzeW5jU2VsZWN0aW9uOiBmYWxzZVxuXHR9LCBMaWJyYXJ5LnByb3RvdHlwZS5kZWZhdWx0cyApLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb2xsZWN0aW9uVHlwZSA9IHRoaXMuZ2V0KCdjb2xsZWN0aW9uVHlwZScpO1xuXG5cdFx0aWYgKCAndmlkZW8nID09PSB0aGlzLmdldCggJ3R5cGUnICkgKSB7XG5cdFx0XHRjb2xsZWN0aW9uVHlwZSA9ICd2aWRlby0nICsgY29sbGVjdGlvblR5cGU7XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXQoICdpZCcsIGNvbGxlY3Rpb25UeXBlICsgJy1saWJyYXJ5JyApO1xuXHRcdHRoaXMuc2V0KCAndG9vbGJhcicsIGNvbGxlY3Rpb25UeXBlICsgJy1hZGQnICk7XG5cdFx0dGhpcy5zZXQoICdtZW51JywgY29sbGVjdGlvblR5cGUgKTtcblxuXHRcdC8vIElmIHdlIGhhdmVuJ3QgYmVlbiBwcm92aWRlZCBhIGBsaWJyYXJ5YCwgY3JlYXRlIGEgYFNlbGVjdGlvbmAuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdsaWJyYXJ5JykgKSB7XG5cdFx0XHR0aGlzLnNldCggJ2xpYnJhcnknLCB3cC5tZWRpYS5xdWVyeSh7IHR5cGU6IHRoaXMuZ2V0KCd0eXBlJykgfSkgKTtcblx0XHR9XG5cdFx0TGlicmFyeS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjkuMFxuXHQgKi9cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsaWJyYXJ5ID0gdGhpcy5nZXQoJ2xpYnJhcnknKSxcblx0XHRcdGVkaXRMaWJyYXJ5ID0gdGhpcy5nZXQoJ2VkaXRMaWJyYXJ5JyksXG5cdFx0XHRlZGl0ID0gdGhpcy5mcmFtZS5zdGF0ZSggdGhpcy5nZXQoJ2NvbGxlY3Rpb25UeXBlJykgKyAnLWVkaXQnICkuZ2V0KCdsaWJyYXJ5Jyk7XG5cblx0XHRpZiAoIGVkaXRMaWJyYXJ5ICYmIGVkaXRMaWJyYXJ5ICE9PSBlZGl0ICkge1xuXHRcdFx0bGlicmFyeS51bm9ic2VydmUoIGVkaXRMaWJyYXJ5ICk7XG5cdFx0fVxuXG5cdFx0Ly8gQWNjZXB0cyBhdHRhY2htZW50cyB0aGF0IGV4aXN0IGluIHRoZSBvcmlnaW5hbCBsaWJyYXJ5IGFuZFxuXHRcdC8vIHRoYXQgZG8gbm90IGV4aXN0IGluIGdhbGxlcnkncyBsaWJyYXJ5LlxuXHRcdGxpYnJhcnkudmFsaWRhdG9yID0gZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gISEgdGhpcy5taXJyb3JpbmcuZ2V0KCBhdHRhY2htZW50LmNpZCApICYmICEgZWRpdC5nZXQoIGF0dGFjaG1lbnQuY2lkICkgJiYgU2VsZWN0aW9uLnByb3RvdHlwZS52YWxpZGF0b3IuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdH07XG5cblx0XHQvLyBSZXNldCB0aGUgbGlicmFyeSB0byBlbnN1cmUgdGhhdCBhbGwgYXR0YWNobWVudHMgYXJlIHJlLWFkZGVkXG5cdFx0Ly8gdG8gdGhlIGNvbGxlY3Rpb24uIERvIHNvIHNpbGVudGx5LCBhcyBjYWxsaW5nIGBvYnNlcnZlYCB3aWxsXG5cdFx0Ly8gdHJpZ2dlciB0aGUgYHJlc2V0YCBldmVudC5cblx0XHRsaWJyYXJ5LnJlc2V0KCBsaWJyYXJ5Lm1pcnJvcmluZy5tb2RlbHMsIHsgc2lsZW50OiB0cnVlIH0pO1xuXHRcdGxpYnJhcnkub2JzZXJ2ZSggZWRpdCApO1xuXHRcdHRoaXMuc2V0KCdlZGl0TGlicmFyeScsIGVkaXQpO1xuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuYWN0aXZhdGUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uQWRkO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkNvbGxlY3Rpb25FZGl0XG4gKlxuICogQSBzdGF0ZSBmb3IgZWRpdGluZyBhIGNvbGxlY3Rpb24sIHdoaWNoIGlzIHVzZWQgYnkgYXVkaW8gYW5kIHZpZGVvIHBsYXlsaXN0cyxcbiAqIGFuZCBjYW4gYmUgdXNlZCBmb3Igb3RoZXIgY29sbGVjdGlvbnMuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXNdICAgICAgICAgICAgICAgICAgICAgIFRoZSBhdHRyaWJ1dGVzIGhhc2ggcGFzc2VkIHRvIHRoZSBzdGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMudGl0bGUgICAgICAgICAgICAgICAgICBUaXRsZSBmb3IgdGhlIHN0YXRlLiBEaXNwbGF5cyBpbiB0aGUgbWVkaWEgbWVudSBhbmQgdGhlIGZyYW1lJ3MgdGl0bGUgcmVnaW9uLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gW2F0dHJpYnV0ZXMubGlicmFyeV0gICAgICAgICAgICAgIFRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uIHRvIGVkaXQuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgb25lIGlzIG5vdCBzdXBwbGllZCwgYW4gZW1wdHkgbWVkaWEubW9kZWwuU2VsZWN0aW9uIGNvbGxlY3Rpb24gaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm11bHRpcGxlPWZhbHNlXSAgICAgICBXaGV0aGVyIG11bHRpLXNlbGVjdCBpcyBlbmFibGVkLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudD1icm93c2VdICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcy5tZW51ICAgICAgICAgICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIG1lbnUgcmVnaW9uLiBAdG9kbyB0aGlzIG5lZWRzIGEgYmV0dGVyIGV4cGxhbmF0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc2VhcmNoYWJsZT1mYWxzZV0gICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgc2VhcmNoYWJsZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNvcnRhYmxlPXRydWVdICAgICAgICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzaG91bGQgYmUgc29ydGFibGUuIERlcGVuZHMgb24gdGhlIG9yZGVyYnkgcHJvcGVydHkgYmVpbmcgc2V0IHRvIG1lbnVPcmRlciBvbiB0aGUgYXR0YWNobWVudHMgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmRhdGU9dHJ1ZV0gICAgICAgICAgICBXaGV0aGVyIHRvIHNob3cgdGhlIGRhdGUgZmlsdGVyIGluIHRoZSBicm93c2VyJ3MgdG9vbGJhci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmRlc2NyaWJlPXRydWVdICAgICAgICBXaGV0aGVyIHRvIG9mZmVyIFVJIHRvIGRlc2NyaWJlIHRoZSBhdHRhY2htZW50cyAtIGUuZy4gY2FwdGlvbmluZyBpbWFnZXMgaW4gYSBnYWxsZXJ5LlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZHJhZ0luZm89dHJ1ZV0gICAgICAgIFdoZXRoZXIgdG8gc2hvdyBpbnN0cnVjdGlvbmFsIHRleHQgYWJvdXQgdGhlIGF0dGFjaG1lbnRzIGJlaW5nIHNvcnRhYmxlLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZHJhZ0luZm9UZXh0XSAgICAgICAgIEluc3RydWN0aW9uYWwgdGV4dCBhYm91dCB0aGUgYXR0YWNobWVudHMgYmVpbmcgc29ydGFibGUuXG4gKiBAcGFyYW0ge2ludH0gICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZGVhbENvbHVtbldpZHRoPTE3MF0gVGhlIGlkZWFsIGNvbHVtbiB3aWR0aCBpbiBwaXhlbHMgZm9yIGF0dGFjaG1lbnRzLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZWRpdGluZz1mYWxzZV0gICAgICAgIFdoZXRoZXIgdGhlIGdhbGxlcnkgaXMgYmVpbmcgY3JlYXRlZCwgb3IgZWRpdGluZyBhbiBleGlzdGluZyBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7aW50fSAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnByaW9yaXR5PTYwXSAgICAgICAgICBUaGUgcHJpb3JpdHkgZm9yIHRoZSBzdGF0ZSBsaW5rIGluIHRoZSBtZWRpYSBtZW51LlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc3luY1NlbGVjdGlvbj1mYWxzZV0gIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNlbGVjdGlvbiBzaG91bGQgYmUgcGVyc2lzdGVkIGZyb20gdGhlIGxhc3Qgc3RhdGUuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGVmYXVsdHMgdG8gZmFsc2UgZm9yIHRoaXMgc3RhdGUsIGJlY2F1c2UgdGhlIGxpYnJhcnkgcGFzc2VkIGluICAqaXMqIHRoZSBzZWxlY3Rpb24uXG4gKiBAcGFyYW0ge3ZpZXd9ICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5TZXR0aW5nc1ZpZXddICAgICAgICAgVGhlIHZpZXcgdG8gZWRpdCB0aGUgY29sbGVjdGlvbiBpbnN0YW5jZSBzZXR0aW5ncyAoZS5nLiBQbGF5bGlzdCBzZXR0aW5ncyB3aXRoIFwiU2hvdyB0cmFja2xpc3RcIiBjaGVja2JveCkuXG4gKiBAcGFyYW0ge3ZpZXd9ICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5BdHRhY2htZW50Vmlld10gICAgICAgVGhlIHNpbmdsZSBgQXR0YWNobWVudGAgdmlldyB0byBiZSB1c2VkIGluIHRoZSBgQXR0YWNobWVudHNgLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElmIG5vbmUgc3VwcGxpZWQsIGRlZmF1bHRzIHRvIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5FZGl0TGlicmFyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMudHlwZSAgICAgICAgICAgICAgICAgICBUaGUgY29sbGVjdGlvbidzIG1lZGlhIHR5cGUuIChlLmcuICd2aWRlbycpLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcy5jb2xsZWN0aW9uVHlwZSAgICAgICAgIFRoZSBjb2xsZWN0aW9uIHR5cGUuIChlLmcuICdwbGF5bGlzdCcpLlxuICovXG52YXIgTGlicmFyeSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeSxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0JCA9IGpRdWVyeSxcblx0Q29sbGVjdGlvbkVkaXQ7XG5cbkNvbGxlY3Rpb25FZGl0ID0gTGlicmFyeS5leHRlbmQoe1xuXHRkZWZhdWx0czoge1xuXHRcdG11bHRpcGxlOiAgICAgICAgIGZhbHNlLFxuXHRcdHNvcnRhYmxlOiAgICAgICAgIHRydWUsXG5cdFx0ZGF0ZTogICAgICAgICAgICAgZmFsc2UsXG5cdFx0c2VhcmNoYWJsZTogICAgICAgZmFsc2UsXG5cdFx0Y29udGVudDogICAgICAgICAgJ2Jyb3dzZScsXG5cdFx0ZGVzY3JpYmU6ICAgICAgICAgdHJ1ZSxcblx0XHRkcmFnSW5mbzogICAgICAgICB0cnVlLFxuXHRcdGlkZWFsQ29sdW1uV2lkdGg6IDE3MCxcblx0XHRlZGl0aW5nOiAgICAgICAgICBmYWxzZSxcblx0XHRwcmlvcml0eTogICAgICAgICA2MCxcblx0XHRTZXR0aW5nc1ZpZXc6ICAgICBmYWxzZSxcblx0XHRzeW5jU2VsZWN0aW9uOiAgICBmYWxzZVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb2xsZWN0aW9uVHlwZSA9IHRoaXMuZ2V0KCdjb2xsZWN0aW9uVHlwZScpO1xuXG5cdFx0aWYgKCAndmlkZW8nID09PSB0aGlzLmdldCggJ3R5cGUnICkgKSB7XG5cdFx0XHRjb2xsZWN0aW9uVHlwZSA9ICd2aWRlby0nICsgY29sbGVjdGlvblR5cGU7XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXQoICdpZCcsIGNvbGxlY3Rpb25UeXBlICsgJy1lZGl0JyApO1xuXHRcdHRoaXMuc2V0KCAndG9vbGJhcicsIGNvbGxlY3Rpb25UeXBlICsgJy1lZGl0JyApO1xuXG5cdFx0Ly8gSWYgd2UgaGF2ZW4ndCBiZWVuIHByb3ZpZGVkIGEgYGxpYnJhcnlgLCBjcmVhdGUgYSBgU2VsZWN0aW9uYC5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ2xpYnJhcnknKSApIHtcblx0XHRcdHRoaXMuc2V0KCAnbGlicmFyeScsIG5ldyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24oKSApO1xuXHRcdH1cblx0XHQvLyBUaGUgc2luZ2xlIGBBdHRhY2htZW50YCB2aWV3IHRvIGJlIHVzZWQgaW4gdGhlIGBBdHRhY2htZW50c2Agdmlldy5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ0F0dGFjaG1lbnRWaWV3JykgKSB7XG5cdFx0XHR0aGlzLnNldCggJ0F0dGFjaG1lbnRWaWV3Jywgd3AubWVkaWEudmlldy5BdHRhY2htZW50LkVkaXRMaWJyYXJ5ICk7XG5cdFx0fVxuXHRcdExpYnJhcnkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGlicmFyeSA9IHRoaXMuZ2V0KCdsaWJyYXJ5Jyk7XG5cblx0XHQvLyBMaW1pdCB0aGUgbGlicmFyeSB0byBpbWFnZXMgb25seS5cblx0XHRsaWJyYXJ5LnByb3BzLnNldCggJ3R5cGUnLCB0aGlzLmdldCggJ3R5cGUnICkgKTtcblxuXHRcdC8vIFdhdGNoIGZvciB1cGxvYWRlZCBhdHRhY2htZW50cy5cblx0XHR0aGlzLmdldCgnbGlicmFyeScpLm9ic2VydmUoIHdwLlVwbG9hZGVyLnF1ZXVlICk7XG5cblx0XHR0aGlzLmZyYW1lLm9uKCAnY29udGVudDpyZW5kZXI6YnJvd3NlJywgdGhpcy5yZW5kZXJTZXR0aW5ncywgdGhpcyApO1xuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuYWN0aXZhdGUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGRlYWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIFN0b3Agd2F0Y2hpbmcgZm9yIHVwbG9hZGVkIGF0dGFjaG1lbnRzLlxuXHRcdHRoaXMuZ2V0KCdsaWJyYXJ5JykudW5vYnNlcnZlKCB3cC5VcGxvYWRlci5xdWV1ZSApO1xuXG5cdFx0dGhpcy5mcmFtZS5vZmYoICdjb250ZW50OnJlbmRlcjpicm93c2UnLCB0aGlzLnJlbmRlclNldHRpbmdzLCB0aGlzICk7XG5cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5kZWFjdGl2YXRlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogUmVuZGVyIHRoZSBjb2xsZWN0aW9uIGVtYmVkIHNldHRpbmdzIHZpZXcgaW4gdGhlIGJyb3dzZXIgc2lkZWJhci5cblx0ICpcblx0ICogQHRvZG8gVGhpcyBpcyBhZ2FpbnN0IHRoZSBwYXR0ZXJuIGVsc2V3aGVyZSBpbiBtZWRpYS4gVHlwaWNhbGx5IHRoZSBmcmFtZVxuXHQgKiAgICAgICBpcyByZXNwb25zaWJsZSBmb3IgYWRkaW5nIHJlZ2lvbiBtb2RlIGNhbGxiYWNrcy4gRXhwbGFpbi5cblx0ICpcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEudmlldy5hdHRhY2htZW50c0Jyb3dzZXJ9IFRoZSBhdHRhY2htZW50cyBicm93c2VyIHZpZXcuXG5cdCAqL1xuXHRyZW5kZXJTZXR0aW5nczogZnVuY3Rpb24oIGF0dGFjaG1lbnRzQnJvd3NlclZpZXcgKSB7XG5cdFx0dmFyIGxpYnJhcnkgPSB0aGlzLmdldCgnbGlicmFyeScpLFxuXHRcdFx0Y29sbGVjdGlvblR5cGUgPSB0aGlzLmdldCgnY29sbGVjdGlvblR5cGUnKSxcblx0XHRcdGRyYWdJbmZvVGV4dCA9IHRoaXMuZ2V0KCdkcmFnSW5mb1RleHQnKSxcblx0XHRcdFNldHRpbmdzVmlldyA9IHRoaXMuZ2V0KCdTZXR0aW5nc1ZpZXcnKSxcblx0XHRcdG9iaiA9IHt9O1xuXG5cdFx0aWYgKCAhIGxpYnJhcnkgfHwgISBhdHRhY2htZW50c0Jyb3dzZXJWaWV3ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxpYnJhcnlbIGNvbGxlY3Rpb25UeXBlIF0gPSBsaWJyYXJ5WyBjb2xsZWN0aW9uVHlwZSBdIHx8IG5ldyBCYWNrYm9uZS5Nb2RlbCgpO1xuXG5cdFx0b2JqWyBjb2xsZWN0aW9uVHlwZSBdID0gbmV3IFNldHRpbmdzVmlldyh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0bW9kZWw6ICAgICAgbGlicmFyeVsgY29sbGVjdGlvblR5cGUgXSxcblx0XHRcdHByaW9yaXR5OiAgIDQwXG5cdFx0fSk7XG5cblx0XHRhdHRhY2htZW50c0Jyb3dzZXJWaWV3LnNpZGViYXIuc2V0KCBvYmogKTtcblxuXHRcdGlmICggZHJhZ0luZm9UZXh0ICkge1xuXHRcdFx0YXR0YWNobWVudHNCcm93c2VyVmlldy50b29sYmFyLnNldCggJ2RyYWdJbmZvJywgbmV3IHdwLm1lZGlhLlZpZXcoe1xuXHRcdFx0XHRlbDogJCggJzxkaXYgY2xhc3M9XCJpbnN0cnVjdGlvbnNcIj4nICsgZHJhZ0luZm9UZXh0ICsgJzwvZGl2PicgKVswXSxcblx0XHRcdFx0cHJpb3JpdHk6IC00MFxuXHRcdFx0fSkgKTtcblx0XHR9XG5cblx0XHQvLyBBZGQgdGhlICdSZXZlcnNlIG9yZGVyJyBidXR0b24gdG8gdGhlIHRvb2xiYXIuXG5cdFx0YXR0YWNobWVudHNCcm93c2VyVmlldy50b29sYmFyLnNldCggJ3JldmVyc2UnLCB7XG5cdFx0XHR0ZXh0OiAgICAgbDEwbi5yZXZlcnNlT3JkZXIsXG5cdFx0XHRwcmlvcml0eTogODAsXG5cblx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0bGlicmFyeS5yZXNldCggbGlicmFyeS50b0FycmF5KCkucmV2ZXJzZSgpICk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxlY3Rpb25FZGl0O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkNyb3BwZXJcbiAqXG4gKiBBIHN0YXRlIGZvciBjcm9wcGluZyBhbiBpbWFnZS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqL1xudmFyIGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdENyb3BwZXI7XG5cbkNyb3BwZXIgPSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlLmV4dGVuZCh7XG5cdGRlZmF1bHRzOiB7XG5cdFx0aWQ6ICAgICAgICAgICdjcm9wcGVyJyxcblx0XHR0aXRsZTogICAgICAgbDEwbi5jcm9wSW1hZ2UsXG5cdFx0Ly8gUmVnaW9uIG1vZGUgZGVmYXVsdHMuXG5cdFx0dG9vbGJhcjogICAgICdjcm9wJyxcblx0XHRjb250ZW50OiAgICAgJ2Nyb3AnLFxuXHRcdHJvdXRlcjogICAgICBmYWxzZSxcblx0XHRjYW5Ta2lwQ3JvcDogZmFsc2UsXG5cblx0XHQvLyBEZWZhdWx0IGRvQ3JvcCBBamF4IGFyZ3VtZW50cyB0byBhbGxvdyB0aGUgQ3VzdG9taXplciAoZm9yIGV4YW1wbGUpIHRvIGluamVjdCBzdGF0ZS5cblx0XHRkb0Nyb3BBcmdzOiB7fVxuXHR9LFxuXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZyYW1lLm9uKCAnY29udGVudDpjcmVhdGU6Y3JvcCcsIHRoaXMuY3JlYXRlQ3JvcENvbnRlbnQsIHRoaXMgKTtcblx0XHR0aGlzLmZyYW1lLm9uKCAnY2xvc2UnLCB0aGlzLnJlbW92ZUNyb3BwZXIsIHRoaXMgKTtcblx0XHR0aGlzLnNldCgnc2VsZWN0aW9uJywgbmV3IEJhY2tib25lLkNvbGxlY3Rpb24odGhpcy5mcmFtZS5fc2VsZWN0aW9uLnNpbmdsZSkpO1xuXHR9LFxuXG5cdGRlYWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZnJhbWUudG9vbGJhci5tb2RlKCdicm93c2UnKTtcblx0fSxcblxuXHRjcmVhdGVDcm9wQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcm9wcGVyVmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LkNyb3BwZXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGF0dGFjaG1lbnQ6IHRoaXMuZ2V0KCdzZWxlY3Rpb24nKS5maXJzdCgpXG5cdFx0fSk7XG5cdFx0dGhpcy5jcm9wcGVyVmlldy5vbignaW1hZ2UtbG9hZGVkJywgdGhpcy5jcmVhdGVDcm9wVG9vbGJhciwgdGhpcyk7XG5cdFx0dGhpcy5mcmFtZS5jb250ZW50LnNldCh0aGlzLmNyb3BwZXJWaWV3KTtcblxuXHR9LFxuXHRyZW1vdmVDcm9wcGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmltZ1NlbGVjdC5jYW5jZWxTZWxlY3Rpb24oKTtcblx0XHR0aGlzLmltZ1NlbGVjdC5zZXRPcHRpb25zKHtyZW1vdmU6IHRydWV9KTtcblx0XHR0aGlzLmltZ1NlbGVjdC51cGRhdGUoKTtcblx0XHR0aGlzLmNyb3BwZXJWaWV3LnJlbW92ZSgpO1xuXHR9LFxuXHRjcmVhdGVDcm9wVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNhblNraXBDcm9wLCB0b29sYmFyT3B0aW9ucztcblxuXHRcdGNhblNraXBDcm9wID0gdGhpcy5nZXQoJ2NhblNraXBDcm9wJykgfHwgZmFsc2U7XG5cblx0XHR0b29sYmFyT3B0aW9ucyA9IHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuZnJhbWUsXG5cdFx0XHRpdGVtczoge1xuXHRcdFx0XHRpbnNlcnQ6IHtcblx0XHRcdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0XHRcdHRleHQ6ICAgICBsMTBuLmNyb3BJbWFnZSxcblx0XHRcdFx0XHRwcmlvcml0eTogODAsXG5cdFx0XHRcdFx0cmVxdWlyZXM6IHsgbGlicmFyeTogZmFsc2UsIHNlbGVjdGlvbjogZmFsc2UgfSxcblxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzZWxlY3Rpb247XG5cblx0XHRcdFx0XHRcdHNlbGVjdGlvbiA9IGNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpLmZpcnN0KCk7XG5cdFx0XHRcdFx0XHRzZWxlY3Rpb24uc2V0KHtjcm9wRGV0YWlsczogY29udHJvbGxlci5zdGF0ZSgpLmltZ1NlbGVjdC5nZXRTZWxlY3Rpb24oKX0pO1xuXG5cdFx0XHRcdFx0XHR0aGlzLiRlbC50ZXh0KGwxMG4uY3JvcHBpbmcpO1xuXHRcdFx0XHRcdFx0dGhpcy4kZWwuYXR0cignZGlzYWJsZWQnLCB0cnVlKTtcblxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zdGF0ZSgpLmRvQ3JvcCggc2VsZWN0aW9uICkuZG9uZSggZnVuY3Rpb24oIGNyb3BwZWRJbWFnZSApIHtcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci50cmlnZ2VyKCdjcm9wcGVkJywgY3JvcHBlZEltYWdlICk7XG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblx0XHRcdFx0XHRcdH0pLmZhaWwoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRjb250cm9sbGVyLnRyaWdnZXIoJ2NvbnRlbnQ6ZXJyb3I6Y3JvcCcpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGlmICggY2FuU2tpcENyb3AgKSB7XG5cdFx0XHRfLmV4dGVuZCggdG9vbGJhck9wdGlvbnMuaXRlbXMsIHtcblx0XHRcdFx0c2tpcDoge1xuXHRcdFx0XHRcdHN0eWxlOiAgICAgICdzZWNvbmRhcnknLFxuXHRcdFx0XHRcdHRleHQ6ICAgICAgIGwxMG4uc2tpcENyb3BwaW5nLFxuXHRcdFx0XHRcdHByaW9yaXR5OiAgIDcwLFxuXHRcdFx0XHRcdHJlcXVpcmVzOiAgIHsgbGlicmFyeTogZmFsc2UsIHNlbGVjdGlvbjogZmFsc2UgfSxcblx0XHRcdFx0XHRjbGljazogICAgICBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpLmZpcnN0KCk7XG5cdFx0XHRcdFx0XHR0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5jcm9wcGVyVmlldy5yZW1vdmUoKTtcblx0XHRcdFx0XHRcdHRoaXMuY29udHJvbGxlci50cmlnZ2VyKCdza2lwcGVkY3JvcCcsIHNlbGVjdGlvbik7XG5cdFx0XHRcdFx0XHR0aGlzLmNvbnRyb2xsZXIuY2xvc2UoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHRoaXMuZnJhbWUudG9vbGJhci5zZXQoIG5ldyB3cC5tZWRpYS52aWV3LlRvb2xiYXIodG9vbGJhck9wdGlvbnMpICk7XG5cdH0sXG5cblx0ZG9Dcm9wOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHRyZXR1cm4gd3AuYWpheC5wb3N0KCAnY3VzdG9tLWhlYWRlci1jcm9wJywgXy5leHRlbmQoXG5cdFx0XHR7fSxcblx0XHRcdHRoaXMuZGVmYXVsdHMuZG9Dcm9wQXJncyxcblx0XHRcdHtcblx0XHRcdFx0bm9uY2U6IGF0dGFjaG1lbnQuZ2V0KCAnbm9uY2VzJyApLmVkaXQsXG5cdFx0XHRcdGlkOiBhdHRhY2htZW50LmdldCggJ2lkJyApLFxuXHRcdFx0XHRjcm9wRGV0YWlsczogYXR0YWNobWVudC5nZXQoICdjcm9wRGV0YWlscycgKVxuXHRcdFx0fVxuXHRcdCkgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ3JvcHBlcjtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5DdXN0b21pemVJbWFnZUNyb3BwZXJcbiAqXG4gKiBBIHN0YXRlIGZvciBjcm9wcGluZyBhbiBpbWFnZS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLkNyb3BwZXJcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqL1xudmFyIENvbnRyb2xsZXIgPSB3cC5tZWRpYS5jb250cm9sbGVyLFxuXHRDdXN0b21pemVJbWFnZUNyb3BwZXI7XG5cbkN1c3RvbWl6ZUltYWdlQ3JvcHBlciA9IENvbnRyb2xsZXIuQ3JvcHBlci5leHRlbmQoe1xuXHRkb0Nyb3A6IGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdHZhciBjcm9wRGV0YWlscyA9IGF0dGFjaG1lbnQuZ2V0KCAnY3JvcERldGFpbHMnICksXG5cdFx0XHRjb250cm9sID0gdGhpcy5nZXQoICdjb250cm9sJyApLFxuXHRcdFx0cmF0aW8gPSBjcm9wRGV0YWlscy53aWR0aCAvIGNyb3BEZXRhaWxzLmhlaWdodDtcblxuXHRcdC8vIFVzZSBjcm9wIG1lYXN1cmVtZW50cyB3aGVuIGZsZXhpYmxlIGluIGJvdGggZGlyZWN0aW9ucy5cblx0XHRpZiAoIGNvbnRyb2wucGFyYW1zLmZsZXhfd2lkdGggJiYgY29udHJvbC5wYXJhbXMuZmxleF9oZWlnaHQgKSB7XG5cdFx0XHRjcm9wRGV0YWlscy5kc3Rfd2lkdGggID0gY3JvcERldGFpbHMud2lkdGg7XG5cdFx0XHRjcm9wRGV0YWlscy5kc3RfaGVpZ2h0ID0gY3JvcERldGFpbHMuaGVpZ2h0O1xuXG5cdFx0Ly8gQ29uc3RyYWluIGZsZXhpYmxlIHNpZGUgYmFzZWQgb24gaW1hZ2UgcmF0aW8gYW5kIHNpemUgb2YgdGhlIGZpeGVkIHNpZGUuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNyb3BEZXRhaWxzLmRzdF93aWR0aCAgPSBjb250cm9sLnBhcmFtcy5mbGV4X3dpZHRoICA/IGNvbnRyb2wucGFyYW1zLmhlaWdodCAqIHJhdGlvIDogY29udHJvbC5wYXJhbXMud2lkdGg7XG5cdFx0XHRjcm9wRGV0YWlscy5kc3RfaGVpZ2h0ID0gY29udHJvbC5wYXJhbXMuZmxleF9oZWlnaHQgPyBjb250cm9sLnBhcmFtcy53aWR0aCAgLyByYXRpbyA6IGNvbnRyb2wucGFyYW1zLmhlaWdodDtcblx0XHR9XG5cblx0XHRyZXR1cm4gd3AuYWpheC5wb3N0KCAnY3JvcC1pbWFnZScsIHtcblx0XHRcdHdwX2N1c3RvbWl6ZTogJ29uJyxcblx0XHRcdG5vbmNlOiBhdHRhY2htZW50LmdldCggJ25vbmNlcycgKS5lZGl0LFxuXHRcdFx0aWQ6IGF0dGFjaG1lbnQuZ2V0KCAnaWQnICksXG5cdFx0XHRjb250ZXh0OiBjb250cm9sLmlkLFxuXHRcdFx0Y3JvcERldGFpbHM6IGNyb3BEZXRhaWxzXG5cdFx0fSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDdXN0b21pemVJbWFnZUNyb3BwZXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuRWRpdEltYWdlXG4gKlxuICogQSBzdGF0ZSBmb3IgZWRpdGluZyAoY3JvcHBpbmcsIGV0Yy4pIGFuIGltYWdlLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcyAgICAgICAgICAgICAgICAgICAgICBUaGUgYXR0cmlidXRlcyBoYXNoIHBhc3NlZCB0byB0aGUgc3RhdGUuXG4gKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dHJpYnV0ZXMubW9kZWwgICAgICAgICAgICAgICAgVGhlIGF0dGFjaG1lbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmlkPWVkaXQtaW1hZ2VdICAgICAgVW5pcXVlIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRpdGxlPUVkaXQgSW1hZ2VdICAgVGl0bGUgZm9yIHRoZSBzdGF0ZS4gRGlzcGxheXMgaW4gdGhlIG1lZGlhIG1lbnUgYW5kIHRoZSBmcmFtZSdzIHRpdGxlIHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudD1lZGl0LWltYWdlXSBJbml0aWFsIG1vZGUgZm9yIHRoZSBjb250ZW50IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudG9vbGJhcj1lZGl0LWltYWdlXSBJbml0aWFsIG1vZGUgZm9yIHRoZSB0b29sYmFyIHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubWVudT1mYWxzZV0gICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBtZW51IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudXJsXSAgICAgICAgICAgICAgICBVbnVzZWQuIEB0b2RvIENvbnNpZGVyIHJlbW92YWwuXG4gKi9cbnZhciBsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRFZGl0SW1hZ2U7XG5cbkVkaXRJbWFnZSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IHtcblx0XHRpZDogICAgICAnZWRpdC1pbWFnZScsXG5cdFx0dGl0bGU6ICAgbDEwbi5lZGl0SW1hZ2UsXG5cdFx0bWVudTogICAgZmFsc2UsXG5cdFx0dG9vbGJhcjogJ2VkaXQtaW1hZ2UnLFxuXHRcdGNvbnRlbnQ6ICdlZGl0LWltYWdlJyxcblx0XHR1cmw6ICAgICAnJ1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZyYW1lLm9uKCAndG9vbGJhcjpyZW5kZXI6ZWRpdC1pbWFnZScsIF8uYmluZCggdGhpcy50b29sYmFyLCB0aGlzICkgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZyYW1lLm9mZiggJ3Rvb2xiYXI6cmVuZGVyOmVkaXQtaW1hZ2UnICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjkuMFxuXHQgKi9cblx0dG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZyYW1lID0gdGhpcy5mcmFtZSxcblx0XHRcdGxhc3RTdGF0ZSA9IGZyYW1lLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkO1xuXG5cdFx0ZnJhbWUudG9vbGJhci5zZXQoIG5ldyB3cC5tZWRpYS52aWV3LlRvb2xiYXIoe1xuXHRcdFx0Y29udHJvbGxlcjogZnJhbWUsXG5cdFx0XHRpdGVtczoge1xuXHRcdFx0XHRiYWNrOiB7XG5cdFx0XHRcdFx0c3R5bGU6ICdwcmltYXJ5Jyxcblx0XHRcdFx0XHR0ZXh0OiAgICAgbDEwbi5iYWNrLFxuXHRcdFx0XHRcdHByaW9yaXR5OiAyMCxcblx0XHRcdFx0XHRjbGljazogICAgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAoIHByZXZpb3VzICkge1xuXHRcdFx0XHRcdFx0XHRmcmFtZS5zZXRTdGF0ZSggcHJldmlvdXMgKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGZyYW1lLmNsb3NlKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdEltYWdlO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkVtYmVkXG4gKlxuICogQSBzdGF0ZSBmb3IgZW1iZWRkaW5nIG1lZGlhIGZyb20gYSBVUkwuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IGF0dHJpYnV0ZXMgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGF0dHJpYnV0ZXMgaGFzaCBwYXNzZWQgdG8gdGhlIHN0YXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IFthdHRyaWJ1dGVzLmlkPWVtYmVkXSAgICAgICAgICAgICAgVW5pcXVlIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2F0dHJpYnV0ZXMudGl0bGU9SW5zZXJ0IEZyb20gVVJMXSBUaXRsZSBmb3IgdGhlIHN0YXRlLiBEaXNwbGF5cyBpbiB0aGUgbWVkaWEgbWVudSBhbmQgdGhlIGZyYW1lJ3MgdGl0bGUgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9IFthdHRyaWJ1dGVzLmNvbnRlbnQ9ZW1iZWRdICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgY29udGVudCByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gW2F0dHJpYnV0ZXMubWVudT1kZWZhdWx0XSAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBtZW51IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbYXR0cmlidXRlcy50b29sYmFyPW1haW4tZW1iZWRdICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHRvb2xiYXIgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9IFthdHRyaWJ1dGVzLm1lbnU9ZmFsc2VdICAgICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgbWVudSByZWdpb24uXG4gKiBAcGFyYW0ge2ludH0gICAgW2F0dHJpYnV0ZXMucHJpb3JpdHk9MTIwXSAgICAgICAgICBUaGUgcHJpb3JpdHkgZm9yIHRoZSBzdGF0ZSBsaW5rIGluIHRoZSBtZWRpYSBtZW51LlxuICogQHBhcmFtIHtzdHJpbmd9IFthdHRyaWJ1dGVzLnR5cGU9bGlua10gICAgICAgICAgICAgVGhlIHR5cGUgb2YgZW1iZWQuIEN1cnJlbnRseSBvbmx5IGxpbmsgaXMgc3VwcG9ydGVkLlxuICogQHBhcmFtIHtzdHJpbmd9IFthdHRyaWJ1dGVzLnVybF0gICAgICAgICAgICAgICAgICAgVGhlIGVtYmVkIFVSTC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbYXR0cmlidXRlcy5tZXRhZGF0YT17fV0gICAgICAgICAgIFByb3BlcnRpZXMgb2YgdGhlIGVtYmVkLCB3aGljaCB3aWxsIG92ZXJyaWRlIGF0dHJpYnV0ZXMudXJsIGlmIHNldC5cbiAqL1xudmFyIGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdCQgPSBCYWNrYm9uZS4kLFxuXHRFbWJlZDtcblxuRW1iZWQgPSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlLmV4dGVuZCh7XG5cdGRlZmF1bHRzOiB7XG5cdFx0aWQ6ICAgICAgICdlbWJlZCcsXG5cdFx0dGl0bGU6ICAgIGwxMG4uaW5zZXJ0RnJvbVVybFRpdGxlLFxuXHRcdGNvbnRlbnQ6ICAnZW1iZWQnLFxuXHRcdG1lbnU6ICAgICAnZGVmYXVsdCcsXG5cdFx0dG9vbGJhcjogICdtYWluLWVtYmVkJyxcblx0XHRwcmlvcml0eTogMTIwLFxuXHRcdHR5cGU6ICAgICAnbGluaycsXG5cdFx0dXJsOiAgICAgICcnLFxuXHRcdG1ldGFkYXRhOiB7fVxuXHR9LFxuXG5cdC8vIFRoZSBhbW91bnQgb2YgdGltZSB1c2VkIHdoZW4gZGVib3VuY2luZyB0aGUgc2Nhbi5cblx0c2Vuc2l0aXZpdHk6IDQwMCxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0dGhpcy5tZXRhZGF0YSA9IG9wdGlvbnMubWV0YWRhdGE7XG5cdFx0dGhpcy5kZWJvdW5jZWRTY2FuID0gXy5kZWJvdW5jZSggXy5iaW5kKCB0aGlzLnNjYW4sIHRoaXMgKSwgdGhpcy5zZW5zaXRpdml0eSApO1xuXHRcdHRoaXMucHJvcHMgPSBuZXcgQmFja2JvbmUuTW9kZWwoIHRoaXMubWV0YWRhdGEgfHwgeyB1cmw6ICcnIH0pO1xuXHRcdHRoaXMucHJvcHMub24oICdjaGFuZ2U6dXJsJywgdGhpcy5kZWJvdW5jZWRTY2FuLCB0aGlzICk7XG5cdFx0dGhpcy5wcm9wcy5vbiggJ2NoYW5nZTp1cmwnLCB0aGlzLnJlZnJlc2gsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnc2NhbicsIHRoaXMuc2NhbkltYWdlLCB0aGlzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFRyaWdnZXIgYSBzY2FuIG9mIHRoZSBlbWJlZGRlZCBVUkwncyBjb250ZW50IGZvciBtZXRhZGF0YSByZXF1aXJlZCB0byBlbWJlZC5cblx0ICpcblx0ICogQGZpcmVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuRW1iZWQjc2NhblxuXHQgKi9cblx0c2NhbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNjYW5uZXJzLFxuXHRcdFx0ZW1iZWQgPSB0aGlzLFxuXHRcdFx0YXR0cmlidXRlcyA9IHtcblx0XHRcdFx0dHlwZTogJ2xpbmsnLFxuXHRcdFx0XHRzY2FubmVyczogW11cblx0XHRcdH07XG5cblx0XHQvLyBTY2FuIGlzIHRyaWdnZXJlZCB3aXRoIHRoZSBsaXN0IG9mIGBhdHRyaWJ1dGVzYCB0byBzZXQgb24gdGhlXG5cdFx0Ly8gc3RhdGUsIHVzZWZ1bCBmb3IgdGhlICd0eXBlJyBhdHRyaWJ1dGUgYW5kICdzY2FubmVycycgYXR0cmlidXRlLFxuXHRcdC8vIGFuIGFycmF5IG9mIHByb21pc2Ugb2JqZWN0cyBmb3IgYXN5bmNocm9ub3VzIHNjYW4gb3BlcmF0aW9ucy5cblx0XHRpZiAoIHRoaXMucHJvcHMuZ2V0KCd1cmwnKSApIHtcblx0XHRcdHRoaXMudHJpZ2dlciggJ3NjYW4nLCBhdHRyaWJ1dGVzICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBhdHRyaWJ1dGVzLnNjYW5uZXJzLmxlbmd0aCApIHtcblx0XHRcdHNjYW5uZXJzID0gYXR0cmlidXRlcy5zY2FubmVycyA9ICQud2hlbi5hcHBseSggJCwgYXR0cmlidXRlcy5zY2FubmVycyApO1xuXHRcdFx0c2Nhbm5lcnMuYWx3YXlzKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKCBlbWJlZC5nZXQoJ3NjYW5uZXJzJykgPT09IHNjYW5uZXJzICkge1xuXHRcdFx0XHRcdGVtYmVkLnNldCggJ2xvYWRpbmcnLCBmYWxzZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXR0cmlidXRlcy5zY2FubmVycyA9IG51bGw7XG5cdFx0fVxuXG5cdFx0YXR0cmlidXRlcy5sb2FkaW5nID0gISEgYXR0cmlidXRlcy5zY2FubmVycztcblx0XHR0aGlzLnNldCggYXR0cmlidXRlcyApO1xuXHR9LFxuXHQvKipcblx0ICogVHJ5IHNjYW5uaW5nIHRoZSBlbWJlZCBhcyBhbiBpbWFnZSB0byBkaXNjb3ZlciBpdHMgZGltZW5zaW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXNcblx0ICovXG5cdHNjYW5JbWFnZTogZnVuY3Rpb24oIGF0dHJpYnV0ZXMgKSB7XG5cdFx0dmFyIGZyYW1lID0gdGhpcy5mcmFtZSxcblx0XHRcdHN0YXRlID0gdGhpcyxcblx0XHRcdHVybCA9IHRoaXMucHJvcHMuZ2V0KCd1cmwnKSxcblx0XHRcdGltYWdlID0gbmV3IEltYWdlKCksXG5cdFx0XHRkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblxuXHRcdGF0dHJpYnV0ZXMuc2Nhbm5lcnMucHVzaCggZGVmZXJyZWQucHJvbWlzZSgpICk7XG5cblx0XHQvLyBUcnkgdG8gbG9hZCB0aGUgaW1hZ2UgYW5kIGZpbmQgaXRzIHdpZHRoL2hlaWdodC5cblx0XHRpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoKTtcblxuXHRcdFx0aWYgKCBzdGF0ZSAhPT0gZnJhbWUuc3RhdGUoKSB8fCB1cmwgIT09IHN0YXRlLnByb3BzLmdldCgndXJsJykgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0c3RhdGUuc2V0KHtcblx0XHRcdFx0dHlwZTogJ2ltYWdlJ1xuXHRcdFx0fSk7XG5cblx0XHRcdHN0YXRlLnByb3BzLnNldCh7XG5cdFx0XHRcdHdpZHRoOiAgaW1hZ2Uud2lkdGgsXG5cdFx0XHRcdGhlaWdodDogaW1hZ2UuaGVpZ2h0XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0aW1hZ2Uub25lcnJvciA9IGRlZmVycmVkLnJlamVjdDtcblx0XHRpbWFnZS5zcmMgPSB1cmw7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mcmFtZS50b29sYmFyLmdldCgpLnJlZnJlc2goKTtcblx0fSxcblxuXHRyZXNldDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5wcm9wcy5jbGVhcigpLnNldCh7IHVybDogJycgfSk7XG5cblx0XHRpZiAoIHRoaXMuYWN0aXZlICkge1xuXHRcdFx0dGhpcy5yZWZyZXNoKCk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWJlZDtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5GZWF0dXJlZEltYWdlXG4gKlxuICogQSBzdGF0ZSBmb3Igc2VsZWN0aW5nIGEgZmVhdHVyZWQgaW1hZ2UgZm9yIGEgcG9zdC5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnlcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlc10gICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBhdHRyaWJ1dGVzIGhhc2ggcGFzc2VkIHRvIHRoZSBzdGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmlkPWZlYXR1cmVkLWltYWdlXSAgICAgICAgVW5pcXVlIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50aXRsZT1TZXQgRmVhdHVyZWQgSW1hZ2VdIFRpdGxlIGZvciB0aGUgc3RhdGUuIERpc3BsYXlzIGluIHRoZSBtZWRpYSBtZW51IGFuZCB0aGUgZnJhbWUncyB0aXRsZSByZWdpb24uXG4gKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzfSBbYXR0cmlidXRlcy5saWJyYXJ5XSAgICAgICAgICAgICAgICAgIFRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uIHRvIGJyb3dzZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgb25lIGlzIG5vdCBzdXBwbGllZCwgYSBjb2xsZWN0aW9uIG9mIGFsbCBpbWFnZXMgd2lsbCBiZSBjcmVhdGVkLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubXVsdGlwbGU9ZmFsc2VdICAgICAgICAgICBXaGV0aGVyIG11bHRpLXNlbGVjdCBpcyBlbmFibGVkLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudD11cGxvYWRdICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBjb250ZW50IHJlZ2lvbi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT3ZlcnJpZGRlbiBieSBwZXJzaXN0ZW50IHVzZXIgc2V0dGluZyBpZiAnY29udGVudFVzZXJTZXR0aW5nJyBpcyB0cnVlLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubWVudT1kZWZhdWx0XSAgICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBtZW51IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnJvdXRlcj1icm93c2VdICAgICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgcm91dGVyIHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRvb2xiYXI9ZmVhdHVyZWQtaW1hZ2VdICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgdG9vbGJhciByZWdpb24uXG4gKiBAcGFyYW0ge2ludH0gICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5wcmlvcml0eT02MF0gICAgICAgICAgICAgIFRoZSBwcmlvcml0eSBmb3IgdGhlIHN0YXRlIGxpbmsgaW4gdGhlIG1lZGlhIG1lbnUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zZWFyY2hhYmxlPXRydWVdICAgICAgICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgc2VhcmNoYWJsZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbnxzdHJpbmd9ICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmZpbHRlcmFibGU9ZmFsc2VdICAgICAgICAgV2hldGhlciB0aGUgbGlicmFyeSBpcyBmaWx0ZXJhYmxlLCBhbmQgaWYgc28gd2hhdCBmaWx0ZXJzIHNob3VsZCBiZSBzaG93bi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWNjZXB0cyAnYWxsJywgJ3VwbG9hZGVkJywgb3IgJ3VuYXR0YWNoZWQnLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc29ydGFibGU9dHJ1ZV0gICAgICAgICAgICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzaG91bGQgYmUgc29ydGFibGUuIERlcGVuZHMgb24gdGhlIG9yZGVyYnkgcHJvcGVydHkgYmVpbmcgc2V0IHRvIG1lbnVPcmRlciBvbiB0aGUgYXR0YWNobWVudHMgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmF1dG9TZWxlY3Q9dHJ1ZV0gICAgICAgICAgV2hldGhlciBhbiB1cGxvYWRlZCBhdHRhY2htZW50IHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGFkZGVkIHRvIHRoZSBzZWxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5kZXNjcmliZT1mYWxzZV0gICAgICAgICAgIFdoZXRoZXIgdG8gb2ZmZXIgVUkgdG8gZGVzY3JpYmUgYXR0YWNobWVudHMgLSBlLmcuIGNhcHRpb25pbmcgaW1hZ2VzIGluIGEgZ2FsbGVyeS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnRVc2VyU2V0dGluZz10cnVlXSAgV2hldGhlciB0aGUgY29udGVudCByZWdpb24ncyBtb2RlIHNob3VsZCBiZSBzZXQgYW5kIHBlcnNpc3RlZCBwZXIgdXNlci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnN5bmNTZWxlY3Rpb249dHJ1ZV0gICAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2VsZWN0aW9uIHNob3VsZCBiZSBwZXJzaXN0ZWQgZnJvbSB0aGUgbGFzdCBzdGF0ZS5cbiAqL1xudmFyIEF0dGFjaG1lbnQgPSB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50LFxuXHRMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRGZWF0dXJlZEltYWdlO1xuXG5GZWF0dXJlZEltYWdlID0gTGlicmFyeS5leHRlbmQoe1xuXHRkZWZhdWx0czogXy5kZWZhdWx0cyh7XG5cdFx0aWQ6ICAgICAgICAgICAgJ2ZlYXR1cmVkLWltYWdlJyxcblx0XHR0aXRsZTogICAgICAgICBsMTBuLnNldEZlYXR1cmVkSW1hZ2VUaXRsZSxcblx0XHRtdWx0aXBsZTogICAgICBmYWxzZSxcblx0XHRmaWx0ZXJhYmxlOiAgICAndXBsb2FkZWQnLFxuXHRcdHRvb2xiYXI6ICAgICAgICdmZWF0dXJlZC1pbWFnZScsXG5cdFx0cHJpb3JpdHk6ICAgICAgNjAsXG5cdFx0c3luY1NlbGVjdGlvbjogdHJ1ZVxuXHR9LCBMaWJyYXJ5LnByb3RvdHlwZS5kZWZhdWx0cyApLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsaWJyYXJ5LCBjb21wYXJhdG9yO1xuXG5cdFx0Ly8gSWYgd2UgaGF2ZW4ndCBiZWVuIHByb3ZpZGVkIGEgYGxpYnJhcnlgLCBjcmVhdGUgYSBgU2VsZWN0aW9uYC5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ2xpYnJhcnknKSApIHtcblx0XHRcdHRoaXMuc2V0KCAnbGlicmFyeScsIHdwLm1lZGlhLnF1ZXJ5KHsgdHlwZTogJ2ltYWdlJyB9KSApO1xuXHRcdH1cblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0bGlicmFyeSAgICA9IHRoaXMuZ2V0KCdsaWJyYXJ5Jyk7XG5cdFx0Y29tcGFyYXRvciA9IGxpYnJhcnkuY29tcGFyYXRvcjtcblxuXHRcdC8vIE92ZXJsb2FkIHRoZSBsaWJyYXJ5J3MgY29tcGFyYXRvciB0byBwdXNoIGl0ZW1zIHRoYXQgYXJlIG5vdCBpblxuXHRcdC8vIHRoZSBtaXJyb3JlZCBxdWVyeSB0byB0aGUgZnJvbnQgb2YgdGhlIGFnZ3JlZ2F0ZSBjb2xsZWN0aW9uLlxuXHRcdGxpYnJhcnkuY29tcGFyYXRvciA9IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdFx0dmFyIGFJblF1ZXJ5ID0gISEgdGhpcy5taXJyb3JpbmcuZ2V0KCBhLmNpZCApLFxuXHRcdFx0XHRiSW5RdWVyeSA9ICEhIHRoaXMubWlycm9yaW5nLmdldCggYi5jaWQgKTtcblxuXHRcdFx0aWYgKCAhIGFJblF1ZXJ5ICYmIGJJblF1ZXJ5ICkge1xuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9IGVsc2UgaWYgKCBhSW5RdWVyeSAmJiAhIGJJblF1ZXJ5ICkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBjb21wYXJhdG9yLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gQWRkIGFsbCBpdGVtcyBpbiB0aGUgc2VsZWN0aW9uIHRvIHRoZSBsaWJyYXJ5LCBzbyBhbnkgZmVhdHVyZWRcblx0XHQvLyBpbWFnZXMgdGhhdCBhcmUgbm90IGluaXRpYWxseSBsb2FkZWQgc3RpbGwgYXBwZWFyLlxuXHRcdGxpYnJhcnkub2JzZXJ2ZSggdGhpcy5nZXQoJ3NlbGVjdGlvbicpICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudXBkYXRlU2VsZWN0aW9uKCk7XG5cdFx0dGhpcy5mcmFtZS5vbiggJ29wZW4nLCB0aGlzLnVwZGF0ZVNlbGVjdGlvbiwgdGhpcyApO1xuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuYWN0aXZhdGUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGRlYWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZnJhbWUub2ZmKCAnb3BlbicsIHRoaXMudXBkYXRlU2VsZWN0aW9uLCB0aGlzICk7XG5cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5kZWFjdGl2YXRlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHR1cGRhdGVTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLmdldCgnc2VsZWN0aW9uJyksXG5cdFx0XHRpZCA9IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MucG9zdC5mZWF0dXJlZEltYWdlSWQsXG5cdFx0XHRhdHRhY2htZW50O1xuXG5cdFx0aWYgKCAnJyAhPT0gaWQgJiYgLTEgIT09IGlkICkge1xuXHRcdFx0YXR0YWNobWVudCA9IEF0dGFjaG1lbnQuZ2V0KCBpZCApO1xuXHRcdFx0YXR0YWNobWVudC5mZXRjaCgpO1xuXHRcdH1cblxuXHRcdHNlbGVjdGlvbi5yZXNldCggYXR0YWNobWVudCA/IFsgYXR0YWNobWVudCBdIDogW10gKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmVhdHVyZWRJbWFnZTtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5HYWxsZXJ5QWRkXG4gKlxuICogQSBzdGF0ZSBmb3Igc2VsZWN0aW5nIG1vcmUgaW1hZ2VzIHRvIGFkZCB0byBhIGdhbGxlcnkuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXNdICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBhdHRyaWJ1dGVzIGhhc2ggcGFzc2VkIHRvIHRoZSBzdGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmlkPWdhbGxlcnktbGlicmFyeV0gICAgICBVbmlxdWUgaWRlbnRpZmllci5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRpdGxlPUFkZCB0byBHYWxsZXJ5XSAgICBUaXRsZSBmb3IgdGhlIHN0YXRlLiBEaXNwbGF5cyBpbiB0aGUgZnJhbWUncyB0aXRsZSByZWdpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5tdWx0aXBsZT1hZGRdICAgICAgICAgICAgV2hldGhlciBtdWx0aS1zZWxlY3QgaXMgZW5hYmxlZC4gQHRvZG8gJ2FkZCcgZG9lc24ndCBzZWVtIGRvIGFueXRoaW5nIHNwZWNpYWwsIGFuZCBnZXRzIHVzZWQgYXMgYSBib29sZWFuLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gW2F0dHJpYnV0ZXMubGlicmFyeV0gICAgICAgICAgICAgICAgIFRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uIHRvIGJyb3dzZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiBvbmUgaXMgbm90IHN1cHBsaWVkLCBhIGNvbGxlY3Rpb24gb2YgYWxsIGltYWdlcyB3aWxsIGJlIGNyZWF0ZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW58c3RyaW5nfSAgICAgICAgICAgICBbYXR0cmlidXRlcy5maWx0ZXJhYmxlPXVwbG9hZGVkXSAgICAgV2hldGhlciB0aGUgbGlicmFyeSBpcyBmaWx0ZXJhYmxlLCBhbmQgaWYgc28gd2hhdCBmaWx0ZXJzIHNob3VsZCBiZSBzaG93bi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY2NlcHRzICdhbGwnLCAndXBsb2FkZWQnLCBvciAndW5hdHRhY2hlZCcuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5tZW51PWdhbGxlcnldICAgICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgbWVudSByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb250ZW50PXVwbG9hZF0gICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgY29udGVudCByZWdpb24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT3ZlcnJpZGRlbiBieSBwZXJzaXN0ZW50IHVzZXIgc2V0dGluZyBpZiAnY29udGVudFVzZXJTZXR0aW5nJyBpcyB0cnVlLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucm91dGVyPWJyb3dzZV0gICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHJvdXRlciByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50b29sYmFyPWdhbGxlcnktYWRkXSAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgdG9vbGJhciByZWdpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zZWFyY2hhYmxlPXRydWVdICAgICAgICAgV2hldGhlciB0aGUgbGlicmFyeSBpcyBzZWFyY2hhYmxlLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc29ydGFibGU9dHJ1ZV0gICAgICAgICAgIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNob3VsZCBiZSBzb3J0YWJsZS4gRGVwZW5kcyBvbiB0aGUgb3JkZXJieSBwcm9wZXJ0eSBiZWluZyBzZXQgdG8gbWVudU9yZGVyIG9uIHRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuYXV0b1NlbGVjdD10cnVlXSAgICAgICAgIFdoZXRoZXIgYW4gdXBsb2FkZWQgYXR0YWNobWVudCBzaG91bGQgYmUgYXV0b21hdGljYWxseSBhZGRlZCB0byB0aGUgc2VsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudFVzZXJTZXR0aW5nPXRydWVdIFdoZXRoZXIgdGhlIGNvbnRlbnQgcmVnaW9uJ3MgbW9kZSBzaG91bGQgYmUgc2V0IGFuZCBwZXJzaXN0ZWQgcGVyIHVzZXIuXG4gKiBAcGFyYW0ge2ludH0gICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5wcmlvcml0eT0xMDBdICAgICAgICAgICAgVGhlIHByaW9yaXR5IGZvciB0aGUgc3RhdGUgbGluayBpbiB0aGUgbWVkaWEgbWVudS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnN5bmNTZWxlY3Rpb249ZmFsc2VdICAgICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzZWxlY3Rpb24gc2hvdWxkIGJlIHBlcnNpc3RlZCBmcm9tIHRoZSBsYXN0IHN0YXRlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERlZmF1bHRzIHRvIGZhbHNlIGJlY2F1c2UgZm9yIHRoaXMgc3RhdGUsIGJlY2F1c2UgdGhlIGxpYnJhcnkgb2YgdGhlIEVkaXQgR2FsbGVyeSBzdGF0ZSBpcyB0aGUgc2VsZWN0aW9uLlxuICovXG52YXIgU2VsZWN0aW9uID0gd3AubWVkaWEubW9kZWwuU2VsZWN0aW9uLFxuXHRMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRHYWxsZXJ5QWRkO1xuXG5HYWxsZXJ5QWRkID0gTGlicmFyeS5leHRlbmQoe1xuXHRkZWZhdWx0czogXy5kZWZhdWx0cyh7XG5cdFx0aWQ6ICAgICAgICAgICAgJ2dhbGxlcnktbGlicmFyeScsXG5cdFx0dGl0bGU6ICAgICAgICAgbDEwbi5hZGRUb0dhbGxlcnlUaXRsZSxcblx0XHRtdWx0aXBsZTogICAgICAnYWRkJyxcblx0XHRmaWx0ZXJhYmxlOiAgICAndXBsb2FkZWQnLFxuXHRcdG1lbnU6ICAgICAgICAgICdnYWxsZXJ5Jyxcblx0XHR0b29sYmFyOiAgICAgICAnZ2FsbGVyeS1hZGQnLFxuXHRcdHByaW9yaXR5OiAgICAgIDEwMCxcblx0XHRzeW5jU2VsZWN0aW9uOiBmYWxzZVxuXHR9LCBMaWJyYXJ5LnByb3RvdHlwZS5kZWZhdWx0cyApLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIElmIGEgbGlicmFyeSB3YXNuJ3Qgc3VwcGxpZWQsIGNyZWF0ZSBhIGxpYnJhcnkgb2YgaW1hZ2VzLlxuXHRcdGlmICggISB0aGlzLmdldCgnbGlicmFyeScpICkge1xuXHRcdFx0dGhpcy5zZXQoICdsaWJyYXJ5Jywgd3AubWVkaWEucXVlcnkoeyB0eXBlOiAnaW1hZ2UnIH0pICk7XG5cdFx0fVxuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsaWJyYXJ5ID0gdGhpcy5nZXQoJ2xpYnJhcnknKSxcblx0XHRcdGVkaXQgICAgPSB0aGlzLmZyYW1lLnN0YXRlKCdnYWxsZXJ5LWVkaXQnKS5nZXQoJ2xpYnJhcnknKTtcblxuXHRcdGlmICggdGhpcy5lZGl0TGlicmFyeSAmJiB0aGlzLmVkaXRMaWJyYXJ5ICE9PSBlZGl0ICkge1xuXHRcdFx0bGlicmFyeS51bm9ic2VydmUoIHRoaXMuZWRpdExpYnJhcnkgKTtcblx0XHR9XG5cblx0XHQvLyBBY2NlcHRzIGF0dGFjaG1lbnRzIHRoYXQgZXhpc3QgaW4gdGhlIG9yaWdpbmFsIGxpYnJhcnkgYW5kXG5cdFx0Ly8gdGhhdCBkbyBub3QgZXhpc3QgaW4gZ2FsbGVyeSdzIGxpYnJhcnkuXG5cdFx0bGlicmFyeS52YWxpZGF0b3IgPSBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHRcdHJldHVybiAhISB0aGlzLm1pcnJvcmluZy5nZXQoIGF0dGFjaG1lbnQuY2lkICkgJiYgISBlZGl0LmdldCggYXR0YWNobWVudC5jaWQgKSAmJiBTZWxlY3Rpb24ucHJvdG90eXBlLnZhbGlkYXRvci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0fTtcblxuXHRcdC8vIFJlc2V0IHRoZSBsaWJyYXJ5IHRvIGVuc3VyZSB0aGF0IGFsbCBhdHRhY2htZW50cyBhcmUgcmUtYWRkZWRcblx0XHQvLyB0byB0aGUgY29sbGVjdGlvbi4gRG8gc28gc2lsZW50bHksIGFzIGNhbGxpbmcgYG9ic2VydmVgIHdpbGxcblx0XHQvLyB0cmlnZ2VyIHRoZSBgcmVzZXRgIGV2ZW50LlxuXHRcdGxpYnJhcnkucmVzZXQoIGxpYnJhcnkubWlycm9yaW5nLm1vZGVscywgeyBzaWxlbnQ6IHRydWUgfSk7XG5cdFx0bGlicmFyeS5vYnNlcnZlKCBlZGl0ICk7XG5cdFx0dGhpcy5lZGl0TGlicmFyeSA9IGVkaXQ7XG5cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5hY3RpdmF0ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbGxlcnlBZGQ7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuR2FsbGVyeUVkaXRcbiAqXG4gKiBBIHN0YXRlIGZvciBlZGl0aW5nIGEgZ2FsbGVyeSdzIGltYWdlcyBhbmQgc2V0dGluZ3MuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXNdICAgICAgICAgICAgICAgICAgICAgICBUaGUgYXR0cmlidXRlcyBoYXNoIHBhc3NlZCB0byB0aGUgc3RhdGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZD1nYWxsZXJ5LWVkaXRdICAgICAgIFVuaXF1ZSBpZGVudGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudGl0bGU9RWRpdCBHYWxsZXJ5XSAgICBUaXRsZSBmb3IgdGhlIHN0YXRlLiBEaXNwbGF5cyBpbiB0aGUgZnJhbWUncyB0aXRsZSByZWdpb24uXG4gKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzfSBbYXR0cmlidXRlcy5saWJyYXJ5XSAgICAgICAgICAgICAgIFRoZSBjb2xsZWN0aW9uIG9mIGF0dGFjaG1lbnRzIGluIHRoZSBnYWxsZXJ5LlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiBvbmUgaXMgbm90IHN1cHBsaWVkLCBhbiBlbXB0eSBtZWRpYS5tb2RlbC5TZWxlY3Rpb24gY29sbGVjdGlvbiBpcyBjcmVhdGVkLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubXVsdGlwbGU9ZmFsc2VdICAgICAgICBXaGV0aGVyIG11bHRpLXNlbGVjdCBpcyBlbmFibGVkLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc2VhcmNoYWJsZT1mYWxzZV0gICAgICBXaGV0aGVyIHRoZSBsaWJyYXJ5IGlzIHNlYXJjaGFibGUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zb3J0YWJsZT10cnVlXSAgICAgICAgIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNob3VsZCBiZSBzb3J0YWJsZS4gRGVwZW5kcyBvbiB0aGUgb3JkZXJieSBwcm9wZXJ0eSBiZWluZyBzZXQgdG8gbWVudU9yZGVyIG9uIHRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZGF0ZT10cnVlXSAgICAgICAgICAgICBXaGV0aGVyIHRvIHNob3cgdGhlIGRhdGUgZmlsdGVyIGluIHRoZSBicm93c2VyJ3MgdG9vbGJhci5cbiAqIEBwYXJhbSB7c3RyaW5nfGZhbHNlfSAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnQ9YnJvd3NlXSAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgY29udGVudCByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ3xmYWxzZX0gICAgICAgICAgICAgICBbYXR0cmlidXRlcy50b29sYmFyPWltYWdlLWRldGFpbHNdIEluaXRpYWwgbW9kZSBmb3IgdGhlIHRvb2xiYXIgcmVnaW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZGVzY3JpYmU9dHJ1ZV0gICAgICAgICBXaGV0aGVyIHRvIG9mZmVyIFVJIHRvIGRlc2NyaWJlIGF0dGFjaG1lbnRzIC0gZS5nLiBjYXB0aW9uaW5nIGltYWdlcyBpbiBhIGdhbGxlcnkuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5kaXNwbGF5U2V0dGluZ3M9dHJ1ZV0gIFdoZXRoZXIgdG8gc2hvdyB0aGUgYXR0YWNobWVudCBkaXNwbGF5IHNldHRpbmdzIGludGVyZmFjZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmRyYWdJbmZvPXRydWVdICAgICAgICAgV2hldGhlciB0byBzaG93IGluc3RydWN0aW9uYWwgdGV4dCBhYm91dCB0aGUgYXR0YWNobWVudHMgYmVpbmcgc29ydGFibGUuXG4gKiBAcGFyYW0ge2ludH0gICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZGVhbENvbHVtbldpZHRoPTE3MF0gIFRoZSBpZGVhbCBjb2x1bW4gd2lkdGggaW4gcGl4ZWxzIGZvciBhdHRhY2htZW50cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmVkaXRpbmc9ZmFsc2VdICAgICAgICAgV2hldGhlciB0aGUgZ2FsbGVyeSBpcyBiZWluZyBjcmVhdGVkLCBvciBlZGl0aW5nIGFuIGV4aXN0aW5nIGluc3RhbmNlLlxuICogQHBhcmFtIHtpbnR9ICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucHJpb3JpdHk9NjBdICAgICAgICAgICBUaGUgcHJpb3JpdHkgZm9yIHRoZSBzdGF0ZSBsaW5rIGluIHRoZSBtZWRpYSBtZW51LlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc3luY1NlbGVjdGlvbj1mYWxzZV0gICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzZWxlY3Rpb24gc2hvdWxkIGJlIHBlcnNpc3RlZCBmcm9tIHRoZSBsYXN0IHN0YXRlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0cyB0byBmYWxzZSBmb3IgdGhpcyBzdGF0ZSwgYmVjYXVzZSB0aGUgbGlicmFyeSBwYXNzZWQgaW4gICppcyogdGhlIHNlbGVjdGlvbi5cbiAqIEBwYXJhbSB7dmlld30gICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLkF0dGFjaG1lbnRWaWV3XSAgICAgICAgVGhlIHNpbmdsZSBgQXR0YWNobWVudGAgdmlldyB0byBiZSB1c2VkIGluIHRoZSBgQXR0YWNobWVudHNgLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiBub25lIHN1cHBsaWVkLCBkZWZhdWx0cyB0byB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRWRpdExpYnJhcnkuXG4gKi9cbnZhciBMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRHYWxsZXJ5RWRpdDtcblxuR2FsbGVyeUVkaXQgPSBMaWJyYXJ5LmV4dGVuZCh7XG5cdGRlZmF1bHRzOiB7XG5cdFx0aWQ6ICAgICAgICAgICAgICAgJ2dhbGxlcnktZWRpdCcsXG5cdFx0dGl0bGU6ICAgICAgICAgICAgbDEwbi5lZGl0R2FsbGVyeVRpdGxlLFxuXHRcdG11bHRpcGxlOiAgICAgICAgIGZhbHNlLFxuXHRcdHNlYXJjaGFibGU6ICAgICAgIGZhbHNlLFxuXHRcdHNvcnRhYmxlOiAgICAgICAgIHRydWUsXG5cdFx0ZGF0ZTogICAgICAgICAgICAgZmFsc2UsXG5cdFx0ZGlzcGxheTogICAgICAgICAgZmFsc2UsXG5cdFx0Y29udGVudDogICAgICAgICAgJ2Jyb3dzZScsXG5cdFx0dG9vbGJhcjogICAgICAgICAgJ2dhbGxlcnktZWRpdCcsXG5cdFx0ZGVzY3JpYmU6ICAgICAgICAgdHJ1ZSxcblx0XHRkaXNwbGF5U2V0dGluZ3M6ICB0cnVlLFxuXHRcdGRyYWdJbmZvOiAgICAgICAgIHRydWUsXG5cdFx0aWRlYWxDb2x1bW5XaWR0aDogMTcwLFxuXHRcdGVkaXRpbmc6ICAgICAgICAgIGZhbHNlLFxuXHRcdHByaW9yaXR5OiAgICAgICAgIDYwLFxuXHRcdHN5bmNTZWxlY3Rpb246ICAgIGZhbHNlXG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gSWYgd2UgaGF2ZW4ndCBiZWVuIHByb3ZpZGVkIGEgYGxpYnJhcnlgLCBjcmVhdGUgYSBgU2VsZWN0aW9uYC5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ2xpYnJhcnknKSApIHtcblx0XHRcdHRoaXMuc2V0KCAnbGlicmFyeScsIG5ldyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24oKSApO1xuXHRcdH1cblxuXHRcdC8vIFRoZSBzaW5nbGUgYEF0dGFjaG1lbnRgIHZpZXcgdG8gYmUgdXNlZCBpbiB0aGUgYEF0dGFjaG1lbnRzYCB2aWV3LlxuXHRcdGlmICggISB0aGlzLmdldCgnQXR0YWNobWVudFZpZXcnKSApIHtcblx0XHRcdHRoaXMuc2V0KCAnQXR0YWNobWVudFZpZXcnLCB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRWRpdExpYnJhcnkgKTtcblx0XHR9XG5cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxpYnJhcnkgPSB0aGlzLmdldCgnbGlicmFyeScpO1xuXG5cdFx0Ly8gTGltaXQgdGhlIGxpYnJhcnkgdG8gaW1hZ2VzIG9ubHkuXG5cdFx0bGlicmFyeS5wcm9wcy5zZXQoICd0eXBlJywgJ2ltYWdlJyApO1xuXG5cdFx0Ly8gV2F0Y2ggZm9yIHVwbG9hZGVkIGF0dGFjaG1lbnRzLlxuXHRcdHRoaXMuZ2V0KCdsaWJyYXJ5Jykub2JzZXJ2ZSggd3AuVXBsb2FkZXIucXVldWUgKTtcblxuXHRcdHRoaXMuZnJhbWUub24oICdjb250ZW50OnJlbmRlcjpicm93c2UnLCB0aGlzLmdhbGxlcnlTZXR0aW5ncywgdGhpcyApO1xuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuYWN0aXZhdGUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGRlYWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIFN0b3Agd2F0Y2hpbmcgZm9yIHVwbG9hZGVkIGF0dGFjaG1lbnRzLlxuXHRcdHRoaXMuZ2V0KCdsaWJyYXJ5JykudW5vYnNlcnZlKCB3cC5VcGxvYWRlci5xdWV1ZSApO1xuXG5cdFx0dGhpcy5mcmFtZS5vZmYoICdjb250ZW50OnJlbmRlcjpicm93c2UnLCB0aGlzLmdhbGxlcnlTZXR0aW5ncywgdGhpcyApO1xuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuZGVhY3RpdmF0ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcGFyYW0gYnJvd3NlclxuXHQgKi9cblx0Z2FsbGVyeVNldHRpbmdzOiBmdW5jdGlvbiggYnJvd3NlciApIHtcblx0XHRpZiAoICEgdGhpcy5nZXQoJ2Rpc3BsYXlTZXR0aW5ncycpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBsaWJyYXJ5ID0gdGhpcy5nZXQoJ2xpYnJhcnknKTtcblxuXHRcdGlmICggISBsaWJyYXJ5IHx8ICEgYnJvd3NlciApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsaWJyYXJ5LmdhbGxlcnkgPSBsaWJyYXJ5LmdhbGxlcnkgfHwgbmV3IEJhY2tib25lLk1vZGVsKCk7XG5cblx0XHRicm93c2VyLnNpZGViYXIuc2V0KHtcblx0XHRcdGdhbGxlcnk6IG5ldyB3cC5tZWRpYS52aWV3LlNldHRpbmdzLkdhbGxlcnkoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0XHRtb2RlbDogICAgICBsaWJyYXJ5LmdhbGxlcnksXG5cdFx0XHRcdHByaW9yaXR5OiAgIDQwXG5cdFx0XHR9KVxuXHRcdH0pO1xuXG5cdFx0YnJvd3Nlci50b29sYmFyLnNldCggJ3JldmVyc2UnLCB7XG5cdFx0XHR0ZXh0OiAgICAgbDEwbi5yZXZlcnNlT3JkZXIsXG5cdFx0XHRwcmlvcml0eTogODAsXG5cblx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0bGlicmFyeS5yZXNldCggbGlicmFyeS50b0FycmF5KCkucmV2ZXJzZSgpICk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbGxlcnlFZGl0O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkltYWdlRGV0YWlsc1xuICpcbiAqIEEgc3RhdGUgZm9yIGVkaXRpbmcgdGhlIGF0dGFjaG1lbnQgZGlzcGxheSBzZXR0aW5ncyBvZiBhbiBpbWFnZSB0aGF0J3MgYmVlblxuICogaW5zZXJ0ZWQgaW50byB0aGUgZWRpdG9yLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXNdICAgICAgICAgICAgICAgICAgICAgICBUaGUgYXR0cmlidXRlcyBoYXNoIHBhc3NlZCB0byB0aGUgc3RhdGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmlkPWltYWdlLWRldGFpbHNdICAgICAgVW5pcXVlIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRpdGxlPUltYWdlIERldGFpbHNdICAgVGl0bGUgZm9yIHRoZSBzdGF0ZS4gRGlzcGxheXMgaW4gdGhlIGZyYW1lJ3MgdGl0bGUgcmVnaW9uLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50fSBhdHRyaWJ1dGVzLmltYWdlICAgICAgICAgICAgICAgICAgIFRoZSBpbWFnZSdzIG1vZGVsLlxuICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V9ICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb250ZW50PWltYWdlLWRldGFpbHNdIEluaXRpYWwgbW9kZSBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V9ICAgICAgICAgICAgICBbYXR0cmlidXRlcy5tZW51PWZhbHNlXSAgICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIG1lbnUgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V9ICAgICAgICAgICAgICBbYXR0cmlidXRlcy5yb3V0ZXI9ZmFsc2VdICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHJvdXRlciByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ3xmYWxzZX0gICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRvb2xiYXI9aW1hZ2UtZGV0YWlsc10gSW5pdGlhbCBtb2RlIGZvciB0aGUgdG9vbGJhciByZWdpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmVkaXRpbmc9ZmFsc2VdICAgICAgICAgVW51c2VkLlxuICogQHBhcmFtIHtpbnR9ICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5wcmlvcml0eT02MF0gICAgICAgICAgIFVudXNlZC5cbiAqXG4gKiBAdG9kbyBUaGlzIHN0YXRlIGluaGVyaXRzIHNvbWUgZGVmYXVsdHMgZnJvbSBtZWRpYS5jb250cm9sbGVyLkxpYnJhcnkucHJvdG90eXBlLmRlZmF1bHRzLFxuICogICAgICAgaG93ZXZlciB0aGlzIG1heSBub3QgZG8gYW55dGhpbmcuXG4gKi9cbnZhciBTdGF0ZSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUsXG5cdExpYnJhcnkgPSB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnksXG5cdGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdEltYWdlRGV0YWlscztcblxuSW1hZ2VEZXRhaWxzID0gU3RhdGUuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IF8uZGVmYXVsdHMoe1xuXHRcdGlkOiAgICAgICAnaW1hZ2UtZGV0YWlscycsXG5cdFx0dGl0bGU6ICAgIGwxMG4uaW1hZ2VEZXRhaWxzVGl0bGUsXG5cdFx0Y29udGVudDogICdpbWFnZS1kZXRhaWxzJyxcblx0XHRtZW51OiAgICAgZmFsc2UsXG5cdFx0cm91dGVyOiAgIGZhbHNlLFxuXHRcdHRvb2xiYXI6ICAnaW1hZ2UtZGV0YWlscycsXG5cdFx0ZWRpdGluZzogIGZhbHNlLFxuXHRcdHByaW9yaXR5OiA2MFxuXHR9LCBMaWJyYXJ5LnByb3RvdHlwZS5kZWZhdWx0cyApLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICpcblx0ICogQHBhcmFtIG9wdGlvbnMgQXR0cmlidXRlc1xuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5pbWFnZSA9IG9wdGlvbnMuaW1hZ2U7XG5cdFx0U3RhdGUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZyYW1lLm1vZGFsLiRlbC5hZGRDbGFzcygnaW1hZ2UtZGV0YWlscycpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZURldGFpbHM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeVxuICpcbiAqIEEgc3RhdGUgZm9yIGNob29zaW5nIGFuIGF0dGFjaG1lbnQgb3IgZ3JvdXAgb2YgYXR0YWNobWVudHMgZnJvbSB0aGUgbWVkaWEgbGlicmFyeS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqIEBtaXhlcyBtZWRpYS5zZWxlY3Rpb25TeW5jXG4gKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlc10gICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGF0dHJpYnV0ZXMgaGFzaCBwYXNzZWQgdG8gdGhlIHN0YXRlLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZD1saWJyYXJ5XSAgICAgICAgICAgICAgVW5pcXVlIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRpdGxlPU1lZGlhIGxpYnJhcnldICAgICBUaXRsZSBmb3IgdGhlIHN0YXRlLiBEaXNwbGF5cyBpbiB0aGUgbWVkaWEgbWVudSBhbmQgdGhlIGZyYW1lJ3MgdGl0bGUgcmVnaW9uLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gICAgICBbYXR0cmlidXRlcy5saWJyYXJ5XSAgICAgICAgICAgICAgICAgVGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24gdG8gYnJvd3NlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgb25lIGlzIG5vdCBzdXBwbGllZCwgYSBjb2xsZWN0aW9uIG9mIGFsbCBhdHRhY2htZW50cyB3aWxsIGJlIGNyZWF0ZWQuXG4gKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbnxvYmplY3R9IFthdHRyaWJ1dGVzLnNlbGVjdGlvbl0gICAgICAgICAgICAgICBBIGNvbGxlY3Rpb24gdG8gY29udGFpbiBhdHRhY2htZW50IHNlbGVjdGlvbnMgd2l0aGluIHRoZSBzdGF0ZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElmIHRoZSAnc2VsZWN0aW9uJyBhdHRyaWJ1dGUgaXMgYSBwbGFpbiBKUyBvYmplY3QsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhIFNlbGVjdGlvbiB3aWxsIGJlIGNyZWF0ZWQgdXNpbmcgaXRzIHZhbHVlcyBhcyB0aGUgc2VsZWN0aW9uIGluc3RhbmNlJ3MgYHByb3BzYCBtb2RlbC5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE90aGVyd2lzZSwgaXQgd2lsbCBjb3B5IHRoZSBsaWJyYXJ5J3MgYHByb3BzYCBtb2RlbC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubXVsdGlwbGU9ZmFsc2VdICAgICAgICAgIFdoZXRoZXIgbXVsdGktc2VsZWN0IGlzIGVuYWJsZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnQ9dXBsb2FkXSAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBjb250ZW50IHJlZ2lvbi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE92ZXJyaWRkZW4gYnkgcGVyc2lzdGVudCB1c2VyIHNldHRpbmcgaWYgJ2NvbnRlbnRVc2VyU2V0dGluZycgaXMgdHJ1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubWVudT1kZWZhdWx0XSAgICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIG1lbnUgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5yb3V0ZXI9YnJvd3NlXSAgICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgcm91dGVyIHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudG9vbGJhcj1zZWxlY3RdICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHRvb2xiYXIgcmVnaW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zZWFyY2hhYmxlPXRydWVdICAgICAgICAgV2hldGhlciB0aGUgbGlicmFyeSBpcyBzZWFyY2hhYmxlLlxuICogQHBhcmFtIHtib29sZWFufHN0cmluZ30gICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5maWx0ZXJhYmxlPWZhbHNlXSAgICAgICAgV2hldGhlciB0aGUgbGlicmFyeSBpcyBmaWx0ZXJhYmxlLCBhbmQgaWYgc28gd2hhdCBmaWx0ZXJzIHNob3VsZCBiZSBzaG93bi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjY2VwdHMgJ2FsbCcsICd1cGxvYWRlZCcsIG9yICd1bmF0dGFjaGVkJy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc29ydGFibGU9dHJ1ZV0gICAgICAgICAgIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNob3VsZCBiZSBzb3J0YWJsZS4gRGVwZW5kcyBvbiB0aGUgb3JkZXJieSBwcm9wZXJ0eSBiZWluZyBzZXQgdG8gbWVudU9yZGVyIG9uIHRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5hdXRvU2VsZWN0PXRydWVdICAgICAgICAgV2hldGhlciBhbiB1cGxvYWRlZCBhdHRhY2htZW50IHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGFkZGVkIHRvIHRoZSBzZWxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmRlc2NyaWJlPWZhbHNlXSAgICAgICAgICBXaGV0aGVyIHRvIG9mZmVyIFVJIHRvIGRlc2NyaWJlIGF0dGFjaG1lbnRzIC0gZS5nLiBjYXB0aW9uaW5nIGltYWdlcyBpbiBhIGdhbGxlcnkuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnRVc2VyU2V0dGluZz10cnVlXSBXaGV0aGVyIHRoZSBjb250ZW50IHJlZ2lvbidzIG1vZGUgc2hvdWxkIGJlIHNldCBhbmQgcGVyc2lzdGVkIHBlciB1c2VyLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zeW5jU2VsZWN0aW9uPXRydWVdICAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2VsZWN0aW9uIHNob3VsZCBiZSBwZXJzaXN0ZWQgZnJvbSB0aGUgbGFzdCBzdGF0ZS5cbiAqL1xudmFyIGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdGdldFVzZXJTZXR0aW5nID0gd2luZG93LmdldFVzZXJTZXR0aW5nLFxuXHRzZXRVc2VyU2V0dGluZyA9IHdpbmRvdy5zZXRVc2VyU2V0dGluZyxcblx0TGlicmFyeTtcblxuTGlicmFyeSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IHtcblx0XHRpZDogICAgICAgICAgICAgICAgICdsaWJyYXJ5Jyxcblx0XHR0aXRsZTogICAgICAgICAgICAgIGwxMG4ubWVkaWFMaWJyYXJ5VGl0bGUsXG5cdFx0bXVsdGlwbGU6ICAgICAgICAgICBmYWxzZSxcblx0XHRjb250ZW50OiAgICAgICAgICAgICd1cGxvYWQnLFxuXHRcdG1lbnU6ICAgICAgICAgICAgICAgJ2RlZmF1bHQnLFxuXHRcdHJvdXRlcjogICAgICAgICAgICAgJ2Jyb3dzZScsXG5cdFx0dG9vbGJhcjogICAgICAgICAgICAnc2VsZWN0Jyxcblx0XHRzZWFyY2hhYmxlOiAgICAgICAgIHRydWUsXG5cdFx0ZmlsdGVyYWJsZTogICAgICAgICBmYWxzZSxcblx0XHRzb3J0YWJsZTogICAgICAgICAgIHRydWUsXG5cdFx0YXV0b1NlbGVjdDogICAgICAgICB0cnVlLFxuXHRcdGRlc2NyaWJlOiAgICAgICAgICAgZmFsc2UsXG5cdFx0Y29udGVudFVzZXJTZXR0aW5nOiB0cnVlLFxuXHRcdHN5bmNTZWxlY3Rpb246ICAgICAgdHJ1ZVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBJZiBhIGxpYnJhcnkgaXNuJ3QgcHJvdmlkZWQsIHF1ZXJ5IGFsbCBtZWRpYSBpdGVtcy5cblx0ICogSWYgYSBzZWxlY3Rpb24gaW5zdGFuY2UgaXNuJ3QgcHJvdmlkZWQsIGNyZWF0ZSBvbmUuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdHByb3BzO1xuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdsaWJyYXJ5JykgKSB7XG5cdFx0XHR0aGlzLnNldCggJ2xpYnJhcnknLCB3cC5tZWRpYS5xdWVyeSgpICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAhICggc2VsZWN0aW9uIGluc3RhbmNlb2Ygd3AubWVkaWEubW9kZWwuU2VsZWN0aW9uICkgKSB7XG5cdFx0XHRwcm9wcyA9IHNlbGVjdGlvbjtcblxuXHRcdFx0aWYgKCAhIHByb3BzICkge1xuXHRcdFx0XHRwcm9wcyA9IHRoaXMuZ2V0KCdsaWJyYXJ5JykucHJvcHMudG9KU09OKCk7XG5cdFx0XHRcdHByb3BzID0gXy5vbWl0KCBwcm9wcywgJ29yZGVyYnknLCAncXVlcnknICk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2V0KCAnc2VsZWN0aW9uJywgbmV3IHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbiggbnVsbCwge1xuXHRcdFx0XHRtdWx0aXBsZTogdGhpcy5nZXQoJ211bHRpcGxlJyksXG5cdFx0XHRcdHByb3BzOiBwcm9wc1xuXHRcdFx0fSkgKTtcblx0XHR9XG5cblx0XHR0aGlzLnJlc2V0RGlzcGxheXMoKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zeW5jU2VsZWN0aW9uKCk7XG5cblx0XHR3cC5VcGxvYWRlci5xdWV1ZS5vbiggJ2FkZCcsIHRoaXMudXBsb2FkaW5nLCB0aGlzICk7XG5cblx0XHR0aGlzLmdldCgnc2VsZWN0aW9uJykub24oICdhZGQgcmVtb3ZlIHJlc2V0JywgdGhpcy5yZWZyZXNoQ29udGVudCwgdGhpcyApO1xuXG5cdFx0aWYgKCB0aGlzLmdldCggJ3JvdXRlcicgKSAmJiB0aGlzLmdldCgnY29udGVudFVzZXJTZXR0aW5nJykgKSB7XG5cdFx0XHR0aGlzLmZyYW1lLm9uKCAnY29udGVudDphY3RpdmF0ZScsIHRoaXMuc2F2ZUNvbnRlbnRNb2RlLCB0aGlzICk7XG5cdFx0XHR0aGlzLnNldCggJ2NvbnRlbnQnLCBnZXRVc2VyU2V0dGluZyggJ2xpYnJhcnlDb250ZW50JywgdGhpcy5nZXQoJ2NvbnRlbnQnKSApICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGRlYWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVjb3JkU2VsZWN0aW9uKCk7XG5cblx0XHR0aGlzLmZyYW1lLm9mZiggJ2NvbnRlbnQ6YWN0aXZhdGUnLCB0aGlzLnNhdmVDb250ZW50TW9kZSwgdGhpcyApO1xuXG5cdFx0Ly8gVW5iaW5kIGFsbCBldmVudCBoYW5kbGVycyB0aGF0IHVzZSB0aGlzIHN0YXRlIGFzIHRoZSBjb250ZXh0XG5cdFx0Ly8gZnJvbSB0aGUgc2VsZWN0aW9uLlxuXHRcdHRoaXMuZ2V0KCdzZWxlY3Rpb24nKS5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblxuXHRcdHdwLlVwbG9hZGVyLnF1ZXVlLm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXNldCB0aGUgbGlicmFyeSB0byBpdHMgaW5pdGlhbCBzdGF0ZS5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRyZXNldDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nZXQoJ3NlbGVjdGlvbicpLnJlc2V0KCk7XG5cdFx0dGhpcy5yZXNldERpc3BsYXlzKCk7XG5cdFx0dGhpcy5yZWZyZXNoQ29udGVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXNldCB0aGUgYXR0YWNobWVudCBkaXNwbGF5IHNldHRpbmdzIGRlZmF1bHRzIHRvIHRoZSBzaXRlIG9wdGlvbnMuXG5cdCAqXG5cdCAqIElmIHNpdGUgb3B0aW9ucyBkb24ndCBkZWZpbmUgdGhlbSwgZmFsbCBiYWNrIHRvIGEgcGVyc2lzdGVudCB1c2VyIHNldHRpbmcuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0cmVzZXREaXNwbGF5czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRlZmF1bHRQcm9wcyA9IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MuZGVmYXVsdFByb3BzO1xuXHRcdHRoaXMuX2Rpc3BsYXlzID0gW107XG5cdFx0dGhpcy5fZGVmYXVsdERpc3BsYXlTZXR0aW5ncyA9IHtcblx0XHRcdGFsaWduOiBnZXRVc2VyU2V0dGluZyggJ2FsaWduJywgZGVmYXVsdFByb3BzLmFsaWduICkgfHwgJ25vbmUnLFxuXHRcdFx0c2l6ZTogIGdldFVzZXJTZXR0aW5nKCAnaW1nc2l6ZScsIGRlZmF1bHRQcm9wcy5zaXplICkgfHwgJ21lZGl1bScsXG5cdFx0XHRsaW5rOiAgZ2V0VXNlclNldHRpbmcoICd1cmxidXR0b24nLCBkZWZhdWx0UHJvcHMubGluayApIHx8ICdub25lJ1xuXHRcdH07XG5cdH0sXG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIG1vZGVsIHRvIHJlcHJlc2VudCBkaXNwbGF5IHNldHRpbmdzIChhbGlnbm1lbnQsIGV0Yy4pIGZvciBhbiBhdHRhY2htZW50LlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50fSBhdHRhY2htZW50XG5cdCAqIEByZXR1cm5zIHtCYWNrYm9uZS5Nb2RlbH1cblx0ICovXG5cdGRpc3BsYXk6IGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdHZhciBkaXNwbGF5cyA9IHRoaXMuX2Rpc3BsYXlzO1xuXG5cdFx0aWYgKCAhIGRpc3BsYXlzWyBhdHRhY2htZW50LmNpZCBdICkge1xuXHRcdFx0ZGlzcGxheXNbIGF0dGFjaG1lbnQuY2lkIF0gPSBuZXcgQmFja2JvbmUuTW9kZWwoIHRoaXMuZGVmYXVsdERpc3BsYXlTZXR0aW5ncyggYXR0YWNobWVudCApICk7XG5cdFx0fVxuXHRcdHJldHVybiBkaXNwbGF5c1sgYXR0YWNobWVudC5jaWQgXTtcblx0fSxcblxuXHQvKipcblx0ICogR2l2ZW4gYW4gYXR0YWNobWVudCwgY3JlYXRlIGF0dGFjaG1lbnQgZGlzcGxheSBzZXR0aW5ncyBwcm9wZXJ0aWVzLlxuXHQgKlxuXHQgKiBAc2luY2UgMy42LjBcblx0ICpcblx0ICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50fSBhdHRhY2htZW50XG5cdCAqIEByZXR1cm5zIHtPYmplY3R9XG5cdCAqL1xuXHRkZWZhdWx0RGlzcGxheVNldHRpbmdzOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHR2YXIgc2V0dGluZ3MgPSBfLmNsb25lKCB0aGlzLl9kZWZhdWx0RGlzcGxheVNldHRpbmdzICk7XG5cblx0XHRpZiAoIHNldHRpbmdzLmNhbkVtYmVkID0gdGhpcy5jYW5FbWJlZCggYXR0YWNobWVudCApICkge1xuXHRcdFx0c2V0dGluZ3MubGluayA9ICdlbWJlZCc7XG5cdFx0fSBlbHNlIGlmICggISB0aGlzLmlzSW1hZ2VBdHRhY2htZW50KCBhdHRhY2htZW50ICkgJiYgc2V0dGluZ3MubGluayA9PT0gJ25vbmUnICkge1xuXHRcdFx0c2V0dGluZ3MubGluayA9ICdmaWxlJztcblx0XHR9XG5cblx0XHRyZXR1cm4gc2V0dGluZ3M7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFdoZXRoZXIgYW4gYXR0YWNobWVudCBpcyBpbWFnZS5cblx0ICpcblx0ICogQHNpbmNlIDQuNC4xXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH0gYXR0YWNobWVudFxuXHQgKiBAcmV0dXJucyB7Qm9vbGVhbn1cblx0ICovXG5cdGlzSW1hZ2VBdHRhY2htZW50OiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHQvLyBJZiB1cGxvYWRpbmcsIHdlIGtub3cgdGhlIGZpbGVuYW1lIGJ1dCBub3QgdGhlIG1pbWUgdHlwZS5cblx0XHRpZiAoIGF0dGFjaG1lbnQuZ2V0KCd1cGxvYWRpbmcnKSApIHtcblx0XHRcdHJldHVybiAvXFwuKGpwZT9nfHBuZ3xnaWYpJC9pLnRlc3QoIGF0dGFjaG1lbnQuZ2V0KCdmaWxlbmFtZScpICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF0dGFjaG1lbnQuZ2V0KCd0eXBlJykgPT09ICdpbWFnZSc7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFdoZXRoZXIgYW4gYXR0YWNobWVudCBjYW4gYmUgZW1iZWRkZWQgKGF1ZGlvIG9yIHZpZGVvKS5cblx0ICpcblx0ICogQHNpbmNlIDMuNi4wXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH0gYXR0YWNobWVudFxuXHQgKiBAcmV0dXJucyB7Qm9vbGVhbn1cblx0ICovXG5cdGNhbkVtYmVkOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHQvLyBJZiB1cGxvYWRpbmcsIHdlIGtub3cgdGhlIGZpbGVuYW1lIGJ1dCBub3QgdGhlIG1pbWUgdHlwZS5cblx0XHRpZiAoICEgYXR0YWNobWVudC5nZXQoJ3VwbG9hZGluZycpICkge1xuXHRcdFx0dmFyIHR5cGUgPSBhdHRhY2htZW50LmdldCgndHlwZScpO1xuXHRcdFx0aWYgKCB0eXBlICE9PSAnYXVkaW8nICYmIHR5cGUgIT09ICd2aWRlbycgKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gXy5jb250YWlucyggd3AubWVkaWEudmlldy5zZXR0aW5ncy5lbWJlZEV4dHMsIGF0dGFjaG1lbnQuZ2V0KCdmaWxlbmFtZScpLnNwbGl0KCcuJykucG9wKCkgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBJZiB0aGUgc3RhdGUgaXMgYWN0aXZlLCBubyBpdGVtcyBhcmUgc2VsZWN0ZWQsIGFuZCB0aGUgY3VycmVudFxuXHQgKiBjb250ZW50IG1vZGUgaXMgbm90IGFuIG9wdGlvbiBpbiB0aGUgc3RhdGUncyByb3V0ZXIgKHByb3ZpZGVkXG5cdCAqIHRoZSBzdGF0ZSBoYXMgYSByb3V0ZXIpLCByZXNldCB0aGUgY29udGVudCBtb2RlIHRvIHRoZSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdHJlZnJlc2hDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0aW9uID0gdGhpcy5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0ZnJhbWUgPSB0aGlzLmZyYW1lLFxuXHRcdFx0cm91dGVyID0gZnJhbWUucm91dGVyLmdldCgpLFxuXHRcdFx0bW9kZSA9IGZyYW1lLmNvbnRlbnQubW9kZSgpO1xuXG5cdFx0aWYgKCB0aGlzLmFjdGl2ZSAmJiAhIHNlbGVjdGlvbi5sZW5ndGggJiYgcm91dGVyICYmICEgcm91dGVyLmdldCggbW9kZSApICkge1xuXHRcdFx0dGhpcy5mcmFtZS5jb250ZW50LnJlbmRlciggdGhpcy5nZXQoJ2NvbnRlbnQnKSApO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQ2FsbGJhY2sgaGFuZGxlciB3aGVuIGFuIGF0dGFjaG1lbnQgaXMgdXBsb2FkZWQuXG5cdCAqXG5cdCAqIFN3aXRjaCB0byB0aGUgTWVkaWEgTGlicmFyeSBpZiB1cGxvYWRlZCBmcm9tIHRoZSAnVXBsb2FkIEZpbGVzJyB0YWIuXG5cdCAqXG5cdCAqIEFkZHMgYW55IHVwbG9hZGluZyBhdHRhY2htZW50cyB0byB0aGUgc2VsZWN0aW9uLlxuXHQgKlxuXHQgKiBJZiB0aGUgc3RhdGUgb25seSBzdXBwb3J0cyBvbmUgYXR0YWNobWVudCB0byBiZSBzZWxlY3RlZCBhbmQgbXVsdGlwbGVcblx0ICogYXR0YWNobWVudHMgYXJlIHVwbG9hZGVkLCB0aGUgbGFzdCBhdHRhY2htZW50IGluIHRoZSB1cGxvYWQgcXVldWUgd2lsbFxuXHQgKiBiZSBzZWxlY3RlZC5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH0gYXR0YWNobWVudFxuXHQgKi9cblx0dXBsb2FkaW5nOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHR2YXIgY29udGVudCA9IHRoaXMuZnJhbWUuY29udGVudDtcblxuXHRcdGlmICggJ3VwbG9hZCcgPT09IGNvbnRlbnQubW9kZSgpICkge1xuXHRcdFx0dGhpcy5mcmFtZS5jb250ZW50Lm1vZGUoJ2Jyb3dzZScpO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5nZXQoICdhdXRvU2VsZWN0JyApICkge1xuXHRcdFx0dGhpcy5nZXQoJ3NlbGVjdGlvbicpLmFkZCggYXR0YWNobWVudCApO1xuXHRcdFx0dGhpcy5mcmFtZS50cmlnZ2VyKCAnbGlicmFyeTpzZWxlY3Rpb246YWRkJyApO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogUGVyc2lzdCB0aGUgbW9kZSBvZiB0aGUgY29udGVudCByZWdpb24gYXMgYSB1c2VyIHNldHRpbmcuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0c2F2ZUNvbnRlbnRNb2RlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICdicm93c2UnICE9PSB0aGlzLmdldCgncm91dGVyJykgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIG1vZGUgPSB0aGlzLmZyYW1lLmNvbnRlbnQubW9kZSgpLFxuXHRcdFx0dmlldyA9IHRoaXMuZnJhbWUucm91dGVyLmdldCgpO1xuXG5cdFx0aWYgKCB2aWV3ICYmIHZpZXcuZ2V0KCBtb2RlICkgKSB7XG5cdFx0XHRzZXRVc2VyU2V0dGluZyggJ2xpYnJhcnlDb250ZW50JywgbW9kZSApO1xuXHRcdH1cblx0fVxufSk7XG5cbi8vIE1ha2Ugc2VsZWN0aW9uU3luYyBhdmFpbGFibGUgb24gYW55IE1lZGlhIExpYnJhcnkgc3RhdGUuXG5fLmV4dGVuZCggTGlicmFyeS5wcm90b3R5cGUsIHdwLm1lZGlhLnNlbGVjdGlvblN5bmMgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaWJyYXJ5O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLk1lZGlhTGlicmFyeVxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICovXG52YXIgTGlicmFyeSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeSxcblx0TWVkaWFMaWJyYXJ5O1xuXG5NZWRpYUxpYnJhcnkgPSBMaWJyYXJ5LmV4dGVuZCh7XG5cdGRlZmF1bHRzOiBfLmRlZmF1bHRzKHtcblx0XHQvLyBBdHRhY2htZW50cyBicm93c2VyIGRlZmF1bHRzLiBAc2VlIG1lZGlhLnZpZXcuQXR0YWNobWVudHNCcm93c2VyXG5cdFx0ZmlsdGVyYWJsZTogICAgICAndXBsb2FkZWQnLFxuXG5cdFx0ZGlzcGxheVNldHRpbmdzOiBmYWxzZSxcblx0XHRwcmlvcml0eTogICAgICAgIDgwLFxuXHRcdHN5bmNTZWxlY3Rpb246ICAgZmFsc2Vcblx0fSwgTGlicmFyeS5wcm90b3R5cGUuZGVmYXVsdHMgKSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR0aGlzLm1lZGlhID0gb3B0aW9ucy5tZWRpYTtcblx0XHR0aGlzLnR5cGUgPSBvcHRpb25zLnR5cGU7XG5cdFx0dGhpcy5zZXQoICdsaWJyYXJ5Jywgd3AubWVkaWEucXVlcnkoeyB0eXBlOiB0aGlzLnR5cGUgfSkgKTtcblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHQvLyBAdG9kbyB0aGlzIHNob3VsZCB1c2UgdGhpcy5mcmFtZS5cblx0XHRpZiAoIHdwLm1lZGlhLmZyYW1lLmxhc3RNaW1lICkge1xuXHRcdFx0dGhpcy5zZXQoICdsaWJyYXJ5Jywgd3AubWVkaWEucXVlcnkoeyB0eXBlOiB3cC5tZWRpYS5mcmFtZS5sYXN0TWltZSB9KSApO1xuXHRcdFx0ZGVsZXRlIHdwLm1lZGlhLmZyYW1lLmxhc3RNaW1lO1xuXHRcdH1cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5hY3RpdmF0ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lZGlhTGlicmFyeTtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5SZWdpb25cbiAqXG4gKiBBIHJlZ2lvbiBpcyBhIHBlcnNpc3RlbnQgYXBwbGljYXRpb24gbGF5b3V0IGFyZWEuXG4gKlxuICogQSByZWdpb24gYXNzdW1lcyBvbmUgbW9kZSBhdCBhbnkgdGltZSwgYW5kIGNhbiBiZSBzd2l0Y2hlZCB0byBhbm90aGVyLlxuICpcbiAqIFdoZW4gbW9kZSBjaGFuZ2VzLCBldmVudHMgYXJlIHRyaWdnZXJlZCBvbiB0aGUgcmVnaW9uJ3MgcGFyZW50IHZpZXcuXG4gKiBUaGUgcGFyZW50IHZpZXcgd2lsbCBsaXN0ZW4gdG8gc3BlY2lmaWMgZXZlbnRzIGFuZCBmaWxsIHRoZSByZWdpb24gd2l0aCBhblxuICogYXBwcm9wcmlhdGUgdmlldyBkZXBlbmRpbmcgb24gbW9kZS4gRm9yIGV4YW1wbGUsIGEgZnJhbWUgbGlzdGVucyBmb3IgdGhlXG4gKiAnYnJvd3NlJyBtb2RlIHQgYmUgYWN0aXZhdGVkIG9uIHRoZSAnY29udGVudCcgdmlldyBhbmQgdGhlbiBmaWxscyB0aGUgcmVnaW9uXG4gKiB3aXRoIGFuIEF0dGFjaG1lbnRzQnJvd3NlciB2aWV3LlxuICpcbiAqIEBjbGFzc1xuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgb3B0aW9ucyAgICAgICAgICBPcHRpb25zIGhhc2ggZm9yIHRoZSByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgIG9wdGlvbnMuaWQgICAgICAgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSByZWdpb24uXG4gKiBAcGFyYW0ge0JhY2tib25lLlZpZXd9IG9wdGlvbnMudmlldyAgICAgQSBwYXJlbnQgdmlldyB0aGUgcmVnaW9uIGV4aXN0cyB3aXRoaW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgIG9wdGlvbnMuc2VsZWN0b3IgalF1ZXJ5IHNlbGVjdG9yIGZvciB0aGUgcmVnaW9uIHdpdGhpbiB0aGUgcGFyZW50IHZpZXcuXG4gKi9cbnZhciBSZWdpb24gPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0Xy5leHRlbmQoIHRoaXMsIF8ucGljayggb3B0aW9ucyB8fCB7fSwgJ2lkJywgJ3ZpZXcnLCAnc2VsZWN0b3InICkgKTtcbn07XG5cbi8vIFVzZSBCYWNrYm9uZSdzIHNlbGYtcHJvcGFnYXRpbmcgYGV4dGVuZGAgaW5oZXJpdGFuY2UgbWV0aG9kLlxuUmVnaW9uLmV4dGVuZCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZDtcblxuXy5leHRlbmQoIFJlZ2lvbi5wcm90b3R5cGUsIHtcblx0LyoqXG5cdCAqIEFjdGl2YXRlIGEgbW9kZS5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlXG5cdCAqXG5cdCAqIEBmaXJlcyB0aGlzLnZpZXcje3RoaXMuaWR9OmFjdGl2YXRlOnt0aGlzLl9tb2RlfVxuXHQgKiBAZmlyZXMgdGhpcy52aWV3I3t0aGlzLmlkfTphY3RpdmF0ZVxuXHQgKiBAZmlyZXMgdGhpcy52aWV3I3t0aGlzLmlkfTpkZWFjdGl2YXRlOnt0aGlzLl9tb2RlfVxuXHQgKiBAZmlyZXMgdGhpcy52aWV3I3t0aGlzLmlkfTpkZWFjdGl2YXRlXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5jb250cm9sbGVyLlJlZ2lvbn0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmcuXG5cdCAqL1xuXHRtb2RlOiBmdW5jdGlvbiggbW9kZSApIHtcblx0XHRpZiAoICEgbW9kZSApIHtcblx0XHRcdHJldHVybiB0aGlzLl9tb2RlO1xuXHRcdH1cblx0XHQvLyBCYWlsIGlmIHdlJ3JlIHRyeWluZyB0byBjaGFuZ2UgdG8gdGhlIGN1cnJlbnQgbW9kZS5cblx0XHRpZiAoIG1vZGUgPT09IHRoaXMuX21vZGUgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBSZWdpb24gbW9kZSBkZWFjdGl2YXRpb24gZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgdGhpcy52aWV3I3t0aGlzLmlkfTpkZWFjdGl2YXRlOnt0aGlzLl9tb2RlfVxuXHRcdCAqIEBldmVudCB0aGlzLnZpZXcje3RoaXMuaWR9OmRlYWN0aXZhdGVcblx0XHQgKi9cblx0XHR0aGlzLnRyaWdnZXIoJ2RlYWN0aXZhdGUnKTtcblxuXHRcdHRoaXMuX21vZGUgPSBtb2RlO1xuXHRcdHRoaXMucmVuZGVyKCBtb2RlICk7XG5cblx0XHQvKipcblx0XHQgKiBSZWdpb24gbW9kZSBhY3RpdmF0aW9uIGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IHRoaXMudmlldyN7dGhpcy5pZH06YWN0aXZhdGU6e3RoaXMuX21vZGV9XG5cdFx0ICogQGV2ZW50IHRoaXMudmlldyN7dGhpcy5pZH06YWN0aXZhdGVcblx0XHQgKi9cblx0XHR0aGlzLnRyaWdnZXIoJ2FjdGl2YXRlJyk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBSZW5kZXIgYSBtb2RlLlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IG1vZGVcblx0ICpcblx0ICogQGZpcmVzIHRoaXMudmlldyN7dGhpcy5pZH06Y3JlYXRlOnt0aGlzLl9tb2RlfVxuXHQgKiBAZmlyZXMgdGhpcy52aWV3I3t0aGlzLmlkfTpjcmVhdGVcblx0ICogQGZpcmVzIHRoaXMudmlldyN7dGhpcy5pZH06cmVuZGVyOnt0aGlzLl9tb2RlfVxuXHQgKiBAZmlyZXMgdGhpcy52aWV3I3t0aGlzLmlkfTpyZW5kZXJcblx0ICpcblx0ICogQHJldHVybnMge3dwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9ufSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbiggbW9kZSApIHtcblx0XHQvLyBJZiB0aGUgbW9kZSBpc24ndCBhY3RpdmUsIGFjdGl2YXRlIGl0LlxuXHRcdGlmICggbW9kZSAmJiBtb2RlICE9PSB0aGlzLl9tb2RlICkge1xuXHRcdFx0cmV0dXJuIHRoaXMubW9kZSggbW9kZSApO1xuXHRcdH1cblxuXHRcdHZhciBzZXQgPSB7IHZpZXc6IG51bGwgfSxcblx0XHRcdHZpZXc7XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGUgcmVnaW9uIHZpZXcgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBSZWdpb24gdmlldyBjcmVhdGlvbiB0YWtlcyBwbGFjZSBpbiBhbiBldmVudCBjYWxsYmFjayBvbiB0aGUgZnJhbWUuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgdGhpcy52aWV3I3t0aGlzLmlkfTpjcmVhdGU6e3RoaXMuX21vZGV9XG5cdFx0ICogQGV2ZW50IHRoaXMudmlldyN7dGhpcy5pZH06Y3JlYXRlXG5cdFx0ICovXG5cdFx0dGhpcy50cmlnZ2VyKCAnY3JlYXRlJywgc2V0ICk7XG5cdFx0dmlldyA9IHNldC52aWV3O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVuZGVyIHJlZ2lvbiB2aWV3IGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogUmVnaW9uIHZpZXcgY3JlYXRpb24gdGFrZXMgcGxhY2UgaW4gYW4gZXZlbnQgY2FsbGJhY2sgb24gdGhlIGZyYW1lLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IHRoaXMudmlldyN7dGhpcy5pZH06Y3JlYXRlOnt0aGlzLl9tb2RlfVxuXHRcdCAqIEBldmVudCB0aGlzLnZpZXcje3RoaXMuaWR9OmNyZWF0ZVxuXHRcdCAqL1xuXHRcdHRoaXMudHJpZ2dlciggJ3JlbmRlcicsIHZpZXcgKTtcblx0XHRpZiAoIHZpZXcgKSB7XG5cdFx0XHR0aGlzLnNldCggdmlldyApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogR2V0IHRoZSByZWdpb24ncyB2aWV3LlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHJldHVybnMge3dwLm1lZGlhLlZpZXd9XG5cdCAqL1xuXHRnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnZpZXcudmlld3MuZmlyc3QoIHRoaXMuc2VsZWN0b3IgKTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0IHRoZSByZWdpb24ncyB2aWV3IGFzIGEgc3VidmlldyBvZiB0aGUgZnJhbWUuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gdmlld3Ncblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XVxuXHQgKiBAcmV0dXJucyB7d3AuQmFja2JvbmUuU3Vidmlld3N9IFN1YnZpZXdzIGlzIHJldHVybmVkIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRzZXQ6IGZ1bmN0aW9uKCB2aWV3cywgb3B0aW9ucyApIHtcblx0XHRpZiAoIG9wdGlvbnMgKSB7XG5cdFx0XHRvcHRpb25zLmFkZCA9IGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy52aWV3LnZpZXdzLnNldCggdGhpcy5zZWxlY3Rvciwgdmlld3MsIG9wdGlvbnMgKTtcblx0fSxcblxuXHQvKipcblx0ICogVHJpZ2dlciByZWdpb25hbCB2aWV3IGV2ZW50cyBvbiB0aGUgZnJhbWUuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRcblx0ICogQHJldHVybnMge3VuZGVmaW5lZHx3cC5tZWRpYS5jb250cm9sbGVyLlJlZ2lvbn0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmcuXG5cdCAqL1xuXHR0cmlnZ2VyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGJhc2UsIGFyZ3M7XG5cblx0XHRpZiAoICEgdGhpcy5fbW9kZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRhcmdzID0gXy50b0FycmF5KCBhcmd1bWVudHMgKTtcblx0XHRiYXNlID0gdGhpcy5pZCArICc6JyArIGV2ZW50O1xuXG5cdFx0Ly8gVHJpZ2dlciBge3RoaXMuaWR9OntldmVudH06e3RoaXMuX21vZGV9YCBldmVudCBvbiB0aGUgZnJhbWUuXG5cdFx0YXJnc1swXSA9IGJhc2UgKyAnOicgKyB0aGlzLl9tb2RlO1xuXHRcdHRoaXMudmlldy50cmlnZ2VyLmFwcGx5KCB0aGlzLnZpZXcsIGFyZ3MgKTtcblxuXHRcdC8vIFRyaWdnZXIgYHt0aGlzLmlkfTp7ZXZlbnR9YCBldmVudCBvbiB0aGUgZnJhbWUuXG5cdFx0YXJnc1swXSA9IGJhc2U7XG5cdFx0dGhpcy52aWV3LnRyaWdnZXIuYXBwbHkoIHRoaXMudmlldywgYXJncyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWdpb247XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuUmVwbGFjZUltYWdlXG4gKlxuICogQSBzdGF0ZSBmb3IgcmVwbGFjaW5nIGFuIGltYWdlLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzXSAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgYXR0cmlidXRlcyBoYXNoIHBhc3NlZCB0byB0aGUgc3RhdGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZD1yZXBsYWNlLWltYWdlXSAgICAgICAgVW5pcXVlIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50aXRsZT1SZXBsYWNlIEltYWdlXSAgICAgVGl0bGUgZm9yIHRoZSBzdGF0ZS4gRGlzcGxheXMgaW4gdGhlIG1lZGlhIG1lbnUgYW5kIHRoZSBmcmFtZSdzIHRpdGxlIHJlZ2lvbi5cbiAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9IFthdHRyaWJ1dGVzLmxpYnJhcnldICAgICAgICAgICAgICAgICBUaGUgYXR0YWNobWVudHMgY29sbGVjdGlvbiB0byBicm93c2UuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgb25lIGlzIG5vdCBzdXBwbGllZCwgYSBjb2xsZWN0aW9uIG9mIGFsbCBpbWFnZXMgd2lsbCBiZSBjcmVhdGVkLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubXVsdGlwbGU9ZmFsc2VdICAgICAgICAgIFdoZXRoZXIgbXVsdGktc2VsZWN0IGlzIGVuYWJsZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb250ZW50PXVwbG9hZF0gICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgY29udGVudCByZWdpb24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT3ZlcnJpZGRlbiBieSBwZXJzaXN0ZW50IHVzZXIgc2V0dGluZyBpZiAnY29udGVudFVzZXJTZXR0aW5nJyBpcyB0cnVlLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubWVudT1kZWZhdWx0XSAgICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIG1lbnUgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucm91dGVyPWJyb3dzZV0gICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHJvdXRlciByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50b29sYmFyPXJlcGxhY2VdICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgdG9vbGJhciByZWdpb24uXG4gKiBAcGFyYW0ge2ludH0gICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5wcmlvcml0eT02MF0gICAgICAgICAgICAgVGhlIHByaW9yaXR5IGZvciB0aGUgc3RhdGUgbGluayBpbiB0aGUgbWVkaWEgbWVudS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNlYXJjaGFibGU9dHJ1ZV0gICAgICAgICBXaGV0aGVyIHRoZSBsaWJyYXJ5IGlzIHNlYXJjaGFibGUuXG4gKiBAcGFyYW0ge2Jvb2xlYW58c3RyaW5nfSAgICAgICAgICAgICBbYXR0cmlidXRlcy5maWx0ZXJhYmxlPXVwbG9hZGVkXSAgICAgV2hldGhlciB0aGUgbGlicmFyeSBpcyBmaWx0ZXJhYmxlLCBhbmQgaWYgc28gd2hhdCBmaWx0ZXJzIHNob3VsZCBiZSBzaG93bi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY2NlcHRzICdhbGwnLCAndXBsb2FkZWQnLCBvciAndW5hdHRhY2hlZCcuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zb3J0YWJsZT10cnVlXSAgICAgICAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2hvdWxkIGJlIHNvcnRhYmxlLiBEZXBlbmRzIG9uIHRoZSBvcmRlcmJ5IHByb3BlcnR5IGJlaW5nIHNldCB0byBtZW51T3JkZXIgb24gdGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5hdXRvU2VsZWN0PXRydWVdICAgICAgICAgV2hldGhlciBhbiB1cGxvYWRlZCBhdHRhY2htZW50IHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGFkZGVkIHRvIHRoZSBzZWxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5kZXNjcmliZT1mYWxzZV0gICAgICAgICAgV2hldGhlciB0byBvZmZlciBVSSB0byBkZXNjcmliZSBhdHRhY2htZW50cyAtIGUuZy4gY2FwdGlvbmluZyBpbWFnZXMgaW4gYSBnYWxsZXJ5LlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudFVzZXJTZXR0aW5nPXRydWVdIFdoZXRoZXIgdGhlIGNvbnRlbnQgcmVnaW9uJ3MgbW9kZSBzaG91bGQgYmUgc2V0IGFuZCBwZXJzaXN0ZWQgcGVyIHVzZXIuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zeW5jU2VsZWN0aW9uPXRydWVdICAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2VsZWN0aW9uIHNob3VsZCBiZSBwZXJzaXN0ZWQgZnJvbSB0aGUgbGFzdCBzdGF0ZS5cbiAqL1xudmFyIExpYnJhcnkgPSB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnksXG5cdGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdFJlcGxhY2VJbWFnZTtcblxuUmVwbGFjZUltYWdlID0gTGlicmFyeS5leHRlbmQoe1xuXHRkZWZhdWx0czogXy5kZWZhdWx0cyh7XG5cdFx0aWQ6ICAgICAgICAgICAgJ3JlcGxhY2UtaW1hZ2UnLFxuXHRcdHRpdGxlOiAgICAgICAgIGwxMG4ucmVwbGFjZUltYWdlVGl0bGUsXG5cdFx0bXVsdGlwbGU6ICAgICAgZmFsc2UsXG5cdFx0ZmlsdGVyYWJsZTogICAgJ3VwbG9hZGVkJyxcblx0XHR0b29sYmFyOiAgICAgICAncmVwbGFjZScsXG5cdFx0bWVudTogICAgICAgICAgZmFsc2UsXG5cdFx0cHJpb3JpdHk6ICAgICAgNjAsXG5cdFx0c3luY1NlbGVjdGlvbjogdHJ1ZVxuXHR9LCBMaWJyYXJ5LnByb3RvdHlwZS5kZWZhdWx0cyApLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICpcblx0ICogQHBhcmFtIG9wdGlvbnNcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdHZhciBsaWJyYXJ5LCBjb21wYXJhdG9yO1xuXG5cdFx0dGhpcy5pbWFnZSA9IG9wdGlvbnMuaW1hZ2U7XG5cdFx0Ly8gSWYgd2UgaGF2ZW4ndCBiZWVuIHByb3ZpZGVkIGEgYGxpYnJhcnlgLCBjcmVhdGUgYSBgU2VsZWN0aW9uYC5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ2xpYnJhcnknKSApIHtcblx0XHRcdHRoaXMuc2V0KCAnbGlicmFyeScsIHdwLm1lZGlhLnF1ZXJ5KHsgdHlwZTogJ2ltYWdlJyB9KSApO1xuXHRcdH1cblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0bGlicmFyeSAgICA9IHRoaXMuZ2V0KCdsaWJyYXJ5Jyk7XG5cdFx0Y29tcGFyYXRvciA9IGxpYnJhcnkuY29tcGFyYXRvcjtcblxuXHRcdC8vIE92ZXJsb2FkIHRoZSBsaWJyYXJ5J3MgY29tcGFyYXRvciB0byBwdXNoIGl0ZW1zIHRoYXQgYXJlIG5vdCBpblxuXHRcdC8vIHRoZSBtaXJyb3JlZCBxdWVyeSB0byB0aGUgZnJvbnQgb2YgdGhlIGFnZ3JlZ2F0ZSBjb2xsZWN0aW9uLlxuXHRcdGxpYnJhcnkuY29tcGFyYXRvciA9IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdFx0dmFyIGFJblF1ZXJ5ID0gISEgdGhpcy5taXJyb3JpbmcuZ2V0KCBhLmNpZCApLFxuXHRcdFx0XHRiSW5RdWVyeSA9ICEhIHRoaXMubWlycm9yaW5nLmdldCggYi5jaWQgKTtcblxuXHRcdFx0aWYgKCAhIGFJblF1ZXJ5ICYmIGJJblF1ZXJ5ICkge1xuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9IGVsc2UgaWYgKCBhSW5RdWVyeSAmJiAhIGJJblF1ZXJ5ICkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBjb21wYXJhdG9yLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gQWRkIGFsbCBpdGVtcyBpbiB0aGUgc2VsZWN0aW9uIHRvIHRoZSBsaWJyYXJ5LCBzbyBhbnkgZmVhdHVyZWRcblx0XHQvLyBpbWFnZXMgdGhhdCBhcmUgbm90IGluaXRpYWxseSBsb2FkZWQgc3RpbGwgYXBwZWFyLlxuXHRcdGxpYnJhcnkub2JzZXJ2ZSggdGhpcy5nZXQoJ3NlbGVjdGlvbicpICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjkuMFxuXHQgKi9cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudXBkYXRlU2VsZWN0aW9uKCk7XG5cdFx0TGlicmFyeS5wcm90b3R5cGUuYWN0aXZhdGUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdHVwZGF0ZVNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdGF0dGFjaG1lbnQgPSB0aGlzLmltYWdlLmF0dGFjaG1lbnQ7XG5cblx0XHRzZWxlY3Rpb24ucmVzZXQoIGF0dGFjaG1lbnQgPyBbIGF0dGFjaG1lbnQgXSA6IFtdICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcGxhY2VJbWFnZTtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5TaXRlSWNvbkNyb3BwZXJcbiAqXG4gKiBBIHN0YXRlIGZvciBjcm9wcGluZyBhIFNpdGUgSWNvbi5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLkNyb3BwZXJcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqL1xudmFyIENvbnRyb2xsZXIgPSB3cC5tZWRpYS5jb250cm9sbGVyLFxuXHRTaXRlSWNvbkNyb3BwZXI7XG5cblNpdGVJY29uQ3JvcHBlciA9IENvbnRyb2xsZXIuQ3JvcHBlci5leHRlbmQoe1xuXHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mcmFtZS5vbiggJ2NvbnRlbnQ6Y3JlYXRlOmNyb3AnLCB0aGlzLmNyZWF0ZUNyb3BDb250ZW50LCB0aGlzICk7XG5cdFx0dGhpcy5mcmFtZS5vbiggJ2Nsb3NlJywgdGhpcy5yZW1vdmVDcm9wcGVyLCB0aGlzICk7XG5cdFx0dGhpcy5zZXQoJ3NlbGVjdGlvbicsIG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKHRoaXMuZnJhbWUuX3NlbGVjdGlvbi5zaW5nbGUpKTtcblx0fSxcblxuXHRjcmVhdGVDcm9wQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcm9wcGVyVmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LlNpdGVJY29uQ3JvcHBlcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0YXR0YWNobWVudDogdGhpcy5nZXQoJ3NlbGVjdGlvbicpLmZpcnN0KClcblx0XHR9KTtcblx0XHR0aGlzLmNyb3BwZXJWaWV3Lm9uKCdpbWFnZS1sb2FkZWQnLCB0aGlzLmNyZWF0ZUNyb3BUb29sYmFyLCB0aGlzKTtcblx0XHR0aGlzLmZyYW1lLmNvbnRlbnQuc2V0KHRoaXMuY3JvcHBlclZpZXcpO1xuXG5cdH0sXG5cblx0ZG9Dcm9wOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHR2YXIgY3JvcERldGFpbHMgPSBhdHRhY2htZW50LmdldCggJ2Nyb3BEZXRhaWxzJyApLFxuXHRcdFx0Y29udHJvbCA9IHRoaXMuZ2V0KCAnY29udHJvbCcgKTtcblxuXHRcdGNyb3BEZXRhaWxzLmRzdF93aWR0aCAgPSBjb250cm9sLnBhcmFtcy53aWR0aDtcblx0XHRjcm9wRGV0YWlscy5kc3RfaGVpZ2h0ID0gY29udHJvbC5wYXJhbXMuaGVpZ2h0O1xuXG5cdFx0cmV0dXJuIHdwLmFqYXgucG9zdCggJ2Nyb3AtaW1hZ2UnLCB7XG5cdFx0XHRub25jZTogYXR0YWNobWVudC5nZXQoICdub25jZXMnICkuZWRpdCxcblx0XHRcdGlkOiBhdHRhY2htZW50LmdldCggJ2lkJyApLFxuXHRcdFx0Y29udGV4dDogJ3NpdGUtaWNvbicsXG5cdFx0XHRjcm9wRGV0YWlsczogY3JvcERldGFpbHNcblx0XHR9ICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpdGVJY29uQ3JvcHBlcjtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmVcbiAqXG4gKiBBIHN0YXRlIG1hY2hpbmUga2VlcHMgdHJhY2sgb2Ygc3RhdGUuIEl0IGlzIGluIG9uZSBzdGF0ZSBhdCBhIHRpbWUsXG4gKiBhbmQgY2FuIGNoYW5nZSBmcm9tIG9uZSBzdGF0ZSB0byBhbm90aGVyLlxuICpcbiAqIFN0YXRlcyBhcmUgc3RvcmVkIGFzIG1vZGVscyBpbiBhIEJhY2tib25lIGNvbGxlY3Rpb24uXG4gKlxuICogQHNpbmNlIDMuNS4wXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqIEBtaXhpblxuICogQG1peGVzIEJhY2tib25lLkV2ZW50c1xuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHN0YXRlc1xuICovXG52YXIgU3RhdGVNYWNoaW5lID0gZnVuY3Rpb24oIHN0YXRlcyApIHtcblx0Ly8gQHRvZG8gVGhpcyBpcyBkZWFkIGNvZGUuIFRoZSBzdGF0ZXMgY29sbGVjdGlvbiBnZXRzIGNyZWF0ZWQgaW4gbWVkaWEudmlldy5GcmFtZS5fY3JlYXRlU3RhdGVzLlxuXHR0aGlzLnN0YXRlcyA9IG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKCBzdGF0ZXMgKTtcbn07XG5cbi8vIFVzZSBCYWNrYm9uZSdzIHNlbGYtcHJvcGFnYXRpbmcgYGV4dGVuZGAgaW5oZXJpdGFuY2UgbWV0aG9kLlxuU3RhdGVNYWNoaW5lLmV4dGVuZCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZDtcblxuXy5leHRlbmQoIFN0YXRlTWFjaGluZS5wcm90b3R5cGUsIEJhY2tib25lLkV2ZW50cywge1xuXHQvKipcblx0ICogRmV0Y2ggYSBzdGF0ZS5cblx0ICpcblx0ICogSWYgbm8gYGlkYCBpcyBwcm92aWRlZCwgcmV0dXJucyB0aGUgYWN0aXZlIHN0YXRlLlxuXHQgKlxuXHQgKiBJbXBsaWNpdGx5IGNyZWF0ZXMgc3RhdGVzLlxuXHQgKlxuXHQgKiBFbnN1cmUgdGhhdCB0aGUgYHN0YXRlc2AgY29sbGVjdGlvbiBleGlzdHMgc28gdGhlIGBTdGF0ZU1hY2hpbmVgXG5cdCAqICAgY2FuIGJlIHVzZWQgYXMgYSBtaXhpbi5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEuY29udHJvbGxlci5TdGF0ZX0gUmV0dXJucyBhIFN0YXRlIG1vZGVsXG5cdCAqICAgZnJvbSB0aGUgU3RhdGVNYWNoaW5lIGNvbGxlY3Rpb25cblx0ICovXG5cdHN0YXRlOiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0dGhpcy5zdGF0ZXMgPSB0aGlzLnN0YXRlcyB8fCBuZXcgQmFja2JvbmUuQ29sbGVjdGlvbigpO1xuXG5cdFx0Ly8gRGVmYXVsdCB0byB0aGUgYWN0aXZlIHN0YXRlLlxuXHRcdGlkID0gaWQgfHwgdGhpcy5fc3RhdGU7XG5cblx0XHRpZiAoIGlkICYmICEgdGhpcy5zdGF0ZXMuZ2V0KCBpZCApICkge1xuXHRcdFx0dGhpcy5zdGF0ZXMuYWRkKHsgaWQ6IGlkIH0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zdGF0ZXMuZ2V0KCBpZCApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBhY3RpdmUgc3RhdGUuXG5cdCAqXG5cdCAqIEJhaWwgaWYgd2UncmUgdHJ5aW5nIHRvIHNlbGVjdCB0aGUgY3VycmVudCBzdGF0ZSwgaWYgd2UgaGF2ZW4ndFxuXHQgKiBjcmVhdGVkIHRoZSBgc3RhdGVzYCBjb2xsZWN0aW9uLCBvciBhcmUgdHJ5aW5nIHRvIHNlbGVjdCBhIHN0YXRlXG5cdCAqIHRoYXQgZG9lcyBub3QgZXhpc3QuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaWRcblx0ICpcblx0ICogQGZpcmVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUjZGVhY3RpdmF0ZVxuXHQgKiBAZmlyZXMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZSNhY3RpdmF0ZVxuXHQgKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmV9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRzZXRTdGF0ZTogZnVuY3Rpb24oIGlkICkge1xuXHRcdHZhciBwcmV2aW91cyA9IHRoaXMuc3RhdGUoKTtcblxuXHRcdGlmICggKCBwcmV2aW91cyAmJiBpZCA9PT0gcHJldmlvdXMuaWQgKSB8fCAhIHRoaXMuc3RhdGVzIHx8ICEgdGhpcy5zdGF0ZXMuZ2V0KCBpZCApICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0aWYgKCBwcmV2aW91cyApIHtcblx0XHRcdHByZXZpb3VzLnRyaWdnZXIoJ2RlYWN0aXZhdGUnKTtcblx0XHRcdHRoaXMuX2xhc3RTdGF0ZSA9IHByZXZpb3VzLmlkO1xuXHRcdH1cblxuXHRcdHRoaXMuX3N0YXRlID0gaWQ7XG5cdFx0dGhpcy5zdGF0ZSgpLnRyaWdnZXIoJ2FjdGl2YXRlJyk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgcHJldmlvdXMgYWN0aXZlIHN0YXRlLlxuXHQgKlxuXHQgKiBDYWxsIHRoZSBgc3RhdGUoKWAgbWV0aG9kIHdpdGggbm8gcGFyYW1ldGVycyB0byByZXRyaWV2ZSB0aGUgY3VycmVudFxuXHQgKiBhY3RpdmUgc3RhdGUuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEuY29udHJvbGxlci5TdGF0ZX0gUmV0dXJucyBhIFN0YXRlIG1vZGVsXG5cdCAqICAgIGZyb20gdGhlIFN0YXRlTWFjaGluZSBjb2xsZWN0aW9uXG5cdCAqL1xuXHRsYXN0U3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5fbGFzdFN0YXRlICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc3RhdGUoIHRoaXMuX2xhc3RTdGF0ZSApO1xuXHRcdH1cblx0fVxufSk7XG5cbi8vIE1hcCBhbGwgZXZlbnQgYmluZGluZyBhbmQgdHJpZ2dlcmluZyBvbiBhIFN0YXRlTWFjaGluZSB0byBpdHMgYHN0YXRlc2AgY29sbGVjdGlvbi5cbl8uZWFjaChbICdvbicsICdvZmYnLCAndHJpZ2dlcicgXSwgZnVuY3Rpb24oIG1ldGhvZCApIHtcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlTWFjaGluZX0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmcuXG5cdCAqL1xuXHRTdGF0ZU1hY2hpbmUucHJvdG90eXBlWyBtZXRob2QgXSA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEVuc3VyZSB0aGF0IHRoZSBgc3RhdGVzYCBjb2xsZWN0aW9uIGV4aXN0cyBzbyB0aGUgYFN0YXRlTWFjaGluZWBcblx0XHQvLyBjYW4gYmUgdXNlZCBhcyBhIG1peGluLlxuXHRcdHRoaXMuc3RhdGVzID0gdGhpcy5zdGF0ZXMgfHwgbmV3IEJhY2tib25lLkNvbGxlY3Rpb24oKTtcblx0XHQvLyBGb3J3YXJkIHRoZSBtZXRob2QgdG8gdGhlIGBzdGF0ZXNgIGNvbGxlY3Rpb24uXG5cdFx0dGhpcy5zdGF0ZXNbIG1ldGhvZCBdLmFwcGx5KCB0aGlzLnN0YXRlcywgYXJndW1lbnRzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZU1hY2hpbmU7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqXG4gKiBBIHN0YXRlIGlzIGEgc3RlcCBpbiBhIHdvcmtmbG93IHRoYXQgd2hlbiBzZXQgd2lsbCB0cmlnZ2VyIHRoZSBjb250cm9sbGVyc1xuICogZm9yIHRoZSByZWdpb25zIHRvIGJlIHVwZGF0ZWQgYXMgc3BlY2lmaWVkIGluIHRoZSBmcmFtZS5cbiAqXG4gKiBBIHN0YXRlIGhhcyBhbiBldmVudC1kcml2ZW4gbGlmZWN5Y2xlOlxuICpcbiAqICAgICAncmVhZHknICAgICAgdHJpZ2dlcnMgd2hlbiBhIHN0YXRlIGlzIGFkZGVkIHRvIGEgc3RhdGUgbWFjaGluZSdzIGNvbGxlY3Rpb24uXG4gKiAgICAgJ2FjdGl2YXRlJyAgIHRyaWdnZXJzIHdoZW4gYSBzdGF0ZSBpcyBhY3RpdmF0ZWQgYnkgYSBzdGF0ZSBtYWNoaW5lLlxuICogICAgICdkZWFjdGl2YXRlJyB0cmlnZ2VycyB3aGVuIGEgc3RhdGUgaXMgZGVhY3RpdmF0ZWQgYnkgYSBzdGF0ZSBtYWNoaW5lLlxuICogICAgICdyZXNldCcgICAgICBpcyBub3QgdHJpZ2dlcmVkIGF1dG9tYXRpY2FsbHkuIEl0IHNob3VsZCBiZSBpbnZva2VkIGJ5IHRoZVxuICogICAgICAgICAgICAgICAgICBwcm9wZXIgY29udHJvbGxlciB0byByZXNldCB0aGUgc3RhdGUgdG8gaXRzIGRlZmF1bHQuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqL1xudmFyIFN0YXRlID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcblx0LyoqXG5cdCAqIENvbnN0cnVjdG9yLlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGNvbnN0cnVjdG9yOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9uKCAnYWN0aXZhdGUnLCB0aGlzLl9wcmVBY3RpdmF0ZSwgdGhpcyApO1xuXHRcdHRoaXMub24oICdhY3RpdmF0ZScsIHRoaXMuYWN0aXZhdGUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnYWN0aXZhdGUnLCB0aGlzLl9wb3N0QWN0aXZhdGUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnZGVhY3RpdmF0ZScsIHRoaXMuX2RlYWN0aXZhdGUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnZGVhY3RpdmF0ZScsIHRoaXMuZGVhY3RpdmF0ZSwgdGhpcyApO1xuXHRcdHRoaXMub24oICdyZXNldCcsIHRoaXMucmVzZXQsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAncmVhZHknLCB0aGlzLl9yZWFkeSwgdGhpcyApO1xuXHRcdHRoaXMub24oICdyZWFkeScsIHRoaXMucmVhZHksIHRoaXMgKTtcblx0XHQvKipcblx0XHQgKiBDYWxsIHBhcmVudCBjb25zdHJ1Y3RvciB3aXRoIHBhc3NlZCBhcmd1bWVudHNcblx0XHQgKi9cblx0XHRCYWNrYm9uZS5Nb2RlbC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy5vbiggJ2NoYW5nZTptZW51JywgdGhpcy5fdXBkYXRlTWVudSwgdGhpcyApO1xuXHR9LFxuXHQvKipcblx0ICogUmVhZHkgZXZlbnQgY2FsbGJhY2suXG5cdCAqXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdHJlYWR5OiBmdW5jdGlvbigpIHt9LFxuXG5cdC8qKlxuXHQgKiBBY3RpdmF0ZSBldmVudCBjYWxsYmFjay5cblx0ICpcblx0ICogQGFic3RyYWN0XG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge30sXG5cblx0LyoqXG5cdCAqIERlYWN0aXZhdGUgZXZlbnQgY2FsbGJhY2suXG5cdCAqXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGRlYWN0aXZhdGU6IGZ1bmN0aW9uKCkge30sXG5cblx0LyoqXG5cdCAqIFJlc2V0IGV2ZW50IGNhbGxiYWNrLlxuXHQgKlxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRyZXNldDogZnVuY3Rpb24oKSB7fSxcblxuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0X3JlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl91cGRhdGVNZW51KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKiBAc2luY2UgMy41LjBcblx0Ki9cblx0X3ByZUFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFjdGl2ZSA9IHRydWU7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdF9wb3N0QWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMub24oICdjaGFuZ2U6bWVudScsIHRoaXMuX21lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnY2hhbmdlOnRpdGxlTW9kZScsIHRoaXMuX3RpdGxlLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NoYW5nZTpjb250ZW50JywgdGhpcy5fY29udGVudCwgdGhpcyApO1xuXHRcdHRoaXMub24oICdjaGFuZ2U6dG9vbGJhcicsIHRoaXMuX3Rvb2xiYXIsIHRoaXMgKTtcblxuXHRcdHRoaXMuZnJhbWUub24oICd0aXRsZTpyZW5kZXI6ZGVmYXVsdCcsIHRoaXMuX3JlbmRlclRpdGxlLCB0aGlzICk7XG5cblx0XHR0aGlzLl90aXRsZSgpO1xuXHRcdHRoaXMuX21lbnUoKTtcblx0XHR0aGlzLl90b29sYmFyKCk7XG5cdFx0dGhpcy5fY29udGVudCgpO1xuXHRcdHRoaXMuX3JvdXRlcigpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAYWNjZXNzIHByaXZhdGVcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRfZGVhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcblxuXHRcdHRoaXMuZnJhbWUub2ZmKCAndGl0bGU6cmVuZGVyOmRlZmF1bHQnLCB0aGlzLl9yZW5kZXJUaXRsZSwgdGhpcyApO1xuXG5cdFx0dGhpcy5vZmYoICdjaGFuZ2U6bWVudScsIHRoaXMuX21lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9mZiggJ2NoYW5nZTp0aXRsZU1vZGUnLCB0aGlzLl90aXRsZSwgdGhpcyApO1xuXHRcdHRoaXMub2ZmKCAnY2hhbmdlOmNvbnRlbnQnLCB0aGlzLl9jb250ZW50LCB0aGlzICk7XG5cdFx0dGhpcy5vZmYoICdjaGFuZ2U6dG9vbGJhcicsIHRoaXMuX3Rvb2xiYXIsIHRoaXMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0X3RpdGxlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZyYW1lLnRpdGxlLnJlbmRlciggdGhpcy5nZXQoJ3RpdGxlTW9kZScpIHx8ICdkZWZhdWx0JyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAYWNjZXNzIHByaXZhdGVcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRfcmVuZGVyVGl0bGU6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZpZXcuJGVsLnRleHQoIHRoaXMuZ2V0KCd0aXRsZScpIHx8ICcnICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdF9yb3V0ZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByb3V0ZXIgPSB0aGlzLmZyYW1lLnJvdXRlcixcblx0XHRcdG1vZGUgPSB0aGlzLmdldCgncm91dGVyJyksXG5cdFx0XHR2aWV3O1xuXG5cdFx0dGhpcy5mcmFtZS4kZWwudG9nZ2xlQ2xhc3MoICdoaWRlLXJvdXRlcicsICEgbW9kZSApO1xuXHRcdGlmICggISBtb2RlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuZnJhbWUucm91dGVyLnJlbmRlciggbW9kZSApO1xuXG5cdFx0dmlldyA9IHJvdXRlci5nZXQoKTtcblx0XHRpZiAoIHZpZXcgJiYgdmlldy5zZWxlY3QgKSB7XG5cdFx0XHR2aWV3LnNlbGVjdCggdGhpcy5mcmFtZS5jb250ZW50Lm1vZGUoKSApO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0X21lbnU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtZW51ID0gdGhpcy5mcmFtZS5tZW51LFxuXHRcdFx0bW9kZSA9IHRoaXMuZ2V0KCdtZW51JyksXG5cdFx0XHR2aWV3O1xuXG5cdFx0dGhpcy5mcmFtZS4kZWwudG9nZ2xlQ2xhc3MoICdoaWRlLW1lbnUnLCAhIG1vZGUgKTtcblx0XHRpZiAoICEgbW9kZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRtZW51Lm1vZGUoIG1vZGUgKTtcblxuXHRcdHZpZXcgPSBtZW51LmdldCgpO1xuXHRcdGlmICggdmlldyAmJiB2aWV3LnNlbGVjdCApIHtcblx0XHRcdHZpZXcuc2VsZWN0KCB0aGlzLmlkICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBAYWNjZXNzIHByaXZhdGVcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRfdXBkYXRlTWVudTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHByZXZpb3VzID0gdGhpcy5wcmV2aW91cygnbWVudScpLFxuXHRcdFx0bWVudSA9IHRoaXMuZ2V0KCdtZW51Jyk7XG5cblx0XHRpZiAoIHByZXZpb3VzICkge1xuXHRcdFx0dGhpcy5mcmFtZS5vZmYoICdtZW51OnJlbmRlcjonICsgcHJldmlvdXMsIHRoaXMuX3JlbmRlck1lbnUsIHRoaXMgKTtcblx0XHR9XG5cblx0XHRpZiAoIG1lbnUgKSB7XG5cdFx0XHR0aGlzLmZyYW1lLm9uKCAnbWVudTpyZW5kZXI6JyArIG1lbnUsIHRoaXMuX3JlbmRlck1lbnUsIHRoaXMgKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIHZpZXcgaW4gdGhlIG1lZGlhIG1lbnUgZm9yIHRoZSBzdGF0ZS5cblx0ICpcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge21lZGlhLnZpZXcuTWVudX0gdmlldyBUaGUgbWVudSB2aWV3LlxuXHQgKi9cblx0X3JlbmRlck1lbnU6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBtZW51SXRlbSA9IHRoaXMuZ2V0KCdtZW51SXRlbScpLFxuXHRcdFx0dGl0bGUgPSB0aGlzLmdldCgndGl0bGUnKSxcblx0XHRcdHByaW9yaXR5ID0gdGhpcy5nZXQoJ3ByaW9yaXR5Jyk7XG5cblx0XHRpZiAoICEgbWVudUl0ZW0gJiYgdGl0bGUgKSB7XG5cdFx0XHRtZW51SXRlbSA9IHsgdGV4dDogdGl0bGUgfTtcblxuXHRcdFx0aWYgKCBwcmlvcml0eSApIHtcblx0XHRcdFx0bWVudUl0ZW0ucHJpb3JpdHkgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoICEgbWVudUl0ZW0gKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmlldy5zZXQoIHRoaXMuaWQsIG1lbnVJdGVtICk7XG5cdH1cbn0pO1xuXG5fLmVhY2goWyd0b29sYmFyJywnY29udGVudCddLCBmdW5jdGlvbiggcmVnaW9uICkge1xuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqL1xuXHRTdGF0ZS5wcm90b3R5cGVbICdfJyArIHJlZ2lvbiBdID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1vZGUgPSB0aGlzLmdldCggcmVnaW9uICk7XG5cdFx0aWYgKCBtb2RlICkge1xuXHRcdFx0dGhpcy5mcmFtZVsgcmVnaW9uIF0ucmVuZGVyKCBtb2RlICk7XG5cdFx0fVxuXHR9O1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGU7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnNlbGVjdGlvblN5bmNcbiAqXG4gKiBTeW5jIGFuIGF0dGFjaG1lbnRzIHNlbGVjdGlvbiBpbiBhIHN0YXRlIHdpdGggYW5vdGhlciBzdGF0ZS5cbiAqXG4gKiBBbGxvd3MgZm9yIHNlbGVjdGluZyBtdWx0aXBsZSBpbWFnZXMgaW4gdGhlIEluc2VydCBNZWRpYSB3b3JrZmxvdywgYW5kIHRoZW5cbiAqIHN3aXRjaGluZyB0byB0aGUgSW5zZXJ0IEdhbGxlcnkgd29ya2Zsb3cgd2hpbGUgcHJlc2VydmluZyB0aGUgYXR0YWNobWVudHMgc2VsZWN0aW9uLlxuICpcbiAqIEBtaXhpblxuICovXG52YXIgc2VsZWN0aW9uU3luYyA9IHtcblx0LyoqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0c3luY1NlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdG1hbmFnZXIgPSB0aGlzLmZyYW1lLl9zZWxlY3Rpb247XG5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ3N5bmNTZWxlY3Rpb24nKSB8fCAhIG1hbmFnZXIgfHwgISBzZWxlY3Rpb24gKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIHNlbGVjdGlvbiBzdXBwb3J0cyBtdWx0aXBsZSBpdGVtcywgdmFsaWRhdGUgdGhlIHN0b3JlZFxuXHRcdC8vIGF0dGFjaG1lbnRzIGJhc2VkIG9uIHRoZSBuZXcgc2VsZWN0aW9uJ3MgY29uZGl0aW9ucy4gUmVjb3JkXG5cdFx0Ly8gdGhlIGF0dGFjaG1lbnRzIHRoYXQgYXJlIG5vdCBpbmNsdWRlZDsgd2UnbGwgbWFpbnRhaW4gYVxuXHRcdC8vIHJlZmVyZW5jZSB0byB0aG9zZS4gT3RoZXIgYXR0YWNobWVudHMgYXJlIGNvbnNpZGVyZWQgaW4gZmx1eC5cblx0XHRpZiAoIHNlbGVjdGlvbi5tdWx0aXBsZSApIHtcblx0XHRcdHNlbGVjdGlvbi5yZXNldCggW10sIHsgc2lsZW50OiB0cnVlIH0pO1xuXHRcdFx0c2VsZWN0aW9uLnZhbGlkYXRlQWxsKCBtYW5hZ2VyLmF0dGFjaG1lbnRzICk7XG5cdFx0XHRtYW5hZ2VyLmRpZmZlcmVuY2UgPSBfLmRpZmZlcmVuY2UoIG1hbmFnZXIuYXR0YWNobWVudHMubW9kZWxzLCBzZWxlY3Rpb24ubW9kZWxzICk7XG5cdFx0fVxuXG5cdFx0Ly8gU3luYyB0aGUgc2VsZWN0aW9uJ3Mgc2luZ2xlIGl0ZW0gd2l0aCB0aGUgbWFzdGVyLlxuXHRcdHNlbGVjdGlvbi5zaW5nbGUoIG1hbmFnZXIuc2luZ2xlICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlY29yZCB0aGUgY3VycmVudGx5IGFjdGl2ZSBhdHRhY2htZW50cywgd2hpY2ggaXMgYSBjb21iaW5hdGlvblxuXHQgKiBvZiB0aGUgc2VsZWN0aW9uJ3MgYXR0YWNobWVudHMgYW5kIHRoZSBzZXQgb2Ygc2VsZWN0ZWRcblx0ICogYXR0YWNobWVudHMgdGhhdCB0aGlzIHNwZWNpZmljIHNlbGVjdGlvbiBjb25zaWRlcmVkIGludmFsaWQuXG5cdCAqIFJlc2V0IHRoZSBkaWZmZXJlbmNlIGFuZCByZWNvcmQgdGhlIHNpbmdsZSBhdHRhY2htZW50LlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdHJlY29yZFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdG1hbmFnZXIgPSB0aGlzLmZyYW1lLl9zZWxlY3Rpb247XG5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ3N5bmNTZWxlY3Rpb24nKSB8fCAhIG1hbmFnZXIgfHwgISBzZWxlY3Rpb24gKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCBzZWxlY3Rpb24ubXVsdGlwbGUgKSB7XG5cdFx0XHRtYW5hZ2VyLmF0dGFjaG1lbnRzLnJlc2V0KCBzZWxlY3Rpb24udG9BcnJheSgpLmNvbmNhdCggbWFuYWdlci5kaWZmZXJlbmNlICkgKTtcblx0XHRcdG1hbmFnZXIuZGlmZmVyZW5jZSA9IFtdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtYW5hZ2VyLmF0dGFjaG1lbnRzLmFkZCggc2VsZWN0aW9uLnRvQXJyYXkoKSApO1xuXHRcdH1cblxuXHRcdG1hbmFnZXIuc2luZ2xlID0gc2VsZWN0aW9uLl9zaW5nbGU7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2VsZWN0aW9uU3luYztcbiIsInZhciBtZWRpYSA9IHdwLm1lZGlhLFxuXHQkID0galF1ZXJ5LFxuXHRsMTBuO1xuXG5tZWRpYS5pc1RvdWNoRGV2aWNlID0gKCAnb250b3VjaGVuZCcgaW4gZG9jdW1lbnQgKTtcblxuLy8gTGluayBhbnkgbG9jYWxpemVkIHN0cmluZ3MuXG5sMTBuID0gbWVkaWEudmlldy5sMTBuID0gd2luZG93Ll93cE1lZGlhVmlld3NMMTBuIHx8IHt9O1xuXG4vLyBMaW5rIGFueSBzZXR0aW5ncy5cbm1lZGlhLnZpZXcuc2V0dGluZ3MgPSBsMTBuLnNldHRpbmdzIHx8IHt9O1xuZGVsZXRlIGwxMG4uc2V0dGluZ3M7XG5cbi8vIENvcHkgdGhlIGBwb3N0YCBzZXR0aW5nIG92ZXIgdG8gdGhlIG1vZGVsIHNldHRpbmdzLlxubWVkaWEubW9kZWwuc2V0dGluZ3MucG9zdCA9IG1lZGlhLnZpZXcuc2V0dGluZ3MucG9zdDtcblxuLy8gQ2hlY2sgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgQ1NTIDMuMCB0cmFuc2l0aW9uc1xuJC5zdXBwb3J0LnRyYW5zaXRpb24gPSAoZnVuY3Rpb24oKXtcblx0dmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuXHRcdHRyYW5zaXRpb25zID0ge1xuXHRcdFx0V2Via2l0VHJhbnNpdGlvbjogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuXHRcdFx0TW96VHJhbnNpdGlvbjogICAgJ3RyYW5zaXRpb25lbmQnLFxuXHRcdFx0T1RyYW5zaXRpb246ICAgICAgJ29UcmFuc2l0aW9uRW5kIG90cmFuc2l0aW9uZW5kJyxcblx0XHRcdHRyYW5zaXRpb246ICAgICAgICd0cmFuc2l0aW9uZW5kJ1xuXHRcdH0sIHRyYW5zaXRpb247XG5cblx0dHJhbnNpdGlvbiA9IF8uZmluZCggXy5rZXlzKCB0cmFuc2l0aW9ucyApLCBmdW5jdGlvbiggdHJhbnNpdGlvbiApIHtcblx0XHRyZXR1cm4gISBfLmlzVW5kZWZpbmVkKCBzdHlsZVsgdHJhbnNpdGlvbiBdICk7XG5cdH0pO1xuXG5cdHJldHVybiB0cmFuc2l0aW9uICYmIHtcblx0XHRlbmQ6IHRyYW5zaXRpb25zWyB0cmFuc2l0aW9uIF1cblx0fTtcbn0oKSk7XG5cbi8qKlxuICogQSBzaGFyZWQgZXZlbnQgYnVzIHVzZWQgdG8gcHJvdmlkZSBldmVudHMgaW50b1xuICogdGhlIG1lZGlhIHdvcmtmbG93cyB0aGF0IDNyZC1wYXJ0eSBkZXZzIGNhbiB1c2UgdG8gaG9va1xuICogaW4uXG4gKi9cbm1lZGlhLmV2ZW50cyA9IF8uZXh0ZW5kKCB7fSwgQmFja2JvbmUuRXZlbnRzICk7XG5cbi8qKlxuICogTWFrZXMgaXQgZWFzaWVyIHRvIGJpbmQgZXZlbnRzIHVzaW5nIHRyYW5zaXRpb25zLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IHNlbnNpdGl2aXR5XG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xubWVkaWEudHJhbnNpdGlvbiA9IGZ1bmN0aW9uKCBzZWxlY3Rvciwgc2Vuc2l0aXZpdHkgKSB7XG5cdHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblxuXHRzZW5zaXRpdml0eSA9IHNlbnNpdGl2aXR5IHx8IDIwMDA7XG5cblx0aWYgKCAkLnN1cHBvcnQudHJhbnNpdGlvbiApIHtcblx0XHRpZiAoICEgKHNlbGVjdG9yIGluc3RhbmNlb2YgJCkgKSB7XG5cdFx0XHRzZWxlY3RvciA9ICQoIHNlbGVjdG9yICk7XG5cdFx0fVxuXG5cdFx0Ly8gUmVzb2x2ZSB0aGUgZGVmZXJyZWQgd2hlbiB0aGUgZmlyc3QgZWxlbWVudCBmaW5pc2hlcyBhbmltYXRpbmcuXG5cdFx0c2VsZWN0b3IuZmlyc3QoKS5vbmUoICQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZCwgZGVmZXJyZWQucmVzb2x2ZSApO1xuXG5cdFx0Ly8gSnVzdCBpbiBjYXNlIHRoZSBldmVudCBkb2Vzbid0IHRyaWdnZXIsIGZpcmUgYSBjYWxsYmFjay5cblx0XHRfLmRlbGF5KCBkZWZlcnJlZC5yZXNvbHZlLCBzZW5zaXRpdml0eSApO1xuXG5cdC8vIE90aGVyd2lzZSwgZXhlY3V0ZSBvbiB0aGUgc3BvdC5cblx0fSBlbHNlIHtcblx0XHRkZWZlcnJlZC5yZXNvbHZlKCk7XG5cdH1cblxuXHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xufTtcblxubWVkaWEuY29udHJvbGxlci5SZWdpb24gPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9yZWdpb24uanMnICk7XG5tZWRpYS5jb250cm9sbGVyLlN0YXRlTWFjaGluZSA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL3N0YXRlLW1hY2hpbmUuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLlN0YXRlID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvc3RhdGUuanMnICk7XG5cbm1lZGlhLnNlbGVjdGlvblN5bmMgPSByZXF1aXJlKCAnLi91dGlscy9zZWxlY3Rpb24tc3luYy5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeSA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2xpYnJhcnkuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkltYWdlRGV0YWlscyA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2ltYWdlLWRldGFpbHMuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkdhbGxlcnlFZGl0ID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvZ2FsbGVyeS1lZGl0LmpzJyApO1xubWVkaWEuY29udHJvbGxlci5HYWxsZXJ5QWRkID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvZ2FsbGVyeS1hZGQuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkNvbGxlY3Rpb25FZGl0ID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvY29sbGVjdGlvbi1lZGl0LmpzJyApO1xubWVkaWEuY29udHJvbGxlci5Db2xsZWN0aW9uQWRkID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvY29sbGVjdGlvbi1hZGQuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkZlYXR1cmVkSW1hZ2UgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9mZWF0dXJlZC1pbWFnZS5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuUmVwbGFjZUltYWdlID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvcmVwbGFjZS1pbWFnZS5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuRWRpdEltYWdlID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvZWRpdC1pbWFnZS5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuTWVkaWFMaWJyYXJ5ID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvbWVkaWEtbGlicmFyeS5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuRW1iZWQgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9lbWJlZC5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuQ3JvcHBlciA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2Nyb3BwZXIuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkN1c3RvbWl6ZUltYWdlQ3JvcHBlciA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2N1c3RvbWl6ZS1pbWFnZS1jcm9wcGVyLmpzJyApO1xubWVkaWEuY29udHJvbGxlci5TaXRlSWNvbkNyb3BwZXIgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9zaXRlLWljb24tY3JvcHBlci5qcycgKTtcblxubWVkaWEuVmlldyA9IHJlcXVpcmUoICcuL3ZpZXdzL3ZpZXcuanMnICk7XG5tZWRpYS52aWV3LkZyYW1lID0gcmVxdWlyZSggJy4vdmlld3MvZnJhbWUuanMnICk7XG5tZWRpYS52aWV3Lk1lZGlhRnJhbWUgPSByZXF1aXJlKCAnLi92aWV3cy9tZWRpYS1mcmFtZS5qcycgKTtcbm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5TZWxlY3QgPSByZXF1aXJlKCAnLi92aWV3cy9mcmFtZS9zZWxlY3QuanMnICk7XG5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuUG9zdCA9IHJlcXVpcmUoICcuL3ZpZXdzL2ZyYW1lL3Bvc3QuanMnICk7XG5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuSW1hZ2VEZXRhaWxzID0gcmVxdWlyZSggJy4vdmlld3MvZnJhbWUvaW1hZ2UtZGV0YWlscy5qcycgKTtcbm1lZGlhLnZpZXcuTW9kYWwgPSByZXF1aXJlKCAnLi92aWV3cy9tb2RhbC5qcycgKTtcbm1lZGlhLnZpZXcuRm9jdXNNYW5hZ2VyID0gcmVxdWlyZSggJy4vdmlld3MvZm9jdXMtbWFuYWdlci5qcycgKTtcbm1lZGlhLnZpZXcuVXBsb2FkZXJXaW5kb3cgPSByZXF1aXJlKCAnLi92aWV3cy91cGxvYWRlci93aW5kb3cuanMnICk7XG5tZWRpYS52aWV3LkVkaXRvclVwbG9hZGVyID0gcmVxdWlyZSggJy4vdmlld3MvdXBsb2FkZXIvZWRpdG9yLmpzJyApO1xubWVkaWEudmlldy5VcGxvYWRlcklubGluZSA9IHJlcXVpcmUoICcuL3ZpZXdzL3VwbG9hZGVyL2lubGluZS5qcycgKTtcbm1lZGlhLnZpZXcuVXBsb2FkZXJTdGF0dXMgPSByZXF1aXJlKCAnLi92aWV3cy91cGxvYWRlci9zdGF0dXMuanMnICk7XG5tZWRpYS52aWV3LlVwbG9hZGVyU3RhdHVzRXJyb3IgPSByZXF1aXJlKCAnLi92aWV3cy91cGxvYWRlci9zdGF0dXMtZXJyb3IuanMnICk7XG5tZWRpYS52aWV3LlRvb2xiYXIgPSByZXF1aXJlKCAnLi92aWV3cy90b29sYmFyLmpzJyApO1xubWVkaWEudmlldy5Ub29sYmFyLlNlbGVjdCA9IHJlcXVpcmUoICcuL3ZpZXdzL3Rvb2xiYXIvc2VsZWN0LmpzJyApO1xubWVkaWEudmlldy5Ub29sYmFyLkVtYmVkID0gcmVxdWlyZSggJy4vdmlld3MvdG9vbGJhci9lbWJlZC5qcycgKTtcbm1lZGlhLnZpZXcuQnV0dG9uID0gcmVxdWlyZSggJy4vdmlld3MvYnV0dG9uLmpzJyApO1xubWVkaWEudmlldy5CdXR0b25Hcm91cCA9IHJlcXVpcmUoICcuL3ZpZXdzL2J1dHRvbi1ncm91cC5qcycgKTtcbm1lZGlhLnZpZXcuUHJpb3JpdHlMaXN0ID0gcmVxdWlyZSggJy4vdmlld3MvcHJpb3JpdHktbGlzdC5qcycgKTtcbm1lZGlhLnZpZXcuTWVudUl0ZW0gPSByZXF1aXJlKCAnLi92aWV3cy9tZW51LWl0ZW0uanMnICk7XG5tZWRpYS52aWV3Lk1lbnUgPSByZXF1aXJlKCAnLi92aWV3cy9tZW51LmpzJyApO1xubWVkaWEudmlldy5Sb3V0ZXJJdGVtID0gcmVxdWlyZSggJy4vdmlld3Mvcm91dGVyLWl0ZW0uanMnICk7XG5tZWRpYS52aWV3LlJvdXRlciA9IHJlcXVpcmUoICcuL3ZpZXdzL3JvdXRlci5qcycgKTtcbm1lZGlhLnZpZXcuU2lkZWJhciA9IHJlcXVpcmUoICcuL3ZpZXdzL3NpZGViYXIuanMnICk7XG5tZWRpYS52aWV3LkF0dGFjaG1lbnQgPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50LmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50LkxpYnJhcnkgPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50L2xpYnJhcnkuanMnICk7XG5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRWRpdExpYnJhcnkgPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50L2VkaXQtbGlicmFyeS5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudHMgPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50cy5qcycgKTtcbm1lZGlhLnZpZXcuU2VhcmNoID0gcmVxdWlyZSggJy4vdmlld3Mvc2VhcmNoLmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50RmlsdGVycyA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnQtZmlsdGVycy5qcycgKTtcbm1lZGlhLnZpZXcuRGF0ZUZpbHRlciA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnQtZmlsdGVycy9kYXRlLmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50RmlsdGVycy5VcGxvYWRlZCA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnQtZmlsdGVycy91cGxvYWRlZC5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMuQWxsID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudC1maWx0ZXJzL2FsbC5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudHNCcm93c2VyID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudHMvYnJvd3Nlci5qcycgKTtcbm1lZGlhLnZpZXcuU2VsZWN0aW9uID0gcmVxdWlyZSggJy4vdmlld3Mvc2VsZWN0aW9uLmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50LlNlbGVjdGlvbiA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnQvc2VsZWN0aW9uLmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50cy5TZWxlY3Rpb24gPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50cy9zZWxlY3Rpb24uanMnICk7XG5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRWRpdFNlbGVjdGlvbiA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnQvZWRpdC1zZWxlY3Rpb24uanMnICk7XG5tZWRpYS52aWV3LlNldHRpbmdzID0gcmVxdWlyZSggJy4vdmlld3Mvc2V0dGluZ3MuanMnICk7XG5tZWRpYS52aWV3LlNldHRpbmdzLkF0dGFjaG1lbnREaXNwbGF5ID0gcmVxdWlyZSggJy4vdmlld3Mvc2V0dGluZ3MvYXR0YWNobWVudC1kaXNwbGF5LmpzJyApO1xubWVkaWEudmlldy5TZXR0aW5ncy5HYWxsZXJ5ID0gcmVxdWlyZSggJy4vdmlld3Mvc2V0dGluZ3MvZ2FsbGVyeS5qcycgKTtcbm1lZGlhLnZpZXcuU2V0dGluZ3MuUGxheWxpc3QgPSByZXF1aXJlKCAnLi92aWV3cy9zZXR0aW5ncy9wbGF5bGlzdC5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudC5EZXRhaWxzID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudC9kZXRhaWxzLmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50Q29tcGF0ID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudC1jb21wYXQuanMnICk7XG5tZWRpYS52aWV3LklmcmFtZSA9IHJlcXVpcmUoICcuL3ZpZXdzL2lmcmFtZS5qcycgKTtcbm1lZGlhLnZpZXcuRW1iZWQgPSByZXF1aXJlKCAnLi92aWV3cy9lbWJlZC5qcycgKTtcbm1lZGlhLnZpZXcuTGFiZWwgPSByZXF1aXJlKCAnLi92aWV3cy9sYWJlbC5qcycgKTtcbm1lZGlhLnZpZXcuRW1iZWRVcmwgPSByZXF1aXJlKCAnLi92aWV3cy9lbWJlZC91cmwuanMnICk7XG5tZWRpYS52aWV3LkVtYmVkTGluayA9IHJlcXVpcmUoICcuL3ZpZXdzL2VtYmVkL2xpbmsuanMnICk7XG5tZWRpYS52aWV3LkVtYmVkSW1hZ2UgPSByZXF1aXJlKCAnLi92aWV3cy9lbWJlZC9pbWFnZS5qcycgKTtcbm1lZGlhLnZpZXcuSW1hZ2VEZXRhaWxzID0gcmVxdWlyZSggJy4vdmlld3MvaW1hZ2UtZGV0YWlscy5qcycgKTtcbm1lZGlhLnZpZXcuQ3JvcHBlciA9IHJlcXVpcmUoICcuL3ZpZXdzL2Nyb3BwZXIuanMnICk7XG5tZWRpYS52aWV3LlNpdGVJY29uQ3JvcHBlciA9IHJlcXVpcmUoICcuL3ZpZXdzL3NpdGUtaWNvbi1jcm9wcGVyLmpzJyApO1xubWVkaWEudmlldy5TaXRlSWNvblByZXZpZXcgPSByZXF1aXJlKCAnLi92aWV3cy9zaXRlLWljb24tcHJldmlldy5qcycgKTtcbm1lZGlhLnZpZXcuRWRpdEltYWdlID0gcmVxdWlyZSggJy4vdmlld3MvZWRpdC1pbWFnZS5qcycgKTtcbm1lZGlhLnZpZXcuU3Bpbm5lciA9IHJlcXVpcmUoICcuL3ZpZXdzL3NwaW5uZXIuanMnICk7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudENvbXBhdFxuICpcbiAqIEEgdmlldyB0byBkaXNwbGF5IGZpZWxkcyBhZGRlZCB2aWEgdGhlIGBhdHRhY2htZW50X2ZpZWxkc190b19lZGl0YCBmaWx0ZXIuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0QXR0YWNobWVudENvbXBhdDtcblxuQXR0YWNobWVudENvbXBhdCA9IFZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZm9ybScsXG5cdGNsYXNzTmFtZTogJ2NvbXBhdC1pdGVtJyxcblxuXHRldmVudHM6IHtcblx0XHQnc3VibWl0JzogICAgICAgICAgJ3ByZXZlbnREZWZhdWx0Jyxcblx0XHQnY2hhbmdlIGlucHV0JzogICAgJ3NhdmUnLFxuXHRcdCdjaGFuZ2Ugc2VsZWN0JzogICAnc2F2ZScsXG5cdFx0J2NoYW5nZSB0ZXh0YXJlYSc6ICdzYXZlJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6Y29tcGF0JywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRDb21wYXR9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuJCgnOmZvY3VzJykubGVuZ3RoICkge1xuXHRcdFx0dGhpcy5zYXZlKCk7XG5cdFx0fVxuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ2Rpc3Bvc2UnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3Ncblx0XHQgKi9cblx0XHRyZXR1cm4gVmlldy5wcm90b3R5cGUuZGlzcG9zZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5BdHRhY2htZW50Q29tcGF0fSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29tcGF0ID0gdGhpcy5tb2RlbC5nZXQoJ2NvbXBhdCcpO1xuXHRcdGlmICggISBjb21wYXQgfHwgISBjb21wYXQuaXRlbSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLnZpZXdzLmRldGFjaCgpO1xuXHRcdHRoaXMuJGVsLmh0bWwoIGNvbXBhdC5pdGVtICk7XG5cdFx0dGhpcy52aWV3cy5yZW5kZXIoKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0cHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRzYXZlOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGRhdGEgPSB7fTtcblxuXHRcdGlmICggZXZlbnQgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdF8uZWFjaCggdGhpcy4kZWwuc2VyaWFsaXplQXJyYXkoKSwgZnVuY3Rpb24oIHBhaXIgKSB7XG5cdFx0XHRkYXRhWyBwYWlyLm5hbWUgXSA9IHBhaXIudmFsdWU7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmNvbnRyb2xsZXIudHJpZ2dlciggJ2F0dGFjaG1lbnQ6Y29tcGF0OndhaXRpbmcnLCBbJ3dhaXRpbmcnXSApO1xuXHRcdHRoaXMubW9kZWwuc2F2ZUNvbXBhdCggZGF0YSApLmFsd2F5cyggXy5iaW5kKCB0aGlzLnBvc3RTYXZlLCB0aGlzICkgKTtcblx0fSxcblxuXHRwb3N0U2F2ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdhdHRhY2htZW50OmNvbXBhdDpyZWFkeScsIFsncmVhZHknXSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdHRhY2htZW50Q29tcGF0O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciAkID0galF1ZXJ5LFxuXHRBdHRhY2htZW50RmlsdGVycztcblxuQXR0YWNobWVudEZpbHRlcnMgPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ3NlbGVjdCcsXG5cdGNsYXNzTmFtZTogJ2F0dGFjaG1lbnQtZmlsdGVycycsXG5cdGlkOiAgICAgICAgJ21lZGlhLWF0dGFjaG1lbnQtZmlsdGVycycsXG5cblx0ZXZlbnRzOiB7XG5cdFx0Y2hhbmdlOiAnY2hhbmdlJ1xuXHR9LFxuXG5cdGtleXM6IFtdLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY3JlYXRlRmlsdGVycygpO1xuXHRcdF8uZXh0ZW5kKCB0aGlzLmZpbHRlcnMsIHRoaXMub3B0aW9ucy5maWx0ZXJzICk7XG5cblx0XHQvLyBCdWlsZCBgPG9wdGlvbj5gIGVsZW1lbnRzLlxuXHRcdHRoaXMuJGVsLmh0bWwoIF8uY2hhaW4oIHRoaXMuZmlsdGVycyApLm1hcCggZnVuY3Rpb24oIGZpbHRlciwgdmFsdWUgKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRlbDogJCggJzxvcHRpb24+PC9vcHRpb24+JyApLnZhbCggdmFsdWUgKS5odG1sKCBmaWx0ZXIudGV4dCApWzBdLFxuXHRcdFx0XHRwcmlvcml0eTogZmlsdGVyLnByaW9yaXR5IHx8IDUwXG5cdFx0XHR9O1xuXHRcdH0sIHRoaXMgKS5zb3J0QnkoJ3ByaW9yaXR5JykucGx1Y2soJ2VsJykudmFsdWUoKSApO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZScsIHRoaXMuc2VsZWN0ICk7XG5cdFx0dGhpcy5zZWxlY3QoKTtcblx0fSxcblxuXHQvKipcblx0ICogQGFic3RyYWN0XG5cdCAqL1xuXHRjcmVhdGVGaWx0ZXJzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZpbHRlcnMgPSB7fTtcblx0fSxcblxuXHQvKipcblx0ICogV2hlbiB0aGUgc2VsZWN0ZWQgZmlsdGVyIGNoYW5nZXMsIHVwZGF0ZSB0aGUgQXR0YWNobWVudCBRdWVyeSBwcm9wZXJ0aWVzIHRvIG1hdGNoLlxuXHQgKi9cblx0Y2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcy5maWx0ZXJzWyB0aGlzLmVsLnZhbHVlIF07XG5cdFx0aWYgKCBmaWx0ZXIgKSB7XG5cdFx0XHR0aGlzLm1vZGVsLnNldCggZmlsdGVyLnByb3BzICk7XG5cdFx0fVxuXHR9LFxuXG5cdHNlbGVjdDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5tb2RlbCxcblx0XHRcdHZhbHVlID0gJ2FsbCcsXG5cdFx0XHRwcm9wcyA9IG1vZGVsLnRvSlNPTigpO1xuXG5cdFx0Xy5maW5kKCB0aGlzLmZpbHRlcnMsIGZ1bmN0aW9uKCBmaWx0ZXIsIGlkICkge1xuXHRcdFx0dmFyIGVxdWFsID0gXy5hbGwoIGZpbHRlci5wcm9wcywgZnVuY3Rpb24oIHByb3AsIGtleSApIHtcblx0XHRcdFx0cmV0dXJuIHByb3AgPT09ICggXy5pc1VuZGVmaW5lZCggcHJvcHNbIGtleSBdICkgPyBudWxsIDogcHJvcHNbIGtleSBdICk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKCBlcXVhbCApIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlID0gaWQ7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLiRlbC52YWwoIHZhbHVlICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF0dGFjaG1lbnRGaWx0ZXJzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzLkFsbFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnNcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdEFsbDtcblxuQWxsID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50RmlsdGVycy5leHRlbmQoe1xuXHRjcmVhdGVGaWx0ZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZmlsdGVycyA9IHt9O1xuXG5cdFx0Xy5lYWNoKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLm1pbWVUeXBlcyB8fCB7fSwgZnVuY3Rpb24oIHRleHQsIGtleSApIHtcblx0XHRcdGZpbHRlcnNbIGtleSBdID0ge1xuXHRcdFx0XHR0ZXh0OiB0ZXh0LFxuXHRcdFx0XHRwcm9wczoge1xuXHRcdFx0XHRcdHN0YXR1czogIG51bGwsXG5cdFx0XHRcdFx0dHlwZTogICAga2V5LFxuXHRcdFx0XHRcdHVwbG9hZGVkVG86IG51bGwsXG5cdFx0XHRcdFx0b3JkZXJieTogJ2RhdGUnLFxuXHRcdFx0XHRcdG9yZGVyOiAgICdERVNDJ1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH0pO1xuXG5cdFx0ZmlsdGVycy5hbGwgPSB7XG5cdFx0XHR0ZXh0OiAgbDEwbi5hbGxNZWRpYUl0ZW1zLFxuXHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0c3RhdHVzOiAgbnVsbCxcblx0XHRcdFx0dHlwZTogICAgbnVsbCxcblx0XHRcdFx0dXBsb2FkZWRUbzogbnVsbCxcblx0XHRcdFx0b3JkZXJieTogJ2RhdGUnLFxuXHRcdFx0XHRvcmRlcjogICAnREVTQydcblx0XHRcdH0sXG5cdFx0XHRwcmlvcml0eTogMTBcblx0XHR9O1xuXG5cdFx0aWYgKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuaWQgKSB7XG5cdFx0XHRmaWx0ZXJzLnVwbG9hZGVkID0ge1xuXHRcdFx0XHR0ZXh0OiAgbDEwbi51cGxvYWRlZFRvVGhpc1Bvc3QsXG5cdFx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdFx0c3RhdHVzOiAgbnVsbCxcblx0XHRcdFx0XHR0eXBlOiAgICBudWxsLFxuXHRcdFx0XHRcdHVwbG9hZGVkVG86IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MucG9zdC5pZCxcblx0XHRcdFx0XHRvcmRlcmJ5OiAnbWVudU9yZGVyJyxcblx0XHRcdFx0XHRvcmRlcjogICAnQVNDJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmlvcml0eTogMjBcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0ZmlsdGVycy51bmF0dGFjaGVkID0ge1xuXHRcdFx0dGV4dDogIGwxMG4udW5hdHRhY2hlZCxcblx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdHN0YXR1czogICAgIG51bGwsXG5cdFx0XHRcdHVwbG9hZGVkVG86IDAsXG5cdFx0XHRcdHR5cGU6ICAgICAgIG51bGwsXG5cdFx0XHRcdG9yZGVyYnk6ICAgICdtZW51T3JkZXInLFxuXHRcdFx0XHRvcmRlcjogICAgICAnQVNDJ1xuXHRcdFx0fSxcblx0XHRcdHByaW9yaXR5OiA1MFxuXHRcdH07XG5cblx0XHRpZiAoIHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MubWVkaWFUcmFzaCAmJlxuXHRcdFx0dGhpcy5jb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ2dyaWQnICkgKSB7XG5cblx0XHRcdGZpbHRlcnMudHJhc2ggPSB7XG5cdFx0XHRcdHRleHQ6ICBsMTBuLnRyYXNoLFxuXHRcdFx0XHRwcm9wczoge1xuXHRcdFx0XHRcdHVwbG9hZGVkVG86IG51bGwsXG5cdFx0XHRcdFx0c3RhdHVzOiAgICAgJ3RyYXNoJyxcblx0XHRcdFx0XHR0eXBlOiAgICAgICBudWxsLFxuXHRcdFx0XHRcdG9yZGVyYnk6ICAgICdkYXRlJyxcblx0XHRcdFx0XHRvcmRlcjogICAgICAnREVTQydcblx0XHRcdFx0fSxcblx0XHRcdFx0cHJpb3JpdHk6IDUwXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHRoaXMuZmlsdGVycyA9IGZpbHRlcnM7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFsbDtcbiIsIi8qKlxuICogQSBmaWx0ZXIgZHJvcGRvd24gZm9yIG1vbnRoL2RhdGVzLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnNcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdERhdGVGaWx0ZXI7XG5cbkRhdGVGaWx0ZXIgPSB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzLmV4dGVuZCh7XG5cdGlkOiAnbWVkaWEtYXR0YWNobWVudC1kYXRlLWZpbHRlcnMnLFxuXG5cdGNyZWF0ZUZpbHRlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmaWx0ZXJzID0ge307XG5cdFx0Xy5lYWNoKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLm1vbnRocyB8fCB7fSwgZnVuY3Rpb24oIHZhbHVlLCBpbmRleCApIHtcblx0XHRcdGZpbHRlcnNbIGluZGV4IF0gPSB7XG5cdFx0XHRcdHRleHQ6IHZhbHVlLnRleHQsXG5cdFx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdFx0eWVhcjogdmFsdWUueWVhcixcblx0XHRcdFx0XHRtb250aG51bTogdmFsdWUubW9udGhcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9KTtcblx0XHRmaWx0ZXJzLmFsbCA9IHtcblx0XHRcdHRleHQ6ICBsMTBuLmFsbERhdGVzLFxuXHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0bW9udGhudW06IGZhbHNlLFxuXHRcdFx0XHR5ZWFyOiAgZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRwcmlvcml0eTogMTBcblx0XHR9O1xuXHRcdHRoaXMuZmlsdGVycyA9IGZpbHRlcnM7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGVGaWx0ZXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMuVXBsb2FkZWRcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRVcGxvYWRlZDtcblxuVXBsb2FkZWQgPSB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzLmV4dGVuZCh7XG5cdGNyZWF0ZUZpbHRlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0eXBlID0gdGhpcy5tb2RlbC5nZXQoJ3R5cGUnKSxcblx0XHRcdHR5cGVzID0gd3AubWVkaWEudmlldy5zZXR0aW5ncy5taW1lVHlwZXMsXG5cdFx0XHR0ZXh0O1xuXG5cdFx0aWYgKCB0eXBlcyAmJiB0eXBlICkge1xuXHRcdFx0dGV4dCA9IHR5cGVzWyB0eXBlIF07XG5cdFx0fVxuXG5cdFx0dGhpcy5maWx0ZXJzID0ge1xuXHRcdFx0YWxsOiB7XG5cdFx0XHRcdHRleHQ6ICB0ZXh0IHx8IGwxMG4uYWxsTWVkaWFJdGVtcyxcblx0XHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0XHR1cGxvYWRlZFRvOiBudWxsLFxuXHRcdFx0XHRcdG9yZGVyYnk6ICdkYXRlJyxcblx0XHRcdFx0XHRvcmRlcjogICAnREVTQydcblx0XHRcdFx0fSxcblx0XHRcdFx0cHJpb3JpdHk6IDEwXG5cdFx0XHR9LFxuXG5cdFx0XHR1cGxvYWRlZDoge1xuXHRcdFx0XHR0ZXh0OiAgbDEwbi51cGxvYWRlZFRvVGhpc1Bvc3QsXG5cdFx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdFx0dXBsb2FkZWRUbzogd3AubWVkaWEudmlldy5zZXR0aW5ncy5wb3N0LmlkLFxuXHRcdFx0XHRcdG9yZGVyYnk6ICdtZW51T3JkZXInLFxuXHRcdFx0XHRcdG9yZGVyOiAgICdBU0MnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByaW9yaXR5OiAyMFxuXHRcdFx0fSxcblxuXHRcdFx0dW5hdHRhY2hlZDoge1xuXHRcdFx0XHR0ZXh0OiAgbDEwbi51bmF0dGFjaGVkLFxuXHRcdFx0XHRwcm9wczoge1xuXHRcdFx0XHRcdHVwbG9hZGVkVG86IDAsXG5cdFx0XHRcdFx0b3JkZXJieTogJ21lbnVPcmRlcicsXG5cdFx0XHRcdFx0b3JkZXI6ICAgJ0FTQydcblx0XHRcdFx0fSxcblx0XHRcdFx0cHJpb3JpdHk6IDUwXG5cdFx0XHR9XG5cdFx0fTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkZWQ7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdCQgPSBqUXVlcnksXG5cdEF0dGFjaG1lbnQ7XG5cbkF0dGFjaG1lbnQgPSBWaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2xpJyxcblx0Y2xhc3NOYW1lOiAnYXR0YWNobWVudCcsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ2F0dGFjaG1lbnQnKSxcblxuXHRhdHRyaWJ1dGVzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0J3RhYkluZGV4JzogICAgIDAsXG5cdFx0XHQncm9sZSc6ICAgICAgICAgJ2NoZWNrYm94Jyxcblx0XHRcdCdhcmlhLWxhYmVsJzogICB0aGlzLm1vZGVsLmdldCggJ3RpdGxlJyApLFxuXHRcdFx0J2FyaWEtY2hlY2tlZCc6IGZhbHNlLFxuXHRcdFx0J2RhdGEtaWQnOiAgICAgIHRoaXMubW9kZWwuZ2V0KCAnaWQnIClcblx0XHR9O1xuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayAuanMtLXNlbGVjdC1hdHRhY2htZW50JzogICAndG9nZ2xlU2VsZWN0aW9uSGFuZGxlcicsXG5cdFx0J2NoYW5nZSBbZGF0YS1zZXR0aW5nXSc6ICAgICAgICAgICd1cGRhdGVTZXR0aW5nJyxcblx0XHQnY2hhbmdlIFtkYXRhLXNldHRpbmddIGlucHV0JzogICAgJ3VwZGF0ZVNldHRpbmcnLFxuXHRcdCdjaGFuZ2UgW2RhdGEtc2V0dGluZ10gc2VsZWN0JzogICAndXBkYXRlU2V0dGluZycsXG5cdFx0J2NoYW5nZSBbZGF0YS1zZXR0aW5nXSB0ZXh0YXJlYSc6ICd1cGRhdGVTZXR0aW5nJyxcblx0XHQnY2xpY2sgLmF0dGFjaG1lbnQtY2xvc2UnOiAgICAgICAgJ3JlbW92ZUZyb21MaWJyYXJ5Jyxcblx0XHQnY2xpY2sgLmNoZWNrJzogICAgICAgICAgICAgICAgICAgJ2NoZWNrQ2xpY2tIYW5kbGVyJyxcblx0XHQna2V5ZG93bic6ICAgICAgICAgICAgICAgICAgICAgICAgJ3RvZ2dsZVNlbGVjdGlvbkhhbmRsZXInXG5cdH0sXG5cblx0YnV0dG9uczoge30sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMub3B0aW9ucy5zZWxlY3Rpb24sXG5cdFx0XHRvcHRpb25zID0gXy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLCB7XG5cdFx0XHRcdHJlcmVuZGVyT25Nb2RlbENoYW5nZTogdHJ1ZVxuXHRcdFx0fSApO1xuXG5cdFx0aWYgKCBvcHRpb25zLnJlcmVuZGVyT25Nb2RlbENoYW5nZSApIHtcblx0XHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOnBlcmNlbnQnLCB0aGlzLnByb2dyZXNzICk7XG5cdFx0fVxuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6dGl0bGUnLCB0aGlzLl9zeW5jVGl0bGUgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOmNhcHRpb24nLCB0aGlzLl9zeW5jQ2FwdGlvbiApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6YXJ0aXN0JywgdGhpcy5fc3luY0FydGlzdCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6YWxidW0nLCB0aGlzLl9zeW5jQWxidW0gKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgc2VsZWN0aW9uLlxuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdhZGQnLCB0aGlzLnNlbGVjdCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdyZW1vdmUnLCB0aGlzLmRlc2VsZWN0ICk7XG5cdFx0aWYgKCBzZWxlY3Rpb24gKSB7XG5cdFx0XHRzZWxlY3Rpb24ub24oICdyZXNldCcsIHRoaXMudXBkYXRlU2VsZWN0LCB0aGlzICk7XG5cdFx0XHQvLyBVcGRhdGUgdGhlIG1vZGVsJ3MgZGV0YWlscyB2aWV3LlxuXHRcdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ3NlbGVjdGlvbjpzaW5nbGUgc2VsZWN0aW9uOnVuc2luZ2xlJywgdGhpcy5kZXRhaWxzICk7XG5cdFx0XHR0aGlzLmRldGFpbHMoIHRoaXMubW9kZWwsIHRoaXMuY29udHJvbGxlci5zdGF0ZSgpLmdldCgnc2VsZWN0aW9uJykgKTtcblx0XHR9XG5cblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmNvbnRyb2xsZXIsICdhdHRhY2htZW50OmNvbXBhdDp3YWl0aW5nIGF0dGFjaG1lbnQ6Y29tcGF0OnJlYWR5JywgdGhpcy51cGRhdGVTYXZlICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5BdHRhY2htZW50fSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0ZGlzcG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMub3B0aW9ucy5zZWxlY3Rpb247XG5cblx0XHQvLyBNYWtlIHN1cmUgYWxsIHNldHRpbmdzIGFyZSBzYXZlZCBiZWZvcmUgcmVtb3ZpbmcgdGhlIHZpZXcuXG5cdFx0dGhpcy51cGRhdGVBbGwoKTtcblxuXHRcdGlmICggc2VsZWN0aW9uICkge1xuXHRcdFx0c2VsZWN0aW9uLm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdH1cblx0XHQvKipcblx0XHQgKiBjYWxsICdkaXNwb3NlJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0Vmlldy5wcm90b3R5cGUuZGlzcG9zZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5BdHRhY2htZW50fSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IF8uZGVmYXVsdHMoIHRoaXMubW9kZWwudG9KU09OKCksIHtcblx0XHRcdFx0b3JpZW50YXRpb246ICAgJ2xhbmRzY2FwZScsXG5cdFx0XHRcdHVwbG9hZGluZzogICAgIGZhbHNlLFxuXHRcdFx0XHR0eXBlOiAgICAgICAgICAnJyxcblx0XHRcdFx0c3VidHlwZTogICAgICAgJycsXG5cdFx0XHRcdGljb246ICAgICAgICAgICcnLFxuXHRcdFx0XHRmaWxlbmFtZTogICAgICAnJyxcblx0XHRcdFx0Y2FwdGlvbjogICAgICAgJycsXG5cdFx0XHRcdHRpdGxlOiAgICAgICAgICcnLFxuXHRcdFx0XHRkYXRlRm9ybWF0dGVkOiAnJyxcblx0XHRcdFx0d2lkdGg6ICAgICAgICAgJycsXG5cdFx0XHRcdGhlaWdodDogICAgICAgICcnLFxuXHRcdFx0XHRjb21wYXQ6ICAgICAgICBmYWxzZSxcblx0XHRcdFx0YWx0OiAgICAgICAgICAgJycsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiAgICcnXG5cdFx0XHR9LCB0aGlzLm9wdGlvbnMgKTtcblxuXHRcdG9wdGlvbnMuYnV0dG9ucyAgPSB0aGlzLmJ1dHRvbnM7XG5cdFx0b3B0aW9ucy5kZXNjcmliZSA9IHRoaXMuY29udHJvbGxlci5zdGF0ZSgpLmdldCgnZGVzY3JpYmUnKTtcblxuXHRcdGlmICggJ2ltYWdlJyA9PT0gb3B0aW9ucy50eXBlICkge1xuXHRcdFx0b3B0aW9ucy5zaXplID0gdGhpcy5pbWFnZVNpemUoKTtcblx0XHR9XG5cblx0XHRvcHRpb25zLmNhbiA9IHt9O1xuXHRcdGlmICggb3B0aW9ucy5ub25jZXMgKSB7XG5cdFx0XHRvcHRpb25zLmNhbi5yZW1vdmUgPSAhISBvcHRpb25zLm5vbmNlc1snZGVsZXRlJ107XG5cdFx0XHRvcHRpb25zLmNhbi5zYXZlID0gISEgb3B0aW9ucy5ub25jZXMudXBkYXRlO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCdhbGxvd0xvY2FsRWRpdHMnKSApIHtcblx0XHRcdG9wdGlvbnMuYWxsb3dMb2NhbEVkaXRzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoIG9wdGlvbnMudXBsb2FkaW5nICYmICEgb3B0aW9ucy5wZXJjZW50ICkge1xuXHRcdFx0b3B0aW9ucy5wZXJjZW50ID0gMDtcblx0XHR9XG5cblx0XHR0aGlzLnZpZXdzLmRldGFjaCgpO1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMudGVtcGxhdGUoIG9wdGlvbnMgKSApO1xuXG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICd1cGxvYWRpbmcnLCBvcHRpb25zLnVwbG9hZGluZyApO1xuXG5cdFx0aWYgKCBvcHRpb25zLnVwbG9hZGluZyApIHtcblx0XHRcdHRoaXMuJGJhciA9IHRoaXMuJCgnLm1lZGlhLXByb2dyZXNzLWJhciBkaXYnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIHRoaXMuJGJhcjtcblx0XHR9XG5cblx0XHQvLyBDaGVjayBpZiB0aGUgbW9kZWwgaXMgc2VsZWN0ZWQuXG5cdFx0dGhpcy51cGRhdGVTZWxlY3QoKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgc2F2ZSBzdGF0dXMuXG5cdFx0dGhpcy51cGRhdGVTYXZlKCk7XG5cblx0XHR0aGlzLnZpZXdzLnJlbmRlcigpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cHJvZ3Jlc3M6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy4kYmFyICYmIHRoaXMuJGJhci5sZW5ndGggKSB7XG5cdFx0XHR0aGlzLiRiYXIud2lkdGgoIHRoaXMubW9kZWwuZ2V0KCdwZXJjZW50JykgKyAnJScgKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0dG9nZ2xlU2VsZWN0aW9uSGFuZGxlcjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBtZXRob2Q7XG5cblx0XHQvLyBEb24ndCBkbyBhbnl0aGluZyBpbnNpZGUgaW5wdXRzIGFuZCBvbiB0aGUgYXR0YWNobWVudCBjaGVjayBhbmQgcmVtb3ZlIGJ1dHRvbnMuXG5cdFx0aWYgKCAnSU5QVVQnID09PSBldmVudC50YXJnZXQubm9kZU5hbWUgfHwgJ0JVVFRPTicgPT09IGV2ZW50LnRhcmdldC5ub2RlTmFtZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBDYXRjaCBhcnJvdyBldmVudHNcblx0XHRpZiAoIDM3ID09PSBldmVudC5rZXlDb2RlIHx8IDM4ID09PSBldmVudC5rZXlDb2RlIHx8IDM5ID09PSBldmVudC5rZXlDb2RlIHx8IDQwID09PSBldmVudC5rZXlDb2RlICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdhdHRhY2htZW50OmtleWRvd246YXJyb3cnLCBldmVudCApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIENhdGNoIGVudGVyIGFuZCBzcGFjZSBldmVudHNcblx0XHRpZiAoICdrZXlkb3duJyA9PT0gZXZlbnQudHlwZSAmJiAxMyAhPT0gZXZlbnQua2V5Q29kZSAmJiAzMiAhPT0gZXZlbnQua2V5Q29kZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0Ly8gSW4gdGhlIGdyaWQgdmlldywgYnViYmxlIHVwIGFuIGVkaXQ6YXR0YWNobWVudCBldmVudCB0byB0aGUgY29udHJvbGxlci5cblx0XHRpZiAoIHRoaXMuY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApICkge1xuXHRcdFx0aWYgKCB0aGlzLmNvbnRyb2xsZXIuaXNNb2RlQWN0aXZlKCAnZWRpdCcgKSApIHtcblx0XHRcdFx0Ly8gUGFzcyB0aGUgY3VycmVudCB0YXJnZXQgdG8gcmVzdG9yZSBmb2N1cyB3aGVuIGNsb3Npbmdcblx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdlZGl0OmF0dGFjaG1lbnQnLCB0aGlzLm1vZGVsLCBldmVudC5jdXJyZW50VGFyZ2V0ICk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCB0aGlzLmNvbnRyb2xsZXIuaXNNb2RlQWN0aXZlKCAnc2VsZWN0JyApICkge1xuXHRcdFx0XHRtZXRob2QgPSAndG9nZ2xlJztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIGV2ZW50LnNoaWZ0S2V5ICkge1xuXHRcdFx0bWV0aG9kID0gJ2JldHdlZW4nO1xuXHRcdH0gZWxzZSBpZiAoIGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleSApIHtcblx0XHRcdG1ldGhvZCA9ICd0b2dnbGUnO1xuXHRcdH1cblxuXHRcdHRoaXMudG9nZ2xlU2VsZWN0aW9uKHtcblx0XHRcdG1ldGhvZDogbWV0aG9kXG5cdFx0fSk7XG5cblx0XHR0aGlzLmNvbnRyb2xsZXIudHJpZ2dlciggJ3NlbGVjdGlvbjp0b2dnbGUnICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKi9cblx0dG9nZ2xlU2VsZWN0aW9uOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR2YXIgY29sbGVjdGlvbiA9IHRoaXMuY29sbGVjdGlvbixcblx0XHRcdHNlbGVjdGlvbiA9IHRoaXMub3B0aW9ucy5zZWxlY3Rpb24sXG5cdFx0XHRtb2RlbCA9IHRoaXMubW9kZWwsXG5cdFx0XHRtZXRob2QgPSBvcHRpb25zICYmIG9wdGlvbnMubWV0aG9kLFxuXHRcdFx0c2luZ2xlLCBtb2RlbHMsIHNpbmdsZUluZGV4LCBtb2RlbEluZGV4O1xuXG5cdFx0aWYgKCAhIHNlbGVjdGlvbiApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRzaW5nbGUgPSBzZWxlY3Rpb24uc2luZ2xlKCk7XG5cdFx0bWV0aG9kID0gXy5pc1VuZGVmaW5lZCggbWV0aG9kICkgPyBzZWxlY3Rpb24ubXVsdGlwbGUgOiBtZXRob2Q7XG5cblx0XHQvLyBJZiB0aGUgYG1ldGhvZGAgaXMgc2V0IHRvIGBiZXR3ZWVuYCwgc2VsZWN0IGFsbCBtb2RlbHMgdGhhdFxuXHRcdC8vIGV4aXN0IGJldHdlZW4gdGhlIGN1cnJlbnQgYW5kIHRoZSBzZWxlY3RlZCBtb2RlbC5cblx0XHRpZiAoICdiZXR3ZWVuJyA9PT0gbWV0aG9kICYmIHNpbmdsZSAmJiBzZWxlY3Rpb24ubXVsdGlwbGUgKSB7XG5cdFx0XHQvLyBJZiB0aGUgbW9kZWxzIGFyZSB0aGUgc2FtZSwgc2hvcnQtY2lyY3VpdC5cblx0XHRcdGlmICggc2luZ2xlID09PSBtb2RlbCApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRzaW5nbGVJbmRleCA9IGNvbGxlY3Rpb24uaW5kZXhPZiggc2luZ2xlICk7XG5cdFx0XHRtb2RlbEluZGV4ICA9IGNvbGxlY3Rpb24uaW5kZXhPZiggdGhpcy5tb2RlbCApO1xuXG5cdFx0XHRpZiAoIHNpbmdsZUluZGV4IDwgbW9kZWxJbmRleCApIHtcblx0XHRcdFx0bW9kZWxzID0gY29sbGVjdGlvbi5tb2RlbHMuc2xpY2UoIHNpbmdsZUluZGV4LCBtb2RlbEluZGV4ICsgMSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bW9kZWxzID0gY29sbGVjdGlvbi5tb2RlbHMuc2xpY2UoIG1vZGVsSW5kZXgsIHNpbmdsZUluZGV4ICsgMSApO1xuXHRcdFx0fVxuXG5cdFx0XHRzZWxlY3Rpb24uYWRkKCBtb2RlbHMgKTtcblx0XHRcdHNlbGVjdGlvbi5zaW5nbGUoIG1vZGVsICk7XG5cdFx0XHRyZXR1cm47XG5cblx0XHQvLyBJZiB0aGUgYG1ldGhvZGAgaXMgc2V0IHRvIGB0b2dnbGVgLCBqdXN0IGZsaXAgdGhlIHNlbGVjdGlvblxuXHRcdC8vIHN0YXR1cywgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSBtb2RlbCBpcyB0aGUgc2luZ2xlIG1vZGVsLlxuXHRcdH0gZWxzZSBpZiAoICd0b2dnbGUnID09PSBtZXRob2QgKSB7XG5cdFx0XHRzZWxlY3Rpb25bIHRoaXMuc2VsZWN0ZWQoKSA/ICdyZW1vdmUnIDogJ2FkZCcgXSggbW9kZWwgKTtcblx0XHRcdHNlbGVjdGlvbi5zaW5nbGUoIG1vZGVsICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIGlmICggJ2FkZCcgPT09IG1ldGhvZCApIHtcblx0XHRcdHNlbGVjdGlvbi5hZGQoIG1vZGVsICk7XG5cdFx0XHRzZWxlY3Rpb24uc2luZ2xlKCBtb2RlbCApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEZpeGVzIGJ1ZyB0aGF0IGxvc2VzIGZvY3VzIHdoZW4gc2VsZWN0aW5nIGEgZmVhdHVyZWQgaW1hZ2Vcblx0XHRpZiAoICEgbWV0aG9kICkge1xuXHRcdFx0bWV0aG9kID0gJ2FkZCc7XG5cdFx0fVxuXG5cdFx0aWYgKCBtZXRob2QgIT09ICdhZGQnICkge1xuXHRcdFx0bWV0aG9kID0gJ3Jlc2V0Jztcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMuc2VsZWN0ZWQoKSApIHtcblx0XHRcdC8vIElmIHRoZSBtb2RlbCBpcyB0aGUgc2luZ2xlIG1vZGVsLCByZW1vdmUgaXQuXG5cdFx0XHQvLyBJZiBpdCBpcyBub3QgdGhlIHNhbWUgYXMgdGhlIHNpbmdsZSBtb2RlbCxcblx0XHRcdC8vIGl0IG5vdyBiZWNvbWVzIHRoZSBzaW5nbGUgbW9kZWwuXG5cdFx0XHRzZWxlY3Rpb25bIHNpbmdsZSA9PT0gbW9kZWwgPyAncmVtb3ZlJyA6ICdzaW5nbGUnIF0oIG1vZGVsICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIElmIHRoZSBtb2RlbCBpcyBub3Qgc2VsZWN0ZWQsIHJ1biB0aGUgYG1ldGhvZGAgb24gdGhlXG5cdFx0XHQvLyBzZWxlY3Rpb24uIEJ5IGRlZmF1bHQsIHdlIGByZXNldGAgdGhlIHNlbGVjdGlvbiwgYnV0IHRoZVxuXHRcdFx0Ly8gYG1ldGhvZGAgY2FuIGJlIHNldCB0byBgYWRkYCB0aGUgbW9kZWwgdG8gdGhlIHNlbGVjdGlvbi5cblx0XHRcdHNlbGVjdGlvblsgbWV0aG9kIF0oIG1vZGVsICk7XG5cdFx0XHRzZWxlY3Rpb24uc2luZ2xlKCBtb2RlbCApO1xuXHRcdH1cblx0fSxcblxuXHR1cGRhdGVTZWxlY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXNbIHRoaXMuc2VsZWN0ZWQoKSA/ICdzZWxlY3QnIDogJ2Rlc2VsZWN0JyBdKCk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7dW5yZXNvbHZlZHxCb29sZWFufVxuXHQgKi9cblx0c2VsZWN0ZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uO1xuXHRcdGlmICggc2VsZWN0aW9uICkge1xuXHRcdFx0cmV0dXJuICEhIHNlbGVjdGlvbi5nZXQoIHRoaXMubW9kZWwuY2lkICk7XG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtCYWNrYm9uZS5Nb2RlbH0gbW9kZWxcblx0ICogQHBhcmFtIHtCYWNrYm9uZS5Db2xsZWN0aW9ufSBjb2xsZWN0aW9uXG5cdCAqL1xuXHRzZWxlY3Q6IGZ1bmN0aW9uKCBtb2RlbCwgY29sbGVjdGlvbiApIHtcblx0XHR2YXIgc2VsZWN0aW9uID0gdGhpcy5vcHRpb25zLnNlbGVjdGlvbixcblx0XHRcdGNvbnRyb2xsZXIgPSB0aGlzLmNvbnRyb2xsZXI7XG5cblx0XHQvLyBDaGVjayBpZiBhIHNlbGVjdGlvbiBleGlzdHMgYW5kIGlmIGl0J3MgdGhlIGNvbGxlY3Rpb24gcHJvdmlkZWQuXG5cdFx0Ly8gSWYgdGhleSdyZSBub3QgdGhlIHNhbWUgY29sbGVjdGlvbiwgYmFpbDsgd2UncmUgaW4gYW5vdGhlclxuXHRcdC8vIHNlbGVjdGlvbidzIGV2ZW50IGxvb3AuXG5cdFx0aWYgKCAhIHNlbGVjdGlvbiB8fCAoIGNvbGxlY3Rpb24gJiYgY29sbGVjdGlvbiAhPT0gc2VsZWN0aW9uICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gQmFpbCBpZiB0aGUgbW9kZWwgaXMgYWxyZWFkeSBzZWxlY3RlZC5cblx0XHRpZiAoIHRoaXMuJGVsLmhhc0NsYXNzKCAnc2VsZWN0ZWQnICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gQWRkICdzZWxlY3RlZCcgY2xhc3MgdG8gbW9kZWwsIHNldCBhcmlhLWNoZWNrZWQgdG8gdHJ1ZS5cblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ3NlbGVjdGVkJyApLmF0dHIoICdhcmlhLWNoZWNrZWQnLCB0cnVlICk7XG5cdFx0Ly8gIE1ha2UgdGhlIGNoZWNrYm94IHRhYmFibGUsIGV4Y2VwdCBpbiBtZWRpYSBncmlkIChidWxrIHNlbGVjdCBtb2RlKS5cblx0XHRpZiAoICEgKCBjb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ2dyaWQnICkgJiYgY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdzZWxlY3QnICkgKSApIHtcblx0XHRcdHRoaXMuJCggJy5jaGVjaycgKS5hdHRyKCAndGFiaW5kZXgnLCAnMCcgKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0JhY2tib25lLk1vZGVsfSBtb2RlbFxuXHQgKiBAcGFyYW0ge0JhY2tib25lLkNvbGxlY3Rpb259IGNvbGxlY3Rpb25cblx0ICovXG5cdGRlc2VsZWN0OiBmdW5jdGlvbiggbW9kZWwsIGNvbGxlY3Rpb24gKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMub3B0aW9ucy5zZWxlY3Rpb247XG5cblx0XHQvLyBDaGVjayBpZiBhIHNlbGVjdGlvbiBleGlzdHMgYW5kIGlmIGl0J3MgdGhlIGNvbGxlY3Rpb24gcHJvdmlkZWQuXG5cdFx0Ly8gSWYgdGhleSdyZSBub3QgdGhlIHNhbWUgY29sbGVjdGlvbiwgYmFpbDsgd2UncmUgaW4gYW5vdGhlclxuXHRcdC8vIHNlbGVjdGlvbidzIGV2ZW50IGxvb3AuXG5cdFx0aWYgKCAhIHNlbGVjdGlvbiB8fCAoIGNvbGxlY3Rpb24gJiYgY29sbGVjdGlvbiAhPT0gc2VsZWN0aW9uICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnc2VsZWN0ZWQnICkuYXR0ciggJ2FyaWEtY2hlY2tlZCcsIGZhbHNlIClcblx0XHRcdC5maW5kKCAnLmNoZWNrJyApLmF0dHIoICd0YWJpbmRleCcsICctMScgKTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuTW9kZWx9IG1vZGVsXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuQ29sbGVjdGlvbn0gY29sbGVjdGlvblxuXHQgKi9cblx0ZGV0YWlsczogZnVuY3Rpb24oIG1vZGVsLCBjb2xsZWN0aW9uICkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0ZGV0YWlscztcblxuXHRcdGlmICggc2VsZWN0aW9uICE9PSBjb2xsZWN0aW9uICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGRldGFpbHMgPSBzZWxlY3Rpb24uc2luZ2xlKCk7XG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdkZXRhaWxzJywgZGV0YWlscyA9PT0gdGhpcy5tb2RlbCApO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtzdHJpbmd9IHNpemVcblx0ICogQHJldHVybnMge09iamVjdH1cblx0ICovXG5cdGltYWdlU2l6ZTogZnVuY3Rpb24oIHNpemUgKSB7XG5cdFx0dmFyIHNpemVzID0gdGhpcy5tb2RlbC5nZXQoJ3NpemVzJyksIG1hdGNoZWQgPSBmYWxzZTtcblxuXHRcdHNpemUgPSBzaXplIHx8ICdtZWRpdW0nO1xuXG5cdFx0Ly8gVXNlIHRoZSBwcm92aWRlZCBpbWFnZSBzaXplIGlmIHBvc3NpYmxlLlxuXHRcdGlmICggc2l6ZXMgKSB7XG5cdFx0XHRpZiAoIHNpemVzWyBzaXplIF0gKSB7XG5cdFx0XHRcdG1hdGNoZWQgPSBzaXplc1sgc2l6ZSBdO1xuXHRcdFx0fSBlbHNlIGlmICggc2l6ZXMubGFyZ2UgKSB7XG5cdFx0XHRcdG1hdGNoZWQgPSBzaXplcy5sYXJnZTtcblx0XHRcdH0gZWxzZSBpZiAoIHNpemVzLnRodW1ibmFpbCApIHtcblx0XHRcdFx0bWF0Y2hlZCA9IHNpemVzLnRodW1ibmFpbDtcblx0XHRcdH0gZWxzZSBpZiAoIHNpemVzLmZ1bGwgKSB7XG5cdFx0XHRcdG1hdGNoZWQgPSBzaXplcy5mdWxsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIG1hdGNoZWQgKSB7XG5cdFx0XHRcdHJldHVybiBfLmNsb25lKCBtYXRjaGVkICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogICAgICAgICB0aGlzLm1vZGVsLmdldCgndXJsJyksXG5cdFx0XHR3aWR0aDogICAgICAgdGhpcy5tb2RlbC5nZXQoJ3dpZHRoJyksXG5cdFx0XHRoZWlnaHQ6ICAgICAgdGhpcy5tb2RlbC5nZXQoJ2hlaWdodCcpLFxuXHRcdFx0b3JpZW50YXRpb246IHRoaXMubW9kZWwuZ2V0KCdvcmllbnRhdGlvbicpXG5cdFx0fTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0dXBkYXRlU2V0dGluZzogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciAkc2V0dGluZyA9ICQoIGV2ZW50LnRhcmdldCApLmNsb3Nlc3QoJ1tkYXRhLXNldHRpbmddJyksXG5cdFx0XHRzZXR0aW5nLCB2YWx1ZTtcblxuXHRcdGlmICggISAkc2V0dGluZy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0c2V0dGluZyA9ICRzZXR0aW5nLmRhdGEoJ3NldHRpbmcnKTtcblx0XHR2YWx1ZSAgID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuXG5cdFx0aWYgKCB0aGlzLm1vZGVsLmdldCggc2V0dGluZyApICE9PSB2YWx1ZSApIHtcblx0XHRcdHRoaXMuc2F2ZSggc2V0dGluZywgdmFsdWUgKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIFBhc3MgYWxsIHRoZSBhcmd1bWVudHMgdG8gdGhlIG1vZGVsJ3Mgc2F2ZSBtZXRob2QuXG5cdCAqXG5cdCAqIFJlY29yZHMgdGhlIGFnZ3JlZ2F0ZSBzdGF0dXMgb2YgYWxsIHNhdmUgcmVxdWVzdHMgYW5kIHVwZGF0ZXMgdGhlXG5cdCAqIHZpZXcncyBjbGFzc2VzIGFjY29yZGluZ2x5LlxuXHQgKi9cblx0c2F2ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLFxuXHRcdFx0c2F2ZSA9IHRoaXMuX3NhdmUgPSB0aGlzLl9zYXZlIHx8IHsgc3RhdHVzOiAncmVhZHknIH0sXG5cdFx0XHRyZXF1ZXN0ID0gdGhpcy5tb2RlbC5zYXZlLmFwcGx5KCB0aGlzLm1vZGVsLCBhcmd1bWVudHMgKSxcblx0XHRcdHJlcXVlc3RzID0gc2F2ZS5yZXF1ZXN0cyA/ICQud2hlbiggcmVxdWVzdCwgc2F2ZS5yZXF1ZXN0cyApIDogcmVxdWVzdDtcblxuXHRcdC8vIElmIHdlJ3JlIHdhaXRpbmcgdG8gcmVtb3ZlICdTYXZlZC4nLCBzdG9wLlxuXHRcdGlmICggc2F2ZS5zYXZlZFRpbWVyICkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KCBzYXZlLnNhdmVkVGltZXIgKTtcblx0XHR9XG5cblx0XHR0aGlzLnVwZGF0ZVNhdmUoJ3dhaXRpbmcnKTtcblx0XHRzYXZlLnJlcXVlc3RzID0gcmVxdWVzdHM7XG5cdFx0cmVxdWVzdHMuYWx3YXlzKCBmdW5jdGlvbigpIHtcblx0XHRcdC8vIElmIHdlJ3ZlIHBlcmZvcm1lZCBhbm90aGVyIHJlcXVlc3Qgc2luY2UgdGhpcyBvbmUsIGJhaWwuXG5cdFx0XHRpZiAoIHNhdmUucmVxdWVzdHMgIT09IHJlcXVlc3RzICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZpZXcudXBkYXRlU2F2ZSggcmVxdWVzdHMuc3RhdGUoKSA9PT0gJ3Jlc29sdmVkJyA/ICdjb21wbGV0ZScgOiAnZXJyb3InICk7XG5cdFx0XHRzYXZlLnNhdmVkVGltZXIgPSBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmlldy51cGRhdGVTYXZlKCdyZWFkeScpO1xuXHRcdFx0XHRkZWxldGUgc2F2ZS5zYXZlZFRpbWVyO1xuXHRcdFx0fSwgMjAwMCApO1xuXHRcdH0pO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1c1xuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5BdHRhY2htZW50fSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0dXBkYXRlU2F2ZTogZnVuY3Rpb24oIHN0YXR1cyApIHtcblx0XHR2YXIgc2F2ZSA9IHRoaXMuX3NhdmUgPSB0aGlzLl9zYXZlIHx8IHsgc3RhdHVzOiAncmVhZHknIH07XG5cblx0XHRpZiAoIHN0YXR1cyAmJiBzdGF0dXMgIT09IHNhdmUuc3RhdHVzICkge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdzYXZlLScgKyBzYXZlLnN0YXR1cyApO1xuXHRcdFx0c2F2ZS5zdGF0dXMgPSBzdGF0dXM7XG5cdFx0fVxuXG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdzYXZlLScgKyBzYXZlLnN0YXR1cyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHVwZGF0ZUFsbDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRzZXR0aW5ncyA9IHRoaXMuJCgnW2RhdGEtc2V0dGluZ10nKSxcblx0XHRcdG1vZGVsID0gdGhpcy5tb2RlbCxcblx0XHRcdGNoYW5nZWQ7XG5cblx0XHRjaGFuZ2VkID0gXy5jaGFpbiggJHNldHRpbmdzICkubWFwKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHR2YXIgJGlucHV0ID0gJCgnaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QsIFt2YWx1ZV0nLCBlbCApLFxuXHRcdFx0XHRzZXR0aW5nLCB2YWx1ZTtcblxuXHRcdFx0aWYgKCAhICRpbnB1dC5sZW5ndGggKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0c2V0dGluZyA9ICQoZWwpLmRhdGEoJ3NldHRpbmcnKTtcblx0XHRcdHZhbHVlID0gJGlucHV0LnZhbCgpO1xuXG5cdFx0XHQvLyBSZWNvcmQgdGhlIHZhbHVlIGlmIGl0IGNoYW5nZWQuXG5cdFx0XHRpZiAoIG1vZGVsLmdldCggc2V0dGluZyApICE9PSB2YWx1ZSApIHtcblx0XHRcdFx0cmV0dXJuIFsgc2V0dGluZywgdmFsdWUgXTtcblx0XHRcdH1cblx0XHR9KS5jb21wYWN0KCkub2JqZWN0KCkudmFsdWUoKTtcblxuXHRcdGlmICggISBfLmlzRW1wdHkoIGNoYW5nZWQgKSApIHtcblx0XHRcdG1vZGVsLnNhdmUoIGNoYW5nZWQgKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdHJlbW92ZUZyb21MaWJyYXJ5OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0Ly8gQ2F0Y2ggZW50ZXIgYW5kIHNwYWNlIGV2ZW50c1xuXHRcdGlmICggJ2tleWRvd24nID09PSBldmVudC50eXBlICYmIDEzICE9PSBldmVudC5rZXlDb2RlICYmIDMyICE9PSBldmVudC5rZXlDb2RlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFN0b3AgcHJvcGFnYXRpb24gc28gdGhlIG1vZGVsIGlzbid0IHNlbGVjdGVkLlxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLnJlbW92ZSggdGhpcy5tb2RlbCApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgdGhlIG1vZGVsIGlmIGl0IGlzbid0IGluIHRoZSBzZWxlY3Rpb24sIGlmIGl0IGlzIGluIHRoZSBzZWxlY3Rpb24sXG5cdCAqIHJlbW92ZSBpdC5cblx0ICpcblx0ICogQHBhcmFtICB7W3R5cGVdfSBldmVudCBbZGVzY3JpcHRpb25dXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0Y2hlY2tDbGlja0hhbmRsZXI6IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMub3B0aW9ucy5zZWxlY3Rpb247XG5cdFx0aWYgKCAhIHNlbGVjdGlvbiApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0aWYgKCBzZWxlY3Rpb24ud2hlcmUoIHsgaWQ6IHRoaXMubW9kZWwuZ2V0KCAnaWQnICkgfSApLmxlbmd0aCApIHtcblx0XHRcdHNlbGVjdGlvbi5yZW1vdmUoIHRoaXMubW9kZWwgKTtcblx0XHRcdC8vIE1vdmUgZm9jdXMgYmFjayB0byB0aGUgYXR0YWNobWVudCB0aWxlIChmcm9tIHRoZSBjaGVjaykuXG5cdFx0XHR0aGlzLiRlbC5mb2N1cygpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxlY3Rpb24uYWRkKCB0aGlzLm1vZGVsICk7XG5cdFx0fVxuXHR9XG59KTtcblxuLy8gRW5zdXJlIHNldHRpbmdzIHJlbWFpbiBpbiBzeW5jIGJldHdlZW4gYXR0YWNobWVudCB2aWV3cy5cbl8uZWFjaCh7XG5cdGNhcHRpb246ICdfc3luY0NhcHRpb24nLFxuXHR0aXRsZTogICAnX3N5bmNUaXRsZScsXG5cdGFydGlzdDogICdfc3luY0FydGlzdCcsXG5cdGFsYnVtOiAgICdfc3luY0FsYnVtJ1xufSwgZnVuY3Rpb24oIG1ldGhvZCwgc2V0dGluZyApIHtcblx0LyoqXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuTW9kZWx9IG1vZGVsXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5BdHRhY2htZW50fSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0QXR0YWNobWVudC5wcm90b3R5cGVbIG1ldGhvZCBdID0gZnVuY3Rpb24oIG1vZGVsLCB2YWx1ZSApIHtcblx0XHR2YXIgJHNldHRpbmcgPSB0aGlzLiQoJ1tkYXRhLXNldHRpbmc9XCInICsgc2V0dGluZyArICdcIl0nKTtcblxuXHRcdGlmICggISAkc2V0dGluZy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgdXBkYXRlZCB2YWx1ZSBpcyBpbiBzeW5jIHdpdGggdGhlIHZhbHVlIGluIHRoZSBET00sIHRoZXJlXG5cdFx0Ly8gaXMgbm8gbmVlZCB0byByZS1yZW5kZXIuIElmIHdlJ3JlIGN1cnJlbnRseSBlZGl0aW5nIHRoZSB2YWx1ZSxcblx0XHQvLyBpdCB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgaW4gc3luYywgc3VwcHJlc3NpbmcgdGhlIHJlLXJlbmRlciBmb3Jcblx0XHQvLyB0aGUgdmlldyB3ZSdyZSBlZGl0aW5nLCB3aGlsZSB1cGRhdGluZyBhbnkgb3RoZXJzLlxuXHRcdGlmICggdmFsdWUgPT09ICRzZXR0aW5nLmZpbmQoJ2lucHV0LCB0ZXh0YXJlYSwgc2VsZWN0LCBbdmFsdWVdJykudmFsKCkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5yZW5kZXIoKTtcblx0fTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF0dGFjaG1lbnQ7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5EZXRhaWxzXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5BdHRhY2htZW50XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBBdHRhY2htZW50ID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHREZXRhaWxzO1xuXG5EZXRhaWxzID0gQXR0YWNobWVudC5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdkaXYnLFxuXHRjbGFzc05hbWU6ICdhdHRhY2htZW50LWRldGFpbHMnLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCdhdHRhY2htZW50LWRldGFpbHMnKSxcblxuXHRhdHRyaWJ1dGVzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0J3RhYkluZGV4JzogICAgIDAsXG5cdFx0XHQnZGF0YS1pZCc6ICAgICAgdGhpcy5tb2RlbC5nZXQoICdpZCcgKVxuXHRcdH07XG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NoYW5nZSBbZGF0YS1zZXR0aW5nXSc6ICAgICAgICAgICd1cGRhdGVTZXR0aW5nJyxcblx0XHQnY2hhbmdlIFtkYXRhLXNldHRpbmddIGlucHV0JzogICAgJ3VwZGF0ZVNldHRpbmcnLFxuXHRcdCdjaGFuZ2UgW2RhdGEtc2V0dGluZ10gc2VsZWN0JzogICAndXBkYXRlU2V0dGluZycsXG5cdFx0J2NoYW5nZSBbZGF0YS1zZXR0aW5nXSB0ZXh0YXJlYSc6ICd1cGRhdGVTZXR0aW5nJyxcblx0XHQnY2xpY2sgLmRlbGV0ZS1hdHRhY2htZW50JzogICAgICAgJ2RlbGV0ZUF0dGFjaG1lbnQnLFxuXHRcdCdjbGljayAudHJhc2gtYXR0YWNobWVudCc6ICAgICAgICAndHJhc2hBdHRhY2htZW50Jyxcblx0XHQnY2xpY2sgLnVudHJhc2gtYXR0YWNobWVudCc6ICAgICAgJ3VudHJhc2hBdHRhY2htZW50Jyxcblx0XHQnY2xpY2sgLmVkaXQtYXR0YWNobWVudCc6ICAgICAgICAgJ2VkaXRBdHRhY2htZW50Jyxcblx0XHQna2V5ZG93bic6ICAgICAgICAgICAgICAgICAgICAgICAgJ3RvZ2dsZVNlbGVjdGlvbkhhbmRsZXInXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vcHRpb25zID0gXy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLCB7XG5cdFx0XHRyZXJlbmRlck9uTW9kZWxDaGFuZ2U6IGZhbHNlXG5cdFx0fSk7XG5cblx0XHR0aGlzLm9uKCAncmVhZHknLCB0aGlzLmluaXRpYWxGb2N1cyApO1xuXHRcdC8vIENhbGwgJ2luaXRpYWxpemUnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3MuXG5cdFx0QXR0YWNobWVudC5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0aW5pdGlhbEZvY3VzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgd3AubWVkaWEuaXNUb3VjaERldmljZSApIHtcblx0XHRcdC8qXG5cdFx0XHRQcmV2aW91c2x5IGZvY3VzZWQgdGhlIGZpcnN0ICc6aW5wdXQnICh0aGUgcmVhZG9ubHkgVVJMIHRleHQgZmllbGQpLlxuXHRcdFx0U2luY2UgdGhlIGZpcnN0ICc6aW5wdXQnIGlzIG5vdyBhIGJ1dHRvbiAoZGVsZXRlL3RyYXNoKTogd2hlbiBwcmVzc2luZ1xuXHRcdFx0c3BhY2ViYXIgb24gYW4gYXR0YWNobWVudCwgRmlyZWZveCBmaXJlcyBkZWxldGVBdHRhY2htZW50L3RyYXNoQXR0YWNobWVudFxuXHRcdFx0YXMgc29vbiBhcyBmb2N1cyBpcyBtb3ZlZC4gRXhwbGljaXRseSB0YXJnZXQgdGhlIGZpcnN0IHRleHQgZmllbGQgZm9yIG5vdy5cblx0XHRcdEB0b2RvIGNoYW5nZSBpbml0aWFsIGZvY3VzIGxvZ2ljLCBhbHNvIGZvciBhY2Nlc3NpYmlsaXR5LlxuXHRcdFx0Ki9cblx0XHRcdHRoaXMuJCggJ2lucHV0W3R5cGU9XCJ0ZXh0XCJdJyApLmVxKCAwICkuZm9jdXMoKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdGRlbGV0ZUF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0aWYgKCB3aW5kb3cuY29uZmlybSggbDEwbi53YXJuRGVsZXRlICkgKSB7XG5cdFx0XHR0aGlzLm1vZGVsLmRlc3Ryb3koKTtcblx0XHRcdC8vIEtlZXAgZm9jdXMgaW5zaWRlIG1lZGlhIG1vZGFsXG5cdFx0XHQvLyBhZnRlciBpbWFnZSBpcyBkZWxldGVkXG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIubW9kYWwuZm9jdXNNYW5hZ2VyLmZvY3VzKCk7XG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHR0cmFzaEF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgbGlicmFyeSA9IHRoaXMuY29udHJvbGxlci5saWJyYXJ5O1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRpZiAoIHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MubWVkaWFUcmFzaCAmJlxuXHRcdFx0J2VkaXQtbWV0YWRhdGEnID09PSB0aGlzLmNvbnRyb2xsZXIuY29udGVudC5tb2RlKCkgKSB7XG5cblx0XHRcdHRoaXMubW9kZWwuc2V0KCAnc3RhdHVzJywgJ3RyYXNoJyApO1xuXHRcdFx0dGhpcy5tb2RlbC5zYXZlKCkuZG9uZSggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGxpYnJhcnkuX3JlcXVlcnkoIHRydWUgKTtcblx0XHRcdH0gKTtcblx0XHR9ICBlbHNlIHtcblx0XHRcdHRoaXMubW9kZWwuZGVzdHJveSgpO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0dW50cmFzaEF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgbGlicmFyeSA9IHRoaXMuY29udHJvbGxlci5saWJyYXJ5O1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR0aGlzLm1vZGVsLnNldCggJ3N0YXR1cycsICdpbmhlcml0JyApO1xuXHRcdHRoaXMubW9kZWwuc2F2ZSgpLmRvbmUoIGZ1bmN0aW9uKCkge1xuXHRcdFx0bGlicmFyeS5fcmVxdWVyeSggdHJ1ZSApO1xuXHRcdH0gKTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0ZWRpdEF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgZWRpdFN0YXRlID0gdGhpcy5jb250cm9sbGVyLnN0YXRlcy5nZXQoICdlZGl0LWltYWdlJyApO1xuXHRcdGlmICggd2luZG93LmltYWdlRWRpdCAmJiBlZGl0U3RhdGUgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRlZGl0U3RhdGUuc2V0KCAnaW1hZ2UnLCB0aGlzLm1vZGVsICk7XG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIuc2V0U3RhdGUoICdlZGl0LWltYWdlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcygnbmVlZHMtcmVmcmVzaCcpO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIFdoZW4gcmV2ZXJzZSB0YWJiaW5nKHNoaWZ0K3RhYikgb3V0IG9mIHRoZSByaWdodCBkZXRhaWxzIHBhbmVsLCBkZWxpdmVyXG5cdCAqIHRoZSBmb2N1cyB0byB0aGUgaXRlbSBpbiB0aGUgbGlzdCB0aGF0IHdhcyBiZWluZyBlZGl0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0dG9nZ2xlU2VsZWN0aW9uSGFuZGxlcjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggJ2tleWRvd24nID09PSBldmVudC50eXBlICYmIDkgPT09IGV2ZW50LmtleUNvZGUgJiYgZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQudGFyZ2V0ID09PSB0aGlzLiQoICc6dGFiYmFibGUnICkuZ2V0KCAwICkgKSB7XG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIudHJpZ2dlciggJ2F0dGFjaG1lbnQ6ZGV0YWlsczpzaGlmdC10YWInLCBldmVudCApO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmICggMzcgPT09IGV2ZW50LmtleUNvZGUgfHwgMzggPT09IGV2ZW50LmtleUNvZGUgfHwgMzkgPT09IGV2ZW50LmtleUNvZGUgfHwgNDAgPT09IGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIudHJpZ2dlciggJ2F0dGFjaG1lbnQ6a2V5ZG93bjphcnJvdycsIGV2ZW50ICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXRhaWxzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRWRpdExpYnJhcnlcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEVkaXRMaWJyYXJ5ID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50LmV4dGVuZCh7XG5cdGJ1dHRvbnM6IHtcblx0XHRjbG9zZTogdHJ1ZVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0TGlicmFyeTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5BdHRhY2htZW50cy5FZGl0U2VsZWN0aW9uXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5BdHRhY2htZW50LlNlbGVjdGlvblxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgRWRpdFNlbGVjdGlvbiA9IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5TZWxlY3Rpb24uZXh0ZW5kKHtcblx0YnV0dG9uczoge1xuXHRcdGNsb3NlOiB0cnVlXG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRTZWxlY3Rpb247XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5MaWJyYXJ5XG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5BdHRhY2htZW50XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBMaWJyYXJ5ID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50LmV4dGVuZCh7XG5cdGJ1dHRvbnM6IHtcblx0XHRjaGVjazogdHJ1ZVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaWJyYXJ5O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuU2VsZWN0aW9uXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5BdHRhY2htZW50XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBTZWxlY3Rpb24gPSB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnYXR0YWNobWVudCBzZWxlY3Rpb24nLFxuXG5cdC8vIE9uIGNsaWNrLCBqdXN0IHNlbGVjdCB0aGUgbW9kZWwsIGluc3RlYWQgb2YgcmVtb3ZpbmcgdGhlIG1vZGVsIGZyb21cblx0Ly8gdGhlIHNlbGVjdGlvbi5cblx0dG9nZ2xlU2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9wdGlvbnMuc2VsZWN0aW9uLnNpbmdsZSggdGhpcy5tb2RlbCApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3Rpb247XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudHNcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFZpZXcgPSB3cC5tZWRpYS5WaWV3LFxuXHQkID0galF1ZXJ5LFxuXHRBdHRhY2htZW50cztcblxuQXR0YWNobWVudHMgPSBWaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ3VsJyxcblx0Y2xhc3NOYW1lOiAnYXR0YWNobWVudHMnLFxuXG5cdGF0dHJpYnV0ZXM6IHtcblx0XHR0YWJJbmRleDogLTFcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVsLmlkID0gXy51bmlxdWVJZCgnX19hdHRhY2htZW50cy12aWV3LScpO1xuXG5cdFx0Xy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLCB7XG5cdFx0XHRyZWZyZXNoU2Vuc2l0aXZpdHk6IHdwLm1lZGlhLmlzVG91Y2hEZXZpY2UgPyAzMDAgOiAyMDAsXG5cdFx0XHRyZWZyZXNoVGhyZXNob2xkOiAgIDMsXG5cdFx0XHRBdHRhY2htZW50VmlldzogICAgIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudCxcblx0XHRcdHNvcnRhYmxlOiAgICAgICAgICAgZmFsc2UsXG5cdFx0XHRyZXNpemU6ICAgICAgICAgICAgIHRydWUsXG5cdFx0XHRpZGVhbENvbHVtbldpZHRoOiAgICQoIHdpbmRvdyApLndpZHRoKCkgPCA2NDAgPyAxMzUgOiAxNTBcblx0XHR9KTtcblxuXHRcdHRoaXMuX3ZpZXdzQnlDaWQgPSB7fTtcblx0XHR0aGlzLiR3aW5kb3cgPSAkKCB3aW5kb3cgKTtcblx0XHR0aGlzLnJlc2l6ZUV2ZW50ID0gJ3Jlc2l6ZS5tZWRpYS1tb2RhbC1jb2x1bW5zJztcblxuXHRcdHRoaXMuY29sbGVjdGlvbi5vbiggJ2FkZCcsIGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdFx0dGhpcy52aWV3cy5hZGQoIHRoaXMuY3JlYXRlQXR0YWNobWVudFZpZXcoIGF0dGFjaG1lbnQgKSwge1xuXHRcdFx0XHRhdDogdGhpcy5jb2xsZWN0aW9uLmluZGV4T2YoIGF0dGFjaG1lbnQgKVxuXHRcdFx0fSk7XG5cdFx0fSwgdGhpcyApO1xuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLm9uKCAncmVtb3ZlJywgZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHR2YXIgdmlldyA9IHRoaXMuX3ZpZXdzQnlDaWRbIGF0dGFjaG1lbnQuY2lkIF07XG5cdFx0XHRkZWxldGUgdGhpcy5fdmlld3NCeUNpZFsgYXR0YWNobWVudC5jaWQgXTtcblxuXHRcdFx0aWYgKCB2aWV3ICkge1xuXHRcdFx0XHR2aWV3LnJlbW92ZSgpO1xuXHRcdFx0fVxuXHRcdH0sIHRoaXMgKTtcblxuXHRcdHRoaXMuY29sbGVjdGlvbi5vbiggJ3Jlc2V0JywgdGhpcy5yZW5kZXIsIHRoaXMgKTtcblxuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY29udHJvbGxlciwgJ2xpYnJhcnk6c2VsZWN0aW9uOmFkZCcsICAgIHRoaXMuYXR0YWNobWVudEZvY3VzICk7XG5cblx0XHQvLyBUaHJvdHRsZSB0aGUgc2Nyb2xsIGhhbmRsZXIgYW5kIGJpbmQgdGhpcy5cblx0XHR0aGlzLnNjcm9sbCA9IF8uY2hhaW4oIHRoaXMuc2Nyb2xsICkuYmluZCggdGhpcyApLnRocm90dGxlKCB0aGlzLm9wdGlvbnMucmVmcmVzaFNlbnNpdGl2aXR5ICkudmFsdWUoKTtcblxuXHRcdHRoaXMub3B0aW9ucy5zY3JvbGxFbGVtZW50ID0gdGhpcy5vcHRpb25zLnNjcm9sbEVsZW1lbnQgfHwgdGhpcy5lbDtcblx0XHQkKCB0aGlzLm9wdGlvbnMuc2Nyb2xsRWxlbWVudCApLm9uKCAnc2Nyb2xsJywgdGhpcy5zY3JvbGwgKTtcblxuXHRcdHRoaXMuaW5pdFNvcnRhYmxlKCk7XG5cblx0XHRfLmJpbmRBbGwoIHRoaXMsICdzZXRDb2x1bW5zJyApO1xuXG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMucmVzaXplICkge1xuXHRcdFx0dGhpcy5vbiggJ3JlYWR5JywgdGhpcy5iaW5kRXZlbnRzICk7XG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIub24oICdvcGVuJywgdGhpcy5zZXRDb2x1bW5zICk7XG5cblx0XHRcdC8vIENhbGwgdGhpcy5zZXRDb2x1bW5zKCkgYWZ0ZXIgdGhpcyB2aWV3IGhhcyBiZWVuIHJlbmRlcmVkIGluIHRoZSBET00gc29cblx0XHRcdC8vIGF0dGFjaG1lbnRzIGdldCBwcm9wZXIgd2lkdGggYXBwbGllZC5cblx0XHRcdF8uZGVmZXIoIHRoaXMuc2V0Q29sdW1ucywgdGhpcyApO1xuXHRcdH1cblx0fSxcblxuXHRiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiR3aW5kb3cub2ZmKCB0aGlzLnJlc2l6ZUV2ZW50ICkub24oIHRoaXMucmVzaXplRXZlbnQsIF8uZGVib3VuY2UoIHRoaXMuc2V0Q29sdW1ucywgNTAgKSApO1xuXHR9LFxuXG5cdGF0dGFjaG1lbnRGb2N1czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kKCAnbGk6Zmlyc3QnICkuZm9jdXMoKTtcblx0fSxcblxuXHRyZXN0b3JlRm9jdXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJCggJ2xpLnNlbGVjdGVkOmZpcnN0JyApLmZvY3VzKCk7XG5cdH0sXG5cblx0YXJyb3dFdmVudDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBhdHRhY2htZW50cyA9IHRoaXMuJGVsLmNoaWxkcmVuKCAnbGknICksXG5cdFx0XHRwZXJSb3cgPSB0aGlzLmNvbHVtbnMsXG5cdFx0XHRpbmRleCA9IGF0dGFjaG1lbnRzLmZpbHRlciggJzpmb2N1cycgKS5pbmRleCgpLFxuXHRcdFx0cm93ID0gKCBpbmRleCArIDEgKSA8PSBwZXJSb3cgPyAxIDogTWF0aC5jZWlsKCAoIGluZGV4ICsgMSApIC8gcGVyUm93ICk7XG5cblx0XHRpZiAoIGluZGV4ID09PSAtMSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBMZWZ0IGFycm93XG5cdFx0aWYgKCAzNyA9PT0gZXZlbnQua2V5Q29kZSApIHtcblx0XHRcdGlmICggMCA9PT0gaW5kZXggKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGF0dGFjaG1lbnRzLmVxKCBpbmRleCAtIDEgKS5mb2N1cygpO1xuXHRcdH1cblxuXHRcdC8vIFVwIGFycm93XG5cdFx0aWYgKCAzOCA9PT0gZXZlbnQua2V5Q29kZSApIHtcblx0XHRcdGlmICggMSA9PT0gcm93ICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRhdHRhY2htZW50cy5lcSggaW5kZXggLSBwZXJSb3cgKS5mb2N1cygpO1xuXHRcdH1cblxuXHRcdC8vIFJpZ2h0IGFycm93XG5cdFx0aWYgKCAzOSA9PT0gZXZlbnQua2V5Q29kZSApIHtcblx0XHRcdGlmICggYXR0YWNobWVudHMubGVuZ3RoID09PSBpbmRleCApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0YXR0YWNobWVudHMuZXEoIGluZGV4ICsgMSApLmZvY3VzKCk7XG5cdFx0fVxuXG5cdFx0Ly8gRG93biBhcnJvd1xuXHRcdGlmICggNDAgPT09IGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHRpZiAoIE1hdGguY2VpbCggYXR0YWNobWVudHMubGVuZ3RoIC8gcGVyUm93ICkgPT09IHJvdyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0YXR0YWNobWVudHMuZXEoIGluZGV4ICsgcGVyUm93ICkuZm9jdXMoKTtcblx0XHR9XG5cdH0sXG5cblx0ZGlzcG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb2xsZWN0aW9uLnByb3BzLm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdGlmICggdGhpcy5vcHRpb25zLnJlc2l6ZSApIHtcblx0XHRcdHRoaXMuJHdpbmRvdy5vZmYoIHRoaXMucmVzaXplRXZlbnQgKTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBjYWxsICdkaXNwb3NlJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0Vmlldy5wcm90b3R5cGUuZGlzcG9zZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0c2V0Q29sdW1uczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHByZXYgPSB0aGlzLmNvbHVtbnMsXG5cdFx0XHR3aWR0aCA9IHRoaXMuJGVsLndpZHRoKCk7XG5cblx0XHRpZiAoIHdpZHRoICkge1xuXHRcdFx0dGhpcy5jb2x1bW5zID0gTWF0aC5taW4oIE1hdGgucm91bmQoIHdpZHRoIC8gdGhpcy5vcHRpb25zLmlkZWFsQ29sdW1uV2lkdGggKSwgMTIgKSB8fCAxO1xuXG5cdFx0XHRpZiAoICEgcHJldiB8fCBwcmV2ICE9PSB0aGlzLmNvbHVtbnMgKSB7XG5cdFx0XHRcdHRoaXMuJGVsLmNsb3Nlc3QoICcubWVkaWEtZnJhbWUtY29udGVudCcgKS5hdHRyKCAnZGF0YS1jb2x1bW5zJywgdGhpcy5jb2x1bW5zICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdGluaXRTb3J0YWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbGxlY3Rpb24gPSB0aGlzLmNvbGxlY3Rpb247XG5cblx0XHRpZiAoIHdwLm1lZGlhLmlzVG91Y2hEZXZpY2UgfHwgISB0aGlzLm9wdGlvbnMuc29ydGFibGUgfHwgISAkLmZuLnNvcnRhYmxlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuJGVsLnNvcnRhYmxlKCBfLmV4dGVuZCh7XG5cdFx0XHQvLyBJZiB0aGUgYGNvbGxlY3Rpb25gIGhhcyBhIGBjb21wYXJhdG9yYCwgZGlzYWJsZSBzb3J0aW5nLlxuXHRcdFx0ZGlzYWJsZWQ6ICEhIGNvbGxlY3Rpb24uY29tcGFyYXRvcixcblxuXHRcdFx0Ly8gQ2hhbmdlIHRoZSBwb3NpdGlvbiBvZiB0aGUgYXR0YWNobWVudCBhcyBzb29uIGFzIHRoZVxuXHRcdFx0Ly8gbW91c2UgcG9pbnRlciBvdmVybGFwcyBhIHRodW1ibmFpbC5cblx0XHRcdHRvbGVyYW5jZTogJ3BvaW50ZXInLFxuXG5cdFx0XHQvLyBSZWNvcmQgdGhlIGluaXRpYWwgYGluZGV4YCBvZiB0aGUgZHJhZ2dlZCBtb2RlbC5cblx0XHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xuXHRcdFx0XHR1aS5pdGVtLmRhdGEoJ3NvcnRhYmxlSW5kZXhTdGFydCcsIHVpLml0ZW0uaW5kZXgoKSk7XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBVcGRhdGUgdGhlIG1vZGVsJ3MgaW5kZXggaW4gdGhlIGNvbGxlY3Rpb24uXG5cdFx0XHQvLyBEbyBzbyBzaWxlbnRseSwgYXMgdGhlIHZpZXcgaXMgYWxyZWFkeSBhY2N1cmF0ZS5cblx0XHRcdHVwZGF0ZTogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblx0XHRcdFx0dmFyIG1vZGVsID0gY29sbGVjdGlvbi5hdCggdWkuaXRlbS5kYXRhKCdzb3J0YWJsZUluZGV4U3RhcnQnKSApLFxuXHRcdFx0XHRcdGNvbXBhcmF0b3IgPSBjb2xsZWN0aW9uLmNvbXBhcmF0b3I7XG5cblx0XHRcdFx0Ly8gVGVtcG9yYXJpbHkgZGlzYWJsZSB0aGUgY29tcGFyYXRvciB0byBwcmV2ZW50IGBhZGRgXG5cdFx0XHRcdC8vIGZyb20gcmUtc29ydGluZy5cblx0XHRcdFx0ZGVsZXRlIGNvbGxlY3Rpb24uY29tcGFyYXRvcjtcblxuXHRcdFx0XHQvLyBTaWxlbnRseSBzaGlmdCB0aGUgbW9kZWwgdG8gaXRzIG5ldyBpbmRleC5cblx0XHRcdFx0Y29sbGVjdGlvbi5yZW1vdmUoIG1vZGVsLCB7XG5cdFx0XHRcdFx0c2lsZW50OiB0cnVlXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRjb2xsZWN0aW9uLmFkZCggbW9kZWwsIHtcblx0XHRcdFx0XHRzaWxlbnQ6IHRydWUsXG5cdFx0XHRcdFx0YXQ6ICAgICB1aS5pdGVtLmluZGV4KClcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Ly8gUmVzdG9yZSB0aGUgY29tcGFyYXRvci5cblx0XHRcdFx0Y29sbGVjdGlvbi5jb21wYXJhdG9yID0gY29tcGFyYXRvcjtcblxuXHRcdFx0XHQvLyBGaXJlIHRoZSBgcmVzZXRgIGV2ZW50IHRvIGVuc3VyZSBvdGhlciBjb2xsZWN0aW9ucyBzeW5jLlxuXHRcdFx0XHRjb2xsZWN0aW9uLnRyaWdnZXIoICdyZXNldCcsIGNvbGxlY3Rpb24gKTtcblxuXHRcdFx0XHQvLyBJZiB0aGUgY29sbGVjdGlvbiBpcyBzb3J0ZWQgYnkgbWVudSBvcmRlcixcblx0XHRcdFx0Ly8gdXBkYXRlIHRoZSBtZW51IG9yZGVyLlxuXHRcdFx0XHRjb2xsZWN0aW9uLnNhdmVNZW51T3JkZXIoKTtcblx0XHRcdH1cblx0XHR9LCB0aGlzLm9wdGlvbnMuc29ydGFibGUgKSApO1xuXG5cdFx0Ly8gSWYgdGhlIGBvcmRlcmJ5YCBwcm9wZXJ0eSBpcyBjaGFuZ2VkIG9uIHRoZSBgY29sbGVjdGlvbmAsXG5cdFx0Ly8gY2hlY2sgdG8gc2VlIGlmIHdlIGhhdmUgYSBgY29tcGFyYXRvcmAuIElmIHNvLCBkaXNhYmxlIHNvcnRpbmcuXG5cdFx0Y29sbGVjdGlvbi5wcm9wcy5vbiggJ2NoYW5nZTpvcmRlcmJ5JywgZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLiRlbC5zb3J0YWJsZSggJ29wdGlvbicsICdkaXNhYmxlZCcsICEhIGNvbGxlY3Rpb24uY29tcGFyYXRvciApO1xuXHRcdH0sIHRoaXMgKTtcblxuXHRcdHRoaXMuY29sbGVjdGlvbi5wcm9wcy5vbiggJ2NoYW5nZTpvcmRlcmJ5JywgdGhpcy5yZWZyZXNoU29ydGFibGUsIHRoaXMgKTtcblx0XHR0aGlzLnJlZnJlc2hTb3J0YWJsZSgpO1xuXHR9LFxuXG5cdHJlZnJlc2hTb3J0YWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB3cC5tZWRpYS5pc1RvdWNoRGV2aWNlIHx8ICEgdGhpcy5vcHRpb25zLnNvcnRhYmxlIHx8ICEgJC5mbi5zb3J0YWJsZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgYGNvbGxlY3Rpb25gIGhhcyBhIGBjb21wYXJhdG9yYCwgZGlzYWJsZSBzb3J0aW5nLlxuXHRcdHZhciBjb2xsZWN0aW9uID0gdGhpcy5jb2xsZWN0aW9uLFxuXHRcdFx0b3JkZXJieSA9IGNvbGxlY3Rpb24ucHJvcHMuZ2V0KCdvcmRlcmJ5JyksXG5cdFx0XHRlbmFibGVkID0gJ21lbnVPcmRlcicgPT09IG9yZGVyYnkgfHwgISBjb2xsZWN0aW9uLmNvbXBhcmF0b3I7XG5cblx0XHR0aGlzLiRlbC5zb3J0YWJsZSggJ29wdGlvbicsICdkaXNhYmxlZCcsICEgZW5hYmxlZCApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0ICogQHJldHVybnMge3dwLm1lZGlhLlZpZXd9XG5cdCAqL1xuXHRjcmVhdGVBdHRhY2htZW50VmlldzogZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0dmFyIHZpZXcgPSBuZXcgdGhpcy5vcHRpb25zLkF0dGFjaG1lbnRWaWV3KHtcblx0XHRcdGNvbnRyb2xsZXI6ICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRtb2RlbDogICAgICAgICAgICAgICAgYXR0YWNobWVudCxcblx0XHRcdGNvbGxlY3Rpb246ICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24sXG5cdFx0XHRzZWxlY3Rpb246ICAgICAgICAgICAgdGhpcy5vcHRpb25zLnNlbGVjdGlvblxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRoaXMuX3ZpZXdzQnlDaWRbIGF0dGFjaG1lbnQuY2lkIF0gPSB2aWV3O1xuXHR9LFxuXG5cdHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIENyZWF0ZSBhbGwgb2YgdGhlIEF0dGFjaG1lbnQgdmlld3MsIGFuZCByZXBsYWNlXG5cdFx0Ly8gdGhlIGxpc3QgaW4gYSBzaW5nbGUgRE9NIG9wZXJhdGlvbi5cblx0XHRpZiAoIHRoaXMuY29sbGVjdGlvbi5sZW5ndGggKSB7XG5cdFx0XHR0aGlzLnZpZXdzLnNldCggdGhpcy5jb2xsZWN0aW9uLm1hcCggdGhpcy5jcmVhdGVBdHRhY2htZW50VmlldywgdGhpcyApICk7XG5cblx0XHQvLyBJZiB0aGVyZSBhcmUgbm8gZWxlbWVudHMsIGNsZWFyIHRoZSB2aWV3cyBhbmQgbG9hZCBzb21lLlxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnZpZXdzLnVuc2V0KCk7XG5cdFx0XHR0aGlzLmNvbGxlY3Rpb24ubW9yZSgpLmRvbmUoIHRoaXMuc2Nyb2xsICk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHQvLyBUcmlnZ2VyIHRoZSBzY3JvbGwgZXZlbnQgdG8gY2hlY2sgaWYgd2UncmUgd2l0aGluIHRoZVxuXHRcdC8vIHRocmVzaG9sZCB0byBxdWVyeSBmb3IgYWRkaXRpb25hbCBhdHRhY2htZW50cy5cblx0XHR0aGlzLnNjcm9sbCgpO1xuXHR9LFxuXG5cdHNjcm9sbDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLFxuXHRcdFx0ZWwgPSB0aGlzLm9wdGlvbnMuc2Nyb2xsRWxlbWVudCxcblx0XHRcdHNjcm9sbFRvcCA9IGVsLnNjcm9sbFRvcCxcblx0XHRcdHRvb2xiYXI7XG5cblx0XHQvLyBUaGUgc2Nyb2xsIGV2ZW50IG9jY3VycyBvbiB0aGUgZG9jdW1lbnQsIGJ1dCB0aGUgZWxlbWVudFxuXHRcdC8vIHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQgaXMgdGhlIGRvY3VtZW50IGJvZHkuXG5cdFx0aWYgKCBlbCA9PT0gZG9jdW1lbnQgKSB7XG5cdFx0XHRlbCA9IGRvY3VtZW50LmJvZHk7XG5cdFx0XHRzY3JvbGxUb3AgPSAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKTtcblx0XHR9XG5cblx0XHRpZiAoICEgJChlbCkuaXMoJzp2aXNpYmxlJykgfHwgISB0aGlzLmNvbGxlY3Rpb24uaGFzTW9yZSgpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRvb2xiYXIgPSB0aGlzLnZpZXdzLnBhcmVudC50b29sYmFyO1xuXG5cdFx0Ly8gU2hvdyB0aGUgc3Bpbm5lciBvbmx5IGlmIHdlIGFyZSBjbG9zZSB0byB0aGUgYm90dG9tLlxuXHRcdGlmICggZWwuc2Nyb2xsSGVpZ2h0IC0gKCBzY3JvbGxUb3AgKyBlbC5jbGllbnRIZWlnaHQgKSA8IGVsLmNsaWVudEhlaWdodCAvIDMgKSB7XG5cdFx0XHR0b29sYmFyLmdldCgnc3Bpbm5lcicpLnNob3coKTtcblx0XHR9XG5cblx0XHRpZiAoIGVsLnNjcm9sbEhlaWdodCA8IHNjcm9sbFRvcCArICggZWwuY2xpZW50SGVpZ2h0ICogdGhpcy5vcHRpb25zLnJlZnJlc2hUaHJlc2hvbGQgKSApIHtcblx0XHRcdHRoaXMuY29sbGVjdGlvbi5tb3JlKCkuZG9uZShmdW5jdGlvbigpIHtcblx0XHRcdFx0dmlldy5zY3JvbGwoKTtcblx0XHRcdFx0dG9vbGJhci5nZXQoJ3NwaW5uZXInKS5oaWRlKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF0dGFjaG1lbnRzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzQnJvd3NlclxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgIFtvcHRpb25zXSAgICAgICAgICAgICAgIFRoZSBvcHRpb25zIGhhc2ggcGFzc2VkIHRvIHRoZSB2aWV3LlxuICogQHBhcmFtIHtib29sZWFufHN0cmluZ30gW29wdGlvbnMuZmlsdGVycz1mYWxzZV0gV2hpY2ggZmlsdGVycyB0byBzaG93IGluIHRoZSBicm93c2VyJ3MgdG9vbGJhci5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjY2VwdHMgJ3VwbG9hZGVkJyBhbmQgJ2FsbCcuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICBbb3B0aW9ucy5zZWFyY2g9dHJ1ZV0gICBXaGV0aGVyIHRvIHNob3cgdGhlIHNlYXJjaCBpbnRlcmZhY2UgaW4gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm93c2VyJ3MgdG9vbGJhci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgIFtvcHRpb25zLmRhdGU9dHJ1ZV0gICAgIFdoZXRoZXIgdG8gc2hvdyB0aGUgZGF0ZSBmaWx0ZXIgaW4gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm93c2VyJ3MgdG9vbGJhci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgIFtvcHRpb25zLmRpc3BsYXk9ZmFsc2VdIFdoZXRoZXIgdG8gc2hvdyB0aGUgYXR0YWNobWVudHMgZGlzcGxheSBzZXR0aW5nc1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlldyBpbiB0aGUgc2lkZWJhci5cbiAqIEBwYXJhbSB7Ym9vbGVhbnxzdHJpbmd9IFtvcHRpb25zLnNpZGViYXI9dHJ1ZV0gIFdoZXRoZXIgdG8gY3JlYXRlIGEgc2lkZWJhciBmb3IgdGhlIGJyb3dzZXIuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY2NlcHRzIHRydWUsIGZhbHNlLCBhbmQgJ2Vycm9ycycuXG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0bWVkaWFUcmFzaCA9IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MubWVkaWFUcmFzaCxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0JCA9IGpRdWVyeSxcblx0QXR0YWNobWVudHNCcm93c2VyO1xuXG5BdHRhY2htZW50c0Jyb3dzZXIgPSBWaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2RpdicsXG5cdGNsYXNzTmFtZTogJ2F0dGFjaG1lbnRzLWJyb3dzZXInLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0ZmlsdGVyczogZmFsc2UsXG5cdFx0XHRzZWFyY2g6ICB0cnVlLFxuXHRcdFx0ZGF0ZTogICAgdHJ1ZSxcblx0XHRcdGRpc3BsYXk6IGZhbHNlLFxuXHRcdFx0c2lkZWJhcjogdHJ1ZSxcblx0XHRcdEF0dGFjaG1lbnRWaWV3OiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuTGlicmFyeVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAndG9nZ2xlOnVwbG9hZDphdHRhY2htZW50JywgdGhpcy50b2dnbGVVcGxvYWRlciwgdGhpcyApO1xuXHRcdHRoaXMuY29udHJvbGxlci5vbiggJ2VkaXQ6c2VsZWN0aW9uJywgdGhpcy5lZGl0U2VsZWN0aW9uICk7XG5cdFx0dGhpcy5jcmVhdGVUb29sYmFyKCk7XG5cdFx0dGhpcy5jcmVhdGVVcGxvYWRlcigpO1xuXHRcdHRoaXMuY3JlYXRlQXR0YWNobWVudHMoKTtcblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zaWRlYmFyICkge1xuXHRcdFx0dGhpcy5jcmVhdGVTaWRlYmFyKCk7XG5cdFx0fVxuXHRcdHRoaXMudXBkYXRlQ29udGVudCgpO1xuXG5cdFx0aWYgKCAhIHRoaXMub3B0aW9ucy5zaWRlYmFyIHx8ICdlcnJvcnMnID09PSB0aGlzLm9wdGlvbnMuc2lkZWJhciApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnaGlkZS1zaWRlYmFyJyApO1xuXG5cdFx0XHRpZiAoICdlcnJvcnMnID09PSB0aGlzLm9wdGlvbnMuc2lkZWJhciApIHtcblx0XHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdzaWRlYmFyLWZvci1lcnJvcnMnICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLm9uKCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMudXBkYXRlQ29udGVudCwgdGhpcyApO1xuXHR9LFxuXG5cdGVkaXRTZWxlY3Rpb246IGZ1bmN0aW9uKCBtb2RhbCApIHtcblx0XHRtb2RhbC4kKCAnLm1lZGlhLWJ1dHRvbi1iYWNrVG9MaWJyYXJ5JyApLmZvY3VzKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzQnJvd3Nlcn0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMub3B0aW9ucy5zZWxlY3Rpb24ub2ZmKCBudWxsLCBudWxsLCB0aGlzICk7XG5cdFx0Vmlldy5wcm90b3R5cGUuZGlzcG9zZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Y3JlYXRlVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIExpYnJhcnlWaWV3U3dpdGNoZXIsIEZpbHRlcnMsIHRvb2xiYXJPcHRpb25zO1xuXG5cdFx0dG9vbGJhck9wdGlvbnMgPSB7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXJcblx0XHR9O1xuXG5cdFx0aWYgKCB0aGlzLmNvbnRyb2xsZXIuaXNNb2RlQWN0aXZlKCAnZ3JpZCcgKSApIHtcblx0XHRcdHRvb2xiYXJPcHRpb25zLmNsYXNzTmFtZSA9ICdtZWRpYS10b29sYmFyIHdwLWZpbHRlcic7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0KiBAbWVtYmVyIHt3cC5tZWRpYS52aWV3LlRvb2xiYXJ9XG5cdFx0Ki9cblx0XHR0aGlzLnRvb2xiYXIgPSBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKCB0b29sYmFyT3B0aW9ucyApO1xuXG5cdFx0dGhpcy52aWV3cy5hZGQoIHRoaXMudG9vbGJhciApO1xuXG5cdFx0dGhpcy50b29sYmFyLnNldCggJ3NwaW5uZXInLCBuZXcgd3AubWVkaWEudmlldy5TcGlubmVyKHtcblx0XHRcdHByaW9yaXR5OiAtNjBcblx0XHR9KSApO1xuXG5cdFx0aWYgKCAtMSAhPT0gJC5pbkFycmF5KCB0aGlzLm9wdGlvbnMuZmlsdGVycywgWyAndXBsb2FkZWQnLCAnYWxsJyBdICkgKSB7XG5cdFx0XHQvLyBcIkZpbHRlcnNcIiB3aWxsIHJldHVybiBhIDxzZWxlY3Q+LCBuZWVkIHRvIHJlbmRlclxuXHRcdFx0Ly8gc2NyZWVuIHJlYWRlciB0ZXh0IGJlZm9yZVxuXHRcdFx0dGhpcy50b29sYmFyLnNldCggJ2ZpbHRlcnNMYWJlbCcsIG5ldyB3cC5tZWRpYS52aWV3LkxhYmVsKHtcblx0XHRcdFx0dmFsdWU6IGwxMG4uZmlsdGVyQnlUeXBlLFxuXHRcdFx0XHRhdHRyaWJ1dGVzOiB7XG5cdFx0XHRcdFx0J2Zvcic6ICAnbWVkaWEtYXR0YWNobWVudC1maWx0ZXJzJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmlvcml0eTogICAtODBcblx0XHRcdH0pLnJlbmRlcigpICk7XG5cblx0XHRcdGlmICggJ3VwbG9hZGVkJyA9PT0gdGhpcy5vcHRpb25zLmZpbHRlcnMgKSB7XG5cdFx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdmaWx0ZXJzJywgbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMuVXBsb2FkZWQoe1xuXHRcdFx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRtb2RlbDogICAgICB0aGlzLmNvbGxlY3Rpb24ucHJvcHMsXG5cdFx0XHRcdFx0cHJpb3JpdHk6ICAgLTgwXG5cdFx0XHRcdH0pLnJlbmRlcigpICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRGaWx0ZXJzID0gbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMuQWxsKHtcblx0XHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdFx0bW9kZWw6ICAgICAgdGhpcy5jb2xsZWN0aW9uLnByb3BzLFxuXHRcdFx0XHRcdHByaW9yaXR5OiAgIC04MFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZmlsdGVycycsIEZpbHRlcnMucmVuZGVyKCkgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBGZWVscyBvZGQgdG8gYnJpbmcgdGhlIGdsb2JhbCBtZWRpYSBsaWJyYXJ5IHN3aXRjaGVyIGludG8gdGhlIEF0dGFjaG1lbnRcblx0XHQvLyBicm93c2VyIHZpZXcuIElzIHRoaXMgYSB1c2UgY2FzZSBmb3IgZG9BY3Rpb24oICdhZGQ6dG9vbGJhci1pdGVtczphdHRhY2htZW50cy1icm93c2VyJywgdGhpcy50b29sYmFyICk7XG5cdFx0Ly8gd2hpY2ggdGhlIGNvbnRyb2xsZXIgY2FuIHRhcCBpbnRvIGFuZCBhZGQgdGhpcyB2aWV3P1xuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ2dyaWQnICkgKSB7XG5cdFx0XHRMaWJyYXJ5Vmlld1N3aXRjaGVyID0gVmlldy5leHRlbmQoe1xuXHRcdFx0XHRjbGFzc05hbWU6ICd2aWV3LXN3aXRjaCBtZWRpYS1ncmlkLXZpZXctc3dpdGNoJyxcblx0XHRcdFx0dGVtcGxhdGU6IHdwLnRlbXBsYXRlKCAnbWVkaWEtbGlicmFyeS12aWV3LXN3aXRjaGVyJylcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnbGlicmFyeVZpZXdTd2l0Y2hlcicsIG5ldyBMaWJyYXJ5Vmlld1N3aXRjaGVyKHtcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRwcmlvcml0eTogLTkwXG5cdFx0XHR9KS5yZW5kZXIoKSApO1xuXG5cdFx0XHQvLyBEYXRlRmlsdGVyIGlzIGEgPHNlbGVjdD4sIHNjcmVlbiByZWFkZXIgdGV4dCBuZWVkcyB0byBiZSByZW5kZXJlZCBiZWZvcmVcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdkYXRlRmlsdGVyTGFiZWwnLCBuZXcgd3AubWVkaWEudmlldy5MYWJlbCh7XG5cdFx0XHRcdHZhbHVlOiBsMTBuLmZpbHRlckJ5RGF0ZSxcblx0XHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0XHRcdCdmb3InOiAnbWVkaWEtYXR0YWNobWVudC1kYXRlLWZpbHRlcnMnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByaW9yaXR5OiAtNzVcblx0XHRcdH0pLnJlbmRlcigpICk7XG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZGF0ZUZpbHRlcicsIG5ldyB3cC5tZWRpYS52aWV3LkRhdGVGaWx0ZXIoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdG1vZGVsOiAgICAgIHRoaXMuY29sbGVjdGlvbi5wcm9wcyxcblx0XHRcdFx0cHJpb3JpdHk6IC03NVxuXHRcdFx0fSkucmVuZGVyKCkgKTtcblxuXHRcdFx0Ly8gQnVsa1NlbGVjdGlvbiBpcyBhIDxkaXY+IHdpdGggc3Vidmlld3MsIGluY2x1ZGluZyBzY3JlZW4gcmVhZGVyIHRleHRcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdzZWxlY3RNb2RlVG9nZ2xlQnV0dG9uJywgbmV3IHdwLm1lZGlhLnZpZXcuU2VsZWN0TW9kZVRvZ2dsZUJ1dHRvbih7XG5cdFx0XHRcdHRleHQ6IGwxMG4uYnVsa1NlbGVjdCxcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRwcmlvcml0eTogLTcwXG5cdFx0XHR9KS5yZW5kZXIoKSApO1xuXG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZGVsZXRlU2VsZWN0ZWRCdXR0b24nLCBuZXcgd3AubWVkaWEudmlldy5EZWxldGVTZWxlY3RlZEJ1dHRvbih7XG5cdFx0XHRcdGZpbHRlcnM6IEZpbHRlcnMsXG5cdFx0XHRcdHN0eWxlOiAncHJpbWFyeScsXG5cdFx0XHRcdGRpc2FibGVkOiB0cnVlLFxuXHRcdFx0XHR0ZXh0OiBtZWRpYVRyYXNoID8gbDEwbi50cmFzaFNlbGVjdGVkIDogbDEwbi5kZWxldGVTZWxlY3RlZCxcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRwcmlvcml0eTogLTYwLFxuXHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIGNoYW5nZWQgPSBbXSwgcmVtb3ZlZCA9IFtdLFxuXHRcdFx0XHRcdFx0c2VsZWN0aW9uID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCAnc2VsZWN0aW9uJyApLFxuXHRcdFx0XHRcdFx0bGlicmFyeSA9IHRoaXMuY29udHJvbGxlci5zdGF0ZSgpLmdldCggJ2xpYnJhcnknICk7XG5cblx0XHRcdFx0XHRpZiAoICEgc2VsZWN0aW9uLmxlbmd0aCApIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoICEgbWVkaWFUcmFzaCAmJiAhIHdpbmRvdy5jb25maXJtKCBsMTBuLndhcm5CdWxrRGVsZXRlICkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKCBtZWRpYVRyYXNoICYmXG5cdFx0XHRcdFx0XHQndHJhc2gnICE9PSBzZWxlY3Rpb24uYXQoIDAgKS5nZXQoICdzdGF0dXMnICkgJiZcblx0XHRcdFx0XHRcdCEgd2luZG93LmNvbmZpcm0oIGwxMG4ud2FybkJ1bGtUcmFzaCApICkge1xuXG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2VsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdFx0XHRcdGlmICggISBtb2RlbC5nZXQoICdub25jZXMnIClbJ2RlbGV0ZSddICkge1xuXHRcdFx0XHRcdFx0XHRyZW1vdmVkLnB1c2goIG1vZGVsICk7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCBtZWRpYVRyYXNoICYmICd0cmFzaCcgPT09IG1vZGVsLmdldCggJ3N0YXR1cycgKSApIHtcblx0XHRcdFx0XHRcdFx0bW9kZWwuc2V0KCAnc3RhdHVzJywgJ2luaGVyaXQnICk7XG5cdFx0XHRcdFx0XHRcdGNoYW5nZWQucHVzaCggbW9kZWwuc2F2ZSgpICk7XG5cdFx0XHRcdFx0XHRcdHJlbW92ZWQucHVzaCggbW9kZWwgKTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoIG1lZGlhVHJhc2ggKSB7XG5cdFx0XHRcdFx0XHRcdG1vZGVsLnNldCggJ3N0YXR1cycsICd0cmFzaCcgKTtcblx0XHRcdFx0XHRcdFx0Y2hhbmdlZC5wdXNoKCBtb2RlbC5zYXZlKCkgKTtcblx0XHRcdFx0XHRcdFx0cmVtb3ZlZC5wdXNoKCBtb2RlbCApO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0bW9kZWwuZGVzdHJveSh7d2FpdDogdHJ1ZX0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRcdGlmICggY2hhbmdlZC5sZW5ndGggKSB7XG5cdFx0XHRcdFx0XHRzZWxlY3Rpb24ucmVtb3ZlKCByZW1vdmVkICk7XG5cblx0XHRcdFx0XHRcdCQud2hlbi5hcHBseSggbnVsbCwgY2hhbmdlZCApLnRoZW4oIF8uYmluZCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdGxpYnJhcnkuX3JlcXVlcnkoIHRydWUgKTtcblx0XHRcdFx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdzZWxlY3Rpb246YWN0aW9uOmRvbmUnICk7XG5cdFx0XHRcdFx0XHR9LCB0aGlzICkgKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdzZWxlY3Rpb246YWN0aW9uOmRvbmUnICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KS5yZW5kZXIoKSApO1xuXG5cdFx0XHRpZiAoIG1lZGlhVHJhc2ggKSB7XG5cdFx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdkZWxldGVTZWxlY3RlZFBlcm1hbmVudGx5QnV0dG9uJywgbmV3IHdwLm1lZGlhLnZpZXcuRGVsZXRlU2VsZWN0ZWRQZXJtYW5lbnRseUJ1dHRvbih7XG5cdFx0XHRcdFx0ZmlsdGVyczogRmlsdGVycyxcblx0XHRcdFx0XHRzdHlsZTogJ3ByaW1hcnknLFxuXHRcdFx0XHRcdGRpc2FibGVkOiB0cnVlLFxuXHRcdFx0XHRcdHRleHQ6IGwxMG4uZGVsZXRlU2VsZWN0ZWQsXG5cdFx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdHByaW9yaXR5OiAtNTUsXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIHJlbW92ZWQgPSBbXSwgc2VsZWN0aW9uID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCAnc2VsZWN0aW9uJyApO1xuXG5cdFx0XHRcdFx0XHRpZiAoICEgc2VsZWN0aW9uLmxlbmd0aCB8fCAhIHdpbmRvdy5jb25maXJtKCBsMTBuLndhcm5CdWxrRGVsZXRlICkgKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0c2VsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdFx0XHRcdFx0aWYgKCAhIG1vZGVsLmdldCggJ25vbmNlcycgKVsnZGVsZXRlJ10gKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmVtb3ZlZC5wdXNoKCBtb2RlbCApO1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG1vZGVsLmRlc3Ryb3koKTtcblx0XHRcdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRcdFx0c2VsZWN0aW9uLnJlbW92ZSggcmVtb3ZlZCApO1xuXHRcdFx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdzZWxlY3Rpb246YWN0aW9uOmRvbmUnICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KS5yZW5kZXIoKSApO1xuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIGlmICggdGhpcy5vcHRpb25zLmRhdGUgKSB7XG5cdFx0XHQvLyBEYXRlRmlsdGVyIGlzIGEgPHNlbGVjdD4sIHNjcmVlbiByZWFkZXIgdGV4dCBuZWVkcyB0byBiZSByZW5kZXJlZCBiZWZvcmVcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdkYXRlRmlsdGVyTGFiZWwnLCBuZXcgd3AubWVkaWEudmlldy5MYWJlbCh7XG5cdFx0XHRcdHZhbHVlOiBsMTBuLmZpbHRlckJ5RGF0ZSxcblx0XHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0XHRcdCdmb3InOiAnbWVkaWEtYXR0YWNobWVudC1kYXRlLWZpbHRlcnMnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByaW9yaXR5OiAtNzVcblx0XHRcdH0pLnJlbmRlcigpICk7XG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZGF0ZUZpbHRlcicsIG5ldyB3cC5tZWRpYS52aWV3LkRhdGVGaWx0ZXIoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdG1vZGVsOiAgICAgIHRoaXMuY29sbGVjdGlvbi5wcm9wcyxcblx0XHRcdFx0cHJpb3JpdHk6IC03NVxuXHRcdFx0fSkucmVuZGVyKCkgKTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zZWFyY2ggKSB7XG5cdFx0XHQvLyBTZWFyY2ggaXMgYW4gaW5wdXQsIHNjcmVlbiByZWFkZXIgdGV4dCBuZWVkcyB0byBiZSByZW5kZXJlZCBiZWZvcmVcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdzZWFyY2hMYWJlbCcsIG5ldyB3cC5tZWRpYS52aWV3LkxhYmVsKHtcblx0XHRcdFx0dmFsdWU6IGwxMG4uc2VhcmNoTWVkaWFMYWJlbCxcblx0XHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0XHRcdCdmb3InOiAnbWVkaWEtc2VhcmNoLWlucHV0J1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmlvcml0eTogICA2MFxuXHRcdFx0fSkucmVuZGVyKCkgKTtcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdzZWFyY2gnLCBuZXcgd3AubWVkaWEudmlldy5TZWFyY2goe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdG1vZGVsOiAgICAgIHRoaXMuY29sbGVjdGlvbi5wcm9wcyxcblx0XHRcdFx0cHJpb3JpdHk6ICAgNjBcblx0XHRcdH0pLnJlbmRlcigpICk7XG5cdFx0fVxuXG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMuZHJhZ0luZm8gKSB7XG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZHJhZ0luZm8nLCBuZXcgVmlldyh7XG5cdFx0XHRcdGVsOiAkKCAnPGRpdiBjbGFzcz1cImluc3RydWN0aW9uc1wiPicgKyBsMTBuLmRyYWdJbmZvICsgJzwvZGl2PicgKVswXSxcblx0XHRcdFx0cHJpb3JpdHk6IC00MFxuXHRcdFx0fSkgKTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zdWdnZXN0ZWRXaWR0aCAmJiB0aGlzLm9wdGlvbnMuc3VnZ2VzdGVkSGVpZ2h0ICkge1xuXHRcdFx0dGhpcy50b29sYmFyLnNldCggJ3N1Z2dlc3RlZERpbWVuc2lvbnMnLCBuZXcgVmlldyh7XG5cdFx0XHRcdGVsOiAkKCAnPGRpdiBjbGFzcz1cImluc3RydWN0aW9uc1wiPicgKyBsMTBuLnN1Z2dlc3RlZERpbWVuc2lvbnMgKyAnICcgKyB0aGlzLm9wdGlvbnMuc3VnZ2VzdGVkV2lkdGggKyAnICZ0aW1lczsgJyArIHRoaXMub3B0aW9ucy5zdWdnZXN0ZWRIZWlnaHQgKyAnPC9kaXY+JyApWzBdLFxuXHRcdFx0XHRwcmlvcml0eTogLTQwXG5cdFx0XHR9KSApO1xuXHRcdH1cblx0fSxcblxuXHR1cGRhdGVDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMsXG5cdFx0XHRub0l0ZW1zVmlldztcblxuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ2dyaWQnICkgKSB7XG5cdFx0XHRub0l0ZW1zVmlldyA9IHZpZXcuYXR0YWNobWVudHNOb1Jlc3VsdHM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5vSXRlbXNWaWV3ID0gdmlldy51cGxvYWRlcjtcblx0XHR9XG5cblx0XHRpZiAoICEgdGhpcy5jb2xsZWN0aW9uLmxlbmd0aCApIHtcblx0XHRcdHRoaXMudG9vbGJhci5nZXQoICdzcGlubmVyJyApLnNob3coKTtcblx0XHRcdHRoaXMuZGZkID0gdGhpcy5jb2xsZWN0aW9uLm1vcmUoKS5kb25lKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKCAhIHZpZXcuY29sbGVjdGlvbi5sZW5ndGggKSB7XG5cdFx0XHRcdFx0bm9JdGVtc1ZpZXcuJGVsLnJlbW92ZUNsYXNzKCAnaGlkZGVuJyApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG5vSXRlbXNWaWV3LiRlbC5hZGRDbGFzcyggJ2hpZGRlbicgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2aWV3LnRvb2xiYXIuZ2V0KCAnc3Bpbm5lcicgKS5oaWRlKCk7XG5cdFx0XHR9ICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5vSXRlbXNWaWV3LiRlbC5hZGRDbGFzcyggJ2hpZGRlbicgKTtcblx0XHRcdHZpZXcudG9vbGJhci5nZXQoICdzcGlubmVyJyApLmhpZGUoKTtcblx0XHR9XG5cdH0sXG5cblx0Y3JlYXRlVXBsb2FkZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudXBsb2FkZXIgPSBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlcklubGluZSh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRzdGF0dXM6ICAgICBmYWxzZSxcblx0XHRcdG1lc3NhZ2U6ICAgIHRoaXMuY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApID8gJycgOiBsMTBuLm5vSXRlbXNGb3VuZCxcblx0XHRcdGNhbkNsb3NlOiAgIHRoaXMuY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApXG5cdFx0fSk7XG5cblx0XHR0aGlzLnVwbG9hZGVyLmhpZGUoKTtcblx0XHR0aGlzLnZpZXdzLmFkZCggdGhpcy51cGxvYWRlciApO1xuXHR9LFxuXG5cdHRvZ2dsZVVwbG9hZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMudXBsb2FkZXIuJGVsLmhhc0NsYXNzKCAnaGlkZGVuJyApICkge1xuXHRcdFx0dGhpcy51cGxvYWRlci5zaG93KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudXBsb2FkZXIuaGlkZSgpO1xuXHRcdH1cblx0fSxcblxuXHRjcmVhdGVBdHRhY2htZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hdHRhY2htZW50cyA9IG5ldyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzKHtcblx0XHRcdGNvbnRyb2xsZXI6ICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRjb2xsZWN0aW9uOiAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLFxuXHRcdFx0c2VsZWN0aW9uOiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zZWxlY3Rpb24sXG5cdFx0XHRtb2RlbDogICAgICAgICAgICAgICAgdGhpcy5tb2RlbCxcblx0XHRcdHNvcnRhYmxlOiAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuc29ydGFibGUsXG5cdFx0XHRzY3JvbGxFbGVtZW50OiAgICAgICAgdGhpcy5vcHRpb25zLnNjcm9sbEVsZW1lbnQsXG5cdFx0XHRpZGVhbENvbHVtbldpZHRoOiAgICAgdGhpcy5vcHRpb25zLmlkZWFsQ29sdW1uV2lkdGgsXG5cblx0XHRcdC8vIFRoZSBzaW5nbGUgYEF0dGFjaG1lbnRgIHZpZXcgdG8gYmUgdXNlZCBpbiB0aGUgYEF0dGFjaG1lbnRzYCB2aWV3LlxuXHRcdFx0QXR0YWNobWVudFZpZXc6IHRoaXMub3B0aW9ucy5BdHRhY2htZW50Vmlld1xuXHRcdH0pO1xuXG5cdFx0Ly8gQWRkIGtleWRvd24gbGlzdGVuZXIgdG8gdGhlIGluc3RhbmNlIG9mIHRoZSBBdHRhY2htZW50cyB2aWV3XG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnYXR0YWNobWVudDprZXlkb3duOmFycm93JywgICAgIF8uYmluZCggdGhpcy5hdHRhY2htZW50cy5hcnJvd0V2ZW50LCB0aGlzLmF0dGFjaG1lbnRzICkgKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIub24oICdhdHRhY2htZW50OmRldGFpbHM6c2hpZnQtdGFiJywgXy5iaW5kKCB0aGlzLmF0dGFjaG1lbnRzLnJlc3RvcmVGb2N1cywgdGhpcy5hdHRhY2htZW50cyApICk7XG5cblx0XHR0aGlzLnZpZXdzLmFkZCggdGhpcy5hdHRhY2htZW50cyApO1xuXG5cblx0XHRpZiAoIHRoaXMuY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApICkge1xuXHRcdFx0dGhpcy5hdHRhY2htZW50c05vUmVzdWx0cyA9IG5ldyBWaWV3KHtcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHR0YWdOYW1lOiAncCdcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmF0dGFjaG1lbnRzTm9SZXN1bHRzLiRlbC5hZGRDbGFzcyggJ2hpZGRlbiBuby1tZWRpYScgKTtcblx0XHRcdHRoaXMuYXR0YWNobWVudHNOb1Jlc3VsdHMuJGVsLmh0bWwoIGwxMG4ubm9NZWRpYSApO1xuXG5cdFx0XHR0aGlzLnZpZXdzLmFkZCggdGhpcy5hdHRhY2htZW50c05vUmVzdWx0cyApO1xuXHRcdH1cblx0fSxcblxuXHRjcmVhdGVTaWRlYmFyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcblx0XHRcdHNlbGVjdGlvbiA9IG9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0c2lkZWJhciA9IHRoaXMuc2lkZWJhciA9IG5ldyB3cC5tZWRpYS52aWV3LlNpZGViYXIoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXJcblx0XHRcdH0pO1xuXG5cdFx0dGhpcy52aWV3cy5hZGQoIHNpZGViYXIgKTtcblxuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLnVwbG9hZGVyICkge1xuXHRcdFx0c2lkZWJhci5zZXQoICd1cGxvYWRzJywgbmV3IHdwLm1lZGlhLnZpZXcuVXBsb2FkZXJTdGF0dXMoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdHByaW9yaXR5OiAgIDQwXG5cdFx0XHR9KSApO1xuXHRcdH1cblxuXHRcdHNlbGVjdGlvbi5vbiggJ3NlbGVjdGlvbjpzaW5nbGUnLCB0aGlzLmNyZWF0ZVNpbmdsZSwgdGhpcyApO1xuXHRcdHNlbGVjdGlvbi5vbiggJ3NlbGVjdGlvbjp1bnNpbmdsZScsIHRoaXMuZGlzcG9zZVNpbmdsZSwgdGhpcyApO1xuXG5cdFx0aWYgKCBzZWxlY3Rpb24uc2luZ2xlKCkgKSB7XG5cdFx0XHR0aGlzLmNyZWF0ZVNpbmdsZSgpO1xuXHRcdH1cblx0fSxcblxuXHRjcmVhdGVTaW5nbGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzaWRlYmFyID0gdGhpcy5zaWRlYmFyLFxuXHRcdFx0c2luZ2xlID0gdGhpcy5vcHRpb25zLnNlbGVjdGlvbi5zaW5nbGUoKTtcblxuXHRcdHNpZGViYXIuc2V0KCAnZGV0YWlscycsIG5ldyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRGV0YWlscyh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRtb2RlbDogICAgICBzaW5nbGUsXG5cdFx0XHRwcmlvcml0eTogICA4MFxuXHRcdH0pICk7XG5cblx0XHRzaWRlYmFyLnNldCggJ2NvbXBhdCcsIG5ldyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRDb21wYXQoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0bW9kZWw6ICAgICAgc2luZ2xlLFxuXHRcdFx0cHJpb3JpdHk6ICAgMTIwXG5cdFx0fSkgKTtcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLmRpc3BsYXkgKSB7XG5cdFx0XHRzaWRlYmFyLnNldCggJ2Rpc3BsYXknLCBuZXcgd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheSh7XG5cdFx0XHRcdGNvbnRyb2xsZXI6ICAgdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRtb2RlbDogICAgICAgIHRoaXMubW9kZWwuZGlzcGxheSggc2luZ2xlICksXG5cdFx0XHRcdGF0dGFjaG1lbnQ6ICAgc2luZ2xlLFxuXHRcdFx0XHRwcmlvcml0eTogICAgIDE2MCxcblx0XHRcdFx0dXNlclNldHRpbmdzOiB0aGlzLm1vZGVsLmdldCgnZGlzcGxheVVzZXJTZXR0aW5ncycpXG5cdFx0XHR9KSApO1xuXHRcdH1cblxuXHRcdC8vIFNob3cgdGhlIHNpZGViYXIgb24gbW9iaWxlXG5cdFx0aWYgKCB0aGlzLm1vZGVsLmlkID09PSAnaW5zZXJ0JyApIHtcblx0XHRcdHNpZGViYXIuJGVsLmFkZENsYXNzKCAndmlzaWJsZScgKTtcblx0XHR9XG5cdH0sXG5cblx0ZGlzcG9zZVNpbmdsZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNpZGViYXIgPSB0aGlzLnNpZGViYXI7XG5cdFx0c2lkZWJhci51bnNldCgnZGV0YWlscycpO1xuXHRcdHNpZGViYXIudW5zZXQoJ2NvbXBhdCcpO1xuXHRcdHNpZGViYXIudW5zZXQoJ2Rpc3BsYXknKTtcblx0XHQvLyBIaWRlIHRoZSBzaWRlYmFyIG9uIG1vYmlsZVxuXHRcdHNpZGViYXIuJGVsLnJlbW92ZUNsYXNzKCAndmlzaWJsZScgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0YWNobWVudHNCcm93c2VyO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzLlNlbGVjdGlvblxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudHNcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEF0dGFjaG1lbnRzID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50cyxcblx0U2VsZWN0aW9uO1xuXG5TZWxlY3Rpb24gPSBBdHRhY2htZW50cy5leHRlbmQoe1xuXHRldmVudHM6IHt9LFxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdHNvcnRhYmxlOiAgIGZhbHNlLFxuXHRcdFx0cmVzaXplOiAgICAgZmFsc2UsXG5cblx0XHRcdC8vIFRoZSBzaW5nbGUgYEF0dGFjaG1lbnRgIHZpZXcgdG8gYmUgdXNlZCBpbiB0aGUgYEF0dGFjaG1lbnRzYCB2aWV3LlxuXHRcdFx0QXR0YWNobWVudFZpZXc6IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5TZWxlY3Rpb25cblx0XHR9KTtcblx0XHQvLyBDYWxsICdpbml0aWFsaXplJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzLlxuXHRcdHJldHVybiBBdHRhY2htZW50cy5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGlvbjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5CdXR0b25Hcm91cFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgJCA9IEJhY2tib25lLiQsXG5cdEJ1dHRvbkdyb3VwO1xuXG5CdXR0b25Hcm91cCA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2Jyxcblx0Y2xhc3NOYW1lOiAnYnV0dG9uLWdyb3VwIGJ1dHRvbi1sYXJnZSBtZWRpYS1idXR0b24tZ3JvdXAnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIEBtZW1iZXIge3dwLm1lZGlhLnZpZXcuQnV0dG9uW119XG5cdFx0ICovXG5cdFx0dGhpcy5idXR0b25zID0gXy5tYXAoIHRoaXMub3B0aW9ucy5idXR0b25zIHx8IFtdLCBmdW5jdGlvbiggYnV0dG9uICkge1xuXHRcdFx0aWYgKCBidXR0b24gaW5zdGFuY2VvZiBCYWNrYm9uZS5WaWV3ICkge1xuXHRcdFx0XHRyZXR1cm4gYnV0dG9uO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIG5ldyB3cC5tZWRpYS52aWV3LkJ1dHRvbiggYnV0dG9uICkucmVuZGVyKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRkZWxldGUgdGhpcy5vcHRpb25zLmJ1dHRvbnM7XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5jbGFzc2VzICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoIHRoaXMub3B0aW9ucy5jbGFzc2VzICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5CdXR0b25Hcm91cH1cblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJCggXy5wbHVjayggdGhpcy5idXR0b25zLCAnZWwnICkgKS5kZXRhY2goKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b25Hcm91cDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5CdXR0b25cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEJ1dHRvbiA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAgJ2J1dHRvbicsXG5cdGNsYXNzTmFtZTogICdtZWRpYS1idXR0b24nLFxuXHRhdHRyaWJ1dGVzOiB7IHR5cGU6ICdidXR0b24nIH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ2NsaWNrJ1xuXHR9LFxuXG5cdGRlZmF1bHRzOiB7XG5cdFx0dGV4dDogICAgICcnLFxuXHRcdHN0eWxlOiAgICAnJyxcblx0XHRzaXplOiAgICAgJ2xhcmdlJyxcblx0XHRkaXNhYmxlZDogZmFsc2Vcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvKipcblx0XHQgKiBDcmVhdGUgYSBtb2RlbCB3aXRoIHRoZSBwcm92aWRlZCBgZGVmYXVsdHNgLlxuXHRcdCAqXG5cdFx0ICogQG1lbWJlciB7QmFja2JvbmUuTW9kZWx9XG5cdFx0ICovXG5cdFx0dGhpcy5tb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCggdGhpcy5kZWZhdWx0cyApO1xuXG5cdFx0Ly8gSWYgYW55IG9mIHRoZSBgb3B0aW9uc2AgaGF2ZSBhIGtleSBmcm9tIGBkZWZhdWx0c2AsIGFwcGx5IGl0c1xuXHRcdC8vIHZhbHVlIHRvIHRoZSBgbW9kZWxgIGFuZCByZW1vdmUgaXQgZnJvbSB0aGUgYG9wdGlvbnMgb2JqZWN0LlxuXHRcdF8uZWFjaCggdGhpcy5kZWZhdWx0cywgZnVuY3Rpb24oIGRlZiwga2V5ICkge1xuXHRcdFx0dmFyIHZhbHVlID0gdGhpcy5vcHRpb25zWyBrZXkgXTtcblx0XHRcdGlmICggXy5pc1VuZGVmaW5lZCggdmFsdWUgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm1vZGVsLnNldCgga2V5LCB2YWx1ZSApO1xuXHRcdFx0ZGVsZXRlIHRoaXMub3B0aW9uc1sga2V5IF07XG5cdFx0fSwgdGhpcyApO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5CdXR0b259IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gWyAnYnV0dG9uJywgdGhpcy5jbGFzc05hbWUgXSxcblx0XHRcdG1vZGVsID0gdGhpcy5tb2RlbC50b0pTT04oKTtcblxuXHRcdGlmICggbW9kZWwuc3R5bGUgKSB7XG5cdFx0XHRjbGFzc2VzLnB1c2goICdidXR0b24tJyArIG1vZGVsLnN0eWxlICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBtb2RlbC5zaXplICkge1xuXHRcdFx0Y2xhc3Nlcy5wdXNoKCAnYnV0dG9uLScgKyBtb2RlbC5zaXplICk7XG5cdFx0fVxuXG5cdFx0Y2xhc3NlcyA9IF8udW5pcSggY2xhc3Nlcy5jb25jYXQoIHRoaXMub3B0aW9ucy5jbGFzc2VzICkgKTtcblx0XHR0aGlzLmVsLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpO1xuXG5cdFx0dGhpcy4kZWwuYXR0ciggJ2Rpc2FibGVkJywgbW9kZWwuZGlzYWJsZWQgKTtcblx0XHR0aGlzLiRlbC50ZXh0KCB0aGlzLm1vZGVsLmdldCgndGV4dCcpICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0Y2xpY2s6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoICcjJyA9PT0gdGhpcy5hdHRyaWJ1dGVzLmhyZWYgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5vcHRpb25zLmNsaWNrICYmICEgdGhpcy5tb2RlbC5nZXQoJ2Rpc2FibGVkJykgKSB7XG5cdFx0XHR0aGlzLm9wdGlvbnMuY2xpY2suYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkNyb3BwZXJcbiAqXG4gKiBVc2VzIHRoZSBpbWdBcmVhU2VsZWN0IHBsdWdpbiB0byBhbGxvdyBhIHVzZXIgdG8gY3JvcCBhbiBpbWFnZS5cbiAqXG4gKiBUYWtlcyBpbWdBcmVhU2VsZWN0IG9wdGlvbnMgZnJvbVxuICogd3AuY3VzdG9taXplLkhlYWRlckNvbnRyb2wuY2FsY3VsYXRlSW1hZ2VTZWxlY3RPcHRpb25zIHZpYVxuICogd3AuY3VzdG9taXplLkhlYWRlckNvbnRyb2wub3Blbk1NLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdFVwbG9hZGVyU3RhdHVzID0gd3AubWVkaWEudmlldy5VcGxvYWRlclN0YXR1cyxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0JCA9IGpRdWVyeSxcblx0Q3JvcHBlcjtcblxuQ3JvcHBlciA9IFZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnY3JvcC1jb250ZW50Jyxcblx0dGVtcGxhdGU6IHdwLnRlbXBsYXRlKCdjcm9wLWNvbnRlbnQnKSxcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Xy5iaW5kQWxsKHRoaXMsICdvbkltYWdlTG9hZCcpO1xuXHR9LFxuXHRyZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb250cm9sbGVyLmZyYW1lLm9uKCdjb250ZW50OmVycm9yOmNyb3AnLCB0aGlzLm9uRXJyb3IsIHRoaXMpO1xuXHRcdHRoaXMuJGltYWdlID0gdGhpcy4kZWwuZmluZCgnLmNyb3AtaW1hZ2UnKTtcblx0XHR0aGlzLiRpbWFnZS5vbignbG9hZCcsIHRoaXMub25JbWFnZUxvYWQpO1xuXHRcdCQod2luZG93KS5vbigncmVzaXplLmNyb3BwZXInLCBfLmRlYm91bmNlKHRoaXMub25JbWFnZUxvYWQsIDI1MCkpO1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdCQod2luZG93KS5vZmYoJ3Jlc2l6ZS5jcm9wcGVyJyk7XG5cdFx0dGhpcy4kZWwucmVtb3ZlKCk7XG5cdFx0dGhpcy4kZWwub2ZmKCk7XG5cdFx0Vmlldy5wcm90b3R5cGUucmVtb3ZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdH0sXG5cdHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0aXRsZTogbDEwbi5jcm9wWW91ckltYWdlLFxuXHRcdFx0dXJsOiB0aGlzLm9wdGlvbnMuYXR0YWNobWVudC5nZXQoJ3VybCcpXG5cdFx0fTtcblx0fSxcblx0b25JbWFnZUxvYWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpbWdPcHRpb25zID0gdGhpcy5jb250cm9sbGVyLmdldCgnaW1nU2VsZWN0T3B0aW9ucycpO1xuXHRcdGlmICh0eXBlb2YgaW1nT3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aW1nT3B0aW9ucyA9IGltZ09wdGlvbnModGhpcy5vcHRpb25zLmF0dGFjaG1lbnQsIHRoaXMuY29udHJvbGxlcik7XG5cdFx0fVxuXG5cdFx0aW1nT3B0aW9ucyA9IF8uZXh0ZW5kKGltZ09wdGlvbnMsIHtwYXJlbnQ6IHRoaXMuJGVsfSk7XG5cdFx0dGhpcy50cmlnZ2VyKCdpbWFnZS1sb2FkZWQnKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIuaW1nU2VsZWN0ID0gdGhpcy4kaW1hZ2UuaW1nQXJlYVNlbGVjdChpbWdPcHRpb25zKTtcblx0fSxcblx0b25FcnJvcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZpbGVuYW1lID0gdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQuZ2V0KCdmaWxlbmFtZScpO1xuXG5cdFx0dGhpcy52aWV3cy5hZGQoICcudXBsb2FkLWVycm9ycycsIG5ldyB3cC5tZWRpYS52aWV3LlVwbG9hZGVyU3RhdHVzRXJyb3Ioe1xuXHRcdFx0ZmlsZW5hbWU6IFVwbG9hZGVyU3RhdHVzLnByb3RvdHlwZS5maWxlbmFtZShmaWxlbmFtZSksXG5cdFx0XHRtZXNzYWdlOiB3aW5kb3cuX3dwTWVkaWFWaWV3c0wxMG4uY3JvcEVycm9yXG5cdFx0fSksIHsgYXQ6IDAgfSk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENyb3BwZXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuRWRpdEltYWdlXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0RWRpdEltYWdlO1xuXG5FZGl0SW1hZ2UgPSBWaWV3LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2ltYWdlLWVkaXRvcicsXG5cdHRlbXBsYXRlOiB3cC50ZW1wbGF0ZSgnaW1hZ2UtZWRpdG9yJyksXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5lZGl0b3IgPSB3aW5kb3cuaW1hZ2VFZGl0O1xuXHRcdHRoaXMuY29udHJvbGxlciA9IG9wdGlvbnMuY29udHJvbGxlcjtcblx0XHRWaWV3LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRwcmVwYXJlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5tb2RlbC50b0pTT04oKTtcblx0fSxcblxuXHRsb2FkRWRpdG9yOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZGZkID0gdGhpcy5lZGl0b3Iub3BlbiggdGhpcy5tb2RlbC5nZXQoJ2lkJyksIHRoaXMubW9kZWwuZ2V0KCdub25jZXMnKS5lZGl0LCB0aGlzICk7XG5cdFx0ZGZkLmRvbmUoIF8uYmluZCggdGhpcy5mb2N1cywgdGhpcyApICk7XG5cdH0sXG5cblx0Zm9jdXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJCggJy5pbWdlZGl0LXN1Ym1pdCAuYnV0dG9uJyApLmVxKCAwICkuZm9jdXMoKTtcblx0fSxcblxuXHRiYWNrOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGFzdFN0YXRlID0gdGhpcy5jb250cm9sbGVyLmxhc3RTdGF0ZSgpO1xuXHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSggbGFzdFN0YXRlICk7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5tb2RlbC5mZXRjaCgpO1xuXHR9LFxuXG5cdHNhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsYXN0U3RhdGUgPSB0aGlzLmNvbnRyb2xsZXIubGFzdFN0YXRlKCk7XG5cblx0XHR0aGlzLm1vZGVsLmZldGNoKCkuZG9uZSggXy5iaW5kKCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSggbGFzdFN0YXRlICk7XG5cdFx0fSwgdGhpcyApICk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdEltYWdlO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkVtYmVkXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBFbWJlZCA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnbWVkaWEtZW1iZWQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIEBtZW1iZXIge3dwLm1lZGlhLnZpZXcuRW1iZWRVcmx9XG5cdFx0ICovXG5cdFx0dGhpcy51cmwgPSBuZXcgd3AubWVkaWEudmlldy5FbWJlZFVybCh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRtb2RlbDogICAgICB0aGlzLm1vZGVsLnByb3BzXG5cdFx0fSkucmVuZGVyKCk7XG5cblx0XHR0aGlzLnZpZXdzLnNldChbIHRoaXMudXJsIF0pO1xuXHRcdHRoaXMucmVmcmVzaCgpO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6dHlwZScsIHRoaXMucmVmcmVzaCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6bG9hZGluZycsIHRoaXMubG9hZGluZyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gdmlld1xuXHQgKi9cblx0c2V0dGluZ3M6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdGlmICggdGhpcy5fc2V0dGluZ3MgKSB7XG5cdFx0XHR0aGlzLl9zZXR0aW5ncy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0dGhpcy5fc2V0dGluZ3MgPSB2aWV3O1xuXHRcdHRoaXMudmlld3MuYWRkKCB2aWV3ICk7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHR5cGUgPSB0aGlzLm1vZGVsLmdldCgndHlwZScpLFxuXHRcdFx0Y29uc3RydWN0b3I7XG5cblx0XHRpZiAoICdpbWFnZScgPT09IHR5cGUgKSB7XG5cdFx0XHRjb25zdHJ1Y3RvciA9IHdwLm1lZGlhLnZpZXcuRW1iZWRJbWFnZTtcblx0XHR9IGVsc2UgaWYgKCAnbGluaycgPT09IHR5cGUgKSB7XG5cdFx0XHRjb25zdHJ1Y3RvciA9IHdwLm1lZGlhLnZpZXcuRW1iZWRMaW5rO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXR0aW5ncyggbmV3IGNvbnN0cnVjdG9yKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuY29udHJvbGxlcixcblx0XHRcdG1vZGVsOiAgICAgIHRoaXMubW9kZWwucHJvcHMsXG5cdFx0XHRwcmlvcml0eTogICA0MFxuXHRcdH0pICk7XG5cdH0sXG5cblx0bG9hZGluZzogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdlbWJlZC1sb2FkaW5nJywgdGhpcy5tb2RlbC5nZXQoJ2xvYWRpbmcnKSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWJlZDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5FbWJlZEltYWdlXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEF0dGFjaG1lbnREaXNwbGF5ID0gd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheSxcblx0RW1iZWRJbWFnZTtcblxuRW1iZWRJbWFnZSA9IEF0dGFjaG1lbnREaXNwbGF5LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2VtYmVkLW1lZGlhLXNldHRpbmdzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgnZW1iZWQtaW1hZ2Utc2V0dGluZ3MnKSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvKipcblx0XHQgKiBDYWxsIGBpbml0aWFsaXplYCBkaXJlY3RseSBvbiBwYXJlbnQgY2xhc3Mgd2l0aCBwYXNzZWQgYXJndW1lbnRzXG5cdFx0ICovXG5cdFx0QXR0YWNobWVudERpc3BsYXkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6dXJsJywgdGhpcy51cGRhdGVJbWFnZSApO1xuXHR9LFxuXG5cdHVwZGF0ZUltYWdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiQoJ2ltZycpLmF0dHIoICdzcmMnLCB0aGlzLm1vZGVsLmdldCgndXJsJykgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRW1iZWRJbWFnZTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5FbWJlZExpbmtcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlNldHRpbmdzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciAkID0galF1ZXJ5LFxuXHRFbWJlZExpbms7XG5cbkVtYmVkTGluayA9IHdwLm1lZGlhLnZpZXcuU2V0dGluZ3MuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnZW1iZWQtbGluay1zZXR0aW5ncycsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ2VtYmVkLWxpbmstc2V0dGluZ3MnKSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOnVybCcsIHRoaXMudXBkYXRlb0VtYmVkICk7XG5cdH0sXG5cblx0dXBkYXRlb0VtYmVkOiBfLmRlYm91bmNlKCBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy5tb2RlbC5nZXQoICd1cmwnICk7XG5cblx0XHQvLyBjbGVhciBvdXQgcHJldmlvdXMgcmVzdWx0c1xuXHRcdHRoaXMuJCgnLmVtYmVkLWNvbnRhaW5lcicpLmhpZGUoKS5maW5kKCcuZW1iZWQtcHJldmlldycpLmVtcHR5KCk7XG5cdFx0dGhpcy4kKCAnLnNldHRpbmcnICkuaGlkZSgpO1xuXG5cdFx0Ly8gb25seSBwcm9jZWVkIHdpdGggZW1iZWQgaWYgdGhlIGZpZWxkIGNvbnRhaW5zIG1vcmUgdGhhbiAxMSBjaGFyYWN0ZXJzXG5cdFx0Ly8gRXhhbXBsZTogaHR0cDovL2EuaW8gaXMgMTEgY2hhcnNcblx0XHRpZiAoIHVybCAmJiAoIHVybC5sZW5ndGggPCAxMSB8fCAhIHVybC5tYXRjaCgvXmh0dHAocyk/OlxcL1xcLy8pICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5mZXRjaCgpO1xuXHR9LCB3cC5tZWRpYS5jb250cm9sbGVyLkVtYmVkLnNlbnNpdGl2aXR5ICksXG5cblx0ZmV0Y2g6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbWJlZDtcblxuXHRcdC8vIGNoZWNrIGlmIHRoZXkgaGF2ZW4ndCB0eXBlZCBpbiA1MDAgbXNcblx0XHRpZiAoICQoJyNlbWJlZC11cmwtZmllbGQnKS52YWwoKSAhPT0gdGhpcy5tb2RlbC5nZXQoJ3VybCcpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5kZmQgJiYgJ3BlbmRpbmcnID09PSB0aGlzLmRmZC5zdGF0ZSgpICkge1xuXHRcdFx0dGhpcy5kZmQuYWJvcnQoKTtcblx0XHR9XG5cblx0XHRlbWJlZCA9IG5ldyB3cC5zaG9ydGNvZGUoe1xuXHRcdFx0dGFnOiAnZW1iZWQnLFxuXHRcdFx0YXR0cnM6IF8ucGljayggdGhpcy5tb2RlbC5hdHRyaWJ1dGVzLCBbICd3aWR0aCcsICdoZWlnaHQnLCAnc3JjJyBdICksXG5cdFx0XHRjb250ZW50OiB0aGlzLm1vZGVsLmdldCgndXJsJylcblx0XHR9KTtcblxuXHRcdHRoaXMuZGZkID0gJC5hamF4KHtcblx0XHRcdHR5cGU6ICAgICdQT1NUJyxcblx0XHRcdHVybDogICAgIHdwLmFqYXguc2V0dGluZ3MudXJsLFxuXHRcdFx0Y29udGV4dDogdGhpcyxcblx0XHRcdGRhdGE6ICAgIHtcblx0XHRcdFx0YWN0aW9uOiAncGFyc2UtZW1iZWQnLFxuXHRcdFx0XHRwb3N0X0lEOiB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuaWQsXG5cdFx0XHRcdHNob3J0Y29kZTogZW1iZWQuc3RyaW5nKClcblx0XHRcdH1cblx0XHR9KVxuXHRcdFx0LmRvbmUoIHRoaXMucmVuZGVyb0VtYmVkIClcblx0XHRcdC5mYWlsKCB0aGlzLnJlbmRlckZhaWwgKTtcblx0fSxcblxuXHRyZW5kZXJGYWlsOiBmdW5jdGlvbiAoIHJlc3BvbnNlLCBzdGF0dXMgKSB7XG5cdFx0aWYgKCAnYWJvcnQnID09PSBzdGF0dXMgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuJCggJy5saW5rLXRleHQnICkuc2hvdygpO1xuXHR9LFxuXG5cdHJlbmRlcm9FbWJlZDogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdHZhciBodG1sID0gKCByZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuYm9keSApIHx8ICcnO1xuXG5cdFx0aWYgKCBodG1sICkge1xuXHRcdFx0dGhpcy4kKCcuZW1iZWQtY29udGFpbmVyJykuc2hvdygpLmZpbmQoJy5lbWJlZC1wcmV2aWV3JykuaHRtbCggaHRtbCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnJlbmRlckZhaWwoKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtYmVkTGluaztcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5FbWJlZFVybFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdCQgPSBqUXVlcnksXG5cdEVtYmVkVXJsO1xuXG5FbWJlZFVybCA9IFZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnbGFiZWwnLFxuXHRjbGFzc05hbWU6ICdlbWJlZC11cmwnLFxuXG5cdGV2ZW50czoge1xuXHRcdCdpbnB1dCc6ICAndXJsJyxcblx0XHQna2V5dXAnOiAgJ3VybCcsXG5cdFx0J2NoYW5nZSc6ICd1cmwnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kaW5wdXQgPSAkKCc8aW5wdXQgaWQ9XCJlbWJlZC11cmwtZmllbGRcIiB0eXBlPVwidXJsXCIgLz4nKS52YWwoIHRoaXMubW9kZWwuZ2V0KCd1cmwnKSApO1xuXHRcdHRoaXMuaW5wdXQgPSB0aGlzLiRpbnB1dFswXTtcblxuXHRcdHRoaXMuc3Bpbm5lciA9ICQoJzxzcGFuIGNsYXNzPVwic3Bpbm5lclwiIC8+JylbMF07XG5cdFx0dGhpcy4kZWwuYXBwZW5kKFsgdGhpcy5pbnB1dCwgdGhpcy5zcGlubmVyIF0pO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZTp1cmwnLCB0aGlzLnJlbmRlciApO1xuXG5cdFx0aWYgKCB0aGlzLm1vZGVsLmdldCggJ3VybCcgKSApIHtcblx0XHRcdF8uZGVsYXkoIF8uYmluZCggZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR0aGlzLm1vZGVsLnRyaWdnZXIoICdjaGFuZ2U6dXJsJyApO1xuXHRcdFx0fSwgdGhpcyApLCA1MDAgKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5FbWJlZFVybH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRpbnB1dCA9IHRoaXMuJGlucHV0O1xuXG5cdFx0aWYgKCAkaW5wdXQuaXMoJzpmb2N1cycpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuaW5wdXQudmFsdWUgPSB0aGlzLm1vZGVsLmdldCgndXJsJykgfHwgJ2h0dHA6Ly8nO1xuXHRcdC8qKlxuXHRcdCAqIENhbGwgYHJlbmRlcmAgZGlyZWN0bHkgb24gcGFyZW50IGNsYXNzIHdpdGggcGFzc2VkIGFyZ3VtZW50c1xuXHRcdCAqL1xuXHRcdFZpZXcucHJvdG90eXBlLnJlbmRlci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISB3cC5tZWRpYS5pc1RvdWNoRGV2aWNlICkge1xuXHRcdFx0dGhpcy5mb2N1cygpO1xuXHRcdH1cblx0fSxcblxuXHR1cmw6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR0aGlzLm1vZGVsLnNldCggJ3VybCcsIGV2ZW50LnRhcmdldC52YWx1ZSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBJZiB0aGUgaW5wdXQgaXMgdmlzaWJsZSwgZm9jdXMgYW5kIHNlbGVjdCBpdHMgY29udGVudHMuXG5cdCAqL1xuXHRmb2N1czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRpbnB1dCA9IHRoaXMuJGlucHV0O1xuXHRcdGlmICggJGlucHV0LmlzKCc6dmlzaWJsZScpICkge1xuXHRcdFx0JGlucHV0LmZvY3VzKClbMF0uc2VsZWN0KCk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWJlZFVybDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5Gb2N1c01hbmFnZXJcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEZvY3VzTWFuYWdlciA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblxuXHRldmVudHM6IHtcblx0XHQna2V5ZG93bic6ICdjb25zdHJhaW5UYWJiaW5nJ1xuXHR9LFxuXG5cdGZvY3VzOiBmdW5jdGlvbigpIHsgLy8gUmVzZXQgZm9jdXMgb24gZmlyc3QgbGVmdCBtZW51IGl0ZW1cblx0XHR0aGlzLiQoJy5tZWRpYS1tZW51LWl0ZW0nKS5maXJzdCgpLmZvY3VzKCk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdGNvbnN0cmFpblRhYmJpbmc6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgdGFiYmFibGVzO1xuXG5cdFx0Ly8gTG9vayBmb3IgdGhlIHRhYiBrZXkuXG5cdFx0aWYgKCA5ICE9PSBldmVudC5rZXlDb2RlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFNraXAgdGhlIGZpbGUgaW5wdXQgYWRkZWQgYnkgUGx1cGxvYWQuXG5cdFx0dGFiYmFibGVzID0gdGhpcy4kKCAnOnRhYmJhYmxlJyApLm5vdCggJy5tb3hpZS1zaGltIGlucHV0W3R5cGU9XCJmaWxlXCJdJyApO1xuXG5cdFx0Ly8gS2VlcCB0YWIgZm9jdXMgd2l0aGluIG1lZGlhIG1vZGFsIHdoaWxlIGl0J3Mgb3BlblxuXHRcdGlmICggdGFiYmFibGVzLmxhc3QoKVswXSA9PT0gZXZlbnQudGFyZ2V0ICYmICEgZXZlbnQuc2hpZnRLZXkgKSB7XG5cdFx0XHR0YWJiYWJsZXMuZmlyc3QoKS5mb2N1cygpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gZWxzZSBpZiAoIHRhYmJhYmxlcy5maXJzdCgpWzBdID09PSBldmVudC50YXJnZXQgJiYgZXZlbnQuc2hpZnRLZXkgKSB7XG5cdFx0XHR0YWJiYWJsZXMubGFzdCgpLmZvY3VzKCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvY3VzTWFuYWdlcjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5GcmFtZVxuICpcbiAqIEEgZnJhbWUgaXMgYSBjb21wb3NpdGUgdmlldyBjb25zaXN0aW5nIG9mIG9uZSBvciBtb3JlIHJlZ2lvbnMgYW5kIG9uZSBvciBtb3JlXG4gKiBzdGF0ZXMuXG4gKlxuICogQHNlZSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAc2VlIHdwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKiBAbWl4ZXMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmVcbiAqL1xudmFyIEZyYW1lID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdG1vZGU6IFsgJ3NlbGVjdCcgXVxuXHRcdH0pO1xuXHRcdHRoaXMuX2NyZWF0ZVJlZ2lvbnMoKTtcblx0XHR0aGlzLl9jcmVhdGVTdGF0ZXMoKTtcblx0XHR0aGlzLl9jcmVhdGVNb2RlcygpO1xuXHR9LFxuXG5cdF9jcmVhdGVSZWdpb25zOiBmdW5jdGlvbigpIHtcblx0XHQvLyBDbG9uZSB0aGUgcmVnaW9ucyBhcnJheS5cblx0XHR0aGlzLnJlZ2lvbnMgPSB0aGlzLnJlZ2lvbnMgPyB0aGlzLnJlZ2lvbnMuc2xpY2UoKSA6IFtdO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSByZWdpb25zLlxuXHRcdF8uZWFjaCggdGhpcy5yZWdpb25zLCBmdW5jdGlvbiggcmVnaW9uICkge1xuXHRcdFx0dGhpc1sgcmVnaW9uIF0gPSBuZXcgd3AubWVkaWEuY29udHJvbGxlci5SZWdpb24oe1xuXHRcdFx0XHR2aWV3OiAgICAgdGhpcyxcblx0XHRcdFx0aWQ6ICAgICAgIHJlZ2lvbixcblx0XHRcdFx0c2VsZWN0b3I6ICcubWVkaWEtZnJhbWUtJyArIHJlZ2lvblxuXHRcdFx0fSk7XG5cdFx0fSwgdGhpcyApO1xuXHR9LFxuXHQvKipcblx0ICogQ3JlYXRlIHRoZSBmcmFtZSdzIHN0YXRlcy5cblx0ICpcblx0ICogQHNlZSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG5cdCAqIEBzZWUgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmVcblx0ICpcblx0ICogQGZpcmVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUjcmVhZHlcblx0ICovXG5cdF9jcmVhdGVTdGF0ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIENyZWF0ZSB0aGUgZGVmYXVsdCBgc3RhdGVzYCBjb2xsZWN0aW9uLlxuXHRcdHRoaXMuc3RhdGVzID0gbmV3IEJhY2tib25lLkNvbGxlY3Rpb24oIG51bGwsIHtcblx0XHRcdG1vZGVsOiB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG5cdFx0fSk7XG5cblx0XHQvLyBFbnN1cmUgc3RhdGVzIGhhdmUgYSByZWZlcmVuY2UgdG8gdGhlIGZyYW1lLlxuXHRcdHRoaXMuc3RhdGVzLm9uKCAnYWRkJywgZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdFx0bW9kZWwuZnJhbWUgPSB0aGlzO1xuXHRcdFx0bW9kZWwudHJpZ2dlcigncmVhZHknKTtcblx0XHR9LCB0aGlzICk7XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zdGF0ZXMgKSB7XG5cdFx0XHR0aGlzLnN0YXRlcy5hZGQoIHRoaXMub3B0aW9ucy5zdGF0ZXMgKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgZnJhbWUgY2FuIGJlIGluIGEgbW9kZSBvciBtdWx0aXBsZSBtb2RlcyBhdCBvbmUgdGltZS5cblx0ICpcblx0ICogRm9yIGV4YW1wbGUsIHRoZSBtYW5hZ2UgbWVkaWEgZnJhbWUgY2FuIGJlIGluIHRoZSBgQnVsayBTZWxlY3RgIG9yIGBFZGl0YCBtb2RlLlxuXHQgKi9cblx0X2NyZWF0ZU1vZGVzOiBmdW5jdGlvbigpIHtcblx0XHQvLyBTdG9yZSBhY3RpdmUgXCJtb2Rlc1wiIHRoYXQgdGhlIGZyYW1lIGlzIGluLiBVbnJlbGF0ZWQgdG8gcmVnaW9uIG1vZGVzLlxuXHRcdHRoaXMuYWN0aXZlTW9kZXMgPSBuZXcgQmFja2JvbmUuQ29sbGVjdGlvbigpO1xuXHRcdHRoaXMuYWN0aXZlTW9kZXMub24oICdhZGQgcmVtb3ZlIHJlc2V0JywgXy5iaW5kKCB0aGlzLnRyaWdnZXJNb2RlRXZlbnRzLCB0aGlzICkgKTtcblxuXHRcdF8uZWFjaCggdGhpcy5vcHRpb25zLm1vZGUsIGZ1bmN0aW9uKCBtb2RlICkge1xuXHRcdFx0dGhpcy5hY3RpdmF0ZU1vZGUoIG1vZGUgKTtcblx0XHR9LCB0aGlzICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBSZXNldCBhbGwgc3RhdGVzIG9uIHRoZSBmcmFtZSB0byB0aGVpciBkZWZhdWx0cy5cblx0ICpcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuRnJhbWV9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZXNldDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zdGF0ZXMuaW52b2tlKCAndHJpZ2dlcicsICdyZXNldCcgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIE1hcCBhY3RpdmVNb2RlIGNvbGxlY3Rpb24gZXZlbnRzIHRvIHRoZSBmcmFtZS5cblx0ICovXG5cdHRyaWdnZXJNb2RlRXZlbnRzOiBmdW5jdGlvbiggbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMgKSB7XG5cdFx0dmFyIGNvbGxlY3Rpb25FdmVudCxcblx0XHRcdG1vZGVFdmVudE1hcCA9IHtcblx0XHRcdFx0YWRkOiAnYWN0aXZhdGUnLFxuXHRcdFx0XHRyZW1vdmU6ICdkZWFjdGl2YXRlJ1xuXHRcdFx0fSxcblx0XHRcdGV2ZW50VG9UcmlnZ2VyO1xuXHRcdC8vIFByb2JhYmx5IGEgYmV0dGVyIHdheSB0byBkbyB0aGlzLlxuXHRcdF8uZWFjaCggb3B0aW9ucywgZnVuY3Rpb24oIHZhbHVlLCBrZXkgKSB7XG5cdFx0XHRpZiAoIHZhbHVlICkge1xuXHRcdFx0XHRjb2xsZWN0aW9uRXZlbnQgPSBrZXk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0aWYgKCAhIF8uaGFzKCBtb2RlRXZlbnRNYXAsIGNvbGxlY3Rpb25FdmVudCApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGV2ZW50VG9UcmlnZ2VyID0gbW9kZWwuZ2V0KCdpZCcpICsgJzonICsgbW9kZUV2ZW50TWFwW2NvbGxlY3Rpb25FdmVudF07XG5cdFx0dGhpcy50cmlnZ2VyKCBldmVudFRvVHJpZ2dlciApO1xuXHR9LFxuXHQvKipcblx0ICogQWN0aXZhdGUgYSBtb2RlIG9uIHRoZSBmcmFtZS5cblx0ICpcblx0ICogQHBhcmFtIHN0cmluZyBtb2RlIE1vZGUgSUQuXG5cdCAqIEByZXR1cm5zIHt0aGlzfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZy5cblx0ICovXG5cdGFjdGl2YXRlTW9kZTogZnVuY3Rpb24oIG1vZGUgKSB7XG5cdFx0Ly8gQmFpbCBpZiB0aGUgbW9kZSBpcyBhbHJlYWR5IGFjdGl2ZS5cblx0XHRpZiAoIHRoaXMuaXNNb2RlQWN0aXZlKCBtb2RlICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuYWN0aXZlTW9kZXMuYWRkKCBbIHsgaWQ6IG1vZGUgfSBdICk7XG5cdFx0Ly8gQWRkIGEgQ1NTIGNsYXNzIHRvIHRoZSBmcmFtZSBzbyBlbGVtZW50cyBjYW4gYmUgc3R5bGVkIGZvciB0aGUgbW9kZS5cblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ21vZGUtJyArIG1vZGUgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogRGVhY3RpdmF0ZSBhIG1vZGUgb24gdGhlIGZyYW1lLlxuXHQgKlxuXHQgKiBAcGFyYW0gc3RyaW5nIG1vZGUgTW9kZSBJRC5cblx0ICogQHJldHVybnMge3RoaXN9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nLlxuXHQgKi9cblx0ZGVhY3RpdmF0ZU1vZGU6IGZ1bmN0aW9uKCBtb2RlICkge1xuXHRcdC8vIEJhaWwgaWYgdGhlIG1vZGUgaXNuJ3QgYWN0aXZlLlxuXHRcdGlmICggISB0aGlzLmlzTW9kZUFjdGl2ZSggbW9kZSApICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdHRoaXMuYWN0aXZlTW9kZXMucmVtb3ZlKCB0aGlzLmFjdGl2ZU1vZGVzLndoZXJlKCB7IGlkOiBtb2RlIH0gKSApO1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnbW9kZS0nICsgbW9kZSApO1xuXHRcdC8qKlxuXHRcdCAqIEZyYW1lIG1vZGUgZGVhY3RpdmF0aW9uIGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IHRoaXMje21vZGV9OmRlYWN0aXZhdGVcblx0XHQgKi9cblx0XHR0aGlzLnRyaWdnZXIoIG1vZGUgKyAnOmRlYWN0aXZhdGUnICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIENoZWNrIGlmIGEgbW9kZSBpcyBlbmFibGVkIG9uIHRoZSBmcmFtZS5cblx0ICpcblx0ICogQHBhcmFtICBzdHJpbmcgbW9kZSBNb2RlIElELlxuXHQgKiBAcmV0dXJuIGJvb2xcblx0ICovXG5cdGlzTW9kZUFjdGl2ZTogZnVuY3Rpb24oIG1vZGUgKSB7XG5cdFx0cmV0dXJuIEJvb2xlYW4oIHRoaXMuYWN0aXZlTW9kZXMud2hlcmUoIHsgaWQ6IG1vZGUgfSApLmxlbmd0aCApO1xuXHR9XG59KTtcblxuLy8gTWFrZSB0aGUgYEZyYW1lYCBhIGBTdGF0ZU1hY2hpbmVgLlxuXy5leHRlbmQoIEZyYW1lLnByb3RvdHlwZSwgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmUucHJvdG90eXBlICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWU7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5JbWFnZURldGFpbHNcbiAqXG4gKiBBIG1lZGlhIGZyYW1lIGZvciBtYW5pcHVsYXRpbmcgYW4gaW1hZ2UgdGhhdCdzIGFscmVhZHkgYmVlbiBpbnNlcnRlZFxuICogaW50byBhIHBvc3QuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLlNlbGVjdFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuRnJhbWVcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqIEBtaXhlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlTWFjaGluZVxuICovXG52YXIgU2VsZWN0ID0gd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLlNlbGVjdCxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0SW1hZ2VEZXRhaWxzO1xuXG5JbWFnZURldGFpbHMgPSBTZWxlY3QuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IHtcblx0XHRpZDogICAgICAnaW1hZ2UnLFxuXHRcdHVybDogICAgICcnLFxuXHRcdG1lbnU6ICAgICdpbWFnZS1kZXRhaWxzJyxcblx0XHRjb250ZW50OiAnaW1hZ2UtZGV0YWlscycsXG5cdFx0dG9vbGJhcjogJ2ltYWdlLWRldGFpbHMnLFxuXHRcdHR5cGU6ICAgICdsaW5rJyxcblx0XHR0aXRsZTogICAgbDEwbi5pbWFnZURldGFpbHNUaXRsZSxcblx0XHRwcmlvcml0eTogMTIwXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5pbWFnZSA9IG5ldyB3cC5tZWRpYS5tb2RlbC5Qb3N0SW1hZ2UoIG9wdGlvbnMubWV0YWRhdGEgKTtcblx0XHR0aGlzLm9wdGlvbnMuc2VsZWN0aW9uID0gbmV3IHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbiggdGhpcy5pbWFnZS5hdHRhY2htZW50LCB7IG11bHRpcGxlOiBmYWxzZSB9ICk7XG5cdFx0U2VsZWN0LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRiaW5kSGFuZGxlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdFNlbGVjdC5wcm90b3R5cGUuYmluZEhhbmRsZXJzLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR0aGlzLm9uKCAnbWVudTpjcmVhdGU6aW1hZ2UtZGV0YWlscycsIHRoaXMuY3JlYXRlTWVudSwgdGhpcyApO1xuXHRcdHRoaXMub24oICdjb250ZW50OmNyZWF0ZTppbWFnZS1kZXRhaWxzJywgdGhpcy5pbWFnZURldGFpbHNDb250ZW50LCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NvbnRlbnQ6cmVuZGVyOmVkaXQtaW1hZ2UnLCB0aGlzLmVkaXRJbWFnZUNvbnRlbnQsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpyZW5kZXI6aW1hZ2UtZGV0YWlscycsIHRoaXMucmVuZGVySW1hZ2VEZXRhaWxzVG9vbGJhciwgdGhpcyApO1xuXHRcdC8vIG92ZXJyaWRlIHRoZSBzZWxlY3QgdG9vbGJhclxuXHRcdHRoaXMub24oICd0b29sYmFyOnJlbmRlcjpyZXBsYWNlJywgdGhpcy5yZW5kZXJSZXBsYWNlSW1hZ2VUb29sYmFyLCB0aGlzICk7XG5cdH0sXG5cblx0Y3JlYXRlU3RhdGVzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnN0YXRlcy5hZGQoW1xuXHRcdFx0bmV3IHdwLm1lZGlhLmNvbnRyb2xsZXIuSW1hZ2VEZXRhaWxzKHtcblx0XHRcdFx0aW1hZ2U6IHRoaXMuaW1hZ2UsXG5cdFx0XHRcdGVkaXRhYmxlOiBmYWxzZVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5SZXBsYWNlSW1hZ2Uoe1xuXHRcdFx0XHRpZDogJ3JlcGxhY2UtaW1hZ2UnLFxuXHRcdFx0XHRsaWJyYXJ5OiB3cC5tZWRpYS5xdWVyeSggeyB0eXBlOiAnaW1hZ2UnIH0gKSxcblx0XHRcdFx0aW1hZ2U6IHRoaXMuaW1hZ2UsXG5cdFx0XHRcdG11bHRpcGxlOiAgZmFsc2UsXG5cdFx0XHRcdHRpdGxlOiAgICAgbDEwbi5pbWFnZVJlcGxhY2VUaXRsZSxcblx0XHRcdFx0dG9vbGJhcjogJ3JlcGxhY2UnLFxuXHRcdFx0XHRwcmlvcml0eTogIDgwLFxuXHRcdFx0XHRkaXNwbGF5U2V0dGluZ3M6IHRydWVcblx0XHRcdH0pLFxuXHRcdFx0bmV3IHdwLm1lZGlhLmNvbnRyb2xsZXIuRWRpdEltYWdlKCB7XG5cdFx0XHRcdGltYWdlOiB0aGlzLmltYWdlLFxuXHRcdFx0XHRzZWxlY3Rpb246IHRoaXMub3B0aW9ucy5zZWxlY3Rpb25cblx0XHRcdH0gKVxuXHRcdF0pO1xuXHR9LFxuXG5cdGltYWdlRGV0YWlsc0NvbnRlbnQ6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdG9wdGlvbnMudmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LkltYWdlRGV0YWlscyh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0bW9kZWw6IHRoaXMuc3RhdGUoKS5pbWFnZSxcblx0XHRcdGF0dGFjaG1lbnQ6IHRoaXMuc3RhdGUoKS5pbWFnZS5hdHRhY2htZW50XG5cdFx0fSk7XG5cdH0sXG5cblx0ZWRpdEltYWdlQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHN0YXRlID0gdGhpcy5zdGF0ZSgpLFxuXHRcdFx0bW9kZWwgPSBzdGF0ZS5nZXQoJ2ltYWdlJyksXG5cdFx0XHR2aWV3O1xuXG5cdFx0aWYgKCAhIG1vZGVsICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5FZGl0SW1hZ2UoIHsgbW9kZWw6IG1vZGVsLCBjb250cm9sbGVyOiB0aGlzIH0gKS5yZW5kZXIoKTtcblxuXHRcdHRoaXMuY29udGVudC5zZXQoIHZpZXcgKTtcblxuXHRcdC8vIGFmdGVyIGJyaW5naW5nIGluIHRoZSBmcmFtZSwgbG9hZCB0aGUgYWN0dWFsIGVkaXRvciB2aWEgYW4gYWpheCBjYWxsXG5cdFx0dmlldy5sb2FkRWRpdG9yKCk7XG5cblx0fSxcblxuXHRyZW5kZXJJbWFnZURldGFpbHNUb29sYmFyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRvb2xiYXIuc2V0KCBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRpdGVtczoge1xuXHRcdFx0XHRzZWxlY3Q6IHtcblx0XHRcdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0XHRcdHRleHQ6ICAgICBsMTBuLnVwZGF0ZSxcblx0XHRcdFx0XHRwcmlvcml0eTogODAsXG5cblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgY29udHJvbGxlciA9IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRcdFx0c3RhdGUgPSBjb250cm9sbGVyLnN0YXRlKCk7XG5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblxuXHRcdFx0XHRcdFx0Ly8gbm90IHN1cmUgaWYgd2Ugd2FudCB0byB1c2Ugd3AubWVkaWEuc3RyaW5nLmltYWdlIHdoaWNoIHdpbGwgY3JlYXRlIGEgc2hvcnRjb2RlIG9yXG5cdFx0XHRcdFx0XHQvLyBwZXJoYXBzIHdwLmh0bWwuc3RyaW5nIHRvIGF0IGxlYXN0IHRvIGJ1aWxkIHRoZSA8aW1nIC8+XG5cdFx0XHRcdFx0XHRzdGF0ZS50cmlnZ2VyKCAndXBkYXRlJywgY29udHJvbGxlci5pbWFnZS50b0pTT04oKSApO1xuXG5cdFx0XHRcdFx0XHQvLyBSZXN0b3JlIGFuZCByZXNldCB0aGUgZGVmYXVsdCBzdGF0ZS5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuc2V0U3RhdGUoIGNvbnRyb2xsZXIub3B0aW9ucy5zdGF0ZSApO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5yZXNldCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH0sXG5cblx0cmVuZGVyUmVwbGFjZUltYWdlVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZyYW1lID0gdGhpcyxcblx0XHRcdGxhc3RTdGF0ZSA9IGZyYW1lLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkO1xuXG5cdFx0dGhpcy50b29sYmFyLnNldCggbmV3IHdwLm1lZGlhLnZpZXcuVG9vbGJhcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0aXRlbXM6IHtcblx0XHRcdFx0YmFjazoge1xuXHRcdFx0XHRcdHRleHQ6ICAgICBsMTBuLmJhY2ssXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDIwLFxuXHRcdFx0XHRcdGNsaWNrOiAgICBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGlmICggcHJldmlvdXMgKSB7XG5cdFx0XHRcdFx0XHRcdGZyYW1lLnNldFN0YXRlKCBwcmV2aW91cyApO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZnJhbWUuY2xvc2UoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0cmVwbGFjZToge1xuXHRcdFx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRcdFx0dGV4dDogICAgIGwxMG4ucmVwbGFjZSxcblx0XHRcdFx0XHRwcmlvcml0eTogODAsXG5cblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgY29udHJvbGxlciA9IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRcdFx0c3RhdGUgPSBjb250cm9sbGVyLnN0YXRlKCksXG5cdFx0XHRcdFx0XHRcdHNlbGVjdGlvbiA9IHN0YXRlLmdldCggJ3NlbGVjdGlvbicgKSxcblx0XHRcdFx0XHRcdFx0YXR0YWNobWVudCA9IHNlbGVjdGlvbi5zaW5nbGUoKTtcblxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLmltYWdlLmNoYW5nZUF0dGFjaG1lbnQoIGF0dGFjaG1lbnQsIHN0YXRlLmRpc3BsYXkoIGF0dGFjaG1lbnQgKSApO1xuXG5cdFx0XHRcdFx0XHQvLyBub3Qgc3VyZSBpZiB3ZSB3YW50IHRvIHVzZSB3cC5tZWRpYS5zdHJpbmcuaW1hZ2Ugd2hpY2ggd2lsbCBjcmVhdGUgYSBzaG9ydGNvZGUgb3Jcblx0XHRcdFx0XHRcdC8vIHBlcmhhcHMgd3AuaHRtbC5zdHJpbmcgdG8gYXQgbGVhc3QgdG8gYnVpbGQgdGhlIDxpbWcgLz5cblx0XHRcdFx0XHRcdHN0YXRlLnRyaWdnZXIoICdyZXBsYWNlJywgY29udHJvbGxlci5pbWFnZS50b0pTT04oKSApO1xuXG5cdFx0XHRcdFx0XHQvLyBSZXN0b3JlIGFuZCByZXNldCB0aGUgZGVmYXVsdCBzdGF0ZS5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuc2V0U3RhdGUoIGNvbnRyb2xsZXIub3B0aW9ucy5zdGF0ZSApO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5yZXNldCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VEZXRhaWxzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuUG9zdFxuICpcbiAqIFRoZSBmcmFtZSBmb3IgbWFuaXB1bGF0aW5nIG1lZGlhIG9uIHRoZSBFZGl0IFBvc3QgcGFnZS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuU2VsZWN0XG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5GcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICogQG1peGVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lXG4gKi9cbnZhciBTZWxlY3QgPSB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuU2VsZWN0LFxuXHRMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRQb3N0O1xuXG5Qb3N0ID0gU2VsZWN0LmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY291bnRzID0ge1xuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0Y291bnQ6IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MuYXR0YWNobWVudENvdW50cy5hdWRpbyxcblx0XHRcdFx0c3RhdGU6ICdwbGF5bGlzdCdcblx0XHRcdH0sXG5cdFx0XHR2aWRlbzoge1xuXHRcdFx0XHRjb3VudDogd3AubWVkaWEudmlldy5zZXR0aW5ncy5hdHRhY2htZW50Q291bnRzLnZpZGVvLFxuXHRcdFx0XHRzdGF0ZTogJ3ZpZGVvLXBsYXlsaXN0J1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdG11bHRpcGxlOiAgdHJ1ZSxcblx0XHRcdGVkaXRpbmc6ICAgZmFsc2UsXG5cdFx0XHRzdGF0ZTogICAgJ2luc2VydCcsXG5cdFx0XHRtZXRhZGF0YTogIHt9XG5cdFx0fSk7XG5cblx0XHQvLyBDYWxsICdpbml0aWFsaXplJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzLlxuXHRcdFNlbGVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy5jcmVhdGVJZnJhbWVTdGF0ZXMoKTtcblxuXHR9LFxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgdGhlIGRlZmF1bHQgc3RhdGVzLlxuXHQgKi9cblx0Y3JlYXRlU3RhdGVzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdHRoaXMuc3RhdGVzLmFkZChbXG5cdFx0XHQvLyBNYWluIHN0YXRlcy5cblx0XHRcdG5ldyBMaWJyYXJ5KHtcblx0XHRcdFx0aWQ6ICAgICAgICAgJ2luc2VydCcsXG5cdFx0XHRcdHRpdGxlOiAgICAgIGwxMG4uaW5zZXJ0TWVkaWFUaXRsZSxcblx0XHRcdFx0cHJpb3JpdHk6ICAgMjAsXG5cdFx0XHRcdHRvb2xiYXI6ICAgICdtYWluLWluc2VydCcsXG5cdFx0XHRcdGZpbHRlcmFibGU6ICdhbGwnLFxuXHRcdFx0XHRsaWJyYXJ5OiAgICB3cC5tZWRpYS5xdWVyeSggb3B0aW9ucy5saWJyYXJ5ICksXG5cdFx0XHRcdG11bHRpcGxlOiAgIG9wdGlvbnMubXVsdGlwbGUgPyAncmVzZXQnIDogZmFsc2UsXG5cdFx0XHRcdGVkaXRhYmxlOiAgIHRydWUsXG5cblx0XHRcdFx0Ly8gSWYgdGhlIHVzZXIgaXNuJ3QgYWxsb3dlZCB0byBlZGl0IGZpZWxkcyxcblx0XHRcdFx0Ly8gY2FuIHRoZXkgc3RpbGwgZWRpdCBpdCBsb2NhbGx5P1xuXHRcdFx0XHRhbGxvd0xvY2FsRWRpdHM6IHRydWUsXG5cblx0XHRcdFx0Ly8gU2hvdyB0aGUgYXR0YWNobWVudCBkaXNwbGF5IHNldHRpbmdzLlxuXHRcdFx0XHRkaXNwbGF5U2V0dGluZ3M6IHRydWUsXG5cdFx0XHRcdC8vIFVwZGF0ZSB1c2VyIHNldHRpbmdzIHdoZW4gdXNlcnMgYWRqdXN0IHRoZVxuXHRcdFx0XHQvLyBhdHRhY2htZW50IGRpc3BsYXkgc2V0dGluZ3MuXG5cdFx0XHRcdGRpc3BsYXlVc2VyU2V0dGluZ3M6IHRydWVcblx0XHRcdH0pLFxuXG5cdFx0XHRuZXcgTGlicmFyeSh7XG5cdFx0XHRcdGlkOiAgICAgICAgICdnYWxsZXJ5Jyxcblx0XHRcdFx0dGl0bGU6ICAgICAgbDEwbi5jcmVhdGVHYWxsZXJ5VGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAgIDQwLFxuXHRcdFx0XHR0b29sYmFyOiAgICAnbWFpbi1nYWxsZXJ5Jyxcblx0XHRcdFx0ZmlsdGVyYWJsZTogJ3VwbG9hZGVkJyxcblx0XHRcdFx0bXVsdGlwbGU6ICAgJ2FkZCcsXG5cdFx0XHRcdGVkaXRhYmxlOiAgIGZhbHNlLFxuXG5cdFx0XHRcdGxpYnJhcnk6ICB3cC5tZWRpYS5xdWVyeSggXy5kZWZhdWx0cyh7XG5cdFx0XHRcdFx0dHlwZTogJ2ltYWdlJ1xuXHRcdFx0XHR9LCBvcHRpb25zLmxpYnJhcnkgKSApXG5cdFx0XHR9KSxcblxuXHRcdFx0Ly8gRW1iZWQgc3RhdGVzLlxuXHRcdFx0bmV3IHdwLm1lZGlhLmNvbnRyb2xsZXIuRW1iZWQoIHsgbWV0YWRhdGE6IG9wdGlvbnMubWV0YWRhdGEgfSApLFxuXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5FZGl0SW1hZ2UoIHsgbW9kZWw6IG9wdGlvbnMuZWRpdEltYWdlIH0gKSxcblxuXHRcdFx0Ly8gR2FsbGVyeSBzdGF0ZXMuXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5HYWxsZXJ5RWRpdCh7XG5cdFx0XHRcdGxpYnJhcnk6IG9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0XHRlZGl0aW5nOiBvcHRpb25zLmVkaXRpbmcsXG5cdFx0XHRcdG1lbnU6ICAgICdnYWxsZXJ5J1xuXHRcdFx0fSksXG5cblx0XHRcdG5ldyB3cC5tZWRpYS5jb250cm9sbGVyLkdhbGxlcnlBZGQoKSxcblxuXHRcdFx0bmV3IExpYnJhcnkoe1xuXHRcdFx0XHRpZDogICAgICAgICAncGxheWxpc3QnLFxuXHRcdFx0XHR0aXRsZTogICAgICBsMTBuLmNyZWF0ZVBsYXlsaXN0VGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAgIDYwLFxuXHRcdFx0XHR0b29sYmFyOiAgICAnbWFpbi1wbGF5bGlzdCcsXG5cdFx0XHRcdGZpbHRlcmFibGU6ICd1cGxvYWRlZCcsXG5cdFx0XHRcdG11bHRpcGxlOiAgICdhZGQnLFxuXHRcdFx0XHRlZGl0YWJsZTogICBmYWxzZSxcblxuXHRcdFx0XHRsaWJyYXJ5OiAgd3AubWVkaWEucXVlcnkoIF8uZGVmYXVsdHMoe1xuXHRcdFx0XHRcdHR5cGU6ICdhdWRpbydcblx0XHRcdFx0fSwgb3B0aW9ucy5saWJyYXJ5ICkgKVxuXHRcdFx0fSksXG5cblx0XHRcdC8vIFBsYXlsaXN0IHN0YXRlcy5cblx0XHRcdG5ldyB3cC5tZWRpYS5jb250cm9sbGVyLkNvbGxlY3Rpb25FZGl0KHtcblx0XHRcdFx0dHlwZTogJ2F1ZGlvJyxcblx0XHRcdFx0Y29sbGVjdGlvblR5cGU6ICdwbGF5bGlzdCcsXG5cdFx0XHRcdHRpdGxlOiAgICAgICAgICBsMTBuLmVkaXRQbGF5bGlzdFRpdGxlLFxuXHRcdFx0XHRTZXR0aW5nc1ZpZXc6ICAgd3AubWVkaWEudmlldy5TZXR0aW5ncy5QbGF5bGlzdCxcblx0XHRcdFx0bGlicmFyeTogICAgICAgIG9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0XHRlZGl0aW5nOiAgICAgICAgb3B0aW9ucy5lZGl0aW5nLFxuXHRcdFx0XHRtZW51OiAgICAgICAgICAgJ3BsYXlsaXN0Jyxcblx0XHRcdFx0ZHJhZ0luZm9UZXh0OiAgIGwxMG4ucGxheWxpc3REcmFnSW5mbyxcblx0XHRcdFx0ZHJhZ0luZm86ICAgICAgIGZhbHNlXG5cdFx0XHR9KSxcblxuXHRcdFx0bmV3IHdwLm1lZGlhLmNvbnRyb2xsZXIuQ29sbGVjdGlvbkFkZCh7XG5cdFx0XHRcdHR5cGU6ICdhdWRpbycsXG5cdFx0XHRcdGNvbGxlY3Rpb25UeXBlOiAncGxheWxpc3QnLFxuXHRcdFx0XHR0aXRsZTogbDEwbi5hZGRUb1BsYXlsaXN0VGl0bGVcblx0XHRcdH0pLFxuXG5cdFx0XHRuZXcgTGlicmFyeSh7XG5cdFx0XHRcdGlkOiAgICAgICAgICd2aWRlby1wbGF5bGlzdCcsXG5cdFx0XHRcdHRpdGxlOiAgICAgIGwxMG4uY3JlYXRlVmlkZW9QbGF5bGlzdFRpdGxlLFxuXHRcdFx0XHRwcmlvcml0eTogICA2MCxcblx0XHRcdFx0dG9vbGJhcjogICAgJ21haW4tdmlkZW8tcGxheWxpc3QnLFxuXHRcdFx0XHRmaWx0ZXJhYmxlOiAndXBsb2FkZWQnLFxuXHRcdFx0XHRtdWx0aXBsZTogICAnYWRkJyxcblx0XHRcdFx0ZWRpdGFibGU6ICAgZmFsc2UsXG5cblx0XHRcdFx0bGlicmFyeTogIHdwLm1lZGlhLnF1ZXJ5KCBfLmRlZmF1bHRzKHtcblx0XHRcdFx0XHR0eXBlOiAndmlkZW8nXG5cdFx0XHRcdH0sIG9wdGlvbnMubGlicmFyeSApIClcblx0XHRcdH0pLFxuXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5Db2xsZWN0aW9uRWRpdCh7XG5cdFx0XHRcdHR5cGU6ICd2aWRlbycsXG5cdFx0XHRcdGNvbGxlY3Rpb25UeXBlOiAncGxheWxpc3QnLFxuXHRcdFx0XHR0aXRsZTogICAgICAgICAgbDEwbi5lZGl0VmlkZW9QbGF5bGlzdFRpdGxlLFxuXHRcdFx0XHRTZXR0aW5nc1ZpZXc6ICAgd3AubWVkaWEudmlldy5TZXR0aW5ncy5QbGF5bGlzdCxcblx0XHRcdFx0bGlicmFyeTogICAgICAgIG9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0XHRlZGl0aW5nOiAgICAgICAgb3B0aW9ucy5lZGl0aW5nLFxuXHRcdFx0XHRtZW51OiAgICAgICAgICAgJ3ZpZGVvLXBsYXlsaXN0Jyxcblx0XHRcdFx0ZHJhZ0luZm9UZXh0OiAgIGwxMG4udmlkZW9QbGF5bGlzdERyYWdJbmZvLFxuXHRcdFx0XHRkcmFnSW5mbzogICAgICAgZmFsc2Vcblx0XHRcdH0pLFxuXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5Db2xsZWN0aW9uQWRkKHtcblx0XHRcdFx0dHlwZTogJ3ZpZGVvJyxcblx0XHRcdFx0Y29sbGVjdGlvblR5cGU6ICdwbGF5bGlzdCcsXG5cdFx0XHRcdHRpdGxlOiBsMTBuLmFkZFRvVmlkZW9QbGF5bGlzdFRpdGxlXG5cdFx0XHR9KVxuXHRcdF0pO1xuXG5cdFx0aWYgKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuZmVhdHVyZWRJbWFnZUlkICkge1xuXHRcdFx0dGhpcy5zdGF0ZXMuYWRkKCBuZXcgd3AubWVkaWEuY29udHJvbGxlci5GZWF0dXJlZEltYWdlKCkgKTtcblx0XHR9XG5cdH0sXG5cblx0YmluZEhhbmRsZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGFuZGxlcnMsIGNoZWNrQ291bnRzO1xuXG5cdFx0U2VsZWN0LnByb3RvdHlwZS5iaW5kSGFuZGxlcnMuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dGhpcy5vbiggJ2FjdGl2YXRlJywgdGhpcy5hY3RpdmF0ZSwgdGhpcyApO1xuXG5cdFx0Ly8gT25seSBib3RoZXIgY2hlY2tpbmcgbWVkaWEgdHlwZSBjb3VudHMgaWYgb25lIG9mIHRoZSBjb3VudHMgaXMgemVyb1xuXHRcdGNoZWNrQ291bnRzID0gXy5maW5kKCB0aGlzLmNvdW50cywgZnVuY3Rpb24oIHR5cGUgKSB7XG5cdFx0XHRyZXR1cm4gdHlwZS5jb3VudCA9PT0gMDtcblx0XHR9ICk7XG5cblx0XHRpZiAoIHR5cGVvZiBjaGVja0NvdW50cyAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHR0aGlzLmxpc3RlblRvKCB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50cy5hbGwsICdjaGFuZ2U6dHlwZScsIHRoaXMubWVkaWFUeXBlQ291bnRzICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5vbiggJ21lbnU6Y3JlYXRlOmdhbGxlcnknLCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnbWVudTpjcmVhdGU6cGxheWxpc3QnLCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnbWVudTpjcmVhdGU6dmlkZW8tcGxheWxpc3QnLCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6bWFpbi1pbnNlcnQnLCB0aGlzLmNyZWF0ZVRvb2xiYXIsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6bWFpbi1nYWxsZXJ5JywgdGhpcy5jcmVhdGVUb29sYmFyLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ3Rvb2xiYXI6Y3JlYXRlOm1haW4tcGxheWxpc3QnLCB0aGlzLmNyZWF0ZVRvb2xiYXIsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6bWFpbi12aWRlby1wbGF5bGlzdCcsIHRoaXMuY3JlYXRlVG9vbGJhciwgdGhpcyApO1xuXHRcdHRoaXMub24oICd0b29sYmFyOmNyZWF0ZTpmZWF0dXJlZC1pbWFnZScsIHRoaXMuZmVhdHVyZWRJbWFnZVRvb2xiYXIsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6bWFpbi1lbWJlZCcsIHRoaXMubWFpbkVtYmVkVG9vbGJhciwgdGhpcyApO1xuXG5cdFx0aGFuZGxlcnMgPSB7XG5cdFx0XHRtZW51OiB7XG5cdFx0XHRcdCdkZWZhdWx0JzogJ21haW5NZW51Jyxcblx0XHRcdFx0J2dhbGxlcnknOiAnZ2FsbGVyeU1lbnUnLFxuXHRcdFx0XHQncGxheWxpc3QnOiAncGxheWxpc3RNZW51Jyxcblx0XHRcdFx0J3ZpZGVvLXBsYXlsaXN0JzogJ3ZpZGVvUGxheWxpc3RNZW51J1xuXHRcdFx0fSxcblxuXHRcdFx0Y29udGVudDoge1xuXHRcdFx0XHQnZW1iZWQnOiAgICAgICAgICAnZW1iZWRDb250ZW50Jyxcblx0XHRcdFx0J2VkaXQtaW1hZ2UnOiAgICAgJ2VkaXRJbWFnZUNvbnRlbnQnLFxuXHRcdFx0XHQnZWRpdC1zZWxlY3Rpb24nOiAnZWRpdFNlbGVjdGlvbkNvbnRlbnQnXG5cdFx0XHR9LFxuXG5cdFx0XHR0b29sYmFyOiB7XG5cdFx0XHRcdCdtYWluLWluc2VydCc6ICAgICAgJ21haW5JbnNlcnRUb29sYmFyJyxcblx0XHRcdFx0J21haW4tZ2FsbGVyeSc6ICAgICAnbWFpbkdhbGxlcnlUb29sYmFyJyxcblx0XHRcdFx0J2dhbGxlcnktZWRpdCc6ICAgICAnZ2FsbGVyeUVkaXRUb29sYmFyJyxcblx0XHRcdFx0J2dhbGxlcnktYWRkJzogICAgICAnZ2FsbGVyeUFkZFRvb2xiYXInLFxuXHRcdFx0XHQnbWFpbi1wbGF5bGlzdCc6XHQnbWFpblBsYXlsaXN0VG9vbGJhcicsXG5cdFx0XHRcdCdwbGF5bGlzdC1lZGl0JzpcdCdwbGF5bGlzdEVkaXRUb29sYmFyJyxcblx0XHRcdFx0J3BsYXlsaXN0LWFkZCc6XHRcdCdwbGF5bGlzdEFkZFRvb2xiYXInLFxuXHRcdFx0XHQnbWFpbi12aWRlby1wbGF5bGlzdCc6ICdtYWluVmlkZW9QbGF5bGlzdFRvb2xiYXInLFxuXHRcdFx0XHQndmlkZW8tcGxheWxpc3QtZWRpdCc6ICd2aWRlb1BsYXlsaXN0RWRpdFRvb2xiYXInLFxuXHRcdFx0XHQndmlkZW8tcGxheWxpc3QtYWRkJzogJ3ZpZGVvUGxheWxpc3RBZGRUb29sYmFyJ1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRfLmVhY2goIGhhbmRsZXJzLCBmdW5jdGlvbiggcmVnaW9uSGFuZGxlcnMsIHJlZ2lvbiApIHtcblx0XHRcdF8uZWFjaCggcmVnaW9uSGFuZGxlcnMsIGZ1bmN0aW9uKCBjYWxsYmFjaywgaGFuZGxlciApIHtcblx0XHRcdFx0dGhpcy5vbiggcmVnaW9uICsgJzpyZW5kZXI6JyArIGhhbmRsZXIsIHRoaXNbIGNhbGxiYWNrIF0sIHRoaXMgKTtcblx0XHRcdH0sIHRoaXMgKTtcblx0XHR9LCB0aGlzICk7XG5cdH0sXG5cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEhpZGUgbWVudSBpdGVtcyBmb3Igc3RhdGVzIHRpZWQgdG8gcGFydGljdWxhciBtZWRpYSB0eXBlcyBpZiB0aGVyZSBhcmUgbm8gaXRlbXNcblx0XHRfLmVhY2goIHRoaXMuY291bnRzLCBmdW5jdGlvbiggdHlwZSApIHtcblx0XHRcdGlmICggdHlwZS5jb3VudCA8IDEgKSB7XG5cdFx0XHRcdHRoaXMubWVudUl0ZW1WaXNpYmlsaXR5KCB0eXBlLnN0YXRlLCAnaGlkZScgKTtcblx0XHRcdH1cblx0XHR9LCB0aGlzICk7XG5cdH0sXG5cblx0bWVkaWFUeXBlQ291bnRzOiBmdW5jdGlvbiggbW9kZWwsIGF0dHIgKSB7XG5cdFx0aWYgKCB0eXBlb2YgdGhpcy5jb3VudHNbIGF0dHIgXSAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5jb3VudHNbIGF0dHIgXS5jb3VudCA8IDEgKSB7XG5cdFx0XHR0aGlzLmNvdW50c1sgYXR0ciBdLmNvdW50Kys7XG5cdFx0XHR0aGlzLm1lbnVJdGVtVmlzaWJpbGl0eSggdGhpcy5jb3VudHNbIGF0dHIgXS5zdGF0ZSwgJ3Nob3cnICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIE1lbnVzXG5cdC8qKlxuXHQgKiBAcGFyYW0ge3dwLkJhY2tib25lLlZpZXd9IHZpZXdcblx0ICovXG5cdG1haW5NZW51OiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2aWV3LnNldCh7XG5cdFx0XHQnbGlicmFyeS1zZXBhcmF0b3InOiBuZXcgd3AubWVkaWEuVmlldyh7XG5cdFx0XHRcdGNsYXNzTmFtZTogJ3NlcGFyYXRvcicsXG5cdFx0XHRcdHByaW9yaXR5OiAxMDBcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH0sXG5cblx0bWVudUl0ZW1WaXNpYmlsaXR5OiBmdW5jdGlvbiggc3RhdGUsIHZpc2liaWxpdHkgKSB7XG5cdFx0dmFyIG1lbnUgPSB0aGlzLm1lbnUuZ2V0KCk7XG5cdFx0aWYgKCB2aXNpYmlsaXR5ID09PSAnaGlkZScgKSB7XG5cdFx0XHRtZW51LmhpZGUoIHN0YXRlICk7XG5cdFx0fSBlbHNlIGlmICggdmlzaWJpbGl0eSA9PT0gJ3Nob3cnICkge1xuXHRcdFx0bWVudS5zaG93KCBzdGF0ZSApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7d3AuQmFja2JvbmUuVmlld30gdmlld1xuXHQgKi9cblx0Z2FsbGVyeU1lbnU6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBsYXN0U3RhdGUgPSB0aGlzLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkLFxuXHRcdFx0ZnJhbWUgPSB0aGlzO1xuXG5cdFx0dmlldy5zZXQoe1xuXHRcdFx0Y2FuY2VsOiB7XG5cdFx0XHRcdHRleHQ6ICAgICBsMTBuLmNhbmNlbEdhbGxlcnlUaXRsZSxcblx0XHRcdFx0cHJpb3JpdHk6IDIwLFxuXHRcdFx0XHRjbGljazogICAgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKCBwcmV2aW91cyApIHtcblx0XHRcdFx0XHRcdGZyYW1lLnNldFN0YXRlKCBwcmV2aW91cyApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRmcmFtZS5jbG9zZSgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIEtlZXAgZm9jdXMgaW5zaWRlIG1lZGlhIG1vZGFsXG5cdFx0XHRcdFx0Ly8gYWZ0ZXIgY2FuY2VsaW5nIGEgZ2FsbGVyeVxuXHRcdFx0XHRcdHRoaXMuY29udHJvbGxlci5tb2RhbC5mb2N1c01hbmFnZXIuZm9jdXMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHNlcGFyYXRlQ2FuY2VsOiBuZXcgd3AubWVkaWEuVmlldyh7XG5cdFx0XHRcdGNsYXNzTmFtZTogJ3NlcGFyYXRvcicsXG5cdFx0XHRcdHByaW9yaXR5OiA0MFxuXHRcdFx0fSlcblx0XHR9KTtcblx0fSxcblxuXHRwbGF5bGlzdE1lbnU6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBsYXN0U3RhdGUgPSB0aGlzLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkLFxuXHRcdFx0ZnJhbWUgPSB0aGlzO1xuXG5cdFx0dmlldy5zZXQoe1xuXHRcdFx0Y2FuY2VsOiB7XG5cdFx0XHRcdHRleHQ6ICAgICBsMTBuLmNhbmNlbFBsYXlsaXN0VGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAyMCxcblx0XHRcdFx0Y2xpY2s6ICAgIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmICggcHJldmlvdXMgKSB7XG5cdFx0XHRcdFx0XHRmcmFtZS5zZXRTdGF0ZSggcHJldmlvdXMgKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZnJhbWUuY2xvc2UoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRzZXBhcmF0ZUNhbmNlbDogbmV3IHdwLm1lZGlhLlZpZXcoe1xuXHRcdFx0XHRjbGFzc05hbWU6ICdzZXBhcmF0b3InLFxuXHRcdFx0XHRwcmlvcml0eTogNDBcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH0sXG5cblx0dmlkZW9QbGF5bGlzdE1lbnU6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBsYXN0U3RhdGUgPSB0aGlzLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkLFxuXHRcdFx0ZnJhbWUgPSB0aGlzO1xuXG5cdFx0dmlldy5zZXQoe1xuXHRcdFx0Y2FuY2VsOiB7XG5cdFx0XHRcdHRleHQ6ICAgICBsMTBuLmNhbmNlbFZpZGVvUGxheWxpc3RUaXRsZSxcblx0XHRcdFx0cHJpb3JpdHk6IDIwLFxuXHRcdFx0XHRjbGljazogICAgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKCBwcmV2aW91cyApIHtcblx0XHRcdFx0XHRcdGZyYW1lLnNldFN0YXRlKCBwcmV2aW91cyApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRmcmFtZS5jbG9zZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHNlcGFyYXRlQ2FuY2VsOiBuZXcgd3AubWVkaWEuVmlldyh7XG5cdFx0XHRcdGNsYXNzTmFtZTogJ3NlcGFyYXRvcicsXG5cdFx0XHRcdHByaW9yaXR5OiA0MFxuXHRcdFx0fSlcblx0XHR9KTtcblx0fSxcblxuXHQvLyBDb250ZW50XG5cdGVtYmVkQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5FbWJlZCh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0bW9kZWw6ICAgICAgdGhpcy5zdGF0ZSgpXG5cdFx0fSkucmVuZGVyKCk7XG5cblx0XHR0aGlzLmNvbnRlbnQuc2V0KCB2aWV3ICk7XG5cblx0XHRpZiAoICEgd3AubWVkaWEuaXNUb3VjaERldmljZSApIHtcblx0XHRcdHZpZXcudXJsLmZvY3VzKCk7XG5cdFx0fVxuXHR9LFxuXG5cdGVkaXRTZWxlY3Rpb25Db250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3RhdGUgPSB0aGlzLnN0YXRlKCksXG5cdFx0XHRzZWxlY3Rpb24gPSBzdGF0ZS5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0dmlldztcblxuXHRcdHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5BdHRhY2htZW50c0Jyb3dzZXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGNvbGxlY3Rpb246IHNlbGVjdGlvbixcblx0XHRcdHNlbGVjdGlvbjogIHNlbGVjdGlvbixcblx0XHRcdG1vZGVsOiAgICAgIHN0YXRlLFxuXHRcdFx0c29ydGFibGU6ICAgdHJ1ZSxcblx0XHRcdHNlYXJjaDogICAgIGZhbHNlLFxuXHRcdFx0ZGF0ZTogICAgICAgZmFsc2UsXG5cdFx0XHRkcmFnSW5mbzogICB0cnVlLFxuXG5cdFx0XHRBdHRhY2htZW50Vmlldzogd3AubWVkaWEudmlldy5BdHRhY2htZW50cy5FZGl0U2VsZWN0aW9uXG5cdFx0fSkucmVuZGVyKCk7XG5cblx0XHR2aWV3LnRvb2xiYXIuc2V0KCAnYmFja1RvTGlicmFyeScsIHtcblx0XHRcdHRleHQ6ICAgICBsMTBuLnJldHVyblRvTGlicmFyeSxcblx0XHRcdHByaW9yaXR5OiAtMTAwLFxuXG5cdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5jb250ZW50Lm1vZGUoJ2Jyb3dzZScpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gQnJvd3NlIG91ciBsaWJyYXJ5IG9mIGF0dGFjaG1lbnRzLlxuXHRcdHRoaXMuY29udGVudC5zZXQoIHZpZXcgKTtcblxuXHRcdC8vIFRyaWdnZXIgdGhlIGNvbnRyb2xsZXIgdG8gc2V0IGZvY3VzXG5cdFx0dGhpcy50cmlnZ2VyKCAnZWRpdDpzZWxlY3Rpb24nLCB0aGlzICk7XG5cdH0sXG5cblx0ZWRpdEltYWdlQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGltYWdlID0gdGhpcy5zdGF0ZSgpLmdldCgnaW1hZ2UnKSxcblx0XHRcdHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5FZGl0SW1hZ2UoIHsgbW9kZWw6IGltYWdlLCBjb250cm9sbGVyOiB0aGlzIH0gKS5yZW5kZXIoKTtcblxuXHRcdHRoaXMuY29udGVudC5zZXQoIHZpZXcgKTtcblxuXHRcdC8vIGFmdGVyIGNyZWF0aW5nIHRoZSB3cmFwcGVyIHZpZXcsIGxvYWQgdGhlIGFjdHVhbCBlZGl0b3IgdmlhIGFuIGFqYXggY2FsbFxuXHRcdHZpZXcubG9hZEVkaXRvcigpO1xuXG5cdH0sXG5cblx0Ly8gVG9vbGJhcnNcblxuXHQvKipcblx0ICogQHBhcmFtIHt3cC5CYWNrYm9uZS5WaWV3fSB2aWV3XG5cdCAqL1xuXHRzZWxlY3Rpb25TdGF0dXNUb29sYmFyOiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgZWRpdGFibGUgPSB0aGlzLnN0YXRlKCkuZ2V0KCdlZGl0YWJsZScpO1xuXG5cdFx0dmlldy5zZXQoICdzZWxlY3Rpb24nLCBuZXcgd3AubWVkaWEudmlldy5TZWxlY3Rpb24oe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGNvbGxlY3Rpb246IHRoaXMuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0cHJpb3JpdHk6ICAgLTQwLFxuXG5cdFx0XHQvLyBJZiB0aGUgc2VsZWN0aW9uIGlzIGVkaXRhYmxlLCBwYXNzIHRoZSBjYWxsYmFjayB0b1xuXHRcdFx0Ly8gc3dpdGNoIHRoZSBjb250ZW50IG1vZGUuXG5cdFx0XHRlZGl0YWJsZTogZWRpdGFibGUgJiYgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5jb250ZW50Lm1vZGUoJ2VkaXQtc2VsZWN0aW9uJyk7XG5cdFx0XHR9XG5cdFx0fSkucmVuZGVyKCkgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHBhcmFtIHt3cC5CYWNrYm9uZS5WaWV3fSB2aWV3XG5cdCAqL1xuXHRtYWluSW5zZXJ0VG9vbGJhcjogZnVuY3Rpb24oIHZpZXcgKSB7XG5cdFx0dmFyIGNvbnRyb2xsZXIgPSB0aGlzO1xuXG5cdFx0dGhpcy5zZWxlY3Rpb25TdGF0dXNUb29sYmFyKCB2aWV3ICk7XG5cblx0XHR2aWV3LnNldCggJ2luc2VydCcsIHtcblx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRwcmlvcml0eTogODAsXG5cdFx0XHR0ZXh0OiAgICAgbDEwbi5pbnNlcnRJbnRvUG9zdCxcblx0XHRcdHJlcXVpcmVzOiB7IHNlbGVjdGlvbjogdHJ1ZSB9LFxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEBmaXJlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlI2luc2VydFxuXHRcdFx0ICovXG5cdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKSxcblx0XHRcdFx0XHRzZWxlY3Rpb24gPSBzdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xuXG5cdFx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblx0XHRcdFx0c3RhdGUudHJpZ2dlciggJ2luc2VydCcsIHNlbGVjdGlvbiApLnJlc2V0KCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7d3AuQmFja2JvbmUuVmlld30gdmlld1xuXHQgKi9cblx0bWFpbkdhbGxlcnlUb29sYmFyOiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgY29udHJvbGxlciA9IHRoaXM7XG5cblx0XHR0aGlzLnNlbGVjdGlvblN0YXR1c1Rvb2xiYXIoIHZpZXcgKTtcblxuXHRcdHZpZXcuc2V0KCAnZ2FsbGVyeScsIHtcblx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHR0ZXh0OiAgICAgbDEwbi5jcmVhdGVOZXdHYWxsZXJ5LFxuXHRcdFx0cHJpb3JpdHk6IDYwLFxuXHRcdFx0cmVxdWlyZXM6IHsgc2VsZWN0aW9uOiB0cnVlIH0sXG5cblx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHNlbGVjdGlvbiA9IGNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0XHRcdGVkaXQgPSBjb250cm9sbGVyLnN0YXRlKCdnYWxsZXJ5LWVkaXQnKSxcblx0XHRcdFx0XHRtb2RlbHMgPSBzZWxlY3Rpb24ud2hlcmUoeyB0eXBlOiAnaW1hZ2UnIH0pO1xuXG5cdFx0XHRcdGVkaXQuc2V0KCAnbGlicmFyeScsIG5ldyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24oIG1vZGVscywge1xuXHRcdFx0XHRcdHByb3BzOiAgICBzZWxlY3Rpb24ucHJvcHMudG9KU09OKCksXG5cdFx0XHRcdFx0bXVsdGlwbGU6IHRydWVcblx0XHRcdFx0fSkgKTtcblxuXHRcdFx0XHR0aGlzLmNvbnRyb2xsZXIuc2V0U3RhdGUoJ2dhbGxlcnktZWRpdCcpO1xuXG5cdFx0XHRcdC8vIEtlZXAgZm9jdXMgaW5zaWRlIG1lZGlhIG1vZGFsXG5cdFx0XHRcdC8vIGFmdGVyIGp1bXBpbmcgdG8gZ2FsbGVyeSB2aWV3XG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5tb2RhbC5mb2N1c01hbmFnZXIuZm9jdXMoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblxuXHRtYWluUGxheWxpc3RUb29sYmFyOiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgY29udHJvbGxlciA9IHRoaXM7XG5cblx0XHR0aGlzLnNlbGVjdGlvblN0YXR1c1Rvb2xiYXIoIHZpZXcgKTtcblxuXHRcdHZpZXcuc2V0KCAncGxheWxpc3QnLCB7XG5cdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0dGV4dDogICAgIGwxMG4uY3JlYXRlTmV3UGxheWxpc3QsXG5cdFx0XHRwcmlvcml0eTogMTAwLFxuXHRcdFx0cmVxdWlyZXM6IHsgc2VsZWN0aW9uOiB0cnVlIH0sXG5cblx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHNlbGVjdGlvbiA9IGNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0XHRcdGVkaXQgPSBjb250cm9sbGVyLnN0YXRlKCdwbGF5bGlzdC1lZGl0JyksXG5cdFx0XHRcdFx0bW9kZWxzID0gc2VsZWN0aW9uLndoZXJlKHsgdHlwZTogJ2F1ZGlvJyB9KTtcblxuXHRcdFx0XHRlZGl0LnNldCggJ2xpYnJhcnknLCBuZXcgd3AubWVkaWEubW9kZWwuU2VsZWN0aW9uKCBtb2RlbHMsIHtcblx0XHRcdFx0XHRwcm9wczogICAgc2VsZWN0aW9uLnByb3BzLnRvSlNPTigpLFxuXHRcdFx0XHRcdG11bHRpcGxlOiB0cnVlXG5cdFx0XHRcdH0pICk7XG5cblx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnNldFN0YXRlKCdwbGF5bGlzdC1lZGl0Jyk7XG5cblx0XHRcdFx0Ly8gS2VlcCBmb2N1cyBpbnNpZGUgbWVkaWEgbW9kYWxcblx0XHRcdFx0Ly8gYWZ0ZXIganVtcGluZyB0byBwbGF5bGlzdCB2aWV3XG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5tb2RhbC5mb2N1c01hbmFnZXIuZm9jdXMoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblxuXHRtYWluVmlkZW9QbGF5bGlzdFRvb2xiYXI6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBjb250cm9sbGVyID0gdGhpcztcblxuXHRcdHRoaXMuc2VsZWN0aW9uU3RhdHVzVG9vbGJhciggdmlldyApO1xuXG5cdFx0dmlldy5zZXQoICd2aWRlby1wbGF5bGlzdCcsIHtcblx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHR0ZXh0OiAgICAgbDEwbi5jcmVhdGVOZXdWaWRlb1BsYXlsaXN0LFxuXHRcdFx0cHJpb3JpdHk6IDEwMCxcblx0XHRcdHJlcXVpcmVzOiB7IHNlbGVjdGlvbjogdHJ1ZSB9LFxuXG5cdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBzZWxlY3Rpb24gPSBjb250cm9sbGVyLnN0YXRlKCkuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdFx0XHRlZGl0ID0gY29udHJvbGxlci5zdGF0ZSgndmlkZW8tcGxheWxpc3QtZWRpdCcpLFxuXHRcdFx0XHRcdG1vZGVscyA9IHNlbGVjdGlvbi53aGVyZSh7IHR5cGU6ICd2aWRlbycgfSk7XG5cblx0XHRcdFx0ZWRpdC5zZXQoICdsaWJyYXJ5JywgbmV3IHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbiggbW9kZWxzLCB7XG5cdFx0XHRcdFx0cHJvcHM6ICAgIHNlbGVjdGlvbi5wcm9wcy50b0pTT04oKSxcblx0XHRcdFx0XHRtdWx0aXBsZTogdHJ1ZVxuXHRcdFx0XHR9KSApO1xuXG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSgndmlkZW8tcGxheWxpc3QtZWRpdCcpO1xuXG5cdFx0XHRcdC8vIEtlZXAgZm9jdXMgaW5zaWRlIG1lZGlhIG1vZGFsXG5cdFx0XHRcdC8vIGFmdGVyIGp1bXBpbmcgdG8gdmlkZW8gcGxheWxpc3Qgdmlld1xuXHRcdFx0XHR0aGlzLmNvbnRyb2xsZXIubW9kYWwuZm9jdXNNYW5hZ2VyLmZvY3VzKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0ZmVhdHVyZWRJbWFnZVRvb2xiYXI6IGZ1bmN0aW9uKCB0b29sYmFyICkge1xuXHRcdHRoaXMuY3JlYXRlU2VsZWN0VG9vbGJhciggdG9vbGJhciwge1xuXHRcdFx0dGV4dDogIGwxMG4uc2V0RmVhdHVyZWRJbWFnZSxcblx0XHRcdHN0YXRlOiB0aGlzLm9wdGlvbnMuc3RhdGVcblx0XHR9KTtcblx0fSxcblxuXHRtYWluRW1iZWRUb29sYmFyOiBmdW5jdGlvbiggdG9vbGJhciApIHtcblx0XHR0b29sYmFyLnZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyLkVtYmVkKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXNcblx0XHR9KTtcblx0fSxcblxuXHRnYWxsZXJ5RWRpdFRvb2xiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlZGl0aW5nID0gdGhpcy5zdGF0ZSgpLmdldCgnZWRpdGluZycpO1xuXHRcdHRoaXMudG9vbGJhci5zZXQoIG5ldyB3cC5tZWRpYS52aWV3LlRvb2xiYXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGl0ZW1zOiB7XG5cdFx0XHRcdGluc2VydDoge1xuXHRcdFx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRcdFx0dGV4dDogICAgIGVkaXRpbmcgPyBsMTBuLnVwZGF0ZUdhbGxlcnkgOiBsMTBuLmluc2VydEdhbGxlcnksXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDgwLFxuXHRcdFx0XHRcdHJlcXVpcmVzOiB7IGxpYnJhcnk6IHRydWUgfSxcblxuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIEBmaXJlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlI3VwZGF0ZVxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKTtcblxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXHRcdFx0XHRcdFx0c3RhdGUudHJpZ2dlciggJ3VwZGF0ZScsIHN0YXRlLmdldCgnbGlicmFyeScpICk7XG5cblx0XHRcdFx0XHRcdC8vIFJlc3RvcmUgYW5kIHJlc2V0IHRoZSBkZWZhdWx0IHN0YXRlLlxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSggY29udHJvbGxlci5vcHRpb25zLnN0YXRlICk7XG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLnJlc2V0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHRnYWxsZXJ5QWRkVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50b29sYmFyLnNldCggbmV3IHdwLm1lZGlhLnZpZXcuVG9vbGJhcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0aXRlbXM6IHtcblx0XHRcdFx0aW5zZXJ0OiB7XG5cdFx0XHRcdFx0c3R5bGU6ICAgICdwcmltYXJ5Jyxcblx0XHRcdFx0XHR0ZXh0OiAgICAgbDEwbi5hZGRUb0dhbGxlcnksXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDgwLFxuXHRcdFx0XHRcdHJlcXVpcmVzOiB7IHNlbGVjdGlvbjogdHJ1ZSB9LFxuXG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogQGZpcmVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUjcmVzZXRcblx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgY29udHJvbGxlciA9IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRcdFx0c3RhdGUgPSBjb250cm9sbGVyLnN0YXRlKCksXG5cdFx0XHRcdFx0XHRcdGVkaXQgPSBjb250cm9sbGVyLnN0YXRlKCdnYWxsZXJ5LWVkaXQnKTtcblxuXHRcdFx0XHRcdFx0ZWRpdC5nZXQoJ2xpYnJhcnknKS5hZGQoIHN0YXRlLmdldCgnc2VsZWN0aW9uJykubW9kZWxzICk7XG5cdFx0XHRcdFx0XHRzdGF0ZS50cmlnZ2VyKCdyZXNldCcpO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSgnZ2FsbGVyeS1lZGl0Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHRwbGF5bGlzdEVkaXRUb29sYmFyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWRpdGluZyA9IHRoaXMuc3RhdGUoKS5nZXQoJ2VkaXRpbmcnKTtcblx0XHR0aGlzLnRvb2xiYXIuc2V0KCBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRpdGVtczoge1xuXHRcdFx0XHRpbnNlcnQ6IHtcblx0XHRcdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0XHRcdHRleHQ6ICAgICBlZGl0aW5nID8gbDEwbi51cGRhdGVQbGF5bGlzdCA6IGwxMG4uaW5zZXJ0UGxheWxpc3QsXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDgwLFxuXHRcdFx0XHRcdHJlcXVpcmVzOiB7IGxpYnJhcnk6IHRydWUgfSxcblxuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIEBmaXJlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlI3VwZGF0ZVxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKTtcblxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXHRcdFx0XHRcdFx0c3RhdGUudHJpZ2dlciggJ3VwZGF0ZScsIHN0YXRlLmdldCgnbGlicmFyeScpICk7XG5cblx0XHRcdFx0XHRcdC8vIFJlc3RvcmUgYW5kIHJlc2V0IHRoZSBkZWZhdWx0IHN0YXRlLlxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSggY29udHJvbGxlci5vcHRpb25zLnN0YXRlICk7XG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLnJlc2V0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHRwbGF5bGlzdEFkZFRvb2xiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudG9vbGJhci5zZXQoIG5ldyB3cC5tZWRpYS52aWV3LlRvb2xiYXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGl0ZW1zOiB7XG5cdFx0XHRcdGluc2VydDoge1xuXHRcdFx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRcdFx0dGV4dDogICAgIGwxMG4uYWRkVG9QbGF5bGlzdCxcblx0XHRcdFx0XHRwcmlvcml0eTogODAsXG5cdFx0XHRcdFx0cmVxdWlyZXM6IHsgc2VsZWN0aW9uOiB0cnVlIH0sXG5cblx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHQgKiBAZmlyZXMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZSNyZXNldFxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKSxcblx0XHRcdFx0XHRcdFx0ZWRpdCA9IGNvbnRyb2xsZXIuc3RhdGUoJ3BsYXlsaXN0LWVkaXQnKTtcblxuXHRcdFx0XHRcdFx0ZWRpdC5nZXQoJ2xpYnJhcnknKS5hZGQoIHN0YXRlLmdldCgnc2VsZWN0aW9uJykubW9kZWxzICk7XG5cdFx0XHRcdFx0XHRzdGF0ZS50cmlnZ2VyKCdyZXNldCcpO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSgncGxheWxpc3QtZWRpdCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH0sXG5cblx0dmlkZW9QbGF5bGlzdEVkaXRUb29sYmFyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWRpdGluZyA9IHRoaXMuc3RhdGUoKS5nZXQoJ2VkaXRpbmcnKTtcblx0XHR0aGlzLnRvb2xiYXIuc2V0KCBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRpdGVtczoge1xuXHRcdFx0XHRpbnNlcnQ6IHtcblx0XHRcdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0XHRcdHRleHQ6ICAgICBlZGl0aW5nID8gbDEwbi51cGRhdGVWaWRlb1BsYXlsaXN0IDogbDEwbi5pbnNlcnRWaWRlb1BsYXlsaXN0LFxuXHRcdFx0XHRcdHByaW9yaXR5OiAxNDAsXG5cdFx0XHRcdFx0cmVxdWlyZXM6IHsgbGlicmFyeTogdHJ1ZSB9LFxuXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIGNvbnRyb2xsZXIgPSB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdFx0XHRcdHN0YXRlID0gY29udHJvbGxlci5zdGF0ZSgpLFxuXHRcdFx0XHRcdFx0XHRsaWJyYXJ5ID0gc3RhdGUuZ2V0KCdsaWJyYXJ5Jyk7XG5cblx0XHRcdFx0XHRcdGxpYnJhcnkudHlwZSA9ICd2aWRlbyc7XG5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblx0XHRcdFx0XHRcdHN0YXRlLnRyaWdnZXIoICd1cGRhdGUnLCBsaWJyYXJ5ICk7XG5cblx0XHRcdFx0XHRcdC8vIFJlc3RvcmUgYW5kIHJlc2V0IHRoZSBkZWZhdWx0IHN0YXRlLlxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSggY29udHJvbGxlci5vcHRpb25zLnN0YXRlICk7XG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLnJlc2V0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHR2aWRlb1BsYXlsaXN0QWRkVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50b29sYmFyLnNldCggbmV3IHdwLm1lZGlhLnZpZXcuVG9vbGJhcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0aXRlbXM6IHtcblx0XHRcdFx0aW5zZXJ0OiB7XG5cdFx0XHRcdFx0c3R5bGU6ICAgICdwcmltYXJ5Jyxcblx0XHRcdFx0XHR0ZXh0OiAgICAgbDEwbi5hZGRUb1ZpZGVvUGxheWxpc3QsXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDE0MCxcblx0XHRcdFx0XHRyZXF1aXJlczogeyBzZWxlY3Rpb246IHRydWUgfSxcblxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKSxcblx0XHRcdFx0XHRcdFx0ZWRpdCA9IGNvbnRyb2xsZXIuc3RhdGUoJ3ZpZGVvLXBsYXlsaXN0LWVkaXQnKTtcblxuXHRcdFx0XHRcdFx0ZWRpdC5nZXQoJ2xpYnJhcnknKS5hZGQoIHN0YXRlLmdldCgnc2VsZWN0aW9uJykubW9kZWxzICk7XG5cdFx0XHRcdFx0XHRzdGF0ZS50cmlnZ2VyKCdyZXNldCcpO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSgndmlkZW8tcGxheWxpc3QtZWRpdCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvc3Q7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5TZWxlY3RcbiAqXG4gKiBBIGZyYW1lIGZvciBzZWxlY3RpbmcgYW4gaXRlbSBvciBpdGVtcyBmcm9tIHRoZSBtZWRpYSBsaWJyYXJ5LlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuRnJhbWVcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqIEBtaXhlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlTWFjaGluZVxuICovXG5cbnZhciBNZWRpYUZyYW1lID0gd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRTZWxlY3Q7XG5cblNlbGVjdCA9IE1lZGlhRnJhbWUuZXh0ZW5kKHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gQ2FsbCAnaW5pdGlhbGl6ZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzcy5cblx0XHRNZWRpYUZyYW1lLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0c2VsZWN0aW9uOiBbXSxcblx0XHRcdGxpYnJhcnk6ICAge30sXG5cdFx0XHRtdWx0aXBsZTogIGZhbHNlLFxuXHRcdFx0c3RhdGU6ICAgICdsaWJyYXJ5J1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5jcmVhdGVTZWxlY3Rpb24oKTtcblx0XHR0aGlzLmNyZWF0ZVN0YXRlcygpO1xuXHRcdHRoaXMuYmluZEhhbmRsZXJzKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEF0dGFjaCBhIHNlbGVjdGlvbiBjb2xsZWN0aW9uIHRvIHRoZSBmcmFtZS5cblx0ICpcblx0ICogQSBzZWxlY3Rpb24gaXMgYSBjb2xsZWN0aW9uIG9mIGF0dGFjaG1lbnRzIHVzZWQgZm9yIGEgc3BlY2lmaWMgcHVycG9zZVxuXHQgKiBieSBhIG1lZGlhIGZyYW1lLiBlLmcuIFNlbGVjdGluZyBhbiBhdHRhY2htZW50IChvciBtYW55KSB0byBpbnNlcnQgaW50b1xuXHQgKiBwb3N0IGNvbnRlbnQuXG5cdCAqXG5cdCAqIEBzZWUgbWVkaWEubW9kZWwuU2VsZWN0aW9uXG5cdCAqL1xuXHRjcmVhdGVTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uO1xuXG5cdFx0aWYgKCAhIChzZWxlY3Rpb24gaW5zdGFuY2VvZiB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24pICkge1xuXHRcdFx0dGhpcy5vcHRpb25zLnNlbGVjdGlvbiA9IG5ldyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24oIHNlbGVjdGlvbiwge1xuXHRcdFx0XHRtdWx0aXBsZTogdGhpcy5vcHRpb25zLm11bHRpcGxlXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHR0aGlzLl9zZWxlY3Rpb24gPSB7XG5cdFx0XHRhdHRhY2htZW50czogbmV3IHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzKCksXG5cdFx0XHRkaWZmZXJlbmNlOiBbXVxuXHRcdH07XG5cdH0sXG5cblx0LyoqXG5cdCAqIENyZWF0ZSB0aGUgZGVmYXVsdCBzdGF0ZXMgb24gdGhlIGZyYW1lLlxuXHQgKi9cblx0Y3JlYXRlU3RhdGVzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLnN0YXRlcyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBBZGQgdGhlIGRlZmF1bHQgc3RhdGVzLlxuXHRcdHRoaXMuc3RhdGVzLmFkZChbXG5cdFx0XHQvLyBNYWluIHN0YXRlcy5cblx0XHRcdG5ldyB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnkoe1xuXHRcdFx0XHRsaWJyYXJ5OiAgIHdwLm1lZGlhLnF1ZXJ5KCBvcHRpb25zLmxpYnJhcnkgKSxcblx0XHRcdFx0bXVsdGlwbGU6ICBvcHRpb25zLm11bHRpcGxlLFxuXHRcdFx0XHR0aXRsZTogICAgIG9wdGlvbnMudGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAgMjBcblx0XHRcdH0pXG5cdFx0XSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEJpbmQgcmVnaW9uIG1vZGUgZXZlbnQgY2FsbGJhY2tzLlxuXHQgKlxuXHQgKiBAc2VlIG1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uLnJlbmRlclxuXHQgKi9cblx0YmluZEhhbmRsZXJzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9uKCAncm91dGVyOmNyZWF0ZTpicm93c2UnLCB0aGlzLmNyZWF0ZVJvdXRlciwgdGhpcyApO1xuXHRcdHRoaXMub24oICdyb3V0ZXI6cmVuZGVyOmJyb3dzZScsIHRoaXMuYnJvd3NlUm91dGVyLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NvbnRlbnQ6Y3JlYXRlOmJyb3dzZScsIHRoaXMuYnJvd3NlQ29udGVudCwgdGhpcyApO1xuXHRcdHRoaXMub24oICdjb250ZW50OnJlbmRlcjp1cGxvYWQnLCB0aGlzLnVwbG9hZENvbnRlbnQsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6c2VsZWN0JywgdGhpcy5jcmVhdGVTZWxlY3RUb29sYmFyLCB0aGlzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlciBjYWxsYmFjayBmb3IgdGhlIHJvdXRlciByZWdpb24gaW4gdGhlIGBicm93c2VgIG1vZGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEudmlldy5Sb3V0ZXJ9IHJvdXRlclZpZXdcblx0ICovXG5cdGJyb3dzZVJvdXRlcjogZnVuY3Rpb24oIHJvdXRlclZpZXcgKSB7XG5cdFx0cm91dGVyVmlldy5zZXQoe1xuXHRcdFx0dXBsb2FkOiB7XG5cdFx0XHRcdHRleHQ6ICAgICBsMTBuLnVwbG9hZEZpbGVzVGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAyMFxuXHRcdFx0fSxcblx0XHRcdGJyb3dzZToge1xuXHRcdFx0XHR0ZXh0OiAgICAgbDEwbi5tZWRpYUxpYnJhcnlUaXRsZSxcblx0XHRcdFx0cHJpb3JpdHk6IDQwXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlciBjYWxsYmFjayBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uIGluIHRoZSBgYnJvd3NlYCBtb2RlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9ufSBjb250ZW50UmVnaW9uXG5cdCAqL1xuXHRicm93c2VDb250ZW50OiBmdW5jdGlvbiggY29udGVudFJlZ2lvbiApIHtcblx0XHR2YXIgc3RhdGUgPSB0aGlzLnN0YXRlKCk7XG5cblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcygnaGlkZS10b29sYmFyJyk7XG5cblx0XHQvLyBCcm93c2Ugb3VyIGxpYnJhcnkgb2YgYXR0YWNobWVudHMuXG5cdFx0Y29udGVudFJlZ2lvbi52aWV3ID0gbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudHNCcm93c2VyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRjb2xsZWN0aW9uOiBzdGF0ZS5nZXQoJ2xpYnJhcnknKSxcblx0XHRcdHNlbGVjdGlvbjogIHN0YXRlLmdldCgnc2VsZWN0aW9uJyksXG5cdFx0XHRtb2RlbDogICAgICBzdGF0ZSxcblx0XHRcdHNvcnRhYmxlOiAgIHN0YXRlLmdldCgnc29ydGFibGUnKSxcblx0XHRcdHNlYXJjaDogICAgIHN0YXRlLmdldCgnc2VhcmNoYWJsZScpLFxuXHRcdFx0ZmlsdGVyczogICAgc3RhdGUuZ2V0KCdmaWx0ZXJhYmxlJyksXG5cdFx0XHRkYXRlOiAgICAgICBzdGF0ZS5nZXQoJ2RhdGUnKSxcblx0XHRcdGRpc3BsYXk6ICAgIHN0YXRlLmhhcygnZGlzcGxheScpID8gc3RhdGUuZ2V0KCdkaXNwbGF5JykgOiBzdGF0ZS5nZXQoJ2Rpc3BsYXlTZXR0aW5ncycpLFxuXHRcdFx0ZHJhZ0luZm86ICAgc3RhdGUuZ2V0KCdkcmFnSW5mbycpLFxuXG5cdFx0XHRpZGVhbENvbHVtbldpZHRoOiBzdGF0ZS5nZXQoJ2lkZWFsQ29sdW1uV2lkdGgnKSxcblx0XHRcdHN1Z2dlc3RlZFdpZHRoOiAgIHN0YXRlLmdldCgnc3VnZ2VzdGVkV2lkdGgnKSxcblx0XHRcdHN1Z2dlc3RlZEhlaWdodDogIHN0YXRlLmdldCgnc3VnZ2VzdGVkSGVpZ2h0JyksXG5cblx0XHRcdEF0dGFjaG1lbnRWaWV3OiBzdGF0ZS5nZXQoJ0F0dGFjaG1lbnRWaWV3Jylcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVuZGVyIGNhbGxiYWNrIGZvciB0aGUgY29udGVudCByZWdpb24gaW4gdGhlIGB1cGxvYWRgIG1vZGUuXG5cdCAqL1xuXHR1cGxvYWRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2hpZGUtdG9vbGJhcicgKTtcblx0XHR0aGlzLmNvbnRlbnQuc2V0KCBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlcklubGluZSh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzXG5cdFx0fSkgKTtcblx0fSxcblxuXHQvKipcblx0ICogVG9vbGJhcnNcblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IHRvb2xiYXJcblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XVxuXHQgKiBAdGhpcyB3cC5tZWRpYS5jb250cm9sbGVyLlJlZ2lvblxuXHQgKi9cblx0Y3JlYXRlU2VsZWN0VG9vbGJhcjogZnVuY3Rpb24oIHRvb2xiYXIsIG9wdGlvbnMgKSB7XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwgdGhpcy5vcHRpb25zLmJ1dHRvbiB8fCB7fTtcblx0XHRvcHRpb25zLmNvbnRyb2xsZXIgPSB0aGlzO1xuXG5cdFx0dG9vbGJhci52aWV3ID0gbmV3IHdwLm1lZGlhLnZpZXcuVG9vbGJhci5TZWxlY3QoIG9wdGlvbnMgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LklmcmFtZVxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgSWZyYW1lID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdtZWRpYS1pZnJhbWUnLFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuSWZyYW1lfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnZpZXdzLmRldGFjaCgpO1xuXHRcdHRoaXMuJGVsLmh0bWwoICc8aWZyYW1lIHNyYz1cIicgKyB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NyYycpICsgJ1wiIC8+JyApO1xuXHRcdHRoaXMudmlld3MucmVuZGVyKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElmcmFtZTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5JbWFnZURldGFpbHNcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlNldHRpbmdzLkF0dGFjaG1lbnREaXNwbGF5XG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5nc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgQXR0YWNobWVudERpc3BsYXkgPSB3cC5tZWRpYS52aWV3LlNldHRpbmdzLkF0dGFjaG1lbnREaXNwbGF5LFxuXHQkID0galF1ZXJ5LFxuXHRJbWFnZURldGFpbHM7XG5cbkltYWdlRGV0YWlscyA9IEF0dGFjaG1lbnREaXNwbGF5LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2ltYWdlLWRldGFpbHMnLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCdpbWFnZS1kZXRhaWxzJyksXG5cdGV2ZW50czogXy5kZWZhdWx0cyggQXR0YWNobWVudERpc3BsYXkucHJvdG90eXBlLmV2ZW50cywge1xuXHRcdCdjbGljayAuZWRpdC1hdHRhY2htZW50JzogJ2VkaXRBdHRhY2htZW50Jyxcblx0XHQnY2xpY2sgLnJlcGxhY2UtYXR0YWNobWVudCc6ICdyZXBsYWNlQXR0YWNobWVudCcsXG5cdFx0J2NsaWNrIC5hZHZhbmNlZC10b2dnbGUnOiAnb25Ub2dnbGVBZHZhbmNlZCcsXG5cdFx0J2NoYW5nZSBbZGF0YS1zZXR0aW5nPVwiY3VzdG9tV2lkdGhcIl0nOiAnb25DdXN0b21TaXplJyxcblx0XHQnY2hhbmdlIFtkYXRhLXNldHRpbmc9XCJjdXN0b21IZWlnaHRcIl0nOiAnb25DdXN0b21TaXplJyxcblx0XHQna2V5dXAgW2RhdGEtc2V0dGluZz1cImN1c3RvbVdpZHRoXCJdJzogJ29uQ3VzdG9tU2l6ZScsXG5cdFx0J2tleXVwIFtkYXRhLXNldHRpbmc9XCJjdXN0b21IZWlnaHRcIl0nOiAnb25DdXN0b21TaXplJ1xuXHR9ICksXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHVzZWQgaW4gQXR0YWNobWVudERpc3BsYXkucHJvdG90eXBlLnVwZGF0ZUxpbmtUb1xuXHRcdHRoaXMub3B0aW9ucy5hdHRhY2htZW50ID0gdGhpcy5tb2RlbC5hdHRhY2htZW50O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6dXJsJywgdGhpcy51cGRhdGVVcmwgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOmxpbmsnLCB0aGlzLnRvZ2dsZUxpbmtTZXR0aW5ncyApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6c2l6ZScsIHRoaXMudG9nZ2xlQ3VzdG9tU2l6ZSApO1xuXG5cdFx0QXR0YWNobWVudERpc3BsYXkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhdHRhY2htZW50ID0gZmFsc2U7XG5cblx0XHRpZiAoIHRoaXMubW9kZWwuYXR0YWNobWVudCApIHtcblx0XHRcdGF0dGFjaG1lbnQgPSB0aGlzLm1vZGVsLmF0dGFjaG1lbnQudG9KU09OKCk7XG5cdFx0fVxuXHRcdHJldHVybiBfLmRlZmF1bHRzKHtcblx0XHRcdG1vZGVsOiB0aGlzLm1vZGVsLnRvSlNPTigpLFxuXHRcdFx0YXR0YWNobWVudDogYXR0YWNobWVudFxuXHRcdH0sIHRoaXMub3B0aW9ucyApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHM7XG5cblx0XHRpZiAoIHRoaXMubW9kZWwuYXR0YWNobWVudCAmJiAncGVuZGluZycgPT09IHRoaXMubW9kZWwuZGZkLnN0YXRlKCkgKSB7XG5cdFx0XHR0aGlzLm1vZGVsLmRmZFxuXHRcdFx0XHQuZG9uZSggXy5iaW5kKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRBdHRhY2htZW50RGlzcGxheS5wcm90b3R5cGUucmVuZGVyLmFwcGx5KCB0aGlzLCBhcmdzICk7XG5cdFx0XHRcdFx0dGhpcy5wb3N0UmVuZGVyKCk7XG5cdFx0XHRcdH0sIHRoaXMgKSApXG5cdFx0XHRcdC5mYWlsKCBfLmJpbmQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRoaXMubW9kZWwuYXR0YWNobWVudCA9IGZhbHNlO1xuXHRcdFx0XHRcdEF0dGFjaG1lbnREaXNwbGF5LnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcblx0XHRcdFx0XHR0aGlzLnBvc3RSZW5kZXIoKTtcblx0XHRcdFx0fSwgdGhpcyApICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdEF0dGFjaG1lbnREaXNwbGF5LnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdFx0dGhpcy5wb3N0UmVuZGVyKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cG9zdFJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0c2V0VGltZW91dCggXy5iaW5kKCB0aGlzLnJlc2V0Rm9jdXMsIHRoaXMgKSwgMTAgKTtcblx0XHR0aGlzLnRvZ2dsZUxpbmtTZXR0aW5ncygpO1xuXHRcdGlmICggd2luZG93LmdldFVzZXJTZXR0aW5nKCAnYWR2SW1nRGV0YWlscycgKSA9PT0gJ3Nob3cnICkge1xuXHRcdFx0dGhpcy50b2dnbGVBZHZhbmNlZCggdHJ1ZSApO1xuXHRcdH1cblx0XHR0aGlzLnRyaWdnZXIoICdwb3N0LXJlbmRlcicgKTtcblx0fSxcblxuXHRyZXNldEZvY3VzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiQoICcubGluay10by1jdXN0b20nICkuYmx1cigpO1xuXHRcdHRoaXMuJCggJy5lbWJlZC1tZWRpYS1zZXR0aW5ncycgKS5zY3JvbGxUb3AoIDAgKTtcblx0fSxcblxuXHR1cGRhdGVVcmw6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJCggJy5pbWFnZSBpbWcnICkuYXR0ciggJ3NyYycsIHRoaXMubW9kZWwuZ2V0KCAndXJsJyApICk7XG5cdFx0dGhpcy4kKCAnLnVybCcgKS52YWwoIHRoaXMubW9kZWwuZ2V0KCAndXJsJyApICk7XG5cdH0sXG5cblx0dG9nZ2xlTGlua1NldHRpbmdzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMubW9kZWwuZ2V0KCAnbGluaycgKSA9PT0gJ25vbmUnICkge1xuXHRcdFx0dGhpcy4kKCAnLmxpbmstc2V0dGluZ3MnICkuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiQoICcubGluay1zZXR0aW5ncycgKS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG5cdFx0fVxuXHR9LFxuXG5cdHRvZ2dsZUN1c3RvbVNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5tb2RlbC5nZXQoICdzaXplJyApICE9PSAnY3VzdG9tJyApIHtcblx0XHRcdHRoaXMuJCggJy5jdXN0b20tc2l6ZScgKS5hZGRDbGFzcygnaGlkZGVuJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJCggJy5jdXN0b20tc2l6ZScgKS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uQ3VzdG9tU2l6ZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBkaW1lbnNpb24gPSAkKCBldmVudC50YXJnZXQgKS5kYXRhKCdzZXR0aW5nJyksXG5cdFx0XHRudW0gPSAkKCBldmVudC50YXJnZXQgKS52YWwoKSxcblx0XHRcdHZhbHVlO1xuXG5cdFx0Ly8gSWdub3JlIGJvZ3VzIGlucHV0XG5cdFx0aWYgKCAhIC9eXFxkKy8udGVzdCggbnVtICkgfHwgcGFyc2VJbnQoIG51bSwgMTAgKSA8IDEgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggZGltZW5zaW9uID09PSAnY3VzdG9tV2lkdGgnICkge1xuXHRcdFx0dmFsdWUgPSBNYXRoLnJvdW5kKCAxIC8gdGhpcy5tb2RlbC5nZXQoICdhc3BlY3RSYXRpbycgKSAqIG51bSApO1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoICdjdXN0b21IZWlnaHQnLCB2YWx1ZSwgeyBzaWxlbnQ6IHRydWUgfSApO1xuXHRcdFx0dGhpcy4kKCAnW2RhdGEtc2V0dGluZz1cImN1c3RvbUhlaWdodFwiXScgKS52YWwoIHZhbHVlICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhbHVlID0gTWF0aC5yb3VuZCggdGhpcy5tb2RlbC5nZXQoICdhc3BlY3RSYXRpbycgKSAqIG51bSApO1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoICdjdXN0b21XaWR0aCcsIHZhbHVlLCB7IHNpbGVudDogdHJ1ZSAgfSApO1xuXHRcdFx0dGhpcy4kKCAnW2RhdGEtc2V0dGluZz1cImN1c3RvbVdpZHRoXCJdJyApLnZhbCggdmFsdWUgKTtcblx0XHR9XG5cdH0sXG5cblx0b25Ub2dnbGVBZHZhbmNlZDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy50b2dnbGVBZHZhbmNlZCgpO1xuXHR9LFxuXG5cdHRvZ2dsZUFkdmFuY2VkOiBmdW5jdGlvbiggc2hvdyApIHtcblx0XHR2YXIgJGFkdmFuY2VkID0gdGhpcy4kZWwuZmluZCggJy5hZHZhbmNlZC1zZWN0aW9uJyApLFxuXHRcdFx0bW9kZTtcblxuXHRcdGlmICggJGFkdmFuY2VkLmhhc0NsYXNzKCdhZHZhbmNlZC12aXNpYmxlJykgfHwgc2hvdyA9PT0gZmFsc2UgKSB7XG5cdFx0XHQkYWR2YW5jZWQucmVtb3ZlQ2xhc3MoJ2FkdmFuY2VkLXZpc2libGUnKTtcblx0XHRcdCRhZHZhbmNlZC5maW5kKCcuYWR2YW5jZWQtc2V0dGluZ3MnKS5hZGRDbGFzcygnaGlkZGVuJyk7XG5cdFx0XHRtb2RlID0gJ2hpZGUnO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkYWR2YW5jZWQuYWRkQ2xhc3MoJ2FkdmFuY2VkLXZpc2libGUnKTtcblx0XHRcdCRhZHZhbmNlZC5maW5kKCcuYWR2YW5jZWQtc2V0dGluZ3MnKS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG5cdFx0XHRtb2RlID0gJ3Nob3cnO1xuXHRcdH1cblxuXHRcdHdpbmRvdy5zZXRVc2VyU2V0dGluZyggJ2FkdkltZ0RldGFpbHMnLCBtb2RlICk7XG5cdH0sXG5cblx0ZWRpdEF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgZWRpdFN0YXRlID0gdGhpcy5jb250cm9sbGVyLnN0YXRlcy5nZXQoICdlZGl0LWltYWdlJyApO1xuXG5cdFx0aWYgKCB3aW5kb3cuaW1hZ2VFZGl0ICYmIGVkaXRTdGF0ZSApIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRlZGl0U3RhdGUuc2V0KCAnaW1hZ2UnLCB0aGlzLm1vZGVsLmF0dGFjaG1lbnQgKTtcblx0XHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSggJ2VkaXQtaW1hZ2UnICk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlcGxhY2VBdHRhY2htZW50OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIuc2V0U3RhdGUoICdyZXBsYWNlLWltYWdlJyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZURldGFpbHM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTGFiZWxcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIExhYmVsID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAnbGFiZWwnLFxuXHRjbGFzc05hbWU6ICdzY3JlZW4tcmVhZGVyLXRleHQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudmFsdWUgPSB0aGlzLm9wdGlvbnMudmFsdWU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLnZhbHVlICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGFiZWw7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZVxuICpcbiAqIFRoZSBmcmFtZSB1c2VkIHRvIGNyZWF0ZSB0aGUgbWVkaWEgbW9kYWwuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5GcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICogQG1peGVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lXG4gKi9cbnZhciBGcmFtZSA9IHdwLm1lZGlhLnZpZXcuRnJhbWUsXG5cdCQgPSBqUXVlcnksXG5cdE1lZGlhRnJhbWU7XG5cbk1lZGlhRnJhbWUgPSBGcmFtZS5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdtZWRpYS1mcmFtZScsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ21lZGlhLWZyYW1lJyksXG5cdHJlZ2lvbnM6ICAgWydtZW51JywndGl0bGUnLCdjb250ZW50JywndG9vbGJhcicsJ3JvdXRlciddLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayBkaXYubWVkaWEtZnJhbWUtdGl0bGUgaDEnOiAndG9nZ2xlTWVudSdcblx0fSxcblxuXHQvKipcblx0ICogQGdsb2JhbCB3cC5VcGxvYWRlclxuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0RnJhbWUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0Xy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLCB7XG5cdFx0XHR0aXRsZTogICAgJycsXG5cdFx0XHRtb2RhbDogICAgdHJ1ZSxcblx0XHRcdHVwbG9hZGVyOiB0cnVlXG5cdFx0fSk7XG5cblx0XHQvLyBFbnN1cmUgY29yZSBVSSBpcyBlbmFibGVkLlxuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCd3cC1jb3JlLXVpJyk7XG5cblx0XHQvLyBJbml0aWFsaXplIG1vZGFsIGNvbnRhaW5lciB2aWV3LlxuXHRcdGlmICggdGhpcy5vcHRpb25zLm1vZGFsICkge1xuXHRcdFx0dGhpcy5tb2RhbCA9IG5ldyB3cC5tZWRpYS52aWV3Lk1vZGFsKHtcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdFx0dGl0bGU6ICAgICAgdGhpcy5vcHRpb25zLnRpdGxlXG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5tb2RhbC5jb250ZW50KCB0aGlzICk7XG5cdFx0fVxuXG5cdFx0Ly8gRm9yY2UgdGhlIHVwbG9hZGVyIG9mZiBpZiB0aGUgdXBsb2FkIGxpbWl0IGhhcyBiZWVuIGV4Y2VlZGVkIG9yXG5cdFx0Ly8gaWYgdGhlIGJyb3dzZXIgaXNuJ3Qgc3VwcG9ydGVkLlxuXHRcdGlmICggd3AuVXBsb2FkZXIubGltaXRFeGNlZWRlZCB8fCAhIHdwLlVwbG9hZGVyLmJyb3dzZXIuc3VwcG9ydGVkICkge1xuXHRcdFx0dGhpcy5vcHRpb25zLnVwbG9hZGVyID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB3aW5kb3ctd2lkZSB1cGxvYWRlci5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy51cGxvYWRlciApIHtcblx0XHRcdHRoaXMudXBsb2FkZXIgPSBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlcldpbmRvdyh7XG5cdFx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRcdHVwbG9hZGVyOiB7XG5cdFx0XHRcdFx0ZHJvcHpvbmU6ICB0aGlzLm1vZGFsID8gdGhpcy5tb2RhbC4kZWwgOiB0aGlzLiRlbCxcblx0XHRcdFx0XHRjb250YWluZXI6IHRoaXMuJGVsXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0dGhpcy52aWV3cy5zZXQoICcubWVkaWEtZnJhbWUtdXBsb2FkZXInLCB0aGlzLnVwbG9hZGVyICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5vbiggJ2F0dGFjaCcsIF8uYmluZCggdGhpcy52aWV3cy5yZWFkeSwgdGhpcy52aWV3cyApLCB0aGlzICk7XG5cblx0XHQvLyBCaW5kIGRlZmF1bHQgdGl0bGUgY3JlYXRpb24uXG5cdFx0dGhpcy5vbiggJ3RpdGxlOmNyZWF0ZTpkZWZhdWx0JywgdGhpcy5jcmVhdGVUaXRsZSwgdGhpcyApO1xuXHRcdHRoaXMudGl0bGUubW9kZSgnZGVmYXVsdCcpO1xuXG5cdFx0dGhpcy5vbiggJ3RpdGxlOnJlbmRlcicsIGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdFx0dmlldy4kZWwuYXBwZW5kKCAnPHNwYW4gY2xhc3M9XCJkYXNoaWNvbnMgZGFzaGljb25zLWFycm93LWRvd25cIj48L3NwYW4+JyApO1xuXHRcdH0pO1xuXG5cdFx0Ly8gQmluZCBkZWZhdWx0IG1lbnUuXG5cdFx0dGhpcy5vbiggJ21lbnU6Y3JlYXRlOmRlZmF1bHQnLCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWV9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEFjdGl2YXRlIHRoZSBkZWZhdWx0IHN0YXRlIGlmIG5vIGFjdGl2ZSBzdGF0ZSBleGlzdHMuXG5cdFx0aWYgKCAhIHRoaXMuc3RhdGUoKSAmJiB0aGlzLm9wdGlvbnMuc3RhdGUgKSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKCB0aGlzLm9wdGlvbnMuc3RhdGUgKTtcblx0XHR9XG5cdFx0LyoqXG5cdFx0ICogY2FsbCAncmVuZGVyJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0cmV0dXJuIEZyYW1lLnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IHRpdGxlXG5cdCAqIEB0aGlzIHdwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uXG5cdCAqL1xuXHRjcmVhdGVUaXRsZTogZnVuY3Rpb24oIHRpdGxlICkge1xuXHRcdHRpdGxlLnZpZXcgPSBuZXcgd3AubWVkaWEuVmlldyh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0dGFnTmFtZTogJ2gxJ1xuXHRcdH0pO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IG1lbnVcblx0ICogQHRoaXMgd3AubWVkaWEuY29udHJvbGxlci5SZWdpb25cblx0ICovXG5cdGNyZWF0ZU1lbnU6IGZ1bmN0aW9uKCBtZW51ICkge1xuXHRcdG1lbnUudmlldyA9IG5ldyB3cC5tZWRpYS52aWV3Lk1lbnUoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpc1xuXHRcdH0pO1xuXHR9LFxuXG5cdHRvZ2dsZU1lbnU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmZpbmQoICcubWVkaWEtbWVudScgKS50b2dnbGVDbGFzcyggJ3Zpc2libGUnICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSB0b29sYmFyXG5cdCAqIEB0aGlzIHdwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uXG5cdCAqL1xuXHRjcmVhdGVUb29sYmFyOiBmdW5jdGlvbiggdG9vbGJhciApIHtcblx0XHR0b29sYmFyLnZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXNcblx0XHR9KTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSByb3V0ZXJcblx0ICogQHRoaXMgd3AubWVkaWEuY29udHJvbGxlci5SZWdpb25cblx0ICovXG5cdGNyZWF0ZVJvdXRlcjogZnVuY3Rpb24oIHJvdXRlciApIHtcblx0XHRyb3V0ZXIudmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LlJvdXRlcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzXG5cdFx0fSk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKi9cblx0Y3JlYXRlSWZyYW1lU3RhdGVzOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR2YXIgc2V0dGluZ3MgPSB3cC5tZWRpYS52aWV3LnNldHRpbmdzLFxuXHRcdFx0dGFicyA9IHNldHRpbmdzLnRhYnMsXG5cdFx0XHR0YWJVcmwgPSBzZXR0aW5ncy50YWJVcmwsXG5cdFx0XHQkcG9zdElkO1xuXG5cdFx0aWYgKCAhIHRhYnMgfHwgISB0YWJVcmwgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gQWRkIHRoZSBwb3N0IElEIHRvIHRoZSB0YWIgVVJMIGlmIGl0IGV4aXN0cy5cblx0XHQkcG9zdElkID0gJCgnI3Bvc3RfSUQnKTtcblx0XHRpZiAoICRwb3N0SWQubGVuZ3RoICkge1xuXHRcdFx0dGFiVXJsICs9ICcmcG9zdF9pZD0nICsgJHBvc3RJZC52YWwoKTtcblx0XHR9XG5cblx0XHQvLyBHZW5lcmF0ZSB0aGUgdGFiIHN0YXRlcy5cblx0XHRfLmVhY2goIHRhYnMsIGZ1bmN0aW9uKCB0aXRsZSwgaWQgKSB7XG5cdFx0XHR0aGlzLnN0YXRlKCAnaWZyYW1lOicgKyBpZCApLnNldCggXy5kZWZhdWx0cyh7XG5cdFx0XHRcdHRhYjogICAgIGlkLFxuXHRcdFx0XHRzcmM6ICAgICB0YWJVcmwgKyAnJnRhYj0nICsgaWQsXG5cdFx0XHRcdHRpdGxlOiAgIHRpdGxlLFxuXHRcdFx0XHRjb250ZW50OiAnaWZyYW1lJyxcblx0XHRcdFx0bWVudTogICAgJ2RlZmF1bHQnXG5cdFx0XHR9LCBvcHRpb25zICkgKTtcblx0XHR9LCB0aGlzICk7XG5cblx0XHR0aGlzLm9uKCAnY29udGVudDpjcmVhdGU6aWZyYW1lJywgdGhpcy5pZnJhbWVDb250ZW50LCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NvbnRlbnQ6ZGVhY3RpdmF0ZTppZnJhbWUnLCB0aGlzLmlmcmFtZUNvbnRlbnRDbGVhbnVwLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ21lbnU6cmVuZGVyOmRlZmF1bHQnLCB0aGlzLmlmcmFtZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnb3BlbicsIHRoaXMuaGlqYWNrVGhpY2tib3gsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnY2xvc2UnLCB0aGlzLnJlc3RvcmVUaGlja2JveCwgdGhpcyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gY29udGVudFxuXHQgKiBAdGhpcyB3cC5tZWRpYS5jb250cm9sbGVyLlJlZ2lvblxuXHQgKi9cblx0aWZyYW1lQ29udGVudDogZnVuY3Rpb24oIGNvbnRlbnQgKSB7XG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoJ2hpZGUtdG9vbGJhcicpO1xuXHRcdGNvbnRlbnQudmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LklmcmFtZSh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzXG5cdFx0fSk7XG5cdH0sXG5cblx0aWZyYW1lQ29udGVudENsZWFudXA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCdoaWRlLXRvb2xiYXInKTtcblx0fSxcblxuXHRpZnJhbWVNZW51OiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgdmlld3MgPSB7fTtcblxuXHRcdGlmICggISB2aWV3ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdF8uZWFjaCggd3AubWVkaWEudmlldy5zZXR0aW5ncy50YWJzLCBmdW5jdGlvbiggdGl0bGUsIGlkICkge1xuXHRcdFx0dmlld3NbICdpZnJhbWU6JyArIGlkIF0gPSB7XG5cdFx0XHRcdHRleHQ6IHRoaXMuc3RhdGUoICdpZnJhbWU6JyArIGlkICkuZ2V0KCd0aXRsZScpLFxuXHRcdFx0XHRwcmlvcml0eTogMjAwXG5cdFx0XHR9O1xuXHRcdH0sIHRoaXMgKTtcblxuXHRcdHZpZXcuc2V0KCB2aWV3cyApO1xuXHR9LFxuXG5cdGhpamFja1RoaWNrYm94OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZnJhbWUgPSB0aGlzO1xuXG5cdFx0aWYgKCAhIHdpbmRvdy50Yl9yZW1vdmUgfHwgdGhpcy5fdGJfcmVtb3ZlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX3RiX3JlbW92ZSA9IHdpbmRvdy50Yl9yZW1vdmU7XG5cdFx0d2luZG93LnRiX3JlbW92ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZnJhbWUuY2xvc2UoKTtcblx0XHRcdGZyYW1lLnJlc2V0KCk7XG5cdFx0XHRmcmFtZS5zZXRTdGF0ZSggZnJhbWUub3B0aW9ucy5zdGF0ZSApO1xuXHRcdFx0ZnJhbWUuX3RiX3JlbW92ZS5jYWxsKCB3aW5kb3cgKTtcblx0XHR9O1xuXHR9LFxuXG5cdHJlc3RvcmVUaGlja2JveDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAhIHRoaXMuX3RiX3JlbW92ZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR3aW5kb3cudGJfcmVtb3ZlID0gdGhpcy5fdGJfcmVtb3ZlO1xuXHRcdGRlbGV0ZSB0aGlzLl90Yl9yZW1vdmU7XG5cdH1cbn0pO1xuXG4vLyBNYXAgc29tZSBvZiB0aGUgbW9kYWwncyBtZXRob2RzIHRvIHRoZSBmcmFtZS5cbl8uZWFjaChbJ29wZW4nLCdjbG9zZScsJ2F0dGFjaCcsJ2RldGFjaCcsJ2VzY2FwZSddLCBmdW5jdGlvbiggbWV0aG9kICkge1xuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZX0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdE1lZGlhRnJhbWUucHJvdG90eXBlWyBtZXRob2QgXSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5tb2RhbCApIHtcblx0XHRcdHRoaXMubW9kYWxbIG1ldGhvZCBdLmFwcGx5KCB0aGlzLm1vZGFsLCBhcmd1bWVudHMgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZWRpYUZyYW1lO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lbnVJdGVtXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciAkID0galF1ZXJ5LFxuXHRNZW51SXRlbTtcblxuTWVudUl0ZW0gPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2EnLFxuXHRjbGFzc05hbWU6ICdtZWRpYS1tZW51LWl0ZW0nLFxuXG5cdGF0dHJpYnV0ZXM6IHtcblx0XHRocmVmOiAnIydcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnX2NsaWNrJ1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRfY2xpY2s6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgY2xpY2tPdmVycmlkZSA9IHRoaXMub3B0aW9ucy5jbGljaztcblxuXHRcdGlmICggZXZlbnQgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdGlmICggY2xpY2tPdmVycmlkZSApIHtcblx0XHRcdGNsaWNrT3ZlcnJpZGUuY2FsbCggdGhpcyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmNsaWNrKCk7XG5cdFx0fVxuXG5cdFx0Ly8gV2hlbiBzZWxlY3RpbmcgYSB0YWIgYWxvbmcgdGhlIGxlZnQgc2lkZSxcblx0XHQvLyBmb2N1cyBzaG91bGQgYmUgdHJhbnNmZXJyZWQgaW50byB0aGUgbWFpbiBwYW5lbFxuXHRcdGlmICggISB3cC5tZWRpYS5pc1RvdWNoRGV2aWNlICkge1xuXHRcdFx0JCgnLm1lZGlhLWZyYW1lLWNvbnRlbnQgaW5wdXQnKS5maXJzdCgpLmZvY3VzKCk7XG5cdFx0fVxuXHR9LFxuXG5cdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3RhdGUgPSB0aGlzLm9wdGlvbnMuc3RhdGU7XG5cblx0XHRpZiAoIHN0YXRlICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLnNldFN0YXRlKCBzdGF0ZSApO1xuXHRcdFx0dGhpcy52aWV3cy5wYXJlbnQuJGVsLnJlbW92ZUNsYXNzKCAndmlzaWJsZScgKTsgLy8gVE9ETzogb3IgaGlkZSBvbiBhbnkgY2xpY2ssIHNlZSBiZWxvd1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3Lk1lbnVJdGVtfSByZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdGlmICggb3B0aW9ucy50ZXh0ICkge1xuXHRcdFx0dGhpcy4kZWwudGV4dCggb3B0aW9ucy50ZXh0ICk7XG5cdFx0fSBlbHNlIGlmICggb3B0aW9ucy5odG1sICkge1xuXHRcdFx0dGhpcy4kZWwuaHRtbCggb3B0aW9ucy5odG1sICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVJdGVtO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lbnVcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgTWVudUl0ZW0gPSB3cC5tZWRpYS52aWV3Lk1lbnVJdGVtLFxuXHRQcmlvcml0eUxpc3QgPSB3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdCxcblx0TWVudTtcblxuTWVudSA9IFByaW9yaXR5TGlzdC5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdkaXYnLFxuXHRjbGFzc05hbWU6ICdtZWRpYS1tZW51Jyxcblx0cHJvcGVydHk6ICAnc3RhdGUnLFxuXHRJdGVtVmlldzogIE1lbnVJdGVtLFxuXHRyZWdpb246ICAgICdtZW51JyxcblxuXHQvKiBUT0RPOiBhbHRlcm5hdGl2ZWx5IGhpZGUgb24gYW55IGNsaWNrIGFueXdoZXJlXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdjbGljaydcblx0fSxcblxuXHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICd2aXNpYmxlJyApO1xuXHR9LFxuXHQqL1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gaWRcblx0ICogQHJldHVybnMge3dwLm1lZGlhLlZpZXd9XG5cdCAqL1xuXHR0b1ZpZXc6IGZ1bmN0aW9uKCBvcHRpb25zLCBpZCApIHtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRvcHRpb25zWyB0aGlzLnByb3BlcnR5IF0gPSBvcHRpb25zWyB0aGlzLnByb3BlcnR5IF0gfHwgaWQ7XG5cdFx0cmV0dXJuIG5ldyB0aGlzLkl0ZW1WaWV3KCBvcHRpb25zICkucmVuZGVyKCk7XG5cdH0sXG5cblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ3JlYWR5JyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0UHJpb3JpdHlMaXN0LnByb3RvdHlwZS5yZWFkeS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy52aXNpYmlsaXR5KCk7XG5cdH0sXG5cblx0c2V0OiBmdW5jdGlvbigpIHtcblx0XHQvKipcblx0XHQgKiBjYWxsICdzZXQnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3Ncblx0XHQgKi9cblx0XHRQcmlvcml0eUxpc3QucHJvdG90eXBlLnNldC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy52aXNpYmlsaXR5KCk7XG5cdH0sXG5cblx0dW5zZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ3Vuc2V0JyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0UHJpb3JpdHlMaXN0LnByb3RvdHlwZS51bnNldC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy52aXNpYmlsaXR5KCk7XG5cdH0sXG5cblx0dmlzaWJpbGl0eTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlZ2lvbiA9IHRoaXMucmVnaW9uLFxuXHRcdFx0dmlldyA9IHRoaXMuY29udHJvbGxlclsgcmVnaW9uIF0uZ2V0KCksXG5cdFx0XHR2aWV3cyA9IHRoaXMudmlld3MuZ2V0KCksXG5cdFx0XHRoaWRlID0gISB2aWV3cyB8fCB2aWV3cy5sZW5ndGggPCAyO1xuXG5cdFx0aWYgKCB0aGlzID09PSB2aWV3ICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLiRlbC50b2dnbGVDbGFzcyggJ2hpZGUtJyArIHJlZ2lvbiwgaGlkZSApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLmdldCggaWQgKTtcblxuXHRcdGlmICggISB2aWV3ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuZGVzZWxlY3QoKTtcblx0XHR2aWV3LiRlbC5hZGRDbGFzcygnYWN0aXZlJyk7XG5cdH0sXG5cblx0ZGVzZWxlY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmNoaWxkcmVuKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuXHR9LFxuXG5cdGhpZGU6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgdmlldyA9IHRoaXMuZ2V0KCBpZCApO1xuXG5cdFx0aWYgKCAhIHZpZXcgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmlldy4kZWwuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuXHR9LFxuXG5cdHNob3c6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgdmlldyA9IHRoaXMuZ2V0KCBpZCApO1xuXG5cdFx0aWYgKCAhIHZpZXcgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmlldy4kZWwucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW51O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1vZGFsXG4gKlxuICogQSBtb2RhbCB2aWV3LCB3aGljaCB0aGUgbWVkaWEgbW9kYWwgdXNlcyBhcyBpdHMgZGVmYXVsdCBjb250YWluZXIuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciAkID0galF1ZXJ5LFxuXHRNb2RhbDtcblxuTW9kYWwgPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAnZGl2Jyxcblx0dGVtcGxhdGU6IHdwLnRlbXBsYXRlKCdtZWRpYS1tb2RhbCcpLFxuXG5cdGF0dHJpYnV0ZXM6IHtcblx0XHR0YWJpbmRleDogMFxuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayAubWVkaWEtbW9kYWwtYmFja2Ryb3AsIC5tZWRpYS1tb2RhbC1jbG9zZSc6ICdlc2NhcGVIYW5kbGVyJyxcblx0XHQna2V5ZG93bic6ICdrZXlkb3duJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0Y29udGFpbmVyOiBkb2N1bWVudC5ib2R5LFxuXHRcdFx0dGl0bGU6ICAgICAnJyxcblx0XHRcdHByb3BhZ2F0ZTogdHJ1ZSxcblx0XHRcdGZyZWV6ZTogICAgdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5mb2N1c01hbmFnZXIgPSBuZXcgd3AubWVkaWEudmlldy5Gb2N1c01hbmFnZXIoe1xuXHRcdFx0ZWw6IHRoaXMuZWxcblx0XHR9KTtcblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHtPYmplY3R9XG5cdCAqL1xuXHRwcmVwYXJlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dGl0bGU6IHRoaXMub3B0aW9ucy50aXRsZVxuXHRcdH07XG5cdH0sXG5cblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3Lk1vZGFsfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0YXR0YWNoOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMudmlld3MuYXR0YWNoZWQgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHRpZiAoICEgdGhpcy52aWV3cy5yZW5kZXJlZCApIHtcblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy4kZWwuYXBwZW5kVG8oIHRoaXMub3B0aW9ucy5jb250YWluZXIgKTtcblxuXHRcdC8vIE1hbnVhbGx5IG1hcmsgdGhlIHZpZXcgYXMgYXR0YWNoZWQgYW5kIHRyaWdnZXIgcmVhZHkuXG5cdFx0dGhpcy52aWV3cy5hdHRhY2hlZCA9IHRydWU7XG5cdFx0dGhpcy52aWV3cy5yZWFkeSgpO1xuXG5cdFx0cmV0dXJuIHRoaXMucHJvcGFnYXRlKCdhdHRhY2gnKTtcblx0fSxcblxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuTW9kYWx9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRkZXRhY2g6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy4kZWwuaXMoJzp2aXNpYmxlJykgKSB7XG5cdFx0XHR0aGlzLmNsb3NlKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy4kZWwuZGV0YWNoKCk7XG5cdFx0dGhpcy52aWV3cy5hdHRhY2hlZCA9IGZhbHNlO1xuXHRcdHJldHVybiB0aGlzLnByb3BhZ2F0ZSgnZGV0YWNoJyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3Lk1vZGFsfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0b3BlbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRlbCA9IHRoaXMuJGVsLFxuXHRcdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcblx0XHRcdG1jZUVkaXRvcjtcblxuXHRcdGlmICggJGVsLmlzKCc6dmlzaWJsZScpICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIHRoaXMudmlld3MuYXR0YWNoZWQgKSB7XG5cdFx0XHR0aGlzLmF0dGFjaCgpO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSBgZnJlZXplYCBvcHRpb24gaXMgc2V0LCByZWNvcmQgdGhlIHdpbmRvdydzIHNjcm9sbCBwb3NpdGlvbi5cblx0XHRpZiAoIG9wdGlvbnMuZnJlZXplICkge1xuXHRcdFx0dGhpcy5fZnJlZXplID0ge1xuXHRcdFx0XHRzY3JvbGxUb3A6ICQoIHdpbmRvdyApLnNjcm9sbFRvcCgpXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8vIERpc2FibGUgcGFnZSBzY3JvbGxpbmcuXG5cdFx0JCggJ2JvZHknICkuYWRkQ2xhc3MoICdtb2RhbC1vcGVuJyApO1xuXG5cdFx0JGVsLnNob3coKTtcblxuXHRcdC8vIFRyeSB0byBjbG9zZSB0aGUgb25zY3JlZW4ga2V5Ym9hcmRcblx0XHRpZiAoICdvbnRvdWNoZW5kJyBpbiBkb2N1bWVudCApIHtcblx0XHRcdGlmICggKCBtY2VFZGl0b3IgPSB3aW5kb3cudGlueW1jZSAmJiB3aW5kb3cudGlueW1jZS5hY3RpdmVFZGl0b3IgKSAgJiYgISBtY2VFZGl0b3IuaXNIaWRkZW4oKSAmJiBtY2VFZGl0b3IuaWZyYW1lRWxlbWVudCApIHtcblx0XHRcdFx0bWNlRWRpdG9yLmlmcmFtZUVsZW1lbnQuZm9jdXMoKTtcblx0XHRcdFx0bWNlRWRpdG9yLmlmcmFtZUVsZW1lbnQuYmx1cigpO1xuXG5cdFx0XHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdG1jZUVkaXRvci5pZnJhbWVFbGVtZW50LmJsdXIoKTtcblx0XHRcdFx0fSwgMTAwICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy4kZWwuZm9jdXMoKTtcblxuXHRcdHJldHVybiB0aGlzLnByb3BhZ2F0ZSgnb3BlbicpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Nb2RhbH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGNsb3NlOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR2YXIgZnJlZXplID0gdGhpcy5fZnJlZXplO1xuXG5cdFx0aWYgKCAhIHRoaXMudmlld3MuYXR0YWNoZWQgfHwgISB0aGlzLiRlbC5pcygnOnZpc2libGUnKSApIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblxuXHRcdC8vIEVuYWJsZSBwYWdlIHNjcm9sbGluZy5cblx0XHQkKCAnYm9keScgKS5yZW1vdmVDbGFzcyggJ21vZGFsLW9wZW4nICk7XG5cblx0XHQvLyBIaWRlIG1vZGFsIGFuZCByZW1vdmUgcmVzdHJpY3RlZCBtZWRpYSBtb2RhbCB0YWIgZm9jdXMgb25jZSBpdCdzIGNsb3NlZFxuXHRcdHRoaXMuJGVsLmhpZGUoKS51bmRlbGVnYXRlKCAna2V5ZG93bicgKTtcblxuXHRcdC8vIFB1dCBmb2N1cyBiYWNrIGluIHVzZWZ1bCBsb2NhdGlvbiBvbmNlIG1vZGFsIGlzIGNsb3NlZFxuXHRcdCQoJyN3cGJvZHktY29udGVudCcpLmZvY3VzKCk7XG5cblx0XHR0aGlzLnByb3BhZ2F0ZSgnY2xvc2UnKTtcblxuXHRcdC8vIElmIHRoZSBgZnJlZXplYCBvcHRpb24gaXMgc2V0LCByZXN0b3JlIHRoZSBjb250YWluZXIncyBzY3JvbGwgcG9zaXRpb24uXG5cdFx0aWYgKCBmcmVlemUgKSB7XG5cdFx0XHQkKCB3aW5kb3cgKS5zY3JvbGxUb3AoIGZyZWV6ZS5zY3JvbGxUb3AgKTtcblx0XHR9XG5cblx0XHRpZiAoIG9wdGlvbnMgJiYgb3B0aW9ucy5lc2NhcGUgKSB7XG5cdFx0XHR0aGlzLnByb3BhZ2F0ZSgnZXNjYXBlJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Nb2RhbH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGVzY2FwZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY2xvc2UoeyBlc2NhcGU6IHRydWUgfSk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdGVzY2FwZUhhbmRsZXI6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMuZXNjYXBlKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBjb250ZW50IFZpZXdzIHRvIHJlZ2lzdGVyIHRvICcubWVkaWEtbW9kYWwtY29udGVudCdcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuTW9kYWx9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRjb250ZW50OiBmdW5jdGlvbiggY29udGVudCApIHtcblx0XHR0aGlzLnZpZXdzLnNldCggJy5tZWRpYS1tb2RhbC1jb250ZW50JywgY29udGVudCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBUcmlnZ2VycyBhIG1vZGFsIGV2ZW50IGFuZCBpZiB0aGUgYHByb3BhZ2F0ZWAgb3B0aW9uIGlzIHNldCxcblx0ICogZm9yd2FyZHMgZXZlbnRzIHRvIHRoZSBtb2RhbCdzIGNvbnRyb2xsZXIuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Nb2RhbH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHByb3BhZ2F0ZTogZnVuY3Rpb24oIGlkICkge1xuXHRcdHRoaXMudHJpZ2dlciggaWQgKTtcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLnByb3BhZ2F0ZSApIHtcblx0XHRcdHRoaXMuY29udHJvbGxlci50cmlnZ2VyKCBpZCApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRrZXlkb3duOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0Ly8gQ2xvc2UgdGhlIG1vZGFsIHdoZW4gZXNjYXBlIGlzIHByZXNzZWQuXG5cdFx0aWYgKCAyNyA9PT0gZXZlbnQud2hpY2ggJiYgdGhpcy4kZWwuaXMoJzp2aXNpYmxlJykgKSB7XG5cdFx0XHR0aGlzLmVzY2FwZSgpO1xuXHRcdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RhbDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5Qcmlvcml0eUxpc3RcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFByaW9yaXR5TGlzdCA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2JyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl92aWV3cyA9IHt9O1xuXG5cdFx0dGhpcy5zZXQoIF8uZXh0ZW5kKCB7fSwgdGhpcy5fdmlld3MsIHRoaXMub3B0aW9ucy52aWV3cyApLCB7IHNpbGVudDogdHJ1ZSB9KTtcblx0XHRkZWxldGUgdGhpcy5vcHRpb25zLnZpZXdzO1xuXG5cdFx0aWYgKCAhIHRoaXMub3B0aW9ucy5zaWxlbnQgKSB7XG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLlZpZXd8T2JqZWN0fSB2aWV3XG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHNldDogZnVuY3Rpb24oIGlkLCB2aWV3LCBvcHRpb25zICkge1xuXHRcdHZhciBwcmlvcml0eSwgdmlld3MsIGluZGV4O1xuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHQvLyBBY2NlcHQgYW4gb2JqZWN0IHdpdGggYW4gYGlkYCA6IGB2aWV3YCBtYXBwaW5nLlxuXHRcdGlmICggXy5pc09iamVjdCggaWQgKSApIHtcblx0XHRcdF8uZWFjaCggaWQsIGZ1bmN0aW9uKCB2aWV3LCBpZCApIHtcblx0XHRcdFx0dGhpcy5zZXQoIGlkLCB2aWV3ICk7XG5cdFx0XHR9LCB0aGlzICk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHRpZiAoICEgKHZpZXcgaW5zdGFuY2VvZiBCYWNrYm9uZS5WaWV3KSApIHtcblx0XHRcdHZpZXcgPSB0aGlzLnRvVmlldyggdmlldywgaWQsIG9wdGlvbnMgKTtcblx0XHR9XG5cdFx0dmlldy5jb250cm9sbGVyID0gdmlldy5jb250cm9sbGVyIHx8IHRoaXMuY29udHJvbGxlcjtcblxuXHRcdHRoaXMudW5zZXQoIGlkICk7XG5cblx0XHRwcmlvcml0eSA9IHZpZXcub3B0aW9ucy5wcmlvcml0eSB8fCAxMDtcblx0XHR2aWV3cyA9IHRoaXMudmlld3MuZ2V0KCkgfHwgW107XG5cblx0XHRfLmZpbmQoIHZpZXdzLCBmdW5jdGlvbiggZXhpc3RpbmcsIGkgKSB7XG5cdFx0XHRpZiAoIGV4aXN0aW5nLm9wdGlvbnMucHJpb3JpdHkgPiBwcmlvcml0eSApIHtcblx0XHRcdFx0aW5kZXggPSBpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuX3ZpZXdzWyBpZCBdID0gdmlldztcblx0XHR0aGlzLnZpZXdzLmFkZCggdmlldywge1xuXHRcdFx0YXQ6IF8uaXNOdW1iZXIoIGluZGV4ICkgPyBpbmRleCA6IHZpZXdzLmxlbmd0aCB8fCAwXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEuVmlld31cblx0ICovXG5cdGdldDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHJldHVybiB0aGlzLl92aWV3c1sgaWQgXTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Qcmlvcml0eUxpc3R9XG5cdCAqL1xuXHR1bnNldDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHZhciB2aWV3ID0gdGhpcy5nZXQoIGlkICk7XG5cblx0XHRpZiAoIHZpZXcgKSB7XG5cdFx0XHR2aWV3LnJlbW92ZSgpO1xuXHRcdH1cblxuXHRcdGRlbGV0ZSB0aGlzLl92aWV3c1sgaWQgXTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5WaWV3fVxuXHQgKi9cblx0dG9WaWV3OiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHRyZXR1cm4gbmV3IHdwLm1lZGlhLlZpZXcoIG9wdGlvbnMgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJpb3JpdHlMaXN0O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlJvdXRlckl0ZW1cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lbnVJdGVtXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBSb3V0ZXJJdGVtID0gd3AubWVkaWEudmlldy5NZW51SXRlbS5leHRlbmQoe1xuXHQvKipcblx0ICogT24gY2xpY2sgaGFuZGxlciB0byBhY3RpdmF0ZSB0aGUgY29udGVudCByZWdpb24ncyBjb3JyZXNwb25kaW5nIG1vZGUuXG5cdCAqL1xuXHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRlbnRNb2RlID0gdGhpcy5vcHRpb25zLmNvbnRlbnRNb2RlO1xuXHRcdGlmICggY29udGVudE1vZGUgKSB7XG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIuY29udGVudC5tb2RlKCBjb250ZW50TW9kZSApO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVySXRlbTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5Sb3V0ZXJcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lbnVcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgTWVudSA9IHdwLm1lZGlhLnZpZXcuTWVudSxcblx0Um91dGVyO1xuXG5Sb3V0ZXIgPSBNZW51LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2RpdicsXG5cdGNsYXNzTmFtZTogJ21lZGlhLXJvdXRlcicsXG5cdHByb3BlcnR5OiAgJ2NvbnRlbnRNb2RlJyxcblx0SXRlbVZpZXc6ICB3cC5tZWRpYS52aWV3LlJvdXRlckl0ZW0sXG5cdHJlZ2lvbjogICAgJ3JvdXRlcicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnY29udGVudDpyZW5kZXInLCB0aGlzLnVwZGF0ZSwgdGhpcyApO1xuXHRcdC8vIENhbGwgJ2luaXRpYWxpemUnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3MuXG5cdFx0TWVudS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0dXBkYXRlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbW9kZSA9IHRoaXMuY29udHJvbGxlci5jb250ZW50Lm1vZGUoKTtcblx0XHRpZiAoIG1vZGUgKSB7XG5cdFx0XHR0aGlzLnNlbGVjdCggbW9kZSApO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVyO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlNlYXJjaFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgbDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0U2VhcmNoO1xuXG5TZWFyY2ggPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2lucHV0Jyxcblx0Y2xhc3NOYW1lOiAnc2VhcmNoJyxcblx0aWQ6ICAgICAgICAnbWVkaWEtc2VhcmNoLWlucHV0JyxcblxuXHRhdHRyaWJ1dGVzOiB7XG5cdFx0dHlwZTogICAgICAgICdzZWFyY2gnLFxuXHRcdHBsYWNlaG9sZGVyOiBsMTBuLnNlYXJjaFxuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdpbnB1dCc6ICAnc2VhcmNoJyxcblx0XHQna2V5dXAnOiAgJ3NlYXJjaCcsXG5cdFx0J2NoYW5nZSc6ICdzZWFyY2gnLFxuXHRcdCdzZWFyY2gnOiAnc2VhcmNoJ1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5TZWFyY2h9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZWwudmFsdWUgPSB0aGlzLm1vZGVsLmVzY2FwZSgnc2VhcmNoJyk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0c2VhcmNoOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC50YXJnZXQudmFsdWUgKSB7XG5cdFx0XHR0aGlzLm1vZGVsLnNldCggJ3NlYXJjaCcsIGV2ZW50LnRhcmdldC52YWx1ZSApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLm1vZGVsLnVuc2V0KCdzZWFyY2gnKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlYXJjaDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TZWxlY3Rpb25cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdFNlbGVjdGlvbjtcblxuU2VsZWN0aW9uID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdkaXYnLFxuXHRjbGFzc05hbWU6ICdtZWRpYS1zZWxlY3Rpb24nLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCdtZWRpYS1zZWxlY3Rpb24nKSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgLmVkaXQtc2VsZWN0aW9uJzogICdlZGl0Jyxcblx0XHQnY2xpY2sgLmNsZWFyLXNlbGVjdGlvbic6ICdjbGVhcidcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdGVkaXRhYmxlOiAgZmFsc2UsXG5cdFx0XHRjbGVhcmFibGU6IHRydWVcblx0XHR9KTtcblxuXHRcdC8qKlxuXHRcdCAqIEBtZW1iZXIge3dwLm1lZGlhLnZpZXcuQXR0YWNobWVudHMuU2VsZWN0aW9ufVxuXHRcdCAqL1xuXHRcdHRoaXMuYXR0YWNobWVudHMgPSBuZXcgd3AubWVkaWEudmlldy5BdHRhY2htZW50cy5TZWxlY3Rpb24oe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0Y29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxuXHRcdFx0c2VsZWN0aW9uOiAgdGhpcy5jb2xsZWN0aW9uLFxuXHRcdFx0bW9kZWw6ICAgICAgbmV3IEJhY2tib25lLk1vZGVsKClcblx0XHR9KTtcblxuXHRcdHRoaXMudmlld3Muc2V0KCAnLnNlbGVjdGlvbi12aWV3JywgdGhpcy5hdHRhY2htZW50cyApO1xuXHRcdHRoaXMuY29sbGVjdGlvbi5vbiggJ2FkZCByZW1vdmUgcmVzZXQnLCB0aGlzLnJlZnJlc2gsIHRoaXMgKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIub24oICdjb250ZW50OmFjdGl2YXRlJywgdGhpcy5yZWZyZXNoLCB0aGlzICk7XG5cdH0sXG5cblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVmcmVzaCgpO1xuXHR9LFxuXG5cdHJlZnJlc2g6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIElmIHRoZSBzZWxlY3Rpb24gaGFzbid0IGJlZW4gcmVuZGVyZWQsIGJhaWwuXG5cdFx0aWYgKCAhIHRoaXMuJGVsLmNoaWxkcmVuKCkubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBjb2xsZWN0aW9uID0gdGhpcy5jb2xsZWN0aW9uLFxuXHRcdFx0ZWRpdGluZyA9ICdlZGl0LXNlbGVjdGlvbicgPT09IHRoaXMuY29udHJvbGxlci5jb250ZW50Lm1vZGUoKTtcblxuXHRcdC8vIElmIG5vdGhpbmcgaXMgc2VsZWN0ZWQsIGRpc3BsYXkgbm90aGluZy5cblx0XHR0aGlzLiRlbC50b2dnbGVDbGFzcyggJ2VtcHR5JywgISBjb2xsZWN0aW9uLmxlbmd0aCApO1xuXHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCAnb25lJywgMSA9PT0gY29sbGVjdGlvbi5sZW5ndGggKTtcblx0XHR0aGlzLiRlbC50b2dnbGVDbGFzcyggJ2VkaXRpbmcnLCBlZGl0aW5nICk7XG5cblx0XHR0aGlzLiQoJy5jb3VudCcpLnRleHQoIGwxMG4uc2VsZWN0ZWQucmVwbGFjZSgnJWQnLCBjb2xsZWN0aW9uLmxlbmd0aCkgKTtcblx0fSxcblxuXHRlZGl0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRpZiAoIHRoaXMub3B0aW9ucy5lZGl0YWJsZSApIHtcblx0XHRcdHRoaXMub3B0aW9ucy5lZGl0YWJsZS5jYWxsKCB0aGlzLCB0aGlzLmNvbGxlY3Rpb24gKTtcblx0XHR9XG5cdH0sXG5cblx0Y2xlYXI6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMuY29sbGVjdGlvbi5yZXNldCgpO1xuXG5cdFx0Ly8gS2VlcCBmb2N1cyBpbnNpZGUgbWVkaWEgbW9kYWxcblx0XHQvLyBhZnRlciBjbGVhciBsaW5rIGlzIHNlbGVjdGVkXG5cdFx0dGhpcy5jb250cm9sbGVyLm1vZGFsLmZvY3VzTWFuYWdlci5mb2N1cygpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3Rpb247XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3NcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFZpZXcgPSB3cC5tZWRpYS5WaWV3LFxuXHQkID0gQmFja2JvbmUuJCxcblx0U2V0dGluZ3M7XG5cblNldHRpbmdzID0gVmlldy5leHRlbmQoe1xuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgYnV0dG9uJzogICAgJ3VwZGF0ZUhhbmRsZXInLFxuXHRcdCdjaGFuZ2UgaW5wdXQnOiAgICAndXBkYXRlSGFuZGxlcicsXG5cdFx0J2NoYW5nZSBzZWxlY3QnOiAgICd1cGRhdGVIYW5kbGVyJyxcblx0XHQnY2hhbmdlIHRleHRhcmVhJzogJ3VwZGF0ZUhhbmRsZXInXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5tb2RlbCA9IHRoaXMubW9kZWwgfHwgbmV3IEJhY2tib25lLk1vZGVsKCk7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZScsIHRoaXMudXBkYXRlQ2hhbmdlcyApO1xuXHR9LFxuXG5cdHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfLmRlZmF1bHRzKHtcblx0XHRcdG1vZGVsOiB0aGlzLm1vZGVsLnRvSlNPTigpXG5cdFx0fSwgdGhpcy5vcHRpb25zICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5TZXR0aW5nc30gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Vmlldy5wcm90b3R5cGUucmVuZGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHQvLyBTZWxlY3QgdGhlIGNvcnJlY3QgdmFsdWVzLlxuXHRcdF8oIHRoaXMubW9kZWwuYXR0cmlidXRlcyApLmNoYWluKCkua2V5cygpLmVhY2goIHRoaXMudXBkYXRlLCB0aGlzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG5cdCAqL1xuXHR1cGRhdGU6IGZ1bmN0aW9uKCBrZXkgKSB7XG5cdFx0dmFyIHZhbHVlID0gdGhpcy5tb2RlbC5nZXQoIGtleSApLFxuXHRcdFx0JHNldHRpbmcgPSB0aGlzLiQoJ1tkYXRhLXNldHRpbmc9XCInICsga2V5ICsgJ1wiXScpLFxuXHRcdFx0JGJ1dHRvbnMsICR2YWx1ZTtcblxuXHRcdC8vIEJhaWwgaWYgd2UgZGlkbid0IGZpbmQgYSBtYXRjaGluZyBzZXR0aW5nLlxuXHRcdGlmICggISAkc2V0dGluZy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gQXR0ZW1wdCB0byBkZXRlcm1pbmUgaG93IHRoZSBzZXR0aW5nIGlzIHJlbmRlcmVkIGFuZCB1cGRhdGVcblx0XHQvLyB0aGUgc2VsZWN0ZWQgdmFsdWUuXG5cblx0XHQvLyBIYW5kbGUgZHJvcGRvd25zLlxuXHRcdGlmICggJHNldHRpbmcuaXMoJ3NlbGVjdCcpICkge1xuXHRcdFx0JHZhbHVlID0gJHNldHRpbmcuZmluZCgnW3ZhbHVlPVwiJyArIHZhbHVlICsgJ1wiXScpO1xuXG5cdFx0XHRpZiAoICR2YWx1ZS5sZW5ndGggKSB7XG5cdFx0XHRcdCRzZXR0aW5nLmZpbmQoJ29wdGlvbicpLnByb3AoICdzZWxlY3RlZCcsIGZhbHNlICk7XG5cdFx0XHRcdCR2YWx1ZS5wcm9wKCAnc2VsZWN0ZWQnLCB0cnVlICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBJZiB3ZSBjYW4ndCBmaW5kIHRoZSBkZXNpcmVkIHZhbHVlLCByZWNvcmQgd2hhdCAqaXMqIHNlbGVjdGVkLlxuXHRcdFx0XHR0aGlzLm1vZGVsLnNldCgga2V5LCAkc2V0dGluZy5maW5kKCc6c2VsZWN0ZWQnKS52YWwoKSApO1xuXHRcdFx0fVxuXG5cdFx0Ly8gSGFuZGxlIGJ1dHRvbiBncm91cHMuXG5cdFx0fSBlbHNlIGlmICggJHNldHRpbmcuaGFzQ2xhc3MoJ2J1dHRvbi1ncm91cCcpICkge1xuXHRcdFx0JGJ1dHRvbnMgPSAkc2V0dGluZy5maW5kKCdidXR0b24nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG5cdFx0XHQkYnV0dG9ucy5maWx0ZXIoICdbdmFsdWU9XCInICsgdmFsdWUgKyAnXCJdJyApLmFkZENsYXNzKCdhY3RpdmUnKTtcblxuXHRcdC8vIEhhbmRsZSB0ZXh0IGlucHV0cyBhbmQgdGV4dGFyZWFzLlxuXHRcdH0gZWxzZSBpZiAoICRzZXR0aW5nLmlzKCdpbnB1dFt0eXBlPVwidGV4dFwiXSwgdGV4dGFyZWEnKSApIHtcblx0XHRcdGlmICggISAkc2V0dGluZy5pcygnOmZvY3VzJykgKSB7XG5cdFx0XHRcdCRzZXR0aW5nLnZhbCggdmFsdWUgKTtcblx0XHRcdH1cblx0XHQvLyBIYW5kbGUgY2hlY2tib3hlcy5cblx0XHR9IGVsc2UgaWYgKCAkc2V0dGluZy5pcygnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJykgKSB7XG5cdFx0XHQkc2V0dGluZy5wcm9wKCAnY2hlY2tlZCcsICEhIHZhbHVlICYmICdmYWxzZScgIT09IHZhbHVlICk7XG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHR1cGRhdGVIYW5kbGVyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyICRzZXR0aW5nID0gJCggZXZlbnQudGFyZ2V0ICkuY2xvc2VzdCgnW2RhdGEtc2V0dGluZ10nKSxcblx0XHRcdHZhbHVlID0gZXZlbnQudGFyZ2V0LnZhbHVlLFxuXHRcdFx0dXNlclNldHRpbmc7XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0aWYgKCAhICRzZXR0aW5nLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBVc2UgdGhlIGNvcnJlY3QgdmFsdWUgZm9yIGNoZWNrYm94ZXMuXG5cdFx0aWYgKCAkc2V0dGluZy5pcygnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJykgKSB7XG5cdFx0XHR2YWx1ZSA9ICRzZXR0aW5nWzBdLmNoZWNrZWQ7XG5cdFx0fVxuXG5cdFx0Ly8gVXBkYXRlIHRoZSBjb3JyZXNwb25kaW5nIHNldHRpbmcuXG5cdFx0dGhpcy5tb2RlbC5zZXQoICRzZXR0aW5nLmRhdGEoJ3NldHRpbmcnKSwgdmFsdWUgKTtcblxuXHRcdC8vIElmIHRoZSBzZXR0aW5nIGhhcyBhIGNvcnJlc3BvbmRpbmcgdXNlciBzZXR0aW5nLFxuXHRcdC8vIHVwZGF0ZSB0aGF0IGFzIHdlbGwuXG5cdFx0aWYgKCB1c2VyU2V0dGluZyA9ICRzZXR0aW5nLmRhdGEoJ3VzZXJTZXR0aW5nJykgKSB7XG5cdFx0XHR3aW5kb3cuc2V0VXNlclNldHRpbmcoIHVzZXJTZXR0aW5nLCB2YWx1ZSApO1xuXHRcdH1cblx0fSxcblxuXHR1cGRhdGVDaGFuZ2VzOiBmdW5jdGlvbiggbW9kZWwgKSB7XG5cdFx0aWYgKCBtb2RlbC5oYXNDaGFuZ2VkKCkgKSB7XG5cdFx0XHRfKCBtb2RlbC5jaGFuZ2VkICkuY2hhaW4oKS5rZXlzKCkuZWFjaCggdGhpcy51cGRhdGUsIHRoaXMgKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlNldHRpbmdzLkF0dGFjaG1lbnREaXNwbGF5XG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5nc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgU2V0dGluZ3MgPSB3cC5tZWRpYS52aWV3LlNldHRpbmdzLFxuXHRBdHRhY2htZW50RGlzcGxheTtcblxuQXR0YWNobWVudERpc3BsYXkgPSBTZXR0aW5ncy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdhdHRhY2htZW50LWRpc3BsYXktc2V0dGluZ3MnLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCdhdHRhY2htZW50LWRpc3BsYXktc2V0dGluZ3MnKSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYXR0YWNobWVudCA9IHRoaXMub3B0aW9ucy5hdHRhY2htZW50O1xuXG5cdFx0Xy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLCB7XG5cdFx0XHR1c2VyU2V0dGluZ3M6IGZhbHNlXG5cdFx0fSk7XG5cdFx0Ly8gQ2FsbCAnaW5pdGlhbGl6ZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzcy5cblx0XHRTZXR0aW5ncy5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZTpsaW5rJywgdGhpcy51cGRhdGVMaW5rVG8gKTtcblxuXHRcdGlmICggYXR0YWNobWVudCApIHtcblx0XHRcdGF0dGFjaG1lbnQub24oICdjaGFuZ2U6dXBsb2FkaW5nJywgdGhpcy5yZW5kZXIsIHRoaXMgKTtcblx0XHR9XG5cdH0sXG5cblx0ZGlzcG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGF0dGFjaG1lbnQgPSB0aGlzLm9wdGlvbnMuYXR0YWNobWVudDtcblx0XHRpZiAoIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHRhdHRhY2htZW50Lm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdH1cblx0XHQvKipcblx0XHQgKiBjYWxsICdkaXNwb3NlJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0U2V0dGluZ3MucHJvdG90eXBlLmRpc3Bvc2UuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuQXR0YWNobWVudERpc3BsYXl9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhdHRhY2htZW50ID0gdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQ7XG5cdFx0aWYgKCBhdHRhY2htZW50ICkge1xuXHRcdFx0Xy5leHRlbmQoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0XHRzaXplczogYXR0YWNobWVudC5nZXQoJ3NpemVzJyksXG5cdFx0XHRcdHR5cGU6ICBhdHRhY2htZW50LmdldCgndHlwZScpXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0LyoqXG5cdFx0ICogY2FsbCAncmVuZGVyJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0U2V0dGluZ3MucHJvdG90eXBlLnJlbmRlci5jYWxsKCB0aGlzICk7XG5cdFx0dGhpcy51cGRhdGVMaW5rVG8oKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHR1cGRhdGVMaW5rVG86IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsaW5rVG8gPSB0aGlzLm1vZGVsLmdldCgnbGluaycpLFxuXHRcdFx0JGlucHV0ID0gdGhpcy4kKCcubGluay10by1jdXN0b20nKSxcblx0XHRcdGF0dGFjaG1lbnQgPSB0aGlzLm9wdGlvbnMuYXR0YWNobWVudDtcblxuXHRcdGlmICggJ25vbmUnID09PSBsaW5rVG8gfHwgJ2VtYmVkJyA9PT0gbGlua1RvIHx8ICggISBhdHRhY2htZW50ICYmICdjdXN0b20nICE9PSBsaW5rVG8gKSApIHtcblx0XHRcdCRpbnB1dC5hZGRDbGFzcyggJ2hpZGRlbicgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHRpZiAoICdwb3N0JyA9PT0gbGlua1RvICkge1xuXHRcdFx0XHQkaW5wdXQudmFsKCBhdHRhY2htZW50LmdldCgnbGluaycpICk7XG5cdFx0XHR9IGVsc2UgaWYgKCAnZmlsZScgPT09IGxpbmtUbyApIHtcblx0XHRcdFx0JGlucHV0LnZhbCggYXR0YWNobWVudC5nZXQoJ3VybCcpICk7XG5cdFx0XHR9IGVsc2UgaWYgKCAhIHRoaXMubW9kZWwuZ2V0KCdsaW5rVXJsJykgKSB7XG5cdFx0XHRcdCRpbnB1dC52YWwoJ2h0dHA6Ly8nKTtcblx0XHRcdH1cblxuXHRcdFx0JGlucHV0LnByb3AoICdyZWFkb25seScsICdjdXN0b20nICE9PSBsaW5rVG8gKTtcblx0XHR9XG5cblx0XHQkaW5wdXQucmVtb3ZlQ2xhc3MoICdoaWRkZW4nICk7XG5cblx0XHQvLyBJZiB0aGUgaW5wdXQgaXMgdmlzaWJsZSwgZm9jdXMgYW5kIHNlbGVjdCBpdHMgY29udGVudHMuXG5cdFx0aWYgKCAhIHdwLm1lZGlhLmlzVG91Y2hEZXZpY2UgJiYgJGlucHV0LmlzKCc6dmlzaWJsZScpICkge1xuXHRcdFx0JGlucHV0LmZvY3VzKClbMF0uc2VsZWN0KCk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdHRhY2htZW50RGlzcGxheTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TZXR0aW5ncy5HYWxsZXJ5XG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5nc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgR2FsbGVyeSA9IHdwLm1lZGlhLnZpZXcuU2V0dGluZ3MuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnY29sbGVjdGlvbi1zZXR0aW5ncyBnYWxsZXJ5LXNldHRpbmdzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgnZ2FsbGVyeS1zZXR0aW5ncycpXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYWxsZXJ5O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlNldHRpbmdzLlBsYXlsaXN0XG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5nc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgUGxheWxpc3QgPSB3cC5tZWRpYS52aWV3LlNldHRpbmdzLmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2NvbGxlY3Rpb24tc2V0dGluZ3MgcGxheWxpc3Qtc2V0dGluZ3MnLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCdwbGF5bGlzdC1zZXR0aW5ncycpXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5bGlzdDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TaWRlYmFyXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5Qcmlvcml0eUxpc3RcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFNpZGViYXIgPSB3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdC5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdtZWRpYS1zaWRlYmFyJ1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2lkZWJhcjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TaXRlSWNvbkNyb3BwZXJcbiAqXG4gKiBVc2VzIHRoZSBpbWdBcmVhU2VsZWN0IHBsdWdpbiB0byBhbGxvdyBhIHVzZXIgdG8gY3JvcCBhIFNpdGUgSWNvbi5cbiAqXG4gKiBUYWtlcyBpbWdBcmVhU2VsZWN0IG9wdGlvbnMgZnJvbVxuICogd3AuY3VzdG9taXplLlNpdGVJY29uQ29udHJvbC5jYWxjdWxhdGVJbWFnZVNlbGVjdE9wdGlvbnMuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5Dcm9wcGVyXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEudmlldyxcblx0U2l0ZUljb25Dcm9wcGVyO1xuXG5TaXRlSWNvbkNyb3BwZXIgPSBWaWV3LkNyb3BwZXIuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnY3JvcC1jb250ZW50IHNpdGUtaWNvbicsXG5cblx0cmVhZHk6IGZ1bmN0aW9uICgpIHtcblx0XHRWaWV3LkNyb3BwZXIucHJvdG90eXBlLnJlYWR5LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHRoaXMuJCggJy5jcm9wLWltYWdlJyApLm9uKCAnbG9hZCcsIF8uYmluZCggdGhpcy5hZGRTaWRlYmFyLCB0aGlzICkgKTtcblx0fSxcblxuXHRhZGRTaWRlYmFyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNpZGViYXIgPSBuZXcgd3AubWVkaWEudmlldy5TaWRlYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuY29udHJvbGxlclxuXHRcdH0pO1xuXG5cdFx0dGhpcy5zaWRlYmFyLnNldCggJ3ByZXZpZXcnLCBuZXcgd3AubWVkaWEudmlldy5TaXRlSWNvblByZXZpZXcoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0YXR0YWNobWVudDogdGhpcy5vcHRpb25zLmF0dGFjaG1lbnRcblx0XHR9KSApO1xuXG5cdFx0dGhpcy5jb250cm9sbGVyLmNyb3BwZXJWaWV3LnZpZXdzLmFkZCggdGhpcy5zaWRlYmFyICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpdGVJY29uQ3JvcHBlcjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TaXRlSWNvblByZXZpZXdcbiAqXG4gKiBTaG93cyBhIHByZXZpZXcgb2YgdGhlIFNpdGUgSWNvbiBhcyBhIGZhdmljb24gYW5kIGFwcCBpY29uIHdoaWxlIGNyb3BwaW5nLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdCQgPSBqUXVlcnksXG5cdFNpdGVJY29uUHJldmlldztcblxuU2l0ZUljb25QcmV2aWV3ID0gVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdzaXRlLWljb24tcHJldmlldycsXG5cdHRlbXBsYXRlOiB3cC50ZW1wbGF0ZSggJ3NpdGUtaWNvbi1wcmV2aWV3JyApLFxuXG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNvbnRyb2xsZXIuaW1nU2VsZWN0LnNldE9wdGlvbnMoe1xuXHRcdFx0b25Jbml0OiB0aGlzLnVwZGF0ZVByZXZpZXcsXG5cdFx0XHRvblNlbGVjdENoYW5nZTogdGhpcy51cGRhdGVQcmV2aWV3XG5cdFx0fSk7XG5cdH0sXG5cblx0cHJlcGFyZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQuZ2V0KCAndXJsJyApXG5cdFx0fTtcblx0fSxcblxuXHR1cGRhdGVQcmV2aWV3OiBmdW5jdGlvbiggaW1nLCBjb29yZHMgKSB7XG5cdFx0dmFyIHJ4ID0gNjQgLyBjb29yZHMud2lkdGgsXG5cdFx0XHRyeSA9IDY0IC8gY29vcmRzLmhlaWdodCxcblx0XHRcdHByZXZpZXdfcnggPSAxNiAvIGNvb3Jkcy53aWR0aCxcblx0XHRcdHByZXZpZXdfcnkgPSAxNiAvIGNvb3Jkcy5oZWlnaHQ7XG5cblx0XHQkKCAnI3ByZXZpZXctYXBwLWljb24nICkuY3NzKHtcblx0XHRcdHdpZHRoOiBNYXRoLnJvdW5kKHJ4ICogdGhpcy5pbWFnZVdpZHRoICkgKyAncHgnLFxuXHRcdFx0aGVpZ2h0OiBNYXRoLnJvdW5kKHJ5ICogdGhpcy5pbWFnZUhlaWdodCApICsgJ3B4Jyxcblx0XHRcdG1hcmdpbkxlZnQ6ICctJyArIE1hdGgucm91bmQocnggKiBjb29yZHMueDEpICsgJ3B4Jyxcblx0XHRcdG1hcmdpblRvcDogJy0nICsgTWF0aC5yb3VuZChyeSAqIGNvb3Jkcy55MSkgKyAncHgnXG5cdFx0fSk7XG5cblx0XHQkKCAnI3ByZXZpZXctZmF2aWNvbicgKS5jc3Moe1xuXHRcdFx0d2lkdGg6IE1hdGgucm91bmQoIHByZXZpZXdfcnggKiB0aGlzLmltYWdlV2lkdGggKSArICdweCcsXG5cdFx0XHRoZWlnaHQ6IE1hdGgucm91bmQoIHByZXZpZXdfcnkgKiB0aGlzLmltYWdlSGVpZ2h0ICkgKyAncHgnLFxuXHRcdFx0bWFyZ2luTGVmdDogJy0nICsgTWF0aC5yb3VuZCggcHJldmlld19yeCAqIGNvb3Jkcy54MSApICsgJ3B4Jyxcblx0XHRcdG1hcmdpblRvcDogJy0nICsgTWF0aC5mbG9vciggcHJldmlld19yeSogY29vcmRzLnkxICkgKyAncHgnXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpdGVJY29uUHJldmlldztcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TcGlubmVyXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBTcGlubmVyID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdzcGFuJyxcblx0Y2xhc3NOYW1lOiAnc3Bpbm5lcicsXG5cdHNwaW5uZXJUaW1lb3V0OiBmYWxzZSxcblx0ZGVsYXk6IDQwMCxcblxuXHRzaG93OiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgdGhpcy5zcGlubmVyVGltZW91dCApIHtcblx0XHRcdHRoaXMuc3Bpbm5lclRpbWVvdXQgPSBfLmRlbGF5KGZ1bmN0aW9uKCAkZWwgKSB7XG5cdFx0XHRcdCRlbC5hZGRDbGFzcyggJ2lzLWFjdGl2ZScgKTtcblx0XHRcdH0sIHRoaXMuZGVsYXksIHRoaXMuJGVsICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0aGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdpcy1hY3RpdmUnICk7XG5cdFx0dGhpcy5zcGlubmVyVGltZW91dCA9IGNsZWFyVGltZW91dCggdGhpcy5zcGlubmVyVGltZW91dCApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwaW5uZXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuVG9vbGJhclxuICpcbiAqIEEgdG9vbGJhciB3aGljaCBjb25zaXN0cyBvZiBhIHByaW1hcnkgYW5kIGEgc2Vjb25kYXJ5IHNlY3Rpb24uIEVhY2ggc2VjdGlvbnNcbiAqIGNhbiBiZSBmaWxsZWQgd2l0aCB2aWV3cy5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFZpZXcgPSB3cC5tZWRpYS5WaWV3LFxuXHRUb29sYmFyO1xuXG5Ub29sYmFyID0gVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdkaXYnLFxuXHRjbGFzc05hbWU6ICdtZWRpYS10b29sYmFyJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3RhdGUgPSB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKSxcblx0XHRcdHNlbGVjdGlvbiA9IHRoaXMuc2VsZWN0aW9uID0gc3RhdGUuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdGxpYnJhcnkgPSB0aGlzLmxpYnJhcnkgPSBzdGF0ZS5nZXQoJ2xpYnJhcnknKTtcblxuXHRcdHRoaXMuX3ZpZXdzID0ge307XG5cblx0XHQvLyBUaGUgdG9vbGJhciBpcyBjb21wb3NlZCBvZiB0d28gYFByaW9yaXR5TGlzdGAgdmlld3MuXG5cdFx0dGhpcy5wcmltYXJ5ICAgPSBuZXcgd3AubWVkaWEudmlldy5Qcmlvcml0eUxpc3QoKTtcblx0XHR0aGlzLnNlY29uZGFyeSA9IG5ldyB3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdCgpO1xuXHRcdHRoaXMucHJpbWFyeS4kZWwuYWRkQ2xhc3MoJ21lZGlhLXRvb2xiYXItcHJpbWFyeSBzZWFyY2gtZm9ybScpO1xuXHRcdHRoaXMuc2Vjb25kYXJ5LiRlbC5hZGRDbGFzcygnbWVkaWEtdG9vbGJhci1zZWNvbmRhcnknKTtcblxuXHRcdHRoaXMudmlld3Muc2V0KFsgdGhpcy5zZWNvbmRhcnksIHRoaXMucHJpbWFyeSBdKTtcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLml0ZW1zICkge1xuXHRcdFx0dGhpcy5zZXQoIHRoaXMub3B0aW9ucy5pdGVtcywgeyBzaWxlbnQ6IHRydWUgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIHRoaXMub3B0aW9ucy5zaWxlbnQgKSB7XG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH1cblxuXHRcdGlmICggc2VsZWN0aW9uICkge1xuXHRcdFx0c2VsZWN0aW9uLm9uKCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMucmVmcmVzaCwgdGhpcyApO1xuXHRcdH1cblxuXHRcdGlmICggbGlicmFyeSApIHtcblx0XHRcdGxpYnJhcnkub24oICdhZGQgcmVtb3ZlIHJlc2V0JywgdGhpcy5yZWZyZXNoLCB0aGlzICk7XG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuVG9vbGJhcn0gUmV0dXJucyBpdHNlZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0ZGlzcG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLnNlbGVjdGlvbiApIHtcblx0XHRcdHRoaXMuc2VsZWN0aW9uLm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5saWJyYXJ5ICkge1xuXHRcdFx0dGhpcy5saWJyYXJ5Lm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdH1cblx0XHQvKipcblx0XHQgKiBjYWxsICdkaXNwb3NlJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0cmV0dXJuIFZpZXcucHJvdG90eXBlLmRpc3Bvc2UuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJlZnJlc2goKTtcblx0fSxcblxuXHQvKipcblx0ICogQHBhcmFtIHtzdHJpbmd9IGlkXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuVmlld3xPYmplY3R9IHZpZXdcblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XVxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Ub29sYmFyfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0c2V0OiBmdW5jdGlvbiggaWQsIHZpZXcsIG9wdGlvbnMgKSB7XG5cdFx0dmFyIGxpc3Q7XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHQvLyBBY2NlcHQgYW4gb2JqZWN0IHdpdGggYW4gYGlkYCA6IGB2aWV3YCBtYXBwaW5nLlxuXHRcdGlmICggXy5pc09iamVjdCggaWQgKSApIHtcblx0XHRcdF8uZWFjaCggaWQsIGZ1bmN0aW9uKCB2aWV3LCBpZCApIHtcblx0XHRcdFx0dGhpcy5zZXQoIGlkLCB2aWV3LCB7IHNpbGVudDogdHJ1ZSB9KTtcblx0XHRcdH0sIHRoaXMgKTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoICEgKCB2aWV3IGluc3RhbmNlb2YgQmFja2JvbmUuVmlldyApICkge1xuXHRcdFx0XHR2aWV3LmNsYXNzZXMgPSBbICdtZWRpYS1idXR0b24tJyArIGlkIF0uY29uY2F0KCB2aWV3LmNsYXNzZXMgfHwgW10gKTtcblx0XHRcdFx0dmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LkJ1dHRvbiggdmlldyApLnJlbmRlcigpO1xuXHRcdFx0fVxuXG5cdFx0XHR2aWV3LmNvbnRyb2xsZXIgPSB2aWV3LmNvbnRyb2xsZXIgfHwgdGhpcy5jb250cm9sbGVyO1xuXG5cdFx0XHR0aGlzLl92aWV3c1sgaWQgXSA9IHZpZXc7XG5cblx0XHRcdGxpc3QgPSB2aWV3Lm9wdGlvbnMucHJpb3JpdHkgPCAwID8gJ3NlY29uZGFyeScgOiAncHJpbWFyeSc7XG5cdFx0XHR0aGlzWyBsaXN0IF0uc2V0KCBpZCwgdmlldywgb3B0aW9ucyApO1xuXHRcdH1cblxuXHRcdGlmICggISBvcHRpb25zLnNpbGVudCApIHtcblx0XHRcdHRoaXMucmVmcmVzaCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtzdHJpbmd9IGlkXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LkJ1dHRvbn1cblx0ICovXG5cdGdldDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHJldHVybiB0aGlzLl92aWV3c1sgaWQgXTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Ub29sYmFyfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0dW5zZXQ6IGZ1bmN0aW9uKCBpZCwgb3B0aW9ucyApIHtcblx0XHRkZWxldGUgdGhpcy5fdmlld3NbIGlkIF07XG5cdFx0dGhpcy5wcmltYXJ5LnVuc2V0KCBpZCwgb3B0aW9ucyApO1xuXHRcdHRoaXMuc2Vjb25kYXJ5LnVuc2V0KCBpZCwgb3B0aW9ucyApO1xuXG5cdFx0aWYgKCAhIG9wdGlvbnMgfHwgISBvcHRpb25zLnNpbGVudCApIHtcblx0XHRcdHRoaXMucmVmcmVzaCgpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRyZWZyZXNoOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3RhdGUgPSB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKSxcblx0XHRcdGxpYnJhcnkgPSBzdGF0ZS5nZXQoJ2xpYnJhcnknKSxcblx0XHRcdHNlbGVjdGlvbiA9IHN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XG5cblx0XHRfLmVhY2goIHRoaXMuX3ZpZXdzLCBmdW5jdGlvbiggYnV0dG9uICkge1xuXHRcdFx0aWYgKCAhIGJ1dHRvbi5tb2RlbCB8fCAhIGJ1dHRvbi5vcHRpb25zIHx8ICEgYnV0dG9uLm9wdGlvbnMucmVxdWlyZXMgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHJlcXVpcmVzID0gYnV0dG9uLm9wdGlvbnMucmVxdWlyZXMsXG5cdFx0XHRcdGRpc2FibGVkID0gZmFsc2U7XG5cblx0XHRcdC8vIFByZXZlbnQgaW5zZXJ0aW9uIG9mIGF0dGFjaG1lbnRzIGlmIGFueSBvZiB0aGVtIGFyZSBzdGlsbCB1cGxvYWRpbmdcblx0XHRcdGRpc2FibGVkID0gXy5zb21lKCBzZWxlY3Rpb24ubW9kZWxzLCBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHRcdFx0cmV0dXJuIGF0dGFjaG1lbnQuZ2V0KCd1cGxvYWRpbmcnKSA9PT0gdHJ1ZTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoIHJlcXVpcmVzLnNlbGVjdGlvbiAmJiBzZWxlY3Rpb24gJiYgISBzZWxlY3Rpb24ubGVuZ3RoICkge1xuXHRcdFx0XHRkaXNhYmxlZCA9IHRydWU7XG5cdFx0XHR9IGVsc2UgaWYgKCByZXF1aXJlcy5saWJyYXJ5ICYmIGxpYnJhcnkgJiYgISBsaWJyYXJ5Lmxlbmd0aCApIHtcblx0XHRcdFx0ZGlzYWJsZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0YnV0dG9uLm1vZGVsLnNldCggJ2Rpc2FibGVkJywgZGlzYWJsZWQgKTtcblx0XHR9KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVG9vbGJhcjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5Ub29sYmFyLkVtYmVkXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5Ub29sYmFyLlNlbGVjdFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuVG9vbGJhclxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgU2VsZWN0ID0gd3AubWVkaWEudmlldy5Ub29sYmFyLlNlbGVjdCxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0RW1iZWQ7XG5cbkVtYmVkID0gU2VsZWN0LmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0dGV4dDogbDEwbi5pbnNlcnRJbnRvUG9zdCxcblx0XHRcdHJlcXVpcmVzOiBmYWxzZVxuXHRcdH0pO1xuXHRcdC8vIENhbGwgJ2luaXRpYWxpemUnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3MuXG5cdFx0U2VsZWN0LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRyZWZyZXNoOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCkucHJvcHMuZ2V0KCd1cmwnKTtcblx0XHR0aGlzLmdldCgnc2VsZWN0JykubW9kZWwuc2V0KCAnZGlzYWJsZWQnLCAhIHVybCB8fCB1cmwgPT09ICdodHRwOi8vJyApO1xuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ3JlZnJlc2gnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3Ncblx0XHQgKi9cblx0XHRTZWxlY3QucHJvdG90eXBlLnJlZnJlc2guYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWJlZDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5Ub29sYmFyLlNlbGVjdFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuVG9vbGJhclxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVG9vbGJhciA9IHdwLm1lZGlhLnZpZXcuVG9vbGJhcixcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0U2VsZWN0O1xuXG5TZWxlY3QgPSBUb29sYmFyLmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG5cdFx0Xy5iaW5kQWxsKCB0aGlzLCAnY2xpY2tTZWxlY3QnICk7XG5cblx0XHRfLmRlZmF1bHRzKCBvcHRpb25zLCB7XG5cdFx0XHRldmVudDogJ3NlbGVjdCcsXG5cdFx0XHRzdGF0ZTogZmFsc2UsXG5cdFx0XHRyZXNldDogdHJ1ZSxcblx0XHRcdGNsb3NlOiB0cnVlLFxuXHRcdFx0dGV4dDogIGwxMG4uc2VsZWN0LFxuXG5cdFx0XHQvLyBEb2VzIHRoZSBidXR0b24gcmVseSBvbiB0aGUgc2VsZWN0aW9uP1xuXHRcdFx0cmVxdWlyZXM6IHtcblx0XHRcdFx0c2VsZWN0aW9uOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRvcHRpb25zLml0ZW1zID0gXy5kZWZhdWx0cyggb3B0aW9ucy5pdGVtcyB8fCB7fSwge1xuXHRcdFx0c2VsZWN0OiB7XG5cdFx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRcdHRleHQ6ICAgICBvcHRpb25zLnRleHQsXG5cdFx0XHRcdHByaW9yaXR5OiA4MCxcblx0XHRcdFx0Y2xpY2s6ICAgIHRoaXMuY2xpY2tTZWxlY3QsXG5cdFx0XHRcdHJlcXVpcmVzOiBvcHRpb25zLnJlcXVpcmVzXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gQ2FsbCAnaW5pdGlhbGl6ZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzcy5cblx0XHRUb29sYmFyLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRjbGlja1NlbGVjdDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHRjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyO1xuXG5cdFx0aWYgKCBvcHRpb25zLmNsb3NlICkge1xuXHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXHRcdH1cblxuXHRcdGlmICggb3B0aW9ucy5ldmVudCApIHtcblx0XHRcdGNvbnRyb2xsZXIuc3RhdGUoKS50cmlnZ2VyKCBvcHRpb25zLmV2ZW50ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBvcHRpb25zLnN0YXRlICkge1xuXHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSggb3B0aW9ucy5zdGF0ZSApO1xuXHRcdH1cblxuXHRcdGlmICggb3B0aW9ucy5yZXNldCApIHtcblx0XHRcdGNvbnRyb2xsZXIucmVzZXQoKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdDtcbiIsIi8qKlxuICogQ3JlYXRlcyBhIGRyb3B6b25lIG9uIFdQIGVkaXRvciBpbnN0YW5jZXMgKGVsZW1lbnRzIHdpdGggLndwLWVkaXRvci13cmFwKVxuICogYW5kIHJlbGF5cyBkcmFnJ24nZHJvcHBlZCBmaWxlcyB0byBhIG1lZGlhIHdvcmtmbG93LlxuICpcbiAqIHdwLm1lZGlhLnZpZXcuRWRpdG9yVXBsb2FkZXJcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFZpZXcgPSB3cC5tZWRpYS5WaWV3LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHQkID0galF1ZXJ5LFxuXHRFZGl0b3JVcGxvYWRlcjtcblxuRWRpdG9yVXBsb2FkZXIgPSBWaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2RpdicsXG5cdGNsYXNzTmFtZTogJ3VwbG9hZGVyLWVkaXRvcicsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoICd1cGxvYWRlci1lZGl0b3InICksXG5cblx0bG9jYWxEcmFnOiBmYWxzZSxcblx0b3ZlckNvbnRhaW5lcjogZmFsc2UsXG5cdG92ZXJEcm9wem9uZTogZmFsc2UsXG5cdGRyYWdnaW5nRmlsZTogbnVsbCxcblxuXHQvKipcblx0ICogQmluZCBkcmFnJ24nZHJvcCBldmVudHMgdG8gY2FsbGJhY2tzLlxuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG5cdFx0Ly8gQmFpbCBpZiBub3QgZW5hYmxlZCBvciBVQSBkb2VzIG5vdCBzdXBwb3J0IGRyYWcnbidkcm9wIG9yIEZpbGUgQVBJLlxuXHRcdGlmICggISB3aW5kb3cudGlueU1DRVByZUluaXQgfHwgISB3aW5kb3cudGlueU1DRVByZUluaXQuZHJhZ0Ryb3BVcGxvYWQgfHwgISB0aGlzLmJyb3dzZXJTdXBwb3J0KCkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHR0aGlzLiRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuXHRcdHRoaXMuZHJvcHpvbmVzID0gW107XG5cdFx0dGhpcy5maWxlcyA9IFtdO1xuXG5cdFx0dGhpcy4kZG9jdW1lbnQub24oICdkcm9wJywgJy51cGxvYWRlci1lZGl0b3InLCBfLmJpbmQoIHRoaXMuZHJvcCwgdGhpcyApICk7XG5cdFx0dGhpcy4kZG9jdW1lbnQub24oICdkcmFnb3ZlcicsICcudXBsb2FkZXItZWRpdG9yJywgXy5iaW5kKCB0aGlzLmRyb3B6b25lRHJhZ292ZXIsIHRoaXMgKSApO1xuXHRcdHRoaXMuJGRvY3VtZW50Lm9uKCAnZHJhZ2xlYXZlJywgJy51cGxvYWRlci1lZGl0b3InLCBfLmJpbmQoIHRoaXMuZHJvcHpvbmVEcmFnbGVhdmUsIHRoaXMgKSApO1xuXHRcdHRoaXMuJGRvY3VtZW50Lm9uKCAnY2xpY2snLCAnLnVwbG9hZGVyLWVkaXRvcicsIF8uYmluZCggdGhpcy5jbGljaywgdGhpcyApICk7XG5cblx0XHR0aGlzLiRkb2N1bWVudC5vbiggJ2RyYWdvdmVyJywgXy5iaW5kKCB0aGlzLmNvbnRhaW5lckRyYWdvdmVyLCB0aGlzICkgKTtcblx0XHR0aGlzLiRkb2N1bWVudC5vbiggJ2RyYWdsZWF2ZScsIF8uYmluZCggdGhpcy5jb250YWluZXJEcmFnbGVhdmUsIHRoaXMgKSApO1xuXG5cdFx0dGhpcy4kZG9jdW1lbnQub24oICdkcmFnc3RhcnQgZHJhZ2VuZCBkcm9wJywgXy5iaW5kKCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR0aGlzLmxvY2FsRHJhZyA9IGV2ZW50LnR5cGUgPT09ICdkcmFnc3RhcnQnO1xuXG5cdFx0XHRpZiAoIGV2ZW50LnR5cGUgPT09ICdkcm9wJyApIHtcblx0XHRcdFx0dGhpcy5jb250YWluZXJEcmFnbGVhdmUoKTtcblx0XHRcdH1cblx0XHR9LCB0aGlzICkgKTtcblxuXHRcdHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDaGVjayBicm93c2VyIHN1cHBvcnQgZm9yIGRyYWcnbidkcm9wLlxuXHQgKlxuXHQgKiBAcmV0dXJuIEJvb2xlYW5cblx0ICovXG5cdGJyb3dzZXJTdXBwb3J0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3VwcG9ydHMgPSBmYWxzZSwgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0XHRzdXBwb3J0cyA9ICggJ2RyYWdnYWJsZScgaW4gZGl2ICkgfHwgKCAnb25kcmFnc3RhcnQnIGluIGRpdiAmJiAnb25kcm9wJyBpbiBkaXYgKTtcblx0XHRzdXBwb3J0cyA9IHN1cHBvcnRzICYmICEhICggd2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5GaWxlUmVhZGVyICk7XG5cdFx0cmV0dXJuIHN1cHBvcnRzO1xuXHR9LFxuXG5cdGlzRHJhZ2dpbmdGaWxlOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCB0aGlzLmRyYWdnaW5nRmlsZSAhPT0gbnVsbCApIHtcblx0XHRcdHJldHVybiB0aGlzLmRyYWdnaW5nRmlsZTtcblx0XHR9XG5cblx0XHRpZiAoIF8uaXNVbmRlZmluZWQoIGV2ZW50Lm9yaWdpbmFsRXZlbnQgKSB8fCBfLmlzVW5kZWZpbmVkKCBldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2ZlciApICkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHRoaXMuZHJhZ2dpbmdGaWxlID0gXy5pbmRleE9mKCBldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcywgJ0ZpbGVzJyApID4gLTEgJiZcblx0XHRcdF8uaW5kZXhPZiggZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIudHlwZXMsICd0ZXh0L3BsYWluJyApID09PSAtMTtcblxuXHRcdHJldHVybiB0aGlzLmRyYWdnaW5nRmlsZTtcblx0fSxcblxuXHRyZWZyZXNoOiBmdW5jdGlvbiggZSApIHtcblx0XHR2YXIgZHJvcHpvbmVfaWQ7XG5cdFx0Zm9yICggZHJvcHpvbmVfaWQgaW4gdGhpcy5kcm9wem9uZXMgKSB7XG5cdFx0XHQvLyBIaWRlIHRoZSBkcm9wem9uZXMgb25seSBpZiBkcmFnZ2luZyBoYXMgbGVmdCB0aGUgc2NyZWVuLlxuXHRcdFx0dGhpcy5kcm9wem9uZXNbIGRyb3B6b25lX2lkIF0udG9nZ2xlKCB0aGlzLm92ZXJDb250YWluZXIgfHwgdGhpcy5vdmVyRHJvcHpvbmUgKTtcblx0XHR9XG5cblx0XHRpZiAoICEgXy5pc1VuZGVmaW5lZCggZSApICkge1xuXHRcdFx0JCggZS50YXJnZXQgKS5jbG9zZXN0KCAnLnVwbG9hZGVyLWVkaXRvcicgKS50b2dnbGVDbGFzcyggJ2Ryb3BwYWJsZScsIHRoaXMub3ZlckRyb3B6b25lICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIHRoaXMub3ZlckNvbnRhaW5lciAmJiAhIHRoaXMub3ZlckRyb3B6b25lICkge1xuXHRcdFx0dGhpcy5kcmFnZ2luZ0ZpbGUgPSBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAhIHRoaXMuaW5pdGlhbGl6ZWQgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHRWaWV3LnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdCQoICcud3AtZWRpdG9yLXdyYXAnICkuZWFjaCggXy5iaW5kKCB0aGlzLmF0dGFjaCwgdGhpcyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0YXR0YWNoOiBmdW5jdGlvbiggaW5kZXgsIGVkaXRvciApIHtcblx0XHQvLyBBdHRhY2ggYSBkcm9wem9uZSB0byBhbiBlZGl0b3IuXG5cdFx0dmFyIGRyb3B6b25lID0gdGhpcy4kZWwuY2xvbmUoKTtcblx0XHR0aGlzLmRyb3B6b25lcy5wdXNoKCBkcm9wem9uZSApO1xuXHRcdCQoIGVkaXRvciApLmFwcGVuZCggZHJvcHpvbmUgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogV2hlbiBhIGZpbGUgaXMgZHJvcHBlZCBvbiB0aGUgZWRpdG9yIHVwbG9hZGVyLCBvcGVuIHVwIGFuIGVkaXRvciBtZWRpYSB3b3JrZmxvd1xuXHQgKiBhbmQgdXBsb2FkIHRoZSBmaWxlIGltbWVkaWF0ZWx5LlxuXHQgKlxuXHQgKiBAcGFyYW0gIHtqUXVlcnkuRXZlbnR9IGV2ZW50IFRoZSAnZHJvcCcgZXZlbnQuXG5cdCAqL1xuXHRkcm9wOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyICR3cmFwLCB1cGxvYWRWaWV3O1xuXG5cdFx0dGhpcy5jb250YWluZXJEcmFnbGVhdmUoIGV2ZW50ICk7XG5cdFx0dGhpcy5kcm9wem9uZURyYWdsZWF2ZSggZXZlbnQgKTtcblxuXHRcdHRoaXMuZmlsZXMgPSBldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5maWxlcztcblx0XHRpZiAoIHRoaXMuZmlsZXMubGVuZ3RoIDwgMSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBTZXQgdGhlIGFjdGl2ZSBlZGl0b3IgdG8gdGhlIGRyb3AgdGFyZ2V0LlxuXHRcdCR3cmFwID0gJCggZXZlbnQudGFyZ2V0ICkucGFyZW50cyggJy53cC1lZGl0b3Itd3JhcCcgKTtcblx0XHRpZiAoICR3cmFwLmxlbmd0aCA+IDAgJiYgJHdyYXBbMF0uaWQgKSB7XG5cdFx0XHR3aW5kb3cud3BBY3RpdmVFZGl0b3IgPSAkd3JhcFswXS5pZC5zbGljZSggMywgLTUgKTtcblx0XHR9XG5cblx0XHRpZiAoICEgdGhpcy53b3JrZmxvdyApIHtcblx0XHRcdHRoaXMud29ya2Zsb3cgPSB3cC5tZWRpYS5lZGl0b3Iub3Blbiggd2luZG93LndwQWN0aXZlRWRpdG9yLCB7XG5cdFx0XHRcdGZyYW1lOiAgICAncG9zdCcsXG5cdFx0XHRcdHN0YXRlOiAgICAnaW5zZXJ0Jyxcblx0XHRcdFx0dGl0bGU6ICAgIGwxMG4uYWRkTWVkaWEsXG5cdFx0XHRcdG11bHRpcGxlOiB0cnVlXG5cdFx0XHR9KTtcblxuXHRcdFx0dXBsb2FkVmlldyA9IHRoaXMud29ya2Zsb3cudXBsb2FkZXI7XG5cblx0XHRcdGlmICggdXBsb2FkVmlldy51cGxvYWRlciAmJiB1cGxvYWRWaWV3LnVwbG9hZGVyLnJlYWR5ICkge1xuXHRcdFx0XHR0aGlzLmFkZEZpbGVzLmFwcGx5KCB0aGlzICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLndvcmtmbG93Lm9uKCAndXBsb2FkZXI6cmVhZHknLCB0aGlzLmFkZEZpbGVzLCB0aGlzICk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMud29ya2Zsb3cuc3RhdGUoKS5yZXNldCgpO1xuXHRcdFx0dGhpcy5hZGRGaWxlcy5hcHBseSggdGhpcyApO1xuXHRcdFx0dGhpcy53b3JrZmxvdy5vcGVuKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgdGhlIGZpbGVzIHRvIHRoZSB1cGxvYWRlci5cblx0ICovXG5cdGFkZEZpbGVzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuZmlsZXMubGVuZ3RoICkge1xuXHRcdFx0dGhpcy53b3JrZmxvdy51cGxvYWRlci51cGxvYWRlci51cGxvYWRlci5hZGRGaWxlKCBfLnRvQXJyYXkoIHRoaXMuZmlsZXMgKSApO1xuXHRcdFx0dGhpcy5maWxlcyA9IFtdO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRjb250YWluZXJEcmFnb3ZlcjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggdGhpcy5sb2NhbERyYWcgfHwgISB0aGlzLmlzRHJhZ2dpbmdGaWxlKCBldmVudCApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMub3ZlckNvbnRhaW5lciA9IHRydWU7XG5cdFx0dGhpcy5yZWZyZXNoKCk7XG5cdH0sXG5cblx0Y29udGFpbmVyRHJhZ2xlYXZlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm92ZXJDb250YWluZXIgPSBmYWxzZTtcblxuXHRcdC8vIFRocm90dGxlIGRyYWdsZWF2ZSBiZWNhdXNlIGl0J3MgY2FsbGVkIHdoZW4gYm91bmNpbmcgZnJvbSBzb21lIGVsZW1lbnRzIHRvIG90aGVycy5cblx0XHRfLmRlbGF5KCBfLmJpbmQoIHRoaXMucmVmcmVzaCwgdGhpcyApLCA1MCApO1xuXHR9LFxuXG5cdGRyb3B6b25lRHJhZ292ZXI6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoIHRoaXMubG9jYWxEcmFnIHx8ICEgdGhpcy5pc0RyYWdnaW5nRmlsZSggZXZlbnQgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLm92ZXJEcm9wem9uZSA9IHRydWU7XG5cdFx0dGhpcy5yZWZyZXNoKCBldmVudCApO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRkcm9wem9uZURyYWdsZWF2ZTogZnVuY3Rpb24oIGUgKSB7XG5cdFx0dGhpcy5vdmVyRHJvcHpvbmUgPSBmYWxzZTtcblx0XHRfLmRlbGF5KCBfLmJpbmQoIHRoaXMucmVmcmVzaCwgdGhpcywgZSApLCA1MCApO1xuXHR9LFxuXG5cdGNsaWNrOiBmdW5jdGlvbiggZSApIHtcblx0XHQvLyBJbiB0aGUgcmFyZSBjYXNlIHdoZXJlIHRoZSBkcm9wem9uZSBnZXRzIHN0dWNrLCBoaWRlIGl0IG9uIGNsaWNrLlxuXHRcdHRoaXMuY29udGFpbmVyRHJhZ2xlYXZlKCBlICk7XG5cdFx0dGhpcy5kcm9wem9uZURyYWdsZWF2ZSggZSApO1xuXHRcdHRoaXMubG9jYWxEcmFnID0gZmFsc2U7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvclVwbG9hZGVyO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlVwbG9hZGVySW5saW5lXG4gKlxuICogVGhlIGlubGluZSB1cGxvYWRlciB0aGF0IHNob3dzIHVwIGluIHRoZSAnVXBsb2FkIEZpbGVzJyB0YWIuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0VXBsb2FkZXJJbmxpbmU7XG5cblVwbG9hZGVySW5saW5lID0gVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdkaXYnLFxuXHRjbGFzc05hbWU6ICd1cGxvYWRlci1pbmxpbmUnLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCd1cGxvYWRlci1pbmxpbmUnKSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgLmNsb3NlJzogJ2hpZGUnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Xy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLCB7XG5cdFx0XHRtZXNzYWdlOiAnJyxcblx0XHRcdHN0YXR1czogIHRydWUsXG5cdFx0XHRjYW5DbG9zZTogZmFsc2Vcblx0XHR9KTtcblxuXHRcdGlmICggISB0aGlzLm9wdGlvbnMuJGJyb3dzZXIgJiYgdGhpcy5jb250cm9sbGVyLnVwbG9hZGVyICkge1xuXHRcdFx0dGhpcy5vcHRpb25zLiRicm93c2VyID0gdGhpcy5jb250cm9sbGVyLnVwbG9hZGVyLiRicm93c2VyO1xuXHRcdH1cblxuXHRcdGlmICggXy5pc1VuZGVmaW5lZCggdGhpcy5vcHRpb25zLnBvc3RJZCApICkge1xuXHRcdFx0dGhpcy5vcHRpb25zLnBvc3RJZCA9IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MucG9zdC5pZDtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zdGF0dXMgKSB7XG5cdFx0XHR0aGlzLnZpZXdzLnNldCggJy51cGxvYWQtaW5saW5lLXN0YXR1cycsIG5ldyB3cC5tZWRpYS52aWV3LlVwbG9hZGVyU3RhdHVzKHtcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyXG5cdFx0XHR9KSApO1xuXHRcdH1cblx0fSxcblxuXHRwcmVwYXJlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3VnZ2VzdGVkV2lkdGggPSB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3N1Z2dlc3RlZFdpZHRoJyksXG5cdFx0XHRzdWdnZXN0ZWRIZWlnaHQgPSB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3N1Z2dlc3RlZEhlaWdodCcpLFxuXHRcdFx0ZGF0YSA9IHt9O1xuXG5cdFx0ZGF0YS5tZXNzYWdlID0gdGhpcy5vcHRpb25zLm1lc3NhZ2U7XG5cdFx0ZGF0YS5jYW5DbG9zZSA9IHRoaXMub3B0aW9ucy5jYW5DbG9zZTtcblxuXHRcdGlmICggc3VnZ2VzdGVkV2lkdGggJiYgc3VnZ2VzdGVkSGVpZ2h0ICkge1xuXHRcdFx0ZGF0YS5zdWdnZXN0ZWRXaWR0aCA9IHN1Z2dlc3RlZFdpZHRoO1xuXHRcdFx0ZGF0YS5zdWdnZXN0ZWRIZWlnaHQgPSBzdWdnZXN0ZWRIZWlnaHQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRhdGE7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5VcGxvYWRlcklubGluZX0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5kaXNwb3NpbmcgKSB7XG5cdFx0XHQvKipcblx0XHRcdCAqIGNhbGwgJ2Rpc3Bvc2UnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3Ncblx0XHRcdCAqL1xuXHRcdFx0cmV0dXJuIFZpZXcucHJvdG90eXBlLmRpc3Bvc2UuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdH1cblxuXHRcdC8vIFJ1biByZW1vdmUgb24gYGRpc3Bvc2VgLCBzbyB3ZSBjYW4gYmUgc3VyZSB0byByZWZyZXNoIHRoZVxuXHRcdC8vIHVwbG9hZGVyIHdpdGggYSB2aWV3LWxlc3MgRE9NLiBUcmFjayB3aGV0aGVyIHdlJ3JlIGRpc3Bvc2luZ1xuXHRcdC8vIHNvIHdlIGRvbid0IHRyaWdnZXIgYW4gaW5maW5pdGUgbG9vcC5cblx0XHR0aGlzLmRpc3Bvc2luZyA9IHRydWU7XG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKCk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5VcGxvYWRlcklubGluZX0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHJlbW92ZTogZnVuY3Rpb24oKSB7XG5cdFx0LyoqXG5cdFx0ICogY2FsbCAncmVtb3ZlJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0dmFyIHJlc3VsdCA9IFZpZXcucHJvdG90eXBlLnJlbW92ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHRfLmRlZmVyKCBfLmJpbmQoIHRoaXMucmVmcmVzaCwgdGhpcyApICk7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblxuXHRyZWZyZXNoOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXBsb2FkZXIgPSB0aGlzLmNvbnRyb2xsZXIudXBsb2FkZXI7XG5cblx0XHRpZiAoIHVwbG9hZGVyICkge1xuXHRcdFx0dXBsb2FkZXIucmVmcmVzaCgpO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LlVwbG9hZGVySW5saW5lfVxuXHQgKi9cblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciAkYnJvd3NlciA9IHRoaXMub3B0aW9ucy4kYnJvd3Nlcixcblx0XHRcdCRwbGFjZWhvbGRlcjtcblxuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLnVwbG9hZGVyICkge1xuXHRcdFx0JHBsYWNlaG9sZGVyID0gdGhpcy4kKCcuYnJvd3NlcicpO1xuXG5cdFx0XHQvLyBDaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlcGxhY2VkIHRoZSBwbGFjZWhvbGRlci5cblx0XHRcdGlmICggJHBsYWNlaG9sZGVyWzBdID09PSAkYnJvd3NlclswXSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQkYnJvd3Nlci5kZXRhY2goKS50ZXh0KCAkcGxhY2Vob2xkZXIudGV4dCgpICk7XG5cdFx0XHQkYnJvd3NlclswXS5jbGFzc05hbWUgPSAkcGxhY2Vob2xkZXJbMF0uY2xhc3NOYW1lO1xuXHRcdFx0JHBsYWNlaG9sZGVyLnJlcGxhY2VXaXRoKCAkYnJvd3Nlci5zaG93KCkgKTtcblx0XHR9XG5cblx0XHR0aGlzLnJlZnJlc2goKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0c2hvdzogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdoaWRkZW4nICk7XG5cdH0sXG5cdGhpZGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnaGlkZGVuJyApO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVySW5saW5lO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlVwbG9hZGVyU3RhdHVzRXJyb3JcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFVwbG9hZGVyU3RhdHVzRXJyb3IgPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ3VwbG9hZC1lcnJvcicsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ3VwbG9hZGVyLXN0YXR1cy1lcnJvcicpXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRlclN0YXR1c0Vycm9yO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlVwbG9hZGVyU3RhdHVzXG4gKlxuICogQW4gdXBsb2FkZXIgc3RhdHVzIGZvciBvbi1nb2luZyB1cGxvYWRzLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdFVwbG9hZGVyU3RhdHVzO1xuXG5VcGxvYWRlclN0YXR1cyA9IFZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnbWVkaWEtdXBsb2FkZXItc3RhdHVzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgndXBsb2FkZXItc3RhdHVzJyksXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIC51cGxvYWQtZGlzbWlzcy1lcnJvcnMnOiAnZGlzbWlzcydcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnF1ZXVlID0gd3AuVXBsb2FkZXIucXVldWU7XG5cdFx0dGhpcy5xdWV1ZS5vbiggJ2FkZCByZW1vdmUgcmVzZXQnLCB0aGlzLnZpc2liaWxpdHksIHRoaXMgKTtcblx0XHR0aGlzLnF1ZXVlLm9uKCAnYWRkIHJlbW92ZSByZXNldCBjaGFuZ2U6cGVyY2VudCcsIHRoaXMucHJvZ3Jlc3MsIHRoaXMgKTtcblx0XHR0aGlzLnF1ZXVlLm9uKCAnYWRkIHJlbW92ZSByZXNldCBjaGFuZ2U6dXBsb2FkaW5nJywgdGhpcy5pbmZvLCB0aGlzICk7XG5cblx0XHR0aGlzLmVycm9ycyA9IHdwLlVwbG9hZGVyLmVycm9ycztcblx0XHR0aGlzLmVycm9ycy5yZXNldCgpO1xuXHRcdHRoaXMuZXJyb3JzLm9uKCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMudmlzaWJpbGl0eSwgdGhpcyApO1xuXHRcdHRoaXMuZXJyb3JzLm9uKCAnYWRkJywgdGhpcy5lcnJvciwgdGhpcyApO1xuXHR9LFxuXHQvKipcblx0ICogQGdsb2JhbCB3cC5VcGxvYWRlclxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5VcGxvYWRlclN0YXR1c31cblx0ICovXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHdwLlVwbG9hZGVyLnF1ZXVlLm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ2Rpc3Bvc2UnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3Ncblx0XHQgKi9cblx0XHRWaWV3LnByb3RvdHlwZS5kaXNwb3NlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHR2aXNpYmlsaXR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC50b2dnbGVDbGFzcyggJ3VwbG9hZGluZycsICEhIHRoaXMucXVldWUubGVuZ3RoICk7XG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdlcnJvcnMnLCAhISB0aGlzLmVycm9ycy5sZW5ndGggKTtcblx0XHR0aGlzLiRlbC50b2dnbGUoICEhIHRoaXMucXVldWUubGVuZ3RoIHx8ICEhIHRoaXMuZXJyb3JzLmxlbmd0aCApO1xuXHR9LFxuXG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHRfLmVhY2goe1xuXHRcdFx0JyRiYXInOiAgICAgICcubWVkaWEtcHJvZ3Jlc3MtYmFyIGRpdicsXG5cdFx0XHQnJGluZGV4JzogICAgJy51cGxvYWQtaW5kZXgnLFxuXHRcdFx0JyR0b3RhbCc6ICAgICcudXBsb2FkLXRvdGFsJyxcblx0XHRcdCckZmlsZW5hbWUnOiAnLnVwbG9hZC1maWxlbmFtZSdcblx0XHR9LCBmdW5jdGlvbiggc2VsZWN0b3IsIGtleSApIHtcblx0XHRcdHRoaXNbIGtleSBdID0gdGhpcy4kKCBzZWxlY3RvciApO1xuXHRcdH0sIHRoaXMgKTtcblxuXHRcdHRoaXMudmlzaWJpbGl0eSgpO1xuXHRcdHRoaXMucHJvZ3Jlc3MoKTtcblx0XHR0aGlzLmluZm8oKTtcblx0fSxcblxuXHRwcm9ncmVzczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHF1ZXVlID0gdGhpcy5xdWV1ZSxcblx0XHRcdCRiYXIgPSB0aGlzLiRiYXI7XG5cblx0XHRpZiAoICEgJGJhciB8fCAhIHF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQkYmFyLndpZHRoKCAoIHF1ZXVlLnJlZHVjZSggZnVuY3Rpb24oIG1lbW8sIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHRpZiAoICEgYXR0YWNobWVudC5nZXQoJ3VwbG9hZGluZycpICkge1xuXHRcdFx0XHRyZXR1cm4gbWVtbyArIDEwMDtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHBlcmNlbnQgPSBhdHRhY2htZW50LmdldCgncGVyY2VudCcpO1xuXHRcdFx0cmV0dXJuIG1lbW8gKyAoIF8uaXNOdW1iZXIoIHBlcmNlbnQgKSA/IHBlcmNlbnQgOiAxMDAgKTtcblx0XHR9LCAwICkgLyBxdWV1ZS5sZW5ndGggKSArICclJyApO1xuXHR9LFxuXG5cdGluZm86IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBxdWV1ZSA9IHRoaXMucXVldWUsXG5cdFx0XHRpbmRleCA9IDAsIGFjdGl2ZTtcblxuXHRcdGlmICggISBxdWV1ZS5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0YWN0aXZlID0gdGhpcy5xdWV1ZS5maW5kKCBmdW5jdGlvbiggYXR0YWNobWVudCwgaSApIHtcblx0XHRcdGluZGV4ID0gaTtcblx0XHRcdHJldHVybiBhdHRhY2htZW50LmdldCgndXBsb2FkaW5nJyk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLiRpbmRleC50ZXh0KCBpbmRleCArIDEgKTtcblx0XHR0aGlzLiR0b3RhbC50ZXh0KCBxdWV1ZS5sZW5ndGggKTtcblx0XHR0aGlzLiRmaWxlbmFtZS5odG1sKCBhY3RpdmUgPyB0aGlzLmZpbGVuYW1lKCBhY3RpdmUuZ2V0KCdmaWxlbmFtZScpICkgOiAnJyApO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdCAqL1xuXHRmaWxlbmFtZTogZnVuY3Rpb24oIGZpbGVuYW1lICkge1xuXHRcdHJldHVybiBfLmVzY2FwZSggZmlsZW5hbWUgKTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuTW9kZWx9IGVycm9yXG5cdCAqL1xuXHRlcnJvcjogZnVuY3Rpb24oIGVycm9yICkge1xuXHRcdHRoaXMudmlld3MuYWRkKCAnLnVwbG9hZC1lcnJvcnMnLCBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlclN0YXR1c0Vycm9yKHtcblx0XHRcdGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lKCBlcnJvci5nZXQoJ2ZpbGUnKS5uYW1lICksXG5cdFx0XHRtZXNzYWdlOiAgZXJyb3IuZ2V0KCdtZXNzYWdlJylcblx0XHR9KSwgeyBhdDogMCB9KTtcblx0fSxcblxuXHQvKipcblx0ICogQGdsb2JhbCB3cC5VcGxvYWRlclxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdGRpc21pc3M6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgZXJyb3JzID0gdGhpcy52aWV3cy5nZXQoJy51cGxvYWQtZXJyb3JzJyk7XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0aWYgKCBlcnJvcnMgKSB7XG5cdFx0XHRfLmludm9rZSggZXJyb3JzLCAncmVtb3ZlJyApO1xuXHRcdH1cblx0XHR3cC5VcGxvYWRlci5lcnJvcnMucmVzZXQoKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkZXJTdGF0dXM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuVXBsb2FkZXJXaW5kb3dcbiAqXG4gKiBBbiB1cGxvYWRlciB3aW5kb3cgdGhhdCBhbGxvd3MgZm9yIGRyYWdnaW5nIGFuZCBkcm9wcGluZyBtZWRpYS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdICAgICAgICAgICAgICAgICAgIE9wdGlvbnMgaGFzaCBwYXNzZWQgdG8gdGhlIHZpZXcuXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMudXBsb2FkZXJdICAgICAgICAgIFVwbG9hZGVyIHByb3BlcnRpZXMuXG4gKiBAcGFyYW0ge2pRdWVyeX0gW29wdGlvbnMudXBsb2FkZXIuYnJvd3Nlcl1cbiAqIEBwYXJhbSB7alF1ZXJ5fSBbb3B0aW9ucy51cGxvYWRlci5kcm9wem9uZV0galF1ZXJ5IGNvbGxlY3Rpb24gb2YgdGhlIGRyb3B6b25lLlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLnVwbG9hZGVyLnBhcmFtc11cbiAqL1xudmFyICQgPSBqUXVlcnksXG5cdFVwbG9hZGVyV2luZG93O1xuXG5VcGxvYWRlcldpbmRvdyA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2Jyxcblx0Y2xhc3NOYW1lOiAndXBsb2FkZXItd2luZG93Jyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgndXBsb2FkZXItd2luZG93JyksXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVwbG9hZGVyO1xuXG5cdFx0dGhpcy4kYnJvd3NlciA9ICQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJicm93c2VyXCIgLz4nKS5oaWRlKCkuYXBwZW5kVG8oJ2JvZHknKTtcblxuXHRcdHVwbG9hZGVyID0gdGhpcy5vcHRpb25zLnVwbG9hZGVyID0gXy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLnVwbG9hZGVyIHx8IHt9LCB7XG5cdFx0XHRkcm9wem9uZTogIHRoaXMuJGVsLFxuXHRcdFx0YnJvd3NlcjogICB0aGlzLiRicm93c2VyLFxuXHRcdFx0cGFyYW1zOiAgICB7fVxuXHRcdH0pO1xuXG5cdFx0Ly8gRW5zdXJlIHRoZSBkcm9wem9uZSBpcyBhIGpRdWVyeSBjb2xsZWN0aW9uLlxuXHRcdGlmICggdXBsb2FkZXIuZHJvcHpvbmUgJiYgISAodXBsb2FkZXIuZHJvcHpvbmUgaW5zdGFuY2VvZiAkKSApIHtcblx0XHRcdHVwbG9hZGVyLmRyb3B6b25lID0gJCggdXBsb2FkZXIuZHJvcHpvbmUgKTtcblx0XHR9XG5cblx0XHR0aGlzLmNvbnRyb2xsZXIub24oICdhY3RpdmF0ZScsIHRoaXMucmVmcmVzaCwgdGhpcyApO1xuXG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnZGV0YWNoJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLiRicm93c2VyLnJlbW92ZSgpO1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblxuXHRyZWZyZXNoOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMudXBsb2FkZXIgKSB7XG5cdFx0XHR0aGlzLnVwbG9hZGVyLnJlZnJlc2goKTtcblx0XHR9XG5cdH0sXG5cblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwb3N0SWQgPSB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuaWQsXG5cdFx0XHRkcm9wem9uZTtcblxuXHRcdC8vIElmIHRoZSB1cGxvYWRlciBhbHJlYWR5IGV4aXN0cywgYmFpbC5cblx0XHRpZiAoIHRoaXMudXBsb2FkZXIgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCBwb3N0SWQgKSB7XG5cdFx0XHR0aGlzLm9wdGlvbnMudXBsb2FkZXIucGFyYW1zLnBvc3RfaWQgPSBwb3N0SWQ7XG5cdFx0fVxuXHRcdHRoaXMudXBsb2FkZXIgPSBuZXcgd3AuVXBsb2FkZXIoIHRoaXMub3B0aW9ucy51cGxvYWRlciApO1xuXG5cdFx0ZHJvcHpvbmUgPSB0aGlzLnVwbG9hZGVyLmRyb3B6b25lO1xuXHRcdGRyb3B6b25lLm9uKCAnZHJvcHpvbmU6ZW50ZXInLCBfLmJpbmQoIHRoaXMuc2hvdywgdGhpcyApICk7XG5cdFx0ZHJvcHpvbmUub24oICdkcm9wem9uZTpsZWF2ZScsIF8uYmluZCggdGhpcy5oaWRlLCB0aGlzICkgKTtcblxuXHRcdCQoIHRoaXMudXBsb2FkZXIgKS5vbiggJ3VwbG9hZGVyOnJlYWR5JywgXy5iaW5kKCB0aGlzLl9yZWFkeSwgdGhpcyApICk7XG5cdH0sXG5cblx0X3JlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNvbnRyb2xsZXIudHJpZ2dlciggJ3VwbG9hZGVyOnJlYWR5JyApO1xuXHR9LFxuXG5cdHNob3c6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciAkZWwgPSB0aGlzLiRlbC5zaG93KCk7XG5cblx0XHQvLyBFbnN1cmUgdGhhdCB0aGUgYW5pbWF0aW9uIGlzIHRyaWdnZXJlZCBieSB3YWl0aW5nIHVudGlsXG5cdFx0Ly8gdGhlIHRyYW5zcGFyZW50IGVsZW1lbnQgaXMgcGFpbnRlZCBpbnRvIHRoZSBET00uXG5cdFx0Xy5kZWZlciggZnVuY3Rpb24oKSB7XG5cdFx0XHQkZWwuY3NzKHsgb3BhY2l0eTogMSB9KTtcblx0XHR9KTtcblx0fSxcblxuXHRoaWRlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgJGVsID0gdGhpcy4kZWwuY3NzKHsgb3BhY2l0eTogMCB9KTtcblxuXHRcdHdwLm1lZGlhLnRyYW5zaXRpb24oICRlbCApLmRvbmUoIGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gVHJhbnNpdGlvbiBlbmQgZXZlbnRzIGFyZSBzdWJqZWN0IHRvIHJhY2UgY29uZGl0aW9ucy5cblx0XHRcdC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSB2YWx1ZSBpcyBzZXQgYXMgaW50ZW5kZWQuXG5cdFx0XHRpZiAoICcwJyA9PT0gJGVsLmNzcygnb3BhY2l0eScpICkge1xuXHRcdFx0XHQkZWwuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gaHR0cHM6Ly9jb3JlLnRyYWMud29yZHByZXNzLm9yZy90aWNrZXQvMjczNDFcblx0XHRfLmRlbGF5KCBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggJzAnID09PSAkZWwuY3NzKCdvcGFjaXR5JykgJiYgJGVsLmlzKCc6dmlzaWJsZScpICkge1xuXHRcdFx0XHQkZWwuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH0sIDUwMCApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRlcldpbmRvdztcbiIsIi8qKlxuICogd3AubWVkaWEuVmlld1xuICpcbiAqIFRoZSBiYXNlIHZpZXcgY2xhc3MgZm9yIG1lZGlhLlxuICpcbiAqIFVuZGVsZWdhdGluZyBldmVudHMsIHJlbW92aW5nIGV2ZW50cyBmcm9tIHRoZSBtb2RlbCwgYW5kXG4gKiByZW1vdmluZyBldmVudHMgZnJvbSB0aGUgY29udHJvbGxlciBtaXJyb3IgdGhlIGNvZGUgZm9yXG4gKiBgQmFja2JvbmUuVmlldy5kaXNwb3NlYCBpbiBCYWNrYm9uZSAwLjkuOCBkZXZlbG9wbWVudC5cbiAqXG4gKiBUaGlzIGJlaGF2aW9yIGhhcyBzaW5jZSBiZWVuIHJlbW92ZWQsIGFuZCBzaG91bGQgbm90IGJlIHVzZWRcbiAqIG91dHNpZGUgb2YgdGhlIG1lZGlhIG1hbmFnZXIuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFZpZXcgPSB3cC5CYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cdGNvbnN0cnVjdG9yOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHRpZiAoIG9wdGlvbnMgJiYgb3B0aW9ucy5jb250cm9sbGVyICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyID0gb3B0aW9ucy5jb250cm9sbGVyO1xuXHRcdH1cblx0XHR3cC5CYWNrYm9uZS5WaWV3LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblx0LyoqXG5cdCAqIEB0b2RvIFRoZSBpbnRlcm5hbCBjb21tZW50IG1lbnRpb25zIHRoaXMgbWlnaHQgaGF2ZSBiZWVuIGEgc3RvcC1nYXBcblx0ICogICAgICAgYmVmb3JlIEJhY2tib25lIDAuOS44IGNhbWUgb3V0LiBGaWd1cmUgb3V0IGlmIEJhY2tib25lIGNvcmUgdGFrZXNcblx0ICogICAgICAgY2FyZSBvZiB0aGlzIGluIEJhY2tib25lLlZpZXcgbm93LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEuVmlld30gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIFVuZGVsZWdhdGluZyBldmVudHMsIHJlbW92aW5nIGV2ZW50cyBmcm9tIHRoZSBtb2RlbCwgYW5kXG5cdFx0Ly8gcmVtb3ZpbmcgZXZlbnRzIGZyb20gdGhlIGNvbnRyb2xsZXIgbWlycm9yIHRoZSBjb2RlIGZvclxuXHRcdC8vIGBCYWNrYm9uZS5WaWV3LmRpc3Bvc2VgIGluIEJhY2tib25lIDAuOS44IGRldmVsb3BtZW50LlxuXHRcdHRoaXMudW5kZWxlZ2F0ZUV2ZW50cygpO1xuXG5cdFx0aWYgKCB0aGlzLm1vZGVsICYmIHRoaXMubW9kZWwub2ZmICkge1xuXHRcdFx0dGhpcy5tb2RlbC5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMuY29sbGVjdGlvbiAmJiB0aGlzLmNvbGxlY3Rpb24ub2ZmICkge1xuXHRcdFx0dGhpcy5jb2xsZWN0aW9uLm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdH1cblxuXHRcdC8vIFVuYmluZCBjb250cm9sbGVyIGV2ZW50cy5cblx0XHRpZiAoIHRoaXMuY29udHJvbGxlciAmJiB0aGlzLmNvbnRyb2xsZXIub2ZmICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLm9mZiggbnVsbCwgbnVsbCwgdGhpcyApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLlZpZXd9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGlzcG9zZSgpO1xuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ3JlbW92ZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzc1xuXHRcdCAqL1xuXHRcdHJldHVybiB3cC5CYWNrYm9uZS5WaWV3LnByb3RvdHlwZS5yZW1vdmUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3O1xuIl19
