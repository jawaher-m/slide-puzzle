class Board {
    constructor(imgNWidth, imgNHeight, rowCols) {
        if (Board._instance) { // we can only have one board instance in the project. if more exist, out.
            throw new Error('There can be only one board per project');
        }
        Board._instance = this
        this.rowCols = rowCols
        //puzzle size
        this.width = 600;
        this.height = 600;
        //size of each piece of original image
        this.widthImagePiece = Math.floor(imgNWidth / rowCols)
        this.heightImagePiece = Math.floor(imgNHeight / rowCols)
        //size of each tile of the puzzle
        this.tileWidth = Math.floor(this.width / this.rowCols)
        this.tileHeight = Math.floor(this.height / this.rowCols)
    }
}
//global variables
var canvas = document.querySelector('#canvas')
var ctx = canvas.getContext('2d') //context sets the canvas to two dimensional manipulation
var board
var tileImages = []
var tileIDs = [] //Ids (col0, row0) in correct position = what we try to reach at the end
var shuffledIds = [] //Ids in incorrect position, starting point
var puzzleSize
var name
var image = new Image()
var mainDiv = document.getElementById('mainDiv')
mainDiv.style.display = 'none'

document.getElementById('startForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the default form submission

    // Get values from the form
    name = document.getElementById('name').value;
    puzzleSize = parseInt(document.getElementById('puzzleSize').value);
    const puzzleImage = parseInt(document.getElementById('puzzleImage').value);

    // Validate the form values
    if (isNaN(puzzleSize) || puzzleSize < 2 || puzzleSize > 10) {
        alert("Please enter a valid puzzle size between 2 and 10.");
        return;
    }
    if (isNaN(puzzleImage) || puzzleImage < 1 || puzzleImage > 5) {
        alert("Please enter a valid puzzle image number between 1 and 5.");
        return;
    }
    var theForm = document.getElementById('startForm')
    theForm.style.display = 'none'
    mainDiv.style.display = 'block'

    let imageSrc = `${puzzleImage}.jpg`;
    image.onload = cutImageIntoPieces
    image.src = imageSrc;
    
    var oImg = document.createElement("img");
    oImg.setAttribute('width', '300px');
    oImg.setAttribute('src', imageSrc);
    mainDiv.appendChild(oImg)
})

document.getElementById('shuffleButton').addEventListener('click', function () {
    // You can call cutImageIntoPieces to re-shuffle the tiles when the user clicks the shuffle button
    tileImages = []
    tileIDs = []
    shuffledIds = []

    cutImageIntoPieces.call(image);
});

function cutImageIntoPieces() {
    if (!board) {
        board = new Board(this.naturalWidth, this.naturalHeight, puzzleSize); // Only create Board if it doesn't exist
    }
    canvas.width = board.width
    canvas.height = board.height

    canvas.addEventListener('click', move)

    canvas.style.border = "black 2px solid"
    ctx.fillStyle = 'lightgray'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    //logic to cut the image into multiple pieces
    let tempCanvas = document.createElement('canvas'); //temporary canvas
    tempCanvas.width = board.tileWidth //width of each piece
    tempCanvas.height = board.tileHeight //height of each piece
    let tmpCtx = tempCanvas.getContext('2d')

    for (let row = 0; row < board.rowCols; row++) {
        for (let col = 0; col < board.rowCols; col++) {
            tmpCtx.drawImage(this, row * board.widthImagePiece, col * board.heightImagePiece, board.widthImagePiece, board.heightImagePiece, 0, 0, tempCanvas.width, tempCanvas.height)
            tileImages.push(tempCanvas.toDataURL())
            let id = row + col * board.rowCols
            tileIDs.push(id)
        }
    }
    shuffleTileIDs()
    drawAllTiles()
}
function move(e) {
    e.preventDefault()

    let coords = getMouseCoords(e.clientX, e.clientY) //to know the user clicked which tile
    let tileX = coords.x //row nubmer
    let tileY = coords.y//col number
    let blankcoords = getRowColFromIndex(findBlankIndex()) //to know where the blank tile is comparing to where the user clicked
    let blankX = blankcoords.x //row number of blank tile
    let blankY = blankcoords.y //col number of blank tile

    if (!hasBlankNeighbour(tileX, tileY, blankX, blankY))
        return //if the tile cannot be moved then khalas out.

    //store the pixles of the tile with the image into temp variable
    const swapDataImage = ctx.getImageData(tileX * board.tileWidth, tileY * board.tileHeight, board.tileWidth, board.tileHeight)

    ctx.fillRect(tileX * board.tileWidth, tileY * board.tileHeight, board.tileWidth, board.tileHeight)
    ctx.putImageData(swapDataImage, blankX * board.tileWidth, blankY * board.tileHeight)

    const imgIndx = getIndexFromCoords(tileX, tileY)
    const blankIndx = getIndexFromCoords(blankX, blankY)

    swapIndex(imgIndx, blankIndx)
    //logic to check if the puzzle is solved or not
    if (isSolved()) {
        canvas.removeEventListener('click', move)
        drawLastTile()
        setTimeout(() => alert(`Congratulations ${name}!!!`), 100)
    }
}
function shuffleTileIDs() {
    shuffledIds = [...tileIDs] //copy the Ids from the first array to this
    shuffledIds.sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffledIds.length; i++) {
        if (shuffledIds[i] != tileIDs[i]) {
            let blank = Math.round(Math.random() * (board.rowCols * board.rowCols - 1))
            shuffledIds[blank] = -1
            return
        }
    }
    shuffleTileIDs()
}
function drawAllTiles() {
    for (let index = 0; index < shuffledIds.length; index++) {
        if (shuffledIds[index] == -1) continue

        let coordinate = getRowColFromIndex(index)
        let x = coordinate.x //row number
        let y = coordinate.y //column number
        let imgURL = tileImages[shuffledIds[index]]
        // console.log(imgURL)
        let imgObj = new Image()
        imgObj.onload = () => {
            ctx.drawImage(imgObj, 0, 0, imgObj.width, imgObj.height, x * board.tileWidth, y * board.tileHeight, board.tileWidth, board.tileHeight)
        }
        imgObj.src = imgURL
    }
}
function getRowColFromIndex(i) {
    let col = Math.floor(i / board.rowCols)
    let row = i % board.rowCols

    return { x: row, y: col }
}
function getMouseCoords(x, y) {
    let offset = canvas.getBoundingClientRect()
    let left = Math.floor(offset.left)
    let top = Math.floor(offset.top)
    let row = Math.floor((x - left) / board.tileWidth)
    let col = Math.floor((y - top) / board.tileHeight)

    return { x: row, y: col }
}
function findBlankIndex() {
    for (let i = 0; i < shuffledIds.length; i++) {
        if (shuffledIds[i] == -1) return i
    }
}
function hasBlankNeighbour(tileX, tileY, blankX, blankY) {
    console.log('tile:', tileX, tileY)
    console.log('blank:', blankX, blankY)

    if (tileX != blankX && tileY != blankY)
        return false
    if (Math.abs(tileX - blankX) == 1 || Math.abs(tileY - blankY) == 1)
        return true
    return false
}
function getIndexFromCoords(x, y) {
    return x + y * board.rowCols
}
function swapIndex(imgIndx, blankIndx) {
    shuffledIds[blankIndx] = shuffledIds[imgIndx]
    shuffledIds[imgIndx] = -1
}
function isSolved() {
    for (let i = 0; i < shuffledIds.length; i++) {
        if (shuffledIds[i] == -1) continue
        if (shuffledIds[i] != tileIDs[i]) return false
    }
    return true
}
function drawLastTile() {
    let blank = findBlankIndex()
    let coords = getRowColFromIndex(blank)

    let x = coords.x
    let y = coords.y
    let imgUrl = tileImages[tileIDs[blank]]
    const imgObj = new Image()
    imgObj.onload = function () {
        ctx.drawImage(this, 0, 0, this.width, this.height, x * board.tileWidth, y * board.tileHeight, board.tileWidth, board.tileHeight)
    }
    imgObj.src = imgUrl

}