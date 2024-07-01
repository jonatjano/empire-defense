import * as AngleUtils from "./AngleUtils.js";

export const TextureType = {
    IMAGE: Symbol("IMAGE"),
    ROTATION_AND_BASE: Symbol("ROTATION_AND_BASE"),
    ROTATION_ONLY: Symbol("ROTATION_ONLY"),
    BASE_ONLY: Symbol("BASE_ONLY")
}

const DEFAULTS = {
    animationFrameDuration: 1000,
    angleBetweenRotations: 90,
    isSymmetric: true,
    textureType: TextureType.IMAGE,
    size: 128,
    entities: {
        textureType: TextureType.ROTATION_ONLY,
        buildings: {
            textureType: TextureType.ROTATION_AND_BASE,
            height: 256,
            tower: { textureType: TextureType.BASE_ONLY }
        },
        projectiles: {
            angleBetweenRotations: 15,
            animationFrameDuration: 500
        }
    }
}

class TextureMeta {
    #parent
    #animationFrameDuration
    #angleBetweenRotations
    #isSymmetric
    #textureType
    #width
    #height

    constructor(parent, {animationFrameDuration, angleBetweenRotations, isSymmetric, textureType, width, height, size}) {
        this.#parent = parent

        this.#animationFrameDuration = animationFrameDuration
        this.#angleBetweenRotations = angleBetweenRotations
        this.#isSymmetric = isSymmetric
        this.#textureType = textureType
        this.#width = width ?? size
        this.#height = height ?? size
    }

    get animationFrameDuration() { return this.#animationFrameDuration ?? this.#parent.animationFrameDuration }
    get angleBetweenRotations() { return this.#angleBetweenRotations ?? this.#parent.angleBetweenRotations }
    get textureType() { return this.#textureType ?? this.#parent.textureType }
    get isSymmetric() { return this.#isSymmetric ?? this.#parent.isSymmetric }
    get width() { return this.#width ?? this.#parent.width }
    get height() { return this.#height ?? this.#parent.height }
}

const textureListLeaf = Symbol()
const textureList = {
    entities: {
        buildings: {
            tower: textureListLeaf
        },
        projectiles: {
            missile: textureListLeaf
        },
        units: {
            enemy: textureListLeaf
        }
    },
    icons: {
        money: textureListLeaf,
        life: textureListLeaf,
        crystal: textureListLeaf,
        wave: textureListLeaf
    },
    tiles: {
        air: textureListLeaf,
        grass: textureListLeaf
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


    getForOrientation(orientation) { return this.#imageElements.get(orientation) }
    getBase() { return this.getForOrientation(Texture.#baseMarker) }

    get animationFrameDuration() { return this.#meta.animationFrameDuration }
    get animationFrameCount() { return this.getForOrientation(0).height / this.height }
    get animationFrameCountForBase() { return this.getForOrientation(Texture.#baseMarker).height / this.height }
    get angleBetweenRotations() { return this.#meta.angleBetweenRotations }
    /** @return {TextureType} */
    get textureType() { return this.#meta.textureType }
    get width() { return this.#meta.width }
    get height() { return this.#meta.height; }


    static for(path, textureMeta) {
        console.log(path, textureMeta)
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
            image.src = `/assets/images/${globalThis.options.texturePack.name}/${path.join("/")}/base.png`
            texturesDiv.appendChild(image)
            result.#imageElements.set(Texture.#baseMarker, image)
        }

        if (textureMeta.textureType === TextureType.BASE_ONLY) {
            return result
        }
        console.log("rotate")
        let angle = 0
        while (angle < 360) {
            const image = document.createElement("img")
            if (angle <= 180 || (angle > 180 && ! textureMeta.isSymmetric)) {
                image.src = `/assets/images/${globalThis.options.texturePack.name}/${path.join("/")}/${angle}.png`
                texturesDiv.appendChild(image)
                result.#imageElements.set(AngleUtils.clampAngleDeg(angle - 90), image)
            }
            console.log(angle, image.src)

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
                        // result.#imageElements.set(270 - angle, rotatedImage)
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