import { world } from "@minecraft/server" 
import { ActionFormData } from "@minecraft/server-ui"
import { bookmark, open_book } from "../items/guidebook"
import { getCardinalDirection } from "../items/treasure_map"
import { biome_names } from "./biome_detector"
import { chorus_islands, end_cities, pillar_locations } from "./the_end"
import { check_block } from "../achievements"

export const locating_players = new Map()

const overworld_biomes = [
    { biome: biome_names.plains, offset: [6, 6], size: [4, 4] },
    { biome: biome_names.mangrove_swamp, offset: [10, 7], size: [2, 2] },
    { biome: biome_names.snowy_taiga, offset: [7, 4], size: [2, 2] },
    { biome: biome_names.desert, offset: [7, 10], size: [2, 2] },
    { biome: biome_names.jungle, offset: [4, 7], size: [2, 2] },

    { biome: biome_names.birch_forest, offset: [4, 4], size: [2, 2] },
    { biome: biome_names.dark_forest, offset: [10, 4], size: [2, 2] },
    { biome: biome_names.savanna, offset: [10, 10], size: [2, 2] },
    { biome: biome_names.mushroom_fields, offset: [4, 10], size: [2, 2] },

    { biome: biome_names.pale_garden, offset: [7, 1], size: [2, 2] },
    { biome: biome_names.warm_ocean, offset: [13, 7], size: [2, 2] },
    { biome: biome_names.badlands, offset: [7, 13], size: [2, 2] },
    { biome: biome_names.cherry_grove, offset: [1, 7], size: [2, 2] },

    { biome: biome_names.snowy_slopes, offset: [5, 2], size: [2, 2] },
    { biome: biome_names.grove, offset: [12, 5], size: [2, 2] },
    { biome: biome_names.wooded_badlands, offset: [9, 12], size: [2, 2] },
    { biome: biome_names.meadow, offset: [2, 9], size: [2, 2] },

    { biome: biome_names.snowy_plains, offset: [7, 3], size: [2, 1] },
    { biome: biome_names.ocean, offset: [12, 7], size: [1, 2] },
    { biome: biome_names.deep_ocean, offset: [7, 12], size: [2, 1] },
    { biome: biome_names.flower_forest, offset: [3, 7], size: [1, 2] },

    { biome: biome_names.forest, offset: [6, 4], size: [1, 2] },
    { biome: biome_names.taiga, offset: [9, 4], size: [1, 2] },
    { biome: biome_names.river, offset: [10, 6], size: [2, 1] },
    { biome: biome_names.swamp, offset: [10, 9], size: [2, 1] },
    { biome: biome_names.beach, offset: [9, 10], size: [1, 2] },
    { biome: biome_names.cold_ocean, offset: [6, 10], size: [1, 2] },
    { biome: biome_names.bamboo_jungle, offset: [4, 9], size: [2, 1] },
    { biome: biome_names.sparse_jungle, offset: [4, 6], size: [2, 1] },

    {
        surface: biome_names.windswept_hills,
        cave: biome_names.dripstone_caves,
        offset: [9, 2], size: [2, 2]
    },
    {
        surface: biome_names.stony_peaks,
        cave: biome_names.deep_dark,
        offset: [12, 9], size: [2, 2]
    },
    { biome: biome_names.jagged_peaks, offset: [5, 12], size: [2, 2] },
    {
        surface: biome_names.sunflower_plains,
        cave: biome_names.lush_caves,
        offset: [2, 5], size: [2, 2]
    },

    { biome: biome_names.stony_shore, offset: [3, 2], size: [2, 2] },
    { biome: biome_names.stony_shore, offset: [2, 3], size: [2, 2] },
    { biome: biome_names.ice_spikes, offset: [11, 2], size: [2, 2] },
    { biome: biome_names.ice_spikes, offset: [12, 3], size: [2, 2] },
    { biome: biome_names.gravelly_mountains, offset: [12, 11], size: [2, 2] },
    { biome: biome_names.gravelly_mountains, offset: [11, 12], size: [2, 2] },
    { biome: biome_names.frozen_ocean, offset: [2, 11], size: [2, 2] },
    { biome: biome_names.frozen_ocean, offset: [3, 12], size: [2, 2] },
]

const nether_biomes = [
    { biome: biome_names.nether_wastes, offset: [6, 6], size: [4, 4] },
    { biome: biome_names.crimson_forest, offset: [10, 7], size: [2, 2] },
    { biome: biome_names.soulsand_valley, offset: [7, 4], size: [2, 2] },
    { biome: biome_names.basalt_deltas, offset: [7, 10], size: [2, 2] },
    { biome: biome_names.warped_forest, offset: [4, 7], size: [2, 2] },

    { biome: biome_names.nether_wastes, offset: [3, 3], size: [4, 4] },
    { biome: biome_names.nether_wastes, offset: [3, 9], size: [4, 4] },
    { biome: biome_names.nether_wastes, offset: [9, 3], size: [4, 4] },
    { biome: biome_names.nether_wastes, offset: [9, 9], size: [4, 4] },
]

export const overworld_structures = [
	{ id: 'igloo', structure: 'Igloo', x: -347.5, z: -715.5, biome: biome_names.frozen_river, require: 'taiga' },
	{ id: 'jungle_temple', structure: 'Jungle Temple', x: -458.5, z: 883.5, biome: biome_names.jungle_edge, require: 'jungle' },
	{
		id: 'desert_pyramid', x: -761.5, z: -270.5,
		structures: ['Desert Pyramid', 'Desert Well'],
		biomes: [biome_names.desert_hills, biome_names.desert_lakes],
        require: 'desert'
	},
	{ id: 'ocean_monument', structure: 'Ocean Monument', x: 632.5, z: 759.5, biome: biome_names.lukewarm_ocean, require: 'mushroom_island' },
	{ id: 'swamp_hut', structure: 'Swamp Hut', x: 819.5, z: 356.5, biome: biome_names.swamp_hills, require: 'swamp' },
	{ id: 'mineshaft', structure: 'Mineshaft', x: 696.5, z: -232.5, biome: biome_names.modified_badlands, require: 'badlands' },
	{ id: 'pillager_outpost', structure: 'Pillager Outpost', x: -889.5, z: 438.5, biome: biome_names.savanna_plateau, require: 'savanna' },
	{ id: 'woodland_mansion', structure: 'Woodland Mansion', x: 531.5, z: -860.5, biome: biome_names.roofed_forest, require: 'dark_forest' },
	{ id: 'ancient_city', structure: 'Ancient City', x: 157.5, z: 764.5, biome: biome_names.deep_dark, require: 'deep_dark' },
	{
		id: 'ocean_ruins', x: -640.5, z: 262.5, icon: 'shipwreck',
		structures: ['Warm Ocean Ruins', 'Cold Ocean Ruins', 'Shipwreck'],
		biomes: [biome_names.deep_warm_ocean, biome_names.deep_cold_ocean, biome_names.deep_lukewarm_ocean],
        require: 'ocean'
	},
	{ id: 'trail_ruins', structure: 'Trail Ruins', x: 130.5, z: -830.5, biome: biome_names.old_growth_pine_taiga, require: 'birch' },
	{ id: 'trial_chambers', structure: 'Trial Chambers', x: 382.5, z: -496.5, biome: biome_names.old_growth_spruce_taiga, require: 'cherry' },
]

export const nether_structures = [
	{ id: 'nether_fortress', structure: 'Nether Fortress', x: 70.5, z: 127.5 },
	{ id: 'bastian_remnants', structure: 'Bastian Remnants', x: -107.5, z: 92.5 },
	{ id: 'ruined_portal', structure: 'Ruined Portal', x: -285.5, z: 141.5 },
]

export function see_maps(player) {
    const completed_achs = JSON.parse(player.getDynamicProperty("completed_achs") ?? '[]')
	const maps = [
		["§2Overworld Biomes", 'overworld_biomes'],
		["§cNether Biomes", 'nether_biomes'],
		["§pOverworld Structures", 'overworld_structures']
	]
    if (completed_achs.includes('nether')) maps.push(["§mNether Structures", 'nether_structures'])
	maps.push(["§5The End Map", 'the_end_map'])

	const form = new ActionFormData()
    .title('§book_ui§' + "Skybedrock Maps")
    .button({rawtext: [{text: '§bookmark§'}, {translate: `guidebook.set_bookmark`}]})
    .button("Back")
	maps.forEach(map => form.button('§section ' + map[0]))
	form.show(player)
    .then(({ selection, canceled }) => {
        if (canceled) return
        else if (selection == 0) bookmark(player, "World Maps")
        else if (selection == 1) open_book(player)
        else see_a_map(player, maps[selection - 2][1])
    })
}

export function see_a_map(player, map) {
    const x = Math.min(Math.max(Math.round(player.location.x / 2) + 128, 0), 256)
    const z = Math.min(Math.max(Math.round(player.location.z / 2) + 128, 0), 256)
    if (['overworld_biomes', 'nether_biomes'].includes(map)) {
        const data = {
            overworld_biomes: {
                title: 'Overworld Biomes',
                background: 'textures/ui/maps/plains_map_background',
                foreground: 'textures/ui/maps/overworld_biomes',
                in_dimension: player.dimension.id == 'minecraft:overworld',
                biomes: overworld_biomes
            },
            nether_biomes: {
                title: 'Nether Biomes',
                background: 'textures/ui/maps/nether_map_background',
                foreground: 'textures/ui/maps/nether_biomes',
                in_dimension: player.dimension.id == 'minecraft:nether',
                biomes: nether_biomes
            }
        }[map]
        const form = new ActionFormData()
        .title('§map_ui§' + data.title)
        .button(data.background, data.foreground)
        .button(data.in_dimension ? `X${x}Z${z}D${getCardinalDirection(player)}` : '')
        .button('§button§', `textures/ui/buttons/bookmark_button`)
        .button('§button§', `textures/ui/buttons/back_button`)
        data.biomes.forEach(({ biome, surface, cave, offset, size }) => {
            form.button(`§biome§ x${
                offset[0]}y${offset[1]}l${size[0]}w${size[1]}${
                surface ? 'Surface Biome: ' + surface + '\n§rCave Biome: ' + cave : 'Biome: ' + biome}\n§rx: ${
                (offset[0] - 8) * 32} §v->§r ${(offset[0] + size[0] - 8) * 32}\nz: ${
                (offset[1] - 8) * 32} §v->§r ${(offset[1] + size[1] - 8) * 32
            }`)
        })
        form.show(player)
        .then(({ selection, canceled }) => {
            if (canceled) return
            if (selection == 2) bookmark(player, data.title)
            if (selection == 3) see_maps(player)
        })
    }
    if (['overworld_structures', 'nether_structures'].includes(map)) {
        const data = {
            overworld_structures: {
                map_size: 1000,
                title: 'Overworld Structures',
                in_dimension: player.dimension.id == 'minecraft:overworld',
                structures: overworld_structures,
            },
            nether_structures: {
                map_size: 300,
                title: 'Nether Structures',
                in_dimension: player.dimension.id == 'minecraft:nether',
                structures: nether_structures,
            }
        }[map]
        const pin_to_map = (axis) => Math.min(Math.max(Math.round(axis * 128 / data.map_size * 0.75) + 128, 0), 256)
        const place = ({x, z}) => `x${pin_to_map(x)}y${pin_to_map(z)}`
        const active = locating_players.has(player.id) ? 'on' : 'off'
        const completed_achs = JSON.parse(player.getDynamicProperty("completed_achs") ?? '[]')
        const structures = data.structures.filter(structure => {
            const require = structure.require
            return !require || completed_achs.includes(require)
        })

        const form = new ActionFormData()
        .title('§map_ui§' + data.title)
        .button('textures/map/map_background', 'textures/none')
        .button(data.in_dimension ?
            `X${ pin_to_map(player.location.x)
            }Z${ pin_to_map(player.location.z)
            }D${getCardinalDirection(player)
        }` : '')
        .button('§button§', `textures/ui/buttons/switch_button_${active}`)
        .button('§button§', `textures/ui/buttons/bookmark_button`)
        .button('§button§', `textures/ui/buttons/back_button`)
        if (structures.length) {
            structures.forEach(({ id, x, z, icon, structure, structures, biome, biomes }) => {
                const hover_text = `${
                    structure ? `Structure: ${structure}` : `Structures:\n   ${structures?.join(',\n   ') ?? ''}`
                }${
                    biome ? `\nBiome: ${biome}` : biomes ? `\nBiomes:\n   ${biomes?.join(',\n   ') ?? ''}` : ''
                }\n§pClick to Locate`
                form.button(`§landmark§ ${place({x, z})}${hover_text}`, `textures/ui/map/${icon ?? id}`)
            })
        } else form.body({translate: 'guidebook.maps.no_structures'})
        form.show(player).then(({ selection, canceled }) => {
            if (canceled) return
            if (selection == 2) {
                if (active == 'on') {
                    locating_players.delete(player.id)
                    if (!player.getDynamicProperty('biome_detector')) player.onScreenDisplay.setActionBar('§.')
                } see_a_map(player, map)
            }
            if (selection == 3) bookmark(player, data.title)
            if (selection == 4) see_maps(player)
            if (selection > 4) locating_players.set(player.id, structures[selection - 5].id)
        })
    }
    else if (map == 'the_end_map') {
        const pin_to_map = (axis) => Math.min(Math.max(Math.round(axis * 128 / 120) + 128, 0), 256)
        const place = ({ x, z }) => `x${pin_to_map(x)}y${pin_to_map(z)}`
        const check_crystal = (location, fallback) => {
            const hits = world.getDimension("minecraft:the_end").getEntitiesFromRay(
                { ...location, y: 0 },
                { x: 0, y: 1, z: 0 },
                { type: "minecraft:ender_crystal", ignoreBlockCollision: true }
            )
            return hits ? hits.length > 0 : fallback
        }

        const exit = check_block(world.getDimension("minecraft:the_end"), { x: 0, y: 63, z: 1 }, "minecraft:end_portal", world.getDynamicProperty('exit_portal'))
        world.setDynamicProperty('exit_portal', exit)

        const end_pillars = JSON.parse(world.getDynamicProperty('end_pillars') ?? '[]')
        for (let i = 0; i < 10; i++) {
            end_pillars[i] = check_block(world.getDimension("minecraft:the_end"), { ...pillar_locations[i], y: 0 }, "minecraft:obsidian", end_pillars[i])
        }

        const end_crystals = JSON.parse(world.getDynamicProperty('end_crystals') ?? '[]')
        for (let i = 0; i < 10; i++) {
            end_crystals[i] = check_crystal({ ...pillar_locations[i] }, end_crystals[i])
        }
        world.setDynamicProperty('end_crystals', JSON.stringify(end_crystals))

        const form = new ActionFormData()
            .title('§map_ui§' + "The End Map")
            .button('textures/ui/maps/end_map_background', 'textures/ui/maps/main_end_island')
            .button(player.dimension.id == "minecraft:the_end" ?
                `X${pin_to_map(player.location.x)}Z${pin_to_map(player.location.z)}D${getCardinalDirection(player)}` : '')
            .button('§button§', `textures/ui/buttons/bookmark_button`)
            .button('§button§', `textures/ui/buttons/back_button`)
            .button(`§deco§ ${place({ x: 100, z: 0 })}The Obsidian Platform`, `textures/blocks/obsidian`)
            .button(`§deco§ ${place({ x: 0, z: 0 })}${exit ? 'Open' : 'Closed'} End Fountain`, `textures/ui/map/${exit ? 'open' : 'closed'}_end_fountain`)

        for (let i = 0; i < 10; i++) {
            if (end_pillars[i]) form.button(`§deco§ ${place(pillar_locations[i])}End Pillar`, 'textures/ui/map/end_pillar')
            else if (end_crystals[i]) form.button(`§deco§ ${place(pillar_locations[i])}End Crystal`, 'textures/items/end_crystal')
        }
        const open_gateways = JSON.parse(world.getDynamicProperty('open_gateways') ?? '[]')
        for (let i = 0; i < open_gateways.length; i++) {
            const count = `§.${i + 1}${(i == 0) ? 'st' : (i == 1) ? 'nd' : (i == 2) ? 'rd' : 'th'}`
            form.button(`§deco§ ${place(open_gateways[i])}${count} End Gateway${chorus_islands.get(i + 1) ? '\n  §uHas a Chorus Island' : ''}${end_cities.get(i + 1) ? '\n  §dHas an End City' : ''}${[2, 12].includes(i + 1) ? '\n  §9End Phantoms Spawn Here' : ''}`, `textures/ui/map/end_gateway`)
        }
        form.show(player)
        .then(({ selection, canceled }) => {
            if (canceled) return
            if (selection == 2) bookmark(player, 'The End Map')
            if (selection == 3) see_maps(player)
        })
    }
}

