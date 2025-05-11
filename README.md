## Credits
Code developed by Kareem Pickles
Video explainer made by S.A

## How Was The Program Designed?
To create the program, we started with a square that moved across the screen.
Then, we built up to a square that you could control with WASD, that moved smoothly between grid tiles.
We achieved the grid movement by only registering inputs when positions x and y are multiples of 20.

Then we created a tail piece, which cleared the path left by the head piece.
It does it by constantly resizing in a certain direction until it takes up the whole square, then jumping to the next square.
When the head turns, the position and direction are saved so the tail turns at the same spot too.
This method stops it accidentally erasing things.

We could then increase the length of the snake by setting it back a grid space, 
and then we generated apples that would increase the length when hit, and respawn in new locations.

After that, we added another Player object to make the game 2-player (adding input cases for the arrow keys too), and added a start button to start/pause/restart the game.
Then we had to add player collision for gameovers.

Finally, we styled everything with HTML and CSS, with a specific colour palette.

## The Game
Our game is a modified version of Snake that involves 2 players.

The win condition is the other player dying - this can be done by making them crash into you, or taking up enough grid space to corner them.
You can eat apples to make your snake longer, and therefore trap or corner your opponent.

The game also has score counters, and a start/pause/restart button.

Player 1 has a green snake, and they use WASD to move up/down/left/right.
Player 2 has a purple snake, and they use the Arrow Keys to move up/down/left/right.


![2psnake1](https://github.com/user-attachments/assets/5aad6a3f-b749-4e8f-add4-77c6dc0cb658)
![Video Explainer](https://github.com/user-attachments/assets/448612d2-7a29-402f-bcf1-f79072d74c78)

