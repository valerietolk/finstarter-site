# Builds the Artifact copy of finstarter/index.html:
# strips the document wrapper (the Artifact host adds its own) and adds a
# preview-only rule that scales the fixed 1920px design down to narrower viewports.
param([string]$src, [string]$out)
$html = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8)
$html = $html -replace '(?s)^.*?<head>\s*', ''
$html = $html -replace '(?s)</head>\s*<body>\s*', ''
$html = $html -replace '(?s)\s*</body>\s*</html>\s*$', ''
$html = $html -replace '<meta charset="UTF-8">\s*', ''
$html = $html -replace '<meta name="viewport" content="width=device-width, initial-scale=1">\s*', ''
[IO.File]::WriteAllText($out, $html, (New-Object Text.UTF8Encoding $false))
"built " + (Get-Item $out).Length
