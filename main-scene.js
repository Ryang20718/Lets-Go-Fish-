window.Fishing_Game = window.classes.Fishing_Game = class Fishing_Game extends Scene_Component {
    constructor(context, control_box) {
        super(context, control_box);
        if (!context.globals.has_controls)
            context.register_scene_component(new Movement_Controls(context,control_box.parentElement.insertCell()));

        //          context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0, -20, 15 ), Vec.of( 0,0,0 ), Vec.of( 0,10, 0 ) );

        // beginning look at sign
        context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -5, 1030), Vec.of(0, 100, 0), Vec.of(0, 10, 0));

        const r = context.width / context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

        let gl = [];
        let element = document.getElementById("main-canvas");
        const canvas = element.children[0];
        for (let name of ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"])
            // Get the GPU ready, creating a new WebGL context
            if (gl = this.gl = canvas.getContext(name))
                break;
        // for this canvas.
        if (!gl)
            throw "Canvas failed to make a WebGL context.";

        //Shadow mapping
        this.webgl_manager = context;
        // Save off the Webgl_Manager object that created the scene.
        this.scratchpad = document.createElement('canvas');
        this.scratchpad_context = this.scratchpad.getContext('2d');
        // A hidden canvas for re-sizing the real canvas to be square.
        this.scratchpad.width = 256;
        this.scratchpad.height = 256;
        this.texture = new Texture(context.gl,"",false,false);
        // Initial image source: Blank gif file
        this.texture.image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

        const shapes = {
            box: new Cube(),
            plane: new Square(),
            sphere6: new Subdivision_Sphere(6),
            pond: new (Circle.prototype.make_flat_shaded_version())(20,20),
            torus: new Torus(20,20),
            cylinder: new Capped_Cylinder(20,20),
            pine_tree_branch: new Shape_From_File("assets/pine_tree_branch.obj"),
            pine_tree_bark: new Shape_From_File("assets/pine_tree_bark.obj"),
            grass: new Shape_From_File("assets/Grass_03.obj"),
            rock: new Shape_From_File("assets/Rock.obj"),
            fish3D: new Shape_From_File("assets/RuddFish.obj"),
            circle: new Circle(),
            mom: new Shape_From_File("assets/mom.obj"),
            mText: new Text_Line(35),
            rText: new Text_Line(200),
        }
        this.submit_shapes(context, shapes);

        this.materials = {
            pond: context.get_instance(Phong_Shader).material(Color.of(0, .7, 1, .5), {
                ambient: 0.3
            }),
            ground: context.get_instance(Fake_Bump_Map).material(Color.of(109 / 255, 78 / 255, 0 / 255, 1), {
                ambient: .20,
                texture: context.get_instance("assets/ground_texture1.jpeg", false)
            }),
            shadow: context.get_instance(Shadow_Shader).material(Color.of(.3, .3, .3, 1), {
                ambient: 1,
                texture: this.texture
            }),
            red: context.get_instance(Phong_Shader).material(Color.of(1, 0, 0, 1), {
                ambient: 1
            }),
            green: context.get_instance(Phong_Shader).material(Color.of(0, 1, 0, 1), {
                ambient: 1
            }),
            white: context.get_instance(Phong_Shader).material(Color.of(1, 1, 1, 1), {
                ambient: 1
            }),
            yellow: context.get_instance(Phong_Shader).material(Color.of(1, 1, 0, 1), {
                ambient: 1
            }),
            king_Fish: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1
            }),
            mystery_Fish: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1
            }),
            plain_Fish: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1
            }),
            small_Fry: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1
            }),
            touchy_Fish: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1
            }),
            nibbler: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1
            }),
            rudd_Fish: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/RuddFish.png", false)
            }),
            mom_img: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 0.5,
                texture: context.get_instance("assets/mom.jpg", false)
            }),
            start_sign: context.get_instance(Fake_Bump_Map).material(Color.of(0, 0, 0, 1), {
                ambient: .8,
                diffusivity: .5,
                specularity: .5,
                texture: context.get_instance("assets/start_sign.jpg", false)
            }),
            end_sign: context.get_instance(Fake_Bump_Map).material(Color.of(0, 0, 0, 1), {
                ambient: .8,
                diffusivity: .5,
                specularity: .5,
                texture: context.get_instance("assets/end_game.jpg", false)
            }),
            clouds: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: .5,
                diffusivity: .5,
                specularity: .5,
                texture: context.get_instance("assets/clouds.jpg", false)
            }),
            branch: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: .65,
                diffusivity: .5,
                specularity: .5,
                texture: context.get_instance("assets/leaf.png", false)
            }),
            bark: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/Bark.jpg", false)
            }),
            rock: context.get_instance(Fake_Bump_Map).material(Color.of(.4, .25, .15, 1), {
                ambient: .5,
                diffusivity: 5,
                specularity: .5,
                texture: context.get_instance("assets/rock_tex.jpg", false)
            }),
            text_image: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                texture: context.get_instance("/assets/text.png", false)
            }),
        }

        this.lights = [new Light(Vec.of(0, 5, 40, 1),Color.of(250 / 255, 214 / 255, 165 / 255, 1),1000)];

        this.t_reset = false;

        this.fanfare = new Audio("assets/Fanfare.flac");
        this.fanfare.loop = false;
        this.fanfare_count = 0;
        this.menu = new Audio("assets/Menu.mp3");
        this.menu.loop = true;
        this.menu_volume = 0.5;
        this.fishing_ost = new Audio("assets/fishing_ost.mp3");
        this.fishing_ost.loop = true;
        this.fishing_ost_volume = 0.5;
        this.splash = new Audio("assets/splash.mp3");
        this.splash.loop = false;
        this.laughter = new Audio("assets/laughter.mp3");
        //insult scene

        this.crosshair_Matrix = Mat4.identity().times(Mat4.scale([1, 1, 1]));
        this.rod_Matrix = Mat4.identity();

        this.king_Fish_Matrix = Mat4.identity().times(Mat4.translation([20, 20, -.15]));
        this.king_angle = 0
        this.king_model_spawn = Mat4.identity().times(Mat4.scale([.2, .05, .2]));
        this.king_spawn_time = Math.random() * 12 + 15;
        this.king_dist = 0.01;
        this.king_caught = false;

        this.mystery_Fish_Matrix = Mat4.identity().times(Mat4.translation([20, 20, -0.1]));
        this.mystery_angle = 0;
        this.mystery_model_spawn = Mat4.identity().times(Mat4.scale([.2, .05, .2]));
        this.mystery_spawn_time = Math.random() * 12 + 10;
        this.mystery_dist = 0.01;
        this.mystery_caught = false;
        this.mystery_direction = -1;

        this.plain_Fish_Matrix = Mat4.identity().times(Mat4.translation([Math.random() * 2 - 1, Math.random() * 2 - 1, 0])).times(Mat4.scale([.7, .7, .7]));
        this.plain_angle = Math.random() * 2 * Math.PI;
        this.plain_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.plain_spawn_time = Math.random() * 8;
        this.plain_caught = false;

        this.plain1_Fish_Matrix = Mat4.identity().times(Mat4.translation([Math.random() * 2 - 1, Math.random() * 2 - 1, -0.05])).times(Mat4.scale([.7, .7, .7]));
        this.plain1_angle = Math.random() * 2 * Math.PI;
        this.plain1_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.plain1_spawn_time = Math.random() * 8;
        this.plain1_caught = false;

        this.plain2_Fish_Matrix = Mat4.identity().times(Mat4.translation([Math.random() * 2 - 1, Math.random() * 2 - 1, -0.05])).times(Mat4.scale([.7, .7, .7]));
        this.plain2_angle = Math.random() * 2 * Math.PI;
        this.plain2_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.plain2_spawn_time = Math.random() * 8;
        this.plain2_caught = false;

        this.small_Fry_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.1])).times(Mat4.scale([.5, .5, .5]));
        this.small_Fry_Matrix = this.small_Fry_Matrix.times(Mat4.translation([0, -5, 0]));
        this.fry_angle = Math.random() * 2 * Math.PI;
        this.fry_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.fry_spawn_time = Math.random() * 8;
        this.fry_dist = 0.01;
        this.fry_caught = false;

        this.small_Fry1_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.05])).times(Mat4.scale([.5, .5, .5]));
        this.fry1_angle = Math.random() * 2 * Math.PI;
        this.fry1_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.fry1_spawn_time = Math.random() * 8;
        this.fry1_dist = 0.01;
        this.fry1_caught = false;

        this.small_Fry2_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.05])).times(Mat4.scale([.5, .5, .5]));
        this.fry2_angle = Math.random() * 2 * Math.PI;
        this.fry2_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.fry2_spawn_time = Math.random() * 8;
        this.fry2_caught = false;

        this.small_Fry3_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.05])).times(Mat4.scale([.5, .5, .5]));
        this.fry3_angle = Math.random() * 2 * Math.PI;
        this.fry3_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.fry3_spawn_time = Math.random() * 8;
        this.fry3_caught = false;

        this.small_Fry4_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.05])).times(Mat4.scale([.5, .5, .5]));
        this.fry4_angle = Math.random() * 2 * Math.PI;
        this.fry4_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.fry4_spawn_time = Math.random() * 8;
        this.fry4_caught = false;

        this.touchy_Fish_Matrix = Mat4.identity().times(Mat4.translation([20, 20, 0.1])).times(Mat4.scale([.5, .5, .5]));
        this.touchy_angle = 0;
        this.touchy_model_spawn = Mat4.identity().times(Mat4.scale([.05, .05, .05]));
        this.touchy_spawn_time = Math.random() * 12 + 10;
        this.touchy_dist = 0.01;
        this.touchy_caught = false;

        this.nibbler_Matrix = Mat4.identity().times(Mat4.translation([20, 20, 0.15])).times(Mat4.scale([.5, .5, .5]));
        this.nibbler_angle = 0;
        this.nibbler_model_spawn = Mat4.identity().times(Mat4.scale([.05, .05, .05]));
        this.nibbler_spawn_time = Math.random() * 12 + 1;
        this.nibbler_direction = -1;
        this.nibbler_caught = false;

        // RENDER TERRAIN MATRIXES
        this.sign_Matrix = Mat4.identity().times(Mat4.scale([10, 10, 10])).times(Mat4.translation([0, 0, 100]));

        this.backdrop_Matrix = Mat4.identity().times(Mat4.translation([0, 100, 1])).times(Mat4.rotation(1.6, Vec.of(1, 0, 0))).times(Mat4.scale([200, 100, 1]));

        this.pond_Matrix = Mat4.identity();
        this.pond_Matrix = this.pond_Matrix.times(Mat4.translation([0, 0, 1])).times(Mat4.scale([7, 7, .01]));

        this.ground_Matrix = Mat4.identity();
        this.ground_Matrix = this.ground_Matrix.times(Mat4.translation([0, 0, 1])).times(Mat4.scale([42.6, 42.6, .01]));

        this.bottom_Matrix = Mat4.identity();
        this.bottom_Matrix = this.bottom_Matrix.times(Mat4.translation([0, 0, -1])).times(Mat4.scale([15, 15, .01])).times(Mat4.rotation(Math.PI, [1.3, 0, 0]));

        this.rock_Matrix = Mat4.identity().times(Mat4.rotation(1.6, Vec.of(0, 1, -.1))).times(Mat4.translation([-0, 200, 11])).times(Mat4.scale([8, 2, 2]));

        this.fish3D_Matrix = Mat4.identity().times(Mat4.rotation(1, Vec.of(1, 0, -.1))).times(Mat4.translation([0, 0, 11])).times(Mat4.scale([8, 8, 8]));

        this.mom_matrix = Mat4.identity().times(Mat4.translation([10, 0, 7])).times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.scale([2, 2, 2]));

        this.catching = false;
        this.catching_timer = 0;
        this.zoom_animation = false;
        this.start_zoom = -1;

        this.can_start_to_catch = false;
        this.fish_is_caught = false;
        this.caught_fish_material = null;
        this.caught_fish_matrix = null;
        this.x1 = 0;
        this.x2 = 0;
        this.y1 = 0;
        this.y2 = 0;

        this.pause = true;
        this.time = 0;

        this.ending_animation = false;
        this.beginning_animation = true;
        this.begin_animation = false;
        this.animation_t = 0;
        this.graphics_state = context.globals.graphics_state;
        this.storedCamera = null;

        this.total_fish_caught = 0;
        this.total_times_tried = 0;
        // how many times user tries to catch fish by pressing control
        this.time_to_fish = 0;
    }

    make_control_panel() {
        this.key_triggered_button("Move Left", ["j"], this.move_left);
        this.key_triggered_button("Move Right", ["l"], this.move_right);
        this.key_triggered_button("Move Up", ["i"], this.move_up);
        this.key_triggered_button("Move Down", ["k"], this.move_down);
        this.key_triggered_button("Start Game", ["s"], ()=>{
            if (!this.begin_animation)
                this.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -40, 30), Vec.of(0, 0, 0), Vec.of(0, 10, 0));
            this.begin_animation = true;
            this.t_reset = false;
        }
        );
        this.key_triggered_button("Catch Fish", [";"], ()=>{
            if (!this.fish_is_caught && !this.catching)
                this.catch_fish()
        }
        );
    }

    move_left() {
        if ((this.crosshair_Matrix[0][3] - 0.2) * (this.crosshair_Matrix[0][3] - 0.2) + (this.crosshair_Matrix[1][3]) * (this.crosshair_Matrix[1][3]) < 72.25 && !this.catching) {
            this.crosshair_Matrix = this.crosshair_Matrix.times(Mat4.translation([-0.2, 0, 0]));
            this.rod_Matrix = this.rod_Matrix.times(Mat4.rotation(Math.PI / 300, [0, -1, 0]));
        }
    }
    move_right() {
        if ((this.crosshair_Matrix[0][3] + 0.2) * (this.crosshair_Matrix[0][3] + 0.2) + (this.crosshair_Matrix[1][3]) * (this.crosshair_Matrix[1][3]) < 72.25 && !this.catching) {
            this.crosshair_Matrix = this.crosshair_Matrix.times(Mat4.translation([0.2, 0, 0]));
            this.rod_Matrix = this.rod_Matrix.times(Mat4.rotation(Math.PI / 300, [0, 1, 0]));
        }
    }
    move_up() {
        if ((this.crosshair_Matrix[0][3]) * (this.crosshair_Matrix[0][3]) + (this.crosshair_Matrix[1][3] + 0.2) * (this.crosshair_Matrix[1][3] + 0.2) < 72.25 && !this.catching) {
            this.crosshair_Matrix = this.crosshair_Matrix.times(Mat4.translation([0, 0.2, 0]));
            this.rod_Matrix = this.rod_Matrix.times(Mat4.translation([0, 0.1, 0]));
        }
    }
    move_down() {
        if ((this.crosshair_Matrix[0][3]) * (this.crosshair_Matrix[0][3]) + (this.crosshair_Matrix[1][3] - 0.2) * (this.crosshair_Matrix[1][3] - 0.2) < 72.25 && !this.catching) {
            this.crosshair_Matrix = this.crosshair_Matrix.times(Mat4.translation([0, -0.2, 0]));
            this.rod_Matrix = this.rod_Matrix.times(Mat4.translation([0, -.1, 0]));
        }
    }
    trigger_animation(graphics_state) {
        var desired = Mat4.look_at(Vec.of(0, -28, 8), Vec.of(0, 0, 0), Vec.of(0, 10, 0));
        desired = desired.map((x,i)=>Vec.from(graphics_state.camera_transform[i]).mix(x, .05));
        graphics_state.camera_transform = desired;
        this.animation_t += 0.01;
        if (this.animation_t >= 1)
            this.beginning_animation = false;
    }
    family_scene(graphics_state, world_matrix, t) {
        if ((t - this.start_zoom) <= 2) {
            var desired = Mat4.identity().times(Mat4.rotation(Math.PI / 2, [1, 0, 0]));
            desired = this.rock_Matrix;
            desired = Mat4.inverse(desired.times(Mat4.translation([0, 0, 100])));
            desired = desired.map((x,i)=>Vec.from(graphics_state.camera_transform[i]).mix(x, .1));
            graphics_state.camera_transform = desired;
            this.storedCamera = graphics_state.camera_transform;
        } else {
            this.zoom_animation = false;
            this.start_zoom = -1;
        }

    }

    gen_catch() {
        this.splash.play();
        this.fish_is_caught = true;
        this.caught_fish_material = this.materials.rudd_Fish;
        return true;
    }
    
    play_laughter(){
        this.laughter.play();
    }

    catch_fish() {
        this.total_times_tried += 1;
        // how many times user tries to catch fish by pressing control
        var x = this.crosshair_Matrix[0][3];
        var y = this.crosshair_Matrix[1][3];
        this.catching = true;

        if (Math.abs((this.king_Fish_Matrix[0][3] + Math.cos(this.king_angle) - 0.3 * Math.sin(this.king_angle)) - x) < 2 && Math.abs((this.king_Fish_Matrix[1][3] + 0.3 * Math.cos(this.king_angle) + Math.sin(this.king_angle)) - y) < 2 && !this.king_caught) {
            this.king_caught = this.gen_catch();
            this.king_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], -.5])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([1, .5, 1]));
            this.caught_fish_matrix = this.king_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0))).times(Mat4.scale([1, 0.5, 1]));
        } else if (Math.abs((this.mystery_Fish_Matrix[0][3] + Math.cos(this.mystery_angle)) - x) < 1 && Math.abs((this.mystery_Fish_Matrix[1][3] + Math.sin(this.mystery_angle)) - y) < 1 && !this.mystery_caught) {
            this.mystery_caught = this.gen_catch();
            this.mystery_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], -.5])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([1, .5, 1]));
            this.caught_fish_matrix = this.mystery_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0))).times(Mat4.scale([1, 0.5, 1]));
        } else if (Math.abs((this.plain_Fish_Matrix[0][3] + 0.25 * Math.cos(this.plain_angle)) - x) < 1 && Math.abs((this.plain_Fish_Matrix[1][3] + 0.25 * Math.sin(this.plain_angle)) - y) < 1 && !this.plain_caught) {
            this.plain_caught = this.gen_catch();
            this.plain_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.plain_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.plain1_Fish_Matrix[0][3] + 0.25 * Math.cos(this.plain1_angle)) - x) < 1 && Math.abs((this.plain1_Fish_Matrix[1][3] + 0.25 * Math.sin(this.plain1_angle)) - y) < 1 && !this.plain1_caught) {
            this.plain1_caught = this.gen_catch();
            this.plain1_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.plain1_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.plain2_Fish_Matrix[0][3] + 0.25 * Math.cos(this.plain2_angle)) - x) < 1 && Math.abs((this.plain2_Fish_Matrix[1][3] + 0.25 * Math.sin(this.plain2_angle)) - y) < 1 && !this.plain2_caught) {
            this.plain2_caught = this.gen_catch();
            this.plain2_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.plain2_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.small_Fry_Matrix[0][3] + 0.15 * Math.cos(this.fry_angle)) - x) < 1 && Math.abs((this.small_Fry_Matrix[1][3] + 0.15 * Math.sin(this.fry_angle)) - y) < 1 && !this.fry_caught) {
            this.fry_caught = this.gen_catch();
            this.small_Fry_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.small_Fry_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.small_Fry1_Matrix[0][3] + 0.15 * Math.cos(this.fry1_angle)) - x) < 1 && Math.abs((this.small_Fry1_Matrix[1][3] + 0.15 * Math.sin(this.fry1_angle)) - y) < 1 && !this.fry1_caught) {
            this.fry1_caught = this.gen_catch();
            this.small_Fry1_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.small_Fry1_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.small_Fry2_Matrix[0][3] + 0.15 * Math.cos(this.fry2_angle)) - x) < 1 && Math.abs((this.small_Fry2_Matrix[1][3] + 0.15 * Math.sin(this.fry2_angle)) - y) < 1 && !this.fry2_caught) {
            this.fry2_caught = this.gen_catch();
            this.small_Fry2_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.small_Fry2_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.small_Fry3_Matrix[0][3] + 0.15 * Math.cos(this.fry3_angle)) - x) < 1 && Math.abs((this.small_Fry3_Matrix[1][3] + 0.15 * Math.sin(this.fry3_angle)) - y) < 1 && !this.fry3_caught) {
            this.fry3_caught = this.gen_catch();
            this.small_Fry3_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.small_Fry3_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.small_Fry4_Matrix[0][3] + 0.15 * Math.cos(this.fry4_angle)) - x) < 1 && Math.abs((this.small_Fry4_Matrix[1][3] + 0.15 * Math.sin(this.fry4_angle)) - y) < 1 && !this.fry4_caught) {
            this.fry4_caught = this.gen_catch();
            this.small_Fry4_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.small_Fry4_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.touchy_Fish_Matrix[0][3] + (0.25) * Math.cos(this.touchy_angle)) - x) < 1 && Math.abs((this.touchy_Fish_Matrix[1][3] + Math.sin(this.touchy_angle)) - y) < 1 && !this.touchy_caught) {
            this.touchy_caught = this.gen_catch();
            this.touchy_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.touchy_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.nibbler_Matrix[0][3] + Math.cos(this.nibbler_angle)) - x) < 1 && Math.abs((this.nibbler_Matrix[1][3] + Math.sin(this.nibbler_angle)) - y) < 1 && !this.nibbler_caught) {
            this.nibbler_caught = this.gen_catch();
            this.nibbler_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.nibbler_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        }
    }

    // ***************************** BEGIN ANGLE HELPER FUNCTIONS *****************************

    random_king_angle() {
        var current_angle = Math.atan2((this.king_Fish_Matrix[1][3]), (this.king_Fish_Matrix[0][3]));
        this.king_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_mystery_angle() {
        var current_angle = Math.atan2((this.mystery_Fish_Matrix[1][3]), (this.mystery_Fish_Matrix[0][3]));
        this.mystery_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_plain_angle() {
        var current_angle = Math.atan2((this.plain_Fish_Matrix[1][3]), (this.plain_Fish_Matrix[0][3]));
        this.plain_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_plain1_angle() {
        var current_angle = Math.atan2((this.plain1_Fish_Matrix[1][3]), (this.plain1_Fish_Matrix[0][3]));
        this.plain1_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_plain2_angle() {
        var current_angle = Math.atan2((this.plain2_Fish_Matrix[1][3]), (this.plain2_Fish_Matrix[0][3]));
        this.plain2_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_fry_angle() {
        var current_angle = Math.atan2((this.small_Fry_Matrix[1][3]), (this.small_Fry_Matrix[0][3]));
        this.fry_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_fry1_angle() {
        var current_angle = Math.atan2((this.small_Fry1_Matrix[1][3]), (this.small_Fry1_Matrix[0][3]));
        this.fry1_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_fry2_angle() {
        var current_angle = Math.atan2((this.small_Fry2_Matrix[1][3]), (this.small_Fry2_Matrix[0][3]));
        this.fry2_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_fry3_angle() {
        var current_angle = Math.atan2((this.small_Fry3_Matrix[1][3]), (this.small_Fry3_Matrix[0][3]));
        this.fry3_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_fry4_angle() {
        var current_angle = Math.atan2((this.small_Fry4_Matrix[1][3]), (this.small_Fry4_Matrix[0][3]));
        this.fry4_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_touchy_angle() {
        var current_angle = Math.atan2((this.touchy_Fish_Matrix[1][3]), (this.touchy_Fish_Matrix[0][3]));
        this.touchy_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_nibbler_angle() {
        var current_angle = Math.atan2((this.nibbler_Matrix[1][3]), (this.nibbler_Matrix[0][3]));
        this.nibbler_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    // ***************************** END ANGLE HELPER FUNCTIONS ***************************** 

    // ***************************** START OF DISPLAY ***************************** 
    display(graphics_state) {
        this.time_to_fish += 1; // time alloted to catch fish
        if (this.time_to_fish > 1400) { //set roughly 30-40 seconds of fish catching
            this.ending_animation = true;
        }
        graphics_state.lights = this.lights;
        const t = graphics_state.animation_time / 1000
          , dt = graphics_state.animation_delta_time / 1000;
        this.time = t;
        if (this.beginning_animation && !this.ending_animation) {
            this.menu.play();
            if (!this.begin_animation)
                graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -5, 1030), Vec.of(0, 100, 0), Vec.of(0, 10, 0));
            let sign_Matrix = this.sign_Matrix.times(Mat4.rotation(Math.PI / 36, Vec.of(1, 0, 0))).times(Mat4.scale([3 / 2, 3 / 2, 3 / 2]));
            this.shapes.plane.draw(graphics_state, sign_Matrix, this.materials.start_sign);
            if (this.begin_animation) {
                this.trigger_animation(graphics_state)
                if (this.menu_volume > 0)
                    this.menu_volume = this.menu_volume - 0.01;
                else
                    this.menu.pause();
            }
        }

        if (!this.beginning_animation && this.ending_animation) {//ending scene, so this is where we draw the family
        // graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -5, 1030), Vec.of(0, 100, 0), Vec.of(0, 10, 0));
        //this.shapes.plane.draw(graphics_state, this.sign_Matrix, this.materials.end_sign);
        }

        if (!this.beginning_animation && this.ending_animation) {
            //      graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -5, 1030), Vec.of(0, 100, 0), Vec.of(0, 10, 0));
            //     this.shapes.plane.draw(graphics_state, this.sign_Matrix, this.materials.end_sign);

            if (this.fishing_ost_volume > 0)
                this.fishing_ost_volume -= 0.01;
            if (this.fishing_ost_volume <= 0 && this.fanfare_count == 0) {
                this.fishing_ost.pause();
                this.play_laughter();
                //this.fanfare.play();
                //this.fanfare_count = 1;
            }

            //transforming camera backwd
            if (!this.zoom_animation)
                graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -25, 10), Vec.of(0, 0, 0), Vec.of(0, 10, 0));
            else
                graphics_state.camera_transform = this.storedCamera;

            graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -28, 8), Vec.of(0, 0, 0), Vec.of(0, 10, 0));

            this.gl.depthMask(true);

            var accuracy = (((this.total_fish_caught / this.total_times_tried).toFixed(2)) * 100).toString();
            accuracy = "Your fishing accuracy is " + accuracy + " %";

            this.shapes.mText.set_string(accuracy);
            this.draw_the_enviroment(graphics_state, t);
            //this.shapes.mText.draw( graphics_state, this.mom_matrix.times(Mat4.scale([1/4, 1/4, 1/4])).times(Mat4.translation([-55, 0, 1])), this.materials.text_image );

            if (this.total_fish_caught >= 7) {
                this.shapes.rText.set_string("Nice Job! Maybe you're not useless after all!");
            } else if (this.total_fish_caught >= 6) {
                this.shapes.rText.set_string("Grandpa Terpazerp could do better!");
            } else if (this.total_fish_caught >= 5) {
                this.shapes.rText.set_string("Nice Job! Maybe you're not useless after all!");
            } else if (this.total_fish_caught >= 4) {
                this.shapes.rText.set_string("You, sir, are an oxygen thief!");
            } else if (this.total_fish_caught >= 3) {
                this.shapes.rText.set_string("You're the reason the gene pool needs a lifeguard");
            } else if (this.total_fish_caught >= 2) {
                this.shapes.rText.set_string("I'd slap you, but that would be animal abuse");
            } else if (this.total_fish_caught >= 1) {
                this.shapes.rText.set_string("Grandpa Terpazerp could do better!");
            } else {
                this.shapes.rText.set_string("Some babies were dropped on their heads but you were clearly thrown at a wall");
            }

            this.shapes.rText.draw( graphics_state, this.mom_matrix.times(Mat4.scale([1/4, 1/4, 1/4])).times(Mat4.translation([-55, 0, -6])), this.materials.text_image ); //draw response text            
            this.shapes.mom.draw(graphics_state,this.mom_matrix,this.materials.clouds.override({
            color: Color.of(241/255, 194/255, 125/255, 1),
            ambient: 0.9
            })); //draw the mum
            setTimeout(function() {}, 1000000); //essentially pause the program
        }

        if (!this.beginning_animation && !this.ending_animation) {
            // ***************************** Shadow Map *********************************
            // Helper function to draw the fish - Scene 1
            graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 5, 40, 1), Vec.of(0, 0, 0), Vec.of(0, 1, 0));

            this.draw_the_fish(graphics_state, t)
            //transforming camera to light source
            this.fishing_ost.play();
            this.scratchpad_context.drawImage(this.webgl_manager.canvas, 0, 0, 256, 256);
            this.texture.image.src = this.scratchpad.toDataURL("image/png");
            // Clear the canvas and start over, beginning scene 2:
            //               this.texture.image.src = this.result_img.src = this.scratchpad.toDataURL("image/png");
            this.webgl_manager.gl.clear(this.webgl_manager.gl.COLOR_BUFFER_BIT | this.webgl_manager.gl.DEPTH_BUFFER_BIT);
            //  ******************************* End Shadow Map ****************************

            //transforming camera backwd
            if (!this.zoom_animation)
                graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -25, 10), Vec.of(0, 0, 0), Vec.of(0, 10, 0));
            else
                graphics_state.camera_transform = this.storedCamera;

            graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -28, 8), Vec.of(0, 0, 0), Vec.of(0, 10, 0));
            // Draw the bottom of the pond
            this.shapes.sphere6.draw(graphics_state, this.bottom_Matrix, this.materials.shadow);

            this.gl.depthMask(false);

            this.draw_the_fish(graphics_state, t)

            this.gl.depthMask(true);

            // Draw Crosshairs
            if (this.catching && !this.fish_is_caught) {
                if (this.crosshair_Matrix[2][3] < 7.5 && this.catching_timer >= 0)
                    this.crosshair_Matrix[2][3] += 0.5;
                else if (this.crosshair_Matrix[2][3] > 0 && this.catching_timer == -1)
                    this.crosshair_Matrix[2][3] -= 0.3;
                if (this.catching_timer > 25)
                    this.catching_timer = -1;
                else if (this.catching_timer >= 0)
                    this.catching_timer++;
                if (this.crosshair_Matrix[2][3] <= 0 && this.catching_timer == -1) {
                    this.catching_timer = 0;
                    this.catching = false;
                }
            }
            this.draw_fishing_rod(graphics_state, t);
        }
        this.gl.depthMask(true);

        if (this.fish_is_caught) {
            this.caught_fish_animation(graphics_state, this.caught_fish_matrix, t);
            if (!this.fish_is_caught) {
                this.total_fish_caught += 1;
                // increment total fish counter

            }
            //this.family_scene(graphics_state,this.pine_tree_Matrix,t);
        }

        // Draw flattened blue sphere for temporary pond:
        this.shapes.pond.draw(graphics_state, this.pond_Matrix.times(Mat4.scale([1.8, 1.8, 1.8])), this.materials.pond);
        this.shapes.torus.draw(graphics_state, this.ground_Matrix, this.materials.ground);
        this.draw_the_enviroment(graphics_state, t);
    }

    // *************************************************************************
    // ***************************** DRAW FISHING ROD **************************
    // *************************************************************************
    draw_fishing_rod(graphics_state, t) {
        let rod_Matrix = this.rod_Matrix.times(Mat4.translation([0, -25, 0])).times(Mat4.rotation(-Math.PI / 6, Vec.of(1, 0, 0))).times(Mat4.scale([.05, .05, 2]));
        let sphere1_Matrix = this.crosshair_Matrix.times(Mat4.scale([.05, .05, .1]));
        let sphere2_Matrix = this.crosshair_Matrix.times(Mat4.scale([.05, .05, .1])).times(Mat4.translation([0, 0, 10 + 0.50 * Math.sin((6 * t) % (2 * Math.PI))]));
        let torus1_Matrix = this.crosshair_Matrix.times(Mat4.scale([.08, .08, .1])).times(Mat4.translation([0, 0, 10 + 0.50 * Math.sin((6 * t) % (2 * Math.PI))]));
        let torus2_Matrix = this.crosshair_Matrix.times(Mat4.scale([.08, .08, .01])).times(Mat4.translation([0, 0, 100 + 5 * Math.sin((6 * t) % (2 * Math.PI))]));
        let cylinder_Matrix = this.crosshair_Matrix.times(Mat4.scale([.01, .01, 20])).times(Mat4.translation([0, 0, 0.5]));
        this.shapes.cylinder.draw(graphics_state, rod_Matrix, this.materials.white.override({
            color: Color.of(1, 0, 1, 1)
        }));
        for (var i = 0; i < 8; i++) {
            rod_Matrix = rod_Matrix.times(Mat4.scale([20, 20, .5])).times(Mat4.translation([.1, .1, 1])).times(Mat4.rotation(-Math.PI / 50, Vec.of(1, 0, 0))).times(Mat4.translation([-.1, -.1, 1])).times(Mat4.scale([.05, .05, 2]));
            this.shapes.cylinder.draw(graphics_state, rod_Matrix, this.materials.white.override({
                color: Color.of(.3 - i * .02, .7 - .04, .2 - .02, 1)
            }));
            let kink_Matrix = rod_Matrix.times(Mat4.scale([20, 20, .5])).times(Mat4.translation([.1, .1, 1])).times(Mat4.rotation(-Math.PI / 100, Vec.of(1, 0, 0))).times(Mat4.translation([-.1, -.1, 1])).times(Mat4.scale([.06, .06, .06]));
            this.shapes.sphere6.draw(graphics_state, kink_Matrix, this.materials.white.override({
                color: Color.of(.2 - i * .02, .6 - .04, .1 - .02, 1)
            }));
        }
        this.shapes.sphere6.draw(graphics_state, sphere1_Matrix, this.materials.green);
        this.shapes.sphere6.draw(graphics_state, sphere2_Matrix, this.materials.green);
        this.shapes.torus.draw(graphics_state, torus1_Matrix, this.materials.red);
        this.shapes.torus.draw(graphics_state, torus2_Matrix, this.materials.white);
        this.shapes.cylinder.draw(graphics_state, cylinder_Matrix, this.materials.white.override({
            color: Color.of(.7, .7, .7, .5)
        }));
    }

    caught_fish_animation(graphics_state, fish_matrix, t) {
        if (this.crosshair_Matrix[2][3] < 8) {
            fish_matrix[2][3] = fish_matrix[2][3] + .1;
            fish_matrix = fish_matrix.times(Mat4.rotation(t, [1, 0, 0]));
            this.shapes.fish3D.draw(graphics_state, fish_matrix, this.caught_fish_material);
            this.crosshair_Matrix[2][3] += .1;
        }
        if (this.crosshair_Matrix[2][3] > 2) {
            this.zoom_animation = true;
            if (this.start_zoom == -1) {
                this.start_zoom = t;
            }
            if ((t - this.start_zoom) > 2) {
                this.fish_is_caught = false;
                this.zoom_animation = false;
                this.start_zoom = -1;
            }
        }
    }

    // *************************************************************************
    // ***************************** DRAW THE ENVIROMETNT **********************
    // *************************************************************************
    draw_stars(graphics_state, t) {
        for (var i = 0; i < 2500; i += 5) {
            let star_Matrix = Mat4.identity().times(Mat4.translation([i % 41 + i % 159 - 100, 75, i % 23 + i % 77])).times(Mat4.scale([.3,.3,.3]));
            let star_Matrix2 = star_Matrix.times(Mat4.rotation(Math.PI/4, Vec.of(0,1,0)));
            this.shapes.box.draw(graphics_state, star_Matrix, this.materials.white);
            this.shapes.box.draw(graphics_state, star_Matrix2, this.materials.yellow);
        }
    }

    draw_tree(graphics_state, t, trans_vec, scale_vec) {
        let bark_Matrix = Mat4.identity().times(Mat4.translation(trans_vec)).times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.scale(scale_vec));
        trans_vec[2] += .5;
        let branch_Matrix = Mat4.identity().times(Mat4.translation(trans_vec)).times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.scale(scale_vec));
        this.shapes.pine_tree_bark.draw(graphics_state, bark_Matrix, this.materials.bark);
        this.shapes.pine_tree_branch.draw(graphics_state, branch_Matrix, this.materials.branch);
    }

    draw_the_enviroment(graphics_state, t) {
        let tree_list = [[[12, 22, 10], [3.5, 3.5, 3.5]], [[-15, 30, 28], [10, 10, 10]], [[30, 24, 28], [10, 10, 10]], [[0, 20, 10], [3.5, 3.5, 3.5]], [[-18, 7, 12], [4.5, 4.5, 4.5]], [[-9, 19, 12], [4, 4, 4]], [[-16, 16, 8], [3, 3, 3]], [[8, 20, 7], [2.5, 2.5, 2.5]], [[15, 5, 14], [5, 5, 5]], [[10, -17, 8], [3, 3, 3]], [[-9, -16, 8], [2.5, 2.5, 2.5]]];
        for (var i = 0; i < tree_list.length; i++) {
            this.draw_tree(graphics_state, t, tree_list[i][0], tree_list[i][1]);
        }
        this.shapes.plane.draw(graphics_state, this.backdrop_Matrix, this.materials.clouds.override({
            color: Color.of(.1, .4, .5, 1),
            ambient: 0.9
        }));
        this.draw_stars(graphics_state,t);
    }

    // *************************************************************************
    // ***************************** DRAW THE FISH *****************************
    // *************************************************************************

    draw_the_fish(graphics_state, t) {
        // ***************************** BEGIN KING OF THE POND *****************************
        let king_model_transform = Mat4.identity();

        if (!this.king_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.king_Fish_Matrix[0][3] + Math.cos(this.king_angle) - 0.3 * Math.sin(this.king_angle)) > 5.5 || Math.abs(this.king_Fish_Matrix[1][3] + 0.3 * Math.cos(this.king_angle) + Math.sin(this.king_angle)) > 5.5) && Math.round((t % 0.3) * 10) / 10 == 0) {
                this.random_king_angle();
            }
            // Code block to draw King fish      
            if (t > this.king_spawn_time && t < this.king_spawn_time + 0.2) {
                if (this.king_model_spawn[0][0] < 2) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.king_model_spawn = this.king_model_spawn.times(Mat4.scale([1.4, 1.4, 1.4]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.king_model_spawn, this.materials.rudd_Fish);
                //this.shapes.plane.draw( graphics_state, this.king_model_spawn, this.materials.king_Fish);
                this.king_Fish_Matrix[0][3] = 0;
                this.king_Fish_Matrix[1][3] = 0;
            }
            if (t > this.king_spawn_time + 0.2) {
                king_model_transform = this.king_Fish_Matrix.times(Mat4.translation([(6 / (t - this.king_dist)) * (0.05) * Math.cos(this.king_angle), (6 / (t - this.king_dist)) * (0.05) * Math.sin(this.king_angle), 0]));

                if (6 / (t - this.king_dist) < 0.6) {
                    this.king_dist += 9;
                }

                if (t - this.king_dist > 10) {
                    this.king_dist += 9;
                }

                this.king_Fish_Matrix = king_model_transform;
                king_model_transform = king_model_transform.times(Mat4.rotation(this.king_angle, Vec.of(0, 0, 1)))
                king_model_transform = king_model_transform.times(Mat4.scale([2, 1.5, 2]));
                this.shapes.fish3D.draw(graphics_state, king_model_transform, this.materials.rudd_Fish);
                //this.shapes.plane.draw( graphics_state, king_model_transform, this.materials.king_Fish);
            }
        }

        // ***************************** END KING OF THE POND *****************************  
        // ***************************** BEGIN MYSTERY FISH *****************************
        let mystery_model_transform = Mat4.identity();

        if (!this.mystery_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.mystery_Fish_Matrix[0][3] + Math.cos(this.mystery_angle)) > 5 || Math.abs(this.mystery_Fish_Matrix[1][3] + Math.sin(this.mystery_angle)) > 5) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_mystery_angle();
            }

            // Code block to draw Mystery fish 
            if (t > this.mystery_spawn_time && t < this.mystery_spawn_time + 0.2) {
                if (this.mystery_model_spawn[0][0] < 2) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.mystery_model_spawn = this.mystery_model_spawn.times(Mat4.scale([1.4, 1.4, 1.4]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.mystery_model_spawn, this.materials.rudd_Fish);

                this.mystery_Fish_Matrix[0][3] = 0;
                this.mystery_Fish_Matrix[1][3] = 0;
            }

            if (t > this.mystery_spawn_time + 0.2) {
                mystery_model_transform = this.mystery_Fish_Matrix.times(Mat4.translation([(5 / (t - this.mystery_dist)) * (0.05) * Math.cos(this.mystery_angle), (5 / (t - this.mystery_dist)) * (0.05) * Math.sin(this.mystery_angle), 0]));

                if (6 / (t - this.mystery_dist) < 0.83) {
                    this.mystery_dist += 1;
                }

                if (t - this.mystery_dist > 2) {
                    this.mystery_dist += 1;
                }
                this.mystery_Fish_Matrix = mystery_model_transform;
                mystery_model_transform = mystery_model_transform.times(Mat4.rotation(this.mystery_angle, Vec.of(0, 0, 1)))
                mystery_model_transform = mystery_model_transform.times(Mat4.scale([2, 1.5, 2]));
                this.shapes.fish3D.draw(graphics_state, mystery_model_transform, this.materials.rudd_Fish)
            }
        }

        // ***************************** END MYSTERY FISH ***************************** 

        // ***************************** BEGIN PLAIN FISH *****************************

        let plain_model_transform = Mat4.identity();

        if (!this.plain_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.plain_Fish_Matrix[0][3] + 0.25 * Math.cos(this.plain_angle)) > 6 || Math.abs(this.plain_Fish_Matrix[1][3] + 0.25 * Math.sin(this.plain_angle)) > 6) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_plain_angle();
            }

            // Code block to draw Plain fish      
            if (t > this.plain_spawn_time && t < this.plain_spawn_time + 0.2) {
                if (this.plain_model_spawn[0][0] < .5) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.plain_model_spawn = this.plain_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                //this.shapes.plane.draw( graphics_state, this.plain_model_spawn, this.materials.plain_Fish);
                this.shapes.fish3D.draw(graphics_state, plain_model_transform, this.materials.rudd_Fish);
            }

            if (t > this.plain_spawn_time + 0.2) {
                plain_model_transform = this.plain_Fish_Matrix.times(Mat4.translation([(0.07) * Math.cos(this.plain_angle), (0.07) * Math.sin(this.plain_angle), 0]));
                this.plain_Fish_Matrix = plain_model_transform;
                plain_model_transform = plain_model_transform.times(Mat4.rotation(this.plain_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, plain_model_transform, this.materials.rudd_Fish);
                //this.shapes.plane.draw( graphics_state, plain_model_transform, this.materials.plain_Fish);
            }
        }

        // ***************************** END PLAIN FISH *****************************  

        // ***************************** BEGIN PLAIN1 FISH *****************************

        let plain1_model_transform = Mat4.identity();

        if (!this.plain1_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.plain1_Fish_Matrix[0][3] + 0.25 * Math.cos(this.plain1_angle)) > 6 || Math.abs(this.plain1_Fish_Matrix[1][3] + 0.25 * Math.sin(this.plain1_angle)) > 6) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_plain1_angle();
            }

            // Code block to draw plain1 fish      
            if (t > this.plain1_spawn_time && t < this.plain1_spawn_time + 0.2) {
                if (this.plain1_model_spawn[0][0] < .5) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.plain1_model_spawn = this.plain1_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.plain1_model_spawn, this.materials.rudd_Fish);
            }

            if (t > this.plain1_spawn_time + 0.2) {
                plain1_model_transform = this.plain1_Fish_Matrix.times(Mat4.translation([(0.07) * Math.cos(this.plain1_angle), (0.07) * Math.sin(this.plain1_angle), 0]));
                this.plain1_Fish_Matrix = plain1_model_transform;
                plain1_model_transform = plain1_model_transform.times(Mat4.rotation(this.plain1_angle, Vec.of(0, 0, 1)))

                this.shapes.fish3D.draw(graphics_state, plain1_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END PLAIN1 FISH *****************************  

        // ***************************** BEGIN PLAIN2 FISH *****************************

        let plain2_model_transform = Mat4.identity();

        if (!this.plain2_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.plain2_Fish_Matrix[0][3] + 0.25 * Math.cos(this.plain2_angle)) > 6 || Math.abs(this.plain2_Fish_Matrix[1][3] + 0.25 * Math.sin(this.plain2_angle)) > 6) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_plain2_angle();
            }

            // Code block to draw plain2 fish      
            if (t > this.plain2_spawn_time && t < this.plain2_spawn_time + 0.2) {
                if (this.plain2_model_spawn[0][0] < .5) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.plain2_model_spawn = this.plain2_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.plain2_model_spawn, this.materials.rudd_Fish);
            }

            if (t > this.plain2_spawn_time + 0.2) {
                plain2_model_transform = this.plain2_Fish_Matrix.times(Mat4.translation([(0.07) * Math.cos(this.plain2_angle), (0.07) * Math.sin(this.plain2_angle), 0]));
                this.plain2_Fish_Matrix = plain2_model_transform;
                plain2_model_transform = plain2_model_transform.times(Mat4.rotation(this.plain2_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, plain2_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END PLAIN2 FISH *****************************  

        // ***************************** BEGIN SMALL FRY *****************************

        let fry_model_transform = Mat4.identity();

        if (!this.fry_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.small_Fry_Matrix[0][3] + 0.05 * Math.cos(this.fry_angle)) > 5 || Math.abs(this.small_Fry_Matrix[1][3] + 0.05 * Math.sin(this.fry_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_fry_angle();
            }

            // Code block to draw Small Fry      
            if (t > this.fry_spawn_time && t < this.fry_spawn_time + 0.2) {
                if (this.fry_model_spawn[0][0] < .25) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.fry_model_spawn = this.fry_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.fry_model_spawn, this.materials.rudd_Fish);
            }

            if (t > this.fry_spawn_time + 0.2) {
                fry_model_transform = this.small_Fry_Matrix.times(Mat4.translation([(4 / (t - this.fry_dist)) * (0.05) * Math.cos(this.fry_angle), (4 / (t - this.fry_dist)) * (0.05) * Math.sin(this.fry_angle), 0]));

                if (4 / (t - this.fry_dist) < 0.8) {
                    this.fry_dist += 4;
                }

                if (t - this.fry_dist > 10) {
                    this.fry_dist += 9;
                }
                this.small_Fry_Matrix = fry_model_transform;
                fry_model_transform = fry_model_transform.times(Mat4.rotation(this.fry_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, fry_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END SMALL FRY *****************************

        // ***************************** BEGIN SMALL FRY1 *****************************

        let fry1_model_transform = Mat4.identity();

        if (!this.fry1_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.small_Fry1_Matrix[0][3] + 0.10 * Math.cos(this.fry1_angle)) > 5 || Math.abs(this.small_Fry1_Matrix[1][3] + 0.10 * Math.sin(this.fry1_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_fry1_angle();
            }

            // Code block to draw Small Fry      
            if (t > this.fry1_spawn_time && t < this.fry1_spawn_time + 0.2) {
                if (this.fry1_model_spawn[0][0] < .25) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.fry1_model_spawn = this.fry1_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.fry1_model_spawn, this.materials.rudd_Fish);
            }

            if (t > this.fry1_spawn_time + 0.2) {
                fry1_model_transform = this.small_Fry1_Matrix.times(Mat4.translation([(4 / (t - this.fry1_dist)) * (0.10) * Math.cos(this.fry1_angle), (4 / (t - this.fry1_dist)) * (0.10) * Math.sin(this.fry1_angle), 0]));

                if (4 / (t - this.fry1_dist) < 0.8) {
                    this.fry1_dist += 2;
                }

                if (t - this.fry1_dist > 10) {
                    this.fry1_dist += 5;
                }
                this.small_Fry1_Matrix = fry1_model_transform;
                fry1_model_transform = fry1_model_transform.times(Mat4.rotation(this.fry1_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, fry1_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END SMALL FRY1 *****************************  

        // ***************************** BEGIN SMALL FRY2 *****************************

        let fry2_model_transform = Mat4.identity();

        if (!this.fry2_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.small_Fry2_Matrix[0][3] + 0.10 * Math.cos(this.fry2_angle)) > 5 || Math.abs(this.small_Fry2_Matrix[1][3] + 0.10 * Math.sin(this.fry2_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_fry2_angle();
            }

            // Code block to draw Small Fry      
            if (t > this.fry2_spawn_time && t < this.fry2_spawn_time + 0.2) {
                if (this.fry2_model_spawn[0][0] < .25) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.fry2_model_spawn = this.fry2_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.fry2_model_spawn, this.materials.rudd_Fish);
            }

            if (t > this.fry2_spawn_time + 0.2) {
                fry2_model_transform = this.small_Fry2_Matrix.times(Mat4.translation([0.1 * Math.cos(this.fry2_angle), 0.1 * Math.sin(this.fry2_angle), 0]));
                this.small_Fry2_Matrix = fry2_model_transform;
                fry2_model_transform = fry2_model_transform.times(Mat4.rotation(this.fry2_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, fry2_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END SMALL FRY2 *****************************  

        // ***************************** BEGIN SMALL FRY3 *****************************

        let fry3_model_transform = Mat4.identity();

        if (!this.fry3_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.small_Fry3_Matrix[0][3] + 0.10 * Math.cos(this.fry3_angle)) > 5 || Math.abs(this.small_Fry3_Matrix[1][3] + 0.10 * Math.sin(this.fry3_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_fry3_angle();
            }

            // Code block to draw Small Fry      
            if (t > this.fry3_spawn_time && t < this.fry3_spawn_time + 0.2) {
                if (this.fry3_model_spawn[0][0] < .25) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.fry3_model_spawn = this.fry3_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.fry3_model_spawn, this.materials.rudd_Fish);
            }

            if (t > this.fry3_spawn_time + 0.2) {
                fry3_model_transform = this.small_Fry3_Matrix.times(Mat4.translation([0.1 * Math.cos(this.fry3_angle), 0.1 * Math.sin(this.fry3_angle), 0]));
                this.small_Fry3_Matrix = fry3_model_transform;
                fry3_model_transform = fry3_model_transform.times(Mat4.rotation(this.fry3_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, fry3_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END SMALL FRY3 *****************************  

        // ***************************** BEGIN SMALL FRY4 *****************************

        let fry4_model_transform = Mat4.identity();

        if (!this.fry4_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.small_Fry4_Matrix[0][3] + 0.15 * Math.cos(this.fry4_angle)) > 5 || Math.abs(this.small_Fry4_Matrix[1][3] + 0.15 * Math.sin(this.fry4_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_fry4_angle();
            }

            // Code block to draw Small Fry      
            if (t > this.fry4_spawn_time && t < this.fry4_spawn_time + 0.2) {
                if (this.fry4_model_spawn[0][0] < .25) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.fry4_model_spawn = this.fry4_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.fry4_model_spawn, this.materials.rudd_Fish);
            }

            if (t > this.fry4_spawn_time + 0.2) {
                fry4_model_transform = this.small_Fry4_Matrix.times(Mat4.translation([0.2 * Math.cos(this.fry4_angle), 0.2 * Math.sin(this.fry4_angle), 0]));
                this.small_Fry4_Matrix = fry4_model_transform;
                fry4_model_transform = fry4_model_transform.times(Mat4.rotation(this.fry4_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, fry4_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END SMALL FRY4 ***************************** 

        // ***************************** BEGIN TOUCHY FISH *****************************

        let touchy_model_transform = Mat4.identity();

        if (!this.touchy_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.touchy_Fish_Matrix[0][3] + (0.25) * Math.cos(this.touchy_angle)) > 5 || Math.abs(this.touchy_Fish_Matrix[1][3] + Math.sin(this.touchy_angle)) > 5) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_touchy_angle();
            }

            // Code block to draw Touchy fish      
            if (t > this.touchy_spawn_time && t < this.touchy_spawn_time + 0.2) {
                if (this.touchy_model_spawn[0][0] < .5) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.touchy_model_spawn = this.touchy_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.touchy_model_spawn, this.materials.rudd_Fish);
            }

            if (t > this.touchy_spawn_time + 0.2) {
                touchy_model_transform = this.touchy_Fish_Matrix.times(Mat4.translation([(8 / (t - this.touchy_dist)) * (0.02) * Math.cos(this.touchy_angle), (8 / (t - this.touchy_dist)) * (0.02) * Math.sin(this.touchy_angle), 0]));

                if (6 / (t - this.touchy_dist) < 0.5) {
                    this.touchy_dist += 4;
                }

                if (t - this.touchy_dist > 5) {
                    this.touchy_dist += 4;
                }
                this.touchy_Fish_Matrix = touchy_model_transform;
                touchy_model_transform = touchy_model_transform.times(Mat4.rotation(this.touchy_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, touchy_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END TOUCHY FISH ***************************** 

        // ***************************** BEGIN NIBBLER *****************************

        let nibbler_model_transform = Mat4.identity();

        if (!this.nibbler_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.nibbler_Matrix[0][3] + Math.cos(this.nibbler_angle)) > 5 || Math.abs(this.nibbler_Matrix[1][3] + Math.sin(this.nibbler_angle)) > 5) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_nibbler_angle();
                this.nibbler_direction *= -1;
            }

            if (Math.round((t % 1.5) * 10) / 10 == .7) {
                this.nibbler_angle = (Math.atan2((this.nibbler_Matrix[1][3]), (this.nibbler_Matrix[0][3]))) + (this.nibbler_direction * (0.01));
            }

            // Code block to draw Nibbler      
            if (t > this.nibbler_spawn_time && t < this.nibbler_spawn_time + 0.2) {
                if (this.nibbler_model_spawn[0][0] < 0.5) {
                    if (Math.round((t % 0.1) * 10) / 10 == 0) {
                        this.nibbler_model_spawn = this.nibbler_model_spawn.times(Mat4.scale([1.4, 1.4, 1.4]));
                    }
                }
                this.shapes.fish3D.draw(graphics_state, this.nibbler_model_spawn, this.materials.rudd_Fish);
                this.nibbler_Matrix[0][3] = 0;
                this.nibbler_Matrix[1][3] = 0;
            }

            if (t > this.nibbler_spawn_time + 0.2) {
                nibbler_model_transform = this.nibbler_Matrix.times(Mat4.translation([(0.15) * Math.cos(this.nibbler_angle), (0.15) * Math.sin(this.nibbler_angle), 0]));
                this.nibbler_Matrix = nibbler_model_transform;
                nibbler_model_transform = nibbler_model_transform.times(Mat4.rotation(this.nibbler_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, nibbler_model_transform, this.materials.rudd_Fish);
            }
        }

        // ***************************** END NIBBLER FISH *****************************
    }

}

class Texture_Scroll_X extends Phong_Shader {
    fragment_glsl_code() {
        return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.di
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec2 mVector = f_tex_coord; 
          mat4 mMatrix = mat4(vec4(1., 0., 0., 0.), vec4(0., 1., 0., 0.), vec4( 0., 0., 1., 0.), vec4( mod(2.0 * animation_time, 88.) , 0., 0., 1.)); 
          vec4 tempVector = vec4(mVector, 0, 0); 
          tempVector = tempVector + vec4(1., 1., 0., 1.); 
          tempVector = mMatrix * tempVector; 

          vec4 tex_color = texture2D( texture, tempVector.xy );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}

class Texture_Rotate extends Phong_Shader {
    fragment_glsl_code() {
        return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.

          vec2 mVector = f_tex_coord; 
          mat4 mMatrix = mat4(cos( mod((6.28) * .25 * animation_time, 44. * 3.14)), sin( mod((6.28) * .25 * animation_time, 44. * 3.14)), 0, 0, -sin( mod((6.28) * .25 * animation_time, 44. * 3.14)), cos( mod((6.28) * .25 * animation_time, 44. * 3.14)), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
          vec4 tempVector = vec4(mVector, 0, 0); 
          tempVector = tempVector + vec4(-.5, -.5, 0., 0.);
          tempVector = mMatrix * tempVector; 
          tempVector = tempVector + vec4(.5, .5, 0., 0.);
          
          vec4 tex_color = texture2D( texture, tempVector.xy );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}
