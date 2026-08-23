import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let version = '1.0.0';

try {
  // Tenta ler do package.json localmente
  const packagePath = join(__dirname, '..', '..', 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  version = pkg.version;
} catch (e) {
  // Fallback para variável de ambiente do npm se a leitura do arquivo falhar
  version = process.env.npm_package_version || version;
}

export const APP_VERSION = version;
