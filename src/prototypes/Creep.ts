// =============================================================================
//   IMPORTS
// =============================================================================

import {TaskResult} from "../classes/task/TaskResult";

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface CreepMemory
  {
    task: TaskMemory | undefined;
  }

  interface Creep
  {
    // task
    doTask(): TaskResult;
    setTask(taskData: TaskMemory): void;
    // movement
    moveToRoom(room: Room | string): number;
    // inventory
    amountOf(resource: string): number;
    filledSpace(): number;
    emptySpace(): number;
    isFull(): boolean;
    isFullOf(resource: string): boolean;
    isEmpty(): boolean;
    isEmptyOf(resource: string): boolean;
    // identifier
    identifier(): IdentifiableCreep;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class CreepExt extends Creep
{
  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  private _filledSpace: number;
  private _emptySpace: number;
  private _isFull: boolean;
  private _isFullOf: {[resource: string]: boolean};
  private _isEmpty: boolean;
  private _isEmptyOf: {[resource: string]: boolean};

  // =============================================================================
  //   TASK METHODS
  // =============================================================================

  public setTask(taskData: TaskMemory): void
  {
    this.memory.task = taskData;
  }

  public getTask(): TaskMemory | undefined
  {
    return this.memory.task as TaskMemory;
  }

  public doTask(): TaskResult
  {
    const taskData = this.getTask();

    if (taskData)
    {
      return new global.TaskList[taskData.type](taskData).execute(this);
    }
    return TaskResult.IMPOSSIBLE;
  }

  // =============================================================================
  //   MOVE METHODS
  // =============================================================================

  public moveToRoom(room: Room | string): number
  {
    const roomName: string = (room instanceof Room ? room.name : room);

    return this.moveTo(new RoomPosition(25, 25, roomName), {range: 23});
  }

  // =============================================================================
  //   CARRY ABSTRACTION METHODS
  // =============================================================================

  public amountOf(resourceType: ResourceConstant): number
  {
    const amount = this.carry[resourceType];
    return (amount === undefined ? 0 : amount);
  }

  public filledSpace(): number
  {
    // if the 1 tick variable isn't set, set it
    if (this._filledSpace === undefined)
    {
      this._filledSpace = _.sum(this.carry);
    }

    // return the result
    return this._filledSpace;
  }

  public emptySpace(): number
  {
    // if the 1 tick variable isn't set, set it
    if (this._emptySpace === undefined)
    {
      this._emptySpace = this.carryCapacity - this.filledSpace();
    }

    // return the result
    return (this._emptySpace);
  }

  public isFull(): boolean
  {
    // if the 1 tick variable isn't set, set it
    if (this._isFull === undefined)
    {
      this._isFull = (this.emptySpace() === 0);
    }
    // return the result
    return (this._isFull);
  }

  public isFullOf(resourceType: ResourceConstant): boolean
  {
    // make sure the isFullOf is already labelled.
    if (this._isFullOf === undefined)
    {
      this._isFullOf = {};
    }

    // if the 1 tick variable isn't set, set it
    if (this._isFullOf[resourceType] === undefined)
    {
      this._isFullOf[resourceType] = (this.carry[resourceType] === this.carryCapacity);
    }

    // return the result
    return (this._isFullOf[resourceType]);
  }

  public isEmpty(): boolean
  {
    // if the 1 tick variable isn't set, set it
    if (this._isEmpty === undefined)
    {
      this._isEmpty = this.filledSpace() === 0;
    }

    // return the result
    return (this._filledSpace === 0);
  }

  public isEmptyOf(resourceType: ResourceConstant): boolean
  {
    // make sure the isFullOf is already labelled.
    if (this._isEmptyOf === undefined)
    {
      this._isEmptyOf = {};
    }
    // if the 1 tick variable isn't set, set it
    if (this._isEmptyOf[resourceType] === undefined)
    {
      this._isEmptyOf[resourceType] = (this.carry[resourceType] === 0);
    }
    // return the result
    return (this._isEmptyOf[resourceType]);
  }

  // =============================================================================
  //   IDENTIFIER METHOD
  // =============================================================================

  public identifier(): IdentifiableCreep
  {
    return {id: this.id, pos: this.pos.serialize(), user: this.owner.username};
  }
}
