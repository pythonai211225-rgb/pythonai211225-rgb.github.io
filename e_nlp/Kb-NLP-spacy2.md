## התקנת spaCy

### שלבים

### פתח את ה- Jupyter

<img src="images/nlp12.png" style="width: 50%" />

### יצירת סביבה חדשה של פייתון

```python
!conda create -n spacy_env python=3.11 -y
```

Output:

<img src="images/nlp4.jpg" style="width: 50%" />
 
### התקנת חבילת ipykernel חדש
```python
!conda install -n spacy_env ipykernel -y
```

Output:

<img src="images/nlp5.jpg" style="width: 50%" />

```python
!python -m ipykernel install --user --name spacy_env --display-name "Python (spacy_env)"
```

Output:

<img src="images/nlp6.png" style="width: 75%" />

🔹 זה יוצר סביבת עבודה חדשה בשם spacy_env – אבל עדיין לא פועלת

🔹 זה אומר ליופיטר: "היי, יש לי סביבת קוד חדשה, תוכל להוסיף אותה לרשימת הקרנלים שלך"

🔹 עדיין לא צריך לעבור אליה – אנחנו רק רושמים אותה כמוכנה


### מעבר לקרנל החדש

<img src="images/nlp8.png" style="width: 75%" />

#### Install spaCy  

```python
!pip install spacy
```

Output:

<img src="images/nlp7.jpg" style="width: 60%" />

###  הורדת מודל שפה באנגלית

🔹 עכשיו אתה מוריד את מודל השפה לתוך הסביבה שבה תעבוד

```python
!python -m spacy download en_core_web_sm
```

Output:

<img src="images/nlp9.jpg" style="width: 70%" />

```python
!python -m spacy validate
```

Output:

<img src="images/nlp10.jpg" style="width: 70%" />

💡 לעבור לסביבה החדשה דרך Kernel → Change kernel

## מודל שפה `en_core_web_sm`

* `en` – אנגלית  
* `core` – שימוש כללי  
* `web` – דאטה מהאינטרנט  
* `sm` – גרסה קלה ומהירה

## דוגמת קוד ראשונית

```python
import spacy
nlp = spacy.load("en_core_web_sm")

# The model response is a SpaCy Doc object
doc = nlp("Apple is looking at buying U.K. startup for $1 billion")

for token in doc:
    print(token.text, token.pos_, token.dep_)
```

Output:

<img src="images/nlp11.jpg" style="width: 60%" />

הסבר בעמוד הבא...