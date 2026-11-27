// ─── All Data Models ──────────────────────────────────────────────────────────
// Single barrel export + definitions

import 'package:uuid/uuid.dart';

final _uuid = const Uuid();
String uid([String prefix = '']) => prefix + _uuid.v4().substring(0, 8);

String today() {
  final d = DateTime.now();
  return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

String nowLocal() {
  final d = DateTime.now();
  return '${today()}T${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}

String daysAgoStr(int n) {
  final d = DateTime.now().subtract(Duration(days: n));
  return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

// ─── Supplier / Fisherman ────────────────────────────────────────────────────
class Supplier {
  final String id;
  final String no;
  String name;
  String phone;
  String site;
  String cat; // Individual Fisherman, BMU Fishing Group, Dealer, Aquaculture
  String boat;
  String boatId;
  String boatReg;
  String nida;
  int creditLimit;
  String status; // Active, Inactive
  int totalSupplied;
  String? avatarUrl;

  Supplier({
    String? id,
    required this.no,
    required this.name,
    required this.phone,
    required this.site,
    required this.cat,
    this.boat = '',
    this.boatId = '',
    this.boatReg = '',
    this.nida = '',
    this.creditLimit = 2000000,
    this.status = 'Active',
    this.totalSupplied = 0,
    this.avatarUrl,
  }) : id = id ?? uid('s');

  Map<String, dynamic> toJson() => {
        'id': id,
        'no': no,
        'name': name,
        'phone': phone,
        'site': site,
        'cat': cat,
        'boat': boat,
        'boatId': boatId,
        'boatReg': boatReg,
        'nida': nida,
        'creditLimit': creditLimit,
        'status': status,
        'totalSupplied': totalSupplied,
        'avatarUrl': avatarUrl,
      };

  factory Supplier.fromJson(Map<String, dynamic> j) => Supplier(
        id: j['id'],
        no: j['no'] ?? '',
        name: j['name'] ?? '',
        phone: j['phone'] ?? '',
        site: j['site'] ?? '',
        cat: j['cat'] ?? 'Individual Fisherman',
        boat: j['boat'] ?? '',
        boatId: j['boatId'] ?? '',
        boatReg: j['boatReg'] ?? '',
        nida: j['nida'] ?? '',
        creditLimit: j['creditLimit'] ?? 2000000,
        status: j['status'] ?? 'Active',
        totalSupplied: j['totalSupplied'] ?? 0,
        avatarUrl: j['avatarUrl'],
      );

  Supplier copyWith({
    String? name,
    String? phone,
    String? site,
    String? cat,
    String? boat,
    String? boatId,
    String? boatReg,
    String? nida,
    int? creditLimit,
    String? status,
    int? totalSupplied,
  }) =>
      Supplier(
        id: id,
        no: no,
        name: name ?? this.name,
        phone: phone ?? this.phone,
        site: site ?? this.site,
        cat: cat ?? this.cat,
        boat: boat ?? this.boat,
        boatId: boatId ?? this.boatId,
        boatReg: boatReg ?? this.boatReg,
        nida: nida ?? this.nida,
        creditLimit: creditLimit ?? this.creditLimit,
        status: status ?? this.status,
        totalSupplied: totalSupplied ?? this.totalSupplied,
      );
}

// ─── Fish Batch ───────────────────────────────────────────────────────────────
class FishBatch {
  final String id;
  final String no;
  final String pur; // Purchase number PUR-######
  String sup; // Supplier id
  String sp; // Species
  String grade;
  double kg;
  double rem; // Remaining kg
  double price; // per kg
  String date;
  String at;
  String site;
  String wh; // Warehouse/cold room
  String st; // pending | accepted | rejected
  double rej;
  double temp;
  String? reason;
  bool manual;
  double tare;
  int crates;
  double waste;

  FishBatch({
    String? id,
    required this.no,
    required this.pur,
    required this.sup,
    required this.sp,
    required this.grade,
    required this.kg,
    this.rem = 0,
    required this.price,
    required this.date,
    required this.at,
    required this.site,
    required this.wh,
    this.st = 'pending',
    this.rej = 0,
    this.temp = 0,
    this.reason,
    this.manual = false,
    this.tare = 0,
    this.crates = 0,
    this.waste = 0,
  }) : id = id ?? uid('b');

  double get total => kg * price;
  double get available => rem - waste;

  Map<String, dynamic> toJson() => {
        'id': id,
        'no': no,
        'pur': pur,
        'sup': sup,
        'sp': sp,
        'grade': grade,
        'kg': kg,
        'rem': rem,
        'price': price,
        'date': date,
        'at': at,
        'site': site,
        'wh': wh,
        'st': st,
        'rej': rej,
        'temp': temp,
        'reason': reason,
        'manual': manual,
        'tare': tare,
        'crates': crates,
        'waste': waste,
      };

  factory FishBatch.fromJson(Map<String, dynamic> j) => FishBatch(
        id: j['id'],
        no: j['no'] ?? '',
        pur: j['pur'] ?? '',
        sup: j['sup'] ?? '',
        sp: j['sp'] ?? '',
        grade: j['grade'] ?? 'A',
        kg: (j['kg'] ?? 0).toDouble(),
        rem: (j['rem'] ?? 0).toDouble(),
        price: (j['price'] ?? 0).toDouble(),
        date: j['date'] ?? today(),
        at: j['at'] ?? nowLocal(),
        site: j['site'] ?? '',
        wh: j['wh'] ?? '',
        st: j['st'] ?? 'pending',
        rej: (j['rej'] ?? 0).toDouble(),
        temp: (j['temp'] ?? 0).toDouble(),
        reason: j['reason'],
        manual: j['manual'] ?? false,
        tare: (j['tare'] ?? 0).toDouble(),
        crates: j['crates'] ?? 0,
        waste: (j['waste'] ?? 0).toDouble(),
      );

  FishBatch copyWith({
    double? rem,
    double? rej,
    double? temp,
    String? reason,
    String? st,
    String? wh,
    double? waste,
  }) =>
      FishBatch(
        id: id,
        no: no,
        pur: pur,
        sup: sup,
        sp: sp,
        grade: grade,
        kg: kg,
        rem: rem ?? this.rem,
        price: price,
        date: date,
        at: at,
        site: site,
        wh: wh ?? this.wh,
        st: st ?? this.st,
        rej: rej ?? this.rej,
        temp: temp ?? this.temp,
        reason: reason ?? this.reason,
        manual: manual,
        tare: tare,
        crates: crates,
        waste: waste ?? this.waste,
      );
}

// ─── Supplier Payment ─────────────────────────────────────────────────────────
class SupplierPayment {
  final String id;
  final String ref;
  final String sup; // Supplier id
  final double amt;
  final String m; // method
  final String date;

  SupplierPayment({
    String? id,
    String? ref,
    required this.sup,
    required this.amt,
    required this.m,
    required this.date,
  })  : id = id ?? uid('p'),
        ref = ref ?? 'PAY-${uid('')}';

  Map<String, dynamic> toJson() => {
        'id': id,
        'ref': ref,
        'sup': sup,
        'amt': amt,
        'm': m,
        'date': date,
      };

  factory SupplierPayment.fromJson(Map<String, dynamic> j) => SupplierPayment(
        id: j['id'],
        ref: j['ref'] ?? '',
        sup: j['sup'] ?? '',
        amt: (j['amt'] ?? 0).toDouble(),
        m: j['m'] ?? '',
        date: j['date'] ?? today(),
      );
}

// ─── Customer / Industry Factory ──────────────────────────────────────────────
class Customer {
  final String id;
  final String code;
  String name;
  String phone;
  String location;
  int limit;
  String contact;

  Customer({
    String? id,
    required this.code,
    required this.name,
    required this.phone,
    required this.location,
    this.limit = 25000000,
    this.contact = '',
  }) : id = id ?? uid('c');

  Map<String, dynamic> toJson() => {
        'id': id,
        'code': code,
        'name': name,
        'phone': phone,
        'location': location,
        'limit': limit,
        'contact': contact,
      };

  factory Customer.fromJson(Map<String, dynamic> j) => Customer(
        id: j['id'],
        code: j['code'] ?? '',
        name: j['name'] ?? '',
        phone: j['phone'] ?? '',
        location: j['location'] ?? '',
        limit: j['limit'] ?? 25000000,
        contact: j['contact'] ?? '',
      );
}

// ─── Sale Invoice ─────────────────────────────────────────────────────────────
class SaleAlloc {
  final String batchId;
  final double kg;
  SaleAlloc({required this.batchId, required this.kg});
  Map<String, dynamic> toJson() => {'b': batchId, 'kg': kg};
  factory SaleAlloc.fromJson(Map<String, dynamic> j) =>
      SaleAlloc(batchId: j['b'] ?? '', kg: (j['kg'] ?? 0).toDouble());
}

class SaleDispatch {
  String st;
  String veh;
  String drv;
  String temp;
  SaleDispatch({
    this.st = 'Pending Dispatch',
    this.veh = '',
    this.drv = '',
    this.temp = '',
  });
  Map<String, dynamic> toJson() =>
      {'st': st, 'veh': veh, 'drv': drv, 'temp': temp};
  factory SaleDispatch.fromJson(Map<String, dynamic>? j) => j == null
      ? SaleDispatch()
      : SaleDispatch(
          st: j['st'] ?? 'Pending Dispatch',
          veh: j['veh'] ?? '',
          drv: j['drv'] ?? '',
          temp: j['temp'] ?? '',
        );
}

class Sale {
  final String id;
  final String no;
  String cus; // Customer id
  String sp;
  String grade;
  double kg;
  double price;
  double paid;
  double cogs;
  String date;
  String at;
  List<SaleAlloc> alloc;
  SaleDispatch dis;

  Sale({
    String? id,
    required this.no,
    required this.cus,
    required this.sp,
    required this.grade,
    required this.kg,
    required this.price,
    this.paid = 0,
    this.cogs = 0,
    required this.date,
    required this.at,
    List<SaleAlloc>? alloc,
    SaleDispatch? dis,
  })  : id = id ?? uid('x'),
        alloc = alloc ?? [],
        dis = dis ?? SaleDispatch();

  double get total => kg * price;
  double get outstanding => total - paid;

  Map<String, dynamic> toJson() => {
        'id': id,
        'no': no,
        'cus': cus,
        'sp': sp,
        'grade': grade,
        'kg': kg,
        'price': price,
        'paid': paid,
        'cogs': cogs,
        'date': date,
        'at': at,
        'alloc': alloc.map((a) => a.toJson()).toList(),
        'dis': dis.toJson(),
      };

  factory Sale.fromJson(Map<String, dynamic> j) => Sale(
        id: j['id'],
        no: j['no'] ?? '',
        cus: j['cus'] ?? '',
        sp: j['sp'] ?? '',
        grade: j['grade'] ?? 'A',
        kg: (j['kg'] ?? 0).toDouble(),
        price: (j['price'] ?? 0).toDouble(),
        paid: (j['paid'] ?? 0).toDouble(),
        cogs: (j['cogs'] ?? 0).toDouble(),
        date: j['date'] ?? today(),
        at: j['at'] ?? nowLocal(),
        alloc: (j['alloc'] as List? ?? [])
            .map((a) => SaleAlloc.fromJson(a))
            .toList(),
        dis: SaleDispatch.fromJson(j['dis']),
      );

  Sale copyWith({double? paid, SaleDispatch? dis}) => Sale(
        id: id,
        no: no,
        cus: cus,
        sp: sp,
        grade: grade,
        kg: kg,
        price: price,
        paid: paid ?? this.paid,
        cogs: cogs,
        date: date,
        at: at,
        alloc: alloc,
        dis: dis ?? this.dis,
      );
}

// ─── Fuel Tank ────────────────────────────────────────────────────────────────
class FuelTank {
  final String id;
  String name;
  String location;
  String fuel; // Petrol | Diesel
  double capacity;
  double current;
  double buyPrice;
  double sellPrice;
  String unit;

  FuelTank({
    String? id,
    required this.name,
    required this.location,
    required this.fuel,
    required this.capacity,
    required this.current,
    required this.buyPrice,
    required this.sellPrice,
    this.unit = 'Litres',
  }) : id = id ?? uid('tank');

  double get fillPct => capacity > 0 ? (current / capacity) * 100 : 0;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'location': location,
        'fuel': fuel,
        'capacity': capacity,
        'current': current,
        'buyPrice': buyPrice,
        'sellPrice': sellPrice,
        'unit': unit,
      };

  factory FuelTank.fromJson(Map<String, dynamic> j) => FuelTank(
        id: j['id'],
        name: j['name'] ?? '',
        location: j['location'] ?? '',
        fuel: j['fuel'] ?? 'Petrol',
        capacity: (j['capacity'] ?? 0).toDouble(),
        current: (j['current'] ?? 0).toDouble(),
        buyPrice: (j['buyPrice'] ?? 0).toDouble(),
        sellPrice: (j['sellPrice'] ?? 0).toDouble(),
        unit: j['unit'] ?? 'Litres',
      );

  FuelTank copyWith({double? current, double? buyPrice, double? sellPrice}) =>
      FuelTank(
        id: id,
        name: name,
        location: location,
        fuel: fuel,
        capacity: capacity,
        current: current ?? this.current,
        buyPrice: buyPrice ?? this.buyPrice,
        sellPrice: sellPrice ?? this.sellPrice,
        unit: unit,
      );
}

// ─── Fuel Issue ───────────────────────────────────────────────────────────────
class FuelIssue {
  final String id;
  final String no;
  String supId;
  String boatId;
  String boatReg;
  String tankId;
  String fuel;
  double litres;
  double price;
  double total;
  double paid;
  double balance;
  String arrangement;
  String issuedBy;
  String notes;
  String date;
  String at;

  FuelIssue({
    String? id,
    required this.no,
    required this.supId,
    required this.boatId,
    required this.boatReg,
    required this.tankId,
    required this.fuel,
    required this.litres,
    required this.price,
    required this.total,
    required this.paid,
    required this.balance,
    required this.arrangement,
    required this.issuedBy,
    this.notes = '',
    required this.date,
    required this.at,
  }) : id = id ?? uid('fi');

  Map<String, dynamic> toJson() => {
        'id': id,
        'no': no,
        'supId': supId,
        'boatId': boatId,
        'boatReg': boatReg,
        'tankId': tankId,
        'fuel': fuel,
        'litres': litres,
        'price': price,
        'total': total,
        'paid': paid,
        'balance': balance,
        'arrangement': arrangement,
        'issuedBy': issuedBy,
        'notes': notes,
        'date': date,
        'at': at,
      };

  factory FuelIssue.fromJson(Map<String, dynamic> j) => FuelIssue(
        id: j['id'],
        no: j['no'] ?? '',
        supId: j['supId'] ?? '',
        boatId: j['boatId'] ?? '',
        boatReg: j['boatReg'] ?? '',
        tankId: j['tankId'] ?? '',
        fuel: j['fuel'] ?? 'Petrol',
        litres: (j['litres'] ?? 0).toDouble(),
        price: (j['price'] ?? 0).toDouble(),
        total: (j['total'] ?? 0).toDouble(),
        paid: (j['paid'] ?? 0).toDouble(),
        balance: (j['balance'] ?? 0).toDouble(),
        arrangement: j['arrangement'] ?? 'Cash',
        issuedBy: j['issuedBy'] ?? '',
        notes: j['notes'] ?? '',
        date: j['date'] ?? today(),
        at: j['at'] ?? nowLocal(),
      );
}

// ─── Fuel Purchase (Bulk Restock) ─────────────────────────────────────────────
class FuelPurchase {
  final String id;
  final String no;
  final String date;
  final String supId;
  final String supName;
  final String tankId;
  final String fuel;
  final double litres;
  final double costPerL;
  final double total;
  final String docRef;
  final String status;

  FuelPurchase({
    String? id,
    required this.no,
    required this.date,
    required this.supId,
    required this.supName,
    required this.tankId,
    required this.fuel,
    required this.litres,
    required this.costPerL,
    required this.total,
    this.docRef = '',
    this.status = 'Paid',
  }) : id = id ?? uid('fp');

  Map<String, dynamic> toJson() => {
        'id': id, 'no': no, 'date': date, 'supId': supId, 'supName': supName,
        'tankId': tankId, 'fuel': fuel, 'litres': litres, 'costPerL': costPerL,
        'total': total, 'docRef': docRef, 'status': status,
      };

  factory FuelPurchase.fromJson(Map<String, dynamic> j) => FuelPurchase(
        id: j['id'],
        no: j['no'] ?? '',
        date: j['date'] ?? today(),
        supId: j['supId'] ?? '',
        supName: j['supName'] ?? '',
        tankId: j['tankId'] ?? '',
        fuel: j['fuel'] ?? 'Petrol',
        litres: (j['litres'] ?? 0).toDouble(),
        costPerL: (j['costPerL'] ?? 0).toDouble(),
        total: (j['total'] ?? 0).toDouble(),
        docRef: j['docRef'] ?? '',
        status: j['status'] ?? 'Paid',
      );
}

// ─── Fuel Payment ─────────────────────────────────────────────────────────────
class FuelPayment {
  final String id;
  final String supId;
  final double amt;
  final String m;
  final String date;
  final String ref;
  final String notes;

  FuelPayment({
    String? id,
    required this.supId,
    required this.amt,
    required this.m,
    required this.date,
    String? ref,
    this.notes = '',
  })  : id = id ?? uid('fp'),
        ref = ref ?? 'FPAY-${uid('')}';

  Map<String, dynamic> toJson() => {
        'id': id,
        'supId': supId,
        'amt': amt,
        'm': m,
        'date': date,
        'ref': ref,
        'notes': notes,
      };

  factory FuelPayment.fromJson(Map<String, dynamic> j) => FuelPayment(
        id: j['id'],
        supId: j['supId'] ?? '',
        amt: (j['amt'] ?? 0).toDouble(),
        m: j['m'] ?? '',
        date: j['date'] ?? today(),
        ref: j['ref'] ?? '',
        notes: j['notes'] ?? '',
      );
}

// ─── Boat ─────────────────────────────────────────────────────────────────────
class CrewMember {
  final String name;
  final String role;
  final String phone;
  final String nida;
  CrewMember(
      {required this.name,
      required this.role,
      required this.phone,
      required this.nida});
  Map<String, dynamic> toJson() =>
      {'name': name, 'role': role, 'phone': phone, 'nida': nida};
  factory CrewMember.fromJson(Map<String, dynamic> j) => CrewMember(
        name: j['name'] ?? '',
        role: j['role'] ?? '',
        phone: j['phone'] ?? '',
        nida: j['nida'] ?? '',
      );
}

class Boat {
  final String id;
  String regNo;
  String name;
  String ownerType;
  String ownerId;
  String captain;
  String engine;
  String boatType;
  String status;
  double engineHours;
  String lastService;
  String notes;
  List<CrewMember> crewMembers;

  Boat({
    String? id,
    required this.regNo,
    required this.name,
    required this.ownerType,
    required this.ownerId,
    required this.captain,
    required this.engine,
    required this.boatType,
    this.status = 'Operational',
    this.engineHours = 0,
    String? lastService,
    this.notes = '',
    List<CrewMember>? crewMembers,
  })  : id = id ?? uid('boat'),
        lastService = lastService ?? today(),
        crewMembers = crewMembers ?? [];

  Map<String, dynamic> toJson() => {
        'id': id,
        'regNo': regNo,
        'name': name,
        'ownerType': ownerType,
        'ownerId': ownerId,
        'captain': captain,
        'engine': engine,
        'boatType': boatType,
        'status': status,
        'engineHours': engineHours,
        'lastService': lastService,
        'notes': notes,
        'crewMembers': crewMembers.map((c) => c.toJson()).toList(),
      };

  factory Boat.fromJson(Map<String, dynamic> j) => Boat(
        id: j['id'],
        regNo: j['regNo'] ?? '',
        name: j['name'] ?? '',
        ownerType: j['ownerType'] ?? 'Fisherman-owned',
        ownerId: j['ownerId'] ?? '',
        captain: j['captain'] ?? '',
        engine: j['engine'] ?? '',
        boatType: j['boatType'] ?? '',
        status: j['status'] ?? 'Operational',
        engineHours: (j['engineHours'] ?? 0).toDouble(),
        lastService: j['lastService'] ?? today(),
        notes: j['notes'] ?? '',
        crewMembers: (j['crewMembers'] as List? ?? [])
            .map((c) => CrewMember.fromJson(c))
            .toList(),
      );
}

// ─── Maintenance Work Order ───────────────────────────────────────────────────
class PartUsed {
  final String partId;
  final String name;
  final int qty;
  final double cost;
  PartUsed(
      {required this.partId,
      required this.name,
      required this.qty,
      required this.cost});
  Map<String, dynamic> toJson() =>
      {'partId': partId, 'name': name, 'qty': qty, 'cost': cost};
  factory PartUsed.fromJson(Map<String, dynamic> j) => PartUsed(
        partId: j['partId'] ?? '',
        name: j['name'] ?? '',
        qty: j['qty'] ?? 0,
        cost: (j['cost'] ?? 0).toDouble(),
      );
}

class MaintenanceOrder {
  final String id;
  final String no;
  String boatId;
  String supId;
  String title;
  String fault;
  String mechanic;
  String status;
  String arrangement;
  List<PartUsed> parts;
  double partsCost;
  double laborCost;
  double otherCost;
  double totalCost;
  double recoverable;
  double recovered;
  String date;
  String notes;

  MaintenanceOrder({
    String? id,
    required this.no,
    required this.boatId,
    required this.supId,
    required this.title,
    required this.fault,
    required this.mechanic,
    required this.status,
    required this.arrangement,
    List<PartUsed>? parts,
    required this.partsCost,
    required this.laborCost,
    required this.otherCost,
    required this.totalCost,
    required this.recoverable,
    this.recovered = 0,
    required this.date,
    this.notes = '',
  })  : id = id ?? uid('wo'),
        parts = parts ?? [];

  Map<String, dynamic> toJson() => {
        'id': id,
        'no': no,
        'boatId': boatId,
        'supId': supId,
        'title': title,
        'fault': fault,
        'mechanic': mechanic,
        'status': status,
        'arrangement': arrangement,
        'parts': parts.map((p) => p.toJson()).toList(),
        'partsCost': partsCost,
        'laborCost': laborCost,
        'otherCost': otherCost,
        'totalCost': totalCost,
        'recoverable': recoverable,
        'recovered': recovered,
        'date': date,
        'notes': notes,
      };

  factory MaintenanceOrder.fromJson(Map<String, dynamic> j) =>
      MaintenanceOrder(
        id: j['id'],
        no: j['no'] ?? '',
        boatId: j['boatId'] ?? '',
        supId: j['supId'] ?? '',
        title: j['title'] ?? '',
        fault: j['fault'] ?? '',
        mechanic: j['mechanic'] ?? '',
        status: j['status'] ?? 'Reported',
        arrangement: j['arrangement'] ?? 'Company-paid',
        parts: (j['parts'] as List? ?? [])
            .map((p) => PartUsed.fromJson(p))
            .toList(),
        partsCost: (j['partsCost'] ?? 0).toDouble(),
        laborCost: (j['laborCost'] ?? 0).toDouble(),
        otherCost: (j['otherCost'] ?? 0).toDouble(),
        totalCost: (j['totalCost'] ?? 0).toDouble(),
        recoverable: (j['recoverable'] ?? 0).toDouble(),
        recovered: (j['recovered'] ?? 0).toDouble(),
        date: j['date'] ?? today(),
        notes: j['notes'] ?? '',
      );
}

// ─── Settlement ───────────────────────────────────────────────────────────────
class Settlement {
  final String id;
  final String no;
  final String purId;
  final String supId;
  final double fishTotal;
  final double fuelDeducted;
  final double maintDeducted;
  final double netPayable;
  final String method;
  final String notes;
  final String date;
  final String at;

  Settlement({
    String? id,
    required this.no,
    required this.purId,
    required this.supId,
    required this.fishTotal,
    required this.fuelDeducted,
    required this.maintDeducted,
    required this.netPayable,
    required this.method,
    this.notes = '',
    required this.date,
    required this.at,
  }) : id = id ?? uid('st');

  Map<String, dynamic> toJson() => {
        'id': id,
        'no': no,
        'purId': purId,
        'supId': supId,
        'fishTotal': fishTotal,
        'fuelDeducted': fuelDeducted,
        'maintDeducted': maintDeducted,
        'netPayable': netPayable,
        'method': method,
        'notes': notes,
        'date': date,
        'at': at,
      };

  factory Settlement.fromJson(Map<String, dynamic> j) => Settlement(
        id: j['id'],
        no: j['no'] ?? '',
        purId: j['purId'] ?? '',
        supId: j['supId'] ?? '',
        fishTotal: (j['fishTotal'] ?? 0).toDouble(),
        fuelDeducted: (j['fuelDeducted'] ?? 0).toDouble(),
        maintDeducted: (j['maintDeducted'] ?? 0).toDouble(),
        netPayable: (j['netPayable'] ?? 0).toDouble(),
        method: j['method'] ?? '',
        notes: j['notes'] ?? '',
        date: j['date'] ?? today(),
        at: j['at'] ?? nowLocal(),
      );
}

// ─── Expense ──────────────────────────────────────────────────────────────────
class Expense {
  final String id;
  String cat;
  double amt;
  String date;
  String desc;

  Expense({
    String? id,
    required this.cat,
    required this.amt,
    required this.date,
    required this.desc,
  }) : id = id ?? uid('e');

  Map<String, dynamic> toJson() =>
      {'id': id, 'cat': cat, 'amt': amt, 'date': date, 'desc': desc};

  factory Expense.fromJson(Map<String, dynamic> j) => Expense(
        id: j['id'],
        cat: j['cat'] ?? '',
        amt: (j['amt'] ?? 0).toDouble(),
        date: j['date'] ?? today(),
        desc: j['desc'] ?? '',
      );
}

// ─── Transport Trip ───────────────────────────────────────────────────────────
class Trip {
  final String id;
  String type;
  String mode;
  String from;
  String to;
  double cost;
  String date;
  String ref;
  String veh;
  String temp;
  String method;

  Trip({
    String? id,
    required this.type,
    required this.mode,
    required this.from,
    required this.to,
    required this.cost,
    required this.date,
    required this.ref,
    this.veh = '',
    this.temp = '',
    this.method = 'CRDB / NMB Bank',
  }) : id = id ?? uid('t');

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'mode': mode,
        'from': from,
        'to': to,
        'cost': cost,
        'date': date,
        'ref': ref,
        'veh': veh,
        'temp': temp,
        'method': method,
      };

  factory Trip.fromJson(Map<String, dynamic> j) => Trip(
        id: j['id'],
        type: j['type'] ?? '',
        mode: j['mode'] ?? '',
        from: j['from'] ?? '',
        to: j['to'] ?? '',
        cost: (j['cost'] ?? 0).toDouble(),
        date: j['date'] ?? today(),
        ref: j['ref'] ?? '',
        veh: j['veh'] ?? '',
        temp: j['temp'] ?? '',
        method: j['method'] ?? 'CRDB / NMB Bank',
      );
}

// ─── Compliance Permit ────────────────────────────────────────────────────────
class CompliancePermit {
  final String id;
  String type;
  String ref;
  String who;
  String exp;
  String status;

  CompliancePermit({
    String? id,
    required this.type,
    required this.ref,
    required this.who,
    required this.exp,
    required this.status,
  }) : id = id ?? uid('k');

  String get computedStatus {
    try {
      final expDate = DateTime.parse(exp);
      final now = DateTime.now();
      if (expDate.isBefore(now)) return 'Expired';
      if (expDate.difference(now).inDays <= 30) return 'Expiring Soon';
      return 'Valid';
    } catch (_) {
      return status;
    }
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'ref': ref,
        'who': who,
        'exp': exp,
        'status': status,
      };

  factory CompliancePermit.fromJson(Map<String, dynamic> j) => CompliancePermit(
        id: j['id'],
        type: j['type'] ?? '',
        ref: j['ref'] ?? '',
        who: j['who'] ?? '',
        exp: j['exp'] ?? '',
        status: j['status'] ?? 'Valid',
      );
}

// ─── Spare Part ───────────────────────────────────────────────────────────────
class SparePart {
  final String id;
  String name;
  String partNo;
  String category;
  int stock;
  int minStock;
  double unitCost;
  double sellPrice;
  String unit;

  SparePart({
    String? id,
    required this.name,
    required this.partNo,
    required this.category,
    required this.stock,
    required this.minStock,
    required this.unitCost,
    required this.sellPrice,
    required this.unit,
  }) : id = id ?? uid('sp');

  bool get isLowStock => stock <= minStock;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'partNo': partNo,
        'category': category,
        'stock': stock,
        'minStock': minStock,
        'unitCost': unitCost,
        'sellPrice': sellPrice,
        'unit': unit,
      };

  factory SparePart.fromJson(Map<String, dynamic> j) => SparePart(
        id: j['id'],
        name: j['name'] ?? '',
        partNo: j['partNo'] ?? '',
        category: j['category'] ?? '',
        stock: j['stock'] ?? 0,
        minStock: j['minStock'] ?? 5,
        unitCost: (j['unitCost'] ?? 0).toDouble(),
        sellPrice: (j['sellPrice'] ?? 0).toDouble(),
        unit: j['unit'] ?? 'pcs',
      );
}

// ─── Staff / User ─────────────────────────────────────────────────────────────
class StaffMember {
  final String id;
  String name;
  String phone;
  String username;
  String pin; // hashed
  String role;
  double salary;
  bool active;
  String branch;

  StaffMember({
    String? id,
    required this.name,
    required this.phone,
    required this.username,
    required this.pin,
    required this.role,
    required this.salary,
    this.active = true,
    this.branch = 'all',
  }) : id = id ?? uid('u');

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'username': username,
        'pin': pin,
        'role': role,
        'salary': salary,
        'active': active,
        'branch': branch,
      };

  factory StaffMember.fromJson(Map<String, dynamic> j) => StaffMember(
        id: j['id'],
        name: j['name'] ?? '',
        phone: j['phone'] ?? '',
        username: j['username'] ?? '',
        pin: j['pin'] ?? '',
        role: j['role'] ?? 'Purchasing Officer',
        salary: (j['salary'] ?? 0).toDouble(),
        active: j['active'] ?? true,
        branch: j['branch'] ?? 'all',
      );
}

// ─── Sequence Counters ────────────────────────────────────────────────────────
class Sequences {
  int pur;
  int sal;
  int fuel;
  int wo;
  int set;

  Sequences({
    this.pur = 126,
    this.sal = 85,
    this.fuel = 104,
    this.wo = 126,
    this.set = 41,
  });

  String nextPur() => 'PUR-${(pur++).toString().padLeft(6, '0')}';
  String nextSal() => 'SAL-${(sal++).toString().padLeft(6, '0')}';
  String nextFuel() => 'FUEL-${(fuel++).toString().padLeft(6, '0')}';
  String nextWo() => 'WO-${(wo++).toString().padLeft(6, '0')}';
  String nextSet() => 'SET-${(set++).toString().padLeft(5, '0')}';

  Map<String, dynamic> toJson() => {
        'pur': pur,
        'sal': sal,
        'fuel': fuel,
        'wo': wo,
        'set': set,
      };

  factory Sequences.fromJson(Map<String, dynamic>? j) => j == null
      ? Sequences()
      : Sequences(
          pur: j['pur'] ?? 126,
          sal: j['sal'] ?? 85,
          fuel: j['fuel'] ?? 104,
          wo: j['wo'] ?? 126,
          set: j['set'] ?? 41,
        );
}

// ─── Audit Entry ──────────────────────────────────────────────────────────────
class AuditEntry {
  final String id;
  final String t;
  final String u;
  final String m;
  AuditEntry({required this.id, required this.t, required this.u, required this.m});
  Map<String, dynamic> toJson() => {'id': id, 't': t, 'u': u, 'm': m};
  factory AuditEntry.fromJson(Map<String, dynamic> j) =>
      AuditEntry(id: j['id'] ?? '', t: j['t'] ?? '', u: j['u'] ?? '', m: j['m'] ?? '');
}

// ─── Branch Data (the full station dataset) ──────────────────────────────────
class BranchData {
  Sequences seq;
  List<String> wh; // warehouse/cold rooms
  List<Supplier> suppliers;
  List<FishBatch> batches;
  List<SupplierPayment> pays;
  List<Customer> customers;
  List<Sale> sales;
  List<Expense> exps;
  List<Trip> trips;
  List<CompliancePermit> comp;
  List<FuelTank> fuelTanks;
  List<FuelIssue> fuelIssues;
  List<FuelPayment> fuelPayments;
  List<FuelPurchase> fuelPurchases;
  List<Boat> boats;
  List<SparePart> spareParts;
  List<MaintenanceOrder> maintenanceOrders;
  List<Settlement> settlements;
  List<AuditEntry> audit;

  BranchData({
    Sequences? seq,
    List<String>? wh,
    List<Supplier>? suppliers,
    List<FishBatch>? batches,
    List<SupplierPayment>? pays,
    List<Customer>? customers,
    List<Sale>? sales,
    List<Expense>? exps,
    List<Trip>? trips,
    List<CompliancePermit>? comp,
    List<FuelTank>? fuelTanks,
    List<FuelIssue>? fuelIssues,
    List<FuelPayment>? fuelPayments,
    List<FuelPurchase>? fuelPurchases,
    List<Boat>? boats,
    List<SparePart>? spareParts,
    List<MaintenanceOrder>? maintenanceOrders,
    List<Settlement>? settlements,
    List<AuditEntry>? audit,
  })  : seq = seq ?? Sequences(),
        wh = wh ?? ['Main Cold Room (0°C to 2°C)', 'Landing Holding Chiller', 'Blast Freezer (-18°C)'],
        suppliers = suppliers ?? [],
        batches = batches ?? [],
        pays = pays ?? [],
        customers = customers ?? [],
        sales = sales ?? [],
        exps = exps ?? [],
        trips = trips ?? [],
        comp = comp ?? [],
        fuelTanks = fuelTanks ?? [],
        fuelIssues = fuelIssues ?? [],
        fuelPayments = fuelPayments ?? [],
        fuelPurchases = fuelPurchases ?? [],
        boats = boats ?? [],
        spareParts = spareParts ?? [],
        maintenanceOrders = maintenanceOrders ?? [],
        settlements = settlements ?? [],
        audit = audit ?? [];

  Map<String, dynamic> toJson() => {
        'seq': seq.toJson(),
        'wh': wh,
        'suppliers': suppliers.map((e) => e.toJson()).toList(),
        'batches': batches.map((e) => e.toJson()).toList(),
        'pays': pays.map((e) => e.toJson()).toList(),
        'customers': customers.map((e) => e.toJson()).toList(),
        'sales': sales.map((e) => e.toJson()).toList(),
        'exps': exps.map((e) => e.toJson()).toList(),
        'trips': trips.map((e) => e.toJson()).toList(),
        'comp': comp.map((e) => e.toJson()).toList(),
        'fuelTanks': fuelTanks.map((e) => e.toJson()).toList(),
        'fuelIssues': fuelIssues.map((e) => e.toJson()).toList(),
        'fuelPayments': fuelPayments.map((e) => e.toJson()).toList(),
        'fuelPurchases': fuelPurchases.map((e) => e.toJson()).toList(),
        'boats': boats.map((e) => e.toJson()).toList(),
        'spareParts': spareParts.map((e) => e.toJson()).toList(),
        'maintenanceOrders': maintenanceOrders.map((e) => e.toJson()).toList(),
        'settlements': settlements.map((e) => e.toJson()).toList(),
        'audit': audit.map((e) => e.toJson()).toList(),
      };

  factory BranchData.fromJson(Map<String, dynamic> j) => BranchData(
        seq: Sequences.fromJson(j['seq']),
        wh: List<String>.from(j['wh'] ?? []),
        suppliers: (j['suppliers'] as List? ?? []).map((e) => Supplier.fromJson(e)).toList(),
        batches: (j['batches'] as List? ?? []).map((e) => FishBatch.fromJson(e)).toList(),
        pays: (j['pays'] as List? ?? []).map((e) => SupplierPayment.fromJson(e)).toList(),
        customers: (j['customers'] as List? ?? []).map((e) => Customer.fromJson(e)).toList(),
        sales: (j['sales'] as List? ?? []).map((e) => Sale.fromJson(e)).toList(),
        exps: (j['exps'] as List? ?? []).map((e) => Expense.fromJson(e)).toList(),
        trips: (j['trips'] as List? ?? []).map((e) => Trip.fromJson(e)).toList(),
        comp: (j['comp'] as List? ?? []).map((e) => CompliancePermit.fromJson(e)).toList(),
        fuelTanks: (j['fuelTanks'] as List? ?? []).map((e) => FuelTank.fromJson(e)).toList(),
        fuelIssues: (j['fuelIssues'] as List? ?? []).map((e) => FuelIssue.fromJson(e)).toList(),
        fuelPayments: (j['fuelPayments'] as List? ?? []).map((e) => FuelPayment.fromJson(e)).toList(),
        fuelPurchases: (j['fuelPurchases'] as List? ?? []).map((e) => FuelPurchase.fromJson(e)).toList(),
        boats: (j['boats'] as List? ?? []).map((e) => Boat.fromJson(e)).toList(),
        spareParts: (j['spareParts'] as List? ?? []).map((e) => SparePart.fromJson(e)).toList(),
        maintenanceOrders: (j['maintenanceOrders'] as List? ?? []).map((e) => MaintenanceOrder.fromJson(e)).toList(),
        settlements: (j['settlements'] as List? ?? []).map((e) => Settlement.fromJson(e)).toList(),
        audit: (j['audit'] as List? ?? []).map((e) => AuditEntry.fromJson(e)).toList(),
      );
}


