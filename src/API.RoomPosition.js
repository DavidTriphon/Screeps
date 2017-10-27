/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('roomPosition');
 * mod.thing == 'a thing'; // true
 */

module.exports = {};

// =============================================================================
//  SERIALIZATION METHODS
// =============================================================================

RoomPosition.prototype.serialize = function()
{
    // 'x y roomName'
    // '23 16 W5N8'
    return (this.x + ' ' + this.y + ' ' + this.roomName);
}

RoomPosition.deserialize = function(posString)
{
    // [0: x, 1: y, 2: roomName];
    let components = posString.split(' ');
    // return the roomPosition object
    return new RoomPosition(components[0], components[1], components[2]);
}

// =============================================================================
//  SPACE GETTER METHODS
// =============================================================================

// range being a square range
// isValid is a function that takes a position and returns true if you want it added to the space you get back.
// - defaults to always return true
RoomPosition.prototype.adjacentSpaces = function(range, isValid)
{
    if (range === undefined)
    {
        range = 1;
    }
    
    if (isValid === undefined)
    {
        isValid = ((pos) => (true));
    }
    
    var retArray = [];
    
    for (var x = this.x - range; x <= this.x + range; x++)
    {
        for (var y = this.y - range; y <= this.y + range; y++)
        {
            if (0 <= x && x < 50 &&
                0 <= y && y < 50)
            {
                var pos = new RoomPosition(x, y, this.roomName);
                
                if (isValid(pos))
                {
                    retArray.push(pos);
                }
            }
        }
    }
    
    return retArray;
}

// =============================================================================
//  DETAIL METHODS
// =============================================================================


RoomPosition.prototype.isWalkable = function()
{
    return (Game.map.getTerrainAt(this.x, this.y, this.roomName) !== 'wall');
}

RoomPosition.prototype.isDoor = function()
{
    return (
        this.x === 0 ||
        this.x === 49 ||
        this.y === 0 ||
        this.y === 49
    );
}

RoomPosition.prototype.equals = function(pos)
{
    return (
        this.x === pos.x &&
        this.y === pos.y &&
        this.roomName === pos.roomName
    );
}

RoomPosition.isEqual = function(pos1, pos2)
{
    return (
        pos1.x === pos2.x &&
        pos1.y === pos2.y &&
        pos1.roomName === pos2.roomName
    );
}

// =============================================================================
//  POSITION / DISTANCE METHODS
// =============================================================================


RoomPosition.prototype.distanceTo = function(posObj)
{
    // select pos object, as the arg may be an object containing a pos object.
    var pos = (posObj.pos ? posObj.pos : posObj);
    
    // get the objects for the absolute coordinates
    var hereCoords = this.getAbsoluteCoords();
    var thereCoords = pos.getAbsoluteCoords();
    
    // find the absolute distance on each axis
    var xDist = Math.abs(hereCoords.x - thereCoords.x);
    var yDist = Math.abs(hereCoords.y - thereCoords.y);
    
    // pythagorean theorem
    var dist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
    
    // console.log('please confirm: (' + hereCoords.x + ', ' + hereCoords.y + ') to (' + thereCoords.x + ', ' + thereCoords.y + ') is ' + dist + '. ?');
    
    return dist;
}

RoomPosition.prototype.squareDistanceTo = function(posObj)
{
    // select pos object, as the arg may be an object containing a pos object.
    var pos = (posObj.pos !== undefined ? posObj.pos : posObj);
    
    // get the objects for the absolute coordinates
    var hereCoords = this.getAbsoluteCoords();
    var thereCoords = pos.getAbsoluteCoords();
    
    // find the absolute distance on each axis
    var xDist = Math.abs(hereCoords.x - thereCoords.x);
    var yDist = Math.abs(hereCoords.y - thereCoords.y);
    
    // pythagorean theorem
    var dist = Math.max(xDist, yDist);
    
    // console.log('please confirm: max of (' + xDist + ') and (' + yDist + ') is ' + dist + '. ?');
    
    return dist;
}

RoomPosition.prototype.getAbsoluteCoords = function()
{
    // get room coordinates
    var roomCoords = getRoomCoord(this.roomName);
    
    // find absolute position coordinates
    var xAbs = this.x + 50 * roomCoords.x;
    var yAbs = this.y + 50 * roomCoords.y;
    
    // return coordinate object
    return {x: xAbs, y: yAbs};
}

global.getRoomCoord = function(roomName)
{
    // figure out direction polarity by finding direction letters
    var isSouth = roomName.indexOf('S') !== -1;
    var isEast = roomName.indexOf('E') !== -1;
    
    // separate the numbers from the string by removing the starting letter and splitting at the middle letter
    var segments = roomName.substr(1).split((isSouth ? 'S' : 'N'));
    
    // get x by finding the value of the first number and then seeing if it's opposite polarity
    var x = Number(segments[0]);
    if (!isEast)
    {
        x = -x - 1;
    }
    
    // get y by finding the value of the second number and then seeing if it's opposite polarity
    var y = Number(segments[1]);
    if (!isSouth)
    {
        y = -y - 1;
    }
    
    // console.log('please confirm: room ' + roomName + ' is at coordinate (' + x + ', ' + y + '). ?');
    
    // return position object
    return {x: x, y: y};
}
