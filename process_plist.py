from biplist import readPlist, InvalidPlistException, NotBinaryPlistException
import struct
import sys
import json

try:
    file_name = sys.argv[1]
    plist = readPlist(file_name)

    output = {}

    objects = plist.get('$objects')

    composite_number = objects[1].get('composite').integer
    composite_key_number = objects[composite_number].get('UUID').integer
    composite_key = objects[composite_key_number]

    output["composite_key"] = composite_key

    background_color_bytes = objects[objects[1].get("backgroundColor").integer]

    background_color = []

    for i in range(0, 4):
        background_color.append(struct.unpack('<f', background_color_bytes[i*4:(i+1)*4]))

    output["background_color"] = background_color
    output["background_hidden"] = objects[1].get("backgroundHidden")

    output["tile_size"] = objects[1].get("tileSize")

    output["orientation"] = objects[1].get("orientation")

    output["flipped_horizontally"] = objects[1].get("flippedHorizontally")

    layers_number = objects[1].get('layers').integer

    layers_list = objects[layers_number].get('NS.objects')

    layers_list = list(map(lambda x: x.integer, layers_list))

    output["layers"] = []

    for i in layers_list:
        layer_obj = {}

        layer_plist_obj = objects[i]

        layer_obj["locked"] = layer_plist_obj.get("locked")
        layer_obj["blend_mode"] = layer_plist_obj.get("blend")
        layer_obj["perserve"] = layer_plist_obj.get("preserve")
        layer_obj["hidden"] = layer_plist_obj.get("hidden")
        # layer_obj["tranform"] = objects[layer_plist_obj.get("transform").integer] # vomits wtf is this format
        layer_obj["name"] = objects[layer_plist_obj.get("name").integer]
        layer_obj["clipped"] = layer_plist_obj.get("clipped")
        layer_obj["UUID"] = objects[layer_plist_obj.get("UUID").integer]
        layer_obj["opacity"] = layer_plist_obj.get("opacity")
        layer_obj["width"] = layer_plist_obj.get("sizeWidth")
        layer_obj["height"] = layer_plist_obj.get("sizeHeight")

        output["layers"].append(layer_obj)

    json_file_name = file_name.split(".")[0] + ".json"

    with open(json_file_name, "w") as f:
        json.dump(output, f, indent=2)

    print("sucessfully outputed {}".format(json_file_name))

except (InvalidPlistException, NotBinaryPlistException) as e:
    print("Not a plist:", e)
