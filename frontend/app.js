// CONFIGURAÇÃO DA API
const API_URL = "http://localhost:5296/api";
const GOOGLE_CLIENT_ID = "1047827393402-iu1dq3ur4tgs6vut9pt8gri9nolaoblh.apps.googleusercontent.com";

// Estado de autenticação
let authToken = null;
let currentUser = null;

// --- CONFIGURAÇÕES VISUAIS ---
Chart.register(ChartDataLabels);

// Mapeamento de Cores e Ícones (Frontend)
// Nota: O Backend manda o ID e Nome, aqui definimos a "roupa" da categoria
const categoryStyles = {
    'Freelas': { icon: 'laptop', emoji: '💻', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    'Salário': { icon: 'banknote', emoji: '💸', color: 'text-green-600', bg: 'bg-green-100' },
    'Alimentação': { icon: 'utensils', emoji: '🍔', color: 'text-orange-600', bg: 'bg-orange-100' },
    'Transporte': { icon: 'car', emoji: '🚗', color: 'text-blue-600', bg: 'bg-blue-100' },
    'Casa': { icon: 'home', emoji: '🏠', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    'Lazer': { icon: 'gamepad-2', emoji: '🎮', color: 'text-purple-600', bg: 'bg-purple-100' },
    'Saúde': { icon: 'heart', emoji: '🏥', color: 'text-red-600', bg: 'bg-red-100' },
    'Educação': { icon: 'book', emoji: '📚', color: 'text-blue-600', bg: 'bg-blue-100' },
    'Investimentos': { icon: 'trending-up', emoji: '📈', color: 'text-green-600', bg: 'bg-green-100' },
    'Compras': { icon: 'shopping-bag', emoji: '🛍️', color: 'text-pink-600', bg: 'bg-pink-100' },
    'Outros': { icon: 'package', emoji: '📦', color: 'text-gray-600', bg: 'bg-gray-100' }
};

const bankStyles = {
    nubank: { bg: 'bg-gradient-to-br from-purple-600 to-purple-800' },
    itau: { bg: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    bb: { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
    inter: { bg: 'bg-gradient-to-br from-orange-400 to-orange-500' },
    blue: { bg: 'bg-gradient-to-br from-blue-500 to-blue-700' }
};

// --- ELEMENTOS DOM ---
const els = {
    loginScreen: document.getElementById('login-screen'),
    appScreen: document.getElementById('app-screen'),
    loadingScreen: document.getElementById('loading-screen'),
    loginBtn: document.getElementById('login-btn'),
    userNameDisplay: document.getElementById('user-name'),
    form: document.getElementById('transaction-form'),
    listElement: document.getElementById('transaction-list'),
    monthFilter: document.getElementById('month-filter'),
    categorySelect: document.getElementById('category'),
    displays: {
        total: document.getElementById('display-total'),
        income: document.getElementById('display-income'),
        expense: document.getElementById('display-expense')
    }
};

// ESTADO GLOBAL
let allTransactions = [];
let filteredTransactions = [];
let donutChartInstance = null;
let lineChartInstance = null;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    popularSeletorMeses();
    verificarTema();
    
    // Inicializa ícones Lucide
    if(window.lucide) lucide.createIcons();
    
    // Inicializar Google Sign-In
    inicializarGoogleSignIn();
    
    // Verificar se já está logado
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        mostrarApp();
    }
});

async function initApp() {
    toggleLoading(true);
    try {
        await carregarCategorias();
        await carregarTransacoes(); // Isso já chama o render e o dashboard
    } catch (error) {
        console.error("Erro fatal:", error);
        toggleLoading(false);
        alert(`Erro ao conectar na API .NET:\n${error.message}\n\nVerifique:\n1. Backend está rodando?\n2. Console do navegador (F12) para mais detalhes`);
    } finally {
        toggleLoading(false);
    }
}

// --- INTEGRAÇÃO COM A API (.NET) ---

async function carregarCategorias() {
    try {
        const res = await fetch(`${API_URL}/Categories`, {
            headers: getFetchHeaders()
        });
        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Erro na API Categories: ${res.status} ${res.statusText}`);
        }
        const categorias = await res.json();
        
        els.categorySelect.innerHTML = '';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id; // GUID
            // Tenta pegar o ícone do estilo, se não achar usa padrão
            const style = categoryStyles[cat.name] || categoryStyles['Outros'];
            option.textContent = `${style.emoji} ${cat.name}`;
            option.setAttribute('data-type', cat.type); // 1 = Income, 2 = Expense
            els.categorySelect.appendChild(option);
        });
    } catch (e) {
        console.error("Erro ao carregar categorias:", e);
        throw e; // Repassa o erro para initApp
    }
}

async function carregarTransacoes() {
    // 1. Pega Lista Completa
    const res = await fetch(`${API_URL}/Transactions`, {
        headers: getFetchHeaders()
    });
    if (!res.ok) {
        if (res.status === 401) {
            logout();
            return;
        }
        throw new Error(`Erro na API Transactions: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    
    // 2. Pega Resumo do Dashboard (Calculado no C#)
    const resDash = await fetch(`${API_URL}/Dashboard`, {
        headers: getFetchHeaders()
    });
    if (!resDash.ok) {
        if (resDash.status === 401) {
            logout();
            return;
        }
        throw new Error(`Erro na API Dashboard: ${resDash.status} ${resDash.statusText}`);
    }
    const dataDash = await resDash.json();

    // Atualiza Cards de Totais
    atualizarCards(dataDash);

    // Salva no estado global
    allTransactions = data;
    aplicarFiltro(); // Renderiza a lista e gráficos
}

els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const desc = document.getElementById('desc').value;
    const amountStr = document.getElementById('amount').value;
    const amountVal = limparValorMoeda(amountStr);
    const dateVal = document.getElementById('date').value;
    const categoryId = els.categorySelect.value;
    
    // Lógica para definir Tipo (Income/Expense) baseado na categoria selecionada
    const selectedOption = els.categorySelect.options[els.categorySelect.selectedIndex];
    let type = 2; // Padrão: Expense
    if(categoryId.includes('2222')) type = 1; // ID do Freela no nosso seed

    const payload = {
        description: desc,
        amount: amountVal,
        date: dateVal,
        type: type,
        categoryId: categoryId,
        userId: currentUser.userId
    };

    try {
        const res = await fetch(`${API_URL}/Transactions`, {
            method: 'POST',
            headers: getFetchHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("Transação salva com sucesso!");
            els.form.reset();
            document.getElementById('date').valueAsDate = new Date();
            await carregarTransacoes();
        } else {
            alert("Erro ao salvar no servidor.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    }
});

// --- RENDERIZAÇÃO E LÓGICA VISUAL ---

function aplicarFiltro() {
    const mesSelecionado = els.monthFilter.value;
    
    if (!mesSelecionado) {
        filteredTransactions = allTransactions;
    } else {
        filteredTransactions = allTransactions.filter(t => t.date.startsWith(mesSelecionado));
    }
    
    renderList(filteredTransactions);
    renderCharts(filteredTransactions);
}

function renderList(transactions) {
    els.listElement.innerHTML = '';
    
    if (transactions.length === 0) {
        els.listElement.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400">Nenhuma transação neste período.</td></tr>';
        return;
    }

    transactions.forEach(t => {
        // Mapeia estilo visual baseado no Nome da Categoria que vem do C#
        const style = categoryStyles[t.categoryName] || categoryStyles['Outros'];
        const isExpense = t.type === "Expense";
        const valorFormatado = formatarMoeda(t.amount);
        const corValor = isExpense ? 'text-red-500' : 'text-emerald-500';
        const sinal = isExpense ? '-' : '+';

        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-700";
        row.innerHTML = `
            <td class="p-4">
                <div class="flex items-center gap-2">
                    <div class="p-2 rounded ${style.bg} ${style.color}">
                        <i data-lucide="${style.icon}" class="w-4 h-4"></i>
                    </div>
                    <span class="text-sm dark:text-gray-200 font-medium">${t.categoryName}</span>
                </div>
            </td>
            <td class="p-4 text-sm dark:text-gray-300 font-medium">${t.description}</td>
            <td class="p-4 text-sm text-gray-500">${formatarData(t.date)}</td>
            <td class="p-4 text-right font-bold text-sm ${corValor}">
                ${sinal} ${valorFormatado}
            </td>
            <td class="p-4 text-center">
                <div class="flex gap-2 justify-center">
                    <button onclick="editarTransacao('${t.id}')" class="text-blue-500 hover:text-blue-700 transition" title="Editar">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deletarTransacao('${t.id}')" class="text-red-500 hover:text-red-700 transition" title="Deletar">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        els.listElement.appendChild(row);
    });
    
    if(window.lucide) lucide.createIcons();
}

function atualizarCards(dashData) {
    els.displays.income.textContent = formatarMoeda(dashData.totalIncome);
    els.displays.expense.textContent = formatarMoeda(Math.abs(dashData.totalExpense)); // Garante positivo pro display
    els.displays.total.textContent = formatarMoeda(dashData.balance);
    
    // Cor do saldo
    if(dashData.balance >= 0) {
        els.displays.total.parentElement.classList.replace('bg-red-600', 'bg-blue-600');
    } else {
        els.displays.total.parentElement.classList.replace('bg-blue-600', 'bg-red-600');
    }
}

// --- GRÁFICOS ---
function renderCharts(transactions) {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';

    // Gráfico de Pizza (Gastos vs Entradas)
    // Atenção: O Chart.js precisa de números puros, sem formatação
    const income = transactions.filter(t => t.type === "Income").reduce((acc, t) => acc + t.amount, 0);
    const expense = Math.abs(transactions.filter(t => t.type === "Expense").reduce((acc, t) => acc + t.amount, 0));
    
    const ctxDonut = document.getElementById('expenseChart');
    if (donutChartInstance) donutChartInstance.destroy();

    if (income === 0 && expense === 0) {
        document.getElementById('no-data-msg').classList.remove('hidden');
        ctxDonut.style.display = 'none';
    } else {
        document.getElementById('no-data-msg').classList.add('hidden');
        ctxDonut.style.display = 'block';
        
        donutChartInstance = new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: ['Entradas', 'Saídas'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold' },
                        formatter: (value, ctx) => {
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => { sum += data; });
                            let percentage = (value*100 / sum).toFixed(0)+"%";
                            return percentage;
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Linha (Evolução Diária) - Simplificado
    const ctxLine = document.getElementById('lineChart');
    if (lineChartInstance) lineChartInstance.destroy();
    
    // Agrupa gastos por dia
    const gastosPorDia = {};
    transactions.forEach(t => {
        if(t.type === "Expense") {
            const dia = new Date(t.date).getDate();
            gastosPorDia[dia] = (gastosPorDia[dia] || 0) + Math.abs(t.amount);
        }
    });

    const labels = Object.keys(gastosPorDia).sort((a,b) => a-b);
    const data = labels.map(dia => gastosPorDia[dia]);

    lineChartInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos',
                data: data,
                borderColor: '#6366f1',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { ticks: { color: textColor } },
                x: { ticks: { color: textColor } }
            },
            plugins: { legend: { display: false }, datalabels: { display: false } }
        }
    });
}

// --- UTILITÁRIOS ---

function toggleLoading(show) {
    if(show) els.loadingScreen.classList.remove('opacity-0', 'pointer-events-none');
    else els.loadingScreen.classList.add('opacity-0', 'pointer-events-none');
}

function formatarMoeda(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatarData(isoString) {
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR');
}

function limparValorMoeda(valorString) {
    if (!valorString) return 0;
    if (typeof valorString === 'number') return valorString;
    return Number(valorString.replace(/\./g, '').replace(',', '.').replace('R$', '').replace('&nbsp;', '').trim());
}

window.formatarMoedaInput = (input) => {
    let value = input.value.replace(/\D/g, "");
    value = (Number(value) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    input.value = value;
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = "bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 toast-enter";
    toast.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    if(window.lucide) lucide.createIcons();
}

function popularSeletorMeses() {
    const hoje = new Date();
    els.monthFilter.innerHTML = '';
    
    // Gera últimos 12 meses
    for(let i=0; i<12; i++) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const texto = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = texto;
        els.monthFilter.appendChild(option);
    }
    
    // Seleciona o mês atual
    els.monthFilter.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    els.monthFilter.addEventListener('change', aplicarFiltro);
}

function verificarTema() {
    const isDark = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
    
    const themeToggle = document.getElementById('theme-toggle');
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDarkMode = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            // Recarrega gráficos para ajustar cor da fonte
            if(allTransactions.length > 0) renderCharts(filteredTransactions);
        });
    }
}

// --- EDITAR E DELETAR TRANSAÇÕES ---

let transacaoEditando = null;

window.editarTransacao = async (id) => {
    // Busca a transação nos dados carregados
    const transacao = allTransactions.find(t => t.id === id);
    if (!transacao) {
        alert('Transação não encontrada.');
        return;
    }

    transacaoEditando = transacao;

    // Preenche o modal de edição
    document.getElementById('edit-id').value = transacao.id;
    document.getElementById('edit-desc').value = transacao.description;
    document.getElementById('edit-amount').value = formatarMoeda(transacao.amount);
    document.getElementById('edit-date').value = transacao.date.split('T')[0];

    // Mostra o modal
    document.getElementById('edit-modal').classList.remove('hidden');
};

window.fecharModal = () => {
    document.getElementById('edit-modal').classList.add('hidden');
    transacaoEditando = null;
};

// Handler do formulário de edição
document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const desc = document.getElementById('edit-desc').value;
    const amountStr = document.getElementById('edit-amount').value;
    const amountVal = limparValorMoeda(amountStr);
    const dateVal = document.getElementById('edit-date').value;

    const payload = {
        description: desc,
        amount: amountVal,
        date: dateVal,
        type: transacaoEditando.type === "Income" ? 1 : 2,
        categoryId: transacaoEditando.categoryId || els.categorySelect.value,
        userId: currentUser.userId
    };

    try {
        const res = await fetch(`${API_URL}/Transactions/${id}`, {
            method: 'PUT',
            headers: getFetchHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("Transação atualizada com sucesso!");
            fecharModal();
            await carregarTransacoes();
        } else {
            alert("Erro ao atualizar no servidor.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    }
});

window.deletarTransacao = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/Transactions/${id}`, {
            method: 'DELETE',
            headers: getFetchHeaders()
        });

        if (res.ok) {
            showToast("Transação deletada com sucesso!");
            await carregarTransacoes();
        } else {
            alert("Erro ao deletar no servidor.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    }
};

// --- AUTENTICAÇÃO GOOGLE ---
function inicializarGoogleSignIn() {
    if (!GOOGLE_CLIENT_ID || 
        GOOGLE_CLIENT_ID === 'SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com' ||
        GOOGLE_CLIENT_ID.startsWith('COLOQUE_SEU')) {
        document.getElementById("google-signin-button").innerHTML = `
            <div class="text-center space-y-4">
                <div class="text-red-500 font-semibold mb-3">🔐 Configure o Google OAuth</div>
                <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-left text-sm space-y-2">
                    <p class="font-semibold">Passos:</p>
                    <ol class="list-decimal ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Acesse <a href="https://console.cloud.google.com" target="_blank" class="text-blue-600 underline">Google Cloud Console</a></li>
                        <li>Crie um projeto OAuth 2.0</li>
                        <li>Adicione: <code class="bg-white dark:bg-gray-900 px-1">http://localhost:8000</code> nas origens</li>
                        <li>Copie o Client ID e Client Secret</li>
                        <li>Atualize frontend/app.js e backend/appsettings.json</li>
                    </ol>
                </div>
            </div>
        `;
        return;
    }
    
    try {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback
        });
        
        google.accounts.id.renderButton(
            document.getElementById("google-signin-button"),
            { 
                theme: "outline", 
                size: "large",
                width: 400,
                text: "signin_with",
                locale: "pt-BR"
            }
        );
    } catch (error) {
        console.error('Erro ao inicializar Google Sign-In:', error);
        document.getElementById("google-signin-button").innerHTML = '<p class="text-sm text-red-500">Erro ao carregar Google Sign-In</p>';
    }
}

async function handleGoogleCallback(response) {
    toggleLoading(true);
    
    try {
        const res = await fetch(`${API_URL}/Auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.credential })
        });

        if (!res.ok) {
            throw new Error('Falha na autenticação');
        }

        const data = await res.json();
        
        // Salvar token e dados do usuário
        authToken = data.token;
        currentUser = {
            userId: data.userId,
            email: data.email,
            name: data.name
        };
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        mostrarApp();
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login. Tente novamente.');
    } finally {
        toggleLoading(false);
    }
}

function mostrarApp() {
    els.loginScreen.classList.add('hidden');
    els.appScreen.classList.remove('hidden');
    els.appScreen.classList.add('fade-in');
    els.userNameDisplay.textContent = currentUser.name;
    initApp();
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    els.appScreen.classList.add('hidden');
    els.loginScreen.classList.remove('hidden');
    
    // Recarregar para limpar estado
    window.location.reload();
}

// Função auxiliar para adicionar token nas requisições
function getFetchHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}