import { world, BlockPermutation, Block } from "@minecraft/server";

const directions = ['north', 'east', 'south', 'west']

const dewax = (block) => {return block.typeId.replace('minecraft:', '').replace('waxed_', '')}
const derust = (block) => {return block.replace('exposed_', '').replace('weathered_', '').replace('oxidized_', '')}

function type_and_direction(block) {
	const below = derust(dewax(block.below()))
	const type = below == "copper_grate" ? "ominous" :
	below == "cut_copper" ? "normal" : undefined
	for (let i=0; i<4; i++) {
		const direction = directions[i]
		const opposite = directions[i > 1 ? i - 2 : i + 2]
		if (type == "ominous") {
			if (derust(dewax(block[direction]())) == "copper_bulb") return {type: type, direction: opposite}
		}
		else if (type == "normal") {
			if (derust(dewax(block.below()[direction]())) == "cut_copper_slab") return {type: type, direction: direction}
		}
	}
}

function check_layout(player, block, vault) {
	const missing_blocks = new Set()
	if (!vault) return false
	const {type, direction} = vault
	const i = directions.indexOf(direction)
	const right = directions[i == 3 ? 0 : i + 1]
	const left = directions[i == 0 ? 3 : i - 1]
	const back = directions[i > 1 ? i - 2 : i + 2]
	const below = block.below()
	const above = block.above()
	const front = block[direction]()
	const front_below = front.below()
	if (type == "normal") {
		const cut_copper = [below, below[left](), below[right]()]
		for (const cut of cut_copper) {
			if (dewax(cut) != "cut_copper") missing_blocks.add("Cut Copper")
		}

		const side_slabs = [block[left](), block[right]()]
		const front_slabs = [front_below, front_below[left](), front_below[right]()]
		for (const slab of front_slabs.concat(side_slabs)) {
			if (slab.permutation.getState("minecraft:vertical_half") != "bottom" || dewax(slab) != "cut_copper_slab") missing_blocks.add("Cut Copper Slab")
		}
	}
	if (type == "ominous") {
		const copper_grates = [
			below, below[left](), below[right](),
			front_below, front_below[left](), front_below[right]()
		]
		for (const grate of copper_grates) {
			if (dewax(grate) != "oxidized_copper_grate") missing_blocks.add("Oxidized Copper Grates")
		}

		const upper_bulb = above.above()
		if (dewax(upper_bulb) != "copper_bulb") missing_blocks.add("Copper Bulb")

		const below_back = below[back]()
		const tuff_blocks = [
			upper_bulb[left](), upper_bulb[right](),
			block[left](), block[right](),
			below_back, below_back[left](), below_back[right]()
		]
		for (const tuff of tuff_blocks) {
			if (tuff.typeId != "minecraft:polished_tuff") missing_blocks.add("Polished Tuff")
		}

		const chiseled_tuff = above[back]()
		if (chiseled_tuff.typeId != "minecraft:chiseled_tuff") missing_blocks.add("Chiseled Tuff")

		const glazed_blocks = [chiseled_tuff[left](), chiseled_tuff[right]()]
		for (const glazed of glazed_blocks) {
			if (glazed.typeId != "minecraft:red_glazed_terracotta") missing_blocks.add("Red Glazed Terracotta")
		}

		const slabs = [above[left](), above[right]()]
		for (const slab of slabs) {
			if (!slab.permutation.matches("minecraft:polished_tuff_slab", {"minecraft:vertical_half": "top"})) missing_blocks.add("Polished Tuff Slab")
		}

		const candles = [front[left](), front[right]()]
		for (const candle of candles) {
			if (!(
				candle.permutation.matches("minecraft:red_candle", {"candles": 2}) ||
				candle.permutation.matches("minecraft:red_candle", {"candles": 3})
			))  missing_blocks.add("Red Candles")
		}
	}
	if (missing_blocks.size == 0) return true
	player.sendMessage(`Missing Blocks: §c${Array.from(missing_blocks).join('§r, §c')}§r.`)
}

function activate(block, vault) {
	if (!vault) return false
	const {type, direction} = vault
	const rotation = {
		north: "0_degrees",
		east: "90_degrees",
		south: "180_degrees",
		west: "270_degrees",
	}[direction]
	if (type == "ominous") {
		const {x, y, z} = block
		const i = directions.indexOf(direction)
		const right = directions[i == 3 ? 0 : i + 1]
		const left = directions[i == 0 ? 3 : i - 1]
		const back = directions[i > 1 ? i - 2 : i + 2]
		const front = block[direction]()

		const bulbs = [block[back](), block.above().above()]
		const candles = [front[left](), front[right]()]
		const lights = bulbs.concat(candles)
		lights.forEach(light => {
			light.setPermutation(light.permutation.withState("lit", true))
		})
		block.dimension.runCommand(`structure load ominous_vault ${x} ${y} ${z} ${rotation}`)
	} else {
		block.setPermutation( BlockPermutation.resolve("yasser444:empty_vault"))
		block.setPermutation( BlockPermutation.resolve("vault", {"minecraft:cardinal_direction": direction}))
	}
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry, itemComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('yasser444:vault', {
		onPlayerInteract({block, player}) {
			const equipment = player.getComponent("minecraft:equippable")
			const item = equipment.getEquipment("Mainhand")
			if (item.typeId != "yasser444:trial_inscription") return
			const vault = type_and_direction(block)
			const layout = check_layout(player, block, vault)
			if (!layout) return
			player.runCommand("clear @s yasser444:trial_inscription 0 1")
			activate(block, vault)
		}
	})
	itemComponentRegistry.registerCustomComponent("yasser444:spawner_core", {
    onUseOn({block, source:player}) {
      if (block.typeId != "minecraft:vault") return
      const vault = type_and_direction(block)
      const layout = check_layout(player, block, vault)
      if (!layout) return
      player.runCommand("clear @s yasser444:spawner_core 0 1")
      activate(block, vault)
    }
  })
})