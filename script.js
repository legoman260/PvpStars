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

// Чтение баланса и комнат из URL
const params = new URLSearchParams(window.location.search);
let currentBalance = parseInt(params.get('bal')) || 0;
document.getElementById('balance_val').innerText = currentBalance;

// Парсим комнаты, которые передал бот
let activeRooms = {};
try {
    const roomsParam = params.get('rooms');
    if (roomsParam) {
        activeRooms = JSON.parse(decodeURIComponent(roomsParam));
    }
} catch (e) {
    console.error("Ошибка парсинга комнат:", e);
}

// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (Главное меню)
function switchTab(tabId, element) {
    const contents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.remove('active');
    }
    const navItems = document.getElementsByClassName('nav-item');
    for (let i = 0; i < navItems.length; i++) {
        navItems[i].classList.remove('active');
    }
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
    tg.HapticFeedback.impactOccurred('light');
}

// ЛОББИ КОНКРЕТНОЙ ИГРЫ
let selectedGame = "";

function openGameLobby(gameName) {
    selectedGame = gameName;
    document.getElementById('lobby-title').innerText = gameName;
    document.getElementById('lobby-screen').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'none';
    tg.HapticFeedback.impactOccurred('medium');
    
    renderRooms(); // Рисуем список комнат при открытии
}

function closeGameLobby() {
    document.getElementById('lobby-screen').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'flex';
}

// МОДАЛЬНОЕ ОКНО СТАВОК
function openCreateModal() {
    document.getElementById('modal-overlay').style.display = 'flex';
    tg.HapticFeedback.impactOccurred('medium');
}

function closeCreateModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// СОЗДАНИЕ КОМНАТЫ
function createRoom(bet) {
    // 1. ПРОВЕРКА: Видит ли функция нажатие?
    alert("Нажата ставка: " + bet + " для игры: " + selectedGame);

    if (currentBalance < bet) {
        tg.showAlert("У вас недостаточно звёзд!");
        return;
    }

    // Если selectedGame почему-то пустой, давай дадим ему имя по умолчанию
    if (!selectedGame) selectedGame = "Tower Build";

    const data = {
        action: "create_room",
        game: selectedGame,
        bet: bet
    };

    console.log("Отправка данных:", data);

    try {
        tg.sendData(JSON.stringify(data));
        tg.close(); 
    } catch (e) {
        alert("Ошибка отправки: " + e.message);
    }
}

// ОТРИСОВКА СПИСКА КОМНАТ
function renderRooms() {
    const container = document.getElementById('rooms-container');
    container.innerHTML = ""; 

    const roomKeys = Object.keys(activeRooms);
    let hasRooms = false;

    roomKeys.forEach(id => {
        const room = activeRooms[id];
        // Показываем только если игра совпадает и статус "ожидание"
        if (room.game === selectedGame && room.status === "waiting") {
            hasRooms = true;
            const card = document.createElement('div');
            card.className = 'game-card-main'; // Используем твой стиль
            card.style.padding = "15px";
            card.style.marginBottom = "10px";
            card.innerHTML = `
                <div>
                    <div style="font-weight: bold;">Ставка: ${room.bet} ⭐</div>
                    <div style="font-size: 12px; color: #888;">Игрок: ${id.replace('r_', '')}</div>
                </div>
                <button class="btn-play" onclick="joinRoom('${id}')">ВХОД</button>
            `;
            container.appendChild(card);
        }
    });

    if (!hasRooms) {
        container.innerHTML = '<div style="text-align: center; color: #555; margin-top: 30px;">Комнат пока нет...</div>';
    }
}

function joinRoom(roomId) {
    const room = activeRooms[roomId];
    if (currentBalance < room.bet) {
        tg.showAlert("Недостаточно звёзд для входа!");
        return;
    }

    tg.showConfirm(`Войти в игру на ${room.bet} ⭐?`, (ok) => {
        if (ok) {
            tg.sendData(JSON.stringify({
                action: "join_room",
                room_id: roomId
            }));
            tg.close();
        }
    });
}
