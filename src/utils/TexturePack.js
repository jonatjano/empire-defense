import {AnimationKeys} from "../models/entities/AbstractEntity.js"
import * as AngleUtils from "./AngleUtils.js";
import entities from "../models/entities/entities.js";
import AbstractBuilding from "../models/entities/AbstractBuilding.js";
import AbstractProjectile from "../models/entities/AbstractProjectile.js";
import AbstractUnit from "../models/entities/AbstractUnit.js";

/**
 * what kind of texture is used for the entity
 * @type {{IMAGE: symbol, ROTATION_AND_BASE: symbol, ROTATION_ONLY: symbol, BASE_ONLY: symbol}}
 */
export const TextureType = {
    // used for icons and stuff
    IMAGE: Symbol("IMAGE"),
    // BASE means there is an image to draw before the rotation specific images
    // ROTATION means there is an image for different rotations
    ROTATION_AND_BASE: Symbol("ROTATION_AND_BASE"),
    ROTATION_ONLY: Symbol("ROTATION_ONLY"),
    BASE_ONLY: Symbol("BASE_ONLY")
}

/**
 * @typedef {{timings: number[], fixedStart: boolean}} AnimationMeta
 */

/**
 * default values for texture packs pack.json
 */
const DEFAULTS = {
    partial: false,
    extension: "png",
    angleBetweenRotations: 90,
    isSymmetric: true,
    textureType: TextureType.IMAGE,
    pixelSize: 128,
    worldSize: 1,
    animations: {
        [AnimationKeys.IDLE]: {
            timings: [1000],
            fixedStart: true
        }
    },
    entities: {
        textureType: TextureType.ROTATION_ONLY,
	    units: {
		    animations: {
			    [AnimationKeys.WALK]: {
				    timings: [1000],
				    fixedStart: true
			    },
			    [AnimationKeys.DEAD]: {
				    timings: [1000],
				    fixedStart: true
			    }
		    },
	    },
        buildings: {
            animations: {
                [AnimationKeys.IDLE]: {
                    timings: [1000],
                    fixedStart: true
                },
                [AnimationKeys.SELL]: {
                    timings: [1000],
                    fixedStart: true
                }
            },
            textureType: TextureType.ROTATION_AND_BASE,
            pixelHeight: 256,
            worldHeight: 2,
            // archer: { textureType: TextureType.BASE_ONLY }
        },
        projectiles: {
            angleBetweenRotations: 15,
            animationFrameDuration: 500
        }
    },
    vfx: {
        pixelSize: 32,
        animations: {
            [AnimationKeys.SPAWN_ARROW]: {
                timings: [1000, 1000],
                fixedStart: true
            },
            [AnimationKeys.TARGET_ARROW]: {
                timings: [1000, 1000],
                fixedStart: true
            },
            [AnimationKeys.SLOWED_DOWN]: {
                timings: [1000, 1000],
                fixedStart: true
            },
            [AnimationKeys.BOOSTED_UP]: {
                timings: [1000, 1000],
                fixedStart: true
            }
        }
    }
}

/**
 * metadata for a texture
 * applying the parent value recursively if missing
 */
class TextureMeta {
    /** @type {TextureMeta | null} */
    #parent
    /**
     * whether the texture pack can fallback to the default texture pack for missing textures or should fail
     * @type {boolean}
     */
    #partial
    /**
     * the file extension of the texture
     * @type {string}
     */
    #extension
    /**
     * the angle between rotations of the texture in degrees
     * @type {number}
     */
    #angleBetweenRotations
    /**
     * whether to generate or load the left-looking images for the texture
     * @type {boolean}
     */
    #isSymmetric
    /** @type {TextureType} */
    #textureType
    /** @type {number} */
    #pixelWidth
    /** @type {number} */
    #pixelHeight
    /** @type {number} */
    #worldWidth
    /** @type {number} */
    #worldHeight
    /** @type {Record<string, AnimationMeta>} */
    #animations

    constructor(parent, {
        partial,
        extension,
        angleBetweenRotations, isSymmetric,
        textureType,
        pixelWidth, pixelHeight, pixelSize,
        worldWidth, worldHeight, worldSize,
        animations
    }) {
        this.#parent = parent

        this.#partial = partial
        this.#extension = extension
        this.#angleBetweenRotations = angleBetweenRotations
        this.#isSymmetric = isSymmetric
        this.#textureType = typeof textureType === "string" ? TextureType[textureType] : textureType
        this.#pixelWidth = pixelWidth ?? pixelSize
        this.#pixelHeight = pixelHeight ?? pixelSize
        this.#worldWidth = worldWidth ?? worldSize
        this.#worldHeight = worldHeight ?? worldSize
        this.#animations = animations
    }

    /** @return {boolean} */
    get partial() { return this.#partial ?? this.#parent.partial }
    /** @return {string} */
    get extension() { return this.#extension ?? this.#parent.extension }
    /** @return {number} */
    get angleBetweenRotations() { return this.#angleBetweenRotations ?? this.#parent.angleBetweenRotations }
    /** @return {TextureType} */
    get textureType() { return this.#textureType ?? this.#parent.textureType }
    /** @return {boolean} */
    get isSymmetric() { return this.#isSymmetric ?? this.#parent.isSymmetric }
    /** @return {number} */
    get pixelWidth() { return this.#pixelWidth ?? this.#parent.pixelWidth }
    /** @return {number} */
    get pixelHeight() { return this.#pixelHeight ?? this.#parent.pixelHeight }
    /** @return {number} */
    get worldWidth() { return this.#worldWidth ?? this.#parent.worldWidth }
    /** @return {number} */
    get worldHeight() { return this.#worldHeight ?? this.#parent.worldHeight }
    /** @return {Record<string, AnimationMeta>} */
    get animations() { return this.#animations ?? this.#parent.animations }
}

/**
 * symbol used in textureList to indicate the position of an image to load
 */
const textureListLeaf = Symbol()
/**
 * directory structure for texture packs
 */
const textureList = {
    // keep first here to ensure it is present when trying to frame other images
    frame: textureListLeaf,

    vfx: textureListLeaf,

    entities: (function rec(object) {
        if (object === null) { return [] }
        switch (object.__proto__) {
            case AbstractBuilding: {
                return [
                    object,
                    ...rec(object.upgradesTo),
                    object.projectile
                ]
            }
            case AbstractProjectile:
            case AbstractUnit:
                return object
            default: {
                return Object.values(object).flatMap(v => rec(v))
            }
        }
    })(entities).reduce(
        (acc, klass) => {
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
        wave: textureListLeaf,
        option: textureListLeaf,
        speed1: textureListLeaf,
        speed2: textureListLeaf,
        speed5: textureListLeaf,
        zoomIn: textureListLeaf,
        zoomOut: textureListLeaf,
    },
    maps: {
        classic: textureListLeaf,
        test: textureListLeaf
    },
}

/**
 * loads the Texture so we can get them easily later
 */
export default class TexturePack {
    /**
     * the rotation in degree we want portrayed in the framed variant, the closest if not available
     * @type {Number}
     */
    static get framedRotation() {return 60};

    /** @type {string} */
    #name
    /**
     * map linking the path to the textures
     * @type {Map<string, Texture>}
     */
    #textures
    /**
     * once this promise is resolved, the textures are loaded
     * @type {Promise}
     */
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
     * get one texture by its path, if the pack was not loaded yet, it will be loaded
     * @param {string} path
     * @return {Promise<Texture>}
     */
    async getTexture(path) {
        if (this.#textures === null && this.#initPromise === null) {
            this.#initPromise = fetch(`/assets/images/${this.#name}/pack.json`)
                .then(res => res.blob())
                .then(blob => this.init(blob))
        }
        await this.#initPromise
        return this.#textures.get(path)
    }

    /**
     * initializes the texture pack by loading the pack.json and all textures
     * @param {Blob} packJsonBlob
     * @param {File[]} [files] only used for webkitDirectory (drag and drop imports)
     * @return {Promise}
     */
    init(packJsonBlob, files) {
        const isWebkitDirectory = files !== undefined
        this.#initPromise = packJsonBlob.text()
            .then(async content => {
                const packMeta = JSON.parse(content)

                /**
                 * 0: current path relative to pack root,
                 * 1: local meta for the current path
                 * 2: the current item in the texture list
                 * @type {[string[], TextureMeta, (Object<string, Object | symbol> | symbol)][]}
                 */
                const toGet = [[[], null, textureList]]
                /** @type {{[key: string]: Texture}} */
                const textures = {}
                const promises = []

                // while there are still textures to get
                while(toGet.length !== 0) {
                    const [path, localMeta, item] = toGet.shift()
                    // if the item is a leaf, it means we have reached a texture to load
                    if (item === textureListLeaf) {
                        let localDefault = DEFAULTS
                        let localPackMeta = packMeta
                        for (const part of path) {
                            localDefault = localDefault?.[part]
                            localPackMeta = localPackMeta?.[part]
                        }
                        // texture meta local to this directory
                        const textureMeta = new TextureMeta(localMeta, {...localDefault, ...localPackMeta})

                        // the actual image loading promise
                        const texturePromise = isWebkitDirectory ?
                            Texture.forWebkitDirectory(files, path, this.#name, textureMeta) :
                            Texture.for(path, this.#name, textureMeta)

                        if (path.join("/") === "frame") {
                            // if the texture is the frame, await the promise directly because we need it to frame the textures
                            const texture = await texturePromise
                                // if the texture is missing, fallback to default texture pack
                                .catch(() => globalThis.options.defaultTexturePack.getTexture(path.join("/"))
                                    .then(defaultTexture => Texture.for(path, globalThis.options.defaultTexturePack.name, defaultTexture.meta))
                                    .then(texture => textures[path.join("/")] = texture)
                                )
                            // place the texture at its position
                            textures[path.join("/")] = texture
                            // create the framed variant of the texture
                            promises.push(texture.makeFramed(textures.frame, this.#name))
                        } else {
                            // if the texture is not the frame, there is no need to await it directly
                            let fullPromise = texturePromise
                                .then(texture => textures[path.join("/")] = texture )

                            // if the texture is partial, allow fallback to default texture pack
                            if (textureMeta.partial) {
                                fullPromise = fullPromise
                                    .catch(() => globalThis.options.defaultTexturePack.getTexture(path.join("/"))
                                        .then(defaultTexture => Texture.for(path, globalThis.options.defaultTexturePack.name, defaultTexture.meta))
                                        .then(texture => textures[path.join("/")] = texture)
                                    )
                            }

                            // also make the framed variant of the texture
                            fullPromise = fullPromise.then(texture => texture.makeFramed(textures.frame, this.#name) )

                            // push the promise to the list of promises
                            promises.push(fullPromise)
                        }
                    } else {
                        // directory
                        let localDefault = DEFAULTS
                        let localPackMeta = packMeta
                        for (const part of path) {
                            localDefault = localDefault?.[part]
                            localPackMeta = localPackMeta?.[part]
                        }
                        const textureMeta = new TextureMeta(localMeta, {...localDefault, ...localPackMeta})
                        if (localMeta === null) { this.#packMeta  = textureMeta }
                        // add each child to the list of textures to get
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
                // wait for all the promises to be resolved
                await Promise.all(promises)
                // set the map of path to textures
                this.#textures = new Map()
                ;[...Object.entries(textures)].forEach(([key, item]) => this.#textures.set(key, item))
            })

        return this.#initPromise
    }

    /**
     * get or create the html element containing the textures for the texture pack
     * @param {string} texturePackName
     * @param {boolean} closeOthers
     * @return {Element}
     */
    static getHtmlTextureContainerFor(texturePackName, closeOthers = true) {
        // get the textures div
        let texturesDiv = document.getElementById("textures")
        let texturePackDetails = texturesDiv.querySelector(`#${texturePackName}`)
        if (texturePackDetails === null) {
            // if there is no element specific to the texture pack
            if (closeOthers) {
                texturesDiv.querySelectorAll("details").forEach(detail => detail.open = false)
            }

            // create a detail element
            texturePackDetails = document.createElement("details")
            texturePackDetails.id = texturePackName
            texturePackDetails.open = true

            // set the texture pack name as summary
            const texturePackSummary = document.createElement("summary")
            texturePackSummary.textContent = texturePackName
            texturePackDetails.append(texturePackSummary)

            const div = document.createElement("div")
            div.classList.add("textures-grid")
            texturePackDetails.append(div)

            texturesDiv.appendChild(texturePackDetails)
        }

        return texturePackDetails.querySelector("& > div")
    }

    /**
     * update all the textures in the document
     * this apply to the textures in the DOM
     * @param {number} currentTime current global time, used to get the correct animation frame
     */
    updateDocumentTextures(currentTime = 0) {
        // find the elements
        const elements = document.body.querySelectorAll("*[data-texture]")
        const canvas = document.getElementById("utilsCanvas")
        const ctx = canvas.getContext("2d")

        // for each element get the correct texture and update the image src
        elements.forEach(async element => {
            element.style.pointerEvents = "all"
            this.getTexture(element.dataset.texture).then(texture => {
				if (texture === undefined) {
					throw new Error(element.dataset.texture + "is undefined")
				}
                const image = element.dataset.framed ? texture.getFramed() : texture.getBase()
                let animationName = element.dataset.animation
                if (! animationName || ! (animationName in texture.animations)) {
                    animationName = AnimationKeys.IDLE
                }
                const position = element.dataset.framed ?
                    texture.getFramedAnimationFramePosition(animationName, 0, currentTime) :
                    texture.getAnimationFramePosition(animationName, 0, currentTime)
                canvas.width = texture.pixelWidth
                canvas.height = texture.pixelHeight

                ctx.drawImage(
                    image,
                    position.sx, position.sy, position.sw, position.sh,
                    0, 0, canvas.width, canvas.height
                )

                element.setAttribute("src", canvas.toDataURL("image/png"))
            })
        })
    }
}

/**
 * Texture class represents a group of texture in the same directory
 */
class Texture {
    static #idGenerator = 0;
    #id = Texture.#idGenerator++;

    /**
     * a marker to identify the base texture
     * @type {Symbol}
     */
    static #baseMarker = Symbol("Texture.baseMarker")
    /**
     * a marker to identify the framed texture
     * @type {Symbol}
     */
    static #framedMarker = Symbol("Texture.framedMarker")

    /**
     * the scale applied to the image when framed
     * @type {Number}
     */
    static #framedScale = 75/100;

    /**
     * @type {TextureMeta}
     * @readonly
     */
    #meta
    /**
     * a map of an image element by orientation
     * #baseMarker and #framedMarker can be used as keys
     * @type {Map<number | Symbol, HTMLImageElement>}
     */
    #imageElements = new Map()

    constructor(meta) {
        this.#meta = Object.freeze(meta)
    }

    get meta() { return this.#meta }

    /**
     * @param {number | Symbol} orientation
     * @return {HTMLImageElement}
     */
    getForOrientation(orientation) { return this.#imageElements.get(orientation) }
    /** @return {HTMLImageElement} */
    getBase() { return this.getForOrientation(Texture.#baseMarker) }

    /**
     * get the source values to send to drawImage to get the correct animation frame
     * @param {string} animationName
     * @param {number} animationStartTime
     * @param {number} frameTiming
     * @returns {{sx: number, sy: number, sw: number, sh: number}}
     */
    getAnimationFramePosition(animationName, animationStartTime, frameTiming) {
        // each line is an animation
        // each column is a frame of the corresponding animation
        const totalAnimationTime = this.animations[animationName].timings.reduce((acc, timing) => acc + timing, 0)
        let currentLoopStart = (frameTiming - animationStartTime) % totalAnimationTime
        let frame = -1
        while (currentLoopStart > 0) {
            currentLoopStart -= this.animations[animationName].timings[++frame]
        }
        const animationIndex = Object.keys(this.animations).findIndex(key => key === animationName)
        return {
            sx: frame * this.pixelWidth, sy: animationIndex * this.pixelHeight,
            sw: this.pixelWidth, sh: this.pixelHeight,
        }
    }

    /**
     * get the source values to send to drawImage to get the correct animation frame
     * this version returns the values for the framed variant specifically
     * @param {string} animationName
     * @param {number} animationStartTime
     * @param {number} frameTiming
     * @returns {{sx: number, sy: number, sw: number, sh: number}}
     */
    getFramedAnimationFramePosition(animationName, animationStartTime, frameTiming) {
        const basePosition = this.getAnimationFramePosition(animationName, animationStartTime, frameTiming)
        return {
            sx: basePosition.sx / this.worldWidth, sy: basePosition.sy / this.worldHeight,
            sw: basePosition.sw / this.worldWidth, sh: basePosition.sh / this.worldHeight,
        }
    }

    /** @return {HTMLImageElement} */
    getFramed() { return this.getForOrientation(Texture.#framedMarker) }
    get animations() { return this.#meta.animations }
    get angleBetweenRotations() { return this.#meta.angleBetweenRotations }
    /** @return {TextureType} */
    get textureType() { return this.#meta.textureType }
    get pixelWidth() { return this.#meta.pixelWidth }
    get pixelHeight() { return this.#meta.pixelHeight; }
    get worldWidth() { return this.#meta.worldWidth }
    get worldHeight() { return this.#meta.worldHeight; }

    /**
     * create the framed variant of this texture
     * @param {Texture} frame
     * @param {string} texturePackName
     * @returns {Promise<this>}
     */
    makeFramed(frame, texturePackName) {
        // if it already exists, return instantly
        if (this.#imageElements.has(Texture.#framedMarker)) {
            return new Promise(() => this)
        }

        // the size of one cell
        const cellHeight = this.#meta.pixelHeight / this.#meta.worldHeight
        const cellWidth = this.#meta.pixelWidth / this.#meta.worldWidth

        // the transformation to apply to the image when drawing it on the canvas
        const marginLeft = (1 - Texture.#framedScale) / 2
        const marginTop = marginLeft // this.#meta.worldHeight === 1 ? marginLeft : 0
        const scale = Texture.#framedScale

        // get the canvas
        const canvas = document.getElementById("utilsCanvas")
        // 1. make the canvas the correct size
        const animationCount = Object.keys(this.animations).length
        const longestAnimationFrameCount = Math.max(...Object.values(this.animations).map(animation => animation.timings.length))
        // a framed image is one cell regardless of the base image
        canvas.height = animationCount * cellHeight
        canvas.width = longestAnimationFrameCount * cellWidth

        const context = canvas.getContext("2d")
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let line = 0; line < animationCount; line++) {
            const animation = Object.values(this.animations)[line]
            for (let col = 0; col < animation.timings.length; col++) {
                // 2. get the images as needed in the canvas
                if (this.#meta.textureType === TextureType.IMAGE) {
                    context.drawImage(this.getBase(),
                        col * this.pixelWidth, line * this.pixelHeight, cellWidth, cellHeight,
                        cellWidth * (col + marginLeft), cellHeight * (line + marginTop), cellWidth * scale, cellHeight * scale
                    )
                }
                if (this.#meta.textureType === TextureType.BASE_ONLY || this.#meta.textureType === TextureType.ROTATION_AND_BASE) {
                    context.drawImage(this.getBase(),
                        col * this.pixelWidth, line * this.pixelHeight, cellWidth, cellHeight,
                        cellWidth * (col + marginLeft), cellHeight * (line + marginTop), cellWidth * scale, cellHeight * scale
                    )
                }
                if (this.#meta.textureType === TextureType.ROTATION_ONLY || this.#meta.textureType === TextureType.ROTATION_AND_BASE) {
                    const framedRotation = Math.ceil(TexturePack.framedRotation / this.#meta.angleBetweenRotations) * this.#meta.angleBetweenRotations
                    context.drawImage(this.getForOrientation(framedRotation),
                        col * this.pixelWidth, line * this.pixelHeight, cellWidth, cellHeight,
                        cellWidth * (col + marginLeft), cellHeight * (line + marginTop), cellWidth * scale, cellHeight * scale
                    )
                }

                // 3. put the frame image on top of each position
                context.drawImage(frame.getBase(), col * cellWidth, line * cellHeight, cellWidth, cellHeight)
            }
        }

        // create a new image element with the rotated image
        const framedImage = document.createElement("img")
        framedImage.classList.add("framed")
        framedImage.src = canvas.toDataURL("image/png")
        framedImage.style.order = this.#id.toString(10)
        TexturePack.getHtmlTextureContainerFor(texturePackName).appendChild(framedImage)
        this.#imageElements.set(Texture.#framedMarker, framedImage)
        return new Promise((resolve, reject) => {
            framedImage.onload = () => resolve(this)
            framedImage.onerror = reject
        })
    }

    /**
     * load images whose path is in the assets directory
     * @param {string[]} path
     * @param {string} texturePackName
     * @param {TextureMeta} textureMeta
     * @return {Promise<Texture>}
     */
    static for(path, texturePackName, textureMeta) {
        const result = new Texture(textureMeta)
        const texturesDiv = TexturePack.getHtmlTextureContainerFor(texturePackName)
        /** @type {Promise[]} */
        const promises = []

        // if the image is an icon, there is only one image to load
        if (textureMeta.textureType === TextureType.IMAGE) {
            const image = document.createElement("img")
            image.src = `/assets/images/${texturePackName}/${path.join("/")}.${textureMeta.extension}`
            image.style.order = result.#id.toString(10)
            texturesDiv.appendChild(image)
            result.#imageElements.set(Texture.#baseMarker, image)
            return new Promise((res, err) => {
                image.onload = () => { res(result) }
                image.onerror = error => { err(`Couldn't load texture for path ${path.join("/")}: ${typeof error === "string" ? error : error.type}`) }
            })
        }

        // assert that the given angle permits a full turn
        if (textureMeta.textureType !== TextureType.BASE_ONLY && (360 % textureMeta.angleBetweenRotations) !== 0) {
            console.error("Given textureMeta angle isn't valid", textureMeta)
            throw new TypeError("Given textureMeta angle isn't valid")
        }

        // load the base image
        if (textureMeta.textureType !== TextureType.ROTATION_ONLY) {
            const image = document.createElement("img")
            image.src = `/assets/images/${texturePackName}/${path.join("/")}/base.${textureMeta.extension}`
            image.style.order = result.#id.toString(10)
            texturesDiv.appendChild(image)
            result.#imageElements.set(Texture.#baseMarker, image)
            promises.push(new Promise((res, err) => {
                image.onload = () => { res(Texture.#baseMarker) }
                image.onerror = error => { err(`Couldn't load texture for path ${path.join("/")}/base: ${typeof error === "string" ? error : error.type}`) }
            }))
        }

        // if we don't need rotation image, there is nothing more to do
        if (textureMeta.textureType === TextureType.BASE_ONLY) {
            return Promise.all(promises).then(() => result)
        }

        // load the rotation image for each required angle
        let angle = 0
        while (angle < 360) {
            if (angle <= 180 || (angle > 180 && ! textureMeta.isSymmetric)) {
                const hoistedAngle = angle
                const image = document.createElement("img")
                image.style.order = result.#id.toString(10)
                image.src = `/assets/images/${texturePackName}/${path.join("/")}/${angle}.${textureMeta.extension}`
                texturesDiv.appendChild(image)
                result.#imageElements.set(hoistedAngle, image)
                if (hoistedAngle === 0) {
                    result.#imageElements.set(360, image);
                }


                promises.push(new Promise((res, err) => {
                    image.onload = () => {
                        // create a rotated copy of the image if requested
                        if (textureMeta.isSymmetric && hoistedAngle !== 0 && hoistedAngle !== 180) {
                            const rotatedImage = Texture.#mirrorImage(image, textureMeta.pixelWidth)
                            rotatedImage.style.order = result.#id.toString(10)
                            texturesDiv.appendChild(rotatedImage)
                            result.#imageElements.set(360 - hoistedAngle, rotatedImage)
                            promises.push(new Promise((res, err) => {
                                rotatedImage.onload = () => res(hoistedAngle)
                                rotatedImage.onerror = error => err(error)
                            }))
                        }

                        res(hoistedAngle)
                    }
                    image.onerror = error => err(`Couldn't load texture for path ${path.join("/")}/${angle}: ${typeof error === "string" ? error : error.type}`)
                }))
            }

            angle += textureMeta.angleBetweenRotations
        }
        return Promise.all(promises).then(() => result)
    }

    /**
     * load images for texture packs inputted by the user
     * @param {File[]} files
     * @param {string[]} path
     * @param {string} texturePackName
     * @param {TextureMeta} textureMeta
     * @return {Promise<Texture>}
     */
    static forWebkitDirectory(files, path, texturePackName, textureMeta) {
        const result = new Texture(textureMeta)
        const texturesDiv = TexturePack.getHtmlTextureContainerFor(texturePackName)
        /** @type {Promise[]} */
        const promises = []

        // if the image is an icon, there is only one image to load
        if (textureMeta.textureType === TextureType.IMAGE) {
            const file = files.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/${path.join("/")}.${textureMeta.extension}`)
            if (file !== undefined) {
                return Texture.#readFileAsDataUrl(file)
                    .then(dataUrl => {
                        const image = document.createElement("img")
                        image.src = dataUrl
                        image.style.order = result.#id.toString(10)
                        texturesDiv.appendChild(image)
                        result.#imageElements.set(Texture.#baseMarker, image)
                    })
                    .then(() => result)
            } else {
                return globalThis.options.defaultTexturePack.getTexture(path.join("/"))
            }
        }

        // assert that the given angle permits a full turn
        if (textureMeta.textureType !== TextureType.BASE_ONLY && (360 % textureMeta.angleBetweenRotations) !== 0) {
            console.error("Given textureMeta angle isn't valid", textureMeta)
            throw new TypeError("Given textureMeta angle isn't valid")
        }

        // load the base image
        if (textureMeta.textureType !== TextureType.ROTATION_ONLY) {
            const file = files.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/${path.join("/")}/base.${textureMeta.extension}`)
            if (file !== undefined) {
                promises.push(Texture.#readFileAsDataUrl(file)
                    .then(dataUrl => {
                        const image = document.createElement("img")
                        image.src = dataUrl
                        image.style.order = result.#id.toString(10)
                        texturesDiv.appendChild(image)
                        result.#imageElements.set(Texture.#baseMarker, image)
                    }))
            } else {
                return globalThis.options.defaultTexturePack.getTexture(path.join("/"))
            }
        }

        // if we don't need rotation image, there is nothing more to do
        if (textureMeta.textureType === TextureType.BASE_ONLY) {
            return Promise.all(promises).then(() => result)
        }

        // load the rotation image for each required angle
        let angle = 0
        while (angle < 360) {
            if (angle <= 180 || (angle > 180 && ! textureMeta.isSymmetric)) {
                const hoistedAngle = angle
                const file = files.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/${path.join("/")}/${hoistedAngle}.${textureMeta.extension}`)
                if (file !== undefined) {
                    promises.push(Texture.#readFileAsDataUrl(files.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/${path.join("/")}/${hoistedAngle}.${textureMeta.extension}`))
                        .then(dataUrl => {
                            const image = document.createElement("img")
                            image.src = dataUrl
                            image.style.order = result.#id.toString(10)
                            texturesDiv.appendChild(image)
                            result.#imageElements.set(AngleUtils.clampAngleDeg(hoistedAngle), image)

                            // create a rotated copy of the image if requested
                            if (textureMeta.isSymmetric && hoistedAngle !== 0 && hoistedAngle !== 180) {
                                image.onload = () => {
                                    const rotatedImage = Texture.#mirrorImage(image, textureMeta.pixelWidth)
                                    rotatedImage.style.order = result.#id.toString(10)
                                    texturesDiv.appendChild(rotatedImage)
                                    result.#imageElements.set(AngleUtils.clampAngleDeg(360 - hoistedAngle), rotatedImage)
                                }
                            }
                            if (hoistedAngle === 0) {
                                result.#imageElements.set(360, image);
                            }
                        }))
                } else {
                    return globalThis.options.defaultTexturePack.getTexture(path.join("/"))
                }
            }

            angle += textureMeta.angleBetweenRotations
        }
        return Promise.all(promises).then(() => result)
    }

    /**
     * transform a file into a data url
     * @param {File} file
     * @return {Promise<string>}
     */
    static #readFileAsDataUrl(file) {
        return new Promise((res, err) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result)
            fr.onerror = error => err(error)
            fr.readAsDataURL(file);
        })
    }

    /**
     * create a mirrored copy of an image
     * @param {HTMLImageElement} image
     * @param {number} frameWidth size in pixel of one animation frame
     * @returns {HTMLImageElement}
     */
    static #mirrorImage(image, frameWidth) {
        // get the canvas
        const canvas = document.getElementById("utilsCanvas")
        canvas.width = image.width
        canvas.height = image.height

        // paste the image reversed left<->right on it
        const context = canvas.getContext("2d")
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.scale(-1, 1)

        // create copy for each frame
        for (let i = 0; i < image.width / frameWidth; i++) {
            context.drawImage(image, i * frameWidth, 0, frameWidth, image.height, -(i + 1) * frameWidth, 0, frameWidth, canvas.height)
        }

        // create a new image element with the rotated image
        const rotatedImage = document.createElement("img")
        rotatedImage.src = canvas.toDataURL("image/png")
        return rotatedImage
    }
}
