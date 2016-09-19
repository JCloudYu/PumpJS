/**
 * Created by JCloudYu on 9/9/16.
 */

//# sourceURL=run.js
(function() {
	"use strict";
	
	var title = $( 'title' );

	module.signal = new Promise(function( fulfill ){
		var countdown = 10;
		
		
		setInterval(function(){
			if ( countdown <= 0 )
			{
				fulfill();
			}
			else
			{
				title.text( countdown );
				countdown--;
				return new Promise(function( complete ){ setTimeout(complete, 1000); });
			}
		}, 1, 11, true );
	});
})();
