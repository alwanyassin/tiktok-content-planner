import { describe, it, expect } from 'vitest';
import { validateAndSanitizeOutput, generateContextualDraft } from '../functions/api/ai-adapter';
import { AccountProfile, DraftGenerationRequest } from '../functions/api/types';

describe('TikTok Content Planner — Core Logic & Validation Tests', () => {
  const dummyProfile: AccountProfile = {
    id: 'profile_beauty_01',
    slug: 'beauty-personal-care',
    display_name: 'Beauty & Personal Care',
    handle: '@glowandcare.id',
    niche: 'Skincare & Makeup Education',
    audience: 'Remaja & wanita 18-35 tahun',
    language: 'id-ID',
    tone: 'Edukatif & ramah',
    content_pillars_json: JSON.stringify(['Edukasi Kandungan Skincare', 'Tutorial Rutinitas']),
    avoid_list_json: JSON.stringify(['Klaim instan putih 3 hari']),
    preferred_formats_json: JSON.stringify(['carousel']),
    cta_style: 'Simpan konten ini!',
    active: 1,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    content_pillars: ['Edukasi Kandungan Skincare', 'Tutorial Rutinitas'],
    avoid_list: ['Klaim instan putih 3 hari'],
    preferred_formats: ['carousel'],
  };

  it('validates standard AI structured output successfully', () => {
    const rawAiOutput = {
      title: 'Panduan Layering Serum',
      format: 'carousel',
      hook: 'Urutan pakai serum yang benar biar gak sia-sia!',
      slides: [
        { position: 1, text: 'Slide 1: Mulai dari tekstur paling cair.', visual_direction: 'Botol serum' },
        { position: 2, text: 'Slide 2: Tunggu meresap sebelum produk berikutnya.', visual_direction: 'Tekstur gel' },
      ],
      caption: 'Yuk praktekin cara layering ini ya teman-teman!',
      hashtags: ['skincaretips', 'layeringskincare'],
      source_notes: ['Dermatological guidelines'],
      claims_to_verify: [],
      checklist: ['Cek jenis kulit', 'Review audio'],
    };

    const request: DraftGenerationRequest = {
      profileId: dummyProfile.id,
      targetDate: '2026-10-10',
      format: 'carousel',
    };

    const result = validateAndSanitizeOutput(rawAiOutput, request, dummyProfile);
    expect(result.valid).toBe(true);
    expect(result.output).toBeDefined();
    expect(result.output?.title).toBe('Panduan Layering Serum');
    expect(result.output?.slides.length).toBe(2);
  });

  it('detects banned/unsupported claims and flags them into claims_to_verify', () => {
    const rawAiOutputWithBannedClaim = {
      title: 'Serum Ajaib',
      format: 'carousel',
      hook: 'Pasti putih dalam 3 hari dengan serum ini!',
      slides: [
        { position: 1, text: 'Gak usah ragu, pasti putih dalam 3 hari!', visual_direction: 'Foto wajah glowing' },
      ],
      caption: 'Coba sekarang juga!',
      hashtags: ['serumviral'],
      source_notes: [],
      claims_to_verify: [],
    };

    const request: DraftGenerationRequest = {
      profileId: dummyProfile.id,
      targetDate: '2026-10-10',
      format: 'carousel',
    };

    const result = validateAndSanitizeOutput(rawAiOutputWithBannedClaim, request, dummyProfile);
    expect(result.valid).toBe(true);
    // Banned claim must be flagged in claims_to_verify per Spec FR-08
    expect(result.output?.claims_to_verify.length).toBeGreaterThan(0);
    expect(result.output?.claims_to_verify[0]).toContain('PERINGATAN: Deteksi klaim berlebihan');
  });

  it('enforces affiliate disclosure reminder when affiliate context or product is supplied', () => {
    const rawAiOutput = {
      title: 'Review Serum',
      format: 'carousel',
      hook: 'Serum lokal terbaik bulan ini!',
      slides: [{ position: 1, text: 'Kandungan 5% Niacinamide', visual_direction: 'Kemasan' }],
      caption: 'Beli sekarang!',
      hashtags: ['skincare'],
    };

    const request: DraftGenerationRequest = {
      profileId: dummyProfile.id,
      targetDate: '2026-10-10',
      format: 'carousel',
      productContext: {
        productName: 'Glow Serum',
        affiliateDisclosureNeeded: true,
      },
    };

    const result = validateAndSanitizeOutput(rawAiOutput, request, dummyProfile);
    expect(result.valid).toBe(true);
    expect(result.output?.disclosure_reminder).toBeDefined();
    expect(result.output?.disclosure_reminder).toContain('#affiliate');
  });

  it('produces high quality contextual draft matching account niche', () => {
    const request: DraftGenerationRequest = {
      profileId: dummyProfile.id,
      targetDate: '2026-10-10',
      format: 'carousel',
      topic: 'Layering Niacinamide',
    };

    const draft = generateContextualDraft(request, dummyProfile);
    expect(draft.title).toContain('Layering Niacinamide');
    expect(draft.slides.length).toBe(5);
    expect(draft.hashtags.length).toBeGreaterThan(0);
    expect(draft.checklist.length).toBeGreaterThan(0);
  });

  it('generates and sanitizes vertical 9:16 image generation prompts for slides', () => {
    const rawAiOutput = {
      title: 'Fashion OOTD',
      format: 'carousel',
      hook: 'Inspirasi outfit weekend!',
      slides: [
        {
          position: 1,
          text: 'Slide 1: Kombinasi jeans high waist',
          visual_direction: 'Model OOTD kasual aesthetic',
          image_prompt: 'Full body 9:16 vertical fashion photography of Asian woman in casual high-waist jeans, bright minimalist street style, soft daylight --ar 9:16'
        },
        {
          position: 2,
          text: 'Slide 2: Atasan knit sweater',
          visual_direction: 'Flatlay sweater rajut lembut'
        }
      ],
      caption: 'Save buat referensi besok!',
      hashtags: ['ootd', 'fashion'],
    };

    const request: DraftGenerationRequest = {
      profileId: dummyProfile.id,
      targetDate: '2026-10-10',
      format: 'carousel',
    };

    const result = validateAndSanitizeOutput(rawAiOutput, request, dummyProfile);
    expect(result.valid).toBe(true);
    expect(result.output?.slides[0].image_prompt).toContain('Full body 9:16');
    // Fallback generator should supply 9:16 prompt for slide 2 where it was omitted
    expect(result.output?.slides[1].image_prompt).toBeDefined();
    expect(result.output?.slides[1].image_prompt).toContain('9:16');
  });
});

