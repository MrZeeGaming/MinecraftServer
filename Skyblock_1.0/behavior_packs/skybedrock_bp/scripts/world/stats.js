import {world} from "@minecraft/server"

world.afterEvents.playerPlaceBlock.subscribe(({player, block}) => {
    const placed = JSON.parse(player.getDynamicProperty('blocks_placed') || '{}')
    placed[block.typeId] = (placed[block.typeId] ?? 0) + 1
    player.setDynamicProperty('blocks_placed', JSON.stringify(placed))
})

world.afterEvents.playerBreakBlock.subscribe(({player, brokenBlockPermutation:block}) => {
    const placed = JSON.parse(player.getDynamicProperty('blocks_broken') || '{}')
    placed[block.type.id] = (placed[block.type.id] ?? 0) + 1
    player.setDynamicProperty('blocks_broken', JSON.stringify(placed))
})

world.afterEvents.itemUse.subscribe(({source:player, itemStack}) => {
    const used = JSON.parse(player.getDynamicProperty('items_used') || '{}')
    used[itemStack.typeId] = (used[itemStack.typeId] ?? 0) + 1
    player.setDynamicProperty('items_used', JSON.stringify(used))
})

world.afterEvents.itemUseOn.subscribe(({source:player, itemStack}) => {
    const used = JSON.parse(player.getDynamicProperty('items_used_on') || '{}')
    used[itemStack.typeId] = (used[itemStack.typeId] ?? 0) + 1
    player.setDynamicProperty('items_used_on', JSON.stringify(used))
})

world.afterEvents.entityDie.subscribe(({damageSource, deadEntity:entity}) => {
    if (damageSource.damagingEntity?.typeId  != 'minecraft:player') return
    const player = damageSource.damagingEntity
    const killed = JSON.parse(player.getDynamicProperty('mobs_killed') || '{}')
    killed[entity.typeId] = (killed[entity.typeId] ?? 0) + 1
    player.setDynamicProperty('mobs_killed', JSON.stringify(killed))
})