// CONFIGURAÇÃO DA API (Verifique a porta do seu Swagger)
const API_URL = "http://localhost:5296/api"; 
// Usuário Fixo para testes (O mesmo que criamos no Banco)
const USER_ID = "11111111-1111-1111-1111-111111111111";

// --- CONFIGURAÇÕES VISUAIS ---
Chart.register(ChartDataLabels);

// Mapeamento de Cores e Ícones (Frontend)
// Nota: O Backend manda o ID e Nome, aqui definimos a "roupa" da categoria
const categoryStyles = {
    'Freelas': { icon: 'laptop', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    'Salário': { icon: 'banknote', color: 'text-green-600', bg: 'bg-green-100' },
    'Alimentação': { icon: 'utensils', color: 'text-orange-600', bg: 'bg-orange-100' },
    'Transporte': { icon: 'car', color: 'text-blue-600', bg: 'bg-blue-100' },
    'Casa': { icon: 'home', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    'Lazer': { icon: 'gamepad-2', color: 'text-purple-600', bg: 'bg-purple-100' },
    'Outros': { icon: 'package', color: 'text-gray-600', bg: 'bg-gray-100' }
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
    
    // Simula Login Automático (Já que estamos em Dev)
    els.loginBtn.addEventListener('click', () => {
        els.loginScreen.classList.add('hidden');
        els.appScreen.classList.remove('hidden');
        els.appScreen.classList.add('fade-in');
        els.userNameDisplay.textContent = "Hyarlei Dev";
        initApp();
    });
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
        const res = await fetch(`${API_URL}/Categories`);
        if (!res.ok) {
            throw new Error(`Erro na API Categories: ${res.status} ${res.statusText}`);
        }
        const categorias = await res.json();
        
        els.categorySelect.innerHTML = '';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id; // GUID
            // Tenta pegar o ícone do estilo, se não achar usa padrão
            const style = categoryStyles[cat.name] || categoryStyles['Outros'];
            option.textContent = cat.name;
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
    const res = await fetch(`${API_URL}/Transactions`);
    if (!res.ok) {
        throw new Error(`Erro na API Transactions: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    
    // 2. Pega Resumo do Dashboard (Calculado no C#)
    const resDash = await fetch(`${API_URL}/Dashboard`);
    if (!resDash.ok) {
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
    // No mundo ideal, o Backend validaria isso, mas vamos inferir aqui
    // Se a categoria for "Freelas" ou "Salário" (ID fixo no banco ou nome)
    // Vamos simplificar: Se a categoria selecionada tem nome de entrada, é entrada.
    const selectedOption = els.categorySelect.options[els.categorySelect.selectedIndex];
    // Aqui usamos um hack simples: Se o usuário selecionou uma categoria que sabemos que é entrada
    // No futuro, podemos trazer o "Type" dentro do objeto category do banco.
    // Padrão: 2 (Expense). Se for a categoria de Freelas que criamos (ID 222...), é 1.
    let type = 2; 
    if(categoryId.includes('2222')) type = 1; // ID do Freela no nosso seed

    const payload = {
        description: desc,
        amount: amountVal, // Manda positivo, o Backend/Front decide sinal na exibição
        date: dateVal,
        type: type,
        categoryId: categoryId,
        userId: USER_ID
    };

    try {
        const res = await fetch(`${API_URL}/Transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("Transação salva com sucesso!");
            els.form.reset();
            document.getElementById('date').valueAsDate = new Date();
            await carregarTransacoes(); // Recarrega tudo
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
                <button class="text-gray-400 hover:text-red-500 transition cursor-not-allowed" title="Em breve">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
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