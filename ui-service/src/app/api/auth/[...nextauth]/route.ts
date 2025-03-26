'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { userAPI } from '../../../../api/client';

export async function GET(req: NextRequest) {
  try {
    console.log('[AUTH] Получен запрос на авторизацию');
    
    // Проверяем, есть ли Telegram WebApp данные
    const webAppData = req.nextUrl.searchParams.get('tgWebAppData');
    
    if (!webAppData) {
      console.log('[AUTH] Нет данных Telegram WebApp');
      
      // Для отладки используем тестового пользователя
      const testUser = {
        id: 'test-user-id-123',
        name: 'Тестовый Пользователь'
      };
      
      // Сохраняем в cookies
      cookies().set('userId', testUser.id, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 дней
      });
      
      console.log('[AUTH] Установлен тестовый пользователь:', testUser);
      
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Расшифровка данных из Telegram (в реальном приложении нужна проверка подписи)
    // В учебных целях просто парсим строку
    const dataParams = new URLSearchParams(webAppData);
    const user = {
      id: dataParams.get('user[id]') || '',
      name: `${dataParams.get('user[first_name]') || ''} ${dataParams.get('user[last_name]') || ''}`.trim()
    };
    
    console.log('[AUTH] Получены данные пользователя из Telegram:', user);
    
    // Проверяем, существует ли пользователь в системе
    let existingUser = await userAPI.getUser(user.id);
    
    if (!existingUser) {
      // Если пользователь не найден, создаем нового
      console.log('[AUTH] Создаем нового пользователя');
      existingUser = await userAPI.createUser({
        name: user.name,
        registrationDate: new Date().toISOString()
      });
    } else {
      console.log('[AUTH] Пользователь уже существует');
    }
    
    // Обновляем дату последнего действия
    await userAPI.updateUser(existingUser.id, {
      lastActionDate: new Date().toISOString()
    });
    
    // Сохраняем ID пользователя в cookies
    cookies().set('userId', existingUser.id, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 дней
    });
    
    console.log('[AUTH] Авторизация успешна, перенаправление на главную страницу');
    
    // Перенаправляем на главную страницу
    return NextResponse.redirect(new URL('/', req.url));
  } catch (error) {
    console.error('[AUTH] Ошибка авторизации:', error);
    return NextResponse.json(
      { error: 'Ошибка авторизации' },
      { status: 500 }
    );
  }
} 