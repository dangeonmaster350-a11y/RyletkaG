// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Данные пользователя
let userData = {
    id: tg.initDataUnsafe?.user?.id || 123456789,
    username: tg.initDataUnsafe?.user?.username || 'user',
    first_name: tg.initDataUnsafe?.user?.first_name || 'User',
    stars: 100,
    isAdmin: false,
    isBanned: false
};

// ID администраторов (замените на свой ID)
const ADMIN_IDS = [8512807582]; // Ваш Telegram ID

// Подарки
const GIFTS = {
    'gift': { name: 'Подарок', emoji: '🎁', price: 10, chance: 50 },
    'bear_heart': { name: 'Мишка с сердцем', emoji: '🧸', price: 15, chance: 30 },
    'rose': { name: 'Роза', emoji: '🌹', price: 25, chance: 15 },
    'bouquet': { name: 'Букетик', emoji: '💐', price: 15, chance: 30 }
};

// Инвентарь пользователя
let inventory = [];

// Заявки на вывод
let withdrawals = [];

// Загрузка данных из localStorage
function loadData() {
    const savedInventory = localStorage.getItem(`inventory_${userData.id}`);
    if (savedInventory) inventory = JSON.parse(savedInventory);
    
    const savedWithdrawals = localStorage.getItem(`withdrawals_${userData.id}`);
    if (savedWithdrawals) withdrawals = JSON.parse(savedWithdrawals);
    
    const savedStars = localStorage.getItem(`stars_${userData.id}`);
    if (savedStars) userData.stars = parseInt(savedStars);
    
    updateStars();
    updateInventoryCount();
}

// Сохранение данных
function saveData() {
    localStorage.setItem(`inventory_${userData.id}`, JSON.stringify(inventory));
    localStorage.setItem(`withdrawals_${userData.id}`, JSON.stringify(withdrawals));
    localStorage.setItem(`stars_${userData.id}`, userData.stars);
}

// Обновление звезд
function updateStars() {
    document.getElementById('starsCount').textContent = userData.stars;
}

// Обновление счетчика инвентаря
function updateInventoryCount() {
    const count = inventory.length;
    document.getElementById('inventoryCount').textContent = count;
    document.getElementById('inventoryCount').style.display = count > 0 ? 'inline' : 'none';
}

// Проверка на бан
function checkBan() {
    if (userData.isBanned) {
        showNotification('❌ Вы забанены в боте');
        return true;
    }
    return false;
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'success' ? '#4cd964' : type === 'error' ? '#ff3b30' : '#333';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Показать главное меню
function showMainMenu() {
    if (checkBan()) return;
    
    document.getElementById('content').innerHTML = `
        <div class="welcome-section">
            <h2>👋 Привет, ${userData.first_name}!</h2>
            <p>Добро пожаловать в рулетку подарков</p>
            <p>У тебя ${userData.stars} ⭐️ звезд</p>
        </div>
    `;
}

// Показать меню рулетки
function showSpinMenu() {
    if (checkBan()) return;
    
    let html = '<h2>🎰 Выбери подарок</h2><div class="gifts-grid">';
    
    for (const [key, gift] of Object.entries(GIFTS)) {
        html += `
            <div class="gift-card" onclick="selectGift('${key}')">
                <div class="emoji">${gift.emoji}</div>
                <div class="name">${gift.name}</div>
                <div class="price">${gift.price} <span>⭐️</span></div>
                <div class="chance">Шанс: ${gift.chance}%</div>
            </div>
        `;
    }
    
    html += '</div>';
    document.getElementById('content').innerHTML = html;
}

// Выбор подарка для рулетки
function selectGift(giftKey) {
    if (checkBan()) return;
    
    const gift = GIFTS[giftKey];
    
    document.getElementById('content').innerHTML = `
        <div class="roulette-container">
            <h2>${gift.emoji} ${gift.name}</h2>
            
            <div class="roulette-wheel" id="rouletteWheel">
                <div style="text-align: center; line-height: 200px; color: white; font-size: 48px;">
                    ${gift.emoji}
                </div>
            </div>
            
            <button class="spin-button" onclick="spinRoulette('${giftKey}')">
                Крутить за ${gift.price} ⭐️
            </button>
            
            <div class="chance-info">
                <div>Шанс выигрыша: ${gift.chance}%</div>
                <div class="chance-bar">
                    <div class="chance-fill" style="width: ${gift.chance}%"></div>
                </div>
            </div>
            
            <button class="btn btn-secondary" onclick="showSpinMenu()">← Назад</button>
        </div>
    `;
}

// Крутить рулетку
function spinRoulette(giftKey) {
    if (checkBan()) return;
    
    const gift = GIFTS[giftKey];
    
    if (userData.stars < gift.price) {
        showNotification('❌ Недостаточно звезд!', 'error');
        return;
    }
    
    // Анимация
    const wheel = document.getElementById('rouletteWheel');
    wheel.classList.add('spinning');
    
    setTimeout(() => {
        wheel.classList.remove('spinning');
        
        // Проверка выигрыша
        const won = Math.random() * 100 < gift.chance;
        
        if (won) {
            userData.stars -= gift.price;
            inventory.push({
                gift: giftKey,
                name: gift.name,
                emoji: gift.emoji,
                date: new Date().toISOString()
            });
            
            showNotification(`🎉 Поздравляем! Ты выиграл ${gift.emoji} ${gift.name}!`, 'success');
        } else {
            userData.stars -= gift.price;
            showNotification(`😢 К сожалению, ты не выиграл`, 'error');
        }
        
        updateStars();
        updateInventoryCount();
        saveData();
        
        // Обновление результата
        document.querySelector('.roulette-container').innerHTML += `
            <div style="text-align: center; margin-top: 20px;">
                ${won ? '🎉 Победа!' : '😢 Попробуй еще раз'}
                <button class="btn" onclick="selectGift('${giftKey}')">Крутить еще</button>
            </div>
        `;
    }, 2000);
}

// Показать инвентарь
function showInventory() {
    if (checkBan()) return;
    
    let html = '<h2>🎁 Мои подарки</h2>';
    
    if (inventory.length === 0) {
        html += '<p>У тебя пока нет подарков</p>';
    } else {
        html += '<div class="gifts-grid">';
        
        inventory.forEach((item, index) => {
            html += `
                <div class="gift-card" onclick="sellGift(${index})">
                    <div class="emoji">${item.emoji}</div>
                    <div class="name">${item.name}</div>
                    <div class="date">${new Date(item.date).toLocaleDateString()}</div>
                    <button class="btn btn-secondary" style="margin-top: 10px;">💰 Продать</button>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    document.getElementById('content').innerHTML = html;
}

// Продать подарок
function sellGift(index) {
    if (checkBan()) return;
    
    const gift = inventory[index];
    const price = Math.floor(GIFTS[gift.gift].price * 0.7); // Продажа за 70% стоимости
    
    if (confirm(`Продать ${gift.emoji} ${gift.name} за ${price} ⭐️?`)) {
        inventory.splice(index, 1);
        userData.stars += price;
        
        updateStars();
        updateInventoryCount();
        saveData();
        
        showNotification('✅ Подарок продан!', 'success');
        showInventory();
    }
}

// Показать магазин
function showShop() {
    if (checkBan()) return;
    
    let html = '<h2>💰 Магазин подарков</h2><div class="gifts-grid">';
    
    for (const [key, gift] of Object.entries(GIFTS)) {
        html += `
            <div class="gift-card" onclick="buyGift('${key}')">
                <div class="emoji">${gift.emoji}</div>
                <div class="name">${gift.name}</div>
                <div class="price">${gift.price} ⭐️</div>
                <button class="btn">Купить</button>
            </div>
        `;
    }
    
    html += '</div>';
    document.getElementById('content').innerHTML = html;
}

// Купить подарок
function buyGift(giftKey) {
    if (checkBan()) return;
    
    const gift = GIFTS[giftKey];
    
    if (userData.stars < gift.price) {
        showNotification('❌ Недостаточно звезд!', 'error');
        return;
    }
    
    userData.stars -= gift.price;
    inventory.push({
        gift: giftKey,
        name: gift.name,
        emoji: gift.emoji,
        date: new Date().toISOString()
    });
    
    updateStars();
    updateInventoryCount();
    saveData();
    
    showNotification(`✅ Куплен ${gift.emoji} ${gift.name}!`, 'success');
    showShop();
}

// Показать вывод
function showWithdrawals() {
    if (checkBan()) return;
    
    let html = '<h2>💸 Вывод подарков</h2>';
    
    const availableGifts = inventory.filter(item => !item.withdrawn);
    
    if (availableGifts.length === 0) {
        html += '<p>Нет подарков для вывода</p>';
    } else {
        html += '<div class="gifts-grid">';
        
        availableGifts.forEach((item, index) => {
            const originalIndex = inventory.findIndex(i => i === item);
            html += `
                <div class="gift-card" onclick="requestWithdrawal(${originalIndex})">
                    <div class="emoji">${item.emoji}</div>
                    <div class="name">${item.name}</div>
                    <button class="btn">Подать на вывод</button>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // История выводов
    const userWithdrawals = withdrawals.filter(w => w.userId === userData.id);
    if (userWithdrawals.length > 0) {
        html += '<h3>История выводов</h3>';
        userWithdrawals.forEach(w => {
            const status = w.status === 'approved' ? '✅' : w.status === 'rejected' ? '❌' : '⏳';
            html += `<p>${status} ${w.giftName} - ${new Date(w.date).toLocaleDateString()}</p>`;
        });
    }
    
    document.getElementById('content').innerHTML = html;
}

// Запросить вывод
function requestWithdrawal(index) {
    if (checkBan()) return;
    
    const gift = inventory[index];
    
    const withdrawal = {
        id: Date.now(),
        userId: userData.id,
        username: userData.username,
        giftName: gift.name,
        giftEmoji: gift.emoji,
        giftKey: gift.gift,
        date: new Date().toISOString(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    withdrawals.push(withdrawal);
    inventory[index].withdrawn = true;
    
    saveData();
    showWithdrawals();
    showNotification('✅ Заявка на вывод создана! Ожидайте 7 дней', 'success');
    
    // Уведомление админу (в реальном приложении здесь был бы запрос к боту)
    console.log('🔔 Новая заявка на вывод:', withdrawal);
}

// Показать профиль
function showProfile() {
    if (checkBan()) return;
    
    const html = `
        <h2>👤 Профиль</h2>
        <div style="margin: 20px 0;">
            <p><strong>ID:</strong> ${userData.id}</p>
            <p><strong>Имя:</strong> ${userData.first_name}</p>
            <p><strong>Username:</strong> @${userData.username}</p>
            <p><strong>⭐️ Баланс:</strong> ${userData.stars}</p>
            <p><strong>🎁 Подарков:</strong> ${inventory.length}</p>
            <p><strong>📅 Дата регистрации:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    `;
    
    document.getElementById('content').innerHTML = html;
}

// Перейти в админку
function goToAdmin() {
    if (!userData.isAdmin) {
        showNotification('❌ Доступ запрещен', 'error');
        return;
    }
    
    window.location.href = 'admin.html';
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Инициализация
function init() {
    // Проверка на админа
    if (ADMIN_IDS.includes(userData.id)) {
        userData.isAdmin = true;
        document.getElementById('adminBtn').style.display = 'flex';
    }
    
    loadData();
    showMainMenu();
    
    // Настройка Telegram Web App
    tg.MainButton.setText('Закрыть');
    tg.MainButton.onClick(() => tg.close());
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', init);