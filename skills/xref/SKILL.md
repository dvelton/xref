---
name: xref
description: 'Cross-reference and defined term resolver for legal documents. Produces an interactive HTML viewer where every internal reference, defined term, and external statutory citation is hoverable/expandable in place.'
---

# Xref

Resolve cross-references and defined terms in legal documents. When activated, Xref produces an interactive HTML file on your Desktop where every internal reference, defined term, and external citation becomes hoverable/expandable, eliminating the need to scroll back and forth while reading.

## Activation

When the user invokes this skill with phrases like:
- "use xref on..."
- "run xref..."
- "resolve the cross-references in..."
- "make this document navigable"
- "link up the references in..."

Respond with:

> **Xref is active.** I'll parse the document, resolve all cross-references and defined terms, and produce an interactive HTML viewer on your Desktop.

Then follow the workflow below.

## Supported Sources

- **Word documents** (.docx): Primary and most reliable input format
- **PDF files** (.pdf): Supported but less reliable due to lack of semantic structure
- **Web URLs**: Requires optional Playwright dependency (installed via `bash setup.sh --web`)

## Tool Location

The Xref Python utility is located at:
```
<plugin_dir>/skills/xref/tools/xref.py
```

To find the actual path, run:
```bash
find ~/.copilot/installed-plugins -name "xref.py" -path "*/xref/*" 2>/dev/null
```

If not found there, check the project directory at `/Users/dvelton/Projects/xref`.

## First-Run Setup

Before first use, check that dependencies are installed:

```bash
python3 <path-to>/xref.py setup-check
```

If anything is missing, run the setup script from the xref plugin directory:
```bash
bash <path-to>/setup.sh
```

Or install manually:
```bash
pip3 install python-docx pymupdf beautifulsoup4 requests lxml jinja2
```

For web URL support (optional):
```bash
bash <path-to>/setup.sh --web
```

## Workflow

Follow these steps in order. The order matters.

### Step 1: Extract document structure

Run the extract-structure command to parse the document:

```bash
python3 xref.py extract-structure --source "<path-to-document>"
```

This outputs JSON with:
- `sections`: Hierarchical section tree with id, number, title, level, text, children
- `defined_terms`: All defined terms with their definitions and scope
- `numbering_scheme`: Detected numbering convention (decimal, article-section, etc.)
- `parser_confidence`: Overall confidence level and any uncertain regions

Save this output to a file (e.g., `structure.json`).

**Review the output:**
- Check the `parser_confidence` field for uncertain regions
- Verify the section hierarchy makes sense
- Check that defined terms were correctly identified

**For Word documents:** The parser uses Word's heading styles (Heading 1, 2, 3) as strong signals. Results should be highly accurate.

**For PDFs:** The parser uses font-size heuristics to identify headings. Check the `uncertain_regions` field for areas where the parser was uncertain.

### Step 2: Refine the structure if needed

If the parser flagged uncertainties or the section structure looks wrong, you may need to manually correct the structure JSON.

**Common structural ambiguities to handle:**

1. **Numbering restarts in exhibits/schedules:** The main body uses Sections 1-15, then Schedule A restarts at Section 1. Treat schedules as separate structural units.

2. **Missing parent sections:** Section 3.1 and Section 3.2 exist but no Section 3 heading. Infer the parent.

3. **Inconsistent schemes mid-document:** The contract switches from "Section 1.1" to "Clause 2.1" partway through. Treat these as equivalent structural levels.

4. **Lettered subsections ambiguity:** "(a)" could be a subsection of the preceding numbered section or a standalone list item. Use indentation and context to determine hierarchy.

5. **Recitals/whereas clauses:** Not numbered but often referenced. Create a structural entry for them.

**AI refinement guidelines:**

- Preserve the parser's output where it's correct; only fix what's wrong
- Treat the extracted text as the ground truth -- never invent sections or definitions that aren't in the text
- When numbering is ambiguous, prefer the interpretation that produces a consistent hierarchy
- Handle signature blocks and boilerplate at the end as non-section content
- When the parser finds multiple possible targets for an ambiguous reference, rank the candidates and flag the uncertainty rather than silently picking one
- Never resolve an unresolvable reference by guessing -- mark it as unresolved with the reason

**Validation:** After making corrections, re-run the reference detection and resolution steps to verify that previously unresolvable references now resolve.

### Step 3: Find all references

Run the find-references command to scan for cross-references, defined term usages, and external citations:

```bash
python3 xref.py find-references --source "<path-to-document>"
```

This outputs JSON with:
- `internal_references`: Section/Article/Clause references, Schedule/Exhibit references
- `defined_term_usages`: Each use of a defined term in the document
- `external_citations`: US Code, CFR, UK legislation, EU regulations, GDPR
- `unresolved`: References that couldn't be categorized (potential false positives or unsupported formats)

Save this output to a file (e.g., `references.json`).

**Review the output:**
- Check for false positives (text that looks like a reference but isn't)
- Check for missed references (patterns the parser didn't catch)

### Step 4: Resolve references

Run the resolve-references command to match references to their targets:

```bash
python3 xref.py resolve-references \
  --structure structure.json \
  --references references.json
```

This outputs a fully resolved graph with:
- Each internal reference matched to its target section (or marked as unresolved)
- Ambiguous references resolved using preference order: exact match > case-insensitive match > numeric equivalent
- Section-scoped definitions correctly applied
- Circular reference chains detected
- Unresolved items categorized by type: broken_reference, undefined_term, external_document, unsupported_citation

Save this output to a file (e.g., `resolved.json`).

**Review unresolved items:**
- If a reference looks like it should resolve (e.g., "Section 4" not matching because the parser labeled it "Article 4"), fix the structure and re-resolve
- Broken references may indicate drafting errors in the source document -- these are useful to surface
- External document references ("the Master Agreement") are expected and should be marked as such, not as errors

### Step 5: Fetch external citations (if any)

If the document contains external statutory citations, fetch their text:

```bash
python3 xref.py fetch-external --citations '[
  {"citation_type": "us_code", "title": "17", "section": "512"},
  {"citation_type": "eu_regulation", "regulation": "GDPR", "article": "28"}
]'
```

This fetches statute text from public legal databases with:
- Local caching (in `~/.xref/cache/`) to avoid redundant network calls
- Retry logic (3 retries with exponential backoff)
- Rate limiting to avoid being blocked
- Pre-bundled GDPR (most commonly referenced regulation in commercial contracts)
- Fallback to hyperlink if fetch fails

The output is JSON with the fetched statute text, heading, and source URL.

Save this output to a file (e.g., `externals.json`).

**Note:** This step is optional. If you skip it or if fetches fail, the build step will still work -- external citations will be rendered as hyperlinks instead of inline text.

### Step 6: Build the output

Run the build command to assemble the interactive HTML viewer:

```bash
python3 xref.py build \
  --source "<path-to-document>" \
  --output ~/Desktop/<document-name>-xref.html \
  --resolved resolved.json \
  --externals externals.json \
  --title "Document Title"
```

Optional flags:
- `--compact`: Omit external statute text for smaller file size (external citations become hyperlinks)

The build step produces a self-contained HTML file with:
- All CSS and JavaScript inlined (no external dependencies)
- The full document text rendered in clean semantic HTML
- Every internal reference, defined term, and external citation marked up as interactive elements
- Pre-rendered hover panels for instant display (<50ms from hover to panel)
- Sidebar with glossary, document health report, and table of contents
- Keyboard shortcuts (Escape, n/N, g, h, s, /, t)
- Navigation stack for jump-to-section and back
- Document provenance bar (source hash, timestamp)
- Print mode via CSS @media print

Save the output to the user's Desktop.

### Step 7: Report results

Tell the user what was found:

- **N internal references resolved** (N unresolved)
- **N defined terms indexed** (N used but undefined, N defined but never used)
- **N external citations fetched** (N failed, N from cache/bundled)
- **N circular reference chains detected**
- **Any document health issues** worth noting (e.g., "3 broken references that appear to be drafting errors")

Example:

> **Done.** Saved to `~/Desktop/vendor-agreement-xref.html`
> 
> - 47 internal references resolved (2 unresolved)
> - 23 defined terms indexed (1 undefined term: "Approved Vendor List")
> - 3 external citations fetched (2 from cache, 1 bundled GDPR)
> - Document health: 2 broken references (Section 14.6, Section 9.8) likely indicate drafting errors

## Error Handling

**If extract-structure fails:**

"This document doesn't have extractable text -- it may be a scanned image. Try providing a Word (.docx) version instead, or use OCR software to create a text layer first."

**If most references don't resolve:**

"The section structure looks unusual and many cross-references can't be matched. The output will show these as unresolved. If you have a Word version of this document, that would produce better results."

**If external citation fetching fails:**

Don't fail the entire build. External citations will be rendered as hyperlinks instead of inline text. Mention this in the results report.

## Notes

- The interactive HTML viewer is optimized for legal documents (contracts, legislation, regulations)
- All hover content is pre-rendered in the DOM for instant display -- no lazy-loading or computation on hover
- The viewer works in any modern browser with no server required
- Print mode renders defined terms with parenthetical definitions and cross-references with footnotes
- Touch support: on mobile devices, tap to open panels instead of hover
