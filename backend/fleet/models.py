from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        FLEET_MANAGER = "FLEET_MANAGER", "Fleet Manager"
        DISPATCHER = "DISPATCHER", "Dispatcher"
        SAFETY_OFFICER = "SAFETY_OFFICER", "Safety Officer"
        FINANCIAL_ANALYST = "FINANCIAL_ANALYST", "Financial Analyst"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.DISPATCHER)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    @property
    def name(self):
        return self.get_full_name() or self.username


class Vehicle(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        ON_TRIP = "ON_TRIP", "On Trip"
        IN_SHOP = "IN_SHOP", "In Shop"
        RETIRED = "RETIRED", "Retired"

    reg_no = models.CharField(max_length=32, unique=True)          # Business Rule #1
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=32)                        # Van / Truck / Mini
    capacity_kg = models.IntegerField()
    odometer = models.IntegerField(default=0)
    acquisition_cost = models.IntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.AVAILABLE)

    def __str__(self):
        return f"{self.reg_no} ({self.name})"


class Driver(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        ON_TRIP = "ON_TRIP", "On Trip"
        OFF_DUTY = "OFF_DUTY", "Off Duty"
        SUSPENDED = "SUSPENDED", "Suspended"

    name = models.CharField(max_length=120)
    license_no = models.CharField(max_length=32, unique=True)
    license_cat = models.CharField(max_length=16)                 # LMV / HMV
    license_expiry = models.DateField()
    contact = models.CharField(max_length=32)
    safety_score = models.IntegerField(default=100)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.AVAILABLE)

    def __str__(self):
        return f"{self.name} ({self.license_no})"


class Trip(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        DISPATCHED = "DISPATCHED", "Dispatched"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    source = models.CharField(max_length=120)
    destination = models.CharField(max_length=120)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name="trips")
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, related_name="trips")
    cargo_weight_kg = models.IntegerField()
    planned_distance = models.IntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    start_odometer = models.IntegerField(null=True, blank=True)
    end_odometer = models.IntegerField(null=True, blank=True)
    fuel_consumed = models.FloatField(null=True, blank=True)
    revenue = models.IntegerField(null=True, blank=True)          # for ROI
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TRIP-{self.id} {self.source} -> {self.destination}"


class MaintenanceLog(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="maintenance")
    service = models.CharField(max_length=120)
    cost = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)


class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="fuel_logs")
    liters = models.FloatField()
    cost = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)


class Expense(models.Model):
    trip = models.ForeignKey(Trip, null=True, blank=True, on_delete=models.SET_NULL, related_name="expenses")
    type = models.CharField(max_length=32)                        # TOLL / MISC / MAINTENANCE
    amount = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
