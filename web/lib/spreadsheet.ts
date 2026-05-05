import * as XLSX from 'xlsx';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, dateNF: 'yyyy-mm-dd' });

  if (raw.length < 2) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const headers = (raw[0] as unknown[]).map((h) => String(h).trim()).filter(Boolean);
  const rows = raw.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      const val = (row as unknown[])[i];
      if (val instanceof Date) {
        obj[h] = val.toISOString().slice(0, 10);
      } else {
        obj[h] = String(val ?? '').trim();
      }
    });
    return obj;
  });

  return { headers, rows, rowCount: rows.length };
}

export function getSampleValues(rows: Record<string, string>[], header: string, n = 2): string[] {
  return rows
    .slice(0, 10)
    .map((r) => r[header])
    .filter(Boolean)
    .slice(0, n);
}

const FIELD_ALIASES: Record<string, string[]> = {
  fullname: ['name', 'full name', 'fullname', 'contact name', 'contact', 'full_name'],
  location: ['city', 'location', 'place', 'address', 'town', 'state', 'country'],
  userbio: ['notes', 'bio', 'description', 'about', 'memo', 'comment', 'comments'],
  metthrough: ['how met', 'met through', 'source', 'introduced by', 'referral', 'origin', 'how_met', 'met_through'],
  lastcontact: ['last contact', 'date met', 'date', 'last seen', 'last_contact', 'contact date', 'date added'],
  tags: ['tags', 'category', 'categories', 'label', 'labels', 'type', 'group', 'groups', 'tag'],
};

export function autoDetectMapping(headers: string[]): {
  fullname: string;
  location: string;
  userbio: string;
  metthrough: string;
  lastcontact: string;
  tags: string[];
} {
  const lower = headers.map((h) => h.toLowerCase());

  function findMatch(field: string): string {
    for (const alias of FIELD_ALIASES[field]) {
      const idx = lower.findIndex((h) => h === alias || h.includes(alias));
      if (idx !== -1) return headers[idx];
    }
    return '';
  }

  const tagMatch = findMatch('tags');
  return {
    fullname: findMatch('fullname'),
    location: findMatch('location'),
    userbio: findMatch('userbio'),
    metthrough: findMatch('metthrough'),
    lastcontact: findMatch('lastcontact'),
    tags: tagMatch ? [tagMatch] : [],
  };
}
