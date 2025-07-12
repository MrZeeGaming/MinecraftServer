import { world, system } from "@minecraft/server" ;

world.beforeEvents.entityRemove.subscribe(({removedEntity:entity}) => {
	if (entity.typeId != "minecraft:falling_block") return
})