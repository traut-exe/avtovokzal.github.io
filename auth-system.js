// ========== СИСТЕМА АВТОРИЗАЦИИ ==========

class UserSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
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
            }
        } catch (e) {
            console.error('Ошибка загрузки текущего пользователя:', e);
            this.currentUser = null;
        }
        
        // Добавляем панель пользователя на страницу
        this.addUserBar();
    }

    // Добавляем панель пользователя на страницу
    addUserBar() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createUserBar());
        } else {
            this.createUserBar();
        }
    }

    createUserBar() {
        // Проверяем, есть ли уже панель
        if (document.getElementById('userBar')) return;

        // Создаем панель пользователя
        const userBar = document.createElement('div');
        userBar.id = 'userBar';
        userBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #1a1a1a;
            border-bottom: 2px solid #333333;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        `;

        // Левая часть - логотип
        const logo = document.createElement('div');
        logo.style.cssText = `
            font-size: 24px;
            font-weight: 900;
            color: #666666;
            letter-spacing: 2px;
        `;
        logo.innerHTML = '🚌 ВОКЗАЛ №69';

        // Правая часть - пользователь
        const userInfo = document.createElement('div');
        userInfo.id = 'userInfo';
        userInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 30px;
            transition: background 0.3s;
        `;

        // Обновляем информацию о пользователе
        this.updateUserInfo(userInfo);

        userInfo.addEventListener('mouseenter', () => {
            userInfo.style.background = '#333333';
        });

        userInfo.addEventListener('mouseleave', () => {
            userInfo.style.background = 'transparent';
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
        document.body.style.paddingTop = '60px';
        document.body.insertBefore(userBar, document.body.firstChild);
    }

    updateUserInfo(element) {
        if (this.currentUser) {
            element.innerHTML = `
                <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: ${this.currentUser.avatar || '#4a4a4a'};
                    border: 2px solid #ffd700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    overflow: hidden;
                ">
                    ${this.currentUser.avatar ? `<img src="${this.currentUser.avatar}" style="width:100%;height:100%;object-fit:cover;">` : '👤'}
                </div>
                <div style="color: white; font-weight: 700;">
                    ${this.currentUser.username}
                </div>
                <div style="color: #ffd700; font-weight: 900;">
                    ${this.currentUser.stats?.balance || 500}💰
                </div>
            `;
        } else {
            element.innerHTML = `
                <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #4a4a4a;
                    border: 2px solid #666666;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                ">👤</div>
                <div style="color: #999999;">Гость</div>
                <div style="color: #ffd700;">🔑 Войти</div>
            `;
        }
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
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Модальное окно
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #2a2a2a;
            border-radius: 30px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
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
            font-size: 24px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => overlay.remove();

        // Заголовок
        const title = document.createElement('h2');
        title.style.cssText = `
            color: #ffd700;
            font-size: 28px;
            margin-bottom: 30px;
            text-align: center;
        `;
        title.innerHTML = '🚌 ВОЙТИ';

        // Табы
        const tabs = document.createElement('div');
        tabs.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        `;

        const loginTab = document.createElement('button');
        loginTab.innerHTML = 'ВХОД';
        loginTab.style.cssText = `
            flex: 1;
            padding: 15px;
            background: #3a3a3a;
            border: none;
            border-radius: 30px;
            color: white;
            font-weight: 700;
            cursor: pointer;
            border: 2px solid #6a6a6a;
        `;

        const registerTab = document.createElement('button');
        registerTab.innerHTML = 'РЕГИСТРАЦИЯ';
        registerTab.style.cssText = `
            flex: 1;
            padding: 15px;
            background: #2a4a2a;
            border: none;
            border-radius: 30px;
            color: white;
            font-weight: 700;
            cursor: pointer;
            border: 2px solid #4a9a4a;
        `;

        tabs.appendChild(loginTab);
        tabs.appendChild(registerTab);

        // Контейнер для форм
        const formContainer = document.createElement('div');
        formContainer.id = 'authFormContainer';

        modal.appendChild(closeBtn);
        modal.appendChild(title);
        modal.appendChild(tabs);
        modal.appendChild(formContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Показываем форму входа по умолчанию
        this.showLoginForm(formContainer);

        // Обработчики табов
        loginTab.addEventListener('click', () => {
            loginTab.style.background = '#3a3a3a';
            loginTab.style.borderColor = '#6a6a6a';
            registerTab.style.background = '#2a4a2a';
            registerTab.style.borderColor = '#4a9a4a';
            this.showLoginForm(formContainer);
        });

        registerTab.addEventListener('click', () => {
            registerTab.style.background = '#3a3a3a';
            registerTab.style.borderColor = '#6a6a6a';
            loginTab.style.background = '#2a4a2a';
            loginTab.style.borderColor = '#4a9a4a';
            this.showRegisterForm(formContainer);
        });

        // Добавляем стили для анимации
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
                
                <button id="loginSubmit" style="
                    width: 100%;
                    padding: 15px;
                    background: #4CAF50;
                    border: none;
                    border-radius: 30px;
                    color: white;
                    font-weight: 700;
                    font-size: 18px;
                    cursor: pointer;
                    transition: all 0.3s;
                ">🚪 ВОЙТИ</button>
            </div>
        `;

        document.getElementById('loginSubmit')?.addEventListener('click', () => {
            const login = document.getElementById('loginLogin')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            if (!login || !password) {
                alert('Заполните все поля!');
                return;
            }
            
            const result = this.login(login, password);
            alert(result.message);
            
            if (result.success) {
                document.getElementById('authOverlay')?.remove();
                this.updateUserInfo(document.getElementById('userInfo'));
                window.location.reload();
            }
        });
    }

    showRegisterForm(container) {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
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
                
                <button id="registerSubmit" style="
                    width: 100%;
                    padding: 15px;
                    background: #4CAF50;
                    border: none;
                    border-radius: 30px;
                    color: white;
                    font-weight: 700;
                    font-size: 18px;
                    cursor: pointer;
                    transition: all 0.3s;
                ">📝 ЗАРЕГИСТРИРОВАТЬСЯ</button>
            </div>
        `;

        document.getElementById('registerSubmit')?.addEventListener('click', () => {
            const username = document.getElementById('regUsername')?.value;
            const login = document.getElementById('regLogin')?.value;
            const password = document.getElementById('regPassword')?.value;
            
            if (!username || !login || !password) {
                alert('Заполните все поля!');
                return;
            }
            
            if (password.length < 3) {
                alert('Пароль должен быть не менее 3 символов');
                return;
            }
            
            const result = this.register(username, login, password);
            alert(result.message);
            
            if (result.success) {
                document.getElementById('authOverlay')?.remove();
                this.updateUserInfo(document.getElementById('userInfo'));
                window.location.reload();
            }
        });
    }

    register(username, login, password) {
        if (!username || !login || !password) {
            return { success: false, message: 'Заполните все поля!' };
        }

        if (password.length < 3) {
            return { success: false, message: 'Пароль должен быть не менее 3 символов' };
        }

        if (this.users[login]) {
            return { success: false, message: 'Пользователь с таким логином уже существует' };
        }

        // Выбираем случайный аватар
        const avatars = [
            '👨‍🦰', '👩', '👨‍🦳', '👩‍🦰', '👴', '👵', '🧔', '🧑‍🦰'
        ];
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

        const newUser = {
            username: username,
            login: login,
            password: this.hashPassword(password),
            avatar: randomAvatar,
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
                despairLevel: 0
            },
            gameData: {
                balance: 500,
                rebornLevel: 0,
                playerLevel: 1,
                totalClicks: 0,
                totalPurchases: 0,
                totalEarned: 500,
                foodPurchased: 0,
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

        this.users[login] = newUser;
        this.saveUsers();
        
        return this.login(login, password);
    }

    login(login, password) {
        const user = this.users[login];
        if (!user) {
            return { success: false, message: 'Пользователь не найден' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Неверный пароль' };
        }

        user.lastLogin = new Date().toISOString();
        this.updateStreak(user);
        
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
        
        return { success: true, message: 'Вход выполнен успешно' };
    }

    logout() {
        this.saveGameDataToUser();
        this.currentUser = null;
        localStorage.removeItem('vokzalCurrentUser');
        window.location.reload();
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

    updateStreak(user) {
        const today = new Date().toDateString();
        const lastLogin = user.dailyTasks?.streak?.lastLogin;
        
        if (!user.dailyTasks) return;

        if (lastLogin !== today) {
            if (lastLogin) {
                const lastDate = new Date(lastLogin);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastDate.toDateString() === yesterday.toDateString()) {
                    user.dailyTasks.streak.count = Math.min((user.dailyTasks.streak.count || 0) + 1, 7);
                } else {
                    user.dailyTasks.streak.count = 1;
                }
            } else {
                user.dailyTasks.streak.count = 1;
            }
            
            user.dailyTasks.streak.lastLogin = today;
            user.dailyTasks.streak.bonusClaimed = false;
        }
    }

    saveGameDataToUser() {
        if (!this.currentUser) return;

        try {
            const gameDataStr = localStorage.getItem('vokzalGameData');
            const gameData = gameDataStr ? JSON.parse(gameDataStr) : {};
            
            const dailyDataStr = localStorage.getItem('dailyTasksData');
            const dailyData = dailyDataStr ? JSON.parse(dailyDataStr) : {};

            const user = this.users[this.currentUser.login];
            if (user) {
                user.stats = { ...user.stats, ...gameData };
                user.gameData = gameData;
                user.dailyTasks = dailyData;
                user.stats.despairLevel = Math.min((user.stats.rebornLevel || 0) * 5, 100);
                
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
                localStorage.setItem('dailyTasksData', JSON.stringify(user.dailyTasks));
                
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
                user.gameData = { ...user.gameData, ...newData };
                user.stats = { ...user.stats, ...newData };
                user.stats.despairLevel = Math.min((user.stats.rebornLevel || 0) * 5, 100);
                
                this.saveUsers();
                
                this.currentUser.stats = user.stats;
                this.currentUser.gameData = user.gameData;
                localStorage.setItem('vokzalCurrentUser', JSON.stringify(this.currentUser));
            }
        } catch (e) {
            console.error('Ошибка обновления данных:', e);
        }
    }

    changeAvatar(avatar) {
        if (!this.currentUser) return;

        try {
            const user = this.users[this.currentUser.login];
            if (user) {
                user.avatar = avatar;
                this.currentUser.avatar = avatar;
                
                this.saveUsers();
                localStorage.setItem('vokzalCurrentUser', JSON.stringify(this.currentUser));
                
                // Обновляем отображение
                this.updateUserInfo(document.getElementById('userInfo'));
                
                return true;
            }
        } catch (e) {
            console.error('Ошибка смены аватара:', e);
        }
        return false;
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
            window.userSystem.updateGameData(gameData);
        } catch (e) {
            console.error('Ошибка сохранения прогресса:', e);
        }
    }
};

// Автосохранение
setInterval(() => {
    window.saveGameProgress();
}, 10000);