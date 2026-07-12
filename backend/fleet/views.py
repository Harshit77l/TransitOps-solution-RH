import csv
import io

from django.db.models import Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from . import services
from .models import Driver, Expense, FuelLog, MaintenanceLog, Trip, Vehicle, VehicleDocument
from .permissions import (
    DriverPermission,
    FinancePermission,
    MaintenancePermission,
    TripPermission,
    VehicleDocumentPermission,
    VehiclePermission,
)
from .serializers import (
    DriverSerializer,
    ExpenseSerializer,
    FuelLogSerializer,
    MaintenanceLogSerializer,
    TripSerializer,
    UserSerializer,
    VehicleDocumentSerializer,
    VehicleSerializer,
)


# ---------- Auth ----------
class RoleTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {"id": self.user.id, "name": self.user.name, "role": self.user.role}
        return data


class LoginView(TokenObtainPairView):
    serializer_class = RoleTokenSerializer
    permission_classes = [AllowAny]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ---------- Vehicles (CRUD + search/filter/sort bonus) ----------
class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [VehiclePermission]

    def get_queryset(self):
        qs = Vehicle.objects.all().order_by("reg_no")
        p = self.request.query_params
        if p.get("type"):
            qs = qs.filter(type__iexact=p["type"])
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("search"):
            s = p["search"]
            qs = qs.filter(Q(reg_no__icontains=s) | Q(name__icontains=s))
        if p.get("ordering"):
            qs = qs.order_by(p["ordering"])
        return qs


# ---------- Vehicle Documents (document management bonus) ----------
class VehicleDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleDocumentSerializer
    permission_classes = [VehicleDocumentPermission]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = VehicleDocument.objects.select_related("vehicle").order_by("-uploaded_at")
        vehicle = self.request.query_params.get("vehicle")
        if vehicle:
            qs = qs.filter(vehicle_id=vehicle)
        return qs


# ---------- Drivers ----------
class DriverViewSet(viewsets.ModelViewSet):
    serializer_class = DriverSerializer
    permission_classes = [DriverPermission]

    def get_queryset(self):
        qs = Driver.objects.all().order_by("name")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("search"):
            s = p["search"]
            qs = qs.filter(Q(name__icontains=s) | Q(license_no__icontains=s))
        if p.get("ordering"):
            qs = qs.order_by(p["ordering"])
        return qs

    @action(detail=False, methods=["get"])
    def expiring(self, request):
        """Drivers with licenses expiring within ?days (default 30)."""
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            days = 30
        drivers = services.get_expiring_licenses(days)
        return Response({
            "days": days,
            "count": drivers.count(),
            "drivers": DriverSerializer(drivers, many=True).data,
        })


# ---------- Trips + transitions ----------
class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [TripPermission]

    def get_queryset(self):
        qs = Trip.objects.select_related("vehicle", "driver").order_by("-created_at")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("search"):
            s = p["search"]
            qs = qs.filter(Q(source__icontains=s) | Q(destination__icontains=s))
        return qs

    @action(detail=False, methods=["get"])
    def dispatch_options(self, request):
        vehicles, drivers = services.get_dispatch_options()
        return Response({
            "vehicles": VehicleSerializer(vehicles, many=True).data,
            "drivers": DriverSerializer(drivers, many=True).data,
        })

    @action(detail=True, methods=["post"], url_path="dispatch")
    def dispatch_trip(self, request, pk=None):
        trip = services.dispatch_trip(self.get_object())
        return Response(TripSerializer(trip).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        end_odometer = request.data.get("end_odometer")
        fuel_consumed = request.data.get("fuel_consumed")
        if end_odometer is None or fuel_consumed is None:
            return Response(
                {"detail": "end_odometer and fuel_consumed are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        trip = services.complete_trip(self.get_object(), int(end_odometer), float(fuel_consumed))
        return Response(TripSerializer(trip).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        trip = services.cancel_trip(self.get_object())
        return Response(TripSerializer(trip).data)


# ---------- Maintenance ----------
class MaintenanceViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceLogSerializer
    permission_classes = [MaintenancePermission]
    queryset = MaintenanceLog.objects.select_related("vehicle").order_by("-date")

    def create(self, request, *args, **kwargs):
        vehicle = Vehicle.objects.get(pk=request.data["vehicle"])
        log = services.open_maintenance(
            vehicle, request.data["service"], int(request.data["cost"])
        )
        return Response(MaintenanceLogSerializer(log).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        log = services.close_maintenance(self.get_object())
        return Response(MaintenanceLogSerializer(log).data)


# ---------- Fuel & Expense ----------
class FuelLogViewSet(viewsets.ModelViewSet):
    serializer_class = FuelLogSerializer
    permission_classes = [FinancePermission]
    queryset = FuelLog.objects.select_related("vehicle").order_by("-date")


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [FinancePermission]
    queryset = Expense.objects.all().order_by("-date")


# ---------- Dashboard ----------
class DashboardView(APIView):
    def get(self, request):
        vehicles = Vehicle.objects.all()
        total = vehicles.count()
        on_trip = vehicles.filter(status=Vehicle.Status.ON_TRIP).count()
        return Response({
            "activeVehicles": vehicles.exclude(status=Vehicle.Status.RETIRED).count(),
            "availableVehicles": vehicles.filter(status=Vehicle.Status.AVAILABLE).count(),
            "inMaintenance": vehicles.filter(status=Vehicle.Status.IN_SHOP).count(),
            "activeTrips": Trip.objects.filter(status=Trip.Status.DISPATCHED).count(),
            "pendingTrips": Trip.objects.filter(status=Trip.Status.DRAFT).count(),
            "driversOnDuty": Driver.objects.filter(status=Driver.Status.ON_TRIP).count(),
            "fleetUtilization": round((on_trip / total * 100) if total else 0, 1),
            "vehicleStatusBreakdown": {
                "available": vehicles.filter(status=Vehicle.Status.AVAILABLE).count(),
                "onTrip": on_trip,
                "inShop": vehicles.filter(status=Vehicle.Status.IN_SHOP).count(),
                "retired": vehicles.filter(status=Vehicle.Status.RETIRED).count(),
            },
            "recentTrips": TripSerializer(
                Trip.objects.select_related("vehicle", "driver").order_by("-created_at")[:6],
                many=True,
            ).data,
        })


# ---------- Analytics ----------
def _analytics_payload():
    completed = Trip.objects.filter(status=Trip.Status.COMPLETED)
    total_distance = sum((t.planned_distance or 0) for t in completed)
    total_fuel = sum((t.fuel_consumed or 0) for t in completed) or 0
    fuel_cost = FuelLog.objects.aggregate(s=Sum("cost"))["s"] or 0
    maint_cost = MaintenanceLog.objects.aggregate(s=Sum("cost"))["s"] or 0
    op_cost = fuel_cost + maint_cost
    revenue = sum((t.revenue or 0) for t in completed)
    acq = Vehicle.objects.aggregate(s=Sum("acquisition_cost"))["s"] or 0
    roi = round(((revenue - op_cost) / acq * 100), 1) if acq else 0

    vehicles = Vehicle.objects.all()
    total = vehicles.count()
    on_trip = vehicles.filter(status=Vehicle.Status.ON_TRIP).count()

    top_costly = []
    for v in vehicles:
        vf = v.fuel_logs.aggregate(s=Sum("cost"))["s"] or 0
        vm = v.maintenance.aggregate(s=Sum("cost"))["s"] or 0
        top_costly.append({"vehicle": v.reg_no, "cost": vf + vm})
    top_costly.sort(key=lambda x: x["cost"], reverse=True)

    return {
        "fuelEfficiency": round((total_distance / total_fuel), 2) if total_fuel else 0,
        "fleetUtilization": round((on_trip / total * 100) if total else 0, 1),
        "operationalCost": op_cost,
        "vehicleRoi": roi,
        "topCostly": top_costly[:5],
    }


class AnalyticsView(APIView):
    def get(self, request):
        return Response(_analytics_payload())


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_export(request):
    """CSV export bonus."""
    resp = HttpResponse(content_type="text/csv")
    resp["Content-Disposition"] = 'attachment; filename="transitops_analytics.csv"'
    w = csv.writer(resp)
    data = _analytics_payload()
    w.writerow(["Metric", "Value"])
    w.writerow(["Fuel Efficiency (km/l)", data["fuelEfficiency"]])
    w.writerow(["Fleet Utilization (%)", data["fleetUtilization"]])
    w.writerow(["Operational Cost", data["operationalCost"]])
    w.writerow(["Vehicle ROI (%)", data["vehicleRoi"]])
    w.writerow([])
    w.writerow(["Vehicle", "Total Cost"])
    for row in data["topCostly"]:
        w.writerow([row["vehicle"], row["cost"]])
    return resp


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_export_pdf(request):
    """PDF export bonus (ReportLab — no system libs, keeps the hackathon light)."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    )

    data = _analytics_payload()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    brand = colors.HexColor("#e0951a")
    elems = [
        Paragraph("TransitOps — Reports & Analytics", styles["Title"]),
        Paragraph(
            timezone.now().strftime("Generated %Y-%m-%d %H:%M UTC"),
            styles["Normal"],
        ),
        Spacer(1, 0.6 * cm),
    ]

    kpi_rows = [
        ["Metric", "Value"],
        ["Fuel Efficiency (km/l)", str(data["fuelEfficiency"])],
        ["Fleet Utilization (%)", str(data["fleetUtilization"])],
        ["Operational Cost", f"{data['operationalCost']:,}"],
        ["Vehicle ROI (%)", str(data["vehicleRoi"])],
    ]
    kpi_table = Table(kpi_rows, colWidths=[8 * cm, 8 * cm])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), brand),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#faf6ef")]),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elems += [kpi_table, Spacer(1, 0.8 * cm)]

    elems.append(Paragraph("Top Costliest Vehicles", styles["Heading2"]))
    elems.append(Paragraph(
        "ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost", styles["Italic"]
    ))
    elems.append(Spacer(1, 0.3 * cm))
    cost_rows = [["Vehicle", "Total Cost"]] + [
        [row["vehicle"], f"{row['cost']:,}"] for row in data["topCostly"]
    ] or [["Vehicle", "Total Cost"], ["—", "—"]]
    cost_table = Table(cost_rows, colWidths=[8 * cm, 8 * cm])
    cost_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#333333")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elems.append(cost_table)

    doc.build(elems)
    buf.seek(0)
    resp = HttpResponse(buf.getvalue(), content_type="application/pdf")
    resp["Content-Disposition"] = 'attachment; filename="transitops_analytics.pdf"'
    return resp
