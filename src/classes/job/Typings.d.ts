// =============================================================================
//   JOB DATA INTERFACES
// =============================================================================

interface JobData
{
  creeps: string[];
}

interface JobAttackData extends JobData
{
  target: IdentifiableCreep | IdentifiableStructure;
}

interface JobBuildData extends JobData
{
  pickUp: IdentifiableStructure;
  site: IdentifiableStructure | null;
}

interface JobDefendData extends JobData
{
  pos: string;
  range: number;
}

interface JobHarvestData extends JobData
{
  source: IdentifiableResource;
  dropOff: IdentifiableStructure;
  idealContainerPos: String;
  idealLinkPos: String;
  adjacentSpaces: number;
}

interface JobHaulData extends JobData
{
  dropOff: IdentifiableStructure;
  pickUp: IdentifiableStructure;
}

interface JobUpgradeData extends JobData
{
  controller: IdentifiableStructure;
  pickUp: IdentifiableStructure;
}

// =============================================================================
//   JOB DATA MEMORY DEFINITION
// =============================================================================

interface Memory
{
  Job:
  {
    [jobType: string]: {[id: string]: JobData},
    Build: {[id: string]: JobBuildData;},
    Harvest: {[id: string]: JobHarvestData;},
    Haul: {[id: string]: JobHaulData;},
    Upgrade: {[id: string]: JobUpgradeData;}
    // Attack: {[id: string]: JobAttackData;},
    // Defend: {[id: string]: JobDefendData;},
  }
}
