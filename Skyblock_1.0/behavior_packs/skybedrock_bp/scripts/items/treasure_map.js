import { ActionFormData} from "@minecraft/server-ui" ;
import { world, system } from "@minecraft/server" ;
import { stored_items } from "../startup";

const overworld = world.getDimension('overworld');

export function getCardinalDirection(player) {
  let angle = player.getRotation().y + 180
  const degree = 360 / 8;
  angle += degree / 2;
  for (let i = 0; i < 8; i++) {
    if (angle >= (i * degree) && angle < (i + 1) * degree) return i;
  }
  return 0;
}

function show_map(player, pLocation, tLocation) {
	const isFarHalf = tLocation.z >= 96
	let [markX, markZ, playerX, playerZ] = [
		tLocation.x - 32,
		tLocation.z - (isFarHalf ? 96 : 64),
		pLocation.x - 32,
		pLocation.z - (isFarHalf ? 96 : 64),
	];
	playerX < 0 ? playerX = 0 : playerX > 31 ? playerX = 31 : null
	playerZ < 0 ? playerZ = 0 : playerZ > 31 ? playerZ = 31 : null
	const direction = getCardinalDirection(player);
	let map = new ActionFormData()
	.title("Treasure Map")
	map.button(`T x${markX < 10 ?'0' : ''}${markX}z${markZ}`)
	map.button(`P d${direction}x${playerX < 10 ?'0' : ''}${playerX}z${playerZ}`)
	map.show(player)
}
function create_map(player) {
	const location = { y:0,
		x: 32 + Math.floor(Math.random() * 32),
		z: 64 + Math.floor(Math.random() * 64),
	}
	player.setDynamicProperty('treasure_location', location);
	return location
}
function find_treasure(player) {
	player.setDynamicProperty('treasure_location', undefined);
	player.runCommand("clear @s yasser444:treasure_map 0 1");
	system.runTimeout(()=>{world.playSound("dig.sand", player.location)},10)
	system.runTimeout(()=>{world.playSound("dig.sand", player.location)},20)
	system.runTimeout(()=>{world.playSound("dig.sand", player.location)},30)
	system.runTimeout(()=>{
		player.getComponent("inventory").container.addItem(stored_items.sky_treasure[0])
		world.playSound("dig.sand", player.location)
	},40)
	
}

world.afterEvents.itemUse.subscribe(({itemStack, source:player}) => {
	const {dimension, location} = player
	if (itemStack.typeId === "yasser444:treasure_map" && dimension === overworld) {
		//create a map
		const treasureLocation = player.getDynamicProperty('treasure_location') ?? create_map(player);
		const playerLocation = {x: Math.floor(location.x), z: Math.floor(location.z)};
		if (treasureLocation.x === playerLocation.x && treasureLocation.z === playerLocation.z) { // give treasure
			find_treasure(player)
		} else { //display the map
			show_map(player, playerLocation, treasureLocation)
		}
	}
})