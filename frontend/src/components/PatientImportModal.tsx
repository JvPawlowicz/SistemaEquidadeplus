import { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, Loader2 } from 'lucide-react';
import { fetchInsurances, createPatient } from '../lib/patients';
import {
  downloadTemplate,
  parseImportFile,
  parsedRowToPayload,
  type ParsedRow,
  TEMPLATE_HEADERS,
} from '../lib/patientImport';
import './PatientImportModal.css';

interface PatientImportModalProps {
  unitId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function PatientImportModal({ unitId, onClose, onSaved }: PatientImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [insurances, setInsurances] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetchInsurances().then(({ insurances: list }) => setInsurances(list ?? []));
  }, []);

  const handleDownloadTemplate = () => downloadTemplate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setRows([]);
    setFileErrors([]);
    setResult(null);
    if (!file) return;
    const { rows: parsed, errors } = await parseImportFile(file);
    setRows(parsed);
    setFileErrors(errors);
  };

  const insuranceByName = new Map(insurances.map((i) => [i.name.trim().toLowerCase(), i.id]));

  const handleImport = async () => {
    const valid = rows.filter((r) => r.errors.length === 0);
    if (valid.length === 0) return;
    setImporting(true);
    const errors: string[] = [];
    let created = 0;
    for (const row of valid) {
      const insuranceId = row.insurance_name
        ? insuranceByName.get(row.insurance_name.trim().toLowerCase()) ?? null
        : null;
      const payload = parsedRowToPayload(row, insuranceId);
      const { error } = await createPatient(payload, unitId);
      if (error) errors.push(`Linha ${row.rowIndex} (${row.full_name}): ${error.message}`);
      else created++;
    }
    setResult({ created, failed: valid.length - created, errors });
    setImporting(false);
    if (created > 0) onSaved();
  };

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const hasValid = validCount > 0;

  return (
    <div className="patient-form-overlay patient-import-overlay" onClick={onClose} role="presentation">
      <div className="patient-form-modal patient-import-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="patient-import-title">
        <div className="patient-form-header">
          <h2 id="patient-import-title">Importar pacientes (planilha)</h2>
          <button type="button" className="patient-form-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="patient-import-body">
          <p className="patient-import-intro">
            Todos os pacientes serão cadastrados na <strong>unidade ativa</strong>. Depois você pode habilitá-los em outras unidades no prontuário.
            Coluna de data aceita número (Excel) ou AAAA-MM-DD. Convênio = nome exato em Configurações.
          </p>
          <div className="patient-import-actions">
            <button type="button" className="patient-import-btn patient-import-btn-download" onClick={handleDownloadTemplate}>
              <Download size={18} />
              Baixar modelo da planilha
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="patient-import-file-input" onChange={handleFileChange} aria-label="Selecionar planilha" />
            <button type="button" className="patient-import-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              Selecionar planilha
            </button>
          </div>
          {fileErrors.length > 0 && (
            <ul className="patient-import-file-errors">
              {fileErrors.slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {fileErrors.length > 10 && <li>… e mais {fileErrors.length - 10} avisos.</li>}
            </ul>
          )}
          {rows.length > 0 && (
            <>
              <p className="patient-import-preview-title">Prévia: {rows.length} linha(s), {validCount} válida(s).</p>
              <div className="patient-import-preview-wrap">
                <table className="patient-import-preview">
                  <thead>
                    <tr>
                      <th>#</th>
                      {TEMPLATE_HEADERS.slice(0, 4).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                      <th>Erros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 15).map((row, i) => (
                      <tr key={i} className={row.errors.length ? 'has-error' : ''}>
                        <td>{row.rowIndex}</td>
                        <td>{row.full_name || '—'}</td>
                        <td>{row.birth_date || '—'}</td>
                        <td>{(row.address ?? '').slice(0, 20)}{row.address && row.address.length > 20 ? '…' : ''}</td>
                        <td>{row.insurance_name || '—'}</td>
                        <td>{row.errors.join('; ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 15 && <p className="patient-import-more">… e mais {rows.length - 15} linhas.</p>}
              </div>
              <div className="patient-import-submit">
                <button type="button" className="patient-import-btn patient-import-btn-primary" onClick={handleImport} disabled={!hasValid || importing}>
                  {importing ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Importando…
                    </>
                  ) : (
                    `Importar ${validCount} paciente(s)`
                  )}
                </button>
              </div>
            </>
          )}
          {result && (
            <div className="patient-import-result">
              <p><strong>Concluído.</strong> Criados: {result.created}. Falhas: {result.failed}.</p>
              {result.errors.length > 0 && (
                <ul className="patient-import-file-errors">
                  {result.errors.slice(0, 8).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 8 && <li>… e mais {result.errors.length - 8}.</li>}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
