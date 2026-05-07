const questionText = document.getElementById("questionText");
const qTitle = document.getElementById("qTitle");
const answersEl = document.getElementById("answers");
const posText = document.getElementById("posText");
const statusText = document.getElementById("statusText");
const gridEl = document.getElementById("grid");
const heroEl = document.getElementById("hero");
const restartBtn = document.getElementById("restartBtn");

const ROW_LABELS = ["A", "B", "C", "D"];
const COLS = 8;
const ROWS = 4;

const QUESTIONS = [
  {
    text: "How do you select all rows from students?",
    options: [
      "SELECT * FROM students;",
      "GET ALL FROM students;",
      "SELECT * FROM students WHERE id < 10;",
      "SHOW students ROWS;"
    ],
    correct: 0
  },
  {
    text: "Which query gets only name from employees?",
    options: [
      "SELECT name employees;",
      "SELECT name FROM employees;",
      "GET name FROM employees;",
      "SELECT COLUMN(name) employees;"
    ],
    correct: 1
  },
  {
    text: "Filter users with city = 'Rome'",
    options: [
      "SELECT * FROM users FILTER city='Rome';",
      "SELECT * FROM users WHERE city='Rome';",
      "SELECT users IF city='Rome';",
      "WHERE city='Rome' SELECT * FROM users;"
    ],
    correct: 1
  },
  {
    text: "Sort products by price descending",
    options: [
      "SELECT * FROM products ORDER BY price DESC;",
      "SELECT * FROM products ORDER price DESC;",
      "SELECT DESC price FROM products;",
      "SORT products BY price DESC;"
    ],
    correct: 0
  },
  {
    text: "Count all rows in orders",
    options: [
      "COUNT * FROM orders;",
      "SELECT COUNT(*) FROM orders;",
      "SELECT SUM(*) FROM orders;",
      "GET COUNT(orders);"
    ],
    correct: 1
  },
  {
    text: "Get unique city values from customers",
    options: [
      "SELECT UNIQUE city FROM customers;",
      "SELECT DISTINCT city FROM customers;",
      "SELECT city FROM customers GROUP city;",
      "SELECT city DISTINCT FROM customers;"
    ],
    correct: 1
  },
  {
    text: "Rows with score >= 80",
    options: [
      "SELECT * FROM results IF score >= 80;",
      "SELECT * FROM results WHERE score >= 80;",
      "SELECT * FROM results HAVING score >= 80;",
      "GET results WHERE score >= 80;"
    ],
    correct: 1
  },
  {
    text: "Top 5 rows from books",
    options: [
      "SELECT TOP 5 FROM books;",
      "SELECT * FROM books LIMIT 5;",
      "SELECT LIMIT 5 * FROM books;",
      "GET 5 FROM books;"
    ],
    correct: 1
  }
];

let cells = [];
let currentCol = 0;
let heroRow = 1;
let gameEnded = false;
let activeQuestions = [];

function buildGrid() {
  gridEl.innerHTML = "";
  cells = [];

  for (let r = 0; r < ROWS; r += 1) {
    const row = [];
    for (let c = 0; c < COLS; c += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      gridEl.appendChild(cell);
      row.push(cell);
    }
    cells.push(row);
  }
}

function sampleQuestions() {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, COLS);
}

function renderHero() {
  const leftPercent = 10.8 + ((currentCol + 0.5) / COLS) * 56.2;
  const topPercent = 28.5 + ((heroRow + 0.5) / ROWS) * 38.8;

  heroEl.style.left = `${leftPercent - 1.2}%`;
  heroEl.style.top = `${topPercent - 1.4}%`;
}

function updateHud() {
  posText.textContent = `Column ${Math.min(currentCol + 1, COLS)} / ${COLS}, Row ${ROW_LABELS[heroRow]}`;
}

function disableAnswers(disabled) {
  const buttons = answersEl.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.disabled = disabled;
  });
}

function setQuestion() {
  if (currentCol >= COLS) {
    qTitle.textContent = "Bridge Completed";
    questionText.textContent = "You reached the goal castle.";
    answersEl.innerHTML = "";
    return;
  }

  const q = activeQuestions[currentCol];
  qTitle.textContent = `Column ${currentCol + 1} / ${COLS}`;
  questionText.textContent = q.text;
  answersEl.innerHTML = "";

  q.options.forEach((option, rowIndex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.innerHTML = `<strong>${ROW_LABELS[rowIndex]}.</strong> ${option}`;
    btn.addEventListener("click", () => playTurn(rowIndex, btn));
    answersEl.appendChild(btn);
  });
}

function markCell(row, col, className) {
  if (cells[row] && cells[row][col]) {
    cells[row][col].classList.add(className);
  }
}

function endGame(win) {
  gameEnded = true;
  disableAnswers(true);

  if (win) {
    statusText.textContent = "Win";
    qTitle.textContent = "Goal Reached";
    questionText.textContent = "Perfect path. The hero reached the right castle.";
  } else {
    statusText.textContent = "Fell";
  }
}

function playTurn(selectedRow, clickedBtn) {
  if (gameEnded || currentCol >= COLS) {
    return;
  }

  disableAnswers(true);
  const q = activeQuestions[currentCol];
  const isCorrect = selectedRow === q.correct;
  const nextCol = currentCol + 1;

  clickedBtn.classList.add(isCorrect ? "correct" : "wrong");

  if (!isCorrect) {
    markCell(selectedRow, currentCol, "broken");
    heroRow = selectedRow;
    renderHero();
    heroEl.classList.add("fall");
    statusText.textContent = "Wrong answer";

    setTimeout(() => {
      endGame(false);
      questionText.textContent = "The square broke. Press Restart and try another path.";
    }, 450);
    return;
  }

  statusText.textContent = "Correct";
  markCell(selectedRow, currentCol, "safe");
  heroRow = selectedRow;
  currentCol = nextCol;
  renderHero();

  setTimeout(() => {
    if (currentCol >= COLS) {
      endGame(true);
      return;
    }

    disableAnswers(false);
    setQuestion();
    updateHud();
  }, 360);
}

function resetGame() {
  currentCol = 0;
  heroRow = 1;
  gameEnded = false;
  heroEl.classList.remove("fall");
  statusText.textContent = "Playing";
  activeQuestions = sampleQuestions();
  buildGrid();
  renderHero();
  setQuestion();
  updateHud();
}

restartBtn.addEventListener("click", resetGame);

resetGame();
