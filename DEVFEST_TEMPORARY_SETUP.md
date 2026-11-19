# Temporary GDG Yola DevFest setup

This repository copy is prepared for the GDG Yola DevFest demonstration. The original hosted Aetheris Health repository is separate.

## Gemini configuration

Set these variables in the deployment attached to the `Dermavant` repository, or in local `.env.local`:

```env
NEXT_PUBLIC_DEVFEST_MODE=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your_server_side_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

Keep `GEMINI_API_KEY` server-side; do not prefix it with `NEXT_PUBLIC_` or commit it. The patient consultation accepts JPEG, PNG, and WebP images up to 3 MB. Images are sent to Gemini for the current analysis and are not stored in the report record.

## What the demo shows

- Gemini handles multimodal patient triage and the doctor research chat.
- Google AI Studio is part of the prompt and API-key setup workflow.
- The Colab CNN notebooks are research experiments. They are not connected to live inference.
- Results are preliminary, may be wrong or incomplete, and are not medical diagnoses.

## Temporary rollback

To hide the DevFest banner and tool showcase and restore the normal page metadata, set:

```env
NEXT_PUBLIC_DEVFEST_MODE=false
```

That variable is read during the Next.js build, so redeploy after changing it. To switch the AI endpoint back to the retained Groq text path, set `AI_PROVIDER=groq` and configure `GROQ_API_KEY`. Groq mode does not analyze images; the image picker is hidden in that mode. Set `AI_PROVIDER=gemini` again to restore image analysis.

The existing hosted site remains on its separate repository and deployment. Do not change its Git remote or deployment settings for this temporary presentation.
