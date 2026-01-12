alert('teste');
let contas = [];
const somPago = new Audio("../sounds/cash.mp3");
somPago.volume = 0.6; // ajuste se quiser (0.0 a 1.0)


/* ===== CONTROLE DE ORDENAÇÃO ===== */
let ordemAtual = {
    descricao: true,
    valor: true,
    status: true,
    vencimento: true
};

/* ===== DRAG & DROP VARIÁVEIS ===== */
let dragIndex = null;
let dropIndex = null;
let dropIndicator = null;

/* ===== TÍTULO ===== */
function atualizarTitulo() {
    const meses = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];
    const hoje = new Date();
    document.getElementById("titulo").innerHTML = `
    <div class="d-flex align-items-center justify-content-center gap-2">
        <img src="assets/img/logo-02.png" alt="WPay" id="logo-titulo">
        <span>
            Controle Financeiro - ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}
        </span>
    </div>
`;

}

/* ===== LOCAL STORAGE ===== */
function salvarLocalStorage() {
    localStorage.setItem("contasFinanceiras", JSON.stringify(contas));
}

function carregarLocalStorage() {
    const dados = localStorage.getItem("contasFinanceiras");
    if (dados) contas = JSON.parse(dados);
    renderizar();
}

/* ===== UTIL: DATA SEM FUSO ===== */
function parseDateSemFuso(data) {
    const [ano, mes, dia] = data.split("-");
    return new Date(ano, mes - 1, dia);
}

/* ===== ADICIONAR ===== */
function adicionarConta() {
    const vencimento = document.getElementById("vencimento").value;
    const descricao = document.getElementById("descricao").value.trim().toUpperCase();
    const valor = parseFloat(document.getElementById("valor").value);

    if (!vencimento || !descricao || isNaN(valor) || valor <= 0) {
        Swal.fire("Erro", "O valor deve ser maior que zero.", "error");
        return;
    }


    contas.push({ vencimento, descricao, valor, pago: false });

    document.getElementById("vencimento").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";

    salvarLocalStorage();
    renderizar();
}

/* ===== CLASSE DE VENCIMENTO ===== */
function classeVencimento(conta) {
    if (conta.pago) return "";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [ano, mes, dia] = conta.vencimento.split("-");
    const venc = new Date(ano, mes - 1, dia);
    venc.setHours(0, 0, 0, 0);

    const diasRestantes = Math.floor(
        (venc - hoje) / (1000 * 60 * 60 * 24)
    );

    if (diasRestantes >= 3) return "";                     // sem cor
    if (diasRestantes === 2) return "vencimento-alerta";   // amarelo
    if (diasRestantes === 1) return "vencimento-hoje";     // laranja
    if (diasRestantes <= 0) return "vencimento-vencido";   // vermelho

    return "";
}



/* ===== RENDER ===== */
function renderizar() {
    const tbody = document.getElementById("listaContas");
    tbody.innerHTML = "";

    let total = 0;
    let pago = 0;

    contas.forEach((conta, index) => {
        total += conta.valor;
        if (conta.pago) pago += conta.valor;

        const tr = document.createElement("tr");
        tr.draggable = true;
        tr.dataset.index = index;
        tr.className = classeVencimento(conta);

        tr.innerHTML = `
            <td>${parseDateSemFuso(conta.vencimento).toLocaleDateString("pt-BR")}</td>
            <td>
                <div class="drag-cell">
                    <span class="drag-handle">::</span>
                    <span>${conta.descricao}</span>
                </div>
            </td>
            <td>R$ ${conta.valor.toFixed(2)}</td>
            
            <td class="text-center">
                <div class="status ${conta.pago ? "pago" : "pendente"}"
                     onclick="toggleStatus(${index})">
                    <span class="status-text">
                        ${conta.pago ? "Pago" : "Pendente"}
                    </span>
                    <i class="fa-solid ${conta.pago ? "fa-toggle-on" : "fa-toggle-off"} status-icon"></i>
                </div>
            </td>



            <td class="text-center">
                <button class="btn-acao text-warning" onclick="editarConta(${index})">✏️</button>
                <button class="btn-acao text-danger" onclick="deletarConta(${index})">🗑️</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.getElementById("total").innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById("pago").innerText = `R$ ${pago.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(total - pago).toFixed(2)}`;
}


/* ===== FORMATAR MOEDA1 ===== */
function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


/* ===== STATUS ===== */
function toggleStatus(index) {
    const estavaPago = contas[index].pago;

    contas[index].pago = !contas[index].pago;

    // 🔊 Toca o som APENAS quando marcar como pago
    if (!estavaPago && contas[index].pago) {
        somPago.currentTime = 0; // reinicia se tocar rápido várias vezes
        somPago.play().catch(() => {});
    }

    salvarLocalStorage();
    renderizar();
}

pago.addEventListener("click", () => {
  saldo.classList.remove("pulse");
  void saldo.offsetWidth; // força reflow
  saldo.classList.add("pulse");

  setTimeout(() => {
    saldo.classList.remove("pulse");
  }, 2000);
});



/* ===== EDITAR ===== */
function editarConta(index) {
    Swal.fire({
        title: "Editar Conta",
        html: `
            <input type="date" id="ven" class="swal2-input" value="${contas[index].vencimento}">
            <input id="desc" class="swal2-input" value="${contas[index].descricao}">
            <input id="val" type="number" step="0.01" class="swal2-input" value="${contas[index].valor}">
        `,
        showCancelButton: true,
        confirmButtonText: "Salvar",
        preConfirm: () => {
            const ven = document.getElementById("ven").value;
            const desc = document.getElementById("desc").value.trim().toUpperCase();

            const val = parseFloat(document.getElementById("val").value);

if (!ven || !desc || isNaN(val) || val <= 0) {
    Swal.showValidationMessage("O valor deve ser maior que zero");
    return false;
}


            return { ven, desc, val };
        }
    }).then(res => {
        if (res.isConfirmed) {
            contas[index].vencimento = res.value.ven;
            contas[index].descricao = res.value.desc;
            contas[index].valor = res.value.val;
            salvarLocalStorage();
            renderizar();
        }
    });
}

/* ===== EXCLUIR ===== */
function deletarConta(index) {
    Swal.fire({
        title: "Excluir conta?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim",
        cancelButtonText: "Cancelar"
    }).then(res => {
        if (res.isConfirmed) {
            contas.splice(index, 1);
            salvarLocalStorage();
            renderizar();
        }
    });
}

/* ===== ORDENAR ===== */
function ordenar(campo) {
    ordemAtual[campo] = !ordemAtual[campo];

    contas.sort((a, b) => {
        if (campo === "descricao")
            return ordemAtual[campo]
                ? a.descricao.localeCompare(b.descricao)
                : b.descricao.localeCompare(a.descricao);

        if (campo === "valor")
            return ordemAtual[campo]
                ? a.valor - b.valor
                : b.valor - a.valor;

        if (campo === "status")
            return ordemAtual[campo]
                ? Number(b.pago) - Number(a.pago)
                : Number(a.pago) - Number(b.pago);

        if (campo === "vencimento")
            return ordemAtual[campo]
                ? parseDateSemFuso(a.vencimento) - parseDateSemFuso(b.vencimento)
                : parseDateSemFuso(b.vencimento) - parseDateSemFuso(a.vencimento);
    });

    atualizarIcones(campo);
    salvarLocalStorage();
    renderizar();
}

function atualizarIcones(ativo) {
    ["descricao","valor","status","vencimento"].forEach(c => {
        const el = document.getElementById(`icon-${c}`);
        if (!el) return;
        el.innerText = ordemAtual[c] ? "↑" : "↓";
        el.style.opacity = c === ativo ? "1" : "0.3";
    });
}

/* ===== DRAG & DROP (ORIGINAL INTACTO) ===== */

function criarDropIndicator() {
    dropIndicator = document.createElement("div");
    dropIndicator.className = "drop-indicator";
    document.body.appendChild(dropIndicator);
}

function removerDropIndicator() {
    if (dropIndicator) {
        dropIndicator.remove();
        dropIndicator = null;
    }
}

document.addEventListener("dragstart", e => {
    const tr = e.target.closest("tr");
    if (!tr) return;

    dragIndex = Number(tr.dataset.index);
    tr.classList.add("dragging");
    criarDropIndicator();
});

document.addEventListener("dragover", e => {
    e.preventDefault();

    const tr = e.target.closest("tr");
    if (!tr || dragIndex === null) return;

    const rect = tr.getBoundingClientRect();
    const meio = rect.top + rect.height / 2;
    const tableRect = tr.closest("table").getBoundingClientRect();

    dropIndicator.style.left = tableRect.left + "px";
    dropIndicator.style.width = tableRect.width + "px";

    if (e.clientY < meio) {
        dropIndicator.style.top = rect.top + "px";
        dropIndex = Number(tr.dataset.index);
    } else {
        dropIndicator.style.top = rect.bottom + "px";
        dropIndex = Number(tr.dataset.index) + 1;
    }
});

document.addEventListener("drop", e => {
    e.preventDefault();
    if (dragIndex === null || dropIndex === null) return;

    const item = contas.splice(dragIndex, 1)[0];
    if (dropIndex > dragIndex) dropIndex--;

    contas.splice(dropIndex, 0, item);

    salvarLocalStorage();
    renderizar();

    dragIndex = null;
    dropIndex = null;
    removerDropIndicator();
});

document.addEventListener("dragend", () => {
    document.querySelectorAll("tr").forEach(tr =>
        tr.classList.remove("dragging")
    );
    removerDropIndicator();
    dragIndex = null;
    dropIndex = null;
});

/* ===== INIT ===== */
window.onload = () => {
    atualizarTitulo();
    carregarLocalStorage();
};







