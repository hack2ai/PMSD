const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const generateCertificate = async (certificate) => {

    const downloadsDir = path.join(__dirname, "../../downloads");

    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const pdfPath = path.join(
        downloadsDir,
        `${certificate.certificate_number}.pdf`
    );

    const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 50,
    });

    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height)
        .fill("#f8f9fa");

    // Border
    doc.lineWidth(8)
        .strokeColor("#0d6efd")
        .rect(
            20,
            20,
            doc.page.width - 40,
            doc.page.height - 40
        )
        .stroke();

    // PMSD
    doc
        .fillColor("#0d6efd")
        .fontSize(30)
        .font("Helvetica-Bold")
        .text("PMSD Learning Platform", {
            align: "center",
        });

    doc.moveDown();

    // Title
    doc
        .fillColor("#000")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text("Certificate of Completion", {
            align: "center",
        });

    doc.moveDown(2);

    doc
        .fontSize(18)
        .font("Helvetica")
        .text("This certificate is proudly presented to", {
            align: "center",
        });

    doc.moveDown();

    // Student Name
    doc
        .fillColor("#0d6efd")
        .fontSize(32)
        .font("Helvetica-Bold")
        .text(certificate.full_name, {
            align: "center",
        });

    doc.moveDown();

    doc
        .fillColor("#000")
        .fontSize(18)
        .font("Helvetica")
        .text(
            `For successfully completing the course`,
            {
                align: "center",
            }
        );

    doc.moveDown();

    // Course Name
    doc
        .fillColor("#198754")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(certificate.title, {
            align: "center",
        });

    doc.moveDown(2);

    doc
        .fillColor("#000")
        .fontSize(16)
        .text(
            `Instructor: ${certificate.instructor}`,
            {
                align: "center",
            }
        );

    doc.moveDown();

    doc.text(
        `Certificate No: ${certificate.certificate_number}`,
        {
            align: "center",
        }
    );

    doc.moveDown();

    doc.text(
        `Issued On: ${new Date(
            certificate.issued_at
        ).toDateString()}`,
        {
            align: "center",
        }
    );

    // QR Code
    const verifyUrl =
        `http://localhost:5001/api/certificates/verify/${certificate.certificate_number}`;

    const qrImage = await QRCode.toDataURL(verifyUrl);

    const qr = qrImage.replace(
        /^data:image\/png;base64,/,
        ""
    );

    const qrBuffer = Buffer.from(qr, "base64");

    doc.image(
        qrBuffer,
        doc.page.width - 170,
        doc.page.height - 170,
        {
            width: 110,
        }
    );

    doc
        .fontSize(12)
        .text(
            "Scan to Verify",
            doc.page.width - 170,
            doc.page.height - 50,
            {
                width: 120,
                align: "center",
            }
        );

    doc.end();

    return new Promise((resolve) => {

        stream.on("finish", () => {
            resolve(pdfPath);
        });

    });

};

module.exports = generateCertificate;