
    // ========== СИСТЕМА РЕГИСТРАЦИИ И ПРОФИЛЕЙ ==========

// Класс для работы с пользователями
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
    }

    // Загрузка пользователей из localStorage
    loadUsers() {
        const users = localStorage.getItem('vokzalUsers');
        return users ? JSON.parse(users) : {};
    }

    // Сохранение пользователей
    saveUsers() {
        localStorage.setItem('vokzalUsers', JSON.stringify(this.users));
    }

    // Инициализация
    init() {
        // Проверяем, есть ли текущий пользователь
        const savedUser = localStorage.getItem('vokzalCurrentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
        this.updateUIBasedOnAuth();
    }

    // Регистрация нового пользователя
    register(username, login, password) {
        // Проверяем, не занят ли логин
        if (this.users[login]) {
            return { success: false, message: 'Пользователь с таким логином уже существует' };
        }

        // Создаем нового пользователя
        const newUser = {
            username: username,
            login: login,
            password: this.hashPassword(password), // Простое хеширование
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            stats: {
                balance: 500,
                rebornLevel: 0,
                playerLevel: 1,
                totalClicks: 0,
                totalPurchases: 0,
                totalEarned: 500,
                foodPurchased: 0,
                despairLevel: 0 // уровень отчаяния
            },
            gameData: {
                belyashCount: 0,
                samsaCount: 0,
                cheburekCount: 0,
                seedCount: 0,
                activeBoosts: [],
                currentExp: 0
            },
            dailyTasks: {
                lastReset: new Date().toDateString(),
                tasks: {
                    task1: { progress: 0, completed: false, claimed: false },
                    task2: { progress: 0, completed: false, claimed: false },
                    task3: { progress: 0, completed: false, claimed: false },
                    task4: { progress: 0, completed: false, claimed: false }
                },
                streak: {
                    count: 1,
                    lastLogin: new Date().toDateString(),
                    bonusClaimed: false
                }
            }
        };

        // Сохраняем пользователя
        this.users[login] = newUser;
        this.saveUsers();
        
        // Автоматически входим после регистрации
        this.login(login, password);
        
        return { success: true, message: 'Регистрация успешна!' };
    }

    // Вход в систему
    login(login, password) {
        const user = this.users[login];
        if (!user) {
            return { success: false, message: 'Пользователь не найден' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Неверный пароль' };
        }

        // Обновляем время последнего входа
        user.lastLogin = new Date().toISOString();
        this.users[login] = user;
        this.saveUsers();

        // Сохраняем текущего пользователя
        this.currentUser = {
            login: login,
            username: user.username,
            stats: user.stats,
            gameData: user.gameData
        };
        
        localStorage.setItem('vokzalCurrentUser', JSON.stringify(this.currentUser));
        
        // Загружаем данные пользователя в игру
        this.loadUserDataToGame();
        
        return { success: true, message: 'Вход выполнен успешно' };
    }

    // Выход из системы
    logout() {
        // Сохраняем текущие данные игры перед выходом
        this.saveGameDataToUser();
        
        this.currentUser = null;
        localStorage.removeItem('vokzalCurrentUser');
        
        // Перезагружаем страницу для сброса данных
        window.location.reload();
    }

    // Простое хеширование пароля (для демо, в реальном проекте используйте bcrypt)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    // Сохранение данных игры в профиль пользователя
    saveGameDataToUser() {
        if (!this.currentUser) return;

        // Получаем текущие данные игры из localStorage
        const gameData = JSON.parse(localStorage.getItem('vokzalGameData') || '{}');
        const dailyData = JSON.parse(localStorage.getItem('dailyTasksData') || '{}');

        // Обновляем статистику пользователя
        const user = this.users[this.currentUser.login];
        if (user) {
            user.stats = {
                ...user.stats,
                ...gameData
            };
            user.gameData = gameData;
            user.dailyTasks = dailyData;
            
            // Обновляем уровень отчаяния (чем больше перерождений, тем выше)
            user.stats.despairLevel = Math.min(user.stats.rebornLevel * 10, 100);
            
            this.saveUsers();
        }
    }

    // Загрузка данных пользователя в игру
    loadUserDataToGame() {
        if (!this.currentUser) return;

        const user = this.users[this.currentUser.login];
        if (user) {
            // Сохраняем данные в localStorage для игры
            localStorage.setItem('vokzalGameData', JSON.stringify(user.gameData));
            localStorage.setItem('dailyTasksData', JSON.stringify(user.dailyTasks));
            
            // Обновляем статистику в текущем пользователе
            this.currentUser.stats = user.stats;
            this.currentUser.gameData = user.gameData;
        }
    }

    // Обновление данных игры
    updateGameData(newData) {
        if (!this.currentUser) return;

        const user = this.users[this.currentUser.login];
        if (user) {
            user.gameData = { ...user.gameData, ...newData };
            user.stats = { ...user.stats, ...newData };
            user.stats.despairLevel = Math.min(user.stats.rebornLevel * 10, 100);
            
            this.saveUsers();
            
            // Обновляем текущего пользователя
            this.currentUser.stats = user.stats;
            this.currentUser.gameData = user.gameData;
            localStorage.setItem('vokzalCurrentUser', JSON.stringify(this.currentUser));
        }
    }

    // Получение статистики пользователя
    getUserStats() {
        if (!this.currentUser) return null;
        return this.currentUser.stats;
    }

    // Обновление интерфейса в зависимости от авторизации
    updateUIBasedOnAuth() {
        // Этот метод будет вызываться на каждой странице
        const userSection = document.getElementById('userSection');
        if (!userSection) return;

        if (this.currentUser) {
            userSection.innerHTML = this.getLoggedInUI();
        } else {
            userSection.innerHTML = this.getLoginUI();
        }
    }

    // HTML для залогиненного пользователя
    getLoggedInUI() {
        return `
            <div style="
                background: #2a2a2a;
                border-radius: 40px;
                padding: 15px;
                border: 2px solid #6a6a6a;
                box-shadow: 0 4px 0 #1a1a1a;
                margin-bottom: 15px;
            ">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: #3a3a3a;
                        border: 3px solid #ffd700;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 30px;
                    ">👤</div>
                    <div style="flex: 1;">
                        <div style="color: #ffd700; font-size: 20px; font-weight: 900;">${this.currentUser.username}</div>
                        <div style="color: #9a9a9a; font-size: 14px;">${this.currentUser.login}</div>
                    </div>
                    <button id="logoutBtn" style="
                        background: #4a2a2a;
                        border: none;
                        border-radius: 30px;
                        padding: 10px 15px;
                        color: #ffaaaa;
                        font-weight: 700;
                        border: 2px solid #8b0000;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">🚪 Выйти</button>
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 10px;
                ">
                    <div style="background: #1e1e1e; border-radius: 20px; padding: 10px; text-align: center; border: 1px solid #3a3a3a;">
                        <div style="color: #9a9a9a; font-size: 12px;">💰 Монеты</div>
                        <div style="color: #ffd700; font-size: 20px; font-weight: 900;">${this.currentUser.stats.balance}</div>
                    </div>
                    <div style="background: #1e1e1e; border-radius: 20px; padding: 10px; text-align: center; border: 1px solid #3a3a3a;">
                        <div style="color: #9a9a9a; font-size: 12px;">🔄 Перерождений</div>
                        <div style="color: #ffaa00; font-size: 20px; font-weight: 900;">${this.currentUser.stats.rebornLevel}</div>
                    </div>
                    <div style="background: #1e1e1e; border-radius: 20px; padding: 10px; text-align: center; border: 1px solid #3a3a3a;">
                        <div style="color: #9a9a9a; font-size: 12px;">📊 Разряд</div>
                        <div style="color: #4CAF50; font-size: 20px; font-weight: 900;">${this.currentUser.stats.playerLevel}</div>
                    </div>
                    <div style="background: #1e1e1e; border-radius: 20px; padding: 10px; text-align: center; border: 1px solid #3a3a3a;">
                        <div style="color: #9a9a9a; font-size: 12px;">😫 Отчаяние</div>
                        <div style="color: #8b0000; font-size: 20px; font-weight: 900;">${this.currentUser.stats.despairLevel || 0}%</div>
                    </div>
                </div>
                
                <div style="
                    margin-top: 15px;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                ">
                    <a href="profile.html" style="
                        background: #3a3a3a;
                        border: none;
                        border-radius: 30px;
                        padding: 10px 20px;
                        color: white;
                        font-weight: 700;
                        text-decoration: none;
                        text-align: center;
                        flex: 1;
                        border: 2px solid #6a6a6a;
                        transition: all 0.3s;
                    ">📊 Профиль</a>
                </div>
            </div>
        `;
    }

    // HTML для неавторизованного пользователя
    getLoginUI() {
        return `
            <div style="
                background: #2a2a2a;
                border-radius: 40px;
                padding: 20px;
                border: 2px solid #6a6a6a;
                box-shadow: 0 4px 0 #1a1a1a;
                margin-bottom: 15px;
                text-align: center;
            ">
                <div style="font-size: 48px; margin-bottom: 10px;">🚌</div>
                <div style="color: #c0c0c0; font-size: 20px; font-weight: 900; margin-bottom: 15px;">ВОЙДИ В СИСТЕМУ</div>
                
                <button id="showLoginBtn" style="
                    background: #3a3a3a;
                    border: none;
                    border-radius: 30px;
                    padding: 15px;
                    width: 100%;
                    color: white;
                    font-weight: 700;
                    font-size: 16px;
                    border: 2px solid #6a6a6a;
                    cursor: pointer;
                    margin-bottom: 10px;
                    transition: all 0.3s;
                ">🔑 Вход</button>
                
                <button id="showRegisterBtn" style="
                    background: #2a4a2a;
                    border: none;
                    border-radius: 30px;
                    padding: 15px;
                    width: 100%;
                    color: white;
                    font-weight: 700;
                    font-size: 16px;
                    border: 2px solid #4a9a4a;
                    cursor: pointer;
                    transition: all 0.3s;
                ">📝 Регистрация</button>
            </div>

            <!-- Модальное окно входа -->
            <div id="loginModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10000;
                display: none;
                justify-content: center;
                align-items: center;
            ">
                <div style="
                    background: #2a2a2a;
                    border-radius: 40px;
                    padding: 30px;
                    max-width: 350px;
                    width: 90%;
                    border: 3px solid #6a6a6a;
                ">
                    <h2 style="color: #ffd700; margin-bottom: 20px; text-align: center;">🔑 ВХОД</h2>
                    
                    <input type="text" id="loginLogin" placeholder="Логин" style="
                        width: 100%;
                        padding: 15px;
                        margin-bottom: 15px;
                        background: #1a1a1a;
                        border: 2px solid #3a3a3a;
                        border-radius: 30px;
                        color: white;
                        font-size: 16px;
                    ">
                    
                    <input type="password" id="loginPassword" placeholder="Пароль" style="
                        width: 100%;
                        padding: 15px;
                        margin-bottom: 20px;
                        background: #1a1a1a;
                        border: 2px solid #3a3a3a;
                        border-radius: 30px;
                        color: white;
                        font-size: 16px;
                    ">
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="loginSubmit" style="
                            flex: 2;
                            background: #4CAF50;
                            border: none;
                            border-radius: 30px;
                            padding: 15px;
                            color: white;
                            font-weight: 700;
                            cursor: pointer;
                        ">Войти</button>
                        
                        <button id="loginClose" style="
                            flex: 1;
                            background: #4a4a4a;
                            border: none;
                            border-radius: 30px;
                            padding: 15px;
                            color: white;
                            font-weight: 700;
                            cursor: pointer;
                        ">✕</button>
                    </div>
                </div>
            </div>

            <!-- Модальное окно регистрации -->
            <div id="registerModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10000;
                display: none;
                justify-content: center;
                align-items: center;
            ">
                <div style="
                    background: #2a2a2a;
                    border-radius: 40px;
                    padding: 30px;
                    max-width: 350px;
                    width: 90%;
                    border: 3px solid #6a6a6a;
                ">
                    <h2 style="color: #ffd700; margin-bottom: 20px; text-align: center;">📝 РЕГИСТРАЦИЯ</h2>
                    
                    <input type="text" id="regUsername" placeholder="Отображаемое имя" style="
                        width: 100%;
                        padding: 15px;
                        margin-bottom: 15px;
                        background: #1a1a1a;
                        border: 2px solid #3a3a3a;
                        border-radius: 30px;
                        color: white;
                        font-size: 16px;
                    ">
                    
                    <input type="text" id="regLogin" placeholder="Логин" style="
                        width: 100%;
                        padding: 15px;
                        margin-bottom: 15px;
                        background: #1a1a1a;
                        border: 2px solid #3a3a3a;
                        border-radius: 30px;
                        color: white;
                        font-size: 16px;
                    ">
                    
                    <input type="password" id="regPassword" placeholder="Пароль" style="
                        width: 100%;
                        padding: 15px;
                        margin-bottom: 20px;
                        background: #1a1a1a;
                        border: 2px solid #3a3a3a;
                        border-radius: 30px;
                        color: white;
                        font-size: 16px;
                    ">
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="registerSubmit" style="
                            flex: 2;
                            background: #4CAF50;
                            border: none;
                            border-radius: 30px;
                            padding: 15px;
                            color: white;
                            font-weight: 700;
                            cursor: pointer;
                        ">Зарегистрироваться</button>
                        
                        <button id="registerClose" style="
                            flex: 1;
                            background: #4a4a4a;
                            border: none;
                            border-radius: 30px;
                            padding: 15px;
                            color: white;
                            font-weight: 700;
                            cursor: pointer;
                        ">✕</button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Создаем глобальный экземпляр
window.userSystem = new UserSystem();

// Инициализация обработчиков
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем секцию пользователя в начало каждой страницы
    const container = document.querySelector('.game-container');
    if (container) {
        const userSection = document.createElement('div');
        userSection.id = 'userSection';
        container.insertBefore(userSection, container.firstChild);
    }
    
    // Обновляем интерфейс
    window.userSystem.updateUIBasedOnAuth();
    
    // Обработчики для модальных окон
    setupModalHandlers();
});

// Настройка обработчиков модальных окон
function setupModalHandlers() {
    // Показ окна входа
    const showLoginBtn = document.getElementById('showLoginBtn');
    const loginModal = document.getElementById('loginModal');
    const loginClose = document.getElementById('loginClose');
    
    if (showLoginBtn && loginModal) {
        showLoginBtn.addEventListener('click', () => {
            loginModal.style.display = 'flex';
        });
    }
    
    if (loginClose && loginModal) {
        loginClose.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }
    
    // Показ окна регистрации
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const registerModal = document.getElementById('registerModal');
    const registerClose = document.getElementById('registerClose');
    
    if (showRegisterBtn && registerModal) {
        showRegisterBtn.addEventListener('click', () => {
            registerModal.style.display = 'flex';
        });
    }
    
    if (registerClose && registerModal) {
        registerClose.addEventListener('click', () => {
            registerModal.style.display = 'none';
        });
    }
    
    // Обработка входа
    const loginSubmit = document.getElementById('loginSubmit');
    if (loginSubmit) {
        loginSubmit.addEventListener('click', () => {
            const login = document.getElementById('loginLogin').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!login || !password) {
                alert('Заполните все поля!');
                return;
            }
            
            const result = window.userSystem.login(login, password);
            alert(result.message);
            
            if (result.success) {
                loginModal.style.display = 'none';
                window.location.reload();
            }
        });
    }
    
    // Обработка регистрации
    const registerSubmit = document.getElementById('registerSubmit');
    if (registerSubmit) {
        registerSubmit.addEventListener('click', () => {
            const username = document.getElementById('regUsername').value;
            const login = document.getElementById('regLogin').value;
            const password = document.getElementById('regPassword').value;
            
            if (!username || !login || !password) {
                alert('Заполните все поля!');
                return;
            }
            
            if (password.length < 3) {
                alert('Пароль должен быть не менее 3 символов');
                return;
            }
            
            const result = window.userSystem.register(username, login, password);
            alert(result.message);
            
            if (result.success) {
                registerModal.style.display = 'none';
                window.location.reload();
            }
        });
    }
    
    // Обработка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.userSystem.logout();
        });
    }
}

// Функция для сохранения данных игры (вызывать при каждом действии)
window.saveGameProgress = function() {
    if (window.userSystem && window.userSystem.currentUser) {
        // Получаем текущие данные игры
        const gameData = JSON.parse(localStorage.getItem('vokzalGameData') || '{}');
        window.userSystem.updateGameData(gameData);
    }
};

// Автосохранение каждые 10 секунд
setInterval(() => {
    window.saveGameProgress();
}, 10000);