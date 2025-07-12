import { ActionFormData } from "@minecraft/server-ui" ;
import { world, system } from "@minecraft/server" ;
import { version, categories, queries, check_items, rewards, custom_challenges } from "../achievements.js";
import { bookmark, open_book } from "../items/guidebook.js"

function expand_ach(lines) {
  const find = (prefix) => lines.find(line => line.startsWith(prefix))?.replace(prefix, '')
  return {
    id: lines[0],
    icon: find('icon: '),
    title: find('title: '),
    parent: find('require: '),
    reward: find('reward: '),
	consume: find('consume: '),
	image: find('image: '),
    summary: lines.filter(line => line.startsWith('* ')).join('/n'),
    conditions: lines.filter(line => line.startsWith('- ')),
    note: lines.find(line => line.startsWith('(') && line.endsWith(')')),
  }
}

function flat_category(categories) {
  const achievements = {}
  Array.from(categories) //map -> [["id", "category"]]
  .map(cat => cat[1][1]) // -> ["categories"]
  .join('\n') // -> "category"
  .split('\n\n') // -> ["achs"]
  .forEach(ach => {
	const lines = ach.split('\n')
	achievements[lines[0]] = expand_ach(lines)
  }); return achievements
}

function is_unlocked(id, completed_achs) {
	const parent = achievements[id].parent
	const ids = Object.keys(achievements)
	if (parent == undefined) return true
	if (completed_achs.includes(id)) return true
	if (ids.includes(parent)) {
		return completed_achs.includes(parent)
	}
	if (parent.includes('&')) {
	  const list = parent.slice(1, -1).split(' & ')
	  if (list.every(ach => ids.includes(ach))) {
	    return list.every(ach => completed_achs.includes(ach))
	  }
	}
	if (parent.includes('|')) {
	  const list = parent.slice(1, -1).split(' | ')
	  if (list.every(ach => ids.includes(ach))) {
	    return list.some(ach => completed_achs.includes(ach))
	  }
	}
	return true
}

function is_disabled(id) {
	const parent = achievements[id].parent
	if (!parent) return
	if (parent.includes('&')) {
	  const list = parent.slice(1, -1).split(' & ')
	  return list.includes('locked')
	}
}

export function complete(player, id) { //load, add, save, announce
  const completed_achs = JSON.parse(player.getDynamicProperty("completed_achs") ?? '[]')
  completed_achs.push(id)
  player.setDynamicProperty("completed_achs", JSON.stringify(completed_achs))
  world.sendMessage({translate: 'achievements.announcement.message', with: [player.nameTag, achievements[id].title]})
}

export function undo(player, id) { //load, remove, save
  let completed_achs = JSON.parse(player.getDynamicProperty("completed_achs") ?? '[]')
  completed_achs = completed_achs.filter(i => i != id)
  player.setDynamicProperty("completed_achs", JSON.stringify(completed_achs))
}

function claim(player, id) { //load, add, save, give reward
	if (id in rewards) {
		rewards[id](player)
	} else { //old reward system
		const reward = achievements[id].reward.split(";")[0]
		player.runCommand('gamerule sendcommandfeedback false')
		player.runCommand(reward)
		player.runCommand('gamerule sendcommandfeedback true')
	}
	const claimed_rewards = JSON.parse(player.getDynamicProperty("claimed_rewards") ?? '[]')
	claimed_rewards.push(id)
	player.setDynamicProperty("claimed_rewards", JSON.stringify(claimed_rewards))
}

export const achievements = flat_category(categories)

function detect(player, id) {
	if (!(id in queries)) return
	const query = queries[id]
	if (query.constructor.name == 'AsyncFunction') {
		system.run(async () => { if (await query(player)) complete(player, id)})
	} else if (query(player)) complete(player, id)
}

function submit(player, id) {
	const consumed = achievements[id].consume?.split(';')[0]
	const items = consumed.startsWith('[') ? consumed.replace(/\[|\]/g, '').split(', ') : [consumed]

	if (items.every(item => {
		const [id, count, data] = item.split(' ')
		return check_items(player, id, count, data)
	})) {
		items.forEach(item => {
			const [id, count, data] = item.split(' ')
			player.runCommand(`clear @s ${id} ${data ?? 0} ${count ?? 1}`)
		})
		complete(player, id)
	}
}
//auto detect
system.runInterval(() => {
	if (system.currentTick % [40, 1, 0][world.getDynamicProperty('auto_detection') ?? 0] != 0) return
	world.getAllPlayers().forEach(player => {
		const completed_achs = JSON.parse(player.getDynamicProperty("completed_achs") ?? '[]')
		Object.keys(queries)
		.filter(id => !completed_achs.includes(id)) //remove completed
		.filter(id => is_unlocked(id, completed_achs)) //remove locked
		.forEach(id => detect(player, id))
	})
})

export function see_achievements(player) {
	const completed_achs = JSON.parse(player.getDynamicProperty("completed_achs") ?? '[]')
	
	let selected_category = player.getDynamicProperty("selected_ach_category") ?? "Skyblock Path"
	if (!categories.has(selected_category)) selected_category = "Skyblock Path"
	const view = player.getDynamicProperty("ach_view") ?? "all"
	const see_locked = player.getDynamicProperty("see_locked_achs")
	const claimed_rewards = JSON.parse(player.getDynamicProperty("claimed_rewards") ?? '[]')
  
	const form = new ActionFormData()
	.title('§quests_ui§' + `§4Achievements - §8${selected_category} §9- ${version}`)
	.button("§.Back")
	.button("§view All")
	.button("§view Locked")
	.button("§view Completed")
	.button({rawtext: [{text: '§view §bookmark§'}, {translate: `guidebook.set_bookmark`}]}, "textures/ui/buttons/ach_bookmark")
	for (const [category_name, icon_and_list] of categories) {
		form.button('§category ' + category_name, ""+icon_and_list[0])
	}
	
	let ids = categories
	.get(selected_category)[1] //the category
	.split('\n\n') //split achs
	.map(ach => ach.split('\n')) //split ach lines
	.map(ach => ach[0]) //select the id
	
	if (view == "locked") ids = ids.filter(id => !completed_achs.includes(id))
	if (view == "completed") ids = completed_achs.filter(id => ids.includes(id)).reverse()
	if (!see_locked) ids = ids.filter(id => is_unlocked(id, completed_achs))
	ids = ids.filter(id => !is_disabled(id))

	for (const id of ids) {
		const {title, icon, reward} = achievements[id]
		const is_done = completed_achs.includes(id)
		const is_locked = !is_unlocked(id, completed_achs) && player.getGameMode() != "creative"
		const has_reward = !claimed_rewards.includes(id) && is_done && reward
		form.button((is_done ? "§done" : is_locked ? "§locked" : '') + (has_reward ? '§reward' : '') +title, icon)
	}
  	form.show(player).then((response) => {
		if (response.canceled) return
		const clicked = response.selection
		const category_names = []
		for (const [name, _] of categories) {
		  category_names.push(name)
		}
		switch (clicked) {
			case 0: open_book(player); return //back button
			case 1: player.setDynamicProperty("ach_view", "all"); break
			case 2: player.setDynamicProperty("ach_view", "locked"); break
			case 3: player.setDynamicProperty("ach_view", "completed"); break
			case 4: bookmark(player, 'Achievements'); break //bookmark button
		}
		if (clicked > 4 && clicked - 5 < categories.size) {  //select a category
			player.setDynamicProperty("selected_ach_category", category_names[clicked - 5])
		}
		if (clicked > categories.size + 4) { //open the achievement
		  	view_ach(player, ids[clicked - (categories.size + 5)])
		} else see_achievements(player)
  })
}

export function view_ach(player, id) {
	const dynamic_list = (name) => JSON.parse(player.getDynamicProperty(name) ?? '[]')
	const {title, icon, summary, reward, conditions, note, consume, image} = achievements[id]
	const description = `\
${summary ? '§9Summary:§r\n' + summary : ''}\
${conditions.length && !summary.endsWith(":") ? '\n\n§eRequirements:§r' : ''}
${conditions.join('.\n')}${conditions.length ? '.' : ''}
${note ? '\n' + note : ''}
${consume ? '\n§cSubmit:§r ' + consume.split('; ')[1] : ''}\
${rewards[id] ? '\n§aReward:§r ' + reward : reward ? '\n§aReward:§r ' + reward.split('; ')[1] : ''}\
`
	const is_done = dynamic_list("completed_achs").includes(id)
	const is_claimed = dynamic_list("claimed_rewards").includes(id)
	const can_claim = reward && is_done && !is_claimed
	const can_undo = false
	
	const action =
		can_claim ? "Claim Reward" :
		can_undo ? "Undo" :
		is_done ? "§aDone!" :
		id in queries ? "Detect" :
		consume ? "Submit" :
		id in custom_challenges ? "Start" : "Complete"
		
  	const form = new ActionFormData()
  	.title('§quest_screen§')
	.body(description)
	.button("§update" + action) //update button
	.button("§update" + "Back") //back button
	.button((is_done ? "§done" : '') + title, icon) //title button
	.button({rawtext: [{text: '§bookmark§'}, {translate: `guidebook.set_bookmark`}]}, "textures/ui/buttons/ach_bookmark") //bookmark button
	if (image) form.button("§image", image) // an image
	form.show(player).then(({selection:clicked, canceled}) => {
		if (canceled) return
		if (clicked == 0) {
			switch (action) {
				case "Detect": detect(player, id); break
				case "Submit": submit(player, id); break
				case "Start": custom_challenges[id].challenge(player); break
				case "Complete": complete(player, id); break
				case "Claim Reward": claim(player, id); break
				case "Undo": undo(player, id); break
			}
			view_ach(player, id)
		} else if (clicked == 3) {
			bookmark(player, 'A: ' + title)
		} else see_achievements(player)
	})
}