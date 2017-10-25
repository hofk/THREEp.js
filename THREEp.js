// THREEp.js ( rev 87.7 alpha )

/**
 * @author hofk / http://threejs.hofk.de/
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.THREEp = global.THREEp || {})));
}(this, (function (exports) {

'use strict';

		// !!!!!  D E B U G  !!!!! !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				// var debug = document.getElementById("debug"); 
				// debug.value = ">> ";
		/////////////////////////////////////////////////////////////////////////////////

var g;	// THREE.BufferGeometry

function createMorphGeometry( p ) {
 
/*	parameter overview	--- all parameters are optional ---

p = {
	
		// simple properties
	
	indexed,		// indexed or non indexed BufferGeometry	
	radius,			// reference sphere radius, multiplier for functions
	wedges,			// spherical wedges, total
	usedWedges,		// used from total sperical wedges
	wedgeOpen,		// wedge on edge open or closed
	equator,		// half of spherical segments
	bottom,			// south pole is 0
	top,			// max. equator * 2 (is north pole)
	withBottom,		// with a bottom (bottom > 0)
	withTop,		// with a top (top < equator * 2)	
	style,			// 'map', 'relief', 'complete'
	
		// functions: u,v and result normally 0 .. 1, otherwise specific / interesting results!
		// u azimuth (start: x axis, counterclockwise) 		
		
		// for hemispheres: v polar (start: pole 0, end: equator 1), t time
	
	stretchSouth,	//	function ( u, v, t )	// stretch / compress south hemisphere in -y direction
	stretchNorth, 	//	function ( u, v, t )	// stretch / compress north hemisphere in +y direction
	endPole,		//	function ( u, t )		// end angle ( to equator, per phi)
	startPole, 		//	function ( u, t )		// start angle ( from south- or north pole, per phi)
	scalePoleH,		//	function ( v, t )		// scaling hemispheres from pole to equator ( is overwritten by scalePole )
	
		// for sphere: v polar (start: south pole 0, end: north pole 1), t time
	
	rAzimuthPole,  //	function ( u, v, t )	// radius depending on location,
	equatorGap,		//	function ( u, t )		// gap in relation to the radius
	squeeze,		//  function ( u, t )		// 0 sphere to 1 flat circle
	moveX,			//	function ( u, v, t )	// factor for radius, move in x direction 
	moveY,			//	function ( u, v, t )	// factor for radius, move in y direction
	moveZ,			//	function ( v, u, t )	// factor for radius, move in z direction
	
	endAzimuth,		//	function ( v, t )		// end azimuth angle phi (per theta)
	startAzimuth,	//	function ( v, t )		// starting azimuth angle phi (per theta)
	scaleAzimuth,	//	function ( u, t )		// scaling between start and end of azimuth angle ( phi 0 .. 2*PI)

	scalePole, 		//	function ( v, t )		// scaling between start and end of polar angle (theta -PI/2 .. PI/2 )
		
  	materialSouth,	//	function ( u, v, t )	// material South
	materialNorth,	//	function ( u, v, t )	// material North
	materialPlane,	//	function ( u, t )		// material of extra south top or north bottom
	materialWedge,	//	function ( v, t )		// material wedge side
												// material: round( result*10 ) is material index  0 .. 10  	
*/
    if ( p === undefined ) p = {};
	
	g = this;  // this is a THREE.BufferGeometry() - geometry object from THREE.js

	g.squeezeDefault = p.squeeze === undefined ? true : false;
	
	g.materialSouthDefault = p.materialSouth === undefined ? true : false;
	g.materialNorthDefault = p.materialNorth === undefined ? true : false;
	g.materialPlaneDefault = p.materialPlane === undefined ? true : false;
	g.materialWedgeDefault = p.materialWedge === undefined ? true : false;
	g.materialDefault = g.materialSouthDefault && g.materialNorthDefault && g.materialPlaneDefault && g.materialWedgeDefault;
	
	//....................................................................... set defaults
	g.indexed = 		p.indexed !== undefined ? 			p.indexed			: true;
	g.radius = 			p.radius !== undefined ?			p.radius			: 16;	
	g.wedges =			p.wedges !== undefined ?			p.wedges 			: 6;
	g.usedWedges =		p.usedWedges !== undefined ?		p.usedWedges 		: g.wedges;
	g.wedgeOpen =		p.wedgeOpen !== undefined ?			p.wedgeOpen 		: false; // only if g.wedges !== g.usedWedges
	g.equator =			p.equator !== undefined ?			p.equator			: 9;
	g.bottom =			p.bottom !== undefined ? 			p.bottom			: 0;
	g.top =				p.top !== undefined ? 				p.top				: g.equator * 2;
	g.withTop =			p.withTop	!== undefined ?			p.withTop			: false;
	g.withBottom =		p.withBottom	!== undefined ?		p.withBottom		: false;
	g.style =			p.style !== undefined ?				p.style				: "complete";
		
	g.stretchSouth =	p.stretchSouth !== undefined ?		p.stretchSouth		: function ( u, v, t ) { return 1 };
	g.stretchNorth =	p.stretchNorth !== undefined ? 		p.stretchNorth		: function ( u, v, t ) { return 1 };
	g.endPole =			p.endPole !== undefined ? 			p.endPole			: function ( u, t ) { return 1 };
	g.startPole =		p.startPole !== undefined ? 		p.startPole			: function ( u, t ) { return 0 };
	g.scalePoleH =	 	p.scalePoleH !== undefined ? 		p.scalePoleH		: function ( v, t ) { return v };
	
	g.rAzimuthPole =	p.rAzimuthPole !== undefined ? 		p.rAzimuthPole		: function ( u, v, t ) { return 1 };
	g.equatorGap =		p.equatorGap !== undefined ? 		p.equatorGap		: function ( u, t ) { return 0 };
	g.squeeze =			p.squeeze !== undefined ? 			p.squeeze			: function ( u, t ) { return 0 };
	g.moveX =			p.moveX	!== undefined ? 			p.moveX				: function ( u, v, t ) { return 0 };
	g.moveY =			p.moveY	!== undefined ? 			p.moveY				: function ( u, v, t ) { return 0 };
	g.moveZ =			p.moveZ	!== undefined ? 			p.moveZ				: function ( u, v, t ) { return 0 };
	
	g.endAzimuth =		p.endAzimuth !== undefined ? 		p.endAzimuth		: function ( v, t ) { return 1 };
	g.startAzimuth =	p.startAzimuth !== undefined ? 		p.startAzimuth		: function ( v, t ) { return 0 };
	g.scaleAzimuth = 	p.scaleAzimuth !== undefined ? 		p.scaleAzimuth		: function ( u, t ) { return u };
	
	g.scalePole =	 	p.scalePole !== undefined ? 		p.scalePole			: function ( v, t ) { return v };
	
	
	if( p.scalePole === undefined ) {
		
		// uses g.scalePoleH: like g.scalePoleS = g.scalePoleH; g.scalePoleN = g.scalePoleH;
		
		g.scaleH = true; // scaling between pole and equator per hemisphere
			
	} else {
	
		// uses the decomposed function
		g.scalePoleS = function( v, t ) { return 2 * g.scalePole(  v / 2 , t ) };
		g.scalePoleN = function( v, t ) { return 2 * ( 1 - g.scalePole( 1 -  v / 2, t ) ) };
	 
		g.scaleH = false;
		
	}
		
	if ( g.top - g.bottom <= 0 ) g.wedgeOpen = true;
	if ( g.wedges < g.usedWedges ) g.usedWedges = g.wedges;
	if ( g.bottom >= g.equator * 2 ) g.bottom  = 0;
	if ( g.top > g.equator * 2) g.top = g.equator * 2;
	
	if ( g.top < g.bottom ) {
		
		g.bottom  = 0;
		g.top = g.equator * 2;
		
	}
	
	// When using multi material:
	// Take index 0 for invisible faces like THREE.MeshBasicMaterial( { visible: false } ),
	// or use transparent faces like THREE.MeshBasicMaterial( {transparent: true, opacity: 0.05 } )
		
	// Please note!	The functions normally should have results from 0 to 1. If the multimaterial array
	// contains fewer materials than the functional result * 10, the script will crash.
	// Even if the result is negative.
	
	g.materialSouth = function() { return 1 }; // default material index is 0.1 * 10 = 1	
	g.materialNorth = function() { return 1 };
	g.materialPlane = function() { return 1 };
	g.materialWedge = function() { return 1 };
	
	
	if ( p.materialSouth !== undefined ) g.materialSouth = function ( u, v, t ) { return  Math.floor( 10 * p.materialSouth( u, v, t ) ) };	
	if ( p.materialNorth !== undefined ) g.materialNorth = function ( u, v, t ) { return  Math.floor( 10 * p.materialNorth( u, v, t ) ) };
	if ( p.materialPlane !== undefined ) g.materialPlane = function ( u, t ) { return  Math.floor( 10 * p.materialPlane( u, t ) ) };
	if ( p.materialWedge !== undefined ) g.materialWedge = function ( v, t ) { return  Math.floor( 10 * p.materialWedge( v, t ) ) };
	//..............................................................................................

	g.create =	create;
	g.morphVertices	=	morphVertices;
	g.morphFaces =		morphFaces;
	
	g.create();
	g.morphVertices();
	
	
	if ( !g.materialDefault ) {
	
		g.morphFaces();
	
	}
	
}

function create() {
	
	g = this;
	
	var eqt = g.equator;
	var wed = g.wedges;
	var uWed = g.usedWedges;
	var vertexCount;
	var vIdx;			// vertex index
	var faceCount;
	var x, y, z, ux, uy;
	var a, b, c;
	var nih, iMin, iMax, jMin, jMax;	
	var uvIdx;
	var theta;
	var phi;	
	var phiOffset = Math.PI * ( 1 - uWed / wed);
		
	var bottomS = g.bottom; 						// bottom south	hemisphere
	var topS = Math.min( eqt, g.top ); 				// top south	hemisphere
	var bottomN = eqt * 2 - g.top; 					// bottom north	hemisphere
	var topN = Math.min( eqt, eqt * 2 - g.bottom);	// top north	hemisphere

	g.wedgeSouthStartIdx = [];
	g.wedgeSouthEndIdx = [];
	g.wedgeNorthStartIdx = [];
	g.wedgeNorthEndIdx = [];
	
	var ssIdx = topS - ( bottomS === 0 ? 1 : bottomS ); // wedge south start index
	var seIdx = 0; // wedge south end index
	var nsIdx = topN - ( bottomN === 0 ? 1 : bottomN ); // wedge north start index
	var neIdx = 0; // wedge north end index
	
	var pi2 = Math.PI / 2;
	const SOUTH = -1;
	const NORTH = 1;
	
	if ( g.bottom === 0 ) g.withBottom = false;
	if ( g.top === eqt * 2 ) g.withTop = false;
		
	//count vertices: south and north hemisphere
	
	vertexCount = 0;
	
	if ( g.bottom < eqt ) {
	
		vertexCount += ( bottomS === 0  || g.withBottom ) ? 1 : 0;	// south pole || bottom

		g.southVertex = vertexCount;
		
		for ( var i = bottomS === 0 ? 1 : bottomS ; i <= topS; i ++ ) {
		
			vertexCount += i * uWed + 1;
					
		}
		
		g.southTopVertex = vertexCount - 1;
		
		vertexCount += ( g.top <= eqt && g.withTop ) ? g.top * uWed + 2 : 0;	// south top
		
		g.southWedgeVertex =  vertexCount;
		vertexCount += ( !g.wedgeOpen ) ? 2 : 0; // wedge closed		
				
		for ( var i = bottomS === 0 ? 1 : bottomS ; i <= topS; i ++ ) {
		
			vertexCount += ( !g.wedgeOpen ) ? 2 : 0;  // wedge closed ( start / end )
		
		}
			
	}
	
	g.vertexNorthOffset = vertexCount;
		
	if ( g.top > eqt ) {
			
		vertexCount += ( bottomN === 0 || g.withTop ) ? 1 : 0;	// north pole || top
		
		g.northVertex =  vertexCount;
		
		for ( var i = bottomN === 0 ? 1 : bottomN ; i <= topN; i ++ ) {

			vertexCount += i * uWed + 1; // equator is double (uv's, equator gap)

		}
		
		g.northBottomVertex = vertexCount - 1;
		
		vertexCount += ( g.bottom >= eqt &&  g.withBottom ) ? topN * uWed + 2 : 0;	// north bottom
		
		g.northWedgeVertex =  vertexCount;
		vertexCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed
		
		for ( var i = bottomN === 0 ?  1 : bottomN; i <= topN; i ++ ) {
		
			vertexCount += ( !g.wedgeOpen ) ? 2 : 0;  // wedge closed ( start / end )
		
		}
				
	}
	
	// count faces 
	// south hemisphere
	
	faceCount = 0;
	
	if ( g.bottom < eqt ) {
	
		faceCount += ( bottomS > 0 && g.withBottom ) ? bottomS * uWed : 0; // bottom south
		
		g.southFace = faceCount;
		
		for ( var i = bottomS; i < topS; i ++ ) {
		
			faceCount += ( 2 * i + 1 ) * uWed;
						
		}
		
		g.southTopFace = faceCount;
		
		faceCount += ( g.top <= eqt && g.withTop ) ? g.top * uWed : 0; // top south
		
		g.southWedgeFace = faceCount;
			
		for ( var i = bottomS; i < topS; i ++ ) {
		
			faceCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed ( start / end )
			
		}
		
		faceCount += ( !g.wedgeOpen  &&  bottomS > 0  ) ? 2 : 0;	// wedge closed  middle if  g.bottom > 0 
						
	}
	
	g.faceNorthOffset = faceCount;

	if ( g.top > eqt ) {
		
		faceCount += ( bottomN > 0 && g.withTop ) ? bottomN * uWed : 0;  // top north
		
		g.northFace = faceCount;
	
		for ( var i = bottomN; i < topN	; i ++ ) {
		
			faceCount += ( 2 * i + 1 ) * uWed;
						
		}
		
		g.northBottomFace = faceCount;
		
		faceCount += ( g.bottom >= eqt && g.withBottom ) ? topN * uWed : 0; // bottom	north
						
		g.northWedgeFace = faceCount;
		
		for ( var i = bottomN; i < topN	; i ++ ) {
		
			faceCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed ( start / end )
			
		}
				
		faceCount += ( !g.wedgeOpen  && bottomN > 0  ) ? 2 : 0;	// wedge closed  middle if  bottomN > 0 
							
	}	
				
	if ( g.isBufferGeometry && g.indexed ) {
	
		var faceArrayIdx;	// face array index (face index * 3)
			
		function pushFace() {
	
			g.faceIndices[ faceArrayIdx ] = a;
			g.faceIndices[ faceArrayIdx + 1 ] = b;
			g.faceIndices[ faceArrayIdx + 2 ] = c; 
				
			faceArrayIdx += 3;
		
		}
		
			
		function storeUvs() {
		
			uvIdx = vIdx * 2;
			
			g.uvs[ uvIdx ] = ux;		
			g.uvs[ uvIdx + 1 ] = uy;
							
		}
					
		g.vertices = new Float32Array( vertexCount * 3 );  
		g.faceIndices = new Uint32Array( faceCount * 3 );
		g.normals = new Float32Array( vertexCount * 3 ); 
		g.uvs = new Float32Array( vertexCount * 2 );	
			
		g.setIndex( new THREE.BufferAttribute( g.faceIndices, 1 ) );	
		g.addAttribute( 'position', new THREE.BufferAttribute( g.vertices, 3 ).setDynamic( true ) );
		g.addAttribute( 'normal', new THREE.BufferAttribute( g.normals, 3 ).setDynamic( true ) );
		g.addAttribute( 'uv', new THREE.BufferAttribute( g.uvs, 2 ) );
		
		faceArrayIdx = 0;
				
		// faces, uvs south hemisphere
		
		if ( g.bottom < eqt ) {
		
			if ( bottomS === 0 || g.withBottom ) { 
						
				a = 0;  // vertex vIdx 0: south pole || bottom
				b = 1;
				c = 0;
								
				jMax = bottomS === 0 ? uWed : bottomS * uWed;
				
				for ( var j = 1; j <= jMax; j ++ ) {
			
					c ++;
					b ++;
					
					pushFace(); 
													
				}
				
				vIdx = 0; // south pole || bottom
									
				ux = 0.5; 
				uy = 0.5;
				
				storeUvs();
							
			}
			
			vIdx = g.southVertex;
			
			for ( var i = bottomS === 0 ? 1 : bottomS; i < topS; i ++ ) {
				
				for ( var w = 0; w < uWed; w ++ ) {
					
					for ( var j = 0; j < i + 1 ; j ++ ) {  
										
						if ( j === 0 ) {
						
							//  first face in wedge 
							
							a = vIdx;
							b = a + uWed * i + w + 2;
							c = b - 1;
							
							pushFace();
							
						} else {
						
							//  two faces / vertex
				
							a = j + vIdx; 
							b = a + uWed * i + w + 1;
							c = a - 1;
												
							pushFace();
							
							// a  from first face 
							b++; // b from first face
							c = b - 1;
							
							pushFace();
							
						}
											
					}
					
					vIdx += i;
									
				}
				
				vIdx ++;
			
			}
			
			
			if ( g.top <= eqt && g.withTop ) {
			
				vIdx  = g.southTopVertex + 1; // uv's  c, b  
		
				a = vIdx + g.top * uWed + 1;
				b = vIdx;
				c = vIdx - 1;
				
				// faces
				
				for ( var j = 0; j < g.top * uWed; j ++ ) {
				
					b ++;
					c ++;
					
					pushFace(); 
											
				}
				
				// uv's
				
				for ( var j = 0; j < g.top * uWed + 1; j ++ ) {
	
					phi = 2 * Math.PI * j / ( g.top * wed ) + phiOffset;
					
					// ux = 0.5 * ( 1 + g.top / eqt * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 - g.top / eqt * Math.sin( phi ) );	
					uy = 0.5 * ( 1 + g.top / eqt * Math.cos( phi ) );
					
					storeUvs();
					vIdx ++;
											
				}
				
				ux = 0.5; 
				uy = 0.5;
				
				storeUvs();
									
			} 
				
			if ( !g.wedgeOpen ) {
								
				vIdx = g.southWedgeVertex;
				
				// faces
				
				a = vIdx;
				b = a;
				c = a + 1;
				
				iMax = ( topS - ( bottomS > 0 ? bottomS - 1 : 0 ) ) * 2;
				
				for ( var i = 0; i < iMax; i ++ ) {
					b ++;
					c ++;
										
					pushFace();
						
				}
								
				// wedge uv's

				ux = 0.5;
				uy = 0.5 * ( 1 + Math.sin( -Math.PI / 2 * ( 1 - topS / eqt ) ) );
			
				storeUvs();
				vIdx ++;
				
				iMin = bottomS > 0 ? bottomS - 1 : 0;
							
				for ( var i = topS; i > iMin; i -- ) {
												
					theta = -Math.PI / 2 * (1 - i / eqt);
					
					ux = 0.5 * ( 1 - Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
			
					storeUvs();
					vIdx ++;
							
				}
				
				ux = 0.5;	
				uy = 0.5 * ( 1 +  Math.sin( -Math.PI / 2 * ( 1 - bottomS / eqt ) ) );
				
				storeUvs();
				vIdx ++;
				
				for ( var i = iMin + 1; i <= topS; i ++  ){
											
					theta = -Math.PI / 2 * ( 1 - i / eqt );
					
					ux = 0.5 * ( 1 + Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
					
					storeUvs();
					vIdx ++;
														
				}
												
			}

			// south: store wedge index & south uv's
			
			vIdx = g.southVertex;
			
			for ( var i = bottomS === 0 ? 1 : bottomS; i <= topS; i ++ ) {
				
				nih = i / eqt;
				
				for ( var j = 0; j < i * uWed + 1; j ++ ) {
									
					if ( !g.wedgeOpen  ) {

						if ( j === 0 ) { 
						
							g.wedgeSouthEndIdx[ seIdx ] = vIdx * 3;
							
							seIdx ++;
						
						}
						
						if ( j === i * uWed ) {
								
							g.wedgeSouthStartIdx[ ssIdx ] = vIdx * 3;
							
							ssIdx --;
							
						}
												
					}
					
					// nji = j / ( i * wed );
										
					phi = 2 * Math.PI * j / ( i * wed ) + phiOffset;
										
					// ux = 0.5 * ( 1 - nih * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 + nih * Math.sin( phi ) );					
					uy = 0.5 * ( 1 + nih * Math.cos( phi ) );
					
					storeUvs();
					vIdx ++;
					
				}
				
			}
					
		}
		
		// faces, uvs  north hemisphere
		
		if ( g.top > eqt ) {
		
			if ( bottomN === 0 || g.withTop ) { 
				
				a = g.vertexNorthOffset; // north pole || top

				b = a;
				c = a + 1;
				
				jMax = bottomN === 0 ? uWed : bottomN * uWed;
				
				for ( var j = 1; j <= jMax; j ++ ) {
								
					b ++;
					c ++;
					
					pushFace();
								
				}
				
				vIdx = g.vertexNorthOffset; // north pole || top
				
				ux = 0.5; 
				uy = 0.5;
				
				storeUvs();				
			}
			
			vIdx = g.northVertex;

			for ( var i = bottomN === 0 ? 1 : bottomN; i < topN	; i ++ ) {
				
				for ( var w = 0; w < uWed; w ++ ) {
				
					for ( var j = 0; j < i + 1 ; j ++ ) {
						
						if ( j === 0 ) {
						
							//  first face in wedge 
							
							a = vIdx;
							b = a + uWed * i + w + 1;
							c = b + 1;
							
							pushFace();
							
						} else {
						
							//  two faces / vertex
				
							a = j + vIdx; 
							b = a - 1; 
							c = a + uWed * i + w + 1;
							
							pushFace();
							
							// a  from first face 
							b = c; // from first face
							c = b + 1;
												
							pushFace();
							
						}
												 
					}
										
					vIdx += i;
							
				}

				vIdx ++;
				
			}
			
			if ( g.bottom >= eqt && g.withBottom ) {
			
				vIdx  = g.northBottomVertex + 1; // uv's  c, b
								
				a = vIdx + topN	* uWed + 1;
				b = vIdx;
				c = vIdx - 1;

				// faces
				
				for ( var j = 0; j < topN * uWed; j ++ ) {
				
					b ++;
					c ++;
										
					pushFace();
					
				}
				
				// uv's
				
				for ( var j = 0; j < topN * uWed + 1; j ++ ) {
				
					phi = 2 * Math.PI * j / ( topN * wed ) + phiOffset;
									
					// ux = 0.5 * ( 1 -  topN / eqt * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 + topN / eqt * Math.sin( phi ) );
					uy = 0.5 * ( 1 + topN / eqt * Math.cos( phi ) );
					
					storeUvs();
					vIdx ++;
																
				}
				
				ux = 0.5; 
				uy = 0.5;
				
				storeUvs();
								
			}
			
			if ( !g.wedgeOpen ) {
								
				vIdx = g.northWedgeVertex;
				
				// faces
				
				a = vIdx;
				b = a;
				c = a + 1;
				
				iMax = ( topN - ( bottomN > 0 ? bottomN - 1 : 0 ) ) * 2;
				
				for ( var i = 0; i < iMax; i ++ ) {
				
					b ++;
					c ++;
					
					pushFace();
																							
				}
				
				// wedge uv's
				
				ux = 0.5;
				uy = 0.5 * ( 1 + Math.sin( Math.PI / 2 * ( 1 - topN / eqt ) ) );
				
				storeUvs();
				vIdx ++;
				
				iMin = bottomN > 0 ? bottomN - 1 : bottomN;
				
				for ( var i = topN ; i > iMin; i -- ) {
					
					theta = Math.PI / 2 * ( 1  - i / eqt );
					
					ux = 0.5 * ( 1 + Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
			
					storeUvs();
					vIdx ++;
													
				}

				ux = 0.5;	
				uy = 0.5 * ( 1 +  Math.sin( Math.PI / 2 * ( 1 - bottomN / eqt ) ) );
			
				storeUvs();
				vIdx ++;
				
				for ( var i = iMin + 1; i <= topN; i ++  ){
					
					theta = Math.PI / 2 * ( 1  - i / eqt );
					
					ux = 0.5 * ( 1 - Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
					
					storeUvs();
					vIdx ++;
						
				}	
					
			}
						
			// north: store wedge index & uv's
			
			vIdx = g.northVertex;
			
			for ( var i = bottomN === 0 ? 1 : bottomN; i <= topN; i ++ ) {
				
				nih = i / eqt;
				
				for ( var j = 0; j < i * uWed + 1; j ++ ) {
				
					if ( !g.wedgeOpen  ) {

				
						if ( j === 0 ) {
						
							g.wedgeNorthStartIdx[ nsIdx ] = vIdx * 3;
							
							nsIdx --;
							
						}
						
						if ( j === i * uWed ) {
							
							g.wedgeNorthEndIdx[ neIdx ] = vIdx * 3;
							
							neIdx ++;
							
						}	
					
					}
					
					//nji = j / ( i * wed );
					phi = 2 * Math.PI * j / ( i * wed ) + phiOffset;
										
					//ux = 0.5 * ( 1 + nih * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 - nih * Math.sin( phi ) ); 
					uy = 0.5 * ( 1 + nih * Math.cos( phi ) );
					
					storeUvs();
					vIdx ++;
					
				}
								
			}
			
		}
		
		// write groups for multi material
		
		for ( var f = 0 , p = 0; f < faceCount ; f ++, p += 3 ) {
			
			g.addGroup( p, 3, 1 ); // default material index is 0.1 * 10 = 1
			
		}
		
	}	
		
}
		
function morphVertices( time ) {
	
	var t = time !== undefined ? time : 0;
	
	g = this;
	
	var eqt = g.equator;
	var wed = g.wedges;
	var uWed = g.usedWedges;
	var vIdx;			// vertex index
	var r, ry, r0, r1, r1y, r2;			// calculated radius
	var x, x0, x1, x2, y, y0, y1, y2, z, z0, z1, z2;	// coordinates
	var dx, dy, dz;	
	var ni, nih, nji, iMin, iMax, jMin, jMax;;
	var posIdx;
	var theta, thetaSq;
	var phi;
	var scalingAzimuth, scalingPole;
	var phiOffset = Math.PI * ( 1 - uWed / wed);
		
	var bottomS = g.bottom; 						// bottom south	hemisphere
	var topS = Math.min( eqt, g.top ); 				// top south	hemisphere
	var bottomN = eqt * 2 - g.top; 					// bottom north	hemisphere
	var topN = Math.min( eqt, eqt * 2 - g.bottom);	// top north	hemisphere
	
	var qSq, alphaSq, rSq, hSq, cSq; // squeeze
	
	var bottomSCount = bottomS * wed;
	var topSCount = topS * wed;	
	var topNCount = topN * wed;
	var bottomNCount = bottomN * wed;

	var xBottomS = 0;
	var yBottomS = 0;
	var zBottomS = 0;
	
	var xBottomN = 0;
	var yBottomN = 0;
	var zBottomN = 0;
	
	var xPlaneS = 0;
	var yPlaneS = 0;
	var zPlaneS = 0;
	
	var xPlaneN = 0;
	var yPlaneN = 0;
	var zPlaneN = 0;
	
	var fullBottomS;
	var fullPlaneS;
	var fullBottomN;
	var fullPlaneN;
	
	var fullCircle;
	
	var xPole;
	var yPole;
	var zPole;
	
	var startPole;
	var endPole;
	//var dP;
	//var dS;
	//var dN;
	
	var pi2 = Math.PI / 2;
	
	const SOUTH = -1;
	const NORTH = 1;
	const BOTTOM = 0;
	const TOP = 1;
	
	function xyzCalculation( south_north ) {
	
		scalingAzimuth = g.startAzimuth( ni, t ) + ( g.endAzimuth( ni, t ) - g.startAzimuth( ni, t ) ) * g.scaleAzimuth( nji, t );
		 
		phi = 2 * Math.PI * uWed / wed * scalingAzimuth + ( ( ni === 0 || ni === 1 ) ? 0 : phiOffset );
		
		
		if ( g.scaleH )  {
		
			// ...  * g.scalePoleH( nih, t ) scaling between pole and equator per hemisphere --> south is like north
			scalingPole = g.startPole( nji, t ) + ( g.endPole( nji, t ) - g.startPole( nji, t ) ) * g.scalePoleH( nih, t );
			theta = south_north * pi2 * ( 1 - scalingPole );
			
		} else {
		
			//dP = ( g.endPole( nji, t ) - g.startPole( nji, t ) );
			//dS = ( 0.5 -  g.startPole( nji, t ) ) / dP; 
			//dN = ( g.endPole( nji, t ) - 0.5 ) / dP;	
			
			if( south_north === SOUTH ) {
			
				//startPole = g.startPole( nji, t ) < 0.499 ? g.startPole( nji, t ) : 0.499;
				startPole = 0;
				//endPole = g.endPole( nji, t ) < 0.5 ? g.endPole( nji, t ) : 0.5;
				endPole =  0.5;	
				
				//scalingPole = startPole + ( endPole  - startPole ) * g.scalePole(  nih * dS / dP , t )  * dP / dS ;
				
				scalingPole = startPole + ( endPole  - startPole ) * g.scalePoleS( nih, t );
				 
				theta = -pi2 + Math.PI * scalingPole ;
						
			} else {
				
				//startPole = g.endPole( nji, t ) > 0.511 ? 1 - g.endPole( nji, t ) : 0.499;
				startPole = 0;
				//endPole =  g.startPole( nji, t ) > 0.5 ? 1 - g.startPole( nji, t ) : 0.5;
				endPole =  0.5;
				
				//scalingPole = startPole + ( endPole  - startPole ) * ( 1 - g.scalePole( 1 -  nih * dN / dP , t ) ) * dP / dN;
				
				scalingPole = startPole + ( endPole  - startPole ) * g.scalePoleN( nih, t );
								
				theta = pi2 - Math.PI * scalingPole;
								
			}
						
		}

		if ( g.squeezeDefault ) {
				
			r = g.radius * g.rAzimuthPole( nji, ni, t );
			
			// ry = r * ( south_north === SOUTH ? g.stretchSouth( nji, nih, t ) : g.stretchNorth( nji, nih, t ) );
	
			x = r * Math.cos( theta ) * Math.cos( phi ) + g.radius * g.moveX( nji, ni, t );	
			
			// y = ry * Math.sin( theta ) + g.radius * ( south_north * g.equatorGap( nji, t ) / 2 + g.moveY( nji, ni, t ) );
			y =  r * Math.sin( theta ); 
			y *= ( south_north === SOUTH ? g.stretchSouth( nji, nih, t ) : g.stretchNorth( nji, nih, t ) );
			y += g.radius * ( south_north * g.equatorGap( nji, t ) / 2 + g.moveY( nji, ni, t ) ); 
			
			z = -r * Math.cos( theta ) * Math.sin( phi ) + g.radius * g.moveZ( nji, ni, t );				
			
		} else {
		
			// squeeze

			r0 = g.radius;
			
			x0 = r0 * Math.cos( theta ) * Math.cos( phi );
			y0 = r0 * Math.sin( theta );
			z0 = -r0 * Math.cos( theta ) * Math.sin( phi );
				
			r1 = g.radius * g.rAzimuthPole( nji, ni, t );
			
			// r1y = r1 * ( south_north === SOUTH ? g.stretchSouth( nji, nih, t ) : g.stretchNorth( nji, nih, t ) );
			
			x1 = r1 * Math.cos( theta ) * Math.cos( phi ) + g.radius * g.moveX( nji, ni, t );
			
			// y1 = r1y * Math.sin( theta ) + g.radius * ( south_north * g.equatorGap( nji, t ) / 2 + g.moveY( nji, ni, t ) );
			y1 = r1 * Math.sin( theta );
			y1 *= ( south_north === SOUTH ? g.stretchSouth( nji, nih, t ) : g.stretchNorth( nji, nih, t ) );
			y1 += g.radius * ( south_north * g.equatorGap( nji, t ) / 2 + g.moveY( nji, ni, t ) ); 
						
			z1 = -r1 * Math.cos( theta ) * Math.sin( phi ) + g.radius * g.moveZ( nji, ni, t );
			
			dx = x1 - x0;
			dy = y1 - y0;
			dz = z1 - z0;
		
			qSq =  1 - g.squeeze( nji, t );		// g.squeeze( nji, t ) === 1 ->  ERROR DIV 0: rSq = 1 / qSq  !!!!!!!!!!!!!!!!!!!!!!!!!
			alphaSq = qSq * pi2;								// squeeze angle 
			rSq = 1 / qSq;										// radius squeeze circle 
			hSq = pi2 / alphaSq * ( 1 - Math.cos( alphaSq ) );	// height (squeezed)
			cSq = rSq - hSq;									// center(y)squeeze circle
						
			r2  = r0 * rSq;
	
			thetaSq = south_north * (  pi2 - alphaSq ) +  alphaSq * theta / pi2 ;		
			
			x2 = r2 * Math.cos( thetaSq ) * Math.cos( phi );	
			y2 = r2 * Math.sin( thetaSq ) - south_north * r0 * cSq;	
			z2 = -r2 * Math.cos( thetaSq ) * Math.sin( phi );	
			
			x = x2 + dx;
			y = y2 + dy;
			z = z2 + dz;
			
		}
					
	}
	
	if ( g.isBufferGeometry && g.indexed ) {
	
		function storeVertex() {
		
			posIdx = vIdx * 3;
			
			g.vertices[ posIdx ]  = x;		
			g.vertices[ posIdx + 1 ]  = y;
			g.vertices[ posIdx + 2 ]  = z;
						
			vIdx ++;
		
		}
	
		function setPoleVertex( south_north ) {
						
			if ( south_north === SOUTH ) {
							
				if ( bottomS === 0 ) {
					
					nih = 0.0001; //  number i hemisphere, 0 pole
					ni = 0.00005; // south pole 0
					
					xPole = 0;
					zPole = 0;
										
					for ( var j = wed - 1; j >= 0; j -- ) {
					
						nji = j / wed ;
						xyzCalculation( SOUTH );
						
						xPole += x;
						zPole += z;
						
					}
	
					x = xPole / wed;
					x = xPole / wed;
					
				} else {
				
					x = xBottomS / bottomSCount;
					y = yBottomS / bottomSCount;
					z = zBottomS / bottomSCount;
					
				}
				
			} 
			
			if ( south_north === NORTH ) {
			
				if ( bottomN  === 0 ) {
				
					nih =  0.0001; //  number i hemisphere, 0 pole
					ni = 0.99995;  // north pole 1
					
					xPole = 0;
					zPole = 0;
										
					for ( var j = wed - 1; j >= 0; j -- ) {
					
						nji = j / wed ;
						xyzCalculation( NORTH );
						
						xPole += x;
						zPole += z;
						
					}
	
					x = xPole / wed;
					x = xPole / wed;
					
				} else {
					
					x = xBottomN / bottomNCount;
					y = yBottomN / bottomNCount;
					z = zBottomN / bottomNCount;
					
				}
			
			}
						
			storeVertex();
			
		}	
	
		function setVertex( south_north ) {
			
			fullBottomS = south_north === SOUTH && i === bottomS && i > 0 && ( g.withBottom || !g.wedgeOpen);
			fullPlaneS = south_north === SOUTH && i === topS && i <= eqt && ( g.withTop || !g.wedgeOpen );
			fullBottomN = south_north === NORTH && i === bottomN && i > 0 && ( g.withTop || !g.wedgeOpen );
			fullPlaneN = south_north === NORTH && i === topN && i <= eqt  && ( g.withBottom || !g.wedgeOpen );
			
			fullCircle = fullBottomS || fullPlaneS || fullBottomN || fullPlaneN;
			
			var jMax =  fullCircle ? i * wed + 1 : i * uWed + 1;
			
			nih = i / eqt; //  number i hemisphere, 0 pole to 1 equator
			
			ni = south_north === SOUTH ? nih / 2 : 0.5 + ( 1 - nih ) / 2; //  south pole 0 to north pole 1 
						
			for ( var j = 0; j < jMax; j ++ ) { 
												
				nji = j / ( i * uWed );
				
				xyzCalculation( south_north );
				
				// saving the cumulative sum of positions
				
				if ( fullBottomS && j < jMax - 1 ) {
					
					xBottomS += x;
					yBottomS += y;
					zBottomS += z;
					
				}
											
				if ( fullPlaneS&& j < jMax - 1  ) {
					
					xPlaneS += x;
					yPlaneS += y;
					zPlaneS += z;
					
				 }
						
				if ( fullBottomN&& j < jMax - 1  ) {
					
					xBottomN += x;
					yBottomN += y;
					zBottomN += z;
					
				}	
								 
				if ( fullPlaneN&& j < jMax - 1  ) {
					
					xPlaneN += x;
					yPlaneN += y;
					zPlaneN += z;
					
				}
				
				// store only the used wedges
				
				if ( j < i * uWed + 1 ) storeVertex();
				
			}
			
		}
	
		function setPlaneCenterVertex( south_north ) {
					
			if ( south_north === SOUTH ) {
				
				x = xPlaneS / topSCount; 
				y = yPlaneS / topSCount;
				z = zPlaneS / topSCount;
				 
			}
			
			if ( south_north === NORTH ) {

				x = xPlaneN / topNCount;
				y = yPlaneN / topNCount;
				z = zPlaneN / topNCount;
				
			}
					
			storeVertex();
			
		}		
		
		function setEdgeVertex( south_north ) {
			
			var jMax = south_north === SOUTH ? g.top * uWed + 1 : topN * uWed + 1;
			var posEdgeDiff = jMax * 3;
			
			for ( var j = 0; j < jMax; j ++ ) {

				posIdx = vIdx * 3;
				
				g.vertices[ posIdx ]  = g.vertices[ posIdx - posEdgeDiff ];	 // x;	
				g.vertices[ posIdx + 1 ]  = g.vertices[ posIdx + 1 - posEdgeDiff ];	// y;
				g.vertices[ posIdx + 2 ]  = g.vertices[ posIdx + 2 - posEdgeDiff ];	//z;
				
				vIdx ++;
								
			}
						
		}
			
		g.attributes.position.needsUpdate = true;
		g.attributes.normal.needsUpdate = true;
		
		// vertex positions south hemisphere
			
		if ( g.bottom < eqt ) {

			vIdx = g.southVertex;	
			
			for ( var i = ( bottomS === 0) ? 1 : bottomS; i <= topS; i ++ ) {
				
				setVertex( SOUTH );
	
			}
			
			if ( bottomS === 0 || g.withBottom ) {
				
				vIdx = 0;
				setPoleVertex( SOUTH );
												
			}
			
			if ( g.top <= eqt && g.withTop ) {
				
				vIdx = g.southTopVertex + 1;  // a, c, b face 
				
				setEdgeVertex( SOUTH );
				setPlaneCenterVertex( SOUTH );
								
			}
			
			if(  !g.wedgeOpen ) {
						
				vIdx = g.southWedgeVertex;
				
				setPlaneCenterVertex( SOUTH );
	
				for ( var ssIdx = 0; ssIdx < g.wedgeSouthStartIdx.length; ssIdx ++ ) {
					
					posIdx =  vIdx * 3;
					
					g.vertices[ posIdx ]  = g.vertices[ g.wedgeSouthStartIdx[ ssIdx ] ]; // x
					g.vertices[ posIdx + 1 ]  = g.vertices[ g.wedgeSouthStartIdx[ ssIdx ] + 1 ]; //y
					g.vertices[ posIdx + 2 ]  = g.vertices[ g.wedgeSouthStartIdx[ ssIdx ] + 2 ]; //z
										
					vIdx ++;
										
				}
				
				setPoleVertex( SOUTH );
				
				for ( var seIdx = 0; seIdx < g.wedgeSouthEndIdx.length; seIdx ++ ) {
				
					posIdx =  vIdx * 3;
					
					g.vertices[ posIdx ]  = g.vertices[ g.wedgeSouthEndIdx[ seIdx ] ]; // x 
					g.vertices[ posIdx + 1 ]  = g.vertices[ g.wedgeSouthEndIdx[ seIdx ] + 1 ]; //y
					g.vertices[ posIdx + 2 ]  = g.vertices[ g.wedgeSouthEndIdx[ seIdx ] + 2 ]; //z
									
					vIdx ++;
					
				}
								
			}
					
		}
		
		// vertex positions north hemisphere
		
		if ( g.top > eqt  ) {
	
			vIdx = g.northVertex;
			
			for ( var i = ( bottomN === 0 ) ? 1 : bottomN; i <= topN; i ++ ) {
				
				setVertex( NORTH );
								
			}
					
			if (  bottomN === 0  || g.withTop ) { 
			
				vIdx = g.vertexNorthOffset;
				
				setPoleVertex( NORTH );  // north: from top to bottom!
									
			}
			
			if ( g.bottom >= eqt && g.withBottom ) {
			
				vIdx = g.northBottomVertex + 1; // a, c, b face
				
				setEdgeVertex( NORTH );
				setPlaneCenterVertex( NORTH );
																	
			}

			if(  !g.wedgeOpen ) {
							
				vIdx = g.northWedgeVertex;
				
				setPlaneCenterVertex( NORTH );
				
				for ( var nsIdx = 0; nsIdx < g.wedgeNorthStartIdx.length; nsIdx ++ ) {
				
					posIdx =  vIdx * 3;
					
					g.vertices[ posIdx ]  = g.vertices[ g.wedgeNorthStartIdx[ nsIdx ] ]; // x
					g.vertices[ posIdx + 1 ]  = g.vertices[ g.wedgeNorthStartIdx[ nsIdx ] + 1 ]; //y
					g.vertices[ posIdx + 2 ]  = g.vertices[ g.wedgeNorthStartIdx[ nsIdx ] + 2 ]; //z
										
					vIdx ++;
										
				}

				setPoleVertex( NORTH );
				
				for ( var neIdx = 0; neIdx < g.wedgeNorthEndIdx.length; neIdx ++ ) {
				
					posIdx =  vIdx * 3;
					
					g.vertices[ posIdx ]  = g.vertices[ g.wedgeNorthEndIdx[ neIdx ] ]; // x
					g.vertices[ posIdx + 1 ]  = g.vertices[ g.wedgeNorthEndIdx[ neIdx ] + 1 ]; //y
					g.vertices[ posIdx + 2 ]  = g.vertices[ g.wedgeNorthEndIdx[ neIdx ] + 2 ]; //z
										
					vIdx ++;
					
				}			
											
			}
				
		}
		
		g.computeVertexNormals();
		
	}	

}

function morphFaces( time ) {

	if ( !g.materialDefault ) {
		
		var t = time !== undefined ? time : 0;
		
		g = this;
		
		var eqt = g.equator;
		var wed = g.wedges;
		var uWed = g.usedWedges;
		
		var wedgeFacesCount;
		
		var jMax;
		
		var bottomS = g.bottom; 						// bottom south	hemisphere
		var topS = Math.min( eqt, g.top ); 				// top south	hemisphere
		var bottomN = eqt * 2 - g.top; 					// bottom north	hemisphere
		var topN = Math.min( eqt, eqt * 2 - g.bottom);	// top north	hemisphere
		
		/*
		//var minEqtTop = Math.min( eqt, g.top ); // topS
		var bottomNorth = eqt * 2 - g.bottom;  // topN
		var minEqtBottomNorth = Math.min( eqt, bottomNorth ); // topN
		var topNorth = eqt * 2 - g.top; 	// bottomN
						
		// var maxEqtBottom = Math.max( eqt, g.bottom ); // nicht mehr benutzt !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		*/
		
		var fIdx = 0;	// face index
		
		// indexed and non-indexed BufferGeometry identical

		if ( g.isBufferGeometry ) {	
		
			// south hemisphere
			
			if ( g.bottom < eqt  ) {
				
				if ( g.withBottom && !g.materialSouthDefault ) {
				
					for ( var j = 0; j < bottomS * uWed; j ++ ) {
						
						g.groups[ fIdx ].materialIndex =  g.materialSouth( ( j + 0.5 ) / ( bottomS * uWed ), bottomS / eqt, t );
						
						fIdx ++;
						
					}
					
				}
						
				if ( !g.materialSouthDefault ) {
				
					
					fIdx = g.southFace;
						
					for ( var i = bottomS; i < topS; i ++ ) {
						
						jMax = ( 2 * i + 1 ) * uWed;
						
						for ( var j = 0; j < jMax; j ++ ) { 
						
							g.groups[ fIdx ].materialIndex =  g.materialSouth( ( j + 0.5 ) / jMax , i / eqt, t );
								
							fIdx ++;
							
						}
					
					}
					
				}	
				
				if ( g.top <= eqt && g.withTop && !g.materialPlaneDefault ) {
				
					
					fIdx = g.southTopFace;
					
					for ( var j = 0; j < g.top * uWed; j ++ ) {
						
						g.groups[ fIdx ].materialIndex =  g.materialPlane( ( j + 0.5 ) / ( g.top * uWed ), t );
						
						fIdx ++;
						
					}
					
				}
				
				if ( !g.wedgeOpen && !g.materialWedgeDefault ) {
										
					fIdx = g.southWedgeFace;
										
					wedgeFacesCount =  2 * ( topS - bottomS )  + ( bottomS > 0 ? 2 : 0 );
										
					 for ( var j = 0, i = bottomS; j < wedgeFacesCount; j ++, i ++ ) {
					 
						g.groups[ fIdx ].materialIndex = g.materialWedge(  0.5 * ( 1 + i / ( topS * 2 ) ), t );
							
						fIdx ++;
						
					}
					
				}
					
			}
						
			// north hemisphere
			
			if ( g.top > eqt ) {
							
				if ( g.withTop && !g.materialNorthDefault )  {
					
					fIdx = g.faceNorthOffset;

					for ( var j = 0; j < bottomN * uWed; j ++ ) {
						
						g.groups[ fIdx ].materialIndex =  g.materialNorth( ( j + 0.5 ) / ( bottomN * uWed ), bottomN / eqt, t );
						
						fIdx ++;
						
					}
					
				}
				
				if ( !g.materialNorthDefault ) {
					
					fIdx = g.northFace;

					for ( var i = bottomN; i < topN	; i ++ ) {
						
						jMax = ( 2 * i + 1 ) * uWed;
											
						for ( var j = 0; j < jMax; j ++ ) { 
												
							g.groups[ fIdx ].materialIndex =  g.materialNorth( ( j + 0.5 ) / jMax, i / eqt, t );
							
							fIdx ++;
							
						}
						
					}
					
				}	
							
				if ( g.bottom >= eqt && g.withBottom && !g.materialPlaneDefault ) {
					
					fIdx = g.northBottomFace;
					
					for ( var j = 0; j < topN * uWed; j ++ ) {
						
						g.groups[ fIdx ].materialIndex =  g.materialPlane( ( j + 0.5 ) / (  topN * uWed ), t );
						
						fIdx ++;
						
					}
					
				}
				
				if ( !g.wedgeOpen && !g.materialWedgeDefault ) {
					
					fIdx = g.northWedgeFace;
					
					wedgeFacesCount =  2 * ( topN - bottomN ) + ( bottomN > 0 ? 2 : 0 );
					
					for ( var j = 0, i = bottomN; j < wedgeFacesCount; j ++, i ++ ) {
						
						g.groups[ fIdx ].materialIndex = g.materialWedge(  0.5 * ( 1 + i / ( topN * 2 ) ), t );
						
						fIdx ++;
						
					}
									
				}
						
			}
			
		}
			
	}

}

function vertexFaceNumbersHelper( mesh, mode, size, color ) {

	//  mode: 0 nothing, 1 vertex, 2 face, 3 vertex & face
	
	var verticesCount;
	var facesCount;
	 
	var vertexNumbers = [];
	var faceNumbers = [];
	var materialDigits = new THREE.LineBasicMaterial( { color: color } );
	var geometryDigit = [];
	var digit = [];
	var d100, d10, d1;		// digits
	var coordDigit = [];	// design of the digits
	
	var digitPositions = [];
	
	function numbering() { 
				
		i1 ++;														// starts with  -1 + 1 = 0
		
		if ( i1   === 10 ) {i1   = 0; i10 ++ }
		if ( i10  === 10 ) {i10  = 0; i100 ++ }
		if ( i100 === 10 ) {i100 = 0 }								// hundreds (reset when overflow)
		
		if ( i100 > 0 ) {
			
			d100 = digit[ i100 ].clone();							// digit for hundreds
			board.add( d100 );										// on the board ...
			d100.position.x = -8 * 0.1 * size;						// ... move slightly to the left
			
		}
		
		if ( ( i100 > 0 ) || ( ( i100 === 0 ) && ( i10 > 0 ) ) ) {	// no preceding zeros tens
			
			d10 = digit[ i10 ].clone();								// digit for tenth
			board.add( d10 );										// on the board
			
		}
		
		d1 =   digit[ i1 ].clone();									// digit 
		board.add( d1 );											//  on the board ...
		d1.position.x = 8 * 0.1 * size;		 						// ... move slightly to the right
					
	}
	
	coordDigit[ 0 ] = [ 0,0, 0,9, 6,9, 6,0, 0,0 ];
	coordDigit[ 1 ] = [ 0,6, 3,9, 3,0 ];
	coordDigit[ 2 ] = [ 0,9, 6,9, 6,6, 0,0, 6,0 ];
	coordDigit[ 3 ] = [ 0,9, 6,9, 6,5, 3,5, 6,5, 6,0, 0,0 ];
	coordDigit[ 4 ] = [ 0,9, 0,5, 6,5, 3,5, 3,6, 3,0 ];
	coordDigit[ 5 ] = [ 6,9, 0,9, 0,5, 6,5, 6,0, 0,0 ];
	coordDigit[ 6 ] = [ 6,9, 0,9, 0,0, 6,0, 6,5, 0,5 ];
	coordDigit[ 7 ] = [ 0,9, 6,9, 6,6, 0,0 ];
	coordDigit[ 8 ] = [ 0,0, 0,9, 6,9, 6,5, 0,5, 6,5, 6,0, 0,0 ];
	coordDigit[ 9 ] = [ 6,5, 0,5, 0,9, 6,9, 6,0, 0,0 ];
	
	if ( mesh.geometry.isGeometry) {
		
		if ( mode === 1 || mode === 3 ) {
		
			verticesCount = mesh.geometry.vertices.length;
			
		}
		
		if ( mode === 2 || mode === 3 ) {
		
			facesCount = mesh.geometry.faces.length ;
			
		}
			
		for ( var i = 0; i<10; i ++ ) {
			
			geometryDigit[ i ]  = new THREE.Geometry();
			
			for ( var j = 0; j < coordDigit[ i ].length/ 2; j ++ ) {
				
				geometryDigit[ i ].vertices.push( new THREE.Vector3( 0.1 * size * coordDigit[ i ][ 2 * j ], 0.1 * size * coordDigit[ i ][ 2 * j + 1 ], 0 ) );
				
			}
			
			digit[ i ] = new THREE.Line( geometryDigit[ i ], materialDigits );
			
		}
		
		if ( mode === 1 || mode === 3 ) {
		
			var i100 =  0;
			var i10  =  0;
			var i1   = -1;
			
			for ( var i = 0; i < verticesCount ; i ++ ) {
			
				// Number on board, up to three digits are pinned there
	
				var board = new THREE.Mesh( new THREE.Geometry() );
					
				numbering(); // numbering the vertices, hundreds ...
					
				vertexNumbers.push( board );	// place the table in the vertex numbering data field
				mesh.add( vertexNumbers[ i ] );	
				
			}
			
		}
		
		if ( mode === 2 || mode === 3 ) {
		
			var i100 =  0;
			var i10  =  0;
			var i1   = -1;
			
			for ( var i = 0; i < facesCount ; i ++ ) {
			
				// Number on board, up to three digits are pinned there
				
				var board = new THREE.Mesh( new THREE.Geometry() );
				
				numbering(); // numbering the facesces, hundreds ...
					
				faceNumbers.push( board );	// place the table in the face numbering data field
				mesh.add( faceNumbers[ i ] );	
				
			}
			
		}
				
	}
	
	// indexed BufferGeometry
	
	if ( mesh.geometry.isBufferGeometry && mesh.geometry.indexed) { 
			
		if ( mode === 1 || mode === 3 ) {
	
			verticesCount = mesh.geometry.vertices.length / 3 ; 
											
		}
		
		if ( mode === 2 || mode === 3 ) {
			
			facesCount = mesh.geometry.faceIndices.length / 3;
				
		}
				
		for ( var i = 0; i < 10; i ++ ) {
			
			geometryDigit[ i ] = new THREE.BufferGeometry();
			
			digitPositions[ i ] =  new Float32Array( coordDigit[ i ].length / 2 * 3 );
			geometryDigit[ i ].addAttribute( 'position', new THREE.BufferAttribute( digitPositions[ i ], 3 ) );
			
			for ( var j = 0; j < coordDigit[ i ].length/ 2; j ++ ) {
				
				digitPositions[ i ][ j * 3 ] =  0.1 * size * coordDigit[ i ][ 2 * j ];
				digitPositions[ i ][ j * 3 + 1 ] = 0.1 * size * coordDigit[ i ][ 2 * j + 1 ];
				digitPositions[ i ][ j * 3 + 2 ] = 0;
				
			}
			
			digit[ i ] = new THREE.Line( geometryDigit[ i ], materialDigits );
			
		}	
						
		if ( mode === 1 || mode === 3 ) {
		
			var i100 =  0;
			var i10  =  0;
			var i1   = -1;
			
			for ( var i = 0; i < verticesCount ; i ++ ) {
			
				// Number on board, up to three digits are pinned there
	
				var board = new THREE.Mesh( new THREE.BufferGeometry() );
				
				numbering(); // numbering the vertices, hundreds ...
					
				vertexNumbers.push( board );	// place the table in the vertex numbering data field
				mesh.add( vertexNumbers[ i ] );	
				
			}
			
		}
		
		if ( mode === 2 || mode === 3 ) {
		
			var i100 =  0;
			var i10  =  0;
			var i1   = -1;
			
			for ( var i = 0; i < facesCount ; i ++ ) {
			
				// Number on board, up to three digits are pinned there

				var board = new THREE.Mesh( new THREE.BufferGeometry() );
						
				numbering(); // numbering the facesces, hundreds ...
					
				faceNumbers.push( board );	// place the table in the face numbering data field
				mesh.add( faceNumbers[ i ] );	
				
			}
			
		}
					
	}
	
	// non indexed BufferGeometry
	
	if ( mesh.geometry.isBufferGeometry && !mesh.geometry.indexed) { 
			
		if ( mode === 1 || mode === 3 ) {
				
			verticesCount = mesh.geometry.vertexPositions.length;
				
		}
		
		if ( mode === 2 || mode === 3 ) {
			
			facesCount = mesh.geometry.positions.length / 9;
			
		}
				
		for ( var i = 0; i < 10; i ++ ) {
			
			geometryDigit[ i ] = new THREE.BufferGeometry();
			
			digitPositions[ i ] =  new Float32Array( coordDigit[ i ].length / 2 * 3 );
			geometryDigit[ i ].addAttribute( 'position', new THREE.BufferAttribute( digitPositions[ i ], 3 ) );
			
			for ( var j = 0; j < coordDigit[ i ].length/ 2; j ++ ) {
				
				digitPositions[ i ][ j * 3 ] =  0.1 * size * coordDigit[ i ][ 2 * j ];
				digitPositions[ i ][ j * 3 + 1 ] = 0.1 * size * coordDigit[ i ][ 2 * j + 1 ];
				digitPositions[ i ][ j * 3 + 2 ] = 0;
				
			}
			
			digit[ i ] = new THREE.Line( geometryDigit[ i ], materialDigits );
			
		}	
						
		if ( mode === 1 || mode === 3 ) {
		
			var i100 =  0;
			var i10  =  0;
			var i1   = -1;
			
			for ( var i = 0; i < verticesCount ; i ++ ) {
			
				// Number on board, up to three digits are pinned there
	
				var board = new THREE.Mesh( new THREE.BufferGeometry() );
				
				numbering(); // numbering the vertices, hundreds ...
					
				vertexNumbers.push( board );	// place the table in the vertex numbering data field
				mesh.add( vertexNumbers[ i ] );	
				
			}
			
		}
		
		if ( mode === 2 || mode === 3 ) {
		
			var i100 =  0;
			var i10  =  0;
			var i1   = -1;
			
			for ( var i = 0; i < facesCount ; i ++ ) {
			
				// Number on board, up to three digits are pinned there

				var board = new THREE.Mesh( new THREE.BufferGeometry() );
						
				numbering(); // numbering the facesces, hundreds ...
					
				faceNumbers.push( board );	// place the table in the face numbering data field
				mesh.add( faceNumbers[ i ] );	
				
			}
			
		}
					
	}
	
	// update helper
	
	this.update = function ( mode ) {
	
		var x, y, z;
		
		// Geometry
		
		if ( mesh.geometry.isGeometry ) {
		
			if ( mode === 1 || mode === 3 ) {
									
				for( var n = 0; n < vertexNumbers.length; n ++ ) {
					
					vertexNumbers[ n ].position.set( mesh.geometry.vertices[ n ].x, mesh.geometry.vertices[ n ].y, mesh.geometry.vertices[ n ].z ); 
					vertexNumbers[ n ].lookAt( camera.position );
					
				}
				
			}
			
			if ( mode === 2 || mode === 3 ) {
				
				for( var n = 0; n < faceNumbers.length; n ++ ) {
					
					x = 0;
					x += mesh.geometry.vertices[ mesh.geometry.faces[ n ].a ].x;
					x += mesh.geometry.vertices[ mesh.geometry.faces[ n ].b ].x; 
					x += mesh.geometry.vertices[ mesh.geometry.faces[ n ].c ].x;
					x /= 3;
					
					y = 0;
					y += mesh.geometry.vertices[ mesh.geometry.faces[ n ].a ].y;
					y += mesh.geometry.vertices[ mesh.geometry.faces[ n ].b ].y;
					y += mesh.geometry.vertices[ mesh.geometry.faces[ n ].c ].y;
					y /= 3;
					
					z = 0;
					z += mesh.geometry.vertices[ mesh.geometry.faces[ n ].a ].z;
					z += mesh.geometry.vertices[ mesh.geometry.faces[ n ].b ].z;
					z += mesh.geometry.vertices[ mesh.geometry.faces[ n ].c ].z;
					z /= 3;
					
					faceNumbers[ n ].position.set( x, y, z );
					faceNumbers[ n ].lookAt( camera.position );
				
				}
				
			}
						
		}
		
		// indexed BufferGeometry
		
		if ( mesh.geometry.isBufferGeometry && mesh.geometry.indexed ) {
			
			if ( mode === 1 || mode === 3 ) {
								
				for( var n = 0; n < vertexNumbers.length; n ++ ) {
					
					vertexNumbers[ n ].position.set( mesh.geometry.vertices[ 3 * n ], mesh.geometry.vertices[ 3 * n  + 1 ], mesh.geometry.vertices[ 3 * n  + 2 ] );
					vertexNumbers[ n ].lookAt( camera.position );
					
				}

			}
			
			if ( mode === 2 || mode === 3 ) {
							
				for( var n = 0; n < faceNumbers.length; n ++ ) {
				
					x = 0;
					x += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n ] * 3 ];
					x += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n + 1 ] * 3 ];
					x += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n + 2 ] * 3 ];
					x /= 3;
					
					y = 0;
					y += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n ] * 3  + 1 ];
					y += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n + 1 ] * 3 + 1 ];
					y += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n + 2 ] * 3 + 1 ];
					y /= 3;
					
					z = 0;
					z += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n ] * 3  + 2 ];
					z += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n + 1 ] * 3 + 2 ];
					z += mesh.geometry.vertices[ mesh.geometry.faceIndices[ 3 * n + 2 ] * 3 + 2 ];
					z /= 3;
					
					faceNumbers[ n ].position.set( x, y, z );
					faceNumbers[ n ].lookAt( camera.position );
					
				}
				
			}
					
		}
		
		// non indexed BufferGeometry
		
		if ( mesh.geometry.isBufferGeometry && !mesh.geometry.indexed ) {
			
			if ( mode === 1 || mode === 3 ) {
						
				for( var n = 0; n < vertexNumbers.length; n ++ ) { 
					
					vertexNumbers[ n ].position.set( mesh.geometry.positions[ mesh.geometry.vertexPositions[ n ][ 0 ] ], mesh.geometry.positions[ mesh.geometry.vertexPositions[ n ][ 0 ] + 1 ], mesh.geometry.positions[ mesh.geometry.vertexPositions[ n ][ 0 ] + 2] );
					vertexNumbers[ n ].lookAt( camera.position );
					
				}
							
			}
			
			if ( mode === 2 || mode === 3 ) {
									
				for( var n = 0; n < faceNumbers.length; n ++ ) {
					
					x = 0;
					x += mesh.geometry.positions[ 9 * n ];	
					x += mesh.geometry.positions[ 9 * n + 3 ];	
					x += mesh.geometry.positions[ 9 * n + 6 ];	
					x /= 3;	
						
					y = 0;	
					y += mesh.geometry.positions[ 9 * n + 1 ];	
					y += mesh.geometry.positions[ 9 * n + 4 ];	
					y += mesh.geometry.positions[ 9 * n + 7 ];	
					y /= 3;	
						
					z = 0;	
					z += mesh.geometry.positions[ 9 * n + 2 ];	
					z += mesh.geometry.positions[ 9 * n + 5 ];	
					z += mesh.geometry.positions[ 9 * n + 8 ];	
					z /= 3;	
						
					faceNumbers[ n ].position.set( x, y, z );
					faceNumbers[ n ].lookAt( camera.position );
											
				}
								
			}
					
		}
		
	}
	
}

exports.createMorphGeometry = createMorphGeometry;
exports.create = create;
exports.morphVertices =	morphVertices;
exports.morphFaces = morphFaces;

exports.vertexFaceNumbersHelper = vertexFaceNumbersHelper;

Object.defineProperty(exports, '__esModule', { value: true });

})));