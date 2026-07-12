from django.contrib import admin
from .models import Driver, Expense, FuelLog, MaintenanceLog, Trip, User, Vehicle

for m in (User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense):
    admin.site.register(m)
