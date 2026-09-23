param([string]$in, [string]$out, [int]$maxDepth = 50, [string]$startId = "", [string[]]$stopNames = @())
[System.Threading.Thread]::CurrentThread.CurrentCulture = [System.Globalization.CultureInfo]::InvariantCulture
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = [int]::MaxValue
$ser.RecursionLimit = 1000
$raw = [IO.File]::ReadAllText($in)
$doc = $ser.DeserializeObject($raw)
$sb = New-Object System.Text.StringBuilder
$originX = 0; $originY = 0

function C($c, $a) {
  $r = [math]::Round($c["r"]*255); $g = [math]::Round($c["g"]*255); $b = [math]::Round($c["b"]*255)
  $al = $c["a"]; if ($a -ne $null) { $al = $a }
  if ($al -eq 1) { return ("#{0:x2}{1:x2}{2:x2}" -f [int]$r,[int]$g,[int]$b) }
  return ("rgba({0},{1},{2},{3})" -f $r,$g,$b,[math]::Round($al,3))
}
function Paint($p) {
  $t = $p["type"]; $vis = $p["visible"]; $vs = ""; if ($vis -eq $false) { $vs = "[HIDDEN]" }
  $op = $p["opacity"]
  if ($t -eq "SOLID") { $o = if ($op -ne $null) { $op } else { 1 }; return ((C $p["color"] $o) + $vs) }
  if ($t -like "GRADIENT_*") {
    $h = ($p["gradientHandlePositions"] | ForEach-Object { "(" + [math]::Round($_["x"],3) + "," + [math]::Round($_["y"],3) + ")" }) -join ""
    $s = ($p["gradientStops"] | ForEach-Object { (C $_["color"] $null) + " " + [math]::Round($_["position"]*100,1) + "%" }) -join ", "
    $os = ""; if ($op -ne $null) { $os = " op=$op" }
    return "$t$h[$s]$os$vs"
  }
  if ($t -eq "IMAGE") { return "IMG(" + $p["imageRef"].Substring(0,8) + "," + $p["scaleMode"] + ")" + $vs }
  return "$t$vs"
}
function Walk($n, $d) {
  if ($d -gt $maxDepth) { return }
  $ind = "  " * $d
  $bb = $n["absoluteBoundingBox"]
  $pos = ""
  if ($bb) { $pos = (" [{0},{1} {2}x{3}]" -f [math]::Round($bb["x"]-$script:originX,1),[math]::Round($bb["y"]-$script:originY,1),[math]::Round($bb["width"],1),[math]::Round($bb["height"],1)) }
  $vis = ""; if ($n["visible"] -eq $false) { $vis = " HIDDEN" }
  $parts = @()
  $lm = $n["layoutMode"]
  if ($lm -and $lm -ne "NONE") {
    $l = $lm.Substring(0,1)
    if ($n["layoutWrap"] -eq "WRAP") { $l += "wrap" }
    if ($n["itemSpacing"] -ne $null) { $l += " gap=" + $n["itemSpacing"] }
    if ($n["counterAxisSpacing"] -ne $null) { $l += " rowgap=" + $n["counterAxisSpacing"] }
    $pt=$n["paddingTop"]; $pr=$n["paddingRight"]; $pb=$n["paddingBottom"]; $pl=$n["paddingLeft"]
    if ($pt -or $pr -or $pb -or $pl) { $l += " pad=$pt/$pr/$pb/$pl" }
    if ($n["primaryAxisAlignItems"]) { $l += " main=" + $n["primaryAxisAlignItems"] }
    if ($n["counterAxisAlignItems"]) { $l += " cross=" + $n["counterAxisAlignItems"] }
    $parts += "{$l}"
  }
  $sz = ""
  if ($n["layoutSizingHorizontal"]) { $sz += $n["layoutSizingHorizontal"].Substring(0,3) }
  if ($n["layoutSizingVertical"]) { $sz += "/" + $n["layoutSizingVertical"].Substring(0,3) }
  if ($sz) { $parts += "sz=$sz" }
  if ($n["layoutPositioning"] -eq "ABSOLUTE") { $parts += "ABS" }
  if ($n["layoutGrow"] -eq 1) { $parts += "grow" }
  if ($n["layoutAlign"] -eq "STRETCH") { $parts += "stretch" }
  if ($n["maxWidth"]) { $parts += "maxW=" + $n["maxWidth"] }
  if ($n["minWidth"]) { $parts += "minW=" + $n["minWidth"] }
  if ($n["minHeight"]) { $parts += "minH=" + $n["minHeight"] }
  if ($n["cornerRadius"]) { $parts += "r=" + $n["cornerRadius"] }
  if ($n["rectangleCornerRadii"]) { $parts += "r=" + ($n["rectangleCornerRadii"] -join "/") }
  if ($n["opacity"] -ne $null -and $n["opacity"] -ne 1) { $parts += "opacity=" + $n["opacity"] }
  if ($n["clipsContent"] -eq $true) { $parts += "clip" }
  if ($n["rotation"]) { $parts += "rot=" + $n["rotation"] }
  if ($n["isMask"]) { $parts += "MASK" }
  if ($n["fills"] -and $n["fills"].Count -gt 0) { $parts += "fill=" + (($n["fills"] | ForEach-Object { Paint $_ }) -join "|") }
  if ($n["strokes"] -and $n["strokes"].Count -gt 0) {
    $sw = $n["strokeWeight"]; if ($n["individualStrokeWeights"]) { $i = $n["individualStrokeWeights"]; $sw = "t" + $i["top"] + "r" + $i["right"] + "b" + $i["bottom"] + "l" + $i["left"] }
    $parts += "stroke=" + (($n["strokes"] | ForEach-Object { Paint $_ }) -join "|") + " w=$sw " + $n["strokeAlign"]
    if ($n["strokeDashes"]) { $parts += "dash=" + ($n["strokeDashes"] -join ",") }
  }
  if ($n["effects"] -and $n["effects"].Count -gt 0) { foreach ($e in $n["effects"]) {
      if ($e["visible"] -eq $false) { continue }
      $es = $e["type"]
      if ($e["color"]) { $es += " " + (C $e["color"] $null) }
      if ($e["offset"]) { $es += " off=(" + $e["offset"]["x"] + "," + $e["offset"]["y"] + ")" }
      if ($e.ContainsKey("radius")) { $es += " r=" + $e["radius"] }
      if ($e.ContainsKey("spread") -and $e["spread"]) { $es += " sp=" + $e["spread"] }
      $parts += "fx[$es]" } }
  if ($n["componentId"]) { $parts += "comp=" + $n["componentId"] }
  [void]$sb.AppendLine("$ind- " + $n["type"] + " '" + $n["name"] + "'" + $pos + $vis + " #" + $n["id"] + " " + ($parts -join " "))
  if ($n["type"] -eq "TEXT") {
    $st = $n["style"]
    $ls = $st["letterSpacing"]; $lh = $st["lineHeightPx"]
    $ts = ("      " + $ind + "font: " + $st["fontFamily"] + " " + $st["fontWeight"] + " " + $st["fontSize"] + "px lh=" + [math]::Round($lh,2) + " ls=" + [math]::Round($ls,2) + " align=" + $st["textAlignHorizontal"])
    if ($st["textCase"]) { $ts += " case=" + $st["textCase"] }
    if ($st["textDecoration"]) { $ts += " deco=" + $st["textDecoration"] }
    if ($st["textAutoResize"]) { $ts += " resize=" + $st["textAutoResize"] }
    if ($st["lineHeightUnit"]) { $ts += " lhUnit=" + $st["lineHeightUnit"] }
    if ($st["paragraphSpacing"]) { $ts += " parSp=" + $st["paragraphSpacing"] }
    [void]$sb.AppendLine($ts)
    [void]$sb.AppendLine("      " + $ind + "text: " + ($n["characters"] -replace "`n","\n"))
    if ($n["characterStyleOverrides"] -and $n["characterStyleOverrides"].Count -gt 0) {
      # compress overrides into runs
      $ov = $n["characterStyleOverrides"]; $chars = $n["characters"]
      $runs = @(); $cur = $ov[0]; $start = 0
      for ($i = 1; $i -le $ov.Count; $i++) {
        if ($i -eq $ov.Count -or $ov[$i] -ne $cur) { $runs += ("[" + $cur + "]'" + ($chars.Substring($start, [math]::Min($i-$start, $chars.Length-$start)) -replace "`n","\n") + "'"); if ($i -lt $ov.Count) { $cur = $ov[$i]; $start = $i } }
      }
      [void]$sb.AppendLine("      " + $ind + "runs: " + ($runs -join " "))
      foreach ($kv in $n["styleOverrideTable"].GetEnumerator()) { [void]$sb.AppendLine("      " + $ind + "  ov[" + $kv.Key + "]: " + (($kv.Value.GetEnumerator() | ForEach-Object { if ($_.Value -is [System.Collections.IList]) { $_.Key + "=" + ((($_.Value) | ForEach-Object { Paint $_ }) -join ";") } else { $_.Key + "=" + $_.Value } }) -join " ")) }
    }
  }
  if ($stopNames -contains $n["name"]) { [void]$sb.AppendLine("      " + $ind + "(children omitted)"); return }
  if ($n["children"]) { foreach ($c in $n["children"]) { Walk $c ($d+1) } }
}
function FindNode($n, $id) {
  if ($n["id"] -eq $id) { return $n }
  if ($n["children"]) { foreach ($c in $n["children"]) { $r = FindNode $c $id; if ($r) { return $r } } }
  return $null
}
foreach ($kv in $doc["nodes"].GetEnumerator()) {
  $root = $kv.Value["document"]
  if ($startId) { $root = FindNode $root $startId }
  if (-not $root) { continue }
  $originX = $root["absoluteBoundingBox"]["x"]; $originY = $root["absoluteBoundingBox"]["y"]
  [void]$sb.AppendLine("==== NODE " + $root["id"] + " origin=(" + $originX + "," + $originY + ")")
  Walk $root 0
}
[IO.File]::WriteAllText($out, $sb.ToString())
"done " + $sb.Length

