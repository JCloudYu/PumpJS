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

			__chainHead = __chainHead.then(___PROMISE_ALL(__promises));
			__promises = [];


			if ( typeof item === 'function' ) {
				__chainHead = __chainHead.then(function(){ setTimeout( item, 0 ); });
			}
		});

		if ( __promises.length > 0 )
			__chainHead = __chainHead.then(___PROMISE_ALL(__promises));



		setTimeout(__trigger, 0);
		return __chainHead;
	};

	(function(){
		var __compBasePath = './components';

		window.pipe.components = window.pipe.components || function( components ) {
			if ( !Array.isArray( components ) ) return false;

			var __promises = [];
			components.forEach(function( item ){
				var arguments = [];

				if ( typeof item === "string" )
					arguments.push( item );
				else
					arguments.push( item.name, item.basePath || __compBasePath, item.anchor );


				__promises.push( ___LOAD_COMPONENT.apply( null, arguments ) );
			});

			return Promise.all( __promises );
		};

		window.pipe.components.base_path = function( path ){
			__compBasePath = path || './components';
		};
	})();



	function ___LOAD_COMPONENT( componentName, basePath, anchor ) {
		return new Promise(function( fulfill, reject ){
			basePath = basePath || './components';
			anchor	 = (arguments.length > 2) ? $( anchor ) : null;

			var modulePath = basePath + '/' + componentName + '/';

			$.getJSON( modulePath + 'component.json', function( descriptor ){
				var
				views	 = [], scripts = [], styles = [],
				comps	 = descriptor[ 'components' ] || [],
				promises = [],
				target	 = anchor || $( 'body' ),
				targetOp = anchor ? target.after : target.append;



				comps.forEach(function( comp ){
					if ( comp['view'] )	  views.push( modulePath + comp['view'] );
					if ( comp['script'] ) scripts.push( modulePath + comp['script'] );
					if ( comp['style'] )  styles.push( modulePath + comp['style'] );
				});



				$.unique(scripts).forEach(function( scriptPath ){
					promises.push( ___LOAD_RESOURCE( scriptPath, 'js', anchor ) );
				});
				$.unique(views).forEach(function( viewPath ){
					promises.push(new Promise(function(complete, failure){
						$.get( viewPath, function( htmlText ){
							$( htmlText ).each(function(idx, tag){ targetOp.call( target, tag ); });

							complete();
						}, 'text').fail(failure);
					}));
				});
				$.unique(styles).forEach(function( stylePath ){
					promises.push( ___LOAD_RESOURCE( stylePath, 'css', anchor ) );
				});



				if ( promises.length == 0 )
					promises.push(new Promise(function(fulfill){ fulfill(); }));

				Promise.all( promises ).then( fulfill ).catch( reject );
			}).fail( reject );
		});
	}
	function ___LOAD_RESOURCE( src, type, anchor ) {
		return new Promise(function( fulfill, reject ) {

			var tag, target;

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

			tag.onload  = fulfill;
			tag.onerror = reject;




			if ( anchor )
			{
				anchor	 = anchor[0];
				target	 = anchor.parentElement;
			}
			else
			{
				anchor	 = null;
				target	 = $( 'body' )[0];
			}

			target.insertBefore( tag, anchor );
		});
	}
	function ___PROMISE_ALL( promises ) {
		return function(){ return Promise.all( promises ); };
	}
})();
