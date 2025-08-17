import { world, system, ItemStack } from "@minecraft/server" ;
const owner = world.getPlayers()[0]

// This method extracts item stacks from structures containing a custom entity and stores them in memory
export const stored_items = {}
;(() => { // this wrapping is to create a private scope
	const wait_for_player = system.runInterval(() => { // keep running this until a player is loaded
		const first_player = world.getAllPlayers()[0]
		if (!first_player) return
		const {location, dimension} = first_player
		for (const storage of ['dragon_heads', 'sky_treasure', 'rewards']) {
			// load the storage entity structure
			world.structureManager.place(
				"stored_items/" + storage, dimension,
				{...location, y: dimension.heightRange.max - 2},
				{includeBlocks: false}
			)
			// get the entity in the next tick
			system.run(()=> { //delay it to the next tick
				const entity = dimension.getEntities({type: "skybedrock:item_storage", tags: [storage]})[0]
				const container = entity.getComponent("inventory").container
				stored_items[storage] = [] // load each item of the storage to the array
				for (let i = 0; i < container.size; i++) {
					const item = container.getItem(i)
					if (!item) break
					stored_items[storage].push(item)
				}
				entity.remove() // remove the storage entity
			})
		}
		system.clearRun(wait_for_player) // stop this run once a player is found
	})
})()

// Create the original guidebook
const guidebook = new ItemStack("skybedrock:guidebook")
guidebook.setLore(["§r§7By Yasser444", "§r§7Original"])

world.afterEvents.playerSpawn.subscribe(({player, initialSpawn}) => {
	if (!initialSpawn) return // when a player logs in
	// this scoreboard won't be loaded if this addon was added to another world
	if (!world.scoreboard.getObjective('Timer')) {
		player.sendMessage(`§cYou are not playing Skybedrock or your map is outdated.`)
		return
	}
	
	if (!player.getDynamicProperty("got_book")) { 
		player.setDynamicProperty("got_book", true)
		const {container} = player.getComponent("inventory")
		if (!container.getItem(8)) container.setItem(8, guidebook)
		else container.addItem(guidebook)
	}
})

// this removes the biome detector entity on /reload so it doesn't hurt the player 
world.afterEvents.worldInitialize.subscribe(() => {
	['overworld', 'nether', 'the_end'].forEach(dimension => 
		world.getDimension(dimension)
		.getEntities({type: "skybedrock:biome_detector"})
		.forEach(entity => entity.remove())
	)
})