(function() {
	var currTime, timeoutId ,kernel;

	pipe([
		'https://api.purimize.com/cache/lib/js/jquery,moment,moment-timezone-small'
	])
	.pipe([
//		'./base64-large-file.js',
		'../util/misc.js',
		{ path:'./test.css', type:'css' }, // CSS mode
		{  },	// Will be an anchor ( Not a valid document descriptor )
		function(){
			currTime	= moment();
			timeoutId	= undefined;
			kernel		= pump.instantiate( 'time-source-controller', function(){
				return {
					// Used to identify the object retrieved by pump.instance()
					sourceKey: ( Math.random() * 100 ) | 0,
					getCurrentTime:function(){
						return currTime;
					}
				}
			});
		}
	])
	.pipe([
		'./clock.js'
	])
	.then(function(){
		addClock( 'Asia/Taipei' );
	})
	.then(function(){
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
	})
	.then(function(){
		pump.fire( 'SOURCE START' );
	});
})();
