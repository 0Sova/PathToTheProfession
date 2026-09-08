// ============================================================
// index.js — UI и навигация
// ============================================================

// ===== СОСТОЯНИЕ =====
let currentQuestionIndex = 0;
let totalQuestions = 0;
let selectedProfile = null;
let selectedProfiles = [];

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

// ===== РАБОТА С LOCALSTORAGE =====

function saveQuizData(selectedProgram = null) {
    const data = {
        answers: window.answers || [],
        result: window.lastResult || null,
        selectedProgram: selectedProgram || null,
        timestamp: Date.now()
    };
    localStorage.setItem('quizResult', JSON.stringify(data));
}

function loadQuizData() {
    const saved = localStorage.getItem('quizResult');
    if (!saved) return null;
    try {
        const data = JSON.parse(saved);
        if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem('quizResult');
            return null;
        }
        return data;
    } catch {
        localStorage.removeItem('quizResult');
        return null;
    }
}

function clearQuizData() {
    localStorage.removeItem('quizResult');
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
    clearQuizData();
    currentQuestionIndex = 0;
    totalQuestions = questions.length;
    selectedProfile = null;
    selectedProfiles = [];
    window.answers = [];
    window.lastResult = null;
    renderQuestion();
}

// ===== ОТРИСОВКА ВОПРОСА =====
function renderQuestion() {
    const q = questions[currentQuestionIndex];
    const container = getContainer();
    selectedProfiles = [];

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
// ===== ВЫБОР ОТВЕТА (одиночный) =====
function selectOption(profile, index) {
    // Сбрасываем подсветку у всех кнопок
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn) => btn.classList.remove('selected'));

    // Подсвечиваем выбранную кнопку
    const selectedBtn = document.querySelector(`.option-btn[data-index="${index}"]`);
    selectedBtn.classList.add('selected');

    // Сохраняем выбранный профиль
    selectedProfile = profile;
    selectedProfiles = [profile];

    // Активируем кнопку подтверждения
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
    }
}

// ===== ПОДТВЕРЖДЕНИЕ ОТВЕТА =====
function confirmAnswer() {
    if (selectedProfiles.length === 0) {
        alert('Выбери хотя бы один вариант!');
        return;
    }

    if (typeof window.answers === 'undefined') {
        window.answers = [];
    }
    window.answers.push(selectedProfiles);

    console.log(`Ответ сохранён: ${selectedProfiles.join(', ')}`);

    currentQuestionIndex++;

    if (currentQuestionIndex < totalQuestions) {
        renderQuestion();
    } else {
        renderResult();
    }
}

// ===== НАЙТИ ПРОГРАММУ ПО НАЗВАНИЮ =====
function findProgram(title) {
    for (const axis of Object.keys(programMap)) {
        for (const program of programMap[axis]) {
            if (program.title === title) {
                return { axis, program };
            }
        }
    }
    return null;
}

// ===== ОТРИСОВКА РЕЗУЛЬТАТА (список программ) =====
function renderResult() {
    const container = getContainer();
    const result = calculateResult(window.answers);
    window.lastResult = result;
    saveQuizData(null); // сохраняем результат без выбранной программы
    
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
                            <div class="program-item" onclick="showProgramDetail('${p.title}')">
                                <div class="program-header">
                                    <div class="program-title-row">
                                        <strong>${p.title}</strong>
                                        <span class="program-code-inline">${p.code}</span>
                                    </div>
                                    ${p.tags ? p.tags.map(tag => `<span class="program-tag">${tag}</span>`).join('') : ''}
                                </div>
                                <div class="program-keywords">
                                    ${p.keywords ? p.keywords.map(kw => `<span class="keyword">${kw}</span>`).join('') : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            
            <div class="result-actions">
                <button class="btn-primary" onclick="resetQuiz()">🔄 Пройти заново</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    updateProgress(3);
}

// ===== ДЕТАЛЬНЫЙ ЭКРАН ПРОГРАММЫ =====
function showProgramDetail(title) {
    const found = findProgram(title);
    if (!found) {
        alert('Программа не найдена');
        return;
    }
    
    const { axis, program } = found;
    const axisNames = {
        'A': '🧠 Искусственный интеллект и алгоритмы',
        'B': '🔧 Радиотехника и электроника',
        'C': '💻 Программирование и разработка ПО',
        'D': '🛡️ Информационная безопасность',
        'E': '📡 Сети и телекоммуникации'
    };
    
    const container = getContainer();
    
    let html = `
        <div class="program-detail">
            <button class="btn-back" onclick="renderResult()">← Назад к списку</button>
            
            <div class="detail-header">
                <h2>${program.title}</h2>
                ${program.tags ? program.tags.map(tag => `<span class="program-tag detail-tag">${tag}</span>`).join('') : ''}
                <span class="program-code detail-code">${program.code}</span>
                <p class="program-axis-detail">${axisNames[axis] || axis}</p>
            </div>
            
            <div class="detail-section">
                <h4>📖 О программе</h4>
                <p>${program.description || 'Описание отсутствует'}</p>
            </div>
            
            <div class="detail-section">
                <h4>🔑 Ключевые навыки</h4>
                <div class="detail-keywords">
                    ${program.keywords ? program.keywords.map(kw => `<span class="keyword">${kw}</span>`).join('') : ''}
                </div>
            </div>
            
            <div class="detail-actions" style="justify-content: center;">
                <button class="btn-primary" onclick="selectProgram('${program.title}')">✅ Выбрать</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== ВЫБОР ПРОГРАММЫ (ФИНАЛЬНЫЙ ЭКРАН) =====
function selectProgram(title) {
    saveQuizData(title); // сохраняем с выбранной программой
    const program = getProgramDetails(title);
    if (!program) {
        alert('Ошибка: данные по программе не найдены.');
        return;
    }
    renderFinalScreen(program);
}

// ===== ОТРИСОВКА ФИНАЛЬНОГО ЭКРАНА =====
function renderFinalScreen(program) {
    const container = getContainer();

    let roadmapHtml = '';
    if (program.roadmap && program.roadmap.length > 0) {
        roadmapHtml = program.roadmap.map(item => `
            <div class="roadmap-card">
                <div class="roadmap-card-header">
                    <span class="roadmap-year-badge">${item.year}</span>
                    <span class="roadmap-card-title">${item.title}</span>
                </div>
                <div class="roadmap-card-body">
                    <div class="roadmap-detail">
                        <span class="label">Ключевые дисциплины:</span>
                        <span class="courses">${item.courses ? item.courses.join(', ') : '—'}</span>
                    </div>
                    <div class="roadmap-detail">
                        <span class="label">Навыки:</span>
                        <span class="skills">${item.skills ? item.skills.join(', ') : '—'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        roadmapHtml = '<p class="no-data">Информация о roadmap временно отсутствует.</p>';
    }

    let missionsHtml = '';
    if (program.missions && program.missions.length > 0) {
        missionsHtml = program.missions.map((mission, index) => `
            <div class="mission-card">
                <span class="mission-number">${index + 1}</span>
                <div class="mission-content">
                    <div class="mission-title">${mission.title}</div>
                    <div class="mission-desc">${mission.description}</div>
                </div>
            </div>
        `).join('');
    } else {
        missionsHtml = '<p class="no-data">Рекомендации временно отсутствуют.</p>';
    }

    const html = `
        <div class="final-screen">
            <div class="final-header">
                <h2>🎯 ${program.title}</h2>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                    <span class="program-tag detail-tag">${program.tags ? program.tags[0] : ''}</span>
                    <span class="program-code detail-code">${program.code}</span>
                </div>
            </div>

            <div class="final-section">
                <h3>🏁 Твой путь на 4 года</h3>
                <div class="roadmap-grid">
                    ${roadmapHtml}
                </div>
            </div>

            <div class="final-section">
                <h3>✅ Миссия до 1 сентября</h3>
                <div class="missions-list">
                    ${missionsHtml}
                </div>
            </div>

            <div class="final-actions">
                <button class="btn-secondary" onclick="renderResult()">← Назад к списку</button>
                <button class="btn-primary" onclick="resetQuiz()">🔄 Пройти заново</button>
            </div>
        </div>
    `;

    container.innerHTML = html;
    updateProgress(4);
}

// ===== ВОССТАНОВЛЕНИЕ СОХРАНЁННОГО РЕЗУЛЬТАТА =====
function renderResultFromSaved(result) {
    const container = getContainer();
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
                            <div class="program-item" onclick="showProgramDetail('${p.title}')">
                                <div class="program-header">
                                    <div class="program-title-row">
                                        <strong>${p.title}</strong>
                                        <span class="program-code-inline">${p.code}</span>
                                    </div>
                                    ${p.tags ? p.tags.map(tag => `<span class="program-tag">${tag}</span>`).join('') : ''}
                                </div>
                                <div class="program-keywords">
                                    ${p.keywords ? p.keywords.map(kw => `<span class="keyword">${kw}</span>`).join('') : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            
            <div class="result-actions">
                <button class="btn-primary" onclick="resetQuiz()">🔄 Пройти заново</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    updateProgress(3);
}

function restoreSavedResult() {
    const saved = loadQuizData();
    if (!saved) return false;

    if (saved.answers && saved.answers.length > 0) {
        window.answers = saved.answers;
    }

    // Если выбрана программа — показываем финальный экран
    if (saved.selectedProgram) {
        const program = getProgramDetails(saved.selectedProgram);
        if (program) {
            renderFinalScreen(program);
            return true;
        }
    }

    // Если есть результат, но программа не выбрана — показываем список программ
    if (saved.result) {
        window.lastResult = saved.result;
        renderResultFromSaved(saved.result);
        return true;
    }

    return false;
}

// ===== СБРОС КВИЗА =====
function resetQuiz() {
    clearQuizData();
    window.answers = [];
    window.lastResult = null;
    currentQuestionIndex = 0;
    renderStartScreen();
}

// ===== СТАРТ =====
document.addEventListener('DOMContentLoaded', () => {
    if (typeof questions === 'undefined') {
        console.error('Ошибка: questions не найдены. Проверь подключение logic.js');
        return;
    }
    window.answers = [];
    window.lastResult = null;

    const restored = restoreSavedResult();
    if (!restored) {
        renderStartScreen();
    }
});