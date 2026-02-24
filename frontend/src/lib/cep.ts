/**
 * Integração com a Brasil API - CEP v2
 * @see https://brasilapi.com.br/docs#tag/CEP-V2
 * GET https://brasilapi.com.br/api/cep/v2/{cep}
 */

const BASE_URL = 'https://brasilapi.com.br/api/cep/v2';

export interface CepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service?: string;
  location?: {
    type: string;
    coordinates: { longitude: string; latitude: string };
  };
}

export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  /** Endereço formatado para preencher campo único (ex.: "Rua X, 123 - Bairro, Cidade - UF") */
  formattedAddress: string;
}

/**
 * Busca endereço por CEP na Brasil API (v2).
 * CEP pode ser com ou sem hífen (8 dígitos).
 */
export async function fetchCep(cep: string): Promise<{ data: CepResult | null; error: string | null }> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) {
    return { data: null, error: 'CEP deve ter 8 dígitos.' };
  }
  try {
    const res = await fetch(`${BASE_URL}/${digits}`);
    if (!res.ok) {
      if (res.status === 404) return { data: null, error: 'CEP não encontrado.' };
      return { data: null, error: 'Erro ao buscar CEP. Tente novamente.' };
    }
    const body = (await res.json()) as CepResponse;
    const parts: string[] = [];
    if (body.street) parts.push(body.street);
    if (body.neighborhood) parts.push(body.neighborhood);
    if (body.city && body.state) parts.push(`${body.city} - ${body.state}`);
    const formattedAddress = parts.join(', ');
    return {
      data: {
        street: body.street ?? '',
        neighborhood: body.neighborhood ?? '',
        city: body.city ?? '',
        state: body.state ?? '',
        cep: body.cep ?? digits,
        formattedAddress: formattedAddress || body.cep || digits,
      },
      error: null,
    };
  } catch {
    return { data: null, error: 'Falha na conexão. Verifique o CEP e tente novamente.' };
  }
}

/**
 * Formata CEP para exibição (00000-000).
 */
export function formatCep(cep: string): string {
  const d = cep.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Fusos horários IANA por UF (Brasil). Usado para preencher timezone da unidade a partir do CEP. */
const UF_TO_TIMEZONE: Record<string, string> = {
  AC: 'America/Rio_Branco',   // Acre (-5)
  AM: 'America/Manaus',       // Amazonas (-4)
  RR: 'America/Manaus',       // Roraima
  RO: 'America/Porto_Velho',  // Rondônia (-4)
  MT: 'America/Cuiaba',       // Mato Grosso (-4)
  MS: 'America/Cuiaba',       // Mato Grosso do Sul (-4)
  DF: 'America/Sao_Paulo',    // Distrito Federal (-3)
  GO: 'America/Sao_Paulo',
  TO: 'America/Araguaina',    // Tocantins (-3)
  PA: 'America/Belem',        // Pará (-3)
  AP: 'America/Belem',       // Amapá
  MA: 'America/Fortaleza',    // Maranhão (-3)
  PI: 'America/Fortaleza',
  CE: 'America/Fortaleza',
  RN: 'America/Fortaleza',
  PB: 'America/Fortaleza',
  PE: 'America/Sao_Paulo',    // Pernambuco (-3) — Noronha seria America/Noronha
  AL: 'America/Sao_Paulo',
  SE: 'America/Sao_Paulo',
  BA: 'America/Sao_Paulo',
  ES: 'America/Sao_Paulo',
  MG: 'America/Sao_Paulo',
  RJ: 'America/Sao_Paulo',
  SP: 'America/Sao_Paulo',
  PR: 'America/Sao_Paulo',
  SC: 'America/Sao_Paulo',
  RS: 'America/Sao_Paulo',
};

/**
 * Retorna o fuso horário IANA para o estado (UF) brasileiro.
 * Fallback: America/Sao_Paulo.
 */
export function getTimezoneFromState(uf: string): string {
  if (!uf || typeof uf !== 'string') return 'America/Sao_Paulo';
  const normalized = uf.trim().toUpperCase().slice(0, 2);
  return UF_TO_TIMEZONE[normalized] ?? 'America/Sao_Paulo';
}
