// ── DOM references ─────────────────────────────────────────────────────────────
const mazeEl            = document.getElementById("maze");
const playerEl          = document.getElementById("player");
const boardEl           = document.getElementById("gameBoard");
const flashEl           = document.getElementById("flash");
const stairVideoFrameEl = document.getElementById("stairVideoFrame");
const stairVideoEl      = document.getElementById("stairVideo");
const finalVideoFrameEl = document.getElementById("finalVideoFrame");
const finalVideoEl      = document.getElementById("finalVideo");
const gameOverPanelEl   = document.getElementById("gameOverPanel");
const finalScoreValueEl = document.getElementById("finalScoreValue");
const finalTimeValueEl  = document.getElementById("finalTimeValue");
const questionPanelEl   = document.getElementById("questionPanel");
const doorTopicEl       = document.getElementById("doorTopic");
const questionTitleEl   = document.getElementById("questionTitle");
const questionTextEl    = document.getElementById("questionText");
const questionTablesEl  = document.getElementById("questionTables");
const questionTableNamesEl = document.getElementById("questionTableNames");
const questionTablePreviewEl = document.getElementById("questionTablePreview");
const answersEl         = document.getElementById("answers");
const onlineTextEl      = document.getElementById("onlineText");
const restartBtn        = document.getElementById("restartBtn");
const scoreValueEl      = document.getElementById("scoreValue");
const timerValueEl      = document.getElementById("timerValue");
const tableCardsEl      = document.getElementById("tableCards");
const tablePanelHintEl  = document.getElementById("tablePanelHint");
const loginOverlayEl    = document.getElementById("loginOverlay");
const loginFormEl       = document.getElementById("loginForm");
const nameInputEl       = document.getElementById("nameInput");
const playerNameEl      = playerEl.querySelector(".player-name");

// ── Constants ──────────────────────────────────────────────────────────────────
const COLS = 16;
const ROWS = 10;
const TROPHY_FLOOR_INDEX = 2;
const TROPHY_POS = { x: 8, y: 5 };
const GAME_OVER_LEVEL = 4;
const GRAIL_BONUS = 10000;

// ── Table data ─────────────────────────────────────────────────────────────────
const TABLE_DATA = {
  students: {
    columns: ["id", "name", "age", "grade", "city"],
    rows: [
      [1, "Ahmed Hassan",   16, "A", "Cairo"],
      [2, "Sara Mohamed",   15, "B", "Giza"],
      [3, "Omar Ali",       17, "A", "Alexandria"],
      [4, "Laila Nour",     14, "C", "Cairo"],
      [5, "Yousef Ibrahim", 18, "B", "Luxor"],
      [6, "Nada Khalil",    16, "A", "Cairo"],
      [7, "Karim Samir",    15, "D", "Giza"],
      [8, "Mariam Farouk",  17, "A", "Aswan"],
      [9, "Tarek Adel",     16, "B", "Alexandria"],
      [10,"Hana Mostafa",   14, "C", "Cairo"],
      [11,"Bilal Tamer",    18, "A", "Giza"],
      [12,"Rania Saleh",    17, "B", "Luxor"],
      [13,"Faris Reda",     15, "C", "Cairo"],
      [14,"Dina Wael",      16, "A", "Alexandria"],
      [15,"Ziad Hany",      18, "B", "Aswan"],
    ]
  },
  employees: {
    columns: ["id", "name", "department", "salary", "city"],
    rows: [
      [1,  "Ali Hassan",     "Engineering", 8000,  "Cairo"],
      [2,  "Mona Samir",     "Sales",       5500,  "Giza"],
      [3,  "Khaled Farid",   "HR",          4800,  "Alexandria"],
      [4,  "Yasmin Adel",    "Engineering", 9200,  "Cairo"],
      [5,  "Tarek Nour",     "Sales",       6100,  "Luxor"],
      [6,  "Dina Ramy",      "Finance",     7300,  "Cairo"],
      [7,  "Samer Hamed",    "Engineering", 8700,  "Giza"],
      [8,  "Heba Omar",      "HR",          4200,  "Cairo"],
      [9,  "Wael Kamal",     "Sales",       5900,  "Alexandria"],
      [10, "Rana Fathi",     "Finance",     6800,  "Cairo"],
      [11, "Amr Soliman",    "Engineering", 10500, "Giza"],
      [12, "Nadia Helmi",    "HR",          4600,  "Luxor"],
      [13, "Islam Gamal",    "Sales",       5700,  "Cairo"],
      [14, "Ghada Nassar",   "Finance",     7100,  "Alexandria"],
      [15, "Hassan Fawzy",   "Engineering", 9500,  "Cairo"],
    ]
  },
  products: {
    columns: ["id", "name", "category", "price", "stock"],
    rows: [
      [1,  "Laptop Pro",      "Electronics", 12500, 45],
      [2,  "Office Chair",    "Furniture",   2300,  120],
      [3,  "Wireless Mouse",  "Electronics", 350,   200],
      [4,  "Standing Desk",   "Furniture",   4800,  30],
      [5,  "USB Hub",         "Electronics", 180,   500],
      [6,  "Monitor 24\"",    "Electronics", 3200,  75],
      [7,  "Bookshelf",       "Furniture",   1600,  55],
      [8,  "Webcam HD",       "Electronics", 920,   140],
      [9,  "Keyboard",        "Electronics", 450,   320],
      [10, "Desk Lamp",       "Furniture",   380,   90],
      [11, "Headphones",      "Electronics", 1100,  180],
      [12, "Filing Cabinet",  "Furniture",   2100,  40],
      [13, "Tablet",          "Electronics", 5500,  60],
      [14, "Printer",         "Electronics", 2800,  35],
      [15, "Whiteboard",      "Furniture",   950,   70],
    ]
  },
  customers: {
    columns: ["id", "name", "city", "joined_year"],
    rows: [
      [1,  "Ahmed Fathy",  "Cairo",      2019],
      [2,  "Laila Adel",   "Giza",       2020],
      [3,  "Omar Hassan",  "Alexandria", 2018],
      [4,  "Sara Khaled",  "Cairo",      2021],
      [5,  "Mostafa Wael", "Luxor",      2019],
      [6,  "Nour El-Din",  "Cairo",      2022],
      [7,  "Aya Mohamed",  "Giza",       2020],
      [8,  "Karim Nabil",  "Aswan",      2021],
      [9,  "Hana Sherif",  "Cairo",      2017],
      [10, "Bilal Essam",  "Alexandria", 2023],
      [11, "Reem Tamer",   "Cairo",      2022],
      [12, "Fawzy Anwar",  "Giza",       2019],
      [13, "Dalia Raed",   "Luxor",      2021],
      [14, "Ziad Hamdy",   "Cairo",      2020],
      [15, "Mina Saad",    "Alexandria", 2018],
    ]
  },
  orders: {
    columns: ["id", "customer_id", "product_id", "amount", "status", "date"],
    rows: [
      [1,  3,  1,  12500, "delivered", "2024-01-15"],
      [2,  7,  3,  350,   "delivered", "2024-01-18"],
      [3,  1,  6,  3200,  "pending",   "2024-02-02"],
      [4,  12, 2,  2300,  "delivered", "2024-02-10"],
      [5,  5,  9,  450,   "delivered", "2024-02-14"],
      [6,  9,  11, 1100,  "cancelled", "2024-03-01"],
      [7,  3,  13, 5500,  "delivered", "2024-03-05"],
      [8,  2,  4,  4800,  "pending",   "2024-03-12"],
      [9,  14, 8,  920,   "delivered", "2024-03-20"],
      [10, 1,  5,  180,   "delivered", "2024-04-01"],
      [11, 6,  14, 2800,  "delivered", "2024-04-08"],
      [12, 11, 7,  1600,  "pending",   "2024-04-15"],
      [13, 4,  3,  350,   "delivered", "2024-04-22"],
      [14, 7,  6,  3200,  "delivered", "2024-05-01"],
      [15, 15, 12, 2100,  "pending",   "2024-05-10"],
    ]
  },
  departments: {
    columns: ["id", "name", "budget", "employee_count"],
    rows: [
      [1,  "Engineering",      250000, 5],
      [2,  "Sales",            120000, 4],
      [3,  "HR",               80000,  3],
      [4,  "Finance",          150000, 3],
      [5,  "Marketing",        100000, 0],
      [6,  "Legal",            90000,  0],
      [7,  "Operations",       180000, 0],
      [8,  "R&D",              300000, 0],
      [9,  "Customer Support", 70000,  0],
      [10, "Logistics",        110000, 0],
    ]
  },
  movies: {
    columns: ["id", "title", "genre", "rating", "year"],
    rows: [
      [1,  "The Algorithm",  "Sci-Fi",    8.2, 2021],
      [2,  "Cairo Nights",   "Drama",     7.5, 2019],
      [3,  "Data Storm",     "Thriller",  6.8, 2022],
      [4,  "Pyramid Quest",  "Adventure", 7.9, 2020],
      [5,  "Code Red",       "Action",    6.5, 2023],
      [6,  "Silent Query",   "Mystery",   8.0, 2018],
      [7,  "The Last Row",   "Drama",     7.1, 2021],
      [8,  "Binary Moon",    "Sci-Fi",    8.5, 2022],
      [9,  "Null Island",    "Comedy",    7.3, 2020],
      [10, "Join Theory",    "Sci-Fi",    7.7, 2019],
      [11, "Desert Code",    "Thriller",  6.9, 2023],
      [12, "Indexed Heart",  "Romance",   7.4, 2021],
      [13, "The Outer Join", "Comedy",    6.2, 2022],
      [14, "Schema Blues",   "Drama",     7.8, 2020],
      [15, "Full Scan",      "Action",    7.0, 2023],
    ]
  },
  books: {
    columns: ["id", "title", "author", "price", "year"],
    rows: [
      [1,  "Learning SQL",     "Alan Beaulieu",    45, 2020],
      [2,  "Database Design",  "C.J. Date",        65, 2015],
      [3,  "SQL Cookbook",     "Anthony Molinaro", 38, 2019],
      [4,  "The Data Model",   "Fabian Pascal",    52, 2017],
      [5,  "MySQL in Depth",   "Paul DuBois",      42, 2021],
      [6,  "PostgreSQL Up",    "Regina Obe",       55, 2018],
      [7,  "NoSQL Distilled",  "Fowler",           30, 2016],
      [8,  "Designing Data",   "Kleppmann",        72, 2017],
      [9,  "Clean Code",       "Robert Martin",    35, 2008],
      [10, "SQL Performance",  "Markus Winand",    48, 2019],
      [11, "Seven Databases",  "Wilson",           40, 2018],
      [12, "High Performance", "Schwartz",         60, 2012],
      [13, "SQL Antipatterns", "Bill Karwin",      38, 2020],
      [14, "Practical SQL",    "DeBarros",         42, 2022],
      [15, "SQL in 10 Min",    "Forta",            22, 2019],
    ]
  },
  suppliers: {
    columns: ["id", "name", "city", "rating"],
    rows: [
      [1,  "TechSupply Co",  "Cairo",      4.5],
      [2,  "Nile Traders",   "Giza",       3.8],
      [3,  "Delta Goods",    "Alexandria", 4.2],
      [4,  "Sun Parts",      "Luxor",      3.5],
      [5,  "Cairo Direct",   "Cairo",      4.7],
      [6,  "Eastern Supply", "Aswan",      3.9],
      [7,  "FastShip Ltd",   "Cairo",      4.1],
      [8,  "Nile North",     "Alexandria", 3.6],
      [9,  "Premium Parts",  "Cairo",      4.8],
      [10, "Valley Source",  "Giza",       4.0],
      [11, "Red Sea Trade",  "Hurghada",   3.7],
      [12, "Top Goods Co",   "Cairo",      4.3],
    ]
  },
  deliveries: {
    columns: ["id", "order_id", "supplier_id", "status", "date"],
    rows: [
      [1,  1,  1,  "delivered", "2024-01-20"],
      [2,  2,  3,  "delivered", "2024-01-25"],
      [3,  3,  5,  "pending",   "2024-02-05"],
      [4,  4,  2,  "delivered", "2024-02-15"],
      [5,  5,  7,  "delivered", "2024-02-20"],
      [6,  7,  1,  "delivered", "2024-03-08"],
      [7,  8,  9,  "pending",   "2024-03-15"],
      [8,  9,  3,  "delivered", "2024-03-25"],
      [9,  10, 5,  "delivered", "2024-04-05"],
      [10, 11, 7,  "delivered", "2024-04-12"],
      [11, 12, 2,  "pending",   "2024-04-18"],
      [12, 13, 12, "delivered", "2024-04-26"],
      [13, 14, 9,  "delivered", "2024-05-03"],
      [14, 15, 11, "pending",   "2024-05-12"],
      [15, 7,  4,  "cancelled", "2024-03-06"],
    ]
  },
};

// ── Question bank (15 easy · 15 medium · 15 hard) ──────────────────────────────
const QUESTION_BANK = {
  easy: [
    {
      prompt: "Which query returns ALL columns and rows from the students table?",
      answers: ["SELECT name FROM students;", "SELECT * FROM students;", "GET ALL FROM students;", "SHOW students.*;"],
      correctIndex: 1, tables: ["students"]
    },
    {
      prompt: "Which query returns only the name and grade columns from students?",
      answers: ["SELECT name, grade FROM students;", "SELECT students(name, grade);", "GET name, grade FROM students;", "SELECT * WHERE name, grade FROM students;"],
      correctIndex: 0, tables: ["students"]
    },
    {
      prompt: "How do you get all employees who work in the Engineering department?",
      answers: ["SELECT * FROM employees HAVING department = 'Engineering';", "SELECT department = 'Engineering' FROM employees;", "SELECT * FROM employees WHERE department = 'Engineering';", "FILTER employees WHERE department = 'Engineering';"],
      correctIndex: 2, tables: ["employees"]
    },
    {
      prompt: "Which query returns all products with a price greater than 1000?",
      answers: ["SELECT * FROM products WHERE price > 1000;", "SELECT * FROM products IF price > 1000;", "SELECT price > 1000 FROM products;", "SELECT * FROM products HAVING price > 1000;"],
      correctIndex: 0, tables: ["products"]
    },
    {
      prompt: "How do you get the 5 cheapest books ordered by price ascending?",
      answers: ["SELECT * FROM books FIRST 5 ORDER price;", "SELECT TOP 5 * FROM books ORDER BY price;", "SELECT * FROM books ORDER BY price ASC LIMIT 5;", "SELECT * FROM books LIMIT 5;"],
      correctIndex: 2, tables: ["books"]
    },
    {
      prompt: "Which query returns all students who live in Cairo?",
      answers: ["SELECT * FROM students HAVING city = 'Cairo';", "SELECT city = 'Cairo' FROM students;", "SELECT * FROM students WHERE city IS 'Cairo';", "SELECT * FROM students WHERE city = 'Cairo';"],
      correctIndex: 3, tables: ["students"]
    },
    {
      prompt: "Which query returns all movies with a rating above 7.5?",
      answers: ["SELECT * FROM movies HAVING rating > 7.5;", "SELECT * FROM movies WHERE rating > 7.5;", "SELECT * FROM movies IF rating > 7.5;", "SELECT rating > 7.5 FROM movies;"],
      correctIndex: 1, tables: ["movies"]
    },
    {
      prompt: "How do you sort all products by price from highest to lowest?",
      answers: ["SELECT * FROM products ORDER BY price;", "SELECT * FROM products ORDER BY price ASC;", "SELECT * FROM products SORT price DESC;", "SELECT * FROM products ORDER BY price DESC;"],
      correctIndex: 3, tables: ["products"]
    },
    {
      prompt: "Which query returns employees whose salary is less than 6000?",
      answers: ["SELECT * FROM employees WHERE salary < 6000;", "SELECT * FROM employees WHERE salary > 6000;", "SELECT salary < 6000 FROM employees;", "SELECT * FROM employees HAVING salary < 6000;"],
      correctIndex: 0, tables: ["employees"]
    },
    {
      prompt: "How do you get all orders with status equal to 'pending'?",
      answers: ["SELECT * FROM orders IF status = 'pending';", "SELECT * FROM orders WHERE status LIKE 'pending';", "SELECT * FROM orders WHERE status = 'pending';", "SELECT status = 'pending' FROM orders;"],
      correctIndex: 2, tables: ["orders"]
    },
    {
      prompt: "Which query returns only the name and city columns from customers?",
      answers: ["SELECT customers.name, city;", "SELECT name, city FROM customers;", "GET name, city IN customers;", "SELECT name AND city FROM customers;"],
      correctIndex: 1, tables: ["customers"]
    },
    {
      prompt: "Which query returns all movies released in the year 2022?",
      answers: ["SELECT * FROM movies WHERE year IS 2022;", "SELECT * FROM movies HAVING year = 2022;", "SELECT * FROM movies WHERE year = 2022;", "SELECT * FROM movies IF year == 2022;"],
      correctIndex: 2, tables: ["movies"]
    },
    {
      prompt: "How do you return all books with a price under 40?",
      answers: ["SELECT * FROM books WHERE price < 40;", "SELECT * FROM books WHERE price <= 40;", "SELECT price < 40 FROM books;", "SELECT * FROM books HAVING price < 40;"],
      correctIndex: 0, tables: ["books"]
    },
    {
      prompt: "Which query returns all students aged 17 or older?",
      answers: ["SELECT * FROM students WHERE age > 17;", "SELECT * FROM students WHERE age >= 17;", "SELECT * FROM students HAVING age >= 17;", "SELECT age >= 17 FROM students;"],
      correctIndex: 1, tables: ["students"]
    },
    {
      prompt: "How do you get the 3 employees with the highest salary?",
      answers: ["SELECT * FROM employees ORDER BY salary LIMIT 3;", "SELECT TOP 3 * FROM employees ORDER BY salary DESC;", "SELECT * FROM employees ORDER BY salary DESC LIMIT 3;", "SELECT * FROM employees HAVING salary = MAX LIMIT 3;"],
      correctIndex: 2, tables: ["employees"]
    },
  ],

  medium: [
    {
      prompt: "Which query counts the total number of rows in the orders table?",
      answers: ["SELECT TOTAL(*) FROM orders;", "SELECT SUM(*) FROM orders;", "SELECT COUNT(*) FROM orders;", "SELECT NUMBER(*) FROM orders;"],
      correctIndex: 2, tables: ["orders"]
    },
    {
      prompt: "Which query shows the total salary paid per department?",
      answers: ["SELECT department, SUM(salary) FROM employees GROUP BY department;", "SELECT department, SUM(salary) FROM employees;", "SELECT SUM(salary) FROM employees GROUP department;", "SELECT department, TOTAL(salary) FROM employees GROUP BY department;"],
      correctIndex: 0, tables: ["employees"]
    },
    {
      prompt: "Which query finds the average product price in each category?",
      answers: ["SELECT category, AVG(price) FROM products;", "SELECT category, AVG(price) FROM products GROUP BY category;", "SELECT AVG(price) FROM products GROUP category;", "SELECT category, AVERAGE(price) FROM products GROUP BY category;"],
      correctIndex: 1, tables: ["products"]
    },
    {
      prompt: "Which query joins orders with customers to show customer name and order amount?",
      answers: ["SELECT c.name, o.amount FROM customers c, orders o WHERE id = customer_id;", "SELECT c.name, o.amount FROM customers c INNER JOIN orders o ON c.id = o.customer_id;", "SELECT name, amount FROM customers JOIN orders;", "SELECT c.name, o.amount FROM customers c JOIN orders o ON c.customer_id = o.id;"],
      correctIndex: 1, tables: ["customers", "orders"]
    },
    {
      prompt: "Which query shows distinct customer names who placed at least one order?",
      answers: ["SELECT c.name FROM customers c INNER JOIN orders o ON c.id = o.customer_id;", "SELECT DISTINCT c.name FROM customers c INNER JOIN orders o ON c.id = o.customer_id;", "SELECT UNIQUE c.name FROM customers c JOIN orders o ON c.id = o.customer_id;", "SELECT c.name FROM customers c WHERE orders EXISTS;"],
      correctIndex: 1, tables: ["customers", "orders"]
    },
    {
      prompt: "Which query counts how many customers are from each city?",
      answers: ["SELECT city, COUNT(*) FROM customers GROUP BY city;", "SELECT city, COUNT(*) FROM customers;", "SELECT COUNT(city) FROM customers GROUP BY city;", "SELECT city, SUM(*) FROM customers GROUP BY city;"],
      correctIndex: 0, tables: ["customers"]
    },
    {
      prompt: "Which query shows departments with more than 2 employees?",
      answers: ["SELECT department, COUNT(*) FROM employees WHERE COUNT(*) > 2 GROUP BY department;", "SELECT department FROM employees GROUP BY department HAVING COUNT(*) > 2;", "SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 2;", "SELECT department FROM employees HAVING COUNT(*) > 2;"],
      correctIndex: 2, tables: ["employees"]
    },
    {
      prompt: "Which query returns the maximum salary from the employees table?",
      answers: ["SELECT HIGHEST(salary) FROM employees;", "SELECT MAX(salary) FROM employees;", "SELECT salary ORDER BY salary DESC LIMIT 1 FROM employees;", "SELECT TOP(salary) FROM employees;"],
      correctIndex: 1, tables: ["employees"]
    },
    {
      prompt: "Which query shows the minimum price of products in each category?",
      answers: ["SELECT category, MIN(price) FROM products;", "SELECT MIN(price) FROM products GROUP category;", "SELECT category, MIN(price) FROM products GROUP BY category;", "SELECT category, LOWEST(price) FROM products GROUP BY category;"],
      correctIndex: 2, tables: ["products"]
    },
    {
      prompt: "Which query counts how many products are in each category?",
      answers: ["SELECT category, COUNT(*) FROM products;", "SELECT category, COUNT(*) FROM products GROUP BY category;", "SELECT COUNT(category) FROM products GROUP BY category;", "SELECT category, SUM(1) FROM products;"],
      correctIndex: 1, tables: ["products"]
    },
    {
      prompt: "Which query joins employees with departments to show employee name and department budget?",
      answers: ["SELECT e.name, d.budget FROM employees e INNER JOIN departments d ON e.department = d.name;", "SELECT e.name, d.budget FROM employees e JOIN departments d ON e.id = d.id;", "SELECT e.name, d.budget FROM employees e, departments d;", "SELECT name, budget FROM employees JOIN departments ON id;"],
      correctIndex: 0, tables: ["employees", "departments"]
    },
    {
      prompt: "Which query shows each customer's name and their total spending across all orders?",
      answers: ["SELECT c.name, SUM(o.amount) FROM customers c JOIN orders o;", "SELECT c.name, SUM(o.amount) AS total FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name;", "SELECT c.name, SUM(o.amount) FROM customers c JOIN orders o GROUP BY o.amount;", "SELECT name, SUM(amount) FROM customers, orders GROUP BY name;"],
      correctIndex: 1, tables: ["customers", "orders"]
    },
    {
      prompt: "Which query finds customers who have spent more than 5000 in total?",
      answers: ["SELECT c.name FROM customers c JOIN orders o ON c.id = o.customer_id WHERE SUM(o.amount) > 5000;", "SELECT c.name, SUM(o.amount) FROM customers c JOIN orders o ON c.id = o.customer_id WHERE total > 5000;", "SELECT c.name, SUM(o.amount) FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name HAVING SUM(o.amount) > 5000;", "SELECT c.name FROM customers c JOIN orders o ON c.id = o.customer_id HAVING amount > 5000;"],
      correctIndex: 2, tables: ["customers", "orders"]
    },
    {
      prompt: "Which query shows the average movie rating per genre?",
      answers: ["SELECT genre, AVG(rating) FROM movies;", "SELECT genre, AVG(rating) FROM movies GROUP BY genre;", "SELECT AVG(rating) FROM movies GROUP genre;", "SELECT genre, AVERAGE(rating) FROM movies GROUP BY genre;"],
      correctIndex: 1, tables: ["movies"]
    },
    {
      prompt: "Which LEFT JOIN keeps all customers even those with no orders?",
      answers: ["SELECT c.name, o.amount FROM customers c INNER JOIN orders o ON c.id = o.customer_id;", "SELECT c.name, o.amount FROM orders o LEFT JOIN customers c ON c.id = o.customer_id;", "SELECT c.name, o.amount FROM customers c LEFT JOIN orders o ON c.id = o.customer_id;", "SELECT c.name, o.amount FROM customers c RIGHT JOIN orders o ON c.id = o.customer_id;"],
      correctIndex: 2, tables: ["customers", "orders"]
    },
  ],

  hard: [
    {
      prompt: "Which query finds products that cost MORE than the average product price?",
      answers: ["SELECT * FROM products WHERE price > AVG(price);", "SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);", "SELECT * FROM products HAVING price > AVG(price);", "SELECT * FROM products WHERE price > (SELECT price FROM products);"],
      correctIndex: 1, tables: ["products"]
    },
    {
      prompt: "Which query labels each customer as 'Has Orders' or 'No Orders' using CASE WHEN?",
      answers: ["SELECT c.id, c.name, IF(EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id), 'Has Orders', 'No Orders') AS order_flag FROM customers c;", "SELECT c.id, c.name, CASE WHEN COUNT(o.id) > 0 THEN 'Has Orders' ELSE 'No Orders' END AS order_flag FROM customers c;", "SELECT c.id, c.name, CASE WHEN EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id) THEN 'Has Orders' ELSE 'No Orders' END AS order_flag FROM customers c;", "SELECT c.id, c.name, CASE o.customer_id WHEN NULL THEN 'No Orders' ELSE 'Has Orders' END AS order_flag FROM customers c;"],
      correctIndex: 2, tables: ["customers", "orders"]
    },
    {
      prompt: "Which query finds the employee(s) with the highest salary?",
      answers: ["SELECT * FROM employees ORDER BY salary DESC LIMIT 1;", "SELECT * FROM employees HAVING salary = MAX(salary);", "SELECT * FROM employees WHERE salary = (SELECT MAX(salary) FROM employees);", "SELECT * FROM employees WHERE salary = MAX(salary);"],
      correctIndex: 2, tables: ["employees"]
    },
    {
      prompt: "Which query finds suppliers with zero deliveries using COALESCE + SUM(CASE WHEN ...)?",
      answers: ["SELECT s.id, s.name FROM suppliers s JOIN deliveries d ON d.supplier_id = s.id GROUP BY s.id, s.name HAVING COALESCE(SUM(CASE WHEN d.id IS NOT NULL THEN 1 ELSE 0 END), 0) = 0;", "SELECT s.id, s.name FROM suppliers s LEFT JOIN deliveries d ON d.supplier_id = s.id GROUP BY s.id, s.name HAVING COALESCE(SUM(CASE WHEN d.id IS NOT NULL THEN 1 ELSE 0 END), 0) = 0;", "SELECT s.id, s.name FROM suppliers s WHERE COALESCE(delivery_count, 0) = 0;", "SELECT s.id, s.name FROM suppliers s LEFT JOIN deliveries d ON d.supplier_id = s.id WHERE d.id = 0;"],
      correctIndex: 1, tables: ["suppliers", "deliveries"]
    },
    {
      prompt: "Which correlated query uses CASE WHEN to label each order as above/below that customer's average?",
      answers: ["SELECT o.*, CASE WHEN o.amount > (SELECT AVG(amount) FROM orders) THEN 'Above Avg' ELSE 'Not Above Avg' END AS amount_flag FROM orders o;", "SELECT o.*, CASE WHEN o.amount > (SELECT AVG(amount) FROM orders i WHERE i.customer_id = o.customer_id) THEN 'Above Avg' ELSE 'Not Above Avg' END AS amount_flag FROM orders o;", "SELECT o.*, CASE WHEN AVG(o.amount) > o.amount THEN 'Above Avg' ELSE 'Not Above Avg' END AS amount_flag FROM orders o;", "SELECT o.*, CASE WHEN o.amount > AVG(SELECT amount FROM orders i WHERE i.customer_id = o.customer_id) THEN 'Above Avg' ELSE 'Not Above Avg' END AS amount_flag FROM orders o;"],
      correctIndex: 1, tables: ["orders"]
    },
    {
      prompt: "Which correlated subquery finds employees earning above their department's average salary?",
      answers: ["SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);", "SELECT * FROM employees e WHERE salary > AVG(SELECT salary FROM employees WHERE department = e.department);", "SELECT * FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e.department);", "SELECT * FROM employees GROUP BY department HAVING salary > AVG(salary);"],
      correctIndex: 2, tables: ["employees"]
    },
    {
      prompt: "Which query finds the SECOND highest salary in the employees table?",
      answers: ["SELECT MAX(salary) FROM employees LIMIT 1 OFFSET 1;", "SELECT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;", "SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);", "SELECT SECOND(salary) FROM employees ORDER BY salary DESC;"],
      correctIndex: 2, tables: ["employees"]
    },
    {
      prompt: "Which query finds products never ordered using COUNT(CASE WHEN ...) and COALESCE?",
      answers: ["SELECT p.id, p.name FROM products p JOIN orders o ON p.id = o.product_id GROUP BY p.id, p.name HAVING COALESCE(COUNT(CASE WHEN o.id IS NOT NULL THEN 1 END), 0) = 0;", "SELECT p.id, p.name FROM products p LEFT JOIN orders o ON p.id = o.product_id GROUP BY p.id, p.name HAVING COUNT(*) = 0;", "SELECT p.id, p.name FROM products p LEFT JOIN orders o ON p.id = o.product_id GROUP BY p.id, p.name HAVING COALESCE(COUNT(CASE WHEN o.id IS NOT NULL THEN 1 END), 0) = 0;", "SELECT p.id, p.name FROM products p WHERE COALESCE(order_id, 0) = 0;"],
      correctIndex: 2, tables: ["products", "orders"]
    },
    {
      prompt: "Which query finds departments where the MINIMUM salary of all employees is above 4500?",
      answers: ["SELECT department FROM employees WHERE salary > 4500 GROUP BY department;", "SELECT department FROM employees GROUP BY department HAVING MIN(salary) > 4500;", "SELECT department FROM employees GROUP BY department HAVING ALL salary > 4500;", "SELECT department FROM employees WHERE MIN(salary) > 4500;"],
      correctIndex: 1, tables: ["employees"]
    },
    {
      prompt: "Which query finds orders with no delivery using COUNT(CASE WHEN ...)?",
      answers: ["SELECT o.id FROM orders o JOIN deliveries d ON d.order_id = o.id GROUP BY o.id HAVING COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) = 0;", "SELECT o.id FROM orders o LEFT JOIN deliveries d ON d.order_id = o.id GROUP BY o.id HAVING COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) = 0;", "SELECT o.id FROM orders o WHERE COALESCE(d.order_id, 0) = 0;", "SELECT o.id FROM orders o LEFT JOIN deliveries d ON d.order_id = o.id WHERE COUNT(d.id) = 0;"],
      correctIndex: 1, tables: ["orders", "deliveries"]
    },
    {
      prompt: "Which query finds the product_id with the highest count of delivered orders using COUNT(CASE WHEN ...)?",
      answers: ["SELECT product_id, COUNT(*) AS delivered_cnt FROM orders WHERE status = 'delivered' GROUP BY product_id ORDER BY delivered_cnt DESC LIMIT 1;", "SELECT product_id, COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_cnt FROM orders GROUP BY product_id ORDER BY delivered_cnt DESC LIMIT 1;", "SELECT product_id, SUM(CASE WHEN status = 'delivered' THEN 1 END) FROM orders ORDER BY 2 DESC LIMIT 1;", "SELECT product_id FROM orders HAVING COUNT(CASE WHEN status = 'delivered' THEN 1 END) = MAX;"],
      correctIndex: 1, tables: ["orders"]
    },
    {
      prompt: "Which query finds employees earning more than TWICE the company-wide average salary?",
      answers: ["SELECT * FROM employees WHERE salary > AVG(salary) * 2;", "SELECT * FROM employees WHERE salary > 2 * (SELECT AVG(salary) FROM employees);", "SELECT * FROM employees HAVING salary > 2 * AVG(salary);", "SELECT * FROM employees WHERE salary * 2 > (SELECT AVG(salary) FROM employees);"],
      correctIndex: 1, tables: ["employees"]
    },
    {
      prompt: "Which correlated subquery finds customers who joined before 2020 AND placed at least 2 orders?",
      answers: ["SELECT c.name FROM customers c WHERE c.joined_year < 2020 AND COUNT(orders) >= 2;", "SELECT c.name FROM customers c WHERE c.joined_year < 2020 AND (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) >= 2;", "SELECT c.name FROM customers c JOIN orders o ON c.id = o.customer_id WHERE c.joined_year < 2020 HAVING COUNT(*) >= 2;", "SELECT c.name FROM customers c WHERE joined_year < 2020 GROUP BY c.id HAVING COUNT(orders) >= 2;"],
      correctIndex: 1, tables: ["customers", "orders"]
    },
    {
      prompt: "Which query finds the cheapest product within each category using a correlated subquery?",
      answers: ["SELECT * FROM products p WHERE price = MIN(price) GROUP BY category;", "SELECT * FROM products WHERE price = (SELECT MIN(price) FROM products GROUP BY category);", "SELECT * FROM products p WHERE price = (SELECT MIN(price) FROM products p2 WHERE p2.category = p.category);", "SELECT * FROM products p HAVING price = MIN(p.price) BY category;"],
      correctIndex: 2, tables: ["products"]
    },
    {
      prompt: "Which query finds suppliers who have made MORE THAN 1 delivery?",
      answers: ["SELECT s.name FROM suppliers s WHERE deliveries > 1;", "SELECT s.name FROM suppliers s WHERE (SELECT COUNT(*) FROM deliveries d WHERE d.supplier_id = s.id) > 1;", "SELECT s.name FROM suppliers s HAVING COUNT(deliveries) > 1;", "SELECT s.name FROM suppliers s JOIN deliveries d ON s.id = d.supplier_id WHERE COUNT(*) > 1;"],
      correctIndex: 1, tables: ["suppliers", "deliveries"]
    },
  ],
};

// ── Floor configs ──────────────────────────────────────────────────────────────
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
      { type: "easy",   x: 5,  y: 1 },
      { type: "easy",   x: 3,  y: 3 },
      { type: "easy",   x: 5,  y: 7 },
      { type: "medium", x: 7,  y: 4 },
      { type: "medium", x: 10, y: 7 },
      { type: "hard",   x: 13, y: 6 }
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
      { type: "easy",   x: 12, y: 1 },
      { type: "easy",   x: 3,  y: 3 },
      { type: "easy",   x: 5,  y: 7 },
      { type: "medium", x: 10, y: 5 },
      { type: "medium", x: 10, y: 3 },
      { type: "hard",   x: 11, y: 7 }
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
      { type: "easy",   x: 4,  y: 4 },
      { type: "easy",   x: 9,  y: 1 },
      { type: "easy",   x: 2,  y: 8 },
      { type: "medium", x: 10, y: 6 },
      { type: "medium", x: 12, y: 3 },
      { type: "hard",   x: 8,  y: 8 }
    ]
  }
];

// ── Game state ─────────────────────────────────────────────────────────────────
let cellElements         = [];
let checkpointByPosition = {};
let currentFloor         = 0;
let player               = { x: 1, y: 8 };
let floorCheckpoints     = [];
// Set of question indexes answered correctly this session (not reset on floor advance)
const correctlyAnswered  = { easy: new Set(), medium: new Set(), hard: new Set() };
// Tracks every question index already shown (wrong or right) so we don't repeat until all seen
const shownQuestions     = { easy: new Set(), medium: new Set(), hard: new Set() };
let score = 0;

const SCORE_VALUES = { easy: 100, medium: 200, hard: 400 };
const SCORE_PENALTY = 50;

function updateScore(delta) {
  score = Math.max(0, score + delta);
  scoreValueEl.textContent = score.toLocaleString();
  scoreValueEl.classList.remove("score-pop", "score-drop");
  void scoreValueEl.offsetWidth; // reflow to restart animation
  scoreValueEl.classList.add(delta >= 0 ? "score-pop" : "score-drop");
}
let activeCheckpoint     = null;
let activeQuestion       = null;
let activeQuestionIndex  = -1;
let respawnTimer         = null;
let isTransitioning      = false;
let stairClimbPending    = false;
let stairClimbTimer      = null;
let isGameWon            = false;
let hasTrophy            = false;
let elapsedSeconds       = 0;
let timerInterval        = null;

function formatTime(totalSec) {
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function updateTimerDisplay() {
  if (timerValueEl) timerValueEl.textContent = formatTime(elapsedSeconds);
}

function stopTimer() {
  window.clearInterval(timerInterval);
  timerInterval = null;
}

function startTimer() {
  stopTimer();
  timerInterval = window.setInterval(() => {
    if (isGameWon) return;
    elapsedSeconds += 1;
    updateTimerDisplay();
  }, 1000);
}

// ── Multiplayer state ──────────────────────────────────────────────────────────
let myId   = null;
let myName = "";
let ws     = null;
const remotePlayers = new Map();

// ── Login ──────────────────────────────────────────────────────────────────────
loginFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = nameInputEl.value.trim().replace(/[<>&"']/g, "").slice(0, 20);
  if (!raw) return;
  myName = raw;
  playerNameEl.textContent = myName;
  loginOverlayEl.classList.add("hidden");
  connectWS();
  resetGame();
});

// ── WebSocket ──────────────────────────────────────────────────────────────────
function connectWS() {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${proto}//${location.host}`);
  ws.onopen    = () => ws.send(JSON.stringify({ type: "join", name: myName }));
  ws.onmessage = (e) => { try { handleServerMessage(JSON.parse(e.data)); } catch { /* ignore */ } };
  ws.onclose   = () => window.setTimeout(connectWS, 3000);
  ws.onerror   = () => ws.close();
}

function sendPos() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "move", x: player.x, y: player.y, floor: currentFloor }));
  }
}

// ── Remote players ─────────────────────────────────────────────────────────────
function hueFromId(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  return h % 360;
}

function createRemoteEl(id, name) {
  const el = document.createElement("div");
  el.className = "player remote-player";
  el.style.setProperty("--player-hue", hueFromId(id));
  const label = document.createElement("span");
  label.className = "player-name";
  label.textContent = name;
  el.appendChild(label);
  boardEl.appendChild(el);
  return el;
}

function applyRemotePos(el, x, y) {
  el.style.left = `calc(10px + ${x} * ((100% - 20px) / ${COLS}) + ((100% - 20px) / ${COLS}) * 0.18)`;
  el.style.top  = `calc(10px + ${y} * ((100% - 20px) / ${ROWS}) + ((100% - 20px) / ${ROWS}) * 0.12)`;
}

function upsertRemotePlayer({ id, name, floor, x, y }) {
  let entry = remotePlayers.get(id);
  if (!entry) {
    const el = createRemoteEl(id, name);
    entry = { el, name, floor, x, y };
    remotePlayers.set(id, entry);
    updateOnlineCount();
  }
  entry.floor = floor;
  entry.x = x;
  entry.y = y;
  applyRemotePos(entry.el, x, y);
  entry.el.classList.toggle("off-floor", floor !== currentFloor);
}

function removeRemotePlayer(id) {
  const entry = remotePlayers.get(id);
  if (entry) {
    entry.el.remove();
    remotePlayers.delete(id);
    updateOnlineCount();
  }
}

function refreshRemoteVisibility() {
  for (const entry of remotePlayers.values()) {
    entry.el.classList.toggle("off-floor", entry.floor !== currentFloor);
  }
}

function updateOnlineCount() {
  onlineTextEl.textContent = String(remotePlayers.size + 1);
}

function setStateText(message) {
  tablePanelHintEl.textContent = message;
  tablePanelHintEl.style.display = "";
}

// ── Server message handler ─────────────────────────────────────────────────────
function handleServerMessage(msg) {
  if (msg.type === "init") {
    myId = msg.id;
    for (const peer of (msg.peers || [])) upsertRemotePlayer(peer);
    updateOnlineCount();
    return;
  }
  if (msg.type === "player_join")   { upsertRemotePlayer(msg.player); return; }
  if (msg.type === "player_update") { upsertRemotePlayer(msg.player); return; }
  if (msg.type === "player_leave")  { removeRemotePlayer(msg.id); }
}

// ── Game helpers ───────────────────────────────────────────────────────────────
function currentFloorConfig() {
  return FLOOR_CONFIGS[currentFloor] || FLOOR_CONFIGS[FLOOR_CONFIGS.length - 1];
}

function createFloorCheckpoints() {
  return currentFloorConfig().checkpoints.map((cp, i) => ({
    id:    `${cp.type}-${i}`,
    type:  cp.type,
    x:     cp.x,
    y:     cp.y,
    state: "pending"
  }));
}

function allCheckpointsCleared() {
  return floorCheckpoints.every(cp => cp.state === "cleared");
}

function refreshStairCell() {
  const config = currentFloorConfig();
  const cell = getCell(config.stair.x, config.stair.y);
  if (!cell) return;
  const cleared = allCheckpointsCleared();
  cell.classList.toggle("locked",   !cleared);
  cell.classList.toggle("unlocked",  cleared);
}

function keyFor(x, y) { return `${x},${y}`; }

function getTrophyForCurrentFloor() {
  return currentFloor === TROPHY_FLOOR_INDEX && !hasTrophy ? TROPHY_POS : null;
}

function isOnTrophy() {
  const trophy = getTrophyForCurrentFloor();
  return !!trophy && player.x === trophy.x && player.y === trophy.y;
}

function pickQuestion(type) {
  const pool     = QUESTION_BANK[type];
  const answered = correctlyAnswered[type];
  const shown    = shownQuestions[type];

  // Prefer questions not yet answered AND not recently shown
  let available = pool.map((_, i) => i).filter(i => !answered.has(i) && !shown.has(i));

  // All unanswered have been shown — reset shown so they can cycle again
  if (available.length === 0) {
    shown.clear();
    available = pool.map((_, i) => i).filter(i => !answered.has(i));
  }

  // Edge-case: every question correctly answered — allow full repeat
  if (available.length === 0) available = pool.map((_, i) => i);

  const idx = available[Math.floor(Math.random() * available.length)];
  shown.add(idx);
  return { q: pool[idx], index: idx };
}

function canStepInto(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  return currentFloorConfig().layout[y][x] !== "#";
}

function buildMaze() {
  const config = currentFloorConfig();
  const trophy = getTrophyForCurrentFloor();
  mazeEl.innerHTML = "";
  cellElements = [];
  checkpointByPosition = {};
  floorCheckpoints.forEach(cp => { checkpointByPosition[keyFor(cp.x, cp.y)] = cp; });

  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (config.layout[y][x] !== "#") cell.classList.add("floor");
      if (x === config.start.x && y === config.start.y) cell.classList.add("start");
      if (x === config.stair.x && y === config.stair.y) {
        cell.classList.add("stair");
        if (allCheckpointsCleared()) {
          cell.classList.add("unlocked");
        } else {
          cell.classList.add("locked");
        }
      }
      if (trophy && x === trophy.x && y === trophy.y) cell.classList.add("trophy");
      const cp = checkpointByPosition[keyFor(x, y)];
      if (cp) {
        cell.classList.add("checkpoint", cp.type);
        if (cp.state === "cleared") cell.classList.add("cleared");
      }
      mazeEl.appendChild(cell);
      row.push(cell);
    }
    cellElements.push(row);
  }
}

function getCell(x, y) { return cellElements[y]?.[x] || null; }

function updatePlayerPosition() {
  playerEl.style.left = `calc(10px + ${player.x} * ((100% - 20px) / ${COLS}) + ((100% - 20px) / ${COLS}) * 0.18)`;
  playerEl.style.top  = `calc(10px + ${player.y} * ((100% - 20px) / ${ROWS}) + ((100% - 20px) / ${ROWS}) * 0.12)`;
}

function positionQuestionPanel() {
  const onLeft = player.x < COLS / 2;
  const onTop  = player.y < ROWS / 2;
  questionPanelEl.style.left   = onLeft ? "" : "18px";
  questionPanelEl.style.right  = onLeft ? "18px" : "";
  questionPanelEl.style.top    = onTop  ? "" : "18px";
  questionPanelEl.style.bottom = onTop  ? "18px" : "";
}

// ── Table panel ────────────────────────────────────────────────────────────────
function renderTablePanel(tableNames) {
  tableCardsEl.innerHTML = "";
  tablePanelHintEl.style.display = tableNames.length ? "none" : "";

  tableNames.forEach(tname => {
    const data = TABLE_DATA[tname];
    if (!data) return;

    const card = document.createElement("div");
    card.className = "table-card";

    const header = document.createElement("div");
    header.className = "table-card-header";
    header.textContent = tname;
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "table-card-body";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    data.columns.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.rows.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.appendChild(table);
    card.appendChild(body);
    tableCardsEl.appendChild(card);
  });
}

function clearTablePanel() {
  tableCardsEl.innerHTML = "";
  tablePanelHintEl.style.display = "";
}

function makePreviewTable(data) {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const hrow = document.createElement("tr");
  data.columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function hideQuestionTablePreview() {
  questionTablePreviewEl.classList.add("hidden");
  questionTablePreviewEl.innerHTML = "";
}

function showQuestionTablePreview(nameEl, tableName) {
  const data = TABLE_DATA[tableName];
  if (!data) return;
  questionTablePreviewEl.innerHTML = "";
  questionTablePreviewEl.appendChild(makePreviewTable(data));

  const hostRect = questionPanelEl.getBoundingClientRect();
  const nameRect = nameEl.getBoundingClientRect();
  const left = Math.max(8, Math.min(nameRect.left - hostRect.left, hostRect.width - 260));
  const top = Math.max(58, nameRect.bottom - hostRect.top + 8);

  questionTablePreviewEl.style.left = `${left}px`;
  questionTablePreviewEl.style.top = `${top}px`;
  questionTablePreviewEl.classList.remove("hidden");
}

function renderQuestionTableNames(tableNames) {
  questionTableNamesEl.innerHTML = "";
  hideQuestionTablePreview();

  if (!tableNames.length) {
    questionTablesEl.classList.add("hidden");
    return;
  }

  questionTablesEl.classList.remove("hidden");

  tableNames.forEach((tableName) => {
    const nameEl = document.createElement("span");
    nameEl.className = "q-table-name";
    nameEl.textContent = tableName;
    nameEl.addEventListener("mouseenter", () => showQuestionTablePreview(nameEl, tableName));
    nameEl.addEventListener("mouseleave", hideQuestionTablePreview);
    questionTableNamesEl.appendChild(nameEl);
  });
}

// ── Question logic ─────────────────────────────────────────────────────────────
function openQuestion(cp) {
  const { q, index } = pickQuestion(cp.type);
  activeCheckpoint    = cp;
  activeQuestion      = q;
  activeQuestionIndex = index;

  positionQuestionPanel();
  questionPanelEl.classList.remove("hidden");
  doorTopicEl.textContent     = cp.type.charAt(0).toUpperCase() + cp.type.slice(1) + " checkpoint";
  questionTitleEl.textContent = "Checkpoint Question";
  questionTextEl.textContent  = q.prompt;
  answersEl.innerHTML = "";

  q.answers.forEach((answer, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    const isCorrect = i === q.correctIndex;
    const correctMark = isCorrect ? " ✓" : "";
    btn.innerHTML = `<strong>${i + 1}.</strong> ${answer}${correctMark}`;
    if (isCorrect) btn.classList.add("test-correct");
    btn.addEventListener("click", () => answerCheckpoint(i));
    answersEl.appendChild(btn);
  });

  renderTablePanel(q.tables || []);
  renderQuestionTableNames(q.tables || []);
}

function closeQuestion() {
  activeCheckpoint    = null;
  activeQuestion      = null;
  activeQuestionIndex = -1;
  questionPanelEl.classList.add("hidden");
  answersEl.innerHTML = "";
  clearTablePanel();
  questionTablesEl.classList.add("hidden");
  questionTableNamesEl.innerHTML = "";
  hideQuestionTablePreview();
}

function refreshCheckpointCell(cp) {
  const cell = getCell(cp.x, cp.y);
  if (!cell) return;
  cell.classList.toggle("cleared", cp.state === "cleared");
  cell.classList.remove("exploding");
}

function explodeCheckpoint(cp) {
  const cell = getCell(cp.x, cp.y);
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
  window.clearTimeout(respawnTimer);
  respawnTimer = window.setTimeout(() => {
    player = { ...config.start };
    updatePlayerPosition();
    playerEl.classList.remove("resetting");
    flashEl.classList.remove("on");
    boardEl.classList.remove("shake");
    sendPos();
  }, 430);
}

function answerCheckpoint(index) {
  if (!activeCheckpoint || !activeQuestion) return;
  const btns = [...answersEl.querySelectorAll("button")];
  btns.forEach(b => { b.disabled = true; });

  const correct = index === activeQuestion.correctIndex;
  btns[index]?.classList.add(correct ? "correct" : "wrong");
  // Wrong answer: do NOT reveal the correct one in green

  if (correct) {
    correctlyAnswered[activeCheckpoint.type].add(activeQuestionIndex);
    activeCheckpoint.state = "cleared";
    refreshCheckpointCell(activeCheckpoint);
    refreshStairCell();
    updateScore(SCORE_VALUES[activeCheckpoint.type]);
    // Firework burst from the checkpoint cell
    const srcCell = getCell(activeCheckpoint.x, activeCheckpoint.y);
    if (srcCell) spawnFireworks(srcCell);
    window.setTimeout(closeQuestion, 220);
    return;
  }

  updateScore(-SCORE_PENALTY);
  explodeCheckpoint(activeCheckpoint);
  window.setTimeout(() => {
    closeQuestion();
    resetToFloorStart();
  }, 170);
}

function advanceFloor() {
  currentFloor += 1;
  floorCheckpoints = createFloorCheckpoints();
  player = { ...currentFloorConfig().start };
  buildMaze();
  updatePlayerPosition();
  refreshRemoteVisibility();
  sendPos();
}

function runFloorUpAnimation(onDone) {
  isTransitioning = true;
  mazeEl.style.transition = "none";
  mazeEl.style.opacity    = "0";
  onDone();
  playerEl.classList.remove("resetting");
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
  if (stairClimbPending || isTransitioning || activeCheckpoint || isGameWon) return;
  if (!allCheckpointsCleared()) {
    setStateText("Staircase locked! Solve all checkpoints first.");
    return;
  }
  stairClimbPending = true;
  stairClimbTimer = window.setTimeout(() => {
    const config = currentFloorConfig();
    const stillOnStair = player.x === config.stair.x && player.y === config.stair.y;
    clearPendingStairClimb();
    if (!stillOnStair || isTransitioning || activeCheckpoint || !allCheckpointsCleared()) return;
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

function hideFinalVideo() {
  finalVideoFrameEl.classList.add("hidden");
  finalVideoEl.pause();
  finalVideoEl.currentTime = 0;
  finalVideoEl.onended = null;
  finalVideoEl.src = "./trophy.mp4";
  playerEl.classList.remove("video-hidden");
}

function playFinalVideo(src, onEnded) {
  if (src) {
    finalVideoEl.src = src;
    finalVideoEl.load();
  }
  finalVideoFrameEl.classList.remove("hidden");
  playerEl.classList.add("video-hidden");
  finalVideoEl.controls = false;
  finalVideoEl.playbackRate = 1;
  finalVideoEl.currentTime = 0;
  finalVideoEl.onended = () => {
    finalVideoEl.onended = null;
    if (typeof onEnded === "function") onEnded();
  };
  const p = finalVideoEl.play();
  if (p && typeof p.catch === "function") {
    p.catch(() => {
      finalVideoFrameEl.classList.remove("hidden");
      if (typeof onEnded === "function") onEnded();
    });
  }
}

function showGameOver() {
  finalScoreValueEl.textContent = score.toLocaleString();
  finalTimeValueEl.textContent = formatTime(elapsedSeconds);
  boardEl.classList.add("game-ended");
  gameOverPanelEl.classList.remove("hidden");
}

function hideGameOver() {
  boardEl.classList.remove("game-ended");
  gameOverPanelEl.classList.add("hidden");
}

function triggerWin() {
  if (isGameWon || hasTrophy) return;
  isTransitioning = true;
  clearPendingStairClimb();
  closeQuestion();
  // Trophy pickup on level 3: play trophy video and grant bonus only.
  playFinalVideo("./trophy.mp4", () => {
    hideFinalVideo();
    hasTrophy = true;
    updateScore(GRAIL_BONUS);
    buildMaze();
    updatePlayerPosition();
    isTransitioning = false;
  });
}

function playStairVideoThenAdvance() {
  clearPendingStairClimb();
  isTransitioning = true;
  stairVideoFrameEl.classList.remove("hidden");
  playerEl.classList.add("video-hidden");

  // Select video based on floor transition.
  // floor 1->2: go_up.mp4
  // floor 2->3: up2.mp4
  // floor 3 staircase (after trophy): final.mp4 and game ends
  let videoSrc = "./go_up.mp4";
  if (currentFloor === 1) videoSrc = "./up2.mp4";
  if (currentFloor === TROPHY_FLOOR_INDEX) videoSrc = "./final.mp4";
  stairVideoEl.src = videoSrc;
  stairVideoEl.load();

  // Keep level 2->3 and final staircase videos at regular speed.
  const playbackRate = (currentFloor === 1 || currentFloor === TROPHY_FLOOR_INDEX) ? 1 : 1.5;
  stairVideoEl.controls     = false;
  stairVideoEl.playbackRate = playbackRate;
  stairVideoEl.currentTime  = 0;

  let finished = false;
  const finishSequence = () => {
    if (finished) return;
    finished = true;
    hideStairVideo();
    if (currentFloor === TROPHY_FLOOR_INDEX) {
      isTransitioning = false;
      isGameWon = true;
      stopTimer();
      showGameOver();
      return;
    }
    runFloorUpAnimation(advanceFloor);
  };

  stairVideoEl.onended = finishSequence;
  const p = stairVideoEl.play();
  if (p && typeof p.catch === "function") p.catch(finishSequence);
}

function handleLanding() {
  if (isOnTrophy()) {
    triggerWin();
    return;
  }

  const config = currentFloorConfig();
  if (player.x === config.stair.x && player.y === config.stair.y) {
    if (currentFloor === TROPHY_FLOOR_INDEX && !hasTrophy) {
      clearPendingStairClimb();
      setStateText("Collect the trophy first before using this staircase.");
      return;
    }
    if (!allCheckpointsCleared()) {
      clearPendingStairClimb();
      setStateText("Staircase locked! Solve all checkpoints first.");
      return;
    }
    queueStairClimb();
    return;
  }
  clearPendingStairClimb();
  const cp = checkpointByPosition[keyFor(player.x, player.y)];
  if (cp && cp.state !== "cleared") openQuestion(cp);
}

function tryMove(dx, dy) {
  if (activeCheckpoint || isTransitioning || stairClimbPending || isGameWon) return;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (canStepInto(nx, ny)) {
    player.x = nx;
    player.y = ny;
    updatePlayerPosition();
    sendPos();
    handleLanding();
  }
}

// ── Reset ──────────────────────────────────────────────────────────────────────
function resetGame() {
  currentFloor = 0;
  isTransitioning = false;
  isGameWon = false;
  hasTrophy = false;
  elapsedSeconds = 0;
  updateTimerDisplay();
  startTimer();
  floorCheckpoints = createFloorCheckpoints();
  correctlyAnswered.easy.clear();
  correctlyAnswered.medium.clear();
  correctlyAnswered.hard.clear();
  shownQuestions.easy.clear();
  shownQuestions.medium.clear();
  shownQuestions.hard.clear();
  score = 0;
  scoreValueEl.textContent = "0";
  scoreValueEl.classList.remove("score-pop", "score-drop");
  window.clearTimeout(respawnTimer);
  clearPendingStairClimb();
  closeQuestion();
  player = { ...currentFloorConfig().start };
  buildMaze();
  updatePlayerPosition();
  refreshRemoteVisibility();
  updateOnlineCount();
  flashEl.classList.remove("on");
  boardEl.classList.remove("shake");
  mazeEl.style.transition = "";
  mazeEl.style.opacity    = "";
  playerEl.classList.remove("resetting");
  hideGameOver();
  hideStairVideo();
  hideFinalVideo();
  sendPos();
}

// ── Input ──────────────────────────────────────────────────────────────────────
window.addEventListener("keydown", (e) => {
  if (!myName) return;
  const key = e.key.toLowerCase();
  if (activeCheckpoint && ["1", "2", "3", "4"].includes(key)) {
    e.preventDefault();
    answerCheckpoint(Number(key) - 1);
    return;
  }
  const moves = {
    arrowup:    [0, -1], w: [0, -1],
    arrowdown:  [0,  1], s: [0,  1],
    arrowleft:  [-1, 0], a: [-1, 0],
    arrowright: [ 1, 0], d: [ 1, 0],
  };
  if (moves[key]) { e.preventDefault(); tryMove(...moves[key]); }
});

restartBtn.addEventListener("click", () => { if (myName) resetGame(); });

// ── Fireworks ──────────────────────────────────────────────────────────────────
(function () {
  const canvas  = document.getElementById("fireworksCanvas");
  const ctx     = canvas.getContext("2d");
  let   particles = [];
  let   rafId     = null;

  const COLORS = [
    "#ff4d6d","#ff9a3c","#ffe156","#5ef56e",
    "#3dd6f5","#a78bfa","#f472b6","#ffffff"
  ];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function spawnBurst(cx, cy, count) {
    for (let i = 0; i < count; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const speed  = 3 + Math.random() * 7;
      const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
      const radius = 2.5 + Math.random() * 3.5;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,   // slight upward bias
        alpha: 1,
        radius,
        color,
        gravity: 0.18 + Math.random() * 0.12,
        decay:   0.016 + Math.random() * 0.012,
        trail: [],
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.alpha > 0.02);

    for (const p of particles) {
      // draw trail
      p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
      if (p.trail.length > 5) p.trail.shift();
      for (let t = 0; t < p.trail.length; t++) {
        const tp = p.trail[t];
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, p.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = tp.alpha * 0.3 * ((t + 1) / p.trail.length);
        ctx.fill();
      }

      // draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += p.gravity;
      p.vx   *= 0.98;
      p.alpha -= p.decay;
    }

    ctx.globalAlpha = 1;

    if (particles.length > 0) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  window.spawnFireworks = function (cell) {
    const rect = cell.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    // First burst from the cell
    spawnBurst(cx, cy, 55);

    // Two extra delayed mini-bursts slightly offset for depth
    window.setTimeout(() => {
      spawnBurst(cx + (Math.random() - 0.5) * 40, cy - 20, 30);
    }, 90);
    window.setTimeout(() => {
      spawnBurst(cx + (Math.random() - 0.5) * 50, cy - 35, 25);
    }, 200);

    if (!rafId) rafId = requestAnimationFrame(tick);
  };
}());
