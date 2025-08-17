import { ActionFormData, ModalFormData } from "@minecraft/server-ui" 
import { world, ItemStack, system } from "@minecraft/server" 
import { see_achievements, view_ach, achievements, complete, undo } from "../world/quests.js"
import { change_logs, feature_history } from "../history.js"
import { nether_structures } from "../world/maps.js"
import { overworld_structures } from "../world/maps.js"
import { see_a_map, see_maps } from "../world/maps.js"

const main_page = [
  {color: "§4", key: "achievements", function: see_achievements},
  {color: "§1", key: "maps", function: see_maps},
  {color: "§6", key: "settings", function: settings_page},
  {color: "§d", key: "history", function: history_page},
  {color: "§n", key: "support", function: support_the_map},
  {color: "§q", key: "trader", function: request_trader},
]

const versions = Object.keys(change_logs)
const features = Object.keys(feature_history)

world.beforeEvents.playerInteractWithBlock.subscribe(({itemStack:item, player, block, isFirstEvent}) => {
	if (!isFirstEvent) return
	if (item?.typeId != "minecraft:book") return
	if (block.typeId != "minecraft:grass_block") return
	if (block.above().typeId != "minecraft:air") return
	system.run(() => {
		player.runCommand("clear @s book 0 1")
		block.dimension.spawnItem(new ItemStack("skybedrock:guidebook"), block.above().bottomCenter())
	})
})

world.afterEvents.itemUse.subscribe(({itemStack:item, source:player}) => {
	if (item.typeId == "skybedrock:guidebook") {
		const page = item.getLore().filter(line => line.startsWith('§r§3'))[0]?.replace('§r§3', '')
		open_bookmark(player, page)
	}
})

export function open_book(player, body={translate: 'guidebook.intro_message'}) {
	const owner = player.nameTag == "HiYasser444" && player.getGameMode() == "creative"
	let form = new ActionFormData()
	.title({rawtext: [{text: '§book_ui§'}, {translate: 'item.skybedrock:guidebook'}]})
	.body(body)
	.button({rawtext: [{text: '§bookmark§'}, {translate: `guidebook.remove_bookmark`}]})
	for (const button of main_page) form.button({rawtext: [{text: '§section ' + button.color}, {translate: `guidebook.${button.key}.button`}]})
	if (owner) form.button('§section §uOwner Commands')
	form.show(player).then(({selection:action, canceled}) => {
		if (canceled) return; action--
		if (action == -1) bookmark(player)
		else if (action == main_page.length && owner) view_commands(player)
	  	else main_page[action].function(player)
	})
}

function view_commands(player, body="how did you get here?  :)") {
	const timer = world.scoreboard.getObjective('Timer') 
	const commands = [
		`Command Terminal`,
		`Revoke all Achievements`,
		`Unclaim all Rewards`,
		`View Your Stats`,
		`Reset Your Stats`,
		// `Teleport to a structure`,
		`${timer ? 'Reset' : 'Initilize'} the Timer`,
		`Show the Timer`,
		`Hide the Timer`,
		`Limit the Render Distance`,
		`Make the Book Original`,
		`Reset the End\n§7do /reload`,
	]
	const form = new ActionFormData()
	.title('§book_ui§' + "Commands")
	.body(body)
	.button({rawtext: [{text: '§bookmark§'}, {translate: `guidebook.set_bookmark`}]})
	.button("Back")
	for (const command of commands) {
		form.button(`§section ${command}`)
	}
	form.show(player).then(({selection, canceled}) => {
		if (canceled) return
		if (selection == 0) bookmark(player, 'Commands')
		if (selection == 1) open_book(player)
		switch (commands[selection - 2]) {
			case `Command Terminal`: {
				const form = new ModalFormData()
				.title("Terminal")
				.textField('Command:', "")
				.show(player).then(({formValues, canceled}) => {
					if (canceled) return
					const args = formValues[0].split(' ')
					switch (args[0]) {
						case 'ach': switch (args[1]) {
							case 'grant': complete(player, args[2]); break
							case 'revoke': undo(player, args[2]); break
						}; break
					}
				})
			}; break
			case `Revoke all Achievements`: player.setDynamicProperty("completed_achs"); break
			case `Unclaim all Rewards`: player.setDynamicProperty("claimed_rewards"); break
			case `View Your Stats`: {
				const list_stats = (title, stat) => {
					player.sendMessage(title)
					const items = JSON.parse(player.getDynamicProperty(stat) ?? '{}')
					Object.keys(items).forEach(item => player.sendMessage(`${item}: ${items[item]}`))
					player.sendMessage('')
				}
				list_stats('§lBlocks Placed:', "blocks_placed")
				list_stats('§lBlocks Broken:', "blocks_broken")
				list_stats('§lItems Used:', "items_used")
				list_stats('§lItems Used on Blocks:', "items_used_on")
				list_stats('§lMobs Killed:', "mobs_killed")
			}; break
			case `Reset Your Stats`: {
				player.setDynamicProperty("blocks_placed")
				player.setDynamicProperty("blocks_broken")
				player.setDynamicProperty("items_used")
				player.setDynamicProperty("items_used_on")
				player.setDynamicProperty("mobs_killed")
			}; break
			case `Reset the Timer`: {
				player.runCommand(`scoreboard objectives remove Timer`)
				player.runCommand(`scoreboard objectives add Timer dummy`)
			}; break
			case `Initilize the Timer`: player.runCommand(`scoreboard objectives add Timer dummy`); break
			case `Show the Timer`: player.runCommand(`scoreboard objectives setdisplay sidebar Timer`); break
			case `Hide the Timer`: player.runCommand(`scoreboard objectives setdisplay sidebar`); break
			case `Limit the Render Distance`: player.setDynamicProperty("free_vision"); break
			case `Teleport to a structure`: {
				const place_on_map = (pos, dimension) => Math.max(-256, Math.min(256, Math.floor((pos * 25 / (['minecraft:nether', 'minecraft:the_end'].includes(dimension) ? 25 : 100)) * 0.75)))
				const form = new ActionFormData().title("Structure Locator")
				const pois = {
					...overworld_structures,
					...nether_structures,
					spawn: { structure: "Spawn", icon: "oak_tree", x:0, z:0},
					commands: { name: "Commands", icon: "command_block", x:5600, z:4000},
					the_end: { name: "The End", icon: "endstone", dim:"minecraft:the_end", x:100, z:0},
				}
				Object.keys(pois).forEach(id => {
					const {name, location, icon} = pois[id]
					const x = place_on_map(location.x, location.dim)
					const z = place_on_map(location.z, location.dim)
					form.button(`§structure §x${x} §y${z} ${name}`, `textures/ui/map/${icon ?? id}`)
				})
				form.show(player)
				.then((response) => {
					if (response.canceled) return
					const location = Object.values(pois)[response.selection].location
					player.teleport({x: location.x, y: 100, z: location.z}, {dimension: world.getDimension(location.dim ?? 'overworld')})
				})
			}; break
			case `Make the Book Original`: {
				const guidebook = new ItemStack("skybedrock:guidebook")
				guidebook.setLore(["§r§7By Yasser444", "§r§7Original"])
				player.getComponent('equippable').setEquipment('Mainhand', guidebook)
			}; break
			case `Reset the End\n§7do /reload`: world.setDynamicProperty("open_gateways"); break
		}
	})
}

export function bookmark(player, page) {
	const equipement = player.getComponent('equippable')
	const guidebook = equipement.getEquipment('Mainhand')
	if (!guidebook || guidebook.typeId != "skybedrock:guidebook") return
	const lore = guidebook.getLore().filter(line => line.startsWith('§r§7'))
	if (page) lore.unshift('§r§3' + page)
	guidebook.setLore(lore)
	equipement.setEquipment('Mainhand', guidebook)
	open_bookmark(player, page)
}

function open_bookmark(player, page) {
	if (!page) open_book(player)
	else if (page == 'Achievements') see_achievements(player)
	else if (page == 'World Maps') see_maps(player)
	else if (page == 'Overworld Biomes') see_a_map(player, 'overworld_biomes')
	else if (page == 'Nether Biomes') see_a_map(player, 'nether_biomes')
	else if (page == 'Overworld Structures') see_a_map(player, 'overworld_structures')
	else if (page == 'Nether Structures') see_a_map(player, 'nether_structures')
	else if (page == 'The End Map') see_a_map(player, 'the_end_map')
	else if (page == 'History') history_page(player)
	else if (page == 'Commands') view_commands(player, " ")
	else if (page == 'Features History') features_history(player)
	else if (page.endsWith(' History')) features_history(player, features.indexOf(page.replace(' History', '')))
	else if (page.startsWith('Version ')) changelogs_page(player, versions.indexOf(page.replace('Version ', '')))
	else if (page.startsWith('A: ')) view_ach(player, Object.keys(achievements).find(id => achievements[id].title == page.replace('A: ', '')))
	else open_book(player)
}

const settings = [
	{
		toggle: "Biome Detector",
		section: 'player',
		note: "shows the biome you are currently in.",
		value: (player) => player.getDynamicProperty('biome_detector'),
		action: (player, option) => player.setDynamicProperty('biome_detector', option),

	},
	{
		toggle: "Totem of Unfalling",
		section: 'player',
		note: "totems will prevent you from dying to the void.",
		value: (player) => player.getProperty("yasser444:totem_of_unfalling"),
		action: (player, option) => player.setProperty('yasser444:totem_of_unfalling', option),
	},
	{
		toggle: "See Locked Achievements",
		section: 'player',
		note: "too many achievements might slow down your game.",
		value: (player) => player.getDynamicProperty("see_locked_achs"),
		action: (player, option) => player.setDynamicProperty('see_locked_achs', option),
	},
	{
		toggle: "Keep Inventory",
		section: 'world',
		note: "players will keep thier items when they die",
		value: () => world.gameRules["keepInventory"],
		action: (_, option) => world.gameRules["keepInventory"] = option,
	},
	{
		dropdown: "Achievement Auto Detection",
		section: 'world',
		options: ["Every 2 seconds", "Every Tick", "Off"],
		value: () => world.getDynamicProperty('auto_detection'),
		action: (_, option) => world.setDynamicProperty('auto_detection', option)
	},
	{
		toggle: "Player Heads",
		section: 'world',
		note: "enables lighting bolts to convert zombie and skeleton heads into player heads.",
		value: () => world.getDynamicProperty("player_heads"),
		action: (_, option) => world.setDynamicProperty('player_heads', option),
	},
	{
		toggle: "Renewable Dragon Eggs",
		section: 'world',
		note: "enables the summoning ritual for dragon eggs.",
		value: () => world.getDynamicProperty("dragon_eggs"),
		action: (_, option) => world.setDynamicProperty('dragon_eggs', option),
	},
	{
		toggle: "Enderman+",
		section: 'world',
		note: "enables endermen to pickup frosted ice, suspicious sand, suspicious gravel, and farmland.",
		value: () => world.getDynamicProperty("enderman_pickup"),
		action: (_, option) => world.setDynamicProperty('enderman_pickup', option),
	},
	{
		toggle: "Natural Shriekers",
		section: 'world',
		note: "sculk shriekers placed in the deep dark can spawn wardens.",
		value: () => world.getDynamicProperty("natural_shriekers"),
		action: (_, option) => world.setDynamicProperty('natural_shriekers', option),
	},
]

function settings_page(player) {
	const form = new ModalFormData()
	.title("§6Settings")
	.submitButton("Save Changes")
	settings.forEach(setting => {
		if (setting.toggle) {
			const { toggle, section, note, value } = setting
			form.toggle(
				`§${section}${toggle}\n` +
				(note ? `§7${note}\n` : ''),
				value(player)
			)
		}
		if (setting.dropdown) {
			const { dropdown, section, note, options, value } = setting
			form.dropdown(
				`§${section}${dropdown}\n` +
				(note ? `§7${note}\n` : ''),
				options,
				value(player)
			)
		}
	})
	form.show(player).then(({canceled, formValues:options}) => {
		open_book(player)
		if (canceled) return
		for (let i = 0; i < settings.length; i++) {
			const option = options[i]
			const setting = settings[i]
			setting.action(player, option)
		}
	})
}
function history_page(player) {
  new ActionFormData()
  .title('§book_ui§' + "§5History")
  .body('§d' + change_logs[versions[0]])
  .button({rawtext: [{text: '§bookmark§'}, {translate: `guidebook.set_bookmark`}]})
  .button("§title §5Current Version: " + versions[0])
  .button("Back")
  .button("§section §dChangelogs")
  .button("§section §dFeatures")
  .show(player).then(({canceled, selection}) => {
    if (canceled) return; selection--
	if (selection == -1) bookmark(player, 'History')
    if (selection == 1) open_book(player)
    if (selection == 2) changelogs_page(player)
    if (selection == 3) features_history(player)
  })
}


function changelogs_page(player, index=0) {
  const form = new ActionFormData()
  .title('§book_ui§' + "§5Changelogs")
  .body('§d' + change_logs[versions[index]])
  .button({rawtext: [{text: '§bookmark§'}, {translate: `guidebook.set_bookmark`}]})
  .button("§title §5Version " + versions[index])
  .button("Back")
  versions.forEach(version => form.button('§section §d' + (versions[index] == version ? '> ' : '') + version))
  form.show(player).then(({canceled, selection}) => {
    if (canceled) return; selection--
	if (selection == -1) bookmark(player, 'Version ' + versions[index])
    if (selection == 1) history_page(player)
    if (selection > 1) changelogs_page(player, selection - 2)
  })
}

function features_history(player, index) {
  const title = features[index]
  const form = new ActionFormData()
  .title('§book_ui§' + "§5Features History")
  .body(index == undefined ? {translate: 'guidebook.help_message'} : feature_history[title])
  .button({rawtext: [{text: '§bookmark§'}, {translate: `guidebook.set_bookmark`}]})
  .button("§title §5" + (index == undefined ? '' : title))
  .button("Back")
  features.forEach(feature => form.button('§section ' + (title == feature ? '§6> §r' : '') + feature))
  form.show(player).then(({canceled, selection}) => {
    if (canceled) return; selection--
	if (selection == -1) bookmark(player, (index == undefined ? 'Features' : title) + ' History')
    if (selection == 1) history_page(player)
    if (selection > 1) features_history(player, selection - 2)
  })
}

function support_the_map(player) {
  open_book(player, {translate: 'guidebook.support_message'})
}


//temporary fix
let trader_request
function request_trader(player) {
  if (!trader_request) {
	player.sendMessage(["§e", {translate: "guidebook.trader_request.message"}])
	trader_request = true
  } else {
	player.sendMessage(["§c", {translate: "guidebook.trader_request.already"}])
  }
}

system.runInterval(() => {
	if (!trader_request) return
	if (world.getTimeOfDay() != 0) return
	trader_request = undefined
	try {
		world.getDimension("minecraft:overworld").spawnEntity("wandering_trader", {x:0, y:65, z:0})
	} catch {
		world.sendMessage(["<§t", {translate: "entity.wandering_trader.name"}, "§r> ", {translate: "guidebook.trader_request.failed"}])
	}
})