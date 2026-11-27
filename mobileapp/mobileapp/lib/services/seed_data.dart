import '../models/models.dart';

/// Generates demo data for the app — mirrors the React app's mkBranch()
BranchData seedBranchData({String site = 'Mwanza (Kirumba Mwaloni)'}) {
  final d = BranchData(
    seq: Sequences(pur: 126, sal: 85, fuel: 104, wo: 126, set: 41),
    wh: [
      'Main Cold Room (0°C to 2°C)',
      'Landing Holding Chiller',
      'Blast Freezer (-18°C)',
    ],
  );

  // Suppliers
  d.suppliers.addAll([
    Supplier(
      id: 's0',
      no: 'SUP-00304',
      name: 'Mzee Juma',
      phone: '0754 289 110',
      site: site,
      cat: 'Individual Fisherman',
      boat: 'MV Furaha',
      boatId: 'boat0',
      boatReg: 'TZN-304',
      nida: '19740612-44102-00015',
      creditLimit: 2000000,
      status: 'Active',
      totalSupplied: 4200,
    ),
    Supplier(
      id: 's1',
      no: 'SUP-00108',
      name: 'Katonga Beach Fishers Group',
      phone: '0768 991 422',
      site: 'Kigoma (Katonga BMU)',
      cat: 'BMU Fishing Group',
      boat: 'Kigoma Star 01',
      boatId: 'boat1',
      boatReg: 'TZN-108',
      creditLimit: 3500000,
      status: 'Active',
      totalSupplied: 8900,
    ),
    Supplier(
      id: 's2',
      no: 'SUP-00205',
      name: 'Neema Paul & Sons',
      phone: '0713 445 678',
      site: 'Musoma (Mwigobero)',
      cat: 'Dealer / Middleman',
      boat: 'MV Victoria Queen',
      boatId: 'boat2',
      boatReg: 'TZN-205',
      creditLimit: 5000000,
      status: 'Active',
      totalSupplied: 6150,
    ),
    Supplier(
      id: 's3',
      no: 'SUP-00412',
      name: 'Asha Mussa',
      phone: '0782 334 112',
      site: 'Kigoma (Katonga BMU)',
      cat: 'Individual Fisherman',
      boat: 'Ziwa Express',
      boatId: 'boat3',
      boatReg: 'TZN-412',
      creditLimit: 1500000,
      status: 'Active',
      totalSupplied: 3200,
    ),
  ]);

  // Boats
  d.boats.addAll([
    Boat(
      id: 'boat0',
      regNo: 'TZN-304',
      name: 'MV Furaha',
      ownerType: 'Fisherman-owned',
      ownerId: 's0',
      captain: 'Mzee Juma',
      engine: 'Yamaha Outboard 40HP 2-Stroke',
      boatType: 'Planked Wooden Mashua (10m)',
      status: 'Operational',
      engineHours: 340,
      lastService: daysAgoStr(14),
      crewMembers: [
        CrewMember(name: 'Hamisi Juma', role: 'First Mate', phone: '0754 112 301', nida: '19940212-33101-001'),
        CrewMember(name: 'Bakari Ally', role: 'Engine Operator', phone: '0768 440 291', nida: '19910518-33101-002'),
      ],
    ),
    Boat(
      id: 'boat1',
      regNo: 'TZN-108',
      name: 'Kigoma Star 01',
      ownerType: 'BMU-owned',
      ownerId: 's1',
      captain: 'Ally Katonga',
      engine: 'Yamaha 25HP Outboard',
      boatType: 'Fiberglass Fishing Canoe (8m)',
      status: 'Operational',
      engineHours: 510,
      lastService: daysAgoStr(20),
    ),
    Boat(
      id: 'boat2',
      regNo: 'TZN-205',
      name: 'MV Victoria Queen',
      ownerType: 'Company-owned',
      ownerId: 'company',
      captain: 'Capt. Omary',
      engine: 'Suzuki 60HP 4-Stroke',
      boatType: 'Heavy Wooden Transport Dhow (12m)',
      status: 'Under Maintenance',
      engineHours: 780,
      lastService: daysAgoStr(3),
    ),
  ]);

  // Fuel Tanks
  d.fuelTanks.addAll([
    FuelTank(
      id: 'tank_main_petrol',
      name: 'Main Tank (Petrol)',
      location: 'Main Landing Dock',
      fuel: 'Petrol',
      capacity: 5000,
      current: 3000,
      buyPrice: 2850,
      sellPrice: 3200,
    ),
    FuelTank(
      id: 'tank_main_diesel',
      name: 'Main Tank (Diesel)',
      location: 'Main Landing Dock',
      fuel: 'Diesel',
      capacity: 6000,
      current: 5000,
      buyPrice: 2950,
      sellPrice: 3350,
    ),
    FuelTank(
      id: 'tank_depot_petrol',
      name: 'Depot B (Petrol)',
      location: 'Kigoma Landing Depot',
      fuel: 'Petrol',
      capacity: 2000,
      current: 1500,
      buyPrice: 2850,
      sellPrice: 3200,
    ),
    FuelTank(
      id: 'tank_depot_diesel',
      name: 'Depot B (Diesel)',
      location: 'Kigoma Landing Depot',
      fuel: 'Diesel',
      capacity: 3000,
      current: 2200,
      buyPrice: 2950,
      sellPrice: 3350,
    ),
  ]);

  // Fuel Issues
  d.fuelIssues.addAll([
    FuelIssue(
      id: 'fi0',
      no: 'FUEL-001458',
      supId: 's0',
      boatId: 'boat0',
      boatReg: 'TZN-304',
      tankId: 'tank_main_petrol',
      fuel: 'Petrol',
      litres: 100,
      price: 3200,
      total: 320000,
      paid: 100000,
      balance: 220000,
      arrangement: 'Partial',
      issuedBy: 'Staff 01 (Hamisi)',
      notes: 'Morning fishing trip to Ukerewe deep waters',
      date: daysAgoStr(2),
      at: '${daysAgoStr(2)}T08:32',
    ),
    FuelIssue(
      id: 'fi1',
      no: 'FUEL-001457',
      supId: 's0',
      boatId: 'boat0',
      boatReg: 'TZN-304',
      tankId: 'tank_main_petrol',
      fuel: 'Petrol',
      litres: 75,
      price: 3200,
      total: 240000,
      paid: 0,
      balance: 240000,
      arrangement: 'By Fish Delivery',
      issuedBy: 'Staff 01 (Hamisi)',
      date: daysAgoStr(3),
      at: '${daysAgoStr(3)}T07:15',
    ),
    FuelIssue(
      id: 'fi2',
      no: 'FUEL-001456',
      supId: 's0',
      boatId: 'boat0',
      boatReg: 'TZN-304',
      tankId: 'tank_main_petrol',
      fuel: 'Petrol',
      litres: 50,
      price: 3200,
      total: 160000,
      paid: 0,
      balance: 160000,
      arrangement: 'By Fish Delivery',
      issuedBy: 'Staff 01 (Hamisi)',
      date: daysAgoStr(5),
      at: '${daysAgoStr(5)}T06:45',
    ),
    FuelIssue(
      id: 'fi3',
      no: 'FUEL-001455',
      supId: 's0',
      boatId: 'boat0',
      boatReg: 'TZN-304',
      tankId: 'tank_main_petrol',
      fuel: 'Petrol',
      litres: 100,
      price: 3200,
      total: 320000,
      paid: 0,
      balance: 320000,
      arrangement: 'End of Season',
      issuedBy: 'Staff 01 (Hamisi)',
      date: daysAgoStr(7),
      at: '${daysAgoStr(7)}T07:30',
    ),
    FuelIssue(
      id: 'fi4',
      no: 'FUEL-001454',
      supId: 's1',
      boatId: 'boat1',
      boatReg: 'TZN-108',
      tankId: 'tank_main_petrol',
      fuel: 'Petrol',
      litres: 60,
      price: 3200,
      total: 192000,
      paid: 0,
      balance: 192000,
      arrangement: 'By Fish Delivery',
      issuedBy: 'Staff 01 (Hamisi)',
      date: daysAgoStr(1),
      at: '${daysAgoStr(1)}T08:00',
    ),
  ]);

  // Fuel Purchases (bulk restock)
  d.fuelPurchases.addAll([
    FuelPurchase(id: 'fpur0', no: 'FP-00127', date: daysAgoStr(5), supId: 'fsp0',
        supName: 'Lake Oil Ltd', tankId: 'tank_main_petrol', fuel: 'Petrol',
        litres: 5000, costPerL: 2900, total: 14500000, docRef: 'DN-8891.pdf', status: 'Paid'),
    FuelPurchase(id: 'fpur1', no: 'FP-00126', date: daysAgoStr(7), supId: 'fsp1',
        supName: 'Oryx Energies Tanzania Ltd', tankId: 'tank_main_diesel', fuel: 'Diesel',
        litres: 8000, costPerL: 2950, total: 23600000, docRef: 'DN-ORYX-4412', status: 'Partial'),
    FuelPurchase(id: 'fpur2', no: 'FP-00125', date: daysAgoStr(10), supId: 'fsp0',
        supName: 'Lake Oil Ltd', tankId: 'tank_depot_petrol', fuel: 'Petrol',
        litres: 3000, costPerL: 2900, total: 8700000, docRef: 'DN-8840.pdf', status: 'Paid'),
  ]);

  // Fuel Payments
  d.fuelPayments.add(
    FuelPayment(
      id: 'fp0',
      supId: 's0',
      amt: 100000,
      m: 'Cash Payment',
      date: daysAgoStr(2),
      ref: 'CASH-0021',
      notes: 'Direct cash payment at pump counter',
    ),
  );

  // Customers
  d.customers.addAll([
    Customer(
      id: 'c0',
      code: 'IND-01',
      name: 'ABC Fish Processing Ltd',
      phone: '028 250 0110',
      location: 'Nyakato Industrial Area, Mwanza',
      limit: 40000000,
      contact: 'Mr. Patrick Temba',
    ),
    Customer(
      id: 'c1',
      code: 'IND-02',
      name: 'Victoria Perch Exporters Ltd',
      phone: '028 254 0220',
      location: 'Ilemela Port Road, Mwanza',
      limit: 35000000,
      contact: 'Grace Minja',
    ),
    Customer(
      id: 'c2',
      code: 'IND-03',
      name: 'TanFish Cold Chains Dar',
      phone: '022 212 9000',
      location: 'Kurasini Harbor, Dar es Salaam',
      limit: 25000000,
      contact: 'Ally Rashid',
    ),
  ]);

  // Sample batch + sales data
  final sampleItems = [
    {'sp': 'Nile Perch', 'grade': 'A', 'kg': 1400.0, 'price': 8200.0, 'sup': 's0', 'daysAgo': 14},
    {'sp': 'Nile Perch', 'grade': 'A', 'kg': 1200.0, 'price': 8000.0, 'sup': 's1', 'daysAgo': 11},
    {'sp': 'Tilapia', 'grade': 'A', 'kg': 850.0, 'price': 5400.0, 'sup': 's2', 'daysAgo': 8},
    {'sp': 'Dagaa (Sardines)', 'grade': 'Standard', 'kg': 950.0, 'price': 2600.0, 'sup': 's1', 'daysAgo': 6},
    {'sp': 'Nile Perch', 'grade': 'B', 'kg': 600.0, 'price': 6800.0, 'sup': 's3', 'daysAgo': 4},
    {'sp': 'Tilapia', 'grade': 'A', 'kg': 700.0, 'price': 5200.0, 'sup': 's0', 'daysAgo': 2},
    {'sp': 'Nile Perch', 'grade': 'A', 'kg': 550.0, 'price': 8100.0, 'sup': 's2', 'daysAgo': 0, 'pending': true},
  ];

  for (var i = 0; i < sampleItems.length; i++) {
    final item = sampleItems[i];
    final dAgo = item['daysAgo'] as int;
    final isPending = item['pending'] == true;
    final kg = item['kg'] as double;
    final price = item['price'] as double;
    final dt = daysAgoStr(dAgo);
    final sold = isPending ? 0.0 : (kg * 0.65).roundToDouble();
    final rem = isPending ? 0.0 : kg - sold;
    final batchId = 'b$i';
    final purNo = 'PUR-000${120 + i}';

    d.batches.add(FishBatch(
      id: batchId,
      no: 'BATCH-${(i + 1).toString().padLeft(3, '0')}',
      pur: purNo,
      sup: item['sup'] as String,
      sp: item['sp'] as String,
      grade: item['grade'] as String,
      kg: kg,
      rem: rem,
      price: price,
      date: dt,
      at: '${dt}T07:45',
      site: site,
      wh: d.wh[0],
      st: isPending ? 'pending' : 'accepted',
      rej: isPending ? 0 : 25,
      temp: 1.8 + (i * 0.1),
      tare: 12.5,
      crates: (kg / 40).round(),
    ));

    // Supplier payment
    final totalCost = kg * price;
    d.pays.add(SupplierPayment(
      id: 'p$i',
      sup: item['sup'] as String,
      amt: (totalCost * 0.8).roundToDouble(),
      m: i % 2 == 0 ? 'M-Pesa (Mobile Money)' : 'Cash Voucher',
      date: dt,
    ));

    // Sales + transport
    if (!isPending && sold > 0) {
      final salePrice = (price * 1.35).round().toDouble();
      final saleTotal = sold * salePrice;
      final salePaid = (saleTotal * 0.75).round().toDouble();
      final saleDate = daysAgoStr(dAgo > 2 ? dAgo - 2 : 0);

      d.sales.add(Sale(
        id: 'x$i',
        no: 'SAL-0000${80 + i}',
        cus: i % 2 == 0 ? 'c0' : 'c1',
        sp: item['sp'] as String,
        grade: item['grade'] as String,
        kg: sold,
        price: salePrice,
        paid: salePaid,
        cogs: sold * price,
        date: saleDate,
        at: '${saleDate}T14:30',
        alloc: [SaleAlloc(batchId: batchId, kg: sold)],
        dis: SaleDispatch(
          st: i == 0 ? 'Delivered' : 'In transit',
          veh: 'T ${230 + i} DKN (KYC 3-Ton Refrigerated)',
          drv: 'Juma Ramadhani',
        ),
      ));

      d.trips.add(Trip(
        id: 't$i',
        type: 'Industry Delivery',
        mode: 'KYC Refrigerated Truck',
        from: d.wh[0],
        to: 'Nyakato Processing Plant',
        cost: 180000,
        date: saleDate,
        ref: 'x$i',
        veh: 'T ${230 + i} DKN',
        temp: '1.5°C',
      ));
    }
  }

  // Expenses
  d.exps.addAll([
    Expense(id: 'e0', cat: 'Flake Ice & Insulated Crates', amt: 350000, date: daysAgoStr(3), desc: '50 bags food-grade crushed ice'),
    Expense(id: 'e1', cat: 'Cold Storage Electricity / Generator', amt: 480000, date: daysAgoStr(5), desc: 'Weekly power & diesel backup for Main Chiller'),
    Expense(id: 'e2', cat: 'Loading & Dock Handling Labor', amt: 120000, date: daysAgoStr(2), desc: 'Casual labor for boat unloading at Kirumba Mwaloni'),
  ]);

  // Compliance
  d.comp.addAll([
    CompliancePermit(id: 'k0', type: 'FiRCIS Fish Movement Permit', ref: 'FMP-MWZ-2026-089', who: 'Ministry of Livestock and Fisheries', exp: '2027-02-28', status: 'Valid'),
    CompliancePermit(id: 'k1', type: 'Commercial Fish Dealer Licence', ref: 'FDL-LAKE-8841', who: 'Fisheries Department Mwanza', exp: '2026-12-31', status: 'Expiring Soon'),
    CompliancePermit(id: 'k2', type: 'Sanitary & Cold Chain Inspection Cert', ref: 'SAN-CERT-4412', who: 'Tanzania Food & Drugs Authority (TMDA)', exp: '2027-06-15', status: 'Valid'),
  ]);

  // Spare Parts
  d.spareParts.addAll([
    SparePart(id: 'sp0', name: 'NGK Marine Spark Plug B7HS-10', partNo: 'NGK-B7HS', category: 'Ignition', stock: 42, minStock: 10, unitCost: 8500, sellPrice: 12000, unit: 'pcs'),
    SparePart(id: 'sp1', name: 'Yamalube 2-Stroke Oil (1L)', partNo: 'YAM-2T-1L', category: 'Lubricants', stock: 118, minStock: 25, unitCost: 18000, sellPrice: 24000, unit: 'Litres'),
    SparePart(id: 'sp2', name: 'Yamaha 40HP Aluminum Propeller', partNo: 'YAM-PROP-40', category: 'Propulsion', stock: 5, minStock: 2, unitCost: 190000, sellPrice: 245000, unit: 'pcs'),
    SparePart(id: 'sp3', name: 'Marine Battery 12V 75Ah', partNo: 'BAT-12V75', category: 'Electrical', stock: 7, minStock: 3, unitCost: 210000, sellPrice: 275000, unit: 'pcs'),
  ]);

  // Maintenance Orders
  d.maintenanceOrders.addAll([
    MaintenanceOrder(
      id: 'wo0',
      no: 'WO-000125',
      date: daysAgoStr(3),
      boatId: 'boat2',
      supId: 'company',
      title: 'Complete 250hr Service & Lower Unit Oil Change',
      fault: 'Scheduled engine maintenance and propeller shaft seal inspection',
      mechanic: 'Fundi Rashidi (Mwanza Marine Workshop)',
      status: 'In Progress',
      arrangement: 'Company-paid',
      parts: [
        PartUsed(partId: 'sp0', name: 'NGK Marine Spark Plug', qty: 3, cost: 36000),
      ],
      partsCost: 36000,
      laborCost: 80000,
      otherCost: 25000,
      totalCost: 141000,
      recoverable: 0,
    ),
    MaintenanceOrder(
      id: 'wo1',
      no: 'WO-000124',
      date: daysAgoStr(7),
      boatId: 'boat0',
      supId: 's0',
      title: 'Yamaha 40HP Propeller Replacement',
      fault: 'Propeller blades damaged by rocky reef near Ukerewe Island',
      mechanic: 'Fundi Rashidi',
      status: 'Completed',
      arrangement: 'Company-assisted (Deduct from fish)',
      parts: [
        PartUsed(partId: 'sp2', name: 'Yamaha 40HP Propeller', qty: 1, cost: 245000),
      ],
      partsCost: 245000,
      laborCost: 70000,
      otherCost: 0,
      totalCost: 315000,
      recoverable: 315000,
      recovered: 139000,
    ),
  ]);

  // Settlements
  d.settlements.addAll([
    Settlement(
      id: 'set0',
      no: 'SET-00041',
      date: daysAgoStr(1),
      at: '${daysAgoStr(1)}T11:45',
      purId: 'PUR-000120',
      supId: 's0',
      fishTotal: 2000000,
      fuelDeducted: 940000,
      maintDeducted: 0,
      netPayable: 1060000,
      method: 'M-Pesa (Mobile Money)',
      notes: 'Fuel credit debt TZS 940,000 deducted from Nile Perch 2,000kg catch payout',
    ),
  ]);

  // Audit
  d.audit.addAll([
    AuditEntry(id: 'a0', t: '04 Nov 2026, 08:32', u: 'Juma Said · Purchasing Officer', m: 'PUR-000125: Bought 350 kg Nile Perch (A) from Mzee Juma @ TZS 8,000'),
    AuditEntry(id: 'a1', t: '04 Nov 2026, 14:15', u: 'Neema Paul · Quality Inspector', m: 'BATCH-006 inspected: Accepted 325 kg, rejected 25 kg (Temp 2.1°C)'),
    AuditEntry(id: 'a2', t: '03 Nov 2026, 11:45', u: 'Hamisi Ally · Accountant', m: 'SET-00041: Net Settlement for Mzee Juma - Fish TZS 2,000,000, Fuel Off: TZS 940,000, Net Paid: TZS 1,060,000'),
  ]);

  return d;
}


