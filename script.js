// State
let state = {
    step: 1,
    apiKey: localStorage.getItem('gemini_api_key') || '',
    apiKey: localStorage.getItem('gemini_api_key') || '',
    //    selectedModel: localStorage.getItem('gemini_model') || '', // Removed dynamic model selection
    purpose: '',
    conditions: '',
    questions: []
};

// DOM Elements
const elements = {
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    apiKeyBtn: document.getElementById('apiKeyBtn'),
    apiModal: document.getElementById('apiModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    //    modelSelect: document.getElementById('modelSelect'),
    //    refreshModelsBtn: document.getElementById('refreshModelsBtn'),
    //    modelSelectionSection: document.getElementById('modelSelectionSection'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    formPurpose: document.getElementById('formPurpose'),
    formConditions: document.getElementById('formConditions'),
    generateBtn: document.getElementById('generateBtn'),
    questionsList: document.getElementById('questionsList'),
    addQuestionBtn: document.getElementById('addQuestionBtn'),
    backToStep1Btn: document.getElementById('backToStep1Btn'),
    confirmBtn: document.getElementById('confirmBtn'),
    generatedCode: document.getElementById('generatedCode'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    copyCodeMainBtn: document.getElementById('copyCodeMainBtn'),
    restartBtn: document.getElementById('restartBtn'),
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content')
};

// Initialization
async function init() {
    if (!state.apiKey) {
        showModal();
    } else {
        elements.apiKeyInput.value = state.apiKey;
        // elements.modelSelectionSection.classList.remove('hidden'); // Removed
        // await populateModelSelect(state.apiKey); // Removed
        // if (state.selectedModel) {
        //     elements.modelSelect.value = state.selectedModel;
        // }
    }
    setupEventListeners();
}

function setupEventListeners() {
    // API Key
    elements.apiKeyBtn.addEventListener('click', showModal);
    elements.closeModalBtn.addEventListener('click', hideModal);
    elements.saveApiKeyBtn.addEventListener('click', async () => {
        const key = elements.apiKeyInput.value.trim();
        if (key) {
            state.apiKey = key;
            localStorage.setItem('gemini_api_key', key);

            // Show model selector and fetch models -> REMOVED
            // elements.modelSelectionSection.classList.remove('hidden');
            // await populateModelSelect(key);

            hideModal();
        }
    });

    // Removed model selection listeners
    // elements.refreshModelsBtn.addEventListener('click', ...);
    // elements.modelSelect.addEventListener('change', ...);

    // Navigation
    elements.generateBtn.addEventListener('click', handleGenerateQuestions);
    elements.backToStep1Btn.addEventListener('click', () => switchStep(1));
    elements.confirmBtn.addEventListener('click', handleGenerateCode);
    elements.restartBtn.addEventListener('click', () => {
        state.questions = [];
        state.purpose = '';
        state.conditions = '';
        elements.formPurpose.value = '';
        elements.formConditions.value = '';
        switchStep(1);
    });

    // Questions
    elements.addQuestionBtn.addEventListener('click', addNewQuestion);

    // Copy Code
    const handleCopy = (btn) => {
        const code = elements.generatedCode.textContent;
        navigator.clipboard.writeText(code).then(() => {
            const originalText = btn.innerHTML; // Save innerHTML to preserve icon
            btn.textContent = '已複製！';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        });
    };

    elements.copyCodeBtn.addEventListener('click', () => handleCopy(elements.copyCodeBtn));
    elements.copyCodeMainBtn.addEventListener('click', () => handleCopy(elements.copyCodeMainBtn));

    // Tabs
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');
        });
    });
}

// UI Helpers
function showModal() {
    elements.apiModal.classList.remove('hidden');
}

function hideModal() {
    elements.apiModal.classList.add('hidden');
}

function switchStep(step) {
    state.step = step;
    document.querySelectorAll('.step-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step${step}`).classList.remove('hidden');
    window.scrollTo(0, 0);
}

function setLoading(isLoading) {
    const btn = elements.generateBtn;
    const loader = btn.querySelector('.loader');
    const text = btn.querySelector('.btn-text');

    if (isLoading) {
        btn.disabled = true;
        loader.classList.remove('hidden');
        text.textContent = '生成中...';
    } else {
        btn.disabled = false;
        loader.classList.add('hidden');
        text.textContent = '生成題目';
    }
}

// Core Logic
async function handleGenerateQuestions() {
    const errorEl = document.getElementById('errorMessage');
    errorEl.classList.add('hidden');
    errorEl.textContent = '';

    if (!state.apiKey) {
        showModal();
        return;
    }

    state.purpose = elements.formPurpose.value.trim();
    state.conditions = elements.formConditions.value.trim();

    if (!state.purpose) {
        alert('請輸入表單目的');
        return;
    }

    setLoading(true);

    try {
        const questions = await callGeminiAPI(state.purpose, state.conditions);
        state.questions = questions.map((q, index) => ({ ...q, id: Date.now() + index }));
        renderQuestions();
        switchStep(2);
    } catch (error) {
        console.error('Generation Error:', error);
        errorEl.textContent = `生成失敗: ${error.message}`;
        errorEl.classList.remove('hidden');
    } finally {
        setLoading(false);
    }
}

async function callGeminiAPI(purpose, conditions) {
    const prompt = `
        You are a Google Forms expert. Generate a list of questions for a form with the following details:
        Purpose: ${purpose}
        Conditions/Requirements: ${conditions}

        Output strictly valid JSON format with this schema:
        [
            {
                "title": "Question Title",
                "type": "TEXT" | "PARAGRAPH_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "DROPDOWN" | "DATE" | "TIME",
                "options": ["Option 1", "Option 2"], // Only for MULTIPLE_CHOICE, CHECKBOX, DROPDOWN
                "required": true // boolean
            }
        ]
        
        Do not include markdown formatting (like \`\`\`json). Return only the raw JSON string.
        Ensure the questions are in Traditional Chinese (Taiwan).
    `;

    // Use selected model or fallback
    const modelId = 'gemini-2.5-flash';
    console.log(`Generating with selected model: ${modelId}`);

    try {
        // Ensure model name has 'models/' prefix if not present (API usually accepts both but being explicit is safer)
        // Actually, the v1beta/models/{model} endpoint expects just the ID or models/ID. 
        // The list endpoint returns 'models/gemini-pro'.
        // Let's handle both cases by stripping 'models/' and letting the URL construction add it if needed, 
        // OR just using the full name if it already has it.
        // The URL below is .../models/${model}:generateContent
        // If model is 'gemini-pro', it becomes .../models/gemini-pro...
        // If model is 'models/gemini-pro', it becomes .../models/models/gemini-pro... which is WRONG.
        // So we must ensure clean ID.
        const cleanModelId = modelId.replace(/^models\//, '');

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModelId}:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP Error: ${response.status}`;

            // If model not found (404) or specific 400 error
            if (response.status === 404 || errorMessage.includes('not found') || errorMessage.includes('not supported')) {
                throw new Error(`Model '${cleanModelId}' not found or not supported. Please select a different model in settings.`);
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            if (data.promptFeedback) {
                throw new Error(`Blocked by safety settings: ${JSON.stringify(data.promptFeedback)}`);
            }
            throw new Error('No candidates returned from API');
        }

        const text = data.candidates[0].content.parts[0].text;
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (e) {
        throw e;
    }
}

function renderQuestions() {
    const list = elements.questionsList;
    list.innerHTML = '';

    state.questions.forEach((q, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        item.dataset.id = q.id;

        let optionsHtml = '';
        if (['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(q.type) && q.options) {
            optionsHtml = `<ul class="question-options">${q.options.map(o => `<li>• ${o}</li>`).join('')}</ul>`;
        }

        item.innerHTML = `
            <div class="question-header">
                <div class="question-title">
                    ${index + 1}. ${q.title} 
                    ${q.required ? '<span style="color:var(--danger)">*</span>' : ''}
                </div>
                <div class="question-type">${formatType(q.type)}</div>
            </div>
            ${optionsHtml}
            <div class="question-actions">
                <button class="action-btn edit" onclick="enableEdit(${q.id})">編輯</button>
                <button class="action-btn delete" onclick="deleteQuestion(${q.id})">刪除</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function formatType(type) {
    const map = {
        'TEXT': '簡答',
        'PARAGRAPH_TEXT': '詳答',
        'MULTIPLE_CHOICE': '單選',
        'CHECKBOX': '多選',
        'DROPDOWN': '下拉選單',
        'DATE': '日期',
        'TIME': '時間'
    };
    return map[type] || type;
}

// Global functions for inline onclick handlers
window.deleteQuestion = function (id) {
    if (confirm('確定要刪除此題目嗎？')) {
        state.questions = state.questions.filter(q => q.id !== id);
        renderQuestions();
    }
};

window.enableEdit = function (id) {
    const q = state.questions.find(q => q.id === id);
    if (!q) return;

    const item = document.querySelector(`.question-item[data-id="${id}"]`);

    const isChoiceType = ['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(q.type);

    item.innerHTML = `
        <div class="edit-mode">
            <input type="text" class="edit-title" value="${q.title}" placeholder="題目">
            <select class="edit-type" onchange="handleTypeChange(${id}, this.value)">
                <option value="TEXT" ${q.type === 'TEXT' ? 'selected' : ''}>簡答</option>
                <option value="PARAGRAPH_TEXT" ${q.type === 'PARAGRAPH_TEXT' ? 'selected' : ''}>詳答</option>
                <option value="MULTIPLE_CHOICE" ${q.type === 'MULTIPLE_CHOICE' ? 'selected' : ''}>單選</option>
                <option value="CHECKBOX" ${q.type === 'CHECKBOX' ? 'selected' : ''}>多選</option>
                <option value="DROPDOWN" ${q.type === 'DROPDOWN' ? 'selected' : ''}>下拉選單</option>
                <option value="DATE" ${q.type === 'DATE' ? 'selected' : ''}>日期</option>
                <option value="TIME" ${q.type === 'TIME' ? 'selected' : ''}>時間</option>
            </select>
            
            <div class="options-editor ${isChoiceType ? '' : 'hidden'}">
                <label>選項 (每行一個)</label>
                <textarea class="edit-options" rows="3">${q.options ? q.options.join('\n') : ''}</textarea>
            </div>

            <label style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                <input type="checkbox" class="edit-required" ${q.required ? 'checked' : ''} style="width:auto;"> 必填
            </label>

            <div class="question-actions">
                <button class="action-btn" onclick="saveEdit(${id})">完成</button>
                <button class="action-btn" onclick="renderQuestions()">取消</button>
            </div>
        </div>
    `;
};

window.handleTypeChange = function (id, newType) {
    const editor = document.querySelector(`.question-item[data-id="${id}"] .options-editor`);
    if (['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(newType)) {
        editor.classList.remove('hidden');
    } else {
        editor.classList.add('hidden');
    }
};

window.saveEdit = function (id) {
    const item = document.querySelector(`.question-item[data-id="${id}"]`);
    const title = item.querySelector('.edit-title').value;
    const type = item.querySelector('.edit-type').value;
    const required = item.querySelector('.edit-required').checked;

    let options = [];
    if (['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(type)) {
        const rawOptions = item.querySelector('.edit-options').value;
        options = rawOptions.split('\n').map(o => o.trim()).filter(o => o);
    }

    const index = state.questions.findIndex(q => q.id === id);
    state.questions[index] = { ...state.questions[index], title, type, required, options };
    renderQuestions();
};

function addNewQuestion() {
    const newQ = {
        id: Date.now(),
        title: '新題目',
        type: 'TEXT',
        required: false,
        options: []
    };
    state.questions.push(newQ);
    renderQuestions();
    // Immediately enter edit mode for the new question
    enableEdit(newQ.id);
}

function handleGenerateCode() {
    const code = generateAppScript(state.questions, state.purpose);
    elements.generatedCode.textContent = code;
    switchStep(3);
}

function generateAppScript(questions, title) {
    const safeTitle = title.replace(/'/g, "\\'");

    let script = `function createForm() {
  // 1. Create the form
  var form = FormApp.create('${safeTitle}');
  
  // 2. Add questions
`;

    questions.forEach(q => {
        const safeQTitle = q.title.replace(/'/g, "\\'");
        let itemCode = '';

        switch (q.type) {
            case 'TEXT':
                itemCode = `  form.addTextItem()
    .setTitle('${safeQTitle}')`;
                break;
            case 'PARAGRAPH_TEXT':
                itemCode = `  form.addParagraphTextItem()
    .setTitle('${safeQTitle}')`;
                break;
            case 'MULTIPLE_CHOICE':
                itemCode = `  form.addMultipleChoiceItem()
    .setTitle('${safeQTitle}')
    .setChoiceValues([${q.options.map(o => `'${o.replace(/'/g, "\\'")}'`).join(', ')}])`;
                break;
            case 'CHECKBOX':
                itemCode = `  form.addCheckboxItem()
    .setTitle('${safeQTitle}')
    .setChoiceValues([${q.options.map(o => `'${o.replace(/'/g, "\\'")}'`).join(', ')}])`;
                break;
            case 'DROPDOWN':
                itemCode = `  form.addListItem()
    .setTitle('${safeQTitle}')
    .setChoiceValues([${q.options.map(o => `'${o.replace(/'/g, "\\'")}'`).join(', ')}])`;
                break;
            case 'DATE':
                itemCode = `  form.addDateItem()
    .setTitle('${safeQTitle}')`;
                break;
            case 'TIME':
                itemCode = `  form.addTimeItem()
    .setTitle('${safeQTitle}')`;
                break;
        }

        if (q.required) {
            itemCode += `\n    .setRequired(true);`;
        } else {
            itemCode += `;`;
        }

        script += `\n${itemCode}\n`;
    });

    script += `
  // 3. Log the URLs
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Edit URL: ' + form.getEditUrl());
}
`;

    return script;
}

// Removed populateModelSelect and fetchAvailableModels functions


// Start
init();
