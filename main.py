import asyncio
import logging
import json
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandObject
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# --- КОНФИГУРАЦИЯ ---
API_TOKEN = os.getenv("8684876138:AAHreNwkFb4vz4eq00khT7MgPvFw1ZLOj4A")
ADMIN_ID = 6737709054  # ЗАМЕНИТЕ на ваш реальный ID
MINI_APP_URL = 'https://pvpstars.netlify.app/' # Ссылка на ваш Web App
# ---------------------

bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# Временное хранилище балансов {user_id: balance}
# В реальном проекте здесь будет запрос к БД
# Имя файла для хранения данных
DB_FILE = "database.json"

# Загрузка балансов из файла
def load_balances():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            return {int(k): v for k, v in json.load(f).items()}
    return {}

# Сохранение балансов в файл
def save_balances():
    with open(DB_FILE, "w") as f:
        json.dump(user_balances, f)

# Инициализируем балансы при старте
user_balances = load_balances()

# Функция для получения баланса (по умолчанию 0)
def get_balance(user_id: int) -> int:
    return user_balances.get(user_id, 0)

# Клавиатура главного меню
# Обновленная функция меню
def get_main_menu(user_id: int): # Добавили user_id сюда
    balance = get_balance(user_id) # Получаем баланс из нашей базы
    
    # К ссылке добавляем ?bal=ЗНАЧЕНИЕ
    # Теперь сайт внутри Mini App увидит этот баланс через URL
    # Добавь v=1 (или любое другое число) в конец ссылки
    web_app_url = f"{MINI_APP_URL}?bal={balance}&v=1"
    
    buttons = [
        [
            InlineKeyboardButton(text="💰 Пополнить", callback_data="deposit"),
            InlineKeyboardButton(
                text="🎮 Играть PVP", 
                web_app=WebAppInfo(url=web_app_url)
            )
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

# Команда /start - теперь показывает баланс
@dp.message(Command("start"))
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    balance = get_balance(user_id)
    
    # Мы убрали '...', теперь здесь нормальный текст
    await message.answer(
        f"Добро пожаловать в PVP Star! ⭐\n\n"
        f"👤 Ваш баланс: **{balance}** монет\n\n"
        f"Выберите действие:",
        reply_markup=get_main_menu(user_id),
        parse_mode="Markdown"
    )

# Кнопка "Пополнить"
@dp.callback_query(F.data == "deposit")
async def process_deposit(callback: types.CallbackQuery):
    deposit_text = (
        "💳 *Инструкция по пополнению*\n\n"
        "Для пополнения баланса отправьте подарок пользователю: @DoggyJoggy\n\n"
        "⏳ Баланс будет пополнен в течение *24 часов*."
    )
    
    # Создаем кнопку назад
    back_keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="« Назад", callback_data="main_menu")]
    ])
    
    # Используем edit_message_text, чтобы не плодить новые сообщения, 
    # а менять текущее
    await callback.message.edit_text(
        text=deposit_text,
        reply_markup=back_keyboard,
        parse_mode="Markdown"
    )
    await callback.answer()

# Обработчик кнопки "Назад" (возврат в главное меню)
@dp.callback_query(F.data == "main_menu")
@dp.callback_query(F.data == "main_menu")
async def back_to_main(callback: types.CallbackQuery):
    user_id = callback.from_user.id
    balance = get_balance(user_id)
    
    # Здесь тоже убрали '...' и добавили вызов get_main_menu с ID
    await callback.message.edit_text(
        text=f"Добро пожаловать в PVP Star! ⭐\n\n"
             f"👤 Ваш баланс: **{balance}** монет\n\n"
             f"Выберите действие:",
        reply_markup=get_main_menu(user_id),
        parse_mode="Markdown"
    )
    await callback.answer()
# Кнопка "Играть"
@dp.callback_query(F.data == "play")
async def process_play(callback: types.CallbackQuery):
    await callback.message.answer("Вы нажали Играть! 🎮")
    await callback.answer()

# --- АДМИН-КОМАНДА ДЛЯ ПОПОЛНЕНИЯ ---
# Формат: /pay [ID] [сумма]
@dp.message(Command("pay"))
async def admin_pay(message: types.Message, command: CommandObject):
    if message.from_user.id != ADMIN_ID:
        return

    if not command.args:
        await message.answer("Ошибка! Введите: `/pay [ID] [сумма]`")
        return

    try:
        args = command.args.split()
        target_id = int(args[0]) # Превращаем ID в число
        amount = int(args[1])    # Превращаем сумму в число

        # Обновляем баланс в нашем словаре
        current_bal = user_balances.get(target_id, 0)
        user_balances[target_id] = current_bal + amount

        save_balances()

        await message.answer(
            f"✅ **Успешно!**\n"
            f"Пользователю `{target_id}` зачислено `{amount}` монет.\n"
            f"Новый баланс: `{user_balances[target_id]}`",
            parse_mode="Markdown"
        )
        
        # Уведомляем счастливчика
        try:
            await bot.send_message(
                chat_id=target_id,
                text=f"💰 Ваш баланс пополнен на **{amount}** монет!\n"
                     f"Текущий баланс: **{user_balances[target_id]}**",
                parse_mode="Markdown"
            )
        except Exception:
            pass # Если не удалось отправить сообщение

    except (ValueError, IndexError):
        await message.answer("Ошибка! Неверный формат. Используйте числа для ID и суммы.")

# Запуск
async def main():
    print("Бот запущен. Балансы работают в ОЗУ.")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:

        pass
