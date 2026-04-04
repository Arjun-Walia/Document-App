import fs from 'fs';

export async function extractPdfText(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  // Use the main pdf.js build for Node.js compatibility
  const pdfjsLib = await import('pdfjs-dist');
  // Try to avoid workers in Node context
  const loadingTask = pdfjsLib.getDocument({ data, useWorker: false });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}
