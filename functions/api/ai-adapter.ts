import { AccountProfile, ContentDraftOutput, DraftFormat, DraftGenerationRequest, ProductContext } from './types';

export interface GenerationResult {
  output: ContentDraftOutput;
  outcome: 'success' | 'schema_error' | 'provider_error' | 'validation_error';
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  errorCode?: string;
  providerName: string;
  modelId: string;
  promptVersion: string;
}

// Deterministic claim checks and sanitize
export function validateAndSanitizeOutput(
  raw: any,
  request: DraftGenerationRequest,
  profile: AccountProfile
): { valid: boolean; output?: ContentDraftOutput; errors: string[] } {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Output must be a valid JSON object'] };
  }

  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Draft Konten TikTok';
  const format: DraftFormat = raw.format === 'short_video_outline' ? 'short_video_outline' : 'carousel';
  const hook = typeof raw.hook === 'string' && raw.hook.trim() ? raw.hook.trim() : '';

  if (!hook) {
    errors.push('Hook is required');
  }

  // Validate slides
  let slides = Array.isArray(raw.slides) ? raw.slides : [];
  if (slides.length === 0) {
    errors.push('At least one slide or beat is required');
  }

  const sanitizedSlides = slides.map((s: any, idx: number) => {
    const text = typeof s.text === 'string' ? s.text.trim() : `Slide ${idx + 1}`;
    const visual = typeof s.visual_direction === 'string' ? s.visual_direction.trim() : 'Visual relevan dengan teks';
    const cleanText = text.replace(/^Slide \d+:\s*/i, '');

    let imagePrompt = typeof s.image_prompt === 'string' && s.image_prompt.trim()
      ? s.image_prompt.trim()
      : '';

    if (!imagePrompt) {
      imagePrompt = `Vertical 9:16 composition. Visual & Background: ${visual}. On-screen text typography: "${cleanText}". Soft clean studio lighting, minimalist editorial layout, highly detailed 8k --ar 9:16`;
    } else {
      const textSnippet = cleanText.slice(0, 20).toLowerCase();
      if (!imagePrompt.toLowerCase().includes(textSnippet)) {
        if (imagePrompt.includes('--ar')) {
          imagePrompt = imagePrompt.replace(/(--ar\s+[\d:]+)/i, `Text on slide: "${cleanText}" $1`);
        } else {
          imagePrompt = `${imagePrompt}. Text on slide: "${cleanText}" --ar 9:16`;
        }
      }
      if (!imagePrompt.toLowerCase().includes(visual.slice(0, 15).toLowerCase()) && !imagePrompt.toLowerCase().includes('visual')) {
        imagePrompt = `Visual & Background: ${visual}. ${imagePrompt}`;
      }
    }

    return {
      position: typeof s.position === 'number' ? s.position : idx + 1,
      text,
      visual_direction: visual,
      image_prompt: imagePrompt,
    };
  });

  const caption = typeof raw.caption === 'string' ? raw.caption.trim() : '';
  if (!caption) {
    errors.push('Caption is required');
  }

  const hashtags = Array.isArray(raw.hashtags)
    ? raw.hashtags.map((h: any) => String(h).replace(/^#/, '').trim()).filter(Boolean)
    : [];

  const sourceNotes = Array.isArray(raw.source_notes)
    ? raw.source_notes.map((s: any) => String(s).trim()).filter(Boolean)
    : [];

  // Deterministic check: banned first person claims or unverifiable claims
  const claimsToVerify = Array.isArray(raw.claims_to_verify)
    ? raw.claims_to_verify.map((c: any) => String(c).trim()).filter(Boolean)
    : [];

  // Check for banned phrases in slide text or caption if no facts provided
  const bannedKeywords = ['pasti putih dalam', 'turun 10kg seminggu', 'dijamin kaya', '100% ampuh tanpa efek', 'aku udah coba 1 tahun'];
  const fullText = (hook + ' ' + caption + ' ' + sanitizedSlides.map((s: { text: string }) => s.text).join(' ')).toLowerCase();
  
  for (const banned of bannedKeywords) {
    if (fullText.includes(banned)) {
      claimsToVerify.push(`PERINGATAN: Deteksi klaim berlebihan ("${banned}"). Harap verifikasi bukti faktual.`);
    }
  }

  if (request.productContext?.productName && (!request.productContext.facts || request.productContext.facts.length === 0)) {
    claimsToVerify.push(`Spesifikasi & klaim "${request.productContext.productName}" harus diverifikasi sebelum posting.`);
  }

  let disclosureReminder = raw.disclosure_reminder;
  if (request.productContext?.affiliateDisclosureNeeded || request.productContext?.productName) {
    if (!disclosureReminder) {
      disclosureReminder = 'Cantumkan tag #affiliate / #endorse dan pastikan tautan keranjang kuning aktif sesuai pedoman TikTok.';
    }
  }

  let checklist = Array.isArray(raw.checklist) && raw.checklist.length > 0
    ? raw.checklist.map((c: any) => String(c).trim()).filter(Boolean)
    : [
        'Cek kesesuaian tone dan pilar konten akun',
        'Pastikan tidak ada klaim hasil instan yang dilarang',
        'Verifikasi kontras warna teks dan visual di layar 9:16',
        'Cek ketersediaan produk di keranjang kuning',
        'Review hashtag dan musik tren sebelum posting'
      ];

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitized: ContentDraftOutput = {
    title,
    format,
    hook,
    slides: sanitizedSlides,
    caption,
    hashtags,
    source_notes: sourceNotes,
    claims_to_verify: claimsToVerify,
    disclosure_reminder: disclosureReminder || null,
    checklist,
  };

  return { valid: true, output: sanitized, errors: [] };
}

// Realistic contextual fallback generator (for offline, test, or when API key is not configured)
export function generateContextualDraft(
  request: DraftGenerationRequest,
  profile: AccountProfile
): ContentDraftOutput {
  const pillars: string[] = typeof profile.content_pillars_json === 'string'
    ? JSON.parse(profile.content_pillars_json || '[]')
    : profile.content_pillars || [];
  
  const selectedPillar = pillars.length > 0 ? pillars[Math.floor(Math.random() * pillars.length)] : 'Tips & Edukasi';
  const topic = request.topic?.trim() || `${selectedPillar} untuk Pemula`;
  const prodName = request.productContext?.productName?.trim();
  const facts = request.productContext?.facts?.filter(f => f.trim()) || [];

  if (profile.slug === 'beauty-personal-care') {
    return {
      title: `${topic} - Panduan Skincare`,
      format: request.format,
      hook: `Jangan asal coba! Ini fakta penting ${topic} yang sering salah dipahami`,
      slides: [
        {
          position: 1,
          text: `Slide 1: Banyak yang mikir hasil skincare bisa instan. Faktanya, kulit kita butuh siklus regenerasi alami!`,
          visual_direction: 'Foto close-up tekstur kulit sehat, background pastel rose bersih dengan teks judul besar kontras.'
        },
        {
          position: 2,
          text: `Slide 2: ${prodName ? `Kandungan utama ${prodName}` : 'Pahami bahan aktifnya'}: Fokus pada hidrasi skin barrier sebelum eksfoliasi berat.`,
          visual_direction: 'Infografis botol serum minimalis dengan callout panah menunjuk bahan aktif.'
        },
        {
          position: 3,
          text: `Slide 3: Cara pakai yang benar: Aplikasikan pada kulit lembap (damp skin), jangan digosok terlalu keras.`,
          visual_direction: 'Step-by-step visual ilustrasi tangan mengaplikasikan produk secara lembut.'
        },
        {
          position: 4,
          text: `Slide 4: Hindari layering bahan yang berlawanan di waktu bersamaan (misal Retinol + AHA konsentrasi tinggi).`,
          visual_direction: 'Tabel perbandingan sederhana: Kombinasi AMAN vs HINDARI dengan icon checklist hijau & silang merah.'
        },
        {
          position: 5,
          text: `Slide 5: Konsistensi 4-6 minggu adalah kunci. Hasil bertahap tapi skin barrier tetap sehat terlindungi!`,
          visual_direction: 'Slide penutup dengan highlight quote, CTA save & keranjang kuning di bagian bawah.'
        }
      ],
      caption: `Biar gak boncos beli skincare tapi malah breakout, pahami dulu prinsip dasarnya ya! Simpan dulu postingan ini biar gak lupa pas rutinitas malam nanti ✨\n\n${profile.cta_style}`,
      hashtags: ['skincaretips', 'edukasiskincare', 'skinbarrier', 'skincareroutine', 'beautytipsid', 'racuntiktok'],
      source_notes: facts.length > 0 ? facts : ['Dermatology principles: Skin turnover cycle ~28 days', 'Moisturizer & barrier protection guidelines'],
      claims_to_verify: prodName ? [`Cek nomor BPOM dan klaim bahan aktif pada kemasan resmi ${prodName}`] : ['Pastikan klaim bahan aktif sesuai jenis kulit pembaca'],
      disclosure_reminder: request.productContext?.affiliateDisclosureNeeded || !!prodName
        ? 'Gunakan tag #affiliate / #racuntiktok dan sematkan produk di keranjang kuning.'
        : null,
      checklist: [
        'Cek kesesuaian formula dengan jenis kulit',
        'Pastikan nomor BPOM / izin edar valid jika review produk',
        'Cek kontras teks pada visual carousel',
        'Pasang link keranjang kuning jika produk affiliate',
        'Gunakan audio edukasi santai yang sedang tren'
      ]
    };
  }

  if (profile.slug === 'fashion-wanita') {
    return {
      title: `${topic} - OOTD Mix & Match`,
      format: request.format,
      hook: `Stop pakai outfit yang itu-itu aja! Trik mix & match ${topic} biar keliatan jenjang`,
      slides: [
        {
          position: 1,
          text: `Slide 1: Mau tampil stylish tapi gamau ribet? Ini rahasia proporsi outfit 1/3 vs 2/3 yang wajib kamu tau!`,
          visual_direction: 'Full body aesthetic mirror selfie, aesthetic coral lighting dengan border elegan.'
        },
        {
          position: 2,
          text: `Slide 2: Pilih potongan high-waist untuk memberi ilusi kaki lebih panjang dan pinggang terdefinisi.`,
          visual_direction: 'Perbandingan side-by-side: potong celana mid vs high-waist dengan garis bantu proporsi.'
        },
        {
          position: 3,
          text: `Slide 3: Kombinasi atasan ${prodName || 'crop top/corset'}: Padukan dengan outer longgar untuk balance siluet tubuh.`,
          visual_direction: 'Flatlay outfit dengan aksesoris tas bahu dan sepatu loafers senada.'
        },
        {
          position: 4,
          text: `Slide 4: Color palette rule: Maksimal 3 warna utama dalam satu look agar tidak terkesan ramai.`,
          visual_direction: 'Swatch warna netral (cream, denim blue, sage) yang saling melengkapi.'
        },
        {
          position: 5,
          text: `Slide 5: Look ini cocok buat kuliah, ngantor santai, atau hangout weekend bareng bestie!`,
          visual_direction: 'Final look showcase dengan pose percaya diri dan stiker rekomendasi produk.'
        }
      ],
      caption: `Trik simpel tapi langsung bikin look kamu level up 100%! Yang sering bingung mau pakai apa besok, wajib save postingan ini ya 💕\n\n${profile.cta_style}`,
      hashtags: ['ootdhijab', 'fashionwanita', 'mixandmatch', 'jeanswanita', 'outfitideas', 'racunoutfit'],
      source_notes: facts.length > 0 ? facts : ['Fashion styling rules: Rule of thirds proportion', 'Neutral color blocking guidelines'],
      claims_to_verify: prodName ? [`Cek ukuran chart (panjang celana, lingkar pinggang) pada etalase ${prodName}`] : ['Sertakan catatan bahwa fit tergantung tinggi badan masing-masing'],
      disclosure_reminder: request.productContext?.affiliateDisclosureNeeded || !!prodName
        ? 'Sematkan etalase outfit di keranjang kuning dan gunakan hashtag komersial sesuai ketentuan.'
        : null,
      checklist: [
        'Cek akurasi size chart pada deskripsi',
        'Gunakan pencahayaan natural agar warna kain tidak meleset',
        'Pastikan cover carousel eye-catching di FYP',
        'Cek link affiliate keranjang kuning aktif',
        'Tulis detail tinggi/berat model sebagai referensi di komentar'
      ]
    };
  }

  if (profile.slug === 'techno') {
    return {
      title: `${topic} - Panduan Spek & Gadget`,
      format: request.format,
      hook: `Sebelum nyesel beli! Perhatikan 4 hal ini sebelum checkout ${topic}`,
      slides: [
        {
          position: 1,
          text: `Slide 1: Banyak yang kemakan angka spek di atas kertas! Padahal performa harian ditentukan oleh faktor ini.`,
          visual_direction: 'Render gadget futuristik dengan aksen biru neon modern, dark tech background.'
        },
        {
          position: 2,
          text: `Slide 2: Chipset vs Efisiensi Baterai: ${prodName ? `Spesifikasi ${prodName}` : 'Fabrikasi lebih kecil'} bikin device lebih adem dan irit daya.`,
          visual_direction: 'Diagram perbandingan performa chipset dan konsumsi daya real life.'
        },
        {
          position: 3,
          text: `Slide 3: Layar & Refresh Rate: Minimal 90Hz-120Hz AMOLED untuk scrolling TikTok dan navigasi super mulus.`,
          visual_direction: 'Macro shot layar menampilkan ketajaman panel dan responsivitas sentuhan.'
        },
        {
          position: 4,
          text: `Slide 4: Kamera: Jangan cuma liat Megapixel besar, ISP dan stabilisasi OIS jauh lebih penting untuk video jernih!`,
          visual_direction: 'Perbandingan crop foto dengan OIS aktif vs non-OIS.'
        },
        {
          position: 5,
          text: `Slide 5: Rekomendasi: Untuk budget pelajar vs profesional, sesuaikan kebutuhan bukan gengsi.`,
          visual_direction: 'Tabel skor value-for-money dan ringkasan kelebihan/kekurangan objektif.'
        }
      ],
      caption: `Biar uang kamu gak kebuang sia-sia, periksa detail ini dulu sebelum checkout gadget baru! Ada yang udah pakai? Ceritain pengalamanmu di komen ya 👇\n\n${profile.cta_style}`,
      hashtags: ['gadgetindonesia', 'technoupdate', 'smartphone', 'reviewgadget', 'techtok', 'gadgetmurah'],
      source_notes: facts.length > 0 ? facts : ['Official manufacturer spec sheets', 'Battery drain benchmarks from public tests'],
      claims_to_verify: prodName ? [`Verifikasi harga pasaran resmi dan garansi distributor ${prodName}`] : ['Pastikan tidak menyajikan benchmark fiktif'],
      disclosure_reminder: request.productContext?.affiliateDisclosureNeeded || !!prodName
        ? 'Berikan catatan harga dapat berubah sewaktu-waktu dan tautkan produk di keranjang kuning.'
        : null,
      checklist: [
        'Verifikasi keaslian spek dari lembar resmi produsen',
        'Pastikan varian RAM/Storage jelas di caption',
        'Perjelas garansi resmi vs inter jika membahas harga',
        'Link etalase toko official di keranjang kuning',
        'Cek kualitas grafis dan font tech readability'
      ]
    };
  }

  // Fashion Pria
  return {
    title: `${topic} - Pria Smart & Casual`,
    format: request.format,
    hook: `Gak perlu baju mahal! 3 rumus simpel ${topic} biar look lo auto keliatan rapi & berkelas`,
    slides: [
      {
        position: 1,
        text: `Slide 1: Penampilan rapi bukan soal merk mahal, tapi tentang potongan pakaian yang fit di badan lo!`,
        visual_direction: 'Foto portrait pria gaya minimalis modern, latar belakang arsitektur monokrom/charcoal.'
      },
      {
        position: 2,
        text: `Slide 2: Lebar pundak & panjang lengan kemeja: Garis jahitan harus tepat di ujung tulang bahu lo.`,
        visual_direction: 'Diagram siluet kemeja pria dengan titik panah penentu fit pundak & kerah.'
      },
      {
        position: 3,
        text: `Slide 3: Kombinasi celana jeans / chino: Pilih potongan slim straight, hindari yang terlalu gombrang atau ketat.`,
        visual_direction: 'Perbandingan potongan celana pada sepatu sneakers bersih / boots.'
      },
      {
        position: 4,
        text: `Slide 4: ${prodName ? `Kombinasi dengan ${prodName}` : 'Aksesoris kunci'}: Jam tangan simpel dan sabuk kulit senada bikin look terlihat matang.`,
        visual_direction: 'Detail close-up jam tangan, ikat pinggang, dan tekstur kain kemeja oxford.'
      },
      {
        position: 5,
        text: `Slide 5: Simpan panduan ini buat persiapan outfit kerja, nongkrong, atau kencan besok bro!`,
        visual_direction: 'Showcase full smart-casual outfit dengan CTA jelas ke keranjang kuning.'
      }
    ],
    caption: `Upgrade penampilan lo mulai dari hal paling mendasar: fitting yang pas! Praktis, maskulin, dan gak ribet. Save buat referensi besok pagi bro 👊\n\n${profile.cta_style}`,
    hashtags: ['fashionpria', 'mensoutfit', 'smartcasual', 'ootdpria', 'kemejapria', 'stylepria'],
    source_notes: facts.length > 0 ? facts : ['Classic menswear fit rules', 'Color coordination charts'],
    claims_to_verify: prodName ? [`Cek panduan ukuran lingkar dada & panjang badan pada katalog ${prodName}`] : ['Sertakan toleransi ukuran 1-2 cm pada deskripsi pakaian'],
    disclosure_reminder: request.productContext?.affiliateDisclosureNeeded || !!prodName
      ? 'Sematkan link kemeja/outfit di keranjang kuning TikTok.'
      : null,
    checklist: [
      'Cek kejelasan petunjuk fitting bahu dan panjang celana',
      'Pastikan foto model menampilkan proporsi realistis',
      'Cek ketersediaan ukuran produk di keranjang kuning',
      'Gunakan font maskulin tegas dengan kontras tinggi',
      'Review caption agar nada bahasa tetap lugas dan percaya diri'
    ]
  };
}

// Call AI provider (OpenAI compatible) with prompt formatting and retry
export async function generateWithAIProvider(
  request: DraftGenerationRequest,
  profile: AccountProfile,
  env: {
    AI_BASE_URL?: string;
    AI_MODEL_ID?: string;
    AI_API_KEY?: string;
    PROMPT_VERSION?: string;
  }
): Promise<GenerationResult> {
  const startTime = Date.now();
  const providerName = env.AI_BASE_URL?.includes('openai.com') ? 'OpenAI' : 'OpenAI-Compatible';
  const modelId = env.AI_MODEL_ID || 'gpt-4o-mini';
  const promptVersion = env.PROMPT_VERSION || 'v1';

  // If no API key configured, use high quality contextual generator
  if (!env.AI_API_KEY) {
    const contextualOutput = generateContextualDraft(request, profile);
    const validated = validateAndSanitizeOutput(contextualOutput, request, profile);
    return {
      output: validated.output || contextualOutput,
      outcome: 'success',
      latencyMs: Date.now() - startTime,
      inputTokens: 350,
      outputTokens: 520,
      providerName: 'Contextual-Engine (Built-in)',
      modelId: 'smart-template-engine-v1',
      promptVersion,
    };
  }

  // Construct Prompt
  const pillars = profile.content_pillars_json || '[]';
  const avoidList = profile.avoid_list_json || '[]';
  const userFacts = request.productContext?.facts?.join(', ') || 'None provided';
  const sourceNotes = request.productContext?.sourceNotes?.join(', ') || 'None provided';

  const systemMessage = `You are an expert TikTok Content Planner assistant. Produce high-performing, niche-aligned content for an Indonesian creator.
Output MUST be strict JSON matching this schema:
{
  "title": "string",
  "format": "${request.format}",
  "hook": "string",
  "slides": [{"position": 1, "text": "string", "visual_direction": "string", "image_prompt": "string (Detailed English prompt for Midjourney/Flux/Ideogram in vertical 9:16 aspect ratio combining visual scene & background from visual_direction and on-screen text from text: 'Visual & Background: ... Text on screen: \"...\" --ar 9:16')"}],
  "caption": "string",
  "hashtags": ["string"],
  "source_notes": ["string"],
  "claims_to_verify": ["string"],
  "disclosure_reminder": "string or null",
  "checklist": ["string"]
}
Do not use markdown codeblocks. Return valid JSON only. Do not invent personal trials or unsupported clinical claims.`;

  const userMessage = `Generate a ${request.format} TikTok content draft.
Account Details:
- Display Name: ${profile.display_name}
- Niche: ${profile.niche}
- Audience: ${profile.audience}
- Tone: ${profile.tone}
- Language: ${profile.language}
- Content Pillars: ${pillars}
- Avoid List: ${avoidList}
- CTA Style: ${profile.cta_style}

Content Request:
- Target Date: ${request.targetDate}
- Topic: ${request.topic || 'Pilih topik terbaik sesuai pilar konten di atas'}
- Product Name: ${request.productContext?.productName || 'N/A'}
- User Facts: ${userFacts}
- Source Notes: ${sourceNotes}
- Affiliate Disclosure Needed: ${request.productContext?.affiliateDisclosureNeeded ? 'Yes' : 'No'}`;

  const baseUrl = (env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const url = `${baseUrl}/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        output: generateContextualDraft(request, profile),
        outcome: 'provider_error',
        latencyMs: Date.now() - startTime,
        errorCode: `HTTP ${response.status}: ${errText.slice(0, 100)}`,
        providerName,
        modelId,
        promptVersion,
      };
    }

    const resJson: any = await response.json();
    const rawContent = resJson.choices?.[0]?.message?.content;
    const parsed = JSON.parse(rawContent);

    const validation = validateAndSanitizeOutput(parsed, request, profile);
    if (!validation.valid) {
      // Attempt one bounded schema repair request
      const repairResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage },
            { role: 'assistant', content: rawContent },
            { role: 'user', content: `The output failed validation with errors: ${validation.errors.join(', ')}. Please repair the JSON to strictly conform to schema.` },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (repairResponse.ok) {
        const repairJson: any = await repairResponse.json();
        const repairedParsed = JSON.parse(repairJson.choices?.[0]?.message?.content);
        const secondValidation = validateAndSanitizeOutput(repairedParsed, request, profile);
        if (secondValidation.valid && secondValidation.output) {
          return {
            output: secondValidation.output,
            outcome: 'success',
            latencyMs: Date.now() - startTime,
            inputTokens: resJson.usage?.prompt_tokens,
            outputTokens: resJson.usage?.completion_tokens,
            providerName,
            modelId,
            promptVersion,
          };
        }
      }

      return {
        output: generateContextualDraft(request, profile),
        outcome: 'schema_error',
        latencyMs: Date.now() - startTime,
        errorCode: validation.errors.join('; '),
        providerName,
        modelId,
        promptVersion,
      };
    }

    return {
      output: validation.output!,
      outcome: 'success',
      latencyMs: Date.now() - startTime,
      inputTokens: resJson.usage?.prompt_tokens,
      outputTokens: resJson.usage?.completion_tokens,
      providerName,
      modelId,
      promptVersion,
    };
  } catch (err: any) {
    return {
      output: generateContextualDraft(request, profile),
      outcome: 'provider_error',
      latencyMs: Date.now() - startTime,
      errorCode: err.message || 'Network exception',
      providerName,
      modelId,
      promptVersion,
    };
  }
}
