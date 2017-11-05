// =============================================================================
//   IMPORTS
// =============================================================================

// =============================================================================
//   EXPORTS
// =============================================================================

// export {JobAttack as Attack} from "./JobAttack";
// export {JobScout as Scout} from "./JobScout";
// export {JobReserve as Reserve} from "./JobReserve";
// export {JobDefend as Defend} from "./JobDefend";
// export {JobMine as Mine} from "./JobMine";
export {JobHarvest as Harvest} from "./JobHarvest";
export {JobUpgrade as Upgrade} from "./JobUpgrade";
export {JobHaul as Haul} from "./JobHaul";
export {JobBuild as Build} from "./JobBuild";
// export {JobFillSpawn as FillSpawn} from "./JobFillSpawn";

// =============================================================================
//   JOB DATA MEMORY DEFINITION
// =============================================================================

declare global
{
  interface Memory
  {
    [key: string]: any;
    Job: {
      [jobType: string]: {[id: string]: JobMemory},
      Build: {[id: string]: JobBuildData;};
      Harvest: {[id: string]: JobHarvestMemory;};
      Haul: {[id: string]: JobHaulMemory;};
      Upgrade: {[id: string]: JobUpgradeMemory;};
      // Attack: {[id: string]: JobAttackData;},
      // Defend: {[id: string]: JobDefendData;},
    };
  }
}
