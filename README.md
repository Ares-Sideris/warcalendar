# Warcalendar Alpha

Небольшое демо-приложение на FastAPI для ведения календаря игровых событий.

## Запуск

1. Установите зависимости (FastAPI, SQLAlchemy и др.):
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic httpx
   ```
2. (Опционально) наполните базу тестовыми данными:
   ```bash
   python load_test_data.py
   ```
3. Запустите сервер:
   ```bash
   uvicorn warcalendar_backend:app --reload
   ```
4. Откройте [http://localhost:8000/](http://localhost:8000/) в браузере.

Для управления записями требуется указать API ключ в форме на странице. По
умолчанию ключ — `supersecret` (можно изменить через переменную окружения
`ADMIN_API_KEY`).

## Тесты

Запускаются командой:

```bash
pytest -q
```
