// 'g_' is prefix for global variables
const g_canvas = document.getElementById('game_canvas');
const g_context = g_canvas.getContext('2d', {willReadFrequently: true} );

const g_grid_size = 20;
const g_speed = 2.5;

const g_dir_enum = { 	// js version of an enum
	UP 		: [0, -1],
	DOWN 	: [0, 1],
	LEFT 	: [-1, 0],
	RIGHT 	: [1, 0]
};
						/* GREEN 	  PURPLE   */
const g_snake_colours = ["#a6d608", "#9678b6" ];

let g_start_button = document.getElementById('start');
let g_game_paused = true;
let g_game_over   = true;

let g_dead_players = [];


let apples = undefined;

let player1 = undefined;
let player2 = undefined;

function compare_arrays(x, y) {
	if(x.length != y.length) return false; // these cannot be the same array
	
	for(let i = 0; i < x.length; i++) {
		if(x[i] != y[i]) return false;
	}
	return true;
}

class Rectangle {
	constructor(pos, sz) {
		this.xy = pos; // xy is a 2 item array of the x position and y position
		this.size = sz; // also a 2 item array of width & height
	}
}

// The type of the player's head and tail
// These are slightly different because they have directions of movement
class PlayerBit extends Rectangle {
	constructor(pos, sz, direction) {
		super(pos, sz); // calls the Rectangle constructor
		this.dir = [ direction[0], direction[1] ]; // direction is a 2 item array of multipliers that change whether the snake moves backwards/forwards
	}
}

class Player {
	constructor(head, len, player_id) {
		this.head = head; // head should be provided as PlayerBit
		
		this.tail = new PlayerBit(head.xy, [head.size[0], head.size[0]], head.dir);  // EDIT BACK
		this.tail.xy = [head.xy[0] - len*g_grid_size, head.xy[1]]; // tail pos is set to [len] grid places left from head
		
		this.length = len; // length of the snake
		this.id = player_id;
		this.score = document.getElementById('p'+this.id+'_score');
		
		this.dir_tiles = []; // list of Rectangle coordinates that change the direction of the tail once the tail reaches them
		
		this.input_store = g_dir_enum.RIGHT; // input store while snake is between grid tiles
	}
	
	check_apple_collision(apple_set) {
		let new_x = this.head.xy[0] + (g_grid_size*this.head.dir[0]);
		let new_y = this.head.xy[1] + (g_grid_size*this.head.dir[1]);
		
		for(let i = 0; i < apple_set.apples.length; i++) {
			if(apple_set.apples[i][0] == new_x && apple_set.apples[i][1] == new_y) {
				apple_set.move_apple(i);
				this.add_len();
				return;
			}
		}
	}
	
	check_player_collision(apple_set) {
		let new_dir_x = this.head.dir[0];
		let new_dir_y = this.head.dir[1];
		
		if(this.head.dir[0] == 1) { // Position is in the top left of the square, so we might need to add more or less based on direction of the snake
			new_dir_x *= (g_grid_size+1);
		} else if(this.head.dir[1] == 1) {
			new_dir_y *= (g_grid_size+1);
		}
		
		let apple_colour = g_context.getImageData(apple_set.apples[0][0]+2, apple_set.apples[0][1]+2, 1, 1).data;
		let empty_colour = [0, 0, 0, 255];
		let tile_colour = g_context.getImageData(this.head.xy[0]+new_dir_x, this.head.xy[1]+new_dir_y, 1, 1).data;
		
		// If we didn't hit an apple or empty space, it must be a player / beyond canvas boundaries
		return !(compare_arrays(tile_colour, empty_colour) || compare_arrays(tile_colour, apple_colour));
	}
	
	add_len() {
		
		this.tail.xy[0] -= this.tail.dir[0]*g_grid_size; // Set tail piece back by one space 
		this.tail.xy[1] -= this.tail.dir[1]*g_grid_size;
		
		this.length++;
		this.score.textContent = 'Player '+this.id+' score : '+(this.length-1); // Update score
	}
	
	draw_tail() {
		draw('black', this.tail);
	}
	
	/* The tail is a black piece that clears the green drawn by the head
	it resizes towards the direction that needs to be cleared, then jumps to the next grid space.
	This is done instead of a static clear block because that could accidentally
	clear things when it changes direction at turns*/
	clear_tail() {
		if(this.dir_tiles[0] != undefined) {
			
			let new_x = this.tail.xy[0] + g_grid_size*this.tail.dir[0];
			let new_y = this.tail.xy[1] + g_grid_size*this.tail.dir[1];
				
			if(new_x == this.dir_tiles[0][0][0] && new_y == this.dir_tiles[0][0][1] && 
			(this.tail.dir[0] == -1 || this.tail.dir[1] == -1)) { // if we shifted back before, shift ahead again
				this.tail.xy[0] = new_x;
				this.tail.xy[1] = new_y;
			}
				
			if(this.tail.xy[0] == this.dir_tiles[0][0][0] && this.tail.xy[1] == this.dir_tiles[0][0][1]) {
				this.tail.dir = this.dir_tiles[0][1];
					
				this.draw_tail();
					
				this.tail.size[0] = Math.abs(this.tail.dir[1])*g_grid_size;
				this.tail.size[1] = Math.abs(this.tail.dir[0])*g_grid_size;
					
				if(this.tail.dir[0] == -1) { // because position starts from the left, we need to shift back a step to clear from the right
					this.tail.xy[0] += g_grid_size;
				} else if(this.tail.dir[1] == -1) {
					this.tail.xy[1] += g_grid_size;
				}
					
				this.dir_tiles.shift();
			}
		}
	}
	
	draw_head() {
		draw(g_snake_colours[this.id-1], this.head);
	}
	
	move() {
		this.head.xy[0] += g_speed * this.head.dir[0]; // move head position
		this.head.xy[1] += g_speed * this.head.dir[1];
			
		this.tail.size[0] += g_speed * this.tail.dir[0]; // extend tail piece in specified direction
		this.tail.size[1] += g_speed * this.tail.dir[1];
	}
	
	update() { // called every frame, everything we need to change about the player
		if(this.head.xy[0] % g_grid_size == 0 && this.head.xy[1] % g_grid_size == 0) {
			if(this.input_store != undefined) {
				if(!(this.input_store[0] == this.head.dir[0]*-1 && 
				this.input_store[1] == this.head.dir[1]*-1 && this.length != 1))  {
						
					this.head.dir = this.input_store;
					this.dir_tiles.push([ [ this.head.xy[0], this.head.xy[1] ], this.head.dir]);
				}
				
				this.input_store = undefined; // reset input store
			}
			
			this.check_apple_collision(apples);
			
			this.tail.xy[0] += g_grid_size*this.tail.dir[0];
			this.tail.xy[1] += g_grid_size*this.tail.dir[1];
			
			this.tail.size[0] = Math.abs(this.tail.dir[1])*g_grid_size; // set the direction of extension
			this.tail.size[1] = Math.abs(this.tail.dir[0])*g_grid_size;
			
			this.clear_tail();
		}
		if(this.check_player_collision(apples) == true) {
			g_dead_players.push(this.id);
			return;
		}
	}
}

class Apple_Set {
	gen_pos() {
		let x = Math.floor(Math.random() * g_canvas.width);
		let y = Math.floor(Math.random() * g_canvas.height);
		
		x -= x % g_grid_size; // adjust to grid (by removing difference from nearest grid square)
		y -= y % g_grid_size;
		
		return [x,y];
	}
	
	draw_apple(a_index) {
		let a_sq = new Rectangle(this.apples[a_index], [g_grid_size-2, g_grid_size-2]);
		draw('red', a_sq, 1);
	}
	
	move_apple(a_index) { // stop apples from spawning on other apples/snake
		let new_pos = this.gen_pos();
		
		let tile_colour = undefined;
		let black_pixel = [0,0,0,255];
		
		while(new_pos == this.apples[a_index]) {
			new_pos_pixel = g_context.getImageData(new_pos[0]+10, new_pos[1]+10, 1, 1).data;
			if(!compare_arrays(new_pos_pixel, black_pixel)) { // if we aren't loading onto a black pixel...
				new_pos = this.apples[a_index]; // restart loop
			}
		}
		this.apples[a_index] = new_pos;
		this.draw_apple(a_index); // draw individually so apples don't spawn on eachother
	}
	
	constructor(n) { // n is the no. of apples we want for the whole game
		this.apples = new Array(n);
		for(let i = 0; i < n; i++) {
			this.move_apple(i);
		}
	}
}

function draw(style, rect, pos_offset) {
	pos_offset = pos_offset || 0; // if not provided, set to 0 as default
	
	g_context.fillStyle = style;
	g_context.fillRect(rect.xy[0]+pos_offset, rect.xy[1]+pos_offset, rect.size[0], rect.size[1]); 
}

function init_game() { // called when game is started/restarted
	draw('black', new Rectangle([0, 0], [g_canvas.width, g_canvas.height]));
	
	player1 = new Player( new PlayerBit( [60, 60], [g_grid_size, g_grid_size], g_dir_enum.RIGHT ), 1 , 1);
	player1.score.textContent = "Player 1 score : 0";
	
	player2 = new Player( new PlayerBit( [260,260], [g_grid_size, g_grid_size], g_dir_enum.RIGHT ), 1, 2);
	player2.score.textContent = "Player 2 score : 0";
	
	apples = new Apple_Set(8);

	g_game_paused = false;
	g_game_over = false;
	g_dead_players = [];
}

function main() {
	let game_refresh = setInterval(()=> { 
		
		// Draws must be done before updates so collision detection works properly
		player1.draw_tail();
		player1.draw_head();
		
		player2.draw_tail();
		player2.draw_head();
		
		
		player1.update();
		player2.update();
		
		if(g_dead_players.length == 1) {
			let other_player_id = 3-g_dead_players[0];
			
			g_context.font = "30px Arial";
			g_context.fillStyle = 'white';
			
			g_context.fillText("Player "+g_dead_players[0]+" has died", 90, 300);
			g_context.fillText("Player "+other_player_id+" has won!!", 90, 330);
			g_context.fillText("Click button to restart the game", 90, 360);
				
			g_game_over = true;
			g_start_button.textContent = "Restart Game";
		} else if(g_dead_players.length == 2) {
			g_context.font = "30px Arial";
			g_context.fillStyle = 'white';
			
			g_context.fillText("Both Players have died!!", 90, 300);
			g_context.fillText("Nobody won the game..", 90, 330);
			g_context.fillText("Click button to restart the game", 90, 360);
				
			g_game_over = true;
			g_start_button.textContent = "Restart Game";
		}
		
		if(g_game_paused || g_game_over) {
			clearInterval(game_refresh);
			return;
		} 
		
		player1.move();
		player2.move();
	}, 20); // 1000ms / 20ms = 50fps refresh rate
}

g_start_button.addEventListener('click', ()=> {
	g_game_paused = !g_game_paused;
	
	if(g_game_paused) {
		g_start_button.textContent = "Unpause Game";
	} 
	
	if(g_game_over) {
		init_game();
		
		g_game_over = false;
		g_start_button.textContent = "Pause Game";
		
		main();
	} else if(!g_game_paused) { // do else if otherwise it can run main() twice
		g_start_button.textContent = "Pause Game";
		main();
	}
});

document.addEventListener('keydown', (event)=> {
	switch(event.key) {
		case 'w':
			player1.input_store = g_dir_enum.UP;
			break;
		case 'a':
			player1.input_store = g_dir_enum.LEFT;
			break;
		case 's':
			player1.input_store = g_dir_enum.DOWN;
			break;
		case 'd':
			player1.input_store = g_dir_enum.RIGHT;
			break;
			
		case 'ArrowUp':
			player2.input_store = g_dir_enum.UP;
			break;
		case 'ArrowLeft':
			player2.input_store = g_dir_enum.LEFT;
			break;
		case 'ArrowDown':
			player2.input_store = g_dir_enum.DOWN;
			break;
		case 'ArrowRight':
			player2.input_store = g_dir_enum.RIGHT;
			break;
			
		default:
			break;
	}
});

/* Start screen upon loading */
draw('black', new Rectangle([0, 0], [g_canvas.width, g_canvas.height]));
g_context.font = "30px Arial";
g_context.fillStyle = 'white';
g_context.fillText("2-Player Snake, by Syntax Syndicate", 50, 300);
