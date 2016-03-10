(function() {
	var
	currTime	= moment(),
	timeoutId	= undefined,
	kernel		= pump.instantiate( 'time-source-controller', function(){
		return {
			// Used to identify the object retrieved by pump.instance()
			sourceKey: ( Math.random() * 100 ) | 0,
			getCurrentTime:function(){
				return currTime;
			}
		}
	});


	kernel
	.on( 'SOURCE START', function( e ){
		// This event can be fired externally ( source is null )
		if ( !!e.source ) return;

		timeoutId = setTimeout( ___UpdateTime, 0 );
	})
	.on( 'SOURCE STOP', function( e ){
		// This event can be fired externally ( source is null )
		if ( !timeoutId || !!e.source ) return;

		clearTimeout( timeoutId );
	});

	function ___UpdateTime(){
		currTime = moment();
		kernel.fire( 'SOURCE SYNC' );

		timeoutId = setTimeout(___UpdateTime, 500);
	}
})();
