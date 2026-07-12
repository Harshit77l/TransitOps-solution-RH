from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("vehicles", views.VehicleViewSet, basename="vehicle")
router.register("drivers", views.DriverViewSet, basename="driver")
router.register("trips", views.TripViewSet, basename="trip")
router.register("maintenance", views.MaintenanceViewSet, basename="maintenance")
router.register("fuel", views.FuelLogViewSet, basename="fuel")
router.register("expenses", views.ExpenseViewSet, basename="expense")

urlpatterns = [
    path("auth/login/", views.LoginView.as_view()),
    path("auth/me/", views.me),
    path("dashboard/kpis/", views.DashboardView.as_view()),
    path("analytics/", views.AnalyticsView.as_view()),
    path("analytics/export/", views.analytics_export),
    path("", include(router.urls)),
]
