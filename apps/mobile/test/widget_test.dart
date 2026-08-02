import 'package:flutter_test/flutter_test.dart';
import 'package:savr_mobile/main.dart';

void main() {
  testWidgets('Savr shell renders brand', (WidgetTester tester) async {
    await tester.pumpWidget(const SavrApp());
    expect(find.text('Savr'), findsOneWidget);
  });
}
