(function() {
	var
	currTime	= moment(),
	intervalId	= undefined,
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

		intervalId = setInterval(function(){
			currTime = moment();
			kernel.fire( 'TIME SYNC' );
		}, 100);
	})
	.on( 'SOURCE STOP', function(){
		// This event can be fired externally ( source is null )
		if ( !intervalId || !!e.source ) return;

		clearInterval( intervalId );
	});
})();
