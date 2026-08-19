// Deploy script: build the static site and push it to the configured
// GitHub Pages branch. Uses the local Git credentials (SSH or HTTPS),
// never exposes secrets to the browser.
//
// Usage:  npm run deploy
//
// Reads content/config.json for: repository, branch, domain, useSsh,
// userName, userEmail.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

function log(msg) {
  console.log(`\x1b[36m[deploy]\x1b[0m ${msg}`);
}
function fail(msg) {
  console.error(`\x1b[31m[deploy] error:\x1b[0m ${msg}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (res.status !== 0) {
    fail(`command failed (exit=${res.status ?? 'null'}): ${cmd} ${args.join(' ')}`);
  }
  return res;
}

function runCapture(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', cwd, shell: process.platform === 'win32' });
  if (res.status !== 0) {
    fail(`command failed: ${cmd} ${args.join(' ')}`);
  }
  return (res.stdout || '').trim();
}

// Run a command and capture BOTH stdout and stderr for diagnostics.
// Always returns the captured output; throws only on hard spawn errors.
function runVerbose(cmd, args, cwd) {
  const res = spawnSync(cmd, args, {
    encoding: 'utf8',
    cwd,
    shell: process.platform === 'win32',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  return {
    ok: res.status === 0,
    status: res.status,
    stdout: (res.stdout || '').trimEnd(),
    stderr: (res.stderr || '').trimEnd(),
  };
}

function pushOrDiagnose(workDir, remote, branch) {
  const refspec = `HEAD:refs/heads/${branch}`;
  // Try plain --force first (widest compatibility).
  let r = runVerbose('git', ['push', '--force', '-v', remote, refspec], workDir);
  if (r.ok) return true;

  // Retry with --force-with-lease in case the user had protection that
  // allows lease-based pushes.
  log('first push rejected, retrying with --force-with-lease...');
  r = runVerbose('git', ['push', '--force-with-lease', '-v', remote, refspec], workDir);
  if (r.ok) return true;

  // Combine the two attempts so the user sees the actual git error text.
  const combinedErr = [r.stdout, r.stderr].filter(Boolean).join('\n') || '(no output from git)';

  console.error('\n------------------------------------------------------------');
  console.error('\x1b[31m[deploy] git push failed with the above output.\x1b[0m');
  console.error('');
  console.error('Target repo  :', remote);
  console.error('Target branch:', branch);
  console.error('Work dir     :', workDir);
  console.error('');
  console.error('The most common root causes + fixes, in order:');
  console.error('');
  console.error('  1) Branch protection on GitHub blocked the force push.');
  console.error('     Go to https://github.com/' + repo + '/settings/branches');
  console.error('     → Add/Edit the rule for "' + branch + '":');
  console.error('       • Turn OFF "Restrict deletions"');
  console.error('       • Turn ON  "Allow force pushes" (Everyone)');
  console.error('       • Save, then re-run `npm run deploy`.');
  console.error('');
  console.error('  2) Pages Source still points to the old deploy target.');
  console.error('     https://github.com/' + repo + '/settings/pages');
  console.error('       Source: "Deploy from a branch"');
  console.error('       Branch: "' + branch + '" / "/ (root)"');
  console.error('     (If you had "GitHub Actions" selected before, switch it.)');
  console.error('');
  console.error('  3) Your SSH key has no write access to the repo.');
  console.error('     Verify with:  ssh -T git@github.com');
  console.error('     It should print: "Hi <you>! You\'ve successfully authenticated..."');
  console.error('     If not, regenerate + add the key at https://github.com/settings/keys');
  console.error('');
  console.error('  4) Repository name / owner typo.');
  console.error('     Config says:', `"${repo}"`);
  console.error('     Actual repo: open the URL and confirm the page loads.');
  console.error('------------------------------------------------------------\n');
  console.error('Raw git output:\n' + combinedErr + '\n');
  process.exit(1);
}

// --- 1. Load config ---
const cfgPath = join(root, 'content/config.json');
if (!existsSync(cfgPath)) fail(`config not found: ${cfgPath}`);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const deploy = cfg.deploy || {};
const repo = deploy.repository;
const branch = deploy.branch || 'gh-pages';
const domain = (deploy.domain || '').trim();
const useSsh = deploy.useSsh !== false;
const userName = deploy.userName || 'blog-bot';
const userEmail = deploy.userEmail || 'blog-bot@users.noreply.github.io';

if (!repo || repo.includes('your-username')) {
  fail('请在 content/config.json 中填写 deploy.repository（格式 owner/repo）。');
}

const repoParts = repo.split('/').filter(Boolean);
const owner = repoParts[0] || '';
const repoName = repoParts[1] || 'blog';
const remote = useSsh ? `git@github.com:${repo}.git` : `https://github.com/${repo}.git`;

// --- 2. Determine base path ---
// Three cases, in priority order:
//   A. Explicit `isUserSite: true`      → base = `/`
//   B. Repo matches `<owner>.github.io` → base = `/`  (GitHub user/org site)
//   C. Custom domain set                → base = `/`
//   D. Otherwise (regular project repo) → base = `/<repo>/`
const isUserSite = deploy.isUserSite === true
  || repoName.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const basePath = (domain || isUserSite) ? '/' : `/${repoName}/`;

if (isUserSite) {
  log(`detected user/org site (${repo}); base path is "/"`);
} else {
  log(`project repo detected; base path is "${basePath}"`);
}

// --- 3. Build the site ---
log(`building site with VITE_BASE_PATH="${basePath}"...`);
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const { status: buildStatus } = spawnSync(
  npmBin,
  ['run', 'build'],
  { stdio: 'inherit', cwd: root, env: { ...process.env, VITE_BASE_PATH: basePath }, shell: process.platform === 'win32' }
);
if (buildStatus !== 0) fail('vite build failed');

const distDir = join(root, 'dist');
if (!existsSync(distDir)) fail(`build output not found: ${distDir}`);

// --- 4. Write CNAME, .nojekyll, and 404.html SPA fallback ---
if (domain) {
  writeFileSync(join(distDir, 'CNAME'), domain + '\n', 'utf8');
  log(`wrote CNAME: ${domain}`);
}
writeFileSync(join(distDir, '.nojekyll'), '', 'utf8');
// GitHub Pages serves 404.html for unknown paths; copy index.html so deep
// links like /posts/slug resolve to the SPA.
const indexHtml = join(distDir, 'index.html');
if (existsSync(indexHtml)) {
  writeFileSync(join(distDir, '404.html'), readFileSync(indexHtml, 'utf8'), 'utf8');
  log('wrote 404.html (SPA fallback)');
}

// --- 5. Copy into a clean git working tree and push ---
const workDir = resolve(tmpdir(), `aifall-blog-gh-pages-${Date.now()}`);
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

log(`preparing git tree in ${workDir}`);
run('git', ['init', '-b', branch], { cwd: workDir });
run('git', ['config', 'user.name', userName], { cwd: workDir });
run('git', ['config', 'user.email', userEmail], { cwd: workDir });

// Copy build output MERGED into workDir (entry-by-entry so we don't hit
// Node.js cpSync's "dest already exists → nest under dest/basename(src)"
// footgun that would produce a `dist/` subdirectory instead of root files).
for (const entry of readdirSync(distDir)) {
  cpSync(join(distDir, entry), join(workDir, entry), { recursive: true });
}
log(`copied ${readdirSync(workDir).length - 1} top-level entries (excluding .git)`);

run('git', ['add', '-A'], { cwd: workDir });
// --allow-empty so we always get one commit even when the tree happens to
// match the empty tree (shouldn't normally happen, but keeps the rest of
// the pipeline predictable — `git log -1`, `HEAD:refs/heads/...` all work).
const commitRes = spawnSync(
  'git',
  ['commit', '--allow-empty', '-m', `deploy: ${new Date().toISOString()}`],
  { cwd: workDir, shell: process.platform === 'win32', stdio: 'inherit' }
);
if (commitRes.status !== 0) {
  log('warning: git commit exited non-zero; proceeding with diagnostics...');
}

log(`pushing to ${remote} (branch: ${branch})...`);
// Preconditions: show current state upfront so debug is easy.
const headCheck = spawnSync(
  'git', ['rev-parse', '--verify', '--short', 'HEAD'],
  { encoding: 'utf8', cwd: workDir, shell: process.platform === 'win32' }
);
const headInfo = headCheck.status === 0
  ? (headCheck.stdout || '').trim()
  : '(no local commits yet)';
log('local commit : ' + headInfo);
const sshCheck = spawnSync(
  'git',
  ['ls-remote', '--heads', remote, 'refs/heads/' + branch],
  { encoding: 'utf8', shell: process.platform === 'win32' }
);
if (sshCheck.status === 0) {
  const line = (sshCheck.stdout || '').trim();
  log(line ? `remote head  : ${line.split('\t')[0]} (${branch} exists already)` : 'remote head  : (new branch — does not exist yet)');
} else {
  log('warning: cannot reach remote yet (' + (sshCheck.stderr || 'git ls-remote failed') + ')');
  log('this usually means your SSH key / GitHub auth is not fully configured yet.');
  log('still attempting the push for full error output...');
}
// Use universal HEAD:refs/heads/<branch> refspec to avoid any confusion about
// local branch names, then retry/print diagnostics on failure.
pushOrDiagnose(workDir, remote, branch);

// --- 6. Cleanup ---
rmSync(workDir, { recursive: true, force: true });

const pagesUrl = domain
  ? `https://${domain}`
  : `https://${repo.split('/')[0]}.github.io/${repoName}`;
log('done. your site will be live shortly at:');
console.log(`  \x1b[32m${pagesUrl}\x1b[0m`);
console.log(`  (GitHub Pages may take 1-2 minutes to update.)`);
