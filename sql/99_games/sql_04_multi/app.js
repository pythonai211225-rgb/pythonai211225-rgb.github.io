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
    ],
    stair: null
  }
];

const QUESTION_BANK = {
  easy: [
    {
      prompt: "Which query retrieves all columns and all rows from the employees table?",
      answers: [
        "GET * FROM employees;",
        "SELECT ALL employees;",
        "SELECT * FROM employees;",
        "FETCH * FROM employees;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query returns only the employees who work in the 'IT' department?",
      answers: [
        "SELECT * FROM employees HAVING dept = 'IT';",
        "SELECT * FROM employees WHERE dept = 'IT';",
        "SELECT dept FROM employees WHERE name = 'IT';",
        "SELECT * FROM employees IF dept = 'IT';"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query counts how many employees are in the table?",
      answers: [
        "SELECT TOTAL(*) FROM employees;",
        "SELECT SUM(*) FROM employees;",
        "SELECT COUNT(employees) FROM *;",
        "SELECT COUNT(*) FROM employees;"
      ],
      correctIndex: 3
    },
    {
      prompt: "Which query returns the total salary of all employees?",
      answers: [
        "SELECT COUNT(salary) FROM employees;",
        "SELECT TOTAL(salary) FROM employees;",
        "SELECT SUM(salary) FROM employees;",
        "SELECT ADD(salary) FROM employees;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query finds the lowest salary in the employees table?",
      answers: [
        "SELECT SMALL(salary) FROM employees;",
        "SELECT MIN(salary) FROM employees;",
        "SELECT FIRST(salary) FROM employees;",
        "SELECT LOWEST(salary) FROM employees;"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query returns the highest order amount from the orders table?",
      answers: [
        "SELECT HIGHEST(amount) FROM orders;",
        "SELECT TOP(amount) FROM orders;",
        "SELECT LAST(amount) FROM orders;",
        "SELECT MAX(amount) FROM orders;"
      ],
      correctIndex: 3
    },
    {
      prompt: "Which query counts the number of employees per department?",
      answers: [
        "SELECT dept, COUNT(*) FROM employees ORDER BY dept;",
        "SELECT dept, COUNT(*) FROM employees GROUP BY dept;",
        "SELECT COUNT(*) FROM employees GROUP dept;",
        "SELECT dept COUNT(*) FROM employees BY dept;"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query returns the total salary for each department?",
      answers: [
        "SELECT dept, SUM(salary) FROM employees GROUP BY dept;",
        "SELECT SUM(salary) FROM employees GROUP BY salary;",
        "SELECT dept, TOTAL(salary) FROM employees GROUP BY dept;",
        "SELECT dept, SUM(salary) FROM employees HAVING dept;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query lists departments that have more than 1 employee?",
      answers: [
        "SELECT dept FROM employees HAVING COUNT(*) > 1;",
        "SELECT dept, COUNT(*) FROM employees WHERE COUNT(*) > 1 GROUP BY dept;",
        "SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 1;",
        "SELECT dept, COUNT(*) FROM employees GROUP BY dept WHERE COUNT(*) > 1;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which statement correctly adds an email column (VARCHAR 100) to the employees table?",
      answers: [
        "ALTER TABLE employees INSERT email VARCHAR(100);",
        "UPDATE TABLE employees ADD email VARCHAR(100);",
        "ALTER TABLE employees ADD email VARCHAR(100);",
        "ALTER TABLE employees CREATE email VARCHAR(100);"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which statement removes the salary column from the employees table?",
      answers: [
        "ALTER TABLE employees DROP COLUMN salary;",
        "ALTER TABLE employees DELETE COLUMN salary;",
        "DROP COLUMN salary FROM employees;",
        "ALTER TABLE employees REMOVE salary;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which statement renames the column name to full_name in the employees table?",
      answers: [
        "ALTER TABLE employees CHANGE name TO full_name;",
        "UPDATE TABLE employees RENAME name full_name;",
        "ALTER TABLE employees MODIFY name = full_name;",
        "ALTER TABLE employees RENAME COLUMN name TO full_name;"
      ],
      correctIndex: 3
    },
    {
      prompt: "Which statement renames the employees table to staff?",
      answers: [
        "RENAME TABLE employees = staff;",
        "ALTER TABLE employees RENAME TO staff;",
        "ALTER employees TO staff;",
        "CHANGE TABLE employees staff;"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query returns each employee name along with their department location, showing only employees that have a matching department?",
      answers: [
        "SELECT e.name, d.location FROM employees e LEFT JOIN departments d ON e.dept = d.dept_name;",
        "SELECT e.name, d.location FROM employees e, departments d;",
        "SELECT e.name, d.location FROM employees e INNER JOIN departments d ON e.dept = d.dept_name;",
        "SELECT e.name, d.location FROM employees e OUTER JOIN departments d ON e.dept = d.dept_name;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query returns all employees and their order amounts, including employees who have placed no orders (showing NULL for amount)?",
      answers: [
        "SELECT e.name, o.amount FROM employees e INNER JOIN orders o ON e.name = o.customer;",
        "SELECT e.name, o.amount FROM orders o LEFT JOIN employees e ON e.name = o.customer;",
        "SELECT e.name, o.amount FROM employees e RIGHT JOIN orders o ON e.name = o.customer;",
        "SELECT e.name, o.amount FROM employees e LEFT JOIN orders o ON e.name = o.customer;"
      ],
      correctIndex: 3
    }
  ],
  medium: [
    {
      prompt: "Which query shows each student's name and score, replacing NULL scores with 0?",
      answers: [
        "SELECT name, COALESCE(0, score) AS score FROM students;",
        "SELECT name, COALESCE(score, 0) AS score FROM students;",
        "SELECT name, REPLACE(score, NULL, 0) AS score FROM students;",
        "SELECT name, NULLIF(score, 0) AS score FROM students;"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query shows each product's name and category_id, replacing NULL category_id with 99?",
      answers: [
        "SELECT name, NULLIF(category_id, 99) FROM products;",
        "SELECT name, COALESCE(NULL, category_id) AS category_id FROM products;",
        "SELECT name, COALESCE(category_id, 99) AS category_id FROM products;",
        "SELECT name, CASE WHEN category_id = NULL THEN 99 ELSE category_id END FROM products;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query labels each student as 'Pass' if their score is >= 60, otherwise 'Fail'?",
      answers: [
        "SELECT name, CASE WHEN score => 60 THEN 'Pass' ELSE 'Fail' END AS result FROM students;",
        "SELECT name, CASE score >= 60 THEN 'Pass' ELSE 'Fail' END AS result FROM students;",
        "SELECT name, CASE WHEN score >= 60 THEN 'Pass' ELSE 'Fail' END AS result FROM students;",
        "SELECT name, WHEN score >= 60 THEN 'Pass' ELSE 'Fail' END AS result FROM students;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query assigns grades: 'A' (>=90), 'B' (>=75), 'C' (>=60), 'F' (below 60) to each student?",
      answers: [
        "SELECT name, CASE WHEN score >= 90 THEN 'A' WHEN score >= 75 THEN 'B' WHEN score >= 60 THEN 'C' ELSE 'F' END AS grade FROM students;",
        "SELECT name, CASE WHEN score >= 60 THEN 'C' WHEN score >= 75 THEN 'B' WHEN score >= 90 THEN 'A' ELSE 'F' END AS grade FROM students;",
        "SELECT name, CASE WHEN score = 90 THEN 'A' WHEN score = 75 THEN 'B' WHEN score = 60 THEN 'C' ELSE 'F' END AS grade FROM students;",
        "SELECT name, CASE score WHEN 90 THEN 'A' WHEN 75 THEN 'B' WHEN 60 THEN 'C' ELSE 'F' END AS grade FROM students;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query returns product names and their category name, but only for products whose price is greater than 100?",
      answers: [
        "SELECT p.name, c.category_name FROM products p INNER JOIN categories c ON p.category_id = c.category_id HAVING p.price > 100;",
        "SELECT p.name, c.category_name FROM products p INNER JOIN categories c ON p.category_id = c.category_id WHERE c.price > 100;",
        "SELECT p.name, c.category_name FROM products p INNER JOIN categories c ON p.category_id = c.category_id WHERE p.price > 100;",
        "SELECT p.name, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.price > 100;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query shows all products and their sale date, but only where the sale date is '2024-01-11'? (Products with no sale on that date should still appear.)",
      answers: [
        "SELECT p.name, s.sale_date FROM products p INNER JOIN sales s ON p.product_id = s.product_id WHERE s.sale_date = '2024-01-11';",
        "SELECT p.name, s.sale_date FROM products p LEFT JOIN sales s ON p.product_id = s.product_id AND s.sale_date = '2024-01-11';",
        "SELECT p.name, s.sale_date FROM products p LEFT JOIN sales s ON p.product_id = s.product_id WHERE s.sale_date = '2024-01-11';",
        "SELECT p.name, s.sale_date FROM sales s LEFT JOIN products p ON p.product_id = s.product_id WHERE s.sale_date = '2024-01-11';"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query returns the total quantity sold for each product_id?",
      answers: [
        "SELECT product_id, COUNT(qty) AS total_qty FROM sales GROUP BY product_id;",
        "SELECT product_id, SUM(qty) AS total_qty FROM sales;",
        "SELECT product_id, SUM(qty) AS total_qty FROM sales GROUP BY qty;",
        "SELECT product_id, SUM(qty) AS total_qty FROM sales GROUP BY product_id;"
      ],
      correctIndex: 3
    },
    {
      prompt: "Which query returns the highest price for each category_id?",
      answers: [
        "SELECT category_id, MAX(price) AS max_price FROM products GROUP BY category_id;",
        "SELECT category_id, MAX(price) AS max_price FROM products;",
        "SELECT category_id, MAX(price) AS max_price FROM products GROUP BY price;",
        "SELECT MAX(price) AS max_price FROM products GROUP BY category_id;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query counts how many products belong to each category_id, including the row where category_id is NULL?",
      answers: [
        "SELECT category_id, COUNT(category_id) AS product_count FROM products GROUP BY category_id;",
        "SELECT category_id, COUNT(*) AS product_count FROM products;",
        "SELECT COUNT(*) AS product_count FROM products GROUP BY category_id;",
        "SELECT category_id, COUNT(*) AS product_count FROM products GROUP BY category_id;"
      ],
      correctIndex: 3
    },
    {
      prompt: "Which query finds product_ids whose total quantity sold is greater than 5?",
      answers: [
        "SELECT product_id, SUM(qty) FROM sales WHERE SUM(qty) > 5 GROUP BY product_id;",
        "SELECT product_id, SUM(qty) AS total_qty FROM sales GROUP BY product_id HAVING qty > 5;",
        "SELECT product_id, SUM(qty) AS total_qty FROM sales GROUP BY product_id HAVING SUM(qty) > 5;",
        "SELECT product_id, SUM(qty) AS total_qty FROM sales HAVING SUM(qty) > 5;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query shows each sale's product name and quantity sold? (Only show rows where there is a matching product.)",
      answers: [
        "SELECT p.name, s.qty FROM products p LEFT JOIN sales s ON p.product_id = s.product_id;",
        "SELECT p.name, s.qty FROM sales s INNER JOIN products p ON s.product_id = p.product_id;",
        "SELECT p.name, s.qty FROM products p, sales s;",
        "SELECT name, qty FROM products INNER JOIN sales;"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query shows all products and their sale date, including products that have no sales (showing NULL for sale_date)?",
      answers: [
        "SELECT p.name, s.sale_date FROM products p INNER JOIN sales s ON p.product_id = s.product_id;",
        "SELECT p.name, s.sale_date FROM sales s LEFT JOIN products p ON s.product_id = p.product_id;",
        "SELECT p.name, s.sale_date FROM products p RIGHT JOIN sales s ON p.product_id = s.product_id;",
        "SELECT p.name, s.sale_date FROM products p LEFT JOIN sales s ON p.product_id = s.product_id;"
      ],
      correctIndex: 3
    },
    {
      prompt: "Which query shows each product name together with its category name? (Only show products that have a matching category.)",
      answers: [
        "SELECT p.name, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id;",
        "SELECT p.name, c.category_name FROM products p INNER JOIN categories c ON p.category_id = c.category_id;",
        "SELECT p.name, c.category_name FROM products p INNER JOIN categories c ON p.name = c.category_name;",
        "SELECT p.name, c.category_name FROM products p, categories c;"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query lists category_ids that have more than 1 product?",
      answers: [
        "SELECT category_id FROM products WHERE COUNT(*) > 1 GROUP BY category_id;",
        "SELECT category_id, COUNT(*) FROM products GROUP BY category_id HAVING COUNT(*) > 1;",
        "SELECT category_id, COUNT(*) FROM products HAVING COUNT(*) > 1;",
        "SELECT category_id FROM products GROUP BY category_id HAVING category_id > 1;"
      ],
      correctIndex: 1
    },
    {
      prompt: "The sales table sometimes has NULL in the qty column. Which query shows all sale records, replacing NULL qty with 0?",
      answers: [
        "SELECT sale_id, product_id, COALESCE(0, qty) AS qty FROM sales;",
        "SELECT sale_id, product_id, NULLIF(qty, 0) AS qty FROM sales;",
        "SELECT sale_id, product_id, COALESCE(qty, 0) AS qty FROM sales;",
        "SELECT sale_id, product_id, REPLACE(qty, NULL, 0) AS qty FROM sales;"
      ],
      correctIndex: 2
    }
  ],
  hard: [
    {
      prompt: "Which query returns the names of customers who have placed at least one order?",
      answers: [
        "SELECT name FROM customers WHERE customer_id = ANY (SELECT customer_id FROM orders GROUP BY customer_id);",
        "SELECT name FROM customers WHERE customer_id IN (SELECT customer_id FROM orders);",
        "SELECT name FROM customers INNER JOIN orders ON customers.customer_id = orders.order_id;",
        "SELECT name FROM customers WHERE customer_id IN (SELECT order_id FROM orders);"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query returns the names of customers who have never placed an order?",
      answers: [
        "SELECT name FROM customers WHERE customer_id NOT IN (SELECT order_id FROM orders);",
        "SELECT name FROM customers LEFT JOIN orders ON customers.customer_id = orders.customer_id WHERE orders.order_id IS NULL;",
        "SELECT name FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM orders);",
        "SELECT name FROM customers WHERE customer_id != (SELECT customer_id FROM orders);"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query returns each customer's name and the total quantity of items they have ordered across all their orders?",
      answers: [
        "SELECT c.name, SUM(oi.qty) AS total_qty FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.name;",
        "SELECT c.name, COUNT(oi.qty) AS total_qty FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.name;",
        "SELECT c.name, SUM(oi.qty) AS total_qty FROM customers c JOIN order_items oi ON c.customer_id = oi.item_id GROUP BY c.name;",
        "SELECT c.name, SUM(oi.qty) AS total_qty FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query returns the customer name and amount of the single most expensive order?",
      answers: [
        "SELECT c.name, MAX(o.amount) FROM customers c JOIN orders o ON c.customer_id = o.customer_id;",
        "SELECT c.name, o.amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id ORDER BY o.amount DESC;",
        "SELECT c.name, o.amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id WHERE o.amount = MAX(o.amount);",
        "SELECT c.name, o.amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id ORDER BY o.amount DESC LIMIT 1;"
      ],
      correctIndex: 3
    },
    {
      prompt: "Which query returns orders whose amount is above the average order amount?",
      answers: [
        "SELECT order_id, amount FROM orders WHERE amount > AVG(amount);",
        "SELECT order_id, amount FROM orders WHERE amount > (SELECT MAX(amount) FROM orders);",
        "SELECT order_id, amount FROM orders WHERE amount > (SELECT AVG(amount) FROM orders);",
        "SELECT order_id, amount FROM orders HAVING amount > AVG(amount);"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query returns the distinct countries of customers who have placed at least one order, with no duplicate rows?",
      answers: [
        "SELECT DISTINCT c.country FROM customers c JOIN orders o ON c.customer_id = o.customer_id;",
        "SELECT c.country FROM customers c JOIN orders o ON c.customer_id = o.customer_id;",
        "SELECT DISTINCT country FROM customers;",
        "SELECT DISTINCT c.country FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query returns the name and order amount for every shipped order?",
      answers: [
        "SELECT c.name, o.amount FROM customers c INNER JOIN orders o ON c.customer_id = o.customer_id WHERE o.status = 'shipped';",
        "SELECT c.name, o.amount FROM customers c INNER JOIN orders o ON c.customer_id = o.customer_id AND o.status = 'shipped' WHERE c.name IS NOT NULL;",
        "SELECT c.name, o.amount FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.status = 'shipped';",
        "SELECT c.name, o.amount FROM customers c INNER JOIN orders o ON c.customer_id = o.order_id WHERE o.status = 'shipped';"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query returns the names of customers who have never placed an order, using a LEFT JOIN?",
      answers: [
        "SELECT c.name FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NOT NULL;",
        "SELECT c.name FROM customers c INNER JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;",
        "SELECT c.name FROM orders o LEFT JOIN customers c ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;",
        "SELECT c.name FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;"
      ],
      correctIndex: 3
    },
    {
      prompt: "Which query finds pairs of customers who live in the same city (without repeating the same pair twice and without pairing a customer with themselves)?",
      answers: [
        "SELECT a.name, b.name, a.city FROM customers a JOIN customers b ON a.city = b.city;",
        "SELECT a.name, b.name, a.city FROM customers a JOIN customers b ON a.city = b.city AND a.customer_id = b.customer_id;",
        "SELECT a.name, b.name, a.city FROM customers a JOIN customers b ON a.city = b.city AND a.customer_id < b.customer_id;",
        "SELECT a.name, b.name FROM customers a CROSS JOIN customers b WHERE a.city = b.city AND a.customer_id != b.customer_id ORDER BY a.customer_id;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query counts, per customer, how many orders are 'shipped' and how many are 'pending' — in two separate columns?",
      answers: [
        "SELECT customer_id, COUNT(*) AS shipped, COUNT(*) AS pending FROM orders GROUP BY customer_id, status;",
        "SELECT customer_id, SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending FROM orders GROUP BY customer_id;",
        "SELECT customer_id, COUNT(status = 'shipped') AS shipped, COUNT(status = 'pending') AS pending FROM orders GROUP BY customer_id;",
        "SELECT customer_id, CASE WHEN status = 'shipped' THEN COUNT(*) END AS shipped FROM orders GROUP BY customer_id;"
      ],
      correctIndex: 1
    },
    {
      prompt: "Which query returns the customer name and product name for all shipped orders?",
      answers: [
        "SELECT c.name, oi.product_name FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id WHERE o.status = 'shipped';",
        "SELECT c.name, oi.product_name FROM customers c JOIN order_items oi ON c.customer_id = oi.item_id JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'shipped';",
        "SELECT c.name, oi.product_name FROM customers c JOIN orders o ON c.customer_id = o.order_id JOIN order_items oi ON o.order_id = oi.order_id WHERE o.status = 'shipped';",
        "SELECT c.name, oi.product_name FROM customers c, orders o, order_items oi WHERE o.status = 'shipped';"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query returns customer names who have placed more than 1 order?",
      answers: [
        "SELECT c.name, COUNT(o.order_id) AS total FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.name HAVING COUNT(o.order_id) > 1;",
        "SELECT c.name FROM customers c JOIN orders o ON c.customer_id = o.customer_id WHERE COUNT(o.order_id) > 1 GROUP BY c.name;",
        "SELECT c.name FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.name HAVING o.order_id > 1;",
        "SELECT c.name, COUNT(*) AS total FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id HAVING total > 1;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query returns the name and amount of the single highest-amount order, using a subquery?",
      answers: [
        "SELECT c.name, o.amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id WHERE o.amount = MAX(o.amount);",
        "SELECT c.name, o.amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id ORDER BY o.amount DESC LIMIT 1;",
        "SELECT c.name, o.amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id WHERE o.amount = (SELECT MAX(amount) FROM orders);",
        "SELECT c.name, MAX(o.amount) FROM customers c JOIN orders o ON c.customer_id = o.customer_id;"
      ],
      correctIndex: 2
    },
    {
      prompt: "Which query returns all customers, their orders (if any), and the item count per order — including customers with no orders (showing NULL)?",
      answers: [
        "SELECT c.name, o.order_id, COUNT(oi.item_id) AS item_count FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id LEFT JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.name, o.order_id;",
        "SELECT c.name, o.order_id, COUNT(oi.item_id) AS item_count FROM customers c INNER JOIN orders o ON c.customer_id = o.customer_id LEFT JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.name, o.order_id;",
        "SELECT c.name, o.order_id, COUNT(oi.item_id) AS item_count FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id INNER JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.name, o.order_id;",
        "SELECT c.name, o.order_id, COUNT(*) AS item_count FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id LEFT JOIN order_items oi ON o.order_id = oi.order_id;"
      ],
      correctIndex: 0
    },
    {
      prompt: "Which query returns each customer's name and their total revenue (calculated as qty × unit_price across all their order items)?",
      answers: [
        "SELECT c.name, SUM(oi.qty * oi.unit_price) AS revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.name;",
        "SELECT c.name, SUM(oi.qty * oi.unit_price) AS revenue FROM customers c JOIN order_items oi ON c.customer_id = oi.item_id GROUP BY c.name;",
        "SELECT c.name, SUM(o.amount) AS revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.name;",
        "SELECT c.name, SUM(oi.qty * oi.unit_price) AS revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id;"
      ],
      correctIndex: 0
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

function allCheckpointsCleared() {
  return floorCheckpoints.every(cp => cp.state === "cleared");
}

function refreshStairCell() {
  const config = currentFloorConfig();
  if (!config.stair) return;
  const cell = getCell(config.stair.x, config.stair.y);
  if (!cell) return;
  const cleared = allCheckpointsCleared();
  cell.classList.toggle("locked", !cleared);
  cell.classList.toggle("unlocked", cleared);
}

function updateStats() {
  const counts = solvedCounts();
  const config = currentFloorConfig();
  floorTextEl.textContent = String(currentFloor);
  progressTextEl.textContent = `E ${counts.easy}/${REQUIRED_COUNTS.easy} | M ${counts.medium}/${REQUIRED_COUNTS.medium} | H ${counts.hard}/${REQUIRED_COUNTS.hard}`;
  if (!config.stair) {
    stairTextEl.textContent = allCheckpointsCleared() ? "All done – you win!" : "No exit – solve all checkpoints";
  } else {
    stairTextEl.textContent = allCheckpointsCleared() ? "Open ✓" : "Locked – solve all checkpoints first";
  }
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
      if (config.stair && x === config.stair.x && y === config.stair.y) {
        cell.classList.add("stair");
        if (!allCheckpointsCleared()) {
          cell.classList.add("locked");
        } else {
          cell.classList.add("unlocked");
        }
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
    setStateText("Solve all checkpoints to unlock the staircase.");
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
    refreshStairCell();
    updateStats();
    setStateText(`${activeCheckpoint.topic} cleared`);
    window.setTimeout(() => {
      closeQuestion();
      const cfg = currentFloorConfig();
      if (!cfg.stair && allCheckpointsCleared()) {
        triggerWin();
      }
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
  setStateText(`Floor ${currentFloor}. Solve all checkpoints to unlock the staircase.`);
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
  const config = currentFloorConfig();
  if (!config.stair || stairClimbPending || isTransitioning || activeCheckpoint) {
    return;
  }

  stairClimbPending = true;
  stairClimbTimer = window.setTimeout(() => {
    const config = currentFloorConfig();
    const stillOnStair = config.stair && player.x === config.stair.x && player.y === config.stair.y;
    clearPendingStairClimb();
    if (!stillOnStair || isTransitioning || activeCheckpoint || !allCheckpointsCleared()) {
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
  
  // Select video based on current floor
  // currentFloor 0->1 (level 1->2): use default go_up.mp4
  // currentFloor 1->2 (level 2->3): use up2.mp4
  const videoSrc = currentFloor === 1 ? "up2.mp4" : "go_up.mp4";
  stairVideoEl.src = videoSrc;
  stairVideoEl.load();
  
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

  if (config.stair && player.x === config.stair.x && player.y === config.stair.y) {
    if (!allCheckpointsCleared()) {
      clearPendingStairClimb();
      setStateText("Staircase locked! Solve all checkpoints before climbing.");
      return;
    }
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

  if (!config.stair) {
    setStateText(allCheckpointsCleared() ? "Floor complete!" : "No exit on this floor – solve all checkpoints to win!");
  } else {
    setStateText(allCheckpointsCleared() ? "All checkpoints cleared! Reach the staircase to climb." : "Solve all checkpoints to unlock the staircase.");
  }
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

function triggerWin() {
  isTransitioning = true;
  flashEl.classList.add("on");
  window.setTimeout(() => {
    flashEl.classList.remove("on");
    document.getElementById("winPanel").classList.remove("hidden");
    setStateText("You completed all floors! Congratulations!");
  }, 400);
}

function resetGame() {
  currentFloor = 0;
  isTransitioning = false;
  floorCheckpoints = createFloorCheckpoints();
  usedQuestionIndexes = createUsageTracker();
  window.clearTimeout(respawnTimer);
  clearPendingStairClimb();
  closeQuestion();
  document.getElementById("winPanel").classList.add("hidden");
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
  setStateText("Solve all checkpoints on each floor to unlock the staircase.");
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
document.getElementById("winRestartBtn").addEventListener("click", resetGame);

resetGame();
