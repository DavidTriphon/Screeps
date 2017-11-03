// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   PROTOTYPE INTERFACE
// =============================================================================

declare global
{
  interface Resource
  {
    identifier(): IdentifiableResource;
  }
}

// =============================================================================
//   CLASS DEFINITION
// =============================================================================

export class ResourceExt extends Resource
{
  public identifier(): IdentifiableResource
  {
    return {
      id: this.id,
      pos: this.pos.serialize(),
      resourceType: this.resourceType,
      isRenewable: false
    };
  }
}
