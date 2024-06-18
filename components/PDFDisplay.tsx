import React, { useEffect, useState } from "react";

interface PDFDisplayProps {
  file: File | null;
}

const PDFDisplay: React.FC<PDFDisplayProps> = ({ file }) => {
  const [pdfData, setPdfData] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPdfData(reader.result as string);
      };

      reader.onerror = () => {
        console.error("There was an issue reading the PDF file.");
      };

      reader.readAsDataURL(file);
    } else {
      setPdfData(null);
    }
  }, [file]);

  return (
    <div style={{ backgroundColor: "darkgrey", width: "700px", height: "800px", display: "flex", justifyContent: "center", alignItems: "center" }}>
      {pdfData ? (
        <embed
          src={pdfData}
          type="application/pdf"
          width="300%"
          height="100%"
        />
      ) : (
        <p>Drag and Drop PDF</p>
      )}
    </div>
  );
};

export default PDFDisplay;