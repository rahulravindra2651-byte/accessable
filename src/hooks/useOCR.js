import { useState } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker source for browser execution
if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

export const useOCR = (language = 'eng') => {
  const [loading, setLoading] = useState(false);

  /**
   * Renders all pages of a PDF document to Data URLs for OCR extraction.
   * @param {File} pdfFile
   * @returns {Promise<string[]>} Array of base64 PNG data URLs (one per page)
   */
  const renderPdfToImages = async (pdfFile) => {
    const buffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    console.log(`📄 [PDF Parser] Document loaded. Total pages: ${pdf.numPages}`);

    const pageImages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      pageImages.push(canvas.toDataURL('image/png'));
    }

    return pageImages;
  };

  const scanImage = async (file) => {
    if (!file) {
      throw new Error('No file selected for OCR.');
    }

    const isImage = file.type && file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));

    if (!isImage && !isPdf) {
      throw new Error('Only image and PDF files are supported for OCR.');
    }

    setLoading(true);
    console.log(`🔍 [2. OCR Extraction] Processing ${isPdf ? 'PDF document' : 'Image file'}: ${file.name} | Size: ${file.size} bytes | Target OCR Lang: ${language}`);

    try {
      if (isPdf) {
        const pageImages = await renderPdfToImages(file);
        const extractedPageTexts = [];

        for (let idx = 0; idx < pageImages.length; idx++) {
          console.log(`🔍 [OCR] Scanning PDF Page ${idx + 1}/${pageImages.length} with lang '${language}'...`);
          const { data } = await Tesseract.recognize(pageImages[idx], language, {
            langPath: 'https://tessdata.projectnaptha.com/4.0.0',
          });
          const text = data?.text?.trim() || '';
          if (text) {
            extractedPageTexts.push(text);
          }
        }

        const fullText = extractedPageTexts.join('\n\n');
        console.log(`🔍 [2. OCR Extraction Complete] Total pages scanned: ${pageImages.length} | Extracted length: ${fullText.length} chars`);
        return fullText;
      } else {
        const objectUrl = URL.createObjectURL(file);
        try {
          const { data } = await Tesseract.recognize(objectUrl, language, {
            langPath: 'https://tessdata.projectnaptha.com/4.0.0',
          });
          const text = data?.text?.trim() || '';
          console.log(`🔍 [2. OCR Extraction Complete] Single image scanned | Extracted length: ${text.length} chars`);
          return text;
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return { scanImage, loading };
};
