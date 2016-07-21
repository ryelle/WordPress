(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * wp.media.controller.EditAttachmentMetadata
 *
 * A state for editing an attachment's metadata.
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var l10n = wp.media.view.l10n,
	EditAttachmentMetadata;

EditAttachmentMetadata = wp.media.controller.State.extend({
	defaults: {
		id:      'edit-attachment',
		// Title string passed to the frame's title region view.
		title:   l10n.attachmentDetails,
		// Region mode defaults.
		content: 'edit-metadata',
		menu:    false,
		toolbar: false,
		router:  false
	}
});

module.exports = EditAttachmentMetadata;

},{}],2:[function(require,module,exports){
var media = wp.media;

media.controller.EditAttachmentMetadata = require( './controllers/edit-attachment-metadata.js' );
media.view.MediaFrame.Manage = require( './views/frame/manage.js' );
media.view.Attachment.Details.TwoColumn = require( './views/attachment/details-two-column.js' );
media.view.MediaFrame.Manage.Router = require( './routers/manage.js' );
media.view.EditImage.Details = require( './views/edit-image-details.js' );
media.view.MediaFrame.EditAttachments = require( './views/frame/edit-attachments.js' );
media.view.SelectModeToggleButton = require( './views/button/select-mode-toggle.js' );
media.view.DeleteSelectedButton = require( './views/button/delete-selected.js' );
media.view.DeleteSelectedPermanentlyButton = require( './views/button/delete-selected-permanently.js' );

},{"./controllers/edit-attachment-metadata.js":1,"./routers/manage.js":3,"./views/attachment/details-two-column.js":4,"./views/button/delete-selected-permanently.js":5,"./views/button/delete-selected.js":6,"./views/button/select-mode-toggle.js":7,"./views/edit-image-details.js":8,"./views/frame/edit-attachments.js":9,"./views/frame/manage.js":10}],3:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.Manage.Router
 *
 * A router for handling the browser history and application state.
 *
 * @class
 * @augments Backbone.Router
 */
var Router = Backbone.Router.extend({
	routes: {
		'upload.php?item=:slug':    'showItem',
		'upload.php?search=:query': 'search'
	},

	// Map routes against the page URL
	baseUrl: function( url ) {
		return 'upload.php' + url;
	},

	// Respond to the search route by filling the search field and trigggering the input event
	search: function( query ) {
		jQuery( '#media-search-input' ).val( query ).trigger( 'input' );
	},

	// Show the modal with a specific item
	showItem: function( query ) {
		var media = wp.media,
			library = media.frame.state().get('library'),
			item;

		// Trigger the media frame to open the correct item
		item = library.findWhere( { id: parseInt( query, 10 ) } );
		if ( item ) {
			media.frame.trigger( 'edit:attachment', item );
		} else {
			item = media.attachment( query );
			media.frame.listenTo( item, 'change', function( model ) {
				media.frame.stopListening( item );
				media.frame.trigger( 'edit:attachment', model );
			} );
			item.fetch();
		}
	}
});

module.exports = Router;

},{}],4:[function(require,module,exports){
/**
 * wp.media.view.Attachment.Details.TwoColumn
 *
 * A similar view to media.view.Attachment.Details
 * for use in the Edit Attachment modal.
 *
 * @class
 * @augments wp.media.view.Attachment.Details
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Details = wp.media.view.Attachment.Details,
	TwoColumn;

TwoColumn = Details.extend({
	template: wp.template( 'attachment-details-two-column' ),

	editAttachment: function( event ) {
		event.preventDefault();
		this.controller.content.mode( 'edit-image' );
	},

	/**
	 * Noop this from parent class, doesn't apply here.
	 */
	toggleSelectionHandler: function() {},

	render: function() {
		Details.prototype.render.apply( this, arguments );

		wp.media.mixin.removeAllPlayers();
		this.$( 'audio, video' ).each( function (i, elem) {
			var el = wp.media.view.MediaDetails.prepareSrc( elem );
			new window.MediaElementPlayer( el, wp.media.mixin.mejsSettings );
		} );
	}
});

module.exports = TwoColumn;

},{}],5:[function(require,module,exports){
/**
 * wp.media.view.DeleteSelectedPermanentlyButton
 *
 * When MEDIA_TRASH is true, a button that handles bulk Delete Permanently logic
 *
 * @class
 * @augments wp.media.view.DeleteSelectedButton
 * @augments wp.media.view.Button
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Button = wp.media.view.Button,
	DeleteSelected = wp.media.view.DeleteSelectedButton,
	DeleteSelectedPermanently;

DeleteSelectedPermanently = DeleteSelected.extend({
	initialize: function() {
		DeleteSelected.prototype.initialize.apply( this, arguments );
		this.controller.on( 'select:activate', this.selectActivate, this );
		this.controller.on( 'select:deactivate', this.selectDeactivate, this );
	},

	filterChange: function( model ) {
		this.canShow = ( 'trash' === model.get( 'status' ) );
	},

	selectActivate: function() {
		this.toggleDisabled();
		this.$el.toggleClass( 'hidden', ! this.canShow );
	},

	selectDeactivate: function() {
		this.toggleDisabled();
		this.$el.addClass( 'hidden' );
	},

	render: function() {
		Button.prototype.render.apply( this, arguments );
		this.selectActivate();
		return this;
	}
});

module.exports = DeleteSelectedPermanently;

},{}],6:[function(require,module,exports){
/**
 * wp.media.view.DeleteSelectedButton
 *
 * A button that handles bulk Delete/Trash logic
 *
 * @class
 * @augments wp.media.view.Button
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Button = wp.media.view.Button,
	l10n = wp.media.view.l10n,
	DeleteSelected;

DeleteSelected = Button.extend({
	initialize: function() {
		Button.prototype.initialize.apply( this, arguments );
		if ( this.options.filters ) {
			this.options.filters.model.on( 'change', this.filterChange, this );
		}
		this.controller.on( 'selection:toggle', this.toggleDisabled, this );
	},

	filterChange: function( model ) {
		if ( 'trash' === model.get( 'status' ) ) {
			this.model.set( 'text', l10n.untrashSelected );
		} else if ( wp.media.view.settings.mediaTrash ) {
			this.model.set( 'text', l10n.trashSelected );
		} else {
			this.model.set( 'text', l10n.deleteSelected );
		}
	},

	toggleDisabled: function() {
		this.model.set( 'disabled', ! this.controller.state().get( 'selection' ).length );
	},

	render: function() {
		Button.prototype.render.apply( this, arguments );
		if ( this.controller.isModeActive( 'select' ) ) {
			this.$el.addClass( 'delete-selected-button' );
		} else {
			this.$el.addClass( 'delete-selected-button hidden' );
		}
		this.toggleDisabled();
		return this;
	}
});

module.exports = DeleteSelected;

},{}],7:[function(require,module,exports){
/**
 * wp.media.view.SelectModeToggleButton
 *
 * @class
 * @augments wp.media.view.Button
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Button = wp.media.view.Button,
	l10n = wp.media.view.l10n,
	SelectModeToggle;

SelectModeToggle = Button.extend({
	initialize: function() {
		_.defaults( this.options, {
			size : ''
		} );

		Button.prototype.initialize.apply( this, arguments );
		this.controller.on( 'select:activate select:deactivate', this.toggleBulkEditHandler, this );
		this.controller.on( 'selection:action:done', this.back, this );
	},

	back: function () {
		this.controller.deactivateMode( 'select' ).activateMode( 'edit' );
	},

	click: function() {
		Button.prototype.click.apply( this, arguments );
		if ( this.controller.isModeActive( 'select' ) ) {
			this.back();
		} else {
			this.controller.deactivateMode( 'edit' ).activateMode( 'select' );
		}
	},

	render: function() {
		Button.prototype.render.apply( this, arguments );
		this.$el.addClass( 'select-mode-toggle-button' );
		return this;
	},

	toggleBulkEditHandler: function() {
		var toolbar = this.controller.content.get().toolbar, children;

		children = toolbar.$( '.media-toolbar-secondary > *, .media-toolbar-primary > *' );

		// TODO: the Frame should be doing all of this.
		if ( this.controller.isModeActive( 'select' ) ) {
			this.model.set( {
				size: 'large',
				text: l10n.cancelSelection
			} );
			children.not( '.spinner, .media-button' ).hide();
			this.$el.show();
			toolbar.$( '.delete-selected-button' ).removeClass( 'hidden' );
		} else {
			this.model.set( {
				size: '',
				text: l10n.bulkSelect
			} );
			this.controller.content.get().$el.removeClass( 'fixed' );
			toolbar.$el.css( 'width', '' );
			toolbar.$( '.delete-selected-button' ).addClass( 'hidden' );
			children.not( '.media-button' ).show();
			this.controller.state().get( 'selection' ).reset();
		}
	}
});

module.exports = SelectModeToggle;

},{}],8:[function(require,module,exports){
/**
 * wp.media.view.EditImage.Details
 *
 * @class
 * @augments wp.media.view.EditImage
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var View = wp.media.View,
	EditImage = wp.media.view.EditImage,
	Details;

Details = EditImage.extend({
	initialize: function( options ) {
		this.editor = window.imageEdit;
		this.frame = options.frame;
		this.controller = options.controller;
		View.prototype.initialize.apply( this, arguments );
	},

	back: function() {
		this.frame.content.mode( 'edit-metadata' );
	},

	save: function() {
		this.model.fetch().done( _.bind( function() {
			this.frame.content.mode( 'edit-metadata' );
		}, this ) );
	}
});

module.exports = Details;

},{}],9:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.EditAttachments
 *
 * A frame for editing the details of a specific media item.
 *
 * Opens in a modal by default.
 *
 * Requires an attachment model to be passed in the options hash under `model`.
 *
 * @class
 * @augments wp.media.view.Frame
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
var Frame = wp.media.view.Frame,
	MediaFrame = wp.media.view.MediaFrame,

	$ = jQuery,
	EditAttachments;

EditAttachments = MediaFrame.extend({

	className: 'edit-attachment-frame',
	template:  wp.template( 'edit-attachment-frame' ),
	regions:   [ 'title', 'content' ],

	events: {
		'click .left':  'previousMediaItem',
		'click .right': 'nextMediaItem'
	},

	initialize: function() {
		Frame.prototype.initialize.apply( this, arguments );

		_.defaults( this.options, {
			modal: true,
			state: 'edit-attachment'
		});

		this.controller = this.options.controller;
		this.gridRouter = this.controller.gridRouter;
		this.library = this.options.library;

		if ( this.options.model ) {
			this.model = this.options.model;
		}

		this.bindHandlers();
		this.createStates();
		this.createModal();

		this.title.mode( 'default' );
		this.toggleNav();
	},

	bindHandlers: function() {
		// Bind default title creation.
		this.on( 'title:create:default', this.createTitle, this );

		// Close the modal if the attachment is deleted.
		this.listenTo( this.model, 'change:status destroy', this.close, this );

		this.on( 'content:create:edit-metadata', this.editMetadataMode, this );
		this.on( 'content:create:edit-image', this.editImageMode, this );
		this.on( 'content:render:edit-image', this.editImageModeRender, this );
		this.on( 'close', this.detach );
	},

	createModal: function() {
		// Initialize modal container view.
		if ( this.options.modal ) {
			this.modal = new wp.media.view.Modal({
				controller: this,
				title:      this.options.title
			});

			this.modal.on( 'open', _.bind( function () {
				$( 'body' ).on( 'keydown.media-modal', _.bind( this.keyEvent, this ) );
			}, this ) );

			// Completely destroy the modal DOM element when closing it.
			this.modal.on( 'close', _.bind( function() {
				this.modal.remove();
				$( 'body' ).off( 'keydown.media-modal' ); /* remove the keydown event */
				// Restore the original focus item if possible
				$( 'li.attachment[data-id="' + this.model.get( 'id' ) +'"]' ).focus();
				this.resetRoute();
			}, this ) );

			// Set this frame as the modal's content.
			this.modal.content( this );
			this.modal.open();
		}
	},

	/**
	 * Add the default states to the frame.
	 */
	createStates: function() {
		this.states.add([
			new wp.media.controller.EditAttachmentMetadata( { model: this.model } )
		]);
	},

	/**
	 * Content region rendering callback for the `edit-metadata` mode.
	 *
	 * @param {Object} contentRegion Basic object with a `view` property, which
	 *                               should be set with the proper region view.
	 */
	editMetadataMode: function( contentRegion ) {
		contentRegion.view = new wp.media.view.Attachment.Details.TwoColumn({
			controller: this,
			model:      this.model
		});

		/**
		 * Attach a subview to display fields added via the
		 * `attachment_fields_to_edit` filter.
		 */
		contentRegion.view.views.set( '.attachment-compat', new wp.media.view.AttachmentCompat({
			controller: this,
			model:      this.model
		}) );

		// Update browser url when navigating media details
		if ( this.model ) {
			this.gridRouter.navigate( this.gridRouter.baseUrl( '?item=' + this.model.id ) );
		}
	},

	/**
	 * Render the EditImage view into the frame's content region.
	 *
	 * @param {Object} contentRegion Basic object with a `view` property, which
	 *                               should be set with the proper region view.
	 */
	editImageMode: function( contentRegion ) {
		var editImageController = new wp.media.controller.EditImage( {
			model: this.model,
			frame: this
		} );
		// Noop some methods.
		editImageController._toolbar = function() {};
		editImageController._router = function() {};
		editImageController._menu = function() {};

		contentRegion.view = new wp.media.view.EditImage.Details( {
			model: this.model,
			frame: this,
			controller: editImageController
		} );
	},

	editImageModeRender: function( view ) {
		view.on( 'ready', view.loadEditor );
	},

	toggleNav: function() {
		this.$('.left').toggleClass( 'disabled', ! this.hasPrevious() );
		this.$('.right').toggleClass( 'disabled', ! this.hasNext() );
	},

	/**
	 * Rerender the view.
	 */
	rerender: function() {
		// Only rerender the `content` region.
		if ( this.content.mode() !== 'edit-metadata' ) {
			this.content.mode( 'edit-metadata' );
		} else {
			this.content.render();
		}

		this.toggleNav();
	},

	/**
	 * Click handler to switch to the previous media item.
	 */
	previousMediaItem: function() {
		if ( ! this.hasPrevious() ) {
			this.$( '.left' ).blur();
			return;
		}
		this.model = this.library.at( this.getCurrentIndex() - 1 );
		this.rerender();
		this.$( '.left' ).focus();
	},

	/**
	 * Click handler to switch to the next media item.
	 */
	nextMediaItem: function() {
		if ( ! this.hasNext() ) {
			this.$( '.right' ).blur();
			return;
		}
		this.model = this.library.at( this.getCurrentIndex() + 1 );
		this.rerender();
		this.$( '.right' ).focus();
	},

	getCurrentIndex: function() {
		return this.library.indexOf( this.model );
	},

	hasNext: function() {
		return ( this.getCurrentIndex() + 1 ) < this.library.length;
	},

	hasPrevious: function() {
		return ( this.getCurrentIndex() - 1 ) > -1;
	},
	/**
	 * Respond to the keyboard events: right arrow, left arrow, except when
	 * focus is in a textarea or input field.
	 */
	keyEvent: function( event ) {
		if ( ( 'INPUT' === event.target.nodeName || 'TEXTAREA' === event.target.nodeName ) && ! ( event.target.readOnly || event.target.disabled ) ) {
			return;
		}

		// The right arrow key
		if ( 39 === event.keyCode ) {
			this.nextMediaItem();
		}
		// The left arrow key
		if ( 37 === event.keyCode ) {
			this.previousMediaItem();
		}
	},

	resetRoute: function() {
		this.gridRouter.navigate( this.gridRouter.baseUrl( '' ) );
	}
});

module.exports = EditAttachments;

},{}],10:[function(require,module,exports){
/**
 * wp.media.view.MediaFrame.Manage
 *
 * A generic management frame workflow.
 *
 * Used in the media grid view.
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
	Library = wp.media.controller.Library,

	$ = Backbone.$,
	Manage;

Manage = MediaFrame.extend({
	/**
	 * @global wp.Uploader
	 */
	initialize: function() {
		_.defaults( this.options, {
			title:     '',
			modal:     false,
			selection: [],
			library:   {}, // Options hash for the query to the media library.
			multiple:  'add',
			state:     'library',
			uploader:  true,
			mode:      [ 'grid', 'edit' ]
		});

		this.$body = $( document.body );
		this.$window = $( window );
		this.$adminBar = $( '#wpadminbar' );
		this.$window.on( 'scroll resize', _.debounce( _.bind( this.fixPosition, this ), 15 ) );
		$( document ).on( 'click', '.page-title-action', _.bind( this.addNewClickHandler, this ) );

		// Ensure core and media grid view UI is enabled.
		this.$el.addClass('wp-core-ui');

		// Force the uploader off if the upload limit has been exceeded or
		// if the browser isn't supported.
		if ( wp.Uploader.limitExceeded || ! wp.Uploader.browser.supported ) {
			this.options.uploader = false;
		}

		// Initialize a window-wide uploader.
		if ( this.options.uploader ) {
			this.uploader = new wp.media.view.UploaderWindow({
				controller: this,
				uploader: {
					dropzone:  document.body,
					container: document.body
				}
			}).render();
			this.uploader.ready();
			$('body').append( this.uploader.el );

			this.options.uploader = false;
		}

		this.gridRouter = new wp.media.view.MediaFrame.Manage.Router();

		// Call 'initialize' directly on the parent class.
		MediaFrame.prototype.initialize.apply( this, arguments );

		// Append the frame view directly the supplied container.
		this.$el.appendTo( this.options.container );

		this.createStates();
		this.bindRegionModeHandlers();
		this.render();
		this.bindSearchHandler();
	},

	bindSearchHandler: function() {
		var search = this.$( '#media-search-input' ),
			currentSearch = this.options.container.data( 'search' ),
			searchView = this.browserView.toolbar.get( 'search' ).$el,
			listMode = this.$( '.view-list' ),

			input  = _.debounce( function (e) {
				var val = $( e.currentTarget ).val(),
					url = '';

				if ( val ) {
					url += '?search=' + val;
				}
				this.gridRouter.navigate( this.gridRouter.baseUrl( url ) );
			}, 1000 );

		// Update the URL when entering search string (at most once per second)
		search.on( 'input', _.bind( input, this ) );
		searchView.val( currentSearch ).trigger( 'input' );

		this.gridRouter.on( 'route:search', function () {
			var href = window.location.href;
			if ( href.indexOf( 'mode=' ) > -1 ) {
				href = href.replace( /mode=[^&]+/g, 'mode=list' );
			} else {
				href += href.indexOf( '?' ) > -1 ? '&mode=list' : '?mode=list';
			}
			href = href.replace( 'search=', 's=' );
			listMode.prop( 'href', href );
		} );
	},

	/**
	 * Create the default states for the frame.
	 */
	createStates: function() {
		var options = this.options;

		if ( this.options.states ) {
			return;
		}

		// Add the default states.
		this.states.add([
			new Library({
				library:            wp.media.query( options.library ),
				multiple:           options.multiple,
				title:              options.title,
				content:            'browse',
				toolbar:            'select',
				contentUserSetting: false,
				filterable:         'all',
				autoSelect:         false
			})
		]);
	},

	/**
	 * Bind region mode activation events to proper handlers.
	 */
	bindRegionModeHandlers: function() {
		this.on( 'content:create:browse', this.browseContent, this );

		// Handle a frame-level event for editing an attachment.
		this.on( 'edit:attachment', this.openEditAttachmentModal, this );

		this.on( 'select:activate', this.bindKeydown, this );
		this.on( 'select:deactivate', this.unbindKeydown, this );
	},

	handleKeydown: function( e ) {
		if ( 27 === e.which ) {
			e.preventDefault();
			this.deactivateMode( 'select' ).activateMode( 'edit' );
		}
	},

	bindKeydown: function() {
		this.$body.on( 'keydown.select', _.bind( this.handleKeydown, this ) );
	},

	unbindKeydown: function() {
		this.$body.off( 'keydown.select' );
	},

	fixPosition: function() {
		var $browser, $toolbar;
		if ( ! this.isModeActive( 'select' ) ) {
			return;
		}

		$browser = this.$('.attachments-browser');
		$toolbar = $browser.find('.media-toolbar');

		// Offset doesn't appear to take top margin into account, hence +16
		if ( ( $browser.offset().top + 16 ) < this.$window.scrollTop() + this.$adminBar.height() ) {
			$browser.addClass( 'fixed' );
			$toolbar.css('width', $browser.width() + 'px');
		} else {
			$browser.removeClass( 'fixed' );
			$toolbar.css('width', '');
		}
	},

	/**
	 * Click handler for the `Add New` button.
	 */
	addNewClickHandler: function( event ) {
		event.preventDefault();
		this.trigger( 'toggle:upload:attachment' );

		if ( this.uploader ) {
			this.uploader.refresh();
		}
	},

	/**
	 * Open the Edit Attachment modal.
	 */
	openEditAttachmentModal: function( model ) {
		// Create a new EditAttachment frame, passing along the library and the attachment model.
		wp.media( {
			frame:       'edit-attachments',
			controller:  this,
			library:     this.state().get('library'),
			model:       model
		} );
	},

	/**
	 * Create an attachments browser view within the content region.
	 *
	 * @param {Object} contentRegion Basic object with a `view` property, which
	 *                               should be set with the proper region view.
	 * @this wp.media.controller.Region
	 */
	browseContent: function( contentRegion ) {
		var state = this.state();

		// Browse our library of attachments.
		this.browserView = contentRegion.view = new wp.media.view.AttachmentsBrowser({
			controller: this,
			collection: state.get('library'),
			selection:  state.get('selection'),
			model:      state,
			sortable:   state.get('sortable'),
			search:     state.get('searchable'),
			filters:    state.get('filterable'),
			date:       state.get('date'),
			display:    state.get('displaySettings'),
			dragInfo:   state.get('dragInfo'),
			sidebar:    'errors',

			suggestedWidth:  state.get('suggestedWidth'),
			suggestedHeight: state.get('suggestedHeight'),

			AttachmentView: state.get('AttachmentView'),

			scrollElement: document
		});
		this.browserView.on( 'ready', _.bind( this.bindDeferred, this ) );

		this.errors = wp.Uploader.errors;
		this.errors.on( 'add remove reset', this.sidebarVisibility, this );
	},

	sidebarVisibility: function() {
		this.browserView.$( '.media-sidebar' ).toggle( !! this.errors.length );
	},

	bindDeferred: function() {
		if ( ! this.browserView.dfd ) {
			return;
		}
		this.browserView.dfd.done( _.bind( this.startHistory, this ) );
	},

	startHistory: function() {
		// Verify pushState support and activate
		if ( window.history && window.history.pushState ) {
			Backbone.history.start( {
				root: window._wpMediaGridSettings.adminUrl,
				pushState: true
			} );
		}
	}
});

module.exports = Manage;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvY29udHJvbGxlcnMvZWRpdC1hdHRhY2htZW50LW1ldGFkYXRhLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL2dyaWQubWFuaWZlc3QuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvcm91dGVycy9tYW5hZ2UuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYXR0YWNobWVudC9kZXRhaWxzLXR3by1jb2x1bW4uanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvYnV0dG9uL2RlbGV0ZS1zZWxlY3RlZC1wZXJtYW5lbnRseS5qcyIsInNyYy93cC1pbmNsdWRlcy9qcy9tZWRpYS92aWV3cy9idXR0b24vZGVsZXRlLXNlbGVjdGVkLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2J1dHRvbi9zZWxlY3QtbW9kZS10b2dnbGUuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZWRpdC1pbWFnZS1kZXRhaWxzLmpzIiwic3JjL3dwLWluY2x1ZGVzL2pzL21lZGlhL3ZpZXdzL2ZyYW1lL2VkaXQtYXR0YWNobWVudHMuanMiLCJzcmMvd3AtaW5jbHVkZXMvanMvbWVkaWEvdmlld3MvZnJhbWUvbWFuYWdlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiB3cC5tZWRpYS5jb250cm9sbGVyLkVkaXRBdHRhY2htZW50TWV0YWRhdGFcbiAqXG4gKiBBIHN0YXRlIGZvciBlZGl0aW5nIGFuIGF0dGFjaG1lbnQncyBtZXRhZGF0YS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqL1xudmFyIGwxMG4gPSB3cC5tZWRpYS52aWV3LmwxMG4sXG5cdEVkaXRBdHRhY2htZW50TWV0YWRhdGE7XG5cbkVkaXRBdHRhY2htZW50TWV0YWRhdGEgPSB3cC5tZWRpYS5jb250cm9sbGVyLlN0YXRlLmV4dGVuZCh7XG5cdGRlZmF1bHRzOiB7XG5cdFx0aWQ6ICAgICAgJ2VkaXQtYXR0YWNobWVudCcsXG5cdFx0Ly8gVGl0bGUgc3RyaW5nIHBhc3NlZCB0byB0aGUgZnJhbWUncyB0aXRsZSByZWdpb24gdmlldy5cblx0XHR0aXRsZTogICBsMTBuLmF0dGFjaG1lbnREZXRhaWxzLFxuXHRcdC8vIFJlZ2lvbiBtb2RlIGRlZmF1bHRzLlxuXHRcdGNvbnRlbnQ6ICdlZGl0LW1ldGFkYXRhJyxcblx0XHRtZW51OiAgICBmYWxzZSxcblx0XHR0b29sYmFyOiBmYWxzZSxcblx0XHRyb3V0ZXI6ICBmYWxzZVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0QXR0YWNobWVudE1ldGFkYXRhO1xuIiwidmFyIG1lZGlhID0gd3AubWVkaWE7XG5cbm1lZGlhLmNvbnRyb2xsZXIuRWRpdEF0dGFjaG1lbnRNZXRhZGF0YSA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2VkaXQtYXR0YWNobWVudC1tZXRhZGF0YS5qcycgKTtcbm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5NYW5hZ2UgPSByZXF1aXJlKCAnLi92aWV3cy9mcmFtZS9tYW5hZ2UuanMnICk7XG5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRGV0YWlscy5Ud29Db2x1bW4gPSByZXF1aXJlKCAnLi92aWV3cy9hdHRhY2htZW50L2RldGFpbHMtdHdvLWNvbHVtbi5qcycgKTtcbm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5NYW5hZ2UuUm91dGVyID0gcmVxdWlyZSggJy4vcm91dGVycy9tYW5hZ2UuanMnICk7XG5tZWRpYS52aWV3LkVkaXRJbWFnZS5EZXRhaWxzID0gcmVxdWlyZSggJy4vdmlld3MvZWRpdC1pbWFnZS1kZXRhaWxzLmpzJyApO1xubWVkaWEudmlldy5NZWRpYUZyYW1lLkVkaXRBdHRhY2htZW50cyA9IHJlcXVpcmUoICcuL3ZpZXdzL2ZyYW1lL2VkaXQtYXR0YWNobWVudHMuanMnICk7XG5tZWRpYS52aWV3LlNlbGVjdE1vZGVUb2dnbGVCdXR0b24gPSByZXF1aXJlKCAnLi92aWV3cy9idXR0b24vc2VsZWN0LW1vZGUtdG9nZ2xlLmpzJyApO1xubWVkaWEudmlldy5EZWxldGVTZWxlY3RlZEJ1dHRvbiA9IHJlcXVpcmUoICcuL3ZpZXdzL2J1dHRvbi9kZWxldGUtc2VsZWN0ZWQuanMnICk7XG5tZWRpYS52aWV3LkRlbGV0ZVNlbGVjdGVkUGVybWFuZW50bHlCdXR0b24gPSByZXF1aXJlKCAnLi92aWV3cy9idXR0b24vZGVsZXRlLXNlbGVjdGVkLXBlcm1hbmVudGx5LmpzJyApO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuTWFuYWdlLlJvdXRlclxuICpcbiAqIEEgcm91dGVyIGZvciBoYW5kbGluZyB0aGUgYnJvd3NlciBoaXN0b3J5IGFuZCBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5Sb3V0ZXJcbiAqL1xudmFyIFJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuXHRyb3V0ZXM6IHtcblx0XHQndXBsb2FkLnBocD9pdGVtPTpzbHVnJzogICAgJ3Nob3dJdGVtJyxcblx0XHQndXBsb2FkLnBocD9zZWFyY2g9OnF1ZXJ5JzogJ3NlYXJjaCdcblx0fSxcblxuXHQvLyBNYXAgcm91dGVzIGFnYWluc3QgdGhlIHBhZ2UgVVJMXG5cdGJhc2VVcmw6IGZ1bmN0aW9uKCB1cmwgKSB7XG5cdFx0cmV0dXJuICd1cGxvYWQucGhwJyArIHVybDtcblx0fSxcblxuXHQvLyBSZXNwb25kIHRvIHRoZSBzZWFyY2ggcm91dGUgYnkgZmlsbGluZyB0aGUgc2VhcmNoIGZpZWxkIGFuZCB0cmlnZ2dlcmluZyB0aGUgaW5wdXQgZXZlbnRcblx0c2VhcmNoOiBmdW5jdGlvbiggcXVlcnkgKSB7XG5cdFx0alF1ZXJ5KCAnI21lZGlhLXNlYXJjaC1pbnB1dCcgKS52YWwoIHF1ZXJ5ICkudHJpZ2dlciggJ2lucHV0JyApO1xuXHR9LFxuXG5cdC8vIFNob3cgdGhlIG1vZGFsIHdpdGggYSBzcGVjaWZpYyBpdGVtXG5cdHNob3dJdGVtOiBmdW5jdGlvbiggcXVlcnkgKSB7XG5cdFx0dmFyIG1lZGlhID0gd3AubWVkaWEsXG5cdFx0XHRsaWJyYXJ5ID0gbWVkaWEuZnJhbWUuc3RhdGUoKS5nZXQoJ2xpYnJhcnknKSxcblx0XHRcdGl0ZW07XG5cblx0XHQvLyBUcmlnZ2VyIHRoZSBtZWRpYSBmcmFtZSB0byBvcGVuIHRoZSBjb3JyZWN0IGl0ZW1cblx0XHRpdGVtID0gbGlicmFyeS5maW5kV2hlcmUoIHsgaWQ6IHBhcnNlSW50KCBxdWVyeSwgMTAgKSB9ICk7XG5cdFx0aWYgKCBpdGVtICkge1xuXHRcdFx0bWVkaWEuZnJhbWUudHJpZ2dlciggJ2VkaXQ6YXR0YWNobWVudCcsIGl0ZW0gKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aXRlbSA9IG1lZGlhLmF0dGFjaG1lbnQoIHF1ZXJ5ICk7XG5cdFx0XHRtZWRpYS5mcmFtZS5saXN0ZW5UbyggaXRlbSwgJ2NoYW5nZScsIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdFx0bWVkaWEuZnJhbWUuc3RvcExpc3RlbmluZyggaXRlbSApO1xuXHRcdFx0XHRtZWRpYS5mcmFtZS50cmlnZ2VyKCAnZWRpdDphdHRhY2htZW50JywgbW9kZWwgKTtcblx0XHRcdH0gKTtcblx0XHRcdGl0ZW0uZmV0Y2goKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5BdHRhY2htZW50LkRldGFpbHMuVHdvQ29sdW1uXG4gKlxuICogQSBzaW1pbGFyIHZpZXcgdG8gbWVkaWEudmlldy5BdHRhY2htZW50LkRldGFpbHNcbiAqIGZvciB1c2UgaW4gdGhlIEVkaXQgQXR0YWNobWVudCBtb2RhbC5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkF0dGFjaG1lbnQuRGV0YWlsc1xuICogQGF1Z21lbnRzIHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudFxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgRGV0YWlscyA9IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5EZXRhaWxzLFxuXHRUd29Db2x1bW47XG5cblR3b0NvbHVtbiA9IERldGFpbHMuZXh0ZW5kKHtcblx0dGVtcGxhdGU6IHdwLnRlbXBsYXRlKCAnYXR0YWNobWVudC1kZXRhaWxzLXR3by1jb2x1bW4nICksXG5cblx0ZWRpdEF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMuY29udHJvbGxlci5jb250ZW50Lm1vZGUoICdlZGl0LWltYWdlJyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBOb29wIHRoaXMgZnJvbSBwYXJlbnQgY2xhc3MsIGRvZXNuJ3QgYXBwbHkgaGVyZS5cblx0ICovXG5cdHRvZ2dsZVNlbGVjdGlvbkhhbmRsZXI6IGZ1bmN0aW9uKCkge30sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHREZXRhaWxzLnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0d3AubWVkaWEubWl4aW4ucmVtb3ZlQWxsUGxheWVycygpO1xuXHRcdHRoaXMuJCggJ2F1ZGlvLCB2aWRlbycgKS5lYWNoKCBmdW5jdGlvbiAoaSwgZWxlbSkge1xuXHRcdFx0dmFyIGVsID0gd3AubWVkaWEudmlldy5NZWRpYURldGFpbHMucHJlcGFyZVNyYyggZWxlbSApO1xuXHRcdFx0bmV3IHdpbmRvdy5NZWRpYUVsZW1lbnRQbGF5ZXIoIGVsLCB3cC5tZWRpYS5taXhpbi5tZWpzU2V0dGluZ3MgKTtcblx0XHR9ICk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFR3b0NvbHVtbjtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5EZWxldGVTZWxlY3RlZFBlcm1hbmVudGx5QnV0dG9uXG4gKlxuICogV2hlbiBNRURJQV9UUkFTSCBpcyB0cnVlLCBhIGJ1dHRvbiB0aGF0IGhhbmRsZXMgYnVsayBEZWxldGUgUGVybWFuZW50bHkgbG9naWNcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkRlbGV0ZVNlbGVjdGVkQnV0dG9uXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5CdXR0b25cbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEJ1dHRvbiA9IHdwLm1lZGlhLnZpZXcuQnV0dG9uLFxuXHREZWxldGVTZWxlY3RlZCA9IHdwLm1lZGlhLnZpZXcuRGVsZXRlU2VsZWN0ZWRCdXR0b24sXG5cdERlbGV0ZVNlbGVjdGVkUGVybWFuZW50bHk7XG5cbkRlbGV0ZVNlbGVjdGVkUGVybWFuZW50bHkgPSBEZWxldGVTZWxlY3RlZC5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHREZWxldGVTZWxlY3RlZC5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy5jb250cm9sbGVyLm9uKCAnc2VsZWN0OmFjdGl2YXRlJywgdGhpcy5zZWxlY3RBY3RpdmF0ZSwgdGhpcyApO1xuXHRcdHRoaXMuY29udHJvbGxlci5vbiggJ3NlbGVjdDpkZWFjdGl2YXRlJywgdGhpcy5zZWxlY3REZWFjdGl2YXRlLCB0aGlzICk7XG5cdH0sXG5cblx0ZmlsdGVyQ2hhbmdlOiBmdW5jdGlvbiggbW9kZWwgKSB7XG5cdFx0dGhpcy5jYW5TaG93ID0gKCAndHJhc2gnID09PSBtb2RlbC5nZXQoICdzdGF0dXMnICkgKTtcblx0fSxcblxuXHRzZWxlY3RBY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50b2dnbGVEaXNhYmxlZCgpO1xuXHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCAnaGlkZGVuJywgISB0aGlzLmNhblNob3cgKTtcblx0fSxcblxuXHRzZWxlY3REZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRvZ2dsZURpc2FibGVkKCk7XG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdoaWRkZW4nICk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRCdXR0b24ucHJvdG90eXBlLnJlbmRlci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy5zZWxlY3RBY3RpdmF0ZSgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZWxldGVTZWxlY3RlZFBlcm1hbmVudGx5O1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3LkRlbGV0ZVNlbGVjdGVkQnV0dG9uXG4gKlxuICogQSBidXR0b24gdGhhdCBoYW5kbGVzIGJ1bGsgRGVsZXRlL1RyYXNoIGxvZ2ljXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5CdXR0b25cbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEJ1dHRvbiA9IHdwLm1lZGlhLnZpZXcuQnV0dG9uLFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHREZWxldGVTZWxlY3RlZDtcblxuRGVsZXRlU2VsZWN0ZWQgPSBCdXR0b24uZXh0ZW5kKHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0QnV0dG9uLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHRpZiAoIHRoaXMub3B0aW9ucy5maWx0ZXJzICkge1xuXHRcdFx0dGhpcy5vcHRpb25zLmZpbHRlcnMubW9kZWwub24oICdjaGFuZ2UnLCB0aGlzLmZpbHRlckNoYW5nZSwgdGhpcyApO1xuXHRcdH1cblx0XHR0aGlzLmNvbnRyb2xsZXIub24oICdzZWxlY3Rpb246dG9nZ2xlJywgdGhpcy50b2dnbGVEaXNhYmxlZCwgdGhpcyApO1xuXHR9LFxuXG5cdGZpbHRlckNoYW5nZTogZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdGlmICggJ3RyYXNoJyA9PT0gbW9kZWwuZ2V0KCAnc3RhdHVzJyApICkge1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoICd0ZXh0JywgbDEwbi51bnRyYXNoU2VsZWN0ZWQgKTtcblx0XHR9IGVsc2UgaWYgKCB3cC5tZWRpYS52aWV3LnNldHRpbmdzLm1lZGlhVHJhc2ggKSB7XG5cdFx0XHR0aGlzLm1vZGVsLnNldCggJ3RleHQnLCBsMTBuLnRyYXNoU2VsZWN0ZWQgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoICd0ZXh0JywgbDEwbi5kZWxldGVTZWxlY3RlZCApO1xuXHRcdH1cblx0fSxcblxuXHR0b2dnbGVEaXNhYmxlZDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5tb2RlbC5zZXQoICdkaXNhYmxlZCcsICEgdGhpcy5jb250cm9sbGVyLnN0YXRlKCkuZ2V0KCAnc2VsZWN0aW9uJyApLmxlbmd0aCApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0QnV0dG9uLnByb3RvdHlwZS5yZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdGlmICggdGhpcy5jb250cm9sbGVyLmlzTW9kZUFjdGl2ZSggJ3NlbGVjdCcgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnZGVsZXRlLXNlbGVjdGVkLWJ1dHRvbicgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdkZWxldGUtc2VsZWN0ZWQtYnV0dG9uIGhpZGRlbicgKTtcblx0XHR9XG5cdFx0dGhpcy50b2dnbGVEaXNhYmxlZCgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZWxldGVTZWxlY3RlZDtcbiIsIi8qKlxuICogd3AubWVkaWEudmlldy5TZWxlY3RNb2RlVG9nZ2xlQnV0dG9uXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5CdXR0b25cbiAqIEBhdWdtZW50cyB3cC5tZWRpYS5WaWV3XG4gKiBAYXVnbWVudHMgd3AuQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqL1xudmFyIEJ1dHRvbiA9IHdwLm1lZGlhLnZpZXcuQnV0dG9uLFxuXHRsMTBuID0gd3AubWVkaWEudmlldy5sMTBuLFxuXHRTZWxlY3RNb2RlVG9nZ2xlO1xuXG5TZWxlY3RNb2RlVG9nZ2xlID0gQnV0dG9uLmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0c2l6ZSA6ICcnXG5cdFx0fSApO1xuXG5cdFx0QnV0dG9uLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIub24oICdzZWxlY3Q6YWN0aXZhdGUgc2VsZWN0OmRlYWN0aXZhdGUnLCB0aGlzLnRvZ2dsZUJ1bGtFZGl0SGFuZGxlciwgdGhpcyApO1xuXHRcdHRoaXMuY29udHJvbGxlci5vbiggJ3NlbGVjdGlvbjphY3Rpb246ZG9uZScsIHRoaXMuYmFjaywgdGhpcyApO1xuXHR9LFxuXG5cdGJhY2s6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmNvbnRyb2xsZXIuZGVhY3RpdmF0ZU1vZGUoICdzZWxlY3QnICkuYWN0aXZhdGVNb2RlKCAnZWRpdCcgKTtcblx0fSxcblxuXHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0QnV0dG9uLnByb3RvdHlwZS5jbGljay5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0aWYgKCB0aGlzLmNvbnRyb2xsZXIuaXNNb2RlQWN0aXZlKCAnc2VsZWN0JyApICkge1xuXHRcdFx0dGhpcy5iYWNrKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuY29udHJvbGxlci5kZWFjdGl2YXRlTW9kZSggJ2VkaXQnICkuYWN0aXZhdGVNb2RlKCAnc2VsZWN0JyApO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdEJ1dHRvbi5wcm90b3R5cGUucmVuZGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ3NlbGVjdC1tb2RlLXRvZ2dsZS1idXR0b24nICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0dG9nZ2xlQnVsa0VkaXRIYW5kbGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdG9vbGJhciA9IHRoaXMuY29udHJvbGxlci5jb250ZW50LmdldCgpLnRvb2xiYXIsIGNoaWxkcmVuO1xuXG5cdFx0Y2hpbGRyZW4gPSB0b29sYmFyLiQoICcubWVkaWEtdG9vbGJhci1zZWNvbmRhcnkgPiAqLCAubWVkaWEtdG9vbGJhci1wcmltYXJ5ID4gKicgKTtcblxuXHRcdC8vIFRPRE86IHRoZSBGcmFtZSBzaG91bGQgYmUgZG9pbmcgYWxsIG9mIHRoaXMuXG5cdFx0aWYgKCB0aGlzLmNvbnRyb2xsZXIuaXNNb2RlQWN0aXZlKCAnc2VsZWN0JyApICkge1xuXHRcdFx0dGhpcy5tb2RlbC5zZXQoIHtcblx0XHRcdFx0c2l6ZTogJ2xhcmdlJyxcblx0XHRcdFx0dGV4dDogbDEwbi5jYW5jZWxTZWxlY3Rpb25cblx0XHRcdH0gKTtcblx0XHRcdGNoaWxkcmVuLm5vdCggJy5zcGlubmVyLCAubWVkaWEtYnV0dG9uJyApLmhpZGUoKTtcblx0XHRcdHRoaXMuJGVsLnNob3coKTtcblx0XHRcdHRvb2xiYXIuJCggJy5kZWxldGUtc2VsZWN0ZWQtYnV0dG9uJyApLnJlbW92ZUNsYXNzKCAnaGlkZGVuJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLm1vZGVsLnNldCgge1xuXHRcdFx0XHRzaXplOiAnJyxcblx0XHRcdFx0dGV4dDogbDEwbi5idWxrU2VsZWN0XG5cdFx0XHR9ICk7XG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIuY29udGVudC5nZXQoKS4kZWwucmVtb3ZlQ2xhc3MoICdmaXhlZCcgKTtcblx0XHRcdHRvb2xiYXIuJGVsLmNzcyggJ3dpZHRoJywgJycgKTtcblx0XHRcdHRvb2xiYXIuJCggJy5kZWxldGUtc2VsZWN0ZWQtYnV0dG9uJyApLmFkZENsYXNzKCAnaGlkZGVuJyApO1xuXHRcdFx0Y2hpbGRyZW4ubm90KCAnLm1lZGlhLWJ1dHRvbicgKS5zaG93KCk7XG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIuc3RhdGUoKS5nZXQoICdzZWxlY3Rpb24nICkucmVzZXQoKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdE1vZGVUb2dnbGU7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuRWRpdEltYWdlLkRldGFpbHNcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkVkaXRJbWFnZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICovXG52YXIgVmlldyA9IHdwLm1lZGlhLlZpZXcsXG5cdEVkaXRJbWFnZSA9IHdwLm1lZGlhLnZpZXcuRWRpdEltYWdlLFxuXHREZXRhaWxzO1xuXG5EZXRhaWxzID0gRWRpdEltYWdlLmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdHRoaXMuZWRpdG9yID0gd2luZG93LmltYWdlRWRpdDtcblx0XHR0aGlzLmZyYW1lID0gb3B0aW9ucy5mcmFtZTtcblx0XHR0aGlzLmNvbnRyb2xsZXIgPSBvcHRpb25zLmNvbnRyb2xsZXI7XG5cdFx0Vmlldy5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0YmFjazogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mcmFtZS5jb250ZW50Lm1vZGUoICdlZGl0LW1ldGFkYXRhJyApO1xuXHR9LFxuXG5cdHNhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubW9kZWwuZmV0Y2goKS5kb25lKCBfLmJpbmQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5mcmFtZS5jb250ZW50Lm1vZGUoICdlZGl0LW1ldGFkYXRhJyApO1xuXHRcdH0sIHRoaXMgKSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXRhaWxzO1xuIiwiLyoqXG4gKiB3cC5tZWRpYS52aWV3Lk1lZGlhRnJhbWUuRWRpdEF0dGFjaG1lbnRzXG4gKlxuICogQSBmcmFtZSBmb3IgZWRpdGluZyB0aGUgZGV0YWlscyBvZiBhIHNwZWNpZmljIG1lZGlhIGl0ZW0uXG4gKlxuICogT3BlbnMgaW4gYSBtb2RhbCBieSBkZWZhdWx0LlxuICpcbiAqIFJlcXVpcmVzIGFuIGF0dGFjaG1lbnQgbW9kZWwgdG8gYmUgcGFzc2VkIGluIHRoZSBvcHRpb25zIGhhc2ggdW5kZXIgYG1vZGVsYC5cbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyB3cC5tZWRpYS52aWV3LkZyYW1lXG4gKiBAYXVnbWVudHMgd3AubWVkaWEuVmlld1xuICogQGF1Z21lbnRzIHdwLkJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKiBAbWl4ZXMgd3AubWVkaWEuY29udHJvbGxlci5TdGF0ZU1hY2hpbmVcbiAqL1xudmFyIEZyYW1lID0gd3AubWVkaWEudmlldy5GcmFtZSxcblx0TWVkaWFGcmFtZSA9IHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZSxcblxuXHQkID0galF1ZXJ5LFxuXHRFZGl0QXR0YWNobWVudHM7XG5cbkVkaXRBdHRhY2htZW50cyA9IE1lZGlhRnJhbWUuZXh0ZW5kKHtcblxuXHRjbGFzc05hbWU6ICdlZGl0LWF0dGFjaG1lbnQtZnJhbWUnLFxuXHR0ZW1wbGF0ZTogIHdwLnRlbXBsYXRlKCAnZWRpdC1hdHRhY2htZW50LWZyYW1lJyApLFxuXHRyZWdpb25zOiAgIFsgJ3RpdGxlJywgJ2NvbnRlbnQnIF0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIC5sZWZ0JzogICdwcmV2aW91c01lZGlhSXRlbScsXG5cdFx0J2NsaWNrIC5yaWdodCc6ICduZXh0TWVkaWFJdGVtJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdEZyYW1lLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0bW9kYWw6IHRydWUsXG5cdFx0XHRzdGF0ZTogJ2VkaXQtYXR0YWNobWVudCdcblx0XHR9KTtcblxuXHRcdHRoaXMuY29udHJvbGxlciA9IHRoaXMub3B0aW9ucy5jb250cm9sbGVyO1xuXHRcdHRoaXMuZ3JpZFJvdXRlciA9IHRoaXMuY29udHJvbGxlci5ncmlkUm91dGVyO1xuXHRcdHRoaXMubGlicmFyeSA9IHRoaXMub3B0aW9ucy5saWJyYXJ5O1xuXG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMubW9kZWwgKSB7XG5cdFx0XHR0aGlzLm1vZGVsID0gdGhpcy5vcHRpb25zLm1vZGVsO1xuXHRcdH1cblxuXHRcdHRoaXMuYmluZEhhbmRsZXJzKCk7XG5cdFx0dGhpcy5jcmVhdGVTdGF0ZXMoKTtcblx0XHR0aGlzLmNyZWF0ZU1vZGFsKCk7XG5cblx0XHR0aGlzLnRpdGxlLm1vZGUoICdkZWZhdWx0JyApO1xuXHRcdHRoaXMudG9nZ2xlTmF2KCk7XG5cdH0sXG5cblx0YmluZEhhbmRsZXJzOiBmdW5jdGlvbigpIHtcblx0XHQvLyBCaW5kIGRlZmF1bHQgdGl0bGUgY3JlYXRpb24uXG5cdFx0dGhpcy5vbiggJ3RpdGxlOmNyZWF0ZTpkZWZhdWx0JywgdGhpcy5jcmVhdGVUaXRsZSwgdGhpcyApO1xuXG5cdFx0Ly8gQ2xvc2UgdGhlIG1vZGFsIGlmIHRoZSBhdHRhY2htZW50IGlzIGRlbGV0ZWQuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZTpzdGF0dXMgZGVzdHJveScsIHRoaXMuY2xvc2UsIHRoaXMgKTtcblxuXHRcdHRoaXMub24oICdjb250ZW50OmNyZWF0ZTplZGl0LW1ldGFkYXRhJywgdGhpcy5lZGl0TWV0YWRhdGFNb2RlLCB0aGlzICk7XG5cdFx0dGhpcy5vbiggJ2NvbnRlbnQ6Y3JlYXRlOmVkaXQtaW1hZ2UnLCB0aGlzLmVkaXRJbWFnZU1vZGUsIHRoaXMgKTtcblx0XHR0aGlzLm9uKCAnY29udGVudDpyZW5kZXI6ZWRpdC1pbWFnZScsIHRoaXMuZWRpdEltYWdlTW9kZVJlbmRlciwgdGhpcyApO1xuXHRcdHRoaXMub24oICdjbG9zZScsIHRoaXMuZGV0YWNoICk7XG5cdH0sXG5cblx0Y3JlYXRlTW9kYWw6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEluaXRpYWxpemUgbW9kYWwgY29udGFpbmVyIHZpZXcuXG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMubW9kYWwgKSB7XG5cdFx0XHR0aGlzLm1vZGFsID0gbmV3IHdwLm1lZGlhLnZpZXcuTW9kYWwoe1xuXHRcdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0XHR0aXRsZTogICAgICB0aGlzLm9wdGlvbnMudGl0bGVcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLm1vZGFsLm9uKCAnb3BlbicsIF8uYmluZCggZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQkKCAnYm9keScgKS5vbiggJ2tleWRvd24ubWVkaWEtbW9kYWwnLCBfLmJpbmQoIHRoaXMua2V5RXZlbnQsIHRoaXMgKSApO1xuXHRcdFx0fSwgdGhpcyApICk7XG5cblx0XHRcdC8vIENvbXBsZXRlbHkgZGVzdHJveSB0aGUgbW9kYWwgRE9NIGVsZW1lbnQgd2hlbiBjbG9zaW5nIGl0LlxuXHRcdFx0dGhpcy5tb2RhbC5vbiggJ2Nsb3NlJywgXy5iaW5kKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5tb2RhbC5yZW1vdmUoKTtcblx0XHRcdFx0JCggJ2JvZHknICkub2ZmKCAna2V5ZG93bi5tZWRpYS1tb2RhbCcgKTsgLyogcmVtb3ZlIHRoZSBrZXlkb3duIGV2ZW50ICovXG5cdFx0XHRcdC8vIFJlc3RvcmUgdGhlIG9yaWdpbmFsIGZvY3VzIGl0ZW0gaWYgcG9zc2libGVcblx0XHRcdFx0JCggJ2xpLmF0dGFjaG1lbnRbZGF0YS1pZD1cIicgKyB0aGlzLm1vZGVsLmdldCggJ2lkJyApICsnXCJdJyApLmZvY3VzKCk7XG5cdFx0XHRcdHRoaXMucmVzZXRSb3V0ZSgpO1xuXHRcdFx0fSwgdGhpcyApICk7XG5cblx0XHRcdC8vIFNldCB0aGlzIGZyYW1lIGFzIHRoZSBtb2RhbCdzIGNvbnRlbnQuXG5cdFx0XHR0aGlzLm1vZGFsLmNvbnRlbnQoIHRoaXMgKTtcblx0XHRcdHRoaXMubW9kYWwub3BlbigpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQWRkIHRoZSBkZWZhdWx0IHN0YXRlcyB0byB0aGUgZnJhbWUuXG5cdCAqL1xuXHRjcmVhdGVTdGF0ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc3RhdGVzLmFkZChbXG5cdFx0XHRuZXcgd3AubWVkaWEuY29udHJvbGxlci5FZGl0QXR0YWNobWVudE1ldGFkYXRhKCB7IG1vZGVsOiB0aGlzLm1vZGVsIH0gKVxuXHRcdF0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDb250ZW50IHJlZ2lvbiByZW5kZXJpbmcgY2FsbGJhY2sgZm9yIHRoZSBgZWRpdC1tZXRhZGF0YWAgbW9kZS5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGNvbnRlbnRSZWdpb24gQmFzaWMgb2JqZWN0IHdpdGggYSBgdmlld2AgcHJvcGVydHksIHdoaWNoXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCBiZSBzZXQgd2l0aCB0aGUgcHJvcGVyIHJlZ2lvbiB2aWV3LlxuXHQgKi9cblx0ZWRpdE1ldGFkYXRhTW9kZTogZnVuY3Rpb24oIGNvbnRlbnRSZWdpb24gKSB7XG5cdFx0Y29udGVudFJlZ2lvbi52aWV3ID0gbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudC5EZXRhaWxzLlR3b0NvbHVtbih7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0bW9kZWw6ICAgICAgdGhpcy5tb2RlbFxuXHRcdH0pO1xuXG5cdFx0LyoqXG5cdFx0ICogQXR0YWNoIGEgc3VidmlldyB0byBkaXNwbGF5IGZpZWxkcyBhZGRlZCB2aWEgdGhlXG5cdFx0ICogYGF0dGFjaG1lbnRfZmllbGRzX3RvX2VkaXRgIGZpbHRlci5cblx0XHQgKi9cblx0XHRjb250ZW50UmVnaW9uLnZpZXcudmlld3Muc2V0KCAnLmF0dGFjaG1lbnQtY29tcGF0JywgbmV3IHdwLm1lZGlhLnZpZXcuQXR0YWNobWVudENvbXBhdCh7XG5cdFx0XHRjb250cm9sbGVyOiB0aGlzLFxuXHRcdFx0bW9kZWw6ICAgICAgdGhpcy5tb2RlbFxuXHRcdH0pICk7XG5cblx0XHQvLyBVcGRhdGUgYnJvd3NlciB1cmwgd2hlbiBuYXZpZ2F0aW5nIG1lZGlhIGRldGFpbHNcblx0XHRpZiAoIHRoaXMubW9kZWwgKSB7XG5cdFx0XHR0aGlzLmdyaWRSb3V0ZXIubmF2aWdhdGUoIHRoaXMuZ3JpZFJvdXRlci5iYXNlVXJsKCAnP2l0ZW09JyArIHRoaXMubW9kZWwuaWQgKSApO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogUmVuZGVyIHRoZSBFZGl0SW1hZ2UgdmlldyBpbnRvIHRoZSBmcmFtZSdzIGNvbnRlbnQgcmVnaW9uLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gY29udGVudFJlZ2lvbiBCYXNpYyBvYmplY3Qgd2l0aCBhIGB2aWV3YCBwcm9wZXJ0eSwgd2hpY2hcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGJlIHNldCB3aXRoIHRoZSBwcm9wZXIgcmVnaW9uIHZpZXcuXG5cdCAqL1xuXHRlZGl0SW1hZ2VNb2RlOiBmdW5jdGlvbiggY29udGVudFJlZ2lvbiApIHtcblx0XHR2YXIgZWRpdEltYWdlQ29udHJvbGxlciA9IG5ldyB3cC5tZWRpYS5jb250cm9sbGVyLkVkaXRJbWFnZSgge1xuXHRcdFx0bW9kZWw6IHRoaXMubW9kZWwsXG5cdFx0XHRmcmFtZTogdGhpc1xuXHRcdH0gKTtcblx0XHQvLyBOb29wIHNvbWUgbWV0aG9kcy5cblx0XHRlZGl0SW1hZ2VDb250cm9sbGVyLl90b29sYmFyID0gZnVuY3Rpb24oKSB7fTtcblx0XHRlZGl0SW1hZ2VDb250cm9sbGVyLl9yb3V0ZXIgPSBmdW5jdGlvbigpIHt9O1xuXHRcdGVkaXRJbWFnZUNvbnRyb2xsZXIuX21lbnUgPSBmdW5jdGlvbigpIHt9O1xuXG5cdFx0Y29udGVudFJlZ2lvbi52aWV3ID0gbmV3IHdwLm1lZGlhLnZpZXcuRWRpdEltYWdlLkRldGFpbHMoIHtcblx0XHRcdG1vZGVsOiB0aGlzLm1vZGVsLFxuXHRcdFx0ZnJhbWU6IHRoaXMsXG5cdFx0XHRjb250cm9sbGVyOiBlZGl0SW1hZ2VDb250cm9sbGVyXG5cdFx0fSApO1xuXHR9LFxuXG5cdGVkaXRJbWFnZU1vZGVSZW5kZXI6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZpZXcub24oICdyZWFkeScsIHZpZXcubG9hZEVkaXRvciApO1xuXHR9LFxuXG5cdHRvZ2dsZU5hdjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kKCcubGVmdCcpLnRvZ2dsZUNsYXNzKCAnZGlzYWJsZWQnLCAhIHRoaXMuaGFzUHJldmlvdXMoKSApO1xuXHRcdHRoaXMuJCgnLnJpZ2h0JykudG9nZ2xlQ2xhc3MoICdkaXNhYmxlZCcsICEgdGhpcy5oYXNOZXh0KCkgKTtcblx0fSxcblxuXHQvKipcblx0ICogUmVyZW5kZXIgdGhlIHZpZXcuXG5cdCAqL1xuXHRyZXJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gT25seSByZXJlbmRlciB0aGUgYGNvbnRlbnRgIHJlZ2lvbi5cblx0XHRpZiAoIHRoaXMuY29udGVudC5tb2RlKCkgIT09ICdlZGl0LW1ldGFkYXRhJyApIHtcblx0XHRcdHRoaXMuY29udGVudC5tb2RlKCAnZWRpdC1tZXRhZGF0YScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5jb250ZW50LnJlbmRlcigpO1xuXHRcdH1cblxuXHRcdHRoaXMudG9nZ2xlTmF2KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENsaWNrIGhhbmRsZXIgdG8gc3dpdGNoIHRvIHRoZSBwcmV2aW91cyBtZWRpYSBpdGVtLlxuXHQgKi9cblx0cHJldmlvdXNNZWRpYUl0ZW06IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISB0aGlzLmhhc1ByZXZpb3VzKCkgKSB7XG5cdFx0XHR0aGlzLiQoICcubGVmdCcgKS5ibHVyKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMubW9kZWwgPSB0aGlzLmxpYnJhcnkuYXQoIHRoaXMuZ2V0Q3VycmVudEluZGV4KCkgLSAxICk7XG5cdFx0dGhpcy5yZXJlbmRlcigpO1xuXHRcdHRoaXMuJCggJy5sZWZ0JyApLmZvY3VzKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENsaWNrIGhhbmRsZXIgdG8gc3dpdGNoIHRvIHRoZSBuZXh0IG1lZGlhIGl0ZW0uXG5cdCAqL1xuXHRuZXh0TWVkaWFJdGVtOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgdGhpcy5oYXNOZXh0KCkgKSB7XG5cdFx0XHR0aGlzLiQoICcucmlnaHQnICkuYmx1cigpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLm1vZGVsID0gdGhpcy5saWJyYXJ5LmF0KCB0aGlzLmdldEN1cnJlbnRJbmRleCgpICsgMSApO1xuXHRcdHRoaXMucmVyZW5kZXIoKTtcblx0XHR0aGlzLiQoICcucmlnaHQnICkuZm9jdXMoKTtcblx0fSxcblxuXHRnZXRDdXJyZW50SW5kZXg6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmxpYnJhcnkuaW5kZXhPZiggdGhpcy5tb2RlbCApO1xuXHR9LFxuXG5cdGhhc05leHQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoIHRoaXMuZ2V0Q3VycmVudEluZGV4KCkgKyAxICkgPCB0aGlzLmxpYnJhcnkubGVuZ3RoO1xuXHR9LFxuXG5cdGhhc1ByZXZpb3VzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKCB0aGlzLmdldEN1cnJlbnRJbmRleCgpIC0gMSApID4gLTE7XG5cdH0sXG5cdC8qKlxuXHQgKiBSZXNwb25kIHRvIHRoZSBrZXlib2FyZCBldmVudHM6IHJpZ2h0IGFycm93LCBsZWZ0IGFycm93LCBleGNlcHQgd2hlblxuXHQgKiBmb2N1cyBpcyBpbiBhIHRleHRhcmVhIG9yIGlucHV0IGZpZWxkLlxuXHQgKi9cblx0a2V5RXZlbnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoICggJ0lOUFVUJyA9PT0gZXZlbnQudGFyZ2V0Lm5vZGVOYW1lIHx8ICdURVhUQVJFQScgPT09IGV2ZW50LnRhcmdldC5ub2RlTmFtZSApICYmICEgKCBldmVudC50YXJnZXQucmVhZE9ubHkgfHwgZXZlbnQudGFyZ2V0LmRpc2FibGVkICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gVGhlIHJpZ2h0IGFycm93IGtleVxuXHRcdGlmICggMzkgPT09IGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHR0aGlzLm5leHRNZWRpYUl0ZW0oKTtcblx0XHR9XG5cdFx0Ly8gVGhlIGxlZnQgYXJyb3cga2V5XG5cdFx0aWYgKCAzNyA9PT0gZXZlbnQua2V5Q29kZSApIHtcblx0XHRcdHRoaXMucHJldmlvdXNNZWRpYUl0ZW0oKTtcblx0XHR9XG5cdH0sXG5cblx0cmVzZXRSb3V0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5ncmlkUm91dGVyLm5hdmlnYXRlKCB0aGlzLmdyaWRSb3V0ZXIuYmFzZVVybCggJycgKSApO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0QXR0YWNobWVudHM7XG4iLCIvKipcbiAqIHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5NYW5hZ2VcbiAqXG4gKiBBIGdlbmVyaWMgbWFuYWdlbWVudCBmcmFtZSB3b3JrZmxvdy5cbiAqXG4gKiBVc2VkIGluIHRoZSBtZWRpYSBncmlkIHZpZXcuXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5NZWRpYUZyYW1lXG4gKiBAYXVnbWVudHMgd3AubWVkaWEudmlldy5GcmFtZVxuICogQGF1Z21lbnRzIHdwLm1lZGlhLlZpZXdcbiAqIEBhdWdtZW50cyB3cC5CYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICogQG1peGVzIHdwLm1lZGlhLmNvbnRyb2xsZXIuU3RhdGVNYWNoaW5lXG4gKi9cbnZhciBNZWRpYUZyYW1lID0gd3AubWVkaWEudmlldy5NZWRpYUZyYW1lLFxuXHRMaWJyYXJ5ID0gd3AubWVkaWEuY29udHJvbGxlci5MaWJyYXJ5LFxuXG5cdCQgPSBCYWNrYm9uZS4kLFxuXHRNYW5hZ2U7XG5cbk1hbmFnZSA9IE1lZGlhRnJhbWUuZXh0ZW5kKHtcblx0LyoqXG5cdCAqIEBnbG9iYWwgd3AuVXBsb2FkZXJcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZGVmYXVsdHMoIHRoaXMub3B0aW9ucywge1xuXHRcdFx0dGl0bGU6ICAgICAnJyxcblx0XHRcdG1vZGFsOiAgICAgZmFsc2UsXG5cdFx0XHRzZWxlY3Rpb246IFtdLFxuXHRcdFx0bGlicmFyeTogICB7fSwgLy8gT3B0aW9ucyBoYXNoIGZvciB0aGUgcXVlcnkgdG8gdGhlIG1lZGlhIGxpYnJhcnkuXG5cdFx0XHRtdWx0aXBsZTogICdhZGQnLFxuXHRcdFx0c3RhdGU6ICAgICAnbGlicmFyeScsXG5cdFx0XHR1cGxvYWRlcjogIHRydWUsXG5cdFx0XHRtb2RlOiAgICAgIFsgJ2dyaWQnLCAnZWRpdCcgXVxuXHRcdH0pO1xuXG5cdFx0dGhpcy4kYm9keSA9ICQoIGRvY3VtZW50LmJvZHkgKTtcblx0XHR0aGlzLiR3aW5kb3cgPSAkKCB3aW5kb3cgKTtcblx0XHR0aGlzLiRhZG1pbkJhciA9ICQoICcjd3BhZG1pbmJhcicgKTtcblx0XHR0aGlzLiR3aW5kb3cub24oICdzY3JvbGwgcmVzaXplJywgXy5kZWJvdW5jZSggXy5iaW5kKCB0aGlzLmZpeFBvc2l0aW9uLCB0aGlzICksIDE1ICkgKTtcblx0XHQkKCBkb2N1bWVudCApLm9uKCAnY2xpY2snLCAnLnBhZ2UtdGl0bGUtYWN0aW9uJywgXy5iaW5kKCB0aGlzLmFkZE5ld0NsaWNrSGFuZGxlciwgdGhpcyApICk7XG5cblx0XHQvLyBFbnN1cmUgY29yZSBhbmQgbWVkaWEgZ3JpZCB2aWV3IFVJIGlzIGVuYWJsZWQuXG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoJ3dwLWNvcmUtdWknKTtcblxuXHRcdC8vIEZvcmNlIHRoZSB1cGxvYWRlciBvZmYgaWYgdGhlIHVwbG9hZCBsaW1pdCBoYXMgYmVlbiBleGNlZWRlZCBvclxuXHRcdC8vIGlmIHRoZSBicm93c2VyIGlzbid0IHN1cHBvcnRlZC5cblx0XHRpZiAoIHdwLlVwbG9hZGVyLmxpbWl0RXhjZWVkZWQgfHwgISB3cC5VcGxvYWRlci5icm93c2VyLnN1cHBvcnRlZCApIHtcblx0XHRcdHRoaXMub3B0aW9ucy51cGxvYWRlciA9IGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIEluaXRpYWxpemUgYSB3aW5kb3ctd2lkZSB1cGxvYWRlci5cblx0XHRpZiAoIHRoaXMub3B0aW9ucy51cGxvYWRlciApIHtcblx0XHRcdHRoaXMudXBsb2FkZXIgPSBuZXcgd3AubWVkaWEudmlldy5VcGxvYWRlcldpbmRvdyh7XG5cdFx0XHRcdGNvbnRyb2xsZXI6IHRoaXMsXG5cdFx0XHRcdHVwbG9hZGVyOiB7XG5cdFx0XHRcdFx0ZHJvcHpvbmU6ICBkb2N1bWVudC5ib2R5LFxuXHRcdFx0XHRcdGNvbnRhaW5lcjogZG9jdW1lbnQuYm9keVxuXHRcdFx0XHR9XG5cdFx0XHR9KS5yZW5kZXIoKTtcblx0XHRcdHRoaXMudXBsb2FkZXIucmVhZHkoKTtcblx0XHRcdCQoJ2JvZHknKS5hcHBlbmQoIHRoaXMudXBsb2FkZXIuZWwgKTtcblxuXHRcdFx0dGhpcy5vcHRpb25zLnVwbG9hZGVyID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dGhpcy5ncmlkUm91dGVyID0gbmV3IHdwLm1lZGlhLnZpZXcuTWVkaWFGcmFtZS5NYW5hZ2UuUm91dGVyKCk7XG5cblx0XHQvLyBDYWxsICdpbml0aWFsaXplJyBkaXJlY3RseSBvbiB0aGUgcGFyZW50IGNsYXNzLlxuXHRcdE1lZGlhRnJhbWUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0Ly8gQXBwZW5kIHRoZSBmcmFtZSB2aWV3IGRpcmVjdGx5IHRoZSBzdXBwbGllZCBjb250YWluZXIuXG5cdFx0dGhpcy4kZWwuYXBwZW5kVG8oIHRoaXMub3B0aW9ucy5jb250YWluZXIgKTtcblxuXHRcdHRoaXMuY3JlYXRlU3RhdGVzKCk7XG5cdFx0dGhpcy5iaW5kUmVnaW9uTW9kZUhhbmRsZXJzKCk7XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR0aGlzLmJpbmRTZWFyY2hIYW5kbGVyKCk7XG5cdH0sXG5cblx0YmluZFNlYXJjaEhhbmRsZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWFyY2ggPSB0aGlzLiQoICcjbWVkaWEtc2VhcmNoLWlucHV0JyApLFxuXHRcdFx0Y3VycmVudFNlYXJjaCA9IHRoaXMub3B0aW9ucy5jb250YWluZXIuZGF0YSggJ3NlYXJjaCcgKSxcblx0XHRcdHNlYXJjaFZpZXcgPSB0aGlzLmJyb3dzZXJWaWV3LnRvb2xiYXIuZ2V0KCAnc2VhcmNoJyApLiRlbCxcblx0XHRcdGxpc3RNb2RlID0gdGhpcy4kKCAnLnZpZXctbGlzdCcgKSxcblxuXHRcdFx0aW5wdXQgID0gXy5kZWJvdW5jZSggZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0dmFyIHZhbCA9ICQoIGUuY3VycmVudFRhcmdldCApLnZhbCgpLFxuXHRcdFx0XHRcdHVybCA9ICcnO1xuXG5cdFx0XHRcdGlmICggdmFsICkge1xuXHRcdFx0XHRcdHVybCArPSAnP3NlYXJjaD0nICsgdmFsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuZ3JpZFJvdXRlci5uYXZpZ2F0ZSggdGhpcy5ncmlkUm91dGVyLmJhc2VVcmwoIHVybCApICk7XG5cdFx0XHR9LCAxMDAwICk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIFVSTCB3aGVuIGVudGVyaW5nIHNlYXJjaCBzdHJpbmcgKGF0IG1vc3Qgb25jZSBwZXIgc2Vjb25kKVxuXHRcdHNlYXJjaC5vbiggJ2lucHV0JywgXy5iaW5kKCBpbnB1dCwgdGhpcyApICk7XG5cdFx0c2VhcmNoVmlldy52YWwoIGN1cnJlbnRTZWFyY2ggKS50cmlnZ2VyKCAnaW5wdXQnICk7XG5cblx0XHR0aGlzLmdyaWRSb3V0ZXIub24oICdyb3V0ZTpzZWFyY2gnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgaHJlZiA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXHRcdFx0aWYgKCBocmVmLmluZGV4T2YoICdtb2RlPScgKSA+IC0xICkge1xuXHRcdFx0XHRocmVmID0gaHJlZi5yZXBsYWNlKCAvbW9kZT1bXiZdKy9nLCAnbW9kZT1saXN0JyApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aHJlZiArPSBocmVmLmluZGV4T2YoICc/JyApID4gLTEgPyAnJm1vZGU9bGlzdCcgOiAnP21vZGU9bGlzdCc7XG5cdFx0XHR9XG5cdFx0XHRocmVmID0gaHJlZi5yZXBsYWNlKCAnc2VhcmNoPScsICdzPScgKTtcblx0XHRcdGxpc3RNb2RlLnByb3AoICdocmVmJywgaHJlZiApO1xuXHRcdH0gKTtcblx0fSxcblxuXHQvKipcblx0ICogQ3JlYXRlIHRoZSBkZWZhdWx0IHN0YXRlcyBmb3IgdGhlIGZyYW1lLlxuXHQgKi9cblx0Y3JlYXRlU3RhdGVzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdGlmICggdGhpcy5vcHRpb25zLnN0YXRlcyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBBZGQgdGhlIGRlZmF1bHQgc3RhdGVzLlxuXHRcdHRoaXMuc3RhdGVzLmFkZChbXG5cdFx0XHRuZXcgTGlicmFyeSh7XG5cdFx0XHRcdGxpYnJhcnk6ICAgICAgICAgICAgd3AubWVkaWEucXVlcnkoIG9wdGlvbnMubGlicmFyeSApLFxuXHRcdFx0XHRtdWx0aXBsZTogICAgICAgICAgIG9wdGlvbnMubXVsdGlwbGUsXG5cdFx0XHRcdHRpdGxlOiAgICAgICAgICAgICAgb3B0aW9ucy50aXRsZSxcblx0XHRcdFx0Y29udGVudDogICAgICAgICAgICAnYnJvd3NlJyxcblx0XHRcdFx0dG9vbGJhcjogICAgICAgICAgICAnc2VsZWN0Jyxcblx0XHRcdFx0Y29udGVudFVzZXJTZXR0aW5nOiBmYWxzZSxcblx0XHRcdFx0ZmlsdGVyYWJsZTogICAgICAgICAnYWxsJyxcblx0XHRcdFx0YXV0b1NlbGVjdDogICAgICAgICBmYWxzZVxuXHRcdFx0fSlcblx0XHRdKTtcblx0fSxcblxuXHQvKipcblx0ICogQmluZCByZWdpb24gbW9kZSBhY3RpdmF0aW9uIGV2ZW50cyB0byBwcm9wZXIgaGFuZGxlcnMuXG5cdCAqL1xuXHRiaW5kUmVnaW9uTW9kZUhhbmRsZXJzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9uKCAnY29udGVudDpjcmVhdGU6YnJvd3NlJywgdGhpcy5icm93c2VDb250ZW50LCB0aGlzICk7XG5cblx0XHQvLyBIYW5kbGUgYSBmcmFtZS1sZXZlbCBldmVudCBmb3IgZWRpdGluZyBhbiBhdHRhY2htZW50LlxuXHRcdHRoaXMub24oICdlZGl0OmF0dGFjaG1lbnQnLCB0aGlzLm9wZW5FZGl0QXR0YWNobWVudE1vZGFsLCB0aGlzICk7XG5cblx0XHR0aGlzLm9uKCAnc2VsZWN0OmFjdGl2YXRlJywgdGhpcy5iaW5kS2V5ZG93biwgdGhpcyApO1xuXHRcdHRoaXMub24oICdzZWxlY3Q6ZGVhY3RpdmF0ZScsIHRoaXMudW5iaW5kS2V5ZG93biwgdGhpcyApO1xuXHR9LFxuXG5cdGhhbmRsZUtleWRvd246IGZ1bmN0aW9uKCBlICkge1xuXHRcdGlmICggMjcgPT09IGUud2hpY2ggKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLmRlYWN0aXZhdGVNb2RlKCAnc2VsZWN0JyApLmFjdGl2YXRlTW9kZSggJ2VkaXQnICk7XG5cdFx0fVxuXHR9LFxuXG5cdGJpbmRLZXlkb3duOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRib2R5Lm9uKCAna2V5ZG93bi5zZWxlY3QnLCBfLmJpbmQoIHRoaXMuaGFuZGxlS2V5ZG93biwgdGhpcyApICk7XG5cdH0sXG5cblx0dW5iaW5kS2V5ZG93bjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kYm9keS5vZmYoICdrZXlkb3duLnNlbGVjdCcgKTtcblx0fSxcblxuXHRmaXhQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRicm93c2VyLCAkdG9vbGJhcjtcblx0XHRpZiAoICEgdGhpcy5pc01vZGVBY3RpdmUoICdzZWxlY3QnICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0JGJyb3dzZXIgPSB0aGlzLiQoJy5hdHRhY2htZW50cy1icm93c2VyJyk7XG5cdFx0JHRvb2xiYXIgPSAkYnJvd3Nlci5maW5kKCcubWVkaWEtdG9vbGJhcicpO1xuXG5cdFx0Ly8gT2Zmc2V0IGRvZXNuJ3QgYXBwZWFyIHRvIHRha2UgdG9wIG1hcmdpbiBpbnRvIGFjY291bnQsIGhlbmNlICsxNlxuXHRcdGlmICggKCAkYnJvd3Nlci5vZmZzZXQoKS50b3AgKyAxNiApIDwgdGhpcy4kd2luZG93LnNjcm9sbFRvcCgpICsgdGhpcy4kYWRtaW5CYXIuaGVpZ2h0KCkgKSB7XG5cdFx0XHQkYnJvd3Nlci5hZGRDbGFzcyggJ2ZpeGVkJyApO1xuXHRcdFx0JHRvb2xiYXIuY3NzKCd3aWR0aCcsICRicm93c2VyLndpZHRoKCkgKyAncHgnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JGJyb3dzZXIucmVtb3ZlQ2xhc3MoICdmaXhlZCcgKTtcblx0XHRcdCR0b29sYmFyLmNzcygnd2lkdGgnLCAnJyk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBDbGljayBoYW5kbGVyIGZvciB0aGUgYEFkZCBOZXdgIGJ1dHRvbi5cblx0ICovXG5cdGFkZE5ld0NsaWNrSGFuZGxlcjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy50cmlnZ2VyKCAndG9nZ2xlOnVwbG9hZDphdHRhY2htZW50JyApO1xuXG5cdFx0aWYgKCB0aGlzLnVwbG9hZGVyICkge1xuXHRcdFx0dGhpcy51cGxvYWRlci5yZWZyZXNoKCk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBPcGVuIHRoZSBFZGl0IEF0dGFjaG1lbnQgbW9kYWwuXG5cdCAqL1xuXHRvcGVuRWRpdEF0dGFjaG1lbnRNb2RhbDogZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdC8vIENyZWF0ZSBhIG5ldyBFZGl0QXR0YWNobWVudCBmcmFtZSwgcGFzc2luZyBhbG9uZyB0aGUgbGlicmFyeSBhbmQgdGhlIGF0dGFjaG1lbnQgbW9kZWwuXG5cdFx0d3AubWVkaWEoIHtcblx0XHRcdGZyYW1lOiAgICAgICAnZWRpdC1hdHRhY2htZW50cycsXG5cdFx0XHRjb250cm9sbGVyOiAgdGhpcyxcblx0XHRcdGxpYnJhcnk6ICAgICB0aGlzLnN0YXRlKCkuZ2V0KCdsaWJyYXJ5JyksXG5cdFx0XHRtb2RlbDogICAgICAgbW9kZWxcblx0XHR9ICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhbiBhdHRhY2htZW50cyBicm93c2VyIHZpZXcgd2l0aGluIHRoZSBjb250ZW50IHJlZ2lvbi5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGNvbnRlbnRSZWdpb24gQmFzaWMgb2JqZWN0IHdpdGggYSBgdmlld2AgcHJvcGVydHksIHdoaWNoXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCBiZSBzZXQgd2l0aCB0aGUgcHJvcGVyIHJlZ2lvbiB2aWV3LlxuXHQgKiBAdGhpcyB3cC5tZWRpYS5jb250cm9sbGVyLlJlZ2lvblxuXHQgKi9cblx0YnJvd3NlQ29udGVudDogZnVuY3Rpb24oIGNvbnRlbnRSZWdpb24gKSB7XG5cdFx0dmFyIHN0YXRlID0gdGhpcy5zdGF0ZSgpO1xuXG5cdFx0Ly8gQnJvd3NlIG91ciBsaWJyYXJ5IG9mIGF0dGFjaG1lbnRzLlxuXHRcdHRoaXMuYnJvd3NlclZpZXcgPSBjb250ZW50UmVnaW9uLnZpZXcgPSBuZXcgd3AubWVkaWEudmlldy5BdHRhY2htZW50c0Jyb3dzZXIoe1xuXHRcdFx0Y29udHJvbGxlcjogdGhpcyxcblx0XHRcdGNvbGxlY3Rpb246IHN0YXRlLmdldCgnbGlicmFyeScpLFxuXHRcdFx0c2VsZWN0aW9uOiAgc3RhdGUuZ2V0KCdzZWxlY3Rpb24nKSxcblx0XHRcdG1vZGVsOiAgICAgIHN0YXRlLFxuXHRcdFx0c29ydGFibGU6ICAgc3RhdGUuZ2V0KCdzb3J0YWJsZScpLFxuXHRcdFx0c2VhcmNoOiAgICAgc3RhdGUuZ2V0KCdzZWFyY2hhYmxlJyksXG5cdFx0XHRmaWx0ZXJzOiAgICBzdGF0ZS5nZXQoJ2ZpbHRlcmFibGUnKSxcblx0XHRcdGRhdGU6ICAgICAgIHN0YXRlLmdldCgnZGF0ZScpLFxuXHRcdFx0ZGlzcGxheTogICAgc3RhdGUuZ2V0KCdkaXNwbGF5U2V0dGluZ3MnKSxcblx0XHRcdGRyYWdJbmZvOiAgIHN0YXRlLmdldCgnZHJhZ0luZm8nKSxcblx0XHRcdHNpZGViYXI6ICAgICdlcnJvcnMnLFxuXG5cdFx0XHRzdWdnZXN0ZWRXaWR0aDogIHN0YXRlLmdldCgnc3VnZ2VzdGVkV2lkdGgnKSxcblx0XHRcdHN1Z2dlc3RlZEhlaWdodDogc3RhdGUuZ2V0KCdzdWdnZXN0ZWRIZWlnaHQnKSxcblxuXHRcdFx0QXR0YWNobWVudFZpZXc6IHN0YXRlLmdldCgnQXR0YWNobWVudFZpZXcnKSxcblxuXHRcdFx0c2Nyb2xsRWxlbWVudDogZG9jdW1lbnRcblx0XHR9KTtcblx0XHR0aGlzLmJyb3dzZXJWaWV3Lm9uKCAncmVhZHknLCBfLmJpbmQoIHRoaXMuYmluZERlZmVycmVkLCB0aGlzICkgKTtcblxuXHRcdHRoaXMuZXJyb3JzID0gd3AuVXBsb2FkZXIuZXJyb3JzO1xuXHRcdHRoaXMuZXJyb3JzLm9uKCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMuc2lkZWJhclZpc2liaWxpdHksIHRoaXMgKTtcblx0fSxcblxuXHRzaWRlYmFyVmlzaWJpbGl0eTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5icm93c2VyVmlldy4kKCAnLm1lZGlhLXNpZGViYXInICkudG9nZ2xlKCAhISB0aGlzLmVycm9ycy5sZW5ndGggKTtcblx0fSxcblxuXHRiaW5kRGVmZXJyZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISB0aGlzLmJyb3dzZXJWaWV3LmRmZCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5icm93c2VyVmlldy5kZmQuZG9uZSggXy5iaW5kKCB0aGlzLnN0YXJ0SGlzdG9yeSwgdGhpcyApICk7XG5cdH0sXG5cblx0c3RhcnRIaXN0b3J5OiBmdW5jdGlvbigpIHtcblx0XHQvLyBWZXJpZnkgcHVzaFN0YXRlIHN1cHBvcnQgYW5kIGFjdGl2YXRlXG5cdFx0aWYgKCB3aW5kb3cuaGlzdG9yeSAmJiB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUgKSB7XG5cdFx0XHRCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCB7XG5cdFx0XHRcdHJvb3Q6IHdpbmRvdy5fd3BNZWRpYUdyaWRTZXR0aW5ncy5hZG1pblVybCxcblx0XHRcdFx0cHVzaFN0YXRlOiB0cnVlXG5cdFx0XHR9ICk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYW5hZ2U7XG4iXX0=
