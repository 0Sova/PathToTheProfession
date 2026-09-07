// ============================================================
// index.js — UI и навигация (с подтверждением ответа)
// ============================================================

// ===== СОСТОЯНИЕ =====
let currentQuestionIndex = 0;
let totalQuestions = 0;
let selectedProfile = null; // временно хранит выбранный профиль

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getContainer() {
    return document.querySelector('.content');
}

// ===== ПРОГРЕСС-БАР =====
function updateProgress(stepIndex) {
    const steps = document.querySelectorAll('.step');
    
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        
        if (index < stepIndex) {
            step.classList.add('completed');
        } else if (index === stepIndex) {
            step.classList.add('active');
        }
    });
}

// ===== ОПРЕДЕЛЕНИЕ ШАГА =====
function getCurrentStep() {
    if (currentQuestionIndex === 0 && totalQuestions === 0) return 0;
    if (currentQuestionIndex < 5) return 1;
    if (currentQuestionIndex < 10) return 2;
    return 3;
}

// ===== СТАРТОВЫЙ ЭКРАН =====
function renderStartScreen() {
    const container = getContainer();
    container.innerHTML = `
        <h1>Путь в профессию</h1>
        <p class="subtitle-top">Найди свою образовательную программу в ИРИТ-РТФ</p>
        <p class="description">
            Пройди квиз — узнай свою специальность, план на 4 года и миссию до 1 сентября.
        </p>
        <button class="btn-primary" onclick="startQuiz()">Начать</button>
        <div class="footer-note">
            <span>ИРИТ-РТФ</span> · Уральский федеральный университет
        </div>
    `;
    updateProgress(0);
}

// ===== СТАРТ КВИЗА =====
function startQuiz() {
    currentQuestionIndex = 0;
    totalQuestions = questions.length;
    selectedProfile = null;
    window.answers = [];
    renderQuestion();
}

// ===== ОТРИСОВКА ВОПРОСА =====
function renderQuestion() {
    const q = questions[currentQuestionIndex];
    const container = getContainer();
    selectedProfile = null;

    const shuffledOptions = shuffleArray([...q.options]);

    let optionsHtml = shuffledOptions.map((opt, index) => `
        <button class="option-btn" data-index="${index}" onclick="selectOption('${opt.profile}', ${index})">
            ${opt.text}
        </button>
    `).join('');

    container.innerHTML = `
        <div class="question-text">${q.text}</div>
        <div class="options">${optionsHtml}</div>
        <div class="question-counter" style="margin-top: 24px; text-align: center; color: #8aa0bc; font-size: 14px;">
            ${currentQuestionIndex + 1} / ${totalQuestions}
        </div>
        <div class="confirm-wrapper">
            <button class="btn-confirm" id="confirmBtn" onclick="confirmAnswer()" disabled>
                Дальше
            </button>
        </div>
    `;

    const step = getCurrentStep();
    updateProgress(step);
}

// ===== ВЫБОР ОТВЕТА (только подсветка) =====
function selectOption(profile, index) {
    selectedProfile = profile;

    // Убираем подсветку у всех кнопок
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn, i) => {
        btn.classList.remove('selected');
        if (i === index) {
            btn.classList.add('selected');
        }
    });

    // Активируем кнопку подтверждения
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
    }
}

// ===== ПОДТВЕРЖДЕНИЕ ОТВЕТА =====
function confirmAnswer() {
    if (!selectedProfile) {
        alert('Сначала выбери вариант ответа!');
        return;
    }

    // Сохраняем ответ
    if (typeof window.answers === 'undefined') {
        window.answers = [];
    }
    window.answers.push(selectedProfile);

    console.log(`Ответ сохранён: ${selectedProfile}`);

    // Переходим к следующему вопросу
    currentQuestionIndex++;

    if (currentQuestionIndex < totalQuestions) {
        renderQuestion();
    } else {
        renderResult();
    }
}

// ===== РЕЗУЛЬТАТ =====
// ===== РЕЗУЛЬТАТ =====
function renderResult() {
    const container = getContainer();
    const result = calculateResult(window.answers);
    
    // Определяем название оси
    const axisNames = {
        'A': '🧠 Искусственный интеллект и алгоритмы',
        'B': '🔧 Радиотехника и электроника',
        'C': '💻 Программирование и разработка ПО',
        'D': '🛡️ Информационная безопасность',
        'E': '📡 Сети и телекоммуникации'
    };
    
    let html = `
        <div class="result-container">
            <h2>🎯 Твои направления</h2>
            <p class="subtitle-top">На основе твоих ответов мы подобрали программы</p>
            
            <div class="result-programs">
                ${result.programs.map((programs, index) => `
                    <div class="program-card">
                        <h3>${index === 0 ? '⭐ Основное направление' : '🔄 Альтернатива'}</h3>
                        <p class="program-axis">${axisNames[result.axes[index]] || result.axes[index]}</p>
                        ${programs.map(p => `
                            <div class="program-item">
                                <strong>${p.title}</strong>
                                <span class="program-code">${p.code}</span>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            
            <div class="result-actions">
                <button class="btn-primary" onclick="location.reload()">🔄 Пройти заново</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    updateProgress(3); // Специальность
}

// ===== СТАРТ =====
document.addEventListener('DOMContentLoaded', () => {
    if (typeof questions === 'undefined') {
        console.error('Ошибка: questions не найдены. Проверь подключение logic.js');
        return;
    }
    window.answers = [];
    renderStartScreen();
});