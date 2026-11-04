
# Using sentiment in LinearRegression

## Install textblob

```python
pip install textblob
```

## Full example

```python

# pip install textblob

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from textblob import TextBlob

# dataset with description + numeric features + label
df = pd.DataFrame([
    {"description":"Sunny and beautiful apartment near the beach",
     "bedrooms":2, "sqm":55, "price":5600},
    {"description":"Quiet and old apartment, needs renovation",
     "bedrooms":3, "sqm":75, "price":4200},
    {"description":"Luxury penthouse with amazing view",
     "bedrooms":4, "sqm":110, "price":12000},
    {"description":"Small dark apartment, no balcony",
     "bedrooms":1, "sqm":35, "price":3000},
    {"description":"Spacious modern apartment close to park",
     "bedrooms":3, "sqm":80, "price":7000},
])

# NLP feature: sentiment polarity from description (-1=negative, +1=positive)
df["sentiment"] = df["description"].map(lambda t: TextBlob(t).sentiment.polarity)

# features = numeric + sentiment
X = df[["bedrooms", "sqm", "sentiment"]]
y = df["price"]

# train / test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.4, random_state=42)

# train model
model = LinearRegression()
model.fit(X_train, y_train)

# evaluate
y_pred = model.predict(X_test)
print("MAE:", int(mean_absolute_error(y_test, y_pred)))
print("R² :", round(r2_score(y_test, y_pred), 3))

# predict on a new listing
new_listing = pd.DataFrame([{
    "bedrooms": 2,
    "sqm": 60,
    "description": "Bright and lovely apartment with great view"
}])

# add sentiment feature
new_listing["sentiment"] = new_listing["description"].map(lambda t: TextBlob(t).sentiment.polarity)

# only keep the feature columns
new_X = new_listing[["bedrooms", "sqm", "sentiment"]]

pred_price = model.predict(new_X)[0]
print("Predicted price:", int(pred_price), "ILS")
```

Output:
```
MAE: 2501
R² : -2.809
Predicted price: 6218 ILS
```
