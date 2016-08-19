(function() {
	"use strict";

	// INFO: Environmental information collectors
	var ___isNode = (new Function( "try{return this===global}catch(e){return false}" ))();



	// region [ Main pump logic ]
	var __ACCESS_POINT;
	(function() {
		var
		// INFO: Global ID System
		__NAMED_PUMPS	= {},
		__ID_CANDIDATES = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
		__CANDIDATE_LEN = __ID_CANDIDATES.length,
		__ID_GENERATOR	 = (function(){
			var uniqueId, i, val, carriage, idRunner = [ 0 ];

			return function( baseId ) {
				baseId = baseId || '';



				uniqueId = ""; i = val = 0; carriage = 1;

				while( carriage > 0 )
				{
					val = idRunner[ i ] + carriage;
					if ( val >= __CANDIDATE_LEN )
					{
						idRunner[ i ] = val - __CANDIDATE_LEN;
						idRunner[ i + 1 ] = idRunner[ i + 1 ] || 0;
						carriage = 1;
					}
					else
					{
						idRunner[ i ] = val;
						break;
					}

					i++;
				}



				for ( i=0; i < idRunner.length; i++ )
					uniqueId = __ID_CANDIDATES.charAt( idRunner[i] ) + uniqueId;

				return baseId + uniqueId;
			};
		})(),
		__PUMP_FACTORY	 = function( injectTarget ){

			var
			__instMap	= {},
			__instances	= {},
			__baseId	= (function(){
				var id = '', count = 5;
				while ( count-- > 0 )
					id += __ID_CANDIDATES.charAt( (__CANDIDATE_LEN * Math.random()) | 0 );
				return id;
			})(),



			// INFO: Internal APIs
			__fireEvent		= function( src, dest, type, args, async ) {
				var inst;

				if ( !dest )
				{
					for( var key in __instances )
					{
						if ( !__instances.hasOwnProperty( key ) ) continue;
						___fire( __instances[key], src, type, args, async );
					}
				}
				else
				{
					if ( !(inst = __getInstance( dest )) ) return;
					___fire( inst, src, type, args, async );

				}


				function ___fire( inst, src, type, args, async ) {

					if ( !async )
					{
						inst.__fireEvent( { type:type, target:null, source:src }, args );
						return;
					}

					setTimeout( function(){ inst.__fireEvent( { type:type, target:null, source:src }, args ); }, 0 );
				}
			},
			__registerEvent = function( srcId, type, cb, async ) {
				srcId	= srcId || '';
				type	= type || null;
				cb		= ___IS_CALLABLE(cb) ? cb : null;
				async	= (arguments.length > 2) ? !!async : true;


				var _interface = __instances[ srcId ];
				if ( !_interface || !type || !cb ) return false;

				_interface.__regEvent( type, cb, async );
				return true;
			},
			__getInstance	= function( targetId ) {
				return __instMap[ targetId ] || __instances[ targetId ] || null;
			},




			// INFO: Instance Generator
			__INTERFACE_WRAPPER	= function() {
				var evtQueues = {};

				return {
					__fireEvent: function( event, args ) {
						var evtTypes = [ '*', event.type ];

						evtTypes.forEach(function( evtType )
						{
							var queue = evtQueues[evtType];
							if ( !Array.isArray( queue ) ) return;

							queue.forEach(function(desc){
								var doEvt = function(){
									desc.cb( event, args );
								};

								if ( !desc.async )
								{
									doEvt();
									return;
								}

								setTimeout( doEvt, 0 );
							});
						});
					},
					__regEvent: function( eventType, callback, async ) {
						eventType.split( ',' ).forEach(function( type ){
							if ( !evtQueues.hasOwnProperty( type ) )
								evtQueues[ type ] = [];

							evtQueues[ type ].push({ cb: callback, async: async });
						});
					}
				};
			},
			__KERNEL_JUNCTION	= function( uniqueId ) {
				return {
					getId: function(){ return uniqueId; },
					on: function( eventType, callback, async ) {
						var
						args	= Array.prototype.slice.call( arguments ),
						events  = [], params = [],
						paramMode = false;


						while ( args.length > 0 )
						{
							var arg = args.shift();

							if ( !paramMode && !___IS_CALLABLE( arg ) )
								events.push( arg );
							else
							{
								paramMode = paramMode || true;
								params.push( arg );
							}
						}

						params.unshift( (events.length > 0) ? events.join( ',' ) : null );
						params.unshift( uniqueId );

						__registerEvent.apply( null, params );
						return this;
					},
					fire: function( eventType, args, async ) {
						async = async || false;
						__fireEvent( uniqueId, null, eventType, args, async );
						return this;
					},
					fireTarget: function( target, eventType, args, async ) {
						async = async || false;
						__fireEvent( uniqueId, target, eventType, args, async );
						return this;
					}
				};
			},
			__INSTANTIATOR		= function( instanceId, interfaceGenerator ) {

				// INFO: Parameter normalization
				if ( ___IS_CALLABLE(instanceId) )
				{
					interfaceGenerator = instanceId;
					instanceId = undefined;
				}



				// INFO: Request linker for instance's api interface
				// INFO: Expose kernel interface to linker, wrap up and register api interface
				var
				hasLinker	= ___IS_CALLABLE( interfaceGenerator ),
				linkFunc	= hasLinker ? interfaceGenerator : ___DO_NOTHING,
				uniqueId	= __ID_GENERATOR( __baseId ),
				junction	= __KERNEL_JUNCTION( uniqueId );

				__instances[uniqueId] = __INTERFACE_WRAPPER();
				__instances[uniqueId]._interface = linkFunc(junction) || {};



				// INFO: Hook the generated instance onto global instance map
				var instId = instanceId || null;
				if ( instId ) __instMap[ instId ] = __instances[uniqueId];


				return junction;
			};


			injectTarget = injectTarget || {};
			injectTarget.instantiate = __INSTANTIATOR;
			injectTarget.fire = function( eventType, args, async ) {
				async = async || false;
				__fireEvent( null, null, eventType, args, async );
				return this;
			};
			injectTarget.fireTarget = function( target, eventType, args, async ){
				async = async || false;
				__fireEvent( null, target, eventType, args, async );
				return this;
			};
			injectTarget.instance = function( targetId ){
				var inst = __getInstance( targetId );
				return (!inst) ? null : inst._interface;
			};

			return injectTarget;
		},
		__DEFAULT_PUMP	 = __PUMP_FACTORY();


		// INFO: Define __ACCESS_POINT Factory
		// INFO: And Map default pump's api onto __ACCESS_POINT
		__ACCESS_POINT	 = function( pumpId ){

			if ( !(this instanceof __ACCESS_POINT) )
				return ( arguments.length > 0 ) ? (__NAMED_PUMPS[ pumpId ] = __NAMED_PUMPS[ pumpId ] || new pump()) : __DEFAULT_PUMP;
	
			__PUMP_FACTORY( this );
		};
		___IMPRINT( __DEFAULT_PUMP, __ACCESS_POINT, true );




		// INFO: Register __ACCESS_POINT
		if ( ___isNode ) {
			module.exports = __ACCESS_POINT;
			return;
		}


		__ACCESS_POINT.prevPump = (function( pump ){ return function(){ return pump; }; })( window.pump || undefined );
		window.pump = __ACCESS_POINT;
	})();
	// endregion



	// region [ Internal assistive tool ]
	function ___DO_NOTHING() {}
	function ___IS_CALLABLE ( value ) {
		return (typeof value === 'function');
	}
	function ___IMPRINT( a, b, overwrite ) {
		overwrite = overwrite || false;

		for( var key in a ) {
			if ( !a.hasOwnProperty( key ) ) continue;
			if ( !b.hasOwnProperty(key) || overwrite ) b[ key ] = a [ key ];
		}
		
		return b;
	}
	// endregion
})();
