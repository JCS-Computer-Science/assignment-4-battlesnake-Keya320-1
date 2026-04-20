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

    // SAFE MOVES CHECK
    const safeMoves = Object.keys(moveSafety).filter(direction => moveSafety[direction]);
    if (safeMoves.length == 0) {
        console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
        return { move: "down" };
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

    let foodMove = null;

    if (closestFood) {
        if (closestFood.x < myHead.x && moveSafety.left) foodMove = "left";
        else if (closestFood.x > myHead.x && moveSafety.right) foodMove = "right";
        else if (closestFood.y < myHead.y && moveSafety.down) foodMove = "down";
        else if (closestFood.y > myHead.y && moveSafety.up) foodMove = "up";
    }

    if (foodMove) {
        console.log(`MOVE ${gameState.turn}: moving toward food with ${foodMove}`);
        return { move: foodMove };
    }

    // RANDOM SAFE MOVE 
    const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    console.log(`MOVE ${gameState.turn}: ${nextMove}`);
    return { move: nextMove };
}
