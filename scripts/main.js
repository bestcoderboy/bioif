// this code is an absolute mess of copy pasted rubbish
// i'm sure somebody can get it running as a faster implementation

import {bioifToPng, pngToBioif} from "./bioif-parser.js"

// https://stackoverflow.com/a/20732091
function humanFileSize(size) {
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
    return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
}

// adapted https://stackoverflow.com/a/18197341
function download() {
    const filename = "compiled.bioif"
    const text = document.getElementById('fileOutput').value

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plaincharset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('fileInput').addEventListener('change', async (event) => {
        const file = event.target.files[0]
        if (!file) return

        const blob = new Blob([file], {
            type: file.type
        })
        const startTime = Date.now()

        try {
            const bioifText = await pngToBioif(blob)
            const byteSize = str => new Blob([str]).size
            document.getElementById('fileOutput').value = bioifText

            document.querySelector('#benchmark-label').innerText = `the conversion took ${Date.now() - startTime}ms. the file is ${humanFileSize(byteSize(bioifText))}. that's ${bioifText.split(/\r\n|\r|\n/).length} lines.`
            document.querySelector('#benchmark-label').style.visibility = 'visible'
        } catch (e) {
            alert("error while parsing: " + e)
        }
    })
    document.getElementById('download-button').addEventListener('click', download)
    document.getElementById('convert-button').addEventListener('click', async () => {
        const bioifText = document.getElementById('bioifInput').value

        try {
            const [imageDataUri, width, height] = await bioifToPng(bioifText)

            document.getElementById('imageOutput').src = imageDataUri
            document.getElementById('image-label').innerText = `generated a ${width}x${height} image.`
        } catch (e) {
            alert("error while parsing: " + e)
        }
    })
})