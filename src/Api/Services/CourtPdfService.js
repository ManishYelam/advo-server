const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs").promises;

class CourtPdfService {
  constructor() {
    this.pageSize = [595.28, 841.89]; // A4
    this.layout = {
      margins: { top: 100, right: 50, bottom: 50, left: 50 },
      lineHeight: 18,
      table: { startX: 50, colWidths: [40, 270, 120, 60] },
    };
    this.courtDetails = {
      courtName: "IN THE COURT OF HON'BLE SESSION FOR GREATER BOMBAY AT, MUMBAI",
      specialCourt: "SPECIAL COURT FOR PMLA CASES",
      year: new Date().getFullYear(),
    };
  }

  // 🧩 MAIN FUNCTION
  async generateCourtDocument(userData, caseData, applicationPdfBuffer, exhibitDocuments) {
    const pdfDoc = await PDFDocument.create();
    const fonts = {
      normal: await pdfDoc.embedFont(StandardFonts.TimesRoman),
      bold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
      italic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    };

    const pageTracker = { currentPage: 1, sections: {} };

    // Cover Page
    await this.createCoverPage(pdfDoc, fonts, userData, caseData);
    pageTracker.sections.application = pdfDoc.getPageCount() + 1;
    await this.addApplication(pdfDoc, fonts, applicationPdfBuffer);

    // List of Documents
    pageTracker.sections.listOfDocuments = pdfDoc.getPageCount() + 1;
    await this.createListOfDocuments(pdfDoc, fonts);

    // Exhibits
    await this.addExhibits(pdfDoc, fonts, exhibitDocuments, pageTracker);

    // Remaining sections
    const lastSections = [
      { name: "memorandum", method: this.createMemorandum },
      { name: "affidavit", method: this.createAffidavit },
      { name: "vakalatnama", method: this.createVakalatnama },
    ];
    for (const sec of lastSections) {
      pageTracker.sections[sec.name] = pdfDoc.getPageCount() + 1;
      await sec.method.call(this, pdfDoc, fonts, userData);
    }

    // Update cover with correct page numbers
    await this.updateCoverPage(pdfDoc, pageTracker);
    // Footer page numbers
    this.addPageNumbers(pdfDoc, fonts);

    return await pdfDoc.save();
  }

  // 🎯 Safe text draw (removes \n / \r)
  drawAlignedText(page, text, font, size, y, align = "left", color = rgb(0, 0, 0)) {
    if (!text) return;
    const cleanText = text.replace(/[\n\r]/g, " ").trim();
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(cleanText, size);
    let x = this.layout.margins.left;
    if (align === "center") x = (width - textWidth) / 2;
    if (align === "right") x = width - this.layout.margins.right - textWidth;

    page.drawText(cleanText, { x, y, size, font, color });
  }

  // ✂️ Safe wrapping
  wrapText(text, font, size, maxWidth) {
    if (!text) return [];
    const cleanText = text.replace(/[\n\r]/g, " ").trim();
    const words = cleanText.split(" ");
    const lines = [];
    let line = "";

    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(test, size) < maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // 🧱 Cover Page
  async createCoverPage(pdfDoc, fonts, userData) {
    const page = pdfDoc.addPage(this.pageSize);
    const { width, height } = page.getSize();
    let y = height - this.layout.margins.top;

    this.drawAlignedText(page, this.courtDetails.courtName, fonts.bold, 12, y, "center");
    this.drawAlignedText(page, this.courtDetails.specialCourt, fonts.bold, 12, y - 25, "center");

    y -= 90;
    const year = this.courtDetails.year;
    const caseLines = [
      `CRIMINAL APPLICATION/EXHIBIT NO. OF ${year}`,
      "IN",
      `SPECIAL CASE NO. OF ${year}`,
    ];
    caseLines.forEach((l, i) => this.drawAlignedText(page, l, fonts.normal, 11, y - i * 20, "center"));

    y -= 90;
    const applicant = userData.full_name || "APPLICANT NAME";
    const partyLines = [
      `(${applicant})……APPLICANT`,
      "VERSUS",
      "DNYANDHA MULTISTATE CO-OPERATIVE CREDIT SOCIETY) …ACCUSED",
      "DIRECTORATE OF ENFORCEMENT ) … COMPLAINT",
    ];
    partyLines.forEach((l, i) =>
      this.drawAlignedText(page, l, i === 1 ? fonts.bold : fonts.normal, 11, y - i * 20, i === 1 ? "center" : "left")
    );

    y -= 90;
    this.drawAlignedText(page, "INDEX", fonts.bold, 14, y, "center");
    y -= 40;

    this.drawIndexTable(page, fonts, y);
  }

  // 📊 Index Table
  drawIndexTable(page, fonts, yStart) {
    const { table } = this.layout;
    const columns = [
      { key: "sr", label: "SR NO", width: 40, align: "center" },
      { key: "particulars", label: "PARTICULARS APPLICATION", width: 270, align: "left" },
      { key: "exhibit", label: "EXHIBITS NO", width: 120, align: "center" },
      { key: "page", label: "PAGE NO", width: 60, align: "center" },
    ];
    const rows = [
      { sr: "1", particulars: "APPLICATION" },
      { sr: "2", particulars: "LIST OF DOCUMENTS" },
      { sr: "3", particulars: "Copy of the slip of Account started on 17.11.2022", exhibit: '"A"' },
      { sr: "4", particulars: "Copy of the Deposits Amount by Applicant to the 'said bank'", exhibit: '"B"' },
      { sr: "5", particulars: "Copy of the statement by Applicant to Shrirampur Police Station", exhibit: '"C"' },
      { sr: "6", particulars: "Additional Supporting Documents", exhibit: '"D"' },
      { sr: "7", particulars: "Memorandum of Address" },
      { sr: "8", particulars: "Affidavit-in-Support of the Application" },
      { sr: "9", particulars: "Vakalatnama" },
    ];

    const rowHeight = 20;
    const totalHeight = rowHeight * (rows.length + 1);
    const tableWidth = table.colWidths.reduce((a, b) => a + b, 0);

    // Outer border
    page.drawRectangle({
      x: table.startX,
      y: yStart - totalHeight,
      width: tableWidth,
      height: totalHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Header
    let x = table.startX;
    columns.forEach((c) => {
      const textWidth = fonts.bold.widthOfTextAtSize(c.label, 10);
      const xText = c.align === "center" ? x + c.width / 2 - textWidth / 2 : x + 5;
      page.drawText(c.label, { x: xText, y: yStart - 15, size: 10, font: fonts.bold });
      x += c.width;
    });

    // Rows
    let y = yStart - 35;
    rows.forEach((r) => {
      let x = table.startX;
      columns.forEach((c) => {
        const text = r[c.key] || "";
        const cleanText = text.replace(/[\n\r]/g, " ");
        const tw = fonts.normal.widthOfTextAtSize(cleanText, 9);
        const xText = c.align === "center" ? x + c.width / 2 - tw / 2 : x + 5;
        page.drawText(cleanText, { x: xText, y, size: 9, font: fonts.normal });
        x += c.width;
      });
      y -= rowHeight;
    });
  }

  // 📜 Application
  async addApplication(pdfDoc, fonts, buffer) {
    const page = pdfDoc.addPage(this.pageSize);
    const { width, height } = page.getSize();
    this.drawAlignedText(page, "APPLICATION", fonts.bold, 14, height - 100, "center");

    if (!buffer) {
      this.drawAlignedText(page, "Application document will be attached here.", fonts.normal, 12, height - 160, "center");
      return;
    }

    try {
      const appPdf = await PDFDocument.load(buffer);
      const pages = await pdfDoc.copyPages(appPdf, appPdf.getPageIndices());
      pages.forEach((p) => pdfDoc.addPage(p));
    } catch {
      this.drawAlignedText(page, "Error loading application PDF.", fonts.normal, 12, height - 160, "center");
    }
  }

  // 📄 List of Documents
  async createListOfDocuments(pdfDoc, fonts) {
    const page = pdfDoc.addPage(this.pageSize);
    const { width, height } = page.getSize();
    let y = height - 100;
    this.drawAlignedText(page, "LIST OF DOCUMENTS", fonts.bold, 14, y, "center");
    y -= 50;
    const docs = [
      "1. Application Form",
      "2. Identity Proof (Aadhar Card)",
      "3. Address Proof",
      "4. Bank Account Details",
      "5. Deposit Proof Documents",
      "6. Police Station Statement Copy",
      "7. Additional Supporting Documents",
      "8. Affidavit",
      "9. Vakalatnama",
    ];
    docs.forEach((d) => {
      page.drawText(d, { x: 80, y, size: 11, font: fonts.normal });
      y -= 22;
    });
  }

  // 📎 Exhibits
  async addExhibits(pdfDoc, fonts, exhibitDocs, pageTracker) {
    const exhibits = [
      { id: "A", title: "EXHIBIT A", desc: "Copy of the slip of Account started on 17.11.2022" },
      { id: "B", title: "EXHIBIT B", desc: "Copy of the Deposits Amount by Applicant to the 'said bank'" },
      { id: "C", title: "EXHIBIT C", desc: "Copy of the statement by Applicant to Shrirampur Police Station" },
      { id: "D", title: "EXHIBIT D", desc: "Additional Supporting Documents" },
    ];

    for (const ex of exhibits) {
      pageTracker.sections[`exhibit${ex.id}`] = pdfDoc.getPageCount() + 1;
      const page = pdfDoc.addPage(this.pageSize);
      const { width, height } = page.getSize();
      this.drawAlignedText(page, ex.title, fonts.bold, 14, height - 100, "center");
      this.drawAlignedText(page, ex.desc, fonts.normal, 12, height - 130, "center");

      const files = exhibitDocs?.[`Exhibit ${ex.id}`] || [];
      for (const f of files) {
        try {
          const buff = await fs.readFile(f.filePath);
          const doc = await PDFDocument.load(buff);
          const pages = await pdfDoc.copyPages(doc, doc.getPageIndices());
          pages.forEach((p) => pdfDoc.addPage(p));
        } catch {
          this.drawAlignedText(page, "Error loading exhibit PDF.", fonts.normal, 11, height - 180, "center");
        }
      }
    }
  }

  // 📜 Memorandum
  async createMemorandum(pdfDoc, fonts, userData) {
    const page = pdfDoc.addPage(this.pageSize);
    const { width, height } = page.getSize();
    let y = height - 100;
    this.drawAlignedText(page, "MEMORANDUM OF ADDRESS", fonts.bold, 14, y, "center");
    y -= 50;
    const addr = (userData.address || "Address not provided").replace(/[\n\r]/g, " ").trim();
    this.wrapText(addr, fonts.normal, 12, width - 100).forEach((line) => {
      this.drawAlignedText(page, line, fonts.normal, 12, y, "center");
      y -= 22;
    });
  }

  // 🧾 Affidavit
  async createAffidavit(pdfDoc, fonts, userData) {
    const page = pdfDoc.addPage(this.pageSize);
    const { height } = page.getSize();
    let y = height - 100;
    this.drawAlignedText(page, "AFFIDAVIT-IN-SUPPORT OF THE APPLICATION", fonts.bold, 14, y, "center");
    y -= 50;
    const lines = [
      `I, ${userData.full_name || "Applicant"}, residing at ${userData.address || "address not provided"},`,
      "do hereby solemnly affirm and state as under:",
      "",
      "1. The contents of this application are true to the best of my knowledge.",
      "2. I have not concealed any material facts from this Honorable Court.",
      "3. This application is made in good faith and in the interest of justice.",
      "4. The attached documents are genuine and authentic.",
      "",
      "DEPONENT",
    ];
    lines.forEach((l) => {
      this.drawAlignedText(page, l, fonts.normal, 11, y, "left");
      y -= 20;
    });
  }

  // ⚖️ Vakalatnama
  async createVakalatnama(pdfDoc, fonts, userData) {
    const page = pdfDoc.addPage(this.pageSize);
    const { height } = page.getSize();
    let y = height - 100;
    this.drawAlignedText(page, "VAKALATNAMA", fonts.bold, 14, y, "center");
    y -= 50;
    const lines = [
      "In the Court of Honourable Sessions for Greater Bombay at Mumbai",
      "Special Court for PMLA Cases",
      "",
      `Criminal Application/Exhibit No. of ${this.courtDetails.year}`,
      `Special Case No. of ${this.courtDetails.year}`,
      "",
      `I, ${userData.full_name || "Applicant"}, do hereby appoint Adv. _______________________`,
      "to appear for me in the above mentioned case and to conduct the same.",
      "",
      "Date: _____________",
      "",
      "CLIENT SIGNATURE",
      "ACCEPTED",
      "ADVOCATE SIGNATURE",
    ];
    lines.forEach((l) => {
      this.drawAlignedText(page, l, fonts.normal, 11, y, "left");
      y -= 20;
    });
  }

  // 🔢 Update Cover Page with Page Numbers
  async updateCoverPage(pdfDoc, pageTracker) {
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const sections = [
      "application",
      "listOfDocuments",
      "exhibitA",
      "exhibitB",
      "exhibitC",
      "exhibitD",
      "memorandum",
      "affidavit",
      "vakalatnama",
    ];
    let y = 340;
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const num = pageTracker.sections[sec];
      if (num) {
        const txt = num.toString();
        const tw = font.widthOfTextAtSize(txt, 9);
        page.drawText(txt, { x: 510 - tw / 2, y, size: 9, font });
      }
      y -= 20;
    }
  }

  // 🧭 Footer Page Numbers
  addPageNumbers(pdfDoc, fonts) {
    pdfDoc.getPages().forEach((p, i) => {
      const { width } = p.getSize();
      p.drawText(`Page ${i + 1}`, {
        x: width - 70,
        y: 30,
        size: 9,
        font: fonts.italic,
        color: rgb(0.5, 0.5, 0.5),
      });
    });
  }
}

module.exports = new CourtPdfService();
