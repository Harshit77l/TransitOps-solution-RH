from rest_framework import serializers

from .models import Driver, Expense, FuelLog, MaintenanceLog, Trip, User, Vehicle


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "email", "role"]


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = "__all__"


class TripSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(source="vehicle.reg_no", read_only=True)
    driver_name = serializers.CharField(source="driver.name", read_only=True)

    class Meta:
        model = Trip
        fields = "__all__"
        read_only_fields = ["status", "start_odometer", "end_odometer", "fuel_consumed", "created_at"]


class MaintenanceLogSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(source="vehicle.reg_no", read_only=True)

    class Meta:
        model = MaintenanceLog
        fields = "__all__"
        read_only_fields = ["status", "date"]


class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(source="vehicle.reg_no", read_only=True)

    class Meta:
        model = FuelLog
        fields = "__all__"
        read_only_fields = ["date"]


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = ["date"]
