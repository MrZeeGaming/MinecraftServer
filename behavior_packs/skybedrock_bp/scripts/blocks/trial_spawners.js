import { world, system, BlockPermutation } from "@minecraft/server";

const overworld = world.getDimension('minecraft:overworld');

const trial_spawners = new Map([
	["zombie", "zombie_trial"],
	["husk", "husk_trial"],
	["spider", "spider_trial"],
	["skeleton", "skeleton_trial"],
	["stray", "stray_trial"],
	["bogged", "bogged_trial"],
	["slime", "slime_trial"],
	["cave_spider", "cave_spider_trial"],
	["silverfish", "silverfish_trial"],
	["baby", "baby_trial"],
	["breeze", "breeze_trial"],
])

function getCorners(block) {
	return [
		block.north().west(),
	    block.north().east(),
	    block.south().west(),
	    block.south().east(),
	]
}
function isPoisonous(block) {
	return block.typeId == 'minecraft:podzol' && block.above().typeId == 'minecraft:red_mushroom'
}
function isWeb(block) {
	return block.typeId == 'minecraft:stone' && block.above().typeId == 'minecraft:web'
}
function spawnerLayout(block) {
	const middle = block.below();
	return (
		['minecraft:waxed_copper', 'minecraft:copper_block'].includes(middle.typeId) &&
		['north', 'east', 'south', 'west'].every(side => [
			'minecraft:waxed_chiseled_copper',
			'minecraft:chiseled_copper'
		].includes(middle[side]().typeId))
	)
}

function getMaterials(middle) {
	const materials = {tuff:0, cobble:0, moss:0, sand:0, brick:0, web:0, poison:0, ice:0, bone:0}
	for (let corner of getCorners(middle)) {
		corner.typeId == "minecraft:chiseled_tuff" ? materials.tuff++ :
		corner.typeId == "minecraft:mossy_cobblestone" ? [materials.cobble++, materials.moss++] :
		corner.typeId == "minecraft:chiseled_sandstone" ? materials.sand++ :
		corner.typeId == "minecraft:moss_block" ? materials.moss++ :
		corner.typeId == "minecraft:stone_bricks" ? materials.brick++ :
		corner.typeId == "minecraft:cobblestone" ? materials.cobble++ :
		corner.typeId == "minecraft:packed_ice" ? materials.ice++ :
		corner.typeId == "minecraft:bone_block" ? materials.bone++ :
		isWeb(corner) ? materials.web++ :
		isPoisonous(corner) ? materials.poison++ : null
	}
	return materials
}
function getMob(materials) {
	return (
		materials.tuff == 4 ? 'breeze' :
		materials.cobble == 4 && materials.moss == 4 ? 'zombie' :
		materials.sand == 4 ? 'husk' :
		materials.moss == 4 ? 'slime' :
		materials.brick == 4 ? 'silverfish' :
		materials.cobble == 4 && materials.moss == 2 ? 'baby' :
		materials.web == 4 ? 'spider' :
		materials.web == 2 && materials.poison == 2 ? 'cave_spider' :
		materials.ice == 4 ? 'stray' :
		materials.bone == 4 ? 'skeleton' :
		materials.bone == 2 && materials.poison == 2 ? 'bogged' : ''
	)
}
function activate({x, y, z}, mob, player) {
	if (trial_spawners.has(mob)) {
		system.run(()=> {
			overworld.runCommand(`structure load trials:${trial_spawners.get(mob)} ${x} ${y} ${z}`); y--
			overworld.setBlockType({x: x, y: y, z: z}, 'waxed_copper')
			overworld.setBlockType({x: x + 1, y: y, z: z}, 'waxed_chiseled_copper')
			overworld.setBlockType({x: x - 1, y: y, z: z}, 'waxed_chiseled_copper')
			overworld.setBlockType({x: x, y: y, z: z + 1}, 'waxed_chiseled_copper')
			overworld.setBlockType({x: x, y: y, z: z - 1}, 'waxed_chiseled_copper')
			if (player.getGameMode() == 'creative') return
			player.addLevels(-20)
			player.runCommand('clear @s trial_key 0 1')
		})
	}
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('yasser444:trial_spawner', {
		onPlayerInteract({block, player}) {
			const equipment = player.getComponent("minecraft:equippable")
			const item = equipment.getEquipment("Mainhand")
			if (!item || item.typeId != "minecraft:trial_key") return
			if (block.dimension.id != 'minecraft:overworld') return
			if (player.getGameMode() != 'creative' && player.level < 20) return
			if (!spawnerLayout(block)) return
			const materials = getMaterials(block.below())
			const mob = getMob(materials)
			activate(block.location, mob, player)
		}
	})
})

let last_hit
let hits = 0
world.beforeEvents.playerInteractWithBlock.subscribe(({itemStack:item, player, block, isFirstEvent}) => {
	if (!isFirstEvent) return
	if (item?.typeId != 'minecraft:mace') return
	if (block.typeId != 'minecraft:trial_spawner') return
	const {dimension, location, x, y, z} = block
	last_hit == `${x} ${y} ${z}` ? hits++ : hits = 0; last_hit = `${x} ${y} ${z}`
	system.run(() => {
		world.playSound("trial_spawner.break", player.location)
		if (player.getGameMode() != 'creative') {
			const durability = item.getComponent('durability')
			if (durability.maxDurability == durability.damage) {
				item = undefined
				dimension.playSound('random.break', player.location)
			} else durability.damage++
			player.getComponent('equippable').setEquipment('Mainhand', item)
		}
		if (hits == 2) dimension.setBlockType(location, "yasser444:empty_spawner")
	})
})