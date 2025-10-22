const puppeteer = require('puppeteer');
const fs = require('fs');
const Handlebars = require('handlebars');

// Helper functions
const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = amount => {
  if (!amount) return '₹0';
  return `₹${parseInt(amount).toLocaleString('en-IN')}`;
};

const formatPercentage = rate => {
  if (!rate) return '0.00%';
  return `${parseFloat(rate).toFixed(2)}%`;
};

const formatFileSize = bytes => {
  if (!bytes) return 'N/A';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

// Amount in words function
const amountToWords = amount => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  let num = parseInt(amount);

  if (num === 0) return 'Zero Rupees';
  if (num === 1) return 'One Rupee Only';

  let words = '';

  // Crores
  if (Math.floor(num / 10000000) > 0) {
    words += amountToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }

  // Lakhs
  if (Math.floor(num / 100000) > 0) {
    words += amountToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }

  // Thousands
  if (Math.floor(num / 1000) > 0) {
    words += amountToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }

  // Hundreds
  if (Math.floor(num / 100) > 0) {
    words += amountToWords(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }

  // Tens and Ones
  if (num > 0) {
    if (words !== '') words += 'and ';

    if (num < 10) {
      words += ones[num];
    } else if (num < 20) {
      words += teens[num - 10];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += ' ' + ones[num % 10];
      }
    }
  }

  return words.trim() + ' Rupees Only';
};

// Professional Legal Document HTML Template with Exhibits Sections
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 0;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            margin: 0;
            padding: 60px 50px;
            color: #000;
            line-height: 1.6;
            font-size: 12px;
            background: #ffffff;
        }
        
        .legal-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .legal-header h2 {
            font-size: 16px;
            margin: 5px 0;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .case-details {
            text-align: center;
            margin: 20px 0;
            font-size: 12px;
        }
        
        .parties {
            margin: 30px 0;
            line-height: 1.8;
        }
        
        .party-line {
            margin: 5px 0;
        }
        
        .index-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
        }
        
        .index-table th, .index-table td {
            border: 1px solid #000;
            padding: 8px 5px;
            text-align: left;
        }
        
        .index-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .signature-section {
            margin-top: 100px;
            text-align: right;
        }
        
        .advocate-name {
            margin-top: 80px;
            text-align: right;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .footer {
            font-size: 9px;
            color: #7f8c8d;
            text-align: center;
            margin-top: 30px;
            border-top: 1px solid #bdc3c7;
            padding-top: 10px;
        }
        
        /* Application Page Styles */
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
            text-transform: uppercase;
        }
        
        .application-content {
            text-align: justify;
            line-height: 1.8;
            margin-bottom: 15px;
        }
        
        .prayer-section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #2c3e50;
        }
        
        /* Fixed Deposit Receipt Styles */
        .fd-receipt {
            border: 2px solid #2c3e50;
            padding: 25px;
            margin: 20px 0;
            background: #ffffff;
            page-break-inside: avoid;
        }
        
        .fd-header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 15px;
        }
        
        .fd-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        
        .fd-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        
        .fd-table th {
            background: #34495e;
            color: white;
            padding: 10px;
            text-align: center;
            border: 1px solid #ddd;
        }
        
        .fd-table td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: center;
        }
        
        .fd-total-row {
            background: #ecf0f1;
            font-weight: bold;
        }
        
        .fd-amount-section {
            background: #f8f9fa;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            border-left: 4px solid #27ae60;
        }
        
        .verification {
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #000;
        }
        
        .affidavit {
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #000;
        }
        
        .vakalatnama {
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #000;
        }
        
        /* Exhibits Styles */
        .exhibit-section {
            margin: 30px 0;
            border: 2px solid #2c3e50;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .exhibit-header {
            background: #2c3e50;
            color: white;
            padding: 15px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
        }
        
        .exhibit-content {
            padding: 20px;
        }
        
        .document-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        
        .document-table th {
            background: #34495e;
            color: white;
            padding: 10px;
            text-align: left;
            border: 1px solid #ddd;
        }
        
        .document-table td {
            padding: 8px;
            border: 1px solid #ddd;
            vertical-align: top;
        }
        
        .document-row:hover {
            background: #f8f9fa;
        }
        
        .document-info {
            margin: 5px 0;
        }
        
        .file-type-badge {
            display: inline-block;
            background: #e74c3c;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 9px;
            margin-right: 5px;
        }
        
        .verified-badge {
            display: inline-block;
            background: #27ae60;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 9px;
        }
    </style>
</head>
<body>
    <!-- Page 1: Index Page -->
    <div class="legal-header">
        <h2>IN THE COURT OF HON'BLE SESSION FOR GREATER</h2>
        <h2>BOMBAY AT, MUMBAI</h2>
        <h2>SPECIAL COURT FOR PMLA CASES</h2>
    </div>
    
    <div class="case-details">
        <strong>CRIMINAL APPLICATION/EXHIBIT NO. ______ OF 2025</strong><br>
        IN <br>
        SPECIAL CASE NO. ______ OF 2025
    </div>
    
    <div class="parties">
        <div class="party-line">
            <strong>{{applicantFullName}}</strong> ……Applicant
        </div>
        
        <div class="party-line" style="text-align: center;">
            <strong>Versus</strong>
        </div>
        
        <div class="party-line">
            <strong>DNYANRADHA MULTISTATE CO-OPERATIVE CREDIT SOCIETY</strong> …ACCUSED
        </div>
        
        <div class="party-line">
            <strong>DIRECTORATE OF ENFORCEMENT</strong> … COMPLAINANT
        </div>
    </div>
    
    <div style="margin-top: 40px;">
        <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">INDEX</h3>
        <table class="index-table">
            <thead>
                <tr>
                    <th style="width: 10%">SR NO</th>
                    <th style="width: 50%">PARTICULARS</th>
                    <th style="width: 20%">EXHIBITS NO</th>
                    <th style="width: 20%">PAGE NO</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>APPLICATION</td>
                    <td></td>
                    <td>2-4</td>
                </tr>
                <tr>
                    <td>2</td>
                    <td>FIXED DEPOSIT RECEIPT & DETAILS</td>
                    <td></td>
                    <td>5</td>
                </tr>
                <tr>
                    <td>3</td>
                    <td>EXHIBIT A - BANK ACCOUNT DOCUMENTS</td>
                    <td>"A"</td>
                    <td>6</td>
                </tr>
                <tr>
                    <td>4</td>
                    <td>EXHIBIT B - INVESTMENT AMOUNT DETAILS</td>
                    <td>"B"</td>
                    <td>7</td>
                </tr>
                <tr>
                    <td>5</td>
                    <td>EXHIBIT C - DEPOSIT PROOF DOCUMENTS</td>
                    <td>"C"</td>
                    <td>8</td>
                </tr>
                <tr>
                    <td>6</td>
                    <td>EXHIBIT D - LEGAL & COMPLIANCE DOCUMENTS</td>
                    <td>"D"</td>
                    <td>9</td>
                </tr>
                <tr>
                    <td>7</td>
                    <td>MEMORANDUM OF ADDRESS</td>
                    <td></td>
                    <td>10</td>
                </tr>
                <tr>
                    <td>8</td>
                    <td>AFFIDAVIT-IN-SUPPORT OF THE APPLICATION</td>
                    <td></td>
                    <td>10</td>
                </tr>
                <tr>
                    <td>9</td>
                    <td>VAKALATNAMA</td>
                    <td></td>
                    <td>11</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <div class="signature-section">
        <div style="display: flex; justify-content: space-between;">
            <div>
                <strong>PLACE:</strong> MUMBAI
            </div>
            <div>
                <strong>DATE:</strong> {{currentDate}}
            </div>
        </div>
    </div>
    
    <div class="advocate-name">
        ADVOCATE FOR THE APPLICANT<br><br>
        _________________________<br>
        (ADVOCATE NAME)
    </div>

    <div class="footer">
        Page 1 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>

    <!-- Page 2-4: Application (Same as before, shortened for brevity) -->
    <div class="page-break"></div>
    <!-- Application content remains the same as previous code -->
    <div class="legal-header">
        <h2>IN THE COURT OF HON'BLE SESSION FOR GREATER</h2>
        <h2>BOMBAY AT, MUMBAI</h2>
        <h2>SPECIAL COURT FOR PMLA CASES</h2>
    </div>
    
    <div class="case-details">
        <strong>CRIMINAL APPLICATION/EXHIBIT NO. ______ OF 2025</strong><br>
        IN <br>
        SPECIAL CASE NO. ______ OF 2025<br>
        IN<br>
        ECIR/MBZO-I/______/2025
    </div>
    
    <div class="parties">
        <div class="party-line">
            <strong>{{applicantFullName}}</strong> ……Applicant
        </div>
        
        <div style="margin: 10px 0;">
            <strong>Address:</strong> {{applicantAddress}}
        </div>
        
        <div class="party-line" style="text-align: center;">
            <strong>Versus</strong>
        </div>
        
        <div class="party-line">
            <strong>DNYANRADHA MULTISTATE CO-OPERATIVE CREDIT SOCIETY</strong> …ACCUSED
        </div>
        
        <div class="party-line">
            <strong>DIRECTORATE OF ENFORCEMENT</strong> … COMPLAINANT
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">APPLICATION UNDER SECTION 8(8) OF THE PREVENTION OF MONEY LAUNDERING ACT, 2002</div>
        <!-- Application content shortened for this example -->
        <div class="application-content">
            <strong>MOST RESPECTFULLY SHOWETH:</strong><br><br>
            1. The Applicant is a law-abiding citizen and is one of the innocent investors who had deposited their hard-earned money in the Dnyanradha Multi State Co-operative Credit Society Ltd.<br><br>
            2. The Applicant has invested an aggregate amount of approximately {{totalDepositAmount}} ({{totalDepositAmountWords}}) which was to be repaid with {{interestRate}} interest.<br><br>
            <!-- ... rest of application content ... -->
        </div>
    </div>

    <div class="footer">
        Page 2 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>

    <!-- Page 5: Fixed Deposit Receipt -->
    <div class="page-break"></div>
    
    <div class="fd-receipt">
        <div class="fd-header">
            <h3>RECEIPT AND FIXED DEPOSIT SUMMARY</h3>
            <div class="fd-info-row">
                <div><strong>Receipt No:</strong> FD-{{savingAccountNumber}}-001</div>
                <div><strong>Date of Issue:</strong> {{currentDate}}</div>
            </div>
        </div>
        
        <!-- Fixed deposit content same as before -->
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <strong>Received with thanks from:</strong> <u>{{applicantFullName}}</u>
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Address:</strong> {{applicantAddress}}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Saving Account Number:</strong> <strong>{{savingAccountNumber}}</strong>
            </div>
            <div>
                <strong>Branch:</strong> {{branchName}}
            </div>
        </div>
        
        <p>A total sum of <strong>Rupees {{totalDepositAmountWords}} ({{totalDepositAmount}})</strong> has been received.</p>
        
        <table class="fd-table">
            <thead>
                <tr>
                    <th>Sr. No.</th>
                    <th>FD Receipt No.</th>
                    <th>Deposit Amount (₹)</th>
                    <th>Deposit Date</th>
                    <th>Maturity Date</th>
                    <th>Maturity Amount (₹)</th>
                </tr>
            </thead>
            <tbody>
                {{#each fixedDeposits}}
                <tr>
                    <td>{{add @index 1}}</td>
                    <td>{{this.fdr_number}}</td>
                    <td>{{this.amount}}</td>
                    <td>{{this.deposit_date}}</td>
                    <td>{{this.maturity_date}}</td>
                    <td>{{this.maturity_amount}}</td>
                </tr>
                {{/each}}
                <tr class="fd-total-row">
                    <td colspan="2"><strong>TOTAL</strong></td>
                    <td><strong>₹{{totalDepositAmount}}</strong></td>
                    <td></td>
                    <td></td>
                    <td><strong>₹{{totalMaturityAmount}}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div class="fd-amount-section">
            <div style="text-align: center;">
                <div style="font-size: 14px; color: #7f8c8d;">Total Maturity Amount Payable</div>
                <div style="font-size: 20px; font-weight: bold; color: #27ae60; margin: 10px 0;">₹{{totalMaturityAmount}}</div>
                <div style="font-size: 12px; color: #7f8c8d;">(In Words: {{totalMaturityAmountWords}})</div>
            </div>
        </div>
    </div>

    <div class="footer">
        Page 5 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>

    <!-- Page 6: EXHIBIT A -->
    <div class="page-break"></div>
    
    <div class="exhibit-section">
        <div class="exhibit-header">EXHIBIT A - BANK ACCOUNT DOCUMENTS</div>
        <div class="exhibit-content">
            <table class="document-table">
                <thead>
                    <tr>
                        <th style="width: 5%">Sr. No.</th>
                        <th style="width: 40%">Document Description</th>
                        <th style="width: 25%">File Details</th>
                        <th style="width: 15%">Upload Date</th>
                        <th style="width: 15%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each exhibitsA}}
                    <tr class="document-row">
                        <td>{{add @index 1}}</td>
                        <td>
                            <strong>{{this.exhibit}}</strong><br>
                            <small>File: {{this.originalName}}</small>
                        </td>
                        <td>
                            <div class="document-info">
                                <span class="file-type-badge">PDF</span>
                                {{formatFileSize this.size}}
                            </div>
                            <div class="document-info">
                                <small>ID: {{this.id}}</small>
                            </div>
                        </td>
                        <td>{{formatDate this.uploadedAt}}</td>
                        <td>
                            <span class="verified-badge">VERIFIED</span>
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <strong>Description:</strong> This exhibit contains all bank account related documents including passbook copies and account opening slips that establish the banking relationship between the applicant and Dnyanradha Multistate Co-operative Credit Society.
            </div>
        </div>
    </div>

    <div class="footer">
        Page 6 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>

    <!-- Page 7: EXHIBIT B -->
    <div class="page-break"></div>
    
    <div class="exhibit-section">
        <div class="exhibit-header">EXHIBIT B - INVESTMENT AMOUNT DETAILS</div>
        <div class="exhibit-content">
            <table class="document-table">
                <thead>
                    <tr>
                        <th style="width: 5%">Sr. No.</th>
                        <th style="width: 40%">Document Description</th>
                        <th style="width: 25%">File Details</th>
                        <th style="width: 15%">Upload Date</th>
                        <th style="width: 15%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each exhibitsB}}
                    <tr class="document-row">
                        <td>{{add @index 1}}</td>
                        <td>
                            <strong>{{this.exhibit}}</strong><br>
                            <small>File: {{this.originalName}}</small>
                        </td>
                        <td>
                            <div class="document-info">
                                <span class="file-type-badge">PDF</span>
                                {{formatFileSize this.size}}
                            </div>
                            <div class="document-info">
                                <small>ID: {{this.id}}</small>
                            </div>
                        </td>
                        <td>{{formatDate this.uploadedAt}}</td>
                        <td>
                            <span class="verified-badge">VERIFIED</span>
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <strong>Description:</strong> This exhibit contains detailed investment records including Fixed Deposit receipts, Saving Account statements, and Recurring Deposit details that prove the total investment amount of ₹7,00,000 made by the applicant.
            </div>
        </div>
    </div>

    <div class="footer">
        Page 7 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>

    <!-- Page 8: EXHIBIT C -->
    <div class="page-break"></div>
    
    <div class="exhibit-section">
        <div class="exhibit-header">EXHIBIT C - DEPOSIT PROOF DOCUMENTS</div>
        <div class="exhibit-content">
            <table class="document-table">
                <thead>
                    <tr>
                        <th style="width: 5%">Sr. No.</th>
                        <th style="width: 40%">Document Description</th>
                        <th style="width: 25%">File Details</th>
                        <th style="width: 15%">Upload Date</th>
                        <th style="width: 15%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each exhibitsC}}
                    <tr class="document-row">
                        <td>{{add @index 1}}</td>
                        <td>
                            <strong>{{this.exhibit}}</strong><br>
                            <small>File: {{this.originalName}}</small>
                        </td>
                        <td>
                            <div class="document-info">
                                <span class="file-type-badge">PDF</span>
                                {{formatFileSize this.size}}
                            </div>
                            <div class="document-info">
                                <small>ID: {{this.id}}</small>
                            </div>
                        </td>
                        <td>{{formatDate this.uploadedAt}}</td>
                        <td>
                            <span class="verified-badge">VERIFIED</span>
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <strong>Description:</strong> This exhibit contains proof of deposits made by the applicant to Dnyanradha Multistate Co-operative Credit Society, establishing the financial transactions and the amount invested.
            </div>
        </div>
    </div>

    <div class="footer">
        Page 8 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>

    <!-- Page 9: EXHIBIT D -->
    <div class="page-break"></div>
    
    <div class="exhibit-section">
        <div class="exhibit-header">EXHIBIT D - LEGAL & COMPLIANCE DOCUMENTS</div>
        <div class="exhibit-content">
            <table class="document-table">
                <thead>
                    <tr>
                        <th style="width: 5%">Sr. No.</th>
                        <th style="width: 40%">Document Description</th>
                        <th style="width: 25%">File Details</th>
                        <th style="width: 15%">Upload Date</th>
                        <th style="width: 15%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each exhibitsD}}
                    <tr class="document-row">
                        <td>{{add @index 1}}</td>
                        <td>
                            <strong>{{this.exhibit}}</strong><br>
                            <small>File: {{this.originalName}}</small>
                        </td>
                        <td>
                            <div class="document-info">
                                <span class="file-type-badge">PDF</span>
                                {{formatFileSize this.size}}
                            </div>
                            <div class="document-info">
                                <small>ID: {{this.id}}</small>
                            </div>
                        </td>
                        <td>{{formatDate this.uploadedAt}}</td>
                        <td>
                            <span class="verified-badge">VERIFIED</span>
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <strong>Description:</strong> This exhibit contains the statement submitted to Shrirampur Police Station under Section 161 of CrPC, which forms the legal basis for the current application and establishes the criminal complaint against the accused society.
            </div>
        </div>
    </div>

    <div class="footer">
        Page 9 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>

    <!-- Page 10: Additional Documents (Memorandum & Affidavit) -->
    <div class="page-break"></div>
    
    <div class="section">
        <div class="section-title">MEMORANDUM OF ADDRESS</div>
        <div style="padding: 20px; border: 1px solid #000;">
            <strong>{{applicantFullName}}</strong><br>
            {{applicantAddress}}<br>
            Mobile No: {{phoneNumber}}<br>
            Email: {{email}}
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">AFFIDAVIT-IN-SUPPORT OF THE APPLICATION</div>
        <div class="affidavit">
            I, {{applicantFullName}}, aged about {{age}} years, Indian Inhabitant, residing at {{applicantAddress}}, the Applicant abovenamed, do hereby solemnly declare that what is stated in the foregoing Application is true to my own knowledge and I believe the same to be true.<br><br>
            Solemnly declared at Mumbai on this {{currentDate}}
        </div>
    </div>

    <div class="footer">
        Page 10 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>

    <!-- Page 11: Vakalatnama -->
    <div class="page-break"></div>
    
    <div class="section">
        <div class="section-title">VAKALATNAMA</div>
        <div class="vakalatnama">
            I, {{applicantFullName}}, aged about {{age}} years, Indian Inhabitant, residing at {{applicantAddress}}, the Applicant abovenamed, do hereby appoint [Advocate Name], Advocate, to act, plead and appear on my behalf in the above matter.<br><br>
            In witness whereof, I have set my hands to this writing on this {{currentDate}}
        </div>
        
        <div style="margin-top: 100px; display: flex; justify-content: space-between;">
            <div>
                _________________________<br>
                <strong>{{applicantFullName}}</strong><br>
                (Applicant)
            </div>
            
            <div style="text-align: right;">
                _________________________<br>
                <strong>[ADVOCATE NAME]</strong><br>
                Advocate for the Applicant<br>
                [Office Address]<br>
                [Contact Details]
            </div>
        </div>
    </div>

    <div class="footer">
        Page 11 of {{totalPages}} | Generated on: {{generatedDate}}
    </div>
</body>
</html>
`;

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatCurrency', formatCurrency);
Handlebars.registerHelper('formatPercentage', formatPercentage);
Handlebars.registerHelper('formatFileSize', formatFileSize);
Handlebars.registerHelper('add', (a, b) => a + b);

const generateApplicationPDF = async (user_data, case_data, payment_data, documents, fixed_deposits) => {
  try {
    // Prepare data for template
    const exhibitsData = documents;

    const templateData = {
      // Applicant Information
      applicantFullName: user_data.full_name,
      applicantAddress: user_data.address,
      phoneNumber: user_data.phone_number,
      email: user_data.email,
      age: user_data.age,

      // Case Information
      accountStartDate: formatDate(case_data.saving_account_start_date),
      totalDepositAmount: formatCurrency(case_data.fixed_deposit_total_amount),
      totalDepositAmountWords: amountToWords(case_data.fixed_deposit_total_amount),
      totalMaturityAmount: formatCurrency(case_data.saving_account_total_amount),
      totalMaturityAmountWords: amountToWords(case_data.saving_account_total_amount),
      interestRate: formatPercentage(case_data.interest_rate_fd),

      // Bank Information
      savingAccountNumber: case_data.saving_account_number,
      branchName: case_data.branch,

      // Fixed Deposits
      fixedDeposits: fixed_deposits,

      // Exhibits Data
      exhibitsA: exhibitsData['Exhibit A'],
      exhibitsB: exhibitsData['Exhibit B'],
      exhibitsC: exhibitsData['Exhibit C'],
      exhibitsD: exhibitsData['Exhibit D'],

      // Dates
      currentDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      generatedDate: new Date().toLocaleString(),

      // Page Information
      totalPages: 11,
    };

    // Compile template
    const template = Handlebars.compile(htmlTemplate);
    const htmlContent = template(templateData);

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '40px',
        right: '40px',
        bottom: '40px',
        left: '40px',
      },
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Test function
const testPDFGeneration = async () => {
  try {
    const pdfBuffer = await generateApplicationPDF();
    fs.writeFileSync('court_application_with_exhibits.pdf', pdfBuffer);
    console.log('Court Application PDF with exhibits generated successfully: court_application_with_exhibits.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

// Run the test
// testPDFGeneration();

// Export for use in other files
module.exports = { generateApplicationPDF };
