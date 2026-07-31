import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const SavrApp());
}

class SavrApp extends StatelessWidget {
  const SavrApp({super.key});

  @override
  Widget build(BuildContext context) {
    const ink = Color(0xFF0B1F1A);
    const forest = Color(0xFF145C45);
    const sand = Color(0xFFF3EDE3);
    const mint = Color(0xFFD8F3E7);

    return MaterialApp(
      title: 'Savr',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: forest,
          brightness: Brightness.light,
          surface: sand,
        ),
        scaffoldBackgroundColor: sand,
        textTheme: GoogleFonts.dmSansTextTheme().apply(bodyColor: ink, displayColor: ink),
        appBarTheme: AppBarTheme(
          backgroundColor: sand.withOpacity(0.9),
          foregroundColor: ink,
          elevation: 0,
          titleTextStyle: GoogleFonts.fraunces(fontSize: 28, color: ink),
        ),
        useMaterial3: true,
      ),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;

  static const pages = [
    _HomeTab(),
    _BasketTab(),
    _RidesTab(),
    _FuelTab(),
    _WalletTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: pages[index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.shopping_basket_outlined), label: 'Basket'),
          NavigationDestination(icon: Icon(Icons.local_taxi_outlined), label: 'Rides'),
          NavigationDestination(icon: Icon(Icons.local_gas_station_outlined), label: 'Fuel'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), label: 'Wallet'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Savr', style: GoogleFonts.fraunces(fontSize: 56, height: 1)),
          const SizedBox(height: 16),
          Text(
            'Before you spend, check once.',
            style: GoogleFonts.fraunces(fontSize: 28, height: 1.2),
          ),
          const SizedBox(height: 12),
          Text(
            'Nairobi Phase 1 — basket compare is the habit. Rides and fuel keep you coming back.',
            style: TextStyle(color: Colors.black.withOpacity(0.65)),
          ),
        ],
      ),
    );
  }
}

class _BasketTab extends StatelessWidget {
  const _BasketTab();

  @override
  Widget build(BuildContext context) {
    const rows = [
      ('Carrefour', 'KES 3,960', 'Recommended · +KES 45 cashback'),
      ('Quickmart', 'KES 4,050', '+KES 30 cashback'),
      ('Naivas', 'KES 4,280', '+KES 20 cashback'),
    ];
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Basket compare', style: GoogleFonts.fraunces(fontSize: 32)),
        const SizedBox(height: 8),
        const Text('Milk · Bread · Rice · Sugar · Soap · Oil'),
        const SizedBox(height: 20),
        ...rows.map(
          (r) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            color: r.$3.startsWith('Recommended')
                ? const Color(0xFFD8F3E7)
                : Colors.white.withOpacity(0.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.$1, style: GoogleFonts.fraunces(fontSize: 22)),
                Text(r.$2, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(r.$3, style: const TextStyle(fontSize: 13)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _RidesTab extends StatelessWidget {
  const _RidesTab();

  @override
  Widget build(BuildContext context) {
    const rows = [
      ('Bolt', 'KES 740', 'Save KES 150 · +KES 20'),
      ('Little', 'KES 810', '+KES 15'),
      ('Uber', 'KES 890', '+KES 10'),
    ];
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Airport', style: GoogleFonts.fraunces(fontSize: 32)),
        const SizedBox(height: 16),
        ...rows.map(
          (r) => ListTile(
            title: Text(r.$1, style: GoogleFonts.fraunces(fontSize: 22)),
            subtitle: Text(r.$3),
            trailing: Text(r.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    );
  }
}

class _FuelTab extends StatelessWidget {
  const _FuelTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Fuel nearby', style: GoogleFonts.fraunces(fontSize: 32)),
        const ListTile(title: Text('TotalEnergies'), trailing: Text('KES 179/L')),
        const ListTile(title: Text('Rubis'), trailing: Text('KES 180/L')),
        const ListTile(title: Text('Shell'), trailing: Text('KES 183/L')),
      ],
    );
  }
}

class _WalletTab extends StatelessWidget {
  const _WalletTab();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Wallet', style: GoogleFonts.fraunces(fontSize: 32)),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            color: const Color(0xFFD8F3E7),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Savings cashback'),
                Text('KES 80', style: GoogleFonts.fraunces(fontSize: 48)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
