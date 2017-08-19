// THREEp.js ( rev 86.0.2 alpha )

/**
 * @author hofk / http://threejs.hofk.de/
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.THREEp = global.THREEp || {})));
}(this, (function (exports) {

'use strict';

var g;	// THREE.BufferGeometry

function createMorphGeometry( p ) {
 
/*	parameter overview	--- all parameters are optional ---

p = {
	
		// simple properties
	
	indexed,		// indexed or non indexed BufferGeometry	
	radius,			// reference sphere radius, multiplier for functions
	wedges,			// spherical wedges
	equator,		// half of spherical segments
	equatorGap,		// gap in relation to the radius
	bottomCircle,	// south pole is 0
	topCircle,		// max. equator * 2 (is north pole)
	withBottom,		// with a bottom (if bottomCircle > 0)
	withTop,		// with a top (if topCircle < equator * 2)
	style,			// 'map', 'relief', 'complete'
	
		// functions: u,v and result normally 0 .. 1, otherwise specific / interesting results!
		// u azimuth (start: x axis)  v polar (start: south pole 0, end: north pole 1), t time
	
	rPhiTheta,  	//	function ( u, v, t )	// radius depending on location, spherical coordinates u, v 
	stretchSouth,	//	function ( u, v, t )	// stretch / compress in -y direction
	stretchNorth, 	//	function ( u, v, t )	// stretch / compress in +y direction
	//squeeze,		//  function ( v, t )		// 0 sphere to 1 flat circle
	moveX,			//	function ( u, v, t )	// factor for radius, move in x direction 
	moveY,			//	function ( u, v, t )	// factor for radius, move in y direction
	moveZ,			//	function ( v, u, t )	// factor for radius, move in z direction
  	//materialCover,	//	function ( u, v, t )	// material cover 
  	
*/
    if ( p === undefined ) p = {};
	
	g = this;  // this is a THREE.BufferGeometry() - geometry object from THREE.js

	g.materialCoverDefault = p.materialCover === undefined ? true : false;
	
	//....................................................................... set defaults
	g.indexed = 		p.indexed !== undefined ? 			p.indexed			: true;
	g.radius = 			p.radius !== undefined ?			p.radius			: 16;	
	g.wedges =			p.wedges !== undefined ?			p.wedges 			: 6;
	g.equator =			p.equator !== undefined ?			p.equator			: 9;
	g.equatorGap =		p.equatorGap !== undefined ? 		p.equatorGap		: 0;
	g.bottomCircle =	p.bottomCircle !== undefined ? 		p.bottomCircle		: 0;
	g.topCircle =		p.topCircle !== undefined ? 		p.topCircle			: g.equator * 2;
	g.withTop =			p.withTop	!== undefined ?			p.withTop			: false;
	g.withBottom =		p.withBottom	!== undefined ?		p.withBottom		: false;
	g.style =			p.style !== undefined ?				p.style				: "complete";	
	g.rPhiTheta =		p.rPhiTheta !== undefined ? 		p.rPhiTheta			: function ( u, v, t ) { return 1 };
	g.stretchSouth =	p.stretchSouth !== undefined ?		p.stretchSouth		: function ( u, v, t ) { return 1 };
	g.stretchNorth =	p.stretchNorth !== undefined ? 		p.stretchNorth		: function ( u, v, t ) { return 1 };
	g.moveX =			p.moveX	!== undefined ? 			p.moveX				: function ( u, v, t ) { return 0 };
	g.moveY =			p.moveY	!== undefined ? 			p.moveY				: function ( u, v, t ) { return 0 };
	g.moveZ =			p.moveZ	!== undefined ? 			p.moveZ				: function ( u, v, t ) { return 0 };	
		
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
	var verticesSum;
	var vertexCount;
	var faceCount;
	var faceNorthOffset;
	var x, y, z, ux, uy;
	var a, b, c;
	var ni, nji, jMax;
	var idxCount;
	var posIdx;
	var theta;
	var phi;
	
	const SOUTH = -1;
	const NORTH = 1;
	
	if ( g.bottomCircle === 0 ) g.withBottom = false;
	if ( g.topCircle === eqt * 2 ) g.withTop = false;
		
	//count vertices: south and north hemisphere
	
	vertexCount = 0;
	
	if ( g.bottomCircle < eqt ) {
	
		for ( var i = g.bottomCircle; i <= Math.min( eqt, g.topCircle ); i ++ ) {
		
			vertexCount += i * wed;
		
		}
		
		vertexCount += ( g.bottomCircle === 0  || g.withBottom ) ? 1 : 0;	// south pole || bottom
		vertexCount += ( g.topCircle <= eqt && g.withTop ) ? 1 : 0;			// top
	
	}
	
	g.vertexNorthOffset = vertexCount;
	
	if ( g.topCircle > eqt ) {
				
		for ( var i = Math.max( eqt, g.bottomCircle ); i <= g.topCircle; i ++ ) {
			
			vertexCount += ( eqt * 2 - i ) * wed ; // equator double (uv's)
		
		}

		vertexCount += ( g.topCircle === eqt * 2 || g.withTop ) ? 1 : 0;	// north pole || top
		vertexCount += ( g.bottomCircle >= eqt && g.withBottom ) ? 1 : 0;	// bottom
		
	}	
	
	g.vertexTotal = vertexCount;
	
	// count faces: south and north hemisphere
	
	faceCount = 0;
	
	for ( var i = g.bottomCircle; i < Math.min( eqt, g.topCircle ); i ++ ) {
	
		faceCount += ( 2 * i + 1 ) * wed;
		
	}
	
	faceCount += ( g.bottomCircle > 0 && g.bottomCircle < eqt && g.withBottom ) ? g.bottomCircle * wed : 0;
	faceCount += ( g.topCircle <= eqt && g.withTop ) ? g.topCircle * wed : 0;
	
	faceNorthOffset = faceCount ;
	
	for ( var i = eqt * 2 - g.topCircle; i < Math.min( eqt, eqt * 2 - g.bottomCircle ); i ++ ) {
	
		faceCount += ( 2 * i + 1 ) * wed;
		
	}
	
	faceCount += ( g.bottomCircle >= eqt && g.withBottom ) ? ( eqt * 2 - g.bottomCircle ) * wed : 0;
	faceCount += ( g.topCircle > eqt && g.topCircle < eqt * 2 && g.withTop ) ? ( eqt * 2 - g.topCircle ) * wed : 0;
		
	if ( g.isBufferGeometry && g.indexed ) {
			
		function setFace() {
	
			g.faceIndices[ idxCount     ] = a;
			g.faceIndices[ idxCount + 1 ] = b;
			g.faceIndices[ idxCount + 2 ] = c; 
				
			idxCount += 3;
		
		}
					
		g.vertices = new Float32Array( vertexCount * 3 );  
		g.faceIndices = new Uint32Array( faceCount * 3 );
		g.normals = new Float32Array( vertexCount * 3 ); 
		g.uvs = new Float32Array( vertexCount * 2 );	
			
		g.setIndex( new THREE.BufferAttribute( g.faceIndices, 1 ) );	
		g.addAttribute( 'position', new THREE.BufferAttribute( g.vertices, 3 ).setDynamic( true ) );
		g.addAttribute( 'normal', new THREE.BufferAttribute( g.normals, 3 ).setDynamic( true ) );
		g.addAttribute( 'uv', new THREE.BufferAttribute( g.uvs, 2 ) );
		
		idxCount = 0;
				
		// faces, uvs south hemisphere
		
		if ( g.bottomCircle < eqt ) {
		
			verticesSum = 0;
			
			if ( g.bottomCircle === 0 || g.withBottom ) { 
			
				a = 0; // vertex 0: south pole || bottom
				b = 1;
				c = 0;
				
				jMax = g.bottomCircle === 0 ? wed : g.bottomCircle * wed;
				
				for ( var j = 1; j <= jMax; j ++ ) {
			
					c ++;
					b = j !== jMax ? b + 1 : 1;
					
					setFace(); 
													
				}
								
				verticesSum = 1; // only vertex 0, south pole || vertex bottom
				
				g.uvs[ 0 ]  = 0.5;		
				g.uvs[ 1 ]  = 0.5;
			
			}
			
			for ( var i = g.bottomCircle === 0 ? 1 : g.bottomCircle; i < Math.min( eqt, g.topCircle ); i ++ ) {
		
				for ( var w = 0; w < wed; w ++ ) {
					
					for ( var j = 0; j < i + 1 ; j ++ ) {  
										
						if ( j === 0 ) {
						
							//  first face in wedge 
							
							a = verticesSum;
							b = a + wed * i + w + 1;
							c = b - 1;
					
							setFace();
							
						} else {
						
							//  two faces / vertex
				
							a = j + verticesSum; 
							b = a + wed * i + w;
							c = a - 1;
							
							if ( w === ( wed - 1 ) && j === i ) a -= wed * i; // connect to first vertex of circle
						
							setFace();
							
							// a  from first face 
							b++; // b from first face
							c = b - 1;
							
							if ( w === ( wed - 1 ) && j === i ) b -= wed * ( i + 1 ); // connect to first vertex of next circle
													
							setFace();
							
						}
						
					}
					
					verticesSum += i;
									
				}
					
			
			}
			
			if ( g.topCircle <= eqt && g.withTop ) {
		
				a = verticesSum + g.topCircle * wed; // top vertex
				b = verticesSum;
				c = verticesSum - 1;
								
				jMax = g.topCircle * wed;
	
				for ( var j = 1; j <= jMax; j ++ ) {
			
					c ++;
					b = c !== verticesSum + jMax - 1 ? b + 1 : verticesSum;
							
					setFace(); 
													
				}
		
				g.uvs[ a * 2 ]  = 0.5;		
				g.uvs[ a * 2 + 1 ]  = 0.5;
				
			}
						
			// further uv's 
			
			verticesSum = ( g.bottomCircle === 0 || g.withBottom ) ? 1 : 0;
			
			for ( var i = g.bottomCircle === 0 ? 1 : g.bottomCircle; i <= Math.min( eqt, g.topCircle ); i ++ ) {
				
				ni = i / eqt;
				
				for ( var j = 0; j < i * wed; j ++ ) {
					
					//nji = j / ( i * wed );
					phi = 2 * Math.PI * j / ( i * wed );
										
					ux = 0.5 * ( 1 - ni * Math.sin( phi ) );
					uy = 0.5 * ( 1 + ni * Math.cos( phi ) );
					
					posIdx = ( verticesSum + j ) * 2;
					
					g.uvs[ posIdx ]  = ux;		
					g.uvs[ posIdx + 1 ]  = uy;
									
				}
				
				verticesSum += i * wed; 
				
			}
		
		}
		
		// faces, uvs  north hemisphere
		
		if ( g.topCircle > eqt ) {
		
			verticesSum = g.vertexNorthOffset;
			
			if ( g.topCircle === eqt * 2 || g.withTop ) { 
			
				a = g.vertexNorthOffset; // vertex 0 + north offset: north pole || top
				b = g.vertexNorthOffset;
				c = 1 + g.vertexNorthOffset;
				
				jMax = g.topCircle === eqt * 2 ? wed : ( eqt * 2 - g.topCircle ) * wed;
				
				for ( var j = 1; j <= jMax; j ++ ) {
								
					b ++;
					c = j !== jMax ? c + 1 : 1 + g.vertexNorthOffset;
								
					setFace();
								
				}
				
				verticesSum = 1 + g.vertexNorthOffset; // only vertex 0 + g.vertexNorthOffset
								
				g.uvs[ a * 2 ] = 0.5;		
				g.uvs[ a * 2 + 1 ] = 0.5;
								
			}
			
			for ( var i = g.topCircle === eqt * 2 ? 1 : eqt * 2 - g.topCircle; i < Math.min( eqt, eqt * 2 - g.bottomCircle ); i ++ ) {
				
				for ( var w = 0; w < wed; w ++ ) {
				
					for ( var j = 0; j < i + 1 ; j ++ ) {  
										
						if ( j === 0 ) {
						
							//  first face in wedge 
							
							a = verticesSum;
							b = a + wed * i + w;
							c = b + 1;
					
							setFace();
							
						} else {
						
							//  two faces / vertex
				
							a = j + verticesSum; 
							b = a - 1; 
							c = a + wed * i + w;
							if ( w === ( wed - 1 ) && j === i ) a -= wed * i; // connect to first vertex of circle
						
							setFace();
							
							// a  from first face 
							b = c; // from first face
							c = b + 1;
							
							if ( w === ( wed - 1 ) && j === i ) c -= wed * ( i + 1 ); // connect to first vertex of next circle
													
							setFace();
							
						}
						
					}
					
					verticesSum += i;
							
				}
								
			}
			
			if ( g.bottomCircle >= eqt && g.withBottom ) {
			
				a = verticesSum + ( eqt * 2 - g.bottomCircle ) * wed; // bottom vertex
				b = verticesSum;
				c = verticesSum - 1;
				
				jMax = ( eqt * 2 - g.bottomCircle ) * wed;
	
				for ( var j = 1; j <= jMax; j ++ ) {
			
					c ++;
					b = c !== verticesSum + jMax - 1 ? b + 1 : verticesSum;
					
					setFace(); 
													
				}
		
				g.uvs[ a * 2 ]  = 0.5;		
				g.uvs[ a * 2 + 1 ]  = 0.5;
							
			}
			
			// further uv's
			
			verticesSum = g.vertexNorthOffset + 1;
			
			for ( var i = g.topCircle === eqt * 2 ? 1 : eqt * 2 - g.topCircle; i <= Math.min( eqt, eqt * 2 - g.bottomCircle ); i ++ ) {
				
				ni = i / eqt;
				
				for ( var j = 0; j < i * wed; j ++ ) {
					
					//nji = j / ( i * wed );
					phi = 2 * Math.PI * j / ( i * wed );
					
					
					ux = 0.5 * ( 1 + ni * Math.sin( phi ) );
						// ux = 0.5 * ( 1 - ni * Math.sin( phi ) ); // mirrored
					uy = 0.5 * ( 1 + ni * Math.cos( phi ) );
					
					posIdx = ( verticesSum + j ) * 2;
					
					g.uvs[ posIdx ]  = ux;		
					g.uvs[ posIdx + 1 ]  = uy;
					
				}
			
				verticesSum += i * wed;
				
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
	
	var verticesSum;
	var r;				// calculated radius
	var x, y, z;		// coordinates
	var xx, yy, zz;		// cumulative coordinates 
	var ni, nji;
	var posIdx;
	var theta;
	var phi;
	var gap = g.equatorGap / 2 * g.radius; // absolute half equator gap
	const SOUTH = -1;
	const NORTH = 1;
	
	function xyzCalculation( south_north ) { 
			
		r = g.radius * g.rPhiTheta( nji, ni, t );
		x = r * Math.cos( theta ) * Math.cos( phi ) + g.radius * g.moveX( nji, ni, t );	
		z = r * Math.cos( theta ) * Math.sin( phi ) + g.radius * g.moveZ( nji, ni, t );	
		
		r *= ( south_north === SOUTH ? g.stretchSouth( nji, ni, t ) : g.stretchNorth( nji, ni, t ) ) ;	
		y = r * Math.sin( theta ) + south_north * gap + g.radius * g.moveY( nji, ni, t ); 	
		
	}
	
	if ( g.isBufferGeometry && g.indexed ) {
			
		function setPoleVertex( south_north ) {
		
			ni =  south_north === SOUTH ? 0 : 1;
			nji = 0;
			
			theta = south_north * ( Math.PI / 2 ); 

			xyzCalculation( south_north ); 
			
			posIdx =  south_north === SOUTH ? 0 : g.vertexNorthOffset * 3;
			 
			g.vertices[ posIdx ]  = x;		
			g.vertices[ posIdx + 1 ]  = y;
			g.vertices[ posIdx + 2 ]  = z;
						
			verticesSum = 1 + posIdx / 3; // only vertex pole
			
		}
			
		function setVertex( south_north ) {
		
			ni = i / eqt; // identically for south and north hemisphere: 0 pole to 1 equator
			theta = Math.PI / 2 * ( 1 - ni ) * south_north;	// SOUTH (-) NORTH (+)
			ni = south_north === SOUTH ? ni / 2 : 0.5 + ( 1 - ni ) / 2; //  0 to 1 for sphere: g.rPhiTheta()
			
			for ( var j = 0; j < i * wed; j ++ ) { 
			
				nji = j / ( i * wed );
				
				phi = 2 * Math.PI * nji;
				
				xyzCalculation( south_north );
				
				posIdx = ( verticesSum + j ) * 3;
				
				g.vertices[ posIdx ] = x;		
				g.vertices[ posIdx + 1 ] = y;
				g.vertices[ posIdx + 2 ] = z;
							
			}
			
			verticesSum += i * wed;
			
		}
			
		g.attributes.position.needsUpdate = true;
		//g.attributes.normal.needsUpdate = true;
		
		// vertex positions south hemisphere
			
		if ( g.bottomCircle < eqt ) {
			
			verticesSum = g.withBottom ? 1 : 0;
			
			if ( g.bottomCircle === 0 && !g.withBottom ) {
			
				setPoleVertex( SOUTH );
								
			}
						
			for ( var i = ( g.bottomCircle === 0) ? 1 : g.bottomCircle; i <= Math.min( eqt, g.topCircle ); i ++ ) {
				
				setVertex( SOUTH );	
												
			}
			
			if ( g.withBottom && g.bottomCircle !== 0) {
				
				// uses vertices: after setVertex()
						
				var iMax = g.bottomCircle * wed;
				
				xx = 0;
				yy = 0;
				zz = 0;
				
				posIdx = 0;
										
				for ( var i = 1, p = posIdx + 3; i <= iMax; i ++, p += 3 ) {
										
					xx += g.vertices[ p ];		
					yy += g.vertices[ p + 1 ];
					zz += g.vertices[ p + 2 ];
										
				}
						
				g.vertices[ posIdx ] = xx / ( g.bottomCircle * wed );		
				g.vertices[ posIdx + 1 ] = yy / ( g.bottomCircle * wed );
				g.vertices[ posIdx + 2 ] = zz / ( g.bottomCircle * wed );
																
			}
			
			if ( g.topCircle <= eqt && g.withTop ) {
				
				// uses vertices: after setVertex()
						
				var iMax = g.topCircle * wed;
				
				xx = 0;
				yy = 0;
				zz = 0;
				
				posIdx = g.vertexNorthOffset * 3 - 3;
				
				for ( var i = 1, p = posIdx - 3; i <= iMax; i ++, p -= 3 ) {
					
					xx += g.vertices[ p ];		
					yy += g.vertices[ p + 1 ];
					zz += g.vertices[ p + 2 ];
										
				}
					
				g.vertices[ posIdx ] = xx / ( g.topCircle * wed );		
				g.vertices[ posIdx + 1 ] = yy / ( g.topCircle * wed );
				g.vertices[ posIdx + 2 ] = zz / ( g.topCircle * wed );
															
			}
					
		}
		
		// vertex positions north hemisphere
		
		if ( g.topCircle > eqt  ) {
		
			verticesSum = g.withTop ? g.vertexNorthOffset + 1 : g.vertexNorthOffset;
			
			if ( g.topCircle === eqt * 2 && !g.withTop ) { 
				
				setPoleVertex( NORTH );			
				
			}
			
			for ( var i = eqt * 2 - g.topCircle; i <= Math.min( eqt, eqt * 2 - g.bottomCircle ); i ++ ) {
				
				setVertex( NORTH );
							
			}
			
			if ( g.withTop && g.topCircle !== eqt * 2) {
				
				// uses vertices: after setVertex()
				
				var iMax = ( eqt * 2 - g.topCircle ) * wed;
				
				xx = 0;
				yy = 0;
				zz = 0;
				
				posIdx = g.vertexNorthOffset * 3;
								
				for ( var i = 1, p = posIdx + 3; i <= iMax; i ++, p += 3 ) {
						
					xx += g.vertices[ p ];		
					yy += g.vertices[ p + 1 ];
					zz += g.vertices[ p + 2 ];
										
				}
				
				g.vertices[ posIdx ] = xx / ( ( eqt * 2 - g.topCircle ) * wed );		
				g.vertices[ posIdx + 1 ] = yy / ( ( eqt * 2 - g.topCircle ) * wed );
				g.vertices[ posIdx + 2 ] = zz / ( ( eqt * 2 - g.topCircle ) * wed );
				
			}
			
			if ( g.bottomCircle >= eqt && g.withBottom ) {
				
				// uses vertices: after setVertex()
					
				var iMax = ( eqt * 2 - g.bottomCircle ) * wed;
				
				xx = 0;
				yy = 0;
				zz = 0;
				
				posIdx = g.vertexTotal * 3 - 3;
				
				for ( var i = 1, p = posIdx - 3; i <= iMax; i ++, p -= 3 ) {
					
					xx += g.vertices[ p ];		
					yy += g.vertices[ p + 1 ];
					zz += g.vertices[ p + 2 ];
										
				}
					
				g.vertices[ posIdx ] = xx / ( ( eqt * 2 - g.bottomCircle ) * wed );		
				g.vertices[ posIdx + 1 ] = yy / ( ( eqt * 2 - g.bottomCircle ) * wed );
				g.vertices[ posIdx + 2 ] = zz / ( ( eqt * 2 - g.bottomCircle ) * wed );
													
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