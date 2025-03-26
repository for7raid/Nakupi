import moduleAlias from 'module-alias';
import path from 'path';

// Регистрируем алиасы для production окружения
// В development они настраиваются через tsconfig-paths/register
moduleAlias.addAliases({
    '@': path.join(__dirname),
    '@domain': path.join(__dirname, 'domain'),
    '@application': path.join(__dirname, 'application'),
    '@infrastructure': path.join(__dirname, 'infrastructure'),
    '@presentation': path.join(__dirname, 'presentation'),
    '@config': path.join(__dirname, 'config'),
    '@test': path.join(__dirname, 'test')
}); 