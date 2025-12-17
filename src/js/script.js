// ===== SIDEBAR =====
document.getElementById('open_btn').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open-sidebar');
});



// ===== CONFIG =====
const months = 12;
const tableBody = document.querySelector("#financeTable tbody");
const monthTotalsRow = document.querySelector("#monthTotals");
const yearSelect = document.getElementById("yearSelect");

let currentYear = 2026;

// ===== INICIALIZAÇÃO =====
initYears();
loadYear(currentYear);

// ===== FUNÇÕES =====
function initYears() {
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }

    yearSelect.addEventListener("change", () => {
        currentYear = yearSelect.value;
        loadYear(currentYear);
    });
}

function loadYear(year) {
    tableBody.innerHTML = "";
    const data = getData(year);

    if (data.length === 0) {
        addRow();
    } else {
        data.forEach(row => addRow(row));
    }

    calculateTotals();
}

function getData(year) {
    return JSON.parse(localStorage.getItem(`finance-${year}`)) || [];
}

function saveData() {
    const rows = [];
    tableBody.querySelectorAll("tr").forEach(tr => {
        const inputs = tr.querySelectorAll("input");

        const row = {
            desc: inputs[0].value,
            values: [...inputs].slice(1, 13).map(i => Number(i.value) || 0)
        };

        rows.push(row);
    });

    localStorage.setItem(`finance-${currentYear}`, JSON.stringify(rows));
}

function addRow(data = null) {
    const tr = document.createElement("tr");
    tr.draggable = true;

    // ===== DRAG EVENTS =====
    tr.addEventListener("dragstart", () => {
        tr.classList.add("dragging");
    });

    tr.addEventListener("dragend", () => {
        tr.classList.remove("dragging");
        saveData();
    });

    // Descrição
    tr.appendChild(createInputCell(data?.desc || ""));

    // Meses
    for (let i = 0; i < months; i++) {
        tr.appendChild(createInputCell(data?.values?.[i] || 0, true));
    }

    // Total
    const totalCell = document.createElement("td");
    totalCell.textContent = "0";
    tr.appendChild(totalCell);

    tableBody.appendChild(tr);
    calculateTotals();
}

function createInputCell(value, numeric = false) {
    const td = document.createElement("td");
    const input = document.createElement("input");

    input.value = value;

    if (numeric) {
        input.type = "number";
        input.step = "0.01";
    }

    input.addEventListener("input", () => {
        calculateTotals();
        saveData();
    });

    td.appendChild(input);
    return td;
}

function calculateTotals() {
    const monthTotals = Array(months).fill(0);

    tableBody.querySelectorAll("tr").forEach(tr => {
        let rowTotal = 0;
        const inputs = tr.querySelectorAll("input");

        for (let i = 1; i <= months; i++) {
            const val = Number(inputs[i].value) || 0;
            monthTotals[i - 1] += val;
            rowTotal += val;
        }

const totalCell = tr.lastChild;
totalCell.textContent = rowTotal.toFixed(2);

totalCell.classList.remove("total-positive", "total-negative");

if (rowTotal >= 0) {
    totalCell.classList.add("total-positive");
} else {
    totalCell.classList.add("total-negative");
}
    });

    renderMonthTotals(monthTotals);
}

function renderMonthTotals(totals = Array(months).fill(0)) {
    monthTotalsRow.innerHTML = "<th>Total Mensal</th>";

    totals.forEach(val => {
        const th = document.createElement("th");
        th.textContent = val.toFixed(2);
        monthTotalsRow.appendChild(th);
    });

    const totalYear = totals.reduce((a, b) => a + b, 0);
    const thYear = document.createElement("th");
thYear.textContent = totalYear.toFixed(2);
thYear.classList.remove("total-positive", "total-negative");

if (totalYear >= 0) {
    thYear.classList.add("total-positive");
} else {
    thYear.classList.add("total-negative");
}
    monthTotalsRow.appendChild(thYear);
}

// ===== DRAG & DROP =====
tableBody.addEventListener("dragover", (e) => {
    e.preventDefault();
    const draggingRow = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(tableBody, e.clientY);

    if (!draggingRow) return;

    if (afterElement == null) {
        tableBody.appendChild(draggingRow);
    } else {
        tableBody.insertBefore(draggingRow, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll("tr:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ===== BOTÕES =====
document.getElementById("addRow").addEventListener("click", () => {
    addRow();
    saveData();
});

document.getElementById("clearData").addEventListener("click", () => {
    if (confirm("Deseja apagar todos os dados deste ano?")) {
        localStorage.removeItem(`finance-${currentYear}`);
        loadYear(currentYear);
    }
});


// FUNÇÃO PARA CRIAR O GRÁFICO
function createMonthlyChart(data) {
    const ctx = document.getElementById("monthlyChart").getContext("2d");

    // Dados de meses (Jan a Dez)
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Prepare os dados para o gráfico (somando as receitas/despesas por mês)
    const monthTotals = Array(12).fill(0);
    data.forEach(row => {
        row.values.forEach((value, index) => {
            monthTotals[index] += value;
        });
    });

    // Cria o gráfico
    new Chart(ctx, {
        type: "bar",  // Tipo do gráfico (pode ser "line", "bar", etc.)
        data: {
            labels: months, // Mês
            datasets: [{
                label: "Total Mensal",
                data: monthTotals, // Dados (valores por mês)
                backgroundColor: "white", // Cor de fundo das barras
                borderColor: "#3b3a91",  // Cor das bordas
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `R$ ${tooltipItem.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,  // Garante que o eixo Y comece no zero
                    ticks: {
                        callback: function(value) {
                            return `R$ ${value.toFixed(2)}`;
                        }
                    }
                }
            }
        },
        options: {
    responsive: true,
    maintainAspectRatio: false, // 🔥 ESSENCIAL
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
}

    });
}

// Chama a função do gráfico após carregar os dados
function loadYear(year) {
    tableBody.innerHTML = "";
    const data = getData(year);

    if (data.length === 0) {
        addRow();
    } else {
        data.forEach(row => addRow(row));
    }

    calculateTotals();
    createMonthlyChart(data);  // Chama a função para criar o gráfico
}
