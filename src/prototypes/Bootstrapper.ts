import {CreepExt} from "./Creep";
import {RoomExt} from "./Room";
import {RoomPositionExt} from "./RoomPosition";
import {RoomVisualExt} from "./RoomVisual";
import {StructureExt} from "./Structure";
import {ConstructionSiteExt} from "./ConstructionSite";
import {SourceExt} from "./Source";
import {MineralExt} from "./Mineral";
import {ResourceExt} from "./Resource";

export function extendPrototypes()
{
  safeExtendPrototype(Creep, CreepExt);
  safeExtendPrototype(RoomVisual, RoomVisualExt);
  safeExtendPrototype(RoomPosition, RoomPositionExt);
  safeExtendPrototype(Room, RoomExt);
  safeExtendPrototype(Structure, StructureExt);
  safeExtendPrototype(ConstructionSite, ConstructionSiteExt);
  safeExtendPrototype(Source, SourceExt);
  safeExtendPrototype(Mineral, MineralExt);
  safeExtendPrototype(Resource, ResourceExt);
}

function safeExtendPrototype(extended: any, extender: any): void
{
  const properties: string[] = Object.getOwnPropertyNames(extender.prototype);
  for (const i in properties)
  {
    if (!extended.prototype.hasOwnProperty(properties[i]))
    {
      Object.defineProperty(extended.prototype, properties[i],
        Object.getOwnPropertyDescriptor(extender.prototype, properties[i]));
    }
  }
}
