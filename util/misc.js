(function() {
	"use strict";

	var
	___UNIQUE_ID = (function(){
		var hexStr = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' ];
		return function( base, time, seq, rand ) {
			var
			result = '',
			bytes = [
				(base >> 8) & 255,
				(base	  ) & 255,

				(time >> 24) & 255,
				(time >> 16) & 255,
				(time >> 8 ) & 255,
				(time	   ) & 255,

				seq & 255,

				(rand >> 8) & 255,
				rand & 255
			];

			bytes.forEach(function( value ){ result += hexStr[ (value >> 4) & 15 ] + hexStr[ value & 15 ]; });

			return result;
		};
	})(),
	__prevO	= window.PumpMisc;

	window._$PM = window.PumpMisc = function( targetObject ){};
	window._$PM.prev = __prevO;




	___MERGE( window._$PM, {
		merge: ___MERGE,
		getId: (function(){
			var
			base = (Math.random() * 65536) | 0,
			seq	 = 0;

			return function(){
				return ___UNIQUE_ID( base, (new Date()).getTime() | 0, seq = (seq++) & 255, (Math.random() * 65536) );
			};
		})()
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

		return obj1;
	}
})();
