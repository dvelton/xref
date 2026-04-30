# Xref - Cross-reference resolver for legal documents

This plugin resolves cross-references, defined terms, and external statutory citations in legal documents, producing an interactive HTML viewer.

## For Copilot

When users ask about cross-references in legal documents or want to make a document navigable, activate the xref skill.

See `skills/xref/SKILL.md` for full workflow instructions.

## Key capabilities

- Parses Word documents and PDFs to extract section structure
- Identifies internal cross-references (Section X, Article Y, Schedule Z)
- Extracts defined terms and their definitions
- Detects external statutory citations (US Code, CFR, GDPR, UK legislation, EU regulations)
- Resolves all references to their targets
- Fetches external statute text from public databases with caching
- Produces a self-contained interactive HTML file

## Typical workflow

Use the one-command pipeline unless you are debugging parser output:

```bash
python3 skills/xref/tools/xref.py run --source "<path-to-document>"
```

The command extracts structure, finds references and defined terms, resolves targets, optionally fetches external citations, builds the interactive HTML viewer, and reports document health statistics.

See SKILL.md for detailed step-by-step instructions.
