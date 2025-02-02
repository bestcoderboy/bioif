const BIOIF_HEADER = "hi human. this file is encoded with the bioif format. in case you're wondering what that stands for, it means \"bsb.dev's incredibly optimised image format\". in order to read this file you must have a compatible parser. there's one available over at image.bsb.dev if you just opened this in a text editor! anyway after this bit there will be instructions on how to read the file. if you don't want to use a parser, lucky for you - these files are human readable too. after these sentences will be some nice instructions asking the computer to display some pixels, i'm sure you can write down them on paper or something. you know hex colors right?"
const BIOIF_FOOTER = "whew! done! that's all the pixels finished now. if you're a computer then this is your sign to finish up the parsing. and for the humans that got to the end of this file - admire your work. you are the parser now. breath in the achievement of painstakingly recreating every single pixel of an image."

const phoneticAlphabet = {
    '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
    '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', 'A': 'Alpha', 'B': 'Bravo',
    'C': 'Charlie', 'D': 'Delta', 'E': 'Echo', 'F': 'Foxtrot'
}

function hexToPhonetic(hex) {
    return hex.split('').map(c => phoneticAlphabet[c]).join(' ')
}

function phoneticToHex(phonetic) {
    const reverseMap = Object.fromEntries(Object.entries(phoneticAlphabet).map(([k, v]) => [v, k]))
    return phonetic.split(/[^A-Za-z]+/).map(word => reverseMap[word]).join('')
}

// https://stackoverflow.com/a/2901298
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

async function parseBioif(text) {
    const lines = text.split('\n')
    if (!lines[0].startsWith(BIOIF_HEADER)) {
        throw new Error("Invalid BioIF header")
    }

    const resMatch = lines[1].match(/the image's resolution is (\d+) by (\d+). it is using (v[\d\.]+) of the bioif format/)
    if (!resMatch || resMatch[3] !== "v1.0") {
        throw new Error("Invalid or unsupported BioIF version")
    }

    const width = parseInt(resMatch[1], 10)
    const height = parseInt(resMatch[2], 10)
    const pixels = []

    for (let i = 2; i < lines.length - 1; i++) {
        const match = lines[i].match(/#([0-9A-F]{6})/)
        if (!match) continue

        const hexColor = `#${match[1]}`
        const phoneticMatch = lines[i].match(/[A-Z][a-z]+(?: [^A-Z#]*[A-Z][a-z]+)*/g)
        if (!phoneticMatch || phoneticToHex(phoneticMatch.join(' ')) !== match[1]) {
            throw new Error(`Phonetic spelling error in line: ${lines[i]}`)
        }
        pixels.push(hexColor)
    }

    return { width, height, pixels }
}


export async function bioifToPng(bioifText) {
    const { width, height, pixels } = await parseBioif(bioifText)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(width, height)

    for (let i = 0; i < pixels.length; i++) {
        const [r, g, b] = pixels[i].match(/#(..)(..)(..)/).slice(1).map(x => parseInt(x, 16))
        imageData.data.set([r, g, b, 255], i * 4)
    }

    ctx.putImageData(imageData, 0, 0)
    return [canvas.toDataURL("image/png"), width, height]
}

export async function pngToBioif(pngBlob) {
    const img = new Image()
    img.src = URL.createObjectURL(pngBlob)
    await img.decode()

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, img.width, img.height).data

    let bioif = `${BIOIF_HEADER}\n`
    bioif += `first things first. the image's resolution is ${img.width} by ${img.height}. it is using v1.0 of the bioif format. now let's get to the image itself shall we?\n`

    let pixelCount = 1
    for (let i = 0; i < imageData.length; i += 4) {
        const hex = `#${[imageData[i], imageData[i+1], imageData[i+2]].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('')}`
        const phonetic = hexToPhonetic(hex.slice(1))
        bioif += `for pixel ${numberWithCommas(pixelCount)} here's some description... ${hex}. did i mention it's ${phonetic}?\n`
        pixelCount += 1
    }

    bioif += `${BIOIF_FOOTER}\n`
    return bioif
}
