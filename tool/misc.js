(function() {
	"use strict";

	var
	__prevO	= window.PumpMisc;

	window._$PM = window.PumpMisc = function( targetObject ){};
	window._$PM.prev = __prevO;




	___MERGE( window._$PM, {
		merge: ___MERGE
	});

	function ___MERGE( obj1, obj2, overwrite, iterated ) {

		overwrite	= arguments.length > 2 ? !!overwrite : false;
		iterated	= arguments.length > 3 ? !!iterated : true;

		var prop, isObj1, isObj2;

		for( prop in obj2 )
		{
			if ( !obj2.hasOwnProperty( prop ) ) continue;

			if ( obj1.hasOwnProperty( prop ) )
			{
				isObj1 = (obj1[prop] === Object(obj1[prop]));
				isObj2 = (obj2[prop] === Object(obj2[prop]));

				if ( isObj1 && isObj2 && iterated )
				{
					___MERGE( obj1[prop], obj2[prop], overwrite, iterated );
					continue;
				}



				if ( !overwrite ) continue;
			}

			obj1[ prop ] = obj2[ prop ];
		}
	}
})();
