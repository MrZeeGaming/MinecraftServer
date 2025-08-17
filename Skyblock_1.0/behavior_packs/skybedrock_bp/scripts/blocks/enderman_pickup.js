import { system, world } from "@minecraft/server"

function pickup(enderman, block, {x, y, z}) {
	enderman.runCommand(`structure load endermen:enderman_${block} ${x} ${y} ${z}`)
	enderman.remove()
}

world.afterEvents.entitySpawn.subscribe(({entity}) => {
  if (!world.getDynamicProperty("enderman_pickup")) return
  if (entity.typeId != "minecraft:enderman") return
  if (Math.random() >= 0.5) return
  if (entity.isValid())
  entity.runCommand('event entity @s "enderman+"')
})

system.afterEvents.scriptEventReceive.subscribe(({id, sourceEntity:enderman}) => {
  if (id != "yasser444:enderman_pickup") return
	if (!world.gameRules.mobGriefing) return
	if (!enderman) return;
	try {
  	const center = enderman.dimension.getBlock(enderman.location)
  	const sides = [ 
  		center.north(),
  		center.east(),
  		center.south(),
  		center.west(),
  	]
	for (let side of sides) {
  		const {x, y, z} = side
  		for (let type of ['frosted_ice', 'farmland', 'suspicious_sand', 'suspicious_gravel']) {
  			if (side.permutation.matches('minecraft:' + type)) {
  				enderman.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} air replace ${type}`);
  				pickup(enderman, type, enderman.location); 
  				return;
  			}
  		}
	  }
	} catch(error) {null}
})