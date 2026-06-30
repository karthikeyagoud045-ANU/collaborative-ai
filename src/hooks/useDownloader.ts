"use client";

import { useCallback } from "react";

/**
 * Download the entire codebase as a ZIP file
 * Uses JSZip loaded from CDN to create the zip in-browser
 */
export function useCodebaseDownloader() {
  const downloadCodebase = useCallback(async (files: Map<string, string>, projectName = "project") => {
    // Dynamically load JSZip from CDN
    const loadJSZip = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        if ((window as any).JSZip) {
          resolve((window as any).JSZip);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = () => reject(new Error("Failed to load JSZip"));
        document.head.appendChild(script);
      });
    };

    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();

      // Add all files to the zip
      files.forEach((content, path) => {
        zip.file(path, content);
      });

      // Generate the zip file
      const blob = await zip.generateAsync({ type: "blob" });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: download as individual files
      downloadAsIndividualFiles(files);
    }
  }, []);

  const downloadAsIndividualFiles = (files: Map<string, string>) => {
    files.forEach((content, path) => {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = path.split("/").pop() || "file.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const downloadSingleFile = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return { downloadCodebase, downloadSingleFile };
}
