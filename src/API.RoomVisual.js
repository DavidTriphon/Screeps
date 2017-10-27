/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('API.RoomVisual');
 * mod.thing == 'a thing'; // true
 */

CONSTRUCTION_STYLE =
{
    fill: undefined,
    opacity: 0.5,
    stroke: '#A0ffA0',
    strokeWidth: 0.08,
    lineStyle: undefined
}

module.exports = {};

// =============================================================================
//  NEWER PRINT METHODS
// =============================================================================

RoomVisual.prototype.spawn = function(pos, style)
{
    if (style === undefined)
        style = CONSTRUCTION_STYLE;
    
    style.radius = 0.75;
    
    this.circle(pos, style);
}

RoomVisual.prototype.storage = function(pos, style)
{
    if (style === undefined)
        style = CONSTRUCTION_STYLE;
    
    let x = pos.x;
    let y = pos.y;
    
    let outline = [[x - 0.6, y], [x - 0.5, y + 0.6], [x, y + 0.7], [x + 0.5, y + 0.6], [x + 0.6, y], [x + 0.5, y - 0.6], [x, y - 0.7], [x - 0.5, y - 0.6], [x - 0.6, y]];
    
    this.poly(outline, style);
}

RoomVisual.prototype.container = function(pos, style)
{
    if (style === undefined)
        style = CONSTRUCTION_STYLE;
    
    let x = pos.x;
    let y = pos.y;
    
    let outline = [[x - 0.3, y + 0.4], [x - 0.3, y - 0.4], [x + 0.3, y - 0.4], [x + 0.3, y + 0.4], [x - 0.3, y + 0.4]];
    
    this.poly(outline, style);
}

RoomVisual.prototype.tower = function(pos, style)
{
    if (style === undefined)
        style = CONSTRUCTION_STYLE;
    
    let x = pos.x;
    let y = pos.y;
    
    let circle = [[x - 0.5, y], [x - 0.4, y + 0.3], [x - 0.3, y + 0.4], [x, y + 0.5], [x + 0.3, y + 0.4], [x + 0.4, y + 0.3], [x + 0.5, y], [x + 0.4, y - 0.3], [x + 0.3, y - 0.4], [x, y - 0.5], [x - 0.3, y - 0.4], [x - 0.4, y - 0.3], [x - 0.5, y]];
    let canister = [[x - .3, y - .3], [x - .3, y + .3], [x + .2, y + .3], [x + .2, y - .3], [x - .3, y - .3]];
    let turret =  [[x + .2, y + .1], [x + .7, y + .1], [x + .7, y - 0.1], [x + .2, y - 0.1]];
    
    this.poly(circle, style);
    this.poly(canister, style);
    this.poly(turret, style);
}