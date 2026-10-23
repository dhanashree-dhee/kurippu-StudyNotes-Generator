<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Study notes are generated server-side by sending the YouTube URL straight to a Gemini video-capable model (chat completions `video_url` part) — it reads frames, audio and on-screen text, so silent/caption-less videos still work without transcript scraping.
- The AI fills a strict JSON schema (`src/lib/notes-types.ts`); UI sections render from that shape, so change the schema and the view together.
- Diagrams are Mermaid code rendered client-side via dynamic import; styling lives in `.notes-diagram` rules in `src/styles.css`.
- Recent notes are kept in browser localStorage only (no backend), to stay account-free.
