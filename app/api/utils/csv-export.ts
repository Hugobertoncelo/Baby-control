import JSZip from "jszip";

export function arrayToCsv(data: any[][]): string {
  return data
    .map((row) =>
      row
        .map(String)
        .map((v) => v.replaceAll('"', '""'))
        .map((v) => `"${v}"`)
        .join(",")
    )
    .join("\r\n");
}

export function objectArrayToCsv(data: any[], headers?: string[]): string {
  if (data.length === 0) return "";
  const csvHeaders = headers || Object.keys(data[0]);
  const headerRow = csvHeaders
    .map(String)
    .map((v) => v.replaceAll('"', '""'))
    .map((v) => `"${v}"`)
    .join(",");
  const dataRows = data.map((row) =>
    csvHeaders
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        return String(value);
      })
      .map((v) => v.replaceAll('"', '""'))
      .map((v) => `"${v}"`)
      .join(",")
  );
  return [headerRow, ...dataRows].join("\r\n");
}

export function createCsvBlob(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  return {
    blob,
    filename,
    size: blob.size,
  };
}

export function sanitizeForCsv(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export async function createDataExport(
  exportData: {
    familyInfo: any;
    babies?: any[];
    caretakers?: any[];
    contacts?: any[];
    sleepLogs?: any[];
    feedLogs?: any[];
    diaperLogs?: any[];
    moodLogs?: any[];
    notes?: any[];
    milestones?: any[];
    pumpLogs?: any[];
    playLogs?: any[];
    bathLogs?: any[];
    measurements?: any[];
    medicines?: any[];
    medicineLogs?: any[];
    calendarEvents?: any[];
    settings?: any;
  },
  familySlug: string
) {
  const zip = new JSZip();
  const exportFiles: { filename: string; size: number }[] = [];
  if (exportData.familyInfo) {
    const content = JSON.stringify(exportData.familyInfo, null, 2);
    zip.file("family-info.json", content);
    exportFiles.push({
      filename: "family-info.json",
      size: content.length,
    });
  }
  const dataTypes = [
    { key: "babies", filename: "babies.csv" },
    { key: "caretakers", filename: "caretakers.csv" },
    { key: "contacts", filename: "contacts.csv" },
    { key: "sleepLogs", filename: "sleep-logs.csv" },
    { key: "feedLogs", filename: "feed-logs.csv" },
    { key: "diaperLogs", filename: "diaper-logs.csv" },
    { key: "moodLogs", filename: "mood-logs.csv" },
    { key: "notes", filename: "notes.csv" },
    { key: "milestones", filename: "milestones.csv" },
    { key: "pumpLogs", filename: "pump-logs.csv" },
    { key: "playLogs", filename: "play-logs.csv" },
    { key: "bathLogs", filename: "bath-logs.csv" },
    { key: "measurements", filename: "measurements.csv" },
    { key: "medicines", filename: "medicines.csv" },
    { key: "medicineLogs", filename: "medicine-logs.csv" },
    { key: "calendarEvents", filename: "calendar-events.csv" },
  ];
  dataTypes.forEach(({ key, filename }) => {
    const data = exportData[key as keyof typeof exportData] as any[];
    if (data && data.length > 0) {
      const csvContent = objectArrayToCsv(data);
      zip.file(filename, csvContent);
      exportFiles.push({
        filename,
        size: csvContent.length,
      });
    }
  });
  if (exportData.settings) {
    const content = JSON.stringify(exportData.settings, null, 2);
    zip.file("settings.json", content);
    exportFiles.push({
      filename: "settings.json",
      size: content.length,
    });
  }
  const manifest = {
    exportDate: new Date().toISOString(),
    familySlug,
    totalFiles: exportFiles.length,
    totalSize: exportFiles.reduce((sum, file) => sum + file.size, 0),
    files: exportFiles,
  };
  const manifestContent = JSON.stringify(manifest, null, 2);
  zip.file("manifest.json", manifestContent);
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return {
    buffer: zipBuffer,
    filename: `${familySlug}-data-export-${
      new Date().toISOString().split("T")[0]
    }.zip`,
    manifest,
    files: exportFiles,
  };
}
