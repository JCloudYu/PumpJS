/**
 * Created by JCloudYu on 9/9/16.
 */
(function() {
	"use strict";
	
	var title = $( 'title' );

	module.signal = new Promise(function( fulfill ){
		var countdown = 10;
	
		setTimeout(___LOOP, 0);
		
		function ___LOOP(){
			title.text( countdown-- );
			if ( countdown > 0 )
				setTimeout( ___LOOP, 1000 );
			else
				setTimeout( fulfill, 0 );
		}
	});
})();
