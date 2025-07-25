import { world, BlockVolume, ItemStack } from "@minecraft/server" ;

const spawners = [
	{ type: "zombie", item: 'rotten_flesh', range: 16, dim: 'overworld', sound: 'mob.zombie.say' },
	{ type: "skeleton", item: 'bone', range: 16, dim: 'overworld', sound: 'mob.skeleton.say' },
	{ type: "spider", item: 'string', range: 16, dim: 'overworld', sound: 'mob.spider.say' },
	{ type: "cave_spider", item: 'spider_eye', range: 8, dim: 'overworld', sound: 'mob.spider.step' },
	{ type: "silverfish", item: 'potion', data: 46, range: 32, dim: 'overworld', sound: 'mob.silverfish.say' },
	{ type: "blaze", item: 'blaze_rod', range: 16, dim: 'nether', sound: 'mob.blaze.breathe' },
	{ type: "magma_cube", item: 'magma_cream', range: 32, dim: 'nether', sound: 'mob.magmacube.big' },
]

function success(c, dimension) {
	for (let y = -2; y <= 2; y++) {
		for (let x = -2; x <= 2; x++) {
			for (let z = -2; z <= 2; z++) {
				const location = {x: c.x + x/4, y: c.y + y/4, z: c.z + z/4}
				dimension.spawnParticle('minecraft:basic_flame_particle', location)
			}
		}
	}
}

function is_range_clear(range, block) {
	const {dimension, location:l} = block
	const clear = !dimension.containsBlock(
		new BlockVolume(
			{x: l.x - range, y: l.y - range, z: l.z - range},
			{x: l.x + range, y: l.y + range, z: l.z + range}
		),
		{includeTypes: ['minecraft:mob_spawner']}
	)
	if (clear) return true
	dimension.playSound('random.fizz', l)
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('yasser444:monster_spawner', {
		onPlayerInteract({block, player, dimension}) {
			const fail = () => dimension.spawnParticle('minecraft:basic_smoke_particle', block.above().bottomCenter())

			const spawner = spawners.find(spawner => 
				player.runCommand(
					`testfor @s[hasitem={item=${spawner.item}, data=${spawner.data ?? 0}, location=slot.weapon.mainhand}]`
				).successCount
			)
			const not_creative = player.getGameMode() != 'creative'
		
			if (!spawner) {
				fail(); return
			}
			if (dimension.id != 'minecraft:' + spawner.dim) {
				dimension.playSound('dig.bone_block', block.location)
				fail(); return
			}
			if (not_creative && player.level < 50) {
				dimension.playSound('random.orb', block.location, {pitch: Math.random() * 0.7 + 0.55, volume: 0.5})
				fail(); return
			}
			if (not_creative) {
				player.runCommand(`clear @s ${spawner.item} ${spawner.data ?? 0} 1`)
			}
			if (!is_range_clear(spawner.range, block)) {
				fail(); return
			}
			if (not_creative) {
				player.addLevels(-50)
			}
			world.structureManager.place(`spawners:${spawner.type}`, dimension, block.location)
			dimension.playSound(spawner.sound, block.location)
			success(block.center(), dimension)
		}
	})
})


world.afterEvents.playerBreakBlock.subscribe((event) => {
	const {block, dimension, player, brokenBlockPermutation: {type}} = event
	if (player.getGameMode() == 'creative') return
	if (type.id != "minecraft:mob_spawner") return
	if (["north", "east", "south", "west"].some(direction => 
		block[direction]()[direction]().typeId == "minecraft:end_portal_frame"
	)) return
	dimension.spawnItem(new ItemStack('yasser444:empty_spawner'), block.center())
})

/* deprecated functions

async function is_range_clear(type, block) {
	const {dimension, location:l} = block
	const range = spawners[type].range
	for (let y = -range; y <= range; y++) {
		for (let x = -range; x <= range; x++) {
			for (let z = -range; z <= range; z++) {
				const location = {x: l.x + x, y: l.y + y, z: l.z + z}
				if (dimension.getBlock(location)?.typeId == 'minecraft:mob_spawner') {
					dimension.playSound('random.fizz', l)
					draw_line(dimension, block.center(), dimension.getBlock(location).center())
					return
				}
			}
			if (x % 17 == 0) await new Promise((resolve) => system.runTimeout(resolve, 1))
		}
		dimension.spawnParticle('minecraft:basic_flame_particle', block.center())
	}
	return true
}

function draw_line(dimension, from, to) {
	const direction = normalize({
		x: to.x - from.x,
		y: to.y - from.y,
		z: to.z - from.z,
	}, from, to)
	for (let i = 0; i <= getDistance(from, to); i++) {
		dimension.spawnParticle(
			"minecraft:basic_flame_particle", {
				x: from.x + i * direction.x,
				y: from.y + i * direction.y,
				z: from.z + i * direction.z,
			}
		)
	}
}

function normalize(vector, from, to) {
	return {
		x: vector.x / getDistance(from, to),
		y: vector.y / getDistance(from, to),
		z: vector.z / getDistance(from, to),
	}
}

function getDistance(from, to) {
	const relative = {
		x: to.x - from.x,
		y: to.y - from.y,
		z: to.z - from.z,
	}
	return Math.sqrt(relative.x ** 2 + relative.y ** 2 + relative.z ** 2)
}
*/