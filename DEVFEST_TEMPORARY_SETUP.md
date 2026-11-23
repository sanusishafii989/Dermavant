# GDG Yola DevFest 2026 Setup — Dermavant

Built by **Sanusi Shafii** for **GDG Yola DevFest 2026**.  
This project is designed to run on **100% free-tier Google AI tools** alongside free-tier web infrastructure.

## Free Google Tools Stack

1. **Google Gemini API (Free Tier via Google AI Studio)**
   - Multimodal skin image + symptom triage (`/api/ai/chat`)
   - Doctor clinical research chat (`/api/doctor/research`)
   - Grounded dermatology RAG embeddings (`gemini-embedding-2` over `knowledge_base-1.json`)
2. **Google AI Studio**
   - Prompt design, structured JSON schema validation, and free API key provisioning
3. **Google Colab / Kaggle (Free T4 GPU)**
   - Open EfficientNet-B0 dermatology CNN research notebooks under `notebooks/` (clinician-review baselines, kept separate from live triage)

## Environment Variables

Set these variables in your deployment or local `.env.local`:

```env
NEXT_PUBLIC_DEVFEST_MODE=true
GEMINI_API_KEY=your_server_side_google_ai_studio_key
GEMINI_MODEL=gemini-4-hydrogen
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

- Keep `GEMINI_API_KEY` server-side only (never prefix with `NEXT_PUBLIC_` or commit it).
- Patient consultation accepts JPEG, PNG, and WebP images up to 3 MB.
- Results are preliminary educational triage and **not** a medical diagnosis.

## Toggling DevFest Showcase Mode

To hide the DevFest banner and Google tools showcase card while keeping the platform active, set:

```env
NEXT_PUBLIC_DEVFEST_MODE=false
```

Rebuild/redeploy after changing `NEXT_PUBLIC_DEVFEST_MODE`.
