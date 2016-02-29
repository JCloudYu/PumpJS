(function( window ) {
	"use strict";

	var
	// INFO: Global ID System
	___ID_CANDIDATES = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
	___CANDIDATE_LEN = ___ID_CANDIDATES.length,
	___IS_CALLABLE	 = function( value ) {
		return (typeof value === 'function');
	},
	___ID_GENERATOR	 = (function(){
		var uniqueId, i, val, carriage, idRunner = [ 0 ];

		return function( baseId ) {
			baseId = baseId || '';



			uniqueId = ""; i = val = 0; carriage = 1;

			while( carriage > 0 )
			{
				val = idRunner[ i ] + carriage;
				if ( val >= ___CANDIDATE_LEN )
				{
					idRunner[ i ] = val - ___CANDIDATE_LEN;
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
				uniqueId = ___ID_CANDIDATES.charAt( idRunner[i] ) + uniqueId;

			return baseId + uniqueId;
		};
	})(),
	___DO_NOTHING	 = function(){},
	___PUMP_FACTORY	 = function( injectTarget ){

		var
		__instMap	= {},
		__instances	= {},
		__baseId	= (function(){
			var id = '', count = 5;
			while ( count-- > 0 )
				id += ___ID_CANDIDATES.charAt( (___CANDIDATE_LEN * Math.random()) | 0 );
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
			uniqueId	= ___ID_GENERATOR( __baseId ),
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
	___DEFAULT_PUMP	 = ___PUMP_FACTORY(),
	___ORIGINAL_PUMP = window.pump || undefined,
	___ACCESS_POINT	 = function(){

		if ( !(this instanceof ___ACCESS_POINT) )
			return ___DEFAULT_PUMP;

		___PUMP_FACTORY( this );
	};


	___ACCESS_POINT.prevPump = function(){
		return ___ORIGINAL_PUMP;
	};

	for( var key in ___DEFAULT_PUMP )
	{
		if ( !___DEFAULT_PUMP.hasOwnProperty( key ) ) continue;
		___ACCESS_POINT[ key ] = ___DEFAULT_PUMP[ key ];
	}

	window.pump = ___ACCESS_POINT;

})( window );
