# Texture packs

## Folder format
Your texture packs images must be placed in the folder `assets/images/<texture pack name>` \
You can then copy the folder structure in the default texture packs to serve as a base


```
|
|- entities
| |- buildings
| |- projectiles
| |- units
|- icons
|- maps 
```

## Animations
Animation are made using vertical bands, all the state of the animation are in the same image, the engine then gets the one it needs at runtime 

## pack.json
Each texture pack must come with a `pack.json` \
This file contains metadata about your texture pack, it must be a valid [json file](https://fr.wikipedia.org/wiki/JavaScript_Object_Notation).

The json object found in the file follows the same structure as the directory structure, the root of the object being the root folder of the texture pack
```json
{
	"entities": {
		"buildings": "...",
		"projectiles": "...",
        "units": "..."
	}
}
```
When setting a property, it will apply automatically to all the subfolders recursively

### properties
Valid properties are :

| property name          | description                                                                                                            | expected value |
|------------------------|------------------------------------------------------------------------------------------------------------------------|----------------|
| extension              | The file format of the images                                                                                          | string         |
| animationFrameDuration | The time between animation frames in millisecond<br/>(60fps is one frame every 17ms)                                   | number         |
| textureType            | gives information about which images the game should look for for the current path<br/>Details at the end of the table | string         |
| angleBetweenRotations  | The angle in deg between rotation when the unit can rotate                                                             | number         |
| isSymmetric            | For units which can rotate : if true, will mirror image oriented to the right to create images oriented to the left    | boolean        |
| pixelWidth             | The width of the image in pixel (when doing animation you must specify the width of one state)                         | number         |
| pixelHeight            | The Height of the image in pixel (when doing animation you must specify the height of one state)                       | number         |
| pixelSize              | Define both `pixelWidth` and `pixelHeight` in a single rule                                                            | number         |
| worldWidth             | The width of the unit when drawn in the game, expressed in cell                                                        | number         |
| worldHeight            | The height of the unit when drawn in the game, expressed in cell                                                       | number         |
| worldSize              | Define both `worldWidth` and `worldHeight` in a single rule                                                            | number         |   

#### textureType details
`textureType` can take one the following values :
- `IMAGE`: Used for icons and maps, when this value is used `animationFrameDuration` is the only other property not ignored
- `BASE_ONLY`: Used for units that can't rotate, when using this value the folder should only contain an image named `base`
- `ROTATION_ONLY`: Used for units whose texture is totally dependent on their rotation, when using this value, the folder should contain one image per valid angle as defined by `angleBetweenRotations` and `isSymmetric`
- `ROTATION_AND_BASE`: Used for units with both a static part and a rotation dependant part, must have both a `base` image and one image per valid angle

Properties order has no impact

### Default values :
```json
{
    "extension": "png",
    "animationFrameDuration": 1000,
    "angleBetweenRotations": 90,
    "isSymmetric": true,
    "textureType": "IMAGE",
    "pixelSize": 128,
    "worldSize": 1,
    "entities": {
        "textureType": "ROTATION_ONLY",
        "buildings": {
            "textureType": "ROTATION_AND_BASE",
            "pixelHeight": 256,
            "worldHeight": 2,
            "tower": { 
                "textureType": "BASE_ONLY"
            }
        },
        "projectiles": {
            "angleBetweenRotations": 15,
            "animationFrameDuration": 500
        }
    }
}
```
