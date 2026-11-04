
# Using NER in LinearRegression

```python

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
import spacy

# 1) make df: description + other features + label
df = pd.DataFrame([
    {"description":"Sunny 2-room near the beach in Tel Aviv, renovated",
     "bedrooms":2, "sqm":55, "floor":2, "has_elevator":1, "price":5600},
    {"description":"Quiet 3-room apartment in Jerusalem near Old City",
     "bedrooms":3, "sqm":75, "floor":4, "has_elevator":1, "price":5200},
    {"description":"Haifa Carmel area, partial sea view, cozy and bright",
     "bedrooms":2, "sqm":62, "floor":1, "has_elevator":0, "price":4300},
    {"description":"North Tel Aviv family home, balcony, elevator",
     "bedrooms":4, "sqm":95, "floor":7, "has_elevator":1, "price":9900},
    {"description":"Ramat Gan center, walk to park, compact and modern",
     "bedrooms":2, "sqm":40, "floor":3, "has_elevator":1, "price":3900},
    {"description":"Herzliya Pituach, near beach and tech offices",
     "bedrooms":3, "sqm":80, "floor":5, "has_elevator":1, "price":8700},
    {"description":"Ground floor in Jerusalem, quiet street, close to market",
     "bedrooms":2, "sqm":50, "floor":0, "has_elevator":0, "price":4200},
    {"description":"Spacious Haifa apartment, parking, sea breeze",
     "bedrooms":3, "sqm":88, "floor":6, "has_elevator":1, "price":5600},
    {"description":"High floor in Bat Yam with sea view, steps from beach",
     "bedrooms":2, "sqm":60, "floor":9, "has_elevator":1, "price":5700},
    {"description":"Netanya center, beach promenade, big balcony, elevator",
     "bedrooms":4, "sqm":105, "floor":10, "has_elevator":1, "price":7600},
])

# load spaCy NER (no predefined city list)
nlp = spacy.load("en_core_web_sm")

# helper: first detected location (GPE) or "UNKNOWN"
def first_location(text: str) -> str:
    doc = nlp(text or "")
    for ent in doc.ents:
        if ent.label_ == "GPE":
            return ent.text.strip()
    return "UNKNOWN"

# 2) resolve all locations -> categorical -> one-hot
df_feat = df.copy()
df_feat["location"] = df_feat["description"].map(first_location)
loc_dummies = pd.get_dummies(df_feat["location"], prefix="loc")

# combine numeric features + location one-hots
num_cols = ["bedrooms", "sqm", "floor", "has_elevator"]
X = pd.concat([df_feat[num_cols], loc_dummies], axis=1)
y = df_feat["price"]

# remember training columns for later prediction alignment
feature_cols = X.columns.tolist()

# 3) train
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.33, random_state=42
)
model = LinearRegression()
model.fit(X_train, y_train)

# 4) test
y_pred = model.predict(X_test)
print("MAE:", int(mean_absolute_error(y_test, y_pred)))
print("R² :", round(r2_score(y_test, y_pred), 3))

# 5) predict on a new listing (with a location in the description)
new_listing = {
    "description": "Renovated 3-room near the beach in Tel Aviv with balcony",
    "bedrooms": 3, "sqm": 70, "floor": 5, "has_elevator": 1
}

new_loc = first_location(new_listing["description"])
new_loc_dummies = pd.get_dummies(pd.Series([new_loc]), prefix="loc")

new_row = pd.DataFrame([{
    "bedrooms": new_listing["bedrooms"],
    "sqm": new_listing["sqm"],
    "floor": new_listing["floor"],
    "has_elevator": new_listing["has_elevator"],
}])

new_X = pd.concat([new_row, new_loc_dummies], axis=1).reindex(columns=feature_cols, fill_value=0)

pred_price = model.predict(new_X)[0]
print("Detected location:", new_loc)
print("Predicted price:", int(pred_price), "ILS")
```

Output:
```
MAE: 1451
R² : -0.71
Detected location: Tel Aviv
Predicted price: 6334 ILS
```