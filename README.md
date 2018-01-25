# THREEp.js
---
three.js addon, to produce almost infinite many time-varying Geometries and BufferGeometries with polar / spherical functions

In contrast to THREEf.js, polar / spherical coordinates are used here for the functions.
This results in a different set of properties and functions.

//

@author hofk / http://sandbox.threejs.hofk.de/

see also https://discourse.threejs.org/t/addon-produces-almost-infinite-many-time-varying-geometries-with-functions/262/15

//

Produce almost infinite many time-varying Geometries or BufferGeometries with only 11 properties, 20 functions and 1 array:

````
geometry = new THREE.Geometry();    // base class geometry object from Tthree.js
// or 
geometry = new THREE.BufferGeometry();    // base class buffer-geometry object from three.js

geometry.createMorphGeometry = THREEp.createMorphGeometry;    // insert the methode from THREEp.js

// for non-indexed BufferGeometry set parameter  indexed: false, 

geometry.createMorphGeometry();    // apply the methode ( here without parameters: all default )

mesh = new THREE.Mesh( geometry, materials ); // create a material array: materials
scene.add( mesh );
````
    
    Include: <script src="THREEp.js"></script>
    
__Example:__

````
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
