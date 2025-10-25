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
      pageTracker.currentPage = pdfDoc.getPageCount();

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

    // Court header - CENTER ALIGNED
    const headerLines = [this.courtDetails.courtName, this.courtDetails.specialCourt];

    headerLines.forEach((line, index) => {
      const textWidth = this.safeTextWidth(fonts.bold, line, 12);
      page.drawText(line, {
        x: (width - textWidth) / 2,
        y: yPosition - index * 30,
        size: 12,
        font: fonts.bold,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 100;

    // Case numbers - CENTER ALIGNED
    const caseLines = [
      `CRIMINAL APPLICATION/EXHIBIT NO. OF ${this.courtDetails.year}`,
      'IN',
      `SPECIAL CASE NO. OF ${this.courtDetails.year}`,
    ];

    caseLines.forEach((line, index) => {
      const textWidth = this.safeTextWidth(fonts.normal, line, 11);
      page.drawText(line, {
        x: (width - textWidth) / 2,
        y: yPosition - index * 25,
        size: 11,
        font: fonts.normal,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 90;

    // Parties section - PROPER ALIGNMENT
    const applicantName = userData.full_name || 'APPLICANT NAME';
    const partyLines = [
      `(${applicantName})……APPLICANT`,
      'VERSUS',
      'DNYANDHA MULTISTATE CO-OPERATIVE CREDIT SOCIETY) …ACCUSED',
      'DIRECTORATE OF ENFORCEMENT ) … COMPLAINT',
    ];

    partyLines.forEach((line, index) => {
      const isVersus = line === 'VERSUS';
      const textWidth = isVersus ? this.safeTextWidth(fonts.bold, line, 12) : this.safeTextWidth(fonts.normal, line, 11);

      page.drawText(line, {
        x: isVersus ? (width - textWidth) / 2 : this.margins.left,
        y: yPosition - index * 22,
        size: isVersus ? 12 : 11,
        font: isVersus ? fonts.bold : fonts.normal,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 100;

    // INDEX Table - CENTERED
    const indexText = 'INDEX';
    const indexTextWidth = this.safeTextWidth(fonts.bold, indexText, 14);
    page.drawText(indexText, {
      x: (width - indexTextWidth) / 2,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 40;

    // Table structure
    this.drawTableStructure(page, fonts, yPosition, width);
    yPosition -= 25;

    // Table rows - will be updated later with page numbers
    const rows = this.getIndexRows(userData);
    rows.forEach(row => {
      this.drawTableRow(page, fonts, row, yPosition, width);
      yPosition -= 20;
    });

    // Footer - PROPER ALIGNMENT
    this.drawCoverFooter(page, fonts, height, width);
  }

  // SAFE TEXT WIDTH CALCULATION - HANDLES NEWLINE CHARACTERS
  safeTextWidth(font, text, size) {
    if (!text || text === '') return 0;
    // Remove any newline characters and trim the text
    const cleanText = text.replace(/[\n\r]/g, '').trim();
    if (cleanText === '') return 0;
    return font.widthOfTextAtSize(cleanText, size);
  }

  drawTableStructure(page, fonts, yPosition, width) {
    const tableLeft = 50;
    const tableRight = width - 50;

    // Draw table borders
    page.drawLine({
      start: { x: tableLeft, y: yPosition },
      end: { x: tableRight, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Table headers with PROPER COLUMN WIDTHS
    const headers = ['SR NO', 'PARTICULARS', 'EXHIBITS NO', 'PAGE NO'];
    const headerXPositions = [60, 120, 400, 500];

    headers.forEach((header, index) => {
      const textWidth = this.safeTextWidth(fonts.bold, header, 10);
      let xPos = headerXPositions[index];

      // Center align PAGE NO header
      if (index === 3) {
        xPos = headerXPositions[index] - textWidth / 2;
      }

      page.drawText(header, {
        x: xPos,
        y: yPosition - 20,
        size: 10,
        font: fonts.bold,
        color: rgb(0, 0, 0),
      });
    });

    // Bottom border of header
    page.drawLine({
      start: { x: tableLeft, y: yPosition - 40 },
      end: { x: tableRight, y: yPosition - 40 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }

  drawTableRow(page, fonts, row, yPosition, width) {
    const positions = [60, 120, 400, 500];

    // SR NO - Center aligned
    const srNoWidth = this.safeTextWidth(fonts.normal, row.sr, 9);
    page.drawText(row.sr, {
      x: positions[0] - srNoWidth / 2 + 5,
      y: yPosition,
      size: 9,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    // PARTICULARS - Left aligned
    page.drawText(row.particulars, {
      x: positions[1],
      y: yPosition,
      size: 9,
      font: fonts.normal,
      color: rgb(0, 0, 0),
      maxWidth: 250,
    });

    // EXHIBITS NO - Center aligned
    if (row.exhibit) {
      const exhibitWidth = this.safeTextWidth(fonts.normal, row.exhibit, 9);
      page.drawText(row.exhibit, {
        x: positions[2] - exhibitWidth / 2 + 10,
        y: yPosition,
        size: 9,
        font: fonts.normal,
        color: rgb(0, 0, 0),
      });
    }

    // PAGE NO - Center aligned (will be filled later)
    if (row.page) {
      const pageWidth = this.safeTextWidth(fonts.normal, row.page, 9);
      page.drawText(row.page, {
        x: positions[3] - pageWidth / 2 + 5,
        y: yPosition,
        size: 9,
        font: fonts.normal,
        color: rgb(0, 0, 0),
      });
    }
  }

  getIndexRows(userData) {
    const applicantName = userData.full_name || 'APPLICANT NAME';
    return [
      { sr: '1', particulars: 'APPLICATION', exhibit: '', page: '' },
      { sr: '2', particulars: 'LIST OF DOCUMENTS', exhibit: '', page: '' },
      { sr: '3', particulars: 'Copy of the slip of Account started on 17.11.2022', exhibit: '"A"', page: '' },
      { sr: '4', particulars: 'Copy of the Deposits Amount by Applicant to the "said bank"', exhibit: '"B"', page: '' },
      { sr: '5', particulars: 'Copy of the statement by Applicant to Shrirampur Police Station', exhibit: '"C"', page: '' },
      { sr: '6', particulars: 'Additional Supporting Documents', exhibit: '"D"', page: '' },
      { sr: '7', particulars: 'Memorandum of Address', exhibit: '', page: '' },
      { sr: '8', particulars: 'Affidavit-in-Support of the Application', exhibit: '', page: '' },
      { sr: '9', particulars: 'Vakalatnama', exhibit: '', page: '' },
    ];
  }

  drawCoverFooter(page, fonts, pageHeight, width) {
    const footerY = this.margins.bottom + 40;

    // Left side - PLACE and DATE
    page.drawText('PLACE: _______________________', {
      x: this.margins.left,
      y: footerY,
      size: 10,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    page.drawText('DATE: _______________________', {
      x: this.margins.left,
      y: footerY - 20,
      size: 10,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    // Right side - ADVOCATE
    const advocateText = 'ADVOCATE FOR THE APPLICANT';
    const advocateWidth = this.safeTextWidth(fonts.normal, advocateText, 10);
    page.drawText(advocateText, {
      x: width - advocateWidth - this.margins.right,
      y: footerY,
      size: 10,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    const advocateName = '(ADVOCATE NAME)';
    const advocateNameWidth = this.safeTextWidth(fonts.normal, advocateName, 10);
    page.drawText(advocateName, {
      x: width - advocateNameWidth - this.margins.right,
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
      exhibitD: 6,
      memorandum: 7,
      affidavit: 8,
      vakalatnama: 9,
    };

    // Calculate Y positions for page numbers - ADJUSTED FOR BETTER ALIGNMENT
    const startY = 485;
    const rowHeight = 20;

    // Update page numbers on cover page
    Object.entries(sectionMapping).forEach(([section, rowIndex]) => {
      if (pageTracker.sections[section]) {
        const yPosition = startY - (rowIndex - 1) * rowHeight;
        const pageNum = pageTracker.sections[section].toString();
        const pageNumWidth = this.safeTextWidth(fonts.normal, pageNum, 9);

        // Center align page numbers in the PAGE NO column
        coverPage.drawText(pageNum, {
          x: 500 - pageNumWidth / 2 + 5,
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
    const { width, height } = page.getSize();
    let yPosition = height - 100;

    // Center align title
    const title = 'LIST OF DOCUMENTS';
    const titleWidth = this.safeTextWidth(fonts.bold, title, 14);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
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
      '7. Additional Supporting Documents',
      '8. Affidavit',
      '9. Vakalatnama',
    ];

    // Left align documents with proper indentation
    documents.forEach(doc => {
      page.drawText(doc, {
        x: 80,
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
    const { width, height } = page.getSize();
    let yPosition = height - 100;

    // Center align title
    const title = 'MEMORANDUM OF ADDRESS';
    const titleWidth = this.safeTextWidth(fonts.bold, title, 14);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 60;

    const address = userData.address || 'Address not provided';
    // Clean the address and split into lines
    const cleanAddress = address.replace(/[\n\r]/g, ' ').trim();
    const lines = this.splitTextIntoLines(cleanAddress, 60);

    // Center align address lines - USE SIMPLE CENTERING WITHOUT widthOfTextAtSize
    lines.forEach(line => {
      if (line && line.trim() !== '') {
        // Simple centering without width calculation for address lines
        const estimatedWidth = line.length * 7; // Rough estimate
        const xPos = Math.max(50, (width - estimatedWidth) / 2);
        page.drawText(line, {
          x: xPos,
          y: yPosition,
          size: 12,
          font: fonts.normal,
          color: rgb(0, 0, 0),
          maxWidth: width - 100,
        });
      }
      yPosition -= 25;
    });
  }

  async createAffidavitPage(pdfDoc, fonts, userData) {
    const page = pdfDoc.addPage(this.pageSize);
    const { width, height } = page.getSize();
    let yPosition = height - 80;

    // Center align title
    const title = 'AFFIDAVIT-IN-SUPPORT OF THE APPLICATION';
    const titleWidth = this.safeTextWidth(fonts.bold, title, 14);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 60;

    const affidavitText = this.getAffidavitText(userData);

    // Justified text with proper margins
    affidavitText.forEach(line => {
      if (line === '') {
        yPosition -= 15;
      } else {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 11,
          font: fonts.normal,
          color: rgb(0, 0, 0),
          maxWidth: width - 100,
        });
        yPosition -= 20;
      }
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
    const { width, height } = page.getSize();
    let yPosition = height - 80;

    // Center align title
    const title = 'VAKALATNAMA';
    const titleWidth = this.safeTextWidth(fonts.bold, title, 14);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: yPosition,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 60;

    const vakalatnamaText = this.getVakalatnamaText(userData);

    // Justified text with proper margins
    vakalatnamaText.forEach(line => {
      if (line === '') {
        yPosition -= 12;
      } else {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 11,
          font: fonts.normal,
          color: rgb(0, 0, 0),
          maxWidth: width - 100,
        });
        yPosition -= 18;
      }
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
      const { width, height } = headingPage.getSize();

      // Center align title
      const title = 'APPLICATION';
      const titleWidth = this.safeTextWidth(fonts.bold, title, 14);
      headingPage.drawText(title, {
        x: (width - titleWidth) / 2,
        y: height - 100,
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
    const { width, height } = page.getSize();

    // Center align title
    const title = 'APPLICATION';
    const titleWidth = this.safeTextWidth(fonts.bold, title, 14);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: height - 100,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });

    // Center align placeholder text
    const placeholder = 'Application document will be attached here.';
    const placeholderWidth = this.safeTextWidth(fonts.normal, placeholder, 12);
    page.drawText(placeholder, {
      x: (width - placeholderWidth) / 2,
      y: height - 200,
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
      { id: 'D', title: 'EXHIBIT D', description: 'Additional Supporting Documents' },
    ];

    for (const exhibit of exhibits) {
      const exhibitFiles = exhibitDocuments[`Exhibit ${exhibit.id}`] || [];

      if (exhibitFiles.length > 0) {
        pageTracker.sections[`exhibit${exhibit.id}`] = pdfDoc.getPageCount() + 1;
        await this.addExhibitSection(pdfDoc, fonts, exhibit, exhibitFiles);
      } else {
        // If no files for this exhibit, still create placeholder
        pageTracker.sections[`exhibit${exhibit.id}`] = pdfDoc.getPageCount() + 1;
        await this.createExhibitPlaceholder(pdfDoc, fonts, exhibit);
      }
    }
  }

  async addExhibitSection(pdfDoc, fonts, exhibit, exhibitFiles) {
    const page = pdfDoc.addPage(this.pageSize);
    const { width, height } = page.getSize();

    // Center align exhibit title
    const titleWidth = this.safeTextWidth(fonts.bold, exhibit.title, 14);
    page.drawText(exhibit.title, {
      x: (width - titleWidth) / 2,
      y: height - 100,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });

    // Center align exhibit description
    const descWidth = this.safeTextWidth(fonts.normal, exhibit.description, 12);
    page.drawText(exhibit.description, {
      x: (width - descWidth) / 2,
      y: height - 130,
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

  async createExhibitPlaceholder(pdfDoc, fonts, exhibit) {
    const page = pdfDoc.addPage(this.pageSize);
    const { width, height } = page.getSize();

    // Center align exhibit title
    const titleWidth = this.safeTextWidth(fonts.bold, exhibit.title, 14);
    page.drawText(exhibit.title, {
      x: (width - titleWidth) / 2,
      y: height - 100,
      size: 14,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });

    // Center align exhibit description
    const descWidth = this.safeTextWidth(fonts.normal, exhibit.description, 12);
    page.drawText(exhibit.description, {
      x: (width - descWidth) / 2,
      y: height - 130,
      size: 12,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });

    // Center align placeholder text
    const placeholder = 'No documents attached for this exhibit.';
    const placeholderWidth = this.safeTextWidth(fonts.normal, placeholder, 12);
    page.drawText(placeholder, {
      x: (width - placeholderWidth) / 2,
      y: height - 200,
      size: 12,
      font: fonts.normal,
      color: rgb(0, 0, 0),
    });
  }

  splitTextIntoLines(text, maxLength) {
    if (!text) return [];
    const cleanText = text.replace(/[\n\r]/g, ' ').trim();
    const words = cleanText.split(' ');
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
