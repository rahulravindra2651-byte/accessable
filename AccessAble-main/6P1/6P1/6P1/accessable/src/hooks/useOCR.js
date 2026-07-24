import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { getDocument } from 'pdfjs-dist';

export const useOCR = (language = 'eng') => {
  const [loading, setLoading] = useState(false);

  const renderPdfToImage = async (pdfFile) => {
    const buffer = await pdfFile.arrayBuffer();
    const loadingTask = getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  };

  const scanImage = async (file) => {
    if (!file) {
      throw new Error('No file selected for OCR.');
    }

    const isImage = file.type && file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      throw new Error('Only image and PDF files are supported for OCR.');
    }

    setLoading(true);
    const source = isPdf ? await renderPdfToImage(file) : URL.createObjectURL(file);
    try {
      const { data } = await Tesseract.recognize(source, language, {
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      });
      return data?.text?.trim() || '';
    } finally {
      if (!isPdf) {
        URL.revokeObjectURL(source);
      }
      setLoading(false);
    }
  };

  return { scanImage, loading };
};
