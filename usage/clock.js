(function() {
	var
	globalKernel	= pump.instantiate( 'clock-controller' ),
	timeSource		= pump.instance( 'time-source-controller' ),
	internalPump	= new pump(),
	internalKernel	= internalPump.instantiate();



	globalKernel.on( 'SOURCE SYNC', function( e ){
		// This event can be fired externally ( source is not null )
			if ( !e.source ) return;

			var providerInst = pump.instance( e.source );
			internalKernel.fire( 'TIME SYNC', {
				global:	timeSource,
				sourced: providerInst
			});
	});


	window.addClock = function( zone ){
		var
		viewport	= $( '<div>' ).appendTo( $('#viewport') ),
		zoneRegion	= $( '<div style="width:200px; display:inline-block;">' ).appendTo( viewport ),
		timeRegion	= $( '<div style="width:200px; display:inline-block;">' ).appendTo( viewport ),
		insIdRegion	= $( '<div style="width:200px; display:inline-block;">' ).appendTo( viewport ),
		kernel		= internalPump.instantiate();



		zoneRegion.text( zone );
		insIdRegion.text( kernel.getId() );

		kernel.on( 'TIME SYNC', function( e, param ){
			// This event can be fired externally ( source is not null )
			if ( !e.source ) return;

			var
			providerInst = param.global,
			sourced		 = param.sourced,
			curMoment	 = providerInst.getCurrentTime();
			timeRegion.text( curMoment.tz( zone ).format( "YYYY/MM/DD  HH:mm" ) + ' [' + sourced.sourceKey + '|' + providerInst.sourceKey + ']' );
		});
	};
})();
