import { world, BlockPermutation, system } from "@minecraft/server"

// budding amythyst
world.beforeEvents.playerInteractWithBlock.subscribe(({itemStack:item, player, block}) => {
	if (block.typeId != 'minecraft:amethyst_block') return
	if (item?.typeId != 'minecraft:nether_star') return
	if (block.dimension.id != 'minecraft:overworld') return
	system.run(() => {
		world.playSound("fall.amethyst_block", player.location, {volume: 100})
		block.setPermutation(BlockPermutation.resolve("budding_amethyst"))
		if (Math.random() >= 0.25 ) return
		player.runCommand("clear @s nether_star 0 1") 
		world.playSound("random.glass", player.location, {volume: 1})
	})
})

// deepslate
world.afterEvents.itemUseOn.subscribe(({block, itemStack, source}) => {
	const permutation = block.permutation;
	if (!permutation.matches("cauldron", {"cauldron_liquid":"lava"})) return
	if (itemStack?.typeId !== "minecraft:sculk") return
	
	if (source.getGameMode() != 'creative') source.runCommand("clear @s sculk 0 1");
	
	world.gameRules.sendCommandFeedback = false
	source.runCommand("give @s deepslate");
	world.gameRules.sendCommandFeedback = true
	
	block.dimension.playSound("random.fizz", block.location);
	
	if (Math.random() >= 0.1) return
	
	const fill_level = permutation.getState("fill_level")
	block.setPermutation( fill_level > 1 ? 
		permutation.withState("fill_level", fill_level - 1) :
		BlockPermutation.resolve("cauldron")
	)
})

// spore blossom
world.afterEvents.itemUseOn.subscribe(({block, itemStack}) => {
	const permutation = block.permutation;
	if (!permutation.matches("dirt_with_roots")) return
	if (itemStack.typeId != "minecraft:bone_meal") return
	if (Math.random() >= 0.1) return
	block.below().setPermutation(BlockPermutation.resolve("spore_blossom"));
})