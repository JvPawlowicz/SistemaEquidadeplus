/**
 * Gera CSV a partir de array de objetos e dispara download.
 */
export function downloadCsv(
  rows: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; label: string }[]
) {
  if (rows.length === 0) return;
  const keys = columns ? columns.map((c) => c.key) : Object.keys(rows[0] ?? {});
  const headers = columns ? columns.map((c) => c.label) : keys;
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const line = (obj: Record<string, unknown>) =>
    keys.map((k) => escape(obj[k])).join(',');
  const csv = [headers.join(','), ...rows.map((r) => line(r))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
