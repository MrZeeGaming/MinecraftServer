import { Dimension, system } from "@minecraft/server"

export const biome_names = {
	plains: "§aPlains",
	sunflower_plains: "§aSunflower Plains",
	taiga: "§2Taiga",
	taiga_hills: "§2Taiga Hills",
	taiga_mountains: "§2Taiga Mountains",
	snowy_taiga: "§3Snowy Taiga",
	snowy_taiga_hills: "§sSnowy Taiga Hills",
	snowy_taiga_mountains: "§sSnowy Taiga Mountains",
	old_growth_pine_taiga: "§2Old Growth Pine Taiga",
	mega_taiga: "§4Mega Taiga",
	old_growth_spruce_taiga: "§2Old Growth Spruce Taiga",
	redwood_taiga: "§mRedwood Taiga",
	swamp: "§qSwamp",
	swamp_hills: "§qSwamp Hills",
	mangrove_swamp: "§mMangrove Swamp",
	desert: "§6Desert",
	desert_hills: "§6Desert Hills",
	desert_lakes: "§gDesert Lakes",
	jungle: "§qJungle",
	jungle_hills: "§qJungle Hills",
	modified_jungle: "§qModified Jungle",
	sparse_jungle: "§2Sparse Jungle",
	jungle_edge: "§qJungle Edge",
	bamboo_jungle: "§2Bamboo Jungle",
	bamboo_jungle_hills: "§2Bamboo Jungle Hills",
	birch_forest: "§aBirch Forest",
	birch_forest_hills: "§aBirch Forest Hills",
	old_growth_birch_forest: "§aOld Growth Birch Forest",
	tall_birch_hills: "§aTall Birch Hills",
	dark_forest: "§qDark Forest",
	roofed_forest: "§qRoofed Forest",
	savanna: "§pSavanna",
	savanna_plateau: "§pSavanna Plateau",
	windswept_savanna: "§pWindswept Savanna",
	shattered_savanna: "§pShattered Savanna",
	mushroom_fields: "§uMushroom Fields",
	mushroom_field_shore: "§uMushroom Field Shore",
	windswept_hills: "§7Windswept Hills",
	gravelly_mountains: "§7Gravelly Mountains",
	windswept_forest: "§jWindswept Forest",
	gravelly_forest: "§jGravelly Forest",
	mountain_edge: "§7Mountain Edge",
	ocean: "§9Ocean",
	warm_ocean: "§bWarm Ocean",
	lukewarm_ocean: "§sLukewarm Ocean",
	cold_ocean: "§3Cold Ocean",
	frozen_ocean: "§tFrozen Ocean",
	deep_ocean: "§1Deep Ocean",
	deep_warm_ocean: "§sDeep Warm Ocean",
	deep_lukewarm_ocean: "§tDeep Lukewarm Ocean",
	deep_cold_ocean: "§1Deep Cold Ocean",
	deep_frozen_ocean: "§tDeep Frozen Ocean",
	legacy_frozen_ocean: "§tLegacy Frozen Ocean",
	badlands: "§cBadlands",
	eroded_badlands: "§hEroded Badlands",
	badlands_plateau: "§nBadlands Plateau",
	wooded_badlands: "§jWooded Badlands",
	modified_badlands: "§cModified Badlands",
	modified_wooded_badlands: "§jModified Wooded Badlands",
	forest: "§2Forest",
	wooded_hills: "§2Wooded Hills",
	flower_forest: "§dFlower Forest",
	river: "§9River",
	frozen_river: "§bFrozen River",
	beach: "§eBeach",
	snowy_beach: "§fSnowy Beach",
	stony_shore: "§7Stony Shore",
	snowy_plains: "§fSnowy Plains",
	ice_spikes: "§bIce Spikes",
	meadow: "§qMeadow",
	grove: "§jGrove",
	cherry_grove: "§dCherry Grove",
	snowy_slopes: "§iSnowy Slopes",
	stony_peaks: "§8Stony Peaks",
	jagged_peaks: "§8Jagged Peaks",
	frozen_peaks: "§tFrozen Peaks",
	snowy_mountains: "§fSnowy Mountains",
	lush_caves: "§dLush Caves",
	dripstone_caves: "§nDripstone Caves",
	deep_dark: "§sDeep Dark",
	pale_garden: "§vPale Garden",
	nether_wastes: "§cNether Wastes",
	crimson_forest: "§mCrimson Forest",
	warped_forest: "§3Warped Forest",
	soulsand_valley: "§bSoul Sand Valley",
	basalt_deltas: "§8Basalt Deltas",
	the_end: "§5The End",
}

Dimension.prototype.getBiome = async function({x, y, z}) {
    const location = {x: x, y: Math.max(this.heightRange.min, Math.min(this.heightRange.max - 1, y)), z: z}
    try {
		const entity = this.spawnEntity("skybedrock:biome_detector", location)
		return new Promise((resolve) => {
			system.runTimeout(() => {
				if (!entity?.isValid()) return
				const biome = entity.getTags()?.find(tag => Object.keys(biome_names).includes(tag))
				entity.remove()
				resolve(biome ?? undefined)
			}, 1)
		})
	} catch {null}
}