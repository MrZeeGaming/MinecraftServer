import { world, BlockPermutation } from "@minecraft/server" ;

function redstoneDustParticles(block) {
	const blockCenter = {x:block.location.x + 0.49, y:block.location.y + 0.5, z:block.location.z + 0.49}
	const blockFaces = [{x:blockCenter.x + 0.5, y:blockCenter.y, z:blockCenter.z},
	                    {x:blockCenter.x - 0.5, y:blockCenter.y, z:blockCenter.z},
	                    {x:blockCenter.x, y:blockCenter.y + 0.5, z:blockCenter.z},
	                    {x:blockCenter.x, y:blockCenter.y - 0.5, z:blockCenter.z},
	                    {x:blockCenter.x, y:blockCenter.y, z:blockCenter.z + 0.5},
	                    {x:blockCenter.x, y:blockCenter.y, z:blockCenter.z - 0.5}]
	for (let f = 0; f < 3; f++) {
		for (let i in blockFaces) {
			let face = blockFaces[i];
			if (i == 0 || i == 1) {block.dimension.runCommand(`particle minecraft:redstone_ore_dust_particle ${face.x} ${face.y + Math.random() - 0.5} ${face.z + Math.random() - 0.5}`)}
			if (i == 2 || i == 3) {block.dimension.runCommand(`particle minecraft:redstone_ore_dust_particle ${face.x + Math.random() - 0.5} ${face.y} ${face.z + Math.random() - 0.5}`)}
			if (i == 4 || i == 5) {block.dimension.runCommand(`particle minecraft:redstone_ore_dust_particle ${face.x + Math.random() - 0.5} ${face.y + Math.random() - 0.5} ${face.z}`)}
		}
	}
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('yasser444:redstone_ore', {
		onPlayerInteract({block}) {
			block.setPermutation(block.permutation.withState("yasser444:glow", true))
			redstoneDustParticles(block)
		},
		onStepOn({block}) {
			block.setPermutation(block.permutation.withState("yasser444:glow", true))
			redstoneDustParticles(block)
		},
		onRandomTick({block}) {
			if (!block.permutation.getState("yasser444:glow")) return
			block.setPermutation(block.permutation.withState("yasser444:glow", false))
		},
		onTick({block}) {
			if (!block.permutation.getState("yasser444:glow")) return
			redstoneDustParticles(block)
		}
	})
})

world.afterEvents.entityHitBlock.subscribe(({hitBlock}) => {
	if (hitBlock.permutation.matches("yasser444:redstone_ore")) {
		hitBlock.setPermutation(BlockPermutation.resolve("yasser444:redstone_ore", { "yasser444:glow": true})) ;
		redstoneDustParticles(hitBlock) ;
	}
	if (hitBlock.permutation.matches("yasser444:deepslate_redstone_ore")) {
		hitBlock.setPermutation(BlockPermutation.resolve("yasser444:deepslate_redstone_ore", { "yasser444:glow": true}))
		redstoneDustParticles(hitBlock) ;
	}
})