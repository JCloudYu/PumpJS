/**
 * Created by JCloudYu on 5/10/16.
 */
(function() {
	window.pipe = window.pipe || function( dependencies ){
		if ( !Array.isArray( dependencies ) ) return false;

		var __trigger,
		__promises	= [],
		__chainHead = new Promise(function( fulfill ){ __trigger = fulfill; });



		dependencies.forEach(function( item ){
			if ( typeof item === 'string' ) {
				__promises.push( ___LOAD_RESOURCE( item, 'js' ) );
				return;
			}

			if ( typeof item === 'function' ) {
				__chainHead = __chainHead.then(Promise.all(__promises)).then(item);
			}

			__promises = [];
		});



		setTimeout(__trigger, 0);
		return __chainHead;
	};



	function ___LOAD_RESOURCE( src, type ) {
		return new Promise(function( fulfill, reject ) {
			var tag;

			switch ( type )
			{
				case "css":
					tag = document.createElement( 'link' );
					tag.rel = "stylesheet";
					tag.type = "text/css";
					tag.href = src;
					break;

				case "js":
					tag = document.createElement( 'script' );
					tag.type = "application/javascript";
					tag.src = src;
					break;

				default:
					return null;
			}

			tag.onload = fulfill;
			tag.onerror = reject;


			(document.getElementsByTagName('body')[0]).insertBefore( tag, null );
		});
	}
})();
