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
