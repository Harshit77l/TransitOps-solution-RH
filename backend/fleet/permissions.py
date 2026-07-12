from rest_framework.permissions import SAFE_METHODS, BasePermission


class RolePermission(BasePermission):
    """Everyone authenticated can read; writes are gated by role.

    Subclass and set `allowed` to the set of roles permitted to write.
    """
    allowed: set = set()

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in self.allowed


class VehiclePermission(RolePermission):
    allowed = {"FLEET_MANAGER"}


class DriverPermission(RolePermission):
    allowed = {"FLEET_MANAGER", "SAFETY_OFFICER"}


class TripPermission(RolePermission):
    allowed = {"DISPATCHER"}


class MaintenancePermission(RolePermission):
    allowed = {"FLEET_MANAGER"}


class FinancePermission(RolePermission):
    allowed = {"FINANCIAL_ANALYST", "FLEET_MANAGER"}
