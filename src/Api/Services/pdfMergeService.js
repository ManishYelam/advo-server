const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../..', 'UPLOAD_DIR');

class PDFMergeService {
  constructor() {
    this.mergeQueue = new Map(); // Store merge jobs
  }

  // Add files to merge queue for a user
  async addToMergeQueue(userId, filesToMerge) {
    try {
      // console.log(`📄 Adding ${filesToMerge.length} files to merge queue for user ${userId}`);

      this.mergeQueue.set(userId, {
        files: filesToMerge,
        status: 'pending',
        createdAt: new Date(),
        attempts: 0,
      });

      return { success: true, message: 'Files added to merge queue' };
    } catch (error) {
      // console.error('❌ Error adding to merge queue:', error);
      throw error;
    }
  }

  // Merge PDFs for a user
  async mergeUserPDFs(userId) {
    const job = this.mergeQueue.get(userId);
    if (!job || job.status === 'completed') {
      return { success: false, message: 'No pending merge job found' };
    }

    try {
      // console.log(`🔄 Starting PDF merge for user ${userId}`);

      job.status = 'processing';
      job.attempts += 1;

      const mergedPdf = await PDFDocument.create();
      const mergedFilePaths = [];
      let totalPages = 0;

      // Sort files by type for better organization
      const sortedFiles = job.files.sort((a, b) => {
        const typeOrder = {
          court_document: 1,
          application_form: 2,
          exhibit: 3,
        };
        return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
      });

      for (const fileInfo of sortedFiles) {
        try {
          // console.log(`  📑 Processing: ${fileInfo.filePath}`);

          if (!fsSync.existsSync(fileInfo.filePath)) {
            // console.warn(`  ⚠️ File not found: ${fileInfo.filePath}`);
            continue;
          }

          const fileBuffer = await fs.readFile(fileInfo.filePath);
          const pdfDoc = await PDFDocument.load(fileBuffer);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

          pages.forEach(page => mergedPdf.addPage(page));
          totalPages += pdfDoc.getPageCount();

          mergedFilePaths.push(fileInfo.filePath);
          // console.log(`  ✅ Added: ${path.basename(fileInfo.filePath)} (${pdfDoc.getPageCount()} pages)`);
        } catch (fileError) {
          // console.error(`  ❌ Error processing ${fileInfo.filePath}:`, fileError.message);
          // Continue with other files even if one fails
        }
      }

      if (totalPages === 0) {
        throw new Error('No valid PDF pages to merge');
      }

      // Save merged PDF
      const mergedPdfBuffer = await mergedPdf.save();
      const userFolder = path.dirname(job.files[0]?.filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const mergedFileName = `merged_court_document_${userId}_${timestamp}.pdf`;
      const mergedFilePath = path.join(userFolder, mergedFileName);

      await fs.writeFile(mergedFilePath, mergedPdfBuffer);

      // Update job status
      job.status = 'completed';
      job.mergedFilePath = mergedFilePath;
      job.mergedAt = new Date();
      job.totalPages = totalPages;
      job.mergedFilesCount = mergedFilePaths.length;

      // console.log(`✅ PDF merge completed for user ${userId}`);
      // console.log(`   📊 Merged ${job.mergedFilesCount} files into ${totalPages} pages`);
      // console.log(`   💾 Saved merged PDF to: ${mergedFilePath}`);

      return {
        success: true,
        mergedFilePath,
        totalPages,
        mergedFilesCount: job.mergedFilesCount,
        fileSize: mergedPdfBuffer.length,
      };
    } catch (error) {
      // console.error(`❌ PDF merge failed for user ${userId}:`, error);
      job.status = 'failed';
      job.error = error.message;
      throw error;
    }
  }

  // Clean up ONLY the temp_documents folder after merge
  async cleanupTempDocuments(userId) {
    try {
      const userFolder = path.join(UPLOAD_DIR, userId.toString());
      let deletedCount = 0;

      if (fsSync.existsSync(userFolder)) {
        // console.log(`🧹 Cleaning up ONLY temp_documents folder for user ${userId}`);

        // ✅ ONLY delete the temp_documents directory (no individual files)
        const tempDocsFolder = path.join(userFolder, 'temp_documents');
        if (fsSync.existsSync(tempDocsFolder)) {
          // console.log(`  🗑️ Deleting temp_documents folder: ${tempDocsFolder}`);
          fsSync.rmSync(tempDocsFolder, { recursive: true, force: true });
          deletedCount++;
          // console.log(`  ✅ Successfully deleted temp_documents directory`);
        } else {
          // console.log(`  ℹ️ temp_documents folder not found for user ${userId}`);
        }

        // Preserve all other files
      } else {
        // console.log(`ℹ️ User folder not found: ${userFolder}`);
      }

      return {
        success: true,
        deletedCount,
        message: deletedCount > 0 ? 'temp_documents folder cleaned up' : 'No temp_documents folder found',
      };
    } catch (error) {
      // console.error('❌ Error cleaning up temp_documents:', error);
      return { success: false, error: error.message };
    }
  }

  // Get job status
  getJobStatus(userId) {
    const job = this.mergeQueue.get(userId);
    return job || null;
  }

  // Clean up old jobs (for maintenance)
  cleanupOldJobs(maxAgeHours = 24) {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

    for (const [userId, job] of this.mergeQueue.entries()) {
      const jobAge = now - job.createdAt;
      if (jobAge > maxAge) {
        // console.log(`🧹 Removing old job for user ${userId} (age: ${Math.round(jobAge / 3600000)}h)`);
        this.mergeQueue.delete(userId);
      }
    }
  }
}

module.exports = new PDFMergeService();
