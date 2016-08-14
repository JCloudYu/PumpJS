/**
 * Created by JCloudYu on 8/14/16.
 */
(function() {
	console.log( "test" );
	module.signal = new Promise(function( fulfill ){ window.run = fulfill; });
})();
