/**
 * csv.ts — CSV Export/Import Utility
 *
 * GATE: CSV Formula Injection Koruması
 * =, +, -, @ ile başlayan hücre değerleri escape edilir.
 * Excel'de formül olarak yorumlanmasını engeller.
 *
 * Sprint 2E CSV Import Limitleri:
 * - Dosya boyutu: max 2MB
 * - Satır sayısı: max 5000
 * - Zorunlu alan yoksa satır reddedilir + raporlanır
 * - Aşırı uzun alanlar (>500) reddedilir + raporlanır
 */

// ==========================================
// SANITIZE — CSV Formula Injection Protection
// ==========================================

/**
 * Tehlikeli karakterlerle başlayan hücre değerlerini escape eder.
 * Excel, =+\-@ ile başlayan hücreleri formül olarak yorumlar.
 * Bu fonksiyon başına tek tırnak (') ekleyerek bunu engeller.
 */
export function sanitizeCSVCell(value: unknown): string {
  const str = String(value ?? "");
  // =, +, -, @, tab, CR ile başlayan değerleri escape et
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

// ==========================================
// EXPORT
// ==========================================

interface ExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * CSV dosyası oluşturup indirir.
 * Tüm hücre değerleri sanitizeCSVCell ile korunur.
 */
export function exportCSV({ filename, headers, rows }: ExportOptions): void {
  const csvContent = [
    headers.map(sanitizeCSVCell).join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const sanitized = sanitizeCSVCell(cell);
          // Virgül, tırnak veya yeni satır içeren değerleri tırnak içine al
          if (/[",\n\r]/.test(sanitized)) {
            return `"${sanitized.replace(/"/g, '""')}"`;
          }
          return sanitized;
        })
        .join(",")
    ),
  ].join("\n");

  // BOM (Byte Order Mark) ekle — Türkçe karakter desteği (Excel)
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// IMPORT
// ==========================================

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_ROWS = 5000;
const MAX_FIELD_LENGTH = 500;

interface ImportResult {
  success: boolean;
  data: Record<string, string>[];
  errors: string[];
  warnings: string[];
}

/**
 * CSV dosyasını parse eder ve doğrular.
 * Zorunlu alanlar, boyut limitleri ve alan uzunlukları kontrol edilir.
 */
export function parseCSV(
  content: string,
  fileSize: number,
  requiredFields: string[] = []
): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: Record<string, string>[] = [];

  // Dosya boyutu kontrolü
  if (fileSize > MAX_FILE_SIZE) {
    errors.push(`Dosya boyutu 2MB'dan büyük (${(fileSize / 1024 / 1024).toFixed(1)}MB). Reddedildi.`);
    return { success: false, data: [], errors, warnings };
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    errors.push("CSV dosyası boş veya sadece başlık satırı içeriyor.");
    return { success: false, data: [], errors, warnings };
  }

  // Satır sayısı kontrolü (başlık hariç)
  if (lines.length - 1 > MAX_ROWS) {
    errors.push(`Satır sayısı ${MAX_ROWS}'den fazla (${lines.length - 1} satır). Reddedildi.`);
    return { success: false, data: [], errors, warnings };
  }

  // Başlık satırı
  const headers = parseCSVLine(lines[0]);

  // Zorunlu alan kontrolü
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      errors.push(`Zorunlu alan eksik: "${field}"`);
    }
  }

  if (errors.length > 0) {
    return { success: false, data: [], errors, warnings };
  }

  // Veri satırları
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    let rowValid = true;

    for (let j = 0; j < headers.length; j++) {
      const value = values[j] || "";

      // Aşırı uzun alan kontrolü
      if (value.length > MAX_FIELD_LENGTH) {
        warnings.push(`Satır ${i + 1}, "${headers[j]}": ${value.length} karakter (max ${MAX_FIELD_LENGTH}). Kırpıldı.`);
        row[headers[j]] = value.slice(0, MAX_FIELD_LENGTH);
      } else {
        row[headers[j]] = value;
      }
    }

    // Zorunlu alan değeri kontrolü
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === "") {
        warnings.push(`Satır ${i + 1}: Zorunlu alan "${field}" boş. Satır atlandı.`);
        rowValid = false;
        break;
      }
    }

    if (rowValid) {
      data.push(row);
    }
  }

  return {
    success: errors.length === 0,
    data,
    errors,
    warnings,
  };
}

/**
 * Tek bir CSV satırını parse eder (virgül + tırnak desteği)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}
