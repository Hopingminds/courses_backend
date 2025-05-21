import fs from 'fs/promises';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Define available fonts
const FONT_MAP = {
    mons: "./fonts/Montserrat-Medium.ttf",
    goodVibes: "./fonts/GoodVibrationsScript.ttf"
};

async function loadFont(pdfDoc, fontName) {
    if (!FONT_MAP[fontName]) {
        throw new Error(`Font "${fontName}" not found in FONT_MAP`);
    }
    const fontBytes = await fs.readFile(FONT_MAP[fontName]);
    return await pdfDoc.embedFont(fontBytes);
}

function formatDate(date) {
    const day = date.getDate();
    const year = date.getFullYear();
    const month = date.toLocaleString("en-US", { month: "short" }); // "Jan", "Feb", etc.

    // Function to get ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (num) => {
        if (num > 3 && num < 21) return "th"; // 11th, 12th, 13th, etc.
        switch (num % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


export async function saveCertificate(
    userName,
    nameY,
    nameSize,
    nameFontName,
    courseName,
    courseY,
    courseSize,
    courseFontName,
) {
    const certificate = await fs.readFile('./pdf/cert1.pdf');

    let pdfDoc = await PDFDocument.load(certificate);
    pdfDoc.registerFontkit(fontkit);

    // Load fonts based on user selection
    const nameFont = await loadFont(pdfDoc, nameFontName);
    const courseFont = await loadFont(pdfDoc, courseFontName);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const capitalizedUserName = capitalizeFirstLetter(userName);

    const { width, height } = firstPage.getSize();
    const nameTextWidth = nameFont.widthOfTextAtSize(capitalizedUserName, nameSize);
    const nameXPosition = (width - nameTextWidth) / 2;
    const nameYPosition = height / 4 + 90;

    firstPage.drawText(`${capitalizedUserName}`, {
        x: nameXPosition,
        y: nameYPosition + nameY,
        size: nameSize,
        font: nameFont,
        color: rgb(0.7450980392156863, 0.5607843137254902, 0.20392156862745098),
    });

    const formattedDate = formatDate(new Date());
    const completeCourseLine = `on ${formattedDate} in ${courseName}`;
    const courseTextWidth = courseFont.widthOfTextAtSize(completeCourseLine, courseSize);
    const courseXPosition = (width - courseTextWidth) / 2;
    const courseYPosition = height / 4 + 90;

    firstPage.drawText(`${completeCourseLine}`, {
        x: courseXPosition,
        y: courseYPosition + courseY,
        size: courseSize,
        font: courseFont,
        color: rgb(0.11372549019607843, 0.11372549019607843, 0.10588235294117647),
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true }); 

    return pdfBytes;
}
