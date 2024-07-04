import * as AngleUtils from "./AngleUtils.js";
import entities from "../models/entities/entities.js";
import AbstractBuilding from "../models/entities/AbstractBuilding.js";
import AbstractProjectile from "../models/entities/AbstractProjectile.js";
import AbstractUnit from "../models/entities/AbstractUnit.js";

export const TextureType = {
    IMAGE: Symbol("IMAGE"),
    ROTATION_AND_BASE: Symbol("ROTATION_AND_BASE"),
    ROTATION_ONLY: Symbol("ROTATION_ONLY"),
    BASE_ONLY: Symbol("BASE_ONLY")
}

const DEFAULTS = {
    extension: "png",
    animationFrameDuration: 1000,
    angleBetweenRotations: 90,
    isSymmetric: true,
    textureType: TextureType.IMAGE,
    pixelSize: 128,
    worldSize: 1,
    entities: {
        textureType: TextureType.ROTATION_ONLY,
        buildings: {
            textureType: TextureType.ROTATION_AND_BASE,
            pixelHeight: 256,
            worldHeight: 2,
            // archer: { textureType: TextureType.BASE_ONLY }
        },
        projectiles: {
            angleBetweenRotations: 15,
            animationFrameDuration: 500
        }
    }
}

class TextureMeta {
    /** @type {TextureMeta | null} */
    #parent
    #extension
    #animationFrameDuration
    #angleBetweenRotations
    #isSymmetric
    #textureType
    #pixelWidth
    #pixelHeight
    #worldWidth
    #worldHeight

    constructor(parent, {extension, animationFrameDuration, angleBetweenRotations, isSymmetric, textureType, pixelWidth, pixelHeight, pixelSize, worldWidth, worldHeight, worldSize}) {
        this.#parent = parent

        this.#extension = extension
        this.#animationFrameDuration = animationFrameDuration
        this.#angleBetweenRotations = angleBetweenRotations
        this.#isSymmetric = isSymmetric
        this.#textureType = textureType
        this.#pixelWidth = pixelWidth ?? pixelSize
        this.#pixelHeight = pixelHeight ?? pixelSize
        this.#worldWidth = worldWidth ?? worldSize
        this.#worldHeight = worldHeight ?? worldSize
    }

    get extension() { return this.#extension ?? this.#parent.extension }
    get animationFrameDuration() { return this.#animationFrameDuration ?? this.#parent.animationFrameDuration }
    get angleBetweenRotations() { return this.#angleBetweenRotations ?? this.#parent.angleBetweenRotations }
    /** @return {TextureType} */
    get textureType() { return this.#textureType ?? this.#parent.textureType }
    get isSymmetric() { return this.#isSymmetric ?? this.#parent.isSymmetric }
    get pixelWidth() { return this.#pixelWidth ?? this.#parent.pixelWidth }
    get pixelHeight() { return this.#pixelHeight ?? this.#parent.pixelHeight }
    get worldWidth() { return this.#worldWidth ?? this.#parent.worldWidth }
    get worldHeight() { return this.#worldHeight ?? this.#parent.worldHeight }
}

const textureListLeaf = Symbol()
const textureList = {
    // {buildings: {archer: textureListLeaf, ...}, ...}
    entities: Object.values(entities).reduce(
        (acc, klass) => {
            console.log(klass)
            switch (klass.__proto__) {
                case AbstractBuilding: {
                    acc.buildings[klass.name.toLowerCase()] = textureListLeaf
                    break
                }
                case AbstractProjectile: {
                    acc.projectiles[klass.name.toLowerCase()] = textureListLeaf
                    break
                }
                case AbstractUnit: {
                    acc.units[klass.name.toLowerCase()] = textureListLeaf
                    break
                }
            }
            return acc
        },
        {buildings: {}, projectiles: {}, units: {}}
    ),
    icons: {
        money: textureListLeaf,
        life: textureListLeaf,
        crystal: textureListLeaf,
        wave: textureListLeaf
    },
    maps: {
        classic: {
            // additions: textureListLeaf,
            base: textureListLeaf
        },
        test: {
            base: textureListLeaf
        }
    }
}

export default class TexturePack {
    /** @type {string} */
    #name
    /** @type {Map<string, Texture>} */
    #textures
    /** @type {Promise} */
    #initPromise
    /** @type {TextureMeta} */
    #packMeta

    constructor(name) {
        this.#name = name
        this.#textures = null
        this.#initPromise = null
    }

    get name() { return this.#name }
    get packMeta() { return this.#packMeta }

    /**
     * @param {string} path
     * @return {Promise<Texture>}
     */
    async getTexture(path) {
        if (this.#textures === null && this.#initPromise === null) { this.#initPromise = this.#init() }
        await this.#initPromise
        return this.#textures.get(path)
    }

    #init() {
        return fetch(`/assets/images/${this.#name}/pack.json`)
            .then(res => res.json())
            .then(packMeta => {

                /** @type {[string[], TextureMeta, (Object<string, Object | symbol> | symbol)][]}  */
                const toGet = [[[], null, textureList]]
                /** @type {{[key: string]: Texture}} */
                const textures = {}

                while(toGet.length !== 0) {
                    const [path, localMeta, item] = toGet.shift()
                    if (item === textureListLeaf) {
                        let localDefault = DEFAULTS
                        let localPackMeta = packMeta
                        for (const part of path) {
                            localDefault = localDefault?.[part]
                            localPackMeta = localPackMeta?.[part]
                        }
                        textures[path.join("/")] = Texture.for(path, new TextureMeta(localMeta, {...localDefault, ...localPackMeta}))
                    } else {
                        let localDefault = DEFAULTS
                        let localPackMeta = packMeta
                        for (const part of path) {
                            localDefault = localDefault?.[part]
                            localPackMeta = localPackMeta?.[part]
                        }
                        const textureMeta = new TextureMeta(localMeta, {...localDefault, ...localPackMeta})
                        if (localMeta === null) { this.#packMeta  = textureMeta }
                        Object.keys(item).forEach(key => {
                            toGet.push(
                                [
                                    [...path, key],
                                    textureMeta,
                                    item[key]
                                ]
                            )
                        })
                    }
                }
                this.#textures = new Map()
                ;[...Object.entries(textures)].forEach(([key, item]) => this.#textures.set(key, item))
            })
    }

    changeDocumentTextures() {
        const elements = document.body.querySelectorAll("*[data-texture]")
        elements.forEach(async element => {
            element.setAttribute("src", (await this.getTexture(element.dataset.texture)).getBase().src)
        })
    }
}


/**
 * @typedef {{
 *     hasBase: boolean,
 *     width: number,
 *     height: number,
 *     angleBetweenImages: number,
 *     animationSpeed: number
 * }} EntityImageMetaData
 */

/**
 * @param {string} name
 * @param {number[]} [angles=[0, 90, 180]]
 */


class Texture {
    /** @type {number} */
    static #baseMarker = -1

    /** @type {TextureMeta} */
    #meta
    /** @type {Map<number, HTMLImageElement>} */
    #imageElements = new Map()

    constructor(meta) {
        this.#meta = meta
    }


    /**
     * @param {number} orientation
     * @return {HTMLImageElement}
     */
    getForOrientation(orientation) { return this.#imageElements.get(orientation) }
    /**
     * @return {HTMLImageElement}
     */
    getBase() { return this.getForOrientation(Texture.#baseMarker) }

    get animationFrameDuration() { return this.#meta.animationFrameDuration }
    get animationFrameCount() { return this.getForOrientation(0).height / this.pixelHeight }
    get animationFrameCountForBase() { return this.getForOrientation(Texture.#baseMarker).height / this.pixelHeight }
    get angleBetweenRotations() { return this.#meta.angleBetweenRotations }
    /** @return {TextureType} */
    get textureType() { return this.#meta.textureType }
    get pixelWidth() { return this.#meta.pixelWidth }
    get pixelHeight() { return this.#meta.pixelHeight; }
    get worldWidth() { return this.#meta.worldWidth }
    get worldHeight() { return this.#meta.worldHeight; }


    static for(path, textureMeta) {
        const result = new Texture(textureMeta)
        const texturesDiv = document.getElementById("textures")

        if (textureMeta.textureType === TextureType.IMAGE) {
            const image = document.createElement("img")
            image.src = `/assets/images/${globalThis.options.texturePack.name}/${path.join("/")}.png`
            texturesDiv.appendChild(image)
            result.#imageElements.set(Texture.#baseMarker, image)
            return result
        }

        if (textureMeta.textureType !== TextureType.BASE_ONLY && (360 % textureMeta.angleBetweenRotations) !== 0) {
            console.error("Given textureMeta angle isn't valid", textureMeta)
            throw new TypeError("Given textureMeta angle isn't valid")
        }

        if (textureMeta.textureType !== TextureType.ROTATION_ONLY) {
            const image = document.createElement("img")
            image.src = `/assets/images/${globalThis.options.texturePack.name}/${path.join("/")}/base.${textureMeta.extension}`
            texturesDiv.appendChild(image)
            result.#imageElements.set(Texture.#baseMarker, image)
        }

        if (textureMeta.textureType === TextureType.BASE_ONLY) {
            return result
        }

        let angle = 0
        while (angle < 360) {
            const image = document.createElement("img")
            if (angle <= 180 || (angle > 180 && ! textureMeta.isSymmetric)) {
                image.src = `/assets/images/${globalThis.options.texturePack.name}/${path.join("/")}/${angle}.${textureMeta.extension}`
                texturesDiv.appendChild(image)
                result.#imageElements.set(AngleUtils.clampAngleDeg(angle - 90), image)
            }

            if (textureMeta.isSymmetric) {
                if (angle !== 0 && angle !== 180) {
                    const hoistedAngle = angle
                    image.onload = () => {
                        // create a canvas
                        const canvas = document.getElementById("utilsCanvas")
                        canvas.width = image.width
                        canvas.height = image.height
                        // paste the image reversed left<->right on it
                        const context = canvas.getContext("2d")
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        context.scale(-1, 1)
                        context.drawImage(image, -canvas.width, 0)

                        // create a new image element with the rotated image
                        const rotatedImage = document.createElement("img")
                        rotatedImage.src = canvas.toDataURL("image/png")
                        texturesDiv.appendChild(rotatedImage)
                        result.#imageElements.set(AngleUtils.clampAngleDeg(270 - hoistedAngle), rotatedImage)
                    }
                }
            }

            angle += textureMeta.angleBetweenRotations
        }
        result.#imageElements.set(360, result.#imageElements.get(0));
        return result
    }
}
