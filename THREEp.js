// THREEp.js ( rev 87.3 alpha )

/**
 * @author hofk / http://threejs.hofk.de/
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.THREEp = global.THREEp || {})));
}(this, (function (exports) {

'use strict';

		// !!!!!  Debug  !!!!! !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				var debug = document.getElementById("debug"); 
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
	bottomCircle,	// south pole is 0
	topCircle,		// max. equator * 2 (is north pole)
	withBottom,		// with a bottom (bottomCircle > 0)
	withTop,		// with a top (topCircle < equator * 2)	
	style,			// 'map', 'relief', 'complete'
	
		// functions: u,v and result normally 0 .. 1, otherwise specific / interesting results!
		// u azimuth (start: x axis)  v polar (start: south pole 0, end: north pole 1), t time
	
	rPhiTheta,  	//	function ( u, v, t )	// radius depending on location, spherical coordinates u, v 
	stretchSouth,	//	function ( u, v, t )	// stretch / compress in -y direction
	stretchNorth, 	//	function ( u, v, t )	// stretch / compress in +y direction
	equatorGap,		//	function ( u, t )		// gap in relation to the radius
	squeeze,		//  function ( u, t )		// 0 sphere to 1 flat circle
	moveX,			//	function ( u, v, t )	// factor for radius, move in x direction 
	moveY,			//	function ( u, v, t )	// factor for radius, move in y direction
	moveZ,			//	function ( v, u, t )	// factor for radius, move in z direction
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
	g.bottomCircle =	p.bottomCircle !== undefined ? 		p.bottomCircle		: 0;
	g.topCircle =		p.topCircle !== undefined ? 		p.topCircle			: g.equator * 2;
	g.withTop =			p.withTop	!== undefined ?			p.withTop			: false;
	g.withBottom =		p.withBottom	!== undefined ?		p.withBottom		: false;
	g.style =			p.style !== undefined ?				p.style				: "complete";	
	g.rPhiTheta =		p.rPhiTheta !== undefined ? 		p.rPhiTheta			: function ( u, v, t ) { return 1 };
	g.stretchSouth =	p.stretchSouth !== undefined ?		p.stretchSouth		: function ( u, v, t ) { return 1 };
	g.stretchNorth =	p.stretchNorth !== undefined ? 		p.stretchNorth		: function ( u, v, t ) { return 1 };
	g.equatorGap =		p.equatorGap !== undefined ? 		p.equatorGap		: function ( u, t ) { return 0 };
	g.squeeze =			p.squeeze !== undefined ? 			p.squeeze			: function ( u, t ) { return 0 };
	g.moveX =			p.moveX	!== undefined ? 			p.moveX				: function ( u, v, t ) { return 0 };
	g.moveY =			p.moveY	!== undefined ? 			p.moveY				: function ( u, v, t ) { return 0 };
	g.moveZ =			p.moveZ	!== undefined ? 			p.moveZ				: function ( u, v, t ) { return 0 };
	
	if ( g.topCircle - g.bottomCircle <= 0 ) g.wedgeOpen = true;
	if ( g.wedges < g.usedWedges ) g.usedWedges = g.wedges;
	if ( g.bottomCircle >= g.equator * 2 ) g.bottomCircle  = 0;
	if ( g.topCircle > g.equator * 2) g.topCircle = g.equator * 2;
	if ( g.topCircle < g.bottomCircle ) {
		
		g.bottomCircle  = 0;
		g.topCircle = g.equator * 2;
		
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
	var ni, iMin, iMax, jMin, jMax;	
	var uvIdx;
	var theta;
	var phi;	
	var phiOffset = Math.PI * ( 1 - uWed / wed);
	var minEqtTop = Math.min( eqt, g.topCircle );
	var maxEqtBottom = Math.max( eqt, g.bottomCircle );
	var bottomNorth = eqt * 2 - g.bottomCircle;
	var topNorth = eqt * 2 - g.topCircle;	
	var minEqtBottomNorth = Math.min( eqt, bottomNorth );
	
	g.wedgeSouthStartIdx = [];
	g.wedgeSouthEndIdx = [];
	g.wedgeNorthStartIdx = [];
	g.wedgeNorthEndIdx = [];
	
	var ssIdx = minEqtTop - (g.bottomCircle === 0 ? 1 : g.bottomCircle ); // wedge south start index
	var seIdx = 0; // wedge south end index
	var nsIdx = minEqtBottomNorth - ( topNorth === 0 ? 1 : topNorth ); // wedge north start index
	var neIdx = 0; // wedge north end index	
	var pi2 = Math.PI / 2;
	const SOUTH = -1;
	const NORTH = 1;
	
	if ( g.bottomCircle === 0 ) g.withBottom = false;
	if ( g.topCircle === eqt * 2 ) g.withTop = false;
		
	//count vertices: south and north hemisphere
	
	vertexCount = 0;
	
	if ( g.bottomCircle < eqt ) {
	
		vertexCount += ( g.bottomCircle === 0  || g.withBottom ) ? 1 : 0;	// south pole || bottom

		g.southVertex = vertexCount;
		
		for ( var i = g.bottomCircle === 0 ? 1 : g.bottomCircle ; i <= minEqtTop; i ++ ) {
		
			vertexCount += i * uWed + 1;
					
		}
		
		g.southTopVertex = vertexCount - 1;
		
		vertexCount += ( g.topCircle <= eqt && g.withTop ) ? g.topCircle * uWed + 2 : 0;	// south top
		
		g.southWedgeVertex =  vertexCount;
		vertexCount += ( !g.wedgeOpen ) ? 2 : 0; // wedge closed		
				
		for ( var i = g.bottomCircle === 0 ? 1 : g.bottomCircle ; i <= minEqtTop; i ++ ) {
		
			vertexCount += ( !g.wedgeOpen ) ? 2 : 0;  // wedge closed ( start / end )
		
		}
			
	}
	
	g.vertexNorthOffset = vertexCount;
		
	if ( g.topCircle > eqt ) {
			
		vertexCount += ( topNorth === 0 || g.withTop ) ? 1 : 0;	// north pole || top
		
		g.northVertex =  vertexCount;
		
		for ( var i = topNorth === 0 ? 1 : topNorth ; i <= minEqtBottomNorth; i ++ ) {

			vertexCount += i * uWed + 1; // equator is double (uv's, equator gap)

		}
		
		g.northBottomVertex = vertexCount - 1;
		
		vertexCount += ( g.bottomCircle >= eqt &&  g.withBottom ) ? bottomNorth * uWed + 2 : 0;	// north bottom
		
		g.northWedgeVertex =  vertexCount;
		vertexCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed
		
		for ( var i = topNorth === 0 ?  1 : topNorth; i <= minEqtBottomNorth; i ++ ) {
		
			vertexCount += ( !g.wedgeOpen ) ? 2 : 0;  // wedge closed ( start / end )
		
		}
				
	}
	
	// count faces 
	// south hemisphere
	
	faceCount = 0;
	
	if ( g.bottomCircle < eqt ) {
	
		faceCount += ( g.bottomCircle > 0 && g.withBottom ) ? g.bottomCircle * uWed : 0; // bottom south
		
		g.southFace = faceCount;
		
		for ( var i = g.bottomCircle; i < minEqtTop; i ++ ) {
		
			faceCount += ( 2 * i + 1 ) * uWed;
						
		}
		
		g.southTopFace = faceCount;
		
		faceCount += ( g.topCircle <= eqt && g.withTop ) ? g.topCircle * uWed : 0; // top south
		
		g.southWedgeFace = faceCount;
			
		for ( var i = g.bottomCircle; i < minEqtTop; i ++ ) {
		
			faceCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed ( start / end )
			
		}
		
		faceCount += ( !g.wedgeOpen  &&  g.bottomCircle > 0  ) ? 2 : 0;	// wedge closed  middle if  g.bottomCircle > 0 
						
	}
	
	g.faceNorthOffset = faceCount;

	if ( g.topCircle > eqt ) {
		
		faceCount += ( topNorth > 0 && g.withTop ) ? topNorth * uWed : 0;  // top north
		
		g.northFace = faceCount;
	
		for ( var i = topNorth; i < minEqtBottomNorth; i ++ ) {
		
			faceCount += ( 2 * i + 1 ) * uWed;
						
		}
		
		g.northBottomFace = faceCount;
		
		faceCount += ( g.bottomCircle >= eqt && g.withBottom ) ? bottomNorth * uWed : 0; // bottom	north
						
		g.northWedgeFace = faceCount;
		
		for ( var i = topNorth; i < minEqtBottomNorth; i ++ ) {
		
			faceCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed ( start / end )
			
		}
				
		faceCount += ( !g.wedgeOpen  && topNorth > 0  ) ? 2 : 0;	// wedge closed  middle if  topNorth > 0 
							
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
		
		if ( g.bottomCircle < eqt ) {
		
			if ( g.bottomCircle === 0 || g.withBottom ) { 
						
				a = 0;  // vertex vIdx 0: south pole || bottom
				b = 1;
				c = 0;
								
				jMax = g.bottomCircle === 0 ? uWed : g.bottomCircle * uWed;
				
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
			
			for ( var i = g.bottomCircle === 0 ? 1 : g.bottomCircle; i < minEqtTop; i ++ ) {
				
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
			
			
			if ( g.topCircle <= eqt && g.withTop ) {
			
				vIdx  = g.southTopVertex + 1; // uv's  c, b  
		
				a = vIdx + g.topCircle * uWed + 1;
				b = vIdx;
				c = vIdx - 1;
				
				// faces
				
				for ( var j = 0; j < g.topCircle * uWed; j ++ ) {
				
					b ++;
					c ++;
					
					pushFace(); 
											
				}
				
				// uv's
				
				for ( var j = 0; j < g.topCircle * uWed + 1; j ++ ) {
	
					phi = 2 * Math.PI * j / ( g.topCircle * wed ) + phiOffset;
					
					// ux = 0.5 * ( 1 + g.topCircle / eqt * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 - g.topCircle / eqt * Math.sin( phi ) );	
					uy = 0.5 * ( 1 + g.topCircle / eqt * Math.cos( phi ) );
					
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
				
				iMax = ( minEqtTop - ( g.bottomCircle > 0 ? g.bottomCircle - 1 : 0 ) ) * 2;
				
				for ( var i = 0; i < iMax; i ++ ) {
					b ++;
					c ++;
										
					pushFace();
						
				}
								
				// wedge uv's

				ux = 0.5;
				uy = 0.5 * ( 1 + Math.sin( -Math.PI / 2 * ( 1 - minEqtTop / eqt ) ) );
			
				storeUvs();
				vIdx ++;
				
				iMin = g.bottomCircle > 0 ? g.bottomCircle - 1 : 0;
							
				for ( var i = minEqtTop; i > iMin; i -- ) {
												
					theta = -Math.PI / 2 * (1 - i / eqt);
					
					ux = 0.5 * ( 1 - Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
			
					storeUvs();
					vIdx ++;
							
				}
				
				ux = 0.5;	
				uy = 0.5 * ( 1 +  Math.sin( -Math.PI / 2 * ( 1 - g.bottomCircle / eqt ) ) );
				
				storeUvs();
				vIdx ++;
				
				for ( var i = iMin + 1; i <= minEqtTop; i ++  ){
											
					theta = -Math.PI / 2 * ( 1 - i / eqt );
					
					ux = 0.5 * ( 1 + Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
					
					storeUvs();
					vIdx ++;
														
				}
												
			}

			// south: store wedge index & south uv's
			
			vIdx = g.southVertex;
			
			for ( var i = g.bottomCircle === 0 ? 1 : g.bottomCircle; i <= minEqtTop; i ++ ) {
				
				ni = i / eqt;
				
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
										
					// ux = 0.5 * ( 1 - ni * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 + ni * Math.sin( phi ) );					
					uy = 0.5 * ( 1 + ni * Math.cos( phi ) );
					
					storeUvs();
					vIdx ++;
					
				}
				
			}
					
		}
		
		// faces, uvs  north hemisphere
		
		if ( g.topCircle > eqt ) {
		
			if ( topNorth === 0 || g.withTop ) { 
				
				a = g.vertexNorthOffset; // north pole || top

				b = a;
				c = a + 1;
				
				jMax = topNorth === 0 ? uWed : topNorth * uWed;
				
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

			for ( var i = topNorth === 0 ? 1 : topNorth; i < minEqtBottomNorth; i ++ ) {
				
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
			
			if ( g.bottomCircle >= eqt && g.withBottom ) {
			
				vIdx  = g.northBottomVertex + 1; // uv's  c, b
								
				a = vIdx + bottomNorth * uWed + 1;
				b = vIdx;
				c = vIdx - 1;

				// faces
				
				for ( var j = 0; j < bottomNorth * uWed; j ++ ) {
				
					b ++;
					c ++;
										
					pushFace();
					
				}
				
				// uv's
				
				for ( var j = 0; j < bottomNorth * uWed + 1; j ++ ) {
				
					phi = 2 * Math.PI * j / ( bottomNorth * wed ) + phiOffset;
									
					// ux = 0.5 * ( 1 -  bottomNorth / eqt * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 + bottomNorth / eqt * Math.sin( phi ) );
					uy = 0.5 * ( 1 + bottomNorth / eqt * Math.cos( phi ) );
					
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
				
				iMax = ( minEqtBottomNorth - ( topNorth > 0 ? topNorth - 1 : 0 ) ) * 2;
				
				for ( var i = 0; i < iMax; i ++ ) {
				
					b ++;
					c ++;
					
					pushFace();
																							
				}
				
				// wedge uv's
				
				ux = 0.5;
				uy = 0.5 * ( 1 + Math.sin( Math.PI / 2 * ( 1 - minEqtBottomNorth / eqt ) ) );
				
				storeUvs();
				vIdx ++;
				
				iMin = topNorth > 0 ? topNorth - 1 : topNorth;
				
				for ( var i = minEqtBottomNorth ; i > iMin; i -- ) {
					
					theta = Math.PI / 2 * ( 1  - i / eqt );
					
					ux = 0.5 * ( 1 + Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
			
					storeUvs();
					vIdx ++;
													
				}

				ux = 0.5;	
				uy = 0.5 * ( 1 +  Math.sin( Math.PI / 2 * ( 1 - topNorth / eqt ) ) );
			
				storeUvs();
				vIdx ++;
				
				for ( var i = iMin + 1; i <= minEqtBottomNorth; i ++  ){
					
					theta = Math.PI / 2 * ( 1  - i / eqt );
					
					ux = 0.5 * ( 1 - Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
					
					storeUvs();
					vIdx ++;
						
				}	
					
			}
						
			// north: store wedge index & uv's
			
			vIdx = g.northVertex;
			
			for ( var i = topNorth === 0 ? 1 : topNorth; i <= minEqtBottomNorth; i ++ ) {
				
				ni = i / eqt;
				
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
										
					//ux = 0.5 * ( 1 + ni * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 - ni * Math.sin( phi ) ); 
					uy = 0.5 * ( 1 + ni * Math.cos( phi ) );
					
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
	var ni, nji, iMin, iMax, jMin, jMax;;
	var posIdx;
	var theta, thetaSq, thetaY, thetaSqY;
	var phi; 
	var phiOffset = Math.PI * ( 1 - uWed / wed);
	var minEqtTop = Math.min( eqt, g.topCircle );
	var maxEqtBottom = Math.max( eqt, g.bottomCircle );
	var bottomNorth = eqt * 2 - g.bottomCircle;
	var topNorth = eqt * 2 - g.topCircle;	
	var minEqtBottomNorth = Math.min( eqt, bottomNorth );	
	var qSq, alphaSq, rSq, hSq, cSq;
	var pi2 = Math.PI / 2;
	
	const SOUTH = -1;
	const NORTH = 1;
	const BOTTOM = 0;
	const TOP = 1;
	
	function xyzCalculation( south_north ) {
	
		if ( g.squeezeDefault ) {
				
			r = g.radius * g.rPhiTheta( nji, ni, t );
			ry = r * ( south_north === SOUTH ? g.stretchSouth( nji, ni, t ) : g.stretchNorth( nji, ni, t ) ) ;
			
			x = r * Math.cos( theta ) * Math.cos( phi ) + g.radius * g.moveX( nji, ni, t );	
			y = ry * Math.sin( thetaY ) + g.radius * ( south_north * g.equatorGap( nji, t ) / 2 + g.moveY( nji, ni, t ) ); 	
			z = - r * Math.cos( theta ) * Math.sin( phi ) + g.radius * g.moveZ( nji, ni, t );				
			
		} else {
							
			// squeeze

			r0 = g.radius;
			
			x0 = r0 * Math.cos( theta ) * Math.cos( phi );
			y0 = r0 * Math.sin( thetaY );
			z0 = -r0 * Math.cos( theta ) * Math.sin( phi );
				
			r1 = g.radius * g.rPhiTheta( nji, ni, t );
			r1y = r1 * ( south_north === SOUTH ? g.stretchSouth( nji, ni, t ) : g.stretchNorth( nji, ni, t ) );
			
			x1 = r1 * Math.cos( theta ) * Math.cos( phi ) + g.radius * g.moveX( nji, ni, t );
			y1 = r1y * Math.sin( thetaY ) + g.radius * ( south_north * g.equatorGap( nji, t ) / 2 + g.moveY( nji, ni, t ) ); 
			z1 = - r1 * Math.cos( theta ) * Math.sin( phi ) + g.radius * g.moveZ( nji, ni, t );
			
			dx = x1 - x0;
			dy = y1 - y0;
			dz = z1 - z0;
		
			qSq =  1 - g.squeeze( nji, t );
			alphaSq = qSq * pi2;								// squeeze angle 
			rSq = 1 / qSq;										// radius squeeze circle
			hSq = pi2 / alphaSq * ( 1 - Math.cos( alphaSq ) );	// height (squeezed)
			cSq = rSq - hSq;									// center(y)squeeze circle
						
			r2  = r0 * rSq;
	
			thetaSq = south_north * (  pi2 - alphaSq ) +  alphaSq * theta / pi2 ;		
			thetaSqY = south_north * (  pi2 - alphaSq ) +  alphaSq * thetaY / pi2 ;
		
			x2 = r2 * Math.cos( thetaSq ) * Math.cos( phi );	
			y2 = r2 * Math.sin( thetaSqY ) - south_north * r0 * cSq;	
			z2 = - r2 * Math.cos( thetaSq ) * Math.sin( phi );	
			
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
			
		function setPoleVertex( south_north, bottom_top ) {
			
			ni = south_north === SOUTH ? 0 : 1;	 									
			nji = 0;		
			phi = 0; // phi = 2 * Math.PI * uWed / wed * nji;
			theta = south_north * Math.PI / 2 ; 
			
			if (south_north === SOUTH ) {
				
				if ( bottom_top === BOTTOM ) thetaY = -Math.PI / 2 * ( 1 - g.bottomCircle / eqt );
				
				if ( bottom_top === TOP ) thetaY = -Math.PI / 2 * ( 1 - g.topCircle / eqt );
																
			}	
				
			if (south_north === NORTH ) {
				
				if ( bottom_top === BOTTOM ) thetaY = Math.PI / 2 * ( g.bottomCircle - eqt ) / eqt;
								
				if ( bottom_top === TOP ) thetaY = Math.PI / 2 * ( g.topCircle - eqt ) / eqt;
								
			}
			
			xyzCalculation( south_north ); 
			
			storeVertex();
			
		}		
			
		function setVertex( south_north ) {
		
			var jMax =  i * uWed + 1;
			
			ni = i / eqt; // identically for south and north hemisphere: 0 pole to 1 equator
			theta = Math.PI / 2 * ( 1 - ni ) * south_north;	// SOUTH (-) NORTH (+)
			thetaY = theta;
			ni = south_north === SOUTH ? ni / 2 : 0.5 + ( 1 - ni ) / 2; //  0 to 1 for sphere: g.rPhiTheta()
						
			for ( var j = 0; j < jMax; j ++ ) { 
												
				nji = j / ( i * uWed );
								
				phi = 2 * Math.PI * uWed / wed * nji + phiOffset;
				
				xyzCalculation( south_north );
				
				storeVertex();
				
			}
			
		}
		
		function setEdgeVertex( south_north ) {
			
			var jMax = south_north === SOUTH ? g.topCircle * uWed + 1 : bottomNorth * uWed + 1;
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
			
		if ( g.bottomCircle < eqt ) {

			if ( g.bottomCircle === 0 || g.withBottom ) {
				
				vIdx = 0;
				setPoleVertex( SOUTH, BOTTOM );
												
			}
			
			vIdx = g.southVertex;	
			
			for ( var i = ( g.bottomCircle === 0) ? 1 : g.bottomCircle; i <= minEqtTop; i ++ ) {
				
				setVertex( SOUTH );
								
			}

			
			if ( g.topCircle <= eqt && g.withTop ) {
				
				i = minEqtTop;	// i --; // because i with 'for' already ++
				
				vIdx = g.southTopVertex + 1;  // a, c, b face 
				setEdgeVertex( SOUTH );
				setPoleVertex( SOUTH, TOP );
								
			}
			
			if(  !g.wedgeOpen ) {
				
				vIdx = g.southWedgeVertex;
								
				ni =  0 ;	 									
				nji = 0;		
				phi = 0; // phi = 2 * Math.PI * uWed / wed * nji;
				
				theta = -Math.PI / 2; 
				thetaY = -Math.PI / 2 * ( 1 - minEqtTop / eqt );
			
		  		xyzCalculation( SOUTH );
				
				storeVertex();
	
				for ( var ssIdx = 0; ssIdx < g.wedgeSouthStartIdx.length; ssIdx ++ ) {
					
					posIdx =  vIdx * 3;
					
					g.vertices[ posIdx ]  = g.vertices[ g.wedgeSouthStartIdx[ ssIdx ] ]; // x
					g.vertices[ posIdx + 1 ]  = g.vertices[ g.wedgeSouthStartIdx[ ssIdx ] + 1 ]; //y
					g.vertices[ posIdx + 2 ]  = g.vertices[ g.wedgeSouthStartIdx[ ssIdx ] + 2 ]; //z
										
					vIdx ++;
										
				}
				
				setPoleVertex( SOUTH, BOTTOM );
				
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
		
		if ( g.topCircle > eqt  ) {
		
			vIdx = g.vertexNorthOffset;
			
			if (  topNorth === 0  || g.withTop ) { 
			
				setPoleVertex( NORTH, TOP );  // north: from top to bottom!
									
			}
			
			for ( var i = ( topNorth === 0 ) ? 1 : topNorth; i <= minEqtBottomNorth; i ++ ) {
				
				setVertex( NORTH );
								
			}
			
			if ( g.bottomCircle >= eqt && g.withBottom ) {
			
				i = minEqtBottomNorth;	// i --; // because i with 'for' already ++ 
				
				setEdgeVertex( NORTH );
				setPoleVertex( NORTH, BOTTOM );
																	
			}

			if(  !g.wedgeOpen ) {
			
				vIdx = g.northWedgeVertex;
			
				ni =  0;	 									
				nji = 0;		
				phi = 0; // phi = 2 * Math.PI * uWed / wed * nji;
				
				theta = Math.PI / 2;
				thetaY = Math.PI / 2 * ( 1 - ( eqt * 2 - maxEqtBottom ) / eqt );
				
				xyzCalculation( NORTH ); 
				
				storeVertex();
								
				for ( var nsIdx = 0; nsIdx < g.wedgeNorthStartIdx.length; nsIdx ++ ) {
				
					posIdx =  vIdx * 3;
					
					g.vertices[ posIdx ]  = g.vertices[ g.wedgeNorthStartIdx[ nsIdx ] ]; // x
					g.vertices[ posIdx + 1 ]  = g.vertices[ g.wedgeNorthStartIdx[ nsIdx ] + 1 ]; //y
					g.vertices[ posIdx + 2 ]  = g.vertices[ g.wedgeNorthStartIdx[ nsIdx ] + 2 ]; //z
										
					vIdx ++;
										
				}

				setPoleVertex( NORTH, TOP );
				
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
		
		var minEqtTop = Math.min( eqt, g.topCircle );
		var maxEqtBottom = Math.max( eqt, g.bottomCircle );
		
		var bottomNorth = eqt * 2 - g.bottomCircle;
		var topNorth = eqt * 2 - g.topCircle;
		
		var minEqtBottomNorth = Math.min( eqt, bottomNorth );
			
		var fIdx = 0;	// face index
		
		// indexed and non-indexed BufferGeometry identical

		if ( g.isBufferGeometry ) {	
		
			// south hemisphere
			
			if ( g.bottomCircle < eqt  ) {
				
				if ( g.withBottom && !g.materialSouthDefault ) {
				
					for ( var j = 0; j < g.bottomCircle * uWed; j ++ ) {
						
						g.groups[ fIdx ].materialIndex =  g.materialSouth( ( j + 0.5 ) / ( g.bottomCircle * uWed ), g.bottomCircle / eqt, t );
						
						fIdx ++;
						
					}
					
				}
						
				if ( !g.materialSouthDefault ) {
				
					
					fIdx = g.southFace;
						
					for ( var i = g.bottomCircle; i < minEqtTop; i ++ ) {
						
						jMax = ( 2 * i + 1 ) * uWed;
						
						for ( var j = 0; j < jMax; j ++ ) { 
						
							g.groups[ fIdx ].materialIndex =  g.materialSouth( ( j + 0.5 ) / jMax , i / eqt, t );
								
							fIdx ++;
							
						}
					
					}
					
				}	
				
				if ( g.topCircle <= eqt && g.withTop && !g.materialPlaneDefault ) {
				
					
					fIdx = g.southTopFace;
					
					for ( var j = 0; j < g.topCircle * uWed; j ++ ) {
						
						g.groups[ fIdx ].materialIndex =  g.materialPlane( ( j + 0.5 ) / ( g.topCircle * uWed ), t );
						
						fIdx ++;
						
					}
					
				}
				
				if ( !g.wedgeOpen && !g.materialWedgeDefault ) {
										
					fIdx = g.southWedgeFace;
										
					wedgeFacesCount =  2 * ( minEqtTop - g.bottomCircle )  + ( g.bottomCircle > 0 ? 2 : 0 );
										
					 for ( var j = 0, i = g.bottomCircle; j < wedgeFacesCount; j ++, i ++ ) {
					 
						g.groups[ fIdx ].materialIndex = g.materialWedge(  0.5 * ( 1 + i / ( minEqtTop * 2 ) ), t );
							
						fIdx ++;
						
					}
					
				}
					
			}
						
			// north hemisphere
			
			if ( g.topCircle > eqt ) {
							
				if ( g.withTop && !g.materialNorthDefault )  {
					
					fIdx = g.faceNorthOffset;

					for ( var j = 0; j < topNorth * uWed; j ++ ) {
						
						g.groups[ fIdx ].materialIndex =  g.materialNorth( ( j + 0.5 ) / ( topNorth * uWed ), topNorth / eqt, t );
						
						fIdx ++;
						
					}
					
				}
				
				if ( !g.materialNorthDefault ) {
					
					fIdx = g.northFace;

					for ( var i = topNorth; i < minEqtBottomNorth; i ++ ) {
						
						jMax = ( 2 * i + 1 ) * uWed;
											
						for ( var j = 0; j < jMax; j ++ ) { 
												
							g.groups[ fIdx ].materialIndex =  g.materialNorth( ( j + 0.5 ) / jMax, i / eqt, t );
							
							fIdx ++;
							
						}
						
					}
					
				}	
							
				if ( g.bottomCircle >= eqt && g.withBottom && !g.materialPlaneDefault ) {
					
					fIdx = g.northBottomFace;
					
					for ( var j = 0; j < bottomNorth * uWed; j ++ ) {
						
						g.groups[ fIdx ].materialIndex =  g.materialPlane( ( j + 0.5 ) / (  bottomNorth * uWed ), t );
						
						fIdx ++;
						
					}
					
				}
				
				if ( !g.wedgeOpen && !g.materialWedgeDefault ) {
					
					fIdx = g.northWedgeFace;
					
					wedgeFacesCount =  2 * ( minEqtBottomNorth - topNorth ) + ( topNorth > 0 ? 2 : 0 );
					
					for ( var j = 0, i = topNorth; j < wedgeFacesCount; j ++, i ++ ) {
						
						g.groups[ fIdx ].materialIndex = g.materialWedge(  0.5 * ( 1 + i / ( minEqtBottomNorth * 2 ) ), t );
						
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