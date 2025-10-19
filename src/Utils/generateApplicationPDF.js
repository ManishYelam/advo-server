import PDFDocument from 'pdfkit';
import PDFTable from 'pdfkit-table';

// Helper functions (keep the same)
const getFileType = filename => {
  if (!filename) return 'Unknown';
  const ext = filename.split('.').pop().toLowerCase();
  const typeMap = {
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    txt: 'Text',
    xls: 'Excel',
    xlsx: 'Excel',
  };
  return typeMap[ext] || ext.toUpperCase();
};

const formatFileSize = bytes => {
  if (!bytes) return 'N/A';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

const countTotalDocuments = documents => {
  if (!documents) return 0;
  return Object.values(documents).reduce((total, exhibitDocs) => {
    return total + (Array.isArray(exhibitDocs) ? exhibitDocs.length : 0);
  }, 0);
};

// PDF Generation Function with corrected footer handling
export const generateApplicationPDF = (user_data, case_data, payment_data, documents = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      const chunks = [];

      // Track pages manually for footer
      let pageCount = 0;
      doc.on('pageAdded', () => {
        pageCount++;
      });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Helper function to format dates for PDF
      const formatDatePDF = dateString => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      };

      // Helper function to format currency for PDF
      const formatCurrencyPDF = amount => {
        if (!amount) return '₹0';
        return `₹${parseInt(amount)}`;
      };

      // Helper function to format percentage for PDF
      const formatPercentagePDF = rate => {
        if (!rate) return '0.00%';
        return `${parseFloat(rate).toFixed(2)}%`;
      };

      // Function to add footer to current page
      const addFooter = (currentPage, totalPages) => {
        const bottomY = doc.page.height - 30;
        doc
          .fontSize(8)
          .fillColor('#7f8c8d')
          .text(
            `Page ${currentPage} of ${totalPages} | Application ID: ${payment_data.order_id || 'N/A'} | Generated on: ${new Date().toLocaleString()}`,
            30,
            bottomY,
            { align: 'center' }
          );
      };

      // ===== PAGE 1 - NEW FORMAT =====
      pageCount = 1;

      // Header
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000').text('INVESTMENT APPLICATION FORM', { align: 'center' });

      doc.moveDown(1.5);

      // Section 1: BASIC INFORMATION
      doc.fontSize(14).font('Helvetica-Bold').text('1. BASIC INFORMATION');

      doc.moveDown(0.3);

      // Draw table border
      const tableWidth = 500;
      const col1 = 180,
        col2 = 160,
        col3 = 160;

      // Table header background
      doc.rect(50, doc.y, tableWidth, 20).fill('#f0f0f0');

      // Table headers
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Full Name: ' + (user_data.full_name || ''), 55, doc.y + 6);
      doc.text('Phone No.: ' + (user_data.phone_number || ''), 55 + col1, doc.y + 6);
      doc.text('Aadhar No.: ' + (user_data.adhar_number || ''), 55 + col1 + col2, doc.y + 6);

      doc.y += 20;

      // Row 1
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.text('Date of Birth: ' + formatDatePDF(user_data.dob), 55, doc.y + 6);
      doc.text('Age: ' + (user_data.age ? user_data.age + ' years' : ''), 55 + col1, doc.y + 6);
      doc.text('Email: ' + (user_data.email || ''), 55 + col1 + col2, doc.y + 6);

      doc.y += 20;

      // Row 2
      doc.text('Gender: ' + (user_data.gender || ''), 55, doc.y + 6);
      doc.text('Occupation: ' + (user_data.occupation || ''), 55 + col1, doc.y + 6);
      doc.text('Address: ' + (user_data.address ? user_data.address.split('\n')[0] : ''), 55 + col1 + col2, doc.y + 6);

      doc.y += 25;

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cccccc').stroke();

      doc.moveDown(1);

      // Section 2: DEPOSIT DETAILS
      doc.fontSize(14).font('Helvetica-Bold').text('2. DEPOSIT DETAILS');

      doc.moveDown(0.5);

      // Deposit details in two columns
      const leftCol = 50;
      const rightCol = 300;
      const lineHeight = 18;

      let currentY = doc.y;

      // Left column
      doc.fontSize(10).font('Helvetica-Bold').text('Account Start:', leftCol, currentY);
      doc.font('Helvetica').text(formatDatePDF(case_data.saving_account_start_date), leftCol + 80, currentY);

      doc.font('Helvetica-Bold').text('Deposit Type:', leftCol, currentY + lineHeight);
      doc.font('Helvetica').text(case_data.deposit_type || '', leftCol + 80, currentY + lineHeight);

      doc.font('Helvetica-Bold').text('Duration:', leftCol, currentY + lineHeight * 2);
      doc.font('Helvetica').text((case_data.deposit_duration_years || '') + ' years', leftCol + 80, currentY + lineHeight * 2);

      doc.font('Helvetica-Bold').text('FD Amount:', leftCol, currentY + lineHeight * 3);
      doc.font('Helvetica').text(formatCurrencyPDF(case_data.fixed_deposit_total_amount), leftCol + 80, currentY + lineHeight * 3);

      doc.font('Helvetica-Bold').text('RD Amount:', leftCol, currentY + lineHeight * 4);
      doc
        .font('Helvetica')
        .text(formatCurrencyPDF(case_data.recurring_deposit_total_amount), leftCol + 80, currentY + lineHeight * 4);

      // Right column
      doc.font('Helvetica-Bold').text('FD Rate:', rightCol, currentY);
      doc.font('Helvetica').text(formatPercentagePDF(case_data.interest_rate_fd), rightCol + 80, currentY);

      doc.font('Helvetica-Bold').text('RD Rate:', rightCol, currentY + lineHeight);
      doc.font('Helvetica').text(formatPercentagePDF(case_data.interest_rate_recurring), rightCol + 80, currentY + lineHeight);

      doc.font('Helvetica-Bold').text('Savings Amount:', rightCol, currentY + lineHeight * 2);
      doc
        .font('Helvetica')
        .text(formatCurrencyPDF(case_data.saving_account_total_amount), rightCol + 80, currentY + lineHeight * 2);

      doc.font('Helvetica-Bold').text('Investment Amount:', rightCol, currentY + lineHeight * 3);
      doc
        .font('Helvetica')
        .text(formatCurrencyPDF(case_data.dnyanrudha_investment_total_amount), rightCol + 80, currentY + lineHeight * 3);

      doc.font('Helvetica-Bold').text('Savings Rate:', rightCol, currentY + lineHeight * 4);
      doc.font('Helvetica').text(formatPercentagePDF(case_data.interest_rate_saving), rightCol + 80, currentY + lineHeight * 4);

      doc.font('Helvetica-Bold').text('Dynadhara Rate:', rightCol, currentY + lineHeight * 5);
      doc.font('Helvetica').text(formatPercentagePDF(case_data.dynadhara_rate), rightCol + 80, currentY + lineHeight * 5);

      doc.y = currentY + lineHeight * 6 + 20;

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cccccc').stroke();

      doc.moveDown(1.5);

      // Declaration Section
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          'I hereby solemnly affirm that the information provided above is true and correct to the best of my knowledge and belief, and nothing material has been concealed therefrom. I understand that any false information may lead to rejection of my application.',
          {
            align: 'justify',
            lineGap: 4,
          }
        );

      doc.moveDown(1);

      // Verification Checkbox
      doc.fontSize(10).font('Helvetica-Bold').text('✓ VERIFIED AND CONFIRMED BY APPLICANT', { align: 'center' });

      doc.moveDown(1.5);

      // System Generated Text
      doc.fontSize(9).font('Helvetica-Bold').text('System Generated Document', { align: 'center' });

      doc.fontSize(8).font('Helvetica').text('No manual signature required', { align: 'center' });

      doc.moveDown(1.5);

      // Signature Section
      const signatureY = doc.y;

      doc.fontSize(9).font('Helvetica').text('Place: ______', 50, signatureY);
      doc.text('Date: ___/___/______', 300, signatureY);

      doc.moveDown(2);

      doc.fontSize(9).font('Helvetica-Bold').text('Signature of Applicant', 50, doc.y);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('(Authorized Signatory)', 50, doc.y + 12);

      doc.moveDown(3);

      // Footer for Page 1
      addFooter(1, 1); // Start with 1 page, will update later

      // ===== PAGE 2 - CASE DETAILS =====
      doc.addPage();
      pageCount = 2;
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#34495e').text('3. CASE DETAILS');

      doc.moveDown(0.5);

      const caseTable = {
        headers: [
          { label: 'Field', property: 'field', width: 200, headerColor: '#34495e' },
          { label: 'Details', property: 'details', width: 300, headerColor: '#34495e' },
        ],
        datas: [
          {
            field: 'Saving Account Start Date',
            details: case_data.saving_account_start_date
              ? new Date(case_data.saving_account_start_date).toLocaleDateString()
              : 'N/A',
          },
          { field: 'Deposit Type', details: case_data.deposit_type || 'N/A' },
          { field: 'Deposit Duration (Years)', details: case_data.deposit_duration_years || 'N/A' },
          {
            field: 'Fixed Deposit Amount',
            details: case_data.fixed_deposit_total_amount ? `₹${case_data.fixed_deposit_total_amount}` : 'N/A',
          },
          { field: 'FD Interest Rate', details: case_data.interest_rate_fd ? `${case_data.interest_rate_fd}%` : 'N/A' },
          {
            field: 'Saving Account Amount',
            details: case_data.saving_account_total_amount ? `₹${case_data.saving_account_total_amount}` : 'N/A',
          },
          { field: 'Saving Interest Rate', details: case_data.interest_rate_saving ? `${case_data.interest_rate_saving}%` : 'N/A' },
          {
            field: 'Recurring Deposit Amount',
            details: case_data.recurring_deposit_total_amount ? `₹${case_data.recurring_deposit_total_amount}` : 'N/A',
          },
          {
            field: 'RD Interest Rate',
            details: case_data.interest_rate_recurring ? `${case_data.interest_rate_recurring}%` : 'N/A',
          },
          {
            field: 'Dnyanrudha Investment',
            details: case_data.dnyanrudha_investment_total_amount ? `₹${case_data.dnyanrudha_investment_total_amount}` : 'N/A',
          },
          { field: 'Dynadhara Rate', details: case_data.dynadhara_rate ? `${case_data.dynadhara_rate}%` : 'N/A' },
          { field: 'Verified', details: case_data.verified ? 'Yes' : 'No' },
        ],
      };

      // Generate case table
      doc.table(caseTable, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow) => {
          doc.font('Helvetica').fontSize(9);
          indexColumn === 0 && doc.font('Helvetica-Bold');
        },
      });

      // Footer for Page 2
      addFooter(2, 2);

      // ===== PAGE 3 - PAYMENT INFORMATION =====
      doc.addPage();
      pageCount = 3;
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#34495e').text('4. PAYMENT INFORMATION');

      doc.moveDown(0.5);

      const paymentTable = {
        headers: [
          { label: 'Field', property: 'field', width: 150, headerColor: '#34495e' },
          { label: 'Details', property: 'details', width: 350, headerColor: '#34495e' },
        ],
        datas: [
          { field: 'Payment Method', details: payment_data.method || 'N/A' },
          { field: 'Payment ID', details: payment_data.payment_id || 'N/A' },
          { field: 'Order ID', details: payment_data.order_id || 'N/A' },
          { field: 'Amount', details: payment_data.amount ? `₹${(payment_data.amount / 100).toFixed(2)}` : 'N/A' },
          { field: 'Amount Due', details: payment_data.amount_due ? `₹${(payment_data.amount_due / 100).toFixed(2)}` : 'N/A' },
          { field: 'Amount Paid', details: payment_data.amount_paid ? `₹${(payment_data.amount_paid / 100).toFixed(2)}` : 'N/A' },
          { field: 'Currency', details: payment_data.currency || 'N/A' },
          { field: 'Status', details: payment_data.status || 'N/A' },
          { field: 'Receipt', details: payment_data.receipt || 'N/A' },
          { field: 'Payment Date', details: payment_data.created_at ? new Date(payment_data.created_at).toLocaleString() : 'N/A' },
        ],
      };

      // Generate payment table
      doc.table(paymentTable, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow) => {
          doc.font('Helvetica').fontSize(9);
          indexColumn === 0 && doc.font('Helvetica-Bold');
        },
      });

      // Footer for Page 3
      addFooter(3, 3);

      // Calculate total pages based on whether we have documents
      let totalPages = 3; // Base pages: 1, 2, 3
      let currentPage = 4;

      // ===== PAGE 4 - DOCUMENTS & EXHIBITS =====
      if (documents && Object.keys(documents).length > 0) {
        doc.addPage();
        pageCount = 4;
        totalPages = 4;
        currentPage = 4;

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#34495e').text('5. DOCUMENTS & EXHIBITS');

        doc.moveDown(0.5);

        // Process each exhibit
        Object.entries(documents).forEach(([exhibitName, exhibitDocs], index) => {
          if (index > 0) doc.moveDown(0.5);

          // Exhibit Header
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text(`${exhibitName.toUpperCase()}`);

          doc.moveDown(0.3);

          if (Array.isArray(exhibitDocs) && exhibitDocs.length > 0) {
            const exhibitTable = {
              headers: [
                { label: 'Document Name', property: 'name', width: 200, headerColor: '#34495e' },
                { label: 'Type', property: 'type', width: 100, headerColor: '#34495e' },
                { label: 'Size', property: 'size', width: 80, headerColor: '#34495e' },
                { label: 'Upload Date', property: 'date', width: 120, headerColor: '#34495e' },
              ],
              datas: exhibitDocs.map((doc, docIndex) => ({
                name: doc.filename || doc.originalname || `Document ${docIndex + 1}`,
                type: getFileType(doc.filename || doc.originalname || ''),
                size: doc.size ? formatFileSize(doc.size) : 'N/A',
                date: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A',
              })),
            };

            doc.table(exhibitTable, {
              prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
              prepareRow: (row, indexColumn, indexRow, rectRow) => {
                doc.font('Helvetica').fontSize(8);
              },
            });
          } else {
            doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d').text('No documents available for this exhibit');
          }
        });

        // Footer for Page 4
        addFooter(4, 4);

        // ===== PAGE 5 - APPLICATION SUMMARY =====
        doc.addPage();
        pageCount = 5;
        totalPages = 5;
        currentPage = 5;

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#34495e').text('6. APPLICATION SUMMARY');

        doc.moveDown(0.5);

        const summaryData = [
          { item: 'Total Exhibits', value: documents ? Object.keys(documents).length : 0 },
          { item: 'Total Documents', value: countTotalDocuments(documents) },
          { item: 'Application Status', value: payment_data.status || 'Pending' },
          { item: 'Verification Status', value: case_data.verified ? 'Verified' : 'Pending Verification' },
          { item: 'Submission Date', value: new Date().toLocaleDateString() },
        ];

        const summaryTable = {
          headers: [
            { label: 'Summary Item', property: 'item', width: 200, headerColor: '#34495e' },
            { label: 'Details', property: 'value', width: 300, headerColor: '#34495e' },
          ],
          datas: summaryData,
        };

        doc.table(summaryTable, {
          prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
          prepareRow: (row, indexColumn, indexRow, rectRow) => {
            doc.font('Helvetica').fontSize(9);
            indexColumn === 0 && doc.font('Helvetica-Bold');
          },
        });

        // Footer for Page 5
        addFooter(5, 5);
      } else {
        // If no documents, add summary to page 4
        doc.addPage();
        pageCount = 4;
        totalPages = 4;
        currentPage = 4;

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#34495e').text('5. APPLICATION SUMMARY');

        doc.moveDown(0.5);

        const summaryData = [
          { item: 'Total Exhibits', value: 0 },
          { item: 'Total Documents', value: 0 },
          { item: 'Application Status', value: payment_data.status || 'Pending' },
          { item: 'Verification Status', value: case_data.verified ? 'Verified' : 'Pending Verification' },
          { item: 'Submission Date', value: new Date().toLocaleDateString() },
        ];

        const summaryTable = {
          headers: [
            { label: 'Summary Item', property: 'item', width: 200, headerColor: '#34495e' },
            { label: 'Details', property: 'value', width: 300, headerColor: '#34495e' },
          ],
          datas: summaryData,
        };

        doc.table(summaryTable, {
          prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
          prepareRow: (row, indexColumn, indexRow, rectRow) => {
            doc.font('Helvetica').fontSize(9);
            indexColumn === 0 && doc.font('Helvetica-Bold');
          },
        });

        // Footer for Page 4
        addFooter(4, 4);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
