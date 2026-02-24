import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { fetchInsurances, createPatient, updatePatient } from '../lib/patients';
import { fetchCep, formatCep } from '../lib/cep';
import type { Patient } from '../types';
import './PatientFormModal.css';

interface PatientFormModalProps {
  unitId: string;
  initialPatient?: Patient | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PatientFormModal({
  unitId,
  initialPatient,
  onClose,
  onSaved,
}: PatientFormModalProps) {
  const [fullName, setFullName] = useState(initialPatient?.full_name ?? '');
  const [birthDate, setBirthDate] = useState(
    initialPatient?.birth_date ? initialPatient.birth_date.slice(0, 10) : ''
  );
  const [address, setAddress] = useState(initialPatient?.address ?? '');
  const [cepInput, setCepInput] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [document, setDocument] = useState(initialPatient?.document ?? '');
  const [insuranceId, setInsuranceId] = useState(initialPatient?.insurance_id ?? '');
  const [tagsText, setTagsText] = useState((initialPatient?.tags ?? []).join(', '));
  const [insurances, setInsurances] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuscarCep = async () => {
    const digits = cepInput.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepError('Informe um CEP com 8 dígitos.');
      return;
    }
    setCepError(null);
    setCepLoading(true);
    const { data, error: err } = await fetchCep(cepInput);
    setCepLoading(false);
    if (err) {
      setCepError(err);
      return;
    }
    if (data) {
      setAddress(data.formattedAddress);
      setCepInput(formatCep(data.cep));
    }
  };

  useEffect(() => {
    fetchInsurances().then(({ insurances: list }) => setInsurances(list));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    if (!fullName.trim() || !birthDate) {
      setError('Nome completo e data de nascimento são obrigatórios.');
      setSaving(false);
      return;
    }
    const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
    if (initialPatient) {
      const { error: err } = await updatePatient(initialPatient.id, {
        full_name: fullName.trim(),
        birth_date: birthDate,
        document: document.trim() || null,
        address: address || null,
        insurance_id: insuranceId || null,
        tags: tags.length > 0 ? tags : null,
      });
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    } else {
      const { patientId: newId, error: errInsert } = await createPatient(
        {
          full_name: fullName.trim(),
          birth_date: birthDate,
          photo_url: null,
          address: address || null,
          document: document.trim() || null,
          insurance_id: insuranceId || null,
          tags: tags.length > 0 ? tags : null,
          summary: null,
          alerts: null,
          diagnoses: null,
          medications: null,
          allergies: null,
          routine_notes: null,
        },
        unitId
      );
      if (errInsert || !newId) {
        setError(errInsert?.message ?? 'Erro ao criar paciente.');
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="patient-form-overlay" onClick={onClose} role="presentation">
      <div
        className="patient-form-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="patient-form-title"
      >
        <div className="patient-form-header">
          <h2 id="patient-form-title">
            {initialPatient ? 'Editar paciente' : 'Novo paciente'}
          </h2>
          <button type="button" className="patient-form-close" onClick={onClose} aria-label="Fechar">
            <X size={20} aria-hidden />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="patient-form-body">
          {error && <p className="patient-form-error">{error}</p>}
          <section className="patient-form-section">
            <h3 className="patient-form-section-title">Dados pessoais</h3>
            <label className="patient-form-label">
              Nome completo *
              <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="patient-form-input"
              required
            />
          </label>
          <label className="patient-form-label">
            Data de nascimento *
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="patient-form-input"
              required
            />
          </label>
          <label className="patient-form-label">
            Documento (CPF/RG)
            <input
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              className="patient-form-input"
              placeholder="Opcional - para busca"
            />
          </label>
          <label className="patient-form-label">
            Convênio
            <select
              value={insuranceId}
              onChange={(e) => setInsuranceId(e.target.value)}
              className="patient-form-input"
            >
              <option value="">Particular</option>
              {insurances.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          </section>
          <section className="patient-form-section">
            <h3 className="patient-form-section-title">Endereço</h3>
            <label className="patient-form-label">
            CEP
            <div className="patient-form-cep-row">
              <input
                type="text"
                value={cepInput}
                onChange={(e) => { setCepInput(e.target.value.replace(/\D/g, '').slice(0, 8)); setCepError(null); }}
                placeholder="00000000"
                maxLength={9}
                className="patient-form-input patient-form-cep-input"
              />
              <button
                type="button"
                className="patient-form-btn patient-form-btn-cep"
                onClick={handleBuscarCep}
                disabled={cepLoading || cepInput.replace(/\D/g, '').length !== 8}
              >
                {cepLoading ? 'Buscando…' : 'Buscar CEP'}
              </button>
            </div>
            {cepError && <span className="patient-form-cep-error">{cepError}</span>}
          </label>
          <label className="patient-form-label">
            Endereço
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="patient-form-input"
              placeholder="Preencha o CEP para buscar ou digite manualmente"
            />
          </label>
          </section>
          <section className="patient-form-section">
            <h3 className="patient-form-section-title">Outros</h3>
            <label className="patient-form-label">
            Tags (separadas por vírgula)
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="patient-form-input"
              placeholder="Ex: autismo, PCD, alto risco"
            />
          </label>
          </section>
          <div className="patient-form-actions">
            <button type="button" className="patient-form-btn patient-form-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="patient-form-btn patient-form-btn-submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className="patient-form-spinner" aria-hidden />
                  Salvando…
                </>
              ) : initialPatient ? (
                'Salvar'
              ) : (
                'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
