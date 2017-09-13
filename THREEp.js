// THREEp.js ( rev 87.1 alpha )

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
	//squeeze,		//  function ( v, t )		// 0 sphere to 1 flat circle
	moveX,			//	function ( u, v, t )	// factor for radius, move in x direction 
	moveY,			//	function ( u, v, t )	// factor for radius, move in y direction
	moveZ,			//	function ( v, u, t )	// factor for radius, move in z direction
  	//materialCover,	//	function ( u, v, t )// material cover 
  	
*/
    if ( p === undefined ) p = {};
	
	g = this;  // this is a THREE.BufferGeometry() - geometry object from THREE.js

	g.materialCoverDefault = p.materialCover === undefined ? true : false;
	
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
	g.moveX =			p.moveX	!== undefined ? 			p.moveX				: function ( u, v, t ) { return 0 };
	g.moveY =			p.moveY	!== undefined ? 			p.moveY				: function ( u, v, t ) { return 0 };
	g.moveZ =			p.moveZ	!== undefined ? 			p.moveZ				: function ( u, v, t ) { return 0 };
	
	if ( g.wedges === g.usedWedges || ( g.topCircle - g.bottomCircle ) <= 0 ) g.wedgeOpen = true;
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
	
	//g.materialCover = function() { return 1 }; // default material index is 0.1 * 10 = 1	
	
	//if ( p.materialCover !== undefined ) g.materialCover = function ( u, v, t ) { return  Math.floor( 10 * p.materialCover( u, v, t ) ) };
	
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
	var faceNorthOffset;
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
	
	g.wedgeSouthStartIdx = [];
	g.wedgeSouthEndIdx = [];
	g.wedgeNorthStartIdx = [];
	g.wedgeNorthEndIdx = [];
	
	var ssIdx = minEqtTop - (g.bottomCircle === 0 ? 1 : g.bottomCircle ); // wedge south start index
	var seIdx = 0; // wedge south end index
	var nsIdx = Math.min( eqt, bottomNorth ) - ( topNorth === 0 ? 1 : topNorth ); // wedge north start index
	var neIdx = 0; // wedge north end index
	
	const SOUTH = -1;
	const NORTH = 1;
	
	if ( g.bottomCircle === 0 ) g.withBottom = false;
	if ( g.topCircle === eqt * 2 ) g.withTop = false;
	
	function storeUvs() {
	
			uvIdx = vIdx * 2;
			
			g.uvs[ uvIdx ] = ux;		
			g.uvs[ uvIdx + 1 ] = uy;
			
			vIdx ++;
			
	}
	
		
	//count vertices: south and north hemisphere
	
	vertexCount = 0;
	
	if ( g.bottomCircle < eqt ) {
	
		vertexCount += ( g.bottomCircle === 0  || g.withBottom ) ? 1 : 0;	// south pole || bottom
		g.southPoleVertex = vertexCount - 1;
		
		g.southVertex = vertexCount;
		
		for ( var i = g.bottomCircle === 0 ? 1 : g.bottomCircle ; i <= minEqtTop; i ++ ) {
		
			vertexCount += i * uWed + 1;
					
		}
		
		g.southTopVertex = vertexCount - 1;
		vertexCount += ( g.topCircle <= eqt && g.withTop ) ? g.topCircle * uWed + 2 : 0;	// top
		
		g.southWedgeVertex =  vertexCount;
		vertexCount += ( !g.wedgeOpen ) ? 2 : 0; // wedge closed		
				
		for ( var i = g.bottomCircle === 0 ? 1 : g.bottomCircle ; i <= minEqtTop; i ++ ) {
		
			vertexCount += ( !g.wedgeOpen ) ? 2 : 0;  // wedge closed ( start / end )
		
		}
			
	}
	
	g.vertexNorthOffset = vertexCount;
		
	if ( g.topCircle > eqt ) {
			
		vertexCount += ( g.topCircle === eqt * 2 || g.withTop ) ? 1 : 0;	// north pole || top
		g.northPoleVertex = vertexCount - 1;
		
		g.northVertex =  vertexCount;
		
		for ( var i = maxEqtBottom; i <= ( g.topCircle === eqt * 2 ? g.topCircle - 1 : g.topCircle); i ++ ) {
			
			vertexCount += ( eqt * 2 - i ) * uWed + 1; // equator is double (uv's, equator gap)
					
		}
		
		g.northTopVertex = vertexCount - 1;
		
		vertexCount += ( g.bottomCircle >= eqt &&  g.withBottom ) ? bottomNorth * uWed + 2 : 0;	// bottom
		
		g.northWedgeVertex =  vertexCount;
		
		vertexCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed
		
		for ( var i = maxEqtBottom; i <= ( g.topCircle === eqt * 2 ? g.topCircle - 1 : g.topCircle); i ++ ) {
			
			vertexCount += ( !g.wedgeOpen ) ? 2 : 0;  // wedge closed ( start / end )
		
		}
				
	}	

	// count faces: south and north hemisphere
	
	faceCount = 0;
	
	faceCount += ( g.bottomCircle > 0 && g.bottomCircle < eqt && g.withBottom ) ? g.bottomCircle * uWed : 0; // bottom
	faceCount += ( g.topCircle <= eqt && g.withTop ) ? g.topCircle * uWed : 0; // top
	
	faceCount += ( !g.wedgeOpen ) ? 2 : 0; // wedge closed, last  
	faceCount += ( !g.wedgeOpen  &&  g.bottomCircle > 0  ) ? 2 : 0;	// wedge closed  middle if  g.bottomCircle > 0 
	
	for ( var i = g.bottomCircle; i < minEqtTop; i ++ ) {
	
		faceCount += ( 2 * i + 1 ) * uWed;
		faceCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed ( start / end )
		
	}

	faceNorthOffset = faceCount ;
	
	faceCount += ( g.bottomCircle >= eqt && g.withBottom ) ? bottomNorth * uWed : 0; // bottom	
	faceCount += ( g.topCircle > eqt && g.topCircle < eqt * 2 && g.withTop ) ? topNorth * uWed : 0;  // top	
	

	for ( var i = topNorth; i < Math.min( eqt, bottomNorth ); i ++ ) {
	
		faceCount += ( 2 * i + 1 ) * uWed;
		faceCount += ( !g.wedgeOpen ) ? 2 : 0;	// wedge closed ( start / end )
		
	}
				
	if ( g.isBufferGeometry && g.indexed ) {
	
		var faceArrayIdx;	// face array index (face index * 3)
			
		function pushFace() {
	
			g.faceIndices[ faceArrayIdx ] = a;
			g.faceIndices[ faceArrayIdx + 1 ] = b;
			g.faceIndices[ faceArrayIdx + 2 ] = c; 
				
			faceArrayIdx += 3;
		
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
			
				a = g.southPoleVertex;  // vertex 0: south pole || bottom
				b = a + 1;
				c = a;
								
				jMax = g.bottomCircle === 0 ? uWed : g.bottomCircle * uWed;
				
				for ( var j = 1; j <= jMax; j ++ ) {
			
					c ++;
					b ++;
					
					pushFace(); 
													
				}
									
				g.uvs[ g.southPoleVertex ]  = 0.5;		
				g.uvs[ g.southPoleVertex + 1 ]  = 0.5;
			
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
						
				for ( var j = 0; j < g.topCircle * uWed + 1; j ++ ) {
			
					b ++;
					c ++;
					
					pushFace(); 
					
					phi = 2 * Math.PI * j / ( g.topCircle * wed ) + phiOffset;
					
					// ux = 0.5 * ( 1 + g.topCircle / eqt * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 - g.topCircle / eqt * Math.sin( phi ) );	
					uy = 0.5 * ( 1 + g.topCircle / eqt * Math.cos( phi ) );
					
					storeUvs();
											
				}
				
				g.uvs[ a * 2 ]  = 0.5;
				g.uvs[ a * 2 + 1 ]  = 0.5;
								
			} 
				
			if ( !g.wedgeOpen ) {
			
				vIdx = g.southWedgeVertex;
				
				a = vIdx;
				b = a;
				c = a + 1;
				
				ux = 0.5;
				uy = 0.5 * ( 1 + Math.sin( -Math.PI / 2 * ( 1 - minEqtTop / eqt ) ) );
	
				storeUvs();
				
				iMin = g.bottomCircle > 0 ? g.bottomCircle - 1 : g.bottomCircle;
							
				for ( var i = minEqtTop; i > iMin; i -- ) {
					
					b ++;
					c ++;
					
					pushFace();
										
					theta = -Math.PI / 2 * (1 - i / eqt);
					
					ux = 0.5 * ( 1 - Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );

					storeUvs();
							
				}
							
				b ++;
				c ++;
				
				pushFace();
				
				ux = 0.5;	
				uy = 0.5 * ( 1 +  Math.sin( -Math.PI / 2 * ( 1 - g.bottomCircle / eqt ) ) );
				
				storeUvs();
								
				iMin = g.bottomCircle > 0 ? g.bottomCircle : g.bottomCircle + 1;

				for ( var i = iMin; i <= minEqtTop; i ++  ){
			
					if ( i < minEqtTop ) {
					
						b ++;
						c ++;
						
						pushFace();
						
					}
									
					theta = -Math.PI / 2 * ( 1 - i / eqt );
					
					ux = 0.5 * ( 1 + Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
					
					storeUvs();
														
				}
								
			}

			// south: wedge index & uv's
			
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
					
				}
				
			}
					
		}
		
		// faces, uvs  north hemisphere
		
		if ( g.topCircle > eqt ) {
		
			vIdx = g.vertexNorthOffset;
			
			if ( g.topCircle === eqt * 2 || g.withTop ) { 
			
				a = g.northPoleVertex; // north pole || top
				b = a;
				c = a + 1;
				
				jMax = g.topCircle === eqt * 2 ? uWed : topNorth * uWed;
				
				for ( var j = 1; j <= jMax; j ++ ) {
								
					b ++;
					c ++;
					
					pushFace();
								
				}
							
				g.uvs[ g.northPoleVertex * 2 ] = 0.5;		
				g.uvs[ g.northPoleVertex * 2 + 1 ] = 0.5;
								
			}
			
			vIdx = g.northVertex;
			
			for ( var i = g.topCircle === eqt * 2 ? 1 : topNorth; i < Math.min( eqt, bottomNorth ); i ++ ) {
				
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
			
				vIdx  = g.northTopVertex + 1; // uv's  c, b
			
				a = vIdx + bottomNorth * uWed + 1;
				b = vIdx;
				c = vIdx - 1;

				for ( var j = 0; j < bottomNorth * uWed + 1; j ++ ) {
			
					c ++;
					b ++;
					
					pushFace(); 
					
					phi = 2 * Math.PI * j / ( bottomNorth * wed ) + phiOffset;
									
					// ux = 0.5 * ( 1 -  bottomNorth / eqt * Math.sin( phi ) ); // mirrored
					ux = 0.5 * ( 1 + bottomNorth / eqt * Math.sin( phi ) );
					uy = 0.5 * ( 1 + bottomNorth / eqt * Math.cos( phi ) );
					
					storeUvs();
																
				}
		
				g.uvs[ a * 2 ]  = 0.5;		
				g.uvs[ a * 2 + 1 ]  = 0.5;
							
			}
			
			if ( !g.wedgeOpen ) {
			
				vIdx =  g.northWedgeVertex;
				
				a = vIdx;
				b = a;
				c = a + 1;
				
				ux = 0.5;
				uy = 0.5 * ( 1 + Math.sin( Math.PI / 2 * ( 1 - ( eqt * 2 - maxEqtBottom ) / eqt ) ) );
				
				storeUvs();
								
				iMax = g.topCircle < eqt * 2 ? g.topCircle + 1 : g.topCircle;
				
				for ( var i = maxEqtBottom; i < iMax; i ++ ) {
					
					b ++;
					c ++;
					
					pushFace();
					
					theta = Math.PI / 2 * ( 1  - ( eqt * 2 - i ) / eqt );
					
					ux = 0.5 * ( 1 + Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
			
					storeUvs();
													
				}
				
				b ++;
				c ++;
				
				pushFace();
				
				ux = 0.5;	
				uy = 0.5 * ( 1 +  Math.sin( Math.PI / 2 * ( 1 - topNorth / eqt ) ) );
			
				storeUvs();
				
				iMax = g.topCircle < eqt * 2 ? g.topCircle : g.topCircle - 1;
				
				for ( var i = iMax; i >= maxEqtBottom; i -- ) {

					theta = Math.PI / 2 * ( 1  - ( eqt * 2 - i ) / eqt );
					
						if ( i > maxEqtBottom ) {
		
						b ++;
						c ++;
						
						pushFace();
						
					}
					
					ux = 0.5 * ( 1 - Math.cos( theta ) );	
					uy = 0.5 * ( 1 + Math.sin( theta ) );
					
					storeUvs();
						
				}	
						
			}
						
			// north: wedge index & uv's
			
			vIdx = g.northVertex;
			
			for ( var i = g.topCircle === eqt * 2 ? 1 : topNorth; i <= Math.min( eqt, bottomNorth ); i ++ ) {
				
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
	var r;				// calculated radius
	var x, y, z;		// coordinates	
	var ni, nji, iMin, iMax, jMin, jMax;;
	var posIdx;
	var theta, thetaY;
	var phi; 
	var phiOffset = Math.PI * ( 1 - uWed / wed);
	var minEqtTop = Math.min( eqt, g.topCircle );
	var maxEqtBottom = Math.max( eqt, g.bottomCircle );
	var bottomNorth = eqt * 2 - g.bottomCircle;
	var topNorth = eqt * 2 - g.topCircle;
	
	const SOUTH = -1;
	const NORTH = 1;
	const BOTTOM = 0;
	const TOP = 1;
	
	function xyzCalculation( south_north ) { 
			
		r = g.radius * g.rPhiTheta( nji, ni, t );
		
		x = r * Math.cos( theta ) * Math.cos( phi ) + g.radius * g.moveX( nji, ni, t );	
			
		z = - r * Math.cos( theta ) * Math.sin( phi ) + g.radius * g.moveZ( nji, ni, t );	
		
		r *= ( south_north === SOUTH ? g.stretchSouth( nji, ni, t ) : g.stretchNorth( nji, ni, t ) ) ;	
		y = r * Math.sin( thetaY ) + g.radius * ( south_north * g.equatorGap( nji, t ) / 2 + g.moveY( nji, ni, t ) ); 	
			
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
		//g.attributes.normal.needsUpdate = true;
		
		// vertex positions south hemisphere
			
		if ( g.bottomCircle < eqt ) {

			if ( g.bottomCircle === 0 || g.withBottom ) {
				
				vIdx = g.southPoleVertex;
				setPoleVertex( SOUTH, BOTTOM );
												
			}
			
			vIdx = g.southVertex;	
			
			for ( var i = ( g.bottomCircle === 0) ? 1 : g.bottomCircle; i <= minEqtTop; i ++ ) {
				
				setVertex( SOUTH );
								
			}

			
			if ( g.topCircle <= eqt && g.withTop ) {
				
				i --; // because i with 'for' already ++ // equals i = minEqtTop;
				
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
			
			if ( g.topCircle === eqt * 2 || g.withTop ) { 
			
				setPoleVertex( NORTH, TOP );  // north: from top to bottom!
									
			}
			
			for ( var i = ( g.topCircle === eqt * 2 ) ? 1 : topNorth; i <= Math.min( eqt, bottomNorth ); i ++ ) {
				
				setVertex( NORTH );
								
			}
			
			if ( g.bottomCircle >= eqt && g.withBottom ) {
			
				i --; // because i with 'for' already ++ // i = Math.min( eqt, bottomNorth );
				
				setEdgeVertex( NORTH );
				setPoleVertex( NORTH, BOTTOM );
																	
			}

			if(  !g.wedgeOpen ) {
			
				vIdx = g.northWedgeVertex;
			
				ni =  0 ;	 									
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
		
	}	

}

function morphFaces( time ) {
	
	var t = time !== undefined ? time : 0;
		
	g = this;

}

function vertexNumbersHelper( mesh, size, color ) {	
	 
	var vertexNumbers = [];
	var materialDigits = new THREE.LineBasicMaterial( { color: color } );
	var geometryDigit = [];
	var digit = [];
	var d100, d10, d1;		// digits
	var coordDigit = [];	// design of the digits
	
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
		
	 	var verticesCount = mesh.geometry.vertices.length;
		
		for ( var i = 0; i<10; i ++ ) {
			
			geometryDigit[ i ]  = new THREE.Geometry();
			
			for ( var j = 0; j < coordDigit[ i ].length/ 2; j ++ ) {
				
				geometryDigit[ i ].vertices.push( new THREE.Vector3( 0.1 * size * coordDigit[ i ][ 2 * j ], 0.1 * size * coordDigit[ i ][ 2 * j + 1 ], 0 ) );
				
			}
			
			digit[ i ] = new THREE.Line( geometryDigit[ i ], materialDigits );
			
		}
		
	}
	
	if ( mesh.geometry.isBufferGeometry) { 
		
		var verticesCount = mesh.geometry.vertices.length / 3 ; 
		
		var digitPositions = [];
		
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
			
	}
	
	// numbering the vertices, hundreds ...
	var i100 =  0;
	var i10  =  0;
	var i1   = -1;
	
	for ( var i = 0; i < verticesCount ; i ++ ) {
		
		// Number on board, up to three digits are pinned there
		
		if ( mesh.geometry.isGeometry) {
			
			var board = new THREE.Mesh( new THREE.Geometry() );
			
		}	
		
		if ( mesh.geometry.isBufferGeometry) {
			
			var board = new THREE.Mesh( new THREE.BufferGeometry() );
			
		}
		
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
		
		vertexNumbers.push( board );								// place the table in the numbering data field
		mesh.add( vertexNumbers[ i ] );
		
	}
	
	this.update = function ( ) {
		
		if ( mesh.geometry.isGeometry ) {
			
			for( var n = 0; n < vertexNumbers.length; n ++ ) {
				
				vertexNumbers[ n ].position.set( mesh.geometry.vertices[ n ].x, mesh.geometry.vertices[ n ].y, mesh.geometry.vertices[ n ].z ); 
				vertexNumbers[ n ].lookAt( camera.position );
				
			}
			
		}
		
		if ( mesh.geometry.isBufferGeometry ) {
			
			for( var n = 0; n < vertexNumbers.length; n ++ ) {
				
				vertexNumbers[ n ].position.set( mesh.geometry.vertices[ 3 * n ], mesh.geometry.vertices[ 3 * n  + 1 ], mesh.geometry.vertices[ 3 * n  + 2 ] );
				vertexNumbers[ n ].lookAt( camera.position );
				
			}
			
		}
		
	}
	
}

exports.createMorphGeometry = createMorphGeometry;
exports.create = create;
exports.morphVertices =	morphVertices;
exports.morphFaces = morphFaces;

exports.vertexNumbersHelper = vertexNumbersHelper;

Object.defineProperty(exports, '__esModule', { value: true });

})));