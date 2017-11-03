export class Base
{
  // =============================================================================
  //   MEMORY METHODS
  // =============================================================================

  // variables saved to memory include:
  // ?

  public static create(roomName: string): Base
  {
    // make sure the main directory exists.
    if (Memory.Base === undefined)
    {
      Memory.Base = {};
    }
    if (Memory.Base.isBase(roomName))
    {
      throw new Error("There is already a base here.");
    }
    // return the new object.
    return new Base(roomName);
  }

  public static remove(roomName: string): void
  {
    delete Memory.Base[roomName];
  }

  public static isBase(roomName: string): boolean
  {
    return (Memory.Base[roomName] !== undefined);
  }

  // =============================================================================
  //   INSTANCE FIELDS
  // =============================================================================

  private roomName: string;

  // =============================================================================
  //   CONSTRUCTOR
  // =============================================================================

  constructor(roomName: string)
  {
    if (Memory.Base[roomName] === undefined)
    {
      throw new Error("There is no base in room " + roomName + ".");
    }

    this.roomName = roomName;
  }

  // =============================================================================
  //  EXECUTE METHOD
  // =============================================================================

  public execute(): void
  {

  }

  // =============================================================================
  //  METHODS
  // =============================================================================

}
