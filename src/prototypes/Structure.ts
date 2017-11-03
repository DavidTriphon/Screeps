// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface Structure
  {
    identifier(): IdentifiableStructure;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class StructureExt extends Structure
{
  public identifier(): IdentifiableStructure
  {
    return {
      id: this.id,
      pos: this.pos.serialize(),
      isConstructed: true,
      structureType: this.structureType
    };
  }
}
