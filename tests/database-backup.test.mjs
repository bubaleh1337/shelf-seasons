import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chmod, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const execFileAsync = promisify(execFile);
const workflowUrl = new URL("../.github/workflows/database-backup.yml", import.meta.url);
const backupScriptUrl = new URL("../scripts/create-database-backup.sh", import.meta.url);
const docsUrl = new URL("../docs/DATABASE_BACKUPS.md", import.meta.url);

test("database backups are scheduled, encrypted and retained", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /cron: "17 2 \* \* \*"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /supabase\/setup-cli@v3\.0\.0/);
  assert.match(workflow, /version: 2\.84\.2/);
  assert.match(workflow, /SUPABASE_DB_URL: \$\{\{ secrets\.SUPABASE_DB_URL \}\}/);
  assert.match(
    workflow,
    /BACKUP_AGE_PUBLIC_KEY: \$\{\{ secrets\.BACKUP_AGE_PUBLIC_KEY \}\}/,
  );
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /retention-days: 30/);
  assert.match(workflow, /path: \$\{\{ steps\.backup\.outputs\.encrypted_path \}\}/);
});

test("backup script exports roles, schema and data before age encryption", async () => {
  const script = await readFile(backupScriptUrl, "utf8");

  assert.match(script, /--role-only/);
  assert.match(script, /schema\.sql/);
  assert.match(script, /--use-copy/);
  assert.match(script, /--data-only/);
  assert.match(script, /sha256sum roles\.sql schema\.sql data\.sql/);
  assert.match(script, /age --encrypt/);
  assert.match(script, /\.tar\.gz\.age/);
  assert.doesNotMatch(script, /SUPABASE_(SERVICE_ROLE|ACCESS_TOKEN)/);
});

test("backup documentation covers key custody, verification and storage exclusions", async () => {
  const docs = await readFile(docsUrl, "utf8");

  assert.match(docs, /BACKUP_AGE_PUBLIC_KEY/);
  assert.match(docs, /verify-database-backup\.ps1/);
  assert.match(docs, /Supabase Storage object bytes are not part/);
  assert.match(docs, /Never test a restore against production/);
});

test("backup orchestration publishes only the encrypted archive and cleans plaintext", async () => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "shelf-seasons-backup-test-"));
  const binDirectory = path.join(temporaryRoot, "bin");
  const runnerDirectory = path.join(temporaryRoot, "runner");
  const workspaceDirectory = path.join(temporaryRoot, "workspace");
  const outputFile = path.join(workspaceDirectory, "github-output.txt");

  try {
    await Promise.all([
      mkdir(binDirectory),
      mkdir(runnerDirectory),
      mkdir(workspaceDirectory),
    ]);

    const supabaseStub = `#!/usr/bin/env bash
set -euo pipefail
if [[ "\${1:-}" == "--version" ]]; then
  echo "2.84.2"
  exit 0
fi
output=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--file" ]]; then
    output="$2"
    shift 2
  else
    shift
  fi
done
printf '%s\\n' '-- mock SQL dump --' >"$output"
`;
    const ageStub = `#!/usr/bin/env bash
set -euo pipefail
output=""
input=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) output="$2"; shift 2 ;;
    --recipient) shift 2 ;;
    --encrypt) shift ;;
    *) input="$1"; shift ;;
  esac
done
cp "$input" "$output"
`;

    const supabasePath = path.join(binDirectory, "supabase");
    const agePath = path.join(binDirectory, "age");
    await Promise.all([
      writeFile(supabasePath, supabaseStub),
      writeFile(agePath, ageStub),
    ]);
    await Promise.all([chmod(supabasePath, 0o700), chmod(agePath, 0o700)]);

    const scriptPath = new URL(backupScriptUrl).pathname;
    await execFileAsync("bash", [scriptPath], {
      cwd: workspaceDirectory,
      env: {
        ...process.env,
        PATH: `${binDirectory}:${process.env.PATH}`,
        RUNNER_TEMP: runnerDirectory,
        GITHUB_WORKSPACE: workspaceDirectory,
        GITHUB_OUTPUT: outputFile,
        SUPABASE_DB_URL: "postgresql://postgres:password@example.invalid:5432/postgres",
        BACKUP_AGE_PUBLIC_KEY: `age1${"a".repeat(58)}`,
      },
    });

    const workspaceFiles = await readdir(workspaceDirectory);
    const encryptedFiles = workspaceFiles.filter((name) => name.endsWith(".tar.gz.age"));
    assert.equal(encryptedFiles.length, 1);
    assert.deepEqual(await readdir(runnerDirectory), []);

    const outputs = await readFile(outputFile, "utf8");
    assert.match(outputs, /artifact_name=shelf-seasons-db-/);
    assert.match(outputs, /encrypted_path=.*\.tar\.gz\.age/);
  } finally {
    await rm(temporaryRoot, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
});
