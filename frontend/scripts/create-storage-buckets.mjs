#!/usr/bin/env node
/**
 * Cria os buckets de Storage do Supabase (avatars, attachments, patients) se não existirem.
 * Execute a partir da pasta frontend (para usar o @supabase/supabase-js instalado):
 *
 *   cd frontend
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/create-storage-buckets.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const buckets = [
  { id: 'avatars', public: true, fileSizeLimit: 2 * 1024 * 1024, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
  { id: 'attachments', public: true, fileSizeLimit: 50 * 1024 * 1024 },
  { id: 'patients', public: true, fileSizeLimit: 3 * 1024 * 1024, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: existing } = await supabase.storage.listBuckets();
  const names = new Set((existing ?? []).map((b) => b.name));

  for (const b of buckets) {
    if (names.has(b.id)) {
      console.log('Bucket já existe:', b.id);
      continue;
    }
    const opts = { public: b.public, fileSizeLimit: b.fileSizeLimit };
    if (b.allowedMimeTypes) opts.allowedMimeTypes = b.allowedMimeTypes;
    const { error } = await supabase.storage.createBucket(b.id, opts);
    if (error) {
      console.error('Erro ao criar bucket', b.id, error.message);
      continue;
    }
    console.log('Criado bucket:', b.id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
