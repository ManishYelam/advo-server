const PDFDocument = require('pdfkit');
const fs = require('fs');
require('pdfkit-table'); // Extends doc with .table()

const generateCourtApplicationPDF = (formData = {}, outputPath = 'Court_Application.pdf') => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const exhibits = formData.exhibits || [];

  // ------------------ PAGE 1: COURT HEADER + INDEX TABLE ------------------
  doc.font('Times-Roman').fontSize(12);
  doc.text("IN THE COURT OF HON'BLE SESSION FOR GREATER BOMBAY AT, MUMBAI", { align: 'center' });
  doc.text("SPECIAL COURT FOR PMLA CASES", { align: 'center' });
  doc.text("CRIMINAL APPLICATION/EXHIBIT NO. ____ OF 2025", { align: 'center' });
  doc.text("IN SPECIAL CASE NO. ____ OF 2025", { align: 'center' });
  doc.text("IN", { align: 'center' });
  doc.text("ECIR/MBZO-1//2025", { align: 'center' });

  doc.moveDown(2);
  doc.text(`${formData.applicantName || "Applicant"} ….. Applicant`);
  doc.text("VERSUS");
  doc.text("DYANDHARA MULTISTATE CO-OPERATIVE CREDIT SOCIETY ….. Accused");
  doc.text("DIRECTORATE OF ENFORCEMENT ….. Complainant");

  doc.moveDown(2);
  doc.fontSize(14).text("INDEX", { align: 'center', underline: true });
  doc.moveDown();

  const table = {
    headers: [
      { label: "SR. No.", property: "sr", width: 50, align: "center" },
      { label: "PARTICULARS", property: "particulars", width: 250 },
      { label: "EXHIBIT No.", property: "exhibit", width: 100, align: "center" },
      { label: "PAGE No.", property: "page", width: 80, align: "center" },
    ],
    datas: exhibits.map((ex, i) => ({
      sr: i + 1,
      particulars: ex.description || "No description",
      exhibit: ex.title || `Exhibit ${i + 1}`,
      page: "", // Leave blank; can be filled later if you want page numbers
    })),
  };

  doc.table(table, {
    prepareHeader: () => doc.font('Times-Bold').fontSize(12),
    prepareRow: (row, i) => doc.font('Times-Roman').fontSize(11),
  });

  doc.moveDown(2);
  doc.fontSize(12);
  doc.text("Place: Mumbai");
  doc.text(`Date: ${new Date().toLocaleDateString()}`);

  doc.moveDown(4);
  doc.text("_________________________", { align: "right" });
  doc.text("Advocate for the Applicant", { align: "right" });

  // ------------------ PAGE 2: APPLICANT INFO ------------------
  doc.addPage();
  doc.fontSize(14).text("APPLICATION DETAILS", { align: "center", underline: true });
  doc.moveDown(2);
  doc.fontSize(12);

  const fields = [
    { label: "Full Name", value: formData.name },
    { label: "Age", value: formData.age },
    { label: "Gender", value: formData.gender },
    { label: "Contact", value: formData.phone_number },
    { label: "Email", value: formData.email },
    { label: "Address", value: formData.address },
    { label: "Notes", value: formData.notes },
  ];

  fields.forEach(f => {
    doc.text(`${f.label}: ${f.value || ""}`);
  });

  doc.moveDown();
  doc.text("I hereby affirm that the above information is true and correct to the best of my knowledge.", {
    italic: true,
  });

  doc.moveDown(4);
  doc.text("_________________________", { align: "right" });
  doc.text("Signature of Applicant", { align: "right" });

  // ------------------ PAGE 3+: ONE PAGE PER EXHIBIT ------------------
  exhibits.forEach((ex) => {
    doc.addPage();
    doc.fontSize(14).text(ex.title || "Exhibit", { align: "center", underline: true });
    doc.moveDown();
    doc.fontSize(12).text(ex.description || "No description provided.");
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

// ------------------ USAGE EXAMPLE ------------------

const formData = {
  applicantName: "Amit Desai",
  name: "Amit Desai",
  age: "45",
  gender: "Male",
  phone_number: "9876543210",
  email: "amit@example.com",
  address: "123 Legal Street, Mumbai",
  notes: "Filed under urgency",
  exhibits: [
    { title: "Exhibit A", description: "Application form submitted by applicant." },
    { title: "Exhibit B", description: "Proof of Identity attached by the applicant." },
    { title: "Exhibit C", description: "Bank statement of last 6 months." },
  ],
};

generateCourtApplicationPDF(formData, "Court_Application.pdf")
  .then((path) => console.log(`✅ PDF saved at: ${path}`))
  .catch(console.error);
