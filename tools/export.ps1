param([string]$outDir)
$sp = Split-Path $PSCommandPath
$tok = (Get-Content "$sp\figma_token.txt" -Raw).Trim()
$h = @{ "X-Figma-Token" = $tok }
$file = "cYq7eMIYNFVB2I0VSWinVc"
New-Item -ItemType Directory -Force $outDir | Out-Null

function Export($map, $format, $scale) {
  $ids = ($map.Keys | ForEach-Object { [uri]::EscapeDataString($_) }) -join ","
  $url = "https://api.figma.com/v1/images/$file" + "?ids=$ids&format=$format&scale=$scale"
  $r = Invoke-RestMethod -Uri $url -Headers $h
  foreach ($k in $map.Keys) {
    $u = $r.images.$k
    if (-not $u) { "MISSING $k"; continue }
    $name = $map[$k] + "." + $format
    Invoke-WebRequest -Uri $u -OutFile (Join-Path $outDir $name)
    "$name " + (Get-Item (Join-Path $outDir $name)).Length
  }
}

$svgs = @{
  "I14:12175;14:11905" = "logo-nav";
  "I14:12185;14:11440" = "logo-footer";
  "I14:12175;14:11909;14:11839" = "chevron";
  "I14:12177;14:11716;14:11518;14:12130" = "check";
}
Export $svgs "svg" 1

$pngs = @{
  "I14:12176;14:11755" = "hero-collage";
  "I14:12178;14:11495;14:11567" = "company-1";
  "I14:12178;14:11496;14:11567" = "company-2";
  "I14:12178;14:11497;14:11567" = "company-3";
  "I14:12178;14:11498;14:11567" = "company-4";
  "I14:12178;14:11499;14:11567" = "company-5";
  "I14:12178;14:11500;14:11567" = "company-6";
  "I14:12179;14:11414;14:12149" = "feature-1";
  "I14:12179;14:11415;14:12149" = "feature-2";
  "I14:12179;14:11416;14:12149" = "feature-3";
  "I14:12179;14:11418;14:12149" = "feature-4";
  "I14:12179;14:11419;14:12149" = "feature-5";
  "I14:12179;14:11420;14:12149" = "feature-6";
}
Export $pngs "png" 2
