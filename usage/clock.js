(function() {
	window.addClock = function( zone ){
		var
		viewport	= $( '<div>' ).appendTo( $('#viewport') ),
		zoneRegion	= $( '<div style="width:200px; display:inline-block;">' ).appendTo( viewport ),
		timeRegion	= $( '<div style="width:200px; display:inline-block;">' ).appendTo( viewport ),
		insIdRegion	= $( '<div style="width:200px; display:inline-block;">' ).appendTo( viewport ),
		kernel		= pump.instantiate(),
		sourceAPI	= pump.instance( 'time-source-controller' );



		zoneRegion.text( zone );
		insIdRegion.text( kernel.getId() );

		kernel.on( 'TIME SYNC', function( e ){
			// This event can be fired externally ( source is not null )
			if ( !e.source ) return;

			var
			providerInst = pump.instance( e.source ),
			curMoment = providerInst.getCurrentTime();
			timeRegion.text( curMoment.tz( zone ).format( "YYYY/MM/DD  HH:mm:ss" ) + ' [' + sourceAPI.sourceKey + '|' + providerInst.sourceKey + ']' );
		});
	};
})();
