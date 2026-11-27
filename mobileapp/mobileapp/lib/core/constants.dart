// ─── App Constants ────────────────────────────────────────────────────────────

class AppConstants {
  static const String appName = 'AquaCatch';
  static const String appTagline = 'FishTrade ERP';
  static const String appDescription =
      'Fish Procurement, Inventory, Distribution & Financial Management';
  static const String companyName = 'Mwanza Fish Trading Co. Ltd';
  static const String storageKey = 'aquacatch.v1';
  static const String hiveBoxName = 'aquacatch_data';
  static const String sessionKey = 'session';

  /// Backend API base URL.
  /// - Android Emulator: use 10.0.2.2 (maps to host localhost)
  /// - Physical device on same Wi-Fi: use the PC's LAN IP (e.g. 192.168.x.x)
  /// - Production: use your deployed server URL
  static const String apiBaseUrl = 'http://10.0.2.2:8000';
}

class FishSpecies {
  static const List<String> all = [
    'Nile Perch',
    'Tilapia',
    'Dagaa (Sardines)',
    'Catfish',
  ];

  static const Map<String, int> defaultPrices = {
    'Nile Perch': 8000,
    'Tilapia': 5200,
    'Dagaa (Sardines)': 2600,
    'Catfish': 4500,
  };

  static const Map<String, String> emoji = {
    'Nile Perch': '🐟',
    'Tilapia': '🐠',
    'Dagaa (Sardines)': '🐡',
    'Catfish': '🦈',
  };
}

class LandingSites {
  static const List<String> all = [
    'Mwanza (Kirumba Mwaloni)',
    'Kigoma (Katonga BMU)',
    'Musoma (Mwigobero)',
    'Ukerewe (Nansio)',
    'Bukoba (Kemondo)',
  ];
}

class ColdRooms {
  static const List<String> all = [
    'Main Cold Room (0°C to 2°C)',
    'Landing Holding Chiller',
    'Blast Freezer (-18°C)',
  ];
}

class FishGrades {
  static const List<String> all = ['A', 'B', 'C', 'Standard'];

  static const Map<String, String> labels = {
    'A': 'Grade A (Export / Prime)',
    'B': 'Grade B (Local Processing)',
    'C': 'Grade C (Smoke / Dry)',
    'Standard': 'Standard (Dagaa)',
  };
}

class PaymentMethods {
  static const List<String> all = [
    'M-Pesa (Mobile Money)',
    'Cash Voucher',
    'Bank RTGS',
    'Airtel Money',
    'Cash Payment',
  ];
}

class SupplierCategories {
  static const List<String> all = [
    'Individual Fisherman',
    'BMU Fishing Group',
    'Dealer / Middleman',
    'Aquaculture Farm',
  ];
}

class FuelTypes {
  static const List<String> all = ['Petrol', 'Diesel'];
}

class FuelArrangements {
  static const List<String> all = [
    'Cash',
    'Partial',
    'By Fish Delivery',
    'End of Season',
  ];
}

class UserRoles {
  static const String owner = 'Owner';
  static const String generalManager = 'General Manager';
  static const String purchasingOfficer = 'Purchasing Officer';
  static const String qualityInspector = 'Quality Inspector';
  static const String storekeeper = 'Storekeeper';
  static const String accountant = 'Accountant';
  static const String salesOfficer = 'Sales Officer';
  static const String transportOfficer = 'Transport Officer';
  static const String auditor = 'Auditor';

  static const List<String> all = [
    owner,
    generalManager,
    purchasingOfficer,
    qualityInspector,
    storekeeper,
    accountant,
    salesOfficer,
    transportOfficer,
    auditor,
  ];
}

class BatchStatus {
  static const String pending = 'pending';
  static const String accepted = 'accepted';
  static const String rejected = 'rejected';
}

class SaleDispatchStatus {
  static const String pending = 'Pending Dispatch';
  static const String inTransit = 'In transit';
  static const String delivered = 'Delivered';
}

class MaintenanceStatus {
  static const String reported = 'Reported';
  static const String inProgress = 'In Progress';
  static const String completed = 'Completed';
}

class BoatStatus {
  static const String operational = 'Operational';
  static const String underMaintenance = 'Under Maintenance';
  static const String docked = 'Docked';
}

class ComplianceStatus {
  static const String valid = 'Valid';
  static const String expiringSoon = 'Expiring Soon';
  static const String expired = 'Expired';
}


