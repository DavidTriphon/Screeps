// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface ConstructionSite
  {
    identifier(): IdentifiableStructure;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class ConstructionSiteExt extends ConstructionSite
{
  public identifier(): IdentifiableStructure
  {
    return {
      id: this.id,
      pos: this.pos.serialize(),
      isConstructed: false,
      structureType: this.structureType
    };
  }
}
