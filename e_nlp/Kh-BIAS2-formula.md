# Naive Bias in NLP

## נוסחמא מתמטית

אנחנו רוצים לסווג טקסטים – למשל:
- האם ביקורת לסרט היא חיובית או שלילית?
- האם מייל הוא ספאם או לא?

### מה הקשר לנוסחת בייס?

כמו שלמדנו קודם:

$$
P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}
$$

עכשיו נשתמש בזה כדי לסווג טקסטים לפי מילים (tokens)

### איך זה נראה ב־NLP?

#### עבור מילה אחת

עבור מילה אחת אנחנו רוצים לחשב:

מה ההסתברות שהמילה שייכת לקטגוריה מסוימת (למשל – חיובי)?

$$
P(C_k|x) = \frac{P(C_k) \cdot P(x|C_k)}{P(x)}
$$

- **P(Ck | x)**: The probability that the text (x) belongs to class Ck  
  → This is what we want to find

- **P(Ck)**: The prior probability of class Ck  
  → How common this class is in the **training data** (e.g., how many of the training reviews are labeled as positive)

- **P(x | Ck)**: The likelihood  
  → How likely it is to see the words x in texts that belong to class Ck. This is calculated from the **training data**

- **P(x)**: The evidence or total probability of x  
  → How likely the words x are in general, across all classes (from the **training data**)

#### עבור אוסף של מילים

נסמן את הטקסט שלנו כקבוצה של מילים:

$$
\mathbf{x} = (x_1, x_2, ..., x_n)
$$

כלומר: טקסט הוא פשוט אוסף של מילים כמו "good", "movie", "thrilling", וכו'

אנחנו רוצים לחשב:
מה ההסתברות שהטקסט שייך לקטגוריה מסוימת (למשל – חיובי), לפי המילים שבתוכו?

**כאשר נציב את וקטור המילים ונערוך מספר פעולות מתמטיות נקבל:**

$$
P(C_k | \mathbf{x}) \propto P(C_k) \cdot \prod_{i=1}^{n} P(x_i | C_k)
$$

אל תיבהל! בוא נפרק:


### Formula:
P(Ck | x) ∝ P(Ck) × ∏ P(xi | Ck)

Where:

- **P(Ck | x)**: The probability that the text `x` (a sequence of words) belongs to class `Ck`  
  → This is the final result we want to calculate: how likely the text is to belong to a specific class (e.g., "positive", "spam")

- **P(Ck)**: The prior probability of class `Ck`  
  → How common this class is in the **training data** (e.g., how many reviews in the training set are labeled as "positive")

- **P(xi | Ck)**: The likelihood  
  → The probability that the word `xi` appears in texts of class `Ck`.  
  → This is calculated from the **training data** by counting how often each word appears in each class

- **∏ (product)**: Multiply all the individual word probabilities together  
  → We assume that the words are conditionally independent given the class, so we multiply them

- **∝ (proportional to)**: choosing the best fit
  → picking the highest value from the list or result of k classes

  comment:
  we ignore the dominator P(x) from the previous equation
  Because P(x) is the same for all classes, we don't need it when comparing which class has the highest probability

אנחנו כופלים את ההסתברות המוקדמת של המחלקה (class) בהסתברויות של כל מילה להופיע במחלקה הזו.  
המחלקה שמקבלת את התוצאה הגבוהה ביותר היא זו שתיבחר כתווית החיזוי של הטקסט

#### מה עושים בפועל?

1. סופרים כמה טקסטים יש מכל קטגוריה → זה P(Ck)
2. סופרים כמה פעמים כל מילה מופיעה בכל קטגוריה → זה P(Xi | Ck)
3. מחלקים טקסט חדש למילים, מחשבים את ההסתברויות האלה עבור כל קטגוריה
4. בוחרים את הקטגוריה עם **ההסתברות הכי גבוהה**

**דוגמה פשוטה (בלי מתמטיקה):**

- יש לנו טקסט: `"great movie"`
- המודל יודע שמילה "great" מופיעה רק בטקסטים חיוביים
- המודל מחשב שההסתברות שזה חיובי גבוהה יותר מהאפשרות שזה שלילי
- לכן הוא יסווג את הטקסט כ־**חיובי**

## למה אלגוריתמים של Naive Bayes שימושיים במשימות סיווג טקסטים (NLP)?

ה- **Simplified Assumption** → המודל פועל מתוך הנחה שהמאפיינים (כלומר המילים בטקסט) הם בלתי תלויים זה בזה בתנאי שמכירים את הקטגוריה

למרות שזה לא תמיד נכון במציאות, ההנחה הזו מפשטת מאוד את החישובים ועדיין מביאה לביצועים טובים בסיווג טקסטים

**יעילות חישובית** → Naive Bayes הוא אלגוריתם מהיר מאוד באימון ובחיזוי

זה הופך אותו למתאים במיוחד למצבים שדורשים קבלת החלטות מהירה, וליישומים עם כמויות גדולות של נתונים

**התמודדות עם מידע מרובה ממדים** → טקסטים הם באופן טבעי בעלי מימדיות גבוהה, כי כל מילה ייחודית היא מאפיין בפני עצמו

ה- Naive Bayes יודע להתמודד עם מימדיות גבוהה בקלות יחסית ולכן מתאים למשימות סיווג טקסטים

**עמידות למאפיינים לא רלוונטיים** → האלגוריתם עמיד יחסית גם כאשר יש בטקסט מאפיינים מיותרים

הסיבה היא שהמאפיינים לא הרלוונטיים לא משפיעים הרבה על החישוב הכולל של ההסתברות, בזכות הנחת העצמאות שלו
