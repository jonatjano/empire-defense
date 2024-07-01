import options from "./Options.js";

/** @type {string} */
export const FALLBACK_LANGUAGE = "en"
/** @type {string[]} */
export const KNOWN_LANGUAGES = ["en", "fr"]
globalThis.translations = null
globalThis.fallbackTranslations = null

/**
 * set the text of every element with the data-translation attribute to the translation key
 */
export function translateDocument() {
    const elements = document.body.querySelectorAll("*[data-translation]")
    elements.forEach(element => {
        element.textContent = translate(element.dataset.translation)
    })
}

/**
 * fetch the translations data for the language define in options
 * @return {Promise}
 */
export function loadTranslation() {
    return Promise.all([
        fetch(`/assets/translations/${options.language}.json`)
            .then(result => result.text())
            .then(data => globalThis.translations = Object.freeze(JSON.parse(data))),

        globalThis.fallbackTranslations !== null ?
            true :
            fetch(`/assets/translations/${FALLBACK_LANGUAGE}.json`)
                .then(result => result.text())
                .then(data => globalThis.fallbackTranslations = Object.freeze(JSON.parse(data))),
    ])
}

/**
 * return the value for the given translation key in loaded language
 * @param {string} key
 * @return {string}
 */
export function translate(key) {
    let translations = globalThis.translations
    let fallbackTranslations = globalThis.fallbackTranslations
    const split = key.split(".")
    while (split.length !== 0) {
        const part = split.shift()
        translations = translations?.[part]
        fallbackTranslations = fallbackTranslations?.[part]
    }
    return translations ??
        fallbackTranslations ?
            (console.error(`missing translation in ${globalThis.translations.language.name} (${globalThis.translations.language.code}) for ${key}`), fallbackTranslations) :
            (console.error(`missing translation for ${key}`), key)
}