import { spawnSync } from 'node:child_process'

/**
 * Roda Playwright só nos specs do catálogo (módulo gerado, sem script npm).
 * @param {{ root: string, specs: string[], env: NodeJS.ProcessEnv, projects?: string[] }} opts
 * @returns {number}
 */
export function executarSpecsPlaywright({ root, specs, env, projects }) {
  if (!specs.length) return 2
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const nomes = projects?.length ? projects : ['chromium']
  const projetos = nomes.flatMap((p) => ['--project', p])
  const result = spawnSync(npx, ['playwright', 'test', ...specs, ...projetos], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env,
  })
  return result.status ?? 1
}
