(function() {
	var currTime, timeoutId ,kernel, moduleExports = {};

	
	pipe.loadResource([
		{ path:'../pipe.js', type:'js' }
	])
	.then(function(){
		pipe([
			'https://api.purimize.com/cache/lib/js/jquery,moment,moment-timezone-small/_.js'
		])
		.pipe([
	//		'./base64-large-file.js',
			{ path:'./not-exists.js', type:'js', modulize:true, important:false },
			{ path:'../util.js', type:'js', cache:true },
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
			},
			
			function(){
				return pipe
				.loadResource([
					{ path:'./other.css', type:'css', cache:false },
					{ path:'./b.css', type:'css', cache:false, important:false }
				])
				.then(function(){
					return pipe.loadResource([
						{ path:'./run.js', type:'js', cache:false, modulize:true },
						{ path:'./html.html', type:'html', cache:false }
					]);
				});
			},
			
			function(){
				var obj1 = { a:1, b:2, c:3, d:4 },
					obj2 = { a:4, c:5, d:undefined };
					
				$U.merge( obj1, obj2, true );
				console.log( obj1 );
			
				setTimeout( function(){ moduleExports.run(); }, 10000 );
			}
		])
		.then(function(){
			pipe.components.base_path( './comps' );
			
			return pipe.components([
				{ name:'Joint',		anchor:'[data-anchor="main-joint"]', async:false, "remove-anchor":true },
				{ name:'TimerView', anchor:'[data-anchor="main-view"]' }
			]);
		})
		.then(pipe([
			{ path:"./test.js", type:"js", modulize:true, overwrites:{ window:moduleExports }, cache:false }
		], true))
		.then(function(){
			addClock( 'Asia/Taipei' );
		})
		.then(function(){
			var startCounter = 0;
			kernel
			.on( 'SOURCE START', function( e ){
				// This event can be fired externally ( source is null )
				if ( !!e.source ) return;
				
				startCounter++;
				if ( startCounter < 2 ) return;
			
				return new Promise(function( fulfill ){
					console.log( "Start waiting for 10 seconds!" );
					setTimeout( function(){
						timeoutId = setTimeout( ___UpdateTime, 0 );
						console.log( "start!" );
						fulfill();
					}, 10000 );
				});
			})
			.on( 'SOURCE STOP', function( e ){
				// This event can be fired externally ( source is null )
				if ( !timeoutId || !!e.source ) return;
	
				clearTimeout( timeoutId );
			});
	
			function ___UpdateTime(){
				currTime = moment();
				kernel.fire( 'SOURCE SYNC' ).fire( 'SOURCE SYNC' );
	
				timeoutId = setTimeout(___UpdateTime, 500);
			}
		})
		.then(function(){
			return pump.fire( 'SOURCE START' ).fire( 'SOURCE START' );
		})
		.then(function(){
			console.log( "OVER!" );
		})
		.catch(function(err){
			console.log( arguments );
		});
	});
})();
