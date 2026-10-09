-- =============================================================================
--        СЕРВЕРНАЯ ЧАСТЬ АКТИВАЦИИ ЛИЦЕНЗИЙ ДЛЯ SUPABASE (POSTGRESQL)
-- =============================================================================
-- Инструкция по установке:
-- 1. Откройте ваш проект в панели управления Supabase (https://app.supabase.com).
-- 2. Перейдите в раздел "SQL Editor" в боковом меню слева.
-- 3. Нажмите "New Query", вставьте весь этот скрипт и нажмите "Run".
-- =============================================================================

-- 1. ТАБЛИЦА ЛИЦЕНЗИЙ (LICENSES)
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,             -- Уникальный лицензионный ключ
    device_id TEXT DEFAULT NULL,                  -- ID привязанного устройства клиента
    client_name TEXT NOT NULL,                    -- Имя или название магазина клиента
    activated_at TIMESTAMPTZ DEFAULT NULL,        -- Дата и время активации
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,-- Дата создания записи
    is_active BOOLEAN DEFAULT true NOT NULL       -- Флаг активности (true = действует)
);

-- Индексы для мгновенного поиска по ключу
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses (upper(license_key));
CREATE INDEX IF NOT EXISTS idx_licenses_device_id ON public.licenses (device_id);

-- 2. ЗАЩИТА ТАБЛИЦЫ (ROW LEVEL SECURITY - RLS)
-- Включаем RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Полностью запрещаем прямое чтение и изменение таблицы клиентам (ролям anon и authenticated)
REVOKE ALL ON TABLE public.licenses FROM anon, authenticated;

-- Закрываем доступ через пустую политику (никто из клиентов не может сделать SELECT/INSERT/UPDATE)
DROP POLICY IF EXISTS "Deny direct client access to licenses" ON public.licenses;
CREATE POLICY "Deny direct client access to licenses" 
ON public.licenses 
FOR ALL 
TO anon, authenticated 
USING (false);

-- 3. АТОМАРНАЯ RPC ФУНКЦИЯ ПРОВЕРКИ И ПРИВЯЗКИ КЛЮЧА (SECURITY DEFINER)
-- Выполняется с правами суперпользователя на стороне сервера,
-- возвращая клиенту ТОЛЬКО безопасный результат без утечки данных.
CREATE OR REPLACE FUNCTION public.activate_license(
    p_license_key TEXT,
    p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_key TEXT;
    v_dev TEXT;
    v_row public.licenses%ROWTYPE;
BEGIN
    -- Нормализация входных данных
    v_key := upper(trim(COALESCE(p_license_key, '')));
    v_dev := trim(COALESCE(p_device_id, ''));

    IF v_key = '' OR v_dev = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Не указан ключ или идентификатор устройства'
        );
    END IF;

    -- Атомарный поиск с блокировкой строки (FOR UPDATE)
    SELECT * INTO v_row
    FROM public.licenses
    WHERE upper(license_key) = v_key
      AND is_active = true
    FOR UPDATE;

    -- Сценарий 1: Ключ не найден или заблокирован
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Неверный или недействительный ключ активации'
        );
    END IF;

    -- Сценарий 2: Ключ свободен (первая активация на новом устройстве)
    IF v_row.device_id IS NULL THEN
        UPDATE public.licenses
        SET device_id = v_dev,
            activated_at = now()
        WHERE id = v_row.id;

        RETURN jsonb_build_object(
            'success', true,
            'client_name', v_row.client_name,
            'message', 'Приложение успешно активировано'
        );
    END IF;

    -- Сценарий 3: Ключ уже привязан к ЭТОМУ ЖЕ устройству (повторный вход или восстановление из копии)
    IF v_row.device_id = v_dev THEN
        RETURN jsonb_build_object(
            'success', true,
            'client_name', v_row.client_name,
            'message', 'Лицензия подтверждена'
        );
    END IF;

    -- Сценарий 4: Ключ уже привязан к ДРУГОМУ устройству
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Неверный или недействительный ключ активации'
    );
END;
$$;

-- Предоставляем право публичной роли (anon) вызывать ТОЛЬКО эту функцию
GRANT EXECUTE ON FUNCTION public.activate_license(TEXT, TEXT) TO anon, authenticated;

-- =============================================================================
-- 4. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ГЕНЕРАЦИИ СЛУЧАЙНЫХ КРИПТОСТОЙКИХ КЛЮЧЕЙ
-- =============================================================================
CREATE OR REPLACE FUNCTION public.generate_license_keys(
    p_count INT,
    p_client_name TEXT
)
RETURNS TABLE (
    generated_key TEXT,
    client TEXT,
    created TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    i INT;
    v_raw_hex TEXT;
    v_formatted_key TEXT;
BEGIN
    FOR i IN 1..p_count LOOP
        -- Генерируем 16 байт криптографической случайности (32 hex-символа)
        v_raw_hex := upper(encode(gen_random_bytes(16), 'hex'));
        
        -- Форматируем в легко читаемый ключ: SHOP-XXXX-XXXX-XXXX-XXXX
        v_formatted_key := 'SHOP-' || 
                           substr(v_raw_hex, 1, 4) || '-' || 
                           substr(v_raw_hex, 5, 4) || '-' || 
                           substr(v_raw_hex, 9, 4) || '-' || 
                           substr(v_raw_hex, 13, 4);

        INSERT INTO public.licenses (license_key, client_name)
        VALUES (v_formatted_key, p_client_name);

        generated_key := v_formatted_key;
        client := p_client_name;
        created := now();
        RETURN NEXT;
    END LOOP;
END;
$$;

-- КРИТИЧЕСКАЯ БЕЗОПАСНОСТЬ: Запрещаем вызов генератора ключей клиентам (anon, authenticated)!
-- Создавать ключи может только владелец проекта через SQL Editor или Service Role.
REVOKE EXECUTE ON FUNCTION public.generate_license_keys(INT, TEXT) FROM PUBLIC, anon, authenticated;

-- =============================================================================
-- 5. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ В SUPABASE SQL EDITOR
-- =============================================================================

-- Пример 1: Сгенерировать 1 ключ для клиента "Магазин Олимп"
-- SELECT * FROM public.generate_license_keys(1, 'Магазин Олимп');

-- Пример 2: Добавить произвольный ключ вручную:
-- INSERT INTO public.licenses (license_key, client_name) 
-- VALUES ('SHOP-7F2A-9B3C-E14D-A801', 'Продукты 24');

-- Пример 3: Посмотреть все выданные лицензии и их статус:
-- SELECT license_key, client_name, device_id, activated_at, is_active FROM public.licenses;

-- Пример 4: Сбросить привязку устройства (если клиент купил новый планшет):
-- UPDATE public.licenses SET device_id = NULL, activated_at = NULL WHERE license_key = 'SHOP-XXXX-XXXX-XXXX-XXXX';
