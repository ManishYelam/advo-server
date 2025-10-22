const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

class CourtPdfService {
  constructor() {
    this.courtDetails = {
      courtName: "IN THE COURT OF HON'BLE SESSION FOR GREATER BOMBAY AT, MUMBAI",
      specialCourt: 'SPECIAL COURT FOR PMLA CASES',
      year: new Date().getFullYear(),
    };
    this.pageSize = [595.28, 841.89]; // A4
    this.margins = { left: 50, right: 50, top: 100, bottom: 50 };
  }

  async generateCourtDocument(userData, caseData, applicationPdfBuffer, exhibitDocuments) {
    try {
      console.log('⚖️ Generating optimized court document...');

      const pdfDoc = await PDFDocument.create();

      // Embed fonts once and reuse
      const fonts = {
        normal: await pdfDoc.embedFont(StandardFonts.TimesRoman),
        bold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        italic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
      };

      // Track page numbers for index
      const pageTracker = {
        currentPage: 1,
        sections: {},
      };

      // Create cover page first (will be page 1)
      await this.createCoverPage(pdfDoc, fonts, userData, caseData, pageTracker);

      // Add application document
      pageTracker.sections.application = pageTracker.currentPage + 1;
      await this.addApplicationDocument(pdfDoc, fonts, applicationPdfBuffer);
      pageTracker.currentPage = pdfDoc.getPageCount();

      // Add list of documents
      pageTracker.sections.listOfDocuments = pageTracker.currentPage + 1;
      await this.createListOfDocumentsPage(pdfDoc, fonts);
      pageTracker.currentPage = pdfDoc.getPageCount();

      // Add exhibits with proper pagination
      await this.addExhibits(pdfDoc, fonts, exhibitDocuments, pageTracker);
      pageTracker.currentPage = pdfDoc.getPageCount();

      // Add remaining sections
      const sections = [
        { name: 'memorandum', method: this.createMemorandumPage },
        { name: 'affidavit', method: this.createAffidavitPage },
        { name: 'vakalatnama', method: this.createVakalatnamaPage },
      ];

      for (const section of sections) {
        pageTracker.sections[section.name] = pageTracker.currentPage + 1;
        await section.method.call(this, pdfDoc, fonts, userData);
        pageTracker.currentPage = pdfDoc.getPageCount();
      }

      // Update cover page with correct page numbers
      await this.updateCoverPageWithPageNumbers(pdfDoc, pageTracker);

      const pdfBytes = await pdfDoc.save();
      console.log('✅ Optimized court document generated successfully');
      return pdfBytes;
    } catch (error) {
      console.error('❌ Error generating court document:', error);
      throw error;
    }
  }

  async createCoverPage(pdfDoc, fonts, userData, caseData, pageTracker) {
    const page = pdfDoc.addPage(this.pageSize);
    const { width, height } = page.getSize();

    let yPosition = height - this.margins.top;

    // Court header - optimized drawing
    const headerLines = [this.courtDetails.courtName, this.courtDetails.specialCourt];

    headerLines.forEach((line, index) => {
      page.drawText(line, {
        x: this.margins.left,
        y: yPosition - index * 30,
        size: 12,
        font: fonts.bold,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 100;

    // Case numbers
    const caseLines = [
      `CRIMINAL APPLICATION/EXHIBIT NO. OF ${this.courtDetails.year}`,
      'IN',
      `SPECIAL CASE NO. OF ${this.courtDetails.year}`,
    ];

    caseLines.forEach((line, index) => {
      page.drawText(line, {
        x: this.margins.left,
        y: yPosition - index * 20,
        size: 11,
        font: fonts.normal,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 80;

    // Parties section
    const applicantName = userData.full_name || 'APPLICANT NAME';
    const partyLines = [
      `(${applicantName})……APPLICANT`,
      'VERSUS',
      'DNYANDHA MULTISTATE CO-OPERATIVE CREDIT SOCIETY) …ACCUSED',
      'DIRECTORATE OF ENFORCEMENT ) … COMPLAINT',
    ];

    partyLines.forEach((line, index) => {
      const isVersus = line === 'VERSUS';
      page.drawText(line, {
        x: isVersus ? 270 : this.margins.left,
        y: yPosition - index * 20,
        size: isVersus ? 12 : 11,
        font: isVersus ? fonts.bold : fonts.normal,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 80;

    // INDEX Table
    page.drawText('INDEX', {
      x: 270,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 40;

    // Table structure - PASS FONTS TO THE METHOD
    this.drawTableStructure(page, fonts, yPosition);
    yPosition -= 25;

    // Table rows - will be updated later with page numbers
    const rows = this.getIndexRows(userData);
    rows.forEach(row => {
      this.drawTableRow(page, fonts, row, yPosition);
      yPosition -= 20;
    });

    // Footer - PASS FONTS TO THE METHOD
    this.drawCoverFooter(page, fonts, height);
  }

  // ADD FONTS PARAMETER HERE
  drawTableStructure(page, fonts, yPosition) {
    // Draw table borders
    page.drawLine({
      start: { x: this.margins.left, y: yPosition },
      end: { x: 545, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Table headers
    const headers = ['SR NO', 'PARTICULARS', 'EXHIBITS NO', 'PAGE NO'];
    const headerXPositions = [60, 120, 380, 480];

    headers.forEach((header, index) => {
      page.drawText(header, {
        x: headerXPositions[index],
        y: yPosition - 20,
        size: 10,
        font: fonts.bold, // NOW fonts IS DEFINED
        color: rgb(0, 0, 0),
      });
    });

    page.drawLine({
      start: { x: this.margins.left, y: yPosition - 40 },
      end: { x: 545, y: yPosition - 40 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }

  // ADD FONTS PARAMETER HERE
  drawTableRow(page, fonts, row, yPosition) {
    const positions = [60, 120, 380, 480];

    page.drawText(row.sr, {
      x: positions[0],
      y: yPosition,
      size: 9,
      font: fonts.normal, // NOW fonts IS DEFINED
      color: rgb(0, 0, 0),
    });

    page.drawText(row.particulars, {
      x: positions[1],
      y: yPosition,
      size: 9,
      font: fonts.normal,
      color: rgb(0, 0, 0),
      maxWidth: 250,
    });

    page.drawText(row.exhibit, {
      x: positions[2],
      y: yPosition,
      size: 9,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    page.drawText(row.page, {
      x: positions[3],
      y: yPosition,
      size: 9,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });
  }

  getIndexRows(userData) {
    const applicantName = userData.full_name || 'APPLICANT NAME';
    return [
      { sr: '1', particulars: 'APPLICATION', exhibit: '', page: '' },
      { sr: '2', particulars: 'LIST OF DOCUMENTS', exhibit: '', page: '' },
      { sr: '3', particulars: 'Copy of the slip of Account started on 17.11.2022', exhibit: '"A"', page: '' },
      { sr: '4', particulars: 'Copy of the Deposits Amount by Applicant to the "said bank"', exhibit: '"B"', page: '' },
      { sr: '5', particulars: 'Copy of the statement by Applicant to Shrirampur Police Station', exhibit: '"C"', page: '' },
      { sr: '6', particulars: 'Memorandum of Address', exhibit: '', page: '' },
      { sr: '7', particulars: 'Affidavit-in-Support of the Application', exhibit: '', page: '' },
      { sr: '8', particulars: 'Vakalatnama', exhibit: '', page: '' },
    ];
  }

  // ADD FONTS PARAMETER HERE
  drawCoverFooter(page, fonts, pageHeight) {
    const footerY = this.margins.bottom + 40;

    page.drawText('PLACE: _______________________', {
      x: this.margins.left,
      y: footerY,
      size: 10,
      font: fonts.normal, // NOW fonts IS DEFINED
      color: rgb(0, 0, 0),
    });

    page.drawText('DATE: TODAY', {
      x: this.margins.left,
      y: footerY - 20,
      size: 10,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    page.drawText('ADVOCATE FOR THE APPLICANT', {
      x: 350,
      y: footerY,
      size: 10,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    page.drawText('(ADVOCATE NAME)', {
      x: 380,
      y: footerY - 20,
      size: 10,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });
  }

  async updateCoverPageWithPageNumbers(pdfDoc, pageTracker) {
    const coverPage = pdfDoc.getPages()[0];
    const fonts = {
      normal: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    };

    // Map section names to index rows
    const sectionMapping = {
      application: 1,
      listOfDocuments: 2,
      exhibitA: 3,
      exhibitB: 4,
      exhibitC: 5,
      memorandum: 6,
      affidavit: 7,
      vakalatnama: 8,
    };

    // Update page numbers on cover page
    Object.entries(sectionMapping).forEach(([section, rowIndex]) => {
      if (pageTracker.sections[section]) {
        const yPosition = 500 - rowIndex * 20; // Adjust based on your layout
        coverPage.drawText(pageTracker.sections[section].toString(), {
          x: 480,
          y: yPosition,
          size: 9,
          font: fonts.normal,
          color: rgb(0, 0, 0),
        });
      }
    });
  }

  async createListOfDocumentsPage(pdfDoc, fonts) {
    const page = pdfDoc.addPage(this.pageSize);
    let yPosition = 800;

    page.drawText('LIST OF DOCUMENTS', {
      x: 220,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 60;

    const documents = [
      '1. Application Form',
      '2. Identity Proof (Aadhar Card)',
      '3. Address Proof',
      '4. Bank Account Details',
      '5. Deposit Proof Documents',
      '6. Police Station Statement Copy',
      '7. Affidavit',
      '8. Vakalatnama',
    ];

    documents.forEach(doc => {
      page.drawText(doc, {
        x: 100,
        y: yPosition,
        size: 12,
        font: fonts.normal,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
    });
  }

  async createMemorandumPage(pdfDoc, fonts, userData) {
    const page = pdfDoc.addPage(this.pageSize);
    let yPosition = 800;

    page.drawText('MEMORANDUM OF ADDRESS', {
      x: 200,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 60;

    const address = userData.address || 'Address not provided';
    const lines = this.splitTextIntoLines(address, 80);

    lines.forEach(line => {
      page.drawText(line, {
        x: 100,
        y: yPosition,
        size: 12,
        font: fonts.normal,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
    });
  }

  async createAffidavitPage(pdfDoc, fonts, userData) {
    const page = pdfDoc.addPage(this.pageSize);
    let yPosition = 800;

    page.drawText('AFFIDAVIT-IN-SUPPORT OF THE APPLICATION', {
      x: 150,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 60;

    const affidavitText = this.getAffidavitText(userData);

    affidavitText.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 11,
        font: fonts.normal,
        color: rgb(0, 0, 0),
        maxWidth: 500,
      });
      yPosition -= line === '' ? 15 : 20;
    });
  }

  getAffidavitText(userData) {
    return [
      `I, ${userData.full_name || 'Applicant'}, residing at ${userData.address || 'address not provided'},`,
      'do hereby solemnly affirm and state as under:',
      '',
      '1. That the contents of this application are true and correct to the best of my knowledge and belief.',
      '2. That I have not concealed any material facts from this Honorable Court.',
      '3. That I am filing this application in good faith and for the purposes of justice.',
      '4. That all documents attached herewith are genuine and authentic.',
      '',
      'I solemnly affirm that the above stated facts are true and correct,',
      'no part of it is false and nothing material has been concealed therefrom.',
      '',
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      'DEPONENT',
    ];
  }

  async createVakalatnamaPage(pdfDoc, fonts, userData) {
    const page = pdfDoc.addPage(this.pageSize);
    let yPosition = 800;

    page.drawText('VAKALATNAMA', {
      x: 250,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 60;

    const vakalatnamaText = this.getVakalatnamaText(userData);

    vakalatnamaText.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 11,
        font: fonts.normal,
        color: rgb(0, 0, 0),
        maxWidth: 500,
      });
      yPosition -= line === '' ? 15 : 18;
    });
  }

  getVakalatnamaText(userData) {
    return [
      'In the Court of Honourable Sessions for Greater Bombay at Mumbai',
      'Special Court for PMLA Cases',
      '',
      `Criminal Application/Exhibit No. of ${this.courtDetails.year}`,
      `Special Case No. of ${this.courtDetails.year}`,
      '',
      `I, ${userData.full_name || 'Applicant'},`,
      'do hereby appoint and retain Adv. _______________________',
      'to appear for me in the above mentioned case and to conduct',
      'and prosecute (or defend) the same and all proceedings that',
      'may be taken in respect of any application or any matter connected',
      'with the same or relating to the restitution or otherwise howsoever',
      'arising therefrom or incidental thereto.',
      '',
      'I agree to pay the said Advocate his professional fees and all',
      'other costs, charges and expenses that may be incurred by him',
      'in the conduct of the aforesaid case.',
      '',
      'I also agree to ratify all acts done by the said Advocate in the',
      'conduct of the aforesaid case as if done by me.',
      '',
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      'CLIENT SIGNATURE',
      '',
      'ACCEPTED',
      '',
      'ADVOCATE SIGNATURE',
    ];
  }

  async addApplicationDocument(pdfDoc, fonts, applicationPdfBuffer) {
    if (!applicationPdfBuffer) {
      this.createPlaceholderApplicationPage(pdfDoc, fonts);
      return;
    }

    try {
      // Add application heading
      const headingPage = pdfDoc.addPage(this.pageSize);
      headingPage.drawText('APPLICATION', {
        x: 250,
        y: 800,
        size: 14,
        font: fonts.bold,
        color: rgb(0, 0, 0),
      });

      // Embed application PDF
      const applicationPdf = await PDFDocument.load(applicationPdfBuffer);
      const applicationPages = await pdfDoc.copyPages(applicationPdf, applicationPdf.getPageIndices());
      applicationPages.forEach(page => pdfDoc.addPage(page));
    } catch (error) {
      console.error('Error adding application document:', error);
      this.createPlaceholderApplicationPage(pdfDoc, fonts);
    }
  }

  createPlaceholderApplicationPage(pdfDoc, fonts) {
    const page = pdfDoc.addPage(this.pageSize);
    page.drawText('APPLICATION', {
      x: 250,
      y: 800,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    page.drawText('Application document will be attached here.', {
      x: 150,
      y: 700,
      size: 12,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });
  }

  async addExhibits(pdfDoc, fonts, exhibitDocuments, pageTracker) {
    if (!exhibitDocuments || Object.keys(exhibitDocuments).length === 0) return;

    const exhibits = [
      { id: 'A', title: 'EXHIBIT A', description: 'Copy of the slip of Account started on 17.11.2022' },
      { id: 'B', title: 'EXHIBIT B', description: 'Copy of the Deposits Amount by Applicant to the "said bank"' },
      { id: 'C', title: 'EXHIBIT C', description: 'Copy of the statement by Applicant to Shrirampur Police Station' },
    ];

    for (const exhibit of exhibits) {
      const exhibitFiles = exhibitDocuments[`Exhibit ${exhibit.id}`] || [];

      if (exhibitFiles.length > 0) {
        pageTracker.sections[`exhibit${exhibit.id}`] = pdfDoc.getPageCount() + 1;
        await this.addExhibitSection(pdfDoc, fonts, exhibit, exhibitFiles);
      }
    }
  }

  async addExhibitSection(pdfDoc, fonts, exhibit, exhibitFiles) {
    // Add exhibit heading page
    const headingPage = pdfDoc.addPage(this.pageSize);
    headingPage.drawText(exhibit.title, {
      x: 250,
      y: 800,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    headingPage.drawText(exhibit.description, {
      x: 150,
      y: 770,
      size: 12,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    // Add exhibit PDF files
    for (const fileInfo of exhibitFiles) {
      if (fileInfo.fileType === 'application/pdf' && fileInfo.filePath) {
        try {
          const fileBuffer = await fs.readFile(fileInfo.filePath);
          const exhibitPdf = await PDFDocument.load(fileBuffer);
          const exhibitPages = await pdfDoc.copyPages(exhibitPdf, exhibitPdf.getPageIndices());
          exhibitPages.forEach(page => pdfDoc.addPage(page));
        } catch (error) {
          console.error(`Error adding exhibit ${exhibit.id} file:`, error);
        }
      }
    }
  }

  splitTextIntoLines(text, maxLength) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine === '' ? '' : ' ') + word;
      } else {
        if (currentLine !== '') lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine !== '') lines.push(currentLine);
    return lines;
  }

  // Fast simplified version for testing
  async generateSimplifiedCourtDocument(userData, caseData) {
    try {
      const pdfDoc = await PDFDocument.create();
      const fonts = {
        normal: await pdfDoc.embedFont(StandardFonts.TimesRoman),
        bold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        italic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
      };

      const pageTracker = { currentPage: 1, sections: {} };
      await this.createCoverPage(pdfDoc, fonts, userData, caseData, pageTracker);

      const pdfBytes = await pdfDoc.save();
      console.log('✅ Simplified court document generated successfully');
      return pdfBytes;
    } catch (error) {
      console.error('❌ Error generating simplified court document:', error);
      throw error;
    }
  }
}

module.exports = new CourtPdfService();
