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
    nubank: { bg: 'bg-[#820AD1]' },
    sicredi: { bg: 'bg-[#00B44B]' },
    itau: { bg: 'bg-[#EC7000]' },
    bb: { bg: 'bg-[#F8D21E] text-blue-900' },
    santander: { bg: 'bg-[#CC0000]' },
    bradesco: { bg: 'bg-[#CC092F]' },
    inter: { bg: 'bg-[#FF7A00]' },
    c6: { bg: 'bg-black' },
    blue: { bg: 'bg-blue-600' },
    green: { bg: 'bg-emerald-600' }
};

// URLs das logos para ficar igual ao app oficial
const flagLogos = {
    visa: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg',
    master: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
    elo: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Elo_logo.png',
    hiper: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Hipercard_logo.svg',
    amex: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg'
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
let paginaAtual = 1;
let itensPorPagina = 20;

// Estado dos filtros avançados
let filtrosAtivos = {
    busca: '',
    categoria: '',
    tipo: '',
    status: '',
    valorMin: null,
    valorMax: null
};
let donutChartInstance = null;
let lineChartInstance = null;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    popularSeletorMeses();
    verificarTema();
    configurarPaginacao();
    configurarBusca();

    // Inicializa ícones Lucide
    if (window.lucide) lucide.createIcons();

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

    // Adicionar validação em tempo real nos inputs
    adicionarValidacaoTempoReal();
});

// Adicionar validação em tempo real
function adicionarValidacaoTempoReal() {
    // Validação no campo de descrição
    const descInputs = ['desc', 'edit-desc'];
    descInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function () {
                const erros = Validacao.validarDescricao(this.value);
                marcarCampo(this, erros);
            });
            input.addEventListener('input', function () {
                if (this.classList.contains('input-error')) {
                    const erros = Validacao.validarDescricao(this.value);
                    if (erros.length === 0) {
                        this.classList.remove('input-error');
                        this.classList.add('input-success');
                    }
                }
            });
        }
    });

    // Validação no campo de valor
    const amountInputs = ['amount', 'edit-amount'];
    amountInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function () {
                const valor = limparValorMoeda(this.value);
                const erros = Validacao.validarValor(valor);
                marcarCampo(this, erros);
            });
            input.addEventListener('input', function () {
                if (this.classList.contains('input-error')) {
                    const valor = limparValorMoeda(this.value);
                    const erros = Validacao.validarValor(valor);
                    if (erros.length === 0) {
                        this.classList.remove('input-error');
                        this.classList.add('input-success');
                    }
                }
            });
        }
    });

    // Validação no campo de data
    const dateInputs = ['date', 'edit-date'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function () {
                const erros = Validacao.validarData(this.value);
                marcarCampo(this, erros);
            });
            input.addEventListener('change', function () {
                if (this.classList.contains('input-error')) {
                    const erros = Validacao.validarData(this.value);
                    if (erros.length === 0) {
                        this.classList.remove('input-error');
                        this.classList.add('input-success');
                    }
                }
            });
        }
    });
}

// Marcar campo com erro ou sucesso
function marcarCampo(input, erros) {
    input.classList.remove('input-error', 'input-success');
    if (erros.length > 0) {
        input.classList.add('input-error');
        input.title = erros.join(', ');
    } else if (input.value) {
        input.classList.add('input-success');
        input.title = '';
    }
}

async function initApp() {
    toggleLoading(true);
    try {
        await carregarCategorias();
        await carregarTransacoes(); // Isso já chama o render e o dashboard
        await carregarMetas(); // Carregar metas
        await carregarCartoes(); // Carregar cartões
        await carregarTodasCategorias(); // Carregar categorias para gerenciamento
        verificarAlertas(); // Verificar alertas e notificações
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
        
        // Popular select de filtros
        const filtroCategoria = document.getElementById('filtro-categoria');
        if (filtroCategoria) {
            // Manter opção "Todas"
            const optionTodas = filtroCategoria.querySelector('option[value=""]');
            filtroCategoria.innerHTML = '';
            if (optionTodas) {
                filtroCategoria.appendChild(optionTodas);
            } else {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Todas as categorias';
                filtroCategoria.appendChild(opt);
            }
            
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                const style = categoryStyles[cat.name] || categoryStyles['Outros'];
                option.textContent = `${style.emoji} ${cat.name}`;
                filtroCategoria.appendChild(option);
            });
        }
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

    // Validar todos os campos
    const erros = [
        ...Validacao.validarDescricao(desc),
        ...Validacao.validarValor(amountVal),
        ...Validacao.validarData(dateVal),
        ...Validacao.validarCategoria(categoryId)
    ];

    if (!Validacao.mostrarErros(erros)) {
        return;
    }

    // Lógica para definir Tipo (Income/Expense) baseado na categoria selecionada
    const selectedOption = els.categorySelect.options[els.categorySelect.selectedIndex];
    const categoryType = selectedOption.getAttribute('data-type');
    const type = categoryType ? parseInt(categoryType) : 2; // 1 = Income, 2 = Expense (padrão)

    const payload = {
        description: desc.trim(),
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
            showToast("Transação salva com sucesso!", 'success');
            els.form.reset();
            document.getElementById('date').valueAsDate = new Date();
            await carregarTransacoes();
            verificarAlertas();
        } else {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.errors ? errorData.errors.join('\n') : errorData.message;
            showToast("Erro ao salvar: " + errorMsg, 'error');
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    }
});

// --- RENDERIZAÇÃO E LÓGICA VISUAL ---

function aplicarFiltro() {
    const mesSelecionado = els.monthFilter.value;

    // Primeiro aplica filtro de mês
    let resultado = allTransactions;
    if (mesSelecionado) {
        resultado = resultado.filter(t => t.date.startsWith(mesSelecionado));
    }

    // Aplica busca por texto
    if (filtrosAtivos.busca) {
        const termoBusca = filtrosAtivos.busca.toLowerCase();
        resultado = resultado.filter(t => 
            t.description.toLowerCase().includes(termoBusca) ||
            t.categoryName.toLowerCase().includes(termoBusca)
        );
    }

    // Aplica filtro de categoria
    if (filtrosAtivos.categoria) {
        resultado = resultado.filter(t => t.categoryId === filtrosAtivos.categoria);
    }

    // Aplica filtro de tipo
    if (filtrosAtivos.tipo) {
        resultado = resultado.filter(t => t.type === filtrosAtivos.tipo);
    }

    // Aplica filtro de status
    if (filtrosAtivos.status !== '') {
        const statusBool = filtrosAtivos.status === 'true';
        resultado = resultado.filter(t => t.isPaid === statusBool);
    }

    // Aplica filtro de valor mínimo
    if (filtrosAtivos.valorMin !== null) {
        resultado = resultado.filter(t => t.amount >= filtrosAtivos.valorMin);
    }

    // Aplica filtro de valor máximo
    if (filtrosAtivos.valorMax !== null) {
        resultado = resultado.filter(t => t.amount <= filtrosAtivos.valorMax);
    }

    filteredTransactions = resultado;
    paginaAtual = 1; // Reset para primeira página ao filtrar
    renderList(filteredTransactions);
    renderCharts(filteredTransactions);
    
    // Atualiza badge de filtros ativos
    atualizarBadgeFiltros();
}

function atualizarBadgeFiltros() {
    let count = 0;
    if (filtrosAtivos.busca) count++;
    if (filtrosAtivos.categoria) count++;
    if (filtrosAtivos.tipo) count++;
    if (filtrosAtivos.status !== '') count++;
    if (filtrosAtivos.valorMin !== null) count++;
    if (filtrosAtivos.valorMax !== null) count++;

    const badge = document.getElementById('filtros-ativos-badge');
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function abrirFiltrosAvancados() {
    const modal = document.getElementById('filtros-modal');
    modal.classList.remove('hidden');
    
    // Preencher campos com valores atuais
    document.getElementById('filtro-categoria').value = filtrosAtivos.categoria;
    document.getElementById('filtro-tipo').value = filtrosAtivos.tipo;
    document.getElementById('filtro-status').value = filtrosAtivos.status;
    
    if (filtrosAtivos.valorMin !== null) {
        document.getElementById('filtro-valor-min').value = formatarMoeda(filtrosAtivos.valorMin);
    }
    if (filtrosAtivos.valorMax !== null) {
        document.getElementById('filtro-valor-max').value = formatarMoeda(filtrosAtivos.valorMax);
    }
    
    lucide.createIcons();
}

function fecharFiltrosAvancados() {
    document.getElementById('filtros-modal').classList.add('hidden');
}

function aplicarFiltrosAvancados() {
    filtrosAtivos.categoria = document.getElementById('filtro-categoria').value;
    filtrosAtivos.tipo = document.getElementById('filtro-tipo').value;
    filtrosAtivos.status = document.getElementById('filtro-status').value;
    
    const valorMinStr = document.getElementById('filtro-valor-min').value;
    const valorMaxStr = document.getElementById('filtro-valor-max').value;
    
    filtrosAtivos.valorMin = valorMinStr ? limparValorMoeda(valorMinStr) : null;
    filtrosAtivos.valorMax = valorMaxStr ? limparValorMoeda(valorMaxStr) : null;
    
    fecharFiltrosAvancados();
    aplicarFiltro();
}

function limparFiltros() {
    filtrosAtivos = {
        busca: '',
        categoria: '',
        tipo: '',
        status: '',
        valorMin: null,
        valorMax: null
    };
    
    document.getElementById('search-input').value = '';
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-tipo').value = '';
    document.getElementById('filtro-status').value = '';
    document.getElementById('filtro-valor-min').value = '';
    document.getElementById('filtro-valor-max').value = '';
    
    fecharFiltrosAvancados();
    aplicarFiltro();
}

function configurarBusca() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        // Debounce para não filtrar a cada tecla
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                filtrosAtivos.busca = this.value;
                aplicarFiltro();
            }, 300); // Espera 300ms após parar de digitar
        });
    }
}

function renderList(transactions) {
    els.listElement.innerHTML = '';

    if (transactions.length === 0) {
        els.listElement.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400">Nenhuma transação neste período.</td></tr>';
        document.getElementById('pagination-controls').classList.add('hidden');
        return;
    }

    // Mostrar controles de paginação
    document.getElementById('pagination-controls').classList.remove('hidden');

    // Calcular paginação
    const totalPaginas = Math.ceil(transactions.length / itensPorPagina);
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const transacoesPaginadas = transactions.slice(inicio, fim);

    // Renderizar apenas as transações da página atual
    transacoesPaginadas.forEach(t => {
        // Mapeia estilo visual baseado no Nome da Categoria que vem do C#
        const style = categoryStyles[t.categoryName] || categoryStyles['Outros'];
        const isExpense = t.type === "Expense";
        const valorFormatado = formatarMoeda(t.amount);
        const corValor = isExpense ? 'text-red-500' : 'text-emerald-500';
        const sinal = isExpense ? '-' : '+';
        
        // Badge de status
        const statusBadge = t.isPaid 
            ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">Pago</span>'
            : '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full">Pendente</span>';
        
        // Ícone do botão de alternar pagamento
        const pagoIcon = t.isPaid ? 'x-circle' : 'check-circle';
        const pagoTitle = t.isPaid ? 'Marcar como pendente' : 'Marcar como pago';
        const pagoColor = t.isPaid ? 'text-yellow-500 hover:text-yellow-700' : 'text-green-500 hover:text-green-700';

        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-700";
        row.innerHTML = `
            <td class="p-4" data-label="Categoria">
                <div class="flex items-center gap-2">
                    <div class="p-2 rounded ${style.bg} ${style.color}">
                        <i data-lucide="${style.icon}" class="w-4 h-4"></i>
                    </div>
                    <span class="text-sm dark:text-gray-200 font-medium">${t.categoryName}</span>
                </div>
            </td>
            <td class="p-4" data-label="Descrição">
                <div class="flex flex-col gap-1">
                    <span class="text-sm dark:text-gray-300 font-medium">${t.description}</span>
                    ${statusBadge}
                </div>
            </td>
            <td class="p-4 text-sm text-gray-500" data-label="Data">${formatarData(t.date)}</td>
            <td class="p-4 text-right font-bold text-sm ${corValor}" data-label="Valor">
                ${sinal} ${valorFormatado}
            </td>
            <td class="p-4 text-center" data-label="Ações">
                <div class="flex gap-2 justify-center">
                    <button onclick="togglePagoTransacao('${t.id}')" class="${pagoColor} transition" title="${pagoTitle}">
                        <i data-lucide="${pagoIcon}" class="w-4 h-4"></i>
                    </button>
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

    // Atualizar controles de paginação
    atualizarControlesPaginacao(transactions.length, totalPaginas);

    if (window.lucide) lucide.createIcons();
}

function atualizarControlesPaginacao(totalItens, totalPaginas) {
    const inicio = (paginaAtual - 1) * itensPorPagina + 1;
    const fim = Math.min(paginaAtual * itensPorPagina, totalItens);

    // Atualizar texto de informação
    document.getElementById('pagination-info').textContent = 
        `${inicio}-${fim} de ${totalItens}`;

    // Atualizar estado dos botões
    const btnFirst = document.getElementById('btn-first-page');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    const btnLast = document.getElementById('btn-last-page');

    btnFirst.disabled = paginaAtual === 1;
    btnPrev.disabled = paginaAtual === 1;
    btnNext.disabled = paginaAtual === totalPaginas;
    btnLast.disabled = paginaAtual === totalPaginas;
}

function irParaPrimeiraPagina() {
    paginaAtual = 1;
    renderList(filteredTransactions);
}

function irParaPaginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        renderList(filteredTransactions);
    }
}

function irParaProximaPagina() {
    const totalPaginas = Math.ceil(filteredTransactions.length / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        renderList(filteredTransactions);
    }
}

function irParaUltimaPagina() {
    const totalPaginas = Math.ceil(filteredTransactions.length / itensPorPagina);
    paginaAtual = totalPaginas;
    renderList(filteredTransactions);
}

function configurarPaginacao() {
    const seletorItens = document.getElementById('items-per-page');
    if (seletorItens) {
        seletorItens.addEventListener('change', function() {
            itensPorPagina = parseInt(this.value);
            paginaAtual = 1; // Reset para primeira página
            renderList(filteredTransactions);
        });
    }
}

function atualizarCards(dashData) {
    els.displays.income.textContent = formatarMoeda(dashData.totalIncome);
    els.displays.expense.textContent = formatarMoeda(Math.abs(dashData.totalExpense)); // Garante positivo pro display
    els.displays.total.textContent = formatarMoeda(dashData.balance);

    // Cor do saldo
    if (dashData.balance >= 0) {
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
                            let percentage = (value * 100 / sum).toFixed(0) + "%";
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
        if (t.type === "Expense") {
            const dia = new Date(t.date).getDate();
            gastosPorDia[dia] = (gastosPorDia[dia] || 0) + Math.abs(t.amount);
        }
    });

    const labels = Object.keys(gastosPorDia).sort((a, b) => a - b);
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
    if (show) els.loadingScreen.classList.remove('opacity-0', 'pointer-events-none');
    else els.loadingScreen.classList.add('opacity-0', 'pointer-events-none');
}

// --- FUNÇÕES DE VALIDAÇÃO ---
const Validacao = {
    // Validar descrição
    validarDescricao(descricao) {
        const errors = [];
        if (!descricao || descricao.trim().length === 0) {
            errors.push('A descrição é obrigatória');
        } else if (descricao.trim().length < 3) {
            errors.push('A descrição deve ter no mínimo 3 caracteres');
        } else if (descricao.length > 200) {
            errors.push('A descrição deve ter no máximo 200 caracteres');
        }
        return errors;
    },

    // Validar valor monetário
    validarValor(valor) {
        const errors = [];
        const valorNum = typeof valor === 'string' ? limparValorMoeda(valor) : valor;

        if (!valorNum || valorNum <= 0) {
            errors.push('O valor deve ser maior que zero');
        } else if (valorNum > 999999999.99) {
            errors.push('O valor não pode ser maior que 999.999.999,99');
        } else if (isNaN(valorNum)) {
            errors.push('Valor inválido');
        }
        return errors;
    },

    // Validar data
    validarData(data) {
        const errors = [];
        if (!data) {
            errors.push('A data é obrigatória');
        } else {
            const dataObj = new Date(data);
            const hoje = new Date();
            const limitePassado = new Date();
            limitePassado.setFullYear(hoje.getFullYear() - 10);
            const limiteFuturo = new Date();
            limiteFuturo.setFullYear(hoje.getFullYear() + 5);

            if (isNaN(dataObj.getTime())) {
                errors.push('Data inválida');
            } else if (dataObj < limitePassado) {
                errors.push('Data não pode ser anterior a 10 anos atrás');
            } else if (dataObj > limiteFuturo) {
                errors.push('Data não pode ser superior a 5 anos no futuro');
            }
        }
        return errors;
    },

    // Validar categoria
    validarCategoria(categoriaId) {
        const errors = [];
        if (!categoriaId || categoriaId === '') {
            errors.push('Selecione uma categoria');
        }
        return errors;
    },

    // Validar nome de categoria
    validarNomeCategoria(nome) {
        const errors = [];
        if (!nome || nome.trim().length === 0) {
            errors.push('O nome da categoria é obrigatório');
        } else if (nome.trim().length < 2) {
            errors.push('O nome deve ter no mínimo 2 caracteres');
        } else if (nome.length > 50) {
            errors.push('O nome deve ter no máximo 50 caracteres');
        }
        return errors;
    },

    // Validar cor hexadecimal
    validarCor(cor) {
        const errors = [];
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!cor) {
            errors.push('A cor é obrigatória');
        } else if (!hexRegex.test(cor)) {
            errors.push('Formato de cor inválido. Use formato hexadecimal (#FFFFFF)');
        }
        return errors;
    },

    // Validar meta
    validarMeta(titulo, valorAlvo) {
        const errors = [];

        if (!titulo || titulo.trim().length === 0) {
            errors.push('O título da meta é obrigatório');
        } else if (titulo.trim().length < 3) {
            errors.push('O título deve ter no mínimo 3 caracteres');
        } else if (titulo.length > 100) {
            errors.push('O título deve ter no máximo 100 caracteres');
        }

        const valorNum = typeof valorAlvo === 'string' ? limparValorMoeda(valorAlvo) : valorAlvo;
        if (!valorNum || valorNum <= 0) {
            errors.push('O valor alvo deve ser maior que zero');
        } else if (valorNum > 999999999.99) {
            errors.push('O valor alvo não pode ser maior que 999.999.999,99');
        }

        return errors;
    },

    // Mostrar erros de validação
    mostrarErros(errors) {
        if (errors.length > 0) {
            const mensagem = errors.join('\n');
            alert('Erro de validação:\n\n' + mensagem);
            return false;
        }
        return true;
    }
};

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

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    // Definir cores e ícones baseado no tipo
    const tipos = {
        success: { bg: 'bg-green-600', icon: 'check-circle' },
        error: { bg: 'bg-red-600', icon: 'x-circle' },
        warning: { bg: 'bg-yellow-600', icon: 'alert-triangle' },
        info: { bg: 'bg-blue-600', icon: 'info' }
    };
    
    const config = tipos[type] || tipos.success;
    
    toast.className = `${config.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 toast-enter`;
    toast.innerHTML = `<i data-lucide="${config.icon}" class="w-4 h-4"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
    if (window.lucide) lucide.createIcons();
}

// Sistema de notificações/alertas inteligentes
function verificarAlertas() {
    const alertas = [];
    const hoje = new Date();
    
    // Verificar metas próximas de serem alcançadas (>= 80%)
    if (window.allGoals && allGoals.length > 0) {
        allGoals.forEach(meta => {
            const progresso = (meta.currentAmount / meta.targetAmount) * 100;
            if (progresso >= 80 && progresso < 100) {
                alertas.push({
                    tipo: 'success',
                    icone: 'target',
                    titulo: 'Meta quase alcançada! 🎯',
                    mensagem: `Sua meta "${meta.name}" está ${progresso.toFixed(0)}% completa!`,
                    acao: null
                });
            } else if (progresso >= 100) {
                alertas.push({
                    tipo: 'success',
                    icone: 'trophy',
                    titulo: 'Meta concluída! 🏆',
                    mensagem: `Parabéns! Você alcançou a meta "${meta.name}"!`,
                    acao: null
                });
            }
        });
    }
    
    // Verificar contas a vencer (próximos 7 dias)
    if (allTransactions && allTransactions.length > 0) {
        const seteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
        const contasAVencer = allTransactions.filter(t => {
            if (t.isPaid) return false; // Já está paga
            const dataTransacao = new Date(t.date);
            return dataTransacao >= hoje && dataTransacao <= seteDias && t.type === 'Expense';
        });
        
        if (contasAVencer.length > 0) {
            const total = contasAVencer.reduce((acc, t) => acc + t.amount, 0);
            alertas.push({
                tipo: 'warning',
                icone: 'calendar',
                titulo: `${contasAVencer.length} conta(s) a vencer`,
                mensagem: `Total de ${formatarMoeda(total)} nos próximos 7 dias`,
                acao: null
            });
        }
    }
    
    // Verificar contas atrasadas
    if (allTransactions && allTransactions.length > 0) {
        const contasAtrasadas = allTransactions.filter(t => {
            if (t.isPaid) return false;
            const dataTransacao = new Date(t.date);
            return dataTransacao < hoje && t.type === 'Expense';
        });
        
        if (contasAtrasadas.length > 0) {
            const total = contasAtrasadas.reduce((acc, t) => acc + t.amount, 0);
            alertas.push({
                tipo: 'error',
                icone: 'alert-circle',
                titulo: `${contasAtrasadas.length} conta(s) atrasada(s)! ⚠️`,
                mensagem: `Total de ${formatarMoeda(total)} em atraso`,
                acao: null
            });
        }
    }
    
    // Verificar gastos do mês atual vs mês anterior
    if (allTransactions && allTransactions.length > 0) {
        const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const mesAnteriorStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;
        
        const gastosAtual = allTransactions
            .filter(t => t.type === 'Expense' && t.date.startsWith(mesAtual))
            .reduce((acc, t) => acc + t.amount, 0);
            
        const gastosAnterior = allTransactions
            .filter(t => t.type === 'Expense' && t.date.startsWith(mesAnteriorStr))
            .reduce((acc, t) => acc + t.amount, 0);
        
        if (gastosAnterior > 0) {
            const aumento = ((gastosAtual - gastosAnterior) / gastosAnterior) * 100;
            if (aumento > 20) {
                alertas.push({
                    tipo: 'warning',
                    icone: 'trending-up',
                    titulo: 'Gastos em alta! 📈',
                    mensagem: `Seus gastos aumentaram ${aumento.toFixed(0)}% em relação ao mês anterior`,
                    acao: null
                });
            } else if (aumento < -20) {
                alertas.push({
                    tipo: 'success',
                    icone: 'trending-down',
                    titulo: 'Ótimo trabalho! 💪',
                    mensagem: `Você reduziu seus gastos em ${Math.abs(aumento).toFixed(0)}% este mês`,
                    acao: null
                });
            }
        }
    }
    
    // Verificar faturas de cartão próximas do vencimento
    if (window.allCards && allCards.length > 0) {
        const diaAtual = hoje.getDate();
        allCards.forEach(card => {
            if (card.currentBill > 0 && card.dueDay) {
                const diasAteVencimento = card.dueDay - diaAtual;
                if (diasAteVencimento > 0 && diasAteVencimento <= 5) {
                    alertas.push({
                        tipo: 'warning',
                        icone: 'credit-card',
                        titulo: `Fatura do ${card.name} vence em ${diasAteVencimento} dia(s)`,
                        mensagem: `Valor: ${formatarMoeda(card.currentBill)}`,
                        acao: null
                    });
                } else if (diasAteVencimento < 0) {
                    alertas.push({
                        tipo: 'error',
                        icone: 'credit-card',
                        titulo: `Fatura do ${card.name} vencida!`,
                        mensagem: `Valor: ${formatarMoeda(card.currentBill)}`,
                        acao: null
                    });
                }
            }
        });
    }
    
    renderizarAlertas(alertas);
}

function renderizarAlertas(alertas) {
    const container = document.getElementById('alertas-container');
    if (!container) return;
    
    if (alertas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i data-lucide="check-circle" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                <p>Tudo certo! Nenhum alerta no momento.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    container.innerHTML = alertas.map(alerta => {
        const cores = {
            success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
            error: 'border-red-500 bg-red-50 dark:bg-red-900/20',
            warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
            info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        };
        
        const corTexto = {
            success: 'text-green-800 dark:text-green-200',
            error: 'text-red-800 dark:text-red-200',
            warning: 'text-yellow-800 dark:text-yellow-200',
            info: 'text-blue-800 dark:text-blue-200'
        };
        
        return `
            <div class="border-l-4 ${cores[alerta.tipo]} p-4 rounded-r-lg">
                <div class="flex items-start gap-3">
                    <i data-lucide="${alerta.icone}" class="w-5 h-5 ${corTexto[alerta.tipo]} mt-0.5"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold ${corTexto[alerta.tipo]} mb-1">${alerta.titulo}</h4>
                        <p class="text-sm ${corTexto[alerta.tipo]} opacity-90">${alerta.mensagem}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

// Exportar transações para CSV
function exportarCSV() {
    if (!filteredTransactions || filteredTransactions.length === 0) {
        alert('Não há transações para exportar');
        return;
    }

    // Preparar dados para CSV
    const csvData = [];
    
    // Cabeçalho
    csvData.push(['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status']);
    
    // Dados das transações filtradas
    filteredTransactions.forEach(t => {
        const data = formatarData(t.date);
        const descricao = t.description;
        const categoria = t.categoryName;
        const tipo = t.type === 'Income' ? 'Entrada' : 'Saída';
        const valor = t.amount.toFixed(2).replace('.', ',');
        const status = t.isPaid ? 'Pago' : 'Pendente';
        
        csvData.push([data, descricao, categoria, tipo, valor, status]);
    });
    
    // Converter para string CSV
    const csvContent = csvData.map(row => 
        row.map(cell => {
            // Escapar aspas e adicionar aspas se tiver vírgula ou quebra de linha
            const cellStr = String(cell || '');
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return '"' + cellStr.replace(/"/g, '""') + '"';
            }
            return cellStr;
        }).join(',')
    ).join('\n');
    
    // Adicionar BOM para UTF-8 (para Excel abrir corretamente)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Criar link de download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Nome do arquivo com data atual
    const hoje = new Date();
    const dataFormatada = hoje.toISOString().split('T')[0];
    const mesSelecionado = els.monthFilter.value;
    const nomeArquivo = `mywallet_transacoes_${mesSelecionado || dataFormatada}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`${filteredTransactions.length} transações exportadas com sucesso!`);
}

function popularSeletorMeses() {
    const hoje = new Date();
    els.monthFilter.innerHTML = '';

    // Gera meses de 12 meses atrás até 12 meses à frente (25 meses no total)
    const meses = [];
    for (let i = -12; i <= 12; i++) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
        const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const texto = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        meses.push({ valor, texto, offset: i });
    }

    // Adiciona opção "Todos"
    const optionTodos = document.createElement('option');
    optionTodos.value = '';
    optionTodos.textContent = 'Todos os períodos';
    els.monthFilter.appendChild(optionTodos);

    // Adiciona os meses em ordem cronológica (mais antigo primeiro)
    meses.forEach(mes => {
        const option = document.createElement('option');
        option.value = mes.valor;
        option.textContent = mes.texto;
        els.monthFilter.appendChild(option);
    });

    // Seleciona o mês atual
    els.monthFilter.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    els.monthFilter.addEventListener('change', aplicarFiltro);
}

function verificarTema() {
    const isDark = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDarkMode = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            // Recarrega gráficos para ajustar cor da fonte
            if (allTransactions.length > 0) renderCharts(filteredTransactions);
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

    // Validar todos os campos
    const erros = [
        ...Validacao.validarDescricao(desc),
        ...Validacao.validarValor(amountVal),
        ...Validacao.validarData(dateVal)
    ];

    if (!Validacao.mostrarErros(erros)) {
        return;
    }

    const payload = {
        description: desc.trim(),
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
            showToast("Transação atualizada com sucesso!", 'success');
            fecharModal();
            await carregarTransacoes();
            verificarAlertas();
        } else {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.errors ? errorData.errors.join('\n') : errorData.message;
            showToast("Erro ao atualizar: " + errorMsg, 'error');
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
            showToast("Transação deletada com sucesso!", 'success');
            await carregarTransacoes();
            verificarAlertas();
        } else {
            showToast("Erro ao deletar transação", 'error');
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    }
};

// Alternar status de pagamento (pago/pendente)
window.togglePagoTransacao = async (id) => {
    try {
        const res = await fetch(`${API_URL}/Transactions/${id}/toggle-paid`, {
            method: 'PATCH',
            headers: getFetchHeaders()
        });

        if (res.ok) {
            const updatedTransaction = await res.json();
            const status = updatedTransaction.isPaid ? 'pago' : 'pendente';
            showToast(`Transação marcada como ${status}!`, 'success');
            await carregarTransacoes();
            verificarAlertas(); // Atualiza os alertas
        } else {
            showToast("Erro ao atualizar status", 'error');
        }
    } catch (e) {
        console.error(e);
        showToast("Erro de conexão", 'error');
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
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ idToken: response.credential })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            throw new Error(errorData.message || 'Falha na autenticação');
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
        alert('Erro ao fazer login: ' + error.message);
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

// --- MÓDULO DE METAS/GOALS ---

let allGoals = [];

// Carregar metas do backend
async function carregarMetas() {
    try {
        const res = await fetch(`${API_URL}/Goals?userId=${currentUser.userId}`, {
            headers: getFetchHeaders()
        });

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Erro ao carregar metas: ${res.status}`);
        }

        allGoals = await res.json();
        renderizarMetas();
    } catch (error) {
        console.error('Erro ao carregar metas:', error);
    }
}

// Renderizar metas na tela
function renderizarMetas() {
    const container = document.getElementById('goals-container');

    if (!allGoals || allGoals.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400">
                <i data-lucide="target" class="w-16 h-16 mx-auto mb-3 opacity-30"></i>
                <p class="text-sm">Nenhuma meta criada ainda</p>
                <p class="text-xs mt-1">Crie sua primeira meta para começar a economizar!</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = allGoals.map(goal => {
        const progress = goal.progress || 0;
        const progressColor = progress >= 100 ? 'bg-green-500' : progress >= 75 ? 'bg-blue-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-gray-400';
        const deadlineText = goal.deadline ? `Prazo: ${formatarData(goal.deadline)}` : 'Sem prazo definido';
        const isCompleted = progress >= 100;

        return `
            <div class="bg-white dark:bg-darkcard p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-900 dark:text-white mb-1">${goal.title}</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${deadlineText}</p>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="abrirModalEditarMeta('${goal.id}')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Editar">
                            <i data-lucide="edit-2" class="w-4 h-4 text-gray-600 dark:text-gray-400"></i>
                        </button>
                        <button onclick="deletarMeta('${goal.id}')" class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition" title="Deletar">
                            <i data-lucide="trash-2" class="w-4 h-4 text-red-600"></i>
                        </button>
                    </div>
                </div>

                <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Progresso</span>
                        <span class="font-bold ${isCompleted ? 'text-green-600' : 'text-indigo-600'}">${progress.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div class="${progressColor} h-2.5 rounded-full transition-all duration-500" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>${formatarMoeda(goal.currentAmount)}</span>
                        <span>${formatarMoeda(goal.targetAmount)}</span>
                    </div>
                </div>

                ${isCompleted ? `
                    <div class="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs py-2 px-3 rounded-lg flex items-center gap-2 mb-3">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        Meta concluída! 🎉
                    </div>
                ` : ''}

                <button onclick="abrirModalValorMeta('${goal.id}', '${goal.title}')" 
                    class="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm font-medium">
                    <i data-lucide="coins" class="w-4 h-4"></i>
                    Atualizar Valor
                </button>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Abrir modal para nova meta
function abrirModalNovaMeta() {
    document.getElementById('goal-modal-title').textContent = 'Nova Meta';
    document.getElementById('goal-form').reset();
    document.getElementById('goal-id').value = '';
    document.getElementById('goal-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

// Abrir modal para editar meta
async function abrirModalEditarMeta(goalId) {
    try {
        const res = await fetch(`${API_URL}/Goals/${goalId}`, {
            headers: getFetchHeaders()
        });

        if (!res.ok) throw new Error('Erro ao carregar meta');

        const goal = await res.json();

        document.getElementById('goal-modal-title').textContent = 'Editar Meta';
        document.getElementById('goal-id').value = goal.id;
        document.getElementById('goal-title').value = goal.title;
        document.getElementById('goal-target').value = formatarMoeda(goal.targetAmount);
        document.getElementById('goal-current').value = formatarMoeda(goal.currentAmount);
        document.getElementById('goal-deadline').value = goal.deadline ? goal.deadline.split('T')[0] : '';

        document.getElementById('goal-modal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('Erro ao carregar meta:', error);
        alert('Erro ao carregar meta');
    }
}

// Fechar modal de meta
function fecharModalMeta() {
    document.getElementById('goal-modal').classList.add('hidden');
}

// Salvar meta (criar ou editar)
document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const goalId = document.getElementById('goal-id').value;
    const title = document.getElementById('goal-title').value;
    const targetStr = document.getElementById('goal-target').value;
    const currentStr = document.getElementById('goal-current').value || 'R$ 0,00';
    const deadline = document.getElementById('goal-deadline').value || null;

    const targetAmount = limparValorMoeda(targetStr);
    const currentAmount = limparValorMoeda(currentStr);

    // Validar
    const erros = Validacao.validarMeta(title, targetAmount);
    if (!Validacao.mostrarErros(erros)) {
        return;
    }

    const payload = {
        title: title.trim(),
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        deadline: deadline,
        userId: currentUser.userId
    };

    try {
        const url = goalId ? `${API_URL}/Goals/${goalId}` : `${API_URL}/Goals`;
        const method = goalId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: getFetchHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.errors ? errorData.errors.join('\n') : errorData.message;
            showToast('Erro ao salvar meta: ' + errorMsg, 'error');
            return;
        }

        showToast(goalId ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!', 'success');
        fecharModalMeta();
        await carregarMetas();
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        showToast('Erro de conexão', 'error');
    }
});

// Abrir modal para atualizar valor da meta
function abrirModalValorMeta(goalId, goalTitle) {
    document.getElementById('goal-amount-id').value = goalId;
    document.getElementById('goal-amount-title').textContent = goalTitle;
    document.getElementById('goal-amount-value').value = '';
    document.getElementById('goal-amount-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

// Fechar modal de valor
function fecharModalValorMeta() {
    document.getElementById('goal-amount-modal').classList.add('hidden');
}

// Atualizar valor da meta (adicionar ou remover)
async function atualizarValorMeta(isAddition) {
    const goalId = document.getElementById('goal-amount-id').value;
    const amountStr = document.getElementById('goal-amount-value').value;
    const amount = limparValorMoeda(amountStr);

    // Validar
    const erros = Validacao.validarValor(amount);
    if (!Validacao.mostrarErros(erros)) {
        return;
    }

    const payload = {
        amount: amount,
        isAddition: isAddition
    };

    try {
        const res = await fetch(`${API_URL}/Goals/${goalId}/amount`, {
            method: 'PATCH',
            headers: getFetchHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.errors ? errorData.errors.join('\n') : errorData.message;
            showToast('Erro ao atualizar valor: ' + errorMsg, 'error');
            return;
        }

        showToast(isAddition ? 'Valor adicionado com sucesso!' : 'Valor removido com sucesso!', 'success');
        fecharModalValorMeta();
        await carregarMetas();
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao atualizar valor:', error);
        showToast('Erro de conexão', 'error');
    }
}

// Deletar meta
async function deletarMeta(goalId) {
    if (!confirm('Tem certeza que deseja deletar esta meta?')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/Goals/${goalId}`, {
            method: 'DELETE',
            headers: getFetchHeaders()
        });

        if (!res.ok) {
            showToast('Erro ao deletar meta', 'error');
            return;
        }

        showToast('Meta deletada com sucesso!', 'success');
        await carregarMetas();
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao deletar meta:', error);
        showToast('Erro de conexão', 'error');
    }
}

// --- MÓDULO DE CARTÕES DE CRÉDITO ---

let allCards = [];

// Carregar cartões do backend
async function carregarCartoes() {
    try {
        const res = await fetch(`${API_URL}/CreditCards?userId=${currentUser.userId}`, {
            headers: getFetchHeaders()
        });

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Erro ao carregar cartões: ${res.status}`);
        }

        allCards = await res.json();
        renderizarCartoes();
    } catch (error) {
        console.error('Erro ao carregar cartões:', error);
    }
}

// Renderizar cartões na tela
function renderizarCartoes() {
    const container = document.getElementById('cards-container');

    // Se não tiver cartões
    if (!allCards || allCards.length === 0) {
        container.innerHTML = `
            <div class="w-full text-center py-8 text-gray-400">
                <p class="text-sm mb-2">Nenhum cartão cadastrado</p>
                <button onclick="abrirModalNovoCartao()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
                    + Adicionar Cartão
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = ''; // Limpa antes de renderizar

    // Renderiza os cartões
    allCards.forEach(card => {
        const style = bankStyles[card.bank] || bankStyles['blue'];
        // Pega a logo da bandeira ou usa Visa como padrão se falhar
        const flagUrl = flagLogos[card.flag] || flagLogos['visa'];

        // Formata o valor (usa currentBill que vem do seu backend)
        const billValue = (card.currentBill || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        const cardHtml = `
            <div class="relative min-w-[300px] h-[170px] ${style.bg} text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between overflow-hidden transition-transform hover:-translate-y-1 group">
                
                <div class="absolute -top-12 -right-12 w-40 h-40 bg-white opacity-10 rounded-full pointer-events-none"></div>

                <div class="flex justify-between items-start z-10">
                    <span class="font-bold text-lg tracking-wide drop-shadow-md">${card.name}</span>
                    <div class="flex items-center gap-3">
                        <button onclick="abrirModalEditarCartao('${card.id}')" class="opacity-60 hover:opacity-100 transition cursor-pointer" title="Editar">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <i data-lucide="nfc" class="w-6 h-6 opacity-40"></i>
                    </div>
                </div>

                <div class="z-10 mt-1">
                    <p class="text-[10px] uppercase font-bold opacity-80 mb-0.5">Fatura Atual</p>
                    <p class="text-2xl font-bold tracking-tight text-white drop-shadow-sm">R$ ${billValue}</p>
                </div>

                <div class="flex justify-between items-end z-10">
                    <div class="text-sm font-medium tracking-widest opacity-90 font-mono">
                        **** ${card.last4Digits} </div>
                    
                    <div class="flex items-center gap-3">
                        <button onclick="deletarCartao('${card.id}')" class="opacity-60 hover:opacity-100 hover:text-red-200 transition cursor-pointer" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                        <img src="${flagUrl}" class="h-6 opacity-90 brightness-200 contrast-200 drop-shadow-md" alt="Bandeira">
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });

    // Botão de "Novo Cartão" ao final da lista
    const addBtnHtml = `
        <button onclick="abrirModalNovoCartao()" class="min-w-[100px] h-[170px] bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <i data-lucide="plus" class="w-8 h-8 mb-2"></i>
            <span class="text-xs font-medium">Novo</span>
        </button>
    `;
    container.innerHTML += addBtnHtml;

    if (window.lucide) lucide.createIcons();
}

// Abrir modal para novo cartão
function abrirModalNovoCartao() {
    document.getElementById('card-form').reset();
    document.getElementById('card-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

// Abrir modal para editar cartão
async function abrirModalEditarCartao(cardId) {
    try {
        const res = await fetch(`${API_URL}/CreditCards/${cardId}`, {
            headers: getFetchHeaders()
        });

        if (!res.ok) throw new Error('Erro ao carregar cartão');

        const card = await res.json();

        // Preencher formulário de edição
        document.getElementById('edit-card-id').value = card.id;
        document.getElementById('edit-card-name').value = card.name;
        document.getElementById('edit-card-bill').value = formatarMoeda(card.currentBill);

        document.getElementById('edit-card-modal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('Erro ao carregar cartão:', error);
        alert('Erro ao carregar cartão');
    }
}

// Fechar modal de cartão
function fecharModalCartao() {
    document.getElementById('card-modal').classList.add('hidden');
}

// Fechar modal de edição de cartão
function fecharModalEdicaoCartao() {
    document.getElementById('edit-card-modal').classList.add('hidden');
}

// Criar novo cartão
document.getElementById('card-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('card-name').value;
    const bank = document.getElementById('card-bank').value;
    const flag = document.getElementById('card-flag').value;
    const last4 = document.getElementById('card-last4').value;
    const billStr = document.getElementById('card-bill').value;
    const bill = limparValorMoeda(billStr);

    // Validações básicas
    if (!name || name.trim().length < 2) {
        alert('O nome do cartão deve ter no mínimo 2 caracteres');
        return;
    }

    if (last4.length !== 4 || !/^\d{4}$/.test(last4)) {
        alert('Os últimos 4 dígitos devem conter exatamente 4 números');
        return;
    }

    if (bill < 0) {
        alert('O valor da fatura não pode ser negativo');
        return;
    }

    const payload = {
        name: name.trim(),
        bank: bank,
        flag: flag,
        last4Digits: last4,
        currentBill: bill,
        creditLimit: null,
        dueDay: null,
        userId: currentUser.userId
    };

    try {
        const res = await fetch(`${API_URL}/CreditCards`, {
            method: 'POST',
            headers: getFetchHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.errors ? errorData.errors.join('\n') : errorData.message;
            showToast('Erro ao criar cartão: ' + errorMsg, 'error');
            return;
        }

        showToast('Cartão criado com sucesso!', 'success');
        fecharModalCartao();
        await carregarCartoes();
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao criar cartão:', error);
        showToast('Erro de conexão', 'error');
    }
});

// Atualizar cartão (edição)
document.getElementById('edit-card-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardId = document.getElementById('edit-card-id').value;
    const name = document.getElementById('edit-card-name').value;
    const billStr = document.getElementById('edit-card-bill').value;
    const bill = limparValorMoeda(billStr);

    // Buscar o cartão original para manter os outros dados
    const originalCard = allCards.find(c => c.id === cardId);
    if (!originalCard) {
        showToast('Cartão não encontrado', 'error');
        return;
    }

    const payload = {
        name: name.trim(),
        bank: originalCard.bank,
        flag: originalCard.flag,
        last4Digits: originalCard.last4Digits,
        currentBill: bill,
        creditLimit: originalCard.creditLimit,
        dueDay: originalCard.dueDay,
        userId: currentUser.userId
    };

    try {
        const res = await fetch(`${API_URL}/CreditCards/${cardId}`, {
            method: 'PUT',
            headers: getFetchHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.errors ? errorData.errors.join('\n') : errorData.message;
            showToast('Erro ao atualizar cartão: ' + errorMsg, 'error');
            return;
        }

        showToast('Cartão atualizado com sucesso!', 'success');
        fecharModalEdicaoCartao();
        await carregarCartoes();
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao atualizar cartão:', error);
        showToast('Erro de conexão', 'error');
    }
});

// Abrir modal para atualizar fatura
function abrirModalAtualizarFatura(cardId, cardName) {
    // Reutilizar o modal de edição de forma simplificada
    const card = allCards.find(c => c.id === cardId);
    if (!card) return;

    document.getElementById('edit-card-id').value = card.id;
    document.getElementById('edit-card-name').value = card.name;
    document.getElementById('edit-card-bill').value = formatarMoeda(card.currentBill);

    document.getElementById('edit-card-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

// Deletar cartão
async function deletarCartao(cardId) {
    if (!confirm('Tem certeza que deseja deletar este cartão?')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/CreditCards/${cardId}`, {
            method: 'DELETE',
            headers: getFetchHeaders()
        });

        if (!res.ok) {
            showToast('Erro ao deletar cartão', 'error');
            return;
        }

        showToast('Cartão deletado com sucesso!', 'success');
        await carregarCartoes();
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao deletar cartão:', error);
        showToast('Erro de conexão', 'error');
    }
}// ============================================
// GERENCIAMENTO DE CATEGORIAS
// ============================================

let allCategories = [];

async function carregarTodasCategorias() {
    try {
        const res = await fetch(`${API_URL}/Categories`, {
            headers: getFetchHeaders()
        });
        if (!res.ok) {
            throw new Error('Erro ao carregar categorias');
        }
        allCategories = await res.json();
        renderizarCategorias();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

function renderizarCategorias() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    if (allCategories.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center col-span-full">Nenhuma categoria cadastrada</p>';
        return;
    }

    container.innerHTML = allCategories.map(cat => {
        const typeLabel = cat.type === 1 ? 'Receita' : 'Despesa';
        const typeColor = cat.type === 1 ? 'text-green-600' : 'text-red-600';
        return `
            <div class="bg-white dark:bg-darkcard p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 hover:shadow-md transition">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-white" style="background-color: ${cat.color}">
                        <i data-lucide="${cat.icon || 'tag'}" class="w-6 h-6"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 dark:text-white">${cat.name}</h4>
                        <p class="text-xs ${typeColor}">${typeLabel}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="abrirModalEditarCategoria('${cat.id}')" class="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-1">
                        <i data-lucide="pencil" class="w-4 h-4"></i> Editar
                    </button>
                    <button onclick="deletarCategoria('${cat.id}')" class="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition flex items-center justify-center">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function abrirModalNovaCategoria() {
    document.getElementById('category-modal').classList.remove('hidden');
    document.getElementById('category-form').reset();
    document.getElementById('cat-color').value = '';
    document.getElementById('cat-icon').value = '';
    
    // Limpar seleções
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('border-indigo-600');
        btn.classList.add('border-transparent');
    });
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-200', 'dark:bg-indigo-800');
    });
    
    lucide.createIcons();
}

function fecharModalCategoria() {
    document.getElementById('category-modal').classList.add('hidden');
}

function abrirModalEditarCategoria(catId) {
    const categoria = allCategories.find(c => c.id === catId);
    if (!categoria) return;

    document.getElementById('edit-category-modal').classList.remove('hidden');
    document.getElementById('edit-cat-id').value = categoria.id;
    document.getElementById('edit-cat-name').value = categoria.name;
    document.getElementById('edit-cat-type').value = categoria.type;
    document.getElementById('edit-cat-color').value = categoria.color;
    document.getElementById('edit-cat-icon').value = categoria.icon || '';

    // Marcar cor selecionada
    document.querySelectorAll('.edit-color-btn').forEach(btn => {
        if (btn.dataset.color === categoria.color) {
            btn.classList.remove('border-transparent');
            btn.classList.add('border-indigo-600');
        } else {
            btn.classList.add('border-transparent');
            btn.classList.remove('border-indigo-600');
        }
    });

    // Marcar ícone selecionado
    document.querySelectorAll('.edit-icon-btn').forEach(btn => {
        if (btn.dataset.icon === categoria.icon) {
            btn.classList.add('bg-indigo-200', 'dark:bg-indigo-800');
        } else {
            btn.classList.remove('bg-indigo-200', 'dark:bg-indigo-800');
        }
    });

    lucide.createIcons();
}

function fecharModalEdicaoCategoria() {
    document.getElementById('edit-category-modal').classList.add('hidden');
}

// Seletores de cor e ícone para CRIAR categoria
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const color = btn.dataset.color;
        document.getElementById('cat-color').value = color;
        
        // Atualizar visual
        document.querySelectorAll('.color-btn').forEach(b => {
            b.classList.remove('border-indigo-600');
            b.classList.add('border-transparent');
        });
        btn.classList.remove('border-transparent');
        btn.classList.add('border-indigo-600');
    });
});

document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const icon = btn.dataset.icon;
        document.getElementById('cat-icon').value = icon;
        
        // Atualizar visual
        document.querySelectorAll('.icon-btn').forEach(b => {
            b.classList.remove('bg-indigo-200', 'dark:bg-indigo-800');
        });
        btn.classList.add('bg-indigo-200', 'dark:bg-indigo-800');
    });
});

// Seletores de cor e ícone para EDITAR categoria
document.querySelectorAll('.edit-color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const color = btn.dataset.color;
        document.getElementById('edit-cat-color').value = color;
        
        // Atualizar visual
        document.querySelectorAll('.edit-color-btn').forEach(b => {
            b.classList.remove('border-indigo-600');
            b.classList.add('border-transparent');
        });
        btn.classList.remove('border-transparent');
        btn.classList.add('border-indigo-600');
    });
});

document.querySelectorAll('.edit-icon-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const icon = btn.dataset.icon;
        document.getElementById('edit-cat-icon').value = icon;
        
        // Atualizar visual
        document.querySelectorAll('.edit-icon-btn').forEach(b => {
            b.classList.remove('bg-indigo-200', 'dark:bg-indigo-800');
        });
        btn.classList.add('bg-indigo-200', 'dark:bg-indigo-800');
    });
});

// Criar categoria
document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('cat-name').value.trim();
    const type = parseInt(document.getElementById('cat-type').value);
    const color = document.getElementById('cat-color').value;
    const icon = document.getElementById('cat-icon').value;

    if (!name || !color || !icon) {
        showToast('Preencha todos os campos (nome, cor e ícone)', 'warning');
        return;
    }

    const payload = {
        name,
        type,
        color,
        icon,
        userId: currentUser.userId
    };

    try {
        const res = await fetch(`${API_URL}/Categories`, {
            method: 'POST',
            headers: getFetchHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.errors ? errorData.errors.join('\n') : errorData.message;
            showToast('Erro ao criar categoria: ' + errorMsg, 'error');
            return;
        }

        showToast('Categoria criada com sucesso!', 'success');
        fecharModalCategoria();
        await carregarTodasCategorias();
        await carregarCategorias(); // Atualizar select de categorias nas transações
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        showToast('Erro de conexão', 'error');
    }
});

// Editar categoria
document.getElementById('edit-category-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const catId = document.getElementById('edit-cat-id').value;
    const name = document.getElementById('edit-cat-name').value.trim();
    const type = parseInt(document.getElementById('edit-cat-type').value);
    const color = document.getElementById('edit-cat-color').value;
    const icon = document.getElementById('edit-cat-icon').value;

    if (!name || !color || !icon) {
        showToast('Preencha todos os campos (nome, cor e ícone)', 'warning');
        return;
    }

    const payload = {
        name,
        type,
        color,
        icon,
        userId: currentUser.userId
    };

    try {
        const res = await fetch(`${API_URL}/Categories/${catId}`, {
            method: 'PUT',
            headers: getFetchHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.errors ? errorData.errors.join('\n') : errorData.message;
            showToast('Erro ao atualizar categoria: ' + errorMsg, 'error');
            return;
        }

        showToast('Categoria atualizada com sucesso!', 'success');
        fecharModalEdicaoCategoria();
        await carregarTodasCategorias();
        await carregarCategorias(); // Atualizar select de categorias nas transações
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        showToast('Erro de conexão', 'error');
    }
});

// Deletar categoria
async function deletarCategoria(catId) {
    if (!confirm('Tem certeza que deseja deletar esta categoria?\nNão é possível deletar categorias com transações associadas.')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/Categories/${catId}`, {
            method: 'DELETE',
            headers: getFetchHeaders()
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
            const errorMsg = errorData.message || 'Erro ao deletar categoria';
            showToast(errorMsg, 'error');
            return;
        }

        showToast('Categoria deletada com sucesso!', 'success');
        await carregarTodasCategorias();
        await carregarCategorias(); // Atualizar select de categorias nas transações
        verificarAlertas();
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        showToast('Erro de conexão', 'error');
    }
}
