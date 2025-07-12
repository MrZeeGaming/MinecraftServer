import { world, system } from "@minecraft/server"

system.runInterval(() => {
    world.getAllPlayers().forEach(player => {
        if (player.dimension.id != "minecraft:overworld" || player.getDynamicProperty("free_vision")) {
            player.runCommand(`fog @s remove vision_limit`)
        } else player.runCommand(`fog @s push skybedrock:vision_limit vision_limit`)
    })
}, 20)

system.afterEvents.scriptEventReceive.subscribe(({id, message, sourceEntity:player}) => {
    if (id != "skybedrock:unlock_vision") return
    player.setDynamicProperty("free_vision", message == "yes")
})