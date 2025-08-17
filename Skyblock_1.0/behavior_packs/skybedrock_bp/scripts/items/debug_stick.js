import { world } from "@minecraft/server"
import { ActionFormData} from "@minecraft/server-ui"

world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }) => {
	itemComponentRegistry.registerCustomComponent("yasser444:debug_stick", {
    onUseOn({block, source:player, itemStack:stick}) {
      const inventory = player.getComponent("inventory").container
      const perm = block.permutation
      const mode = stick.getLore()[0]?.replace('§r§n', '')
      if (mode == "read id") player.sendMessage("§nId: §r"+block.typeId)
      if (mode == "copy permutation") try{inventory.addItem(perm.getItemStack())} catch (error) {player.sendMessage("§cNo Item for this permutation")}
      if (mode == "copy block") inventory.addItem(block.getItemStack(1, true))
    },
    onUse({itemStack:stick, source:player}) {
      if (player.getBlockFromViewDirection()) return
      const form = new ActionFormData()
      .title("Debug Stick")
      .button("Read Id Mode")
      .button("Copy Permutation Mode")
      .button("Copy Block Mode")
      .show(player).then(({canceled, selection}) => {
        if (canceled) return
        if (selection == 0) stick.setLore(["§r§nread id"])
        if (selection == 1) stick.setLore(["§r§ncopy permutation"])
        if (selection == 2) stick.setLore(["§r§ncopy block"])
        player.getComponent("equippable").setEquipment('Mainhand', stick)
      })
    }
  })
})