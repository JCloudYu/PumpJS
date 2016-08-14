(function(){
	var
	__idGenerator	= 0,
	__idPool		= [],
	__prevClear		= window.clearInterval,
	__prevSet		= window.setInterval;

	window.clearInterval = function( timerId )
	{
		if ( __idPool[ timerId ] )
			delete __idPool[ timerId ];
	};
	window.clearInterval.prev = __prevClear;



	window.setIntervalArgs = function( timerId, args ) {
		if ( !timerId || !__idPool[ timerId ] ) return;

		var
		inputArgs = Array.prototype.slice.call( arguments );
		inputArgs.shift();

		__idPool[ timerId ].args = inputArgs;
	};



	window.setInterval = function( func, interval, repeats, args )
	{
		repeats	  = (arguments.length > 2) ? repeats : null;

		var
		___inputArgs = Array.prototype.slice.call( arguments ),
		___baseId	 = ++__idGenerator,
		___repeat	 = function(){
			if ( !__idPool[ ___baseId ] || (repeats !== null && repeats-- <= 0) )
				return;

			__idPool[ ___baseId ].id = setTimeout( ___repeat, interval );
			try{
				func.apply( null, __idPool[ ___baseId ].args );
			}catch(e){
				delete __idPool[ ___baseId ];
				throw e;
			}
		};



		___inputArgs.splice( 0, 3 );
		__idPool[ ___baseId ] = {
			args: ___inputArgs,
			id: setTimeout(___repeat, interval)
		};

		return ___baseId;
	};
	window.setInterval.prev = __prevSet;
})();