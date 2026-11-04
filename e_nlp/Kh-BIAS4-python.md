# Naive Bayes in NLP – Python Example

אנחנו עובדים עם הקובץ `airline_tweets.csv` שמכיל ציוצים של לקוחות, עם טקסט חופשי ותווית רגשית (positive, neutral, negative)

המטרה שלנו היא לחזות את הרגש של כל ציוץ לפי התוכן שלו בלבד

## שלב 1: טעינת הנתונים

<img src="images/biasex1.jpg" style="width: 100%" />

## שלב 2: חקירת הנתונים

- סופרים כמה ציוצים יש לכל תווית רגשית
- מזהים שמרבית הציוצים הם שליליים
- בודקים אילו סיבות ניתנו לציוצים שליליים

נספור כמות ציוצים:

<img src="images/biasex2.jpg" style="width: 100%" />

נספור כמה לכל סיבה:

<img src="images/biasex3.jpg" style="width: 100%" />

נספור כמה יש בכל קטגוריה לפי חברת תעופה:

<img src="images/biasex4.jpg" style="width: 100%" />

## שלב 3: הכנת הנתונים

- בוחרים רק את עמודת `text` (תוכן הציוץ) כקלט
- עמודת `airline_sentiment` משמשת כתיוג (label)

<img src="images/biasex5.jpg" style="width: 100%" />

- מבצעים פיצול ל־Train/Test

<img src="images/biasex6.jpg" style="width: 100%" />

- מבצעים וקטוריזציה מסוג TF-IDF על טקסט בלבד

> שים לב: כדי להימנע מדליפת מידע (Data Leakage), מבצעים את הפיצול **לפני** הווקטוריזציה

<img src="images/biasex7.jpg" style="width: 100%" />

**מה זה וקטוריזציה?**

וקטוריזציה היא תהליך שבו אנחנו ממירים טקסטים (שפה טבעית) לייצוג מספרי (וקטורים), כדי שמודלים של למידת מכונה יוכלו לעבוד איתם

במקרה הזה, אנחנו משתמשים בשיטת TF-IDF — Term Frequency-Inverse Document Frequency — שמחשבת משקל לכל מילה בטקסט לפי:

פ- כמה פעמים המילה מופיעה בטקסט (TF)

פ- ועד כמה המילה ייחודית ביחס לשאר הטקסטים (IDF)

הפקודה transform לוקחת את הטקסט שלך (למשל X_train או X_test) וממירה כל טקסט ל־וקטור של מספרים

בהתאם למה שנלמד קודם עם fit

**מה עושה הפרמטר stop_words='english'?**

הוא אומר: "אל תכלול מילים נפוצות באנגלית בתהליך הוקטוריזציה"

מדוע?

בזמן שאנחנו עושים וקטוריזציה לטקסט (כמו TF-IDF), אנחנו לא רוצים לכלול מילים חסרות משמעות

כאלה שמופיעות כמעט בכל משפט ולא באמת תורמות להבנת התוכן

**למה לא עושים fit_transform(X_test) בנפרד ל־test?**

כי אם תעשה fit_transform(X_test), אתה בעצם מלמד את המודל מחדש על דאטה שהוא אמור לבדוק —

וזה גורם ל־Data Leakage ❌

כי ב־test אתה רוצה לבדוק את המודל על משהו חדש לגמרי בלי שהייתה לו גישה מראש למידע הזה

## שלב 4: אימון המודלים

**מאמנים מודל מסוג `MultinomialNB` (Naive Bayes)**

ה- MultinomialNB הוא מימוש של אלגוריתם Naive Bayes, שמיועד לבעיות סיווג (classification)

למה דווקא Multinomial?

כי בניגוד לגרסאות אחרות של Naive Bayes (כמו Gaussian),
הגרסה הזו יודעת לעבוד הכי טוב כשאנחנו סופרים כמה פעמים מופיעה כל מילה בטקסט
וזה בדיוק מה שאנחנו עושים בטקסטים אחרי CountVectorizer או TF-IDF

אם לדוגמא הנתונים שלנו הם רציפים (continuous values) — כלומר מספרים אמיתיים ולא ספירות של מילים
לדוגמא: טמפרטורה, גובה וכו' נשתמש ב- GaussianNB

<img src="images/biasex8.jpg" style="width: 100%" />

בנוסף, מאמנים גם `LogisticRegression` לצורך השוואה

<img src="images/biasex9.jpg" style="width: 100%" />

**מה התוכנית עושה?**

אנחנו רוצים לחזות את הרגש של ציוץ (חיובי, שלילי או ניטרלי) כדי לעשות את זה — אנחנו צריכים מודל שלומד מתוויות העבר

מה Naive Bayes עושה פה?

הוא מקבל: טקסטים של ציוצים ומה התיוג שלהם (רגש)

ואז: לומד מה הסיכוי שמילים מסוימות שייכות לרגש מסוים

לדוגמה: אם מופיעה המילה "delayed", הוא לומד שזה מופיע הרבה בציוצים שליליים

כלומר: הוא בונה מודל שאומר "אם מופיעות המילים האלו — הסיכוי הכי גבוה שהציוץ שלילי"

**מה Logistic Regression עושה פה?**

הוא מקבל את אותם הנתונים בדיוק כמו Naive Bayes אבל הוא לא משתמש בהסתברויות, אלא:

מחשב גבול החלטה מתמטי בין המחלקות

לומד באופן סטטיסטי מה שוקל הכי הרבה כדי לקבוע אם ציוץ הוא חיובי או שלילי

כלומר: הוא מנסה למצוא פונקציה שמפרידה הכי טוב בין רגשות, על סמך כל המילים יחד

**אז למה צריך את שניהם?**

כי אנחנו רוצים לבדוק: איזה מודל מתאים יותר לבעיה שלנו

ולכן מריצים את שניהם על אותם נתונים:
ה- Naive Bayes: פשוט ומהיר, מתאים כשיש תכונות עצמאיות (מילים בלי קשר ביניהן)

ה- Logistic Regression: חזק ומדויק יותר, מתאים כשהקשרים בין מילים חשובים

ואז משווים: מי פגע טוב יותר ברגש? מי נתן תוצאה טובה יותר?

## שלב 5: הערכת ביצועים

- פונקציה שמחשבת את התוצאות של כל מודל על סט הבדיקה

<img src="images/biasex10.jpg" style="width: 100%" />

- מדפיסים precision, recall, f1 לכל מחלקה

### השוואת ביצועים

<img src="images/biasex13.png" style="width: 100%" />

- המודל של Logistic Regression מדויק יותר מ־Naive Bayes
- זה צפוי, כי Logistic Regression מודל מורכב יותר

### ❓ אז למה ללמוד Naive Bayes?

#### ✅ כי לעיתים הוא:
- **מהיר משמעותית**
- **עובד טוב עם מעט דאטה**
- **פשוט ליישום**
- **נותן תוצאות מפתיעות בטקסטים**
- **מבוסס על הסתברויות — קל לפרש**

#### 🧠 מתי Naive Bayes עדיף על Logistic Regression?

#### 1. כשיש **מעט מאוד דאטה**
- Logistic Regression צריך הרבה דוגמאות כדי ללמוד כמו שצריך
- Naive Bayes עובד טוב גם עם עשרות או מאות טקסטים

#### 2. כשכל תכונה **עצמאית** מהשאר
- לדוגמה: זיהוי ספאם לפי מילים בודדות
- אין קשר בין המילים, וזה בדיוק מה ש־Naive Bayes מניח

#### 3. כשצריך **מהירות**
- Naive Bayes מתאמן פי כמה יותר מהר מכל מודל אחר
- מתאים למצבים של זמן אמת (כמו סינון אימיילים או תגובה מהירה)

#### ⚔️ השוואה בין Naive Bayes ו־Logistic Regression

| תכונה                     | Naive Bayes                  | Logistic Regression             |
|---------------------------|------------------------------|---------------------------------|
| דיוק                      | בינוני–גבוה                 | גבוה יותר לרוב                 |
| מהירות                   | מהיר מאוד                    | איטי יותר                      |
| מתאים לדאטה קטן           | ✅                            | פחות                            |
| הנחת תכונות עצמאיות       | כן (חובה)                    | לא חייב                         |
| פרשנות הסתברותית          | כן                            | כן                              |

#### 🟢 סיכום

לומדים Naive Bayes לא בגלל שהוא תמיד מנצח —  
אלא כי הוא מודל בסיסי, חכם, קל להסבר, שימושי בהרבה בעיות,  
ולפעמים — הוא פשוט **הפתעת השנה** 🎯

## שלב 6: פרדיקציה

**נבנה pipeline**

<img src="images/biasex14.jpg" style="width: 100%" />

**ננבא את הרגש של המילים**

<img src="images/biasex15.jpg" style="width: 100%" />


---

## הקוד המלא

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

# load data
df = pd.read_csv('airline_tweets.csv')
df

import seaborn as sns
import matplotlib.pyplot as plt

sns.countplot(data=df, x='airline_sentiment')
plt.show()

sns.countplot(data=df, x='negativereason')
plt.xticks(rotation=90)
plt.show()

sns.countplot(data=df, x='airline', hue='airline_sentiment')
plt.show()

data = df[['airline_sentiment', 'text']]
data.head()

from sklearn.model_selection import train_test_split
         
X = data['text']
y = data['airline_sentiment']
         
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

from sklearn.feature_extraction.text import TfidfVectorizer
         
tfidf_vectorizer = TfidfVectorizer(stop_words='english')
tfidf_vectorizer.fit(X_train)
X_train_tfidf = tfidf_vectorizer.transform(X_train)
X_test_tfidf = tfidf_vectorizer.transform(X_test)

from sklearn.naive_bayes import MultinomialNB

naive_bias = MultinomialNB()
naive_bias.fit(X_train_tfidf, y_train)

from sklearn.linear_model import LogisticRegression

logistic_reg = LogisticRegression(max_iter=1000)
logistic_reg.fit(X_train_tfidf, y_train)

from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

def print_metrics(model):
   predictions = model.predict(X_test_tfidf)
   print(accuracy_score(y_test, predictions))
   print()
   print(classification_report(y_test, predictions))
   print()
   print(confusion_matrix(y_test, predictions))

print_metrics(naive_bias)

print_metrics(logistic_reg)

from sklearn.pipeline import Pipeline

pipeline = Pipeline([('tfidf', TfidfVectorizer()), ('logistic_reg', LogisticRegression())])

pipeline.fit(X, y)

print(pipeline.predict(["good flight"]))
print(pipeline.predict(["bad flight"]))
print(pipeline.predict(["ok flight"]))
```