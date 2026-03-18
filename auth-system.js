// ========== СИСТЕМА АВТОРИЗАЦИИ ==========

class UserSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
        this.startRealtimeUpdates();
    }

    loadUsers() {
        try {
            const users = localStorage.getItem('vokzalUsers');
            return users ? JSON.parse(users) : {};
        } catch (e) {
            console.error('Ошибка загрузки пользователей:', e);
            return {};
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('vokzalUsers', JSON.stringify(this.users));
        } catch (e) {
            console.error('Ошибка сохранения пользователей:', e);
        }
    }

    init() {
        try {
            const savedUser = localStorage.getItem('vokzalCurrentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                // Принудительно округляем баланс
                if (this.currentUser.stats) {
                    this.currentUser.stats.balance = Math.floor(Number(this.currentUser.stats.balance) || 500);
                }
                if (this.currentUser.gameData) {
                    this.currentUser.gameData.balance = Math.floor(Number(this.currentUser.gameData.balance) || 500);
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки текущего пользователя:', e);
            this.currentUser = null;
        }
        
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createUserBar());
        } else {
            this.createUserBar();
        }
    }

    // Запуск обновлений в реальном времени
    startRealtimeUpdates() {
        // Обновляем каждую секунду
        setInterval(() => {
            this.syncWithGameData();
        }, 1000);
    }

    // Синхронизация с данными игры
    syncWithGameData() {
        if (!this.currentUser) return;

        try {
            // Получаем актуальные данные из игры
            const gameDataStr = localStorage.getItem('vokzalGameData');
            if (gameDataStr) {
                const gameData = JSON.parse(gameDataStr);
                
                // Округляем баланс
                if (gameData.balance !== undefined) {
                    gameData.balance = Math.floor(Number(gameData.balance));
                }
                
                // Обновляем данные пользователя
                const user = this.users[this.currentUser.login];
                if (user) {
                    user.gameData = gameData;
                    user.stats = { ...user.stats, ...gameData };
                    user.stats.balance = Math.floor(Number(user.stats.balance) || 500);
                    
                    this.saveUsers();
                    
                    // Обновляем текущего пользователя
                    this.currentUser.stats = user.stats;
                    this.currentUser.gameData = user.gameData;
                    localStorage.setItem('vokzalCurrentUser', JSON.stringify(this.currentUser));
                    
                    // Обновляем отображение в панели
                    this.updateUserBar();
                }
            }
        } catch (e) {
            console.error('Ошибка синхронизации:', e);
        }
    }

    // Обновление панели пользователя
    updateUserBar() {
        const userInfo = document.getElementById('userInfo');
        if (!userInfo) return;
        
        if (this.currentUser) {
            const balance = Math.floor(Number(this.currentUser.stats?.balance) || 500);
            userInfo.innerHTML = `
                <div style="
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: #4a4a4a;
                    border: 2px solid #ffd700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    overflow: hidden;
                ">
                    ${this.currentUser.avatar ? 
                        `<img src="${this.currentUser.avatar}" style="width:100%;height:100%;object-fit:cover;">` : 
                        '👤'}
                </div>
                <div style="color: white; font-weight: 700; font-size: 16px; white-space: nowrap;">
                    ${this.currentUser.username}
                </div>
                <div style="color: #ffd700; font-weight: 900; font-size: 18px; white-space: nowrap;">
                    ${balance}💰
                </div>
            `;
        } else {
            userInfo.innerHTML = `
                <div style="
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: #4a4a4a;
                    border: 2px solid #666666;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                ">👤</div>
                <div style="color: #999999; font-size: 16px; white-space: nowrap;">Гость</div>
                <div style="color: #ffd700; font-size: 16px; white-space: nowrap;">🔑 Войти</div>
            `;
        }
    }

    createUserBar() {
        // Удаляем старую панель если есть
        const oldBar = document.getElementById('userBar');
        if (oldBar) oldBar.remove();

        // Создаем панель пользователя
        const userBar = document.createElement('div');
        userBar.id = 'userBar';
        userBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 70px;
            background: #1a1a1a;
            border-bottom: 3px solid #333333;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        `;

        // Левая часть - логотип (КЛИКАБЕЛЬНЫЙ!)
        const logo = document.createElement('div');
        logo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: clamp(16px, 4vw, 22px);
            font-weight: 900;
            color: #666666;
            letter-spacing: 2px;
            white-space: nowrap;
            cursor: pointer;
            transition: color 0.3s;
        `;
        logo.innerHTML = '🚌 ВОКЗАЛ №69';
        logo.onmouseenter = () => logo.style.color = '#ffd700';
        logo.onmouseleave = () => logo.style.color = '#666666';
        logo.onclick = () => window.location.href = 'index.html';

        // Правая часть - пользователь
        const userInfo = document.createElement('div');
        userInfo.id = 'userInfo';
        userInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: clamp(5px, 2vw, 15px);
            cursor: pointer;
            padding: 8px 15px;
            border-radius: 40px;
            transition: background 0.3s;
            background: ${this.currentUser ? '#2a2a2a' : '#333333'};
            border: 2px solid ${this.currentUser ? '#ffd700' : '#555555'};
            max-width: 100%;
            overflow-x: auto;
            white-space: nowrap;
        `;

        // Устанавливаем начальное содержимое
        this.updateUserBar();

        userInfo.addEventListener('mouseenter', () => {
            userInfo.style.background = '#444444';
        });

        userInfo.addEventListener('mouseleave', () => {
            userInfo.style.background = this.currentUser ? '#2a2a2a' : '#333333';
        });

        userInfo.addEventListener('click', () => {
            if (this.currentUser) {
                window.location.href = 'profile.html';
            } else {
                this.showAuthModal();
            }
        });

        userBar.appendChild(logo);
        userBar.appendChild(userInfo);

        // Добавляем отступ для контента страницы
        document.body.style.paddingTop = '70px';
        document.body.style.margin = '0';
        document.body.insertBefore(userBar, document.body.firstChild);
    }

    showAuthModal() {
        // Затемненный фон
        const overlay = document.createElement('div');
        overlay.id = 'authOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;

        // Модальное окно
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #2a2a2a;
            border-radius: 40px;
            padding: clamp(20px, 5vw, 40px);
            max-width: 400px;
            width: 100%;
            border: 3px solid #ffd700;
            position: relative;
            animation: modalAppear 0.3s;
        `;

        // Кнопка закрытия
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            color: #999999;
            font-size: 28px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = '#444444';
        closeBtn.onmouseout = () => closeBtn.style.background = 'none';
        closeBtn.onclick = () => overlay.remove();

        // Заголовок
        const title = document.createElement('h2');
        title.style.cssText = `
            color: #ffd700;
            font-size: clamp(24px, 5vw, 32px);
            margin-bottom: 30px;
            text-align: center;
        `;
        title.innerHTML = '🚌 ВОКЗАЛ №69';

        // Контейнер для форм
        const formContainer = document.createElement('div');
        formContainer.id = 'authFormContainer';

        modal.appendChild(closeBtn);
        modal.appendChild(title);
        modal.appendChild(formContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Показываем форму входа
        this.showLoginForm(formContainer);

        // Добавляем стили
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes modalAppear {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    showLoginForm(container) {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="loginTabBtn" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 15px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 30px;
                        color: white;
                        font-weight: 700;
                        font-size: clamp(14px, 3vw, 18px);
                        cursor: pointer;
                        border: 2px solid #8bc34a;
                    ">🔑 ВХОД</button>
                    
                    <button id="registerTabBtn" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 15px;
                        background: #3a3a3a;
                        border: none;
                        border-radius: 30px;
                        color: white;
                        font-weight: 700;
                        font-size: clamp(14px, 3vw, 18px);
                        cursor: pointer;
                        border: 2px solid #666666;
                    ">📝 РЕГИСТРАЦИЯ</button>
                </div>
                
                <input type="text" id="loginLogin" placeholder="Логин" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 15px;
                    background: #1a1a1a;
                    border: 2px solid #3a3a3a;
                    border-radius: 30px;
                    color: white;
                    font-size: clamp(14px, 3vw, 18px);
                ">
                
                <input type="password" id="loginPassword" placeholder="Пароль" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 25px;
                    background: #1a1a1a;
                    border: 2px solid #3a3a3a;
                    border-radius: 30px;
                    color: white;
                    font-size: clamp(14px, 3vw, 18px);
                ">
                
                <button id="loginSubmit" style="
                    width: 100%;
                    padding: 18px;
                    background: #4CAF50;
                    border: none;
                    border-radius: 30px;
                    color: white;
                    font-weight: 700;
                    font-size: clamp(16px, 4vw, 20px);
                    cursor: pointer;
                    transition: all 0.3s;
                ">🚪 ВОЙТИ</button>
            </div>
        `;

        // Обработчики табов
        document.getElementById('loginTabBtn')?.addEventListener('click', () => {
            this.showLoginForm(container);
        });

        document.getElementById('registerTabBtn')?.addEventListener('click', () => {
            this.showRegisterForm(container);
        });

        // Обработчик входа
        document.getElementById('loginSubmit')?.addEventListener('click', () => {
            const login = document.getElementById('loginLogin')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            if (!login || !password) {
                alert('❌ Заполните все поля!');
                return;
            }
            
            const result = this.login(login, password);
            alert(result.message);
            
            if (result.success) {
                document.getElementById('authOverlay')?.remove();
                this.createUserBar();
            }
        });
    }

    showRegisterForm(container) {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="loginTabBtn" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 15px;
                        background: #3a3a3a;
                        border: none;
                        border-radius: 30px;
                        color: white;
                        font-weight: 700;
                        font-size: clamp(14px, 3vw, 18px);
                        cursor: pointer;
                        border: 2px solid #666666;
                    ">🔑 ВХОД</button>
                    
                    <button id="registerTabBtn" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 15px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 30px;
                        color: white;
                        font-weight: 700;
                        font-size: clamp(14px, 3vw, 18px);
                        cursor: pointer;
                        border: 2px solid #8bc34a;
                    ">📝 РЕГИСТРАЦИЯ</button>
                </div>
                
                <input type="text" id="regUsername" placeholder="Отображаемое имя" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 15px;
                    background: #1a1a1a;
                    border: 2px solid #3a3a3a;
                    border-radius: 30px;
                    color: white;
                    font-size: clamp(14px, 3vw, 18px);
                ">
                
                <input type="text" id="regLogin" placeholder="Логин" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 15px;
                    background: #1a1a1a;
                    border: 2px solid #3a3a3a;
                    border-radius: 30px;
                    color: white;
                    font-size: clamp(14px, 3vw, 18px);
                ">
                
                <input type="password" id="regPassword" placeholder="Пароль" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 25px;
                    background: #1a1a1a;
                    border: 2px solid #3a3a3a;
                    border-radius: 30px;
                    color: white;
                    font-size: clamp(14px, 3vw, 18px);
                ">
                
                <button id="registerSubmit" style="
                    width: 100%;
                    padding: 18px;
                    background: #4CAF50;
                    border: none;
                    border-radius: 30px;
                    color: white;
                    font-weight: 700;
                    font-size: clamp(16px, 4vw, 20px);
                    cursor: pointer;
                    transition: all 0.3s;
                ">📝 ЗАРЕГИСТРИРОВАТЬСЯ</button>
            </div>
        `;

        // Обработчики табов
        document.getElementById('loginTabBtn')?.addEventListener('click', () => {
            this.showLoginForm(container);
        });

        document.getElementById('registerTabBtn')?.addEventListener('click', () => {
            this.showRegisterForm(container);
        });

        // Обработчик регистрации
        document.getElementById('registerSubmit')?.addEventListener('click', () => {
            const username = document.getElementById('regUsername')?.value;
            const login = document.getElementById('regLogin')?.value;
            const password = document.getElementById('regPassword')?.value;
            
            if (!username || !login || !password) {
                alert('❌ Заполните все поля!');
                return;
            }
            
            if (password.length < 3) {
                alert('❌ Пароль должен быть не менее 3 символов');
                return;
            }
            
            const result = this.register(username, login, password);
            alert(result.message);
            
            if (result.success) {
                document.getElementById('authOverlay')?.remove();
                this.createUserBar();
            }
        });
    }

    register(username, login, password) {
        if (!username || !login || !password) {
            return { success: false, message: '❌ Заполните все поля!' };
        }

        if (password.length < 3) {
            return { success: false, message: '❌ Пароль должен быть не менее 3 символов' };
        }

        if (this.users[login]) {
            return { success: false, message: '❌ Пользователь с таким логином уже существует' };
        }

        const newUser = {
            username: username,
            login: login,
            password: this.hashPassword(password),
            avatar: null,
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            stats: {
                balance: 500,
                rebornLevel: 0,
                playerLevel: 1
            },
            gameData: {
                balance: 500,
                rebornLevel: 0,
                playerLevel: 1,
                belyashCount: 0,
                samsaCount: 0,
                cheburekCount: 0,
                seedCount: 0,
                activeBoosts: [],
                currentExp: 0
            }
        };

        this.users[login] = newUser;
        this.saveUsers();
        
        return this.login(login, password);
    }

    login(login, password) {
        const user = this.users[login];
        if (!user) {
            return { success: false, message: '❌ Пользователь не найден' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: '❌ Неверный пароль' };
        }

        user.lastLogin = new Date().toISOString();
        
        this.users[login] = user;
        this.saveUsers();

        this.currentUser = {
            login: login,
            username: user.username,
            avatar: user.avatar,
            stats: user.stats,
            gameData: user.gameData
        };
        
        localStorage.setItem('vokzalCurrentUser', JSON.stringify(this.currentUser));
        
        // Загружаем данные пользователя в игру
        this.loadUserDataToGame();
        
        return { success: true, message: '✅ Вход выполнен успешно!' };
    }

    logout() {
        this.saveGameDataToUser();
        this.currentUser = null;
        localStorage.removeItem('vokzalCurrentUser');
        window.location.href = 'index.html';
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    saveGameDataToUser() {
        if (!this.currentUser) return;

        try {
            const gameDataStr = localStorage.getItem('vokzalGameData');
            const gameData = gameDataStr ? JSON.parse(gameDataStr) : {};

            const user = this.users[this.currentUser.login];
            if (user) {
                // Округляем баланс
                if (gameData.balance !== undefined) {
                    gameData.balance = Math.floor(Number(gameData.balance));
                }
                
                user.stats = { ...user.stats, ...gameData };
                user.gameData = gameData;
                
                this.saveUsers();
            }
        } catch (e) {
            console.error('Ошибка сохранения данных:', e);
        }
    }

    loadUserDataToGame() {
        if (!this.currentUser) return;

        try {
            const user = this.users[this.currentUser.login];
            if (user) {
                localStorage.setItem('vokzalGameData', JSON.stringify(user.gameData));
                
                this.currentUser.stats = user.stats;
                this.currentUser.gameData = user.gameData;
            }
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
        }
    }

    updateGameData(newData) {
        if (!this.currentUser) return;

        try {
            const user = this.users[this.currentUser.login];
            if (user) {
                // Округляем баланс
                if (newData.balance !== undefined) {
                    newData.balance = Math.floor(Number(newData.balance));
                }
                
                user.gameData = { ...user.gameData, ...newData };
                user.stats = { ...user.stats, ...newData };
                
                this.saveUsers();
                
                this.currentUser.stats = user.stats;
                this.currentUser.gameData = user.gameData;
                localStorage.setItem('vokzalCurrentUser', JSON.stringify(this.currentUser));
                
                // Обновляем отображение
                this.updateUserBar();
            }
        } catch (e) {
            console.error('Ошибка обновления данных:', e);
        }
    }

    // Загрузка картинки из памяти с обработкой
    uploadAvatar(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageData = e.target.result;
                
                if (!this.currentUser) {
                    reject('Пользователь не авторизован');
                    return;
                }

                try {
                    const user = this.users[this.currentUser.login];
                    if (user) {
                        user.avatar = imageData;
                        this.currentUser.avatar = imageData;
                        
                        this.saveUsers();
                        localStorage.setItem('vokzalCurrentUser', JSON.stringify(this.currentUser));
                        
                        // Обновляем отображение
                        this.updateUserBar();
                        
                        resolve(imageData);
                    } else {
                        reject('Пользователь не найден');
                    }
                } catch (e) {
                    reject('Ошибка сохранения: ' + e.message);
                }
            };
            
            reader.onerror = () => reject('Ошибка чтения файла');
            reader.readAsDataURL(file);
        });
    }
}

// Создаем глобальный экземпляр
window.userSystem = new UserSystem();

// Функция для сохранения прогресса
window.saveGameProgress = function() {
    if (window.userSystem?.currentUser) {
        try {
            const gameDataStr = localStorage.getItem('vokzalGameData');
            const gameData = gameDataStr ? JSON.parse(gameDataStr) : {};
            if (gameData.balance !== undefined) {
                gameData.balance = Math.floor(Number(gameData.balance));
            }
            window.userSystem.updateGameData(gameData);
        } catch (e) {
            console.error('Ошибка сохранения прогресса:', e);
        }
    }
};

// Автосохранение
setInterval(() => {
    window.saveGameProgress();
}, 3000);