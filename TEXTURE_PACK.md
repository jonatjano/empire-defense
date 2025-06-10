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

| property name         | description                                                                                                           | expected value          |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------|-------------------------|
| extension             | The file format of the images                                                                                         | string                  |
| textureType           | gives information about which images the game should look for in the current path<br/>Details at the end of the table | string                  |
| angleBetweenRotations | The angle in deg between rotation of images when the unit can rotate                                                  | number                  |
| isSymmetric           | For units which can rotate : if true, will mirror image oriented to the right to create images oriented to the left   | boolean                 |
| pixelWidth            | The width of the image in pixel (when doing animation you must specify the width of one state)                        | number                  |
| pixelHeight           | The Height of the image in pixel (when doing animation you must specify the height of one state)                      | number                  |
| pixelSize             | Define both `pixelWidth` and `pixelHeight` in a single rule                                                           | number                  |
| worldWidth            | The width of the unit when drawn in the game, expressed in cell                                                       | number                  |
| worldHeight           | The height of the unit when drawn in the game, expressed in cell                                                      | number                  |
| worldSize             | Define both `worldWidth` and `worldHeight` in a single rule                                                           | number                  |
| animations            | Give details about the entity animations                                                                              | Record<name, Animation> |

#### textureType details
`textureType` can take one the following values :
- `"IMAGE"`: Used for icons and maps, when this value is used `animationFrameDuration` is the only other property not ignored
- `"BASE_ONLY"`: Used for units that can't rotate, when using this value the folder should only contain an image named `base`
- `"ROTATION_ONLY"`: Used for units whose texture is totally dependent on their rotation, when using this value, the folder should contain one image per valid angle as defined by `angleBetweenRotations` and `isSymmetric` (view [rotation](#rotation))
- `"ROTATION_AND_BASE"`: Used for units with both a static part and a rotation dependant part, must have both a `base` image and one image per valid angle (view [rotation](#rotation))

Properties order has no impact

#### rotation
When creating a unit which can rotate, you have to create one image per rotation and name it with the angle in degree of the rotation. \
For the image names, the angles start to the bottom goes anticlockwise : 0° is bottom, 90° is right, 180° is top and 270° is left.

i.e. if your unit can rotate by angles of `45°` then you need to have `0.png`, `45.png`, `90.png`, `135.png` and `180.png` \
if you set the property `isSymetric` to false for that unit, you also need to create `225.png`, `270.png` and `315.png` \
there is no need for 360° because it is equivalent to 0°

#### animation details
An Animation is an object, here are the properties of these objects

While you can add new animation, those won't be played, so there is no reason to do it
You can however remove animations, the game will simply not play them

| property name | description                                                                                                               | expected value |
|---------------|---------------------------------------------------------------------------------------------------------------------------|----------------|
| timings       | An array containing the time of each frame in millisecond                                                                 | number[]       |
| fixedStart    | Whether the animation frame is decided based on the global time (`true`) or the time when the animation was set (`false`) | boolean        |


### Default values :
These are the values used when you do not define them in your `pack.json`, defining a value will override it.

```json
{
	"extension": "png",
	"angleBetweenRotations": 90,
	"isSymmetric": true,
	"textureType": "IMAGE",
	"pixelSize": 128,
	"worldSize": 1,
	"animations": {
		"idle": {
			"timings": [
				1000
			],
			"fixedStart": true
		}
	},
	"entities": {
		"textureType": "ROTATION_ONLY",
		"buildings": {
			"textureType": "ROTATION_AND_BASE",
			"pixelHeight": 256,
			"worldHeight": 2
		},
		"projectiles": {
			"angleBetweenRotations": 15,
			"animationFrameDuration": 500
		}
	}
}
```
If these values are the one you want to use, you can set your own `pack.json` content to : 
```json
{}
```
