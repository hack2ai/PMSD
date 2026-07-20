const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// =======================================
// Assets Path
// =======================================
const ASSETS = path.join(
    process.cwd(),
    "..",
    "assets"
);

const TEMPLATE = path.join(
    ASSETS,
    "certificate-template.png"
);

const LOGO = path.join(
    ASSETS,
    "pmsd-logo.png"
);

const SIGNATURE = path.join(
    ASSETS,
    "signature.png"
);


const FONT_REGULAR = path.join(
    ASSETS,
    "fonts",
    "Poppins-Regular.ttf"
);

const FONT_BOLD = path.join(
    ASSETS,
    "fonts",
    "Poppins-Bold.ttf"
);

const FONT_SIGNATURE = path.join(
    ASSETS,
    "fonts",
    "GreatVibes-Regular.ttf"
);



// =======================================
// Certificate Folder
// =======================================

const CERTIFICATE_FOLDER = path.join(
    process.cwd(),
    "certificates"
);

if (!fs.existsSync(CERTIFICATE_FOLDER)) {

    fs.mkdirSync(
        CERTIFICATE_FOLDER,
        {
            recursive: true
        }
    );

}

const generateCertificatePDF = async (
    studentName,
    courseTitle,
    instructor,
    certificateNumber,
    issueDate
) => {

    const fileName =
        `${certificateNumber}.pdf`;

    const filePath = path.join(
        CERTIFICATE_FOLDER,
        fileName
    );

   const verificationUrl =
    `${process.env.BASE_URL || "http://localhost:5001"}/api/certificates/verify/${certificateNumber}`;

const qrCode =
    await QRCode.toDataURL(
        verificationUrl
    );

// Remove "data:image/png;base64," from the QR code
const qrImage = qrCode.replace(
    /^data:image\/png;base64,/,
    ""
);

return new Promise((resolve, reject) => {

// =======================================
// Register Fonts
// =======================================

if (!fs.existsSync(FONT_REGULAR)) {
    return reject(new Error(`Font not found: ${FONT_REGULAR}`));
}

if (!fs.existsSync(FONT_BOLD)) {
    return reject(new Error(`Font not found: ${FONT_BOLD}`));
}

if (!fs.existsSync(FONT_SIGNATURE)) {
    return reject(new Error(`Font not found: ${FONT_SIGNATURE}`));
}

const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    margin: 0
});

const stream = fs.createWriteStream(filePath);

doc.pipe(stream);

doc.registerFont("Regular", FONT_REGULAR);
doc.registerFont("Bold", FONT_BOLD);
doc.registerFont("Signature", FONT_SIGNATURE);

// =======================================
// Background Template
// =======================================

if (!fs.existsSync(TEMPLATE)) {
    return reject(new Error(`Template not found: ${TEMPLATE}`));
}

doc.image(TEMPLATE, 0, 0, {
    width: 842,
    height: 595
});

 

// =======================================
// PMSD Logo
// =======================================

if (fs.existsSync(LOGO)) {
    try {
     doc.image(LOGO, 360, 10, {
         width: 105
});
    } catch (err) {
        console.error("❌ LOGO ERROR:", err);
    }
}


// =======================================
// Student Name
// =======================================


doc
    .font("Signature")
    .fontSize(32)
    .fillColor("#1A237E")
    .text(
        studentName,
        0, 245,{
            align: "center"
        }
    );


// =======================================
// Course Name
// =======================================

doc
    .font("Bold")
    .fontSize(20)
    .fillColor("#D4AF37")
    .text(
        courseTitle,
        0,
        325,
        {
            align: "center"
        }
    );

doc
    .font("Regular")
    .fontSize(14)
    .fillColor("black")
    .text(
        `Instructor : ${instructor}`,
        90,
        390
    );

doc
    .text(
    `Certificate No : ${certificateNumber}`,
    90,
    420
);

doc
    .text(
    `Issued On : ${issueDate}`,
    90,
    445
);

// =======================================
// QR Code
// =======================================

try {
    doc.image(
        Buffer.from(qrImage, "base64"),
        640,
        315,
        {
            width: 80
        }
    );
} catch (err) {
    console.error("❌ QR ERROR:", err);
}



// =======================================
// Signature
// =======================================

if (fs.existsSync(SIGNATURE)) {
    try {
    doc.image(SIGNATURE, 535, 382, {
    width: 145
});
    } catch (err) {
        console.error("❌ SIGNATURE ERROR:", err);
    }
}

doc
    .moveTo(525, 475)
    .lineTo(705, 475)
    .stroke();

doc
    .font("Bold")
    .fontSize(14)
    .fillColor("black")
    .text(
    "Pankaj Kumar",
    515,
    475,
        {
            width: 200,
            align: "center"
        }
    );

doc
    .font("Regular")
    .fontSize(11)
    .fillColor("gray")
    .text(
    "Founder & Lead Instructor",
    515,
    495,
        {
            width: 200,
            align: "center"
        }
    );

stream.on("finish", () => {
    resolve({
        fileName,
        filePath
    });
});

stream.on("error", (err) => {
    reject(err);
});

doc.end();

});

};

module.exports = generateCertificatePDF;