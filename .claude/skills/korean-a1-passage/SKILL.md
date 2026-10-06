# Korean A1 Daily Passage Generator

## Usage

```
/korean-a1-passage [YYYY-MM-DD]
```

- **CI (GitHub Actions)**: use the date given in the prompt. The workflow passes today's date in Europe/London time.
- **With date argument**: generate a passage for that specific date.

## CI Environment Notes

- The working directory is the repository root. All paths in this skill are relative to the repo root.
- Bash is not available. Use only Read / Write / Edit / Glob / Grep.
- Do NOT run git. The workflow commits and pushes.

## Purpose

Run once every morning to get a short TOPIK 1 / beginner Korean reading passage and a complete study set.

## Korean A1 Level Criteria

- **Vocabulary**: Beginner level (greetings, numbers, family words, food, colors, simple daily actions, basic nouns). TOPIK 1 vocabulary list as reference.
- **Grammar**: Formal polite endings (-아요/어요/해요, -입니다/입니까), basic particles (은/는, 이/가, 을/를, 에, 에서, 와/과, 도, 만), negation (안, -지 않다), basic question forms, simple connectives (그리고, 그런데, 그래서, 하지만). Avoid relative clauses, honorifics beyond 요-form, and complex grammar patterns.
- **Length**: 100–150 words (Korean word count)
- **Structure**: 3–4 short paragraphs
- **Sentence complexity**: Short, simple sentences. One clause per sentence where possible.
- **Script**: Hangul only in the passage body. No romanization in the passage.

## Cultural Setting

Use Korean cultural settings and references:
- Places: 서울, 부산, 학교, 식당, 카페, 시장, 공원, 지하철
- Food: 밥, 김치, 불고기, 떡볶이, 라면, 삼겹살
- Daily life: 한국 일상에 合わせた自然な場面設定
- Names: Use common Korean names (민준, 지수, 현우, 소연, 태양, etc.)

## Theme Pool

Select randomly from the following categories (use a different theme each time):

1. **일상생활 (Daily life)**: Shopping, cooking, home, commuting
2. **여행 (Travel & tourism)**: Café visits, asking for directions, visiting a city
3. **학교/직장 (Work & school)**: School life, simple workplace situations
4. **건강/스포츠 (Health & sports)**: Sports, doctor visits, healthy habits
5. **문화/사회 (Culture & society)**: Festivals, traditions, cultural events
6. **미디어/오락 (Media & entertainment)**: Movies, music, simple social activities
7. **인간관계 (Relationships)**: Family, friends, meeting someone new

## History Management (Avoiding Repetition)

Use a `history.json` file in the project directory to track past outputs.

### Reading on Execution

Before generating a passage, check whether `history.json` exists.

- **If the file exists**: Read it and review past theme categories, subtopics, titles, and vocabulary.
- **If the file does not exist**: Treat it as an empty state and proceed as a first run.

### Theme Selection Logic

1. Check the categories of the most recent 7 entries in `history.json`
2. If all 7 categories appear in the last 7 entries, reset the rotation
3. Prioritize categories that have not appeared yet
4. Even within the same category, avoid repeating subtopics

### Vocabulary Overlap Check

A `vocab-used.json` at the project root maintains a flat sorted array of every vocabulary word ever used.

**On execution:**
1. Read `vocab-used.json` (treat as `[]` if not exists).
2. When selecting 6–10 key vocabulary items for Part 3, only pick words not in `vocab-used.json`.
3. Allow at most **1 repeat** if unavoidable.

**After generating:**
4. Append new vocabulary words, re-sort alphabetically (case-insensitive), deduplicate, and save.
5. Save `vocab-used.json` (the workflow commits it).

### history.json Format

```json
{
  "entries": [
    {
      "date": "2026-06-11",
      "category": "일상생활",
      "subtopic": "At the café",
      "title": "카페에서",
      "vocab": ["카페", "커피", "주문하다", "맛있다", "친구"]
    }
  ]
}
```

File path: `history.json` (repo root)

## Output Format

Write everything to `passages/YYYY-MM-DD/` (relative to the repo root), outputting two files:
- `passages/YYYY-MM-DD/YYYY-MM-DD.md` — Markdown format
- `passages/YYYY-MM-DD/YYYY-MM-DD.html` — HTML format (styled, self-contained)

Do NOT output the passage content to the CLI — only write to the files.

### Part 1: Passage

```
📖 오늘의 지문 — [Theme category]
제목: [Title]

[Passage body (Korean / Hangul only)]
```

### Part 2: Japanese Translation

A natural Japanese translation of the full passage body.

In the HTML output, Part 1 and Part 2 must be rendered **side by side** using a two-column flexbox layout (`.passage-columns`). Korean on the left, Japanese on the right. On mobile (max-width: 700px), they stack vertically. Use `<div class="passage-col-label">` labels instead of headings.

Do **NOT** include a text-to-speech (TTS) button or any related JavaScript.

```
🇯🇵 日本語訳

[Japanese translation paragraph by paragraph]
```

### Part 3: Vocabulary List (6–10 words)

The vocabulary table must include a **읽는 법** (pronunciation) column showing the standard Korean reading in parenthetical form.

```
📝 어휘 목록

| 단어 | 읽는 법 | 품사 | 意味 (JP) | English | 예문 |
|------|---------|------|-----------|---------|------|
| ...  | ...     | ...  | ...       | ...     | ...  |
```

- **읽는 법**: Standard pronunciation (e.g., 학교 → [학꾜], 먹다 → [먹따]). Only note when pronunciation differs noticeably from spelling.
- **품사**: 명사, 동사, 형용사, 부사, etc.

> **問題と解答は作らない。** 出力は Part 1〜3（本文・訳・語彙）だけにする。Markdown にも HTML にも、読解問題・解答・解説のセクションを入れない。

## Execution Steps

1. **Determine target date**: Use the date given in the prompt.
2. **Check for existing output**: If `passages/YYYY-MM-DD/YYYY-MM-DD.md` already exists, stop and output:
   `⚠️ passages/YYYY-MM-DD/ already exists. To regenerate, delete the folder first.`
3. Read `history.json` (treat as empty if not exists).
4. Select a non-overlapping theme category and subtopic.
5. Generate an A1-level Korean passage in Hangul.
6. Write a natural Japanese translation.
7. Extract 6–10 key vocabulary words with pronunciation and part of speech. Cross-reference `vocab-used.json`. Replace overlaps until at most 1 remains.
8. Append to `history.json` and save.
9. Create `passages/YYYY-MM-DD/` directory.
10. Write `.md` and `.html` files.
11. Update `index.html` — prepend a new `<li>` at the top of `<ul class="list">`:
    ```html
    <li data-date="YYYY-MM-DD" data-category="CATEGORY">
      <a href="passages/YYYY-MM-DD/YYYY-MM-DD.html">
        <span class="title-text">TITLE</span>
        <span class="tag">CATEGORY</span>
        <span class="date">YYYY-MM-DD</span>
      </a>
    </li>
    ```
    Category values: `일상생활`, `여행`, `학교/직장`, `건강/스포츠`, `문화/사회`, `미디어/오락`, `인간관계`
12. Copy HTML to `today.html` at the repo root.
13. Do NOT run git. The workflow commits and pushes.
14. Output confirmation:
    `✅ Saved to passages/YYYY-MM-DD/ — [Title]`

## HTML Styling

Use the same visual style as the DELE B1 passages (Georgia serif, warm tan border `#d4a96a`, max-width 1100px). Left column uses `.passage-box` (gold border), right column uses `.translation-box` (blue border, background `#f0f4ff`). For Korean text, add `word-break: keep-all; line-height: 2;` to `.passage-box` and `.translation-box` for readability.

## Quality Checks

- Passage is 100–150 Korean words
- No vocabulary or grammar above A1/TOPIK 1
- Theme differs from recent 7 entries (checked via `history.json`)
- Pronunciation (읽는 법) column is filled for all vocabulary items
- `history.json` and `vocab-used.json` are updated
