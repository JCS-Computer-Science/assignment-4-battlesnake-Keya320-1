function floodFillSpace(board, start, maxCount = 20) {
    const width = board.width;
    const height = board.height;
    const visited = new Set();
    const queue = [start];

    function key(x, y) { return `${x},${y}`; }

    while (queue.length > 0 && visited.size < maxCount) {
        const { x, y } = queue.shift();
        const k = key(x, y);

        if (visited.has(k)) continue;
        visited.add(k);

        const neighbors = [
            { x: x, y: y + 1 },
            { x: x, y: y - 1 },
            { x: x - 1, y: y },
            { x: x + 1, y: y }
        ];

        for (let n of neighbors) {
            if (
                n.x >= 0 && n.x < width &&
                n.y >= 0 && n.y < height &&
                !visited.has(key(n.x, n.y))
            ) {
                queue.push(n);
            }
        }
    }

    return visited.size;
}


export default function move(gameState){
    let moveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
    };
    
    const myHead = gameState.you.body[0];
    const myNeck = gameState.you.body[1];
    
    if (myNeck.x < myHead.x)
        moveSafety.left = false;
    else if (myNeck.x > myHead.x)
        moveSafety.right = false;
    else if (myNeck.y < myHead.y) 
        moveSafety.down = false;
    else if (myNeck.y > myHead.y)
        moveSafety.up = false;
    
    // STEP 1: Avoid walls
    const boardWidth = gameState.board.width;
    const boardHeight = gameState.board.height;

    if (myHead.y + 1 >= boardHeight)
        moveSafety.up = false;
    if (myHead.y - 1 < 0)
        moveSafety.down = false;
    if (myHead.x - 1 < 0)
        moveSafety.left = false;
    if (myHead.x + 1 >= boardWidth)
        moveSafety.right = false;

    // STEP 2: Avoid your own body
    const myBody = gameState.you.body;

    for (let segment of myBody) {
        if (segment.x === myHead.x && segment.y === myHead.y + 1)
            moveSafety.up = false;
        if (segment.x === myHead.x && segment.y === myHead.y - 1)
            moveSafety.down = false;
        if (segment.x === myHead.x - 1 && segment.y === myHead.y)
            moveSafety.left = false;
        if (segment.x === myHead.x + 1 && segment.y === myHead.y)
            moveSafety.right = false;
    }

    // STEP 3: Avoid other snakes
    const otherSnakes = gameState.board.snakes;

    for (let snake of otherSnakes) {    
        for (let segment of snake.body) {
            if (segment.x === myHead.x && segment.y === myHead.y + 1)
                moveSafety.up = false;
            if (segment.x === myHead.x && segment.y === myHead.y - 1) 
                moveSafety.down = false;
            if (segment.x === myHead.x - 1 && segment.y === myHead.y) 
                moveSafety.left = false;
            if (segment.x === myHead.x + 1 && segment.y === myHead.y) 
                moveSafety.right = false;
        }
    }

    // STEP 3B: Avoid head-to-head collisions
for (let snake of otherSnakes) {
    const enemyHead = snake.body[0];
    const enemyLength = snake.length;
    const myLength = gameState.you.length;

    // Only avoid if enemy is equal or longer
    if (enemyLength >= myLength) {

        // Enemy could move up
        if (enemyHead.x === myHead.x && enemyHead.y + 1 === myHead.y)
            moveSafety.down = false;

        // Enemy could move down
        if (enemyHead.x === myHead.x && enemyHead.y - 1 === myHead.y)
            moveSafety.up = false;

        // Enemy could move left
        if (enemyHead.x - 1 === myHead.x && enemyHead.y === myHead.y)
            moveSafety.right = false;

        // Enemy could move right
        if (enemyHead.x + 1 === myHead.x && enemyHead.y === myHead.y)
            moveSafety.left = false;
    }
}

// STEP 3C: Avoid tight spaces (corner trapping)
const moveOffsets = {
    up:    { x: myHead.x,     y: myHead.y + 1 },
    down:  { x: myHead.x,     y: myHead.y - 1 },
    left:  { x: myHead.x - 1, y: myHead.y },
    right: { x: myHead.x + 1, y: myHead.y }
};

for (let dir of Object.keys(moveSafety)) {
    if (!moveSafety[dir]) continue;

    const nextPos = moveOffsets[dir];
    const space = floodFillSpace(gameState.board, nextPos);

    // If the space is too small, avoid this move
    if (space < 8) {
        moveSafety[dir] = false;
    }
}

// STEP 3D: Predict enemy movement (avoid squares enemies might move into)
for (let snake of otherSnakes) {
    const enemyHead = snake.body[0];
    const enemyLength = snake.length;
    const myLength = gameState.you.length;

    // All possible enemy moves
    const enemyMoves = [
        { x: enemyHead.x,     y: enemyHead.y + 1 }, // up
        { x: enemyHead.x,     y: enemyHead.y - 1 }, // down
        { x: enemyHead.x - 1, y: enemyHead.y },     // left
        { x: enemyHead.x + 1, y: enemyHead.y }      // right
    ];

    for (let move of enemyMoves) {
        // If this enemy move matches where WE would move, mark unsafe
        if (move.x === myHead.x && move.y === myHead.y + 1)
            moveSafety.up = false;

        if (move.x === myHead.x && move.y === myHead.y - 1)
            moveSafety.down = false;

        if (move.x === myHead.x - 1 && move.y === myHead.y)
            moveSafety.left = false;

        if (move.x === myHead.x + 1 && move.y === myHead.y)
            moveSafety.right = false;
    }
}

// STEP 3E: Score moves by available space
const moveSpaceScore = {
    up: 0,
    down: 0,
    left: 0,
    right: 0
};

for (let dir of Object.keys(moveSafety)) {
    if (!moveSafety[dir]) continue;

    const nextPos = moveOffsets[dir];
    const space = floodFillSpace(gameState.board, nextPos, 50); // deeper scan

    moveSpaceScore[dir] = space;
}

// SAFE MOVES CHECK
const safeMoves = Object.keys(moveSafety).filter(direction => moveSafety[direction]);
if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
}

// STEP 3F: Pick the move with the most space (fallback priority)
let bestSpaceMove = null;
let bestSpaceScore = -1;

for (let dir of safeMoves) {
    if (moveSpaceScore[dir] > bestSpaceScore) {
        bestSpaceScore = moveSpaceScore[dir];
        bestSpaceMove = dir;
    }
}


// STEP 4: Move toward the closest food
const foodList = gameState.board.food;

let closestFood = null;
let closestDistance = Infinity;

for (let food of foodList) {
    const distance = Math.abs(food.x - myHead.x) + Math.abs(food.y - myHead.y);
    if (distance < closestDistance) {
        closestDistance = distance;
        closestFood = food;
    }
}

// STEP 4A: Only eat when hungry
let shouldEat = false;

if (gameState.you.health < 40) {
    shouldEat = true;
}

// STEP 4B: Avoid dangerous food
let foodIsDangerous = false;

if (closestFood) {
    // 1. Check if food is in a tight space
    const spaceAroundFood = floodFillSpace(gameState.board, closestFood);
    if (spaceAroundFood < 10) {
        foodIsDangerous = true;
    }

    // 2. Check if a bigger snake can reach the food first
    for (let snake of otherSnakes) {
        const enemyHead = snake.body[0];
        const enemyLength = snake.length;

        if (enemyLength >= gameState.you.length) {
            const myDist = Math.abs(closestFood.x - myHead.x) + Math.abs(closestFood.y - myHead.y);
            const enemyDist = Math.abs(closestFood.x - enemyHead.x) + Math.abs(closestFood.y - enemyHead.y);

            if (enemyDist <= myDist) {
                foodIsDangerous = true;
            }
        }
    }
}
let foodMove = null;

//  STEP 4C: Only chase food if hungry AND safe
if (closestFood && shouldEat && !foodIsDangerous) {
    if (closestFood.x < myHead.x && moveSafety.left) foodMove = "left";
    else if (closestFood.x > myHead.x && moveSafety.right) foodMove = "right";
    else if (closestFood.y < myHead.y && moveSafety.down) foodMove = "down";
    else if (closestFood.y > myHead.y && moveSafety.up) foodMove = "up";
}

//  STEP 4D: Opportunistic eating (food is next to you AND safe)
if (!foodMove && closestFood && !foodIsDangerous) {
    const dist = Math.abs(closestFood.x - myHead.x) + Math.abs(closestFood.y - myHead.y);

    if (dist === 1) {
        if (closestFood.x < myHead.x && moveSafety.left) foodMove = "left";
        else if (closestFood.x > myHead.x && moveSafety.right) foodMove = "right";
        else if (closestFood.y < myHead.y && moveSafety.down) foodMove = "down";
        else if (closestFood.y > myHead.y && moveSafety.up) foodMove = "up";
    }
}

if (foodMove) {
    console.log(`MOVE ${gameState.turn}: smart food logic chose ${foodMove}`);
    return { move: foodMove };
}

// STEP 5: Tail chasing (safe fallback strategy)
const myTail = gameState.you.body[gameState.you.body.length - 1];

let tailMove = null;

// Try to move toward your tail if it's safe
if (myTail.x < myHead.x && moveSafety.left) tailMove = "left";
else if (myTail.x > myHead.x && moveSafety.right) tailMove = "right";
else if (myTail.y < myHead.y && moveSafety.down) tailMove = "down";
else if (myTail.y > myHead.y && moveSafety.up) tailMove = "up";

if (tailMove) {
    console.log(`MOVE ${gameState.turn}: chasing tail with ${tailMove}`);
    return { move: tailMove };
}

// STEP 6: Use best space move as final fallback
if (bestSpaceMove) {
    console.log(`MOVE ${gameState.turn}: best space move ${bestSpaceMove}`);
    return { move: bestSpaceMove };
}

// Emergency fallback (should almost never happen)
const emergencyMove = safeMoves[0];
console.log(`MOVE ${gameState.turn}: emergency fallback ${emergencyMove}`);
return { move: emergencyMove };



}
