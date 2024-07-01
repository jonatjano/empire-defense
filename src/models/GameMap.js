import Position from "./Position.js";

class Tile {
    #name
    #canWalk
    #canFly
    #canBuild
    constructor(name, {canWalk = true, canFly = true, canBuild = true} = {}) {
        this.#name = name
        this.#canWalk = canWalk
        this.#canFly = canFly
        this.#canBuild = canBuild
        Tile.registerImage(name)
    }

    get name() { return this.#name }
    get canWalk() { return this.#canWalk }
    get canFly() { return this.#canFly }
    get canBuild() { return this.#canBuild }

    static registerImage(name) {
        const imageContainer = document.getElementById("imageSources")
        const image = document.createElement("img")
        image.src = `/assets/images/devpack/tiles/${name}.png`
        imageContainer.appendChild(image)
        globalThis.tileImages[name] = image
    }

    static {
        /**
         * @type {{}}
         */
        globalThis.tileImages = {}
        /**
         * @type {{
         *     [entityName: string]: {
         *         base?: HTMLImageElement,
         *         0: HTMLImageElement,
         *         90: HTMLImageElement,
         *         180: HTMLImageElement,
         *         270: HTMLImageElement,
         *         360: HTMLImageElement
         *     }
         * }}
         */
        globalThis.entityImages = {}
    }
}

const tiles = Object.freeze({
    air: new Tile("air", {canWalk: false, canBuild: false}),
    spawn: new Tile("spawn", {canBuild: false}),
    target: new Tile("target", {canBuild: false}),
    grass: new Tile("grass"),
})

const defaultCharToTile = Object.freeze({
    A: tiles.air,
    S: tiles.spawn,
    T: tiles.target,
    g: tiles.grass,
})

class GameMap {
    /** @type {string} */
    #name
    /** @type {Array<Array<Tile>>} */
    #mapData
    /** @type {Readonly<{top: number, left: number, bottom: number, right: number}>} */
    #offset

    /**
     * @param {string} name
     * @param {Array<Array<Tile>>} mapData
     * @param {{top?: number, left?: number, bottom?: number, right?: number}} offset
     */
    constructor(name, mapData, offset = {}) {
        GameMap.checkMapData(mapData)

        this.#name = name
        this.#mapData = mapData
        this.#offset = Object.freeze({top: 0, left: 0, bottom: 0, right: 0, ...offset})
    }

    get height() {
        return this.#mapData.length
    }

    get width() {
        return this.#mapData[0].length
    }

    get offset() {
        return this.#offset
    }

    getTile(x, y) {
        return this.#mapData[y][x];
    }

    /**
     * @return {Position[]}
     */
    get spawns() { return this.#getTilesByType(tiles.spawn) }

    /**
     * @return {Position[]}
     */
    get targets() { return this.#getTilesByType(tiles.target) }

    /**
     * @param {Tile} type
     * @return {Position[]}
     */
    #getTilesByType(type) {
        const result = []
        this.#mapData.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === type) { result.push(new Position(x, y)) }
            })
        })
        return result
    }

    get name() {
        return this.#name
    }

    static checkMapData(mapData) {
        const foundInterest = {spawn: false, target: false}
        for (let y = 0; y < mapData.length; y++) {
            for (let x = 0; x < mapData[y].length; x++) {
                if (mapData[y][x] === tiles.spawn) { foundInterest.spawn = true }
                if (mapData[y][x] === tiles.target) { foundInterest.target = true }
            }
        }
        if (! foundInterest.spawn || ! foundInterest.target) {
            throw new Error("given map data is invalid, missing either a spawn or a target")
        }
    }

    /**
     * @param {Position} position
     * @return {boolean}
     */
    positionIsValid(position){
        return position.x >= 0 && position.y >= 0 && position.x < this.width && position.y < this.height
    }
}

/**
 * @param {Object<string, Object>} tiles
 * @param {string} template
 * @return {Array<Array<Tile>>}
 */
function mapDataFromString(tiles, template) {
    const width = template.split("\n")
        .map(row => row.replaceAll(/\W/g, ""))
        .find(row => row.length !== 0)?.length

    const height = template.split("\n")
        .map(row => row.replaceAll(/\W/g, ""))
        .filter(row => row.length !== 0)
        .length

    // check that the parameters are correct
    if (width !== undefined && width < 1 && height < 1) {
        throw new Error(`Can't generate map from given data, width = ${width}, height = ${height}, template = ${template}`);
    }
    const errorTileKey = Object.keys(tiles).find(key => key.length !== 1)
    if (errorTileKey) {
        throw new Error(`Can't generate map from given data, tile key ${errorTileKey} is incorrect, should be 1 char`);
    }

    // remove invisible characters from the template
    template = template.replaceAll(/\W/g, '')
    console.log(template)

    return new Array(height).fill(0).map((_, y) =>
        new Array(width).fill(0).map((_, x) => {
            // todo view if there isn't an inversion between x and y (again T_T)
            const tile = tiles[template[y * width + x]]
            if (tile === undefined) {
                console.error(`Can't generate map from given data, tile with name ${template[y * width + x]} doesn't exists`, tiles)
                throw new Error(`Can't generate map from given data, tile with name ${template[y * width + x]} doesn't exists`)
            }
            return tile
        })
    )
}

export const maps = Object.freeze([
    new GameMap(
        "classic",
        // left/top trees
        // bottom cliff
        // right wall with column next to the target
        mapDataFromString(
            {
                ...defaultCharToTile,
                c: tiles.air, // cliff
                t: tiles.air, // trees
                w: tiles.air, // wall
                C: tiles.air, // column around exit
                d: tiles.grass // dirt
            },
            `
            AttttttttttttttttwA
            AtgggggggggggggggwA
            AtgggggggggggggggwA
            AtgggggggggggggggwA
            AtgggggggggggggggwA
            SddgggggggggggggddT
            AtgggggggggggggggwA
            AtgggggggggggggggwA
            AtgggggggggggggggwA
            AtgggggggggggggggwA
            AtgggggggggggggggwA
            ccccccccccccccccccc
            ccccccccccccccccccc
            `
        ),
        {left: 1, right: 1}
    ),
    new GameMap(
        "test",
        mapDataFromString(defaultCharToTile,
            `
            AgggA
            gSgTg
            ggggg
            ggAgg
            AgggA
            `
        )
    )
])