/* global jQuery, YoastSEO, _, panelsOptions */

jQuery(function($){


	var SiteOriginSeoCompat = function() {

		if ( typeof YoastSEO !== 'undefined' ) {
			YoastSEO.app.registerPlugin( 'SiteOriginSeoCompat', { status: 'ready' } );
			YoastSEO.app.registerModification( 'content', this.contentModification, 'SiteOriginSeoCompat', 5 );
		}

		if ( typeof rankMathEditor !== 'undefined' ) {
			wp.hooks.addFilter( 'rank_math_content', 'SiteOriginSeoCompat', this.rankMath );
		}

	};

	function isBlockEditorPanelsEnabled() {
		return typeof window.soPanelsBuilderView !== 'undefined' && $blockEditorPage.length > 0;
	}

	function isClassicEditorPanelsEnabled() {
		return $( '#so-panels-panels.attached-to-editor' ).is( ':visible' );
	}

	SiteOriginSeoCompat.prototype.rankMath = function( data ) {
		if ( ! data ) {
			return data;
		}

		if ( isClassicEditorPanelsEnabled && ! isBlockEditorPanelsEnabled ) {
			return SiteOriginSeoCompat.prototype.contentModification( data );
		}

		if ( ! isBlockEditorPanelsEnabled ) {
			return data;
		}

		const soBlock = data.match(
			/<!--\s*wp:siteorigin-panels\/layout-block[\s\S]*?\/-->/g
		);

		// Replace any found SO Layout blocks with the rendered contents.
		if ( soBlock ) {
			soBlock.forEach( function( block ) {
				data = data.replace( block, SiteOriginSeoCompat.prototype.contentModification( block ) );
			} );
		}

		return data;
	}

	SiteOriginSeoCompat.prototype.contentModification = function( data ) {
		// Check if the editor has Page Builder Enabled before proceeding.
		if (
			window.soPanelsBuilderView === undefined ||
			(
				! isClassicEditorPanelsEnabled &&
				! isBlockEditorPanelsEnabled
			)
		) {
			return;
		}

		var whitelist = [
			'p', 'a', 'img', 'caption', 'br',
			'blockquote', 'cite',
			'em', 'strong', 'i', 'b',
			'q',
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'ul', 'ol', 'li',
			'table', 'tr', 'th', 'td'
		].join( ',' );

		var extractContent = function( data ) {
			var $data = $( data );

			if ( $data.find( '.so-panel' ).length === 0 ) {
				// Skip this for empty pages
				return data;
			}

			// Remove elements that have no content analysis value.
			$data.find( 'iframe, script, style, link' ).remove();

			$data.find( "*") .not( whitelist ).each( function() {
				var content = $( this ).contents();
				$( this ).replaceWith( content );
			} );

			return $data.html();
		};

		if ( ! Array.isArray( window.soPanelsBuilderView ) ) {
			data = extractContent( window.soPanelsBuilderView.contentPreview );
		} else {
			data = null;
			window.soPanelsBuilderView.forEach( function( panel ) {
				data += extractContent( panel.contentPreview );
			} );
		}

		return data;
	};

	if ( typeof rankMathEditor !== 'undefined' ) {
		new SiteOriginSeoCompat();
	} else {
		$( window ).on(
			'YoastSEO:ready',
			function () {
				new SiteOriginSeoCompat();
			}
		);
	}
});
