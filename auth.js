// ================================================================
//  auth.js — АВТОРИЗАЦИЯ И РАНДОМНЫЕ ИМЕНА
// ================================================================

const STORAGE_KEY = 'match3Users';
const CURRENT_USER_KEY = 'match3CurrentUser';

function getUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; }
}

function saveUsers(u) { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)); } catch(e) { return null; }
}

function setCurrentUser(u) {
    if (u) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(CURRENT_USER_KEY);
}

function getUserData(username) {
    const users = getUsers();
    return users[username] || null;
}

function saveUserData(username, data) {
    const users = getUsers();
    users[username] = data;
    saveUsers(users);
}

// ---- РАНДОМНЫЕ ИМЕНА ----
const FIRST_NAMES = ['Весёлый','Храбрый','Мудрый','Быстрый','Сильный','Смелый','Добрый','Светлый','Тёмный','Золотой','Серебряный','Огненный','Ледяной','Громовой','Солнечный','Лунный','Звёздный','Космический','Легендарный','Бессмертный'];
const SECOND_NAMES = ['Петух','Волк','Лис','Орёл','Сокол','Тигр','Лев','Медведь','Дракон','Феникс','Кит','Дельфин','Акула','Рысь','Барс','Грифон','Единорог','Цербер','Пегас','Химера'];
const THIRD_NAMES = ['на закате','в рассвете','в тумане','в грозе','в буре','в ночи','в дне','в тени','в свете','в пламени','в ледяной мгле','в золотой пыли','в серебряном дожде','в звёздном ветре','в лунном сиянии'];

function generateRandomName() {
    return FIRST_NAMES[Math.floor(Math.random()*FIRST_NAMES.length)] + ' ' +
           SECOND_NAMES[Math.floor(Math.random()*SECOND_NAMES.length)] + ' ' +
           THIRD_NAMES[Math.floor(Math.random()*THIRD_NAMES.length)];
}

function generateUniqueName() {
    const users = getUsers();
    let name, attempts = 0;
    do {
        name = generateRandomName();
        attempts++;
    } while (users[name] && attempts < 100);
    return name;
}

// ---- АВТО-ВХОД ----
function getOrCreateUser() {
    let user = getCurrentUser();
    let users = getUsers();

    // Если есть сохранённый пользователь — возвращаем его
    if (user && users[user]) {
        console.log('👤 Найден сохранённый пользователь:', user);
        return user;
    }

    // Если есть другие пользователи — берём первого
    let names = Object.keys(users);
    if (names.length > 0) {
        let u = names[Math.floor(Math.random() * names.length)];
        setCurrentUser(u);
        console.log('👤 Выбран существующий пользователь:', u);
        return u;
    }

    // Иначе создаём нового
    let name = generateUniqueName();
    users[name] = {
        highScore: 0,
        money: 0,
        level: 1,
        stars: 0,
        bonuses: { rocket: 0, bomb: 0, rainbow: 0, double: 0 },
        created: Date.now()
    };
    saveUsers(users);
    setCurrentUser(name);
    console.log('👤 Создан новый пользователь:', name);
    return name;
}

// ---- ПОКАЗ ЭКРАНА АВТОРИЗАЦИИ ----
function showAuthScreen() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    const user = getOrCreateUser();
    const nameDisplay = document.getElementById('userName');
    if (nameDisplay) nameDisplay.textContent = user;
    // Запускаем игру
    if (typeof startGame === 'function') {
        startGame();
    }
    return user;
}

// ---- ЗАПУСК ПРИ ЗАГРУЗКЕ ----
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('authSubmitBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            showAuthScreen();
        });
    }

    // Проверяем, есть ли сохранённый пользователь
    const savedUser = getCurrentUser();
    if (savedUser) {
        const users = getUsers();
        if (users[savedUser]) {
            document.getElementById('authOverlay').style.display = 'none';
            document.getElementById('userName').textContent = savedUser;
            if (typeof startGame === 'function') {
                startGame();
            }
            console.log('✅ Авто-вход для:', savedUser);
            return;
        }
    }

    // Если пользователя нет — показываем экран входа
    document.getElementById('authOverlay').style.display = 'flex';
    console.log('❌ Требуется вход');
});

console.log('🔐 auth.js загружен!');
