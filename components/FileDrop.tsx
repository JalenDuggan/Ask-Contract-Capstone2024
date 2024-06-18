import { DragEvent, useState } from "react";
import PDFDisplay from "./PDFDisplay";
import axios from "axios"; // Import axios for making HTTP requests

export function FileDrop() {
  const [isOver, setIsOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // Define the event handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);

    // Fetch the files
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);

    // Send each file to the server for storage
    for (const file of droppedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Make an HTTP POST request to the server endpoint for file upload
        await axios.post("http://localhost:8080/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log(`File "${file.name}" uploaded successfully.`);
      } catch (error) {
        console.error(`Error uploading file "${file.name}":`, error);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "700px",
        width: "500px",
        border: "1px",
        backgroundColor: isOver ? "lightgray" : "black",
        marginTop: 50,
        marginLeft: 200,
        position: "fixed",
        zIndex: 2,
      }}
    >
      <PDFDisplay file={files.length > 0 ? files[0] : null} />
    </div>
  );
}
