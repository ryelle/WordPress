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

		if ( ! this.options.sortable || ! $.fn.sortable ) {
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
		if ( ! this.options.sortable || ! $.fn.sortable ) {
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

	clickedOpenerEl: null,

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

		this.clickedOpenerEl = document.activeElement;

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

		// Put focus back in useful location once modal is closed.
		if ( null !== this.clickedOpenerEl ) {
			this.clickedOpenerEl.focus();
		} else {
			$( '#wpbody-content' ).focus();
		}

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
		placeholder: l10n.searchMediaPlaceholder
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvY29sbGVjdGlvbi1hZGQuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvY29sbGVjdGlvbi1lZGl0LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL2NvbnRyb2xsZXJzL2Nyb3BwZXIuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvY3VzdG9taXplLWltYWdlLWNyb3BwZXIuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvZWRpdC1pbWFnZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9lbWJlZC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9mZWF0dXJlZC1pbWFnZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9nYWxsZXJ5LWFkZC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9nYWxsZXJ5LWVkaXQuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvaW1hZ2UtZGV0YWlscy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9saWJyYXJ5LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL2NvbnRyb2xsZXJzL21lZGlhLWxpYnJhcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvcmVnaW9uLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL2NvbnRyb2xsZXJzL3JlcGxhY2UtaW1hZ2UuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvc2l0ZS1pY29uLWNyb3BwZXIuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvc3RhdGUtbWFjaGluZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS9jb250cm9sbGVycy9zdGF0ZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS91dGlscy9zZWxlY3Rpb24tc3luYy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy5tYW5pZmVzdC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50LWNvbXBhdC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC1maWx0ZXJzL2FsbC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMvZGF0ZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMvdXBsb2FkZWQuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50L2RldGFpbHMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC9lZGl0LWxpYnJhcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC9lZGl0LXNlbGVjdGlvbi5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50L2xpYnJhcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC9zZWxlY3Rpb24uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudHMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudHMvYnJvd3Nlci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9hdHRhY2htZW50cy9zZWxlY3Rpb24uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYnV0dG9uLWdyb3VwLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2J1dHRvbi5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9jcm9wcGVyLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2VkaXQtaW1hZ2UuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZW1iZWQuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZW1iZWQvaW1hZ2UuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZW1iZWQvbGluay5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9lbWJlZC91cmwuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZm9jdXMtbWFuYWdlci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9mcmFtZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9mcmFtZS9pbWFnZS1kZXRhaWxzLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2ZyYW1lL3Bvc3QuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZnJhbWUvc2VsZWN0LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2lmcmFtZS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9pbWFnZS1kZXRhaWxzLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2xhYmVsLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL21lZGlhLWZyYW1lLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL21lbnUtaXRlbS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9tZW51LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL21vZGFsLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3ByaW9yaXR5LWxpc3QuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvcm91dGVyLWl0ZW0uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvcm91dGVyLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3NlYXJjaC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9zZWxlY3Rpb24uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvc2V0dGluZ3MuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvc2V0dGluZ3MvYXR0YWNobWVudC1kaXNwbGF5LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3NldHRpbmdzL2dhbGxlcnkuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvc2V0dGluZ3MvcGxheWxpc3QuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3Mvc2lkZWJhci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9zaXRlLWljb24tY3JvcHBlci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9zaXRlLWljb24tcHJldmlldy5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9zcGlubmVyLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3Rvb2xiYXIuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvdG9vbGJhci9lbWJlZC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy90b29sYmFyL3NlbGVjdC5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy91cGxvYWRlci9lZGl0b3IuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvdXBsb2FkZXIvaW5saW5lLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3VwbG9hZGVyL3N0YXR1cy1lcnJvci5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy91cGxvYWRlci9zdGF0dXMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvdXBsb2FkZXIvd2luZG93LmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL3ZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzd0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5Db2xsZWN0aW9uQWRkXG4gKlxuICogQSBzdGF0ZSBmb3IgYWRkaW5nIGF0dGFjaG1lbnRzIHRvIGEgY29sbGVjdGlvbiAoZS5nLiB2aWRlbyBwbGF5bGlzdCkuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXNdICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBhdHRyaWJ1dGVzIGhhc2ggcGFzc2VkIHRvIHRoZSBzdGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmlkPWxpYnJhcnldICAgICAgVW5pcXVlIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnRpdGxlICAgICAgICAgICAgICAgICAgICBUaXRsZSBmb3IgdGhlIHN0YXRlLiBEaXNwbGF5cyBpbiB0aGUgZnJhbWUncyB0aXRsZSByZWdpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5tdWx0aXBsZT1hZGRdICAgICAgICAgICAgV2hldGhlciBtdWx0aS1zZWxlY3QgaXMgZW5hYmxlZC4gQHRvZG8gJ2FkZCcgZG9lc24ndCBzZWVtIGRvIGFueXRoaW5nIHNwZWNpYWwsIGFuZCBnZXRzIHVzZWQgYXMgYSBib29sZWFuLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gW2F0dHJpYnV0ZXMubGlicmFyeV0gICAgICAgICAgICAgICAgIFRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uIHRvIGJyb3dzZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiBvbmUgaXMgbm90IHN1cHBsaWVkLCBhIGNvbGxlY3Rpb24gb2YgYXR0YWNobWVudHMgb2YgdGhlIHNwZWNpZmllZCB0eXBlIHdpbGwgYmUgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbnxzdHJpbmd9ICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmZpbHRlcmFibGU9dXBsb2FkZWRdICAgICBXaGV0aGVyIHRoZSBsaWJyYXJ5IGlzIGZpbHRlcmFibGUsIGFuZCBpZiBzbyB3aGF0IGZpbHRlcnMgc2hvdWxkIGJlIHNob3duLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjY2VwdHMgJ2FsbCcsICd1cGxvYWRlZCcsIG9yICd1bmF0dGFjaGVkJy5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm1lbnU9Z2FsbGVyeV0gICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBtZW51IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnQ9dXBsb2FkXSAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBjb250ZW50IHJlZ2lvbi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPdmVycmlkZGVuIGJ5IHBlcnNpc3RlbnQgdXNlciBzZXR0aW5nIGlmICdjb250ZW50VXNlclNldHRpbmcnIGlzIHRydWUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5yb3V0ZXI9YnJvd3NlXSAgICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgcm91dGVyIHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRvb2xiYXI9Z2FsbGVyeS1hZGRdICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSB0b29sYmFyIHJlZ2lvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNlYXJjaGFibGU9dHJ1ZV0gICAgICAgICBXaGV0aGVyIHRoZSBsaWJyYXJ5IGlzIHNlYXJjaGFibGUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zb3J0YWJsZT10cnVlXSAgICAgICAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2hvdWxkIGJlIHNvcnRhYmxlLiBEZXBlbmRzIG9uIHRoZSBvcmRlcmJ5IHByb3BlcnR5IGJlaW5nIHNldCB0byBtZW51T3JkZXIgb24gdGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5hdXRvU2VsZWN0PXRydWVdICAgICAgICAgV2hldGhlciBhbiB1cGxvYWRlZCBhdHRhY2htZW50IHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGFkZGVkIHRvIHRoZSBzZWxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb250ZW50VXNlclNldHRpbmc9dHJ1ZV0gV2hldGhlciB0aGUgY29udGVudCByZWdpb24ncyBtb2RlIHNob3VsZCBiZSBzZXQgYW5kIHBlcnNpc3RlZCBwZXIgdXNlci5cbiAqIEBwYXJhbSB7aW50fSAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnByaW9yaXR5PTEwMF0gICAgICAgICAgICBUaGUgcHJpb3JpdHkgZm9yIHRoZSBzdGF0ZSBsaW5rIGluIHRoZSBtZWRpYSBtZW51LlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc3luY1NlbGVjdGlvbj1mYWxzZV0gICAgIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNlbGVjdGlvbiBzaG91bGQgYmUgcGVyc2lzdGVkIGZyb20gdGhlIGxhc3Qgc3RhdGUuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGVmYXVsdHMgdG8gZmFsc2UgYmVjYXVzZSBmb3IgdGhpcyBzdGF0ZSwgYmVjYXVzZSB0aGUgbGlicmFyeSBvZiB0aGUgRWRpdCBHYWxsZXJ5IHN0YXRlIGlzIHRoZSBzZWxlY3Rpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnR5cGUgICAgICAgICAgICAgICAgICAgVGhlIGNvbGxlY3Rpb24ncyBtZWRpYSB0eXBlLiAoZS5nLiAndmlkZW8nKS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY29sbGVjdGlvblR5cGUgICAgICAgICBUaGUgY29sbGVjdGlvbiB0eXBlLiAoZS5nLiAncGxheWxpc3QnKS5cbiAqL1xudmFyIFNlbGVjdGlvbiA9IHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbixcblx0TGlicmFyeSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeSxcblx0Q29sbGVjdGlvbkFkZDtcblxuQ29sbGVjdGlvbkFkZCA9IExpYnJhcnkuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IF8uZGVmYXVsdHMoIHtcblx0XHQvLyBTZWxlY3Rpb24gZGVmYXVsdHMuIEBzZWUgbWVkaWEubW9kZWwuU2VsZWN0aW9uXG5cdFx0bXVsdGlwbGU6ICAgICAgJ2FkZCcsXG5cdFx0Ly8gQXR0YWNobWVudHMgYnJvd3NlciBkZWZhdWx0cy4gQHNlZSBtZWRpYS52aWV3LkF0dGFjaG1lbnRzQnJvd3NlclxuXHRcdGZpbHRlcmFibGU6ICAgICd1cGxvYWRlZCcsXG5cblx0XHRwcmlvcml0eTogICAgICAxMDAsXG5cdFx0c3luY1NlbGVjdGlvbjogZmFsc2Vcblx0fSwgTGlicmFyeS5wcm90b3R5cGUuZGVmYXVsdHMgKSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29sbGVjdGlvblR5cGUgPSB0aGlzLmdldCgnY29sbGVjdGlvblR5cGUnKTtcblxuXHRcdGlmICggJ3ZpZGVvJyA9PT0gdGhpcy5nZXQoICd0eXBlJyApICkge1xuXHRcdFx0Y29sbGVjdGlvblR5cGUgPSAndmlkZW8tJyArIGNvbGxlY3Rpb25UeXBlO1xuXHRcdH1cblxuXHRcdHRoaXMuc2V0KCAnaWQnLCBjb2xsZWN0aW9uVHlwZSArICctbGlicmFyeScgKTtcblx0XHR0aGlzLnNldCggJ3Rvb2xiYXInLCBjb2xsZWN0aW9uVHlwZSArICctYWRkJyApO1xuXHRcdHRoaXMuc2V0KCAnbWVudScsIGNvbGxlY3Rpb25UeXBlICk7XG5cblx0XHQvLyBJZiB3ZSBoYXZlbid0IGJlZW4gcHJvdmlkZWQgYSBgbGlicmFyeWAsIGNyZWF0ZSBhIGBTZWxlY3Rpb25gLlxuXHRcdGlmICggISB0aGlzLmdldCgnbGlicmFyeScpICkge1xuXHRcdFx0dGhpcy5zZXQoICdsaWJyYXJ5Jywgd3AubWVkaWEucXVlcnkoeyB0eXBlOiB0aGlzLmdldCgndHlwZScpIH0pICk7XG5cdFx0fVxuXHRcdExpYnJhcnkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGlicmFyeSA9IHRoaXMuZ2V0KCdsaWJyYXJ5JyksXG5cdFx0XHRlZGl0TGlicmFyeSA9IHRoaXMuZ2V0KCdlZGl0TGlicmFyeScpLFxuXHRcdFx0ZWRpdCA9IHRoaXMuZnJhbWUuc3RhdGUoIHRoaXMuZ2V0KCdjb2xsZWN0aW9uVHlwZScpICsgJy1lZGl0JyApLmdldCgnbGlicmFyeScpO1xuXG5cdFx0aWYgKCBlZGl0TGlicmFyeSAmJiBlZGl0TGlicmFyeSAhPT0gZWRpdCApIHtcblx0XHRcdGxpYnJhcnkudW5vYnNlcnZlKCBlZGl0TGlicmFyeSApO1xuXHRcdH1cblxuXHRcdC8vIEFjY2VwdHMgYXR0YWNobWVudHMgdGhhdCBleGlzdCBpbiB0aGUgb3JpZ2luYWwgbGlicmFyeSBhbmRcblx0XHQvLyB0aGF0IGRvIG5vdCBleGlzdCBpbiBnYWxsZXJ5J3MgbGlicmFyeS5cblx0XHRsaWJyYXJ5LnZhbGlkYXRvciA9IGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdFx0cmV0dXJuICEhIHRoaXMubWlycm9yaW5nLmdldCggYXR0YWNobWVudC5jaWQgKSAmJiAhIGVkaXQuZ2V0KCBhdHRhY2htZW50LmNpZCApICYmIFNlbGVjdGlvbi5wcm90b3R5cGUudmFsaWRhdG9yLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR9O1xuXG5cdFx0Ly8gUmVzZXQgdGhlIGxpYnJhcnkgdG8gZW5zdXJlIHRoYXQgYWxsIGF0dGFjaG1lbnRzIGFyZSByZS1hZGRlZFxuXHRcdC8vIHRvIHRoZSBjb2xsZWN0aW9uLiBEbyBzbyBzaWxlbnRseSwgYXMgY2FsbGluZyBgb2JzZXJ2ZWAgd2lsbFxuXHRcdC8vIHRyaWdnZXIgdGhlIGByZXNldGAgZXZlbnQuXG5cdFx0bGlicmFyeS5yZXNldCggbGlicmFyeS5taXJyb3JpbmcubW9kZWxzLCB7IHNpbGVudDogdHJ1ZSB9KTtcblx0XHRsaWJyYXJ5Lm9ic2VydmUoIGVkaXQgKTtcblx0XHR0aGlzLnNldCgnZWRpdExpYnJhcnknLCBlZGl0KTtcblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmFjdGl2YXRlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdGlvbkFkZDtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5Db2xsZWN0aW9uRWRpdFxuICpcbiAqIEEgc3RhdGUgZm9yIGVkaXRpbmcgYSBjb2xsZWN0aW9uLCB3aGljaCBpcyB1c2VkIGJ5IGF1ZGlvIGFuZCB2aWRlbyBwbGF5bGlzdHMsXG4gKiBhbmQgY2FuIGJlIHVzZWQgZm9yIG90aGVyIGNvbGxlY3Rpb25zLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzXSAgICAgICAgICAgICAgICAgICAgICBUaGUgYXR0cmlidXRlcyBoYXNoIHBhc3NlZCB0byB0aGUgc3RhdGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnRpdGxlICAgICAgICAgICAgICAgICAgVGl0bGUgZm9yIHRoZSBzdGF0ZS4gRGlzcGxheXMgaW4gdGhlIG1lZGlhIG1lbnUgYW5kIHRoZSBmcmFtZSdzIHRpdGxlIHJlZ2lvbi5cbiAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9IFthdHRyaWJ1dGVzLmxpYnJhcnldICAgICAgICAgICAgICBUaGUgYXR0YWNobWVudHMgY29sbGVjdGlvbiB0byBlZGl0LlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElmIG9uZSBpcyBub3Qgc3VwcGxpZWQsIGFuIGVtcHR5IG1lZGlhLm1vZGVsLlNlbGVjdGlvbiBjb2xsZWN0aW9uIGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5tdWx0aXBsZT1mYWxzZV0gICAgICAgV2hldGhlciBtdWx0aS1zZWxlY3QgaXMgZW5hYmxlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnQ9YnJvd3NlXSAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBjb250ZW50IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMubWVudSAgICAgICAgICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBtZW51IHJlZ2lvbi4gQHRvZG8gdGhpcyBuZWVkcyBhIGJldHRlciBleHBsYW5hdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNlYXJjaGFibGU9ZmFsc2VdICAgICBXaGV0aGVyIHRoZSBsaWJyYXJ5IGlzIHNlYXJjaGFibGUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zb3J0YWJsZT10cnVlXSAgICAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2hvdWxkIGJlIHNvcnRhYmxlLiBEZXBlbmRzIG9uIHRoZSBvcmRlcmJ5IHByb3BlcnR5IGJlaW5nIHNldCB0byBtZW51T3JkZXIgb24gdGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5kYXRlPXRydWVdICAgICAgICAgICAgV2hldGhlciB0byBzaG93IHRoZSBkYXRlIGZpbHRlciBpbiB0aGUgYnJvd3NlcidzIHRvb2xiYXIuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5kZXNjcmliZT10cnVlXSAgICAgICAgV2hldGhlciB0byBvZmZlciBVSSB0byBkZXNjcmliZSB0aGUgYXR0YWNobWVudHMgLSBlLmcuIGNhcHRpb25pbmcgaW1hZ2VzIGluIGEgZ2FsbGVyeS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmRyYWdJbmZvPXRydWVdICAgICAgICBXaGV0aGVyIHRvIHNob3cgaW5zdHJ1Y3Rpb25hbCB0ZXh0IGFib3V0IHRoZSBhdHRhY2htZW50cyBiZWluZyBzb3J0YWJsZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmRyYWdJbmZvVGV4dF0gICAgICAgICBJbnN0cnVjdGlvbmFsIHRleHQgYWJvdXQgdGhlIGF0dGFjaG1lbnRzIGJlaW5nIHNvcnRhYmxlLlxuICogQHBhcmFtIHtpbnR9ICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuaWRlYWxDb2x1bW5XaWR0aD0xNzBdIFRoZSBpZGVhbCBjb2x1bW4gd2lkdGggaW4gcGl4ZWxzIGZvciBhdHRhY2htZW50cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmVkaXRpbmc9ZmFsc2VdICAgICAgICBXaGV0aGVyIHRoZSBnYWxsZXJ5IGlzIGJlaW5nIGNyZWF0ZWQsIG9yIGVkaXRpbmcgYW4gZXhpc3RpbmcgaW5zdGFuY2UuXG4gKiBAcGFyYW0ge2ludH0gICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5wcmlvcml0eT02MF0gICAgICAgICAgVGhlIHByaW9yaXR5IGZvciB0aGUgc3RhdGUgbGluayBpbiB0aGUgbWVkaWEgbWVudS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnN5bmNTZWxlY3Rpb249ZmFsc2VdICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzZWxlY3Rpb24gc2hvdWxkIGJlIHBlcnNpc3RlZCBmcm9tIHRoZSBsYXN0IHN0YXRlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERlZmF1bHRzIHRvIGZhbHNlIGZvciB0aGlzIHN0YXRlLCBiZWNhdXNlIHRoZSBsaWJyYXJ5IHBhc3NlZCBpbiAgKmlzKiB0aGUgc2VsZWN0aW9uLlxuICogQHBhcmFtIHt2aWV3fSAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuU2V0dGluZ3NWaWV3XSAgICAgICAgIFRoZSB2aWV3IHRvIGVkaXQgdGhlIGNvbGxlY3Rpb24gaW5zdGFuY2Ugc2V0dGluZ3MgKGUuZy4gUGxheWxpc3Qgc2V0dGluZ3Mgd2l0aCBcIlNob3cgdHJhY2tsaXN0XCIgY2hlY2tib3gpLlxuICogQHBhcmFtIHt2aWV3fSAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuQXR0YWNobWVudFZpZXddICAgICAgIFRoZSBzaW5nbGUgYEF0dGFjaG1lbnRgIHZpZXcgdG8gYmUgdXNlZCBpbiB0aGUgYEF0dGFjaG1lbnRzYC5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiBub25lIHN1cHBsaWVkLCBkZWZhdWx0cyB0byB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRWRpdExpYnJhcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnR5cGUgICAgICAgICAgICAgICAgICAgVGhlIGNvbGxlY3Rpb24ncyBtZWRpYSB0eXBlLiAoZS5nLiAndmlkZW8nKS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY29sbGVjdGlvblR5cGUgICAgICAgICBUaGUgY29sbGVjdGlvbiB0eXBlLiAoZS5nLiAncGxheWxpc3QnKS5cbiAqL1xudmFyIExpYnJhcnkgPSB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnksXG5cdGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdCQgPSBqUXVlcnksXG5cdENvbGxlY3Rpb25FZGl0O1xuXG5Db2xsZWN0aW9uRWRpdCA9IExpYnJhcnkuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IHtcblx0XHRtdWx0aXBsZTogICAgICAgICBmYWxzZSxcblx0XHRzb3J0YWJsZTogICAgICAgICB0cnVlLFxuXHRcdGRhdGU6ICAgICAgICAgICAgIGZhbHNlLFxuXHRcdHNlYXJjaGFibGU6ICAgICAgIGZhbHNlLFxuXHRcdGNvbnRlbnQ6ICAgICAgICAgICdicm93c2UnLFxuXHRcdGRlc2NyaWJlOiAgICAgICAgIHRydWUsXG5cdFx0ZHJhZ0luZm86ICAgICAgICAgdHJ1ZSxcblx0XHRpZGVhbENvbHVtbldpZHRoOiAxNzAsXG5cdFx0ZWRpdGluZzogICAgICAgICAgZmFsc2UsXG5cdFx0cHJpb3JpdHk6ICAgICAgICAgNjAsXG5cdFx0U2V0dGluZ3NWaWV3OiAgICAgZmFsc2UsXG5cdFx0c3luY1NlbGVjdGlvbjogICAgZmFsc2Vcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29sbGVjdGlvblR5cGUgPSB0aGlzLmdldCgnY29sbGVjdGlvblR5cGUnKTtcblxuXHRcdGlmICggJ3ZpZGVvJyA9PT0gdGhpcy5nZXQoICd0eXBlJyApICkge1xuXHRcdFx0Y29sbGVjdGlvblR5cGUgPSAndmlkZW8tJyArIGNvbGxlY3Rpb25UeXBlO1xuXHRcdH1cblxuXHRcdHRoaXMuc2V0KCAnaWQnLCBjb2xsZWN0aW9uVHlwZSArICctZWRpdCcgKTtcblx0XHR0aGlzLnNldCggJ3Rvb2xiYXInLCBjb2xsZWN0aW9uVHlwZSArICctZWRpdCcgKTtcblxuXHRcdC8vIElmIHdlIGhhdmVuJ3QgYmVlbiBwcm92aWRlZCBhIGBsaWJyYXJ5YCwgY3JlYXRlIGEgYFNlbGVjdGlvbmAuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdsaWJyYXJ5JykgKSB7XG5cdFx0XHR0aGlzLnNldCggJ2xpYnJhcnknLCBuZXcgd3AubWVkaWEubW9kZWwuU2VsZWN0aW9uKCkgKTtcblx0XHR9XG5cdFx0Ly8gVGhlIHNpbmdsZSBgQXR0YWNobWVudGAgdmlldyB0byBiZSB1c2VkIGluIHRoZSBgQXR0YWNobWVudHNgIHZpZXcuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdBdHRhY2htZW50VmlldycpICkge1xuXHRcdFx0dGhpcy5zZXQoICdBdHRhY2htZW50VmlldycsIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5FZGl0TGlicmFyeSApO1xuXHRcdH1cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxpYnJhcnkgPSB0aGlzLmdldCgnbGlicmFyeScpO1xuXG5cdFx0Ly8gTGltaXQgdGhlIGxpYnJhcnkgdG8gaW1hZ2VzIG9ubHkuXG5cdFx0bGlicmFyeS5wcm9wcy5zZXQoICd0eXBlJywgdGhpcy5nZXQoICd0eXBlJyApICk7XG5cblx0XHQvLyBXYXRjaCBmb3IgdXBsb2FkZWQgYXR0YWNobWVudHMuXG5cdFx0dGhpcy5nZXQoJ2xpYnJhcnknKS5vYnNlcnZlKCB3cC5VcGxvYWRlci5xdWV1ZSApO1xuXG5cdFx0dGhpcy5mcmFtZS5vbiggJ2NvbnRlbnQ6cmVuZGVyOmJyb3dzZScsIHRoaXMucmVuZGVyU2V0dGluZ3MsIHRoaXMgKTtcblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmFjdGl2YXRlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHQvLyBTdG9wIHdhdGNoaW5nIGZvciB1cGxvYWRlZCBhdHRhY2htZW50cy5cblx0XHR0aGlzLmdldCgnbGlicmFyeScpLnVub2JzZXJ2ZSggd3AuVXBsb2FkZXIucXVldWUgKTtcblxuXHRcdHRoaXMuZnJhbWUub2ZmKCAnY29udGVudDpyZW5kZXI6YnJvd3NlJywgdGhpcy5yZW5kZXJTZXR0aW5ncywgdGhpcyApO1xuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuZGVhY3RpdmF0ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlciB0aGUgY29sbGVjdGlvbiBlbWJlZCBzZXR0aW5ncyB2aWV3IGluIHRoZSBicm93c2VyIHNpZGViYXIuXG5cdCAqXG5cdCAqIEB0b2RvIFRoaXMgaXMgYWdhaW5zdCB0aGUgcGF0dGVybiBlbHNld2hlcmUgaW4gbWVkaWEuIFR5cGljYWxseSB0aGUgZnJhbWVcblx0ICogICAgICAgaXMgcmVzcG9uc2libGUgZm9yIGFkZGluZyByZWdpb24gbW9kZSBjYWxsYmFja3MuIEV4cGxhaW4uXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjkuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLnZpZXcuYXR0YWNobWVudHNCcm93c2VyfSBUaGUgYXR0YWNobWVudHMgYnJvd3NlciB2aWV3LlxuXHQgKi9cblx0cmVuZGVyU2V0dGluZ3M6IGZ1bmN0aW9uKCBhdHRhY2htZW50c0Jyb3dzZXJWaWV3ICkge1xuXHRcdHZhciBsaWJyYXJ5ID0gdGhpcy5nZXQoJ2xpYnJhcnknKSxcblx0XHRcdGNvbGxlY3Rpb25UeXBlID0gdGhpcy5nZXQoJ2NvbGxlY3Rpb25UeXBlJyksXG5cdFx0XHRkcmFnSW5mb1RleHQgPSB0aGlzLmdldCgnZHJhZ0luZm9UZXh0JyksXG5cdFx0XHRTZXR0aW5nc1ZpZXcgPSB0aGlzLmdldCgnU2V0dGluZ3NWaWV3JyksXG5cdFx0XHRvYmogPSB7fTtcblxuXHRcdGlmICggISBsaWJyYXJ5IHx8ICEgYXR0YWNobWVudHNCcm93c2VyVmlldyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsaWJyYXJ5WyBjb2xsZWN0aW9uVHlwZSBdID0gbGlicmFyeVsgY29sbGVjdGlvblR5cGUgXSB8fCBuZXcgQmFja2JvbmUuTW9kZWwoKTtcblxuXHRcdG9ialsgY29sbGVjdGlvblR5cGUgXSA9IG5ldyBTZXR0aW5nc1ZpZXcoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdG1vZGVsOiAgICAgIGxpYnJhcnlbIGNvbGxlY3Rpb25UeXBlIF0sXG5cdFx0XHRwcmlvcml0eTogICA0MFxuXHRcdH0pO1xuXG5cdFx0YXR0YWNobWVudHNCcm93c2VyVmlldy5zaWRlYmFyLnNldCggb2JqICk7XG5cblx0XHRpZiAoIGRyYWdJbmZvVGV4dCApIHtcblx0XHRcdGF0dGFjaG1lbnRzQnJvd3NlclZpZXcudG9vbGJhci5zZXQoICdkcmFnSW5mbycsIG5ldyB3cC5tZWRpYS5WaWV3KHtcblx0XHRcdFx0ZWw6ICQoICc8ZGl2IGNsYXNzPVwiaW5zdHJ1Y3Rpb25zXCI+JyArIGRyYWdJbmZvVGV4dCArICc8L2Rpdj4nIClbMF0sXG5cdFx0XHRcdHByaW9yaXR5OiAtNDBcblx0XHRcdH0pICk7XG5cdFx0fVxuXG5cdFx0Ly8gQWRkIHRoZSAnUmV2ZXJzZSBvcmRlcicgYnV0dG9uIHRvIHRoZSB0b29sYmFyLlxuXHRcdGF0dGFjaG1lbnRzQnJvd3NlclZpZXcudG9vbGJhci5zZXQoICdyZXZlcnNlJywge1xuXHRcdFx0dGV4dDogICAgIGwxMG4ucmV2ZXJzZU9yZGVyLFxuXHRcdFx0cHJpb3JpdHk6IDgwLFxuXG5cdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGxpYnJhcnkucmVzZXQoIGxpYnJhcnkudG9BcnJheSgpLnJldmVyc2UoKSApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uRWRpdDtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5Dcm9wcGVyXG4gKlxuICogQSBzdGF0ZSBmb3IgY3JvcHBpbmcgYW4gaW1hZ2UuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKi9cbnZhciBsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRDcm9wcGVyO1xuXG5Dcm9wcGVyID0gd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZS5leHRlbmQoe1xuXHRkZWZhdWx0czoge1xuXHRcdGlkOiAgICAgICAgICAnY3JvcHBlcicsXG5cdFx0dGl0bGU6ICAgICAgIGwxMG4uY3JvcEltYWdlLFxuXHRcdC8vIFJlZ2lvbiBtb2RlIGRlZmF1bHRzLlxuXHRcdHRvb2xiYXI6ICAgICAnY3JvcCcsXG5cdFx0Y29udGVudDogICAgICdjcm9wJyxcblx0XHRyb3V0ZXI6ICAgICAgZmFsc2UsXG5cdFx0Y2FuU2tpcENyb3A6IGZhbHNlLFxuXG5cdFx0Ly8gRGVmYXVsdCBkb0Nyb3AgQWpheCBhcmd1bWVudHMgdG8gYWxsb3cgdGhlIEN1c3RvbWl6ZXIgKGZvciBleGFtcGxlKSB0byBpbmplY3Qgc3RhdGUuXG5cdFx0ZG9Dcm9wQXJnczoge31cblx0fSxcblxuXHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mcmFtZS5vbiggJ2NvbnRlbnQ6Y3JlYXRlOmNyb3AnLCB0aGlzLmNyZWF0ZUNyb3BDb250ZW50LCB0aGlzICk7XG5cdFx0dGhpcy5mcmFtZS5vbiggJ2Nsb3NlJywgdGhpcy5yZW1vdmVDcm9wcGVyLCB0aGlzICk7XG5cdFx0dGhpcy5zZXQoJ3NlbGVjdGlvbicsIG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKHRoaXMuZnJhbWUuX3NlbGVjdGlvbi5zaW5nbGUpKTtcblx0fSxcblxuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZyYW1lLnRvb2xiYXIubW9kZSgnYnJvd3NlJyk7XG5cdH0sXG5cblx0Y3JlYXRlQ3JvcENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY3JvcHBlclZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5Dcm9wcGVyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRhdHRhY2htZW50OiB0aGlzLmdldCgnc2VsZWN0aW9uJykuZmlyc3QoKVxuXHRcdH0pO1xuXHRcdHRoaXMuY3JvcHBlclZpZXcub24oJ2ltYWdlLWxvYWRlZCcsIHRoaXMuY3JlYXRlQ3JvcFRvb2xiYXIsIHRoaXMpO1xuXHRcdHRoaXMuZnJhbWUuY29udGVudC5zZXQodGhpcy5jcm9wcGVyVmlldyk7XG5cblx0fSxcblx0cmVtb3ZlQ3JvcHBlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5pbWdTZWxlY3QuY2FuY2VsU2VsZWN0aW9uKCk7XG5cdFx0dGhpcy5pbWdTZWxlY3Quc2V0T3B0aW9ucyh7cmVtb3ZlOiB0cnVlfSk7XG5cdFx0dGhpcy5pbWdTZWxlY3QudXBkYXRlKCk7XG5cdFx0dGhpcy5jcm9wcGVyVmlldy5yZW1vdmUoKTtcblx0fSxcblx0Y3JlYXRlQ3JvcFRvb2xiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjYW5Ta2lwQ3JvcCwgdG9vbGJhck9wdGlvbnM7XG5cblx0XHRjYW5Ta2lwQ3JvcCA9IHRoaXMuZ2V0KCdjYW5Ta2lwQ3JvcCcpIHx8IGZhbHNlO1xuXG5cdFx0dG9vbGJhck9wdGlvbnMgPSB7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmZyYW1lLFxuXHRcdFx0aXRlbXM6IHtcblx0XHRcdFx0aW5zZXJ0OiB7XG5cdFx0XHRcdFx0c3R5bGU6ICAgICdwcmltYXJ5Jyxcblx0XHRcdFx0XHR0ZXh0OiAgICAgbDEwbi5jcm9wSW1hZ2UsXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDgwLFxuXHRcdFx0XHRcdHJlcXVpcmVzOiB7IGxpYnJhcnk6IGZhbHNlLCBzZWxlY3Rpb246IGZhbHNlIH0sXG5cblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgY29udHJvbGxlciA9IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRcdFx0c2VsZWN0aW9uO1xuXG5cdFx0XHRcdFx0XHRzZWxlY3Rpb24gPSBjb250cm9sbGVyLnN0YXRlKCkuZ2V0KCdzZWxlY3Rpb24nKS5maXJzdCgpO1xuXHRcdFx0XHRcdFx0c2VsZWN0aW9uLnNldCh7Y3JvcERldGFpbHM6IGNvbnRyb2xsZXIuc3RhdGUoKS5pbWdTZWxlY3QuZ2V0U2VsZWN0aW9uKCl9KTtcblxuXHRcdFx0XHRcdFx0dGhpcy4kZWwudGV4dChsMTBuLmNyb3BwaW5nKTtcblx0XHRcdFx0XHRcdHRoaXMuJGVsLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuc3RhdGUoKS5kb0Nyb3AoIHNlbGVjdGlvbiApLmRvbmUoIGZ1bmN0aW9uKCBjcm9wcGVkSW1hZ2UgKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIudHJpZ2dlcignY3JvcHBlZCcsIGNyb3BwZWRJbWFnZSApO1xuXHRcdFx0XHRcdFx0XHRjb250cm9sbGVyLmNsb3NlKCk7XG5cdFx0XHRcdFx0XHR9KS5mYWlsKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci50cmlnZ2VyKCdjb250ZW50OmVycm9yOmNyb3AnKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRpZiAoIGNhblNraXBDcm9wICkge1xuXHRcdFx0Xy5leHRlbmQoIHRvb2xiYXJPcHRpb25zLml0ZW1zLCB7XG5cdFx0XHRcdHNraXA6IHtcblx0XHRcdFx0XHRzdHlsZTogICAgICAnc2Vjb25kYXJ5Jyxcblx0XHRcdFx0XHR0ZXh0OiAgICAgICBsMTBuLnNraXBDcm9wcGluZyxcblx0XHRcdFx0XHRwcmlvcml0eTogICA3MCxcblx0XHRcdFx0XHRyZXF1aXJlczogICB7IGxpYnJhcnk6IGZhbHNlLCBzZWxlY3Rpb246IGZhbHNlIH0sXG5cdFx0XHRcdFx0Y2xpY2s6ICAgICAgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgc2VsZWN0aW9uID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCdzZWxlY3Rpb24nKS5maXJzdCgpO1xuXHRcdFx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnN0YXRlKCkuY3JvcHBlclZpZXcucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHR0aGlzLmNvbnRyb2xsZXIudHJpZ2dlcignc2tpcHBlZGNyb3AnLCBzZWxlY3Rpb24pO1xuXHRcdFx0XHRcdFx0dGhpcy5jb250cm9sbGVyLmNsb3NlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHR0aGlzLmZyYW1lLnRvb2xiYXIuc2V0KCBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHRvb2xiYXJPcHRpb25zKSApO1xuXHR9LFxuXG5cdGRvQ3JvcDogZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0cmV0dXJuIHdwLmFqYXgucG9zdCggJ2N1c3RvbS1oZWFkZXItY3JvcCcsIF8uZXh0ZW5kKFxuXHRcdFx0e30sXG5cdFx0XHR0aGlzLmRlZmF1bHRzLmRvQ3JvcEFyZ3MsXG5cdFx0XHR7XG5cdFx0XHRcdG5vbmNlOiBhdHRhY2htZW50LmdldCggJ25vbmNlcycgKS5lZGl0LFxuXHRcdFx0XHRpZDogYXR0YWNobWVudC5nZXQoICdpZCcgKSxcblx0XHRcdFx0Y3JvcERldGFpbHM6IGF0dGFjaG1lbnQuZ2V0KCAnY3JvcERldGFpbHMnIClcblx0XHRcdH1cblx0XHQpICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENyb3BwZXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuQ3VzdG9taXplSW1hZ2VDcm9wcGVyXG4gKlxuICogQSBzdGF0ZSBmb3IgY3JvcHBpbmcgYW4gaW1hZ2UuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5Dcm9wcGVyXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKi9cbnZhciBDb250cm9sbGVyID0gd3AubWVkaWEuY29udHJvbGxlcixcblx0Q3VzdG9taXplSW1hZ2VDcm9wcGVyO1xuXG5DdXN0b21pemVJbWFnZUNyb3BwZXIgPSBDb250cm9sbGVyLkNyb3BwZXIuZXh0ZW5kKHtcblx0ZG9Dcm9wOiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHR2YXIgY3JvcERldGFpbHMgPSBhdHRhY2htZW50LmdldCggJ2Nyb3BEZXRhaWxzJyApLFxuXHRcdFx0Y29udHJvbCA9IHRoaXMuZ2V0KCAnY29udHJvbCcgKSxcblx0XHRcdHJhdGlvID0gY3JvcERldGFpbHMud2lkdGggLyBjcm9wRGV0YWlscy5oZWlnaHQ7XG5cblx0XHQvLyBVc2UgY3JvcCBtZWFzdXJlbWVudHMgd2hlbiBmbGV4aWJsZSBpbiBib3RoIGRpcmVjdGlvbnMuXG5cdFx0aWYgKCBjb250cm9sLnBhcmFtcy5mbGV4X3dpZHRoICYmIGNvbnRyb2wucGFyYW1zLmZsZXhfaGVpZ2h0ICkge1xuXHRcdFx0Y3JvcERldGFpbHMuZHN0X3dpZHRoICA9IGNyb3BEZXRhaWxzLndpZHRoO1xuXHRcdFx0Y3JvcERldGFpbHMuZHN0X2hlaWdodCA9IGNyb3BEZXRhaWxzLmhlaWdodDtcblxuXHRcdC8vIENvbnN0cmFpbiBmbGV4aWJsZSBzaWRlIGJhc2VkIG9uIGltYWdlIHJhdGlvIGFuZCBzaXplIG9mIHRoZSBmaXhlZCBzaWRlLlxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjcm9wRGV0YWlscy5kc3Rfd2lkdGggID0gY29udHJvbC5wYXJhbXMuZmxleF93aWR0aCAgPyBjb250cm9sLnBhcmFtcy5oZWlnaHQgKiByYXRpbyA6IGNvbnRyb2wucGFyYW1zLndpZHRoO1xuXHRcdFx0Y3JvcERldGFpbHMuZHN0X2hlaWdodCA9IGNvbnRyb2wucGFyYW1zLmZsZXhfaGVpZ2h0ID8gY29udHJvbC5wYXJhbXMud2lkdGggIC8gcmF0aW8gOiBjb250cm9sLnBhcmFtcy5oZWlnaHQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHdwLmFqYXgucG9zdCggJ2Nyb3AtaW1hZ2UnLCB7XG5cdFx0XHR3cF9jdXN0b21pemU6ICdvbicsXG5cdFx0XHRub25jZTogYXR0YWNobWVudC5nZXQoICdub25jZXMnICkuZWRpdCxcblx0XHRcdGlkOiBhdHRhY2htZW50LmdldCggJ2lkJyApLFxuXHRcdFx0Y29udGV4dDogY29udHJvbC5pZCxcblx0XHRcdGNyb3BEZXRhaWxzOiBjcm9wRGV0YWlsc1xuXHRcdH0gKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ3VzdG9taXplSW1hZ2VDcm9wcGVyO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkVkaXRJbWFnZVxuICpcbiAqIEEgc3RhdGUgZm9yIGVkaXRpbmcgKGNyb3BwaW5nLCBldGMuKSBhbiBpbWFnZS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMgICAgICAgICAgICAgICAgICAgICAgVGhlIGF0dHJpYnV0ZXMgaGFzaCBwYXNzZWQgdG8gdGhlIHN0YXRlLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50fSBhdHRyaWJ1dGVzLm1vZGVsICAgICAgICAgICAgICAgIFRoZSBhdHRhY2htZW50LlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZD1lZGl0LWltYWdlXSAgICAgIFVuaXF1ZSBpZGVudGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50aXRsZT1FZGl0IEltYWdlXSAgIFRpdGxlIGZvciB0aGUgc3RhdGUuIERpc3BsYXlzIGluIHRoZSBtZWRpYSBtZW51IGFuZCB0aGUgZnJhbWUncyB0aXRsZSByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnQ9ZWRpdC1pbWFnZV0gSW5pdGlhbCBtb2RlIGZvciB0aGUgY29udGVudCByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRvb2xiYXI9ZWRpdC1pbWFnZV0gSW5pdGlhbCBtb2RlIGZvciB0aGUgdG9vbGJhciByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm1lbnU9ZmFsc2VdICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgbWVudSByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnVybF0gICAgICAgICAgICAgICAgVW51c2VkLiBAdG9kbyBDb25zaWRlciByZW1vdmFsLlxuICovXG52YXIgbDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0RWRpdEltYWdlO1xuXG5FZGl0SW1hZ2UgPSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlLmV4dGVuZCh7XG5cdGRlZmF1bHRzOiB7XG5cdFx0aWQ6ICAgICAgJ2VkaXQtaW1hZ2UnLFxuXHRcdHRpdGxlOiAgIGwxMG4uZWRpdEltYWdlLFxuXHRcdG1lbnU6ICAgIGZhbHNlLFxuXHRcdHRvb2xiYXI6ICdlZGl0LWltYWdlJyxcblx0XHRjb250ZW50OiAnZWRpdC1pbWFnZScsXG5cdFx0dXJsOiAgICAgJydcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mcmFtZS5vbiggJ3Rvb2xiYXI6cmVuZGVyOmVkaXQtaW1hZ2UnLCBfLmJpbmQoIHRoaXMudG9vbGJhciwgdGhpcyApICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjkuMFxuXHQgKi9cblx0ZGVhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mcmFtZS5vZmYoICd0b29sYmFyOnJlbmRlcjplZGl0LWltYWdlJyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdHRvb2xiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcmFtZSA9IHRoaXMuZnJhbWUsXG5cdFx0XHRsYXN0U3RhdGUgPSBmcmFtZS5sYXN0U3RhdGUoKSxcblx0XHRcdHByZXZpb3VzID0gbGFzdFN0YXRlICYmIGxhc3RTdGF0ZS5pZDtcblxuXHRcdGZyYW1lLnRvb2xiYXIuc2V0KCBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IGZyYW1lLFxuXHRcdFx0aXRlbXM6IHtcblx0XHRcdFx0YmFjazoge1xuXHRcdFx0XHRcdHN0eWxlOiAncHJpbWFyeScsXG5cdFx0XHRcdFx0dGV4dDogICAgIGwxMG4uYmFjayxcblx0XHRcdFx0XHRwcmlvcml0eTogMjAsXG5cdFx0XHRcdFx0Y2xpY2s6ICAgIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0aWYgKCBwcmV2aW91cyApIHtcblx0XHRcdFx0XHRcdFx0ZnJhbWUuc2V0U3RhdGUoIHByZXZpb3VzICk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRmcmFtZS5jbG9zZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRJbWFnZTtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5FbWJlZFxuICpcbiAqIEEgc3RhdGUgZm9yIGVtYmVkZGluZyBtZWRpYSBmcm9tIGEgVVJMLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBhdHRyaWJ1dGVzICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBhdHRyaWJ1dGVzIGhhc2ggcGFzc2VkIHRvIHRoZSBzdGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbYXR0cmlidXRlcy5pZD1lbWJlZF0gICAgICAgICAgICAgIFVuaXF1ZSBpZGVudGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9IFthdHRyaWJ1dGVzLnRpdGxlPUluc2VydCBGcm9tIFVSTF0gVGl0bGUgZm9yIHRoZSBzdGF0ZS4gRGlzcGxheXMgaW4gdGhlIG1lZGlhIG1lbnUgYW5kIHRoZSBmcmFtZSdzIHRpdGxlIHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbYXR0cmlidXRlcy5jb250ZW50PWVtYmVkXSAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9IFthdHRyaWJ1dGVzLm1lbnU9ZGVmYXVsdF0gICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgbWVudSByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gW2F0dHJpYnV0ZXMudG9vbGJhcj1tYWluLWVtYmVkXSAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSB0b29sYmFyIHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbYXR0cmlidXRlcy5tZW51PWZhbHNlXSAgICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIG1lbnUgcmVnaW9uLlxuICogQHBhcmFtIHtpbnR9ICAgIFthdHRyaWJ1dGVzLnByaW9yaXR5PTEyMF0gICAgICAgICAgVGhlIHByaW9yaXR5IGZvciB0aGUgc3RhdGUgbGluayBpbiB0aGUgbWVkaWEgbWVudS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbYXR0cmlidXRlcy50eXBlPWxpbmtdICAgICAgICAgICAgIFRoZSB0eXBlIG9mIGVtYmVkLiBDdXJyZW50bHkgb25seSBsaW5rIGlzIHN1cHBvcnRlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbYXR0cmlidXRlcy51cmxdICAgICAgICAgICAgICAgICAgIFRoZSBlbWJlZCBVUkwuXG4gKiBAcGFyYW0ge29iamVjdH0gW2F0dHJpYnV0ZXMubWV0YWRhdGE9e31dICAgICAgICAgICBQcm9wZXJ0aWVzIG9mIHRoZSBlbWJlZCwgd2hpY2ggd2lsbCBvdmVycmlkZSBhdHRyaWJ1dGVzLnVybCBpZiBzZXQuXG4gKi9cbnZhciBsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHQkID0gQmFja2JvbmUuJCxcblx0RW1iZWQ7XG5cbkVtYmVkID0gd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZS5leHRlbmQoe1xuXHRkZWZhdWx0czoge1xuXHRcdGlkOiAgICAgICAnZW1iZWQnLFxuXHRcdHRpdGxlOiAgICBsMTBuLmluc2VydEZyb21VcmxUaXRsZSxcblx0XHRjb250ZW50OiAgJ2VtYmVkJyxcblx0XHRtZW51OiAgICAgJ2RlZmF1bHQnLFxuXHRcdHRvb2xiYXI6ICAnbWFpbi1lbWJlZCcsXG5cdFx0cHJpb3JpdHk6IDEyMCxcblx0XHR0eXBlOiAgICAgJ2xpbmsnLFxuXHRcdHVybDogICAgICAnJyxcblx0XHRtZXRhZGF0YToge31cblx0fSxcblxuXHQvLyBUaGUgYW1vdW50IG9mIHRpbWUgdXNlZCB3aGVuIGRlYm91bmNpbmcgdGhlIHNjYW4uXG5cdHNlbnNpdGl2aXR5OiA0MDAsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdHRoaXMubWV0YWRhdGEgPSBvcHRpb25zLm1ldGFkYXRhO1xuXHRcdHRoaXMuZGVib3VuY2VkU2NhbiA9IF8uZGVib3VuY2UoIF8uYmluZCggdGhpcy5zY2FuLCB0aGlzICksIHRoaXMuc2Vuc2l0aXZpdHkgKTtcblx0XHR0aGlzLnByb3BzID0gbmV3IEJhY2tib25lLk1vZGVsKCB0aGlzLm1ldGFkYXRhIHx8IHsgdXJsOiAnJyB9KTtcblx0XHR0aGlzLnByb3BzLm9uKCAnY2hhbmdlOnVybCcsIHRoaXMuZGVib3VuY2VkU2NhbiwgdGhpcyApO1xuXHRcdHRoaXMucHJvcHMub24oICdjaGFuZ2U6dXJsJywgdGhpcy5yZWZyZXNoLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ3NjYW4nLCB0aGlzLnNjYW5JbWFnZSwgdGhpcyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBUcmlnZ2VyIGEgc2NhbiBvZiB0aGUgZW1iZWRkZWQgVVJMJ3MgY29udGVudCBmb3IgbWV0YWRhdGEgcmVxdWlyZWQgdG8gZW1iZWQuXG5cdCAqXG5cdCAqIEBmaXJlcyB3cC5tZWRpYS5jb250cm9sbGVyLkVtYmVkI3NjYW5cblx0ICovXG5cdHNjYW46IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzY2FubmVycyxcblx0XHRcdGVtYmVkID0gdGhpcyxcblx0XHRcdGF0dHJpYnV0ZXMgPSB7XG5cdFx0XHRcdHR5cGU6ICdsaW5rJyxcblx0XHRcdFx0c2Nhbm5lcnM6IFtdXG5cdFx0XHR9O1xuXG5cdFx0Ly8gU2NhbiBpcyB0cmlnZ2VyZWQgd2l0aCB0aGUgbGlzdCBvZiBgYXR0cmlidXRlc2AgdG8gc2V0IG9uIHRoZVxuXHRcdC8vIHN0YXRlLCB1c2VmdWwgZm9yIHRoZSAndHlwZScgYXR0cmlidXRlIGFuZCAnc2Nhbm5lcnMnIGF0dHJpYnV0ZSxcblx0XHQvLyBhbiBhcnJheSBvZiBwcm9taXNlIG9iamVjdHMgZm9yIGFzeW5jaHJvbm91cyBzY2FuIG9wZXJhdGlvbnMuXG5cdFx0aWYgKCB0aGlzLnByb3BzLmdldCgndXJsJykgKSB7XG5cdFx0XHR0aGlzLnRyaWdnZXIoICdzY2FuJywgYXR0cmlidXRlcyApO1xuXHRcdH1cblxuXHRcdGlmICggYXR0cmlidXRlcy5zY2FubmVycy5sZW5ndGggKSB7XG5cdFx0XHRzY2FubmVycyA9IGF0dHJpYnV0ZXMuc2Nhbm5lcnMgPSAkLndoZW4uYXBwbHkoICQsIGF0dHJpYnV0ZXMuc2Nhbm5lcnMgKTtcblx0XHRcdHNjYW5uZXJzLmFsd2F5cyggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggZW1iZWQuZ2V0KCdzY2FubmVycycpID09PSBzY2FubmVycyApIHtcblx0XHRcdFx0XHRlbWJlZC5zZXQoICdsb2FkaW5nJywgZmFsc2UgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGF0dHJpYnV0ZXMuc2Nhbm5lcnMgPSBudWxsO1xuXHRcdH1cblxuXHRcdGF0dHJpYnV0ZXMubG9hZGluZyA9ICEhIGF0dHJpYnV0ZXMuc2Nhbm5lcnM7XG5cdFx0dGhpcy5zZXQoIGF0dHJpYnV0ZXMgKTtcblx0fSxcblx0LyoqXG5cdCAqIFRyeSBzY2FubmluZyB0aGUgZW1iZWQgYXMgYW4gaW1hZ2UgdG8gZGlzY292ZXIgaXRzIGRpbWVuc2lvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzXG5cdCAqL1xuXHRzY2FuSW1hZ2U6IGZ1bmN0aW9uKCBhdHRyaWJ1dGVzICkge1xuXHRcdHZhciBmcmFtZSA9IHRoaXMuZnJhbWUsXG5cdFx0XHRzdGF0ZSA9IHRoaXMsXG5cdFx0XHR1cmwgPSB0aGlzLnByb3BzLmdldCgndXJsJyksXG5cdFx0XHRpbWFnZSA9IG5ldyBJbWFnZSgpLFxuXHRcdFx0ZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cblx0XHRhdHRyaWJ1dGVzLnNjYW5uZXJzLnB1c2goIGRlZmVycmVkLnByb21pc2UoKSApO1xuXG5cdFx0Ly8gVHJ5IHRvIGxvYWQgdGhlIGltYWdlIGFuZCBmaW5kIGl0cyB3aWR0aC9oZWlnaHQuXG5cdFx0aW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlKCk7XG5cblx0XHRcdGlmICggc3RhdGUgIT09IGZyYW1lLnN0YXRlKCkgfHwgdXJsICE9PSBzdGF0ZS5wcm9wcy5nZXQoJ3VybCcpICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHN0YXRlLnNldCh7XG5cdFx0XHRcdHR5cGU6ICdpbWFnZSdcblx0XHRcdH0pO1xuXG5cdFx0XHRzdGF0ZS5wcm9wcy5zZXQoe1xuXHRcdFx0XHR3aWR0aDogIGltYWdlLndpZHRoLFxuXHRcdFx0XHRoZWlnaHQ6IGltYWdlLmhlaWdodFxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdGltYWdlLm9uZXJyb3IgPSBkZWZlcnJlZC5yZWplY3Q7XG5cdFx0aW1hZ2Uuc3JjID0gdXJsO1xuXHR9LFxuXG5cdHJlZnJlc2g6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZnJhbWUudG9vbGJhci5nZXQoKS5yZWZyZXNoKCk7XG5cdH0sXG5cblx0cmVzZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucHJvcHMuY2xlYXIoKS5zZXQoeyB1cmw6ICcnIH0pO1xuXG5cdFx0aWYgKCB0aGlzLmFjdGl2ZSApIHtcblx0XHRcdHRoaXMucmVmcmVzaCgpO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRW1iZWQ7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuRmVhdHVyZWRJbWFnZVxuICpcbiAqIEEgc3RhdGUgZm9yIHNlbGVjdGluZyBhIGZlYXR1cmVkIGltYWdlIGZvciBhIHBvc3QuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXNdICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgYXR0cmlidXRlcyBoYXNoIHBhc3NlZCB0byB0aGUgc3RhdGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZD1mZWF0dXJlZC1pbWFnZV0gICAgICAgIFVuaXF1ZSBpZGVudGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudGl0bGU9U2V0IEZlYXR1cmVkIEltYWdlXSBUaXRsZSBmb3IgdGhlIHN0YXRlLiBEaXNwbGF5cyBpbiB0aGUgbWVkaWEgbWVudSBhbmQgdGhlIGZyYW1lJ3MgdGl0bGUgcmVnaW9uLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gW2F0dHJpYnV0ZXMubGlicmFyeV0gICAgICAgICAgICAgICAgICBUaGUgYXR0YWNobWVudHMgY29sbGVjdGlvbiB0byBicm93c2UuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElmIG9uZSBpcyBub3Qgc3VwcGxpZWQsIGEgY29sbGVjdGlvbiBvZiBhbGwgaW1hZ2VzIHdpbGwgYmUgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm11bHRpcGxlPWZhbHNlXSAgICAgICAgICAgV2hldGhlciBtdWx0aS1zZWxlY3QgaXMgZW5hYmxlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnQ9dXBsb2FkXSAgICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgY29udGVudCByZWdpb24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE92ZXJyaWRkZW4gYnkgcGVyc2lzdGVudCB1c2VyIHNldHRpbmcgaWYgJ2NvbnRlbnRVc2VyU2V0dGluZycgaXMgdHJ1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm1lbnU9ZGVmYXVsdF0gICAgICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgbWVudSByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5yb3V0ZXI9YnJvd3NlXSAgICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHJvdXRlciByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50b29sYmFyPWZlYXR1cmVkLWltYWdlXSAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHRvb2xiYXIgcmVnaW9uLlxuICogQHBhcmFtIHtpbnR9ICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucHJpb3JpdHk9NjBdICAgICAgICAgICAgICBUaGUgcHJpb3JpdHkgZm9yIHRoZSBzdGF0ZSBsaW5rIGluIHRoZSBtZWRpYSBtZW51LlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc2VhcmNoYWJsZT10cnVlXSAgICAgICAgICBXaGV0aGVyIHRoZSBsaWJyYXJ5IGlzIHNlYXJjaGFibGUuXG4gKiBAcGFyYW0ge2Jvb2xlYW58c3RyaW5nfSAgICAgICAgICAgICBbYXR0cmlidXRlcy5maWx0ZXJhYmxlPWZhbHNlXSAgICAgICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgZmlsdGVyYWJsZSwgYW5kIGlmIHNvIHdoYXQgZmlsdGVycyBzaG91bGQgYmUgc2hvd24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjY2VwdHMgJ2FsbCcsICd1cGxvYWRlZCcsIG9yICd1bmF0dGFjaGVkJy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNvcnRhYmxlPXRydWVdICAgICAgICAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2hvdWxkIGJlIHNvcnRhYmxlLiBEZXBlbmRzIG9uIHRoZSBvcmRlcmJ5IHByb3BlcnR5IGJlaW5nIHNldCB0byBtZW51T3JkZXIgb24gdGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5hdXRvU2VsZWN0PXRydWVdICAgICAgICAgIFdoZXRoZXIgYW4gdXBsb2FkZWQgYXR0YWNobWVudCBzaG91bGQgYmUgYXV0b21hdGljYWxseSBhZGRlZCB0byB0aGUgc2VsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZGVzY3JpYmU9ZmFsc2VdICAgICAgICAgICBXaGV0aGVyIHRvIG9mZmVyIFVJIHRvIGRlc2NyaWJlIGF0dGFjaG1lbnRzIC0gZS5nLiBjYXB0aW9uaW5nIGltYWdlcyBpbiBhIGdhbGxlcnkuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb250ZW50VXNlclNldHRpbmc9dHJ1ZV0gIFdoZXRoZXIgdGhlIGNvbnRlbnQgcmVnaW9uJ3MgbW9kZSBzaG91bGQgYmUgc2V0IGFuZCBwZXJzaXN0ZWQgcGVyIHVzZXIuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zeW5jU2VsZWN0aW9uPXRydWVdICAgICAgIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNlbGVjdGlvbiBzaG91bGQgYmUgcGVyc2lzdGVkIGZyb20gdGhlIGxhc3Qgc3RhdGUuXG4gKi9cbnZhciBBdHRhY2htZW50ID0gd3AubWVkaWEubW9kZWwuQXR0YWNobWVudCxcblx0TGlicmFyeSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeSxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0RmVhdHVyZWRJbWFnZTtcblxuRmVhdHVyZWRJbWFnZSA9IExpYnJhcnkuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IF8uZGVmYXVsdHMoe1xuXHRcdGlkOiAgICAgICAgICAgICdmZWF0dXJlZC1pbWFnZScsXG5cdFx0dGl0bGU6ICAgICAgICAgbDEwbi5zZXRGZWF0dXJlZEltYWdlVGl0bGUsXG5cdFx0bXVsdGlwbGU6ICAgICAgZmFsc2UsXG5cdFx0ZmlsdGVyYWJsZTogICAgJ3VwbG9hZGVkJyxcblx0XHR0b29sYmFyOiAgICAgICAnZmVhdHVyZWQtaW1hZ2UnLFxuXHRcdHByaW9yaXR5OiAgICAgIDYwLFxuXHRcdHN5bmNTZWxlY3Rpb246IHRydWVcblx0fSwgTGlicmFyeS5wcm90b3R5cGUuZGVmYXVsdHMgKSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGlicmFyeSwgY29tcGFyYXRvcjtcblxuXHRcdC8vIElmIHdlIGhhdmVuJ3QgYmVlbiBwcm92aWRlZCBhIGBsaWJyYXJ5YCwgY3JlYXRlIGEgYFNlbGVjdGlvbmAuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdsaWJyYXJ5JykgKSB7XG5cdFx0XHR0aGlzLnNldCggJ2xpYnJhcnknLCB3cC5tZWRpYS5xdWVyeSh7IHR5cGU6ICdpbWFnZScgfSkgKTtcblx0XHR9XG5cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdGxpYnJhcnkgICAgPSB0aGlzLmdldCgnbGlicmFyeScpO1xuXHRcdGNvbXBhcmF0b3IgPSBsaWJyYXJ5LmNvbXBhcmF0b3I7XG5cblx0XHQvLyBPdmVybG9hZCB0aGUgbGlicmFyeSdzIGNvbXBhcmF0b3IgdG8gcHVzaCBpdGVtcyB0aGF0IGFyZSBub3QgaW5cblx0XHQvLyB0aGUgbWlycm9yZWQgcXVlcnkgdG8gdGhlIGZyb250IG9mIHRoZSBhZ2dyZWdhdGUgY29sbGVjdGlvbi5cblx0XHRsaWJyYXJ5LmNvbXBhcmF0b3IgPSBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRcdHZhciBhSW5RdWVyeSA9ICEhIHRoaXMubWlycm9yaW5nLmdldCggYS5jaWQgKSxcblx0XHRcdFx0YkluUXVlcnkgPSAhISB0aGlzLm1pcnJvcmluZy5nZXQoIGIuY2lkICk7XG5cblx0XHRcdGlmICggISBhSW5RdWVyeSAmJiBiSW5RdWVyeSApIHtcblx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0fSBlbHNlIGlmICggYUluUXVlcnkgJiYgISBiSW5RdWVyeSApIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gY29tcGFyYXRvci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIEFkZCBhbGwgaXRlbXMgaW4gdGhlIHNlbGVjdGlvbiB0byB0aGUgbGlicmFyeSwgc28gYW55IGZlYXR1cmVkXG5cdFx0Ly8gaW1hZ2VzIHRoYXQgYXJlIG5vdCBpbml0aWFsbHkgbG9hZGVkIHN0aWxsIGFwcGVhci5cblx0XHRsaWJyYXJ5Lm9ic2VydmUoIHRoaXMuZ2V0KCdzZWxlY3Rpb24nKSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVwZGF0ZVNlbGVjdGlvbigpO1xuXHRcdHRoaXMuZnJhbWUub24oICdvcGVuJywgdGhpcy51cGRhdGVTZWxlY3Rpb24sIHRoaXMgKTtcblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmFjdGl2YXRlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZyYW1lLm9mZiggJ29wZW4nLCB0aGlzLnVwZGF0ZVNlbGVjdGlvbiwgdGhpcyApO1xuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuZGVhY3RpdmF0ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0dXBkYXRlU2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0aW9uID0gdGhpcy5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0aWQgPSB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuZmVhdHVyZWRJbWFnZUlkLFxuXHRcdFx0YXR0YWNobWVudDtcblxuXHRcdGlmICggJycgIT09IGlkICYmIC0xICE9PSBpZCApIHtcblx0XHRcdGF0dGFjaG1lbnQgPSBBdHRhY2htZW50LmdldCggaWQgKTtcblx0XHRcdGF0dGFjaG1lbnQuZmV0Y2goKTtcblx0XHR9XG5cblx0XHRzZWxlY3Rpb24ucmVzZXQoIGF0dGFjaG1lbnQgPyBbIGF0dGFjaG1lbnQgXSA6IFtdICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZlYXR1cmVkSW1hZ2U7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuR2FsbGVyeUFkZFxuICpcbiAqIEEgc3RhdGUgZm9yIHNlbGVjdGluZyBtb3JlIGltYWdlcyB0byBhZGQgdG8gYSBnYWxsZXJ5LlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzXSAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgYXR0cmlidXRlcyBoYXNoIHBhc3NlZCB0byB0aGUgc3RhdGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZD1nYWxsZXJ5LWxpYnJhcnldICAgICAgVW5pcXVlIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50aXRsZT1BZGQgdG8gR2FsbGVyeV0gICAgVGl0bGUgZm9yIHRoZSBzdGF0ZS4gRGlzcGxheXMgaW4gdGhlIGZyYW1lJ3MgdGl0bGUgcmVnaW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubXVsdGlwbGU9YWRkXSAgICAgICAgICAgIFdoZXRoZXIgbXVsdGktc2VsZWN0IGlzIGVuYWJsZWQuIEB0b2RvICdhZGQnIGRvZXNuJ3Qgc2VlbSBkbyBhbnl0aGluZyBzcGVjaWFsLCBhbmQgZ2V0cyB1c2VkIGFzIGEgYm9vbGVhbi5cbiAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9IFthdHRyaWJ1dGVzLmxpYnJhcnldICAgICAgICAgICAgICAgICBUaGUgYXR0YWNobWVudHMgY29sbGVjdGlvbiB0byBicm93c2UuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgb25lIGlzIG5vdCBzdXBwbGllZCwgYSBjb2xsZWN0aW9uIG9mIGFsbCBpbWFnZXMgd2lsbCBiZSBjcmVhdGVkLlxuICogQHBhcmFtIHtib29sZWFufHN0cmluZ30gICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZmlsdGVyYWJsZT11cGxvYWRlZF0gICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgZmlsdGVyYWJsZSwgYW5kIGlmIHNvIHdoYXQgZmlsdGVycyBzaG91bGQgYmUgc2hvd24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWNjZXB0cyAnYWxsJywgJ3VwbG9hZGVkJywgb3IgJ3VuYXR0YWNoZWQnLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubWVudT1nYWxsZXJ5XSAgICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIG1lbnUgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudD11cGxvYWRdICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE92ZXJyaWRkZW4gYnkgcGVyc2lzdGVudCB1c2VyIHNldHRpbmcgaWYgJ2NvbnRlbnRVc2VyU2V0dGluZycgaXMgdHJ1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnJvdXRlcj1icm93c2VdICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSByb3V0ZXIgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudG9vbGJhcj1nYWxsZXJ5LWFkZF0gICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHRvb2xiYXIgcmVnaW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc2VhcmNoYWJsZT10cnVlXSAgICAgICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgc2VhcmNoYWJsZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNvcnRhYmxlPXRydWVdICAgICAgICAgICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzaG91bGQgYmUgc29ydGFibGUuIERlcGVuZHMgb24gdGhlIG9yZGVyYnkgcHJvcGVydHkgYmVpbmcgc2V0IHRvIG1lbnVPcmRlciBvbiB0aGUgYXR0YWNobWVudHMgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmF1dG9TZWxlY3Q9dHJ1ZV0gICAgICAgICBXaGV0aGVyIGFuIHVwbG9hZGVkIGF0dGFjaG1lbnQgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgYWRkZWQgdG8gdGhlIHNlbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnRVc2VyU2V0dGluZz10cnVlXSBXaGV0aGVyIHRoZSBjb250ZW50IHJlZ2lvbidzIG1vZGUgc2hvdWxkIGJlIHNldCBhbmQgcGVyc2lzdGVkIHBlciB1c2VyLlxuICogQHBhcmFtIHtpbnR9ICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucHJpb3JpdHk9MTAwXSAgICAgICAgICAgIFRoZSBwcmlvcml0eSBmb3IgdGhlIHN0YXRlIGxpbmsgaW4gdGhlIG1lZGlhIG1lbnUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zeW5jU2VsZWN0aW9uPWZhbHNlXSAgICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2VsZWN0aW9uIHNob3VsZCBiZSBwZXJzaXN0ZWQgZnJvbSB0aGUgbGFzdCBzdGF0ZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0cyB0byBmYWxzZSBiZWNhdXNlIGZvciB0aGlzIHN0YXRlLCBiZWNhdXNlIHRoZSBsaWJyYXJ5IG9mIHRoZSBFZGl0IEdhbGxlcnkgc3RhdGUgaXMgdGhlIHNlbGVjdGlvbi5cbiAqL1xudmFyIFNlbGVjdGlvbiA9IHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbixcblx0TGlicmFyeSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeSxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0R2FsbGVyeUFkZDtcblxuR2FsbGVyeUFkZCA9IExpYnJhcnkuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IF8uZGVmYXVsdHMoe1xuXHRcdGlkOiAgICAgICAgICAgICdnYWxsZXJ5LWxpYnJhcnknLFxuXHRcdHRpdGxlOiAgICAgICAgIGwxMG4uYWRkVG9HYWxsZXJ5VGl0bGUsXG5cdFx0bXVsdGlwbGU6ICAgICAgJ2FkZCcsXG5cdFx0ZmlsdGVyYWJsZTogICAgJ3VwbG9hZGVkJyxcblx0XHRtZW51OiAgICAgICAgICAnZ2FsbGVyeScsXG5cdFx0dG9vbGJhcjogICAgICAgJ2dhbGxlcnktYWRkJyxcblx0XHRwcmlvcml0eTogICAgICAxMDAsXG5cdFx0c3luY1NlbGVjdGlvbjogZmFsc2Vcblx0fSwgTGlicmFyeS5wcm90b3R5cGUuZGVmYXVsdHMgKSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvLyBJZiBhIGxpYnJhcnkgd2Fzbid0IHN1cHBsaWVkLCBjcmVhdGUgYSBsaWJyYXJ5IG9mIGltYWdlcy5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ2xpYnJhcnknKSApIHtcblx0XHRcdHRoaXMuc2V0KCAnbGlicmFyeScsIHdwLm1lZGlhLnF1ZXJ5KHsgdHlwZTogJ2ltYWdlJyB9KSApO1xuXHRcdH1cblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGlicmFyeSA9IHRoaXMuZ2V0KCdsaWJyYXJ5JyksXG5cdFx0XHRlZGl0ICAgID0gdGhpcy5mcmFtZS5zdGF0ZSgnZ2FsbGVyeS1lZGl0JykuZ2V0KCdsaWJyYXJ5Jyk7XG5cblx0XHRpZiAoIHRoaXMuZWRpdExpYnJhcnkgJiYgdGhpcy5lZGl0TGlicmFyeSAhPT0gZWRpdCApIHtcblx0XHRcdGxpYnJhcnkudW5vYnNlcnZlKCB0aGlzLmVkaXRMaWJyYXJ5ICk7XG5cdFx0fVxuXG5cdFx0Ly8gQWNjZXB0cyBhdHRhY2htZW50cyB0aGF0IGV4aXN0IGluIHRoZSBvcmlnaW5hbCBsaWJyYXJ5IGFuZFxuXHRcdC8vIHRoYXQgZG8gbm90IGV4aXN0IGluIGdhbGxlcnkncyBsaWJyYXJ5LlxuXHRcdGxpYnJhcnkudmFsaWRhdG9yID0gZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gISEgdGhpcy5taXJyb3JpbmcuZ2V0KCBhdHRhY2htZW50LmNpZCApICYmICEgZWRpdC5nZXQoIGF0dGFjaG1lbnQuY2lkICkgJiYgU2VsZWN0aW9uLnByb3RvdHlwZS52YWxpZGF0b3IuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdH07XG5cblx0XHQvLyBSZXNldCB0aGUgbGlicmFyeSB0byBlbnN1cmUgdGhhdCBhbGwgYXR0YWNobWVudHMgYXJlIHJlLWFkZGVkXG5cdFx0Ly8gdG8gdGhlIGNvbGxlY3Rpb24uIERvIHNvIHNpbGVudGx5LCBhcyBjYWxsaW5nIGBvYnNlcnZlYCB3aWxsXG5cdFx0Ly8gdHJpZ2dlciB0aGUgYHJlc2V0YCBldmVudC5cblx0XHRsaWJyYXJ5LnJlc2V0KCBsaWJyYXJ5Lm1pcnJvcmluZy5tb2RlbHMsIHsgc2lsZW50OiB0cnVlIH0pO1xuXHRcdGxpYnJhcnkub2JzZXJ2ZSggZWRpdCApO1xuXHRcdHRoaXMuZWRpdExpYnJhcnkgPSBlZGl0O1xuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuYWN0aXZhdGUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYWxsZXJ5QWRkO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkdhbGxlcnlFZGl0XG4gKlxuICogQSBzdGF0ZSBmb3IgZWRpdGluZyBhIGdhbGxlcnkncyBpbWFnZXMgYW5kIHNldHRpbmdzLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Nb2RlbFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzXSAgICAgICAgICAgICAgICAgICAgICAgVGhlIGF0dHJpYnV0ZXMgaGFzaCBwYXNzZWQgdG8gdGhlIHN0YXRlLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuaWQ9Z2FsbGVyeS1lZGl0XSAgICAgICBVbmlxdWUgaWRlbnRpZmllci5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRpdGxlPUVkaXQgR2FsbGVyeV0gICAgVGl0bGUgZm9yIHRoZSBzdGF0ZS4gRGlzcGxheXMgaW4gdGhlIGZyYW1lJ3MgdGl0bGUgcmVnaW9uLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50c30gW2F0dHJpYnV0ZXMubGlicmFyeV0gICAgICAgICAgICAgICBUaGUgY29sbGVjdGlvbiBvZiBhdHRhY2htZW50cyBpbiB0aGUgZ2FsbGVyeS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgb25lIGlzIG5vdCBzdXBwbGllZCwgYW4gZW1wdHkgbWVkaWEubW9kZWwuU2VsZWN0aW9uIGNvbGxlY3Rpb24gaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm11bHRpcGxlPWZhbHNlXSAgICAgICAgV2hldGhlciBtdWx0aS1zZWxlY3QgaXMgZW5hYmxlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNlYXJjaGFibGU9ZmFsc2VdICAgICAgV2hldGhlciB0aGUgbGlicmFyeSBpcyBzZWFyY2hhYmxlLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc29ydGFibGU9dHJ1ZV0gICAgICAgICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzaG91bGQgYmUgc29ydGFibGUuIERlcGVuZHMgb24gdGhlIG9yZGVyYnkgcHJvcGVydHkgYmVpbmcgc2V0IHRvIG1lbnVPcmRlciBvbiB0aGUgYXR0YWNobWVudHMgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmRhdGU9dHJ1ZV0gICAgICAgICAgICAgV2hldGhlciB0byBzaG93IHRoZSBkYXRlIGZpbHRlciBpbiB0aGUgYnJvd3NlcidzIHRvb2xiYXIuXG4gKiBAcGFyYW0ge3N0cmluZ3xmYWxzZX0gICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb250ZW50PWJyb3dzZV0gICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V9ICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudG9vbGJhcj1pbWFnZS1kZXRhaWxzXSBJbml0aWFsIG1vZGUgZm9yIHRoZSB0b29sYmFyIHJlZ2lvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmRlc2NyaWJlPXRydWVdICAgICAgICAgV2hldGhlciB0byBvZmZlciBVSSB0byBkZXNjcmliZSBhdHRhY2htZW50cyAtIGUuZy4gY2FwdGlvbmluZyBpbWFnZXMgaW4gYSBnYWxsZXJ5LlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZGlzcGxheVNldHRpbmdzPXRydWVdICBXaGV0aGVyIHRvIHNob3cgdGhlIGF0dGFjaG1lbnQgZGlzcGxheSBzZXR0aW5ncyBpbnRlcmZhY2UuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5kcmFnSW5mbz10cnVlXSAgICAgICAgIFdoZXRoZXIgdG8gc2hvdyBpbnN0cnVjdGlvbmFsIHRleHQgYWJvdXQgdGhlIGF0dGFjaG1lbnRzIGJlaW5nIHNvcnRhYmxlLlxuICogQHBhcmFtIHtpbnR9ICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuaWRlYWxDb2x1bW5XaWR0aD0xNzBdICBUaGUgaWRlYWwgY29sdW1uIHdpZHRoIGluIHBpeGVscyBmb3IgYXR0YWNobWVudHMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5lZGl0aW5nPWZhbHNlXSAgICAgICAgIFdoZXRoZXIgdGhlIGdhbGxlcnkgaXMgYmVpbmcgY3JlYXRlZCwgb3IgZWRpdGluZyBhbiBleGlzdGluZyBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7aW50fSAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnByaW9yaXR5PTYwXSAgICAgICAgICAgVGhlIHByaW9yaXR5IGZvciB0aGUgc3RhdGUgbGluayBpbiB0aGUgbWVkaWEgbWVudS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnN5bmNTZWxlY3Rpb249ZmFsc2VdICAgV2hldGhlciB0aGUgQXR0YWNobWVudHMgc2VsZWN0aW9uIHNob3VsZCBiZSBwZXJzaXN0ZWQgZnJvbSB0aGUgbGFzdCBzdGF0ZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGVmYXVsdHMgdG8gZmFsc2UgZm9yIHRoaXMgc3RhdGUsIGJlY2F1c2UgdGhlIGxpYnJhcnkgcGFzc2VkIGluICAqaXMqIHRoZSBzZWxlY3Rpb24uXG4gKiBAcGFyYW0ge3ZpZXd9ICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5BdHRhY2htZW50Vmlld10gICAgICAgIFRoZSBzaW5nbGUgYEF0dGFjaG1lbnRgIHZpZXcgdG8gYmUgdXNlZCBpbiB0aGUgYEF0dGFjaG1lbnRzYC5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgbm9uZSBzdXBwbGllZCwgZGVmYXVsdHMgdG8gd3AubWVkaWEudmlldy5BdHRhY2htZW50LkVkaXRMaWJyYXJ5LlxuICovXG52YXIgTGlicmFyeSA9IHdwLm1lZGlhLmNvbnRyb2xsZXIuTGlicmFyeSxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0R2FsbGVyeUVkaXQ7XG5cbkdhbGxlcnlFZGl0ID0gTGlicmFyeS5leHRlbmQoe1xuXHRkZWZhdWx0czoge1xuXHRcdGlkOiAgICAgICAgICAgICAgICdnYWxsZXJ5LWVkaXQnLFxuXHRcdHRpdGxlOiAgICAgICAgICAgIGwxMG4uZWRpdEdhbGxlcnlUaXRsZSxcblx0XHRtdWx0aXBsZTogICAgICAgICBmYWxzZSxcblx0XHRzZWFyY2hhYmxlOiAgICAgICBmYWxzZSxcblx0XHRzb3J0YWJsZTogICAgICAgICB0cnVlLFxuXHRcdGRhdGU6ICAgICAgICAgICAgIGZhbHNlLFxuXHRcdGRpc3BsYXk6ICAgICAgICAgIGZhbHNlLFxuXHRcdGNvbnRlbnQ6ICAgICAgICAgICdicm93c2UnLFxuXHRcdHRvb2xiYXI6ICAgICAgICAgICdnYWxsZXJ5LWVkaXQnLFxuXHRcdGRlc2NyaWJlOiAgICAgICAgIHRydWUsXG5cdFx0ZGlzcGxheVNldHRpbmdzOiAgdHJ1ZSxcblx0XHRkcmFnSW5mbzogICAgICAgICB0cnVlLFxuXHRcdGlkZWFsQ29sdW1uV2lkdGg6IDE3MCxcblx0XHRlZGl0aW5nOiAgICAgICAgICBmYWxzZSxcblx0XHRwcmlvcml0eTogICAgICAgICA2MCxcblx0XHRzeW5jU2VsZWN0aW9uOiAgICBmYWxzZVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIElmIHdlIGhhdmVuJ3QgYmVlbiBwcm92aWRlZCBhIGBsaWJyYXJ5YCwgY3JlYXRlIGEgYFNlbGVjdGlvbmAuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdsaWJyYXJ5JykgKSB7XG5cdFx0XHR0aGlzLnNldCggJ2xpYnJhcnknLCBuZXcgd3AubWVkaWEubW9kZWwuU2VsZWN0aW9uKCkgKTtcblx0XHR9XG5cblx0XHQvLyBUaGUgc2luZ2xlIGBBdHRhY2htZW50YCB2aWV3IHRvIGJlIHVzZWQgaW4gdGhlIGBBdHRhY2htZW50c2Agdmlldy5cblx0XHRpZiAoICEgdGhpcy5nZXQoJ0F0dGFjaG1lbnRWaWV3JykgKSB7XG5cdFx0XHR0aGlzLnNldCggJ0F0dGFjaG1lbnRWaWV3Jywgd3AubWVkaWEudmlldy5BdHRhY2htZW50LkVkaXRMaWJyYXJ5ICk7XG5cdFx0fVxuXG5cdFx0TGlicmFyeS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsaWJyYXJ5ID0gdGhpcy5nZXQoJ2xpYnJhcnknKTtcblxuXHRcdC8vIExpbWl0IHRoZSBsaWJyYXJ5IHRvIGltYWdlcyBvbmx5LlxuXHRcdGxpYnJhcnkucHJvcHMuc2V0KCAndHlwZScsICdpbWFnZScgKTtcblxuXHRcdC8vIFdhdGNoIGZvciB1cGxvYWRlZCBhdHRhY2htZW50cy5cblx0XHR0aGlzLmdldCgnbGlicmFyeScpLm9ic2VydmUoIHdwLlVwbG9hZGVyLnF1ZXVlICk7XG5cblx0XHR0aGlzLmZyYW1lLm9uKCAnY29udGVudDpyZW5kZXI6YnJvd3NlJywgdGhpcy5nYWxsZXJ5U2V0dGluZ3MsIHRoaXMgKTtcblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmFjdGl2YXRlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHQvLyBTdG9wIHdhdGNoaW5nIGZvciB1cGxvYWRlZCBhdHRhY2htZW50cy5cblx0XHR0aGlzLmdldCgnbGlicmFyeScpLnVub2JzZXJ2ZSggd3AuVXBsb2FkZXIucXVldWUgKTtcblxuXHRcdHRoaXMuZnJhbWUub2ZmKCAnY29udGVudDpyZW5kZXI6YnJvd3NlJywgdGhpcy5nYWxsZXJ5U2V0dGluZ3MsIHRoaXMgKTtcblxuXHRcdExpYnJhcnkucHJvdG90eXBlLmRlYWN0aXZhdGUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHBhcmFtIGJyb3dzZXJcblx0ICovXG5cdGdhbGxlcnlTZXR0aW5nczogZnVuY3Rpb24oIGJyb3dzZXIgKSB7XG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdkaXNwbGF5U2V0dGluZ3MnKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgbGlicmFyeSA9IHRoaXMuZ2V0KCdsaWJyYXJ5Jyk7XG5cblx0XHRpZiAoICEgbGlicmFyeSB8fCAhIGJyb3dzZXIgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bGlicmFyeS5nYWxsZXJ5ID0gbGlicmFyeS5nYWxsZXJ5IHx8IG5ldyBCYWNrYm9uZS5Nb2RlbCgpO1xuXG5cdFx0YnJvd3Nlci5zaWRlYmFyLnNldCh7XG5cdFx0XHRnYWxsZXJ5OiBuZXcgd3AubWVkaWEudmlldy5TZXR0aW5ncy5HYWxsZXJ5KHtcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdFx0bW9kZWw6ICAgICAgbGlicmFyeS5nYWxsZXJ5LFxuXHRcdFx0XHRwcmlvcml0eTogICA0MFxuXHRcdFx0fSlcblx0XHR9KTtcblxuXHRcdGJyb3dzZXIudG9vbGJhci5zZXQoICdyZXZlcnNlJywge1xuXHRcdFx0dGV4dDogICAgIGwxMG4ucmV2ZXJzZU9yZGVyLFxuXHRcdFx0cHJpb3JpdHk6IDgwLFxuXG5cdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGxpYnJhcnkucmVzZXQoIGxpYnJhcnkudG9BcnJheSgpLnJldmVyc2UoKSApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYWxsZXJ5RWRpdDtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5JbWFnZURldGFpbHNcbiAqXG4gKiBBIHN0YXRlIGZvciBlZGl0aW5nIHRoZSBhdHRhY2htZW50IGRpc3BsYXkgc2V0dGluZ3Mgb2YgYW4gaW1hZ2UgdGhhdCdzIGJlZW5cbiAqIGluc2VydGVkIGludG8gdGhlIGVkaXRvci5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzXSAgICAgICAgICAgICAgICAgICAgICAgVGhlIGF0dHJpYnV0ZXMgaGFzaCBwYXNzZWQgdG8gdGhlIHN0YXRlLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5pZD1pbWFnZS1kZXRhaWxzXSAgICAgIFVuaXF1ZSBpZGVudGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50aXRsZT1JbWFnZSBEZXRhaWxzXSAgIFRpdGxlIGZvciB0aGUgc3RhdGUuIERpc3BsYXlzIGluIHRoZSBmcmFtZSdzIHRpdGxlIHJlZ2lvbi5cbiAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH0gYXR0cmlidXRlcy5pbWFnZSAgICAgICAgICAgICAgICAgICBUaGUgaW1hZ2UncyBtb2RlbC5cbiAqIEBwYXJhbSB7c3RyaW5nfGZhbHNlfSAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudD1pbWFnZS1kZXRhaWxzXSBJbml0aWFsIG1vZGUgZm9yIHRoZSBjb250ZW50IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfGZhbHNlfSAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMubWVudT1mYWxzZV0gICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBtZW51IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfGZhbHNlfSAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucm91dGVyPWZhbHNlXSAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSByb3V0ZXIgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V9ICAgICAgICAgICAgICBbYXR0cmlidXRlcy50b29sYmFyPWltYWdlLWRldGFpbHNdIEluaXRpYWwgbW9kZSBmb3IgdGhlIHRvb2xiYXIgcmVnaW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5lZGl0aW5nPWZhbHNlXSAgICAgICAgIFVudXNlZC5cbiAqIEBwYXJhbSB7aW50fSAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucHJpb3JpdHk9NjBdICAgICAgICAgICBVbnVzZWQuXG4gKlxuICogQHRvZG8gVGhpcyBzdGF0ZSBpbmhlcml0cyBzb21lIGRlZmF1bHRzIGZyb20gbWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LnByb3RvdHlwZS5kZWZhdWx0cyxcbiAqICAgICAgIGhvd2V2ZXIgdGhpcyBtYXkgbm90IGRvIGFueXRoaW5nLlxuICovXG52YXIgU3RhdGUgPSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlLFxuXHRMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRJbWFnZURldGFpbHM7XG5cbkltYWdlRGV0YWlscyA9IFN0YXRlLmV4dGVuZCh7XG5cdGRlZmF1bHRzOiBfLmRlZmF1bHRzKHtcblx0XHRpZDogICAgICAgJ2ltYWdlLWRldGFpbHMnLFxuXHRcdHRpdGxlOiAgICBsMTBuLmltYWdlRGV0YWlsc1RpdGxlLFxuXHRcdGNvbnRlbnQ6ICAnaW1hZ2UtZGV0YWlscycsXG5cdFx0bWVudTogICAgIGZhbHNlLFxuXHRcdHJvdXRlcjogICBmYWxzZSxcblx0XHR0b29sYmFyOiAgJ2ltYWdlLWRldGFpbHMnLFxuXHRcdGVkaXRpbmc6ICBmYWxzZSxcblx0XHRwcmlvcml0eTogNjBcblx0fSwgTGlicmFyeS5wcm90b3R5cGUuZGVmYXVsdHMgKSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqXG5cdCAqIEBwYXJhbSBvcHRpb25zIEF0dHJpYnV0ZXNcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdHRoaXMuaW1hZ2UgPSBvcHRpb25zLmltYWdlO1xuXHRcdFN0YXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mcmFtZS5tb2RhbC4kZWwuYWRkQ2xhc3MoJ2ltYWdlLWRldGFpbHMnKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VEZXRhaWxzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnlcbiAqXG4gKiBBIHN0YXRlIGZvciBjaG9vc2luZyBhbiBhdHRhY2htZW50IG9yIGdyb3VwIG9mIGF0dGFjaG1lbnRzIGZyb20gdGhlIG1lZGlhIGxpYnJhcnkuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKiBAbWl4ZXMgbWVkaWEuc2VsZWN0aW9uU3luY1xuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXNdICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBhdHRyaWJ1dGVzIGhhc2ggcGFzc2VkIHRvIHRoZSBzdGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuaWQ9bGlicmFyeV0gICAgICAgICAgICAgIFVuaXF1ZSBpZGVudGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy50aXRsZT1NZWRpYSBsaWJyYXJ5XSAgICAgVGl0bGUgZm9yIHRoZSBzdGF0ZS4gRGlzcGxheXMgaW4gdGhlIG1lZGlhIG1lbnUgYW5kIHRoZSBmcmFtZSdzIHRpdGxlIHJlZ2lvbi5cbiAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudHN9ICAgICAgW2F0dHJpYnV0ZXMubGlicmFyeV0gICAgICAgICAgICAgICAgIFRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uIHRvIGJyb3dzZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElmIG9uZSBpcyBub3Qgc3VwcGxpZWQsIGEgY29sbGVjdGlvbiBvZiBhbGwgYXR0YWNobWVudHMgd2lsbCBiZSBjcmVhdGVkLlxuICogQHBhcmFtIHt3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb258b2JqZWN0fSBbYXR0cmlidXRlcy5zZWxlY3Rpb25dICAgICAgICAgICAgICAgQSBjb2xsZWN0aW9uIHRvIGNvbnRhaW4gYXR0YWNobWVudCBzZWxlY3Rpb25zIHdpdGhpbiB0aGUgc3RhdGUuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiB0aGUgJ3NlbGVjdGlvbicgYXR0cmlidXRlIGlzIGEgcGxhaW4gSlMgb2JqZWN0LFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSBTZWxlY3Rpb24gd2lsbCBiZSBjcmVhdGVkIHVzaW5nIGl0cyB2YWx1ZXMgYXMgdGhlIHNlbGVjdGlvbiBpbnN0YW5jZSdzIGBwcm9wc2AgbW9kZWwuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPdGhlcndpc2UsIGl0IHdpbGwgY29weSB0aGUgbGlicmFyeSdzIGBwcm9wc2AgbW9kZWwuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm11bHRpcGxlPWZhbHNlXSAgICAgICAgICBXaGV0aGVyIG11bHRpLXNlbGVjdCBpcyBlbmFibGVkLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb250ZW50PXVwbG9hZF0gICAgICAgICAgSW5pdGlhbCBtb2RlIGZvciB0aGUgY29udGVudCByZWdpb24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPdmVycmlkZGVuIGJ5IHBlcnNpc3RlbnQgdXNlciBzZXR0aW5nIGlmICdjb250ZW50VXNlclNldHRpbmcnIGlzIHRydWUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm1lbnU9ZGVmYXVsdF0gICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBtZW51IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucm91dGVyPWJyb3dzZV0gICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHJvdXRlciByZWdpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnRvb2xiYXI9c2VsZWN0XSAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSB0b29sYmFyIHJlZ2lvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc2VhcmNoYWJsZT10cnVlXSAgICAgICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgc2VhcmNoYWJsZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbnxzdHJpbmd9ICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZmlsdGVyYWJsZT1mYWxzZV0gICAgICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgZmlsdGVyYWJsZSwgYW5kIGlmIHNvIHdoYXQgZmlsdGVycyBzaG91bGQgYmUgc2hvd24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY2NlcHRzICdhbGwnLCAndXBsb2FkZWQnLCBvciAndW5hdHRhY2hlZCcuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnNvcnRhYmxlPXRydWVdICAgICAgICAgICBXaGV0aGVyIHRoZSBBdHRhY2htZW50cyBzaG91bGQgYmUgc29ydGFibGUuIERlcGVuZHMgb24gdGhlIG9yZGVyYnkgcHJvcGVydHkgYmVpbmcgc2V0IHRvIG1lbnVPcmRlciBvbiB0aGUgYXR0YWNobWVudHMgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuYXV0b1NlbGVjdD10cnVlXSAgICAgICAgIFdoZXRoZXIgYW4gdXBsb2FkZWQgYXR0YWNobWVudCBzaG91bGQgYmUgYXV0b21hdGljYWxseSBhZGRlZCB0byB0aGUgc2VsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5kZXNjcmliZT1mYWxzZV0gICAgICAgICAgV2hldGhlciB0byBvZmZlciBVSSB0byBkZXNjcmliZSBhdHRhY2htZW50cyAtIGUuZy4gY2FwdGlvbmluZyBpbWFnZXMgaW4gYSBnYWxsZXJ5LlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb250ZW50VXNlclNldHRpbmc9dHJ1ZV0gV2hldGhlciB0aGUgY29udGVudCByZWdpb24ncyBtb2RlIHNob3VsZCBiZSBzZXQgYW5kIHBlcnNpc3RlZCBwZXIgdXNlci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc3luY1NlbGVjdGlvbj10cnVlXSAgICAgIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNlbGVjdGlvbiBzaG91bGQgYmUgcGVyc2lzdGVkIGZyb20gdGhlIGxhc3Qgc3RhdGUuXG4gKi9cbnZhciBsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRnZXRVc2VyU2V0dGluZyA9IHdpbmRvdy5nZXRVc2VyU2V0dGluZyxcblx0c2V0VXNlclNldHRpbmcgPSB3aW5kb3cuc2V0VXNlclNldHRpbmcsXG5cdExpYnJhcnk7XG5cbkxpYnJhcnkgPSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlLmV4dGVuZCh7XG5cdGRlZmF1bHRzOiB7XG5cdFx0aWQ6ICAgICAgICAgICAgICAgICAnbGlicmFyeScsXG5cdFx0dGl0bGU6ICAgICAgICAgICAgICBsMTBuLm1lZGlhTGlicmFyeVRpdGxlLFxuXHRcdG11bHRpcGxlOiAgICAgICAgICAgZmFsc2UsXG5cdFx0Y29udGVudDogICAgICAgICAgICAndXBsb2FkJyxcblx0XHRtZW51OiAgICAgICAgICAgICAgICdkZWZhdWx0Jyxcblx0XHRyb3V0ZXI6ICAgICAgICAgICAgICdicm93c2UnLFxuXHRcdHRvb2xiYXI6ICAgICAgICAgICAgJ3NlbGVjdCcsXG5cdFx0c2VhcmNoYWJsZTogICAgICAgICB0cnVlLFxuXHRcdGZpbHRlcmFibGU6ICAgICAgICAgZmFsc2UsXG5cdFx0c29ydGFibGU6ICAgICAgICAgICB0cnVlLFxuXHRcdGF1dG9TZWxlY3Q6ICAgICAgICAgdHJ1ZSxcblx0XHRkZXNjcmliZTogICAgICAgICAgIGZhbHNlLFxuXHRcdGNvbnRlbnRVc2VyU2V0dGluZzogdHJ1ZSxcblx0XHRzeW5jU2VsZWN0aW9uOiAgICAgIHRydWVcblx0fSxcblxuXHQvKipcblx0ICogSWYgYSBsaWJyYXJ5IGlzbid0IHByb3ZpZGVkLCBxdWVyeSBhbGwgbWVkaWEgaXRlbXMuXG5cdCAqIElmIGEgc2VsZWN0aW9uIGluc3RhbmNlIGlzbid0IHByb3ZpZGVkLCBjcmVhdGUgb25lLlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLmdldCgnc2VsZWN0aW9uJyksXG5cdFx0XHRwcm9wcztcblxuXHRcdGlmICggISB0aGlzLmdldCgnbGlicmFyeScpICkge1xuXHRcdFx0dGhpcy5zZXQoICdsaWJyYXJ5Jywgd3AubWVkaWEucXVlcnkoKSApO1xuXHRcdH1cblxuXHRcdGlmICggISAoIHNlbGVjdGlvbiBpbnN0YW5jZW9mIHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbiApICkge1xuXHRcdFx0cHJvcHMgPSBzZWxlY3Rpb247XG5cblx0XHRcdGlmICggISBwcm9wcyApIHtcblx0XHRcdFx0cHJvcHMgPSB0aGlzLmdldCgnbGlicmFyeScpLnByb3BzLnRvSlNPTigpO1xuXHRcdFx0XHRwcm9wcyA9IF8ub21pdCggcHJvcHMsICdvcmRlcmJ5JywgJ3F1ZXJ5JyApO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnNldCggJ3NlbGVjdGlvbicsIG5ldyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24oIG51bGwsIHtcblx0XHRcdFx0bXVsdGlwbGU6IHRoaXMuZ2V0KCdtdWx0aXBsZScpLFxuXHRcdFx0XHRwcm9wczogcHJvcHNcblx0XHRcdH0pICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5yZXNldERpc3BsYXlzKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc3luY1NlbGVjdGlvbigpO1xuXG5cdFx0d3AuVXBsb2FkZXIucXVldWUub24oICdhZGQnLCB0aGlzLnVwbG9hZGluZywgdGhpcyApO1xuXG5cdFx0dGhpcy5nZXQoJ3NlbGVjdGlvbicpLm9uKCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMucmVmcmVzaENvbnRlbnQsIHRoaXMgKTtcblxuXHRcdGlmICggdGhpcy5nZXQoICdyb3V0ZXInICkgJiYgdGhpcy5nZXQoJ2NvbnRlbnRVc2VyU2V0dGluZycpICkge1xuXHRcdFx0dGhpcy5mcmFtZS5vbiggJ2NvbnRlbnQ6YWN0aXZhdGUnLCB0aGlzLnNhdmVDb250ZW50TW9kZSwgdGhpcyApO1xuXHRcdFx0dGhpcy5zZXQoICdjb250ZW50JywgZ2V0VXNlclNldHRpbmcoICdsaWJyYXJ5Q29udGVudCcsIHRoaXMuZ2V0KCdjb250ZW50JykgKSApO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJlY29yZFNlbGVjdGlvbigpO1xuXG5cdFx0dGhpcy5mcmFtZS5vZmYoICdjb250ZW50OmFjdGl2YXRlJywgdGhpcy5zYXZlQ29udGVudE1vZGUsIHRoaXMgKTtcblxuXHRcdC8vIFVuYmluZCBhbGwgZXZlbnQgaGFuZGxlcnMgdGhhdCB1c2UgdGhpcyBzdGF0ZSBhcyB0aGUgY29udGV4dFxuXHRcdC8vIGZyb20gdGhlIHNlbGVjdGlvbi5cblx0XHR0aGlzLmdldCgnc2VsZWN0aW9uJykub2ZmKCBudWxsLCBudWxsLCB0aGlzICk7XG5cblx0XHR3cC5VcGxvYWRlci5xdWV1ZS5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0fSxcblxuXHQvKipcblx0ICogUmVzZXQgdGhlIGxpYnJhcnkgdG8gaXRzIGluaXRpYWwgc3RhdGUuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0cmVzZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2V0KCdzZWxlY3Rpb24nKS5yZXNldCgpO1xuXHRcdHRoaXMucmVzZXREaXNwbGF5cygpO1xuXHRcdHRoaXMucmVmcmVzaENvbnRlbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogUmVzZXQgdGhlIGF0dGFjaG1lbnQgZGlzcGxheSBzZXR0aW5ncyBkZWZhdWx0cyB0byB0aGUgc2l0ZSBvcHRpb25zLlxuXHQgKlxuXHQgKiBJZiBzaXRlIG9wdGlvbnMgZG9uJ3QgZGVmaW5lIHRoZW0sIGZhbGwgYmFjayB0byBhIHBlcnNpc3RlbnQgdXNlciBzZXR0aW5nLlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdHJlc2V0RGlzcGxheXM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZWZhdWx0UHJvcHMgPSB3cC5tZWRpYS52aWV3LnNldHRpbmdzLmRlZmF1bHRQcm9wcztcblx0XHR0aGlzLl9kaXNwbGF5cyA9IFtdO1xuXHRcdHRoaXMuX2RlZmF1bHREaXNwbGF5U2V0dGluZ3MgPSB7XG5cdFx0XHRhbGlnbjogZ2V0VXNlclNldHRpbmcoICdhbGlnbicsIGRlZmF1bHRQcm9wcy5hbGlnbiApIHx8ICdub25lJyxcblx0XHRcdHNpemU6ICBnZXRVc2VyU2V0dGluZyggJ2ltZ3NpemUnLCBkZWZhdWx0UHJvcHMuc2l6ZSApIHx8ICdtZWRpdW0nLFxuXHRcdFx0bGluazogIGdldFVzZXJTZXR0aW5nKCAndXJsYnV0dG9uJywgZGVmYXVsdFByb3BzLmxpbmsgKSB8fCAnbm9uZSdcblx0XHR9O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSBtb2RlbCB0byByZXByZXNlbnQgZGlzcGxheSBzZXR0aW5ncyAoYWxpZ25tZW50LCBldGMuKSBmb3IgYW4gYXR0YWNobWVudC5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH0gYXR0YWNobWVudFxuXHQgKiBAcmV0dXJucyB7QmFja2JvbmUuTW9kZWx9XG5cdCAqL1xuXHRkaXNwbGF5OiBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHR2YXIgZGlzcGxheXMgPSB0aGlzLl9kaXNwbGF5cztcblxuXHRcdGlmICggISBkaXNwbGF5c1sgYXR0YWNobWVudC5jaWQgXSApIHtcblx0XHRcdGRpc3BsYXlzWyBhdHRhY2htZW50LmNpZCBdID0gbmV3IEJhY2tib25lLk1vZGVsKCB0aGlzLmRlZmF1bHREaXNwbGF5U2V0dGluZ3MoIGF0dGFjaG1lbnQgKSApO1xuXHRcdH1cblx0XHRyZXR1cm4gZGlzcGxheXNbIGF0dGFjaG1lbnQuY2lkIF07XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdpdmVuIGFuIGF0dGFjaG1lbnQsIGNyZWF0ZSBhdHRhY2htZW50IGRpc3BsYXkgc2V0dGluZ3MgcHJvcGVydGllcy5cblx0ICpcblx0ICogQHNpbmNlIDMuNi4wXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEubW9kZWwuQXR0YWNobWVudH0gYXR0YWNobWVudFxuXHQgKiBAcmV0dXJucyB7T2JqZWN0fVxuXHQgKi9cblx0ZGVmYXVsdERpc3BsYXlTZXR0aW5nczogZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0dmFyIHNldHRpbmdzID0gXy5jbG9uZSggdGhpcy5fZGVmYXVsdERpc3BsYXlTZXR0aW5ncyApO1xuXG5cdFx0aWYgKCBzZXR0aW5ncy5jYW5FbWJlZCA9IHRoaXMuY2FuRW1iZWQoIGF0dGFjaG1lbnQgKSApIHtcblx0XHRcdHNldHRpbmdzLmxpbmsgPSAnZW1iZWQnO1xuXHRcdH0gZWxzZSBpZiAoICEgdGhpcy5pc0ltYWdlQXR0YWNobWVudCggYXR0YWNobWVudCApICYmIHNldHRpbmdzLmxpbmsgPT09ICdub25lJyApIHtcblx0XHRcdHNldHRpbmdzLmxpbmsgPSAnZmlsZSc7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNldHRpbmdzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBXaGV0aGVyIGFuIGF0dGFjaG1lbnQgaXMgaW1hZ2UuXG5cdCAqXG5cdCAqIEBzaW5jZSA0LjQuMVxuXHQgKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0ICogQHJldHVybnMge0Jvb2xlYW59XG5cdCAqL1xuXHRpc0ltYWdlQXR0YWNobWVudDogZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0Ly8gSWYgdXBsb2FkaW5nLCB3ZSBrbm93IHRoZSBmaWxlbmFtZSBidXQgbm90IHRoZSBtaW1lIHR5cGUuXG5cdFx0aWYgKCBhdHRhY2htZW50LmdldCgndXBsb2FkaW5nJykgKSB7XG5cdFx0XHRyZXR1cm4gL1xcLihqcGU/Z3xwbmd8Z2lmKSQvaS50ZXN0KCBhdHRhY2htZW50LmdldCgnZmlsZW5hbWUnKSApO1xuXHRcdH1cblxuXHRcdHJldHVybiBhdHRhY2htZW50LmdldCgndHlwZScpID09PSAnaW1hZ2UnO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBXaGV0aGVyIGFuIGF0dGFjaG1lbnQgY2FuIGJlIGVtYmVkZGVkIChhdWRpbyBvciB2aWRlbykuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjYuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0ICogQHJldHVybnMge0Jvb2xlYW59XG5cdCAqL1xuXHRjYW5FbWJlZDogZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0Ly8gSWYgdXBsb2FkaW5nLCB3ZSBrbm93IHRoZSBmaWxlbmFtZSBidXQgbm90IHRoZSBtaW1lIHR5cGUuXG5cdFx0aWYgKCAhIGF0dGFjaG1lbnQuZ2V0KCd1cGxvYWRpbmcnKSApIHtcblx0XHRcdHZhciB0eXBlID0gYXR0YWNobWVudC5nZXQoJ3R5cGUnKTtcblx0XHRcdGlmICggdHlwZSAhPT0gJ2F1ZGlvJyAmJiB0eXBlICE9PSAndmlkZW8nICkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIF8uY29udGFpbnMoIHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MuZW1iZWRFeHRzLCBhdHRhY2htZW50LmdldCgnZmlsZW5hbWUnKS5zcGxpdCgnLicpLnBvcCgpICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogSWYgdGhlIHN0YXRlIGlzIGFjdGl2ZSwgbm8gaXRlbXMgYXJlIHNlbGVjdGVkLCBhbmQgdGhlIGN1cnJlbnRcblx0ICogY29udGVudCBtb2RlIGlzIG5vdCBhbiBvcHRpb24gaW4gdGhlIHN0YXRlJ3Mgcm91dGVyIChwcm92aWRlZFxuXHQgKiB0aGUgc3RhdGUgaGFzIGEgcm91dGVyKSwgcmVzZXQgdGhlIGNvbnRlbnQgbW9kZSB0byB0aGUgZGVmYXVsdC5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRyZWZyZXNoQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdGZyYW1lID0gdGhpcy5mcmFtZSxcblx0XHRcdHJvdXRlciA9IGZyYW1lLnJvdXRlci5nZXQoKSxcblx0XHRcdG1vZGUgPSBmcmFtZS5jb250ZW50Lm1vZGUoKTtcblxuXHRcdGlmICggdGhpcy5hY3RpdmUgJiYgISBzZWxlY3Rpb24ubGVuZ3RoICYmIHJvdXRlciAmJiAhIHJvdXRlci5nZXQoIG1vZGUgKSApIHtcblx0XHRcdHRoaXMuZnJhbWUuY29udGVudC5yZW5kZXIoIHRoaXMuZ2V0KCdjb250ZW50JykgKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGhhbmRsZXIgd2hlbiBhbiBhdHRhY2htZW50IGlzIHVwbG9hZGVkLlxuXHQgKlxuXHQgKiBTd2l0Y2ggdG8gdGhlIE1lZGlhIExpYnJhcnkgaWYgdXBsb2FkZWQgZnJvbSB0aGUgJ1VwbG9hZCBGaWxlcycgdGFiLlxuXHQgKlxuXHQgKiBBZGRzIGFueSB1cGxvYWRpbmcgYXR0YWNobWVudHMgdG8gdGhlIHNlbGVjdGlvbi5cblx0ICpcblx0ICogSWYgdGhlIHN0YXRlIG9ubHkgc3VwcG9ydHMgb25lIGF0dGFjaG1lbnQgdG8gYmUgc2VsZWN0ZWQgYW5kIG11bHRpcGxlXG5cdCAqIGF0dGFjaG1lbnRzIGFyZSB1cGxvYWRlZCwgdGhlIGxhc3QgYXR0YWNobWVudCBpbiB0aGUgdXBsb2FkIHF1ZXVlIHdpbGxcblx0ICogYmUgc2VsZWN0ZWQuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0ICovXG5cdHVwbG9hZGluZzogZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0dmFyIGNvbnRlbnQgPSB0aGlzLmZyYW1lLmNvbnRlbnQ7XG5cblx0XHRpZiAoICd1cGxvYWQnID09PSBjb250ZW50Lm1vZGUoKSApIHtcblx0XHRcdHRoaXMuZnJhbWUuY29udGVudC5tb2RlKCdicm93c2UnKTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMuZ2V0KCAnYXV0b1NlbGVjdCcgKSApIHtcblx0XHRcdHRoaXMuZ2V0KCdzZWxlY3Rpb24nKS5hZGQoIGF0dGFjaG1lbnQgKTtcblx0XHRcdHRoaXMuZnJhbWUudHJpZ2dlciggJ2xpYnJhcnk6c2VsZWN0aW9uOmFkZCcgKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIFBlcnNpc3QgdGhlIG1vZGUgb2YgdGhlIGNvbnRlbnQgcmVnaW9uIGFzIGEgdXNlciBzZXR0aW5nLlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdHNhdmVDb250ZW50TW9kZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAnYnJvd3NlJyAhPT0gdGhpcy5nZXQoJ3JvdXRlcicpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBtb2RlID0gdGhpcy5mcmFtZS5jb250ZW50Lm1vZGUoKSxcblx0XHRcdHZpZXcgPSB0aGlzLmZyYW1lLnJvdXRlci5nZXQoKTtcblxuXHRcdGlmICggdmlldyAmJiB2aWV3LmdldCggbW9kZSApICkge1xuXHRcdFx0c2V0VXNlclNldHRpbmcoICdsaWJyYXJ5Q29udGVudCcsIG1vZGUgKTtcblx0XHR9XG5cdH1cbn0pO1xuXG4vLyBNYWtlIHNlbGVjdGlvblN5bmMgYXZhaWxhYmxlIG9uIGFueSBNZWRpYSBMaWJyYXJ5IHN0YXRlLlxuXy5leHRlbmQoIExpYnJhcnkucHJvdG90eXBlLCB3cC5tZWRpYS5zZWxlY3Rpb25TeW5jICk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlicmFyeTtcbiIsIi8qKlxuICogd3AubWVkaWEuY29udHJvbGxlci5NZWRpYUxpYnJhcnlcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnlcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqL1xudmFyIExpYnJhcnkgPSB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnksXG5cdE1lZGlhTGlicmFyeTtcblxuTWVkaWFMaWJyYXJ5ID0gTGlicmFyeS5leHRlbmQoe1xuXHRkZWZhdWx0czogXy5kZWZhdWx0cyh7XG5cdFx0Ly8gQXR0YWNobWVudHMgYnJvd3NlciBkZWZhdWx0cy4gQHNlZSBtZWRpYS52aWV3LkF0dGFjaG1lbnRzQnJvd3NlclxuXHRcdGZpbHRlcmFibGU6ICAgICAgJ3VwbG9hZGVkJyxcblxuXHRcdGRpc3BsYXlTZXR0aW5nczogZmFsc2UsXG5cdFx0cHJpb3JpdHk6ICAgICAgICA4MCxcblx0XHRzeW5jU2VsZWN0aW9uOiAgIGZhbHNlXG5cdH0sIExpYnJhcnkucHJvdG90eXBlLmRlZmF1bHRzICksXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAzLjkuMFxuXHQgKlxuXHQgKiBAcGFyYW0gb3B0aW9uc1xuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5tZWRpYSA9IG9wdGlvbnMubWVkaWE7XG5cdFx0dGhpcy50eXBlID0gb3B0aW9ucy50eXBlO1xuXHRcdHRoaXMuc2V0KCAnbGlicmFyeScsIHdwLm1lZGlhLnF1ZXJ5KHsgdHlwZTogdGhpcy50eXBlIH0pICk7XG5cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gQHRvZG8gdGhpcyBzaG91bGQgdXNlIHRoaXMuZnJhbWUuXG5cdFx0aWYgKCB3cC5tZWRpYS5mcmFtZS5sYXN0TWltZSApIHtcblx0XHRcdHRoaXMuc2V0KCAnbGlicmFyeScsIHdwLm1lZGlhLnF1ZXJ5KHsgdHlwZTogd3AubWVkaWEuZnJhbWUubGFzdE1pbWUgfSkgKTtcblx0XHRcdGRlbGV0ZSB3cC5tZWRpYS5mcmFtZS5sYXN0TWltZTtcblx0XHR9XG5cdFx0TGlicmFyeS5wcm90b3R5cGUuYWN0aXZhdGUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZWRpYUxpYnJhcnk7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uXG4gKlxuICogQSByZWdpb24gaXMgYSBwZXJzaXN0ZW50IGFwcGxpY2F0aW9uIGxheW91dCBhcmVhLlxuICpcbiAqIEEgcmVnaW9uIGFzc3VtZXMgb25lIG1vZGUgYXQgYW55IHRpbWUsIGFuZCBjYW4gYmUgc3dpdGNoZWQgdG8gYW5vdGhlci5cbiAqXG4gKiBXaGVuIG1vZGUgY2hhbmdlcywgZXZlbnRzIGFyZSB0cmlnZ2VyZWQgb24gdGhlIHJlZ2lvbidzIHBhcmVudCB2aWV3LlxuICogVGhlIHBhcmVudCB2aWV3IHdpbGwgbGlzdGVuIHRvIHNwZWNpZmljIGV2ZW50cyBhbmQgZmlsbCB0aGUgcmVnaW9uIHdpdGggYW5cbiAqIGFwcHJvcHJpYXRlIHZpZXcgZGVwZW5kaW5nIG9uIG1vZGUuIEZvciBleGFtcGxlLCBhIGZyYW1lIGxpc3RlbnMgZm9yIHRoZVxuICogJ2Jyb3dzZScgbW9kZSB0IGJlIGFjdGl2YXRlZCBvbiB0aGUgJ2NvbnRlbnQnIHZpZXcgYW5kIHRoZW4gZmlsbHMgdGhlIHJlZ2lvblxuICogd2l0aCBhbiBBdHRhY2htZW50c0Jyb3dzZXIgdmlldy5cbiAqXG4gKiBAY2xhc3NcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgIG9wdGlvbnMgICAgICAgICAgT3B0aW9ucyBoYXNoIGZvciB0aGUgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICBvcHRpb25zLmlkICAgICAgIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgcmVnaW9uLlxuICogQHBhcmFtIHtCYWNrYm9uZS5WaWV3fSBvcHRpb25zLnZpZXcgICAgIEEgcGFyZW50IHZpZXcgdGhlIHJlZ2lvbiBleGlzdHMgd2l0aGluLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICBvcHRpb25zLnNlbGVjdG9yIGpRdWVyeSBzZWxlY3RvciBmb3IgdGhlIHJlZ2lvbiB3aXRoaW4gdGhlIHBhcmVudCB2aWV3LlxuICovXG52YXIgUmVnaW9uID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdF8uZXh0ZW5kKCB0aGlzLCBfLnBpY2soIG9wdGlvbnMgfHwge30sICdpZCcsICd2aWV3JywgJ3NlbGVjdG9yJyApICk7XG59O1xuXG4vLyBVc2UgQmFja2JvbmUncyBzZWxmLXByb3BhZ2F0aW5nIGBleHRlbmRgIGluaGVyaXRhbmNlIG1ldGhvZC5cblJlZ2lvbi5leHRlbmQgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQ7XG5cbl8uZXh0ZW5kKCBSZWdpb24ucHJvdG90eXBlLCB7XG5cdC8qKlxuXHQgKiBBY3RpdmF0ZSBhIG1vZGUuXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbW9kZVxuXHQgKlxuXHQgKiBAZmlyZXMgdGhpcy52aWV3I3t0aGlzLmlkfTphY3RpdmF0ZTp7dGhpcy5fbW9kZX1cblx0ICogQGZpcmVzIHRoaXMudmlldyN7dGhpcy5pZH06YWN0aXZhdGVcblx0ICogQGZpcmVzIHRoaXMudmlldyN7dGhpcy5pZH06ZGVhY3RpdmF0ZTp7dGhpcy5fbW9kZX1cblx0ICogQGZpcmVzIHRoaXMudmlldyN7dGhpcy5pZH06ZGVhY3RpdmF0ZVxuXHQgKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEuY29udHJvbGxlci5SZWdpb259IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nLlxuXHQgKi9cblx0bW9kZTogZnVuY3Rpb24oIG1vZGUgKSB7XG5cdFx0aWYgKCAhIG1vZGUgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fbW9kZTtcblx0XHR9XG5cdFx0Ly8gQmFpbCBpZiB3ZSdyZSB0cnlpbmcgdG8gY2hhbmdlIHRvIHRoZSBjdXJyZW50IG1vZGUuXG5cdFx0aWYgKCBtb2RlID09PSB0aGlzLl9tb2RlICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogUmVnaW9uIG1vZGUgZGVhY3RpdmF0aW9uIGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IHRoaXMudmlldyN7dGhpcy5pZH06ZGVhY3RpdmF0ZTp7dGhpcy5fbW9kZX1cblx0XHQgKiBAZXZlbnQgdGhpcy52aWV3I3t0aGlzLmlkfTpkZWFjdGl2YXRlXG5cdFx0ICovXG5cdFx0dGhpcy50cmlnZ2VyKCdkZWFjdGl2YXRlJyk7XG5cblx0XHR0aGlzLl9tb2RlID0gbW9kZTtcblx0XHR0aGlzLnJlbmRlciggbW9kZSApO1xuXG5cdFx0LyoqXG5cdFx0ICogUmVnaW9uIG1vZGUgYWN0aXZhdGlvbiBldmVudC5cblx0XHQgKlxuXHRcdCAqIEBldmVudCB0aGlzLnZpZXcje3RoaXMuaWR9OmFjdGl2YXRlOnt0aGlzLl9tb2RlfVxuXHRcdCAqIEBldmVudCB0aGlzLnZpZXcje3RoaXMuaWR9OmFjdGl2YXRlXG5cdFx0ICovXG5cdFx0dGhpcy50cmlnZ2VyKCdhY3RpdmF0ZScpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogUmVuZGVyIGEgbW9kZS5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlXG5cdCAqXG5cdCAqIEBmaXJlcyB0aGlzLnZpZXcje3RoaXMuaWR9OmNyZWF0ZTp7dGhpcy5fbW9kZX1cblx0ICogQGZpcmVzIHRoaXMudmlldyN7dGhpcy5pZH06Y3JlYXRlXG5cdCAqIEBmaXJlcyB0aGlzLnZpZXcje3RoaXMuaWR9OnJlbmRlcjp7dGhpcy5fbW9kZX1cblx0ICogQGZpcmVzIHRoaXMudmlldyN7dGhpcy5pZH06cmVuZGVyXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5jb250cm9sbGVyLlJlZ2lvbn0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oIG1vZGUgKSB7XG5cdFx0Ly8gSWYgdGhlIG1vZGUgaXNuJ3QgYWN0aXZlLCBhY3RpdmF0ZSBpdC5cblx0XHRpZiAoIG1vZGUgJiYgbW9kZSAhPT0gdGhpcy5fbW9kZSApIHtcblx0XHRcdHJldHVybiB0aGlzLm1vZGUoIG1vZGUgKTtcblx0XHR9XG5cblx0XHR2YXIgc2V0ID0geyB2aWV3OiBudWxsIH0sXG5cdFx0XHR2aWV3O1xuXG5cdFx0LyoqXG5cdFx0ICogQ3JlYXRlIHJlZ2lvbiB2aWV3IGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogUmVnaW9uIHZpZXcgY3JlYXRpb24gdGFrZXMgcGxhY2UgaW4gYW4gZXZlbnQgY2FsbGJhY2sgb24gdGhlIGZyYW1lLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IHRoaXMudmlldyN7dGhpcy5pZH06Y3JlYXRlOnt0aGlzLl9tb2RlfVxuXHRcdCAqIEBldmVudCB0aGlzLnZpZXcje3RoaXMuaWR9OmNyZWF0ZVxuXHRcdCAqL1xuXHRcdHRoaXMudHJpZ2dlciggJ2NyZWF0ZScsIHNldCApO1xuXHRcdHZpZXcgPSBzZXQudmlldztcblxuXHRcdC8qKlxuXHRcdCAqIFJlbmRlciByZWdpb24gdmlldyBldmVudC5cblx0XHQgKlxuXHRcdCAqIFJlZ2lvbiB2aWV3IGNyZWF0aW9uIHRha2VzIHBsYWNlIGluIGFuIGV2ZW50IGNhbGxiYWNrIG9uIHRoZSBmcmFtZS5cblx0XHQgKlxuXHRcdCAqIEBldmVudCB0aGlzLnZpZXcje3RoaXMuaWR9OmNyZWF0ZTp7dGhpcy5fbW9kZX1cblx0XHQgKiBAZXZlbnQgdGhpcy52aWV3I3t0aGlzLmlkfTpjcmVhdGVcblx0XHQgKi9cblx0XHR0aGlzLnRyaWdnZXIoICdyZW5kZXInLCB2aWV3ICk7XG5cdFx0aWYgKCB2aWV3ICkge1xuXHRcdFx0dGhpcy5zZXQoIHZpZXcgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCB0aGUgcmVnaW9uJ3Mgdmlldy5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5WaWV3fVxuXHQgKi9cblx0Z2V0OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy52aWV3LnZpZXdzLmZpcnN0KCB0aGlzLnNlbGVjdG9yICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldCB0aGUgcmVnaW9uJ3MgdmlldyBhcyBhIHN1YnZpZXcgb2YgdGhlIGZyYW1lLlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHZpZXdzXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV1cblx0ICogQHJldHVybnMge3dwLkJhY2tib25lLlN1YnZpZXdzfSBTdWJ2aWV3cyBpcyByZXR1cm5lZCB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0c2V0OiBmdW5jdGlvbiggdmlld3MsIG9wdGlvbnMgKSB7XG5cdFx0aWYgKCBvcHRpb25zICkge1xuXHRcdFx0b3B0aW9ucy5hZGQgPSBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMudmlldy52aWV3cy5zZXQoIHRoaXMuc2VsZWN0b3IsIHZpZXdzLCBvcHRpb25zICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFRyaWdnZXIgcmVnaW9uYWwgdmlldyBldmVudHMgb24gdGhlIGZyYW1lLlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHt1bmRlZmluZWR8d3AubWVkaWEuY29udHJvbGxlci5SZWdpb259IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nLlxuXHQgKi9cblx0dHJpZ2dlcjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBiYXNlLCBhcmdzO1xuXG5cdFx0aWYgKCAhIHRoaXMuX21vZGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0YXJncyA9IF8udG9BcnJheSggYXJndW1lbnRzICk7XG5cdFx0YmFzZSA9IHRoaXMuaWQgKyAnOicgKyBldmVudDtcblxuXHRcdC8vIFRyaWdnZXIgYHt0aGlzLmlkfTp7ZXZlbnR9Ont0aGlzLl9tb2RlfWAgZXZlbnQgb24gdGhlIGZyYW1lLlxuXHRcdGFyZ3NbMF0gPSBiYXNlICsgJzonICsgdGhpcy5fbW9kZTtcblx0XHR0aGlzLnZpZXcudHJpZ2dlci5hcHBseSggdGhpcy52aWV3LCBhcmdzICk7XG5cblx0XHQvLyBUcmlnZ2VyIGB7dGhpcy5pZH06e2V2ZW50fWAgZXZlbnQgb24gdGhlIGZyYW1lLlxuXHRcdGFyZ3NbMF0gPSBiYXNlO1xuXHRcdHRoaXMudmlldy50cmlnZ2VyLmFwcGx5KCB0aGlzLnZpZXcsIGFyZ3MgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVnaW9uO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLlJlcGxhY2VJbWFnZVxuICpcbiAqIEEgc3RhdGUgZm9yIHJlcGxhY2luZyBhbiBpbWFnZS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnlcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlc10gICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGF0dHJpYnV0ZXMgaGFzaCBwYXNzZWQgdG8gdGhlIHN0YXRlLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuaWQ9cmVwbGFjZS1pbWFnZV0gICAgICAgIFVuaXF1ZSBpZGVudGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudGl0bGU9UmVwbGFjZSBJbWFnZV0gICAgIFRpdGxlIGZvciB0aGUgc3RhdGUuIERpc3BsYXlzIGluIHRoZSBtZWRpYSBtZW51IGFuZCB0aGUgZnJhbWUncyB0aXRsZSByZWdpb24uXG4gKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzfSBbYXR0cmlidXRlcy5saWJyYXJ5XSAgICAgICAgICAgICAgICAgVGhlIGF0dGFjaG1lbnRzIGNvbGxlY3Rpb24gdG8gYnJvd3NlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElmIG9uZSBpcyBub3Qgc3VwcGxpZWQsIGEgY29sbGVjdGlvbiBvZiBhbGwgaW1hZ2VzIHdpbGwgYmUgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm11bHRpcGxlPWZhbHNlXSAgICAgICAgICBXaGV0aGVyIG11bHRpLXNlbGVjdCBpcyBlbmFibGVkLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29udGVudD11cGxvYWRdICAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE92ZXJyaWRkZW4gYnkgcGVyc2lzdGVudCB1c2VyIHNldHRpbmcgaWYgJ2NvbnRlbnRVc2VyU2V0dGluZycgaXMgdHJ1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLm1lbnU9ZGVmYXVsdF0gICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSBtZW51IHJlZ2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLnJvdXRlcj1icm93c2VdICAgICAgICAgICBJbml0aWFsIG1vZGUgZm9yIHRoZSByb3V0ZXIgcmVnaW9uLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMudG9vbGJhcj1yZXBsYWNlXSAgICAgICAgIEluaXRpYWwgbW9kZSBmb3IgdGhlIHRvb2xiYXIgcmVnaW9uLlxuICogQHBhcmFtIHtpbnR9ICAgICAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMucHJpb3JpdHk9NjBdICAgICAgICAgICAgIFRoZSBwcmlvcml0eSBmb3IgdGhlIHN0YXRlIGxpbmsgaW4gdGhlIG1lZGlhIG1lbnUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5zZWFyY2hhYmxlPXRydWVdICAgICAgICAgV2hldGhlciB0aGUgbGlicmFyeSBpcyBzZWFyY2hhYmxlLlxuICogQHBhcmFtIHtib29sZWFufHN0cmluZ30gICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZmlsdGVyYWJsZT11cGxvYWRlZF0gICAgIFdoZXRoZXIgdGhlIGxpYnJhcnkgaXMgZmlsdGVyYWJsZSwgYW5kIGlmIHNvIHdoYXQgZmlsdGVycyBzaG91bGQgYmUgc2hvd24uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWNjZXB0cyAnYWxsJywgJ3VwbG9hZGVkJywgb3IgJ3VuYXR0YWNoZWQnLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc29ydGFibGU9dHJ1ZV0gICAgICAgICAgIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNob3VsZCBiZSBzb3J0YWJsZS4gRGVwZW5kcyBvbiB0aGUgb3JkZXJieSBwcm9wZXJ0eSBiZWluZyBzZXQgdG8gbWVudU9yZGVyIG9uIHRoZSBhdHRhY2htZW50cyBjb2xsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuYXV0b1NlbGVjdD10cnVlXSAgICAgICAgIFdoZXRoZXIgYW4gdXBsb2FkZWQgYXR0YWNobWVudCBzaG91bGQgYmUgYXV0b21hdGljYWxseSBhZGRlZCB0byB0aGUgc2VsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuZGVzY3JpYmU9ZmFsc2VdICAgICAgICAgIFdoZXRoZXIgdG8gb2ZmZXIgVUkgdG8gZGVzY3JpYmUgYXR0YWNobWVudHMgLSBlLmcuIGNhcHRpb25pbmcgaW1hZ2VzIGluIGEgZ2FsbGVyeS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbnRlbnRVc2VyU2V0dGluZz10cnVlXSBXaGV0aGVyIHRoZSBjb250ZW50IHJlZ2lvbidzIG1vZGUgc2hvdWxkIGJlIHNldCBhbmQgcGVyc2lzdGVkIHBlciB1c2VyLlxuICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuc3luY1NlbGVjdGlvbj10cnVlXSAgICAgIFdoZXRoZXIgdGhlIEF0dGFjaG1lbnRzIHNlbGVjdGlvbiBzaG91bGQgYmUgcGVyc2lzdGVkIGZyb20gdGhlIGxhc3Qgc3RhdGUuXG4gKi9cbnZhciBMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRSZXBsYWNlSW1hZ2U7XG5cblJlcGxhY2VJbWFnZSA9IExpYnJhcnkuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IF8uZGVmYXVsdHMoe1xuXHRcdGlkOiAgICAgICAgICAgICdyZXBsYWNlLWltYWdlJyxcblx0XHR0aXRsZTogICAgICAgICBsMTBuLnJlcGxhY2VJbWFnZVRpdGxlLFxuXHRcdG11bHRpcGxlOiAgICAgIGZhbHNlLFxuXHRcdGZpbHRlcmFibGU6ICAgICd1cGxvYWRlZCcsXG5cdFx0dG9vbGJhcjogICAgICAgJ3JlcGxhY2UnLFxuXHRcdG1lbnU6ICAgICAgICAgIGZhbHNlLFxuXHRcdHByaW9yaXR5OiAgICAgIDYwLFxuXHRcdHN5bmNTZWxlY3Rpb246IHRydWVcblx0fSwgTGlicmFyeS5wcm90b3R5cGUuZGVmYXVsdHMgKSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR2YXIgbGlicmFyeSwgY29tcGFyYXRvcjtcblxuXHRcdHRoaXMuaW1hZ2UgPSBvcHRpb25zLmltYWdlO1xuXHRcdC8vIElmIHdlIGhhdmVuJ3QgYmVlbiBwcm92aWRlZCBhIGBsaWJyYXJ5YCwgY3JlYXRlIGEgYFNlbGVjdGlvbmAuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdsaWJyYXJ5JykgKSB7XG5cdFx0XHR0aGlzLnNldCggJ2xpYnJhcnknLCB3cC5tZWRpYS5xdWVyeSh7IHR5cGU6ICdpbWFnZScgfSkgKTtcblx0XHR9XG5cblx0XHRMaWJyYXJ5LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdGxpYnJhcnkgICAgPSB0aGlzLmdldCgnbGlicmFyeScpO1xuXHRcdGNvbXBhcmF0b3IgPSBsaWJyYXJ5LmNvbXBhcmF0b3I7XG5cblx0XHQvLyBPdmVybG9hZCB0aGUgbGlicmFyeSdzIGNvbXBhcmF0b3IgdG8gcHVzaCBpdGVtcyB0aGF0IGFyZSBub3QgaW5cblx0XHQvLyB0aGUgbWlycm9yZWQgcXVlcnkgdG8gdGhlIGZyb250IG9mIHRoZSBhZ2dyZWdhdGUgY29sbGVjdGlvbi5cblx0XHRsaWJyYXJ5LmNvbXBhcmF0b3IgPSBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRcdHZhciBhSW5RdWVyeSA9ICEhIHRoaXMubWlycm9yaW5nLmdldCggYS5jaWQgKSxcblx0XHRcdFx0YkluUXVlcnkgPSAhISB0aGlzLm1pcnJvcmluZy5nZXQoIGIuY2lkICk7XG5cblx0XHRcdGlmICggISBhSW5RdWVyeSAmJiBiSW5RdWVyeSApIHtcblx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0fSBlbHNlIGlmICggYUluUXVlcnkgJiYgISBiSW5RdWVyeSApIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gY29tcGFyYXRvci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIEFkZCBhbGwgaXRlbXMgaW4gdGhlIHNlbGVjdGlvbiB0byB0aGUgbGlicmFyeSwgc28gYW55IGZlYXR1cmVkXG5cdFx0Ly8gaW1hZ2VzIHRoYXQgYXJlIG5vdCBpbml0aWFsbHkgbG9hZGVkIHN0aWxsIGFwcGVhci5cblx0XHRsaWJyYXJ5Lm9ic2VydmUoIHRoaXMuZ2V0KCdzZWxlY3Rpb24nKSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMy45LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVwZGF0ZVNlbGVjdGlvbigpO1xuXHRcdExpYnJhcnkucHJvdG90eXBlLmFjdGl2YXRlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDMuOS4wXG5cdCAqL1xuXHR1cGRhdGVTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLmdldCgnc2VsZWN0aW9uJyksXG5cdFx0XHRhdHRhY2htZW50ID0gdGhpcy5pbWFnZS5hdHRhY2htZW50O1xuXG5cdFx0c2VsZWN0aW9uLnJlc2V0KCBhdHRhY2htZW50ID8gWyBhdHRhY2htZW50IF0gOiBbXSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZXBsYWNlSW1hZ2U7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuU2l0ZUljb25Dcm9wcGVyXG4gKlxuICogQSBzdGF0ZSBmb3IgY3JvcHBpbmcgYSBTaXRlIEljb24uXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5Dcm9wcGVyXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZVxuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKi9cbnZhciBDb250cm9sbGVyID0gd3AubWVkaWEuY29udHJvbGxlcixcblx0U2l0ZUljb25Dcm9wcGVyO1xuXG5TaXRlSWNvbkNyb3BwZXIgPSBDb250cm9sbGVyLkNyb3BwZXIuZXh0ZW5kKHtcblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZnJhbWUub24oICdjb250ZW50OmNyZWF0ZTpjcm9wJywgdGhpcy5jcmVhdGVDcm9wQ29udGVudCwgdGhpcyApO1xuXHRcdHRoaXMuZnJhbWUub24oICdjbG9zZScsIHRoaXMucmVtb3ZlQ3JvcHBlciwgdGhpcyApO1xuXHRcdHRoaXMuc2V0KCdzZWxlY3Rpb24nLCBuZXcgQmFja2JvbmUuQ29sbGVjdGlvbih0aGlzLmZyYW1lLl9zZWxlY3Rpb24uc2luZ2xlKSk7XG5cdH0sXG5cblx0Y3JlYXRlQ3JvcENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY3JvcHBlclZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5TaXRlSWNvbkNyb3BwZXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGF0dGFjaG1lbnQ6IHRoaXMuZ2V0KCdzZWxlY3Rpb24nKS5maXJzdCgpXG5cdFx0fSk7XG5cdFx0dGhpcy5jcm9wcGVyVmlldy5vbignaW1hZ2UtbG9hZGVkJywgdGhpcy5jcmVhdGVDcm9wVG9vbGJhciwgdGhpcyk7XG5cdFx0dGhpcy5mcmFtZS5jb250ZW50LnNldCh0aGlzLmNyb3BwZXJWaWV3KTtcblxuXHR9LFxuXG5cdGRvQ3JvcDogZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0dmFyIGNyb3BEZXRhaWxzID0gYXR0YWNobWVudC5nZXQoICdjcm9wRGV0YWlscycgKSxcblx0XHRcdGNvbnRyb2wgPSB0aGlzLmdldCggJ2NvbnRyb2wnICk7XG5cblx0XHRjcm9wRGV0YWlscy5kc3Rfd2lkdGggID0gY29udHJvbC5wYXJhbXMud2lkdGg7XG5cdFx0Y3JvcERldGFpbHMuZHN0X2hlaWdodCA9IGNvbnRyb2wucGFyYW1zLmhlaWdodDtcblxuXHRcdHJldHVybiB3cC5hamF4LnBvc3QoICdjcm9wLWltYWdlJywge1xuXHRcdFx0bm9uY2U6IGF0dGFjaG1lbnQuZ2V0KCAnbm9uY2VzJyApLmVkaXQsXG5cdFx0XHRpZDogYXR0YWNobWVudC5nZXQoICdpZCcgKSxcblx0XHRcdGNvbnRleHQ6ICdzaXRlLWljb24nLFxuXHRcdFx0Y3JvcERldGFpbHM6IGNyb3BEZXRhaWxzXG5cdFx0fSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaXRlSWNvbkNyb3BwZXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lXG4gKlxuICogQSBzdGF0ZSBtYWNoaW5lIGtlZXBzIHRyYWNrIG9mIHN0YXRlLiBJdCBpcyBpbiBvbmUgc3RhdGUgYXQgYSB0aW1lLFxuICogYW5kIGNhbiBjaGFuZ2UgZnJvbSBvbmUgc3RhdGUgdG8gYW5vdGhlci5cbiAqXG4gKiBTdGF0ZXMgYXJlIHN0b3JlZCBhcyBtb2RlbHMgaW4gYSBCYWNrYm9uZSBjb2xsZWN0aW9uLlxuICpcbiAqIEBzaW5jZSAzLjUuMFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKiBAbWl4aW5cbiAqIEBtaXhlcyBCYWNrYm9uZS5FdmVudHNcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBzdGF0ZXNcbiAqL1xudmFyIFN0YXRlTWFjaGluZSA9IGZ1bmN0aW9uKCBzdGF0ZXMgKSB7XG5cdC8vIEB0b2RvIFRoaXMgaXMgZGVhZCBjb2RlLiBUaGUgc3RhdGVzIGNvbGxlY3Rpb24gZ2V0cyBjcmVhdGVkIGluIG1lZGlhLnZpZXcuRnJhbWUuX2NyZWF0ZVN0YXRlcy5cblx0dGhpcy5zdGF0ZXMgPSBuZXcgQmFja2JvbmUuQ29sbGVjdGlvbiggc3RhdGVzICk7XG59O1xuXG4vLyBVc2UgQmFja2JvbmUncyBzZWxmLXByb3BhZ2F0aW5nIGBleHRlbmRgIGluaGVyaXRhbmNlIG1ldGhvZC5cblN0YXRlTWFjaGluZS5leHRlbmQgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQ7XG5cbl8uZXh0ZW5kKCBTdGF0ZU1hY2hpbmUucHJvdG90eXBlLCBCYWNrYm9uZS5FdmVudHMsIHtcblx0LyoqXG5cdCAqIEZldGNoIGEgc3RhdGUuXG5cdCAqXG5cdCAqIElmIG5vIGBpZGAgaXMgcHJvdmlkZWQsIHJldHVybnMgdGhlIGFjdGl2ZSBzdGF0ZS5cblx0ICpcblx0ICogSW1wbGljaXRseSBjcmVhdGVzIHN0YXRlcy5cblx0ICpcblx0ICogRW5zdXJlIHRoYXQgdGhlIGBzdGF0ZXNgIGNvbGxlY3Rpb24gZXhpc3RzIHNvIHRoZSBgU3RhdGVNYWNoaW5lYFxuXHQgKiAgIGNhbiBiZSB1c2VkIGFzIGEgbWl4aW4uXG5cdCAqXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaWRcblx0ICogQHJldHVybnMge3dwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGV9IFJldHVybnMgYSBTdGF0ZSBtb2RlbFxuXHQgKiAgIGZyb20gdGhlIFN0YXRlTWFjaGluZSBjb2xsZWN0aW9uXG5cdCAqL1xuXHRzdGF0ZTogZnVuY3Rpb24oIGlkICkge1xuXHRcdHRoaXMuc3RhdGVzID0gdGhpcy5zdGF0ZXMgfHwgbmV3IEJhY2tib25lLkNvbGxlY3Rpb24oKTtcblxuXHRcdC8vIERlZmF1bHQgdG8gdGhlIGFjdGl2ZSBzdGF0ZS5cblx0XHRpZCA9IGlkIHx8IHRoaXMuX3N0YXRlO1xuXG5cdFx0aWYgKCBpZCAmJiAhIHRoaXMuc3RhdGVzLmdldCggaWQgKSApIHtcblx0XHRcdHRoaXMuc3RhdGVzLmFkZCh7IGlkOiBpZCB9KTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuc3RhdGVzLmdldCggaWQgKTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0cyB0aGUgYWN0aXZlIHN0YXRlLlxuXHQgKlxuXHQgKiBCYWlsIGlmIHdlJ3JlIHRyeWluZyB0byBzZWxlY3QgdGhlIGN1cnJlbnQgc3RhdGUsIGlmIHdlIGhhdmVuJ3Rcblx0ICogY3JlYXRlZCB0aGUgYHN0YXRlc2AgY29sbGVjdGlvbiwgb3IgYXJlIHRyeWluZyB0byBzZWxlY3QgYSBzdGF0ZVxuXHQgKiB0aGF0IGRvZXMgbm90IGV4aXN0LlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGlkXG5cdCAqXG5cdCAqIEBmaXJlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlI2RlYWN0aXZhdGVcblx0ICogQGZpcmVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUjYWN0aXZhdGVcblx0ICpcblx0ICogQHJldHVybnMge3dwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0c2V0U3RhdGU6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgcHJldmlvdXMgPSB0aGlzLnN0YXRlKCk7XG5cblx0XHRpZiAoICggcHJldmlvdXMgJiYgaWQgPT09IHByZXZpb3VzLmlkICkgfHwgISB0aGlzLnN0YXRlcyB8fCAhIHRoaXMuc3RhdGVzLmdldCggaWQgKSApIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblxuXHRcdGlmICggcHJldmlvdXMgKSB7XG5cdFx0XHRwcmV2aW91cy50cmlnZ2VyKCdkZWFjdGl2YXRlJyk7XG5cdFx0XHR0aGlzLl9sYXN0U3RhdGUgPSBwcmV2aW91cy5pZDtcblx0XHR9XG5cblx0XHR0aGlzLl9zdGF0ZSA9IGlkO1xuXHRcdHRoaXMuc3RhdGUoKS50cmlnZ2VyKCdhY3RpdmF0ZScpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHByZXZpb3VzIGFjdGl2ZSBzdGF0ZS5cblx0ICpcblx0ICogQ2FsbCB0aGUgYHN0YXRlKClgIG1ldGhvZCB3aXRoIG5vIHBhcmFtZXRlcnMgdG8gcmV0cmlldmUgdGhlIGN1cnJlbnRcblx0ICogYWN0aXZlIHN0YXRlLlxuXHQgKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHJldHVybnMge3dwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGV9IFJldHVybnMgYSBTdGF0ZSBtb2RlbFxuXHQgKiAgICBmcm9tIHRoZSBTdGF0ZU1hY2hpbmUgY29sbGVjdGlvblxuXHQgKi9cblx0bGFzdFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuX2xhc3RTdGF0ZSApIHtcblx0XHRcdHJldHVybiB0aGlzLnN0YXRlKCB0aGlzLl9sYXN0U3RhdGUgKTtcblx0XHR9XG5cdH1cbn0pO1xuXG4vLyBNYXAgYWxsIGV2ZW50IGJpbmRpbmcgYW5kIHRyaWdnZXJpbmcgb24gYSBTdGF0ZU1hY2hpbmUgdG8gaXRzIGBzdGF0ZXNgIGNvbGxlY3Rpb24uXG5fLmVhY2goWyAnb24nLCAnb2ZmJywgJ3RyaWdnZXInIF0sIGZ1bmN0aW9uKCBtZXRob2QgKSB7XG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmV9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nLlxuXHQgKi9cblx0U3RhdGVNYWNoaW5lLnByb3RvdHlwZVsgbWV0aG9kIF0gPSBmdW5jdGlvbigpIHtcblx0XHQvLyBFbnN1cmUgdGhhdCB0aGUgYHN0YXRlc2AgY29sbGVjdGlvbiBleGlzdHMgc28gdGhlIGBTdGF0ZU1hY2hpbmVgXG5cdFx0Ly8gY2FuIGJlIHVzZWQgYXMgYSBtaXhpbi5cblx0XHR0aGlzLnN0YXRlcyA9IHRoaXMuc3RhdGVzIHx8IG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKCk7XG5cdFx0Ly8gRm9yd2FyZCB0aGUgbWV0aG9kIHRvIHRoZSBgc3RhdGVzYCBjb2xsZWN0aW9uLlxuXHRcdHRoaXMuc3RhdGVzWyBtZXRob2QgXS5hcHBseSggdGhpcy5zdGF0ZXMsIGFyZ3VtZW50cyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVNYWNoaW5lO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKlxuICogQSBzdGF0ZSBpcyBhIHN0ZXAgaW4gYSB3b3JrZmxvdyB0aGF0IHdoZW4gc2V0IHdpbGwgdHJpZ2dlciB0aGUgY29udHJvbGxlcnNcbiAqIGZvciB0aGUgcmVnaW9ucyB0byBiZSB1cGRhdGVkIGFzIHNwZWNpZmllZCBpbiB0aGUgZnJhbWUuXG4gKlxuICogQSBzdGF0ZSBoYXMgYW4gZXZlbnQtZHJpdmVuIGxpZmVjeWNsZTpcbiAqXG4gKiAgICAgJ3JlYWR5JyAgICAgIHRyaWdnZXJzIHdoZW4gYSBzdGF0ZSBpcyBhZGRlZCB0byBhIHN0YXRlIG1hY2hpbmUncyBjb2xsZWN0aW9uLlxuICogICAgICdhY3RpdmF0ZScgICB0cmlnZ2VycyB3aGVuIGEgc3RhdGUgaXMgYWN0aXZhdGVkIGJ5IGEgc3RhdGUgbWFjaGluZS5cbiAqICAgICAnZGVhY3RpdmF0ZScgdHJpZ2dlcnMgd2hlbiBhIHN0YXRlIGlzIGRlYWN0aXZhdGVkIGJ5IGEgc3RhdGUgbWFjaGluZS5cbiAqICAgICAncmVzZXQnICAgICAgaXMgbm90IHRyaWdnZXJlZCBhdXRvbWF0aWNhbGx5LiBJdCBzaG91bGQgYmUgaW52b2tlZCBieSB0aGVcbiAqICAgICAgICAgICAgICAgICAgcHJvcGVyIGNvbnRyb2xsZXIgdG8gcmVzZXQgdGhlIHN0YXRlIHRvIGl0cyBkZWZhdWx0LlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKi9cbnZhciBTdGF0ZSA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG5cdC8qKlxuXHQgKiBDb25zdHJ1Y3Rvci5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRjb25zdHJ1Y3RvcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vbiggJ2FjdGl2YXRlJywgdGhpcy5fcHJlQWN0aXZhdGUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnYWN0aXZhdGUnLCB0aGlzLmFjdGl2YXRlLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2FjdGl2YXRlJywgdGhpcy5fcG9zdEFjdGl2YXRlLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2RlYWN0aXZhdGUnLCB0aGlzLl9kZWFjdGl2YXRlLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2RlYWN0aXZhdGUnLCB0aGlzLmRlYWN0aXZhdGUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAncmVzZXQnLCB0aGlzLnJlc2V0LCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ3JlYWR5JywgdGhpcy5fcmVhZHksIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAncmVhZHknLCB0aGlzLnJlYWR5LCB0aGlzICk7XG5cdFx0LyoqXG5cdFx0ICogQ2FsbCBwYXJlbnQgY29uc3RydWN0b3Igd2l0aCBwYXNzZWQgYXJndW1lbnRzXG5cdFx0ICovXG5cdFx0QmFja2JvbmUuTW9kZWwuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdHRoaXMub24oICdjaGFuZ2U6bWVudScsIHRoaXMuX3VwZGF0ZU1lbnUsIHRoaXMgKTtcblx0fSxcblx0LyoqXG5cdCAqIFJlYWR5IGV2ZW50IGNhbGxiYWNrLlxuXHQgKlxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRyZWFkeTogZnVuY3Rpb24oKSB7fSxcblxuXHQvKipcblx0ICogQWN0aXZhdGUgZXZlbnQgY2FsbGJhY2suXG5cdCAqXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdGFjdGl2YXRlOiBmdW5jdGlvbigpIHt9LFxuXG5cdC8qKlxuXHQgKiBEZWFjdGl2YXRlIGV2ZW50IGNhbGxiYWNrLlxuXHQgKlxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbigpIHt9LFxuXG5cdC8qKlxuXHQgKiBSZXNldCBldmVudCBjYWxsYmFjay5cblx0ICpcblx0ICogQGFic3RyYWN0XG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0cmVzZXQ6IGZ1bmN0aW9uKCkge30sXG5cblx0LyoqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdF9yZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fdXBkYXRlTWVudSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAYWNjZXNzIHByaXZhdGVcblx0ICogQHNpbmNlIDMuNS4wXG5cdCovXG5cdF9wcmVBY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hY3RpdmUgPSB0cnVlO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAYWNjZXNzIHByaXZhdGVcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRfcG9zdEFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9uKCAnY2hhbmdlOm1lbnUnLCB0aGlzLl9tZW51LCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NoYW5nZTp0aXRsZU1vZGUnLCB0aGlzLl90aXRsZSwgdGhpcyApO1xuXHRcdHRoaXMub24oICdjaGFuZ2U6Y29udGVudCcsIHRoaXMuX2NvbnRlbnQsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnY2hhbmdlOnRvb2xiYXInLCB0aGlzLl90b29sYmFyLCB0aGlzICk7XG5cblx0XHR0aGlzLmZyYW1lLm9uKCAndGl0bGU6cmVuZGVyOmRlZmF1bHQnLCB0aGlzLl9yZW5kZXJUaXRsZSwgdGhpcyApO1xuXG5cdFx0dGhpcy5fdGl0bGUoKTtcblx0XHR0aGlzLl9tZW51KCk7XG5cdFx0dGhpcy5fdG9vbGJhcigpO1xuXHRcdHRoaXMuX2NvbnRlbnQoKTtcblx0XHR0aGlzLl9yb3V0ZXIoKTtcblx0fSxcblxuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0X2RlYWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cblx0XHR0aGlzLmZyYW1lLm9mZiggJ3RpdGxlOnJlbmRlcjpkZWZhdWx0JywgdGhpcy5fcmVuZGVyVGl0bGUsIHRoaXMgKTtcblxuXHRcdHRoaXMub2ZmKCAnY2hhbmdlOm1lbnUnLCB0aGlzLl9tZW51LCB0aGlzICk7XG5cdFx0dGhpcy5vZmYoICdjaGFuZ2U6dGl0bGVNb2RlJywgdGhpcy5fdGl0bGUsIHRoaXMgKTtcblx0XHR0aGlzLm9mZiggJ2NoYW5nZTpjb250ZW50JywgdGhpcy5fY29udGVudCwgdGhpcyApO1xuXHRcdHRoaXMub2ZmKCAnY2hhbmdlOnRvb2xiYXInLCB0aGlzLl90b29sYmFyLCB0aGlzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdF90aXRsZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mcmFtZS50aXRsZS5yZW5kZXIoIHRoaXMuZ2V0KCd0aXRsZU1vZGUnKSB8fCAnZGVmYXVsdCcgKTtcblx0fSxcblxuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0X3JlbmRlclRpdGxlOiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2aWV3LiRlbC50ZXh0KCB0aGlzLmdldCgndGl0bGUnKSB8fCAnJyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAYWNjZXNzIHByaXZhdGVcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRfcm91dGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcm91dGVyID0gdGhpcy5mcmFtZS5yb3V0ZXIsXG5cdFx0XHRtb2RlID0gdGhpcy5nZXQoJ3JvdXRlcicpLFxuXHRcdFx0dmlldztcblxuXHRcdHRoaXMuZnJhbWUuJGVsLnRvZ2dsZUNsYXNzKCAnaGlkZS1yb3V0ZXInLCAhIG1vZGUgKTtcblx0XHRpZiAoICEgbW9kZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmZyYW1lLnJvdXRlci5yZW5kZXIoIG1vZGUgKTtcblxuXHRcdHZpZXcgPSByb3V0ZXIuZ2V0KCk7XG5cdFx0aWYgKCB2aWV3ICYmIHZpZXcuc2VsZWN0ICkge1xuXHRcdFx0dmlldy5zZWxlY3QoIHRoaXMuZnJhbWUuY29udGVudC5tb2RlKCkgKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdF9tZW51OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWVudSA9IHRoaXMuZnJhbWUubWVudSxcblx0XHRcdG1vZGUgPSB0aGlzLmdldCgnbWVudScpLFxuXHRcdFx0dmlldztcblxuXHRcdHRoaXMuZnJhbWUuJGVsLnRvZ2dsZUNsYXNzKCAnaGlkZS1tZW51JywgISBtb2RlICk7XG5cdFx0aWYgKCAhIG1vZGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bWVudS5tb2RlKCBtb2RlICk7XG5cblx0XHR2aWV3ID0gbWVudS5nZXQoKTtcblx0XHRpZiAoIHZpZXcgJiYgdmlldy5zZWxlY3QgKSB7XG5cdFx0XHR2aWV3LnNlbGVjdCggdGhpcy5pZCApO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQGFjY2VzcyBwcml2YXRlXG5cdCAqIEBzaW5jZSAzLjUuMFxuXHQgKi9cblx0X3VwZGF0ZU1lbnU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwcmV2aW91cyA9IHRoaXMucHJldmlvdXMoJ21lbnUnKSxcblx0XHRcdG1lbnUgPSB0aGlzLmdldCgnbWVudScpO1xuXG5cdFx0aWYgKCBwcmV2aW91cyApIHtcblx0XHRcdHRoaXMuZnJhbWUub2ZmKCAnbWVudTpyZW5kZXI6JyArIHByZXZpb3VzLCB0aGlzLl9yZW5kZXJNZW51LCB0aGlzICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBtZW51ICkge1xuXHRcdFx0dGhpcy5mcmFtZS5vbiggJ21lbnU6cmVuZGVyOicgKyBtZW51LCB0aGlzLl9yZW5kZXJNZW51LCB0aGlzICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSB2aWV3IGluIHRoZSBtZWRpYSBtZW51IGZvciB0aGUgc3RhdGUuXG5cdCAqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKiBAc2luY2UgMy41LjBcblx0ICpcblx0ICogQHBhcmFtIHttZWRpYS52aWV3Lk1lbnV9IHZpZXcgVGhlIG1lbnUgdmlldy5cblx0ICovXG5cdF9yZW5kZXJNZW51OiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgbWVudUl0ZW0gPSB0aGlzLmdldCgnbWVudUl0ZW0nKSxcblx0XHRcdHRpdGxlID0gdGhpcy5nZXQoJ3RpdGxlJyksXG5cdFx0XHRwcmlvcml0eSA9IHRoaXMuZ2V0KCdwcmlvcml0eScpO1xuXG5cdFx0aWYgKCAhIG1lbnVJdGVtICYmIHRpdGxlICkge1xuXHRcdFx0bWVudUl0ZW0gPSB7IHRleHQ6IHRpdGxlIH07XG5cblx0XHRcdGlmICggcHJpb3JpdHkgKSB7XG5cdFx0XHRcdG1lbnVJdGVtLnByaW9yaXR5ID0gcHJpb3JpdHk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCAhIG1lbnVJdGVtICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZpZXcuc2V0KCB0aGlzLmlkLCBtZW51SXRlbSApO1xuXHR9XG59KTtcblxuXy5lYWNoKFsndG9vbGJhcicsJ2NvbnRlbnQnXSwgZnVuY3Rpb24oIHJlZ2lvbiApIHtcblx0LyoqXG5cdCAqIEBhY2Nlc3MgcHJpdmF0ZVxuXHQgKi9cblx0U3RhdGUucHJvdG90eXBlWyAnXycgKyByZWdpb24gXSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtb2RlID0gdGhpcy5nZXQoIHJlZ2lvbiApO1xuXHRcdGlmICggbW9kZSApIHtcblx0XHRcdHRoaXMuZnJhbWVbIHJlZ2lvbiBdLnJlbmRlciggbW9kZSApO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS5zZWxlY3Rpb25TeW5jXG4gKlxuICogU3luYyBhbiBhdHRhY2htZW50cyBzZWxlY3Rpb24gaW4gYSBzdGF0ZSB3aXRoIGFub3RoZXIgc3RhdGUuXG4gKlxuICogQWxsb3dzIGZvciBzZWxlY3RpbmcgbXVsdGlwbGUgaW1hZ2VzIGluIHRoZSBJbnNlcnQgTWVkaWEgd29ya2Zsb3csIGFuZCB0aGVuXG4gKiBzd2l0Y2hpbmcgdG8gdGhlIEluc2VydCBHYWxsZXJ5IHdvcmtmbG93IHdoaWxlIHByZXNlcnZpbmcgdGhlIGF0dGFjaG1lbnRzIHNlbGVjdGlvbi5cbiAqXG4gKiBAbWl4aW5cbiAqL1xudmFyIHNlbGVjdGlvblN5bmMgPSB7XG5cdC8qKlxuXHQgKiBAc2luY2UgMy41LjBcblx0ICovXG5cdHN5bmNTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLmdldCgnc2VsZWN0aW9uJyksXG5cdFx0XHRtYW5hZ2VyID0gdGhpcy5mcmFtZS5fc2VsZWN0aW9uO1xuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdzeW5jU2VsZWN0aW9uJykgfHwgISBtYW5hZ2VyIHx8ICEgc2VsZWN0aW9uICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSBzZWxlY3Rpb24gc3VwcG9ydHMgbXVsdGlwbGUgaXRlbXMsIHZhbGlkYXRlIHRoZSBzdG9yZWRcblx0XHQvLyBhdHRhY2htZW50cyBiYXNlZCBvbiB0aGUgbmV3IHNlbGVjdGlvbidzIGNvbmRpdGlvbnMuIFJlY29yZFxuXHRcdC8vIHRoZSBhdHRhY2htZW50cyB0aGF0IGFyZSBub3QgaW5jbHVkZWQ7IHdlJ2xsIG1haW50YWluIGFcblx0XHQvLyByZWZlcmVuY2UgdG8gdGhvc2UuIE90aGVyIGF0dGFjaG1lbnRzIGFyZSBjb25zaWRlcmVkIGluIGZsdXguXG5cdFx0aWYgKCBzZWxlY3Rpb24ubXVsdGlwbGUgKSB7XG5cdFx0XHRzZWxlY3Rpb24ucmVzZXQoIFtdLCB7IHNpbGVudDogdHJ1ZSB9KTtcblx0XHRcdHNlbGVjdGlvbi52YWxpZGF0ZUFsbCggbWFuYWdlci5hdHRhY2htZW50cyApO1xuXHRcdFx0bWFuYWdlci5kaWZmZXJlbmNlID0gXy5kaWZmZXJlbmNlKCBtYW5hZ2VyLmF0dGFjaG1lbnRzLm1vZGVscywgc2VsZWN0aW9uLm1vZGVscyApO1xuXHRcdH1cblxuXHRcdC8vIFN5bmMgdGhlIHNlbGVjdGlvbidzIHNpbmdsZSBpdGVtIHdpdGggdGhlIG1hc3Rlci5cblx0XHRzZWxlY3Rpb24uc2luZ2xlKCBtYW5hZ2VyLnNpbmdsZSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZWNvcmQgdGhlIGN1cnJlbnRseSBhY3RpdmUgYXR0YWNobWVudHMsIHdoaWNoIGlzIGEgY29tYmluYXRpb25cblx0ICogb2YgdGhlIHNlbGVjdGlvbidzIGF0dGFjaG1lbnRzIGFuZCB0aGUgc2V0IG9mIHNlbGVjdGVkXG5cdCAqIGF0dGFjaG1lbnRzIHRoYXQgdGhpcyBzcGVjaWZpYyBzZWxlY3Rpb24gY29uc2lkZXJlZCBpbnZhbGlkLlxuXHQgKiBSZXNldCB0aGUgZGlmZmVyZW5jZSBhbmQgcmVjb3JkIHRoZSBzaW5nbGUgYXR0YWNobWVudC5cblx0ICpcblx0ICogQHNpbmNlIDMuNS4wXG5cdCAqL1xuXHRyZWNvcmRTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLmdldCgnc2VsZWN0aW9uJyksXG5cdFx0XHRtYW5hZ2VyID0gdGhpcy5mcmFtZS5fc2VsZWN0aW9uO1xuXG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCdzeW5jU2VsZWN0aW9uJykgfHwgISBtYW5hZ2VyIHx8ICEgc2VsZWN0aW9uICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggc2VsZWN0aW9uLm11bHRpcGxlICkge1xuXHRcdFx0bWFuYWdlci5hdHRhY2htZW50cy5yZXNldCggc2VsZWN0aW9uLnRvQXJyYXkoKS5jb25jYXQoIG1hbmFnZXIuZGlmZmVyZW5jZSApICk7XG5cdFx0XHRtYW5hZ2VyLmRpZmZlcmVuY2UgPSBbXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWFuYWdlci5hdHRhY2htZW50cy5hZGQoIHNlbGVjdGlvbi50b0FycmF5KCkgKTtcblx0XHR9XG5cblx0XHRtYW5hZ2VyLnNpbmdsZSA9IHNlbGVjdGlvbi5fc2luZ2xlO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlbGVjdGlvblN5bmM7XG4iLCJ2YXIgbWVkaWEgPSB3cC5tZWRpYSxcblx0JCA9IGpRdWVyeSxcblx0bDEwbjtcblxubWVkaWEuaXNUb3VjaERldmljZSA9ICggJ29udG91Y2hlbmQnIGluIGRvY3VtZW50ICk7XG5cbi8vIExpbmsgYW55IGxvY2FsaXplZCBzdHJpbmdzLlxubDEwbiA9IG1lZGlhLnZpZXcubDEwbiA9IHdpbmRvdy5fd3BNZWRpYVZpZXdzTDEwbiB8fCB7fTtcblxuLy8gTGluayBhbnkgc2V0dGluZ3MuXG5tZWRpYS52aWV3LnNldHRpbmdzID0gbDEwbi5zZXR0aW5ncyB8fCB7fTtcbmRlbGV0ZSBsMTBuLnNldHRpbmdzO1xuXG4vLyBDb3B5IHRoZSBgcG9zdGAgc2V0dGluZyBvdmVyIHRvIHRoZSBtb2RlbCBzZXR0aW5ncy5cbm1lZGlhLm1vZGVsLnNldHRpbmdzLnBvc3QgPSBtZWRpYS52aWV3LnNldHRpbmdzLnBvc3Q7XG5cbi8vIENoZWNrIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIENTUyAzLjAgdHJhbnNpdGlvbnNcbiQuc3VwcG9ydC50cmFuc2l0aW9uID0gKGZ1bmN0aW9uKCl7XG5cdHZhciBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSxcblx0XHR0cmFuc2l0aW9ucyA9IHtcblx0XHRcdFdlYmtpdFRyYW5zaXRpb246ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcblx0XHRcdE1velRyYW5zaXRpb246ICAgICd0cmFuc2l0aW9uZW5kJyxcblx0XHRcdE9UcmFuc2l0aW9uOiAgICAgICdvVHJhbnNpdGlvbkVuZCBvdHJhbnNpdGlvbmVuZCcsXG5cdFx0XHR0cmFuc2l0aW9uOiAgICAgICAndHJhbnNpdGlvbmVuZCdcblx0XHR9LCB0cmFuc2l0aW9uO1xuXG5cdHRyYW5zaXRpb24gPSBfLmZpbmQoIF8ua2V5cyggdHJhbnNpdGlvbnMgKSwgZnVuY3Rpb24oIHRyYW5zaXRpb24gKSB7XG5cdFx0cmV0dXJuICEgXy5pc1VuZGVmaW5lZCggc3R5bGVbIHRyYW5zaXRpb24gXSApO1xuXHR9KTtcblxuXHRyZXR1cm4gdHJhbnNpdGlvbiAmJiB7XG5cdFx0ZW5kOiB0cmFuc2l0aW9uc1sgdHJhbnNpdGlvbiBdXG5cdH07XG59KCkpO1xuXG4vKipcbiAqIEEgc2hhcmVkIGV2ZW50IGJ1cyB1c2VkIHRvIHByb3ZpZGUgZXZlbnRzIGludG9cbiAqIHRoZSBtZWRpYSB3b3JrZmxvd3MgdGhhdCAzcmQtcGFydHkgZGV2cyBjYW4gdXNlIHRvIGhvb2tcbiAqIGluLlxuICovXG5tZWRpYS5ldmVudHMgPSBfLmV4dGVuZCgge30sIEJhY2tib25lLkV2ZW50cyApO1xuXG4vKipcbiAqIE1ha2VzIGl0IGVhc2llciB0byBiaW5kIGV2ZW50cyB1c2luZyB0cmFuc2l0aW9ucy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSBzZW5zaXRpdml0eVxuICogQHJldHVybnMge1Byb21pc2V9XG4gKi9cbm1lZGlhLnRyYW5zaXRpb24gPSBmdW5jdGlvbiggc2VsZWN0b3IsIHNlbnNpdGl2aXR5ICkge1xuXHR2YXIgZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cblx0c2Vuc2l0aXZpdHkgPSBzZW5zaXRpdml0eSB8fCAyMDAwO1xuXG5cdGlmICggJC5zdXBwb3J0LnRyYW5zaXRpb24gKSB7XG5cdFx0aWYgKCAhIChzZWxlY3RvciBpbnN0YW5jZW9mICQpICkge1xuXHRcdFx0c2VsZWN0b3IgPSAkKCBzZWxlY3RvciApO1xuXHRcdH1cblxuXHRcdC8vIFJlc29sdmUgdGhlIGRlZmVycmVkIHdoZW4gdGhlIGZpcnN0IGVsZW1lbnQgZmluaXNoZXMgYW5pbWF0aW5nLlxuXHRcdHNlbGVjdG9yLmZpcnN0KCkub25lKCAkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQsIGRlZmVycmVkLnJlc29sdmUgKTtcblxuXHRcdC8vIEp1c3QgaW4gY2FzZSB0aGUgZXZlbnQgZG9lc24ndCB0cmlnZ2VyLCBmaXJlIGEgY2FsbGJhY2suXG5cdFx0Xy5kZWxheSggZGVmZXJyZWQucmVzb2x2ZSwgc2Vuc2l0aXZpdHkgKTtcblxuXHQvLyBPdGhlcndpc2UsIGV4ZWN1dGUgb24gdGhlIHNwb3QuXG5cdH0gZWxzZSB7XG5cdFx0ZGVmZXJyZWQucmVzb2x2ZSgpO1xuXHR9XG5cblx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbn07XG5cbm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvcmVnaW9uLmpzJyApO1xubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmUgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9zdGF0ZS1tYWNoaW5lLmpzJyApO1xubWVkaWEuY29udHJvbGxlci5TdGF0ZSA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL3N0YXRlLmpzJyApO1xuXG5tZWRpYS5zZWxlY3Rpb25TeW5jID0gcmVxdWlyZSggJy4vdXRpbHMvc2VsZWN0aW9uLXN5bmMuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnkgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9saWJyYXJ5LmpzJyApO1xubWVkaWEuY29udHJvbGxlci5JbWFnZURldGFpbHMgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9pbWFnZS1kZXRhaWxzLmpzJyApO1xubWVkaWEuY29udHJvbGxlci5HYWxsZXJ5RWRpdCA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2dhbGxlcnktZWRpdC5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuR2FsbGVyeUFkZCA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2dhbGxlcnktYWRkLmpzJyApO1xubWVkaWEuY29udHJvbGxlci5Db2xsZWN0aW9uRWRpdCA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2NvbGxlY3Rpb24tZWRpdC5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuQ29sbGVjdGlvbkFkZCA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2NvbGxlY3Rpb24tYWRkLmpzJyApO1xubWVkaWEuY29udHJvbGxlci5GZWF0dXJlZEltYWdlID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvZmVhdHVyZWQtaW1hZ2UuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLlJlcGxhY2VJbWFnZSA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL3JlcGxhY2UtaW1hZ2UuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkVkaXRJbWFnZSA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2VkaXQtaW1hZ2UuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLk1lZGlhTGlicmFyeSA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL21lZGlhLWxpYnJhcnkuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkVtYmVkID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvZW1iZWQuanMnICk7XG5tZWRpYS5jb250cm9sbGVyLkNyb3BwZXIgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9jcm9wcGVyLmpzJyApO1xubWVkaWEuY29udHJvbGxlci5DdXN0b21pemVJbWFnZUNyb3BwZXIgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9jdXN0b21pemUtaW1hZ2UtY3JvcHBlci5qcycgKTtcbm1lZGlhLmNvbnRyb2xsZXIuU2l0ZUljb25Dcm9wcGVyID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvc2l0ZS1pY29uLWNyb3BwZXIuanMnICk7XG5cbm1lZGlhLlZpZXcgPSByZXF1aXJlKCAnLi92aWV3cy92aWV3LmpzJyApO1xubWVkaWEudmlldy5GcmFtZSA9IHJlcXVpcmUoICcuL3ZpZXdzL2ZyYW1lLmpzJyApO1xubWVkaWEudmlldy5NZWRpYUZyYW1lID0gcmVxdWlyZSggJy4vdmlld3MvbWVkaWEtZnJhbWUuanMnICk7XG5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuU2VsZWN0ID0gcmVxdWlyZSggJy4vdmlld3MvZnJhbWUvc2VsZWN0LmpzJyApO1xubWVkaWEudmlldy5NZWRpYUZyYW1lLlBvc3QgPSByZXF1aXJlKCAnLi92aWV3cy9mcmFtZS9wb3N0LmpzJyApO1xubWVkaWEudmlldy5NZWRpYUZyYW1lLkltYWdlRGV0YWlscyA9IHJlcXVpcmUoICcuL3ZpZXdzL2ZyYW1lL2ltYWdlLWRldGFpbHMuanMnICk7XG5tZWRpYS52aWV3Lk1vZGFsID0gcmVxdWlyZSggJy4vdmlld3MvbW9kYWwuanMnICk7XG5tZWRpYS52aWV3LkZvY3VzTWFuYWdlciA9IHJlcXVpcmUoICcuL3ZpZXdzL2ZvY3VzLW1hbmFnZXIuanMnICk7XG5tZWRpYS52aWV3LlVwbG9hZGVyV2luZG93ID0gcmVxdWlyZSggJy4vdmlld3MvdXBsb2FkZXIvd2luZG93LmpzJyApO1xubWVkaWEudmlldy5FZGl0b3JVcGxvYWRlciA9IHJlcXVpcmUoICcuL3ZpZXdzL3VwbG9hZGVyL2VkaXRvci5qcycgKTtcbm1lZGlhLnZpZXcuVXBsb2FkZXJJbmxpbmUgPSByZXF1aXJlKCAnLi92aWV3cy91cGxvYWRlci9pbmxpbmUuanMnICk7XG5tZWRpYS52aWV3LlVwbG9hZGVyU3RhdHVzID0gcmVxdWlyZSggJy4vdmlld3MvdXBsb2FkZXIvc3RhdHVzLmpzJyApO1xubWVkaWEudmlldy5VcGxvYWRlclN0YXR1c0Vycm9yID0gcmVxdWlyZSggJy4vdmlld3MvdXBsb2FkZXIvc3RhdHVzLWVycm9yLmpzJyApO1xubWVkaWEudmlldy5Ub29sYmFyID0gcmVxdWlyZSggJy4vdmlld3MvdG9vbGJhci5qcycgKTtcbm1lZGlhLnZpZXcuVG9vbGJhci5TZWxlY3QgPSByZXF1aXJlKCAnLi92aWV3cy90b29sYmFyL3NlbGVjdC5qcycgKTtcbm1lZGlhLnZpZXcuVG9vbGJhci5FbWJlZCA9IHJlcXVpcmUoICcuL3ZpZXdzL3Rvb2xiYXIvZW1iZWQuanMnICk7XG5tZWRpYS52aWV3LkJ1dHRvbiA9IHJlcXVpcmUoICcuL3ZpZXdzL2J1dHRvbi5qcycgKTtcbm1lZGlhLnZpZXcuQnV0dG9uR3JvdXAgPSByZXF1aXJlKCAnLi92aWV3cy9idXR0b24tZ3JvdXAuanMnICk7XG5tZWRpYS52aWV3LlByaW9yaXR5TGlzdCA9IHJlcXVpcmUoICcuL3ZpZXdzL3ByaW9yaXR5LWxpc3QuanMnICk7XG5tZWRpYS52aWV3Lk1lbnVJdGVtID0gcmVxdWlyZSggJy4vdmlld3MvbWVudS1pdGVtLmpzJyApO1xubWVkaWEudmlldy5NZW51ID0gcmVxdWlyZSggJy4vdmlld3MvbWVudS5qcycgKTtcbm1lZGlhLnZpZXcuUm91dGVySXRlbSA9IHJlcXVpcmUoICcuL3ZpZXdzL3JvdXRlci1pdGVtLmpzJyApO1xubWVkaWEudmlldy5Sb3V0ZXIgPSByZXF1aXJlKCAnLi92aWV3cy9yb3V0ZXIuanMnICk7XG5tZWRpYS52aWV3LlNpZGViYXIgPSByZXF1aXJlKCAnLi92aWV3cy9zaWRlYmFyLmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50ID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudC5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudC5MaWJyYXJ5ID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudC9saWJyYXJ5LmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50LkVkaXRMaWJyYXJ5ID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudC9lZGl0LWxpYnJhcnkuanMnICk7XG5tZWRpYS52aWV3LkF0dGFjaG1lbnRzID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudHMuanMnICk7XG5tZWRpYS52aWV3LlNlYXJjaCA9IHJlcXVpcmUoICcuL3ZpZXdzL3NlYXJjaC5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMgPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMuanMnICk7XG5tZWRpYS52aWV3LkRhdGVGaWx0ZXIgPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMvZGF0ZS5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMuVXBsb2FkZWQgPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50LWZpbHRlcnMvdXBsb2FkZWQuanMnICk7XG5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzLkFsbCA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnQtZmlsdGVycy9hbGwuanMnICk7XG5tZWRpYS52aWV3LkF0dGFjaG1lbnRzQnJvd3NlciA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnRzL2Jyb3dzZXIuanMnICk7XG5tZWRpYS52aWV3LlNlbGVjdGlvbiA9IHJlcXVpcmUoICcuL3ZpZXdzL3NlbGVjdGlvbi5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudC5TZWxlY3Rpb24gPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50L3NlbGVjdGlvbi5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudHMuU2VsZWN0aW9uID0gcmVxdWlyZSggJy4vdmlld3MvYXR0YWNobWVudHMvc2VsZWN0aW9uLmpzJyApO1xubWVkaWEudmlldy5BdHRhY2htZW50LkVkaXRTZWxlY3Rpb24gPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50L2VkaXQtc2VsZWN0aW9uLmpzJyApO1xubWVkaWEudmlldy5TZXR0aW5ncyA9IHJlcXVpcmUoICcuL3ZpZXdzL3NldHRpbmdzLmpzJyApO1xubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheSA9IHJlcXVpcmUoICcuL3ZpZXdzL3NldHRpbmdzL2F0dGFjaG1lbnQtZGlzcGxheS5qcycgKTtcbm1lZGlhLnZpZXcuU2V0dGluZ3MuR2FsbGVyeSA9IHJlcXVpcmUoICcuL3ZpZXdzL3NldHRpbmdzL2dhbGxlcnkuanMnICk7XG5tZWRpYS52aWV3LlNldHRpbmdzLlBsYXlsaXN0ID0gcmVxdWlyZSggJy4vdmlld3Mvc2V0dGluZ3MvcGxheWxpc3QuanMnICk7XG5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRGV0YWlscyA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnQvZGV0YWlscy5qcycgKTtcbm1lZGlhLnZpZXcuQXR0YWNobWVudENvbXBhdCA9IHJlcXVpcmUoICcuL3ZpZXdzL2F0dGFjaG1lbnQtY29tcGF0LmpzJyApO1xubWVkaWEudmlldy5JZnJhbWUgPSByZXF1aXJlKCAnLi92aWV3cy9pZnJhbWUuanMnICk7XG5tZWRpYS52aWV3LkVtYmVkID0gcmVxdWlyZSggJy4vdmlld3MvZW1iZWQuanMnICk7XG5tZWRpYS52aWV3LkxhYmVsID0gcmVxdWlyZSggJy4vdmlld3MvbGFiZWwuanMnICk7XG5tZWRpYS52aWV3LkVtYmVkVXJsID0gcmVxdWlyZSggJy4vdmlld3MvZW1iZWQvdXJsLmpzJyApO1xubWVkaWEudmlldy5FbWJlZExpbmsgPSByZXF1aXJlKCAnLi92aWV3cy9lbWJlZC9saW5rLmpzJyApO1xubWVkaWEudmlldy5FbWJlZEltYWdlID0gcmVxdWlyZSggJy4vdmlld3MvZW1iZWQvaW1hZ2UuanMnICk7XG5tZWRpYS52aWV3LkltYWdlRGV0YWlscyA9IHJlcXVpcmUoICcuL3ZpZXdzL2ltYWdlLWRldGFpbHMuanMnICk7XG5tZWRpYS52aWV3LkNyb3BwZXIgPSByZXF1aXJlKCAnLi92aWV3cy9jcm9wcGVyLmpzJyApO1xubWVkaWEudmlldy5TaXRlSWNvbkNyb3BwZXIgPSByZXF1aXJlKCAnLi92aWV3cy9zaXRlLWljb24tY3JvcHBlci5qcycgKTtcbm1lZGlhLnZpZXcuU2l0ZUljb25QcmV2aWV3ID0gcmVxdWlyZSggJy4vdmlld3Mvc2l0ZS1pY29uLXByZXZpZXcuanMnICk7XG5tZWRpYS52aWV3LkVkaXRJbWFnZSA9IHJlcXVpcmUoICcuL3ZpZXdzL2VkaXQtaW1hZ2UuanMnICk7XG5tZWRpYS52aWV3LlNwaW5uZXIgPSByZXF1aXJlKCAnLi92aWV3cy9zcGlubmVyLmpzJyApO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRDb21wYXRcbiAqXG4gKiBBIHZpZXcgdG8gZGlzcGxheSBmaWVsZHMgYWRkZWQgdmlhIHRoZSBgYXR0YWNobWVudF9maWVsZHNfdG9fZWRpdGAgZmlsdGVyLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdEF0dGFjaG1lbnRDb21wYXQ7XG5cbkF0dGFjaG1lbnRDb21wYXQgPSBWaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2Zvcm0nLFxuXHRjbGFzc05hbWU6ICdjb21wYXQtaXRlbScsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J3N1Ym1pdCc6ICAgICAgICAgICdwcmV2ZW50RGVmYXVsdCcsXG5cdFx0J2NoYW5nZSBpbnB1dCc6ICAgICdzYXZlJyxcblx0XHQnY2hhbmdlIHNlbGVjdCc6ICAgJ3NhdmUnLFxuXHRcdCdjaGFuZ2UgdGV4dGFyZWEnOiAnc2F2ZSdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOmNvbXBhdCcsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5BdHRhY2htZW50Q29tcGF0fSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0ZGlzcG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLiQoJzpmb2N1cycpLmxlbmd0aCApIHtcblx0XHRcdHRoaXMuc2F2ZSgpO1xuXHRcdH1cblx0XHQvKipcblx0XHQgKiBjYWxsICdkaXNwb3NlJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0cmV0dXJuIFZpZXcucHJvdG90eXBlLmRpc3Bvc2UuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuQXR0YWNobWVudENvbXBhdH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbXBhdCA9IHRoaXMubW9kZWwuZ2V0KCdjb21wYXQnKTtcblx0XHRpZiAoICEgY29tcGF0IHx8ICEgY29tcGF0Lml0ZW0gKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy52aWV3cy5kZXRhY2goKTtcblx0XHR0aGlzLiRlbC5odG1sKCBjb21wYXQuaXRlbSApO1xuXHRcdHRoaXMudmlld3MucmVuZGVyKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0c2F2ZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBkYXRhID0ge307XG5cblx0XHRpZiAoIGV2ZW50ICkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cblx0XHRfLmVhY2goIHRoaXMuJGVsLnNlcmlhbGl6ZUFycmF5KCksIGZ1bmN0aW9uKCBwYWlyICkge1xuXHRcdFx0ZGF0YVsgcGFpci5uYW1lIF0gPSBwYWlyLnZhbHVlO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdhdHRhY2htZW50OmNvbXBhdDp3YWl0aW5nJywgWyd3YWl0aW5nJ10gKTtcblx0XHR0aGlzLm1vZGVsLnNhdmVDb21wYXQoIGRhdGEgKS5hbHdheXMoIF8uYmluZCggdGhpcy5wb3N0U2F2ZSwgdGhpcyApICk7XG5cdH0sXG5cblx0cG9zdFNhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY29udHJvbGxlci50cmlnZ2VyKCAnYXR0YWNobWVudDpjb21wYXQ6cmVhZHknLCBbJ3JlYWR5J10gKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0YWNobWVudENvbXBhdDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5BdHRhY2htZW50RmlsdGVyc1xuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgJCA9IGpRdWVyeSxcblx0QXR0YWNobWVudEZpbHRlcnM7XG5cbkF0dGFjaG1lbnRGaWx0ZXJzID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdzZWxlY3QnLFxuXHRjbGFzc05hbWU6ICdhdHRhY2htZW50LWZpbHRlcnMnLFxuXHRpZDogICAgICAgICdtZWRpYS1hdHRhY2htZW50LWZpbHRlcnMnLFxuXG5cdGV2ZW50czoge1xuXHRcdGNoYW5nZTogJ2NoYW5nZSdcblx0fSxcblxuXHRrZXlzOiBbXSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNyZWF0ZUZpbHRlcnMoKTtcblx0XHRfLmV4dGVuZCggdGhpcy5maWx0ZXJzLCB0aGlzLm9wdGlvbnMuZmlsdGVycyApO1xuXG5cdFx0Ly8gQnVpbGQgYDxvcHRpb24+YCBlbGVtZW50cy5cblx0XHR0aGlzLiRlbC5odG1sKCBfLmNoYWluKCB0aGlzLmZpbHRlcnMgKS5tYXAoIGZ1bmN0aW9uKCBmaWx0ZXIsIHZhbHVlICkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0ZWw6ICQoICc8b3B0aW9uPjwvb3B0aW9uPicgKS52YWwoIHZhbHVlICkuaHRtbCggZmlsdGVyLnRleHQgKVswXSxcblx0XHRcdFx0cHJpb3JpdHk6IGZpbHRlci5wcmlvcml0eSB8fCA1MFxuXHRcdFx0fTtcblx0XHR9LCB0aGlzICkuc29ydEJ5KCdwcmlvcml0eScpLnBsdWNrKCdlbCcpLnZhbHVlKCkgKTtcblxuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2UnLCB0aGlzLnNlbGVjdCApO1xuXHRcdHRoaXMuc2VsZWN0KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBhYnN0cmFjdFxuXHQgKi9cblx0Y3JlYXRlRmlsdGVyczogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5maWx0ZXJzID0ge307XG5cdH0sXG5cblx0LyoqXG5cdCAqIFdoZW4gdGhlIHNlbGVjdGVkIGZpbHRlciBjaGFuZ2VzLCB1cGRhdGUgdGhlIEF0dGFjaG1lbnQgUXVlcnkgcHJvcGVydGllcyB0byBtYXRjaC5cblx0ICovXG5cdGNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZpbHRlciA9IHRoaXMuZmlsdGVyc1sgdGhpcy5lbC52YWx1ZSBdO1xuXHRcdGlmICggZmlsdGVyICkge1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoIGZpbHRlci5wcm9wcyApO1xuXHRcdH1cblx0fSxcblxuXHRzZWxlY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtb2RlbCA9IHRoaXMubW9kZWwsXG5cdFx0XHR2YWx1ZSA9ICdhbGwnLFxuXHRcdFx0cHJvcHMgPSBtb2RlbC50b0pTT04oKTtcblxuXHRcdF8uZmluZCggdGhpcy5maWx0ZXJzLCBmdW5jdGlvbiggZmlsdGVyLCBpZCApIHtcblx0XHRcdHZhciBlcXVhbCA9IF8uYWxsKCBmaWx0ZXIucHJvcHMsIGZ1bmN0aW9uKCBwcm9wLCBrZXkgKSB7XG5cdFx0XHRcdHJldHVybiBwcm9wID09PSAoIF8uaXNVbmRlZmluZWQoIHByb3BzWyBrZXkgXSApID8gbnVsbCA6IHByb3BzWyBrZXkgXSApO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICggZXF1YWwgKSB7XG5cdFx0XHRcdHJldHVybiB2YWx1ZSA9IGlkO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy4kZWwudmFsKCB2YWx1ZSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdHRhY2htZW50RmlsdGVycztcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5BdHRhY2htZW50RmlsdGVycy5BbGxcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRBbGw7XG5cbkFsbCA9IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMuZXh0ZW5kKHtcblx0Y3JlYXRlRmlsdGVyczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZpbHRlcnMgPSB7fTtcblxuXHRcdF8uZWFjaCggd3AubWVkaWEudmlldy5zZXR0aW5ncy5taW1lVHlwZXMgfHwge30sIGZ1bmN0aW9uKCB0ZXh0LCBrZXkgKSB7XG5cdFx0XHRmaWx0ZXJzWyBrZXkgXSA9IHtcblx0XHRcdFx0dGV4dDogdGV4dCxcblx0XHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0XHRzdGF0dXM6ICBudWxsLFxuXHRcdFx0XHRcdHR5cGU6ICAgIGtleSxcblx0XHRcdFx0XHR1cGxvYWRlZFRvOiBudWxsLFxuXHRcdFx0XHRcdG9yZGVyYnk6ICdkYXRlJyxcblx0XHRcdFx0XHRvcmRlcjogICAnREVTQydcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9KTtcblxuXHRcdGZpbHRlcnMuYWxsID0ge1xuXHRcdFx0dGV4dDogIGwxMG4uYWxsTWVkaWFJdGVtcyxcblx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdHN0YXR1czogIG51bGwsXG5cdFx0XHRcdHR5cGU6ICAgIG51bGwsXG5cdFx0XHRcdHVwbG9hZGVkVG86IG51bGwsXG5cdFx0XHRcdG9yZGVyYnk6ICdkYXRlJyxcblx0XHRcdFx0b3JkZXI6ICAgJ0RFU0MnXG5cdFx0XHR9LFxuXHRcdFx0cHJpb3JpdHk6IDEwXG5cdFx0fTtcblxuXHRcdGlmICggd3AubWVkaWEudmlldy5zZXR0aW5ncy5wb3N0LmlkICkge1xuXHRcdFx0ZmlsdGVycy51cGxvYWRlZCA9IHtcblx0XHRcdFx0dGV4dDogIGwxMG4udXBsb2FkZWRUb1RoaXNQb3N0LFxuXHRcdFx0XHRwcm9wczoge1xuXHRcdFx0XHRcdHN0YXR1czogIG51bGwsXG5cdFx0XHRcdFx0dHlwZTogICAgbnVsbCxcblx0XHRcdFx0XHR1cGxvYWRlZFRvOiB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuaWQsXG5cdFx0XHRcdFx0b3JkZXJieTogJ21lbnVPcmRlcicsXG5cdFx0XHRcdFx0b3JkZXI6ICAgJ0FTQydcblx0XHRcdFx0fSxcblx0XHRcdFx0cHJpb3JpdHk6IDIwXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGZpbHRlcnMudW5hdHRhY2hlZCA9IHtcblx0XHRcdHRleHQ6ICBsMTBuLnVuYXR0YWNoZWQsXG5cdFx0XHRwcm9wczoge1xuXHRcdFx0XHRzdGF0dXM6ICAgICBudWxsLFxuXHRcdFx0XHR1cGxvYWRlZFRvOiAwLFxuXHRcdFx0XHR0eXBlOiAgICAgICBudWxsLFxuXHRcdFx0XHRvcmRlcmJ5OiAgICAnbWVudU9yZGVyJyxcblx0XHRcdFx0b3JkZXI6ICAgICAgJ0FTQydcblx0XHRcdH0sXG5cdFx0XHRwcmlvcml0eTogNTBcblx0XHR9O1xuXG5cdFx0aWYgKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLm1lZGlhVHJhc2ggJiZcblx0XHRcdHRoaXMuY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApICkge1xuXG5cdFx0XHRmaWx0ZXJzLnRyYXNoID0ge1xuXHRcdFx0XHR0ZXh0OiAgbDEwbi50cmFzaCxcblx0XHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0XHR1cGxvYWRlZFRvOiBudWxsLFxuXHRcdFx0XHRcdHN0YXR1czogICAgICd0cmFzaCcsXG5cdFx0XHRcdFx0dHlwZTogICAgICAgbnVsbCxcblx0XHRcdFx0XHRvcmRlcmJ5OiAgICAnZGF0ZScsXG5cdFx0XHRcdFx0b3JkZXI6ICAgICAgJ0RFU0MnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByaW9yaXR5OiA1MFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbGw7XG4iLCIvKipcbiAqIEEgZmlsdGVyIGRyb3Bkb3duIGZvciBtb250aC9kYXRlcy5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHREYXRlRmlsdGVyO1xuXG5EYXRlRmlsdGVyID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50RmlsdGVycy5leHRlbmQoe1xuXHRpZDogJ21lZGlhLWF0dGFjaG1lbnQtZGF0ZS1maWx0ZXJzJyxcblxuXHRjcmVhdGVGaWx0ZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZmlsdGVycyA9IHt9O1xuXHRcdF8uZWFjaCggd3AubWVkaWEudmlldy5zZXR0aW5ncy5tb250aHMgfHwge30sIGZ1bmN0aW9uKCB2YWx1ZSwgaW5kZXggKSB7XG5cdFx0XHRmaWx0ZXJzWyBpbmRleCBdID0ge1xuXHRcdFx0XHR0ZXh0OiB2YWx1ZS50ZXh0LFxuXHRcdFx0XHRwcm9wczoge1xuXHRcdFx0XHRcdHllYXI6IHZhbHVlLnllYXIsXG5cdFx0XHRcdFx0bW9udGhudW06IHZhbHVlLm1vbnRoXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fSk7XG5cdFx0ZmlsdGVycy5hbGwgPSB7XG5cdFx0XHR0ZXh0OiAgbDEwbi5hbGxEYXRlcyxcblx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdG1vbnRobnVtOiBmYWxzZSxcblx0XHRcdFx0eWVhcjogIGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0cHJpb3JpdHk6IDEwXG5cdFx0fTtcblx0XHR0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEYXRlRmlsdGVyO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRGaWx0ZXJzLlVwbG9hZGVkXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5BdHRhY2htZW50RmlsdGVyc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgbDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0VXBsb2FkZWQ7XG5cblVwbG9hZGVkID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50RmlsdGVycy5leHRlbmQoe1xuXHRjcmVhdGVGaWx0ZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdHlwZSA9IHRoaXMubW9kZWwuZ2V0KCd0eXBlJyksXG5cdFx0XHR0eXBlcyA9IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MubWltZVR5cGVzLFxuXHRcdFx0dGV4dDtcblxuXHRcdGlmICggdHlwZXMgJiYgdHlwZSApIHtcblx0XHRcdHRleHQgPSB0eXBlc1sgdHlwZSBdO1xuXHRcdH1cblxuXHRcdHRoaXMuZmlsdGVycyA9IHtcblx0XHRcdGFsbDoge1xuXHRcdFx0XHR0ZXh0OiAgdGV4dCB8fCBsMTBuLmFsbE1lZGlhSXRlbXMsXG5cdFx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdFx0dXBsb2FkZWRUbzogbnVsbCxcblx0XHRcdFx0XHRvcmRlcmJ5OiAnZGF0ZScsXG5cdFx0XHRcdFx0b3JkZXI6ICAgJ0RFU0MnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByaW9yaXR5OiAxMFxuXHRcdFx0fSxcblxuXHRcdFx0dXBsb2FkZWQ6IHtcblx0XHRcdFx0dGV4dDogIGwxMG4udXBsb2FkZWRUb1RoaXNQb3N0LFxuXHRcdFx0XHRwcm9wczoge1xuXHRcdFx0XHRcdHVwbG9hZGVkVG86IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MucG9zdC5pZCxcblx0XHRcdFx0XHRvcmRlcmJ5OiAnbWVudU9yZGVyJyxcblx0XHRcdFx0XHRvcmRlcjogICAnQVNDJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmlvcml0eTogMjBcblx0XHRcdH0sXG5cblx0XHRcdHVuYXR0YWNoZWQ6IHtcblx0XHRcdFx0dGV4dDogIGwxMG4udW5hdHRhY2hlZCxcblx0XHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0XHR1cGxvYWRlZFRvOiAwLFxuXHRcdFx0XHRcdG9yZGVyYnk6ICdtZW51T3JkZXInLFxuXHRcdFx0XHRcdG9yZGVyOiAgICdBU0MnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByaW9yaXR5OiA1MFxuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVkO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFZpZXcgPSB3cC5tZWRpYS5WaWV3LFxuXHQkID0galF1ZXJ5LFxuXHRBdHRhY2htZW50O1xuXG5BdHRhY2htZW50ID0gVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdsaScsXG5cdGNsYXNzTmFtZTogJ2F0dGFjaG1lbnQnLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCdhdHRhY2htZW50JyksXG5cblx0YXR0cmlidXRlczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdCd0YWJJbmRleCc6ICAgICAwLFxuXHRcdFx0J3JvbGUnOiAgICAgICAgICdjaGVja2JveCcsXG5cdFx0XHQnYXJpYS1sYWJlbCc6ICAgdGhpcy5tb2RlbC5nZXQoICd0aXRsZScgKSxcblx0XHRcdCdhcmlhLWNoZWNrZWQnOiBmYWxzZSxcblx0XHRcdCdkYXRhLWlkJzogICAgICB0aGlzLm1vZGVsLmdldCggJ2lkJyApXG5cdFx0fTtcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgLmpzLS1zZWxlY3QtYXR0YWNobWVudCc6ICAgJ3RvZ2dsZVNlbGVjdGlvbkhhbmRsZXInLFxuXHRcdCdjaGFuZ2UgW2RhdGEtc2V0dGluZ10nOiAgICAgICAgICAndXBkYXRlU2V0dGluZycsXG5cdFx0J2NoYW5nZSBbZGF0YS1zZXR0aW5nXSBpbnB1dCc6ICAgICd1cGRhdGVTZXR0aW5nJyxcblx0XHQnY2hhbmdlIFtkYXRhLXNldHRpbmddIHNlbGVjdCc6ICAgJ3VwZGF0ZVNldHRpbmcnLFxuXHRcdCdjaGFuZ2UgW2RhdGEtc2V0dGluZ10gdGV4dGFyZWEnOiAndXBkYXRlU2V0dGluZycsXG5cdFx0J2NsaWNrIC5hdHRhY2htZW50LWNsb3NlJzogICAgICAgICdyZW1vdmVGcm9tTGlicmFyeScsXG5cdFx0J2NsaWNrIC5jaGVjayc6ICAgICAgICAgICAgICAgICAgICdjaGVja0NsaWNrSGFuZGxlcicsXG5cdFx0J2tleWRvd24nOiAgICAgICAgICAgICAgICAgICAgICAgICd0b2dnbGVTZWxlY3Rpb25IYW5kbGVyJ1xuXHR9LFxuXG5cdGJ1dHRvbnM6IHt9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0b3B0aW9ucyA9IF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0XHRyZXJlbmRlck9uTW9kZWxDaGFuZ2U6IHRydWVcblx0XHRcdH0gKTtcblxuXHRcdGlmICggb3B0aW9ucy5yZXJlbmRlck9uTW9kZWxDaGFuZ2UgKSB7XG5cdFx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZTpwZXJjZW50JywgdGhpcy5wcm9ncmVzcyApO1xuXHRcdH1cblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOnRpdGxlJywgdGhpcy5fc3luY1RpdGxlICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZTpjYXB0aW9uJywgdGhpcy5fc3luY0NhcHRpb24gKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOmFydGlzdCcsIHRoaXMuX3N5bmNBcnRpc3QgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOmFsYnVtJywgdGhpcy5fc3luY0FsYnVtICk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIHNlbGVjdGlvbi5cblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnYWRkJywgdGhpcy5zZWxlY3QgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAncmVtb3ZlJywgdGhpcy5kZXNlbGVjdCApO1xuXHRcdGlmICggc2VsZWN0aW9uICkge1xuXHRcdFx0c2VsZWN0aW9uLm9uKCAncmVzZXQnLCB0aGlzLnVwZGF0ZVNlbGVjdCwgdGhpcyApO1xuXHRcdFx0Ly8gVXBkYXRlIHRoZSBtb2RlbCdzIGRldGFpbHMgdmlldy5cblx0XHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdzZWxlY3Rpb246c2luZ2xlIHNlbGVjdGlvbjp1bnNpbmdsZScsIHRoaXMuZGV0YWlscyApO1xuXHRcdFx0dGhpcy5kZXRhaWxzKCB0aGlzLm1vZGVsLCB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jb250cm9sbGVyLCAnYXR0YWNobWVudDpjb21wYXQ6d2FpdGluZyBhdHRhY2htZW50OmNvbXBhdDpyZWFkeScsIHRoaXMudXBkYXRlU2F2ZSApO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuQXR0YWNobWVudH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uO1xuXG5cdFx0Ly8gTWFrZSBzdXJlIGFsbCBzZXR0aW5ncyBhcmUgc2F2ZWQgYmVmb3JlIHJlbW92aW5nIHRoZSB2aWV3LlxuXHRcdHRoaXMudXBkYXRlQWxsKCk7XG5cblx0XHRpZiAoIHNlbGVjdGlvbiApIHtcblx0XHRcdHNlbGVjdGlvbi5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHR9XG5cdFx0LyoqXG5cdFx0ICogY2FsbCAnZGlzcG9zZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzc1xuXHRcdCAqL1xuXHRcdFZpZXcucHJvdG90eXBlLmRpc3Bvc2UuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuQXR0YWNobWVudH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG9wdGlvbnMgPSBfLmRlZmF1bHRzKCB0aGlzLm1vZGVsLnRvSlNPTigpLCB7XG5cdFx0XHRcdG9yaWVudGF0aW9uOiAgICdsYW5kc2NhcGUnLFxuXHRcdFx0XHR1cGxvYWRpbmc6ICAgICBmYWxzZSxcblx0XHRcdFx0dHlwZTogICAgICAgICAgJycsXG5cdFx0XHRcdHN1YnR5cGU6ICAgICAgICcnLFxuXHRcdFx0XHRpY29uOiAgICAgICAgICAnJyxcblx0XHRcdFx0ZmlsZW5hbWU6ICAgICAgJycsXG5cdFx0XHRcdGNhcHRpb246ICAgICAgICcnLFxuXHRcdFx0XHR0aXRsZTogICAgICAgICAnJyxcblx0XHRcdFx0ZGF0ZUZvcm1hdHRlZDogJycsXG5cdFx0XHRcdHdpZHRoOiAgICAgICAgICcnLFxuXHRcdFx0XHRoZWlnaHQ6ICAgICAgICAnJyxcblx0XHRcdFx0Y29tcGF0OiAgICAgICAgZmFsc2UsXG5cdFx0XHRcdGFsdDogICAgICAgICAgICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogICAnJ1xuXHRcdFx0fSwgdGhpcy5vcHRpb25zICk7XG5cblx0XHRvcHRpb25zLmJ1dHRvbnMgID0gdGhpcy5idXR0b25zO1xuXHRcdG9wdGlvbnMuZGVzY3JpYmUgPSB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ2Rlc2NyaWJlJyk7XG5cblx0XHRpZiAoICdpbWFnZScgPT09IG9wdGlvbnMudHlwZSApIHtcblx0XHRcdG9wdGlvbnMuc2l6ZSA9IHRoaXMuaW1hZ2VTaXplKCk7XG5cdFx0fVxuXG5cdFx0b3B0aW9ucy5jYW4gPSB7fTtcblx0XHRpZiAoIG9wdGlvbnMubm9uY2VzICkge1xuXHRcdFx0b3B0aW9ucy5jYW4ucmVtb3ZlID0gISEgb3B0aW9ucy5ub25jZXNbJ2RlbGV0ZSddO1xuXHRcdFx0b3B0aW9ucy5jYW4uc2F2ZSA9ICEhIG9wdGlvbnMubm9uY2VzLnVwZGF0ZTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMuY29udHJvbGxlci5zdGF0ZSgpLmdldCgnYWxsb3dMb2NhbEVkaXRzJykgKSB7XG5cdFx0XHRvcHRpb25zLmFsbG93TG9jYWxFZGl0cyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCBvcHRpb25zLnVwbG9hZGluZyAmJiAhIG9wdGlvbnMucGVyY2VudCApIHtcblx0XHRcdG9wdGlvbnMucGVyY2VudCA9IDA7XG5cdFx0fVxuXG5cdFx0dGhpcy52aWV3cy5kZXRhY2goKTtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLnRlbXBsYXRlKCBvcHRpb25zICkgKTtcblxuXHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCAndXBsb2FkaW5nJywgb3B0aW9ucy51cGxvYWRpbmcgKTtcblxuXHRcdGlmICggb3B0aW9ucy51cGxvYWRpbmcgKSB7XG5cdFx0XHR0aGlzLiRiYXIgPSB0aGlzLiQoJy5tZWRpYS1wcm9ncmVzcy1iYXIgZGl2Jyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlbGV0ZSB0aGlzLiRiYXI7XG5cdFx0fVxuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlIG1vZGVsIGlzIHNlbGVjdGVkLlxuXHRcdHRoaXMudXBkYXRlU2VsZWN0KCk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIHNhdmUgc3RhdHVzLlxuXHRcdHRoaXMudXBkYXRlU2F2ZSgpO1xuXG5cdFx0dGhpcy52aWV3cy5yZW5kZXIoKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHByb2dyZXNzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuJGJhciAmJiB0aGlzLiRiYXIubGVuZ3RoICkge1xuXHRcdFx0dGhpcy4kYmFyLndpZHRoKCB0aGlzLm1vZGVsLmdldCgncGVyY2VudCcpICsgJyUnICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdHRvZ2dsZVNlbGVjdGlvbkhhbmRsZXI6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgbWV0aG9kO1xuXG5cdFx0Ly8gRG9uJ3QgZG8gYW55dGhpbmcgaW5zaWRlIGlucHV0cyBhbmQgb24gdGhlIGF0dGFjaG1lbnQgY2hlY2sgYW5kIHJlbW92ZSBidXR0b25zLlxuXHRcdGlmICggJ0lOUFVUJyA9PT0gZXZlbnQudGFyZ2V0Lm5vZGVOYW1lIHx8ICdCVVRUT04nID09PSBldmVudC50YXJnZXQubm9kZU5hbWUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gQ2F0Y2ggYXJyb3cgZXZlbnRzXG5cdFx0aWYgKCAzNyA9PT0gZXZlbnQua2V5Q29kZSB8fCAzOCA9PT0gZXZlbnQua2V5Q29kZSB8fCAzOSA9PT0gZXZlbnQua2V5Q29kZSB8fCA0MCA9PT0gZXZlbnQua2V5Q29kZSApIHtcblx0XHRcdHRoaXMuY29udHJvbGxlci50cmlnZ2VyKCAnYXR0YWNobWVudDprZXlkb3duOmFycm93JywgZXZlbnQgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBDYXRjaCBlbnRlciBhbmQgc3BhY2UgZXZlbnRzXG5cdFx0aWYgKCAna2V5ZG93bicgPT09IGV2ZW50LnR5cGUgJiYgMTMgIT09IGV2ZW50LmtleUNvZGUgJiYgMzIgIT09IGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdC8vIEluIHRoZSBncmlkIHZpZXcsIGJ1YmJsZSB1cCBhbiBlZGl0OmF0dGFjaG1lbnQgZXZlbnQgdG8gdGhlIGNvbnRyb2xsZXIuXG5cdFx0aWYgKCB0aGlzLmNvbnRyb2xsZXIuaXNNb2RlQWN0aXZlKCAnZ3JpZCcgKSApIHtcblx0XHRcdGlmICggdGhpcy5jb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ2VkaXQnICkgKSB7XG5cdFx0XHRcdC8vIFBhc3MgdGhlIGN1cnJlbnQgdGFyZ2V0IHRvIHJlc3RvcmUgZm9jdXMgd2hlbiBjbG9zaW5nXG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci50cmlnZ2VyKCAnZWRpdDphdHRhY2htZW50JywgdGhpcy5tb2RlbCwgZXZlbnQuY3VycmVudFRhcmdldCApO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICggdGhpcy5jb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ3NlbGVjdCcgKSApIHtcblx0XHRcdFx0bWV0aG9kID0gJ3RvZ2dsZSc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCBldmVudC5zaGlmdEtleSApIHtcblx0XHRcdG1ldGhvZCA9ICdiZXR3ZWVuJztcblx0XHR9IGVsc2UgaWYgKCBldmVudC5jdHJsS2V5IHx8IGV2ZW50Lm1ldGFLZXkgKSB7XG5cdFx0XHRtZXRob2QgPSAndG9nZ2xlJztcblx0XHR9XG5cblx0XHR0aGlzLnRvZ2dsZVNlbGVjdGlvbih7XG5cdFx0XHRtZXRob2Q6IG1ldGhvZFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdzZWxlY3Rpb246dG9nZ2xlJyApO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICovXG5cdHRvZ2dsZVNlbGVjdGlvbjogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dmFyIGNvbGxlY3Rpb24gPSB0aGlzLmNvbGxlY3Rpb24sXG5cdFx0XHRzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0bW9kZWwgPSB0aGlzLm1vZGVsLFxuXHRcdFx0bWV0aG9kID0gb3B0aW9ucyAmJiBvcHRpb25zLm1ldGhvZCxcblx0XHRcdHNpbmdsZSwgbW9kZWxzLCBzaW5nbGVJbmRleCwgbW9kZWxJbmRleDtcblxuXHRcdGlmICggISBzZWxlY3Rpb24gKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0c2luZ2xlID0gc2VsZWN0aW9uLnNpbmdsZSgpO1xuXHRcdG1ldGhvZCA9IF8uaXNVbmRlZmluZWQoIG1ldGhvZCApID8gc2VsZWN0aW9uLm11bHRpcGxlIDogbWV0aG9kO1xuXG5cdFx0Ly8gSWYgdGhlIGBtZXRob2RgIGlzIHNldCB0byBgYmV0d2VlbmAsIHNlbGVjdCBhbGwgbW9kZWxzIHRoYXRcblx0XHQvLyBleGlzdCBiZXR3ZWVuIHRoZSBjdXJyZW50IGFuZCB0aGUgc2VsZWN0ZWQgbW9kZWwuXG5cdFx0aWYgKCAnYmV0d2VlbicgPT09IG1ldGhvZCAmJiBzaW5nbGUgJiYgc2VsZWN0aW9uLm11bHRpcGxlICkge1xuXHRcdFx0Ly8gSWYgdGhlIG1vZGVscyBhcmUgdGhlIHNhbWUsIHNob3J0LWNpcmN1aXQuXG5cdFx0XHRpZiAoIHNpbmdsZSA9PT0gbW9kZWwgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0c2luZ2xlSW5kZXggPSBjb2xsZWN0aW9uLmluZGV4T2YoIHNpbmdsZSApO1xuXHRcdFx0bW9kZWxJbmRleCAgPSBjb2xsZWN0aW9uLmluZGV4T2YoIHRoaXMubW9kZWwgKTtcblxuXHRcdFx0aWYgKCBzaW5nbGVJbmRleCA8IG1vZGVsSW5kZXggKSB7XG5cdFx0XHRcdG1vZGVscyA9IGNvbGxlY3Rpb24ubW9kZWxzLnNsaWNlKCBzaW5nbGVJbmRleCwgbW9kZWxJbmRleCArIDEgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1vZGVscyA9IGNvbGxlY3Rpb24ubW9kZWxzLnNsaWNlKCBtb2RlbEluZGV4LCBzaW5nbGVJbmRleCArIDEgKTtcblx0XHRcdH1cblxuXHRcdFx0c2VsZWN0aW9uLmFkZCggbW9kZWxzICk7XG5cdFx0XHRzZWxlY3Rpb24uc2luZ2xlKCBtb2RlbCApO1xuXHRcdFx0cmV0dXJuO1xuXG5cdFx0Ly8gSWYgdGhlIGBtZXRob2RgIGlzIHNldCB0byBgdG9nZ2xlYCwganVzdCBmbGlwIHRoZSBzZWxlY3Rpb25cblx0XHQvLyBzdGF0dXMsIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgbW9kZWwgaXMgdGhlIHNpbmdsZSBtb2RlbC5cblx0XHR9IGVsc2UgaWYgKCAndG9nZ2xlJyA9PT0gbWV0aG9kICkge1xuXHRcdFx0c2VsZWN0aW9uWyB0aGlzLnNlbGVjdGVkKCkgPyAncmVtb3ZlJyA6ICdhZGQnIF0oIG1vZGVsICk7XG5cdFx0XHRzZWxlY3Rpb24uc2luZ2xlKCBtb2RlbCApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH0gZWxzZSBpZiAoICdhZGQnID09PSBtZXRob2QgKSB7XG5cdFx0XHRzZWxlY3Rpb24uYWRkKCBtb2RlbCApO1xuXHRcdFx0c2VsZWN0aW9uLnNpbmdsZSggbW9kZWwgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBGaXhlcyBidWcgdGhhdCBsb3NlcyBmb2N1cyB3aGVuIHNlbGVjdGluZyBhIGZlYXR1cmVkIGltYWdlXG5cdFx0aWYgKCAhIG1ldGhvZCApIHtcblx0XHRcdG1ldGhvZCA9ICdhZGQnO1xuXHRcdH1cblxuXHRcdGlmICggbWV0aG9kICE9PSAnYWRkJyApIHtcblx0XHRcdG1ldGhvZCA9ICdyZXNldCc7XG5cdFx0fVxuXG5cdFx0aWYgKCB0aGlzLnNlbGVjdGVkKCkgKSB7XG5cdFx0XHQvLyBJZiB0aGUgbW9kZWwgaXMgdGhlIHNpbmdsZSBtb2RlbCwgcmVtb3ZlIGl0LlxuXHRcdFx0Ly8gSWYgaXQgaXMgbm90IHRoZSBzYW1lIGFzIHRoZSBzaW5nbGUgbW9kZWwsXG5cdFx0XHQvLyBpdCBub3cgYmVjb21lcyB0aGUgc2luZ2xlIG1vZGVsLlxuXHRcdFx0c2VsZWN0aW9uWyBzaW5nbGUgPT09IG1vZGVsID8gJ3JlbW92ZScgOiAnc2luZ2xlJyBdKCBtb2RlbCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBJZiB0aGUgbW9kZWwgaXMgbm90IHNlbGVjdGVkLCBydW4gdGhlIGBtZXRob2RgIG9uIHRoZVxuXHRcdFx0Ly8gc2VsZWN0aW9uLiBCeSBkZWZhdWx0LCB3ZSBgcmVzZXRgIHRoZSBzZWxlY3Rpb24sIGJ1dCB0aGVcblx0XHRcdC8vIGBtZXRob2RgIGNhbiBiZSBzZXQgdG8gYGFkZGAgdGhlIG1vZGVsIHRvIHRoZSBzZWxlY3Rpb24uXG5cdFx0XHRzZWxlY3Rpb25bIG1ldGhvZCBdKCBtb2RlbCApO1xuXHRcdFx0c2VsZWN0aW9uLnNpbmdsZSggbW9kZWwgKTtcblx0XHR9XG5cdH0sXG5cblx0dXBkYXRlU2VsZWN0OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzWyB0aGlzLnNlbGVjdGVkKCkgPyAnc2VsZWN0JyA6ICdkZXNlbGVjdCcgXSgpO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3VucmVzb2x2ZWR8Qm9vbGVhbn1cblx0ICovXG5cdHNlbGVjdGVkOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0aW9uID0gdGhpcy5vcHRpb25zLnNlbGVjdGlvbjtcblx0XHRpZiAoIHNlbGVjdGlvbiApIHtcblx0XHRcdHJldHVybiAhISBzZWxlY3Rpb24uZ2V0KCB0aGlzLm1vZGVsLmNpZCApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuTW9kZWx9IG1vZGVsXG5cdCAqIEBwYXJhbSB7QmFja2JvbmUuQ29sbGVjdGlvbn0gY29sbGVjdGlvblxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbiggbW9kZWwsIGNvbGxlY3Rpb24gKSB7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHRoaXMub3B0aW9ucy5zZWxlY3Rpb24sXG5cdFx0XHRjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgYSBzZWxlY3Rpb24gZXhpc3RzIGFuZCBpZiBpdCdzIHRoZSBjb2xsZWN0aW9uIHByb3ZpZGVkLlxuXHRcdC8vIElmIHRoZXkncmUgbm90IHRoZSBzYW1lIGNvbGxlY3Rpb24sIGJhaWw7IHdlJ3JlIGluIGFub3RoZXJcblx0XHQvLyBzZWxlY3Rpb24ncyBldmVudCBsb29wLlxuXHRcdGlmICggISBzZWxlY3Rpb24gfHwgKCBjb2xsZWN0aW9uICYmIGNvbGxlY3Rpb24gIT09IHNlbGVjdGlvbiApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEJhaWwgaWYgdGhlIG1vZGVsIGlzIGFscmVhZHkgc2VsZWN0ZWQuXG5cdFx0aWYgKCB0aGlzLiRlbC5oYXNDbGFzcyggJ3NlbGVjdGVkJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEFkZCAnc2VsZWN0ZWQnIGNsYXNzIHRvIG1vZGVsLCBzZXQgYXJpYS1jaGVja2VkIHRvIHRydWUuXG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdzZWxlY3RlZCcgKS5hdHRyKCAnYXJpYS1jaGVja2VkJywgdHJ1ZSApO1xuXHRcdC8vICBNYWtlIHRoZSBjaGVja2JveCB0YWJhYmxlLCBleGNlcHQgaW4gbWVkaWEgZ3JpZCAoYnVsayBzZWxlY3QgbW9kZSkuXG5cdFx0aWYgKCAhICggY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApICYmIGNvbnRyb2xsZXIuaXNNb2RlQWN0aXZlKCAnc2VsZWN0JyApICkgKSB7XG5cdFx0XHR0aGlzLiQoICcuY2hlY2snICkuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtCYWNrYm9uZS5Nb2RlbH0gbW9kZWxcblx0ICogQHBhcmFtIHtCYWNrYm9uZS5Db2xsZWN0aW9ufSBjb2xsZWN0aW9uXG5cdCAqL1xuXHRkZXNlbGVjdDogZnVuY3Rpb24oIG1vZGVsLCBjb2xsZWN0aW9uICkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgYSBzZWxlY3Rpb24gZXhpc3RzIGFuZCBpZiBpdCdzIHRoZSBjb2xsZWN0aW9uIHByb3ZpZGVkLlxuXHRcdC8vIElmIHRoZXkncmUgbm90IHRoZSBzYW1lIGNvbGxlY3Rpb24sIGJhaWw7IHdlJ3JlIGluIGFub3RoZXJcblx0XHQvLyBzZWxlY3Rpb24ncyBldmVudCBsb29wLlxuXHRcdGlmICggISBzZWxlY3Rpb24gfHwgKCBjb2xsZWN0aW9uICYmIGNvbGxlY3Rpb24gIT09IHNlbGVjdGlvbiApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ3NlbGVjdGVkJyApLmF0dHIoICdhcmlhLWNoZWNrZWQnLCBmYWxzZSApXG5cdFx0XHQuZmluZCggJy5jaGVjaycgKS5hdHRyKCAndGFiaW5kZXgnLCAnLTEnICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0JhY2tib25lLk1vZGVsfSBtb2RlbFxuXHQgKiBAcGFyYW0ge0JhY2tib25lLkNvbGxlY3Rpb259IGNvbGxlY3Rpb25cblx0ICovXG5cdGRldGFpbHM6IGZ1bmN0aW9uKCBtb2RlbCwgY29sbGVjdGlvbiApIHtcblx0XHR2YXIgc2VsZWN0aW9uID0gdGhpcy5vcHRpb25zLnNlbGVjdGlvbixcblx0XHRcdGRldGFpbHM7XG5cblx0XHRpZiAoIHNlbGVjdGlvbiAhPT0gY29sbGVjdGlvbiApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRkZXRhaWxzID0gc2VsZWN0aW9uLnNpbmdsZSgpO1xuXHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCAnZGV0YWlscycsIGRldGFpbHMgPT09IHRoaXMubW9kZWwgKTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzaXplXG5cdCAqIEByZXR1cm5zIHtPYmplY3R9XG5cdCAqL1xuXHRpbWFnZVNpemU6IGZ1bmN0aW9uKCBzaXplICkge1xuXHRcdHZhciBzaXplcyA9IHRoaXMubW9kZWwuZ2V0KCdzaXplcycpLCBtYXRjaGVkID0gZmFsc2U7XG5cblx0XHRzaXplID0gc2l6ZSB8fCAnbWVkaXVtJztcblxuXHRcdC8vIFVzZSB0aGUgcHJvdmlkZWQgaW1hZ2Ugc2l6ZSBpZiBwb3NzaWJsZS5cblx0XHRpZiAoIHNpemVzICkge1xuXHRcdFx0aWYgKCBzaXplc1sgc2l6ZSBdICkge1xuXHRcdFx0XHRtYXRjaGVkID0gc2l6ZXNbIHNpemUgXTtcblx0XHRcdH0gZWxzZSBpZiAoIHNpemVzLmxhcmdlICkge1xuXHRcdFx0XHRtYXRjaGVkID0gc2l6ZXMubGFyZ2U7XG5cdFx0XHR9IGVsc2UgaWYgKCBzaXplcy50aHVtYm5haWwgKSB7XG5cdFx0XHRcdG1hdGNoZWQgPSBzaXplcy50aHVtYm5haWw7XG5cdFx0XHR9IGVsc2UgaWYgKCBzaXplcy5mdWxsICkge1xuXHRcdFx0XHRtYXRjaGVkID0gc2l6ZXMuZnVsbDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBtYXRjaGVkICkge1xuXHRcdFx0XHRyZXR1cm4gXy5jbG9uZSggbWF0Y2hlZCApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICAgICAgICAgdGhpcy5tb2RlbC5nZXQoJ3VybCcpLFxuXHRcdFx0d2lkdGg6ICAgICAgIHRoaXMubW9kZWwuZ2V0KCd3aWR0aCcpLFxuXHRcdFx0aGVpZ2h0OiAgICAgIHRoaXMubW9kZWwuZ2V0KCdoZWlnaHQnKSxcblx0XHRcdG9yaWVudGF0aW9uOiB0aGlzLm1vZGVsLmdldCgnb3JpZW50YXRpb24nKVxuXHRcdH07XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdHVwZGF0ZVNldHRpbmc6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgJHNldHRpbmcgPSAkKCBldmVudC50YXJnZXQgKS5jbG9zZXN0KCdbZGF0YS1zZXR0aW5nXScpLFxuXHRcdFx0c2V0dGluZywgdmFsdWU7XG5cblx0XHRpZiAoICEgJHNldHRpbmcubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHNldHRpbmcgPSAkc2V0dGluZy5kYXRhKCdzZXR0aW5nJyk7XG5cdFx0dmFsdWUgICA9IGV2ZW50LnRhcmdldC52YWx1ZTtcblxuXHRcdGlmICggdGhpcy5tb2RlbC5nZXQoIHNldHRpbmcgKSAhPT0gdmFsdWUgKSB7XG5cdFx0XHR0aGlzLnNhdmUoIHNldHRpbmcsIHZhbHVlICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBQYXNzIGFsbCB0aGUgYXJndW1lbnRzIHRvIHRoZSBtb2RlbCdzIHNhdmUgbWV0aG9kLlxuXHQgKlxuXHQgKiBSZWNvcmRzIHRoZSBhZ2dyZWdhdGUgc3RhdHVzIG9mIGFsbCBzYXZlIHJlcXVlc3RzIGFuZCB1cGRhdGVzIHRoZVxuXHQgKiB2aWV3J3MgY2xhc3NlcyBhY2NvcmRpbmdseS5cblx0ICovXG5cdHNhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2aWV3ID0gdGhpcyxcblx0XHRcdHNhdmUgPSB0aGlzLl9zYXZlID0gdGhpcy5fc2F2ZSB8fCB7IHN0YXR1czogJ3JlYWR5JyB9LFxuXHRcdFx0cmVxdWVzdCA9IHRoaXMubW9kZWwuc2F2ZS5hcHBseSggdGhpcy5tb2RlbCwgYXJndW1lbnRzICksXG5cdFx0XHRyZXF1ZXN0cyA9IHNhdmUucmVxdWVzdHMgPyAkLndoZW4oIHJlcXVlc3QsIHNhdmUucmVxdWVzdHMgKSA6IHJlcXVlc3Q7XG5cblx0XHQvLyBJZiB3ZSdyZSB3YWl0aW5nIHRvIHJlbW92ZSAnU2F2ZWQuJywgc3RvcC5cblx0XHRpZiAoIHNhdmUuc2F2ZWRUaW1lciApIHtcblx0XHRcdGNsZWFyVGltZW91dCggc2F2ZS5zYXZlZFRpbWVyICk7XG5cdFx0fVxuXG5cdFx0dGhpcy51cGRhdGVTYXZlKCd3YWl0aW5nJyk7XG5cdFx0c2F2ZS5yZXF1ZXN0cyA9IHJlcXVlc3RzO1xuXHRcdHJlcXVlc3RzLmFsd2F5cyggZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBJZiB3ZSd2ZSBwZXJmb3JtZWQgYW5vdGhlciByZXF1ZXN0IHNpbmNlIHRoaXMgb25lLCBiYWlsLlxuXHRcdFx0aWYgKCBzYXZlLnJlcXVlc3RzICE9PSByZXF1ZXN0cyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2aWV3LnVwZGF0ZVNhdmUoIHJlcXVlc3RzLnN0YXRlKCkgPT09ICdyZXNvbHZlZCcgPyAnY29tcGxldGUnIDogJ2Vycm9yJyApO1xuXHRcdFx0c2F2ZS5zYXZlZFRpbWVyID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZpZXcudXBkYXRlU2F2ZSgncmVhZHknKTtcblx0XHRcdFx0ZGVsZXRlIHNhdmUuc2F2ZWRUaW1lcjtcblx0XHRcdH0sIDIwMDAgKTtcblx0XHR9KTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0dXNcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuQXR0YWNobWVudH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHVwZGF0ZVNhdmU6IGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG5cdFx0dmFyIHNhdmUgPSB0aGlzLl9zYXZlID0gdGhpcy5fc2F2ZSB8fCB7IHN0YXR1czogJ3JlYWR5JyB9O1xuXG5cdFx0aWYgKCBzdGF0dXMgJiYgc3RhdHVzICE9PSBzYXZlLnN0YXR1cyApIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnc2F2ZS0nICsgc2F2ZS5zdGF0dXMgKTtcblx0XHRcdHNhdmUuc3RhdHVzID0gc3RhdHVzO1xuXHRcdH1cblxuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnc2F2ZS0nICsgc2F2ZS5zdGF0dXMgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHR1cGRhdGVBbGw6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciAkc2V0dGluZ3MgPSB0aGlzLiQoJ1tkYXRhLXNldHRpbmddJyksXG5cdFx0XHRtb2RlbCA9IHRoaXMubW9kZWwsXG5cdFx0XHRjaGFuZ2VkO1xuXG5cdFx0Y2hhbmdlZCA9IF8uY2hhaW4oICRzZXR0aW5ncyApLm1hcCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0dmFyICRpbnB1dCA9ICQoJ2lucHV0LCB0ZXh0YXJlYSwgc2VsZWN0LCBbdmFsdWVdJywgZWwgKSxcblx0XHRcdFx0c2V0dGluZywgdmFsdWU7XG5cblx0XHRcdGlmICggISAkaW5wdXQubGVuZ3RoICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHNldHRpbmcgPSAkKGVsKS5kYXRhKCdzZXR0aW5nJyk7XG5cdFx0XHR2YWx1ZSA9ICRpbnB1dC52YWwoKTtcblxuXHRcdFx0Ly8gUmVjb3JkIHRoZSB2YWx1ZSBpZiBpdCBjaGFuZ2VkLlxuXHRcdFx0aWYgKCBtb2RlbC5nZXQoIHNldHRpbmcgKSAhPT0gdmFsdWUgKSB7XG5cdFx0XHRcdHJldHVybiBbIHNldHRpbmcsIHZhbHVlIF07XG5cdFx0XHR9XG5cdFx0fSkuY29tcGFjdCgpLm9iamVjdCgpLnZhbHVlKCk7XG5cblx0XHRpZiAoICEgXy5pc0VtcHR5KCBjaGFuZ2VkICkgKSB7XG5cdFx0XHRtb2RlbC5zYXZlKCBjaGFuZ2VkICk7XG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRyZW1vdmVGcm9tTGlicmFyeTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdC8vIENhdGNoIGVudGVyIGFuZCBzcGFjZSBldmVudHNcblx0XHRpZiAoICdrZXlkb3duJyA9PT0gZXZlbnQudHlwZSAmJiAxMyAhPT0gZXZlbnQua2V5Q29kZSAmJiAzMiAhPT0gZXZlbnQua2V5Q29kZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBTdG9wIHByb3BhZ2F0aW9uIHNvIHRoZSBtb2RlbCBpc24ndCBzZWxlY3RlZC5cblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdHRoaXMuY29sbGVjdGlvbi5yZW1vdmUoIHRoaXMubW9kZWwgKTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIHRoZSBtb2RlbCBpZiBpdCBpc24ndCBpbiB0aGUgc2VsZWN0aW9uLCBpZiBpdCBpcyBpbiB0aGUgc2VsZWN0aW9uLFxuXHQgKiByZW1vdmUgaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSAge1t0eXBlXX0gZXZlbnQgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGNoZWNrQ2xpY2tIYW5kbGVyOiBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uO1xuXHRcdGlmICggISBzZWxlY3Rpb24gKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGlmICggc2VsZWN0aW9uLndoZXJlKCB7IGlkOiB0aGlzLm1vZGVsLmdldCggJ2lkJyApIH0gKS5sZW5ndGggKSB7XG5cdFx0XHRzZWxlY3Rpb24ucmVtb3ZlKCB0aGlzLm1vZGVsICk7XG5cdFx0XHQvLyBNb3ZlIGZvY3VzIGJhY2sgdG8gdGhlIGF0dGFjaG1lbnQgdGlsZSAoZnJvbSB0aGUgY2hlY2spLlxuXHRcdFx0dGhpcy4kZWwuZm9jdXMoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2VsZWN0aW9uLmFkZCggdGhpcy5tb2RlbCApO1xuXHRcdH1cblx0fVxufSk7XG5cbi8vIEVuc3VyZSBzZXR0aW5ncyByZW1haW4gaW4gc3luYyBiZXR3ZWVuIGF0dGFjaG1lbnQgdmlld3MuXG5fLmVhY2goe1xuXHRjYXB0aW9uOiAnX3N5bmNDYXB0aW9uJyxcblx0dGl0bGU6ICAgJ19zeW5jVGl0bGUnLFxuXHRhcnRpc3Q6ICAnX3N5bmNBcnRpc3QnLFxuXHRhbGJ1bTogICAnX3N5bmNBbGJ1bSdcbn0sIGZ1bmN0aW9uKCBtZXRob2QsIHNldHRpbmcgKSB7XG5cdC8qKlxuXHQgKiBAcGFyYW0ge0JhY2tib25lLk1vZGVsfSBtb2RlbFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuQXR0YWNobWVudH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdEF0dGFjaG1lbnQucHJvdG90eXBlWyBtZXRob2QgXSA9IGZ1bmN0aW9uKCBtb2RlbCwgdmFsdWUgKSB7XG5cdFx0dmFyICRzZXR0aW5nID0gdGhpcy4kKCdbZGF0YS1zZXR0aW5nPVwiJyArIHNldHRpbmcgKyAnXCJdJyk7XG5cblx0XHRpZiAoICEgJHNldHRpbmcubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIHVwZGF0ZWQgdmFsdWUgaXMgaW4gc3luYyB3aXRoIHRoZSB2YWx1ZSBpbiB0aGUgRE9NLCB0aGVyZVxuXHRcdC8vIGlzIG5vIG5lZWQgdG8gcmUtcmVuZGVyLiBJZiB3ZSdyZSBjdXJyZW50bHkgZWRpdGluZyB0aGUgdmFsdWUsXG5cdFx0Ly8gaXQgd2lsbCBhdXRvbWF0aWNhbGx5IGJlIGluIHN5bmMsIHN1cHByZXNzaW5nIHRoZSByZS1yZW5kZXIgZm9yXG5cdFx0Ly8gdGhlIHZpZXcgd2UncmUgZWRpdGluZywgd2hpbGUgdXBkYXRpbmcgYW55IG90aGVycy5cblx0XHRpZiAoIHZhbHVlID09PSAkc2V0dGluZy5maW5kKCdpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCwgW3ZhbHVlXScpLnZhbCgpICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMucmVuZGVyKCk7XG5cdH07XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdHRhY2htZW50O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRGV0YWlsc1xuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgQXR0YWNobWVudCA9IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudCxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0RGV0YWlscztcblxuRGV0YWlscyA9IEF0dGFjaG1lbnQuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2Jyxcblx0Y2xhc3NOYW1lOiAnYXR0YWNobWVudC1kZXRhaWxzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgnYXR0YWNobWVudC1kZXRhaWxzJyksXG5cblx0YXR0cmlidXRlczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdCd0YWJJbmRleCc6ICAgICAwLFxuXHRcdFx0J2RhdGEtaWQnOiAgICAgIHRoaXMubW9kZWwuZ2V0KCAnaWQnIClcblx0XHR9O1xuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdjaGFuZ2UgW2RhdGEtc2V0dGluZ10nOiAgICAgICAgICAndXBkYXRlU2V0dGluZycsXG5cdFx0J2NoYW5nZSBbZGF0YS1zZXR0aW5nXSBpbnB1dCc6ICAgICd1cGRhdGVTZXR0aW5nJyxcblx0XHQnY2hhbmdlIFtkYXRhLXNldHRpbmddIHNlbGVjdCc6ICAgJ3VwZGF0ZVNldHRpbmcnLFxuXHRcdCdjaGFuZ2UgW2RhdGEtc2V0dGluZ10gdGV4dGFyZWEnOiAndXBkYXRlU2V0dGluZycsXG5cdFx0J2NsaWNrIC5kZWxldGUtYXR0YWNobWVudCc6ICAgICAgICdkZWxldGVBdHRhY2htZW50Jyxcblx0XHQnY2xpY2sgLnRyYXNoLWF0dGFjaG1lbnQnOiAgICAgICAgJ3RyYXNoQXR0YWNobWVudCcsXG5cdFx0J2NsaWNrIC51bnRyYXNoLWF0dGFjaG1lbnQnOiAgICAgICd1bnRyYXNoQXR0YWNobWVudCcsXG5cdFx0J2NsaWNrIC5lZGl0LWF0dGFjaG1lbnQnOiAgICAgICAgICdlZGl0QXR0YWNobWVudCcsXG5cdFx0J2tleWRvd24nOiAgICAgICAgICAgICAgICAgICAgICAgICd0b2dnbGVTZWxlY3Rpb25IYW5kbGVyJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMub3B0aW9ucyA9IF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0cmVyZW5kZXJPbk1vZGVsQ2hhbmdlOiBmYWxzZVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5vbiggJ3JlYWR5JywgdGhpcy5pbml0aWFsRm9jdXMgKTtcblx0XHQvLyBDYWxsICdpbml0aWFsaXplJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzLlxuXHRcdEF0dGFjaG1lbnQucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdGluaXRpYWxGb2N1czogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAhIHdwLm1lZGlhLmlzVG91Y2hEZXZpY2UgKSB7XG5cdFx0XHQvKlxuXHRcdFx0UHJldmlvdXNseSBmb2N1c2VkIHRoZSBmaXJzdCAnOmlucHV0JyAodGhlIHJlYWRvbmx5IFVSTCB0ZXh0IGZpZWxkKS5cblx0XHRcdFNpbmNlIHRoZSBmaXJzdCAnOmlucHV0JyBpcyBub3cgYSBidXR0b24gKGRlbGV0ZS90cmFzaCk6IHdoZW4gcHJlc3Npbmdcblx0XHRcdHNwYWNlYmFyIG9uIGFuIGF0dGFjaG1lbnQsIEZpcmVmb3ggZmlyZXMgZGVsZXRlQXR0YWNobWVudC90cmFzaEF0dGFjaG1lbnRcblx0XHRcdGFzIHNvb24gYXMgZm9jdXMgaXMgbW92ZWQuIEV4cGxpY2l0bHkgdGFyZ2V0IHRoZSBmaXJzdCB0ZXh0IGZpZWxkIGZvciBub3cuXG5cdFx0XHRAdG9kbyBjaGFuZ2UgaW5pdGlhbCBmb2N1cyBsb2dpYywgYWxzbyBmb3IgYWNjZXNzaWJpbGl0eS5cblx0XHRcdCovXG5cdFx0XHR0aGlzLiQoICdpbnB1dFt0eXBlPVwidGV4dFwiXScgKS5lcSggMCApLmZvY3VzKCk7XG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRkZWxldGVBdHRhY2htZW50OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdGlmICggd2luZG93LmNvbmZpcm0oIGwxMG4ud2FybkRlbGV0ZSApICkge1xuXHRcdFx0dGhpcy5tb2RlbC5kZXN0cm95KCk7XG5cdFx0XHQvLyBLZWVwIGZvY3VzIGluc2lkZSBtZWRpYSBtb2RhbFxuXHRcdFx0Ly8gYWZ0ZXIgaW1hZ2UgaXMgZGVsZXRlZFxuXHRcdFx0dGhpcy5jb250cm9sbGVyLm1vZGFsLmZvY3VzTWFuYWdlci5mb2N1cygpO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0dHJhc2hBdHRhY2htZW50OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGxpYnJhcnkgPSB0aGlzLmNvbnRyb2xsZXIubGlicmFyeTtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0aWYgKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLm1lZGlhVHJhc2ggJiZcblx0XHRcdCdlZGl0LW1ldGFkYXRhJyA9PT0gdGhpcy5jb250cm9sbGVyLmNvbnRlbnQubW9kZSgpICkge1xuXG5cdFx0XHR0aGlzLm1vZGVsLnNldCggJ3N0YXR1cycsICd0cmFzaCcgKTtcblx0XHRcdHRoaXMubW9kZWwuc2F2ZSgpLmRvbmUoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRsaWJyYXJ5Ll9yZXF1ZXJ5KCB0cnVlICk7XG5cdFx0XHR9ICk7XG5cdFx0fSAgZWxzZSB7XG5cdFx0XHR0aGlzLm1vZGVsLmRlc3Ryb3koKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdHVudHJhc2hBdHRhY2htZW50OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGxpYnJhcnkgPSB0aGlzLmNvbnRyb2xsZXIubGlicmFyeTtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dGhpcy5tb2RlbC5zZXQoICdzdGF0dXMnLCAnaW5oZXJpdCcgKTtcblx0XHR0aGlzLm1vZGVsLnNhdmUoKS5kb25lKCBmdW5jdGlvbigpIHtcblx0XHRcdGxpYnJhcnkuX3JlcXVlcnkoIHRydWUgKTtcblx0XHR9ICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdGVkaXRBdHRhY2htZW50OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGVkaXRTdGF0ZSA9IHRoaXMuY29udHJvbGxlci5zdGF0ZXMuZ2V0KCAnZWRpdC1pbWFnZScgKTtcblx0XHRpZiAoIHdpbmRvdy5pbWFnZUVkaXQgJiYgZWRpdFN0YXRlICkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0ZWRpdFN0YXRlLnNldCggJ2ltYWdlJywgdGhpcy5tb2RlbCApO1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLnNldFN0YXRlKCAnZWRpdC1pbWFnZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoJ25lZWRzLXJlZnJlc2gnKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBXaGVuIHJldmVyc2UgdGFiYmluZyhzaGlmdCt0YWIpIG91dCBvZiB0aGUgcmlnaHQgZGV0YWlscyBwYW5lbCwgZGVsaXZlclxuXHQgKiB0aGUgZm9jdXMgdG8gdGhlIGl0ZW0gaW4gdGhlIGxpc3QgdGhhdCB3YXMgYmVpbmcgZWRpdGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdHRvZ2dsZVNlbGVjdGlvbkhhbmRsZXI6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoICdrZXlkb3duJyA9PT0gZXZlbnQudHlwZSAmJiA5ID09PSBldmVudC5rZXlDb2RlICYmIGV2ZW50LnNoaWZ0S2V5ICYmIGV2ZW50LnRhcmdldCA9PT0gdGhpcy4kKCAnOnRhYmJhYmxlJyApLmdldCggMCApICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdhdHRhY2htZW50OmRldGFpbHM6c2hpZnQtdGFiJywgZXZlbnQgKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoIDM3ID09PSBldmVudC5rZXlDb2RlIHx8IDM4ID09PSBldmVudC5rZXlDb2RlIHx8IDM5ID09PSBldmVudC5rZXlDb2RlIHx8IDQwID09PSBldmVudC5rZXlDb2RlICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdhdHRhY2htZW50OmtleWRvd246YXJyb3cnLCBldmVudCApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGV0YWlscztcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5BdHRhY2htZW50LkVkaXRMaWJyYXJ5XG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5BdHRhY2htZW50XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBFZGl0TGlicmFyeSA9IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5leHRlbmQoe1xuXHRidXR0b25zOiB7XG5cdFx0Y2xvc2U6IHRydWVcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdExpYnJhcnk7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudHMuRWRpdFNlbGVjdGlvblxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5TZWxlY3Rpb25cbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEVkaXRTZWxlY3Rpb24gPSB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuU2VsZWN0aW9uLmV4dGVuZCh7XG5cdGJ1dHRvbnM6IHtcblx0XHRjbG9zZTogdHJ1ZVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0U2VsZWN0aW9uO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuTGlicmFyeVxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgTGlicmFyeSA9IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5leHRlbmQoe1xuXHRidXR0b25zOiB7XG5cdFx0Y2hlY2s6IHRydWVcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlicmFyeTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5BdHRhY2htZW50LlNlbGVjdGlvblxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgU2VsZWN0aW9uID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2F0dGFjaG1lbnQgc2VsZWN0aW9uJyxcblxuXHQvLyBPbiBjbGljaywganVzdCBzZWxlY3QgdGhlIG1vZGVsLCBpbnN0ZWFkIG9mIHJlbW92aW5nIHRoZSBtb2RlbCBmcm9tXG5cdC8vIHRoZSBzZWxlY3Rpb24uXG5cdHRvZ2dsZVNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vcHRpb25zLnNlbGVjdGlvbi5zaW5nbGUoIHRoaXMubW9kZWwgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0aW9uO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0JCA9IGpRdWVyeSxcblx0QXR0YWNobWVudHM7XG5cbkF0dGFjaG1lbnRzID0gVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICd1bCcsXG5cdGNsYXNzTmFtZTogJ2F0dGFjaG1lbnRzJyxcblxuXHRhdHRyaWJ1dGVzOiB7XG5cdFx0dGFiSW5kZXg6IC0xXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5lbC5pZCA9IF8udW5pcXVlSWQoJ19fYXR0YWNobWVudHMtdmlldy0nKTtcblxuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0cmVmcmVzaFNlbnNpdGl2aXR5OiB3cC5tZWRpYS5pc1RvdWNoRGV2aWNlID8gMzAwIDogMjAwLFxuXHRcdFx0cmVmcmVzaFRocmVzaG9sZDogICAzLFxuXHRcdFx0QXR0YWNobWVudFZpZXc6ICAgICB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQsXG5cdFx0XHRzb3J0YWJsZTogICAgICAgICAgIGZhbHNlLFxuXHRcdFx0cmVzaXplOiAgICAgICAgICAgICB0cnVlLFxuXHRcdFx0aWRlYWxDb2x1bW5XaWR0aDogICAkKCB3aW5kb3cgKS53aWR0aCgpIDwgNjQwID8gMTM1IDogMTUwXG5cdFx0fSk7XG5cblx0XHR0aGlzLl92aWV3c0J5Q2lkID0ge307XG5cdFx0dGhpcy4kd2luZG93ID0gJCggd2luZG93ICk7XG5cdFx0dGhpcy5yZXNpemVFdmVudCA9ICdyZXNpemUubWVkaWEtbW9kYWwtY29sdW1ucyc7XG5cblx0XHR0aGlzLmNvbGxlY3Rpb24ub24oICdhZGQnLCBmdW5jdGlvbiggYXR0YWNobWVudCApIHtcblx0XHRcdHRoaXMudmlld3MuYWRkKCB0aGlzLmNyZWF0ZUF0dGFjaG1lbnRWaWV3KCBhdHRhY2htZW50ICksIHtcblx0XHRcdFx0YXQ6IHRoaXMuY29sbGVjdGlvbi5pbmRleE9mKCBhdHRhY2htZW50IClcblx0XHRcdH0pO1xuXHRcdH0sIHRoaXMgKTtcblxuXHRcdHRoaXMuY29sbGVjdGlvbi5vbiggJ3JlbW92ZScsIGZ1bmN0aW9uKCBhdHRhY2htZW50ICkge1xuXHRcdFx0dmFyIHZpZXcgPSB0aGlzLl92aWV3c0J5Q2lkWyBhdHRhY2htZW50LmNpZCBdO1xuXHRcdFx0ZGVsZXRlIHRoaXMuX3ZpZXdzQnlDaWRbIGF0dGFjaG1lbnQuY2lkIF07XG5cblx0XHRcdGlmICggdmlldyApIHtcblx0XHRcdFx0dmlldy5yZW1vdmUoKTtcblx0XHRcdH1cblx0XHR9LCB0aGlzICk7XG5cblx0XHR0aGlzLmNvbGxlY3Rpb24ub24oICdyZXNldCcsIHRoaXMucmVuZGVyLCB0aGlzICk7XG5cblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmNvbnRyb2xsZXIsICdsaWJyYXJ5OnNlbGVjdGlvbjphZGQnLCAgICB0aGlzLmF0dGFjaG1lbnRGb2N1cyApO1xuXG5cdFx0Ly8gVGhyb3R0bGUgdGhlIHNjcm9sbCBoYW5kbGVyIGFuZCBiaW5kIHRoaXMuXG5cdFx0dGhpcy5zY3JvbGwgPSBfLmNoYWluKCB0aGlzLnNjcm9sbCApLmJpbmQoIHRoaXMgKS50aHJvdHRsZSggdGhpcy5vcHRpb25zLnJlZnJlc2hTZW5zaXRpdml0eSApLnZhbHVlKCk7XG5cblx0XHR0aGlzLm9wdGlvbnMuc2Nyb2xsRWxlbWVudCA9IHRoaXMub3B0aW9ucy5zY3JvbGxFbGVtZW50IHx8IHRoaXMuZWw7XG5cdFx0JCggdGhpcy5vcHRpb25zLnNjcm9sbEVsZW1lbnQgKS5vbiggJ3Njcm9sbCcsIHRoaXMuc2Nyb2xsICk7XG5cblx0XHR0aGlzLmluaXRTb3J0YWJsZSgpO1xuXG5cdFx0Xy5iaW5kQWxsKCB0aGlzLCAnc2V0Q29sdW1ucycgKTtcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLnJlc2l6ZSApIHtcblx0XHRcdHRoaXMub24oICdyZWFkeScsIHRoaXMuYmluZEV2ZW50cyApO1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnb3BlbicsIHRoaXMuc2V0Q29sdW1ucyApO1xuXG5cdFx0XHQvLyBDYWxsIHRoaXMuc2V0Q29sdW1ucygpIGFmdGVyIHRoaXMgdmlldyBoYXMgYmVlbiByZW5kZXJlZCBpbiB0aGUgRE9NIHNvXG5cdFx0XHQvLyBhdHRhY2htZW50cyBnZXQgcHJvcGVyIHdpZHRoIGFwcGxpZWQuXG5cdFx0XHRfLmRlZmVyKCB0aGlzLnNldENvbHVtbnMsIHRoaXMgKTtcblx0XHR9XG5cdH0sXG5cblx0YmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kd2luZG93Lm9mZiggdGhpcy5yZXNpemVFdmVudCApLm9uKCB0aGlzLnJlc2l6ZUV2ZW50LCBfLmRlYm91bmNlKCB0aGlzLnNldENvbHVtbnMsIDUwICkgKTtcblx0fSxcblxuXHRhdHRhY2htZW50Rm9jdXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJCggJ2xpOmZpcnN0JyApLmZvY3VzKCk7XG5cdH0sXG5cblx0cmVzdG9yZUZvY3VzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiQoICdsaS5zZWxlY3RlZDpmaXJzdCcgKS5mb2N1cygpO1xuXHR9LFxuXG5cdGFycm93RXZlbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgYXR0YWNobWVudHMgPSB0aGlzLiRlbC5jaGlsZHJlbiggJ2xpJyApLFxuXHRcdFx0cGVyUm93ID0gdGhpcy5jb2x1bW5zLFxuXHRcdFx0aW5kZXggPSBhdHRhY2htZW50cy5maWx0ZXIoICc6Zm9jdXMnICkuaW5kZXgoKSxcblx0XHRcdHJvdyA9ICggaW5kZXggKyAxICkgPD0gcGVyUm93ID8gMSA6IE1hdGguY2VpbCggKCBpbmRleCArIDEgKSAvIHBlclJvdyApO1xuXG5cdFx0aWYgKCBpbmRleCA9PT0gLTEgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gTGVmdCBhcnJvd1xuXHRcdGlmICggMzcgPT09IGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHRpZiAoIDAgPT09IGluZGV4ICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRhdHRhY2htZW50cy5lcSggaW5kZXggLSAxICkuZm9jdXMoKTtcblx0XHR9XG5cblx0XHQvLyBVcCBhcnJvd1xuXHRcdGlmICggMzggPT09IGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHRpZiAoIDEgPT09IHJvdyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0YXR0YWNobWVudHMuZXEoIGluZGV4IC0gcGVyUm93ICkuZm9jdXMoKTtcblx0XHR9XG5cblx0XHQvLyBSaWdodCBhcnJvd1xuXHRcdGlmICggMzkgPT09IGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHRpZiAoIGF0dGFjaG1lbnRzLmxlbmd0aCA9PT0gaW5kZXggKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGF0dGFjaG1lbnRzLmVxKCBpbmRleCArIDEgKS5mb2N1cygpO1xuXHRcdH1cblxuXHRcdC8vIERvd24gYXJyb3dcblx0XHRpZiAoIDQwID09PSBldmVudC5rZXlDb2RlICkge1xuXHRcdFx0aWYgKCBNYXRoLmNlaWwoIGF0dGFjaG1lbnRzLmxlbmd0aCAvIHBlclJvdyApID09PSByb3cgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGF0dGFjaG1lbnRzLmVxKCBpbmRleCArIHBlclJvdyApLmZvY3VzKCk7XG5cdFx0fVxuXHR9LFxuXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY29sbGVjdGlvbi5wcm9wcy5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHRpZiAoIHRoaXMub3B0aW9ucy5yZXNpemUgKSB7XG5cdFx0XHR0aGlzLiR3aW5kb3cub2ZmKCB0aGlzLnJlc2l6ZUV2ZW50ICk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogY2FsbCAnZGlzcG9zZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzc1xuXHRcdCAqL1xuXHRcdFZpZXcucHJvdG90eXBlLmRpc3Bvc2UuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdHNldENvbHVtbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwcmV2ID0gdGhpcy5jb2x1bW5zLFxuXHRcdFx0d2lkdGggPSB0aGlzLiRlbC53aWR0aCgpO1xuXG5cdFx0aWYgKCB3aWR0aCApIHtcblx0XHRcdHRoaXMuY29sdW1ucyA9IE1hdGgubWluKCBNYXRoLnJvdW5kKCB3aWR0aCAvIHRoaXMub3B0aW9ucy5pZGVhbENvbHVtbldpZHRoICksIDEyICkgfHwgMTtcblxuXHRcdFx0aWYgKCAhIHByZXYgfHwgcHJldiAhPT0gdGhpcy5jb2x1bW5zICkge1xuXHRcdFx0XHR0aGlzLiRlbC5jbG9zZXN0KCAnLm1lZGlhLWZyYW1lLWNvbnRlbnQnICkuYXR0ciggJ2RhdGEtY29sdW1ucycsIHRoaXMuY29sdW1ucyApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRpbml0U29ydGFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb2xsZWN0aW9uID0gdGhpcy5jb2xsZWN0aW9uO1xuXG5cdFx0aWYgKCAhIHRoaXMub3B0aW9ucy5zb3J0YWJsZSB8fCAhICQuZm4uc29ydGFibGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy4kZWwuc29ydGFibGUoIF8uZXh0ZW5kKHtcblx0XHRcdC8vIElmIHRoZSBgY29sbGVjdGlvbmAgaGFzIGEgYGNvbXBhcmF0b3JgLCBkaXNhYmxlIHNvcnRpbmcuXG5cdFx0XHRkaXNhYmxlZDogISEgY29sbGVjdGlvbi5jb21wYXJhdG9yLFxuXG5cdFx0XHQvLyBDaGFuZ2UgdGhlIHBvc2l0aW9uIG9mIHRoZSBhdHRhY2htZW50IGFzIHNvb24gYXMgdGhlXG5cdFx0XHQvLyBtb3VzZSBwb2ludGVyIG92ZXJsYXBzIGEgdGh1bWJuYWlsLlxuXHRcdFx0dG9sZXJhbmNlOiAncG9pbnRlcicsXG5cblx0XHRcdC8vIFJlY29yZCB0aGUgaW5pdGlhbCBgaW5kZXhgIG9mIHRoZSBkcmFnZ2VkIG1vZGVsLlxuXHRcdFx0c3RhcnQ6IGZ1bmN0aW9uKCBldmVudCwgdWkgKSB7XG5cdFx0XHRcdHVpLml0ZW0uZGF0YSgnc29ydGFibGVJbmRleFN0YXJ0JywgdWkuaXRlbS5pbmRleCgpKTtcblx0XHRcdH0sXG5cblx0XHRcdC8vIFVwZGF0ZSB0aGUgbW9kZWwncyBpbmRleCBpbiB0aGUgY29sbGVjdGlvbi5cblx0XHRcdC8vIERvIHNvIHNpbGVudGx5LCBhcyB0aGUgdmlldyBpcyBhbHJlYWR5IGFjY3VyYXRlLlxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xuXHRcdFx0XHR2YXIgbW9kZWwgPSBjb2xsZWN0aW9uLmF0KCB1aS5pdGVtLmRhdGEoJ3NvcnRhYmxlSW5kZXhTdGFydCcpICksXG5cdFx0XHRcdFx0Y29tcGFyYXRvciA9IGNvbGxlY3Rpb24uY29tcGFyYXRvcjtcblxuXHRcdFx0XHQvLyBUZW1wb3JhcmlseSBkaXNhYmxlIHRoZSBjb21wYXJhdG9yIHRvIHByZXZlbnQgYGFkZGBcblx0XHRcdFx0Ly8gZnJvbSByZS1zb3J0aW5nLlxuXHRcdFx0XHRkZWxldGUgY29sbGVjdGlvbi5jb21wYXJhdG9yO1xuXG5cdFx0XHRcdC8vIFNpbGVudGx5IHNoaWZ0IHRoZSBtb2RlbCB0byBpdHMgbmV3IGluZGV4LlxuXHRcdFx0XHRjb2xsZWN0aW9uLnJlbW92ZSggbW9kZWwsIHtcblx0XHRcdFx0XHRzaWxlbnQ6IHRydWVcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGNvbGxlY3Rpb24uYWRkKCBtb2RlbCwge1xuXHRcdFx0XHRcdHNpbGVudDogdHJ1ZSxcblx0XHRcdFx0XHRhdDogICAgIHVpLml0ZW0uaW5kZXgoKVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQvLyBSZXN0b3JlIHRoZSBjb21wYXJhdG9yLlxuXHRcdFx0XHRjb2xsZWN0aW9uLmNvbXBhcmF0b3IgPSBjb21wYXJhdG9yO1xuXG5cdFx0XHRcdC8vIEZpcmUgdGhlIGByZXNldGAgZXZlbnQgdG8gZW5zdXJlIG90aGVyIGNvbGxlY3Rpb25zIHN5bmMuXG5cdFx0XHRcdGNvbGxlY3Rpb24udHJpZ2dlciggJ3Jlc2V0JywgY29sbGVjdGlvbiApO1xuXG5cdFx0XHRcdC8vIElmIHRoZSBjb2xsZWN0aW9uIGlzIHNvcnRlZCBieSBtZW51IG9yZGVyLFxuXHRcdFx0XHQvLyB1cGRhdGUgdGhlIG1lbnUgb3JkZXIuXG5cdFx0XHRcdGNvbGxlY3Rpb24uc2F2ZU1lbnVPcmRlcigpO1xuXHRcdFx0fVxuXHRcdH0sIHRoaXMub3B0aW9ucy5zb3J0YWJsZSApICk7XG5cblx0XHQvLyBJZiB0aGUgYG9yZGVyYnlgIHByb3BlcnR5IGlzIGNoYW5nZWQgb24gdGhlIGBjb2xsZWN0aW9uYCxcblx0XHQvLyBjaGVjayB0byBzZWUgaWYgd2UgaGF2ZSBhIGBjb21wYXJhdG9yYC4gSWYgc28sIGRpc2FibGUgc29ydGluZy5cblx0XHRjb2xsZWN0aW9uLnByb3BzLm9uKCAnY2hhbmdlOm9yZGVyYnknLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuJGVsLnNvcnRhYmxlKCAnb3B0aW9uJywgJ2Rpc2FibGVkJywgISEgY29sbGVjdGlvbi5jb21wYXJhdG9yICk7XG5cdFx0fSwgdGhpcyApO1xuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLnByb3BzLm9uKCAnY2hhbmdlOm9yZGVyYnknLCB0aGlzLnJlZnJlc2hTb3J0YWJsZSwgdGhpcyApO1xuXHRcdHRoaXMucmVmcmVzaFNvcnRhYmxlKCk7XG5cdH0sXG5cblx0cmVmcmVzaFNvcnRhYmxlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgdGhpcy5vcHRpb25zLnNvcnRhYmxlIHx8ICEgJC5mbi5zb3J0YWJsZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgYGNvbGxlY3Rpb25gIGhhcyBhIGBjb21wYXJhdG9yYCwgZGlzYWJsZSBzb3J0aW5nLlxuXHRcdHZhciBjb2xsZWN0aW9uID0gdGhpcy5jb2xsZWN0aW9uLFxuXHRcdFx0b3JkZXJieSA9IGNvbGxlY3Rpb24ucHJvcHMuZ2V0KCdvcmRlcmJ5JyksXG5cdFx0XHRlbmFibGVkID0gJ21lbnVPcmRlcicgPT09IG9yZGVyYnkgfHwgISBjb2xsZWN0aW9uLmNvbXBhcmF0b3I7XG5cblx0XHR0aGlzLiRlbC5zb3J0YWJsZSggJ29wdGlvbicsICdkaXNhYmxlZCcsICEgZW5hYmxlZCApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnR9IGF0dGFjaG1lbnRcblx0ICogQHJldHVybnMge3dwLm1lZGlhLlZpZXd9XG5cdCAqL1xuXHRjcmVhdGVBdHRhY2htZW50VmlldzogZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0dmFyIHZpZXcgPSBuZXcgdGhpcy5vcHRpb25zLkF0dGFjaG1lbnRWaWV3KHtcblx0XHRcdGNvbnRyb2xsZXI6ICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRtb2RlbDogICAgICAgICAgICAgICAgYXR0YWNobWVudCxcblx0XHRcdGNvbGxlY3Rpb246ICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24sXG5cdFx0XHRzZWxlY3Rpb246ICAgICAgICAgICAgdGhpcy5vcHRpb25zLnNlbGVjdGlvblxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRoaXMuX3ZpZXdzQnlDaWRbIGF0dGFjaG1lbnQuY2lkIF0gPSB2aWV3O1xuXHR9LFxuXG5cdHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIENyZWF0ZSBhbGwgb2YgdGhlIEF0dGFjaG1lbnQgdmlld3MsIGFuZCByZXBsYWNlXG5cdFx0Ly8gdGhlIGxpc3QgaW4gYSBzaW5nbGUgRE9NIG9wZXJhdGlvbi5cblx0XHRpZiAoIHRoaXMuY29sbGVjdGlvbi5sZW5ndGggKSB7XG5cdFx0XHR0aGlzLnZpZXdzLnNldCggdGhpcy5jb2xsZWN0aW9uLm1hcCggdGhpcy5jcmVhdGVBdHRhY2htZW50VmlldywgdGhpcyApICk7XG5cblx0XHQvLyBJZiB0aGVyZSBhcmUgbm8gZWxlbWVudHMsIGNsZWFyIHRoZSB2aWV3cyBhbmQgbG9hZCBzb21lLlxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnZpZXdzLnVuc2V0KCk7XG5cdFx0XHR0aGlzLmNvbGxlY3Rpb24ubW9yZSgpLmRvbmUoIHRoaXMuc2Nyb2xsICk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHQvLyBUcmlnZ2VyIHRoZSBzY3JvbGwgZXZlbnQgdG8gY2hlY2sgaWYgd2UncmUgd2l0aGluIHRoZVxuXHRcdC8vIHRocmVzaG9sZCB0byBxdWVyeSBmb3IgYWRkaXRpb25hbCBhdHRhY2htZW50cy5cblx0XHR0aGlzLnNjcm9sbCgpO1xuXHR9LFxuXG5cdHNjcm9sbDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLFxuXHRcdFx0ZWwgPSB0aGlzLm9wdGlvbnMuc2Nyb2xsRWxlbWVudCxcblx0XHRcdHNjcm9sbFRvcCA9IGVsLnNjcm9sbFRvcCxcblx0XHRcdHRvb2xiYXI7XG5cblx0XHQvLyBUaGUgc2Nyb2xsIGV2ZW50IG9jY3VycyBvbiB0aGUgZG9jdW1lbnQsIGJ1dCB0aGUgZWxlbWVudFxuXHRcdC8vIHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQgaXMgdGhlIGRvY3VtZW50IGJvZHkuXG5cdFx0aWYgKCBlbCA9PT0gZG9jdW1lbnQgKSB7XG5cdFx0XHRlbCA9IGRvY3VtZW50LmJvZHk7XG5cdFx0XHRzY3JvbGxUb3AgPSAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKTtcblx0XHR9XG5cblx0XHRpZiAoICEgJChlbCkuaXMoJzp2aXNpYmxlJykgfHwgISB0aGlzLmNvbGxlY3Rpb24uaGFzTW9yZSgpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRvb2xiYXIgPSB0aGlzLnZpZXdzLnBhcmVudC50b29sYmFyO1xuXG5cdFx0Ly8gU2hvdyB0aGUgc3Bpbm5lciBvbmx5IGlmIHdlIGFyZSBjbG9zZSB0byB0aGUgYm90dG9tLlxuXHRcdGlmICggZWwuc2Nyb2xsSGVpZ2h0IC0gKCBzY3JvbGxUb3AgKyBlbC5jbGllbnRIZWlnaHQgKSA8IGVsLmNsaWVudEhlaWdodCAvIDMgKSB7XG5cdFx0XHR0b29sYmFyLmdldCgnc3Bpbm5lcicpLnNob3coKTtcblx0XHR9XG5cblx0XHRpZiAoIGVsLnNjcm9sbEhlaWdodCA8IHNjcm9sbFRvcCArICggZWwuY2xpZW50SGVpZ2h0ICogdGhpcy5vcHRpb25zLnJlZnJlc2hUaHJlc2hvbGQgKSApIHtcblx0XHRcdHRoaXMuY29sbGVjdGlvbi5tb3JlKCkuZG9uZShmdW5jdGlvbigpIHtcblx0XHRcdFx0dmlldy5zY3JvbGwoKTtcblx0XHRcdFx0dG9vbGJhci5nZXQoJ3NwaW5uZXInKS5oaWRlKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF0dGFjaG1lbnRzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzQnJvd3NlclxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICAgIFtvcHRpb25zXSAgICAgICAgICAgICAgIFRoZSBvcHRpb25zIGhhc2ggcGFzc2VkIHRvIHRoZSB2aWV3LlxuICogQHBhcmFtIHtib29sZWFufHN0cmluZ30gW29wdGlvbnMuZmlsdGVycz1mYWxzZV0gV2hpY2ggZmlsdGVycyB0byBzaG93IGluIHRoZSBicm93c2VyJ3MgdG9vbGJhci5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjY2VwdHMgJ3VwbG9hZGVkJyBhbmQgJ2FsbCcuXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICBbb3B0aW9ucy5zZWFyY2g9dHJ1ZV0gICBXaGV0aGVyIHRvIHNob3cgdGhlIHNlYXJjaCBpbnRlcmZhY2UgaW4gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm93c2VyJ3MgdG9vbGJhci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgIFtvcHRpb25zLmRhdGU9dHJ1ZV0gICAgIFdoZXRoZXIgdG8gc2hvdyB0aGUgZGF0ZSBmaWx0ZXIgaW4gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm93c2VyJ3MgdG9vbGJhci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgIFtvcHRpb25zLmRpc3BsYXk9ZmFsc2VdIFdoZXRoZXIgdG8gc2hvdyB0aGUgYXR0YWNobWVudHMgZGlzcGxheSBzZXR0aW5nc1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlldyBpbiB0aGUgc2lkZWJhci5cbiAqIEBwYXJhbSB7Ym9vbGVhbnxzdHJpbmd9IFtvcHRpb25zLnNpZGViYXI9dHJ1ZV0gIFdoZXRoZXIgdG8gY3JlYXRlIGEgc2lkZWJhciBmb3IgdGhlIGJyb3dzZXIuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY2NlcHRzIHRydWUsIGZhbHNlLCBhbmQgJ2Vycm9ycycuXG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0bWVkaWFUcmFzaCA9IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MubWVkaWFUcmFzaCxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0JCA9IGpRdWVyeSxcblx0QXR0YWNobWVudHNCcm93c2VyO1xuXG5BdHRhY2htZW50c0Jyb3dzZXIgPSBWaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2RpdicsXG5cdGNsYXNzTmFtZTogJ2F0dGFjaG1lbnRzLWJyb3dzZXInLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0ZmlsdGVyczogZmFsc2UsXG5cdFx0XHRzZWFyY2g6ICB0cnVlLFxuXHRcdFx0ZGF0ZTogICAgdHJ1ZSxcblx0XHRcdGRpc3BsYXk6IGZhbHNlLFxuXHRcdFx0c2lkZWJhcjogdHJ1ZSxcblx0XHRcdEF0dGFjaG1lbnRWaWV3OiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuTGlicmFyeVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAndG9nZ2xlOnVwbG9hZDphdHRhY2htZW50JywgdGhpcy50b2dnbGVVcGxvYWRlciwgdGhpcyApO1xuXHRcdHRoaXMuY29udHJvbGxlci5vbiggJ2VkaXQ6c2VsZWN0aW9uJywgdGhpcy5lZGl0U2VsZWN0aW9uICk7XG5cdFx0dGhpcy5jcmVhdGVUb29sYmFyKCk7XG5cdFx0dGhpcy5jcmVhdGVVcGxvYWRlcigpO1xuXHRcdHRoaXMuY3JlYXRlQXR0YWNobWVudHMoKTtcblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zaWRlYmFyICkge1xuXHRcdFx0dGhpcy5jcmVhdGVTaWRlYmFyKCk7XG5cdFx0fVxuXHRcdHRoaXMudXBkYXRlQ29udGVudCgpO1xuXG5cdFx0aWYgKCAhIHRoaXMub3B0aW9ucy5zaWRlYmFyIHx8ICdlcnJvcnMnID09PSB0aGlzLm9wdGlvbnMuc2lkZWJhciApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnaGlkZS1zaWRlYmFyJyApO1xuXG5cdFx0XHRpZiAoICdlcnJvcnMnID09PSB0aGlzLm9wdGlvbnMuc2lkZWJhciApIHtcblx0XHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdzaWRlYmFyLWZvci1lcnJvcnMnICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLm9uKCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMudXBkYXRlQ29udGVudCwgdGhpcyApO1xuXHR9LFxuXG5cdGVkaXRTZWxlY3Rpb246IGZ1bmN0aW9uKCBtb2RhbCApIHtcblx0XHRtb2RhbC4kKCAnLm1lZGlhLWJ1dHRvbi1iYWNrVG9MaWJyYXJ5JyApLmZvY3VzKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzQnJvd3Nlcn0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMub3B0aW9ucy5zZWxlY3Rpb24ub2ZmKCBudWxsLCBudWxsLCB0aGlzICk7XG5cdFx0Vmlldy5wcm90b3R5cGUuZGlzcG9zZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Y3JlYXRlVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIExpYnJhcnlWaWV3U3dpdGNoZXIsIEZpbHRlcnMsIHRvb2xiYXJPcHRpb25zO1xuXG5cdFx0dG9vbGJhck9wdGlvbnMgPSB7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXJcblx0XHR9O1xuXG5cdFx0aWYgKCB0aGlzLmNvbnRyb2xsZXIuaXNNb2RlQWN0aXZlKCAnZ3JpZCcgKSApIHtcblx0XHRcdHRvb2xiYXJPcHRpb25zLmNsYXNzTmFtZSA9ICdtZWRpYS10b29sYmFyIHdwLWZpbHRlcic7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0KiBAbWVtYmVyIHt3cC5tZWRpYS52aWV3LlRvb2xiYXJ9XG5cdFx0Ki9cblx0XHR0aGlzLnRvb2xiYXIgPSBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKCB0b29sYmFyT3B0aW9ucyApO1xuXG5cdFx0dGhpcy52aWV3cy5hZGQoIHRoaXMudG9vbGJhciApO1xuXG5cdFx0dGhpcy50b29sYmFyLnNldCggJ3NwaW5uZXInLCBuZXcgd3AubWVkaWEudmlldy5TcGlubmVyKHtcblx0XHRcdHByaW9yaXR5OiAtNjBcblx0XHR9KSApO1xuXG5cdFx0aWYgKCAtMSAhPT0gJC5pbkFycmF5KCB0aGlzLm9wdGlvbnMuZmlsdGVycywgWyAndXBsb2FkZWQnLCAnYWxsJyBdICkgKSB7XG5cdFx0XHQvLyBcIkZpbHRlcnNcIiB3aWxsIHJldHVybiBhIDxzZWxlY3Q+LCBuZWVkIHRvIHJlbmRlclxuXHRcdFx0Ly8gc2NyZWVuIHJlYWRlciB0ZXh0IGJlZm9yZVxuXHRcdFx0dGhpcy50b29sYmFyLnNldCggJ2ZpbHRlcnNMYWJlbCcsIG5ldyB3cC5tZWRpYS52aWV3LkxhYmVsKHtcblx0XHRcdFx0dmFsdWU6IGwxMG4uZmlsdGVyQnlUeXBlLFxuXHRcdFx0XHRhdHRyaWJ1dGVzOiB7XG5cdFx0XHRcdFx0J2Zvcic6ICAnbWVkaWEtYXR0YWNobWVudC1maWx0ZXJzJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmlvcml0eTogICAtODBcblx0XHRcdH0pLnJlbmRlcigpICk7XG5cblx0XHRcdGlmICggJ3VwbG9hZGVkJyA9PT0gdGhpcy5vcHRpb25zLmZpbHRlcnMgKSB7XG5cdFx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdmaWx0ZXJzJywgbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMuVXBsb2FkZWQoe1xuXHRcdFx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRtb2RlbDogICAgICB0aGlzLmNvbGxlY3Rpb24ucHJvcHMsXG5cdFx0XHRcdFx0cHJpb3JpdHk6ICAgLTgwXG5cdFx0XHRcdH0pLnJlbmRlcigpICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRGaWx0ZXJzID0gbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudEZpbHRlcnMuQWxsKHtcblx0XHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdFx0bW9kZWw6ICAgICAgdGhpcy5jb2xsZWN0aW9uLnByb3BzLFxuXHRcdFx0XHRcdHByaW9yaXR5OiAgIC04MFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZmlsdGVycycsIEZpbHRlcnMucmVuZGVyKCkgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBGZWVscyBvZGQgdG8gYnJpbmcgdGhlIGdsb2JhbCBtZWRpYSBsaWJyYXJ5IHN3aXRjaGVyIGludG8gdGhlIEF0dGFjaG1lbnRcblx0XHQvLyBicm93c2VyIHZpZXcuIElzIHRoaXMgYSB1c2UgY2FzZSBmb3IgZG9BY3Rpb24oICdhZGQ6dG9vbGJhci1pdGVtczphdHRhY2htZW50cy1icm93c2VyJywgdGhpcy50b29sYmFyICk7XG5cdFx0Ly8gd2hpY2ggdGhlIGNvbnRyb2xsZXIgY2FuIHRhcCBpbnRvIGFuZCBhZGQgdGhpcyB2aWV3P1xuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ2dyaWQnICkgKSB7XG5cdFx0XHRMaWJyYXJ5Vmlld1N3aXRjaGVyID0gVmlldy5leHRlbmQoe1xuXHRcdFx0XHRjbGFzc05hbWU6ICd2aWV3LXN3aXRjaCBtZWRpYS1ncmlkLXZpZXctc3dpdGNoJyxcblx0XHRcdFx0dGVtcGxhdGU6IHdwLnRlbXBsYXRlKCAnbWVkaWEtbGlicmFyeS12aWV3LXN3aXRjaGVyJylcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnbGlicmFyeVZpZXdTd2l0Y2hlcicsIG5ldyBMaWJyYXJ5Vmlld1N3aXRjaGVyKHtcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRwcmlvcml0eTogLTkwXG5cdFx0XHR9KS5yZW5kZXIoKSApO1xuXG5cdFx0XHQvLyBEYXRlRmlsdGVyIGlzIGEgPHNlbGVjdD4sIHNjcmVlbiByZWFkZXIgdGV4dCBuZWVkcyB0byBiZSByZW5kZXJlZCBiZWZvcmVcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdkYXRlRmlsdGVyTGFiZWwnLCBuZXcgd3AubWVkaWEudmlldy5MYWJlbCh7XG5cdFx0XHRcdHZhbHVlOiBsMTBuLmZpbHRlckJ5RGF0ZSxcblx0XHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0XHRcdCdmb3InOiAnbWVkaWEtYXR0YWNobWVudC1kYXRlLWZpbHRlcnMnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByaW9yaXR5OiAtNzVcblx0XHRcdH0pLnJlbmRlcigpICk7XG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZGF0ZUZpbHRlcicsIG5ldyB3cC5tZWRpYS52aWV3LkRhdGVGaWx0ZXIoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdG1vZGVsOiAgICAgIHRoaXMuY29sbGVjdGlvbi5wcm9wcyxcblx0XHRcdFx0cHJpb3JpdHk6IC03NVxuXHRcdFx0fSkucmVuZGVyKCkgKTtcblxuXHRcdFx0Ly8gQnVsa1NlbGVjdGlvbiBpcyBhIDxkaXY+IHdpdGggc3Vidmlld3MsIGluY2x1ZGluZyBzY3JlZW4gcmVhZGVyIHRleHRcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdzZWxlY3RNb2RlVG9nZ2xlQnV0dG9uJywgbmV3IHdwLm1lZGlhLnZpZXcuU2VsZWN0TW9kZVRvZ2dsZUJ1dHRvbih7XG5cdFx0XHRcdHRleHQ6IGwxMG4uYnVsa1NlbGVjdCxcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRwcmlvcml0eTogLTcwXG5cdFx0XHR9KS5yZW5kZXIoKSApO1xuXG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZGVsZXRlU2VsZWN0ZWRCdXR0b24nLCBuZXcgd3AubWVkaWEudmlldy5EZWxldGVTZWxlY3RlZEJ1dHRvbih7XG5cdFx0XHRcdGZpbHRlcnM6IEZpbHRlcnMsXG5cdFx0XHRcdHN0eWxlOiAncHJpbWFyeScsXG5cdFx0XHRcdGRpc2FibGVkOiB0cnVlLFxuXHRcdFx0XHR0ZXh0OiBtZWRpYVRyYXNoID8gbDEwbi50cmFzaFNlbGVjdGVkIDogbDEwbi5kZWxldGVTZWxlY3RlZCxcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRwcmlvcml0eTogLTYwLFxuXHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIGNoYW5nZWQgPSBbXSwgcmVtb3ZlZCA9IFtdLFxuXHRcdFx0XHRcdFx0c2VsZWN0aW9uID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCAnc2VsZWN0aW9uJyApLFxuXHRcdFx0XHRcdFx0bGlicmFyeSA9IHRoaXMuY29udHJvbGxlci5zdGF0ZSgpLmdldCggJ2xpYnJhcnknICk7XG5cblx0XHRcdFx0XHRpZiAoICEgc2VsZWN0aW9uLmxlbmd0aCApIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoICEgbWVkaWFUcmFzaCAmJiAhIHdpbmRvdy5jb25maXJtKCBsMTBuLndhcm5CdWxrRGVsZXRlICkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKCBtZWRpYVRyYXNoICYmXG5cdFx0XHRcdFx0XHQndHJhc2gnICE9PSBzZWxlY3Rpb24uYXQoIDAgKS5nZXQoICdzdGF0dXMnICkgJiZcblx0XHRcdFx0XHRcdCEgd2luZG93LmNvbmZpcm0oIGwxMG4ud2FybkJ1bGtUcmFzaCApICkge1xuXG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2VsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdFx0XHRcdGlmICggISBtb2RlbC5nZXQoICdub25jZXMnIClbJ2RlbGV0ZSddICkge1xuXHRcdFx0XHRcdFx0XHRyZW1vdmVkLnB1c2goIG1vZGVsICk7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCBtZWRpYVRyYXNoICYmICd0cmFzaCcgPT09IG1vZGVsLmdldCggJ3N0YXR1cycgKSApIHtcblx0XHRcdFx0XHRcdFx0bW9kZWwuc2V0KCAnc3RhdHVzJywgJ2luaGVyaXQnICk7XG5cdFx0XHRcdFx0XHRcdGNoYW5nZWQucHVzaCggbW9kZWwuc2F2ZSgpICk7XG5cdFx0XHRcdFx0XHRcdHJlbW92ZWQucHVzaCggbW9kZWwgKTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoIG1lZGlhVHJhc2ggKSB7XG5cdFx0XHRcdFx0XHRcdG1vZGVsLnNldCggJ3N0YXR1cycsICd0cmFzaCcgKTtcblx0XHRcdFx0XHRcdFx0Y2hhbmdlZC5wdXNoKCBtb2RlbC5zYXZlKCkgKTtcblx0XHRcdFx0XHRcdFx0cmVtb3ZlZC5wdXNoKCBtb2RlbCApO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0bW9kZWwuZGVzdHJveSh7d2FpdDogdHJ1ZX0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRcdGlmICggY2hhbmdlZC5sZW5ndGggKSB7XG5cdFx0XHRcdFx0XHRzZWxlY3Rpb24ucmVtb3ZlKCByZW1vdmVkICk7XG5cblx0XHRcdFx0XHRcdCQud2hlbi5hcHBseSggbnVsbCwgY2hhbmdlZCApLnRoZW4oIF8uYmluZCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdGxpYnJhcnkuX3JlcXVlcnkoIHRydWUgKTtcblx0XHRcdFx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdzZWxlY3Rpb246YWN0aW9uOmRvbmUnICk7XG5cdFx0XHRcdFx0XHR9LCB0aGlzICkgKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdzZWxlY3Rpb246YWN0aW9uOmRvbmUnICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KS5yZW5kZXIoKSApO1xuXG5cdFx0XHRpZiAoIG1lZGlhVHJhc2ggKSB7XG5cdFx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdkZWxldGVTZWxlY3RlZFBlcm1hbmVudGx5QnV0dG9uJywgbmV3IHdwLm1lZGlhLnZpZXcuRGVsZXRlU2VsZWN0ZWRQZXJtYW5lbnRseUJ1dHRvbih7XG5cdFx0XHRcdFx0ZmlsdGVyczogRmlsdGVycyxcblx0XHRcdFx0XHRzdHlsZTogJ3ByaW1hcnknLFxuXHRcdFx0XHRcdGRpc2FibGVkOiB0cnVlLFxuXHRcdFx0XHRcdHRleHQ6IGwxMG4uZGVsZXRlU2VsZWN0ZWQsXG5cdFx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdHByaW9yaXR5OiAtNTUsXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIHJlbW92ZWQgPSBbXSwgc2VsZWN0aW9uID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCAnc2VsZWN0aW9uJyApO1xuXG5cdFx0XHRcdFx0XHRpZiAoICEgc2VsZWN0aW9uLmxlbmd0aCB8fCAhIHdpbmRvdy5jb25maXJtKCBsMTBuLndhcm5CdWxrRGVsZXRlICkgKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0c2VsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdFx0XHRcdFx0aWYgKCAhIG1vZGVsLmdldCggJ25vbmNlcycgKVsnZGVsZXRlJ10gKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmVtb3ZlZC5wdXNoKCBtb2RlbCApO1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG1vZGVsLmRlc3Ryb3koKTtcblx0XHRcdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRcdFx0c2VsZWN0aW9uLnJlbW92ZSggcmVtb3ZlZCApO1xuXHRcdFx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICdzZWxlY3Rpb246YWN0aW9uOmRvbmUnICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KS5yZW5kZXIoKSApO1xuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIGlmICggdGhpcy5vcHRpb25zLmRhdGUgKSB7XG5cdFx0XHQvLyBEYXRlRmlsdGVyIGlzIGEgPHNlbGVjdD4sIHNjcmVlbiByZWFkZXIgdGV4dCBuZWVkcyB0byBiZSByZW5kZXJlZCBiZWZvcmVcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdkYXRlRmlsdGVyTGFiZWwnLCBuZXcgd3AubWVkaWEudmlldy5MYWJlbCh7XG5cdFx0XHRcdHZhbHVlOiBsMTBuLmZpbHRlckJ5RGF0ZSxcblx0XHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0XHRcdCdmb3InOiAnbWVkaWEtYXR0YWNobWVudC1kYXRlLWZpbHRlcnMnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByaW9yaXR5OiAtNzVcblx0XHRcdH0pLnJlbmRlcigpICk7XG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZGF0ZUZpbHRlcicsIG5ldyB3cC5tZWRpYS52aWV3LkRhdGVGaWx0ZXIoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdG1vZGVsOiAgICAgIHRoaXMuY29sbGVjdGlvbi5wcm9wcyxcblx0XHRcdFx0cHJpb3JpdHk6IC03NVxuXHRcdFx0fSkucmVuZGVyKCkgKTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zZWFyY2ggKSB7XG5cdFx0XHQvLyBTZWFyY2ggaXMgYW4gaW5wdXQsIHNjcmVlbiByZWFkZXIgdGV4dCBuZWVkcyB0byBiZSByZW5kZXJlZCBiZWZvcmVcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdzZWFyY2hMYWJlbCcsIG5ldyB3cC5tZWRpYS52aWV3LkxhYmVsKHtcblx0XHRcdFx0dmFsdWU6IGwxMG4uc2VhcmNoTWVkaWFMYWJlbCxcblx0XHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0XHRcdCdmb3InOiAnbWVkaWEtc2VhcmNoLWlucHV0J1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmlvcml0eTogICA2MFxuXHRcdFx0fSkucmVuZGVyKCkgKTtcblx0XHRcdHRoaXMudG9vbGJhci5zZXQoICdzZWFyY2gnLCBuZXcgd3AubWVkaWEudmlldy5TZWFyY2goe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdG1vZGVsOiAgICAgIHRoaXMuY29sbGVjdGlvbi5wcm9wcyxcblx0XHRcdFx0cHJpb3JpdHk6ICAgNjBcblx0XHRcdH0pLnJlbmRlcigpICk7XG5cdFx0fVxuXG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMuZHJhZ0luZm8gKSB7XG5cdFx0XHR0aGlzLnRvb2xiYXIuc2V0KCAnZHJhZ0luZm8nLCBuZXcgVmlldyh7XG5cdFx0XHRcdGVsOiAkKCAnPGRpdiBjbGFzcz1cImluc3RydWN0aW9uc1wiPicgKyBsMTBuLmRyYWdJbmZvICsgJzwvZGl2PicgKVswXSxcblx0XHRcdFx0cHJpb3JpdHk6IC00MFxuXHRcdFx0fSkgKTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zdWdnZXN0ZWRXaWR0aCAmJiB0aGlzLm9wdGlvbnMuc3VnZ2VzdGVkSGVpZ2h0ICkge1xuXHRcdFx0dGhpcy50b29sYmFyLnNldCggJ3N1Z2dlc3RlZERpbWVuc2lvbnMnLCBuZXcgVmlldyh7XG5cdFx0XHRcdGVsOiAkKCAnPGRpdiBjbGFzcz1cImluc3RydWN0aW9uc1wiPicgKyBsMTBuLnN1Z2dlc3RlZERpbWVuc2lvbnMgKyAnICcgKyB0aGlzLm9wdGlvbnMuc3VnZ2VzdGVkV2lkdGggKyAnICZ0aW1lczsgJyArIHRoaXMub3B0aW9ucy5zdWdnZXN0ZWRIZWlnaHQgKyAnPC9kaXY+JyApWzBdLFxuXHRcdFx0XHRwcmlvcml0eTogLTQwXG5cdFx0XHR9KSApO1xuXHRcdH1cblx0fSxcblxuXHR1cGRhdGVDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMsXG5cdFx0XHRub0l0ZW1zVmlldztcblxuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ2dyaWQnICkgKSB7XG5cdFx0XHRub0l0ZW1zVmlldyA9IHZpZXcuYXR0YWNobWVudHNOb1Jlc3VsdHM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5vSXRlbXNWaWV3ID0gdmlldy51cGxvYWRlcjtcblx0XHR9XG5cblx0XHRpZiAoICEgdGhpcy5jb2xsZWN0aW9uLmxlbmd0aCApIHtcblx0XHRcdHRoaXMudG9vbGJhci5nZXQoICdzcGlubmVyJyApLnNob3coKTtcblx0XHRcdHRoaXMuZGZkID0gdGhpcy5jb2xsZWN0aW9uLm1vcmUoKS5kb25lKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKCAhIHZpZXcuY29sbGVjdGlvbi5sZW5ndGggKSB7XG5cdFx0XHRcdFx0bm9JdGVtc1ZpZXcuJGVsLnJlbW92ZUNsYXNzKCAnaGlkZGVuJyApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG5vSXRlbXNWaWV3LiRlbC5hZGRDbGFzcyggJ2hpZGRlbicgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2aWV3LnRvb2xiYXIuZ2V0KCAnc3Bpbm5lcicgKS5oaWRlKCk7XG5cdFx0XHR9ICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5vSXRlbXNWaWV3LiRlbC5hZGRDbGFzcyggJ2hpZGRlbicgKTtcblx0XHRcdHZpZXcudG9vbGJhci5nZXQoICdzcGlubmVyJyApLmhpZGUoKTtcblx0XHR9XG5cdH0sXG5cblx0Y3JlYXRlVXBsb2FkZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudXBsb2FkZXIgPSBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlcklubGluZSh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRzdGF0dXM6ICAgICBmYWxzZSxcblx0XHRcdG1lc3NhZ2U6ICAgIHRoaXMuY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApID8gJycgOiBsMTBuLm5vSXRlbXNGb3VuZCxcblx0XHRcdGNhbkNsb3NlOiAgIHRoaXMuY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApXG5cdFx0fSk7XG5cblx0XHR0aGlzLnVwbG9hZGVyLmhpZGUoKTtcblx0XHR0aGlzLnZpZXdzLmFkZCggdGhpcy51cGxvYWRlciApO1xuXHR9LFxuXG5cdHRvZ2dsZVVwbG9hZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMudXBsb2FkZXIuJGVsLmhhc0NsYXNzKCAnaGlkZGVuJyApICkge1xuXHRcdFx0dGhpcy51cGxvYWRlci5zaG93KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudXBsb2FkZXIuaGlkZSgpO1xuXHRcdH1cblx0fSxcblxuXHRjcmVhdGVBdHRhY2htZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hdHRhY2htZW50cyA9IG5ldyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzKHtcblx0XHRcdGNvbnRyb2xsZXI6ICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRjb2xsZWN0aW9uOiAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLFxuXHRcdFx0c2VsZWN0aW9uOiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zZWxlY3Rpb24sXG5cdFx0XHRtb2RlbDogICAgICAgICAgICAgICAgdGhpcy5tb2RlbCxcblx0XHRcdHNvcnRhYmxlOiAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuc29ydGFibGUsXG5cdFx0XHRzY3JvbGxFbGVtZW50OiAgICAgICAgdGhpcy5vcHRpb25zLnNjcm9sbEVsZW1lbnQsXG5cdFx0XHRpZGVhbENvbHVtbldpZHRoOiAgICAgdGhpcy5vcHRpb25zLmlkZWFsQ29sdW1uV2lkdGgsXG5cblx0XHRcdC8vIFRoZSBzaW5nbGUgYEF0dGFjaG1lbnRgIHZpZXcgdG8gYmUgdXNlZCBpbiB0aGUgYEF0dGFjaG1lbnRzYCB2aWV3LlxuXHRcdFx0QXR0YWNobWVudFZpZXc6IHRoaXMub3B0aW9ucy5BdHRhY2htZW50Vmlld1xuXHRcdH0pO1xuXG5cdFx0Ly8gQWRkIGtleWRvd24gbGlzdGVuZXIgdG8gdGhlIGluc3RhbmNlIG9mIHRoZSBBdHRhY2htZW50cyB2aWV3XG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnYXR0YWNobWVudDprZXlkb3duOmFycm93JywgICAgIF8uYmluZCggdGhpcy5hdHRhY2htZW50cy5hcnJvd0V2ZW50LCB0aGlzLmF0dGFjaG1lbnRzICkgKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIub24oICdhdHRhY2htZW50OmRldGFpbHM6c2hpZnQtdGFiJywgXy5iaW5kKCB0aGlzLmF0dGFjaG1lbnRzLnJlc3RvcmVGb2N1cywgdGhpcy5hdHRhY2htZW50cyApICk7XG5cblx0XHR0aGlzLnZpZXdzLmFkZCggdGhpcy5hdHRhY2htZW50cyApO1xuXG5cblx0XHRpZiAoIHRoaXMuY29udHJvbGxlci5pc01vZGVBY3RpdmUoICdncmlkJyApICkge1xuXHRcdFx0dGhpcy5hdHRhY2htZW50c05vUmVzdWx0cyA9IG5ldyBWaWV3KHtcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHR0YWdOYW1lOiAncCdcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmF0dGFjaG1lbnRzTm9SZXN1bHRzLiRlbC5hZGRDbGFzcyggJ2hpZGRlbiBuby1tZWRpYScgKTtcblx0XHRcdHRoaXMuYXR0YWNobWVudHNOb1Jlc3VsdHMuJGVsLmh0bWwoIGwxMG4ubm9NZWRpYSApO1xuXG5cdFx0XHR0aGlzLnZpZXdzLmFkZCggdGhpcy5hdHRhY2htZW50c05vUmVzdWx0cyApO1xuXHRcdH1cblx0fSxcblxuXHRjcmVhdGVTaWRlYmFyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcblx0XHRcdHNlbGVjdGlvbiA9IG9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0c2lkZWJhciA9IHRoaXMuc2lkZWJhciA9IG5ldyB3cC5tZWRpYS52aWV3LlNpZGViYXIoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXJcblx0XHRcdH0pO1xuXG5cdFx0dGhpcy52aWV3cy5hZGQoIHNpZGViYXIgKTtcblxuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLnVwbG9hZGVyICkge1xuXHRcdFx0c2lkZWJhci5zZXQoICd1cGxvYWRzJywgbmV3IHdwLm1lZGlhLnZpZXcuVXBsb2FkZXJTdGF0dXMoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdHByaW9yaXR5OiAgIDQwXG5cdFx0XHR9KSApO1xuXHRcdH1cblxuXHRcdHNlbGVjdGlvbi5vbiggJ3NlbGVjdGlvbjpzaW5nbGUnLCB0aGlzLmNyZWF0ZVNpbmdsZSwgdGhpcyApO1xuXHRcdHNlbGVjdGlvbi5vbiggJ3NlbGVjdGlvbjp1bnNpbmdsZScsIHRoaXMuZGlzcG9zZVNpbmdsZSwgdGhpcyApO1xuXG5cdFx0aWYgKCBzZWxlY3Rpb24uc2luZ2xlKCkgKSB7XG5cdFx0XHR0aGlzLmNyZWF0ZVNpbmdsZSgpO1xuXHRcdH1cblx0fSxcblxuXHRjcmVhdGVTaW5nbGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzaWRlYmFyID0gdGhpcy5zaWRlYmFyLFxuXHRcdFx0c2luZ2xlID0gdGhpcy5vcHRpb25zLnNlbGVjdGlvbi5zaW5nbGUoKTtcblxuXHRcdHNpZGViYXIuc2V0KCAnZGV0YWlscycsIG5ldyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRGV0YWlscyh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRtb2RlbDogICAgICBzaW5nbGUsXG5cdFx0XHRwcmlvcml0eTogICA4MFxuXHRcdH0pICk7XG5cblx0XHRzaWRlYmFyLnNldCggJ2NvbXBhdCcsIG5ldyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRDb21wYXQoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0bW9kZWw6ICAgICAgc2luZ2xlLFxuXHRcdFx0cHJpb3JpdHk6ICAgMTIwXG5cdFx0fSkgKTtcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLmRpc3BsYXkgKSB7XG5cdFx0XHRzaWRlYmFyLnNldCggJ2Rpc3BsYXknLCBuZXcgd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheSh7XG5cdFx0XHRcdGNvbnRyb2xsZXI6ICAgdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRtb2RlbDogICAgICAgIHRoaXMubW9kZWwuZGlzcGxheSggc2luZ2xlICksXG5cdFx0XHRcdGF0dGFjaG1lbnQ6ICAgc2luZ2xlLFxuXHRcdFx0XHRwcmlvcml0eTogICAgIDE2MCxcblx0XHRcdFx0dXNlclNldHRpbmdzOiB0aGlzLm1vZGVsLmdldCgnZGlzcGxheVVzZXJTZXR0aW5ncycpXG5cdFx0XHR9KSApO1xuXHRcdH1cblxuXHRcdC8vIFNob3cgdGhlIHNpZGViYXIgb24gbW9iaWxlXG5cdFx0aWYgKCB0aGlzLm1vZGVsLmlkID09PSAnaW5zZXJ0JyApIHtcblx0XHRcdHNpZGViYXIuJGVsLmFkZENsYXNzKCAndmlzaWJsZScgKTtcblx0XHR9XG5cdH0sXG5cblx0ZGlzcG9zZVNpbmdsZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNpZGViYXIgPSB0aGlzLnNpZGViYXI7XG5cdFx0c2lkZWJhci51bnNldCgnZGV0YWlscycpO1xuXHRcdHNpZGViYXIudW5zZXQoJ2NvbXBhdCcpO1xuXHRcdHNpZGViYXIudW5zZXQoJ2Rpc3BsYXknKTtcblx0XHQvLyBIaWRlIHRoZSBzaWRlYmFyIG9uIG1vYmlsZVxuXHRcdHNpZGViYXIuJGVsLnJlbW92ZUNsYXNzKCAndmlzaWJsZScgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0YWNobWVudHNCcm93c2VyO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzLlNlbGVjdGlvblxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudHNcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEF0dGFjaG1lbnRzID0gd3AubWVkaWEudmlldy5BdHRhY2htZW50cyxcblx0U2VsZWN0aW9uO1xuXG5TZWxlY3Rpb24gPSBBdHRhY2htZW50cy5leHRlbmQoe1xuXHRldmVudHM6IHt9LFxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdHNvcnRhYmxlOiAgIGZhbHNlLFxuXHRcdFx0cmVzaXplOiAgICAgZmFsc2UsXG5cblx0XHRcdC8vIFRoZSBzaW5nbGUgYEF0dGFjaG1lbnRgIHZpZXcgdG8gYmUgdXNlZCBpbiB0aGUgYEF0dGFjaG1lbnRzYCB2aWV3LlxuXHRcdFx0QXR0YWNobWVudFZpZXc6IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5TZWxlY3Rpb25cblx0XHR9KTtcblx0XHQvLyBDYWxsICdpbml0aWFsaXplJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzLlxuXHRcdHJldHVybiBBdHRhY2htZW50cy5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGlvbjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5CdXR0b25Hcm91cFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgJCA9IEJhY2tib25lLiQsXG5cdEJ1dHRvbkdyb3VwO1xuXG5CdXR0b25Hcm91cCA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2Jyxcblx0Y2xhc3NOYW1lOiAnYnV0dG9uLWdyb3VwIGJ1dHRvbi1sYXJnZSBtZWRpYS1idXR0b24tZ3JvdXAnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIEBtZW1iZXIge3dwLm1lZGlhLnZpZXcuQnV0dG9uW119XG5cdFx0ICovXG5cdFx0dGhpcy5idXR0b25zID0gXy5tYXAoIHRoaXMub3B0aW9ucy5idXR0b25zIHx8IFtdLCBmdW5jdGlvbiggYnV0dG9uICkge1xuXHRcdFx0aWYgKCBidXR0b24gaW5zdGFuY2VvZiBCYWNrYm9uZS5WaWV3ICkge1xuXHRcdFx0XHRyZXR1cm4gYnV0dG9uO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIG5ldyB3cC5tZWRpYS52aWV3LkJ1dHRvbiggYnV0dG9uICkucmVuZGVyKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRkZWxldGUgdGhpcy5vcHRpb25zLmJ1dHRvbnM7XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5jbGFzc2VzICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoIHRoaXMub3B0aW9ucy5jbGFzc2VzICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5CdXR0b25Hcm91cH1cblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJCggXy5wbHVjayggdGhpcy5idXR0b25zLCAnZWwnICkgKS5kZXRhY2goKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b25Hcm91cDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5CdXR0b25cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEJ1dHRvbiA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAgJ2J1dHRvbicsXG5cdGNsYXNzTmFtZTogICdtZWRpYS1idXR0b24nLFxuXHRhdHRyaWJ1dGVzOiB7IHR5cGU6ICdidXR0b24nIH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ2NsaWNrJ1xuXHR9LFxuXG5cdGRlZmF1bHRzOiB7XG5cdFx0dGV4dDogICAgICcnLFxuXHRcdHN0eWxlOiAgICAnJyxcblx0XHRzaXplOiAgICAgJ2xhcmdlJyxcblx0XHRkaXNhYmxlZDogZmFsc2Vcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvKipcblx0XHQgKiBDcmVhdGUgYSBtb2RlbCB3aXRoIHRoZSBwcm92aWRlZCBgZGVmYXVsdHNgLlxuXHRcdCAqXG5cdFx0ICogQG1lbWJlciB7QmFja2JvbmUuTW9kZWx9XG5cdFx0ICovXG5cdFx0dGhpcy5tb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCggdGhpcy5kZWZhdWx0cyApO1xuXG5cdFx0Ly8gSWYgYW55IG9mIHRoZSBgb3B0aW9uc2AgaGF2ZSBhIGtleSBmcm9tIGBkZWZhdWx0c2AsIGFwcGx5IGl0c1xuXHRcdC8vIHZhbHVlIHRvIHRoZSBgbW9kZWxgIGFuZCByZW1vdmUgaXQgZnJvbSB0aGUgYG9wdGlvbnMgb2JqZWN0LlxuXHRcdF8uZWFjaCggdGhpcy5kZWZhdWx0cywgZnVuY3Rpb24oIGRlZiwga2V5ICkge1xuXHRcdFx0dmFyIHZhbHVlID0gdGhpcy5vcHRpb25zWyBrZXkgXTtcblx0XHRcdGlmICggXy5pc1VuZGVmaW5lZCggdmFsdWUgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm1vZGVsLnNldCgga2V5LCB2YWx1ZSApO1xuXHRcdFx0ZGVsZXRlIHRoaXMub3B0aW9uc1sga2V5IF07XG5cdFx0fSwgdGhpcyApO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5CdXR0b259IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gWyAnYnV0dG9uJywgdGhpcy5jbGFzc05hbWUgXSxcblx0XHRcdG1vZGVsID0gdGhpcy5tb2RlbC50b0pTT04oKTtcblxuXHRcdGlmICggbW9kZWwuc3R5bGUgKSB7XG5cdFx0XHRjbGFzc2VzLnB1c2goICdidXR0b24tJyArIG1vZGVsLnN0eWxlICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBtb2RlbC5zaXplICkge1xuXHRcdFx0Y2xhc3Nlcy5wdXNoKCAnYnV0dG9uLScgKyBtb2RlbC5zaXplICk7XG5cdFx0fVxuXG5cdFx0Y2xhc3NlcyA9IF8udW5pcSggY2xhc3Nlcy5jb25jYXQoIHRoaXMub3B0aW9ucy5jbGFzc2VzICkgKTtcblx0XHR0aGlzLmVsLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpO1xuXG5cdFx0dGhpcy4kZWwuYXR0ciggJ2Rpc2FibGVkJywgbW9kZWwuZGlzYWJsZWQgKTtcblx0XHR0aGlzLiRlbC50ZXh0KCB0aGlzLm1vZGVsLmdldCgndGV4dCcpICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0Y2xpY2s6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoICcjJyA9PT0gdGhpcy5hdHRyaWJ1dGVzLmhyZWYgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5vcHRpb25zLmNsaWNrICYmICEgdGhpcy5tb2RlbC5nZXQoJ2Rpc2FibGVkJykgKSB7XG5cdFx0XHR0aGlzLm9wdGlvbnMuY2xpY2suYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkNyb3BwZXJcbiAqXG4gKiBVc2VzIHRoZSBpbWdBcmVhU2VsZWN0IHBsdWdpbiB0byBhbGxvdyBhIHVzZXIgdG8gY3JvcCBhbiBpbWFnZS5cbiAqXG4gKiBUYWtlcyBpbWdBcmVhU2VsZWN0IG9wdGlvbnMgZnJvbVxuICogd3AuY3VzdG9taXplLkhlYWRlckNvbnRyb2wuY2FsY3VsYXRlSW1hZ2VTZWxlY3RPcHRpb25zIHZpYVxuICogd3AuY3VzdG9taXplLkhlYWRlckNvbnRyb2wub3Blbk1NLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdFVwbG9hZGVyU3RhdHVzID0gd3AubWVkaWEudmlldy5VcGxvYWRlclN0YXR1cyxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0JCA9IGpRdWVyeSxcblx0Q3JvcHBlcjtcblxuQ3JvcHBlciA9IFZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnY3JvcC1jb250ZW50Jyxcblx0dGVtcGxhdGU6IHdwLnRlbXBsYXRlKCdjcm9wLWNvbnRlbnQnKSxcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Xy5iaW5kQWxsKHRoaXMsICdvbkltYWdlTG9hZCcpO1xuXHR9LFxuXHRyZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb250cm9sbGVyLmZyYW1lLm9uKCdjb250ZW50OmVycm9yOmNyb3AnLCB0aGlzLm9uRXJyb3IsIHRoaXMpO1xuXHRcdHRoaXMuJGltYWdlID0gdGhpcy4kZWwuZmluZCgnLmNyb3AtaW1hZ2UnKTtcblx0XHR0aGlzLiRpbWFnZS5vbignbG9hZCcsIHRoaXMub25JbWFnZUxvYWQpO1xuXHRcdCQod2luZG93KS5vbigncmVzaXplLmNyb3BwZXInLCBfLmRlYm91bmNlKHRoaXMub25JbWFnZUxvYWQsIDI1MCkpO1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdCQod2luZG93KS5vZmYoJ3Jlc2l6ZS5jcm9wcGVyJyk7XG5cdFx0dGhpcy4kZWwucmVtb3ZlKCk7XG5cdFx0dGhpcy4kZWwub2ZmKCk7XG5cdFx0Vmlldy5wcm90b3R5cGUucmVtb3ZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdH0sXG5cdHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0aXRsZTogbDEwbi5jcm9wWW91ckltYWdlLFxuXHRcdFx0dXJsOiB0aGlzLm9wdGlvbnMuYXR0YWNobWVudC5nZXQoJ3VybCcpXG5cdFx0fTtcblx0fSxcblx0b25JbWFnZUxvYWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpbWdPcHRpb25zID0gdGhpcy5jb250cm9sbGVyLmdldCgnaW1nU2VsZWN0T3B0aW9ucycpO1xuXHRcdGlmICh0eXBlb2YgaW1nT3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aW1nT3B0aW9ucyA9IGltZ09wdGlvbnModGhpcy5vcHRpb25zLmF0dGFjaG1lbnQsIHRoaXMuY29udHJvbGxlcik7XG5cdFx0fVxuXG5cdFx0aW1nT3B0aW9ucyA9IF8uZXh0ZW5kKGltZ09wdGlvbnMsIHtwYXJlbnQ6IHRoaXMuJGVsfSk7XG5cdFx0dGhpcy50cmlnZ2VyKCdpbWFnZS1sb2FkZWQnKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIuaW1nU2VsZWN0ID0gdGhpcy4kaW1hZ2UuaW1nQXJlYVNlbGVjdChpbWdPcHRpb25zKTtcblx0fSxcblx0b25FcnJvcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZpbGVuYW1lID0gdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQuZ2V0KCdmaWxlbmFtZScpO1xuXG5cdFx0dGhpcy52aWV3cy5hZGQoICcudXBsb2FkLWVycm9ycycsIG5ldyB3cC5tZWRpYS52aWV3LlVwbG9hZGVyU3RhdHVzRXJyb3Ioe1xuXHRcdFx0ZmlsZW5hbWU6IFVwbG9hZGVyU3RhdHVzLnByb3RvdHlwZS5maWxlbmFtZShmaWxlbmFtZSksXG5cdFx0XHRtZXNzYWdlOiB3aW5kb3cuX3dwTWVkaWFWaWV3c0wxMG4uY3JvcEVycm9yXG5cdFx0fSksIHsgYXQ6IDAgfSk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENyb3BwZXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuRWRpdEltYWdlXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0RWRpdEltYWdlO1xuXG5FZGl0SW1hZ2UgPSBWaWV3LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2ltYWdlLWVkaXRvcicsXG5cdHRlbXBsYXRlOiB3cC50ZW1wbGF0ZSgnaW1hZ2UtZWRpdG9yJyksXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5lZGl0b3IgPSB3aW5kb3cuaW1hZ2VFZGl0O1xuXHRcdHRoaXMuY29udHJvbGxlciA9IG9wdGlvbnMuY29udHJvbGxlcjtcblx0XHRWaWV3LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRwcmVwYXJlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5tb2RlbC50b0pTT04oKTtcblx0fSxcblxuXHRsb2FkRWRpdG9yOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZGZkID0gdGhpcy5lZGl0b3Iub3BlbiggdGhpcy5tb2RlbC5nZXQoJ2lkJyksIHRoaXMubW9kZWwuZ2V0KCdub25jZXMnKS5lZGl0LCB0aGlzICk7XG5cdFx0ZGZkLmRvbmUoIF8uYmluZCggdGhpcy5mb2N1cywgdGhpcyApICk7XG5cdH0sXG5cblx0Zm9jdXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJCggJy5pbWdlZGl0LXN1Ym1pdCAuYnV0dG9uJyApLmVxKCAwICkuZm9jdXMoKTtcblx0fSxcblxuXHRiYWNrOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGFzdFN0YXRlID0gdGhpcy5jb250cm9sbGVyLmxhc3RTdGF0ZSgpO1xuXHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSggbGFzdFN0YXRlICk7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5tb2RlbC5mZXRjaCgpO1xuXHR9LFxuXG5cdHNhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsYXN0U3RhdGUgPSB0aGlzLmNvbnRyb2xsZXIubGFzdFN0YXRlKCk7XG5cblx0XHR0aGlzLm1vZGVsLmZldGNoKCkuZG9uZSggXy5iaW5kKCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSggbGFzdFN0YXRlICk7XG5cdFx0fSwgdGhpcyApICk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdEltYWdlO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkVtYmVkXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBFbWJlZCA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnbWVkaWEtZW1iZWQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIEBtZW1iZXIge3dwLm1lZGlhLnZpZXcuRW1iZWRVcmx9XG5cdFx0ICovXG5cdFx0dGhpcy51cmwgPSBuZXcgd3AubWVkaWEudmlldy5FbWJlZFVybCh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRtb2RlbDogICAgICB0aGlzLm1vZGVsLnByb3BzXG5cdFx0fSkucmVuZGVyKCk7XG5cblx0XHR0aGlzLnZpZXdzLnNldChbIHRoaXMudXJsIF0pO1xuXHRcdHRoaXMucmVmcmVzaCgpO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6dHlwZScsIHRoaXMucmVmcmVzaCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6bG9hZGluZycsIHRoaXMubG9hZGluZyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gdmlld1xuXHQgKi9cblx0c2V0dGluZ3M6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdGlmICggdGhpcy5fc2V0dGluZ3MgKSB7XG5cdFx0XHR0aGlzLl9zZXR0aW5ncy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0dGhpcy5fc2V0dGluZ3MgPSB2aWV3O1xuXHRcdHRoaXMudmlld3MuYWRkKCB2aWV3ICk7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHR5cGUgPSB0aGlzLm1vZGVsLmdldCgndHlwZScpLFxuXHRcdFx0Y29uc3RydWN0b3I7XG5cblx0XHRpZiAoICdpbWFnZScgPT09IHR5cGUgKSB7XG5cdFx0XHRjb25zdHJ1Y3RvciA9IHdwLm1lZGlhLnZpZXcuRW1iZWRJbWFnZTtcblx0XHR9IGVsc2UgaWYgKCAnbGluaycgPT09IHR5cGUgKSB7XG5cdFx0XHRjb25zdHJ1Y3RvciA9IHdwLm1lZGlhLnZpZXcuRW1iZWRMaW5rO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXR0aW5ncyggbmV3IGNvbnN0cnVjdG9yKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuY29udHJvbGxlcixcblx0XHRcdG1vZGVsOiAgICAgIHRoaXMubW9kZWwucHJvcHMsXG5cdFx0XHRwcmlvcml0eTogICA0MFxuXHRcdH0pICk7XG5cdH0sXG5cblx0bG9hZGluZzogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdlbWJlZC1sb2FkaW5nJywgdGhpcy5tb2RlbC5nZXQoJ2xvYWRpbmcnKSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWJlZDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5FbWJlZEltYWdlXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEF0dGFjaG1lbnREaXNwbGF5ID0gd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheSxcblx0RW1iZWRJbWFnZTtcblxuRW1iZWRJbWFnZSA9IEF0dGFjaG1lbnREaXNwbGF5LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2VtYmVkLW1lZGlhLXNldHRpbmdzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgnZW1iZWQtaW1hZ2Utc2V0dGluZ3MnKSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvKipcblx0XHQgKiBDYWxsIGBpbml0aWFsaXplYCBkaXJlY3RseSBvbiBwYXJlbnQgY2xhc3Mgd2l0aCBwYXNzZWQgYXJndW1lbnRzXG5cdFx0ICovXG5cdFx0QXR0YWNobWVudERpc3BsYXkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6dXJsJywgdGhpcy51cGRhdGVJbWFnZSApO1xuXHR9LFxuXG5cdHVwZGF0ZUltYWdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiQoJ2ltZycpLmF0dHIoICdzcmMnLCB0aGlzLm1vZGVsLmdldCgndXJsJykgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRW1iZWRJbWFnZTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5FbWJlZExpbmtcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlNldHRpbmdzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciAkID0galF1ZXJ5LFxuXHRFbWJlZExpbms7XG5cbkVtYmVkTGluayA9IHdwLm1lZGlhLnZpZXcuU2V0dGluZ3MuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnZW1iZWQtbGluay1zZXR0aW5ncycsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ2VtYmVkLWxpbmstc2V0dGluZ3MnKSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOnVybCcsIHRoaXMudXBkYXRlb0VtYmVkICk7XG5cdH0sXG5cblx0dXBkYXRlb0VtYmVkOiBfLmRlYm91bmNlKCBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy5tb2RlbC5nZXQoICd1cmwnICk7XG5cblx0XHQvLyBjbGVhciBvdXQgcHJldmlvdXMgcmVzdWx0c1xuXHRcdHRoaXMuJCgnLmVtYmVkLWNvbnRhaW5lcicpLmhpZGUoKS5maW5kKCcuZW1iZWQtcHJldmlldycpLmVtcHR5KCk7XG5cdFx0dGhpcy4kKCAnLnNldHRpbmcnICkuaGlkZSgpO1xuXG5cdFx0Ly8gb25seSBwcm9jZWVkIHdpdGggZW1iZWQgaWYgdGhlIGZpZWxkIGNvbnRhaW5zIG1vcmUgdGhhbiAxMSBjaGFyYWN0ZXJzXG5cdFx0Ly8gRXhhbXBsZTogaHR0cDovL2EuaW8gaXMgMTEgY2hhcnNcblx0XHRpZiAoIHVybCAmJiAoIHVybC5sZW5ndGggPCAxMSB8fCAhIHVybC5tYXRjaCgvXmh0dHAocyk/OlxcL1xcLy8pICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5mZXRjaCgpO1xuXHR9LCB3cC5tZWRpYS5jb250cm9sbGVyLkVtYmVkLnNlbnNpdGl2aXR5ICksXG5cblx0ZmV0Y2g6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbWJlZDtcblxuXHRcdC8vIGNoZWNrIGlmIHRoZXkgaGF2ZW4ndCB0eXBlZCBpbiA1MDAgbXNcblx0XHRpZiAoICQoJyNlbWJlZC11cmwtZmllbGQnKS52YWwoKSAhPT0gdGhpcy5tb2RlbC5nZXQoJ3VybCcpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5kZmQgJiYgJ3BlbmRpbmcnID09PSB0aGlzLmRmZC5zdGF0ZSgpICkge1xuXHRcdFx0dGhpcy5kZmQuYWJvcnQoKTtcblx0XHR9XG5cblx0XHRlbWJlZCA9IG5ldyB3cC5zaG9ydGNvZGUoe1xuXHRcdFx0dGFnOiAnZW1iZWQnLFxuXHRcdFx0YXR0cnM6IF8ucGljayggdGhpcy5tb2RlbC5hdHRyaWJ1dGVzLCBbICd3aWR0aCcsICdoZWlnaHQnLCAnc3JjJyBdICksXG5cdFx0XHRjb250ZW50OiB0aGlzLm1vZGVsLmdldCgndXJsJylcblx0XHR9KTtcblxuXHRcdHRoaXMuZGZkID0gJC5hamF4KHtcblx0XHRcdHR5cGU6ICAgICdQT1NUJyxcblx0XHRcdHVybDogICAgIHdwLmFqYXguc2V0dGluZ3MudXJsLFxuXHRcdFx0Y29udGV4dDogdGhpcyxcblx0XHRcdGRhdGE6ICAgIHtcblx0XHRcdFx0YWN0aW9uOiAncGFyc2UtZW1iZWQnLFxuXHRcdFx0XHRwb3N0X0lEOiB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuaWQsXG5cdFx0XHRcdHNob3J0Y29kZTogZW1iZWQuc3RyaW5nKClcblx0XHRcdH1cblx0XHR9KVxuXHRcdFx0LmRvbmUoIHRoaXMucmVuZGVyb0VtYmVkIClcblx0XHRcdC5mYWlsKCB0aGlzLnJlbmRlckZhaWwgKTtcblx0fSxcblxuXHRyZW5kZXJGYWlsOiBmdW5jdGlvbiAoIHJlc3BvbnNlLCBzdGF0dXMgKSB7XG5cdFx0aWYgKCAnYWJvcnQnID09PSBzdGF0dXMgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuJCggJy5saW5rLXRleHQnICkuc2hvdygpO1xuXHR9LFxuXG5cdHJlbmRlcm9FbWJlZDogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdHZhciBodG1sID0gKCByZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuYm9keSApIHx8ICcnO1xuXG5cdFx0aWYgKCBodG1sICkge1xuXHRcdFx0dGhpcy4kKCcuZW1iZWQtY29udGFpbmVyJykuc2hvdygpLmZpbmQoJy5lbWJlZC1wcmV2aWV3JykuaHRtbCggaHRtbCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnJlbmRlckZhaWwoKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtYmVkTGluaztcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5FbWJlZFVybFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdCQgPSBqUXVlcnksXG5cdEVtYmVkVXJsO1xuXG5FbWJlZFVybCA9IFZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnbGFiZWwnLFxuXHRjbGFzc05hbWU6ICdlbWJlZC11cmwnLFxuXG5cdGV2ZW50czoge1xuXHRcdCdpbnB1dCc6ICAndXJsJyxcblx0XHQna2V5dXAnOiAgJ3VybCcsXG5cdFx0J2NoYW5nZSc6ICd1cmwnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kaW5wdXQgPSAkKCc8aW5wdXQgaWQ9XCJlbWJlZC11cmwtZmllbGRcIiB0eXBlPVwidXJsXCIgLz4nKS52YWwoIHRoaXMubW9kZWwuZ2V0KCd1cmwnKSApO1xuXHRcdHRoaXMuaW5wdXQgPSB0aGlzLiRpbnB1dFswXTtcblxuXHRcdHRoaXMuc3Bpbm5lciA9ICQoJzxzcGFuIGNsYXNzPVwic3Bpbm5lclwiIC8+JylbMF07XG5cdFx0dGhpcy4kZWwuYXBwZW5kKFsgdGhpcy5pbnB1dCwgdGhpcy5zcGlubmVyIF0pO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZTp1cmwnLCB0aGlzLnJlbmRlciApO1xuXG5cdFx0aWYgKCB0aGlzLm1vZGVsLmdldCggJ3VybCcgKSApIHtcblx0XHRcdF8uZGVsYXkoIF8uYmluZCggZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR0aGlzLm1vZGVsLnRyaWdnZXIoICdjaGFuZ2U6dXJsJyApO1xuXHRcdFx0fSwgdGhpcyApLCA1MDAgKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5FbWJlZFVybH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRpbnB1dCA9IHRoaXMuJGlucHV0O1xuXG5cdFx0aWYgKCAkaW5wdXQuaXMoJzpmb2N1cycpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuaW5wdXQudmFsdWUgPSB0aGlzLm1vZGVsLmdldCgndXJsJykgfHwgJ2h0dHA6Ly8nO1xuXHRcdC8qKlxuXHRcdCAqIENhbGwgYHJlbmRlcmAgZGlyZWN0bHkgb24gcGFyZW50IGNsYXNzIHdpdGggcGFzc2VkIGFyZ3VtZW50c1xuXHRcdCAqL1xuXHRcdFZpZXcucHJvdG90eXBlLnJlbmRlci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISB3cC5tZWRpYS5pc1RvdWNoRGV2aWNlICkge1xuXHRcdFx0dGhpcy5mb2N1cygpO1xuXHRcdH1cblx0fSxcblxuXHR1cmw6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR0aGlzLm1vZGVsLnNldCggJ3VybCcsIGV2ZW50LnRhcmdldC52YWx1ZSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBJZiB0aGUgaW5wdXQgaXMgdmlzaWJsZSwgZm9jdXMgYW5kIHNlbGVjdCBpdHMgY29udGVudHMuXG5cdCAqL1xuXHRmb2N1czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRpbnB1dCA9IHRoaXMuJGlucHV0O1xuXHRcdGlmICggJGlucHV0LmlzKCc6dmlzaWJsZScpICkge1xuXHRcdFx0JGlucHV0LmZvY3VzKClbMF0uc2VsZWN0KCk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWJlZFVybDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5Gb2N1c01hbmFnZXJcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEZvY3VzTWFuYWdlciA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblxuXHRldmVudHM6IHtcblx0XHQna2V5ZG93bic6ICdjb25zdHJhaW5UYWJiaW5nJ1xuXHR9LFxuXG5cdGZvY3VzOiBmdW5jdGlvbigpIHsgLy8gUmVzZXQgZm9jdXMgb24gZmlyc3QgbGVmdCBtZW51IGl0ZW1cblx0XHR0aGlzLiQoJy5tZWRpYS1tZW51LWl0ZW0nKS5maXJzdCgpLmZvY3VzKCk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdGNvbnN0cmFpblRhYmJpbmc6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgdGFiYmFibGVzO1xuXG5cdFx0Ly8gTG9vayBmb3IgdGhlIHRhYiBrZXkuXG5cdFx0aWYgKCA5ICE9PSBldmVudC5rZXlDb2RlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFNraXAgdGhlIGZpbGUgaW5wdXQgYWRkZWQgYnkgUGx1cGxvYWQuXG5cdFx0dGFiYmFibGVzID0gdGhpcy4kKCAnOnRhYmJhYmxlJyApLm5vdCggJy5tb3hpZS1zaGltIGlucHV0W3R5cGU9XCJmaWxlXCJdJyApO1xuXG5cdFx0Ly8gS2VlcCB0YWIgZm9jdXMgd2l0aGluIG1lZGlhIG1vZGFsIHdoaWxlIGl0J3Mgb3BlblxuXHRcdGlmICggdGFiYmFibGVzLmxhc3QoKVswXSA9PT0gZXZlbnQudGFyZ2V0ICYmICEgZXZlbnQuc2hpZnRLZXkgKSB7XG5cdFx0XHR0YWJiYWJsZXMuZmlyc3QoKS5mb2N1cygpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gZWxzZSBpZiAoIHRhYmJhYmxlcy5maXJzdCgpWzBdID09PSBldmVudC50YXJnZXQgJiYgZXZlbnQuc2hpZnRLZXkgKSB7XG5cdFx0XHR0YWJiYWJsZXMubGFzdCgpLmZvY3VzKCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvY3VzTWFuYWdlcjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5GcmFtZVxuICpcbiAqIEEgZnJhbWUgaXMgYSBjb21wb3NpdGUgdmlldyBjb25zaXN0aW5nIG9mIG9uZSBvciBtb3JlIHJlZ2lvbnMgYW5kIG9uZSBvciBtb3JlXG4gKiBzdGF0ZXMuXG4gKlxuICogQHNlZSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAc2VlIHdwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKiBAbWl4ZXMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmVcbiAqL1xudmFyIEZyYW1lID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdG1vZGU6IFsgJ3NlbGVjdCcgXVxuXHRcdH0pO1xuXHRcdHRoaXMuX2NyZWF0ZVJlZ2lvbnMoKTtcblx0XHR0aGlzLl9jcmVhdGVTdGF0ZXMoKTtcblx0XHR0aGlzLl9jcmVhdGVNb2RlcygpO1xuXHR9LFxuXG5cdF9jcmVhdGVSZWdpb25zOiBmdW5jdGlvbigpIHtcblx0XHQvLyBDbG9uZSB0aGUgcmVnaW9ucyBhcnJheS5cblx0XHR0aGlzLnJlZ2lvbnMgPSB0aGlzLnJlZ2lvbnMgPyB0aGlzLnJlZ2lvbnMuc2xpY2UoKSA6IFtdO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSByZWdpb25zLlxuXHRcdF8uZWFjaCggdGhpcy5yZWdpb25zLCBmdW5jdGlvbiggcmVnaW9uICkge1xuXHRcdFx0dGhpc1sgcmVnaW9uIF0gPSBuZXcgd3AubWVkaWEuY29udHJvbGxlci5SZWdpb24oe1xuXHRcdFx0XHR2aWV3OiAgICAgdGhpcyxcblx0XHRcdFx0aWQ6ICAgICAgIHJlZ2lvbixcblx0XHRcdFx0c2VsZWN0b3I6ICcubWVkaWEtZnJhbWUtJyArIHJlZ2lvblxuXHRcdFx0fSk7XG5cdFx0fSwgdGhpcyApO1xuXHR9LFxuXHQvKipcblx0ICogQ3JlYXRlIHRoZSBmcmFtZSdzIHN0YXRlcy5cblx0ICpcblx0ICogQHNlZSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG5cdCAqIEBzZWUgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmVcblx0ICpcblx0ICogQGZpcmVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUjcmVhZHlcblx0ICovXG5cdF9jcmVhdGVTdGF0ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIENyZWF0ZSB0aGUgZGVmYXVsdCBgc3RhdGVzYCBjb2xsZWN0aW9uLlxuXHRcdHRoaXMuc3RhdGVzID0gbmV3IEJhY2tib25lLkNvbGxlY3Rpb24oIG51bGwsIHtcblx0XHRcdG1vZGVsOiB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG5cdFx0fSk7XG5cblx0XHQvLyBFbnN1cmUgc3RhdGVzIGhhdmUgYSByZWZlcmVuY2UgdG8gdGhlIGZyYW1lLlxuXHRcdHRoaXMuc3RhdGVzLm9uKCAnYWRkJywgZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdFx0bW9kZWwuZnJhbWUgPSB0aGlzO1xuXHRcdFx0bW9kZWwudHJpZ2dlcigncmVhZHknKTtcblx0XHR9LCB0aGlzICk7XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5zdGF0ZXMgKSB7XG5cdFx0XHR0aGlzLnN0YXRlcy5hZGQoIHRoaXMub3B0aW9ucy5zdGF0ZXMgKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgZnJhbWUgY2FuIGJlIGluIGEgbW9kZSBvciBtdWx0aXBsZSBtb2RlcyBhdCBvbmUgdGltZS5cblx0ICpcblx0ICogRm9yIGV4YW1wbGUsIHRoZSBtYW5hZ2UgbWVkaWEgZnJhbWUgY2FuIGJlIGluIHRoZSBgQnVsayBTZWxlY3RgIG9yIGBFZGl0YCBtb2RlLlxuXHQgKi9cblx0X2NyZWF0ZU1vZGVzOiBmdW5jdGlvbigpIHtcblx0XHQvLyBTdG9yZSBhY3RpdmUgXCJtb2Rlc1wiIHRoYXQgdGhlIGZyYW1lIGlzIGluLiBVbnJlbGF0ZWQgdG8gcmVnaW9uIG1vZGVzLlxuXHRcdHRoaXMuYWN0aXZlTW9kZXMgPSBuZXcgQmFja2JvbmUuQ29sbGVjdGlvbigpO1xuXHRcdHRoaXMuYWN0aXZlTW9kZXMub24oICdhZGQgcmVtb3ZlIHJlc2V0JywgXy5iaW5kKCB0aGlzLnRyaWdnZXJNb2RlRXZlbnRzLCB0aGlzICkgKTtcblxuXHRcdF8uZWFjaCggdGhpcy5vcHRpb25zLm1vZGUsIGZ1bmN0aW9uKCBtb2RlICkge1xuXHRcdFx0dGhpcy5hY3RpdmF0ZU1vZGUoIG1vZGUgKTtcblx0XHR9LCB0aGlzICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBSZXNldCBhbGwgc3RhdGVzIG9uIHRoZSBmcmFtZSB0byB0aGVpciBkZWZhdWx0cy5cblx0ICpcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuRnJhbWV9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZXNldDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zdGF0ZXMuaW52b2tlKCAndHJpZ2dlcicsICdyZXNldCcgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIE1hcCBhY3RpdmVNb2RlIGNvbGxlY3Rpb24gZXZlbnRzIHRvIHRoZSBmcmFtZS5cblx0ICovXG5cdHRyaWdnZXJNb2RlRXZlbnRzOiBmdW5jdGlvbiggbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMgKSB7XG5cdFx0dmFyIGNvbGxlY3Rpb25FdmVudCxcblx0XHRcdG1vZGVFdmVudE1hcCA9IHtcblx0XHRcdFx0YWRkOiAnYWN0aXZhdGUnLFxuXHRcdFx0XHRyZW1vdmU6ICdkZWFjdGl2YXRlJ1xuXHRcdFx0fSxcblx0XHRcdGV2ZW50VG9UcmlnZ2VyO1xuXHRcdC8vIFByb2JhYmx5IGEgYmV0dGVyIHdheSB0byBkbyB0aGlzLlxuXHRcdF8uZWFjaCggb3B0aW9ucywgZnVuY3Rpb24oIHZhbHVlLCBrZXkgKSB7XG5cdFx0XHRpZiAoIHZhbHVlICkge1xuXHRcdFx0XHRjb2xsZWN0aW9uRXZlbnQgPSBrZXk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0aWYgKCAhIF8uaGFzKCBtb2RlRXZlbnRNYXAsIGNvbGxlY3Rpb25FdmVudCApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGV2ZW50VG9UcmlnZ2VyID0gbW9kZWwuZ2V0KCdpZCcpICsgJzonICsgbW9kZUV2ZW50TWFwW2NvbGxlY3Rpb25FdmVudF07XG5cdFx0dGhpcy50cmlnZ2VyKCBldmVudFRvVHJpZ2dlciApO1xuXHR9LFxuXHQvKipcblx0ICogQWN0aXZhdGUgYSBtb2RlIG9uIHRoZSBmcmFtZS5cblx0ICpcblx0ICogQHBhcmFtIHN0cmluZyBtb2RlIE1vZGUgSUQuXG5cdCAqIEByZXR1cm5zIHt0aGlzfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZy5cblx0ICovXG5cdGFjdGl2YXRlTW9kZTogZnVuY3Rpb24oIG1vZGUgKSB7XG5cdFx0Ly8gQmFpbCBpZiB0aGUgbW9kZSBpcyBhbHJlYWR5IGFjdGl2ZS5cblx0XHRpZiAoIHRoaXMuaXNNb2RlQWN0aXZlKCBtb2RlICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuYWN0aXZlTW9kZXMuYWRkKCBbIHsgaWQ6IG1vZGUgfSBdICk7XG5cdFx0Ly8gQWRkIGEgQ1NTIGNsYXNzIHRvIHRoZSBmcmFtZSBzbyBlbGVtZW50cyBjYW4gYmUgc3R5bGVkIGZvciB0aGUgbW9kZS5cblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ21vZGUtJyArIG1vZGUgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogRGVhY3RpdmF0ZSBhIG1vZGUgb24gdGhlIGZyYW1lLlxuXHQgKlxuXHQgKiBAcGFyYW0gc3RyaW5nIG1vZGUgTW9kZSBJRC5cblx0ICogQHJldHVybnMge3RoaXN9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nLlxuXHQgKi9cblx0ZGVhY3RpdmF0ZU1vZGU6IGZ1bmN0aW9uKCBtb2RlICkge1xuXHRcdC8vIEJhaWwgaWYgdGhlIG1vZGUgaXNuJ3QgYWN0aXZlLlxuXHRcdGlmICggISB0aGlzLmlzTW9kZUFjdGl2ZSggbW9kZSApICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdHRoaXMuYWN0aXZlTW9kZXMucmVtb3ZlKCB0aGlzLmFjdGl2ZU1vZGVzLndoZXJlKCB7IGlkOiBtb2RlIH0gKSApO1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnbW9kZS0nICsgbW9kZSApO1xuXHRcdC8qKlxuXHRcdCAqIEZyYW1lIG1vZGUgZGVhY3RpdmF0aW9uIGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IHRoaXMje21vZGV9OmRlYWN0aXZhdGVcblx0XHQgKi9cblx0XHR0aGlzLnRyaWdnZXIoIG1vZGUgKyAnOmRlYWN0aXZhdGUnICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIENoZWNrIGlmIGEgbW9kZSBpcyBlbmFibGVkIG9uIHRoZSBmcmFtZS5cblx0ICpcblx0ICogQHBhcmFtICBzdHJpbmcgbW9kZSBNb2RlIElELlxuXHQgKiBAcmV0dXJuIGJvb2xcblx0ICovXG5cdGlzTW9kZUFjdGl2ZTogZnVuY3Rpb24oIG1vZGUgKSB7XG5cdFx0cmV0dXJuIEJvb2xlYW4oIHRoaXMuYWN0aXZlTW9kZXMud2hlcmUoIHsgaWQ6IG1vZGUgfSApLmxlbmd0aCApO1xuXHR9XG59KTtcblxuLy8gTWFrZSB0aGUgYEZyYW1lYCBhIGBTdGF0ZU1hY2hpbmVgLlxuXy5leHRlbmQoIEZyYW1lLnByb3RvdHlwZSwgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmUucHJvdG90eXBlICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWU7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5JbWFnZURldGFpbHNcbiAqXG4gKiBBIG1lZGlhIGZyYW1lIGZvciBtYW5pcHVsYXRpbmcgYW4gaW1hZ2UgdGhhdCdzIGFscmVhZHkgYmVlbiBpbnNlcnRlZFxuICogaW50byBhIHBvc3QuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLlNlbGVjdFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuRnJhbWVcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqIEBtaXhlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlTWFjaGluZVxuICovXG52YXIgU2VsZWN0ID0gd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLlNlbGVjdCxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0SW1hZ2VEZXRhaWxzO1xuXG5JbWFnZURldGFpbHMgPSBTZWxlY3QuZXh0ZW5kKHtcblx0ZGVmYXVsdHM6IHtcblx0XHRpZDogICAgICAnaW1hZ2UnLFxuXHRcdHVybDogICAgICcnLFxuXHRcdG1lbnU6ICAgICdpbWFnZS1kZXRhaWxzJyxcblx0XHRjb250ZW50OiAnaW1hZ2UtZGV0YWlscycsXG5cdFx0dG9vbGJhcjogJ2ltYWdlLWRldGFpbHMnLFxuXHRcdHR5cGU6ICAgICdsaW5rJyxcblx0XHR0aXRsZTogICAgbDEwbi5pbWFnZURldGFpbHNUaXRsZSxcblx0XHRwcmlvcml0eTogMTIwXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5pbWFnZSA9IG5ldyB3cC5tZWRpYS5tb2RlbC5Qb3N0SW1hZ2UoIG9wdGlvbnMubWV0YWRhdGEgKTtcblx0XHR0aGlzLm9wdGlvbnMuc2VsZWN0aW9uID0gbmV3IHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbiggdGhpcy5pbWFnZS5hdHRhY2htZW50LCB7IG11bHRpcGxlOiBmYWxzZSB9ICk7XG5cdFx0U2VsZWN0LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRiaW5kSGFuZGxlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdFNlbGVjdC5wcm90b3R5cGUuYmluZEhhbmRsZXJzLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR0aGlzLm9uKCAnbWVudTpjcmVhdGU6aW1hZ2UtZGV0YWlscycsIHRoaXMuY3JlYXRlTWVudSwgdGhpcyApO1xuXHRcdHRoaXMub24oICdjb250ZW50OmNyZWF0ZTppbWFnZS1kZXRhaWxzJywgdGhpcy5pbWFnZURldGFpbHNDb250ZW50LCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NvbnRlbnQ6cmVuZGVyOmVkaXQtaW1hZ2UnLCB0aGlzLmVkaXRJbWFnZUNvbnRlbnQsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpyZW5kZXI6aW1hZ2UtZGV0YWlscycsIHRoaXMucmVuZGVySW1hZ2VEZXRhaWxzVG9vbGJhciwgdGhpcyApO1xuXHRcdC8vIG92ZXJyaWRlIHRoZSBzZWxlY3QgdG9vbGJhclxuXHRcdHRoaXMub24oICd0b29sYmFyOnJlbmRlcjpyZXBsYWNlJywgdGhpcy5yZW5kZXJSZXBsYWNlSW1hZ2VUb29sYmFyLCB0aGlzICk7XG5cdH0sXG5cblx0Y3JlYXRlU3RhdGVzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnN0YXRlcy5hZGQoW1xuXHRcdFx0bmV3IHdwLm1lZGlhLmNvbnRyb2xsZXIuSW1hZ2VEZXRhaWxzKHtcblx0XHRcdFx0aW1hZ2U6IHRoaXMuaW1hZ2UsXG5cdFx0XHRcdGVkaXRhYmxlOiBmYWxzZVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5SZXBsYWNlSW1hZ2Uoe1xuXHRcdFx0XHRpZDogJ3JlcGxhY2UtaW1hZ2UnLFxuXHRcdFx0XHRsaWJyYXJ5OiB3cC5tZWRpYS5xdWVyeSggeyB0eXBlOiAnaW1hZ2UnIH0gKSxcblx0XHRcdFx0aW1hZ2U6IHRoaXMuaW1hZ2UsXG5cdFx0XHRcdG11bHRpcGxlOiAgZmFsc2UsXG5cdFx0XHRcdHRpdGxlOiAgICAgbDEwbi5pbWFnZVJlcGxhY2VUaXRsZSxcblx0XHRcdFx0dG9vbGJhcjogJ3JlcGxhY2UnLFxuXHRcdFx0XHRwcmlvcml0eTogIDgwLFxuXHRcdFx0XHRkaXNwbGF5U2V0dGluZ3M6IHRydWVcblx0XHRcdH0pLFxuXHRcdFx0bmV3IHdwLm1lZGlhLmNvbnRyb2xsZXIuRWRpdEltYWdlKCB7XG5cdFx0XHRcdGltYWdlOiB0aGlzLmltYWdlLFxuXHRcdFx0XHRzZWxlY3Rpb246IHRoaXMub3B0aW9ucy5zZWxlY3Rpb25cblx0XHRcdH0gKVxuXHRcdF0pO1xuXHR9LFxuXG5cdGltYWdlRGV0YWlsc0NvbnRlbnQ6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdG9wdGlvbnMudmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LkltYWdlRGV0YWlscyh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0bW9kZWw6IHRoaXMuc3RhdGUoKS5pbWFnZSxcblx0XHRcdGF0dGFjaG1lbnQ6IHRoaXMuc3RhdGUoKS5pbWFnZS5hdHRhY2htZW50XG5cdFx0fSk7XG5cdH0sXG5cblx0ZWRpdEltYWdlQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHN0YXRlID0gdGhpcy5zdGF0ZSgpLFxuXHRcdFx0bW9kZWwgPSBzdGF0ZS5nZXQoJ2ltYWdlJyksXG5cdFx0XHR2aWV3O1xuXG5cdFx0aWYgKCAhIG1vZGVsICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5FZGl0SW1hZ2UoIHsgbW9kZWw6IG1vZGVsLCBjb250cm9sbGVyOiB0aGlzIH0gKS5yZW5kZXIoKTtcblxuXHRcdHRoaXMuY29udGVudC5zZXQoIHZpZXcgKTtcblxuXHRcdC8vIGFmdGVyIGJyaW5naW5nIGluIHRoZSBmcmFtZSwgbG9hZCB0aGUgYWN0dWFsIGVkaXRvciB2aWEgYW4gYWpheCBjYWxsXG5cdFx0dmlldy5sb2FkRWRpdG9yKCk7XG5cblx0fSxcblxuXHRyZW5kZXJJbWFnZURldGFpbHNUb29sYmFyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRvb2xiYXIuc2V0KCBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRpdGVtczoge1xuXHRcdFx0XHRzZWxlY3Q6IHtcblx0XHRcdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0XHRcdHRleHQ6ICAgICBsMTBuLnVwZGF0ZSxcblx0XHRcdFx0XHRwcmlvcml0eTogODAsXG5cblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgY29udHJvbGxlciA9IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRcdFx0c3RhdGUgPSBjb250cm9sbGVyLnN0YXRlKCk7XG5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblxuXHRcdFx0XHRcdFx0Ly8gbm90IHN1cmUgaWYgd2Ugd2FudCB0byB1c2Ugd3AubWVkaWEuc3RyaW5nLmltYWdlIHdoaWNoIHdpbGwgY3JlYXRlIGEgc2hvcnRjb2RlIG9yXG5cdFx0XHRcdFx0XHQvLyBwZXJoYXBzIHdwLmh0bWwuc3RyaW5nIHRvIGF0IGxlYXN0IHRvIGJ1aWxkIHRoZSA8aW1nIC8+XG5cdFx0XHRcdFx0XHRzdGF0ZS50cmlnZ2VyKCAndXBkYXRlJywgY29udHJvbGxlci5pbWFnZS50b0pTT04oKSApO1xuXG5cdFx0XHRcdFx0XHQvLyBSZXN0b3JlIGFuZCByZXNldCB0aGUgZGVmYXVsdCBzdGF0ZS5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuc2V0U3RhdGUoIGNvbnRyb2xsZXIub3B0aW9ucy5zdGF0ZSApO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5yZXNldCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH0sXG5cblx0cmVuZGVyUmVwbGFjZUltYWdlVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZyYW1lID0gdGhpcyxcblx0XHRcdGxhc3RTdGF0ZSA9IGZyYW1lLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkO1xuXG5cdFx0dGhpcy50b29sYmFyLnNldCggbmV3IHdwLm1lZGlhLnZpZXcuVG9vbGJhcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0aXRlbXM6IHtcblx0XHRcdFx0YmFjazoge1xuXHRcdFx0XHRcdHRleHQ6ICAgICBsMTBuLmJhY2ssXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDIwLFxuXHRcdFx0XHRcdGNsaWNrOiAgICBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGlmICggcHJldmlvdXMgKSB7XG5cdFx0XHRcdFx0XHRcdGZyYW1lLnNldFN0YXRlKCBwcmV2aW91cyApO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZnJhbWUuY2xvc2UoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0cmVwbGFjZToge1xuXHRcdFx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRcdFx0dGV4dDogICAgIGwxMG4ucmVwbGFjZSxcblx0XHRcdFx0XHRwcmlvcml0eTogODAsXG5cblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgY29udHJvbGxlciA9IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRcdFx0c3RhdGUgPSBjb250cm9sbGVyLnN0YXRlKCksXG5cdFx0XHRcdFx0XHRcdHNlbGVjdGlvbiA9IHN0YXRlLmdldCggJ3NlbGVjdGlvbicgKSxcblx0XHRcdFx0XHRcdFx0YXR0YWNobWVudCA9IHNlbGVjdGlvbi5zaW5nbGUoKTtcblxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLmltYWdlLmNoYW5nZUF0dGFjaG1lbnQoIGF0dGFjaG1lbnQsIHN0YXRlLmRpc3BsYXkoIGF0dGFjaG1lbnQgKSApO1xuXG5cdFx0XHRcdFx0XHQvLyBub3Qgc3VyZSBpZiB3ZSB3YW50IHRvIHVzZSB3cC5tZWRpYS5zdHJpbmcuaW1hZ2Ugd2hpY2ggd2lsbCBjcmVhdGUgYSBzaG9ydGNvZGUgb3Jcblx0XHRcdFx0XHRcdC8vIHBlcmhhcHMgd3AuaHRtbC5zdHJpbmcgdG8gYXQgbGVhc3QgdG8gYnVpbGQgdGhlIDxpbWcgLz5cblx0XHRcdFx0XHRcdHN0YXRlLnRyaWdnZXIoICdyZXBsYWNlJywgY29udHJvbGxlci5pbWFnZS50b0pTT04oKSApO1xuXG5cdFx0XHRcdFx0XHQvLyBSZXN0b3JlIGFuZCByZXNldCB0aGUgZGVmYXVsdCBzdGF0ZS5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuc2V0U3RhdGUoIGNvbnRyb2xsZXIub3B0aW9ucy5zdGF0ZSApO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5yZXNldCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VEZXRhaWxzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuUG9zdFxuICpcbiAqIFRoZSBmcmFtZSBmb3IgbWFuaXB1bGF0aW5nIG1lZGlhIG9uIHRoZSBFZGl0IFBvc3QgcGFnZS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuU2VsZWN0XG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5GcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICogQG1peGVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lXG4gKi9cbnZhciBTZWxlY3QgPSB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuU2VsZWN0LFxuXHRMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRQb3N0O1xuXG5Qb3N0ID0gU2VsZWN0LmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY291bnRzID0ge1xuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0Y291bnQ6IHdwLm1lZGlhLnZpZXcuc2V0dGluZ3MuYXR0YWNobWVudENvdW50cy5hdWRpbyxcblx0XHRcdFx0c3RhdGU6ICdwbGF5bGlzdCdcblx0XHRcdH0sXG5cdFx0XHR2aWRlbzoge1xuXHRcdFx0XHRjb3VudDogd3AubWVkaWEudmlldy5zZXR0aW5ncy5hdHRhY2htZW50Q291bnRzLnZpZGVvLFxuXHRcdFx0XHRzdGF0ZTogJ3ZpZGVvLXBsYXlsaXN0J1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdG11bHRpcGxlOiAgdHJ1ZSxcblx0XHRcdGVkaXRpbmc6ICAgZmFsc2UsXG5cdFx0XHRzdGF0ZTogICAgJ2luc2VydCcsXG5cdFx0XHRtZXRhZGF0YTogIHt9XG5cdFx0fSk7XG5cblx0XHQvLyBDYWxsICdpbml0aWFsaXplJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzLlxuXHRcdFNlbGVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy5jcmVhdGVJZnJhbWVTdGF0ZXMoKTtcblxuXHR9LFxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgdGhlIGRlZmF1bHQgc3RhdGVzLlxuXHQgKi9cblx0Y3JlYXRlU3RhdGVzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdHRoaXMuc3RhdGVzLmFkZChbXG5cdFx0XHQvLyBNYWluIHN0YXRlcy5cblx0XHRcdG5ldyBMaWJyYXJ5KHtcblx0XHRcdFx0aWQ6ICAgICAgICAgJ2luc2VydCcsXG5cdFx0XHRcdHRpdGxlOiAgICAgIGwxMG4uaW5zZXJ0TWVkaWFUaXRsZSxcblx0XHRcdFx0cHJpb3JpdHk6ICAgMjAsXG5cdFx0XHRcdHRvb2xiYXI6ICAgICdtYWluLWluc2VydCcsXG5cdFx0XHRcdGZpbHRlcmFibGU6ICdhbGwnLFxuXHRcdFx0XHRsaWJyYXJ5OiAgICB3cC5tZWRpYS5xdWVyeSggb3B0aW9ucy5saWJyYXJ5ICksXG5cdFx0XHRcdG11bHRpcGxlOiAgIG9wdGlvbnMubXVsdGlwbGUgPyAncmVzZXQnIDogZmFsc2UsXG5cdFx0XHRcdGVkaXRhYmxlOiAgIHRydWUsXG5cblx0XHRcdFx0Ly8gSWYgdGhlIHVzZXIgaXNuJ3QgYWxsb3dlZCB0byBlZGl0IGZpZWxkcyxcblx0XHRcdFx0Ly8gY2FuIHRoZXkgc3RpbGwgZWRpdCBpdCBsb2NhbGx5P1xuXHRcdFx0XHRhbGxvd0xvY2FsRWRpdHM6IHRydWUsXG5cblx0XHRcdFx0Ly8gU2hvdyB0aGUgYXR0YWNobWVudCBkaXNwbGF5IHNldHRpbmdzLlxuXHRcdFx0XHRkaXNwbGF5U2V0dGluZ3M6IHRydWUsXG5cdFx0XHRcdC8vIFVwZGF0ZSB1c2VyIHNldHRpbmdzIHdoZW4gdXNlcnMgYWRqdXN0IHRoZVxuXHRcdFx0XHQvLyBhdHRhY2htZW50IGRpc3BsYXkgc2V0dGluZ3MuXG5cdFx0XHRcdGRpc3BsYXlVc2VyU2V0dGluZ3M6IHRydWVcblx0XHRcdH0pLFxuXG5cdFx0XHRuZXcgTGlicmFyeSh7XG5cdFx0XHRcdGlkOiAgICAgICAgICdnYWxsZXJ5Jyxcblx0XHRcdFx0dGl0bGU6ICAgICAgbDEwbi5jcmVhdGVHYWxsZXJ5VGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAgIDQwLFxuXHRcdFx0XHR0b29sYmFyOiAgICAnbWFpbi1nYWxsZXJ5Jyxcblx0XHRcdFx0ZmlsdGVyYWJsZTogJ3VwbG9hZGVkJyxcblx0XHRcdFx0bXVsdGlwbGU6ICAgJ2FkZCcsXG5cdFx0XHRcdGVkaXRhYmxlOiAgIGZhbHNlLFxuXG5cdFx0XHRcdGxpYnJhcnk6ICB3cC5tZWRpYS5xdWVyeSggXy5kZWZhdWx0cyh7XG5cdFx0XHRcdFx0dHlwZTogJ2ltYWdlJ1xuXHRcdFx0XHR9LCBvcHRpb25zLmxpYnJhcnkgKSApXG5cdFx0XHR9KSxcblxuXHRcdFx0Ly8gRW1iZWQgc3RhdGVzLlxuXHRcdFx0bmV3IHdwLm1lZGlhLmNvbnRyb2xsZXIuRW1iZWQoIHsgbWV0YWRhdGE6IG9wdGlvbnMubWV0YWRhdGEgfSApLFxuXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5FZGl0SW1hZ2UoIHsgbW9kZWw6IG9wdGlvbnMuZWRpdEltYWdlIH0gKSxcblxuXHRcdFx0Ly8gR2FsbGVyeSBzdGF0ZXMuXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5HYWxsZXJ5RWRpdCh7XG5cdFx0XHRcdGxpYnJhcnk6IG9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0XHRlZGl0aW5nOiBvcHRpb25zLmVkaXRpbmcsXG5cdFx0XHRcdG1lbnU6ICAgICdnYWxsZXJ5J1xuXHRcdFx0fSksXG5cblx0XHRcdG5ldyB3cC5tZWRpYS5jb250cm9sbGVyLkdhbGxlcnlBZGQoKSxcblxuXHRcdFx0bmV3IExpYnJhcnkoe1xuXHRcdFx0XHRpZDogICAgICAgICAncGxheWxpc3QnLFxuXHRcdFx0XHR0aXRsZTogICAgICBsMTBuLmNyZWF0ZVBsYXlsaXN0VGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAgIDYwLFxuXHRcdFx0XHR0b29sYmFyOiAgICAnbWFpbi1wbGF5bGlzdCcsXG5cdFx0XHRcdGZpbHRlcmFibGU6ICd1cGxvYWRlZCcsXG5cdFx0XHRcdG11bHRpcGxlOiAgICdhZGQnLFxuXHRcdFx0XHRlZGl0YWJsZTogICBmYWxzZSxcblxuXHRcdFx0XHRsaWJyYXJ5OiAgd3AubWVkaWEucXVlcnkoIF8uZGVmYXVsdHMoe1xuXHRcdFx0XHRcdHR5cGU6ICdhdWRpbydcblx0XHRcdFx0fSwgb3B0aW9ucy5saWJyYXJ5ICkgKVxuXHRcdFx0fSksXG5cblx0XHRcdC8vIFBsYXlsaXN0IHN0YXRlcy5cblx0XHRcdG5ldyB3cC5tZWRpYS5jb250cm9sbGVyLkNvbGxlY3Rpb25FZGl0KHtcblx0XHRcdFx0dHlwZTogJ2F1ZGlvJyxcblx0XHRcdFx0Y29sbGVjdGlvblR5cGU6ICdwbGF5bGlzdCcsXG5cdFx0XHRcdHRpdGxlOiAgICAgICAgICBsMTBuLmVkaXRQbGF5bGlzdFRpdGxlLFxuXHRcdFx0XHRTZXR0aW5nc1ZpZXc6ICAgd3AubWVkaWEudmlldy5TZXR0aW5ncy5QbGF5bGlzdCxcblx0XHRcdFx0bGlicmFyeTogICAgICAgIG9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0XHRlZGl0aW5nOiAgICAgICAgb3B0aW9ucy5lZGl0aW5nLFxuXHRcdFx0XHRtZW51OiAgICAgICAgICAgJ3BsYXlsaXN0Jyxcblx0XHRcdFx0ZHJhZ0luZm9UZXh0OiAgIGwxMG4ucGxheWxpc3REcmFnSW5mbyxcblx0XHRcdFx0ZHJhZ0luZm86ICAgICAgIGZhbHNlXG5cdFx0XHR9KSxcblxuXHRcdFx0bmV3IHdwLm1lZGlhLmNvbnRyb2xsZXIuQ29sbGVjdGlvbkFkZCh7XG5cdFx0XHRcdHR5cGU6ICdhdWRpbycsXG5cdFx0XHRcdGNvbGxlY3Rpb25UeXBlOiAncGxheWxpc3QnLFxuXHRcdFx0XHR0aXRsZTogbDEwbi5hZGRUb1BsYXlsaXN0VGl0bGVcblx0XHRcdH0pLFxuXG5cdFx0XHRuZXcgTGlicmFyeSh7XG5cdFx0XHRcdGlkOiAgICAgICAgICd2aWRlby1wbGF5bGlzdCcsXG5cdFx0XHRcdHRpdGxlOiAgICAgIGwxMG4uY3JlYXRlVmlkZW9QbGF5bGlzdFRpdGxlLFxuXHRcdFx0XHRwcmlvcml0eTogICA2MCxcblx0XHRcdFx0dG9vbGJhcjogICAgJ21haW4tdmlkZW8tcGxheWxpc3QnLFxuXHRcdFx0XHRmaWx0ZXJhYmxlOiAndXBsb2FkZWQnLFxuXHRcdFx0XHRtdWx0aXBsZTogICAnYWRkJyxcblx0XHRcdFx0ZWRpdGFibGU6ICAgZmFsc2UsXG5cblx0XHRcdFx0bGlicmFyeTogIHdwLm1lZGlhLnF1ZXJ5KCBfLmRlZmF1bHRzKHtcblx0XHRcdFx0XHR0eXBlOiAndmlkZW8nXG5cdFx0XHRcdH0sIG9wdGlvbnMubGlicmFyeSApIClcblx0XHRcdH0pLFxuXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5Db2xsZWN0aW9uRWRpdCh7XG5cdFx0XHRcdHR5cGU6ICd2aWRlbycsXG5cdFx0XHRcdGNvbGxlY3Rpb25UeXBlOiAncGxheWxpc3QnLFxuXHRcdFx0XHR0aXRsZTogICAgICAgICAgbDEwbi5lZGl0VmlkZW9QbGF5bGlzdFRpdGxlLFxuXHRcdFx0XHRTZXR0aW5nc1ZpZXc6ICAgd3AubWVkaWEudmlldy5TZXR0aW5ncy5QbGF5bGlzdCxcblx0XHRcdFx0bGlicmFyeTogICAgICAgIG9wdGlvbnMuc2VsZWN0aW9uLFxuXHRcdFx0XHRlZGl0aW5nOiAgICAgICAgb3B0aW9ucy5lZGl0aW5nLFxuXHRcdFx0XHRtZW51OiAgICAgICAgICAgJ3ZpZGVvLXBsYXlsaXN0Jyxcblx0XHRcdFx0ZHJhZ0luZm9UZXh0OiAgIGwxMG4udmlkZW9QbGF5bGlzdERyYWdJbmZvLFxuXHRcdFx0XHRkcmFnSW5mbzogICAgICAgZmFsc2Vcblx0XHRcdH0pLFxuXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5Db2xsZWN0aW9uQWRkKHtcblx0XHRcdFx0dHlwZTogJ3ZpZGVvJyxcblx0XHRcdFx0Y29sbGVjdGlvblR5cGU6ICdwbGF5bGlzdCcsXG5cdFx0XHRcdHRpdGxlOiBsMTBuLmFkZFRvVmlkZW9QbGF5bGlzdFRpdGxlXG5cdFx0XHR9KVxuXHRcdF0pO1xuXG5cdFx0aWYgKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuZmVhdHVyZWRJbWFnZUlkICkge1xuXHRcdFx0dGhpcy5zdGF0ZXMuYWRkKCBuZXcgd3AubWVkaWEuY29udHJvbGxlci5GZWF0dXJlZEltYWdlKCkgKTtcblx0XHR9XG5cdH0sXG5cblx0YmluZEhhbmRsZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGFuZGxlcnMsIGNoZWNrQ291bnRzO1xuXG5cdFx0U2VsZWN0LnByb3RvdHlwZS5iaW5kSGFuZGxlcnMuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dGhpcy5vbiggJ2FjdGl2YXRlJywgdGhpcy5hY3RpdmF0ZSwgdGhpcyApO1xuXG5cdFx0Ly8gT25seSBib3RoZXIgY2hlY2tpbmcgbWVkaWEgdHlwZSBjb3VudHMgaWYgb25lIG9mIHRoZSBjb3VudHMgaXMgemVyb1xuXHRcdGNoZWNrQ291bnRzID0gXy5maW5kKCB0aGlzLmNvdW50cywgZnVuY3Rpb24oIHR5cGUgKSB7XG5cdFx0XHRyZXR1cm4gdHlwZS5jb3VudCA9PT0gMDtcblx0XHR9ICk7XG5cblx0XHRpZiAoIHR5cGVvZiBjaGVja0NvdW50cyAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHR0aGlzLmxpc3RlblRvKCB3cC5tZWRpYS5tb2RlbC5BdHRhY2htZW50cy5hbGwsICdjaGFuZ2U6dHlwZScsIHRoaXMubWVkaWFUeXBlQ291bnRzICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5vbiggJ21lbnU6Y3JlYXRlOmdhbGxlcnknLCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnbWVudTpjcmVhdGU6cGxheWxpc3QnLCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnbWVudTpjcmVhdGU6dmlkZW8tcGxheWxpc3QnLCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6bWFpbi1pbnNlcnQnLCB0aGlzLmNyZWF0ZVRvb2xiYXIsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6bWFpbi1nYWxsZXJ5JywgdGhpcy5jcmVhdGVUb29sYmFyLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ3Rvb2xiYXI6Y3JlYXRlOm1haW4tcGxheWxpc3QnLCB0aGlzLmNyZWF0ZVRvb2xiYXIsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6bWFpbi12aWRlby1wbGF5bGlzdCcsIHRoaXMuY3JlYXRlVG9vbGJhciwgdGhpcyApO1xuXHRcdHRoaXMub24oICd0b29sYmFyOmNyZWF0ZTpmZWF0dXJlZC1pbWFnZScsIHRoaXMuZmVhdHVyZWRJbWFnZVRvb2xiYXIsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6bWFpbi1lbWJlZCcsIHRoaXMubWFpbkVtYmVkVG9vbGJhciwgdGhpcyApO1xuXG5cdFx0aGFuZGxlcnMgPSB7XG5cdFx0XHRtZW51OiB7XG5cdFx0XHRcdCdkZWZhdWx0JzogJ21haW5NZW51Jyxcblx0XHRcdFx0J2dhbGxlcnknOiAnZ2FsbGVyeU1lbnUnLFxuXHRcdFx0XHQncGxheWxpc3QnOiAncGxheWxpc3RNZW51Jyxcblx0XHRcdFx0J3ZpZGVvLXBsYXlsaXN0JzogJ3ZpZGVvUGxheWxpc3RNZW51J1xuXHRcdFx0fSxcblxuXHRcdFx0Y29udGVudDoge1xuXHRcdFx0XHQnZW1iZWQnOiAgICAgICAgICAnZW1iZWRDb250ZW50Jyxcblx0XHRcdFx0J2VkaXQtaW1hZ2UnOiAgICAgJ2VkaXRJbWFnZUNvbnRlbnQnLFxuXHRcdFx0XHQnZWRpdC1zZWxlY3Rpb24nOiAnZWRpdFNlbGVjdGlvbkNvbnRlbnQnXG5cdFx0XHR9LFxuXG5cdFx0XHR0b29sYmFyOiB7XG5cdFx0XHRcdCdtYWluLWluc2VydCc6ICAgICAgJ21haW5JbnNlcnRUb29sYmFyJyxcblx0XHRcdFx0J21haW4tZ2FsbGVyeSc6ICAgICAnbWFpbkdhbGxlcnlUb29sYmFyJyxcblx0XHRcdFx0J2dhbGxlcnktZWRpdCc6ICAgICAnZ2FsbGVyeUVkaXRUb29sYmFyJyxcblx0XHRcdFx0J2dhbGxlcnktYWRkJzogICAgICAnZ2FsbGVyeUFkZFRvb2xiYXInLFxuXHRcdFx0XHQnbWFpbi1wbGF5bGlzdCc6XHQnbWFpblBsYXlsaXN0VG9vbGJhcicsXG5cdFx0XHRcdCdwbGF5bGlzdC1lZGl0JzpcdCdwbGF5bGlzdEVkaXRUb29sYmFyJyxcblx0XHRcdFx0J3BsYXlsaXN0LWFkZCc6XHRcdCdwbGF5bGlzdEFkZFRvb2xiYXInLFxuXHRcdFx0XHQnbWFpbi12aWRlby1wbGF5bGlzdCc6ICdtYWluVmlkZW9QbGF5bGlzdFRvb2xiYXInLFxuXHRcdFx0XHQndmlkZW8tcGxheWxpc3QtZWRpdCc6ICd2aWRlb1BsYXlsaXN0RWRpdFRvb2xiYXInLFxuXHRcdFx0XHQndmlkZW8tcGxheWxpc3QtYWRkJzogJ3ZpZGVvUGxheWxpc3RBZGRUb29sYmFyJ1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRfLmVhY2goIGhhbmRsZXJzLCBmdW5jdGlvbiggcmVnaW9uSGFuZGxlcnMsIHJlZ2lvbiApIHtcblx0XHRcdF8uZWFjaCggcmVnaW9uSGFuZGxlcnMsIGZ1bmN0aW9uKCBjYWxsYmFjaywgaGFuZGxlciApIHtcblx0XHRcdFx0dGhpcy5vbiggcmVnaW9uICsgJzpyZW5kZXI6JyArIGhhbmRsZXIsIHRoaXNbIGNhbGxiYWNrIF0sIHRoaXMgKTtcblx0XHRcdH0sIHRoaXMgKTtcblx0XHR9LCB0aGlzICk7XG5cdH0sXG5cblx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEhpZGUgbWVudSBpdGVtcyBmb3Igc3RhdGVzIHRpZWQgdG8gcGFydGljdWxhciBtZWRpYSB0eXBlcyBpZiB0aGVyZSBhcmUgbm8gaXRlbXNcblx0XHRfLmVhY2goIHRoaXMuY291bnRzLCBmdW5jdGlvbiggdHlwZSApIHtcblx0XHRcdGlmICggdHlwZS5jb3VudCA8IDEgKSB7XG5cdFx0XHRcdHRoaXMubWVudUl0ZW1WaXNpYmlsaXR5KCB0eXBlLnN0YXRlLCAnaGlkZScgKTtcblx0XHRcdH1cblx0XHR9LCB0aGlzICk7XG5cdH0sXG5cblx0bWVkaWFUeXBlQ291bnRzOiBmdW5jdGlvbiggbW9kZWwsIGF0dHIgKSB7XG5cdFx0aWYgKCB0eXBlb2YgdGhpcy5jb3VudHNbIGF0dHIgXSAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5jb3VudHNbIGF0dHIgXS5jb3VudCA8IDEgKSB7XG5cdFx0XHR0aGlzLmNvdW50c1sgYXR0ciBdLmNvdW50Kys7XG5cdFx0XHR0aGlzLm1lbnVJdGVtVmlzaWJpbGl0eSggdGhpcy5jb3VudHNbIGF0dHIgXS5zdGF0ZSwgJ3Nob3cnICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIE1lbnVzXG5cdC8qKlxuXHQgKiBAcGFyYW0ge3dwLkJhY2tib25lLlZpZXd9IHZpZXdcblx0ICovXG5cdG1haW5NZW51OiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2aWV3LnNldCh7XG5cdFx0XHQnbGlicmFyeS1zZXBhcmF0b3InOiBuZXcgd3AubWVkaWEuVmlldyh7XG5cdFx0XHRcdGNsYXNzTmFtZTogJ3NlcGFyYXRvcicsXG5cdFx0XHRcdHByaW9yaXR5OiAxMDBcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH0sXG5cblx0bWVudUl0ZW1WaXNpYmlsaXR5OiBmdW5jdGlvbiggc3RhdGUsIHZpc2liaWxpdHkgKSB7XG5cdFx0dmFyIG1lbnUgPSB0aGlzLm1lbnUuZ2V0KCk7XG5cdFx0aWYgKCB2aXNpYmlsaXR5ID09PSAnaGlkZScgKSB7XG5cdFx0XHRtZW51LmhpZGUoIHN0YXRlICk7XG5cdFx0fSBlbHNlIGlmICggdmlzaWJpbGl0eSA9PT0gJ3Nob3cnICkge1xuXHRcdFx0bWVudS5zaG93KCBzdGF0ZSApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7d3AuQmFja2JvbmUuVmlld30gdmlld1xuXHQgKi9cblx0Z2FsbGVyeU1lbnU6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBsYXN0U3RhdGUgPSB0aGlzLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkLFxuXHRcdFx0ZnJhbWUgPSB0aGlzO1xuXG5cdFx0dmlldy5zZXQoe1xuXHRcdFx0Y2FuY2VsOiB7XG5cdFx0XHRcdHRleHQ6ICAgICBsMTBuLmNhbmNlbEdhbGxlcnlUaXRsZSxcblx0XHRcdFx0cHJpb3JpdHk6IDIwLFxuXHRcdFx0XHRjbGljazogICAgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKCBwcmV2aW91cyApIHtcblx0XHRcdFx0XHRcdGZyYW1lLnNldFN0YXRlKCBwcmV2aW91cyApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRmcmFtZS5jbG9zZSgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIEtlZXAgZm9jdXMgaW5zaWRlIG1lZGlhIG1vZGFsXG5cdFx0XHRcdFx0Ly8gYWZ0ZXIgY2FuY2VsaW5nIGEgZ2FsbGVyeVxuXHRcdFx0XHRcdHRoaXMuY29udHJvbGxlci5tb2RhbC5mb2N1c01hbmFnZXIuZm9jdXMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHNlcGFyYXRlQ2FuY2VsOiBuZXcgd3AubWVkaWEuVmlldyh7XG5cdFx0XHRcdGNsYXNzTmFtZTogJ3NlcGFyYXRvcicsXG5cdFx0XHRcdHByaW9yaXR5OiA0MFxuXHRcdFx0fSlcblx0XHR9KTtcblx0fSxcblxuXHRwbGF5bGlzdE1lbnU6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBsYXN0U3RhdGUgPSB0aGlzLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkLFxuXHRcdFx0ZnJhbWUgPSB0aGlzO1xuXG5cdFx0dmlldy5zZXQoe1xuXHRcdFx0Y2FuY2VsOiB7XG5cdFx0XHRcdHRleHQ6ICAgICBsMTBuLmNhbmNlbFBsYXlsaXN0VGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAyMCxcblx0XHRcdFx0Y2xpY2s6ICAgIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmICggcHJldmlvdXMgKSB7XG5cdFx0XHRcdFx0XHRmcmFtZS5zZXRTdGF0ZSggcHJldmlvdXMgKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZnJhbWUuY2xvc2UoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRzZXBhcmF0ZUNhbmNlbDogbmV3IHdwLm1lZGlhLlZpZXcoe1xuXHRcdFx0XHRjbGFzc05hbWU6ICdzZXBhcmF0b3InLFxuXHRcdFx0XHRwcmlvcml0eTogNDBcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH0sXG5cblx0dmlkZW9QbGF5bGlzdE1lbnU6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBsYXN0U3RhdGUgPSB0aGlzLmxhc3RTdGF0ZSgpLFxuXHRcdFx0cHJldmlvdXMgPSBsYXN0U3RhdGUgJiYgbGFzdFN0YXRlLmlkLFxuXHRcdFx0ZnJhbWUgPSB0aGlzO1xuXG5cdFx0dmlldy5zZXQoe1xuXHRcdFx0Y2FuY2VsOiB7XG5cdFx0XHRcdHRleHQ6ICAgICBsMTBuLmNhbmNlbFZpZGVvUGxheWxpc3RUaXRsZSxcblx0XHRcdFx0cHJpb3JpdHk6IDIwLFxuXHRcdFx0XHRjbGljazogICAgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKCBwcmV2aW91cyApIHtcblx0XHRcdFx0XHRcdGZyYW1lLnNldFN0YXRlKCBwcmV2aW91cyApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRmcmFtZS5jbG9zZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHNlcGFyYXRlQ2FuY2VsOiBuZXcgd3AubWVkaWEuVmlldyh7XG5cdFx0XHRcdGNsYXNzTmFtZTogJ3NlcGFyYXRvcicsXG5cdFx0XHRcdHByaW9yaXR5OiA0MFxuXHRcdFx0fSlcblx0XHR9KTtcblx0fSxcblxuXHQvLyBDb250ZW50XG5cdGVtYmVkQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5FbWJlZCh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0bW9kZWw6ICAgICAgdGhpcy5zdGF0ZSgpXG5cdFx0fSkucmVuZGVyKCk7XG5cblx0XHR0aGlzLmNvbnRlbnQuc2V0KCB2aWV3ICk7XG5cblx0XHRpZiAoICEgd3AubWVkaWEuaXNUb3VjaERldmljZSApIHtcblx0XHRcdHZpZXcudXJsLmZvY3VzKCk7XG5cdFx0fVxuXHR9LFxuXG5cdGVkaXRTZWxlY3Rpb25Db250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3RhdGUgPSB0aGlzLnN0YXRlKCksXG5cdFx0XHRzZWxlY3Rpb24gPSBzdGF0ZS5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0dmlldztcblxuXHRcdHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5BdHRhY2htZW50c0Jyb3dzZXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGNvbGxlY3Rpb246IHNlbGVjdGlvbixcblx0XHRcdHNlbGVjdGlvbjogIHNlbGVjdGlvbixcblx0XHRcdG1vZGVsOiAgICAgIHN0YXRlLFxuXHRcdFx0c29ydGFibGU6ICAgdHJ1ZSxcblx0XHRcdHNlYXJjaDogICAgIGZhbHNlLFxuXHRcdFx0ZGF0ZTogICAgICAgZmFsc2UsXG5cdFx0XHRkcmFnSW5mbzogICB0cnVlLFxuXG5cdFx0XHRBdHRhY2htZW50Vmlldzogd3AubWVkaWEudmlldy5BdHRhY2htZW50cy5FZGl0U2VsZWN0aW9uXG5cdFx0fSkucmVuZGVyKCk7XG5cblx0XHR2aWV3LnRvb2xiYXIuc2V0KCAnYmFja1RvTGlicmFyeScsIHtcblx0XHRcdHRleHQ6ICAgICBsMTBuLnJldHVyblRvTGlicmFyeSxcblx0XHRcdHByaW9yaXR5OiAtMTAwLFxuXG5cdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5jb250ZW50Lm1vZGUoJ2Jyb3dzZScpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gQnJvd3NlIG91ciBsaWJyYXJ5IG9mIGF0dGFjaG1lbnRzLlxuXHRcdHRoaXMuY29udGVudC5zZXQoIHZpZXcgKTtcblxuXHRcdC8vIFRyaWdnZXIgdGhlIGNvbnRyb2xsZXIgdG8gc2V0IGZvY3VzXG5cdFx0dGhpcy50cmlnZ2VyKCAnZWRpdDpzZWxlY3Rpb24nLCB0aGlzICk7XG5cdH0sXG5cblx0ZWRpdEltYWdlQ29udGVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGltYWdlID0gdGhpcy5zdGF0ZSgpLmdldCgnaW1hZ2UnKSxcblx0XHRcdHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5FZGl0SW1hZ2UoIHsgbW9kZWw6IGltYWdlLCBjb250cm9sbGVyOiB0aGlzIH0gKS5yZW5kZXIoKTtcblxuXHRcdHRoaXMuY29udGVudC5zZXQoIHZpZXcgKTtcblxuXHRcdC8vIGFmdGVyIGNyZWF0aW5nIHRoZSB3cmFwcGVyIHZpZXcsIGxvYWQgdGhlIGFjdHVhbCBlZGl0b3IgdmlhIGFuIGFqYXggY2FsbFxuXHRcdHZpZXcubG9hZEVkaXRvcigpO1xuXG5cdH0sXG5cblx0Ly8gVG9vbGJhcnNcblxuXHQvKipcblx0ICogQHBhcmFtIHt3cC5CYWNrYm9uZS5WaWV3fSB2aWV3XG5cdCAqL1xuXHRzZWxlY3Rpb25TdGF0dXNUb29sYmFyOiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgZWRpdGFibGUgPSB0aGlzLnN0YXRlKCkuZ2V0KCdlZGl0YWJsZScpO1xuXG5cdFx0dmlldy5zZXQoICdzZWxlY3Rpb24nLCBuZXcgd3AubWVkaWEudmlldy5TZWxlY3Rpb24oe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGNvbGxlY3Rpb246IHRoaXMuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0cHJpb3JpdHk6ICAgLTQwLFxuXG5cdFx0XHQvLyBJZiB0aGUgc2VsZWN0aW9uIGlzIGVkaXRhYmxlLCBwYXNzIHRoZSBjYWxsYmFjayB0b1xuXHRcdFx0Ly8gc3dpdGNoIHRoZSBjb250ZW50IG1vZGUuXG5cdFx0XHRlZGl0YWJsZTogZWRpdGFibGUgJiYgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5jb250ZW50Lm1vZGUoJ2VkaXQtc2VsZWN0aW9uJyk7XG5cdFx0XHR9XG5cdFx0fSkucmVuZGVyKCkgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHBhcmFtIHt3cC5CYWNrYm9uZS5WaWV3fSB2aWV3XG5cdCAqL1xuXHRtYWluSW5zZXJ0VG9vbGJhcjogZnVuY3Rpb24oIHZpZXcgKSB7XG5cdFx0dmFyIGNvbnRyb2xsZXIgPSB0aGlzO1xuXG5cdFx0dGhpcy5zZWxlY3Rpb25TdGF0dXNUb29sYmFyKCB2aWV3ICk7XG5cblx0XHR2aWV3LnNldCggJ2luc2VydCcsIHtcblx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRwcmlvcml0eTogODAsXG5cdFx0XHR0ZXh0OiAgICAgbDEwbi5pbnNlcnRJbnRvUG9zdCxcblx0XHRcdHJlcXVpcmVzOiB7IHNlbGVjdGlvbjogdHJ1ZSB9LFxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEBmaXJlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlI2luc2VydFxuXHRcdFx0ICovXG5cdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKSxcblx0XHRcdFx0XHRzZWxlY3Rpb24gPSBzdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xuXG5cdFx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblx0XHRcdFx0c3RhdGUudHJpZ2dlciggJ2luc2VydCcsIHNlbGVjdGlvbiApLnJlc2V0KCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7d3AuQmFja2JvbmUuVmlld30gdmlld1xuXHQgKi9cblx0bWFpbkdhbGxlcnlUb29sYmFyOiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgY29udHJvbGxlciA9IHRoaXM7XG5cblx0XHR0aGlzLnNlbGVjdGlvblN0YXR1c1Rvb2xiYXIoIHZpZXcgKTtcblxuXHRcdHZpZXcuc2V0KCAnZ2FsbGVyeScsIHtcblx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHR0ZXh0OiAgICAgbDEwbi5jcmVhdGVOZXdHYWxsZXJ5LFxuXHRcdFx0cHJpb3JpdHk6IDYwLFxuXHRcdFx0cmVxdWlyZXM6IHsgc2VsZWN0aW9uOiB0cnVlIH0sXG5cblx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHNlbGVjdGlvbiA9IGNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0XHRcdGVkaXQgPSBjb250cm9sbGVyLnN0YXRlKCdnYWxsZXJ5LWVkaXQnKSxcblx0XHRcdFx0XHRtb2RlbHMgPSBzZWxlY3Rpb24ud2hlcmUoeyB0eXBlOiAnaW1hZ2UnIH0pO1xuXG5cdFx0XHRcdGVkaXQuc2V0KCAnbGlicmFyeScsIG5ldyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24oIG1vZGVscywge1xuXHRcdFx0XHRcdHByb3BzOiAgICBzZWxlY3Rpb24ucHJvcHMudG9KU09OKCksXG5cdFx0XHRcdFx0bXVsdGlwbGU6IHRydWVcblx0XHRcdFx0fSkgKTtcblxuXHRcdFx0XHR0aGlzLmNvbnRyb2xsZXIuc2V0U3RhdGUoJ2dhbGxlcnktZWRpdCcpO1xuXG5cdFx0XHRcdC8vIEtlZXAgZm9jdXMgaW5zaWRlIG1lZGlhIG1vZGFsXG5cdFx0XHRcdC8vIGFmdGVyIGp1bXBpbmcgdG8gZ2FsbGVyeSB2aWV3XG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5tb2RhbC5mb2N1c01hbmFnZXIuZm9jdXMoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblxuXHRtYWluUGxheWxpc3RUb29sYmFyOiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgY29udHJvbGxlciA9IHRoaXM7XG5cblx0XHR0aGlzLnNlbGVjdGlvblN0YXR1c1Rvb2xiYXIoIHZpZXcgKTtcblxuXHRcdHZpZXcuc2V0KCAncGxheWxpc3QnLCB7XG5cdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0dGV4dDogICAgIGwxMG4uY3JlYXRlTmV3UGxheWxpc3QsXG5cdFx0XHRwcmlvcml0eTogMTAwLFxuXHRcdFx0cmVxdWlyZXM6IHsgc2VsZWN0aW9uOiB0cnVlIH0sXG5cblx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHNlbGVjdGlvbiA9IGNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NlbGVjdGlvbicpLFxuXHRcdFx0XHRcdGVkaXQgPSBjb250cm9sbGVyLnN0YXRlKCdwbGF5bGlzdC1lZGl0JyksXG5cdFx0XHRcdFx0bW9kZWxzID0gc2VsZWN0aW9uLndoZXJlKHsgdHlwZTogJ2F1ZGlvJyB9KTtcblxuXHRcdFx0XHRlZGl0LnNldCggJ2xpYnJhcnknLCBuZXcgd3AubWVkaWEubW9kZWwuU2VsZWN0aW9uKCBtb2RlbHMsIHtcblx0XHRcdFx0XHRwcm9wczogICAgc2VsZWN0aW9uLnByb3BzLnRvSlNPTigpLFxuXHRcdFx0XHRcdG11bHRpcGxlOiB0cnVlXG5cdFx0XHRcdH0pICk7XG5cblx0XHRcdFx0dGhpcy5jb250cm9sbGVyLnNldFN0YXRlKCdwbGF5bGlzdC1lZGl0Jyk7XG5cblx0XHRcdFx0Ly8gS2VlcCBmb2N1cyBpbnNpZGUgbWVkaWEgbW9kYWxcblx0XHRcdFx0Ly8gYWZ0ZXIganVtcGluZyB0byBwbGF5bGlzdCB2aWV3XG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5tb2RhbC5mb2N1c01hbmFnZXIuZm9jdXMoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblxuXHRtYWluVmlkZW9QbGF5bGlzdFRvb2xiYXI6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZhciBjb250cm9sbGVyID0gdGhpcztcblxuXHRcdHRoaXMuc2VsZWN0aW9uU3RhdHVzVG9vbGJhciggdmlldyApO1xuXG5cdFx0dmlldy5zZXQoICd2aWRlby1wbGF5bGlzdCcsIHtcblx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHR0ZXh0OiAgICAgbDEwbi5jcmVhdGVOZXdWaWRlb1BsYXlsaXN0LFxuXHRcdFx0cHJpb3JpdHk6IDEwMCxcblx0XHRcdHJlcXVpcmVzOiB7IHNlbGVjdGlvbjogdHJ1ZSB9LFxuXG5cdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBzZWxlY3Rpb24gPSBjb250cm9sbGVyLnN0YXRlKCkuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdFx0XHRlZGl0ID0gY29udHJvbGxlci5zdGF0ZSgndmlkZW8tcGxheWxpc3QtZWRpdCcpLFxuXHRcdFx0XHRcdG1vZGVscyA9IHNlbGVjdGlvbi53aGVyZSh7IHR5cGU6ICd2aWRlbycgfSk7XG5cblx0XHRcdFx0ZWRpdC5zZXQoICdsaWJyYXJ5JywgbmV3IHdwLm1lZGlhLm1vZGVsLlNlbGVjdGlvbiggbW9kZWxzLCB7XG5cdFx0XHRcdFx0cHJvcHM6ICAgIHNlbGVjdGlvbi5wcm9wcy50b0pTT04oKSxcblx0XHRcdFx0XHRtdWx0aXBsZTogdHJ1ZVxuXHRcdFx0XHR9KSApO1xuXG5cdFx0XHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSgndmlkZW8tcGxheWxpc3QtZWRpdCcpO1xuXG5cdFx0XHRcdC8vIEtlZXAgZm9jdXMgaW5zaWRlIG1lZGlhIG1vZGFsXG5cdFx0XHRcdC8vIGFmdGVyIGp1bXBpbmcgdG8gdmlkZW8gcGxheWxpc3Qgdmlld1xuXHRcdFx0XHR0aGlzLmNvbnRyb2xsZXIubW9kYWwuZm9jdXNNYW5hZ2VyLmZvY3VzKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0ZmVhdHVyZWRJbWFnZVRvb2xiYXI6IGZ1bmN0aW9uKCB0b29sYmFyICkge1xuXHRcdHRoaXMuY3JlYXRlU2VsZWN0VG9vbGJhciggdG9vbGJhciwge1xuXHRcdFx0dGV4dDogIGwxMG4uc2V0RmVhdHVyZWRJbWFnZSxcblx0XHRcdHN0YXRlOiB0aGlzLm9wdGlvbnMuc3RhdGVcblx0XHR9KTtcblx0fSxcblxuXHRtYWluRW1iZWRUb29sYmFyOiBmdW5jdGlvbiggdG9vbGJhciApIHtcblx0XHR0b29sYmFyLnZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyLkVtYmVkKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXNcblx0XHR9KTtcblx0fSxcblxuXHRnYWxsZXJ5RWRpdFRvb2xiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlZGl0aW5nID0gdGhpcy5zdGF0ZSgpLmdldCgnZWRpdGluZycpO1xuXHRcdHRoaXMudG9vbGJhci5zZXQoIG5ldyB3cC5tZWRpYS52aWV3LlRvb2xiYXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGl0ZW1zOiB7XG5cdFx0XHRcdGluc2VydDoge1xuXHRcdFx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRcdFx0dGV4dDogICAgIGVkaXRpbmcgPyBsMTBuLnVwZGF0ZUdhbGxlcnkgOiBsMTBuLmluc2VydEdhbGxlcnksXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDgwLFxuXHRcdFx0XHRcdHJlcXVpcmVzOiB7IGxpYnJhcnk6IHRydWUgfSxcblxuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIEBmaXJlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlI3VwZGF0ZVxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKTtcblxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXHRcdFx0XHRcdFx0c3RhdGUudHJpZ2dlciggJ3VwZGF0ZScsIHN0YXRlLmdldCgnbGlicmFyeScpICk7XG5cblx0XHRcdFx0XHRcdC8vIFJlc3RvcmUgYW5kIHJlc2V0IHRoZSBkZWZhdWx0IHN0YXRlLlxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSggY29udHJvbGxlci5vcHRpb25zLnN0YXRlICk7XG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLnJlc2V0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHRnYWxsZXJ5QWRkVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50b29sYmFyLnNldCggbmV3IHdwLm1lZGlhLnZpZXcuVG9vbGJhcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0aXRlbXM6IHtcblx0XHRcdFx0aW5zZXJ0OiB7XG5cdFx0XHRcdFx0c3R5bGU6ICAgICdwcmltYXJ5Jyxcblx0XHRcdFx0XHR0ZXh0OiAgICAgbDEwbi5hZGRUb0dhbGxlcnksXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDgwLFxuXHRcdFx0XHRcdHJlcXVpcmVzOiB7IHNlbGVjdGlvbjogdHJ1ZSB9LFxuXG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogQGZpcmVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGUjcmVzZXRcblx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgY29udHJvbGxlciA9IHRoaXMuY29udHJvbGxlcixcblx0XHRcdFx0XHRcdFx0c3RhdGUgPSBjb250cm9sbGVyLnN0YXRlKCksXG5cdFx0XHRcdFx0XHRcdGVkaXQgPSBjb250cm9sbGVyLnN0YXRlKCdnYWxsZXJ5LWVkaXQnKTtcblxuXHRcdFx0XHRcdFx0ZWRpdC5nZXQoJ2xpYnJhcnknKS5hZGQoIHN0YXRlLmdldCgnc2VsZWN0aW9uJykubW9kZWxzICk7XG5cdFx0XHRcdFx0XHRzdGF0ZS50cmlnZ2VyKCdyZXNldCcpO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSgnZ2FsbGVyeS1lZGl0Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHRwbGF5bGlzdEVkaXRUb29sYmFyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWRpdGluZyA9IHRoaXMuc3RhdGUoKS5nZXQoJ2VkaXRpbmcnKTtcblx0XHR0aGlzLnRvb2xiYXIuc2V0KCBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRpdGVtczoge1xuXHRcdFx0XHRpbnNlcnQ6IHtcblx0XHRcdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0XHRcdHRleHQ6ICAgICBlZGl0aW5nID8gbDEwbi51cGRhdGVQbGF5bGlzdCA6IGwxMG4uaW5zZXJ0UGxheWxpc3QsXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDgwLFxuXHRcdFx0XHRcdHJlcXVpcmVzOiB7IGxpYnJhcnk6IHRydWUgfSxcblxuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIEBmaXJlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlI3VwZGF0ZVxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKTtcblxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXHRcdFx0XHRcdFx0c3RhdGUudHJpZ2dlciggJ3VwZGF0ZScsIHN0YXRlLmdldCgnbGlicmFyeScpICk7XG5cblx0XHRcdFx0XHRcdC8vIFJlc3RvcmUgYW5kIHJlc2V0IHRoZSBkZWZhdWx0IHN0YXRlLlxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSggY29udHJvbGxlci5vcHRpb25zLnN0YXRlICk7XG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLnJlc2V0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHRwbGF5bGlzdEFkZFRvb2xiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudG9vbGJhci5zZXQoIG5ldyB3cC5tZWRpYS52aWV3LlRvb2xiYXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGl0ZW1zOiB7XG5cdFx0XHRcdGluc2VydDoge1xuXHRcdFx0XHRcdHN0eWxlOiAgICAncHJpbWFyeScsXG5cdFx0XHRcdFx0dGV4dDogICAgIGwxMG4uYWRkVG9QbGF5bGlzdCxcblx0XHRcdFx0XHRwcmlvcml0eTogODAsXG5cdFx0XHRcdFx0cmVxdWlyZXM6IHsgc2VsZWN0aW9uOiB0cnVlIH0sXG5cblx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHQgKiBAZmlyZXMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZSNyZXNldFxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKSxcblx0XHRcdFx0XHRcdFx0ZWRpdCA9IGNvbnRyb2xsZXIuc3RhdGUoJ3BsYXlsaXN0LWVkaXQnKTtcblxuXHRcdFx0XHRcdFx0ZWRpdC5nZXQoJ2xpYnJhcnknKS5hZGQoIHN0YXRlLmdldCgnc2VsZWN0aW9uJykubW9kZWxzICk7XG5cdFx0XHRcdFx0XHRzdGF0ZS50cmlnZ2VyKCdyZXNldCcpO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSgncGxheWxpc3QtZWRpdCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH0sXG5cblx0dmlkZW9QbGF5bGlzdEVkaXRUb29sYmFyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWRpdGluZyA9IHRoaXMuc3RhdGUoKS5nZXQoJ2VkaXRpbmcnKTtcblx0XHR0aGlzLnRvb2xiYXIuc2V0KCBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRpdGVtczoge1xuXHRcdFx0XHRpbnNlcnQ6IHtcblx0XHRcdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0XHRcdHRleHQ6ICAgICBlZGl0aW5nID8gbDEwbi51cGRhdGVWaWRlb1BsYXlsaXN0IDogbDEwbi5pbnNlcnRWaWRlb1BsYXlsaXN0LFxuXHRcdFx0XHRcdHByaW9yaXR5OiAxNDAsXG5cdFx0XHRcdFx0cmVxdWlyZXM6IHsgbGlicmFyeTogdHJ1ZSB9LFxuXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIGNvbnRyb2xsZXIgPSB0aGlzLmNvbnRyb2xsZXIsXG5cdFx0XHRcdFx0XHRcdHN0YXRlID0gY29udHJvbGxlci5zdGF0ZSgpLFxuXHRcdFx0XHRcdFx0XHRsaWJyYXJ5ID0gc3RhdGUuZ2V0KCdsaWJyYXJ5Jyk7XG5cblx0XHRcdFx0XHRcdGxpYnJhcnkudHlwZSA9ICd2aWRlbyc7XG5cblx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblx0XHRcdFx0XHRcdHN0YXRlLnRyaWdnZXIoICd1cGRhdGUnLCBsaWJyYXJ5ICk7XG5cblx0XHRcdFx0XHRcdC8vIFJlc3RvcmUgYW5kIHJlc2V0IHRoZSBkZWZhdWx0IHN0YXRlLlxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSggY29udHJvbGxlci5vcHRpb25zLnN0YXRlICk7XG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLnJlc2V0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkgKTtcblx0fSxcblxuXHR2aWRlb1BsYXlsaXN0QWRkVG9vbGJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50b29sYmFyLnNldCggbmV3IHdwLm1lZGlhLnZpZXcuVG9vbGJhcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0aXRlbXM6IHtcblx0XHRcdFx0aW5zZXJ0OiB7XG5cdFx0XHRcdFx0c3R5bGU6ICAgICdwcmltYXJ5Jyxcblx0XHRcdFx0XHR0ZXh0OiAgICAgbDEwbi5hZGRUb1ZpZGVvUGxheWxpc3QsXG5cdFx0XHRcdFx0cHJpb3JpdHk6IDE0MCxcblx0XHRcdFx0XHRyZXF1aXJlczogeyBzZWxlY3Rpb246IHRydWUgfSxcblxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciBjb250cm9sbGVyID0gdGhpcy5jb250cm9sbGVyLFxuXHRcdFx0XHRcdFx0XHRzdGF0ZSA9IGNvbnRyb2xsZXIuc3RhdGUoKSxcblx0XHRcdFx0XHRcdFx0ZWRpdCA9IGNvbnRyb2xsZXIuc3RhdGUoJ3ZpZGVvLXBsYXlsaXN0LWVkaXQnKTtcblxuXHRcdFx0XHRcdFx0ZWRpdC5nZXQoJ2xpYnJhcnknKS5hZGQoIHN0YXRlLmdldCgnc2VsZWN0aW9uJykubW9kZWxzICk7XG5cdFx0XHRcdFx0XHRzdGF0ZS50cmlnZ2VyKCdyZXNldCcpO1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRTdGF0ZSgndmlkZW8tcGxheWxpc3QtZWRpdCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvc3Q7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5TZWxlY3RcbiAqXG4gKiBBIGZyYW1lIGZvciBzZWxlY3RpbmcgYW4gaXRlbSBvciBpdGVtcyBmcm9tIHRoZSBtZWRpYSBsaWJyYXJ5LlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuRnJhbWVcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqIEBtaXhlcyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlTWFjaGluZVxuICovXG5cbnZhciBNZWRpYUZyYW1lID0gd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRTZWxlY3Q7XG5cblNlbGVjdCA9IE1lZGlhRnJhbWUuZXh0ZW5kKHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gQ2FsbCAnaW5pdGlhbGl6ZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzcy5cblx0XHRNZWRpYUZyYW1lLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0c2VsZWN0aW9uOiBbXSxcblx0XHRcdGxpYnJhcnk6ICAge30sXG5cdFx0XHRtdWx0aXBsZTogIGZhbHNlLFxuXHRcdFx0c3RhdGU6ICAgICdsaWJyYXJ5J1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5jcmVhdGVTZWxlY3Rpb24oKTtcblx0XHR0aGlzLmNyZWF0ZVN0YXRlcygpO1xuXHRcdHRoaXMuYmluZEhhbmRsZXJzKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEF0dGFjaCBhIHNlbGVjdGlvbiBjb2xsZWN0aW9uIHRvIHRoZSBmcmFtZS5cblx0ICpcblx0ICogQSBzZWxlY3Rpb24gaXMgYSBjb2xsZWN0aW9uIG9mIGF0dGFjaG1lbnRzIHVzZWQgZm9yIGEgc3BlY2lmaWMgcHVycG9zZVxuXHQgKiBieSBhIG1lZGlhIGZyYW1lLiBlLmcuIFNlbGVjdGluZyBhbiBhdHRhY2htZW50IChvciBtYW55KSB0byBpbnNlcnQgaW50b1xuXHQgKiBwb3N0IGNvbnRlbnQuXG5cdCAqXG5cdCAqIEBzZWUgbWVkaWEubW9kZWwuU2VsZWN0aW9uXG5cdCAqL1xuXHRjcmVhdGVTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3Rpb24gPSB0aGlzLm9wdGlvbnMuc2VsZWN0aW9uO1xuXG5cdFx0aWYgKCAhIChzZWxlY3Rpb24gaW5zdGFuY2VvZiB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24pICkge1xuXHRcdFx0dGhpcy5vcHRpb25zLnNlbGVjdGlvbiA9IG5ldyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24oIHNlbGVjdGlvbiwge1xuXHRcdFx0XHRtdWx0aXBsZTogdGhpcy5vcHRpb25zLm11bHRpcGxlXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHR0aGlzLl9zZWxlY3Rpb24gPSB7XG5cdFx0XHRhdHRhY2htZW50czogbmV3IHdwLm1lZGlhLm1vZGVsLkF0dGFjaG1lbnRzKCksXG5cdFx0XHRkaWZmZXJlbmNlOiBbXVxuXHRcdH07XG5cdH0sXG5cblx0LyoqXG5cdCAqIENyZWF0ZSB0aGUgZGVmYXVsdCBzdGF0ZXMgb24gdGhlIGZyYW1lLlxuXHQgKi9cblx0Y3JlYXRlU3RhdGVzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLnN0YXRlcyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBBZGQgdGhlIGRlZmF1bHQgc3RhdGVzLlxuXHRcdHRoaXMuc3RhdGVzLmFkZChbXG5cdFx0XHQvLyBNYWluIHN0YXRlcy5cblx0XHRcdG5ldyB3cC5tZWRpYS5jb250cm9sbGVyLkxpYnJhcnkoe1xuXHRcdFx0XHRsaWJyYXJ5OiAgIHdwLm1lZGlhLnF1ZXJ5KCBvcHRpb25zLmxpYnJhcnkgKSxcblx0XHRcdFx0bXVsdGlwbGU6ICBvcHRpb25zLm11bHRpcGxlLFxuXHRcdFx0XHR0aXRsZTogICAgIG9wdGlvbnMudGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAgMjBcblx0XHRcdH0pXG5cdFx0XSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEJpbmQgcmVnaW9uIG1vZGUgZXZlbnQgY2FsbGJhY2tzLlxuXHQgKlxuXHQgKiBAc2VlIG1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uLnJlbmRlclxuXHQgKi9cblx0YmluZEhhbmRsZXJzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9uKCAncm91dGVyOmNyZWF0ZTpicm93c2UnLCB0aGlzLmNyZWF0ZVJvdXRlciwgdGhpcyApO1xuXHRcdHRoaXMub24oICdyb3V0ZXI6cmVuZGVyOmJyb3dzZScsIHRoaXMuYnJvd3NlUm91dGVyLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NvbnRlbnQ6Y3JlYXRlOmJyb3dzZScsIHRoaXMuYnJvd3NlQ29udGVudCwgdGhpcyApO1xuXHRcdHRoaXMub24oICdjb250ZW50OnJlbmRlcjp1cGxvYWQnLCB0aGlzLnVwbG9hZENvbnRlbnQsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAndG9vbGJhcjpjcmVhdGU6c2VsZWN0JywgdGhpcy5jcmVhdGVTZWxlY3RUb29sYmFyLCB0aGlzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlciBjYWxsYmFjayBmb3IgdGhlIHJvdXRlciByZWdpb24gaW4gdGhlIGBicm93c2VgIG1vZGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7d3AubWVkaWEudmlldy5Sb3V0ZXJ9IHJvdXRlclZpZXdcblx0ICovXG5cdGJyb3dzZVJvdXRlcjogZnVuY3Rpb24oIHJvdXRlclZpZXcgKSB7XG5cdFx0cm91dGVyVmlldy5zZXQoe1xuXHRcdFx0dXBsb2FkOiB7XG5cdFx0XHRcdHRleHQ6ICAgICBsMTBuLnVwbG9hZEZpbGVzVGl0bGUsXG5cdFx0XHRcdHByaW9yaXR5OiAyMFxuXHRcdFx0fSxcblx0XHRcdGJyb3dzZToge1xuXHRcdFx0XHR0ZXh0OiAgICAgbDEwbi5tZWRpYUxpYnJhcnlUaXRsZSxcblx0XHRcdFx0cHJpb3JpdHk6IDQwXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlciBjYWxsYmFjayBmb3IgdGhlIGNvbnRlbnQgcmVnaW9uIGluIHRoZSBgYnJvd3NlYCBtb2RlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9ufSBjb250ZW50UmVnaW9uXG5cdCAqL1xuXHRicm93c2VDb250ZW50OiBmdW5jdGlvbiggY29udGVudFJlZ2lvbiApIHtcblx0XHR2YXIgc3RhdGUgPSB0aGlzLnN0YXRlKCk7XG5cblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcygnaGlkZS10b29sYmFyJyk7XG5cblx0XHQvLyBCcm93c2Ugb3VyIGxpYnJhcnkgb2YgYXR0YWNobWVudHMuXG5cdFx0Y29udGVudFJlZ2lvbi52aWV3ID0gbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudHNCcm93c2VyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRjb2xsZWN0aW9uOiBzdGF0ZS5nZXQoJ2xpYnJhcnknKSxcblx0XHRcdHNlbGVjdGlvbjogIHN0YXRlLmdldCgnc2VsZWN0aW9uJyksXG5cdFx0XHRtb2RlbDogICAgICBzdGF0ZSxcblx0XHRcdHNvcnRhYmxlOiAgIHN0YXRlLmdldCgnc29ydGFibGUnKSxcblx0XHRcdHNlYXJjaDogICAgIHN0YXRlLmdldCgnc2VhcmNoYWJsZScpLFxuXHRcdFx0ZmlsdGVyczogICAgc3RhdGUuZ2V0KCdmaWx0ZXJhYmxlJyksXG5cdFx0XHRkYXRlOiAgICAgICBzdGF0ZS5nZXQoJ2RhdGUnKSxcblx0XHRcdGRpc3BsYXk6ICAgIHN0YXRlLmhhcygnZGlzcGxheScpID8gc3RhdGUuZ2V0KCdkaXNwbGF5JykgOiBzdGF0ZS5nZXQoJ2Rpc3BsYXlTZXR0aW5ncycpLFxuXHRcdFx0ZHJhZ0luZm86ICAgc3RhdGUuZ2V0KCdkcmFnSW5mbycpLFxuXG5cdFx0XHRpZGVhbENvbHVtbldpZHRoOiBzdGF0ZS5nZXQoJ2lkZWFsQ29sdW1uV2lkdGgnKSxcblx0XHRcdHN1Z2dlc3RlZFdpZHRoOiAgIHN0YXRlLmdldCgnc3VnZ2VzdGVkV2lkdGgnKSxcblx0XHRcdHN1Z2dlc3RlZEhlaWdodDogIHN0YXRlLmdldCgnc3VnZ2VzdGVkSGVpZ2h0JyksXG5cblx0XHRcdEF0dGFjaG1lbnRWaWV3OiBzdGF0ZS5nZXQoJ0F0dGFjaG1lbnRWaWV3Jylcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVuZGVyIGNhbGxiYWNrIGZvciB0aGUgY29udGVudCByZWdpb24gaW4gdGhlIGB1cGxvYWRgIG1vZGUuXG5cdCAqL1xuXHR1cGxvYWRDb250ZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2hpZGUtdG9vbGJhcicgKTtcblx0XHR0aGlzLmNvbnRlbnQuc2V0KCBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlcklubGluZSh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzXG5cdFx0fSkgKTtcblx0fSxcblxuXHQvKipcblx0ICogVG9vbGJhcnNcblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IHRvb2xiYXJcblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XVxuXHQgKiBAdGhpcyB3cC5tZWRpYS5jb250cm9sbGVyLlJlZ2lvblxuXHQgKi9cblx0Y3JlYXRlU2VsZWN0VG9vbGJhcjogZnVuY3Rpb24oIHRvb2xiYXIsIG9wdGlvbnMgKSB7XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwgdGhpcy5vcHRpb25zLmJ1dHRvbiB8fCB7fTtcblx0XHRvcHRpb25zLmNvbnRyb2xsZXIgPSB0aGlzO1xuXG5cdFx0dG9vbGJhci52aWV3ID0gbmV3IHdwLm1lZGlhLnZpZXcuVG9vbGJhci5TZWxlY3QoIG9wdGlvbnMgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LklmcmFtZVxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgSWZyYW1lID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdtZWRpYS1pZnJhbWUnLFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuSWZyYW1lfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnZpZXdzLmRldGFjaCgpO1xuXHRcdHRoaXMuJGVsLmh0bWwoICc8aWZyYW1lIHNyYz1cIicgKyB0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoJ3NyYycpICsgJ1wiIC8+JyApO1xuXHRcdHRoaXMudmlld3MucmVuZGVyKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElmcmFtZTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5JbWFnZURldGFpbHNcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlNldHRpbmdzLkF0dGFjaG1lbnREaXNwbGF5XG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5TZXR0aW5nc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgQXR0YWNobWVudERpc3BsYXkgPSB3cC5tZWRpYS52aWV3LlNldHRpbmdzLkF0dGFjaG1lbnREaXNwbGF5LFxuXHQkID0galF1ZXJ5LFxuXHRJbWFnZURldGFpbHM7XG5cbkltYWdlRGV0YWlscyA9IEF0dGFjaG1lbnREaXNwbGF5LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2ltYWdlLWRldGFpbHMnLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCdpbWFnZS1kZXRhaWxzJyksXG5cdGV2ZW50czogXy5kZWZhdWx0cyggQXR0YWNobWVudERpc3BsYXkucHJvdG90eXBlLmV2ZW50cywge1xuXHRcdCdjbGljayAuZWRpdC1hdHRhY2htZW50JzogJ2VkaXRBdHRhY2htZW50Jyxcblx0XHQnY2xpY2sgLnJlcGxhY2UtYXR0YWNobWVudCc6ICdyZXBsYWNlQXR0YWNobWVudCcsXG5cdFx0J2NsaWNrIC5hZHZhbmNlZC10b2dnbGUnOiAnb25Ub2dnbGVBZHZhbmNlZCcsXG5cdFx0J2NoYW5nZSBbZGF0YS1zZXR0aW5nPVwiY3VzdG9tV2lkdGhcIl0nOiAnb25DdXN0b21TaXplJyxcblx0XHQnY2hhbmdlIFtkYXRhLXNldHRpbmc9XCJjdXN0b21IZWlnaHRcIl0nOiAnb25DdXN0b21TaXplJyxcblx0XHQna2V5dXAgW2RhdGEtc2V0dGluZz1cImN1c3RvbVdpZHRoXCJdJzogJ29uQ3VzdG9tU2l6ZScsXG5cdFx0J2tleXVwIFtkYXRhLXNldHRpbmc9XCJjdXN0b21IZWlnaHRcIl0nOiAnb25DdXN0b21TaXplJ1xuXHR9ICksXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHVzZWQgaW4gQXR0YWNobWVudERpc3BsYXkucHJvdG90eXBlLnVwZGF0ZUxpbmtUb1xuXHRcdHRoaXMub3B0aW9ucy5hdHRhY2htZW50ID0gdGhpcy5tb2RlbC5hdHRhY2htZW50O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6dXJsJywgdGhpcy51cGRhdGVVcmwgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOmxpbmsnLCB0aGlzLnRvZ2dsZUxpbmtTZXR0aW5ncyApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6c2l6ZScsIHRoaXMudG9nZ2xlQ3VzdG9tU2l6ZSApO1xuXG5cdFx0QXR0YWNobWVudERpc3BsYXkucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhdHRhY2htZW50ID0gZmFsc2U7XG5cblx0XHRpZiAoIHRoaXMubW9kZWwuYXR0YWNobWVudCApIHtcblx0XHRcdGF0dGFjaG1lbnQgPSB0aGlzLm1vZGVsLmF0dGFjaG1lbnQudG9KU09OKCk7XG5cdFx0fVxuXHRcdHJldHVybiBfLmRlZmF1bHRzKHtcblx0XHRcdG1vZGVsOiB0aGlzLm1vZGVsLnRvSlNPTigpLFxuXHRcdFx0YXR0YWNobWVudDogYXR0YWNobWVudFxuXHRcdH0sIHRoaXMub3B0aW9ucyApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHM7XG5cblx0XHRpZiAoIHRoaXMubW9kZWwuYXR0YWNobWVudCAmJiAncGVuZGluZycgPT09IHRoaXMubW9kZWwuZGZkLnN0YXRlKCkgKSB7XG5cdFx0XHR0aGlzLm1vZGVsLmRmZFxuXHRcdFx0XHQuZG9uZSggXy5iaW5kKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRBdHRhY2htZW50RGlzcGxheS5wcm90b3R5cGUucmVuZGVyLmFwcGx5KCB0aGlzLCBhcmdzICk7XG5cdFx0XHRcdFx0dGhpcy5wb3N0UmVuZGVyKCk7XG5cdFx0XHRcdH0sIHRoaXMgKSApXG5cdFx0XHRcdC5mYWlsKCBfLmJpbmQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRoaXMubW9kZWwuYXR0YWNobWVudCA9IGZhbHNlO1xuXHRcdFx0XHRcdEF0dGFjaG1lbnREaXNwbGF5LnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcblx0XHRcdFx0XHR0aGlzLnBvc3RSZW5kZXIoKTtcblx0XHRcdFx0fSwgdGhpcyApICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdEF0dGFjaG1lbnREaXNwbGF5LnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdFx0dGhpcy5wb3N0UmVuZGVyKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cG9zdFJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0c2V0VGltZW91dCggXy5iaW5kKCB0aGlzLnJlc2V0Rm9jdXMsIHRoaXMgKSwgMTAgKTtcblx0XHR0aGlzLnRvZ2dsZUxpbmtTZXR0aW5ncygpO1xuXHRcdGlmICggd2luZG93LmdldFVzZXJTZXR0aW5nKCAnYWR2SW1nRGV0YWlscycgKSA9PT0gJ3Nob3cnICkge1xuXHRcdFx0dGhpcy50b2dnbGVBZHZhbmNlZCggdHJ1ZSApO1xuXHRcdH1cblx0XHR0aGlzLnRyaWdnZXIoICdwb3N0LXJlbmRlcicgKTtcblx0fSxcblxuXHRyZXNldEZvY3VzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiQoICcubGluay10by1jdXN0b20nICkuYmx1cigpO1xuXHRcdHRoaXMuJCggJy5lbWJlZC1tZWRpYS1zZXR0aW5ncycgKS5zY3JvbGxUb3AoIDAgKTtcblx0fSxcblxuXHR1cGRhdGVVcmw6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJCggJy5pbWFnZSBpbWcnICkuYXR0ciggJ3NyYycsIHRoaXMubW9kZWwuZ2V0KCAndXJsJyApICk7XG5cdFx0dGhpcy4kKCAnLnVybCcgKS52YWwoIHRoaXMubW9kZWwuZ2V0KCAndXJsJyApICk7XG5cdH0sXG5cblx0dG9nZ2xlTGlua1NldHRpbmdzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMubW9kZWwuZ2V0KCAnbGluaycgKSA9PT0gJ25vbmUnICkge1xuXHRcdFx0dGhpcy4kKCAnLmxpbmstc2V0dGluZ3MnICkuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiQoICcubGluay1zZXR0aW5ncycgKS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG5cdFx0fVxuXHR9LFxuXG5cdHRvZ2dsZUN1c3RvbVNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5tb2RlbC5nZXQoICdzaXplJyApICE9PSAnY3VzdG9tJyApIHtcblx0XHRcdHRoaXMuJCggJy5jdXN0b20tc2l6ZScgKS5hZGRDbGFzcygnaGlkZGVuJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJCggJy5jdXN0b20tc2l6ZScgKS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uQ3VzdG9tU2l6ZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBkaW1lbnNpb24gPSAkKCBldmVudC50YXJnZXQgKS5kYXRhKCdzZXR0aW5nJyksXG5cdFx0XHRudW0gPSAkKCBldmVudC50YXJnZXQgKS52YWwoKSxcblx0XHRcdHZhbHVlO1xuXG5cdFx0Ly8gSWdub3JlIGJvZ3VzIGlucHV0XG5cdFx0aWYgKCAhIC9eXFxkKy8udGVzdCggbnVtICkgfHwgcGFyc2VJbnQoIG51bSwgMTAgKSA8IDEgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggZGltZW5zaW9uID09PSAnY3VzdG9tV2lkdGgnICkge1xuXHRcdFx0dmFsdWUgPSBNYXRoLnJvdW5kKCAxIC8gdGhpcy5tb2RlbC5nZXQoICdhc3BlY3RSYXRpbycgKSAqIG51bSApO1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoICdjdXN0b21IZWlnaHQnLCB2YWx1ZSwgeyBzaWxlbnQ6IHRydWUgfSApO1xuXHRcdFx0dGhpcy4kKCAnW2RhdGEtc2V0dGluZz1cImN1c3RvbUhlaWdodFwiXScgKS52YWwoIHZhbHVlICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhbHVlID0gTWF0aC5yb3VuZCggdGhpcy5tb2RlbC5nZXQoICdhc3BlY3RSYXRpbycgKSAqIG51bSApO1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoICdjdXN0b21XaWR0aCcsIHZhbHVlLCB7IHNpbGVudDogdHJ1ZSAgfSApO1xuXHRcdFx0dGhpcy4kKCAnW2RhdGEtc2V0dGluZz1cImN1c3RvbVdpZHRoXCJdJyApLnZhbCggdmFsdWUgKTtcblx0XHR9XG5cdH0sXG5cblx0b25Ub2dnbGVBZHZhbmNlZDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy50b2dnbGVBZHZhbmNlZCgpO1xuXHR9LFxuXG5cdHRvZ2dsZUFkdmFuY2VkOiBmdW5jdGlvbiggc2hvdyApIHtcblx0XHR2YXIgJGFkdmFuY2VkID0gdGhpcy4kZWwuZmluZCggJy5hZHZhbmNlZC1zZWN0aW9uJyApLFxuXHRcdFx0bW9kZTtcblxuXHRcdGlmICggJGFkdmFuY2VkLmhhc0NsYXNzKCdhZHZhbmNlZC12aXNpYmxlJykgfHwgc2hvdyA9PT0gZmFsc2UgKSB7XG5cdFx0XHQkYWR2YW5jZWQucmVtb3ZlQ2xhc3MoJ2FkdmFuY2VkLXZpc2libGUnKTtcblx0XHRcdCRhZHZhbmNlZC5maW5kKCcuYWR2YW5jZWQtc2V0dGluZ3MnKS5hZGRDbGFzcygnaGlkZGVuJyk7XG5cdFx0XHRtb2RlID0gJ2hpZGUnO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkYWR2YW5jZWQuYWRkQ2xhc3MoJ2FkdmFuY2VkLXZpc2libGUnKTtcblx0XHRcdCRhZHZhbmNlZC5maW5kKCcuYWR2YW5jZWQtc2V0dGluZ3MnKS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG5cdFx0XHRtb2RlID0gJ3Nob3cnO1xuXHRcdH1cblxuXHRcdHdpbmRvdy5zZXRVc2VyU2V0dGluZyggJ2FkdkltZ0RldGFpbHMnLCBtb2RlICk7XG5cdH0sXG5cblx0ZWRpdEF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgZWRpdFN0YXRlID0gdGhpcy5jb250cm9sbGVyLnN0YXRlcy5nZXQoICdlZGl0LWltYWdlJyApO1xuXG5cdFx0aWYgKCB3aW5kb3cuaW1hZ2VFZGl0ICYmIGVkaXRTdGF0ZSApIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRlZGl0U3RhdGUuc2V0KCAnaW1hZ2UnLCB0aGlzLm1vZGVsLmF0dGFjaG1lbnQgKTtcblx0XHRcdHRoaXMuY29udHJvbGxlci5zZXRTdGF0ZSggJ2VkaXQtaW1hZ2UnICk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlcGxhY2VBdHRhY2htZW50OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIuc2V0U3RhdGUoICdyZXBsYWNlLWltYWdlJyApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZURldGFpbHM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTGFiZWxcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIExhYmVsID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAnbGFiZWwnLFxuXHRjbGFzc05hbWU6ICdzY3JlZW4tcmVhZGVyLXRleHQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudmFsdWUgPSB0aGlzLm9wdGlvbnMudmFsdWU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLnZhbHVlICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGFiZWw7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZVxuICpcbiAqIFRoZSBmcmFtZSB1c2VkIHRvIGNyZWF0ZSB0aGUgbWVkaWEgbW9kYWwuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5GcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICogQG1peGVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lXG4gKi9cbnZhciBGcmFtZSA9IHdwLm1lZGlhLnZpZXcuRnJhbWUsXG5cdCQgPSBqUXVlcnksXG5cdE1lZGlhRnJhbWU7XG5cbk1lZGlhRnJhbWUgPSBGcmFtZS5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdtZWRpYS1mcmFtZScsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ21lZGlhLWZyYW1lJyksXG5cdHJlZ2lvbnM6ICAgWydtZW51JywndGl0bGUnLCdjb250ZW50JywndG9vbGJhcicsJ3JvdXRlciddLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayBkaXYubWVkaWEtZnJhbWUtdGl0bGUgaDEnOiAndG9nZ2xlTWVudSdcblx0fSxcblxuXHQvKipcblx0ICogQGdsb2JhbCB3cC5VcGxvYWRlclxuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0RnJhbWUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0Xy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLCB7XG5cdFx0XHR0aXRsZTogICAgJycsXG5cdFx0XHRtb2RhbDogICAgdHJ1ZSxcblx0XHRcdHVwbG9hZGVyOiB0cnVlXG5cdFx0fSk7XG5cblx0XHQvLyBFbnN1cmUgY29yZSBVSSBpcyBlbmFibGVkLlxuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCd3cC1jb3JlLXVpJyk7XG5cblx0XHQvLyBJbml0aWFsaXplIG1vZGFsIGNvbnRhaW5lciB2aWV3LlxuXHRcdGlmICggdGhpcy5vcHRpb25zLm1vZGFsICkge1xuXHRcdFx0dGhpcy5tb2RhbCA9IG5ldyB3cC5tZWRpYS52aWV3Lk1vZGFsKHtcblx0XHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdFx0dGl0bGU6ICAgICAgdGhpcy5vcHRpb25zLnRpdGxlXG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5tb2RhbC5jb250ZW50KCB0aGlzICk7XG5cdFx0fVxuXG5cdFx0Ly8gRm9yY2UgdGhlIHVwbG9hZGVyIG9mZiBpZiB0aGUgdXBsb2FkIGxpbWl0IGhhcyBiZWVuIGV4Y2VlZGVkIG9yXG5cdFx0Ly8gaWYgdGhlIGJyb3dzZXIgaXNuJ3Qgc3VwcG9ydGVkLlxuXHRcdGlmICggd3AuVXBsb2FkZXIubGltaXRFeGNlZWRlZCB8fCAhIHdwLlVwbG9hZGVyLmJyb3dzZXIuc3VwcG9ydGVkICkge1xuXHRcdFx0dGhpcy5vcHRpb25zLnVwbG9hZGVyID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB3aW5kb3ctd2lkZSB1cGxvYWRlci5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy51cGxvYWRlciApIHtcblx0XHRcdHRoaXMudXBsb2FkZXIgPSBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlcldpbmRvdyh7XG5cdFx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRcdHVwbG9hZGVyOiB7XG5cdFx0XHRcdFx0ZHJvcHpvbmU6ICB0aGlzLm1vZGFsID8gdGhpcy5tb2RhbC4kZWwgOiB0aGlzLiRlbCxcblx0XHRcdFx0XHRjb250YWluZXI6IHRoaXMuJGVsXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0dGhpcy52aWV3cy5zZXQoICcubWVkaWEtZnJhbWUtdXBsb2FkZXInLCB0aGlzLnVwbG9hZGVyICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5vbiggJ2F0dGFjaCcsIF8uYmluZCggdGhpcy52aWV3cy5yZWFkeSwgdGhpcy52aWV3cyApLCB0aGlzICk7XG5cblx0XHQvLyBCaW5kIGRlZmF1bHQgdGl0bGUgY3JlYXRpb24uXG5cdFx0dGhpcy5vbiggJ3RpdGxlOmNyZWF0ZTpkZWZhdWx0JywgdGhpcy5jcmVhdGVUaXRsZSwgdGhpcyApO1xuXHRcdHRoaXMudGl0bGUubW9kZSgnZGVmYXVsdCcpO1xuXG5cdFx0dGhpcy5vbiggJ3RpdGxlOnJlbmRlcicsIGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdFx0dmlldy4kZWwuYXBwZW5kKCAnPHNwYW4gY2xhc3M9XCJkYXNoaWNvbnMgZGFzaGljb25zLWFycm93LWRvd25cIj48L3NwYW4+JyApO1xuXHRcdH0pO1xuXG5cdFx0Ly8gQmluZCBkZWZhdWx0IG1lbnUuXG5cdFx0dGhpcy5vbiggJ21lbnU6Y3JlYXRlOmRlZmF1bHQnLCB0aGlzLmNyZWF0ZU1lbnUsIHRoaXMgKTtcblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWV9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEFjdGl2YXRlIHRoZSBkZWZhdWx0IHN0YXRlIGlmIG5vIGFjdGl2ZSBzdGF0ZSBleGlzdHMuXG5cdFx0aWYgKCAhIHRoaXMuc3RhdGUoKSAmJiB0aGlzLm9wdGlvbnMuc3RhdGUgKSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKCB0aGlzLm9wdGlvbnMuc3RhdGUgKTtcblx0XHR9XG5cdFx0LyoqXG5cdFx0ICogY2FsbCAncmVuZGVyJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0cmV0dXJuIEZyYW1lLnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IHRpdGxlXG5cdCAqIEB0aGlzIHdwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uXG5cdCAqL1xuXHRjcmVhdGVUaXRsZTogZnVuY3Rpb24oIHRpdGxlICkge1xuXHRcdHRpdGxlLnZpZXcgPSBuZXcgd3AubWVkaWEuVmlldyh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0dGFnTmFtZTogJ2gxJ1xuXHRcdH0pO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IG1lbnVcblx0ICogQHRoaXMgd3AubWVkaWEuY29udHJvbGxlci5SZWdpb25cblx0ICovXG5cdGNyZWF0ZU1lbnU6IGZ1bmN0aW9uKCBtZW51ICkge1xuXHRcdG1lbnUudmlldyA9IG5ldyB3cC5tZWRpYS52aWV3Lk1lbnUoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpc1xuXHRcdH0pO1xuXHR9LFxuXG5cdHRvZ2dsZU1lbnU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmZpbmQoICcubWVkaWEtbWVudScgKS50b2dnbGVDbGFzcyggJ3Zpc2libGUnICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSB0b29sYmFyXG5cdCAqIEB0aGlzIHdwLm1lZGlhLmNvbnRyb2xsZXIuUmVnaW9uXG5cdCAqL1xuXHRjcmVhdGVUb29sYmFyOiBmdW5jdGlvbiggdG9vbGJhciApIHtcblx0XHR0b29sYmFyLnZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5Ub29sYmFyKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXNcblx0XHR9KTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSByb3V0ZXJcblx0ICogQHRoaXMgd3AubWVkaWEuY29udHJvbGxlci5SZWdpb25cblx0ICovXG5cdGNyZWF0ZVJvdXRlcjogZnVuY3Rpb24oIHJvdXRlciApIHtcblx0XHRyb3V0ZXIudmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LlJvdXRlcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzXG5cdFx0fSk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKi9cblx0Y3JlYXRlSWZyYW1lU3RhdGVzOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR2YXIgc2V0dGluZ3MgPSB3cC5tZWRpYS52aWV3LnNldHRpbmdzLFxuXHRcdFx0dGFicyA9IHNldHRpbmdzLnRhYnMsXG5cdFx0XHR0YWJVcmwgPSBzZXR0aW5ncy50YWJVcmwsXG5cdFx0XHQkcG9zdElkO1xuXG5cdFx0aWYgKCAhIHRhYnMgfHwgISB0YWJVcmwgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gQWRkIHRoZSBwb3N0IElEIHRvIHRoZSB0YWIgVVJMIGlmIGl0IGV4aXN0cy5cblx0XHQkcG9zdElkID0gJCgnI3Bvc3RfSUQnKTtcblx0XHRpZiAoICRwb3N0SWQubGVuZ3RoICkge1xuXHRcdFx0dGFiVXJsICs9ICcmcG9zdF9pZD0nICsgJHBvc3RJZC52YWwoKTtcblx0XHR9XG5cblx0XHQvLyBHZW5lcmF0ZSB0aGUgdGFiIHN0YXRlcy5cblx0XHRfLmVhY2goIHRhYnMsIGZ1bmN0aW9uKCB0aXRsZSwgaWQgKSB7XG5cdFx0XHR0aGlzLnN0YXRlKCAnaWZyYW1lOicgKyBpZCApLnNldCggXy5kZWZhdWx0cyh7XG5cdFx0XHRcdHRhYjogICAgIGlkLFxuXHRcdFx0XHRzcmM6ICAgICB0YWJVcmwgKyAnJnRhYj0nICsgaWQsXG5cdFx0XHRcdHRpdGxlOiAgIHRpdGxlLFxuXHRcdFx0XHRjb250ZW50OiAnaWZyYW1lJyxcblx0XHRcdFx0bWVudTogICAgJ2RlZmF1bHQnXG5cdFx0XHR9LCBvcHRpb25zICkgKTtcblx0XHR9LCB0aGlzICk7XG5cblx0XHR0aGlzLm9uKCAnY29udGVudDpjcmVhdGU6aWZyYW1lJywgdGhpcy5pZnJhbWVDb250ZW50LCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NvbnRlbnQ6ZGVhY3RpdmF0ZTppZnJhbWUnLCB0aGlzLmlmcmFtZUNvbnRlbnRDbGVhbnVwLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ21lbnU6cmVuZGVyOmRlZmF1bHQnLCB0aGlzLmlmcmFtZU1lbnUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnb3BlbicsIHRoaXMuaGlqYWNrVGhpY2tib3gsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnY2xvc2UnLCB0aGlzLnJlc3RvcmVUaGlja2JveCwgdGhpcyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gY29udGVudFxuXHQgKiBAdGhpcyB3cC5tZWRpYS5jb250cm9sbGVyLlJlZ2lvblxuXHQgKi9cblx0aWZyYW1lQ29udGVudDogZnVuY3Rpb24oIGNvbnRlbnQgKSB7XG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoJ2hpZGUtdG9vbGJhcicpO1xuXHRcdGNvbnRlbnQudmlldyA9IG5ldyB3cC5tZWRpYS52aWV3LklmcmFtZSh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzXG5cdFx0fSk7XG5cdH0sXG5cblx0aWZyYW1lQ29udGVudENsZWFudXA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCdoaWRlLXRvb2xiYXInKTtcblx0fSxcblxuXHRpZnJhbWVNZW51OiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2YXIgdmlld3MgPSB7fTtcblxuXHRcdGlmICggISB2aWV3ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdF8uZWFjaCggd3AubWVkaWEudmlldy5zZXR0aW5ncy50YWJzLCBmdW5jdGlvbiggdGl0bGUsIGlkICkge1xuXHRcdFx0dmlld3NbICdpZnJhbWU6JyArIGlkIF0gPSB7XG5cdFx0XHRcdHRleHQ6IHRoaXMuc3RhdGUoICdpZnJhbWU6JyArIGlkICkuZ2V0KCd0aXRsZScpLFxuXHRcdFx0XHRwcmlvcml0eTogMjAwXG5cdFx0XHR9O1xuXHRcdH0sIHRoaXMgKTtcblxuXHRcdHZpZXcuc2V0KCB2aWV3cyApO1xuXHR9LFxuXG5cdGhpamFja1RoaWNrYm94OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZnJhbWUgPSB0aGlzO1xuXG5cdFx0aWYgKCAhIHdpbmRvdy50Yl9yZW1vdmUgfHwgdGhpcy5fdGJfcmVtb3ZlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX3RiX3JlbW92ZSA9IHdpbmRvdy50Yl9yZW1vdmU7XG5cdFx0d2luZG93LnRiX3JlbW92ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZnJhbWUuY2xvc2UoKTtcblx0XHRcdGZyYW1lLnJlc2V0KCk7XG5cdFx0XHRmcmFtZS5zZXRTdGF0ZSggZnJhbWUub3B0aW9ucy5zdGF0ZSApO1xuXHRcdFx0ZnJhbWUuX3RiX3JlbW92ZS5jYWxsKCB3aW5kb3cgKTtcblx0XHR9O1xuXHR9LFxuXG5cdHJlc3RvcmVUaGlja2JveDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAhIHRoaXMuX3RiX3JlbW92ZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR3aW5kb3cudGJfcmVtb3ZlID0gdGhpcy5fdGJfcmVtb3ZlO1xuXHRcdGRlbGV0ZSB0aGlzLl90Yl9yZW1vdmU7XG5cdH1cbn0pO1xuXG4vLyBNYXAgc29tZSBvZiB0aGUgbW9kYWwncyBtZXRob2RzIHRvIHRoZSBmcmFtZS5cbl8uZWFjaChbJ29wZW4nLCdjbG9zZScsJ2F0dGFjaCcsJ2RldGFjaCcsJ2VzY2FwZSddLCBmdW5jdGlvbiggbWV0aG9kICkge1xuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZX0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdE1lZGlhRnJhbWUucHJvdG90eXBlWyBtZXRob2QgXSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5tb2RhbCApIHtcblx0XHRcdHRoaXMubW9kYWxbIG1ldGhvZCBdLmFwcGx5KCB0aGlzLm1vZGFsLCBhcmd1bWVudHMgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZWRpYUZyYW1lO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lbnVJdGVtXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciAkID0galF1ZXJ5LFxuXHRNZW51SXRlbTtcblxuTWVudUl0ZW0gPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2EnLFxuXHRjbGFzc05hbWU6ICdtZWRpYS1tZW51LWl0ZW0nLFxuXG5cdGF0dHJpYnV0ZXM6IHtcblx0XHRocmVmOiAnIydcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnX2NsaWNrJ1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRfY2xpY2s6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgY2xpY2tPdmVycmlkZSA9IHRoaXMub3B0aW9ucy5jbGljaztcblxuXHRcdGlmICggZXZlbnQgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdGlmICggY2xpY2tPdmVycmlkZSApIHtcblx0XHRcdGNsaWNrT3ZlcnJpZGUuY2FsbCggdGhpcyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmNsaWNrKCk7XG5cdFx0fVxuXG5cdFx0Ly8gV2hlbiBzZWxlY3RpbmcgYSB0YWIgYWxvbmcgdGhlIGxlZnQgc2lkZSxcblx0XHQvLyBmb2N1cyBzaG91bGQgYmUgdHJhbnNmZXJyZWQgaW50byB0aGUgbWFpbiBwYW5lbFxuXHRcdGlmICggISB3cC5tZWRpYS5pc1RvdWNoRGV2aWNlICkge1xuXHRcdFx0JCgnLm1lZGlhLWZyYW1lLWNvbnRlbnQgaW5wdXQnKS5maXJzdCgpLmZvY3VzKCk7XG5cdFx0fVxuXHR9LFxuXG5cdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3RhdGUgPSB0aGlzLm9wdGlvbnMuc3RhdGU7XG5cblx0XHRpZiAoIHN0YXRlICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLnNldFN0YXRlKCBzdGF0ZSApO1xuXHRcdFx0dGhpcy52aWV3cy5wYXJlbnQuJGVsLnJlbW92ZUNsYXNzKCAndmlzaWJsZScgKTsgLy8gVE9ETzogb3IgaGlkZSBvbiBhbnkgY2xpY2ssIHNlZSBiZWxvd1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3Lk1lbnVJdGVtfSByZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdGlmICggb3B0aW9ucy50ZXh0ICkge1xuXHRcdFx0dGhpcy4kZWwudGV4dCggb3B0aW9ucy50ZXh0ICk7XG5cdFx0fSBlbHNlIGlmICggb3B0aW9ucy5odG1sICkge1xuXHRcdFx0dGhpcy4kZWwuaHRtbCggb3B0aW9ucy5odG1sICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVJdGVtO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lbnVcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgTWVudUl0ZW0gPSB3cC5tZWRpYS52aWV3Lk1lbnVJdGVtLFxuXHRQcmlvcml0eUxpc3QgPSB3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdCxcblx0TWVudTtcblxuTWVudSA9IFByaW9yaXR5TGlzdC5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdkaXYnLFxuXHRjbGFzc05hbWU6ICdtZWRpYS1tZW51Jyxcblx0cHJvcGVydHk6ICAnc3RhdGUnLFxuXHRJdGVtVmlldzogIE1lbnVJdGVtLFxuXHRyZWdpb246ICAgICdtZW51JyxcblxuXHQvKiBUT0RPOiBhbHRlcm5hdGl2ZWx5IGhpZGUgb24gYW55IGNsaWNrIGFueXdoZXJlXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdjbGljaydcblx0fSxcblxuXHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICd2aXNpYmxlJyApO1xuXHR9LFxuXHQqL1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gaWRcblx0ICogQHJldHVybnMge3dwLm1lZGlhLlZpZXd9XG5cdCAqL1xuXHR0b1ZpZXc6IGZ1bmN0aW9uKCBvcHRpb25zLCBpZCApIHtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRvcHRpb25zWyB0aGlzLnByb3BlcnR5IF0gPSBvcHRpb25zWyB0aGlzLnByb3BlcnR5IF0gfHwgaWQ7XG5cdFx0cmV0dXJuIG5ldyB0aGlzLkl0ZW1WaWV3KCBvcHRpb25zICkucmVuZGVyKCk7XG5cdH0sXG5cblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ3JlYWR5JyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0UHJpb3JpdHlMaXN0LnByb3RvdHlwZS5yZWFkeS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy52aXNpYmlsaXR5KCk7XG5cdH0sXG5cblx0c2V0OiBmdW5jdGlvbigpIHtcblx0XHQvKipcblx0XHQgKiBjYWxsICdzZXQnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3Ncblx0XHQgKi9cblx0XHRQcmlvcml0eUxpc3QucHJvdG90eXBlLnNldC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy52aXNpYmlsaXR5KCk7XG5cdH0sXG5cblx0dW5zZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ3Vuc2V0JyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0UHJpb3JpdHlMaXN0LnByb3RvdHlwZS51bnNldC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy52aXNpYmlsaXR5KCk7XG5cdH0sXG5cblx0dmlzaWJpbGl0eTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlZ2lvbiA9IHRoaXMucmVnaW9uLFxuXHRcdFx0dmlldyA9IHRoaXMuY29udHJvbGxlclsgcmVnaW9uIF0uZ2V0KCksXG5cdFx0XHR2aWV3cyA9IHRoaXMudmlld3MuZ2V0KCksXG5cdFx0XHRoaWRlID0gISB2aWV3cyB8fCB2aWV3cy5sZW5ndGggPCAyO1xuXG5cdFx0aWYgKCB0aGlzID09PSB2aWV3ICkge1xuXHRcdFx0dGhpcy5jb250cm9sbGVyLiRlbC50b2dnbGVDbGFzcyggJ2hpZGUtJyArIHJlZ2lvbiwgaGlkZSApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLmdldCggaWQgKTtcblxuXHRcdGlmICggISB2aWV3ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuZGVzZWxlY3QoKTtcblx0XHR2aWV3LiRlbC5hZGRDbGFzcygnYWN0aXZlJyk7XG5cdH0sXG5cblx0ZGVzZWxlY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmNoaWxkcmVuKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuXHR9LFxuXG5cdGhpZGU6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgdmlldyA9IHRoaXMuZ2V0KCBpZCApO1xuXG5cdFx0aWYgKCAhIHZpZXcgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmlldy4kZWwuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuXHR9LFxuXG5cdHNob3c6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgdmlldyA9IHRoaXMuZ2V0KCBpZCApO1xuXG5cdFx0aWYgKCAhIHZpZXcgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmlldy4kZWwucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW51O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1vZGFsXG4gKlxuICogQSBtb2RhbCB2aWV3LCB3aGljaCB0aGUgbWVkaWEgbW9kYWwgdXNlcyBhcyBpdHMgZGVmYXVsdCBjb250YWluZXIuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciAkID0galF1ZXJ5LFxuXHRNb2RhbDtcblxuTW9kYWwgPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAnZGl2Jyxcblx0dGVtcGxhdGU6IHdwLnRlbXBsYXRlKCdtZWRpYS1tb2RhbCcpLFxuXG5cdGF0dHJpYnV0ZXM6IHtcblx0XHR0YWJpbmRleDogMFxuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayAubWVkaWEtbW9kYWwtYmFja2Ryb3AsIC5tZWRpYS1tb2RhbC1jbG9zZSc6ICdlc2NhcGVIYW5kbGVyJyxcblx0XHQna2V5ZG93bic6ICdrZXlkb3duJ1xuXHR9LFxuXG5cdGNsaWNrZWRPcGVuZXJFbDogbnVsbCxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdGNvbnRhaW5lcjogZG9jdW1lbnQuYm9keSxcblx0XHRcdHRpdGxlOiAgICAgJycsXG5cdFx0XHRwcm9wYWdhdGU6IHRydWUsXG5cdFx0XHRmcmVlemU6ICAgIHRydWVcblx0XHR9KTtcblxuXHRcdHRoaXMuZm9jdXNNYW5hZ2VyID0gbmV3IHdwLm1lZGlhLnZpZXcuRm9jdXNNYW5hZ2VyKHtcblx0XHRcdGVsOiB0aGlzLmVsXG5cdFx0fSk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7T2JqZWN0fVxuXHQgKi9cblx0cHJlcGFyZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHRpdGxlOiB0aGlzLm9wdGlvbnMudGl0bGVcblx0XHR9O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Nb2RhbH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGF0dGFjaDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLnZpZXdzLmF0dGFjaGVkICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIHRoaXMudmlld3MucmVuZGVyZWQgKSB7XG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH1cblxuXHRcdHRoaXMuJGVsLmFwcGVuZFRvKCB0aGlzLm9wdGlvbnMuY29udGFpbmVyICk7XG5cblx0XHQvLyBNYW51YWxseSBtYXJrIHRoZSB2aWV3IGFzIGF0dGFjaGVkIGFuZCB0cmlnZ2VyIHJlYWR5LlxuXHRcdHRoaXMudmlld3MuYXR0YWNoZWQgPSB0cnVlO1xuXHRcdHRoaXMudmlld3MucmVhZHkoKTtcblxuXHRcdHJldHVybiB0aGlzLnByb3BhZ2F0ZSgnYXR0YWNoJyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3Lk1vZGFsfSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0ZGV0YWNoOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuJGVsLmlzKCc6dmlzaWJsZScpICkge1xuXHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdH1cblxuXHRcdHRoaXMuJGVsLmRldGFjaCgpO1xuXHRcdHRoaXMudmlld3MuYXR0YWNoZWQgPSBmYWxzZTtcblx0XHRyZXR1cm4gdGhpcy5wcm9wYWdhdGUoJ2RldGFjaCcpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Nb2RhbH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdG9wZW46IGZ1bmN0aW9uKCkge1xuXHRcdHZhciAkZWwgPSB0aGlzLiRlbCxcblx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHRtY2VFZGl0b3I7XG5cblx0XHRpZiAoICRlbC5pcygnOnZpc2libGUnKSApIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblxuXHRcdHRoaXMuY2xpY2tlZE9wZW5lckVsID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblxuXHRcdGlmICggISB0aGlzLnZpZXdzLmF0dGFjaGVkICkge1xuXHRcdFx0dGhpcy5hdHRhY2goKTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgYGZyZWV6ZWAgb3B0aW9uIGlzIHNldCwgcmVjb3JkIHRoZSB3aW5kb3cncyBzY3JvbGwgcG9zaXRpb24uXG5cdFx0aWYgKCBvcHRpb25zLmZyZWV6ZSApIHtcblx0XHRcdHRoaXMuX2ZyZWV6ZSA9IHtcblx0XHRcdFx0c2Nyb2xsVG9wOiAkKCB3aW5kb3cgKS5zY3JvbGxUb3AoKVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyBEaXNhYmxlIHBhZ2Ugc2Nyb2xsaW5nLlxuXHRcdCQoICdib2R5JyApLmFkZENsYXNzKCAnbW9kYWwtb3BlbicgKTtcblxuXHRcdCRlbC5zaG93KCk7XG5cblx0XHQvLyBUcnkgdG8gY2xvc2UgdGhlIG9uc2NyZWVuIGtleWJvYXJkXG5cdFx0aWYgKCAnb250b3VjaGVuZCcgaW4gZG9jdW1lbnQgKSB7XG5cdFx0XHRpZiAoICggbWNlRWRpdG9yID0gd2luZG93LnRpbnltY2UgJiYgd2luZG93LnRpbnltY2UuYWN0aXZlRWRpdG9yICkgICYmICEgbWNlRWRpdG9yLmlzSGlkZGVuKCkgJiYgbWNlRWRpdG9yLmlmcmFtZUVsZW1lbnQgKSB7XG5cdFx0XHRcdG1jZUVkaXRvci5pZnJhbWVFbGVtZW50LmZvY3VzKCk7XG5cdFx0XHRcdG1jZUVkaXRvci5pZnJhbWVFbGVtZW50LmJsdXIoKTtcblxuXHRcdFx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRtY2VFZGl0b3IuaWZyYW1lRWxlbWVudC5ibHVyKCk7XG5cdFx0XHRcdH0sIDEwMCApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuJGVsLmZvY3VzKCk7XG5cblx0XHRyZXR1cm4gdGhpcy5wcm9wYWdhdGUoJ29wZW4nKTtcblx0fSxcblxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuTW9kYWx9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRjbG9zZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dmFyIGZyZWV6ZSA9IHRoaXMuX2ZyZWV6ZTtcblxuXHRcdGlmICggISB0aGlzLnZpZXdzLmF0dGFjaGVkIHx8ICEgdGhpcy4kZWwuaXMoJzp2aXNpYmxlJykgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHQvLyBFbmFibGUgcGFnZSBzY3JvbGxpbmcuXG5cdFx0JCggJ2JvZHknICkucmVtb3ZlQ2xhc3MoICdtb2RhbC1vcGVuJyApO1xuXG5cdFx0Ly8gSGlkZSBtb2RhbCBhbmQgcmVtb3ZlIHJlc3RyaWN0ZWQgbWVkaWEgbW9kYWwgdGFiIGZvY3VzIG9uY2UgaXQncyBjbG9zZWRcblx0XHR0aGlzLiRlbC5oaWRlKCkudW5kZWxlZ2F0ZSggJ2tleWRvd24nICk7XG5cblx0XHQvLyBQdXQgZm9jdXMgYmFjayBpbiB1c2VmdWwgbG9jYXRpb24gb25jZSBtb2RhbCBpcyBjbG9zZWQuXG5cdFx0aWYgKCBudWxsICE9PSB0aGlzLmNsaWNrZWRPcGVuZXJFbCApIHtcblx0XHRcdHRoaXMuY2xpY2tlZE9wZW5lckVsLmZvY3VzKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQoICcjd3Bib2R5LWNvbnRlbnQnICkuZm9jdXMoKTtcblx0XHR9XG5cblx0XHR0aGlzLnByb3BhZ2F0ZSgnY2xvc2UnKTtcblxuXHRcdC8vIElmIHRoZSBgZnJlZXplYCBvcHRpb24gaXMgc2V0LCByZXN0b3JlIHRoZSBjb250YWluZXIncyBzY3JvbGwgcG9zaXRpb24uXG5cdFx0aWYgKCBmcmVlemUgKSB7XG5cdFx0XHQkKCB3aW5kb3cgKS5zY3JvbGxUb3AoIGZyZWV6ZS5zY3JvbGxUb3AgKTtcblx0XHR9XG5cblx0XHRpZiAoIG9wdGlvbnMgJiYgb3B0aW9ucy5lc2NhcGUgKSB7XG5cdFx0XHR0aGlzLnByb3BhZ2F0ZSgnZXNjYXBlJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Nb2RhbH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGVzY2FwZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY2xvc2UoeyBlc2NhcGU6IHRydWUgfSk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZXZlbnRcblx0ICovXG5cdGVzY2FwZUhhbmRsZXI6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMuZXNjYXBlKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBjb250ZW50IFZpZXdzIHRvIHJlZ2lzdGVyIHRvICcubWVkaWEtbW9kYWwtY29udGVudCdcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuTW9kYWx9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRjb250ZW50OiBmdW5jdGlvbiggY29udGVudCApIHtcblx0XHR0aGlzLnZpZXdzLnNldCggJy5tZWRpYS1tb2RhbC1jb250ZW50JywgY29udGVudCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBUcmlnZ2VycyBhIG1vZGFsIGV2ZW50IGFuZCBpZiB0aGUgYHByb3BhZ2F0ZWAgb3B0aW9uIGlzIHNldCxcblx0ICogZm9yd2FyZHMgZXZlbnRzIHRvIHRoZSBtb2RhbCdzIGNvbnRyb2xsZXIuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Nb2RhbH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHByb3BhZ2F0ZTogZnVuY3Rpb24oIGlkICkge1xuXHRcdHRoaXMudHJpZ2dlciggaWQgKTtcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLnByb3BhZ2F0ZSApIHtcblx0XHRcdHRoaXMuY29udHJvbGxlci50cmlnZ2VyKCBpZCApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRrZXlkb3duOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0Ly8gQ2xvc2UgdGhlIG1vZGFsIHdoZW4gZXNjYXBlIGlzIHByZXNzZWQuXG5cdFx0aWYgKCAyNyA9PT0gZXZlbnQud2hpY2ggJiYgdGhpcy4kZWwuaXMoJzp2aXNpYmxlJykgKSB7XG5cdFx0XHR0aGlzLmVzY2FwZSgpO1xuXHRcdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RhbDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5Qcmlvcml0eUxpc3RcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFByaW9yaXR5TGlzdCA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2JyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl92aWV3cyA9IHt9O1xuXG5cdFx0dGhpcy5zZXQoIF8uZXh0ZW5kKCB7fSwgdGhpcy5fdmlld3MsIHRoaXMub3B0aW9ucy52aWV3cyApLCB7IHNpbGVudDogdHJ1ZSB9KTtcblx0XHRkZWxldGUgdGhpcy5vcHRpb25zLnZpZXdzO1xuXG5cdFx0aWYgKCAhIHRoaXMub3B0aW9ucy5zaWxlbnQgKSB7XG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcGFyYW0ge3dwLm1lZGlhLlZpZXd8T2JqZWN0fSB2aWV3XG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdH0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHNldDogZnVuY3Rpb24oIGlkLCB2aWV3LCBvcHRpb25zICkge1xuXHRcdHZhciBwcmlvcml0eSwgdmlld3MsIGluZGV4O1xuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHQvLyBBY2NlcHQgYW4gb2JqZWN0IHdpdGggYW4gYGlkYCA6IGB2aWV3YCBtYXBwaW5nLlxuXHRcdGlmICggXy5pc09iamVjdCggaWQgKSApIHtcblx0XHRcdF8uZWFjaCggaWQsIGZ1bmN0aW9uKCB2aWV3LCBpZCApIHtcblx0XHRcdFx0dGhpcy5zZXQoIGlkLCB2aWV3ICk7XG5cdFx0XHR9LCB0aGlzICk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHRpZiAoICEgKHZpZXcgaW5zdGFuY2VvZiBCYWNrYm9uZS5WaWV3KSApIHtcblx0XHRcdHZpZXcgPSB0aGlzLnRvVmlldyggdmlldywgaWQsIG9wdGlvbnMgKTtcblx0XHR9XG5cdFx0dmlldy5jb250cm9sbGVyID0gdmlldy5jb250cm9sbGVyIHx8IHRoaXMuY29udHJvbGxlcjtcblxuXHRcdHRoaXMudW5zZXQoIGlkICk7XG5cblx0XHRwcmlvcml0eSA9IHZpZXcub3B0aW9ucy5wcmlvcml0eSB8fCAxMDtcblx0XHR2aWV3cyA9IHRoaXMudmlld3MuZ2V0KCkgfHwgW107XG5cblx0XHRfLmZpbmQoIHZpZXdzLCBmdW5jdGlvbiggZXhpc3RpbmcsIGkgKSB7XG5cdFx0XHRpZiAoIGV4aXN0aW5nLm9wdGlvbnMucHJpb3JpdHkgPiBwcmlvcml0eSApIHtcblx0XHRcdFx0aW5kZXggPSBpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuX3ZpZXdzWyBpZCBdID0gdmlldztcblx0XHR0aGlzLnZpZXdzLmFkZCggdmlldywge1xuXHRcdFx0YXQ6IF8uaXNOdW1iZXIoIGluZGV4ICkgPyBpbmRleCA6IHZpZXdzLmxlbmd0aCB8fCAwXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEuVmlld31cblx0ICovXG5cdGdldDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHJldHVybiB0aGlzLl92aWV3c1sgaWQgXTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5Qcmlvcml0eUxpc3R9XG5cdCAqL1xuXHR1bnNldDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHZhciB2aWV3ID0gdGhpcy5nZXQoIGlkICk7XG5cblx0XHRpZiAoIHZpZXcgKSB7XG5cdFx0XHR2aWV3LnJlbW92ZSgpO1xuXHRcdH1cblxuXHRcdGRlbGV0ZSB0aGlzLl92aWV3c1sgaWQgXTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5WaWV3fVxuXHQgKi9cblx0dG9WaWV3OiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHRyZXR1cm4gbmV3IHdwLm1lZGlhLlZpZXcoIG9wdGlvbnMgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJpb3JpdHlMaXN0O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlJvdXRlckl0ZW1cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lbnVJdGVtXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBSb3V0ZXJJdGVtID0gd3AubWVkaWEudmlldy5NZW51SXRlbS5leHRlbmQoe1xuXHQvKipcblx0ICogT24gY2xpY2sgaGFuZGxlciB0byBhY3RpdmF0ZSB0aGUgY29udGVudCByZWdpb24ncyBjb3JyZXNwb25kaW5nIG1vZGUuXG5cdCAqL1xuXHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRlbnRNb2RlID0gdGhpcy5vcHRpb25zLmNvbnRlbnRNb2RlO1xuXHRcdGlmICggY29udGVudE1vZGUgKSB7XG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIuY29udGVudC5tb2RlKCBjb250ZW50TW9kZSApO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVySXRlbTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5Sb3V0ZXJcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3Lk1lbnVcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlByaW9yaXR5TGlzdFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgTWVudSA9IHdwLm1lZGlhLnZpZXcuTWVudSxcblx0Um91dGVyO1xuXG5Sb3V0ZXIgPSBNZW51LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2RpdicsXG5cdGNsYXNzTmFtZTogJ21lZGlhLXJvdXRlcicsXG5cdHByb3BlcnR5OiAgJ2NvbnRlbnRNb2RlJyxcblx0SXRlbVZpZXc6ICB3cC5tZWRpYS52aWV3LlJvdXRlckl0ZW0sXG5cdHJlZ2lvbjogICAgJ3JvdXRlcicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnY29udGVudDpyZW5kZXInLCB0aGlzLnVwZGF0ZSwgdGhpcyApO1xuXHRcdC8vIENhbGwgJ2luaXRpYWxpemUnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3MuXG5cdFx0TWVudS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0dXBkYXRlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbW9kZSA9IHRoaXMuY29udHJvbGxlci5jb250ZW50Lm1vZGUoKTtcblx0XHRpZiAoIG1vZGUgKSB7XG5cdFx0XHR0aGlzLnNlbGVjdCggbW9kZSApO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVyO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlNlYXJjaFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgbDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0U2VhcmNoO1xuXG5TZWFyY2ggPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2lucHV0Jyxcblx0Y2xhc3NOYW1lOiAnc2VhcmNoJyxcblx0aWQ6ICAgICAgICAnbWVkaWEtc2VhcmNoLWlucHV0JyxcblxuXHRhdHRyaWJ1dGVzOiB7XG5cdFx0dHlwZTogICAgICAgICdzZWFyY2gnLFxuXHRcdHBsYWNlaG9sZGVyOiBsMTBuLnNlYXJjaE1lZGlhUGxhY2Vob2xkZXJcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnaW5wdXQnOiAgJ3NlYXJjaCcsXG5cdFx0J2tleXVwJzogICdzZWFyY2gnLFxuXHRcdCdjaGFuZ2UnOiAnc2VhcmNoJyxcblx0XHQnc2VhcmNoJzogJ3NlYXJjaCdcblx0fSxcblxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuU2VhcmNofSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVsLnZhbHVlID0gdGhpcy5tb2RlbC5lc2NhcGUoJ3NlYXJjaCcpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHNlYXJjaDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQudGFyZ2V0LnZhbHVlICkge1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoICdzZWFyY2gnLCBldmVudC50YXJnZXQudmFsdWUgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5tb2RlbC51bnNldCgnc2VhcmNoJyk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2g7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuU2VsZWN0aW9uXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRTZWxlY3Rpb247XG5cblNlbGVjdGlvbiA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2Jyxcblx0Y2xhc3NOYW1lOiAnbWVkaWEtc2VsZWN0aW9uJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgnbWVkaWEtc2VsZWN0aW9uJyksXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIC5lZGl0LXNlbGVjdGlvbic6ICAnZWRpdCcsXG5cdFx0J2NsaWNrIC5jbGVhci1zZWxlY3Rpb24nOiAnY2xlYXInXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Xy5kZWZhdWx0cyggdGhpcy5vcHRpb25zLCB7XG5cdFx0XHRlZGl0YWJsZTogIGZhbHNlLFxuXHRcdFx0Y2xlYXJhYmxlOiB0cnVlXG5cdFx0fSk7XG5cblx0XHQvKipcblx0XHQgKiBAbWVtYmVyIHt3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnRzLlNlbGVjdGlvbn1cblx0XHQgKi9cblx0XHR0aGlzLmF0dGFjaG1lbnRzID0gbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudHMuU2VsZWN0aW9uKHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuY29udHJvbGxlcixcblx0XHRcdGNvbGxlY3Rpb246IHRoaXMuY29sbGVjdGlvbixcblx0XHRcdHNlbGVjdGlvbjogIHRoaXMuY29sbGVjdGlvbixcblx0XHRcdG1vZGVsOiAgICAgIG5ldyBCYWNrYm9uZS5Nb2RlbCgpXG5cdFx0fSk7XG5cblx0XHR0aGlzLnZpZXdzLnNldCggJy5zZWxlY3Rpb24tdmlldycsIHRoaXMuYXR0YWNobWVudHMgKTtcblx0XHR0aGlzLmNvbGxlY3Rpb24ub24oICdhZGQgcmVtb3ZlIHJlc2V0JywgdGhpcy5yZWZyZXNoLCB0aGlzICk7XG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnY29udGVudDphY3RpdmF0ZScsIHRoaXMucmVmcmVzaCwgdGhpcyApO1xuXHR9LFxuXG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJlZnJlc2goKTtcblx0fSxcblxuXHRyZWZyZXNoOiBmdW5jdGlvbigpIHtcblx0XHQvLyBJZiB0aGUgc2VsZWN0aW9uIGhhc24ndCBiZWVuIHJlbmRlcmVkLCBiYWlsLlxuXHRcdGlmICggISB0aGlzLiRlbC5jaGlsZHJlbigpLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgY29sbGVjdGlvbiA9IHRoaXMuY29sbGVjdGlvbixcblx0XHRcdGVkaXRpbmcgPSAnZWRpdC1zZWxlY3Rpb24nID09PSB0aGlzLmNvbnRyb2xsZXIuY29udGVudC5tb2RlKCk7XG5cblx0XHQvLyBJZiBub3RoaW5nIGlzIHNlbGVjdGVkLCBkaXNwbGF5IG5vdGhpbmcuXG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdlbXB0eScsICEgY29sbGVjdGlvbi5sZW5ndGggKTtcblx0XHR0aGlzLiRlbC50b2dnbGVDbGFzcyggJ29uZScsIDEgPT09IGNvbGxlY3Rpb24ubGVuZ3RoICk7XG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdlZGl0aW5nJywgZWRpdGluZyApO1xuXG5cdFx0dGhpcy4kKCcuY291bnQnKS50ZXh0KCBsMTBuLnNlbGVjdGVkLnJlcGxhY2UoJyVkJywgY29sbGVjdGlvbi5sZW5ndGgpICk7XG5cdH0sXG5cblx0ZWRpdDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMuZWRpdGFibGUgKSB7XG5cdFx0XHR0aGlzLm9wdGlvbnMuZWRpdGFibGUuY2FsbCggdGhpcywgdGhpcy5jb2xsZWN0aW9uICk7XG5cdFx0fVxuXHR9LFxuXG5cdGNsZWFyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLmNvbGxlY3Rpb24ucmVzZXQoKTtcblxuXHRcdC8vIEtlZXAgZm9jdXMgaW5zaWRlIG1lZGlhIG1vZGFsXG5cdFx0Ly8gYWZ0ZXIgY2xlYXIgbGluayBpcyBzZWxlY3RlZFxuXHRcdHRoaXMuY29udHJvbGxlci5tb2RhbC5mb2N1c01hbmFnZXIuZm9jdXMoKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0aW9uO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlNldHRpbmdzXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0JCA9IEJhY2tib25lLiQsXG5cdFNldHRpbmdzO1xuXG5TZXR0aW5ncyA9IFZpZXcuZXh0ZW5kKHtcblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIGJ1dHRvbic6ICAgICd1cGRhdGVIYW5kbGVyJyxcblx0XHQnY2hhbmdlIGlucHV0JzogICAgJ3VwZGF0ZUhhbmRsZXInLFxuXHRcdCdjaGFuZ2Ugc2VsZWN0JzogICAndXBkYXRlSGFuZGxlcicsXG5cdFx0J2NoYW5nZSB0ZXh0YXJlYSc6ICd1cGRhdGVIYW5kbGVyJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubW9kZWwgPSB0aGlzLm1vZGVsIHx8IG5ldyBCYWNrYm9uZS5Nb2RlbCgpO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2UnLCB0aGlzLnVwZGF0ZUNoYW5nZXMgKTtcblx0fSxcblxuXHRwcmVwYXJlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5kZWZhdWx0cyh7XG5cdFx0XHRtb2RlbDogdGhpcy5tb2RlbC50b0pTT04oKVxuXHRcdH0sIHRoaXMub3B0aW9ucyApO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuU2V0dGluZ3N9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdFZpZXcucHJvdG90eXBlLnJlbmRlci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0Ly8gU2VsZWN0IHRoZSBjb3JyZWN0IHZhbHVlcy5cblx0XHRfKCB0aGlzLm1vZGVsLmF0dHJpYnV0ZXMgKS5jaGFpbigpLmtleXMoKS5lYWNoKCB0aGlzLnVwZGF0ZSwgdGhpcyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVxuXHQgKi9cblx0dXBkYXRlOiBmdW5jdGlvbigga2V5ICkge1xuXHRcdHZhciB2YWx1ZSA9IHRoaXMubW9kZWwuZ2V0KCBrZXkgKSxcblx0XHRcdCRzZXR0aW5nID0gdGhpcy4kKCdbZGF0YS1zZXR0aW5nPVwiJyArIGtleSArICdcIl0nKSxcblx0XHRcdCRidXR0b25zLCAkdmFsdWU7XG5cblx0XHQvLyBCYWlsIGlmIHdlIGRpZG4ndCBmaW5kIGEgbWF0Y2hpbmcgc2V0dGluZy5cblx0XHRpZiAoICEgJHNldHRpbmcubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEF0dGVtcHQgdG8gZGV0ZXJtaW5lIGhvdyB0aGUgc2V0dGluZyBpcyByZW5kZXJlZCBhbmQgdXBkYXRlXG5cdFx0Ly8gdGhlIHNlbGVjdGVkIHZhbHVlLlxuXG5cdFx0Ly8gSGFuZGxlIGRyb3Bkb3ducy5cblx0XHRpZiAoICRzZXR0aW5nLmlzKCdzZWxlY3QnKSApIHtcblx0XHRcdCR2YWx1ZSA9ICRzZXR0aW5nLmZpbmQoJ1t2YWx1ZT1cIicgKyB2YWx1ZSArICdcIl0nKTtcblxuXHRcdFx0aWYgKCAkdmFsdWUubGVuZ3RoICkge1xuXHRcdFx0XHQkc2V0dGluZy5maW5kKCdvcHRpb24nKS5wcm9wKCAnc2VsZWN0ZWQnLCBmYWxzZSApO1xuXHRcdFx0XHQkdmFsdWUucHJvcCggJ3NlbGVjdGVkJywgdHJ1ZSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gSWYgd2UgY2FuJ3QgZmluZCB0aGUgZGVzaXJlZCB2YWx1ZSwgcmVjb3JkIHdoYXQgKmlzKiBzZWxlY3RlZC5cblx0XHRcdFx0dGhpcy5tb2RlbC5zZXQoIGtleSwgJHNldHRpbmcuZmluZCgnOnNlbGVjdGVkJykudmFsKCkgKTtcblx0XHRcdH1cblxuXHRcdC8vIEhhbmRsZSBidXR0b24gZ3JvdXBzLlxuXHRcdH0gZWxzZSBpZiAoICRzZXR0aW5nLmhhc0NsYXNzKCdidXR0b24tZ3JvdXAnKSApIHtcblx0XHRcdCRidXR0b25zID0gJHNldHRpbmcuZmluZCgnYnV0dG9uJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuXHRcdFx0JGJ1dHRvbnMuZmlsdGVyKCAnW3ZhbHVlPVwiJyArIHZhbHVlICsgJ1wiXScgKS5hZGRDbGFzcygnYWN0aXZlJyk7XG5cblx0XHQvLyBIYW5kbGUgdGV4dCBpbnB1dHMgYW5kIHRleHRhcmVhcy5cblx0XHR9IGVsc2UgaWYgKCAkc2V0dGluZy5pcygnaW5wdXRbdHlwZT1cInRleHRcIl0sIHRleHRhcmVhJykgKSB7XG5cdFx0XHRpZiAoICEgJHNldHRpbmcuaXMoJzpmb2N1cycpICkge1xuXHRcdFx0XHQkc2V0dGluZy52YWwoIHZhbHVlICk7XG5cdFx0XHR9XG5cdFx0Ly8gSGFuZGxlIGNoZWNrYm94ZXMuXG5cdFx0fSBlbHNlIGlmICggJHNldHRpbmcuaXMoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXScpICkge1xuXHRcdFx0JHNldHRpbmcucHJvcCggJ2NoZWNrZWQnLCAhISB2YWx1ZSAmJiAnZmFsc2UnICE9PSB2YWx1ZSApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBldmVudFxuXHQgKi9cblx0dXBkYXRlSGFuZGxlcjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciAkc2V0dGluZyA9ICQoIGV2ZW50LnRhcmdldCApLmNsb3Nlc3QoJ1tkYXRhLXNldHRpbmddJyksXG5cdFx0XHR2YWx1ZSA9IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRcdHVzZXJTZXR0aW5nO1xuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdGlmICggISAkc2V0dGluZy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gVXNlIHRoZSBjb3JyZWN0IHZhbHVlIGZvciBjaGVja2JveGVzLlxuXHRcdGlmICggJHNldHRpbmcuaXMoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXScpICkge1xuXHRcdFx0dmFsdWUgPSAkc2V0dGluZ1swXS5jaGVja2VkO1xuXHRcdH1cblxuXHRcdC8vIFVwZGF0ZSB0aGUgY29ycmVzcG9uZGluZyBzZXR0aW5nLlxuXHRcdHRoaXMubW9kZWwuc2V0KCAkc2V0dGluZy5kYXRhKCdzZXR0aW5nJyksIHZhbHVlICk7XG5cblx0XHQvLyBJZiB0aGUgc2V0dGluZyBoYXMgYSBjb3JyZXNwb25kaW5nIHVzZXIgc2V0dGluZyxcblx0XHQvLyB1cGRhdGUgdGhhdCBhcyB3ZWxsLlxuXHRcdGlmICggdXNlclNldHRpbmcgPSAkc2V0dGluZy5kYXRhKCd1c2VyU2V0dGluZycpICkge1xuXHRcdFx0d2luZG93LnNldFVzZXJTZXR0aW5nKCB1c2VyU2V0dGluZywgdmFsdWUgKTtcblx0XHR9XG5cdH0sXG5cblx0dXBkYXRlQ2hhbmdlczogZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdGlmICggbW9kZWwuaGFzQ2hhbmdlZCgpICkge1xuXHRcdFx0XyggbW9kZWwuY2hhbmdlZCApLmNoYWluKCkua2V5cygpLmVhY2goIHRoaXMudXBkYXRlLCB0aGlzICk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXR0aW5ncztcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TZXR0aW5ncy5BdHRhY2htZW50RGlzcGxheVxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFNldHRpbmdzID0gd3AubWVkaWEudmlldy5TZXR0aW5ncyxcblx0QXR0YWNobWVudERpc3BsYXk7XG5cbkF0dGFjaG1lbnREaXNwbGF5ID0gU2V0dGluZ3MuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnYXR0YWNobWVudC1kaXNwbGF5LXNldHRpbmdzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgnYXR0YWNobWVudC1kaXNwbGF5LXNldHRpbmdzJyksXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGF0dGFjaG1lbnQgPSB0aGlzLm9wdGlvbnMuYXR0YWNobWVudDtcblxuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0dXNlclNldHRpbmdzOiBmYWxzZVxuXHRcdH0pO1xuXHRcdC8vIENhbGwgJ2luaXRpYWxpemUnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3MuXG5cdFx0U2V0dGluZ3MucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdjaGFuZ2U6bGluaycsIHRoaXMudXBkYXRlTGlua1RvICk7XG5cblx0XHRpZiAoIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHRhdHRhY2htZW50Lm9uKCAnY2hhbmdlOnVwbG9hZGluZycsIHRoaXMucmVuZGVyLCB0aGlzICk7XG5cdFx0fVxuXHR9LFxuXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhdHRhY2htZW50ID0gdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQ7XG5cdFx0aWYgKCBhdHRhY2htZW50ICkge1xuXHRcdFx0YXR0YWNobWVudC5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHR9XG5cdFx0LyoqXG5cdFx0ICogY2FsbCAnZGlzcG9zZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzc1xuXHRcdCAqL1xuXHRcdFNldHRpbmdzLnByb3RvdHlwZS5kaXNwb3NlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnREaXNwbGF5fSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYXR0YWNobWVudCA9IHRoaXMub3B0aW9ucy5hdHRhY2htZW50O1xuXHRcdGlmICggYXR0YWNobWVudCApIHtcblx0XHRcdF8uZXh0ZW5kKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdFx0c2l6ZXM6IGF0dGFjaG1lbnQuZ2V0KCdzaXplcycpLFxuXHRcdFx0XHR0eXBlOiAgYXR0YWNobWVudC5nZXQoJ3R5cGUnKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ3JlbmRlcicgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzc1xuXHRcdCAqL1xuXHRcdFNldHRpbmdzLnByb3RvdHlwZS5yZW5kZXIuY2FsbCggdGhpcyApO1xuXHRcdHRoaXMudXBkYXRlTGlua1RvKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0dXBkYXRlTGlua1RvOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGlua1RvID0gdGhpcy5tb2RlbC5nZXQoJ2xpbmsnKSxcblx0XHRcdCRpbnB1dCA9IHRoaXMuJCgnLmxpbmstdG8tY3VzdG9tJyksXG5cdFx0XHRhdHRhY2htZW50ID0gdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQ7XG5cblx0XHRpZiAoICdub25lJyA9PT0gbGlua1RvIHx8ICdlbWJlZCcgPT09IGxpbmtUbyB8fCAoICEgYXR0YWNobWVudCAmJiAnY3VzdG9tJyAhPT0gbGlua1RvICkgKSB7XG5cdFx0XHQkaW5wdXQuYWRkQ2xhc3MoICdoaWRkZW4nICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCBhdHRhY2htZW50ICkge1xuXHRcdFx0aWYgKCAncG9zdCcgPT09IGxpbmtUbyApIHtcblx0XHRcdFx0JGlucHV0LnZhbCggYXR0YWNobWVudC5nZXQoJ2xpbmsnKSApO1xuXHRcdFx0fSBlbHNlIGlmICggJ2ZpbGUnID09PSBsaW5rVG8gKSB7XG5cdFx0XHRcdCRpbnB1dC52YWwoIGF0dGFjaG1lbnQuZ2V0KCd1cmwnKSApO1xuXHRcdFx0fSBlbHNlIGlmICggISB0aGlzLm1vZGVsLmdldCgnbGlua1VybCcpICkge1xuXHRcdFx0XHQkaW5wdXQudmFsKCdodHRwOi8vJyk7XG5cdFx0XHR9XG5cblx0XHRcdCRpbnB1dC5wcm9wKCAncmVhZG9ubHknLCAnY3VzdG9tJyAhPT0gbGlua1RvICk7XG5cdFx0fVxuXG5cdFx0JGlucHV0LnJlbW92ZUNsYXNzKCAnaGlkZGVuJyApO1xuXG5cdFx0Ly8gSWYgdGhlIGlucHV0IGlzIHZpc2libGUsIGZvY3VzIGFuZCBzZWxlY3QgaXRzIGNvbnRlbnRzLlxuXHRcdGlmICggISB3cC5tZWRpYS5pc1RvdWNoRGV2aWNlICYmICRpbnB1dC5pcygnOnZpc2libGUnKSApIHtcblx0XHRcdCRpbnB1dC5mb2N1cygpWzBdLnNlbGVjdCgpO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXR0YWNobWVudERpc3BsYXk7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3MuR2FsbGVyeVxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEdhbGxlcnkgPSB3cC5tZWRpYS52aWV3LlNldHRpbmdzLmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2NvbGxlY3Rpb24tc2V0dGluZ3MgZ2FsbGVyeS1zZXR0aW5ncycsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ2dhbGxlcnktc2V0dGluZ3MnKVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gR2FsbGVyeTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TZXR0aW5ncy5QbGF5bGlzdFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuU2V0dGluZ3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFBsYXlsaXN0ID0gd3AubWVkaWEudmlldy5TZXR0aW5ncy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdjb2xsZWN0aW9uLXNldHRpbmdzIHBsYXlsaXN0LXNldHRpbmdzJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgncGxheWxpc3Qtc2V0dGluZ3MnKVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWxpc3Q7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuU2lkZWJhclxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuUHJpb3JpdHlMaXN0XG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBTaWRlYmFyID0gd3AubWVkaWEudmlldy5Qcmlvcml0eUxpc3QuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnbWVkaWEtc2lkZWJhcidcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpZGViYXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuU2l0ZUljb25Dcm9wcGVyXG4gKlxuICogVXNlcyB0aGUgaW1nQXJlYVNlbGVjdCBwbHVnaW4gdG8gYWxsb3cgYSB1c2VyIHRvIGNyb3AgYSBTaXRlIEljb24uXG4gKlxuICogVGFrZXMgaW1nQXJlYVNlbGVjdCBvcHRpb25zIGZyb21cbiAqIHdwLmN1c3RvbWl6ZS5TaXRlSWNvbkNvbnRyb2wuY2FsY3VsYXRlSW1hZ2VTZWxlY3RPcHRpb25zLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQ3JvcHBlclxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLnZpZXcsXG5cdFNpdGVJY29uQ3JvcHBlcjtcblxuU2l0ZUljb25Dcm9wcGVyID0gVmlldy5Dcm9wcGVyLmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2Nyb3AtY29udGVudCBzaXRlLWljb24nLFxuXG5cdHJlYWR5OiBmdW5jdGlvbiAoKSB7XG5cdFx0Vmlldy5Dcm9wcGVyLnByb3RvdHlwZS5yZWFkeS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHR0aGlzLiQoICcuY3JvcC1pbWFnZScgKS5vbiggJ2xvYWQnLCBfLmJpbmQoIHRoaXMuYWRkU2lkZWJhciwgdGhpcyApICk7XG5cdH0sXG5cblx0YWRkU2lkZWJhcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zaWRlYmFyID0gbmV3IHdwLm1lZGlhLnZpZXcuU2lkZWJhcih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLmNvbnRyb2xsZXJcblx0XHR9KTtcblxuXHRcdHRoaXMuc2lkZWJhci5zZXQoICdwcmV2aWV3JywgbmV3IHdwLm1lZGlhLnZpZXcuU2l0ZUljb25QcmV2aWV3KHtcblx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuY29udHJvbGxlcixcblx0XHRcdGF0dGFjaG1lbnQ6IHRoaXMub3B0aW9ucy5hdHRhY2htZW50XG5cdFx0fSkgKTtcblxuXHRcdHRoaXMuY29udHJvbGxlci5jcm9wcGVyVmlldy52aWV3cy5hZGQoIHRoaXMuc2lkZWJhciApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaXRlSWNvbkNyb3BwZXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuU2l0ZUljb25QcmV2aWV3XG4gKlxuICogU2hvd3MgYSBwcmV2aWV3IG9mIHRoZSBTaXRlIEljb24gYXMgYSBmYXZpY29uIGFuZCBhcHAgaWNvbiB3aGlsZSBjcm9wcGluZy5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFZpZXcgPSB3cC5tZWRpYS5WaWV3LFxuXHQkID0galF1ZXJ5LFxuXHRTaXRlSWNvblByZXZpZXc7XG5cblNpdGVJY29uUHJldmlldyA9IFZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnc2l0ZS1pY29uLXByZXZpZXcnLFxuXHR0ZW1wbGF0ZTogd3AudGVtcGxhdGUoICdzaXRlLWljb24tcHJldmlldycgKSxcblxuXHRyZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb250cm9sbGVyLmltZ1NlbGVjdC5zZXRPcHRpb25zKHtcblx0XHRcdG9uSW5pdDogdGhpcy51cGRhdGVQcmV2aWV3LFxuXHRcdFx0b25TZWxlY3RDaGFuZ2U6IHRoaXMudXBkYXRlUHJldmlld1xuXHRcdH0pO1xuXHR9LFxuXG5cdHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHRoaXMub3B0aW9ucy5hdHRhY2htZW50LmdldCggJ3VybCcgKVxuXHRcdH07XG5cdH0sXG5cblx0dXBkYXRlUHJldmlldzogZnVuY3Rpb24oIGltZywgY29vcmRzICkge1xuXHRcdHZhciByeCA9IDY0IC8gY29vcmRzLndpZHRoLFxuXHRcdFx0cnkgPSA2NCAvIGNvb3Jkcy5oZWlnaHQsXG5cdFx0XHRwcmV2aWV3X3J4ID0gMTYgLyBjb29yZHMud2lkdGgsXG5cdFx0XHRwcmV2aWV3X3J5ID0gMTYgLyBjb29yZHMuaGVpZ2h0O1xuXG5cdFx0JCggJyNwcmV2aWV3LWFwcC1pY29uJyApLmNzcyh7XG5cdFx0XHR3aWR0aDogTWF0aC5yb3VuZChyeCAqIHRoaXMuaW1hZ2VXaWR0aCApICsgJ3B4Jyxcblx0XHRcdGhlaWdodDogTWF0aC5yb3VuZChyeSAqIHRoaXMuaW1hZ2VIZWlnaHQgKSArICdweCcsXG5cdFx0XHRtYXJnaW5MZWZ0OiAnLScgKyBNYXRoLnJvdW5kKHJ4ICogY29vcmRzLngxKSArICdweCcsXG5cdFx0XHRtYXJnaW5Ub3A6ICctJyArIE1hdGgucm91bmQocnkgKiBjb29yZHMueTEpICsgJ3B4J1xuXHRcdH0pO1xuXG5cdFx0JCggJyNwcmV2aWV3LWZhdmljb24nICkuY3NzKHtcblx0XHRcdHdpZHRoOiBNYXRoLnJvdW5kKCBwcmV2aWV3X3J4ICogdGhpcy5pbWFnZVdpZHRoICkgKyAncHgnLFxuXHRcdFx0aGVpZ2h0OiBNYXRoLnJvdW5kKCBwcmV2aWV3X3J5ICogdGhpcy5pbWFnZUhlaWdodCApICsgJ3B4Jyxcblx0XHRcdG1hcmdpbkxlZnQ6ICctJyArIE1hdGgucm91bmQoIHByZXZpZXdfcnggKiBjb29yZHMueDEgKSArICdweCcsXG5cdFx0XHRtYXJnaW5Ub3A6ICctJyArIE1hdGguZmxvb3IoIHByZXZpZXdfcnkqIGNvb3Jkcy55MSApICsgJ3B4J1xuXHRcdH0pO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaXRlSWNvblByZXZpZXc7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuU3Bpbm5lclxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgU3Bpbm5lciA9IHdwLm1lZGlhLlZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnc3BhbicsXG5cdGNsYXNzTmFtZTogJ3NwaW5uZXInLFxuXHRzcGlubmVyVGltZW91dDogZmFsc2UsXG5cdGRlbGF5OiA0MDAsXG5cblx0c2hvdzogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAhIHRoaXMuc3Bpbm5lclRpbWVvdXQgKSB7XG5cdFx0XHR0aGlzLnNwaW5uZXJUaW1lb3V0ID0gXy5kZWxheShmdW5jdGlvbiggJGVsICkge1xuXHRcdFx0XHQkZWwuYWRkQ2xhc3MoICdpcy1hY3RpdmUnICk7XG5cdFx0XHR9LCB0aGlzLmRlbGF5LCB0aGlzLiRlbCApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGhpZGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnaXMtYWN0aXZlJyApO1xuXHRcdHRoaXMuc3Bpbm5lclRpbWVvdXQgPSBjbGVhclRpbWVvdXQoIHRoaXMuc3Bpbm5lclRpbWVvdXQgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcGlubmVyO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlRvb2xiYXJcbiAqXG4gKiBBIHRvb2xiYXIgd2hpY2ggY29uc2lzdHMgb2YgYSBwcmltYXJ5IGFuZCBhIHNlY29uZGFyeSBzZWN0aW9uLiBFYWNoIHNlY3Rpb25zXG4gKiBjYW4gYmUgZmlsbGVkIHdpdGggdmlld3MuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0VG9vbGJhcjtcblxuVG9vbGJhciA9IFZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2Jyxcblx0Y2xhc3NOYW1lOiAnbWVkaWEtdG9vbGJhcicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHN0YXRlID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCksXG5cdFx0XHRzZWxlY3Rpb24gPSB0aGlzLnNlbGVjdGlvbiA9IHN0YXRlLmdldCgnc2VsZWN0aW9uJyksXG5cdFx0XHRsaWJyYXJ5ID0gdGhpcy5saWJyYXJ5ID0gc3RhdGUuZ2V0KCdsaWJyYXJ5Jyk7XG5cblx0XHR0aGlzLl92aWV3cyA9IHt9O1xuXG5cdFx0Ly8gVGhlIHRvb2xiYXIgaXMgY29tcG9zZWQgb2YgdHdvIGBQcmlvcml0eUxpc3RgIHZpZXdzLlxuXHRcdHRoaXMucHJpbWFyeSAgID0gbmV3IHdwLm1lZGlhLnZpZXcuUHJpb3JpdHlMaXN0KCk7XG5cdFx0dGhpcy5zZWNvbmRhcnkgPSBuZXcgd3AubWVkaWEudmlldy5Qcmlvcml0eUxpc3QoKTtcblx0XHR0aGlzLnByaW1hcnkuJGVsLmFkZENsYXNzKCdtZWRpYS10b29sYmFyLXByaW1hcnkgc2VhcmNoLWZvcm0nKTtcblx0XHR0aGlzLnNlY29uZGFyeS4kZWwuYWRkQ2xhc3MoJ21lZGlhLXRvb2xiYXItc2Vjb25kYXJ5Jyk7XG5cblx0XHR0aGlzLnZpZXdzLnNldChbIHRoaXMuc2Vjb25kYXJ5LCB0aGlzLnByaW1hcnkgXSk7XG5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy5pdGVtcyApIHtcblx0XHRcdHRoaXMuc2V0KCB0aGlzLm9wdGlvbnMuaXRlbXMsIHsgc2lsZW50OiB0cnVlIH0pO1xuXHRcdH1cblxuXHRcdGlmICggISB0aGlzLm9wdGlvbnMuc2lsZW50ICkge1xuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9XG5cblx0XHRpZiAoIHNlbGVjdGlvbiApIHtcblx0XHRcdHNlbGVjdGlvbi5vbiggJ2FkZCByZW1vdmUgcmVzZXQnLCB0aGlzLnJlZnJlc2gsIHRoaXMgKTtcblx0XHR9XG5cblx0XHRpZiAoIGxpYnJhcnkgKSB7XG5cdFx0XHRsaWJyYXJ5Lm9uKCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMucmVmcmVzaCwgdGhpcyApO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS52aWV3LlRvb2xiYXJ9IFJldHVybnMgaXRzZWYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5zZWxlY3Rpb24gKSB7XG5cdFx0XHR0aGlzLnNlbGVjdGlvbi5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMubGlicmFyeSApIHtcblx0XHRcdHRoaXMubGlicmFyeS5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHR9XG5cdFx0LyoqXG5cdFx0ICogY2FsbCAnZGlzcG9zZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzc1xuXHRcdCAqL1xuXHRcdHJldHVybiBWaWV3LnByb3RvdHlwZS5kaXNwb3NlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fSxcblxuXHRyZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5yZWZyZXNoKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcGFyYW0ge0JhY2tib25lLlZpZXd8T2JqZWN0fSB2aWV3XG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV1cblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuVG9vbGJhcn0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHNldDogZnVuY3Rpb24oIGlkLCB2aWV3LCBvcHRpb25zICkge1xuXHRcdHZhciBsaXN0O1xuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0Ly8gQWNjZXB0IGFuIG9iamVjdCB3aXRoIGFuIGBpZGAgOiBgdmlld2AgbWFwcGluZy5cblx0XHRpZiAoIF8uaXNPYmplY3QoIGlkICkgKSB7XG5cdFx0XHRfLmVhY2goIGlkLCBmdW5jdGlvbiggdmlldywgaWQgKSB7XG5cdFx0XHRcdHRoaXMuc2V0KCBpZCwgdmlldywgeyBzaWxlbnQ6IHRydWUgfSk7XG5cdFx0XHR9LCB0aGlzICk7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCAhICggdmlldyBpbnN0YW5jZW9mIEJhY2tib25lLlZpZXcgKSApIHtcblx0XHRcdFx0dmlldy5jbGFzc2VzID0gWyAnbWVkaWEtYnV0dG9uLScgKyBpZCBdLmNvbmNhdCggdmlldy5jbGFzc2VzIHx8IFtdICk7XG5cdFx0XHRcdHZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5CdXR0b24oIHZpZXcgKS5yZW5kZXIoKTtcblx0XHRcdH1cblxuXHRcdFx0dmlldy5jb250cm9sbGVyID0gdmlldy5jb250cm9sbGVyIHx8IHRoaXMuY29udHJvbGxlcjtcblxuXHRcdFx0dGhpcy5fdmlld3NbIGlkIF0gPSB2aWV3O1xuXG5cdFx0XHRsaXN0ID0gdmlldy5vcHRpb25zLnByaW9yaXR5IDwgMCA/ICdzZWNvbmRhcnknIDogJ3ByaW1hcnknO1xuXHRcdFx0dGhpc1sgbGlzdCBdLnNldCggaWQsIHZpZXcsIG9wdGlvbnMgKTtcblx0XHR9XG5cblx0XHRpZiAoICEgb3B0aW9ucy5zaWxlbnQgKSB7XG5cdFx0XHR0aGlzLnJlZnJlc2goKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5CdXR0b259XG5cdCAqL1xuXHRnZXQ6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHRyZXR1cm4gdGhpcy5fdmlld3NbIGlkIF07XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaWRcblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuVG9vbGJhcn0gUmV0dXJucyBpdHNlbGYgdG8gYWxsb3cgY2hhaW5pbmdcblx0ICovXG5cdHVuc2V0OiBmdW5jdGlvbiggaWQsIG9wdGlvbnMgKSB7XG5cdFx0ZGVsZXRlIHRoaXMuX3ZpZXdzWyBpZCBdO1xuXHRcdHRoaXMucHJpbWFyeS51bnNldCggaWQsIG9wdGlvbnMgKTtcblx0XHR0aGlzLnNlY29uZGFyeS51bnNldCggaWQsIG9wdGlvbnMgKTtcblxuXHRcdGlmICggISBvcHRpb25zIHx8ICEgb3B0aW9ucy5zaWxlbnQgKSB7XG5cdFx0XHR0aGlzLnJlZnJlc2goKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHN0YXRlID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCksXG5cdFx0XHRsaWJyYXJ5ID0gc3RhdGUuZ2V0KCdsaWJyYXJ5JyksXG5cdFx0XHRzZWxlY3Rpb24gPSBzdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xuXG5cdFx0Xy5lYWNoKCB0aGlzLl92aWV3cywgZnVuY3Rpb24oIGJ1dHRvbiApIHtcblx0XHRcdGlmICggISBidXR0b24ubW9kZWwgfHwgISBidXR0b24ub3B0aW9ucyB8fCAhIGJ1dHRvbi5vcHRpb25zLnJlcXVpcmVzICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciByZXF1aXJlcyA9IGJ1dHRvbi5vcHRpb25zLnJlcXVpcmVzLFxuXHRcdFx0XHRkaXNhYmxlZCA9IGZhbHNlO1xuXG5cdFx0XHQvLyBQcmV2ZW50IGluc2VydGlvbiBvZiBhdHRhY2htZW50cyBpZiBhbnkgb2YgdGhlbSBhcmUgc3RpbGwgdXBsb2FkaW5nXG5cdFx0XHRkaXNhYmxlZCA9IF8uc29tZSggc2VsZWN0aW9uLm1vZGVscywgZnVuY3Rpb24oIGF0dGFjaG1lbnQgKSB7XG5cdFx0XHRcdHJldHVybiBhdHRhY2htZW50LmdldCgndXBsb2FkaW5nJykgPT09IHRydWU7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKCByZXF1aXJlcy5zZWxlY3Rpb24gJiYgc2VsZWN0aW9uICYmICEgc2VsZWN0aW9uLmxlbmd0aCApIHtcblx0XHRcdFx0ZGlzYWJsZWQgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIGlmICggcmVxdWlyZXMubGlicmFyeSAmJiBsaWJyYXJ5ICYmICEgbGlicmFyeS5sZW5ndGggKSB7XG5cdFx0XHRcdGRpc2FibGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGJ1dHRvbi5tb2RlbC5zZXQoICdkaXNhYmxlZCcsIGRpc2FibGVkICk7XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvb2xiYXI7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuVG9vbGJhci5FbWJlZFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuVG9vbGJhci5TZWxlY3RcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlRvb2xiYXJcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFNlbGVjdCA9IHdwLm1lZGlhLnZpZXcuVG9vbGJhci5TZWxlY3QsXG5cdGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdEVtYmVkO1xuXG5FbWJlZCA9IFNlbGVjdC5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRfLmRlZmF1bHRzKCB0aGlzLm9wdGlvbnMsIHtcblx0XHRcdHRleHQ6IGwxMG4uaW5zZXJ0SW50b1Bvc3QsXG5cdFx0XHRyZXF1aXJlczogZmFsc2Vcblx0XHR9KTtcblx0XHQvLyBDYWxsICdpbml0aWFsaXplJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzLlxuXHRcdFNlbGVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVybCA9IHRoaXMuY29udHJvbGxlci5zdGF0ZSgpLnByb3BzLmdldCgndXJsJyk7XG5cdFx0dGhpcy5nZXQoJ3NlbGVjdCcpLm1vZGVsLnNldCggJ2Rpc2FibGVkJywgISB1cmwgfHwgdXJsID09PSAnaHR0cDovLycgKTtcblx0XHQvKipcblx0XHQgKiBjYWxsICdyZWZyZXNoJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0U2VsZWN0LnByb3RvdHlwZS5yZWZyZXNoLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRW1iZWQ7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuVG9vbGJhci5TZWxlY3RcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LlRvb2xiYXJcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFRvb2xiYXIgPSB3cC5tZWRpYS52aWV3LlRvb2xiYXIsXG5cdGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdFNlbGVjdDtcblxuU2VsZWN0ID0gVG9vbGJhci5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdF8uYmluZEFsbCggdGhpcywgJ2NsaWNrU2VsZWN0JyApO1xuXG5cdFx0Xy5kZWZhdWx0cyggb3B0aW9ucywge1xuXHRcdFx0ZXZlbnQ6ICdzZWxlY3QnLFxuXHRcdFx0c3RhdGU6IGZhbHNlLFxuXHRcdFx0cmVzZXQ6IHRydWUsXG5cdFx0XHRjbG9zZTogdHJ1ZSxcblx0XHRcdHRleHQ6ICBsMTBuLnNlbGVjdCxcblxuXHRcdFx0Ly8gRG9lcyB0aGUgYnV0dG9uIHJlbHkgb24gdGhlIHNlbGVjdGlvbj9cblx0XHRcdHJlcXVpcmVzOiB7XG5cdFx0XHRcdHNlbGVjdGlvbjogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0b3B0aW9ucy5pdGVtcyA9IF8uZGVmYXVsdHMoIG9wdGlvbnMuaXRlbXMgfHwge30sIHtcblx0XHRcdHNlbGVjdDoge1xuXHRcdFx0XHRzdHlsZTogICAgJ3ByaW1hcnknLFxuXHRcdFx0XHR0ZXh0OiAgICAgb3B0aW9ucy50ZXh0LFxuXHRcdFx0XHRwcmlvcml0eTogODAsXG5cdFx0XHRcdGNsaWNrOiAgICB0aGlzLmNsaWNrU2VsZWN0LFxuXHRcdFx0XHRyZXF1aXJlczogb3B0aW9ucy5yZXF1aXJlc1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIENhbGwgJ2luaXRpYWxpemUnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3MuXG5cdFx0VG9vbGJhci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0Y2xpY2tTZWxlY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuXHRcdFx0Y29udHJvbGxlciA9IHRoaXMuY29udHJvbGxlcjtcblxuXHRcdGlmICggb3B0aW9ucy5jbG9zZSApIHtcblx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblx0XHR9XG5cblx0XHRpZiAoIG9wdGlvbnMuZXZlbnQgKSB7XG5cdFx0XHRjb250cm9sbGVyLnN0YXRlKCkudHJpZ2dlciggb3B0aW9ucy5ldmVudCApO1xuXHRcdH1cblxuXHRcdGlmICggb3B0aW9ucy5zdGF0ZSApIHtcblx0XHRcdGNvbnRyb2xsZXIuc2V0U3RhdGUoIG9wdGlvbnMuc3RhdGUgKTtcblx0XHR9XG5cblx0XHRpZiAoIG9wdGlvbnMucmVzZXQgKSB7XG5cdFx0XHRjb250cm9sbGVyLnJlc2V0KCk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3Q7XG4iLCIvKipcbiAqIENyZWF0ZXMgYSBkcm9wem9uZSBvbiBXUCBlZGl0b3IgaW5zdGFuY2VzIChlbGVtZW50cyB3aXRoIC53cC1lZGl0b3Itd3JhcClcbiAqIGFuZCByZWxheXMgZHJhZyduJ2Ryb3BwZWQgZmlsZXMgdG8gYSBtZWRpYSB3b3JrZmxvdy5cbiAqXG4gKiB3cC5tZWRpYS52aWV3LkVkaXRvclVwbG9hZGVyXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AubWVkaWEuVmlldyxcblx0bDEwbiA9IHdwLm1lZGlhLnZpZXcubDEwbixcblx0JCA9IGpRdWVyeSxcblx0RWRpdG9yVXBsb2FkZXI7XG5cbkVkaXRvclVwbG9hZGVyID0gVmlldy5leHRlbmQoe1xuXHR0YWdOYW1lOiAgICdkaXYnLFxuXHRjbGFzc05hbWU6ICd1cGxvYWRlci1lZGl0b3InLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCAndXBsb2FkZXItZWRpdG9yJyApLFxuXG5cdGxvY2FsRHJhZzogZmFsc2UsXG5cdG92ZXJDb250YWluZXI6IGZhbHNlLFxuXHRvdmVyRHJvcHpvbmU6IGZhbHNlLFxuXHRkcmFnZ2luZ0ZpbGU6IG51bGwsXG5cblx0LyoqXG5cdCAqIEJpbmQgZHJhZyduJ2Ryb3AgZXZlbnRzIHRvIGNhbGxiYWNrcy5cblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuXHRcdC8vIEJhaWwgaWYgbm90IGVuYWJsZWQgb3IgVUEgZG9lcyBub3Qgc3VwcG9ydCBkcmFnJ24nZHJvcCBvciBGaWxlIEFQSS5cblx0XHRpZiAoICEgd2luZG93LnRpbnlNQ0VQcmVJbml0IHx8ICEgd2luZG93LnRpbnlNQ0VQcmVJbml0LmRyYWdEcm9wVXBsb2FkIHx8ICEgdGhpcy5icm93c2VyU3VwcG9ydCgpICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0dGhpcy4kZG9jdW1lbnQgPSAkKGRvY3VtZW50KTtcblx0XHR0aGlzLmRyb3B6b25lcyA9IFtdO1xuXHRcdHRoaXMuZmlsZXMgPSBbXTtcblxuXHRcdHRoaXMuJGRvY3VtZW50Lm9uKCAnZHJvcCcsICcudXBsb2FkZXItZWRpdG9yJywgXy5iaW5kKCB0aGlzLmRyb3AsIHRoaXMgKSApO1xuXHRcdHRoaXMuJGRvY3VtZW50Lm9uKCAnZHJhZ292ZXInLCAnLnVwbG9hZGVyLWVkaXRvcicsIF8uYmluZCggdGhpcy5kcm9wem9uZURyYWdvdmVyLCB0aGlzICkgKTtcblx0XHR0aGlzLiRkb2N1bWVudC5vbiggJ2RyYWdsZWF2ZScsICcudXBsb2FkZXItZWRpdG9yJywgXy5iaW5kKCB0aGlzLmRyb3B6b25lRHJhZ2xlYXZlLCB0aGlzICkgKTtcblx0XHR0aGlzLiRkb2N1bWVudC5vbiggJ2NsaWNrJywgJy51cGxvYWRlci1lZGl0b3InLCBfLmJpbmQoIHRoaXMuY2xpY2ssIHRoaXMgKSApO1xuXG5cdFx0dGhpcy4kZG9jdW1lbnQub24oICdkcmFnb3ZlcicsIF8uYmluZCggdGhpcy5jb250YWluZXJEcmFnb3ZlciwgdGhpcyApICk7XG5cdFx0dGhpcy4kZG9jdW1lbnQub24oICdkcmFnbGVhdmUnLCBfLmJpbmQoIHRoaXMuY29udGFpbmVyRHJhZ2xlYXZlLCB0aGlzICkgKTtcblxuXHRcdHRoaXMuJGRvY3VtZW50Lm9uKCAnZHJhZ3N0YXJ0IGRyYWdlbmQgZHJvcCcsIF8uYmluZCggZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0dGhpcy5sb2NhbERyYWcgPSBldmVudC50eXBlID09PSAnZHJhZ3N0YXJ0JztcblxuXHRcdFx0aWYgKCBldmVudC50eXBlID09PSAnZHJvcCcgKSB7XG5cdFx0XHRcdHRoaXMuY29udGFpbmVyRHJhZ2xlYXZlKCk7XG5cdFx0XHR9XG5cdFx0fSwgdGhpcyApICk7XG5cblx0XHR0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogQ2hlY2sgYnJvd3NlciBzdXBwb3J0IGZvciBkcmFnJ24nZHJvcC5cblx0ICpcblx0ICogQHJldHVybiBCb29sZWFuXG5cdCAqL1xuXHRicm93c2VyU3VwcG9ydDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHN1cHBvcnRzID0gZmFsc2UsIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG5cdFx0c3VwcG9ydHMgPSAoICdkcmFnZ2FibGUnIGluIGRpdiApIHx8ICggJ29uZHJhZ3N0YXJ0JyBpbiBkaXYgJiYgJ29uZHJvcCcgaW4gZGl2ICk7XG5cdFx0c3VwcG9ydHMgPSBzdXBwb3J0cyAmJiAhISAoIHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuRmlsZVJlYWRlciApO1xuXHRcdHJldHVybiBzdXBwb3J0cztcblx0fSxcblxuXHRpc0RyYWdnaW5nRmlsZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggdGhpcy5kcmFnZ2luZ0ZpbGUgIT09IG51bGwgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5kcmFnZ2luZ0ZpbGU7XG5cdFx0fVxuXG5cdFx0aWYgKCBfLmlzVW5kZWZpbmVkKCBldmVudC5vcmlnaW5hbEV2ZW50ICkgfHwgXy5pc1VuZGVmaW5lZCggZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIgKSApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHR0aGlzLmRyYWdnaW5nRmlsZSA9IF8uaW5kZXhPZiggZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIudHlwZXMsICdGaWxlcycgKSA+IC0xICYmXG5cdFx0XHRfLmluZGV4T2YoIGV2ZW50Lm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzLCAndGV4dC9wbGFpbicgKSA9PT0gLTE7XG5cblx0XHRyZXR1cm4gdGhpcy5kcmFnZ2luZ0ZpbGU7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oIGUgKSB7XG5cdFx0dmFyIGRyb3B6b25lX2lkO1xuXHRcdGZvciAoIGRyb3B6b25lX2lkIGluIHRoaXMuZHJvcHpvbmVzICkge1xuXHRcdFx0Ly8gSGlkZSB0aGUgZHJvcHpvbmVzIG9ubHkgaWYgZHJhZ2dpbmcgaGFzIGxlZnQgdGhlIHNjcmVlbi5cblx0XHRcdHRoaXMuZHJvcHpvbmVzWyBkcm9wem9uZV9pZCBdLnRvZ2dsZSggdGhpcy5vdmVyQ29udGFpbmVyIHx8IHRoaXMub3ZlckRyb3B6b25lICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIF8uaXNVbmRlZmluZWQoIGUgKSApIHtcblx0XHRcdCQoIGUudGFyZ2V0ICkuY2xvc2VzdCggJy51cGxvYWRlci1lZGl0b3InICkudG9nZ2xlQ2xhc3MoICdkcm9wcGFibGUnLCB0aGlzLm92ZXJEcm9wem9uZSApO1xuXHRcdH1cblxuXHRcdGlmICggISB0aGlzLm92ZXJDb250YWluZXIgJiYgISB0aGlzLm92ZXJEcm9wem9uZSApIHtcblx0XHRcdHRoaXMuZHJhZ2dpbmdGaWxlID0gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISB0aGlzLmluaXRpYWxpemVkICkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0Vmlldy5wcm90b3R5cGUucmVuZGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHQkKCAnLndwLWVkaXRvci13cmFwJyApLmVhY2goIF8uYmluZCggdGhpcy5hdHRhY2gsIHRoaXMgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGF0dGFjaDogZnVuY3Rpb24oIGluZGV4LCBlZGl0b3IgKSB7XG5cdFx0Ly8gQXR0YWNoIGEgZHJvcHpvbmUgdG8gYW4gZWRpdG9yLlxuXHRcdHZhciBkcm9wem9uZSA9IHRoaXMuJGVsLmNsb25lKCk7XG5cdFx0dGhpcy5kcm9wem9uZXMucHVzaCggZHJvcHpvbmUgKTtcblx0XHQkKCBlZGl0b3IgKS5hcHBlbmQoIGRyb3B6b25lICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFdoZW4gYSBmaWxlIGlzIGRyb3BwZWQgb24gdGhlIGVkaXRvciB1cGxvYWRlciwgb3BlbiB1cCBhbiBlZGl0b3IgbWVkaWEgd29ya2Zsb3dcblx0ICogYW5kIHVwbG9hZCB0aGUgZmlsZSBpbW1lZGlhdGVseS5cblx0ICpcblx0ICogQHBhcmFtICB7alF1ZXJ5LkV2ZW50fSBldmVudCBUaGUgJ2Ryb3AnIGV2ZW50LlxuXHQgKi9cblx0ZHJvcDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciAkd3JhcCwgdXBsb2FkVmlldztcblxuXHRcdHRoaXMuY29udGFpbmVyRHJhZ2xlYXZlKCBldmVudCApO1xuXHRcdHRoaXMuZHJvcHpvbmVEcmFnbGVhdmUoIGV2ZW50ICk7XG5cblx0XHR0aGlzLmZpbGVzID0gZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZmlsZXM7XG5cdFx0aWYgKCB0aGlzLmZpbGVzLmxlbmd0aCA8IDEgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gU2V0IHRoZSBhY3RpdmUgZWRpdG9yIHRvIHRoZSBkcm9wIHRhcmdldC5cblx0XHQkd3JhcCA9ICQoIGV2ZW50LnRhcmdldCApLnBhcmVudHMoICcud3AtZWRpdG9yLXdyYXAnICk7XG5cdFx0aWYgKCAkd3JhcC5sZW5ndGggPiAwICYmICR3cmFwWzBdLmlkICkge1xuXHRcdFx0d2luZG93LndwQWN0aXZlRWRpdG9yID0gJHdyYXBbMF0uaWQuc2xpY2UoIDMsIC01ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIHRoaXMud29ya2Zsb3cgKSB7XG5cdFx0XHR0aGlzLndvcmtmbG93ID0gd3AubWVkaWEuZWRpdG9yLm9wZW4oIHdpbmRvdy53cEFjdGl2ZUVkaXRvciwge1xuXHRcdFx0XHRmcmFtZTogICAgJ3Bvc3QnLFxuXHRcdFx0XHRzdGF0ZTogICAgJ2luc2VydCcsXG5cdFx0XHRcdHRpdGxlOiAgICBsMTBuLmFkZE1lZGlhLFxuXHRcdFx0XHRtdWx0aXBsZTogdHJ1ZVxuXHRcdFx0fSk7XG5cblx0XHRcdHVwbG9hZFZpZXcgPSB0aGlzLndvcmtmbG93LnVwbG9hZGVyO1xuXG5cdFx0XHRpZiAoIHVwbG9hZFZpZXcudXBsb2FkZXIgJiYgdXBsb2FkVmlldy51cGxvYWRlci5yZWFkeSApIHtcblx0XHRcdFx0dGhpcy5hZGRGaWxlcy5hcHBseSggdGhpcyApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy53b3JrZmxvdy5vbiggJ3VwbG9hZGVyOnJlYWR5JywgdGhpcy5hZGRGaWxlcywgdGhpcyApO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLndvcmtmbG93LnN0YXRlKCkucmVzZXQoKTtcblx0XHRcdHRoaXMuYWRkRmlsZXMuYXBwbHkoIHRoaXMgKTtcblx0XHRcdHRoaXMud29ya2Zsb3cub3BlbigpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIHRoZSBmaWxlcyB0byB0aGUgdXBsb2FkZXIuXG5cdCAqL1xuXHRhZGRGaWxlczogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmZpbGVzLmxlbmd0aCApIHtcblx0XHRcdHRoaXMud29ya2Zsb3cudXBsb2FkZXIudXBsb2FkZXIudXBsb2FkZXIuYWRkRmlsZSggXy50b0FycmF5KCB0aGlzLmZpbGVzICkgKTtcblx0XHRcdHRoaXMuZmlsZXMgPSBbXTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Y29udGFpbmVyRHJhZ292ZXI6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoIHRoaXMubG9jYWxEcmFnIHx8ICEgdGhpcy5pc0RyYWdnaW5nRmlsZSggZXZlbnQgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLm92ZXJDb250YWluZXIgPSB0cnVlO1xuXHRcdHRoaXMucmVmcmVzaCgpO1xuXHR9LFxuXG5cdGNvbnRhaW5lckRyYWdsZWF2ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vdmVyQ29udGFpbmVyID0gZmFsc2U7XG5cblx0XHQvLyBUaHJvdHRsZSBkcmFnbGVhdmUgYmVjYXVzZSBpdCdzIGNhbGxlZCB3aGVuIGJvdW5jaW5nIGZyb20gc29tZSBlbGVtZW50cyB0byBvdGhlcnMuXG5cdFx0Xy5kZWxheSggXy5iaW5kKCB0aGlzLnJlZnJlc2gsIHRoaXMgKSwgNTAgKTtcblx0fSxcblxuXHRkcm9wem9uZURyYWdvdmVyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCB0aGlzLmxvY2FsRHJhZyB8fCAhIHRoaXMuaXNEcmFnZ2luZ0ZpbGUoIGV2ZW50ICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5vdmVyRHJvcHpvbmUgPSB0cnVlO1xuXHRcdHRoaXMucmVmcmVzaCggZXZlbnQgKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0ZHJvcHpvbmVEcmFnbGVhdmU6IGZ1bmN0aW9uKCBlICkge1xuXHRcdHRoaXMub3ZlckRyb3B6b25lID0gZmFsc2U7XG5cdFx0Xy5kZWxheSggXy5iaW5kKCB0aGlzLnJlZnJlc2gsIHRoaXMsIGUgKSwgNTAgKTtcblx0fSxcblxuXHRjbGljazogZnVuY3Rpb24oIGUgKSB7XG5cdFx0Ly8gSW4gdGhlIHJhcmUgY2FzZSB3aGVyZSB0aGUgZHJvcHpvbmUgZ2V0cyBzdHVjaywgaGlkZSBpdCBvbiBjbGljay5cblx0XHR0aGlzLmNvbnRhaW5lckRyYWdsZWF2ZSggZSApO1xuXHRcdHRoaXMuZHJvcHpvbmVEcmFnbGVhdmUoIGUgKTtcblx0XHR0aGlzLmxvY2FsRHJhZyA9IGZhbHNlO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JVcGxvYWRlcjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5VcGxvYWRlcklubGluZVxuICpcbiAqIFRoZSBpbmxpbmUgdXBsb2FkZXIgdGhhdCBzaG93cyB1cCBpbiB0aGUgJ1VwbG9hZCBGaWxlcycgdGFiLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdFVwbG9hZGVySW5saW5lO1xuXG5VcGxvYWRlcklubGluZSA9IFZpZXcuZXh0ZW5kKHtcblx0dGFnTmFtZTogICAnZGl2Jyxcblx0Y2xhc3NOYW1lOiAndXBsb2FkZXItaW5saW5lJyxcblx0dGVtcGxhdGU6ICB3cC50ZW1wbGF0ZSgndXBsb2FkZXItaW5saW5lJyksXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIC5jbG9zZSc6ICdoaWRlJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0bWVzc2FnZTogJycsXG5cdFx0XHRzdGF0dXM6ICB0cnVlLFxuXHRcdFx0Y2FuQ2xvc2U6IGZhbHNlXG5cdFx0fSk7XG5cblx0XHRpZiAoICEgdGhpcy5vcHRpb25zLiRicm93c2VyICYmIHRoaXMuY29udHJvbGxlci51cGxvYWRlciApIHtcblx0XHRcdHRoaXMub3B0aW9ucy4kYnJvd3NlciA9IHRoaXMuY29udHJvbGxlci51cGxvYWRlci4kYnJvd3Nlcjtcblx0XHR9XG5cblx0XHRpZiAoIF8uaXNVbmRlZmluZWQoIHRoaXMub3B0aW9ucy5wb3N0SWQgKSApIHtcblx0XHRcdHRoaXMub3B0aW9ucy5wb3N0SWQgPSB3cC5tZWRpYS52aWV3LnNldHRpbmdzLnBvc3QuaWQ7XG5cdFx0fVxuXG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMuc3RhdHVzICkge1xuXHRcdFx0dGhpcy52aWV3cy5zZXQoICcudXBsb2FkLWlubGluZS1zdGF0dXMnLCBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlclN0YXR1cyh7XG5cdFx0XHRcdGNvbnRyb2xsZXI6IHRoaXMuY29udHJvbGxlclxuXHRcdFx0fSkgKTtcblx0XHR9XG5cdH0sXG5cblx0cHJlcGFyZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHN1Z2dlc3RlZFdpZHRoID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCdzdWdnZXN0ZWRXaWR0aCcpLFxuXHRcdFx0c3VnZ2VzdGVkSGVpZ2h0ID0gdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCdzdWdnZXN0ZWRIZWlnaHQnKSxcblx0XHRcdGRhdGEgPSB7fTtcblxuXHRcdGRhdGEubWVzc2FnZSA9IHRoaXMub3B0aW9ucy5tZXNzYWdlO1xuXHRcdGRhdGEuY2FuQ2xvc2UgPSB0aGlzLm9wdGlvbnMuY2FuQ2xvc2U7XG5cblx0XHRpZiAoIHN1Z2dlc3RlZFdpZHRoICYmIHN1Z2dlc3RlZEhlaWdodCApIHtcblx0XHRcdGRhdGEuc3VnZ2VzdGVkV2lkdGggPSBzdWdnZXN0ZWRXaWR0aDtcblx0XHRcdGRhdGEuc3VnZ2VzdGVkSGVpZ2h0ID0gc3VnZ2VzdGVkSGVpZ2h0O1xuXHRcdH1cblxuXHRcdHJldHVybiBkYXRhO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuVXBsb2FkZXJJbmxpbmV9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuZGlzcG9zaW5nICkge1xuXHRcdFx0LyoqXG5cdFx0XHQgKiBjYWxsICdkaXNwb3NlJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0XHQgKi9cblx0XHRcdHJldHVybiBWaWV3LnByb3RvdHlwZS5kaXNwb3NlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR9XG5cblx0XHQvLyBSdW4gcmVtb3ZlIG9uIGBkaXNwb3NlYCwgc28gd2UgY2FuIGJlIHN1cmUgdG8gcmVmcmVzaCB0aGVcblx0XHQvLyB1cGxvYWRlciB3aXRoIGEgdmlldy1sZXNzIERPTS4gVHJhY2sgd2hldGhlciB3ZSdyZSBkaXNwb3Npbmdcblx0XHQvLyBzbyB3ZSBkb24ndCB0cmlnZ2VyIGFuIGluZmluaXRlIGxvb3AuXG5cdFx0dGhpcy5kaXNwb3NpbmcgPSB0cnVlO1xuXHRcdHJldHVybiB0aGlzLnJlbW92ZSgpO1xuXHR9LFxuXHQvKipcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuVXBsb2FkZXJJbmxpbmV9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdC8qKlxuXHRcdCAqIGNhbGwgJ3JlbW92ZScgZGlyZWN0bHkgb24gdGhlIHBhcmVudCBjbGFzc1xuXHRcdCAqL1xuXHRcdHZhciByZXN1bHQgPSBWaWV3LnByb3RvdHlwZS5yZW1vdmUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0Xy5kZWZlciggXy5iaW5kKCB0aGlzLnJlZnJlc2gsIHRoaXMgKSApO1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVwbG9hZGVyID0gdGhpcy5jb250cm9sbGVyLnVwbG9hZGVyO1xuXG5cdFx0aWYgKCB1cGxvYWRlciApIHtcblx0XHRcdHVwbG9hZGVyLnJlZnJlc2goKTtcblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7d3AubWVkaWEudmlldy5VcGxvYWRlcklubGluZX1cblx0ICovXG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgJGJyb3dzZXIgPSB0aGlzLm9wdGlvbnMuJGJyb3dzZXIsXG5cdFx0XHQkcGxhY2Vob2xkZXI7XG5cblx0XHRpZiAoIHRoaXMuY29udHJvbGxlci51cGxvYWRlciApIHtcblx0XHRcdCRwbGFjZWhvbGRlciA9IHRoaXMuJCgnLmJyb3dzZXInKTtcblxuXHRcdFx0Ly8gQ2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZXBsYWNlZCB0aGUgcGxhY2Vob2xkZXIuXG5cdFx0XHRpZiAoICRwbGFjZWhvbGRlclswXSA9PT0gJGJyb3dzZXJbMF0gKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0JGJyb3dzZXIuZGV0YWNoKCkudGV4dCggJHBsYWNlaG9sZGVyLnRleHQoKSApO1xuXHRcdFx0JGJyb3dzZXJbMF0uY2xhc3NOYW1lID0gJHBsYWNlaG9sZGVyWzBdLmNsYXNzTmFtZTtcblx0XHRcdCRwbGFjZWhvbGRlci5yZXBsYWNlV2l0aCggJGJyb3dzZXIuc2hvdygpICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5yZWZyZXNoKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdHNob3c6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnaGlkZGVuJyApO1xuXHR9LFxuXHRoaWRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2hpZGRlbicgKTtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRlcklubGluZTtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5VcGxvYWRlclN0YXR1c0Vycm9yXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBVcGxvYWRlclN0YXR1c0Vycm9yID0gd3AubWVkaWEuVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICd1cGxvYWQtZXJyb3InLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCd1cGxvYWRlci1zdGF0dXMtZXJyb3InKVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkZXJTdGF0dXNFcnJvcjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5VcGxvYWRlclN0YXR1c1xuICpcbiAqIEFuIHVwbG9hZGVyIHN0YXR1cyBmb3Igb24tZ29pbmcgdXBsb2Fkcy5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIFZpZXcgPSB3cC5tZWRpYS5WaWV3LFxuXHRVcGxvYWRlclN0YXR1cztcblxuVXBsb2FkZXJTdGF0dXMgPSBWaWV3LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ21lZGlhLXVwbG9hZGVyLXN0YXR1cycsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ3VwbG9hZGVyLXN0YXR1cycpLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayAudXBsb2FkLWRpc21pc3MtZXJyb3JzJzogJ2Rpc21pc3MnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5xdWV1ZSA9IHdwLlVwbG9hZGVyLnF1ZXVlO1xuXHRcdHRoaXMucXVldWUub24oICdhZGQgcmVtb3ZlIHJlc2V0JywgdGhpcy52aXNpYmlsaXR5LCB0aGlzICk7XG5cdFx0dGhpcy5xdWV1ZS5vbiggJ2FkZCByZW1vdmUgcmVzZXQgY2hhbmdlOnBlcmNlbnQnLCB0aGlzLnByb2dyZXNzLCB0aGlzICk7XG5cdFx0dGhpcy5xdWV1ZS5vbiggJ2FkZCByZW1vdmUgcmVzZXQgY2hhbmdlOnVwbG9hZGluZycsIHRoaXMuaW5mbywgdGhpcyApO1xuXG5cdFx0dGhpcy5lcnJvcnMgPSB3cC5VcGxvYWRlci5lcnJvcnM7XG5cdFx0dGhpcy5lcnJvcnMucmVzZXQoKTtcblx0XHR0aGlzLmVycm9ycy5vbiggJ2FkZCByZW1vdmUgcmVzZXQnLCB0aGlzLnZpc2liaWxpdHksIHRoaXMgKTtcblx0XHR0aGlzLmVycm9ycy5vbiggJ2FkZCcsIHRoaXMuZXJyb3IsIHRoaXMgKTtcblx0fSxcblx0LyoqXG5cdCAqIEBnbG9iYWwgd3AuVXBsb2FkZXJcblx0ICogQHJldHVybnMge3dwLm1lZGlhLnZpZXcuVXBsb2FkZXJTdGF0dXN9XG5cdCAqL1xuXHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcblx0XHR3cC5VcGxvYWRlci5xdWV1ZS5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHQvKipcblx0XHQgKiBjYWxsICdkaXNwb3NlJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzXG5cdFx0ICovXG5cdFx0Vmlldy5wcm90b3R5cGUuZGlzcG9zZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0dmlzaWJpbGl0eTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICd1cGxvYWRpbmcnLCAhISB0aGlzLnF1ZXVlLmxlbmd0aCApO1xuXHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCAnZXJyb3JzJywgISEgdGhpcy5lcnJvcnMubGVuZ3RoICk7XG5cdFx0dGhpcy4kZWwudG9nZ2xlKCAhISB0aGlzLnF1ZXVlLmxlbmd0aCB8fCAhISB0aGlzLmVycm9ycy5sZW5ndGggKTtcblx0fSxcblxuXHRyZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0Xy5lYWNoKHtcblx0XHRcdCckYmFyJzogICAgICAnLm1lZGlhLXByb2dyZXNzLWJhciBkaXYnLFxuXHRcdFx0JyRpbmRleCc6ICAgICcudXBsb2FkLWluZGV4Jyxcblx0XHRcdCckdG90YWwnOiAgICAnLnVwbG9hZC10b3RhbCcsXG5cdFx0XHQnJGZpbGVuYW1lJzogJy51cGxvYWQtZmlsZW5hbWUnXG5cdFx0fSwgZnVuY3Rpb24oIHNlbGVjdG9yLCBrZXkgKSB7XG5cdFx0XHR0aGlzWyBrZXkgXSA9IHRoaXMuJCggc2VsZWN0b3IgKTtcblx0XHR9LCB0aGlzICk7XG5cblx0XHR0aGlzLnZpc2liaWxpdHkoKTtcblx0XHR0aGlzLnByb2dyZXNzKCk7XG5cdFx0dGhpcy5pbmZvKCk7XG5cdH0sXG5cblx0cHJvZ3Jlc3M6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBxdWV1ZSA9IHRoaXMucXVldWUsXG5cdFx0XHQkYmFyID0gdGhpcy4kYmFyO1xuXG5cdFx0aWYgKCAhICRiYXIgfHwgISBxdWV1ZS5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0JGJhci53aWR0aCggKCBxdWV1ZS5yZWR1Y2UoIGZ1bmN0aW9uKCBtZW1vLCBhdHRhY2htZW50ICkge1xuXHRcdFx0aWYgKCAhIGF0dGFjaG1lbnQuZ2V0KCd1cGxvYWRpbmcnKSApIHtcblx0XHRcdFx0cmV0dXJuIG1lbW8gKyAxMDA7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBwZXJjZW50ID0gYXR0YWNobWVudC5nZXQoJ3BlcmNlbnQnKTtcblx0XHRcdHJldHVybiBtZW1vICsgKCBfLmlzTnVtYmVyKCBwZXJjZW50ICkgPyBwZXJjZW50IDogMTAwICk7XG5cdFx0fSwgMCApIC8gcXVldWUubGVuZ3RoICkgKyAnJScgKTtcblx0fSxcblxuXHRpbmZvOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcXVldWUgPSB0aGlzLnF1ZXVlLFxuXHRcdFx0aW5kZXggPSAwLCBhY3RpdmU7XG5cblx0XHRpZiAoICEgcXVldWUubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGFjdGl2ZSA9IHRoaXMucXVldWUuZmluZCggZnVuY3Rpb24oIGF0dGFjaG1lbnQsIGkgKSB7XG5cdFx0XHRpbmRleCA9IGk7XG5cdFx0XHRyZXR1cm4gYXR0YWNobWVudC5nZXQoJ3VwbG9hZGluZycpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy4kaW5kZXgudGV4dCggaW5kZXggKyAxICk7XG5cdFx0dGhpcy4kdG90YWwudGV4dCggcXVldWUubGVuZ3RoICk7XG5cdFx0dGhpcy4kZmlsZW5hbWUuaHRtbCggYWN0aXZlID8gdGhpcy5maWxlbmFtZSggYWN0aXZlLmdldCgnZmlsZW5hbWUnKSApIDogJycgKTtcblx0fSxcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZVxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHQgKi9cblx0ZmlsZW5hbWU6IGZ1bmN0aW9uKCBmaWxlbmFtZSApIHtcblx0XHRyZXR1cm4gXy5lc2NhcGUoIGZpbGVuYW1lICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0JhY2tib25lLk1vZGVsfSBlcnJvclxuXHQgKi9cblx0ZXJyb3I6IGZ1bmN0aW9uKCBlcnJvciApIHtcblx0XHR0aGlzLnZpZXdzLmFkZCggJy51cGxvYWQtZXJyb3JzJywgbmV3IHdwLm1lZGlhLnZpZXcuVXBsb2FkZXJTdGF0dXNFcnJvcih7XG5cdFx0XHRmaWxlbmFtZTogdGhpcy5maWxlbmFtZSggZXJyb3IuZ2V0KCdmaWxlJykubmFtZSApLFxuXHRcdFx0bWVzc2FnZTogIGVycm9yLmdldCgnbWVzc2FnZScpXG5cdFx0fSksIHsgYXQ6IDAgfSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBnbG9iYWwgd3AuVXBsb2FkZXJcblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGV2ZW50XG5cdCAqL1xuXHRkaXNtaXNzOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGVycm9ycyA9IHRoaXMudmlld3MuZ2V0KCcudXBsb2FkLWVycm9ycycpO1xuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdGlmICggZXJyb3JzICkge1xuXHRcdFx0Xy5pbnZva2UoIGVycm9ycywgJ3JlbW92ZScgKTtcblx0XHR9XG5cdFx0d3AuVXBsb2FkZXIuZXJyb3JzLnJlc2V0KCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyU3RhdHVzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LlVwbG9hZGVyV2luZG93XG4gKlxuICogQW4gdXBsb2FkZXIgd2luZG93IHRoYXQgYWxsb3dzIGZvciBkcmFnZ2luZyBhbmQgZHJvcHBpbmcgbWVkaWEuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAgICAgICAgICAgICAgICAgICBPcHRpb25zIGhhc2ggcGFzc2VkIHRvIHRoZSB2aWV3LlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLnVwbG9hZGVyXSAgICAgICAgICBVcGxvYWRlciBwcm9wZXJ0aWVzLlxuICogQHBhcmFtIHtqUXVlcnl9IFtvcHRpb25zLnVwbG9hZGVyLmJyb3dzZXJdXG4gKiBAcGFyYW0ge2pRdWVyeX0gW29wdGlvbnMudXBsb2FkZXIuZHJvcHpvbmVdIGpRdWVyeSBjb2xsZWN0aW9uIG9mIHRoZSBkcm9wem9uZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy51cGxvYWRlci5wYXJhbXNdXG4gKi9cbnZhciAkID0galF1ZXJ5LFxuXHRVcGxvYWRlcldpbmRvdztcblxuVXBsb2FkZXJXaW5kb3cgPSB3cC5tZWRpYS5WaWV3LmV4dGVuZCh7XG5cdHRhZ05hbWU6ICAgJ2RpdicsXG5cdGNsYXNzTmFtZTogJ3VwbG9hZGVyLXdpbmRvdycsXG5cdHRlbXBsYXRlOiAgd3AudGVtcGxhdGUoJ3VwbG9hZGVyLXdpbmRvdycpLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1cGxvYWRlcjtcblxuXHRcdHRoaXMuJGJyb3dzZXIgPSAkKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwiYnJvd3NlclwiIC8+JykuaGlkZSgpLmFwcGVuZFRvKCdib2R5Jyk7XG5cblx0XHR1cGxvYWRlciA9IHRoaXMub3B0aW9ucy51cGxvYWRlciA9IF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucy51cGxvYWRlciB8fCB7fSwge1xuXHRcdFx0ZHJvcHpvbmU6ICB0aGlzLiRlbCxcblx0XHRcdGJyb3dzZXI6ICAgdGhpcy4kYnJvd3Nlcixcblx0XHRcdHBhcmFtczogICAge31cblx0XHR9KTtcblxuXHRcdC8vIEVuc3VyZSB0aGUgZHJvcHpvbmUgaXMgYSBqUXVlcnkgY29sbGVjdGlvbi5cblx0XHRpZiAoIHVwbG9hZGVyLmRyb3B6b25lICYmICEgKHVwbG9hZGVyLmRyb3B6b25lIGluc3RhbmNlb2YgJCkgKSB7XG5cdFx0XHR1cGxvYWRlci5kcm9wem9uZSA9ICQoIHVwbG9hZGVyLmRyb3B6b25lICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnYWN0aXZhdGUnLCB0aGlzLnJlZnJlc2gsIHRoaXMgKTtcblxuXHRcdHRoaXMuY29udHJvbGxlci5vbiggJ2RldGFjaCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy4kYnJvd3Nlci5yZW1vdmUoKTtcblx0XHR9LCB0aGlzICk7XG5cdH0sXG5cblx0cmVmcmVzaDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLnVwbG9hZGVyICkge1xuXHRcdFx0dGhpcy51cGxvYWRlci5yZWZyZXNoKCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcG9zdElkID0gd3AubWVkaWEudmlldy5zZXR0aW5ncy5wb3N0LmlkLFxuXHRcdFx0ZHJvcHpvbmU7XG5cblx0XHQvLyBJZiB0aGUgdXBsb2FkZXIgYWxyZWFkeSBleGlzdHMsIGJhaWwuXG5cdFx0aWYgKCB0aGlzLnVwbG9hZGVyICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggcG9zdElkICkge1xuXHRcdFx0dGhpcy5vcHRpb25zLnVwbG9hZGVyLnBhcmFtcy5wb3N0X2lkID0gcG9zdElkO1xuXHRcdH1cblx0XHR0aGlzLnVwbG9hZGVyID0gbmV3IHdwLlVwbG9hZGVyKCB0aGlzLm9wdGlvbnMudXBsb2FkZXIgKTtcblxuXHRcdGRyb3B6b25lID0gdGhpcy51cGxvYWRlci5kcm9wem9uZTtcblx0XHRkcm9wem9uZS5vbiggJ2Ryb3B6b25lOmVudGVyJywgXy5iaW5kKCB0aGlzLnNob3csIHRoaXMgKSApO1xuXHRcdGRyb3B6b25lLm9uKCAnZHJvcHpvbmU6bGVhdmUnLCBfLmJpbmQoIHRoaXMuaGlkZSwgdGhpcyApICk7XG5cblx0XHQkKCB0aGlzLnVwbG9hZGVyICkub24oICd1cGxvYWRlcjpyZWFkeScsIF8uYmluZCggdGhpcy5fcmVhZHksIHRoaXMgKSApO1xuXHR9LFxuXG5cdF9yZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb250cm9sbGVyLnRyaWdnZXIoICd1cGxvYWRlcjpyZWFkeScgKTtcblx0fSxcblxuXHRzaG93OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgJGVsID0gdGhpcy4kZWwuc2hvdygpO1xuXG5cdFx0Ly8gRW5zdXJlIHRoYXQgdGhlIGFuaW1hdGlvbiBpcyB0cmlnZ2VyZWQgYnkgd2FpdGluZyB1bnRpbFxuXHRcdC8vIHRoZSB0cmFuc3BhcmVudCBlbGVtZW50IGlzIHBhaW50ZWQgaW50byB0aGUgRE9NLlxuXHRcdF8uZGVmZXIoIGZ1bmN0aW9uKCkge1xuXHRcdFx0JGVsLmNzcyh7IG9wYWNpdHk6IDEgfSk7XG5cdFx0fSk7XG5cdH0sXG5cblx0aGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRlbCA9IHRoaXMuJGVsLmNzcyh7IG9wYWNpdHk6IDAgfSk7XG5cblx0XHR3cC5tZWRpYS50cmFuc2l0aW9uKCAkZWwgKS5kb25lKCBmdW5jdGlvbigpIHtcblx0XHRcdC8vIFRyYW5zaXRpb24gZW5kIGV2ZW50cyBhcmUgc3ViamVjdCB0byByYWNlIGNvbmRpdGlvbnMuXG5cdFx0XHQvLyBNYWtlIHN1cmUgdGhhdCB0aGUgdmFsdWUgaXMgc2V0IGFzIGludGVuZGVkLlxuXHRcdFx0aWYgKCAnMCcgPT09ICRlbC5jc3MoJ29wYWNpdHknKSApIHtcblx0XHRcdFx0JGVsLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIGh0dHBzOi8vY29yZS50cmFjLndvcmRwcmVzcy5vcmcvdGlja2V0LzI3MzQxXG5cdFx0Xy5kZWxheSggZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoICcwJyA9PT0gJGVsLmNzcygnb3BhY2l0eScpICYmICRlbC5pcygnOnZpc2libGUnKSApIHtcblx0XHRcdFx0JGVsLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9LCA1MDAgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkZXJXaW5kb3c7XG4iLCIvKipcbiAqIHdwLm1lZGlhLlZpZXdcbiAqXG4gKiBUaGUgYmFzZSB2aWV3IGNsYXNzIGZvciBtZWRpYS5cbiAqXG4gKiBVbmRlbGVnYXRpbmcgZXZlbnRzLCByZW1vdmluZyBldmVudHMgZnJvbSB0aGUgbW9kZWwsIGFuZFxuICogcmVtb3ZpbmcgZXZlbnRzIGZyb20gdGhlIGNvbnRyb2xsZXIgbWlycm9yIHRoZSBjb2RlIGZvclxuICogYEJhY2tib25lLlZpZXcuZGlzcG9zZWAgaW4gQmFja2JvbmUgMC45LjggZGV2ZWxvcG1lbnQuXG4gKlxuICogVGhpcyBiZWhhdmlvciBoYXMgc2luY2UgYmVlbiByZW1vdmVkLCBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiBvdXRzaWRlIG9mIHRoZSBtZWRpYSBtYW5hZ2VyLlxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKi9cbnZhciBWaWV3ID0gd3AuQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRjb25zdHJ1Y3RvcjogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0aWYgKCBvcHRpb25zICYmIG9wdGlvbnMuY29udHJvbGxlciApIHtcblx0XHRcdHRoaXMuY29udHJvbGxlciA9IG9wdGlvbnMuY29udHJvbGxlcjtcblx0XHR9XG5cdFx0d3AuQmFja2JvbmUuVmlldy5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cdC8qKlxuXHQgKiBAdG9kbyBUaGUgaW50ZXJuYWwgY29tbWVudCBtZW50aW9ucyB0aGlzIG1pZ2h0IGhhdmUgYmVlbiBhIHN0b3AtZ2FwXG5cdCAqICAgICAgIGJlZm9yZSBCYWNrYm9uZSAwLjkuOCBjYW1lIG91dC4gRmlndXJlIG91dCBpZiBCYWNrYm9uZSBjb3JlIHRha2VzXG5cdCAqICAgICAgIGNhcmUgb2YgdGhpcyBpbiBCYWNrYm9uZS5WaWV3IG5vdy5cblx0ICpcblx0ICogQHJldHVybnMge3dwLm1lZGlhLlZpZXd9IFJldHVybnMgaXRzZWxmIHRvIGFsbG93IGNoYWluaW5nXG5cdCAqL1xuXHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcblx0XHQvLyBVbmRlbGVnYXRpbmcgZXZlbnRzLCByZW1vdmluZyBldmVudHMgZnJvbSB0aGUgbW9kZWwsIGFuZFxuXHRcdC8vIHJlbW92aW5nIGV2ZW50cyBmcm9tIHRoZSBjb250cm9sbGVyIG1pcnJvciB0aGUgY29kZSBmb3Jcblx0XHQvLyBgQmFja2JvbmUuVmlldy5kaXNwb3NlYCBpbiBCYWNrYm9uZSAwLjkuOCBkZXZlbG9wbWVudC5cblx0XHR0aGlzLnVuZGVsZWdhdGVFdmVudHMoKTtcblxuXHRcdGlmICggdGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLm9mZiApIHtcblx0XHRcdHRoaXMubW9kZWwub2ZmKCBudWxsLCBudWxsLCB0aGlzICk7XG5cdFx0fVxuXG5cdFx0aWYgKCB0aGlzLmNvbGxlY3Rpb24gJiYgdGhpcy5jb2xsZWN0aW9uLm9mZiApIHtcblx0XHRcdHRoaXMuY29sbGVjdGlvbi5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHR9XG5cblx0XHQvLyBVbmJpbmQgY29udHJvbGxlciBldmVudHMuXG5cdFx0aWYgKCB0aGlzLmNvbnRyb2xsZXIgJiYgdGhpcy5jb250cm9sbGVyLm9mZiApIHtcblx0XHRcdHRoaXMuY29udHJvbGxlci5vZmYoIG51bGwsIG51bGwsIHRoaXMgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIEByZXR1cm5zIHt3cC5tZWRpYS5WaWV3fSBSZXR1cm5zIGl0c2VsZiB0byBhbGxvdyBjaGFpbmluZ1xuXHQgKi9cblx0cmVtb3ZlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRpc3Bvc2UoKTtcblx0XHQvKipcblx0XHQgKiBjYWxsICdyZW1vdmUnIGRpcmVjdGx5IG9uIHRoZSBwYXJlbnQgY2xhc3Ncblx0XHQgKi9cblx0XHRyZXR1cm4gd3AuQmFja2JvbmUuVmlldy5wcm90b3R5cGUucmVtb3ZlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldztcbiJdfQ==
