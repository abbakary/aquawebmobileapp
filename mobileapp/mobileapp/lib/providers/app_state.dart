import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../services/storage_service.dart';

// ─── Session Provider ─────────────────────────────────────────────────────────
class SessionNotifier extends Notifier<AppSession?> {
  @override
  AppSession? build() => StorageService.loadSession();

  /// Login via the backend API using username + password
  /// (same credentials as the web app)
  Future<bool> login(String username, String password) async {
    final session = await StorageService.login(username, password);
    if (session != null) {
      state = session;
      await StorageService.saveSession(session);
      return true;
    }
    return false;
  }

  /// Login error message for UI feedback
  String? _lastError;
  String? get lastError => _lastError;

  /// Login with detailed error reporting
  Future<String?> loginWithError(String username, String password) async {
    try {
      final session = await StorageService.login(username, password);
      if (session != null) {
        state = session;
        await StorageService.saveSession(session);
        _lastError = null;
        return null; // success
      }
      _lastError = 'Incorrect username or password';
      return _lastError;
    } catch (e) {
      _lastError = e.toString();
      return _lastError;
    }
  }

  Future<void> logout() async {
    state = null;
    await StorageService.clearSession();
  }
}

final sessionProvider = NotifierProvider<SessionNotifier, AppSession?>(
  SessionNotifier.new,
);

// ─── Branch Data Provider ─────────────────────────────────────────────────────
class BranchDataNotifier extends Notifier<BranchData> {
  @override
  BranchData build() => StorageService.loadData();

  Future<void> _save() async {
    await StorageService.saveData(state);
  }

  void _audit(String message) {
    final session = ref.read(sessionProvider);
    final entry = AuditEntry(
      id: uid('a'),
      t: DateTime.now().toString().substring(0, 16),
      u: session != null ? '${session.name} · ${session.role}' : 'System',
      m: message,
    );
    state = BranchData.fromJson({
      ...state.toJson(),
      'audit': [entry.toJson(), ...state.audit.map((a) => a.toJson())],
    });
  }

  // ── Supplier Actions ─────────────────────────────────────────────────────────
  Future<void> addSupplier(Supplier sup) async {
    state.suppliers.add(sup);
    state = BranchData.fromJson(state.toJson());
    _audit('Registered supplier ${sup.name} (${sup.no})');
    await _save();
  }

  Future<void> updateSupplier(Supplier updated) async {
    final idx = state.suppliers.indexWhere((s) => s.id == updated.id);
    if (idx >= 0) state.suppliers[idx] = updated;
    state = BranchData.fromJson(state.toJson());
    _audit('Updated supplier ${updated.name}');
    await _save();
  }

  // ── Fish Procurement ─────────────────────────────────────────────────────────
  Future<FishBatch> buyFish({
    required String supId,
    required String sp,
    required String grade,
    required double kg,
    required double price,
    required String site,
    double? fuelDeducted,
    double? maintDeducted,
    String method = 'M-Pesa (Mobile Money)',
  }) async {
    final purNo = state.seq.nextPur();
    final batchNo = 'BATCH-${(state.batches.length + 1).toString().padLeft(3, '0')}';

    final batch = FishBatch(
      no: batchNo,
      pur: purNo,
      sup: supId,
      sp: sp,
      grade: grade,
      kg: kg,
      rem: 0,
      price: price,
      date: today(),
      at: nowLocal(),
      site: site,
      wh: state.wh.isNotEmpty ? state.wh[0] : 'Cold Room',
      st: 'pending',
      tare: 12.5,
      crates: (kg / 40).ceil(),
    );

    state.batches.add(batch);

    // Auto net settlement if debts to deduct
    final fuelOff = fuelDeducted ?? 0;
    final maintOff = maintDeducted ?? 0;
    if (fuelOff > 0 || maintOff > 0) {
      final fishTotal = kg * price;
      final netPayable = fishTotal - fuelOff - maintOff;
      final settlementNo = state.seq.nextSet();
      state.settlements.insert(
          0,
          Settlement(
            no: settlementNo,
            purId: purNo,
            supId: supId,
            fishTotal: fishTotal,
            fuelDeducted: fuelOff,
            maintDeducted: maintOff,
            netPayable: netPayable > 0 ? netPayable : 0,
            method: method,
            date: today(),
            at: nowLocal(),
          ));
      if (netPayable > 0) {
        state.pays.add(SupplierPayment(
          sup: supId,
          amt: netPayable,
          m: method,
          date: today(),
        ));
      }
    }

    state = BranchData.fromJson(state.toJson());
    final sup = state.suppliers.firstWhere((s) => s.id == supId,
        orElse: () => Supplier(no: '', name: 'Unknown', phone: '', site: '', cat: ''));
    _audit('$purNo: Bought ${kg.toStringAsFixed(0)} kg $sp ($grade) from ${sup.name} @ TZS ${price.toStringAsFixed(0)}');
    await _save();
    return batch;
  }

  // ── Quality Inspection ───────────────────────────────────────────────────────
  Future<void> inspectBatch({
    required String batchId,
    required double accepted,
    required double temp,
    String? reason,
  }) async {
    final idx = state.batches.indexWhere((b) => b.id == batchId);
    if (idx < 0) return;
    final b = state.batches[idx];
    final rejected = b.kg - accepted;
    state.batches[idx] = b.copyWith(
      rem: accepted,
      rej: rejected,
      temp: temp,
      reason: reason,
      st: accepted > 0 ? 'accepted' : 'rejected',
    );
    state = BranchData.fromJson(state.toJson());
    _audit('${b.no} inspected: Accepted ${accepted.toStringAsFixed(0)} kg, rejected ${rejected.toStringAsFixed(0)} kg (Temp ${temp}°C)');
    await _save();
  }

  Future<void> transferBatch(String batchId, String toWarehouse) async {
    final idx = state.batches.indexWhere((b) => b.id == batchId);
    if (idx < 0) return;
    final b = state.batches[idx];
    state.batches[idx] = b.copyWith(wh: toWarehouse);
    state = BranchData.fromJson(state.toJson());
    _audit('${b.no} transferred to $toWarehouse');
    await _save();
  }

  Future<void> recordWaste(String batchId, double kg, String why) async {
    final idx = state.batches.indexWhere((b) => b.id == batchId);
    if (idx < 0) return;
    final b = state.batches[idx];
    state.batches[idx] = b.copyWith(
      rem: b.rem - kg,
      waste: b.waste + kg,
    );
    state = BranchData.fromJson(state.toJson());
    _audit('${b.no}: Documented wastage ${kg.toStringAsFixed(0)} kg ($why)');
    await _save();
  }

  // ── Supplier Payment ─────────────────────────────────────────────────────────
  Future<void> paySupplier(String supId, double amt, String method) async {
    state.pays.add(SupplierPayment(
      sup: supId,
      amt: amt,
      m: method,
      date: today(),
    ));
    state = BranchData.fromJson(state.toJson());
    final sup = state.suppliers.firstWhere((s) => s.id == supId,
        orElse: () => Supplier(no: '', name: 'Unknown', phone: '', site: '', cat: ''));
    _audit('Issued payment of TZS ${amt.toStringAsFixed(0)} ($method) to ${sup.name}');
    await _save();
  }

  // ── Sales ────────────────────────────────────────────────────────────────────
  Future<Sale?> sell({
    required String cusId,
    required String sp,
    required String grade,
    required double kg,
    required double price,
    double paid = 0,
  }) async {
    // FIFO allocation
    double need = kg;
    double cogs = 0;
    final allocs = <SaleAlloc>[];

    for (var i = 0; i < state.batches.length; i++) {
      if (need <= 0) break;
      final b = state.batches[i];
      if (b.st != 'accepted' || b.sp != sp || b.grade != grade || b.rem <= 0) continue;
      final take = need < b.rem ? need : b.rem;
      state.batches[i] = b.copyWith(rem: b.rem - take);
      cogs += take * b.price;
      allocs.add(SaleAlloc(batchId: b.id, kg: take));
      need -= take;
    }

    if (need > 0) return null; // insufficient stock

    final no = state.seq.nextSal();
    final sale = Sale(
      no: no,
      cus: cusId,
      sp: sp,
      grade: grade,
      kg: kg,
      price: price,
      paid: paid,
      cogs: cogs,
      date: today(),
      at: nowLocal(),
      alloc: allocs,
    );
    state.sales.add(sale);
    state = BranchData.fromJson(state.toJson());
    _audit('$no: Sold ${kg.toStringAsFixed(0)} kg $sp to industry');
    await _save();
    return sale;
  }

  Future<void> receivePayment(String saleId, double amt) async {
    final idx = state.sales.indexWhere((s) => s.id == saleId);
    if (idx < 0) return;
    state.sales[idx] = state.sales[idx].copyWith(paid: state.sales[idx].paid + amt);
    state = BranchData.fromJson(state.toJson());
    _audit('Received payment of TZS ${amt.toStringAsFixed(0)} for invoice ${state.sales[idx].no}');
    await _save();
  }

  // ── Fuel ─────────────────────────────────────────────────────────────────────
  Future<FuelIssue> issueFuel({
    required String supId,
    required String boatId,
    required String boatReg,
    required String tankId,
    required String fuel,
    required double litres,
    required double price,
    required String arrangement,
    double paid = 0,
    String notes = '',
  }) async {
    // Decrement tank
    final tankIdx = state.fuelTanks.indexWhere((t) => t.id == tankId);
    if (tankIdx >= 0) {
      final tank = state.fuelTanks[tankIdx];
      state.fuelTanks[tankIdx] = tank.copyWith(current: (tank.current - litres).clamp(0, double.infinity));
    }

    final total = litres * price;
    final balance = total - paid;
    final no = 'FUEL-${(state.seq.fuel++).toString().padLeft(6, '0')}';

    final issue = FuelIssue(
      no: no,
      supId: supId,
      boatId: boatId,
      boatReg: boatReg,
      tankId: tankId,
      fuel: fuel,
      litres: litres,
      price: price,
      total: total,
      paid: paid,
      balance: balance,
      arrangement: arrangement,
      issuedBy: ref.read(sessionProvider)?.name ?? 'Landing Officer',
      notes: notes,
      date: today(),
      at: nowLocal(),
    );
    state.fuelIssues.insert(0, issue);
    state = BranchData.fromJson(state.toJson());
    _audit('${no}: Issued ${litres.toStringAsFixed(0)}L $fuel. TZS ${total.toStringAsFixed(0)} (Paid: ${paid.toStringAsFixed(0)}, Debt: ${balance.toStringAsFixed(0)})');
    await _save();
    return issue;
  }

  Future<void> payFuelDebt(String supId, double amt, String method, {String notes = ''}) async {
    state.fuelPayments.insert(
      0,
      FuelPayment(supId: supId, amt: amt, m: method, date: today(), notes: notes),
    );
    state = BranchData.fromJson(state.toJson());
    _audit('Fuel Debt Payment: Received TZS ${amt.toStringAsFixed(0)} ($method) from fisherman');
    await _save();
  }

  // ── Expenses ─────────────────────────────────────────────────────────────────
  Future<void> addExpense(Expense exp) async {
    state.exps.add(exp);
    state = BranchData.fromJson(state.toJson());
    _audit('Logged operating expense: ${exp.cat} (TZS ${exp.amt.toStringAsFixed(0)})');
    await _save();
  }

  // ── Compliance ───────────────────────────────────────────────────────────────
  Future<void> addPermit(CompliancePermit permit) async {
    state.comp.add(permit);
    state = BranchData.fromJson(state.toJson());
    _audit('Added compliance permit ${permit.type} (${permit.ref})');
    await _save();
  }

  // ── Customer ─────────────────────────────────────────────────────────────────
  Future<void> addCustomer(Customer cus) async {
    state.customers.add(cus);
    state = BranchData.fromJson(state.toJson());
    _audit('Added industry client ${cus.name} (${cus.code})');
    await _save();
  }

  // ── Maintenance ───────────────────────────────────────────────────────────
  Future<MaintenanceOrder> addWorkOrder({
    required String boatId,
    required String supId,
    required String title,
    required String fault,
    required String mechanic,
    required String arrangement,
    required List<PartUsed> parts,
    required double partsCost,
    required double laborCost,
    required double otherCost,
    String notes = '',
    String status = 'Reported',
  }) async {
    final no = state.seq.nextWo();
    final totalCost = partsCost + laborCost + otherCost;
    double recoverable = 0;
    if (arrangement == 'Company-assisted (Deduct from fish)' ||
        arrangement == 'Fisherman-paid (Credit)') {
      recoverable = totalCost;
    }

    // Deduct spare parts stock
    for (final item in parts) {
      final idx = state.spareParts.indexWhere((p) => p.id == item.partId);
      if (idx >= 0) {
        state.spareParts[idx].stock =
            (state.spareParts[idx].stock - item.qty).clamp(0, 99999);
      }
    }

    // Update boat status
    final boatIdx = state.boats.indexWhere((b) => b.id == boatId);
    if (boatIdx >= 0 && status != 'Completed') {
      state.boats[boatIdx].status = 'Under Maintenance';
    }

    final wo = MaintenanceOrder(
      no: no,
      boatId: boatId,
      supId: supId,
      title: title,
      fault: fault,
      mechanic: mechanic,
      status: status,
      arrangement: arrangement,
      parts: parts,
      partsCost: partsCost,
      laborCost: laborCost,
      otherCost: otherCost,
      totalCost: totalCost,
      recoverable: recoverable,
      date: today(),
      notes: notes,
    );

    state.maintenanceOrders.insert(0, wo);
    state = BranchData.fromJson(state.toJson());
    _audit('$no: Work order created for boat $boatId — $title (TZS ${totalCost.toStringAsFixed(0)})');
    await _save();
    return wo;
  }

  Future<void> updateWorkOrderStatus(String woId, String newStatus) async {
    final idx = state.maintenanceOrders.indexWhere((w) => w.id == woId);
    if (idx < 0) return;
    final wo = state.maintenanceOrders[idx];
    state.maintenanceOrders[idx] = MaintenanceOrder(
      id: wo.id,
      no: wo.no,
      boatId: wo.boatId,
      supId: wo.supId,
      title: wo.title,
      fault: wo.fault,
      mechanic: wo.mechanic,
      status: newStatus,
      arrangement: wo.arrangement,
      parts: wo.parts,
      partsCost: wo.partsCost,
      laborCost: wo.laborCost,
      otherCost: wo.otherCost,
      totalCost: wo.totalCost,
      recoverable: wo.recoverable,
      recovered: wo.recovered,
      date: wo.date,
      notes: wo.notes,
    );
    // If completed, set boat back to operational
    if (newStatus == 'Completed') {
      final boatIdx = state.boats.indexWhere((b) => b.id == wo.boatId);
      if (boatIdx >= 0) {
        state.boats[boatIdx].status = 'Operational';
        state.boats[boatIdx].lastService = today();
      }
    }
    state = BranchData.fromJson(state.toJson());
    _audit('${wo.no}: Status updated to $newStatus');
    await _save();
  }

  Future<void> addSparePart(SparePart part) async {
    final existing = state.spareParts.indexWhere((p) => p.partNo == part.partNo);
    if (existing >= 0) {
      state.spareParts[existing].stock += part.stock;
    } else {
      state.spareParts.add(part);
    }
    state = BranchData.fromJson(state.toJson());
    _audit('Spare part added/restocked: ${part.name} (${part.partNo})');
    await _save();
  }

  Future<void> addBoat(Boat boat) async {
    state.boats.add(boat);
    state = BranchData.fromJson(state.toJson());
    _audit('Boat registered: ${boat.name} (${boat.regNo})');
    await _save();
  }

  Future<void> updateBoatStatus(String boatId, String status) async {
    final idx = state.boats.indexWhere((b) => b.id == boatId);
    if (idx >= 0) {
      state.boats[idx].status = status;
      state = BranchData.fromJson(state.toJson());
      _audit('Boat ${state.boats[idx].name} status → $status');
      await _save();
    }
  }

  // ── Transport ─────────────────────────────────────────────────────────────
  Future<void> addTrip({
    required String type,
    required String mode,
    required String from,
    required String to,
    required double cost,
    String veh = '',
    String temp = '1.5°C',
    String method = 'CRDB / NMB Bank',
    String ref = '',
  }) async {
    final trip = Trip(
      type: type,
      mode: mode,
      from: from,
      to: to,
      cost: cost,
      date: today(),
      ref: ref,
      veh: veh,
      temp: temp,
    );
    // store method on trip — add it directly to the model
    state.trips.insert(0, trip);
    state = BranchData.fromJson(state.toJson());
    _audit('Recorded transport run: $mode $from → $to (TZS ${cost.toStringAsFixed(0)})');
    await _save();
  }

  Future<void> dispatchSale({
    required String saleId,
    required String veh,
    required String drv,
    required String status,
    String temp = '1.8°C',
  }) async {
    final idx = state.sales.indexWhere((s) => s.id == saleId);
    if (idx < 0) return;
    final sale = state.sales[idx];
    state.sales[idx] = sale.copyWith(
      dis: SaleDispatch(st: status, veh: veh, drv: drv, temp: temp),
    );
    state = BranchData.fromJson(state.toJson());
    _audit('${sale.no} vehicle assigned: $veh, Driver: $drv ($status)');
    await _save();
  }
}

final branchDataProvider =
    NotifierProvider<BranchDataNotifier, BranchData>(BranchDataNotifier.new);

// ─── Computed / Derived Providers ────────────────────────────────────────────

/// Total kg purchased (accepted batches)
final totalPurchasedKgProvider = Provider<double>((ref) {
  final data = ref.watch(branchDataProvider);
  return data.batches.fold(0.0, (sum, b) => sum + b.kg);
});

/// Total kg in stock (accepted with remaining)
final stockKgProvider = Provider<double>((ref) {
  final data = ref.watch(branchDataProvider);
  return data.batches
      .where((b) => b.st == 'accepted' && b.rem > 0)
      .fold(0.0, (sum, b) => sum + b.rem);
});

/// Total kg sold
final totalSoldKgProvider = Provider<double>((ref) {
  final data = ref.watch(branchDataProvider);
  return data.sales.fold(0.0, (sum, s) => sum + s.kg);
});

/// Gross profit
final grossProfitProvider = Provider<double>((ref) {
  final data = ref.watch(branchDataProvider);
  final revenue = data.sales.fold(0.0, (sum, s) => sum + s.total);
  final cogs = data.sales.fold(0.0, (sum, s) => sum + s.cogs);
  return revenue - cogs;
});

/// Total revenue
final totalRevenueProvider = Provider<double>((ref) {
  final data = ref.watch(branchDataProvider);
  return data.sales.fold(0.0, (sum, s) => sum + s.total);
});

/// Pending batches count (for quality badge)
final pendingBatchesCountProvider = Provider<int>((ref) {
  final data = ref.watch(branchDataProvider);
  return data.batches.where((b) => b.st == 'pending').length;
});

/// Expiring permits count
final expiringPermitsCountProvider = Provider<int>((ref) {
  final data = ref.watch(branchDataProvider);
  return data.comp
      .where((c) => c.computedStatus == 'Expiring Soon' || c.computedStatus == 'Expired')
      .length;
});

/// Supplier balance (owed to supplier)
double supplierBalance(BranchData data, String supId) {
  final bought = data.batches
      .where((b) => b.sup == supId)
      .fold(0.0, (sum, b) => sum + b.total);
  final paid = data.pays
      .where((p) => p.sup == supId)
      .fold(0.0, (sum, p) => sum + p.amt);
  return bought - paid;
}

/// Supplier fuel debt
double supplierFuelDebt(BranchData data, String supId) {
  final debit = data.fuelIssues
      .where((f) => f.supId == supId)
      .fold(0.0, (sum, f) => sum + f.total);
  final directPaid = data.fuelIssues
      .where((f) => f.supId == supId)
      .fold(0.0, (sum, f) => sum + f.paid);
  final extraPaid = data.fuelPayments
      .where((p) => p.supId == supId)
      .fold(0.0, (sum, p) => sum + p.amt);
  final settled = data.settlements
      .where((s) => s.supId == supId)
      .fold(0.0, (sum, s) => sum + s.fuelDeducted);
  return (debit - directPaid - extraPaid - settled).clamp(0, double.infinity);
}

/// Available stock by species+grade
Map<String, double> computeStock(BranchData data) {
  final m = <String, double>{};
  for (final b in data.batches.where((b) => b.st == 'accepted' && b.rem > 0)) {
    final key = '${b.sp}|${b.grade}';
    m[key] = (m[key] ?? 0) + b.rem;
  }
  return m;
}

/// Connectivity provider (simple offline flag)
final isOfflineProvider = StateProvider<bool>((ref) => false);


