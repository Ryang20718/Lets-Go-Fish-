window.Vec = window.tiny_graphics.Vec =
class Vec extends Float32Array        // Vectors of floating point numbers.  This puts vector math into JavaScript.

{ copy        () { return Vec.from( this )                                }
  equals     (b) { return this.every( (x,i) => x == b[i]                ) }
  plus       (b) { return this.map(   (x,i) => x +  b[i]                ) }
  minus      (b) { return this.map(   (x,i) => x -  b[i]                ) }
  mult_pairs (b) { return this.map(   (x,i) => x *  b[i]                ) }
  scale      (s) { this.forEach(  (x, i, a) => a[i] *= s                ) }
  times      (s) { return this.map(       x => s*x                      ) }
  randomized (s) { return this.map(       x => x + s*(Math.random()-.5) ) }
  mix     (b, s) { return this.map(   (x,i) => (1-s)*x + s*b[i]         ) }
  norm        () { return Math.sqrt( this.dot( this )                   ) }
  normalized  () { return this.times( 1/this.norm()                     ) }
  normalize   () {        this.scale( 1/this.norm()                     ) }
  dot(b)                                     // Optimized arithmetic unrolls loops for array lengths less than 4.
  { if( this.length == 3 ) return this[0]*b[0] + this[1]*b[1] + this[2]*b[2];
    if( this.length == 4 ) return this[0]*b[0] + this[1]*b[1] + this[2]*b[2] + this[3]*b[3];
    if( this.length >  4 ) return this.reduce( ( acc, x, i ) => { return acc + x*b[i]; }, 0 );
    return this[0]*b[0] + this[1]*b[1];                           // Assume a minimum length of 2.
  }                                       
  static cast( ...args ) { return args.map( x => Vec.from(x) ); } // For avoiding repeatedly typing Vec.of in lists.
  to3()          { return Vec.of( this[0], this[1], this[2]           ); }
  to4( isPoint ) { return Vec.of( this[0], this[1], this[2], +isPoint ); }
  cross(b) { return Vec.of( this[1]*b[2] - this[2]*b[1], this[2]*b[0] - this[0]*b[2], this[0]*b[1] - this[1]*b[0] ); }
  to_string() { return "[vec " + this.join( ", " ) + "]" }
}


window.Mat = window.tiny_graphics.Mat =
class Mat extends Array                         // M by N matrices of floats.  Enables matrix and vector math.  Usage:

{ constructor  ( ...args ) { super(0); this.push( ...args ) }
  set_identity ( m, n )    { this.length = 0; for( let i = 0; i < m; i++ ) { this.push( Array(n).fill(0) ); if( i < n ) this[i][i] = 1; } }
  sub_block( start, end )  { return Mat.from( this.slice( start[0], end[0] ).map( r => r.slice( start[1], end[1] ) ) ); }
  copy      () { return this.map(      r  => Vec.of ( ...r )                  ) }
  equals   (b) { return this.every( (r,i) => r.every( (x,j) => x == b[i][j] ) ) }
  plus     (b) { return this.map(   (r,i) => r.map  ( (x,j) => x +  b[i][j] ) ) }
  minus    (b) { return this.map(   (r,i) => r.map  ( (x,j) => x -  b[i][j] ) ) }
  transposed() { return this.map(   (r,i) => r.map  ( (x,j) =>   this[j][i] ) ) }
  times    (b)                                                                       
    { const len = b.length;
      if( typeof len  === "undefined" ) return this.map( r => r.map( x => b*x ) );   // Mat * scalar case.
      const len2 = b[0].length;    
      if( typeof len2 === "undefined" )
      { let result = new Vec( this.length );                                         // Mat * Vec case.
        for( let r=0; r < len; r++ ) result[r] = b.dot(this[r]);                      
        return result;
      }
      let result = Mat.from( new Array( this.length ) );
      for( let r = 0; r < this.length; r++ )                                         // Mat * Mat case.
      { result[ r ] = new Array( len2 );
        for( let c = 0, sum = 0; c < len2; c++ )
        { result[ r ][ c ] = 0;
          for( let r2 = 0; r2 < len; r2++ )
            result[ r ][ c ] += this[ r ][ r2 ] * b[ r2 ][ c ];
        }
      }
      return result;
    }
  pre_multiply (b) { const new_value = b.times( this ); this.length = 0; this.push( ...new_value ); return this; }
  post_multiply(b) { const new_value = this.times( b ); this.length = 0; this.push( ...new_value ); return this; }
  static flatten_2D_to_1D( M )
    { let index = 0, floats = new Float32Array( M.length && M.length * M[0].length );
      for( let i = 0; i < M.length; i++ ) for( let j = 0; j < M[i].length; j++ ) floats[ index++ ] = M[i][j];
      return floats;
    }
  to_string() { return "[" + this.map( (r,i) => "[" + r.join(", ") + "]" ).join(" ") + "]" }
}


window.Mat4 = window.tiny_graphics.Mat4 =
class Mat4 extends Mat                               // Generate special 4x4 matrices that are useful for graphics.
{ static identity()       { return Mat.of( [ 1,0,0,0 ], [ 0,1,0,0 ], [ 0,0,1,0 ], [ 0,0,0,1 ] ); };
  static rotation( angle, axis )                                                    // Requires a scalar (angle) and a 3x1 Vec (axis)
                          { let [ x, y, z ] = Vec.from( axis ).normalized(), 
                                   [ c, s ] = [ Math.cos( angle ), Math.sin( angle ) ], omc = 1.0 - c;
                            return Mat.of( [ x*x*omc + c,   x*y*omc - z*s, x*z*omc + y*s, 0 ],
                                           [ x*y*omc + z*s, y*y*omc + c,   y*z*omc - x*s, 0 ],
                                           [ x*z*omc - y*s, y*z*omc + x*s, z*z*omc + c,   0 ],
                                           [ 0,             0,             0,             1 ] );
                          }
  static scale( s )       { return Mat.of( [ s[0], 0,    0,    0 ],                 // Requires a 3x1 Vec.
                                           [ 0,    s[1], 0,    0 ],
                                           [ 0,    0,    s[2], 0 ],
                                           [ 0,    0,    0,    1 ] );
                          }
  static translation( t ) { return Mat.of( [ 1, 0, 0, t[0] ],                       // Requires a 3x1 Vec.
                                           [ 0, 1, 0, t[1] ],
                                           [ 0, 0, 1, t[2] ],
                                           [ 0, 0, 0,   1  ] );
                          }                      
  
  // it to point the basis of any *object* towards anything but you must re-invert it first.  Each input must be 3x1 Vec.                         
  static look_at( eye, at, up ) { let z = at.minus( eye ).normalized(),
                                      x =  z.cross( up  ).normalized(),        // Compute vectors along the requested coordinate axes.
                                      y =  x.cross( z   ).normalized();        // This is the "updated" and orthogonalized local y axis.
                            if( !x.every( i => i==i ) )                  // Check for NaN, indicating a degenerate cross product, which
                              throw "Two parallel vectors were given";   // happens if eye == at, or if at minus eye is parallel to up.
                            z.scale( -1 );                               // Enforce right-handed coordinate system.                                   
                            return Mat4.translation([ -x.dot( eye ), -y.dot( eye ), -z.dot( eye ) ])
                                   .times( Mat.of( x.to4(0), y.to4(0), z.to4(0), Vec.of( 0,0,0,1 ) ) );
                          }
  static orthographic( left, right, bottom, top, near, far )                        // Box-shaped view volume for projection.
                          { return    Mat4.scale( Vec.of( 1/(right - left), 1/(top - bottom), 1/(far - near) ) )
                              .times( Mat4.translation( Vec.of( -left - right, -top - bottom, -near - far ) ) )
                              .times( Mat4.scale( Vec.of( 2, 2, -2 ) ) );
                          }
  static perspective( fov_y, aspect, near, far )                                    // Frustum-shaped view volume for projection.
                          { const f = 1/Math.tan( fov_y/2 ), d = far - near;
                            return Mat.of( [ f/aspect, 0,               0,               0 ],
                                           [ 0,        f,               0,               0 ],
                                           [ 0,        0, -(near+far) / d, -2*near*far / d ],
                                           [ 0,        0,              -1,               0 ] );
                          }
  static inverse( m )              // Computing a 4x4 inverse is slow because of the amount of steps; call fewer times when possible.
    { const result = Mat4.identity(), m00 = m[0][0], m01 = m[0][1], m02 = m[0][2], m03 = m[0][3],
                                      m10 = m[1][0], m11 = m[1][1], m12 = m[1][2], m13 = m[1][3],
                                      m20 = m[2][0], m21 = m[2][1], m22 = m[2][2], m23 = m[2][3],
                                      m30 = m[3][0], m31 = m[3][1], m32 = m[3][2], m33 = m[3][3];
      result[ 0 ][ 0 ] = m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33;
      result[ 0 ][ 1 ] = m03 * m22 * m31 - m02 * m23 * m31 - m03 * m21 * m32 + m01 * m23 * m32 + m02 * m21 * m33 - m01 * m22 * m33;
      result[ 0 ][ 2 ] = m02 * m13 * m31 - m03 * m12 * m31 + m03 * m11 * m32 - m01 * m13 * m32 - m02 * m11 * m33 + m01 * m12 * m33;
      result[ 0 ][ 3 ] = m03 * m12 * m21 - m02 * m13 * m21 - m03 * m11 * m22 + m01 * m13 * m22 + m02 * m11 * m23 - m01 * m12 * m23;
      result[ 1 ][ 0 ] = m13 * m22 * m30 - m12 * m23 * m30 - m13 * m20 * m32 + m10 * m23 * m32 + m12 * m20 * m33 - m10 * m22 * m33;
      result[ 1 ][ 1 ] = m02 * m23 * m30 - m03 * m22 * m30 + m03 * m20 * m32 - m00 * m23 * m32 - m02 * m20 * m33 + m00 * m22 * m33;
      result[ 1 ][ 2 ] = m03 * m12 * m30 - m02 * m13 * m30 - m03 * m10 * m32 + m00 * m13 * m32 + m02 * m10 * m33 - m00 * m12 * m33;
      result[ 1 ][ 3 ] = m02 * m13 * m20 - m03 * m12 * m20 + m03 * m10 * m22 - m00 * m13 * m22 - m02 * m10 * m23 + m00 * m12 * m23;
      result[ 2 ][ 0 ] = m11 * m23 * m30 - m13 * m21 * m30 + m13 * m20 * m31 - m10 * m23 * m31 - m11 * m20 * m33 + m10 * m21 * m33;
      result[ 2 ][ 1 ] = m03 * m21 * m30 - m01 * m23 * m30 - m03 * m20 * m31 + m00 * m23 * m31 + m01 * m20 * m33 - m00 * m21 * m33;
      result[ 2 ][ 2 ] = m01 * m13 * m30 - m03 * m11 * m30 + m03 * m10 * m31 - m00 * m13 * m31 - m01 * m10 * m33 + m00 * m11 * m33;
      result[ 2 ][ 3 ] = m03 * m11 * m20 - m01 * m13 * m20 - m03 * m10 * m21 + m00 * m13 * m21 + m01 * m10 * m23 - m00 * m11 * m23;
      result[ 3 ][ 0 ] = m12 * m21 * m30 - m11 * m22 * m30 - m12 * m20 * m31 + m10 * m22 * m31 + m11 * m20 * m32 - m10 * m21 * m32;
      result[ 3 ][ 1 ] = m01 * m22 * m30 - m02 * m21 * m30 + m02 * m20 * m31 - m00 * m22 * m31 - m01 * m20 * m32 + m00 * m21 * m32;
      result[ 3 ][ 2 ] = m02 * m11 * m30 - m01 * m12 * m30 - m02 * m10 * m31 + m00 * m12 * m31 + m01 * m10 * m32 - m00 * m11 * m32;
      result[ 3 ][ 3 ] = m01 * m12 * m20 - m02 * m11 * m20 + m02 * m10 * m21 - m00 * m12 * m21 - m01 * m10 * m22 + m00 * m11 * m22;
                                                                                               // Divide by determinant and return.
      return result.times( 1/( m00*result[0][0] + m10*result[0][1] + m20*result[0][2] + m30*result[0][3] ) );
    }
}


window.Keyboard_Manager = window.tiny_graphics.Keyboard_Manager =
class Keyboard_Manager     // This class maintains a running list of which keys are depressed.  You can map combinations of shortcut
  {    

    constructor( target = document, callback_behavior = ( callback, event ) => callback( event ) )
      { this.saved_controls = {};     
        this.actively_pressed_keys = new Set();
        this.callback_behavior = callback_behavior;
        target.addEventListener( "keydown",     this.key_down_handler.bind( this ) );
        target.addEventListener( "keyup",       this.  key_up_handler.bind( this ) );
        window.addEventListener( "focus", () => this.actively_pressed_keys.clear() );  // Deal with stuck keys during focus change.
      }
    key_down_handler( event )
      { if( [ "INPUT", "TEXTAREA" ].includes( event.target.tagName ) ) return;    // Don't interfere with typing.
        this.actively_pressed_keys.add( event.key );                              // Track the pressed key.
        for( let saved of Object.values( this.saved_controls ) )                  // Re-check all the keydown handlers.
        { if( saved.shortcut_combination.every( s => this.actively_pressed_keys.has( s ) )
            && event. ctrlKey   == saved.shortcut_combination.includes( "Control" )
            && event.shiftKey   == saved.shortcut_combination.includes( "Shift" )
            && event.  altKey   == saved.shortcut_combination.includes( "Alt" )
            && event. metaKey   == saved.shortcut_combination.includes( "Meta" ) )  // Modifiers must exactly match.
              this.callback_behavior( saved.callback, event );                      // The keys match, so fire the callback.
        }
      }
    key_up_handler( event )
      { const lower_symbols = "qwertyuiopasdfghjklzxcvbnm1234567890-=[]\\;',./",
              upper_symbols = "QWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*()_+{}|:\"<>?";
        
        const lifted_key_symbols = [ event.key, upper_symbols[ lower_symbols.indexOf( event.key ) ],
                                                lower_symbols[ upper_symbols.indexOf( event.key ) ] ];
                                                                                          // Call keyup for any shortcuts 
        for( let saved of Object.values( this.saved_controls ) )                          // that depended on the released
          if( lifted_key_symbols.some( s => saved.shortcut_combination.includes( s ) ) )  // key or its shift-key counterparts.
            this.callback_behavior( saved.keyup_callback, event );                  // The keys match, so fire the callback.
        lifted_key_symbols.forEach( k => this.actively_pressed_keys.delete( k ) );
      }

    add( shortcut_combination, callback = () => {}, keyup_callback = () => {} )
      { this.saved_controls[ shortcut_combination.join('+') ] = { shortcut_combination, callback, keyup_callback }; }
  }


window.Vertex_Buffer = window.tiny_graphics.Vertex_Buffer =
class Vertex_Buffer           // To use Vertex_Buffer, make a subclass of it that overrides the constructor and fills in the right fields.  
{                             // Vertex_Buffer organizes data related to one 3D shape and copies it into GPU memory.  That data is broken

  constructor( ...array_names )                          // This superclass constructor expects a list of names of arrays that you plan for
    { this.array_names = array_names;                    // your subclass to fill in and associate with the vertices.
      for( let n of array_names ) this[n] = [];          // Initialize a blank array member of the Shape with each of the names provided.
      this.indices = [];
      this.indexed = true;                  // By default all shapes assume indexed drawing using drawElements().
      this.array_names_mapping_to_WebGLBuffers = {};     // Get ready to associate a GPU buffer with each array.
    }
  copy_onto_graphics_card( gl, selection_of_arrays = this.array_names, write_to_indices = true )
    {                                        // Send the completed vertex and index lists to their own buffers in the graphics card.
      for( let n of selection_of_arrays )    // Optional arguments allow calling this again to overwrite some or all GPU buffers as needed.
        { let buffer = this.array_names_mapping_to_WebGLBuffers[n] = gl.createBuffer();
          gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
          gl.bufferData( gl.ARRAY_BUFFER, Mat.flatten_2D_to_1D( this[n] ), gl.STATIC_DRAW );
        }
      if( this.indexed && write_to_indices )
      { gl.getExtension( "OES_element_index_uint" );          // Load an extension to allow shapes with more 
        this.index_buffer = gl.createBuffer();                // vertices than type "short" can hold.
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint32Array( this.indices ), gl.STATIC_DRAW );
      }
      this.gl = gl;
    }
  execute_shaders( gl, type )     // Draws this shape's entire vertex buffer.
    { if( this.indexed )
      { gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );                          
        gl.drawElements( this.gl[type], this.indices.length, gl.UNSIGNED_INT, 0 ) 
      }                                                               // If no indices were provided, assume the vertices are arranged
      else  gl.drawArrays( this.gl[type], 0, this.positions.length );          // as triples of positions in a field called "positions".
    }
  draw( graphics_state, model_transform, material, type = "TRIANGLES", gl = this.gl )        // To aty
    { if( !this.gl ) throw "This shape's arrays are not copied over to graphics card yet.";  // goes through this draw() function, which
      material.shader.activate();                                                            // e  The shaders
      material.shader.update_GPU( graphics_state, model_transform, material );               // draw the right shape due to pre-selecting
                                                                                             // the correct buffer region in the GPU that
      for( let [ attr_name, attribute ] of Object.entries( material.shader.g_addrs.shader_attributes ) )  // holds that shape's data.
      { const buffer_name = material.shader.map_attribute_name_to_buffer_name( attr_name )
        if( !buffer_name || !attribute.enabled )
          { if( attribute.index >= 0 ) gl.disableVertexAttribArray( attribute.index );
            continue;
          }
        gl.enableVertexAttribArray( attribute.index );
        gl.bindBuffer( gl.ARRAY_BUFFER, this.array_names_mapping_to_WebGLBuffers[ buffer_name ] ); // Activate the correct buffer.
        gl.vertexAttribPointer( attribute.index, attribute.size, attribute.type,                   // Populate each attribute 
                                attribute.normalized, attribute.stride, attribute.pointer );       // from the active buffer.
      }
      this.execute_shaders( gl, type );                                                // Run the shaders to draw every triangle now.
    }                                                                  
}


window.Shape = window.tiny_graphics.Shape =
class Shape extends Vertex_Buffer
{          
    
    

  static insert_transformed_copy_into( recipient, args, points_transform = Mat4.identity() )    // For building compound shapes.
    { const temp_shape = new this( ...args );  // If you try to bypto
                                               // the reifferent depths.
      recipient.indices.push( ...temp_shape.indices.map( i => i + recipient.positions.length ) );
      
      for( let a of temp_shape.array_names )            // Copy 
      { if( a == "positions" )                          // Apply points_transform to all points added during this call:
          recipient[a].push( ...temp_shape[a].map( p => points_transform.times( p.to4(1) ).to3() ) );
        else if( a == "normals" )                       // Do the same for normals, but use the inverse transpose matrix as math requires:
          recipient[a].push( ...temp_shape[a].map( n => Mat4.inverse( points_transform.transposed() ).times( n.to4(1) ).to3() ) );
        else recipient[a].push( ...temp_shape[a] );     // All other arrays get copied in unmodified.
      }
    }
  make_flat_shaded_version()                            // Auto-generate a new class that re-uses any Shape's points, 
    { return class extends this.constructor             // but with new normals generated from flat shading.
      { constructor( ...args ) { super( ...args );  this.duplicate_the_shared_vertices();  this.flat_shade(); }
        duplicate_the_shared_vertices()
          {   //  Prepare an indexed shape for flat shading if it is not ready -- that is, if there are any edges where 
            const temp_positions = [], temp_tex_coords = [], temp_indices = [];
            for( let [i, it] of this.indices.entries() )
              { temp_positions.push( this.positions[it] );  temp_tex_coords.push( this.texture_coords[it] );  temp_indices.push( i ); }
            this.positions =  temp_positions;       this.indices = temp_indices;    this.texture_coords = temp_tex_coords;
          }
        flat_shade()                // Automatically assign the correct normals to each triangular element to achieve flat shading.
          {                         // Affect all rece
            this.indexed = false;   // vertices are shared across seams.   First, iterate through the index or position triples:
            for( let counter = 0; counter < (this.indexed ? this.indices.length : this.positions.length); counter += 3 )
            { const indices = this.indexed ? [ this.indices[ counter ], this.indices[ counter + 1 ], this.indices[ counter + 2 ] ] : 
                                           [ counter, counter + 1, counter + 2 ];
              const [ p1, p2, p3 ] = indices.map( i => this.positions[ i ] );
              const n1 = p1.minus(p2).cross( p3.minus(p1) ).normalized();    // Cross the two edge vectors of this
                                                                             // triangle together to get its normal.
               if( n1.times(.1).plus(p1).norm() < p1.norm() ) n1.scale(-1);  // Flip the normal if adding it to the 
                                                                             // t
              for( let i of indices ) this.normals[ i ] = Vec.from( n1 );    // Propagate this normal to the 3 vertices.
            }
          }
      }
    }
  normalize_positions( keep_aspect_ratios = true )
    { const average_position = this.positions.reduce( (acc,p) => acc.plus( p.times( 1/this.positions.length ) ), Vec.of( 0,0,0 ) );
      this.positions = this.positions.map( p => p.minus( average_position  ) );           // Center the point cloud on the origin.
      const average_lengths  = this.positions.reduce( (acc,p) => 
                                         acc.plus( p.map( x => Math.abs(x) ).times( 1/this.positions.length ) ), Vec.of( 0,0,0 ) );
      if( keep_aspect_ratios )                            // Divide each axis by its average distance from the origin.
        this.positions = this.positions.map( p => p.map( (x,i) => x/average_lengths[i] ) );    
      else
        this.positions = this.positions.map( p => p.times( 1/average_lengths.norm() ) );
    }
}


window.Graphics_State = window.tiny_graphics.Graphics_State =
class Graphics_State                                            
{ constructor( camera_transform = Mat4.identity(), projection_transform = Mat4.identity() ) 
    { Object.assign( this, { camera_transform, projection_transform, animation_time: 0, animation_delta_time: 0, lights: [] } ); }
}

window.Light = window.tiny_graphics.Light =
class Light                                                     // The properties of one light in the scene (Two 4x1 Vecs and a scalar)
{ constructor( position, color, size ) { Object.assign( this, { position, color, attenuation: 1/size } ); }  };

window.Color = window.tiny_graphics.Color =
class Color extends Vec { }    // Just an alias.  Colors are special 4x1 vectors expressed as ( red, green, blue, opacity ) each from 0 to 1.

window.Graphics_Addresses = window.tiny_graphics.Graphics_Addresses =
class Graphics_Addresses    // For organizing communication with the GPU for Shaders.  Now that we've compiled the Shader, we can query 
{                           // some things about the compiled program, such as the memory addresses it will use for uniform variables, 
                            // and the types and indices of its per-vertex attributes.  We'll need those for building vertex buffers.
  constructor( program, gl )
  { const num_uniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < num_uniforms; ++i)
      { let u = gl.getActiveUniform(program, i).name.split('[')[0];    // Retrieve the GPU addresses of each uniform variable in the shader
        this[ u + "_loc" ] = gl.getUniformLocation( program, u );      // based on their names, and store these pointers for later.
      }
    
    this.shader_attributes = {};                // Assume per-vertex attributes will each be a set of 1 to 4 floats:
    const type_to_size_mapping = { 0x1406: 1, 0x8B50: 2, 0x8B51: 3, 0x8B52: 4 };
    const numAttribs = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES ); 
    for ( let i = 0; i < numAttribs; i++ )      // https://github.com/greggman/twgl.js/blob/master/dist/twgl-full.js for another example.
    { const attribInfo = gl.getActiveAttrib( program, i );
      this.shader_attributes[ attribInfo.name ] = { index: gl.getAttribLocation( program, attribInfo.name ),  // Pointers to all shader
                                                    size: type_to_size_mapping[ attribInfo.type ],            // attribute variables
                                                    enabled: true, type: gl.FLOAT,
                                                    normalized: false, stride: 0, pointer: 0 };
    } 
  }
}


window.Shader = window.tiny_graphics.Shader =
class Shader                   // Your subclasses of Shader will manage strings of GLSL code that will be sent to the GPU and will run, to
{ constructor( gl )            // draw every shape.  Extend the class and fill in the abstract functions; the constructor needs them.
    { Object.assign( this, { gl, program: gl.createProgram() } );
      const shared = this.shared_glsl_code() || "";
      
      const vertShdr = gl.createShader( gl.VERTEX_SHADER );
      gl.shaderSource( vertShdr, shared + this.vertex_glsl_code() );
      gl.compileShader( vertShdr );
      if( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS)    ) throw "Vertex shader compile error: "   + gl.getShaderInfoLog( vertShdr );

      const fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
      gl.shaderSource( fragShdr, shared + this.fragment_glsl_code() );
      gl.compileShader( fragShdr );
      if( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS)    ) throw "Fragment shader compile error: " + gl.getShaderInfoLog( fragShdr );

      gl.attachShader( this.program, vertShdr );
      gl.attachShader( this.program, fragShdr );
      gl.linkProgram(  this.program );
      if( !gl.getProgramParameter( this.program, gl.LINK_STATUS) ) throw "Shader linker error: "           + gl.getProgramInfoLog( 
                                                                                                                              this.program );
      this.g_addrs = new Graphics_Addresses( this.program, this.gl );
    }
    activate() { this.gl.useProgram( this.program ); }                    // You have to override the following five functions:
    material(){}  update_GPU(){}  shared_glsl_code(){}  vertex_glsl_code(){}  fragment_glsl_code(){}
}


window.Texture = window.tiny_graphics.Texture =
class Texture                                // The Texture class wraps a pointer to a new texture buffer along with a new HTML image object.
{ constructor(             gl, filename, use_mipMap = true, bool_will_copy_to_GPU = true )
    { Object.assign( this, {   filename, use_mipMap,        bool_will_copy_to_GPU,       id: gl.createTexture() } );

      gl.bindTexture(gl.TEXTURE_2D, this.id );
      gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([255, 0, 0, 255]));    // A single red pixel, as a placeholder image to prevent a console warning.
      this.image          = new Image();
      this.image.onload   = () =>                         // Instructions for whenever the real image file is ready
        { gl.pixelStorei  ( gl.UNPACK_FLIP_Y_WEBGL, bool_will_copy_to_GPU );
          gl.bindTexture  ( gl.TEXTURE_2D, this.id );
          gl.texImage2D   ( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image );
          gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );  // 
                                                                                // 
          if( use_mipMap )                                                      // 
            { gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.generateMipmap(gl.TEXTURE_2D); }
          else                                                                        // 
              gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );   // 
          this.loaded = true;
        }
      if( bool_will_copy_to_GPU )                                               // 
        { this.image.crossOrigin = "Anonymous"; this.image.src = this.filename; }
    }
}


window.Webgl_Manager = window.tiny_graphics.Webgl_Manager =
class Webgl_Manager      // This class manages a whole graphics program for one on-page canvas, including its textures, shapes, shaders,
{                        // and scenes.  In addition to requesting a WebGL context and storing the aforementioned items, it informs the
                         
  constructor( canvas, background_color, dimensions )
    { let gl, demos = [];
      Object.assign( this, { instances: new Map(), shapes_in_use: {}, scene_components: [], prev_time: 0, canvas,
                             globals: { animate: true, graphics_state: new Graphics_State() } } );
      
      for ( let name of [ "webgl", "experimental-webgl", "webkit-3d", "moz-webgl" ] )   // Get the GPU ready, creating a new WebGL context
        if (  gl = this.gl = this.canvas.getContext( name ) ) break;                    // for this canvas.
      if   ( !gl ) throw "Canvas failed to make a WebGL context.";
      
      this.set_size( dimensions );
      gl.clearColor.apply( gl, background_color );    // Tell the GPU which color to clear the canvas with each frame.
      gl.enable( gl.DEPTH_TEST );   gl.enable( gl.BLEND );            
      gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );           
                                                                      
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture() ); // A single red pixel, as a placeholder image to prevent a console warning:
      gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
         
      window.requestAnimFrame = ( w =>                                    
           w.requestAnimationFrame    || w.webkitRequestAnimationFrame    // needed for queue-ing up re-display events:
        || w.mozRequestAnimationFrame || w.oRequestAnimationFrame || w.msRequestAnimationFrame
        || function( callback, element ) { w.setTimeout(callback, 1000/60);  } )( window );
    }
  set_size( dimensions = [ 1080, 600 ] )               
    { const [ width, height ] = dimensions;             
      this.canvas.style[ "width" ]  =  width + "px";    // and then change the size in canvas attributes.
      this.canvas.style[ "height" ] = height + "px";     
      Object.assign( this,        { width, height } );   // Have to assign to both; these attributes on a canvas 
      Object.assign( this.canvas, { width, height } );   // 
      this.gl.viewport( 0, 0, width, height );           // 
    }                                                    // 
  get_instance( shader_or_texture )                 // 
    { if( this.instances[ shader_or_texture ] )     // e first.
        return this.instances[ shader_or_texture ];     // Return the one that already is loaded if it exists.  Otherwise,
      if( typeof shader_or_texture == "string" )        // If a ter.
        return this.instances[ shader_or_texture ] = new Texture( this.gl, ...arguments );  // Or if it's a shader:
      return   this.instances[ shader_or_texture ] = new ( shader_or_texture )( this.gl );  // Compile it and put it on the GPU.
    }
  register_scene_component( component )     // Allow a Scene_Component to show their control panel and enter the event loop.
    { this.scene_components.unshift( component );  component.make_control_panel( component.controls );
    }
  render( time=0 )                                                // Animate shapes based upon how much measured real time has transpired.
    {                            this.globals.graphics_state.animation_delta_time = time - this.prev_time;
      if( this.globals.animate ) this.globals.graphics_state.animation_time      += this.globals.graphics_state.animation_delta_time;
      this.prev_time = time;

      this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);        // Clear the canvas's pixels and z-buffer.
     
      for( let live_string of document.querySelectorAll(".live_string") ) live_string.onload( live_string );
      for ( let s of this.scene_components ) s.display( this.globals.graphics_state );            // Draw each registered animation.
      this.event = window.requestAnimFrame( this.render.bind( this ) );   // Now that this frame is drawn, request that render() happen 
    }                                                                     // again as soon as all other web page events are processed.
}

window.Scene_Component = window.tiny_graphics.Scene_Component =
class Scene_Component       // The Scene_Component superclass is the base class for any scene part or code snippet that you can add to a
{                           // c_control_panel()"
                            // to make them do something.  Finally, push them onto your Webgl_Manager's "scene_components" array.
  constructor( webgl_manager, control_box )
    { const callback_behavior = ( callback, event ) => 
           { callback( event );
             event.preventDefault();    // Fire the callback and cancel any default browser shortcut that is an exact match.
             event.stopPropagation();   // Don't bubble the event to parent nodes; let child elements be targetted in isolation.
           }
      Object.assign( this, { key_controls: new Keyboard_Manager( document, callback_behavior), globals: webgl_manager.globals } );
      control_box.appendChild( Object.assign( document.createElement("div"), { textContent: this.constructor.name, className: "control-title" } ) )
      this.control_panel = control_box.appendChild( document.createElement( "div" ) );
      this.control_panel.className = "control-div";        
    }
  new_line( parent=this.control_panel ) { parent.appendChild( document.createElement( "br" ) ) }    // Format a scene's control panel.
  live_string( callback, parent=this.control_panel )    // Create an element somewhere in the control panel that does reporting of the
    {                                                   // scene's values in real time.  The event loop will constantly update all HTML 
                                                        // elements made this way.
      parent.appendChild( Object.assign( document.createElement( "div"  ), { className:"live_string", onload: callback } ) );
    }
  key_triggered_button( description, shortcut_combination, callback, color = '#'+Math.random().toString(9).slice(-6), 
                        release_event, recipient = this, parent = this.control_panel )      // Trigger any scene behavior by assigning a key
    { const button = parent.appendChild( document.createElement( "button" ) );              // shortcut and a labelled HTML button to it.
      button.default_color = button.style.backgroundColor = color;
      const  press = () => { Object.assign( button.style, { 'background-color' : 'red', 
                                                            'z-index': "1", 'transform': "scale(2)" } );
                             callback.call( recipient );
                           },
           release = () => { Object.assign( button.style, { 'background-color' : button.default_color, 
                                                            'z-index': "0", 'transform': "scale(1)" } );
                             if( !release_event ) return;
                             release_event.call( recipient );
                           };
      const key_name = shortcut_combination.join( '+' ).split( " " ).join( "Space" );
      button.textContent = "(" + key_name + ") " + description;
      button.addEventListener( "mousedown" , press );
      button.addEventListener( "mouseup",  release );
      button.addEventListener( "touchstart", press, { passive: true } );
      button.addEventListener( "touchend", release, { passive: true } );
      if( !shortcut_combination ) return;
      this.key_controls.add( shortcut_combination, press, release );
    }
  submit_shapes( webgl_manager, shapes )            // Call this to start using a sehapes.  It ensures that this scene as well as the
                                                    // Webgl_Manager has pointewhen needed.  It also loads each shape onto
    { if( !this.shapes ) this.shapes = {};          // 
      for( let s in shapes )                        // a scene by calling "this.ahapes".
        { if( webgl_manager.shapes_in_use[s] )                 // If two scenes give any shape the same name as an existing one, the
            this.shapes[s] = webgl_manager.shapes_in_use[s];   // existing one is used instead and the new shape is thrown out.
          else this.shapes[s] = webgl_manager.shapes_in_use[s] = shapes[s];
          this.shapes[s].copy_onto_graphics_card( webgl_manager.gl );
        }
    }                                                          // You have to override the following functions to use class Scene_Component.
  make_control_panel(){}  display( graphics_state ){}  show_explanation( document_section ){}
}


window.Canvas_Widget = window.tiny_graphics.Canvas_Widget =
class Canvas_Widget                    // Canvas_Widget embeds a WebGL demo onto a website, along with various panels of controls.
{ constructor( element, scenes, show_controls = true )   // One panel exists per each scene that's used in the canvas.  You can use up
    { this.create( element, scenes, show_controls )      // to 16 Canvas_Widgets; browsers support up to 16 WebGL contexts per page.    

      const rules = [ ".canvas-widget { width: 1080px; background: DimGray }",
                      ".canvas-widget * { font-family: monospace }",
                      ".canvas-widget canvas { width: 1080px; height: 600px; margin-bottom:-3px }",
                      ".canvas-widget div { background: white }",
                      ".canvas-widget table { border-collapse: collapse; display:block; overflow-x: auto; }",
                      ".canvas-widget table.control-box { width: 1080px; border:0; margin:0; max-height:380px; transition:.5s; overflow-y:scroll; background:DimGray }",
                      ".canvas-widget table.control-box:hover { max-height:500px }",
                      ".canvas-widget table.control-box td { overflow:hidden; border:0; background:DimGray; border-radius:30px }",
                      ".canvas-widget table.control-box td .control-div { background: #EEEEEE; height:338px; padding: 5px 5px 5px 30px; box-shadow: 25px 0px 60px -15px inset }",
                      ".canvas-widget table.control-box td * { background:transparent }",
                      ".canvas-widget table.control-box .control-div td { border-radius:unset }",
                      ".canvas-widget table.control-box .control-title { padding:7px 40px; color:white; background:DarkSlateGray; box-shadow: 25px 0px 70px -15px inset black }",
                      ".canvas-widget *.live_string { display:inline-block; background:unset }",
                      ".dropdown { display:inline-block }",
                      ".dropdown-content { display:inline-block; transition:.2s; transform: scaleY(0); overflow:hidden; position: absolute; \
                                            z-index: 1; background:#E8F6FF; padding: 16px; margin-left:30px; min-width: 100px; \
                                            box-shadow: 5px 10px 16px 0px rgba(0,0,0,0.2) inset; border-radius:10px }",
                      ".dropdown-content a { color: black; padding: 4px 4px; display: block }",
                      ".dropdown a:hover { background: #f1f1f1 }",
                      ".canvas-widget button { background: #4C9F50; color: white; padding: 6px; border-radius:9px; \
                                                box-shadow: 4px 6px 16px 0px rgba(0,0,0,0.3); transition: background .3s, transform .3s }",
                      ".canvas-widget button:hover, button:focus { transform: scale(1.3); color:gold }",
                      ".link { text-decoration:underline; cursor: pointer }",
                      ".show { transform: scaleY(1); height:200px; overflow:auto }",
                      ".hide { transform: scaleY(0); height:0px; overflow:hidden  }" ];
                      
      const style = document.head.appendChild( document.createElement( "style" ) );
      for( const r of rules ) document.styleSheets[document.styleSheets.length - 1].insertRule( r, 0 )
    }
  create( element, scenes, show_controls )
    { this.patch_ios_bug();
      element = document.querySelector( "#" + element );
      try  { this.populate_canvas( element, scenes, show_controls );
           } catch( error )
           { element.innerHTML = "<H1>Error loading the demo.</H1>" + error }
    }
  patch_ios_bug()                               // Correct a flaw in Webkit (iPhone devices; safari mobile) that 
    { try{ Vec.of( 1,2,3 ).times(2) }           // breaks TypedArray.from() and TypedArray.of() in subclasses.
      catch 
      { Vec.of   = function()      { return new Vec( Array.from( arguments ) ) }
        Vec.from = function( arr ) { return new Vec( Array.from( arr       ) ) }
      }
    }
  populate_canvas( element, scenes, show_controls )   // Assign a Webgl_Manager to the WebGL canvas.
    { if( !scenes.every( x => window[ x ] ) )         // Make sure each scene class really exists.
        throw "(Featured class not found)";
      const canvas = element.appendChild( document.createElement( "canvas" ) );
      const control_panels = element.appendChild( document.createElement( "table" ) );
      control_panels.className = "control-box";      
      if( !show_controls ) control_panels.style.display = "none";
      const row = control_panels.insertRow( 0 );
      this.webgl_manager = new Webgl_Manager( canvas, Color.of( 0,0,0,1 ) );  // Second parameter sets background color.

      for( let scene_class_name of scenes )                  // Register the initially requested scenes to the render loop.
        this.webgl_manager.register_scene_component( new window[ scene_class_name ]( this.webgl_manager, row.insertCell() ) );   
                           
      this.webgl_manager.render();   // Start WebGL initialization.  Note that render() will re-queue itself for more calls.
    }
}

  
window.Code_Manager = window.tiny_graphics.Code_Manager =
class Code_Manager                            // Break up a string containing code (any es6 JavaScript).  The parser expression
{                                             // is from https://github.com/lydell/js-tokens which states the following limitation:
  constructor( code )                         // "If the end of a statement looks like a regex literal (even if it isn’t), it will 
    { const es6_tokens_parser = RegExp( [     // be treated as one."  (This can miscolor lines of code containing divisions and comments).
        /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)/,    // Any string.
        /(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)/,                                                                           // Any comment (2 forms).  And next, any regex:
        /(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))/,
        /(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)/,                                     // Any number.
        /((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)/,                                          // Any name.
        /(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])/,                      // Any punctuator.
        /(\s+)|(^$|[\s\S])/                                                                                                   // Any whitespace. Lastly, blank/invalid.
          ].map( r => r.source ).join('|'), 'g' );

      this.tokens = [];    this.no_comments = [];    let single_token = null;
      while( ( single_token = es6_tokens_parser.exec( code ) ) !== null )
        { let token = { type: "invalid", value: single_token[0] }
               if ( single_token[  1 ] ) token.type = "string" , token.closed = !!( single_token[3] || single_token[4] )
          else if ( single_token[  5 ] ) token.type = "comment"
          else if ( single_token[  6 ] ) token.type = "comment", token.closed = !!single_token[7]
          else if ( single_token[  8 ] ) token.type = "regex"
          else if ( single_token[  9 ] ) token.type = "number"
          else if ( single_token[ 10 ] ) token.type = "name"
          else if ( single_token[ 11 ] ) token.type = "punctuator"
          else if ( single_token[ 12 ] ) token.type = "whitespace"        
          this.tokens.push( token )
          if( token.type != "whitespace" && token.type != "comment" ) this.no_comments.push( token.value );
        }  
    }
}
