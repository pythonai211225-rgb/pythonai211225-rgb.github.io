const mazeEl = document.getElementById("maze");
const playerEl = document.getElementById("player");
const boardEl = document.getElementById("gameBoard");
const flashEl = document.getElementById("flash");
const stairVideoFrameEl = document.getElementById("stairVideoFrame");
const stairVideoEl = document.getElementById("stairVideo");
const questionPanelEl = document.getElementById("questionPanel");
const doorTopicEl = document.getElementById("doorTopic");
const questionTitleEl = document.getElementById("questionTitle");
const questionTextEl = document.getElementById("questionText");
const answersEl = document.getElementById("answers");
const floorTextEl = document.getElementById("floorText");
const stateTextEl = document.getElementById("stateText");
const positionTextEl = document.getElementById("positionText");
const progressTextEl = document.getElementById("progressText");
const stairTextEl = document.getElementById("stairText");
const questionCountTextEl = document.getElementById("questionCountText");
const restartBtn = document.getElementById("restartBtn");

const COLS = 16;
const ROWS = 10;
const REQUIRED_COUNTS = { easy: 3, medium: 2, hard: 1 };
const TOPIC_BY_TYPE = {
  easy: "Easy checkpoint: SELECT basics",
  medium: "Medium checkpoint: JOIN / GROUP BY",
  hard: "Hard checkpoint: subqueries / NOT EXISTS"
};

const FLOOR_CONFIGS = [
  {
    start: { x: 1, y: 8 },
    stair: { x: 14, y: 1 },
    layout: [
      "################",
      "#..............#",
      "#.###.#####.##.#",
      "#...#.....#....#",
      "###.###.#.####.#",
      "#...#....#....##",
      "#.###.####.##..#",
      "#.#......#.....#",
      "#..............#",
      "################"
    ],
    checkpoints: [
      { type: "easy", x: 5, y: 1 },
      { type: "easy", x: 3, y: 3 },
      { type: "easy", x: 5, y: 7 },
      { type: "medium", x: 7, y: 4 },
      { type: "medium", x: 10, y: 7 },
      { type: "hard", x: 13, y: 6 }
    ]
  },
  {
    start: { x: 14, y: 1 },
    stair: { x: 1, y: 1 },
    layout: [
      "################",
      "#........#.....#",
      "#.######.#.###.#",
      "#......#.#...#.#",
      "####.#.#.###.#.#",
      "#....#.#.....#.#",
      "#.####.#####.#.#",
      "#......#.....#.#",
      "#.###########..#",
      "################"
    ],
    checkpoints: [
      { type: "easy", x: 12, y: 1 },
      { type: "easy", x: 3, y: 3 },
      { type: "easy", x: 5, y: 7 },
      { type: "medium", x: 10, y: 5 },
      { type: "medium", x: 10, y: 3 },
      { type: "hard", x: 11, y: 7 }
    ]
  },
  {
    start: { x: 1, y: 1 },
    stair: { x: 13, y: 8 },
    layout: [
      "################",
      "#..#.......#...#",
      "#..#.#####.#.#.#",
      "#..#.#...#.#.#.#",
      "#....#.#.#...#.#",
      "####.#.#.#####.#",
      "#....#.#.....#.#",
      "#.##.#.#####.#.#",
      "#......#.......#",
      "################"
    ],
    checkpoints: [
      { type: "easy", x: 4, y: 4 },
      { type: "easy", x: 9, y: 1 },
      { type: "easy", x: 2, y: 8 },
      { type: "medium", x: 10, y: 6 },
      { type: "medium", x: 12, y: 3 },
      { type: "hard", x: 8, y: 8 }
    ]
  }
];

const QUESTION_BANK = {
  easy: [
    {
      prompt: "How do you return all columns from table students?",
      answers: [
        "SELECT * FROM students;",
        "GET ALL FROM students;",
        "SELECT students ALL;",
        "SHOW students;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query returns only the name column from employees?",
      answers: [
        "SELECT name employees;",
        "SELECT name FROM employees;",
        "GET name FROM employees;",
        "SELECT COLUMN(name) employees;"
      ],
      correctIndex: 1
    },
    {
      prompt: "How do you filter customers from Cairo?",
      answers: [
        "SELECT * FROM customers WHERE city = 'Cairo';",
        "SELECT * FROM customers IF city = 'Cairo';",
        "GET customers WHERE city = 'Cairo';",
        "SELECT city = 'Cairo' FROM customers;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query sorts products by price from low to high?",
      answers: [
        "SELECT * FROM products SORT BY price;",
        "SELECT * FROM products ORDER BY price ASC;",
        "SELECT ASC price FROM products;",
        "ORDER products BY price;"
      ],
      correctIndex: 1
    },
    {
      prompt: "How do you show only 5 rows from books in SQLite?",
      answers: [
        "SELECT * FROM books FIRST 5;",
        "SELECT TOP 5 FROM books;",
        "SELECT * FROM books LIMIT 5;",
        "GET 5 FROM books;"
      ],
      correctIndex: 2
    }
  ],
  medium: [
    {
      prompt: "Which query groups orders by customer_id?",
      answers: [
        "SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id;",
        "SELECT GROUP BY customer_id FROM orders;",
        "SELECT customer_id FROM orders ORDER BY customer_id;",
        "SELECT COUNT(customer_id) BY orders;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which INNER JOIN correctly connects orders to customers?",
      answers: [
        "SELECT * FROM orders INNER JOIN customers ON orders.customer_id = customers.id;",
        "SELECT * FROM orders JOIN customers WHERE customer_id = id;",
        "SELECT * FROM orders, customers INNER customer_id = id;",
        "SELECT * FROM orders MATCH customers ON id;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query counts orders per city after a join?",
      answers: [
        "SELECT city, COUNT(*) FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY city;",
        "SELECT city, COUNT(*) FROM customers GROUP city JOIN orders;",
        "SELECT city, GROUP BY COUNT(*) FROM orders;",
        "SELECT city FROM customers JOIN COUNT(orders);"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which LEFT JOIN keeps all customers even without orders?",
      answers: [
        "SELECT * FROM customers LEFT JOIN orders ON customers.id = orders.customer_id;",
        "SELECT * FROM customers JOIN LEFT orders ON customers.id = orders.customer_id;",
        "SELECT * FROM orders LEFT JOIN customers ON customers.id = orders.customer_id;",
        "SELECT * FROM customers KEEP JOIN orders;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query shows departments with more than 3 employees?",
      answers: [
        "SELECT department, COUNT(*) FROM staff HAVING COUNT(*) > 3;",
        "SELECT department, COUNT(*) FROM staff GROUP BY department HAVING COUNT(*) > 3;",
        "SELECT department FROM staff WHERE COUNT(*) > 3;",
        "SELECT department, COUNT(*) FROM staff ORDER BY department > 3;"
      ],
      correctIndex: 1
    }
  ],
  hard: [
    {
      prompt: "Which query finds customers with no orders?",
      answers: [
        "SELECT * FROM customers WHERE orders IS NULL;",
        "SELECT * FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);",
        "SELECT * FROM customers c WITHOUT orders;",
        "SELECT * FROM customers EXCEPT orders;"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which subquery returns products priced above the average price?",
      answers: [
        "SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);",
        "SELECT AVG(price) FROM products WHERE price > products;",
        "SELECT * FROM products ABOVE AVG(price);",
        "SELECT * FROM products WHERE AVG(price) > price;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query finds employees whose salary is the maximum in the table?",
      answers: [
        "SELECT * FROM employees WHERE salary = MAX(salary);",
        "SELECT * FROM employees WHERE salary = (SELECT MAX(salary) FROM employees);",
        "SELECT MAX(salary) FROM employees WHERE employee = *;",
        "SELECT * FROM employees HAVING salary = MAX(salary);"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query finds suppliers that do not appear in deliveries?",
      answers: [
        "SELECT * FROM suppliers s WHERE NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.supplier_id = s.id);",
        "SELECT * FROM suppliers WHERE supplier_id NOT deliveries;",
        "SELECT * FROM suppliers EXCEPT SELECT * FROM deliveries;",
        "SELECT * FROM suppliers WHERE deliveries IS EMPTY;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which correlated subquery keeps orders above that customer's average order total?",
      answers: [
        "SELECT * FROM orders o WHERE total > (SELECT AVG(total) FROM orders);",
        "SELECT * FROM orders o WHERE total > (SELECT AVG(total) FROM orders i WHERE i.customer_id = o.customer_id);",
        "SELECT * FROM orders WHERE AVG(total) < total GROUP BY customer_id;",
        "SELECT * FROM orders o WHERE total > customer average;"
      ],
      correctIndex: 1
    }
  ]
};

let cellElements = [];
let checkpointByPosition = {};
let currentFloor = 0;
let player = { ...FLOOR_CONFIGS[0].start };
let floorCheckpoints = createFloorCheckpoints();
let usedQuestionIndexes = createUsageTracker();
let activeCheckpoint = null;
let activeQuestion = null;
let respawnTimer = null;
let isTransitioning = false;
let stairClimbPending = false;
let stairClimbTimer = null;

function currentFloorConfig() {
  return FLOOR_CONFIGS[currentFloor % FLOOR_CONFIGS.length];
}

function createFloorCheckpoints() {
  const config = currentFloorConfig();
  return config.checkpoints.map((checkpoint, index) => ({
    id: `${checkpoint.type}-${index + 1}`,
    type: checkpoint.type,
    x: checkpoint.x,
    y: checkpoint.y,
    topic: TOPIC_BY_TYPE[checkpoint.type],
    state: "pending"
  }));
}

function createUsageTracker() {
  return {
    easy: [],
    medium: [],
    hard: []
  };
}

function keyFor(x, y) {
  return `${x},${y}`;
}

function totalQuestionCount() {
  return Object.values(QUESTION_BANK).reduce((total, questions) => total + questions.length, 0);
}

function solvedCounts() {
  return floorCheckpoints.reduce((counts, checkpoint) => {
    if (checkpoint.state === "cleared") {
      counts[checkpoint.type] += 1;
    }
    return counts;
  }, { easy: 0, medium: 0, hard: 0 });
}

function updateQuestionCount() {
  questionCountTextEl.textContent = `${totalQuestionCount()} total`;
}

function updateStats() {
  const counts = solvedCounts();
  floorTextEl.textContent = String(currentFloor);
  progressTextEl.textContent = `E ${counts.easy}/${REQUIRED_COUNTS.easy} | M ${counts.medium}/${REQUIRED_COUNTS.medium} | H ${counts.hard}/${REQUIRED_COUNTS.hard}`;
  stairTextEl.textContent = "Always open";
}

function buildMaze() {
  const config = currentFloorConfig();
  mazeEl.innerHTML = "";
  cellElements = [];
  checkpointByPosition = {};

  floorCheckpoints.forEach((checkpoint) => {
    checkpointByPosition[keyFor(checkpoint.x, checkpoint.y)] = checkpoint;
  });

  for (let y = 0; y < ROWS; y += 1) {
    const row = [];
    for (let x = 0; x < COLS; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const symbol = config.layout[y][x];

      if (symbol !== "#") {
        cell.classList.add("floor");
      }
      if (x === config.start.x && y === config.start.y) {
        cell.classList.add("start");
      }
      if (x === config.stair.x && y === config.stair.y) {
        cell.classList.add("stair");
      }

      const checkpoint = checkpointByPosition[keyFor(x, y)];
      if (checkpoint) {
        cell.classList.add("checkpoint", checkpoint.type);
        if (checkpoint.state === "cleared") {
          cell.classList.add("cleared");
        }
      }

      mazeEl.appendChild(cell);
      row.push(cell);
    }
    cellElements.push(row);
  }
}

function getCell(x, y) {
  return cellElements[y]?.[x] || null;
}

function updatePlayerPosition() {
  playerEl.style.left = `calc(10px + ${player.x} * ((100% - 20px) / ${COLS}) + ((100% - 20px) / ${COLS}) * 0.18)`;
  playerEl.style.top = `calc(10px + ${player.y} * ((100% - 20px) / ${ROWS}) + ((100% - 20px) / ${ROWS}) * 0.12)`;
  positionTextEl.textContent = `${player.x}, ${player.y}`;
}

function setStateText(text) {
  stateTextEl.textContent = text;
}

function canStepInto(x, y) {
  const config = currentFloorConfig();
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) {
    return false;
  }

  return config.layout[y][x] !== "#";
}

function pickQuestion(type) {
  const pool = QUESTION_BANK[type];
  let usedIndexes = usedQuestionIndexes[type];

  if (usedIndexes.length === pool.length) {
    usedQuestionIndexes[type] = [];
    usedIndexes = usedQuestionIndexes[type];
  }

  const availableIndexes = pool
    .map((_, index) => index)
    .filter((index) => !usedIndexes.includes(index));
  const choice = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
  usedQuestionIndexes[type].push(choice);
  return pool[choice];
}

function positionQuestionPanel() {
  const onLeft = player.x < COLS / 2;
  const onTop = player.y < ROWS / 2;
  questionPanelEl.style.left = onLeft ? "" : "18px";
  questionPanelEl.style.right = onLeft ? "18px" : "";
  questionPanelEl.style.top = onTop ? "" : "18px";
  questionPanelEl.style.bottom = onTop ? "18px" : "";
}

function openQuestion(checkpoint) {
  activeCheckpoint = checkpoint;
  activeQuestion = pickQuestion(checkpoint.type);
  positionQuestionPanel();
  questionPanelEl.classList.remove("hidden");
  doorTopicEl.textContent = checkpoint.topic;
  questionTitleEl.textContent = "Clear the checkpoint";
  questionTextEl.textContent = activeQuestion.prompt;
  answersEl.innerHTML = "";
  setStateText(`Answer ${checkpoint.type} checkpoint`);

  activeQuestion.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-btn";
    button.innerHTML = `<strong>${index + 1}.</strong> ${answer}`;
    button.addEventListener("click", () => answerCheckpoint(index));
    answersEl.appendChild(button);
  });
}

function closeQuestion() {
  activeCheckpoint = null;
  activeQuestion = null;
  questionPanelEl.classList.add("hidden");
  answersEl.innerHTML = "";
}

function refreshCheckpointCell(checkpoint) {
  const cell = getCell(checkpoint.x, checkpoint.y);
  if (!cell) {
    return;
  }

  cell.classList.toggle("cleared", checkpoint.state === "cleared");
  cell.classList.remove("exploding");
}

function explodeCheckpoint(checkpoint) {
  const cell = getCell(checkpoint.x, checkpoint.y);
  if (cell) {
    cell.classList.add("exploding");
    window.setTimeout(() => cell.classList.remove("exploding"), 420);
  }
}

function resetToFloorStart() {
  const config = currentFloorConfig();
  playerEl.classList.add("resetting");
  flashEl.classList.add("on");
  boardEl.classList.add("shake");
  setStateText(`Wrong answer. Back to floor ${currentFloor} start.`);

  window.clearTimeout(respawnTimer);
  respawnTimer = window.setTimeout(() => {
    player = { ...config.start };
    updatePlayerPosition();
    playerEl.classList.remove("resetting");
    flashEl.classList.remove("on");
    boardEl.classList.remove("shake");
    setStateText("Staircase is always open. Solve checkpoints or climb now.");
  }, 430);
}

function answerCheckpoint(index) {
  if (!activeCheckpoint || !activeQuestion) {
    return;
  }

  const buttons = [...answersEl.querySelectorAll("button")];
  buttons.forEach((button) => {
    button.disabled = true;
  });

  const correct = index === activeQuestion.correctIndex;
  buttons[index]?.classList.add(correct ? "correct" : "wrong");
  if (buttons[activeQuestion.correctIndex] && !correct) {
    buttons[activeQuestion.correctIndex].classList.add("correct");
  }

  if (correct) {
    activeCheckpoint.state = "cleared";
    refreshCheckpointCell(activeCheckpoint);
    updateStats();
    setStateText(`${activeCheckpoint.topic} cleared`);
    window.setTimeout(() => {
      closeQuestion();
    }, 220);
    return;
  }

  explodeCheckpoint(activeCheckpoint);
  window.setTimeout(() => {
    closeQuestion();
    resetToFloorStart();
  }, 170);
}

function advanceFloor() {
  currentFloor += 1;
  floorCheckpoints = createFloorCheckpoints();
  usedQuestionIndexes = createUsageTracker();
  player = { ...currentFloorConfig().start };
  buildMaze();
  updatePlayerPosition();
  updateStats();
  setStateText(`Floor ${currentFloor}. New maze. Reach the staircase to go up again.`);
}

function runFloorUpAnimation(onDone) {
  isTransitioning = true;
  // Instantly black out the maze
  mazeEl.style.transition = "none";
  mazeEl.style.opacity = "0";
  // Build new floor immediately (maze is invisible so no flash)
  onDone();
  // Keep player visible
  playerEl.classList.remove("resetting");
  // After one frame, re-enable transition so fade-in is smooth
  requestAnimationFrame(() => requestAnimationFrame(() => {
    mazeEl.style.transition = "opacity 0.9s ease";
    window.setTimeout(() => {
      mazeEl.style.opacity = "1";
      window.setTimeout(() => {
        mazeEl.style.transition = "";
        isTransitioning = false;
      }, 900);
    }, 3000);
  }));
}

function clearPendingStairClimb() {
  stairClimbPending = false;
  window.clearTimeout(stairClimbTimer);
  stairClimbTimer = null;
}

function queueStairClimb() {
  if (stairClimbPending || isTransitioning || activeCheckpoint) {
    return;
  }

  stairClimbPending = true;
  stairClimbTimer = window.setTimeout(() => {
    const config = currentFloorConfig();
    const stillOnStair = player.x === config.stair.x && player.y === config.stair.y;
    clearPendingStairClimb();
    if (!stillOnStair || isTransitioning || activeCheckpoint) {
      return;
    }

    setStateText(`Climbing from floor ${currentFloor} to floor ${currentFloor + 1}...`);
    playStairVideoThenAdvance();
  }, 130);
}

function hideStairVideo() {
  stairVideoFrameEl.classList.add("hidden");
  stairVideoEl.pause();
  stairVideoEl.currentTime = 0;
  stairVideoEl.onended = null;
  playerEl.classList.remove("video-hidden");
}

function playStairVideoThenAdvance() {
  clearPendingStairClimb();
  isTransitioning = true;
  stairVideoFrameEl.classList.remove("hidden");
  playerEl.classList.add("video-hidden");
  stairVideoEl.controls = false;
  stairVideoEl.playbackRate = 1.5;
  stairVideoEl.currentTime = 0;

  let finished = false;
  const finishSequence = () => {
    if (finished) {
      return;
    }
    finished = true;
    hideStairVideo();
    runFloorUpAnimation(advanceFloor);
  };

  stairVideoEl.onended = finishSequence;
  const playPromise = stairVideoEl.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      finishSequence();
    });
  }
}

function handleLanding() {
  const config = currentFloorConfig();

  if (player.x === config.stair.x && player.y === config.stair.y) {
    setStateText("Stair reached. Preparing to climb...");
    queueStairClimb();
    return;
  }

  clearPendingStairClimb();

  const checkpoint = checkpointByPosition[keyFor(player.x, player.y)];
  if (checkpoint && checkpoint.state !== "cleared") {
    openQuestion(checkpoint);
    return;
  }

  setStateText("Staircase is always open. Solve checkpoints or climb now.");
}

function tryMove(dx, dy) {
  if (activeCheckpoint || isTransitioning || stairClimbPending) {
    return;
  }

  const nextX = player.x + dx;
  const nextY = player.y + dy;

  if (canStepInto(nextX, nextY)) {
    player.x = nextX;
    player.y = nextY;
    updatePlayerPosition();
    handleLanding();
  }
}

function resetGame() {
  currentFloor = 0;
  isTransitioning = false;
  floorCheckpoints = createFloorCheckpoints();
  usedQuestionIndexes = createUsageTracker();
  window.clearTimeout(respawnTimer);
  clearPendingStairClimb();
  closeQuestion();
  player = { ...currentFloorConfig().start };
  buildMaze();
  updatePlayerPosition();
  updateQuestionCount();
  updateStats();
  flashEl.classList.remove("on");
  boardEl.classList.remove("shake");
  mazeEl.style.transition = "";
  mazeEl.style.opacity = "";
  playerEl.classList.remove("resetting");
  hideStairVideo();
  setStateText("Staircase is always open. Reach it anytime to climb.");
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (activeCheckpoint && ["1", "2", "3", "4"].includes(key)) {
    event.preventDefault();
    answerCheckpoint(Number(key) - 1);
    return;
  }

  const moves = {
    arrowup: [0, -1],
    w: [0, -1],
    arrowdown: [0, 1],
    s: [0, 1],
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowright: [1, 0],
    d: [1, 0]
  };

  if (moves[key]) {
    event.preventDefault();
    tryMove(...moves[key]);
  }
});

restartBtn.addEventListener("click", resetGame);

resetGame();
