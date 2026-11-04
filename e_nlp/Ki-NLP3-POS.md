
# Using POS adjactives in LinearRegression

### MultiLabelBinarizer

```python
from sklearn.preprocessing import MultiLabelBinarizer

data = [
    {"adjectives": {"sunny", "renovated"}},
    {"adjectives": {"quiet", "old"}},
    {"adjectives": {"luxury", "modern", "amazing"}},
]

mlb = MultiLabelBinarizer()
encoded = mlb.fit_transform([row["adjectives"] for row in data])

print("Classes:", mlb.classes_)
print(encoded)
```

Output:
```
Classes: ['amazing' 'luxury' 'modern' 'old' 'quiet' 'renovated' 'sunny']
[[0 0 0 0 0 1 1]
 [0 0 0 1 1 0 0]
 [1 1 1 0 0 0 0]]
```

## Full example

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
import spacy

# -------------------------
# 1) data: description + numeric features + price
# -------------------------
df = pd.DataFrame([
    {"description":"Sunny spacious renovated apartment near the beach", "bedrooms":2, "sqm":55,  "price":5600},
    {"description":"Quiet old apartment, needs full renovation",        "bedrooms":3, "sqm":75,  "price":4200},
    {"description":"Luxury modern penthouse with amazing view",         "bedrooms":4, "sqm":110, "price":12000},
    {"description":"Small dark flat without balcony",                   "bedrooms":1, "sqm":35,  "price":3000},
    {"description":"Bright elegant apartment close to green park",      "bedrooms":3, "sqm":80,  "price":7000},
])

# -------------------------
# 2) NLP: extract adjectives with spaCy, then 1-hot encode each adjective
# -------------------------
nlp = spacy.load("en_core_web_sm", disable=["ner"])

def extract_adjectives(text: str):
    """Return a set of adjective lemmas in lowercase (alphabetic only)."""
    doc = nlp(text or "")
    return {t.lemma_.lower() for t in doc if t.pos_ == "ADJ" and t.is_alpha}

# get set of adjectives per row
df["adjectives"] = df["description"].apply(extract_adjectives)

# one-hot encode adjectives (each adjective -> its own column)
mlb = MultiLabelBinarizer()
adj_ohe = pd.DataFrame(
    mlb.fit_transform(df["adjectives"]),
    columns=[f"adj__{a}" for a in mlb.classes_],
    index=df.index
)

# build final feature matrix: numeric + adjective one-hots
num_cols = ["bedrooms", "sqm"]
X = pd.concat([df[num_cols], adj_ohe], axis=1)
y = df["price"]

# -------------------------
# 3) train
# -------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.4, random_state=42
)
model = LinearRegression().fit(X_train, y_train)

# -------------------------
# 4) test (evaluate)
# -------------------------
y_pred = model.predict(X_test)
print("MAE:", int(mean_absolute_error(y_test, y_pred)))
print("R² :", round(r2_score(y_test, y_pred), 3))

# -------------------------
# 5) predict on a new listing
# -------------------------
new = pd.DataFrame([{
    "description": "Gorgeous bright renovated apartment with beautiful sea view",
    "bedrooms": 3,
    "sqm": 78
}])

# extract adjectives and 1-hot with SAME columns
new["adjectives"] = new["description"].apply(extract_adjectives)
new_adj = pd.DataFrame(
    mlb.transform(new["adjectives"]),  # unseen adjectives are ignored (all zeros)
    columns=[f"adj__{a}" for a in mlb.classes_],
    index=new.index
)

new_X = pd.concat([new[num_cols], new_adj], axis=1)

print("Adjectives found:", new.loc[0, "adjectives"])
print("Predicted price:", int(model.predict(new_X)[0]), "ILS")

new = pd.DataFrame([{
    "description": "Spacious bright renovated apartment with sunny balcony",
    "bedrooms": 3,
    "sqm": 78
}])

# extract adjectives
new["adjectives"] = new["description"].apply(extract_adjectives)

# one-hot encode with same mlb (no warnings this time!)
new_adj = pd.DataFrame(
    mlb.transform(new["adjectives"]),
    columns=[f"adj__{a}" for a in mlb.classes_],
    index=new.index
)

new_X = pd.concat([new[num_cols], new_adj], axis=1)

print("Adjectives found:", new.loc[0, "adjectives"])
print("Predicted price:", int(model.predict(new_X)[0]), "ILS")
```

Output:

```
MAE: 2555
R² : -2.954
Adjectives found: {'beautiful', 'gorgeous', 'bright'}
Predicted price: 8214 ILS
Adjectives found: {'spacious', 'sunny', 'bright'}
Predicted price: 8296 ILS
```