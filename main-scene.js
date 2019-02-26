window.Fishing_Game = window.classes.Fishing_Game = class Fishing_Game extends Scene_Component {
    constructor(context, control_box) {
        super(context, control_box);
        if (!context.globals.has_controls)
            context.register_scene_component(new Movement_Controls(context,control_box.parentElement.insertCell()));

        // Opening Screen
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
            rock: new Shape_From_File("assets/Rock.obj"),
            fish3D: new Shape_From_File("assets/RuddFish.obj"),
            circle: new Circle(),
            mom: new Shape_From_File("assets/mom.obj"),
            mText: new Text_Line(35),
            rText: new Text_Line(200),
            eye: new Shape_From_File("assets/eye_right.obj"),
            tShirt: new Shape_From_File("assets/tShirt.obj"),
            pants: new Shape_From_File("assets/pants.obj"),
            hair: new Shape_From_File("assets/hair.obj")
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
            rudd_Fish: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/RuddFish.png", false)
            }),
            eye_img: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 0.5,
                texture: context.get_instance("assets/eye_map.jpg", false)
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

        this.big_fish1_Fish_Matrix = Mat4.identity().times(Mat4.translation([20, 20, -.15]));
        this.big_fish1_angle = 0
        this.big_fish1_model_spawn = Mat4.identity().times(Mat4.scale([.1, .05, .1]));
        this.big_fish1_spawn_time = Math.random() * 12 + 15;
        this.big_fish1_dist = 0.01;
        this.big_fish1_caught = false;

        this.big_fish2_Fish_Matrix = Mat4.identity().times(Mat4.translation([20, 20, -0.1]));
        this.big_fish2_angle = 0;
        this.big_fish2_model_spawn = Mat4.identity().times(Mat4.scale([.1, .05, .1]));
        this.big_fish2_spawn_time = Math.random() * 12 + 10;
        this.big_fish2_dist = 0.01;
        this.big_fish2_caught = false;
        this.big_fish2_direction = -1;

        this.reg_Fish_Matrix = Mat4.identity().times(Mat4.translation([Math.random() * 2 - 1, Math.random() * 2 - 1, 0])).times(Mat4.scale([.7, .7, .7]));
        this.reg_angle = Math.random() * 2 * Math.PI;
        this.reg_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.reg_spawn_time = Math.random() * 8;
        this.reg_caught = false;

        this.reg1_Fish_Matrix = Mat4.identity().times(Mat4.translation([Math.random() * 2 - 1, Math.random() * 2 - 1, -0.05])).times(Mat4.scale([.7, .7, .7]));
        this.reg1_angle = Math.random() * 2 * Math.PI;
        this.reg1_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.reg1_spawn_time = Math.random() * 8;
        this.reg1_caught = false;

        this.reg2_Fish_Matrix = Mat4.identity().times(Mat4.translation([Math.random() * 2 - 1, Math.random() * 2 - 1, -0.05])).times(Mat4.scale([.7, .7, .7]));
        this.reg2_angle = Math.random() * 2 * Math.PI;
        this.reg2_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.reg2_spawn_time = Math.random() * 8;
        this.reg2_caught = false;

        this.tinyFish_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.1])).times(Mat4.scale([.5, .5, .5]));
        this.tinyFish_Matrix = this.tinyFish_Matrix.times(Mat4.translation([0, -5, 0]));
        this.tinyFish_angle = Math.random() * 2 * Math.PI;
        this.tinyFish_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.tinyFish_spawn_time = Math.random() * 8;
        this.tinyFish_dist = 0.01;
        this.tinyFish_caught = false;

        this.tinyFish1_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.05])).times(Mat4.scale([.5, .5, .5]));
        this.tinyFish1_angle = Math.random() * 2 * Math.PI;
        this.tinyFish1_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.tinyFish1_spawn_time = Math.random() * 8;
        this.tinyFish1_dist = 0.01;
        this.tinyFish1_caught = false;

        this.tinyFish2_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.05])).times(Mat4.scale([.5, .5, .5]));
        this.tinyFish2_angle = Math.random() * 2 * Math.PI;
        this.tinyFish2_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.tinyFish2_spawn_time = Math.random() * 8;
        this.tinyFish2_caught = false;

        this.tinyFish3_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.05])).times(Mat4.scale([.5, .5, .5]));
        this.tinyFish3_angle = Math.random() * 2 * Math.PI;
        this.tinyFish3_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.tinyFish3_spawn_time = Math.random() * 8;
        this.tinyFish3_caught = false;

        this.tinyFish4_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 0.05])).times(Mat4.scale([.5, .5, .5]));
        this.tinyFish4_angle = Math.random() * 2 * Math.PI;
        this.tinyFish4_model_spawn = Mat4.identity().times(Mat4.scale([.005, .005, .005]));
        this.tinyFish4_spawn_time = Math.random() * 8;
        this.tinyFish4_caught = false;

        this.med_fish_Fish_Matrix = Mat4.identity().times(Mat4.translation([20, 20, 0.1])).times(Mat4.scale([.5, .5, .5]));
        this.med_fish_angle = 0;
        this.med_fish_model_spawn = Mat4.identity().times(Mat4.scale([.05, .05, .05]));
        this.med_fish_spawn_time = Math.random() * 12 + 10;
        this.med_fish_dist = 0.01;
        this.med_fish_caught = false;

        this.med_fish2_Matrix = Mat4.identity().times(Mat4.translation([20, 20, 0.15])).times(Mat4.scale([.5, .5, .5]));
        this.med_fish2_angle = 0;
        this.med_fish2_model_spawn = Mat4.identity().times(Mat4.scale([.05, .05, .05]));
        this.med_fish2_spawn_time = Math.random() * 12 + 1;
        this.med_fish2_direction = -1;
        this.med_fish2_caught = false;

        // RENDER TERRAIN MATRIXES
        this.sign_Matrix = Mat4.identity().times(Mat4.scale([10, 10, 10])).times(Mat4.translation([0, 0, 100]));

        this.backdrop_Matrix = Mat4.identity().times(Mat4.translation([0, 100, 1])).times(Mat4.rotation(1.6, Vec.of(1, 0, 0))).times(Mat4.scale([200, 100, 1]));

        this.star_array = new Array(250).fill([0, 0]);

        this.bottom_Matrix = Mat4.identity();
        this.bottom_Matrix = this.bottom_Matrix.times(Mat4.translation([0, 0, -1])).times(Mat4.scale([15, 15, .01])).times(Mat4.rotation(Math.PI, [1.3, 0, 0]));

        this.rock_Matrix = Mat4.identity().times(Mat4.rotation(1.6, Vec.of(0, 1, -.1))).times(Mat4.translation([-0, 200, 11])).times(Mat4.scale([8, 2, 2]));

        this.fish3D_Matrix = Mat4.identity().times(Mat4.rotation(1, Vec.of(1, 0, -.1))).times(Mat4.translation([0, 0, 11])).times(Mat4.scale([8, 8, 8]));

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

    gen_catch() {
        this.splash.play();
        this.fish_is_caught = true;
        this.caught_fish_material = this.materials.rudd_Fish;
        return true;
    }

    play_laughter() {
        this.laughter.play();
    }

    catch_fish() {
        this.total_times_tried += 1;
        // how many times user tries to catch fish by pressing control
        var x = this.crosshair_Matrix[0][3];
        var y = this.crosshair_Matrix[1][3];
        this.catching = true;

        if (Math.abs((this.big_fish1_Fish_Matrix[0][3] + Math.cos(this.big_fish1_angle) - 0.3 * Math.sin(this.big_fish1_angle)) - x) < 2 && Math.abs((this.big_fish1_Fish_Matrix[1][3] + 0.3 * Math.cos(this.big_fish1_angle) + Math.sin(this.big_fish1_angle)) - y) < 2 && !this.big_fish1_caught) {
            this.big_fish1_caught = this.gen_catch();
            this.big_fish1_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], -2])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([1, .5, 1]));
            this.caught_fish_matrix = this.big_fish1_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0))).times(Mat4.scale([2, 1, 2]));
        } else if (Math.abs((this.big_fish2_Fish_Matrix[0][3] + Math.cos(this.big_fish2_angle)) - x) < 1 && Math.abs((this.big_fish2_Fish_Matrix[1][3] + Math.sin(this.big_fish2_angle)) - y) < 1 && !this.big_fish2_caught) {
            this.big_fish2_caught = this.gen_catch();
            this.big_fish2_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], -2])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([1, .5, 1]));
            this.caught_fish_matrix = this.big_fish2_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0))).times(Mat4.scale([2, 1, 2]));
        } else if (Math.abs((this.reg_Fish_Matrix[0][3] + 0.25 * Math.cos(this.reg_angle)) - x) < 1 && Math.abs((this.reg_Fish_Matrix[1][3] + 0.25 * Math.sin(this.reg_angle)) - y) < 1 && !this.reg_caught) {
            this.reg_caught = this.gen_catch();
            this.reg_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.reg_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.reg1_Fish_Matrix[0][3] + 0.25 * Math.cos(this.reg1_angle)) - x) < 1 && Math.abs((this.reg1_Fish_Matrix[1][3] + 0.25 * Math.sin(this.reg1_angle)) - y) < 1 && !this.reg1_caught) {
            this.reg1_caught = this.gen_catch();
            this.reg1_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.reg1_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.reg2_Fish_Matrix[0][3] + 0.25 * Math.cos(this.reg2_angle)) - x) < 1 && Math.abs((this.reg2_Fish_Matrix[1][3] + 0.25 * Math.sin(this.reg2_angle)) - y) < 1 && !this.reg2_caught) {
            this.reg2_caught = this.gen_catch();
            this.reg2_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.reg2_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.tinyFish_Matrix[0][3] + 0.15 * Math.cos(this.tinyFish_angle)) - x) < 1 && Math.abs((this.tinyFish_Matrix[1][3] + 0.15 * Math.sin(this.tinyFish_angle)) - y) < 1 && !this.tinyFish_caught) {
            this.tinyFish_caught = this.gen_catch();
            this.tinyFish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.tinyFish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.tinyFish1_Matrix[0][3] + 0.15 * Math.cos(this.tinyFish1_angle)) - x) < 1 && Math.abs((this.tinyFish1_Matrix[1][3] + 0.15 * Math.sin(this.tinyFish1_angle)) - y) < 1 && !this.tinyFish1_caught) {
            this.tinyFish1_caught = this.gen_catch();
            this.tinyFish1_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.tinyFish1_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.tinyFish2_Matrix[0][3] + 0.15 * Math.cos(this.tinyFish2_angle)) - x) < 1 && Math.abs((this.tinyFish2_Matrix[1][3] + 0.15 * Math.sin(this.tinyFish2_angle)) - y) < 1 && !this.tinyFish2_caught) {
            this.tinyFish2_caught = this.gen_catch();
            this.tinyFish2_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.tinyFish2_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.tinyFish3_Matrix[0][3] + 0.15 * Math.cos(this.tinyFish3_angle)) - x) < 1 && Math.abs((this.tinyFish3_Matrix[1][3] + 0.15 * Math.sin(this.tinyFish3_angle)) - y) < 1 && !this.tinyFish3_caught) {
            this.tinyFish3_caught = this.gen_catch();
            this.tinyFish3_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.tinyFish3_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.tinyFish4_Matrix[0][3] + 0.15 * Math.cos(this.tinyFish4_angle)) - x) < 1 && Math.abs((this.tinyFish4_Matrix[1][3] + 0.15 * Math.sin(this.tinyFish4_angle)) - y) < 1 && !this.tinyFish4_caught) {
            this.tinyFish4_caught = this.gen_catch();
            this.tinyFish4_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.tinyFish4_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.med_fish_Fish_Matrix[0][3] + (0.25) * Math.cos(this.med_fish_angle)) - x) < 1 && Math.abs((this.med_fish_Fish_Matrix[1][3] + Math.sin(this.med_fish_angle)) - y) < 1 && !this.med_fish_caught) {
            this.med_fish_caught = this.gen_catch();
            this.med_fish_Fish_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.med_fish_Fish_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        } else if (Math.abs((this.med_fish2_Matrix[0][3] + Math.cos(this.med_fish2_angle)) - x) < 1 && Math.abs((this.med_fish2_Matrix[1][3] + Math.sin(this.med_fish2_angle)) - y) < 1 && !this.med_fish2_caught) {
            this.med_fish2_caught = this.gen_catch();
            this.med_fish2_Matrix = Mat4.identity().times(Mat4.translation([this.crosshair_Matrix[0][3], this.crosshair_Matrix[1][3], 0])).times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.scale([.5, .5, .5]));
            this.caught_fish_matrix = this.med_fish2_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(1, 0, 0)));
        }
    }

    // Angle Functions
    random_big_fish1_angle() {
        var current_angle = Math.atan2((this.big_fish1_Fish_Matrix[1][3]), (this.big_fish1_Fish_Matrix[0][3]));
        this.big_fish1_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_big_fish2_angle() {
        var current_angle = Math.atan2((this.big_fish2_Fish_Matrix[1][3]), (this.big_fish2_Fish_Matrix[0][3]));
        this.big_fish2_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_reg_angle() {
        var current_angle = Math.atan2((this.reg_Fish_Matrix[1][3]), (this.reg_Fish_Matrix[0][3]));
        this.reg_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_reg1_angle() {
        var current_angle = Math.atan2((this.reg1_Fish_Matrix[1][3]), (this.reg1_Fish_Matrix[0][3]));
        this.reg1_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_reg2_angle() {
        var current_angle = Math.atan2((this.reg2_Fish_Matrix[1][3]), (this.reg2_Fish_Matrix[0][3]));
        this.reg2_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_tinyFish_angle() {
        var current_angle = Math.atan2((this.tinyFish_Matrix[1][3]), (this.tinyFish_Matrix[0][3]));
        this.tinyFish_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_tinyFish1_angle() {
        var current_angle = Math.atan2((this.tinyFish1_Matrix[1][3]), (this.tinyFish1_Matrix[0][3]));
        this.tinyFish1_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_tinyFish2_angle() {
        var current_angle = Math.atan2((this.tinyFish2_Matrix[1][3]), (this.tinyFish2_Matrix[0][3]));
        this.tinyFish2_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_tinyFish3_angle() {
        var current_angle = Math.atan2((this.tinyFish3_Matrix[1][3]), (this.tinyFish3_Matrix[0][3]));
        this.tinyFish3_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_tinyFish4_angle() {
        var current_angle = Math.atan2((this.tinyFish4_Matrix[1][3]), (this.tinyFish4_Matrix[0][3]));
        this.tinyFish4_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_med_fish_angle() {
        var current_angle = Math.atan2((this.med_fish_Fish_Matrix[1][3]), (this.med_fish_Fish_Matrix[0][3]));
        this.med_fish_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }
    random_med_fish2_angle() {
        var current_angle = Math.atan2((this.med_fish2_Matrix[1][3]), (this.med_fish2_Matrix[0][3]));
        this.med_fish2_angle = (current_angle + Math.PI) - (0.25 * Math.PI) + (Math.random() * 0.5 * Math.PI);
    }

    // START DISPLAY 
    display(graphics_state) {
        this.time_to_fish += 1;
        // time alloted to catch fish
        if (this.time_to_fish > 1400) {
            //set roughly 30-40 seconds of fish catching
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

        if (!this.beginning_animation && this.ending_animation) {
            if (this.fishing_ost_volume > 0)
                this.fishing_ost_volume -= 0.01;
            if (this.fishing_ost_volume <= 0) {
                this.fishing_ost.pause();
                this.play_laughter();
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

            let text_matrix = Mat4.identity().times(Mat4.translation([0, -25, 6.5])).times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.scale([3 / 5, 3 / 5, 3 / 5]));
            var responses = ["Son of a Fish", "Mr.Terzopoulos could do better!", "Dad you're a dumb bass", "Your brain is smaller than that fish", "Not bad for a bottom feeder", "Maybe you're not useless after all!", "Is that all we have for dinner?", "Nice Job!"];
            if (this.total_fish_caught < responses.length)
                this.shapes.rText.set_string(responses[this.total_fish_caught]);
            else
                this.shapes.rText.set_string(responses[responses.length - 1]);
            this.shapes.rText.draw(graphics_state, text_matrix.times(Mat4.translation([-6, 3, -4])).times(Mat4.scale([1 / 6, 1 / 6, 1 / 6])), this.materials.text_image);
            this.draw_kid(graphics_state, t);
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
            // this.texture.image.src = this.result_img.src = this.scratchpad.toDataURL("image/png");
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
        }

        // Draw flattened blue sphere for temporary pond:
        let pond_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 1])).times(Mat4.scale([7, 7, .01]));
        this.shapes.pond.draw(graphics_state, pond_Matrix.times(Mat4.scale([1.8, 1.8, 1.8])), this.materials.pond);
        this.draw_the_enviroment(graphics_state, t);
    }

    // DRAW FISHING ROD
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

    // DRAW Enviroment 
    draw_stars(graphics_state, t) {
        for (var i = 0; i < 250; i++) {
            if (Math.random() * 250 > 248) {
                this.star_array[i] = [Math.random() * 200 - 100, Math.random() * 110 - 10];
            }
            let star_Matrix = Mat4.identity().times(Mat4.translation([this.star_array[i][0], 75, this.star_array[i][1]])).times(Mat4.scale([.3, .3, .3]));
            let star_Matrix2 = star_Matrix.times(Mat4.rotation(Math.PI / 4, Vec.of(0, 1, 0)));
            this.shapes.box.draw(graphics_state, star_Matrix, this.materials.white);
            this.shapes.box.draw(graphics_state, star_Matrix2, this.materials.yellow);
        }
    }

    draw_tree(graphics_state, t, trans_vec, scale_vec) {
        let bark_Matrix = Mat4.identity().times(Mat4.translation(trans_vec)).times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.scale(scale_vec));
        trans_vec[2] += .1;
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
        this.draw_stars(graphics_state, t);
        let ground_Matrix = Mat4.identity().times(Mat4.translation([0, 0, 1])).times(Mat4.scale([42.6, 42.6, .01]));
        this.shapes.torus.draw(graphics_state, ground_Matrix, this.materials.ground);
    }

    draw_kid(graphics_state, t) {
        let kid_matrix = Mat4.identity().times(Mat4.translation([0, -25, 6.5])).times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.scale([3 / 5, 3 / 5, 3 / 5]));
        this.shapes.mom.draw(graphics_state, kid_matrix, this.materials.clouds.override({
            color: Color.of(241 / 255, 194 / 255, 125 / 255, 1),
            ambient: 0.9
        }));
        //right eye / left eye
        this.shapes.eye.draw(graphics_state, kid_matrix.times(Mat4.translation([0.3, 1.25, 0.3])).times(Mat4.rotation(Math.PI / 8, Vec.of(1, 0, 0))).times(Mat4.scale([1 / 7, 1 / 7, 1 / 7])), this.materials.eye_img);
        this.shapes.eye.draw(graphics_state, kid_matrix.times(Mat4.translation([-.3, 1.25, 0.2])).times(Mat4.rotation(Math.PI / 4, Vec.of(0, -1, 0))).times(Mat4.scale([1 / 6, 1 / 6, 1 / 6])), this.materials.eye_img);
        this.shapes.tShirt.draw(graphics_state, kid_matrix.times(Mat4.translation([0, -0.1, 0])).times(Mat4.scale([2 / 5, 2 / 5, 2 / 5])), this.materials.clouds.override({
            color: Color.of(50 / 255, 50 / 255, 50 / 255, 1),
            ambient: 0.9
        }));
        //shirt
        this.shapes.pants.draw(graphics_state, kid_matrix.times(Mat4.translation([0, -0.40, 0.15])).times(Mat4.scale([0.55, 0.55, 0.55])), this.materials.clouds.override({
            color: Color.of(20 / 255, 100 / 255, 200 / 255, 1),
            ambient: 0.9
        }));
        //pants
        this.shapes.hair.draw(graphics_state, kid_matrix.times(Mat4.translation([0, 1.5, 0])).times(Mat4.scale([0.5, 0.5, 0.5])), this.materials.clouds.override({
            color: Color.of(0 / 255, 0 / 255, 0 / 255, 1),
            ambient: 0.9
        }));
        //hair
        this.shapes.mom.draw(graphics_state, kid_matrix, this.materials.mom_img);
    }

    // DRAW fishies

    draw_the_fish(graphics_state, t) {
        //DRAW BIG FISH1
        let big_fish1_model_transform = Mat4.identity();
        if (!this.big_fish1_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.big_fish1_Fish_Matrix[0][3] + Math.cos(this.big_fish1_angle) - 0.3 * Math.sin(this.big_fish1_angle)) > 5.5 || Math.abs(this.big_fish1_Fish_Matrix[1][3] + 0.3 * Math.cos(this.big_fish1_angle) + Math.sin(this.big_fish1_angle)) > 5.5) && Math.round((t % 0.3) * 10) / 10 == 0) {
                this.random_big_fish1_angle();
            }
            if (t > this.big_fish1_spawn_time && t < this.big_fish1_spawn_time + 0.2) {
                if ((this.big_fish1_model_spawn[0][0] < 2) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.big_fish1_model_spawn = this.big_fish1_model_spawn.times(Mat4.scale([1, 1, 1]));
                this.shapes.fish3D.draw(graphics_state, this.big_fish1_model_spawn, this.materials.rudd_Fish);
                this.big_fish1_Fish_Matrix[0][3] = 0;
                this.big_fish1_Fish_Matrix[1][3] = 0;
            }
            if (t > this.big_fish1_spawn_time + 0.2) {
                big_fish1_model_transform = this.big_fish1_Fish_Matrix.times(Mat4.translation([(6 / (t - this.big_fish1_dist)) * (0.05) * Math.cos(this.big_fish1_angle), (6 / (t - this.big_fish1_dist)) * (0.05) * Math.sin(this.big_fish1_angle), 0]));
                if (6 / (t - this.big_fish1_dist) < 0.6)
                    this.big_fish1_dist += 9;
                if (t - this.big_fish1_dist > 10)
                    this.big_fish1_dist += 9;
                this.big_fish1_Fish_Matrix = big_fish1_model_transform;
                big_fish1_model_transform = big_fish1_model_transform.times(Mat4.rotation(this.big_fish1_angle, Vec.of(0, 0, 1)))
                big_fish1_model_transform = big_fish1_model_transform.times(Mat4.scale([2, 1.5, 2]));
                this.shapes.fish3D.draw(graphics_state, big_fish1_model_transform, this.materials.rudd_Fish);
            }
        }
        // DRAW BIG FISH2
        let big_fish2_model_transform = Mat4.identity();
        if (!this.big_fish2_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.big_fish2_Fish_Matrix[0][3] + Math.cos(this.big_fish2_angle)) > 5 || Math.abs(this.big_fish2_Fish_Matrix[1][3] + Math.sin(this.big_fish2_angle)) > 5) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_big_fish2_angle();
            }
            if (t > this.big_fish2_spawn_time && t < this.big_fish2_spawn_time + 0.2) {
                if ((this.big_fish2_model_spawn[0][0] < 2) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.big_fish2_model_spawn = this.big_fish2_model_spawn.times(Mat4.scale([1.4, 1.4, 1.4]));
                this.shapes.fish3D.draw(graphics_state, this.big_fish2_model_spawn, this.materials.rudd_Fish);
                this.big_fish2_Fish_Matrix[0][3] = 0;
                this.big_fish2_Fish_Matrix[1][3] = 0;
            }
            if (t > this.big_fish2_spawn_time + 0.2) {
                big_fish2_model_transform = this.big_fish2_Fish_Matrix.times(Mat4.translation([(5 / (t - this.big_fish2_dist)) * (0.05) * Math.cos(this.big_fish2_angle), (5 / (t - this.big_fish2_dist)) * (0.05) * Math.sin(this.big_fish2_angle), 0]));
                if (6 / (t - this.big_fish2_dist) < 0.83)
                    this.big_fish2_dist += 1;
                if (t - this.big_fish2_dist > 2)
                    this.big_fish2_dist += 1;
                this.big_fish2_Fish_Matrix = big_fish2_model_transform;
                big_fish2_model_transform = big_fish2_model_transform.times(Mat4.rotation(this.big_fish2_angle, Vec.of(0, 0, 1)))
                big_fish2_model_transform = big_fish2_model_transform.times(Mat4.scale([2, 1.5, 2]));
                this.shapes.fish3D.draw(graphics_state, big_fish2_model_transform, this.materials.rudd_Fish)
            }
        }
        // DRAW REG FISH
        let reg_model_transform = Mat4.identity();
        if (!this.reg_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.reg_Fish_Matrix[0][3] + 0.25 * Math.cos(this.reg_angle)) > 6 || Math.abs(this.reg_Fish_Matrix[1][3] + 0.25 * Math.sin(this.reg_angle)) > 6) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_reg_angle();
            }
            if (t > this.reg_spawn_time && t < this.reg_spawn_time + 0.2) {
                if ((this.reg_model_spawn[0][0] < .5) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.reg_model_spawn = this.reg_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                this.shapes.fish3D.draw(graphics_state, reg_model_transform, this.materials.rudd_Fish);
            }
            if (t > this.reg_spawn_time + 0.2) {
                reg_model_transform = this.reg_Fish_Matrix.times(Mat4.translation([(0.07) * Math.cos(this.reg_angle), (0.07) * Math.sin(this.reg_angle), 0]));
                this.reg_Fish_Matrix = reg_model_transform;
                reg_model_transform = reg_model_transform.times(Mat4.rotation(this.reg_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, reg_model_transform, this.materials.rudd_Fish);
            }
        }
        //DRAW REG FISH1
        let reg1_model_transform = Mat4.identity();
        if (!this.reg1_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.reg1_Fish_Matrix[0][3] + 0.25 * Math.cos(this.reg1_angle)) > 6 || Math.abs(this.reg1_Fish_Matrix[1][3] + 0.25 * Math.sin(this.reg1_angle)) > 6) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_reg1_angle();
            }
            if (t > this.reg1_spawn_time && t < this.reg1_spawn_time + 0.2) {
                if ((this.reg1_model_spawn[0][0] < .5) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.reg1_model_spawn = this.reg1_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                this.shapes.fish3D.draw(graphics_state, this.reg1_model_spawn, this.materials.rudd_Fish);
            }
            if (t > this.reg1_spawn_time + 0.2) {
                reg1_model_transform = this.reg1_Fish_Matrix.times(Mat4.translation([(0.07) * Math.cos(this.reg1_angle), (0.07) * Math.sin(this.reg1_angle), 0]));
                this.reg1_Fish_Matrix = reg1_model_transform;
                reg1_model_transform = reg1_model_transform.times(Mat4.rotation(this.reg1_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, reg1_model_transform, this.materials.rudd_Fish);
            }
        }
        //DRAW REG FISH2
        let reg2_model_transform = Mat4.identity();
        if (!this.reg2_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.reg2_Fish_Matrix[0][3] + 0.25 * Math.cos(this.reg2_angle)) > 6 || Math.abs(this.reg2_Fish_Matrix[1][3] + 0.25 * Math.sin(this.reg2_angle)) > 6) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_reg2_angle();
            }
            if (t > this.reg2_spawn_time && t < this.reg2_spawn_time + 0.2) {
                if ((this.reg2_model_spawn[0][0] < .5) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.reg2_model_spawn = this.reg2_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                this.shapes.fish3D.draw(graphics_state, this.reg2_model_spawn, this.materials.rudd_Fish);
            }
            if (t > this.reg2_spawn_time + 0.2) {
                reg2_model_transform = this.reg2_Fish_Matrix.times(Mat4.translation([(0.07) * Math.cos(this.reg2_angle), (0.07) * Math.sin(this.reg2_angle), 0]));
                this.reg2_Fish_Matrix = reg2_model_transform;
                reg2_model_transform = reg2_model_transform.times(Mat4.rotation(this.reg2_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, reg2_model_transform, this.materials.rudd_Fish);
            }
        }
        // DRAW TINY FISH
        let tinyFish_model_transform = Mat4.identity();
        if (!this.tinyFish_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.tinyFish_Matrix[0][3] + 0.05 * Math.cos(this.tinyFish_angle)) > 5 || Math.abs(this.tinyFish_Matrix[1][3] + 0.05 * Math.sin(this.tinyFish_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_tinyFish_angle();
            }
            if (t > this.tinyFish_spawn_time && t < this.tinyFish_spawn_time + 0.2) {
                if ((this.tinyFish_model_spawn[0][0] < .25) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.tinyFish_model_spawn = this.tinyFish_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                this.shapes.fish3D.draw(graphics_state, this.tinyFish_model_spawn, this.materials.rudd_Fish);
            }
            if (t > this.tinyFish_spawn_time + 0.2) {
                tinyFish_model_transform = this.tinyFish_Matrix.times(Mat4.translation([(4 / (t - this.tinyFish_dist)) * (0.05) * Math.cos(this.tinyFish_angle), (4 / (t - this.tinyFish_dist)) * (0.05) * Math.sin(this.tinyFish_angle), 0]));
                if (4 / (t - this.tinyFish_dist) < 0.8)
                    this.tinyFish_dist += 4;
                if (t - this.tinyFish_dist > 10)
                    this.tinyFish_dist += 9;
                this.tinyFish_Matrix = tinyFish_model_transform;
                tinyFish_model_transform = tinyFish_model_transform.times(Mat4.rotation(this.tinyFish_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, tinyFish_model_transform, this.materials.rudd_Fish);
            }
        }
        // DRAW TINY FISH 1
        let tinyFish1_model_transform = Mat4.identity();
        if (!this.tinyFish1_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.tinyFish1_Matrix[0][3] + 0.10 * Math.cos(this.tinyFish1_angle)) > 5 || Math.abs(this.tinyFish1_Matrix[1][3] + 0.10 * Math.sin(this.tinyFish1_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_tinyFish1_angle();
            }
            if (t > this.tinyFish1_spawn_time && t < this.tinyFish1_spawn_time + 0.2) {
                if ((this.tinyFish1_model_spawn[0][0] < .25) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.tinyFish1_model_spawn = this.tinyFish1_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                this.shapes.fish3D.draw(graphics_state, this.tinyFish1_model_spawn, this.materials.rudd_Fish);
            }
            if (t > this.tinyFish1_spawn_time + 0.2) {
                tinyFish1_model_transform = this.tinyFish1_Matrix.times(Mat4.translation([(4 / (t - this.tinyFish1_dist)) * (0.10) * Math.cos(this.tinyFish1_angle), (4 / (t - this.tinyFish1_dist)) * (0.10) * Math.sin(this.tinyFish1_angle), 0]));
                if (4 / (t - this.tinyFish1_dist) < 0.8)
                    this.tinyFish1_dist += 2;
                if (t - this.tinyFish1_dist > 10)
                    this.tinyFish1_dist += 5;
                this.tinyFish1_Matrix = tinyFish1_model_transform;
                tinyFish1_model_transform = tinyFish1_model_transform.times(Mat4.rotation(this.ftinyFish1_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, tinyFish1_model_transform, this.materials.rudd_Fish);
            }
        }
        // DRAW TINY FISH 2
        let tinyFish2_model_transform = Mat4.identity();
        if (!this.tinyFish2_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.tinyFish2_Matrix[0][3] + 0.10 * Math.cos(this.tinyFish2_angle)) > 5 || Math.abs(this.tinyFish2_Matrix[1][3] + 0.10 * Math.sin(this.tinyFish2_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_tinyFish2_angle();
            }
            if (t > this.tinyFish2_spawn_time && t < this.tinyFish2_spawn_time + 0.2) {
                if ((this.tinyFish2_model_spawn[0][0] < .25) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.tinyFish2_model_spawn = this.tinyFish2_model_spawn.times(Mat4.scale([1.1, 1.2, 1.1]));
                this.shapes.fish3D.draw(graphics_state, this.tinyFish2_model_spawn, this.materials.rudd_Fish);
            }
            if (t > this.tinyFish2_spawn_time + 0.2) {
                tinyFish2_model_transform = this.tinyFish2_Matrix.times(Mat4.translation([0.1 * Math.cos(this.tinyFish2_angle), 0.1 * Math.sin(this.tinyFish2_angle), 0]));
                this.tinyFish2_Matrix = tinyFish2_model_transform;
                tinyFish2_model_transform = tinyFish2_model_transform.times(Mat4.rotation(this.tinyFish2_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, tinyFish2_model_transform, this.materials.rudd_Fish);
            }
        }
        // DRAW TINY FISH 3
        let tinyFish3_model_transform = Mat4.identity();
        if (!this.tinyFish3_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.tinyFish3_Matrix[0][3] + 0.10 * Math.cos(this.tinyFish3_angle)) > 5 || Math.abs(this.tinyFish3_Matrix[1][3] + 0.10 * Math.sin(this.tinyFish3_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_tinyFish3_angle();
            }
            if (t > this.tinyFish3_spawn_time && t < this.tinyFish3_spawn_time + 0.2) {
                if ((this.tinyFish3_model_spawn[0][0] < .25) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.tinyFish3_model_spawn = this.tinyFish3_model_spawn.times(Mat4.scale([1.1, 1.2, 1.1]));
                this.shapes.fish3D.draw(graphics_state, this.tinyFish3_model_spawn, this.materials.rudd_Fish);
            }
            if (t > this.tinyFish3_spawn_time + 0.2) {
                tinyFish3_model_transform = this.tinyFish3_Matrix.times(Mat4.translation([0.1 * Math.cos(this.tinyFish3_angle), 0.1 * Math.sin(this.tinyFish3_angle), 0]));
                this.tinyFish3_Matrix = tinyFish3_model_transform;
                tinyFish3_model_transform = tinyFish3_model_transform.times(Mat4.rotation(this.tinyFish3_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, tinyFish3_model_transform, this.materials.rudd_Fish);
            }
        }
        // DRAW TINY FISH 4
        let tinyFish4_model_transform = Mat4.identity();
        if (!this.tinyFish4_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.tinyFish4_Matrix[0][3] + 0.15 * Math.cos(this.tinyFish4_angle)) > 5 || Math.abs(this.tinyFish4_Matrix[1][3] + 0.15 * Math.sin(this.tinyFish4_angle)) > 5) && Math.round((t % 0.2) * 10) / 10 == 0) {
                this.random_tinyFish4_angle();
            }
            if (t > this.tinyFish4_spawn_time && t < this.tinyFish4_spawn_time + 0.2) {
                if ((this.tinyFish4_model_spawn[0][0] < .25) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.tinyFish4_model_spawn = this.tinyFish4_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                this.shapes.fish3D.draw(graphics_state, this.tinyFish4_model_spawn, this.materials.rudd_Fish);
            }
            if (t > this.tinyFish4_spawn_time + 0.2) {
                tinyFish4_model_transform = this.tinyFish4_Matrix.times(Mat4.translation([0.2 * Math.cos(this.tinyFish4_angle), 0.2 * Math.sin(this.tinyFish4_angle), 0]));
                this.tinyFish4_Matrix = tinyFish4_model_transform;
                tinyFish4_model_transform = tinyFish4_model_transform.times(Mat4.rotation(this.tinyFish4_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, tinyFish4_model_transform, this.materials.rudd_Fish);
            }
        }
        // DRAW MEDIUM FISH 
        let med_fish_model_transform = Mat4.identity();
        if (!this.med_fish_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.med_fish_Fish_Matrix[0][3] + (0.25) * Math.cos(this.med_fish_angle)) > 5 || Math.abs(this.med_fish_Fish_Matrix[1][3] + Math.sin(this.med_fish_angle)) > 5) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_med_fish_angle();
            }
            if (t > this.med_fish_spawn_time && t < this.med_fish_spawn_time + 0.2) {
                if ((this.med_fish_model_spawn[0][0] < .5) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.med_fish_model_spawn = this.med_fish_model_spawn.times(Mat4.scale([1.1, 1.1, 1.1]));
                this.shapes.fish3D.draw(graphics_state, this.med_fish_model_spawn, this.materials.rudd_Fish);
            }
            if (t > this.med_fish_spawn_time + 0.2) {
                med_fish_model_transform = this.med_fish_Fish_Matrix.times(Mat4.translation([(8 / (t - this.med_fish_dist)) * (0.02) * Math.cos(this.med_fish_angle), (8 / (t - this.med_fish_dist)) * (0.02) * Math.sin(this.med_fish_angle), 0]));
                if (6 / (t - this.med_fish_dist) < 0.5)
                    this.med_fish_dist += 4;
                if (t - this.med_fish_dist > 5)
                    this.med_fish_dist += 4;
                this.med_fish_Fish_Matrix = med_fish_model_transform;
                med_fish_model_transform = med_fish_model_transform.times(Mat4.rotation(this.med_fish_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, med_fish_model_transform, this.materials.rudd_Fish);
            }
        }
        // DRAW MED FISH 2
        let med_fish2_model_transform = Mat4.identity();
        if (!this.med_fish2_caught) {
            // If statement to turn fish if it will translate out of pond
            if ((Math.abs(this.med_fish2_Matrix[0][3] + Math.cos(this.med_fish2_angle)) > 5 || Math.abs(this.med_fish2_Matrix[1][3] + Math.sin(this.med_fish2_angle)) > 5) && Math.round((t % 0.5) * 10) / 10 == 0) {
                this.random_med_fish2_angle();
                this.med_fish2_direction *= -1;
            }
            if (Math.round((t % 1.5) * 10) / 10 == .7) {
                this.med_fish2_angle = (Math.atan2((this.med_fish2_Matrix[1][3]), (this.med_fish2_Matrix[0][3]))) + (this.med_fish2_direction * (0.01));
            }
            if (t > this.med_fish2_spawn_time && t < this.med_fish2_spawn_time + 0.2) {
                if ((this.med_fish2_model_spawn[0][0] < 0.5) && (Math.round((t % 0.1) * 10) / 10 == 0))
                    this.med_fish2_model_spawn = this.med_fish2_model_spawn.times(Mat4.scale([1.4, 1.4, 1.4]));
                this.shapes.fish3D.draw(graphics_state, this.med_fish2_model_spawn, this.materials.rudd_Fish);
                this.med_fish2_Matrix[0][3] = 0;
                this.med_fish2_Matrix[1][3] = 0;
            }
            if (t > this.med_fish2_spawn_time + 0.2) {
                med_fish2_model_transform = this.med_fish2_Matrix.times(Mat4.translation([(0.15) * Math.cos(this.med_fish2_angle), (0.15) * Math.sin(this.med_fish2_angle), 0]));
                this.med_fish2_Matrix = med_fish2_model_transform;
                med_fish2_model_transform = med_fish2_model_transform.times(Mat4.rotation(this.med_fish2_angle, Vec.of(0, 0, 1)))
                this.shapes.fish3D.draw(graphics_state, med_fish2_model_transform, this.materials.rudd_Fish);
            }
        }
    }
}
