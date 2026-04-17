import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs-dist
// In a Vite environment, we can use the CDN or a local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const convertPdfToWebP = async (file: File): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1); // Get the first page

  const viewport = page.getViewport({ scale: 2.0 }); // High quality
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await (page as any).render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const newFile = new File([blob], file.name.replace(/\.pdf$/i, '.webp'), {
          type: 'image/webp',
        });
        resolve(newFile);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, 'image/webp', 0.8);
  });
};
