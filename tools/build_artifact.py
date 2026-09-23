# Builds the Artifact copy of site/index.html (same as build_artifact.ps1, for macOS/Linux):
# strips the document wrapper — the Artifact host adds its own.
import re, sys
src, out = sys.argv[1], sys.argv[2]
html = open(src, encoding='utf-8').read()
html = re.sub(r'(?s)^.*?<head>\s*', '', html)
html = re.sub(r'(?s)</head>\s*<body>\s*', '', html)
html = re.sub(r'(?s)\s*</body>\s*</html>\s*$', '', html)
html = re.sub(r'<meta charset="UTF-8">\s*', '', html)
html = re.sub(r'<meta name="viewport" content="width=device-width, initial-scale=1">\s*', '', html)
open(out, 'w', encoding='utf-8').write(html)
print('built', len(html.encode('utf-8')))
