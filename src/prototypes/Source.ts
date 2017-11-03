// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface Source
  {
    identifier(): IdentifiableResource;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class SourceExt extends Source
{
  public identifier(): IdentifiableResource
  {
    return {
      id: this.id,
      pos: this.pos.serialize(),
      resourceType: RESOURCE_ENERGY,
      isRenewable: true
    };
  }
}
