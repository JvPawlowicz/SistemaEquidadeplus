/**
 * Importação de pacientes via planilha XLS/XLSX.
 * Use o modelo gerado por downloadTemplate() para preencher e importar sem erros.
 */
import * as XLSX from 'xlsx';

/** Colunas do modelo (ordem e nomes exatos para o importador). */
export const TEMPLATE_HEADERS = [
  'Nome',
  'Data Nascimento',
  'Endereço',
  'Documento',
  'Convênio',
  'Resumo',
  'Alertas',
  'Diagnósticos',
  'Medicações',
  'Alergias',
  'Observações',
  'Tags',
] as const;

const TEMPLATE_SHEET = 'Pacientes';

/** Linha de exemplo no modelo (formato da data). */
const EXAMPLE_ROW = [
  'Maria da Silva',
  '2015-03-20',
  'Rua Exemplo, 100',
  '123.456.789-00',
  'Particular',
  '',
  '',
  '',
  '',
  '',
  '',
  'tag1, tag2',
];

/** Gera e faz download do modelo da planilha para importação. */
export function downloadTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS as unknown as string[], EXAMPLE_ROW]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, TEMPLATE_SHEET);
  XLSX.writeFile(wb, 'modelo_importacao_pacientes.xlsx');
}

export interface ParsedRow {
  full_name: string;
  birth_date: string;
  address: string | null;
  document: string | null;
  insurance_name: string | null;
  summary: string | null;
  alerts: string | null;
  diagnoses: string | null;
  medications: string | null;
  allergies: string | null;
  routine_notes: string | null;
  tags: string[] | null;
  rowIndex: number;
  errors: string[];
}

function norm(s: unknown): string {
  if (s == null) return '';
  const t = String(s).trim();
  return t;
}

/** Converte valor da célula (string ou número Excel serial) para data no formato YYYY-MM-DD. Evita "time zone displacement out of range" no Postgres. */
function normDate(s: unknown): string {
  if (s == null) return '';
  if (typeof s === 'number') {
    if (s < 1 || s > 100000) return '';
    const date = excelSerialToDate(s);
    if (!date) return '';
    return date.toISOString().slice(0, 10);
  }
  if (s instanceof Date) {
    if (Number.isNaN(s.getTime())) return '';
    return s.toISOString().slice(0, 10);
  }
  const t = norm(s);
  if (!t) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/** Excel: serial 1 = 1900-01-01. Converte para Date. */
function excelSerialToDate(serial: number): Date | null {
  if (serial < 1) return null;
  const utcMs = (serial - 25569) * 86400 * 1000;
  const d = new Date(utcMs);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Lê um arquivo XLS/XLSX e retorna as linhas mapeadas para o formato do paciente.
 * Valida nome e data; retorna erros por linha.
 */
export function parseImportFile(file: File): Promise<{ rows: ParsedRow[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data || typeof data !== 'object' || !(data instanceof ArrayBuffer)) {
          resolve({ rows: [], errors: ['Arquivo inválido ou vazio.'] });
          return;
        }
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheet = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheet];
        const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
        if (!aoa.length) {
          resolve({ rows: [], errors: ['Planilha vazia.'] });
          return;
        }
        const headerRow = aoa[0].map((c) => norm(c));
        const nameIdx = headerRow.findIndex((h) => /nome/i.test(h));
        const birthIdx = headerRow.findIndex((h) => /data|nascimento/i.test(h));
        const addrIdx = headerRow.findIndex((h) => /endere[cç]o/i.test(h));
        const docIdx = headerRow.findIndex((h) => /documento/i.test(h));
        const insIdx = headerRow.findIndex((h) => /conv[eê]nio/i.test(h));
        const sumIdx = headerRow.findIndex((h) => /resumo/i.test(h));
        const alIdx = headerRow.findIndex((h) => /alerta/i.test(h));
        const diagIdx = headerRow.findIndex((h) => /diagn[oó]stico/i.test(h));
        const medIdx = headerRow.findIndex((h) => /medica[cç]/i.test(h));
        const allIdx = headerRow.findIndex((h) => /alergia/i.test(h));
        const obsIdx = headerRow.findIndex((h) => /observa|c[cç]o|rotina/i.test(h));
        const tagIdx = headerRow.findIndex((h) => /tag/i.test(h));

        const get = (row: string[], i: number) => (i >= 0 && row[i] !== undefined ? norm(row[i]) : '');

        const rows: ParsedRow[] = [];
        const errors: string[] = [];

        for (let i = 1; i < aoa.length; i++) {
          const row = aoa[i];
          if (!Array.isArray(row)) continue;
          const name = get(row, nameIdx);
          const birth = birthIdx >= 0 ? normDate(row[birthIdx]) : '';
          const rowErrors: string[] = [];
          if (!name) rowErrors.push('Nome obrigatório');
          if (!birth) rowErrors.push('Data de nascimento obrigatória (use YYYY-MM-DD)');
          rows.push({
            full_name: name,
            birth_date: birth,
            address: addrIdx >= 0 ? get(row, addrIdx) || null : null,
            document: docIdx >= 0 ? get(row, docIdx) || null : null,
            insurance_name: insIdx >= 0 ? get(row, insIdx) || null : null,
            summary: sumIdx >= 0 ? get(row, sumIdx) || null : null,
            alerts: alIdx >= 0 ? get(row, alIdx) || null : null,
            diagnoses: diagIdx >= 0 ? get(row, diagIdx) || null : null,
            medications: medIdx >= 0 ? get(row, medIdx) || null : null,
            allergies: allIdx >= 0 ? get(row, allIdx) || null : null,
            routine_notes: obsIdx >= 0 ? get(row, obsIdx) || null : null,
            tags: tagIdx >= 0 ? get(row, tagIdx).split(',').map((t) => t.trim()).filter(Boolean) || null : null,
            rowIndex: i + 1,
            errors: rowErrors,
          });
          if (rowErrors.length) errors.push(`Linha ${i + 1}: ${rowErrors.join('; ')}`);
        }

        if (rows.length === 0 && aoa.length > 1) errors.push('Nenhuma linha de dados válida encontrada.');
        resolve({ rows, errors });
      } catch (err) {
        resolve({ rows: [], errors: [err instanceof Error ? err.message : 'Erro ao ler planilha.'] });
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsArrayBuffer(file);
  });
}

/** Converte uma linha parseada em payload para createPatient (insurance_id deve ser resolvido pelo chamador). */
export function parsedRowToPayload(
  row: ParsedRow,
  insuranceId: string | null
): Omit<import('../types').Patient, 'id' | 'created_at' | 'updated_at'> {
  const birthDateOnly = row.birth_date.slice(0, 10);
  return {
    full_name: row.full_name,
    birth_date: birthDateOnly,
    photo_url: null,
    address: row.address,
    document: row.document,
    insurance_id: insuranceId,
    tags: row.tags ?? [],
    summary: row.summary,
    alerts: row.alerts,
    diagnoses: row.diagnoses,
    medications: row.medications,
    allergies: row.allergies,
    routine_notes: row.routine_notes,
  };
}
