import { spawnSync } from 'node:child_process'

/**
 * Roda Playwright só nos specs do catálogo (módulo gerado, sem script npm).
 * @param {{ root: string, specs: string[], env: NodeJS.ProcessEnv, projects?: string[] }} opts
 * @returns {number}
 */
export function executarSpecsPlaywright({ root, specs, env, projects }) {
  if (!specs.length) return 2
  const lWindows = process.platform === 'win32'
  const cRunner = lWindows ? 'npx.cmd' : 'npx'
  const nomes = projects?.length ? projects : ['chromium']
  const projetos = nomes.flatMap((p) => ['--project', p])
  const mArgs = ['playwright', 'test', ...specs, ...projetos]
  const result = spawnSync(cRunner, mArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: lWindows,
    env,
  })
  if (result.error) {
    console.error('[pre-cr] Falha ao iniciar Playwright:', result.error.message)
    return 1
  }
  return result.status ?? 1
}
