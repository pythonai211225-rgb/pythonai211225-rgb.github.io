## SpaCy – טוקניזציה (Tokenization)

### כיצד spaCy מפרק טוקנים בשפה

ה- spaCy משתמש בחוקי טוקניזציה שמתאימים לשפה (למשל אנגלית) שמוגדרים מראש

- **Prefixes** – Characters at the beginning of a token, such as `$`, `(`
- **Suffixes** – Characters at the end of a token, such as `.`, `!`
- **Infixes** – Characters that appear inside tokens and cause a split, such as the hyphen in `"e-mail"`

ה- SpaCy משתמשת בחוקי התאמה (matching rules) שמותאמים לשפה שבה אנחנו עובדים. הכללים קובעים כיצד לפצל טקסט לטוקנים על בסיס מרווחים, סימני פיסוק וחוקים לשוניים מורכבים יותר

#### כללי טוקניזציה בסיסיים:

* **מרווחים (Whitespace)** – פיצול של הטקסט במקומות שבהם יש רווח, טאבים או ירידת שורה
* **סימני פיסוק (Punctuation)** – זיהוי של סימנים כמו `!`, `?`, `.` כדי לפצל טוקנים בהתאם
* **חוקים לשוניים מורכבים (Complex linguistic rules)** – טיפול בקונטרקציות (כמו "don't" שמתחלק ל־"do" ו־"n't"), קיצורים (כמו "U.S."), ומקרים חריגים נוספים

**דוגמה: "We're moving to L.A.!"**

באיור המצורף, ניתן לראות כיצד SpaCy מפרקת את הטקסט שלב אחר שלב:

<img src="images/nlp13.png" style="width: 90%" />


1. **Original Text** – "We’re moving to L.A.!"
2. **Split on Whitespace** – פיצול ראשוני לפי רווחים בלבד
3. **Prefix** – זיהוי של תווים לפני מילה (כמו גרש בתחילת מילה)
4. **Exception** – handling contractions like "We're", which is split into "We" + "'re"
5. **Suffix** – זיהוי תווים שבסוף מילה (כמו סימן קריאה)
6. **Exception נוסף** – an abbreviation like "L.A." is recognized as a valid abbreviation קיצור תקני
7. **Done** – הפיצול הסופי של הטקסט לטוקנים מוכנים לעיבוד


### סיכום:

ה- SpaCy לא סומכת רק על חלוקה לפי רווחים או סימני פיסוק, אלא משתמשת גם בכללים מתקדמים כדי לזהות קונטרקציות, קיצורים, ותבניות מיוחדות. תהליך זה מבטיח שהטוקנים הסופיים יהיו מדויקים ונכונים לעיבוד תחבירי ולשוני

קונטרקציה (באנגלית: contraction) היא קיצור של שתי מילים או יותר למילה אחת, תוך השמטת אותיות ושימוש בסימנים כמו גרש (’)  
למשל: don't → do + not

```python
mystring = "\"We\'re moving to L.A.!\""
print(mystring)
print()

doc = nlp(mystring)
for token in doc:
    print(token.text)
```

#### Output:

```
"
We
're
moving
to
L.A.
!
"
```

#### Explanation of tokenization:

* **"** → The opening quotation mark is treated as a separate token. spaCy recognizes quotation marks as distinct punctuation characters
* **We + 're** → spaCy separates the contraction `'re` from `We`, treating them as distinct tokens. This allows for better analysis of verbs
* **L.A.** → spaCy recognizes "L.A." as an abbreviation and correctly handles the periods. It does not split "L.A." into multiple tokens
* **!** → The exclamation mark is treated as a separate token. spaCy splits punctuation marks to isolate them

### Named Entity Recognition (NER) and Tokenization in spaCy

בדוגמה זו נחקור כיצד SpaCy מבצעת טוקניזציה ולאחר מכן מזהה ישויות בשם מתוך משפט

#### Tokenization Example

```python
import spacy
nlp = spacy.load("en_core_web_sm")

# Process the text
doc8 = nlp('Apple is about to build a factory in Hong Kong for $6 million')

# Print tokens
for token in doc8:
    print(token.text, end=' | ')
```

**Output:**

```
Apple | is | about | to | build | a | factory | in | Hong | Kong | for | $ | 6 | million | 
```

ה- spaCy מפרקת את המשפט לטוקנים בעלי משמעות, תוך ניהול נכון של סימני פיסוק ומילים מורכבות

#### Named Entity Recognition Example

**מה זה `ents` ב־spaCy?**

התכונה `ents` של האובייקט `Doc` מכילה את כל **הישויות בשם** (Named Entities) ש־spaCy זיהתה בטקסט

ישויות בשם הן מילים או צירופים שמתארים דברים ממשיים בעולם, כמו:

* שמות של **אנשים** (PERSON)
* **חברות וארגונים** (ORG)
* **מדינות וערים** (GPE)
* **תאריכים** (DATE)
* **סכומים כספיים** (MONEY)

```python
doc8 = nlp('Apple is about to build a factory in Hong Kong for $6 million')

for entity in doc8.ents:
    print(entity)
    print(entity.label_)
    print(spacy.explain(entity.label_))
    print('\n')
```

Output:
```
Apple
ORG
Companies, agencies, institutions, etc.


Hong Kong
GPE
Countries, cities, states


$6 million
MONEY
Monetary values, including unit
```

**Output Explanation:**

* **Apple** → `ORG` → Companies, agencies, institutions, etc.
* **Hong Kong** → `GPE` → Countries, cities, states
* **\$6 million** → `MONEY` → Monetary values, including unit

ה- SpaCy מזהה את הטוקנים האלה כישויות בשם ומשייכת לכל אחת תווית עם קטגוריה ספציפית

### Summary:

* spaCy first tokenizes the input text into individual components
* Then it scans for named entities using built-in models
* Each recognized entity includes:

  * The text span
  * A label like ORG, GPE, or MONEY
  * A short description (via `spacy.explain`)
