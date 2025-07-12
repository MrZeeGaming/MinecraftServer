import { world, system } from "@minecraft/server" ;

const overworld = world.getDimension('overworld');


function initialize() {
	const randomAngle = Math.random() * 360;
	const angles = [ randomAngle, randomAngle + 120, randomAngle + 240 ]
	for (let i = 0; i < 3; i++) {
		world.setDynamicProperty(`stronghold${i + 1}`, getLocation(angles[i]));
	}
}

function getLocation(angle) {
	angle = (Math.PI / 180) * angle; // to radian
	return {
		x: Math.round(1280 * Math.cos(angle)),
		y: 32,
		z: Math.round(1280 * Math.sin(angle)),
	}
}

function locate(player) {
	const location = player.location;
	const strongholds = [
		world.getDynamicProperty("stronghold1"),
		world.getDynamicProperty("stronghold2"),
		world.getDynamicProperty("stronghold3"),
	]
	strongholds.sort((vectorA, vectorB) => {
		const distanceA = getDistance(location, vectorA)
		const distanceB = getDistance(location, vectorB)
		return distanceA - distanceB;
	});
	const nearest = strongholds[0];
	makeParticles(location, nearest);
	consume_the_eye(player);
	[1, 2, 3].forEach(i => {
		const distance = getDistance(location, world.getDynamicProperty(`stronghold${i}`))
		const generated = world.getDynamicProperty(`generatedStronghold${i}`)
		if (distance < 64 && !generated) generate(i)
	})
}

function getDistance(from, to) {
	const relative = {
		x: to.x - from.x,
		z: to.z - from.z,
	}
	return Math.sqrt(relative.x ** 2 + relative.z ** 2)
}

function makeParticles(from, to) {
	const direction = normalize(from, to)
	for (let i = 1; i <= 8; i++) {
		overworld.spawnParticle(
			"minecraft:dragon_breath_trail", {
				x: from.x + i * direction.x,
				y: from.y + 1,
				z: from.z + i * direction.z,
			}
		)
	}
}

function consume_the_eye(player) {
	if (player.getGameMode() != 'creative' && Math.random() < 0.1) {
		world.playSound("block.itemframe.break", player.location, {volume: 1})
		player.runCommand("clear @s ender_eye 0 1")
	} else {
		world.playSound("random.bow", player.location)
	}
}

function normalize(from, to) {
	return {
		x: (to.x - from.x) / getDistance(from, to),
		z: (to.z - from.z) / getDistance(from, to),
	}
}

function generate(i) {
	const location = world.getDynamicProperty(`stronghold${i}`)
	const [x, z] = [location.x, location.z]
	world.setDynamicProperty(`generatedStronghold${i}`, true)
	overworld.runCommand(`structure load strongholds:stronghold${i} ${x} 31 ${z}`)
}

//reset
// world.setDynamicProperty("stronghold1");
// world.setDynamicProperty("stronghold2");
// world.setDynamicProperty("stronghold3");
// world.setDynamicProperty("generatedStronghold1");
// world.setDynamicProperty("generatedStronghold2");
// world.setDynamicProperty("generatedStronghold3");

world.afterEvents.itemUse.subscribe(({itemStack, source:player}) => {
	if (itemStack?.typeId === "minecraft:ender_eye" && player.dimension === overworld) { 
		if (!world.getDynamicProperty("stronghold1")) initialize()
		locate(player)
	}
})