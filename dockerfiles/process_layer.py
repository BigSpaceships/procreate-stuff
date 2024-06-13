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

        layer_files = os.listdir("temp/" + layer_name)

        for file_name in layer_files:
            with open("temp/{}/{}".format(layer_name, file_name), "rb") as file:
                img_bytes = file.read()

                img_tile = Image.frombytes(
                    "RGBA", (tile_size, tile_size), img_bytes)

                x = int(file_name.split(".")[0].split("~")[0])
                y = int(file_name.split(".")[0].split("~")[1])

                # print(x, y)

                img.paste(img_tile, (x * tile_size, y * tile_size))

        img.save("temp/{}-output.bmp".format(layer_name))


if __name__ == "__main__":
    main()
