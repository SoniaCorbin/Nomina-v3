import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nomina_mobile/main.dart';

void main() {
  testWidgets('MyApp renders Nomina home page', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('Nomina'), findsWidgets);
    expect(find.text('Bienvenue sur Nomina'), findsOneWidget);
  });
}
