from datetime import date

from django.core.management.base import BaseCommand

from fleet.models import (
    Driver,
    Expense,
    FuelLog,
    MaintenanceLog,
    Trip,
    User,
    Vehicle,
)


class Command(BaseCommand):
    help = "Seed demo users, vehicles, and drivers matching the mockup."

    def handle(self, *args, **opts):
        # Clear dependent rows first so re-seeding is idempotent
        # (Trip protects Vehicle/Driver via FK).
        Expense.objects.all().delete()
        FuelLog.objects.all().delete()
        MaintenanceLog.objects.all().delete()
        Trip.objects.all().delete()
        User.objects.all().delete()
        Vehicle.objects.all().delete()
        Driver.objects.all().delete()

        users = [
            ("manager@transitops.in", "Fleet Manager", "FLEET_MANAGER"),
            ("dispatch@transitops.in", "Raven K.", "DISPATCHER"),
            ("safety@transitops.in", "Safety Officer", "SAFETY_OFFICER"),
            ("finance@transitops.in", "Financial Analyst", "FINANCIAL_ANALYST"),
        ]
        for email, name, role in users:
            u = User(username=email, email=email, role=role, first_name=name)
            u.set_password("password123")
            u.save()
        self.stdout.write(self.style.SUCCESS(f"Created {len(users)} users (password: password123)"))

        vehicles = [
            ("GJ01AB4521", "Van-05", "Van", 500, 74000, 620000, "AVAILABLE"),
            ("GJ01AB4481", "Truck-11", "Truck", 5000, 182000, 2450000, "ON_TRIP"),
            ("GJ01AB1120", "Mini-03", "Mini", 1000, 66000, 410000, "IN_SHOP"),
            ("GJ01AB0087", "Van-09", "Van", 750, 241400, 540000, "RETIRED"),
            ("GJ01AB7788", "Truck-04", "Truck", 8000, 95000, 3100000, "AVAILABLE"),
        ]
        for reg, name, typ, cap, odo, cost, st in vehicles:
            Vehicle.objects.create(
                reg_no=reg, name=name, type=typ, capacity_kg=cap,
                odometer=odo, acquisition_cost=cost, status=st,
            )
        self.stdout.write(self.style.SUCCESS(f"Created {len(vehicles)} vehicles"))

        drivers = [
            ("Alex", "DL-88213", "LMV", date(2028, 12, 1), "98765xxxxx", 96, "AVAILABLE"),
            ("John", "DL-44120", "HMV", date(2025, 3, 1), "98220xxxxx", 81, "SUSPENDED"),
            ("Priya", "DL-77031", "LMV", date(2027, 8, 1), "99810xxxxx", 99, "ON_TRIP"),
            ("Suresh", "DL-90045", "HMV", date(2027, 1, 1), "97400xxxxx", 88, "OFF_DUTY"),
        ]
        for name, lic, cat, exp, contact, score, st in drivers:
            Driver.objects.create(
                name=name, license_no=lic, license_cat=cat, license_expiry=exp,
                contact=contact, safety_score=score, status=st,
            )
        self.stdout.write(self.style.SUCCESS(f"Created {len(drivers)} drivers"))
        self.stdout.write(self.style.SUCCESS("Seed complete."))
