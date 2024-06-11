import sys
import json
import zipfile
import lzo
import os
from PIL import Image


def main():
    layer_name = sys.argv[1].split("/")[1]

    with open("temp/Document.json", "r") as doc:
        doc_json = json.load(doc)
        tile_size = doc_json.get("tile_size")

        layers = doc_json.get("layers")

        layers.append(doc_json.get("composite"))

        layer = next(layer for layer in layers if (layer.get("UUID") == layer_name))

        width = layer.get("width")
        height = layer.get("height")

        img = Image.new("RGBA", (width, height))

        zipref = zipfile.ZipFile("temp/file.procreate", "r")

        allfiles = zipref.namelist()
        layer_files = list(filter(lambda x: layer_name in x, allfiles))

        for file in layer_files:
            img_file = zipref.read(file)
            decompressed_bytes = lzo.decompress(
                img_file, False, tile_size * tile_size * 4)
            img_tile = Image.frombytes(
                "RGBA", (tile_size, tile_size), decompressed_bytes)

            x = file.split(".")[0].split("~")[0]
            y = file.split(".")[0].split("~")[1]

            print(x, y)

            img.paste(img_tile, (x * tile_size, y * tile_size))

        img.save("temp/{}-output.bmp".format(layer_name))


if __name__ == "__main__":
    main()
