// Настройка алиасов путей для Jest
const moduleAlias = require('module-alias');
const path = require('path');

// Регистрируем алиасы для тестов
moduleAlias.addAliases({
    '@': path.join(__dirname, 'src'),
    '@domain': path.join(__dirname, 'src/domain'),
    '@application': path.join(__dirname, 'src/application'),
    '@infrastructure': path.join(__dirname, 'src/infrastructure'),
    '@presentation': path.join(__dirname, 'src/presentation'),
    '@config': path.join(__dirname, 'src/config'),
    '@test': path.join(__dirname, 'src/test')
});

// Мокаем внешние зависимости, которые могут вызывать проблемы при тестировании
jest.mock('@infrastructure/logging/Logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

jest.mock('@infrastructure/monitoring', () => ({
    incrementMetric: jest.fn(),
    decrementMetric: jest.fn(),
    observeMetric: jest.fn(),
    setMetric: jest.fn(),
    __esModule: true,
    default: {
        incrementMetric: jest.fn(),
        decrementMetric: jest.fn(),
        observeMetric: jest.fn(),
        setMetric: jest.fn()
    }
}));
