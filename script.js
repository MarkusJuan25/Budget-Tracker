// Elements
const list = document.getElementById("list");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const balanceEl = document.getElementById("balance");
const addBtn = document.getElementById("addBtn");
const toggleForm = document.getElementById("toggleForm");
const form = document.getElementById("form");
const exportBtn = document.getElementById("exportBtn");
const monthFilter = document.getElementById("monthFilter");
const darkToggle = document.getElementById("darkToggle");
const chart = document.getElementById("chart");
const ctx = chart.getContext("2d");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let currentMonth = "all";

// Set default month for form input
document.getElementById("month").value = new Date().toISOString().slice(0,7);

/* ---------- UI Controls ---------- */
toggleForm.addEventListener("click", () => form.classList.toggle("hidden"));

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
});

if(localStorage.getItem("dark")==="true") document.body.classList.add("dark");

addBtn.addEventListener("click", addTransaction);
exportBtn.addEventListener("click", exportCSV);
monthFilter.addEventListener("change", e => {
  currentMonth = e.target.value;
  init();
});

/* ---------- Core ---------- */
function addTransaction() {
  const text = document.getElementById("text").value.trim();
  const amount = +document.getElementById("amount").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const month = document.getElementById("month").value;

  if(!text || !amount || !month) return alert("Fill all fields");

  transactions.push({id: Date.now(), text, amount, type, category, month});
  saveAndRender();
  form.reset();
  document.getElementById("month").value = new Date().toISOString().slice(0,7);
}

function removeTransaction(id) {
  transactions = transactions.filter(t => t.id!==id);
  saveAndRender();
}

function saveAndRender() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  init();
}

/* ---------- Rendering ---------- */
function init() {
  list.innerHTML = "";

  const months = ["all", ...new Set(transactions.map(t => t.month))];
  monthFilter.innerHTML = months.map(m=>`<option value="${m}">${m==="all"?"All Months":m}</option>`).join("");
  monthFilter.value = currentMonth;

  const filtered = currentMonth==="all"?transactions:transactions.filter(t=>t.month===currentMonth);

  filtered.forEach(t=>{
    const li = document.createElement("li");
    li.className = t.type==="income"?"plus":"minus";
    li.innerHTML = `
      <div>
        <strong>${t.text}</strong>
        <span class="tag">${t.category}</span><br/>
        <small>${t.month} • ${t.type==="income"?"+":"-"}₱${t.amount}</small>
      </div>
      <button class="delete-btn" onclick="removeTransaction(${t.id})">🗑</button>
    `;
    list.appendChild(li);
  });

  updateSummary(filtered);
  drawChart(filtered);
}

function updateSummary(data) {
  const income = data.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  const expense = data.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);

  incomeEl.innerText = `₱${income}`;
  expenseEl.innerText = `₱${expense}`;
  balanceEl.innerText = `₱${income-expense}`;
}

/* ---------- Chart ---------- */
function drawChart(data){
  const income = data.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  const expense = data.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);
  const total = income+expense || 1;

  ctx.clearRect(0,0,chart.width,chart.height);

  let start = 0;
  const incAngle = (income/total)*Math.PI*2;
  const expAngle = (expense/total)*Math.PI*2;

  ctx.beginPath();
  ctx.fillStyle = "#16a34a";
  ctx.moveTo(150,70);
  ctx.arc(150,70,60,start,start+incAngle);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "#dc2626";
  ctx.moveTo(150,70);
  ctx.arc(150,70,60,start+incAngle,start+incAngle+expAngle);
  ctx.fill();
}

/* ---------- Export CSV ---------- */
function exportCSV() {
  let csv = "Description,Amount,Type,Category,Month\n";
  transactions.forEach(t=>{
    csv += `${t.text},${t.amount},${t.type},${t.category},${t.month}\n`;
  });
  const blob = new Blob([csv],{type:"text/csv"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "budget-report.csv";
  link.click();
}

init();
