/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task');
 * mod.thing == 'a thing'; // true
 */

var Enum = require('Enum');

global.taskResults = Enum("DONE", "NOT_DONE", "INCAPABLE", "NONE");

module.exports =
{
    harvest: require('Task.harvest'),

    upgrade: require('Task.upgrade'),
    reserve: require('Task.reserve'),

    build: require('Task.build'),
    repair: require('Task.repair'),

    transfer: require('Task.transfer'),
    withdraw: require('Task.withdraw'),

    pickUp: require('Task.pickUp'),

    moveToPos: require('Task.moveToPos'),
    //moveToRoom: require('Task.moveToRoom'),

    attack: require('Task.attack')
};
