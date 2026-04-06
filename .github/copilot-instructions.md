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

1. Extract structure from source document
2. Find all references
3. Resolve references to targets
4. Fetch external citations (optional)
5. Build interactive HTML viewer
6. Report results with document health statistics

See SKILL.md for detailed step-by-step instructions.
