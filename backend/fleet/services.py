"""Business-rule engine. Server is the source of truth.

Every mandatory business rule from the problem statement lives here and is called
from the Trip / Maintenance viewset actions, wrapped in transaction.atomic() so
status flips are all-or-nothing.
"""
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from datetime import timedelta

from .models import Driver, MaintenanceLog, Trip, Vehicle


def get_expiring_licenses(days: int = 30):
    """Drivers whose license expires within `days` (including already expired).

    Reuses the same expiry notion as Rule #3 (dispatch eligibility). Returned
    ordered by soonest-expiring first so the UI banner and the email reminder
    command share one source of truth.
    """
    today = timezone.now().date()
    horizon = today + timedelta(days=days)
    return (
        Driver.objects.filter(license_expiry__lte=horizon)
        .exclude(status=Driver.Status.SUSPENDED)
        .order_by("license_expiry")
    )


def get_dispatch_options():
    """Vehicles/drivers eligible for a new trip.

    Rule #2: Retired / In Shop vehicles never appear.
    Rule #3: Expired-license or Suspended drivers never appear.
    Rule #4: Anything already On Trip never appears (implied by AVAILABLE filter).
    """
    vehicles = Vehicle.objects.filter(status=Vehicle.Status.AVAILABLE)
    drivers = Driver.objects.filter(
        status=Driver.Status.AVAILABLE,
        license_expiry__gt=timezone.now().date(),
    )
    return vehicles, drivers


def dispatch_trip(trip: Trip) -> Trip:
    v, d = trip.vehicle, trip.driver

    if trip.status != Trip.Status.DRAFT:
        raise ValidationError("Only draft trips can be dispatched.")
    if v.status != Vehicle.Status.AVAILABLE:                      # Rules #2, #4
        raise ValidationError("Vehicle not available (Retired / In Shop / On Trip).")
    if d.status != Driver.Status.AVAILABLE:                       # Rules #3, #4
        raise ValidationError("Driver not available (Suspended / Off Duty / On Trip).")
    if d.license_expiry <= timezone.now().date():                 # Rule #3
        raise ValidationError("Driver license has expired.")
    if trip.cargo_weight_kg > v.capacity_kg:                      # Rule #5
        raise ValidationError(
            f"Cargo {trip.cargo_weight_kg} kg exceeds vehicle capacity {v.capacity_kg} kg."
        )

    with transaction.atomic():                                    # Rule #6
        trip.status = Trip.Status.DISPATCHED
        trip.start_odometer = v.odometer
        trip.save()
        v.status = Vehicle.Status.ON_TRIP
        v.save()
        d.status = Driver.Status.ON_TRIP
        d.save()
    return trip


def complete_trip(trip: Trip, end_odometer: int, fuel_consumed: float) -> Trip:
    if trip.status != Trip.Status.DISPATCHED:
        raise ValidationError("Only dispatched trips can be completed.")
    v, d = trip.vehicle, trip.driver

    with transaction.atomic():                                    # Rule #7
        trip.status = Trip.Status.COMPLETED
        trip.end_odometer = end_odometer
        trip.fuel_consumed = fuel_consumed
        trip.save()
        v.odometer = end_odometer
        v.status = Vehicle.Status.AVAILABLE
        v.save()
        d.status = Driver.Status.AVAILABLE
        d.save()
        # auto-create a fuel log from the completion figures
        from .models import FuelLog
        FuelLog.objects.create(
            vehicle=v,
            liters=fuel_consumed,
            cost=int(fuel_consumed * 100),  # placeholder rate; real cost logged separately
        )
    return trip


def cancel_trip(trip: Trip) -> Trip:
    if trip.status not in (Trip.Status.DRAFT, Trip.Status.DISPATCHED):
        raise ValidationError("Only draft or dispatched trips can be cancelled.")
    v, d = trip.vehicle, trip.driver
    was_dispatched = trip.status == Trip.Status.DISPATCHED

    with transaction.atomic():                                    # Rule #8
        trip.status = Trip.Status.CANCELLED
        trip.save()
        if was_dispatched:
            v.status = Vehicle.Status.AVAILABLE
            v.save()
            d.status = Driver.Status.AVAILABLE
            d.save()
    return trip


def open_maintenance(vehicle: Vehicle, service: str, cost: int) -> MaintenanceLog:
    if vehicle.status == Vehicle.Status.ON_TRIP:
        raise ValidationError("Cannot service a vehicle that is currently On Trip.")
    with transaction.atomic():                                    # Rule #9
        log = MaintenanceLog.objects.create(
            vehicle=vehicle, service=service, cost=cost, status=MaintenanceLog.Status.ACTIVE
        )
        if vehicle.status != Vehicle.Status.RETIRED:
            vehicle.status = Vehicle.Status.IN_SHOP
            vehicle.save()
    return log


def close_maintenance(log: MaintenanceLog) -> MaintenanceLog:
    with transaction.atomic():                                    # Rule #10
        log.status = MaintenanceLog.Status.COMPLETED
        log.save()
        v = log.vehicle
        if v.status != Vehicle.Status.RETIRED:
            v.status = Vehicle.Status.AVAILABLE
            v.save()
    return log
