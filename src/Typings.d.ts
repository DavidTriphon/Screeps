declare global
{
  {
    [k: string]: any;
  };
}

// =============================================================================
//   CONSTRUCTOR EXTENSION (FOR VISIBILITY MODULE) #HACK
// =============================================================================

interface StructureConstructor
{
  new(): Structure;
}

interface ConstructionSiteConstructor
{
  new(): ConstructionSite;
}

interface CreepConstructor
{
  new(): Creep;
}

interface MineralConstructor
{
  new(): Mineral;
}

interface SourceConstructor
{
  new(): Source;
}

interface ResourceConstructor
{
  new(): Resource;
}
