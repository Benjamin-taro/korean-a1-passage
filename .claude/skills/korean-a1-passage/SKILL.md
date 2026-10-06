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
2. When selecting the NEW vocabulary items for Part 3, only pick words not in `vocab-used.json`.
3. Allow at most **1 repeat** if unavoidable.

**After generating:**
4. Append new vocabulary words, re-sort alphabetically (case-insensitive), deduplicate, and save.
5. Save `vocab-used.json` (the workflow commits it).

### Review Words (meet old words again)

New words alone are never met again, so every passage must also **reuse words from earlier passages**. This overrides the "only new words" rule above for the review words (the "at most 1 repeat" limit applies to the NEW words only).

1. Read `read.json` at the repository root (treat as `{"read": {}, "level": {}}` if missing). `read` maps the dates of passages the learner has finished reading.
2. Review candidates = the `vocab` of `history.json` entries whose `date` is a key of `read`. Words from passages not yet read are not candidates.
3. Prefer words first seen **3–30 days before the target date**; if there are too few, use older ones. Do not pick words listed in the `review` array of the 3 most recent history entries.
4. Choose **2–4 review words** that fit today's theme and use them naturally in the passage body. Do not force a word that does not fit — pick another candidate instead.
5. The vocabulary table (Part 3) contains **4–6 new words** (not in `vocab-used.json`) **plus the 2–4 review words** (6–10 rows in total). Put new words first, then review words. Prefix each review word with `🔁 ` in the first column, and add this line under the table: `🔁 = 以前の passage に出た単語（復習）`. In the HTML, give review rows `class="review"` with a light background (`#f3f8f1`).
6. In the new `history.json` entry, keep `vocab` for the new words only and add `"review": ["...", "..."]` for the review words. Do **not** add review words to `vocab-used.json` again.
7. If there are no review candidates yet (nothing read), skip review words and use new words only.

### Difficulty Adjustment (learner feedback)

`read.json` may contain `level`: a map of date → `"easy"` | `"ok"` | `"hard"`, the learner's rating of that passage. Look at the **5 most recently rated** passages:

- **3 or more `"hard"`** → make it easier: length at the lower end of the range, shorter sentences, new words at the minimum count, review words at the maximum count.
- **3 or more `"easy"`** → make it harder, still inside the A1 limits defined above: length at the upper end of the range, more varied sentence structures that the level allows, new words at the maximum count.
- Otherwise → keep the usual difficulty.

Never go outside the A1 level definition. Record the decision in the new `history.json` entry as `"difficulty": "easier" | "same" | "harder"`.

### history.json Format

```json
{
  "entries": [
    {
      "date": "2026-06-11",
      "category": "일상생활",
      "subtopic": "At the café",
      "title": "카페에서",
      "vocab": ["카페", "커피", "주문하다", "맛있다", "친구"],
      "review": ["...", "..."],
      "difficulty": "same"
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

### Part 3: Vocabulary List (4–6 new + 2–4 review words)

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
4. Read `read.json` (treat as empty if it does not exist). Decide the difficulty (Difficulty Adjustment) and choose the review words (Review Words) before writing.
5. Select a non-overlapping theme category and subtopic.
6. Generate an A1-level Korean passage in Hangul.
7. Write a natural Japanese translation.
8. Build the vocabulary table: 4–6 new words (cross-reference `vocab-used.json`; replace overlaps until at most 1 remains) plus the 2–4 review words chosen above, each with all required columns.
9. Append to `history.json` and save.
10. Create `passages/YYYY-MM-DD/` directory.
11. Write `.md` and `.html` files.
12. Update `index.html` — prepend a new `<li>` at the top of `<ul class="list">`:
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
13. Copy HTML to `today.html` at the repo root.
14. Do NOT run git. The workflow commits and pushes.
15. Output confirmation:
    `✅ Saved to passages/YYYY-MM-DD/ — [Title]`

## HTML Styling

Use the same visual style as the DELE B1 passages (Georgia serif, warm tan border `#d4a96a`, max-width 1100px). Left column uses `.passage-box` (gold border), right column uses `.translation-box` (blue border, background `#f0f4ff`). For Korean text, add `word-break: keep-all; line-height: 2;` to `.passage-box` and `.translation-box` for readability.

## Quality Checks

- Passage is 100–150 Korean words
- No vocabulary or grammar above A1/TOPIK 1
- Theme differs from recent 7 entries (checked via `history.json`)
- Pronunciation (읽는 법) column is filled for all vocabulary items
- `history.json` and `vocab-used.json` are updated
