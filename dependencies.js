window.Triangle = window.classes.Triangle = class Triangle extends Shape {
    constructor() {
        super("pos", "normals", "texture_coords");
        this.pos = [Vec.of(0, 0, 0), Vec.of(1, 0, 0), Vec.of(0, 1, 0)];
        this.normals = [Vec.of(0, 0, 1), Vec.of(0, 0, 1), Vec.of(0, 0, 1)];
        this.texture_coords = [Vec.of(0, 0), Vec.of(1, 0), Vec.of(0, 1)];
        this.indices = [0, 1, 2];
    }
}

window.Circle = window.classes.Circle = class Circle extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        this.positions.push(...Vec.cast([-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0]));
        this.normals.push(...Vec.cast([0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]));
        this.texture_coords.push(...Vec.cast([0, 0], [2, 0], [0, 2], [2, 2]));
        this.indices.push(0, 1, 2, 1, 3, 2);
    }
}

window.Square = window.classes.Square = class Square extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        this.positions.push(...Vec.cast([-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0]));
        this.normals.push(...Vec.cast([0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]));
        this.texture_coords.push(...Vec.cast([0, 0], [1, 0], [0, 1], [1, 1]));
        this.indices.push(0, 1, 2, 1, 3, 2);
    }
}

window.Custom_Line = window.classes.Custom_Line = class Custom_Line extends Shape {
    constructor(max_size) {
        super("positions", "normals", "texture_coords");
        this.max_size = max_size;
        var line_matrix = Mat4.identity();
        for (var i = 0; i < max_size; i++) {
            Square.insert_transformed_copy_into(this, [], line_matrix);
            line_matrix.post_multiply(Mat4.translation([1.5, 0, 0]));
        }
    }
    set_string(line, gl=this.gl) {
        this.texture_coords = [];
        for (var i = 0; i < this.max_size; i++) {
            var width = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16)
              , height = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16);
            var newLine = 3
              , size = 32
              , sizefloor = size - newLine;
            var lineDimension = size * 16
              , left = (height * size + newLine) / lineDimension
              , top = (width * size + newLine) / lineDimension
              , right = (height * size + sizefloor) / lineDimension
              , bottom = (width * size + sizefloor + 5) / lineDimension;
            this.texture_coords.push(...Vec.cast([left, 1 - bottom], [right, 1 - bottom], [left, 1 - top], [right, 1 - top]));
        }
        this.copy_onto_graphics_card(gl, ["texture_coords"], false);
    }
}

window.Cube = window.classes.Cube = class Cube extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        for (var x = 0; x < 3; x++) {
            for (var y = 0; y < 2; y++) {
                var square_transform = Mat4.rotation(x == 0 ? Math.PI / 2 : 0, Vec.of(1, 0, 0)).times(Mat4.rotation(Math.PI * y - (x == 1 ? Math.PI / 2 : 0), Vec.of(0, 1, 0))).times(Mat4.translation([0, 0, 1]));
                Square.insert_transformed_copy_into(this, [], square_transform);
            }
        }
    }
}

window.SubSphere = window.classes.SubSphere = class SubSphere extends Shape {
    constructor(max_subdivisions) {
        super("positions", "normals", "texture_coords");
        this.positions.push(...Vec.cast([0, 0, -1], [0, .94280, .33330], [-.81650, -.47140, .33330], [.81650, -.47140, .33330]));
        this.helperRecurse(0, 1, 2, max_subdivisions);
        this.helperRecurse(3, 2, 1, max_subdivisions);
        this.helperRecurse(1, 0, 3, max_subdivisions);
        this.helperRecurse(0, 2, 3, max_subdivisions);
        for (let p of this.positions) {
            this.normals.push(p.copy());
            this.texture_coords.push(Vec.of(Math.asin(p[0] / Math.PI) + .5, Math.asin(p[1] / Math.PI) + .5));
        }
    }
    helperRecurse(a, b, c, count) {
        if (count <= 0) {
            this.indices.push(a, b, c);
            return;
        }
        var firstV = this.positions[a].mix(this.positions[b], 0.5).normalized()
          , secV = this.positions[a].mix(this.positions[c], 0.5).normalized()
          , thirdV = this.positions[b].mix(this.positions[c], 0.5).normalized();
        var first = this.positions.push(firstV) - 1
          , second = this.positions.push(secV) - 1
          , third = this.positions.push(thirdV) - 1;
        this.helperRecurse(a, first, second, count - 1);
        this.helperRecurse(first, b, third, count - 1);
        this.helperRecurse(second, third, c, count - 1);
        this.helperRecurse(first, third, second, count - 1);
    }
}

window.Grid_Patch = window.classes.Grid_Patch = class Grid_Patch extends Shape {
    constructor(width, height, next_row_function, next_column_function, texture_coord_range=[[0, width], [0, height]]) {
        super("positions", "normals", "texture_coords");
        let points = [];
        for (let left = 0; left <= width; left++) {
            points.push(new Array(height + 1));
            points[left][0] = next_row_function(left / width, points[left - 1] && points[left - 1][0]);
        }
        for (let left = 0; left <= width; left++) {
            for (let k = 0; k <= height; k++) {
                if (k > 0)
                    points[left][k] = next_column_function(k / height, points[left][k - 1], left / width);
                this.positions.push(points[left][k]);
                const a1 = k / height
                  , a2 = left / width
                  , x_range = texture_coord_range[0]
                  , y_range = texture_coord_range[1];
                this.texture_coords.push(Vec.of((a1) * x_range[1] + (1 - a1) * x_range[0], (a2) * y_range[1] + (1 - a2) * y_range[0]));
            }
        }
        for (let left = 0; left <= width; left++) {
            for (let k = 0; k <= height; k++) {
                let nowPos = points[left][k]
                  , nextTo = new Array(4)
                  , normal = Vec.of(0, 0, 0);
                for (let[y,dir] of [[-1, 0], [0, 1], [1, 0], [0, -1]].entries())
                    nextTo[y] = points[left + dir[1]] && points[left + dir[1]][k + dir[0]];
                for (let y = 0; y < 4; y++)
                    if (nextTo[y] && nextTo[(y + 1) % 4])
                        normal = normal.plus(nextTo[y].minus(nowPos).cross(nextTo[(y + 1) % 4].minus(nowPos)));
                normal.normalize();
                if (normal.every(x=>x == x) && normal.norm() > .01)
                    this.normals.push(Vec.from(normal));
                else
                    this.normals.push(Vec.of(0, 0, 1));
            }
        }
        for (var x = 0; x < width; x++)
            for (var y = 0; y < 2 * height; y++)
                for (var z = 0; z < 3; z++)
                    this.indices.push(x * (height + 1) + height * ((y + (z % 2)) % 2) + (~~((z % 3) / 2) ? (~~(y / 2) + 2 * (y % 2)) : (~~(y / 2) + 1)));
    }
    static sample_array(array, ratio) {
        const frac = ratio * (array.length - 1)
          , alpha = frac - Math.floor(frac);
        return array[Math.floor(frac)].mix(array[Math.ceil(frac)], alpha);
    }
}

window.Surface_Of_Revolution = window.classes.Surface_Of_Revolution = class Surface_Of_Revolution extends Grid_Patch {
    constructor(rows, columns, points, texture_coord_range, total_curvature_angle=2 * Math.PI) {
        const row_operation = i=>Grid_Patch.sample_array(points, i)
          , column_operation = (j,p)=>Mat4.rotation(total_curvature_angle / columns, Vec.of(0, 0, 1)).times(p.to4(1)).to3();
        super(rows, columns, row_operation, column_operation, texture_coord_range);
    }
}

window.P_2D = window.classes.P_2D = class P_2D extends Surface_Of_Revolution {
    constructor(rows, columns) {
        super(rows, columns, Vec.cast([0, 0, 0], [1, 0, 0]));
        this.normals = this.normals.map(x=>Vec.of(0, 0, 1));
        this.texture_coords.forEach((x,i,a)=>a[i] = this.positions[i].map(x=>x / 2 + .5).slice(0, 2));
    }
}

window.smallSquare = window.classes.smallSquare = class smallSquare extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        this.positions.push(...Vec.cast([-.5, -.5, 0], [.5, -.5, 0], [-.5, .5, 0], [.5, .5, 0]));
        this.normals.push(...Vec.cast([0, 0, .5], [0, 0, .5], [0, 0, .5], [0, 0, .5]));
        this.texture_coords.push(...Vec.cast([0, 0], [.5, 0], [0, .5], [.5, .5]));
        this.indices.push(0, 1, 2, 1, 3, 2);
    }
}

window.Rock = window.classes.Rock = class Rock extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        const r3 = Math.sqrt(3);
        this.positions.push(...Vec.cast(// Front Side
        [-2, 2, -2], [-1, 2, -2], [-1, 3, -2], [-1, 2, -2], [-1, 3, -2], [1, 3, -2], [-1, 2, -2], [1, 2, -2], [1, 3, -2], [2, 2, -2], [1, 2, -2], [1, 3, -2], [-2, 2, -2], [-2, 0, -2], [2, 2, -2], [-2, 0, -2], [2, 0, -2], [2, 2, -2], [-2, 2, -2], [-2, 0, -2], [(-2 - 2 / r3), 0, -2], [2, 2, -2], [2, 0, -2], [(2 + 2 / r3), 0, -2], // Back Side
        [-2, 2, 2], [-1, 2, 2], [-1, 3, 2], [-1, 2, 2], [-1, 3, 2], [1, 3, 2], [-1, 2, 2], [1, 2, 2], [1, 3, 2], [2, 2, 2], [1, 2, 2], [1, 3, 2], [-2, 2, 2], [-2, 0, 2], [2, 2, 2], [-2, 0, 2], [2, 0, 2], [2, 2, 2], [-2, 2, 2], [-2, 0, 2], [(-2 - 2 / r3), 0, 2], [2, 2, 2], [2, 0, 2], [(2 + 2 / r3), 0, 2], // Edges
        [-2, 2, -2], [-2, 2, 2], [-1, 3, 2], [-1, 3, 2], [-1, 3, -2], [-2, 2, -2], [-1, 3, -2], [-1, 3, 2], [1, 3, 2], [1, 3, 2], [1, 3, -2], [-1, 3, -2], [2, 2, -2], [2, 2, 2], [1, 3, 2], [1, 3, 2], [1, 3, -2], [2, 2, -2], [(-2 - 2 / r3), 0, 2], [(-2 - 2 / r3), 0, -2], [-2, 2, 2], [-2, 2, 2], [-2, 2, -2], [(-2 - 2 / r3), 0, -2], [(2 + 2 / r3), 0, 2], [(2 + 2 / r3), 0, -2], [2, 2, 2], [2, 2, 2], [2, 2, -2], [(2 + 2 / r3), 0, -2]));
        this.texture_coords.push(...Vec.cast([0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [0, 0], [0, 1], [1, 0], [1, 1]));
        // Supply vectors that point away from eace face of the cube.  They should match up with the points in the above list
        // Normal vectors are needed so the graphics engine can know if the shape is pointed at light or not, and color it accordingly.
        this.normals.push(...Vec.cast(// Front side
        [0, 0.1, 1], [0, 0.1, 1], [0, 0.1, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], // Back Side
        [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], // Edges
        [-1, 1, 0], [-1, 1, 0], [-1, 1, 0], [-1, 1, 0], [-1, 1, 0], [-1, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [1, 1, 0], [1, 1, 0], [1, 1, 0], [1, 1, 0], [1, 1, 0], [1, 1, 0], [-3, 1, 0], [-3, 1, 0], [-3, 1, 0], [-3, 1, 0], [-3, 1, 0], [-3, 1, 0], [3, 1, 0], [3, 1, 0], [3, 1, 0], [3, 1, 0], [3, 1, 0], [3, 1, 0]));
        // Those two lists, positions and normals, fully describe the "vertices".  What's the "i"th vertex?  Simply the combined
        // data you get if you look up index "i" of both lists above -- a position and a normal vector, together.  Now let's
        // tell it how to connect vertex entries into triangles.  Every three indices in this list makes one triangle:
        this.indices.push(// Front Side
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, // Back Side
        24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, // Edges
        48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77);
    }
}

window.Cylindrical_Tube = window.classes.Cylindrical_Tube = class Cylindrical_Tube extends Surface_Of_Revolution {
    constructor(rows, columns, texture_range) {
        super(rows, columns, Vec.cast([1, 0, .5], [1, 0, -.5]), texture_range);
    }
}

window.U_CONE = window.classes.U_CONE = class U_CONE extends Surface_Of_Revolution {
    constructor(rows, columns, texture_range) {
        super(rows, columns, Vec.cast([0, 0, 1], [1, 0, -1]), texture_range);
    }
}

window.Circle = window.classes.Circle = class Circle extends Shape {
    constructor(rows, columns) {
        super("positions", "normals", "texture_coords");
        const circle_points = Array(rows).fill(Vec.of(.75, 0, 0)).map((p,i,a)=>Mat4.translation([.70, 0, 0]).times(Mat4.rotation(i / (a.length - 1) * 2 * Math.PI, Vec.of(0, -1, 0))).times(p.to4(1)).to3());
        Surface_Of_Revolution.insert_transformed_copy_into(this, [rows, columns, circle_points]);
    }
}

window.Torus = window.classes.Torus = class Torus extends Shape {
    constructor(rows, columns) {
        super("positions", "normals", "texture_coords");
        const circle_points = Array(rows).fill(Vec.of(.75, 0, 0)).map((p,i,a)=>Mat4.translation([-1, 0, 0]).times(Mat4.rotation(i / (a.length - 1) * 2 * Math.PI, Vec.of(0, -1, 0))).times(p.to4(1)).to3());
        Surface_Of_Revolution.insert_transformed_copy_into(this, [rows, columns, circle_points]);
    }
}

window.Capped_Cylinder = window.classes.Capped_Cylinder = class Capped_Cylinder extends Shape {
    constructor(rows, columns, texture_range) {
        super("positions", "normals", "texture_coords");
        Cylindrical_Tube.insert_transformed_copy_into(this, [rows, columns, texture_range]);
        P_2D.insert_transformed_copy_into(this, [1, columns], Mat4.translation([0, 0, .5]));
        P_2D.insert_transformed_copy_into(this, [1, columns], Mat4.rotation(Math.PI, Vec.of(0, 1, 0)).times(Mat4.translation([0, 0, .5])));
    }
}

window.Axis_Arrows = window.classes.Axis_Arrows = class Axis_Arrows extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        var stack = [];
        SubSphere.insert_transformed_copy_into(this, [3], Mat4.rotation(Math.PI / 2, Vec.of(0, 1, 0)).times(Mat4.scale([.25, .25, .25])));
        this.drawOneAxis(Mat4.identity(), [[.67, 1], [0, 1]]);
        this.drawOneAxis(Mat4.rotation(-Math.PI / 2, Vec.of(1, 0, 0)).times(Mat4.scale([1, -1, 1])), [[.34, .66], [0, 1]]);
        this.drawOneAxis(Mat4.rotation(Math.PI / 2, Vec.of(0, 1, 0)).times(Mat4.scale([-1, 1, 1])), [[0, .33], [0, 1]]);
    }
    drawOneAxis(transform, tex) {
        Closed_Cone.insert_transformed_copy_into(this, [4, 10, tex], transform.times(Mat4.translation([0, 0, 2])).times(Mat4.scale([.25, .25, .25])));
        Cube.insert_transformed_copy_into(this, [], transform.times(Mat4.translation([.95, .95, .45])).times(Mat4.scale([.05, .05, .45])));
        Cube.insert_transformed_copy_into(this, [], transform.times(Mat4.translation([.95, 0, .5])).times(Mat4.scale([.05, .05, .4])));
        Cube.insert_transformed_copy_into(this, [], transform.times(Mat4.translation([0, .95, .5])).times(Mat4.scale([.05, .05, .4])));
        Cylindrical_Tube.insert_transformed_copy_into(this, [7, 7, tex], transform.times(Mat4.translation([0, 0, 1])).times(Mat4.scale([.1, .1, 2])));
    }
}

window.Basic_Shader = window.classes.Basic_Shader = class Basic_Shader extends Shader {
    material() {
        return {
            shader: this
        }
    }
    map_attribute_name_to_buffer_name(name) {
        return {
            object_space_pos: "positions",
            color: "colors"
        }[name];
    }
    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        const [P,C,M] = [g_state.projection_transform, g_state.camera_transform, model_transform]
          , PCM = P.times(C).times(M);
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
    }
    shared_glsl_code() {
        return `precision mediump float; varying vec4 VERTEX_COLOR;`;
    }
    vertex_glsl_code() {
        return `attribute vec4 color; attribute vec3 object_space_pos; uniform mat4 projection_camera_model_transform;
        void main() { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0); VERTEX_COLOR = color; }`;
    }
    fragment_glsl_code() {
        return `void main() { gl_FragColor = VERTEX_COLOR; }`;
    }
}

window.Phong_Shader = window.classes.Phong_Shader = class Phong_Shader extends Shader {
    material(color, properties) {
        return new class Material {
            constructor(shader, color=Color.of(0, 0, 0, 1), ambient=0, diffusivity=1, specularity=1, smoothness=40) {
                Object.assign(this, {
                    shader,
                    color,
                    ambient,
                    diffusivity,
                    specularity,
                    smoothness
                });
                Object.assign(this, properties);
            }
            override(properties) {
                const copied = new this.constructor();
                Object.assign(copied, this);
                Object.assign(copied, properties);
                copied.color = copied.color.copy();
                if (properties["opacity"] != undefined)
                    copied.color[3] = properties["opacity"];
                return copied;
            }
        }
        (this,color);
    }
    map_attribute_name_to_buffer_name(name) {
        // those names onto the vertex array names we'll pull them from.
        return {
            object_space_pos: "positions",
            normal: "normals",
            tex_coord: "texture_coords"
        }[name];
    }
    // Use a simple lookup table.
    shared_glsl_code() // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    {
        return `precision mediump float;
        const int N_LIGHTS = 2;             // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];
        uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;               // Flags for alternate shading methods
        uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed from the vertex shader 
        varying vec2 f_tex_coord;             // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 L[N_LIGHTS], H[N_LIGHTS];
        varying float dist[N_LIGHTS];
        
        vec3 phong_model_lights( vec3 N )
          { vec3 result = vec3(0.0);
            for(int i = 0; i < N_LIGHTS; i++)
              {
                float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                float diffuse  =      max( dot(N, L[i]), 0.0 );
                float specular = pow( max( dot(N, H[i]), 0.0 ), smoothness );

                result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
              }
            return result;
          }
        `;
    }
    vertex_glsl_code() // ********* VERTEX SHADER *********
    {
        return `
        attribute vec3 object_space_pos, normal;
        attribute vec2 tex_coord;

        uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
        uniform mat3 inverse_transpose_modelview;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);     // The vertex's final resting place (in NDCS).
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          f_tex_coord = tex_coord;                                         // Directly use original texture coords and interpolate between.
          
          if( COLOR_NORMALS )                                     // Bypass all lighting code if we're lighting up vertices some other way.
          { VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             // In "normals" mode, 
                                 N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],             // rgb color = xyz quantity.
                                 N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );     // Flash if it's negative.
            return;
          }
                                                  // The rest of this shader calculates some quantities that the Fragment shader will need:
          vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
          E = normalize( -screen_space_pos );

          for( int i = 0; i < N_LIGHTS; i++ )
          {            // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
            L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * screen_space_pos );
            H[i] = normalize( L[i] + E );
            
            // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
            dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, screen_space_pos)
                                                : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
          }

          if( GOURAUD )                   // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader, 
          {                               // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed 
                                          // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
            VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
            VERTEX_COLOR.xyz += phong_model_lights( N );
          }
        }`;
    }
    fragment_glsl_code() // ********* FRAGMENT SHADER ********* 
    {
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec4 tex_color = texture2D( texture, f_tex_coord );                         // Sample the texture image in the correct place.

          if( USE_TEXTURE && tex_color.w < .01 ) discard;
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
        this.update_matrices(g_state, model_transform, gpu, gl);
        gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

        if (g_state.gouraud === undefined) {
            g_state.gouraud = g_state.color_normals = false;
        }
        // Keep the flags seen by the shader 
        gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud || material.gouraud);
        // program up-to-date and make sure 
        gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);
        // they are declared.

        gl.uniform4fv(gpu.shapeColor_loc, material.color);
        // Send the desired shape-wide material qualities 
        gl.uniform1f(gpu.ambient_loc, material.ambient);
        // to the graphics card, where they will tweak the
        gl.uniform1f(gpu.diffusivity_loc, material.diffusivity);
        // Phong lighting formula.
        gl.uniform1f(gpu.specularity_loc, material.specularity);
        gl.uniform1f(gpu.smoothness_loc, material.smoothness);

        if (material.texture) // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
        {
            gpu.shader_attributes["tex_coord"].enabled = true;
            gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
        } else {
            gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
            gpu.shader_attributes["tex_coord"].enabled = false;
        }

        if (!g_state.lights.length)
            return;
        var lightPositions_flattened = []
          , lightColors_flattened = []
          , lightAttenuations_flattened = [];
        for (var i = 0; i < 4 * g_state.lights.length; i++) {
            lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
            lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
            lightAttenuations_flattened[Math.floor(i / 4)] = g_state.lights[Math.floor(i / 4)].attenuation;
        }
        gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
        gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
        gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);
    }
    update_matrices(g_state, model_transform, gpu, gl) // Helper function for sending matrices to GPU.
    {
        // (PCM will mean Projection * Camera * Model)
        let[P,C,M] = [g_state.projection_transform, g_state.camera_transform, model_transform]
          , CM = C.times(M)
          , PCM = P.times(CM)
          , inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);

        gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
        gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));
    }
}

window.Shadow_Shader = window.classes.Shadow_Shader = class Shadow_Shader extends Shader {
    material(color, properties) {
        return new class Material {
            constructor(shader, color=Color.of(0, 0, 0, 1), ambient=0, diffusivity=1, specularity=1, smoothness=40) {
                Object.assign(this, {
                    shader,
                    color,
                    ambient,
                    diffusivity,
                    specularity,
                    smoothness
                });
                //assign
                Object.assign(this, properties);
            }

            //assign
            override(properties) {
                const newVers = new this.constructor();
                Object.assign(newVers, this);
                //assign
                Object.assign(newVers, properties);
                //assign
                newVers.color = newVers.color.copy();
                if (properties["opacity"] != undefined)
                    newVers.color[3] = properties["opacity"];
                return newVers;
            }
        }
        (this,color);
    }

    //
    map_attribute_name_to_buffer_name(name) {
        // those names onto the vertex array names we'll pull them before.
        return {
            posObject: "positions",
            normal: "normals",
            tex_coord: "texture_coords"
        }[name];
    }
    // Use a simple lookup table.
    shared_glsl_code() // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    {
        return `precision mediump float;
        const int N_LIGHTS = 2;             // We're limited after only so many inputs in hardware.  Lights are costly (lots of sub-values).
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];
        uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;               // Flags for alternate shading methods
        uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed before the vertex shader 
        varying vec2 f_tex_coord;             // on after the next phase (fragment shader), then interpolated per-fragment, weighted by the 
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity after each of the 3 vertices (barycentric interpolation).
        varying vec3 L[N_LIGHTS], H[N_LIGHTS];
        varying float dist[N_LIGHTS];
        
        vec3 phong_model_lights( vec3 N )
          { vec3 result = vec3(0.0);
            for(int i = 0; i < N_LIGHTS; i++)
              {
                float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                float diffuse  =      max( dot(N, L[i]), 0.0 );
                float specular = pow( max( dot(N, H[i]), 0.0 ), smoothness );

                result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
              }
            return result;
          }
        `;
    }
    vertex_glsl_code() // ********* VERTEX SHADER *********
    {
        return `
        attribute vec3 posObject, normal;
        attribute vec2 tex_coord;

        uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
        uniform mat3 inverse_transpose_modelview;
        uniform mat4 s_camera_transform_loc;

        uniform mat4 u_MvpMatrixFromLight;
        varying vec4 v_PositionFromLight;

        attribute vec4 a_Color;
        varying vec4 v_Color;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(posObject, 1.0);     // The vertex's final resting place (in NDCS).
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          f_tex_coord = tex_coord;                                         // Directly use original texture coords and interpolate between.
          
          if( COLOR_NORMALS )                                     // Bypass all lighting code if we're lighting top vertices some other way.
          { VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             // In "normals" mode, 
                                 N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],             // rgb color = xyz quantity.
                                 N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );     // Flash if it's negative.
            return;
          }
                                                  // The rest of this shader calculates some quantities that the Fragment shader will need:
          vec3 screen_space_pos = ( camera_model_transform * vec4(posObject, 1.0) ).xyz;
          E = normalize( -screen_space_pos );

          for( int i = 0; i < N_LIGHTS; i++ )
          {            // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
            L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * screen_space_pos );
            H[i] = normalize( L[i] + E );
            
            // Is it a point light source?  Calculate the distance after it before the object.  Otherwise use some arbitrary distance.
            dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, screen_space_pos)
                                                : distance( attenuation_factor[i] * -lightPosition[i].xyz, posObject.xyz );
          }

          if( GOURAUD )                   // 
          {                               // 
                                          // 
            VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
            VERTEX_COLOR.xyz += phong_model_lights( N );
          }
          
           vec3 before = vec3(1,0,60);
           vec3 after = vec3(0,0,0);

           vec3 front = normalize(before - after);
           vec3 rhs = vec3(0,1,0) * front;
           vec3 top = front * rhs;

           mat4 worldCam;

           worldCam[0][0] = rhs.x; 
           worldCam[0][1] = rhs.y; 
           worldCam[0][2] = rhs.z; 
           worldCam[1][0] = top.x; 
           worldCam[1][1] = top.y; 
           worldCam[1][2] = top.z; 
           worldCam[2][0] = front.x; 
           worldCam[2][1] = front.y; 
           worldCam[2][2] = front.z; 

           worldCam[3][0] = before.x; 
           worldCam[3][1] = before.y; 
           worldCam[3][2] = before.z;

          float l = -20.;
          float r = 20.;
          float t = 20.;
          float b = -20.;
          float n = -10.;
          float f = 20.;
          mat4 depthProjectionMatrix = mat4(2./(r-l), 0., 0., 0., 0., 2./(t-b), 0., 0., 0., 0., -2./(f-n), 0., -(r+l)/(r-l), -(t+b)/(t-b), -(f+n)/(f-n), 1.);

          mat4 depthMVP = depthProjectionMatrix * worldCam * mat4(1.0);
          mat4 biasMatrix = mat4(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
          mat4 depthBiasMVP = biasMatrix * depthMVP;
          v_PositionFromLight = biasMatrix * vec4(posObject, 1.0);
          v_Color = vec4( shapeColor.xyz * ambient, shapeColor.w);
        }`;
    }
    fragment_glsl_code() // ********* FRAGMENT SHADER ********* 
    {
        // 
        return `
        uniform sampler2D texture;

        varying vec4 v_PositionFromLight;
        varying vec4 v_Color;

        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors after smear (interpolate) across vertices.            
            return;
          }                                 

            vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
            vec4 rgbaDepth = texture2D(texture, v_PositionFromLight.xy);

            float depth = rgbaDepth.r;
            float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;


            vec4 tex_color = texture2D( texture, f_tex_coord );        // Sample the texture image in the correct place.

            if( USE_TEXTURE && tex_color.w < .01 ) discard;
          
                                                                                        // Compute an initial (ambient) color:
            if( USE_TEXTURE )  {
              if (tex_color.xyz == vec3(0, 0, 0)) {
                gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
              } else {
                gl_FragColor = vec4( 0, 0, 0, 1 ); 
              }
            }
            else {
              gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
            }
            gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions before lights.
         }`;
    }
    // Define how after synchronize our JavaScript's variables after the GPU's:
    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        // First, send the matrices after the GPU, additionally cache-ing some products of them we know we'll need:
        this.matrixUpd(g_state, model_transform, gpu, gl);
        gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

        if (g_state.gouraud === undefined) {
            g_state.gouraud = g_state.color_normals = false;
        }
        // Keep the flags seen by the shader 
        gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud || material.gouraud);
        // program top-after-date and make sure 
        gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);
        // they are declared.

        gl.uniform4fv(gpu.shapeColor_loc, material.color);
        // Send the desired shape-wide material qualities 
        gl.uniform1f(gpu.ambient_loc, material.ambient);
        // 

        gl.uniform1f(gpu.diffusivity_loc, material.diffusivity);
        // Phong lighting formula.
        gl.uniform1f(gpu.specularity_loc, material.specularity);
        gl.uniform1f(gpu.smoothness_loc, material.smoothness);

        if (material.texture) // NOTE: after signal not after draw a texture, omit the texture parameter before Materials.
        {
            gpu.shader_attributes["tex_coord"].enabled = true;
            gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
        } else {
            gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
            gpu.shader_attributes["tex_coord"].enabled = false;
        }

        if (!g_state.lights.length)
            return;
        var lightPositions_flattened = []
          , lightColors_flattened = []
          , lightAttenuations_flattened = [];
        for (var i = 0; i < 4 * g_state.lights.length; i++) {
            lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
            lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
            lightAttenuations_flattened[Math.floor(i / 4)] = g_state.lights[Math.floor(i / 4)].attenuation;
        }
        gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
        gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
        gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);
    }
    matrixUpd(g_state, model_transform, gpu, gl) // Helper function for sending matrices after GPU.
    {
        // (PCM will mean Projection * Camera * Model)
        let[P,C,M] = [g_state.projection_transform, g_state.camera_transform, model_transform]
          , CM = C.times(M)
          , PCM = P.times(CM)
          , inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);

        gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
        gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));

        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));

        gl.uniformMatrix4fv(gpu.s_camera_transform_loc, false, Mat.flatten_2D_to_1D(Mat4.look_at(Vec.of(20, 20, 40, 1), Vec.of(0, 0, 0), Vec.of(0, 1, 0)).transposed()));
    }
}

window.Fake_Bump_Map = window.classes.Fake_Bump_Map = class Fake_Bump_Map extends Phong_Shader // Same as Phong_Shader, except this adds one line of code.
{
    fragment_glsl_code() // ********* FRAGMENT SHADER ********* 
    {
        return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          
          vec4 tex_color = texture2D( texture, f_tex_coord );                    // Use texturing as well.
          vec3 bumped_N  = normalize( N + tex_color.rgb - .5*vec3(1,1,1) );      // Slightly disturb normals based on sampling
                                                                                 // the same image that was used for texturing.
                                                                                 
                                                                                 // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( bumped_N );                    // Compute the final color with contributions from lights.
        }`;
    }
}

window.Global_Info_Table = window.classes.Global_Info_Table = class Global_Info_Table extends Scene_Component // A class that just toggles, monitors, and reports some 
{
    make_control_panel() // global values via its control panel.
    {
        const globals = this.globals;
        globals.has_info_table = true;
        this.key_triggered_button("(Un)pause animation", ["Alt", "a"], function() {
            globals.animate ^= 1;
        });
        this.new_line();

        //
        this.live_string(box=>{
            box.textContent = "Animation Time: " + (globals.graphics_state.animation_time / 1000).toFixed(3) + "s"
        }
        );
        this.live_string(box=>{
            box.textContent = globals.animate ? " " : " (paused)"
        }
        );
        this.new_line();

        this.key_triggered_button("Gouraud shading", ["Alt", "g"], function() {
            globals.graphics_state.gouraud ^= 1;
        });
        this.new_line();
        this.key_triggered_button("Normals shading", ["Alt", "n"], function() {
            globals.graphics_state.color_normals ^= 1;
        });
        this.new_line();

        const label = this.control_panel.appendChild(document.createElement("p"));
        label.style = "align:center";
        label.innerHTML = "see values below";

        const show_object = (element,obj=globals)=>{
            if (this.box)
                this.box.innerHTML = "";
            else
                this.box = element.appendChild(Object.assign(document.createElement("div"), {
                    style: "overflow:auto; width: 200px"
                }));
            if (obj !== globals)
                this.box.appendChild(Object.assign(document.createElement("div"), {
                    className: "link",
                    innerText: "(back to globals)",
                    onmousedown: ()=>this.current_object = globals
                }))
            if (obj.to_string)
                return this.box.appendChild(Object.assign(document.createElement("div"), {
                    innerText: obj.to_string()
                }));
            for (let[key,val] of Object.entries(obj)) {
                if (typeof (val) == "object")
                    this.box.appendChild(Object.assign(document.createElement("a"), {
                        className: "link",
                        innerText: key,
                        onmousedown: ()=>this.current_object = val
                    }))
                else
                    this.box.appendChild(Object.assign(document.createElement("span"), {
                        innerText: key + ": " + val.toString()
                    }));
                this.box.appendChild(document.createElement("br"));
            }
        }
        this.live_string(box=>show_object(box, this.current_object));
    }
}

window.Movement_Controls = window.classes.Movement_Controls = class Movement_Controls extends Scene_Component // Movement_Controls is a Scene_Component that can be attached to a canvas, like any 
{
    // other Scene, but it is a Secondary Scene Component -- meant to stack alongside other

    constructor(context, control_box, canvas=context.canvas) {
        super(context, control_box);
        [this.context,this.roll,this.look_around_locked,this.invert] = [context, 0, true, true];
        // Data members
        [this.thrust,this.pos,this.z_axis] = [Vec.of(0, 0, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0)];

        this.target = function() {
            return context.globals.movement_controls_target()
        }
        context.globals.movement_controls_target = function(t) {
            return context.globals.graphics_state.camera_transform
        }
        ;
        context.globals.movement_controls_invert = this.will_invert = ()=>true;
        context.globals.has_controls = true;

        [this.radians_per_frame,this.meters_per_frame,this.speed_multiplier] = [1 / 200, 20, 1];

        // *** Mouse controls: ***
        this.mouse = {
            "from_center": Vec.of(0, 0)
        };
        // Measure mouse steering, for rotating the flyaround camera:
        const mouse_position = (e,rect=canvas.getBoundingClientRect())=>Vec.of(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas.
        document.addEventListener("mouseup", e=>{
            this.mouse.anchor = undefined;
        }
        );
        canvas.addEventListener("mousedown", e=>{
            e.preventDefault();
            this.mouse.anchor = mouse_position(e);
        }
        );
        canvas.addEventListener("mousemove", e=>{
            e.preventDefault();
            this.mouse.from_center = mouse_position(e);
        }
        );
        canvas.addEventListener("mouseout", e=>{
            if (!this.mouse.anchor)
                this.mouse.from_center.scale(0)
        }
        );
    }
    show_explanation(document_element) {}
    make_control_panel() // This function of a scene sets up its keyboard shortcuts.
    {
        const globals = this.globals;
        this.control_panel.innerHTML += "Click and drag the scene to <br> spin your viewpoint around it.<br>";
        this.key_triggered_button("Up", [" "], ()=>this.thrust[1] = -1, undefined, ()=>this.thrust[1] = 0);
        this.key_triggered_button("Forward", ["w"], ()=>this.thrust[2] = 1, undefined, ()=>this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("Left", ["a"], ()=>this.thrust[0] = 1, undefined, ()=>this.thrust[0] = 0);

        this.key_triggered_button("Back", ["s"], ()=>this.thrust[2] = -1, undefined, ()=>this.thrust[2] = 0);
        this.key_triggered_button("Right", ["d"], ()=>this.thrust[0] = -1, undefined, ()=>this.thrust[0] = 0);
        this.new_line();
        this.key_triggered_button("Down", ["z"], ()=>this.thrust[1] = 1, undefined, ()=>this.thrust[1] = 0);

        const speed_controls = this.control_panel.appendChild(document.createElement("span"));
        speed_controls.style.margin = "30px";
        this.key_triggered_button("-", ["o"], ()=>this.speed_multiplier /= 1.2, "green", undefined, undefined, speed_controls);
        this.live_string(box=>{
            box.textContent = "Speed: " + this.speed_multiplier.toFixed(2)
        }
        , speed_controls);
        this.key_triggered_button("+", ["p"], ()=>this.speed_multiplier *= 1.2, "green", undefined, undefined, speed_controls);
        this.new_line();
        this.key_triggered_button("Roll left", [","], ()=>this.roll = 1, undefined, ()=>this.roll = 0);
        this.key_triggered_button("Roll right", ["."], ()=>this.roll = -1, undefined, ()=>this.roll = 0);
        this.new_line();
        this.key_triggered_button("(Un)freeze mouse ", ["f"], ()=>this.look_around_locked ^= 1, "green");
        this.new_line();
        this.live_string(box=>box.textContent = "Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2) + ", " + this.pos[2].toFixed(2));
        this.new_line();
        // The facing directions are actually affected by the left hand rule:
        this.live_string(box=>box.textContent = "Facing: " + ((this.z_axis[0] > 0 ? "West " : "East ") + (this.z_axis[1] > 0 ? "Down " : "Up ") + (this.z_axis[2] > 0 ? "North" : "South")));
        this.new_line();
        this.key_triggered_button("Go to world origin", ["r"], ()=>this.target().set_identity(4, 4), "orange");
        this.new_line();
        this.key_triggered_button("Attach to global camera", ["Shift", "R"], ()=>globals.movement_controls_target = ()=>globals.graphics_state.camera_transform, "blue");
        this.new_line();
    }
    first_person_flyaround(radians_per_frame, meters_per_frame, leeway=70) {
        const sign = this.will_invert ? 1 : -1;
        const do_operation = this.target()[this.will_invert ? "pre_multiply" : "post_multiply"].bind(this.target());
        // Compare mouse's location to all four corners of a dead box.
        const offsets_from_dead_box = {
            plus: [this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway],
            minus: [this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway]
        };

        // Apply a camera rotation movement, but only when the mouse is past a minimum distance (leeway) from the canvas's center:
        if (!this.look_around_locked)
            for (let i = 0; i < 2; i++) // Steer according to "mouse_from_center" vector, but don't 
            {
                // start increasing until outside a leeway window from the center.
                let o = offsets_from_dead_box
                  , // The &&'s in the next line might zero the vectors out:
                velocity = ((o.minus[i] > 0 && o.minus[i]) || (o.plus[i] < 0 && o.plus[i])) * radians_per_frame;
                do_operation(Mat4.rotation(sign * velocity, Vec.of(i, 1 - i, 0)));
                // On X step, rotate around Y axis, and vice versa.
            }
        if (this.roll != 0)
            do_operation(Mat4.rotation(sign * .1, Vec.of(0, 0, this.roll)));
        // Now apply translation movement of the camera, in the newest local coordinate frame.
        do_operation(Mat4.translation(this.thrust.times(sign * meters_per_frame)));
    }
    third_person_arcball(radians_per_frame) {
        const sign = this.will_invert ? 1 : -1;
        const do_operation = this.target()[this.will_invert ? "pre_multiply" : "post_multiply"].bind(this.target());
        const dragging_vector = this.mouse.from_center.minus(this.mouse.anchor);
        // Spin the scene around a point on an
        if (dragging_vector.norm() <= 0)
            return;
        // axis determined by user mouse drag.

        //
        do_operation(Mat4.translation([0, 0, sign * 25]));
        // The presumed distance to the scene is a hard-coded 25 units.
        do_operation(Mat4.rotation(radians_per_frame * dragging_vector.norm(), Vec.of(dragging_vector[1], dragging_vector[0], 0)));
        do_operation(Mat4.translation([0, 0, sign * -25]));
    }
    display(graphics_state, dt=graphics_state.animation_delta_time / 1000) // Camera code starts here.
    {
        const m = this.speed_multiplier * this.meters_per_frame
          , r = this.speed_multiplier * this.radians_per_frame;
        this.first_person_flyaround(dt * r, dt * m);
        if (this.mouse.anchor)
            this.third_person_arcball(dt * r);

        const inv = Mat4.inverse(this.target());
        this.pos = inv.times(Vec.of(0, 0, 0, 1));
        this.z_axis = inv.times(Vec.of(0, 0, 1, 0));
        // Log some values.
    }
}

// ***************************************** ATTEMPT  ****************************************
window.Shape_From_File = window.classes.Shape_From_File = class Shape_From_File extends Shape {
    constructor(filename) //adapted from online
    {
        super("positions", "normals", "texture_coords");
        this.load_file(filename);
    }
    load_file(filename) {
        return fetch(filename).then(response=>{
            if (response.ok)
                return Promise.resolve(response.text())
            else
                return Promise.reject(response.status)
        }
        ).then(obj_file_contents=>this.parse_into_mesh(obj_file_contents)).catch(error=>{
            this.copy_onto_graphics_card(this.gl);
        }
        )
    }
    parse_into_mesh(data) {
        var vertices = []
          , vNorm = []
          , textu = []
          , separate = {};

        separate.vertices = [];
        separate.norms = [];
        separate.textu = [];
        separate.hashindices = {};
        separate.indices = [];
        separate.index = 0;

        var lines = data.split('\n');

        var vertRE = /^v\s/;
        var NORMAL_RE = /^vn\s/;
        var TEXTURE_RE = /^vt\s/;
        var reFac = /^f\s/;
        var WHITESPACE_RE = /\s+/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var pElm = line.split(WHITESPACE_RE);
            pElm.shift();

            if (vertRE.test(line))
                vertices.push.apply(vertices, pElm);

                //
            else if (NORMAL_RE.test(line))
                vNorm.push.apply(vNorm, pElm);
            else if (TEXTURE_RE.test(line))
                textu.push.apply(textu, pElm);
            else if (reFac.test(line)) {
                var quad = false;
                for (var j = 0, eleLen = pElm.length; j < eleLen; j++) {
                    if (j === 3 && !quad) {
                        j = 2;
                        quad = true;
                    }
                    if (pElm[j]in separate.hashindices)
                        separate.indices.push(separate.hashindices[pElm[j]]);
                    else {

                        ///UNPACK
                        var vertex = pElm[j].split('/');

                        separate.vertices.push(+vertices[(vertex[0] - 1) * 3 + 0]);
                        separate.vertices.push(+vertices[(vertex[0] - 1) * 3 + 1]);
                        separate.vertices.push(+vertices[(vertex[0] - 1) * 3 + 2]);

                        if (textu.length) {
                            separate.textu.push(+textu[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
                            separate.textu.push(+textu[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
                        }

                        separate.norms.push(+vNorm[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
                        separate.norms.push(+vNorm[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
                        separate.norms.push(+vNorm[((vertex[2] - 1) || vertex[0]) * 3 + 2]);
                        ////UNPACK

                        separate.hashindices[pElm[j]] = separate.index;
                        separate.indices.push(separate.index);
                        separate.index += 1;
                    }
                    if (j === 3 && quad)
                        separate.indices.push(separate.hashindices[pElm[0]]);
                }
            }

        }
        for (var j = 0; j < separate.vertices.length / 3; j++) {
            this.positions.push(Vec.of(separate.vertices[3 * j], separate.vertices[3 * j + 1], separate.vertices[3 * j + 2]));
            this.normals.push(Vec.of(separate.norms[3 * j], separate.norms[3 * j + 1], separate.norms[3 * j + 2]));
            this.texture_coords.push(Vec.of(separate.textu[2 * j], separate.textu[2 * j + 1]));
        }

        //l
        this.indices = separate.indices;

        this.normalize_positions(false);
        this.copy_onto_graphics_card(this.gl);
        this.ready = true;
    }
    draw(graphics_state, model_transform, material) // Cancel all attempts to draw the shape before it loads.
    {
        if (this.ready)
            super.draw(graphics_state, model_transform, material);
    }
}

// ***************************************** ATTEMPT TO CREATE 3D FISH ****************************************
