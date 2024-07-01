import * as Translator from "./Translator.js";
import * as AngleUtils from "./AngleUtils.js";

class Options {
    /** @type {boolean} */
    #debug
    /** @type {typeof Translator.KNOWN_LANGUAGES} */
    #language
    /** @type {string} */
    #texturePack
    // todo stuff with local storage and proxy and stuff
    constructor() {
        this.debug = false
        this.#language = window.navigator.languages.find(language => Translator.KNOWN_LANGUAGES.includes(language)) ?? Translator.FALLBACK_LANGUAGE
        setTimeout(() => this.texturePack = "devpack")
    }

    get zoom() { return 75 }

    /**
     * @param {boolean} value
     */
    set debug(value) {
        if (this.debug === value) { return }
        this.#debug = !! value
        document.getElementById("debugOverlay").classList.toggle("hidden", ! this.#debug)
    }
    get debug() { return this.#debug }

    /**
     * @param {typeof Translator.KNOWN_LANGUAGES} value
     */
    set language(value) {
        if (this.language === value) { return }
        if (! Translator.KNOWN_LANGUAGES.includes(value)) {
            console.warn(`Language "${value}" is not supported, defaulting to ${Translator.FALLBACK_LANGUAGE}`)
            value = Translator.FALLBACK_LANGUAGE
        }
        this.#language = value
        Translator.loadTranslation()
            .then(Translator.translateDocument)
    }
    get language() { return this.#language }

    set texturePack(value) {
        if (this.texturePack === value) { return }
        this.#texturePack = value
        registerEntityImages("enemy")
        registerEntityImages("tower")
        registerEntityImages("missile", [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180])
    }

    get texturePack() { return this.#texturePack }
}

const options = new Options()
globalThis.options = options
export default options


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
function registerEntityImages(name, angles = [0, 90, 180]) {
    const imageContainer = document.getElementById("imageSources")

    const camelCaseName = name.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');

    const finalAngles = new Set()

    globalThis.entityImages[name] = {
        hasBase: false
    }
    for (const angle of angles) {
        const image = document.createElement("img")
        image.src = `/assets/images/${globalThis.options.texturePack}/units/${camelCaseName}/${angle}.png`
        imageContainer.appendChild(image)
        const correctedAngle = AngleUtils.clampAngleDeg(angle - 90)
        finalAngles.add(correctedAngle)
        globalThis.entityImages[name][correctedAngle] = image

        // if angle is 0, add 360 too to avoid having to do math later
        if (correctedAngle === 0) {
            finalAngles.add(360)
            globalThis.entityImages[name][360] = image
        }

        // unless top and bottom or already mirrored, add the mirrored image
        if (angle !== 0 && angle < 180) {
            finalAngles.add(AngleUtils.clampAngleDeg(270 - angle))
            image.onload = () => {
                const canvas = document.getElementById("utilsCanvas")
                canvas.width = image.width
                canvas.height = image.height
                const context = canvas.getContext("2d")
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.scale(-1, 1)
                context.drawImage(image, -canvas.width, 0)

                const rotatedImage = document.createElement("img")
                rotatedImage.src = canvas.toDataURL("image/png")
                imageContainer.appendChild(rotatedImage)
                globalThis.entityImages[name][AngleUtils.clampAngleDeg(270 - angle)] = rotatedImage
            }
        }
    }
    globalThis.entityImages[name].angles = Object.freeze([...finalAngles.values()])

}

