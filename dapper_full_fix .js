const fs = require('fs');
let code = fs.readFileSync('src/Dapper.jsx', 'utf8');
let vision = fs.readFileSync('src/hooks/useClaudeVision.js', 'utf8');
let fixes = 0;
let skips = 0;

function fix(label, old, repl, target) {
  const src = target === 'vision' ? vision : code;
  if (src.includes(old)) {
    if (target === 'vision') vision = vision.replace(old, repl);
    else code = code.replace(old, repl);
    fixes++;
    console.log('  FIXED: ' + label);
    return true;
  }
  skips++;
  console.log('  skip:  ' + label + ' (already patched or pattern changed)');
  return false;
}

function fixAll(label, old, repl) {
  let count = 0;
  while (code.includes(old)) {
    code = code.replace(old, repl);
    count++;
  }
  if (count > 0) {
    fixes++;
    console.log('  FIXED: ' + label + ' (' + count + 'x)');
  } else {
    skips++;
    console.log('  skip:  ' + label);
  }
}

console.log('');
console.log('================================================================');
console.log('  DAPPER FULL FIX — ' + new Date().toISOString().split('T')[0]);
console.log('================================================================');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n--- CRITICAL: Crash-causing bugs ---');
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// C1: scorePatternCombo early return missing violations/warnings
fix('C1: scorePatternCombo early return',
  'return { score: 10, label: "Safe", reason: "All solid \u2014 perfectly correct.", tips: [] }',
  'return { score: 10, label: "Safe", reason: "All solid \u2014 perfectly correct.", tips: [], violations: [], warnings: [] }'
);

// C2: analysisData.suit.formality unguarded
fix('C2: analysisData.suit.formality',
  '{analysisData.suit.formality}',
  '{analysisData?.suit?.formality || ""}'
);

// C3: analysisData.suit.colorFamily unguarded (all occurrences)
fixAll('C3: analysisData.suit.colorFamily',
  '{analysisData.suit.colorFamily}',
  '{analysisData?.suit?.colorFamily || ""}'
);

// C4: analysisData.suit.colorFamily in function args (line 4323)
fix('C4: getBestTiesForCombo colorFamily arg',
  'getBestTiesForCombo(suitPat, shirtPat, analysisData.suit.colorFamily)',
  'getBestTiesForCombo(suitPat, shirtPat, analysisData?.suit?.colorFamily || "")'
);

// C5: getBestShoesForSuit colorFamily arg (line 4325)
fix('C5: getBestShoesForSuit colorFamily arg',
  'getBestShoesForSuit(analysisData.suit.colorFamily)',
  'getBestShoesForSuit(analysisData?.suit?.colorFamily || "")'
);

// C6: shirt.pocketSquare.name/fold unguarded
fix('C6: shirt.pocketSquare.name/fold',
  '{shirt.pocketSquare.name} \u2014 {shirt.pocketSquare.fold}',
  '{shirt?.pocketSquare?.name || "Pocket Square"} \u2014 {shirt?.pocketSquare?.fold || ""}'
);

// C7: shirt.pocketSquare.material unguarded
fix('C7: shirt.pocketSquare.material',
  '{shirt.pocketSquare.material}',
  '{shirt?.pocketSquare?.material || ""}'
);

// C8: combo.tips/warnings/violations unguarded in suit+shirt card
fix('C8: combo.tips/warnings/violations',
  '{combo.tips[0] || combo.warnings[0] || combo.violations[0] || "Pattern combination evaluated."}',
  '{combo.tips?.[0] || combo.warnings?.[0] || combo.violations?.[0] || "Pattern combination evaluated."}'
);

// C9: result.violations and result.tips in filterTiesForSuitAndShirt
fix('C9a: result.violations.length',
  'result.violations.length > 0 ? result.violations[0] : null',
  '(result.violations?.length > 0) ? result.violations[0] : null'
);
fix('C9b: result.tips.length',
  'result.tips.length > 0 ? result.tips[0]',
  '(result.tips?.length > 0) ? result.tips[0]'
);

// C10: result.score fallback
fix('C10: result.score fallback',
  'let boostedScore = result.score',
  'let boostedScore = result?.score ?? 5'
);

// C11: shirt.name and shirt.why render as undefined
fix('C11: shirt.name/why fallback',
  '<strong>{shirt.name}</strong> \u2014 {shirt.why}',
  '<strong>{shirt?.name || "Select a shirt"}</strong>{shirt?.why && <span> \u2014 {shirt.why}</span>}'
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n--- HIGH: Wrong results / data bugs ---');
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// H1: Hardcoded styleMantra — always shows navy chalk stripe
fix('H1: hardcoded styleMantra',
  '"A navy chalk stripe is not a suit \u2014 it is a declaration. Wear it when you need the room to know, before you speak, that you have already won."',
  '{analysisData?.styleMantra || "Dress with intention. Every element is a decision \u2014 make each one count."}'
);

// H2: Duplicate purple|solid — remove second copy
const firstPurple = code.indexOf('"purple|solid"');
if (firstPurple > -1) {
  const secondPurple = code.indexOf('"purple|solid"', firstPurple + 100);
  if (secondPurple > -1) {
    const afterSecond = code.substring(secondPurple);
    const nextKey = afterSecond.match(/\n  "[a-z]+\|[a-z_]+":\s*\{/);
    if (nextKey) {
      const removeStart = code.lastIndexOf('\n', secondPurple - 2);
      const removeEnd = secondPurple + nextKey.index;
      const removedChars = removeEnd - removeStart;
      code = code.substring(0, removeStart) + code.substring(removeEnd);
      fixes++;
      console.log('  FIXED: H2: removed duplicate purple|solid (' + removedChars + ' chars)');
    } else {
      skips++;
      console.log('  skip:  H2: duplicate purple|solid (cant find end boundary)');
    }
  } else {
    skips++;
    console.log('  skip:  H2: no duplicate purple|solid found');
  }
} else {
  skips++;
  console.log('  skip:  H2: purple|solid not found at all');
}

// H3: baseMap fallbacks — green/white/purple/red all fall back to ANALYSIS (navy)
// These should still fallback to ANALYSIS since we don't have separate ANALYSIS_GREEN etc,
// but the matrix lookup handles the real colors. The baseMap fallback only fires when
// color IS detected but combo is NOT in matrix — at that point the exotic path is triggered
// anyway. So this is actually acceptable behavior. Just document it.
console.log('  note:  H3: baseMap green/white/purple/red -> ANALYSIS fallback is OK (exotic path handles it)');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n--- MEDIUM: Edge cases ---');
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// M1: useClaudeVision.js — duplicate white check (line 75)
const redReturn = "if (c.includes('red') || c.includes('crimson') || c.includes('scarlet') || c.includes('rust') || c.includes('orange') || c.includes('terracotta')) return 'red'";
const idxRed = vision.indexOf(redReturn);
if (idxRed > -1) {
  const afterRed = vision.substring(idxRed + redReturn.length);
  const whiteCheck = "  if (c.includes('white') || c.includes('cream') || c.includes('ivory') || c.includes('oyster') || c.includes('ecru')) return 'white'\n";
  if (afterRed.startsWith('\n' + whiteCheck)) {
    vision = vision.substring(0, idxRed + redReturn.length + 1) + 
             vision.substring(idxRed + redReturn.length + 1 + whiteCheck.length);
    fixes++;
    console.log('  FIXED: M1: removed duplicate white check in normalizeColor');
  } else {
    skips++;
    console.log('  skip:  M1: duplicate white check (pattern mismatch)');
  }
} else {
  skips++;
  console.log('  skip:  M1: red return line not found');
}

// M2: normalizeColor returns raw Claude text as fallback
fix('M2: normalizeColor fallback to navy',
  "  return claudeColor\n}",
  "  return 'navy' // fallback to navy for unrecognized colors\n}",
  'vision'
);

// M3: wornLog.map safety — add fallback (low risk but defensive)
fix('M3a: wornLog.map dates',
  'const wornDates = new Set(wornLog.map(e=>e.date))',
  'const wornDates = new Set((wornLog || []).map(e=>e.date))'
);
fix('M3b: wornLog.map suits',
  'const allSuits = ["Todos", ...new Set(wornLog.map(e=>e.suit))]',
  'const allSuits = ["Todos", ...new Set((wornLog || []).map(e=>e.suit))]'
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n--- LOW: Cleanup ---');
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// L1: Remove empty OPENAI_API_KEY
fix('L1: remove dead OPENAI_API_KEY',
  'const OPENAI_API_KEY = ""',
  '// const OPENAI_API_KEY = "" // Removed — using Claude via Vercel Edge Function'
);

// L2: displayName[0] safety
fix('L2a: Sidebar displayName safety',
  'const initials    = displayName[0].toUpperCase()',
  'const initials    = (displayName[0] || "D").toUpperCase()'
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n--- BONUS: Combo path resilience ---');
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// B1: Combo path — when AI fails and catch runs getLocalAnalysis, 
// comboAssessment should be cleared
const comboOuter = '    } catch(err) {\n      setAnalysisData(getLocalAnalysis(description)); setIsDemo(true)\n    }';
const comboFixed = '    } catch(err) {\n      setAnalysisData(getLocalAnalysis(description)); setComboAssessment(null); setIsDemo(true)\n    }';
fix('B1: clear comboAssessment on outer catch', comboOuter, comboFixed);

// B2: Combo path — when AI returns but colorKey is null, clear combo
// (already handled by else block)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WRITE FILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

fs.writeFileSync('src/Dapper.jsx', code);
fs.writeFileSync('src/hooks/useClaudeVision.js', vision);

console.log('\n================================================================');
console.log('  RESULT: ' + fixes + ' fixes applied, ' + skips + ' skipped');
console.log('================================================================\n');

// Verify no duplicate keys remain
const remaining = code.match(/"purple\|solid"/g);
console.log('  purple|solid occurrences: ' + (remaining ? remaining.length : 0) + (remaining && remaining.length > 1 ? ' ⚠️ DUPLICATE STILL EXISTS' : ' ✓'));

// Verify scorePatternCombo early return
const earlyRet = code.match(/return \{ score: 10.*?tips: \[\]/);
if (earlyRet && earlyRet[0].includes('violations')) {
  console.log('  scorePatternCombo early return: ✓ has violations + warnings');
} else if (earlyRet) {
  console.log('  scorePatternCombo early return: ⚠️ STILL MISSING violations/warnings');
} else {
  console.log('  scorePatternCombo early return: ✓ (pattern changed, likely already fixed)');
}

console.log('');
