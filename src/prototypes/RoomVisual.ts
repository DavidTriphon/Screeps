// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   CONSTANTS
// =============================================================================

const CONSTRUCTION_STYLE: CircleStyle = {
  fill: undefined,
  opacity: 0.5,
  stroke: "#A0ffA0",
  strokeWidth: 0.08,
  lineStyle: undefined
};

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface RoomVisual
  {
    spawn(pos: RoomPosition, style?: CircleStyle): void;
    storage(pos: RoomPosition, style?: PolyStyle): void;
    container(pos: RoomPosition, style?: PolyStyle): void;
    tower(pos: RoomPosition, style?: PolyStyle): void;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class RoomVisualExt extends RoomVisual
{
  public spawn(pos: RoomPosition, style: CircleStyle = CONSTRUCTION_STYLE): void
  {
    style.radius = 0.75;

    this.circle(pos, style);
  }

  public storage(pos: RoomPosition, style: PolyStyle = CONSTRUCTION_STYLE): void
  {
    const x = pos.x;
    const y = pos.y;

    const outline: Array<[number, number]> = [
      [x - 0.6, y], [x - 0.5, y + 0.6], [x, y + 0.7], [x + 0.5, y + 0.6],
      [x + 0.6, y], [x + 0.5, y - 0.6], [x, y - 0.7], [x - 0.5, y - 0.6], [x - 0.6, y]
    ];

    this.poly(outline, style);
  }

  public container(pos: RoomPosition, style: PolyStyle = CONSTRUCTION_STYLE): void
  {
    const x = pos.x;
    const y = pos.y;

    const outline: Array<[number, number]> = [
      [x - 0.3, y + 0.4], [x - 0.3, y - 0.4],
      [x + 0.3, y - 0.4], [x + 0.3, y + 0.4], [x - 0.3, y + 0.4]
    ];

    this.poly(outline, style);
  }

  public tower(pos: RoomPosition, style: PolyStyle = CONSTRUCTION_STYLE): void
  {
    const x = pos.x;
    const y = pos.y;

    const circle: Array<[number, number]> = [
      [x - 0.5, y], [x - 0.4, y + 0.3], [x - 0.3, y + 0.4], [x, y + 0.5],
      [x + 0.3, y + 0.4], [x + 0.4, y + 0.3], [x + 0.5, y], [x + 0.4, y - 0.3],
      [x + 0.3, y - 0.4], [x, y - 0.5], [x - 0.3, y - 0.4], [x - 0.4, y - 0.3],
      [x - 0.5, y]
    ];
    const canister: Array<[number, number]> = [
      [x - .3, y - .3], [x - .3, y + .3], [x + .2, y + .3], [x + .2, y - .3],
      [x - .3, y - .3]
    ];
    const turret: Array<[number, number]> = [
      [x + .2, y + .1], [x + .7, y + .1], [x + .7, y - 0.1], [x + .2, y - 0.1]
    ];

    this.poly(circle, style);
    this.poly(canister, style);
    this.poly(turret, style);
  }
}
