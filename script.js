 // Инициализация Telegram Mini App
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        // Данные пользователя
        const user = tg.initDataUnsafe?.user;
        if (user) {
            document.getElementById('username').innerText = user.first_name;
            document.getElementById('user_id').innerText = user.id;
        }

        // Чтение баланса из URL
        const params = new URLSearchParams(window.location.search);
        let currentBalance = parseInt(params.get('bal')) || 0;
        document.getElementById('balance_val').innerText = currentBalance;

        // ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК
        function switchTab(tabId, element) {
            // 1. Скрываем все вкладки
            const contents = document.getElementsByClassName('tab-content');
            for (let i = 0; i < contents.length; i++) {
                contents[i].classList.remove('active');
            }

            // 2. Убираем синий цвет у всех кнопок меню
            const navItems = document.getElementsByClassName('nav-item');
            for (let i = 0; i < navItems.length; i++) {
                navItems[i].classList.remove('active');
            }

            // 3. Показываем нужную вкладку и красим кнопку
            document.getElementById(tabId).classList.add('active');
            element.classList.add('active');

            // Легкая вибрация
            tg.HapticFeedback.impactOccurred('light');
        }

        // КНОПКА ИГРАТЬ
        function startMatch(game, cost) {
            if (currentBalance < cost) {
                tg.showAlert("Недостаточно средств для игры!");
            } else {
                tg.showConfirm(`Начать игру в ${game} за ${cost} монет?`, (ok) => {
                    if (ok) {
                        tg.showAlert("Поиск соперника запущен...");
                    }
                });
            }
        }
        let selectedGame = "";

function openGameLobby(gameName) {
    selectedGame = gameName;
    document.getElementById('lobby-title').innerText = gameName;
    document.getElementById('lobby-screen').style.display = 'block';
    tg.HapticFeedback.impactOccurred('medium');
    
    // Скрываем нижнее меню, чтобы не мешалось в лобби
    document.querySelector('.bottom-nav').style.display = 'none';
}

function closeGameLobby() {
    document.getElementById('lobby-screen').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'flex';
}
function createRoom(bet) {
    if (currentBalance < bet) {
        tg.showAlert("У вас недостаточно звёзд!");
        return;
    }

    const data = {
        action: "create_room",
        game: selectedGame, // Например, "Tower Build"
        bet: bet
    };

    // Отправляем данные боту и закрываем Mini App
    // Бот получит этот JSON и создаст комнату в своей базе
    tg.sendData(JSON.stringify(data));
    tg.close(); 
}