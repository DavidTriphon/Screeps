/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Job.Scout');
 * mod.thing == 'a thing'; // true
 */

JobHire = require('Job.Hire');
Task = require('Task');
require('UserException');
require('API.RoomPosition');
import {JobDefinition} from "./JobDefinition";

@JobDefinition("Scout")
class JobScout extends JobHire
{
  // =============================================================================
  //  CONSTRUCTOR
  // =============================================================================

  constructor(id)
  {
    super(id, 'JobScout');
  }

  // =============================================================================
  //  MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // - roomName : string
  // - creepNames : []

  static create(roomName)
  {
    // make sure the main directory exists.
    if (Memory.JobScout == undefined)
      Memory.JobScout = {};

    // make sure roomName is a string
    if (!(typeof roomName == 'string'))
      throw new UserException('The roomName is not a string:\n- roomName: ' + JSON.stringify(roomName));

    // set the id by using the roomName.
    let id = roomName;

    // make sure that the scout job doesn't already exist so you don't overwrite it
    if (this.isJob(id))
      throw new UserException('The scouter for this room is already defined.');

    // set up local object
    Memory.JobScout[id] = {};

    // set site position
    Memory.JobScout[id].roomName = roomName;

    // set up creep employee array
    Memory.JobScout[id].creepNames = [];

    // return the new object.
    return new JobScout(id);
  }

  static remove(id)
  {
    // set whether it already exists
    let exists = (Memory.JobScout[id] === undefined);
    // delete it
    delete Memory.JobScout[id];
    // return true if it existed and was deleted, false if it wasn't.
    return exists;
  }

  static isJob(id)
  {
    return (Memory.JobScout[id] !== undefined);
  }

  // =============================================================================
  //  EXECUTE METHOD
  // =============================================================================

  execute()
  {
    // make the creeps do their thing
    for (let creep of this.getCreeps())
    {
      try
      {
        // creep.say('I\'m a scouter!');

        let result = creep.doTask();

        if (result !== taskResults.NOT_DONE)
        {
          creep.setTask(new Task.moveToPos(new RoomPosition(25, 25, this.getRoomName()), 20));
          creep.doTask();
        }
      }
      catch (e)
      {
        console.log('The creep ' + creep.name + ' had an issue when trying to execute for the job ' + this.jobType + '.\n' + e.stack);
      }
    }
  }

  // =============================================================================
  //  ROOM METHODS
  // =============================================================================

  getRoomName()
  {
    if (this.roomName === undefined)
      this.roomName = Memory.JobScout[this.id].roomName;

    return this.roomName;
  }
}

// =============================================================================
//  EXPORT
// =============================================================================

module.exports = JobScout;
