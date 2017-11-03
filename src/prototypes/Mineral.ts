// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface Mineral
  {
    identifier(): IdentifiableResource;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class MineralExt extends Mineral
{
  public identifier(): IdentifiableResource
  {
    return {
      id: this.id,
      pos: this.pos.serialize(),
      resourceType: this.mineralType,
      isRenewable: true
    };
  }
}
