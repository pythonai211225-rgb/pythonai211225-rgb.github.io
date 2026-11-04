# ניתוח טקסט עם SpaCy – פונקציונליות בסיסית המשך

### ה- Stop Words – מילות עצירה

מילות עצירה הן מילים נפוצות בשפה שאין להן תרומה משמעותית להבנת התוכן המרכזי בטקסט
דוגמאות: the, is, and, in, to, etc

מילים אלו מוסרות בדרך כלל לפני ניתוח טקסט כמו ניתוח רגשות או חיפוש מסמכים

#### למה מסירים אותן

כאשר אנו מסירים מילות עצירה (כמו: the, is, and, in) מהטקסט, אנו משפרים את יעילות ואיכות העיבוד הלשוני בכמה דרכים עיקריות:

#### \* הסרתן מפחיתה את מספר הטוקנים

כאשר מסירים מילים חסרות משמעות תחבירית, מתקבל טקסט קצר יותר עם פחות טוקנים

**דוגמה:**

```text
Before: I am going to the store and I will buy some milk
After: going store buy milk
```

במקום 11 טוקנים – נשארים עם 4 בלבד

#### \* הסרתן מחדדת את התוכן המרכזי

כאשר מוחקים מילים שכיחות שלא מוסיפות מידע מהותי, נשארים רק המילים החשובות והייחודיות של המסמך

**דוגמה:**

```text
Original: The new phone is really fast and very efficient
After: new phone fast efficient
```

זה מדגיש בדיוק את התכונות החשובות של המכשיר

#### \* הסרתן מייעלת את תהליך הלמידה או הניתוח

באלגוריתמים של למידת מכונה או בניתוח טקסט – פחות טוקנים משמעו פחות תכונות (features) לבחינה, מה שמוביל לאימון מהיר יותר ומודלים פשוטים יותר

**דוגמה:**
אם מסמך מכיל 1,000 מילים ורק 400 מהן אינפורמטיביות, מודל שיוסמך על 400 תכונות יפעל מהר יותר ויבין טוב יותר את ההקשר האמיתי

### סיכום

הסרת מילות עצירה היא צעד חשוב בתהליך קדם-עיבוד של טקסט, שמוביל לדיוק, פשטות ויעילות גבוהה יותר


#### דוגמה:

```python
from spacy.lang.en.stop_words import STOP_WORDS
print("to" in STOP_WORDS)  # True
```

ניתן גם להוסיף או להסיר מילות עצירה בהתאמה אישית:

```python
nlp.vocab["awesome"].is_stop = True
nlp.vocab["the"].is_stop = False
```

ב־spaCy ניתן לגשת לרשימת מילות העצירה (stop words) ברירת המחדל, לבדוק אם מילה מסוימת נחשבת מילת עצירה, ולהוסיף מילות עצירה חדשות בהתאמה אישית

#### הדפסת רשימת מילות העצירה של spaCy:

```python
import spacy
from spacy.lang.en.stop_words import STOP_WORDS

nlp = spacy.load("en_core_web_sm")
print(nlp.Defaults.stop_words)
```

Output:

```
{"'ve", 'everything', 'whence', "'ll", 'this', 'to', 'mostly', 'three', 'too', 'four', 'front', 'nor', 'beyond', 
  '‘ll', 'his', 'empty', 'n’t', 'done', 'using', 'nine', 'before', 'namely', 'cannot', 'whom', 'below', 'hers', 
  'itself', "'m", 'quite', 'which', 'sixty', '‘ve', "'s", 'several', 'unless', 'every', '’ll', 'and', 'show', 
  'none', 'i', 'move', 'was', 'were', 'there', 'much', 'my', 'go', 'bottom', 'of', 'same', 'someone', 'became',
   'nothing', 'he', 'name', "'d", 'nowhere', 'except', 're', 'herein', 'whenever', 'so', 'besides', 'them'...}
```

#### בדיקה האם מילה מסוימת היא stop word:

```python
print(nlp.vocab['myself'].is_stop)    # True
print(nlp.vocab['mystery'].is_stop)   # False
```

> משמש כדי לבדוק אם מילה מסוימת מזוהה כברירת מחדל כמילת עצירה

#### הוספת מילת עצירה חדשה באופן ידני:

```python
nlp.Defaults.stop_words.add('btw')
nlp.vocab['btw'].is_stop = True

print(nlp.vocab['btw'].is_stop)  # True
```

> שים לב: יש להשתמש באותיות קטנות בלבד בעת הוספה לרשימה
> אנו מסמנים את המילה כ־stop word על ידי הגדרת `is_stop = True`

### סיכום:

* ניתן להדפיס את כל מילות העצירה המובנות ב־spaCy
* ניתן לבדוק האם מילה היא stop word קיימת
* ניתן להוסיף מילות עצירה חדשות לפי הצורך

בדומה להוספה של מילת עצירה לרשימת ברירת המחדל, ניתן גם **להסיר מילת עצירה קיימת** אם נרצה שהיא תיחשב כחלק מהתוכן המשמעותי

#### דוגמה להסרת stop word:

```python
nlp.Defaults.stop_words.remove('beyond')
nlp.vocab['beyond'].is_stop = False

print(nlp.vocab['beyond'].is_stop)  # False
```

### הסבר:

* השורה הראשונה מסירה את המילה `'beyond'` מהסט של מילות העצירה
* לאחר מכן אנו מציינים במפורש שהמילה אינה עוד stop word על ידי הגדרת `is_stop = False`
* אפשר לבדוק את הסטטוס עם `nlp.vocab['beyond'].is_stop`

התוצאה: spaCy לא תתייחס יותר ל־`beyond` כמילת עצירה

ברגע ש־`beyond` אינה נחשבת עוד stop word, spaCy תתייחס אליה כאל מילת תוכן רגילה:

* היא תיכלל בניתוח מילות מפתח או תדירות מילים
* היא תישאר כחלק מהטקסט גם כשמנקים מילות עצירה
* היא תוכל לשמש כ־feature באימון של מודלים בלמידת מכונה

כך אפשר לוודא שמילים חשובות לנו לא יוסרו בטעות בתהליכי קדם־עיבוד

---

### ה- Phrase Matching ב־ spaCy

ה- Phrase Matching הוא תהליך שמטרתו לזהות ביטויים (צירופים של מילים) שמופיעים בטקסט
זהו כלי שימושי ב־NLP לזיהוי שמות, מונחים, תאריכים, קטגוריות ועוד

ב־spaCy משתמשים במחלקה `PhraseMatcher` שמבוססת על המודל והטוקניזציה הפנימית שלו

### למה זה חשוב

* מאפשר לזהות ביטויים קבועים או מונחים מתוך רשימה
* מייעל תהליכי חיפוש, סיווג טקסטים, שליפת מידע
* תומך בהתאמות עם רגישות למבנה תחבירי או פיסוק

### שלבי עבודה בסיסיים:

```python
from spacy.matcher import PhraseMatcher
matcher = PhraseMatcher(nlp.vocab)

patterns = [nlp("Solar Power"), nlp("solarpower"), nlp("solar-power")]
matcher.add("SOLARPOWER", patterns)

doc = nlp("This building uses Solar-Power and solarpower systems")
matches = matcher(doc)

for match_id, start, end in matches:
    print(doc[start:end].text)
```

#### פלט:

```
Solar-Power
solarpower
```

### מה קורה בפועל

* אנו מוסיפים למתאם (`matcher`) שלוש וריאציות של אותו ביטוי
* spaCy מזהה את כולן במשפט למרות ההבדלים במבנה (רווח, מקף, יחד)

### התאמה מתקדמת עם הקשרים תחביריים

```python
# Removing the previous matcher to avoid duplicates
matcher.remove("SOLARPOWER")

# Redefining with advanced patterns
patterns = [
    nlp("solarpower"),
    nlp("solar power"),
    nlp("solar-power"),
    nlp("solar--power"),
    nlp("solar.power"),
    nlp("solar_powered")
]
matcher.add("SOLARPOWER", patterns)

doc = nlp("The company installs solar-powered and SolarPower panels")

matches = matcher(doc)
for match_id, start, end in matches:
    print(doc[start:end].text)
```

#### פלט:

```
solar-powered
SolarPower
```

### סיכום:

* ה- PhraseMatcher של spaCy מאפשר לזהות ביטויים בטקסט באופן מהיר וגמיש
* ניתן להוסיף תבניות פשוטות או מורכבות לפי הצורך
* חשוב להסיר מתאמים קודמים לפני הוספת תבניות חדשות באותו שם
* מתאים מאוד לזיהוי מונחים ומילים רלוונטיות בטקסט אמיתי