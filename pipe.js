/**
 * Created by JCloudYu on 5/10/16.
 */
(function() {
	// Pipe core
	(function(){
		window.pipe = window.pipe || function( dependencies, passive ) {
			if ( !Array.isArray( dependencies ) ) return false;
			
			var __chainHead = ___CREATE_PIPE( dependencies, !passive );
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

			$.getJSON( modulePath + 'component.json?' + (((new Date()).getTime() / 1000) | 0), function( descriptor ) {
				var trigger, promiseGenerator,
				scripts = [], styles = [],
				comps	 = descriptor[ 'components' ] || [],
				basePromise = (new Promise(function(fulfill){ trigger = fulfill; })),
				waitedPromises = [];



				comps.forEach(function( comp ) {
					var fPath,
					caching = comp.hasOwnProperty( 'cache' ) ? !!comp[ 'cache' ] : true,
					targetAnchor = !!comp['anchor'] ? comp['anchor'] : anchor;
					
					
					// Load view
					if ( comp[ 'view' ] ) {
					
						promiseGenerator = (function( fPath, anchor, cache ){
							return function() {
								return new Promise(function(complete, failure) {
									var
									target	 = $( anchor || 'body' ),
									targetOp = anchor ? target.before : target.prepend;
								
									$.get( fPath + ( cache ? '' : '?' + (((new Date()).getTime() / 1000) | 0) ), function( htmlText ){
										$( htmlText ).each(function(idx, tag){ targetOp.call( target, tag ); });
		
										complete();
									}, 'text').fail(failure);
								});
							}
						})( modulePath + comp['view'], targetAnchor, caching );
					
						if ( !comp[ 'async' ] )
							basePromise = basePromise.then(promiseGenerator);
						else
							waitedPromises.push(promiseGenerator);
					}
					
					// Load css
					if ( comp['style'] ) {
						fPath = modulePath + comp['style'] + ( caching ? '' : '?' + (((new Date()).getTime() / 1000) | 0) );
						if ( $.inArray( fPath, styles ) < 0 )
						{
							promiseGenerator = (function( fPath, anchor ){
								return function(){ return ___LOAD_RESOURCE( fPath, 'css', anchor ); };
							})( fPath, targetAnchor );
							waitedPromises.push(promiseGenerator);
							styles.push( fPath );
						}
					}

					// Load js
					if ( comp['script'] ) {
					
						if ( !comp[ 'modulize' ] )
						{
							fPath = modulePath + comp['script'] + ( caching ? '' : '?' + (((new Date()).getTime() / 1000) | 0) );
							if ( $.inArray( fPath, scripts ) < 0 )
							{
								promiseGenerator = (function( fPath, anchor ){
									return function(){ return ___LOAD_RESOURCE( fPath, 'js', anchor, true ); };
								})( fPath, targetAnchor );
								waitedPromises.push(promiseGenerator);
								scripts.push( fPath );
							}
						}
						else
						{
							promiseGenerator = (function( fPath, cache ){
								return function(){ return ___LOAD_MODULE( fPath + ( cache ? '' : '?' + (((new Date()).getTime() / 1000) | 0) ) ); }
							})( modulePath + comp['script'], caching );
							
							waitedPromises.push(promiseGenerator);
						}
					}
				});
				
				if ( waitedPromises.length == 0 ) waitedPromises.push(function(){ return new Promise(function(fulfill){ fulfill(); }); });


				basePromise.then(function(){
					var promises = [];
					waitedPromises.forEach(function(initiator){ promises.push( initiator() ); });
					return Promise.all(promises);
				}).then( fulfill ).catch( reject );
				
				// Start promise chain
				trigger();
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



			if ( anchor ) anchor = $(anchor);
			
			
			
			if ( anchor && anchor.length > 0 )
			{
				anchor	 = anchor[0];
				target	 = anchor.parentElement;
			}
			else
			{
				anchor	 = null;
				target	 = $( type == "js" ? 'body' : 'head' )[0];
			}

			if ( late )
				setTimeout(function(){ target.insertBefore( tag, anchor ); }, 0);
			else
				target.insertBefore( tag, anchor );
		});
	}
	function ___LOAD_MODULE( src, overwrites ) {
		return new Promise(function( fulfill, reject ) {
			var variables = [], values = [];
			if ( arguments.length > 1 && !!overwrites )
			{
				for( var prop in overwrites )
				{
					if ( prop !== "module" && overwrites.hasOwnProperty( prop ) )
					{
						variables.push( prop );
						values.push( overwrites[ prop ] );
					}
				}
			}
			
		
			$.get( src, function( jsContext ){
				var moduleCtrl = {};
				
				variables.push( 'module', jsContext );
				values.push( moduleCtrl );
				(Function.apply( null, variables )).apply( {}, values );
				
				Promise.resolve(moduleCtrl.signal).then(fulfill).catch(reject);
			}, 'text').fail(reject);
		});
	}
	function ___RESOURCE_FETCHER( resList ) {
		return function(){
			var __promises	= [];
			resList.forEach(function( item ) {
				var itemAddr, itemType, promise, caching = true, isModulized, moduleOverwite = {};
				
				if ( item === Object(item) )
				{
					if ( !item.path ) return;
					
					itemAddr		= item.path;
					itemType		= item.type || 'js';
					isModulized		= !!item.modulize;
					moduleOverwite	= item.overwrites || {};
					caching			= item.hasOwnProperty( 'cache' ) ? !!item[ 'cache' ] : true;
				}
				else
				{
					itemAddr	= item;
					itemType	= 'js';
					isModulized = false;
				}
				
				itemAddr = itemAddr + ( caching ? '' : '?' + (((new Date()).getTime() / 1000) | 0) );
				promise = ( itemType == 'js' && isModulized ) ? ___LOAD_MODULE( itemAddr, moduleOverwite ) : ___LOAD_RESOURCE( itemAddr, itemType )
				__promises.push( promise );
			});
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
			
			// INFO: Pure object
			if ( (item === Object(item)) && !Array.isArray(item) && ( typeof item !== 'function' ) && item.path )
			{
				__resources.push( item );
				return;
			}


			if ( __resources.length > 0 )
			{
				__chainHead = __chainHead.then(___RESOURCE_FETCHER( __resources ));
				__resources = [];
			}


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
