import { Plugin } from 'vite';
import { AccountProfile, ContentDraft, DraftFormat, GenerationRecord, SlideItem, ContentDraftOutput } from './functions/api/types';
import { generateContextualDraft, validateAndSanitizeOutput } from './functions/api/ai-adapter';

// In-memory data store for Vite dev server mode
const defaultProfiles: AccountProfile[] = [
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
    active: 1,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    content_pillars: [
      'Edukasi Kandungan Skincare',
      'Rekomendasi Produk & Review Jujur',
      'Tutorial Rutinitas Skincare Pagi/Malam',
      'Tips Makeup Flawless Tahan Lama',
      'Mitos vs Fakta Perawatan Kulit'
    ],
    avoid_list: [
      'Klaim instan putih 3 hari',
      'Menjelek-jelekkan brand lain tanpa dasar',
      'Mendiagnosis penyakit kulit klinis',
      'Klaim medis tidak berdasar'
    ],
    preferred_formats: ['carousel', 'short_video_outline']
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
    active: 1,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    content_pillars: [
      'Inspirasi OOTD Mix & Match',
      'Panduan Ukuran & Body Shape Styling',
      'Tips Memilih Jeans yang Pas di Pinggul',
      'Kombinasi Atasan & Corset Kekinian',
      'Ide Outfit Kuliah & Hangout Hemat'
    ],
    avoid_list: [
      'Body shaming',
      'Klaim ukuran yang menghakimi',
      'Merekam tanpa izin',
      'Gaya pakaian tidak sopan'
    ],
    preferred_formats: ['carousel', 'short_video_outline']
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
    active: 1,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    content_pillars: [
      'Panduan Beli Gadget Budget vs Flagship',
      'Komparasi Spek Smartphone & Smartwatch',
      'Fitur Tersembunyi & Trik Produktivitas',
      'Review Aksesoris & Case Tahan Banting',
      'Tips Awet Baterai & Perawatan Device'
    ],
    avoid_list: [
      'Menyebut angka benchmark fiktif',
      'Klaim performa tanpa uji',
      'Fanboying bias merek',
      'Menyebarkan rumor palsu'
    ],
    preferred_formats: ['carousel', 'short_video_outline']
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
    active: 1,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    content_pillars: [
      'Kombinasi Outfit Smart-Casual Kantor & Kencan',
      'Panduan Fit & Potongan Celana Jeans Pria',
      'Kombinasi Warna Kaos & Outerwear',
      'Tips Memilih Kemeja Formal & Ukuran Kerah',
      'Aksesoris Simpel Penunjang Penampilan Pria'
    ],
    avoid_list: [
      'Komentar merendahkan penampilan orang lain',
      'Klaim harga barang branded palsu',
      'Gaya tidak realistis untuk cuaca tropis'
    ],
    preferred_formats: ['carousel', 'short_video_outline']
  }
];

let profiles: AccountProfile[] = JSON.parse(JSON.stringify(defaultProfiles));
let drafts: ContentDraft[] = [];
let generationRecords: GenerationRecord[] = [];

// Seed 2 initial drafts so user sees rich UI right away!
const seedDraftBeauty: ContentDraft = {
  id: 'draft_beauty_demo_01',
  profile_id: 'profile_beauty_01',
  target_date: new Date().toISOString().slice(0, 10),
  status: 'draft',
  format: 'carousel',
  topic: 'Edukasi Kandungan Niacinamide & Hyaluronic Acid',
  product_context_json: JSON.stringify({
    productName: 'Hydra Glow Barrier Serum',
    facts: ['Konsentrasi Niacinamide 4%', 'Hyaluronic Acid Multi-Molecular', 'Sudah BPOM'],
    affiliateDisclosureNeeded: true,
  }),
  output_json: JSON.stringify({
    title: 'Niacinamide + Hyaluronic Acid: Duet Maut Kulit Glowing',
    format: 'carousel',
    hook: 'Jangan kebalik! Urutan pakai Niacinamide & Hyaluronic Acid yang bener biar gak jerawatan',
    slides: [
      {
        position: 1,
        text: 'Banyak yang mikir Niacinamide dan Hyaluronic Acid gak boleh digabung! Padahal kalau urutannya tepat, hasilnya bikin skin barrier kenyal maksimal.',
        visual_direction: 'Background pastel soft pink, tipografi bold modern dengan ikon tetesan serum bercahaya.',
      },
      {
        position: 2,
        text: 'Langkah 1: Wajah wajib setengah basah (damp skin) sebelum tetes Hyaluronic Acid biar menarik kelembapan ke dalam pori.',
        visual_direction: 'Foto close-up spray mist ke wajah dengan petunjuk teks ringkas bernomor.',
      },
      {
        position: 3,
        text: 'Langkah 2: Tunggu meresap 30 detik, lanjut Niacinamide 4% untuk mengunci pori dan meratakan warna kulit kusam.',
        visual_direction: 'Ilustrasi botol pipet dengan countdown timer minimalis 30 detik.',
      },
      {
        position: 4,
        text: 'Peringatan: Kalau baru pertama coba, mulai 2-3 kali seminggu dulu di malam hari sebelum pakai setiap hari.',
        visual_direction: 'Box peringatan berbingkai halus dengan ikon kalender panduan frekuensi.',
      },
      {
        position: 5,
        text: 'Kunci akhir: Kunci kelembapannya dengan pelembap gel ringan. Kulit plumpy tanpa rasa lengket!',
        visual_direction: 'Foto tekstur gel moisturizer bening di ujung jari, bersih dan estetik.',
      },
    ],
    caption: 'Biar gak boncos tapi hasil nihil, terapin urutan layering ini ya! Save dulu postingan ini biar gak lupa pas rutinitas malam nanti ✨\n\nSimpan konten ini untuk panduan skincare routine kamu, share ke teman yang butuh, cek produk di keranjang kuning!',
    hashtags: ['skincaretips', 'edukasiskincare', 'skinbarrier', 'niacinamide', 'hyaluronicacid', 'racuntiktok'],
    source_notes: ['Journal of Cosmetic Dermatology: Layering humectants and niacinamide', 'Kadar Niacinamide aman untuk pemula 2-5%'],
    claims_to_verify: ['Cek nomor BPOM dan klaim konsentrasi 4% pada kemasan resmi produk'],
    disclosure_reminder: 'Gunakan tag #affiliate / #racuntiktok dan sematkan produk di keranjang kuning.',
    checklist: [
      'Cek kesesuaian formula dengan jenis kulit',
      'Pastikan nomor BPOM valid pada kemasan',
      'Cek kontras teks pada slide carousel',
      'Pasang link keranjang kuning aktif',
      'Gunakan audio edukasi santai yang sedang tren',
    ],
  }),
  user_rating: 5,
  user_notes: 'Draft awal sudah diverifikasi, siap disesuaikan dengan stok produk.',
  version: 1,
  generated_at: new Date().toISOString(),
  posted_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

drafts.push(seedDraftBeauty);

function parseDraftFull(d: ContentDraft): ContentDraft {
  const profile = profiles.find(p => p.id === d.profile_id);
  return {
    ...d,
    profile,
    product_context: JSON.parse(d.product_context_json || '{}'),
    output: JSON.parse(d.output_json || '{}'),
  };
}

export function viteApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-tiktok-planner-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:5173');
        const pathname = url.pathname;
        const method = req.method || 'GET';

        const sendJson = (statusCode: number, data: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        const readBody = async (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => { data += chunk; });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        try {
          // GET /api/health
          if (pathname === '/api/health' && method === 'GET') {
            return sendJson(200, {
              status: 'ok',
              version: '1.0.0',
              timestamp: new Date().toISOString(),
              database: 'connected (local-memory)',
              ai: {
                configured: !!process.env.AI_API_KEY,
                provider: process.env.AI_API_KEY ? 'OpenAI-Compatible' : 'Contextual-Engine (Built-in)',
                model: process.env.AI_MODEL_ID || 'gpt-4o-mini',
                mode: process.env.AI_API_KEY ? 'live_provider' : 'contextual_engine_active',
              },
            });
          }

          // GET /api/settings
          if (pathname === '/api/settings' && method === 'GET') {
            return sendJson(200, {
              provider: {
                configured: !!process.env.AI_API_KEY,
                baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
                modelId: process.env.AI_MODEL_ID || 'gpt-4o-mini',
                promptVersion: 'v1',
                activeEngine: process.env.AI_API_KEY ? 'OpenAI-Compatible API' : 'Built-in Contextual AI Engine',
              },
            });
          }

          // POST /api/settings
          if (pathname === '/api/settings' && method === 'POST') {
            const body = await readBody();
            if (body.action === 'reset_seeds') {
              profiles = JSON.parse(JSON.stringify(defaultProfiles));
              return sendJson(200, { success: true, message: 'Profiles reset to default seeds' });
            }
            return sendJson(400, { error: 'Unknown action' });
          }

          // GET /api/export
          if (pathname === '/api/export' && method === 'GET') {
            const format = url.searchParams.get('format') || 'json';
            const fullDrafts = drafts.map(parseDraftFull);

            if (format === 'csv') {
              const headers = ['ID', 'Date', 'Account', 'Niche', 'Status', 'Format', 'Title', 'Hook', 'Caption', 'Hashtags', 'Slides Count', 'Created At'];
              const rows = fullDrafts.map(d => [
                `"${d.id}"`,
                `"${d.target_date}"`,
                `"${(d.profile?.display_name || '').replace(/"/g, '""')}"`,
                `"${(d.profile?.niche || '').replace(/"/g, '""')}"`,
                `"${d.status}"`,
                `"${d.format}"`,
                `"${(d.output?.title || '').replace(/"/g, '""')}"`,
                `"${(d.output?.hook || '').replace(/"/g, '""')}"`,
                `"${(d.output?.caption || '').replace(/"/g, '""')}"`,
                `"${(d.output?.hashtags?.join(' ') || '').replace(/"/g, '""')}"`,
                d.output?.slides?.length || 0,
                `"${d.created_at}"`,
              ]);
              const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/csv; charset=utf-8');
              res.setHeader('Content-Disposition', `attachment; filename="tiktok-drafts-export.csv"`);
              return res.end(csv);
            }

            return sendJson(200, {
              exportedAt: new Date().toISOString(),
              totalDrafts: fullDrafts.length,
              drafts: fullDrafts,
            });
          }

          // GET /api/profiles
          if (pathname === '/api/profiles' && method === 'GET') {
            return sendJson(200, { profiles });
          }

          // PATCH /api/profiles/:id
          const profileMatch = pathname.match(/^\/api\/profiles\/([^/]+)$/);
          if (profileMatch && method === 'PATCH') {
            const id = profileMatch[1];
            const pIdx = profiles.findIndex(p => p.id === id);
            if (pIdx === -1) {
              return sendJson(404, { error: 'Profile not found' });
            }
            const body = await readBody();
            const current = profiles[pIdx];

            if (body.display_name !== undefined) current.display_name = body.display_name.trim();
            if (body.handle !== undefined) current.handle = body.handle ? body.handle.trim() : null;
            if (body.niche !== undefined) current.niche = body.niche.trim();
            if (body.audience !== undefined) current.audience = body.audience.trim();
            if (body.language !== undefined) current.language = body.language.trim();
            if (body.tone !== undefined) current.tone = body.tone.trim();
            if (body.cta_style !== undefined) current.cta_style = body.cta_style.trim();
            if (body.active !== undefined) current.active = body.active ? 1 : 0;
            if (body.content_pillars !== undefined) {
              current.content_pillars = body.content_pillars;
              current.content_pillars_json = JSON.stringify(body.content_pillars);
            }
            if (body.avoid_list !== undefined) {
              current.avoid_list = body.avoid_list;
              current.avoid_list_json = JSON.stringify(body.avoid_list);
            }
            if (body.preferred_formats !== undefined) {
              current.preferred_formats = body.preferred_formats;
              current.preferred_formats_json = JSON.stringify(body.preferred_formats);
            }
            current.updated_at = new Date().toISOString();

            return sendJson(200, { profile: current });
          }

          // GET /api/drafts
          if (pathname === '/api/drafts' && method === 'GET') {
            const date = url.searchParams.get('date');
            const profileId = url.searchParams.get('profileId');
            const status = url.searchParams.get('status');
            const includeArchived = url.searchParams.get('includeArchived') === 'true';

            let filtered = drafts.slice();
            if (date) filtered = filtered.filter(d => d.target_date === date);
            if (profileId) filtered = filtered.filter(d => d.profile_id === profileId);
            if (status) {
              filtered = filtered.filter(d => d.status === status);
            } else if (!includeArchived) {
              filtered = filtered.filter(d => d.status !== 'archived');
            }

            // Sort by target_date desc, created_at desc
            filtered.sort((a, b) => (b.target_date + b.created_at).localeCompare(a.target_date + a.created_at));

            return sendJson(200, { drafts: filtered.map(parseDraftFull) });
          }

          // POST /api/drafts/generate
          if (pathname === '/api/drafts/generate' && method === 'POST') {
            const body = await readBody();
            if (!body.profileId) return sendJson(400, { error: 'profileId is required' });
            if (!body.targetDate) return sendJson(400, { error: 'targetDate is required' });

            const profile = profiles.find(p => p.id === body.profileId);
            if (!profile) return sendJson(404, { error: 'Account profile not found' });

            const format = body.format === 'short_video_outline' ? 'short_video_outline' : 'carousel';

            // Generate contextual draft
            const genOutput = generateContextualDraft(
              {
                profileId: body.profileId,
                targetDate: body.targetDate,
                format,
                topic: body.topic,
                productContext: body.productContext,
              },
              profile
            );

            const validated = validateAndSanitizeOutput(genOutput, body, profile);
            const outputToSave = validated.output || genOutput;

            const now = new Date().toISOString();
            const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            const newDraft: ContentDraft = {
              id: draftId,
              profile_id: body.profileId,
              target_date: body.targetDate,
              status: 'draft',
              format,
              topic: body.topic || '',
              product_context_json: JSON.stringify(body.productContext || {}),
              output_json: JSON.stringify(outputToSave),
              user_rating: null,
              user_notes: '',
              version: 1,
              generated_at: now,
              posted_at: null,
              created_at: now,
              updated_at: now,
            };

            drafts.push(newDraft);

            const record: GenerationRecord = {
              id: `gen_${Date.now()}`,
              draft_id: draftId,
              profile_id: body.profileId,
              provider_name: 'Contextual-Engine (Built-in)',
              model_id: 'smart-template-engine-v1',
              promptVersion: 'v1',
              outcome: 'success',
              latencyMs: 120,
              inputTokens: 320,
              outputTokens: 480,
              errorCode: null,
              created_at: now,
            };
            generationRecords.push(record);

            return sendJson(201, { draft: parseDraftFull(newDraft), generationRecord: record });
          }

          // POST /api/drafts/:id/regenerate
          const regenMatch = pathname.match(/^\/api\/drafts\/([^/]+)\/regenerate$/);
          if (regenMatch && method === 'POST') {
            const id = regenMatch[1];
            const dIdx = drafts.findIndex(d => d.id === id);
            if (dIdx === -1) return sendJson(404, { error: 'Draft not found' });

            const body = await readBody();
            const current = drafts[dIdx];

            if (body.expectedVersion !== undefined && Number(current.version) !== Number(body.expectedVersion)) {
              return sendJson(409, {
                error: 'Conflict: Draft has been modified. Please reload before regenerating.',
                code: 'CONCURRENCY_CONFLICT',
                currentVersion: current.version,
              });
            }

            const profile = profiles.find(p => p.id === current.profile_id)!;
            const productContext = JSON.parse(current.product_context_json || '{}');
            const existingOutput: ContentDraftOutput = JSON.parse(current.output_json || '{}');

            const genOutput = generateContextualDraft(
              {
                profileId: current.profile_id,
                targetDate: current.target_date,
                format: current.format,
                topic: current.topic,
                productContext,
              },
              profile
            );

            let merged: ContentDraftOutput = { ...existingOutput };
            if (body.scope === 'all') {
              merged = genOutput;
            } else if (body.scope === 'hook') {
              merged.hook = genOutput.hook;
              merged.title = genOutput.title;
            } else if (body.scope === 'slides') {
              if (body.slidePosition !== undefined) {
                const targetPos = body.slidePosition;
                const newSlide = genOutput.slides.find(s => s.position === targetPos) || genOutput.slides[0];
                merged.slides = (merged.slides || []).map(s => s.position === targetPos ? { ...s, text: newSlide.text, visual_direction: newSlide.visual_direction } : s);
              } else {
                merged.slides = genOutput.slides;
              }
            } else if (body.scope === 'caption') {
              merged.caption = genOutput.caption;
              merged.hashtags = genOutput.hashtags;
            } else if (body.scope === 'checklist') {
              merged.checklist = genOutput.checklist;
              merged.claims_to_verify = genOutput.claims_to_verify;
            }

            current.output_json = JSON.stringify(merged);
            current.version = Number(current.version) + 1;
            current.updated_at = new Date().toISOString();

            return sendJson(200, { draft: parseDraftFull(current) });
          }

          // GET, PATCH, DELETE /api/drafts/:id
          const draftMatch = pathname.match(/^\/api\/drafts\/([^/]+)$/);
          if (draftMatch) {
            const id = draftMatch[1];
            const dIdx = drafts.findIndex(d => d.id === id);
            if (dIdx === -1) return sendJson(404, { error: 'Draft not found' });
            const current = drafts[dIdx];

            if (method === 'GET') {
              return sendJson(200, { draft: parseDraftFull(current) });
            }

            if (method === 'PATCH') {
              const body = await readBody();

              if (body.expectedVersion !== undefined && Number(current.version) !== Number(body.expectedVersion)) {
                return sendJson(409, {
                  error: 'Conflict: Draft modified by another action',
                  code: 'CONCURRENCY_CONFLICT',
                  currentVersion: current.version,
                });
              }

              if (body.status) current.status = body.status;
              if (body.format) current.format = body.format;
              if (body.topic !== undefined) current.topic = body.topic;
              if (body.output) current.output_json = JSON.stringify(body.output);
              if (body.user_rating !== undefined) current.user_rating = body.user_rating;
              if (body.user_notes !== undefined) current.user_notes = body.user_notes;

              if (body.status === 'posted' && !current.posted_at) {
                current.posted_at = body.posted_at || new Date().toISOString();
              } else if (body.status && body.status !== 'posted') {
                current.posted_at = null;
              }

              current.version = Number(current.version) + 1;
              current.updated_at = new Date().toISOString();

              return sendJson(200, { draft: parseDraftFull(current) });
            }

            if (method === 'DELETE') {
              current.status = 'archived';
              current.updated_at = new Date().toISOString();
              return sendJson(200, { success: true, archived: true });
            }
          }

          return sendJson(404, { error: 'Not found' });
        } catch (err: any) {
          console.error('API Error:', err);
          return sendJson(500, { error: err.message || 'Server error' });
        }
      });
    },
  };
}
