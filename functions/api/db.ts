import { AccountProfile, ContentDraft, GenerationRecord, Env } from './types';

// Simple UUID generator for browser / worker environment
export function generateId(prefix: string = 'id'): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

export function parseProfile(raw: any): AccountProfile {
  return {
    ...raw,
    active: Number(raw.active),
    content_pillars: JSON.parse(raw.content_pillars_json || '[]'),
    avoid_list: JSON.parse(raw.avoid_list_json || '[]'),
    preferred_formats: JSON.parse(raw.preferred_formats_json || '["carousel"]'),
  };
}

export function parseDraft(raw: any, profile?: AccountProfile): ContentDraft {
  return {
    ...raw,
    user_rating: raw.user_rating !== null ? Number(raw.user_rating) : null,
    version: Number(raw.version),
    product_context: JSON.parse(raw.product_context_json || '{}'),
    output: JSON.parse(raw.output_json || '{}'),
    profile: profile || (raw.profile_display_name ? {
      id: raw.profile_id,
      slug: raw.profile_slug,
      display_name: raw.profile_display_name,
      handle: raw.profile_handle,
      niche: raw.profile_niche,
      audience: raw.profile_audience || '',
      language: raw.profile_language || 'id-ID',
      tone: raw.profile_tone || '',
      content_pillars_json: raw.profile_content_pillars_json || '[]',
      avoid_list_json: raw.profile_avoid_list_json || '[]',
      preferred_formats_json: raw.profile_preferred_formats_json || '["carousel"]',
      cta_style: raw.profile_cta_style || '',
      active: Number(raw.profile_active || 1),
      created_at: raw.profile_created_at || '',
      updated_at: raw.profile_updated_at || '',
      content_pillars: JSON.parse(raw.profile_content_pillars_json || '[]'),
      avoid_list: JSON.parse(raw.profile_avoid_list_json || '[]'),
      preferred_formats: JSON.parse(raw.profile_preferred_formats_json || '["carousel"]'),
    } : undefined),
  };
}

export async function ensureDbInitialized(db: D1Database): Promise<void> {
  // Test if account_profiles table exists
  try {
    const res = await db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='account_profiles'").first();
    if (!res || (res as any).count === 0) {
      await initTables(db);
      await seedDefaultProfiles(db);
    }
  } catch (err) {
    console.error('Error checking DB initialization:', err);
  }
}

export async function initTables(db: D1Database): Promise<void> {
  const schema = `
    CREATE TABLE IF NOT EXISTS account_profiles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      handle TEXT,
      niche TEXT NOT NULL,
      audience TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT 'id-ID',
      tone TEXT NOT NULL DEFAULT '',
      content_pillars_json TEXT NOT NULL DEFAULT '[]',
      avoid_list_json TEXT NOT NULL DEFAULT '[]',
      preferred_formats_json TEXT NOT NULL DEFAULT '["carousel"]',
      cta_style TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_drafts (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES account_profiles(id),
      target_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('idea','draft','needs_review','ready','posted','archived')),
      format TEXT NOT NULL CHECK (format IN ('carousel','short_video_outline')),
      topic TEXT NOT NULL DEFAULT '',
      product_context_json TEXT NOT NULL DEFAULT '{}',
      output_json TEXT NOT NULL,
      user_rating INTEGER CHECK (user_rating IS NULL OR user_rating BETWEEN 1 AND 5),
      user_notes TEXT NOT NULL DEFAULT '',
      version INTEGER NOT NULL DEFAULT 1,
      generated_at TEXT,
      posted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_drafts_date_status ON content_drafts(target_date, status);
    CREATE INDEX IF NOT EXISTS idx_drafts_profile_date ON content_drafts(profile_id, target_date);

    CREATE TABLE IF NOT EXISTS generation_records (
      id TEXT PRIMARY KEY,
      draft_id TEXT REFERENCES content_drafts(id) ON DELETE SET NULL,
      profile_id TEXT NOT NULL REFERENCES account_profiles(id),
      provider_name TEXT NOT NULL,
      model_id TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK (outcome IN ('success','provider_error','schema_error','validation_error')),
      latency_ms INTEGER,
      input_tokens INTEGER,
      output_tokens INTEGER,
      error_code TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_generation_created ON generation_records(created_at);
  `;

  // Execute schema statement batches
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await db.prepare(stmt).run();
  }
}

export async function seedDefaultProfiles(db: D1Database): Promise<void> {
  const now = new Date().toISOString();
  const seeds = [
    {
      id: 'profile_beauty_01',
      slug: 'beauty-personal-care',
      display_name: 'Beauty & Personal Care',
      handle: '@glowandcare.id',
      niche: 'Skincare & Makeup Education',
      audience: 'Remaja & wanita 18-35 tahun yang mencari solusi perawatan kulit, edukasi kandungan skincare, dan tutorial makeup praktis.',
      language: 'id-ID',
      tone: 'Edukatif, ramah, jujur, solutif, mudah dipahami tanpa klaim berlebihan',
      content_pillars_json: JSON.stringify([
        'Edukasi Kandungan Skincare',
        'Rekomendasi Produk & Review Jujur',
        'Tutorial Rutinitas Skincare Pagi/Malam',
        'Tips Makeup Flawless Tahan Lama',
        'Mitos vs Fakta Perawatan Kulit'
      ]),
      avoid_list_json: JSON.stringify([
        'Klaim instan putih 3 hari',
        'Menjelek-jelekkan brand lain tanpa dasar',
        'Mendiagnosis penyakit kulit klinis',
        'Klaim medis tidak berdasar'
      ]),
      preferred_formats_json: JSON.stringify(['carousel', 'short_video_outline']),
      cta_style: 'Simpan konten ini untuk panduan skincare routine kamu, share ke teman yang butuh, cek produk di keranjang kuning!',
    },
    {
      id: 'profile_fashion_wanita_02',
      slug: 'fashion-wanita',
      display_name: 'Fashion Wanita',
      handle: '@ootdcewek.id',
      niche: "Jeans, Tops, Corsets & Women's Everyday Style",
      audience: 'Wanita 18-30 tahun yang ingin tampil modis, percaya diri, dan butuh panduan mix & match outfit kasual maupun formal.',
      language: 'id-ID',
      tone: 'Trendy, bersemangat, stylish, suportif, relatable',
      content_pillars_json: JSON.stringify([
        'Inspirasi OOTD Mix & Match',
        'Panduan Ukuran & Body Shape Styling',
        'Tips Memilih Jeans yang Pas di Pinggul',
        'Kombinasi Atasan & Corset Kekinian',
        'Ide Outfit Kuliah & Hangout Hemat'
      ]),
      avoid_list_json: JSON.stringify([
        'Body shaming',
        'Klaim ukuran yang menghakimi',
        'Merekam tanpa izin',
        'Gaya pakaian tidak sopan'
      ]),
      preferred_formats_json: JSON.stringify(['carousel', 'short_video_outline']),
      cta_style: 'Tap save buat inspirasi outfit weekend kamu, tag bestie kamu, klik keranjang kuning buat detail ukurannya!',
    },
    {
      id: 'profile_techno_03',
      slug: 'techno',
      display_name: 'Techno Gadget Hub',
      handle: '@technohub.id',
      niche: 'Gadgets, Phones, Smartwatches & Accessories',
      audience: 'Tech enthusiast, mahasiswa, dan profesional muda yang mencari panduan belanja gadget, perbandingan spek objektif, dan tips pemakaian.',
      language: 'id-ID',
      tone: 'Objektif, informatif, tajam, ringkas, mudah dipahami bagi awam teknologi',
      content_pillars_json: JSON.stringify([
        'Panduan Beli Gadget Budget vs Flagship',
        'Komparasi Spek Smartphone & Smartwatch',
        'Fitur Tersembunyi & Trik Produktivitas',
        'Review Aksesoris & Case Tahan Banting',
        'Tips Awet Baterai & Perawatan Device'
      ]),
      avoid_list_json: JSON.stringify([
        'Menyebut angka benchmark fiktif',
        'Klaim performa tanpa uji',
        'Fanboying bias merek',
        'Menyebarkan rumor palsu'
      ]),
      preferred_formats_json: JSON.stringify(['carousel', 'short_video_outline']),
      cta_style: 'Komentar di bawah gadget impianmu, save untuk perbandingan sebelum checkout di keranjang kuning!',
    },
    {
      id: 'profile_fashion_pria_04',
      slug: 'fashion-pria',
      display_name: 'Fashion Pria',
      handle: '@gentlemensoutfit.id',
      niche: "Formal Wear, Tees, Jeans & Smart-Casual Men's Style",
      audience: 'Pria 18-35 tahun yang ingin upgrade penampilan, butuh inspirasi smart-casual, kemeja rapi, denim, dan grooming dasar.',
      language: 'id-ID',
      tone: 'Maskulin, rapi, percaya diri, lugas, praktis',
      content_pillars_json: JSON.stringify([
        'Kombinasi Outfit Smart-Casual Kantor & Kencan',
        'Panduan Fit & Potongan Celana Jeans Pria',
        'Kombinasi Warna Kaos & Outerwear',
        'Tips Memilih Kemeja Formal & Ukuran Kerah',
        'Aksesoris Simpel Penunjang Penampilan Pria'
      ]),
      avoid_list_json: JSON.stringify([
        'Komentar merendahkan penampilan orang lain',
        'Klaim harga barang branded palsu',
        'Gaya tidak realistis untuk cuaca tropis'
      ]),
      preferred_formats_json: JSON.stringify(['carousel', 'short_video_outline']),
      cta_style: 'Simpan postingan ini untuk contekan outfit besok, share ke kawan, cek etalase keranjang kuning buat rekomendasi kemejanya!',
    }
  ];

  for (const p of seeds) {
    await db.prepare(`
      INSERT OR REPLACE INTO account_profiles (
        id, slug, display_name, handle, niche, audience, language, tone,
        content_pillars_json, avoid_list_json, preferred_formats_json, cta_style, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      p.id, p.slug, p.display_name, p.handle, p.niche, p.audience, p.language, p.tone,
      p.content_pillars_json, p.avoid_list_json, p.preferred_formats_json, p.cta_style, now, now
    ).run();
  }
}
