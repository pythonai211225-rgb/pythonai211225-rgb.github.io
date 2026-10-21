class MobilePhone:
    def __init__(self, color: str, model: str, brand: str, size: float,
                 is_on: bool = False, battery: int = 100):
        self.color = color
        self.model = model
        self.brand = brand
        self.size = size          # screen size in inches
        self.is_on = is_on
        self.battery = battery    # percent, 0-100

    def __str__(self):
        state = "on" if self.is_on else "off"
        return (f"{self.brand} {self.model} ({self.color}, {self.size}\") "
                f"- {state}, battery {self.battery}%")

    def add(self, x, y):
        return x + y

phone1 = MobilePhone("black", "Galaxy S24", "Samsung", 6.2, True, 85)
phone2 = MobilePhone("white", "iPhone 15", "Apple", 6.1)

print(phone1)
print(phone2)
print(phone1.color)
print(phone1.add(3, 4))
phone1.color = 'Orange'

# l2 = [1,2] + [3,4]  # __add__
# d = {'name': 'danny'}
# print(d['name'])  # __getitem__
# x = 5
# # x[1]  # NOT __getitem__