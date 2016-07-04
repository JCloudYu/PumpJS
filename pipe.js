/**
 * Created by JCloudYu on 5/10/16.
 */
(function() {
	// Pipe core
	(function(){
		window.pipe = window.pipe || function( dependencies ){
			if ( !Array.isArray( dependencies ) ) return false;

			var __chainHead = ___CREATE_PIPE( dependencies, true );
			__chainHead.pipe = ___CREATE_PIPE_CHAIN( __chainHead );
			return __chainHead;
		};
	})();

	// pipe.components
	(function(){
		var __compBasePath = './components';

		window.pipe.components = window.pipe.components || function( components ) {
			if ( !Array.isArray( components ) ) return false;

			var __promises = [];
			components.forEach(function( item ){

				var args = [];

				if ( typeof item === "string" )
					args.push( item );
				else
					args.push( item.name, item.basePath || __compBasePath, item.anchor );


				__promises.push( ___LOAD_COMPONENT.apply( null, args ) );
			});

			return Promise.all( __promises );
		};

		window.pipe.components.base_path = function( path ){
			__compBasePath = path || './components';
		};
	})();



	function ___LOAD_COMPONENT( componentName, basePath, anchor ) {

		basePath = basePath || './components';
		anchor	 = anchor ? $( anchor ) : null;

		return new Promise(function( fulfill, reject ){

			var
			modulePath = basePath + '/' + componentName + '/';

			$.getJSON( modulePath + 'component.json', function( descriptor ){
				var
				scripts = [], styles = [],
				comps	 = descriptor[ 'components' ] || [],
				promises = [];



				comps.forEach(function( comp ){
					var fPath,
					targetAnchor = !!comp['anchor'] ? $(comp['anchor']) : anchor,
					target		 = targetAnchor || $( 'body' ),
					targetOp	 = targetAnchor ? target.before : target.prepend;

					if ( comp['style'] )
					{
						fPath = modulePath + comp['style'];
						if ( $.inArray( fPath, styles ) < 0 )
						{
							promises.push( ___LOAD_RESOURCE( fPath, 'css', targetAnchor ) );
							styles.push( fPath );
						}
					}

					if ( comp['view'] )
					{
						promises.push(new Promise(function(complete, failure){
							$.get( modulePath + comp['view'], function( htmlText ){
								$( htmlText ).each(function(idx, tag){ targetOp.call( target, tag ); });

								complete();
							}, 'text').fail(failure);
						}));
					}

					if ( comp['script'] )
					{
						fPath = modulePath + comp['script'];
						if ( $.inArray( fPath, scripts ) < 0 )
						{
							promises.push( ___LOAD_RESOURCE( fPath, 'js', targetAnchor, true ) );
							scripts.push( fPath );
						}
					}
				});



				if ( promises.length == 0 )
					promises.push(new Promise(function(fulfill){ fulfill(); }));

				Promise.all( promises ).then( fulfill ).catch( reject );
			}).fail( reject );
		});
	}
	function ___LOAD_RESOURCE( src, type, anchor, late ) {
		return new Promise(function( fulfill, reject ) {
			var tag, target;

			switch ( type )
			{
				case "css":
					tag = document.createElement( 'link' );
					tag.rel = "stylesheet";
					tag.type = "text/css";
					tag.href = src;
					break;

				case "js":
					tag = document.createElement( 'script' );
					tag.type = "application/javascript";
					tag.src = src;
					break;

				default:
					return null;
			}

			tag.onload  = fulfill;
			tag.onerror = reject;




			if ( anchor )
			{
				anchor	 = anchor[0];
				target	 = anchor.parentElement;
			}
			else
			{
				anchor	 = null;
				target	 = $( 'body' )[0];
			}

			if ( late )
				setTimeout(function(){ target.insertBefore( tag, anchor ); }, 0);
			else
				target.insertBefore( tag, anchor );
		});
	}
	function ___RESOURCE_FETCHER( resList ) {
		return function(){
			var __promises	= [];
			resList.forEach(function( item ){ __promises.push( ___LOAD_RESOURCE( item, 'js' ) ); });
			return Promise.all( __promises );
		};
	}
	function ___CREATE_PIPE_CHAIN( prevChain ) {
		return function( dependencies ) {
			if ( !Array.isArray( dependencies ) ) return false;
			var newChain = prevChain.then(___CREATE_PIPE( dependencies, false ));
			newChain.pipe = ___CREATE_PIPE_CHAIN( newChain );
			return newChain;
		};
	}
	function ___CREATE_PIPE( dependencies, immediate ) {

		var __trigger,
		__resources = [],
		__chainHead = new Promise(function( fulfill ){ __trigger = fulfill; });



		dependencies.forEach(function( item ) {
			if ( typeof item === 'string' ) {
				__resources.push( item );
				return;
			}

			__chainHead = __chainHead.then(___RESOURCE_FETCHER( __resources ));
			__resources = [];


			if ( typeof item === 'function' ) {
				__chainHead = __chainHead.then(item);
			}
		});

		if ( __resources.length > 0 )
			__chainHead = __chainHead.then(___RESOURCE_FETCHER(__resources));


		
		if ( !immediate )
		{
			return function(){
				setTimeout(__trigger, 0);
				return __chainHead;
			};
		}

		setTimeout(__trigger, 0);
		return __chainHead;
	}
})();
