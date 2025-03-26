import { UserApplicationService } from '../UserApplicationService';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { UserId } from '../../../domain/value-objects/UserId';
import { UserDto } from '../../dto/UserDto';
import { DomainException } from '../../../domain/exceptions/DomainException';

describe('UserApplicationService', () => {
    let userApplicationService: UserApplicationService;
    let mockUserRepository: jest.Mocked<IUserRepository>;

    beforeEach(() => {
        mockUserRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findActive: jest.fn()
        } as unknown as jest.Mocked<IUserRepository>;

        userApplicationService = new UserApplicationService(mockUserRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('должен создать нового пользователя, если пользователь не существует', async () => {
            // Настройка мока для возврата null (пользователь не существует)
            mockUserRepository.findById.mockResolvedValue(null);
            
            // Настройка мока для сохранения
            mockUserRepository.save.mockResolvedValue();
            
            // Вызываем тестируемый метод
            const result = await userApplicationService.registerUser('123', 'Тестовый пользователь');
            
            // Проверяем вызов методов репозитория
            expect(mockUserRepository.findById).toHaveBeenCalledWith(expect.any(UserId));
            expect(mockUserRepository.save).toHaveBeenCalled();
            
            // Проверяем результат
            expect(result).toEqual(expect.objectContaining({
                id: '123',
                name: 'Тестовый пользователь',
                isActive: true
            }));
        });

        it('должен обновить существующего пользователя, если пользователь существует', async () => {
            // Создаем тестовый объект пользователя
            const userId = UserId.fromString('123');
            const existingUser = User.create(userId, 'Старое имя');
            
            // Настройка мока для возврата существующего пользователя
            mockUserRepository.findById.mockResolvedValue(existingUser);
            
            // Настройка мока для сохранения
            mockUserRepository.save.mockResolvedValue();
            
            // Вызываем тестируемый метод
            const result = await userApplicationService.registerUser('123', 'Новое имя');
            
            // Проверяем вызов методов репозитория
            expect(mockUserRepository.findById).toHaveBeenCalledWith(expect.any(UserId));
            expect(mockUserRepository.save).toHaveBeenCalled();
            
            // Проверяем, что имя было обновлено
            expect(result).toEqual(expect.objectContaining({
                id: '123',
                name: 'Новое имя',
                isActive: true
            }));
        });

        it('должен выбросить исключение при возникновении ошибки домена', async () => {
            // Настройка мока для выброса исключения домена
            mockUserRepository.findById.mockImplementation(() => {
                throw new DomainException('Ошибка домена');
            });
            
            // Вызываем тестируемый метод и проверяем исключение
            await expect(userApplicationService.registerUser('123', 'Тестовый пользователь'))
                .rejects.toThrow(DomainException);
        });

        it('должен выбросить стандартную ошибку при возникновении другой ошибки', async () => {
            // Настройка мока для выброса стандартной ошибки
            mockUserRepository.findById.mockImplementation(() => {
                throw new Error('Стандартная ошибка');
            });
            
            // Вызываем тестируемый метод и проверяем исключение
            await expect(userApplicationService.registerUser('123', 'Тестовый пользователь'))
                .rejects.toThrow('Ошибка при регистрации пользователя: Error: Стандартная ошибка');
        });
    });

    describe('getUserById', () => {
        it('должен вернуть пользователя, если пользователь существует', async () => {
            // Создаем тестовый объект пользователя
            const userId = UserId.fromString('123');
            const user = User.create(userId, 'Тестовый пользователь');
            
            // Настройка мока для возврата пользователя
            mockUserRepository.findById.mockResolvedValue(user);
            
            // Вызываем тестируемый метод
            const result = await userApplicationService.getUserById('123');
            
            // Проверяем вызов методов репозитория
            expect(mockUserRepository.findById).toHaveBeenCalledWith(expect.any(UserId));
            
            // Проверяем результат
            expect(result).toEqual(expect.objectContaining({
                id: '123',
                name: 'Тестовый пользователь'
            }));
        });

        it('должен вернуть null, если пользователь не существует', async () => {
            // Настройка мока для возврата null
            mockUserRepository.findById.mockResolvedValue(null);
            
            // Вызываем тестируемый метод
            const result = await userApplicationService.getUserById('123');
            
            // Проверяем вызов методов репозитория
            expect(mockUserRepository.findById).toHaveBeenCalledWith(expect.any(UserId));
            
            // Проверяем результат
            expect(result).toBeNull();
        });

        it('должен выбросить исключение при возникновении ошибки домена', async () => {
            // Настройка мока для выброса исключения домена
            mockUserRepository.findById.mockImplementation(() => {
                throw new DomainException('Ошибка домена');
            });
            
            // Вызываем тестируемый метод и проверяем исключение
            await expect(userApplicationService.getUserById('123'))
                .rejects.toThrow(DomainException);
        });

        it('должен выбросить стандартную ошибку при возникновении другой ошибки', async () => {
            // Настройка мока для выброса стандартной ошибки
            mockUserRepository.findById.mockImplementation(() => {
                throw new Error('Стандартная ошибка');
            });
            
            // Вызываем тестируемый метод и проверяем исключение
            await expect(userApplicationService.getUserById('123'))
                .rejects.toThrow('Ошибка при получении пользователя: Error: Стандартная ошибка');
        });
    });

    describe('markUserActivity', () => {
        it('должен отметить активность пользователя', async () => {
            // Создаем тестовый объект пользователя
            const userId = UserId.fromString('123');
            const user = User.create(userId, 'Тестовый пользователь');
            
            // Шпионим за методом markActivity
            const markActivitySpy = jest.spyOn(user, 'markActivity');
            
            // Настройка мока для возврата пользователя
            mockUserRepository.findById.mockResolvedValue(user);
            
            // Настройка мока для сохранения
            mockUserRepository.save.mockResolvedValue();
            
            // Вызываем тестируемый метод
            await userApplicationService.markUserActivity('123');
            
            // Проверяем вызов методов репозитория и методов доменного объекта
            expect(mockUserRepository.findById).toHaveBeenCalledWith(expect.any(UserId));
            expect(markActivitySpy).toHaveBeenCalled();
            expect(mockUserRepository.save).toHaveBeenCalledWith(user);
        });

        it('должен выбросить исключение, если пользователь не найден', async () => {
            // Настройка мока для возврата null
            mockUserRepository.findById.mockResolvedValue(null);
            
            // Вызываем тестируемый метод и проверяем исключение
            await expect(userApplicationService.markUserActivity('123'))
                .rejects.toThrow('пользователь с ID 123 не найден');
        });
    });

    describe('getActiveUsers', () => {
        it('должен вернуть активных пользователей', async () => {
            // Создаем тестовые объекты пользователей
            const userId1 = UserId.fromString('123');
            const userId2 = UserId.fromString('456');
            const user1 = User.create(userId1, 'Пользователь 1');
            const user2 = User.create(userId2, 'Пользователь 2');
            
            // Настройка мока для возврата списка пользователей
            mockUserRepository.findActive.mockResolvedValue([user1, user2]);
            
            // Вызываем тестируемый метод
            const result = await userApplicationService.getActiveUsers();
            
            // Проверяем вызов методов репозитория
            expect(mockUserRepository.findActive).toHaveBeenCalled();
            
            // Проверяем результат
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(expect.objectContaining({
                id: '123',
                name: 'Пользователь 1'
            }));
            expect(result[1]).toEqual(expect.objectContaining({
                id: '456',
                name: 'Пользователь 2'
            }));
        });
    });

    describe('mapToDto', () => {
        it('должен правильно преобразовать доменный объект в DTO', () => {
            // Создаем тестовый объект пользователя
            const userId = UserId.fromString('123');
            const user = User.create(userId, 'Тестовый пользователь');
            
            // Получаем приватный метод для тестирования
            const mapToDto = (userApplicationService as any).mapToDto;
            
            // Вызываем тестируемый метод
            const result = mapToDto(user);
            
            // Проверяем результат
            expect(result).toBeInstanceOf(Object);
            expect(result).toEqual({
                id: '123',
                name: 'Тестовый пользователь',
                isActive: true,
                lastActivityAt: expect.any(Date),
                createdAt: expect.any(Date),
                updatedAt: null
            });
        });
    });
}); 