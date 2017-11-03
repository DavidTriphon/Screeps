
export class TaskMoveToPos extends AbstractTask
{
  // =============================================================================
  //  MEMORY METHODS
  // =============================================================================

  public static fromMemory(taskData)
  {
    const pos = new RoomPosition(taskData.pos.x, taskData.pos.y, taskData.pos.roomName);

    return new TaskMoveToPos(pos, taskData.range);
  }

  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  private pos: RoomPosition;
  private range: number;

  // =============================================================================
  //  CONSTRUCTOR
  // =============================================================================

  constructor(pos: RoomPosition, range: number)
  {
    super();
    this.pos = pos;
    this.range = range;
  }

  // =============================================================================
  //   INSTANCE METHODS
  // =============================================================================

  public toMemory()
  {
    const data =
      {
        type: "moveToPos",
        pos: this.pos,
        range: this.range
      };

    return data;
  }

  public execute(creep: Creep)
  {
    const distance = this.pos.squareDistanceTo(creep.pos);

    if (distance <= this.range)
    {
      return TaskResult.DONE;
    }
    creep.moveTo(this.pos);

    return TaskResult.NOT_DONE;
  }
}
