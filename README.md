# THREEp.js

three.js addon, to produce almost infinite many time-varying Geometries and BufferGeometries with polar / spherical functions

In contrast to THREEf.js, polar / spherical coordinates are used here for the functions.
This results in a different set of properties and functions.

//

@author hofk / http://sandbox.threejs.hofk.de/

see also https://discourse.threejs.org/t/addon-produces-almost-infinite-many-time-varying-geometries-with-functions/262/15

//

Produce almost infinite many time-varying Geometries or BufferGeometries with only 12 properties, 20 functions and 1 array:

```javascript
geometry = new THREE.Geometry();    // base class geometry object from three.js
// or 
geometry = new THREE.BufferGeometry();    // base class buffer-geometry object from three.js

geometry.createMorphGeometry = THREEp.createMorphGeometry;    // insert the methode from THREEp.js

// for non-indexed BufferGeometry set parameter  indexed: false, 

geometry.createMorphGeometry();    // apply the methode ( here without parameters: all default )

mesh = new THREE.Mesh( geometry, materials ); // create a material array: materials
scene.add( mesh );

````
    
Include: <script src="THREEp.js"></script>

---
_90 now contains
explodemode,	// 'center','normal'
---

-----------------------------------------------------------------------------------------------------------------

**Example:**

```javascript
geometry = new THREE.BufferGeometry();

geometry.createMorphGeometry = THREEp.createMorphGeometry;

geometry.createMorphGeometry({

   indexed: false, // default is true
   radius: 25,
   rAzimuthPole: function ( u, v, t ) { return u < 0.5 ? Math.atan( 1.5 * u ) : Math.tan( 0.5 * u ) },
   squeeze: function ( u, t ) { return u },
   materialSouth: function ( u, v, t ) { return  Math.floor( t ) % 20 < 5 ? 0 : 0.8 },
   
});	// Material: min. 9 materials in multi material array!  index: 0.8 * 10 = 8
````
Parameters briefly explained in THREEp.js:

```javascript


/*	parameter overview	--- all parameters are optional ---

p = {
	
		// simple properties
	
	indexed,	// indexed or non indexed BufferGeometry
	radius,		// reference sphere radius, multiplier for functions
	wedges,		// spherical wedges, total
	usedWedges,	// used from total sperical wedges
	wedgeOpen,	// wedge on edge open or closed
	equator,	// half of spherical segments
	bottom,		// south pole is 0
	top,		// max. equator * 2 (is north pole)
	withBottom,	// with a bottom (bottom > 0)
	withTop,	// with a top (top < equator * 2)
	style,		// 'complete', 'relief', 'map'
	explodemode,	// 'center', 'normal'	- only non-indexed BufferGeometry
	
		// functions: u,v and result normally 0 .. 1, otherwise specific / interesting results!
		// u azimuth (start: x axis, counterclockwise)
	
	endPole,	//	function ( u, t )	// end angle ( to equator, per phi)
	startPole,	//	function ( u, t )	// start angle ( from south- or north pole, per phi)
	
		// for hemispheres: v polar (start: pole 0, end: equator 1), t time
	
	stretchSouth,	//	function ( u, v, t )	// stretch / compress south hemisphere in -y direction
	stretchNorth,	//	function ( u, v, t )	// stretch / compress north hemisphere in +y direction
	scalePoleH,	//	function ( v, t )	// scaling hemispheres from pole to equator ( is overwritten by scalePole )
	
		// for sphere: v polar (start: south pole 0, end: north pole 1), t time
		
	scalePole,	//	function ( v, t )	// scaling between start and end of polar angle (theta -PI/2 .. PI/2 )
	rAzimuthPole,	//	function ( u, v, t )	// radius depending on location,
	equatorGap,	//	function ( u, t )	// gap in relation to the radius
	squeeze,	//	function ( u, t )	// 0 sphere to 1 flat circle
	moveX,		//	function ( u, v, t )	// factor for radius, move in x direction 
	moveY,		//	function ( u, v, t )	// factor for radius, move in y direction
	moveZ,		//	function ( v, u, t )	// factor for radius, move in z direction
	explod,		// 	function ( t )		// factor for exploded view (only non indexed BufferGeometry)
	endAzimuth,	//	function ( v, t )	// end azimuth angle phi (per theta)
	startAzimuth,	//	function ( v, t )	// starting azimuth angle phi (per theta)
	scaleAzimuth,	//	function ( u, t )	// scaling between start and end of azimuth angle ( phi 0 .. 2*PI)
  	materialSouth,	//	function ( u, v, t )	// material South
	materialNorth,	//	function ( u, v, t )	// material North
	materialPlane,	//	function ( u, t )	// material of extra south top or north bottom
	materialWedge,	//	function ( v, t )	// material wedge side
						          // material: round( result*10 ) is material index  0 .. 10
	
			// string array (strings of digits) seperated with a ,
	
	fixedMaterial,	//  fixed given material index, overrides materialSouth, materialNorth

*/


```
