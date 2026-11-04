# 💪 NLP Exercises with SpaCy

## 📌 Instructions

### 1\. Named Entities Extraction

**Task:**  
Given the sentence:

```python
"Taylor Swift performed in Los Angeles on March 3rd, 2023."
```

Print all named entities along with their labels.

Expected output:

```text
Taylor Swift PERSON
Los Angeles GPE
March 3rd, 2023 DATE
```

### 2\. Entity Classification

**Task:**  
Write a function that receives a sentence and prints only the entities of type `PERSON`.

Example input:

```python
"Serena Williams had dinner with Tom Hanks in Paris."
```

Expected output:

```text
Serena Williams
Tom Hanks
```

### 3\. Lemmatization

**Task:**  
Given the sentence:

```python
"She was running and had run 5 kilometers by 7am."
```

Print each word with its **lemma**.

Expected output (example):

```text
She        → she
was        → be
running    → run
...
```

### 4\. Stop Word Removal

**Task:**  
Write a function that receives a sentence and returns a list of words that are **not stop words**.

Example input:

```python
"This is an example sentence with some stop words."
```

Expected output:

```python
\['example', 'sentence', 'stop', 'words']
```

### 5\. Custom Stop Word

**Task:**  
Mark the word `"powerful"` as a stop word, then check if SpaCy treats it as such. Use the sentence below to check its behavior:

Example input:

```python
"SpaCy is awesome and powerful."
```

In this sentence, the following words should be considered stop words:

* is (already stop word)
* and (already stop word)
* powerful (after we add it)

### 6\. Phrase Matcher

**Task:**  
Use `PhraseMatcher` to identify the phrase `"artificial intelligence"` in a sentence and print matches.

Example input:

```python
"Artificial Intelligence is the future. I study artificial intelligence."
```

Expected output:

```text
Artificial Intelligence
artificial intelligence
```

### 7\. POS Tagging + Explanation

**Task:**  
Write a function that prints each word in a sentence with its POS tag and a human-readable explanation.

Example input:

```python
"The cat sat on the mat."
```

Expected output:

```text
The        DET        determiner
cat        NOUN       noun
sat        VERB       verb
...
```

### 8\. POS Tagging + Displacy Visualization

**Task:**  
Ask the user to input a sentence using `input()`, print each word with its POS tag, and then display it using `spacy.displacy.render`.

Example input:

```python
"Apple is looking at buying a U.K. startup for $1 billion."
```

Expected output:

```text
Apple      PROPN     proper noun
is         AUX       auxiliary
looking    VERB      verb
...
```



**Submission email**: [pythonai211225+nlphw@gmail.com](mailto:pythonai250824+nlphw@gmail.com)

